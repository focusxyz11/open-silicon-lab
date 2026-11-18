/* The data centre's chip, as one plan: the die the flight lands on (src/v2/dc3d.js), the dive's chip level drawn flat
   (src/app/scenes.js) and in relief (src/v2/relief3d.js) all read it from here, so the chip you land on is the chip
   you saw. In the dive's 1000 x 1000 space: the die's slab with its ring of pads, copies of one compute tile (as many
   as your chip holds), a band of memory under them, a row of links to the outside, and the clock wires; beside the die,
   on the same base (the interposer), four stacks of memory; under it all, the package. No words in this file. */

import { DEPTHS } from './weave.js';

export const SLAB = [40, 40, 920, 920];
/* metres per unit of the plan, the dive's own scale at the chip (about two centimetres across), for the flight that
   draws the die at true size */
export const METRES = DEPTHS.chip.m / 1000;
/* the compute tiles: the starting chip's 12 as 4 x 3, more as switches shrink (src/engines/chip.js grid) */
export const coreGrid = (cols, rows) => { const w = 740 / cols, h = 470 / rows, g = Math.min(14, w * 0.08), out = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ r: [130 + i * w + g / 2, 130 + j * h + g / 2, w - g, h - g] }); return out; };
/* a tile: its logic standing on it, and its own small memory beside it */
export const tileOf = r => { const m = Math.min(r[2], r[3]) * 0.08; return { logic: [r[0] + m, r[1] + m, r[2] * 0.52, r[3] * 0.5], own: [r[0] + r[2] * 0.6, r[1] + r[3] * 0.1, r[2] * 0.32, r[3] * 0.8] }; };
export const CACHE = [130, 620, 740, 100], IO = [130, 740, 740, 90];
/* the memory band, six fields of bits in a perfect grid; the links, eight blocks */
export const CACHE_FIELDS = 6, CACHE_BITS = [7, 5], IO_BLOCKS = 8;
export const CLOCK = [[[500, 136], [500, 594]], [[315, 365], [685, 365]], [[315, 208], [315, 522]], [[685, 208], [685, 522]]];
/* split a rectangle into n across (and m down), with a gap */
export const split = (r, n, m = 1, g = 8) => { const out = [], w = (r[2] - g * (n + 1)) / n, h = (r[3] - g * (m + 1)) / m; for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) out.push([r[0] + g + i * (w + g), r[1] + g + j * (h + g), w, h]); return out; };
/* the bits of a field of memory: nx x ny small squares */
export const bitsOf = (r, nx, ny) => { const out = [], w = r[2] / nx, h = r[3] / ny; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) out.push([r[0] + i * w + w * 0.18, r[1] + j * h + h * 0.18, w * 0.64, h * 0.64]); return out; };
/* the ring of pads at the die's edge, n a side */
export function padsOf(n) {
  const out = [], step = 836 / n;
  for (let i = 0; i < n; i++) { const t = 82 + i * step + step * 0.2, w = step * 0.6; out.push([t, 56, w, 24], [t, 920, w, 24], [56, t, 24, w], [920, t, 24, w]); }
  return out;
}
export const PADS = 22;
/* beside the die: four stacks of memory, eight chips high, on the base the die stands on; the package under both */
export const STACKS = [0, 1, 2, 3].map(i => [1000, 64 + i * 224, 250, 200]);
export const STACK_LAYERS = 8;
export const BASE = [0, 0, 1290, 1000];
export const PACKAGE = { at: [BASE[0] + BASE[2] / 2, BASE[1] + BASE[3] / 2], side: 0.055 / METRES };
