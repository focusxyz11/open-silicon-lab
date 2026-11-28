// The field of every attempt (#448, src/engines/population.js): every point comes from the ledger (or is a recipe
// someone has built), each niche has its champion, the first attempt at an untried recipe is credited, and what changed
// since your last visit (new attempts, a champion deposed) is read against what the browser kept.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../src/engines/arch.js';
import * as F from '../src/engines/population.js';
import { useLedger, settle, settled, draft, archAttempts } from '../src/engines/ledger.js';
import { collect } from '../scripts/ledger.mjs';

useLedger(collect());
const day = '2026-11-27';
const at = (h, name, extra) => draft(Object.assign({ kind: 'try', arch: A.histClaim(h, A.replay(Object.assign({ wins: [] }, h)).wins), by: 'Ada', made: 'person', words: 'An attempt.' }, extra || {}), name, day);
const kept = W => (W.arch || []).map(id => W.byId[id]);

test('every point on the field is a built recipe or an attempt the ledger keeps, grown again by the engine', () => {
  const W = settled(), P = F.population(kept(W));
  /* one point per recipe someone has built, however many landmarks stand on it (#495) */
  assert.equal(P.filter(a => a.built).length, A.FIELD_LANDMARKS.length);
  assert.equal(new Set(P.filter(a => a.built).map(a => a.key)).size, A.FIELD_LANDMARKS.length);
  assert.equal(P.filter(a => a.built).reduce((n, a) => n + a.landmarks.length, 0), A.LANDMARKS.length, 'every landmark on the field');
  const L = P.filter(a => a.by === 'ledger');
  assert.equal(L.length, W.arch.length, 'one point per attempt kept');
  for (const a of L) {
    const e = W.byId[a.id];
    assert.equal(a.key, e.facts.g, 'the replay lands where the ledger says');
    assert.equal(a.who, e.by); assert.equal(a.agent, F.ARCH_AGENTS.includes(e.made)); assert.match(a.day, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.ok(P.every(a => a.built || a.by === 'ledger'), 'nothing else: the lab runs no agent');
  /* a record that is not an attempt is left out, never thrown on */
  assert.deepEqual(F.ledgerAttempts([null, 5, { id: 'x' }, { id: 'y', arch: { start: 'far/charge/magic/few', years: [['people']] } }]), []);
});

test('each niche shows its champion: the best standing there, never one leaderboard', () => {
  const P = F.population(kept(settled())), C = F.census(P), ch = F.champions(C);
  assert.ok(ch.length > 0);
  for (const c of ch) {
    const ni = A.NEEDS.indexOf(c.need);
    for (const [key, e] of C.at[ni]) if (A.novelty(e.a.g) === c.d) assert.ok(e.now <= c.now, key + ' beats the champion of ' + c.need + ' at ' + c.d);
    assert.ok(c.d > 0 && c.d <= 4);
  }
  /* niches differ: no single attempt holds every one */
  assert.ok(new Set(ch.map(c => c.key)).size > 1);
  /* yours always stands on your plot */
  const best = ch.find(c => c.a.by === 'ledger') || ch[0], mine = { key: best.key, g: best.a.g, st: A.year(best.a.st, ['tools']), by: 'you', mine: true };
  assert.equal(F.census(P.concat([mine])).at[A.NEEDS.indexOf(best.need)].get(best.key).a, mine);
});

test('the first attempt at a recipe nobody has built is credited, read from the entries alone', () => {
  const h = { start: 'in/charge/graph/stack', years: [['people', 'memory'], ['people', 'tools'], ['memory', 'tools']] };
  const a = at(h, 'ada first'), b = at(Object.assign({}, h, { years: h.years.concat([['tools']]) }), 'bo second', { by: 'Bo', made: 'program', ai: 'A search program.' });
  const built = at({ start: 'flow/charge/graph/grid', years: [['people']] }, 'cy built', { by: 'Cy' });
  const W = settle(collect().concat([a, b, built]));
  assert.deepEqual(W.refused.map(e => e.id + ' ' + e.reason), []);
  const was = archAttempts(settled()).tried['in/charge/graph/stack'];
  assert.equal(W.byId[a.id].firstTry, !was, 'the first to try it');
  assert.equal(W.byId[b.id].firstTry, false, 'a later attempt at the same recipe is not first');
  assert.equal(W.byId[built.id].firstTry, false, 'a recipe someone has built is never a first try');
  assert.equal(archAttempts(W).tried['in/charge/graph/stack'], was || a.id);
  const P = F.population(kept(W));
  assert.equal(P.find(x => x.id === a.id).first, !was);
  assert.equal(P.find(x => x.id === b.id).agent, true);
  /* the attempts already kept: each recipe's first try is the earliest attempt at it */
  for (const e of kept(settled())) if (!e.facts.built) assert.equal(e.firstTry, settled().archTried[e.facts.g] === e.id);
  assert.ok(kept(settled()).some(e => e.firstTry), 'the ledger credits a first try');
});

test('what changed since your last visit: the attempts kept since, and the champions deposed', () => {
  const W = settled(), P = F.population(kept(W)), C = F.census(P);
  assert.equal(F.since(null, P, C).first, true, 'nothing kept: a first visit');
  assert.equal(F.since({ ids: 'x' }, P, C).first, true, 'a broken keep is a first visit, never thrown on');
  const now = F.snapOf(P, C, day);
  assert.deepEqual(now.ids, P.filter(a => a.by === 'ledger').map(a => a.id));
  const same = F.since(JSON.parse(JSON.stringify(now)), P, C);
  assert.equal(same.first, false); assert.deepEqual(same.fresh, []); assert.deepEqual(same.deposed, []); assert.equal(same.at, day);
  /* an attempt kept since, and a champion that was someone else's */
  const lc = F.champions(C).find(c => c.a.by === 'ledger');
  assert.ok(lc, 'an attempt in the ledger holds a niche');
  const k = lc.need + '.' + lc.d, prev = { at: '2026-11-20', ids: now.ids.filter(id => id !== lc.a.id), champ: Object.assign({}, now.champ, { [k]: 'cpu' }) };
  const S = F.since(prev, P, C);
  assert.deepEqual(S.fresh.map(a => a.id), [lc.a.id]);
  assert.ok(S.deposed.some(x => x.need === lc.need && x.d === lc.d && x.was === 'cpu' && x.now === lc.a));
  /* your own attempt is never kept as a holder */
  const C2 = F.census(P.concat([{ key: A.keyOf(lc.a.g), g: lc.a.g, st: A.year(lc.a.st, ['tools']), by: 'you', mine: true }]));
  assert.ok(!Object.values(F.snapOf(P, C2, day).champ).includes('you'));
});
