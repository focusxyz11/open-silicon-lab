// How true is each thing (#325, src/data/fidelity.js, docs/SYSTEM.md "How true"): every lab, every lens's measure at
// the block, every level of the dive and every claim of a machine says how far the lab's picture of it goes (an idea
// drawn, real numbers, computed, checked against the real thing), and none goes without; a mark that says "computed"
// names an engine that exists, one that says "real numbers" a figure with its source, and one that says "checked"
// runs here against what was measured.
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { FIDS, rankOf, STATUS_MAX, ENGINES, LABS, KINDS, labFid, LEVELS, LENSES, PAIRS, FRONTS } from '../src/data/fidelity.js';
import { CHALLENGES } from '../src/v2/game.js';
import { WORLDS } from '../src/data/weave.js';
import { MODELS } from '../src/engines/lens.js';
import { MEETS } from '../src/data/frame.js';
import { paints, paintsPair } from '../src/v2/lenspaint.js';
import { MATTERS, STATUS } from '../src/data/inventions.js';
import { LIQUIDS } from '../src/data/liquid.js';
import { FABS } from '../src/data/fabs.js';
import { mark, claimFid, glyph } from '../src/v2/fid.js';
import { readWords } from '../scripts/words.mjs';
import { useTexts } from '../src/core/i18n.js';

const root = new URL('..', import.meta.url);
const FACTS = Object.fromEntries(JSON.parse(readFileSync(new URL('src/data/facts.json', root), 'utf8')).facts.map(f => [f.id, f]));
const EN = readWords();
useTexts(EN);

/* a record says what it rests on, and nothing it does not */
function valid(rec, where) {
  assert.ok(rec && FIDS.includes(rec.f), where + ': no mark, or not one of ' + FIDS.join(', '));
  if (rec.f === 'computed' || rec.f === 'checked') {
    assert.ok(rec.by && ENGINES[rec.by], where + ': ' + rec.f + ' names no engine of ENGINES');
  } else assert.ok(!rec.by, where + ': an ' + rec.f + ' is not run by an engine');
  if (rec.f === 'figures' || rec.f === 'checked') assert.ok(rec.fact && FACTS[rec.fact], where + ': ' + rec.f + ' rests on no figure of facts.json (' + rec.fact + ')');
  /* an idea may name where it comes from (a guess's source): it is still drawn, not measured */
}

test('the four marks, from least to most true, and every engine a mark names exists', () => {
  assert.deepEqual(FIDS, ['idea', 'figures', 'computed', 'checked']);
  assert.ok(rankOf('idea') < rankOf('figures') && rankOf('figures') < rankOf('computed') && rankOf('computed') < rankOf('checked'));
  for (const [id, file] of Object.entries(ENGINES)) assert.ok(existsSync(new URL(file, root)), id + ': ' + file + ' does not exist');
});

test('every lab says how true it is', () => {
  for (const c of CHALLENGES) valid(labFid(c), 'challenge ' + c.id);
  /* the challenges the ledger makes: a design kept, to be broken */
  valid(labFid({ id: 'break:x', kind: 'break' }), 'a break');
  valid(labFid({ id: 'job:x', kind: 'design', need: 'x' }), 'a job of the Lab');
  /* and nothing is marked that is not a challenge */
  const ids = new Set(CHALLENGES.map(c => c.id));
  assert.deepEqual(Object.keys(LABS).filter(id => !ids.has(id)), [], 'marks for challenges that do not exist');
  Object.entries(KINDS).forEach(([k, r]) => valid(r, 'kind ' + k));
});

test('every level of the dive says how true its picture is', () => {
  const dives = WORLDS.filter(w => !w.line).flatMap(w => w.depths);
  for (const d of new Set(dives)) valid(LEVELS[d], 'level ' + d);
  assert.deepEqual(Object.keys(LEVELS).filter(d => !dives.includes(d)), [], 'marks for levels the dive does not have');
});

test('every lens\'s measure at the block says how true it is, and so does every pair held there', () => {
  const at = Object.keys(MODELS).filter(q => paints(q, 'block'));
  assert.ok(at.length >= 6, 'the block\'s lenses paint: ' + at.join(', '));
  for (const q of Object.keys(MODELS)) valid(LENSES[q], 'lens ' + q);
  assert.deepEqual(Object.keys(LENSES).filter(q => !MODELS[q]), [], 'marks for lenses with no model');
  /* a pair is drawn as one model's (a front, a chain, memory that computes) or as its two lenses side by side */
  let held = 0;
  for (const m of MEETS) {
    if (!paintsPair(m.a, m.b, 'block')) continue; held++;
    const k = m.a + '.' + m.b;
    if (m.shape === 'front' || m.shape === 'chain' || m.fork) valid(PAIRS[k], 'pair ' + k);
    else { valid(LENSES[m.a], 'pair ' + k + ', ' + m.a); valid(LENSES[m.b], 'pair ' + k + ', ' + m.b); }
  }
  assert.ok(held >= 3, 'pairs held at the block: ' + held);
  for (const k of Object.keys(PAIRS)) assert.ok(MEETS.some(m => m.a + '.' + m.b === k), k + ' is not a pair of MEETS');
  /* a front is drawn only where one model computes both its measures */
  for (const m of MEETS.filter(x => x.shape === 'front')) assert.equal(PAIRS[m.a + '.' + m.b].f, 'computed', m.a + '.' + m.b);
  valid(FRONTS.machines, 'the machine\'s front');
});

