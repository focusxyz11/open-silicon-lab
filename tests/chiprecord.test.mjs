/* Your chip's record (#505, docs/CHIP.md): one record, every machine a function, the carry reading what the line made. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../src/engines/chiprecord.js';
import * as S from '../src/engines/stations.js';
import * as P from '../src/engines/path.js';
import * as D from '../src/data/chiprecord.js';
import { CARE, CHOICES, EXAMPLE } from '../src/data/path.js';
import { WORLDS } from '../src/data/weave.js';
import { FIDS, ENGINES } from '../src/data/fidelity.js';
import { TWINS } from '../src/data/atlas.js';
import { euv } from '../src/engines/litho.js';
import { dieOf } from '../src/engines/chip.js';
import { solutionOf } from '../src/engines/design.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), msg + ': ' + a + ' against ' + b);
const ST = P.stackOf();
/* a design that does its job (the project's own solution) */
const ok = p => ({ p, code: solutionOf(p) });
const rec = (design = ok('half'), care, stack = ST) => R.recordOf(stack, design, care);
const at = (r, step) => R.madeAt(r, step).chip;

test('the record has three parts: as designed, as made station by station, as used', () => {
  const r = rec();
  assert.equal(r.kind, D.KIND); assert.equal(r.v, D.VERSION); assert.equal(r.care, EXAMPLE.care);
  assert.ok(r.designed && Array.isArray(r.made) && r.used && r.used.rungs, 'designed, made, used');
  /* one state and one report per station that has a function, in the line's order; Package keeps its place */
  const withFn = D.STEPS.filter(s => S.STATION_FNS[s]);
  assert.deepEqual(r.made.map(m => m.step), withFn);
  assert.deepEqual(R.stepsOf(r), withFn);
  assert.deepEqual(withFn, ['crystal', 'deposit', 'print', 'etch', 'implant', 'wires', 'test']);
  assert.equal(D.stationOf('pkg').waits, 500, 'Package waits for its engine (#500)');
  assert.equal(D.STEPS[D.STEPS.length - 1], 'pkg', 'and is the eighth station');
  assert.equal(R.stationFns, S.STATION_FNS);
  for (const m of r.made) {
    assert.equal(m.report.step, m.step);
    assert.deepEqual(m.chip.done, withFn.slice(0, withFn.indexOf(m.step) + 1), m.step + ': the chip keeps what every step before it did');
    for (const k of m.report.adds) assert.ok(k in m.chip, m.step + ' adds ' + k);
  }
  assert.equal(R.madeAt(r, 'pkg'), null, 'a step the line has not reached');
});

test('the line\'s order is the atlas\'s', () => {
  const journey = WORLDS.find(w => w.id === 'journey').depths;
  const idx = D.STEPS.map(s => journey.indexOf(s));
  assert.ok(idx.every(i => i >= 0), 'every station is a step of the journey: ' + D.STEPS);
  assert.ok(idx.every((i, k) => k === 0 || i > idx[k - 1]), 'in the journey\'s order');
  /* the made steps the Turn names are stations of the record, crystal before implant */
  for (const tw of TWINS) for (const m of tw.made) assert.ok(D.STEPS.includes(m), 'the Turn\'s made step ' + m);
  for (const s of D.STATIONS) if (s.by) assert.ok(ENGINES[s.by], s.id + ': its engine ' + s.by);
});

test('every station is a pure function of the chip so far and the care', () => {
  const r = rec(ok('full'), 0);
  let chip = S.bareChip(R.madeAt(r, 'crystal').chip.plan);
  for (const id of r.made.map(m => m.step)) {
    const before = JSON.stringify(chip), a = S.STATION_FNS[id](chip, 0), b = S.STATION_FNS[id](chip, 0);
    assert.equal(JSON.stringify(chip), before, id + ' leaves the chip it was given alone');
    assert.deepEqual(a, b, id + ': the same chip and care, the same chip after and report');
    assert.deepEqual(a, { chip: R.madeAt(r, id).chip, report: R.madeAt(r, id).report }, id + ': the line is these functions in order');
    chip = a.chip;
  }
});

