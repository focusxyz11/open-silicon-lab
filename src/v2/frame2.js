/* Frame 2 (#271; part 1 is #272): one frame, three modes, and one rule: whatever you are working on gets the stage.
   Behind ?frame=2, as ?menu=1 is for the menu (?frame=2 turns it on for this browser, ?frame=1 off again), so the
   two frames can be compared on the live site; without the flag nothing here runs and today's frame
   (src/v2/frame.js) is as it was. It wears the frame's own elements in a new way, so the views and the labs need
   not know:
   - the caption (Look): the card on the picture, bottom left: the place and the size, the level's name, one
     sentence, its question, the level's search (src/data/seek.js), and Read more and Do. The rest of the card (the
     rest of the words, what is here, the ways around) waits under Read more, in the side panel. On a phone the
     caption is the sheet: at rest the level's name and the whole question, a tap opens it.
   - the side panel (Do, Ask, Read more): the card at the right, full height, its width growing with the screen.
   - the stage (Do, with a lab that declares its instrument): the lab's instrument takes the picture area and its
     goal stands across the top of it as meters; the controls stay in the side panel; the place behind is hidden,
     and a small "where you are" where the address was leads back to Look. A lab declares the two in its own HTML,
     data-f2="instrument" and data-f2="goal" (docs/LABS.md, "Do mode"); its logic is untouched, and a challenge
     that declares nothing is played in the side panel beside the picture.
   ON: is the flag on. boot(): the class on <html> (every rule of src/styles/frame2.css hangs from it) and the
   stylesheet. attach(host, api, o, x): one frame (createFrame) worn the new way; o.caption: the view's card is a
   level's (the dive and the flights), so Look is a caption; x: { wrap, items, at(), here(), doList() } from the frame.
   - Read (#273): a question's page (#/w/<id>), the questions (#/read, #/read/<id>, #/w) and machines (#/machines)
     are a reading page in the frame, not a window over the island: a column of about 70 characters at 18.25 px,
     its picture pinned beside it on a desktop (at the left, where the stage is in Do) and first on a phone, under
     the title. The words can try the picture: a button marked data-f2try brings it into view and to the hand, and
     a part marked data-f2x="<id>" in the words lights the same mark in the picture, and back. The bar says you are
     reading and lights no stage; a way back leads to where you came from. A page says what its picture is with
     readHtml({ head, picture, text }); the shell needs no hook: each time it draws the page or the bar, boot()'s
     watchers wear them the new way (readPage, bar). */
import { t, has } from '../core/i18n.js';
import { whereOf } from '../engines/way.js';

export const ON = (() => { try { const q = new URLSearchParams(location.search).get('frame'); if (q === '1' || q === '2') localStorage.setItem('osl-frame', q); return localStorage.getItem('osl-frame') === '2'; } catch (e) { return false; } })();

let booted = false;
export function boot() {
  if (!ON || booted) return; booted = true;
  document.documentElement.classList.add('frame2');
  /* the question is set in Besley's italic, which today's frame does not load */
  for (const href of ['https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;1,400&display=swap', 'src/styles/frame2.css']) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
  /* the address you were at before you began reading: the way back. Heard before the shell's own route */
  addEventListener('hashchange', e => { const was = '#' + ((e.oldURL || '').split('#')[1] || '/'); if (READING.includes(routeOf(location.hash)) && !READING.includes(routeOf(was))) readFrom = was; });
  /* the words try the picture: a button brings it into view and to the hand */
  document.addEventListener('click', e => { const b = e.target.closest('.f2read [data-f2try]'); if (b) tryPicture(b); });
  /* a mark in the words and the same mark in the picture light together */
  const link = (e, on) => { const m = e.target.closest && e.target.closest('.f2read [data-f2x]'); if (m) lightMark(m, on); };
  document.addEventListener('pointerover', e => link(e, true)); document.addEventListener('pointerout', e => link(e, false));
  document.addEventListener('focusin', e => link(e, true)); document.addEventListener('focusout', e => link(e, false));
  /* the shell draws the page and the bar; each time it does, they are worn the new way (no hook in the shell) */
  const page = document.getElementById('page'), loop = document.getElementById('loop');
  if (page && typeof MutationObserver === 'function') new MutationObserver(() => readPage(page)).observe(page, { childList: true, subtree: true });
  if (loop && typeof MutationObserver === 'function') new MutationObserver(() => bar(loop)).observe(loop, { childList: true });
  /* a phone (#275): the bar's log beside the loop, the notices in the sheet */
  const log = document.getElementById('logbtn'), fit = () => fitBar();
  if (typeof MutationObserver === 'function') [loop, log].forEach(n => { if (n) new MutationObserver(fit).observe(n, { childList: true, subtree: true, attributes: true }); });
  addEventListener('resize', () => { fit(); notices(); }); fit();
}

