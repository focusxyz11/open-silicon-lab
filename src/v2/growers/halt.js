/* What the lab halt grows on the island (src/data/labs/halt.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { THREE, mat, glow, box, cyl } from '../kit3d.js';

export default {
  'lab-halt': { at: [18, 10], grow: (g, { P, night, pulses }) => { cyl(g, 1.5, 1.7, 0.5, mat(P.wall), 0, 0, 0, 28); box(g, 1.1, 0.9, 1.1, mat(P.dark), 0, 0.5, 0, 0.08); pulses.push(box(g, 0.6, 0.06, 0.6, glow(P.accent, night ? 1.3 : 0.7), 0, 1.4, 0, 0.02, { cast: false }));
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 8, 48), glow(P.warm, night ? 1.2 : 0.7, { transparent: true, opacity: 0.85 })); r.rotation.x = Math.PI / 2; r.position.set(0, 1.0, 0); g.add(r); } }
};
