// The ledger's floor in CI (#484, scripts/ledger-guard.mjs): one new entry per pull request, never an edit, dated the day
// it was opened, sent by the account it names; an entry with code only from the owner or the nightly build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guard, readChanges, OWNER } from '../scripts/ledger-guard.mjs';
import { checkEntry, settle, draft } from '../src/engines/ledger.js';

const A = p => ({ status: 'A', path: p, from: null });
const ok = { changes: [A('community/ledger/2026-11-28-question-ada-why-1a2b.json')], author: 'ada', opened: '2026-11-28T10:00:00Z', entry: { github: 'Ada', made: 'person' } };
const g = o => guard(Object.assign({}, ok, o));

test('one new entry, dated today, sent by the account it names, passes; a pull request without entries is not the guard\'s', () => {
  assert.equal(g({}).ok, true);
  assert.deepEqual(guard({ changes: [A('src/v2/hold.js')], author: 'bo', opened: '2026-11-28' }), { ok: true, ledger: false });
});

test('entries are never edited, renamed or deleted', () => {
  for (const st of ['M', 'D']) assert.equal(g({ changes: [{ status: st, path: 'community/ledger/2026-11-26-try-x-1.json', from: null }] }).guard, 'never-edited');
  assert.equal(g({ changes: [{ status: 'R', path: 'community/ledger/2026-11-28-try-x-1.json', from: 'community/ledger/2026-11-26-try-x-1.json' }] }).guard, 'never-edited');
  assert.equal(g({ changes: ok.changes.concat({ status: 'M', path: 'community/ledger/2026-11-26-try-y-2.json', from: null }) }).guard, 'never-edited');
});

test('one entry per pull request', () => {
  assert.equal(g({ changes: ok.changes.concat(A('community/ledger/2026-11-28-question-ada-again-3c4d.json')) }).guard, 'one-entry');
});

test('the date in the name is the day it was opened, a day either side', () => {
  assert.equal(g({ opened: '2026-11-29T23:59:00Z' }).ok, true); assert.equal(g({ opened: '2026-11-27T00:01:00Z' }).ok, true);
  assert.equal(g({ opened: '2026-11-30T09:00:00Z' }).guard, 'date', 'two days late');
  assert.equal(g({ changes: [A('community/ledger/2025-01-01-try-ada-first-9f9f.json')] }).guard, 'date', 'backdated to claim a first');
  assert.equal(g({ changes: [A('community/ledger/notes.json')] }).guard, 'name');
});

test('the entry names its sender: its github field is the pull request\'s author; an example only from the owner', () => {
  assert.equal(g({ entry: { github: 'eve', made: 'person' } }).guard, 'who');
  assert.equal(g({ entry: { made: 'person' } }).guard, 'who', 'no github field');
  assert.equal(g({ entry: null }).guard, 'read');
  assert.equal(g({ entry: { made: 'example', by: 'Open Silicon Lab' } }).guard, 'example');
  assert.equal(g({ author: OWNER, entry: { made: 'example', by: 'Open Silicon Lab' } }).ok, true);
});

test('an entry with code: only from the owner or the nightly build', () => {
  const mixed = ok.changes.concat(A('src/engines/arch.js'));
  assert.equal(g({ changes: mixed }).guard, 'entry-only');
  assert.equal(g({ changes: mixed, author: OWNER, entry: { github: OWNER, made: 'both' } }).ok, true);
  assert.equal(g({ changes: mixed, author: OWNER, branch: 'claude/task-ledger', entry: { github: OWNER, made: 'program' } }).ok, true);
  assert.equal(g({ changes: mixed, author: 'eve', branch: 'claude/task-ledger', entry: { github: 'eve' } }).guard, 'entry-only', 'a branch name alone does not make a nightly build');
});

test('the changed files are read as git prints them', () => {
  assert.deepEqual(readChanges('A\tcommunity/ledger/a.json\nM\tsrc/x.js\nR100\tcommunity/ledger/o.json\tcommunity/ledger/n.json\n'),
    [{ status: 'A', path: 'community/ledger/a.json', from: null }, { status: 'M', path: 'src/x.js', from: null }, { status: 'R', path: 'community/ledger/n.json', from: 'community/ledger/o.json' }]);
});

test('an entry may carry its sender\'s GitHub account, in a login\'s form', () => {
  const W = settle([]), q = (gh, name) => draft({ kind: 'question', at: 'gate', q: 'Why does a gate need two kinds of switch?', by: 'Ada', made: 'person', github: gh }, name, '2026-11-28');
  assert.equal(checkEntry(q('ada-lovelace', 'a'), W).ok, true);
  for (const bad of ['-ada', 'ada lovelace', 'a'.repeat(40), 'https://x']) assert.equal(checkEntry(q(bad, 'b'), W).reason, 'github', bad);
});
