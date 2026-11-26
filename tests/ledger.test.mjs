// The ledger (community/ledger/, src/engines/ledger.js): every entry is replayed in order through the lab's engines.
// This test is the gate: a pull request that adds an entry which does not pass its check fails here, so it is not
// merged. It also checks the rules themselves: a break must really fail its design, by someone else; a case then
// joins the check for good; standings come from the entries alone; and the words of an entry stay plain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import './ledger.setup.mjs';
import { collect, FOLDER } from '../scripts/ledger.mjs';
import { ledger, settle, settled, checkEntry, tryEntry, draft, fileOf, proposeUrl, frontier, runCase, standing, questionsAt, reportsAt, labCurve, machineAttemptsAt, archAttempts, KINDS, MADE, DIR } from '../src/engines/ledger.js';
import * as Arch from '../src/engines/arch.js';
import { machine } from '../src/engines/machine.js';
import { plan } from '../src/engines/build.js';
import * as Game from '../src/v2/game.js';
import { fieldOf } from '../src/data/questions.js';
import { STOPS } from '../src/data/weave.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
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
  /* a bet opens its question from the field (src/data/questions.js); every other challenge a stop */
  for (const c of Game.CHALLENGES) assert.ok(c.kind === 'bet' ? fieldOf(c.bet) && fieldOf(c.bet).shape === 'bet' : STOPS[Game.OPENS[c.id]], c.id + ' opens no question');
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

test('a question asked is a call of its own: work gathers under it, quiets it, and never closes it', async () => {
  const { workFor } = await import('../src/engines/ledger.js');
  const q = draft({ kind: 'question', at: 'check', under: 'fail.check', q: 'What would it take to try every case of a real chip?', noticed: 'Eight ticks of one bit is already thousands of cases.', by: 'Ada', made: 'person' }, 'ada every case', '2026-11-20');
  const W0 = settle(ledger().concat(q)), c0 = frontier(W0).find(f => f.kind === 'ask' && f.q === q.id);
  assert.ok(c0 && c0.work === 0);
  const tr = draft({ kind: 'try', of: LAB, by: 'Bo', made: 'person', cases: [[{ en: 1 }, { en: 0 }]], about: q.id }, 'bo counter', '2026-11-21');
  const under = draft({ kind: 'question', at: 'check', q: 'Is a proof for eight ticks a proof for nine?', by: 'Cy', made: 'person', about: q.id }, 'cy nine', '2026-11-21');
  const W1 = settle(ledger().concat(q, tr, under)), c1 = frontier(W1).find(f => f.kind === 'ask' && f.q === q.id);
  assert.deepEqual(W1.refused, []); assert.equal(workFor(W1, q.id).length, 2);
  assert.ok(c1.pull < c0.pull && c1.pull > 0, 'quieter, and still calling');
  assert.equal(checkEntry(Object.assign({}, tr, { about: 'no-such-question' }), W0).reason, 'about');
  /* the questions in the ledger are calls now, and Game hands them to the island */
  const C = Game.community(Game.fresh());
  assert.equal(C.asks.length, settled().entries.filter(e => e.kind === 'question').length); assert.ok(C.loud && C.loud.pull >= (C.asks[0] || { pull: 0 }).pull);
});

