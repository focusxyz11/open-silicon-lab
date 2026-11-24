/* What the lab switch grows on the island (src/data/labs/switch.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, glass, box } from '../kit3d.js';

export default {
  /* an invented switch, large: a plinth, source and drain blocks at either end, three channel sheets between them, and
     the gate wrapped all around the sheets, its edge glowing as it switches */
  'dc-switch': { at: [26.5, -15.5], grow: (g, { P, night, pulses }) => {
    box(g, 6, 0.4, 3.6, mat(P.wall), 0, 0, 0, 0.12);
    for (const x of [-2.3, 2.3]) box(g, 1.2, 2.6, 2.4, metal(P.metal), x, 0.4, 0, 0.12);
    for (let i = 0; i < 3; i++) box(g, 3.4, 0.22, 1.6, glow(P.accent, night ? 1.1 : 0.45), 0, 0.9 + i * 0.6, 0, 0.05, { cast: false });
    box(g, 1.3, 2.6, 2.2, glass(P.warm, { opacity: 0.6, roughness: 0.4 }), 0, 0.5, 0, 0.18);
    pulses.push(box(g, 1.42, 0.12, 2.32, glow(P.warm, night ? 1.5 : 0.8), 0, 3.12, 0, 0.04, { cast: false }));
  } }
};
