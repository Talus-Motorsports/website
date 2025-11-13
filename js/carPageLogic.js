/* carPageLogic.js */
"use strict";

/**
 * Initialize the WKR car gallery.
 * @param {string} rootSelector CSS selector for the gallery root (default "#gallery")
 */
function initCarGallery(rootSelector = "#gallery") {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const stage    = root.querySelector("#stage");
  const rail     = root.querySelector("#thumbRail");
  const thumbs   = rail ? Array.from(rail.querySelectorAll(".thumb")) : [];
  const counter  = root.querySelector("#counter");
  const titleEl  = root.querySelector("#stageTitle");
  const prevBtn  = root.querySelector("#prevBtn");
  const nextBtn  = root.querySelector("#nextBtn");
  const railPrev = root.querySelector("#railPrev");
  const railNext = root.querySelector("#railNext");

  // Guard
  let currentMedia = root.querySelector("#stageMedia"); // <img> or <video>
  if (!stage || !rail || !currentMedia || thumbs.length === 0) return;

  let idx = 0;
  const total = thumbs.length;

  // ---------- helpers ----------
  const updateCounter = () => (counter.textContent = `${idx + 1} / ${total}`);

  const getThumbImageSrc = (thumb) =>
    thumb.querySelector("img")?.src || "";

  const getMainSrc = (thumb) =>
    thumb.dataset.src || getThumbImageSrc(thumb) || "";

  const makeVideoEl = () => {
    const v = document.createElement("video");
    v.className = "stage-media";
    v.id = "stageMedia";
    v.setAttribute("playsinline", "");
    v.controls = true;
    v.autoplay = true;
    v.muted = true;
    v.loop = true;
    return v;
  };

  const makeImgEl = (altText) => {
    const img = document.createElement("img");
    img.className = "stage-media";
    img.id = "stageMedia";
    img.loading = "eager";
    img.alt = altText || "Car photo";
    return img;
  };

  const replaceStage = (withEl) => {
    // stop any video that might be playing before swap
    if (currentMedia.tagName.toLowerCase() === "video") {
      try { currentMedia.pause(); } catch (_) { /* noop */ }
      currentMedia.removeAttribute("src");
      try { currentMedia.load?.(); } catch (_) { /* noop */ }
    }
    currentMedia.replaceWith(withEl);
    currentMedia = withEl;
  };

  // ---------- core ----------
  function setActive(i) {
    idx = (i + total) % total; // wrap

    thumbs.forEach((t) =>
      t.classList.toggle("active", Number(t.dataset.index) === idx)
    );

    const thumb = thumbs[idx];
    const type  = thumb.dataset.type || "image";
    const src   = getMainSrc(thumb);
    const title = thumb.title || thumb.getAttribute("aria-label") || "";

    if (!src) {
      console.warn("[gallery] Missing src for thumb index", idx);
      return;
    }

    // blurred background “edge fill” behind the media
    const previewSrc = getThumbImageSrc(thumb) || src;
    stage.style.setProperty("--stage-bg", `url("${previewSrc}")`);

    titleEl.textContent = title || " ";
    updateCounter();

    // Swap stage element if needed
    const tag = currentMedia.tagName.toLowerCase();

    if (type === "video") {
      if (tag !== "video") replaceStage(makeVideoEl());
      currentMedia.src = src;
      currentMedia.addEventListener(
        "loadeddata",
        () => currentMedia.focus({ preventScroll: true }),
        { once: true }
      );
    } else {
      if (tag !== "img") replaceStage(makeImgEl(title));
      // (Optional) preload for nicer swap
      const loader = new Image();
      loader.onload = () => {
        currentMedia.src = src;
        currentMedia.alt = title || "Car photo";
      };
      loader.onerror = () => { currentMedia.src = src; };
      loader.src = src;
    }

    // Ensure active thumb is visible
    thumb.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }

  // Init thumbs & events
  thumbs.forEach((t, i) => {
    t.dataset.index = i;
    t.tabIndex = 0;
    t.setAttribute("role", "option");
    t.addEventListener("click", () => setActive(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActive(i);
      }
    });
  });

  // First load
  updateCounter();
  setActive(0);

  // Prev/Next buttons
  prevBtn?.addEventListener("click", () => setActive(idx - 1));
  nextBtn?.addEventListener("click", () => setActive(idx + 1));

  // Keyboard navigation (global but only when not typing in inputs)
  window.addEventListener("keydown", (e) => {
    const el = e.target;
    if (el && /input|textarea|select/.test(el.tagName.toLowerCase())) return;
    if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) setActive(idx - 1);
    if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) setActive(idx + 1);
  });

  // Basic swipe
  let sx = 0, sy = 0, isTouch = false;
  stage.addEventListener("pointerdown", (e) => {
    isTouch = true; sx = e.clientX; sy = e.clientY;
  });
  stage.addEventListener("pointercancel", () => { isTouch = false; });
  stage.addEventListener("pointerup", (e) => {
    if (!isTouch) return;
    isTouch = false;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      dx < 0 ? setActive(idx + 1) : setActive(idx - 1);
    }
  });

  // Thumbnail rail scroll arrows
  railPrev?.addEventListener("click", () =>
    rail.scrollBy({ left: -Math.floor(rail.clientWidth * 0.8), behavior: "smooth" })
  );
  railNext?.addEventListener("click", () =>
    rail.scrollBy({ left:  Math.floor(rail.clientWidth * 0.8), behavior: "smooth" })
  );
}

/* Auto-init if the markup is present */
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#gallery")) initCarGallery("#gallery");
});

// Optional:
// window.initCarGallery = initCarGallery;
