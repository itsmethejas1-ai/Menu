const SUPABASE_URL = 'https://gnscldexzkzpjyqygiaa.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fUKWBw9Ck8geL4qqNhn3pw_EFTXc9XL';
const money = (value) => `OMR ${Number(value).toFixed(3)}`;
const list = document.querySelector('#orders-list');
const soundToggle = document.querySelector('#sound-toggle');
let supabase;
let soundEnabled = false;
let seenIds = new Set();
let refreshTimer;
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function showLogin(message = '') {
  let panel = document.querySelector('#waiter-login-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'waiter-login-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'waiter-login-title');
    panel.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:#283b31dd;';
    panel.innerHTML = '<form id="waiter-login-form" style="width:min(100%,390px);padding:28px;background:#fffefa;border-radius:8px;box-shadow:0 20px 60px #0003"><p style="margin:0 0 8px;color:#778171;font-size:11px;font-weight:700;letter-spacing:1px">JUNIPER · STAFF ONLY</p><h2 id="waiter-login-title" style="margin:0 0 18px;font:500 32px Georgia,serif;color:#283b31">Waiter sign in</h2><label style="display:grid;gap:6px;margin:12px 0;color:#283b31;font-size:13px">Email<input name="email" type="email" autocomplete="username" required style="height:42px;padding:8px;border:1px solid #d5d9cd"></label><label style="display:grid;gap:6px;margin:12px 0;color:#283b31;font-size:13px">Password<input name="password" type="password" autocomplete="current-password" required style="height:42px;padding:8px;border:1px solid #d5d9cd"></label><p id="waiter-login-message" role="alert" style="min-height:20px;color:#9b392f;font-size:12px"></p><button class="button" type="submit" style="width:100%">Sign in to orders</button><p style="margin:14px 0 0;color:#788276;font-size:11px;line-height:1.6">Use the waiter account created for this Supabase project. Customer orders are not shown until you sign in.</p></form>';
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
  list.innerHTML = orders.map((order) => `<article class="order-card"><div class="card-head"><span class="badge ${escapeHTML(order.status)}">${escapeHTML(order.status)}</span><time>${new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time></div><h3>${escapeHTML(order.customer_name)}</h3><p class="order-number">Table / order <b>${escapeHTML(order.order_number)}</b></p><ul>${(order.items || []).map((item) => `<li><span><b>${Number(item.quantity)}×</b> ${escapeHTML(item.name)}</span><strong>${money(Number(item.price) * Number(item.quantity))}</strong></li>`).join('')}</ul><div class="card-foot"><strong>${money(order.total)}</strong><label>Status <select data-id="${escapeHTML(order.id)}" aria-label="Update status for ${escapeHTML(order.order_number)}">${['waiting', 'preparing', 'ready'].map((status) => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status[0].toUpperCase()}${status.slice(1)}</option>`).join('')}</select></label></div></article>`).join('');
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
  const { data, error } = await supabase.from('orders').select('id,customer_name,order_number,items,total,currency,status,created_at').order('created_at', { ascending: false }).limit(100);
  if (error) {
    console.error('Could not load orders:', error);
    showLogin('Could not load orders. Check the Supabase table and access policies.');
    return;
  }
  hideLogin();
  render(data || []);
}

async function start() {
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
