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

  // Full-screen-style dish viewer, opened by selecting a menu card. The next/previous
  // controls let the next dish animate into the same foreground position.
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
        <div class="dish-detail-actions">
          <button class="dish-detail-nav dish-detail-previous" type="button" aria-label="Previous dish">←</button>
          <button class="dish-detail-add" type="button">Add to order</button>
          <button class="dish-detail-nav dish-detail-next" type="button" aria-label="Next dish">→</button>
        </div>
      </div>
    </article>`;
  document.body.append(dialog);

  const detailImage = dialog.querySelector('.dish-detail-image');
  const detailCategory = dialog.querySelector('.dish-detail-category');
  const detailTitle = dialog.querySelector('.dish-detail-title');
  const detailDescription = dialog.querySelector('.dish-detail-description');
  const detailPrice = dialog.querySelector('.dish-detail-price');
  let currentIndex = 0;
  let skipNextCardOpen = false;

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
    dialog.setAttribute('aria-label', `${detailTitle.textContent} details`);
  }

  dialog.querySelector('.dish-detail-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.dish-detail-previous').addEventListener('click', () => showDish(currentIndex - 1, true));
  dialog.querySelector('.dish-detail-next').addEventListener('click', () => showDish(currentIndex + 1, true));
  dialog.querySelector('.dish-detail-add').addEventListener('click', () => {
    // Reuse the menu card's existing order/cart handler without reopening the viewer.
    skipNextCardOpen = true;
    dishCards[currentIndex].click();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.classList.remove('dish-detail-switching');
  });

  document.addEventListener('click', (event) => {
    const card = event.target.closest('.dish');
    if (!card || !dishCards.includes(card)) return;
    if (skipNextCardOpen) {
      skipNextCardOpen = false;
      return;
    }
    currentIndex = dishCards.indexOf(card);
    showDish(currentIndex);
    if (!dialog.open) dialog.showModal();
  });

  if (reduceMotion) return;

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let frameRequested = false;
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, amount))})`;
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
