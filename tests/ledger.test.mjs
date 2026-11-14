// The ledger (community/ledger/, src/engines/ledger.js): every entry is replayed in order through the lab's engines.
// This test is the gate: a pull request that adds an entry which does not pass its check fails here, so it is not
// merged. It also checks the rules themselves: a break must really fail its design, by someone else; a case then
// joins the check for good; standings come from the entries alone; and the words of an entry stay plain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import './ledger.setup.mjs';
import { collect, FOLDER } from '../scripts/ledger.mjs';
import { ledger, settle, settled, checkEntry, tryEntry, draft, fileOf, proposeUrl, frontier, runCase, standing, questionsAt, KINDS, MADE, DIR } from '../src/engines/ledger.js';
import { plan } from '../src/engines/build.js';
import * as Game from '../src/v2/game.js';
import { STOPS } from '../src/data/weave.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const AGENT = '2026-11-12-design-studio-agent-counter', LAB = '2026-11-12-design-counter-3bit';
const CASE = [{ en: 1 }, { en: 1 }, { en: 1 }, { en: 0 }, { en: 0 }];
const brk = (o = {}) => draft(Object.assign({ kind: 'break', of: AGENT, by: 'Ada', made: 'person', case: CASE }, o), 'ada agent counter', '2026-11-20');

test('every entry in the ledger passes its check, replayed in order (the gate for a pull request)', () => {
  const W = settled();
  assert.deepEqual(W.refused.map(e => e.id + ': ' + e.reason), [], 'an entry does not pass its check');
  assert.equal(W.entries.length, readdirSync(FOLDER).filter(n => n.endsWith('.json')).length, 'every file is an entry');
  for (const e of W.entries) {
    assert.ok(KINDS.includes(e.kind) && MADE.includes(e.made), e.id);
    assert.ok(EN['build.kind.' + e.made] && EN['ledger.state.' + e.state], e.id + ': its maker and standing have words');
    /* a file holds only its kind's fields, in the form the site and the port write */
    assert.equal(fileOf(e).text, readFileSync(new URL('../' + DIR + '/' + e.id + '.json', import.meta.url), 'utf8'), e.id + ': not in the form fileOf() writes');
  }
});

test('the ledger is replayed the same whatever order the files are read in', () => {
  const a = settle(collect()), b = settle(collect().reverse());
  assert.deepEqual(a.entries.map(e => [e.id, e.state]), b.entries.map(e => [e.id, e.state]));
  assert.deepEqual(a.inside, b.inside);
});

test('standings come from the entries alone: records by size and speed, the smallest holder inside the computer', () => {
  const W = settled();
  /* until someone breaks it, the faster counter beat the lab\'s own and sits inside the shared computer */
  if (W.byId[AGENT].state !== 'broken') { assert.equal(W.byId[AGENT].state, 'holds'); assert.equal(W.byId[LAB].state, 'behind'); assert.equal(W.inside.timer, AGENT); }
  for (const [piece, id] of Object.entries(W.inside)) assert.ok(standing(W, piece)[0].id === id && W.byId[id].state === 'holds');
  assert.equal(plan([]).timer.state, 'built');
});

test('a break must really fail its design: the counter that passed the lab\'s test is wrong, and a case shows it', () => {
  const T = settled().byId[AGENT];
  if (T.state === 'broken') return;   /* someone has broken it in the ledger since: the rest is their entry's check */
  assert.equal(runCase('count', T.code, CASE).first, 4, 'wrong from the fifth tick');
  assert.equal(runCase('count', settled().byId[LAB].code, CASE).first, -1, 'the lab\'s counter answers the case right');
  assert.equal(tryEntry(brk()).ok, true);
  assert.equal(tryEntry(brk({ case: [{ en: 1 }, { en: 0 }] })).reason, 'holds');
  assert.equal(tryEntry(brk({ of: LAB })).reason, 'holds');
  assert.equal(tryEntry(brk({ by: T.by })).reason, 'own', 'nobody breaks their own design');
  assert.equal(tryEntry(brk({ case: [{ en: 2 }] })).reason, 'caseForm');
  assert.equal(tryEntry(brk({ case: [{ en: 1, x: 1 }] })).reason, 'caseForm');
  assert.equal(tryEntry(brk({ of: '2026-11-12-design-parity-checker' })).reason, 'proven', 'a check that tries every input leaves nothing to break');
  assert.equal(tryEntry(brk({ of: 'nothing' })).reason, 'target');
});