/* ---- Read ---- */
const READING = ['read', 'w', 'machines'];
const routeOf = h => String(h || '').replace(/^#\/?/, '').split('/')[0] || '';
let readFrom = null;
/* is the address a reading page, in the new frame */
export const reading = (h = location.hash) => ON && READING.includes(routeOf(h));
/* the name of where an address is: its level, else its place, else the map */
const nameOf = h => { const k = routeOf(h); if (!k || k === 'home') return t('frame2.backMap');
  let W = null; try { W = whereOf(h); } catch (e) { W = null; }
  return W && W.level && has('depth.' + W.level + '.name') ? t('depth.' + W.level + '.name') : W && W.place && has('map.' + W.place + '.t') ? t('map.' + W.place + '.t') : k === 'island' ? t('map.home') : k === 'log' ? t('loop.log') : t('frame2.backMap'); };
/* a reading page: its head (kicker, title, the line under it), its picture and its words. Without a picture the
   column stands alone, in the middle */
export function readHtml(o) {
  return '<article class="f2read' + (o.picture ? '' : ' f2nopic') + (o.cls ? ' ' + o.cls : '') + '"' + (o.style ? ' style="' + esc(o.style) + '"' : '') + '>' +
    '<header class="f2rhead">' + o.head + '</header>' +
    (o.picture ? '<div class="f2pic" data-f2="picture" tabindex="-1">' + o.picture + '</div>' : '') +
    '<div class="f2col">' + o.text + '</div></article>';
}
/* a button in the words that tries the picture */
export const tryHtml = (key = 'frame2.tryHere') => '<button type="button" class="btn f2try" data-f2try><span class="f2ta" aria-hidden="true"></span>' + esc(t(key)) + '</button>';
function tryPicture(b) {
  const pic = b.closest('.f2read').querySelector('.f2pic'); if (!pic) return;
  if (phone()) pic.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  pic.classList.remove('f2lit'); void pic.offsetWidth; pic.classList.add('f2lit');
  const c = pic.querySelector('button:not([disabled]), input, select, a[href]:not([tabindex="-1"])'); (c || pic).focus({ preventScroll: true });   /* i18n-ok: a selector */
}
function lightMark(m, on) {
  const art = m.closest('.f2read'), id = m.dataset.f2x;
  art.querySelectorAll('[data-f2x="' + CSS.escape(id) + '"]').forEach(n => n.classList.toggle('f2on', on));
  /* the picture says which one: what the mark names */
  const cap = art.querySelector('[data-f2say]'); if (!cap) return;
  if (!cap.dataset.rest) cap.dataset.rest = cap.innerHTML;
  const say = on && (m.getAttribute('aria-label') || (m.querySelector('.q') || m).textContent.trim());
  cap.innerHTML = say ? esc(say) : cap.dataset.rest; cap.classList.toggle('f2said', !!say);
}
/* the page made a reading page: the way back to where you came from, and the frame's class on the page */
export function readPage(page) {
  if (!reading()) { page.classList.remove('f2rd'); return; }
  page.classList.add('f2rd');
  const inner = page.querySelector(':scope > .inner'); if (!inner) return;
  /* at the top of the words, so the picture beside them starts where it stays (a page drawn in parts gets it moved there) */
  const at = inner.querySelector('.f2rhead') || inner, was = inner.querySelector('.f2back');
  if (was) { if (was.parentNode !== at) at.prepend(was); return; }
  const to = readFrom || '#/', a = document.createElement('a'); a.className = 'f2back'; a.href = to;
  a.innerHTML = '<span class="f2wa" aria-hidden="true">←</span><span class="f2wk">' + esc(t('frame2.backK')) + '</span><b>' + esc(nameOf(to)) + '</b>';
  a.setAttribute('aria-label', t('frame2.back', { where: nameOf(to) }));
  at.prepend(a);
}
/* the bar while you read: it says so, and lights no stage (the loop still leads out to any stage) */
export function bar(loop) {
  if (!loop) return; const on = reading(), b = loop.closest('.bar'); if (b) b.classList.toggle('f2reading', on);
  if (!on || loop.querySelector(':scope > .f2rk')) return;
  loop.querySelectorAll('[aria-current]').forEach(n => n.removeAttribute('aria-current'));
  const k = document.createElement('p'); k.className = 'f2rk'; k.innerHTML = '<span class="f2ri" aria-hidden="true"></span>' + esc(t('frame2.reading')); loop.prepend(k);
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
/* the first sentence of a card's words, and the rest */
const firstSentence = s => { const m = /^([\s\S]+?[.?!])\s+(?=[A-Z0-9“‘\x22\x27(])/.exec(s); return m ? [m[1], s.slice(m[0].length)] : [s, '']; };
function phone() { return typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches; }

export function attach(host, api, o, x) {
  boot();
  const dock = api.dock, wrap = x.wrap, me = {};
  /* a view makes its frame anew in the same host each time it is shown: only the newest wears it */
  host.f2now = me; const now = () => host.f2now === me;
  let open = false;
  /* where you are, while a lab has the stage: the level on the way down, lit; a tap goes back to Look */
  const where = document.createElement('button'); where.type = 'button'; where.className = 'f2where'; where.hidden = true; host.appendChild(where);
  where.addEventListener('click', () => { open = false; api.look(); });
  let whereKey = '';
  const drawWhere = () => {
    const h = x.here(), at = x.at(), key = at + '|' + (h ? h.label : ''); if (key === whereKey) return; whereKey = key;
    where.innerHTML = '<span class="f2wa" aria-hidden="true">↑</span><span class="f2wt"><span class="f2wk">' + esc(t('frame2.where')) + '</span><b>' + esc(h ? h.label : '') + '</b>' + (h && h.size ? '<span class="f2fig">' + esc(h.size) + '</span>' : '') + '</span>' +
      (x.items.length > 1 ? '<span class="f2wl" aria-hidden="true">' + x.items.map(i => '<i' + (i.id === at ? ' class="on"' : '') + '></i>').join('') + '</span>' : '');
    where.setAttribute('aria-label', t('frame2.whereBack', { level: h ? h.label : '' }));
  };

  /* a level's card made a caption: its name and size first, one sentence, the question, the search, Read more and
     Do; the rest of the card is kept, under Read more. Done once each time the view writes its card */
  const caption = () => {
    if (dock.querySelector(':scope > .f2head')) return;
    const line = dock.querySelector(':scope > .line'), k = dock.firstElementChild; if (!line || !k) return;
    const h = x.here(), place = o.path && o.path[1] ? o.path[1].label : '';
    const head = document.createElement('div'); head.className = 'f2head';
    const size = h && h.size ? esc(t('frame2.across', { size: '\u0001' })).replace('\u0001', '<span class="f2fig">' + esc(h.size) + '</span>') : '';
    head.innerHTML = '<p class="f2k"><span>' + esc(place) + (size ? ' · ' + size : '') + '</span></p><h2 class="f2t">' + esc(h ? h.label : k.textContent) + '</h2>';
    k.classList.add('f2was'); k.after(head);
    const [one, rest] = firstSentence(line.textContent.trim());
    if (rest) { line.textContent = ''; const a = document.createElement('span'); a.className = 'f2s1'; a.textContent = one; const b = document.createElement('span'); b.className = 'f2rest'; b.textContent = ' ' + rest; line.append(a, b); }
    const more = document.createElement('div'); more.className = 'f2more';
    [...dock.children].filter(n => n !== k && n !== head && n !== line && !n.matches('.askline, .seek')).forEach(n => more.appendChild(n));
    const ds = x.doList(), c = ds.length === 1 ? ds[0] : null;
    const acts = document.createElement('div'); acts.className = 'f2acts';
    acts.innerHTML = '<button type="button" class="btn f2open" data-f2open>' + esc(t('frame2.more')) + '</button><button type="button" class="btn f2close" data-f2close>' + esc(t('frame2.less')) + '</button>' +
      (c ? '<a class="btn f2do" href="' + esc(c.href || '#/do/' + c.id) + '">' + esc(t('frame2.doOne', { what: c.title })) + '</a>' : ds.length ? '<button type="button" class="btn f2do" data-mode="do">' + esc(t('frame2.doN', { n: ds.length })) + '</button>' : '');
    dock.append(acts, more);
  };

  /* the mode, read from what the card holds: a lab with an instrument has the stage; any other challenge, a question
     followed, Do and Ask, and Read more are the side panel; a level's card at rest is the caption */
  const update = () => {
    if (!now()) return;
    const player = dock.querySelector('.player'), inst = !!(player && player.querySelector('[data-f2="instrument"]'));
    const look = !!o.caption && api.mode() === 'look' && !player && !dock.querySelector('.stopx');
    if (look) caption();
    const cap = look && !open && !!dock.querySelector(':scope > .f2head'), on = !!o.caption || inst;
    host.classList.toggle('f2', on); host.classList.toggle('f2cap', on && cap); host.classList.toggle('f2side', on && !cap); host.classList.toggle('f2stage', inst);
    host.classList.toggle('f2open', look && open);
    where.hidden = !inst; if (inst) drawWhere();
    fold(); notices();
    const els = inst ? [player.querySelector('[data-f2="goal"]'), player.querySelector('[data-f2="instrument"]')].filter(Boolean) : cap ? [wrap] : [];
    if (ro && (els.length !== watched.length || els.some((e, i) => e !== watched[i]))) { ro.disconnect(); els.forEach(e => ro.observe(e)); watched = els; }
    measure();
  };
  /* a caption tall enough to reach the levels at the side stands a little to the right, and the levels beside it
     show their dots alone, so neither covers the other */
  const tight = () => { const rl = host.querySelector(':scope > .rail2'), on = host.classList.contains('f2cap') && !!rl && !phone(), top = on ? wrap.getBoundingClientRect().top : 0;
    let any = false; if (rl) rl.querySelectorAll('li').forEach(li => { const u = on && li.getBoundingClientRect().bottom + 8 > top; li.classList.toggle('f2under', u); any = any || u; });
    host.classList.toggle('f2tight', any); };
  /* the stage's rows: the goal's height, and on a phone where the sheet begins, under the instrument */
  const measure = () => {
    if (!now()) return;
    tight();
    const player = dock.querySelector('.player'), g = player && player.querySelector('[data-f2="goal"]'), i = player && player.querySelector('[data-f2="instrument"]'); if (!i) return;
    const gh = g ? Math.round(g.getBoundingClientRect().height) : 0;
    host.style.setProperty('--f2-goalh', gh + 'px');
    /* a drawing made for the card, now the size of the stage: its words keep their size on the screen */
    const sv = i.querySelector('svg[viewBox]'), vb = sv && sv.viewBox.baseVal, r = sv && sv.getBoundingClientRect();
    if (vb && vb.width && r.width && r.height) host.style.setProperty('--f2-k', (1 / Math.min(r.width / vb.width, r.height / vb.height)).toFixed(4));
    if (phone()) host.style.setProperty('--f2-sheet', Math.round(i.getBoundingClientRect().bottom + 10) + 'px');
  };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  let watched = [];
  const fold = sheet(host, wrap, now);
  if (!host.f2notes && typeof MutationObserver === 'function') { host.f2notes = true; new MutationObserver(notices).observe(host, { childList: true }); }
  new MutationObserver(update).observe(dock, { childList: true, subtree: true, characterData: true });
  addEventListener('resize', () => { if (!host.hidden) update(); });
  host.addEventListener('click', e => {
    if (!now()) return;
    if (e.target.closest('[data-f2open]')) { open = true; update(); wrap.scrollTop = 0; return; }
    if (e.target.closest('[data-f2close]')) { open = false; update(); return; }
    if (e.target.closest('[data-mode]')) { open = false; update(); }
  });
  update();
}

/* ---- a phone (#275): the sheet at three heights, the notices in it, and the bar's log beside the loop ----
   The frame's card on a phone is a sheet (src/v2/frame.js gives it its peek and its handle). In the new frame it
   rests at three heights: the peek (the level's name and its whole question), half the screen, and the whole of it
   under the way out. A tap on the handle goes up a height (from the top, back to the peek); a drag on the handle or the
   sheet's head (or anywhere on the peek) moves it with the finger and lets it settle at the nearest height, or the
   next one the way it was flicked. A touch on the picture lets it down to the peek, as before. While a challenge is
   played it never folds to the peek; while a lab's instrument has the stage the sheet stays under it, so the
   instrument is always in sight above the controls. sheet(): one per frame, called by attach. */
const STATES = ['peek', 'half', 'full'];
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function sheet(host, wrap, now) {
  const dock = wrap.querySelector('.dock'), handle = wrap.querySelector('.peekbar');
  if (!dock || !handle) return () => {};
  let at = wrap.classList.contains('peek') ? 'peek' : 'half', drag = null, tm = 0, hold = false;
  const on = () => now() && phone() && host.classList.contains('f2') && !host.hidden;
  const busy = () => !!dock.querySelector('.player, .stopx') || dock.classList.contains('benchdock');
  const states = () => host.classList.contains('f2stage') ? ['half'] : busy() ? ['half', 'full'] : STATES;
  const classes = s => { wrap.classList.toggle('peek', s === 'peek'); host.classList.toggle('peeked', s === 'peek'); wrap.classList.toggle('f2half', s === 'half'); wrap.classList.toggle('f2full', s === 'full'); };
  const label = () => { const S = states(), up = S[(S.indexOf(at) + 1) % S.length];
    handle.setAttribute('aria-expanded', String(at !== 'peek')); handle.setAttribute('aria-label', t(up === 'full' ? 'frame2.sheetFull' : up === 'half' ? 'frame.peek.open' : 'frame.peek.fold')); handle.hidden = S.length < 2; };
  const settle = () => { clearTimeout(tm); wrap.style.transition = ''; wrap.style.top = ''; };
  /* to a height; from: where its top was, so it glides there */
  const set = (s, from) => {
    const S = states(); if (!S.includes(s)) s = S.includes('half') ? 'half' : S[0];
    if (from == null) from = wrap.offsetTop;
    settle(); at = s; if (s === 'peek') dock.scrollTop = 0; classes(s); label();
    const to = wrap.offsetTop; if (still() || Math.abs(to - from) < 2) return;
    wrap.style.transition = 'none'; wrap.style.top = from + 'px'; void wrap.offsetHeight;
    wrap.style.transition = 'top .26s cubic-bezier(.2, .8, .2, 1)'; wrap.style.top = to + 'px';
    tm = setTimeout(settle, 300);
  };
  /* the frame folds or opens the card itself (a touch on the picture, on the peek, a challenge begun): follow it */
  new MutationObserver(() => {
    if (!on() || drag) return; const p = wrap.classList.contains('peek');
    if (p && at !== 'peek') { at = 'peek'; classes('peek'); label(); }
    else if (!p && at === 'peek') { if (hold) { hold = false; classes('peek'); label(); } else set('half', host.clientHeight - 10 - wrap.offsetHeight); }
    else if (!p && !wrap.classList.contains('f2' + at)) classes(at);
  }).observe(wrap, { attributes: true, attributeFilter: ['class'] });
  /* a tap on the handle: up a height, and from the top back down. Heard before the frame's own (two heights) */
  host.addEventListener('click', e => {
    if (!on()) return;
    if (e.target.closest('.dockwrap > .peekbar')) { e.preventDefault(); e.stopPropagation(); const S = states(); return set(S[(S.indexOf(at) + 1) % S.length]); }
    /* closing a notice on the peek leaves it a peek */
    if (at === 'peek' && e.target.closest('.dockwrap > .toast, .dockwrap > .seamnote [data-seamx]')) hold = true;
  }, true);
  /* a drag: on the handle, the sheet's head, or anywhere on the peek but its controls */
  const grip = e => e.target === wrap || !!e.target.closest('.peekbar, .f2head, .dock > .kicker:first-child') || (at === 'peek' && !e.target.closest('button, a, input, select, textarea'));   /* i18n-ok: selectors */
  wrap.addEventListener('pointerdown', e => {
    if (!on() || e.button > 0 || !grip(e) || states().length < 2) return;
    drag = { id: e.pointerId, y0: e.clientY, top: wrap.offsetTop, moved: false, last: [[e.clientY, e.timeStamp]] };
  });
  wrap.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y0;
    if (!drag.moved) {
      if (Math.abs(dy) < 8) return;
      /* where each height puts the top, then the sheet follows the finger with all its words shown */
      settle(); const was = at, tops = {};
      for (const s of states()) { classes(s); tops[s] = wrap.offsetTop; }
      classes(was === 'peek' ? 'half' : was); drag.tops = tops; drag.moved = true; wrap.classList.add('f2drag');
      try { wrap.setPointerCapture(e.pointerId); } catch (x) { /* the drag still follows while over the sheet */ }
    }
    const T = drag.tops, lo = Math.min(...Object.values(T)), hi = Math.max(...Object.values(T)) + 24;
    wrap.style.top = Math.min(Math.max(drag.top + dy, lo - 12), hi) + 'px';
    drag.last.push([e.clientY, e.timeStamp]); if (drag.last.length > 5) drag.last.shift();
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; wrap.classList.remove('f2drag');
    if (!d.moved) return;
    /* the click that ends a drag is not a tap */
    const eat = ev => { ev.stopPropagation(); ev.preventDefault(); }; addEventListener('click', eat, { capture: true, once: true }); setTimeout(() => removeEventListener('click', eat, true), 350);
    const top = wrap.offsetTop, [a, b] = [d.last[0], d.last[d.last.length - 1]], v = b && a && b[1] > a[1] ? (b[0] - a[0]) / (b[1] - a[1]) : 0;
    const S = states().slice().sort((x, y) => d.tops[x] - d.tops[y]);   /* the tallest first */
    let to = S.reduce((m, s) => Math.abs(d.tops[s] - top) < Math.abs(d.tops[m] - top) ? s : m, S[0]);
    /* a flick goes on to the next height the way it went */
    if (v < -0.5) { const up = S.filter(s => d.tops[s] < top - 4); if (up.length) to = up[up.length - 1]; }
    else if (v > 0.5) { const down = S.find(s => d.tops[s] > top + 4); if (down) to = down; }
    set(to, top);
  };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  return () => { if (!on()) return; if (!states().includes(at)) set(at); else { classes(at); label(); } };
}

/* the notices (the seam note, the word that something grew) go into the sheet on a phone, at its top, and never
   over the picture; elsewhere, or with no sheet in sight, they stay where the shell put them */
const NOTES = ['.seamnote', '#toast'], NOTE = {};
export function notices() {
  const W = phone() ? [...document.querySelectorAll('.stage > section.f2:not([hidden]) > .dockwrap')].find(w => w.offsetParent) : null;
  for (const q of NOTES) {
    const n = NOTE[q] || (NOTE[q] = document.querySelector(q)); if (!n) continue;
    /* a frame made anew takes its old sheet away, and the notice in it: it goes back where the shell put it first */
    if (n.f2home && !n.isConnected) n.f2home.appendChild(n);
    if (!n.f2home) { n.f2home = n.parentNode; if (typeof MutationObserver === 'function') new MutationObserver(notices).observe(n, { attributes: true, attributeFilter: ['hidden'] }); }
    const to = W && !n.hidden ? W : n.f2home, bar = W && W.querySelector(':scope > .peekbar');
    if (to === W && W) { if (n.parentNode !== W) (bar ? bar.after(n) : W.prepend(n)); }
    else if (n.parentNode !== to) to.appendChild(n);
  }
}
/* the bar on a phone: Your log never covers the loop's dots; where there is no room for its words it is a mark */
export function fitBar() {
  const b = document.querySelector('.bar'), log = document.getElementById('logbtn'), loop = document.getElementById('loop'); if (!b || !log || !loop) return;
  b.classList.remove('f2logmark'); if (!phone()) return;
  const ol = loop.querySelector('ol'), L = (ol || loop).getBoundingClientRect(), G = log.getBoundingClientRect();
  if (L.right > G.left - 2 || loop.scrollWidth > loop.clientWidth + 1) b.classList.add('f2logmark');
}
