/* Something to do at a level (src/data/seek.js, issue #235): each search names parts its view draws, has words to
   look for and something to notice on every part, leads into a question that lives at that level, and is kept. */
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SEEK, normalLooked, foundAt } from '../src/data/seek.js';
import { VIEW_PARTS } from '../src/data/atlas.js';
import { STOPS } from '../src/data/weave.js';
import { partsOf } from '../src/app/scenes.js';
import { normalState, fresh } from '../src/v2/game.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));

test('every search looks at parts its view draws, with words for each', () => {
  for (const [lv, Q] of Object.entries(SEEK)) {
    const drawn = Q.view === 'flight' ? Object.keys(VIEW_PARTS.flight) : Object.keys(partsOf(lv));
    assert.ok(Q.parts.length >= 3, lv + ': a search needs at least three parts to choose from');
    Q.parts.forEach(p => { assert.ok(drawn.includes(p), lv + ': ' + p + ' is not drawn there'); assert.ok(EN['seek.' + lv + '.' + p], lv + ': no notice for ' + p); });
    assert.ok(Q.parts.includes(Q.leads), lv + ': the part that leads in must be one of its parts');
    assert.ok(EN['seek.' + lv + '.find'], lv + ': no words for what to look for');
    assert.ok(STOPS[Q.ask] && EN['stop.' + Q.ask + '.q'], lv + ': leads into ' + Q.ask + ', which is not a question');
    /* the question it leads into is about the part that leads in (at the flight's server, the rack's question) */
    if (Q.view === 'dive') { assert.equal(Q.ask.split('.')[1], lv); assert.ok(STOPS[Q.ask].includes(Q.leads), lv + ': ' + Q.leads + ' is not a part of ' + Q.ask); }
  }
});

test('what you looked at is kept, and found only at the part that leads in', () => {
  assert.deepEqual(fresh().looked, {});
  const s = normalState({ looked: { server: ['memory', 'nope', 'accelerator'], gate: ['diff'], nowhere: ['x'], phoneboard: 'soc' } });
  assert.deepEqual(s.looked, { server: ['accelerator', 'memory'], gate: ['diff'] });
  assert.ok(foundAt(s.looked, 'server')); assert.ok(!foundAt(s.looked, 'gate')); assert.ok(!foundAt(s.looked, 'phoneboard'));
  assert.deepEqual(normalLooked(null), {});
});
