/* Serving a language model, four small models and two data tables, as engines (the lab that plays them,
   src/v2/labs/serve.js, names their results in its own words, srv.* in src/i18n/en/labs.json, which its tests check;
   the network's and the architectures' words wait in src/data/waiting-words.json). Brought over from the first version of the site, with the same numbers (the branch
   'before'): topics/accelerators/labs/quantization-lab.js,
   prefill-vs-decode.js, architecture-explorer.js, real-chip-comparison.js and topics/datacenter/labs/energy-per-token.js,
   cluster-network.js, with the challenges in the topics' topic.json. Pure functions, no DOM, ids only; the same style
   as src/engines/aichip.js, which holds the roofline, the HBM stack and the GPU cost.

   quantize: 4,096 weights (a bell curve, from a seeded generator, so every run is the same) are rounded to the numbers a
   format can store (sign, exponent bits E, mantissa bits M, a largest value), after dividing by a scale: one for the
   whole tensor, or one per block of 16 (NVFP4-style) or of 32, rounded up to a power of two (MXFP4-style). A share of
   the weights are outliers, 12 times bigger; one big value stretches a whole-tensor scale and crushes the small weights
   to zero. Signal-to-noise is -20 log10 of the rounding error over the signal. Scales cost bits: a half or a quarter bit
   per weight. prefillDecode: reading a prompt is one parallel pass (compute-bound, half of peak FP8 in use); writing the
   answer is one pass per token (the slower of reading the weights and doing the math). energyPerToken: accelerator
   watts, plus the rest of the server and network, times PUE, over tokens per second, gives joules per token.
   clusterNetwork: GPUs, a scale-up domain, switches of 64 ports in as many tiers as it takes, a link and two
   transceivers per GPU per tier; optics power with pluggables or co-packaged optics, over the whole. Each lab has its
   defaults; the challenges are check functions over the same settings. */

import { CHIPS as AI_CHIPS } from './aichip.js';


/* ---------- quantization ---------- */
/* E exponent bits, M mantissa bits, the largest value, bits per weight, and speed (the first version's column: 1, 2 or 4 times) */
export const QUANT_FORMATS = {
  fp16: { e: 5, m: 10, max: 65504, bits: 16, speed: 1 },
  bf16: { e: 8, m: 7, max: 3.39e38, bits: 16, speed: 1 },
  e4m3: { e: 4, m: 3, max: 448, bits: 8, speed: 2 },
  e5m2: { e: 5, m: 2, max: 57344, bits: 8, speed: 2 },
  fp4: { e: 2, m: 1, max: 6, bits: 4, speed: 4 }
};
export const QUANT_SCALES = { tensor: { block: 0, extra: 0 }, nv16: { block: 16, extra: 0.5 }, mx32: { block: 32, extra: 0.25 } };
export const QUANT_PARAMS_B = 70, QUANT_N = 4096, QUANT_OUTLIER = 12, QUANT_SEED = 42;
export const QUANT_DEFAULTS = { format: 'fp4', scaling: 'tensor', outliers: 0.5 };   // outliers in percent of weights, 0 to 3

/* the first version's seeded generator (mulberry32) and a bell curve from it */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const gauss = r => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
let WEIGHTS = null;                                      // { base: bell-curve weights, pick: which are outliers, by a second draw }
const weights = () => WEIGHTS || (() => {
  const R = rng(QUANT_SEED);
  const base = Array.from({ length: QUANT_N }, () => gauss(R)), pick = Array.from({ length: QUANT_N }, () => R());
  return (WEIGHTS = { base, pick });
})();
/* round x to the nearest number a format with E exponent bits, M mantissa bits and largest value maxV can store */
export function roundTo(x, e, m, maxV) {
  const a = Math.abs(x); if (a === 0) return 0;
  const emin = 1 - (2 ** (e - 1) - 1);
  let ex = Math.floor(Math.log2(a)); if (ex < emin) ex = emin;
  const st = 2 ** (ex - m);
  return Math.sign(x) * Math.min(Math.round(a / st) * st, maxV);
}
/* Returns { bits, memGB (70B weights), rel (rounding error over signal), snrDb, zeroShare (weights that fell to zero),
   speed, scale (the middle scale), verdict ('lossless' | 'small' | 'noticeable' | 'coarse'), mode, outliers (count) } */
