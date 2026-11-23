/* The labs, each declared in a file of its own (src/data/labs/): adding a lab touches its own files, its words and
   src/data/frame.js, and its name in the list (docs/LABS.md). These tests keep that true: every lab's file is listed,
   each names files that are there, its challenges are whole, and nothing a lab says is said twice elsewhere. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { LABS, LAB_CHALLENGES, kindsOf, labOfKind, challengeOnly } from '../src/data/labs/index.js';
import { CHALLENGES, OPENS, GROWTH, PLACES, INSIDE } from '../src/v2/game.js';
import { EXPERIMENTS } from '../src/data/experiments/index.js';
import { STOPS } from '../src/data/weave.js';
import { FILED } from '../src/data/frame.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const at = p => new URL('../' + p, import.meta.url);
const read = p => readFileSync(at(p), 'utf8');
/* the kinds the player plays itself (src/v2/play.js); every other kind is a lab's */
const LOOP_KINDS = ['design', 'bet', 'chip', 'life', 'spot', 'break'];

test('every lab file is in the list, once, named for its file', () => {
  const files = readdirSync(at('src/data/labs/')).filter(f => f.endsWith('.js') && f !== 'index.js').map(f => f.slice(0, -3)).sort();
  assert.deepEqual(LABS.map(l => l.name).sort(), files, 'src/data/labs/index.js lists every lab file, and only those');
  assert.equal(new Set(LABS.map(l => l.name)).size, LABS.length);
  for (const l of LABS) assert.ok(l.challenges.length, l.name + ' has a challenge');
});

test('each lab names files that are there: the lab, its growers, its styles, its smoke check', () => {
  for (const l of LABS) {
    assert.match(read('src/v2/labs/' + l.name + '.js'), /export default function lab\(/, l.name + ': src/v2/labs/' + l.name + '.js plays it');
    const grow = read('src/v2/growers/' + l.name + '.js');
    for (const c of l.challenges) assert.ok(grow.includes("'" + c.grows + "': { at: ["), l.name + ': ' + c.grows + ' is grown in src/v2/growers/' + l.name + '.js');
    assert.equal(!!l.css, existsSync(at('src/styles/labs/' + l.name + '.css')), l.name + ': css: true exactly when src/styles/labs/' + l.name + '.css is there');
  }
  /* a smoke check is a lab's own: named for a lab in the list */
  for (const f of readdirSync(at('scripts/smoke/labs/'))) assert.ok(LABS.some(l => l.name + '.mjs' === f), 'scripts/smoke/labs/' + f + ' is named for a lab');
  for (const f of readdirSync(at('src/styles/labs/'))) assert.ok(LABS.some(l => l.name + '.css' === f), 'src/styles/labs/' + f + ' is named for a lab');
  for (const f of readdirSync(at('src/v2/growers/'))) assert.ok(LABS.some(l => l.name + '.js' === f), 'src/v2/growers/' + f + ' is named for a lab');
});

test('a lab plays its own kinds, none of the loop\'s and none another lab plays', () => {
  const seen = {};
  for (const l of LABS) for (const k of kindsOf(l)) {
    assert.ok(!LOOP_KINDS.includes(k), l.name + ': ' + k + ' is a kind the player plays itself');
    assert.ok(!seen[k] || seen[k] === l.name, k + ' is played by ' + seen[k] + ' and ' + l.name); seen[k] = l.name;
    assert.equal(labOfKind(k), l);
  }
});

test('every lab\'s challenge is whole: where it is, what it opens, its experiment, its words, its filing, where it stands in the order', () => {
  const ids = CHALLENGES.map(c => c.id);
  for (const c of LAB_CHALLENGES) {
    assert.ok(ids.includes(c.id), c.id + ' is gathered into the challenges');
    assert.deepEqual(CHALLENGES.find(x => x.id === c.id), challengeOnly(c), c.id + ' is read by the loop as its lab says');
    assert.ok(PLACES.includes(c.place), c.id + ': ' + c.place);
    if ((INSIDE[c.place] || []).length) assert.ok(INSIDE[c.place].some(l => l.depth === c.at), c.id + ': ' + c.at + ' is a level of ' + c.place);
    assert.ok(STOPS[c.opens], c.id + ' opens a question that is a stop: ' + c.opens);
    assert.equal(OPENS[c.id], c.opens);
    const x = EXPERIMENTS.find(e => e.id === c.exp);
    assert.ok(x, c.id + ': its experiment ' + c.exp + ' is there');
    assert.equal(EXPERIMENTS.filter(e => (e.ch || []).includes(c.id)).length, 1, c.id + ' is in exactly one experiment');
    assert.ok(x.ch.includes(c.id));
    if (c.growAt) { assert.ok(PLACES.includes(c.growAt), c.id + ' grows at ' + c.growAt); assert.equal(GROWTH.find(g => g.by === c.id).at, c.growAt); }
    if (c.after) assert.equal(ids[ids.indexOf(c.id) - 1], c.after, c.id + ' stands right after ' + c.after);
    for (const k of ['t', 'goal', 'why']) assert.ok(EN['game.ch.' + c.id + '.' + k], c.id + ': game.ch.' + c.id + '.' + k);
    assert.ok(EN['grow.' + c.grows], c.id + ': grow.' + c.grows);
    assert.ok(FILED.challenges[c.id], c.id + ' is filed under its questions (src/data/frame.js)');
  }
});

test('what a lab declares is said only there: no lab\'s challenge in the game\'s own list, its experiment\'s file or the island', () => {
  const game = read('src/v2/game.js'), map = read('src/v2/map3d.js'), worlds = readdirSync(at('src/data/experiments/')).filter(f => f !== 'index.js').map(f => read('src/data/experiments/' + f)).join('\n');
  for (const c of LAB_CHALLENGES) {
    assert.ok(!game.includes("{ id: '" + c.id + "'"), c.id + ' is declared in src/v2/game.js too');
    assert.ok(!new RegExp("ch: \\[[^\\]]*'" + c.id + "'").test(worlds), c.id + ' is listed in an experiment\'s file too');
    assert.ok(!map.includes("'" + c.grows + "':"), c.grows + ' is grown in src/v2/map3d.js too');
  }
});
