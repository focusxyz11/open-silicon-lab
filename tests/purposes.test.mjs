// Purposes: the needs of the field grow too (#481). Anyone, a person or an agent, proposes a need just past what any
// recipe does (src/engines/arch.js purposeWhy), as an entry of the community's ledger (kind purpose). The tests check a
// proposal is complete, new, neither too easy nor too hard, that it carries its season, that the first attempt to win it
// is credited with its proposer, and that the open need now is read from the entries alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as A from '../src/engines/arch.js';
import { useLedger, settle, settled, draft, tryEntry, fileOf, purposesOf, archAttempts } from '../src/engines/ledger.js';
import { collect } from '../scripts/ledger.mjs';
import * as Pop from '../src/engines/population.js';

useLedger(collect());
const EN = Object.assign({}, ...['design', 'place', 'stack'].map(a => JSON.parse(readFileSync(new URL('../src/i18n/en/' + a + '.json', import.meta.url), 'utf8'))));
const day = '2026-11-28';
/* just past what any recipe does: a decade alone in the cold, reading exactly */
const good = { purpose: 'glacier', name: 'A glacier logger', what: 'A logger frozen into the ice for twenty years, reading exactly and never repaired.', w: { rugged: 1.5, energy: 0.5 }, must: { rugged: 3, exact: 0.9 } };
const at = (p, name, extra) => draft(Object.assign({ kind: 'purpose', season: A.VERSION, by: 'Ada', made: 'person', words: '' }, p, extra || {}), name, day);

test('every purpose in the ledger is complete and new, and the lab\'s example says how it was written', () => {
  const W = settled(), P = purposesOf(W);
  assert.ok(P.all.length >= 1, 'the ledger holds an example of the form');
  assert.ok(P.all.some(e => e.made === 'example' && /Claude/.test(e.ai)), 'one example by the lab, saying in its ai field how it was written');
  assert.ok(!W.refused.some(e => /-purpose-/.test(e.id)), 'no purpose refused');
  const ids = new Set();
  for (const e of P.all) { assert.ok(!ids.has(e.purpose) && !A.NEEDS.includes(e.purpose), e.id); ids.add(e.purpose); assert.ok(['proposed', 'met'].includes(e.state)); assert.ok(EN['ledger.state.' + e.state]); }
});

test('a purpose must have an id of its own, weights and musts in WANT\'s form, and be new', () => {
  assert.equal(A.purposeWhy(good), null);
  for (const [bad, why] of [
    [{ purpose: 'model' }, 'purpose'], [{ purpose: 'Glacier' }, 'purpose'], [{ purpose: 'g' }, 'purpose'], [{ purpose: 7 }, 'purpose'], [{ purpose: 'a glacier' }, 'purpose'],
    [{ w: {} }, 'weights'], [{ w: { speed: 1 } }, 'weights'], [{ w: { energy: 0 } }, 'weights'], [{ w: { energy: 4 } }, 'weights'], [{ w: { energy: '1' } }, 'weights'], [{ w: [1] }, 'weights'], [{ w: null }, 'weights'],
    [{ must: { rugged: 0 } }, 'musts'], [{ must: { rugged: 20 } }, 'musts'], [{ must: { luck: 1 } }, 'musts'], [{ must: [1] }, 'musts']])
    assert.equal(A.purposeWhy(Object.assign({}, good, bad)), why, JSON.stringify(bad));
  assert.equal(A.purposeWhy(good, { ids: ['glacier'] }), 'purpose', 'an id proposed before');
  /* a need's own weights and musts under another name are the same need */
  assert.equal(A.purposeWhy(Object.assign({}, good, { purpose: 'rover-two', w: A.WANT.rover.w, must: A.WANT.rover.must })), 'same');
  assert.equal(A.purposeWhy(good, { wants: [A.wantKey(A.wantOf(good))] }), 'same');
});

test('not too easy, not too hard: checked by the engine against what is built and what is kept', () => {
  /* too easy: something built beats today's computer at it now (spending little is what a custom chip does) */
  assert.equal(A.purposeWhy({ purpose: 'cheap', w: { energy: 2 }, must: {} }), 'easy');
  /* too hard: no recipe of the 400 could ever beat today's computer at it */
  const hard = { purpose: 'everything', w: { flex: 3 }, must: { flex: 2 } };
  assert.equal(A.purposeWhy(hard), 'hard'); assert.ok(A.bestPotential(A.wantOf(hard)) <= 1);
  /* an attempt already kept counts: if any state given wins it, it is too easy */
  const st = A.KNOWN.filter(k => A.novelty(k.g)).map(k => A.start(k.g));
  assert.ok(st.every(s => !A.scoreFor(s, A.wantOf(good)).wins), 'nothing built wins the glacier yet');
  const fake = Object.assign({}, st[0], { g: A.recipeOf('near/charge/events/swarm'), start: Object.fromEntries(A.DIRS.map(d => [d, 1])), tries: Object.fromEntries(A.DIRS.map(d => [d, 1e9])) });
  if (A.scoreFor(fake, A.wantOf(good)).wins) assert.equal(A.purposeWhy(good, { states: [fake] }), 'easy');
  /* today's computer is level with itself at any purpose */
  assert.deepEqual(A.scoreFor(A.start(A.TODAY), A.wantOf(good)), { now: 1, could: 1, can: true, wins: false });
  /* a purpose is judged as a steady need over the five directions evenly */
  assert.ok(Math.abs(Object.values(A.PURPOSE_DIRS).reduce((a, b) => a + b, 0) - 1) < 1e-12);
});

