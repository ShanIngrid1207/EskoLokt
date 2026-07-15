// ─── U7c: Emergency Preview — "Pay by text" SMS/USSD flow ────────────────────
// Static mockup of the offline payment flow (phone dialing *123*456# → Deposit
// released).  Labelled "Preview — coming soon". No callbacks needed.

import { useState } from "react";
import { Card, MicroLabel } from "../ui/primitives";

// ─── USSD flow steps ──────────────────────────────────────────────────────────
type Step = {
  id: string;
  screen: "dial" | "menu" | "confirm" | "success";
  title: string;
  body: string | string[];
  footer?: string;
};

const FLOW_STEPS: Step[] = [
  {
    id: "dial",
    screen: "dial",
    title: "Dial USSD code",
    body: "*123*456#",
    footer: "Customer dials from any phone — no internet needed.",
  },
  {
    id: "menu",
    screen: "menu",
    title: "USSD menu",
    body: [
      "Esko Lokt",
      "1. Confirm delivery",
      "2. Check balance",
      "3. Exit",
      "",
      "Reply: 1",
    ],
    footer: "Customer presses 1 to confirm delivery.",
  },
  {
    id: "confirm",
    screen: "confirm",
    title: "Enter delivery code",
    body: [
      "Enter 6-digit code",
      "from the parcel:",
      "",
      "Reply: 123456",
    ],
    footer: "Customer types the code written on the parcel.",
  },
  {
    id: "success",
    screen: "success",
    title: "Deposit released",
    body: [
      "✓ Delivery confirmed.",
      "Deposit ₱25.00 sent",
      "back to your wallet.",
      "",
      "Thank you!",
    ],
    footer: "Smart contract settles in ~5 s — no bank needed.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function EmergencyPreview() {
  const [step, setStep] = useState(0);

  const current = FLOW_STEPS[step];
  const isLast = step === FLOW_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-md px-4 py-8 md:max-w-2xl">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <MicroLabel>Emergency options</MicroLabel>
          <span className="rounded bg-amber-500/12 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-600">
            Preview — coming soon
          </span>
        </div>
        <h1 className="mt-1 font-heading text-2xl">Pay by text (SMS/USSD)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No internet? Confirm delivery by dialing a short code from any phone.
        </p>
      </div>

      {/* How it works + phone demo, side-by-side on desktop */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-start">
      {/* How it works summary */}
      <Card>
        <MicroLabel>How it works</MicroLabel>
        <ol className="mt-3 space-y-2 text-sm">
          {[
            "Customer receives parcel and dials *123*456#",
            "Selects \"Confirm delivery\" from the menu",
            "Enters the 6-digit code written on the parcel",
            "Stellar contract settles instantly — deposit returned",
          ].map((text, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] text-primary">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{text}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Phone mockup + animated flow */}
      <div className="flex flex-col items-center">
        <MicroLabel>Interactive demo</MicroLabel>
        <div className="mt-4 w-56 rounded-[2.5rem] border-4 border-foreground/20 bg-foreground/5 p-2 shadow-xl">
          {/* Phone top notch */}
          <div className="flex justify-center pb-1">
            <div className="h-1.5 w-12 rounded-full bg-foreground/20" />
          </div>
          {/* Screen */}
          <div className="min-h-[280px] rounded-[1.75rem] bg-black p-4">
            {/* Status bar */}
            <div className="mb-3 flex justify-between font-mono text-[9px] text-white/40">
              <span>09:41</span>
              <span>●●●</span>
            </div>

            {/* USSD / SMS UI */}
            {current.screen === "dial" ? (
              /* Dialer screen */
              <div className="text-center">
                <div className="mb-4 font-mono text-xs text-white/40">Dial</div>
                <div className="font-mono text-2xl tracking-wider text-white">
                  {current.body as string}
                </div>
                <div className="mt-6 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
                    <PhoneIcon />
                  </div>
                </div>
              </div>
            ) : (
              /* USSD menu / response screen */
              <div>
                <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-white/40">
                  USSD
                </div>
                <div className="space-y-1">
                  {(current.body as string[]).map((line, i) => (
                    <div
                      key={i}
                      className={`font-mono text-xs ${
                        line.startsWith("✓")
                          ? "text-emerald-400"
                          : line.startsWith("Reply:")
                          ? "text-amber-300"
                          : line === ""
                          ? ""
                          : "text-white"
                      }`}
                    >
                      {line || "\u00a0"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Home bar */}
          <div className="mt-2 flex justify-center">
            <div className="h-1 w-20 rounded-full bg-foreground/20" />
          </div>
        </div>

        {/* Step label */}
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {current.footer}
        </p>

        {/* Navigation */}
        <div className="mt-4 flex items-center gap-4">
          <button
            id="ussd-prev-btn"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="h-8 w-8 rounded-full border border-border/60 text-sm text-muted-foreground transition-colors hover:border-border disabled:opacity-30"
            aria-label="Previous step"
          >
            ‹
          </button>
          {/* Step dots */}
          <div className="flex gap-1.5">
            {FLOW_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-foreground/20"
                }`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
          <button
            id="ussd-next-btn"
            onClick={() => setStep((s) => Math.min(FLOW_STEPS.length - 1, s + 1))}
            disabled={isLast}
            className="h-8 w-8 rounded-full border border-border/60 text-sm text-muted-foreground transition-colors hover:border-border disabled:opacity-30"
            aria-label="Next step"
          >
            ›
          </button>
        </div>
      </div>
      </div>

      {/* Offline options + status, side-by-side on desktop */}
      <div className="mt-6 grid gap-3 md:grid-cols-2 md:items-start">
      {/* Offline options section */}
      <Card>
        <MicroLabel>Other offline options</MicroLabel>
        <div className="mt-3 space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="text-lg" aria-hidden="true">🏪</span>
            <div>
              <div className="font-medium text-foreground">Pay via agent</div>
              <div>
                Visit a nearby sari-sari store or padala counter — they can
                lock the deposit on your behalf.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-lg" aria-hidden="true">🚴</span>
            <div>
              <div className="font-medium text-foreground">Rider confirms</div>
              <div>
                Pay cash to the rider. They enter your delivery code when they
                have signal — deposit is returned automatically.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Coming soon notice */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <MicroLabel>Production status</MicroLabel>
        <p className="mt-1 text-sm text-muted-foreground">
          The USSD/SMS gateway integration is next-phase. A production version
          connects to a telco or SMS gateway to handle real short-code dialing.
          This preview shows the exact flow customers will experience.
        </p>
      </Card>
      </div>
    </div>
  );
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function PhoneIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 8.81 19.79 19.79 0 0 1 1.08 4.2 2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
