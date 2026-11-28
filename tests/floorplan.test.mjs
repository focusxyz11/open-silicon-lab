/* The floorplan and its heat (#507, src/engines/floorplan.js): the recipe lays out the units and the memory, and
   packing close shortens the trips while the hot spot climbs. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as F from '../src/engines/floorplan.js';
import * as A from '../src/engines/arch.js';
import { recordOf } from '../src/engines/chiprecord.js';
import { stackOf } from '../src/engines/path.js';
import { FIDS, ENGINES } from '../src/data/fidelity.js';

const at = (shape, where, ui = 1) => { const fp = F.floorplanOf(Object.assign({}, A.TODAY, { shape, where }), { ui }); return { fp, H: F.heatOf(fp) }; };

test('today\'s computer is the measure: its hot spot at the reference, its memory far', () => {
  const { fp, H } = at('few', 'far');
  assert.equal(fp.n, 4); assert.equal(fp.units.length, 4);
  assert.ok(Math.abs(H.hottest - F.T_REF) < 1e-9);
  assert.equal(H.grid.length, F.GRID * F.GRID);
  assert.ok(Math.abs(Math.max(...H.grid) - F.GRID_REF) < 1e-9 && Math.min(...H.grid) >= 0, 'the grid is each cell against today\'s hot spot');
  assert.ok(Math.max(...at('stack', 'far', 2).H.grid) > 1, 'a hotter arrangement reads hotter on the same scale');
  for (const k of ['hottest', 'trip']) { assert.ok(FIDS.includes(H.fid[k].f)); assert.ok(ENGINES[H.fid[k].by], k + ': its engine'); }
});

test('packing close shortens the trips, and piling up layers heats the hot spot', () => {
  /* memory nearer, trips shorter: far, then near, then inside every unit */
  const far = at('grid', 'far').H.trip, near = at('grid', 'near').H.trip, inn = at('grid', 'in').H.trip;
  assert.ok(far > near && near > inn, 'trips: far ' + far + ', near ' + near + ', in ' + inn);
  /* memory on the chip adds its heat where it sits; off the chip it takes it away */
  assert.ok(at('few', 'near').H.hottest > at('few', 'far').H.hottest);
  /* layers stacked on one footprint pile their power: the more layers, the hotter */
  const s = [0, 1, 2].map(ui => at('stack', 'far', ui).H.hottest);
  assert.ok(s[0] < s[1] && s[1] < s[2], 'stack: ' + s.map(Math.round).join(' < '));
  assert.ok(s[1] > at('grid', 'far').H.hottest + 20, 'two layers are much hotter than a flat grid');
  /* the same budget spread thin over many small units runs no hotter than today */
  assert.ok(at('swarm', 'far', 2).H.hottest < F.T_REF + 5);
});

test('every arrangement lays out on the die, with its memory where it computes', () => {
  for (const shape of Object.keys(A.CARRY.shape)) for (const where of Object.keys(A.CARRY.where)) for (const ui of [0, 1, 2]) {
    const { fp, H } = at(shape, where, ui);
    for (const u of fp.units) assert.ok(u.x >= 0 && u.y >= 0 && u.x + u.w <= F.DIE && u.y + u.h <= F.DIE, shape + ' ' + where + ': a unit off the die');
    assert.ok(Number.isFinite(H.hottest) && H.hottest > F.T_AIR && Number.isFinite(H.trip) && H.trip >= 0, shape + ' ' + where);
    if (where === 'far') assert.ok(fp.mem.every(m => m.x >= F.DIE), 'far memory is off the chip');
    else assert.ok(fp.mem.length && fp.mem.every(m => m.x < F.DIE), where + ' memory is on the chip');
  }
});

test('the record carries the floorplan and its heat, and a gene changes them', () => {
  const a = recordOf(stackOf(), null), b = recordOf(stackOf(Object.assign({}, A.TODAY, { shape: 'stack' }), { ui: 2 }), null);
  assert.deepEqual(a.designed.floorplan, F.floorplanOf(A.TODAY, a.designed.fine));
  assert.deepEqual(a.designed.heat, F.heatOf(a.designed.floorplan));
  assert.ok(b.designed.heat.hottest > a.designed.heat.hottest, 'stacking heats the die in the record');
  assert.ok(a.designed.fid.hottest && a.designed.fid.trip);
});
