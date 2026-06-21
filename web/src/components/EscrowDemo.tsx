import { useState } from "react";
import {
  IconBuyer,
  IconEscrow,
  IconSeller,
  IconCheck,
  IconRefund,
  IconArrowRight,
} from "./icons";

// A fully simulated walkthrough of the COD Lock escrow — no wallet, no real
// funds. Each control maps 1:1 to a real contract function so viewers see the
// product's actual flow: create_order -> confirm_delivery | refund_order.

type DemoState = "idle" | "funded" | "released" | "refunded";
const AMOUNT = "500 USDC";

const STATUS: Record<DemoState, { label: string; tone: string }> = {
  idle: { label: "Empty", tone: "neutral" },
  funded: { label: "Funded", tone: "info" },
  released: { label: "Released", tone: "success" },
  refunded: { label: "Refunded", tone: "warn" },
};

export function EscrowDemo() {
  const [state, setState] = useState<DemoState>("idle");
  const [log, setLog] = useState<{ fn: string; text: string }[]>([]);

  const push = (fn: string, text: string) => setLog((l) => [...l, { fn, text }]);

  const fund = () => {
    setState("funded");
    push("create_order", `Buyer locked ${AMOUNT} into escrow.`);
  };
  const confirm = () => {
    setState("released");
    push("confirm_delivery", `Delivery confirmed — escrow paid ${AMOUNT} to the seller.`);
  };
  const refund = () => {
    setState("refunded");
    push("refund_order", `Parcel returned — escrow refunded ${AMOUNT} to the buyer.`);
  };
  const reset = () => {
    setState("idle");
    setLog([]);
  };

  // Which node the "money" chip currently sits on, and its colour.
  const coinAt = state === "released" ? "seller" : state === "idle" ? "buyer" : state === "refunded" ? "buyer" : "escrow";
  const status = STATUS[state];

  return (
    <div className="demo-card" id="demo">
      <div className="demo-head">
        <div>
          <span className="kicker">Interactive walkthrough</span>
          <h2>See the escrow in action</h2>
        </div>
        <span className="demo-tag" title="Simulated — no wallet or real funds">
          Demo mode
        </span>
      </div>

      {/* Pipeline: Buyer -> Escrow -> Seller */}
      <div className={`pipeline state-${state}`}>
        <div className={`node ${coinAt === "buyer" && state !== "idle" ? "active" : ""}`}>
          <span className="node-icon buyer">
            <IconBuyer size={22} />
          </span>
          <span className="node-name">Buyer</span>
          <span className="node-sub">Joy's customer</span>
        </div>

        <div className="leg">
          <IconArrowRight size={18} />
        </div>

        <div className={`node escrow ${state === "funded" ? "active" : ""}`}>
          <span className="node-icon escrow">
            <IconEscrow size={22} />
          </span>
          <span className="node-name">Escrow</span>
          <span className={`status-pill ${status.tone}`}>{status.label}</span>
        </div>

        <div className="leg">
          <IconArrowRight size={18} />
        </div>

        <div className={`node ${state === "released" ? "active" : ""}`}>
          <span className="node-icon seller">
            <IconSeller size={22} />
          </span>
          <span className="node-name">Seller</span>
          <span className="node-sub">Joy</span>
        </div>

        {/* The moving money chip */}
        <div className={`coin at-${coinAt} ${state === "idle" ? "hidden" : ""} tone-${status.tone}`}>
          {AMOUNT}
        </div>
      </div>

      {/* Result / status line (announced to screen readers) */}
      <div className="result-wrap" aria-live="polite">
        {state === "idle" && (
          <p className="result neutral">Press “Buyer funds order” to start the flow.</p>
        )}
        {state === "funded" && (
          <p className="result info">
            <IconEscrow size={18} /> {AMOUNT} is held in escrow — neutral until delivery is settled.
          </p>
        )}
        {state === "released" && (
          <p className="result success">
            <IconCheck size={18} /> Delivered. The seller received {AMOUNT}.
          </p>
        )}
        {state === "refunded" && (
          <p className="result warn">
            <IconRefund size={18} /> Parcel returned. The buyer was refunded {AMOUNT}.
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="demo-controls">
        <button className="btn primary" onClick={fund} disabled={state !== "idle"}>
          1 · Buyer funds order
        </button>
        <button className="btn success" onClick={confirm} disabled={state !== "funded"}>
          <IconCheck size={18} /> Confirm delivery
        </button>
        <button className="btn warnbtn" onClick={refund} disabled={state !== "funded"}>
          <IconRefund size={18} /> Refund order
        </button>
        <button className="btn ghost" onClick={reset} disabled={state === "idle"}>
          Reset
        </button>
      </div>

      {/* Event log mirrors the real on-chain calls */}
      {log.length > 0 && (
        <ol className="demo-log">
          {log.map((entry, i) => (
            <li key={i}>
              <code>{entry.fn}()</code>
              <span>{entry.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
