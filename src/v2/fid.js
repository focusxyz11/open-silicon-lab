/* How true is each thing (#325, docs/SYSTEM.md "How true"): one mark, the same everywhere, for how far the lab's picture
   of a thing goes: an idea drawn, shaped by real numbers, computed, checked against the real thing (src/data/fidelity.js).
   Its glyph is four steps, filled up to how true it is; its word beside it. Tapping it says in one line what it means
   here: the engine that computes it, or the source its figures come from. A claim about something that may not exist
   yet also carries its status (in products, shown in a lab, a guess: src/v2/machines.js): the same pill, tapped the
   same way, a disc for whether anyone has built it.

   mark(rec) -> HTML of the mark for a record { f, by?, fact? }; claimFid(claim) -> the record of a machine's claim;
   the tap is wired once, for the whole page, when this module loads. */
import { t } from '../core/i18n.js';
import { FIDS, ENGINES, rankOf } from '../data/fidelity.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* the glyph: four steps rising, filled up to how true the thing is */
export function glyph(f) {
  const n = rankOf(f) + 1;
  return '<svg class="fidg" viewBox="0 0 16 14" aria-hidden="true">' + [0, 1, 2, 3].map(i => { const h = 4.5 + i * 2.8, x = 0.8 + i * 3.8;
    return '<rect x="' + x.toFixed(1) + '" y="' + (13.2 - h).toFixed(1) + '" width="2.6" height="' + h.toFixed(1) + '" rx=".9"' + (i < n ? '' : ' class="o"') + '/>'; }).join('') + '</svg>';
}
/* a machine's claim says its mark (fid) and what it rests on (engine, a file; fact): its record */
const ENGINE_OF = {}; Object.entries(ENGINES).forEach(([k, v]) => { if (!(v in ENGINE_OF)) ENGINE_OF[v] = k; });
export const claimFid = cl => (cl && cl.fid ? { f: cl.fid, by: cl.engine ? ENGINE_OF[cl.engine] || null : null, fact: cl.fact || null } : null);

/* the mark: a small pill, the glyph and its word; o.cls adds a class */
export function mark(rec, o = {}) {
  if (!rec || !FIDS.includes(rec.f)) return '';
  const w = t('fid.' + rec.f + '.t');
  return '<button type="button" class="fid f-' + rec.f + (o.cls ? ' ' + o.cls : '') + '" data-fid="' + rec.f + '"' + (rec.by ? ' data-fidby="' + esc(rec.by) + '"' : '') +
    (rec.fact ? ' data-fidfact="' + esc(rec.fact) + '"' : '') + ' aria-expanded="false" aria-label="' + esc(t('fid.aria', { what: w })) + '">' + glyph(rec.f) + '<span>' + esc(w) + '</span></button>';
}

/* ---- the tap: one line of what the mark means here, in a small note beside it ---- */
let FACT = null, asked = null, tip = null, from = null;
const facts = () => FACT ? Promise.resolve(FACT) : asked || (asked = fetch('src/data/facts.json').then(r => r.json()).then(j => (FACT = Object.fromEntries((j.facts || []).map(x => [x.id, x]))), () => (FACT = {})));
function lineOf(b) {
  if (b.dataset.fidst) return t('invent.status.' + b.dataset.fidst + '.line');
  const f = b.dataset.fid, fa = b.dataset.fidfact && FACT && FACT[b.dataset.fidfact];
  return t('fid.' + f + '.line', { by: b.dataset.fidby ? t('fid.by.' + b.dataset.fidby) : '', source: fa ? fa.source : t('fid.source'), value: fa ? fa.value : t('fid.value') });
}
function close() {
  if (!tip) return; tip.remove(); tip = null;
  if (from) { from.setAttribute('aria-expanded', 'false'); from.classList.remove('on'); } from = null;
}
function place() {
  if (!tip || !from) return;
  if (!from.isConnected) return close();
  const r = from.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, below = r.bottom + 8 + h < innerHeight - 8;
  tip.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.left))) + 'px';
  tip.style.top = Math.round(below ? r.bottom + 8 : Math.max(8, r.top - 8 - h)) + 'px';
}
function open(b) {
  close(); from = b; b.setAttribute('aria-expanded', 'true'); b.classList.add('on');
  tip = document.createElement('div'); tip.className = 'fidtip'; tip.setAttribute('role', 'status');
  const fill = () => { if (!tip || from !== b) return; tip.innerHTML = (b.dataset.fidst ? '' : glyph(b.dataset.fid)) + '<p>' + esc(lineOf(b)) + '</p>'; place(); };
  document.body.appendChild(tip); fill();
  if (b.dataset.fidfact && !FACT) facts().then(fill);
}
if (typeof document !== 'undefined' && !document.fidWired) {
  document.fidWired = true;
  /* caught before anything under the mark sees it: a mark inside a card, a list or a figure only explains itself */
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-fid],[data-fidst]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (from === b) close(); else open(b);
  }, true);
  document.addEventListener('pointerdown', e => { if (tip && !tip.contains(e.target) && !(e.target.closest && e.target.closest('[data-fid],[data-fidst]'))) close(); }, true);
  /* Escape puts the note away first, before it goes out a level */
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && tip) { e.stopPropagation(); const b = from; close(); if (b && b.isConnected) b.focus(); } }, true);
  addEventListener('scroll', () => place(), true);
  addEventListener('resize', () => place());
  addEventListener('hashchange', close);
}
