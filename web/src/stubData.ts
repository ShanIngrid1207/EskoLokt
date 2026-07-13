// ─── Stub callbacks for the mobile UI dev harness ────────────────────────────
// The owner swaps these out for real Soroban/wallet implementations at
// integration time.  Screens only import from here + lib/types.ts.

import type { OrderView, OrderStatus } from "./lib/types";

// ─── Helper ──────────────────────────────────────────────────────────────────
const delay = (ms = 1500) => new Promise<void>((r) => setTimeout(r, ms));

const SHORT_ADDR = (prefix: string) =>
  `G${prefix}XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`.slice(0, 56);

// ─── Sample orders (one per status) ──────────────────────────────────────────
export const SAMPLE_ORDERS: OrderView[] = [
  {
    ref: "ORD-001",
    itemName: "Blue Cotton Tee",
    deposit: "0.50",
    sellerAddress: SHORT_ADDR("SELLER"),
    buyerAddress: SHORT_ADDR("BUYER1"),
    deadline: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    status: "awaiting_deposit",
  },
  {
    ref: "ORD-002",
    itemName: "Floral Dress (M)",
    deposit: "1.00",
    sellerAddress: SHORT_ADDR("SELLER"),
    buyerAddress: SHORT_ADDR("BUYER2"),
    deadline: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
    status: "funded",
    txHashes: [
      {
        label: "Deposit locked",
        hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      },
    ],
  },
  {
    ref: "ORD-003",
    itemName: "Crochet Bag",
    deposit: "0.75",
    sellerAddress: SHORT_ADDR("SELLER"),
    buyerAddress: SHORT_ADDR("BUYER3"),
    deadline: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    status: "shipped",
    txHashes: [
      {
        label: "Deposit locked",
        hash: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
      },
    ],
  },
  {
    ref: "ORD-004",
    itemName: "Vintage Denim Jacket",
    deposit: "2.00",
    sellerAddress: SHORT_ADDR("SELLER"),
    buyerAddress: SHORT_ADDR("BUYER4"),
    deadline: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // past
    status: "delivered",
    txHashes: [
      {
        label: "Deposit locked",
        hash: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      },
      {
        label: "Deposit refunded",
        hash: "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
      },
    ],
  },
  {
    ref: "ORD-005",
    itemName: "Silk Scarf",
    deposit: "0.50",
    sellerAddress: SHORT_ADDR("SELLER"),
    buyerAddress: SHORT_ADDR("BUYER5"),
    deadline: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // past
    status: "no_show",
    txHashes: [
      {
        label: "Deposit locked",
        hash: "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
      },
      {
        label: "Seller claimed",
        hash: "f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1",
      },
    ],
  },
];

// ─── Stub callback implementations ───────────────────────────────────────────

/** Seller creates a new order → returns ref, delivery code, share URL */
export async function onCreate(input: {
  itemName: string;
  deposit: string;
  deadlineMinutes: number;
}): Promise<{ ref: string; deliveryCode: string; shareUrl: string }> {
  await delay(1200);
  const ref = `ORD-${String(Math.floor(Math.random() * 900) + 100)}`;
  const deliveryCode = String(Math.floor(100000 + Math.random() * 900000));
  const shareUrl = `https://esko.lokt/order/${ref}`;
  console.log("[stub] onCreate", input, "→", { ref, deliveryCode, shareUrl });
  return { ref, deliveryCode, shareUrl };
}

/** Buyer connects their Freighter wallet */
export async function onConnect(): Promise<void> {
  await delay(800);
  console.log("[stub] onConnect → ok");
}

/** Buyer locks a deposit for the current order */
export async function onLockDeposit(): Promise<void> {
  await delay(2000);
  console.log("[stub] onLockDeposit → ok");
}

/** Buyer confirms delivery using a 6-digit code */
export async function onConfirmDelivery(code: string): Promise<void> {
  await delay(2000);
  if (code.length !== 6) throw new Error("Delivery code must be 6 digits.");
  console.log("[stub] onConfirmDelivery", code, "→ ok");
}

/** Seller marks the parcel as shipped */
export async function onMarkShipped(): Promise<void> {
  await delay(1500);
  console.log("[stub] onMarkShipped → ok");
}

/** Seller claims the deposit after a no-show timeout */
export async function onClaim(): Promise<void> {
  await delay(2000);
  console.log("[stub] onClaim → ok");
}

/** Agent funds the connected wallet with testnet XLM */
export async function onGetTestFunds(): Promise<void> {
  await delay(2500);
  console.log("[stub] onGetTestFunds → ok");
}

/** Adds a USDC trustline on behalf of the connected wallet */
export async function onAddTrustline(): Promise<void> {
  await delay(2000);
  console.log("[stub] onAddTrustline → ok");
}

// ─── Convenience: a single representative OrderView per screen ────────────────
export const STUB_ORDER_FUNDED: OrderView = SAMPLE_ORDERS[1];
export const STUB_ORDER_SHIPPED: OrderView = SAMPLE_ORDERS[2];
export const STUB_CONNECTED_ADDRESS = SHORT_ADDR("MYADDR");

// ─── All statuses grouped for easy iteration ──────────────────────────────────
export const ALL_STATUSES: OrderStatus[] = [
  "awaiting_deposit",
  "funded",
  "shipped",
  "delivered",
  "no_show",
];
