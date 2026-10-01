/**
 * NaijaHomes 3D Scroll & Perspective Animation Engine
 * Features:
 * - 3D Perspective Scroll Emergence (IntersectionObserver with 3D entry transitions)
 * - Scroll Velocity 3D Inertia Tilt (dynamic pitch based on scroll speed)
 * - 3D Parallax Depth Layers (Z-axis offset across elements)
 * - Interactive 3D Cursor & Touch Card Tilt with dynamic specular glare
 * - Auto-detects newly rendered property cards via MutationObserver
 * - 60+ FPS performance via requestAnimationFrame & hardware-accelerated CSS 3D transforms
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.log('[NaijaHomes 3D] Reduced motion detected, 3D physics simplified.');
  }

  const state = {
    scrollY: typeof window !== 'undefined' ? (window.scrollY || window.pageYOffset || 0) : 0,
    lastScrollY: typeof window !== 'undefined' ? (window.scrollY || window.pageYOffset || 0) : 0,
    lastTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    velocity: 0,
    smoothVelocity: 0,
    pitch: 0,
    smoothPitch: 0,
    isScrolling: false,
    scrollTimeout: null,
    observedElements: typeof WeakSet !== 'undefined' ? new WeakSet() : null
  };

  // Helper: Linear Interpolation
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Helper: Clamp
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // 1. IntersectionObserver for 3D Perspective Reveal
  let revealObserver = null;
  function initRevealObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('nh-3d-in-view');
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: [0.05, 0.2]
    });

    scanAndObserveElements();
  }

  // Scan document for elements to apply 3D reveal & tilt to
  function scanAndObserveElements() {
    if (!revealObserver || typeof document === 'undefined') return;

    const selectors = [
      '.hh-prop-card',
      '.nh-property-card',
      '.hh-portal-hero',
      '.hh-hero-search-card',
      '.hh-category-card',
      '.hh-section-header',
      '.nh-auth-card',
      '.nh-3d-showcase-box',
      '.hh-concierge-dashboard',
      '.nh-feature-card',
      '.nh-filter-group'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    elements.forEach((el, index) => {
      if (!state.observedElements || !state.observedElements.has(el)) {
        if (state.observedElements) state.observedElements.add(el);
        el.classList.add('nh-scroll-3d-reveal');

        // Apply staggered entrance delay if in a grid
        if (el.classList.contains('hh-prop-card') || el.classList.contains('nh-property-card')) {
          const colIndex = index % 3;
          el.style.transitionDelay = (colIndex * 0.08).toFixed(2) + 's';
          setupPropertyCard3DTilt(el);
        }

        revealObserver.observe(el);
      }
    });
  }

  // 2. Interactive 3D Cursor & Touch Tilt on Property Cards
  function setupPropertyCard3DTilt(card) {
    if (prefersReducedMotion || !card) return;

    // Add specular glare overlay if missing
    let glare = card.querySelector('.nh-card-glare');
    if (!glare) {
      glare = document.createElement('div');
      glare.className = 'nh-card-glare';
      card.appendChild(glare);
    }

    let bounds = null;
    function updateBounds() {
      bounds = card.getBoundingClientRect();
    }

    card.addEventListener('mouseenter', updateBounds);

    card.addEventListener('mousemove', (e) => {
      if (!bounds) updateBounds();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const px = (mouseX / bounds.width - 0.5) * 2; // -1 to 1
      const py = (mouseY / bounds.height - 0.5) * 2; // -1 to 1

      const maxAngle = 7; // max degrees
      const tiltX = -py * maxAngle;
      const tiltY = px * maxAngle;

      card.style.transform = "perspective(900px) rotateX(" + tiltX.toFixed(2) + "deg) rotateY(" + tiltY.toFixed(2) + "deg) translateZ(10px)";
      card.style.setProperty('--glare-x', (mouseX / bounds.width * 100).toFixed(1) + "%");
      card.style.setProperty('--glare-y', (mouseY / bounds.height * 100).toFixed(1) + "%");
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  }

  // 3. Scroll Velocity & 3D Inertia Engine via requestAnimationFrame
  function onScroll() {
    state.scrollY = window.scrollY || window.pageYOffset || 0;
    state.isScrolling = true;

    clearTimeout(state.scrollTimeout);
    state.scrollTimeout = setTimeout(() => {
      state.isScrolling = false;
    }, 120);
  }

  function tick(now) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const deltaTime = Math.max(1, now - state.lastTime);
    state.lastTime = now;

    const deltaY = state.scrollY - state.lastScrollY;
    state.lastScrollY = state.scrollY;

    // Instant velocity in px/frame
    state.velocity = deltaY / (deltaTime / 16.667);

    // Smooth velocity with inertia dampening
    state.smoothVelocity = lerp(state.smoothVelocity, state.velocity, 0.12);

    // Calculate dynamic 3D pitch angle based on velocity
    const targetPitch = clamp(state.smoothVelocity * 0.22, -4.5, 4.5);
    state.smoothPitch = lerp(state.smoothPitch, targetPitch, 0.15);

    // Update CSS variables for 3D physics
    if (Math.abs(state.smoothPitch) > 0.01 || Math.abs(state.smoothVelocity) > 0.01 || state.isScrolling) {
      document.documentElement.style.setProperty('--scroll-pitch', state.smoothPitch.toFixed(2) + "deg");
      document.documentElement.style.setProperty('--scroll-velocity', state.smoothVelocity.toFixed(2) + "px");
      document.documentElement.style.setProperty('--scroll-y', state.scrollY.toFixed(0) + "px");

      // 3D Parallax offset on hero section if present
      const hero = document.querySelector('.hh-portal-hero');
      if (hero && state.scrollY < 800) {
        const heroProgress = Math.min(1, state.scrollY / 600);
        const heroZ = -heroProgress * 60; // recedes up to -60px in 3D
        const heroRotX = heroProgress * 3.5; // tilts up to 3.5deg
        hero.style.transform = "perspective(1200px) translateZ(" + heroZ.toFixed(1) + "px) rotateX(" + heroRotX.toFixed(2) + "deg)";
      }
    } else {
      document.documentElement.style.setProperty('--scroll-pitch', '0deg');
    }

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(tick);
    }
  }

  // 4. Create Dynamic Ambient 3D Geometric Floating Layer
  function createAmbient3DLayer() {
    if (prefersReducedMotion || typeof document === 'undefined' || !document.body) return;
    if (document.getElementById('nhAmbient3DStage')) return;

    const stage = document.createElement('div');
    stage.id = 'nhAmbient3DStage';
    stage.className = 'nh-ambient-3d-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = `
      <div class="nh-3d-orb nh-3d-orb-1"></div>
      <div class="nh-3d-orb nh-3d-orb-2"></div>
      <div class="nh-3d-cube nh-3d-cube-1"></div>
      <div class="nh-3d-cube nh-3d-cube-2"></div>
    `;

    document.body.prepend(stage);
  }

  // 5. MutationObserver to handle dynamic content (e.g. newly loaded properties)
  function initMutationWatcher() {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined' || !document.body) return;

    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        scanAndObserveElements();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialization
  function init() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    createAmbient3DLayer();
    initRevealObserver();
    initMutationWatcher();

    window.addEventListener('scroll', onScroll, { passive: true });
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(tick);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Public API
  if (typeof window !== 'undefined') {
    window.NaijaHomes3DScroll = {
      scan: scanAndObserveElements,
      getState: () => ({ ...state })
    };
  }
})();
