/* New ways to compute, as engines: small, honest models of each paradigm, and the checks of their challenges.
   Ported unchanged from the first version of the site (src/engines/paradigms.js there; the labs that used it were
   topics/{beyond,cim,neuro,photonic,pbits,reversible,spatial,quantum}/labs). Pure logic, no DOM, no words: the
   data and every visible word are in src/data/paradigms.js (WORDS). Quantum search is its own engine, grover.js.

   Each model keeps only the idea that makes its paradigm different, and what is left out is said by the pages:
   energy of math against moving data (45 nm, Table I of arXiv:1602.04183), a compute-in-memory crossbar (noise
   and converters), a spiking neuron, a Mach-Zehnder mesh, two qubits, p-bits (an AND gate run backwards),
   reversible logic (Landauer limit, adiabatic ramp, Toffoli) and dataflow (weights kept on chip).

   CHECKS: one pure function per challenge id (words: para.ch.<id>.t / .goal / .done). Each takes the state a
   player has reached and says whether the goal is met; the lab's own thresholds are kept. checkOf(id, state). */

/* New ways to compute: small, honest models of each paradigm. Pure logic, no DOM.
   Each one keeps only the idea that makes the paradigm different; the labs say what is left out. */

/* ---------- seeded randomness ---------- */
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }

/* ---------- energy of computing vs moving data (45 nm, 16-bit; Table I of arXiv:1602.04183) ---------- */
export const E16 = { add: 0.18, mul: 0.62, rf: 0.12, sram4k: 8, sram32k: 11, dram: 640 };
/* One multiply-accumulate whose two operands come from `where`, each fetched number reused `reuse` times. */
export function macEnergy(where, reuse) {
  const fetch = { rf: E16.rf, sram: E16.sram32k, dram: E16.dram }[where];
  const move = 2 * fetch / Math.max(1, reuse);
  const math = E16.add + E16.mul;
  return { math, move, total: math + move, share: move / (math + move) };
}

/* ---------- compute in memory: an analog crossbar ---------- */
/* W: rows × cols weights in [-1, 1] (one column per output), x: inputs in [0, 1].
   Weights are stored as conductance pairs quantized to wBits, each device has relative noise sigma,
   and every column current is digitized by an ADC with adcBits. */
export function crossbar(W, x, { wBits = 8, sigma = 0, adcBits = 8, seed = 1 } = {}) {
  const r = rng(seed), rows = W.length, cols = W[0].length;
  const q = (v, bits) => { const L = (1 << (bits - 1)) - 1 || 1; return Math.round(v * L) / L; };
  const exact = [], analog = [];
  for (let j = 0; j < cols; j++) {
    let e = 0, a = 0;
    for (let i = 0; i < rows; i++) {
      e += W[i][j] * x[i];
      const g = q(W[i][j], wBits) * (1 + sigma * gauss(r));
      a += g * x[i];
    }
    exact.push(e);
    /* ADC full scale: the largest possible column current. */
    const full = rows, L = (1 << (adcBits - 1)) - 1;
    analog.push(Math.round(Math.max(-full, Math.min(full, a)) / full * L) / L * full);
  }
  const err = Math.sqrt(exact.reduce((s, e, j) => s + (e - analog[j]) ** 2, 0) / cols) / Math.max(1e-9, Math.sqrt(exact.reduce((s, e) => s + e * e, 0) / cols));
  return { exact, analog, err };
}
/* Illustrative energy per matrix-vector product, in pJ: digital fetches every weight from SRAM and does
   a MAC; analog spends little in the array but pays an ADC per column whose cost doubles per bit. */
export function cimEnergy(rows, cols, adcBits) {
  const digital = rows * cols * (E16.sram4k / 2 + E16.mul / 2 + E16.add / 2);
  const analog = rows * cols * 0.01 + cols * 0.25 * 2 ** (adcBits - 4);
  return { digital, analog };
}

