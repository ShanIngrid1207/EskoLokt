// Shared types — the vocabulary every track uses. Frozen: don't rename fields
// without telling all three tracks (they're the integration contract).

export type OrderStatus =
  | "awaiting_deposit" // seller created it; buyer hasn't locked the deposit
  | "funded" // deposit locked on-chain
  | "shipped" // seller marked the parcel shipped
  | "delivered" // buyer confirmed → deposit returned to buyer
  | "no_show"; // seller claimed after deadline → deposit to seller

// A row in the Supabase order book (Mate 2 owns the table).
export type OrderRow = {
  id: string;
  ref: string; // short share code, e.g. "EL-7QF2"
  item_name: string;
  deposit: string; // USDC, human string e.g. "0.50"
  seller_address: string;
  buyer_address: string | null;
  deadline: string; // ISO 8601
  delivery_code_hash: string;
  onchain_order_id: number | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

// The view model the UI screens consume (Mate 1 builds against this).
export type OrderView = {
  ref: string;
  itemName: string;
  deposit: string; // "0.50"
  sellerAddress: string;
  buyerAddress: string | null;
  deadline: string; // ISO
  createdIso: string; // ISO — when the order was created
  status: OrderStatus;
  txHashes?: { label: string; hash: string }[];
};
