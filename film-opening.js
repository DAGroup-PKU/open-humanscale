/* Playback stays at normal speed; scrolling only changes the presentation. */
(() => {
  const opening = document.getElementById('project-film');
  const film = document.getElementById('hero-video');
  if (!opening || !film) return;
  const root = document.documentElement;
  const sound = document.querySelector('.film-sound');
  const stage = opening.querySelector('.film-stage');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let canPlay = false;
  let resumeOnReturn = !motion.matches;
  let scheduled = false;
  const smooth = (a, b, value) => {
    const x = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };
  function update() {
    scheduled = false;
    const distance = Math.max(1, opening.offsetHeight);
    const progress = Math.max(0, Math.min(1, -opening.getBoundingClientRect().top / distance));
    const leaveAt = motion.matches ? 1 : .68;
    const opacity = 1 - smooth(.04, .68, progress);
    root.style.setProperty('--film-opacity', opacity.toFixed(3));
    root.style.setProperty('--paper-opacity', smooth(.38, .88, progress).toFixed(3));
    root.style.setProperty('--film-scale', (1 - .035 * progress).toFixed(3));
    document.body.classList.toggle('film-in-view', progress < .42);
    document.body.classList.toggle('film-past', progress >= leaveAt);
    stage.inert = progress >= leaveAt;
    if (progress < 1) document.querySelectorAll('#main-nav a').forEach(link => {
      const active = progress < .68 && link.hash === '#project-film';
      link.classList.toggle('current', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    // Only the film near the beginning of the page can start automatically.
    const nextCanPlay = progress < leaveAt && !document.hidden;
    if (nextCanPlay !== canPlay) {
      if (!nextCanPlay) {
        resumeOnReturn = !film.paused;
        canPlay = false;
        film.pause();
      } else {
        canPlay = true;
        if (resumeOnReturn && !motion.matches) film.play().catch(() => {});
      }
    }
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }
  film.addEventListener('pause', () => { if (canPlay) resumeOnReturn = false; });
  film.addEventListener('play', () => { resumeOnReturn = true; });
  const updateSound = () => {
    sound.innerHTML = `Sound ${film.muted ? 'off' : 'on'} <span aria-hidden="true">${film.muted ? '↗' : '✓'}</span>`;
    sound.setAttribute('aria-pressed', String(!film.muted));
    sound.setAttribute('aria-label', `Turn film sound ${film.muted ? 'on' : 'off'}`);
  };
  sound.addEventListener('click', () => { film.muted = !film.muted; updateSound(); });
  film.addEventListener('volumechange', updateSound);
  motion.addEventListener('change', () => { if (motion.matches) film.pause(); update(); });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', update);
  document.querySelectorAll('a[href="#project-film"]').forEach(link => link.addEventListener('click', () => {
    resumeOnReturn = true;
    if (canPlay) film.play().catch(() => {});
  }));
  document.body.classList.add('film-enhanced');
  updateSound();
  update();
})();
