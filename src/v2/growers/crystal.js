/* What the lab crystal grows on the island (src/data/labs/crystal.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, box, cyl } from '../kit3d.js';

export default {
  'quarry-ingot': { at: [10, 6], grow: (g, { P }) => { box(g, 6, 0.4, 3, mat(P.wall), 0, 0, 0, 0.1); for (let k = 0; k < 4; k++) { const c = cyl(g, 0.5, 0.5, 4.6, metal(0x8e959e, { roughness: 0.22 }), -2.1 + k * 1.4, 0.4, 0, 24); c.rotation.x = Math.PI / 2; c.position.y = 1; } } }
};
