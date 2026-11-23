/* What the lab thousand grows on the island (src/data/labs/thousand.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, glow, box } from '../kit3d.js';

export default {
  'studio-thousand': { at: [-12, 12.6], grow: (g, { P, A, night, pulses }) => { box(g, 4.4, 0.9, 2.6, mat(P.white), 0, 0, 0, 0.12); box(g, 4.6, 0.12, 2.8, mat(A.roof, { roughness: 0.7 }), 0, 0.9, 0, 0.04);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { const up = i === 5 && j === 1; const c = box(g, 0.4, up ? 0.5 : 0.08, 0.4, glow(up ? P.accent : P.good, night ? (up ? 1.5 : 0.8) : (up ? 0.8 : 0.4)), -1.85 + i * 0.53, 1.02, -0.81 + j * 0.54, 0.03, { cast: false }); if (up) pulses.push(c); } } }
};
