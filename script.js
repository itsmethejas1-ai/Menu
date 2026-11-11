const SUPABASE_URL = 'https://gnscldexzkzpjyqygiaa.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fUKWBw9Ck8geL4qqNhn3pw_EFTXc9XL';
const cart = new Map();
const cartNode = document.querySelector('#cart');
const totalNode = document.querySelector('#total');
const countNode = document.querySelector('#cart-count');
const formMessage = document.querySelector('#form-message');
const audioNote = document.querySelector('#audio-note');
const money = (value) => `OMR ${Number(value).toFixed(3)}`;
let supabase;
let backendReady = false;

// Menu prices are in OMR (three decimal places); 0.100 OMR = 100 baiza.
const menuItems = [
  { name: 'Popcorn', price: 0.100, category: 'SNACKS', description: 'Light, crunchy popcorn for a quick snack.', photo: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=900&q=85', className: 'popcorn' },
  { name: 'Dabeli', price: 0.200, category: 'VEG · INDIAN STREET FOOD', description: 'A spicy-sweet potato filling in a toasted bun.', photo: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=85', className: 'dabeli' },
  { name: 'Brownies', price: 0.200, category: 'DESSERTS', description: 'Rich, fudgy chocolate brownie.', photo: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85', className: 'brownies' },
  { name: 'Soft drinks', price: 0.150, category: 'DRINKS', description: 'A chilled soft drink to go with your meal.', photo: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=85', className: 'soft-drinks' },
  { name: 'Mojito', price: 0.300, category: 'DRINKS', description: 'A refreshing mint and lime cooler.', photo: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=85', className: 'mojito' },
  { name: 'Ice cream', price: 0.200, category: 'DESSERTS', description: 'A cool, creamy scoop of ice cream.', photo: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=85', className: 'ice-cream' },
  { name: 'Samosa', price: 0.100, category: 'VEG · SNACKS', description: 'Golden pastry filled with spiced vegetables.', photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85', className: 'samosa' },
  { name: 'Water bottle', price: 0.100, category: 'DRINKS', description: 'A bottle of refreshing water.', photo: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=85', className: 'water' },
  { name: 'French fries', price: 0.150, category: 'VEG · SNACKS', description: 'Crispy golden fries, a timeless favorite.', photo: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85', className: 'fries' },
  { name: 'Cookies', price: 0.100, category: 'DESSERTS', description: 'A freshly baked cookie for a little treat.', photo: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85', className: 'cookies' },
  { name: 'Chocolate cake', price: 0.250, category: 'DESSERTS', description: 'A slice of soft chocolate cake.', photo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85', className: 'chocolate-cake' },
  { name: 'Sipups', price: 0.050, category: 'DRINKS', description: 'A sweet, chilled sip-up drink.', photo: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85', className: 'sipups' },
  { name: 'Chai', price: 0.100, category: 'DRINKS', description: 'Warm, comforting spiced tea.', photo: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=85', className: 'chai' },
  { name: 'Chicken wrap', price: 0.300, category: 'CHICKEN', description: 'Tender chicken wrapped up for an easy, tasty meal.', photo: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=85', className: 'chicken-wrap' },
  { name: 'Burger', price: 0.300, category: 'BURGERS', description: 'A satisfying burger with fresh, tasty layers.', photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85', className: 'burger' }
];

// Render all menu cards from this list, including a spoken response for every item.
const menuGrid = document.querySelector('#menu-grid');
if (menuGrid) {
  menuGrid.replaceChildren(...menuItems.map((item) => {
    const card = document.createElement('button');
    card.className = `dish ${item.className}`;
    card.type = 'button';
    card.dataset.item = item.name;
    card.dataset.price = item.price.toFixed(3);
    card.dataset.message = `${item.name}. ${item.description} Great choice, I've added it to your order.`;

    const image = document.createElement('img');
    image.className = 'food-photo';
    image.src = item.photo;
    image.alt = item.name;
    image.loading = 'lazy';
    image.addEventListener('error', () => image.classList.add('photo-unavailable'), { once: true });

    const category = document.createElement('span');
    category.className = 'category';
    category.textContent = item.category;
    const title = document.createElement('strong');
    title.textContent = item.name;
    const description = document.createElement('span');
    description.className = 'description';
    description.textContent = item.description;
    const bottom = document.createElement('span');
    bottom.className = 'dish-bottom';
    const price = document.createElement('b');
    price.textContent = money(item.price);
    bottom.append(price);
    card.append(image, category, title, description, bottom);
    return card;
  }));
}

const oldNumberLabel = document.querySelector('#order-form input[name="number"]')?.closest('label');
if (oldNumberLabel) {
  const remarkLabel = document.createElement('label');
  remarkLabel.textContent = 'Remark for the kitchen / waiter (optional)';
  const remark = document.createElement('textarea');
  remark.name = 'kitchen_remark';
  remark.maxLength = 500;
  remark.rows = 3;
  remark.placeholder = 'e.g. Please make it mild, no onions';
  remarkLabel.append(remark);
  oldNumberLabel.replaceWith(remarkLabel);
}
const orderLead = document.querySelector('#order-section .lead, .order-section .lead');
if (orderLead) orderLead.textContent = 'Add your name and any helpful kitchen or waiter instructions.';

const reviewButton = document.createElement('button');
reviewButton.type = 'button';
reviewButton.className = 'floating-review-order';
reviewButton.hidden = true;
reviewButton.textContent = 'Review order';
reviewButton.addEventListener('click', () => document.querySelector('#order')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
document.body.append(reviewButton);

async function initializeBackend() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    backendReady = true;
  } catch (error) {
    console.error('Could not initialize the order service:', error);
    formMessage.textContent = 'The order service is unavailable right now. Please ask the waiter for help.';
  }
}

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
  const itemCount = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  countNode.textContent = itemCount;
  reviewButton.hidden = !itemCount;
  reviewButton.textContent = `Review order · ${itemCount}`;
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

const heroPhotos = [menuItems[6], menuItems[8], menuItems[14], menuItems[10]];
document.querySelectorAll('.hero-art img').forEach((image, index) => {
  const item = heroPhotos[index];
  if (!item) return;
  image.src = item.photo;
  image.alt = item.name;
});

window.addMenuDishToOrder = (card) => {
  const name = card.dataset.item;
  const item = cart.get(name) || { price: Number(card.dataset.price), quantity: 0 };
  item.quantity += 1;
  cart.set(name, item);
  renderCart();
  formMessage.textContent = `${name} added to your order.`;
  card.classList.add('selected');
  window.setTimeout(() => card.classList.remove('selected'), 450);
  speak(card.dataset.message);
};

document.querySelectorAll('.dish').forEach((card) => card.setAttribute('aria-haspopup', 'dialog'));

document.querySelector('#order-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!cart.size) {
    formMessage.textContent = 'Choose a dish you like before sending your order.';
    speak('Whenever you are ready, choose something tasty from the menu.');
    return;
  }
  const button = event.currentTarget.querySelector('button[type="submit"]');
  if (!backendReady) {
    formMessage.textContent = 'Connecting to the order service. Please try again in a moment.';
    await initializeBackend();
    if (!backendReady) return;
  }
  const formData = new FormData(event.currentTarget);
  const customerName = String(formData.get('name')).trim();
  const kitchenRemark = String(formData.get('kitchen_remark') || '').trim();
  const items = [...cart].map(([name, item]) => ({ name, price: item.price, quantity: item.quantity }));
  const order = {
    customer_name: customerName,
    kitchen_remark: kitchenRemark,
    items,
    total: Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(3)),
    currency: 'OMR',
    status: 'waiting'
  };
  button.disabled = true;
  button.textContent = 'Sending…';
  try {
    const { error } = await supabase.from('orders').insert(order);
    if (error) throw error;
    cart.clear();
    renderCart();
    event.currentTarget.reset();
    const thanks = `Thank you, ${customerName}. Your order is with the waiter.`;
    formMessage.textContent = thanks;
    speak(thanks);
  } catch (error) {
    console.error('Order submission failed:', error);
    formMessage.textContent = 'Sorry, your order could not be sent. Please ask the waiter for help.';
  } finally {
    button.disabled = false;
    button.textContent = 'Send order to the waiter ↗';
  }
});

renderCart();
initializeBackend();
