/* The frame (docs/SYSTEM.md §3, docs/reviews/structure.md): the one set of things every view wears around its scene.
   Two rails say where you are, one for each move: the loop in the bar (the chip's life, along: drawn by the shell)
   and the levels at the side (scale, in · out). The way out is top left, with the place's name. Everything else is
   one card at the bottom, the same on the island and in every view: its three faces Look · Do · Ask at the top, with
   how much waits behind each, and its words below, one step at a time. In Look the view writes its story or card
   there; in Do and Ask the frame fills it itself from the atlas, with the challenges and the questions that live at
   the level in view and what the community has left there, so every view has them for free.

   createFrame(host, o): o.up { href, label }, o.path [{ href, label }], o.rail { label, items: [{ id, label, size }] } (size: metres across, sizeOf in the atlas),
   o.follow(key) → address of a question, o.askAt(depth) → stop keys, o.askedAt(depth) → html of what people asked, o.fieldAt(depth) → ids of the questions from the field there,
   o.doAt(depth) → [{ id, title, where, href, open }], o.onRail(id), o.onLook().
   Returns { dock, level(depth), rail(at, fill, pos), goal(html), mode(), look(), stop(html), inwardAt(p) }: stop() pins a
   question you are following in the card, under Ask, until you choose a face again.
   The way in is on the picture, never only in the card: whatever way deeper the view writes in its card (an element
   with data-in) is shown again as one large button over the scene, by the frame, in every view the same. A view that
   knows where the thing you would enter is on the screen says so with inwardAt({ x, y }) (0..1 of the picture), and
   the button stands beside it with a ring on it (in the flight, the dive, the chip's layers and the board alike; where
   the card is below the picture, the ring alone, unless the card would cover it); o.scroll says the view also flies in
   when scrolled. How big it is here: the rail says each level's rough size, and while the view moves (rail's pos, the
   place along the items, between two of them) the card says how many times closer the next level is. */
import { t, fmtNum } from '../core/i18n.js';
import { TWINS } from '../data/atlas.js';
import { fieldLine } from './field.js';

