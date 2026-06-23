// Soroban contract calls for the CodLock escrow, against Testnet RPC.
// Pure helpers (xlmToStroops, classifyError) are unit-tested; the on-chain
// calls are verified manually in the browser.
import {
  rpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Address,
  Asset,
  nativeToScVal,
  scValToNative,
  type xdr,
} from "@stellar/stellar-sdk";
import { SOROBAN_RPC_URL, CONTRACT_ID } from "./constants";

export const sorobanServer = new rpc.Server(SOROBAN_RPC_URL);

// Native XLM's Stellar Asset Contract address on Testnet — computed, never hardcoded.
export const NATIVE_SAC = Asset.native().contractId(Networks.TESTNET);

const STROOPS_PER_XLM = 10_000_000n;

/** Convert an XLM string (up to 7 decimals) to i128 stroops. */
export function xlmToStroops(xlm: string): bigint {
  const [whole, frac = ""] = xlm.trim().split(".");
  const fracPadded = (frac + "0000000").slice(0, 7);
  return BigInt(whole || "0") * STROOPS_PER_XLM + BigInt(fracPadded || "0");
}

export type WalletErrorKind = "no-wallet" | "rejected" | "insufficient" | "unknown";

/** Map any thrown error to one of the three handled categories. */
export function classifyError(e: unknown): WalletErrorKind {
  const msg = (e instanceof Error ? e.message : String(e ?? "")).toLowerCase();
  if (/not installed|no wallet|none selected|not connected|no public key/.test(msg)) return "no-wallet";
  if (/insufficient|underfunded|not enough|low balance/.test(msg)) return "insufficient";
  if (/reject|declin|denied|cancel/.test(msg)) return "rejected";
  return "unknown";
}

export const ERROR_MESSAGE: Record<WalletErrorKind, string> = {
  "no-wallet": "No wallet selected. Please install or pick a wallet to continue.",
  rejected: "You cancelled the transaction in your wallet.",
  insufficient: "Not enough testnet XLM. Fund your wallet from friendbot and try again.",
  unknown: "Something went wrong with the contract call. Please try again.",
};

export type EscrowOrder = {
  buyer: string;
  seller: string;
  token: string;
  amount: string;
  status: string;
};

export type Signer = (xdr: string) => Promise<string>;

// --- scval encoders ---
const addr = (a: string): xdr.ScVal => Address.fromString(a).toScVal();
const i128 = (n: bigint): xdr.ScVal => nativeToScVal(n, { type: "i128" });
const u64 = (n: bigint): xdr.ScVal => nativeToScVal(n, { type: "u64" });

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Build a contract-call tx, simulate+prepare, sign, submit, and poll to success.
async function invoke(
  source: string,
  op: xdr.Operation,
  sign: Signer,
): Promise<{ hash: string; returnValue: xdr.ScVal | undefined }> {
  const account = await sorobanServer.getAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(180)
    .build();

  const prepared = await sorobanServer.prepareTransaction(tx);
  const signedXdr = await sign(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

  const sent = await sorobanServer.sendTransaction(signedTx);
  if (sent.status === "ERROR") {
    throw new Error(`Submission failed: ${JSON.stringify(sent.errorResult)}`);
  }

  let got = await sorobanServer.getTransaction(sent.hash);
  let attempts = 0;
  while (got.status === "NOT_FOUND") {
    if (++attempts >= 40) throw new Error("Timed out waiting for the transaction to settle.");
    await delay(1500);
    got = await sorobanServer.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") {
    throw new Error("The transaction failed on-chain.");
  }
  return { hash: sent.hash, returnValue: got.returnValue };
}

/** Buyer escrows `amountXlm` of native XLM into the contract. Returns order id + tx hash. */
export async function createOrder(p: {
  buyer: string;
  seller: string;
  amountXlm: string;
  sign: Signer;
}): Promise<{ orderId: string; hash: string }> {
  const contract = new Contract(CONTRACT_ID);
  const op = contract.call(
    "create_order",
    addr(p.buyer),
    addr(p.seller),
    addr(NATIVE_SAC),
    i128(xlmToStroops(p.amountXlm)),
  );
  const { hash, returnValue } = await invoke(p.buyer, op, p.sign);
  const orderId = returnValue ? String(scValToNative(returnValue)) : "";
  return { orderId, hash };
}

/** Read an order's current state straight from the chain (read-only, no signing). */
export async function getOrder(publicKey: string, orderId: string): Promise<EscrowOrder> {
  const contract = new Contract(CONTRACT_ID);
  const account = await sorobanServer.getAccount(publicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call("get_order", u64(BigInt(orderId))))
    .setTimeout(30)
    .build();

  const sim = await sorobanServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  const retval = sim.result?.retval;
  if (!retval) throw new Error("No order data returned.");

  const raw = scValToNative(retval) as Record<string, unknown>;
  return {
    buyer: String(raw.buyer ?? ""),
    seller: String(raw.seller ?? ""),
    token: String(raw.token ?? ""),
    amount: String(raw.amount ?? ""),
    status: decodeStatus(raw.status),
  };
}

/** Buyer confirms delivery: releases the escrow to the seller. Returns tx hash. */
export async function confirmDelivery(p: {
  publicKey: string;
  orderId: string;
  sign: Signer;
}): Promise<{ hash: string }> {
  const contract = new Contract(CONTRACT_ID);
  const op = contract.call("confirm_delivery", u64(BigInt(p.orderId)));
  const { hash } = await invoke(p.publicKey, op, p.sign);
  return { hash };
}

// A unit-variant contract enum (Funded/Released/Refunded) may decode as a bare
// string, a single-element array, or a tagged object — normalize all three.
function decodeStatus(s: unknown): string {
  if (Array.isArray(s)) return String(s[0] ?? "");
  if (s && typeof s === "object") {
    const obj = s as Record<string, unknown>;
    return String(obj.tag ?? Object.keys(obj)[0] ?? "");
  }
  return String(s ?? "");
}
