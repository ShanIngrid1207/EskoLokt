# EskoLokt — Real Two-Party Deposit-Escrow Prototype

**Date:** 2026-07-11
**Status:** Draft (design) — pending user review, then implementation plan
**Supersedes / builds on:** `2026-06-24-level2-live-contract-multiwallet-design.md` (the single-wallet live demo)

## Goal

Turn the existing single-wallet live demo into a **real, two-party prototype that
actual sellers and buyers can use** end-to-end on their phones — on **Stellar
Testnet**, architected so a future **mainnet** product is not a rewrite.

The product implements the **refundable-deposit** model from the hackathon pitch:

- A buyer locks a **small refundable USDC deposit** into escrow (goods are still paid
  cash at the door, like normal COD).
- **Delivery confirmed** → the deposit is **returned to the buyer**.
- **Buyer no-shows** (deadline passes) → the deposit is **paid to the seller** to cover
  their shipping/packaging.

## Scope decisions (from brainstorming, 2026-07-11)

| Decision | Choice |
| --- | --- |
| Money model | **Deposit** model (small refundable deposit), not full-price escrow |
| Real usability | **Testnet now, design for mainnet later** — real people, no real money |
| Two-sided | **Two real wallets**; separate **Buyer** and **Seller** mobile views |
| Asset | **Test USDC** (issued for the prototype), not native XLM |
| Contract | **Upgraded + redeployed** to support the deposit + timeout-claim flow |
| Onboarding | **Standard mobile-friendly wallet now**, wallet layer isolated so a
  **passkey smart wallet** can drop in later |
| Offline | **One-time delivery code** now; **SMS/USSD** is a visual preview, deferred |
| Backend | **Supabase** for order coordination + live status + delivery-code hashes |
| Hosting | **Vercel** (replaces GitHub Pages; removes the `/EskoLokt/` base-path hack) |
| UI style | Refined-minimal "developer-tool" aesthetic in **light mode** (see Design language) |

## Non-goals (YAGNI — keeps this a *working* prototype)

- ❌ Real money / mainnet, real USDC sourcing, PHP cash-in/out, KYC/AML
- ❌ Real SMS/USSD telco gateway (static visual preview only)
- ❌ Passkey smart wallet (wallet interface is passkey-ready, but not built)
- ❌ Automatic courier delivery-status integration (delivery is user-confirmed)
- ❌ Rework of the old simulated "story" demo beyond what's reused

---

## 1. The smart-contract upgrade

The deployed contract does **full-price marketplace escrow**: buyer funds the whole
price; `confirm_delivery` pays the **seller**; `refund_order` (seller-auth) returns to
the buyer. The deposit model needs the money to flow the **other way**, and it needs a
seller to be able to get paid **without the buyer's signature** on a genuine no-show.

### Why a no-show needs a redeploy

In a real no-show the buyer has vanished — they will never sign anything. But today,
sending escrowed funds to the seller (`confirm_delivery`) requires the **buyer's**
signature. So the seller can never be compensated for a flake. The fix is a
**time-gated seller claim**: after a deadline the order sets, the seller can claim the
deposit alone. This is trustless (enforced by the ledger clock), and it is the single
reason we must edit + redeploy the Rust contract.

### Changes (contract: `contracts/CodLock/src/lib.rs`)

1. **Add a `deadline` to the order.**
   ```rust
   pub struct Order {
       pub buyer: Address,
       pub seller: Address,
       pub token: Address,   // USDC SAC address
       pub amount: i128,     // the deposit, in the token's smallest unit
       pub deadline: u64,    // unix seconds; after this the seller may claim
       pub status: Status,
   }
   ```

2. **Rename the lifecycle to deposit semantics.**
   ```rust
   pub enum Status {
       Funded,   // deposit locked in escrow
       Returned, // delivery confirmed -> deposit returned to the BUYER
       Claimed,  // no-show past deadline -> deposit paid to the SELLER
   }
   ```

3. **`create_order(buyer, seller, token, amount, deadline) -> u64`** — buyer auth; pulls
   the deposit into escrow; stores `deadline`; status `Funded`. (Adds the `deadline` param.)

4. **`confirm_delivery(order_id)`** — **buyer auth**; requires `Funded`; transfers the
   deposit **back to the buyer**; status `Returned`. *(Destination flips from seller → buyer.)*

5. **`claim_expired(order_id)`** — **seller auth**; requires `Funded` **and**
   `env.ledger().timestamp() >= order.deadline`; transfers the deposit **to the seller**;
   status `Claimed`. *(New function — replaces `refund_order`.)*

6. **`get_order(order_id)`** — unchanged (read-only).

The escrow-holds-the-money mechanism, the `require_auth` checks, and the
double-resolve status guard all stay the same.

### Tests (`contracts/CodLock/src/test.rs`) — update to ≥6

