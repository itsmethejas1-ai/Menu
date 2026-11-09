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
  utterance.rate = 0.94;
  utterance.pitch = 1.04;
  window.speechSynthesis.speak(utterance);
  audioNote.textContent = `Playing: “${message}”`;
}

function renderCart() {
  countNode.textContent = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  if (!cart.size) {
    cartNode.innerHTML = '<p class="empty-cart">Choose a dish above to start your order.</p>';
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
    remove.type = 'button';
    remove.textContent = '−';
    remove.setAttribute('aria-label', `Remove one ${name}`);
    remove.addEventListener('click', () => {
      item.quantity -= 1;
      if (!item.quantity) cart.delete(name);
      renderCart();
    });
    const quantity = document.createElement('b');
    quantity.textContent = item.quantity;
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = '+';
    add.setAttribute('aria-label', `Add one ${name}`);
    add.addEventListener('click', () => { item.quantity += 1; renderCart(); });
    controls.append(remove, quantity, add);
    const subtotal = document.createElement('strong');
    subtotal.textContent = money(item.price * item.quantity);
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
  if (!cart.size) {
    formMessage.textContent = 'Choose a dish you like before sending your order.';
    speak('Whenever you are ready, choose something tasty from the menu.');
    return;
  }
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
    cart.clear();
    renderCart();
    event.currentTarget.reset();
    const thanks = `Thank you, ${customerName}. Your order is with the waiter. We hope you enjoy it.`;
    formMessage.textContent = thanks;
    speak(thanks);
  } catch {
    formMessage.textContent = 'Sorry, your order could not be saved. Please ask the waiter for help.';
  }
});

renderCart();
