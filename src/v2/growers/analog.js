/* What the lab analog grows on the island (src/data/labs/analog.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* chips that touch the real world (#220): a listening post whose roof is a converter's steps, a power house with its coils, and a stand where a sensor listens to a wheel */
  'island-adc': { at: [11.5, 18.5], grow: (g, { P, A, night, pulses }) => { box(g, 4, 1.5, 2.6, mat(P.white), 0, 0, 0, 0.2); box(g, 4.2, 0.2, 2.8, mat(A.roof, { roughness: 0.7 }), 0, 1.5, 0, 0.06); for (let k = 0; k < 6; k++) pulses.push(box(g, 0.42, 0.3 + k * 0.3, 0.9, glow(P.accent, night ? 1.1 : 0.55), -1.5 + k * 0.6, 1.7, 0, 0.03, { cast: false })); box(g, 0.9, 1, 0.06, mat(P.slate), 0, 0.1, 1.31, 0.02, { cast: false }); } },
  'island-sensor': { at: [-11.5, 3], grow: (g, { P, pulses }) => { box(g, 3.8, 0.25, 2.4, mat(P.slate), 0, 0, 0, 0.06); [-0.45, 0.45].forEach(z => box(g, 0.3, 1.5, 0.22, metal(P.metal), -0.6, 0.25, z, 0.04));
    const w = cyl(g, 1, 1, 0.5, metal(P.dark, { roughness: 0.5 }), -0.6, 1.55, 0, 28); w.rotation.x = Math.PI / 2; const hub = cyl(g, 0.36, 0.36, 0.56, metal(P.metal), -0.6, 1.55, 0, 16); hub.rotation.x = Math.PI / 2;
    box(g, 1, 1.5, 1.2, mat(P.white), 1.2, 0.25, 0, 0.1); pulses.push(box(g, 0.26, 0.26, 0.26, glow(P.warm, 1.2), -0.6, 1.42, 0.62, 0.05, { cast: false })); } },
  'island-reg': { at: [5.5, 24], grow: (g, { P, pulses }) => { box(g, 4.4, 0.25, 3, mat(P.slate), 0, 0, 0, 0.06); box(g, 1.5, 2, 2.2, mat(P.wall), -1.2, 0.25, 0, 0.12); pulses.push(box(g, 0.9, 0.22, 0.06, glow(P.good, 1), -1.2, 1.6, 1.11, 0.02, { cast: false }));
    [[0.5, -0.6], [1.5, -0.6], [1, 0.6]].forEach(([x, z]) => { cyl(g, 0.42, 0.42, 1.3, metal(0xb87333, { roughness: 0.35 }), x, 0.45, z, 18); cyl(g, 0.5, 0.5, 0.2, metal(P.dark), x, 0.25, z, 18); cyl(g, 0.16, 0.16, 0.3, metal(P.metal), x, 1.75, z, 10); }); } }
};
