// Catch the silent errors (src/v2/labs/errors.js), part 2 of the errors puzzle: every place's goal can be met in more
// than one way and not with nothing; the car's goal is the ISO 26262 case the engine already proves (ECC, a margin, two
// copies and self-test); a data centre meets its goal without copies of the logic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as X from '../src/engines/errors.js';
import { GOALS, NEEDED, metAt } from '../src/v2/labs/errors.js';

const LV = X.LEVERS.map(l => (l.id === 'margin' ? { ...l, values: [0, 0.1, 0.2, 0.3] } : l));   /* the margins the lab offers */
function* plans(i = 0, p = {}) { if (i === LV.length) { yield { ...p }; return; } for (const v of LV[i].values) { p[LV[i].id] = v; yield* plans(i + 1, p); } }
const wins = env => [...plans()].filter(p => metAt(env, X.errors(env, p)));

test('every place has a goal, and nothing protected meets none of them', () => {
  for (const env of X.ENVIRONMENT_IDS) { assert.ok(GOALS[env], env); assert.ok(!metAt(env, X.errors(env, {})), env); }
  assert.deepEqual(NEEDED, ['phone', 'car', 'datacentre']);
});

test('each place can be met in a few ways', () => {
  for (const env of X.ENVIRONMENT_IDS) { const n = wins(env).length; assert.ok(n >= 3 && n <= 40, env + ': ' + n); }
});

test('the car needs codes on memory, a margin, two copies or more, and self-test', () => {
  for (const p of wins('car')) assert.ok(p.memory === 'ecc' && p.margin >= 0.3 && p.logic !== 'none' && p.selftest, JSON.stringify(p));
});

test('a data centre meets its goal without copying its logic, by checking its arithmetic and hunting in the fleet', () => {
  const w = wins('datacentre');
  assert.ok(w.every(p => p.logic === 'none' && p.check === 'abft'));
  assert.ok(w.some(p => p.hunt));
});
