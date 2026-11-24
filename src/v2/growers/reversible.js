/* What the lab reversible grows on the island (src/data/labs/reversible.js), drawn by src/v2/map3d.js when its challenge
   is won: each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into
   its group g from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* compute without erasing (src/v2/labs/reversible.js), at the Lab: four rails on a low slab, crossed by four gates, each a
     post with a lit ring for its target and small dots for its controls; the rings glow slowly, as a step that takes its time */
  'way-reversible': { at: [-1.5, 12.5], grow: (g, { P, night, pulses }) => { box(g, 5, 0.3, 2.8, mat(P.wall), 0, 0, 0, 0.1);
    for (let w = 0; w < 4; w++) box(g, 4.6, 0.1, 0.1, metal(P.metal), 0, 0.3, -1.05 + w * 0.7, 0.02, { cast: false });
    [[[0, 1], 3], [[0], 1], [[1, 2], 3], [[1], 2]].forEach(([cs, tg], i) => { const x = -1.5 + i, z = w => -1.05 + w * 0.7, ws = cs.concat(tg);
      box(g, 0.08, 0.08, (Math.max(...ws) - Math.min(...ws)) * 0.7, metal(P.dark), x, 0.5, (z(Math.max(...ws)) + z(Math.min(...ws))) / 2, 0.02, { cast: false });
      pulses.push(cyl(g, 0.24, 0.24, 0.16, glow(P.accent, night ? 1.3 : 0.7), x, 0.42, z(tg), 18, { cast: false }));
      cs.forEach(c => cyl(g, 0.12, 0.12, 0.18, mat(P.white), x, 0.42, z(c), 12, { cast: false })); }); } }
};
