/* One spec, two matters: the same small logic run as silicon gates and as DNA strands in a test tube (#412), played by
   src/v2/labs/bridge.js. Pure logic, no DOM, no words: the lab names what this returns (src/i18n/en/labs.json, br.*).

   A model with honest trends, not a chemistry simulator. What it keeps of the seesaw gates of Qian and Winfree (2011,
   facts.json dna-seesaw): a gate's input strand pushes its output strand off the gate (strand displacement); a
   threshold strand soaks up the first part of the input, so only what is above it passes; fuel strands free the input
   again, so one input releases many outputs (the amplifier that restores a weak signal to a full one); and fuel also
   frees outputs with no input at all, slowly (the leak). Concentrations are in units of the amount one input is given
   (1 = one unit), rise over minutes, and are read once, at READ_AT, against a reporter's two lines (HIGH and LOW).
   A gate in the tube has no NOT: the choice gets its selector as two strands, one for 1 and one for 0 (two rails),
   and is built of two ANDs and an OR, as the seesaw circuits did.

   Silicon is the bench's own model: the tiny-chip engine's cell library (src/engines/tinychip.js LIB, delays in ps at
   130 nm), exact on every input; its delay is the longest path through its cells.

   The classifier is a winner-take-all network after Cherry and Qian (2018, facts.json dna-wta): each memory sums the
   pixels of the pattern it remembers (its weights), an annihilator removes the two sums of a pair together, unit for
   unit, so the smaller one is wiped out, and a restoring gate (a threshold and fuel, as above) lifts what is left of
   the winner to a full signal. Theirs read 10 x 10 patterns into nine memories; this one reads 5 x 5 into three. */
import TC from './tinychip.js';

/* ---- the tube's clock and its constants (the model's own choices, chosen for honest trends) ---- */
export const READ_AT = 120;          // minutes: when the tube is read
export const DT = 0.25;              // minutes: the model's step
export const SAMPLE = 2;             // minutes between the points of a drawn curve
export const HIGH = 0.65;            // the reporter's lines: above HIGH the answer is a 1, below LOW a 0, and between
export const LOW = 0.35;             // them the light is too dim to call (blurred)
export const DEADLINE = 45;          // minutes: the goal's time, by when every 1 must be over HIGH
const readOf = y => (y > HIGH ? 1 : y < LOW ? 0 : null);
export const SPREAD = 0.1;           // each strand is pipetted within a tenth of its amount
const K0 = 0.03;                     // per minute, per unit passing: how fast a passing input releases output
const K_SPEED = 3;                   // fuel speeds the release: by 1 + K_SPEED x fuel
const K_CAT = 10;                    // fuel recycles the input: one passing unit can release up to 1 + K_CAT x fuel
export const LEAK0 = 0.0005;         // per minute: a gate's own leak, with no fuel
export const LEAK_FUEL = 0.003;      // per minute, per unit of fuel: the leak fuel brings
/* the dials: a gate's threshold and its fuel, in units */
export const THRESHOLDS = Array.from({ length: 21 }, (_, i) => +(i * 0.1).toFixed(1));
export const FUELS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/* one step of a seesaw gate's output y (0..1), with `pass` input above its threshold and `fuel` beside it */
export function gateStep(y, pass, fuel, dt = DT) {
  const target = Math.min(1, pass * (1 + K_CAT * fuel));
  const grow = pass > 0 && y < target ? K0 * pass * (1 + K_SPEED * fuel) * (target - y) : 0;
  const leak = (LEAK0 + LEAK_FUEL * fuel) * (1 - y);
  return Math.min(1, y + (grow + leak) * dt);
}
export const leakAt = (fuel, t = READ_AT) => 1 - Math.exp(-(LEAK0 + LEAK_FUEL * fuel) * t);

/* ---- the specs: one truth table each, written once and run in both matters ---- */
export const SPECS = {
  and: { ins: ['a', 'b'], f: v => v.a & v.b, gates: ['and'] },
  choice: { ins: ['s', 'a', 'b'], f: v => (v.s ? v.a : v.b), gates: ['and', 'or'] }
};
export const SPEC_IDS = Object.keys(SPECS);
/* every input of a spec, in the order of a truth table */
export function rowsOf(spec) {
  const I = SPECS[spec].ins, n = I.length;
  return Array.from({ length: 1 << n }, (_, k) => { const v = {}; I.forEach((x, i) => { v[x] = (k >> (n - 1 - i)) & 1; }); return { v, want: SPECS[spec].f(v) }; });
}

