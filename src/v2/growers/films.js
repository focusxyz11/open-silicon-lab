/* What the lab films grows on the island (src/data/labs/films.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  'fab-etch': { at: [8.5, -21], grow: (g, { P, night, pulses }) => { box(g, 11, 0.3, 4.4, mat(P.wall), 0, 0, 0, 0.1); for (let k = 0; k < 4; k++) { const x = -4.05 + k * 2.7; box(g, 2.1, 2.5, 2.6, mat(P.white), x, 0.3, 0, 0.2); cyl(g, 0.8, 0.8, 0.4, metal(P.dark), x, 2.8, 0, 20); pulses.push(box(g, 1.1, 0.3, 0.06, glow(P.accent, night ? 1.4 : 0.7), x, 1.5, 1.32, 0.02, { cast: false })); cyl(g, 0.12, 0.12, 1.2, metal(P.metal), x, 3.1, -0.9, 8); } box(g, 10.4, 0.14, 0.14, metal(P.metal), 0, 4.2, -0.9, 0.02); } },
  'fab-ald': { at: [-4, -24], grow: (g, { P, night, pulses }) => { box(g, 9, 0.3, 9, mat(P.wall), 0, 0, 0, 0.1); cyl(g, 1.9, 1.9, 1.5, mat(P.white), 0, 0.3, 0, 6); cyl(g, 1.2, 1.2, 0.2, metal(P.dark), 0, 1.8, 0, 6); for (let k = 0; k < 4; k++) { const a = Math.PI + k * (Math.PI / 3), x = Math.cos(a) * 3.5, z = Math.sin(a) * 3.5; cyl(g, 1.05, 1.05, 1.9, mat(P.white), x, 0.3, z, 20); cyl(g, 0.8, 0.8, 0.2, metal(P.dark), x, 2.2, z, 20); pulses.push(box(g, 0.7, 0.25, 0.06, glow(P.accent, night ? 1.4 : 0.7), x * 1.0, 1.2, z + 1.07, 0.02, { cast: false })); } box(g, 2.2, 1.2, 1.6, mat(P.wall), 0, 0.3, 3.4, 0.15); } }
};
