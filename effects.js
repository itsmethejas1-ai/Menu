(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const photoFallbacks = {
    biryani: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=85',
    fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',
    beef: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    chicken: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=900&q=85',
    cheese: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?auto=format&fit=crop&w=900&q=85',
    shake: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=85',
    cupcake: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=900&q=85'
  };

  const photoKey = (name = '') => {
    if (name.includes('biryani')) return 'biryani';
    if (name.includes('fries')) return 'fries';
    if (name.includes('Chicken burger')) return 'chicken';
    if (name.includes('Cheeseburger')) return 'cheese';
    if (name.includes('milkshake')) return 'shake';
    if (name.includes('cupcake')) return 'cupcake';
    return 'beef';
  };

  document.querySelectorAll('.food-photo, .hero-art img').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.fallbackTried) return;
      image.dataset.fallbackTried = 'true';
      const name = image.closest('.dish')?.dataset.item || image.alt || '';
      image.src = photoFallbacks[photoKey(name)] || image.src;
    }, { once: true });
  });

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
