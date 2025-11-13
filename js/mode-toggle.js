document.addEventListener('DOMContentLoaded', () => {
  const btn   = document.getElementById('modeToggle');
  const cards = Array.from(document.querySelectorAll('.car-card'));
  const live  = document.querySelector('.filter-count');

  // 🔥 hide/remove the "Race cars: X shown" element
  if (live) live.remove();

  if (!btn || !cards.length) return;

  function filter(type) {
    let shown = 0;
    for (const li of cards) {
      const t = (li.getAttribute('data-type') || '').toLowerCase();
      const show = t === type;          // 'race' or '4x4'
      li.style.display = show ? '' : 'none';
      if (show) shown++;
    }
    // nothing else to do; the counter is gone
    // (you can delete the next line if you want)
    // if (live) live.textContent = (type === '4x4' ? '4×4 vehicles' : 'Race cars') + `: ${shown} shown`;
  }

  function setMode(type) {
    const is4x4 = type === '4x4';
    btn.classList.toggle('is-4x4', is4x4);
    btn.classList.toggle('is-race', !is4x4);
    btn.setAttribute('aria-checked', String(is4x4));
    const thumb = btn.querySelector('.thumb-label');
    if (thumb) thumb.textContent = is4x4 ? '4×4' : 'Race Cars';
    filter(type);
  }

  btn.addEventListener('click', () => {
    const next = btn.classList.contains('is-4x4') ? 'race' : '4x4';
    setMode(next);
  });

  setMode(btn.classList.contains('is-4x4') ? '4x4' : 'race');
});
