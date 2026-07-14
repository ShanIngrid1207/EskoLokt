# Real Two-Party Deposit-Escrow Prototype — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a real, two-party, mobile deposit-escrow app on Stellar Testnet that actual buyers and sellers can complete end-to-end, architected for a later mainnet product.

**Architecture:** Existing Vite + React + TS app, extended. An upgraded Soroban escrow contract (deposit + deadline + seller timeout-claim) is the source of truth for money; Supabase is the shared "order book" coordinating two phones; a `WalletAdapter` seam keeps wallets swappable. Three tracks (Owner / Mate 1 UI / Mate 2 Supabase) build in parallel against frozen interfaces, then Owner integrates and deploys to Vercel.

**Tech Stack:** Rust/Soroban (`stellar` CLI, soroban-sdk 25), `@stellar/stellar-sdk`, StellarWalletsKit, Supabase (`@supabase/supabase-js`), Tailwind CSS + shadcn-style primitives, Vercel.

**Spec:** [`../specs/2026-07-11-real-deposit-escrow-prototype-design.md`](../specs/2026-07-11-real-deposit-escrow-prototype-design.md)

## Global Constraints

- **Testnet only.** Network passphrase = `Test SDF Network ; September 2015`. No mainnet, no real funds.
- **No contract logic beyond the spec.** Only: `deadline` field, deposit-direction flip, `claim_expired`. No other functions.
- **Money truth = chain.** Supabase mirrors status for UX only; never treat it as authoritative for funds.
- **Amounts** in the token's smallest unit (7 decimals) at the chain boundary; human strings (`"0.50"`) in the UI.
- **Brand green is `--primary`.** Neutral grays carry layout; status colors only for status. Light mode.
- **Package manager:** npm (no pnpm/yarn), inside `web/`.
- **Delivery code** stored **hashed** (SHA-256); plaintext shown only to the seller.
- **Commit email** `info@questconstruction.com` (Vercel-linked). End commit messages with the Co-Authored-By trailer.

---

## File Structure

```
contracts/CodLock/src/lib.rs        MODIFY  deposit model: deadline + confirm→buyer + claim_expired
contracts/CodLock/src/test.rs       MODIFY  6 tests for the new model
web/src/lib/types.ts                CREATE  shared OrderStatus + OrderRow + view types  (Phase 0)
web/src/lib/crypto.ts               CREATE  hashCode() SHA-256 helper                    (Phase 0)
web/src/lib/wallet.ts               CREATE  WalletAdapter interface + StellarWalletsKit impl (Owner)
web/src/lib/soroban.ts              MODIFY  USDC token, createOrder(+deadline), claimExpired (Owner)
web/src/lib/orders.ts               CREATE  Supabase data-access (Mate 2)
web/src/lib/supabase.ts             CREATE  Supabase client from env (Mate 2)
web/src/lib/constants.ts            MODIFY  new CONTRACT_ID, USDC issuer/SAC, env wiring (Owner)
web/src/screens/*                   CREATE  mobile Buyer/Seller screens (Mate 1)
web/src/ui/*                        CREATE  shadcn-style primitives (Mate 1, Phase 0 by Owner)
web/src/stubData.ts                 CREATE  fake callbacks so Mate 1 builds standalone (Phase 0)
web/tailwind.config.js, index.css   CREATE/MODIFY  Tailwind + tokens (Owner, Phase 0)
supabase/schema.sql                 CREATE  orders table + RLS + realtime (Mate 2)
docs/tasks/yohan-1-ui.md            brief for Yohan (UI)
docs/tasks/myr-2-supabase.md        brief for Myr (Supabase)
docs/tasks/you-contract-integration.md  brief for Owner
```

---

## Frozen Interfaces (the integration contract — do not change without telling all three)

These are the seams. Each track codes to these signatures; integration just swaps stubs for real.

```ts
// web/src/lib/types.ts
export type OrderStatus =
  | "awaiting_deposit"  // seller created it; buyer hasn't locked the deposit
  | "funded"            // deposit locked on-chain
  | "shipped"           // seller marked the parcel shipped
  | "delivered"         // buyer confirmed → deposit returned to buyer
  | "no_show";          // seller claimed after deadline → deposit to seller

export type OrderRow = {
  id: string;
  ref: string;                 // short share code, e.g. "EL-7QF2"
  item_name: string;
  deposit: string;             // USDC, human string e.g. "0.50"
  seller_address: string;
  buyer_address: string | null;
  deadline: string;            // ISO 8601
  delivery_code_hash: string;
  onchain_order_id: number | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};
```

