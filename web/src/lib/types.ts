// ─── Order domain types ──────────────────────────────────────────────────────
// Exact types from yohan-1-ui.md.  Used by all screens; never import from
// soroban.ts, orders.ts, or wallet.ts — only stubData.ts + types.ts.

export type OrderStatus =
  | "awaiting_deposit"
  | "funded"
  | "shipped"
  | "delivered"
  | "no_show";

export type OrderView = {
  ref: string;
  itemName: string;
  deposit: string; // "0.50"
  sellerAddress: string;
  buyerAddress: string | null;
  deadline: string; // ISO-8601
  status: OrderStatus;
  txHashes?: { label: string; hash: string }[];
};
