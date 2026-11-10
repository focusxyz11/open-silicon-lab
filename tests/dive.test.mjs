// The dive with its questions (prototype): every depth, question and challenge in place is real and
// tied to the frame, the time lens behaves, the zoom shrinks all the way down, and the questions form
// one web with no dead end and no way to be cut off (docs/FRAME.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEPTHS, QUESTIONS } from '../src/data/frame.js';
import { STOPS, EDGES, BENCH, LENS } from '../src/data/dive.js';
import { CHALLENGES } from '../src/generated/graph.js';
import { IDS, stateAt, lineAt, nodeFor, shapeFor, adderAt, sizes, levels, along, behind, reach, direction, surfaced, NOW } from '../src/engines/dive.js';
import { signals } from '../src/engines/chipzoom.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const FACTS = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
const qids = new Set(QUESTIONS.map(q => q.id));

test('the depths follow the frame, from the building down, with words for every time', () => {
  const frame = DEPTHS.map(d => d.id);
  assert.deepEqual(IDS, frame.slice(frame.indexOf('building')));
  for (const s of STOPS) {
    assert.ok(EN['dv.d.' + s.depth], s.depth + ' has no words');
    assert.ok(s.times.every((t, i) => i === 0 || t > s.times[i - 1]), s.depth + ': times must rise');
    for (const t of s.times) assert.ok(EN['dv.t.' + s.depth + '.' + t], 'missing dv.t.' + s.depth + '.' + t);
    if (s.born > LENS.min) assert.ok(EN['dv.t.' + s.depth + '.before'], 'missing dv.t.' + s.depth + '.before');
  }
});

test('the time lens: ghost before a place existed, unfinished after today', () => {
  assert.equal(stateAt('board', 1950), 'ghost');
  assert.equal(stateAt('board', 1990), 'real');
  assert.equal(stateAt('switch', 1947), 'real');
  assert.equal(stateAt('chip', NOW + 1), 'future');
  assert.equal(lineAt('board', 1950), 'before');
  assert.equal(lineAt('switch', 2015), '2011');
  assert.equal(lineAt('building', 1800), '1947');
  assert.deepEqual([1947, 1960, 2015, 2025, 2035].map(shapeFor), ['contact', 'planar', 'fin', 'gaa', 'cfet']);
  assert.deepEqual([1990, 2005, 2015, 2030].map(nodeFor), ['180', '130', '28', '3']);
});

test('every unfinished place holds a question, sits inside its scene, and points somewhere real', () => {
  const seen = new Set();
  for (const e of EDGES) {
    assert.ok(!seen.has(e.id), 'duplicate place ' + e.id); seen.add(e.id);
    assert.ok(qids.has(e.q), e.id + ': unknown core question ' + e.q);
    assert.ok(IDS.includes(e.depth), e.id + ': not a depth of the dive');
    assert.ok(e.at.every(v => Math.abs(v) <= 0.95), e.id + ' sits outside its scene');
    for (const k of ['place', 'q', 'try']) assert.ok(EN['dv.e.' + e.id + '.' + k], 'missing dv.e.' + e.id + '.' + k);
    assert.ok(e.topic, e.id + ' needs a topic');
    if (e.fact) assert.ok(FACTS.some(f => f.id === e.fact), e.id + ': unknown fact ' + e.fact);
    if (e.bench) assert.ok(BENCH[e.bench], e.id + ': unknown bench ' + e.bench);
  }
  /* Every core question is underneath somewhere, and every depth has something unfinished. */
  for (const q of qids) assert.ok(EDGES.some(e => e.q === q), 'nothing carries the core question ' + q);
  for (const d of IDS) assert.ok(EDGES.some(e => e.depth === d), 'nothing unfinished at ' + d);
});

test('behind every question is another, somewhere else; the web has no dead end and no island', () => {
  for (const e of EDGES) {
    const b = behind(e.id);
    assert.equal(b.length, e.behind.length, e.id + ' points at a question that does not exist');
    assert.ok(b.length >= 1, e.id + ' is a dead end');
    for (const x of b) {
      assert.notEqual(x.id, e.id, e.id + ' points at itself');
      assert.notEqual(x.depth, e.depth, e.id + ': the question behind should take you to another depth');
    }
    assert.equal(reach(e.id).size, EDGES.length, 'from ' + e.id + ' not every question can be reached');
  }
  /* Questions lead both deeper and higher: the web is not a road down. */
  const dirs = EDGES.flatMap(e => e.behind.map(b => direction(e.id, b)));
  assert.ok(dirs.includes(1) && dirs.includes(-1));
});

test('the challenges in place are existing, self-checking challenges', () => {
  const ids = Object.keys(BENCH);
  assert.ok(ids.length >= 2 && ids.length <= 3);
  for (const k of ids) {
    const b = BENCH[k], c = CHALLENGES.find(x => x.topic === b.topic && x.t === b.title);
    assert.ok(c, k + ': no challenge "' + b.title + '" in ' + b.topic);
    assert.equal(c.href, '#' + b.lab, k + ': the challenge plays in another panel');
    assert.ok(Array.isArray(c.check) && c.check.length, k + ': it should check itself');
    assert.ok(EDGES.some(e => e.bench === k), k + ' is not reached from any question');
  }
});

test('the zoom shrinks at every depth and every process, and the adder really adds', () => {
  for (const node of ['180', '130', '28', '3']) {
    const Z = adderAt(node);
    assert.ok(Z.ok, node + ': the adder does not build');
    const S = sizes(Z), order = IDS.map(id => S[id]);
    order.forEach((v, i) => { if (i) assert.ok(v < order[i - 1], node + ': ' + IDS[i] + ' is not smaller than ' + IDS[i - 1]); });
    const L = levels(Z, { building: [0, 0], rack: [0, 0], board: [0, 0], chip: [0, 0] }, 2026);
    assert.deepEqual(L.map(l => l.id), IDS);
    L.slice(0, -1).forEach(l => assert.ok(l.T && l.T.every(v => Math.abs(v) < 1), node + ': the next depth is outside ' + l.id));
    for (let k = 0; k < 8; k++) {
      const a = k & 1, b = k >> 1 & 1, c = k >> 2 & 1, o = signals(Z, [a, b, c], {}).out;
      assert.equal(o.sum + 2 * o.cout, a + b + c, node + ': ' + a + '+' + b + '+' + c);
    }
  }
});

test('along() walks a path by its length', () => {
  assert.deepEqual(along([[0, 0], [1, 0], [1, 1]], 0.5), [1, 0]);
  assert.deepEqual(along([[0, 0], [2, 0]], 0.25), [0.5, 0]);
  assert.deepEqual(along([[0, 0], [2, 0]], 2), [2, 0]);
});

test('a core question surfaces alone, only once two places at different depths carry it', () => {
  assert.deepEqual(surfaced([]), {});
  assert.deepEqual(surfaced(['erasing-costs']), {});
  assert.deepEqual(surfaced(['erasing-costs', 'erasing-costs']), {});
  assert.deepEqual(surfaced(['erasing-costs', 'memory-wall', 'no-atoms-left']), { limit: ['gate', 'atom'] });
  /* it names only the questions whose moment came, never the whole set */
  const all = surfaced(EDGES.map(e => e.id));
  assert.ok(Object.keys(all).length < QUESTIONS.length);
  for (const q of QUESTIONS) assert.equal(EN['dv.q.' + q.id], q.question, 'dv.q.' + q.id + ' differs from src/data/frame.js');
});
