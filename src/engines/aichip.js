/* Three small models of an AI chip, as engines (the labs' words: src/i18n/en.json; the views that read them: not yet built).
   Brought over from the first version of the site, with the same numbers: topics/accelerators/labs/roofline.js,
   topics/memory/labs/hbm-stack-builder.js and topics/economics/labs/gpu-cost-breakdown.js (the first version's
   checkout, /tmp/v1, and its src/data/chips.js). Pure functions, no DOM, no words shown to people: ids only.

   roofline: serving a language model one token at a time (decode) reads every weight once per step, so the step takes
   as long as the slower of two things: reading the weights (bytes over bandwidth) and doing the math (2 x parameters x
   users over peak speed). The weights are split over as many chips as it takes to hold them (80% of each chip's
   memory; the rest is for the working notes of the conversation). Few users: memory-bound; many: compute-bound.
   hbmStack: memory per GPU and bandwidth from the stack's shape (dies, pin speed, stacks), and how thin each die must
   be to fit under the package height limit. gpuCost: wafer price, die area and defects give good dies; add memory,
   packaging, scrap and test, and the cost of one GPU, its memory share and its margin follow.
   Each lab has its default settings, and the two roofline challenges are check functions over the same settings. */

/* Chips: pf4 in PFLOPS (dense FP4), gb in GB, bw in TB/s. `facts` names the ids in src/data/facts.json behind them
   (none where the file has no entry: the B200 figures and the phone, which is illustrative, have no source there). */
export const CHIPS = [
  { id: 'rubin', pf4: 50, gb: 288, bw: 22, when: 2026, facts: ['rubin-gpu'] },
  { id: 'b200', pf4: 9, gb: 192, bw: 8, when: 2025, facts: [] },
  { id: 'phone', pf4: 0.04, gb: 12, bw: 0.08, when: null, illustrative: true, facts: [] }
];
export const chipOf = id => CHIPS.find(c => c.id === id);

/* Number formats: bytes per weight, and peak speed against FP4 (FP8 is half as fast, FP16 a quarter) */
export const FORMATS = { fp16: { bytes: 2, speed: 0.25 }, fp8: { bytes: 1, speed: 0.5 }, fp4: { bytes: 0.5, speed: 1 } };
export const FILL = 0.8;                         // the share of a chip's memory that may hold weights

export const ROOFLINE_DEFAULTS = { chipId: 'rubin', paramsB: 70.5, format: 'fp4', batch: 1 };
/* the first version's sliders: 0..1000 to billions of parameters (1 to about 2,000) and to users (1 to 1,024) */
export const paramsOfSlider = v => Math.pow(10, 3.3 * v / 1000);
export const batchOfSlider = v => Math.max(1, Math.round(Math.pow(2, 10 * v / 1000)));

/* One decode step. Returns { chips, stepS, tokPerUser, tokTotal, utilization (0..1), memoryBound, ridge (operations
   per byte, where the two limits meet), intensity (operations per byte of this workload), weightGB, tMemS, tCmpS } */
export function roofline(chipId = ROOFLINE_DEFAULTS.chipId, paramsB = ROOFLINE_DEFAULTS.paramsB, format = ROOFLINE_DEFAULTS.format, batch = ROOFLINE_DEFAULTS.batch) {
  const ch = chipOf(chipId), f = FORMATS[format];
  if (!ch || !f) throw new Error('unknown chip or format');
  const peak = ch.pf4 * f.speed;                                   // PFLOPS in this format
  const wBytes = paramsB * 1e9 * f.bytes;
  const chips = Math.max(1, Math.ceil(wBytes / (ch.gb * 1e9 * FILL)));
  const tMemS = wBytes / (chips * ch.bw * 1e12);
  const tCmpS = 2 * paramsB * 1e9 * batch / (chips * peak * 1e15);
  const stepS = Math.max(tMemS, tCmpS);
  return {
    chips, stepS, tMemS, tCmpS, weightGB: wBytes / 1e9,
    tokPerUser: 1 / stepS, tokTotal: batch / stepS, utilization: tCmpS / stepS,
    memoryBound: tMemS >= tCmpS, ridge: peak * 1000 / ch.bw, intensity: 2 * batch / f.bytes
  };
}

/* Challenge 'Feed the beast' (accelerators): 70B in FP8 on Rubin, the batch raised until the chip stops waiting for memory
   (the first version showed utilization as a whole percent: 100 means 99.5 or more), with no more than 724 users. */
export function feedTheBeast(s) {
  if (s.chipId !== 'rubin' || s.format !== 'fp8' || s.paramsB < 69 || s.paramsB > 71 || s.batch > 724) return false;
  return roofline(s.chipId, s.paramsB, s.format, s.batch).utilization >= 0.995;
}
/* Challenge 'An assistant in your pocket': on the phone, one chip holds it, 20 tokens a second per user, at least 7B */
export function pocketAssistant(s) {
  if (s.chipId !== 'phone' || s.paramsB < 7) return false;
  const r = roofline(s.chipId, s.paramsB, s.format, s.batch);
  return r.chips === 1 && r.tokPerUser >= 20;
}