export function quantize(s = QUANT_DEFAULTS) {
  const { format, scaling, outliers } = { ...QUANT_DEFAULTS, ...s };
  const f = QUANT_FORMATS[format]; if (!f || !QUANT_SCALES[scaling]) throw new Error('unknown format or scaling');
  const is16 = f.bits === 16, mode = is16 ? 'tensor' : scaling, share = outliers / 100;
  const { base, pick } = weights();
  const X = base.map((v, i) => pick[i] < share ? v * QUANT_OUTLIER : v), N = X.length, Y = new Float64Array(N), scales = [];
  if (mode === 'tensor') {
    let mx = 0; for (const v of X) mx = Math.max(mx, Math.abs(v));
    const sc = is16 ? 1 : mx / f.max; scales.push(sc);
    X.forEach((v, i) => { Y[i] = roundTo(v / sc, f.e, f.m, f.max) * sc; });
  } else {
    const B = QUANT_SCALES[mode].block;
    for (let k = 0; k < N; k += B) {
      let mx = 0; for (let i = k; i < k + B; i++) mx = Math.max(mx, Math.abs(X[i]));
      let sc = (mx / f.max) || 1; if (mode === 'mx32') sc = 2 ** Math.ceil(Math.log2(sc));
      scales.push(sc);
      for (let i = k; i < k + B; i++) Y[i] = roundTo(X[i] / sc, f.e, f.m, f.max) * sc;
    }
  }
  let num = 0, den = 0, zeros = 0, out = 0;
  for (let i = 0; i < N; i++) { num += (Y[i] - X[i]) ** 2; den += X[i] ** 2; if (Y[i] === 0 && X[i] !== 0) zeros++; if (pick[i] < share) out++; }
  const rel = Math.sqrt(num / den), bits = f.bits + QUANT_SCALES[mode].extra;
  scales.sort((a, b) => a - b);
  return {
    bits, memGB: QUANT_PARAMS_B * bits / 8, rel, snrDb: -20 * Math.log10(Math.max(rel, 1e-9)), zeroShare: zeros / N,
    speed: f.speed, scale: scales[Math.floor(scales.length / 2)], mode, outliers: out,
    verdict: rel < 0.01 ? 'lossless' : rel < 0.06 ? 'small' : rel < 0.2 ? 'noticeable' : 'coarse'
  };
}
/* Challenge 'Four bits, despite outliers' (accelerators): at least 1% outliers, under 40 GB and above 20 dB, judged as the
   first version showed them (memory and signal-to-noise to one decimal place). */
export function fourBits(s) {
  if (s.outliers < 1) return false;
  const r = quantize(s);
  return +r.memGB.toFixed(1) < 40 && +r.snrDb.toFixed(1) > 20;
}

/* ---------- prefill and decode ---------- */
/* Chips for the timeline: pf8 in PFLOPS (dense FP8), gb in GB, bw in TB/s. `facts`: ids in src/data/facts.json (Rubin's
   figures are the ones aichip.js holds, with FP8 at half of FP4). */
export const SERVE_CHIPS = [
  { id: 'rubin', pf8: AI_CHIPS.find(c => c.id === 'rubin').pf4 * 0.5, gb: 288, bw: 22, facts: ['rubin-gpu'] },
  { id: 'mi455x', pf8: 20.1, gb: 432, bw: 23.3, facts: ['amd-mi400'] },
  { id: 'maia200', pf8: 5, gb: 216, bw: 7, facts: ['maia-200'] },
  { id: 'ironwood', pf8: 4.6, gb: 192, bw: 7.4, facts: ['tpu-ironwood'] },
  { id: 'trainium3', pf8: 2.52, gb: 144, bw: 4.9, facts: ['trainium3'] }
];
export const serveChipOf = id => SERVE_CHIPS.find(c => c.id === id);
export const PREFILL_MODELS = [8, 70, 405];          // billions of parameters
export const PREFILL_USE = 0.5;                      // the share of peak FP8 a prefill pass reaches
export const PREFILL_DEFAULTS = { chipId: 'rubin', paramsB: 70, promptSlider: 600, answerSlider: 550 };
/* the first version's sliders, 0..1000: prompt 100 to 128,000 tokens, answer 10 to 4,000 */
export const promptOfSlider = v => Math.round(100 * Math.pow(1280, v / 1000));
export const answerOfSlider = v => Math.round(10 * Math.pow(400, v / 1000));

