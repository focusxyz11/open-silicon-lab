/* What the lab mortal grows on the island (src/data/labs/mortal.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, glow, box } from '../kit3d.js';

export default {
  /* a mind that cannot be copied (src/v2/labs/mortal.js): the chip that learned, warm on its plinth, and a row of its copies, each lit a little differently */
  'way-mortal': { at: [13, -12], grow: (g, { P, night, pulses }) => { box(g, 5.6, 0.3, 3, mat(P.wall), 0, 0, 0, 0.1); box(g, 1.4, 1.2, 1.4, mat(P.white), -1.9, 0.3, 0, 0.12); pulses.push(box(g, 1, 0.12, 1, glow(P.warm, night ? 1.4 : 0.8), -1.9, 1.5, 0, 0.03, { cast: false }));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { box(g, 0.6, 0.5, 0.6, mat(P.white), -0.3 + i * 0.85, 0.3, -0.5 + j * 1.0, 0.06); const c = box(g, 0.42, 0.06, 0.42, glow([P.good, P.warm, P.good, P.bad, P.good, P.good, P.warm, P.good][i * 2 + j], night ? 1.2 : 0.6), -0.3 + i * 0.85, 0.83, -0.5 + j * 1.0, 0.01, { cast: false }); if ((i + j) % 2) pulses.push(c); } } }
};
