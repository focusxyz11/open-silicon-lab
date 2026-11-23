/* What the lab teardown grows on the island (src/data/labs/teardown.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  'island-teardown': { at: [14, -4], grow: (g, { P, pulses }) => { box(g, 6, 1.1, 3, mat(P.wall), 0, 0, 0, 0.2); for (let k = 0; k < 4; k++) box(g, 1, 0.12, 1.6, mat(k % 2 ? P.chip : P.board), -2.1 + k * 1.4, 1.1, 0, 0.04); box(g, 0.2, 2.6, 0.2, metal(P.metal), 2.6, 1.1, -1, 0.02); pulses.push(cyl(g, 0.5, 0.3, 0.4, glow(P.warm, 1.1), 2.6, 3.4, -1, 12)); } },
  'studio-fit': { at: [10, 10], grow: (g, { P }) => { box(g, 9, 3, 0.6, mat(P.white), 0, 0, 0, 0.1); for (let k = 0; k < 6; k++) box(g, 1.1, 1.1, 0.12, mat(k < 2 ? P.accent : k < 4 ? P.good : P.warm), -3.4 + k * 1.36, 1, 0.36, 0.05, { cast: false }); } }
};
