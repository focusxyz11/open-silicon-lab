/* Inside a chip, layer by layer (src/v2/chip3d.js): the dive's levels as they are made, the rows above not made yet.
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t } from '../../core/i18n.js';
import * as Game from '../game.js';
import { CHIP_ROWS as ROWS, CHIP_ASK } from '../../data/views3d.js';
import { sizeOf } from '../../data/atlas.js';
import { V, $, showStage, esc } from '../shell.js';

export function create() {
  Object.assign(V, { showChip });
  
  const ensureChip = () => V.chipP || (V.chipP = import('../chip3d.js').then(m => { V.chip = m.createChip($('chipCanvas'), $('chipLabels'), { row: r => { V.chipRow = r; chipPanel(); },
    depth: z => { if (V.chipFrame) V.chipFrame.rail(ROWS[Math.round(z)].dive, z / (ROWS.length - 1), z); },
    /* the picture is framed in what the frame leaves free, and the way in stands beside the next layer, with its ring */
    inset: () => V.frameInset(V.chipFrame), portal: p => V.chipFrame && V.chipFrame.inwardAt(p) }); return V.chip; }));
  const stepNames = r => ROWS[r].made.map(d => t('depth.' + d + '.name')).join(' → ');
  /* the factory step that makes a row: Do and Ask at a row are about making it, and the line is where it is walked */
  const rowStep = r => ROWS[r].made[ROWS[r].made.length - 1];
  function chipPanel() {
    if (!V.chipFrame) return;
    V.chipFrame.level(rowStep(V.chipRow)); V.here();
    if (V.chipFrame.mode() === 'look') drawChip();
  }
  function drawChip() {
    const r = V.chipRow, R = ROWS[r], nm = d => t('depth.' + d + '.name'), last = r === ROWS.length - 1;
    /* the level, as made, and the step that makes it: the factory makes them from the bottom up */
    const kicker = t('chipx.madeAs', { level: nm(R.dive) });
    const line = t('chipx.order', { steps: stepNames(r), n: ROWS.length - r, total: ROWS.length }) + ' ' + R.made.map(d => t('depth.' + d + '.see')).join(' ');
    /* your own design, where the chip carries it: the gates you wrote are printed, etched and wired here */
    const Y = Game.yourDesign(V.S), yk = Y && ({ 1: 'wires', 2: 'print', 3: 'etch' })[r];
    const yours = yk ? '<div class="yours"><span class="kicker">' + esc(t('chipx.yours')) + '</span>' + esc(t('chipx.yours.' + yk, { name: t('design.proj.' + Y.p + '.t'), gates: Y.B.M.cells.length, transistors: Y.B.transistors, masks: Y.B.masks, wire: Math.round(Y.B.RT ? Y.B.RT.wl : 0) })) + '</div>'
      : !Y && r === 2 ? '<a class="yours none" href="#/place/studio">' + esc(t('chipx.yoursNone')) + '</a>' : '';
    /* the same card as the dive's: up and deeper (↑ ↓), the step on the factory's line, and the level at the other
       stages of the loop (In use is the dive, at this level) */
    V.chipFrame.dock.innerHTML = V.lineHtml(kicker, line, CHIP_ASK[r], V.aroundRow(
      r ? '<button type="button" class="chipb" data-key="back" data-rowgo="' + (r - 1) + '">↑ ' + esc(nm(ROWS[r - 1].dive)) + '</button>' : '',
      last ? '<a class="chipb" href="#/island">' + esc(t('chipx.back')) + '</a>' : '<button type="button" class="chipb" data-key="next" data-in data-inname="' + esc(nm(ROWS[r + 1].dive)) + '" data-rowgo="' + (r + 1) + '">↓ ' + esc(nm(ROWS[r + 1].dive)) + '</button>',
      '<a class="chipb" href="#/line/' + rowStep(r) + '">' + esc(t('chipx.onLine', { steps: nm(rowStep(r)) })) + '</a>')).replace('<div class="nav">', yours + '<div class="nav">');
  }
  function showChip(row) {
    V.hideAll();
    $('chipCanvas').hidden = $('chipLabels').hidden = false; V.cui.hidden = false; showStage(true); document.body.classList.add('immersive');
    V.chipRow = row != null && row >= 0 && row < ROWS.length ? row : 0;
    V.loading(true);
    const want = V.chipRow;   /* the chip may report its first row before the frame is ready */
    V.lastPlace = 'fab';
    const n = V.routeN;
    /* made while the visitor moved on (#365): left paused, and its frame not drawn */
    return Promise.all([V.withFrame(), ensureChip()]).then(([, c]) => { if (n !== V.routeN) { if (V.cui.hidden) c.pause(); return; }
      V.chipFrame = V.frameOf(V.cui, { up: { href: '#/place/fab', label: t('map.fab.t') }, path: [{ href: '#/island', label: t('place.back') }, { href: '#/place/fab', label: t('map.fab.t') }, { label: t('chipx.title') }],
        rail: { label: t('place.levels'), items: ROWS.map(x => ({ id: x.dive, label: t('depth.' + x.dive + '.name'), size: sizeOf(x.dive) })) },
        onRail: d => c.go(ROWS.findIndex(x => x.dive === d)), onLook: drawChip, caption: true });
      V.cui.onclick = e => { const b = e.target.closest('[data-rowgo]'); if (b) c.go(+b.dataset.rowgo); };
      /* the rail says the level at once, before the picture's first frame */
      V.loading(false); V.chipRow = want; c.set(want); V.chipFrame.rail(ROWS[want].dive, want / (ROWS.length - 1), want); c.resume(); chipPanel(); $('chipCanvas').focus({ preventScroll: true });
    });
  }
  Object.assign(V, { ensureChip });
}
