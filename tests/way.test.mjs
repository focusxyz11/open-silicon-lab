/* The way (src/engines/way.js, docs/reviews/structure.md): every address is a cell of one grid, a stage of the loop
   and a level; along lands in the stage asked, and holds the depth wherever that depth exists there. */
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, STAGE_PLACE, stageOfPlace, nextPlace, whereOf, alongTo, holds, doHome } from '../src/engines/way.js';
import { PLACES, CHALLENGES, DEPTH_ORDER, viewOfDepth, INSIDE } from '../src/v2/game.js';
import { TWINS } from '../src/data/atlas.js';

test('every place is at a stage of the loop, and the loop closes', () => {
  for (const p of PLACES) if (p !== 'idea') assert.ok(STAGES.includes(stageOfPlace(p)), p + ' is at no stage');
  for (const s of STAGES) assert.equal(stageOfPlace(STAGE_PLACE[s]), s);
  /* following the next place from the need goes round every stage once and comes back */
  const seen = []; let p = STAGE_PLACE.need;
  do { seen.push(stageOfPlace(p)); p = nextPlace(p); } while (p !== STAGE_PLACE.need && seen.length < 20);
  assert.deepEqual(seen, STAGES);
  assert.equal(nextPlace('quarry'), 'fab');
});

test('every level of every place has an address with a stage', () => {
  for (const d of DEPTH_ORDER) { const W = whereOf(viewOfDepth(d)); assert.ok(STAGES.includes(W.stage), d + ' → ' + viewOfDepth(d) + ' has no stage'); assert.ok(W.place, d + ' has no place'); }
  for (const [place, L] of Object.entries(INSIDE)) for (const l of L) assert.ok(whereOf(viewOfDepth(l.depth)).place, place + '/' + l.depth);
  assert.equal(whereOf('#/').view, 'island'); assert.equal(whereOf('#/build').stage, 'need'); assert.equal(whereOf('#/place/village').stage, 'need');
  assert.equal(whereOf('#/ask/fail/gate').level, 'gate'); assert.equal(whereOf('#/chip/2/build').stage, 'make');
});

test('along lands in the stage asked, from anywhere', () => {
  const from = ['#/', '#/place/studio', '#/board', '#/chip/2', '#/chip/3/build', '#/supply', '#/build', '#/place/datacentre/2'].concat(DEPTH_ORDER.map(viewOfDepth));
  for (const h of from) for (const s of STAGES) {
    const W = whereOf(h), to = alongTo(W, s);
    if (to == null) { assert.equal(W.stage, s, h + ' → ' + s + ' goes nowhere'); continue; }
    assert.match(to, /^#\/(place|bench|line|dive|chip)\//, h + ' → ' + s + ': ' + to);
    assert.equal(whereOf(to).stage, s, h + ' → ' + s + ' lands at ' + to);
  }
});

test('along holds the depth: a level seen as used, made and designed is the same level', () => {
  for (const tw of TWINS) {
    const used = whereOf('#/dive/' + tw.used);
    const made = alongTo(used, 'make'); assert.ok(holds(used, 'make'), tw.used + ' is not held at the factory');
    assert.equal(alongTo(whereOf(made), 'use'), '#/dive/' + tw.used, tw.used + ' made → used');
    if (tw.designed) { const des = alongTo(used, 'design'); assert.equal(des, '#/bench/' + tw.designed); assert.equal(alongTo(whereOf(des), 'use'), '#/dive/' + tw.used, tw.used + ' designed → used'); }
    else assert.ok(!holds(used, 'design'));
  }
  /* on the line, testing and shipping are stations of the same walk */
  assert.equal(alongTo(whereOf('#/line/print'), 'test'), '#/line/test');
  assert.equal(alongTo(whereOf('#/line/test'), 'ship'), '#/line/pkg');
  /* the stack turns in place */
  assert.equal(alongTo(whereOf('#/chip/2'), 'make'), '#/chip/2/build');
});

test('a challenge is played where its level is shown, or met at its place', () => {
  for (const c of CHALLENGES) { const h = doHome(c), W = whereOf('#/do/' + c.id);
    if (h) { assert.match(h, /^#\/(bench|dive|line)\//); assert.equal(W.level, c.at, c.id + ' is not played at its level'); }
    else assert.equal(W.place, c.place, c.id); }
  assert.ok(CHALLENGES.filter(c => doHome(c)).length >= CHALLENGES.length - 1, 'most challenges are played in place');
});

test('the port shows agents the same world: from the island, every name look gives can be looked at again, and every level is reached', async () => {
  const { look } = await import('../src/engines/api.js'), { useTexts } = await import('../src/core/i18n.js'), { readFileSync } = await import('node:fs');
  useTexts(JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8')));
  const island = look({}); assert.equal(island.loop.length, STAGES.length);
  const seen = new Set(), todo = island.places.map(p => p.place);
  while (todo.length) {
    const at = todo.pop(); if (!at || at === 'island' || seen.has(at)) continue; seen.add(at);
    const L = look({ at }); assert.ok(L.ok !== false, 'look cannot see ' + at);
    assert.ok(STAGES.includes(L.stage), at + ' has no stage');
    [L.in, L.out, L.on, L.back].concat(typeof L.along === 'string' ? [L.along] : Object.values(L.along || {}), (L.levels || []).map(l => l.level)).forEach(n => todo.push(n));
  }
  for (const d of DEPTH_ORDER) assert.ok(seen.has(d), 'no move leads to ' + d);
  assert.equal(look({ at: 'gate' }).along.make, 'print'); assert.equal(look({ at: 'print' }).along.use, 'gate');
  assert.equal(look({ at: 'nowhere' }).ok, false);
});
