(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dishCards = [...document.querySelectorAll('.dish')];
  const targets = document.querySelectorAll(
    '.hero > div, .hero-art, .section-head, .dish, .audio-note, .note, .order-section > div, .order-section form, .kitchen-video, footer'
  );

  if (!reduceMotion && 'IntersectionObserver' in window) {
    targets.forEach((element, index) => {
      element.classList.add('scroll-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 70}ms`);
    });
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -35px 0px' });
    targets.forEach((element) => observer.observe(element));
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'dish-detail';
  dialog.setAttribute('aria-label', 'Dish details');
  dialog.innerHTML = `
    <article class="dish-detail-card">
      <button class="dish-detail-close" type="button" aria-label="Close dish details">×</button>
      <div class="dish-detail-image-wrap"><img class="dish-detail-image" alt=""></div>
      <div class="dish-detail-copy">
        <span class="dish-detail-category"></span>
        <h2 class="dish-detail-title"></h2>
        <p class="dish-detail-description"></p>
        <p class="dish-detail-price"></p>
        <p class="dish-detail-progress" aria-live="polite"></p>
        <div class="dish-detail-actions">
          <button class="dish-detail-nav dish-detail-previous" type="button" aria-label="Previous dish">←</button>
          <button class="dish-detail-add" type="button">Add to order +</button>
          <button class="dish-detail-nav dish-detail-next" type="button" aria-label="Next dish">→</button>
        </div>
        <button class="dish-detail-finish" type="button">Finish choosing · review order</button>
      </div>
    </article>`;
  document.body.append(dialog);

  const detailImage = dialog.querySelector('.dish-detail-image');
  const detailCategory = dialog.querySelector('.dish-detail-category');
  const detailTitle = dialog.querySelector('.dish-detail-title');
  const detailDescription = dialog.querySelector('.dish-detail-description');
  const detailPrice = dialog.querySelector('.dish-detail-price');
  const detailProgress = dialog.querySelector('.dish-detail-progress');
  const addButton = dialog.querySelector('.dish-detail-add');
  const dishCount = () => dishCards.length;
  let currentIndex = 0;
  let lastAddedIndex = -1;

  function showDish(index, animate = false) {
    if (!dishCards.length) return;
    currentIndex = (index + dishCards.length) % dishCards.length;
    const card = dishCards[currentIndex];
    const photo = card.querySelector('.food-photo');
    if (animate) {
      dialog.classList.remove('dish-detail-switching');
      void dialog.offsetWidth;
      dialog.classList.add('dish-detail-switching');
    }
    detailImage.src = photo?.currentSrc || photo?.src || '';
    detailImage.alt = photo?.alt || card.dataset.item || 'Menu dish';
    detailCategory.textContent = card.querySelector('.category')?.textContent || 'FROM OUR MENU';
    detailTitle.textContent = card.dataset.item || card.querySelector('strong')?.textContent || 'Menu item';
    detailDescription.textContent = card.querySelector('.description')?.textContent || '';
    detailPrice.textContent = card.querySelector('.dish-bottom b')?.textContent || '';
    detailProgress.textContent = `${[...document.querySelectorAll('.dish.selected')].length} selected · Dish ${currentIndex + 1} of ${dishCount()}`;
    addButton.textContent = 'Add to order +';
    addButton.disabled = false;
    dialog.setAttribute('aria-label', `${detailTitle.textContent} details`);
  }

  dialog.querySelector('.dish-detail-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.dish-detail-previous').addEventListener('click', () => showDish(currentIndex - 1, true));
  dialog.querySelector('.dish-detail-next').addEventListener('click', () => showDish(currentIndex + 1, true));
  addButton.addEventListener('click', () => {
    const card = dishCards[currentIndex];
    if (!card || typeof window.addMenuDishToOrder !== 'function') return;
    window.addMenuDishToOrder(card);
    lastAddedIndex = currentIndex;
    detailProgress.textContent = `Added ${card.dataset.item}. Select another dish or finish to review your order.`;
    addButton.textContent = 'Added ✓';
    addButton.disabled = true;
    if (currentIndex < dishCards.length - 1) {
      window.setTimeout(() => showDish(currentIndex + 1, true), 420);
    } else {
      detailProgress.textContent = 'That was the last dish. Finish to review and send your order.';
    }
  });
  dialog.querySelector('.dish-detail-finish').addEventListener('click', () => {
    dialog.close();
    document.querySelector('#order')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => document.querySelector('#order-form input[name="name"]')?.focus({ preventScroll: true }), reduceMotion ? 0 : 650);
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => dialog.classList.remove('dish-detail-switching'));

  dishCards.forEach((card, index) => card.addEventListener('click', () => {
    lastAddedIndex = -1;
    showDish(index);
    if (!dialog.open) dialog.showModal();
  }));

  if (reduceMotion) return;
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let frameRequested = false;
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0})`;
    frameRequested = false;
  };
  window.addEventListener('scroll', () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  document.addEventListener('pointerdown', (event) => {
    const host = event.target.closest('button, a.button');
    if (!host) return;
    host.classList.add('ripple-host');
    const bounds = host.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'interaction-ripple';
    ripple.style.left = `${event.clientX - bounds.left}px`;
    ripple.style.top = `${event.clientY - bounds.top}px`;
    host.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }, { passive: true });
})();
