# EskoLokt — Level 2: Live Contract Integration + Multi-Wallet

**Date:** 2026-06-24
**Status:** Approved (design), pending implementation plan

## Goal

Satisfy all Level 2 (Yellow Belt) requirements by turning the existing *simulated*
escrow demo into one that makes **real on-chain calls** to the already-deployed
CodLock contract, and by upgrading the wallet connection from raw Freighter to a
**multi-wallet picker** (StellarWalletsKit).

The existing simulated walkthrough ("Esko Lokt" story) is **kept unchanged**. All new
behavior is **additive** — a new "Live Testnet" tab.

### Level 2 requirements → how this design meets them

| Requirement | How |
| --- | --- |
| Contract deployed on testnet | Already done: `CBHTZBTBBLKR56GO2EICGJTMJE6FUFIXTBMSG4GIMB3NVVXZUBDUPGEN` (no redeploy) |
| Contract called from the frontend | New Live Testnet panel calls `create_order`, `get_order`, `confirm_delivery` |
| Transaction status visible | Pending → Success / Fail status + tx hash + Explorer link per call |
| 3 error types handled | No wallet found, transaction rejected, insufficient balance |
| Multi-wallet (StellarWalletsKit) | App-wide picker modal replaces the Freighter-only button |
| Reading + writing contract data | Write: `create_order`/`confirm_delivery`; Read: `get_order` |
| Event listening / state sync | Re-read `get_order` after every write to reflect real chain state |
| Min 2+ meaningful commits | Planned 3-commit split (see below) |

## Current state (baseline)

- **Contract** (`contracts/CodLock/src/lib.rs`): real escrow. `create_order(buyer, seller,
  token, amount)` pulls `amount` of `token` from buyer into the contract (Funded).
  `confirm_delivery(order_id)` pays seller (Released) — requires **buyer** auth.
  `refund_order(order_id)` returns funds to buyer (Refunded) — requires **seller** auth.
  `get_order(order_id)` is read-only.
- **Frontend** (`web/`): Vite + React + TS, npm. Raw Freighter connect/balance/send +
  a fully simulated escrow walkthrough. Contract is **not** wired in.
- **Deploy:** GitHub Actions builds `web/` → GitHub Pages. Vite `base` still hardcoded to
  `/CodLock/` (broken after the repo rename to **EskoLokt**).

## Key design decisions

1. **Additive, not a rewrite.** Keep the simulated demo; add a separate "Live Testnet" tab.
2. **App-wide multi-wallet.** Replace the Freighter-only button with the StellarWalletsKit
   picker everywhere, so there is one consistent Connect experience and a clean
   "wallet options" screenshot.
3. **Native XLM as the escrow asset.** The connected wallet already holds testnet XLM from
   friendbot — no token deploy, no trustline, no extra install. The native asset's contract
   (SAC) address is **computed at runtime** from the SDK (`Asset.native().contractId(TESTNET)`),
   not hardcoded.
4. **One wallet can run the whole loop.** Both `create_order` and `confirm_delivery` only
   need the **buyer's** signature, so the single connected wallet (acting as buyer) can do a
   complete create → read → release cycle with no second party. `refund_order` (seller auth)
   is documented as the contract's other branch but **not** executed live.

## Components

### A. Wallet module (`web/src/lib/wallet.ts` or similar)
Wraps StellarWalletsKit. Responsibilities:
- Build a kit instance configured for **Testnet**, with the picker modal enabled.
- `connect()` — open the wallet-selection modal; store selected wallet + public key.
- `getAddress()` — current connected public key (or null).
- `signTransaction(xdr)` — delegate signing to the chosen wallet.
- `disconnect()` — clear selection.
Replaces the existing raw-Freighter calls app-wide (connect/balance views reuse this).

### B. Contract client module (`web/src/lib/contract.ts` or similar)
Uses `@stellar/stellar-sdk` (RPC `Server` against Testnet Soroban RPC). Responsibilities:
- Hold the contract ID and network passphrase as config.
- `createOrder({ buyer, seller, amount })` — build invocation of `create_order` with the
  **native XLM SAC** as `token`; simulate, prepare, sign via wallet module, submit, poll for
  result; return `{ orderId, txHash }`.
