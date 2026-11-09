(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Keep the listed dish photos visible; if one host fails, retry with a matching photo.
  const matchingFallbacks = {
    biryani: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=900',
    fries: 'https://images.pexels.com/photos/1893555/pexels-photo-1893555.jpeg?auto=compress&cs=tinysrgb&w=900',
    beef: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=900',
    chicken: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=900',
    cheese: 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg?auto=compress&cs=tinysrgb&w=900',
    shake: 'https://images.pexels.com/photos/3727250/pexels-photo-3727250.jpeg?auto=compress&cs=tinysrgb&w=900',
    cupcake: 'https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg?auto=compress&cs=tinysrgb&w=900'
  };
  const photoKey = (name = '') => {
    if (name.includes('biryani')) return 'biryani';
    if (name.includes('fries')) return 'fries';
    if (name === 'Chicken burger') return 'chicken';
    if (name === 'Cheeseburger') return 'cheese';
    if (name.includes('milkshake')) return 'shake';
    if (name.includes('cupcake')) return 'cupcake';
    return 'beef';
  };

  document.querySelectorAll('.food-photo, .hero-art img').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.photoFallbackTried) return;
      image.dataset.photoFallbackTried = 'true';
      const name = image.closest('.dish')?.dataset.item || image.alt || '';
      image.src = matchingFallbacks[photoKey(name)];
    });
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
