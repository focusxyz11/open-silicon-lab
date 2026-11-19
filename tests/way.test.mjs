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
  /* following the next place from what is open goes round every stage once and comes back */
  const seen = []; let p = STAGE_PLACE.open;
  do { seen.push(stageOfPlace(p)); p = nextPlace(p); } while (p !== STAGE_PLACE.open && seen.length < 20);
  assert.deepEqual(seen, STAGES);
  assert.equal(nextPlace('quarry'), 'fab');
});

test('every level of every place has an address with a stage', () => {
  for (const d of DEPTH_ORDER) { const W = whereOf(viewOfDepth(d)); assert.ok(STAGES.includes(W.stage), d + ' → ' + viewOfDepth(d) + ' has no stage'); assert.ok(W.place, d + ' has no place'); }
  for (const [place, L] of Object.entries(INSIDE)) for (const l of L) assert.ok(whereOf(viewOfDepth(l.depth)).place, place + '/' + l.depth);
  assert.equal(whereOf('#/').view, 'island'); assert.equal(whereOf('#/build').stage, 'open'); assert.equal(whereOf('#/place/village').stage, 'open');
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
});

test('one way down through a chip: the dive is Use, the stack is the same levels as made, and along turns between them', () => {
  const ROWS = ['chip', 'block', 'gate', 'switch', 'atom'];
  /* the stack is the Make column, whatever the address says: an old link without /build is the same place */
  ROWS.forEach((lv, r) => ['#/chip/' + r, '#/chip/' + r + '/build'].forEach(h => {
    const W = whereOf(h); assert.equal(W.view, 'chip'); assert.equal(W.stage, 'make', h); assert.equal(W.level, lv, h); assert.equal(W.place, 'fab', h);
    /* along back to Use lands on the dive at the same level, and nowhere in the stack offers it as a second way down */
    assert.equal(alongTo(W, 'use'), '#/dive/' + lv, h + ' → use'); assert.ok(holds(W, 'use'));
    assert.equal(alongTo(W, 'make'), null, h + ' is already Make');
  }));
  /* every level of the dive below the chip: along to Make lands on the stack's row of that level, the bar underlines
     Make beforehand, and along back to Use returns to the same level of the dive */
  for (const lv of ROWS.slice(1)) {
    const used = whereOf('#/dive/' + lv), made = alongTo(used, 'make'), r = ROWS.indexOf(lv);
    assert.equal(made, '#/chip/' + r + '/build', lv + ' as made'); assert.ok(holds(used, 'make'), lv + ': Make is not underlined');
    const M = whereOf(made); assert.equal(M.level, lv); assert.equal(M.stage, 'make');
    assert.equal(alongTo(M, 'use'), '#/dive/' + lv, lv + ' made → used');
    /* and the whole round of the loop from there keeps the level wherever it exists */
    for (const s of STAGES.filter(x => x !== 'use')) { const to = alongTo(M, s); if (to && holds(M, s)) assert.equal(whereOf(alongTo(whereOf(to), 'use')).level, lv, lv + ' → ' + s + ' → use'); }
  }
  /* the whole chip as made is the die on its wafer (the grid's Chip × Make), and back */
  assert.equal(alongTo(whereOf('#/dive/chip'), 'make'), '#/dive/die/made'); assert.equal(alongTo(whereOf('#/chip/0/build'), 'use'), '#/dive/chip');
  /* designed → made holds the level too: the gates you wrote, as printed */
  assert.equal(alongTo(whereOf('#/bench/gates'), 'make'), '#/chip/2/build'); assert.equal(alongTo(whereOf('#/bench/layout'), 'make'), '#/chip/1/build');
  assert.equal(alongTo(whereOf('#/chip/2/build'), 'design'), '#/bench/gates');
});

test('a challenge is played where its level is shown, or met at its place', () => {
  for (const c of CHALLENGES) { const h = doHome(c), W = whereOf('#/do/' + c.id);
    if (h) { assert.match(h, /^#\/(bench|dive|line)\//); assert.equal(W.level, c.at, c.id + ' is not played at its level'); }
    else assert.equal(W.place, c.place, c.id); }
  assert.ok(CHALLENGES.filter(c => c.at && !doHome(c)).length <= 2, 'most challenges with a level are played at it');
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
