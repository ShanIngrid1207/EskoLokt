# Brief — Mate 2: Supabase order book + setup docs

Hi! Your job is the **shared database** that lets a seller's phone and a buyer's phone
talk about the same order. The blockchain holds the money; **you hold everything needed to
coordinate and show a nice UI** (item name, share code, delivery-code hash, live status).

**You barely need AI for this.** Everything you need is below — copy the SQL, copy the
functions, follow the test steps. If you get stuck, ask the owner, not an AI.

**Working folder:** `web/` (the app). Branch: `real-deposit-escrow-prototype`.
**You depend on (already in the repo from the owner's Phase 0):** `web/src/lib/types.ts`
(the `OrderStatus` and `OrderRow` types) and `web/src/lib/crypto.ts` (`hashCode`).

---

## Task S1: Create the Supabase project + table

- [ ] **Step 1:** Go to https://supabase.com → the project the team is using (ask the owner
  for access), or create a new project named `eskolokt`. Note the **Project URL** and the
  **anon public key** (Settings → API). Give these to the owner for the Vercel env vars.

- [ ] **Step 2:** In the Supabase dashboard → **SQL Editor**, paste and run this. Also save
  it in the repo as `supabase/schema.sql`.

```sql
-- supabase/schema.sql — EskoLokt order book (prototype-grade)
create table if not exists orders (
  id                 uuid primary key default gen_random_uuid(),
  ref                text unique not null,           -- short share code, e.g. 'EL-7QF2'
  item_name          text not null,
  deposit            text not null,                  -- USDC amount as a string, e.g. '0.50'
  seller_address     text not null,
  buyer_address      text,                           -- set when the buyer locks the deposit
  deadline           timestamptz not null,
  delivery_code_hash text not null,
  onchain_order_id   bigint,                         -- set after the on-chain create_order
  status             text not null default 'awaiting_deposit',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_seller_idx on orders (seller_address);
create index if not exists orders_buyer_idx  on orders (buyer_address);

-- keep updated_at fresh
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
drop trigger if exists orders_touch on orders;
create trigger orders_touch before update on orders
  for each row execute function touch_updated_at();

-- PROTOTYPE access: no user accounts yet, so allow the anon key full access.
-- NOT production-safe — documented as a known prototype limitation.
alter table orders enable row level security;
drop policy if exists orders_anon_all on orders;
create policy orders_anon_all on orders for all
  to anon using (true) with check (true);

-- live updates so both phones see status changes
alter publication supabase_realtime add table orders;
```

- [ ] **Step 3:** In **Table Editor**, insert one row by hand (any values) and confirm it
  saves. Then delete it. This proves the table + policies work.

- [ ] **Step 4: Commit** the SQL file:
```bash
git add supabase/schema.sql
git commit -m "feat(db): orders table, prototype RLS, realtime"
```

---

## Task S2: The Supabase client

**File:** Create `web/src/lib/supabase.ts`

- [ ] **Step 1:** Install the client (in `web/`): `npm install @supabase/supabase-js`
- [ ] **Step 2:** Write the file:

```ts
// web/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  console.warn("Supabase env vars missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anon);
```

- [ ] **Step 3:** Create `web/.env.local` (do NOT commit it) with the values from Task S1:
```
VITE_SUPABASE_URL=https://YOURPROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```
- [ ] **Step 4: Commit** (the code only): `git add web/src/lib/supabase.ts web/package.json web/package-lock.json && git commit -m "feat(db): supabase client from env"`

---

## Task S3: The data-access functions

