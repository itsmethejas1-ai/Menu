(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  // Reveal page content as it enters the viewport while scrolling.
  const targets = document.querySelectorAll(
    '.hero > div, .hero-art, .section-head, .dish, .audio-note, .note, .order-section > div, .order-section form, .kitchen-video, footer'
  );
  targets.forEach((element) => element.classList.add('scroll-reveal'));

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

  targets.forEach((element) => observer.observe(element));
})();
