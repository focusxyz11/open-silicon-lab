// The time machine: data are in order, every year from 1971 to 2040 has a complete snapshot,
// projections are labelled, and every topic and company has an entry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as TL from '../src/data/timeline.js';
import { TOPICS } from '../src/data/topics.js';

const sorted = (list, name) => { for (let i = 1; i < list.length; i++) assert.ok(list[i][0] >= list[i - 1][0], name + ' in year order at ' + list[i][0]); };

test('every timeline series is in year order and starts by 1971', () => {
  for (const [name, list] of Object.entries({ CHIPS: TL.CHIPS, NODES: TL.NODES, SHAPES: TL.SHAPES, LITHO: TL.LITHO, WAFERS: TL.WAFERS, ERAS: TL.ERAS, RUPP: TL.RUPP })) { sorted(list, name); }
  for (const list of [TL.CHIPS, TL.NODES, TL.SHAPES, TL.LITHO, TL.WAFERS, TL.ERAS]) assert.equal(list[0][0], TL.MIN);
});

test('history is history and the future is labelled', () => {
  for (const list of [TL.NODES, TL.SHAPES, TL.LITHO]) for (const it of list) if (it[0] <= TL.NOW) assert.equal(it[2], 'ship', it[1]); else assert.notEqual(it[2], 'ship', it[1]);
  assert.ok(TL.CHIPS.every(c => c[0] <= TL.NOW), 'named chips stop at today');
});

test('every year has a complete snapshot', () => {
  for (let y = TL.MIN; y <= TL.MAX; y++) {
    const s = TL.snapshot(y);
    assert.equal(s.y, y); assert.equal(s.proj, y > TL.NOW);
    for (const k of ['era', 'chip', 'node', 'shape', 'litho', 'wafer', 'biggest']) assert.ok(s[k], y + ' ' + k);
    assert.ok(s.flagship > 0);
    assert.ok(s.companies.n >= 1 && s.companies.n <= s.companies.total);
    for (const t of TOPICS) assert.ok(TL.topicLine(t.id, y).length > 10, t.id + ' ' + y);
  }
});

test('landmarks match well-known values', () => {
  assert.equal(TL.snapshot(1971).chip.name, 'Intel 4004');
  assert.equal(TL.snapshot(1971).flagship, 2300);
  assert.equal(TL.snapshot(1989).biggest.name, 'Intel 80486');
  assert.equal(TL.snapshot(2026).biggest.tr, 336e9);
  assert.ok(TL.snapshot(2040).flagship > 1e13 && TL.snapshot(2040).flagship < 5e13);
  assert.equal(TL.snapshot(2005).wafer, '300 mm (12 inch)');
  assert.ok(TL.snapshot(1995).missing.includes('riscv'));
  assert.ok(!TL.snapshot(2011).missing.includes('riscv'));
  assert.equal(TL.snapshot(2026).companies.n, TL.snapshot(2026).companies.total);
});

test('every company in the company explorer has a founding year, and no extras', () => {
  const src = readFileSync(new URL('../src/labs/company-explorer.js', import.meta.url), 'utf8');
  const ids = [...src.matchAll(/^ \['([a-z0-9]+)','/gm)].map(m => m[1]);
  assert.ok(ids.length > 50);
  assert.deepEqual(ids.slice().sort(), Object.keys(TL.FOUNDED).sort());
});

test('the transistor trend data look like Moore\'s law', () => {
  const first = TL.RUPP[0], last = TL.RUPP[TL.RUPP.length - 1];
  const doublings = Math.log2(last[1] / first[1]), years = last[0] - first[0];
  assert.ok(years / doublings > 1.7 && years / doublings < 2.6, 'doubling time ' + (years / doublings).toFixed(2));
});
