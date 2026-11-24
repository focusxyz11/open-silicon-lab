/* What the lab light grows on the island (src/data/labs/light.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* multiply as it travels, at the Lab east of the quantum machine: a slab with two glowing glass guides that part into two
     arms (a heater on one) and meet again, one output brighter than the other */
  'way-light': { at: [19, -4.5], grow: (g, { P, night, pulses }) => { box(g, 5.6, 0.3, 2.4, mat(P.slate), 0, 0, 0, 0.1);
    const guide = (len, x, z, ry, bright) => { const m = box(g, len, 0.12, 0.14, glow(P.warm, (night ? 1.4 : 0.7) * bright), x, 0.3, z, 0.03, { cast: false }); m.rotation.y = ry; return m; };
    guide(1.1, -2.1, -0.25, 0, 1); guide(1.1, -2.1, 0.25, 0, 0.15);
    guide(0.75, -1.35, -0.47, 0.6, 0.7); guide(0.75, -1.35, 0.47, -0.6, 0.7);
    guide(1.6, 0, -0.7, 0, 0.7); guide(1.6, 0, 0.7, 0, 0.7);
    guide(0.75, 1.35, -0.47, -0.6, 0.7); guide(0.75, 1.35, 0.47, 0.6, 0.7);
    pulses.push(guide(1.1, 2.1, -0.25, 0, 0.3)); pulses.push(guide(1.1, 2.1, 0.25, 0, 1));
    box(g, 0.7, 0.16, 0.34, metal(P.bad), 0, 0.42, -0.7, 0.04, { cast: false }); } }
};
