/* The frame (docs/SYSTEM.md §3, docs/reviews/structure.md): the one set of things every view wears around its scene.
   Two rails say where you are, one for each move: the loop in the bar (the chip's life, along: drawn by the shell)
   and the levels at the side (scale, in · out). The way out is top left, with the place's name. Everything else is
   one card at the bottom, the same on the island and in every view: its three faces Look · Do · Ask at the top, with
   how much waits behind each, and its words below, one step at a time. In Look the view writes its story or card
   there; in Do and Ask the frame fills it itself from the atlas, with the challenges and the questions that live at
   the level in view and what the community has left there, so every view has them for free.

   createFrame(host, o): o.up { href, label }, o.path [{ href, label }], o.rail { label, items: [{ id, label }] },
   o.follow(key) → address of a question, o.askAt(depth) → stop keys, o.askedAt(depth) → html of what people asked, o.fieldAt(depth) → ids of the questions from the field there,
   o.doAt(depth) → [{ id, title, where, href, open }], o.onRail(id), o.onLook().
   Returns { dock, level(depth), rail(at, fill), goal(html), mode(), look(), stop(html), inwardAt(p) }: stop() pins a
   question you are following in the card, under Ask, until you choose a face again.
   The way in is on the picture, never only in the card: whatever way deeper the view writes in its card (an element
   with data-in) is shown again as one large button over the scene, by the frame, in every view the same. A view that
   knows where the thing you would enter is on the screen says so with inwardAt({ x, y }) (0..1 of the picture), and
   the button stands beside it with a ring on it; o.scroll says the view also flies in when scrolled. */
