const STORAGE_KEY = 'juniper-orders-v1';
const list = document.querySelector('#orders-list');
const soundToggle = document.querySelector('#sound-toggle');
let soundEnabled = false;
let seenIds = new Set();
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = (value) => `$${Number(value).toFixed(2)}`;
function getOrders() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function render() {
  const orders = getOrders();
  const fresh = orders.filter((order) => !seenIds.has(order.id));
  if (soundEnabled && seenIds.size && fresh.length && 'speechSynthesis' in window) {
    const order = fresh[0]; window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`New order from ${order.customerName}, ${order.orderNumber}.`));
  }
  seenIds = new Set(orders.map((order) => order.id));
  for (const status of ['waiting', 'preparing', 'ready']) document.querySelector(`#${status}`).textContent = orders.filter((order) => order.status === status).length;
  document.querySelector('#updated').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (!orders.length) { list.innerHTML = '<div class="empty"><span>✳</span><h3>No orders yet</h3><p>Customer orders will show here.</p><a href="index.html#menu">Open customer menu ↗</a></div>'; return; }
  list.innerHTML = orders.map((order) => `<article class="order-card"><div class="card-head"><span class="badge ${escapeHTML(order.status)}">${escapeHTML(order.status)}</span><time>${new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time></div><h3>${escapeHTML(order.customerName)}</h3><p class="order-number">Table / order <b>${escapeHTML(order.orderNumber)}</b></p><ul>${(order.items || []).map((item) => `<li><span><b>${Number(item.quantity)}×</b> ${escapeHTML(item.name)}</span><strong>${money(item.price * item.quantity)}</strong></li>`).join('')}</ul><div class="card-foot"><strong>${money(order.total)}</strong><label>Status <select data-id="${escapeHTML(order.id)}" aria-label="Update status for ${escapeHTML(order.orderNumber)}">${['waiting', 'preparing', 'ready'].map((status) => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status[0].toUpperCase()}${status.slice(1)}</option>`).join('')}</select></label></div></article>`).join('');
  list.querySelectorAll('select').forEach((select) => select.addEventListener('change', () => { const updated = getOrders(); const order = updated.find((item) => item.id === select.dataset.id); if (order) { order.status = select.value; localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); render(); } }));
}
soundToggle.addEventListener('click', () => { soundEnabled = !soundEnabled; soundToggle.textContent = soundEnabled ? 'Sound on' : 'Sound off'; soundToggle.setAttribute('aria-pressed', String(soundEnabled)); if (soundEnabled && 'speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance('Notifications on.')); });
document.querySelector('#refresh').addEventListener('click', render);
document.querySelector('#clear-ready').addEventListener('click', () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(getOrders().filter((order) => order.status !== 'ready'))); render(); });
window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) render(); });
window.setInterval(render, 3000);
render();
