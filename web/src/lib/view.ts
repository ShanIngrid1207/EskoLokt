// Maps the Supabase order row → the UI's OrderView, plus id/code generators.
import type { OrderRow, OrderView } from "./types";

export function rowToView(row: OrderRow): OrderView {
  return {
    ref: row.ref,
    itemName: row.item_name,
    deposit: row.deposit,
    sellerAddress: row.seller_address,
    buyerAddress: row.buyer_address,
    deadline: row.deadline,
    createdIso: row.created_at,
    status: row.status,
    txHashes: [],
  };
}

// Ambiguity-free alphabet (no O/0/I/1) for short, readable share refs.
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function genRef(): string {
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `EL-${s}`;
}

// 6-digit numeric delivery code (matches the OrderDetail input).
export function genDeliveryCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