test('every number a station reports carries its mark', () => {
  for (const care of CHOICES.care) for (const m of rec(ok('full'), care).made) {
    for (const k of Object.keys(m.report.figures)) {
      assert.ok(Number.isFinite(m.report.figures[k]), m.step + ' ' + k + ' is a number');
      assert.ok(m.report.fid[k], m.step + ' ' + k + ': a mark');
    }
    for (const [k, f] of Object.entries(m.report.fid)) {
      assert.ok(FIDS.includes(f.f), m.step + ' ' + k + ': a mark of fidelity.js');
      if (f.by) assert.ok(ENGINES[f.by], m.step + ' ' + k + ': engine ' + f.by);
    }
    if (m.report.mark) assert.equal(m.report.mark, D.stationOf(m.step).mark);
  }
  const d = rec().designed;
  for (const [k, f] of Object.entries(d.fid)) { assert.ok(FIDS.includes(f.f), 'designed ' + k); if (f.by) assert.ok(ENGINES[f.by], 'designed ' + k + ' ' + f.by); }
});

test('changing the design changes the masks and what Print leaves', () => {
  const a = rec(ok('half')), b = rec(ok('full'));
  assert.notDeepEqual(a.designed.cells, b.designed.cells, 'another netlist');
  assert.notDeepEqual(a.designed.masks, b.designed.masks, 'other masks');
  const pa = at(a, 'print'), pb = at(b, 'print');
  assert.deepEqual(pa.cells.map(c => c.type), a.designed.cells.map(c => c.type), 'Print prints the design\'s cells');
  assert.deepEqual(pb.cells.map(c => c.type), b.designed.cells.map(c => c.type));
  assert.notDeepEqual(pa.cells, pb.cells, 'what Print leaves follows the design');
  assert.deepEqual(pa.masks, { drawn: a.designed.masks.drawn, total: a.designed.masks.total }, 'Print reads the design\'s masks');
  /* the vias the routing drew are those the Wires station lands */
  assert.equal(at(b, 'wires').wiring.vias, b.designed.vias);
  /* the line's own numbers do not depend on the design */
  assert.equal(pa.spread, pb.spread); assert.equal(at(a, 'deposit').specks, at(b, 'deposit').specks);
});

test('changing the care changes the spread, the yield and the cost, and the carry above them', () => {
  const R0 = rec(ok('full'), 0), R1 = rec(ok('full'), 1), R2 = rec(ok('full'), 2);
  const sp = r => at(r, 'print').spread, T = r => at(r, 'test').test;
  close(sp(R1), 1, 'today\'s care is today\'s spread');
  close(sp(R0), euv({ dose: CARE.dose[0] }).noisePct / euv({ dose: CARE.dose[1] }).noisePct, 'the spread is the print\'s photon noise');
  assert.ok(sp(R0) > sp(R1) && sp(R1) > sp(R2), 'a lower dose, a wider spread');
  assert.ok(T(R0).yield < T(R1).yield && T(R1).yield < T(R2).yield, 'cleaner air, more whole dies');
  assert.notEqual(T(R0).cost, T(R1).cost); assert.notEqual(T(R2).cost, T(R1).cost);
  for (const r of [R0, R1, R2]) {
    const K = r.used.rungs.chip.hands, t = T(r), d = dieOf(t.area, at(r, 'deposit').specks, at(r, 'print').pace);
    assert.equal(r.used.fab.spread, sp(r), 'the carry reads the made spread');
    assert.equal(r.used.fab.defects, at(r, 'deposit').specks, 'and the made specks');
    assert.equal(K.yield, t.yield, 'and the yield Test found');
    close(K.area, r.designed.die.area, 'the die tested is the die designed');
    close(t.yield, d.yield, 'Test\'s yield is the chip engine\'s'); close(t.cost, d.cost, 'and its cost');
    assert.equal(t.good.length, D.WAFER_DIES);
  }
  assert.ok(R0.used.rungs.switch.hands.sigma > R1.used.rungs.switch.hands.sigma, 'the switch\'s copies spread wider above a hurried line');
  assert.notEqual(R0.used.rungs.chip.hands.cost, R1.used.rungs.chip.hands.cost, 'and the chip\'s good die costs otherwise');
  /* the carry with no record runs the same line: the same numbers */
  for (const care of CHOICES.care) assert.deepEqual(P.carry(R.withCare(ST, care)), rec(ok('full'), care).used, 'carry and the record agree at care ' + care);
});

