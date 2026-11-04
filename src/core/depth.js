/* One simulation, explored at growing depth: See it, Measure it, Model it, Open question.
   There are no levels of reader. Everyone starts at See it, nothing is locked, and the picture stays
   on screen while each depth adds to it. Topic labs mark up a rail and panels (docs/DEPTH.md):

     <div class="lab depthlab">
       <div class="depthrail"><button id="yd-see" data-depth="see"></button> …</div>
       <p data-on="0">Only at See it.</p>  <div data-on="123">At the other three.</div>
     </div>

   data-on lists the depths (0 to 3) where an element shows. A rail button's id is a link: #yd-measure
   opens the topic at that depth, so a challenge can start where its tools are.

   depthLab(lab, onChange) wires it up and returns { get d(), go(d) }. */
import { t } from './i18n.js';

export const DEPTHS = ['see', 'measure', 'model', 'open'];

export function depthLab(lab, onChange = () => {}) {
  const rail = lab.querySelector('.depthrail'), btns = [...rail.querySelectorAll('button[data-depth]')];
  const panels = [...lab.querySelectorAll('[data-on]')], next = lab.querySelector('.depthnext');
  let d = 0;
  rail.setAttribute('role', 'tablist'); rail.setAttribute('aria-label', t('depth.label'));
  btns.forEach(b => { b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = t('depth.' + b.dataset.depth); });
  function show() {
    btns.forEach((b, i) => { b.setAttribute('aria-selected', String(i === d)); b.tabIndex = i === d ? 0 : -1; });
    panels.forEach(p => { p.hidden = !p.dataset.on.includes(String(d)); });
    if (next) next.textContent = d < DEPTHS.length - 1 ? t('depth.' + DEPTHS[d + 1]) : t('depth.back');
  }
  function go(to) {
    const was = d; d = (to + DEPTHS.length) % DEPTHS.length;
    show(); if (d !== was) onChange(d, was);
  }
  btns.forEach((b, i) => b.addEventListener('click', () => go(i)));
  if (next) next.addEventListener('click', () => { go(d + 1); rail.scrollIntoView({ block: 'nearest' }); });
  rail.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault(); go(d + (e.key === 'ArrowRight' ? 1 : -1)); btns[d].focus();
  });
  const fromHash = () => { const i = btns.findIndex(b => b.id === location.hash.slice(1)); if (i >= 0) go(i); };
  addEventListener('hashchange', fromHash);
  show(); fromHash();
  return { get d() { return d; }, go };
}
