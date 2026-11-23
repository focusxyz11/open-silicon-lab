/* What the lab search grows on the island (src/data/labs/search.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, glow, box } from '../kit3d.js';

export default {
  /* labs-a: design it or search for it (src/v2/labs/search.js): a rack of search boards whose lights climb, beside one small
     hand-made board lit warm; the program nobody can judge (src/v2/labs/halt.js): a core on a plinth, a ring of light round it */
  /* labs-a: design it or search for it, at the Lab south of the core (the studio's ground is full); the program nobody can judge, at the Lab beside the core */
  'lab-search': { at: [15, 16], grow: (g, { P, night, pulses }) => { box(g, 4.6, 0.3, 2.6, mat(P.wall), 0, 0, 0, 0.1); box(g, 2.2, 2.8, 1.2, mat(P.white), -0.8, 0.3, 0, 0.1);
    for (let k = 0; k < 5; k++) { const l = box(g, 0.5 + k * 0.32, 0.12, 0.06, glow(P.accent, night ? 1.2 : 0.6), -1.6 + (0.5 + k * 0.32) / 2, 0.7 + k * 0.44, 0.62, 0.01, { cast: false }); if (k % 2 === 0) pulses.push(l); }
    box(g, 1.1, 0.9, 1.1, mat(P.white), 1.4, 0.3, 0.2, 0.1); pulses.push(box(g, 0.6, 0.12, 0.06, glow(P.warm, night ? 1.2 : 0.6), 1.4, 0.95, 0.77, 0.01, { cast: false })); } }
};
