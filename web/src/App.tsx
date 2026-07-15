// EskoLokt — the real app. Routes between the mobile screens and wires their
// callbacks to the wallet, the deployed deposit contract (escrow.ts), and the
// Supabase order book (orders.ts).
//
// Flow: a seller creates an order (Supabase record + share link/QR + delivery
// code). The buyer opens ?order=<ref>, connects a wallet, and locks a USDC
// deposit on-chain. On delivery the buyer confirms with the code (deposit
// returns to them); on a no-show past the deadline the seller claims it.
//
// NOTE: the on-chain steps (lock / confirm / claim) execute once the test USDC
// asset is configured (VITE_USDC_ISSUER). Until then they surface a clear error;
// everything else — navigation, order creation/sharing, status, wallet, funds —
// works today.
import { useEffect, useState } from "react";
import { wallet } from "./lib/wallet";
import { createOrder, confirmDelivery, claimExpired } from "./lib/escrow";
import {
  createOrderRecord,
  getOrderByRef,
  attachBuyer,
  updateStatus,
  verifyDeliveryCode,
  listOrdersForAddress,
  subscribeToOrder,
} from "./lib/orders";
import { hashCode } from "./lib/crypto";
import { rowToView, genRef, genDeliveryCode } from "./lib/view";
import { FRIENDBOT_URL, USDC_ISSUER } from "./lib/constants";
import type { OrderView } from "./lib/types";
import { ConnectScreen } from "./screens/ConnectScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { SellerCreateScreen } from "./screens/SellerCreateScreen";
import { BuyerOrderScreen } from "./screens/BuyerOrderScreen";
import { OrderDetailScreen } from "./screens/OrderDetailScreen";

type Route = "connect" | "home" | "sell" | "buyOrder" | "detail";

export default function App() {
  const [address, setAddress] = useState<string | null>(() => wallet.getAddress());
  const [route, setRoute] = useState<Route>("connect");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [myOrders, setMyOrders] = useState<OrderView[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // ── Wallet ──────────────────────────────────────────────────────────────────
  async function handleConnect() {
    const a = await wallet.connect();
    setAddress(a);
    await loadMyOrders(a);
    setRoute((r) => (r === "connect" ? "home" : r));
  }

  async function handleGetTestFunds() {
    const a = wallet.getAddress();
    if (!a) throw new Error("Connect a wallet first.");
    const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(a)}`);
    if (!res.ok) throw new Error("Friendbot: account may already be funded — check your balance.");
  }

  async function handleAddTrustline() {
    if (!USDC_ISSUER) {
      throw new Error("Test USDC isn't set up yet — it arrives with the token deploy.");
    }
    // TODO(O1): once USDC_ISSUER is configured, build a classic changeTrust op
    // for USDC:<issuer>, sign via wallet.signTransaction, submit to Horizon.
    throw new Error("USDC trustline flow pending token setup.");
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
    await loadMyOrders(a);
    return { ref, deliveryCode: code, shareUrl };
  }

  // ── Buyer ─────────────────────────────────────────────────────────────────────
  async function handleLockDeposit(): Promise<{ hash: string }> {
    const buyer = wallet.getAddress();
    if (!buyer) throw new Error("Connect a wallet first.");
    if (!order) throw new Error("Order not loaded.");
    const deadlineUnix = Math.floor(new Date(order.deadline).getTime() / 1000);
    const { orderId, hash } = await createOrder({
      buyer,
      seller: order.sellerAddress,
      amountUsdc: order.deposit,
      deadlineUnix,
      sign: wallet.signTransaction,
    });
    await attachBuyer(order.ref, buyer, Number(orderId));
    await refreshOrder(order.ref);
    setRole("buyer");
    setRoute("detail");
    return { hash };
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
    const ok = await verifyDeliveryCode(order.ref, code);
    if (!ok) throw new Error("That delivery code doesn't match.");
    const orderId = await onChainOrderId(order.ref);
    const { hash } = await confirmDelivery({ publicKey: pub, orderId, sign: wallet.signTransaction });
    await updateStatus(order.ref, "delivered");
    await refreshOrder(order.ref);
    return { hash };
  }

  async function handleMarkShipped(): Promise<void> {
    if (!order) throw new Error("Order not loaded.");
    await updateStatus(order.ref, "shipped");
    await refreshOrder(order.ref);
  }

  async function handleClaim(): Promise<{ hash: string }> {
    if (!order) throw new Error("Order not loaded.");
    const pub = wallet.getAddress();
    if (!pub) throw new Error("Connect a wallet first.");
    const orderId = await onChainOrderId(order.ref);
    const { hash } = await claimExpired({ publicKey: pub, orderId, sign: wallet.signTransaction });
    await updateStatus(order.ref, "no_show");
    await refreshOrder(order.ref);
    return { hash };
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

  const showBack = route === "sell" || route === "detail";

  return (
    <div className="min-h-svh bg-background text-foreground">
      {showBack && (
        <div className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center px-4 py-2.5">
            <button
              onClick={goHome}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <div className="mx-auto max-w-md px-4 pt-4">
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{loadError}</p>
        </div>
      )}

      {route === "connect" && (
        <ConnectScreen
          connected={!!address}
          address={address ?? ""}
          onConnect={handleConnect}
          onGetTestFunds={handleGetTestFunds}
          onAddTrustline={handleAddTrustline}
          onContinue={() => setRoute("home")}
        />
      )}

      {route === "home" && (
        <HomeScreen
          address={address ?? ""}
          orders={myOrders}
          onSell={() => setRoute("sell")}
          onOpenOrder={openOrder}
        />
      )}

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
        />
      )}
    </div>
  );
}
