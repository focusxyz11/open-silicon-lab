// The One answer journey (prototype): every stop, edge and challenge in place is real and tagged to
// the frame, the time lens behaves, the dive's sizes shrink all the way down, and the constellation
// only ever draws lines out of what the visitor found (docs/FRAME.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEPTHS, QUESTIONS, LINKS } from '../src/data/frame.js';
import { STOPS, EDGES, BENCH, SKY, LENS } from '../src/data/journeys.js';
import { CHALLENGES } from '../src/generated/graph.js';
import { stateAt, lineAt, nodeFor, shapeFor, adderAt, sizes, levels, constellation, along, NOW } from '../src/engines/journey.js';
import { signals } from '../src/engines/chipzoom.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const FACTS = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
const qids = new Set(QUESTIONS.map(q => q.id));

test('one stop for every depth, in the frame\'s order, with words for every time', () => {
  assert.deepEqual(STOPS.map(s => s.depth), DEPTHS.map(d => d.id));
  for (const s of STOPS) {
    assert.ok(EN['oa.d.' + s.depth + '.story'], s.depth + ' has no story');
    assert.ok(EN['oa.u.' + s.depth], s.depth + ' has no words for the answer coming back');
    assert.ok(s.times.every((t, i) => i === 0 || t > s.times[i - 1]), s.depth + ': times must rise');
    for (const t of s.times) assert.ok(EN['oa.t.' + s.depth + '.' + t], 'missing oa.t.' + s.depth + '.' + t);
    if (s.born > LENS.min) assert.ok(EN['oa.t.' + s.depth + '.before'], 'missing oa.t.' + s.depth + '.before');
  }
});

test('the time lens: ghost before a place existed, unfinished after today', () => {
  assert.equal(stateAt('board', 1950), 'ghost');
  assert.equal(stateAt('board', 1990), 'real');
  assert.equal(stateAt('switch', 1947), 'real');
  assert.equal(stateAt('chip', NOW + 1), 'future');
  assert.equal(lineAt('board', 1950), 'before');
  assert.equal(lineAt('switch', 2015), '2011');
  assert.equal(lineAt('planet', 1800), '1947');
  assert.deepEqual([1947, 1960, 2015, 2025, 2035].map(shapeFor), ['contact', 'planar', 'fin', 'gaa', 'cfet']);
  assert.deepEqual([1990, 2005, 2015, 2030].map(nodeFor), ['180', '130', '28', '3']);
});

test('every open edge is tagged to a question, sits inside its scene, and points somewhere real', () => {
  const seen = new Set();
  for (const e of EDGES) {
    assert.ok(!seen.has(e.id), 'duplicate edge ' + e.id); seen.add(e.id);
    assert.ok(qids.has(e.q), e.id + ': unknown question ' + e.q);
    assert.ok(DEPTHS.some(d => d.id === e.depth), e.id + ': unknown depth');
    assert.ok(e.at.every(v => Math.abs(v) <= 0.95), e.id + ' sits outside its scene');
    for (const k of ['place', 'q', 'try']) assert.ok(EN['oa.e.' + e.id + '.' + k], 'missing oa.e.' + e.id + '.' + k);
    assert.ok(e.topic, e.id + ' needs a topic');
    if (e.fact) assert.ok(FACTS.some(f => f.id === e.fact), e.id + ': unknown fact ' + e.fact);
    if (e.bench) assert.ok(BENCH[e.bench], e.id + ': unknown bench ' + e.bench);
  }
  /* The slice reaches every question at least once, and every depth has an edge. */
  for (const q of qids) assert.ok(EDGES.some(e => e.q === q), 'no edge for question ' + q);
  for (const d of DEPTHS) assert.ok(EDGES.some(e => e.depth === d.id), 'no edge at depth ' + d.id);
  for (const q of qids) assert.ok(SKY[q], q + ' has no place in the sky');
});

test('the challenges in place are existing, self-checking challenges', () => {
  const ids = Object.keys(BENCH);
  assert.ok(ids.length >= 2 && ids.length <= 3);
  for (const k of ids) {
    const b = BENCH[k], c = CHALLENGES.find(x => x.topic === b.topic && x.t === b.title);
    assert.ok(c, k + ': no challenge "' + b.title + '" in ' + b.topic);
    assert.equal(c.href, '#' + b.lab, k + ': the challenge plays in another panel');
    assert.ok(Array.isArray(c.check) && c.check.length, k + ': it should check itself');
    assert.ok(EDGES.some(e => e.bench === k), k + ' is not reached from any edge');
  }
});

test('the dive shrinks at every depth and every process, and the adder really adds', () => {
  for (const node of ['180', '130', '28', '3']) {
    const Z = adderAt(node);
    assert.ok(Z.ok, node + ': the adder does not build');
    const S = sizes(Z), order = DEPTHS.map(d => S[d.id]);
    order.forEach((v, i) => { if (i) assert.ok(v < order[i - 1], node + ': ' + DEPTHS[i].id + ' is not smaller than ' + DEPTHS[i - 1].id); });
    const L = levels(Z, { planet: [0, 0], region: [0, 0], building: [0, 0], rack: [0, 0], board: [0, 0], chip: [0, 0] }, 2026);
    L.slice(0, -1).forEach(l => assert.ok(l.T && l.T.every(v => Math.abs(v) < 1), node + ': the next depth is outside ' + l.id));
    for (let k = 0; k < 8; k++) {
      const a = k & 1, b = k >> 1 & 1, c = k >> 2 & 1, o = signals(Z, [a, b, c], {}).out;
      assert.equal(o.sum + 2 * o.cout, a + b + c, node + ': ' + a + '+' + b + '+' + c);
    }
  }
});

test('the constellation draws lines only between stars the visitor found', () => {
  assert.deepEqual(constellation([]).lines, []);
  const one = constellation(['memory-wall']);
  assert.equal(one.stars.length, 1); assert.equal(one.lines.length, 0); assert.deepEqual(one.formed, []);
  const divide = constellation(['here-or-there', 'one-mind', 'memory-wall']);
  assert.equal(divide.lines.filter(l => l.kind === 'same').length, 2);
  assert.deepEqual(divide.formed, ['divide']);
  /* Divide and Scale are linked in the frame: one faint line between their shapes, with its reason. */
  const both = constellation(['one-mind', 'after-nanosheet']);
  const portal = both.lines.filter(l => l.kind === 'portal');
  assert.equal(portal.length, 1);
  assert.ok(LINKS.some(([a, b, why]) => why === portal[0].why && [a, b].includes('divide') && [a, b].includes('scale')));
  const all = constellation(EDGES.map(e => e.id));
  assert.equal(all.stars.length, EDGES.length);
  for (const s of all.stars) assert.ok(s.at.every(v => v > 0 && v < 1), s.id + ' falls off the sky');
});

test('along() walks a path by its length', () => {
  assert.deepEqual(along([[0, 0], [1, 0], [1, 1]], 0.5), [1, 0]);
  assert.deepEqual(along([[0, 0], [2, 0]], 0.25), [0.5, 0]);
  assert.deepEqual(along([[0, 0], [2, 0]], 2), [2, 0]);
});

test('the words the sky shows match the frame (questions and the reasons for links)', () => {
  for (const q of QUESTIONS) assert.equal(EN['oa.q.' + q.id], q.question, 'oa.q.' + q.id + ' differs from src/data/frame.js');
  for (const [a, b, why] of LINKS) assert.equal(EN['oa.why.' + a + '.' + b], why, 'oa.why.' + a + '.' + b + ' differs from src/data/frame.js');
});
