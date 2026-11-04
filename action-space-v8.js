/* Conceptual action-interface illustration; motion is schematic, not recorded data. */
(() => {
  'use strict';
  const mount = document.getElementById('action-space-explainer');
  if (!mount) return;
  const modes = {
    eef: {title: 'EEF + head metadata · 23 dimensions', text: 'The 16D bimanual block represents each hand with position (3), quaternion orientation (4), and metric gripper aperture (1). Motions are chunk-relative to the current observation, with translations anchored to its head-camera frame. Gripper widths use a common 0.12 m reference.', short: 'Bimanual 16D + head metadata 7D', note: 'The remaining 7D records head-camera geometry. These metadata slots are always excluded from state conditioning and action prediction losses.'},
    joint: {title: 'Joint · 23 dimensions', text: 'A canonical layout covers robot arms, grippers, torso, and head joints. The joint branch uses embodiment-specific input and output projections; unused coordinates are padded and masked. Human hand trajectories do not provide robot joint supervision.', short: 'Embodiment-specific joint projections', note: 'Joint-input dropout during robot training helps the shared EEF pathway remain self-sufficient.'},
    chassis: {title: 'Chassis · 3 dimensions', text: 'Planar base translation (x, y) and yaw describe chassis motion relative to the current base pose. These channels support mobile manipulation and use shared input and output projections across sources.', short: 'Base translation + yaw', note: 'Unavailable chassis annotations, including those in human videos, are masked out of the action loss.'}
  };
  mount.innerHTML = `<div class="as-shared"><span>Human motion annotations</span><b>+</b><span>Robot action annotations</span><b>→</b><strong>Unified 49D action interface</strong></div>
    <div class="as-dimensions" role="group" aria-label="Explore the 49-dimensional action interface">
      <button data-as-mode="joint" aria-pressed="false"><b>Joint</b><span>23D</span></button>
      <button data-as-mode="chassis" aria-pressed="false"><b>Chassis</b><span>3D</span></button>
      <button data-as-mode="eef" aria-pressed="true"><b>EEF + metadata</b><span>23D</span></button>
    </div>
    <div class="as-body" data-as-active="eef">
      <div class="as-drawing">
      <svg viewBox="0 0 560 360" role="img" aria-label="Schematic mobile robot with highlighted joint, end-effector, and chassis action channels">
        <defs><marker id="as-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>
        <ellipse cx="282" cy="318" rx="162" ry="19" fill="#e7eff7"/>
        <g class="as-chassis-path" fill="none" stroke="currentColor" stroke-width="3" marker-end="url(#as-arrow)"><path d="M130 303h83"/><path d="M176 325l-41 -29"/><path d="M360 308c51 -5 54 -39 17 -46"/></g>
        <g class="as-robot">
          <rect x="237" y="257" width="90" height="57" rx="20" class="as-base"/>
          <rect x="233" y="291" width="15" height="24" rx="6" fill="#526780"/><rect x="317" y="291" width="15" height="24" rx="6" fill="#526780"/>
          <path d="M257 256v-54h50v54" fill="#e5edf6" stroke="#71859c" stroke-width="3"/>
          <rect x="233" y="117" width="97" height="108" rx="24" fill="#f5f9fd" stroke="#71859c" stroke-width="3"/>
          <path d="M269 117V99h25v18" fill="#dae5f2" stroke="#71859c" stroke-width="3"/>
          <g class="as-head"><rect x="250" y="53" width="64" height="48" rx="17"/><rect x="260" y="68" width="44" height="13" rx="6" fill="#10264a"/><circle cx="293" cy="74" r="3" fill="#6cc7e8"/></g>
          <g class="as-arm as-left"><path d="M238 141L197 184L160 158"/><circle cx="238" cy="141" r="8"/><circle cx="197" cy="184" r="8"/><circle cx="160" cy="158" r="7"/><path class="as-hand" d="M155 155l-14 -11m14 11l-13 7m-1 -18l-6 5m7 13l-7 -5"/></g>
          <g class="as-arm as-right"><path d="M326 141L366 183L402 157"/><circle cx="326" cy="141" r="8"/><circle cx="366" cy="183" r="8"/><circle cx="402" cy="157" r="7"/><path class="as-hand" d="M407 154l14 -11m-14 11l13 7m1 -18l6 5m-7 13l7 -5"/></g>
          <g class="as-eef-path" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5"><path d="M113 185Q115 115 172 133"/><path d="M389 132Q445 111 450 183"/></g>
          <g class="as-eef-targets" fill="none" stroke="currentColor" stroke-width="2"><circle cx="136" cy="153" r="22"/><path d="M110 153h16m20 0h16m-26 -26v16m0 20v16"/><circle cx="426" cy="153" r="22"/><path d="M400 153h16m20 0h16m-26 -26v16m0 20v16"/></g>
        </g>
        <g class="as-labels" fill="#526780" font-size="14" font-family="system-ui, sans-serif"><text x="22" y="80">Head metadata</text><path d="M145 76h95" stroke="#b9c9da"/><text x="20" y="226">Hands / EEF</text><path d="M109 222l31 -46" stroke="#b9c9da"/><text x="407" y="226">Joints</text><path d="M400 219l-31 -25" stroke="#b9c9da"/><text x="373" y="286">Chassis</text><path d="M365 282h-30" stroke="#b9c9da"/></g>
      </svg><span class="as-schematic">Illustrative motion · not a recorded trajectory</span></div>
      <div class="as-description"><span class="case-label">49D action interface</span><h4 id="as-title"></h4><p id="as-text"></p><p class="as-note" id="as-note"></p></div>
    </div><p class="as-mask"><strong>Supervise only valid action coordinates.</strong> Human trajectories supervise available coordinates in the 16D bimanual block. Robot data may additionally supervise joint and chassis actions. The 7D head-camera metadata is excluded from state conditioning and action prediction losses for every source.</p>`;
  const body = mount.querySelector('.as-body');
  function select(mode) {
    const d = modes[mode];
    body.dataset.asActive = mode;
    mount.querySelector('#as-title').textContent = d.title;
    mount.querySelector('#as-text').textContent = d.text;
    mount.querySelector('#as-note').textContent = d.note;
    mount.querySelectorAll('[data-as-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.asMode === mode)));
  }
  mount.addEventListener('click', e => {
    const mode = e.target.closest('[data-as-mode]');
    if (mode) select(mode.dataset.asMode);
  });
  select('eef');
})();