test('a case joins the check for good: the broken design falls, the computer takes the next one, later designs must pass it', () => {
  if (settled().byId[AGENT].state === 'broken') return;
  const b = brk(), W = settle(ledger().concat(b));
  assert.equal(W.byId[AGENT].state, 'broken'); assert.equal(W.byId[AGENT].brokenBy, b.id);
  assert.equal(W.byId[LAB].state, 'holds'); assert.equal(W.inside.timer, LAB);
  assert.equal(plan([], W).timer.state, 'built', 'the lab\'s counter keeps the timer built');
  assert.equal(W.cross['example>person'], 1);
  /* the same wrong counter under another name is refused by the case now; a second break of it has nothing to do */
  const again = draft({ kind: 'design', piece: 'timer', title: 'Fast counter', by: 'Bo', made: 'ai', ai: 'an agent wrote it', code: 'reg q0 = q0 ^ en;\nreg q1 = q1 ^ (en & q0);\nreg q2 = q2 ^ (q0 & q1);' }, 'bo fast counter', '2026-11-21');
  assert.equal(checkEntry(again, W).reason, 'case');
  assert.equal(tryEntry(again).ok, true, 'before the break it would have passed too');
  assert.equal(checkEntry(brk({ by: 'Cy', case: CASE.concat({ en: 1 }) }), W).reason, 'already');
  /* and the break stays open as a challenge, so anyone can find the case again */
  assert.ok(!frontier(W).some(f => f.kind === 'break' && f.of === AGENT));
});

test('a design must read, be right, be new, and say who made it and how AI was used', () => {
  const d = (o = {}) => draft(Object.assign({ kind: 'design', piece: 'half', title: 'Half adder', by: 'Ada', made: 'person', code: 'sum = a ^ b;\ncarry = a & b;' }, o), 'ada half', '2026-11-20');
  assert.equal(tryEntry(d()).ok, true);
  assert.equal(tryEntry(d({ code: 'sum = a | b;\ncarry = a & b;' })).reason, 'wrong');
  assert.equal(tryEntry(d({ code: 'sum = ;' })).reason, 'reads');
  assert.equal(tryEntry(d({ piece: 'decode' })).reason, 'piece');
  assert.equal(tryEntry(d({ made: 'ai' })).reason, 'sayAI');
  assert.equal(tryEntry(d({ made: 'robot' })).reason, 'made');
  assert.equal(tryEntry(d({ by: 'A' })).reason, 'by');
  assert.equal(tryEntry(d({ piece: 'safety', title: 'Voter', code: ' y = (a & b) | (b & c) | (a & c) ; ' })).reason, 'same', 'the same description, respaced, is not a new design');
  /* words stay plain: no markup, no links, nothing an agent could take for an instruction to fetch */
  assert.equal(tryEntry(d({ title: '<b>Half</b>' })).reason, 'words');
  assert.equal(tryEntry(d({ words: 'see https://example.com' })).reason, 'words');
  assert.equal(tryEntry(Object.assign(d(), { extra: 1 })).reason, 'fields');
  assert.equal(tryEntry(Object.assign(d(), { id: 'half' })).reason, 'id');
  assert.equal(tryEntry(Object.assign(d(), { id: '2026-11-20-break-x' })).reason, 'kind');
  /* a design that beats the holder on size takes its place inside the computer; the beaten one stays, behind */
  const small = draft({ kind: 'design', piece: 'safety', title: 'Small voter', by: 'Ada', made: 'person', code: 'y = ~(~(a & b) & ~(c & (a | b)));' }, 'ada voter', '2026-11-20'), W = settle(ledger().concat(small));
  if (W.byId[small.id].ok) { assert.equal(W.byId[small.id].state, 'holds'); assert.ok(W.inside.safety === small.id || W.byId[W.inside.safety].facts.transistors <= W.byId[small.id].facts.transistors); }
});

