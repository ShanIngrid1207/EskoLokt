import { useState } from "react";
import {
  IconBuyer,
  IconEscrow,
  IconSeller,
  IconCheck,
  IconRefund,
  IconArrowRight,
} from "./icons";

// A fully simulated walkthrough in plain seller language — no wallet, no real
// money. Real cash-on-delivery: the customer pays cash at the door. The only
// thing locked up front is a small REFUNDABLE deposit that protects the seller's
// shipping if the customer flakes. Delivery is proven by a code the customer
// hands the rider at the door (works with no internet).

type DemoState = "idle" | "held" | "delivered" | "kept";

const STATUS: Record<DemoState, { label: string; tone: string }> = {
  idle: { label: "Empty", tone: "neutral" },
  held: { label: "Deposit held", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  kept: { label: "Deposit kept", tone: "warn" },
};

const peso = (n: number) => `₱${n.toLocaleString("en-US")}`;
// Small, refundable deposit: ~10% of the order, rounded to ₱10, minimum ₱20.
const depositFor = (amount: number) => Math.max(20, Math.round((amount * 0.1) / 10) * 10);

export function EscrowDemo() {
  const [state, setState] = useState<DemoState>("idle");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("500");
  // Order details are locked in when the order is created.
  const [order, setOrder] = useState<{ name: string; amount: number; deposit: number } | null>(null);
  const [log, setLog] = useState<{ tag: string; text: string }[]>([]);
  // Delivery code the customer hands the rider at the door — proof they got it.
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);

  const amountNum = Math.floor(Number(amount));
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;

  const push = (tag: string, text: string) => setLog((l) => [...l, { tag, text }]);

  const name = order?.name || "your customer";
  const goods = order ? peso(order.amount) : "";
  const dep = order ? peso(order.deposit) : "";

  const create = () => {
    if (!amountValid) return;
    const o = { name: customer.trim() || "your customer", amount: amountNum, deposit: depositFor(amountNum) };
    const newCode = String(Math.floor(1000 + Math.random() * 9000));
    setOrder(o);
    setCode(newCode);
    setCodeInput("");
    setCodeError(false);
    setState("held");
    push(
      "Order placed",
      `${o.name} will pay ${peso(o.amount)} cash on delivery, and locked a ${peso(o.deposit)} refundable deposit. Delivery code: ${newCode}.`,
    );
  };
  // Confirm delivery only if the rider enters the customer's delivery code.
  const tryDeliver = () => {
    if (state !== "held") return;
    if (codeInput.trim() !== code) {
      setCodeError(true);
      return;
    }
    setState("delivered");
    push(
      "Delivered",
      `${name} gave the rider the right code and paid ${goods} cash at the door. Their ${dep} deposit was returned.`,
    );
  };
  const noShow = () => {
    setState("kept");
    push(
      "Didn't accept",
      `${name} refused / didn't show for the parcel. Their ${dep} deposit covered your shipping — you lost nothing.`,
    );
  };
  const reset = () => {
    setState("idle");
    setOrder(null);
    setCode("");
    setCodeInput("");
    setCodeError(false);
    setLog([]);
  };

  // The chip represents the DEPOSIT. It returns to the customer on delivery,
  // or moves to the seller if the customer doesn't accept.
  const coinAt = state === "kept" ? "seller" : state === "held" ? "escrow" : "buyer";
  // In both outcomes the seller wins, so highlight "You" when settled.
  const sellerActive = state === "delivered" || state === "kept";
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
        Real cash-on-delivery: your customer pays cash <strong>when the parcel arrives</strong>. They
        just lock a small <strong>refundable deposit</strong> up front — so a fake order can never
        leave you paying for shipping again.
      </p>

      {/* Order details — editable only before the order is placed */}
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
          Order amount (₱, paid on delivery)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="500"
            inputMode="numeric"
            disabled={state !== "idle"}
          />
        </label>
      </div>

      {amountValid && state === "idle" && (
        <p className="deposit-hint">
          Refundable deposit for this order: <strong>{peso(depositFor(amountNum))}</strong>
        </p>
      )}

      {/* Pipeline: Customer -> Deposit held -> You */}
      <div className={`pipeline state-${state}`}>
        <div className={`node ${state === "delivered" ? "active" : ""}`}>
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
            Deposit held
            <span
              className="info-dot"
              tabIndex={0}
              role="note"
              title="Only a small refundable deposit sits in a neutral lock — not the order amount. It returns to your customer on delivery, or covers your shipping if they don't accept. No bank or middleman holds it."
            >
              ?
            </span>
          </span>
          <span className={`status-pill ${status.tone}`}>{status.label}</span>
        </div>

        <div className="leg">
          <IconArrowRight size={18} />
        </div>

        <div className={`node ${sellerActive ? "active" : ""}`}>
          <span className="node-icon seller">
            <IconSeller size={22} />
          </span>
          <span className="node-name">You</span>
          <span className="node-sub">the seller</span>
        </div>

        {/* The moving deposit chip */}
        <div className={`coin at-${coinAt} ${state === "idle" ? "hidden" : ""} tone-${status.tone}`}>
          {dep} deposit
        </div>
      </div>

      {/* Result / status line (announced to screen readers) */}
      <div className="result-wrap" aria-live="polite">
        {state === "idle" && (
          <p className="result neutral">Fill in the order above, then press “Place the order”.</p>
        )}
        {state === "held" && (
          <p className="result info">
            <IconEscrow size={18} /> {name} locked a {dep} deposit. They'll pay {goods} cash when the
            parcel arrives — the deposit just protects your shipping.
          </p>
        )}
        {state === "delivered" && (
          <p className="result success">
            <IconCheck size={18} /> Delivered. You got {goods} cash at the door, and {name}'s {dep}{" "}
            deposit was returned. Zero risk to you.
          </p>
        )}
        {state === "kept" && (
          <p className="result warn">
            <IconRefund size={18} /> {name} didn't accept the parcel. Their {dep} deposit covered your
            shipping — you lost nothing.
          </p>
        )}
      </div>

      {/* Handover step — delivery is proven by the customer's code */}
      {state === "held" && (
        <div className="handover">
          <div className="handover-code">
            <span className="handover-label">{name}'s delivery code</span>
            <span className="code-chip">{code}</span>
          </div>
          <p className="handover-hint">
            Your customer shows this code to the rider at the door and pays the {goods} cash. Entering
            it confirms delivery — and it works even with no internet.
          </p>
          <label>
            Rider enters the code
            <input
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.replace(/[^\d]/g, ""));
                setCodeError(false);
              }}
              placeholder="4-digit code"
              inputMode="numeric"
              maxLength={4}
            />
          </label>
          {codeError && (
            <p className="error">That code doesn't match — the deposit stays safely held.</p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="demo-controls">
        <button
          className="btn primary"
          onClick={create}
          disabled={state !== "idle" || !amountValid}
          title={!amountValid ? "Enter an order amount first" : undefined}
        >
          Place the order
        </button>
        <button
          className="btn success"
          onClick={tryDeliver}
          disabled={state !== "held"}
          title={state !== "held" ? "Place an order first" : "Confirm with the customer's delivery code"}
        >
          <IconCheck size={18} /> Confirm delivery
        </button>
        <button
          className="btn warnbtn"
          onClick={noShow}
          disabled={state !== "held"}
          title={
            state !== "held"
              ? "Available while the deposit is held"
              : "Customer refuses or doesn't show for the parcel"
          }
        >
          <IconRefund size={18} /> Customer didn't accept
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
