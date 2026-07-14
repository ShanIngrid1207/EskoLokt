# EskoLokt Level 2 — Live Contract + Multi-Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the EskoLokt web app perform real on-chain calls to the deployed CodLock escrow contract, and upgrade the wallet button to a multi-wallet picker — satisfying every Level 2 requirement.

**Architecture:** Additive. Keep the existing simulated demo untouched. Swap the raw-Freighter wallet layer for StellarWalletsKit app-wide (one drop-in module behind the existing `useStellarWallet` hook). Add a new Soroban contract-call module and a new "Live" tab that drives a real create → read → release escrow loop using native testnet XLM.

**Tech Stack:** Vite + React 18 + TypeScript, `@stellar/stellar-sdk` v13 (Soroban RPC), `@creit.tech/stellar-wallets-kit` (multi-wallet), `vitest` (unit tests for pure helpers). Package manager: **npm**.

## Global Constraints

- **Network: Testnet only.** Passphrase `Test SDF Network ; September 2015`. Never Mainnet.
- **Deployed contract ID (do not redeploy):** `CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN`
- **Escrow asset:** native XLM, via the native Stellar Asset Contract address computed at runtime (`Asset.native().contractId(Networks.TESTNET)`) — never hardcode it.
- **Amounts:** the contract's `amount` arg is `i128` in **stroops** (1 XLM = 10,000,000 stroops).
- **Package manager:** npm only (no pnpm/yarn). All commands run from `web/`.
- **Repo was renamed** CodLock → **EskoLokt**. User-facing brand stays "Esko Lokt".
- **Keep the simulated demo intact.** Only the shared Connect button changes; the Orders/How-it-works/Proof tabs keep working.

---

## File Structure

**Create:**
- `web/src/lib/walletKit.ts` — StellarWalletsKit wrapper: picker modal, getAddress, sign, session restore.
- `web/src/lib/soroban.ts` — Soroban RPC client + contract calls (`createOrder`, `getOrder`, `confirmDelivery`) + pure helpers (`xlmToStroops`, `classifyError`).
- `web/src/lib/soroban.test.ts` — vitest unit tests for the pure helpers.
- `web/src/hooks/useEscrow.ts` — orchestrates the live escrow loop state (status, hash, error, order).
- `web/src/components/LiveEscrowPanel.tsx` — the new "Live Testnet" UI.
- `web/vitest.config.ts` — minimal vitest config.

**Modify:**
- `web/package.json` — add deps + `test` script.
- `web/vite.config.ts` — fix CI base path to `/EskoLokt/`.
- `web/src/lib/constants.ts` — add Soroban RPC URL, contract ID, default seller/amount.
- `web/src/hooks/useStellarWallet.ts` — route connect/sign through `walletKit` instead of `freighter`.
- `web/src/App.tsx` — add the "Live" nav tab; update repo/site URLs to EskoLokt.
- `README.md` — live link, wallet-options screenshot, contract address, real tx hash.

**Leave untouched:** `lib/freighter.ts` (kept as dead code reference; not imported after Task 3), `lib/stellar.ts`, the simulated demo components.

---

### Task 1: Dependencies, config, and constants

**Files:**
- Modify: `web/package.json`
- Modify: `web/vite.config.ts`
- Modify: `web/src/lib/constants.ts`
- Create: `web/vitest.config.ts`

**Interfaces:**
- Produces: `SOROBAN_RPC_URL`, `CONTRACT_ID`, `DEFAULT_SELLER`, `DEFAULT_AMOUNT_XLM` (all `string`) exported from `constants.ts`; npm `test` script; `@creit.tech/stellar-wallets-kit` and `vitest` installed.

- [ ] **Step 1: Add dependencies**

Run (from `web/`):

```bash
npm install @creit.tech/stellar-wallets-kit@^1.7.0
npm install -D vitest@^2.1.0
```

- [ ] **Step 2: Add the test script to `web/package.json`**

In the `"scripts"` block, add a `test` line so it reads:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Fix the CI base path in `web/vite.config.ts`**

