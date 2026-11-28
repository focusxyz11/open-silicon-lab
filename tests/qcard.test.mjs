/* A card for each core question (#517, src/v2/qcard.js at #/q/<id>): every question has its card and its words, every
   number in a True line has its fact, a card shows one question only (never a row of the thirteen), and the two
   small engines its pictures need: an elementary cellular automaton and fixed or fluid. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { useTexts } from '../src/core/i18n.js';
import { esc } from '../src/core/esc.js';
import { readWords } from '../scripts/words.mjs';
import { QUESTIONS, MARKS, RISES } from '../src/data/frame.js';
import { CARDS, WHY } from '../src/data/cards.js';
import { next, bit, run, start } from '../src/engines/automaton.js';
import { share, N, GAIN } from '../src/engines/fixedfluid.js';

const EN = readWords();
useTexts(EN);
const FACTS = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => [f.id, f]));
const IDS = QUESTIONS.map(q => q.id);

test('every core question has a card, and every card is a core question', () => {
  assert.deepEqual(Object.keys(CARDS).sort(), IDS.slice().sort());
  for (const id of IDS) {
    const C = CARDS[id];
    assert.ok([1, 2, 3].includes(C.pic), id + ': its picture is in one of src/v2/qcpics1.js to 3');
    for (const k of ['stand', 'cap', 'h', 'h0', 'h1', 'true', ...WHY.map(x => 'why.' + x)]) assert.ok(EN['qc.' + id + '.' + k], id + ': no words for qc.' + id + '.' + k);
    assert.ok(C.open ? EN[C.open] && !EN['qc.' + id + '.open'] : EN['qc.' + id + '.open'], id + ': its Still open, written once');
    if (C.ask) assert.ok(EN['field.' + C.ask + '.q'], id + ': its question from the field');
    if (C.two) for (const k of ['v', 'v0', 'v1']) assert.ok(EN['qc.' + id + '.' + k], id + ': a second control needs qc.' + id + '.' + k);
    else assert.ok(!EN['qc.' + id + '.v'], id + ': words for a second control it does not have');
    if (C.src) assert.ok(EN['qc.' + id + '.src'], id + ': its own source needs words');
  }
});

test('every picture module draws the cards that say they are in it', async () => {
  const mods = { 1: await import('../src/v2/qcpics1.js'), 2: await import('../src/v2/qcpics2.js'), 3: await import('../src/v2/qcpics3.js') };
  for (const id of IDS) {
    const P = mods[CARDS[id].pic].PICS[id];
    assert.ok(P && typeof P.frame === 'function' && P.u0 >= 0 && P.u0 <= 1, id + ': a picture with a frame and a start');
    assert.equal(P.v0 != null, !!CARDS[id].two, id + ': a second control in the picture exactly when the card says so');
  }
});

test('every number in a True line is in one of its facts (years aside), and every fact is real', () => {
  for (const id of IDS) {
    const C = CARDS[id], F = C.facts.map(k => FACTS[k]);
    F.forEach((f, i) => assert.ok(f, id + ': no fact ' + C.facts[i] + ' in src/data/facts.json'));
    const text = F.map(f => [f.value, f.detail, f.label, f.source].join(' ')).join(' ').replace(/(\d),(\d)/g, '$1$2');
    const nums = (EN['qc.' + id + '.true'].replace(/(\d),(\d)/g, '$1$2').match(/\d+(\.\d+)?/g) || []).filter(n => !/^(19|20)\d\d$/.test(n));
    /* a card whose source is the lab's own model names a 1 as a bit, not a figure */
    if (!C.src) for (const n of nums) assert.ok(new RegExp('(^|[^\\d.])' + n.replace('.', '\\.') + '([^\\d]|$)').test(text), id + ': the True line\'s ' + n + ' is in none of its facts (' + C.facts.join(', ') + ')');
    if (!C.src) assert.ok(F.length, id + ': a True line with no source');
  }
  assert.ok(/2004/.test(FACTS['rule110-cook'].value) && /Cook/.test(FACTS['rule110-cook'].source), 'Rule 110: Cook 2004');
});