```ts
// web/src/lib/wallet.ts   (Owner provides; everyone imports the singleton `wallet`)
export interface WalletAdapter {
  connect(): Promise<string>;                    // resolves to G... public key
  getAddress(): string | null;
  signTransaction(xdr: string): Promise<string>; // resolves to signed XDR
  disconnect(): Promise<void>;
}
export const wallet: WalletAdapter;
```

```ts
// web/src/lib/soroban.ts   (Owner provides)
export type Signer = (xdr: string) => Promise<string>;
export type EscrowOrder = {
  buyer: string; seller: string; token: string;
  amount: string; deadline: string; status: string;
};
export function createOrder(p: {
  buyer: string; seller: string; amountUsdc: string; deadlineUnix: number; sign: Signer;
}): Promise<{ orderId: string; hash: string }>;
export function getOrder(publicKey: string, orderId: string): Promise<EscrowOrder>;
export function confirmDelivery(p: { publicKey: string; orderId: string; sign: Signer }): Promise<{ hash: string }>;
export function claimExpired(p: { publicKey: string; orderId: string; sign: Signer }): Promise<{ hash: string }>;
```

```ts
// web/src/lib/orders.ts   (Mate 2 provides)
export function createOrderRecord(input: {
  ref: string; item_name: string; deposit: string;
  seller_address: string; deadline: string; delivery_code_hash: string;
}): Promise<OrderRow>;
export function getOrderByRef(ref: string): Promise<OrderRow | null>;
export function attachBuyer(ref: string, buyer_address: string, onchain_order_id: number): Promise<void>;
export function updateStatus(ref: string, status: OrderStatus): Promise<void>;
export function verifyDeliveryCode(ref: string, code: string): Promise<boolean>;
export function listOrdersForAddress(address: string): Promise<OrderRow[]>;
export function subscribeToOrder(ref: string, cb: (row: OrderRow) => void): () => void; // returns unsubscribe
```

```ts
// web/src/lib/crypto.ts   (Phase 0)
export function hashCode(code: string): Promise<string>; // hex SHA-256, used by create + verify
```

**Mate 1's screens never import `soroban.ts`, `orders.ts`, or `wallet.ts` directly.** They receive plain props + async callbacks. `stubData.ts` supplies fake callbacks during standalone UI work; integration wires the real ones.

---

## Sequencing

```
Phase 0 (Owner, FIRST — unblocks everyone):
   Tailwind + tokens + primitives scaffold · types.ts · crypto.ts · stub wallet/orders/soroban signatures · stubData.ts · .env.example
        │
        ├────────────────────┬─────────────────────┐
        ▼                    ▼                     ▼
   Owner track          Mate 1 (UI)           Mate 2 (Supabase)
   contract upgrade     screens vs stubs      schema + orders.ts
   + redeploy           (docs/tasks/          (docs/tasks/
   USDC setup            yohan-1-ui.md)        myr-2-supabase.md)
   wallet.ts + soroban.ts
        │                    │                     │
        └────────────────────┴─────────────────────┘
                             ▼
   Integration (Owner): swap stubs → real, end-to-end on testnet, Vercel deploy
```

The three briefs are self-contained:
- **Yohan (UI):** [`../../tasks/yohan-1-ui.md`](../../tasks/yohan-1-ui.md)
- **Myr (Supabase):** [`../../tasks/myr-2-supabase.md`](../../tasks/myr-2-supabase.md)
- **Owner:** [`../../tasks/you-contract-integration.md`](../../tasks/you-contract-integration.md)

The Owner brief contains the full Phase-0 scaffold, the contract tasks (below, in TDD), USDC setup, wallet/soroban code, integration, and deploy. The contract tasks are reproduced here as the plan's canonical record.

---

## Owner — Contract Upgrade (canonical TDD tasks)

### Task C1: Add `deadline` + `claim_expired`, flip `confirm_delivery` to the buyer

**Files:**
- Modify: `contracts/CodLock/src/lib.rs`
- Test: `contracts/CodLock/src/test.rs`

**Interfaces:**
- Produces: contract with `create_order(buyer, seller, token, amount, deadline) -> u64`, `confirm_delivery(order_id)` (buyer-auth → buyer), `claim_expired(order_id)` (seller-auth, after deadline → seller), `get_order(order_id)`.

