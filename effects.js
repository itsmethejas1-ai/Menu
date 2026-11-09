(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dishes = [
    { match: 'biryani', icon: '🍛' },
    { match: 'fries', icon: '🍟' },
    { match: 'Classic beef', icon: '🍔' },
    { match: 'Chicken burger', icon: '🍔' },
    { match: 'Cheeseburger', icon: '🍔' },
    { match: 'milkshake', icon: '🥤' },
    { match: 'cupcake', icon: '🧁' }
  ];
  const dishIcon = (item) => dishes.find(({ match }) => item.toLowerCase().includes(match.toLowerCase()))?.icon || '🍽️';

  // Use emoji illustrations instead of remote photos so the menu works offline too.
  document.querySelectorAll('.food-photo').forEach((image) => {
    const card = image.closest('.dish');
    const illustration = document.createElement('span');
    illustration.className = 'food-illustration';
    illustration.setAttribute('role', 'img');
    illustration.setAttribute('aria-label', image.alt || card?.dataset.item || 'Food illustration');
    illustration.innerHTML = `<span class="food-emoji" aria-hidden="true">${dishIcon(card?.dataset.item || '')}</span>`;
    image.replaceWith(illustration);
  });

  document.querySelectorAll('.hero-art img').forEach((image) => {
    const alt = image.alt.toLowerCase();
    const icon = alt.includes('rice') || alt.includes('biryani') ? '🍛'
      : alt.includes('fries') ? '🍟'
      : alt.includes('burger') ? '🍔' : '🧁';
    const illustration = document.createElement('span');
    illustration.className = 'hero-food-emoji';
    illustration.setAttribute('role', 'img');
    illustration.setAttribute('aria-label', image.alt || 'Food illustration');
    illustration.textContent = icon;
    image.replaceWith(illustration);
  });

  if (!reducedMotion) {
    const hero = document.querySelector('.hero');
    const heroText = hero?.querySelector(':scope > div:first-child');
    const heroArt = hero?.querySelector('.hero-art');
    let scheduled = false;
    const updateHeroParallax = () => {
      scheduled = false;
      if (!hero || !heroText || !heroArt) return;
      const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(hero.offsetHeight, 1)));
      const shift = `${-Math.round(progress * 70)}px`;
      heroText.style.setProperty('--hero-shift', shift);
      heroArt.style.setProperty('--hero-shift', `${-Math.round(progress * 105)}px`);
    };
    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateHeroParallax);
    }, { passive: true });
    updateHeroParallax();
  }

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