- `getOrder(orderId)` — read-only; simulate `get_order` and decode the `Order` struct
  (buyer, seller, token, amount, status). No signing.
- `confirmDelivery(orderId)` — build, simulate, sign, submit; return `{ txHash }`.
- All amounts handled in **stroops** (1 XLM = 10,000,000) for the `i128` arg.

### C. Live Testnet panel (`web/src/views/LiveTestnet.tsx` or similar)
A new nav tab. Layout:
- **Inputs:** Seller address (pre-filled with an editable demo address) and Amount in XLM
  (pre-filled `1`, editable).
- **Step 1 — Lock funds (create_order):** button → escrows XLM, shows resulting order id.
- **Step 2 — View order (get_order):** auto-runs after Step 1 and via a "Refresh" button;
  displays live status (Funded / Released / Refunded), amount, buyer, seller from chain.
- **Step 3 — Release to seller (confirm_delivery):** button → status flips to Released.
- **Refund note:** a short explainer that `refund_order` is the seller-auth branch, not run
  in this single-wallet demo.

### D. Transaction status component
Shared UI used by each contract call. States:
- **Pending** — spinner + "Waiting for signature / submitting…".
- **Success** — green check + the **transaction hash** as a clickable link to
  `https://stellar.expert/explorer/testnet/tx/<hash>`.
- **Fail** — red + the friendly error message (see error handling).

### E. Error handling (the 3 required types)
Map raw errors to plain-language messages:
1. **No wallet found** — no wallet installed, or the user closes the picker without choosing.
   Message: "No wallet selected. Please install or pick a wallet to continue."
2. **Transaction rejected** — user declines in the wallet popup. Detect the wallet's
   user-rejection error. Message: "You cancelled the transaction in your wallet."
3. **Insufficient balance** — not enough XLM to escrow (caught from simulation/submit error).
   Message: "Not enough testnet XLM. Fund your wallet from friendbot and try again."
Any other/unexpected error falls through to a generic "Something went wrong" with the raw
detail available for debugging.

### F. Deploy + docs cleanup
- Fix Vite `base` → `/EskoLokt/` (CI only, matching existing pattern) so Pages works post-rename.
- Update README: new live demo link, **new "wallet options available" screenshot**, the
  deployed contract address, and a **real transaction hash** from a live `create_order` or
  `confirm_delivery` call (verifiable on Stellar Explorer).

## Data flow (live loop)

```
User clicks Connect → StellarWalletsKit modal → wallet chosen → public key stored
        │
Step 1: createOrder(buyer=pubkey, seller=input, amount=input)
        → build tx (token = native XLM SAC) → simulate → sign(wallet) → submit
        → status Pending→Success, show txHash + Explorer link, capture orderId
        │
Step 2: getOrder(orderId)  (read-only simulate) → render status=Funded from chain
        │
Step 3: confirmDelivery(orderId) → sign → submit → Success + txHash
        → auto getOrder(orderId) again → status=Released  (state sync)
```

## Out of scope (YAGNI)

- No second wallet / seller-side flow; `refund_order` not executed live.
- No custom token deploy; native XLM only.
- No changes to the Soroban contract (no redeploy).
- No rework of the existing simulated demo beyond the shared Connect button.

## Commit plan (≥2 meaningful commits)

1. **Multi-wallet:** integrate StellarWalletsKit; replace Freighter-only connect app-wide.
2. **Live contract integration:** contract client module + Live Testnet panel + tx status +
   3 error types.
3. **Deploy + docs:** Vite `base` fix; README live link, screenshot, contract address, tx hash.

## Risks / notes

- Native XLM sent to the contract on `create_order` leaves the buyer permanently on
  `confirm_delivery` (goes to the demo seller). Harmless on testnet — refundable via friendbot.
- Soroban RPC result polling can take a few seconds; the Pending state covers this.
- Confirm the StellarWalletsKit version's signing API shape during implementation (it returns
  signed XDR to submit via the SDK).