**File:** Create `web/src/lib/orders.ts`. These are the exact functions the app imports
(the "frozen interface" — don't rename them).

- [ ] **Step 1:** Write the file:

```ts
// web/src/lib/orders.ts — the app's only door to the order book.
import { supabase } from "./supabase";
import { hashCode } from "./crypto";
import type { OrderRow, OrderStatus } from "./types";

export async function createOrderRecord(input: {
  ref: string; item_name: string; deposit: string;
  seller_address: string; deadline: string; delivery_code_hash: string;
}): Promise<OrderRow> {
  const { data, error } = await supabase.from("orders").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

export async function getOrderByRef(ref: string): Promise<OrderRow | null> {
  const { data, error } = await supabase.from("orders").select("*").eq("ref", ref).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OrderRow) ?? null;
}

export async function attachBuyer(ref: string, buyer_address: string, onchain_order_id: number): Promise<void> {
  const { error } = await supabase.from("orders")
    .update({ buyer_address, onchain_order_id, status: "funded" as OrderStatus })
    .eq("ref", ref);
  if (error) throw new Error(error.message);
}

export async function updateStatus(ref: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("ref", ref);
  if (error) throw new Error(error.message);
}

export async function verifyDeliveryCode(ref: string, code: string): Promise<boolean> {
  const row = await getOrderByRef(ref);
  if (!row) return false;
  const hash = await hashCode(code.trim().toUpperCase());
  return hash === row.delivery_code_hash;
}

export async function listOrdersForAddress(address: string): Promise<OrderRow[]> {
  const { data, error } = await supabase.from("orders").select("*")
    .or(`seller_address.eq.${address},buyer_address.eq.${address}`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

export function subscribeToOrder(ref: string, cb: (row: OrderRow) => void): () => void {
  const channel = supabase
    .channel(`order:${ref}`)
    .on("postgres_changes",
      { event: "*", schema: "public", table: "orders", filter: `ref=eq.${ref}` },
      (payload) => cb(payload.new as OrderRow))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
```

- [ ] **Step 2: Prove it works** — add a temporary throwaway script `web/src/lib/orders.smoke.ts`:

```ts
import { createOrderRecord, getOrderByRef, updateStatus, subscribeToOrder } from "./orders";
import { hashCode } from "./crypto";

(async () => {
  const ref = "EL-TEST1";
  const stop = subscribeToOrder(ref, (row) => console.log("realtime:", row.status));
  await createOrderRecord({
    ref, item_name: "Test tee", deposit: "0.50",
    seller_address: "GSELLERTEST", deadline: new Date(Date.now() + 3600_000).toISOString(),
    delivery_code_hash: await hashCode("ABCD"),
  });
  console.log("read back:", (await getOrderByRef(ref))?.item_name); // "Test tee"
  await updateStatus(ref, "funded"); // realtime log should fire with "funded"
  setTimeout(stop, 1500);
})();
```
Run it via a temporary button or `import` in `main.tsx`, watch the browser console for
`read back: Test tee` and `realtime: funded`. Then **delete the smoke file** and the test row.

- [ ] **Step 3: Commit** — `git add web/src/lib/orders.ts && git commit -m "feat(db): order-book data access + realtime subscribe"`

---

## Task S4: Testnet setup doc (prose — no code)

**File:** Create `docs/SETUP-testnet.md`. Write a short, friendly guide for a first-time
user getting ready to use EskoLokt on testnet. Cover, in plain steps:

1. Install a Stellar wallet on your phone (the owner will tell you which one the app uses).
2. Switch it to **Testnet**.
3. In the app, tap **Get test funds** (this gives you test XLM for fees + test USDC for the deposit).
4. Approve the **USDC trustline** when the app asks (one tap — it lets your wallet hold USDC).
5. You're ready: open a seller's order link, or create your own order.

Leave a clearly-marked placeholder `> TODO(owner): wallet name + test-USDC issuer address`
for the two facts only the owner has. Commit: `git commit -am "docs: testnet setup guide"`.

---

## Definition of done
- [ ] `orders` table live in Supabase with realtime on; `supabase/schema.sql` committed.
- [ ] `web/src/lib/supabase.ts` + `web/src/lib/orders.ts` committed; smoke test passed then removed.
- [ ] `docs/SETUP-testnet.md` committed.
- [ ] You did **not** touch the contract, the UI screens, or `wallet.ts`/`soroban.ts` — those are other people's tracks.

**Questions?** Ask the owner. The function names in `orders.ts` are a contract with the rest
of the app — if you think one needs to change, tell the owner before changing it.
