(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll(
    '.hero > div, .hero-art, .section-head, .dish, .audio-note, .note, .order-section > div, .order-section form, .kitchen-video, footer'
  );

  // Add staggered entrance animations while scrolling. Without IntersectionObserver,
  // leave everything visible rather than hiding content.
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

  if (reduceMotion) return;

  // A subtle reading-progress indicator tracks the page scroll position.
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

  // Give taps and clicks a small visual response without changing button contents.
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