- [ ] **Step 1: Write the failing tests** (`contracts/CodLock/src/test.rs`)

```rust
#![cfg(test)]
use soroban_sdk::{testutils::{Address as _, Ledger}, token, Address, Env};
use crate::{CodLock, CodLockClient, Status};

fn setup() -> (Env, Address, Address, Address, CodLockClient<'static>, token::Client<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    // A test token (Stellar Asset Contract) issued for the test.
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let token = token::Client::new(&env, &sac.address());
    let mint = token::StellarAssetClient::new(&env, &sac.address());
    mint.mint(&buyer, &1_000);
    let contract_id = env.register(CodLock, ());
    let client = CodLockClient::new(&env, &contract_id);
    (env, buyer, seller, sac.address(), client, token)
}

#[test]
fn confirm_delivery_returns_deposit_to_buyer() {
    let (env, buyer, seller, token_addr, client, token) = setup();
    let id = client.create_order(&buyer, &seller, &token_addr, &100, &(env.ledger().timestamp() + 60));
    assert_eq!(token.balance(&buyer), 900);      // deposit escrowed
    client.confirm_delivery(&id);
    assert_eq!(token.balance(&buyer), 1_000);    // deposit returned to buyer
    assert_eq!(client.get_order(&id).status, Status::Returned);
}

#[test]
fn claim_expired_after_deadline_pays_seller() {
    let (env, buyer, seller, token_addr, client, token) = setup();
    let id = client.create_order(&buyer, &seller, &token_addr, &100, &(env.ledger().timestamp() + 60));
    env.ledger().set_timestamp(env.ledger().timestamp() + 120); // past deadline
    client.claim_expired(&id);
    assert_eq!(token.balance(&seller), 100);     // deposit to seller
    assert_eq!(client.get_order(&id).status, Status::Claimed);
}

#[test]
#[should_panic]
fn claim_expired_before_deadline_panics() {
    let (env, buyer, seller, token_addr, client, _token) = setup();
    let id = client.create_order(&buyer, &seller, &token_addr, &100, &(env.ledger().timestamp() + 600));
    client.claim_expired(&id); // too early
}

#[test]
#[should_panic]
fn cannot_resolve_twice() {
    let (env, buyer, seller, token_addr, client, _token) = setup();
    let id = client.create_order(&buyer, &seller, &token_addr, &100, &(env.ledger().timestamp() + 60));
    client.confirm_delivery(&id);
    client.confirm_delivery(&id); // already Returned
}

#[test]
fn orders_are_isolated() {
    let (env, buyer, seller, token_addr, client, _token) = setup();
    let d = env.ledger().timestamp() + 60;
    let a = client.create_order(&buyer, &seller, &token_addr, &100, &d);
    let b = client.create_order(&buyer, &seller, &token_addr, &200, &d);
    assert_eq!(client.get_order(&a).amount, 100);
    assert_eq!(client.get_order(&b).amount, 200);
}
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd contracts/CodLock && cargo test`
Expected: compile errors / failures (`deadline`, `claim_expired`, `Status::Returned` don't exist).

- [ ] **Step 3: Implement the upgraded contract** (`contracts/CodLock/src/lib.rs`) — replace the `Status`, `Order`, and impl with:

```rust
#[derive(Clone, PartialEq, Eq, Debug)]
#[contracttype]
pub enum Status { Funded, Returned, Claimed }

#[derive(Clone, Debug)]
#[contracttype]
pub struct Order {
    pub buyer: Address,
    pub seller: Address,
    pub token: Address,
    pub amount: i128,
    pub deadline: u64,
    pub status: Status,
}

#[contractimpl]
impl CodLock {
    pub fn create_order(env: Env, buyer: Address, seller: Address, token: Address, amount: i128, deadline: u64) -> u64 {
        buyer.require_auth();
        assert!(amount > 0, "amount must be positive");
        assert!(deadline > env.ledger().timestamp(), "deadline must be in the future");
        token::Client::new(&env, &token).transfer(&buyer, &env.current_contract_address(), &amount);
        let mut id: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        id += 1;
        env.storage().instance().set(&DataKey::Counter, &id);
        let order = Order { buyer, seller, token, amount, deadline, status: Status::Funded };
        env.storage().persistent().set(&DataKey::Order(id), &order);
        id
    }

    /// Delivery confirmed by the buyer → deposit returns to the buyer.
    pub fn confirm_delivery(env: Env, order_id: u64) {
        let mut order: Order = env.storage().persistent().get(&DataKey::Order(order_id)).expect("order not found");
        order.buyer.require_auth();
        assert!(order.status == Status::Funded, "order not in funded state");
        token::Client::new(&env, &order.token).transfer(&env.current_contract_address(), &order.buyer, &order.amount);
        order.status = Status::Returned;
        env.storage().persistent().set(&DataKey::Order(order_id), &order);
    }

    /// Buyer no-show: after the deadline the seller claims the deposit — no buyer signature needed.
    pub fn claim_expired(env: Env, order_id: u64) {
        let mut order: Order = env.storage().persistent().get(&DataKey::Order(order_id)).expect("order not found");
        order.seller.require_auth();
        assert!(order.status == Status::Funded, "order not in funded state");
        assert!(env.ledger().timestamp() >= order.deadline, "deadline not reached");
        token::Client::new(&env, &order.token).transfer(&env.current_contract_address(), &order.seller, &order.amount);
        order.status = Status::Claimed;
        env.storage().persistent().set(&DataKey::Order(order_id), &order);
    }

    pub fn get_order(env: Env, order_id: u64) -> Order {
        env.storage().persistent().get(&DataKey::Order(order_id)).expect("order not found")
    }
}
```
(Keep the `DataKey` enum and imports; delete `refund_order`; update the module doc comment.)

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd contracts/CodLock && cargo test`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add contracts/CodLock/src/lib.rs contracts/CodLock/src/test.rs
git commit -m "feat(contract): deposit model — deadline + buyer-return + seller timeout-claim"
```

### Task C2: Build + redeploy to testnet, update `CONTRACT_ID`

- [ ] **Step 1: Build** — Run: `stellar contract build` (from repo root). Expected: `target/wasm32-unknown-unknown/release/cod_lock.wasm` written.
- [ ] **Step 2: Deploy** (Owner runs; needs a funded testnet key):
```bash
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/cod_lock.wasm --source my-key --network testnet
```
Expected: prints a new `CONTRACT_ID`.
- [ ] **Step 3:** Paste the new id into `web/src/lib/constants.ts` (`CONTRACT_ID`).
- [ ] **Step 4: Commit** — `git commit -am "chore: redeploy deposit-model contract; update CONTRACT_ID"`

> The rest of the Owner track (Phase-0 scaffold, USDC asset setup, `wallet.ts`, `soroban.ts` USDC/claim edits, integration, Vercel) is detailed in [`docs/tasks/you-contract-integration.md`](../../tasks/you-contract-integration.md).

---

## Integration & Acceptance (Owner, after all three tracks land)

- [ ] Replace `stubData.ts` callbacks with real ones wiring `wallet` + `soroban` + `orders`.
- [ ] **End-to-end on two devices/browsers (testnet):**
  1. Seller creates order → gets link + QR + delivery code.
  2. Buyer opens link, connects wallet, locks USDC deposit → `funded` shows on both (realtime).
  3. Buyer enters delivery code → `confirm_delivery` → deposit returns to buyer → `delivered`.
  4. Fresh order, let deadline pass → seller `claim_expired` → deposit to seller → `no_show`.
  Each step shows a real tx hash linking to Stellar Explorer.
- [ ] Deploy to Vercel (env vars set), confirm the live URL runs the full flow.
- [ ] README: new contract id, live URL, one real tx hash, updated screenshots.

---

## Self-Review (against the spec)

- **§1 contract** → Tasks C1–C2 ✔ (deadline, confirm→buyer, claim_expired, tests, redeploy).
- **§2 USDC** → Owner brief (issuer, SAC deploy, trustlines, funding helpers) ✔.
- **§3.1 wallet seam** → `wallet.ts` `WalletAdapter` ✔. **§3.2 soroban** → Owner brief ✔.
- **§3.3 Supabase** → Mate 2 brief (schema + `orders.ts`) ✔.
- **§3.4 screens / §5 design language** → Mate 1 brief + `DESIGN.md` ✔.
- **§3.5 tx status + 3 errors** → reused `classifyError` + status UI (Mate 1 status component, Owner wires) ✔.
- **§4 two-party flow** → Integration acceptance ✔.
- **§6 Vercel** → Owner brief deploy task ✔.
- **§8 team split** → three briefs ✔.
- Placeholder scan: none. Type check: `OrderStatus`, `OrderRow`, `WalletAdapter`, `Signer`, soroban signatures used identically across plan + briefs ✔.
