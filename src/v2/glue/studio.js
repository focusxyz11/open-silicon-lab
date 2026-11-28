/* The studio (#/studio/<level>, #506): your chip as designed, one die drawn in dashed outline and zoomed die → block →
   cells → one cell with no cut (src/v2/studio/view.js; docs/prototypes/studio-fab/GUIDE.md §2). It replaces the room
   walked through (kept on the branch claude/before-studio2-2026-11). It draws the one record of your chip
   (src/engines/chiprecord.js, docs/CHIP.md): your stack as the stack keeps it, your design as the bench keeps it, the
   line's care as your stack sets it. It wears the lab's one frame: the rail holds the four levels it draws, the card
   says where you are and leads in, out and along (the same level at Make and Use, src/engines/way.js alongTo).
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t } from '../../core/i18n.js';
import { still } from '../../core/ui.js';
import * as Way from '../../engines/way.js';
import * as A from '../../engines/arch.js';
import { build } from '../../engines/design.js';
import * as Now from '../studio/now.js';
import * as PL from '../../engines/placer.js';
import { proposeArrangement } from '../../engines/floorplan.js';
import { keepGene, keepFine } from '../stack/keep.js';
import { CARE, CHOICES } from '../../data/path.js';
import { STUDIO_MARKS } from '../../data/frame.js';
import { questionOf } from '../../engines/frame.js';
import { mark } from '../fid.js';
import { sizeOf } from '../../data/atlas.js';
import { V, $, showStage, esc } from '../shell.js';

export const STUDIO_LEVELS = ['chip', 'block', 'gate', 'switch'];
/* inside a station of the line (#512): the station (its machine and your wafer), then your die as made, down to a switch */
export const FAB_LEVELS = ['station', 'chip', 'block', 'gate', 'switch'], FAB_STEPS = ['crystal', 'deposit', 'print', 'etch', 'implant', 'wires', 'test'];
/* Arrange (#507): the recipe's shape and where it computes, four options each, set here and kept in your stack */
export const ARRANGE = ['shape', 'where'];
/* the record of your chip now, shared with the line (src/v2/studio/now.js) */
const designNow = () => Now.designNow(V.S), keepDesign = Now.keepDesign;
export const recordNow = () => Now.recordNow(V.S);
/* the questions' marks on the studio's and the stations' parts (#514): by the part each bites at, never listed */
const studioMarks = d => (STUDIO_MARKS[d] || []).map(([id, word]) => ({ id, word, label: t('frame.q.' + id), icon: questionOf(id).icon }));

/* the picture's safe area: the frame's, and on a wide screen right of the caption that rests at the bottom left, so the
   part in focus never stands under it, and clear of the ways in and along at the right */
