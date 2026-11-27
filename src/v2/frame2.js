/* The frame (#271): one frame, three modes, and one rule: whatever you are working on gets the stage. It is the
   site's only frame since #276 (the frame before it is kept on the branch claude/before-frame2-2026-11). It wears
   the frame's own elements (src/v2/frame.js) in its own way, so the views and the labs need not know:
   - the caption (Look): the card on the picture, bottom left: the place and the size, the level's name (or the step's,
     in a row of steps), one sentence, its question, the level's search (src/data/seek.js), and Read more and Do. The
     rest of the card (the rest of the words, what is here, the ways around) waits under Read more, in the side panel.
     On a phone the caption is the sheet: at rest the level's name and the whole question, a tap opens it.
   - the side panel (Do, Ask, Read more, a card that is not a level's): the card at the right, full height, its width
     growing with the screen. The island's sheet and Break it are worn as the same panel (src/styles/frame.css).
   - the stage (Do, with a lab that declares its instrument): the lab's instrument takes the picture area and its
     goal stands across the top of it as meters; the controls stay in the side panel; the place behind is hidden,
     and a small "where you are" where the address was leads back to Look. A lab declares the two in its own HTML,
     data-f2="instrument" and data-f2="goal" (docs/LABS.md, "Do mode"); its logic is untouched, and a challenge
     that declares nothing is played in the side panel beside the picture.
   ?frame=1 and ?frame=2 (when the two frames were compared on the live site) change nothing now, and the choice an
   earlier visit kept is forgotten. boot(): the class on <html> (the rules of src/styles/frame.css hang from it;
   index.html sets it and loads the stylesheet before the first paint) and the watchers. attach(host, api, o, x): one
   frame (createFrame) worn this way; o.caption: the view's card is a level's or a step's, so Look is a caption
   ('plain': a story told step by step, the caption as it is, with its own way on); x: { wrap, items, at(), here(),
   step(), doList() } from the frame.
   - Read (#273): a question's page (#/w/<id>), the questions (#/read, #/read/<id>, #/w), machines (#/machines) and
     your log (#/log) are a reading page in the frame, not a window over the island: a column of about 70 characters
     at 18.25 px, its picture pinned beside it on a desktop (at the left, where the stage is in Do) and first on a
     phone, under the title. The words can try the picture: a button marked data-f2try brings it into view and to the
     hand, and a part marked data-f2x="<id>" in the words lights the same mark in the picture, and back. The bar says
     you are reading and lights no stage; a way back leads to where you came from. A page says what its picture is with
     readHtml({ head, picture, text }); the shell needs no hook: each time it draws the page or the bar, boot()'s
     watchers wear them the new way (readPage, bar). */
import { still, phone } from '../core/ui.js';
import { esc } from '../core/esc.js';
import { t, has } from '../core/i18n.js';
import { whereOf, LOG_PAGES } from '../engines/way.js';
import { challengeOf } from './loop.js';

let booted = false;
export function boot() {
  if (booted) return; booted = true;
  /* the address you were at before you began reading: the way back; a page opened from your log leads back to it.
     Heard before the shell's own route */
  addEventListener('hashchange', e => { const was = '#' + ((e.oldURL || '').split('#')[1] || '/'), r = routeOf(location.hash), w = routeOf(was);
    if (READING.includes(r) && !READING.includes(w)) readFrom = was;
    logBack = READING.includes(r) && !LOGS.includes(r) && LOGS.includes(w); });
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
  /* a sheet or a font that arrives later changes how wide the loop is: the bar is fitted again (#380) */
  document.addEventListener('load', e => { if (e.target && e.target.tagName === 'LINK') fit(); }, true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  /* Do: a challenge played in the island's sheet gets the stage too (doSheet, below) */
  const sheet = document.getElementById('sheet');
  if (sheet && typeof MutationObserver === 'function') { const go = () => doSheet(sheet); new MutationObserver(go).observe(sheet, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] }); addEventListener('resize', go); }
}

