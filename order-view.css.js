(() => {
  const table = document.querySelector('main.waiter, .waiter');
  if (!table) return;
  const originalUrl = document.querySelector('link[rel="stylesheet"]');
  const style = document.createElement('style');
  style.textContent = '.kitchen-remark{margin:8px 0 14px;padding:10px 12px;border-left:3px solid #d88962;background:#fff8ed;border-radius:4px}.kitchen-remark b{display:block;margin-bottom:4px;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#788276}.kitchen-remark p{margin:0;white-space:pre-wrap}';
  document.head.append(style);
})();
