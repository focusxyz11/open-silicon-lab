/* What the lab listen grows on the island (src/data/labs/listen.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { THREE, mat, metal, glow, box } from '../kit3d.js';

export default {
  /* Listen and tell (src/v2/labs/listen.js, #316): a listening post, a small block on a plinth, soft rings of light
     spreading out from it as a sound does */
  /* Listen and tell: west of the data centre, between the two halls of cores */
  'dc-ear': { at: [-21, -1], grow: (g, { P, night, pulses, bobbing }) => { box(g, 3.4, 0.3, 3.4, mat(P.wall), 0, 0, 0, 0.1); box(g, 1.3, 0.9, 1.3, mat(P.white), 0, 0.3, 0, 0.12); box(g, 1, 0.18, 1, metal(P.dark), 0, 1.2, 0, 0.04);
    pulses.push(box(g, 0.6, 0.06, 0.6, glow(P.accent, night ? 1.3 : 0.7), 0, 1.38, 0, 0.01, { cast: false }));
    for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 6, 40), glow(P.accent, 1, { transparent: true, opacity: 0.6, depthWrite: false })); r.rotation.x = Math.PI / 2; r.position.set(0, 1.42, 0); g.add(r); bobbing.push({ obj: r, ring: k }); } } }
};