Replace both `"/CodLock/"` occurrences with `"/EskoLokt/"`. The `base` line becomes:

```ts
  base: (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.GITHUB_ACTIONS
    ? "/EskoLokt/"
    : "/",
```

Also update the comment above it from `https://<user>.github.io/CodLock/` to `https://<user>.github.io/EskoLokt/`.

- [ ] **Step 4: Add Soroban constants to `web/src/lib/constants.ts`**

Append to the end of the file:

```ts
// Soroban (smart-contract) RPC endpoint for Testnet.
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

// The deployed CodLock escrow contract (Testnet). Do not redeploy.
export const CONTRACT_ID = "CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN";

// Build a Testnet explorer link for a contract id.
export const STELLAR_EXPLORER_CONTRACT = (id: string) =>
  `https://stellar.expert/explorer/testnet/contract/${id}`;

// Pre-filled, editable defaults for the Live Testnet escrow demo.
// DEFAULT_SELLER receives the escrow on "release". Replace with your own
// second Testnet account if you prefer.
export const DEFAULT_SELLER = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
export const DEFAULT_AMOUNT_XLM = "1";
```

- [ ] **Step 5: Create `web/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: Verify it builds**

Run (from `web/`):

```bash
npm run typecheck
```

Expected: no errors (exit 0).

- [ ] **Step 7: Commit**

```bash
git add web/package.json web/package-lock.json web/vite.config.ts web/src/lib/constants.ts web/vitest.config.ts
git commit -m "chore: add wallet-kit + soroban deps, config, and constants"
```

---

### Task 2: StellarWalletsKit wrapper module

**Files:**
- Create: `web/src/lib/walletKit.ts`

**Interfaces:**
- Consumes: `STELLAR_NETWORK_PASSPHRASE` from `constants.ts`.
- Produces:
  - `openWalletPicker(): Promise<string>` — opens the picker modal, resolves with the chosen wallet's public key (rejects with `Error("No wallet selected.")` if closed).
  - `getKitAddress(): Promise<string | null>` — current address without prompting.
  - `signWithKit(xdr: string, address: string): Promise<string>` — returns signed XDR.
  - `restoreWalletId(): string | null` and `setKitWallet(id: string): void` — for session restore.

- [ ] **Step 1: Write the module**

```ts
// Multi-wallet layer built on StellarWalletsKit. Replaces the single-wallet
// Freighter wrappers app-wide: connecting opens a modal listing every supported
// wallet (Freighter, Albedo, xBull, Rabet, Lobstr, Hana, …) on Testnet.
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from "@creit.tech/stellar-wallets-kit";

const STORAGE_KEY = "eskolokt.wallet.id";

let kit: StellarWalletsKit | null = null;

function getKit(): StellarWalletsKit {
  if (!kit) {
    kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      modules: allowAllModules(),
    });
  }
  return kit;
}

/** Open the wallet-selection modal; resolve with the chosen public key. */
export function openWalletPicker(): Promise<string> {
  const k = getKit();
  return new Promise((resolve, reject) => {
    k.openModal({
      onWalletSelected: async (option) => {
        try {
          k.setWallet(option.id);
          const { address } = await k.getAddress();
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, option.id);
          }
          if (!address) throw new Error("Wallet returned no address.");
          resolve(address);
        } catch (e) {
          reject(e);
        }
      },
      onClosed: () => reject(new Error("No wallet selected.")),
    });
  });
}

/** Read the current wallet address without prompting (null if none). */
export async function getKitAddress(): Promise<string | null> {
  try {
    const { address } = await getKit().getAddress();
    return address || null;
  } catch {
    return null;
  }
}

/** Ask the connected wallet to sign an XDR on Testnet; returns signed XDR. */
export async function signWithKit(xdr: string, address: string): Promise<string> {
  const { signedTxXdr } = await getKit().signTransaction(xdr, {
    address,
    networkPassphrase: WalletNetwork.TESTNET,
  });
  return signedTxXdr;
}

/** The wallet id chosen in a previous session, if any. */
export function restoreWalletId(): string | null {
  return typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
}

/** Re-select a previously chosen wallet without opening the modal. */
export function setKitWallet(id: string): void {
  getKit().setWallet(id);
}
```

