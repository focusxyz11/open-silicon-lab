/* New ways to compute, as engines: small, honest models of each paradigm, and the checks of their challenges.
   Ported unchanged from the first version of the site (src/engines/paradigms.js there; the labs that used it were
   topics/{beyond,cim,neuro,photonic,pbits,reversible,spatial,quantum}/labs). Pure logic, no DOM, no words: the
   labs that play them show their own (src/i18n/en/labs.json). Quantum search is its own engine, grover.js.

   Each model keeps only the idea that makes its paradigm different, and what is left out is said by the pages:
   energy of math against moving data (45 nm, Table I of arXiv:1602.04183), a compute-in-memory crossbar (noise
   and converters), a spiking neuron, a Mach-Zehnder mesh, two qubits, p-bits (an AND gate run backwards),
   reversible logic (Landauer limit, adiabatic ramp, Toffoli) and dataflow (weights kept on chip).

   CHECKS: one pure function per challenge id (the labs show the challenges' words, game.ch.* and their own). Each takes the state a
   player has reached and says whether the goal is met; the lab's own thresholds are kept. checkOf(id, state). */

/* New ways to compute: small, honest models of each paradigm. Pure logic, no DOM.
   Each one keeps only the idea that makes the paradigm different; the labs say what is left out. */

/* ---------- seeded randomness ---------- */
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }

/* ---------- energy of computing vs moving data (45 nm, 16-bit; Table I of arXiv:1602.04183) ---------- */
export const E16 = { add: 0.18, mul: 0.62, rf: 0.12, sram4k: 8, sram32k: 11, dram: 640 };
/* One multiply-accumulate whose two operands come from `where`, each fetched number reused `reuse` times. */
function macEnergy(where, reuse) {
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
function mziMatrix(theta, phi) { return mm(BS, mm([[ex(theta), cx(0)], [cx(0), cx(1)]], mm(BS, [[ex(phi), cx(0)], [cx(0), cx(1)]]))); }
export function mzi(inputs, theta, phi, { phaseNoise = 0, seed = 1 } = {}) {
  const r = rng(seed); const t = theta + phaseNoise * gauss(r), p = phi + phaseNoise * gauss(r);
  const U = mziMatrix(t, p), a = inputs.map(v => cx(v));
  const out = U.map(row => row.reduce((s, u, k) => cadd(s, cmul(u, a[k])), cx(0)));
  return { amp: out, power: out.map(o => o.re * o.re + o.im * o.im) };
}

/* ---------- quantum: two qubits, state vector ---------- */
/* Basis order |q0 q1>: index = q0 * 2 + q1. */
function qinit() { return [cx(1), cx(0), cx(0), cx(0)]; }
const G1 = { H: [[cx(Math.SQRT1_2), cx(Math.SQRT1_2)], [cx(Math.SQRT1_2), cx(-Math.SQRT1_2)]], X: [[cx(0), cx(1)], [cx(1), cx(0)]], Z: [[cx(1), cx(0)], [cx(0), cx(-1)]], S: [[cx(1), cx(0)], [cx(0), cx(0, 1)]] };
function qapply(state, gate, q) {
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
function qrun(circuit) { let s = qinit(); for (const col of circuit) { if (col[0] === 'CX' || col[0] === 'XC') s = qapply(s, col[0]); else { if (col[0]) s = qapply(s, col[0], 0); if (col[1]) s = qapply(s, col[1], 1); } } return s; }
const qprobs = s => s.map(a => a.re * a.re + a.im * a.im);
function qsample(s, shots, seed = 7) { const r = rng(seed), p = qprobs(s), c = [0, 0, 0, 0]; for (let k = 0; k < shots; k++) { let u = r(), i = 0; while (i < 3 && u > p[i]) { u -= p[i]; i++; } c[i]++; } return c; }

/* ---------- probabilistic bits: an invertible AND gate ---------- */
/* Bipolar p-bits A, B, C (−1 or +1). These weights make the three states with C = A AND B the lowest-energy ones. */
const AND_J = [[0, -1, 2], [-1, 0, 2], [2, 2, 0]];
const AND_H = [1, 1, -2];
function pEnergy(m, J = AND_J, h = AND_H) { let e = 0; for (let i = 0; i < m.length; i++) { e -= h[i] * m[i]; for (let j = i + 1; j < m.length; j++) e -= J[i][j] * m[i] * m[j]; } return e; }
/* Gibbs-style updates: each free p-bit flips at random, biased by its neighbors; beta is how strongly. */
function pSample({ beta = 1, clamp = {}, sweeps = 2000, seed = 11, J = AND_J, h = AND_H } = {}) {
  const r = rng(seed), n = h.length; const m = Array.from({ length: n }, (_, i) => clamp[i] !== undefined ? clamp[i] : (r() < 0.5 ? -1 : 1));
  const counts = {};
  for (let s = 0; s < sweeps; s++) {
    for (let i = 0; i < n; i++) { if (clamp[i] !== undefined) continue; let I = h[i]; for (let j = 0; j < n; j++) I += J[i][j] * m[j]; m[i] = Math.tanh(beta * I) > r() * 2 - 1 ? 1 : -1; }
    const key = m.map(v => (v > 0 ? 1 : 0)).join(''); counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/* ---------- p-bits, a multiplier run backwards: let the noise factor a number ---------- */
/* The lab 'Let the noise compute' (src/v2/labs/pbits.js). Two numbers p and q, each written in `bits` p-bits, and the
   product clamped to N: the network's energy is how far p × q misses N, on a log scale (log2(1 + |N - p q|)), so every
   miss of the same size costs the same whatever the number. Each p-bit flips at random, leaning toward the value that
   lowers the energy, by beta (the cold: 0 is a fair coin, large follows its neighbours strictly). The p-bits are read by
   the state they visited most during the wait; a read is right when that state is a pair whose product is N. Borders et
   al. (Nature 573, 2019) factored numbers this way with magnetic p-bits; there too the inputs were worked out from the
   miss by a conventional circuit beside them. The exact digital search tries every pair, counting every case, so it
   is sure of every answer. Energies in pJ: one try is a multiply, a compare and two register reads (Table I above),
   one p-bit update (its input worked out, then a random flip) is taken as 0.1 pJ, an illustrative figure. */
export const FACTOR = { small: { N: 15, bits: 3 }, large: { N: 143, bits: 4 } };
export const E_TRY = E16.mul + E16.add + 2 * E16.rf, E_UPDATE = 0.1;
export const BETAS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
export const WAITS = [10, 15, 20, 30, 40, 60, 80, 120, 160, 240, 320, 480];
export const PBIT_RUNS = 200, PBIT_SEED = 7, PBIT_RIGHT = 0.9;
/* a state is one number: its low `bits` bits are p, the next `bits` bits are q */
export const pqOf = (s, bits) => [s & ((1 << bits) - 1), s >> bits];
const ENERGIES = {};
function factorEnergies(N, bits) {
  const k = N + ':' + bits; if (ENERGIES[k]) return ENERGIES[k];
  const S = 1 << (2 * bits), E = new Float64Array(S);
  for (let s = 0; s < S; s++) { const [p, q] = pqOf(s, bits); E[s] = Math.log2(1 + Math.abs(N - p * q)); }
  return (ENERGIES[k] = E);
}
const factorAnswers = (N, bits) => { const out = []; for (let s = 0; s < 1 << (2 * bits); s++) { const [p, q] = pqOf(s, bits); if (p * q === N) out.push(s); } return out; };
/* one network of p-bits, walked a sweep at a time (every p-bit updated once per sweep, in order); counts: the sweeps
   spent in each state so far. walk(n) returns the states it passed, one per sweep */
export function factorWalker({ N, bits, beta, seed = 1 }) {
  const E = factorEnergies(N, bits), n = 2 * bits, S = 1 << n, r = rng(seed), counts = new Uint32Array(S);
  let s = Math.floor(r() * S), sweeps = 0;
  function sweep() {
    for (let i = 0; i < n; i++) { const a = s & ~(1 << i), b = s | (1 << i); s = r() < 1 / (1 + Math.exp(-beta * (E[a] - E[b]))) ? b : a; }
    counts[s]++; sweeps++; return s;
  }
  return { counts, get state() { return s; }, get sweeps() { return sweeps; }, walk(k) { const path = []; for (let j = 0; j < k; j++) path.push(sweep()); return path; },
    read() { let m = 0; for (let x = 1; x < S; x++) if (counts[x] > counts[m]) m = x; return m; } };
}
/* many reads, each a fresh network from its own random start: the share that are right, how often each state was read,
   and the energy of one read against the exact search's */
export function factorStats({ N, bits, beta, wait, runs = PBIT_RUNS, seed = PBIT_SEED }) {
  const n = 2 * bits, reads = new Uint32Array(1 << n), r = rng(seed);
  let right = 0;
  for (let k = 0; k < runs; k++) {
    const w = factorWalker({ N, bits, beta, seed: Math.floor(r() * 4294967296) || 1 }); w.walk(wait);
    const s = w.read(), [p, q] = pqOf(s, bits); reads[s]++; if (p * q === N) right++;
  }
  return { right: right / runs, reads, energy: n * wait * E_UPDATE, exact: exactSearch(N, bits).energy };
}
/* the exact search: every pair tried in order, so all the answers are known for sure */
export const exactSearch = (N, bits) => { const tries = 1 << (2 * bits); return { tries, energy: tries * E_TRY, answers: factorAnswers(N, bits) }; };
/* the goal of each problem: right at least 90% of the time, with the least wait that does it at this cold (one step
   shorter is not right often enough), and for less energy than the exact search (the large one: a third of it) */
export const FACTOR_SHARE = { small: 1, large: 1 / 3 };
export function factorGoal(size, { beta, wait }) {
  const P = FACTOR[size], st = factorStats({ N: P.N, bits: P.bits, beta, wait }), i = WAITS.indexOf(wait);
  const shorter = i > 0 ? factorStats({ N: P.N, bits: P.bits, beta, wait: WAITS[i - 1] }).right : null;
  const right = st.right >= PBIT_RIGHT, least = right && (shorter == null || shorter < PBIT_RIGHT), cheap = st.energy <= st.exact * FACTOR_SHARE[size] + 1e-9;
  return { st, shorter, right, least, cheap, met: right && least && cheap };
}
const checkNoise = state => factorGoal('small', state || {}).met;
const checkNoiseBig = state => factorGoal('large', state || {}).met;

/* ---------- reversible computing ---------- */
export const K_B = 1.380649e-23;
export const landauer = (tempK = 300) => K_B * tempK * Math.LN2;
/* Energy lost each time a wire of capacitance C switches abruptly to V, and when ramped slowly over time T through resistance R. */
export const switchLoss = (C, V) => 0.5 * C * V * V;
const adiabaticLoss = (C, V, R, T) => Math.min(0.5 * C * V * V, (R * C / T) * C * V * V);
export const toffoli = (a, b, c) => [a, b, c ^ (a & b)];

/* ---------- dataflow / spatial: keep the weights where the work happens ---------- */
/* Energy per inference in microjoules for a model with `layers` layers of `mbPerLayer` MB of 8-bit weights.
   Von Neumann fetches every weight from DRAM; spatial keeps what fits in on-chip SRAM across tiles
   and fetches only the rest. Uses the 45 nm per-bit costs above. */
function dataflowEnergy({ layers, mbPerLayer, tiles, mbPerTile, mode }) {
  const bits = layers * mbPerLayer * 8e6;
  const dramBit = E16.dram / 16, sramBit = E16.sram32k / 16;
  const fit = mode === 'spatial' ? Math.min(1, (tiles * mbPerTile) / (layers * mbPerLayer)) : 0;
  const pj = bits * (fit * sramBit + (1 - fit) * dramBit);
  return { uj: pj / 1e6, fit };
}

/* ---------- reversible logic: an adder of Toffoli gates (the lab 'Compute without erasing', src/v2/labs/reversible.js) ----------
   Wires carry bits from left to right; a gate is { t, c }: its target wire t is flipped when every control wire in c
   (none, one or two) is 1. That is a Toffoli gate, with a missing control held at 1 (one control: the CNOT; none: NOT).
   Every such gate is its own inverse, so a circuit of them erases nothing: run backwards, it gives its inputs back.
   The adder: four wires, a, b, the carry in, and a spare wire that starts at 0; it adds when, for all eight inputs,
   one wire ends with the sum (a xor b xor carry in) and another with the carry out (at least two of the three). */
export const REV_WIRES = 4;
export const gateOk = g => !!g && Number.isInteger(g.t) && g.t >= 0 && g.t < REV_WIRES && Array.isArray(g.c) && g.c.length <= 2 &&
  new Set(g.c).size === g.c.length && g.c.every(i => Number.isInteger(i) && i >= 0 && i < REV_WIRES && i !== g.t);
export function revStep(bits, g) {
  if (!gateOk(g)) return bits.slice();
  const out = bits.slice(), x = g.c.length > 0 ? bits[g.c[0]] : 1, y = g.c.length > 1 ? bits[g.c[1]] : 1;
  out[g.t] = toffoli(x, y, bits[g.t])[2]; return out;
}
export const revRun = (gates, bits) => (gates || []).reduce(revStep, bits.slice());
/* the eight inputs (a, b, carry in, spare 0), what each should give, and what the circuit gives; the pair of distinct
   wires (sum, carry) right on the most rows, and how many rows that is */
export function revAdder(gates) {
  const rows = Array.from({ length: 8 }, (_, k) => { const a = k >> 2 & 1, b = k >> 1 & 1, c = k & 1, inp = [a, b, c, 0];
    return { in: inp, sum: a ^ b ^ c, carry: (a & b) | (a & c) | (b & c), out: revRun(gates, inp) }; });
  /* the usual places first (the sum on the carry in's wire, the carry on the spare), so a tie keeps them */
  const rightOn = (s, k) => rows.filter(r => r.out[s] === r.sum && r.out[k] === r.carry).length;
  let best = { s: 2, k: 3, right: rightOn(2, 3) };
  for (let s = 0; s < REV_WIRES; s++) for (let k = 0; k < REV_WIRES; k++) if (s !== k) {
    const right = rightOn(s, k);
    if (right > best.right) best = { s, k, right };
  }
  return { rows, sumWire: best.s, carryWire: best.k, right: best.right, ok: best.right === 8 };
}
/* the times a step may take, one ramp of a wire (seconds); about half a decade apart */
export const RAMPS = [1e-12, 3e-12, 1e-11, 3e-11, 1e-10, 3e-10, 1e-9, 3e-9, 1e-8, 3e-8, 1e-7, 3e-7, 1e-6, 3e-6];
export const REV_V = 0.7;
/* an ordinary full adder takes three bits and gives two: at least one bit is erased each time it adds */
const ADDER_ERASES = 1;
/* the energy of one addition of `steps` gates, each one wire of the lab's (WIRE) charged in time T: switched at once,
   ramped slowly, and the floor under an ordinary adder (kT ln 2 for each bit it erases), in joules; and its time */
export function revEnergy(steps, T, { V = REV_V, tempK = 300 } = {}) {
  const abrupt = steps * switchLoss(WIRE.C, V), slow = steps * adiabaticLoss(WIRE.C, V, WIRE.R, T);
  return { abrupt, slow, floor: ADDER_ERASES * landauer(tempK), saved: abrupt / slow, time: steps * T };
}
/* the lab's goal: the gates add, each step slow enough to lose 100 times less than switching at once (the engine's
   own check, checkReversibleLimit), and no faster ramp would do it: the least time that pays */
export function checkReversibleAdder({ gates = [], ramp = 0 } = {}) {
  const lim = i => i >= 0 && i < RAMPS.length && checkReversibleLimit({ log10Time: Math.log10(RAMPS[i]), V: REV_V });
  return revAdder(gates).ok && lim(ramp) && !lim(ramp - 1);
}

/* ---------- dataflow: a model's layers laid across a chip's tiles (the lab 'Keep the numbers on the chip',
   src/v2/labs/dataflow.js) ----------
   The parts of dataflowEnergy below: the energy of the weights read from the tiles' own memory, and of those fetched
   from memory off the chip, against fetching every weight; the goal is the largest model the chip holds whole, the
   layer beyond it tried and seen not to fit (checkSpatialFit). */
export const FLOW = { mbPerLayer: 4, mbPerTile: 2 };
export function dataflowParts({ layers, tiles, mbPerLayer = FLOW.mbPerLayer, mbPerTile = FLOW.mbPerTile }) {
  const c = { layers, mbPerLayer, tiles, mbPerTile }, s = dataflowEnergy({ ...c, mode: 'spatial' }), v = dataflowEnergy({ ...c, mode: 'vn' });
  const on = layers * mbPerLayer * 8e6 * s.fit * (E16.sram32k / 16) / 1e6;
  return { fit: s.fit, uj: s.uj, on, off: s.uj - on, vn: v.uj, saves: v.uj / s.uj, offShare: (s.uj - on) / s.uj };
}
export function checkDataflowEdge({ layers, tiles, mbPerLayer = FLOW.mbPerLayer, mbPerTile = FLOW.mbPerTile, tried = [] } = {}) {
  const all = (tried || []).map(c => ({ mbPerLayer, mbPerTile, ...c })), fit = c => dataflowEnergy({ ...c, mode: 'spatial' }).fit;
  const more = all.find(c => c.layers === layers + 1 && c.tiles === tiles && c.mbPerLayer === mbPerLayer && c.mbPerTile === mbPerTile);
  return fit({ layers, tiles, mbPerLayer, mbPerTile }) >= 1 && !!more && fit(more) < 1 && checkSpatialFit(all);
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
function checkPhotonicSteer({ goal = 'bottom', theta: th = 0, phi = 0, top = 1, phaseNoise = 0, seed = 1 } = {}) {
  if (!(goal in PHOTONIC_TARGETS) || Math.abs(top - 1) > 1e-9) return false;
  const p = mzi([Math.sqrt(top), Math.sqrt(1 - top)], th, phi, { phaseNoise, seed }).power;
  return Math.abs(p[0] - PHOTONIC_TARGETS[goal]) < 0.03;
}
/* ---------- the labs of spikes and of light (src/v2/labs/spikes.js, light.js) ---------- */
/* A detector that fires only on its pattern (kind 'spikes', at the block): detector A of SNN_W, one neuron with four
   inputs, on each of the four patterns. Its work two ways: a clocked circuit works out every input on every tick
   (dense: inputs × ticks), a spiking one only when a spike arrives, plus one event for each spike it sends (events).
   Steps of work, not joules: what a step costs is the catch the lab lets you change (inventions.js spikesCost). */
export const SPIKE_PATTERNS = ['A', 'B', 'noise', 'quiet'];
export function spikeWork({ threshold = 1, leak = 0.2 } = {}) {
  return SPIKE_PATTERNS.map(p => { const r = lif(spikeTrains(p), [SNN_W[0]], { threshold, leak }); return { p, fired: r.counts[0], events: r.events, dense: r.dense, share: r.events / r.dense }; });
}
/* Multiply as it travels (kind 'light', at the chip's links): all the light in the top input, the share that leaves the
   top is the weight one interferometer multiplies by. Phase noise (its spread in degrees, LIGHT_NOISES) shifts both
   phases at random on every pass; a pass is exact when checkPhotonicSteer holds (within 3 points of the target). The
   goal: the weight on target, exact at least 90% of LIGHT_RUNS passes at this noise, and no longer at one step more:
   the noise where it stops being exact. */
export const LIGHT_NOISES = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7, 10];
export const LIGHT_RUNS = 200, LIGHT_EXACT = 0.9, LIGHT_SEED = 17;
export const rad = deg => deg * Math.PI / 180;
/* the seed of each pass: spread out, so consecutive passes are independent */
const passSeed = (seed, k) => (Math.imul(seed * 977 + k + 1, 2654435761) >>> 0) || 1;
/* the share of the top output on each of `runs` passes at a phase noise (radians) */
export function lightPasses({ theta = 0, noise = 0, runs = LIGHT_RUNS, seed = LIGHT_SEED } = {}) {
  return Array.from({ length: runs }, (_, k) => mzi([1, 0], theta, 0, { phaseNoise: noise, seed: passSeed(seed, k) }).power[0]);
}
/* the share of passes still exact (checkPhotonicSteer) at a phase noise (radians) */
export function lightExact({ goal = 'quarter', theta = 0, noise = 0, runs = LIGHT_RUNS, seed = LIGHT_SEED } = {}) {
  let ok = 0; for (let k = 0; k < runs; k++) if (checkPhotonicSteer({ goal, theta, phaseNoise: noise, seed: passSeed(seed, k) })) ok++;
  return ok / runs;
}
/* theta in radians; noise: an index of LIGHT_NOISES */
export function lightGoal({ goal = 'quarter', theta = 0, noise = 0 } = {}) {
  const i = Math.max(0, Math.min(LIGHT_NOISES.length - 1, noise | 0)), steer = checkPhotonicSteer({ goal, theta });
  const exact = lightExact({ goal, theta, noise: rad(LIGHT_NOISES[i]) }), more = i < LIGHT_NOISES.length - 1 ? lightExact({ goal, theta, noise: rad(LIGHT_NOISES[i + 1]) }) : null;
  const holds = exact >= LIGHT_EXACT, edge = more == null || more < LIGHT_EXACT;
  return { steer, exact, more, holds, edge, met: steer && holds && edge };
}
export const checkLightEdge = state => lightGoal(state || {}).met;

/* Run logic backwards: the output clamped to 1, the inputs free, steered enough: the network sits in 111 most of the time. */
function checkPbitsBackwards({ beta = 2, clamp = { 2: 1 }, sweeps = 2000, seed = 11 } = {}) {
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
const checkQubitOne = ({ circuit }) => qprobs(qrun(circuit))[3] > 0.999;
const checkQubitBack = ({ circuit }) => qprobs(qrun(circuit))[0] > 0.999 && has(circuit, 'H');
const checkQubitBell = ({ circuit }) => { const p = qprobs(qrun(circuit)); return Math.abs(p[0] - 0.5) < 0.01 && Math.abs(p[3] - 0.5) < 0.01; };
const checkQubitOdd = ({ circuit }) => { const p = qprobs(qrun(circuit)); return Math.abs(p[1] - 0.5) < 0.01 && Math.abs(p[2] - 0.5) < 0.01; };

export const CHECKS = {
  'jobs': checkJobs, 'cim-bits': checkCimBits, 'neuro-spot': checkNeuroSpot, 'photonic-steer': checkPhotonicSteer,
  'pbits-backwards': checkPbitsBackwards, 'reversible-limit': checkReversibleLimit, 'spatial-fit': checkSpatialFit,
  'qubit-one': checkQubitOne, 'qubit-back': checkQubitBack, 'qubit-bell': checkQubitBell, 'qubit-odd': checkQubitOdd
};
/* the quantum-search checks are in grover.js (ids search-*) */
export const checkOf = (id, state, ...rest) => (CHECKS[id] ? !!CHECKS[id](state, ...rest) : false);