1. `create_order` locks the deposit and returns an id.
2. `confirm_delivery` returns the deposit to the **buyer** (happy path).
3. `claim_expired` **before** the deadline **panics** (too early).
4. `claim_expired` **after** the deadline pays the **seller**.
5. Double-resolve guarded (cannot `confirm` then `claim`, or resolve twice).
6. Order isolation (two orders don't interfere).

### Deploy

Rebuild (`stellar contract build`), redeploy to Testnet → **new contract id**. Update the
single `CONTRACT_ID` constant in `web/src/lib/constants.ts`. Record the new id + a real
tx hash in the README.

### Honesty note (write into README + UI)

If a buyer *received* the parcel but refuses to tap "confirm" to grief the seller, after
the deadline the seller can claim the deposit anyway. That is acceptable and roughly fair
for a prototype. Production would auto-confirm delivery from the courier's delivery status.

---

## 2. Test USDC

The contract is token-agnostic, so USDC needs **no contract change** — we just pass the
USDC token address instead of native XLM. Setup (one-time, scripted + documented):

- Create a **USDC issuer** account we control (testnet).
- **Deploy the token's Soroban wrapper (SAC):** `stellar contract asset deploy --asset USDC:<ISSUER>`.
  The frontend computes the same address via `new Asset("USDC", issuer).contractId(TESTNET)`.
- **Trustlines:** buyer and seller each add a trustline to `USDC:<ISSUER>` before they can
  hold it (the app guides this).
- **Fund:** mint test USDC to a new buyer, and fund test XLM (for fees) from friendbot —
  exposed as in-app "Get test funds" buttons so a fresh user can actually start.

Amounts are handled in the token's smallest unit (7 decimals), same pattern as the
existing `xlmToStroops` helper.

---

## 3. Architecture

```
                 ┌──────────────────────────────────────────┐
   Seller phone  │  EskoLokt web app (Vite + React, mobile) │  Buyer phone
   ───────────►  │   Seller view        Buyer view          │  ◄───────────
                 │        │                  │               │
                 │   WalletAdapter (StellarWalletsKit today, │
                 │        │            passkey-ready)        │
                 │        ▼                  ▼               │
                 │   soroban.ts  ──►  Upgraded CodLock       │──► Stellar Testnet
                 │   (create/confirm/claim/get)  contract    │    (source of truth
                 │        │                                  │     for the money)
                 │        ▼                                  │
                 │   Supabase (order book: item, addresses,  │
                 │   deposit, deadline, delivery-code hash,  │
                 │   on-chain id, mirrored status; realtime) │
                 └──────────────────────────────────────────┘
```

**Source of truth:** the **chain** owns the money and the authoritative order state
(`get_order`). **Supabase** owns everything needed to *coordinate* two phones around the
same order and to render a nice UI (item name, shareable ref, delivery-code hash, a
mirror of status for lists/notifications).

### 3.1 Wallet layer (`web/src/lib/wallet.ts`)

A thin `WalletAdapter` interface — `connect()`, `getAddress()`, `signTransaction(xdr)`,
`disconnect()` — implemented today by **StellarWalletsKit** (mobile-friendly wallets).
Everything else imports the interface, never the kit directly, so a `PasskeyWallet`
implementation (passkey + sponsored fees) can be swapped in for mainnet with no UI churn.

### 3.2 Contract client (`web/src/lib/soroban.ts`)

Extend the existing module:
- Parameterize the token → pass the **USDC SAC** address (not hardcoded native).
- Add `claimExpired(orderId)`.
- Keep `createOrder` (now takes `deadline`), `confirmDelivery`, `getOrder`, the
  simulate→sign→submit→poll `invoke` helper, and `classifyError`.

### 3.3 Supabase (order book)

`orders` table (indicative):

| column | type | note |
| --- | --- | --- |
| `id` | uuid pk | |
| `ref` | text unique | short human code in the share link (e.g. `EL-7QF2`) |
| `item_name` | text | |
| `deposit` | numeric | USDC deposit amount |
| `seller_address` | text | |
| `buyer_address` | text null | set when the buyer locks the deposit |
| `deadline` | timestamptz | mirrors the on-chain deadline |
| `delivery_code_hash` | text | hashed one-time code |
| `onchain_order_id` | bigint null | set after `create_order` |
| `status` | text | `awaiting_deposit` / `funded` / `shipped` / `delivered` / `no_show` |
| `created_at` / `updated_at` | timestamptz | |

Realtime subscription on `orders` powers live status on both phones. RLS is
**prototype-grade** (documented as not production-hardened). The delivery code is stored
**hashed**; the plaintext lives only in the share artifact the seller gives the buyer.

### 3.4 Screens (mobile-first)

- **Connect** — connect wallet; "Get test funds" (XLM + USDC) + add-USDC-trustline helper.
- **Home** — two actions: **Sell** (create an order) and **Buy** (open/scan an order link);
  plus **My orders** (as seller and as buyer).
- **Seller · Create order** — item name, deposit (USDC), deadline → generates a **share
  link + QR + one-time delivery code**. Then: watch it get funded → **Mark shipped** →
  after the deadline, **Claim deposit** (no-show).
- **Buyer · Order** (opened from the link) — shows item, seller, deposit, deadline →
  **Connect** → **Lock deposit** (`create_order`) → at the door, **enter delivery code** →
  `confirm_delivery` → deposit returned.
- **Order detail (shared)** — status timeline, on-chain tx links (Stellar Explorer),
  role-appropriate actions.
- **Emergency (preview)** — delivery-code entry (real) + a static **"pay by text"** SMS/USSD
  mockup labeled as a preview.

### 3.5 Transaction status + the 3 error types

Reuse the existing status UI (Pending → Success with tx-hash Explorer link → Fail) and the
`classifyError` mapping: **no wallet**, **rejected**, **insufficient balance**, plus a
generic fallback.

---

## 4. The real two-party flow

```
SELLER phone                              BUYER phone
─────────────                             ────────────
Create order (item, USDC deposit, deadline)
   → share link / QR + delivery code  ─────► Open link, connect wallet
                                             Lock deposit → create_order (on-chain)
Sees "Deposit locked" (realtime)  ◄───────
Mark parcel shipped
                          … parcel in transit …
                                             At the door: enter DELIVERY CODE
                                               → confirm_delivery → deposit back to buyer
Sees "Delivered — closed"  ◄──────────────
   OR, if the buyer no-shows past the deadline:
Tap "Claim deposit" → claim_expired → deposit to seller
```

For the demo, deadlines can be short (minutes) so the no-show/claim path is showable
quickly; real orders would use days.

---

## 5. Design language (light mode)

Refined, minimal "developer-tool" aesthetic (Vercel/Linear family), **light mode**, per the
user's reference. Implemented with **Tailwind + a few shadcn-style primitives** (Button,
Input, Label, Switch, Separator, Card) so it's consistent and easy to hand off.

