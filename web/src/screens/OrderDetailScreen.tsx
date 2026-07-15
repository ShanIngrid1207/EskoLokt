// ─── U5: Order Detail Screen ─────────────────────────────────────────────────
// Shows full order details, a status timeline, tx hash links, and role-based
// sticky actions for buyer and seller.

import { useState } from "react";
import type { OrderView, OrderStatus } from "../lib/types";
import {
  Button,
  Card,
  MicroLabel,
  ScreenHeader,
  StickyActionBar,
  StatusPill,
} from "../ui/primitives";
import { TxStatus, type TxState } from "../ui/TxStatus";

// ─── Timeline definition ─────────────────────────────────────────────────────
type TimelineStep = {
  id: OrderStatus | "created";
  label: string;
};

const TIMELINE: TimelineStep[] = [
  { id: "created", label: "Order made" },
  { id: "awaiting_deposit", label: "Waiting for deposit" },
  { id: "funded", label: "Paid & protected" },
  { id: "shipped", label: "On the way" },
  { id: "delivered", label: "Delivered" },
];

const STATUS_ORDER: (OrderStatus | "created")[] = [
  "created",
  "awaiting_deposit",
  "funded",
  "shipped",
  "delivered",
  "no_show",
];

function currentStepIndex(status: OrderStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function OrderDetailScreen({
  order,
  role,
  onConfirmDelivery,
  onMarkShipped,
  onClaim,
  onRenew,
}: {
  order: OrderView;
  role: "buyer" | "seller";
  onConfirmDelivery: (code: string) => Promise<{ hash: string }>;
  onMarkShipped: () => Promise<void>;
  onClaim: () => Promise<{ hash: string }>;
  onRenew: () => Promise<void>;
}) {
  const [deliveryCode, setDeliveryCode] = useState("");
  const [txState, setTxState] = useState<TxState>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const deadlinePassed = new Date(order.deadline) < new Date();
  const shareUrl = `${window.location.origin}${window.location.pathname}?order=${order.ref}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleRenew = async () => {
    setBusy(true);
    setTxState({ kind: "idle" });
    try {
      await onRenew();
    } catch (e) {
      setTxState({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not renew.",
      });
    } finally {
      setBusy(false);
    }
  };
  const stepIndex = currentStepIndex(order.status);

  // ─── Action handlers ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (deliveryCode.length !== 6) return;
    setBusy(true);
    setTxState({ kind: "pending", note: "Confirming delivery…" });
    try {
      const { hash } = await onConfirmDelivery(deliveryCode);
      setTxState({ kind: "success", hash });
    } catch (e) {
      setTxState({
        kind: "error",
        message: e instanceof Error ? e.message : "Confirmation failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleMarkShipped = async () => {
    setBusy(true);
    setTxState({ kind: "pending", note: "Marking as shipped…" });
    try {
      await onMarkShipped();
      setTxState({ kind: "idle" });
    } catch (e) {
      setTxState({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to mark shipped.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    setBusy(true);
    setTxState({ kind: "pending", note: "Collecting the deposit…" });
    try {
      const { hash } = await onClaim();
      setTxState({ kind: "success", hash });
    } catch (e) {
      setTxState({
        kind: "error",
        message: e instanceof Error ? e.message : "Claim failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-5">
        <div>
          <MicroLabel>Order {order.ref}</MicroLabel>
          <h1 className="mt-1 font-heading text-2xl">{order.itemName}</h1>
        </div>
        <div className="mt-2 shrink-0">
          <StatusPill status={order.status} />
        </div>
      </div>

      {/* Status timeline */}
      <Card className="mt-6">
        <MicroLabel>Status timeline</MicroLabel>
        <ol className="mt-3 space-y-0">
          {(order.status === "no_show"
            ? [
                ...TIMELINE.slice(0, 4),
                { id: "no_show" as const, label: "Buyer didn't show" },
              ]
            : TIMELINE
          ).map((step, i) => {
            const done = i < stepIndex;
            const active = step.id === order.status || (step.id === "created" && stepIndex === 0);
            return (
              <li key={step.id} className="flex items-start gap-3">
                {/* Line connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`size-2.5 rounded-full border-2 ${
                      active
                        ? "border-primary bg-primary"
                        : done
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-border bg-background"
                    }`}
                  />
                  {i < (order.status === "no_show" ? 4 : TIMELINE.length - 1) && (
                    <div
                      className={`w-px flex-1 ${
                        done ? "bg-emerald-500/50" : "bg-border/60"
                      }`}
                      style={{ minHeight: 20 }}
                    />
                  )}
                </div>
                <span
                  className={`pb-4 pt-0.5 text-sm ${
                    active
                      ? "font-medium text-foreground"
                      : done
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* TX hashes */}
      {order.txHashes && order.txHashes.length > 0 && (
        <Card className="mt-3 space-y-2">
          <MicroLabel>Receipts</MicroLabel>
          {order.txHashes.map((tx) => (
            <div key={tx.hash} className="mt-1">
              <span className="text-xs text-muted-foreground">{tx.label}</span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 block truncate font-mono text-xs text-emerald-600 hover:underline"
              >
                {tx.hash}
              </a>
            </div>
          ))}
        </Card>
      )}

      <TxStatus state={txState} />

      {/* ─── Role-based sticky actions ─────────────────────────────────────── */}
      <StickyActionBar>
        {/* Buyer: confirm delivery when funded or shipped */}
        {role === "buyer" &&
          (order.status === "funded" || order.status === "shipped") && (
            <div className="space-y-2">
              <label className="block">
                <MicroLabel>Delivery code (6 digits)</MicroLabel>
                <input
                  id="delivery-code-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={deliveryCode}
                  onChange={(e) =>
                    setDeliveryCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-center font-mono text-xl tabular-nums tracking-[0.3em] outline-none focus:border-ring transition-colors"
                />
              </label>
              <Button
                id="buyer-confirm-delivery-btn"
                onClick={handleConfirm}
                disabled={busy || deliveryCode.length !== 6}
              >
                {busy ? "Confirming…" : "Confirm delivery"}
              </Button>
            </div>
          )}

        {/* Seller: order not paid yet — re-share the same link, renew if it expired */}
        {role === "seller" && order.status === "awaiting_deposit" && (
          <div className="space-y-2">
            {deadlinePassed && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-700">
                The time ran out before your buyer paid. Give them more time and re-send this same
                link — no need to make a new order.
              </p>
            )}
            <Button id="seller-copy-link-btn" variant="outline" onClick={copyLink}>
              {copied ? "Link copied ✓" : "Copy the link to send again"}
            </Button>
            <Button id="seller-renew-btn" onClick={handleRenew} disabled={busy}>
              {busy ? "Giving more time…" : "Give the buyer more time"}
            </Button>
          </div>
        )}

        {/* Seller: mark shipped when funded */}
        {role === "seller" && order.status === "funded" && (
          <Button
            id="seller-mark-shipped-btn"
            onClick={handleMarkShipped}
            disabled={busy}
          >
            {busy ? "Updating…" : "Mark shipped"}
          </Button>
        )}

        {/* Seller: claim deposit when shipped + deadline passed */}
        {role === "seller" && order.status === "shipped" && deadlinePassed && (
          <div className="space-y-2">
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-center text-sm text-rose-600">
              Your buyer didn't show up — you can collect the deposit.
            </p>
            <Button
              id="seller-claim-btn"
              variant="outline"
              onClick={handleClaim}
              disabled={busy}
              className="border-rose-500/50 text-rose-600 hover:bg-rose-500/5"
            >
              {busy ? "Collecting…" : "Collect the deposit"}
            </Button>
          </div>
        )}

        {/* Closed state */}
        {(order.status === "delivered" || order.status === "no_show") && (
          <div className="py-1 text-center text-sm text-muted-foreground">
            {order.status === "delivered"
              ? "✓ Delivered — the deposit went back to your customer."
              : "✗ Closed — you kept the deposit to cover your costs."}
          </div>
        )}
      </StickyActionBar>
    </div>
  );
}
