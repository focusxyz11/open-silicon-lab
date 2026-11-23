/* What the lab clockpower grows on the island (src/data/labs/clockpower.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* the clock and the power (src/v2/labs/clockpower.js): a meter whose column climbs from green to red, and four lamps that count */
  'blk-power': { at: [-20.5, 8.5], grow: (g, { P, A, night, pulses }) => { box(g, 2.8, 1.3, 2.2, mat(P.white), 0, 0, 0, 0.12); box(g, 3, 0.2, 2.4, mat(A.roof, { roughness: 0.7 }), 0, 1.3, 0, 0.05); box(g, 1, 6, 0.8, metal(P.slate), 0, 1.5, -0.3, 0.08); [P.good, P.good, P.warm, P.warm, P.bad].forEach((c, i) => pulses.push(box(g, 0.62, 0.8, 0.1, glow(c, night ? 1.4 : 0.8), 0, 2.1 + i * 1.02, 0.12, 0.03, { cast: false }))); box(g, 1.3, 0.25, 1.1, metal(P.dark), 0, 7.5, -0.3, 0.05); } },
  'gate-counter': { at: [5, 6], grow: (g, { P, night, pulses }) => { box(g, 5.4, 0.45, 1.5, mat(P.wall), 0, 0, 0, 0.08); for (let i = 0; i < 4; i++) { cyl(g, 0.1, 0.14, 1.3, metal(P.slate), -1.8 + i * 1.2, 0.45, 0, 10); const l = box(g, 0.62, 0.62, 0.62, glow(i % 2 ? P.accent : P.warm, night ? 1.5 : 0.9), -1.8 + i * 1.2, 1.75, 0, 0.14, { cast: false }); if (i !== 2) pulses.push(l); } } }
};