test('the ledger checks a purpose in its season, in plain words, and every refusal has words a proposer can act on', () => {
  const a = at(good, 'ada glacier');
  assert.equal(tryEntry(a).ok, true);
  assert.equal(tryEntry(at(good, 'bo glacier', { by: 'Bo' }), [a]).reason, 'purpose', 'the same id again');
  assert.equal(tryEntry(at(Object.assign({}, good, { purpose: 'ice' }), 'bo ice', { by: 'Bo' }), [a]).reason, 'same', 'the same want under another id');
  assert.equal(tryEntry(at(Object.assign({}, good, { what: 'Short.' }), 'ada short')).reason, 'words');
  assert.equal(tryEntry(at(Object.assign({}, good, { name: 'See www.x.y' }), 'ada link')).reason, 'words');
  assert.equal(tryEntry(at(good, 'ada s', { season: A.VERSION + 1 })).reason, 'season');
  assert.equal(tryEntry(at(good, 'ada ai', { made: 'ai', ai: '' })).reason, 'sayAI');
  assert.equal(tryEntry(Object.assign({}, a, { gene: 'shape' })).reason, 'fields');
  for (const why of ['purpose', 'weights', 'musts', 'same', 'easy', 'hard', 'season']) assert.ok(EN['ledger.no.' + why], why);
  assert.match(fileOf(a).path, /^community\/ledger\/2026-11-28-purpose-/);
  /* a closed season's purpose is kept as history, not judged again by today's engine */
  const W = settle([at(Object.assign({}, good, { w: { energy: 2 }, must: {} }), 'old cheap', { season: 1 })], { version: 2, past: {} });
  assert.equal(W.entries[0].state, 'past'); assert.deepEqual(purposesOf(W).all, []); assert.equal(purposesOf(W).past.length, 1);
});

test('the first attempt that wins a purpose is credited, and so is its proposer; the open need now is the furthest from won', () => {
  const p = at(good, 'ada glacier'), q = at({ purpose: 'abyss', name: 'An abyss probe', what: 'A probe at the bottom of a trench, reading exactly for a decade.', w: { rugged: 1, energy: 0.5 }, must: { rugged: 3 } }, 'bo abyss', { by: 'Bo' });
  /* grow recipes until one wins the glacier: people first, then the engine's suggestion */
  let win = null;
  for (const g of A.allRecipes().filter(g => A.novelty(g) >= 2 && A.potentialFor(g, A.wantOf(good)) > 1).slice(0, 40)) {
    const h = { start: A.keyOf(g), years: [] }; let s = A.start(g);
    for (let y = 0; y < A.HIST_YEARS && !A.scoreFor(s, A.wantOf(good)).wins; y++) { const F = y < 10 ? ['people', 'errors'] : ['errors', 'device']; h.years.push(F); s = A.year(s, F); }
    if (A.scoreFor(s, A.wantOf(good)).wins) { win = { h, s }; break; }
  }
  assert.ok(win, 'some recipe can be grown to win the glacier');
  const att = draft({ kind: 'try', arch: A.histClaim(win.h, A.winsOf(win.s)), season: A.VERSION, by: 'Cy', made: 'person', words: '' }, 'cy glacier', '2026-11-29');
  const later = draft({ kind: 'try', arch: A.histClaim(Object.assign({}, win.h, { years: win.h.years.concat([['tools']]) }), A.winsOf(A.year(win.s, ['tools']))), season: A.VERSION, by: 'Di', made: 'ai', ai: 'An agent grew it a year longer.', words: '' }, 'di glacier', '2026-11-30');
  const W = settle(collect().concat([p, q, att, later]));
  assert.deepEqual(W.refused.map(e => e.id + ' ' + e.reason), []);
  assert.equal(W.byId[p.id].wonBy, att.id); assert.equal(W.byId[p.id].state, 'met');
  assert.ok(W.byId[att.id].firstFor.includes('glacier')); assert.ok(!W.byId[later.id].firstFor.includes('glacier'), 'the first win only');
  /* the open need now: among the purposes not yet won, the one the best recipe comes least close to */
  const open = purposesOf(W).all.filter(e => !e.wonBy), now = W.byId[purposesOf(W).open];
  if (open.length) assert.ok(open.includes(now) && open.every(e => e.closest >= now.closest), 'the furthest from being won');
  else assert.equal(purposesOf(W).open, null, 'every purpose won: no open need now');
  /* with only the purposes and no attempt that wins them, the open need now is the one the best comes least close to */
  const W3 = settle(collect().concat([p, q])), o3 = purposesOf(W3).all.filter(e => !e.wonBy), n3 = W3.byId[purposesOf(W3).open];
  assert.ok(o3.length >= 2 && o3.every(e => e.closest >= n3.closest && e.closest < 1));
  /* on the field: the winner's credit travels with its attempt */
  const atts = Pop.ledgerAttempts(archAttempts(W).all);
  assert.ok(atts.find(a => a.id === att.id).firstFor.includes('glacier'));
  /* a purpose proposed after an attempt that already wins it is refused as too easy */
  const W2 = settle(collect().concat([att, at(good, 'ada glacier late', {}, '2026-12-01')]).map(e => (e.kind === 'purpose' && /late/.test(e.id) ? Object.assign({}, e, { id: e.id.replace('2026-11-28', '2026-12-01') }) : e)));
  assert.equal(W2.refused.filter(e => e.kind === 'purpose').map(e => e.reason).join(), 'easy');
});