/* a size in metres, in words: 500 m, 80 cm, 1 mm, 1 µm, 50 nm, 0.5 nm */
export function sizeWords(m) {
  const [u, k] = m >= 1 ? ['m', 1] : m >= 0.01 ? ['cm', 100] : m >= 1e-3 ? ['mm', 1e3] : m >= 1e-6 ? ['um', 1e6] : ['nm', 1e9];
  return t('frame.size.' + u, { v: fmtNum(+(m * k).toPrecision(2)) });
}
/* how many times closer (from bigger to smaller) or farther, rounded: below ten to a whole number, above to one figure */
export function timesWords(from, to) {
  const r = from / to, x = r >= 1 ? r : 1 / r; if (x < 1.5) return '';
  const p = Math.pow(10, Math.floor(Math.log10(x))), n = x < 10 ? Math.round(x) : Math.round(x / p) * p;
  return t(r >= 1 ? 'frame.zoom.in' : 'frame.zoom.out', { n: fmtNum(n) });
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const MODES = ['look', 'do', 'ask'];
export const FACES = ['designed', 'made', 'used'];

export function createFrame(host, o) {
  let mode = 'look', depth = null, pinned = false;
  const path = o.path.slice(1);
  host.innerHTML =
    '<a class="homebtn" href="' + esc(o.up.href) + '" aria-label="' + esc(o.up.label) + '">↑</a>' +
    '<nav class="crumbs2">' + path.map((p, i) => (i ? '<span aria-hidden="true">›</span>' : '') + (p.href ? '<a href="' + esc(p.href) + '">' + esc(p.label) + '</a>' : '<b>' + esc(p.label) + '</b>')).join('') + '</nav>' +
    (o.rail ? '<ol class="rail2" aria-label="' + esc(o.rail.label) + '"><span class="rfill"></span>' + o.rail.items.map(x => '<li><button type="button" data-rail="' + esc(x.id) + '"><span class="dot"></span><span class="nm">' + esc(x.label) + (x.size ? '<span class="sz">' + esc(sizeWords(x.size)) + '</span>' : '') + '</span></button></li>').join('') + '</ol>' : '') +
    '<div class="corner"><aside class="goal2" hidden></aside></div>' +
    '<div class="wayin" hidden><span class="wiring" aria-hidden="true"></span><div class="wibox"></div></div>' +
    '<div class="dockwrap"><p class="scale2" hidden></p><div class="modes3" role="tablist" aria-label="' + esc(t('frame.modes')) + '">' + MODES.map(m => '<button type="button" role="tab" data-mode="' + m + '" aria-selected="' + (m === mode) + '"><span class="mn">' + esc(t('frame.' + m)) + '</span><span class="mc"></span></button>').join('') + '</div>' +
    '<section class="dock" aria-live="polite"></section></div>';
  const $ = s => host.querySelector(s), dock = $('.dock');

  /* the way in, mirrored from the card onto the picture: a copy of the card's own control (same data, so the view's
     handlers answer it), without its key, kept while the card shows Do or Ask */
  const wayin = $('.wayin'), wibox = $('.wibox');
  let inKey = '', at = null;
  const mirror = () => {
    const src = dock.querySelector('[data-in]');
    if (!src) { if (mode === 'look') { wayin.hidden = true; inKey = ''; } return; }
    const name = src.dataset.inname || src.textContent.replace(/^\s*[↓↑]\s*/, '').trim(), key = src.outerHTML;
    if (key === inKey && !wayin.hidden) return; inKey = key;
    const go = src.cloneNode(false); go.className = 'wigo'; go.removeAttribute('data-key'); go.removeAttribute('data-in'); go.removeAttribute('data-inname');
    go.innerHTML = '<span class="wia" aria-hidden="true">↓</span><span class="wit"><span class="wik">' + esc(t('frame.in.k')) + '</span><b>' + esc(name) + '</b></span>';
    wibox.innerHTML = ''; wibox.appendChild(go);
    if (o.scroll) wibox.insertAdjacentHTML('beforeend', '<span class="wih">' + esc(t('frame.in.scroll')) + '</span>');
    wayin.hidden = false; place();
  };
  const place = () => {
    wayin.classList.toggle('at', !!at);
    if (!at) { wayin.style.removeProperty('--wx'); wayin.style.removeProperty('--wy'); return; }
    wayin.style.setProperty('--wx', (at.x * 100).toFixed(2) + '%'); wayin.style.setProperty('--wy', (at.y * 100).toFixed(2) + '%');
    wayin.classList.toggle('left', at.x > 0.62);
    /* where the card is below the picture (a phone, a narrow screen), a ring that would sit under it is not drawn */
    const r = wayin.getBoundingClientRect(), d = host.querySelector('.dockwrap').getBoundingClientRect(), x = r.left + at.x * r.width, y = r.top + at.y * r.height;
    wayin.classList.toggle('under', x > d.left - 28 && x < d.right + 28 && y > d.top - 28 && y < d.bottom + 28);
  };
  new MutationObserver(mirror).observe(dock, { childList: true, subtree: true });

  /* how big it is here: each level on the rail carries its rough size (SIZES in the atlas); while the view moves between
     two levels, the card says how many times closer (or farther out) the next one is. At rest the same line says the
     level's size, for a phone, where the rail is hidden (the stylesheet hides it at rest on a wider screen) */
  const items = o.rail ? o.rail.items : [], line = $('.scale2');
  let lastPos = null, heading = 0, lineKey = '';
  const scale = (at, pos) => {
    const here = items.find(x => x.id === at);
    if (pos == null || !here || !here.size) { line.hidden = true; lineKey = ''; return; }
    if (lastPos != null && Math.abs(pos - lastPos) > 1e-4) heading = pos > lastPos ? 1 : -1;
    lastPos = pos;
    const i = Math.floor(pos + 1e-6), frac = pos - i, moving = frac > 0.03 && frac < 0.97 && heading !== 0;
    let key, html;
    if (moving) {
      const a = items[heading > 0 ? i : i + 1], b = items[heading > 0 ? i + 1 : i], w = a && b && a.size && b.size ? timesWords(a.size, b.size) : '';
      if (!w) { line.hidden = true; lineKey = ''; return; }
      key = 'm' + a.id + b.id;
      html = '<span class="za" aria-hidden="true">' + (a.size > b.size ? '↓' : '↑') + '</span><b>' + esc(w) + '</b><span class="zt">' + esc(t('frame.size.at', { level: b.label, size: sizeWords(b.size) })) + '</span>';
    } else { key = 'r' + here.id; html = '<span class="zt">' + esc(t('frame.size.at', { level: here.label, size: sizeWords(here.size) })) + '</span>'; }
    line.classList.toggle('moving', moving);
    if (key !== lineKey) { lineKey = key; line.innerHTML = html; }
    line.hidden = false;
  };

  /* Do and Ask, from the atlas, for the level in view */
  const fields = () => (depth && o.fieldAt ? o.fieldAt(depth) : []);
  const counts = () => { const q = depth ? o.askAt(depth).length + fields().length : 0, c = depth ? o.doAt(depth).length : 0;
    host.querySelectorAll('.modes3 [data-mode]').forEach(b => { const n = b.dataset.mode === 'ask' ? q : b.dataset.mode === 'do' ? c : 0; b.querySelector('.mc').textContent = n ? String(n) : ''; }); };
  const fill = () => {
    host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    if (mode === 'look') return o.onLook && o.onLook();
    let h = '<p class="kicker">' + esc(t('frame.' + mode + 'At', { level: depth ? t('depth.' + depth + '.name') : '' })) + '</p>';
    if (mode === 'ask') { const ks = depth ? o.askAt(depth) : [], fs = fields();
      /* first the questions people were stuck on here, each with its shape (src/v2/field.js) */
      if (fs.length) h += '<p class="kicker">' + esc(t('field.ui.k')) + '</p><div class="fieldlist">' + fs.map(fieldLine).join('') + '</div>';
      h += ks.length ? '<div class="asklist">' + ks.map(k => '<a class="askline" href="' + esc(o.follow(k)) + '"><span class="q">' + esc(t('stop.' + k + '.q')) + '</span></a>').join('') + '</div>' : fs.length ? '' : '<p class="small muted">' + esc(t('frame.noAsk')) + '</p>';
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
    /* pos: where the view is along the items, continuously (0 = the first); else read from f */
    rail(at, f, pos) { host.querySelectorAll('[data-rail]').forEach(b => { if (b.dataset.rail === at) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); if (f != null) { const el = $('.rfill'); if (el) el.style.height = (f * 100).toFixed(1) + '%'; }
      scale(at, pos != null ? pos : f != null && o.rail ? f * (o.rail.items.length - 1) : null); },
    /* the stage of the loop a view shows is the shell's to say (the bar); kept so views need not know */
    face() {},
    /* where the thing the way in leads into stands on the picture now (0..1 across and down), or null */
    inwardAt(p) { const q = p && p.x >= 0.04 && p.x <= 0.96 && p.y >= 0.1 && p.y <= 0.92 ? p : null; if (!q && !at) return;
      if (q && at && Math.abs(q.x - at.x) < 0.002 && Math.abs(q.y - at.y) < 0.002) return; at = q; place(); },
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
