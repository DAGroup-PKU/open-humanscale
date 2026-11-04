/*
 * A read-only playback guide for the two continuous v9 follow recordings.
 *
 * Provenance: assets/continuous-follow-v9.json. Both clips are unbroken 1x
 * source intervals, with the natural pause retained and the head-camera view
 * cropped. Tea: source frames [75,610), 30 fps; object: [15,750), 30 fps.
 *
 * v11 uses TWO PRESENTATION GROUPS, including the recorded waiting interval.
 * Per the author's requested grouping, one quarter of that interval belongs
 * to Human demonstration and three quarters to Robot follow:
 * - tea: visible interval 3.4–8.6s; split = 3.4 + (8.6 - 3.4) / 4 = 4.70s.
 * - object: visible interval 3.1–9.3s; split = 3.1 + (9.3 - 3.1) / 4 = 4.65s.
 * These are presentation boundaries, NOT precise motion onset, controller
 * states, model-state changes, or live telemetry. The videos stay unbroken.
 * The continuous-inference / no-mode-switch protocol is author-supplied;
 * it is intentionally rendered as a static statement across every phase.
 */
(() => {
  'use strict';

  const clips = {
    'human-follow-tea-continuous-v9.mp4': {
      id: 'tea', duration: 535 / 30, boundaries: [4.7],
    },
    'human-follow-object-continuous-v9.mp4': {
      id: 'object', duration: 735 / 30, boundaries: [4.65],
    },
  };
  const labels = ['Human demonstration', 'Robot follow'];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const clock = (seconds) => {
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  };

  function mount(figure) {
    if (figure.dataset.followTimeline === 'mounted') return;
    const video = figure.querySelector('video');
    if (!video) return;
    const src = video.querySelector('source')?.getAttribute('src') || video.getAttribute('src') || '';
    const clip = clips[src.split('/').pop()?.split('?')[0]];
    if (!clip) return;

    const rail = document.createElement('aside');
    rail.className = 'ft-rail';
    rail.setAttribute('aria-label', 'Guide to the continuous interaction');
    rail.innerHTML = `
      <div class="ft-header"><span>Recorded sequence</span><span class="ft-time" aria-hidden="true"></span></div>
      <div class="ft-sequence">
        <span class="ft-continuity" aria-hidden="true"></span>
        <ol class="ft-phases">${labels.map((label, index) => `
          <li class="ft-phase" data-phase-index="${index}">
            <span class="ft-dot" aria-hidden="true"></span>
            <span class="ft-phase-label">${label}</span>
            <span class="ft-phase-track" aria-hidden="true"><span class="ft-phase-fill"></span></span>
          </li>`).join('')}
        </ol>
      </div>
      <p class="ft-protocol"><strong>Continuous inference</strong><span>No mode switch</span></p>
      <span class="ft-sr-only" id="ft-note-${clip.id}">A two-part guide to the continuous interaction. Both parts include recorded waiting time. The policy remains in inference throughout, with no mode change.</span>
      <span class="ft-sr-only ft-status" role="status" aria-live="polite" aria-atomic="true"></span>`;
    rail.setAttribute('aria-describedby', `ft-note-${clip.id}`);

    // Keep the video in place: moving it would disrupt app.js's media observer.
    // The existing figure becomes the media-and-rail wrapper instead.
    figure.insertBefore(rail, figure.querySelector('figcaption'));
    figure.classList.add('ft-film');
    figure.dataset.followTimeline = 'mounted';
    const phaseNodes = [...rail.querySelectorAll('.ft-phase')];
    const fills = [...rail.querySelectorAll('.ft-phase-fill')];
    const timeNode = rail.querySelector('.ft-time');
    const status = rail.querySelector('.ft-status');
    let previousPhase = -1;

    function update() {
      const duration = Number.isFinite(video.duration) && video.duration > 0
        ? video.duration : clip.duration;
      const time = clamp(Number.isFinite(video.currentTime) ? video.currentTime : 0, 0, duration);
      const ends = [...clip.boundaries, duration];
      const phase = time < ends[0] ? 0 : 1;
      rail.dataset.phase = String(phase);
      timeNode.textContent = `${clock(time)} / ${clock(duration)}`;

      phaseNodes.forEach((node, index) => {
        const start = index === 0 ? 0 : ends[index - 1];
        const fraction = clamp((time - start) / Math.max(ends[index] - start, 0.001), 0, 1);
        node.classList.toggle('is-current', index === phase);
        node.classList.toggle('is-complete', index < phase);
        if (index === phase) node.setAttribute('aria-current', 'step');
        else node.removeAttribute('aria-current');
        fills[index].style.transform = `scaleX(${fraction.toFixed(4)})`;
      });

      // Recompute from currentTime on every update, including backwards seeks
      // and loops; no accumulated timer or changing playback rate is involved.
      if (phase !== previousPhase) {
        status.textContent = `Recorded phase: ${labels[phase]}.`;
        previousPhase = phase;
      }
    }

    ['loadedmetadata', 'durationchange', 'timeupdate', 'seeking', 'seeked', 'play', 'pause', 'ended']
      .forEach((event) => video.addEventListener(event, update));
    update();
  }

  function init() { document.querySelectorAll('.bonus-film').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
