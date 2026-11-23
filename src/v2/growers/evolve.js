/* What the lab evolve grows on the island (src/data/labs/evolve.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { THREE, mat, glass, box, rnd } from '../kit3d.js';

export default {
  'studio-evolve': { at: [-14, 6], grow: (g, { P }) => { box(g, 7, 0.4, 5, mat(P.wall), 0, 0, 0, 0.1); const d = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 7, 20, 1, false, 0, Math.PI), glass(P.glass, { opacity: 0.45 })); d.rotation.z = Math.PI / 2; d.position.y = 0.4; g.add(d); for (let k = 0; k < 6; k++) box(g, 0.5, 0.5 + rnd(k, 31) * 1.2, 0.5, mat(P.good), -2.5 + k, 0.4, (k % 2) - 0.5, 0.1); } }
};
