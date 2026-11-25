/* The way (src/engines/way.js, docs/reviews/structure.md): every address is a cell of one grid, a stage of the loop
   and a level; along lands in the stage asked, and holds the depth wherever that depth exists there. */
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, STAGE_PLACE, stageOfPlace, nextPlace, whereOf, alongTo, holds, doHome } from '../src/engines/way.js';
import { PLACES, CHALLENGES, DEPTH_ORDER, viewOfDepth, INSIDE } from '../src/v2/game.js';
import { TWINS } from '../src/data/atlas.js';
import { readWords } from '../scripts/words.mjs';

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
  useTexts(readWords());
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

test('steps are along, levels are in · out: the studio and the line are rows of steps, and only some steps show a level', async () => {
  const { stepsOf, levelOfStep, levelsOfSteps, stepOfLevel, inOutOfStep } = await import('../src/engines/way.js');
  /* the studio's steps, in order, and the levels three of them show (the grid's Design column) */
  assert.deepEqual(stepsOf('bench'), ['need', 'logic', 'check', 'gates', 'layout', 'masks']);
  assert.deepEqual(stepsOf('bench').map(s => levelOfStep('bench', s)), ['chip', null, null, 'gate', 'block', null]);
  assert.deepEqual(levelsOfSteps('bench'), ['chip', 'block', 'gate']);
  /* the line's steps are the journey, and its levels the whole Make column, biggest first */
  assert.equal(stepsOf('line')[0], 'crystal'); assert.equal(stepsOf('line').at(-1), 'ship');
  assert.deepEqual(levelsOfSteps('line'), ['chip', 'block', 'gate', 'switch', 'atom']);
  for (const s of ['slice', 'clean', 'deposit', 'test', 'ship']) assert.equal(levelOfStep('line', s), null, s + ' shows no level');
  assert.equal(stepOfLevel('line', 'atom', 'crystal'), 'crystal'); assert.equal(stepOfLevel('line', 'atom', 'print'), 'implant');
  /* every level on a rail is shown by some step, and the step it leads to shows it */
  for (const v of ['bench', 'line']) for (const lv of levelsOfSteps(v)) assert.equal(levelOfStep(v, stepOfLevel(v, lv, null)), lv, v + '/' + lv);
  /* in · out in the studio: the job (the chip) → layout (its blocks) → gates, and back; nothing at a step without a level */
  assert.equal(inOutOfStep('bench', 'need', 1), 'layout'); assert.equal(inOutOfStep('bench', 'layout', 1), 'gates'); assert.equal(inOutOfStep('bench', 'gates', 1), null);
  assert.equal(inOutOfStep('bench', 'gates', -1), 'layout'); assert.equal(inOutOfStep('bench', 'layout', -1), 'need'); assert.equal(inOutOfStep('bench', 'need', -1), null);
  for (const s of ['logic', 'check', 'masks']) for (const d of [1, -1]) assert.equal(inOutOfStep('bench', s, d), null, s);
  /* in · out always goes to a smaller level going in, a bigger one going out */
  for (const v of ['bench', 'line']) for (const s of stepsOf(v)) for (const d of [1, -1]) { const to = inOutOfStep(v, s, d); if (!to) continue;
    const L = levelsOfSteps(v); assert.equal(Math.sign(L.indexOf(levelOfStep(v, to)) - L.indexOf(levelOfStep(v, s))), d, v + ' ' + s + ' ' + d); }
  /* the address of a step says its step and the level it shows */
  assert.equal(whereOf('#/bench/layout').size, 'block'); assert.equal(whereOf('#/bench/check').size, null); assert.equal(whereOf('#/line/print').step, 'print');
});

