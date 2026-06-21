import { useState } from "react";
import {
  IconBuyer,
  IconEscrow,
  IconSeller,
  IconCheck,
  IconRefund,
  IconArrowRight,
} from "./icons";

// A fully simulated walkthrough written in a seller's language — no wallet, no
// real money. It mirrors the real contract flow (create order -> confirm
// delivery | refund) but never says so to the user: they just create a sample
// order and watch the money stay safe until the parcel is delivered.

type DemoState = "idle" | "held" | "paid" | "refunded";

const STATUS: Record<DemoState, { label: string; tone: string }> = {
  idle: { label: "Empty", tone: "neutral" },
  held: { label: "Held safely", tone: "info" },
  paid: { label: "Paid out", tone: "success" },
  refunded: { label: "Refunded", tone: "warn" },
};

const peso = (n: number) => `₱${n.toLocaleString("en-US")}`;

export function EscrowDemo() {
  const [state, setState] = useState<DemoState>("idle");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("500");
  // The order details are locked in the moment the order is created, so later
  // steps keep showing the same name/amount even if the inputs were cleared.
  const [order, setOrder] = useState<{ name: string; amount: number } | null>(null);
  const [log, setLog] = useState<{ tag: string; text: string }[]>([]);

  const amountNum = Math.floor(Number(amount));
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;

  const push = (tag: string, text: string) => setLog((l) => [...l, { tag, text }]);

  const name = order?.name || "your customer";
  const money = order ? peso(order.amount) : "";

  const create = () => {
    if (!amountValid) return;
    const o = { name: customer.trim() || "your customer", amount: amountNum };
    setOrder(o);
    setState("held");
    push("Order created", `${o.name} paid ${peso(o.amount)} up front — it's now held safely.`);
  };
  const deliver = () => {
    setState("paid");
    push("Delivered", `Parcel delivered — ${money} was released to you.`);
  };
  const refund = () => {
    setState("refunded");
    push("Refunded", `Parcel came back — ${money} was returned to ${name}.`);
  };
  const reset = () => {
    setState("idle");
    setOrder(null);
    setLog([]);
  };

  // Where the "money" chip sits, and its colour.
  const coinAt = state === "paid" ? "seller" : state === "held" ? "escrow" : "buyer";
  const status = STATUS[state];

  return (
    <div className="demo-card" id="demo">
      <div className="demo-head">
        <div>
          <span className="kicker">Practice</span>
          <h2>Create a sample order</h2>
        </div>
        <span className="demo-tag" title="This is a practice run — no real money and no wallet">
          Practice mode
        </span>
      </div>

      <p className="demo-intro">
        Try it: enter a customer and amount, then create the order. Watch how the money stays locked
        and safe until the parcel is delivered — or comes back to your customer if it's returned.
      </p>

      {/* Order details — editable only before the order is created */}
      <div className="demo-form">
        <label>
          Customer name
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="e.g. Maria Santos"
            disabled={state !== "idle"}
            autoComplete="off"
          />
        </label>
        <label>
          Order amount (₱)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="500"
            inputMode="numeric"
            disabled={state !== "idle"}
          />
        </label>
      </div>

      {/* Pipeline: Customer -> Held safely -> You */}
      <div className={`pipeline state-${state}`}>
        <div className={`node ${state !== "idle" && coinAt === "buyer" ? "active" : ""}`}>
          <span className="node-icon buyer">
            <IconBuyer size={22} />
          </span>
          <span className="node-name">Your customer</span>
          <span className="node-sub">{order ? order.name : "—"}</span>
        </div>

        <div className="leg">
          <IconArrowRight size={18} />
        </div>

        <div className={`node escrow ${state === "held" ? "active" : ""}`}>
          <span className="node-icon escrow">
            <IconEscrow size={22} />
          </span>
          <span className="node-name">
            Held safely
            <span
              className="info-dot"
              tabIndex={0}
              role="note"
              title="The money waits in a neutral lock. Neither you nor your customer can spend it until delivery is settled — no bank or middleman holds it."
            >
              ?
            </span>
          </span>
          <span className={`status-pill ${status.tone}`}>{status.label}</span>
        </div>

        <div className="leg">
          <IconArrowRight size={18} />
        </div>

        <div className={`node ${state === "paid" ? "active" : ""}`}>
          <span className="node-icon seller">
            <IconSeller size={22} />
          </span>
          <span className="node-name">You</span>
          <span className="node-sub">the seller</span>
        </div>

        {/* The moving money chip */}
        <div className={`coin at-${coinAt} ${state === "idle" ? "hidden" : ""} tone-${status.tone}`}>
          {money}
        </div>
      </div>

      {/* Result / status line (announced to screen readers) */}
      <div className="result-wrap" aria-live="polite">
        {state === "idle" && (
          <p className="result neutral">Fill in the order above, then press “Create the order”.</p>
        )}
        {state === "held" && (
          <p className="result info">
            <IconEscrow size={18} /> {money} from {name} is held safely — yours to claim once the
            parcel is delivered.
          </p>
        )}
        {state === "paid" && (
          <p className="result success">
            <IconCheck size={18} /> Delivered. You received {money}.
          </p>
        )}
        {state === "refunded" && (
          <p className="result warn">
            <IconRefund size={18} /> Parcel returned. {name} was refunded {money} — you lost nothing.
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="demo-controls">
        <button
          className="btn primary"
          onClick={create}
          disabled={state !== "idle" || !amountValid}
          title={!amountValid ? "Enter an order amount first" : undefined}
        >
          Create the order
        </button>
        <button
          className="btn success"
          onClick={deliver}
          disabled={state !== "held"}
          title={state !== "held" ? "Create an order first" : undefined}
        >
          <IconCheck size={18} /> Mark as delivered
        </button>
        <button
          className="btn warnbtn"
          onClick={refund}
          disabled={state !== "held"}
          title={state !== "held" ? "Only available while the money is held" : undefined}
        >
          <IconRefund size={18} /> Refund the customer
        </button>
        <button className="btn ghost" onClick={reset} disabled={state === "idle"}>
          Start over
        </button>
      </div>

      {/* Plain-language activity log */}
      {log.length > 0 && (
        <ol className="demo-log">
          {log.map((entry, i) => (
            <li key={i}>
              <code>{entry.tag}</code>
              <span>{entry.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
