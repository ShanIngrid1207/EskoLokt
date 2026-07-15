// Simulated order dataset that powers the dashboard. There is no orders backend
// yet, so this stands in for the order history the contract would return.
// Written in a seller's language (customer names, shop names, pesos) so it reads
// like Joy's own order list, not a blockchain explorer. The table, filters,
// chart, and summary are all derived from it for real (filtering/sorting work).

// Plain-language order states a seller understands:
//   Held     — customer has paid, money is locked safely until delivery
//   Paid     — parcel delivered, money released to the seller
//   Refunded — parcel returned, money sent back to the customer
export type OrderStatus = "Held" | "Paid" | "Refunded";

export interface Order {
  id: string;
  /** display timestamp */
  created: string;
  /** sort key (higher = more recent) */
  ts: number;
  /** the person who ordered */
  buyer: string;
  /** the shop selling */
  seller: string;
  /** amount in pesos (₱) */
  amount: number;
  status: OrderStatus;
  /** how fast the money settled, in ms (0 = still held) */
  settlementMs: number;
}

export const ORDERS: Order[] = [
  { id: "ORD-1058", created: "Jun 21 · 14:50", ts: 58, buyer: "Maria Santos", seller: "Joy's Closet", amount: 480, status: "Held", settlementMs: 0 },
  { id: "ORD-1057", created: "Jun 21 · 14:31", ts: 57, buyer: "Ben Cruz", seller: "Joy's Closet", amount: 1250, status: "Paid", settlementMs: 5120 },
  { id: "ORD-1056", created: "Jun 21 · 13:58", ts: 56, buyer: "Liza Reyes", seller: "Manila Threads", amount: 320, status: "Paid", settlementMs: 4870 },
  { id: "ORD-1055", created: "Jun 21 · 13:12", ts: 55, buyer: "Carlo Mendoza", seller: "Joy's Closet", amount: 760, status: "Refunded", settlementMs: 5340 },
  { id: "ORD-1054", created: "Jun 21 · 12:40", ts: 54, buyer: "Maria Santos", seller: "Cebu Finds", amount: 2100, status: "Paid", settlementMs: 5010 },
  { id: "ORD-1053", created: "Jun 21 · 11:55", ts: 53, buyer: "Anna Lim", seller: "Manila Threads", amount: 150, status: "Paid", settlementMs: 4690 },
  { id: "ORD-1052", created: "Jun 21 · 11:20", ts: 52, buyer: "Ben Cruz", seller: "Cebu Finds", amount: 540, status: "Held", settlementMs: 0 },
  { id: "ORD-1051", created: "Jun 21 · 10:48", ts: 51, buyer: "Paolo Tan", seller: "Joy's Closet", amount: 4800, status: "Paid", settlementMs: 5230 },
  { id: "ORD-1050", created: "Jun 21 · 10:02", ts: 50, buyer: "Liza Reyes", seller: "Davao Style", amount: 280, status: "Refunded", settlementMs: 5510 },
  { id: "ORD-1049", created: "Jun 21 · 09:31", ts: 49, buyer: "Carlo Mendoza", seller: "Manila Threads", amount: 990, status: "Paid", settlementMs: 4920 },
  { id: "ORD-1048", created: "Jun 21 · 08:50", ts: 48, buyer: "Grace Yu", seller: "Cebu Finds", amount: 1750, status: "Paid", settlementMs: 5080 },
  { id: "ORD-1047", created: "Jun 21 · 08:14", ts: 47, buyer: "Maria Santos", seller: "Davao Style", amount: 360, status: "Held", settlementMs: 0 },
  { id: "ORD-1046", created: "Jun 21 · 07:39", ts: 46, buyer: "Rico Dela Cruz", seller: "Joy's Closet", amount: 620, status: "Paid", settlementMs: 4760 },
  { id: "ORD-1045", created: "Jun 21 · 06:58", ts: 45, buyer: "Anna Lim", seller: "Manila Threads", amount: 210, status: "Paid", settlementMs: 5190 },
];

export const STATUS_META: Record<OrderStatus, { dot: string; tone: string }> = {
  Held: { dot: "#2f6bff", tone: "info" },
  Paid: { dot: "#0f9d6a", tone: "success" },
  Refunded: { dot: "#c87309", tone: "warn" },
};

export function summarize(orders: Order[]) {
  const total = orders.length;
  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const rows = (["Paid", "Held", "Refunded"] as OrderStatus[]).map((s) => {
    const count = byStatus(s);
    return { status: s, count, pct: total ? Math.round((count / total) * 1000) / 10 : 0 };
  });
  const volume = orders.reduce((sum, o) => sum + o.amount, 0);
  return { total, rows, volume };
}

// Orders bucketed across the day for the bar chart (deterministic, demo).
export const VOLUME_BUCKETS: { label: string; count: number }[] = [
  { label: "06:00", count: 1 },
  { label: "08:00", count: 2 },
  { label: "10:00", count: 3 },
  { label: "12:00", count: 2 },
  { label: "14:00", count: 3 },
  { label: "16:00", count: 1 },
  { label: "now",   count: 2 },
];

// Cumulative order counts per shop, aligned to VOLUME_BUCKETS time slots.
// Powers the "Channel sales" step-line chart.
export const CHANNEL_SERIES: { name: string; color: string; steps: number[] }[] = [
  { name: "Joy's Closet",   color: "#3b82f6", steps: [0, 1, 2, 3, 4, 4, 5] },
  { name: "Manila Threads", color: "#10b981", steps: [0, 1, 1, 2, 2, 3, 3] },
  { name: "Cebu Finds",     color: "#f59e0b", steps: [0, 0, 1, 1, 2, 3, 3] },
  { name: "Davao Style",    color: "#8b5cf6", steps: [0, 0, 0, 1, 1, 1, 2] },
];
