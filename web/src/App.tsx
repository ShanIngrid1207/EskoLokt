// EskoLokt — the real app. Routes between the mobile screens and wires their
// callbacks to the wallet, the deployed deposit contract (escrow.ts), and the
// Supabase order book (orders.ts).
//
// Flow: a seller creates an order (Supabase record + share link/QR + delivery
// code). The buyer opens ?order=<ref>, connects a wallet, and locks a USDC
// deposit on-chain. On delivery the buyer confirms with the code (deposit
// returns to them); on a no-show past the deadline the seller claims it.
//
// The deposit is native XLM (Testnet), so the full loop — lock / confirm / claim —
// works out of the box: fund a wallet from friendbot and go. (USDC is a one-line
// swap in escrow.ts for later.)
import { useEffect, useState } from "react";
import { wallet } from "./lib/wallet";
import { createOrder, confirmDelivery, claimExpired } from "./lib/escrow";
import {
  createOrderRecord,
  getOrderByRef,
  attachBuyer,
  updateStatus,
  verifyDeliveryCode,
  renewOrderDeadline,
  listOrdersForAddress,
  subscribeToOrder,
} from "./lib/orders";
import { hashCode } from "./lib/crypto";
import { saveDeliveryCode } from "./lib/codeStore";
import { rowToView, genRef, genDeliveryCode } from "./lib/view";
import { FRIENDBOT_URL } from "./lib/constants";
import { EmergencyPreview } from "./screens/EmergencyPreview";
import { toast } from "./ui/toast";
import type { OrderView } from "./lib/types";
import { ConnectScreen } from "./screens/ConnectScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { SellerCreateScreen } from "./screens/SellerCreateScreen";
import { BuyerOrderScreen } from "./screens/BuyerOrderScreen";
import { OrderDetailScreen } from "./screens/OrderDetailScreen";
import { PracticeScreen } from "./screens/PracticeScreen";
import { TourOverlay } from "./screens/TourOverlay";
import { SellerDashboard } from "./screens/SellerDashboard";

type Route = "connect" | "home" | "sell" | "buyOrder" | "detail" | "practice" | "offline";

// Show the step-by-step guide the first time a seller signs in.
const SEEN_GUIDE_KEY = "eskolokt.seenGuide";
const hasSeenGuide = () =>
  typeof window !== "undefined" && window.localStorage.getItem(SEEN_GUIDE_KEY) === "1";

// Sample orders for the /?preview=dashboard design preview only.
const PREVIEW_ORDERS: OrderView[] = [
  { ref: "EL-7QF2", itemName: "Blue cotton tee", deposit: "0.50", sellerAddress: "", buyerAddress: null, deadline: new Date(Date.now() + 6 * 3600e3).toISOString(), createdIso: new Date(Date.now() - 2 * 3600e3).toISOString(), status: "funded" },
  { ref: "EL-3KM9", itemName: "Handmade earrings", deposit: "0.30", sellerAddress: "", buyerAddress: null, deadline: new Date(Date.now() - 2 * 3600e3).toISOString(), createdIso: new Date(Date.now() - 26 * 3600e3).toISOString(), status: "awaiting_deposit" },
  { ref: "EL-P8ZT", itemName: "Phone case (clear)", deposit: "0.20", sellerAddress: "", buyerAddress: null, deadline: new Date(Date.now() + 20 * 3600e3).toISOString(), createdIso: new Date(Date.now() - 50 * 3600e3).toISOString(), status: "shipped" },
  { ref: "EL-M4RW", itemName: "Scented candle set", deposit: "0.75", sellerAddress: "", buyerAddress: null, deadline: new Date(Date.now() - 40 * 3600e3).toISOString(), createdIso: new Date(Date.now() - 4 * 86400e3).toISOString(), status: "delivered" },
  { ref: "EL-V2BX", itemName: "Tote bag", deposit: "0.40", sellerAddress: "", buyerAddress: null, deadline: new Date(Date.now() - 60 * 3600e3).toISOString(), createdIso: new Date(Date.now() - 6 * 86400e3).toISOString(), status: "no_show" },
];

