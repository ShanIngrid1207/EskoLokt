// Reusable wallet state + actions. All Freighter/Horizon/SDK calls funnel through
// the lib/ modules; this hook just orchestrates state for the UI.
import { useCallback, useEffect, useState } from "react";
import {
  openWalletPicker,
  getKitAddress,
  signWithKit,
  restoreWalletId,
  setKitWallet,
} from "../lib/walletKit";
import {
  fetchXlmBalance,
  buildPaymentXdr,
  submitSignedXdr,
  explainSubmitError,
  isValidStellarPublicKey,
  validateAmount,
} from "../lib/stellar";

const STORAGE_KEY = "codlock.wallet.publicKey";
// XLM kept un-spendable to cover the base reserve (~1 XLM) plus fees.
const MIN_RESERVE_XLM = 1.5;

export type BalanceStatus = "idle" | "loading" | "funded" | "unfunded" | "error";
export type TxStatus = "idle" | "pending" | "success" | "error";

export interface SendParams {
  destination: string;
  amount: string;
  memo?: string;
}

const isRejection = (msg: string) => /reject|denied|declin|user declined/i.test(msg);

export function useStellarWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [installed, setInstalled] = useState<boolean | null>(null); // null = still checking
  const [network, setNetwork] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [balance, setBalance] = useState<string | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>("idle");
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const isConnected = Boolean(publicKey);
  const spendableBalance = balance ? Math.max(0, Number(balance) - MIN_RESERVE_XLM) : 0;

  const refreshBalance = useCallback(
    async (pk?: string) => {
      const key = pk ?? publicKey;
      if (!key) return;
      setBalanceStatus("loading");
      setBalanceError(null);
      const res = await fetchXlmBalance(key);
      if (res.status === "funded") {
        setBalance(res.xlm);
        setBalanceStatus("funded");
      } else if (res.status === "unfunded") {
        setBalance(null);
        setBalanceStatus("unfunded");
      } else {
        setBalance(null);
        setBalanceStatus("error");
        setBalanceError(res.message);
      }
    },
    [publicKey],
  );

  // On mount: the multi-wallet picker is always available. Restore a previously
  // chosen wallet if its address is still exposed.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInstalled(true);
      const savedId = restoreWalletId();
      if (!savedId) return;
      setKitWallet(savedId);

      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const current = await getKitAddress();
      if (cancelled) return;
      if (current && (!stored || current === stored)) {
        setPublicKey(current);
        setNetwork("TESTNET");
        if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, current);
        await refreshBalance(current);
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshBalance]);

  const connect = useCallback(async () => {
    setConnectError(null);
    setIsConnecting(true);
    try {
      const address = await openWalletPicker(); // opens the multi-wallet modal
      setInstalled(true);
      setNetwork("TESTNET");
      setPublicKey(address);
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, address);
      await refreshBalance(address);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to connect a wallet.";
      setConnectError(isRejection(msg) ? "Connection request was rejected in your wallet." : msg);
    } finally {
      setIsConnecting(false);
    }
  }, [refreshBalance]);

  // Clears the in-app session only. (Freighter has no API to revoke site permission.)
  const disconnect = useCallback(() => {
    setPublicKey(null);
    setNetwork(null);
    setBalance(null);
    setBalanceStatus("idle");
    setBalanceError(null);
    setTxStatus("idle");
    setTxHash(null);
    setTxError(null);
    setConnectError(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const sendPayment = useCallback(
    async ({ destination, amount, memo }: SendParams) => {
      setTxError(null);
      setTxHash(null);
      setTxStatus("idle");

      const dest = destination.trim();
      if (!publicKey) return fail("Connect your wallet first.");
      if (!dest) return fail("Enter a destination address.");
      if (!isValidStellarPublicKey(dest)) return fail("Destination is not a valid Stellar public key.");
      if (dest === publicKey) return fail("You can't send to your own address.");
      const amt = validateAmount(amount, spendableBalance);
      if (!amt.ok) return fail(amt.reason);

      setIsSending(true);
      setTxStatus("pending");
      try {
        const xdr = await buildPaymentXdr({ source: publicKey, destination: dest, amount, memo });
        const signed = await signWithKit(xdr, publicKey);
        const hash = await submitSignedXdr(signed);
        setTxHash(hash);
        setTxStatus("success");
        await refreshBalance(publicKey);
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : "";
        setTxStatus("error");
        setTxError(isRejection(raw) ? "Signing was rejected in your wallet." : explainSubmitError(e));
      } finally {
        setIsSending(false);
      }

      function fail(reason: string) {
        setTxStatus("error");
        setTxError(reason);
      }
    },
    [publicKey, spendableBalance, refreshBalance],
  );

  return {
    // connection
    publicKey,
    isConnected,
    installed,
    network,
    isConnecting,
    connectError,
    connect,
    disconnect,
    // balance
    balance,
    balanceStatus,
    balanceError,
    spendableBalance,
    refreshBalance,
    // transaction
    isSending,
    txStatus,
    txHash,
    txError,
    sendPayment,
  };
}
