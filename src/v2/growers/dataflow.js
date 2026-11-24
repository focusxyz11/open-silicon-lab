/* What the lab dataflow grows on the island (src/data/labs/dataflow.js), drawn by src/v2/map3d.js when its challenge is
   won: each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its
   group g from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box } from '../kit3d.js';

export default {
  /* keep the numbers on the chip (src/v2/labs/dataflow.js), at the Lab: a wide flat chip of tiles, each pair of tiles lit as
     one layer of a model, alternating in tone, and beside it a small dark block of memory that stands idle */
  'way-dataflow': { at: [-12, 11.5], grow: (g, { P, night, pulses }) => { box(g, 4.4, 0.36, 3.2, mat(P.white), -0.4, 0, 0, 0.12);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const i = r * 6 + (r % 2 ? 5 - c : c), layer = Math.floor(i / 2);
      const t = box(g, 0.56, 0.12, 0.56, glow(layer % 2 ? P.accent : P.good, night ? (layer % 2 ? 1.2 : 0.9) : 0.55), -2.05 + c * 0.66, 0.36, -1.0 + r * 0.66, 0.04, { cast: false });
      if (i % 5 === 0) pulses.push(t); }
    box(g, 0.9, 0.9, 1.6, metal(P.dark), 2.5, 0, 0, 0.08); } }
};