/* Returns { chips, prefillS (time to first token), decodeStepS, tokPerS, decodeS, totalS, promptTokens, answerTokens,
   dominant ('prefill' | 'decode'), readVsWrite (how many times faster a prompt token is read than an answer token is written) } */
export function prefillDecode(s = PREFILL_DEFAULTS) {
  const { chipId, paramsB: P, promptSlider, answerSlider } = { ...PREFILL_DEFAULTS, ...s };
  const ch = serveChipOf(chipId); if (!ch) throw new Error('unknown chip');
  const Li = s.promptTokens ?? promptOfSlider(promptSlider), Lo = s.answerTokens ?? answerOfSlider(answerSlider);
  const G = Math.max(1, Math.ceil(P * 1.2 / ch.gb)), F = G * ch.pf8 * 1e15 * PREFILL_USE, BW = G * ch.bw * 1e12;
  const tp = 2 * P * 1e9 * Li / F, td1 = Math.max(P * 1e9 / BW, 2 * P * 1e9 / F), td = Lo * td1;
  return {
    chips: G, prefillS: tp, decodeStepS: td1, tokPerS: 1 / td1, decodeS: td, totalS: tp + td, promptTokens: Li, answerTokens: Lo,
    dominant: tp > td ? 'prefill' : 'decode', readVsWrite: td1 / (tp / Li)
  };
}
/* Challenge 'Read fast, write slow' (accelerators): Rubin, 70B, a 270-token answer, and a prompt of 65,000 to 90,000 tokens
   (where reading it takes about as long as writing the answer). */
export function readFastWriteSlow(s) {
  if (s.chipId !== 'rubin' || s.paramsB !== 70) return false;
  const r = prefillDecode(s);
  return r.answerTokens === 270 && r.promptTokens >= 65000 && r.promptTokens <= 90000;
}

/* ---------- energy per token ---------- */
export const ENERGY_DEFAULTS = { watts: 2300, tokExp: 3.9, overhead: 35, pue: 1.2 };   // tokens a second = 10^tokExp; overhead in percent
export const PHONE_WH = 15, US_HOME_KWH = 10500;
/* Returns { tokPerS, facilityW (per accelerator, all in), parts: [accelerator, rest of server and network, cooling] in watts,
   shares (of the three), joulesPerToken, whPerAnswer (1,000 tokens), phoneShare (of a 15 Wh battery), acceleratorsPerGW,
   tokensPerDayPerGW, gwYearTWh (8.76), homesK (thousands of US homes, 10,500 kWh a year) } */
export function energyPerToken(s = ENERGY_DEFAULTS) {
  const { watts: W, tokExp, overhead, pue } = { ...ENERGY_DEFAULTS, ...s };
  const tok = Math.pow(10, tokExp), ov = overhead / 100, it = W * (1 + ov), fac = it * pue, J = fac / tok, wh = J * 1000 / 3600, gpus = 1e9 / fac;
  const parts = [W, W * ov, it * (pue - 1)];
  return {
    tokPerS: tok, facilityW: fac, parts, shares: parts.map(x => x / fac), joulesPerToken: J, whPerAnswer: wh, phoneShare: wh / PHONE_WH,
    acceleratorsPerGW: gpus, tokensPerDayPerGW: gpus * tok * 86400, gwYearTWh: 8.76, homesK: Math.round(8.76e9 / US_HOME_KWH / 1000)
  };
}

/* ---------- cluster network ---------- */
export const NET_RADIX = 64, NET_SWITCH_W = 1500, NET_OPT_W = { plug: 60, cpo: 9 + 30 }, NET_HEADROOM = 1.25;   // per link, in watts
export const NET_DOMAINS = [8, 72, 576];             // GPUs on one copper scale-up fabric: server, rack, multi-rack (2027)
export const NET_GPU_W = [1000, 2300];               // Blackwell, Rubin
export const NET_DEFAULTS = { exp: 13, domain: 72, optics: 'plug', gpuW: 2300 };   // GPUs = 2^exp, exp 3 to 17
/* Returns { gpus, tiers (0: all in one domain), switches, transceivers, linkW, switchW, netW, gpuW (with headroom), share (of
   cluster power), domains } */
