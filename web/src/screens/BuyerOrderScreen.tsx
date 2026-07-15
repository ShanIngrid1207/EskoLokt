// ─── U4: Buyer · Order Screen ─────────────────────────────────────────────────
// Shows order details and lets the buyer connect their wallet then lock a deposit.
// Props-only — wire to stub.onConnect / stub.onLockDeposit in the dev harness.

import { useState } from "react";
import type { OrderView } from "../lib/types";
import {
  Button,
  Card,
  MicroLabel,
  ScreenHeader,
  StickyActionBar,
  StatTile,
  StatusPill,
} from "../ui/primitives";
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

  const handleLockDeposit = async () => {
    setBusy(true);
    setTxState({ kind: "pending", note: "Locking deposit on Stellar…" });
    try {
      const { hash } = await onLockDeposit();
      setTxState({ kind: "success", hash });
    } catch (e) {
      setTxState({
        kind: "error",
        message: e instanceof Error ? e.message : "Transaction failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Format deadline as a readable string
  const deadlineDate = new Date(order.deadline);
  const isExpired = deadlineDate < new Date();
  const deadlineStr = deadlineDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-28">
      <ScreenHeader
        crumb="Buyer · Order"
        title={order.itemName}
        subtitle={`Order ref: ${order.ref}`}
      />

      {/* Stat tiles row */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatTile label="Deposit" value={`${order.deposit} USDC`} />
        <StatTile label="Item" value={order.itemName} />
      </div>

      {/* Order meta */}
      <Card className="mt-3 space-y-3">
        <div>
          <MicroLabel>Seller</MicroLabel>
          <div className="mt-0.5 truncate font-mono text-xs">
            {order.sellerAddress}
          </div>
        </div>
        <div>
          <MicroLabel>Deadline</MicroLabel>
          <div
            className={`mt-0.5 font-mono text-sm tabular-nums ${
              isExpired ? "text-rose-600" : ""
            }`}
          >
            {deadlineStr}
            {isExpired && (
              <span className="ml-2 text-[10px] uppercase tracking-wide">
                (expired)
              </span>
            )}
          </div>
        </div>
        <div>
          <MicroLabel>Status</MicroLabel>
          <div className="mt-0.5">
            <StatusPill status={order.status} />
          </div>
        </div>
      </Card>

      <TxStatus state={txState} />

      <StickyActionBar>
        <div className="space-y-2">
          {!connected ? (
            <Button
              id="buyer-connect-btn"
              onClick={handleConnect}
              disabled={busy}
            >
              {busy ? "Connecting…" : "Connect wallet"}
            </Button>
          ) : (
            <>
              <Button
                id="buyer-lock-deposit-btn"
                onClick={handleLockDeposit}
                disabled={busy || order.status !== "awaiting_deposit"}
              >
                {busy && txState.kind === "pending"
                  ? "Processing…"
                  : "Lock deposit"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You'll get this deposit back when you confirm delivery.
              </p>
            </>
          )}
        </div>
      </StickyActionBar>
    </div>
  );
}
