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
