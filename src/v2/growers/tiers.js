/* What the lab tiers grows on the island (src/data/labs/tiers.js), drawn by src/v2/map3d.js when its challenge is won:
   its place beside the Lab, at: [x, z], and its model, grow(g, island), built into its group g from the island's palette
   (P), night and what pulses */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* build up, not out (src/v2/labs/tiers.js): a small stack on a plinth, four tiers of silicon one on another with thin
     coolant layers between them, the bottom one (memory) dark, the logic tiers warming toward the bottom, and a ribbed
     cold plate on top */
  'lab-tiers': { at: [-21, 4], grow: (g, { P, night, pulses }) => {
    box(g, 3.2, 0.4, 3.2, mat(P.wall), 0, 0, 0, 0.1);
    box(g, 2.2, 0.5, 2.2, metal(P.dark), 0, 0.4, 0, 0.06);
    [P.warm, P.warm, P.good, P.good].forEach((c, i) => {
      const y = 0.9 + i * 0.62, t = box(g, 2.2, 0.42, 2.2, glow(c, (night ? 1.2 : 0.6) * (1 - i * 0.15)), 0, y, 0, 0.05, { cast: false });
      if (i < 2) pulses.push(t);
      box(g, 2.3, 0.1, 2.3, mat(P.accent, { roughness: 0.3 }), 0, y + 0.44, 0, 0.02, { cast: false });
    });
    box(g, 2.6, 0.3, 2.6, metal(P.metal), 0, 3.5, 0, 0.05);
    for (let k = 0; k < 5; k++) box(g, 0.18, 0.7, 2.4, metal(P.slate), -1 + k * 0.5, 3.8, 0, 0.03);
  } }
};
