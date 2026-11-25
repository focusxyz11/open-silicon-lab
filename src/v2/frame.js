/* The frame (docs/SYSTEM.md §3, docs/reviews/structure.md): the one set of things every view wears around its scene.
   Two rails say where you are, one for each move: the loop in the bar (the chip's life, along: drawn by the shell)
   and the levels at the side (scale, in · out). The way out is top left, with the place's name. Everything else is
   one card at the bottom, the same on the island and in every view: its three faces Look · Do · Ask at the top, with
   how much waits behind each, and its words below, one step at a time. In Look the view writes its story or card
   there; in Do and Ask the frame fills it itself from the atlas, with the challenges and the questions that live at
   the level in view and what the community has left there, so every view has them for free.

   createFrame(host, o): o.up { href, label }, o.path [{ href, label }], o.rail { label, items: [{ id, label, size }], optional } (size: metres across, sizeOf in the atlas;
   optional: the rail is absent while the view is at none of its items),
   o.steps { label, items: [{ id, label }] } with o.onStep(id): a row of steps, walked along (the studio, the factory's line),
   drawn as one line from left to right across the top of the picture (on a phone, a strip: the step, ← → and a count),
   o.follow(key) → address of a question, o.askAt(depth) → stop keys, o.askedAt(depth) → html of what people asked, o.fieldAt(depth) → ids of the questions from the field there,
   o.doAt(depth) → [{ id, title, where, href, open }], o.onRail(id), o.onLook(), o.fidAt(level) → html of the mark of how true the
   level's picture is (src/v2/fid.js), shown in the caption beside its name.
   The questions under Ask are lenses (src/engines/frame.js): o.lensesAt(depth) → [{ id, label, hint, icon }] (the ones
   that live at the level, by short name only), o.lensCard(id, depth) → html of the one chosen (the question alone, its
   form here, what to play here, the question it meets, the way on), o.onLens(id | null, depth) → the view lights on
   its picture what the lens is about. Without lenses at a level, Ask lists the level's questions as before.
   Returns { dock, level(depth), rail(at, fill, pos), steps(at), goal(html), mode(), look(), stop(html), inwardAt(p) }: stop() pins a
   question you are following in the card, under Ask, until you choose a face again.
   The way in is on the picture, never only in the card: whatever way deeper the view writes in its card (an element
   with data-in) is shown again as one large button over the scene, by the frame, in every view the same. A view that
   knows where the thing you would enter is on the screen says so with inwardAt({ x, y }) (0..1 of the picture), and
   the button stands beside it with a ring on it (in the flight, the dive, the chip's layers and the board alike; where
   the card is below the picture, the ring alone, unless the card would cover it); o.scroll says the view also flies in
   when scrolled. How big it is here: the rail says each level's rough size, and while the view moves (rail's pos, the
   place along the items, between two of them) the card says how many times closer the next level is. */
import { phone } from '../core/ui.js';
import { esc } from '../core/esc.js';
import { t, fmtNum } from '../core/i18n.js';
import { TWINS } from '../data/atlas.js';
import { fieldLine } from './field.js';
import { attach as frame2 } from './frame2.js';

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
export const MODES = ['look', 'do', 'ask'];
/* the row of steps: one component in every row of steps. On a wide screen every step is named, left to right, joined
   by one line; on a phone only the step you are at shows, between ← and →, with how far along it is */
function stepsHtml(st) {
  return '<nav class="steps2" style="--stn:' + st.items.length + '" aria-label="' + esc(st.label) + '"><button type="button" class="stgo" data-stepgo="-1" aria-label="' + esc(t('frame.steps.prev')) + '">←</button>' +
    '<ol class="stl"><span class="stfill" aria-hidden="true"></span>' + st.items.map(x => '<li><button type="button" data-step="' + esc(x.id) + '"><span class="sd" aria-hidden="true"></span><span class="sn">' + esc(x.label) + '</span></button></li>').join('') + '</ol>' +
    '<span class="stc" aria-hidden="true"><b class="stn"></b><span class="stk"></span></span>' +
    '<button type="button" class="stgo" data-stepgo="1" aria-label="' + esc(t('frame.steps.next')) + '">→</button></nav>';
}
export const FACES = ['designed', 'made', 'used'];
/* one life per host (#366): a view makes its frame anew in the same host each time it is shown, so whatever the frame,
   its modes (frame2.js) and the switches on it (listen.js) listen to or watch lives as long as that frame and ends
   when the next one is made: one set of listeners on a host, however often it is visited. lifeOf(host) is the life of
   the frame now on it; lifeOf(host, true) ends it and begins the next. A life gives a signal for addEventListener
   and keeps the observers it is handed (watch), to disconnect them at its end */
