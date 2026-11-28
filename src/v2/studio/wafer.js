/* Your wafer at a station of the line (#511, GUIDE.md §3): 21 dies in a disc, each your die in its state after that
   step, read from the record's made part (src/engines/chiprecord.js madeAt) and drawn by the studio's own drawing code
   (made.js), the centre die the one the camera goes into. Drawn on a canvas for the 3D line to lay on your
   wafer (src/app/journey3d.js); no words on it (CLAUDE.md: words are HTML over a scene). Computes nothing. */
import { planOf, DIES } from './plan.js';

export { DIES };
import { madeDie, MADE_STEPS } from './made.js';
import { alpha } from './kit.js';
import { DIE } from '../../engines/floorplan.js';

export const CENTRE = DIES.findIndex(d => d[0] === 0 && d[1] === 0);
/* the made step a station of the journey shows: before Deposit the crystal's, after Test the tested die */
const STEP_OF = { crystal: 'crystal', slice: 'crystal', clean: 'crystal', deposit: 'deposit', print: 'print', etch: 'etch', implant: 'implant', wires: 'wires', test: 'test', pkg: 'test', ship: 'test' };
export const madeStepOf = id => STEP_OF[id] || null;

/* draw your wafer after a station on a canvas of size px, in the palette C ({ bg, ink, accent, bad, panel }) */
export function drawWafer(canvas, record, station, C, size = 512) {
  const step = madeStepOf(station), m = step && record && record.made.find(x => x.step === step);
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), R = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = C.wafer || '#c9d7ff'; ctx.beginPath(); ctx.arc(R, R, R - 1, 0, 6.2832); ctx.fill();
  if (!m) return { step: null };
  const P = planOf(record), chip = m.chip, f = MADE_STEPS.indexOf(step), test = chip.test, pitch = size * 0.17, d = pitch * 0.86;
  /* the crystal's wafer is bare: the lattice's dots, your design waiting for Print */
  if (f === 0) { ctx.fillStyle = alpha(C.ink, 0.12); for (let y = 8; y < size; y += 12) for (let x = 8; x < size; x += 12) if (Math.hypot(x - R, y - R) < R - 6) ctx.fillRect(x, y, 1.5, 1.5); }
  DIES.forEach(([i, j], k) => {
    const x0 = R + i * pitch - d / 2, y0 = R + j * pitch - d / 2, cam = { ox: x0, oy: y0, s: d / DIE };
    madeDie(ctx, P, cam, { C, made: { f, stopped: !!chip.stopped, failed: f === 6 && test ? !test.good[k] : false, cells: chip.cells } });
  });
  return { step, f, failed: test && f === 6 ? test.good.filter(g => !g).length : 0 };
}
