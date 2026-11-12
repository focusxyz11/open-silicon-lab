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
  assert.deepEqual(normal({ clock: 7, gen: 99, size: -3, load: 9, reuse: 99, mem: -1 }), { clock: START.clock, gen: GENS - 1, size: 0, load: START.load + 2, reuse: 5, mem: 0 });
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
    assert.ok(SETTINGS.includes(k) || k === 'build' || k === 'loop', key + ': unknown setting ' + k);
    assert.ok(EN['chip.' + k + '.label'] && EN['chip.' + k + '.notice'], k + ' has no words');
    if (k !== 'build' && k !== 'loop') assert.ok(Object.values(SHOWS).some(ks => ks.includes(k)), k + ' shows nowhere');
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

test('every challenge can be met, none by one setting alone, and each is shown at stops with a try', async () => {
  const { CHALLENGES, START, SETTINGS, VALUES, model } = await import('../src/engines/chip.js');
  /* every chip there can be: each setting's every value, for the settings a challenge could need */
  let all = [{}]; for (const k of SETTINGS) all = all.flatMap(s => VALUES[k].map(v => Object.assign({}, s, { [k]: v })));
  const M = new Map(), mm = s => { const key = JSON.stringify(s); if (!M.has(key)) M.set(key, model(s)); return M.get(key); };
  for (const c of CHALLENGES) {
    assert.ok(EN['chal.' + c.id + '.goal'] && EN['chal.' + c.id + '.hint'], c.id + ' has no words');
    assert.ok(all.some(s => c.met(mm(s))), c.id + ' can never be met');
    assert.equal(c.met(model(START)), false, c.id + ' is met by the starting chip');
    for (const k of SETTINGS) {
      const one = VALUES[k].map(v => Object.assign({}, START, { [k]: v }));
      if (c.needs.length > 1 && c.needs.includes(k)) assert.ok(!one.some(s => c.met(mm(s))), c.id + ' can be met by ' + k + ' alone');
    }
    for (const key of c.at) assert.ok(TRIES[key], c.id + ': ' + key + ' has no try');
  }
});

test('the fab you run: fuller is cheaper but slower, the scanners set the pace, and the time matches the industry', async () => {
  const { LOADS, model, START } = await import('../src/engines/chip.js');
  let lastDays = 0, lastCost = Infinity;
  for (let load = 0; load < LOADS.length; load++) {
    const m = model(Object.assign({}, START, { load }));
    assert.ok(m.days > lastDays, 'a fuller fab should be slower');
    assert.ok(m.cost < lastCost, 'and each wafer cheaper');
    assert.equal(m.slow, 'print', 'the scanners are the busiest');
    if (load >= START.load) assert.ok(m.fab.print.wait >= Math.max(...Object.values(m.fab).map(f => f.wait)) - 1e-9, 'and, once the fab is busy, the longest wait');
    lastDays = m.days; lastCost = m.cost;
  }
  const s = model(START);
  assert.ok(s.perLayer >= 1 && s.perLayer <= 1.5, 'about 1 to 1.5 days a layer at 85% (fact fab-cycle-time): ' + s.perLayer);
});


test('the memory wall: faster cores only wait faster, unless memory keeps up; moving data costs more energy than computing', async () => {
  const { model, START, REUSES, MEMS } = await import('../src/engines/chip.js');
  const s = model(START);
  assert.equal(s.busy, 1); assert.ok(Math.abs(s.work - 1) < 1e-9, 'the starting chip is exactly fed');
  const fast = model(Object.assign({}, START, { clock: 3 }));
  assert.ok(fast.peak > 2.9 && fast.work < 1.01 && fast.busy < 0.34, 'three times the clock, the same work: the cores wait');
  assert.ok(model(Object.assign({}, START, { clock: 3, reuse: START.reuse + 1 })).work > 2.9, 'reuse feeds them');
  assert.ok(model(Object.assign({}, START, { clock: 3, mem: 1 })).work > 2.9, 'and so does memory beside the chip');
  assert.ok(s.moving > 0.9, 'fetching from memory chips takes most of the energy');
  let last = 1; for (let r = 0; r < REUSES.length; r++) { const m = model(Object.assign({}, START, { reuse: r })); assert.ok(m.moving < last); last = m.moving; }
  assert.ok(model(Object.assign({}, START, { reuse: REUSES.length - 1, mem: MEMS.length - 1 })).moving < 0.5, 'only reuse and close memory together bring it below half');
});