/* HBM: [id, bus width in bits, default Gb/s per pin, highest announced pin speed, die Gb, height limit in um, allowed dies per stack] */
export const HBM_GENERATIONS = [
  { id: 'hbm3e', bits: 1024, pin: 9.6, maxPin: 9.8, dieGb: 24, limitUm: 720, heights: [8, 12, 16] },
  { id: 'hbm4', bits: 2048, pin: 10.7, maxPin: 12, dieGb: 24, limitUm: 775, heights: [8, 12, 16] },
  { id: 'hbm4e', estimate: true, bits: 2048, pin: 12, maxPin: 14, dieGb: 32, limitUm: 775, heights: [12, 16, 20] }
];
export const HBM_BASE_UM = 110, HBM_LID_UM = 60;           // the logic die under the stack, and the top layer
export const HBM_GAP_UM = { bump: 14, hybrid: 1 };         // between dies: micro-bumps, or fused copper pads
export const HBM_DEFAULTS = { gen: 'hbm4', dies: 12, bonding: 'bump', pin: 10.7, stacks: 8 };
/* a die thinner than this cannot be made, and under this it is hard (yields fall) */
export const DIE_IMPOSSIBLE_UM = 12, DIE_THIN_UM = 30;

/* Returns { gb (per GPU), tbs (per GPU), gbPerStack, tbsPerStack, dieUm (thickness each die must be ground to), gapUm,
   wires (data wires to the GPU), fits (dieUm at least 12), thin (under 30), pinAboveAnnounced, heatWarning (16 or more high),
   likeRubin (HBM4, 12 high, 8 stacks, 10.5 Gb/s or more) } */
export function hbmStack(s = HBM_DEFAULTS) {
  const g = HBM_GENERATIONS.find(x => x.id === s.gen);
  if (!g) throw new Error('unknown generation');
  const gbPerStack = s.dies * g.dieGb / 8, tbsPerStack = g.bits * s.pin / 8 / 1000;
  const gapUm = HBM_GAP_UM[s.bonding];
  const dieUm = (g.limitUm - HBM_BASE_UM - HBM_LID_UM) / s.dies - gapUm;
  return {
    gb: gbPerStack * s.stacks, tbs: tbsPerStack * s.stacks, gbPerStack, tbsPerStack, dieUm, gapUm,
    wires: g.bits * s.stacks, fits: dieUm >= DIE_IMPOSSIBLE_UM, thin: dieUm < DIE_THIN_UM,
    pinAboveAnnounced: s.pin > g.maxPin, heatWarning: s.dies >= 16,
    likeRubin: s.gen === 'hbm4' && s.dies === 12 && s.stacks === 8 && s.pin >= 10.5
  };
}
/* The generation changes the pin speed to its default and the dies to an allowed height, as the first version did */
export function withGeneration(s, gen) {
  const g = HBM_GENERATIONS.find(x => x.id === gen);
  return { ...s, gen, pin: g.pin, dies: g.heights.includes(s.dies) ? s.dies : g.heights[1] };
}

/* GPU cost: dollars. Two compute dies per GPU on a 300 mm wafer; Poisson yield; packaging 1,100; board and test 480.
   Facts behind it: gpu-cost (Epoch AI's estimate for a B200), hbm4. */
export const GPU_FACTS = ['gpu-cost'];
export const COST_PACKAGING = 1100, COST_BOARD = 480, DIES_PER_GPU = 2, WAFER_MM = 300;
export const GPU_COST_DEFAULTS = { wafer: 18000, area: 800, d0: 0.07, hbmGB: 192, hbmPerGB: 15, packYield: 0.84, price: 35000 };

/* Returns { grossDies, dieYield, goodDies (fractional, at least 0.5), dieCost, parts: {dies, hbm, packaging}, yieldLoss,
   board, cost, memShare (HBM including what its scrap costs, over cost), margin, profit, biggest ('hbm' | 'dies' | 'mixed') } */
export function gpuCost(s = GPU_COST_DEFAULTS) {
  const { wafer: W, area: A, d0: D0, hbmGB: H, hbmPerGB: HP, packYield: PY, price: S } = { ...GPU_COST_DEFAULTS, ...s };
  const grossDies = Math.max(1, Math.floor(Math.PI * 150 * 150 / A - Math.PI * WAFER_MM / Math.sqrt(2 * A)));
  const dieYield = Math.exp(-A / 100 * D0);
  const goodDies = Math.max(0.5, grossDies * dieYield);
  const dieCost = W / goodDies, dies = DIES_PER_GPU * dieCost, hbm = H * HP, packaging = COST_PACKAGING;
  const partsSum = dies + hbm + packaging, yieldLoss = partsSum * (1 / PY - 1);
  const cost = partsSum + yieldLoss + COST_BOARD;
  return {
    grossDies, dieYield, goodDies, dieCost, parts: { dies, hbm, packaging }, yieldLoss, board: COST_BOARD, cost,
    memShare: (hbm / PY) / cost, margin: (S - cost) / S, profit: S - cost,
    biggest: hbm > dies + packaging + COST_BOARD ? 'hbm' : dies > hbm ? 'dies' : 'mixed'
  };
}
