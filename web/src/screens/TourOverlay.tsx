// ─── Interactive spotlight tour (Quest HQ style, EskoLokt green) ─────────────
// Dims the real screen, spotlights a real on-screen element, and floats a
// tooltip + arrow pointing at it. Steps whose target isn't visible are skipped,
// so one step list serves both the desktop dashboard and the mobile home screen.
// Keeps the hands-on "type the code" moment as a centered step.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TourStep = {
  key: string;
  sel?: string; // undefined = centered step (welcome / code / closing)
  title: string;
  body?: string;
  kind?: "code"; // renders the hands-on CodeMoment
};

const STEPS: TourStep[] = [
  { key: "welcome", title: "Welcome to EskoLokt", body: "A 20-second tour of the basics. You can replay it anytime from “How it works”." },
  { key: "create", sel: '[data-tour="create"]', title: "Start here", body: "Create an order. You get a protected deposit and a link to send your buyer." },
  { key: "buy", sel: '[data-tour="buy"]', title: "Got a link from a buyer?", body: "If someone sent you an order link, open it here." },
  { key: "code", kind: "code", title: "Handing over the parcel", body: "Your buyer shows you a code at the door. Try it 👇" },
  { key: "orders", sel: '[data-tour="orders"]', title: "Your orders", body: "Every order you make — and its status — lives here." },
  { key: "howitworks", sel: '[data-tour="howitworks"]', title: "Replay anytime", body: "Reopen this tour from here whenever you need it." },
  { key: "done", title: "You’re all set", body: "That’s the tour. Welcome aboard!" },
];