test('a report breaks the lab itself, anywhere, at any time; a fix closes it; nothing else does', () => {
  const rep = { id: '2026-11-15-report-tester-line-a1b2', kind: 'report', at: '#/line/print', say: 'confusing', words: 'I could not tell which machine does the printing.', by: 'Tester', made: 'person', ai: '' };
  const again = { id: '2026-11-15-report-tester-line-c3d4', kind: 'report', at: '#/line/print', say: 'broken', words: 'Next step did nothing on my phone.', by: 'Someone', made: 'person', ai: '' };
  let W = settle([rep, again]);
  assert.equal(W.byId[rep.id].state, 'open');
  const calls = frontier(W).filter(f => f.kind === 'report');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].of, again.id, 'what does not work calls louder than what confuses');
  assert.ok(calls.every(f => f.same === 1), 'two reports at one place pull louder together');
  /* refusals: not a place in the lab, not a kind, too few words, a link, the same words twice */
  const bad = (o, why) => assert.equal(checkEntry(Object.assign({}, rep, { id: '2026-11-15-report-x-zz' }, o), settle([rep])).reason, why);
  bad({ at: 'https://example.com' }, 'where');
  bad({ say: 'angry' }, 'say');
  bad({ words: 'bad' }, 'report');
  bad({ words: 'see www.example.com for more words' }, 'report');
  bad({}, 'same');
  /* a fix closes it, once; the call goes */
  const fix = { id: '2026-11-16-fix-claude-line-e5f6', kind: 'fix', of: rep.id, words: 'The scanner is named while it prints.', pr: 160, by: 'Claude', made: 'ai', ai: 'Claude found and wrote the change.' };
  W = settle([rep, again, fix]);
  assert.equal(W.byId[rep.id].state, 'fixed');
  assert.equal(W.byId[rep.id].fixedBy, fix.id);
  assert.deepEqual(frontier(W).filter(f => f.kind === 'report').map(f => f.of), [again.id]);
  assert.equal(checkEntry(Object.assign({}, fix, { id: '2026-11-16-fix-other-line-g7h8' }), W).reason, 'fixed');
  assert.equal(checkEntry(Object.assign({}, fix, { id: '2026-11-16-fix-other-line-i9j0', of: '2026-11-12-design-majority-voter' }), W).reason, 'target');
  assert.deepEqual(reportsAt(W, '#/line/print').map(e => e.id), [again.id, rep.id], 'open first');
});

test('an attempt at the energy puzzle is a try with a plan: the budget engine scores it, and the frontier comes from the scores alone', async () => {
  const { budget, JOB } = await import('../src/engines/budget.js');
  const { attemptsAt, PUZZLES } = await import('../src/engines/ledger.js');
  const at = (by, plan, name, day = '2026-11-20') => draft({ kind: 'try', puzzle: 'energy', plan, by, made: 'person', words: '' }, by + ' ' + name, day);
  const a = at('Ada', { batch: 64 }, 'batch'), b = at('Bo', { batch: 64, precision: 'fp8' }, 'fp8'), c = at('Cy', { precision: 'fp4' }, 'fp4'), d = at('Di', { home: 'dram' }, 'dram');
  /* among these four alone (the ledger's own attempts would change who stands where) */
  const W = settle([a, b, c, d]);
  for (const e of [a, b, c, d]) assert.ok(W.byId[e.id].ok, e.id + ': ' + W.byId[e.id].reason);
  assert.equal(W.byId[a.id].facts.joules, budget(JOB, { batch: 64 }).total, 'the score is the engine\'s');
  assert.ok(PUZZLES.energy);
  /* fewer bits beat the same batch at 16 bits on energy and time, but lose on accuracy: both stay on the frontier */
  assert.equal(W.byId[a.id].state, 'front'); assert.equal(W.byId[b.id].state, 'front');
  /* memory chips on the board are worse on energy and time at the same accuracy than the starting plan's best rival */
  assert.equal(W.byId[d.id].state, 'beaten');
  assert.equal(W.best.energy, attemptsAt(W, 'energy')[0].id);
  assert.ok(W.byId[W.best.energy].facts.joules <= Math.min(...[a, b, c].map(e => W.byId[e.id].facts.joules)));
  /* the same plan again, a plan the engine cannot run, a plan with keys it does not have, or cases on a puzzle: refused */
  const no = (e, why) => assert.equal(checkEntry(e, W).reason, why, JSON.stringify(e.plan));
  no(at('Ed', { batch: 64 }, 'again'), 'same');
  no(at('Ed', { batch: 64, home: 'hbm' }, 'again2'), 'same');
  no(at('Ed', { clock: 40 }, 'fast'), 'plan');
  no(at('Ed', { magic: true }, 'magic'), 'plan');
  no(at('Ed', { batch: [64] }, 'arr'), 'plan');
  no(Object.assign(at('Ed', { batch: 8 }, 'cases'), { cases: [[{ en: 1 }]] }), 'fields');
  no(Object.assign(at('Ed', { batch: 8 }, 'what'), { puzzle: 'cold-fusion' }), 'puzzle');
  /* the puzzle is open for good, louder while few have tried it */
  const p0 = frontier(settle([])).find(f => f.kind === 'puzzle'), p4 = frontier(W).find(f => f.kind === 'puzzle');
  assert.ok(p0 && p4 && p0.pull > p4.pull && p4.attempts >= 4);
  /* the ledger's own attempts replay with it, and a try at a design is still what it was */
  const L = settled(); assert.ok(L.puzzles.energy.length >= 2 && L.best.energy);
  assert.ok(L.entries.some(e => e.kind === 'try' && e.of && e.facts.cases));
  /* the record says it in words, and its maker's standing has words too */
  for (const e of [a, d]) assert.ok(EN['ledger.state.' + W.byId[e.id].state]);
  const { useTexts } = await import('../src/core/i18n.js'); useTexts(EN, 'en');
  assert.match(Game.entryWords(W.byId[a.id], Game.fresh()), /Wh/);
});