import { t } from '../core/i18n.js';
import { TWINS } from '../data/atlas.js';
import { fieldLine } from './field.js';

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
    '<div class="wayin" hidden><span class="wiring" aria-hidden="true"></span><div class="wibox"></div></div>' +
    '<div class="wayon" hidden><div class="wobox"></div></div>' +
    '<div class="dockwrap"><button type="button" class="peekbar" aria-expanded="true" aria-label="' + esc(t('frame.peek.fold')) + '"><span aria-hidden="true"></span></button><div class="modes3" role="tablist" aria-label="' + esc(t('frame.modes')) + '">' + MODES.map(m => '<button type="button" role="tab" data-mode="' + m + '" aria-selected="' + (m === mode) + '"><span class="mn">' + esc(t('frame.' + m)) + '</span><span class="mc"></span></button>').join('') + '</div>' +
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
  };
  new MutationObserver(mirror).observe(dock, { childList: true, subtree: true });

  /* the way along, mirrored the same way: whatever next step along the view writes in its card (an element with
     data-along: the next station on the line, the next step in the studio) is shown again over the scene, at the
     picture's right edge (→), a copy that the view's own handlers answer */
  const wayon = $('.wayon'), wobox = $('.wobox');
  let onKey = '';
  const mirrorOn = () => {
    const src = dock.querySelector('[data-along]');
    if (!src) { if (mode === 'look') { wayon.hidden = true; onKey = ''; } return; }
    const key = src.outerHTML; if (key === onKey && !wayon.hidden) return; onKey = key;
    const name = src.dataset.alongname || src.textContent.replace(/^\s*[←→↓↑]\s*/, '').trim();
    const go = src.cloneNode(false); go.className = 'wogo'; ['data-key', 'data-along', 'data-alongname', 'data-in', 'data-inname'].forEach(a => go.removeAttribute(a));
    go.innerHTML = '<span class="wit"><span class="wik">' + esc(t('frame.along.k')) + '</span><b>' + esc(name) + '</b></span><span class="woa" aria-hidden="true">→</span>';
    wobox.innerHTML = ''; wobox.appendChild(go); wayon.hidden = false;
  };
  new MutationObserver(mirrorOn).observe(dock, { childList: true, subtree: true });

  /* on a phone the card rests as a peek (the level's name and its question) and steps aside for the picture: a touch
     on it slides it up, a touch on the picture lets it down again. The picture is framed for the peek, so it never
     jumps when the card opens over it (restH). A challenge or a question being followed keeps it open. Not on a
     desktop or a tablet: there the card is as it was */
  const wrap = $('.dockwrap'), bar = $('.peekbar'), phone = () => matchMedia('(max-width: 720px)').matches;
  let restH = 0;
  const peek = v => { const on = !!v && phone(); if (on) wrap.scrollTop = 0; wrap.classList.toggle('peek', on); host.classList.toggle('peeked', on); bar.setAttribute('aria-expanded', String(!on)); bar.setAttribute('aria-label', t(on ? 'frame.peek.open' : 'frame.peek.fold')); };
  const busy = () => !!dock.querySelector('.player, .stopx') || dock.classList.contains('benchdock');
  peek(true);
  new ResizeObserver(() => { const h = wrap.offsetHeight; if (!h) return; host.style.setProperty('--dockh', h + 'px'); if (wrap.classList.contains('peek')) restH = h; }).observe(wrap);
  new MutationObserver(() => { if (busy() && wrap.classList.contains('peek')) peek(false); }).observe(dock, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  /* a touch on the peek opens it: on its name or its question it does nothing else (a control reached under the fold,
     by the keyboard, still acts); the bar folds it again */
  wrap.addEventListener('click', e => {
    if (e.target.closest('.peekbar')) { e.preventDefault(); e.stopPropagation(); return peek(!wrap.classList.contains('peek') && !busy()); }
    if (!wrap.classList.contains('peek')) return;
    const act = e.target.closest('button, a, input, select, textarea'); peek(false);   /* i18n-ok */
    if (!act || act.classList.contains('askline')) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  /* reached by the keyboard, the card opens */
  wrap.addEventListener('focusin', e => { if (wrap.classList.contains('peek') && !e.target.closest('.peekbar') && e.target.matches(':focus-visible')) peek(false); });
  /* a touch on the picture (the canvas or the names on it) lets the card down. One listener per stage, for the frame shown now */
  const stage = host.parentNode;
  if (stage && !stage.dataset.peekOn) { stage.dataset.peekOn = '1';
    stage.addEventListener('pointerdown', e => { const f = [...stage.querySelectorAll(':scope > section')].find(x => !x.hidden && x.querySelector(':scope > .dockwrap'));
      if (f && f.peekDown && e.target.closest('canvas, .labels') && !e.target.closest('button, a')) f.peekDown(); }, true); }   /* i18n-ok */
  host.peekDown = () => { if (!busy()) peek(true); };

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
    rail(at, f) { host.querySelectorAll('[data-rail]').forEach(b => { if (b.dataset.rail === at) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); if (f != null) { const el = $('.rfill'); if (el) el.style.height = (f * 100).toFixed(1) + '%'; } },
    /* the stage of the loop a view shows is the shell's to say (the bar); kept so views need not know */
    face() {},
    /* where the thing the way in leads into stands on the picture now (0..1 across and down), or null */
    inwardAt(p) { const q = p && p.x >= 0.04 && p.x <= 0.96 && p.y >= 0.1 && p.y <= 0.92 ? p : null; if (!q && !at) return; at = q; place(); },
    goal(html) { const g = $('.goal2'); g.hidden = !html; if (html) g.innerHTML = html; },
    mode() { return mode; },
    look() { mode = 'look'; pinned = false; fill(); },
    /* a challenge being played in the card: its face is Do, and it stays while the level changes beneath it */
    /* the height of the card at rest (on a phone, the peek): what the picture is framed above */
    restH() { return phone() && restH ? restH : wrap.offsetHeight; },
    doing() { mode = 'do'; pinned = true; host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === 'do'))); },
    /* a question being followed: shown under Ask, and kept while the level changes beneath it */
    stop(html) { mode = 'ask'; pinned = true; host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === 'ask'))); dock.innerHTML = html; dock.classList.remove('locked'); }
  };
}
export { TWINS };
