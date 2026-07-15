// ─── Delivery-code local store ───────────────────────────────────────────────
// The plaintext delivery code is only ever generated once, at create time — the
// server keeps just a hash of it (delivery_code_hash) so it can't be recovered
// server-side. To let the SELLER look the code up again (to write on a parcel),
// we stash the plaintext in their own browser, keyed by order ref. It never
// leaves this device — safe, since it's the seller's own secret to hand out.

const KEY = (ref: string) => `eskolokt.code.${ref}`;

export function saveDeliveryCode(ref: string, code: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY(ref), code);
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
}

/** The saved code for this order, or null if it wasn't created on this device. */
export function getDeliveryCode(ref: string): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(KEY(ref)) : null;
  } catch {
    return null;
  }
}
