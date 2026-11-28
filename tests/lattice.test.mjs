/* The lattice (#411, src/data/lattice.js): the Map arranged by matter and layers. Everything it places is a thing the
   lab has, read by id; every cell is something (the lab's, real elsewhere with a source, open with its question, or
   passed by); every path runs through cells that exist; and its words are whole, saying no number no fact holds. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MATTERS, LAYERS, PLACED, PAGES, CELLS, PATHS, cellOf, cellKey, itemOf, pathCells } from '../src/data/lattice.js';
import { CHALLENGES, INSIDE, PLACES } from '../src/v2/game.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const FACTS = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8'));
const FACT = Object.fromEntries(FACTS.facts.map(f => [f.id, f]));
const KEYS = new Set(MATTERS.flatMap(m => LAYERS.map(l => cellKey(m, l))));

test('every thing placed is a thing the lab has: a challenge, a level or a page, each in a cell that exists, once', () => {
  const seen = new Set();
  for (const [what, m, l] of PLACED) {
    assert.ok(KEYS.has(cellKey(m, l)), what + ': no cell ' + m + '.' + l);
    const [k, id] = itemOf(what);
    if (k === 'ch') assert.ok(CHALLENGES.some(c => c.id === id), what + ': no such challenge');
    else if (k === 'lv') { const [p, d] = id.split('/'); assert.ok(PLACES.includes(p) && (INSIDE[p] || []).some(x => x.depth === d), what + ': no such level'); }
    else if (k === 'go') { assert.ok(PAGES[id], what + ': no such page'); assert.match(PAGES[id].href, /^#\//); assert.ok(EN[PAGES[id].word], what + ': no words ' + PAGES[id].word); }
    else assert.fail(what + ': a thing is ch:, lv: or go:');
    if (k !== 'go') { assert.ok(!seen.has(what), what + ' is placed twice'); seen.add(what); }
  }
});

test('every cell is something: the lab\'s, real elsewhere with its source, open with its question, or passed by', () => {
  for (const k of Object.keys(CELLS)) {
    assert.ok(KEYS.has(k), 'CELLS names ' + k + ', which is no cell');
    const c = CELLS[k];
    assert.ok(Array.isArray(c) ? c.length : ['open', 'past'].includes(c), k + ': a list of facts, open or past');
  }
  for (const m of MATTERS) for (const l of LAYERS) {
    const key = cellKey(m, l), c = cellOf(m, l);
    assert.ok(c.has.length || c.real.length || c.open || c.past, key + ' is nothing');
    for (const id of c.real) {
      const f = FACT[id]; assert.ok(f, key + ': no fact ' + id);
      assert.ok(f.value && f.label && f.source && /^https:\/\//.test(f.url) && /^\d{4}-\d{2}-\d{2}$/.test(f.verified) && f.kind in FACTS.kinds, id + ': a value, a label, a source, a link, a kind and the date it was checked');
    }
    if (c.open) assert.ok(EN['page.lat.q.' + key] || EN['page.lat.q.' + m], key + ' is open, and asks no question');
    if (c.past) assert.ok(!c.has.length && l !== 'physics' && l !== 'intelligence', key + ': a matter passes by a layer between its physics and what it reaches');
  }
  /* not every matter climbs every layer, and that is part of the picture: neurons and DNA learn without gates */
  for (const m of ['neurons', 'molecules']) assert.ok(LAYERS.some(l => cellOf(m, l).past), m + ' passes a layer by');
  /* the last column is open, for a matter nobody has put in the lab yet */
  assert.equal(MATTERS[MATTERS.length - 1], 'yours');
  for (const l of LAYERS) assert.ok(cellOf('yours', l).open, 'yours.' + l + ' is open');
});

test('the six paths run through cells that exist, and light only things that are on them', () => {
  assert.deepEqual(PATHS.map(p => p.id), ['nand', 'riscv', 'physics', 'things', 'living', 'spec']);
  for (const p of PATHS) {
    assert.ok(EN['page.lat.path.' + p.id + '.t'] && EN['page.lat.path.' + p.id + '.d'], p.id + ': words');
    for (const s of p.strands) { assert.ok(s.length >= 2, p.id + ': a strand has two cells or more'); s.forEach(k => assert.ok(KEYS.has(k), p.id + ': no cell ' + k)); }
    const cells = pathCells(p.id);
    for (const mk of p.marks) assert.ok(PLACED.some(([w, m, l]) => w === mk && cells.includes(cellKey(m, l))), p.id + ': ' + mk + ' is not in a cell of the path');
  }
});