- **Signature element:** micro-labels in **mono, uppercase, wide tracking**
  (`font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground`) over section
  headers, metrics, and statuses.
- **Surfaces:** near-white background, hairline borders (`border-border/60`), low-opacity
  fills (`bg-foreground/[0.03–0.06]`), generous white space, `rounded-lg/xl`.
- **Numbers:** monospace, `tabular-nums` for amounts, deadlines, order ids.
- **Color discipline:** neutral grays carry the layout; **brand green = `--primary`** for
  primary actions/accents (per the fixed-brand-green rule); status is the only bright color:
  - **Locked / pending** → sky, **Delivered / returned** → emerald,
    **In transit / awaiting** → amber, **No-show / claimed / error** → rose.
- **Motion:** subtle, functional (status transitions, pending spinners) — no decorative noise.
- **Mobile-first:** single-column, thumb-reachable actions; the reference's sidebar/split
  layouts collapse to stacked mobile screens.

Reference showcase code the user provided (settings, login, dashboards) is kept under
`docs/design/ui-reference/` as a pattern source for the UI task.

---

## 6. Deploy (Vercel)

- Frontend deploys to **Vercel** (root path — the `/EskoLokt/` Vite base hack is removed).
- Supabase URL + anon key and the contract/network config come from **Vercel env vars**.
- Retire the GitHub Actions → Pages workflow.
- Commit-author email must match a Vercel-linked account (known gotcha from prior deploys).

---

## 7. Designed-for-mainnet seams (isolate now, upgrade later)

- **Wallet** behind `WalletAdapter` → drop in passkey smart wallet + sponsored fees.
- **Asset** is already USDC → same story on mainnet.
- **Contract** clean deadline/claim model → production adds courier-status auto-confirm.
- **Supabase** schema written for real users/orders from the start.

---

## 8. Team split (low-AI for teammates)

The spec does the hard thinking so teammates follow briefs, not figure things out with AI.
Detailed per-person MD briefs are produced in the implementation-plan step.

| Person | Owns | Why it's low-AI |
| --- | --- | --- |
| **Owner** (paid AI) | Contract upgrade + redeploy, wallet layer, `soroban.ts`, USDC setup, integration/wiring | The iterative, ambiguous, risky parts |
| **Mate 1** | Mobile **Buyer + Seller UI** (Tailwind + primitives, this design language, light mode) against a **stub data layer** | Built from an exact component/state spec; mostly markup + styling |
| **Mate 2** | **Supabase** schema + data-access functions + **testnet funding/setup docs** | Copy-paste SQL + clear function stubs provided |

Interfaces (the `WalletAdapter` type, the `soroban.ts` function signatures, the Supabase
data-access function signatures, and the UI's data props) are frozen in the plan so the three
tracks integrate without cross-talk.

---

## 9. Open risks / notes

- StellarWalletsKit mobile signing API shape — confirm during implementation.
- Soroban RPC result polling takes a few seconds — covered by the Pending state.
- USDC trustline + funding is an onboarding step a first-time user must complete; the
  "Get test funds" helpers must make this one tap.
- Deadline uses ledger time; keep demo deadlines short but not so short that a legit
  confirm races the claim window.
