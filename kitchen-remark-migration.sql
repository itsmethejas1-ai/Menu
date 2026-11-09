-- Add this migration to existing Supabase projects to store kitchen remarks instead of requiring a table/order number.
-- Run in Supabase Dashboard > SQL Editor. Existing order_number data is preserved, but made optional for older rows.
alter table public.orders
  add column if not exists kitchen_remark text not null default '';

alter table public.orders alter column order_number drop not null;
alter table public.orders drop constraint if exists orders_order_number_check;

-- Keep new customer submissions validated with the new optional kitchen remark field.
drop policy if exists "Customers can submit orders" on public.orders;
create policy "Customers can submit orders"
  on public.orders for insert to anon, authenticated
  with check (
    char_length(btrim(customer_name)) between 1 and 60
    and (kitchen_remark is null or char_length(kitchen_remark) <= 500)
    and jsonb_typeof(items) = 'array'
    and total >= 0 and total <= 1000
    and currency = 'OMR'
    and status = 'waiting'
  );
