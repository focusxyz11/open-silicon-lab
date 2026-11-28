/* The studio's die, laid out from the record (#506, src/v2/studio/plan.js): one drawing, each level a framing of it. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planOf, levelAt, LEVELS, DIE } from '../src/v2/studio/plan.js';
import { recordOf } from '../src/engines/chiprecord.js';
import { stackOf } from '../src/engines/path.js';
import { solutionOf } from '../src/engines/design.js';
import * as A from '../src/engines/arch.js';

const ok = p => ({ p, code: solutionOf(p) });
const inside = (a, b, slack = 1e-6) => a.x >= b.x - slack && a.y >= b.y - slack && a.x + a.w <= b.x + b.w + slack && a.y + a.h <= b.y + b.h + slack;
const plan = (design = ok('alu'), g, F) => planOf(recordOf(stackOf(g, F), design));

test('the die holds its units, the first unit your block, the block your cells', () => {
  const P = plan();
  assert.equal(P.cells.length, recordOf(stackOf(), ok('alu')).designed.cells.length, 'every cell of the design is drawn');
  assert.ok(P.cells.length > 10);
  const die = { x: 0, y: 0, w: DIE, h: DIE };
  for (const u of P.units) assert.ok(inside(u, die), 'a unit on the die');
  assert.ok(inside(P.block, P.units[0]) && inside(P.regs, P.units[0]) && inside(P.ctl, P.units[0]), 'the block, its registers and control in the first unit');
  for (const c of P.cells) assert.ok(inside(c, P.block), c.id + ' in the block');
  assert.equal(P.pads.length, 40, 'ten pads a side');
  /* every wire ends on the cell it feeds, at its left edge */
  for (const w of P.wires) { const c = P.cells.find(x => x.id === w.to), e = w.pts[w.pts.length - 1]; assert.equal(e[0], c.x); assert.ok(e[1] >= c.y && e[1] <= c.y + c.h); }
  /* the cells are where the placer put them: two cells never overlap */
  for (const a of P.cells) for (const b of P.cells) if (a !== b && a.y === b.y) assert.ok(a.x + a.w <= b.x + 1e-9 || b.x + b.w <= a.x + 1e-9, a.id + ' and ' + b.id + ' overlap');
});

test('each level frames the next one closer: chip, block, gate, switch', () => {
  for (const p of ['half', 'full', 'seg']) { const T = plan(ok(p)).targets; for (let i = 1; i < LEVELS.length; i++) assert.ok(T[LEVELS[i]].w <= T[LEVELS[i - 1]].w * 0.5 + 1e-9, p + ': ' + LEVELS[i] + ' at most half of ' + LEVELS[i - 1]); }
  const P = plan(), T = P.targets;
  assert.deepEqual(LEVELS, ['chip', 'block', 'gate', 'switch']);
  for (let i = 1; i < LEVELS.length; i++) assert.ok(T[LEVELS[i]].w < T[LEVELS[i - 1]].w, LEVELS[i] + ' is closer than ' + LEVELS[i - 1]);
  assert.ok(inside(P.units[0], T.block), 'the block level frames the first unit');
  const c0 = P.cells[0]; assert.ok(inside(c0, T.switch) && inside(c0, T.gate), 'the gate and switch levels frame the first cell');
  assert.ok(T.switch.x < c0.x - c0.w, 'room at the cell\'s left for the cut the line draws');
  /* the level a scale stands at, continuously: each target's own scale is its level */
  const W = 1000;
  LEVELS.forEach((l, i) => { const L = levelAt(P, W / T[l].w, W); assert.equal(L.level, l); assert.ok(Math.abs(L.pos - i) < 1e-9, l + ' at ' + L.pos); });
  let last = -1; for (let k = 0; k <= 60; k++) { const L = levelAt(P, Math.exp(Math.log(W / T.chip.w) + k * (Math.log(T.chip.w / T.switch.w) / 60)), W); assert.ok(L.pos >= last - 1e-9); last = L.pos; }
});

test('the floorplan follows the recipe: its shape lays out the units, where it computes places the memory', () => {
  const units = (shape, ui = 1) => plan(ok('half'), Object.assign({}, A.TODAY, { shape }), { ui }).units.length;
  assert.equal(units('few', 0), 1); assert.equal(units('few', 1), 4); assert.equal(units('few', 2), 8);
  assert.equal(units('grid', 0), 16); assert.equal(units('grid', 1), 64); assert.equal(units('grid', 2), 256);
  assert.ok(units('stack') <= 5, 'layers drawn as a few sheets'); assert.ok(units('swarm', 2) <= 400, 'a swarm drawn as a field');
  const mem = where => plan(ok('half'), Object.assign({}, A.TODAY, { where }));
  assert.ok(mem('far').mem[0].x >= DIE, 'far memory stands off the chip');
  assert.ok(mem('near').mem[0].x < DIE && mem('near').mem.length === 1, 'near memory is a band on it');
  const pin = mem('in'); assert.ok(pin.units.every(u => u.back || u.mem), 'memory in every unit'); assert.ok(pin.trips.length === 0, 'no trip when memory is in the unit');
  assert.ok(mem('flow').mem.length >= 1, 'memory between the units');
  assert.ok(mem('far').trips.length === mem('far').units.length, 'every unit makes the trip to far memory');
});

test('changing the design changes what the die draws; an empty or broken design says so', () => {
  const a = plan(ok('half')), b = plan(ok('alu'));
  assert.notEqual(a.cells.length, b.cells.length);
  const empty = planOf(recordOf(stackOf(), null)), broken = plan({ p: 'half', code: 'nonsense =' });
  assert.ok(empty.empty); assert.equal(empty.broken, 'empty'); assert.equal(broken.broken, 'design');
  assert.ok(empty.targets.gate.w > 0, 'the levels still frame something');
  /* the plan is plain data the line can draw too */
  assert.deepEqual(JSON.parse(JSON.stringify(b)), b);
});
