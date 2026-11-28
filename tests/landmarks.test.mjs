// The 2026 landmarks on the field (#495, src/engines/arch.js LANDMARKS): several may stand on one recipe, each with its
// own status and fact; each one's outline on the field is the evidence behind its numbers, read from its fact's kind in
// src/data/facts.json (a maker's claim, reported independently, peer-reviewed), and a claim never draws stronger than
// it is; a landmark that makes a recipe newly built joins the scores only when the next season opens (#480).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as A from '../src/engines/arch.js';
import * as F from '../src/engines/population.js';

const FACTS = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(FACTS.facts.map(f => [f.id, f])), factOf = id => byId[id];
const EN = Object.assign({}, ...['labs', 'stack'].map(a => JSON.parse(readFileSync(new URL('../src/i18n/en/' + a + '.json', import.meta.url), 'utf8'))));
const lm = id => A.LANDMARKS.find(k => k.id === id);

test('every landmark rests on a fact of facts.json (or none yet), has a name, and stands on a recipe of the 400', () => {
  assert.equal(new Set(A.LANDMARKS.map(k => k.id)).size, A.LANDMARKS.length, 'each landmark once');
  for (const k of A.LANDMARKS) {
    assert.ok(EN['ar.known.' + k.id], k.id + ': a name');
    assert.ok(['product', 'lab'].includes(k.status), k.id);
    assert.ok(A.isKey(A.keyOf(k.g)), k.id + ': a recipe of the 400');
    if (k.fact) assert.ok(factOf(k.fact), k.id + ': facts.json ' + k.fact);
    assert.ok(k.from == null || (Number.isInteger(k.from) && k.from >= 2), k.id + ': counts from the first season, or a later one');
  }
});

test('a model wired into silicon stands on the field: wired for one job, computing in or near its memory', () => {
  const h = lm('hc1');
  assert.ok(h, 'Taalas HC1 is a landmark');
  assert.equal(h.fact, 'taalas-hc1'); assert.equal(h.g.told, 'fixed');
  assert.ok(['in', 'near'].includes(h.g.where), 'the engine picks in or near');
  assert.ok(A.landmarksOf(h.g).includes(h));
  assert.ok(F.builtAttempts().some(a => a.landmarks.some(x => x.id === 'hc1')), 'a point on the field');
});

test('the wafer and the LPU share one point that opens both, each with its own status and fact', () => {
  const w = lm('wafer'), l = lm('lpu');
  assert.equal(A.keyOf(w.g), A.keyOf(l.g), 'the same four choices');
  assert.deepEqual(w.g, { where: 'near', carrier: 'charge', told: 'graph', shape: 'grid' });
  assert.equal(w.fact, 'cerebras-cs4'); assert.equal(l.fact, 'groq3-lpu');
  const pts = F.builtAttempts().filter(a => a.key === A.keyOf(w.g));
  assert.equal(pts.length, 1, 'one point');
  assert.deepEqual(pts[0].landmarks.map(x => [x.id, x.status, x.fact]), [['wafer', w.status, w.fact], ['lpu', l.status, l.fact]]);
  assert.deepEqual(A.knownOf(w.g).landmarks.map(x => x.id), ['wafer', 'lpu'], 'knownOf gives the recipe with its list of landmarks');
  /* still one built recipe each: the field's points never repeat */
  assert.equal(new Set(A.KNOWN.map(k => A.keyOf(k.g))).size, A.KNOWN.length);
  assert.equal(A.FIELD_LANDMARKS.length, new Set(A.LANDMARKS.map(k => A.keyOf(k.g))).size);
});

