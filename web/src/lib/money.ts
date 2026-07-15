// ─── Money formatting ────────────────────────────────────────────────────────
// The deposit moves on-chain as native XLM (Stellar lumens, Testnet). But most
// buyers/sellers think in pesos, so everywhere we show an amount we show XLM as
// the truth and a "≈ ₱…" helper beside it.
//
// This is an APPROXIMATE display rate only — the chain always moves XLM, never
// pesos. Edit XLM_TO_PHP below to match the going rate whenever you like.
export const XLM_TO_PHP = 6.5;

const PHP = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

/** Parse a free-text deposit string ("0.50", "50", "") into a number. */
export function parseXlm(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** "0.5" → "0.50 XLM" (trims to a clean, readable amount). */
export function fmtXlm(value: string | number): string {
  const n = typeof value === "number" ? value : parseXlm(value);
  // Up to 4 decimals, but drop trailing zeros beyond 2 for readability.
  const clean = Number.parseFloat(n.toFixed(4));
  return `${clean} XLM`;
}

/** "0.50" XLM → "≈ ₱3.25" using the display rate above. */
export function fmtPhp(value: string | number): string {
  const n = typeof value === "number" ? value : parseXlm(value);
  return `≈ ${PHP.format(n * XLM_TO_PHP)}`;
}
