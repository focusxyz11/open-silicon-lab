/* Evolve a circuit: let evolution search for a logic circuit instead of designing it by hand.
   Pure logic, no DOM; tests in tests/evolve.test.mjs.

   The method is Cartesian Genetic Programming (Miller and Thomson, 2000), a standard way to evolve
   circuits. A genome is a row of gates; each gate has a type and two inputs, which can be the chip's
   inputs or any earlier gate; each output points at one gate. Gates nothing points to are carried
   along but unused, which lets the search drift through neutral changes. Each generation makes a few
   mutated copies of the best genome and keeps a copy if it is at least as good (a "1 + 4" strategy).

   Every signal is evaluated for all input patterns at once, one bit per pattern, so a whole truth
   table costs one pass. Fitness: first the number of correct output bits, then fewer gates. */
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
