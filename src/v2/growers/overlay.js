/* What the lab overlay grows on the island (src/data/labs/overlay.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { THREE, mat, metal, glow, box } from '../kit3d.js';

export default {
  /* the overlay tool: two rings, one layer on the one below, a little out of line */
  'fab-overlay': { at: [16.5, 5.5], grow: (g, { P }) => { box(g, 3.6, 1.4, 3.6, mat(P.white), 0, 0, 0, 0.2); for (let k = 0; k < 2; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.1, 8, 40), k ? glow(P.accent, 1, { transparent: true, opacity: 0.7 }) : metal(P.dark)); r.rotation.x = Math.PI / 2; r.position.set(k ? 0.28 : 0, 1.8 + k * 0.5, 0); g.add(r); } } }
};
