# Juniper community menu demo

- `index.html`: customer menu with Chicken biryani, French fries, beef and chicken burgers, cheeseburger, Oreo milkshake, and chocolate cupcake. Affordable sample prices are shown as OMR amounts to three decimal places (baisa), such as `OMR 0.300`.
- Selecting a dish adds it to the cart and speaks a warm, item-specific message. Customers can enter their name and table/order number to send the order.
- `waiter.html`: waiter dashboard with order status controls and optional spoken alerts.

## Preview locally
Serve this folder with a static web server, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000` and `http://localhost:8000/waiter.html`.

## Important
These are example community prices; confirm them for your menu. The prototype uses browser `localStorage`, so customer and waiter pages must use the same browser profile, device, and origin to share orders. Cross-device ordering needs a shared backend/database. Browser text-to-speech may require a user gesture and device volume enabled.
