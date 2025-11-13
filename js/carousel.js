// js/carousel.js
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".carousel");
  if (!root) return;

  const viewport = root.querySelector(".carousel-viewport");
  const track    = root.querySelector(".carousel-track");
  const prevBtn  = root.querySelector(".carousel-nav.prev");
  const nextBtn  = root.querySelector(".carousel-nav.next");

  // ---- Build slide list & make an infinite strip by cloning ----
  const originals = Array.from(track.children);
  const N = originals.length;
  if (N === 0) return;

  // Clone once to the front and once to the end: [ clones(L) | originals | clones(R) ]
  const leftClones  = originals.map(el => el.cloneNode(true));
  const rightClones = originals.map(el => el.cloneNode(true));
  track.prepend(...leftClones);
  track.append(...rightClones);

  const slides = Array.from(track.children); // total = 3N

  // ---- State & helpers ----
  let index = N; // start at the first original in the middle strip
  let step  = 0; // card width + gap
  let vis   = 1; // how many fit

  function gapPx() {
    const style = getComputedStyle(track);
    return parseFloat(style.gap) || 0;
  }
  function cardW() {
    const ref = slides[N]; // a real original
    return ref.getBoundingClientRect().width;
  }
  function calcStepWidth() {
    const w = cardW();
    return w + gapPx();
  }
  function calcVisible() {
    const vw = viewport.clientWidth;
    const w  = cardW() || 1;
    const g  = gapPx();
    return Math.max(1, Math.floor((vw + g) / (w + g)));
  }

  function setTransform(i, withTransition = true) {
    if (!withTransition) {
      const prev = track.style.transition;
      track.style.transition = "none";
      track.style.transform = `translateX(${-i * step}px)`;
      // force reflow so transition resets cleanly
      void track.offsetHeight;
      track.style.transition = prev || "";
      return;
    }
    track.style.transform = `translateX(${-i * step}px)`;
  }

  // Normalize index after a slide ends if we crossed into a clone strip
  function normalizeIfNeeded() {
    if (index >= 2 * N) {
      index -= N; // jumped past right clones -> snap back into middle
      setTransform(index, false);
    } else if (index < N) {
      index += N; // jumped past left clones -> snap back into middle
      setTransform(index, false);
    }
  }

  // Recompute sizes and snap to current
  function measure() {
    step = calcStepWidth();
    vis  = calcVisible();
  }

  function update(dir = 0, animate = true) {
    measure();
    setTransform(index, animate);
    track.dataset.dir = dir > 0 ? "right" : dir < 0 ? "left" : "";
  }

  // When the transition finishes, normalize seamless loop
  track.addEventListener("transitionend", normalizeIfNeeded);

  // ---- Controls ----
  function next(by = 1) { index += by; update(1, true); }
  function prev(by = 1) { index -= by; update(-1, true); }

  prevBtn.addEventListener("click", () => prev(1));
  nextBtn.addEventListener("click", () => next(1));

  // Keyboard
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  prev(1);
    if (e.key === "ArrowRight") next(1);
  });

  // Pointer/Touch swipe
  let dragging = false;
  let startX   = 0;
  let startTX  = 0;

  function currentTranslate() { return -index * step; }

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    startX   = e.clientX;
    startTX  = currentTranslate();
    track.style.transition = "none";
    viewport.setPointerCapture?.(e.pointerId);
    stopAutoplay(); // pause while dragging
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    track.style.transform = `translateX(${startTX + dx}px)`;
    e.preventDefault();
  }
  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    track.style.transition = ""; // restore transition

    const dx = e.clientX - startX;
    const threshold = Math.max(40, step / 3);
    if (Math.abs(dx) > threshold) {
      if (dx < 0) next(1); else prev(1);
    } else {
      update(0, true); // snap back
    }
    viewport.releasePointerCapture?.(e.pointerId);
    scheduleAutoplayResume();
  }

  viewport.addEventListener("pointerdown", onPointerDown, { passive: true });
  viewport.addEventListener("pointermove",  onPointerMove,  { passive: false });
  viewport.addEventListener("pointerup",    onPointerUp,    { passive: true });
  viewport.addEventListener("pointercancel",onPointerUp,    { passive: true });

  // ---- Resize handling ----
  const ro = new ResizeObserver(() => {
    // keep visual slide in place through resizes
    const prevIndex = index;
    measure();
    setTransform(prevIndex, false);
  });
  ro.observe(viewport);

  // ---- Autoplay (seamless loop) ----
  const AUTOPLAY_DELAY = 3500;
  const RESUME_AFTER   = 2000;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let autoTimer = null, resumeTimer = null;

  function tick() { next(1); } // move by 1 card; change to vis for paging

  function startAutoplay() {
    if (prefersReduced.matches) return;
    stopAutoplay();
    autoTimer = setInterval(tick, AUTOPLAY_DELAY);
  }
  function stopAutoplay() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }
  function scheduleAutoplayResume() {
    stopAutoplay();
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAutoplay, RESUME_AFTER);
  }

  // pause on hover/focus/interaction; resume later
  ["mouseenter","focusin","pointerdown","keydown"].forEach(evt => {
    viewport.addEventListener(evt, scheduleAutoplayResume, { passive: true });
  });
  prevBtn.addEventListener("click", scheduleAutoplayResume, { passive: true });
  nextBtn.addEventListener("click", scheduleAutoplayResume, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });

  // ---- Init ----
  // Ensure CSS transition is present
  const hasTransition = getComputedStyle(track).transitionDuration !== "0s";
  if (!hasTransition) {
    track.style.transition = "transform .35s ease";
  }

  // Start centered on the first original
  measure();
  setTransform(index, false);
  startAutoplay();
});
