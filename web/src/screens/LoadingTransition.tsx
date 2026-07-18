// ─── Loading transition (wallet → dashboard) ─────────────────────────────────
// Full-screen branded handoff shown for ~1.9s after the buyer/seller taps
// "Enter app". Background is the animated ShapeGrid (hexagons) over the same
// deep-green as the connect panel. The ESKO LOKT wordmark assembles letter by
// letter, the lock mark clicks shut, and a gold accent bar sweeps as progress.
// Honors prefers-reduced-motion (letters just fade, no per-letter motion).
import { useEffect, useState } from "react";
import ShapeGrid from "../components/ShapeGrid";

const WORD = "ESKO LOKT";
const STATUSES = ["Connecting wallet", "Securing your deposit vault", "You're in"];
const DURATION = 1900; // ms on screen before onDone fires

export function LoadingTransition({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStatus(1), 650);
    const t2 = setTimeout(() => setStatus(2), 1400);
    const done = setTimeout(onDone, DURATION);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(done);
    };
  }, [onDone]);

  const styles = `
@keyframes el-letter-in {
  from { opacity: 0; transform: translateY(0.5em) scale(0.9); filter: blur(6px); }
  to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes el-lock-in {
  0%   { opacity: 0; transform: scale(1.6) rotate(-8deg); }
  60%  { opacity: 1; transform: scale(0.86) rotate(0deg); }
  80%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes el-bar-sweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes el-screen-in { from { opacity: 0; } to { opacity: 1; } }
.el-letter { display: inline-block; opacity: 0; animation: el-letter-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
.el-lock   { animation: el-lock-in 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
.el-bar    { transform-origin: left; animation: el-bar-sweep ${DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards; }
.el-screen { animation: el-screen-in 0.35s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .el-letter { animation: el-screen-in 0.4s ease-out forwards; }
  .el-lock   { animation: el-screen-in 0.4s ease-out forwards; }
}
`;

  return (
    <div
      className="el-screen fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0e5138] to-[#082a1e] text-white"
      role="status"
      aria-label="Signing you in"
    >
      <style>{styles}</style>

      {/* Animated shape grid background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.55]">
        <ShapeGrid
          shape="hexagon"
          direction="diagonal"
          speed={0.45}
          squareSize={34}
          borderColor="rgba(52,211,153,0.16)"
          hoverFillColor="rgba(233,185,73,0.55)"
          hoverTrailAmount={3}
        />
      </div>
      {/* Vignette so the center content stays legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 50% 45%, transparent 30%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* Center content */}
      <div className="relative flex flex-col items-center">
        <span className="el-lock flex size-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-2xl shadow-black/30">
          <img src="/eskolokt-mark.png" alt="EskoLokt" className="size-full object-contain" />
        </span>

        <h1
          className="mt-7 font-heading text-4xl font-semibold tracking-[0.14em] sm:text-5xl"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
          aria-label="Esko Lokt"
        >
          {WORD.split("").map((ch, i) => (
            <span
              key={i}
              className="el-letter"
              style={{ animationDelay: `${i * 65}ms`, width: ch === " " ? "0.4em" : undefined }}
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h1>

        {/* Gold accent progress bar */}
        <div className="mt-8 h-[3px] w-52 overflow-hidden rounded-full bg-white/12">
          <div
            className="el-bar h-full w-full rounded-full"
            style={{ background: "linear-gradient(90deg, #e9b949, #f6d27a)" }}
          />
        </div>

        {/* Cycling status line */}
        <p
          key={status}
          className="el-screen mt-4 font-mono text-[11px] uppercase tracking-[0.28em] text-white/70"
        >
          {STATUSES[status]}
        </p>
      </div>
    </div>
  );
}
