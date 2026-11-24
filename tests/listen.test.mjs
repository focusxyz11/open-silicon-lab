// Listen (#316): the block slowed a billion times until it can be heard, and the ear test. Every voice's input comes
// from an engine call (src/engines/listen.js), never a number of its own; every level that shows the switch says how
// much it is slowed (TIME_SCALE in src/data/atlas.js); the four states sound different in what an ear can tell; the
// ear test is won by eight right of the last ten; and the challenge is filed, wired and behind its flag.
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as L from '../src/engines/listen.js';
import { TIME_SCALE, sizeOf } from '../src/data/atlas.js';
import { kitchen } from '../src/engines/bits.js';
import { budget, JOB } from '../src/engines/budget.js';
import { power, lowestSafe } from '../src/engines/clockpower.js';
import { cleanOne } from '../src/engines/lens.js';
import { copies, PLAN as GUARD } from '../src/engines/errors.js';
import { factsOf } from '../src/data/partfacts.js';
import { CHALLENGES, OPENS, GROWTH, flagged } from '../src/v2/game.js';
import { LABS, kindsOf } from '../src/data/labs/index.js';
import { FILED } from '../src/data/frame.js';

test('every level that shows the Listen switch says how much it is slowed', () => {
  assert.ok(L.LEVELS.length);
  for (const lv of L.LEVELS) {
    assert.ok(TIME_SCALE[lv] > 0, lv + ' sounds but TIME_SCALE has no line for it');
    assert.ok(sizeOf(lv), lv + ' is a level with a size');
  }
  /* one second of sound is one nanosecond of the block: a 3 GHz clock ticks three times a second */
  assert.equal(TIME_SCALE.block, 1e-9);
  assert.equal(L.voices('busy').clock.perSecond, 3);
});

test('every voice\'s input comes from an engine call', () => {
  const K = kitchen(L.KITCHEN, {}), B = budget(), wires = factsOf('block').parts.filter(p => p.kind === 'wire').reduce((n, p) => n + p.paths.length, 0);
  const ref = power(L.STATE.busy.a, lowestSafe(L.STATE.busy.f), L.STATE.busy.f).total;
  for (const s of L.STATES) {
    const V = L.voices(s), S = L.STATE[s], R = K.rounds[S.round];
    /* the clock: the power curve's clock, slowed by the level's scale */
    assert.equal(V.clock.perSecond, S.f * 1e9 * TIME_SCALE.block, s + ': the clock');
    /* a fetch and the wait: the kitchen's trip to its memory, how busy its door is, the share of time waiting */
    assert.equal(V.fetch.wait, R.wait, s + ': the wait');
    assert.equal(V.fetch.seconds, K.pantry.s / TIME_SCALE.block, s + ': the trip');
    assert.equal(V.fetch.cycle, K.pantry.s / (R.tFetch / R.t) / TIME_SCALE.block, s + ': how often the door opens');
    assert.equal(V.fetch.stop, R.wait * V.fetch.cycle, s + ': how long the work stops');
    /* loudness by energy: a sum from the energy budget, a fetch from the kitchen's trip, the gain by the stated scale */
    assert.equal(V.sum.joules, (B.levels.gate.compute + B.levels.atom.compute) / JOB.ops, s + ': a sum\'s energy');
    assert.equal(V.fetch.joules, K.pantry.j * L.WORD, s + ': a fetch\'s energy');
    assert.ok(Math.abs(V.fetch.gain / V.sum.gain - Math.sqrt(V.fetch.joules / V.sum.joules)) < 1e-9, s + ': ten times the energy, ten times the sound power');
    /* heat: the power curve at the activity left when the work waits, the hum's pitch by the temperature it brings */
    const P = power(S.a * (1 - R.wait), lowestSafe(S.f), S.f);
    assert.equal(V.hum.watts, P.total, s + ': the hum\'s power');
    assert.ok(Math.abs(V.hum.gain / L.SOUND.hum.ref - Math.sqrt(P.total / ref)) < 1e-9, s + ': the hum\'s loudness by its power');
    assert.equal(V.hum.celsius, L.ROOM_C + L.THETA * P.total, s + ': the temperature');
    /* noise and wrong bits: the chain of making a clean 1 at that temperature, and nothing at the block to catch them */
    const C = cleanOne(undefined, V.hum.celsius, 1);
    assert.equal(V.hiss.noise, C.measures.noise, s + ': the hiss');
    assert.equal(V.wrong.perWire, copies(GUARD.logic, C.measures.misread).silent, s + ': the wrong bits');
    assert.equal(V.wrong.wires, wires, s + ': one bit a tick on each of the block\'s wires');
  }
  assert.equal(L.voices('busy', 'gate'), null, 'a level that does not sound has no voices');
  assert.equal(L.voices('nothing'), null);
});

