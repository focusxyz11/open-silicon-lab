/* The twelve challenges of the first page, met on its own picture, never in a window of their own (src/v2/hold.js
   fetches this when the camera first leaves the fifty years, at the first touch, or when the count in the bar is
   tapped, which flies the camera to the whole chip; styles: src/styles/holdnotes.css). On the whole chip each block
   wears the challenges played on it as marks on its lower edge: square where one is played on the picture, round where
   on Moore's law, filled once done, the next one not yet done ringed, each with its short name (the fifty years carry
   seven: their ticks in a row and one name at a time; on a phone, the next of them and how many are done). A tap flies there (go, the page's own goChallenge). In the rail
   at the left each chapter carries its ticks beside its name. What a challenge asks, its question and its lab are on
   its block's cards already, so they are not said again here.
   marks({ blks, rail, go }): blks, the chip's blocks by id; rail, the chapters' nav; go(id) flies to a challenge. */
import { needStyles } from '../core/styles.js';
import { w, h, S, PW, ORDER, onChange } from './holdkit.js';
import { CHALS, CH_AT, DWALL, MOMENTS } from '../data/hold.js';

/* the twelve in the order the story meets them: through the fifty years by the count, then block by block */
const along = id => { const [pid, d] = CH_AT[id]; return pid === 'years' ? d : DWALL + 1 + ORDER.indexOf(pid); };
const LINE = CHALS.slice().sort((a, b) => along(a) - along(b));
/* round: played on Moore's law (the years' challenges that are not a moment on the square) */
const curve = id => CH_AT[id][0] === 'years' && !MOMENTS.some(m => m.id === id);

let made = false;
export function marks({ blks, rail, go }) {
  if (made) return; made = true;
  needStyles('holdnotes');
  const on = {}; LINE.forEach(id => (on[CH_AT[id][0]] = on[CH_AT[id][0]] || []).push(id));
  const tick = id => '<button type="button" class="hc-t' + (curve(id) ? ' cv' : '') + '" data-ch="' + id + '"><i></i><span>' + w('ch.' + id) + '</span></button>';
  const groups = Object.keys(on).filter(b => blks[b]).map(b => { const g = h('div', 'h-chm' + (on[b].length > 1 ? ' many' : ''), on[b].map(tick).join('') + (on[b].length > 1 ? '<b class="hc-n mono" aria-hidden="true"></b>' : '')); g.dataset.blk = b; blks[b].appendChild(g); return g; });
  groups.forEach(g => g.addEventListener('click', e => { const t = e.target.closest('.hc-t'); if (t) { e.stopPropagation(); go(t.dataset.ch); } }));
  /* the rail: each chapter's ticks beside its name, shown with it */
  if (rail) [...rail.children].forEach(b => { const ids = LINE.filter(id => PW[CH_AT[id][0]].ch === b.dataset.ch), s = b.querySelector('span');
    if (ids.length && s) { const r = h('em', 'hc-r', ids.map(id => '<i data-ch="' + id + '"' + (curve(id) ? ' class="cv"' : '') + '></i>').join('')); r.setAttribute('aria-hidden', 'true'); s.appendChild(r); } });
  function paint() {
    const next = LINE.find(id => !S.done[id]);
    groups.forEach(g => { const ts = [...g.querySelectorAll('.hc-t')], n = g.querySelector('.hc-n'), bn = ts.find(t => !S.done[t.dataset.ch]);
      ts.forEach(t => { const id = t.dataset.ch, d = !!S.done[id]; t.classList.toggle('on', d); t.classList.toggle('nx', id === next); t.classList.toggle('bn', t === bn);
        t.setAttribute('aria-label', w('ch.' + id) + (d ? ', ' + w('chm.done') : id === next ? ', ' + w('chm.next') : '')); });
      if (n) n.textContent = ts.filter(t => S.done[t.dataset.ch]).length + '/' + ts.length; });
    if (rail) rail.querySelectorAll('.hc-r i').forEach(i => { i.classList.toggle('on', !!S.done[i.dataset.ch]); i.classList.toggle('nx', i.dataset.ch === next); });
  }
  paint(); onChange(paint);
}
