/* Some hosted media responses buffer fully but expose no seekable timeline.
 * Repair only those loaded videos with a same-origin, in-memory media URL. */
(() => {
  'use strict';
  const states = new Map();
  const events = ['loadedmetadata', 'canplay', 'progress', 'timeupdate', 'play', 'pause', 'error'];
  const source = video => {
    const value = video.getAttribute('src') || video.querySelector('source')?.getAttribute('src');
    try { return value ? new URL(value, document.baseURI).href : ''; } catch { return ''; }
  };
  function covers(ranges, duration) {
    let end = 0;
    for (let i = 0; i < ranges.length; i++) {
      if (ranges.start(i) > end + 0.15) return false;
      end = Math.max(end, ranges.end(i));
    }
    return end >= duration - Math.min(0.15, duration / 100);
  }
  function visible(video) {
    const r = video.getBoundingClientRect();
    return !document.hidden && r.width > 0 && r.height > 0 &&
      r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  }
  function dispose(video) {
    const state = states.get(video);
    if (!state) return;
    state.request?.abort();
    if (state.blob) URL.revokeObjectURL(state.blob);
    states.delete(video);
  }
  function stateFor(video) {
    const current = source(video);
    let state = states.get(video);
    if (state && current !== state.original && current !== state.blob) {
      dispose(video); state = null;
    }
    if (!state) {
      state = { original: current, direct: video.getAttribute('src'), attempts: 0, retryAt: 0 };
      states.set(video, state);
    }
    return state;
  }
  async function repair(video, state) {
    state.attempts++;
    const request = state.request = new AbortController();
    try {
      const response = await fetch(state.original, { signal: request.signal, credentials: 'same-origin', cache: 'force-cache' });
      if (!response.ok) throw new Error('Media request failed');
      const data = await response.blob();
      if (!video.isConnected || states.get(video) !== state || request.signal.aborted ||
          source(video) !== state.original || covers(video.seekable, video.duration)) return;
      // Capture the latest intent after the request, including any intervening pause.
      state.restore = { time: video.currentTime, volume: video.volume, muted: video.muted,
        rate: video.playbackRate, resume: !video.paused && !video.ended };
      state.blob = URL.createObjectURL(data);
      video.src = state.blob;
      video.load();
    } catch (error) {
      if (error.name !== 'AbortError') state.retryAt = Date.now() + 10000;
    } finally {
      if (state.request === request) state.request = null;
    }
  }
  function update(event) {
    const video = event.target;
    if (video.tagName !== 'VIDEO' || !video.isConnected) return;
    const state = stateFor(video);
    const restore = state.restore;
    if (restore) {
      // load() can emit pause while resetting the source to HAVE_NOTHING.
      // Keep that initialization event from erasing the captured play intent;
      // user pointer/key interactions still cancel resume below.
      if (event.type === 'pause' && video.readyState !== 0) restore.resume = false;
      if (event.type === 'play') restore.resume = true;
      if (event.type === 'error') {
        state.restore = null; state.attempts = 2;
        const blob = state.blob; state.blob = null;
        if (state.direct === null) video.removeAttribute('src'); else video.src = state.direct;
        video.load(); URL.revokeObjectURL(blob);
        return;
      }
      if (event.type === 'loadedmetadata') {
        state.restore = null;
        video.volume = restore.volume; video.muted = restore.muted; video.playbackRate = restore.rate;
        video.currentTime = Math.min(restore.time, video.duration);
        if (restore.resume && visible(video)) video.play().catch(() => {});
      }
      return;
    }
    if (state.blob || state.request || state.attempts >= 2 || Date.now() < state.retryAt) return;
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0 || !covers(video.buffered, duration) || covers(video.seekable, duration)) return;
    const url = new URL(state.original || document.baseURI);
    if (!state.original || url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    repair(video, state);
  }
  // A control interaction during source loading cancels automatic resume. The
  // browser's ensuing play/pause event supplies any newer explicit intent.
  function interact(event) {
    const state = states.get(event.target);
    if (state?.restore) state.restore.resume = false;
  }
  events.forEach(name => document.addEventListener(name, update, true));
  ['pointerdown', 'keydown'].forEach(name => document.addEventListener(name, interact, true));
  const observer = new MutationObserver(() => {
    for (const video of states.keys()) {
      if (!video.isConnected) dispose(video); else stateFor(video);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  document.querySelectorAll('video').forEach(video => update({ target: video, type: 'progress' }));
})();
