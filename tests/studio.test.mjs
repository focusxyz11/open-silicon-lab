/* The studio's one plan (src/data/studio.js, #267): the room on the island and the room walked inside are drawn from
   the same numbers, and its corners are the design's steps, in order along the room. */
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FLOOR, AISLE, HOUSE, CORNERS, cornerOf, screenAt } from '../src/data/studio.js';
import { stepsOf } from '../src/engines/way.js';
import { VIEW_PARTS, partHome } from '../src/data/atlas.js';
import { FLOWN, INSIDE } from '../src/v2/game.js';
import { readWords } from '../scripts/words.mjs';
const EN = readWords();

test('the corners are the design\'s steps, one to one and in order, the last the mask house', () => {
  assert.deepEqual(CORNERS.map(c => c.id), stepsOf('bench'));
  assert.deepEqual(INSIDE.studio.map(l => l.depth), stepsOf('bench'));
  assert.ok(CORNERS.at(-1).house, 'the masks are not at the mask house');
  assert.equal(CORNERS.filter(c => c.house).length, 1);
  /* each step's corner is its stop in the walk, so the island's way into a step is the same corner */
  CORNERS.forEach((c, i) => assert.equal(FLOWN.studio[c.id], i + 1, c.id));
});

test('along the room means along the steps: the corners stand in a row from west to east, inside the floor, the walk in front', () => {
  const room = CORNERS.filter(c => !c.house);
  for (let i = 1; i < CORNERS.length; i++) assert.ok(CORNERS[i].at[0] > CORNERS[i - 1].at[0], CORNERS[i].id + ' is not further along than ' + CORNERS[i - 1].id);
  for (const c of room) { assert.ok(c.at[0] > FLOOR.x0 && c.at[0] < FLOOR.x1 && c.at[1] > FLOOR.z0 && c.at[1] < FLOOR.z1, c.id + ' is outside the floor'); assert.ok(c.at[1] < AISLE.z - 2, c.id + ' stands in the walk'); }
  const m = cornerOf('masks'); assert.ok(Math.abs(m.at[0] - HOUSE.at[0]) < HOUSE.w / 2 && Math.abs(m.at[1] - HOUSE.at[1]) < HOUSE.d / 2, 'the masks corner is not inside the mask house');
  assert.ok(HOUSE.at[0] - HOUSE.w / 2 > FLOOR.x1, 'the mask house stands inside the room');
});

test('every corner has a screen its bench opens on, facing the walk or the sky, named by its home in the atlas', () => {
  for (const c of CORNERS) {
    const s = screenAt(c); assert.ok(s.w > 0 && s.h > 0 && s.y > 0.5 && s.y < 2.5, c.id + ' has no screen at a height someone could use');
    assert.ok(c.screen.up ? s.n[1] === 1 : s.n[2] === 1, c.id + ' faces away from the walk');
    const home = VIEW_PARTS.studio[c.screen.part]; assert.ok(home, c.id + ': ' + c.screen.part + ' is no part');
    assert.equal(home.split('.')[0], c.id, c.screen.part + ' does not live at its step');
    assert.ok(EN['part.' + home] && EN['what.' + home], home + ' does not explain itself'); assert.equal(partHome(home).place, 'studio');
    assert.ok(EN['room.' + c.id + '.d'], c.id + ' has no words in the room');
  }
  assert.ok(EN['room.outside.d']);
});
