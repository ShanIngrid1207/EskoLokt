// Simulated escrow-order dataset that powers the dashboard. There is no orders
// backend yet, so this stands in for what `get_order` history would return.
// Clearly demo data — the table, filters, chart, and summary are all derived
// from it for real (filtering/sorting actually work).

export type OrderStatus = "Funded" | "Released" | "Refunded";

export interface Order {
  id: string;
  /** display timestamp */
  created: string;
  /** sort key (higher = more recent) */
  ts: number;
  buyer: string;
  seller: string;
  /** amount in USDC */
  amount: number;
  status: OrderStatus;
  /** settlement time in ms */
  settlementMs: number;
}

const addr = (a: string, b: string) => `G${a}…${b}`;

export const ORDERS: Order[] = [
  { id: "ORD-1058", created: "Jun 21 · 14:50", ts: 58, buyer: addr("A3F", "K7Q2"), seller: addr("D9C", "M4T1"), amount: 480, status: "Funded", settlementMs: 0 },
  { id: "ORD-1057", created: "Jun 21 · 14:31", ts: 57, buyer: addr("B7K", "P2X9"), seller: addr("D9C", "M4T1"), amount: 1250, status: "Released", settlementMs: 5120 },
  { id: "ORD-1056", created: "Jun 21 · 13:58", ts: 56, buyer: addr("C2M", "R8L4"), seller: addr("F1A", "Z6N3"), amount: 320, status: "Released", settlementMs: 4870 },
  { id: "ORD-1055", created: "Jun 21 · 13:12", ts: 55, buyer: addr("E5T", "W3J7"), seller: addr("D9C", "M4T1"), amount: 760, status: "Refunded", settlementMs: 5340 },
  { id: "ORD-1054", created: "Jun 21 · 12:40", ts: 54, buyer: addr("A3F", "K7Q2"), seller: addr("H4B", "Q9P0"), amount: 2100, status: "Released", settlementMs: 5010 },
  { id: "ORD-1053", created: "Jun 21 · 11:55", ts: 53, buyer: addr("G8N", "V1C5"), seller: addr("F1A", "Z6N3"), amount: 150, status: "Released", settlementMs: 4690 },
  { id: "ORD-1052", created: "Jun 21 · 11:20", ts: 52, buyer: addr("B7K", "P2X9"), seller: addr("H4B", "Q9P0"), amount: 540, status: "Funded", settlementMs: 0 },
  { id: "ORD-1051", created: "Jun 21 · 10:48", ts: 51, buyer: addr("J2D", "Y7R8"), seller: addr("D9C", "M4T1"), amount: 4800, status: "Released", settlementMs: 5230 },
  { id: "ORD-1050", created: "Jun 21 · 10:02", ts: 50, buyer: addr("C2M", "R8L4"), seller: addr("K6F", "T3W2"), amount: 280, status: "Refunded", settlementMs: 5510 },
  { id: "ORD-1049", created: "Jun 21 · 09:31", ts: 49, buyer: addr("E5T", "W3J7"), seller: addr("F1A", "Z6N3"), amount: 990, status: "Released", settlementMs: 4920 },
  { id: "ORD-1048", created: "Jun 21 · 08:50", ts: 48, buyer: addr("L9G", "X2M6"), seller: addr("H4B", "Q9P0"), amount: 1750, status: "Released", settlementMs: 5080 },
  { id: "ORD-1047", created: "Jun 21 · 08:14", ts: 47, buyer: addr("A3F", "K7Q2"), seller: addr("K6F", "T3W2"), amount: 360, status: "Funded", settlementMs: 0 },
  { id: "ORD-1046", created: "Jun 21 · 07:39", ts: 46, buyer: addr("M1P", "B8K3"), seller: addr("D9C", "M4T1"), amount: 620, status: "Released", settlementMs: 4760 },
  { id: "ORD-1045", created: "Jun 21 · 06:58", ts: 45, buyer: addr("G8N", "V1C5"), seller: addr("F1A", "Z6N3"), amount: 210, status: "Released", settlementMs: 5190 },
];

export const STATUS_META: Record<OrderStatus, { dot: string; tone: string }> = {
  Funded: { dot: "#2f6bff", tone: "info" },
  Released: { dot: "#0f9d6a", tone: "success" },
  Refunded: { dot: "#c87309", tone: "warn" },
};

export function summarize(orders: Order[]) {
  const total = orders.length;
  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const rows = (["Released", "Funded", "Refunded"] as OrderStatus[]).map((s) => {
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
  { label: "now", count: 2 },
];
