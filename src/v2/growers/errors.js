/* What the lab errors grows on the island (src/data/labs/errors.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, glow, box } from '../kit3d.js';

export default {
  /* catch the silent errors (src/v2/labs/errors.js): a rack of returned boards on the quay, most lit green, one lit red where a wrong answer was caught */
  /* catch the silent errors: on the quay east of the port's hall, before the cranes */
  'port-errors': { at: [6, 9], grow: (g, { P, night, pulses }) => { box(g, 4.4, 0.3, 2.2, mat(P.wall), 0, 0, 0, 0.1); box(g, 1.6, 2.6, 1.4, mat(P.white), -1.1, 0.3, 0, 0.1); for (let k = 0; k < 5; k++) pulses.push(box(g, 1.1, 0.12, 0.06, glow(k === 2 ? P.bad : P.good, night ? 1.2 : 0.6), -1.1, 0.7 + k * 0.42, 0.72, 0.01, { cast: false }));
    box(g, 1.6, 1.4, 1.4, mat(P.white), 1.0, 0.3, 0, 0.1); pulses.push(box(g, 0.9, 0.5, 0.06, glow(P.accent, night ? 1.2 : 0.6), 1.0, 1.0, 0.72, 0.01, { cast: false })); } }
};