test('a question needs a home and the form of a question; it hangs under a stop and never becomes a core question', () => {
  const q = (o = {}) => draft(Object.assign({ kind: 'question', at: 'check', under: 'fail.check', q: 'If one case can break a design that passed, how many cases are enough?', noticed: 'The counter passed thirteen ticks.', by: 'Ada', made: 'person' }, o), 'ada how many', '2026-11-20');
  assert.equal(tryEntry(q()).ok, true);
  assert.equal(tryEntry(q({ q: 'Cases are never enough.' })).reason, 'question');
  assert.equal(tryEntry(q({ q: 'Why?' })).reason, 'question');
  assert.equal(tryEntry(q({ at: 'nowhere' })).reason, 'home');
  assert.equal(tryEntry(q({ under: 'fail.gate' })).reason, 'under', 'the question it sits under lives at another level');
  assert.equal(tryEntry(q({ under: 'fail.nothing' })).reason, 'under');
  const W = settle(ledger().concat(q()));
  assert.equal(questionsAt(W, 'check', 'fail.check').length >= 1, true);
  assert.equal(checkEntry(q({ by: 'Bo', q: 'if one case can break a design that passed,  how many cases are enough?' }), W).reason, 'same');
});

test('an entry becomes one file and one link: a new file in a pull request, nothing else', () => {
  const b = brk(), f = fileOf(b), u = new URL(proposeUrl(b));
  assert.match(f.path, /^community\/ledger\/2026-11-20-break-ada-agent-counter-[a-z0-9]{4}\.json$/);
  assert.deepEqual(Object.keys(JSON.parse(f.text)), ['kind', 'of', 'by', 'made', 'ai', 'case']);
  assert.equal(u.pathname, '/focusxyz11/open-silicon-lab/new/main/community/ledger');
  assert.equal(u.searchParams.get('filename'), b.id + '.json'); assert.equal(u.searchParams.get('value'), f.text);
  assert.ok(proposeUrl(b).length < 2000, 'the link stays short enough for any browser');
});

