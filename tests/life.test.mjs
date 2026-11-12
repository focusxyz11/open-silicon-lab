/* Your chip's life (src/engines/life.js): a perfect design fails everywhere, every place can be met, and the
   design and the factory both matter. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { live, MISSIONS, MISSION_IDS, LIVES_AT, MARGINS, PROTECT, PERFECT, CAUSES, normalLife, Phi } from '../src/engines/life.js';
import { WORLDS } from '../src/data/weave.js';

const every = () => { const out = []; for (let margin = 0; margin < MARGINS.length; margin++) for (const grid of [false, true]) for (const hot of [false, true]) for (const burn of [false, true]) for (const protect of PROTECT) out.push({ margin, grid, hot, burn, protect }); return out; };

test('the normal curve is right in the middle and in the tails', () => {
  assert.ok(Math.abs(Phi(0) - 0.5) < 1e-12);
  assert.ok(Math.abs(Phi(1.96) - 0.975) < 1e-4);
  assert.ok(Math.abs(Phi(-6) - 9.87e-10) < 1e-11);
});

test('the perfect design, signed off at typical, fails in every place', () => {
  for (const m of MISSION_IDS) {
    const L = live(m, PERFECT, { coverage: 1 });
    assert.equal(L.pass, false, m);
    assert.equal(L.hint, 'typical', m);
    assert.ok(Math.abs(L.yTiming - 0.5) < 0.01, m + ': half the chips are slower than typical');
  }
});

test('every place can be met, and each asks for something different', () => {
  const wins = {};
  for (const m of MISSION_IDS) { wins[m] = every().filter(c => live(m, c, { coverage: 1 }).pass); assert.ok(wins[m].length, m + ' can ship'); }
  assert.ok(wins.phone.every(c => c.protect !== 'logic'), 'a phone cannot pay for a second copy of its logic');
  assert.ok(wins.car.every(c => c.protect === 'logic' && c.burn && c.hot), 'a car needs everything');
  assert.ok(!wins.phone.some(w => wins.car.some(c => JSON.stringify(c) === JSON.stringify(w))), 'what ships in a phone does not ship in a car');
});

test('the design matters: test patterns that miss faults let broken chips through', () => {
  const best = every().find(c => live('car', c, { coverage: 1 }).pass);
  const full = live('car', best, { coverage: 1 }), weak = live('car', best, { coverage: 0.97 });
  assert.ok(weak.at.escape > full.at.escape * 10);
  assert.equal(weak.pass, false);
});

test('each choice does what it should, and costs something', () => {
  for (const m of MISSION_IDS) {
    const a = live(m, { margin: 2 }), b = live(m, { margin: 4 });
    assert.ok(b.at.timing <= a.at.timing && b.perf < a.perf, m + ': margin trades speed for timing');
    assert.ok(live(m, { margin: 4, grid: true }).at.timing <= b.at.timing, m + ': a stronger grid helps');
    assert.ok(live(m, { margin: 4, burn: true }).at.weak < b.at.weak && live(m, { margin: 4, burn: true }).cost > b.cost, m + ': burn-in screens weak chips, at a cost');
    const n = live(m, { protect: 'none' }), e = live(m, { protect: 'memory' }), l = live(m, { protect: 'logic' });
    assert.ok(e.silent < n.silent && l.silent < e.silent && l.area > e.area && e.area > n.area, m + ': protection');
  }
});

test('failures only grow with the years', () => {
  for (const m of MISSION_IDS) {
    const L = live(m, { margin: 3, grid: true, hot: true });
    for (const c of CAUSES.concat('total')) {
      const f = c === 'total' ? L.total : L.curve[c];
      for (let i = 1; i <= 20; i++) assert.ok(f(L.life * i / 20) >= f(L.life * (i - 1) / 20) - 1e-15, m + ' ' + c);
    }
  }
});

test('choices are kept within range, and every place is met in its own dive', () => {
  assert.deepEqual(normalLife({ margin: 99, protect: 'gold', hot: 1 }), { margin: MARGINS.length - 1, grid: false, hot: true, burn: false, protect: 'none' });
  for (const [depth, m] of Object.entries(LIVES_AT)) {
    assert.ok(MISSIONS[m]);
    assert.ok(WORLDS.find(w => w.id === m).depths.includes(depth), depth + ' is in ' + m);
  }
  assert.deepEqual(Object.values(LIVES_AT).sort(), MISSION_IDS.slice().sort());
});