test('evidence is read from each fact\'s kind: every kind has a level, and a claim never draws as independent', () => {
  for (const kind of Object.keys(FACTS.kinds)) assert.ok(A.EVIDENCE.includes(A.EVIDENCE_OF[kind]), kind + ': a level of evidence');
  for (const ev of A.EVIDENCE) assert.ok(EN['sk.ev.' + ev], ev + ': in words');
  assert.ok(EN['sk.ev.none']);
  /* every claim in facts.json, alone or beside a landmark reported independently, draws as a claim */
  const ind = A.LANDMARKS.find(k => k.fact && factOf(k.fact).kind === 'reported');
  for (const f of FACTS.facts.filter(x => x.kind === 'claim')) {
    assert.equal(A.evidenceOf(f), 'claim', f.id);
    const k = { id: 'x', fact: f.id };
    assert.equal(A.landmarkEvidence(k, factOf), 'claim', f.id);
    assert.equal(A.pointEvidence([ind, k], factOf), 'claim', f.id + ' beside an independent report');
    assert.equal(A.pointEvidence([k, ind], factOf), 'claim', f.id + ' in either order');
  }
  for (const k of A.LANDMARKS) if (k.fact && factOf(k.fact).kind === 'claim') assert.notEqual(A.pointEvidence(A.landmarksOf(k.g), factOf), 'independent', k.id);
  /* the 2026 landmarks are the makers' claims (17,000 tokens a second claimed, 15,000 to 16,000 seen) */
  for (const id of ['hc1', 'lpu', 'wafer']) assert.equal(A.landmarkEvidence(lm(id), factOf), 'claim', id);
  assert.equal(A.pointEvidence(A.landmarksOf(lm('wafer').g), factOf), 'claim');
  /* never stronger than it is: an unknown kind, a fact not read yet, or no fact at all */
  assert.equal(A.evidenceOf({ kind: 'trust me' }), 'claim'); assert.equal(A.evidenceOf({ kind: 'toString' }), 'claim'); assert.equal(A.evidenceOf(undefined), 'claim');
  assert.equal(A.landmarkEvidence(lm('hc1'), () => undefined), 'claim', 'before facts.json arrives');
  assert.equal(A.landmarkEvidence(lm('cim'), factOf), null, 'no fact: no evidence');
  assert.equal(A.pointEvidence([lm('cim')], factOf), 'claim', 'a point with no source draws as weak as a claim');
  assert.equal(A.pointEvidence([], factOf), null);
  /* the three levels in order, the weakest first */
  assert.equal(A.evidenceOf({ kind: 'reported' }), 'independent'); assert.equal(A.evidenceOf({ kind: 'peer' }), 'peer');
  assert.equal(A.pointEvidence([{ fact: 'p' }, { fact: 'r' }], id => ({ p: { kind: 'peer' }, r: { kind: 'reported' } })[id]), 'independent');
  assert.equal(A.pointEvidence([{ fact: 'p' }], () => ({ kind: 'peer' })), 'peer');
});

test('a landmark that makes a recipe newly built joins the scores when the next season opens, never in the middle of one', () => {
  for (const k of A.LANDMARKS) {
    const scored = A.scoredNow(k), K = A.knownOf(k.g);
    if (scored) assert.ok(K && K.landmarks.includes(k), k.id + ' counts: its recipe is built');
    else { assert.ok((k.from || 1) > A.VERSION, k.id); if (!A.LANDMARKS.some(x => x !== k && A.scoredNow(x) && A.keyOf(x.g) === A.keyOf(k.g))) assert.equal(K, null, k.id + ' waits: its recipe is scored as nobody has built it'); }
  }
  /* the HC1 point stands on the field, grown as its recipe is scored this season */
  const h = lm('hc1');
  if (!A.scoredNow(h)) {
    const p = F.builtAttempts().find(a => a.key === A.keyOf(h.g));
    assert.equal(p.waits, true); assert.deepEqual(p.st.start, A.start(h.g).start);
    assert.ok(EN['sk.land.waits']);
    assert.equal(A.goalOf(A.start(h.g), 'archniche').fresh, true, 'still new for the goals this season');
  }
  /* a landmark joining a recipe already built counts at once (it changes no score) */
  assert.ok(A.scoredNow(lm('lpu')));
});
