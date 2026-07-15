// ─── Transaction status component ────────────────────────────────────────────
// Renders nothing when idle; shows a spinner while pending; shows an explorer
// link on success; shows a red error message on failure.

import { Card, MicroLabel } from "./primitives";

export type TxState =
  | { kind: "idle" }
  | { kind: "pending"; note?: string }
  | { kind: "success"; hash: string }
  | { kind: "error"; message: string };

export function TxStatus({ state }: { state: TxState }) {
  if (state.kind === "idle") return null;

  return (
    <Card className="mt-3">
      {state.kind === "pending" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-3 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          {state.note ?? "Waiting for your wallet…"}
        </div>
      )}

      {state.kind === "success" && (
        <div className="text-sm">
          <MicroLabel>Confirmed on Stellar</MicroLabel>
          <a
            className="mt-1 block truncate font-mono text-xs text-emerald-600 hover:underline"
            href={`https://stellar.expert/explorer/testnet/tx/${state.hash}`}
            target="_blank"
            rel="noreferrer"
          >
            {state.hash}
          </a>
        </div>
      )}

      {state.kind === "error" && (
        <div className="text-sm text-rose-600">{state.message}</div>
      )}
    </Card>
  );
}
