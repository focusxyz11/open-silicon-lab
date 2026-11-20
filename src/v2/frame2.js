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
import { challengeOf } from './game.js';

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
  /* Do: a challenge played in the island's sheet gets the stage too (doSheet, below) */
  const sheet = document.getElementById('sheet');
  if (sheet && typeof MutationObserver === 'function') { const go = () => doSheet(sheet); new MutationObserver(go).observe(sheet, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] }); addEventListener('resize', go); }
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
const onPlace = p => !!p && (p.dataset.f2 === 'place' || !!p.querySelector('[data-f2="place"]'));
/* on a phone, where the panel begins when the place is the picture: under the goal, with the place in sight between */
function placeSheet(host, g) {
  if (!phone()) return;
  const top = g ? g.getBoundingClientRect().bottom : 112;
  host.style.setProperty('--f2-sheet', Math.round(top + Math.min(innerHeight * 0.3, 260)) + 'px');
}
/* the island's sheet in Do mode: the same stage, its own "where you are" (the island's place), the same measures */
function doSheet(sheet) {
  const stage = sheet.parentNode, player = sheet.hidden ? null : sheet.querySelector(':scope > .player'), inst = !!(player && player.querySelector('[data-f2="instrument"]')), place = !inst && onPlace(player), on = inst || place;
  sheet.classList.toggle('f2do', on); sheet.classList.toggle('f2stage', on); sheet.classList.toggle('f2place', place);
  /* the island behind an instrument is covered (never hidden: it may still be moving, see frame2.css) */
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
  const g = player.querySelector('[data-f2="goal"]'), i = player.querySelector('[data-f2="instrument"]');
  sheet.style.setProperty('--f2-goalh', (g ? Math.round(g.getBoundingClientRect().height) : 0) + 'px');
  const sv = i && i.querySelector('svg[viewBox]'), vb = sv && sv.viewBox.baseVal, r = sv && sv.getBoundingClientRect();
  if (vb && vb.width && r.width && r.height) sheet.style.setProperty('--f2-k', (1 / Math.min(r.width / vb.width, r.height / vb.height)).toFixed(4));
  if (phone()) { if (i) sheet.style.setProperty('--f2-sheet', Math.round(i.getBoundingClientRect().bottom + 10) + 'px'); else placeSheet(sheet, g); }
}

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
    const h = x.here(), at = x.at(), lv = h ? h.label : levelOf(dock), key = at + '|' + lv; if (key === whereKey) return; whereKey = key;
    where.innerHTML = '<span class="f2wa" aria-hidden="true">↑</span><span class="f2wt"><span class="f2wk">' + esc(t('frame2.where')) + '</span><b>' + esc(lv) + '</b>' + (h && h.size ? '<span class="f2fig">' + esc(h.size) + '</span>' : '') + '</span>' +
      (x.items.length > 1 ? '<span class="f2wl" aria-hidden="true">' + x.items.map(i => '<i' + (i.id === at ? ' class="on"' : '') + '></i>').join('') + '</span>' : '');
    where.setAttribute('aria-label', t('frame2.whereBack', { level: lv }));
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
    const player = dock.querySelector('.player'), inst = !!(player && player.querySelector('[data-f2="instrument"]')), place = !inst && onPlace(player);
    const look = !!o.caption && api.mode() === 'look' && !player && !dock.querySelector('.stopx');
    if (look) caption();
    const cap = look && !open && !!dock.querySelector(':scope > .f2head'), on = !!o.caption || inst || place;
    host.classList.toggle('f2', on); host.classList.toggle('f2cap', on && cap); host.classList.toggle('f2side', on && !cap); host.classList.toggle('f2stage', inst || place); host.classList.toggle('f2place', place);
    host.classList.toggle('f2open', look && open);
    where.hidden = !inst && !place; if (inst || place) drawWhere();
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
    const gh = g ? Math.round(g.getBoundingClientRect().height) : 0;
    host.style.setProperty('--f2-goalh', gh + 'px');
    const bg = (i ? 0 : gh) + 'px', st = host.parentNode; if (st && st.style.getPropertyValue('--f2-bgoal') !== bg) st.style.setProperty('--f2-bgoal', bg);
    if (!i) return placeSheet(host, g);
    /* a drawing made for the card, now the size of the stage: its words keep their size on the screen */
    const sv = i.querySelector('svg[viewBox]'), vb = sv && sv.viewBox.baseVal, r = sv && sv.getBoundingClientRect();
    if (vb && vb.width && r.width && r.height) host.style.setProperty('--f2-k', (1 / Math.min(r.width / vb.width, r.height / vb.height)).toFixed(4));
    if (phone()) host.style.setProperty('--f2-sheet', Math.round(i.getBoundingClientRect().bottom + 10) + 'px');
  };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  let watched = [];
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
