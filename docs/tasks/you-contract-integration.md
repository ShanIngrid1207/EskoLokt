# Brief — Owner: contract, USDC, wallet, chain glue, integration, deploy

This is the AI-heavy track (you have paid AI). It has three jobs: **(1) unblock your mates
with a Phase-0 scaffold**, **(2) do the on-chain work**, **(3) integrate everything and
deploy to Vercel.** The contract TDD tasks live in the master plan
([`../superpowers/plans/2026-07-11-real-deposit-escrow-prototype.md`](../superpowers/plans/2026-07-11-real-deposit-escrow-prototype.md), Tasks C1–C2).

---

## Phase 0 — Scaffold (do FIRST; unblocks both mates)

> **IMPLEMENTED 2026-07-13 (with two improvements over the draft below):**
> (1) tokens live in a **new `web/src/tailwind.css`** under **`--el-*`** names (not prepended
> into `styles.css`) so they don't collide with the old demo's hex `--primary`/`--border`;
> (2) Tailwind colors use `hsl(var(--el-x) / <alpha-value>)` so `/opacity` classes work.
> Files created: `tailwind.config.js`, `postcss.config.js`, `src/tailwind.css`, `src/lib/types.ts`,
> `src/lib/crypto.ts`, `.env.example`, `src/stubData.ts`, `src/DevHarness.tsx`; `src/main.tsx`
> imports `tailwind.css` and renders `DevHarness` at `?dev=1`. Only remaining manual step:
> `npm install -D tailwindcss@^3.4.17 postcss autoprefixer` in `web/` (pin **v3** —
the config is v3-style; Tailwind v4 uses a different setup and would break it).

### P0.1 Tailwind + light-mode tokens
- [ ] In `web/`: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
- [ ] `web/tailwind.config.js`:
```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
    "muted-foreground": "hsl(var(--muted-foreground))", border: "hsl(var(--border))",
    input: "hsl(var(--input))", ring: "hsl(var(--ring))", card: "hsl(var(--card))",
    primary: "hsl(var(--primary))", "primary-foreground": "hsl(var(--primary-foreground))",
  }, fontFamily: {
    heading: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
    mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
  } } },
  plugins: [],
};
```
- [ ] Prepend to `web/src/styles.css` (keep existing styles below it):
```css
@tailwind base; @tailwind components; @tailwind utilities;
:root {
  --background: 0 0% 100%;          --foreground: 220 20% 12%;
  --muted-foreground: 220 10% 45%;  --border: 220 13% 88%;
  --input: 220 13% 85%;             --ring: 152 45% 40%;
  --card: 0 0% 100%;
  --primary: 152 55% 38%;           /* brand green — TODO: match exact brand hex */
  --primary-foreground: 0 0% 100%;
}
```
- [ ] Verify: `npm run dev`, add `<div className="text-primary">green</div>` somewhere — it renders green. Commit.

### P0.2 Shared types + crypto + env
- [ ] `web/src/lib/types.ts` — the frozen `OrderStatus`, `OrderRow` (from the plan) **plus**:
```ts
export type OrderView = {
  ref: string; itemName: string; deposit: string;
  sellerAddress: string; buyerAddress: string | null;
  deadline: string; status: OrderStatus;
  txHashes?: { label: string; hash: string }[];
};
```
- [ ] `web/src/lib/crypto.ts`:
```ts
export async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
```
- [ ] `web/.env.example`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CONTRACT_ID=
VITE_USDC_ISSUER=
```
- [ ] Commit: `git commit -am "chore(scaffold): tailwind tokens, shared types, crypto, env example"`

### P0.3 stubData + dev harness (so Mate 1 can build screens standalone)
- [ ] `web/src/stubData.ts`:
```ts
import type { OrderView } from "./lib/types";
export const sampleOrder: OrderView = {
  ref: "EL-7QF2", itemName: "Blue cotton tee", deposit: "0.50",
  sellerAddress: "GSELLER…DEMO", buyerAddress: null,
  deadline: new Date(Date.now() + 10 * 60_000).toISOString(), status: "awaiting_deposit",
  txHashes: [],
};
const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));
export const stub = {
  onCreate: async (i: { itemName: string; deposit: string; deadlineMinutes: number }) => {
    await wait(); return { ref: "EL-7QF2", deliveryCode: "8241",
      shareUrl: `${location.origin}/?order=EL-7QF2` };
  },
  onConnect: async () => { await wait(); },
  onGetTestFunds: async () => { await wait(); },
  onAddTrustline: async () => { await wait(); },
  onLockDeposit: async () => { await wait(); },
  onConfirmDelivery: async (_code: string) => { await wait(); },
  onMarkShipped: async () => { await wait(); },
  onClaim: async () => { await wait(); },
};
```
- [ ] Add a temporary screen-switcher in `App.tsx` (or a `DevHarness.tsx`) that renders each
  screen with `stub`, so Mate 1 sees their work. This gets replaced at integration.
- [ ] Commit. **Now tell Mate 1 and Mate 2 they’re unblocked.**

---

## On-chain work

### Contract — see master plan Tasks C1–C2 (deposit model, tests, redeploy).

### O1 · USDC test asset (one-time setup)
- [ ] Create/reuse a testnet issuer key: `stellar keys generate --global usdc-issuer --network testnet && stellar keys fund usdc-issuer --network testnet`
- [ ] Get its public key: `stellar keys address usdc-issuer` → this is `VITE_USDC_ISSUER`.
- [ ] Deploy the USDC token's Soroban wrapper (SAC):
  `stellar contract asset deploy --asset USDC:<ISSUER> --source my-key --network testnet`
- [ ] Document the issuer address in `docs/SETUP-testnet.md` (fill Mate 2’s TODO placeholder).

### O2 · `constants.ts`
```ts
import { Networks } from "@stellar/stellar-sdk";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID as string; // from redeploy
export const USDC_ISSUER = import.meta.env.VITE_USDC_ISSUER as string;
export const USDC_CODE = "USDC";
```

### O3 · `wallet.ts` (the swappable seam)
Wrap the existing `web/src/lib/walletKit.ts` (StellarWalletsKit). Reconcile with what’s there:
```ts
import { StellarWalletsKit, WalletNetwork, allowAllModules } from "@creit.tech/stellar-wallets-kit";
import { NETWORK_PASSPHRASE } from "./constants";

