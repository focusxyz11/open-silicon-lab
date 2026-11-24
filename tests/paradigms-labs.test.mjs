// The labs of two more new ways to compute, spiking neurons and light (#322: src/v2/labs/spikes.js, light.js): what they
// draw is what the engine computes, their goals are the engine's own checks, and the matter each models leads to it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/engines/paradigms.js';
import * as K from '../src/v2/labs/spikes.js';
import * as Li from '../src/v2/labs/light.js';
import { MATTERS } from '../src/data/inventions.js';
import { LAB_CHALLENGES } from '../src/data/labs/index.js';

test('spikes: the work is counted from the engine\'s neuron, and a clocked circuit does every input on every tick', () => {
  for (const s of [{ threshold: 1, leak: 0.2 }, { threshold: 0.6, leak: 0.1 }, { threshold: 1.5, leak: 0.3 }]) {
    const W = P.spikeWork(s);
    assert.deepEqual(W.map(x => x.p), P.SPIKE_PATTERNS);
    for (const x of W) {
      const trains = P.spikeTrains(x.p), ins = trains.flat().reduce((a, b) => a + b, 0);
      assert.equal(x.dense, 4 * 40, x.p + ': four inputs, forty ticks');
      assert.equal(x.events, ins + x.fired, x.p + ': one event per spike in and per spike out');
      assert.equal(x.fired, P.lif(trains, P.SNN_W, s).counts[0], x.p + ': detector A fires as in the two-neuron run');
    }
    const by = Object.fromEntries(W.map(x => [x.p, x]));
    assert.ok(by.quiet.share < 0.05 && by.A.share > 0.25, 'quiet costs almost nothing; its own busy pattern does not');
  }
});

test('spikes: the charge drawn fires exactly where the engine\'s neuron fires', () => {
  for (const o of [K.START, { th: 1, lk: 0.5 }, { th: 1.8, lk: 0 }, { th: 0.4, lk: 0.8 }]) for (const p of P.SPIKE_PATTERNS) {
    const e = P.lif(P.spikeTrains(p), [K.W], { threshold: o.th, leak: o.lk });
    assert.deepEqual(K.trace(P.spikeTrains(p), o).fired, e.S[0], p + ' at ' + o.th + ', ' + o.lk);
  }
});

test('spikes: the start fires on everything, the smoke test\'s dials win, and the guess and the catch are the engine\'s', () => {
  const s = K.verdict(K.START); assert.equal(s.met, false); assert.equal(s.say, 'eager');
  assert.equal(K.verdict({ th: 2, lk: 0.8 }).say, 'deaf');
  const w = K.verdict({ th: 1, lk: 0.5 }); assert.equal(w.met, true); assert.equal(w.say, 'met');
  assert.equal(P.checkNeuroSpot({ threshold: 1, leak: 0.5 }), true);
  /* the dials' every setting is on their steps, and some settings win */
  let wins = 0; for (let th = K.RANGE.th[0]; th <= K.RANGE.th[1] + 1e-9; th += K.RANGE.th[2]) for (let lk = K.RANGE.lk[0]; lk <= K.RANGE.lk[1] + 1e-9; lk += K.RANGE.lk[2]) if (K.verdict({ th: +th.toFixed(2), lk: +lk.toFixed(2) }).met) wins++;
  assert.ok(wins >= 10, 'a band of settings wins: ' + wins);
  /* the right guess for quiet input, at any setting: almost none */
  for (const o of [K.START, { th: 1, lk: 0.5 }]) assert.equal(K.guessOf(P.spikeWork({ threshold: o.th, leak: o.lk }).find(x => x.p === 'quiet').share), 'none');
  assert.deepEqual(K.GUESSES.map(g => g[0]), ['all', 'half', 'tenth', 'none']);
  /* the guess that a spike costs three clocked steps turns the busy pattern into a loss, never the quiet one */
  const c = K.spikeCost(), W = P.spikeWork({ threshold: 1, leak: 0.5 });
  assert.equal(c, 3);
  assert.ok(W.find(x => x.p === 'A').events * c > W.find(x => x.p === 'A').dense);
  assert.ok(W.find(x => x.p === 'quiet').events * c < W.find(x => x.p === 'quiet').dense / 5);
});

test('light: equal arms send the light out of the bottom, and the phase sets the weight', () => {
  assert.equal(Li.answer(), 'bottom');
  assert.ok(Math.abs(Li.phaseFor(0.25) - 60) < 1e-9 && Math.abs(Li.phaseFor(0.5) - 90) < 1e-9);
  for (const th of [0, 30, 60, 90, 135, 180, 270]) assert.ok(Math.abs(P.mzi([1, 0], P.rad(th), 0).power[0] - Math.sin(P.rad(th) / 2) ** 2) < 1e-9, th + '°');
  /* the dial's steps reach the target */
  const k = (Li.phaseFor(Li.TARGET) - Li.RANGE.th[0]) / Li.RANGE.th[2]; assert.ok(Math.abs(k - Math.round(k)) < 1e-9);
});

test('light: passes spread with the noise, and are exact as often as the engine\'s check says', () => {
  const at = n => P.lightPasses({ theta: P.rad(60), noise: P.rad(n) });
  const sd = a => { const m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
  assert.ok(at(0).every(v => Math.abs(v - 0.25) < 1e-9), 'no noise: every pass exact');
  assert.ok(sd(at(1)) < sd(at(3)) && sd(at(3)) < sd(at(7)), 'more noise, more spread');
  for (const n of [1, 2.5, 5]) {
    const share = at(n).filter(v => Math.abs(v - 0.25) < 0.03).length / P.LIGHT_RUNS;
    assert.equal(share, P.lightExact({ goal: 'quarter', theta: P.rad(60), noise: P.rad(n) }), 'the dots drawn are the passes checked, at ' + n + '°');
  }
});

test('light: the start is not a win, the smoke test\'s dials win, and the middle weight breaks first', () => {
  assert.equal(Li.goalOf(Li.START.th, Li.START.n).met, false);
  const g = Li.goalOf(60, 5); assert.ok(g.steer && g.holds && g.edge && g.met, 'a quarter, at its edge');
  assert.equal(P.checkLightEdge({ goal: 'quarter', theta: P.rad(60), noise: 5 }), true);
  assert.equal(Li.goalOf(60, 4).met, false, 'one step less noise: still exact at one step more');
  assert.equal(Li.goalOf(60, 6).met, false, 'one step more: no longer exact');
  assert.equal(Li.goalOf(55, 5).met, false, 'off target');
  const q = Li.edgeOf('quarter', 60), h = Li.edgeOf('split', 90);
  assert.ok(q != null && h != null && h < q, 'a weight of a half breaks before a quarter: ' + h + ' < ' + q);
  assert.equal(Li.edgeOf('bottom', 0), P.LIGHT_NOISES[P.LIGHT_NOISES.length - 1], 'a weight of 0 stays exact at the most noise the dial gives');
});

test('every kind of new matter a lab models leads to that lab\'s challenge', () => {
  const ids = LAB_CHALLENGES.map(c => c.id);
  for (const m of MATTERS.filter(m => m.lab)) assert.ok(ids.includes(m.lab), m.id + ' leads to ' + m.lab);
  for (const id of ['spikes', 'light']) assert.equal(MATTERS.find(m => m.id === id).lab, id);
});
