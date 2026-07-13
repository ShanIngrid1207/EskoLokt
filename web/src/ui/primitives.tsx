// ─── Shared UI primitives for the EskoLokt mobile screen layer ───────────────
// Design rules (from yohan-1-ui.md):
//   1. Micro-labels → font-mono, 10px, uppercase, wide-tracked, muted
//   2. Surfaces     → rounded-xl, hairline border, bg-background/40, p-4
//   3. Numbers      → font-mono tabular-nums
//   4. Color        → grays for layout · green ONLY for primary CTA · status colors for status

import type { ReactNode, ButtonHTMLAttributes } from "react";
import type { OrderStatus } from "../lib/types";

// ─── MicroLabel ───────────────────────────────────────────────────────────────
export function MicroLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
      {children}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-background/40 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
}) {
  const base =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<"primary" | "outline" | "ghost", string> = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
    outline:
      "border border-border bg-background hover:bg-foreground/[0.03] active:scale-[0.98]",
    ghost:
      "text-muted-foreground hover:text-foreground active:scale-[0.98]",
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

// ─── StatTile ─────────────────────────────────────────────────────────────────
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <MicroLabel>{label}</MicroLabel>
      <div className="mt-1 font-mono text-2xl tabular-nums">{value}</div>
    </Card>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
const STATUS_META: Record<
  OrderStatus,
  { text: string; tone: string; dot: string }
> = {
  awaiting_deposit: {
    text: "Awaiting deposit",
    tone: "text-amber-600 bg-amber-500/12",
    dot: "bg-amber-500",
  },
  funded: {
    text: "Deposit locked",
    tone: "text-sky-600 bg-sky-500/12",
    dot: "bg-sky-500",
  },
  shipped: {
    text: "Shipped",
    tone: "text-amber-600 bg-amber-500/12",
    dot: "bg-amber-500",
  },
  delivered: {
    text: "Delivered · refunded",
    tone: "text-emerald-600 bg-emerald-500/12",
    dot: "bg-emerald-500",
  },
  no_show: {
    text: "No-show · seller paid",
    tone: "text-rose-600 bg-rose-500/12",
    dot: "bg-rose-500",
  },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] ${m.tone}`}
    >
      <span className={`size-1.5 rounded-full ${m.dot}`} /> {m.text}
    </span>
  );
}

// ─── ScreenHeader ─────────────────────────────────────────────────────────────
export function ScreenHeader({
  crumb,
  title,
  subtitle,
}: {
  crumb: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="border-b border-border/60 pb-5">
      <MicroLabel>{crumb}</MicroLabel>
      <h1 className="mt-1 font-heading text-2xl">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}

// ─── StickyActionBar ──────────────────────────────────────────────────────────
export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-md px-4 py-3">{children}</div>
    </div>
  );
}
