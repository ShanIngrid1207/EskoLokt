# Combine Plan — Port on-chain delivery-code + Practice demo + launch kit into the integrated app

> **Base = Track B** (this repo, `main`: the integrated mobile app with Supabase + teammates' work).
> **Source = Track A** (`C:\Users\tagal\ShipStudio\eskolokt`: the deposit contract with an
> on-chain delivery-code hash, deployed + verified on Testnet as `CA3B33WR…`).
>
> Nothing here overwrites teammates' work — it upgrades the shared contract and adds
> two files. The one coordination point is the **contract redeploy + shared `CONTRACT_ID` update**.

**Goal:** Make the delivery code the app already uses **enforced on-chain** (not only in Supabase), and bring over Track A's polished Practice-mode demo and Product Hunt launch kit.

**Why it matters:** Today `confirm_delivery(order_id)` takes no code — the code is checked only in `verifyDeliveryCode()` against Supabase ([web/src/App.tsx](../../web/src/App.tsx) ~L159). A buyer who calls the contract directly can reclaim their deposit with no code, bypassing the app. Putting the code hash on-chain closes that.

## Global Constraints
- Testnet only. Network passphrase `Test SDF Network ; September 2015`. soroban-sdk 25.
- Keep Track B's existing shape: status enum `Funded/Returned/Claimed`, absolute `deadline` (unix secs) param, `claim_expired` name — change ONLY what the code hash requires.
- Deposit asset stays the native XLM SAC (`DEPOSIT_SAC` in escrow.ts).
- Delivery code is **6 digits** (matches Track B's existing UI + `genDeliveryCode`).
- Do all work on a new branch `combine-onchain-code`. **Do not push or merge** until the user coordinates the redeploy with teammates (Yohan/Myr).
- Build toolchain is now local (rustc 1.97 + stellar CLI 27); `cargo update -p ethnum` if the ethnum E0512 build error appears.

---

### Task 1: Add the on-chain code hash to the contract (TDD)

**Files:** Modify `contracts/CodLock/src/lib.rs`, `contracts/CodLock/src/test.rs`.

**Change:** Add `code_hash: BytesN<32>` to `Order`; `create_order` gains a trailing `code_hash: BytesN<32>` param and stores it; `confirm_delivery` gains a trailing `code: Bytes` param and asserts `env.crypto().sha256(&code).to_bytes() == order.code_hash` before returning the deposit. Keep everything else (Funded status, deadline, claim_expired) unchanged.

- [ ] **Step 1 — tests first.** Add to `test.rs`: import `Bytes, BytesN`, a `code_and_hash(env)` helper (code = `Bytes::from_slice(env, b"123456")`, hash = `env.crypto().sha256(&code).to_bytes()`), and update every `create_order(...)` call to pass the hash and every `confirm_delivery(id)` to pass the code. Add two new tests: `confirm_with_wrong_code_rejected` (a `try_confirm_delivery` with `b"999999"` is `is_err()` and status stays `Funded`) and keep the happy path asserting the deposit returns to the buyer.
- [ ] **Step 2 — run, expect FAIL to compile** (`cargo test -p CodLock`; old signatures).
- [ ] **Step 3 — edit `lib.rs`:** add `use soroban_sdk::{... Bytes, BytesN}`; add `pub code_hash: BytesN<32>` to `Order`; add the `code_hash` param to `create_order` and set it on the struct; add `code: Bytes` to `confirm_delivery` and, right after loading the order and the `status == Funded` assert, add:
  ```rust
  let computed = env.crypto().sha256(&code).to_bytes();
  assert!(computed == order.code_hash, "wrong delivery code");
  ```
  (Reference implementation: `C:\Users\tagal\ShipStudio\eskolokt\contracts\CodLock\src\lib.rs`, already deployed + verified.)
- [ ] **Step 4 — run tests, expect PASS** (`cargo test -p CodLock`).
- [ ] **Step 5 — commit** `feat(contract): enforce delivery-code hash on-chain in confirm_delivery`.

### Task 2: Build + redeploy the contract; capture the new id

**Files:** none (deploy).

- [ ] **Step 1:** `stellar contract build` (PowerShell; refresh `$env:Path` from Machine+User first).
- [ ] **Step 2:** deploy with the existing testnet key (or `stellar keys generate esko-key --network testnet --fund`): `stellar contract deploy --wasm target\wasm32v1-none\release\CodLock.wasm --source esko-key --network testnet`. **Record the new `C…` id.**
- [ ] **Step 3 — on-chain smoke test:** `create_order` (deposit, deadline = now+600, code_hash of "123456") → `confirm_delivery --order_id 1 --code 313233343536` succeeds; a wrong `--code` traps. `get_order` shows `Returned`.

### Task 3: Thread the code through `escrow.ts`

**Files:** Modify `web/src/lib/escrow.ts`.

- [ ] **Step 1:** add `import { BytesN? }` — use `xdr` + `Buffer`; add helper `sha256Hex(text)` (Web Crypto) and `bytesN32(hex)` → `xdr.ScVal.scvBytes(Buffer.from(hex-bytes))`. In `createOrder`, add param `codeHashHex: string` and append `bytesN32(p.codeHashHex)` to the `create_order` call args. In `confirmDelivery`, add param `code: string` and append `xdr.ScVal.scvBytes(Buffer.from(new TextEncoder().encode(p.code)))` to the `confirm_delivery` call args.
- [ ] **Step 2:** `cd web && npm run typecheck` → PASS.
- [ ] **Step 3 — commit** `feat(chain): pass delivery-code hash/code to the contract`.

### Task 4: Wire the glue in `App.tsx`

**Files:** Modify `web/src/App.tsx`.

- [ ] **Step 1:** In `handleCreate`, the code + `delivery_code_hash` are already generated (`genDeliveryCode()` + `hashCode()`). Ensure `hashCode` produces the **sha256 hex of the UTF-8 code** to match the contract (align it with `sha256Hex`); pass that hex as `createOrder({..., codeHashHex: delivery_code_hash})`. In `handleConfirmDelivery(code)`, pass the entered `code` into `confirmDelivery({ publicKey, orderId, code, sign })`. Keep the Supabase `verifyDeliveryCode` call as a fast UX pre-check (optional), but the contract is now the source of truth.
- [ ] **Step 2:** update `CONTRACT_ID` in `web/src/lib/constants.ts` (and any `VITE_CONTRACT_ID` fallback) to the Task 2 id.
- [ ] **Step 3:** `cd web && npm run build` → green.
- [ ] **Step 4 — commit** `feat: on-chain delivery-code confirm end-to-end`.

### Task 5: Port the Practice-mode demo

**Files:** Create `web/src/screens/PracticeScreen.tsx` (adapt `ShipStudio\eskolokt\web\src\components\EscrowDemo.tsx` to Track B's `ui/primitives` + Tailwind); add a route/entry from `HomeScreen`.

- [ ] Adapt the simulated deposit walkthrough (place order → rider enters code → deposit returned; "didn't accept" → deposit to seller) using `Card/Button/MicroLabel`. No wallet, no chain. Add a "Try the practice demo" link on `HomeScreen`.
- [ ] `npm run build` → green. **Commit** `feat(ui): practice-mode teaching demo screen`.

### Task 6: Launch kit

**Files:** Copy `ShipStudio\eskolokt\docs\launch\product-hunt.md` → `docs/launch/product-hunt.md` (fix links to this repo's live URL + the new contract id).

- [ ] **Commit** `docs: Product Hunt launch assets`.

---

## Coordination checklist (before merge/push — user + teammates)
1. New `CONTRACT_ID` must be shared with Yohan + Myr and set in their `.env` / `constants.ts`.
2. Supabase `delivery_code_hash` column stays; contract is now the enforcing layer.
3. Merge `combine-onchain-code` → `main` only after teammates ack the new contract id.

## Self-review
- Security fix (Tasks 1–4), Practice demo (Task 5), launch kit (Task 6) — all three requested items covered.
- Contract change is additive + matches Track A's deployed, verified reference — low risk.
- No teammate file is deleted; only `lib.rs`/`test.rs`/`escrow.ts`/`App.tsx`/`constants.ts` are edited and two files added.