export interface WalletAdapter {
  connect(): Promise<string>;
  getAddress(): string | null;
  signTransaction(xdr: string): Promise<string>;
  disconnect(): Promise<void>;
}

let address: string | null = null;
const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET, modules: allowAllModules(),
});

export const wallet: WalletAdapter = {
  async connect() {
    await new Promise<void>((resolve, reject) => {
      kit.openModal({
        onWalletSelected: async (opt) => { kit.setWallet(opt.id); resolve(); },
        onClosed: () => reject(new Error("no wallet selected")),
      });
    });
    const { address: a } = await kit.getAddress();
    address = a; return a;
  },
  getAddress: () => address,
  async signTransaction(xdr) {
    const { signedTxXdr } = await kit.signTransaction(xdr, {
      address: address ?? undefined, networkPassphrase: NETWORK_PASSPHRASE,
    });
    return signedTxXdr;
  },
  async disconnect() { address = null; },
};
```
> Mainnet-later seam: a `PasskeyWallet` implementing `WalletAdapter` swaps in here with no UI change.

### O4 · `soroban.ts` — USDC token, deadline, claim
Edit the existing file:
- [ ] Replace `NATIVE_SAC` with the USDC SAC address:
```ts
import { USDC_CODE, USDC_ISSUER } from "./constants";
export const USDC_SAC = new Asset(USDC_CODE, USDC_ISSUER).contractId(Networks.TESTNET);
const UNITS_PER_USDC = 10_000_000n; // 7 decimals
export function usdcToUnits(v: string): bigint {
  const [w, f = ""] = v.trim().split(".");
  return BigInt(w || "0") * UNITS_PER_USDC + BigInt((f + "0000000").slice(0, 7) || "0");
}
```
- [ ] `createOrder` — add `deadlineUnix` and pass USDC + deadline:
```ts
export async function createOrder(p: {
  buyer: string; seller: string; amountUsdc: string; deadlineUnix: number; sign: Signer;
}): Promise<{ orderId: string; hash: string }> {
  const op = new Contract(CONTRACT_ID).call("create_order",
    addr(p.buyer), addr(p.seller), addr(USDC_SAC),
    i128(usdcToUnits(p.amountUsdc)), u64(BigInt(p.deadlineUnix)));
  const { hash, returnValue } = await invoke(p.buyer, op, p.sign);
  return { orderId: returnValue ? String(scValToNative(returnValue)) : "", hash };
}
```
- [ ] Add `claimExpired` (mirror of `confirmDelivery`, calling `"claim_expired"`).
- [ ] `getOrder` — decode the new `deadline` field into `EscrowOrder`.
- [ ] Keep `invoke`, `classifyError`, `ERROR_MESSAGE`. Update `soroban.test.ts` for `usdcToUnits`.

---

## Integration (after all three tracks land)
- [ ] Replace the dev harness in `App.tsx` with real routing:
  - Read `?order=<ref>` → Buyer flow; otherwise Home/Seller.
  - Wire each screen’s callbacks to the real modules:
    - `onCreate` → generate code, `hashCode`, `createOrderRecord`, build share URL.
    - `onLockDeposit` → `wallet.connect` → `createOrder({...deadlineUnix})` → `attachBuyer(ref, addr, orderId)`.
    - `onConfirmDelivery(code)` → `verifyDeliveryCode` → `confirmDelivery` → `updateStatus(ref,"delivered")`.
    - `onMarkShipped` → `updateStatus(ref,"shipped")`. `onClaim` → `claimExpired` → `updateStatus(ref,"no_show")`.
    - Live status via `subscribeToOrder`; lists via `listOrdersForAddress`.
  - Map errors through `classifyError`/`ERROR_MESSAGE` into the `TxStatus` error state.
- [ ] Delete `stubData.ts` and the dev harness.
- [ ] **End-to-end acceptance** (two browsers, testnet) — the 4 steps in the master plan’s
  "Integration & Acceptance" section, each showing a real Explorer tx link.

## Deploy — Vercel
- [ ] Import the repo in Vercel; root directory `web/`, framework **Vite**, build `npm run build`, output `dist`.
- [ ] Set env vars in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CONTRACT_ID`, `VITE_USDC_ISSUER`.
- [ ] Remove the old GitHub Pages workflow (`.github/workflows/deploy.yml`) and the Vite `base:"/EskoLokt/"` line (Vercel serves at root).
- [ ] Ensure the commit author email is `info@questconstruction.com` (Vercel-linked) or the deploy is skipped.
- [ ] Update README: new contract id, live Vercel URL, one real tx hash, fresh screenshots.

## Definition of done
- [ ] Contract redeployed; `VITE_CONTRACT_ID` set. USDC asset + SAC deployed.
- [ ] `wallet.ts`, `soroban.ts` (USDC + claim), integration wired; stubs deleted.
- [ ] Full deposit → deliver → refund and no-show → claim both verified on testnet with tx links.
- [ ] Live on Vercel; README updated.
