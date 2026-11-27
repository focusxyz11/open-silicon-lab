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
   chip) and brought into the lab with Claude Opus 5.5.
   Its pace: it opens on the square, the count and the hold button alone; Moore's law rises along the bottom once the
   count has begun to double. After the wall a block arrives with its name and its thing to try together, its question
   after. The last block is the island's own plan from straight above: the camera goes down to it, and pushing on goes
   inside through the lab's portal, the island opening from above (ctx.enter). Nothing 3D is drawn here.
   createHold(host, ctx) → { show(), hide() }; ctx: still(), enter(point, at). For checks: window.__hold.set(v) goes to
   v doublings (99: the wall), .go(id) to a block, .ch(id) to where a challenge is played, .state(). */
import { hasWords, lang, needWords } from '../core/i18n.js';
import { still, theme } from '../core/ui.js';
import { w, $, $$, h, clamp, ss, PHONE, LAND, S, LIVE, setRoot, fitU, CHAPS, mkTop, CH_AT, ORDER, WALL_OF, WID, PW, lab, words, fillWays, loadFacts,
  momAt, viewAt, countParts, countSay, statsHTML, momOut, yearsWordsHTML, Yr, TICK, lerp, loop, bindHold, setHolding, onChange, Q, src, sheet, fitHead, fillShared, restore as kept, rove } from './holdkit.js';
import { mkPlate, put, out, LIT, mkChart, mkCQ, initOuts, PL } from './holdplates.js';
import { D2011, DWALL, LOOP, MOMENTS, WALLS, dAt, yearShown } from '../data/hold.js';

/* Moore's law rises along the bottom once the count has passed the first gates and begun to double */
const RISE = 3.4;

/* the page's one face of its own, for the headlines and the count; every other word is in the lab's type (index.html) */
const FONTS = 'https://fonts.googleapis.com/css2?family=Anton&display=swap';
const FONTS_ZH = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;900&family=Noto+Serif+SC:wght@500&display=swap';

