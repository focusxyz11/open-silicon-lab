import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
import TC from '../src/engines/tinychip.js';
import * as EV from '../src/engines/evolve.js';
import { target, evolution, fitness, toCode, measure, run, randomGenome, rng } from '../src/engines/evolve.js';

const P = id => TC.PROJ.find(p => p.id === id);

test('evaluating all patterns at once agrees with the tiny-chip simulator', () => {
  const T = target(P('full')), r = rng(5);
  for (let k = 0; k < 20; k++) {
    const G = randomGenome(T, { nodes: 12 }, r), code = toCode(T, G), D = TC.parse(code, T.ins, T.outs);
    assert.deepEqual(D.errs, [], code);
    const got = run(T, G);
    TC.vectors(T.ins).forEach((v, i) => { const o = TC.evalDesign(D, v); T.outs.forEach((n, j) => assert.equal((got[j] >>> i) & 1, o[n], n)); });
  }
});

test('evolution finds a correct half adder, majority voter and full adder, and the studio agrees', () => {
  for (const [id, gens] of [['half', 3000], ['vote', 6000], ['full', 20000]]) {
    const E = evolution(P(id), { seed: 3 });
    E.step(gens);
    assert.ok(E.fit.solved, id + ' solved within ' + gens + ' generations (got ' + E.fit.correct + ' of ' + E.T.bits + ' bits)');
    const m = measure(P(id), toCode(E.T, E.best));
    assert.ok(m && m.correct, id + ': the evolved code verifies in the studio');
  }
});

test('the same seed gives the same evolution; keeping on after solving never makes it worse', () => {
  const a = evolution(P('vote'), { seed: 9 }), b = evolution(P('vote'), { seed: 9 });
  a.step(2000); b.step(2000);
  assert.deepEqual(a.best, b.best);
  const solved = a.fit; a.step(3000);
  assert.ok(a.fit.score >= solved.score && (!solved.solved || a.fit.solved));
});

test('only projects with a truth table of up to 5 inputs can be evolved', () => {
  assert.equal(target(P('count')), null, 'clocked');
  assert.equal(target(P('alu')), null, '6 inputs');
  assert.equal(target(P('free')), null, 'no specification');
  assert.ok(target(P('add2')) && target(P('seg')));
});

test('fitness counts correct bits first, then prefers fewer gates', () => {
  const T = target(P('half'));
  const perfect = { nodes: [{ t: 'XOR', a: 0, b: 1 }, { t: 'AND', a: 0, b: 1 }, { t: 'OR', a: 0, b: 0 }], outs: [2, 3] };
  const f = fitness(T, perfect);
  assert.equal(f.correct, 8); assert.equal(f.size, 2); assert.ok(f.solved);
});

/* the player's side: jobs, gate sets, challenges, a seeded start and step */
const ROW = (job, code) => { const D = TC.parse(code, job.ins, job.outs); assert.deepEqual(D.errs, [], code);
  TC.vectors(job.ins).forEach(v => { const o = TC.evalDesign(D, v), w = job.f(v); job.outs.forEach(n => assert.equal(o[n], w[n], n + ' at ' + JSON.stringify(v))); }); };

test('the jobs, gate sets and room are offered, and the engine holds no English', () => {
  assert.deepEqual(EV.JOBS.map(j => j.id), ['half', 'vote', 'full', 'add2', 'seg']);
  EV.JOBS.forEach(j => { assert.ok(j.ins.length && j.outs.length && typeof j.f === 'function' && j.human > 0, j.id); assert.ok(target(j.proj), j.id); });
  assert.deepEqual(EV.GATE_SETS.nand, ['NAND']);
  assert.ok(!EV.GATE_SETS.noxor.includes('XOR') && EV.GATE_SETS.all.includes('XOR'));
  assert.ok(EV.ROOM.min < EV.ROOM.default && EV.ROOM.default < EV.ROOM.max);
  for (const j of EV.JOBS) assert.ok(EN['evolve.job.' + j.id]);
  for (const g of Object.keys(EV.GATE_SETS)) assert.ok(EN['evolve.gates.' + g]);
  for (const c of Object.keys(EV.CHALLENGES)) assert.ok(EN['evolve.ch.' + c + '.done'], c);
});

test('step reports generation, code, correct of total, gates, and the same seed repeats', () => {
  const a = EV.start('vote', { seed: 4 }), b = EV.start('vote', { seed: 4 });
  const r0 = EV.step(a, 0);
  assert.equal(r0.gen, 0); assert.equal(r0.total, 8); assert.ok(r0.correct >= 0 && r0.correct <= 8);
  const r1 = EV.step(a, 300), r2 = EV.step(b, 300);
  assert.equal(r1.gen, 300); assert.deepEqual(r1, r2);
  assert.match(r1.code, /^\/\/ Evolved/);
  assert.ok(EV.step(a, 100).correct >= r1.correct, 'never worse');
});

test('every job can be solved, and a solved circuit passes every row of its truth table', () => {
  for (const [id, gens] of [['half', 1000], ['vote', 6000], ['full', 20000]]) {
    const s = EV.start(id, { seed: 3 }), r = EV.step(s, gens);
    assert.ok(r.solved && r.correct === r.total, id);
    ROW(EV.jobOf(id), r.code);
  }
});

const within = (job, gates, ch, seeds, max) => { for (const seed of seeds) { const s = EV.start(job, { seed, gates }); let g = 0, r;
  while (g < max) { r = EV.step(s, 50); g += 50; if (r.challenges[ch]) return { seed, gen: r.gen, r, job: EV.jobOf(job) }; } } return null; };

test('Beat the person: a majority voter with fewer cells than the human design, within 2000 generations for some seed', () => {
  const w = within('vote', 'all', 'beat', [1, 2, 3, 4, 5], 2000);
  assert.ok(w, 'met'); assert.ok(w.r.cells < w.job.human);
  ROW(w.job, w.r.code); console.log('beat: seed ' + w.seed + ', ' + w.gen + ' generations, ' + w.r.cells + ' cells vs ' + w.job.human);
  assert.equal(EV.step(EV.start('vote', { seed: 1, gates: 'nand' }), 0).challenges.beat, false, 'not with NAND only');
});

test('NAND only: a half adder from NAND gates alone, within 1000 generations for some seed, and its gates are counted', () => {
  const w = within('half', 'nand', 'nand', [1, 2, 3, 4], 1000);
  assert.ok(w, 'met'); assert.ok(w.r.gates >= 4, 'a half adder needs at least four NANDs');
  assert.ok(/NAND|~\(/.test(w.r.code) && !/ \^ | \| /.test(w.r.code.replace(/^\/\/.*$/m, '')), 'only NAND written');
  ROW(w.job, w.r.code); console.log('nand: seed ' + w.seed + ', ' + w.gen + ' generations, ' + w.r.gates + ' gates');
  assert.equal(EV.step(EV.start('half', { seed: 1, gates: 'all' }), 0).challenges.nand, false);
});
