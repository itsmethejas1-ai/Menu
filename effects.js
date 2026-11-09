(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Use a second independent image host if the Pexels photo cannot load.
  const alternates = {
    biryani: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=80',
    fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80',
    beef: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    chicken: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=900&q=80',
    cheese: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?auto=format&fit=crop&w=900&q=80',
    shake: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80',
    cupcake: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=900&q=80'
  };
  const icons = { biryani: '🍛', fries: '🍟', beef: '🍔', chicken: '🍔', cheese: '🍔', shake: '🥤', cupcake: '🧁' };

  document.querySelectorAll('.food-photo').forEach((image) => {
    image.addEventListener('error', () => {
      if (!image.dataset.alternateTried) {
        image.dataset.alternateTried = 'true';
        const card = image.closest('.dish');
        const item = card?.dataset.item || '';
        const key = item.includes('biryani') ? 'biryani'
          : item.includes('fries') ? 'fries'
          : item.includes('Chicken') ? 'chicken'
          : item.includes('Cheese') ? 'cheese'
          : item.includes('milkshake') ? 'shake'
          : item.includes('cupcake') ? 'cupcake' : 'beef';
        image.src = alternates[key];
        return;
      }
      const card = image.closest('.dish');
      const item = card?.dataset.item || '';
      const key = item.includes('biryani') ? 'biryani'
        : item.includes('fries') ? 'fries'
        : item.includes('Chicken') ? 'chicken'
        : item.includes('Cheese') ? 'cheese'
        : item.includes('milkshake') ? 'shake'
        : item.includes('cupcake') ? 'cupcake' : 'beef';
      const placeholder = document.createElement('span');
      placeholder.className = 'photo-placeholder';
      placeholder.setAttribute('role', 'img');
      placeholder.setAttribute('aria-label', image.alt || `${item} photo`);
      placeholder.innerHTML = `<span class="food-icon" aria-hidden="true">${icons[key]}</span><span>${image.alt || item}</span>`;
      image.replaceWith(placeholder);
    });
  });

  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const revealTargets = document.querySelectorAll('.section-head, .dish, .order-section > div, .order-section form, footer');
  revealTargets.forEach((element) => element.classList.add('scroll-reveal'));
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  revealTargets.forEach((element) => observer.observe(element));
})();
