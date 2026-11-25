// The clock and the power (src/engines/clockpower.js): timing and pipeline registers, the voltage-clock-power curve, the
// five-stage pipeline, and the gate-level clock lab (the first five tests of that part are the first version's tests of
// its gate simulator, tests/seq.test.mjs, with the same checks). Every challenge is a check that a right answer meets
// and an obvious wrong one misses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/engines/clockpower.js';
import { readWords } from '../scripts/words.mjs';

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`);

/* ---- timing ---- */
test('timing: stages add the flip-flop overhead, cuts shorten the slowest stage, a slower corner stretches every gate', () => {
  const sum = C.GATES.reduce((a, b) => a + b, 0);
  assert.equal(sum, 381);
  assert.deepEqual(C.stages([]), [sum + C.OVERHEAD]);
  assert.deepEqual(C.stages([5]), [C.GATES.slice(0, 6).reduce((a, b) => a + b, 0) + 40, C.GATES.slice(6).reduce((a, b) => a + b, 0) + 40]);
  assert.deepEqual(C.stages([11]), C.stages([]), 'a register after the last gate is no register');
  close(C.stages([], 'slow')[0], sum * 1.25 + 40); close(C.stages([], 'fast')[0], sum * 0.85 + 40);
  const t = C.timing(250, [], 'typical');
  assert.equal(t.slowest, 421); assert.equal(t.meets, false); assert.equal(t.slack, -171); assert.equal(t.cycles, 1);
  close(t.fmaxGHz, 1000 / 421); close(t.clockGHz, 4);
  const two = C.timing(250, [3, 7], 'slow'); assert.equal(two.cycles, 3); close(two.latencyNs, 0.75); assert.equal(two.meets, true);
  /* more registers never make the slowest stage longer; every balance is the best of all choices */
  let prev = Infinity;
  for (let n = 0; n <= 4; n++) { const mx = Math.max(...C.stages(C.balance(n))); assert.ok(mx <= prev); prev = mx; assert.equal(C.balance(n).length, n); }
  assert.deepEqual(C.balance(0), []);
  assert.ok(C.PERIOD.start === 250 && C.MAX_CUTS === 6);
});

test('slow corner: one register is enough at the typical corner, two are needed at the slow one', () => {
  assert.deepEqual(C.fewestCuts(250, 'typical'), [5]);
  assert.equal(C.fewestCuts(250, 'slow').length, 2);
  assert.equal(C.fewestCuts(60, 'slow'), null, 'no cuts reach 60 ps: the slowest gate and its flip-flop need 96');
  assert.equal(C.timing(250, C.balance(1), 'slow').meets, false);
  const ch = C.CHALLENGES.slowCorner;
  assert.equal(ch.check({ period: 250, corner: 'slow', cuts: C.balance(2) }), true);
  assert.equal(ch.check({ period: 250, corner: 'slow', cuts: C.balance(1) }), false, 'fails timing');
  assert.equal(ch.check({ period: 250, corner: 'slow', cuts: C.balance(3) }), false, 'more than the fewest');
  assert.equal(ch.check({ period: 250, corner: 'typical', cuts: C.balance(2) }), false, 'wrong corner');
  assert.equal(ch.check({ period: 300, corner: 'slow', cuts: C.balance(2) }), false, 'wrong clock');
});

/* ---- power ---- */
test('power: 51 W at the lab\'s starting point, and power falls faster than speed', () => {
  const p = C.power(0.15, 0.75, 3);
  close(p.dyn, 45); close(p.leak, 6); close(p.total, 51); close(p.energyNJ, 17); assert.equal(p.ok, true); assert.equal(p.status, 'runs');
  close(C.fmax(0.75), 3, 1e-9);
  assert.equal(C.fmax(0.3), 0); assert.equal(C.vmin(0.6), 0.5);
  close(C.vmin(3), 0.75, 1e-9);
  /* the lowest voltage for a clock really reaches that clock, and a hair less does not */
  for (const f of [1, 2, 3, 4]) assert.ok(C.fmax(C.vmin(f)) >= f - 1e-9);
  for (const f of [3, 4]) assert.ok(C.fmax(C.vmin(f) - 0.01) < f);   // (under 0.5 V the floor, not the clock, sets the voltage)
  /* at a fixed voltage, a clock above what it allows fails (and says what it needs) */
  const bad = C.power(0.15, 0.6, 3); assert.equal(bad.ok, false); assert.equal(bad.status, 'fails'); assert.ok(bad.need > 0.6 && bad.need <= 1.1);
  assert.equal(C.power(0.15, 1.1, 5).status, 'beyond');
  /* leakage rises with voltage; running at the lowest safe voltage: power / speed falls as the clock falls */
  assert.ok(C.leak(1.0) > C.leak(0.75) && C.leak(0.75) > C.leak(0.5)); close(C.leak(0.75), 6);
  const fast = C.power(0.15, C.lowestSafe(4), 4), slow = C.power(0.15, C.lowestSafe(2), 2);
  assert.ok(fast.total / slow.total > 2 * 2, 'twice the clock costs more than four times the power');
  assert.ok(fast.energyNJ > slow.energyNJ);
  assert.equal(C.lowestSafe(4), Math.min(1.1, Math.ceil(C.vmin(4) * 100) / 100)); assert.equal(C.lowestSafe(4.5) <= 1.1, true);
  const fr = C.frontier(0.15); assert.ok(fr.length > 100); assert.ok(fr.every((q, i) => i === 0 || q.w >= fr[i - 1].w), 'power rises with the clock along the curve');
  close(fr[fr.length - 1].f, C.fmax(1.1), 0.02);
});

test('half the power: the fastest clock on under half of 51 W is about 2.25 GHz', () => {
  const ch = C.CHALLENGES.halfPower;
  assert.equal(ch.check({ a: 0.15, v: C.lowestSafe(2.25), f: 2.25 }), true);
  assert.equal(ch.check({ a: 0.15, v: C.lowestSafe(2.2), f: 2.2 }), true);
  assert.equal(ch.check({ a: 0.15, v: 0.75, f: 3 }), false, 'the start: 51 W');
  assert.equal(ch.check({ a: 0.15, v: 0.75, f: 2.25 }), false, 'a slower clock at the same voltage still burns more than half');
  assert.equal(ch.check({ a: 0.15, v: C.lowestSafe(1.5), f: 1.5 }), false, 'too slow');
  assert.equal(ch.check({ a: 0.3, v: C.lowestSafe(2.25), f: 2.25 }), false, 'a different activity is another puzzle');
  assert.ok(C.power(0.15, C.lowestSafe(2.25), 2.25).total < 25.5);
  assert.ok(C.power(0.15, C.lowestSafe(2.4), 2.4).total >= 25.5, '2.4 GHz is too fast for the budget');
});

/* ---- pipeline ---- */
test('pipeline: stalls come from loads and from results not yet written; forwarding and reordering remove them', () => {
  const none = C.schedule(), fwd = C.schedule({ forwarding: true }), re = C.schedule({ reorder: true }), both = C.schedule({ forwarding: true, reorder: true });
  assert.deepEqual([none.cycles, none.stalls, none.reasons.length], [18, 8, 5]);
  assert.deepEqual([fwd.cycles, fwd.stalls, fwd.reasons.map(r => r.id)], [11, 1, ['load']]);
  assert.deepEqual([re.cycles, re.stalls], [17, 7]);
  assert.deepEqual([both.cycles, both.stalls, both.reasons.length], [10, 0, 0]);
  assert.equal(both.ideal, 10); assert.equal(both.cpi, 1); close(none.cpi, 14 / 6);
  assert.deepEqual(both.rows.map(r => r.index), C.REORDERED);
  assert.deepEqual(fwd.reasons[0], { id: 'load', ins: 'add', reg: 1, from: 'lw', cycles: 1 });
  for (const s of [none, fwd, re, both]) for (const r of s.rows) { assert.ok(r.IF < r.ID && r.ID < r.EX && r.EX < r.MEM && r.MEM < r.WB); assert.equal(r.WB, r.EX + 2); }
  const ch = C.CHALLENGES.zeroStalls;
  assert.equal(ch.check({ forwarding: true, reorder: true }), true);
  assert.equal(ch.check({ forwarding: true, reorder: false }), false);
  assert.equal(ch.check({ forwarding: false, reorder: true }), false);
});

/* ---- gate simulator (the first version's seq tests) ---- */
test('two NOR gates remember a bit: set, hold, reset, hold', () => {
  const Cc = C.srLatch(), S = C.simulate(Cc, { stim: { S: [[0, 0], [100, 1], [400, 0], [1000, 0]], R: [[0, 0], [700, 1], [1100, 0]] }, tEnd: 1600 });
  assert.equal(S.at('Q', 50), 'x', 'unknown at power-on, before anything sets it');
  assert.equal(S.at('Q', 390), 1, 'set');
  assert.equal(S.at('Q', 690), 1, 'still 1 after S goes back to 0: it remembers');
  assert.equal(S.at('Q', 1090), 0, 'reset');
  assert.equal(S.at('Q', 1600), 0, 'still 0: it remembers');
  assert.equal(S.at('Qn', 690), 0);
});

test('setting and resetting at once, then letting go together, makes the latch oscillate', () => {
  const Cc = C.srLatch(), S = C.simulate(Cc, { stim: { S: [[0, 1], [500, 0]], R: [[0, 1], [500, 0]] }, tEnd: 3000 });
  assert.equal(S.at('Q', 400), 0); assert.equal(S.at('Qn', 400), 0);
  assert.ok(S.waves.Q.filter(([t]) => t > 500).length > 5, 'Q keeps flipping after both are released together');
});

test('a latch follows D while enabled; a flip-flop changes only just after the clock rises', () => {
  const Cc = C.latchAndFlop(), D = C.delays();
  const S = C.simulate(Cc, { stim: { CLK: [[0, 0], [1000, 1], [2000, 0], [3000, 1]], D: [[0, 0], [1400, 1], [2400, 0]] }, init: C.zeroState(Cc), tEnd: 4000 });
  assert.equal(S.at('aq', 1900), 1, 'latch: transparent while the clock is 1'); assert.equal(S.at('flq', 1900), 0, 'flip-flop waits');
  assert.equal(S.at('aq', 2900), 1, 'latch holds while the clock is 0'); assert.equal(S.at('flq', 2900), 0);
  assert.equal(S.at('flq', 3900), 0, 'at the next edge the flip-flop takes D, which is 0 again');
  for (const [t] of S.waves.flq.slice(1)) assert.ok([1000, 3000].some(e => t > e && t < e + 3 * D.NOR + D.AND + D.NOT), 'Q changed at ' + t);
});

test('the counter counts at a safe clock and makes mistakes when the clock outruns its slowest path', () => {
  for (const node of C.COUNTER_NODES) {
    const T = C.gateTiming(4, node);
    const ok = C.runCounter({ node, hz: T.fmaxHz * 0.8, cycles: 20 });
    assert.equal(ok.errors, 0, node + ': no errors at 80% of the predicted top speed: ' + ok.values.join(','));
    assert.deepEqual(ok.values.slice(0, 17), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1]);
    assert.ok(C.runCounter({ node, hz: T.fmaxHz * 1.6, cycles: 20 }).errors > 0, node + ': errors at 160% of the predicted top speed');
  }
  const f = C.COUNTER_NODES.map(n => C.gateTiming(4, n).fmaxHz);
  for (let i = 1; i < f.length; i++) assert.ok(f[i] > f[i - 1], 'a faster process gives a faster counter');
  assert.ok(C.counter(8).gates.length > C.counter(4).gates.length);
});

test('the predicted top speed is close to where the simulated counter starts failing', () => {
  const T = C.gateTiming(4, '130');
  let lo = T.fmaxHz * 0.5, hi = T.fmaxHz * 2;
  for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (C.runCounter({ hz: m, cycles: 34 }).errors) hi = m; else lo = m; }
  const ratio = lo / T.fmaxHz;
  assert.ok(ratio > 0.9 && ratio < 1.6, 'simulated limit / predicted = ' + ratio.toFixed(2));
});

/* ---- the clock lab's three experiments ---- */
test('the speed slider runs from 30% of the predicted top speed to twice it', () => {
  for (const node of C.COUNTER_NODES) { const f = C.gateTiming(4, node).fmaxHz; close(C.hzOfSlider(node, 0) / f, 0.3, 1e-12); close(C.hzOfSlider(node, 100) / f, 2, 1e-12); }
  const at35 = C.hzOfSlider('130', C.COUNTER_START.slider); assert.equal(C.counterStatus('130', at35).status, 'counting');
  assert.equal(C.counterStatus('130', C.hzOfSlider('130', 100)).status, 'errors');
  assert.equal(C.counterStatus('130', C.gateTiming(4, '130').fmaxHz * 0.95).status, 'top');
  assert.ok(['above', 'errors'].includes(C.counterStatus('130', C.gateTiming(4, '130').fmaxHz * 1.2).status));
});

test('the clock challenges: one bit of memory, one slot, different endings, the speed limit', () => {
  /* latch: store a 1 and let go (held), then set and reset together and release them together (oscillates) */
  const good = { S: [[0, 0], [100, 1], [400, 0], [1000, 1], [1500, 0]], R: [[0, 0], [1000, 1], [1500, 0]] };
  assert.equal(C.latchRun(good, 800).state, 'holds1'); assert.equal(C.latchRun(good, 350).state, 'written');
  assert.equal(C.latchRun({ S: [[0, 0]], R: [[0, 0]] }, 500).state, 'unknown');
  assert.equal(C.latchRun(good, 3000).state, 'oscillating');
  assert.equal(C.latchHint(good, 3000), 'oscillate'); assert.equal(C.latchHint({ S: [[0, 0]], R: [[0, 0]] }, 500), 'unknown');
  assert.equal(C.CHALLENGES.latch.check({ hist: good, end: 3000 }), true);
  assert.equal(C.CHALLENGES.latch.check({ hist: { S: [[0, 0], [100, 1], [400, 0]], R: [[0, 0]] }, end: 3000 }), false, 'held but never oscillated');
  assert.equal(C.CHALLENGES.latch.check({ hist: { S: [[0, 0], [1000, 1], [1500, 0]], R: [[0, 0], [1000, 1], [1500, 0]] }, end: 3000 }), false, 'never stored a 1 first');
  /* one slot: D is 1 only in slot 1 (just before the tick at slot 2) */
  const D = n => Array.from({ length: 16 }, (_, k) => +(k === n));
  assert.equal(C.CHALLENGES.oneSlot.check(D(1)), true);
  assert.equal(C.CHALLENGES.oneSlot.check(D(2)), true, 'D rising at the tick itself still gets in: the first version\'s model gives the master latch the same instant');
  assert.equal(C.CHALLENGES.oneSlot.check(D(3)), false, 'a 1 after the tick is missed: the next tick sees 0');
  assert.equal(C.CHALLENGES.oneSlot.check(new Array(16).fill(0)), false);
  assert.equal(C.CHALLENGES.oneSlot.check(D(1).map((v, k) => v || +(k === 5))), false, 'two slots');
  assert.equal(C.flopHint('one', D(1)), 'one-done'); assert.equal(C.flopHint('one', D(3)), 'before'); assert.equal(C.flopHint('one', D(0)), 'before');   // ('late' is never reached in the model: D(2) is caught) assert.equal(C.flopHint('one', new Array(16).fill(0)), 'none');
  /* differ: D rises in the second half of the last cycle's clock-high time: the latch passes it, the flip-flop already took its value */
  assert.equal(C.CHALLENGES.differ.check(D(15)), true);
  assert.equal(C.CHALLENGES.differ.check(new Array(16).fill(0)), false);
  assert.equal(C.FLOP_GOALS.free(D(1)), null);
  const r = C.flopRun(D(15)); assert.ok(r.latchChanges >= 1 && r.flopChanges === 0);
  /* speed limit: top speed at two processes */
  const top = n => ({ node: n, hz: C.gateTiming(4, n).fmaxHz * 0.95 });
  assert.equal(C.CHALLENGES.speedLimit.check([top('130'), top('28')]), true);
  assert.equal(C.CHALLENGES.speedLimit.check([top('130'), top('130')]), false, 'one process twice');
  assert.equal(C.CHALLENGES.speedLimit.check([top('130'), { node: '28', hz: C.gateTiming(4, '28').fmaxHz * 1.8 }]), false, 'one of them broke');
  assert.equal(C.CHALLENGES.speedLimit.check([]), false);
});

test('every challenge has its words, and every hint and stall id has words', () => {
  /* the words: ckp.* in src/i18n/en/labs.json, those the lab does not show yet waiting in src/data/waiting-words.json;
     the two challenges the lab plays have its words (power-curve, counter), the others their own */
  const W = readWords(), LAB = { halfPower: ['power-curve', 'ckp.p.done'], speedLimit: ['counter', 'ckp.c.done'] };
  for (const id of Object.keys(C.CHALLENGES)) { assert.equal(C.CHALLENGES[id].id, id);
    const ks = LAB[id] ? ['game.ch.' + LAB[id][0] + '.t', 'game.ch.' + LAB[id][0] + '.goal', LAB[id][1]] : ['t', 'goal', 'done'].map(p => `ckp.ch.${id}.${p}`);
    for (const k of ks) assert.ok(W[k], k); }
  for (const k of Object.keys(C.CORNERS)) assert.ok(W['ckp.corner.' + k]);
  for (const k of ['load', 'forward', 'nofwd']) assert.ok(W['ckp.stall.' + k]);
  for (const k of ['oscillate', 'both', 'setting', 'resetting', 'unknown', 'memory', 'holds1', 'holds0']) assert.ok(W['ckp.hint.latch.' + k], k);
  for (const k of ['none', 'many', 'one-done', 'late', 'before', 'differ-done', 'differ', 'free']) assert.ok(W['ckp.hint.flop.' + k], k);
  for (const k of ['errors', 'top', 'above', 'counting']) assert.ok(W['ckp.c.say.' + k], k);
  /* a goal of the flip-flop's says why in its own words, or in its challenge's when they are the same */
  for (const k of Object.keys(C.FLOP_GOALS)) assert.ok(W['ckp.goal.' + k] && (W['ckp.goal.' + k + '.why'] || W['ckp.ch.' + k + '.goal']), k);
  for (const k of ['runs', 'fails', 'beyond']) assert.ok(W['ckp.power.' + k]);
});
