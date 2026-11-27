// The open genome (#452): anyone, a person or an agent, can propose a new option for a gene of an architecture as an
// entry of the community's ledger (kind gene). The tests check a proposal is complete (the gene, a new option, its trait
// effects and its carry contract, src/engines/arch.js proposalWhy), new, in plain words, that every fact it names exists,
// and that it is a guess until one does; the lattice shows it in its open column.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as A from '../src/engines/arch.js';
import { useLedger, settle, settled, draft, tryEntry, proposals, fileOf } from '../src/engines/ledger.js';
import { collect } from '../scripts/ledger.mjs';
import { MATTERS } from '../src/data/lattice.js';
import { GENE_RUNGS, LAYER } from '../src/data/path.js';

useLedger(collect());
const FACTS = new Set(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => f.id));
const day = '2026-11-27';
const good = { gene: 'shape', option: 'ring', name: 'A ring', what: 'Units joined in a ring, each passing its result to the next.', effect: { energy: 1.2, rugged: 0.9 }, carry: { units: [4, 16, 64] } };
const at = (p, name, extra) => draft(Object.assign({ kind: 'gene', by: 'Ada', made: 'person', words: '' }, p, extra || {}), name, day);

test('every proposal in the ledger is complete, new and settles as a guess, or backed by a fact that exists', () => {
  const W = settled(), P = proposals(W);
  assert.ok(P.length >= 1, 'the ledger holds an example of the form');
  const seen = new Set();
  for (const e of P) {
    assert.equal(A.proposalWhy(e), null, e.id + ' is not complete');
    assert.ok(!A.OPTIONS[e.gene].includes(e.option), e.id + ' proposes an option the gene has');
    assert.ok(!seen.has(e.gene + '/' + e.option), e.id + ' is proposed twice'); seen.add(e.gene + '/' + e.option);
    if (e.fact != null) { assert.ok(FACTS.has(e.fact), e.id + ' names a fact that is not in src/data/facts.json: ' + e.fact); assert.equal(e.state, 'backed'); }
    else assert.equal(e.state, 'guess', e.id + ' is a guess until a fact backs it');
  }
  assert.ok(!W.refused.some(e => /-gene-/.test(e.id)), 'no proposal refused');
});

test('a proposal must name the gene, a new option, its trait effects and its carry contract', () => {
  assert.equal(A.proposalWhy(good), null);
  for (const [bad, why] of [
    [{ gene: 'colour' }, 'gene'], [{ gene: 'constructor' }, 'gene'], [{ gene: null }, 'gene'],
    [{ option: 'grid' }, 'option'], [{ option: 'Ring' }, 'option'], [{ option: 'r' }, 'option'], [{ option: 'a ring' }, 'option'], [{ option: 5 }, 'option'],
    [{ effect: {} }, 'effect'], [{ effect: { idle: true } }, 'effect'], [{ effect: { energy: 0 } }, 'effect'], [{ effect: { energy: 1000 } }, 'effect'], [{ effect: { speed: 2 } }, 'effect'], [{ effect: { energy: '2' } }, 'effect'], [{ effect: [2] }, 'effect'],
    [{ carry: {} }, 'carry'], [{ carry: { units: [4, 16] } }, 'carry'], [{ carry: { units: [16, 4, 64] } }, 'carry'], [{ carry: { units: [0, 4, 8] } }, 'carry'], [{ carry: { units: [1.5, 4, 8] } }, 'carry'],
    [{ carry: { units: [4, 16, 64], latency: 1e-9 } }, 'carry'], [{ carry: null }, 'carry']])
    assert.equal(A.proposalWhy(Object.assign({}, good, bad)), why, JSON.stringify(bad));
  /* each gene's contract: what it hands up the stack */
  const C = (gene, carry) => A.proposalWhy({ gene, option: 'novel', effect: { energy: 2 }, carry });
  assert.equal(C('carrier', { matter: 'yours', delay: 10 }), null);
  assert.equal(C('carrier', { matter: 'yours', delay: 10, skips: ['switch', 'gate'] }), null);
  assert.equal(C('carrier', { matter: 'yours', delay: 10, skips: ['gate', 'switch'] }), 'carry', 'the rungs it goes past, in order');
  assert.equal(C('carrier', { matter: 'plasma', delay: 10 }), 'carry', 'a column of the lattice');
  assert.equal(C('carrier', { matter: 'yours' }), 'carry', 'its gates\' delay');
  assert.equal(C('where', { latency: 2e-9 }), null); assert.equal(C('where', { latency: 1 }), 'carry');
  assert.equal(C('told', { stages: false }), null); assert.equal(C('told', { stages: 'no' }), 'carry');
  /* the contract asks for what CARRY gives today, for every option the genome has */
  for (const g of A.GENES) for (const o of A.OPTIONS[g]) if (A.isFork(g, o)) {
    const c = Object.fromEntries(Object.entries(A.CARRY[g][o]).filter(([k]) => k !== 'fact'));
    assert.equal(A.proposalWhy({ gene: g, option: 'x' + o, effect: { energy: 1.1 }, carry: c }), null, g + '/' + o + ': today\'s contract would not pass');
  }
  assert.ok(MATTERS.includes('yours'));
});

test('the ledger checks a proposal: complete, new, plain words, a fact named by its id', () => {
  const a = at(good, 'ada ring');
  assert.equal(tryEntry(a).ok, true);
  assert.equal(tryEntry(at(good, 'bo ring', { by: 'Bo' }), [a]).reason, 'same', 'the same option proposed again');
  assert.equal(tryEntry(at(Object.assign({}, good, { carry: {} }), 'ada bad')).reason, 'carry');
  assert.equal(tryEntry(at(Object.assign({}, good, { what: 'Short.' }), 'ada short')).reason, 'words');
  assert.equal(tryEntry(at(Object.assign({}, good, { name: 'See https://x.y' }), 'ada link')).reason, 'words');
  assert.equal(tryEntry(at(good, 'ada fact', { fact: 'Not An Id!' })).reason, 'fact');
  assert.equal(tryEntry(at(good, 'ada ai', { made: 'ai', ai: '' })).reason, 'sayAI', 'an agent says how');
  assert.equal(tryEntry(Object.assign({}, a, { arch: {} })).reason, 'fields', 'a field its kind does not use');
  const W = settle(collect().concat([a, at(Object.assign({}, good, { option: 'ring2' }), 'ada backed', { fact: 'cortical-cl1' })]));
  assert.equal(W.byId[a.id].state, 'guess');
  assert.equal(proposals(W).find(e => e.option === 'ring2').state, 'backed');
  assert.match(fileOf(a).path, /^community\/ledger\/2026-11-27-gene-/);
});

test('the lattice places a proposal in its open column at the layer of the first rung its gene chooses', async () => {
  const { layerOfGene } = await import('../src/v2/lattice.js');
  for (const g of A.GENES) assert.equal(layerOfGene(g), LAYER[GENE_RUNGS[g][0]]);
  assert.equal(layerOfGene('carrier'), 'physics'); assert.equal(layerOfGene('shape'), 'machine');
});
