// New ways to compute: every model behaves like the physics it stands for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/engines/paradigms.js';
import { MACHINES, JOBS, GALLERY, STAGES } from '../src/data/paradigms.js';
import { TOPICS } from '../src/data/topics.js';
import { readFileSync } from 'node:fs';

test('moving data from DRAM costs over 1,000× the math; registers cost less than the math', () => {
  const d = P.macEnergy('dram', 1), r = P.macEnergy('rf', 1);
  assert.ok(d.move / d.math > 1000);
  assert.ok(r.move < r.math);
  assert.ok(P.macEnergy('dram', 1024).share < P.macEnergy('dram', 1).share, 'reuse helps');
});

test('the analog crossbar is exact with fine settings and degrades with noise and coarse converters', () => {
  const r = P.rng(4); const W = Array.from({ length: 8 }, () => Array.from({ length: 4 }, () => r() * 2 - 1)); const x = Array.from({ length: 8 }, () => r());
  const fine = P.crossbar(W, x, { wBits: 10, adcBits: 12, sigma: 0 }).err;
  const coarse = P.crossbar(W, x, { wBits: 3, adcBits: 3, sigma: 0 }).err;
  const noisy = P.crossbar(W, x, { wBits: 10, adcBits: 12, sigma: 0.15 }).err;
  assert.ok(fine < 0.01, 'fine ' + fine); assert.ok(coarse > fine); assert.ok(noisy > fine);
  const e4 = P.cimEnergy(8, 4, 4), e10 = P.cimEnergy(8, 4, 10);
  assert.ok(e4.analog < e4.digital && e10.analog > e4.analog);
});

test('spiking detectors respond to their own pattern, and spiking does less work than dense compute', () => {
  const a = P.lif(P.spikeTrains('A'), P.SNN_W), b = P.lif(P.spikeTrains('B'), P.SNN_W), q = P.lif(P.spikeTrains('quiet'), P.SNN_W);
  assert.ok(a.counts[0] > a.counts[1]); assert.ok(b.counts[1] > b.counts[0]);
  assert.ok(q.events < q.dense / 10, 'a quiet input costs almost nothing');
  /* The puzzle is not solved at the default settings, but some setting of the sliders solves it. */
  const solved = (threshold, leak) => { const n = p => P.lif(P.spikeTrains(p), P.SNN_W, { threshold, leak }).counts[0]; return n('A') >= 3 && n('B') + n('noise') + n('quiet') === 0; };
  assert.equal(solved(1, 0.2), false);
  let any = false; for (let t = 0.3; t <= 2.5; t += 0.05) for (let l = 0; l <= 0.6; l += 0.02) if (solved(+t.toFixed(2), +l.toFixed(2))) any = true;
  assert.ok(any, 'some threshold and leak solve it');
});

test('an interferometer conserves power and routes light with its inner phase', () => {
  for (const [t, f] of [[0, 0], [1, 2], [Math.PI, 0.5], [2.2, 4]]) { const p = P.mzi([0.6, 0.8], t, f).power; assert.ok(Math.abs(p[0] + p[1] - 1) < 1e-9); }
  assert.ok(P.mzi([1, 0], 0, 0).power[1] > 0.999, 'θ = 0: all light to the bottom');
  assert.ok(P.mzi([1, 0], Math.PI, 0).power[0] > 0.999, 'θ = π: all light to the top');
  assert.ok(Math.abs(P.mzi([1, 0], Math.PI / 2, 0).power[0] - 0.5) < 1e-9, 'θ = π/2: 50 : 50');
});

