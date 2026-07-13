// Screen sandbox — open the app with ?dev=1 to see this instead of the old demo.
// Mate 1: import your screen and render it here, wired to `stub` / `sampleOrder`.
//   e.g.  <SellerCreateScreen onCreate={stub.onCreate} />
import { stub, sampleOrder } from "./stubData";

export default function DevHarness() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Dev harness
        </div>
        <h1 className="mt-1 font-heading text-2xl">Screen sandbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tailwind + brand green work if this button is green and the card below has a
          hairline border:
        </p>
        <button className="mt-4 h-11 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
          Primary action (brand green)
        </button>
        <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Sample deposit
          </div>
          <div className="mt-1 font-mono text-2xl tabular-nums">{sampleOrder.deposit} USDC</div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Mate 1: render your screen below and wire callbacks to <code>stub</code>.
        </p>
        <span className="hidden">{JSON.stringify(!!stub)}</span>
      </div>
    </div>
  );
}
