// ─── Connect screen (inset split-card) ───────────────────────────────────────
// Adapted from the Orbit "inset login" template: a full-viewport rounded card
// split into a branded green panel (animated) and the connect action. Esko Lokt
// has no passwords — the "wallet" is the sign-in — so the right side is just the
// connect flow + free test money. Light mode.

import { useState } from "react";

export function ConnectScreen({
  connected,
  address,
  onConnect,
  onGetTestFunds,
  onContinue,
}: {
  connected: boolean;
  address: string;
  onConnect: () => Promise<void>;
  onGetTestFunds: () => Promise<void>;
  onAddTrustline?: () => Promise<void>;
  onContinue?: () => void;
}) {
  const [connectBusy, setConnectBusy] = useState(false);
  const [fundsBusy, setFundsBusy] = useState(false);
  const [fundsMsg, setFundsMsg] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnectBusy(true);
    try {
      await onConnect();
    } catch (e) {
      console.error("[ConnectScreen] connect failed", e);
    } finally {
      setConnectBusy(false);
    }
  };

  const handleGetTestFunds = async () => {
    setFundsBusy(true);
    setFundsMsg(null);
    try {
      await onGetTestFunds();
      setFundsMsg("Free test money added ✓");
    } catch (e) {
      setFundsMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setFundsBusy(false);
    }
  };

  const truncate = (a: string) => (a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-8)}` : a);

  return (
    <div className="min-h-svh bg-background p-3 text-foreground md:p-8 lg:p-12">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-[1120px] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-foreground/5 md:min-h-[620px] lg:grid-cols-[1.05fr_minmax(400px,480px)]">
        <BrandPanel />
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-sm">
            {/* Mobile brand (the green panel is hidden on small screens) */}
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <BrandLock />
              <span className="font-heading text-base tracking-tight">Esko Lokt</span>
            </div>

            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
              Get started
            </div>
            <h1 className="mt-2 font-heading text-2xl tracking-tight">
              {connected ? "You're in" : "Connect your wallet"}
            </h1>

            {!connected ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your wallet is how the small refundable deposit is held and returned — no bank
                  needed. Connect it to get started.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connectBusy}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <WalletIcon className="size-4" />
                  {connectBusy ? "Connecting…" : "Connect wallet"}
                </button>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  This is a test — no real money is involved.
                </p>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-primary/[0.07] px-4 py-3 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Your account
                  </div>
                  <div className="mt-1 font-mono text-xs">{truncate(address)}</div>
                </div>

                <button
                  onClick={handleGetTestFunds}
                  disabled={fundsBusy}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-medium transition-colors hover:bg-foreground/[0.03] disabled:opacity-60"
                >
                  {fundsBusy ? "Adding…" : "Get free test money"}
                </button>
                {fundsMsg && (
                  <p
                    className={`text-center text-xs ${
                      fundsMsg.includes("✓") ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {fundsMsg}
                  </p>
                )}

                {onContinue && (
                  <button
                    onClick={onContinue}
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Enter app →
                  </button>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  This is a test — no real money is involved.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Left brand panel (animated green) ────────────────────────────────────────
function BrandPanel() {
  const styles = `
@keyframes esko-blob-1 { 0%{transform:translate(-20%,-15%) scale(1)} 50%{transform:translate(25%,15%) scale(1.2)} 100%{transform:translate(-20%,-15%) scale(1)} }
@keyframes esko-blob-2 { 0%{transform:translate(20%,25%) scale(1.1)} 50%{transform:translate(-25%,-15%) scale(0.9)} 100%{transform:translate(20%,25%) scale(1.1)} }
@keyframes esko-blob-3 { 0%{transform:translate(15%,-25%) scale(0.9)} 50%{transform:translate(-25%,20%) scale(1.15)} 100%{transform:translate(15%,-25%) scale(0.9)} }
.esko-b1{animation:esko-blob-1 16s ease-in-out infinite;will-change:transform}
.esko-b2{animation:esko-blob-2 20s ease-in-out infinite;will-change:transform}
.esko-b3{animation:esko-blob-3 14s ease-in-out infinite;will-change:transform}
@media (prefers-reduced-motion: reduce){.esko-b1,.esko-b2,.esko-b3{animation:none}}
`;
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0e5138] to-[#082a1e] lg:block">
      <style>{styles}</style>
      {/* animated blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="esko-b1 absolute -left-[10vmax] -top-[10vmax] h-[45vmax] w-[45vmax] rounded-full" style={{ background: "radial-gradient(circle,rgba(52,211,153,0.5),transparent 70%)", filter: "blur(60px)" }} />
        <div className="esko-b2 absolute -right-[12vmax] top-[15vmax] h-[45vmax] w-[45vmax] rounded-full" style={{ background: "radial-gradient(circle,rgba(20,184,166,0.45),transparent 70%)", filter: "blur(60px)" }} />
        <div className="esko-b3 absolute bottom-[-12vmax] left-[10vmax] h-[40vmax] w-[40vmax] rounded-full" style={{ background: "radial-gradient(circle,rgba(16,185,129,0.4),transparent 70%)", filter: "blur(60px)" }} />
      </div>
      {/* vignette */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 40%, transparent 40%, rgba(0,0,0,0.35) 100%)" }} />

      <div className="relative flex h-full flex-col justify-between p-10 text-white lg:p-12">
        <div className="flex items-center gap-2">
          <BrandLock light />
          <span className="font-heading text-base tracking-tight">Esko Lokt</span>
        </div>

        <div className="max-w-md">
          <h2 className="font-heading text-3xl font-semibold leading-tight md:text-4xl" style={{ textShadow: "0 1px 20px rgba(0,0,0,0.35)" }}>
            Cash-on-delivery,
            <br />
            without the fake orders.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/75 leading-relaxed">
            Your buyer leaves a small refundable deposit. Delivered → it goes back to them. No-show →
            you keep it. No bank, no chasing.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-white/80">
          <Step n={1} text="Create an order & send the link" />
          <Step n={2} text="Buyer leaves the deposit" />
          <Step n={3} text="Hand over with a code — deposit returns" />
        </div>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-5 items-center justify-center rounded-full bg-white/15 font-mono text-[10px]">
        {n}
      </span>
      {text}
    </div>
  );
}

function BrandLock({ light }: { light?: boolean }) {
  return (
    <span
      className={`flex size-7 items-center justify-center rounded-md ${light ? "bg-white p-1" : ""}`}
    >
      <img src="/eskolokt-mark.png" alt="EskoLokt" className="size-full object-contain" />
    </span>
  );
}

function WalletIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
    </svg>
  );
}
