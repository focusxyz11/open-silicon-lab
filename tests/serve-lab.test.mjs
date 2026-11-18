// The serving labs' own check (src/v2/labs/serve.js): the energy lab has no challenge in the engine, so its check, over
// the results the player has seen, is tested here: it fails at the start, needs both parts, and can be met within the dials.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../src/engines/aiserve.js';
import { tokenMet, chipAsStart, buildingShare, TOKEN_GOAL, TOKEN_RANGE, ANSWERS } from '../src/v2/labs/serve.js';

const see = s => ({ s: { ...A.ENERGY_DEFAULTS, ...s }, r: A.energyPerToken({ ...A.ENERGY_DEFAULTS, ...s }) });

test('where an answer\'s energy goes: not met at the start, nor by one part alone', () => {
  assert.equal(tokenMet([see({})]).ok, false);
  assert.ok(buildingShare(see({}).r) > TOKEN_GOAL.building);
  const best = see({ pue: TOKEN_RANGE.pue[0], overhead: TOKEN_RANGE.overhead[0] }), fast = see({ tokExp: 4.5 });
  assert.ok(tokenMet([best]).building && !tokenMet([best]).half, 'the best building is seen, and is not half');
  assert.ok(tokenMet([fast]).half && !tokenMet([fast]).building);
  assert.equal(tokenMet([see({}), best, fast]).ok, true);
});

test('the building alone never halves an answer; the building counts only with the chip untouched', () => {
  const [p0, , ps] = TOKEN_RANGE.pue, [o0, o1] = TOKEN_RANGE.overhead, start = A.energyPerToken().joulesPerToken;
  for (let pue = p0; pue <= 2; pue += ps * 5) for (let overhead = o0; overhead <= o1; overhead += 5) assert.ok(see({ pue, overhead }).r.joulesPerToken > start * TOKEN_GOAL.half);
  const x = see({ pue: 1.05, overhead: 10, watts: 1000 });
  assert.equal(chipAsStart(x.s), false); assert.equal(tokenMet([x]).building, null);
  assert.ok(chipAsStart(A.ENERGY_DEFAULTS));
});

test('the dials start inside their ranges, and the prefill lab offers the answer the engine\'s challenge asks for', () => {
  for (const [k, [lo, hi]] of Object.entries(TOKEN_RANGE)) assert.ok(A.ENERGY_DEFAULTS[k] >= lo && A.ENERGY_DEFAULTS[k] <= hi, k);
  const answer = A.answerOfSlider(A.PREFILL_DEFAULTS.answerSlider);
  assert.ok(ANSWERS.includes(answer));
  assert.equal(A.readFastWriteSlow({ chipId: 'rubin', paramsB: 70, promptSlider: 929, answerTokens: answer }), true);
  assert.equal(A.readFastWriteSlow({ chipId: 'rubin', paramsB: 70, promptSlider: A.PREFILL_DEFAULTS.promptSlider, answerTokens: answer }), false);
});
