/* What the lab bench grows on the island (src/data/labs/bench.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, glass, box } from '../kit3d.js';

export default {
  /* the bench's own challenges: a board of jobs, a table where cells are set out in rows, a rack of glass masks */
  'studio-piece': { at: [16, 2], grow: (g, { P, night, pulses }) => { [-1.8, 1.8].forEach(x => box(g, 0.18, 0.5, 0.18, metal(P.slate), x, 0, 0, 0.02)); box(g, 4.2, 2.4, 0.24, mat(P.white), 0, 0.5, 0, 0.06); for (let k = 0; k < 8; k++) box(g, 0.62, 0.62, 0.06, mat(k % 3 ? P.warm : P.accent), -1.5 + (k % 4), 1.05 + Math.floor(k / 4) * 0.9, 0.15, 0.02, { cast: false }); pulses.push(box(g, 0.62, 0.62, 0.06, glow(P.warm, night ? 1.2 : 0.6), 1.5, 1.95, 0.16, 0.02, { cast: false })); } },
  'studio-floor': { at: [-12, -6], grow: (g, { P, night, pulses }) => { box(g, 5, 0.9, 3.4, mat(P.wall), 0, 0, 0, 0.1); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) box(g, 0.66 + (k + r) % 2 * 0.36, 0.18, 0.62, mat(P.slate), -1.65 + k * 1.1, 0.9, -1.05 + r * 1.05, 0.03, { cast: false }); pulses.push(box(g, 4.2, 0.05, 0.08, glow(P.warm, night ? 1.2 : 0.6), 0, 1.0, -0.52, 0.01, { cast: false })); } },
  'studio-masks': { at: [3, 14], grow: (g, { P, night, pulses }) => { box(g, 3.8, 0.3, 1.7, mat(P.slate), 0, 0, 0, 0.05); for (let k = 0; k < 5; k++) box(g, 0.08, 2.2, 1.4, glass(P.glass, { opacity: 0.5 }), -1.4 + k * 0.7, 0.3, 0, 0.02); pulses.push(box(g, 0.1, 2.2, 1.4, glow(P.accent, night ? 1.2 : 0.6), 1.4, 0.3, 0, 0.02, { cast: false })); } }
};
