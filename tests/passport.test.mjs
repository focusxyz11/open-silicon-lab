// Your chip's passport: computed from the design with the same engines as the labs, for every
// project and process, with a line for each stage of the journey.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
import { passport, journey, chipLine, NODES } from '../src/engines/passport.js';
import { TOPICS } from '../src/data/topics.js';

test('every project and process gives a complete passport', () => {
  const topics = new Set(TOPICS.map(t => t.id));
  for (const proj of TC.PROJ) for (const node of NODES) {
    const p = passport({ proj, code: proj.sol || proj.starter, node });
    assert.equal(p.ok, true, proj.id + ' ' + node);
    assert.ok(p.tr > 0 && p.cells > 0 && p.area > 0);
    assert.ok(p.yieldPct > 99 && p.yieldPct <= 100, 'tiny circuits nearly always work');
    const J = journey(p);
    assert.equal(J.length, 14);
    for (const s of J) { assert.ok(topics.has(s.topic), s.key); assert.ok(s.d.length > 20, s.key); }
  }
});

test('smaller processes make the same design smaller and faster', () => {
  const proj = TC.PROJ.find(p => p.id === 'full');
  const a = passport({ proj, code: proj.sol, node: '180' }), b = passport({ proj, code: proj.sol, node: '3' });
  assert.ok(b.area < a.area / 50); assert.ok(b.fmaxMHz > a.fmaxMHz * 5);
  assert.equal(a.tr, b.tr, 'the same gates');
});

test('verification state and project-specific stages are honest', () => {
  const vote = TC.PROJ.find(p => p.id === 'vote');
  assert.ok(passport({ proj: vote, code: vote.starter }).wrong > 0);
  assert.equal(passport({ proj: vote, code: vote.sol }).wrong, 0);
  const alu = TC.PROJ.find(p => p.id === 'alu');
  assert.match(journey(passport({ proj: alu, code: alu.sol })).find(s => s.key === 'cpu').d, /ALU/);
  assert.match(journey(passport({ proj: vote, code: vote.sol, node: '3' })).find(s => s.key === 'real').d, /no open design kit/);
  assert.equal(passport({ proj: vote, code: 'y = a &' }).ok, false);
});

test('topic lines exist where the chip travels', () => {
  const proj = TC.PROJ.find(p => p.id === 'seg'); const p = passport({ proj, code: proj.sol });
  for (const t of ['tiny', 'design', 'layout', 'riscv', 'litho', 'fab', 'yield', 'economics', 'future', 'transistor', 'physics', 'supply']) assert.ok(chipLine(t, p).length > 20, t);
  assert.equal(chipLine('quantum', p), '');
});

test('distance from physics: the same floor as the physics floor topic, and about a million times above it', async () => {
  const { landauer } = await import('../src/engines/floor.js');
  const { physics, KT_LN2, E_GATE_45 } = await import('../src/engines/passport.js');
  assert.ok(Math.abs(KT_LN2 - landauer(300)) < 1e-30);
  assert.ok(Math.abs(E_GATE_45 * 16 * 5 - 0.18e-12) < 1e-20, 'from the measured 16-bit add');
  for (const proj of TC.PROJ) {
    const x = physics(passport({ proj, code: proj.sol || proj.starter, node: '130' }));
    assert.ok(x.gates > 0 && x.times > 5e5 && x.times < 1e6, proj.id + ': ' + x.times);
  }
});