export default function App() {
  const [address, setAddress] = useState<string | null>(() => wallet.getAddress());
  const [route, setRoute] = useState<Route>("connect");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [myOrders, setMyOrders] = useState<OrderView[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  // Spotlight tour: auto-shown once for new sellers, replayable from "How it works".
  // ?tour=1 force-opens it (handy for demos / verification).
  const forceTour =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("tour") === "1";
  const [tourOpen, setTourOpen] = useState(forceTour);
  const finishTour = () => {
    setTourOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem(SEEN_GUIDE_KEY, "1");
  };

  // Offline awareness: the app (a PWA) keeps working; tell the user what still works.
  useEffect(() => {
    const goOffline = () => {
      setOnline(false);
      toast.info("You're offline — Esko Lokt still works. Payments send once you're back.");
    };
    const goOnline = () => {
      setOnline(true);
      toast.success("Back online");
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Initial route: a shared ?order=<ref> link means "buyer", otherwise home/connect.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("order");
    if (ref) {
      getOrderByRef(ref)
        .then((row) => {
          if (!row) {
            setLoadError(`Order ${ref} was not found.`);
            setRoute("home");
            return;
          }
          const v = rowToView(row);
          setOrder(v);
          setRole("buyer");
          setRoute(v.status === "awaiting_deposit" ? "buyOrder" : "detail");
        })
        .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)));
    } else {
      setRoute(wallet.getAddress() ? "home" : "connect");
    }
  }, []);

  // Live status for the open order (both phones stay in sync).
  useEffect(() => {
    if (!order?.ref) return;
    const unsub = subscribeToOrder(order.ref, (row) => setOrder(rowToView(row)));
    return unsub;
  }, [order?.ref]);

  async function loadMyOrders(a: string) {
    try {
      const rows = await listOrdersForAddress(a);
      setMyOrders(rows.map(rowToView));
    } catch (e) {
      console.error("[App] loadMyOrders failed", e);
    }
  }

  async function refreshOrder(ref: string) {
    const row = await getOrderByRef(ref);
    if (row) setOrder(rowToView(row));
  }

  // After signing in, land on home; first-timers get the spotlight tour on top.
  function enterApp() {
    setRoute("home");
    if (!hasSeenGuide()) setTourOpen(true);
  }

  // ── Wallet ──────────────────────────────────────────────────────────────────
  async function handleConnect() {
    const a = await wallet.connect();
    setAddress(a);
    await loadMyOrders(a);
    toast.success("Wallet connected");
    setRoute((r) => (r === "connect" ? "home" : r));
    if (!hasSeenGuide()) setTourOpen(true);
  }

  async function handleGetTestFunds() {
    const a = wallet.getAddress();
    if (!a) throw new Error("Connect a wallet first.");
    const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(a)}`);
    if (!res.ok) throw new Error("Friendbot: account may already be funded — check your balance.");
    toast.success("Free test money added");
  }

  // ── Seller ────────────────────────────────────────────────────────────────────
  async function handleCreate(input: {
    itemName: string;
    deposit: string;
    deadlineMinutes: number;
  }) {
    const a = wallet.getAddress();
    if (!a) throw new Error("Connect a wallet first.");
    const ref = genRef();
    const code = genDeliveryCode();
    const deadline = new Date(Date.now() + input.deadlineMinutes * 60_000).toISOString();
    const delivery_code_hash = await hashCode(code.trim().toUpperCase());
    await createOrderRecord({
      ref,
      item_name: input.itemName,
      deposit: input.deposit,
      seller_address: a,
      deadline,
      delivery_code_hash,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?order=${ref}`;
    saveDeliveryCode(ref, code); // so the seller can look it up again later
    await loadMyOrders(a);
    toast.success("Order created — now share the link with your buyer");
    return { ref, deliveryCode: code, shareUrl };
  }

  // ── Buyer ─────────────────────────────────────────────────────────────────────
  async function handleLockDeposit(): Promise<{ hash: string }> {
    const buyer = wallet.getAddress();
    if (!buyer) throw new Error("Connect a wallet first.");
    if (!order) throw new Error("Order not loaded.");
    // The seller's delivery-code hash is committed on-chain at deposit time, so the
    // code becomes enforceable by the contract (not just the database).
    const row = await getOrderByRef(order.ref);
    const codeHashHex = row?.delivery_code_hash;
    if (!codeHashHex) throw new Error("Order is missing its delivery-code commitment.");
    const deadlineUnix = Math.floor(new Date(order.deadline).getTime() / 1000);
    const tid = toast.loading("Setting aside your deposit…");
    try {
      const { orderId, hash } = await createOrder({
        buyer,
        seller: order.sellerAddress,
        amountXlm: order.deposit,
        deadlineUnix,
        codeHashHex,
        sign: wallet.signTransaction,
      });
      await attachBuyer(order.ref, buyer, Number(orderId));
      await refreshOrder(order.ref);
      toast.update(tid, "success", "Deposit set aside — you're protected");
      setRole("buyer");
      setRoute("detail");
      return { hash };
    } catch (e) {
      toast.update(tid, "error", e instanceof Error ? e.message : "Couldn't set aside the deposit");
      throw e;
    }
  }

  async function onChainOrderId(ref: string): Promise<string> {
    const row = await getOrderByRef(ref);
    const id = row?.onchain_order_id;
    if (id == null) throw new Error("This order has no on-chain id yet.");
    return String(id);
  }

  async function handleConfirmDelivery(code: string): Promise<{ hash: string }> {
    if (!order) throw new Error("Order not loaded.");
    const pub = wallet.getAddress();
    if (!pub) throw new Error("Connect a wallet first.");
    const normalized = code.trim().toUpperCase();
    const ok = await verifyDeliveryCode(order.ref, normalized);
    if (!ok) throw new Error("That delivery code doesn't match.");
    const orderId = await onChainOrderId(order.ref);
    // Pass the code itself — the contract hashes it and checks against the on-chain
    // commitment, so a wrong code is rejected by the chain, not just the database.
    const tid = toast.loading("Confirming delivery…");
    try {
      const { hash } = await confirmDelivery({
        publicKey: pub,
        orderId,
        code: normalized,
        sign: wallet.signTransaction,
      });
      await updateStatus(order.ref, "delivered");
      await refreshOrder(order.ref);
      toast.update(tid, "success", "Delivered — the deposit went back to your buyer");
      return { hash };
    } catch (e) {
      toast.update(tid, "error", e instanceof Error ? e.message : "Couldn't confirm delivery");
      throw e;
    }
  }

  async function handleMarkShipped(): Promise<void> {
    if (!order) throw new Error("Order not loaded.");
    await updateStatus(order.ref, "shipped");
    await refreshOrder(order.ref);
    toast.success("Marked as on the way");
  }

  // Give a not-yet-paid order a fresh 24-hour window so the same link keeps working.
  async function handleRenewOrder(): Promise<void> {
    if (!order) throw new Error("Order not loaded.");
    const newDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await renewOrderDeadline(order.ref, newDeadline);
    await refreshOrder(order.ref);
    toast.success("Added more time — re-send the link to your buyer");
  }

  async function handleClaim(): Promise<{ hash: string }> {
    if (!order) throw new Error("Order not loaded.");
    const pub = wallet.getAddress();
    if (!pub) throw new Error("Connect a wallet first.");
    const orderId = await onChainOrderId(order.ref);
    const tid = toast.loading("Collecting the deposit…");
    try {
      const { hash } = await claimExpired({ publicKey: pub, orderId, sign: wallet.signTransaction });
      await updateStatus(order.ref, "no_show");
      await refreshOrder(order.ref);
      toast.update(tid, "success", "Deposit collected — it's yours");
      return { hash };
    } catch (e) {
      toast.update(tid, "error", e instanceof Error ? e.message : "Couldn't collect the deposit");
      throw e;
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────────
  function goHome() {
    setOrder(null);
    setLoadError(null);
    setRoute("home");
    const a = wallet.getAddress();
    if (a) loadMyOrders(a);
  }

  async function openOrder(ref: string) {
    try {
      const row = await getOrderByRef(ref);
      if (!row) {
        setLoadError(`Order ${ref} was not found.`);
        return;
      }
      const v = rowToView(row);
      setOrder(v);
      setRole(v.sellerAddress === wallet.getAddress() ? "seller" : "buyer");
      setRoute("detail");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }

  const showBack = route === "sell" || route === "detail" || route === "offline";
  const wideRoute = false;

  // Design previews (no login): /?preview=dashboard | guide
  const preview =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("preview") : null;
  if (preview === "dashboard") {
    return (
      <>
        <TourOverlay open={tourOpen} onClose={() => setTourOpen(false)} />
        <SellerDashboard
          address="GA5YSD7QF2K3M9WZ8HJ4NPQR6YJU"
          orders={PREVIEW_ORDERS}
          onNewOrder={() => {}}
          onOpenOrder={() => {}}
          onGuide={() => setTourOpen(true)}
          onOffline={() => {}}
        />
      </>
    );
  }
  if (preview === "create") {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <SellerCreateScreen
          onCreate={async () => ({ ref: "EL-7QF2", deliveryCode: "1234", shareUrl: "https://esko/?order=EL-7QF2" })}
        />
      </div>
    );
  }
  if (preview === "offline") {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <EmergencyPreview />
      </div>
    );
  }
  if (preview === "buyer") {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <BuyerOrderScreen
          order={{ ...PREVIEW_ORDERS[0], status: "awaiting_deposit", sellerAddress: "GA5YSD7QF2K3M9WZ8HJ4NPQR6YJU" }}
          connected={false}
          onConnect={async () => {}}
          onLockDeposit={async () => ({ hash: "abc" })}
        />
      </div>
    );
  }

  // Connect route is a full-viewport split-card design (no framed shell).
  if (route === "connect") {
    return (
      <ConnectScreen
        connected={!!address}
        address={address ?? ""}
        onConnect={handleConnect}
        onGetTestFunds={handleGetTestFunds}
        onContinue={enterApp}
      />
    );
  }

  // Home route: desktop shows the seller dashboard; mobile keeps the simple flow.
  if (route === "home") {
    return (
      <>
        <TourOverlay open={tourOpen} onClose={finishTour} />
        <div className="hidden md:block">
          <SellerDashboard
            address={address ?? ""}
            orders={myOrders}
            onNewOrder={() => setRoute("sell")}
            onOpenOrder={openOrder}
            onGuide={() => setTourOpen(true)}
            onOffline={() => setRoute("offline")}
          />
        </div>
        <div className="min-h-svh bg-background text-foreground md:hidden">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur">
            <span className="font-heading text-sm tracking-tight">EskoLokt</span>
            <button
              onClick={() => setRoute("offline")}
              className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Pay by text
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" /> Test mode
            </span>
          </header>
          {loadError && (
            <div className="mx-auto max-w-md px-4 pt-4">
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{loadError}</p>
            </div>
          )}
          <HomeScreen
            address={address ?? ""}
            orders={myOrders}
            onSell={() => setRoute("sell")}
            onOpenOrder={openOrder}
            onGuide={() => setTourOpen(true)}
          />
        </div>
      </>
    );
  }

  return (
    // Mobile-first: on phones this is edge-to-edge (all desktop styling is md:*).
    // On desktop the app sits in a centered, framed surface on a branded backdrop
    // so it reads as a real app instead of a lonely phone-width strip.
    <div className="min-h-svh bg-background text-foreground md:flex md:min-h-svh md:items-center md:justify-center md:bg-gradient-to-b md:from-[hsl(152,32%,97%)] md:to-[hsl(220,18%,94%)]">
      <div
        className={`md:my-8 md:w-full md:overflow-hidden md:rounded-2xl md:border md:border-border/60 md:bg-background md:shadow-[0_24px_70px_-28px_rgba(16,24,40,0.28)] ${
          wideRoute ? "md:max-w-5xl" : "md:max-w-2xl"
        }`}
      >
        {/* Global app header: brand + network, with a contextual Back on inner screens. */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur md:static">
          <div className="flex items-center gap-3 px-4 py-2.5 md:px-6">
            {showBack ? (
              <button
                onClick={goHome}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            ) : (
              <button onClick={goHome} className="font-heading text-sm tracking-tight">
                EskoLokt
              </button>
            )}
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" /> Test mode
            </span>
          </div>
        </header>

        {loadError && (
          <div className="mx-auto max-w-md px-4 pt-4">
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{loadError}</p>
          </div>
        )}

      {route === "practice" && <PracticeScreen onBack={() => setRoute("home")} />}

      {route === "offline" && <EmergencyPreview />}

      {route === "sell" && <SellerCreateScreen onCreate={handleCreate} />}

      {route === "buyOrder" && order && (
        <BuyerOrderScreen
          order={order}
          connected={!!address}
          onConnect={handleConnect}
          onLockDeposit={handleLockDeposit}
        />
      )}

      {route === "detail" && order && (
        <OrderDetailScreen
          order={order}
          role={role}
          onConfirmDelivery={handleConfirmDelivery}
          onMarkShipped={handleMarkShipped}
          onClaim={handleClaim}
          onRenew={handleRenewOrder}
        />
      )}
      </div>
    </div>
  );
}
