/* What the lab trigger grows on the island (src/data/labs/trigger.js), drawn by src/v2/map3d.js when its challenge is
   won: its place beside the Lab, at: [x, z], and its model, grow(g, island), built into its group g from the island's
   palette (P), night and what pulses */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* trust it or not (src/v2/labs/trigger.js): a small inspection bench, an adder's chain of eight cells on it under a
     lamp on an arm, one cell lit red where the hidden gate was found */
  'lab-trigger': { at: [-15, 15], grow: (g, { P, night, pulses }) => {
    box(g, 3.4, 0.9, 1.8, mat(P.wall), 0, 0, 0, 0.1);
    box(g, 3.0, 0.12, 1.2, metal(P.dark), 0, 0.9, 0, 0.03);
    for (let k = 0; k < 8; k++) { const c = box(g, 0.28, 0.12, 0.5, glow(k === 5 ? P.bad : P.accent, night ? (k === 5 ? 1.6 : 0.7) : (k === 5 ? 1 : 0.35)), -1.2 + k * 0.34, 1.02, 0, 0.02, { cast: false }); if (k === 5) pulses.push(c); }
    box(g, 0.14, 1.8, 0.14, metal(P.slate), 1.5, 0.9, -0.7, 0.02);
    box(g, 1.4, 0.12, 0.14, metal(P.slate), 0.85, 2.7, -0.7, 0.02);
    box(g, 0.6, 0.22, 0.5, glow(P.white, night ? 1.2 : 0.4), 0.3, 2.5, -0.5, 0.05, { cast: false });
  } }
};
