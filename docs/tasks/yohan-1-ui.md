# Brief — Mate 1: Mobile Buyer + Seller UI

Hi! You're building the **screens** — the whole look and feel of the app on a phone. You do
**not** touch the blockchain or the database. Every screen you build takes plain **props**
and **callbacks**; a stub file gives you fake callbacks so you can build and see everything
in the browser on your own.

**You barely need AI for this.** Follow [`../design/ui-reference/DESIGN.md`](../design/ui-reference/DESIGN.md)
for the exact look, use the primitives below, copy the exemplar screen's structure for the rest.

**Working folder:** `web/`. Branch: `real-deposit-escrow-prototype`.
**Already set up by the owner (Phase 0):** Tailwind + color tokens (brand green = `--primary`,
light mode), `web/src/lib/types.ts`, and `web/src/stubData.ts` (your fake callbacks).
Run the app with `npm run dev` in `web/` and open it in your browser.

---

## The design language (read DESIGN.md, then remember these 4 things)
1. **Micro-labels** are mono, uppercase, wide-tracked: `font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground`.
2. **Surfaces** are hairline-bordered cards: `rounded-xl border border-border/60 bg-background/40 p-4`.
3. **Numbers** are always `font-mono tabular-nums`.
4. **Color discipline:** grays for layout, **green only for the primary button**, status colors only for status.

## Types you'll use (already in `web/src/lib/types.ts`)
```ts
export type OrderStatus = "awaiting_deposit" | "funded" | "shipped" | "delivered" | "no_show";
export type OrderView = {
  ref: string; itemName: string; deposit: string; // "0.50"
  sellerAddress: string; buyerAddress: string | null;
  deadline: string;  // ISO
  status: OrderStatus;
  txHashes?: { label: string; hash: string }[];
};
```

## The stub you build against (`web/src/stubData.ts`, provided)
It exports fake versions of every callback your screens need, e.g.
`stub.onCreate(...)`, `stub.onLockDeposit(...)`, `stub.onConfirmDelivery(code)`, a sample
`OrderView`, etc. Wire your screens to these while developing. The owner swaps in the real
ones at integration — you never change your screens for that.

---

## Task U1: Shared primitives

**File:** Create `web/src/ui/primitives.tsx`. Small, reusable building blocks.

- [ ] Write:
```tsx
import type { ReactNode, ButtonHTMLAttributes } from "react";
import type { OrderStatus } from "../lib/types";

export function MicroLabel({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border/60 bg-background/40 p-4 ${className}`}>{children}</div>;
}

export function Button({ variant = "primary", className = "", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" }) {
  const base = "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-background hover:bg-foreground/[0.03]",
    ghost: "text-muted-foreground hover:text-foreground",
  }[variant];
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <MicroLabel>{label}</MicroLabel>
      <div className="mt-1 font-mono text-2xl tabular-nums">{value}</div>
    </Card>
  );
}

const STATUS_META: Record<OrderStatus, { text: string; tone: string; dot: string }> = {
  awaiting_deposit: { text: "Awaiting deposit", tone: "text-amber-600 bg-amber-500/12", dot: "bg-amber-500" },
  funded:           { text: "Deposit locked",   tone: "text-sky-600 bg-sky-500/12",     dot: "bg-sky-500" },
  shipped:          { text: "Shipped",          tone: "text-amber-600 bg-amber-500/12", dot: "bg-amber-500" },
  delivered:        { text: "Delivered · refunded", tone: "text-emerald-600 bg-emerald-500/12", dot: "bg-emerald-500" },
  no_show:          { text: "No-show · seller paid", tone: "text-rose-600 bg-rose-500/12", dot: "bg-rose-500" },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] ${m.tone}`}>
      <span className={`size-1.5 rounded-full ${m.dot}`} /> {m.text}
    </span>
  );
}

export function ScreenHeader({ crumb, title, subtitle }: { crumb: string; title: string; subtitle?: string }) {
  return (
    <header className="border-b border-border/60 pb-5">
      <MicroLabel>{crumb}</MicroLabel>
      <h1 className="mt-1 font-heading text-2xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-md px-4 py-3">{children}</div>
    </div>
  );
}
```
- [ ] Commit: `git commit -am "feat(ui): shared primitives (card, button, status pill, stat tile)"`