function inset() {
  const I = Object.assign({}, V.frameInset(V.swFrame)), dw = V.swFrame && V.swFrame.dock.parentNode;
  if (dw && innerWidth >= 1100) { const r = dw.getBoundingClientRect(); if (r.left < innerWidth / 2 && r.bottom > innerHeight - 60) I.l = Math.max(I.l, Math.round(r.right + 28)); I.r = Math.max(I.r, 190); I.b = Math.max(I.b, 40); }
  /* a band kept for the strip of controls, the same at every level, so the framing never moves under the camera as the
     strip changes: the strip is never over the part in focus or its figures */
  I.b = innerWidth >= 1100 ? Math.max(I.b, 160) : I.b + 150;
  return I;
}
export function create() {
  let view = null, viewP = null, rec = null, lv = 'chip', fab = null;
  /* the session's checks of the block (#508): the states tested and what they found, the wire once settled */
  let cover = null, settled = null, settling = 0, runs = 0;
  /* an agent's proposal waiting for the person (#510): shown, never applied until Take it */
  let proposal = null;
  const extra = () => ({ cover, settled });
  const ensure = () => viewP || (viewP = import('../studio/view.js').then(m => {
    view = m.createStudio($('studioCanvas'), $('studioLabels'), { words: t, mark, still, inset,
      level: (l, pos) => { if (V.swFrame) { V.swFrame.rail(l, null, pos); if (l !== lv) { lv = l; V.swFrame.level(l === 'station' ? fab : l); history.replaceState(null, '', fab ? '#/fab/' + fab + '/' + l : '#/studio/' + l); V.here(); if (V.swFrame.mode() === 'look') (fab ? drawFabCard : drawCard)(); } } },
      tap: l => go(l), swap: (a, b) => fab ? null : placeTo(PL.swapOf(B(), placeNow(), +a.slice(1), +b.slice(1))) });
    return view;
  }));
  const go = l => { if (!view || !(fab ? FAB_LEVELS : STUDIO_LEVELS).includes(l)) return; view.go(l); };
  /* the card: where you are in one line, then in, out and along */
  function drawCard() {
    if (!V.swFrame || !rec) return;
    const i = STUDIO_LEVELS.indexOf(lv), nm = l => t('depth.' + l + '.name'), D = rec.designed;
    const line = D.broken === 'empty' ? t('sd.line.empty') : D.broken === 'design' ? t('sd.line.broken') : D.broken === 'switch' ? t('sd.line.switchOff') : D.late && (lv === 'block' || lv === 'gate') ? t('sd.line.late') : t('sd.line.' + lv);
    const W = Way.whereOf('#/studio/' + lv), make = Way.alongTo(W, 'make'), use = Way.alongTo(W, 'use');
    /* the controls of the level in view, in one strip at the bottom centre (GUIDE.md §4): at the chip, Arrange, the two
       genes the floorplan is laid out by, each option a button */
    const arrange = lv !== 'chip' ? '' : '<div class="sdarr">' + ARRANGE.map(k => '<div class="sdgene" role="group" aria-label="' + esc(t('ar.gene.' + k)) + '"><p class="kicker">' + esc(t('ar.gene.' + k)) + '</p><div class="sdopts">' +
      Object.keys(A.CARRY[k]).map(o => '<button type="button" class="chipb' + (D.recipe[k] === o ? ' on' : '') + '" data-gene="' + k + '" data-opt="' + o + '" aria-pressed="' + (D.recipe[k] === o) + '" title="' + esc(t('ar.opt.' + k + '.' + o + '.d')) + '">' + esc(t('ar.opt.' + k + '.' + o)) + '</button>').join('') + '</div></div>').join('') +
      '</div>' + askBtn('arr');
    /* at the block: the placement by hand, scrambled, settled, and the tests; at the gate: the clock to meet */
    const built = !!(D.cells.length && rec.designed.timing), C = built ? PL.coverageOf(B()) : null;
    const block = lv !== 'block' || !built ? '' : '<div class="sdarr"><div class="sdgene"><p class="kicker">' + esc(t('sd.ctl.place')) + '</p><div class="sdopts">' +
      ['hand', 'scramble', 'settle'].map(k => '<button type="button" class="chipb" data-place="' + k + '"' + (k === 'settle' && settling ? ' disabled' : '') + '>' + esc(t('sd.ctl.' + k)) + '</button>').join('') + '</div></div>' +
      '<div class="sdgene"><p class="kicker">' + esc(t('sd.ctl.check')) + '</p><div class="sdopts"><button type="button" class="chipb" data-tests="some">' + esc(t('sd.ctl.random', { n: PL.randomCount(C) })) + '</button><button type="button" class="chipb" data-tests="all">' + esc(t('sd.ctl.all')) + '</button></div></div>' +
      '</div>' + askBtn('place');
    const clocks = built ? PL.clocksOf(B()) : [];
    const gate = lv !== 'gate' || !built ? '' : '<div class="sdarr"><div class="sdgene"><p class="kicker">' + esc(t('sd.ctl.clock')) + '</p><div class="sdopts">' +
      PL.CLOCKS.map((k, i) => '<button type="button" class="chipb' + (D.clock === i ? ' on' : '') + '" data-clock="' + i + '" aria-pressed="' + (D.clock === i) + '">' + esc(t('sd.ctl.clockOpt', { ps: clocks[i], mhz: Math.round(1e6 / clocks[i]) })) + '</button>').join('') + '</div></div></div>';
    const strip = arrange || block || gate; controls(strip ? agentCard() + strip : '');
    V.swFrame.dock.innerHTML = V.lineHtml(t('sd.k') + ' · ' + nm(lv), line, null, V.aroundRow(
      i > 0 ? '<button type="button" class="chipb" data-key="back" data-sdgo="' + STUDIO_LEVELS[i - 1] + '">↑ ' + esc(nm(STUDIO_LEVELS[i - 1])) + '</button>' : '',
      i < STUDIO_LEVELS.length - 1 ? '<button type="button" class="chipb" data-key="next" data-in data-inname="' + esc(nm(STUDIO_LEVELS[i + 1])) + '" data-sdgo="' + STUDIO_LEVELS[i + 1] + '">↓ ' + esc(nm(STUDIO_LEVELS[i + 1])) + '</button>' : '',
      make ? '<a class="chipb" data-along data-alongname="' + esc(t('sd.toMake', { level: nm(lv) })) + '" href="' + esc(make) + '">→ ' + esc(t('sd.toMake', { level: nm(lv) })) + '</a>' : '',
      use ? '<a class="chipb" href="' + esc(use) + '">' + esc(t('sd.toUse', { level: nm(lv) })) + '</a>' : '',
      '<a class="chipb" href="#/stack/design/' + esc(lv) + '">' + esc(t('sd.toStack')) + '</a>',
      D.broken === 'empty' || D.broken === 'design' ? '<a class="chipb" href="#/bench/logic">' + esc(t('sd.toBench')) + '</a>' : ''));
  }
  function showStudio(level, from) {
    fab = null;
    V.hideAll();
    $('studioCanvas').hidden = $('studioLabels').hidden = false; V.sui.hidden = false; showStage(true); document.body.classList.add('immersive');
    V.loading(true); V.lastPlace = 'studio';
    const rn = V.routeN, fromIsland = V.arriving; V.arriving = false;
    lv = STUDIO_LEVELS.includes(level) ? level : 'chip';
    return Promise.all([V.withFrame(), ensure()]).then(([, d]) => { if (rn !== V.routeN) return;
      rec = recordNow(); cover = null; settled = null; proposal = null;
      V.swFrame = V.frameOf(V.sui, { up: { href: '#/place/studio', label: t('place.back') }, path: [{ href: '#/island', label: t('place.back') }, { href: '#/place/studio', label: t('map.studio.t') }, { label: t('sd.k') }],
        rail: { label: t('sd.rail'), items: STUDIO_LEVELS.map(k => ({ id: k, label: t('depth.' + k + '.name'), size: sizeOf(k) })) },
        onRail: k => go(k), onLook: drawCard, scroll: true, caption: true, marksAt: studioMarks });
      V.sui.onclick = e => { const g = e.target.closest('[data-sdgo]'); if (g) { e.preventDefault(); go(g.dataset.sdgo); }
        const a = e.target.closest('[data-gene]'); if (a) { e.preventDefault(); arrangeTo(a.dataset.gene, a.dataset.opt); }
        const p = e.target.closest('[data-place]'); if (p) { e.preventDefault(); placeBy(p.dataset.place); }
        const k = e.target.closest('[data-tests]'); if (k) { e.preventDefault(); testBy(k.dataset.tests); }
        const ag = e.target.closest('[data-agent]'); if (ag) { e.preventDefault(); askAgent(ag.dataset.agent); }
        const tk = e.target.closest('[data-take]'); if (tk) { e.preventDefault(); if (tk.dataset.take === '1') takeProposal(); else { proposal = null; drawCard(); } }
        const c = e.target.closest('[data-clock]'); if (c) { e.preventDefault(); const d = designNow(); d.clock = +c.dataset.clock; keepDesign(d); remake(); } };
      V.loading(false);
      V.sui.dataset.broken = rec.designed.broken || ''; V.sui.dataset.recipe = A.keyOf(rec.designed.recipe);
      /* from the island the camera comes down onto the die; otherwise it opens at the level the address says */
      const start = fromIsland && lv !== 'chip' ? 'chip' : lv;
      d.show(rec, start, true, extra()); if (start !== lv) d.go(lv); tellBlock();
      V.swFrame.rail(lv, null, STUDIO_LEVELS.indexOf(lv)); V.swFrame.level(lv); drawCard(); V.here();
      $('studioCanvas').focus({ preventScroll: true });
    });
  }
  /* ---- inside a station (#512, GUIDE.md §3): the machine at work and your wafer, then your die as made down to one
     switch, one camera; ← → slide to the next station at the same depth, holding the part ---- */
  function showFab(step, level, from) {
    V.hideAll();
    $('studioCanvas').hidden = $('studioLabels').hidden = false; V.sui.hidden = false; showStage(true); document.body.classList.add('immersive');
    V.loading(true); V.lastPlace = 'fab';
    const rn = V.routeN; fab = FAB_STEPS.includes(step) ? step : 'print'; lv = FAB_LEVELS.includes(level) ? level : 'station';
    return Promise.all([V.withFrame(), ensure()]).then(([, d]) => { if (rn !== V.routeN) return;
      rec = recordNow(); proposal = null; cover = null; settled = null;
      V.swFrame = V.frameOf(V.sui, { up: { href: '#/line/' + fab, label: t('sd.fab.back') }, path: [{ href: '#/island', label: t('place.back') }, { href: '#/place/fab', label: t('map.fab.t') }, { href: '#/line/' + fab, label: t('depth.' + fab + '.name') }, { label: t('sd.fab.inside') }],
        rail: { label: t('sd.fab.rail'), items: FAB_LEVELS.map(k => ({ id: k, label: k === 'station' ? t('sd.fab.station') : t('depth.' + k + '.name'), size: k === 'station' ? 0.3 : sizeOf(k) })) },
        onRail: k => go(k), onLook: drawFabCard, scroll: true, caption: true, marksAt: d => (FAB_STEPS.includes(d) ? studioMarks(d) : []) });
      V.sui.onclick = e => { const g = e.target.closest('[data-sdgo]'); if (g) { e.preventDefault(); go(g.dataset.sdgo); }
        const c = e.target.closest('[data-careset]'); if (c) { e.preventDefault(); careTo(+c.dataset.careset); } };
      V.loading(false); careStrip();
      V.sui.dataset.fab = fab; V.sui.dataset.care = String(rec.care); V.sui.dataset.broken = rec.designed.broken || '';
      /* along from the station before (at the same level) the camera holds its depth: it opens there, framed */
      d.show(rec, lv, true, { made: fab });
      V.swFrame.rail(lv, null, FAB_LEVELS.indexOf(lv)); V.swFrame.level(lv === 'station' ? fab : lv); drawFabCard(); V.here();
      $('studioCanvas').focus({ preventScroll: true });
    });
  }
  /* the line's care, set where it happens (#513): the dose at Print, the cleanroom at Deposit. One setting of your stack
     (CARE in src/data/path.js) sets both for now; each station shows the part it sets. A change remakes the record, and
     the gates' edges, the stray copies, the failed dies and the stack follow at once */
  function careStrip() {
    if (!fab || (fab !== 'print' && fab !== 'deposit')) { controls(''); return; }
    const c = rec.care;
    controls('<div class="sdarr"><div class="sdgene"><p class="kicker">' + esc(t(fab === 'print' ? 'sd.care.dose' : 'sd.care.clean')) + '</p><div class="sdopts">' +
      CHOICES.care.map(k => '<button type="button" class="chipb' + (c === k ? ' on' : '') + '" data-careset="' + k + '" aria-pressed="' + (c === k) + '">' + esc(t('sd.care.' + k, fab === 'print' ? { v: CARE.dose[k] + ' mJ/cm²' } : { v: 'ISO ' + CARE.clean[k] })) + '</button>').join('') +
      '</div><p class="sdnote">' + esc(t('sd.care.both')) + '</p></div></div>');
  }
  function careTo(k) {
    keepFine(localStorage, 'care', k); rec = recordNow(); if (view) view.update(rec, { made: fab });
    V.sui.dataset.care = String(rec.care); careStrip(); drawFabCard(); V.hud();
  }
  function drawFabCard() {
    if (!V.swFrame || !rec || !fab) return;
    const i = FAB_LEVELS.indexOf(lv), k = FAB_STEPS.indexOf(fab), nm = l => (l === 'station' ? t('sd.fab.station') : t('depth.' + l + '.name')), st = s => t('depth.' + s + '.name');
    const prev = FAB_STEPS[k - 1], next = FAB_STEPS[k + 1], D = rec.designed;
    const line = D.broken && k >= 2 ? t('sd.fab.stopped') : t('sd.fab.line.' + fab);
    V.swFrame.dock.innerHTML = V.lineHtml(t('sd.fab.k') + ' · ' + st(fab) + (lv !== 'station' ? ' · ' + nm(lv) : ''), line, null, V.aroundRow(
      i > 0 ? '<button type="button" class="chipb" data-out data-sdgo="' + FAB_LEVELS[i - 1] + '">↑ ' + esc(nm(FAB_LEVELS[i - 1])) + '</button>' : '',
      i < FAB_LEVELS.length - 1 ? '<button type="button" class="chipb" data-in data-inname="' + esc(nm(FAB_LEVELS[i + 1])) + '" data-sdgo="' + FAB_LEVELS[i + 1] + '">↓ ' + esc(nm(FAB_LEVELS[i + 1])) + '</button>' : '',
      prev ? '<a class="chipb" data-key="back" href="#/fab/' + prev + '/' + lv + '">← ' + esc(st(prev)) + '</a>' : '',
      next ? '<a class="chipb" data-key="next" data-along data-alongname="' + esc(st(next)) + '" href="#/fab/' + next + '/' + lv + '">→ ' + esc(st(next)) + '</a>' : '<a class="chipb" data-key="next" data-along href="#/line/test">→ ' + esc(t('sd.fab.toLine')) + '</a>',
      lv !== 'station' ? '<a class="chipb" href="#/studio/' + esc(lv) + '">' + esc(t('sd.fab.toStudio', { level: nm(lv) })) + '</a>' : ''));
  }
  /* the strip of controls over the picture, made with the frame and filled for the level in view */
  function controls(html) {
    let el = V.sui.querySelector('.sdctl');
    if (!el) { el = document.createElement('div'); el.className = 'sdctl'; V.sui.appendChild(el); }
    el.hidden = !html; el.innerHTML = html;
    /* on a wide screen, centred between the caption at the left and the ways in and along at the right */
    const dw = V.swFrame && V.swFrame.dock.parentNode;
    if (html && dw && innerWidth >= 1100) { const l = dw.getBoundingClientRect().right + 20, r = innerWidth - 220; el.style.left = Math.round((l + r) / 2) + 'px'; el.style.maxWidth = Math.round(r - l) + 'px'; }
    else { el.style.left = ''; el.style.maxWidth = ''; }
  }
  /* a gene set in Arrange: kept in your stack, the record made again, the die drawn again where the camera is */
  function arrangeTo(gene, opt) {
    keepGene(localStorage, gene, opt); rec = recordNow(); if (view) view.update(rec, extra());
    V.sui.dataset.recipe = A.keyOf(rec.designed.recipe); drawCard(); V.hud();
  }
  /* ---- your block (#508) ---- */
  const B = () => build(designNow());
  const placeNow = () => { const D = rec.designed; return Object.fromEntries(D.cells.map((c, i) => [i, c.slot])); };
  /* the record made again after a change to the design's placement or clock, drawn where the camera is */
  function remake() { rec = recordNow(); if (view) view.update(rec, extra()); tellBlock(); drawCard(); V.hud(); }
  function placeTo(place, more) { const d = designNow(); d.place = Object.fromEntries(Object.entries(place).map(([i, p]) => [i, { x: p.x, r: p.r }])); keepDesign(d, more); remake(); }
  /* by hand (the lab's example: no placement kept), scrambled, or settled while you watch (at once with reduced motion) */
  function placeBy(how) {
    const b = B();
    if (how === 'hand') { settled = null; const d = designNow(); delete d.place; keepDesign(d); remake(); return; }
    if (how === 'scramble') { settled = null; placeTo(PL.scrambleOf(b, ++runs + 2)); return; }
    if (settling) return;
    const frames = PL.settleFrames(b, placeNow()), n = frames.length, t0 = performance.now(), dur = 1500, my = ++settling; let at = -1;
    const step = () => { if (settling !== my || V.sui.hidden) return; const f = still() ? 1 : Math.min(1, (performance.now() - t0) / dur), k = Math.min(n - 1, Math.floor(f * n));
      const last = k === n - 1; if (last) { settled = PL.wireOf(b, frames[n - 1]); settling = 0; } if (k !== at) { at = k; placeTo(frames[k]); } if (!last) requestAnimationFrame(step); };
    drawCard(); step();
  }
  /* a few random tests, or every state: the map in the registers fills, and the planted bug shows where a test meets it */
  function testBy(how) {
    const C = PL.coverageOf(B()), tested = new Set(cover ? cover.tested : []);
    PL.testsOf(C, how === 'all' ? null : PL.randomCount(C), ++runs).forEach(s => tested.add(s));
    const wrong = new Set(C.wrong.filter(s => tested.has(s)));
    cover = { cols: C.cols, rows: C.rows, tested, wrong, found: wrong.size > 0, fid: C.fid };
    if (view) view.extra(extra()); tellBlock();
  }
  /* ---- an agent in the studio (#510): the same engines the open port answers with (propose_arrangement,
     propose_placement) try what an agent would and propose; the card shows the proposal beside yours, with what it
     gains; nothing changes until the person takes it ---- */
  function askAgent(kind) {
    const D = rec.designed;
    if (kind === 'arr') { const P = proposeArrangement(D.recipe, D.fine); proposal = { kind, P }; }
    else { const R = PL.proposePlacement(B(), placeNow(), D.timing ? D.timing.period : null); proposal = { kind, R }; }
    drawCard(); V.sui.dataset.proposal = kind;
  }
  /* the way to ask, in the strip's corner: only humans decide what is taken */
  const askBtn = kind => '<button type="button" class="link sdask" data-word="agent" data-agent="' + kind + '" title="' + esc(t('sd.ctl.agentK')) + '">' + esc(t('sd.ctl.agent')) + '</button>';
  function agentCard() {
    if (!proposal) return '';
    const p = proposal, num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
    let say, can = false;
    if (p.kind === 'arr') { const P = p.P; can = !!P.proposed; say = can ? t('sd.ag.arr', { shape: t('ar.opt.shape.' + P.proposed.shape), where: t('ar.opt.where.' + P.proposed.where), c: Math.round(P.cooler), d: num(P.shorter) }) : t('sd.ag.none'); }
    else { const R = p.R; can = !!R.better; say = can ? t('sd.ag.place', { w: Math.round(R.shorter), p: Math.round(R.faster) }) : t('sd.ag.nonePlace'); }
    return '<div class="sdagent" role="group" aria-label="' + esc(t('sd.ag.k')) + '"><p class="kicker">' + esc(t('sd.ag.k')) + '</p><p>' + esc(say) + '</p><div class="sdopts">' +
      (can ? '<button type="button" class="chipb on" data-take="1">' + esc(t('sd.ag.take')) + '</button>' : '') + '<button type="button" class="chipb" data-take="0">' + esc(t(can ? 'sd.ag.no' : 'sd.ag.ok')) + '</button></div></div>';
  }
  /* the person takes it: only here does the record change */
  function takeProposal() {
    const p = proposal; proposal = null; if (!p) return;
    if (p.kind === 'arr' && p.P.proposed) { keepGene(localStorage, 'shape', p.P.proposed.shape); keepGene(localStorage, 'where', p.P.proposed.where); rec = recordNow(); if (view) view.update(rec, extra()); V.sui.dataset.recipe = A.keyOf(rec.designed.recipe); drawCard(); V.hud(); }
    else if (p.kind === 'place' && p.R.better) { settled = null; placeTo(p.R.place); }
    else drawCard();
    V.sui.dataset.proposal = '';
  }
  /* what the checks read from the picture */
  function tellBlock() { const D = rec && rec.designed; if (!D) return; V.sui.dataset.late = D.late ? '1' : ''; V.sui.dataset.wire = D.wire ? String(Math.round(D.wire.now)) : ''; V.sui.dataset.tested = cover ? String(cover.tested.size) : '0'; V.sui.dataset.found = cover && cover.found ? '1' : ''; V.sui.dataset.settled = settled != null ? String(Math.round(settled)) : ''; }
  const hideSw = () => { $('studioCanvas').hidden = $('studioLabels').hidden = true; V.sui.hidden = true; if (view) view.hide(); };
  Object.assign(V, { showStudio, showFab, hideSw, studioRecord: () => rec, studioLevel: () => lv, fabNow: () => (fab ? { step: fab, level: lv } : null) });
}