test('every claim of a machine says how the lab knows it, and a guess is never more than an idea drawn', () => {
  const claims = [];
  MATTERS.forEach(m => m.claims.forEach(c => claims.push(['invent ' + c.id, c])));
  LIQUIDS.forEach(L => { claims.push(['liquid ' + L.id + ' energy', L.energy], ['liquid ' + L.id + ' reshape', L.reshape]); L.notes.forEach(n => claims.push(['liquid ' + n.id, n])); });
  FABS.forEach(f => f.claims.forEach(c => claims.push(['fab ' + c.id, c])));
  assert.ok(claims.length >= 35, claims.length + ' claims');
  for (const [where, c] of claims) {
    assert.ok(STATUS.includes(c.status), where + ': status');
    const r = claimFid(c); valid(r, where);
    assert.ok(rankOf(r.f) <= rankOf(STATUS_MAX[c.status]), where + ': a ' + c.status + ' cannot be ' + r.f);
    if (r.f === 'computed') assert.ok(c.engine, where + ': computed, but by no engine');
    if (c.engine && c.status !== 'guess') assert.equal(r.f, 'computed', where + ': an engine runs it, so it is computed');
  }
});

/* "checked" means the engine, run here, gives what was measured */
const near = (a, b, tol, msg) => assert.ok(Math.abs(a / b - 1) <= tol, msg + ': ' + a + ' against ' + b);
const CHECKS = {
  /* the fab's days per layer, against the industry's cycle time: about a day a layer (40 days for 40–50 layers at 28 nm,
     80–85 days for 80–85 layers at 7 nm) */
  'fab-cycle-time': async () => {
    assert.match(FACTS['fab-cycle-time'].value, /40–50 layers, about 40 days/); assert.match(FACTS['fab-cycle-time'].value, /80–85 layers, 80–85 days/);
    const { model, START } = await import('../src/engines/chip.js'), d = model(START).perLayer;
    assert.ok(d >= 0.8 && d <= 1.5, 'days a layer: ' + d);
  },
  /* the EUV scanner at today's 600 W prints what the real one is sold for */
  'euv-throughput': async () => {
    assert.match(FACTS['euv-throughput'].value, /230 wafers per hour/);
    const { euv } = await import('../src/engines/litho.js'); near(euv().wph, 230, 0.02, 'wafers an hour');
  },
  /* the errors engine's stops in a training run, against Llama 3's 419 in 54 days on 16,384 GPUs */
  'llama3-interruptions': async () => {
    assert.match(FACTS['llama3-interruptions'].value, /419 unexpected interruptions in 54 days on 16,384 GPUs/);
    const X = await import('../src/engines/errors.js'), r = X.errors('datacentre', {}), h = X.ENVIRONMENTS.datacentre.seconds / 3600;
    near(r.bySource.crash.raw / 1e9 / h * 54 * 24 * 16384, 419, 0.05, 'stops in the training run');
  }
};
test('every mark that says checked is checked here, against what was measured', async () => {
  const all = Object.entries(LABS).concat(Object.entries(LEVELS), Object.entries(LENSES), Object.entries(PAIRS), Object.entries(FRONTS)).filter(([, r]) => r.f === 'checked');
  assert.ok(all.length >= 3, 'things checked: ' + all.length);
  for (const [id, r] of all) { assert.ok(CHECKS[r.fact], id + ': checked against ' + r.fact + ', but no check runs it'); await CHECKS[r.fact](); }
});

test('every mark has its words, and is drawn as a mark that can be tapped', () => {
  for (const f of FIDS) { assert.ok(EN['fid.' + f + '.t'], 'fid.' + f + '.t'); assert.ok(EN['fid.' + f + '.line'], 'fid.' + f + '.line'); }
  for (const id of Object.keys(ENGINES)) assert.ok(EN['fid.by.' + id], 'fid.by.' + id);
  for (const s of STATUS) assert.ok(EN['invent.status.' + s + '.line'], 'invent.status.' + s + '.line');
  const h = mark(LABS.months);
  assert.match(h, /^<button type="button" class="fid f-checked"/); assert.match(h, /data-fidby="chip"/); assert.match(h, /data-fidfact="fab-cycle-time"/);
  assert.ok(h.includes(EN['fid.checked.t']));
  assert.equal(mark(null), ''); assert.equal(mark({ f: 'sure' }), '');
  /* the glyph: four steps, as many filled as the mark is true */
  FIDS.forEach((f, i) => assert.equal((glyph(f).match(/<rect /g) || []).length - (glyph(f).match(/class="o"/g) || []).length, i + 1, f));
  /* a claim's engine is named by its file */
  assert.equal(claimFid(MATTERS.find(m => m.id === 'cim').claims[0]).by, 'paradigms');
});