## Task U2: Transaction status component

**File:** Create `web/src/ui/TxStatus.tsx` — shows Pending → Success (with Explorer link) → Fail.
```tsx
import { Card, MicroLabel } from "./primitives";
export type TxState =
  | { kind: "idle" }
  | { kind: "pending"; note?: string }
  | { kind: "success"; hash: string }
  | { kind: "error"; message: string };

export function TxStatus({ state }: { state: TxState }) {
  if (state.kind === "idle") return null;
  return (
    <Card className="mt-3">
      {state.kind === "pending" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-3 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          {state.note ?? "Waiting for your wallet…"}
        </div>
      )}
      {state.kind === "success" && (
        <div className="text-sm">
          <MicroLabel>Confirmed on Stellar</MicroLabel>
          <a className="mt-1 block truncate font-mono text-xs text-emerald-600 hover:underline"
             href={`https://stellar.expert/explorer/testnet/tx/${state.hash}`} target="_blank" rel="noreferrer">
            {state.hash}
          </a>
        </div>
      )}
      {state.kind === "error" && <div className="text-sm text-rose-600">{state.message}</div>}
    </Card>
  );
}
```
- [ ] Commit: `git commit -am "feat(ui): transaction status component"`

## Task U3: Seller · Create Order (EXEMPLAR — build the others like this)

**File:** Create `web/src/screens/SellerCreateScreen.tsx`. Copy this structure and style for
every other screen.
```tsx
import { useState } from "react";
import { Button, Card, MicroLabel, ScreenHeader, StickyActionBar } from "../ui/primitives";

type Created = { ref: string; deliveryCode: string; shareUrl: string };

