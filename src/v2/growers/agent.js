/* What the lab agent grows on the island (src/data/labs/agent.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, glow, box } from '../kit3d.js';

export default {
  'lab-desk': { at: [-9, 9], grow: (g, { P, A, night, pulses }) => { box(g, 7, 2.6, 4.5, mat(P.white), 0, 0, 0, 0.3); box(g, 7.2, 0.25, 4.7, mat(A.roof, { roughness: 0.7 }), 0, 2.6, 0, 0.1); for (let k = 0; k < 3; k++) pulses.push(box(g, 1.6, 0.9, 0.06, glow(k === 1 ? P.warm : P.accent, night ? 1.2 : 0.6), -2.2 + k * 2.2, 1.1, 2.27, 0.02, { cast: false })); } }
};
