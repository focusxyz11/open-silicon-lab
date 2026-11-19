/* The redesign's chip world and its data centre (src/v2): every place, level and part has its words, and
   every question asked there is a real stop. The game behind the island is tested in tests/game.test.mjs. */
import './ledger.setup.mjs';
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
  assert.equal(PLACES.length, 14);
  for (const id of PLACES) for (const k of ['t', 'kind', 'd']) assert.ok(EN['map.' + id + '.' + k], id + ' has no ' + k);
});

test('every level of the data centre has its words and a real question; every part named has its name', async () => {
  assert.deepEqual(LEVELS, ['campus', 'hall', 'rack', 'server', 'board', 'chip']);
  for (const lv of LEVELS) { assert.ok(EN['place.dc.' + lv + '.t'] && EN['place.dc.' + lv + '.d'], lv); assert.ok(EN['stop.' + ASKS[lv] + '.q'], lv + ': ' + ASKS[lv]); }
  assert.ok(PARTS.length >= 15);
  const { VIEW_PARTS } = await import('../src/data/atlas.js');
  for (const p of PARTS) assert.ok(VIEW_PARTS.flight[p] && EN['part.' + VIEW_PARTS.flight[p]], p + ' is named by no part of the atlas');
});

test('a phone is flown through like the data centre: every level has its words and a real question, every part its name', async () => {
  const f = src('phone3d-flight.js');
  const levels = f.match(/LEVELS = \[([^\]]+)\]/)[1].match(/'([a-z]+)'/g).map(s => s.slice(1, -1));
  const asks = Object.fromEntries([...f.match(/ASKS = \{([^}]+)\}/)[1].matchAll(/([a-z]+): '([a-z.]+)'/g)].map(m => [m[1], m[2]]));
  const depth = Object.fromEntries([...f.match(/DEPTH = \{([^}]+)\}/)[1].matchAll(/([a-z]+): '([a-z]+)'/g)].map(m => [m[1], m[2]]));
  assert.deepEqual(levels, ['phone', 'inside', 'board', 'chip']);
  const { STOPS, WORLDS } = await import('../src/data/weave.js');
  const phone = WORLDS.find(w => w.id === 'phone').depths;
  for (const lv of levels) { assert.ok(EN['place.phone.' + lv + '.t'] && EN['place.phone.' + lv + '.d'], lv); assert.ok(STOPS[asks[lv]] && EN['stop.' + asks[lv] + '.q'], lv + ': ' + asks[lv]); assert.ok(phone.includes(depth[lv]), lv + ' shows ' + depth[lv]); }
  /* it ends where the dive's phone chip begins */
  assert.equal(depth.chip, 'soc'); assert.match(f, /BEYOND = '#\/dive\/soc\/phone'/);
  const { VIEW_PARTS } = await import('../src/data/atlas.js');
  const named = [...f.matchAll(/\['([a-z]+)', (?:hinge|phone|parts|soc|dram|scene), W3\(/g)].map(m => m[1]).concat(['isp', 'gpu', 'npu', 'cpu', 'cache']);
  assert.ok(named.length >= 15);
  for (const p of named) assert.ok(VIEW_PARTS.phone[p] && EN['part.' + VIEW_PARTS.phone[p]], p + ' is named by no part of the atlas');
});