test('a card renders one question only: never a row, list or menu of the thirteen', async () => {
  const { cardHtml, footOf, risesOf, meetsOf } = await import('../src/v2/qcard.js');
  for (const id of IDS) {
    const h = cardHtml(id);
    assert.equal((h.match(/<h1/g) || []).length, 1, id + ': one question, written once');
    assert.ok(h.includes(esc(EN[QUESTIONS.find(q => q.id === id).word])), id + ': its question whole');
    const others = IDS.filter(o => o !== id && h.includes(esc(EN[QUESTIONS.find(q => q.id === o).word])));
    assert.deepEqual(others, [], id + ': another question written on its card');
    const marks = (h.match(/data-meet="/g) || []).length;
    assert.equal(marks, meetsOf(id).length, id + ': only the questions it meets, as marks');
    assert.ok(marks < IDS.length - 1, id + ': it meets fewer than all the others, so its marks are never the thirteen');
    /* where it lives is read from the frame's data: a lit cell for each level with its mark, each rung where it rises */
    const lit = footOf(id).reduce((s, p) => s + p.levels.filter(l => l.on).length, 0);
    assert.equal(lit, footOf(id).reduce((s, p) => s + p.levels.filter(l => MARKS[l.d] && MARKS[l.d][id]).length, 0));
    assert.deepEqual(risesOf(id), [...new Set(RISES.filter(r => r.q === id).map(r => r.rung))]);
    assert.ok((h.match(/data-go="/g) || []).length >= risesOf(id).length, id + ': its rungs are ways in');
  }
});

test('the elementary automaton: eight bits a rule, read by the neighbourhood', () => {
  assert.deepEqual([7, 6, 5, 4, 3, 2, 1, 0].map(m => bit(110, m)), [0, 1, 1, 0, 1, 1, 1, 0], 'rule 110 is 01101110');
  const row = Uint8Array.from([0, 0, 0, 1, 0, 0, 0]);
  assert.deepEqual([...next(row, 90)], [0, 0, 1, 0, 1, 0, 0], 'rule 90: a cell is its two neighbours apart');
  assert.deepEqual([...next(Uint8Array.from([1, 0, 0, 0]), 90)], [0, 1, 0, 1], 'the row is a ring');
  const s = start(64, 3);
  assert.deepEqual([...s], [...start(64, 3)], 'the same seed, the same start');
  assert.deepEqual(run(0, s).verdict, { from: 1, period: 1, all: true }, 'rule 0: one colour from the first row');
  assert.deepEqual(run(204, s).verdict, { from: 0, period: 1, all: false }, 'rule 204 copies each cell: it stands still');
  assert.equal(run(51, s).verdict.period, 2, 'rule 51 turns every cell over: it repeats every two rows');
  const r = run(30, s, { keep: 10, limit: 500 });
  assert.equal(r.rows.length, 10); assert.ok(r.gen <= 500);
});

test('fixed or fluid: the fixed part is cheap for what it was built for, and turns the rest away', () => {
  const fluid = share({ cols: 0, known: 0.5 });
  assert.equal(fluid.away, 0); assert.equal(fluid.energy, 1, 'all fluid: every job at full energy');
  const fixed = share({ cols: 12, known: 1 });
  assert.equal(fixed.away, 0); assert.ok(Math.abs(fixed.energy - 1 / GAIN) < 1e-12, 'all fixed, the work as designed: a fiftieth of the energy');
  const moved = share({ cols: 12, known: 0.5 });
  assert.equal(moved.away, N / 2); assert.equal(moved.idle, N / 2, 'the work moved on: half turned away, half the chip idle');
  const mix = share({ cols: 6, known: 0.8 });
  assert.equal(mix.F + mix.L, N); assert.equal(mix.fDone + mix.lDone + mix.away, N);
  assert.ok(mix.energy < 1 && mix.energy > 1 / GAIN);
});
