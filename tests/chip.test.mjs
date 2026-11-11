// Your chip: a small model for intuition. These tests hold its story together: the starting chip is the
// baseline, a faster clock costs power and eventually time, smaller switches are faster but leak more,
// and every place that changes or shows a setting exists and has its words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CLOCKS, GENS, SIDES, START, SETTINGS, normal, changed, model, dies, dieSquare, WAFER } from '../src/engines/chip.js';
import { DEPTHS, STOPS, TRIES, SHOWS } from '../src/data/weave.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));

test('the starting chip is the baseline: power 1, every signal on time', () => {
  const m = model(START);
  assert.ok(Math.abs(m.power - 1) < 1e-9);
  assert.equal(m.late, 0);
  assert.equal(changed(START), false);
  assert.deepEqual(normal({ clock: 7, gen: 99, size: -3 }), { clock: START.clock, gen: GENS - 1, size: 0 });
  assert.deepEqual(normal(undefined), START);
});

test('a faster clock always costs more power, and past some speed signals arrive late', () => {
  for (let g = 0; g < GENS; g++) {
    let last = 0, lastLate = -1;
    for (const clock of CLOCKS) {
      const m = model({ clock, gen: g });
      assert.ok(m.power > last, 'power did not grow at gen ' + g);
      assert.ok(m.late >= lastLate);
      last = m.power; lastLate = m.late;
    }
    assert.ok(model({ clock: CLOCKS[CLOCKS.length - 1], gen: g }).late > 0, 'the fastest clock never fails at gen ' + g);
    assert.equal(model({ clock: CLOCKS[0], gen: g }).late, 0, 'the slowest clock fails at gen ' + g);
  }
});

test('smaller switches are faster and more fit, but leak more', () => {
  for (let g = 1; g < GENS; g++) {
    const a = model({ clock: 1, gen: g - 1 }), b = model({ clock: 1, gen: g });
    assert.ok(b.path < a.path && b.density > a.density && b.wall > a.wall && b.leakShare > a.leakShare);
    assert.ok(b.grid[0] * b.grid[1] > a.grid[0] * a.grid[1]);
  }
  assert.equal(model(START).grid[0] * model(START).grid[1], 12, 'the words say the starting chip has 12 cores');
});

test('every "Try it" sits at a real stop and changes a real setting; every depth that shows your chip has its words', () => {
  for (const [key, k] of Object.entries(TRIES)) {
    assert.ok(STOPS[key], key + ' is not a stop');
    assert.ok(SETTINGS.includes(k) || k === 'build', key + ': unknown setting ' + k);
    assert.ok(EN['chip.' + k + '.label'] && EN['chip.' + k + '.notice'], k + ' has no words');
    if (k !== 'build') assert.ok(Object.values(SHOWS).some(ks => ks.includes(k)), k + ' shows nowhere');
  }
  assert.equal(EN['chip.gen.names'].length, GENS);
  for (const [id, ks] of Object.entries(SHOWS)) {
    assert.ok(DEPTHS[id], id + ' is not a depth');
    assert.ok(EN['chip.show.' + id], id + ' has no words for your chip');
    ks.forEach(k => assert.ok(SETTINGS.includes(k)));
  }
});

test('on the wafer, a bigger chip fits fewer times, comes out good less often and costs more', () => {
  let last = null;
  for (let size = 0; size < SIDES.length; size++) {
    const m = model({ clock: 1, gen: START.gen, size });
    assert.ok(m.dies > 0 && m.good <= m.dies);
    if (last) assert.ok(m.dies < last.dies && m.yield < last.yield && m.cost > last.cost && m.cores >= last.cores && m.power > last.power, 'size ' + size);
    last = m;
  }
  /* every chip lies wholly on the disc, and the one the dive follows is in the middle */
  for (let size = 0; size < SIDES.length; size++) {
    const sq = dieSquare(size);
    assert.ok(dies(size).some(d => Math.abs(d[0] - sq[0]) < 1e-9 && Math.abs(d[1] - sq[1]) < 1e-9 && Math.abs(d[2] - sq[2]) < 1e-9));
    for (const d of dies(size)) assert.ok(Math.hypot(d[0] - 500, d[1] - 500) <= WAFER.R && Math.hypot(d[0] + d[2] - 500, d[1] + d[3] - 500) <= WAFER.R);
  }
  assert.ok(model({ clock: 1, gen: 4, size: 2 }).steps > model(START).steps, 'finer switches take more steps');
  assert.ok(Math.abs(model(START).cost - 1) < 1e-9);
});