test('an attempt at a machine is a try with a plan the machine engine checks; the lab\'s curve comes from the attempts alone', () => {
  const at = (plan, name, o = {}) => draft(Object.assign({ kind: 'try', machine: 'rover', by: 'Ada', made: 'person', plan, words: '' }, o), name, '2026-11-20');
  const L = ledger(), rover = machine('rover').plan;
  /* the rover's navigation must change: all circuits does not meet the need */
  assert.equal(checkEntry(at(rover, 'all circuits'), settle(L)).reason, 'machineFails');
  assert.equal(checkEntry(at({ nav: 'software', fly: 'circuit' }, 'bad part'), settle(L)).reason, 'plan');
  assert.equal(checkEntry(at({ nav: 'software' }, 'no need', { machine: 'toaster' }), settle(L)).reason, 'machine');
  assert.equal(checkEntry(at({ nav: 'software' }, 'and a puzzle', { puzzle: 'energy' }), settle(L)).reason, 'fields');
  const a = at({ nav: 'software', fab: 'flexible' }, '1 soft flex'), b = at({ nav: 'matter:cim', vote: 'circuit', clock: 'circuit' }, '2 cim giant'), c = at({ nav: 'software', fab: 'giant' }, '3 soft giant');
  const W = settle(L.concat([a, b, c]));
  assert.deepEqual(W.refused.map(e => e.reason), []);
  assert.equal(W.byId[a.id].facts.days, 7, 'a flexible line: a week a try at most');
  assert.ok(W.byId[b.id].facts.energy < 1 && W.byId[b.id].facts.days > 100);
  /* the same plan again, in another fab, is a new attempt only if the fab changes something */
  assert.equal(tryEntry(at({ nav: 'software', fab: 'flexible' }, 'again'), [a]).reason, 'same');
  /* standings from the scores alone: the giant fab's copy of the software plan is slower and no cheaper */
  assert.equal(W.byId[c.id].state, 'beaten');
  assert.equal(W.byId[a.id].state, 'front');
  assert.equal(W.bestMachine.rover, b.id);
  assert.deepEqual(machineAttemptsAt(W, 'rover').map(e => e.id), [a, b, c].map(e => e.id));
  /* the curve: the best so far never rises, and a law once three attempts have moved it */
  const C = labCurve(W, 'rover');
  C.points.forEach((p, i) => { assert.equal(p.n, i + 1); if (i) assert.ok(p.best <= C.points[i - 1].best); });
  assert.ok(C.slope < 0 && C.perDoubling > 0 && C.perDoubling < 1);
  assert.equal(labCurve(settle(L.concat([a])), 'rover').slope, null, 'one attempt: no law yet');
  /* the record has words for an attempt, and its file is the form the port writes */
  assert.ok(Game.entryWords(W.byId[a.id]).length > 10);
  assert.ok(fileOf(a).text.includes('"machine": "rover"'));
  /* the example attempts in the ledger draw a curve that has fallen */
  const H = labCurve(settled(), 'hearing');
  assert.ok(H.points.length >= 3 && H.slope < 0);
});

/* the front door (#372): anyone may add an entry or run an agent through the port, so a bad entry of any kind is refused
   with a reason and never thrown on, and the ledger settles the rest as if it were not there */
