// Design rules and masks (src/engines/rules.js): a tile the router made keeps the rules a grid can break only by
// mistake, and each rule notices when it is broken; the masks are SKY130's own list, split so the parts add up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build, solutionOf, starterOf, PROJECTS } from '../src/engines/design.js';
import { RULES, checkRules, rulesOf, allKept, maskSet, SKY130_MASKS, SKY130_TOTAL, ANTENNA_TRACKS } from '../src/engines/rules.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const FACTS = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => [f.id, f]));
const B = p => build({ p, code: solutionOf(p) || starterOf(p), slice: solutionOf('alu') });
const byId = (R, id) => R.find(r => r.id === id);
const clone = o => JSON.parse(JSON.stringify(o));

test('every rule has its words, and every tile the studio lays out is checked on all of them', () => {
  for (const r of RULES) assert.ok(EN['studio.rule.' + r.id], r.id);
  for (const p of PROJECTS) {
    const R = rulesOf(B(p));
    assert.deepEqual(R.map(r => r.id), RULES.map(r => r.id), p);
    for (const id of ['grid', 'short', 'overlap', 'inside', 'open']) assert.ok(byId(R, id).ok, p + ': the router broke ' + id);
  }
  assert.ok(allKept(rulesOf(B('half'))), 'the half adder keeps every rule');
  assert.equal(rulesOf({}), null);
});

test('each rule notices when it is broken', () => {
  const D = B('full'), PL = { ...D.PL, pos: clone(D.PL.pos) }, RT = { ...D.RT, paths: clone(D.RT.paths) };
  /* a cell pushed onto its neighbour, and one pushed off the tile */
  const row = Object.entries(PL.pos).filter(([, p]) => p.r === 0).sort((a, b) => a[1].x - b[1].x);
  if (row.length > 1) { PL.pos[row[1][0]].x = row[0][1].x; assert.ok(!byId(checkRules(PL, RT, D.M), 'overlap').ok, 'overlap'); PL.pos[row[1][0]].x = row[1][1].x; }
  PL.pos[row[0][0]].x = PL.W + 3; assert.ok(!byId(checkRules(PL, RT, D.M), 'inside').ok, 'inside');
  /* a wire that jumps two tracks, or runs the wrong way on its layer */
  const PL2 = D.PL, net = Object.keys(RT.paths)[0], path = RT.paths[net][0], GW = RT.GW;
  const bad = { ...RT, paths: { ...RT.paths, [net]: [[path[0], path[0] + 8]] } };
  assert.ok(!byId(checkRules(PL2, bad, D.M), 'grid').ok, 'grid');
  /* two nets on one point of one layer */
  const other = Object.keys(RT.paths).find(n => n !== net), pt = RT.paths[other][0][1];
  const sh = { ...RT, paths: { ...RT.paths, [net]: RT.paths[net].concat([[pt]]) } };
  assert.ok(!byId(checkRules(PL2, sh, D.M), 'short').ok, 'short');
  /* two vias of different nets side by side */
  const v0 = (1 * GW + 1) * 2, v1 = (1 * GW + 2) * 2;
  const vv = { ...RT, paths: { a: [[v0, v0 + 1]], b: [[v1, v1 + 1]] } };
  assert.equal(byId(checkRules(PL2, vv, D.M), 'via').n, 1, 'via');
  /* a net the router could not finish */
  assert.ok(!byId(checkRules(PL2, { ...RT, failed: [Number(net)] }, D.M), 'open').ok, 'open');
  /* a long wire ending on one gate input, on a wide tile: past the limit it breaks the rule, under it it does not */
  const wide = n => ({ GW: 200, H: 4, failed: [], paths: { 7: [Array.from({ length: n + 1 }, (_, x) => x * 2)] } });
  const M1 = { cells: [{ type: 'INV', ins: [7], out: 8 }] };
  assert.ok(!byId(checkRules({ pos: {}, rows: 1, W: 200, TR: 4 }, wide(ANTENNA_TRACKS + 1), M1), 'antenna').ok, 'antenna: too long');
  assert.ok(byId(checkRules({ pos: {}, rows: 1, W: 200, TR: 4 }, wide(ANTENNA_TRACKS), M1), 'antenna').ok, 'antenna: at the limit');
  assert.ok(byId(checkRules({ pos: {}, rows: 1, W: 200, TR: 4 }, wide(ANTENNA_TRACKS + 1), { cells: [{ type: 'NAND2', ins: [7, 7], out: 8 }] }), 'antenna').ok, 'antenna: two gate inputs share it');
});

test('the masks are SKY130\'s list, every one in exactly one group, and the tile draws its own wires', () => {
  const all = SKY130_MASKS.flatMap(g => g.m);
  assert.equal(new Set(all).size, all.length);
  assert.equal(SKY130_TOTAL, 34);
  assert.match(FACTS['sky130-masks'].value, /\b34\b/);
  for (const g of SKY130_MASKS) assert.ok(EN['studio.mask.' + g.g], g.g);
  const S = maskSet(B('half'));
  assert.equal(S.groups.reduce((a, g) => a + g.n, 0), S.total);
  assert.deepEqual(S.groups.find(g => g.id === 'yours').drawn, ['VIM', 'MM2', 'VIM2', 'MM3']);
  assert.equal(S.drawn, 4);
  for (const g of S.groups) if (g.id !== 'yours') assert.equal(g.drawn.length, 0);
  assert.equal(maskSet(null).drawn, 0);
});
