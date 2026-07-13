// ─── MobileApp — dev harness for all U1–U7 screens ───────────────────────────
// Wires every screen to stubData.ts callbacks.  Access via ?mobile=1 in the URL.
// The owner replaces stubData imports with real integrations at merge time.

import { useState } from "react";
import type { OrderView } from "./lib/types";
import {
  SAMPLE_ORDERS,
  STUB_CONNECTED_ADDRESS,
  onCreate,
  onConnect,
  onLockDeposit,
  onConfirmDelivery,
  onMarkShipped,
  onClaim,
  onGetTestFunds,
  onAddTrustline,
} from "./stubData";

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

// ─── Navigation tabs ───────────────────────────────────────────────────────────
type Tab = "home" | "connect" | "emergency";
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "home", label: "Orders", emoji: "📦" },
  { id: "connect", label: "Wallet", emoji: "💳" },
  { id: "emergency", label: "Offline", emoji: "📵" },
];

export default function MobileApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [screen, setScreen] = useState<Screen>({ id: "home" });
  const [connected, setConnected] = useState(false);
  const [orders] = useState<OrderView[]>(SAMPLE_ORDERS);

  // ─── Stub callbacks wired ──────────────────────────────────────────────────
  const handleConnect = async () => {
    await onConnect();
    setConnected(true);
  };

  const handleOpenOrder = (ref: string) => {
    const order = orders.find((o) => o.ref === ref);
    if (!order) return;
    setScreen({ id: "order-detail", order, role: "seller" });
  };

  // ─── Back navigation ───────────────────────────────────────────────────────
  const goHome = () => {
    setScreen({ id: "home" });
    setTab("home");
  };

  // ─── Active screen render ──────────────────────────────────────────────────
  const renderScreen = () => {
    if (screen.id === "sell") {
      return (
        <SellerCreateScreen
          onCreate={async (input) => {
            const result = await onCreate(input);
            return result;
          }}
        />
      );
    }

    if (screen.id === "buy-order") {
      return (
        <BuyerOrderScreen
          order={screen.order}
          connected={connected}
          onConnect={handleConnect}
          onLockDeposit={onLockDeposit}
        />
      );
    }

    if (screen.id === "order-detail") {
      return (
        <OrderDetailScreen
          order={screen.order}
          role={screen.role}
          onConfirmDelivery={onConfirmDelivery}
          onMarkShipped={onMarkShipped}
          onClaim={onClaim}
        />
      );
    }

    // Tab screens
    if (tab === "connect") {
      return (
        <ConnectScreen
          connected={connected}
          address={STUB_CONNECTED_ADDRESS}
          onConnect={handleConnect}
          onGetTestFunds={onGetTestFunds}
          onAddTrustline={onAddTrustline}
        />
      );
    }

    if (tab === "emergency") {
      return <EmergencyPreview />;
    }

    // Default: home
    return (
      <HomeScreen
        address={connected ? STUB_CONNECTED_ADDRESS : "GNOTCONNECTED000000000000000000000000000000000000000000"}
        orders={orders}
        onSell={() => setScreen({ id: "sell" })}
        onOpenOrder={handleOpenOrder}
      />
    );
  };

  const isSubScreen = screen.id !== "home" && screen.id !== "sell";

  return (
    <div className="mobile-shell flex flex-col">
      {/* Top bar with back button for sub-screens */}
      {(screen.id === "sell" ||
        screen.id === "buy-order" ||
        screen.id === "order-detail") && (
        <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
          <button
            id="mobile-back-btn"
            onClick={goHome}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            aria-label="Go back"
          >
            ‹
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

      {/* Screen content */}
      <main className="flex-1 overflow-y-auto">{renderScreen()}</main>

      {/* Bottom tab bar — only on top-level screens */}
      {!isSubScreen && screen.id !== "sell" && (
        <nav className="sticky bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-md justify-around px-4 py-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                onClick={() => {
                  setTab(t.id);
                  setScreen({ id: "home" });
                }}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
                  tab === t.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-lg" aria-hidden="true">
                  {t.emoji}
                </span>
                <span className="text-[10px] font-medium tracking-wide">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Dev badge */}
      <div className="pointer-events-none fixed right-3 top-3 z-50 rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-600">
        Stub
      </div>
    </div>
  );
}
