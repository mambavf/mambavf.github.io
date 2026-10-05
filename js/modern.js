'use strict';

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window) {
    if (!reducedMotion) {
      const reveal = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove('reveal-pending');
            reveal.unobserve(entry.target);
          }
        }
      }, { threshold: 0.1 });
      document.body.classList.add('js-motion');
      for (const element of document.querySelectorAll('.section-eyebrow, .innovation-card')) {
        element.classList.add('reveal-pending');
        reveal.observe(element);
      }
    }
    const links = [...document.querySelectorAll('.nav-links a')];
    const sectionLinks = { overview: '#overview', gallery: '#overview', method: '#method', 'video-comparison': '#results', results: '#results', 'image-comparison': '#results', BibTeX: '#BibTeX' };
    const active = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          const selected = link.hash === sectionLinks[entry.target.id];
          link.classList.toggle('is-active', selected);
          if (selected) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-15% 0px -50% 0px' });
    for (const section of document.querySelectorAll('.project-section')) active.observe(section);
  }

  const progress = document.querySelector('.reading-progress span');
  let scheduled = false;
  function updateProgress() {
    const length = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${length > 0 ? Math.min(1, Math.max(0, window.scrollY / length)) : 0})`;
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  const lightbox = document.getElementById('image-lightbox');
  const enlargedImage = lightbox.querySelector('img');
  let zoomTrigger;
  for (const figure of document.querySelectorAll('.figure-shell')) {
    figure.addEventListener('click', () => {
      const image = figure.querySelector('img');
      zoomTrigger = figure;
      enlargedImage.src = image.src;
      enlargedImage.alt = image.alt;
      document.documentElement.classList.add('image-zoom-open');
      lightbox.showModal();
      lightbox.scrollTo(0, 0);
    });
  }
  lightbox.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('close', () => {
    document.documentElement.classList.remove('image-zoom-open');
    zoomTrigger?.focus({ preventScroll: true });
  });

  // Add keyboard access without changing the existing gallery handlers.
  for (const group of document.querySelectorAll('.pages')) {
    const controls = [...group.querySelectorAll('img')];
    controls.forEach((control, index) => {
      control.tabIndex = 0;
      control.setAttribute('role', 'button');
      const label = index === 0 ? 'Previous example' : index === controls.length - 1 ? 'Next example' : `Show example ${index}`;
      control.setAttribute('aria-label', label);
      control.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          control.click();
        }
      });
    });
  }

  const copy = document.querySelector('.copy-citation');
  const status = document.querySelector('.copy-status');
  let resetCopy;
  copy.addEventListener('click', async () => {
    const citation = document.querySelector('#BibTeX code').textContent.trim();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(citation);
      } else {
        const field = document.createElement('textarea');
        field.value = citation;
        field.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        copy.focus();
        if (!copied) throw new Error('Copy unavailable');
      }
      copy.textContent = 'Copied ✓';
      status.textContent = 'BibTeX copied to clipboard.';
    } catch (_) {
      copy.textContent = 'Select to copy';
      status.textContent = 'Select the citation below and copy it.';
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('#BibTeX code'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    window.clearTimeout(resetCopy);
    resetCopy = window.setTimeout(() => { copy.innerHTML = 'Copy BibTeX <span aria-hidden="true">↗</span>'; }, 2500);
  });
})();
