// Noise as a carrier (#496): the first real proposal through the open genome. Thermal noise as a carrier (p-bits,
// thermodynamic sampling) enters as one ledger entry of kind gene, made the way the port's propose_gene makes it, a
// guess until a fact backs it; the engine never hard-codes it (src/engines/arch.js), the stack and the lattice show it
// because the ledger has it, and the p-bits lab (src/v2/labs/pbits.js) is its stepping stone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as A from '../src/engines/arch.js';
import { useLedger, settled, proposals, fileOf } from '../src/engines/ledger.js';
import { collect } from '../scripts/ledger.mjs';
import { guard } from '../scripts/ledger-guard.mjs';
import { rungOfChallenge } from '../src/engines/path.js';
import { GENE_RUNGS, LAYER } from '../src/data/path.js';
import { readWords } from '../scripts/words.mjs';

useLedger(collect());
const EN = readWords();
const FACT = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => [f.id, f]));
const ID = '2026-11-28-gene-open-silicon-lab-nightly-build-c-cmu4';
const noise = () => proposals(settled()).find(e => e.gene === 'carrier' && e.option === 'noise');

test('noise is proposed for the carrier once, in the ledger, and settles as a guess', () => {
  const e = noise();
  assert.ok(e, 'the ledger proposes noise as a carrier');
  assert.equal(e.id, ID);
  assert.equal(e.state, 'guess', 'a guess: no fact backs its traits or its contract yet');
  assert.equal(e.fact, undefined);
  assert.equal(A.proposalWhy(e), null, 'complete: the gene, a new option, its traits and its carry contract');
  assert.equal(proposals(settled()).filter(x => x.gene === 'carrier' && x.option === 'noise').length, 1);
  /* the file is the port's own form, unchanged */
  const raw = readFileSync(new URL('../community/ledger/' + ID + '.json', import.meta.url), 'utf8');
  assert.equal(fileOf(e).text, raw);
});

test('its traits are the guess the issue names: good at sampling and search, poor at exact sums, idles well', () => {
  const x = noise().effect;
  assert.ok(x.energy > 1, 'it spends less on what it is good at');
  assert.ok(x.exact < 0.5, 'poor at exact arithmetic');
  assert.ok(x.flex < 1, 'not for any program');
  assert.equal(x.idle, true, 'a p-bit with nothing to do spends almost nothing');
  const c = noise().carry;
  assert.equal(c.matter, 'silicon', 'today\'s p-bits are made of ordinary transistors');
  assert.ok(c.delay >= 1, 'a fresh random bit is slower than a gate switching');
  assert.equal(c.skips, undefined, 'it still builds every rung');
});

test('who wrote it and how AI was used are said, and the ledger\'s floor lets the nightly build send it', () => {
  const e = noise();
  assert.equal(e.made, 'ai');
  assert.match(e.ai, /Claude/); assert.match(e.ai, /guess/);
  assert.equal(e.github, 'focusxyz11');
  const changes = [{ status: 'A', path: 'community/ledger/' + ID + '.json' }, { status: 'A', path: 'tests/noise.test.mjs' }];
  assert.deepEqual(guard({ changes, author: 'focusxyz11', opened: '2026-11-28T03:00:00Z', entry: e, branch: 'claude/task-noise' }), { ok: true, ledger: true });
});

test('its words say plainly what is shipped, taped out and projected, as the facts do', () => {
  const w = noise().words;
  for (const k of ['Shipped', 'Taped out', 'Projected']) assert.ok(w.includes(k), 'the words say what is ' + k.toLowerCase());
  const z1 = FACT['extropic-z1'], pc = FACT['prob-chips'];
  assert.ok(z1 && pc, 'the facts it rests on exist');
  assert.equal(z1.kind, 'projection');
  assert.match(z1.value, /XTR-0 shipped/); assert.match(z1.value, /Z1 taped out/); assert.match(z1.value, /2027/); assert.match(w, /2027/);
  assert.match(pc.value, /CN101 taped out/); assert.match(w, /CN101/);
  assert.match(pc.detail, /no peer-reviewed benchmark/); assert.match(w, /no peer-reviewed benchmark/);
});

test('nothing in the engine hard-codes it: the option exists because the ledger has it', () => {
  assert.ok(!A.OPTIONS.carrier.includes('noise'));
  assert.ok(!('noise' in A.EFFECT.carrier) && !('noise' in A.CARRY.carrier));
  for (const g of A.GENES) assert.ok(!A.OPTIONS[g].includes('noise'), g + ' has no option noise of the engine\'s own');
  /* without the entry, the genome has no such proposal */
  useLedger(collect().filter(e => e.id !== ID));
  assert.ok(!noise(), 'only the entry brings it');
  useLedger(collect());
  assert.ok(noise());
});

test('the p-bits lab is its stepping stone, on the rung the stack shows it at, and the lattice keeps it in the open column', async () => {
  for (const id of ['noise', 'noise-big']) assert.equal(rungOfChallenge(id), 'switch', id + ' is a stepping stone on the switch');
  assert.ok(GENE_RUNGS.carrier.includes('switch'), 'the carrier is chosen on the switch');
  const lab = readFileSync(new URL('../src/v2/labs/pbits.js', import.meta.url), 'utf8');
  assert.match(lab, /href="#\/stack\/switch"/, 'the lab leads to the stack at the switch');
  assert.ok(EN['pb.genome'] && EN['pb.genome.go'], 'its words');
  const { layerOfGene } = await import('../src/v2/lattice.js');
  assert.equal(layerOfGene(noise().gene), LAYER[GENE_RUNGS.carrier[0]]);
});
