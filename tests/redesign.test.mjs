/* The redesign's chip world and its data centre (src/v2): every place, level and part has its words, and
   every question asked there is a real stop. The game behind the island is tested in tests/game.test.mjs. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const src = f => readFileSync(new URL('../src/v2/' + f, import.meta.url), 'utf8');

/* the modules draw with WebGL, so read their data from the source rather than importing them */
const PLACES = [...src('map3d.js').matchAll(/\{ id: '([a-z]+)', at: \[/g)].map(m => m[1]);
const LEVELS = src('dc3d.js').match(/LEVELS = \[([^\]]+)\]/)[1].match(/'([a-z]+)'/g).map(s => s.slice(1, -1));
const ASKS = Object.fromEntries([...src('dc3d.js').match(/ASKS = \{([^}]+)\}/)[1].matchAll(/([a-z]+): '([a-z.]+)'/g)].map(m => [m[1], m[2]]));
const PARTS = [...src('dc3d.js').matchAll(/\['([a-z]+)', (?:scene|rack|tray|pkg), W3\(/g)].map(m => m[1]);

test('every place on the map has a name, a kind and a line', () => {
  assert.equal(PLACES.length, 11);
  for (const id of PLACES) for (const k of ['t', 'kind', 'd']) assert.ok(EN['map.' + id + '.' + k], id + ' has no ' + k);
});

test('every level of the data centre has its words and a real question; every part named has its name', () => {
  assert.deepEqual(LEVELS, ['campus', 'hall', 'rack', 'server', 'board', 'chip']);
  for (const lv of LEVELS) { assert.ok(EN['place.dc.' + lv + '.t'] && EN['place.dc.' + lv + '.d'], lv); assert.ok(EN['stop.' + ASKS[lv] + '.q'], lv + ': ' + ASKS[lv]); }
  assert.ok(PARTS.length >= 15);
  for (const p of PARTS) assert.ok(EN['place.dc.part.' + p], p);
});

test('the menu has its five parts, each with its words', () => {
  const menu = src('app.js').match(/MENU = \[([^\]]+)\]/)[1].match(/'([a-z]+)'/g).map(x => x.slice(1, -1));
  assert.deepEqual(menu, ['explore', 'challenges', 'questions', 'build', 'ecosystem']);
  for (const k of menu) assert.ok(EN['nav.' + k], k);
  for (const k of ['challenges', 'questions', 'build', 'ecosystem']) assert.ok(EN['page.' + k + '.lead'], k);
});
