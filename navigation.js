/* Reveal navigation at the top edge; keep it reachable by keyboard and touch. */
(() => {
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('main-nav');
  const menu = document.querySelector('.menu-toggle');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reveal = document.createElement('button');
  reveal.className = 'nav-reveal';
  reveal.type = 'button';
  reveal.textContent = 'Menu';
  reveal.setAttribute('aria-label', 'Show navigation');
  reveal.setAttribute('aria-controls', 'main-nav');
  header.after(reveal);
  let timer;
  let pointerNear = false;
  let touchOpen = false;
  function update() {
    const reading = scrollY > 160;
    document.body.classList.toggle('nav-reading', reading);
    const focused = header.contains(document.activeElement);
    header.classList.toggle('nav-hidden', reading && !pointerNear && !focused && !touchOpen);
  }
  function leave() {
    clearTimeout(timer);
    timer = setTimeout(() => { pointerNear = false; update(); }, 450);
  }
  document.addEventListener('pointermove', e => {
    if (!finePointer.matches || e.pointerType === 'touch') return;
    const box = header.getBoundingClientRect();
    const overHeader = !header.classList.contains('nav-hidden') && e.clientY <= box.bottom + 12 && e.clientX >= box.left - 12 && e.clientX <= box.right + 12;
    if (e.clientY <= 24 || overHeader) {
      clearTimeout(timer); pointerNear = true; update();
    } else leave();
  }, {passive: true});
  document.addEventListener('pointerleave', leave);
  header.addEventListener('focusin', update);
  header.addEventListener('focusout', () => setTimeout(update, 0));
  reveal.addEventListener('click', () => {
    touchOpen = true; update();
    nav.classList.add('open');
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Close navigation');
    menu.focus({preventScroll: true});
  });
  nav.addEventListener('click', e => {
    if (!e.target.closest('a')) return;
    touchOpen = false; pointerNear = false;
    if (e.detail > 0) document.activeElement.blur();
    update();
  });
  menu.addEventListener('click', () => {
    touchOpen = nav.classList.contains('open');
    if (!touchOpen && !finePointer.matches) menu.blur();
    update();
  });
  document.addEventListener('pointerdown', e => {
    if (!header.contains(e.target) && e.target !== reveal) {
      touchOpen = false;
      nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
      if (header.contains(document.activeElement)) document.activeElement.blur();
      update();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { touchOpen = false; pointerNear = false; update(); }
  });
  addEventListener('scroll', update, {passive: true});
  finePointer.addEventListener('change', update);
  update();
})();
