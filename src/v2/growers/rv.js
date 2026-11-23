/* What the lab rv grows on the island (src/data/labs/rv.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* run your core (src/v2/labs/rv.js): a small board on a stand at the Lab, its core lit, a row of register lamps counting */
  /* run your core: at the Lab, south of the new ways to compute */
  'lab-cpu': { at: [13, 10], grow: (g, { P, night, pulses }) => { box(g, 3.4, 0.3, 2.2, mat(P.wall), 0, 0, 0, 0.1); box(g, 2.6, 1.6, 0.2, mat(P.dark), 0, 0.3, -0.4, 0.04); box(g, 0.9, 0.9, 0.08, metal(P.slate), -0.5, 0.65, -0.26, 0.02, { cast: false }); pulses.push(box(g, 0.5, 0.5, 0.04, glow(P.accent, night ? 1.3 : 0.7), -0.5, 0.85, -0.2, 0.01, { cast: false }));
    for (let k = 0; k < 4; k++) { const l = box(g, 0.18, 0.18, 0.04, glow(k % 2 ? P.warm : P.good, night ? 1.2 : 0.6), 0.45 + k * 0.24, 1.3, -0.28, 0.01, { cast: false }); if (k !== 1) pulses.push(l); } } }
};
