// The home hero (src/data/hero.js) points at challenges and topics by name. If one is renamed or
// removed, the hero would quietly show an empty card, so these tests catch it here instead.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HERO, DIE, LENS_IDS } from '../src/data/hero.js';
import { TOPICS, CHALLENGES } from '../src/generated/graph.js';
import { BANDS } from '../src/data/bands.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const topic = id => TOPICS.some(t => t.id === id);

test('the hero has one entry for each of the nine zoom levels', () => {
  assert.equal(HERO.length, 9);
});

test('every topic, simulation and challenge the hero names exists', () => {
  HERO.forEach((L, i) => {
    L.topics.forEach(id => assert.ok(topic(id), 'level ' + (i + 1) + ': no topic ' + id));
    for (const lens of LENS_IDS.slice(1)) {
      const r = L[lens];
      assert.ok(r, 'level ' + (i + 1) + ' has nothing to ' + lens);
      if (r.ch) assert.ok(CHALLENGES.some(c => c.topic === r.ch[0] && c.t === r.ch[1]), 'level ' + (i + 1) + ' ' + lens + ': no challenge "' + r.ch[1] + '" in ' + r.ch[0]);
      else assert.ok(topic(r.sim || r.topic), 'level ' + (i + 1) + ' ' + lens + ': no topic ' + (r.sim || r.topic));
    }
  });
});

test('every level has a hook and a reason for each lens', () => {
  HERO.forEach((L, i) => {
    assert.ok(EN['hero.hook.' + (i + 1)], 'hero.hook.' + (i + 1));
    LENS_IDS.slice(1).forEach(k => assert.ok(EN['hero.why.' + (i + 1) + '.' + k], 'hero.why.' + (i + 1) + '.' + k));
  });
});

test('the die map has one block per band, inside the die, each opening a real zoom level', () => {
  assert.deepEqual(DIE.map(d => d.band).sort(), BANDS.map(b => b.id).sort());
  for (const d of DIE) {
    assert.ok(d.x >= 0 && d.y >= 0 && d.x + d.w <= 100 && d.y + d.h <= 100, d.band + ' sits outside the die');
    if (d.zoom != null) assert.ok(Number.isInteger(d.zoom) && d.zoom >= 0 && d.zoom < 9, d.band + ' zooms to a level that does not exist');
  }
  for (let i = 0; i < DIE.length; i++) for (let j = i + 1; j < DIE.length; j++) {
    const a = DIE[i], b = DIE[j];
    const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    assert.ok(!overlap, a.band + ' and ' + b.band + ' overlap');
  }
});
