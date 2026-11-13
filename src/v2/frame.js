/* The frame (docs/SYSTEM.md §3): the one set of things every view wears around its scene. Ornaments at the edges
   say where you are and never hold paragraphs: the way up and the path (top left), the levels as a rail (left,
   scale), the switch Look · Do · Ask, the Turn and a live goal (top right). The dock below holds the words, one
   step at a time: in Look the view writes its story or card there; in Do and Ask the frame fills it itself from the
   atlas, with the challenges and the questions that live at the level in view, so every view has them for free.

   createFrame(host, o): o.up { href, label }, o.path [{ href, label }], o.rail { label, items: [{ id, label }] },
   o.turn (true to offer it), o.follow(key) → address of a question, o.askAt(depth) → stop keys,
   o.doAt(depth) → [{ id, title, where }], o.onRail(id), o.onTurn(face, twin), o.onLook().
   Returns { dock, level(depth), rail(at, fill), goal(html), mode(), look() }. */
import { t } from '../core/i18n.js';
import { twinOf, TWINS } from '../data/atlas.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const MODES = ['look', 'do', 'ask'];
export const FACES = ['designed', 'made', 'used'];

export function createFrame(host, o) {
  let mode = 'look', depth = null, face = o.face || 'used';
  host.innerHTML =
    '<a class="homebtn" href="' + esc(o.up.href) + '" aria-label="' + esc(o.up.label) + '">↑</a>' +
    '<nav class="crumbs2">' + o.path.map((p, i) => (i ? '<span aria-hidden="true">›</span>' : '') + (p.href ? '<a href="' + esc(p.href) + '">' + esc(p.label) + '</a>' : '<b>' + esc(p.label) + '</b>')).join('') + '</nav>' +
    (o.rail ? '<ol class="rail2" aria-label="' + esc(o.rail.label) + '"><span class="rfill"></span>' + o.rail.items.map(x => '<li><button type="button" data-rail="' + esc(x.id) + '"><span class="dot"></span><span class="nm">' + esc(x.label) + '</span></button></li>').join('') + '</ol>' : '') +
    '<div class="corner"><div class="modes3" role="tablist" aria-label="' + esc(t('frame.modes')) + '">' + MODES.map(m => '<button type="button" role="tab" data-mode="' + m + '" aria-selected="' + (m === mode) + '"><span class="mn">' + esc(t('frame.' + m)) + '</span><span class="mc"></span></button>').join('') + '</div>' +
    '<div class="turn3" hidden></div><aside class="goal2" hidden></aside></div>' +
    '<section class="dock" aria-live="polite"></section>';
  const $ = s => host.querySelector(s), dock = $('.dock');

  /* the Turn: the level in view as designed, made or used (the atlas's TWINS) */
  const drawTurn = () => {
    const tw = depth && twinOf(depth), el = $('.turn3');
    el.hidden = !(o.turn && tw);
    if (el.hidden) return;
    el.innerHTML = '<span class="tl">' + esc(t('frame.turn')) + '</span>' + FACES.map(f => {
      const off = f === 'designed' && !tw.designed;
      return '<button type="button" data-face="' + f + '" aria-pressed="' + (f === face) + '"' + (off ? ' disabled title="' + esc(t('frame.turnNone')) + '"' : '') + '>' + esc(t('frame.face.' + f)) + '</button>';
    }).join('');
  };
  /* Do and Ask, from the atlas, for the level in view */
  const counts = () => { const q = depth ? o.askAt(depth).length : 0, c = depth ? o.doAt(depth).length : 0;
    host.querySelectorAll('[data-mode]').forEach(b => { const n = b.dataset.mode === 'ask' ? q : b.dataset.mode === 'do' ? c : 0; b.querySelector('.mc').textContent = n ? String(n) : ''; }); };
  const fill = () => {
    host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    if (mode === 'look') return o.onLook && o.onLook();
    let h = '<p class="kicker">' + esc(t('frame.' + mode + 'At', { level: depth ? t('depth.' + depth + '.name') : '' })) + '</p>';
    if (mode === 'ask') { const ks = depth ? o.askAt(depth) : []; h += ks.length ? '<div class="asklist">' + ks.map(k => '<a class="askline" href="' + esc(o.follow(k)) + '"><span class="q">' + esc(t('stop.' + k + '.q')) + '</span></a>').join('') + '</div>' : '<p class="small muted">' + esc(t('frame.noAsk')) + '</p>'; }
    else { const cs = depth ? o.doAt(depth) : []; h += cs.length ? '<div class="dolist">' + cs.map(c => '<a class="dochip" href="#/do/' + esc(c.id) + '"><b>' + esc(c.title) + '</b><span class="small muted">' + esc(c.where) + '</span></a>').join('') + '</div>' : '<p class="small muted">' + esc(t('frame.noDo')) + '</p>'; }
    h += '<div class="nav"><button type="button" class="btn ghost" data-mode="look">' + esc(t('frame.backToLook')) + '</button></div>';
    dock.innerHTML = h; dock.classList.remove('locked');
  };
  host.addEventListener('click', e => {
    const m = e.target.closest('[data-mode]'); if (m) { mode = m.dataset.mode; return fill(); }
    const r = e.target.closest('[data-rail]'); if (r) return o.onRail && o.onRail(r.dataset.rail);
    const f = e.target.closest('[data-face]'); if (f && !f.disabled) { face = f.dataset.face; drawTurn(); return o.onTurn && o.onTurn(face, twinOf(depth)); }
  });
  return {
    dock,
    /* the level in view: Do and Ask follow it, and so does the Turn */
    level(d) { depth = d; counts(); drawTurn(); if (mode !== 'look') fill(); },
    /* the rail: which item is here, and how far along (0..1) */
    rail(at, f) { host.querySelectorAll('[data-rail]').forEach(b => { if (b.dataset.rail === at) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); if (f != null) { const el = $('.rfill'); if (el) el.style.height = (f * 100).toFixed(1) + '%'; } },
    face(f) { face = f; drawTurn(); },
    goal(html) { const g = $('.goal2'); g.hidden = !html; if (html) g.innerHTML = html; },
    mode() { return mode; },
    look() { mode = 'look'; fill(); }
  };
}
export { TWINS };
