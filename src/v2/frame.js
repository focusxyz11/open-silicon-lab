/* The frame (docs/SYSTEM.md §3, docs/reviews/structure.md): the one set of things every view wears around its scene.
   Two rails say where you are, one for each move: the loop in the bar (the chip's life, along: drawn by the shell)
   and the levels at the side (scale, in · out). The way out is top left, with the place's name. Everything else is
   one card at the bottom, the same on the island and in every view: its three faces Look · Do · Ask at the top, with
   how much waits behind each, and its words below, one step at a time. In Look the view writes its story or card
   there; in Do and Ask the frame fills it itself from the atlas, with the challenges and the questions that live at
   the level in view and what the community has left there, so every view has them for free.

   createFrame(host, o): o.up { href, label }, o.path [{ href, label }], o.rail { label, items: [{ id, label }] },
   o.follow(key) → address of a question, o.askAt(depth) → stop keys, o.askedAt(depth) → html of what people asked,
   o.doAt(depth) → [{ id, title, where, href, open }], o.onRail(id), o.onLook().
   Returns { dock, level(depth), rail(at, fill), goal(html), mode(), look(), stop(html) }: stop() pins a question you
   are following in the card, under Ask, until you choose a face again. */
import { t } from '../core/i18n.js';
import { TWINS } from '../data/atlas.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const MODES = ['look', 'do', 'ask'];
export const FACES = ['designed', 'made', 'used'];

export function createFrame(host, o) {
  let mode = 'look', depth = null, pinned = false;
  const path = o.path.slice(1);
  host.innerHTML =
    '<a class="homebtn" href="' + esc(o.up.href) + '" aria-label="' + esc(o.up.label) + '">↑</a>' +
    '<nav class="crumbs2">' + path.map((p, i) => (i ? '<span aria-hidden="true">›</span>' : '') + (p.href ? '<a href="' + esc(p.href) + '">' + esc(p.label) + '</a>' : '<b>' + esc(p.label) + '</b>')).join('') + '</nav>' +
    (o.rail ? '<ol class="rail2" aria-label="' + esc(o.rail.label) + '"><span class="rfill"></span>' + o.rail.items.map(x => '<li><button type="button" data-rail="' + esc(x.id) + '"><span class="dot"></span><span class="nm">' + esc(x.label) + '</span></button></li>').join('') + '</ol>' : '') +
    '<div class="corner"><aside class="goal2" hidden></aside></div>' +
    '<div class="dockwrap"><div class="modes3" role="tablist" aria-label="' + esc(t('frame.modes')) + '">' + MODES.map(m => '<button type="button" role="tab" data-mode="' + m + '" aria-selected="' + (m === mode) + '"><span class="mn">' + esc(t('frame.' + m)) + '</span><span class="mc"></span></button>').join('') + '</div>' +
    '<section class="dock" aria-live="polite"></section></div>';
  const $ = s => host.querySelector(s), dock = $('.dock');

  /* Do and Ask, from the atlas, for the level in view */
  const counts = () => { const q = depth ? o.askAt(depth).length : 0, c = depth ? o.doAt(depth).length : 0;
    host.querySelectorAll('[data-mode]').forEach(b => { const n = b.dataset.mode === 'ask' ? q : b.dataset.mode === 'do' ? c : 0; b.querySelector('.mc').textContent = n ? String(n) : ''; }); };
  const fill = () => {
    host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    if (mode === 'look') return o.onLook && o.onLook();
    let h = '<p class="kicker">' + esc(t('frame.' + mode + 'At', { level: depth ? t('depth.' + depth + '.name') : '' })) + '</p>';
    if (mode === 'ask') { const ks = depth ? o.askAt(depth) : []; h += ks.length ? '<div class="asklist">' + ks.map(k => '<a class="askline" href="' + esc(o.follow(k)) + '"><span class="q">' + esc(t('stop.' + k + '.q')) + '</span></a>').join('') + '</div>' : '<p class="small muted">' + esc(t('frame.noAsk')) + '</p>';
      /* what people and agents have asked at this level: the commons' trace, on the thing itself */
      h += depth && o.askedAt ? o.askedAt(depth) : ''; }
    else { const cs = depth ? o.doAt(depth) : []; h += cs.length ? '<div class="dolist">' + cs.map(c => '<a class="dochip' + (c.open ? ' open' : '') + '" href="' + esc(c.href || '#/do/' + c.id) + '">' + (c.open ? '<span class="kicker">' + esc(t('trail.open')) + '</span>' : '') + '<b>' + esc(c.title) + '</b><span class="small muted">' + esc(c.where) + '</span></a>').join('') + '</div>' : '<p class="small muted">' + esc(t('frame.noDo')) + '</p>'; }
    h += '<div class="nav"><button type="button" class="btn ghost" data-mode="look">' + esc(t('frame.backToLook')) + '</button></div>';
    dock.innerHTML = h; dock.classList.remove('locked');
  };
  host.addEventListener('click', e => {
    const m = e.target.closest('[data-mode]'); if (m) { mode = m.dataset.mode; pinned = false; return fill(); }
    const r = e.target.closest('[data-rail]'); if (r) return o.onRail && o.onRail(r.dataset.rail);
  });
  return {
    dock,
    /* the level in view: Do and Ask follow it, and so does the Turn */
    level(d) { depth = d; counts(); if (mode !== 'look' && !pinned) fill(); },
    /* the rail: which item is here, and how far along (0..1) */
    rail(at, f) { host.querySelectorAll('[data-rail]').forEach(b => { if (b.dataset.rail === at) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); if (f != null) { const el = $('.rfill'); if (el) el.style.height = (f * 100).toFixed(1) + '%'; } },
    /* the stage of the loop a view shows is the shell's to say (the bar); kept so views need not know */
    face() {},
    goal(html) { const g = $('.goal2'); g.hidden = !html; if (html) g.innerHTML = html; },
    mode() { return mode; },
    look() { mode = 'look'; pinned = false; fill(); },
    /* a challenge being played in the card: its face is Do, and it stays while the level changes beneath it */
    doing() { mode = 'do'; pinned = true; host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === 'do'))); },
    /* a question being followed: shown under Ask, and kept while the level changes beneath it */
    stop(html) { mode = 'ask'; pinned = true; host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === 'ask'))); dock.innerHTML = html; dock.classList.remove('locked'); }
  };
}
export { TWINS };
