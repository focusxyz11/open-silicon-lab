/* What the lab dies grows on the island (src/data/labs/dies.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* read the die (src/v2/labs/dies.js): a microscope over a die on its stage, the die's districts lit in the colours of a photo */
  /* read the die: in front of the test house, west of its hall */
  'test-xray': { at: [-6, -9], grow: (g, { P, night, pulses }) => { box(g, 3.6, 0.9, 2.6, mat(P.white), 0, 0, 0, 0.12); box(g, 1.5, 0.1, 1.5, mat(P.dark), -0.5, 0.9, 0, 0.02); [[P.accent, -0.85, -0.35], [P.warm, -0.15, -0.35], [P.good, -0.85, 0.35], [P.accent, -0.15, 0.35]].forEach(([c, x, z]) => pulses.push(box(g, 0.6, 0.05, 0.6, glow(c, night ? 1.2 : 0.6), x, 1.0, z, 0.01, { cast: false })));
    box(g, 0.35, 2.6, 0.35, metal(P.slate), 1.2, 0.9, 0, 0.04); box(g, 1.6, 0.35, 0.4, metal(P.slate), 0.5, 3.1, 0, 0.04); cyl(g, 0.22, 0.3, 0.9, metal(P.dark), -0.5, 2.25, 0, 16); } }
};
