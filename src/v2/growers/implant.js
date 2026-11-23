/* What the lab implant grows on the island (src/data/labs/implant.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* the implanter: an ion source, a long beam line and the chamber where the wafer waits */
  'fab-implanter': { at: [8, -26.5], grow: (g, { P, night, pulses }) => { box(g, 9, 0.4, 3, mat(P.wall), 0, 0, 0, 0.1); box(g, 2, 2, 2, mat(P.white), -3.4, 0.4, 0, 0.2); const b = cyl(g, 0.3, 0.3, 4.2, metal(0x8e959e, { roughness: 0.25 }), -0.4, 1.4, 0, 16); b.rotation.z = Math.PI / 2; pulses.push(box(g, 3.4, 0.08, 0.08, glow(P.accent, night ? 1.5 : 0.8), -0.4, 1.4, 0, 0.02, { cast: false })); cyl(g, 1.2, 1.2, 1.8, metal(P.dark), 3, 0.4, 0, 28); } },
  /* the anneal tool: a lamp head over a wafer on a plinth */
  'fab-anneal': { at: [20.8, 5.5], grow: (g, { P, pulses }) => { box(g, 3.4, 1.2, 3.4, mat(P.white), 0, 0, 0, 0.2); cyl(g, 1.2, 1.2, 0.12, metal(P.dark), 0, 1.2, 0, 28); box(g, 0.5, 3, 0.5, metal(P.slate), -1.2, 1.2, -1.2, 0.05); box(g, 3, 0.5, 0.5, metal(P.slate), 0, 4.2, -1.2, 0.05); pulses.push(cyl(g, 0.5, 0.2, 0.6, glow(P.warm, 1.4), 0.6, 3.6, -1.2, 16)); } }
};