export function createHold(host, ctx = {}) {
  const reduce = ctx.still || still;
  /* what the visitor did here before, kept in this browser (src/v2/holdkit.js) */
  kept();
  /* day or night, as the lab is set (◐ in the bar reloads the page), all the way down */
  S.night = theme() === 'dark';
  host.classList.add('holdhome'); host.classList.toggle('hold-night', S.night);
  const root = h('div', 'hold' + (S.night ? ' night' : '')); root.id = 'hd-root'; host.replaceChildren(root); setRoot(root); initOuts();
  /* the page's part of the lab's bar (in the loop's place, which waits on the first page): the small chip, the chapter,
     the twelve challenges and the sources */
  const chapL = h('div', 'b-chap mono'), map = h('div', 'd-map'), mid = h('div', 'd-mid'); mid.append(map, chapL);
  let asking = 0; const top = mkTop(mid, () => { if (!asking) asking = late().then(m => { asking = 0; m.board(root, goChallenge, () => ({ d: S.d, cur, yrs })); }, () => { asking = 0; }); });
  /* it fits the room the bar leaves it: as the room runs out, the chapter's name goes, then the tally's words, then the
     sources (they are at the end of the story too), then the squares shrink, and last the chapter; a phone has its own */
  function fitBar() { const n = innerWidth > 760 ? 6 : 1; for (let k = 0; k < n; k++) { for (let i = 1; i < 6; i++) top.classList.toggle('f' + i, i <= k); if (top.scrollWidth <= top.clientWidth + 1) break; } }
  const stage = h('div', 'b-stage'), world = h('div', 'd-world'), slot = h('div', 'b-slot'), hud = h('div', 'b-hud'), band = h('div', 'b-band'), story = h('div', 'b-story'), rail = h('nav', 'b-rail'), holdBox = h('div', 'b-hold'), ycard = h('div', 'd-ycard', '<div class="say"></div>');
  rail.setAttribute('aria-label', w('rail.open'));
  /* for a screen reader and the keyboard: the page's one heading (where "skip to the story", first in the bar, leads),
     and one polite voice that says the count and the year while you hold, a moment or the wall as it comes, and the
     block the camera settles on */
  const h1 = h('h1', 'vh', w('hero.k')), voice = h('div', 'vh'), skip = h('button', 'hskip', w('skip')), plain = h('div'); h1.tabIndex = -1; voice.setAttribute('aria-live', 'polite'); skip.type = 'button';
  skip.onclick = () => h1.focus({ preventScroll: true });
  const say = html => { plain.innerHTML = html; voice.textContent = plain.textContent; };
  stage.append(world, slot, hud); root.append(h1, stage, h('div', 'd-cover'), story, band, h('div', 'b-railbg'), rail, holdBox, ycard, voice);
  /* ---- the chip: twelve cells, the path through them a snake ---- */
  const CELLS = ['title', ...ORDER].map(id => [id, 0, 0]);
  const NUM = { years: '01', walls: '02', next: '03', arch: '04', machine: '05', island: '06' }, DPR = Math.min(2, devicePixelRatio || 1);
  const plates = {}, blks = {}, pads = {}, POS = {};
  const edge = h('div', 'd-edge dx'), reg = h('div', 'd-reg dx'), scan = h('div', 'd-scan'); world.append(edge, reg);
  const title = h('div', 'd-title dx', '<div><h2 class="anton">' + w('a.title') + '</h2><p>' + w('d.lede') + '</p></div><div><div class="lg mono"><span><i class="v"></i>' + w('a.legend.viol') + '</span><span><i class="p"></i>' + w('a.legend.pad') + '</span></div><div class="st mono"></div></div>'); world.appendChild(title);
  ORDER.forEach(id => { const p = PW[id], b = h('div', 'dblk' + (p.viol ? ' viol' : '')), pl = mkPlate(id, { dpr: id === 'years' ? DPR : Math.min(1.5, DPR), name: p.name, more: id === 'years' ? () => countSay(S.d) : null }); plates[id] = pl; blks[id] = b;
    const k = h('div', 'dk anton', '<b>' + (p.viol ? '✕ 0' + p.viol : NUM[p.ch]) + '</b>' + (id === 'years' ? w('tab.years') : p.name())), go = h('button', 'dgo'); go.type = 'button'; go.setAttribute('aria-label', p.name()); go.onclick = () => goPlate(id, null, false, true);
    b.append(k, pl.el, h('div', 'dv'), go); world.appendChild(b); });
  LOOP.forEach(([stg, place], i) => { const b = h('button', 'd-pad dx mono' + (i === 0 || i === 3 ? '' : ' v'), '<i></i><span>' + w('stage.' + stg) + ' · <b>' + w('place.' + place) + '</b></span>'); b.type = 'button'; b.onclick = () => { S.place = place; out('island'); goPlate('island', null, false, true); }; world.appendChild(b); pads[place] = b; });
  world.appendChild(scan);
  CELLS.forEach(([id]) => { const b = h('button', id === 'title' ? 't' : PW[id].viol ? 'viol' : ''); b.type = 'button'; b.dataset.id = id; b.title = id === 'title' ? w('a.chip') : PW[id].name(); b.setAttribute('aria-label', b.title); b.onclick = () => (PHONE() || id === 'title' ? goOver() : goPlate(id, null, false, true)); map.appendChild(b); });
  const rvMap = rove(map, bs => bs.find(b => b.classList.contains('on')));
  const mks = [1, 2].map(n => { const e = h('span', 'b-mk mono', n); slot.appendChild(e); return e; });
  hud.innerHTML = '<div class="w-k mono" aria-hidden="true">' + w('hero.k') + '</div><div class="count"></div><div class="stats"></div><div class="say"></div>';
  const chart = mkChart({ onScrub: d => { touch(); host.scrollTo({ top: secs.years.offsetTop + yOfD(d) }); } }), cq = mkCQ(), start = h('div', 'b-start mono', w('hint.start.t')); band.append(cq, chart.el, start);
  const hb = h('button', 'holdbtn', w('btn')), hint = h('div', 'hint mono'); hb.type = 'button';
  /* after the wall, moving on is a step, not a hold: back, and on to what comes next, said by name */
  const stp = h('div', 'b-step', '<button type="button" class="sp" aria-label="' + w('step.back') + '">←</button><button type="button" class="sn"><span></span><i>→</i></button>'), stN = stp.lastChild.firstChild;
  stp.firstChild.onclick = () => step(-1); stp.lastChild.onclick = () => step(1); holdBox.append(hb, hint, stp);
  const holdOn = () => { touch(); setHolding(true); }, holdOff = () => setHolding(false);
  bindHold(hb, holdOn, holdOff); bindHold(plates.years.el, holdOn, holdOff);
  let cur = 'years', vh = 800, VW = 1280, S1 = 500, Sy = 500, u = 1, WW = 1, WH = 1, F = {}, O = null, KF = [], p0 = 0, flying = 0, C = null, yrs = true, fr = 0, top1 = 0, topY = 0, sized = false, BH = 150, rv = 0, yct = 0, Lnd = null, BEATS = [], anim = null, goIn = null;

  /* ---- scroll and time: a doubling is a length of page, three times longer inside a moment ---- */
  const BR = [0]; MOMENTS.forEach(m => BR.push(m.at, m.at + m.span)); BR.push(DWALL);
  const base = () => vh * .19, wt = i => (i % 2 ? 3 : 1);
  function yOfD(d) { let y = 0; for (let i = 0; i < BR.length - 1; i++) { const a = BR[i], b = BR[i + 1]; if (d <= a) break; y += (Math.min(d, b) - a) * wt(i) * base(); } return y; }
  function dOfY(y) { let d = 0; for (let i = 0; i < BR.length - 1; i++) { const len = (BR[i + 1] - BR[i]) * wt(i) * base(); if (y <= len) return d + y / (wt(i) * base()); y -= len; d = BR[i + 1]; } return DWALL; }

  /* ---- the cards: short words passing over the picture, each beside the part it is about, with its number on it ---- */
  /* where each card's number sits on its block: on the drawing it names ([x, y] in per cent), or beside the control it
     asks you to use ([a selector in the plate, the side]: l, in the margin left of it, level with its first row; t, just
     above its left end; r, just right of its top), never on a word */
  const secs = {}, AT = { leak: [[50, 47], [50, 8.5]], distance: [[58, 47], ['.seg', 'l']], power: [[25.5, 58], [50, 50]], price: [[60, 24.5], ['.seg', 'l']], next: [[86, 88], ['.pbtn', 'r']], levels: [[50, 45], ['.seg', 'l']], eras: [[50, 50], ['.seg', 'l']], arr: [[50, 55], ['.seg', 't']], machine: [[50, 40], ['.seg', 'l']], island: [[35, 31], [51.5, 24.8]] },
    MAT = { gate: [14, 58], job: [50, 20.5], bug: ['.layer.on .pbtn', 'l'], light: ['.layer.on .seg', 'l'] };
  const pin = (c, [x, y]) => { if (typeof x === 'string') { c.dataset.sel = x; c.dataset.side = y; } else { c.dataset.x = x; c.dataset.y = y; } };
  const card = (side, n, cls) => { const c = h('div', 'card ' + side + (cls ? ' ' + cls : '')); if (n) c.appendChild(h('span', 'n mono', n)); return c; };
  { const sec = h('section', 'sec years'); sec.dataset.id = 'years'; secs.years = sec; story.appendChild(sec);
    MOMENTS.forEach(m => { const box = h('div', 'mom'), c = card('r', 1); pin(c, MAT[m.id]); c.dataset.mom = m.id;
      c.innerHTML += '<div class="w-try"><div class="w-k mono"><i></i>' + w('mo.' + m.id + '.k') + ' · ' + w('mo.try') + '</div><p class="w-p">' + w('mo.' + m.id + '.q') + '</p><div class="w-out" data-out="m-' + m.id + '">' + momOut(m.id) + '</div></div><p class="mq">' + Q(m.q) + '</p>' + lab(w('mo.' + m.id + '.lab'), m.lab);
      box.appendChild(c); sec.appendChild(box); m._box = box; });
    /* the wall: on the right, where the moments were, so the count stays readable beside it */
    const wc = card('r', 0, 'wall'); wc.innerHTML = '<div class="w-k mono viol">' + yearShown(DWALL) + ' · ' + w('rail.wall') + '</div><h2 class="w-h anton">' + w('m.wall.h') + '</h2><p class="w-d">' + w('m.wall.p') + ' ' + src('node-n2', 'design-cost-2nm') + '</p>'; const wb = h('div', 'mom'); wb.appendChild(wc); sec.appendChild(wb); sec._wall = wb; }
  /* on a desktop, a card of the fifty years taller than the room above the hold button scrolls (.sc), as its words grow */
  let CMAX = 1e9; const tall = c => c.classList.toggle('sc', (c.classList.contains('sc') ? c.scrollHeight : c.offsetHeight) > CMAX + 1), scRO = new ResizeObserver(es => es.forEach(e => tall(e.target)));
  $$('.card', secs.years).forEach(c => scRO.observe(c));
  /* the pull back: no card on a desktop (the chip says it itself, in its first cell); on a phone, one */
  const pull = h('section', 'sec pull'), pc = card('l', 0, 'pullc'); pc.innerHTML = '<h2 class="w-h anton">' + w('a.title') + '</h2><p class="w-d">' + w('d.lede') + '</p>'; pull.appendChild(pc); story.appendChild(pull);
  ORDER.slice(1).forEach(id => { const sec = h('section', 'sec'), W = words(id); sec.dataset.id = id; secs[id] = sec; story.appendChild(sec);
    const a = card('l', 1), b = card('r', 2), c = W.q ? card('l', 0, 'q') : null, gap = () => h('div', 'gap'); a.append(W.head, W.cap); b.append(W.try); if (W.ways) b.append(W.ways); if (c) c.append(W.q);
    pin(a, AT[id][0]); pin(b, AT[id][1]); const g1 = gap(); g1.classList.add('g1'); sec.append(a, g1, b); if (c) sec.append(gap(), c); sec.appendChild(h('div', 'tail')); sec._c = [a, b, c]; });
  const end = h('div', 'b-end mono', '<span>' + w('b.end') + '</span><span class="push">' + w('isle.push') + '</span>'); story.appendChild(end);
  CHAPS.forEach(ch => { const b = h('button', '', '<i></i><span>' + w('tab.' + ch) + '</span>'); b.type = 'button'; b.dataset.ch = ch; b.onclick = () => goPlate(ORDER.find(id => PW[id].ch === ch), null, false, true); rail.appendChild(b); });

  /* ---- sizes, the chip's plan, and the camera's path ---- */
  const inert = (e, v) => { if (e.inert !== v) e.inert = v; };
  const px = (e, x, y, ww, hh) => { e.style.left = x + 'px'; e.style.top = y + 'px'; if (ww != null) { e.style.width = ww + 'px'; e.style.height = hh + 'px'; } };
  /* the fifty years' geometry, from how the page opens (rv 0: the square alone, as large as a block) to how it runs once
     Moore's law has risen under it (rv 1: a little smaller, above the band); a phone's picture keeps one size */
  const rvWant = () => (S.cq.maxD >= RISE || host.scrollTop > secs.years.offsetTop + yOfD(RISE) ? 1 : 0);
  function layYears() { const ph = PHONE(), Sx = lerp(S1, Sy, rv), tx = lerp(top1, topY, rv), yc = ph ? yct : tx;
    F.years = { x: POS.years[0] + S1 / 2, y: POS.years[1] + S1 / 2, k: Sx / S1, sx: F.leak.sx, sy: tx + Sx / 2 };
    for (const e of [hud, band, secs.years]) { e.style.setProperty('--S', Sx + 'px'); e.style.setProperty('--top', tx + 'px'); }
    secs.years.style.setProperty('--ctop', yc + 'px');
    MOMENTS.forEach(m => { m._box.style.top = yOfD(m.at) + yc - (ph ? 20 : 0) + 'px'; m._box.style.height = yOfD(m.at + m.span) - yOfD(m.at) + (ph ? 0 : vh * .7) + 'px'; });
    const wb = secs.years._wall; wb.style.top = yOfD(DWALL) + yc - (ph ? 20 : 0) + 'px'; wb.style.height = vh * .75 + 'px';
    slot._s = 0; if (KF.length) { KF[0][1] = KF[1][1] = F.years; } }
  function fit() {
    if (!host.clientHeight) return;
    /* where the visitor is: kept through a resize or a turn; the window unchanged (the type came), where they are now */
    const same = host.clientHeight === vh && host.clientWidth === VW, keep = sized && !flying ? (same && Math.abs(host.scrollTop - here.y) >= 2 ? anchor() : here.a) : null;
    u = fitU(); vh = host.clientHeight; VW = host.clientWidth; const W = VW, R = root.style, ph = PHONE(), land = ph && LAND(), small = W <= 760 || land;
    /* the bar: on a wide screen its small chip and squares grow a little with the page (a phone's bar, and one on its side, is lower) */
    const ub = ph || u <= 1 ? 1 : Math.min(1.3, 1 + (u - 1) * .5), barH = small ? 62 : Math.round(42 + 30 * ub); let rw = 0, bandH, cxs, SH, SHc = 0;
    top.style.setProperty('--u', ub + 'px'); R.setProperty('--barH', barH + 'px');
    /* the phone's layout: the picture above and the story under it, the cards as wide as a phone or, on a tablet held
       upright, a readable column under a square sized from the window; on a phone on its side, the picture at the left
       as tall as the window, and the count, the curve, the hold button and the story at the right (yct: where the
       fifty years' cards stand) */
    if (ph) { let cw, cl; CMAX = 1e9; bandH = land || vh < 720 ? 64 : 84;
      if (land) { S1 = Sy = vh - barH - 30; top1 = topY = 22; SH = vh - barH; cl = S1 + 28; cxs = cl / 2; cw = W - cl - 14; yct = barH + 4 + 34 + bandH + 8; R.setProperty('--stageW', cl + 'px'); }
      else { /* a phone's picture is sized from the window's height too, so the words under it keep their room */ S1 = Sy = Math.min(W - 28, Math.round(vh * (W <= 760 ? .45 : .48))); top1 = topY = 66; SH = 44 + S1 + bandH + 12; cxs = W / 2; cw = W <= 760 ? W - 28 : Math.min(W - 28, Math.max(S1, 600)); cl = (W - cw) / 2; yct = barH + SH + 10; SHc = SH - bandH; }
      R.setProperty('--stageH', SH + 'px'); R.setProperty('--stageH2', (SHc || SH) + 'px'); R.setProperty('--ctop', (land ? barH + 8 : yct) + 'px'); R.setProperty('--cw', cw + 'px'); R.setProperty('--cl', cl + 'px'); R.setProperty('--ov', '0px');
      /* the narration ends above the hold button wherever the button would lie over it */
      /* the narration ends above the hold button where the button would lie over it, or, where the room under the picture
         is short, stands at its left */
      { const over = !land && cl + cw > W - 96, tight = over && vh - yct < 330; ycard.style.setProperty('--ctop', yct + 'px'); ycard.style.setProperty('--yw', (tight ? cw - 84 : cw) + 'px'); ycard.style.setProperty('--yb', (over && !tight ? 92 : 8) + 'px'); }
      /* after the wall the curve is gone, so the picture's stage is lower and the words under it have its room */
      { const c2 = land || !SHc ? '' : barH + SHc + 10 + 'px'; for (const e of story.children) if (e !== secs.years) { if (c2) e.style.setProperty('--ctop', c2); else e.style.removeProperty('--ctop'); } }
      if (cq.parentNode !== ycard) ycard.appendChild(cq); }
    else { /* the chapters keep a strip of their own at the left, so they never sit over the chip: wide enough for their
        names on a wide screen, for their marks on any other */
      const wide = W >= 1600; rw = (wide ? 170 : 44) * u; const Wc = W - rw; S1 = Math.floor(Math.min(vh - barH - 84 * u, Wc * .44));
      const cw = Math.min((Wc - S1) / 2 - (wide ? 56 : 70) * u, 400 * u), cqw = cw + S1 * .32; R.setProperty('--cw', cw + 'px'); R.setProperty('--cqw', cqw + 'px'); R.setProperty('--ov', S1 * .05 + 'px'); R.setProperty('--ctop', vh * .2 + 'px'); rail.classList.toggle('wide', wide);
      if (cq.parentNode !== band) band.insertBefore(cq, band.firstChild); for (const e of story.children) e.style.removeProperty('--ctop');
      /* the band under the fifty years: its question wider than the column above it, and the band as tall as the longest
         of its questions needs, so none is ever cut off (on a very short window, a phone on its side, it scrolls) */
      bandH = Math.min(Math.max(150 * u, vh * .2, cq.need(cqw) + 24 * u), Math.max(150 * u, vh * .36));
      Sy = Math.floor(Math.min(vh - barH - bandH - 64 * u, Wc * .44)); top1 = barH + (vh - barH - S1) / 2 + 8 * u; topY = barH + (vh - barH - bandH - Sy) / 2 + 8 * u; SH = vh; cxs = W / 2 + rw / 2;
      /* the fifty years' cards stand level with the square and end above the hold button, so it never lies over them */
      yct = topY; CMAX = vh - bandH - 110 * u - yct; secs.years.style.setProperty('--cmax', CMAX + 'px'); }
    BH = ph ? 0 : bandH;
    R.setProperty('--rw', rw + 'px'); R.setProperty('--S', S1 + 'px'); R.setProperty('--top', top1 + 'px'); R.setProperty('--band', bandH + 'px');
    R.setProperty('--hbB', Math.max(10, (vh - top1 - S1) / 2 - 27 * u) + 'px');
    /* the plan: every plate the size it is seen at (so it is sharp, and its controls are real, when the camera is on it).
       The grid follows the window: 6 by 2 on a wide screen, 4 by 3 on most, 3 by 4 on a phone; the path through it is a
       snake, and the channels between blocks widen (a little) until the chip has the window's shape */
    const ot = ph ? 6 : barH + 4 * u, ob = ph ? 6 : 62 * u /* room for the steps under the whole chip */, uw = (land ? S1 + 28 : W - rw) - (ph ? 12 : 40 * u), uh = (SHc || SH) - ot - ob, asp = uw / uh, cols = ph && asp < .9 ? 3 : asp >= 1.8 ? 6 : 4, rows = 12 / cols, M = S1 * .3;
    let pX = S1 * 1.17, pY = S1 * 1.3; const a0 = (2 * M + cols * pX) / (2 * M + rows * pY); if (asp > a0) pX = Math.min(pX * 1.35, ((2 * M + rows * pY) * asp - 2 * M) / cols); else pY = Math.min(pY * 1.35, ((2 * M + cols * pX) / asp - 2 * M) / rows);
    CELLS.forEach((c, i) => { const r = Math.floor(i / cols), k = i % cols; c[1] = r % 2 ? cols - 1 - k : k; c[2] = r; map.children[i].style.order = r * cols + c[1]; }); map.style.gridTemplateColumns = 'repeat(' + cols + ',' + (small ? '8px' : 14 * Math.min(u, ub) + 'px') + ')';
    WW = 2 * M + cols * pX; WH = 2 * M + rows * pY; px(world, 0, 0, WW, WH); px(edge, M * .42, M * .42, WW - M * .84, WH - M * .84);
    CELLS.forEach(([id, c, r]) => { const x = M + c * pX + (pX - S1) / 2, y = M + r * pY + S1 * .225; POS[id] = [x, y]; if (id === 'title') px(title, x, y - S1 * .1, S1, S1 * 1.1); else { px(blks[id], x, y, S1, S1); plates[id].fit(); } });
    { const xs = ['leak', 'distance', 'power', 'price'].map(k => POS[k][0]), ys = ['leak', 'distance', 'power', 'price'].map(k => POS[k][1]), x0 = Math.min(...xs), y0 = Math.min(...ys); px(reg, x0 - S1 * .06, y0 - S1 * .2, Math.max(...xs) - x0 + S1 * 1.12, Math.max(...ys) - y0 + S1 * 1.25); reg.style.display = ph ? 'none' : ''; }
    const pm = M * .21, PP = { lab: [WW / 2, pm], studio: [WW - pm, WH * .3], fab: [WW - pm, WH * .7], test: [WW / 2, WH - pm], port: [pm, WH * .7], datacentre: [pm, WH * .3] }; for (const p in pads) px(pads[p], ...PP[p]);
    F = {}; ORDER.forEach(id => { F[id] = { x: POS[id][0] + S1 / 2, y: POS[id][1] + S1 / 2, k: 1, sx: cxs, sy: top1 + S1 / 2 }; });
    /* the landing: the island's block as large as the window allows above the footer's line (a phone keeps it as it is) */
    Lnd = { ...F.island, k: ph ? 1 : clamp((vh - barH - 58 * u) / (S1 * 1.06), 1, 1.5), sy: ph ? F.island.sy : barH + (vh - barH - 32 * u) / 2 + S1 * .02 };
    R.setProperty('--LS', S1 * Lnd.k + 'px'); R.setProperty('--LB', Math.max(10, vh - Lnd.sy - S1 * Lnd.k / 2) + 'px');
    O = { x: WW / 2, y: WH / 2, k: Math.min(uw / WW, uh / WH), sx: cxs, sy: ot + uh / 2 };
    secs.years.style.height = yOfD(DWALL) + vh * 1.25 + 'px'; rv = rvWant(); layYears();
    /* a headline as large as its card allows, never wider than it ("L’électricité" is longer than "The power") */
    $$('.card .w-h', story).forEach(e => { e.style.fontSize = ''; fitHead(e, parseFloat(getComputedStyle(e).fontSize), 1e9); });
    $$('.card', secs.years).forEach(c => { c.classList.remove('sc'); tall(c); });
    sized = true; slot._s = 0; plan(); chart.fit(); fitBar(); for (const id in plates) plates[id].paint(S.T, 0);
    if (pend) { const r = pend; pend = null; goAddr(r); } else if (keep) restore(keep);
    if (!same) fitAt = performance.now();
  }
  /* where the visitor is, said so that any layout can find it again: in the fifty years, the count (so the year); after
     them, the part of the story (the pull back, a block's section, the end) and how far through it */
  const here = { a: null, y: -1, until: 0 }; let fitAt = -1e9;
  function anchor() {
    const y = host.scrollTop, sy = secs.years, wy = yOfD(DWALL);
    if (y < pull.offsetTop) { const yy = y - sy.offsetTop; return yy <= wy ? { d: dOfY(Math.max(0, yy)) } : { el: sy, past: (yy - wy) / Math.max(1, sy.offsetHeight - wy) }; }
    let el = pull; for (const k of ORDER.slice(1)) if (secs[k].offsetTop <= y + 1) el = secs[k]; if (end.offsetTop <= y + 1) el = end;
    /* at the very end, the end itself (what arrives later keeps you landed) */
    return { el, f: (y - el.offsetTop) / Math.max(1, el.offsetHeight), top: el.offsetTop, last: y >= host.scrollHeight - vh - 2 };
  }
  function yOf(a) { const sy = secs.years, wy = yOfD(DWALL);
    if (a.last) return host.scrollHeight - vh;
    if (a.d != null) return sy.offsetTop + yOfD(a.d);
    if (a.past != null) return sy.offsetTop + wy + a.past * (sy.offsetHeight - wy);
    return a.el.offsetTop + Math.min(a.el.offsetHeight - 2, Math.max(2, a.f * a.el.offsetHeight)); }
  function restore(a) { const y = Math.round(yOf(a)); here.a = a; if (a.el) a.top = a.el.offsetTop; here.y = y; here.until = performance.now() + 1200; host.scrollTo({ top: y, behavior: 'instant' }); onScroll(); }
  /* the camera's path, from where the story's sections are now (again whenever a card grows or shrinks):
     [where on the page, what the camera frames there, whether it pulls back a little on the way in] */
  function plan() {
    if (!sized) return; const ph = PHONE();
    /* a block's name and its thing to try arrive together, one each side (on a phone, in turn); its question after */
    ORDER.slice(1).forEach(id => { const [a, b, c] = secs[id]._c; b.style.marginTop = ph ? '' : vh * .04 - a.offsetHeight + 'px'; if (c) c.style.top = ph ? '' : vh * .17 + a.offsetHeight + 14 * u + 'px'; });
    const T = vh * .75; p0 = pull.offsetTop - vh * .2; KF = [[0, F.years, 0], [p0, F.years, 0], [p0 + vh * .85, O, 0], [p0 + vh * 1.4, O, 0]];
    ORDER.slice(1).forEach(id => { const s = secs[id]; s._out = s.offsetTop + s.offsetHeight - T; KF.push([s.offsetTop, F[id], id === 'leak' ? 0 : 1], [s._out, F[id], 0]); });
    /* the end is a landing: from the island's block the camera goes down to it, and stays */
    KF.push([end.offsetTop + vh * .5, Lnd, 0], [1e9, Lnd, 0]);
    BEATS = [[p0 + vh * 1.1, w('a.chip')]]; if (!ph) ORDER.slice(1).forEach(id => { const s = secs[id]; BEATS.push([s.offsetTop + 2, PW[id].name()]); if (s._c[2]) BEATS.push([fullY(s), w('q.label')]); });
    /* the last step is the landing: the camera comes down to the island's plan; from there the way is in */
    if (!ph) BEATS.push([host.scrollHeight - vh, w('step.land')]);
    if (here.a && performance.now() < here.until && Math.abs(host.scrollTop - here.y) < 2) { const y = Math.round(yOf(here.a)); if (Math.abs(y - here.y) > 1) { here.y = y; host.scrollTo({ top: y, behavior: 'instant' }); } }
    /* later, the story above the part you are at may still grow (a font that arrives late, words filled in): the camera
       stays on that part, unless you have moved since */
    else if (here.a && here.a.top != null && !flying && Math.abs(host.scrollTop - here.y) < 2) { const y = Math.round(here.a.last ? yOf(here.a) : host.scrollTop + here.a.el.offsetTop - here.a.top); here.a.top = here.a.el.offsetTop; if (Math.abs(y - here.y) > 1) { here.y = y; host.scrollTo({ top: y, behavior: 'instant' }); } }
    onScroll();
  }
  let planF = 0; new ResizeObserver(() => { if (!planF) planF = requestAnimationFrame(() => { planF = 0; if (LIVE.on) plan(); }); }).observe(story);
  function camAt(y) { let i = 0; while (i < KF.length - 2 && KF[i + 1][0] <= y) i++; const [y0, a] = KF[i], [y1, b, dip] = KF[i + 1]; if (a === b) return { ...a, a, b, t: 0 };
    const t = clamp((y - y0) / (y1 - y0), 0, 1), e = t * t * (3 - 2 * t), L = (p, q) => p + (q - p) * e;
    return { x: L(a.x, b.x), y: L(a.y, b.y), k: Math.exp(L(Math.log(a.k), Math.log(b.k))) * (1 - (dip ? .34 : 0) * Math.sin(Math.PI * t)), sx: L(a.sx, b.sx), sy: L(a.sy, b.sy), a, b, t }; }

  /* ---- going somewhere: the camera flies (the page scrolls smoothly), it never jumps ---- */
  /* a flight is the page's own: eased in and out, about a second between neighbours and up to two across the chip (the
     browser's smooth scroll was over too soon), and over a long way the cards wait until the camera is there. Any move
     of the visitor's own takes it over */
  function fly(top, smooth) { /* a move you make is where you are from then on, whatever the page was keeping */
    here.a = null; const y0 = host.scrollTop, y1 = clamp(top, 0, host.scrollHeight - vh), far = Math.abs(y1 - y0) / vh;
    if (!smooth || reduce() || far < .02) { land0(); host.scrollTo({ top, behavior: 'instant' }); if (sized) { here.a = anchor(); here.y = host.scrollTop; here.until = 0; } onScroll(); return; }
    flying = 1; anim = { y0, y1, t0: performance.now(), ms: clamp(700 + far * 320, 950, 2100) }; root.classList.toggle('fly', far > 1.6); }
  const land0 = () => { if (anim) { anim = null; flying = 0; root.classList.remove('fly'); } };
  TICK.push(() => { if (!anim) return; const k = clamp((performance.now() - anim.t0) / anim.ms, 0, 1), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(2 - 2 * k, 3) / 2;
    host.scrollTop = anim.y0 + (anim.y1 - anim.y0) * e; if (k >= 1) { land0(); onScroll(); } });
  for (const ev of ['wheel', 'touchstart', 'pointerdown']) host.addEventListener(ev, () => { if (anim) { land0(); onScroll(); } }, { passive: true });
  /* the steps after the wall: the whole chip, then each block as it arrives and its question; after the last, inside */
  function step(dir) { touch(); const y = anim ? anim.y1 : host.scrollTop;
    if (dir > 0) { const b = BEATS.find(b => b[0] > y + 12); if (b) fly(b[0], true); else if (goIn) goIn(); }
    else { const b = BEATS.filter(b => b[0] < y - 12).pop(); fly(b ? b[0] : secs.years.offsetTop + yOfD(DWALL), true); } }
  function goPlate(id, d, full, smooth) { touch(); const sec = secs[id], ph = PHONE(); let top = sec.offsetTop + 2;
    if (id === 'years') top = sec.offsetTop + yOfD(d || 0);
    else if (ph) top = full ? sec.offsetTop + sec._c[1].offsetTop - parseFloat(getComputedStyle(sec._c[1]).top) + 6 : top;
    else if (full) top = fullY(sec);
    fly(top, smooth && id !== 'years'); }
  /* where a block's last card (its question, or else its thing to try) has come to rest */
  function fullY(sec) { const c = sec._c[2] || sec._c[1], st = parseFloat(getComputedStyle(c).top) || 0; c.style.position = 'static'; const nat = c.offsetTop; c.style.position = ''; return Math.max(sec.offsetTop + 2, sec.offsetTop + nat - st + 40); }
  const goOver = () => { touch(); fly(p0 + vh * 1.1, true); };
  function goChallenge(id) { const [pid, d] = CH_AT[id]; goPlate(pid, d, false, true); }
  S.onWallGo = goOver;

  /* ---- the address says where the camera is: #/hold/<block> after the wall (#/hold/chip pulled back, #/hold/end at the
     end), #/hold/years/<year> in the fifty years, #/hold/<moment> at a moment; #/ alone is the start. It is written as
     the camera settles, in place (never an entry of the history per block), and opening it, or reloading (day or night
     and the language reload the page), puts the camera there with no flight. A challenge's address is #/hold/<id> ---- */
  let said = null, pend = null, sayTm = 0, sayBlk = null;
  const ours = r => !r || r === '#' || r === '#/' || /^#\/hold(\/|$)/.test(r);
  function addrOf() { const a = here.a || anchor();
    if (a.d != null || a.past != null) { const d = a.past != null ? DWALL : a.d, m = momAt(d), y = yearShown(d); return m ? '#/hold/' + m.id : y <= yearShown(0) ? '#/' : '#/hold/years/' + y; }
    return a.el === pull ? '#/hold/chip' : a.el === end ? '#/hold/end' : '#/hold/' + a.el.dataset.id; }
  function goAddr(r) { const p = r.replace(/^#\/?/, '').split('/'), id = p[1] || ''; said = r;
    if (p[0] !== 'hold' || !id) { host.scrollTo({ top: 0, behavior: 'instant' }); onScroll(); }
    else if (id === 'years') goPlate('years', clamp(dAt(+p[2] || 0), 0, DWALL), false, false);
    else if (id === 'chip') fly(p0 + vh * 1.1, false); else if (id === 'end') fly(host.scrollHeight, false);
    else if (secs[id] || CH_AT[id]) goPlate(...(secs[id] ? [id, null] : CH_AT[id]), false, false); }
  const fromAddr = () => { const r = location.hash || '#/'; if (r === said || !ours(r)) return; if (sized) goAddr(r); else pend = r; };
  function settle() { if (!LIVE.on || flying || !sized || !ours(location.hash)) return; const a = addrOf(), b = /^#\/hold\/([a-z]+)$/.exec(a); said = a;
    if (a !== (location.hash || '#/')) history.replaceState(history.state, '', a);
    const blk = b && secs[b[1]] && b[1] !== 'years' ? b[1] : null; if (blk && blk !== sayBlk) say(PW[blk].name()); sayBlk = blk; }

  function onScroll() {
    if (!sized) return;
    const y = host.scrollTop; let id = 'years';
    /* where you are changes only as the page scrolls: a call with nothing scrolled (a word filled in, a card grown) keeps
       it, and so does a scroll the browser makes itself as the window changes shape (for half a second after a new
       layout, the place the layout was given stands) */
    if (host.clientHeight === vh && host.clientWidth === VW && !flying && !(here.a && performance.now() < here.until && Math.abs(y - here.y) < 2) && (!here.a || (Math.abs(y - here.y) >= 1 && performance.now() - fitAt > 500))) { here.a = anchor(); here.y = y; here.until = 0; } for (const k of ORDER) if (secs[k].offsetTop <= y + 1) id = k;
    if (y > 40) touch();
    if (y < pull.offsetTop) { if (!flying) { const yy = y - secs.years.offsetTop; Yr.set(yy >= yOfD(DWALL) - 2 ? DWALL : dOfY(yy)); } } else if (!flying && S.d < DWALL) Yr.set(DWALL);
    if (id !== cur) { cur = id; setHolding(false); } if (id !== 'years') more();
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
    /* the keyboard and a screen reader find only what the camera is on: the block's controls, or with the whole chip in
       view each block's way in and the pads */
    for (const p in pads) inert(pads[p], !over);
    ORDER.forEach(k => { const b = blks[k], f = F[k], isF = q => q === f || (k === 'island' && q === Lnd), main = isF(C.a) || isF(C.b) || (k === 'years' && yrs); inert(b, !main && !over); inert(plates[k].ui, !main); b.classList.toggle('cur', main); b.classList.toggle('live', (settled && isF(C.a)) || (k === 'island' && isF(C.a) && isF(C.b))); if (k in WALL_OF) { b.classList.toggle('found', y >= secs.leak.offsetTop || sxw > POS[k][0] + S1 / 2); b.classList.toggle('tried', !!S.tried[WID[WALL_OF[k]]]); } });
    ORDER.slice(1).forEach(k => { const s = secs[k], o = 1 - ss(0, .3, (y - s._out) / (vh * .75)); s.style.opacity = o; s.style.pointerEvents = o < .5 ? 'none' : ''; s.style.visibility = o < .01 ? 'hidden' : ''; });
    if (was !== yrs || !slot._s) { slot._s = 1; const Sx = yrs ? lerp(S1, Sy, rv) : S1; slot.style.setProperty('--S', Sx + 'px'); slot.style.setProperty('--top', (yrs ? F.years.sy - Sx / 2 : F.leak.sy - S1 / 2) + 'px'); holdBox.style.setProperty('--S', Sx + 'px');
      holdBox.style.setProperty('--hb', (PHONE() ? 14 : !yrs ? 22 * u : lerp(Math.max(22 * u, vh - top1 - S1), BH + 22 * u, rv)) + 'px'); }
    root.classList.toggle('chipm', !yrs); hud.classList.toggle('off', !yrs); band.classList.toggle('off', !yrs); band.classList.toggle('wait', yrs && rvWant() < 1); holdBox.classList.toggle('chip', !yrs); holdBox.classList.toggle('over', !yrs && over);
    /* the landing: past the island's cards the block is alone with its way in */
    const ending = y > secs.island.offsetTop && y >= host.scrollHeight - vh - vh * .3; root.classList.toggle('landing', ending);
    if (!yrs) { const nb = BEATS.find(b => b[0] > (anim ? anim.y1 : y) + 12); put(stN, nb ? nb[1] : S.kept ? w('isle.go') : w('isle.go0')); stp.lastChild.classList.toggle('in', !nb); }
    const inChip = !yrs && over, ch = PW[cur].ch, n = CHAPS.indexOf(ch) + 1, chW = chapL._h; put(chapL, inChip ? '<b>' + w('a.chip') + '</b>' : w('b.chap', { n }) + '<b>' + w('tab.' + ch) + '</b>'); if (chapL._h !== chW) fitBar();
    [...rail.children].forEach(b => b.classList.toggle('on', !inChip && b.dataset.ch === ch)); [...map.children].forEach(b => b.classList.toggle('on', inChip ? b.dataset.id === 'title' : b.dataset.id === cur));
    const on = [null, null]; if (settled) $$('.card[data-x],.card[data-sel]', story).forEach(c => { const r = c.getBoundingClientRect(), m = r.top + Math.min(r.height, 200) / 2; if (m > vh * .16 && m < vh * .8) { const n = +($('.n', c) || {}).textContent - 1; if (n >= 0 && (!c.dataset.mom || c.dataset.mom === viewAt(S.d))) on[n] = c; } });
    mks.forEach((e, i) => { const c = on[i]; e.classList.toggle('on', !!c); if (c) { const [x, y] = markAt(c, e); e.style.left = x + '%'; e.style.top = y + '%'; } });
    rvMap(); clearTimeout(sayTm); if (!flying) sayTm = setTimeout(settle, 400);
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
  onChange(() => { chipState(); onScroll(); fitBar(); });
  /* the space bar holds, as the button does; not while typing, or in the lab's bar or its dialogs */
  /* i18n-ok: selectors */ const away = e => !LIVE.on || (e.target.closest && e.target.closest('input,textarea,select,[contenteditable],.bar,.breakp,[role=dialog]'));
  addEventListener('keydown', e => { if (away(e)) return; const past = host.scrollTop >= p0 + vh;
    if (e.key === ' ' && !e.repeat) { e.preventDefault(); touch(); if (past) step(1); else setHolding(true); }
    else if (past && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('input,.seg,.d-map,.sq')) { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); } });
  addEventListener('keyup', e => { if (e.key === ' ') setHolding(false); });
  const hintKey = d => (!yrs ? 'x' : d < .01 ? 'gate' : d >= DWALL - 1e-4 ? 'wall' : momAt(d) ? 'moment' : d > D2011 ? 'pay' : d > 16.5 && d < 20.5 ? 'coast' : 'run');
  const seen = id => { const [x, y] = POS[id], l = C.sx + C.k * (x - C.x), tp = C.sy + C.k * (y - C.y), s = C.k * S1; return l < VW && l + s > 0 && tp < vh && tp + s > 0; };
  TICK.push((T, dt) => { fr++;
    if (S.holding && host.scrollTop < p0 + vh * 1.1) { const max = host.scrollHeight - vh; let v = vh * .8;
      if (yrs && host.scrollTop < pull.offsetTop) { const d = S.d, m = momAt(d), dv = m ? .44 : d < 2 ? .8 : d > D2011 ? 1.15 - .62 * ss(D2011, DWALL, d) : 2.2; v = d >= DWALL - 1e-4 ? (Yr.wallPush = Math.min(1, Yr.wallPush + dt * 2.5), Yr.wallPush >= 1 ? vh * .5 : 0) : dv * base() * (m ? 3 : 1); }
      if (host.scrollTop < max) host.scrollBy(0, Math.max(1, v * dt)); }
    else Yr.wallPush *= Math.pow(.02, dt);
    S.press += ((S.holding && S.d < .6 ? 1 : 0) - S.press) * Math.min(1, dt * 12);
    /* Moore's law rises, and the square eases back to make room */
    { const to = rvWant(); if (rv !== to) { rv = reduce() || Math.abs(to - rv) < .004 ? to : rv + (to - rv) * Math.min(1, dt * 4.5); layYears(); onScroll(); } }
    /* the hold button's ring: how far through the fifty years the hold has come */
    if (yrs) holdBox.style.setProperty('--pr', (S.d / DWALL).toFixed(4));
    root.classList.toggle('at0', yrs && S.d < .5 && S.press < .5); root.classList.toggle('fresh', S.cq.maxD < .9);
    if (!C) return; const far = !yrs || S.d > 9;
    ORDER.forEach((id, i) => { const f = F[id], main = f === C.a || f === C.b || (id === 'island' && C.b === Lnd); if (main || (far && fr % 4 === i % 4 && seen(id))) plates[id].paint(T, main ? dt : dt * 4); });
    const d = S.d, mom = momAt(d), wall = d >= DWALL - 1e-4;
    if (yrs) { MOMENTS.forEach(m => { m._box.firstChild.style.opacity = PHONE() ? (d >= m.at - .05 && d < m.at + m.span ? 1 : 0) : ss(m.at - 1.1, m.at - .4, d) * (1 - ss(m.at + m.span - .05, m.at + m.span + .5, d)); const on = d >= m.at - .4 && d < m.at + m.span + .3; m._box.firstChild.style.pointerEvents = on ? '' : 'none'; inert(m._box, !on); });
      chart.paint(T); const cp = countParts(d), say = mom || wall ? '' : yearsWordsHTML(d); put($('.count', hud), cp[0] + '<small>' + (cp[2] ? '<em>' + cp[2] + '</em> ' : '') + cp[1] + '</small>'); put($('.stats', hud), statsHTML(d)); put($('.say', hud), say); put($('.say', ycard), say);
      /* the questions on the curve wait for the curve */
      const early = S.cq.maxD < RISE; if (cq._e !== early) { cq._e = early; cq.style.display = early ? 'none' : ''; } }
    ycard.classList.toggle('off', !yrs || !!mom || wall); holdBox.classList.toggle('quiet', yrs && (!!mom || wall));
    const hk = hintKey(d); if (hk !== 'x') put(hint, w('hint.' + hk));
    /* said aloud: a moment or the wall as it comes; while you hold, the count and the year, at most once a second */
    const ev = !yrs ? '' : wall ? 'wall' : mom ? mom.id : '';
    if (ev !== heard) { heard = ev; if (ev) { say(ev === 'wall' ? w('m.wall.h') + '. ' + w('m.wall.p') : w('mo.' + ev + '.k') + '. ' + w('mo.' + ev + '.q')); sayAt = T + 2.5; } }
    else if (yrs && S.holding && T >= sayAt) { const c = countSay(d); if (c !== voice.textContent) { say(c); sayAt = T + 1; } }
  });
  let heard = '', sayAt = 0;

  /* the first touch (a scroll, a hold, a tap; or an idle moment once the page's own preload has started): the facts
     behind the marks, the blueprint's words for what people are trying, and the words Hold shares with other pages (the
     walls, the needs: shared.json). Where the preload never starts (off: a connection that saves data), only a touch
     fetches them */
  /* the island's plan and the way in, the page's last picture (src/v2/holdisle.js): asked for with the first touch, or
     as soon as the camera is past the wall */
  let moreP = null;
  const more = () => moreP || (moreP = import('./holdisle.js').then(m => { const pl = plates.island; Object.assign(PL.island, m.ISLAND); PL.island.ui(pl.ui, pl); pl.paint(S.T, 0); goIn = m.landing(host, root, pl, ctx, end, () => sheet(true)); onScroll(); }, () => { moreP = null; }));
  const late = () => import('./holdboard.js');
  let touched = false;
  function touch() { if (touched || !document.documentElement.dataset.preload) return; touched = true; loadFacts(); more();
    /* words that did not come (the page was left, the connection dropped) are asked for again at the next touch; once
       in, the story above may grow, and the camera stays where it was (plan) */
    needWords('blueprint', 'shared').then(() => { fillWays(); fillShared(); out('machine'); if (!hasWords('blueprint') || !hasWords('shared')) touched = false; }, () => { touched = false; }); }
  const idleTouch = () => { if (touched || !LIVE.on || document.documentElement.dataset.preload === 'off') return; if (document.documentElement.dataset.preload) (window.requestIdleCallback ? requestIdleCallback(touch, { timeout: 1500 }) : setTimeout(touch, 1500)); else setTimeout(idleTouch, 600); };

  /* for checks */
  window.__hold = { set: v => goPlate('years', v === 99 ? DWALL : v, false, false), go: (id, d) => goPlate(id, d === 99 ? DWALL : d, true), ch: goChallenge, at: id => (id === 'pull' ? p0 + vh * 1.1 : secs[id].offsetTop), chartX: y => chart.el.getBoundingClientRect().left + chart.X(y),
    state: () => ({ d: S.d, cur, chip: !yrs, fly: !!anim, holding: S.holding, done: Object.keys(S.done), tried: Object.keys(S.tried), place: S.place, kept: S.kept, ways: !!$('.w-ways button[data-way]:not([hidden])', story) }), S };

  /* the page's type, once */
  let ready = null;
  const prepare = () => ready || (ready = new Promise(res => {
    /* i18n-ok: a selector */ if (document.querySelector('link[data-hold-fonts]')) return res();
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = lang() === 'zh' ? FONTS + '&' + FONTS_ZH.split('?')[1] : FONTS; l.dataset.holdFonts = '1'; l.onload = l.onerror = res; document.head.appendChild(l); setTimeout(res, 1500); }).then(() => (document.fonts ? document.fonts.ready : null)));
  const bar = () => document.querySelector('.bar');
  return {
    show() { host.hidden = false; host.style.scrollBehavior = 'auto';
      const b = bar(), lp = b && b.querySelector('#loop'); if (lp && top.parentNode !== b) lp.after(top); if (b) b.prepend(skip);
      LIVE.on = true; fit(); chipState(); loop(true); idleTouch(); fromAddr();
      return prepare().then(() => { if (LIVE.on) fit(); }); },
    hide() { host.hidden = true; LIVE.on = false; loop(false); setHolding(false); top.remove(); skip.remove(); clearTimeout(sayTm); }
  };
}
