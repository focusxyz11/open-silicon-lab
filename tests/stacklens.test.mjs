// A lens repaints the whole stack (#449, src/engines/stacklens.js): every plate painted from the carry at once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as P from '../src/engines/path.js';
import * as A from '../src/engines/arch.js';
import { EXAMPLE, RUNGS } from '../src/data/path.js';
import * as L from '../src/engines/stacklens.js';
import { MEETS } from '../src/data/frame.js';

const carryAt = (f = {}, g = A.TODAY) => P.carry(P.stackOf(g, Object.assign({}, EXAMPLE, f)));
const words = Object.assign({}, JSON.parse(readFileSync(new URL('../src/i18n/en/stack.json', import.meta.url), 'utf8')));

test('every lens paints all seven plates, each with words', () => {
  const R = carryAt();
  for (const id of L.REPAINT) {
    const p = L.paint(R, id, r => (r === 'gate' ? 'you' : 'lab'));
    assert.deepEqual(Object.keys(p), RUNGS, id + ': all seven');
    for (const r of RUNGS) { assert.ok(p[r].v === null || (p[r].v >= 0 && p[r].v <= 1), id + '.' + r); assert.ok(words['sk.lens.' + id + '.' + p[r].say], 'sk.lens.' + id + '.' + p[r].say); }
  }
  assert.equal(L.paint(R, 'eff'), null, 'a lens that does not repaint the stack says nothing');
});

test('Perfect fails: one wrong copy in 10^14 at the gate becomes one in 10^11 at the chip, read from the carry', () => {
  const R = carryAt({ V: 0.36 }), p = L.paint(R, 'perfect');
  assert.equal(p.gate.say, 'oneIn'); assert.equal(p.gate.n, 14);
  assert.equal(p.chip.say, 'oneIn'); assert.equal(p.chip.n, 11);
  /* the chance only grows on the way up, and so does the paint */
  const up = ['switch', 'gate', 'block', 'chip', 'machine'];
  for (let i = 1; i < up.length; i++) assert.ok(p[up[i]].v >= p[up[i - 1]].v - 1e-12, up[i] + ' at least as likely to fail as ' + up[i - 1]);
  /* the numbers are the carry's: the gate's own chance, and the chip's */
  assert.equal(p.gate.n, Math.round(-Math.log10(R.rungs.gate.hands.fail)));
  assert.ok(R.rungs.chip.hands.wrong > 0, 'the carry keeps a tiny chance exact instead of rounding it to never');
  /* at a comfortable voltage every plate is plain; lower, the paint climbs */
  const calm = L.paint(carryAt({ V: 0.7 }), 'perfect');
  assert.ok(['switch', 'gate', 'block', 'chip'].every(r => calm[r].say === 'rarer' && calm[r].v === 0));
  assert.ok(L.paint(carryAt({ V: 0.4 }), 'perfect').chip.v > 0 && p.chip.v > L.paint(carryAt({ V: 0.4 }), 'perfect').chip.v);
  /* the mind's is a share of its answers */
  assert.equal(p.mind.say, 'pct'); assert.ok(Math.abs(p.mind.n - (1 - R.rungs.mind.hands.right) * 100) < 0.1);
});

test('Geometry: the share spent moving bits and the heat on every rung, from the carry (#494)', () => {
  const R = carryAt(), p = L.paint(R, 'geo');
  for (const r of ['gate', 'block', 'chip', 'machine', 'mind']) { assert.equal(p[r].say, 'share', r); assert.equal(p[r].n, Math.round(R.rungs[r].hands.moving * 100), r); assert.ok(p[r].h > 0, r + ' is warm'); }
  assert.ok(['atom', 'switch'].every(r => p[r].say === 'still' && p[r].v === 0), 'the atom and the switch move nothing yet');
  /* memory near the processor moves less at the block, the chip and the machine */
  const near = L.paint(carryAt({}, Object.assign({}, A.TODAY, { where: 'near' })), 'geo');
  for (const r of ['block', 'chip', 'machine']) assert.ok(near[r].v < p[r].v, r);
});
test('Fixed or fluid: what a factory makes is fixed; a program or learning keeps the top fluid; living matter regrows', () => {
  const p = L.paint(carryAt(), 'line');
  assert.ok(['atom', 'switch', 'gate', 'block'].every(r => p[r].say === 'fixed'));
  assert.ok(['chip', 'machine', 'mind'].every(r => p[r].say === 'fluid'), 'today\'s computer runs programs');
  const wired = Object.assign({}, A.TODAY, { told: 'fixed' });
  assert.ok(RUNGS.every(r => !L.fluidOf(wired, r)), 'a circuit wired for one job is fixed all the way up');
  assert.ok(RUNGS.every(r => L.fluidOf(Object.assign({}, A.TODAY, { carrier: 'living' }), r)));
});

