// The lenses repaint the picture (#304): each core question that lives at a level paints it from its parts' facts
// (src/data/partfacts.js) with a model of an engine (src/engines/lens.js), drawn by src/v2/lenspaint.js. Every part the
// level names has its facts; every lens living there has a model and a paint; every control moves what it should; the
// words are there; and the layer is pinned onto the picture by a projective map that takes the plan's corners home.
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS, factsOf, KINDS, MAKERS } from '../src/data/partfacts.js';
import { MODELS } from '../src/engines/lens.js';
import { PAINT, paints, squareTo } from '../src/v2/lenspaint.js';
import { partsOf } from '../src/app/scenes.js';
import { createLenses } from '../src/engines/frame.js';
import { EXPERIMENTS } from '../src/engines/experiments.js';
import { STOPS } from '../src/data/weave.js';
import { CHALLENGES } from '../src/v2/game.js';
import { doHome } from '../src/engines/way.js';
import { readWords } from '../scripts/words.mjs';
import { useTexts } from '../src/core/i18n.js';

const EN = readWords(); useTexts(EN);
const L = createLenses({ experiments: EXPERIMENTS, stops: STOPS, challenges: CHALLENGES, doHome });

test('every part a level with facts names has its facts: a kind and a maker', () => {
  for (const [level, F] of Object.entries(FACTS)) {
    for (const key of Object.keys(partsOf(level))) assert.ok(F[key], level + ': the part ' + key + ' has no facts');
    for (const [key, f] of Object.entries(F)) { assert.ok(KINDS.includes(f.kind), level + '.' + key + ' kind'); assert.ok(MAKERS.includes(f.by), level + '.' + key + ' maker'); }
    for (const p of factsOf(level).parts) assert.ok(p.rects.length || p.paths.length, level + '.' + p.key + ' has no shape to paint');
  }
});

test('at the block, every lens that lives there repaints it, with a control and measures from an engine', () => {
  const here = L.lensesAt('block');
  assert.equal(here.length, 6);
  for (const q of here) {
    assert.ok(paints(q, 'block'), q + ' does not paint the block');
    const M = MODELS[q], F = factsOf('block');
    assert.ok(M.control.values.includes(M.control.start), q + ' starts off its control');
    for (const v of M.control.values) {
      const m = M.run(F, v);
      for (const id of M.measures) assert.ok(Number.isFinite(m.measures[id]), q + ' at ' + v + ': ' + id + ' is ' + m.measures[id]);
      const svg = PAINT[q](F, m);
      assert.match(svg, /<(rect|path|circle|line)\b/, q + ' at ' + v + ' paints nothing');
      assert.doesNotMatch(svg, /<text\b/, q + ': words are never painted on the picture');
    }
    for (const w of ['ctl', 'lo', 'hi', 'at'].map(k => 'lp.' + q + '.' + k).concat(M.measures.map(id => 'lp.' + q + '.m.' + id))) assert.ok(w in EN, w);
  }
});

test('each control moves what its lens says it moves', () => {
  const F = factsOf('block'), at = (q, v) => MODELS[q].run(F, v).measures, ends = q => [MODELS[q].control.values[0], MODELS[q].control.values.at(-1)];
  { const [a, b] = ends('geo'); assert.ok(at('geo', b).trip < at('geo', a).trip, 'packing shortens the trip'); assert.ok(at('geo', b).heat > at('geo', a).heat, 'packing concentrates the heat'); }
  { const [a, b] = ends('eff'); assert.ok(at('eff', b).energy < at('eff', a).energy); assert.ok(at('eff', b).power > at('eff', a).power, 'cheaper answers, more power drawn: the rebound'); }
  { const [a, b] = ends('copy'); assert.ok(at('copy', b).energy < at('copy', a).energy); assert.ok(at('copy', b).copied < at('copy', a).copied, 'memory in the logic does not copy'); }
  { const [a, b] = ends('dig'); assert.equal(at('dig', a).wrong, 0); assert.ok(at('dig', b).wrong > 0.01); }
  { const [a, b] = ends('physics'); assert.ok(at('physics', b).off > at('physics', a).off, 'hotter, more answers off'); assert.ok(at('physics', a).use < at('physics', a).fight, 'using physics is cheaper per sum'); }
  { const [a, b] = ends('perfect'); assert.ok(at('perfect', b).late > at('perfect', a).late); }
  { const m = at('human', 8); assert.equal(m.drawn, 8); assert.equal(m.pass, 8, 'every layout the program draws still gives every right answer'); assert.ok(m.longest >= m.shortest); }
});

test('the paint is pinned by a projective map that takes the plan\'s corners to the picture\'s', () => {
  const C = [[120, 80], [900, 110], [980, 700], [60, 640]], m = squareTo(C);
  const apply = (x, y) => { const X = m[0] * x + m[4] * y + m[12], Y = m[1] * x + m[5] * y + m[13], W = m[3] * x + m[7] * y + m[15]; return [X / W, Y / W]; };
  [[0, 0], [1000, 0], [1000, 1000], [0, 1000]].forEach((p, i) => { const [x, y] = apply(...p); assert.ok(Math.abs(x - C[i][0]) < 1e-6 && Math.abs(y - C[i][1]) < 1e-6, 'corner ' + i); });
});
