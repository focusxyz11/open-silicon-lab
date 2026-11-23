/* What the lab bits grows on the island (src/data/labs/bits.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* keep the chef busy: a low kitchen with its pantry stacked on top, warm with the heat it cannot shed, its door lit */
  /* keep the chef busy: east of the hall that keeps numbers small */
  'dc-pantry': { at: [28.5, -2.5], grow: (g, { P, A, night, pulses }) => { box(g, 4.6, 0.3, 3.2, mat(P.wall), 0, 0, 0, 0.1); box(g, 3.2, 1.3, 2.4, mat(P.white), -0.4, 0.3, 0, 0.12); box(g, 3.4, 0.16, 2.6, mat(A.roof, { roughness: 0.7 }), -0.4, 1.6, 0, 0.04);
    box(g, 2.6, 0.9, 1.9, metal(P.slate), -0.4, 1.76, 0, 0.08); for (let k = 0; k < 3; k++) pulses.push(box(g, 2.0, 0.08, 0.05, glow(P.warm, night ? 1.2 : 0.6), -0.4, 1.98 + k * 0.24, 0.97, 0.01, { cast: false }));
    box(g, 0.9, 1.0, 0.9, mat(P.white), 1.75, 0.3, 0, 0.08); pulses.push(box(g, 0.9, 0.12, 0.12, glow(P.accent, night ? 1.4 : 0.8), 1.3, 0.85, 0, 0.02, { cast: false })); } }
};
