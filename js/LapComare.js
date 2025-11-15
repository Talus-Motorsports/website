(() => {
  const leftSel   = document.getElementById('leftSel');
  const rightSel  = document.getElementById('rightSel');
  const vidL      = document.getElementById('vidL');
  const vidR      = document.getElementById('vidR');
  const playBoth  = document.getElementById('playBoth');
  const pauseBoth = document.getElementById('pauseBoth');
  // const lockSync  = document.getElementById('lockSync'); // no longer used

  // If you placed a <template id="lapOptions">…</template>, clone it into both selects.
  const optsTpl = document.getElementById('lapOptions');
  function fillSelectFromTemplate(sel) {
    if (!optsTpl) return;                         // no template: assume options already in HTML
    sel.replaceChildren();                        // clear
    sel.appendChild(optsTpl.content.cloneNode(true));
  }
  if (leftSel && rightSel) {
    fillSelectFromTemplate(leftSel);
    fillSelectFromTemplate(rightSel);
  }

  function loadFromSelect(video, selectEl){
    if (!video || !selectEl) return;
    const opt = selectEl.selectedOptions?.[0];
    if (!opt) return;
    const src    = opt.dataset.src;
    const poster = opt.dataset.poster || "";
    if (!src) return;

    video.pause();
    video.poster = poster;

    let s = video.querySelector('source');
    if (!s) {
      s = document.createElement('source');
      s.type = 'video/mp4';
      video.appendChild(s);
    }
    s.src = src;
    video.load();
  }

  // Initial load: if nothing selected, pick the first option in each.
  if (leftSel && leftSel.options.length) {
    if (![...leftSel.options].some(o => o.selected)) leftSel.options[0].selected = true;
    loadFromSelect(vidL, leftSel);
  }
  if (rightSel && rightSel.options.length) {
    if (![...rightSel.options].some(o => o.selected)) rightSel.options[0].selected = true;
    loadFromSelect(vidR, rightSel);
  }

  // Change handlers
  leftSel?.addEventListener('change',  () => loadFromSelect(vidL, leftSel));
  rightSel?.addEventListener('change', () => loadFromSelect(vidR, rightSel));

  // Play / Pause both – this is all we keep
  playBoth?.addEventListener('click', async () => {
    try { await vidL.play(); } catch {}
    try { await vidR.play(); } catch {}
  });

  pauseBoth?.addEventListener('click', () => {
    vidL?.pause();
    vidR?.pause();
  });

  // no lockSync, no resync, no mirrored seeking
})();
