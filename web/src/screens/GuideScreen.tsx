// ─── How it works — interactive walkthrough ──────────────────────────────────
// A click-through guide: one step at a time, progress bar, animated transitions,
// and a hands-on moment on step 4 where you type the delivery code and watch the
// deposit come back. Reachable on first sign-in and from the dashboard.

import { useEffect, useState } from "react";
import { Button } from "../ui/primitives";

type Step = {
  title: string;
  body: string;
  emoji: string;
};

const STEPS: Step[] = [
  { emoji: "📝", title: "Create an order", body: "Add what you're selling and a small refundable deposit. You get a link to send your buyer." },
  { emoji: "🔗", title: "Send the link to your buyer", body: "Message them the link (or the order code). They open it on their phone." },
  { emoji: "🔒", title: "Your buyer leaves the deposit", body: "A small deposit holds the order. It's fully refundable — it just protects your shipping." },
  { emoji: "🤝", title: "Hand over the parcel", body: "Your buyer shows you a code at the door. Enter it — their deposit goes straight back to them." },
  { emoji: "🛡️", title: "If they don't show up", body: "If the buyer never shows before the time runs out, you keep the deposit. No chasing, no loss." },
];

export function GuideScreen({
  onDone,
  onPractice,
}: {
  onDone: () => void;
  onPractice: () => void;
}) {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const step = STEPS[i];

  // Re-trigger the entrance animation whenever the step changes.
  const [anim, setAnim] = useState(0);
  useEffect(() => setAnim((n) => n + 1), [i]);

  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-28">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">How it works</div>
      <h1 className="mt-2 font-heading text-2xl tracking-tight">Interactive walkthrough</h1>

      {/* Progress */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((i + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {i + 1}/{STEPS.length}
        </span>
      </div>

      {/* Step card (animated on change) */}
      <div key={anim} className="mt-6 animate-[guide-in_0.35s_ease-out]">
        <style>{`@keyframes guide-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/[0.08] text-3xl">
            {step.emoji}
          </div>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Step {i + 1}
          </div>
          <h2 className="mt-1 font-heading text-xl">{step.title}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{step.body}</p>

          {/* Hands-on moment on the hand-over step */}
          {i === 3 && <CodeMoment />}
        </div>
      </div>

      {/* Step dots */}
      <div className="mt-5 flex justify-center gap-2">
        {STEPS.map((_, n) => (
          <button
            key={n}
            aria-label={`Go to step ${n + 1}`}
            onClick={() => setI(n)}
            className={`size-2 rounded-full transition-all ${
              n === i ? "w-5 bg-primary" : "bg-foreground/20 hover:bg-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Nav */}
      <div className="mt-6 flex gap-2">
        <Button variant="outline" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>
          Back
        </Button>
        {last ? (
          <Button onClick={onDone}>Got it — let's go</Button>
        ) : (
          <Button onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}>Next →</Button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          onClick={onPractice}
        >
          Try a full practice run
        </button>
        <button
          className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          onClick={onDone}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// A tiny interactive: type the code, watch the deposit return.
function CodeMoment() {
  const [code, setCode] = useState("");
  const done = code.trim() === "1234";
  return (
    <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 text-left">
      {!done ? (
        <>
          <div className="text-center font-mono text-2xl tracking-[0.3em] tabular-nums text-foreground">
            1234
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            This is your buyer's code. Type it to try it 👇
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            maxLength={4}
            placeholder="enter the code"
            className="mt-3 h-11 w-full rounded-lg border border-input bg-background px-3 text-center font-mono text-lg tabular-nums tracking-[0.3em] outline-none focus:border-ring"
          />
        </>
      ) : (
        <div className="animate-[guide-in_0.35s_ease-out] text-center">
          <div className="text-3xl">✅</div>
          <p className="mt-1 text-sm font-medium text-emerald-600">
            Delivered! The deposit just went back to your buyer.
          </p>
        </div>
      )}
    </div>
  );
}
