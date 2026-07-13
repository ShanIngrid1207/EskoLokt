// Fake callbacks + sample data so Mate 1 can build screens with no chain/db.
// At integration the owner swaps these for real functions; screens don't change.
import type { OrderView } from "./lib/types";

export const sampleOrder: OrderView = {
  ref: "EL-7QF2",
  itemName: "Blue cotton tee",
  deposit: "0.50",
  sellerAddress: "GSELLER…DEMO",
  buyerAddress: null,
  deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
  status: "awaiting_deposit",
  txHashes: [],
};

const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));

export const stub = {
  onCreate: async (_i: { itemName: string; deposit: string; deadlineMinutes: number }) => {
    await wait();
    return {
      ref: "EL-7QF2",
      deliveryCode: "8241",
      shareUrl: `${location.origin}/?order=EL-7QF2`,
    };
  },
  onConnect: async () => {
    await wait();
  },
  onGetTestFunds: async () => {
    await wait();
  },
  onAddTrustline: async () => {
    await wait();
  },
  onLockDeposit: async () => {
    await wait();
  },
  onConfirmDelivery: async (_code: string) => {
    await wait();
  },
  onMarkShipped: async () => {
    await wait();
  },
  onClaim: async () => {
    await wait();
  },
};