export function clusterNetwork(s = NET_DEFAULTS) {
  const { exp, domain, optics, gpuW } = { ...NET_DEFAULTS, ...s };
  if (!NET_OPT_W[optics]) throw new Error('unknown optics');
  const k = NET_RADIX, N = 2 ** exp;
  let tiers = N <= k ? 1 : N <= k * k / 2 ? 2 : N <= k * k * k / 4 ? 3 : 4;
  if (N <= domain) tiers = 0;
  const links = N * tiers, linkW = links * NET_OPT_W[optics];
  const sw = tiers ? Math.ceil(N / (k / 2)) * (tiers - 1) + Math.ceil(N / k) : 0, swW = sw * NET_SWITCH_W, net = linkW + swW, it = N * gpuW * NET_HEADROOM;
  return { gpus: N, tiers, switches: sw, transceivers: 2 * links, linkW, switchW: swW, netW: net, gpuW: it, share: net / (it + net), domains: Math.ceil(N / domain) };
}

/* ---------- data only: the architecture explorer and the real chips ---------- */
/* The five designs, and the 2026 chips the first version named under each (ids of REAL_CHIPS), with figures that its words
   quoted: on-chip SRAM, and what a rack or pod holds. Its paragraphs (how it works, strengths, trade-offs) stay in the
   branch 'before' in topics/accelerators/labs/architecture-explorer.js until a view needs them. */
export const ARCHITECTURES = [
  { id: 'gpu', chips: ['rubin', 'mi455x'], hbm: true },
  { id: 'tpu', chips: ['ironwood'], hbm: true, podChips: 9216 },
  { id: 'asic', chips: ['maia200', 'trainium3'], hbm: true },
  { id: 'wafer', chips: ['cerebras'], hbm: false },
  { id: 'lpu', chips: ['groq3'], hbm: false, rackChips: 256 }
];
/* Real 2026 chips: peak in PFLOPS in the number format the maker quotes (`top`, null where not published; `approx` for
   rough ones), memory in GB, bandwidth in TB/s, watts where known. Kinds and memories are ids. `facts` as in CHIPS. */
export const REAL_CHIPS = [
  { id: 'rubin', kind: 'gpu', when: '2H 2026', top: [50, 'fp4'], gb: 288, mem: 'hbm4', bw: 22, facts: ['rubin-gpu'] },
  { id: 'mi455x', kind: 'gpu', when: '2026', top: [40.3, 'mxfp4'], gb: 432, mem: 'hbm4', bw: 23.3, facts: ['amd-mi400'] },
  { id: 'maia200', kind: 'custom', when: '2026', top: [10, 'fp4'], approx: true, gb: 216, mem: 'hbm3e', bw: 7, w: 750, facts: ['maia-200'] },
  { id: 'ironwood', kind: 'tpu', when: '2025', top: [4.6, 'fp8'], gb: 192, mem: 'hbm', bw: 7.4, w: 600, wApprox: true, facts: ['tpu-ironwood'] },
  { id: 'trainium3', kind: 'custom', when: '2025', top: [2.52, 'fp8'], gb: 144, mem: 'hbm3e', bw: 4.9, facts: ['trainium3'] },
  { id: 'cerebras', kind: 'wafer', when: '2026', top: [250, 'sparse-fp16-rack-div-3'], gb: 44, mem: 'sram-wafer', bw: 43200, facts: ['cerebras-cs4'] },
  { id: 'groq3', kind: 'lpu', when: '2H 2026', top: null, gb: 0.5, mem: 'sram-chip', bw: 150, bwUpTo: true, bwQuoted: [22, 150], facts: ['groq3-lpu'] }
];
export const realChipOf = id => REAL_CHIPS.find(c => c.id === id);
/* the comparison's bars are on a log scale: PFLOPS 1 to 1,000, GB 0.1 to 1,000, TB/s 1 to 100,000; returns 0..1, or null */
export const COMPARE_DOMAIN = { top: [1, 1000], gb: [0.1, 1000], bw: [1, 100000] };
export function compareBar(chipId, key) {
  const c = realChipOf(chipId), v = key === 'top' ? c.top && c.top[0] : c[key];
  if (!v) return null;
  const [lo, hi] = COMPARE_DOMAIN[key];
  return Math.max(0.02, (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)));
}
