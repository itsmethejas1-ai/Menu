-- Juniper shared order backend (Supabase)
-- Run this whole file in Supabase Dashboard > SQL Editor > New query.
-- Customer browsers may submit new orders, but only explicitly allowlisted waiter users can read/change them.

create table if not exists public.waiter_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.waiter_access enable row level security;
grant select on public.waiter_access to authenticated;
drop policy if exists "Waiter can read own access row" on public.waiter_access;
create policy "Waiter can read own access row"
  on public.waiter_access for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(btrim(customer_name)) between 1 and 60),
  order_number text not null check (char_length(btrim(order_number)) between 1 and 20),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total numeric(10,3) not null check (total >= 0 and total <= 1000),
  currency text not null default 'OMR' check (currency = 'OMR'),
  status text not null default 'waiting' check (status in ('waiting', 'preparing', 'ready')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;
drop policy if exists "Customers can submit orders" on public.orders;
create policy "Customers can submit orders"
  on public.orders for insert to anon, authenticated
  with check (
    char_length(btrim(customer_name)) between 1 and 60
    and char_length(btrim(order_number)) between 1 and 20
    and jsonb_typeof(items) = 'array'
    and total >= 0 and total <= 1000
    and currency = 'OMR'
    and status = 'waiting'
  );
drop policy if exists "Allowlisted waiter can read orders" on public.orders;
create policy "Allowlisted waiter can read orders"
  on public.orders for select to authenticated
  using (exists (select 1 from public.waiter_access wa where wa.user_id = (select auth.uid())));
drop policy if exists "Allowlisted waiter can update orders" on public.orders;
create policy "Allowlisted waiter can update orders"
  on public.orders for update to authenticated
  using (exists (select 1 from public.waiter_access wa where wa.user_id = (select auth.uid())))
  with check (exists (select 1 from public.waiter_access wa where wa.user_id = (select auth.uid())));
drop policy if exists "Allowlisted waiter can delete orders" on public.orders;
create policy "Allowlisted waiter can delete orders"
  on public.orders for delete to authenticated
  using (exists (select 1 from public.waiter_access wa where wa.user_id = (select auth.uid())));

create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- To activate the waiter dashboard securely:
-- 1) In Supabase Authentication, create the waiter user with email/password.
-- 2) Copy that user's UUID from Authentication > Users.
-- 3) Run the following in SQL Editor, replacing the UUID with that user's ID:
-- insert into public.waiter_access (user_id) values ('00000000-0000-0000-0000-000000000000');
-- Keep public sign-ups disabled. Never put a service_role key in this website.