- [ ] **Step 2: Verify it typechecks**

Run (from `web/`):

```bash
npm run typecheck
```

Expected: no errors. (If `onClosed` is not in the modal options type for the installed kit version, remove that line and keep only `onWalletSelected` — the picker still rejects via timeout on the caller side; note this for Task 3.)

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/walletKit.ts
git commit -m "feat: add StellarWalletsKit multi-wallet wrapper"
```

---

### Task 3: Route the wallet hook through StellarWalletsKit (multi-wallet, app-wide)

**Files:**
- Modify: `web/src/hooks/useStellarWallet.ts`

**Interfaces:**
- Consumes: `openWalletPicker`, `getKitAddress`, `signWithKit`, `restoreWalletId`, `setKitWallet` from `walletKit.ts`.
- Produces: the existing `useStellarWallet()` return shape is unchanged (so `StellarWalletPanel` keeps working) — `installed` is now always `true` once ready, `network` is `"TESTNET"`.

- [ ] **Step 1: Replace the freighter import block**

Find:

```ts
import {
  isFreighterInstalled,
  requestWalletAddress,
  getWalletAddress,
  getWalletNetwork,
  signWithFreighter,
} from "../lib/freighter";
```

Replace with:

```ts
import {
  openWalletPicker,
  getKitAddress,
  signWithKit,
  restoreWalletId,
  setKitWallet,
} from "../lib/walletKit";
```

- [ ] **Step 2: Replace the mount effect (session restore + install detection)**

Find the whole `useEffect(() => { ... }, [refreshBalance]);` block and replace it with:

```ts
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
```

- [ ] **Step 3: Replace the body of `connect`**

Find the `const connect = useCallback(async () => { ... }, [refreshBalance]);` block and replace its body with:

```ts
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
```

- [ ] **Step 4: Replace the sign call inside `sendPayment`**

Find:

```ts
        const signed = await signWithFreighter(xdr, publicKey);
```

Replace with:

```ts
        const signed = await signWithKit(xdr, publicKey);
```

- [ ] **Step 5: Verify it typechecks**

Run (from `web/`):

```bash
npm run typecheck
```

Expected: no errors. (`getWalletNetwork`/`isFreighterInstalled` etc. are no longer referenced.)

- [ ] **Step 6: Manual browser check — multi-wallet picker**

Run (from `web/`): `npm run dev`, open the printed localhost URL.
1. Go to the **Proof** tab → "Try a real payment" → click **Connect**.
2. Expected: a modal appears listing **multiple wallets** (Freighter, Albedo, xBull, etc.) — not a direct Freighter-only prompt.
3. Pick Freighter, approve. Expected: your address + balance load as before.
4. This screen is what the README "wallet options available" screenshot captures.

- [ ] **Step 7: Commit (Level 2 milestone — multi-wallet)**

```bash
git add web/src/hooks/useStellarWallet.ts
git commit -m "feat: multi-wallet connect via StellarWalletsKit app-wide"
```

---

### Task 4: Soroban contract-call module + unit tests

**Files:**
- Create: `web/src/lib/soroban.ts`
- Create: `web/src/lib/soroban.test.ts`

**Interfaces:**
- Consumes: `SOROBAN_RPC_URL`, `CONTRACT_ID` from `constants.ts`.
- Produces:
  - `xlmToStroops(xlm: string): bigint`
  - `classifyError(e: unknown): WalletErrorKind` where `WalletErrorKind = "no-wallet" | "rejected" | "insufficient" | "unknown"`
  - `ERROR_MESSAGE: Record<WalletErrorKind, string>`
  - `type EscrowOrder = { buyer: string; seller: string; token: string; amount: string; status: string }`
  - `type Signer = (xdr: string) => Promise<string>`
  - `createOrder(p: { buyer: string; seller: string; amountXlm: string; sign: Signer }): Promise<{ orderId: string; hash: string }>`
  - `getOrder(publicKey: string, orderId: string): Promise<EscrowOrder>`
  - `confirmDelivery(p: { publicKey: string; orderId: string; sign: Signer }): Promise<{ hash: string }>`

- [ ] **Step 1: Write the failing tests**

`web/src/lib/soroban.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { xlmToStroops, classifyError } from "./soroban";

