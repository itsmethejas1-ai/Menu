(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dishIcons = {
    'Chicken biryani': ['🍛'],
    'French fries': ['🍟'],
    'Classic beef burger': ['🍔'],
    'Chicken burger': ['🍗', '🍔'],
    Cheeseburger: ['🧀', '🍔'],
    'Oreo milkshake': ['🥤', '🍪'],
    'Chocolate cupcake': ['🧁']
  };
  const heroIcons = [
    { match: /rice|biryani/i, icon: '🍛' },
    { match: /fries/i, icon: '🍟' },
    { match: /burger/i, icon: '🍔' },
    { match: /cupcake/i, icon: '🧁' }
  ];

  document.querySelectorAll('.food-photo').forEach((image) => {
    const card = image.closest('.dish');
    const name = card?.dataset.item || image.alt || '';
    const illustration = document.createElement('span');
    illustration.className = 'food-illustration';
    illustration.setAttribute('role', 'img');
    illustration.setAttribute('aria-label', name);
    for (const emoji of dishIcons[name] || ['🍽️']) {
      const icon = document.createElement('span');
      icon.className = 'food-emoji';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = emoji;
      illustration.append(icon);
    }
    image.replaceWith(illustration);
  });

  document.querySelectorAll('.hero-art img').forEach((image) => {
    const entry = heroIcons.find(({ match }) => match.test(image.alt));
    const illustration = document.createElement('span');
    illustration.className = 'hero-food-emoji';
    illustration.setAttribute('role', 'img');
    illustration.setAttribute('aria-label', image.alt || 'Food illustration');
    illustration.textContent = entry?.icon || '🍽️';
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
      heroText.style.setProperty('--hero-shift', `${-Math.round(progress * 90)}px`);
      heroArt.style.setProperty('--hero-shift', `${-Math.round(progress * 150)}px`);
    };
    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateHeroParallax);
    }, { passive: true });
    updateHeroParallax();
  }

  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const revealTargets = document.querySelectorAll('.section-head, .dish, .order-section > div, .order-section form, .kitchen-video, footer');
  revealTargets.forEach((element) => element.classList.add('scroll-reveal'));
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
  revealTargets.forEach((element) => observer.observe(element));
})();
