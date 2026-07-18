// ─── Custom shop name (local) ────────────────────────────────────────────────
// Sellers can rename their shop from "Your shop" to anything they like. The name
// is purely cosmetic, so we keep it in the seller's own browser, keyed by their
// wallet address — different wallets on the same device get different names, and
// nothing goes on-chain or over the network. If unset, callers fall back to the
// default label.

import { useCallback, useSyncExternalStore } from "react";

const DEFAULT_NAME = "Your shop";
const KEY = (address: string) => `eskolokt.shopName.${address}`;

/** The saved shop name for this wallet, or null if none was set on this device. */
export function getShopName(address: string): string | null {
  try {
    if (typeof window === "undefined" || !address) return null;
    const v = window.localStorage.getItem(KEY(address));
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

/** Save (or clear, when blank) the custom shop name for this wallet. */
export function setShopName(address: string, name: string): void {
  try {
    if (typeof window === "undefined" || !address) return;
    const trimmed = name.trim();
    if (trimmed) window.localStorage.setItem(KEY(address), trimmed);
    else window.localStorage.removeItem(KEY(address));
    // Notify same-tab subscribers (the `storage` event only fires cross-tab).
    window.dispatchEvent(new Event(SHOPNAME_EVENT));
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
}

// ─── React binding ───────────────────────────────────────────────────────────
// A tiny store so every place that shows the shop name re-renders together the
// moment it's renamed, without prop-drilling.

const SHOPNAME_EVENT = "eskolokt:shopname";

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SHOPNAME_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SHOPNAME_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * The shop's display name for this wallet, plus a `rename` setter and the
 * `isCustom` flag. Falls back to "Your shop" when nothing is saved.
 */
export function useShopName(address: string): {
  name: string;
  isCustom: boolean;
  rename: (name: string) => void;
} {
  const stored = useSyncExternalStore(
    subscribe,
    () => getShopName(address),
    () => null,
  );
  const rename = useCallback((name: string) => setShopName(address, name), [address]);
  return { name: stored ?? DEFAULT_NAME, isCustom: stored !== null, rename };
}
