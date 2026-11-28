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
import { recordOf } from '../../engines/chiprecord.js';
import { stackKept, keepGene } from '../stack/keep.js';
import { mark } from '../fid.js';
import { sizeOf } from '../../data/atlas.js';
import { V, $, showStage, esc } from '../shell.js';
import * as Game from '../game.js';

export const STUDIO_LEVELS = ['chip', 'block', 'gate', 'switch'];
/* your stack as the stack view keeps it (src/v2/stack/keep.js, osl-stack): the recipe, the fine settings, the aim */
const stackNow = () => stackKept(localStorage);
/* Arrange (#507): the recipe's shape and where it computes, four options each, set here and kept in your stack */
export const ARRANGE = ['shape', 'where'];
/* the record of your chip now: your stack and the design on your bench (the lab's example until you change it) */
export function recordNow() {
  const st = stackNow(), b = Game.benchDesign(V.S);
  return recordOf(st, { p: b.p, code: b.code }, null);
}

/* the picture's safe area: the frame's, and on a wide screen right of the caption that rests at the bottom left, so the
   part in focus never stands under it, and clear of the ways in and along at the right */
function inset() {
  const I = Object.assign({}, V.frameInset(V.swFrame)), dw = V.swFrame && V.swFrame.dock.parentNode;
  if (dw && innerWidth >= 1100) { const r = dw.getBoundingClientRect(); if (r.left < innerWidth / 2 && r.bottom > innerHeight - 60) I.l = Math.max(I.l, Math.round(r.right + 28)); I.r = Math.max(I.r, 190); I.b = Math.max(I.b, 40); }
  /* the strip of controls, when it shows, is never over the picture's part in focus or its figures */
  const ctl = V.sui && V.sui.querySelector('.sdctl:not([hidden])');
  if (ctl) I.b = Math.max(I.b, Math.round(innerHeight - ctl.getBoundingClientRect().top + 16));
  return I;
}
export function create() {
  let view = null, viewP = null, rec = null, lv = 'chip';
  const ensure = () => viewP || (viewP = import('../studio/view.js').then(m => {
    view = m.createStudio($('studioCanvas'), $('studioLabels'), { words: t, mark, still, inset,
      level: (l, pos) => { if (V.swFrame) { V.swFrame.rail(l, null, pos); if (l !== lv) { lv = l; V.swFrame.level(l); history.replaceState(null, '', '#/studio/' + l); V.here(); if (V.swFrame.mode() === 'look') drawCard(); } } },
      tap: l => go(l) });
    return view;
  }));
  const go = l => { if (!view || !STUDIO_LEVELS.includes(l)) return; view.go(l); };
  /* the card: where you are in one line, then in, out and along */
  function drawCard() {
    if (!V.swFrame || !rec) return;
    const i = STUDIO_LEVELS.indexOf(lv), nm = l => t('depth.' + l + '.name'), D = rec.designed;
    const line = D.broken === 'empty' ? t('sd.line.empty') : D.broken === 'design' ? t('sd.line.broken') : D.broken === 'switch' ? t('sd.line.switchOff') : t('sd.line.' + lv);
    const W = Way.whereOf('#/studio/' + lv), make = Way.alongTo(W, 'make'), use = Way.alongTo(W, 'use');
    /* the controls of the level in view, in one strip at the bottom centre (GUIDE.md §4): at the chip, Arrange, the two
       genes the floorplan is laid out by, each option a button */
    const arrange = lv !== 'chip' ? '' : '<div class="sdarr">' + ARRANGE.map(k => '<div class="sdgene" role="group" aria-label="' + esc(t('ar.gene.' + k)) + '"><p class="kicker">' + esc(t('ar.gene.' + k)) + '</p><div class="sdopts">' +
      Object.keys(A.CARRY[k]).map(o => '<button type="button" class="chipb' + (D.recipe[k] === o ? ' on' : '') + '" data-gene="' + k + '" data-opt="' + o + '" aria-pressed="' + (D.recipe[k] === o) + '" title="' + esc(t('ar.opt.' + k + '.' + o + '.d')) + '">' + esc(t('ar.opt.' + k + '.' + o)) + '</button>').join('') + '</div></div>').join('') + '</div>';
    const had = !!V.sui.querySelector('.sdctl:not([hidden])');
    controls(arrange); if (had !== !!arrange && view) view.resize(true);
    V.swFrame.dock.innerHTML = V.lineHtml(t('sd.k') + ' · ' + nm(lv), line, null, V.aroundRow(
      i > 0 ? '<button type="button" class="chipb" data-key="back" data-sdgo="' + STUDIO_LEVELS[i - 1] + '">↑ ' + esc(nm(STUDIO_LEVELS[i - 1])) + '</button>' : '',
      i < STUDIO_LEVELS.length - 1 ? '<button type="button" class="chipb" data-key="next" data-in data-inname="' + esc(nm(STUDIO_LEVELS[i + 1])) + '" data-sdgo="' + STUDIO_LEVELS[i + 1] + '">↓ ' + esc(nm(STUDIO_LEVELS[i + 1])) + '</button>' : '',
      make ? '<a class="chipb" data-along data-alongname="' + esc(t('sd.toMake', { level: nm(lv) })) + '" href="' + esc(make) + '">→ ' + esc(t('sd.toMake', { level: nm(lv) })) + '</a>' : '',
      use ? '<a class="chipb" href="' + esc(use) + '">' + esc(t('sd.toUse', { level: nm(lv) })) + '</a>' : '',
      '<a class="chipb" href="#/stack/design/' + esc(lv) + '">' + esc(t('sd.toStack')) + '</a>',
      D.broken === 'empty' || D.broken === 'design' ? '<a class="chipb" href="#/bench/logic">' + esc(t('sd.toBench')) + '</a>' : ''));
  }
  function showStudio(level, from) {
    V.hideAll();
    $('studioCanvas').hidden = $('studioLabels').hidden = false; V.sui.hidden = false; showStage(true); document.body.classList.add('immersive');
    V.loading(true); V.lastPlace = 'studio';
    const rn = V.routeN, fromIsland = V.arriving; V.arriving = false;
    lv = STUDIO_LEVELS.includes(level) ? level : 'chip';
    return Promise.all([V.withFrame(), ensure()]).then(([, d]) => { if (rn !== V.routeN) return;
      rec = recordNow();
      V.swFrame = V.frameOf(V.sui, { up: { href: '#/place/studio', label: t('place.back') }, path: [{ href: '#/island', label: t('place.back') }, { href: '#/place/studio', label: t('map.studio.t') }, { label: t('sd.k') }],
        rail: { label: t('sd.rail'), items: STUDIO_LEVELS.map(k => ({ id: k, label: t('depth.' + k + '.name'), size: sizeOf(k) })) },
        onRail: k => go(k), onLook: drawCard, scroll: true, caption: true });
      V.sui.onclick = e => { const g = e.target.closest('[data-sdgo]'); if (g) { e.preventDefault(); go(g.dataset.sdgo); }
        const a = e.target.closest('[data-gene]'); if (a) { e.preventDefault(); arrangeTo(a.dataset.gene, a.dataset.opt); } };
      V.loading(false);
      V.sui.dataset.broken = rec.designed.broken || ''; V.sui.dataset.recipe = A.keyOf(rec.designed.recipe);
      /* from the island the camera comes down onto the die; otherwise it opens at the level the address says */
      const start = fromIsland && lv !== 'chip' ? 'chip' : lv;
      d.show(rec, start, true); if (start !== lv) d.go(lv);
      V.swFrame.rail(lv, null, STUDIO_LEVELS.indexOf(lv)); V.swFrame.level(lv); drawCard(); V.here();
      $('studioCanvas').focus({ preventScroll: true });
    });
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
    keepGene(localStorage, gene, opt); rec = recordNow(); if (view) view.update(rec);
    V.sui.dataset.recipe = A.keyOf(rec.designed.recipe); drawCard(); V.hud();
  }
  const hideSw = () => { $('studioCanvas').hidden = $('studioLabels').hidden = true; V.sui.hidden = true; if (view) view.hide(); };
  Object.assign(V, { showStudio, hideSw, studioRecord: () => rec, studioLevel: () => lv });
}
