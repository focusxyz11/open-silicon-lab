import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHIPS, chips, chipYear } from '../src/data/chips.js';

const FACTS = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url))).facts;

test('real chips have unique ids and sensible figures', () => {
  assert.equal(new Set(CHIPS.map(c => c.id)).size, CHIPS.length);
  for (const c of CHIPS) {
    assert.ok(c.n && c.kind && c.mem && c.bw > 0, c.id);
    assert.ok(chipYear(c) >= 2020 && chipYear(c) <= 2030, c.id);
  }
  assert.throws(() => chips(['rubin', 'nope']).map(c => c.n));
});

test('each chip agrees with its sourced fact', () => {
  for (const c of CHIPS.filter(c => c.fact)) {
    const f = FACTS.find(x => x.id === c.fact);
    assert.ok(f, c.id + ' names a missing fact');
    const text = [f.label, f.value, f.detail].join(' ');
    if (c.top) assert.ok(text.includes(String(c.top[0])), c.id + ' peak differs from its fact');
    if (c.gb) assert.ok(text.includes(c.gb + ' GB'), c.id + ' memory differs from its fact');
  }
});
