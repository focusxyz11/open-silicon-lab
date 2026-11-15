/* The Scaling engine's fit to fifty years of processors, and the Work engine's district. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fit, byDecade, MEASURES, doublingLine } from '../src/engines/scaling.js';
import { TRENDS, TRENDS_SOURCE } from '../src/data/trends.js';
import { withDistrict, amdahl, SPECIAL_K } from '../src/engines/work.js';

test('the data has its source, and every point is a year and a positive value', () => {
  assert.equal(TRENDS_SOURCE.licence, 'CC BY 4.0');
  for (const m of MEASURES) { assert.ok(TRENDS[m].length > 50, m); for (const [y, v] of TRENDS[m]) assert.ok(y >= 1970 && y <= 2022 && v > 0, m); }
});
test('switches doubled about every two years over fifty years; clock speed stopped doubling in the 2000s', () => {
  const t = fit(TRENDS.transistors, 1971, 2022);
  assert.ok(t.doubling > 1.6 && t.doubling < 2.6, 'transistors double every ' + t.doubling);
  const f80 = fit(TRENDS.frequency, 1980, 2000), f10 = fit(TRENDS.frequency, 2005, 2022);
  assert.ok(f80.doubling && f80.doubling < 4, 'clock doubled in the 1980s and 1990s');
  assert.equal(f10.doubling, null, 'and stopped after 2005');
  assert.equal(byDecade('transistors').length, 5);
  assert.ok(Math.abs(doublingLine(1, 2000, 2)(2010) - 32) < 1e-9);
});
test("Amdahl's law: a special district pays only when its work is a large share of the job", () => {
  assert.ok(Math.abs(amdahl(0.5, 10) - 1 / 0.55) < 1e-12);
  assert.equal(withDistrict(0.3, 0), 1);
  assert.ok(withDistrict(0.9, 0.25) < 0.5, 'mostly special work: much faster');
  assert.ok(withDistrict(0.1, 0.5) > 1, 'little special work and a big district: slower');
  assert.ok(SPECIAL_K > 1);
});
