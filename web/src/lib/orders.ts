// web/src/lib/orders.ts — the app's only door to the order book.
import { supabase } from "./supabase";
import { hashCode } from "./crypto";
import type { OrderRow, OrderStatus } from "./types";

export async function createOrderRecord(input: {
  ref: string; item_name: string; deposit: string;
  seller_address: string; deadline: string; delivery_code_hash: string;
}): Promise<OrderRow> {
  const { data, error } = await supabase.from("orders").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

export async function getOrderByRef(ref: string): Promise<OrderRow | null> {
  const { data, error } = await supabase.from("orders").select("*").eq("ref", ref).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OrderRow) ?? null;
}

export async function attachBuyer(ref: string, buyer_address: string, onchain_order_id: number): Promise<void> {
  const { error } = await supabase.from("orders")
    .update({ buyer_address, onchain_order_id, status: "funded" as OrderStatus })
    .eq("ref", ref);
  if (error) throw new Error(error.message);
}

export async function updateStatus(ref: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("ref", ref);
  if (error) throw new Error(error.message);
}

/** Give a not-yet-paid order a fresh deadline so the same link can be reused
 *  instead of creating a new order. Only meaningful before the buyer pays
 *  (the on-chain deadline is set from this value at payment time). */
export async function renewOrderDeadline(ref: string, deadline: string): Promise<void> {
  const { error } = await supabase.from("orders").update({ deadline }).eq("ref", ref);
  if (error) throw new Error(error.message);
}

export async function verifyDeliveryCode(ref: string, code: string): Promise<boolean> {
  const row = await getOrderByRef(ref);
  if (!row) return false;
  const hash = await hashCode(code.trim().toUpperCase());
  return hash === row.delivery_code_hash;
}

export async function listOrdersForAddress(address: string): Promise<OrderRow[]> {
  const { data, error } = await supabase.from("orders").select("*")
    .or(`seller_address.eq.${address},buyer_address.eq.${address}`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

export function subscribeToOrder(ref: string, cb: (row: OrderRow) => void): () => void {
  const channel = supabase
    .channel(`order:${ref}`)
    .on("postgres_changes",
      { event: "*", schema: "public", table: "orders", filter: `ref=eq.${ref}` },
      (payload) => cb(payload.new as OrderRow))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
