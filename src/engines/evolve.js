/* Evolve a circuit (the evolve engine): let blind search find a small logic circuit for a job, instead of designing it.
   Pure logic, no DOM, no English (ids only; the words are evolve.* in src/i18n/en/).
   Ported from the earlier site (/src/engines/evolve.js, kept on claude/before-retire-2026-11) with the same search
   and the same tests; added here: JOBS, GATE_SETS, ROOM, CHALLENGES and a seeded start(job, options) with
   step(state, n) for a player. Built on the tiny-chip engine (tinychip.js): jobs are its projects, and an evolved
   circuit is written as tiny-chip code, so it can be verified, synthesized and counted in cells there.

   The method is Cartesian Genetic Programming (Miller and Thomson, 2000), a standard way to evolve circuits. A genome
   is a row of gates; each gate has a type and two inputs, which can be the chip's inputs or any earlier gate; each
   output points at one gate. Gates nothing points to are carried along but unused, which lets the search drift
   through neutral changes. Each generation makes a few mutated copies of the best genome and keeps a copy if it is at
   least as good (a "1 + 4" strategy). Every signal is evaluated for all input patterns at once, one bit per pattern.
   Fitness: first the number of correct output bits, then fewer gates.

   The player: s = start('vote', { seed, gates: 'all', room: 30 }); r = step(s, 500) gives the generation, the best
   circuit as tiny-chip code, the correct answers out of the total, the gates used and a check for each challenge
   ('beat': a majority voter with fewer cells than the person's; 'nand': a half adder from NAND gates alone, counted). */
import TC from './tinychip.js';

export const GATES = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'NOT'];
const MAXIN = 5;                                   /* 2^5 = 32 patterns fit in one 32-bit word */

/* Seeded random numbers, so a run can be repeated exactly. */
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* The task: inputs, outputs and the wanted truth table, from a studio project with a specification. */
export function target(proj) {
  if (!proj.f || proj.seq || proj.ins.length > MAXIN) return null;
  const V = TC.vectors(proj.ins), n = V.length, mask = n >= 32 ? 0xffffffff : (1 << n) - 1;
  const inBits = proj.ins.map(k => V.reduce((m, v, i) => m | (v[k] << i), 0) >>> 0);
  const want = proj.outs.map(o => V.reduce((m, v, i) => m | (proj.f(v)[o] << i), 0) >>> 0);
  return { proj, ins: proj.ins, outs: proj.outs, n, mask: mask >>> 0, inBits, want, bits: n * proj.outs.length };
}

export function randomGenome(T, { nodes = 24, gates = GATES } = {}, r) {
  const I = T.ins.length, g = [];
  for (let k = 0; k < nodes; k++) g.push({ t: gates[Math.floor(r() * gates.length)], a: Math.floor(r() * (I + k)), b: Math.floor(r() * (I + k)) });
  return { nodes: g, outs: T.outs.map(() => Math.floor(r() * (I + nodes))) };
}

/* Which gates the outputs actually use. */
export function active(T, G) {
  const I = T.ins.length, on = new Uint8Array(G.nodes.length), stack = G.outs.filter(x => x >= I).map(x => x - I);
  while (stack.length) { const k = stack.pop(); if (on[k]) continue; on[k] = 1; const nd = G.nodes[k]; for (const x of nd.t === 'NOT' ? [nd.a] : [nd.a, nd.b]) if (x >= I) stack.push(x - I); }
  return on;
}

/* Evaluate every signal on every pattern at once. */
export function run(T, G) {
  const I = T.ins.length, v = new Uint32Array(I + G.nodes.length), m = T.mask;
  for (let i = 0; i < I; i++) v[i] = T.inBits[i];
  G.nodes.forEach((nd, k) => { const a = v[nd.a], b = v[nd.b]; let x;
    switch (nd.t) { case 'AND': x = a & b; break; case 'OR': x = a | b; break; case 'XOR': x = a ^ b; break; case 'NAND': x = ~(a & b); break; case 'NOR': x = ~(a | b); break; default: x = ~a; }
    v[I + k] = (x & m) >>> 0; });
  return G.outs.map(o => v[o]);
}
const pop = x => { x = x - ((x >>> 1) & 0x55555555); x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };

export function fitness(T, G) {
  const got = run(T, G); let correct = 0;
  got.forEach((x, k) => { correct += pop((~(x ^ T.want[k])) & T.mask); });
  const size = active(T, G).reduce((s, x) => s + x, 0);
  return { correct, size, solved: correct === T.bits, score: correct * 1000 - size };
}

export function mutate(T, G, r, { rate = 0.06, gates = GATES } = {}) {
  const I = T.ins.length, N = G.nodes.length, c = { nodes: G.nodes.map(n => ({ ...n })), outs: G.outs.slice() };
  const genes = N * 3 + c.outs.length, k = Math.max(1, Math.round(genes * rate));
  for (let j = 0; j < k; j++) {
    const g = Math.floor(r() * genes);
    if (g >= N * 3) { c.outs[g - N * 3] = Math.floor(r() * (I + N)); continue; }
    const i = Math.floor(g / 3), f = g % 3;
    if (f === 0) c.nodes[i].t = gates[Math.floor(r() * gates.length)];
    else c.nodes[i][f === 1 ? 'a' : 'b'] = Math.floor(r() * (I + i));
  }
  return c;
}

