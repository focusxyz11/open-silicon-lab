/* What the lab grover grows on the island (src/data/labs/grover.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  'way-quantum': { at: [13, -5], grow: (g, { P, night, pulses }) => { box(g, 3.6, 0.3, 3.6, mat(P.wall), 0, 0, 0, 0.08); [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([x, z]) => box(g, 0.2, 6.4, 0.2, metal(P.dark), x, 0.3, z, 0.04)); [-1.5, 1.5].forEach(v => { box(g, 3.2, 0.2, 0.2, metal(P.dark), 0, 6.5, v, 0.04); box(g, 0.2, 0.2, 3.2, metal(P.dark), v, 6.5, 0, 0.04); }); box(g, 3.2, 0.16, 0.16, metal(P.dark), 0, 6.52, 0, 0.03);
    cyl(g, 0.07, 0.07, 4.1, metal(P.metal), 0, 2.4, 0, 8); [[1.3, 5.7], [1.05, 4.8], [0.8, 4], [0.58, 3.3]].forEach(([r, y]) => { cyl(g, r, r, 0.12, metal(P.gold, { roughness: 0.25 }), 0, y, 0, 32); for (let k = 0; k < 3; k++) cyl(g, 0.035, 0.035, 0.8, metal(P.gold), Math.cos(k * 2.094) * r * 0.75, y - 0.8, Math.sin(k * 2.094) * r * 0.75, 6, { cast: false }); });
    pulses.push(box(g, 0.42, 0.14, 0.42, glow(P.accent, night ? 1.4 : 0.8), 0, 2.28, 0, 0.03, { cast: false })); } }
};