/* ---------- neuromorphic: leaky integrate-and-fire neurons ---------- */
export const SNN_W = [[0.55, 0.55, -0.4, -0.4], [-0.4, -0.4, 0.55, 0.55]]; /* detector A, detector B */
export function spikeTrains(pattern, steps = 40, seed = 3) {
  const r = rng(seed + { A: 0, B: 100, noise: 200, quiet: 300 }[pattern]);
  const rate = { A: [0.5, 0.45, 0.06, 0.05], B: [0.05, 0.06, 0.45, 0.5], noise: [0.15, 0.15, 0.15, 0.15], quiet: [0.02, 0.02, 0.02, 0.02] }[pattern];
  return rate.map(p => Array.from({ length: steps }, () => (r() < p ? 1 : 0)));
}
export function lif(trains, W, { threshold = 1, leak = 0.2 } = {}) {
  const steps = trains[0].length, n = W.length;
  const v = Array(n).fill(0), V = W.map(() => []), S = W.map(() => []);
  let events = 0;
  for (let t = 0; t < steps; t++) {
    const inSpikes = trains.map(tr => tr[t]);
    events += inSpikes.reduce((a, b) => a + b, 0) * n;
    for (let k = 0; k < n; k++) {
      v[k] = v[k] * (1 - leak) + inSpikes.reduce((s, sp, i) => s + sp * W[k][i], 0);
      let fired = 0; if (v[k] >= threshold) { fired = 1; v[k] = 0; }
      V[k].push(v[k]); S[k].push(fired); events += fired;
    }
  }
  const dense = trains.length * n * steps;
  return { V, S, counts: S.map(s => s.reduce((a, b) => a + b, 0)), events, dense };
}

/* ---------- photonics: one Mach-Zehnder interferometer ---------- */
const cx = (re, im = 0) => ({ re, im });
const cmul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cadd = (a, b) => cx(a.re + b.re, a.im + b.im);
const ex = p => cx(Math.cos(p), Math.sin(p));
const BS = [[cx(Math.SQRT1_2), cx(0, Math.SQRT1_2)], [cx(0, Math.SQRT1_2), cx(Math.SQRT1_2)]];
const mm = (A, B) => A.map((row, i) => B[0].map((_, j) => row.reduce((s, a, k) => cadd(s, cmul(a, B[k][j])), cx(0))));
/* Transfer matrix: phase phi on the top input, a 50:50 coupler, phase theta on the top arm, another coupler. */
export function mziMatrix(theta, phi) { return mm(BS, mm([[ex(theta), cx(0)], [cx(0), cx(1)]], mm(BS, [[ex(phi), cx(0)], [cx(0), cx(1)]]))); }
export function mzi(inputs, theta, phi, { phaseNoise = 0, seed = 1 } = {}) {
  const r = rng(seed); const t = theta + phaseNoise * gauss(r), p = phi + phaseNoise * gauss(r);
  const U = mziMatrix(t, p), a = inputs.map(v => cx(v));
  const out = U.map(row => row.reduce((s, u, k) => cadd(s, cmul(u, a[k])), cx(0)));
  return { amp: out, power: out.map(o => o.re * o.re + o.im * o.im) };
}

/* ---------- quantum: two qubits, state vector ---------- */
/* Basis order |q0 q1>: index = q0 * 2 + q1. */
export function qinit() { return [cx(1), cx(0), cx(0), cx(0)]; }
const G1 = { H: [[cx(Math.SQRT1_2), cx(Math.SQRT1_2)], [cx(Math.SQRT1_2), cx(-Math.SQRT1_2)]], X: [[cx(0), cx(1)], [cx(1), cx(0)]], Z: [[cx(1), cx(0)], [cx(0), cx(-1)]], S: [[cx(1), cx(0)], [cx(0), cx(0, 1)]] };
export function qapply(state, gate, q) {
  const s = state.slice();
  if (gate === 'CX' || gate === 'XC') { /* CX: control q0, target q1; XC: control q1, target q0 */
    const out = s.slice();
    for (let i = 0; i < 4; i++) { const q0 = i >> 1, q1 = i & 1; if (gate === 'CX' && q0) out[(q0 << 1) | (1 - q1)] = s[i]; if (gate === 'XC' && q1) out[((1 - q0) << 1) | q1] = s[i]; }
    return out;
  }
  const M = G1[gate]; const bit = q === 0 ? 2 : 1;
  for (let i = 0; i < 4; i++) if (!(i & bit)) { const a = s[i], b = s[i | bit]; s[i] = cadd(cmul(M[0][0], a), cmul(M[0][1], b)); s[i | bit] = cadd(cmul(M[1][0], a), cmul(M[1][1], b)); }
  return s;
}
/* circuit: array of columns; each column is [gateOnQ0, gateOnQ1] or ['CX'] / ['XC'] for two-qubit gates. */
export function qrun(circuit) { let s = qinit(); for (const col of circuit) { if (col[0] === 'CX' || col[0] === 'XC') s = qapply(s, col[0]); else { if (col[0]) s = qapply(s, col[0], 0); if (col[1]) s = qapply(s, col[1], 1); } } return s; }
export const qprobs = s => s.map(a => a.re * a.re + a.im * a.im);
export function qsample(s, shots, seed = 7) { const r = rng(seed), p = qprobs(s), c = [0, 0, 0, 0]; for (let k = 0; k < shots; k++) { let u = r(), i = 0; while (i < 3 && u > p[i]) { u -= p[i]; i++; } c[i]++; } return c; }

