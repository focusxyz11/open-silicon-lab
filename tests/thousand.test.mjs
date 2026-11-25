// A thousand that pass (src/engines/thousand.js, src/v2/labs/thousand.js): a program's thousand designs for a need, all
// passing every check with their measured scores close; the people no check measures; and a choice kept as a ledger try
// with its reason, people's and agents' choices read apart from the entries alone, none invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/engines/thousand.js';
import { design } from '../src/engines/aibuild.js';
import { settle, draft, checkEntry, choicesAt } from '../src/engines/ledger.js';

test('a thousand designs, each passing every check of the need, their measured scores close together', () => {
  const D = T.thousand('phone'), L = T.limits('phone');
  assert.equal(D.length, 1000);
  assert.equal(new Set(D.map(d => d.id)).size, 1000);
  assert.equal(new Set(D.map(d => JSON.stringify(d.c))).size, 1000, 'no design twice');
  assert.equal(T.thousand('phone'), D, 'made once');
  for (const d of D) {
    const R = design(d.c); assert.ok(R.all, d.id + ' passes');
    assert.ok(d.m.power <= L.power.value && d.m.cost <= L.cost.value && d.m.tps >= L.tps.value);
    assert.ok(R.goal.value >= T.NEEDS.phone.floor);
  }
  /* close together: the best and worst on the mission's goal within a factor of two */
  const goal = D.map(d => d.m.goal); assert.ok(Math.max(...goal) / Math.min(...goal) < 2);
  assert.deepEqual(T.thousand('nowhere'), []);
});

test('every design treats the people around the need its own way, by the rules shown; none is best for everyone', () => {
  const D = T.thousand('phone');
  for (const d of D) for (const p of T.PEOPLE) assert.ok(d.lean[p] >= -2 && d.lean[p] <= 2 && Number.isInteger(d.lean[p]));
  assert.deepEqual(T.leanOf({ data: 'device', years: '8', docs: 'open', memory: 'beside' }), { user: -1, repair: 2, payer: -2, planet: 2, never: 2 });
  /* no design is the best for every person at once: the choice is a trade, not a search */
  const top = Object.fromEntries(T.PEOPLE.map(p => [p, Math.max(...D.map(d => d.lean[p]))]));
  assert.ok(!D.some(d => T.PEOPLE.every(p => d.lean[p] === top[p])));
  /* every choice no check scores appears among the thousand */
  for (const tr of T.TRAITS) for (const v of tr.values) assert.ok(D.some(d => d.traits[tr.id] === v), tr.id + ' ' + v);
  assert.ok(T.reasonOk('For the person who repairs it')); assert.ok(!T.reasonOk('short')); assert.ok(!T.reasonOk('see https://example.com now'));
  assert.ok(!T.reasonOk('two\nlines here'));
  const L = T.leaningOf('phone', ['d0001', 'd0002']); assert.equal(Object.keys(L).length, 5); assert.equal(T.leaningOf('phone', []), null);
});

test('a choice is a ledger try with its reason: people and agents apart, once per need under a name, never ranked', () => {
  const mk = (fields, name) => draft(Object.assign({ kind: 'try', choice: 'phone' }, fields), name, '2026-11-23');
  const person = mk({ pick: 'd0007', words: 'Kept for the shop that repairs it', by: 'Ada', made: 'person', ai: '' }, 'ada choice');
  const agent = mk({ pick: 'd0100', words: 'It keeps what you say on the phone', by: 'An agent', made: 'ai', ai: 'Chosen by an AI agent through the open port.' }, 'agent choice');
  const W = settle([person, agent]);
  assert.equal(W.refused.length, 0, JSON.stringify(W.refused.map(e => e.reason)));
  const C = choicesAt(W, 'phone');
  assert.deepEqual(C.people.map(e => e.id), [person.id]); assert.deepEqual(C.agents.map(e => e.id), [agent.id]);
  assert.deepEqual(W.byId[person.id].facts.lean, T.designOf('phone', 'd0007').lean);
  assert.deepEqual(choicesAt(settle([]), 'phone'), { people: [], agents: [] }, 'no choice is invented');
  /* what is refused, and why */
  const no = (e, extra) => checkEntry(e, settle(extra || [])).reason;
  assert.equal(no(mk({ pick: 'd0007', words: 'short', by: 'Bo', made: 'person', ai: '' }, 'x')), 'reason');
  assert.equal(no(mk({ pick: 'd9999', words: 'A reason long enough', by: 'Bo', made: 'person', ai: '' }, 'x')), 'pick');
  assert.equal(no(mk({ pick: 'd0007', words: 'A reason long enough', by: 'Bo', made: 'both', ai: 'together' }, 'x')), 'chooser');
  assert.equal(no(draft({ kind: 'try', choice: 'moon', pick: 'd0007', words: 'A reason long enough', by: 'Bo', made: 'person', ai: '' }, 'x', '2026-11-23')), 'choice');
  assert.equal(no(mk({ pick: 'd0008', words: 'Changed my mind about it', by: 'ada', made: 'person', ai: '' }, 'again'), [person]), 'same');
  assert.equal(no(mk({ pick: 'd0007', words: 'A reason long enough', by: 'Bo', made: 'person', ai: '', plan: {} }, 'x')), 'fields');
  assert.equal(no(draft({ kind: 'try', pick: 'd0007', words: 'A reason long enough', by: 'Bo', made: 'person', ai: '' }, 'x', '2026-11-23')), 'fields');
});
test('a need is one of the table\'s own: an inherited name such as constructor is no need, and nothing throws on it (#372)', () => {
  for (const k of ['constructor', 'toString', '__proto__', 'hasOwnProperty', ['phone'], null, 7]) {
    assert.equal(T.needOf(k), null, String(k)); assert.equal(T.limits(k), null, String(k));
    assert.deepEqual(T.thousand(k), [], String(k)); assert.equal(T.designOf(k, 'd0001'), null, String(k));
  }
  assert.ok(T.needOf('phone') && T.limits('phone') && T.thousand('phone').length === 1000);
});