test('Only humans: each plate tinted by who chose it', () => {
  const who = { gate: 'you', chip: 'agent' }, p = L.paint(carryAt(), 'human', r => who[r] || 'lab');
  assert.equal(p.gate.say, 'you'); assert.equal(p.chip.say, 'agent'); assert.equal(p.atom.say, 'lab'); assert.equal(p.atom.v, 0); assert.equal(p.gate.v, 1);
});

/* ---- two lenses held (#449): the chain is the carry, the fork a gene split by a line, the front the field for two needs ---- */
test('every pair the lab names has a shape the stack draws, and a measure the stack paints', () => {
  for (const m of MEETS) {
    const shape = L.shapeOf(m.a, m.b), me = L.measureOf(m.a, m.b);
    assert.ok(['chain', 'fork', 'front'].includes(shape), m.a + '.' + m.b);
    assert.ok([...L.REPAINT, 'heat'].includes(me), m.a + '.' + m.b + ': ' + me);
    assert.ok(words['sk.pair.measure.' + me], 'sk.pair.measure.' + me);
    const P = L.paint(carryAt(), me);
    for (const r of RUNGS) { assert.ok(words['sk.lens.' + me + '.' + P[r].say], 'sk.lens.' + me + '.' + P[r].say); assert.ok(words['sk.pair.short.' + me + '.' + P[r].say], 'sk.pair.short.' + me + '.' + P[r].say); }
    if (shape === 'fork') assert.ok(A.GENES.includes(L.geneOfPair(m.a, m.b)), m.a + '.' + m.b + ': a gene');
  }
});

test('a chain climbs the carry: making a clean 1 lights from the switch up as the voltage falls', () => {
  const calm = L.chainOf(carryAt(), 'dig', 'physics'), low = L.chainOf(carryAt({ V: 0.36 }), 'dig', 'physics');
  assert.equal(calm.measure, 'perfect');
  assert.deepEqual(calm.steps.map(s => s.k), calm.steps.map((s, i) => i + 1), 'numbered from the bottom up');
  assert.ok(['gate', 'block', 'chip', 'machine'].every(r => !calm.steps.find(s => s.rung === r).lit), 'at 0.70 V nothing below the mind goes wrong often enough');
  assert.equal(low.from, 'switch', 'lower, the problem is made at the switch');
  assert.ok(low.steps.filter(s => ['switch', 'gate', 'block', 'chip', 'machine'].includes(s.rung)).every(s => s.lit), 'and carried all the way up');
  /* a chain by heat: the gate at full speed is hotter than a cold plate takes, the chip at its clock is not */
  const h = L.chainOf(carryAt(), 'moore', 'physics');
  assert.equal(h.measure, 'heat'); assert.ok(h.steps.find(s => s.rung === 'gate').lit); assert.ok(!h.steps.find(s => s.rung === 'chip').lit);
});

test('a fork splits the stack by a gene: Geometry with Fixed or fluid forks where it computes', () => {
  assert.equal(L.geneOfPair('geo', 'line'), 'where');
  assert.equal(L.otherOption(A.OPTIONS.where, 'far', 'far'), 'near', 'from today, the first other option');
  assert.equal(L.otherOption(A.OPTIONS.where, 'in', 'far'), 'far', 'from a fork, today\'s');
  assert.equal(L.otherOption(A.OPTIONS.where, 'far', 'far', 'flow'), 'flow', 'or the one asked for');
  const R = carryAt(), R2 = carryAt({}, Object.assign({}, A.TODAY, { where: 'in' })), f = L.forkOf(R, R2, 'geo', 'line');
  assert.equal(f.measure, 'geo');
  assert.ok(f.right.block.v < f.left.block.v && f.right.chip.v < f.left.chip.v, 'computing in memory moves less on both sides of the line');
});

test('a front keeps the attempts nobody beats at both needs', () => {
  const pts = [{ x: 1, y: 1 }, { x: 2, y: 0.5 }, { x: 0.5, y: 3 }, { x: 0.9, y: 0.9 }, { x: 2, y: 0.4 }];
  const f = L.frontOf(pts);
  assert.deepEqual(f.map(p => [p.x, p.y]), [[2, 0.5], [1, 1], [0.5, 3]], 'the best compromises, best at the first need first');
  assert.ok(!f.includes(pts[3]) && !f.includes(pts[4]), 'a point beaten at both is behind the line');
});
