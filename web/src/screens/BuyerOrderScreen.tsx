// ─── Buyer · Order page ──────────────────────────────────────────────────────
// What the buyer sees when they open a seller's ?order=<ref> link: the item, a
// clear refundable-deposit card, plain-language reassurance, and one action —
// connect wallet, then leave the deposit. Mobile-first (buyers are on phones).

import { useState } from "react";
import type { OrderView } from "../lib/types";
import { Card, MicroLabel, StatusPill, StickyActionBar } from "../ui/primitives";
import { TxStatus, type TxState } from "../ui/TxStatus";

export function BuyerOrderScreen({
  order,
  connected,
  onConnect,
  onLockDeposit,
}: {
  order: OrderView;
  connected: boolean;
  onConnect: () => Promise<void>;
  onLockDeposit: () => Promise<{ hash: string }>;
}) {
  const [txState, setTxState] = useState<TxState>({ kind: "idle" });
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await onConnect();
    } catch (e) {
      console.error("[BuyerOrderScreen] connect failed", e);
    } finally {
      setBusy(false);
    }
  };

  const handleLock = async () => {
    setBusy(true);
    setTxState({ kind: "pending", note: "Setting aside your deposit…" });
    try {
      const { hash } = await onLockDeposit();
      setTxState({ kind: "success", hash });
    } catch (e) {
      setTxState({ kind: "error", message: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  };

  const deadline = new Date(order.deadline);
  const expired = deadline < new Date();
  const payBy = deadline.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const shortSeller =
    order.sellerAddress.length > 12
      ? `${order.sellerAddress.slice(0, 6)}…${order.sellerAddress.slice(-4)}`
      : order.sellerAddress;

  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-32">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">Secure order</div>
      <h1 className="mt-2 font-heading text-2xl tracking-tight">{order.itemName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The seller asked you to leave a small refundable deposit to hold this order.
      </p>

      {/* Deposit hero */}
      <Card className="mt-6 text-center">
        <MicroLabel>Refundable deposit</MicroLabel>
        <div className="mt-1 font-heading text-4xl tracking-tight">{order.deposit}</div>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          You get this back the moment you confirm the parcel arrived. It just protects the seller
          from fake orders.
        </p>
      </Card>

      {/* Details */}
      <Card className="mt-3 space-y-3">
        <Row label="Pay before">
          <span className={`font-mono text-sm tabular-nums ${expired ? "text-rose-600" : ""}`}>
            {payBy}
            {expired && <span className="ml-2 text-[10px] uppercase tracking-wide">(expired)</span>}
          </span>
        </Row>
        <Row label="Seller">
          <span className="font-mono text-xs">{shortSeller}</span>
        </Row>
        <Row label="Status">
          <StatusPill status={order.status} />
        </Row>
      </Card>

      {/* What happens next — buyer's 3 steps */}
      <Card className="mt-3">
        <MicroLabel>What happens next</MicroLabel>
        <ol className="mt-3 space-y-2.5 text-sm">
          <BuyerStep n={1} text="Leave the deposit to hold your order." />
          <BuyerStep n={2} text="When it arrives, show the seller your code." />
          <BuyerStep n={3} text="Your deposit comes straight back to you." />
        </ol>
      </Card>

      <TxStatus state={txState} />

      <StickyActionBar>
        {!connected ? (
          <button
            id="buyer-connect-btn"
            onClick={handleConnect}
            disabled={busy}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Connecting…" : "Connect wallet to continue"}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              id="buyer-lock-deposit-btn"
              onClick={handleLock}
              disabled={busy || order.status !== "awaiting_deposit"}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy && txState.kind === "pending" ? "Processing…" : `Leave ${order.deposit} deposit`}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Fully refundable — you get it back when you confirm delivery.
            </p>
          </div>
        )}
      </StickyActionBar>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <MicroLabel>{label}</MicroLabel>
      {children}
    </div>
  );
}

function BuyerStep({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 font-mono text-[10px] text-primary">
        {n}
      </span>
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}