const LIVES = new WeakMap();
export function lifeOf(host, anew) {
  let L = LIVES.get(host);
  if (L && !anew) return L;
  if (L) L.end();
  const ac = new AbortController(), obs = [];
  L = { signal: ac.signal, ended: () => ac.signal.aborted, watch: ob => { obs.push(ob); return ob; }, end: () => { ac.abort(); obs.splice(0).forEach(ob => ob.disconnect()); } };
  LIVES.set(host, L); return L;
}

export function createFrame(host, o) {
  let mode = 'look', depth = null, pinned = false, railAt = null, lens = null, down = null, pair = null;
  const life = lifeOf(host, true), alive = { signal: life.signal }, watch = life.watch;
  const path = o.path.slice(1);
  host.innerHTML =
    '<a class="homebtn" href="' + esc(o.up.href) + '" aria-label="' + esc(o.up.label) + '">↑</a>' +
    '<nav class="crumbs2">' + path.map((p, i) => (i ? '<span aria-hidden="true">›</span>' : '') + (p.href ? '<a href="' + esc(p.href) + '">' + esc(p.label) + '</a>' : '<b>' + esc(p.label) + '</b>')).join('') + '</nav>' +
    (o.rail ? '<ol class="rail2" aria-label="' + esc(o.rail.label) + '"><span class="rfill"></span>' + o.rail.items.map(x => '<li><button type="button" data-rail="' + esc(x.id) + '"><span class="dot"></span><span class="nm">' + esc(x.label) + (x.size ? '<span class="sz">' + esc(sizeWords(x.size)) + '</span>' : '') + '</span></button></li>').join('') + '</ol>' : '') +
    (o.steps ? stepsHtml(o.steps) : '') +
    '<div class="corner"><aside class="goal2" hidden></aside></div>' +
    '<div class="wayin" hidden><span class="wiring" aria-hidden="true"></span><div class="wibox"></div></div>' +
    '<div class="wayon" hidden><div class="wobox"></div></div>' +
    '<div class="marks3"></div>' +
    '<div class="dockwrap"><p class="scale2" hidden></p><button type="button" class="peekbar" aria-expanded="true" aria-label="' + esc(t('frame.peek.fold')) + '"><span aria-hidden="true"></span></button><div class="modes3" role="tablist" aria-label="' + esc(t('frame.modes')) + '">' + MODES.map(m => '<button type="button" role="tab" data-mode="' + m + '" aria-selected="' + (m === mode) + '"><span class="mn">' + esc(t('frame.' + m)) + '</span><span class="mc"></span></button>').join('') + '</div>' +
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
  watch(new MutationObserver(mirror)).observe(dock, { childList: true, subtree: true });

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
  watch(new MutationObserver(mirrorOn)).observe(dock, { childList: true, subtree: true });

  /* on a phone the card rests as a peek (the level's name and its question) and steps aside for the picture: a touch
     on it slides it up, a touch on the picture lets it down again. The picture is framed for the peek, so it never
     jumps when the card opens over it (restH). A challenge or a question being followed keeps it open. Not on a
     desktop or a tablet: there the card is as it was */
  const wrap = $('.dockwrap'), bar = $('.peekbar');
  let restH = 0;
  const peek = v => { const on = !!v && phone(); if (on) wrap.scrollTop = 0; wrap.classList.toggle('peek', on); host.classList.toggle('peeked', on); bar.setAttribute('aria-expanded', String(!on)); bar.setAttribute('aria-label', t(on ? 'frame.peek.open' : 'frame.peek.fold')); };
  const busy = () => !!dock.querySelector('.player, .stopx') || dock.classList.contains('benchdock');
  peek(true);
  watch(new ResizeObserver(() => { const h = wrap.offsetHeight; if (!h) return; host.style.setProperty('--dockh', h + 'px'); if (wrap.classList.contains('peek')) restH = h; })).observe(wrap);
  watch(new MutationObserver(() => { if (busy() && wrap.classList.contains('peek')) peek(false); })).observe(dock, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  /* a touch on the peek opens it: on its name or its question it does nothing else (a control reached under the fold,
     by the keyboard, still acts); the bar folds it again */
  wrap.addEventListener('click', e => {
    if (e.target.closest('.peekbar')) { e.preventDefault(); e.stopPropagation(); return peek(!wrap.classList.contains('peek') && !busy()); }
    if (!wrap.classList.contains('peek')) return;
    const act = e.target.closest('button, a, input, select, textarea'); peek(false);   /* i18n-ok */
    if (!act || act.classList.contains('askline')) { e.preventDefault(); e.stopPropagation(); }
  }, { capture: true, signal: life.signal });
  /* reached by the keyboard, the card opens */
  wrap.addEventListener('focusin', e => { if (wrap.classList.contains('peek') && !e.target.closest('.peekbar') && e.target.matches(':focus-visible')) peek(false); }, alive);
  /* a touch on the picture (the canvas or the names on it) lets the card down. One listener per stage, for the frame shown now */
  const stage = host.parentNode;
  if (stage && !stage.dataset.peekOn) { stage.dataset.peekOn = '1';
    stage.addEventListener('pointerdown', e => { const f = [...stage.querySelectorAll(':scope > section')].find(x => !x.hidden && x.querySelector(':scope > .dockwrap'));
      if (f && f.peekDown && e.target.closest('canvas, .labels') && !e.target.closest('button, a')) f.peekDown(); }, true); }   /* i18n-ok */
  host.peekDown = () => { if (!busy()) peek(true); };

  /* Do and Ask, from the atlas, for the level in view */
  const fields = () => (depth && o.fieldAt ? o.fieldAt(depth) : []);
  const lenses = () => (depth && o.lensesAt ? o.lensesAt(depth) : []);
  const counts = () => { const q = depth ? (lenses().length || o.askAt(depth).length) + fields().length : 0, c = depth ? o.doAt(depth).length : 0;
    host.querySelectorAll('.modes3 [data-mode]').forEach(b => { const n = b.dataset.mode === 'ask' ? q : b.dataset.mode === 'do' ? c : 0; b.querySelector('.mc').textContent = n ? String(n) : ''; }); };
  /* the marks: each core question that lives here, met beside the part of the picture it is about (MARKS in
     src/data/frame.js, found by the part's one name, data-word, on the view's own labels). The three strongest while you
     look, every one with Ask open, none while a challenge has the card; with a lens open the others dim, and a tap on
     one opens it alone (or switches to it). They follow the picture as it moves, and stand aside from the way in and
     the card */
  const marksEl = $('.marks3'); let markKey = '', markRaf = 0;
  const markList = () => (!depth || !o.marksAt || mode === 'do' ? [] : o.marksAt(depth).slice(0, mode === 'ask' ? 6 : 3));
  const drawMarks = () => {
    const M = markList(), open = mode === 'ask' ? lens : null, held = id => id === open || (!!open && id === pair), key = M.map(m => m.id + ':' + m.word).join() + '|' + open + '|' + pair;
    if (key !== markKey) { markKey = key;
      marksEl.innerHTML = M.map(m => '<button type="button" class="mark3' + (open ? (held(m.id) ? ' on' : ' dim') : '') + '" data-lens="' + esc(m.id) + '" data-mword="' + esc(m.word || '') + '" aria-pressed="' + held(m.id) + '" aria-label="' + esc(t('frame.mark.aria', { q: m.label })) + '" hidden>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + esc(m.icon) + '"/></svg><span class="tip">' + esc(m.label) + '</span></button>').join(''); }
    cancelAnimationFrame(markRaf); if (M.length) markRaf = requestAnimationFrame(trackMarks);
  };
  const shown = el => el.offsetParent && el.style.opacity !== '0' && !el.closest('[hidden]') && (el.parentNode.style || {}).visibility !== 'hidden';
  const clash = (x, y, r) => r && x > r.left - 24 && x < r.right + 24 && y > r.top - 24 && y < r.bottom + 24;
  function trackMarks() {
    /* the view stepped aside: the marks wait for it; a frame made anew in the same host ends this one's loop */
    if (life.ended() || !host.isConnected || host.hidden || !host.offsetParent) return;
    markRaf = requestAnimationFrame(trackMarks);
    const B = marksEl.getBoundingClientRect(), stage = host.parentNode;
    const names = [...stage.querySelectorAll('[data-word]')].filter(el => !el.classList.contains('mark3') && shown(el));
    /* the frame's own things stay clear: the way in, the card, the rails, the path and the goal */
    const busy = [!wayin.hidden ? wibox.getBoundingClientRect() : null].concat([...host.querySelectorAll(':scope>:is(.dockwrap,.rail2,.steps2,.crumbs2,.homebtn),.goal2:not([hidden])')].map(el => el.getBoundingClientRect())), by = new Map();
    const placed = [], lone = [], nameR = names.map(n => n.getBoundingClientRect()), onName = ([x, y]) => nameR.some(R => x > R.left - 15 && x < R.right + 15 && y > R.top - 15 && y < R.bottom + 15);
    for (const b of marksEl.children) {
      /* beside its own part's name; where this view does not name that part, beside one it names that has no mark yet */
      const el = names.find(n => n.dataset.word === b.dataset.mword) || names.find(n => !by.has(n));
      if (!el) { lone.push(b); continue; }
      by.set(el, (by.get(el) || 0) + 1);
      /* around the name: before it, after it, above, below, then a step further out; the first spot clear of the frame,
         the picture's edge and the other marks */
      const r = el.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      const spots = [[r.left - 22, cy], [r.right + 22, cy], [cx, r.top - 22], [cx, r.bottom + 22], [r.left - 62, cy], [r.right + 62, cy]],
        free = ([x, y]) => x > B.left + 18 && x < B.right - 18 && y > B.top + 18 && y < B.bottom - 18 && !busy.some(R => clash(x, y, R)) && !placed.some(([px, py]) => Math.abs(px - x) < 38 && Math.abs(py - y) < 38);
      /* clear of every name on the picture too where it can be (#326: a mark sat on the end of a name), else as before */
      const spot = spots.find(p => free(p) && !onName(p)) || spots.find(free);
      if (!spot) { b.hidden = true; continue; }
      placed.push(spot);
      b.hidden = false; b.style.transform = 'translate(' + (spot[0] - B.left).toFixed(1) + 'px,' + (spot[1] - B.top).toFixed(1) + 'px) translate(-50%,-50%)';
    }
    /* a view that names no part (a row of corners, a layer) still carries its marks: in a row across the top of the
       picture, clear of the frame */
    let k = 0;
    for (const b of lone) {
      let spot = null;
      for (; !spot && k < 24; k++) { const x = B.left + B.width / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 44, y = B.top + 110;
        if (x > B.left + 18 && x < B.right - 18 && !busy.some(R => clash(x, y, R)) && !placed.some(([px, py]) => Math.abs(px - x) < 38 && Math.abs(py - y) < 38)) spot = [x, y]; }
      if (!spot) { b.hidden = true; continue; }
      placed.push(spot); b.hidden = false; b.style.transform = 'translate(' + (spot[0] - B.left).toFixed(1) + 'px,' + (spot[1] - B.top).toFixed(1) + 'px) translate(-50%,-50%)';
    }
  }
  const fill = () => {
    host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    /* a lens held repaints the picture: the way in steps aside so it covers none of the paint (its card has ↓ and ↑) */
    host.classList.toggle('lensing', mode === 'ask' && !!lens);
    drawMarks();
    if (mode !== 'ask' && o.onLens) o.onLens(null, depth);
    if (mode === 'look') return o.onLook && o.onLook();
    let h = '<p class="kicker">' + esc(t('frame.' + mode + 'At', { level: depth ? t('depth.' + depth + '.name') : '' })) + '</p>';
    if (mode === 'ask') { const ks = depth ? o.askAt(depth) : [], fs = fields(), L = lenses();
      /* the core questions that live here are met on the picture, by their marks (docs/FRAME13.md): never a row of their
         names. A lens opened from its mark is shown alone, with the way to put it down */
      /* a lens kept on while moving level stays where it lives there too; where it does not, it is put down, saying so */
      if (lens && !L.some(l => l.id === lens)) { down = { q: lens, at: depth }; lens = pair && L.some(l => l.id === pair) ? pair : null; pair = null; }
      if (pair && !L.some(l => l.id === pair)) { down = { q: pair, at: depth }; pair = null; }
      host.classList.toggle('lensing', !!lens);
      if (down && down.at === depth && !lens) h += '<p class="qldown">' + esc(t('frame.lens.down', { q: t('frame.q.' + down.q), level: t('depth.' + depth + '.name') })) + '</p>';
      if (L.length) {
        const l = lens && L.find(x => x.id === lens), l2 = pair && L.find(x => x.id === pair);
        /* two held: where they meet, in its own card, with the way to put either down (#315) */
        if (l && l2 && o.pairCard) h += '<p class="kicker qlk">' + [l, l2].map(x => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + esc(x.icon) + '"/></svg>' + esc(x.label)).join(' <span aria-hidden="true">×</span> ') + '</p>' + o.pairCard(lens, pair, depth) +
          '<div class="qlputs">' + [l, l2].map(x => '<button type="button" class="btn ghost qloff" data-putdown="' + esc(x.id) + '">' + esc(t('frame.pair.putdown', { q: x.label })) + '</button>').join('') + '</div>';
        else h += l ? '<p class="kicker qlk"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + esc(l.icon) + '"/></svg>' + esc(l.label) + '</p>' + o.lensCard(lens, depth) +
          '<button type="button" class="btn ghost qloff" data-lensoff>' + esc(t('frame.lens.off')) + '</button>'
          : '<p class="qlsay">' + esc(t('frame.marks.say')) + '</p>'; }
      /* then the questions people were stuck on here, each with its shape (src/v2/field.js) */
      if (fs.length) h += '<p class="kicker">' + esc(t('field.ui.k')) + '</p><div class="fieldlist">' + fs.map(fieldLine).join('') + '</div>';
      if (!L.length) h += ks.length ? '<div class="asklist">' + ks.map(k => '<a class="askline" href="' + esc(o.follow(k)) + '"><span class="q">' + esc(t('stop.' + k + '.q')) + '</span></a>').join('') + '</div>' : fs.length ? '' : '<p class="small muted">' + esc(t('frame.noAsk')) + '</p>';
      /* what people and agents have asked at this level: the commons' trace, on the thing itself */
      h += depth && o.askedAt ? o.askedAt(depth) : ''; }
    else { const cs = depth ? o.doAt(depth) : []; h += cs.length ? '<div class="dolist">' + cs.map(c => '<a class="dochip' + (c.open ? ' open' : '') + '" href="' + esc(c.href || '#/do/' + c.id) + '">' + (c.open ? '<span class="kicker">' + esc(t('trail.open')) + '</span>' : '') + '<b>' + esc(c.title) + '</b><span class="small muted">' + esc(c.where) + '</span></a>').join('') + '</div>' : '<p class="small muted">' + esc(t('frame.noDo')) + '</p>'; }
    h += '<div class="nav"><button type="button" class="btn ghost" data-mode="look">' + esc(t('frame.backToLook')) + '</button></div>';
    dock.innerHTML = h; dock.classList.remove('locked');
    if (mode === 'ask' && o.onLens) o.onLens(lenses().length ? lens : null, depth, lenses().length && lens ? pair : null);
  };
  host.addEventListener('click', e => {
    const m = e.target.closest('[data-mode]'); if (m) { mode = m.dataset.mode; pinned = false; return fill(); }
    const ln = e.target.closest('[data-lens]'); if (ln) { lens = ln.dataset.lens; pair = null; mode = 'ask'; pinned = false; return fill(); }
    if (e.target.closest('[data-lensoff]')) { lens = null; pair = null; pinned = false; return fill(); }
    /* hold a second lens with the one open, or put either down */
    const hd = e.target.closest('[data-hold]'); if (hd && lens && hd.dataset.hold !== lens) { pair = hd.dataset.hold; mode = 'ask'; pinned = false; return fill(); }
    const pd = e.target.closest('[data-putdown]'); if (pd) { if (pd.dataset.putdown === lens) lens = pair; pair = null; pinned = false; return fill(); }
    const r = e.target.closest('[data-rail]'); if (r) return o.onRail && o.onRail(r.dataset.rail);
    const st = e.target.closest('[data-step]'); if (st) return o.onStep && o.onStep(st.dataset.step);
    const sg = e.target.closest('[data-stepgo]'); if (sg && o.steps) { const S = o.steps.items, i = S.findIndex(x => x.id === stepAt) + +sg.dataset.stepgo; if (S[i] && o.onStep) o.onStep(S[i].id); }
  }, alive);
  /* the row of steps: the one you are at lit, the ones before it marked done, the line filled up to it */
  let stepAt = null;
  const markSteps = at => { if (!o.steps) return; stepAt = at; const S = o.steps.items, i = S.findIndex(x => x.id === at), nav = $('.steps2');
    nav.querySelectorAll('[data-step]').forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('done', i >= 0 && k < i); });
    nav.style.setProperty('--stf', i >= 0 && S.length > 1 ? (i / (S.length - 1)).toFixed(4) : '0');
    nav.querySelector('.stn').textContent = i >= 0 ? S[i].label : ''; nav.querySelector('.stk').textContent = i >= 0 ? t('frame.steps.of', { n: i + 1, total: S.length }) : '';
    nav.querySelector('[data-stepgo="-1"]').disabled = i <= 0; nav.querySelector('[data-stepgo="1"]').disabled = i < 0 || i >= S.length - 1; };
  const api = {
    dock,
    /* the level in view: Do and Ask follow it, and so does the Turn */
    level(d) { depth = d; counts(); if (mode !== 'look' && !pinned) fill(); else drawMarks(); },
    /* the rail: which item is here, and how far along (0..1) */
    /* pos: where the view is along the items, continuously (0 = the first); else read from f */
    rail(at, f, pos) { railAt = at; if (o.rail && o.rail.optional) { const el = $('.rail2'); if (el) el.hidden = !items.some(x => x.id === at); } host.querySelectorAll('[data-rail]').forEach(b => { if (b.dataset.rail === at) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); if (f != null) { const el = $('.rfill'); if (el) el.style.height = (f * 100).toFixed(1) + '%'; }
      scale(at, pos != null ? pos : f != null && o.rail ? f * (o.rail.items.length - 1) : null); },
    /* the step you are at, in a row of steps */
    steps(at) { markSteps(at); },
    /* the stage of the loop a view shows is the shell's to say (the bar); kept so views need not know */
    face() {},
    /* where the thing the way in leads into stands on the picture now (0..1 across and down), or null */
    inwardAt(p) { const q = p && p.x >= 0.04 && p.x <= 0.96 && p.y >= 0.1 && p.y <= 0.92 ? p : null; if (!q && !at) return;
      if (q && at && Math.abs(q.x - at.x) < 0.002 && Math.abs(q.y - at.y) < 0.002) return; at = q; place(); },
    goal(html) { const g = $('.goal2'); g.hidden = !html; if (html) g.innerHTML = html; },
    mode() { return mode; },
    /* the lens chosen under Ask, or null */
    lens() { return mode === 'ask' ? lens : null; },
    look() { mode = 'look'; pinned = false; fill(); },
    /* a challenge being played in the card: its face is Do, and it stays while the level changes beneath it */
    /* the height of the card at rest (on a phone, the peek): what the picture is framed above */
    restH() { return phone() && restH ? restH : wrap.offsetHeight; },
    doing() { mode = 'do'; pinned = true; host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === 'do'))); drawMarks(); },
    /* a question being followed: shown under Ask, and kept while the level changes beneath it */
    stop(html) { mode = 'ask'; pinned = true; host.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === 'ask'))); dock.innerHTML = html; dock.classList.remove('locked'); drawMarks(); }
  };
  /* the frame worn as a caption, a side panel and a stage (src/v2/frame2.js, #271) */
  frame2(host, api, o, { wrap, items, life, at: () => railAt, step: () => (o.steps && stepAt ? (o.steps.items.find(x => x.id === stepAt) || {}).label || '' : ''), doList: () => (depth && o.doAt ? o.doAt(depth) : []),
    here: () => { const it = items.find(i => i.id === railAt); return it ? { label: it.label, size: it.size ? sizeWords(it.size) : '', fid: o.fidAt ? o.fidAt(it.id) : '' } : null; } });
  return api;
}
export { TWINS };
