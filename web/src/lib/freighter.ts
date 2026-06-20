// Thin, version-defensive wrappers around @stellar/freighter-api.
//
// Freighter's API has changed shape across versions: older releases returned
// primitives (a bare boolean, a bare address string), while newer releases
// return objects like { isConnected }, { address, error }, { signedTxXdr, error }.
// Every wrapper below normalizes both shapes so the rest of the app can ignore
// which Freighter version the user has installed.

import {
  isConnected as fIsConnected,
  requestAccess as fRequestAccess,
  getAddress as fGetAddress,
  getNetwork as fGetNetwork,
  signTransaction as fSignTransaction,
} from "@stellar/freighter-api";
import { STELLAR_NETWORK_PASSPHRASE } from "./constants";

function unwrapBool(value: unknown, key: string): boolean {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && key in value) {
    return Boolean((value as Record<string, unknown>)[key]);
  }
  return false;
}

function readError(value: unknown): string | null {
  if (value && typeof value === "object" && "error" in value) {
    const err = (value as Record<string, unknown>).error;
    if (!err) return null;
    if (typeof err === "string") return err;
    if (typeof err === "object" && "message" in err) {
      return String((err as Record<string, unknown>).message);
    }
    return String(err);
  }
  return null;
}

/** Is the Freighter extension present in this browser? */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const res = await fIsConnected();
    return unwrapBool(res, "isConnected");
  } catch {
    return false;
  }
}

/** Prompt the user to authorize this site and return their public key. */
export async function requestWalletAddress(): Promise<string> {
  const res: unknown = await fRequestAccess();
  if (typeof res === "string") return res;
  const err = readError(res);
  if (err) throw new Error(err);
  if (res && typeof res === "object" && "address" in res) {
    const address = String((res as Record<string, unknown>).address ?? "");
    if (address) return address;
  }
  throw new Error("Freighter did not return a wallet address.");
}

/** Read the already-authorized address without prompting (null if none). */
export async function getWalletAddress(): Promise<string | null> {
  try {
    const res: unknown = await fGetAddress();
    if (typeof res === "string") return res || null;
    if (readError(res)) return null;
    if (res && typeof res === "object" && "address" in res) {
      return String((res as Record<string, unknown>).address ?? "") || null;
    }
    return null;
  } catch {
    return null;
  }
}

/** The network Freighter is currently pointed at, normalized. */
export async function getWalletNetwork(): Promise<{ network: string; passphrase: string } | null> {
  try {
    const res: unknown = await fGetNetwork();
    if (typeof res === "string") return { network: res, passphrase: "" };
    if (res && typeof res === "object") {
      const obj = res as Record<string, unknown>;
      return {
        network: String(obj.network ?? ""),
        passphrase: String(obj.networkPassphrase ?? ""),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Ask Freighter to sign an XDR on Testnet; returns the signed XDR. */
export async function signWithFreighter(xdr: string, address: string): Promise<string> {
  const res: unknown = await fSignTransaction(xdr, {
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    address,
  });
  if (typeof res === "string") return res;
  const err = readError(res);
  if (err) throw new Error(err);
  if (res && typeof res === "object" && "signedTxXdr" in res) {
    const signed = String((res as Record<string, unknown>).signedTxXdr ?? "");
    if (signed) return signed;
  }
  throw new Error("Freighter did not return a signed transaction.");
}
