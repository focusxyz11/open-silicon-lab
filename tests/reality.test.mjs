// Why perfect designs fail: the reliability model behaves like the physics it stands for, the
// perfect design fails everywhere, every mission can be shipped, and the case files are sound.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, insight, Phi, dVt, MISSIONS, MISSION_IDS, PERFECT } from '../src/engines/reality.js';
import { GAPS, CASES } from '../src/data/reality-cases.js';
import { TOPICS } from '../src/data/topics.js';
import facts from '../src/data/facts.json' with { type: 'json' };

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, a + ' ≈ ' + b);

test('the normal curve is accurate far into the tail (parts per million matter)', () => {
  near(Phi(0), 0.5, 1e-12); near(Phi(-1), 0.158655253931457, 1e-10); near(Phi(-3), 0.00134989803163, 1e-12);
  near(Phi(-4.753424), 1e-6, 2e-9); near(1 - Phi(6), 9.8659e-10, 1e-12); assert.equal(Phi(-Infinity), 0);
});

test('physics directions: aging grows with time, heat and voltage', () => {
  assert.equal(dVt(0, 85, 0.75), 0);
  assert.ok(dVt(10, 85, 0.75) > dVt(1, 85, 0.75));
  assert.ok(dVt(5, 105, 0.75) > dVt(5, 45, 0.75));
  assert.ok(dVt(5, 85, 0.8) > dVt(5, 85, 0.75));
});

test('the perfect design passes its own sign-off but fails in every mission', () => {
  for (const m of MISSION_IDS) {
    const r = evaluate(m, PERFECT);
    near(r.yTiming, 0.5, 1e-9);   // with no margin, half the chips are slower than the one it was checked on
    assert.equal(r.pass, false, m);
    assert.ok(r.at.total > 0.5, m + ': most chips fail in service');
    assert.equal(r.top, 'timing');
  }
});

test('each fix moves the right thing', () => {
  const base = { ...PERFECT, margin: 0.15 };
  const r0 = evaluate('dc', base);
  assert.ok(evaluate('dc', { ...base, margin: 0.25 }).at.timing < r0.at.timing, 'more margin, fewer timing failures');
  assert.ok(evaluate('dc', { ...base, margin: 0.25 }).perf < r0.perf, 'more margin costs speed');
  assert.ok(evaluate('dc', { ...base, grid: true }).at.timing < r0.at.timing, 'smaller supply dips help');
  assert.ok(evaluate('dc', { ...base, avs: true }).at.timing < r0.at.timing, 'adaptive voltage helps');
  assert.ok(evaluate('dc', { ...base, cool: true }).at.timing < r0.at.timing, 'cooler chips age slower and run faster');
  assert.ok(evaluate('dc', { ...base, test: 'thorough' }).at.esc < r0.at.esc, 'a better test lets fewer defects escape');
  assert.ok(evaluate('dc', { ...base, burn: true }).at.lat < r0.at.lat / 5, 'burn-in removes most weak chips');
  assert.ok(evaluate('dc', { ...base, ecc: true }).silent < r0.silent / 10, 'ECC fixes most memory upsets');
  assert.ok(evaluate('dc', { ...base, logic: 'tmr' }).silent < evaluate('dc', { ...base, logic: 'lockstep' }).silent, 'triple redundancy corrects, lockstep only detects');
  assert.ok(evaluate('dc', { ...base, logic: 'lockstep' }).detected > 0, 'lockstep turns silent errors into safe restarts');
  assert.ok(evaluate('dc', { ...base, ecc: true, logic: 'tmr' }).area > r0.area, 'protection costs area');
  assert.ok(evaluate('dc', { ...base, vboost: 0.1 }).power > r0.power, 'more voltage costs power');
  /* A strict test with no margin throws most chips away: the cost explodes. */
  assert.ok(evaluate('car', { ...PERFECT, test: 'zero' }).cost > 10);
});

test('radiation scales with memory, fleet and altitude', () => {
  const s = { ...PERFECT };
  const sat = evaluate('sat', s), car = evaluate('car', s);
  assert.ok(sat.upsets / MISSIONS.sat.fleet > car.upsets / MISSIONS.car.fleet * 100, 'a satellite chip is hit far more often than a car chip');
});

test('every mission can be shipped, and its insight says so', () => {
  const paths = {
    phone: { margin: 0.15, avs: true },
    car: { margin: 0.3, grid: true, test: 'zero', burn: true, ecc: true, logic: 'lockstep' },
    dc: { margin: 0.15, avs: true, grid: true, ecc: true, logic: 'lockstep' },
    sat: { margin: 0.25, ecc: true, logic: 'tmr' }
  };
  for (const m of MISSION_IDS) {
    const r = evaluate(m, { ...PERFECT, ...paths[m] });
    assert.ok(r.pass, m + ': ' + r.req.filter(x => !x.ok).map(x => x.id + '=' + x.have).join(', '));
    assert.ok(insight(r).ok, m);
  }
  /* And the hard ones are hard: a phone-style fix is not enough for a car or a satellite. */
  assert.equal(evaluate('car', { ...PERFECT, ...paths.phone }).pass, false);
  assert.equal(evaluate('sat', { ...PERFECT, ...paths.phone }).pass, false);
});

test('insights point at the biggest problem', () => {
  assert.match(insight(evaluate('phone', PERFECT)).t, /margin|adaptive/i);
  assert.match(insight(evaluate('dc', { ...PERFECT, margin: 0.15, avs: true, grid: true })).t, /ECC|bits/);
});

test('case files are complete, sourced and connected', () => {
  const gaps = new Set(GAPS.map(g => g.id)), topics = new Set(TOPICS.map(t => t.id)), ids = new Set(facts.facts.map(f => f.id));
  assert.equal(new Set(CASES.map(c => c.id)).size, CASES.length);
  for (const c of CASES) {
    assert.ok(gaps.has(c.gap), c.id + ' gap');
    assert.ok(topics.has(c.topic), c.id + ' topic');
    assert.match(c.url, /^https:\/\//, c.id + ' source');
    c.facts.forEach(f => assert.ok(ids.has(f), c.id + ' cites missing fact ' + f));
    for (const k of ['what', 'why', 'after']) assert.ok(c[k].length > 60, c.id + ' ' + k);
  }
  for (let i = 1; i < CASES.length; i++) assert.ok(CASES[i].year >= CASES[i - 1].year, 'cases in year order');
  /* Every kind of gap is used at least once, so the puzzle has no dead options. */
  GAPS.forEach(g => assert.ok(CASES.some(c => c.gap === g.id), g.id + ' is used'));
});
