// ─── U6: Home Screen ─────────────────────────────────────────────────────────
// App landing for a connected user: Sell / Buy quick-actions + My orders list.

import { useState } from "react";
import type { OrderView } from "../lib/types";
import { Button, Card, MicroLabel, ScreenHeader, StatusPill } from "../ui/primitives";

export function HomeScreen({
  address,
  orders,
  onSell,
  onOpenOrder,
  onGuide,
}: {
  address: string;
  orders: OrderView[];
  onSell: () => void;
  onOpenOrder: (ref: string) => void;
  onGuide: () => void;
}) {
  const [buyLinkInput, setBuyLinkInput] = useState("");
  const [showBuyInput, setShowBuyInput] = useState(false);

  // Truncate a Stellar G-address: first 6 + … + last 4
  const truncate = (addr: string) =>
    addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;

  return (
    <div className="mx-auto max-w-md px-4 py-8 md:max-w-5xl md:px-8">
      {/* Header */}
      <header className="border-b border-border/60 pb-5">
        <h1 className="font-heading text-2xl">Your shop</h1>
        <div className="mt-1 text-xs text-muted-foreground">
          Signed in · <span className="font-mono">{truncate(address)}</span>
        </div>
      </header>

      {/* Two columns on desktop: actions on the left, orders on the right. */}
      <div className="md:mt-8 md:grid md:grid-cols-2 md:items-start md:gap-8">
        {/* Left column: actions */}
        <div>
      {/* Quick-action cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:mt-0">
        {/* Sell card */}
        <button
          id="home-sell-btn"
          data-tour="create"
          onClick={onSell}
          className="group rounded-xl border border-border/60 bg-background/40 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.03] active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
            <SellIcon />
          </div>
          <div className="mt-3 font-medium">Sell</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Create an order &amp; get protected
          </div>
        </button>

        {/* Buy card */}
        <button
          id="home-buy-btn"
          data-tour="buy"
          onClick={() => setShowBuyInput((v) => !v)}
          className="group rounded-xl border border-border/60 bg-background/40 p-4 text-left transition-all hover:border-border active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/[0.06] transition-colors group-hover:bg-foreground/10">
            <BuyIcon />
          </div>
          <div className="mt-3 font-medium">Buy</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Paste your order link
          </div>
        </button>
      </div>

      {/* How it works — step-by-step guide */}
      <button
        id="home-guide-btn"
        data-tour="howitworks"
        onClick={onGuide}
        className="mt-3 w-full rounded-xl border border-dashed border-border/70 bg-background/40 px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:border-border hover:text-foreground active:scale-[0.99]"
      >
        <span className="font-medium text-foreground">New here?</span> See how it works — 5 quick
        steps.
      </button>

      {/* Buy link input (shown when Buy card is clicked) */}
      {showBuyInput && (
        <Card className="mt-3 space-y-3">
          <MicroLabel>Paste order link or ref</MicroLabel>
          <input
            id="buy-link-input"
            value={buyLinkInput}
            onChange={(e) => setBuyLinkInput(e.target.value)}
            placeholder="paste your order link, or EL-AB12"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
          />
          <Button
            variant="outline"
            disabled={!buyLinkInput.trim()}
            onClick={() => {
              // Extract ref from a link or use the value directly
              const match = buyLinkInput.match(/EL-[A-Za-z0-9]+/i);
              const ref = (match ? match[0] : buyLinkInput.trim()).toUpperCase();
              onOpenOrder(ref);
              setBuyLinkInput("");
              setShowBuyInput(false);
            }}
          >
            Open order
          </Button>
        </Card>
      )}

        </div>
        {/* Right column: My orders */}
        <div className="mt-8 md:mt-0" data-tour="orders">
        <MicroLabel>My orders</MicroLabel>

        {orders.length === 0 ? (
          <Card className="mt-3 py-8 text-center text-sm text-muted-foreground">
            No orders yet — create one to get started.
          </Card>
        ) : (
          <ul className="mt-3 space-y-2">
            {orders.map((order) => (
              <li key={order.ref}>
                <button
                  id={`order-row-${order.ref}`}
                  onClick={() => onOpenOrder(order.ref)}
                  className="w-full rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-left transition-all hover:border-border hover:bg-background active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {order.itemName}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {order.ref}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusPill status={order.status} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function SellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  );
}

function BuyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-foreground/60"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
