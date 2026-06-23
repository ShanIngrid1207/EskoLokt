// Drives the live escrow loop: lock (create_order) → refresh (get_order) →
// release (confirm_delivery). Tracks transaction status and friendly errors.
import { useCallback, useState } from "react";
import {
  createOrder,
  getOrder,
  confirmDelivery,
  classifyError,
  ERROR_MESSAGE,
  type EscrowOrder,
} from "../lib/soroban";
import { signWithKit } from "../lib/walletKit";

export type EscrowStatus = "idle" | "pending" | "success" | "error";

export function useEscrow(publicKey: string | null) {
  const [status, setStatus] = useState<EscrowStatus>("idle");
  const [action, setAction] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<EscrowOrder | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey || !orderId) return;
    try {
      setOrder(await getOrder(publicKey, orderId));
    } catch {
      /* a failed read shouldn't blow away the success state; leave order as-is */
    }
  }, [publicKey, orderId]);

  const lock = useCallback(
    async (seller: string, amountXlm: string) => {
      if (!publicKey) {
        setStatus("error");
        setAction("Lock funds");
        setError(ERROR_MESSAGE["no-wallet"]);
        return;
      }
      setStatus("pending");
      setAction("Lock funds");
      setHash(null);
      setError(null);
      try {
        const sign = (xdr: string) => signWithKit(xdr, publicKey);
        const { orderId: id, hash: h } = await createOrder({ buyer: publicKey, seller, amountXlm, sign });
        setOrderId(id);
        setHash(h);
        setStatus("success");
        try {
          setOrder(await getOrder(publicKey, id));
        } catch {
          /* read-back failure must not demote a confirmed success */
        }
      } catch (e) {
        setStatus("error");
        setError(ERROR_MESSAGE[classifyError(e)]);
      }
    },
    [publicKey],
  );

  const release = useCallback(async () => {
    if (!publicKey || !orderId) return;
    setStatus("pending");
    setAction("Release to seller");
    setHash(null);
    setError(null);
    try {
      const sign = (xdr: string) => signWithKit(xdr, publicKey);
      const { hash: h } = await confirmDelivery({ publicKey, orderId, sign });
      setHash(h);
      setStatus("success");
      try {
        setOrder(await getOrder(publicKey, orderId));
      } catch {
        /* read-back failure must not demote a confirmed success */
      }
    } catch (e) {
      setStatus("error");
      setError(ERROR_MESSAGE[classifyError(e)]);
    }
  }, [publicKey, orderId]);

  const reset = useCallback(() => {
    setStatus("idle");
    setAction(null);
    setHash(null);
    setError(null);
    setOrderId(null);
    setOrder(null);
  }, []);

  return { status, action, hash, error, orderId, order, lock, refresh, release, reset };
}