test('a bad entry of any kind is refused with a reason, never thrown on, and the ledger settles the rest', () => {
  const day = '2026-11-20', q = (o = {}) => draft(Object.assign({ kind: 'question', at: 'chip', q: 'What would a chip look like if it were designed for one model only?', by: 'Ada', made: 'person' }, o), 'ada one model', day);
  const no = (e, reason, why) => { let r; assert.doesNotThrow(() => { r = tryEntry(e); }, why || reason); assert.equal(r.ok, false, why || reason); assert.equal(r.reason, reason, why || reason); };
  assert.equal(tryEntry(q()).ok, true);
  /* LE1: a question whose under is a list (it used to pass the lookup as its string, then throw on split) */
  no(q({ under: ['think.chip'] }), 'under', 'under as a list');
  no(q({ under: { 'think.chip': 1 } }), 'under', 'under as a record');
  no(q({ part: ['gate'] }), 'home', 'part as a list');
  /* LE2: names every object has are no table's own: no level, no stop, no entry, no puzzle, front, need or level of the kitchen */
  for (const k of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
    no(q({ at: k }), 'home', 'at ' + k);
    no(q({ about: k }), 'about', 'about ' + k);
    no(q({ under: k }), 'under', 'under ' + k);
    no(brk({ of: k }), 'target', 'a break of ' + k);
    no(draft({ kind: 'try', of: k, by: 'Ada', made: 'person', cases: [CASE] }, 'try', day), 'target', 'a try of ' + k);
    no(draft({ kind: 'fix', of: k, words: 'fixed it now', by: 'Ada', made: 'person' }, 'fix', day), 'target', 'a fix of ' + k);
    no(draft({ kind: 'design', piece: 'half', title: 'Half adder', by: 'Ada', made: 'person', code: 'sum = a ^ b;\ncarry = a & b;', from: k }, 'half', day), 'from', 'built on ' + k);
    no(draft({ kind: 'design', piece: k, title: 'Half adder', by: 'Ada', made: 'person', code: 'sum = a ^ b;' }, 'half', day), 'piece', 'a design for ' + k);
    no(draft({ kind: 'try', puzzle: k, plan: {}, by: 'Ada', made: 'person' }, 'p', day), 'puzzle', 'the puzzle ' + k);
    no(draft({ kind: 'try', front: k, plan: { p: 0.5, n: 0.5 }, by: 'Ada', made: 'person' }, 'f', day), 'front', 'the front ' + k);
    no(draft({ kind: 'try', choice: k, pick: 'd0001', words: 'a reason long enough', by: 'Ada', made: 'person' }, 'c', day), 'choice', 'the need ' + k);
    no(draft({ kind: 'try', chef: k, plan: {}, by: 'Ada', made: 'person' }, 'k', day), 'chef', 'the kitchen level ' + k);
    no(draft({ kind: 'try', machine: k, plan: {}, by: 'Ada', made: 'person' }, 'm', day), 'machine', 'the machine need ' + k);
  }
  no(draft({ kind: 'try', puzzle: ['energy'], plan: {}, by: 'Ada', made: 'person' }, 'p', day), 'puzzle', 'a puzzle as a list');
  no(draft({ kind: 'try', puzzle: 'energy', plan: JSON.parse('{"__proto__":{"batch":4}}'), by: 'Ada', made: 'person' }, 'p', day), 'plan', 'a plan with __proto__ as a key');
  /* LE4: a batch of 1.4 would score as 1 and count as a new plan: it is refused, like any value the engine cannot run */
  no(draft({ kind: 'try', puzzle: 'energy', plan: { batch: 1.4 }, by: 'Ada', made: 'person' }, 'p', day), 'plan', 'a batch that is not whole');
  no(draft({ kind: 'try', puzzle: 'energy', plan: { adcBits: 6.5 }, by: 'Ada', made: 'person' }, 'p', day), 'plan', 'converter bits that are not whole');
  /* LE5: a day the calendar does not have, read back through toISOString */
  for (const d of ['2026-02-31', '2026-02-29', '2026-13-01', '2026-00-10', '2026-04-31']) no(Object.assign(q(), { id: d + '-question-ada-x' }), 'id', d);
  assert.equal(tryEntry(Object.assign(q(), { id: '2028-02-29-question-ada-leap' })).ok, true, 'a leap day is a day');
  /* not a record at all, or a name that is not a string */
  for (const e of [null, 5, 'x', [], [q()]]) no(e, 'id', JSON.stringify(e));
  no(Object.assign(q(), { id: ['2026-11-20-question-x'] }), 'id', 'an id as a list');
  /* the whole ledger with the bad ones in it: no throw, every bad one refused with a reason, the rest as before */
  const bad = [q({ under: ['think.chip'] }), q({ at: 'constructor', about: 'toString' }), Object.assign(q(), { id: '2026-02-31-question-ada-x' }), null, 7, [], { id: { toString: 1 } }, { id: '__proto__', kind: 'question' }, { id: 'constructor' }];
  /* a fault no check foresaw (here a field that throws when read) is refused as unread, never thrown on */
  const trap = q({ q: 'Does a field that throws when read stop the whole ledger from settling?' }); Object.defineProperty(trap, 'noticed', { enumerable: true, get() { throw new Error('a trap'); } });
  const good = q(), base = settled();
  let W; assert.doesNotThrow(() => { W = settle(ledger().concat(bad, [trap], good)); });
  assert.equal(W.refused.length, bad.length + 1);
  assert.ok(W.refused.every(e => typeof e.reason === 'string' && EN['ledger.no.' + e.reason]), 'every refusal has a reason with words');
  assert.equal(W.byId[trap.id].reason, 'unread');
  assert.equal(W.byId[good.id].ok, true, 'a good entry after the bad ones is kept');
  assert.deepEqual(W.entries.filter(e => e.id !== good.id).map(e => [e.id, e.state]), base.entries.map(e => [e.id, e.state]), 'the rest settle as if the bad ones were not there');
  assert.equal(tryEntry(trap).reason, 'unread');
  /* the world's tables are no object's: an inherited name finds nothing, from an entry, an address or an agent */
  assert.equal(base.byId.constructor, undefined); assert.equal(base.byId.__proto__, undefined);
  assert.deepEqual(standing(base, 'constructor'), []); assert.deepEqual(machineAttemptsAt(base, 'toString'), []);
});

