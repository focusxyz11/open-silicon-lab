/* What the lab aibuild grows on the island (src/data/labs/aibuild.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* your chip's first wafer on show: a wafer standing on a plinth, its dies good and dead, and the packaged chip in front of it */
  'studio-aichip': { at: [-21, 3], grow: (g, { P, night, pulses }) => { box(g, 5.4, 0.5, 2.8, mat(P.wall), 0, 0, 0, 0.1); const w = cyl(g, 2.1, 2.1, 0.14, metal(P.dark), 0, 0, -0.5, 40); w.rotation.x = Math.PI / 2; w.position.y = 3.1;
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i * i + j * j < 11) box(g, 0.46, 0.46, 0.05, (i * 3 + j * 5 + 22) % 6 ? mat(P.good) : glow(P.warm, 1), i * 0.52, 2.87 + j * 0.52, -0.41, 0.01, { cast: false });
    [-1.2, 1.2].forEach(x => box(g, 0.3, 1, 0.3, metal(P.slate), x, 0.5, -0.5, 0.03)); box(g, 1.7, 0.2, 1.7, mat(P.white), 0, 0.5, 0.75, 0.04); pulses.push(box(g, 0.8, 0.12, 0.8, glow(P.accent, night ? 1.3 : 0.7), 0, 0.7, 0.75, 0.02, { cast: false })); } }
};