test('every copy strays by its own seed, at every station and every visit', () => {
  const wid = (r, s) => Object.fromEntries(at(r, s).cells.map(c => [c.id, c.jit]));
  const a = rec(ok('full'), 0), b = rec(ok('full'), 0), c = rec(ok('full'), 2);
  assert.deepEqual(wid(a, 'print'), wid(b, 'print'), 'the same copy on every visit');
  assert.deepEqual(wid(a, 'print'), wid(a, 'test'), 'and at every station after Print');
  for (const id of Object.keys(wid(a, 'print'))) {
    close(wid(a, 'print')[id] / at(a, 'print').spread, wid(c, 'print')[id] / at(c, 'print').spread, id + ': its own hash, scaled by the spread');
    close(at(a, 'print').cells.find(x => x.id === id).width, 1 + wid(a, 'print')[id] * D.WIDTH, id + ': its width');
  }
  assert.equal(S.hashOf('c3'), S.hashOf('c3')); assert.notEqual(S.hashOf('c3'), S.hashOf('c4'));
  /* today's line strays no copy; a hurried one strays some, and Etch says how many */
  const many = rec(ok('alu'), 1), hurried = rec(ok('alu'), 0);
  assert.ok(at(many, 'etch').cells.length > 10, 'a design of many cells');
  assert.equal(at(many, 'etch').cells.filter(x => x.stray).length, 0, 'no copy strays on today\'s line');
  const n = at(hurried, 'etch').cells.filter(x => x.stray).length;
  assert.ok(n > 0, 'a hurried line strays some copies');
  assert.deepEqual(R.madeAt(hurried, 'etch').report.wrong, [{ what: 'stray', n }]);
  assert.equal(at(hurried, 'test').test.strays, n);
});

test('an empty or broken design stops the line from Print on; the line still runs', () => {
  const empty = rec(null), broken = rec({ p: 'half', code: 'nonsense =' });
  assert.equal(empty.designed.broken, 'empty'); assert.equal(broken.designed.broken, 'design');
  for (const r of [empty, broken]) {
    assert.equal(at(r, 'crystal').stopped, null, 'nothing stops before Print');
    const p = at(r, 'print');
    assert.equal(p.stopped, r.designed.broken); assert.deepEqual(p.cells, []); assert.equal(p.masks, null);
    assert.deepEqual(R.madeAt(r, 'print').report.wrong, [{ what: r.designed.broken }]);
    assert.equal(at(r, 'wires').wiring.vias, 0);
    assert.ok(at(r, 'test').test.yield > 0, 'the line still makes the die your stack holds');
    assert.ok(Number.isFinite(r.used.rungs.chip.hands.cost));
  }
  /* a switch that never turns off (graphene has no gap): the stack breaks there and the line patterns nothing */
  const off = P.stackOf(undefined, { mat: 'graphene' });
  assert.equal(P.carry(off).broken, 'switch');
  const r = R.recordOf(off, ok('half'));
  assert.equal(r.designed.broken, 'switch'); assert.equal(at(r, 'print').stopped, 'switch'); assert.deepEqual(at(r, 'print').cells, []);
  assert.equal(r.designed.die, null, 'no die to make'); assert.equal(at(r, 'test').test, null);
  assert.deepEqual(R.madeAt(r, 'test').report.wrong, [{ what: 'noDie' }]);
});

test('the record is pure data and round-trips as osl-chip', () => {
  for (const [design, care] of [[ok('full'), 1], [ok('alu'), 0], [null, 2]]) {
    const r = rec(design, care);
    assert.deepEqual(JSON.parse(JSON.stringify(r)), r, 'plain data');
    const kept = JSON.parse(JSON.stringify(R.keepOf(r)));
    assert.equal(kept.kind, 'osl-chip');
    assert.deepEqual(R.fromKept(kept), r, 'made again from what was kept');
  }
  assert.equal(R.fromKept({ kind: 'something-else' }), null);
  assert.equal(R.fromKept({ kind: D.KIND, v: D.VERSION + 1 }), null, 'a later version is not read as this one');
  /* a care on the record is the stack's care, so the line and the carry run with the same */
  const r = rec(ok('half'), 2);
  assert.equal(r.care, 2); assert.equal(r.designed.fine.care, 2); assert.equal(r.used.fab.care, 2);
});