/* ---- silicon: the same spec as the bench's cells (tinychip LIB: [transistors, width, delay ps]) ---- */
export const SILICON = {
  and: [{ id: 'y', type: 'AND2', ins: ['a', 'b'] }],
  choice: [{ id: 'ns', type: 'INV', ins: ['s'] }, { id: 'p', type: 'AND2', ins: ['s', 'a'] }, { id: 'q', type: 'AND2', ins: ['ns', 'b'] }, { id: 'y', type: 'OR2', ins: ['p', 'q'] }]
};
const CELL = { INV: x => 1 - x[0], AND2: x => x[0] & x[1], OR2: x => x[0] | x[1] };
/* the silicon circuit on one input: every wire's value, and its output */
export function siliconRun(spec, v) {
  const w = Object.assign({}, v);
  for (const c of SILICON[spec]) w[c.id] = CELL[c.type](c.ins.map(n => w[n]));
  return { wires: w, out: w.y };
}
/* the longest path through the cells, in picoseconds, and the transistors it takes */
export function siliconDelay(spec) {
  const at = {};
  for (const c of SILICON[spec]) at[c.id] = Math.max(0, ...c.ins.map(n => at[n] || 0)) + TC.LIB[c.type][2];
  return at.y;
}
export const siliconTransistors = spec => SILICON[spec].reduce((s, c) => s + TC.LIB[c.type][0], 0);
export const siliconRight = spec => rowsOf(spec).every(r => siliconRun(spec, r.v).out === r.want);

/* ---- the tube ---- */
/* the strands put in for one input: worst case for what the row should give (a row that should read 1 gets every
   strand a tenth short, one that should read 0 a tenth over). The choice's selector comes as two rails, s1 and s0 */
function strandsOf(spec, v, want) {
  const k = want ? 1 - SPREAD : 1 + SPREAD, x = b => (b ? k : 0);
  return spec === 'and' ? { a: x(v.a), b: x(v.b) } : { a: x(v.a), b: x(v.b), s1: x(v.s), s0: x(1 - v.s) };
}
/* the gates in the tube: which strands each adds up, and whose dials it wears */
export const TUBE = {
  and: [{ id: 'y', kind: 'and', ins: ['a', 'b'] }],
  choice: [{ id: 'p', kind: 'and', ins: ['s1', 'a'] }, { id: 'q', kind: 'and', ins: ['s0', 'b'] }, { id: 'y', kind: 'or', ins: ['p', 'q'] }]
};
const dial = (set, kind) => Object.assign({ th: 0, fuel: 0 }, set && set[kind]);
/* one input run in the tube to READ_AT: every gate's output over time (sampled every SAMPLE minutes), the output read,
   and when it first crossed the line (null if never) */
export function tubeRun(spec, set, v, want) {
  const s = strandsOf(spec, v, want), G = TUBE[spec], y = Object.fromEntries(G.map(g => [g.id, 0])), trace = Object.fromEntries(G.map(g => [g.id, [0]]));
  const every = Math.round(SAMPLE / DT), steps = Math.round(READ_AT / DT);
  let cross = null;
  for (let i = 1; i <= steps; i++) {
    const was = Object.assign({}, y);
    for (const g of G) { const d = dial(set, g.kind), sum = g.ins.reduce((a, n) => a + (n in s ? s[n] : was[n]), 0); y[g.id] = gateStep(was[g.id], Math.max(0, sum - d.th), d.fuel); }
    if (cross == null && y.y > HIGH) cross = i * DT;
    if (i % every === 0) for (const g of G) trace[g.id].push(y[g.id]);
  }
  return { out: y.y, got: readOf(y.y), cross, trace, gates: Object.assign({}, y) };
}
/* every input of a spec in the tube: what each gives against what it should, how many are right, and the tube's answer
   time (the slowest input that should read 1 to cross the line) */
export function tubeCheck(spec, set) {
  const rows = rowsOf(spec).map(r => { const run = tubeRun(spec, set, r.v, r.want); return Object.assign({}, r, run, { ok: run.got === r.want }); });
  const ones = rows.filter(r => r.want), right = rows.filter(r => r.ok).length;
  const slow = ones.every(r => r.cross != null) ? Math.max(...ones.map(r => r.cross)) : null;
  /* what went wrong, worst first: a 0 that leaked over the line, a 0 or a 1 too dim to call, a 1 that never reached
     its line, every input right but too slow */
  const why = rows.some(r => !r.want && r.got === 1) ? 'leak' : rows.some(r => r.got == null) ? 'blur' : rows.some(r => r.want && !r.ok) ? 'weak' : slow > DEADLINE ? 'slow' : null;
  return { rows, right, total: rows.length, ok: right === rows.length, time: slow, fast: slow != null && slow <= DEADLINE, why };
}
/* the first goal: the AND, then the choice, right on every input in the tube (silicon is right by construction) */
export function checkBridge(set) {
  const and = tubeCheck('and', set), choice = tubeCheck('choice', set);
  return { and, choice, ok: and.ok && and.fast && choice.ok && choice.fast && siliconRight('and') && siliconRight('choice') };
}
export const START = { and: { th: 0.5, fuel: 0 }, or: { th: 0.5, fuel: 0 } };

