// What design really is (content/design.md, src/v2/studio-look.js): every studio step's card leads with a question
// that says what is true there and what people are trying, names the practice, and has an engine reading for it;
// the document links only to what exists and names the open path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { stopsAt } from '../src/data/places.js';
import { FIGURES } from '../src/data/weave.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const FACT = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => [f.id, f]));
const STEPS = ['need', 'logic', 'check', 'gates', 'layout', 'masks'];
const MD = readFileSync(new URL('../content/design.md', import.meta.url), 'utf8');

test('every studio step leads with a question that says what is true, what people try, and its practice', () => {
  const lead = { need: 'idea.need', logic: 'think.logic', check: 'fail.check', gates: 'fail.gates', layout: 'fail.layout', masks: 'idea.masks' };
  for (const s of STEPS) {
    const k = stopsAt(s)[0];
    assert.equal(k, lead[s], s + ': the card leads with ' + k);
    assert.ok(EN['stop.' + k + '.q'] && EN['stop.' + k + '.note'], k);
    assert.ok(Array.isArray(EN['stop.' + k + '.tried']) && EN['stop.' + k + '.tried'].length >= 2, k + ': what people are trying');
    assert.ok(EN['studio.practice.' + s] && EN['studio.k.' + s], s + ': its practice and its engine reading');
  }
});

test('the practice names the open path: open PDKs, open tools and shared runs, each where it applies', () => {
  const P = STEPS.map(s => EN['studio.practice.' + s]).join(' ');
  for (const w of ['Verilog', 'Yosys', 'OpenROAD', 'OpenLane', 'SKY130', 'GF180', 'Tiny Tapeout', 'PDK']) assert.ok(P.includes(w), w);
  /* the numbers in the practice come from facts the step's question shows */
  assert.ok(FIGURES['fail.layout'].includes('sky130-rules') && /0\.14/.test(FACT['sky130-rules'].value));
  assert.ok(FIGURES['fail.check'].includes('first-silicon') && /14%/.test(FACT['first-silicon'].value));
  assert.ok(FIGURES['idea.masks'].includes('sky130-masks') && FIGURES['idea.masks'].includes('tt-sky26b'));
});

test('the document: every step in order, linked from its world, and every link resolves', () => {
  const h2 = [...MD.matchAll(/^## (.+)$/gm)].map(m => m[1]);
  ['The job', 'Describe', 'Check', 'Gates', 'Timing', 'Layout', 'Masks', 'The open path'].forEach((s, i) => assert.ok(h2[i] && h2[i].includes(s), 'section ' + s));
  assert.ok(readFileSync(new URL('../content/idea.md', import.meta.url), 'utf8').includes('](design.md)'));
  for (const [, href] of MD.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https:\/\//.test(href)) continue;
    assert.ok(existsSync(new URL('../content/' + href, import.meta.url)), href);
  }
  for (const f of ['sky130-pdk', 'gf180-pdk', 'sky130-masks', 'tt-sky26b', 'tt-clock', 'verilog-ieee', 'efabless-close']) assert.ok(MD.includes(FACT[f].url), f + ': its source is cited');
});
