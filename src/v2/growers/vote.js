/* What the lab vote grows on the island (src/data/labs/vote.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* a reliable whole from flaky parts (src/v2/labs/vote.js): three copies of one block on a slab, one of them lit red, and the voter between them and the way out, lit green */
  /* a reliable whole, east of the studio; a mind that cannot be copied, at the Lab beside the other ways to compute */
  'studio-vote': { at: [17, -6], grow: (g, { P, night, pulses }) => { box(g, 5, 0.3, 3.2, mat(P.wall), 0, 0, 0, 0.1); [-1, 0, 1].forEach((z, i) => { box(g, 1.3, 1.1, 0.8, mat(P.white), -1.4, 0.3, z * 1.0, 0.1); pulses.push(box(g, 0.08, 0.5, 0.5, glow(i === 1 ? P.bad : P.good, night ? 1.3 : 0.7), -0.73, 0.6, z * 1.0, 0.01, { cast: false })); box(g, 1.1, 0.08, 0.08, metal(P.slate), -0.2, 0.7, z * 1.0, 0.01, { cast: false }); });
    box(g, 1.1, 1.6, 2.6, mat(P.white), 0.9, 0.3, 0, 0.14); pulses.push(box(g, 0.06, 0.7, 1.6, glow(P.good, night ? 1.4 : 0.8), 1.47, 0.75, 0, 0.01, { cast: false })); box(g, 0.9, 0.1, 0.1, metal(P.slate), 1.95, 1.0, 0, 0.01, { cast: false }); } }
};