/* ---- the classifier: winner takes all ---- */
export const GRID = 5;
const px = list => list.map(([r, c]) => r * GRID + c);
const line = (f, n = GRID) => Array.from({ length: n }, (_, i) => f(i));
/* the three memories, nine pixels each; each pixel they share with a pattern adds WEIGHT to their sum (a perfect copy
   sums to two units) */
export const MEMORIES = [
  { id: 'plus', px: px([...line(i => [2, i]), ...line(i => [i, 2]).filter(([r]) => r !== 2)]) },
  { id: 'cross', px: px([...line(i => [i, i]), ...line(i => [i, 4 - i]).filter(([r]) => r !== 2)]) },
  { id: 'square', px: px([1, 2, 3].flatMap(r => [1, 2, 3].map(c => [r, c]))) }
];
export const WEIGHT = 2 / 9;
const flip = (base, on, off) => { const s = new Set(base); off.forEach(p => s.delete(p)); on.forEach(p => s.add(p)); return [...s].sort((a, b) => a - b); };
const M = id => MEMORIES.find(m => m.id === id).px;
/* the patterns to classify: each memory's shape with pixels flipped (some lost, some added), as handwriting differs */
export const PATTERNS = [
  { id: 'p1', is: 'plus', px: flip(M('plus'), [0], [10]) },
  { id: 'p2', is: 'plus', px: flip(M('plus'), [6], [10, 14]) },
  { id: 'x1', is: 'cross', px: flip(M('cross'), [7], [24]) },
  { id: 'x2', is: 'cross', px: flip(M('cross'), [1, 21], [0, 20]) },
  { id: 's1', is: 'square', px: flip(M('square'), [23], [18]) },
  { id: 's2', is: 'square', px: flip(M('square'), [9, 15], [7, 12, 17]) }
];
export const ANNIHILATORS = Array.from({ length: 16 }, (_, i) => +(i * 0.1).toFixed(1));
export const RESTORE_TH = Array.from({ length: 13 }, (_, i) => +(i * 0.05).toFixed(2));
const KA = 2, SUB = 4;  // per minute, per unit squared: how fast an annihilator meets a pair; its small steps per step
/* each memory's weighted sum for a pattern: the pixels they share, each worth WEIGHT */
export const sumsOf = p => MEMORIES.map(m => m.px.filter(i => p.px.includes(i)).length * WEIGHT);
/* one pattern run in the tube: the sums falling as the annihilators remove pairs, each memory's output over time, and
   the answer read (the one memory over the line, or none, or more than one) */
export function wtaRun(p, set) {
  const o = Object.assign({ ann: 0, th: 0, fuel: 0 }, set), n = MEMORIES.length, S = sumsOf(p), Y = S.map(() => 0);
  const pairs = []; for (let j = 0; j < n; j++) for (let k = j + 1; k < n; k++) pairs.push({ j, k, a: o.ann });
  const every = Math.round(SAMPLE / DT), steps = Math.round(READ_AT / DT), trace = Y.map(() => [0]), sums = S.map(v => [v]);
  for (let i = 1; i <= steps; i++) {
    /* the annihilators are fast, so they take small steps of their own, each scaled so nothing goes below zero */
    for (let m = 0; m < SUB; m++) {
      const r = pairs.map(q => Math.min(q.a, KA * q.a * S[q.j] * S[q.k] * DT / SUB)), D = S.map(() => 0);
      pairs.forEach((q, i) => { D[q.j] += r[i]; D[q.k] += r[i]; });
      const f = Math.min(1, ...S.map((v, k) => (D[k] > v ? v / D[k] : 1)));
      pairs.forEach((q, i) => { q.a -= r[i] * f; });
      for (let k = 0; k < n; k++) S[k] = Math.max(0, S[k] - D[k] * f);
    }
    for (let k = 0; k < n; k++) Y[k] = gateStep(Y[k], Math.max(0, S[k] - o.th), o.fuel);
    if (i % every === 0) for (let k = 0; k < n; k++) { trace[k].push(Y[k]); sums[k].push(S[k]); }
  }
  const R = Y.map(readOf), on = R.map((r, k) => (r === 1 ? k : -1)).filter(k => k >= 0);
  const got = R.some(r => r == null) ? 'blur' : on.length === 1 ? MEMORIES[on[0]].id : on.length ? 'many' : 'none';
  return { sums: sumsOf(p), out: Y, got, ok: got === p.is, trace, left: sums };
}
/* the second goal: every pattern read as the memory it is */
export function checkWta(set) {
  const rows = PATTERNS.map(p => Object.assign({ p }, wtaRun(p, set)));
  const right = rows.filter(r => r.ok).length;
  return { rows, right, total: rows.length, ok: right === rows.length };
}
export const WTA_START = { ann: 0, th: 0.2, fuel: 0.5 };
