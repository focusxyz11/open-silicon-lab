// A fab you run (src/engines/fabline.js): the three things a fab does that an assembly line does not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { line, capacity, bottleneck, summary, curve, wait, startState, step, PRODUCTS, GROUPS } from '../src/engines/fabline.js';

const L = line(), N = PRODUCTS.phone.layers;

test('wafers go round: every layer visits every group, so output falls with layer count', () => {
  const c45 = capacity(L, 45), c90 = capacity(L, 90);
  assert.ok(Math.abs(c45 / c90 - 2) < 1e-9, 'twice the layers, half the lots a day');
  const s = summary(L, N, 0.5 * capacity(L, N));
  assert.ok(Math.abs(s.raw - N * GROUPS.reduce((t, g) => t + g.hours, 0) / 24) < 1e-9);
});

test('one group sets the pace: more tools elsewhere change nothing, at the bottleneck they help', () => {
  const b = bottleneck(L, N);
  assert.equal(b, 'litho');
  const others = GROUPS.filter(g => g.id !== b).map(g => g.id);
  for (const id of others) assert.equal(capacity(line({ [id]: 99 }), N), capacity(L, N), 'extra ' + id + ' tools raised output');
  const more = line({ [b]: L.find(g => g.id === b).tools + 1 });
  assert.ok(capacity(more, N) > capacity(L, N));
  assert.notEqual(bottleneck(more, N), b, 'after one more scanner, another group should become the bottleneck');
});

test('full is slow: cycle time grows faster and faster as the line fills, and has no limit at 100%', () => {
  const c = curve(L, N, 20, 0.98).map(p => p.days);
  for (let i = 1; i < c.length; i++) assert.ok(c[i] > c[i - 1], 'cycle time should rise with load');
  const d = c.slice(1).map((v, i) => v - c[i]);
  for (let i = 1; i < d.length; i++) assert.ok(d[i] >= d[i - 1] - 1e-9, 'and rise faster near full');
  assert.equal(summary(L, N, capacity(L, N)).days, Infinity);
  assert.equal(wait(1, 3, 2), Infinity);
});

test('calibrated to the industry: about 1 to 1.5 days per layer near 85-90% load', () => {
  const at = load => summary(L, N, load * capacity(L, N)).daysPerLayer;
  assert.ok(at(0.85) >= 1 && at(0.85) <= 1.5, '85%: ' + at(0.85));
  assert.ok(at(0.9) >= 1 && at(0.9) <= 1.5, '90%: ' + at(0.9));
  const d = summary(L, PRODUCTS.phone.layers, 0.85 * capacity(L, PRODUCTS.phone.layers)).days;
  assert.ok(d > 70 && d < 100, 'an 80-layer chip should take roughly 80 days, not ' + d);
});

test("Little's law: lots in the fab = starts × cycle time", () => {
  const s = summary(L, N, 0.8 * capacity(L, N));
  assert.ok(Math.abs(s.wip - s.starts * s.days) < 1e-9);
});

test('individual lots finish every layer and leave the line', () => {
  const S = startState(L, 3); const starts = 0.6 * capacity(L, 4) * 1;
  for (let i = 0; i < 24 * 60 * 10; i++) step(S, L, 4, starts, 0.1);
  assert.ok(S.done.length > 10, 'lots should come out of a 4-layer line in 60 days');
  for (const lot of S.done) assert.equal(lot.layer, 4);
  assert.ok(S.done.every(l => l.out > l.born));
});
