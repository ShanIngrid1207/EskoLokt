// ─── DevHarness — full mobile screen router wired to real + stub callbacks ────
// Open with ?dev=1 to see this instead of the old desktop demo.
//
// Wiring philosophy:
//   • wallet.connect / wallet.signTransaction → real (StellarWalletsKit)
//   • escrow.createOrder / confirmDelivery / claimExpired → real (Soroban contract)
//   • onMarkShipped → stub until Mate 2 (Supabase) delivers
//   • orders list → stub until Mate 2 delivers
//
// Screens never import from this file; they only see their own props.

import { useState, useCallback } from "react";
import { wallet } from "./lib/wallet";
import {
  createOrder,
  claimExpired,
  usdcSac,
  server,
} from "./lib/escrow";
import {
  TransactionBuilder,
  Transaction,
  BASE_FEE,
  Networks,
  Asset,
  Operation,
} from "@stellar/stellar-sdk";
import { FRIENDBOT_URL, USDC_CODE, USDC_ISSUER } from "./lib/constants";
import { stub, sampleOrder } from "./stubData";
import type { OrderView, OrderStatus } from "./lib/types";
import { Package, CreditCard, WifiOff, ChevronLeft } from "lucide-react";

import { HomeScreen } from "./screens/HomeScreen";
import { SellerCreateScreen } from "./screens/SellerCreateScreen";
import { BuyerOrderScreen } from "./screens/BuyerOrderScreen";
import { OrderDetailScreen } from "./screens/OrderDetailScreen";
import { ConnectScreen } from "./screens/ConnectScreen";
import { EmergencyPreview } from "./screens/EmergencyPreview";

// ─── Screen routing ────────────────────────────────────────────────────────────
type Screen =
  | { id: "home" }
  | { id: "sell" }
  | { id: "buy-order"; order: OrderView }
  | { id: "order-detail"; order: OrderView; role: "buyer" | "seller" }
  | { id: "connect" }
  | { id: "emergency" };

type Tab = "home" | "connect" | "emergency";
const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "home",      label: "Orders",  Icon: Package    },
  { id: "connect",   label: "Wallet",  Icon: CreditCard },
  { id: "emergency", label: "Offline", Icon: WifiOff    },
];

