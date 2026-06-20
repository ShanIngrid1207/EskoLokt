// Horizon access, transaction building, and validation helpers for Stellar Testnet.
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Networks,
  BASE_FEE,
  StrKey,
} from "@stellar/stellar-sdk";
import { STELLAR_HORIZON_URL } from "./constants";

// Single shared Horizon client pointed at Testnet.
export const server = new Horizon.Server(STELLAR_HORIZON_URL);

/** True if `value` is a valid Stellar (ed25519) public key. */
export function isValidStellarPublicKey(value: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(value);
  } catch {
    return false;
  }
}

export type AmountValidation = { ok: true } | { ok: false; reason: string };

/** Validate a user-entered XLM amount string. */
export function validateAmount(value: string, maxSpendable?: number): AmountValidation {
  const v = value.trim();
  if (!v) return { ok: false, reason: "Enter an amount." };
  if (/e/i.test(v)) return { ok: false, reason: "Scientific notation is not allowed." };
  if (!/^\d*\.?\d+$/.test(v)) return { ok: false, reason: "Amount must be a positive number." };
  const decimals = v.includes(".") ? v.split(".")[1].length : 0;
  if (decimals > 7) return { ok: false, reason: "XLM supports at most 7 decimal places." };
  const num = Number(v);
  if (!Number.isFinite(num) || num <= 0) return { ok: false, reason: "Amount must be greater than 0." };
  if (maxSpendable !== undefined && num > maxSpendable) {
    return { ok: false, reason: `Amount exceeds your spendable balance (~${maxSpendable.toFixed(7)} XLM).` };
  }
  return { ok: true };
}

export type BalanceResult =
  | { status: "funded"; xlm: string }
  | { status: "unfunded" }
  | { status: "error"; message: string };

/** Load the native XLM balance for an account from Horizon. */
export async function fetchXlmBalance(publicKey: string): Promise<BalanceResult> {
  try {
    const account = await server.loadAccount(publicKey);
    const native = account.balances.find((b) => b.asset_type === "native");
    return { status: "funded", xlm: native ? native.balance : "0" };
  } catch (e: unknown) {
    // Horizon returns 404 for an account that has not been created/funded yet.
    if (isNotFound(e)) return { status: "unfunded" };
    return { status: "error", message: errMessage(e) || "Failed to load balance from Horizon." };
  }
}

/** Build an unsigned Testnet payment transaction and return its XDR. */
export async function buildPaymentXdr(params: {
  source: string;
  destination: string;
  amount: string;
  memo?: string;
}): Promise<string> {
  const { source, destination, amount, memo } = params;
  const sourceAccount = await server.loadAccount(source);

  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      }),
    )
    .setTimeout(180);

  if (memo && memo.trim()) {
    builder.addMemo(Memo.text(memo.trim()));
  }

  return builder.build().toXDR();
}

/** Submit a signed XDR to Testnet and return the transaction hash. */
export async function submitSignedXdr(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const res = await server.submitTransaction(tx);
  return res.hash;
}

/** Turn a Horizon submission error into a user-friendly message. */
export function explainSubmitError(e: unknown): string {
  const extras = getNested(e, ["response", "data", "extras"]);
  const codes = extras && typeof extras === "object" ? (extras as Record<string, unknown>).result_codes : null;
  if (codes && typeof codes === "object") {
    const c = codes as Record<string, unknown>;
    const ops = Array.isArray(c.operations) ? c.operations.join(", ") : String(c.operations ?? "");
    if (/op_no_destination/.test(ops)) {
      return "The destination account does not exist on Testnet yet — it must be created/funded first.";
    }
    if (/op_underfunded/.test(ops)) {
      return "Insufficient balance to cover this amount plus fees.";
    }
    if (c.transaction) {
      return `Transaction rejected by the network (${String(c.transaction)}${ops ? `, ${ops}` : ""}).`;
    }
  }
  return errMessage(e) || "Transaction submission failed.";
}

// --- small internal helpers ---

function isNotFound(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const status = getNested(e, ["response", "status"]);
  if (status === 404) return true;
  const name = (e as Record<string, unknown>).name;
  if (name === "NotFoundError") return true;
  return /not found/i.test(errMessage(e));
}

function errMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as Record<string, unknown>).message ?? "");
  }
  return typeof e === "string" ? e : "";
}

function getNested(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === "object" && key in cur) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}