test('quantum: Bell states, interference and unitarity', () => {
  const pr = c => P.qprobs(P.qrun(c));
  assert.deepEqual(pr([['H', null], ['CX']]).map(v => +v.toFixed(6)), [0.5, 0, 0, 0.5]);
  assert.ok(pr([['H', null], ['H', null]])[0] > 0.999999, 'H twice returns to 0');
  assert.ok(pr([['H', null], ['Z', null], ['H', null]])[2] > 0.999999, 'a phase flip turns cancellation into 1');
  assert.ok(pr([['X', 'X']])[3] > 0.999999);
  for (const c of [[['H', 'H'], ['CX'], ['S', 'X'], ['XC'], ['H', null]]]) assert.ok(Math.abs(pr(c).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  const s = P.qsample(P.qrun([['H', null], ['CX']]), 1000); assert.equal(s[1] + s[2], 0); assert.ok(s[0] > 400 && s[3] > 400);
});

test('p-bits: the AND rule is the energy minimum, and the gate runs forwards and backwards', () => {
  const states = Array.from({ length: 8 }, (_, k) => [k >> 2 & 1, k >> 1 & 1, k & 1]);
  const E = s => P.pEnergy(s.map(b => (b ? 1 : -1)));
  const min = Math.min(...states.map(E));
  for (const s of states) assert.equal(E(s) === min, s[2] === (s[0] & s[1]), s.join(''));
  const back = P.pSample({ beta: 2, clamp: { 2: 1 } }); assert.ok((back['111'] || 0) > 1800);
  const fwd = P.pSample({ beta: 2, clamp: { 0: 1, 1: 1 } }); assert.ok((fwd['111'] || 0) > 1800);
  const rand = P.pSample({ beta: 0 }); assert.ok(Object.keys(rand).length === 8, 'with no steering every state appears');
});

test('reversible: Landauer limit, adiabatic savings, and the Toffoli gate is its own inverse', () => {
  assert.ok(Math.abs(P.landauer(300) - 2.87e-21) < 0.01e-21);
  const C = 1e-15, V = 0.7, R = 1e3;
  assert.ok(P.adiabaticLoss(C, V, R, 1e-9) < P.switchLoss(C, V) / 100);
  assert.ok(P.adiabaticLoss(C, V, R, 1e-12) <= P.switchLoss(C, V));
  const seen = new Set();
  for (let k = 0; k < 8; k++) { const i = [k >> 2 & 1, k >> 1 & 1, k & 1], o = P.toffoli(...i); seen.add(o.join('')); assert.deepEqual(P.toffoli(...o), i); }
  assert.equal(seen.size, 8);
});

test('dataflow: weights on chip save energy until the model no longer fits', () => {
  const fits = P.dataflowEnergy({ layers: 8, mbPerLayer: 4, tiles: 16, mbPerTile: 2, mode: 'spatial' });
  const vn = P.dataflowEnergy({ layers: 8, mbPerLayer: 4, tiles: 16, mbPerTile: 2, mode: 'vn' });
  const big = P.dataflowEnergy({ layers: 64, mbPerLayer: 64, tiles: 16, mbPerTile: 2, mode: 'spatial' });
  assert.equal(fits.fit, 1); assert.ok(vn.uj / fits.uj > 50); assert.ok(big.fit < 0.01);
});

test('paradigm data point at real topics and stages, and every gallery fact exists', () => {
  const ids = new Set(TOPICS.map(t => t.id));
  for (const m of MACHINES) { assert.ok(ids.has(m[2]), m[0]); assert.ok(m[3] >= 0 && m[3] < STAGES.length); }
  const mids = new Set(MACHINES.map(m => m[0]));
  for (const j of JOBS) { for (const [k, v] of Object.entries(j.fit)) { assert.ok(mids.has(k), j.id + ' ' + k); assert.ok(v[0] >= 1 && v[0] <= 3); } assert.ok(Object.values(j.fit).some(v => v[0] >= 2), j.id + ' has a good fit'); }
  const facts = new Set(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url))).facts.map(f => f.id));
  for (const g of GALLERY) { assert.ok(g[2] >= 0 && g[2] < STAGES.length); if (g[7]) assert.ok(facts.has(g[7]), g[0]); }
});