test('the four states sound different in what an ear can tell', () => {
  const V = Object.fromEntries(L.STATES.map(s => [s, L.voices(s)]));
  const sums = s => { const S = L.score(s, 30, 5); return S.events.filter(e => e.v === 'sum').length / S.events.filter(e => e.v === 'tick').length; };
  const wrongs = s => L.score(s, 30, 5).events.filter(e => e.v === 'wrong').length;
  /* busy and healthy: a sum every tick, fetches hidden behind the work, no wrong bit */
  assert.ok(sums('busy') > 0.95 && V.busy.fetch.stop === 0 && wrongs('busy') === 0);
  /* waiting on memory: the work stops most of the time */
  assert.ok(V.wait.fetch.wait > 0.5 && sums('wait') < 0.5, 'waiting is heard as gaps in the work');
  /* too hot: louder and higher hum, more hiss, and wrong bits */
  assert.ok(V.hot.hum.gain > V.busy.hum.gain && V.hot.hum.hz > V.busy.hum.hz + 50 && V.hot.hiss.gain > 2 * V.busy.hiss.gain);
  assert.ok(wrongs('hot') >= 10, 'too hot is heard as clicks');
  /* saving power: half the ticks, a lower and quieter hum */
  assert.equal(V.saving.clock.perSecond, V.busy.clock.perSecond / 2);
  assert.ok(V.saving.hum.gain < V.busy.hum.gain && V.saving.hum.hz < V.busy.hum.hz);
  /* a fetch costs many sums, so its thump is louder than a blip, by the stated scale */
  assert.ok(V.busy.fetch.times > 10 && V.busy.fetch.gain > V.busy.sum.gain);
  /* a clip always holds a fetch early, so a short clip of waiting is heard as waiting */
  for (let seed = 1; seed < 20; seed++) assert.ok(L.score('wait', 6, seed).events.find(e => e.v === 'fetch').t < 1);
  /* the score is the same for the same seed, in time order, and only its places move with the seed */
  assert.deepEqual(L.score('hot', 8, 3), L.score('hot', 8, 3));
  const ev = L.score('busy', 8, 2).events; assert.ok(ev.every((e, i) => !i || ev[i - 1].t <= e.t));
});

test('the ear test: one state at a time, never three alike in a row, won by eight right of the last ten', () => {
  const H = [];
  for (let i = 0; i < 200; i++) { const s = L.pick(11, H); assert.ok(L.STATES.includes(s)); if (H.length >= 2) assert.ok(!(H[H.length - 1] === s && H[H.length - 2] === s)); H.push(s); }
  for (const s of L.STATES) assert.ok(H.includes(s), s + ' is asked for');
  assert.equal(L.earWon([true, true, true, true, true, true, true]), false);
  assert.equal(L.earWon([false, false, true, true, true, true, true, true, true, true]), true);
  assert.equal(L.earWon([true, true, true, false, false, false, true, true, true, true, true, true]), false);
  assert.equal(L.rightOfLast([false, true, true]), 2);
});

test('the ear test is a challenge at the block, filed under Digital meets physical with Efficiency, for everyone', () => {
  const c = CHALLENGES.find(x => x.id === 'ear');
  assert.ok(c, 'the ear test is a challenge');
  assert.equal(c.place, 'datacentre'); assert.equal(c.at, 'block'); assert.equal(c.kind, 'listen'); assert.equal(c.flag, undefined, 'no flag since #317');
  assert.ok(OPENS.ear, 'it opens a question at the block');
  assert.ok(GROWTH.some(g => g.by === 'ear'), 'it grows the island');
  assert.deepEqual(FILED.challenges.ear, ['dig', 'eff']);
  /* it shows in a browser without any flag; a challenge that has one still waits for it in the address */
  assert.equal(flagged(c, ''), true); assert.equal(flagged(c, '?menu=1'), true);
  const f = { id: 'x', flag: 'listen' };
  assert.equal(flagged(f, ''), false); assert.equal(flagged(f, '?listen=1'), true); assert.equal(flagged(f, '?menu=1&listen=1'), true); assert.equal(flagged({ id: 'x' }, ''), true);
  const src = readFileSync(new URL('../src/data/labs/index.js', import.meta.url), 'utf8');
  assert.match(src, /listen\b/, 'the lab is registered, and plays its kind');
  assert.ok(LABS.some(l => l.name === 'listen' && kindsOf(l).includes('listen')), 'the lab is registered, and plays its kind');
});
