(() => {
  const leftSel   = document.getElementById('leftSel');
  const rightSel  = document.getElementById('rightSel');
  const vidL      = document.getElementById('vidL');
  const vidR      = document.getElementById('vidR');
  const playBoth  = document.getElementById('playBoth');
  const pauseBoth = document.getElementById('pauseBoth');
  const lockSync  = document.getElementById('lockSync');

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
    if (!s) { s = document.createElement('source'); s.type = 'video/mp4'; video.appendChild(s); }
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

  // Play / Pause both
  playBoth?.addEventListener('click', async () => {
    try { await vidL.play(); } catch {}
    try { await vidR.play(); } catch {}
  });
  pauseBoth?.addEventListener('click', () => { vidL.pause(); vidR.pause(); });

  // Lock sync: gentle drift correction
  const TOL = 0.15; // seconds
  function resync(master, slave){
    if (!lockSync?.checked) return;
    const drift = master.currentTime - slave.currentTime;
    if (Math.abs(drift) > TOL) slave.currentTime = master.currentTime;
  }

  // use whichever is playing as master
  vidL?.addEventListener('timeupdate', () => { if (!vidL.paused) resync(vidL, vidR); });
  vidR?.addEventListener('timeupdate', () => { if (!vidR.paused) resync(vidR, vidL); });

  // keep both paused/playing together if locked
  vidL?.addEventListener('play',  () => { if (lockSync?.checked && vidR.paused) vidR.play().catch(()=>{}); });
  vidR?.addEventListener('play',  () => { if (lockSync?.checked && vidL.paused) vidL.play().catch(()=>{}); });
  vidL?.addEventListener('pause', () => { if (lockSync?.checked && !vidR.paused) vidR.pause(); });
  vidR?.addEventListener('pause', () => { if (lockSync?.checked && !vidL.paused) vidL.pause(); });

  // mirror seeking when locked
  function mirrorSeek(src, dst){
    src?.addEventListener('seeked', () => { if (lockSync?.checked) dst.currentTime = src.currentTime; });
  }
  mirrorSeek(vidL, vidR);
  mirrorSeek(vidR, vidL);
})();