/* an attempt at an architecture (#410): its history is grown again by the architecture engine, so a true claim is kept and
   a false one refused with a reason; standings come from the entries alone */
test('an attempt at an architecture is a try with its history: the replay keeps a true claim, refuses a false one, and marks the first to win', async () => {
  const day = '2026-11-26', hist = { start: 'in/charge/graph/stack', years: [] };
  /* grown the way a person plays: people first for ten years, then the engine's suggestion, until a need is won */
  let s = Arch.start(Arch.recipeOf(hist.start));
  while (!Arch.winsOf(s).length && s.year < 25) { const F = s.year < 10 ? ['people', Arch.suggest(s, 'archniche').dirs[0]] : Arch.suggest(s, 'archniche').dirs; hist.years.push(F); s = Arch.year(s, F); }
  const won = Arch.winsOf(s); assert.ok(won.length >= 1, 'the recipe wins a need');
  const at = (arch, name, o = {}) => draft(Object.assign({ kind: 'try', arch, by: 'Ada', made: 'person', words: '' }, o), name, day);
  const a = at(Arch.histClaim(hist, won), 'ada true');
  assert.deepEqual(tryEntry(a).ok, true);
  /* the same replay the lab runs: the state it ends in is the one the game reached */
  assert.equal(Arch.replay(a.arch).st.year, s.year); assert.deepEqual(Arch.replay(a.arch).wins, won);
  /* a claimed win the replay does not reach is refused with a reason, never thrown on */
  const lie = at(Object.assign(Arch.histClaim(hist, won), { wins: ['any'] }), 'ada lie');
  assert.doesNotThrow(() => tryEntry(lie)); assert.equal(tryEntry(lie).reason, 'archWin');
  /* one year fewer: not yet won */
  const early = at(Object.assign(Arch.histClaim(hist, won), { years: hist.years.slice(0, -1) }), 'ada early');
  assert.equal(tryEntry(early).reason, 'archWin');
  /* a history the engine cannot grow, in any field */
  for (const bad of [{ start: 'far/charge/program' }, { start: 'far/charge/magic/few' }, { years: [] }, { years: [['people', 'memory', 'tools']] }, { years: [['people', 'people']] }, { years: [['luck']] },
    { stones: { errors: 'transistor' } }, { stones: { constructor: 'x' } }, { changes: [{ at: 0, gene: 'shape', option: 'grid' }] }, { changes: [{ at: 99, gene: 'shape', option: 'grid' }] },
    { changes: [{ at: 2, gene: 'shape', option: 'grid' }, { at: 1, gene: 'told', option: 'events' }] }, { changes: [{ at: 1, gene: 'shape', option: 'blob' }] }, { changes: [{ at: 1, stone: 'nothing' }] },
    { wins: ['hearing', 'hearing'] }, { wins: 'hearing' }, { wins: ['toString'] }, { extra: 1 }])
    assert.equal(tryEntry(at(Object.assign(Arch.histClaim(hist, won), bad), 'bad')).reason, 'arch', JSON.stringify(bad));
  assert.equal(tryEntry(at(null, 'x', { arch: 'in/charge/graph/stack' })).reason, 'arch');
  assert.equal(tryEntry(at(Arch.histClaim(hist, won), 'mixed', { machine: 'rover' })).reason, 'fields');
  assert.equal(tryEntry(draft({ kind: 'try', choice: 'phone', pick: 'd0001', words: 'a reason long enough', arch: a.arch, by: 'Ada', made: 'person' }, 'c', day)).reason, 'fields');
  /* the same attempt again (each year's focus in any order) is the same; a fork makes it new */
  const again = at(Object.assign(Arch.histClaim(hist, won), { years: hist.years.map(f => f.slice().reverse()) }), 'bo again', { by: 'Bo' });
  assert.equal(tryEntry(again, [a]).reason, 'same');
  /* standings: the first to win a need nobody had won with a new recipe counts most; later winners stand; nobody votes */
  const later = at(Object.assign(Arch.histClaim(hist, won), { years: hist.years.concat([['tools']]) }), 'bo later', { by: 'Bo', made: 'ai', ai: 'An agent grew it a year longer.' });
  const known = { start: 'flow/charge/graph/grid', years: [['people']] }, kn = at(Arch.histClaim(known, Arch.replay(Object.assign({ wins: [] }, known)).wins), 'cy built', { by: 'Cy' });
  const W = settle(ledger().concat([a, later, kn]));
  assert.deepEqual(W.refused.map(e => e.id + ' ' + e.reason), []);
  const base = archAttempts(settled()), first = n => (base.first[n] ? base.first[n] : null);
  for (const n of won) assert.equal(W.archFirst[n], first(n) || a.id, 'the first to win ' + n);
  if (!won.some(n => first(n))) { assert.equal(W.byId[a.id].state, 'first'); assert.deepEqual(W.byId[a.id].firstIn, won); }
  assert.ok(['won', 'tried'].includes(W.byId[later.id].state), 'a later win of the same need with the same recipe stands');
  assert.equal(W.archSquare['in/charge/graph/stack'], base.square['in/charge/graph/stack'] || a.id, 'the first to win with the recipe marks its square');
  /* a recipe someone has built (the TPU) never takes a first, whatever it wins */
  assert.equal(W.byId[kn.id].facts.built, 'tpu'); assert.deepEqual(W.byId[kn.id].firstIn, []);
  /* people's and agents' attempts apart */
  const G = archAttempts(W);
  assert.ok(G.people.some(e => e.id === a.id) && G.agents.some(e => e.id === later.id));
  assert.ok(!G.people.some(e => e.made === 'ai' || e.made === 'program') && !G.agents.some(e => e.made === 'person'));
  for (const e of [a, later, kn]) assert.ok(EN['ledger.state.' + W.byId[e.id].state], W.byId[e.id].state);
  /* the record has words for it, and its file is the form the port writes */
  const { useTexts } = await import('../src/core/i18n.js'); useTexts(EN, 'en');
  assert.match(Game.entryWords(W.byId[a.id], Game.fresh()), new RegExp(EN['ar.need.' + won[0]]));
  assert.ok(fileOf(a).text.includes('"arch": {'));
  /* the examples in the ledger: one by the lab, played by hand, one by an agent through the port; each first in a niche */
  const E = archAttempts(settled());
  assert.ok(E.people.length >= 1 && E.agents.length >= 1, 'the map is not empty: people\'s and agents\' attempts');
  assert.ok(Object.keys(E.first).length >= 2 && Object.values(E.first).every(id => settled().byId[id].state === 'first'));
});