/* An evolution you can step: evo.step(generations) advances it; evo.best and evo.history show progress. */
export function evolution(proj, { seed = 1, nodes = 24, gates = GATES, rate = 0.06, lambda = 4 } = {}) {
  const T = target(proj); if (!T) return null;
  const r = rng(seed);
  let best = randomGenome(T, { nodes, gates }, r), bf = fitness(T, best), gen = 0, solvedAt = null;
  const history = [[0, bf.correct, bf.size]];
  return {
    T, get best() { return best; }, get fit() { return bf; }, get gen() { return gen; }, get solvedAt() { return solvedAt; }, history,
    step(n = 1) {
      for (let s = 0; s < n; s++) {
        gen++; let cb = null, cf = null;
        for (let k = 0; k < lambda; k++) { const c = mutate(T, best, r, { rate, gates }), f = fitness(T, c); if (!cf || f.score >= cf.score) { cb = c; cf = f; } }
        if (cf.score >= bf.score) { best = cb; bf = cf; }
        if (bf.solved && solvedAt === null) solvedAt = gen;
        if (gen % 50 === 0 || (bf.solved && solvedAt === gen)) history.push([gen, bf.correct, bf.size]);
      }
      return bf;
    }
  };
}

/* The evolved circuit in the tiny-chip language, so the studio can verify, synthesize and export it.
   Only the gates the outputs use are written; they are numbered g1, g2, … in order. */
export function toCode(T, G) {
  const I = T.ins.length, on = active(T, G), name = {}, lines = [];
  T.ins.forEach((n, i) => { name[i] = n; });
  let k = 0;
  G.nodes.forEach((nd, i) => {
    if (!on[i]) return;
    const w = 'g' + (++k), a = name[nd.a], b = name[nd.b];
    const e = { AND: a + ' & ' + b, OR: a + ' | ' + b, XOR: a + ' ^ ' + b, NAND: '~(' + a + ' & ' + b + ')', NOR: '~(' + a + ' | ' + b + ')', NOT: '~' + a }[nd.t];
    lines.push(w + ' = ' + e + ';'); name[I + i] = w;
  });
  T.outs.forEach((o, j) => lines.push(o + ' = ' + name[G.outs[j]] + ';'));
  /* An output wired straight to an input or to another output would leave a wire unused; that is valid. */
  return '// Evolved, not designed: ' + k + ' gates found by evolution.\n' + lines.join('\n');
}

/* The same yardsticks for any design: cells, transistors and gates on the longest path, after synthesis. */
export function measure(proj, code) {
  const D = TC.parse(code, proj.ins, proj.outs);
  if (D.errs.length) return null;
  const st = TC.synth(D, proj.ins, proj.outs, 'basic', false, '130').st;
  return { cells: st.cells, tr: st.tr, depth: st.depth, lines: D.order.length, correct: !TC.verify(D, proj).bad };
}

/* ---- for a player ---- */

/* The jobs offered: ids, inputs, outputs, the truth function, and the person's design in cells (after synthesis). */
export const JOB_IDS = ['half', 'vote', 'full', 'add2', 'seg'];
export const JOBS = JOB_IDS.map(id => {
  const p = TC.PROJ.find(x => x.id === id), m = measure(p, p.sol);
  return { id, ins: p.ins, outs: p.outs, f: p.f, human: m.cells, humanCode: p.sol, proj: p };
});
export const jobOf = id => JOBS.find(j => j.id === id) || null;

/* The gate sets: which kinds of gate evolution may use. */
export const GATE_SETS = { all: GATES, nand: ['NAND'], noxor: ['AND', 'OR', 'NAND', 'NOR', 'NOT'] };

/* Room for gates: how many gates the genome carries (more room, easier to find, slower to shrink). */
export const ROOM = { min: 8, max: 60, default: 30 };

/* The challenges. Each names the job and gate set it is about and what counts as met; check(result) is given what
   step() reports. 'beat' needs fewer cells than the person's voter; 'nand' needs a working half adder from NAND
   gates only, and reports how many it needed. */
export const CHALLENGES = {
  beat: { job: 'vote', gates: 'all', check: r => r.solved && r.cells !== null && r.cells < jobOf('vote').human },
  nand: { job: 'half', gates: 'nand', check: r => r.solved && r.gates > 0 }
};


/* Begin a seeded evolution. job: an id of JOBS (or a job); options: seed, gates (a key of GATE_SETS), room. */
export function start(job, { seed = 1, gates = 'all', room = ROOM.default } = {}) {
  const J = typeof job === 'string' ? jobOf(job) : job;
  if (!J) return null;
  const kit = GATE_SETS[gates] || GATE_SETS.all, nodes = Math.max(ROOM.min, Math.min(ROOM.max, room | 0));
  const E = evolution(J.proj, { seed, nodes, gates: kit });
  return { job: J.id, gates: GATE_SETS[gates] ? gates : 'all', room: nodes, seed, E, cache: null };
}

/* Advance n generations (n = 0 just reads). Reports what a player shows. cells: the synthesized size, once solved. */
export function step(state, n = 1) {
  const E = state.E; if (n > 0) E.step(n);
  const J = jobOf(state.job), f = E.fit, code = toCode(E.T, E.best);
  let cells = null;
  if (f.solved) {
    if (!state.cache || state.cache.code !== code) state.cache = { code, cells: measure(J.proj, code)?.cells ?? null };
    cells = state.cache.cells;
  }
  const r = { gen: E.gen, code, correct: f.correct, total: E.T.bits, gates: f.size, solved: f.solved, solvedAt: E.solvedAt, cells, human: J.human, challenges: {} };
  for (const [id, c] of Object.entries(CHALLENGES)) r.challenges[id] = c.job === state.job && c.gates === state.gates && c.check(r);
  return r;
}
