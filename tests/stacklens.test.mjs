// A lens repaints the whole stack (#449, src/engines/stacklens.js): every plate painted from the carry at once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as P from '../src/engines/path.js';
import * as A from '../src/engines/arch.js';
import { EXAMPLE, RUNGS } from '../src/data/path.js';
import * as L from '../src/engines/stacklens.js';

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

test('Geometry: the share spent moving bits where the carry counts it, and says where it does not yet', () => {
  const R = carryAt(), p = L.paint(R, 'geo');
  assert.equal(p.block.n, Math.round(R.rungs.block.hands.wireShare * 100));
  assert.equal(p.machine.n, Math.round(R.rungs.machine.hands.moveShare * 100));
  assert.ok(['atom', 'switch', 'gate', 'chip', 'mind'].every(r => p[r].say === 'notYet' && p[r].v === null), 'the rest wait for #494');
  /* memory near the processor moves less at the machine */
  assert.ok(L.paint(carryAt({}, Object.assign({}, A.TODAY, { where: 'near' })), 'geo').machine.v < p.machine.v);
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
