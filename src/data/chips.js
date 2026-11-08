/* Real chips, one source. Labs that compare against real hardware read from here, so a figure is
   changed once. Each chip with a matching entry in facts.json names it in `fact` (source and date
   live there). Units: top and pf4/pf8 in PFLOPS (dense, per chip), gb in GB, bw in TB/s, w in watts.
   `top` is the headline peak the maker quotes, with its number format; `~` marks rough figures. */
export const CHIPS = [
  { id: 'rubin', n: 'NVIDIA Rubin', short: 'Rubin', kind: 'GPU', when: '2H 2026', proc: 'TSMC 3 nm', top: [50, 'FP4'], pf4: 50, pf8: 25, gb: 288, mem: 'HBM4', bw: 22, fact: 'rubin-gpu' },
  { id: 'mi455x', n: 'AMD MI455X', short: 'MI455X', kind: 'GPU', when: '2026', proc: 'TSMC N2 + N3', top: [40.3, 'MXFP4'], pf8: 20.1, gb: 432, mem: 'HBM4', bw: 23.3, fact: 'amd-mi400' },
  { id: 'maia200', n: 'Microsoft Maia 200', short: 'Maia 200', kind: 'Custom chip', when: '2026', proc: 'TSMC 3 nm', top: [10, 'FP4', '~'], pf8: 5, gb: 216, mem: 'HBM3E', bw: 7, w: 750, fact: 'maia-200' },
  { id: 'ironwood', n: 'Google TPU v7 Ironwood', short: 'TPU Ironwood', kind: 'TPU', when: '2025', top: [4.6, 'FP8'], pf8: 4.6, gb: 192, mem: 'HBM', bw: 7.4, w: 600, wApprox: true, fact: 'tpu-ironwood' },
  { id: 'trainium3', n: 'AWS Trainium3', short: 'Trainium3', kind: 'Custom chip', when: '2025', proc: 'TSMC 3 nm', top: [2.52, 'FP8'], pf8: 2.52, gb: 144, mem: 'HBM3E', bw: 4.9, fact: 'trainium3' },
  { id: 'cerebras', n: 'Cerebras WSE-3 (CS-4)', kind: 'Wafer-scale', when: '2026', top: [250, 'sparse FP16, rack ÷ 3'], gb: 44, mem: 'on-wafer SRAM', bw: 43200 },
  { id: 'groq3', n: 'NVIDIA Groq 3 LPU', kind: 'SRAM dataflow', when: '2H 2026', top: null, gb: 0.5, mem: 'on-chip SRAM', bw: 150, bwNote: 'up to; 22–150 quoted' },
  { id: 'b200', n: 'NVIDIA B200', short: 'B200', kind: 'GPU', when: '2025', pf4: 9, gb: 192, mem: 'HBM3E', bw: 8 },
  { id: 'h200', n: 'NVIDIA H200', short: 'H200', kind: 'GPU', when: '2024', mem: 'HBM3E', bw: 4.8 },
  { id: 'h100', n: 'NVIDIA H100', short: 'H100', kind: 'GPU', when: '2022', mem: 'HBM3', bw: 3.35 }
];

export const chip = id => CHIPS.find(c => c.id === id);
/* Several chips by id, in the order asked. */
export const chips = ids => ids.map(chip);
/* The year a chip shipped or ships, as a number ("2H 2026" gives 2026). */
export const chipYear = c => +String(c.when).slice(-4);
