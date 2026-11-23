/* What the lab cim grows on the island (src/data/labs/cim.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* new ways to compute, at the Lab: a grid of memory cells (rows under, columns over, a cell at every crossing), and a quantum machine's cold stage hanging in its frame */
  'way-cim': { at: [13, 3], grow: (g, { P, A, night, pulses }) => { box(g, 5, 1, 5, mat(P.white), 0, 0, 0, 0.2); box(g, 5.2, 0.14, 5.2, mat(A.roof, { roughness: 0.7 }), 0, 1, 0, 0.05);
    for (let i = 0; i < 4; i++) { box(g, 4.5, 0.14, 0.14, metal(P.dark), 0, 1.35, -1.5 + i, 0.03, { cast: false }); box(g, 0.14, 0.14, 4.5, metal(P.metal), -1.5 + i, 1.95, 0, 0.03, { cast: false });
      for (let j = 0; j < 4; j++) { const c = box(g, 0.34, 0.46, 0.34, glow((i * 3 + j * 5) % 4 === 1 ? P.warm : P.accent, night ? 1.2 : 0.6), -1.5 + i, 1.49, -1.5 + j, 0.06, { cast: false }); if ((i + j) % 2 === 0) pulses.push(c); } } } }
};
