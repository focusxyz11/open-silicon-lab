/* Hold, the first page (#/): fifty years of computing under one finger, told as one story on one chip (src/data/hold.js
   holds its numbers and plan, src/styles/hold.css its look, src/i18n/<lang>/hold.json its words, hd.*; the words and
   state it shares in src/v2/holdkit.js, its pictures in src/v2/holdplates.js).
   Every picture of the page is a block of one chip, laid out once, and the scroll is the camera over it. Through the
   fifty years the camera stays on one square: scrolling is time (a doubling is a length of page, three times longer
   inside a moment), holding scrolls for you, and Moore's law runs live along the bottom. Past the wall the same scroll
   (or the same hold) pulls the camera back until that square is one block among twelve; a check sweeps across and four
   blocks fail it (the four walls). Then it flies from block to block (what comes next, how a computer works, your
   machine, the island), and short cards pass over the picture with numbered marks that also sit on the part they are
   about. The chip is also the map: tap a block, the small chip in the bar or a chapter at the left, and the camera
   flies there. Nothing is swapped, faded in or cut. Designed with Claude Fable 5.2 (prototype D: B's story on A's
   chip) and brought into the lab with Claude Opus 5.5. Nothing 3D: the island (#/island) is one way out of it.
   createHold(host, ctx) → { show(), hide() }; ctx: still() (reduced motion). For checks: window.__hold.set(v) goes to
   v doublings (99: the wall), .go(id) to a block, .ch(id) to where a challenge is played, .state(). */
import { lang, needWords } from '../core/i18n.js';
import { still, theme } from '../core/ui.js';
import { w, $, $$, h, clamp, ss, PHONE, S, LIVE, setRoot, fitU, CHAPS, mkTop, CH_AT, ORDER, WALL_OF, WID, PW, lab, words, fillWays, loadFacts,
  momAt, viewAt, countParts, statsHTML, momOut, yearsWordsHTML, Yr, movesEl, TICK, loop, bindHold, setHolding, onChange, Q, src, sheet, fitHead, fillShared } from './holdkit.js';
import { mkPlate, put, out, LIT, mkChart, mkCQ, initOuts } from './holdplates.js';
import { D2011, DWALL, LOOP, MOMENTS, WALLS, yearShown } from '../data/hold.js';

const FONTS = 'https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&family=Anton&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Gelasio:ital,wght@1,400;1,500&display=swap';
const FONTS_ZH = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;900&family=Noto+Serif+SC:wght@500&display=swap';

