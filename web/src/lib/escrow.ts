// Deposit-model contract client for EskoLokt — talks to the deployed escrow
// contract on Stellar Testnet in test USDC. This is the module the integrated
// app uses; the legacy soroban.ts (native-XLM level-2 demo) is retired at
// integration. Self-contained on purpose so it can't disturb the old demo.
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
  xdr,
} from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { SOROBAN_RPC_URL, CONTRACT_ID } from "./constants";

export const server = new rpc.Server(SOROBAN_RPC_URL);

const STROOPS_PER_XLM = 10_000_000n; // 1 XLM = 10,000,000 stroops (7 decimals)

// Native XLM's Stellar Asset Contract address on Testnet — the deposit asset.
// Native needs no issuer/trustline/faucet, so the whole loop works out of the box.
// (Swapping to a USDC SAC later is a one-line change here.)
export const DEPOSIT_SAC = Asset.native().contractId(Networks.TESTNET);

/** Convert an XLM string (up to 7 decimal places) to i128 stroops. */
export function xlmToStroops(v: string): bigint {
  const [whole, frac = ""] = v.trim().split(".");
  const fracPadded = (frac + "0000000").slice(0, 7);
  return BigInt(whole || "0") * STROOPS_PER_XLM + BigInt(fracPadded || "0");
}

// A 32-byte hash (from hex) as an ScVal — the contract's BytesN<32> code_hash.
// The hex itself is produced by hashCode() in ./crypto (sha256 → hex), the same
// value already stored in Supabase, so the app and the chain agree on the commitment.
const bytesN32 = (hex: string): xdr.ScVal =>
  xdr.ScVal.scvBytes(Buffer.from(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16))));
// The raw delivery code bytes as an ScVal — the contract hashes these to compare.
const bytesUtf8 = (text: string): xdr.ScVal =>
  xdr.ScVal.scvBytes(Buffer.from(new TextEncoder().encode(text)));

export type Signer = (xdr: string) => Promise<string>;

export type DepositOrder = {
  buyer: string;
  seller: string;
  token: string;
  amount: string; // base units, as a string
  deadline: string; // unix seconds, as a string
  status: string; // "Funded" | "Returned" | "Claimed"
};

// --- ScVal encoders ---
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
  const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(180)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const signedXdr = await sign(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

  const sent = await server.sendTransaction(signedTx);
  if (sent.status === "ERROR") {
    throw new Error(`Submission failed: ${JSON.stringify(sent.errorResult)}`);
  }

  let got = await server.getTransaction(sent.hash);
  let attempts = 0;
  while (got.status === "NOT_FOUND") {
    if (++attempts >= 40) throw new Error("Timed out waiting for the transaction to settle.");
    await delay(1500);
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") throw new Error("The transaction failed on-chain.");
  return { hash: sent.hash, returnValue: got.returnValue };
}

/** Buyer locks `amountUsdc` USDC as the deposit. Returns the new order id + tx hash. */
export async function createOrder(p: {
  buyer: string;
  seller: string;
  amountXlm: string;
  deadlineUnix: number;
  codeHashHex: string;
  sign: Signer;
}): Promise<{ orderId: string; hash: string }> {
  const op = new Contract(CONTRACT_ID).call(
    "create_order",
    addr(p.buyer),
    addr(p.seller),
    addr(DEPOSIT_SAC),
    i128(xlmToStroops(p.amountXlm)),
    u64(BigInt(p.deadlineUnix)),
    bytesN32(p.codeHashHex),
  );
  const { hash, returnValue } = await invoke(p.buyer, op, p.sign);
  const orderId = returnValue ? String(scValToNative(returnValue)) : "";
  return { orderId, hash };
}

/** Buyer confirms delivery → the deposit is returned to the buyer. Returns tx hash. */
export async function confirmDelivery(p: {
  publicKey: string;
  orderId: string;
  code: string;
  sign: Signer;
}): Promise<{ hash: string }> {
  const op = new Contract(CONTRACT_ID).call(
    "confirm_delivery",
    u64(BigInt(p.orderId)),
    bytesUtf8(p.code),
  );
  const { hash } = await invoke(p.publicKey, op, p.sign);
  return { hash };
}

/** Seller claims the deposit after the deadline (buyer no-show). Returns tx hash. */
export async function claimExpired(p: {
  publicKey: string;
  orderId: string;
  sign: Signer;
}): Promise<{ hash: string }> {
  const op = new Contract(CONTRACT_ID).call("claim_expired", u64(BigInt(p.orderId)));
  const { hash } = await invoke(p.publicKey, op, p.sign);
  return { hash };
}

/** Read an order's live state straight from the chain (read-only, no signing). */
export async function getOrder(publicKey: string, orderId: string): Promise<DepositOrder> {
  const account = await server.getAccount(publicKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(new Contract(CONTRACT_ID).call("get_order", u64(BigInt(orderId))))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
  const retval = sim.result?.retval;
  if (!retval) throw new Error("No order data returned.");

  const raw = scValToNative(retval) as Record<string, unknown>;
  return {
    buyer: String(raw.buyer ?? ""),
    seller: String(raw.seller ?? ""),
    token: String(raw.token ?? ""),
    amount: String(raw.amount ?? ""),
    deadline: String(raw.deadline ?? ""),
    status: decodeStatus(raw.status),
  };
}

// A unit-variant contract enum (Funded/Returned/Claimed) may decode as a bare
// string, a single-element array, or a tagged object — normalize all three.
function decodeStatus(s: unknown): string {
  if (Array.isArray(s)) return String(s[0] ?? "");
  if (s && typeof s === "object") {
    const obj = s as Record<string, unknown>;
    return String(obj.tag ?? Object.keys(obj)[0] ?? "");
  }
  return String(s ?? "");
}
