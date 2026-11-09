# Juniper menu ordering demo

- `index.html`: customer menu with Chicken biryani, French fries, Classic beef burger, Chicken burger, Cheeseburger, Oreo milkshake, and Chocolate cupcake. Prices are displayed in Omani rial (OMR) to three decimal places (baisa).
- Choosing a menu item adds it to the cart and speaks a cheerful, item-specific message.
- `waiter.html`: waiter dashboard with order status controls and optional spoken alerts.

## Preview locally
Serve this folder with a static web server, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000` and `http://localhost:8000/waiter.html`.

## Important
This prototype uses browser `localStorage`; customer and waiter pages must use the same browser profile, device, and origin to share orders. Cross-device ordering needs a shared backend/database. Audio uses browser text-to-speech and may require a user gesture and device volume enabled.
