/* Data-driven benchmark reveal, ending with five individual results.
 * Point coordinates, labels, and SVG markup come from BENCHMARK_FIGURES.
 * The final frame uses the same generated SVG content. No numerical values
 * are interpolated, and separate models are never presented as a training run.
 */
(() => {
  'use strict';
  const definitions = window.BENCHMARK_FIGURES;
  if (!definitions) return;
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svg = (name, attributes, content) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (content != null) node.textContent = content;
    return node;
  };
  document.querySelectorAll('[data-benchmark-motion]').forEach(mount => {
    const key = mount.dataset.benchmarkMotion;
    const data = definitions[key];
    const stage = mount.querySelector('.benchmark-original-stage');
    const finalFigure = stage?.querySelector('img');
    if (!data?.points?.length || !stage || !finalFigure || mount.dataset.bmMounted) return;
    mount.dataset.bmMounted = 'true';
    mount.dataset.state = 'loading';
    stage.classList.add('bm-preparing');

    const layer = document.createElement('div');
    layer.className = 'bm-reveal-layer';
    layer.setAttribute('aria-hidden', 'true');
    const plate = document.createElement('img');
    plate.className = 'bm-clean-plate';
    plate.alt = '';
    plate.width = data.width;
    plate.height = data.height;
    plate.decoding = 'async';
    const plot = svg('svg', { class: 'bm-reveal-plot', viewBox: `0 0 ${data.width} ${data.height}`, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
    plot.append(svg('style', {}, definitions.css || ''));
    const groups = data.points.map(item => {
      const group = svg('g', {
        class: `bm-datum bm-${item.kind}`,
        'data-model': item.name,
        'data-result': item.reported
      });
      group.innerHTML = item.markup;
      plot.append(group);
      return group;
    });
    layer.append(plate, plot);
    stage.append(layer);

    const overlay = svg('svg', { class: 'bm-final-overlay', viewBox: `0 0 ${data.width} ${data.height}`, 'aria-hidden': 'true', focusable: 'false' });
    const marker = svg('g', { class: 'bm-focus-marker' });
    marker.append(svg('circle', { class: 'bm-aura', cx: 0, cy: 0, r: 38 }), svg('circle', { class: 'bm-ring-base', cx: 0, cy: 0, r: 23 }), svg('circle', { class: 'bm-ring', cx: 0, cy: 0, r: 23 }));
    overlay.append(marker);
    stage.append(overlay);
    const footer = document.createElement('div');
    footer.className = 'bm-original-footer';
    footer.innerHTML = '<div class="bm-focus-caption"><span>Highlighted result</span><strong></strong></div><button class="bm-replay" type="button" disabled aria-label="Play the benchmark comparison reveal"><span aria-hidden="true">▷</span> Play reveal</button><span class="bm-status" aria-live="polite"></span>';
    mount.append(footer);
    const button = footer.querySelector('button');
    const caption = footer.querySelector('.bm-focus-caption strong');
    const status = footer.querySelector('.bm-status');
    // Both figures reveal their earlier entries as one batch, then the final
    // five results individually. The shared pacing keeps both at 3.8 seconds
    // regardless of how many baseline results appear in each figure.
    const groupedCount = data.points.length - 5;
    const revealDelays = data.points.map((_, index) => index < groupedCount
      ? 0
      : 450 + (index - groupedCount) * 350);
    const revealEnd = revealDelays[revealDelays.length - 1] + 550;
    const fadeAt = revealEnd + 750;
    const duration = fadeAt + 650;
    let animations = [], clock = null, frameID = 0, epoch = 0;
    let started = false, inView = false, userPaused = false, failed = false;
    let phase = 'loading', shownIndex = -1;
    const ready = () => !failed && finalFigure.complete && finalFigure.naturalWidth > 0 && plate.complete && plate.naturalWidth > 0;

    function showPoint(index) {
      if (shownIndex === index) return;
      shownIndex = index;
      const item = data.points[index];
      const reported = String(item.reported);
      caption.textContent = `${item.name} · ${reported}${reported.endsWith('%') ? '' : '%'}`;
      marker.setAttribute('transform', `translate(${item.x} ${item.y})`);
      marker.classList.toggle('bm-ours', item.kind === 'ours');
    }
    function setPhase(next) {
      phase = next;
      mount.dataset.state = next;
      const action = next === 'playing' ? 'Pause' : next === 'paused' ? 'Resume' : next === 'complete' ? 'Replay' : 'Play';
      const icon = next === 'playing' ? 'Ⅱ' : next === 'complete' ? '↻' : '▷';
      button.innerHTML = `<span aria-hidden="true">${icon}</span> ${action} reveal`;
      button.setAttribute('aria-label', `${action} the benchmark comparison reveal`);
    }
    function clearAnimations() {
      epoch++;
      cancelAnimationFrame(frameID);
      animations.forEach(animation => animation.cancel());
      animations = [];
      clock = null;
    }
    function finish() {
      setPhase('complete');
      clearAnimations();
      stage.classList.remove('bm-preparing');
      showPoint(data.points.length - 1);
      status.textContent = `Comparison revealed. ${caption.textContent} average success.`;
    }
    function tick() {
      if (phase !== 'playing') return;
      const elapsed = Number(clock?.currentTime || 0);
      let index = 0;
      while (index + 1 < revealDelays.length && revealDelays[index + 1] <= elapsed) index++;
      showPoint(index);
      frameID = requestAnimationFrame(tick);
    }
    function pause(userInitiated = false) {
      if (phase !== 'playing') return;
      userPaused = userInitiated || userPaused;
      animations.forEach(animation => animation.pause());
      cancelAnimationFrame(frameID);
      setPhase('paused');
    }
    function resume(force = false) {
      if (phase !== 'paused' || userPaused || document.hidden || !ready() || (!inView && !force)) return;
      animations.forEach(animation => animation.play());
      setPhase('playing');
      tick();
    }
    function play() {
      if (!ready()) return;
      clearAnimations();
      started = true;
      userPaused = false;
      status.textContent = '';
      if (reduced.matches || typeof layer.animate !== 'function') { finish(); return; }
      stage.classList.remove('bm-preparing');
      setPhase('playing');
      const currentEpoch = epoch;
      animations = groups.map((group, index) => group.animate([{ opacity: 0 }, { opacity: 1 }], { duration: index === groups.length - 1 ? 550 : 180, delay: revealDelays[index], fill: 'both', easing: 'ease-out' }));
      const fade = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, delay: fadeAt, fill: 'both', easing: 'ease-in-out' });
      clock = overlay.animate([{ opacity: 1 }, { opacity: 1 }], { duration, fill: 'both' });
      animations.push(fade, clock);
      clock.finished.then(() => { if (currentEpoch === epoch) finish(); }).catch(() => {});
      tick();
    }
    function loaded() {
      if (!ready()) return;
      stage.classList.remove('bm-preparing');
      button.disabled = false;
      if (phase === 'loading') setPhase('ready');
      if (reduced.matches) { started = true; finish(); }
      else if (inView && !document.hidden) { if (!started) play(); else resume(); }
    }
    function imageError() {
      failed = true;
      clearAnimations();
      setPhase('fallback');
      stage.classList.remove('bm-preparing');
      button.disabled = true;
      button.hidden = true;
      footer.hidden = true;
    }
    finalFigure.addEventListener('load', loaded);
    plate.addEventListener('load', loaded);
    finalFigure.addEventListener('error', imageError);
    plate.addEventListener('error', imageError);
    plate.src = data.plate;
    button.addEventListener('click', () => {
      if (phase === 'playing') pause(true);
      else if (phase === 'paused') { userPaused = false; resume(true); }
      else play();
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const entry = entries[0];
        inView = entry.isIntersecting && entry.intersectionRatio >= .5;
        if (inView && !document.hidden) { if (!started) play(); else resume(); }
        else pause();
      }, { threshold: [0, .5] });
      observer.observe(stage);
    } else { inView = true; started = true; finish(); }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
      else if (inView) { if (!started) play(); else resume(); }
    });
    reduced.addEventListener('change', () => {
      if (reduced.matches) { started = true; finish(); }
      button.hidden = reduced.matches;
    });
    caption.textContent = 'Results appear in sequence.';
    if (reduced.matches) { started = true; finish(); button.hidden = true; }
    loaded();
  });
})();
