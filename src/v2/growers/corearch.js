/* What the lab corearch grows on the island (src/data/labs/corearch.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* change your core (src/v2/labs/corearch.js): a core's floor plan as a model on a plinth, its registers a low block,
     two arithmetic units and a small multiplier standing up from it, each lit */
  /* change your core: beside it, further east */
  'lab-arch': { at: [21, 14], grow: (g, { P, night, pulses }) => { box(g, 3.2, 0.3, 3.2, mat(P.wall), 0, 0, 0, 0.1); box(g, 2.6, 0.12, 2.6, mat(P.dark), 0, 0.3, 0, 0.03);
    box(g, 1.1, 0.25, 2.3, metal(P.slate), -0.6, 0.42, 0, 0.02); pulses.push(box(g, 0.9, 0.36, 0.95, glow(P.accent, night ? 1.2 : 0.6), 0.65, 0.42, -0.55, 0.02, { cast: false }));
    pulses.push(box(g, 0.9, 0.36, 0.95, glow(P.accent, night ? 1.2 : 0.6), 0.65, 0.42, 0.55, 0.02, { cast: false })); box(g, 0.5, 0.6, 0.5, mat(P.white), 0.65, 0.78, 0, 0.03); } }
};