/* ---------- probabilistic bits: an invertible AND gate ---------- */
/* Bipolar p-bits A, B, C (−1 or +1). These weights make the three states with C = A AND B the lowest-energy ones. */
export const AND_J = [[0, -1, 2], [-1, 0, 2], [2, 2, 0]];
export const AND_H = [1, 1, -2];
export function pEnergy(m, J = AND_J, h = AND_H) { let e = 0; for (let i = 0; i < m.length; i++) { e -= h[i] * m[i]; for (let j = i + 1; j < m.length; j++) e -= J[i][j] * m[i] * m[j]; } return e; }
/* Gibbs-style updates: each free p-bit flips at random, biased by its neighbors; beta is how strongly. */
export function pSample({ beta = 1, clamp = {}, sweeps = 2000, seed = 11, J = AND_J, h = AND_H } = {}) {
  const r = rng(seed), n = h.length; const m = Array.from({ length: n }, (_, i) => clamp[i] !== undefined ? clamp[i] : (r() < 0.5 ? -1 : 1));
  const counts = {};
  for (let s = 0; s < sweeps; s++) {
    for (let i = 0; i < n; i++) { if (clamp[i] !== undefined) continue; let I = h[i]; for (let j = 0; j < n; j++) I += J[i][j] * m[j]; m[i] = Math.tanh(beta * I) > r() * 2 - 1 ? 1 : -1; }
    const key = m.map(v => (v > 0 ? 1 : 0)).join(''); counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/* ---------- reversible computing ---------- */
export const K_B = 1.380649e-23;
export const landauer = (tempK = 300) => K_B * tempK * Math.LN2;
/* Energy lost each time a wire of capacitance C switches abruptly to V, and when ramped slowly over time T through resistance R. */
export const switchLoss = (C, V) => 0.5 * C * V * V;
export const adiabaticLoss = (C, V, R, T) => Math.min(0.5 * C * V * V, (R * C / T) * C * V * V);
export const toffoli = (a, b, c) => [a, b, c ^ (a & b)];

/* ---------- dataflow / spatial: keep the weights where the work happens ---------- */
/* Energy per inference in microjoules for a model with `layers` layers of `mbPerLayer` MB of 8-bit weights.
   Von Neumann fetches every weight from DRAM; spatial keeps what fits in on-chip SRAM across tiles
   and fetches only the rest. Uses the 45 nm per-bit costs above. */
export function dataflowEnergy({ layers, mbPerLayer, tiles, mbPerTile, mode }) {
  const bits = layers * mbPerLayer * 8e6;
  const dramBit = E16.dram / 16, sramBit = E16.sram32k / 16;
  const fit = mode === 'spatial' ? Math.min(1, (tiles * mbPerTile) / (layers * mbPerLayer)) : 0;
  const pj = bits * (fit * sramBit + (1 - fit) * dramBit);
  return { uj: pj / 1e6, fit };
}

/* ---------- challenges: one check per goal, by id ---------- */
/* Same job, ten machines: the player picked a job, and it has a best machine to be shown. */
function checkJobs({ job } = {}, jobs) {
  const j = (jobs || []).find(x => x.id === job);
  return !!j && Object.values(j.fit).some(v => v >= 3);
}
/* Fewest bits that still work: within 5% of exact, and no cheaper converter would do (one bit fewer breaks the 5%).
   The lab only showed the 5% test; "cheapest" is the goal's own word, so the check asks for the fewest bits. */
export const CIM_TOLERANCE = 0.05;
export function checkCimBits({ W, x, wBits = 8, sigma = 0, adcBits = 8, seed = 1 } = {}) {
  if (!W || !x) return false;
  const err = b => crossbar(W, x, { wBits, sigma, adcBits: b, seed }).err;
  return err(adcBits) <= CIM_TOLERANCE && (adcBits <= 2 || err(adcBits - 1) > CIM_TOLERANCE);
}
/* Spot the pattern: detector A fires for A (at least 3 spikes) and the neurons are silent for B, noise and quiet. */
export function neuroGoal(threshold, leak) {
  const n = p => lif(spikeTrains(p), SNN_W, { threshold, leak }).counts[0];
  return { a: n('A'), others: n('B') + n('noise') + n('quiet') };
}
export const checkNeuroSpot = ({ threshold = 1, leak = 0.2 } = {}) => { const g = neuroGoal(threshold, leak); return g.a >= 3 && g.others === 0; };
/* Steer the light: all light in the top input, and the top output has the target share (within 3 points). */
export const PHOTONIC_TARGETS = { bottom: 0, split: 0.5, quarter: 0.25 };
export function checkPhotonicSteer({ goal = 'bottom', theta: th = 0, phi = 0, top = 1, phaseNoise = 0, seed = 1 } = {}) {
  if (!(goal in PHOTONIC_TARGETS) || Math.abs(top - 1) > 1e-9) return false;
  const p = mzi([Math.sqrt(top), Math.sqrt(1 - top)], th, phi, { phaseNoise, seed }).power;
  return Math.abs(p[0] - PHOTONIC_TARGETS[goal]) < 0.03;
}
/* Run logic backwards: the output clamped to 1, the inputs free, steered enough: the network sits in 111 most of the time. */
export function checkPbitsBackwards({ beta = 2, clamp = { 2: 1 }, sweeps = 2000, seed = 11 } = {}) {
  if (clamp[2] !== 1 || clamp[0] !== undefined || clamp[1] !== undefined || beta < 0.3) return false;
  const c = pSample({ beta, clamp, sweeps, seed });
  return (c['111'] || 0) / sweeps >= 0.9;
}
/* Approach the Landauer limit: the lab's wire (1 fF, 1 kΩ). log10Time is the ramp time as a power of ten, in seconds. */
export const WIRE = { C: 1e-15, R: 1e3 };
export function checkReversibleLimit({ log10Time = -11, V = 0.7 } = {}) {
  return switchLoss(WIRE.C, V) / adiabaticLoss(WIRE.C, V, WIRE.R, 10 ** log10Time) >= 100;
}
/* Make the model fit: configs the player tried ({layers, mbPerLayer, tiles, mbPerTile}); one fits whole, one does not. */
export function checkSpatialFit(tried = []) {
  const fits = tried.map(c => dataflowEnergy({ ...c, mode: 'spatial' }).fit);
  return fits.some(f => f >= 1) && fits.some(f => f < 1);
}
/* The two-qubit puzzles, on the probabilities of the circuit (p) and the circuit itself (circuit). */
const has = (circuit, g) => (circuit || []).some(col => col[0] === g || col[1] === g);
export const checkQubitOne = ({ circuit }) => qprobs(qrun(circuit))[3] > 0.999;
export const checkQubitBack = ({ circuit }) => qprobs(qrun(circuit))[0] > 0.999 && has(circuit, 'H');
export const checkQubitBell = ({ circuit }) => { const p = qprobs(qrun(circuit)); return Math.abs(p[0] - 0.5) < 0.01 && Math.abs(p[3] - 0.5) < 0.01; };
export const checkQubitOdd = ({ circuit }) => { const p = qprobs(qrun(circuit)); return Math.abs(p[1] - 0.5) < 0.01 && Math.abs(p[2] - 0.5) < 0.01; };

export const CHECKS = {
  'jobs': checkJobs, 'cim-bits': checkCimBits, 'neuro-spot': checkNeuroSpot, 'photonic-steer': checkPhotonicSteer,
  'pbits-backwards': checkPbitsBackwards, 'reversible-limit': checkReversibleLimit, 'spatial-fit': checkSpatialFit,
  'qubit-one': checkQubitOne, 'qubit-back': checkQubitBack, 'qubit-bell': checkQubitBell, 'qubit-odd': checkQubitOdd
};
/* the quantum-search checks are in grover.js (ids search-*) */
export const checkOf = (id, state, ...rest) => (CHECKS[id] ? !!CHECKS[id](state, ...rest) : false);