test('a car is flown through like the data centre and the phone: every level has its words, a real question and a size, every part its name', async () => {
  const f = src('car3d-flight.js');
  const levels = f.match(/LEVELS = \[([^\]]+)\]/)[1].match(/'([a-z]+)'/g).map(s => s.slice(1, -1));
  const pairs = name => Object.fromEntries([...f.match(new RegExp(name + ' = \\{([^}]+)\\}'))[1].matchAll(/([a-z]+): '([a-z.]+)'/g)].map(m => [m[1], m[2]]));
  const asks = pairs('ASKS'), depth = pairs('DEPTH'), size = pairs('SIZE');
  assert.deepEqual(levels, ['car', 'inside', 'unit', 'chip']);
  const { STOPS, WORLDS } = await import('../src/data/weave.js');
  const { VIEW_PARTS, sizeOf } = await import('../src/data/atlas.js');
  const car = WORLDS.find(w => w.id === 'car').depths;
  for (const lv of levels) {
    assert.ok(EN['place.car.' + lv + '.t'] && EN['place.car.' + lv + '.d'], lv);
    assert.ok(STOPS[asks[lv]] && EN['stop.' + asks[lv] + '.q'], lv + ': ' + asks[lv]);
    assert.ok(car.includes(depth[lv]), lv + ' shows ' + depth[lv]);
    assert.ok(sizeOf(size[lv]) > 0, lv + ' has no size');
  }
  /* it ends where the dive's car chip begins, and the dive starts from where it ended */
  assert.equal(depth.chip, 'mcu'); assert.match(f, /BEYOND = '#\/dive\/mcu\/car'/);
  assert.match(src('relief3d.js'), /mcu: CAR_HANDOFF/);
  const named = [...f.matchAll(/\['([a-z]+)', scene, W3\(/g)].map(m => m[1]).concat(['cores', 'flash', 'sram', 'periph']);
  assert.ok(named.length >= 14);
  for (const p of named) assert.ok(VIEW_PARTS.car[p] && EN['part.' + VIEW_PARTS.car[p]], p + ' is named by no part of the atlas');
  /* the island goes inside into the flight, and the dive's car chip goes back up to its last level */
  const { FLOWN } = await import('../src/v2/game.js');
  assert.deepEqual(FLOWN.cars, { car: 0, ecu: 2, mcu: 3 });
  assert.match(src('app.js'), /up: '#\/place\/cars\/3'/);
});

test('there is no menu: the bar holds the loop, six stages each with its words, and the shell says so', async () => {
  const { STAGES, STAGE_PLACE } = await import('../src/engines/way.js');
  /* a menu of sections is off unless a visitor asks for it (?menu=1): the choice is the owner's, and easy to reverse */
  assert.match(src('app.js'), /SECTIONS_ON/);
  assert.deepEqual(STAGES, ['open', 'design', 'make', 'test', 'ship', 'use']);
  for (const s of STAGES) { assert.ok(EN['loop.stage.' + s] && EN['loop.at.' + s], s); assert.ok(EN['map.' + STAGE_PLACE[s] + '.t'], s); if (s !== 'open') assert.ok(EN['loop.as.' + s], s); }
  /* the reading views that remain, each opened on purpose: your log, and the Lab's record */
  for (const k of ['log', 'build', 'ecosystem']) assert.ok(EN['page.' + k + '.lead'], k);
});

test('inside a chip: each row is a depth of the dive and the factory steps that make it, as the weave says', async () => {
  const { MADE, STOPS } = await import('../src/data/weave.js');
  const rows = [...src('chip3d.js').matchAll(/\{ dive: '([a-z]+)', made: \[([^\]]+)\] \}/g)].map(m => ({ dive: m[1], made: m[2].match(/'([a-z]+)'/g).map(x => x.slice(1, -1)) }));
  assert.deepEqual(rows.map(r => r.dive), ['chip', 'block', 'gate', 'switch', 'atom']);
  for (const r of rows) {
    assert.equal(r.made[r.made.length - 1], MADE[r.dive], r.dive + ' is made at ' + MADE[r.dive]);
    for (const d of [r.dive, ...r.made]) assert.ok(EN['depth.' + d + '.name'] && EN['depth.' + d + '.see'], d);
  }
  /* one question at each row, about how it is made (the dive asks its own) */
  const asks = src('chip3d.js').match(/export const ASK = \[([^\]]+)\]/)[1].match(/'([a-z]+\.[a-z]+)'/g).map(x => x.slice(1, -1));
  assert.equal(asks.length, rows.length);
  for (const k of asks) assert.ok(STOPS[k] && EN['stop.' + k + '.q'], k);
});