test('the lattice\'s words are whole, and say no number no fact holds', () => {
  for (const m of MATTERS) assert.ok(EN['page.lat.m.' + m + '.t'] && EN['page.lat.m.' + m + '.d'], m + ': words');
  for (const l of LAYERS) assert.ok(EN['page.lat.l.' + l + '.t'] && EN['page.lat.l.' + l + '.d'], l + ': words');
  for (const k of ['page.map.arrange', 'page.map.byLife', 'page.map.byMatter', 'page.lat.lead', 'page.lat.real', 'page.lat.open', 'page.lat.past', 'page.lat.pastD', 'page.lat.paths', 'page.lat.pathHint', 'page.lat.tabs', 'page.lat.step', 'page.lat.more', 'page.lat.levels', 'page.lat.source', 'page.lat.propose'])
    assert.ok(EN[k], 'no words ' + k);
  const held = new Set(FACTS.facts.flatMap(f => (String(f.value) + ' ' + f.label).match(/\d[\d,.]*/g) || []));
  const bad = Object.entries(EN).filter(([k]) => k.startsWith('page.lat.')).flatMap(([k, v]) => (String(v).match(/\d[\d,.]*/g) || []).filter(n => !held.has(n)).map(n => k + ': ' + n));
  assert.deepEqual(bad, []);
});

/* one ladder (#450, docs/PATH.md "How it joins the lab"): the lattice is not a picture of its own but an arrangement of
   Your stack's ladder. Its layers are the stack's rungs, drawn as plates from the mind down to the atom, each opening
   its rung; silicon, the stack's matter, stands beside them as the spine and every other matter is a fork of it; and
   every cell opens the rung of its row */
test('the lattice is an arrangement of your stack\'s ladder: every layer and every cell opens its rung, silicon the spine', async () => {
  const { useTexts } = await import('../src/core/i18n.js'); useTexts(EN, 'en');
  const { latticeHtml } = await import('../src/v2/lattice.js');
  const { RUNGS, LAYER } = await import('../src/data/path.js');
  assert.deepEqual(RUNGS.map(r => LAYER[r]), LAYERS, 'the layers, from the bottom up, are the rungs, from the atom up');
  assert.equal(MATTERS[0], 'silicon', 'silicon stands next to the rungs, as the spine');
  const h = latticeHtml({ path: null, matter: 'silicon', FACT, been: {}, chOf: id => CHALLENGES.find(c => c.id === id) || null, titleOf: c => c.id, doHref: c => '#/do/' + c.id, isDone: () => false, levelHref: (p, d) => '#/dive/' + d, proposals: [] });
  /* the plates, top down: mind to atom, each a way onto its rung, named as the stack names it */
  const plates = [...h.matchAll(/<a class="lat-lh" data-l="(\w+)" data-rung="(\w+)" href="([^"]+)"[^>]*><span class="lat-plate"><b>([^<]+)<\/b>/g)];
  assert.deepEqual(plates.map(m => m[2]), RUNGS.slice().reverse(), 'one plate per rung, from the mind down');
  for (const [, l, r, href, nm] of plates) { assert.equal(LAYER[r], l); assert.equal(href, '#/stack/' + r); assert.equal(nm, r === 'machine' ? EN['page.lat.machine'] : EN['depth.' + r + '.name']); }
  /* every cell carries its row's rung */
  const rows = h.split('<a class="lat-lh"').slice(1);
  assert.equal(rows.length, LAYERS.length);
  rows.forEach((row, i) => { const r = plates[i][2], tags = [...row.matchAll(/<a class="lat-rt" href="([^"]+)"/g)].map(m => m[1]);
    assert.equal(tags.length, MATTERS.length, r + ': every cell opens its rung'); assert.ok(tags.every(x => x === '#/stack/' + r), r); });
  /* silicon the spine, the others its forks: said once each at the head of its column */
  const heads = [...h.matchAll(/<div class="lat-mh[^"]*" data-m="(\w+)"><span class="lat-sp">([^<]+)<\/span>/g)];
  assert.deepEqual(heads.map(m => m[1]), MATTERS);
  heads.forEach(([, m, w]) => assert.equal(w, EN[m === 'silicon' ? 'page.lat.spine' : 'page.lat.fork'], m));
});
