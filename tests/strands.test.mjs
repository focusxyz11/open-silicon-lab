// One spec, two matters (src/engines/strands.js, played by src/v2/labs/bridge.js): the same logic as silicon gates and
// as DNA strands in a test tube. Silicon is exact and fast; a seesaw gate in the tube is right only with a threshold
// that holds back the 0s and fuel that lifts the 1s without leaking; the classifier needs its annihilators.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as D from '../src/engines/strands.js';
import TC from '../src/engines/tinychip.js';

const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
const factOf = id => facts.find(f => f.id === id);
const AND_OK = { th: 1.2, fuel: 0.5 }, OR_OK = { th: 0.4, fuel: 0.75 }, WTA_OK = { ann: 1.2, th: 0.05, fuel: 0.5 };

test('the three papers the model follows are sourced, with the date they were checked', () => {
  for (const id of ['dna-seesaw', 'dna-wta', 'dna-cello']) {
    const f = factOf(id); assert.ok(f, id);
    assert.ok(f.value && f.source && /^https:\/\//.test(f.url) && f.verified === '2026-11-26', id);
  }
  assert.match(factOf('dna-wta').value, /nine/);
  assert.match(factOf('dna-seesaw').value, /130/);
});

test('one spec, written once: silicon runs it exactly, on the bench\'s own cells and their delays', () => {
  assert.deepEqual(D.rowsOf('and').map(r => r.want), [0, 0, 0, 1]);
  assert.deepEqual(D.rowsOf('choice').map(r => r.want), [0, 1, 0, 1, 0, 0, 1, 1], 's ? a : b, rows s a b');
  for (const s of D.SPEC_IDS) assert.ok(D.siliconRight(s), s);
  assert.equal(D.siliconDelay('and'), TC.LIB.AND2[2]);
  assert.equal(D.siliconDelay('choice'), TC.LIB.INV[2] + TC.LIB.AND2[2] + TC.LIB.OR2[2], 'the longest path: NOT, AND, OR');
  assert.ok(D.siliconDelay('choice') < 1000, 'well under a nanosecond');
});

test('a seesaw gate: a passing input releases output up to the gate, fuel restores a weak one, fuel leaks', () => {
  let y = 0; for (let t = 0; t < D.READ_AT; t += D.DT) y = D.gateStep(y, 0.3, 0);
  assert.ok(y < 0.3 + 1e-9 && y > 0.2, 'without fuel, no more out than passed in: ' + y);
  let z = 0; for (let t = 0; t < D.READ_AT; t += D.DT) z = D.gateStep(z, 0.3, 1);
  assert.ok(z > D.HIGH, 'with fuel, the same weak input restores a full output: ' + z);
  assert.ok(D.leakAt(0) < 0.1 && D.leakAt(1) < D.LOW && D.leakAt(2) > D.LOW, 'the leak grows with the fuel');
  assert.ok(D.leakAt(1, 4 * D.READ_AT) > D.HIGH, 'wait long enough and the leak turns every output to 1');
});

test('a correct AND in the tube: right on every input, worst-case amounts, within the time', () => {
  const c = D.tubeCheck('and', { and: AND_OK });
  assert.equal(c.ok, true); assert.equal(c.right, 4); assert.ok(c.fast && c.time <= D.DEADLINE, 'answers in ' + c.time + ' min');
  assert.ok(c.time * 60e12 / D.siliconDelay('and') > 1e12, 'the tube takes minutes where silicon takes picoseconds');
});

test('a leaky gate: too much fuel blurs every 0; too low a threshold lets one input through', () => {
  const leak = D.tubeCheck('and', { and: { th: 1.2, fuel: 2 } });
  assert.equal(leak.ok, false); assert.equal(leak.why, 'blur');
  assert.ok(leak.rows.filter(r => !r.want).every(r => r.got == null && r.out > D.LOW), 'the leak lifts every row that should be 0 off its line');
  const low = D.tubeCheck('and', { and: { th: 0.5, fuel: 1 } });
  assert.equal(low.ok, false); assert.equal(low.why, 'leak', 'one input alone passes: an OR, not an AND');
  assert.ok(low.rows.some(r => !r.want && r.got === 1), 'a row that should be 0 reads 1');
  const dim = D.tubeCheck('and', D.START);
  assert.equal(dim.ok, false); assert.equal(dim.why, 'blur', 'the start: a 0 too bright to call');
  const weak = D.tubeCheck('and', { and: { th: 1.7, fuel: 0 } });
  assert.equal(weak.ok, false); assert.equal(weak.why, 'weak', 'a high threshold and no fuel: the 1 never gets bright');
});

test('the choice needs a threshold and fuel at every gate: no fuel anywhere never wins, the right dials do', () => {
  assert.equal(D.checkBridge(D.START).ok, false);
  assert.equal(D.checkBridge({ and: AND_OK, or: OR_OK }).ok, true);
  for (const a of [0.6, 0.8, 1, 1.2]) for (const o of [0, 0.2, 0.4, 0.6, 0.8]) assert.equal(D.checkBridge({ and: { th: a, fuel: 0 }, or: { th: o, fuel: 0 } }).ok, false, a + '/' + o);
  /* the OR's threshold must sit above what the ANDs before it leak */
  assert.equal(D.tubeCheck('choice', { and: { th: 1.1, fuel: 1 }, or: { th: 0, fuel: 1 } }).ok, false);
  assert.equal(D.tubeCheck('choice', { and: { th: 1.1, fuel: 1 }, or: { th: 0.7, fuel: 1 } }).ok, true);
});

test('the classifier: no threshold alone sorts the patterns, so the annihilators must', () => {
  const S = D.PATTERNS.map(p => ({ p, s: D.sumsOf(p), k: D.MEMORIES.findIndex(m => m.id === p.is) }));
  for (const x of S) assert.equal(Math.max(...x.s), x.s[x.k], x.p.id + ': its own memory sums the most');
  const minWin = Math.min(...S.map(x => x.s[x.k])), maxLose = Math.max(...S.flatMap(x => x.s.filter((_, k) => k !== x.k)));
  assert.ok(maxLose >= minWin, 'a loser in one pattern sums as much as a winner in another');
  for (const th of D.RESTORE_TH) for (const fuel of D.FUELS) assert.equal(D.checkWta({ ann: 0, th, fuel }).ok, false, 'no annihilator ' + th + '/' + fuel);
  const w = D.checkWta(WTA_OK);
  assert.equal(w.ok, true); assert.equal(w.right, D.PATTERNS.length);
  for (const r of w.rows) { const last = r.left.map(a => a[a.length - 1]); assert.ok(last.filter(v => v > 0.01).length <= 1, r.p.id + ': one sum is left'); }
  assert.equal(D.checkWta({ ann: 0.4, th: 0.05, fuel: 0.5 }).ok, false, 'too few annihilators: the losers are not all wiped out');
  assert.equal(D.checkWta({ ann: 1.2, th: 0.05, fuel: 1.5 }).ok, false, 'too much fuel: every output leaks up');
  assert.equal(D.checkWta({ ann: 1.2, th: 0.5, fuel: 0.5 }).ok, false, 'too high a threshold: the winner is held back too');
  assert.equal(D.checkWta(D.WTA_START).ok, false);
});