/* ---- Read ---- */
const LOGS = LOG_PAGES, READING = ['read', 'w', 'machines', ...LOGS];
/* pages that are places of their own: read as a page (the whole screen, the way back), named in the bar by their place */
const PLACE_PAGES = { machines: 'map.lab.t' };
const routeOf = h => String(h || '').replace(/^#\/?/, '').split('/')[0] || '';
let readFrom = null, logBack = false;
/* is the address a reading page */
export const reading = (h = location.hash) => READING.includes(routeOf(h));
/* where the way back from a reading page leads: where you were before you began reading, the map (#/log) for a page
   opened from it or from the address, and the first page for the map itself, so it never names the page you are on */
export const backOf = (h, from, fromLog) => (fromLog ? '#/log' : from || (LOGS.includes(routeOf(h)) ? '#/' : '#/log'));
/* the name of where an address is: its level, else its place, else the map */
export const nameOf = h => { const k = routeOf(h); if (!k || k === 'home' || k === 'hold') return t('frame2.backFirst'); if (k === 'log') return t('frame2.backMap');
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
  if (phone()) pic.scrollIntoView({ block: 'start', behavior: still() ? 'auto' : 'smooth' });
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
function readPage(page) {
  if (!reading()) { page.classList.remove('f2rd'); return; }
  page.classList.add('f2rd');
  const inner = page.querySelector(':scope > .inner'); if (!inner) return;
  /* at the top of the words, so the picture beside them starts where it stays (a page drawn in parts gets it moved there) */
  const at = inner.querySelector('.f2rhead') || inner, was = inner.querySelector('.f2back');
  if (was) { if (was.parentNode !== at) at.prepend(was); return; }
  const to = backOf(location.hash, readFrom, logBack), a = document.createElement('a'); a.className = 'f2back'; a.href = to;
  a.innerHTML = '<span class="f2wa" aria-hidden="true">←</span><span class="f2wk">' + esc(t('frame2.backK')) + '</span><b>' + esc(nameOf(to)) + '</b>';
  a.setAttribute('aria-label', t('frame2.back', { where: nameOf(to) }));
  at.prepend(a);
}
/* the bar while you read: it says so, and lights no stage (the loop still leads out to any stage) */
export function bar(loop) {
  if (!loop) return; const on = reading(), b = loop.closest('.bar'); if (b) b.classList.toggle('f2reading', on);
  if (!on) return;
  /* a page that is a place of its own (machines from shared blocks, #320) names where you are, not Reading */
  const at = PLACE_PAGES[routeOf(location.hash)], was = loop.querySelector(':scope > .f2rk');
  if (was) { if (was.classList.contains('f2rplace') !== !!at) was.remove(); else return; }
  loop.querySelectorAll('[aria-current]').forEach(n => n.removeAttribute('aria-current'));
  const k = document.createElement('p'); k.className = 'f2rk' + (at ? ' f2rplace' : ''); k.innerHTML = '<span class="f2ri" aria-hidden="true"></span>' + esc(t(at || 'frame2.reading')); loop.prepend(k);
}

/* the first sentence of a card's words, and the rest */
export const firstSentence = s => { const m = /^([\s\S]+?[.?!])\s+(?=[A-Z0-9“‘\x22\x27(])/.exec(s); return m ? [m[1], s.slice(m[0].length)] : [s, '']; };

/* ---- Do (#274): every challenge in Do mode ----
   The player (src/v2/play.js) says what the stage shows: a lab's instrument (data-f2="instrument") takes the picture
   area; a challenge whose picture is the place itself (data-f2="place", on the player or in its HTML: your chip's
   settings, its life, a design on the bench) keeps the place as the picture, its goal across the top and its controls
   in the side panel, as with an instrument. The island's sheet (#sheet: a challenge met at a place on the island) is
   worn the same way by doSheet, so a challenge has its Do mode wherever it is played. */
/* where you are, in a view whose levels are steps (the line, the bench): the level the challenge's own card lights, or
   its place where it has no levels (the test house) */
const levelOf = dock => { const l = dock.querySelector('.player .levels .on'), p = dock.querySelector('.player'), ch = p && challengeOf(p.dataset.ch);
  return l ? l.textContent.trim() : ch && has('map.' + ch.place + '.t') ? t('map.' + ch.place + '.t') : ''; };
/* the place as the picture is a desktop's: on a phone the place is too small to play on beside the sheet, so such a
   challenge is played in the sheet under the picture, as before */
const onPlace = p => !!p && !phone() && (p.dataset.f2 === 'place' || !!p.querySelector('[data-f2="place"]'));
/* the island's sheet in Do mode: the same stage, its own "where you are" (the island's place), the same measures */
function doSheet(sheet) {
  const stage = sheet.parentNode, player = sheet.hidden ? null : sheet.querySelector(':scope > .player'), inst = !!(player && player.querySelector('[data-f2="instrument"]')), place = !inst && onPlace(player), on = inst || place;
  sheet.classList.toggle('f2do', on); sheet.classList.toggle('f2stage', on); sheet.classList.toggle('f2place', place);
  /* the island behind an instrument is covered (never hidden: it may still be moving, see frame.css) */
  let cover = stage.querySelector(':scope > .f2cover');
  if (!cover && inst) { cover = document.createElement('div'); cover.className = 'f2cover'; cover.setAttribute('aria-hidden', 'true'); stage.insertBefore(cover, sheet); }
  if (cover) cover.hidden = !inst;
  let where = stage.querySelector(':scope > .f2where.f2isle');
  if (!where && on) { where = document.createElement('button'); where.type = 'button'; where.className = 'f2where f2isle'; stage.appendChild(where);
    where.addEventListener('click', () => { const b = document.querySelector('#sheet > .player [data-back]'); if (b) b.click(); }); }
  if (!where) return;
  where.hidden = !on; if (!on) return;
  const ch = challengeOf(player.dataset.ch), name = ch && has('map.' + ch.place + '.t') ? t('map.' + ch.place + '.t') : t('map.home');
  if (where.dataset.at !== name) { where.dataset.at = name;
    where.innerHTML = '<span class="f2wa" aria-hidden="true">↑</span><span class="f2wt"><span class="f2wk">' + esc(t('frame2.where')) + '</span><b>' + esc(name) + '</b></span>';
    where.setAttribute('aria-label', t('frame2.do.island', { place: name })); }
  stageVars(sheet, player.querySelector('[data-f2="goal"]'), player.querySelector('[data-f2="instrument"]'));
}
/* the stage's measures, on el: the goal's height (returned); with an instrument, how much a drawing made for the card
   is scaled to the stage (its words keep their size on the screen), and on a phone where the sheet begins, under it */
function stageVars(el, g, i) {
  const gh = g ? Math.round(g.getBoundingClientRect().height) : 0;
  el.style.setProperty('--f2-goalh', gh + 'px');
  if (!i) return gh;
  const sv = i.querySelector('svg[viewBox]'), vb = sv && sv.viewBox.baseVal, r = sv && sv.getBoundingClientRect();
  if (vb && vb.width && r.width && r.height) el.style.setProperty('--f2-k', (1 / Math.min(r.width / vb.width, r.height / vb.height)).toFixed(4));
  if (phone()) el.style.setProperty('--f2-sheet', Math.round(i.getBoundingClientRect().bottom + 10) + 'px');
  return gh;
}

export function attach(host, api, o, x) {
  boot();
  const dock = api.dock, wrap = x.wrap, me = {};
  /* a view makes its frame anew in the same host each time it is shown: only the newest wears it, and what the one
     before listened to and watched ends with it (its life, from the frame: #366) */
  host.f2now = me; const now = () => host.f2now === me;
  const life = x.life || { signal: undefined, watch: ob => ob }, alive = { signal: life.signal };
  let open = false;
  /* where you are, while a lab has the stage: the level on the way down, lit; a tap goes back to Look */
  const where = document.createElement('button'); where.type = 'button'; where.className = 'f2where'; where.hidden = true; host.appendChild(where);
  where.addEventListener('click', () => { open = false; api.look(); }, alive);
  let whereKey = '';
  const drawWhere = () => {
    const h = x.here(), at = x.at(), lv = h ? h.label : levelOf(dock), key = at + '|' + lv; if (key === whereKey) return; whereKey = key;
    where.innerHTML = '<span class="f2wa" aria-hidden="true">↑</span><span class="f2wt"><span class="f2wk">' + esc(t('frame2.where')) + '</span><b>' + esc(lv) + '</b>' + (h && h.size ? '<span class="f2fig">' + esc(h.size) + '</span>' : '') + '</span>' +
      (x.items.length > 1 ? '<span class="f2wl" aria-hidden="true">' + x.items.map(i => '<i' + (i.id === at ? ' class="on"' : '') + '></i>').join('') + '</span>' : '');
    where.setAttribute('aria-label', t('frame2.whereBack', { level: lv }));
  };

  /* a level's card made a caption: its name (in a row of steps, the step's) and size first, one sentence, the
     question, the search, Read more and Do; the rest of the card is kept, under Read more. Done once each time the
     view writes its card */
  const caption = () => {
    if (dock.querySelector(':scope > .f2head')) return;
    /* a card that is not a level's (a story told step by step, the board's) is the caption as it is */
    const line = dock.querySelector(':scope > .line'), k = dock.firstElementChild, plain = o.caption === 'plain' || !line || !k; dock.classList.toggle('f2plain', plain); if (plain) return;
    const h = x.here(), st = x.step ? x.step() : '', place = o.path && o.path[1] ? o.path[1].label : '';
    const head = document.createElement('div'); head.className = 'f2head';
    const fig = h && h.size ? '<span class="f2fig">' + esc(h.size) + '</span>' : '', size = fig && h.across !== false ? esc(t('frame2.across', { size: '\u0001' })).replace('\u0001', fig) : fig;
    /* how true the picture is, one mark beside the level's name (#325): not on a step of a row of steps, which is not a
       level's picture */
    head.innerHTML = '<p class="f2k"><span>' + esc(place) + (size ? ' · ' + size : '') + '</span></p><h2 class="f2t">' + esc(st || (h ? h.label : k.textContent)) + (h && h.fid && !st ? h.fid : '') + '</h2>';
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
     followed, Do and Ask, Read more and a card that is not a level's are the side panel; a level's card at rest is the
     caption */
  const update = () => {
    if (!now()) return;
    const player = dock.querySelector('.player'), inst = !!(player && player.querySelector('[data-f2="instrument"]')), place = !inst && onPlace(player);
    const look = !!o.caption && api.mode() === 'look' && !player && !dock.querySelector('.stopx');
    if (look) caption();
    if (!look) dock.classList.remove('f2plain');
    const cap = look && !open && (!!dock.querySelector(':scope > .f2head') || dock.classList.contains('f2plain'));
    host.classList.add('f2'); host.classList.toggle('f2cap', cap); host.classList.toggle('f2side', !cap); host.classList.toggle('f2stage', inst || place); host.classList.toggle('f2place', place);
    host.classList.toggle('f2open', look && open);
    where.hidden = !inst && !place; if (inst || place) drawWhere();
    fold(); notices();
    const els = inst || place ? [player.querySelector('[data-f2="goal"]'), player.querySelector('[data-f2="instrument"]')].filter(Boolean) : cap ? [wrap] : [];
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
    const player = dock.querySelector('.player'), g = player && player.querySelector('[data-f2="goal"]'), i = player && player.querySelector('[data-f2="instrument"]'); if (!i && !host.classList.contains('f2place')) return;
    const gh = stageVars(host, g, i);
    const bg = (i ? 0 : gh) + 'px', st = host.parentNode; if (st && st.style.getPropertyValue('--f2-bgoal') !== bg) st.style.setProperty('--f2-bgoal', bg);
  };
  const ro = typeof ResizeObserver === 'function' ? life.watch(new ResizeObserver(measure)) : null;
  let watched = [];
  const fold = sheet(host, wrap, now, life);
  if (!host.f2notes && typeof MutationObserver === 'function') { host.f2notes = true; new MutationObserver(notices).observe(host, { childList: true }); }
  life.watch(new MutationObserver(update)).observe(dock, { childList: true, subtree: true, characterData: true });
  addEventListener('resize', () => { if (!host.hidden) update(); }, alive);
  host.addEventListener('click', e => {
    if (!now()) return;
    if (e.target.closest('[data-f2open]')) { open = true; update(); wrap.scrollTop = 0; return; }
    if (e.target.closest('[data-f2close]')) { open = false; update(); return; }
    if (e.target.closest('[data-mode]')) { open = false; update(); }
  }, alive);
  update();
}

/* ---- a phone (#275): the sheet at three heights, the notices in it, and the bar's log beside the loop ----
   The frame's card on a phone is a sheet (src/v2/frame.js gives it its peek and its handle). It
   rests at three heights: the peek (the level's name and its whole question), half the screen, and the whole of it
   under the way out. A tap on the handle goes up a height (from the top, back to the peek); a drag on the handle or the
   sheet's head (or anywhere on the peek) moves it with the finger and lets it settle at the nearest height, or the
   next one the way it was flicked. A touch on the picture lets it down to the peek, as before. While a challenge is
   played it never folds to the peek; while a lab's instrument has the stage the sheet stays under it, so the
   instrument is always in sight above the controls. sheet(): one per frame, called by attach, living as long as it. */
const STATES = ['peek', 'half', 'full'];
function sheet(host, wrap, now, life) {
  const dock = wrap.querySelector('.dock'), handle = wrap.querySelector('.peekbar');
  if (!dock || !handle) return () => {};
  const alive = { signal: life.signal };
  let at = wrap.classList.contains('peek') ? 'peek' : 'half', drag = null, tm = 0, hold = false, peekTop = null;
  /* where the peek's top was, so a sheet the frame opens glides up from there (by then it is no longer a peek) */
  if (typeof ResizeObserver === 'function') life.watch(new ResizeObserver(() => { if (on() && wrap.classList.contains('peek') && !wrap.style.top) peekTop = wrap.offsetTop; })).observe(wrap);
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
  life.watch(new MutationObserver(() => {
    if (!on() || drag) return; const p = wrap.classList.contains('peek');
    if (p && at !== 'peek') { at = 'peek'; classes('peek'); label(); }
    else if (!p && at === 'peek') { if (hold) { hold = false; classes('peek'); label(); } else set('half', peekTop != null ? peekTop : host.clientHeight - 10 - wrap.offsetHeight); }
    else if (!p && !wrap.classList.contains('f2' + at)) classes(at);
  })).observe(wrap, { attributes: true, attributeFilter: ['class'] });
  /* a tap on the handle: up a height, and from the top back down. Heard before the frame's own (two heights) */
  host.addEventListener('click', e => {
    if (!on()) return;
    if (e.target.closest('.dockwrap > .peekbar')) { e.preventDefault(); e.stopPropagation(); const S = states(); return set(S[(S.indexOf(at) + 1) % S.length]); }
    /* closing a notice on the peek leaves it a peek */
    if (at === 'peek' && e.target.closest('.dockwrap > .toast, .dockwrap > .seamnote [data-seamx]')) hold = true;
  }, { capture: true, signal: life.signal });
  /* a drag: on the handle, the sheet's head, or anywhere on the peek but its controls */
  const grip = e => e.target === wrap || !!e.target.closest('.peekbar, .f2head, .dock > .kicker:first-child') || (at === 'peek' && !e.target.closest('button, a, input, select, textarea'));   /* i18n-ok: selectors */
  wrap.addEventListener('pointerdown', e => {
    if (!on() || e.button > 0 || !grip(e) || states().length < 2) return;
    drag = { id: e.pointerId, y0: e.clientY, top: wrap.offsetTop, moved: false, last: [[e.clientY, e.timeStamp]] };
  }, alive);
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
  }, alive);
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
  wrap.addEventListener('pointerup', end, alive); wrap.addEventListener('pointercancel', end, alive);
  return () => { if (!on()) return; if (!states().includes(at)) set(at); else { classes(at); label(); } };
}

/* the notices: the seam note goes into the card in sight (the caption, the side panel, the phone sheet), at its top,
   on every screen, and never over the picture; the word that something grew does so on a phone (on a desktop it is a
   moment at the foot of the picture). With no frame in sight (the island), they stay where the shell put them, and
   on a desktop the seam note stands left of the island's sheet (src/styles/frame.css) */
const NOTES = ['.seamnote', '#toast'], NOTE = {};
export function notices() {
  const vis = [...document.querySelectorAll('.stage > section.f2:not([hidden]) > .dockwrap')].find(w => w.offsetParent) || null;
  for (const q of NOTES) {
    const n = NOTE[q] || (NOTE[q] = document.querySelector(q)); if (!n) continue;
    const W = q === '.seamnote' || phone() ? vis : null;
    /* a frame made anew takes its old card away, and the notice in it: it goes back where the shell put it first */
    if (n.f2home && !n.isConnected) n.f2home.appendChild(n);
    if (!n.f2home) { n.f2home = n.parentNode; if (typeof MutationObserver === 'function') new MutationObserver(notices).observe(n, { attributes: true, attributeFilter: ['hidden'] }); }
    const to = W && !n.hidden ? W : n.f2home, bar = W && W.querySelector(':scope > .peekbar');
    if (to === W && W) { if (n.parentNode !== W) (bar ? bar.after(n) : W.prepend(n)); }
    else if (n.parentNode !== to) to.appendChild(n);
  }
}
/* the bar on a phone: Your log never covers the loop's dots; where there is no room for its words it is a mark, and
   where there is still none, Reading is a mark too */
function fitBar() {
  const b = document.querySelector('.bar'), log = document.getElementById('logbtn'), loop = document.getElementById('loop'); if (!b || !log || !loop) return;
  b.classList.remove('f2logmark', 'f2tight'); if (!phone()) return;
  const ol = loop.querySelector('ol'), full = () => (ol || loop).getBoundingClientRect().right > log.getBoundingClientRect().left - 2 || loop.scrollWidth > loop.clientWidth + 1;
  if (full()) b.classList.add('f2logmark');
  if (full()) b.classList.add('f2tight');
}