test('every refusal has its words, and every challenge opens a real question', () => {
  const src = readFileSync(new URL('../src/engines/ledger.js', import.meta.url), 'utf8');
  for (const m of src.matchAll(/no\('(\w+)'/g)) assert.ok(EN['ledger.no.' + m[1]], 'no words for the refusal ' + m[1]);
  for (const c of Game.CHALLENGES) assert.ok(STOPS[Game.OPENS[c.id]], c.id + ' opens no question');
  for (const k of Object.values(Game.FRONT_ASK)) assert.ok(STOPS[k]);
});

test('the game reads the ledger: a break is a challenge the ledger offers, your drafts show at once and only as yours', () => {
  const S = Game.fresh(), C = Game.community(S);
  assert.ok(C.designs.length >= 4 && C.designs.every(d => !d.draft));
  const open = C.breaks.find(b => b.of === AGENT);
  if (!open) return;
  const ch = Game.anyChallenge('break:' + AGENT, S);
  assert.equal(ch.kind, 'break'); assert.equal(ch.p, 'count');
  assert.equal(Game.anyChallenge('break:2026-11-12-design-parity-checker', S), null, 'nothing to break where every input is tried');
  assert.ok(Game.doAtStop('fail.check', S).some(x => x.ch && x.ch.id === ch.id), 'the break sits under the question it is about');
  S.drafts.push(brk({ by: 'You' }));
  const C2 = Game.community(S);
  assert.equal(C2.designs.find(d => d.id === AGENT).state, 'broken'); assert.equal(C2.cases.length, C.cases.length + 1); assert.ok(C2.cases.some(c => c.draft));
  assert.equal(Game.community(Game.fresh()).designs.find(d => d.id === AGENT).state, 'holds', 'another visitor still sees it standing');
  /* your state keeps your drafts, the questions you met and your name through a reload; junk is dropped */
  S.met = { fail: ['check', 3, 'gate'], x: 'no' }; S.name = 'You'; S.sent = { [S.drafts[0].id]: true, gone: true };
  const store = { v: null, getItem() { return this.v; }, setItem(k, v) { this.v = v; } }; Game.save(store, S);
  const R = Game.load(store);
  assert.equal(R.drafts.length, 1); assert.deepEqual(R.met, { fail: ['check', 'gate'] }); assert.equal(R.name, 'You'); assert.deepEqual(Object.keys(R.sent), [S.drafts[0].id]);
});

test('a core question shows alone, after two of its stops, or one once you have done something about it', async () => {
  const { rootShown } = await import('../src/engines/weave.js');
  assert.equal(rootShown(['check']), false); assert.equal(rootShown(['check', 'gate']), true); assert.equal(rootShown(['check'], true), true); assert.equal(rootShown([], true), false);
  const S = Game.fresh(); assert.equal(Game.didOn(S, 'fail'), false); S.done.half = true; assert.equal(Game.didOn(S, 'fail'), true); assert.equal(Game.didOn(S, 'make'), false);
});

test('a try is the trace of an attack that failed; pull comes from the traces; roles are read from the entries', async () => {
  const { society, workFor } = await import('../src/engines/ledger.js');
  const held = [{ en: 1 }, { en: 0 }, { en: 1 }];
  const tr = (o = {}) => draft(Object.assign({ kind: 'try', of: LAB, by: 'Ada', made: 'person', cases: [held], about: 'fail.check' }, o), 'ada lab counter', '2026-11-20');
  assert.equal(tryEntry(tr()).ok, true);
  assert.equal(tryEntry(tr({ by: 'Open Silicon Lab' })).reason, 'own');
  assert.equal(tryEntry(tr({ cases: [] })).reason, 'caseForm');
  assert.equal(tryEntry(tr({ about: 'no.where' })).reason, 'about');
  assert.equal(tryEntry(tr({ made: 'program' })).reason, 'sayAI', 'a program says what it is too');
  if (settled().byId[AGENT].state !== 'broken') assert.equal(tryEntry(tr({ of: AGENT, cases: [CASE] })).reason, 'breaks', 'a case that breaks is a break, not a try');
  /* every try quiets the call to attack that design, so attention moves to what nobody has looked at */
  const before = frontier(settled()).find(f => f.kind === 'break' && f.of === LAB), after = frontier(settle(ledger().concat(tr()))).find(f => f.kind === 'break' && f.of === LAB);
  assert.ok(after.pull < before.pull && after.tries === before.tries + 1);
  const F = frontier(settled()); assert.deepEqual(F.map(f => f.pull), F.map(f => f.pull).sort((a, b) => b - a), 'the loudest call first');
  /* a design may say what it was built on, and work may say which question it was done for */
  const d = draft({ kind: 'design', piece: 'half', title: 'Half adder', by: 'Ada', made: 'person', code: 'sum = a ^ b;\ncarry = a & b;', from: LAB, about: 'open.need' }, 'ada half', '2026-11-20');
  assert.equal(tryEntry(d).ok, true); assert.equal(tryEntry(Object.assign({}, d, { from: 'nothing' })).reason, 'from');
  const W = settle(ledger().concat(tr(), d)), ada = society(W).find(m => m.by === 'Ada');
  assert.deepEqual(ada.does, { design: 1, try: 1 }); assert.ok(ada.checked.includes('Open Silicon Lab') && ada.builtOn.includes('Open Silicon Lab'));
  assert.ok(workFor(W, 'fail.check').some(e => e.by === 'Ada'));
  for (const m of society(settled())) for (const k of Object.keys(m.does)) assert.ok(EN['society.does.' + k]);
});
