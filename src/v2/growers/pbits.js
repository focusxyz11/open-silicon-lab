/* What the lab pbits grows on the island (src/data/labs/pbits.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* labs-b: let the noise compute (src/v2/labs/pbits.js): a slab with six p-bits on posts, flickering on their own, and beside it a square of
     every pair, dark but for the two answers lit steadily; a thousand that pass (src/v2/labs/thousand.js): a wide table of green tiles, one raised */
  /* labs-b: the p-bits at the Lab, west of its tower; a thousand that pass, in the studio's yard */
  'way-pbits': { at: [-12.5, -3.5], grow: (g, { P, night, pulses }) => { box(g, 4.6, 0.3, 2, mat(P.wall), 0, 0, 0, 0.1); for (let i = 0; i < 6; i++) { const x = -1.85 + i * 0.74; cyl(g, 0.12, 0.12, 0.9, metal(P.metal), x, 0.75, 0, 8); const c = box(g, 0.42, 0.42, 0.42, glow(i < 3 ? P.accent : P.warm, night ? 1.3 : 0.7), x, 1.2, 0, 0.08, { cast: false }); pulses.push(c); } } },
  'way-factor': { at: [-11, -9.5], grow: (g, { P, night, pulses }) => { box(g, 3.8, 0.4, 3.8, mat(P.white), 0, 0, 0, 0.12); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const hit = (i === 3 && j === 5) || (i === 5 && j === 3);
    const c = box(g, 0.34, hit ? 0.3 : 0.1, 0.34, hit ? glow(P.good, night ? 1.5 : 0.8) : (i * 7 + j * 3) % 9 === 0 ? glow(P.accent, night ? 0.9 : 0.45) : mat(P.slate), -1.47 + i * 0.42, 0.4, -1.47 + j * 0.42, 0.03, { cast: false }); if (!hit && (i * 7 + j * 3) % 9 === 0) pulses.push(c); } } }
};
