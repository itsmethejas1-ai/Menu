const SUPABASE_URL = 'https://gnscldexzkzpjyqygiaa.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fUKWBw9Ck8geL4qqNhn3pw_EFTXc9XL';
const money = (value) => `OMR ${Number(value || 0).toFixed(3)}`;
const list = document.querySelector('#orders-list');
const soundToggle = document.querySelector('#sound-toggle');
let supabase;
let soundEnabled = false;
let seenIds = new Set();
let refreshTimer;
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

// Keep the kitchen's menu and prices aligned with the customer-facing menu.
const menuItems = [
  { name: 'Popcorn', price: 0.100, category: 'Snacks', image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=480&q=80' },
  { name: 'Dabeli', price: 0.200, category: 'Veg · Street food', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=480&q=80' },
  { name: 'Brownies', price: 0.200, category: 'Desserts', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=480&q=80' },
  { name: 'Soft drinks', price: 0.300, category: 'Drinks', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=480&q=80' },
  { name: 'Mojito', price: 0.300, category: 'Drinks', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=480&q=80' },
  { name: 'Ice cream', price: 0.200, category: 'Desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=480&q=80' },
  { name: 'Samosa', price: 0.100, category: 'Veg · Snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=480&q=80' },
  { name: 'Water bottle', price: 0.100, category: 'Drinks', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=480&q=80' },
  { name: 'French fries', price: 0.150, category: 'Veg · Snacks', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=480&q=80' },
  { name: 'Cookies', price: 0.100, category: 'Desserts', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=480&q=80' },
  { name: 'Chocolate cake', price: 0.250, category: 'Desserts', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=480&q=80' },
  { name: 'Sipups', price: 0.050, category: 'Drinks', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=480&q=80' },
  { name: 'Chai', price: 0.100, category: 'Drinks', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=480&q=80' },
  { name: 'Chicken wrap', price: 0.300, category: 'Chicken', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=480&q=80' },
  { name: 'Burger', price: 0.300, category: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=480&q=80' }
];

function addMenuPanel() {
  const main = document.querySelector('main.waiter, .waiter');
  if (!main || document.querySelector('#waiter-menu-panel')) return;
  const style = document.createElement('style');
  style.textContent = `
    #waiter-menu-panel { margin:22px 0 30px; padding:22px; background:#171b22; color:#f7f2e9; border:1px solid #343943; border-radius:14px; }
    #waiter-menu-panel h2 { margin:0 0 5px; color:#fff8ed; }
    #waiter-menu-panel .menu-caption { margin:0 0 16px; color:#b7b0a5; }
    .waiter-menu-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
    .waiter-menu-item { overflow:hidden; background:#202630; border:1px solid #343943; border-radius:10px; }
    .waiter-menu-item img { display:block; width:100%; height:96px; object-fit:cover; background:#343943; }
    .waiter-menu-item-copy { padding:9px 10px 11px; }
    .waiter-menu-item small { display:block; margin-bottom:4px; color:#e5a944; text-transform:uppercase; letter-spacing:.06em; font-size:.65rem; }
    .waiter-menu-item b { display:block; color:#fff8ed; }
    .waiter-menu-item span { display:block; margin-top:4px; color:#f0b64f; font-weight:700; font-size:.87rem; }
    .order-items { margin:12px 0; padding:0; list-style:none; }
    .order-items li { display:flex; justify-content:space-between; gap:12px; padding:5px 0; border-bottom:1px solid #343943; }
    @media(max-width:600px) { #waiter-menu-panel { padding:15px; } .waiter-menu-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; } .waiter-menu-item img { height:82px; } }
  `;
  document.head.append(style);
  const panel = document.createElement('section');
  panel.id = 'waiter-menu-panel';
  panel.setAttribute('aria-labelledby', 'waiter-menu-title');
  panel.innerHTML = `<h2 id="waiter-menu-title">Current menu &amp; prices</h2><p class="menu-caption">Kitchen reference · prices in OMR (three decimals; 0.100 OMR = 100 baiza)</p><div class="waiter-menu-grid">${menuItems.map((item) => `<article class="waiter-menu-item"><img src="${item.image}" alt="${escapeHTML(item.name)}" loading="lazy"><div class="waiter-menu-item-copy"><small>${escapeHTML(item.category)}</small><b>${escapeHTML(item.name)}</b><span>${money(item.price)}</span></div></article>`).join('')}</div>`;
  const orderList = main.querySelector('#orders-list');
  if (orderList) main.insertBefore(panel, orderList);
  else main.prepend(panel);
}

function showLogin(message = '') {
  let panel = document.querySelector('#waiter-login-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'waiter-login-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'waiter-login-title');
    panel.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:#11151bdd;';
    panel.innerHTML = '<form id="waiter-login-form" style="width:min(100%,390px);padding:28px;background:#1b2028;color:#f7f2e9;border:1px solid #454b55;border-radius:12px;box-shadow:0 20px 60px #0008"><p style="margin:0 0 8px;color:#e5a944;font-weight:700">SECURE STAFF ACCESS</p><h2 id="waiter-login-title" style="margin:0 0 16px">Waiter sign in</h2><label style="display:block;margin:10px 0">Email<input name="email" type="email" required autocomplete="username" style="display:block;width:100%;padding:11px;margin-top:5px"></label><label style="display:block;margin:10px 0">Password<input name="password" type="password" required autocomplete="current-password" style="display:block;width:100%;padding:11px;margin-top:5px"></label><p id="waiter-login-message" role="status"></p><button type="submit" style="padding:12px 16px;background:#e5a944;color:#17191d;border:0;border-radius:6px;font-weight:700">Sign in to orders</button></form>';
    document.body.append(panel);
    panel.querySelector('#waiter-login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector('button[type="submit"]');
      const data = new FormData(form);
      submit.disabled = true;
      submit.textContent = 'Signing in…';
      panel.querySelector('#waiter-login-message').textContent = '';
      const { error } = await supabase.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') });
      if (error) panel.querySelector('#waiter-login-message').textContent = error.message;
      submit.disabled = false;
      submit.textContent = 'Sign in to orders';
    });
  }
  panel.hidden = false;
  panel.querySelector('#waiter-login-message').textContent = message;
}

function hideLogin() {
  const panel = document.querySelector('#waiter-login-panel');
  if (panel) panel.hidden = true;
}

function render(orders) {
  const fresh = orders.filter((order) => !seenIds.has(order.id));
  if (soundEnabled && seenIds.size && fresh.length && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`New order from ${fresh[0].customer_name}, ${fresh[0].order_number}.`));
  }
  seenIds = new Set(orders.map((order) => order.id));
  for (const status of ['waiting', 'preparing', 'ready']) {
    const count = document.querySelector(`#${status}`);
    if (count) count.textContent = orders.filter((order) => order.status === status).length;
  }
  const updated = document.querySelector('#updated');
  if (updated) updated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (!list) return;
  if (!orders.length) {
    list.innerHTML = '<div class="empty"><span>✳</span><h3>No orders yet</h3><p>New customer orders will appear here.</p><a href="index.html#menu">Open customer menu ↗</a></div>';
    return;
  }
  list.innerHTML = orders.map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemRows = items.map((item) => `<li><span>${escapeHTML(item.quantity)} × ${escapeHTML(item.name)}</span><strong>${money(Number(item.price) * Number(item.quantity))}</strong></li>`).join('');
    const remark = order.kitchen_remark ? `<p class="kitchen-remark"><b>Kitchen / waiter note</b>${escapeHTML(order.kitchen_remark)}</p>` : '';
    return `<article class="order-card"><div class="card-head"><span class="badge ${escapeHTML(order.status)}">${escapeHTML(order.status)}</span><time>${new Date(order.created_at).toLocaleString()}</time></div><h3>${escapeHTML(order.customer_name || 'Customer')}</h3><p class="order-number">Order ${escapeHTML(order.order_number ?? '')}</p>${remark}<ul class="order-items">${itemRows}</ul><p class="order-total"><b>Total</b><strong>${money(order.total)}</strong></p><label>Update status<select data-id="${escapeHTML(order.id)}"><option value="waiting" ${order.status === 'waiting' ? 'selected' : ''}>Waiting</option><option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option><option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option></select></label></article>`;
  }).join('');
  list.querySelectorAll('select').forEach((select) => select.addEventListener('change', async () => {
    select.disabled = true;
    const { error } = await supabase.from('orders').update({ status: select.value }).eq('id', select.dataset.id);
    select.disabled = false;
    if (error) { console.error('Could not update order status:', error); alert('Could not update this order. Please refresh and try again.'); }
    await loadOrders();
  }));
}

async function loadOrders() {
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { showLogin(); return; }
  const { data, error } = await supabase.from('orders').select('id,customer_name,order_number,items,total,currency,status,created_at,kitchen_remark').order('created_at', { ascending: false }).limit(100);
  if (error) {
    console.error('Could not load orders:', error);
    showLogin('Could not load orders. Check the Supabase table and access policies.');
    return;
  }
  hideLogin();
  render(data || []);
}

async function start() {
  addMenuPanel();
  showLogin('Connecting to the secure order dashboard…');
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) showLogin();
    supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        hideLogin();
        loadOrders();
        if (!refreshTimer) refreshTimer = window.setInterval(loadOrders, 5000);
      } else {
        if (refreshTimer) window.clearInterval(refreshTimer);
        refreshTimer = undefined;
        seenIds.clear();
        showLogin();
      }
    });
    if (session) {
      hideLogin();
      await loadOrders();
      refreshTimer = window.setInterval(loadOrders, 5000);
    }
  } catch (error) {
    console.error('Could not initialize secure waiter dashboard:', error);
    showLogin('Could not connect to the order service. Please refresh and try again.');
  }
}

if (soundToggle) soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? 'Sound on' : 'Sound off';
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  if (soundEnabled && 'speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance('Notifications are on. I will let you know when a new order arrives.'));
});
const refreshButton = document.querySelector('#refresh');
if (refreshButton) refreshButton.addEventListener('click', loadOrders);
const clearButton = document.querySelector('#clear-ready');
if (clearButton) clearButton.addEventListener('click', async () => {
  if (!supabase || !confirm('Remove all orders marked ready?')) return;
  const { error } = await supabase.from('orders').delete().eq('status', 'ready');
  if (error) alert('Could not clear ready orders. Please try again.');
  await loadOrders();
});
start();