export default function DevHarness() {
  const [tab, setTab] = useState<Tab>("home");
  const [screen, setScreen] = useState<Screen>({ id: "home" });
  const [address, setAddress] = useState<string | null>(wallet.getAddress());
  const connected = address !== null;

  // Seed order list from sampleOrder; in production Mate 2 provides real rows.
  const [orders] = useState<OrderView[]>([
    sampleOrder,
    { ...sampleOrder, ref: "EL-FUNDED", status: "funded" as OrderStatus },
    { ...sampleOrder, ref: "EL-SHIPPED", status: "shipped" as OrderStatus },
    { ...sampleOrder, ref: "EL-DONE", status: "delivered" as OrderStatus },
    { ...sampleOrder, ref: "EL-NOSHOW", status: "no_show" as OrderStatus },
  ]);

  // ─── Wallet callbacks ──────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    const addr = await wallet.connect();
    setAddress(addr);
  }, []);

  const handleGetTestFunds = useCallback(async () => {
    if (!address) throw new Error("Connect your wallet first.");
    const resp = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
    if (!resp.ok) throw new Error("Friendbot request failed.");
  }, [address]);

  const handleAddTrustline = useCallback(async () => {
    if (!address) throw new Error("Connect your wallet first.");
    const account = await server.getAccount(address);
    const usdcAsset = new Asset(USDC_CODE, USDC_ISSUER);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.changeTrust({ asset: usdcAsset }))
      .setTimeout(180)
      .build();
    const signed = await wallet.signTransaction(tx.toXDR());
    // Re-hydrate and submit the signed transaction.
    await server.sendTransaction(new Transaction(signed, Networks.TESTNET));
    void usdcSac; // keep import live
  }, [address]);


  // ─── Seller callbacks ──────────────────────────────────────────────────────
  const handleCreate = useCallback(
    async (input: { itemName: string; deposit: string; deadlineMinutes: number }) => {
      if (!address) throw new Error("Connect your wallet first.");
      const deadlineUnix = Math.floor(Date.now() / 1000) + input.deadlineMinutes * 60;
      // For a real seller flow the seller IS the source account.
      // We use address as both buyer and seller here for testnet demo simplicity.
      // Mate 2 (Supabase) will supply the real counterparty addresses.
      const { orderId, hash } = await createOrder({
        buyer: address,
        seller: address,
        amountUsdc: input.deposit,
        deadlineUnix,
        sign: (xdr) => wallet.signTransaction(xdr),
      });
      const ref = `EL-${orderId}`;
      const deliveryCode = String(100000 + Math.floor(Math.random() * 900000));
      const shareUrl = `${location.origin}/?dev=1&order=${orderId}`;
      console.log("[DevHarness] createOrder → orderId:", orderId, "hash:", hash);
      return { ref, deliveryCode, shareUrl };
    },
    [address],
  );

  // ─── Buyer callbacks ───────────────────────────────────────────────────────
  const handleLockDeposit = useCallback(async () => {
    // In a real buyer flow, the buyer calls createOrder with their own address.
    // We stub this as it requires the seller's address from Mate 2's DB.
    await stub.onLockDeposit();
  }, []);

  // ─── Order callbacks ───────────────────────────────────────────────────────
  const handleConfirmDelivery = useCallback(
    async (_code: string) => {
      if (!address) throw new Error("Connect wallet first.");
      // In full integration, Mate 2 stores onchain_order_id from OrderRow.
      // Until then we delegate to stub (which will eventually pass the orderId here).
      await stub.onConfirmDelivery(_code);
    },
    [address],
  );

  const handleMarkShipped = useCallback(async () => {
    // Pure Supabase write — stubbed until Mate 2.
    await stub.onMarkShipped();
  }, []);

  const handleClaim = useCallback(
    async (orderId: string) => {
      if (!address) throw new Error("Connect wallet first.");
      // orderId should be the numeric ID from Mate 2's onchain_order_id.
      // Until integrated, this will fail gracefully if orderId is not numeric.
      const { hash } = await claimExpired({
        publicKey: address,
        orderId,
        sign: (xdr) => wallet.signTransaction(xdr),
      });
      console.log("[DevHarness] claimExpired → hash:", hash);
    },
    [address],
  );

  // ─── Navigation ───────────────────────────────────────────────────────────
  const goHome = () => {
    setScreen({ id: "home" });
    setTab("home");
  };

  const handleOpenOrder = (ref: string) => {
    const order = orders.find((o) => o.ref === ref);
    if (!order) return;
    setScreen({ id: "order-detail", order, role: "seller" });
  };

  // ─── Screen renderer ──────────────────────────────────────────────────────
  const renderScreen = () => {
    if (screen.id === "sell") {
      return <SellerCreateScreen onCreate={handleCreate} />;
    }

    if (screen.id === "buy-order") {
      return (
        <BuyerOrderScreen
          order={screen.order}
          connected={connected}
          onConnect={handleConnect}
          onLockDeposit={handleLockDeposit}
        />
      );
    }

    if (screen.id === "order-detail") {
      return (
        <OrderDetailScreen
          order={screen.order}
          role={screen.role}
          onConfirmDelivery={handleConfirmDelivery}
          onMarkShipped={handleMarkShipped}
          onClaim={() => {
            const s = screen as { id: "order-detail"; order: OrderView; role: string };
            // Strip prefix to get the numeric orderId; Mate 2 will pass real id.
            return handleClaim(s.order.ref.replace(/^EL-/, ""));
          }}
        />
      );
    }

    if (tab === "connect") {
      return (
        <ConnectScreen
          connected={connected}
          address={address ?? ""}
          onConnect={handleConnect}
          onGetTestFunds={handleGetTestFunds}
          onAddTrustline={handleAddTrustline}
        />
      );
    }

    if (tab === "emergency") {
      return <EmergencyPreview />;
    }

    // Default: home
    return (
      <HomeScreen
        address={address ?? "GNOTCONNECTED000000000000000000000000000000000000000000"}
        orders={orders}
        onSell={() => setScreen({ id: "sell" })}
        onOpenOrder={handleOpenOrder}
      />
    );
  };

  const isSubScreen =
    screen.id === "sell" || screen.id === "buy-order" || screen.id === "order-detail";

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      {/* Back bar for sub-screens */}
      {isSubScreen && (
        <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
          <button
          id="mobile-back-btn"
          onClick={goHome}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          aria-label="Go back"
        >
          <ChevronLeft size={16} />
        </button>
          <span className="text-sm font-medium">
            {screen.id === "sell"
              ? "Create order"
              : screen.id === "buy-order"
              ? "Order"
              : `Order ${(screen as { id: "order-detail"; order: OrderView; role: string }).order.ref}`}
          </span>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{renderScreen()}</main>

      {/* Bottom tab bar — only on top-level screens */}
      {!isSubScreen && (
        <nav className="sticky bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-md justify-around px-4 py-2">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => {
                  setTab(id);
                  setScreen({ id: "home" });
                }}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
                  tab === id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Dev badge */}
      <div className="pointer-events-none fixed right-3 top-3 z-50 rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-600">
        Testnet
      </div>
    </div>
  );
}