describe("xlmToStroops", () => {
  it("converts whole XLM", () => expect(xlmToStroops("1")).toBe(10_000_000n));
  it("converts fractional XLM", () => expect(xlmToStroops("1.5")).toBe(15_000_000n));
  it("handles the smallest unit", () => expect(xlmToStroops("0.0000001")).toBe(1n));
  it("ignores surrounding spaces", () => expect(xlmToStroops(" 2 ")).toBe(20_000_000n));
});

describe("classifyError (the 3 required error types)", () => {
  it("detects user rejection", () =>
    expect(classifyError(new Error("User declined the request"))).toBe("rejected"));
  it("detects insufficient balance", () =>
    expect(classifyError(new Error("tx_insufficient_balance"))).toBe("insufficient"));
  it("detects no wallet", () =>
    expect(classifyError(new Error("Freighter is not installed"))).toBe("no-wallet"));
  it("falls back to unknown", () =>
    expect(classifyError(new Error("some rpc 500"))).toBe("unknown"));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (from `web/`):

```bash
npm test
```

Expected: FAIL — `soroban.ts` does not export `xlmToStroops` / `classifyError` yet.

- [ ] **Step 3: Write `web/src/lib/soroban.ts`**

```ts
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
  if (/reject|declin|denied|cancel/.test(msg)) return "rejected";
  if (/insufficient|underfunded|not enough|low balance/.test(msg)) return "insufficient";
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
  while (got.status === "NOT_FOUND") {
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (from `web/`):

```bash
npm test
```

Expected: PASS (all 8 tests green).

- [ ] **Step 5: Verify it typechecks**

Run (from `web/`):

```bash
npm run typecheck
```

Expected: no errors. (If `Asset.native().contractId` types complain, it returns a `string` in v13; no cast needed. If `got.returnValue` is flagged, it exists on the SUCCESS branch — the `got.status !== "SUCCESS"` guard narrows it.)

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/soroban.ts web/src/lib/soroban.test.ts
git commit -m "feat: add soroban escrow contract client + helper tests"
```

---

### Task 5: Escrow orchestration hook

**Files:**
- Create: `web/src/hooks/useEscrow.ts`

**Interfaces:**
- Consumes: `createOrder`, `getOrder`, `confirmDelivery`, `classifyError`, `ERROR_MESSAGE`, `type EscrowOrder` from `soroban.ts`; `signWithKit` from `walletKit.ts`.
- Produces: `useEscrow(publicKey: string | null)` returning `{ status, action, hash, error, orderId, order, lock, refresh, release, reset }` where `status: "idle" | "pending" | "success" | "error"`, `action: string | null`, `hash/error/orderId: string | null`, `order: EscrowOrder | null`, and `lock(seller, amountXlm)`, `refresh()`, `release()`, `reset()` are async/void functions.

- [ ] **Step 1: Write the hook**

```ts
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
        const fresh = await getOrder(publicKey, id);
        setOrder(fresh);
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
      setOrder(await getOrder(publicKey, orderId));
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
```

- [ ] **Step 2: Verify it typechecks**

Run (from `web/`):

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/hooks/useEscrow.ts
git commit -m "feat: add escrow orchestration hook"
```

---

### Task 6: Live Testnet panel + new nav tab

**Files:**
- Create: `web/src/components/LiveEscrowPanel.tsx`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Consumes: `useStellarWallet` (connect/publicKey/isConnected), `useEscrow`, `STELLAR_EXPLORER_TX`, `DEFAULT_SELLER`, `DEFAULT_AMOUNT_XLM`, `CONTRACT_ID`, `STELLAR_EXPLORER_CONTRACT`, icons.
- Produces: `LiveEscrowPanel` component; a new `"live"` view in `App.tsx`.

- [ ] **Step 1: Write `web/src/components/LiveEscrowPanel.tsx`**

```tsx
import { useState } from "react";
import { useStellarWallet } from "../hooks/useStellarWallet";
import { useEscrow } from "../hooks/useEscrow";
import {
  DEFAULT_SELLER,
  DEFAULT_AMOUNT_XLM,
  CONTRACT_ID,
  STELLAR_EXPLORER_TX,
  STELLAR_EXPLORER_CONTRACT,
} from "../lib/constants";
import { IconWallet, IconExternal, IconCheck, IconRefresh } from "./icons";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

export function LiveEscrowPanel() {
  const w = useStellarWallet();
  const e = useEscrow(w.publicKey);
  const [seller, setSeller] = useState(DEFAULT_SELLER);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT_XLM);

  const busy = e.status === "pending";

  return (
    <section className="card">
      <h2>
        Live on Testnet <span className="badge">Real contract call</span>
      </h2>
      <p className="demo-intro">
        This runs the real escrow on Stellar's test network using free practice XLM. Lock a small
        deposit into the contract, read its state back from the chain, then release it to the seller —
        each step is a real transaction you can verify on the explorer.
      </p>

      <a className="view" href={STELLAR_EXPLORER_CONTRACT(CONTRACT_ID)} target="_blank" rel="noreferrer">
        Contract {truncate(CONTRACT_ID)} <IconExternal size={13} />
      </a>

      {/* Connect */}
      {!w.isConnected ? (
        <button className="btn primary" onClick={w.connect} disabled={w.isConnecting}>
          <IconWallet size={16} /> {w.isConnecting ? "Connecting…" : "Connect a wallet"}
        </button>
      ) : (
        <p className="muted">Connected: {truncate(w.publicKey!)}</p>
      )}
      {w.connectError && <p className="warn">{w.connectError}</p>}

      {/* Inputs */}
      <label className="field">
        <span>Seller address (receives the funds on release)</span>
        <input value={seller} onChange={(ev) => setSeller(ev.target.value.trim())} spellCheck={false} />
      </label>
      <label className="field">
        <span>Amount (XLM)</span>
        <input value={amount} onChange={(ev) => setAmount(ev.target.value.trim())} inputMode="decimal" />
      </label>

      {/* Steps */}
      <div className="btn-row">
        <button
          className="btn primary"
          onClick={() => e.lock(seller, amount)}
          disabled={!w.isConnected || busy}
        >
          1 · Lock funds
        </button>
        <button className="btn" onClick={() => e.refresh()} disabled={!e.orderId || busy}>
          <IconRefresh size={14} /> 2 · Read order
        </button>
        <button className="btn" onClick={() => e.release()} disabled={!e.orderId || busy}>
          3 · Release to seller
        </button>
      </div>

      {/* Transaction status */}
      {e.status !== "idle" && (
        <div className={`tx-status ${e.status}`}>
          {e.status === "pending" && <p>⏳ {e.action}: waiting for signature / settling…</p>}
          {e.status === "success" && (
            <p>
              <IconCheck size={14} /> {e.action} succeeded.{" "}
              {e.hash && (
                <a href={STELLAR_EXPLORER_TX(e.hash)} target="_blank" rel="noreferrer">
                  View transaction <IconExternal size={12} />
                </a>
              )}
            </p>
          )}
          {e.status === "error" && <p className="warn">⚠ {e.action}: {e.error}</p>}
        </div>
      )}

      {/* On-chain order state */}
      {e.order && (
        <dl className="facts">
          <div className="fact">
            <dt>Order id</dt>
            <dd>{e.orderId}</dd>
          </div>
          <div className="fact">
            <dt>Status (from chain)</dt>
            <dd>{e.order.status}</dd>
          </div>
          <div className="fact">
            <dt>Amount</dt>
            <dd>{e.order.amount} stroops</dd>
          </div>
          <div className="fact">
            <dt>Seller</dt>
            <dd>{truncate(e.order.seller)}</dd>
          </div>
        </dl>
      )}

      <p className="muted">
        Note: a refund is the contract's other branch — it needs the seller's signature, so it isn't
        run in this single-wallet demo.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Add the "Live" tab to `web/src/App.tsx`**

In the imports, add:

```tsx
import { LiveEscrowPanel } from "./components/LiveEscrowPanel";
import { IconShield, IconBook, IconInfo, IconGrid } from "./components/icons";
```

(Keep the existing icon import; ensure `IconShield` etc. remain imported — if duplicated, merge into the single existing import line.)

Change the `View` type:

```tsx
type View = "orders" | "guide" | "proof" | "live";
```

Add to the `NAV` array (after the `proof` entry):

```tsx
  { id: "live", label: "Live", icon: IconShield },
```

Add to the `TITLES` record:

```tsx
  live: {
    title: "Live on Testnet",
    sub: "Run the real escrow contract yourself with free practice XLM — lock a deposit, read it back from the chain, and release it, with a verifiable transaction each step.",
  },
```

Add the render branch next to the others:

```tsx
            {view === "live" && <LiveEscrowPanel />}
```

- [ ] **Step 3: Update repo/site URLs in `web/src/App.tsx`**

Replace:

```tsx
const REPO_URL = "https://github.com/ShanIngrid1207/CodLock";
const SITE_URL = "https://shaningrid1207.github.io/CodLock/";
```

with:

```tsx
const REPO_URL = "https://github.com/ShanIngrid1207/EskoLokt";
const SITE_URL = "https://shaningrid1207.github.io/EskoLokt/";
```

- [ ] **Step 4: Verify it builds**

Run (from `web/`):

```bash
npm run build
```

Expected: type-check + production build succeed (exit 0).

- [ ] **Step 5: Manual browser check — the full live loop**

Run (from `web/`): `npm run dev`. In the browser:
1. Open the **Live** tab. Connect a wallet (Freighter on Testnet, funded — if balance is 0, fund at `https://friendbot.stellar.org`).
2. Leave the pre-filled seller + `1` XLM. Click **1 · Lock funds**, sign in the wallet.
   - Expect: status goes Pending → Success, a **transaction link** appears, an **Order id** shows, and **Status (from chain) = Funded**.
   - **Copy this transaction hash — it goes in the README.**
3. Click **2 · Read order** — the on-chain status stays Funded (read works).
4. Click **3 · Release to seller**, sign. Expect Success + new tx link; status flips to **Released**.
5. Click each transaction link → it opens on stellar.expert and shows a successful contract invocation.

- [ ] **Step 6: Manual browser check — error handling**

1. **Rejected:** Click **Lock funds**, then **reject** the request in the wallet popup. Expect: "You cancelled the transaction in your wallet."
2. **Insufficient:** Set Amount to a number larger than your balance (e.g. `99999`), Lock. Expect the "Not enough testnet XLM…" message (from simulation failure).
3. **No wallet:** Disconnect (reload the page so no wallet is connected), open the picker and **close it** without choosing. Expect the connect error about no wallet selected.

(If a real-world error text isn't caught by `classifyError`, widen its regex in `soroban.ts` to include the exact phrase you saw, re-run `npm test`, and re-verify.)

- [ ] **Step 7: Commit (Level 2 milestone — live contract integration)**

```bash
git add web/src/components/LiveEscrowPanel.tsx web/src/App.tsx
git commit -m "feat: live testnet escrow panel calling the deployed contract"
```

---

### Task 7: README, screenshots, and deploy

**Files:**
- Modify: `README.md`
- (Deploy happens automatically via the existing GitHub Actions workflow on push.)

**Interfaces:**
- Consumes: the real transaction hash captured in Task 6, Step 5.

- [ ] **Step 1: Capture the wallet-options screenshot**

With `npm run dev` running, open the **Live** (or Proof) tab, click **Connect**, and screenshot the wallet-selection modal showing multiple wallet options. Save it to `web/public/` or the repo root as `wallet-options.png` (use a fresh filename — GitHub caches README images by filename).

- [ ] **Step 2: Update `README.md`**

Ensure the README contains, near the top, a clearly labelled section:

```markdown
## Level 2 — Live contract + multi-wallet

- **Live demo:** https://shaningrid1207.github.io/EskoLokt/
- **Deployed contract (Testnet):** `CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN`
  ([view on Stellar Explorer](https://stellar.expert/explorer/testnet/contract/CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN))
- **Example contract-call transaction:** `<PASTE_TX_HASH_FROM_TASK_6>`
  ([verify on Stellar Explorer](https://stellar.expert/explorer/testnet/tx/<PASTE_TX_HASH_FROM_TASK_6>))

### Wallet options
![Wallet options available](wallet-options.png)

### Run locally
\`\`\`bash
cd web
npm install
npm run dev
\`\`\`

### What Level 2 adds
- Multi-wallet connect via StellarWalletsKit (Freighter, Albedo, xBull, …).
- A "Live" tab that calls the deployed contract: `create_order` (write/escrow),
  `get_order` (read), `confirm_delivery` (write/release).
- Visible transaction status (pending → success / fail) with explorer links.
- Three handled error types: no wallet, transaction rejected, insufficient balance.
```

Replace both `<PASTE_TX_HASH_FROM_TASK_6>` placeholders with the real hash, and update any remaining `CodLock` GitHub/Pages URLs elsewhere in the README to `EskoLokt`.

- [ ] **Step 3: Verify the README renders**

Open `README.md` locally and confirm the image path resolves and the explorer links are well-formed (no leftover `<PASTE_...>`).

- [ ] **Step 4: Commit and push (triggers deploy)**

```bash
git add README.md wallet-options.png web/public/wallet-options.png 2>/dev/null
git commit -m "docs: Level 2 README — live link, wallet screenshot, contract + tx hash"
git push origin main
```

- [ ] **Step 5: Verify the deploy**

After ~1–2 minutes, open `https://shaningrid1207.github.io/EskoLokt/`. Confirm the **Live** tab loads, styles/assets resolve (the `/EskoLokt/` base fix), and Connect shows the multi-wallet picker.

---

## Self-Review

**Spec coverage:**
- Multi-wallet (StellarWalletsKit) → Tasks 2–3. ✅
- Contract called from frontend (`create_order`/`get_order`/`confirm_delivery`) → Tasks 4–6. ✅
- Read + write contract data → `getOrder` (read) + `createOrder`/`confirmDelivery` (write), Task 6 loop. ✅
- Transaction status visible (pending/success/fail) → `useEscrow` + panel status block, Task 6. ✅
- 3 error types (no-wallet / rejected / insufficient) → `classifyError` + tests (Task 4) + manual checks (Task 6 Step 6). ✅
- State sync (re-read after each write) → `useEscrow.lock`/`release` call `getOrder`. ✅
- Contract deployed → pre-existing; surfaced in README (Task 7). ✅
- Deploy base-path fix for rename → Task 1 Step 3. ✅
- README: live link, wallet screenshot, contract address, tx hash → Task 7. ✅
- ≥2 meaningful commits → Tasks 3, 6, 7 are the headline commits (plus 1, 2, 4, 5). ✅

**Placeholder scan:** Only intentional `<PASTE_TX_HASH_FROM_TASK_6>` placeholders in the README, explicitly resolved in Task 7 Step 2. No code placeholders.

**Type consistency:** `Signer = (xdr: string) => Promise<string>` used identically in `soroban.ts` and `useEscrow.ts`. `EscrowOrder` fields (`buyer/seller/token/amount/status`) match between `soroban.ts` producer and `LiveEscrowPanel` consumer. `WalletErrorKind` keys match `ERROR_MESSAGE` keys. `useEscrow` return shape matches `LiveEscrowPanel` usage (`status/action/hash/error/orderId/order/lock/refresh/release`).

**Open risks flagged inline:** kit `onClosed` option (Task 2 Step 2), contract-enum status decoding (`decodeStatus`, Task 4), and `classifyError` regex widening against real wallet error text (Task 6 Step 6).