function visible(sel: string): boolean {
  const el = document.querySelector(sel);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function TourOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0); // bump to force a reposition

  const highlightRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  // Build the visible step list once when the tour opens.
  useEffect(() => {
    if (!open) return;
    const built = STEPS.filter((s) => !s.sel || visible(s.sel));
    setSteps(built);
    // ?tour=1&s=<n> opens the tour at a given step (demo / verification aid).
    const s = Number(new URLSearchParams(window.location.search).get("s"));
    setI(Number.isInteger(s) && s > 0 && s < built.length ? s : 0);
  }, [open]);

  const last = i === steps.length - 1;
  const step = steps[i];

  const next = () => (i < steps.length - 1 ? setI(i + 1) : onClose());
  const prev = () => i > 0 && setI(i - 1);

  // Keyboard nav + reposition on resize/scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setI((v) => (v < steps.length - 1 ? v + 1 : v));
      else if (e.key === "ArrowLeft") setI((v) => (v > 0 ? v - 1 : v));
    };
    const reflow = () => setTick((t) => t + 1);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", reflow);
    window.addEventListener("scroll", reflow, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reflow);
      window.removeEventListener("scroll", reflow, true);
    };
  }, [open, steps.length, onClose]);

  // Bring the target into view when the step changes, then reposition.
  useEffect(() => {
    if (!open || !step?.sel) return;
    const el = document.querySelector(step.sel);
    if (el && "scrollIntoView" in el) {
      try {
        (el as HTMLElement).scrollIntoView({ block: "nearest", inline: "center" });
      } catch {
        /* older browsers */
      }
    }
    const id = requestAnimationFrame(() => setTick((t) => t + 1));
    return () => cancelAnimationFrame(id);
  }, [open, i, step?.sel]);

  // Position the spotlight + tooltip + arrow imperatively (viewport math).
  useLayoutEffect(() => {
    if (!open || !step) return;
    const highlight = highlightRef.current;
    const tooltip = tooltipRef.current;
    const arrow = arrowRef.current;
    if (!highlight || !tooltip || !arrow) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tRect = tooltip.getBoundingClientRect();
    const tw = tRect.width || 320;
    const th = tRect.height || 160;
    const gap = 14;

    const target = step.sel ? (document.querySelector(step.sel) as HTMLElement | null) : null;

    if (!target) {
      highlight.style.opacity = "0";
      arrow.style.display = "none";
      tooltip.style.left = Math.round((vw - tw) / 2) + "px";
      tooltip.style.top = Math.round((vh - th) / 2) + "px";
      return;
    }

    const r = target.getBoundingClientRect();
    const pad = 6;
    highlight.style.opacity = "1";
    highlight.style.left = Math.round(r.left - pad) + "px";
    highlight.style.top = Math.round(r.top - pad) + "px";
    highlight.style.width = Math.round(r.width + pad * 2) + "px";
    highlight.style.height = Math.round(r.height + pad * 2) + "px";

    const below = r.bottom + gap + th <= vh;
    let top = below ? r.bottom + gap : r.top - gap - th;
    top = Math.max(8, Math.min(top, vh - 8 - th));

    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, vw - tw - 8));

    tooltip.style.left = Math.round(left) + "px";
    tooltip.style.top = Math.round(top) + "px";

    arrow.style.display = "block";
    const up = below; // arrow on top edge when the tooltip sits below the target
    arrow.style.top = up ? "-6px" : "auto";
    arrow.style.bottom = up ? "auto" : "-6px";
    arrow.style.transform = up ? "rotate(45deg)" : "rotate(225deg)";
    const arrowX = Math.max(14, Math.min(r.left + r.width / 2 - left, tw - 14));
    arrow.style.left = Math.round(arrowX) + "px";
  }, [open, i, tick, step, steps.length]);

  if (!open || !step) return null;

  // Anchored steps get their dim from the spotlight's box-shadow; centered steps
  // (welcome / code / closing) have no spotlight, so dim the whole backdrop here.
  const centered = !step.sel;

  return createPortal(
    <div
      className="fixed inset-0 z-[9997] transition-colors duration-200"
      style={{ background: centered ? "rgba(9, 18, 14, 0.55)" : "transparent" }}
    >
      {/* Spotlight ring + full-screen dim in one box-shadow (EskoLokt green). */}
      <div
        ref={highlightRef}
        className="pointer-events-none fixed z-[9998] rounded-lg opacity-0 transition-all duration-200 ease-out"
        style={{
          boxShadow:
            "0 0 0 2px hsl(var(--el-primary)), 0 0 0 9999px rgba(9, 18, 14, 0.55)",
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        className="fixed z-[9999] w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card p-4 shadow-[0_24px_70px_-28px_rgba(16,24,40,0.45)] animate-[tour-in_0.18s_ease-out] motion-reduce:animate-none"
      >
        <style>{`@keyframes tour-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
        <div
          ref={arrowRef}
          className="absolute size-3 border-l border-t border-border bg-card"
          style={{ display: "none" }}
        />

        <div className="font-heading text-lg tracking-tight">{step.title}</div>
        {step.body && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
        )}
        {step.kind === "code" && <CodeMoment />}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {steps.map((_, n) => (
              <span
                key={n}
                className={`size-1.5 rounded-full transition-colors ${n === i ? "bg-primary" : "bg-foreground/20"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
            {i > 0 && (
              <button
                onClick={prev}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-foreground/[0.03]"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Hands-on: type the code, watch the deposit return. (Preserved from the old guide.)
function CodeMoment() {
  const [code, setCode] = useState("");
  const done = code.trim() === "1234";
  return (
    <div className="mt-3 rounded-lg border border-border bg-background/60 p-3">
      {!done ? (
        <>
          <div className="text-center font-mono text-xl tracking-[0.3em] tabular-nums text-foreground">
            1234
          </div>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            This is your buyer's code. Type it 👇
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            maxLength={4}
            placeholder="enter the code"
            className="mt-2.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-center font-mono text-base tabular-nums tracking-[0.3em] outline-none focus:border-ring"
          />
        </>
      ) : (
        <div className="animate-[tour-in_0.2s_ease-out] text-center motion-reduce:animate-none">
          <div className="text-2xl">✅</div>
          <p className="mt-1 text-[13px] font-medium text-primary">
            Delivered! The deposit just went back to your buyer.
          </p>
        </div>
      )}
    </div>
  );
}
