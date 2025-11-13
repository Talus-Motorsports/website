// js/nav.js
document.addEventListener('DOMContentLoaded', () => {
  // ===== Navbar show/hide on scroll =====
  const nav = document.querySelector('.navbar');          // <nav class="navbar">
  const hero = document.querySelector('.hero-banner');     // optional hero section
  if (!nav) return;

  // If a full hero exists, remove body padding for fixed navbar
  document.body.classList.toggle('has-full-hero', !!(hero));

  let lastY = window.scrollY;

  const setScrolled = () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  };

  const setHiddenOnScroll = () => {
    const y = window.scrollY;
    const goingDown = y > lastY;
    const beyond = y > 80;
    nav.classList.toggle('hide', goingDown && beyond);
    lastY = y;
  };

  // Initial state
  setScrolled();
  setHiddenOnScroll();

  // Keep it updated
  window.addEventListener('scroll', () => {
    setScrolled();
    setHiddenOnScroll();
  }, {passive: true});

  // ===== Drawer (hamburger) =====
  const btn = document.querySelector('.menu-toggle');       // the red square button
  if (!btn) return;

  // Find the drawer via aria-controls to avoid id mismatches
  const drawerId = btn.getAttribute('aria-controls');
  const drawer = drawerId ? document.getElementById(drawerId) : null;  // e.g. <aside id="navbar-drawer">
  const backdrop = document.querySelector('.drawer-backdrop');           // optional

  if (!drawer) return;

  let hideTimer = null;
  const TRANSITION_MS = 220;

  const reallyHide = () => {
    if (btn.getAttribute('aria-expanded') === 'true') {
      drawer.hidden = true;
      if (backdrop) backdrop.hidden = true;
    }
  };
  const openDrawer = () => {
    // Cancel any scheduled hides
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    btn.setAttribute('aria-expanded', 'true');

    // Ensure visible before adding the "open" class (so transitions run)
    drawer.hidden = false;
    if (backdrop) backdrop.hidden = false;

    requestAnimationFrame(() => {
      drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('show');
    });
  };

  const closeDrawer = () => {
    btn.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');

    // Schedule the actual hidden=true after the CSS transition
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(reallyHide, TRANSITION_MS);
  };

  // Safety: if the transition ends while closed, hide immediately
  drawer.addEventListener('transitionend', (e) => {
    if (btn.getAttribute('aria-expanded') !== 'true') reallyHide();
  });

  // Click toggle
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    isOpen ? closeDrawer() : openDrawer();
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      closeDrawer();
    }
  });

  // Backdrop click to close
  backdrop?.addEventListener('click', closeDrawer);

  // ─────────────────────────────────────────────────────────
  // Hover-to-open (prevents “dead spots” between button & drawer)
  // ─────────────────────────────────────────────────────────
  // Small delay so tiny gaps/micro-movements don’t cause flicker
  const HOVER_CLOSE_DELAY = 120;
  let hoverCloseTimer = null;

  const cancelHoverClose = () => {
    if (hoverCloseTimer) { clearTimeout(hoverCloseTimer); hoverCloseTimer = null; }
  };
  const scheduleHoverClose = () => {
    cancelHoverClose();
    hoverCloseTimer = setTimeout(closeDrawer, HOVER_CLOSE_DELAY);
  };

  // Keep open while hovering either the button OR the drawer
  btn.addEventListener('mouseenter', () => { cancelHoverClose(); openDrawer(); });
  drawer.addEventListener('mouseenter', () => { cancelHoverClose(); openDrawer(); });

  btn.addEventListener('mouseleave', scheduleHoverClose);
  drawer.addEventListener('mouseleave', scheduleHoverClose);

  // Touch: tap the button to open as well
  btn.addEventListener('touchstart', openDrawer, { passive: true });
});
