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

// Keep menu photography bundled with the site so it remains available offline and
// does not depend on third-party image hosts.
const localFoodPhotos = {
  biryani: 'assets/food/chicken-biryani.svg',
  fries: 'assets/food/french-fries.svg',
  beefBurger: 'assets/food/beef-burger.svg',
  chickenBurger: 'assets/food/chicken-burger.svg',
  cheeseburger: 'assets/food/cheeseburger.svg',
  shake: 'assets/food/oreo-milkshake.svg',
  cupcake: 'assets/food/chocolate-cupcake.svg'
};

function photoForDish(dish) {
  if (dish.classList.contains('biryani')) return localFoodPhotos.biryani;
  if (dish.classList.contains('fries')) return localFoodPhotos.fries;
  if (dish.classList.contains('shake')) return localFoodPhotos.shake;
  if (dish.classList.contains('cupcake')) return localFoodPhotos.cupcake;
  if (dish.dataset.item === 'Chicken burger') return localFoodPhotos.chickenBurger;
  if (dish.dataset.item === 'Cheeseburger') return localFoodPhotos.cheeseburger;
  return localFoodPhotos.beefBurger;
}

document.querySelectorAll('.food-photo').forEach((image) => {
  const dish = image.closest('.dish');
  if (dish) image.src = photoForDish(dish);
  image.addEventListener('error', () => image.classList.add('photo-unavailable'), { once: true });
});

// The hero collage uses the same bundled artwork as the corresponding menu items.
const heroPhotos = [localFoodPhotos.biryani, localFoodPhotos.fries, localFoodPhotos.beefBurger, localFoodPhotos.cupcake];
document.querySelectorAll('.hero-art img').forEach((image, index) => {
  if (heroPhotos[index]) image.src = heroPhotos[index];
});

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
  const orderNumber = String(formData.get('number')).trim();
  const items = [...cart].map(([name, item]) => ({ name, price: item.price, quantity: item.quantity }));
  const order = {
    customer_name: customerName,
    order_number: orderNumber,
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
    const thanks = `Thank you, ${customerName}. Your order is with the waiter. We hope you enjoy it.`;
    formMessage.textContent = thanks;
    speak(thanks);
  } catch (error) {
    console.error('Order submission failed:', error);
    formMessage.textContent = 'Sorry, your order could not be sent. Please ask the waiter for help.';
  } finally {
    button.disabled = false;
    button.textContent = 'Send to the waiter ↗';
  }
});

renderCart();
initializeBackend();