export function SellerCreateScreen({ onCreate }: {
  onCreate: (input: { itemName: string; deposit: string; deadlineMinutes: number }) => Promise<Created>;
}) {
  const [itemName, setItemName] = useState("");
  const [deposit, setDeposit] = useState("0.50");
  const [minutes, setMinutes] = useState(10);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Created | null>(null);

  const submit = async () => {
    if (!itemName.trim()) return;
    setBusy(true);
    try { setDone(await onCreate({ itemName, deposit, deadlineMinutes: minutes })); }
    finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <ScreenHeader crumb="Seller · Order created" title="Share this with your buyer" />
        <Card className="mt-6 text-center">
          <MicroLabel>Delivery code (write on the parcel)</MicroLabel>
          <div className="mt-1 font-mono text-3xl tracking-[0.3em] tabular-nums">{done.deliveryCode}</div>
        </Card>
        <Card className="mt-3">
          <MicroLabel>Share link</MicroLabel>
          <div className="mt-1 truncate font-mono text-xs">{done.shareUrl}</div>
          <Button variant="outline" className="mt-3" onClick={() => navigator.clipboard.writeText(done.shareUrl)}>
            Copy link
          </Button>
        </Card>
        {/* TODO: render a QR of done.shareUrl using the `qrcode` package (Task U7). */}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-28">
      <ScreenHeader crumb="Seller · New order" title="Create an order"
        subtitle="Your buyer locks a small refundable deposit. You’re covered if they no-show." />
      <Card className="mt-6 space-y-4">
        <Labelled label="Item">
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Blue cotton tee"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
        </Labelled>
        <Labelled label="Deposit (USDC)">
          <input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="decimal"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-ring" />
        </Labelled>
        <Labelled label="Auto-claim after (minutes)">
          <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-ring" />
        </Labelled>
      </Card>
      <StickyActionBar>
        <Button onClick={submit} disabled={busy || !itemName.trim()}>
          {busy ? "Creating…" : "Create order"}
        </Button>
      </StickyActionBar>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <MicroLabel>{label}</MicroLabel>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
```
- [ ] Wire it to `stub.onCreate` in your dev harness, confirm the form → success panel works.
- [ ] Commit: `git commit -am "feat(ui): seller create-order screen"`

## Task U4–U6: The remaining screens (build like U3, wire to the matching stub callback)

Exact props, layout, states, and copy — no guessing:

- [ ] **U4 · `screens/BuyerOrderScreen.tsx`** — props `{ order: OrderView; connected: boolean; onConnect(): Promise<void>; onLockDeposit(): Promise<void> }`.
  Layout: header `Buyer · Order`; a `StatTile` row showing **Deposit** (`{order.deposit} USDC`)
  and **Item** (`order.itemName`); a line showing the seller (truncated `sellerAddress`) and the
  deadline. Sticky action: if `!connected` → `Connect wallet` (calls `onConnect`); else
  `Lock deposit` (calls `onLockDeposit`, show a `TxStatus`). Copy under the button:
  "You’ll get this deposit back when you confirm delivery."

- [ ] **U5 · `screens/OrderDetailScreen.tsx`** — props `{ order: OrderView; role: "buyer" | "seller";
  onConfirmDelivery(code: string): Promise<void>; onMarkShipped(): Promise<void>; onClaim(): Promise<void> }`.
  Layout: header `Order {order.ref}` with a `StatusPill`; a **status timeline** (Created →
  Deposit locked → Shipped → Delivered/No-show — highlight the current one using the status);
  a list of `order.txHashes` as Explorer links (reuse the `TxStatus` success style).
  Role actions (sticky):
  - buyer + status `funded`/`shipped`: a delivery-code input + `Confirm delivery` (calls `onConfirmDelivery(code)`).
  - seller + status `funded`: `Mark shipped` (calls `onMarkShipped`).
  - seller + status `shipped` and deadline passed: `Claim deposit` (calls `onClaim`), rose-tinted note "Buyer didn’t show — claim your deposit."
  - status `delivered`/`no_show`: no actions, show a closed-state message.

- [ ] **U6 · `screens/HomeScreen.tsx`** — props `{ address: string; orders: OrderView[];
  onSell(): void; onOpenOrder(ref: string): void }`.
  Layout: header `EskoLokt` + a truncated `address` micro-label; two big cards **Sell**
  (calls `onSell`) and **Buy** (opens a "paste order link" input); then **My orders** — map
  `orders` to rows (item name + `StatusPill` + `ref`), each calling `onOpenOrder(ref)`.

Commit each: `git commit -am "feat(ui): <screen> screen"`.

## Task U7: QR + Connect + Emergency preview
- [ ] `npm install qrcode` and render the share link as a QR in the U3 success panel
  (`QRCode.toDataURL(shareUrl)` → `<img>`). Commit.
- [ ] `screens/ConnectScreen.tsx` — props `{ connected; address; onConnect; onGetTestFunds; onAddTrustline }`.
  A centered card: `Connect wallet`; once connected, show the address + two outline buttons
  `Get test funds` and `Add USDC trustline`. Commit.
- [ ] `screens/EmergencyPreview.tsx` — a **static** mockup of the "pay by text" SMS/USSD flow
  (a phone dialing `*123*456#` → "Deposit released"). Label it `Preview — coming soon`. Commit.

---

## How to verify your work (mobile)
- Run `npm run dev`, open the app, and use browser DevTools **device toolbar** (Ctrl+Shift+M)
  set to iPhone width. Every screen must look right at ~390px wide: single column, no
  horizontal scroll, primary button reachable at the bottom.
- Click through each screen wired to the stub — forms submit, buttons show pending, success
  panels appear.

## Definition of done
- [ ] All screens in `web/src/screens/` + primitives in `web/src/ui/`, wired to `stubData.ts`.
- [ ] Looks like `DESIGN.md` (mono labels, hairline cards, green only on primary, status colors).
- [ ] Works at phone width with no horizontal scroll.
- [ ] You did **not** import `soroban.ts`, `orders.ts`, or `wallet.ts` — only `stubData.ts` + `types.ts`.

**Questions?** Ask the owner. If a screen seems to need data the props don't give it, tell the
owner — don't reach into the chain/db yourself.
