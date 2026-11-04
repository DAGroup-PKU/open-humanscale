/* One timeline for two recordings of the same execution. */
window.createSyncedPair = function (group, onManualPause) {
  const videos = [...group.querySelectorAll('video')];
  const slider = document.getElementById('long-seek');
  const output = document.getElementById('long-time');
  const events = new AbortController();
  const managedPauses = new WeakSet();
  let active = false, manualPause = false, starting = false, destroyed = false;
  let duration = 0, target = 0;
  const wanted = () => active && !manualPause && !destroyed;
  const format = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const listen = (el, name, fn) => el.addEventListener(name, fn, {signal: events.signal});
  function paint() {
    const time = videos[0].seeking ? target : videos[0].currentTime;
    slider.value = Math.min(duration, time);
    output.textContent = `${format(time)} / ${format(duration)}`;
    slider.setAttribute('aria-valuetext', output.textContent);
  }
  function pausePlayers() {
    for (const v of videos) if (!v.paused) { managedPauses.add(v); v.pause(); }
  }
  function ready() { return duration > 0 && videos.every(v => v.readyState >= 3 && !v.seeking); }
  async function startPlayers() {
    if (!wanted() || starting || !ready() || videos.every(v => !v.paused)) return;
    starting = true;
    const results = await Promise.allSettled(videos.map(v => v.play()));
    starting = false;
    if (destroyed) return;
    if (!wanted()) pausePlayers();
    else if (results.some(r => r.status === 'rejected')) {
      manualPause = true; pausePlayers(); onManualPause(true);
    }
  }
  function seek(time) {
    if (!duration) return;
    target = Math.max(0, Math.min(duration, time));
    pausePlayers();
    for (const v of videos) v.currentTime = target;
    paint();
    startPlayers();
  }
  function metadata() {
    if (!videos.every(v => Number.isFinite(v.duration) && v.duration > 0)) return;
    // The ego recording includes a short extra tail; loop only the shared interval.
    duration = Math.min(...videos.map(v => v.duration));
    slider.max = duration; slider.disabled = false; paint(); startPlayers();
  }
  for (const v of videos) {
    v.loop = false;
    v.preload = 'auto';
    listen(v, 'loadedmetadata', metadata);
    listen(v, 'canplay', startPlayers);
    listen(v, 'seeked', startPlayers);
    listen(v, 'waiting', () => { if (wanted()) pausePlayers(); });
    listen(v, 'ended', () => { if (wanted()) seek(0); });
    // A pause from another page player must also stop the paired view.
    listen(v, 'pause', () => {
      if (managedPauses.delete(v) || destroyed || !wanted()) return;
      manualPause = true; pausePlayers(); onManualPause(true);
    });
    listen(v, 'click', () => controller.toggle());
    v.load();
  }
  slider.disabled = true; slider.value = 0; output.textContent = '0:00 / 0:00';
  listen(slider, 'input', () => seek(Number(slider.value)));
  const timer = setInterval(() => {
    if (!wanted() || !duration) return;
    const master = videos[0];
    if (master.currentTime >= duration - .06) { seek(0); return; }
    if (!master.paused && !master.seeking) {
      for (const v of videos.slice(1)) {
        if (!v.seeking && Math.abs(v.currentTime - master.currentTime) > .15) v.currentTime = master.currentTime;
      }
    }
    paint();
  }, 100);
  const controller = {
    setActive(value) { active = value; if (wanted()) startPlayers(); else pausePlayers(); },
    toggle() {
      manualPause = !manualPause; onManualPause(manualPause);
      if (manualPause) pausePlayers(); else { active = true; if (videos[0].currentTime >= duration - .06) seek(0); startPlayers(); }
    },
    restart() { manualPause = false; active = true; onManualPause(false); seek(0); },
    destroy() { destroyed = true; events.abort(); clearInterval(timer); pausePlayers(); }
  };
  return controller;
};
