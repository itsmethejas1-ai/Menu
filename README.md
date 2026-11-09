# Juniper community menu

- `index.html`: customer menu with food photos, warm audio responses, and affordable sample OMR prices (three decimal places, e.g. `OMR 0.300`).
- `script.js`: saves submitted customer orders to the shared Supabase database.
- `waiter.html`: waiter dashboard; sign-in is required before orders are read or changed. Orders refresh every five seconds.
- `supabase-schema.sql`: creates the database tables and row-level security policies.

## Configure the shared backend
1. In Supabase, open **SQL Editor**, create a query, paste all of `supabase-schema.sql`, and run it.
2. In **Authentication → Users**, create a waiter email/password account. Keep public sign-ups disabled.
3. Copy that user's UUID and run the `insert into public.waiter_access...` statement at the end of the SQL file with the real UUID.
4. Open `waiter.html` on your tablet and sign in with that waiter account. New customer orders submitted from any device on the live site will then appear on the dashboard.

The website uses only the Supabase project URL and publishable key in browser code. Do not add a service-role key or share your Supabase password. The publishable key is not a secret; row-level security is what protects the orders.

## Preview locally
Serve this folder with a static web server, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000` and `http://localhost:8000/waiter.html`. Ensure the Supabase project allows the site's GitHub Pages URL in its authentication URL settings.

Prices are example community prices; confirm them for your menu. Food photography is loaded from Unsplash. This prototype does not process payments.
