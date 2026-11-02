import test from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
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
