const STORAGE_KEY = 'juniper-orders-v1';
const cart = new Map();
const cartNode = document.querySelector('#cart');
const totalNode = document.querySelector('#total');
const countNode = document.querySelector('#cart-count');
const formMessage = document.querySelector('#form-message');
const audioNote = document.querySelector('#audio-note');
const money = (value) => `OMR ${value.toFixed(3)}`;

function speak(message) {
  if (!('speechSynthesis' in window)) {
    audioNote.textContent = 'Spoken audio is not supported in this browser. You can still add items to your order.';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
  audioNote.textContent = `Playing: “${message}”`;
}

function renderCart() {
  const totalItems = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  countNode.textContent = totalItems;
  if (!cart.size) {
    cartNode.innerHTML = '<p class="empty-cart">Tap a menu item above to add it here.</p>';
    totalNode.textContent = money(0);
    return;
  }
  cartNode.replaceChildren();
  let total = 0;
  for (const [name, item] of cart) {
    total += item.price * item.quantity;
    const row = document.createElement('div');
    row.className = 'cart-row';
    const title = document.createElement('span');
    title.textContent = name;
    const controls = document.createElement('span');
    controls.className = 'quantity';
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = '−'; remove.setAttribute('aria-label', `Remove one ${name}`);
    remove.addEventListener('click', () => { item.quantity -= 1; if (!item.quantity) cart.delete(name); renderCart(); });
    const quantity = document.createElement('b'); quantity.textContent = item.quantity;
    const add = document.createElement('button');
    add.type = 'button'; add.textContent = '+'; add.setAttribute('aria-label', `Add one ${name}`);
    add.addEventListener('click', () => { item.quantity += 1; renderCart(); });
    controls.append(remove, quantity, add);
    const subtotal = document.createElement('strong'); subtotal.textContent = money(item.price * item.quantity);
    row.append(title, controls, subtotal);
    cartNode.append(row);
  }
  totalNode.textContent = money(total);
}

document.querySelectorAll('.dish').forEach((card) => card.addEventListener('click', () => {
  const name = card.dataset.item;
  const item = cart.get(name) || { price: Number(card.dataset.price), quantity: 0 };
  item.quantity += 1;
  cart.set(name, item);
  renderCart();
  formMessage.textContent = `${name} added to your order.`;
  card.classList.add('selected');
  window.setTimeout(() => card.classList.remove('selected'), 450);
  speak(card.dataset.message);
}));

document.querySelector('#order-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!cart.size) { formMessage.textContent = 'Choose at least one menu item first.'; speak('Choose something tasty from the menu first.'); return; }
  const formData = new FormData(event.currentTarget);
  const customerName = String(formData.get('name')).trim();
  const orderNumber = String(formData.get('number')).trim();
  const items = [...cart].map(([name, item]) => ({ name, price: item.price, quantity: item.quantity }));
  const order = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    customerName,
    orderNumber,
    currency: 'OMR',
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: 'waiting',
    createdAt: new Date().toISOString()
  };
  try {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    orders.unshift(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    cart.clear(); renderCart(); event.currentTarget.reset();
    formMessage.textContent = `Thanks, ${customerName}! Your order was sent to the waiter.`;
    speak(`Thanks, ${customerName}! Your order was sent to the waiter.`);
  } catch {
    formMessage.textContent = 'Could not save your order. Please ask the waiter for help.';
  }
});

renderCart();
