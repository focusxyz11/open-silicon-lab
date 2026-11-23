/* What the lab semiconductor grows on the island (src/data/labs/semiconductor.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* a hot plate under test: a wafer on a glowing plate, and a thermometer beside it with its red top mark */
  'dc-heat': { at: [20.5, -15], grow: (g, { P, night, pulses }) => { box(g, 5, 0.3, 4, mat(P.wall), 0, 0, 0, 0.1); box(g, 2.8, 1, 2.8, mat(P.white), -0.6, 0.3, 0, 0.15); pulses.push(cyl(g, 1.15, 1.15, 0.14, glow(P.warm, night ? 1.5 : 0.9), -0.6, 1.3, 0, 28)); cyl(g, 0.95, 0.95, 0.06, metal(P.dark, { roughness: 0.25 }), -0.6, 1.44, 0, 28);
    box(g, 0.5, 3.2, 0.3, mat(P.white), 1.7, 0.3, 0.9, 0.06); box(g, 0.16, 1.9, 0.06, glow(P.warm, night ? 1.3 : 0.7), 1.7, 0.7, 1.06, 0.02, { cast: false }); box(g, 0.34, 0.08, 0.06, glow(P.bad, 1), 1.7, 2.95, 1.06, 0.01, { cast: false }); } }
};
