// ─── Practice mode ───────────────────────────────────────────────────────────
// A fully simulated walkthrough in plain seller language — no wallet, no real
// money, no chain. Teaches the deposit model: the customer pays cash at the door
// and only locks a small REFUNDABLE deposit. Delivered (rider enters the code) →
// the deposit returns. No-show / rejected → the deposit covers the seller's
// shipping. Ported from the standalone Esko Lokt demo into the mobile app.

import { useState } from "react";
import { Button, Card, MicroLabel, ScreenHeader } from "../ui/primitives";

type DemoState = "idle" | "held" | "delivered" | "kept";

const peso = (n: number) => `₱${n.toLocaleString("en-US")}`;
// Small, refundable deposit: ~10% of the order, rounded to ₱10, minimum ₱20.
const depositFor = (amount: number) => Math.max(20, Math.round((amount * 0.1) / 10) * 10);

export function PracticeScreen({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<DemoState>("idle");
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("500");
  const [order, setOrder] = useState<{ name: string; amount: number; deposit: number } | null>(null);
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);

  const amountNum = Math.floor(Number(amount));
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;
  const name = order?.name || "your customer";
  const dep = order ? peso(order.deposit) : "";
  const goods = order ? peso(order.amount) : "";

  const create = () => {
    if (!amountValid) return;
    const o = { name: customer.trim() || "your customer", amount: amountNum, deposit: depositFor(amountNum) };
    // Deterministic 4-digit code from the amount+name so no Math.random is needed here.
    const seed = (amountNum * 31 + (customer.length || 3) * 7) % 9000;
    const newCode = String(1000 + seed);
    setOrder(o);
    setCode(newCode);
    setCodeInput("");
    setCodeError(false);
    setState("held");
  };

  const tryDeliver = () => {
    if (state !== "held") return;
    if (codeInput.trim() !== code) {
      setCodeError(true);
      return;
    }
    setState("delivered");
  };

  const reset = () => {
    setState("idle");
    setOrder(null);
    setCode("");
    setCodeInput("");
    setCodeError(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-28">
      <ScreenHeader
        crumb="Practice · No real money"
        title="Try a sample order"
        subtitle="See how a small refundable deposit protects a sale — no wallet, nothing real is spent."
      />

      {/* Order inputs */}
      {state === "idle" && (
        <Card className="mt-6 space-y-4">
          <label className="block">
            <MicroLabel>Customer name</MicroLabel>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Maria Santos"
              className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition-colors"
            />
          </label>
          <label className="block">
            <MicroLabel>Order amount (₱, paid on delivery)</MicroLabel>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="500"
              className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-ring transition-colors"
            />
          </label>
          {amountValid && (
            <p className="text-sm text-muted-foreground">
              Refundable deposit for this order: <strong>{peso(depositFor(amountNum))}</strong>
            </p>
          )}
          <Button onClick={create} disabled={!amountValid}>
            Place the order
          </Button>
        </Card>
      )}

      {/* Deposit held — rider enters the code at the door */}
      {state === "held" && order && (
        <>
          <Card className="mt-6">
            <MicroLabel>Deposit held</MicroLabel>
            <p className="mt-1 text-sm">
              {name} will pay <strong>{goods}</strong> cash when the parcel arrives, and locked a{" "}
              <strong>{dep}</strong> refundable deposit. It just protects your shipping.
            </p>
          </Card>

          <Card className="mt-3">
            <MicroLabel>{name}'s delivery code</MicroLabel>
            <div className="mt-1 font-mono text-3xl tracking-[0.3em] tabular-nums">{code}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              The customer shows this to the rider at the door. Entering it confirms delivery — works
              even with no internet.
            </p>
            <label className="mt-4 block">
              <MicroLabel>Rider enters the code</MicroLabel>
              <input
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.replace(/[^\d]/g, ""));
                  setCodeError(false);
                }}
                inputMode="numeric"
                maxLength={4}
                placeholder="4-digit code"
                className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-center font-mono text-xl tabular-nums tracking-[0.3em] outline-none focus:border-ring transition-colors"
              />
            </label>
            {codeError && (
              <p className="mt-2 text-sm text-rose-600">
                That code doesn't match — the deposit stays safely held.
              </p>
            )}
          </Card>

          <div className="mt-4 space-y-2">
            <Button onClick={tryDeliver}>Confirm delivery</Button>
            <Button variant="outline" onClick={() => setState("kept")}>
              Customer didn't accept
            </Button>
          </div>
        </>
      )}

      {/* Delivered — deposit returned */}
      {state === "delivered" && order && (
        <Card className="mt-6 border-emerald-500/40">
          <MicroLabel>Delivered</MicroLabel>
          <p className="mt-1 text-sm">
            {name} gave the rider the right code and paid <strong>{goods}</strong> cash at the door.
            Their <strong>{dep}</strong> deposit was returned. Zero risk to you.
          </p>
          <Button variant="outline" className="mt-4" onClick={reset}>
            Start over
          </Button>
        </Card>
      )}

      {/* No-show — deposit covers shipping */}
      {state === "kept" && order && (
        <Card className="mt-6 border-rose-500/40">
          <MicroLabel>Didn't accept</MicroLabel>
          <p className="mt-1 text-sm">
            {name} refused / didn't show for the parcel. Their <strong>{dep}</strong> deposit covered
            your shipping — you lost nothing.
          </p>
          <Button variant="outline" className="mt-4" onClick={reset}>
            Start over
          </Button>
        </Card>
      )}

      <div className="mt-6 text-center">
        <button
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
}
