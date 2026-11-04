/* Six independent training configurations; this animation is a data tour, not a training trace. */
(() => {
  'use strict';
  const host = document.getElementById('scaling-explorer');
  if (!host) return;
  const configurations = [
    { robot: 2005, human: 0, zero: [2.92, 2.68], post: [87.24, 59.88] },
    { robot: 4261, human: 0, zero: [5.08, 3.24], post: [87.32, 63.48] },
    { robot: 8475, human: 0, zero: [8.36, 9.00], post: [87.80, 70.96] },
    { robot: 14618, human: 0, zero: [11.40, 11.56], post: [89.84, 70.80] },
    { robot: 14618, human: 15901, zero: [13.56, 12.76], post: [89.00, 71.68] },
    { robot: 14618, human: 45938, zero: [13.68, 14.20], post: [88.96, 74.36] }
  ];
  const panels = [
    { key: 'zero', title: 'Zero-shot execution', subtitle: 'No RoboTwin task post-training', hours: [2005, 4261, 8475, 14618, 30519, 60556] },
    { key: 'post', title: 'After matched post-training', subtitle: 'Same task adaptation recipe across configurations', hours: [2000, 4200, 8000, 14618, 30519, 60556] }
  ];
  const metrics = [
    { key: 'random', label: 'Random', marker: '◆', value: values => values[1] },
    { key: 'clean', label: 'Clean', marker: '●', value: values => values[0] }
  ];
  const number = value => value.toLocaleString('en-US');
  const tourStepMs = 650;
  let selected = configurations.length - 1;
  const visibleMetrics = new Set(['random']);
  let playing = false;
  let touring = false;
  let timer;
  const x = i => 55 + i * 85;
  const activeMetrics = () => metrics.filter(metric => visibleMetrics.has(metric.key));
  function axis(panel) {
    if (panel.key === 'zero') return { min: 0, max: 16, ticks: [0, 4, 8, 12, 16] };
    return visibleMetrics.size === 1 && visibleMetrics.has('random')
      ? { min: 50, max: 80, ticks: [50, 55, 60, 65, 70, 75, 80] }
      : { min: 50, max: 100, ticks: [50, 60, 70, 80, 90, 100] };
  }
  const y = (value, scale) => 235 - (value - scale.min) / (scale.max - scale.min) * 180;
  function chart(panel) {
    const scale = axis(panel);
    const shown = activeMetrics();
    const series = shown.map(metric => {
      const points = configurations.map((item, i) => `${x(i)},${y(metric.value(item[panel.key]), scale)}`);
      const segments = points.slice(1).map((point, i) => `<polyline class="sx-segment${touring && i + 1 > selected ? ' is-pending' : ''}" data-sx-segment="${i + 1}" points="${points[i]} ${point}" fill="none"/>`).join('');
      return `<g class="sx-series sx-${metric.key}" data-sx-series="${metric.key}">${segments}${configurations.map((item, i) => {
        const value = metric.value(item[panel.key]);
        const cx = x(i), cy = y(value, scale);
        const mark = metric.key === 'clean' ? `<circle class="sx-dot" cx="${cx}" cy="${cy}" r="4.4"/>`
          : `<path class="sx-dot" d="M${cx},${cy - 5.5} l5.5,5.5 -5.5,5.5 -5.5,-5.5 Z"/>`;
        return `<g class="sx-datum${i === selected ? ' is-selected' : ''}${touring && i > selected ? ' is-pending' : ''}" data-sx-point="${i}"><circle class="sx-halo" cx="${cx}" cy="${cy}" r="10"/>${mark}<title>${number(panel.hours[i])} h total training data, ${metric.label}: ${value.toFixed(2)}%</title></g>`;
      }).join('')}</g>`;
    }).join('');
    return `<svg class="sx-chart" viewBox="0 0 530 290" role="img" aria-label="${panel.title}: ${shown.map(m => m.label).join(' and ')} success rates across six independent training data budgets in hours. Y axis ${scale.min} to ${scale.max} percent.">
      <rect class="sx-hybrid-area" x="352.5" y="42" width="154" height="193"/>
      <text class="sx-stage-label" x="182" y="24" text-anchor="middle">Robot-only scaling</text><text class="sx-stage-label sx-human-label" x="429" y="24" text-anchor="middle">+ Human data</text>
      ${scale.ticks.map(value => `<g><line class="sx-grid-line" x1="55" x2="506" y1="${y(value, scale)}" y2="${y(value, scale)}"/><text class="sx-axis-label" x="44" y="${y(value, scale) + 4}" text-anchor="end">${value}</text></g>`).join('')}
      <text class="sx-axis-title" x="16" y="145" transform="rotate(-90 16 145)" text-anchor="middle">Success rate (%)</text>
      <line class="sx-focus-line" x1="${x(selected)}" x2="${x(selected)}" y1="42" y2="235"/>
      ${series}
      ${panel.hours.map((hours, i) => `<text class="sx-axis-label sx-x-label" x="${x(i)}" y="255" text-anchor="middle">${number(hours)}</text>`).join('')}
      <text class="sx-axis-title" x="280" y="282" text-anchor="middle">Total training data (h)</text>
    </svg>`;
  }
  host.innerHTML = `<div class="sx-toolbar"><div><span class="sx-kicker">Explore the measured results</span><h3>One data sweep. Two evaluation settings.</h3></div><div class="sx-play-controls"><button type="button" class="sx-play" aria-pressed="false">▶ Play data tour</button><button type="button" class="sx-reset">Reset</button></div></div>
    <div class="sx-display-controls"><div class="sx-metric-toggles" role="group" aria-label="Results shown in both scaling charts">${metrics.map(metric => `<button type="button" class="sx-metric-toggle sx-${metric.key}" data-sx-metric="${metric.key}" aria-pressed="${visibleMetrics.has(metric.key)}"><span aria-hidden="true">${metric.marker}</span> ${metric.label}</button>`).join('')}</div><span class="sx-display-hint">Choose which results to compare.</span></div>
    <div class="sx-layout">${panels.map(panel => `<article class="sx-panel" data-sx-panel="${panel.key}"><header><h4>${panel.title}</h4><p>${panel.subtitle}</p></header><div class="sx-chart-mount"></div><div class="sx-scale-caption"></div><div class="sx-values"></div><p class="sx-chart-note"></p></article>`).join('')}</div>
    <p class="sx-caveat">Each point is an independently trained checkpoint. The tour highlights measured results; it does not depict sequential training. The matched post-training sweep is separate from the refined 88.65% benchmark recipe. Post-training figure labels round the first three robot budgets to 2,000 / 4,200 / 8,000 h.</p>
    <span class="sx-sr-only" aria-live="polite" data-sx-announcement></span>`;
  const playButton = host.querySelector('.sx-play');
  function render(announce = false) {
    const item = configurations[selected];
    const shown = activeMetrics();
    const stage = selected < 4 ? 'Stage 01 · Scale robot data' : 'Stage 02 · Add human data';
    const budget = `${number(item.robot)} h robot + ${number(item.human)} h human`;
    host.querySelectorAll('[data-sx-metric]').forEach(button => {
      const enabled = visibleMetrics.has(button.dataset.sxMetric);
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-disabled', String(enabled && shown.length === 1));
      button.title = enabled && shown.length === 1 ? 'At least one result stays visible. Select another result to compare or switch.' : '';
    });
    panels.forEach(panel => {
      const el = host.querySelector(`[data-sx-panel="${panel.key}"]`);
      const scale = axis(panel);
      el.querySelector('.sx-chart-mount').innerHTML = chart(panel);
      el.querySelector('.sx-scale-caption').textContent = `Y-axis: ${scale.min}–${scale.max}%`;
      el.querySelector('.sx-values').innerHTML = shown.map(metric => `<div class="sx-${metric.key}"><span>${metric.label}</span><strong data-sx-value="${metric.key}">${metric.value(item[panel.key]).toFixed(2)}%</strong></div>`).join('');
      el.querySelector('.sx-chart-note').innerHTML = shown.map(metric => {
        const values = [0, 3, 5].map(i => metric.value(configurations[i][panel.key]).toFixed(2) + '%');
        return `<span>${metric.label}: ${values[0]} → ${values[1]} with robot-only scaling; ${values[2]} with added human data.</span>`;
      }).join('');
    });
    if (announce) host.querySelector('[data-sx-announcement]').textContent = `${stage}. ${budget}. ${panels.map(panel => `${panel.title}: ${shown.map(metric => `${metric.label} ${metric.value(item[panel.key]).toFixed(2)} percent`).join(', ')}`).join('. ')}.`;
  }
  function stop(preserveProgress = false) {
    clearTimeout(timer);
    playing = false;
    if (!preserveProgress) touring = false;
    playButton.setAttribute('aria-pressed', 'false');
    playButton.textContent = touring ? '▶ Resume tour' : '▶ Play data tour';
  }
  function tick() {
    if (!playing) return;
    selected += 1;
    if (selected === configurations.length - 1) stop();
    render(true);
    if (playing) timer = setTimeout(tick, tourStepMs);
  }
  playButton.addEventListener('click', () => {
    if (playing) { stop(true); return; }
    playing = true;
    if (!touring) selected = 0;
    touring = true;
    playButton.textContent = 'Ⅱ Pause tour';
    playButton.setAttribute('aria-pressed', 'true');
    render(true);
    timer = setTimeout(tick, tourStepMs);
  });
  host.querySelector('.sx-reset').addEventListener('click', () => { stop(); selected = 5; visibleMetrics.clear(); visibleMetrics.add('random'); render(true); });
  host.querySelectorAll('[data-sx-metric]').forEach(button => button.addEventListener('click', () => {
    const metric = button.dataset.sxMetric;
    if (visibleMetrics.has(metric) && visibleMetrics.size === 1) return;
    stop();
    if (visibleMetrics.has(metric)) visibleMetrics.delete(metric); else visibleMetrics.add(metric);
    render(true);
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(true); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { if (!entries[0].isIntersecting && playing) stop(true); }).observe(host);
  render();
})();