test('Around here offers a level at another stage only where the step shows one', () => {
  /* describe, check and masks show no level: no stage holds anything from there, and along lands at that stage's place */
  for (const s of ['logic', 'check', 'masks']) { const W = whereOf('#/bench/' + s);
    for (const st of STAGES) { assert.ok(!holds(W, st), s + ' holds a level at ' + st); const to = alongTo(W, st); if (to) assert.match(to, /^#\/place\//, s + ' → ' + st); } }
  /* the job, gates and layout hold their level as made and in use */
  assert.equal(alongTo(whereOf('#/bench/gates'), 'use'), '#/dive/gate'); assert.ok(holds(whereOf('#/bench/gates'), 'use'));
  assert.ok(holds(whereOf('#/bench/need'), 'make')); assert.ok(holds(whereOf('#/bench/layout'), 'make'));
  /* on the line, walking the same row to the test house or the packing is a step along, not the same level at another stage */
  const pr = whereOf('#/line/print');
  assert.ok(!holds(pr, 'test')); assert.ok(!holds(pr, 'ship')); assert.ok(holds(pr, 'design')); assert.ok(holds(pr, 'use'));
  for (const s of ['slice', 'clean', 'deposit', 'test', 'ship']) for (const st of STAGES) assert.ok(!holds(whereOf('#/line/' + s), st), s + ' → ' + st);
});

test('the studio walked inside is the same row of steps: outside holds nothing, each corner holds what its step holds', async () => {
  const { stepsOf, levelOfStep } = await import('../src/engines/way.js');
  const out = whereOf('#/place/studio/0');
  assert.equal(out.view, 'room'); assert.equal(out.stage, 'design'); assert.equal(out.step, null); assert.equal(out.size, null);
  for (const st of STAGES) assert.ok(!holds(out, st), 'outside the studio holds a level at ' + st);
  assert.equal(levelOfStep('bench', null), null); assert.equal(levelOfStep('bench', undefined), null);
  stepsOf('bench').forEach((s, i) => { const W = whereOf('#/place/studio/' + (i + 1)), B = whereOf('#/bench/' + s);
    assert.equal(W.step, s); assert.equal(W.size, B.size, s);
    for (const st of STAGES) { assert.equal(holds(W, st), holds(B, st), s + ' → ' + st); if (holds(W, st)) assert.equal(alongTo(W, st), alongTo(B, st)); } });
  /* and along from any corner lands in the stage asked */
  for (let i = 0; i <= 6; i++) for (const s of STAGES) { const W = whereOf('#/place/studio/' + i), to = alongTo(W, s); if (to) assert.equal(whereOf(to).stage, s, i + ' → ' + s); }
});

test('along keeps the level round the loop: dropped at Open, where it does not exist, it is picked up at the next stage that has it', async () => {
  const { alongStep, carryOf } = await import('../src/engines/way.js');
  /* the keys' walk: each → from where the last one landed, carrying what it carries */
  const walk = (h, dir, n) => { let W = whereOf(h); const to = [];
    for (let i = 0; i < n; i++) { const s = alongStep(W, dir); to.push(s.to); W = Object.assign(whereOf(s.to), s.carry ? { carry: s.carry } : {}); }
    return to; };
  /* Use → Open (the Lab: no gate there) → Design: the gate as you designed it */
  assert.deepEqual(walk('#/dive/gate', 1, 2), ['#/place/lab', '#/bench/gates']);
  assert.equal(carryOf(whereOf('#/dive/gate'), '#/place/lab'), 'gate');
  /* and back again: ← from the Lab returns to the gate in use */
  assert.equal(alongTo(Object.assign(whereOf('#/place/lab'), { carry: 'gate' }), 'use'), '#/dive/gate');
  /* the gate as printed, past the test house and the port (no gate at either), comes back to the gate in use */
  assert.deepEqual(walk('#/chip/2/build', 1, 3), ['#/place/test', '#/place/port', '#/dive/gate']);
  /* every level with a twin goes the whole way round and comes back to itself, held wherever it exists */
  for (const tw of TWINS) { const round = walk('#/dive/' + tw.used, 1, STAGES.length);
    assert.equal(round.at(-1), '#/dive/' + tw.used, tw.used + ' round the loop: ' + round.join(' → '));
    if (tw.designed) assert.ok(round.includes('#/bench/' + tw.designed), tw.used + ' is not met as designed'); }
  /* a move that lands on a level carries nothing (the address says it), and a step that shows none has nothing to carry */
  assert.equal(carryOf(whereOf('#/dive/gate'), '#/bench/gates'), null);
  assert.equal(carryOf(whereOf('#/bench/check'), '#/place/fab'), null);
  /* without a level carried, the island's places go round the places, as before */
  assert.equal(alongTo(whereOf('#/place/lab'), 'design'), '#/place/studio');
});

test('every challenge\'s card names the stage the bar lights while it is played', async () => {
  const { stageOfChallenge } = await import('../src/engines/way.js'), { readFileSync } = await import('node:fs');
  for (const c of CHALLENGES) { if (!c.step) continue;
    const st = stageOfChallenge(c), bar = whereOf('#/do/' + encodeURIComponent(c.id)).stage;
    assert.ok(STAGES.includes(st), c.id + ' is played at no stage'); assert.equal(st, bar, c.id);
    /* and it counts in the bar under the same stage; the Lab's challenges, at Open (which has no count), count for Design */
    if (st === 'open') { assert.equal(c.place, 'lab', c.id); assert.equal(c.step, 'design', c.id); } else assert.equal(c.step, st, c.id + ' counts under ' + c.step + ' but is played at ' + st); }
  /* the card reads the stage from there, not from the step it counts under */
  assert.match(readFileSync(new URL('../src/v2/play.js', import.meta.url), 'utf8'), /stageOfChallenge\(ch\)/);
});

test('the way back from a reading page leads to the page it names, and never names the page you are on', async () => {
  const { useTexts } = await import('../src/core/i18n.js'); useTexts(readWords());
  const { backOf, nameOf } = await import('../src/v2/frame2.js');
  /* opened from the address: a page goes back to the map, the map itself to the first page */
  assert.equal(backOf('#/w/heat', null, false), '#/log'); assert.equal(nameOf('#/log'), readWords()['frame2.backMap']);
  for (const h of ['#/log', '#/challenges', '#/questions']) assert.equal(backOf(h, null, false), '#/', h);
  assert.equal(nameOf('#/'), readWords()['frame2.backFirst']); assert.notEqual(nameOf('#/'), nameOf('#/log'));
  /* opened from somewhere: back there; opened from the map: back to the map */
  assert.equal(backOf('#/w/heat', '#/place/fab', false), '#/place/fab'); assert.equal(backOf('#/w/heat', '#/', true), '#/log');
  assert.equal(backOf('#/log', '#/', false), '#/');
});
