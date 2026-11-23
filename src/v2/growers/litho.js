/* What the lab litho grows on the island (src/data/labs/litho.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* a second scanner bay: the machine that prints with light, a white body on its slab, a dark head and a lit window */
  'fab-scanner': { at: [18.5, -5], grow: (g, { P, night, pulses }) => { box(g, 7, 0.3, 5, mat(P.wall), 0, 0, 0, 0.1); box(g, 4.6, 2.4, 3.2, mat(P.white), -0.6, 0.3, 0, 0.2); box(g, 3.2, 0.9, 2.4, mat(P.dark), -0.6, 2.7, 0, 0.12); box(g, 1.2, 1.5, 3.2, mat(P.slate), 2.5, 0.3, 0, 0.1); pulses.push(box(g, 1.6, 0.5, 0.06, glow(P.accent, night ? 1.3 : 0.7), -0.6, 1.6, 1.62, 0.02, { cast: false })); } },
  /* the light source of an EUV scanner: a long vacuum vessel with a warm glow where the tin droplets are hit */
  'fab-euv': { at: [18.5, 0.5], grow: (g, { P, pulses }) => { box(g, 7, 0.3, 3.4, mat(P.wall), 0, 0, 0, 0.1); const v = cyl(g, 0.95, 0.95, 5.2, metal(0x8e959e, { roughness: 0.22 }), 0, 0.3, 0, 28); v.rotation.z = Math.PI / 2; v.position.y = 1.35; const c = cyl(g, 0.4, 0.4, 0.5, metal(P.dark), -2.8, 0.3, 0, 20); c.rotation.z = Math.PI / 2; c.position.y = 1.35; pulses.push(cyl(g, 0.3, 0.3, 0.2, glow(P.warm, 1.2), 0.4, 2.3, 0, 14)); box(g, 0.5, 1.0, 0.5, mat(P.slate), -1.6, 0.3, 0, 0.05); box(g, 0.5, 1.0, 0.5, mat(P.slate), 1.6, 0.3, 0, 0.05); } }
};