export function createHold(host, ctx = {}) {
  const reduce = ctx.still || still;
  /* day or night, as the lab is set (◐ in the bar reloads the page), all the way down */
  S.night = theme() === 'dark';
  host.classList.add('holdhome'); host.classList.toggle('hold-night', S.night);
  const root = h('div', 'hold' + (S.night ? ' night' : '')); root.id = 'hd-root'; host.replaceChildren(root); setRoot(root); initOuts();
  /* the page's part of the lab's bar (in the loop's place, which waits on the first page): the small chip, the chapter,
     the twelve challenges and the sources */
  const chapL = h('div', 'b-chap mono'), map = h('div', 'd-map'), mid = h('div', 'd-mid'); mid.append(map, chapL);
  const top = mkTop(mid, goChallenge);
  const stage = h('div', 'b-stage'), world = h('div', 'd-world'), slot = h('div', 'b-slot'), hud = h('div', 'b-hud'), band = h('div', 'b-band'), story = h('div', 'b-story'), rail = h('nav', 'b-rail'), holdBox = h('div', 'b-hold'), ycard = h('div', 'd-ycard', '<div class="say"></div>');
  rail.setAttribute('aria-label', w('rail.open'));
  stage.append(world, slot, hud); root.append(stage, h('div', 'd-cover'), story, band, h('div', 'b-railbg'), rail, holdBox, ycard);
  /* ---- the chip: twelve cells, the path through them a snake ---- */
  const CELLS = ['title', ...ORDER].map(id => [id, 0, 0]);
  const NUM = { years: '01', walls: '02', next: '03', arch: '04', machine: '05', island: '06' }, DPR = Math.min(2, devicePixelRatio || 1);
  const plates = {}, blks = {}, pads = {}, POS = {};
  const edge = h('div', 'd-edge dx'), reg = h('div', 'd-reg dx'), scan = h('div', 'd-scan'); world.append(edge, reg);
  const title = h('div', 'd-title dx', '<div><h2 class="anton">' + w('a.title') + '</h2><p>' + w('d.lede') + '</p></div><div><div class="lg mono"><span><i class="v"></i>' + w('a.legend.viol') + '</span><span><i class="p"></i>' + w('a.legend.pad') + '</span></div><div class="st mono"></div></div>'); world.appendChild(title);
  ORDER.forEach(id => { const p = PW[id], b = h('div', 'dblk' + (p.viol ? ' viol' : '')), pl = mkPlate(id, { dpr: id === 'years' ? DPR : Math.min(1.5, DPR) }); plates[id] = pl; blks[id] = b;
    const k = h('div', 'dk anton', '<b>' + (p.viol ? '✕ 0' + p.viol : NUM[p.ch]) + '</b>' + (id === 'years' ? w('tab.years') : p.name())), go = h('button', 'dgo'); go.type = 'button'; go.setAttribute('aria-label', p.name()); go.onclick = () => goPlate(id, null, false, true);
    b.append(k, pl.el, h('div', 'dv'), go); world.appendChild(b); });
  LOOP.forEach(([stg, place], i) => { const b = h('button', 'd-pad dx mono' + (i === 0 || i === 3 ? '' : ' v'), '<i></i><span>' + w('stage.' + stg) + ' · <b>' + w('place.' + place) + '</b></span>'); b.type = 'button'; b.onclick = () => { S.place = place; out('island'); goPlate('island', null, false, true); }; world.appendChild(b); pads[place] = b; });
  world.appendChild(scan);
  CELLS.forEach(([id]) => { const b = h('button', id === 'title' ? 't' : PW[id].viol ? 'viol' : ''); b.type = 'button'; b.dataset.id = id; b.title = id === 'title' ? w('a.chip') : PW[id].name(); b.setAttribute('aria-label', b.title); b.onclick = () => (PHONE() || id === 'title' ? goOver() : goPlate(id, null, false, true)); map.appendChild(b); });
  const mks = [1, 2].map(n => { const e = h('span', 'b-mk mono', n); slot.appendChild(e); return e; });
  hud.innerHTML = '<div class="w-k mono">' + w('hero.k') + '</div><div class="count"></div><div class="stats"></div><div class="say"></div>';
  const chart = mkChart({ onScrub: d => { touch(); host.scrollTo({ top: secs.years.offsetTop + yOfD(d) }); } }), cq = mkCQ(), mv = movesEl(); band.append(cq, mv, chart.el);
  const hb = h('button', 'holdbtn', w('btn')), hint = h('div', 'hint mono'); hb.type = 'button'; holdBox.append(hb, hint);
  const holdOn = () => { touch(); setHolding(true); }, holdOff = () => setHolding(false);
  bindHold(hb, holdOn, holdOff); bindHold(plates.years.el, holdOn, holdOff);
  let cur = 'years', vh = 800, VW = 1280, S1 = 500, Sy = 500, u = 1, WW = 1, WH = 1, F = {}, O = null, KF = [], p0 = 0, flying = 0, C = null, yrs = true, fr = 0, top1 = 0, sized = false, BH = 150;

  /* ---- scroll and time: a doubling is a length of page, three times longer inside a moment ---- */
  const BR = [0]; MOMENTS.forEach(m => BR.push(m.at, m.at + m.span)); BR.push(DWALL);
  const base = () => vh * .19, wt = i => (i % 2 ? 3 : 1);
  function yOfD(d) { let y = 0; for (let i = 0; i < BR.length - 1; i++) { const a = BR[i], b = BR[i + 1]; if (d <= a) break; y += (Math.min(d, b) - a) * wt(i) * base(); } return y; }
  function dOfY(y) { let d = 0; for (let i = 0; i < BR.length - 1; i++) { const len = (BR[i + 1] - BR[i]) * wt(i) * base(); if (y <= len) return d + y / (wt(i) * base()); y -= len; d = BR[i + 1]; } return DWALL; }

  /* ---- the cards: short words passing over the picture, each beside the part it is about, with its number on it ---- */
  /* where each card's number sits on its block: on the drawing it names ([x, y] in per cent), or beside the control it
     asks you to use ([a selector in the plate, the side]: l, in the margin left of it, level with its first row; t, just
     above its left end; r, just right of its top), never on a word */
  const secs = {}, AT = { leak: [[50, 47], [50, 8.5]], distance: [[58, 47], ['.seg', 'l']], power: [[25.5, 58], [50, 50]], price: [[60, 24.5], ['.seg', 'l']], next: [[86, 88], ['.holdbtn', 'r']], levels: [[50, 45], ['.seg', 'l']], eras: [[50, 50], ['.seg', 'l']], arr: [[50, 55], ['.seg', 't']], machine: [[50, 40], ['.seg', 'l']], island: [[50, 47], [57.5, 13]] },
    MAT = { gate: [14, 58], job: [50, 20.5], bug: ['.layer.on .pbtn', 'l'], light: ['.layer.on .seg', 'l'] };
  const pin = (c, [x, y]) => { if (typeof x === 'string') { c.dataset.sel = x; c.dataset.side = y; } else { c.dataset.x = x; c.dataset.y = y; } };
  const card = (side, n, cls) => { const c = h('div', 'card ' + side + (cls ? ' ' + cls : '')); if (n) c.appendChild(h('span', 'n mono', n)); return c; };
  { const sec = h('section', 'sec years'); sec.dataset.id = 'years'; secs.years = sec; story.appendChild(sec);
    MOMENTS.forEach(m => { const box = h('div', 'mom'), c = card('r', 1); pin(c, MAT[m.id]); c.dataset.mom = m.id;
      c.innerHTML += '<div class="w-try"><div class="w-k mono"><i></i>' + w('mo.' + m.id + '.k') + ' · ' + w('mo.try') + '</div><p class="w-p">' + w('mo.' + m.id + '.q') + '</p><div class="w-out" data-out="m-' + m.id + '">' + momOut(m.id) + '</div></div><p class="mq">' + Q(m.q) + '</p>' + lab(w('mo.' + m.id + '.lab'), m.lab);
      box.appendChild(c); sec.appendChild(box); m._box = box; });
    /* the wall: on the right, where the moments were, so the count stays readable beside it */
    const wc = card('r', 0, 'wall'); wc.innerHTML = '<div class="w-k mono viol">' + yearShown(DWALL) + ' · ' + w('rail.wall') + '</div><h2 class="w-h anton">' + w('m.wall.h') + '</h2><p class="w-d">' + w('m.wall.p') + ' ' + src('node-n2', 'design-cost-2nm') + '</p>'; const wb = h('div', 'mom'); wb.appendChild(wc); sec.appendChild(wb); sec._wall = wb; }
  /* the pull back: no card on a desktop (the chip says it itself, in its first cell); on a phone, one */
  const pull = h('section', 'sec pull'), pc = card('l', 0, 'pullc'); pc.innerHTML = '<h2 class="w-h anton">' + w('a.title') + '</h2><p class="w-d">' + w('d.lede') + '</p>'; pull.appendChild(pc); story.appendChild(pull);
  ORDER.slice(1).forEach(id => { const sec = h('section', 'sec'), W = words(id); sec.dataset.id = id; secs[id] = sec; story.appendChild(sec);
    const a = card('l', 1), b = card('r', 2), c = W.q ? card('l', 0, 'q') : null, gap = () => h('div', 'gap'); a.append(W.head, W.cap); b.append(W.try); if (W.ways) b.append(W.ways); if (c) c.append(W.q);
    pin(a, AT[id][0]); pin(b, AT[id][1]); sec.append(a, gap(), b); if (c) sec.append(gap(), c); sec.appendChild(h('div', 'tail')); sec._c = [a, b, c]; });
  const end = h('div', 'b-end mono', '<span>' + w('b.end') + '</span><button type="button" class="bbtn mono">' + w('sources') + '</button>'); story.appendChild(end); end.querySelector('button').onclick = () => sheet(true);
  CHAPS.forEach(ch => { const b = h('button', '', '<i></i><span>' + w('tab.' + ch) + '</span>'); b.type = 'button'; b.dataset.ch = ch; b.onclick = () => goPlate(ORDER.find(id => PW[id].ch === ch), null, false, true); rail.appendChild(b); });

  /* ---- sizes, the chip's plan, and the camera's path ---- */
  const px = (e, x, y, ww, hh) => { e.style.left = x + 'px'; e.style.top = y + 'px'; if (ww != null) { e.style.width = ww + 'px'; e.style.height = hh + 'px'; } };
  function fit() {
    if (!host.clientHeight) return;
    /* where the visitor is, before the new layout: kept through a resize or a phone turned sideways */
    const keep = sized && !flying ? here.a : null;
    u = fitU(); vh = host.clientHeight; VW = host.clientWidth; const W = VW, R = root.style, ph = PHONE(), barH = ph ? 62 : 72; let rw = 0, topY, bandH, cxs, SH;
    R.setProperty('--barH', barH + 'px');
    if (ph) { S1 = Sy = W - 28; bandH = 84; top1 = topY = 66; SH = 44 + S1 + bandH + 12; cxs = W / 2; R.setProperty('--stageH', SH + 'px'); R.setProperty('--ctop', barH + SH + 10 + 'px'); R.setProperty('--cw', W - 28 + 'px'); R.setProperty('--ov', '0px');
      if (cq.parentNode !== ycard) ycard.appendChild(cq); }
    else { /* the chapters keep a strip of their own at the left, so they never sit over the chip: wide enough for their
        names on a wide screen, for their marks on any other */
      const wide = W >= 1600; rw = (wide ? 170 : 44) * u; const Wc = W - rw; S1 = Math.floor(Math.min(vh - barH - 84 * u, Wc * .44));
      const cw = Math.min((Wc - S1) / 2 - (wide ? 56 : 70) * u, 400 * u), cqw = cw + S1 * .32; R.setProperty('--cw', cw + 'px'); R.setProperty('--cqw', cqw + 'px'); R.setProperty('--ov', S1 * .05 + 'px'); R.setProperty('--ctop', vh * .2 + 'px'); rail.classList.toggle('wide', wide);
      if (cq.parentNode !== band) band.insertBefore(cq, band.firstChild);
      /* the band under the fifty years: its question wider than the column above it, and the band as tall as the longest
         of its questions needs, so none is ever cut off (on a very short window, a phone on its side, it scrolls) */
      bandH = Math.min(Math.max(150 * u, vh * .2, cq.need(cqw) + 24 * u), Math.max(150 * u, vh * .36));
      Sy = Math.floor(Math.min(vh - barH - bandH - 64 * u, Wc * .44)); top1 = barH + (vh - barH - S1) / 2 + 8 * u; topY = barH + (vh - barH - bandH - Sy) / 2 + 8 * u; SH = vh; cxs = W / 2 + rw / 2; }
    BH = ph ? 0 : bandH;
    R.setProperty('--rw', rw + 'px'); R.setProperty('--S', S1 + 'px'); R.setProperty('--top', top1 + 'px'); R.setProperty('--band', bandH + 'px');
    R.setProperty('--hbB', Math.max(10, (vh - top1 - S1) / 2 - 27 * u) + 'px');
    for (const e of [hud, band, secs.years]) { e.style.setProperty('--S', Sy + 'px'); e.style.setProperty('--top', topY + 'px'); }
    /* the plan: every plate the size it is seen at (so it is sharp, and its controls are real, when the camera is on it).
       The grid follows the window: 6 by 2 on a wide screen, 4 by 3 on most, 3 by 4 on a phone; the path through it is a
       snake, and the channels between blocks widen (a little) until the chip has the window's shape */
    const ot = ph ? 6 : barH + 4 * u, ob = ph ? 6 : 14 * u, uw = W - rw - (ph ? 12 : 40 * u), uh = SH - ot - ob, asp = uw / uh, cols = ph ? 3 : asp >= 1.8 ? 6 : 4, rows = 12 / cols, M = S1 * .3;
    let pX = S1 * 1.17, pY = S1 * 1.3; const a0 = (2 * M + cols * pX) / (2 * M + rows * pY); if (asp > a0) pX = Math.min(pX * 1.35, ((2 * M + rows * pY) * asp - 2 * M) / cols); else pY = Math.min(pY * 1.35, ((2 * M + cols * pX) / asp - 2 * M) / rows);
    CELLS.forEach((c, i) => { const r = Math.floor(i / cols), k = i % cols; c[1] = r % 2 ? cols - 1 - k : k; c[2] = r; map.children[i].style.order = r * cols + c[1]; }); map.style.gridTemplateColumns = 'repeat(' + cols + ',' + (ph ? '8px' : 14 * u + 'px') + ')';
    WW = 2 * M + cols * pX; WH = 2 * M + rows * pY; px(world, 0, 0, WW, WH); px(edge, M * .42, M * .42, WW - M * .84, WH - M * .84);
    CELLS.forEach(([id, c, r]) => { const x = M + c * pX + (pX - S1) / 2, y = M + r * pY + S1 * .225; POS[id] = [x, y]; if (id === 'title') px(title, x, y - S1 * .1, S1, S1 * 1.1); else { px(blks[id], x, y, S1, S1); plates[id].fit(); } });
    { const xs = ['leak', 'distance', 'power', 'price'].map(k => POS[k][0]), ys = ['leak', 'distance', 'power', 'price'].map(k => POS[k][1]), x0 = Math.min(...xs), y0 = Math.min(...ys); px(reg, x0 - S1 * .06, y0 - S1 * .2, Math.max(...xs) - x0 + S1 * 1.12, Math.max(...ys) - y0 + S1 * 1.25); reg.style.display = ph ? 'none' : ''; }
    const pm = M * .21, PP = { lab: [WW / 2, pm], studio: [WW - pm, WH * .3], fab: [WW - pm, WH * .7], test: [WW / 2, WH - pm], port: [pm, WH * .7], datacentre: [pm, WH * .3] }; for (const p in pads) px(pads[p], ...PP[p]);
    F = {}; ORDER.forEach(id => { F[id] = { x: POS[id][0] + S1 / 2, y: POS[id][1] + S1 / 2, k: 1, sx: cxs, sy: top1 + S1 / 2 }; }); F.years = { ...F.years, k: Sy / S1, sy: topY + Sy / 2 };
    O = { x: WW / 2, y: WH / 2, k: Math.min(uw / WW, uh / WH), sx: cxs, sy: ot + uh / 2 };
    const sy = secs.years; sy.style.height = yOfD(DWALL) + vh * 1.25 + 'px'; MOMENTS.forEach(m => { m._box.style.top = yOfD(m.at) + (ph ? 48 + SH + 4 : vh * .2) + 'px'; m._box.style.height = yOfD(m.at + m.span) - yOfD(m.at) + 'px'; });
    sy._wall.style.top = yOfD(DWALL) + (ph ? 48 + SH + 4 : vh * .2) + 'px'; sy._wall.style.height = vh * .75 + 'px';
    /* a headline as large as its card allows, never wider than it ("L’électricité" is longer than "The power") */
    $$('.card .w-h', story).forEach(e => { e.style.fontSize = ''; fitHead(e, parseFloat(getComputedStyle(e).fontSize), 1e9); });
    sized = true; slot._s = 0; plan(); chart.fit(); for (const id in plates) plates[id].paint(S.T, 0);
    if (keep) restore(keep);
  }
  /* where the visitor is, said so that any layout can find it again: in the fifty years, the count (so the year); after
     them, the part of the story (the pull back, a block's section, the end) and how far through it */
  const here = { a: null, y: -1, until: 0 };
  function anchor() {
    const y = host.scrollTop, sy = secs.years, wy = yOfD(DWALL);
    if (y < pull.offsetTop) { const yy = y - sy.offsetTop; return yy <= wy ? { d: dOfY(Math.max(0, yy)) } : { el: sy, past: (yy - wy) / Math.max(1, sy.offsetHeight - wy) }; }
    let el = pull; for (const k of ORDER.slice(1)) if (secs[k].offsetTop <= y + 1) el = secs[k]; if (end.offsetTop <= y + 1) el = end;
    return { el, f: (y - el.offsetTop) / Math.max(1, el.offsetHeight) };
  }
  function yOf(a) { const sy = secs.years, wy = yOfD(DWALL);
    if (a.d != null) return sy.offsetTop + yOfD(a.d);
    if (a.past != null) return sy.offsetTop + wy + a.past * (sy.offsetHeight - wy);
    return a.el.offsetTop + Math.min(a.el.offsetHeight - 2, Math.max(2, a.f * a.el.offsetHeight)); }
  function restore(a) { const y = Math.round(yOf(a)); here.a = a; here.y = y; here.until = performance.now() + 1200; host.scrollTo({ top: y, behavior: 'instant' }); onScroll(); }
  /* the camera's path, from where the story's sections are now (again whenever a card grows or shrinks):
     [where on the page, what the camera frames there, whether it pulls back a little on the way in] */
  function plan() {
    if (!sized) return; const ph = PHONE();
    ORDER.slice(1).forEach(id => { const [a, , c] = secs[id]._c; if (c) c.style.top = ph ? '' : vh * .17 + a.offsetHeight + 14 * u + 'px'; });
    const T = vh * .75; p0 = pull.offsetTop - vh * .2; KF = [[0, F.years, 0], [p0, F.years, 0], [p0 + vh * .85, O, 0], [p0 + vh * 1.15, O, 0]];
    ORDER.slice(1).forEach(id => { const s = secs[id]; s._out = s.offsetTop + s.offsetHeight - T; KF.push([s.offsetTop, F[id], id === 'leak' ? 0 : 1], [s._out, F[id], 0]); }); KF.push([end.offsetTop, O, 0], [1e9, O, 0]);
    if (here.a && performance.now() < here.until && Math.abs(host.scrollTop - here.y) < 2) { const y = Math.round(yOf(here.a)); if (Math.abs(y - here.y) > 1) { here.y = y; host.scrollTo({ top: y, behavior: 'instant' }); } }
    onScroll();
  }
  let planF = 0; new ResizeObserver(() => { if (!planF) planF = requestAnimationFrame(() => { planF = 0; if (LIVE.on) plan(); }); }).observe(story);
  function camAt(y) { let i = 0; while (i < KF.length - 2 && KF[i + 1][0] <= y) i++; const [y0, a] = KF[i], [y1, b, dip] = KF[i + 1]; if (a === b) return { ...a, a, b, t: 0 };
    const t = clamp((y - y0) / (y1 - y0), 0, 1), e = t * t * (3 - 2 * t), L = (p, q) => p + (q - p) * e;
    return { x: L(a.x, b.x), y: L(a.y, b.y), k: Math.exp(L(Math.log(a.k), Math.log(b.k))) * (1 - (dip ? .34 : 0) * Math.sin(Math.PI * t)), sx: L(a.sx, b.sx), sy: L(a.sy, b.sy), a, b, t }; }

  /* ---- going somewhere: the camera flies (the page scrolls smoothly), it never jumps ---- */
  function fly(top, smooth) { smooth = smooth && !reduce(); if (smooth) { flying = 1; clearTimeout(fly.tm); fly.tm = setTimeout(() => { flying = 0; onScroll(); }, 1600); } host.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' }); onScroll(); }
  host.addEventListener('scrollend', () => { if (flying) { flying = 0; clearTimeout(fly.tm); onScroll(); } });
  function goPlate(id, d, full, smooth) { touch(); const sec = secs[id], ph = PHONE(); let top = sec.offsetTop + 2;
    if (id === 'years') top = sec.offsetTop + yOfD(d || 0);
    else if (ph) top = full ? sec.offsetTop + sec._c[1].offsetTop - parseFloat(getComputedStyle(sec._c[1]).top) + 6 : top;
    else if (full) { const c = sec._c[2] || sec._c[1], st = parseFloat(getComputedStyle(c).top) || 0; c.style.position = 'static'; const nat = c.offsetTop; c.style.position = ''; top = sec.offsetTop + nat - st + 40; }
    fly(top, smooth && id !== 'years'); }
  const goOver = () => { touch(); fly(p0 + vh, true); };
  function goChallenge(id) { const [pid, d] = CH_AT[id]; goPlate(pid, d, false, true); }
  S.onWallGo = goOver;

  function onScroll() {
    if (!sized) return;
    const y = host.scrollTop; let id = 'years';
    if (host.clientHeight === vh && host.clientWidth === VW && !flying && !(here.a && performance.now() < here.until && Math.abs(y - here.y) < 2)) { here.a = anchor(); here.y = y; here.until = 0; } for (const k of ORDER) if (secs[k].offsetTop <= y + 1) id = k;
    if (y > 40) touch();
    if (y < pull.offsetTop) { if (!flying) { const yy = y - secs.years.offsetTop; Yr.set(yy >= yOfD(DWALL) - 2 ? DWALL : dOfY(yy)); } } else if (!flying && S.d < DWALL) Yr.set(DWALL);
    if (id !== cur) { cur = id; setHolding(false); }
    const was = yrs; yrs = y < p0; C = camAt(y); const over = C.a === O || C.b === O, kf = C.b === O || C.a === F.years ? (C.a === F.years ? F.years.k : 1) : 1, dim = yrs ? 1 : clamp((C.k / kf - .6) / .3, 0, 1);
    /* the rest of the chip: there all along, faint around the square in the later years, and whole as the camera pulls back */
    const revx = ss(p0, p0 + vh * .3, y), rev = Math.max(revx, yrs ? .55 * ss(9, 14, S.d) : 0);
    /* its words (the other blocks' labels, the pads', the chip's title) only where the camera sees the whole chip: around
       the block you are on, and on the way between blocks, the neighbours are drawings, never words cut by the window */
    const wds = yrs ? 0 : revx * (1 - ss(O.k * 1.2, O.k * 1.7, C.k));
    world.style.transform = 'translate(' + (C.sx - C.k * C.x) + 'px,' + (C.sy - C.k * C.y) + 'px) scale(' + C.k + ')'; world.style.setProperty('--rev', rev); world.style.setProperty('--revx', revx); world.style.setProperty('--dim', dim); world.style.setProperty('--words', wds); world.classList.toggle('far', C.k < .62 * (PHONE() ? .6 : 1) && rev > .5);
    /* the check: a line across the chip as it comes into view; the four it passes fail */
    const sp = ss(.3, .95, (y - p0) / (vh * .85)), sxw = sp * WW; scan.style.transform = 'translateX(' + sxw + 'px)'; scan.style.opacity = sp > 0 && sp < 1 ? 1 : 0;
    const settled = C.a === C.b;
    ORDER.forEach(k => { const b = blks[k], f = F[k]; b.classList.toggle('cur', f === C.a || f === C.b || (k === 'years' && yrs)); b.classList.toggle('live', settled && C.a === f); if (k in WALL_OF) { b.classList.toggle('found', y >= secs.leak.offsetTop || sxw > POS[k][0] + S1 / 2); b.classList.toggle('tried', !!S.tried[WID[WALL_OF[k]]]); } });
    ORDER.slice(1).forEach(k => { const s = secs[k], o = 1 - ss(0, .3, (y - s._out) / (vh * .75)); s.style.opacity = o; s.style.pointerEvents = o < .5 ? 'none' : ''; s.style.visibility = o < .01 ? 'hidden' : ''; });
    if (was !== yrs || !slot._s) { slot._s = 1; slot.style.setProperty('--S', (yrs ? Sy : S1) + 'px'); slot.style.setProperty('--top', (yrs ? F.years.sy - Sy / 2 : F.leak.sy - S1 / 2) + 'px'); holdBox.style.setProperty('--S', (yrs ? Sy : S1) + 'px'); holdBox.style.setProperty('--hb', (yrs && !PHONE() ? BH : 0) + (PHONE() ? 14 : 22 * u) + 'px'); }
    hud.classList.toggle('off', !yrs); band.classList.toggle('off', !yrs); holdBox.classList.toggle('chip', !yrs); holdBox.classList.toggle('off', !yrs && over);
    const inChip = !yrs && over, ch = PW[cur].ch, n = CHAPS.indexOf(ch) + 1; put(chapL, inChip ? '<b>' + w('a.chip') + '</b>' : w('b.chap', { n }) + '<b>' + w('tab.' + ch) + '</b>');
    [...rail.children].forEach(b => b.classList.toggle('on', !inChip && b.dataset.ch === ch)); [...map.children].forEach(b => b.classList.toggle('on', inChip ? b.dataset.id === 'title' : b.dataset.id === cur));
    const on = [null, null]; if (settled) $$('.card[data-x],.card[data-sel]', story).forEach(c => { const r = c.getBoundingClientRect(), m = r.top + Math.min(r.height, 200) / 2; if (m > vh * .16 && m < vh * .8) { const n = +($('.n', c) || {}).textContent - 1; if (n >= 0 && (!c.dataset.mom || c.dataset.mom === viewAt(S.d))) on[n] = c; } });
    mks.forEach((e, i) => { const c = on[i]; e.classList.toggle('on', !!c); if (c) { const [x, y] = markAt(c, e); e.style.left = x + '%'; e.style.top = y + '%'; } });
  }
  /* a number beside its control, found where the control is now (its rows wrap differently in every language and
     size): on the side asked for, or else the first side where no word of the block and no card is over it (beside a
     phone's picture the cards pass under it; on a wider screen they overlap the block's edges) */
  function markAt(c, mk) { const pl = plates[cur], e = c.dataset.sel && pl && pl.ui.querySelector(c.dataset.sel), W = pl && pl.el.clientWidth;
    if (!e || !W || !e.offsetWidth) return [c.dataset.x || 50, c.dataset.y || 50];
    const pr = pl.el.getBoundingClientRect(), k = pr.width / W || 1, R = mk.offsetWidth / 2, r = R / k, g = 3, row = (e.firstElementChild || e).offsetHeight;
    const o = { l: [e.offsetLeft / 2, e.offsetTop + row / 2], r: [e.offsetLeft + e.offsetWidth + r + g, e.offsetTop + r], t: [e.offsetLeft + r, e.offsetTop - r - g], b: [e.offsetLeft + r, e.offsetTop + e.offsetHeight + r + g] };
    const boxes = [...pl.ui.querySelectorAll('.lb,.big,.seg,button,input'), ...pl.fr.children].filter(q => q.offsetWidth && !(q.closest('.layer') && !q.closest('.layer.on'))).map(q => q.getBoundingClientRect())
      .concat(PHONE() ? [] : $$('.card', story).filter(q => +getComputedStyle(q.closest('.sec')).opacity > .3 && +getComputedStyle(q).opacity > .3).map(q => q.getBoundingClientRect()));
    const free = ([x, y]) => { const X = pr.left + x * k, Y = pr.top + y * k; return x > 0 && x < W && y > 0 && y < W && !boxes.some(b => X + R + 1 > b.left && X - R - 1 < b.right && Y + R + 1 > b.top && Y - R - 1 < b.bottom); };
    const side = [c.dataset.side, 'l', 'r', 't', 'b'].find(sd => free(o[sd])) || c.dataset.side;
    return o[side].map(v => v / W * 100); }
  function chipState() { const n = WALLS.filter(v => S.tried[v.id]).length; put($('.st', title), w('a.status', { cells: ORDER.length, n, of: 4, sign: S.kept ? '<b>' + w('a.sign.yes') + '</b>' : w('a.sign.no') })); for (const p in pads) pads[p].classList.toggle('lit', !!LIT[p]()); }
  host.addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { if (LIVE.on) fit(); });
  onChange(() => { chipState(); onScroll(); });
  /* the space bar holds, as the button does; not while typing, or in the lab's bar or its dialogs */
  /* i18n-ok: selectors */ const away = e => !LIVE.on || (e.target.closest && e.target.closest('input,textarea,select,[contenteditable],.bar,.breakp,[role=dialog]'));
  addEventListener('keydown', e => { if (away(e)) return; if (e.key === ' ' && !e.repeat) { e.preventDefault(); touch(); if (cur === 'next' && C && C.a === C.b && S.next.pos < 1) S.next.hold = true; else setHolding(true); } });
  addEventListener('keyup', e => { if (e.key === ' ') { setHolding(false); S.next.hold = false; } });
  const hintKey = d => (!yrs ? 'x' : d < .01 ? 'gate' : d >= DWALL - 1e-4 ? 'wall' : momAt(d) ? 'moment' : d > D2011 ? 'pay' : d > 16.5 && d < 20.5 ? 'coast' : 'run');
  const seen = id => { const [x, y] = POS[id], l = C.sx + C.k * (x - C.x), tp = C.sy + C.k * (y - C.y), s = C.k * S1; return l < VW && l + s > 0 && tp < vh && tp + s > 0; };
  TICK.push((T, dt) => { fr++;
    if (S.holding) { const max = host.scrollHeight - vh; let v = vh * .3;
      if (yrs && host.scrollTop < pull.offsetTop) { const d = S.d, m = momAt(d), dv = m ? .32 : d < 2 ? .7 : d > D2011 ? 1.0 - .55 * ss(D2011, DWALL, d) : 1.9; v = d >= DWALL - 1e-4 ? (Yr.wallPush = Math.min(1, Yr.wallPush + dt * 2.5), Yr.wallPush >= 1 ? vh * .3 : 0) : dv * base() * (m ? 3 : 1); }
      if (host.scrollTop < max) host.scrollBy(0, Math.max(1, v * dt)); }
    else Yr.wallPush *= Math.pow(.02, dt);
    S.press += ((S.holding && S.d < .6 ? 1 : 0) - S.press) * Math.min(1, dt * 12);
    if (!C) return; const far = !yrs || S.d > 9;
    ORDER.forEach((id, i) => { const f = F[id], main = f === C.a || f === C.b; if (main || (far && fr % 4 === i % 4 && seen(id))) plates[id].paint(T, main ? dt : dt * 4); });
    const d = S.d, mom = momAt(d), wall = d >= DWALL - 1e-4;
    if (yrs) { MOMENTS.forEach(m => { m._box.firstChild.style.opacity = PHONE() ? (d >= m.at - .05 && d < m.at + m.span ? 1 : 0) : ss(m.at - 1.1, m.at - .4, d) * (1 - ss(m.at + m.span - .05, m.at + m.span + .5, d)); m._box.firstChild.style.pointerEvents = d >= m.at - .4 && d < m.at + m.span + .3 ? '' : 'none'; });
      chart.paint(T); const cp = countParts(d), say = mom || wall ? '' : yearsWordsHTML(d); put($('.count', hud), cp[0] + '<small>' + (cp[2] ? '<em>' + cp[2] + '</em> ' : '') + cp[1] + '</small>'); put($('.stats', hud), statsHTML(d)); put($('.say', hud), say); put($('.say', ycard), say);
      const early = S.cq.maxD < 3.4; cq.style.display = early ? 'none' : ''; mv.style.display = early ? '' : 'none'; }
    ycard.classList.toggle('off', !yrs || !!mom || wall); holdBox.classList.toggle('quiet', yrs && (!!mom || wall));
    const hk = hintKey(d); put(hint, hk === 'x' ? '<b>' + w('b.scroll') + '</b>' : w('hint.' + hk));
  });

  /* the first touch (a scroll, a hold, a tap; or an idle moment once the page's own preload has started): the facts
     behind the marks, the blueprint's words for what people are trying, and the words Hold shares with other pages (the
     walls, the needs: shared.json). Where the preload never starts (off: a connection that saves data), only a touch
     fetches them */
  let touched = false;
  function touch() { if (touched || !document.documentElement.dataset.preload) return; touched = true; loadFacts(); needWords('blueprint', 'shared').then(() => { fillWays(); fillShared(); out('machine'); }, () => { touched = false; }); }
  const idleTouch = () => { if (touched || !LIVE.on || document.documentElement.dataset.preload === 'off') return; if (document.documentElement.dataset.preload) (window.requestIdleCallback ? requestIdleCallback(touch, { timeout: 1500 }) : setTimeout(touch, 1500)); else setTimeout(idleTouch, 600); };

  /* for checks */
  window.__hold = { set: v => goPlate('years', v === 99 ? DWALL : v, false, false), go: (id, d) => goPlate(id, d === 99 ? DWALL : d, true), ch: goChallenge, at: id => (id === 'pull' ? p0 + vh : secs[id].offsetTop), chartX: y => chart.el.getBoundingClientRect().left + chart.X(y),
    state: () => ({ d: S.d, cur, chip: !yrs, holding: S.holding, done: Object.keys(S.done), tried: Object.keys(S.tried), place: S.place, kept: S.kept, ways: !!$('.w-ways button[data-way]:not([hidden])', story) }), S };

  /* the page's type, once */
  let ready = null;
  const prepare = () => ready || (ready = new Promise(res => {
    /* i18n-ok: a selector */ if (document.querySelector('link[data-hold-fonts]')) return res();
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = lang() === 'zh' ? FONTS + '&' + FONTS_ZH.split('?')[1] : FONTS; l.dataset.holdFonts = '1'; l.onload = l.onerror = res; document.head.appendChild(l); setTimeout(res, 1500); }).then(() => (document.fonts ? document.fonts.ready : null)));
  const bar = () => document.querySelector('.bar');
  return {
    show() { host.hidden = false; host.style.scrollBehavior = 'auto';
      const b = bar(), lp = b && b.querySelector('#loop'); if (lp && top.parentNode !== b) lp.after(top);
      LIVE.on = true; fit(); chipState(); loop(true); idleTouch();
      return prepare().then(() => { if (LIVE.on) fit(); }); },
    hide() { host.hidden = true; LIVE.on = false; loop(false); setHolding(false); top.remove(); }
  };
}
