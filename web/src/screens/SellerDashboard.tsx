// ─── Seller Dashboard (desktop) ──────────────────────────────────────────────
// App-shell + metrics-overview dashboard for sellers on wide screens, adapted
// from the Orbit templates to Esko Lokt's LIGHT tokens + real order data.
// Sidebar · top bar · stat cards · orders sparkline · recent activity · table.
// Mobile keeps the simple HomeScreen.

import { useMemo, useState } from "react";
import type { OrderView, OrderStatus } from "../lib/types";
import { StatusPill } from "../ui/primitives";

type Filter = "all" | "active" | "delivered";

const isPast = (iso: string) => new Date(iso) < new Date();
const num = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export function SellerDashboard({
  address,
  orders,
  onNewOrder,
  onOpenOrder,
  onGuide,
  onOffline,
}: {
  address: string;
  orders: OrderView[];
  onNewOrder: () => void;
  onOpenOrder: (ref: string) => void;
  onGuide: () => void;
  onOffline: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    const active = orders.filter(
      (o) => o.status === "awaiting_deposit" || o.status === "funded" || o.status === "shipped",
    ).length;
    const held = orders
      .filter((o) => o.status === "funded" || o.status === "shipped")
      .reduce((sum, o) => sum + num(o.deposit), 0);
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const attention = orders.filter(
      (o) =>
        (o.status === "awaiting_deposit" && isPast(o.deadline)) ||
        (o.status === "shipped" && isPast(o.deadline)),
    ).length;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const newThisWeek = orders.filter((o) => new Date(o.createdIso).getTime() >= weekAgo).length;
    return { active, held, delivered, attention, newThisWeek };
  }, [orders]);

  // Orders created per day over the last 14 days (real sparkline data).
  const spark = useMemo(() => {
    const DAYS = 14;
    const now = Date.now();
    const buckets = new Array(DAYS).fill(0);
    orders.forEach((o) => {
      const daysAgo = Math.floor((now - new Date(o.createdIso).getTime()) / 86_400_000);
      if (daysAgo >= 0 && daysAgo < DAYS) buckets[DAYS - 1 - daysAgo] += 1;
    });
    return buckets;
  }, [orders]);

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdIso).getTime() - new Date(a.createdIso).getTime())
        .slice(0, 5),
    [orders],
  );

  const rows = useMemo(() => {
    if (filter === "active")
      return orders.filter(
        (o) => o.status === "awaiting_deposit" || o.status === "funded" || o.status === "shipped",
      );
    if (filter === "delivered")
      return orders.filter((o) => o.status === "delivered" || o.status === "no_show");
    return orders;
  }, [orders, filter]);

  const initials = address ? address.slice(0, 2).toUpperCase() : "??";
  const shortAddr = address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

  return (
    <div className="grid min-h-svh grid-rows-[56px_1fr] bg-background text-foreground">
      {/* Top bar */}
      <header className="col-span-2 flex h-14 items-center gap-4 border-b border-border/60 bg-background px-4">
        <div className="flex items-center gap-2">
          <BrandLock />
          <span className="font-heading text-sm tracking-tight">Esko Lokt</span>
        </div>
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" /> Test mode
        </span>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={onNewOrder}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PlusIcon /> New order
          </button>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/12 font-mono text-xs text-primary">
            {initials}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-[240px_1fr] overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-60 flex-col border-r border-border/60 bg-foreground/[0.015]">
          <SidebarLabel>Menu</SidebarLabel>
          <nav className="flex flex-col gap-0.5 px-2">
            <SideItem active icon={<HomeIcon />} label="Dashboard" />
            <SideItem icon={<InboxIcon />} label="New order" onClick={onNewOrder} />
            <SideItem icon={<InfoIcon />} label="How it works" onClick={onGuide} />
            <SideItem icon={<PhoneIcon />} label="Pay by text (offline)" onClick={onOffline} />
          </nav>

          <SidebarLabel>Orders</SidebarLabel>
          <nav className="flex flex-col gap-0.5 px-2">
            <SideItem
              active={filter === "all"}
              icon={<DotIcon className="text-muted-foreground" />}
              label="All orders"
              count={orders.length}
              onClick={() => setFilter("all")}
            />
            <SideItem
              active={filter === "active"}
              icon={<DotIcon className="text-sky-500" />}
              label="Active"
              count={stats.active}
              onClick={() => setFilter("active")}
            />
            <SideItem
              active={filter === "delivered"}
              icon={<DotIcon className="text-emerald-500" />}
              label="Finished"
              onClick={() => setFilter("delivered")}
            />
          </nav>

          <div className="mt-auto flex items-center gap-2 border-t border-border/60 px-3 py-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/12 font-mono text-xs text-primary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">Your shop</div>
              <div className="truncate font-mono text-[10px] text-muted-foreground">{shortAddr}</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="overflow-y-auto p-6 lg:p-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Your shop / Dashboard
          </div>
          <h1 className="mt-1 font-heading text-2xl tracking-tight">Dashboard</h1>

          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Active orders"
              value={String(stats.active)}
              pill={stats.newThisWeek > 0 ? `+${stats.newThisWeek} this week` : undefined}
              tone="good"
              sub="waiting or in transit"
            />
            <StatCard
              label="Deposits held"
              value={stats.held.toFixed(2)}
              sub="safely in escrow"
            />
            <StatCard label="Delivered" value={String(stats.delivered)} sub="deposit returned" />
            <StatCard
              label="Need attention"
              value={String(stats.attention)}
              pill={stats.attention > 0 ? "action needed" : undefined}
              tone="warn"
              sub="time ran out"
            />
          </div>

          {/* Chart + activity */}
          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card p-5 lg:col-span-2">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Orders · last 14 days
                  </div>
                  <div className="mt-1 font-heading text-2xl">{orders.length}</div>
                </div>
              </div>
              <div className="mt-6 h-40 w-full">
                <Sparkline data={spark} />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Recent activity
              </div>
              <ul className="mt-4 flex flex-col gap-3.5">
                {recent.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No orders yet.</li>
                ) : (
                  recent.map((o) => (
                    <li key={o.ref} className="flex items-start gap-3 text-sm">
                      <span className={`mt-1 size-2 shrink-0 rounded-full ${statusDot(o.status)}`} />
                      <div className="min-w-0 flex-1 leading-snug">
                        <span className="font-medium">{o.itemName}</span>{" "}
                        <span className="text-muted-foreground">— {statusWord(o.status)}</span>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                          {timeAgo(o.createdIso)}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Orders table */}
          <div className="mt-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {filter === "all" ? "All orders" : filter === "active" ? "Active orders" : "Finished orders"}
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {rows.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No orders here yet.{" "}
                  <button onClick={onNewOrder} className="text-primary hover:underline">
                    Create your first order
                  </button>
                  .
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <th className="px-4 py-2.5 font-normal">Item</th>
                      <th className="px-4 py-2.5 font-normal">Order</th>
                      <th className="px-4 py-2.5 font-normal">Deposit</th>
                      <th className="px-4 py-2.5 font-normal">Status</th>
                      <th className="px-4 py-2.5 font-normal">Time</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rows.map((o) => (
                      <tr
                        key={o.ref}
                        onClick={() => onOpenOrder(o.ref)}
                        className="cursor-pointer transition-colors hover:bg-foreground/[0.03]"
                      >
                        <td className="px-4 py-3 font-medium">{o.itemName}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{o.ref}</td>
                        <td className="px-4 py-3 font-mono tabular-nums">{o.deposit}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={o.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{timeLabel(o)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          <ChevronRight />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeLabel(o: OrderView): string {
  if (o.status === "delivered" || o.status === "no_show") return "Done";
  const ms = new Date(o.deadline).getTime() - Date.now();
  if (ms <= 0) return "Time ran out";
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h >= 1) return `${h}h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const statusWord = (s: OrderStatus): string =>
  ({
    awaiting_deposit: "not paid yet",
    funded: "paid & protected",
    shipped: "on the way",
    delivered: "delivered",
    no_show: "you kept the deposit",
  })[s];

const statusDot = (s: OrderStatus): string =>
  ({
    awaiting_deposit: "bg-amber-500",
    funded: "bg-sky-500",
    shipped: "bg-amber-500",
    delivered: "bg-emerald-500",
    no_show: "bg-rose-500",
  })[s];

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  const W = 600;
  const H = 160;
  const PAD = 8;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => {
    const x = PAD + i * stepX;
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return [x, y] as const;
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `M ${PAD} ${H - PAD} L ${pts.map((p) => p.join(",")).join(" L ")} L ${W - PAD} ${H - PAD} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="esko-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#esko-spark)" className="text-primary" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        vectorEffect="non-scaling-stroke"
      />
      {last && (
        <g className="text-primary">
          <circle cx={last[0]} cy={last[1]} r="6" fill="currentColor" opacity="0.22" />
          <circle cx={last[0]} cy={last[1]} r="2.5" fill="currentColor" />
        </g>
      )}
    </svg>
  );
}

// ─── Small pieces ─────────────────────────────────────────────────────────────
function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
      {children}
    </div>
  );
}

function SideItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
        active ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04]"
      }`}
    >
      <span className="flex size-4 items-center justify-center opacity-70">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {typeof count === "number" ? (
        <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[9px] text-foreground">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function StatCard({
  label,
  value,
  sub,
  pill,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  pill?: string;
  tone?: "good" | "warn";
}) {
  const pillClass =
    tone === "warn"
      ? "bg-amber-500/12 text-amber-600"
      : "bg-emerald-500/12 text-emerald-600";
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-heading text-3xl tracking-tight">{value}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        {pill ? (
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] ${pillClass}`}>
            {pill}
          </span>
        ) : null}
        <span className="text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────
const svg = "size-full";
function BrandLock() {
  return (
    <span className="flex size-6 items-center justify-center rounded-md bg-primary">
      <svg viewBox="0 0 24 24" className="size-3.5" fill="#fff" aria-hidden>
        <rect x="4" y="10.5" width="16" height="10.5" rx="2.4" />
        <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="#fff" strokeWidth="1.9" />
      </svg>
    </span>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 13h4l1.5 2h5L16 13h4" /><path d="M5 5h14l2 8v6H3v-6z" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" />
    </svg>
  );
}
function DotIcon({ className = "" }: { className?: string }) {
  return <span className={`size-2 rounded-sm bg-current ${className}`} />;
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="ml-auto size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
