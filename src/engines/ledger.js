/* The ledger: everything the community has added, replayed in order through the lab's engines. Pure logic, no
   DOM; tests in tests/ledger.test.mjs. The design and its reasons: docs/reviews/community.md.

   An entry is one small file in community/ledger/ (its name is its id: <date>-<kind>-<name>), added by a pull
   request and never changed afterwards. Three kinds are checked here today:
     design    a description for a piece of the shared computer (src/data/build.js). It must read, do the piece's
               job, and answer right on every case a break has added to that piece's check.
     break     a case (inputs, tick by tick) that makes an accepted design answer wrong, by someone else. The same
               engine that passed the design must fail it on the case. The case then joins the piece's check for
               good: every design after it has to pass it, and every earlier design that fails it is broken too.
     try       cases meant to break a design that did not; or an attempt at a puzzle (content/puzzles/): a plan the
               puzzle's engine scores (PUZZLES below); or an attempt at a machine for a need (src/data/blocks.js): a
               plan (a form for each part, and a fab) the machine engine checks and scores (src/engines/machine.js); a plan
               with nothing to make is the same in every fab.
               Every attempt kept, in order, draws the lab's curve: the best so far against the attempts so far
               (labCurve below, "Moore's law for ideas"); or an attempt at Keep the chef busy, the game of moving bits
               (src/engines/bits.js): a plan of its six levers at one of its levels, scored by the time the chef waits
               and the energy of one answer; each level has its own curve of the best time waiting (chefCurve below);
               or a choice among a thousand designs that all pass (src/engines/thousand.js): the need, the design picked
               and, in its words, the reason, one line no check could give. Only a person or an AI chooses (not both
               at once, so the two can be told apart), and once per need under a name;
               or an attempt at a front where two lenses meet (#326, FRONTS below): the values of the front's two
               controls, a point the front's model places on its chart; new among the attempts there.
     question  a question with a home: a level, perhaps a part of it and the question it sits under.
     report    the lab itself broken, by anyone, at any time: where (the site's address, perhaps a part), what kind
               (wrong, confusing, does not work, could be better) and the words. Feedback is not a stage of a plan:
               people stand outside it and break the design, the words and the way through, and the record keeps it.
     fix       a report answered: the report it closes, what changed, and the pull request that changed it. A fix
               that did not fix is answered by a new report at the same place.
   Two more kinds are designed and not built yet: check (a new engine) and show (a source, a figure, a real case).

   Nothing here is voted on and nobody gives points. settle() derives every standing from the entries alone:
   a design is right or broken; among the right ones of a piece, those no other beats on both size and speed hold
   a record, and the smallest of them is the one inside the shared computer. So the same ledger gives the same
   world to everyone, and anyone can replay it.

   The words of an entry are its author's own (not in en.json), and are data: checked for length and plain text,
   never run, never followed. Reasons for a refusal are codes; their words are ledger.no.<code>. */
import TC from './tinychip.js';
import { build, projectOf } from './design.js';
import { NEEDS } from '../data/build.js';
import { DEPTHS, STOPS, REPO } from '../data/weave.js';
import { budget, problem, PLAN, JOB } from './budget.js';
import { machine as runMachine, beats as machineBeats } from './machine.js';
import { needOf as machineNeed } from '../data/blocks.js';
import { NEEDS as CHOICE_NEEDS, designOf as choiceOf, reasonOk } from './thousand.js';
import { kitchen, levelOf as chefLevel, problem as chefProblem, normalPlan as chefPlan, LEVER_IDS as CHEF_LEVERS } from './bits.js';

export const KINDS = ['design', 'break', 'try', 'question', 'report', 'fix'];
/* what a report says about the lab */
export const SAYS = ['wrong', 'confusing', 'broken', 'better'];
/* who made it: a person, an AI agent, both, a program that searches (no language model), or the lab as an example */
export const MADE = ['person', 'ai', 'both', 'program', 'example'];
export const DIR = 'community/ledger';
const ID = /^(\d{4}-\d{2}-\d{2})-(design|break|try|question|report|fix)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FIELDS = {
  design: ['kind', 'piece', 'title', 'by', 'made', 'ai', 'words', 'code', 'from', 'about'],
  break: ['kind', 'of', 'by', 'made', 'ai', 'words', 'case', 'about'],
  /* a try: cases that were meant to break a design and did not. The trace of an attack that failed: what a
     design has survived is why it can be trusted, and where the next attacker need not look */
  try: ['kind', 'of', 'by', 'made', 'ai', 'words', 'cases', 'puzzle', 'machine', 'chef', 'front', 'plan', 'choice', 'pick', 'about'],
  question: ['kind', 'at', 'part', 'under', 'q', 'noticed', 'by', 'made', 'ai', 'about'],
  report: ['kind', 'at', 'part', 'say', 'words', 'by', 'made', 'ai'],
  fix: ['kind', 'of', 'words', 'pr', 'by', 'made', 'ai']
};
/* the puzzles (content/puzzles/): problems that run through every level, each scored by one engine. An attempt at one is
   a try with a plan instead of a design and its cases: a plan the engine can run, for the puzzle's job. Its score is
   the engine's alone; nobody votes. energy: the energy of one answer (src/engines/budget.js), lower is better. */
export const PUZZLES = { energy: { job: JOB, plan: PLAN, score: plan => budget(JOB, plan) } };
const planKey = p => JSON.stringify(Object.keys(PLAN).map(k => [k, p[k] === undefined ? PLAN[k] : p[k]]));
/* a plan as an entry holds it: only the plan's own keys, each a plain value (the engine checks the values) */
const planOk = p => p && typeof p === 'object' && !Array.isArray(p) && Object.keys(p).length <= Object.keys(PLAN).length &&
  Object.entries(p).every(([k, v]) => Object.hasOwn(PLAN, k) && (v === null || ['number', 'string', 'boolean'].includes(typeof v)));
/* a machine's plan as an entry holds it: a form for some of the need's parts, and perhaps a fab and a switch (sw), each a short word (the
   engine checks the forms and the fab); the key of a machine is its whole plan, with the start filled in */
const machinePlanOk = (n, p) => p && typeof p === 'object' && !Array.isArray(p) && Object.keys(p).length <= n.parts.length + 2 &&
  Object.entries(p).every(([k, v]) => (k === 'fab' || k === 'sw' || n.parts.some(q => q.id === k)) && typeof v === 'string' && v.length <= 40);
/* a plan for the chef's kitchen as an entry holds it: some of the six levers, each a number or a yes or no (the engine
   checks the values); its key is the plan with the start left out, so the same plan written two ways is the same */
const chefPlanOk = p => p && typeof p === 'object' && !Array.isArray(p) && Object.keys(p).length <= CHEF_LEVERS.length &&
  Object.entries(p).every(([k, v]) => CHEF_LEVERS.includes(k) && ['number', 'boolean'].includes(typeof v));
const chefKey = p => JSON.stringify(Object.entries(chefPlan(p)).sort());
/* a plan's switch (sw, src/engines/switch.js specKey) is part of its key only when a part is made of it */
const machineKey = (need, plan) => { const R = runMachine(need, plan), P = R.plan, sw = Object.values(P).includes('matter:switch');
  return JSON.stringify(Object.keys(P).filter(k => (k !== 'fab' || R.score.fab) && (k !== 'sw' || sw) && P[k] !== undefined).sort().map(k => [k, P[k]])); };
/* the fronts where two lenses meet (#315, #326): a front is today's best compromises between two measures, drawn where
   both come from one model (src/engines/lens.js, MEETS in src/data/frame.js). An attempt at one is a try with the
   front's key and a plan: the values of its two controls, each from 0 to 1 in tenths. Here the ledger checks the plan's
   form and keeps the attempts in order; where each one lands (its two measures) is the front's model's, computed where
   the front is drawn and in the tests (frontAttemptsAt takes the model), so the ledger loads without the level's
   drawing. Its key is the plan in tenths, so the same point written two ways is the same. */
export const FRONTS = { 'eff.geo': { level: 'block', plan: ['p', 'n'] } };
const tenth = v => typeof v === 'number' && v >= 0 && v <= 1 && Math.abs(v * 10 - Math.round(v * 10)) < 1e-9;
const frontPlanOk = (F, p) => p && typeof p === 'object' && !Array.isArray(p) && Object.keys(p).length === F.plan.length && F.plan.every(k => tenth(p[k]));
const frontKey = (F, p) => F.plan.map(k => Math.round(p[k] * 10)).join(',');
/* a report's place: the site's own address, as the bar shows it (#/line/print, #/dive/gate, #/build/record), read
   plainly (a challenge of the community's is #/do/break:<entry> or #/do/job:<piece>) */
export const PLACE = /^#\/[a-z0-9._:\/-]{0,80}$/;
/* plain words: no markup, no links (a link in free text is how spam pays), nothing a page or an agent could run */
const plain = (s, min, max) => typeof s === 'string' && s.length >= min && s.length <= max && !/[<>\u0000-\u0008\u000b-\u001f]|https?:|www\./i.test(s);
const norm = s => String(s || '').replace(/\s+/g, '').toLowerCase();
export const needOf = id => NEEDS.find(n => n.id === id) || null;

/* ---- the current ledger: set once at start-up (the site fetches it; tests and the port read the folder) ---- */
let ENTRIES = [], SETTLED = null;
export function useLedger(list) { ENTRIES = (Array.isArray(list) ? list : []).filter(e => e && typeof e === 'object' && typeof e.id === 'string'); SETTLED = null; }
export const ledger = () => ENTRIES;
export const settled = () => SETTLED || (SETTLED = settle(ENTRIES));

/* ---- a case run against a clocked design: the design and the piece's own rule, side by side, tick by tick ---- */
export function runCase(p, code, seq) {
  const proj = projectOf(p); if (!proj.seq || !proj.f) return null;
  const D = TC.parse(code, proj.ins, proj.outs, { regs: true }); if (D.errs && D.errs.length) return null;
  let s = {}, es = {}; const rows = [];
  for (const v of seq) { const r = TC.stepDesign(D, v, s), e = proj.f(v, es); rows.push({ v, o: r.out, e: e.out, mis: proj.outs.filter(n => r.out[n] !== e.out[n]) }); s = r.next; es = e.next; }
  return { rows, first: rows.findIndex(r => r.mis.length) };
}
/* is this a case for the piece: 1 to 32 ticks, each giving exactly the piece's inputs as 0 or 1 */
export function caseOk(p, seq) {
  const ins = projectOf(p).ins;
  return Array.isArray(seq) && seq.length >= 1 && seq.length <= 32 && seq.every(v => v && typeof v === 'object' && Object.keys(v).length === ins.length && ins.every(n => v[n] === 0 || v[n] === 1));
}

/* ---- one entry, checked against everything before it. W: the world so far (made by settle). ---- */
const no = (reason, more) => Object.assign({ ok: false, reason }, more || {});
export function checkEntry(e, W) {
  const m = ID.exec(e.id || ''); if (!m || isNaN(Date.parse(m[1]))) return no('id');
  if (m[2] !== e.kind || !KINDS.includes(e.kind)) return no('kind');
  if (Object.keys(e).some(k => k !== 'id' && k !== 'draft' && !FIELDS[e.kind].includes(k))) return no('fields');
  if (!plain(e.by, 2, 40)) return no('by');
  if (!MADE.includes(e.made)) return no('made');
  if (!plain(e.ai || '', 0, 300) || ((e.made === 'ai' || e.made === 'both' || e.made === 'program') && !String(e.ai || '').trim())) return no('sayAI');
  if (W.byId[e.id]) return no('same');
  /* traces that join the work up: the question this was done for (a stop, or a question someone added), and the
     design this one was built on */
  if (e.about != null && !STOPS[e.about] && !(W.byId[e.about] && W.byId[e.about].ok && W.byId[e.about].kind === 'question')) return no('about');
  if (e.from != null && !(W.byId[e.from] && W.byId[e.from].ok && W.byId[e.from].kind === 'design')) return no('from');
  if (e.kind === 'design') {
    const n = needOf(e.piece); if (!n || n.engine !== 'logic') return no('piece');
    if (!plain(e.title, 3, 60) || !plain(e.words || '', 0, 300) || typeof e.code !== 'string' || e.code.length > 2000) return no('words');
    const B = build({ p: n.project, code: e.code });
    if (B.errs.length) return no('reads');
    if (!B.ok) return no('wrong', { wrong: B.bad, of: B.total });
    const failed = (W.cases[e.piece] || []).find(c => { const r = runCase(n.project, e.code, c.case); return r && r.first >= 0; });
    if (failed) return no('case', { by: failed.by });
    if ((W.pieces[e.piece] || []).some(id => norm(W.byId[id].code) === norm(e.code))) return no('same');
    return { ok: true, facts: { transistors: B.transistors, ps: Math.round(B.st.crit), caught: Math.round(B.coverage * 100) } };
  }
  /* a choice among a thousand that pass: a need, one of its designs, and the reason in one line of the chooser's own
     words; a person or an AI, once per need under a name. Its facts are how the design treats each person around the
     need (src/engines/thousand.js LEAN): the ledger keeps the choice, and never ranks it */
  if (e.kind === 'try' && e.choice != null) {
    if (typeof e.choice !== 'string' || !Object.hasOwn(CHOICE_NEEDS, e.choice)) return no('choice');
    if (e.of != null || e.cases != null || e.puzzle != null || e.machine != null || e.chef != null || e.front != null || e.plan != null) return no('fields');
    if (e.made !== 'person' && e.made !== 'ai') return no('chooser');
    const d = typeof e.pick === 'string' ? choiceOf(e.choice, e.pick) : null; if (!d) return no('pick');
    if (!plain(e.words, 0, 300) || !reasonOk(e.words)) return no('reason');
    if ((W.choices[e.choice] || []).some(id => norm(W.byId[id].by) === norm(e.by))) return no('same');
    return { ok: true, facts: { lean: d.lean } };
  }
  if (e.kind === 'try' && e.pick != null) return no('fields');
  /* an attempt at a front: its two controls' values, new among the attempts there; where it lands is the front's model's */
  if (e.kind === 'try' && e.front != null) {
    const F = typeof e.front === 'string' && Object.hasOwn(FRONTS, e.front) ? FRONTS[e.front] : null; if (!F) return no('front');
    if (e.of != null || e.cases != null || e.puzzle != null || e.machine != null || e.chef != null) return no('fields');
    if (!plain(e.words || '', 0, 300)) return no('words');
    if (!frontPlanOk(F, e.plan)) return no('plan');
    if ((W.fronts[e.front] || []).some(id => frontKey(F, W.byId[id].plan) === frontKey(F, e.plan))) return no('same');
    return { ok: true, facts: { plan: F.plan.map(k => e.plan[k]) } };
  }
  /* an attempt at Keep the chef busy: a plan the kitchen can run at one of its levels, new among the attempts there; its
     facts are the engine's score (the share of time waiting and the energy of one answer, at the last round) */
  if (e.kind === 'try' && e.chef != null) {
    const L = typeof e.chef === 'string' ? chefLevel(e.chef) : null; if (!L) return no('chef');
    if (e.of != null || e.cases != null || e.puzzle != null || e.machine != null) return no('fields');
    if (!plain(e.words || '', 0, 300)) return no('words');
    if (!chefPlanOk(e.plan) || chefProblem(e.plan)) return no('plan');
    if ((W.chef[L.id] || []).some(id => chefKey(W.byId[id].plan) === chefKey(e.plan))) return no('same');
    const K = kitchen(L.id, e.plan);
    return { ok: true, facts: { wait: K.wait, energy: K.energy, cleared: K.cleared } };
  }
  /* an attempt at a machine: a plan that follows the grammar and meets the need, new among the attempts so far; its
     facts are the engine's score, counting only what is shown (the energy and days if the guesses fail) */
  if (e.kind === 'try' && e.machine != null) {
    const n = typeof e.machine === 'string' ? machineNeed(e.machine) : null; if (!n) return no('machine');
    if (e.of != null || e.cases != null || e.puzzle != null) return no('fields');
    if (!plain(e.words || '', 0, 300)) return no('words');
    if (!machinePlanOk(n, e.plan)) return no('plan');
    const R = runMachine(n.id, e.plan); if (!R.ok) return no('machineFails');
    if ((W.machines[n.id] || []).some(id => machineKey(n.id, W.byId[id].plan) === machineKey(n.id, e.plan))) return no('same');
    const S = R.score;
    return { ok: true, facts: { energy: S.high, low: S.low, changes: S.changes, exact: S.exact, days: S.daysHigh, fab: S.fab } };
  }
  /* an attempt at a puzzle: a plan the puzzle's engine runs, new among the attempts so far; its facts are the score */
  if (e.kind === 'try' && e.puzzle != null) {
    const Z = Object.hasOwn(PUZZLES, e.puzzle) ? PUZZLES[e.puzzle] : null; if (!Z) return no('puzzle');
    if (e.of != null || e.cases != null) return no('fields');
    if (!plain(e.words || '', 0, 300)) return no('words');
    if (!planOk(e.plan) || problem(Z.job, e.plan)) return no('plan');
    if ((W.puzzles[e.puzzle] || []).some(id => planKey(W.byId[id].plan) === planKey(e.plan))) return no('same');
    const b = Z.score(e.plan);
    return { ok: true, facts: { joules: b.total, seconds: b.seconds, snrDb: b.snrDb, times: b.times } };
  }
  if (e.kind === 'try') {
    if (e.plan != null) return no('fields');
    const T = W.byId[e.of]; if (!T || T.kind !== 'design' || !T.ok) return no('target');
    if (norm(T.by) === norm(e.by)) return no('own');
    if (!plain(e.words || '', 0, 300)) return no('words');
    const p = needOf(T.piece).project;
    if (!projectOf(p).seq) return no('proven');
    if (T.state === 'broken') return no('already');
    if (!Array.isArray(e.cases) || e.cases.length < 1 || e.cases.length > 8 || !e.cases.every(c => caseOk(p, c))) return no('caseForm');
    if (e.cases.some(c => runCase(p, T.code, c).first >= 0)) return no('breaks');
    return { ok: true, facts: { cases: e.cases.length, ticks: e.cases.reduce((a, c) => a + c.length, 0) } };
  }
  if (e.kind === 'break') {
    const T = W.byId[e.of]; if (!T || T.kind !== 'design' || !T.ok) return no('target');
    if (norm(T.by) === norm(e.by)) return no('own');
    if (!plain(e.words || '', 0, 300)) return no('words');
    const p = needOf(T.piece).project;
    if (!projectOf(p).seq) return no('proven');
    if (T.state === 'broken') return no('already');
    if (!caseOk(p, e.case)) return no('caseForm');
    const r = runCase(p, T.code, e.case);
    if (!r || r.first < 0) return no('holds');
    const row = r.rows[r.first];
    return { ok: true, facts: { tick: r.first + 1, ticks: e.case.length, want: row.e, got: row.o } };
  }
  /* a report: a place in the lab, what kind, and words enough to find it again */
  if (e.kind === 'report') {
    if (typeof e.at !== 'string' || !PLACE.test(e.at)) return no('where');
    if (e.part != null && !/^[a-z0-9]{1,24}$/.test(e.part)) return no('where');
    if (!SAYS.includes(e.say)) return no('say');
    if (!plain(e.words, 10, 400)) return no('report');
    if (W.entries.some(x => x.kind === 'report' && x.at === e.at && norm(x.words) === norm(e.words))) return no('same');
    return { ok: true, facts: {} };
  }
  /* a fix: an open report, what changed, and (if there is one) the pull request's number */
  if (e.kind === 'fix') {
    const T = W.byId[e.of]; if (!T || T.kind !== 'report' || !T.ok) return no('target');
    if (T.state === 'fixed') return no('fixed');
    if (!plain(e.words, 5, 300)) return no('words');
    if (e.pr != null && !(Number.isInteger(e.pr) && e.pr > 0 && e.pr < 100000)) return no('pr');
    return { ok: true, facts: {} };
  }
  /* a question: it must have a home, be a question, and say what was noticed */
  if (!DEPTHS[e.at]) return no('home');
  if (e.under != null && (!STOPS[e.under] || e.under.split('.')[1] !== e.at)) return no('under');
  if (e.part != null && !/^[a-z0-9]{1,24}$/.test(e.part)) return no('home');
  if (!plain(e.q, 15, 160) || !/\?\s*$/.test(e.q)) return no('question');
  if (!plain(e.noticed || '', 0, 240)) return no('words');
  if (W.entries.some(x => x.ok && x.kind === 'question' && x.at === e.at && norm(x.q) === norm(e.q))) return no('same');
  return { ok: true, facts: {} };
}

/* ---- the whole ledger, replayed in order (ids sort by date, then name). Returns the world it makes. ---- */
const beats = (a, b) => a.facts.transistors <= b.facts.transistors && a.facts.ps <= b.facts.ps && (a.facts.transistors < b.facts.transistors || a.facts.ps < b.facts.ps);
export function settle(list) {
  const W = { entries: [], byId: {}, pieces: {}, cases: {}, puzzles: {}, machines: {}, chef: {}, fronts: {}, choices: {}, refused: [], feed: [] };
  list.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).forEach(raw => {
    const r = checkEntry(raw, W), e = Object.assign({}, raw, { ok: r.ok, reason: r.reason || null, facts: r.facts || null, state: null, brokenBy: null, breaks: [], tries: [] });
    if (!r.ok) { W.refused.push(e); if (!W.byId[e.id]) W.byId[e.id] = e; return; }
    W.entries.push(e); W.byId[e.id] = e;
    if (e.kind === 'design') { (W.pieces[e.piece] = W.pieces[e.piece] || []).push(e.id); e.state = 'right'; W.feed.push({ type: 'built', id: e.id }); }
    else if (e.kind === 'break') {
      const T = W.byId[e.of], p = needOf(T.piece).project;
      (W.cases[T.piece] = W.cases[T.piece] || []).push({ case: e.case, by: e.id });
      /* the case joins the check: every right design of the piece meets it now */
      W.pieces[T.piece].map(id => W.byId[id]).filter(d => d.state === 'right').forEach(d => { const x = runCase(p, d.code, e.case); if (x && x.first >= 0) { d.state = 'broken'; d.brokenBy = e.id; e.breaks.push(d.id); } });
      e.state = 'stands'; W.feed.push({ type: 'broke', id: e.id });
    } else if (e.kind === 'try' && e.choice != null) { (W.choices[e.choice] = W.choices[e.choice] || []).push(e.id); e.state = 'stands'; W.feed.push({ type: 'chose', id: e.id }); }
    else if (e.kind === 'try' && e.front != null) { (W.fronts[e.front] = W.fronts[e.front] || []).push(e.id); e.state = 'stands'; W.feed.push({ type: 'attempted', id: e.id }); }
    else if (e.kind === 'try' && e.chef != null) { (W.chef[e.chef] = W.chef[e.chef] || []).push(e.id); e.state = 'front'; W.feed.push({ type: 'attempted', id: e.id }); }
    else if (e.kind === 'try' && e.machine != null) { (W.machines[e.machine] = W.machines[e.machine] || []).push(e.id); e.state = 'front'; W.feed.push({ type: 'attempted', id: e.id }); }
    else if (e.kind === 'try' && e.puzzle != null) { (W.puzzles[e.puzzle] = W.puzzles[e.puzzle] || []).push(e.id); e.state = 'front'; W.feed.push({ type: 'attempted', id: e.id }); }
    else if (e.kind === 'try') { W.byId[e.of].tries.push(e.id); e.state = 'stands'; W.feed.push({ type: 'tried', id: e.id }); }
    else if (e.kind === 'report') { e.state = 'open'; W.feed.push({ type: 'reported', id: e.id }); }
    else if (e.kind === 'fix') { const T = W.byId[e.of]; T.state = 'fixed'; T.fixedBy = e.id; e.state = 'stands'; W.feed.push({ type: 'fixed', id: e.id }); }
    else { e.state = 'stands'; W.feed.push({ type: 'asked', id: e.id }); }
  });
  /* standings: among a piece's right designs, the ones nothing beats on both size and speed hold a record; an
     equal design that came later is behind; the smallest holder (the earliest, if equal) is inside the computer */
  W.inside = {};
  Object.entries(W.pieces).forEach(([piece, ids]) => {
    const right = ids.map(id => W.byId[id]).filter(d => d.state === 'right');
    right.forEach((d, i) => { const beaten = right.some((o, j) => o !== d && (beats(o, d) || (j < i && o.facts.transistors === d.facts.transistors && o.facts.ps === d.facts.ps))); d.state = beaten ? 'behind' : 'holds'; });
    const holders = right.filter(d => d.state === 'holds').sort((a, b) => a.facts.transistors - b.facts.transistors);
    if (holders.length) W.inside[piece] = holders[0].id;
  });
  /* a puzzle's standings: an attempt is on the frontier while no other is at least as good on all three sides (less energy, less time,
     more accuracy) and better on one; an equal attempt that came later is behind. The best is the one on the frontier with the least
     energy (the earliest, if equal) */
  W.best = {};
  Object.entries(W.puzzles).forEach(([z, ids]) => {
    const A = ids.map(id => W.byId[id]), f = a => a.facts;
    const better = (o, a) => f(o).joules <= f(a).joules && f(o).seconds <= f(a).seconds && f(o).snrDb >= f(a).snrDb && (f(o).joules < f(a).joules || f(o).seconds < f(a).seconds || f(o).snrDb > f(a).snrDb);
    const same = (o, a) => f(o).joules === f(a).joules && f(o).seconds === f(a).seconds && f(o).snrDb === f(a).snrDb;
    A.forEach((a, i) => { a.state = A.some((o, j) => o !== a && (better(o, a) || (j < i && same(o, a)))) ? 'beaten' : 'front'; });
    const H = A.filter(a => a.state === 'front').sort((a, b) => f(a).joules - f(b).joules);
    if (H.length) W.best[z] = H[0].id;
  });
  /* a machine's standings, the same way: on the frontier while no other attempt beats it on energy, what can change,
     what is exact and days a try (src/engines/machine.js beats); the best is the cheapest on the frontier */
  W.bestMachine = {};
  Object.entries(W.machines).forEach(([n, ids]) => {
    const A = ids.map(id => W.byId[id]), f = a => a.facts;
    const same = (o, a) => ['energy', 'changes', 'exact', 'days'].every(k => f(o)[k] === f(a)[k]);
    A.forEach((a, i) => { a.state = A.some((o, j) => o !== a && (machineBeats(f(o), f(a)) || (j < i && same(o, a)))) ? 'beaten' : 'front'; });
    const H = A.filter(a => a.state === 'front').sort((a, b) => f(a).energy - f(b).energy);
    if (H.length) W.bestMachine[n] = H[0].id;
  });
  /* the kitchen's standings at each level, the same way: on the frontier while no other attempt there waits less and
     spends less energy (at least as good on both, better on one); the best is the one on the frontier that waits least */
  W.bestChef = {};
  Object.entries(W.chef).forEach(([lv, ids]) => {
    const A = ids.map(id => W.byId[id]), f = a => a.facts;
    const better = (o, a) => f(o).wait <= f(a).wait && f(o).energy <= f(a).energy && (f(o).wait < f(a).wait || f(o).energy < f(a).energy);
    const same = (o, a) => f(o).wait === f(a).wait && f(o).energy === f(a).energy;
    A.forEach((a, i) => { a.state = A.some((o, j) => o !== a && (better(o, a) || (j < i && same(o, a)))) ? 'beaten' : 'front'; });
    const H = A.filter(a => a.state === 'front').sort((a, b) => f(a).wait - f(b).wait || f(a).energy - f(b).energy);
    if (H.length) W.bestChef[lv] = H[0].id;
  });
  /* who checks whom: for every break, who made the design and who made the break */
  W.cross = {}; W.entries.filter(e => (e.kind === 'break' || e.kind === 'try') && e.of).forEach(e => { const k = W.byId[e.of].made + '>' + e.made; W.cross[k] = (W.cross[k] || 0) + 1; });
  /* who makes what: entries by kind and by maker */
  W.mix = {}; W.entries.forEach(e => { const M = (W.mix[e.kind] = W.mix[e.kind] || {}); M[e.made] = (M[e.made] || 0) + 1; });
  W.makers = [...new Set(W.entries.map(e => e.by))];
  return W;
}

/* the designs of a piece that stand (right, not broken), the one inside the computer first */
export function standing(W, piece) { return (W.pieces[piece] || []).map(id => W.byId[id]).filter(d => d.state !== 'broken').sort((a, b) => (W.inside[piece] === b.id) - (W.inside[piece] === a.id)); }
/* the questions people have added at a level, or under one question */
export const questionsAt = (W, at, under) => W.entries.filter(e => e.kind === 'question' && e.at === at && (under == null || e.under === under));

/* ---- the frontier: what is open right now, read from the ledger. Each is where a contribution can start. ----
   build   a piece an engine can check, with no right design yet
   break   a clocked design that stands: its check tried some cases, not all. Nobody has broken it (yet)
   engine  a piece nothing can check yet: the contribution is the check itself */
export function frontier(W) {
  const leaf = n => !NEEDS.some(x => x.parent === n.id), out = [];
  NEEDS.filter(leaf).forEach(n => {
    if (n.engine === 'logic' && !standing(W, n.id).length) out.push({ kind: 'build', piece: n.id, p: n.project });
    if (n.engine == null) out.push({ kind: 'engine', piece: n.id });
  });
  W.entries.filter(e => e.kind === 'design' && e.state !== 'broken' && projectOf(needOf(e.piece).project).seq).forEach(e => out.push({ kind: 'break', of: e.id, piece: e.piece, p: needOf(e.piece).project, inside: W.inside[e.piece] === e.id, tries: e.tries.length }));
  /* the pull of each open thing, from the traces alone (nobody assigns it): a piece whose only designs were broken
     calls loudest; a piece many copies depend on calls louder; a design inside the computer that nobody has attacked
     calls louder than one that has survived tries, and each try quiets it. So attention goes where the record is
     thinnest, and moves on once it is thick. */
  /* a question someone asked is a call of its own: loud while nothing has been done for it, quieter as work gathers
     under it (designs, breaks, tries, questions that name it), and never silent, because it stays open */
  W.entries.filter(e => e.kind === 'question').forEach(e => out.push({ kind: 'ask', q: e.id, under: e.under || null, at: e.at, work: workFor(W, e.id).length }));
  /* a report nobody has fixed: something that does not work calls loudest, then something untrue, something
     confusing, an idea; and louder for every other open report at the same place. A fix takes it off the list */
  /* a puzzle stays open for good (no attempt reaches the floor): it calls loudest while few have tried it */
  Object.keys(PUZZLES).forEach(z => { const n = (W.puzzles[z] || []).length; out.push({ kind: 'puzzle', puzzle: z, attempts: n, best: W.best[z] || null }); });
  const open = W.entries.filter(e => e.kind === 'report' && e.state === 'open');
  open.forEach(e => out.push({ kind: 'report', of: e.id, at: e.at, say: e.say, same: open.filter(x => x !== e && x.at === e.at).length }));
  const copies = id => { let n = 1, x = needOf(id); while (x && x.parent) { x = needOf(x.parent); if (x && x.engine === 'repeat') n *= x.n; } return n; };
  out.forEach(f => { f.pull = f.kind === 'build' ? 2 + Math.log10(copies(f.piece)) + ((W.pieces[f.piece] || []).length ? 3 : 0) : f.kind === 'break' ? (f.inside ? 4 : 2) / (1 + f.tries) : f.kind === 'ask' ? 0.5 + 4 / (1 + f.work) : f.kind === 'report' ? { broken: 2.5, wrong: 2, confusing: 1.5, better: 1 }[f.say] + 0.5 * f.same : f.kind === 'puzzle' ? 1 + 2 / (1 + f.attempts) : 1; });
  return out.sort((a, b) => b.pull - a.pull);
}
/* the small society the ledger shows: every maker, what they do (roles are not given, they are what someone's
   entries add up to), whose work they checked (a break or a try) and whose they built on */
export function society(W) {
  const M = {}; const at = e => (M[e.by] = M[e.by] || { by: e.by, made: new Set(), does: {}, checked: new Set(), builtOn: new Set(), checkedBy: new Set() });
  W.entries.forEach(e => { const m = at(e); m.made.add(e.made); m.does[e.kind] = (m.does[e.kind] || 0) + 1;
    if ((e.kind === 'break' || e.kind === 'try') && e.of) { const T = W.byId[e.of]; m.checked.add(T.by); at(T).checkedBy.add(e.by); }
    if (e.from && W.byId[e.from].by !== e.by) m.builtOn.add(W.byId[e.from].by); });
  return Object.values(M).map(m => Object.assign(m, { made: [...m.made], checked: [...m.checked], builtOn: [...m.builtOn], checkedBy: [...m.checkedBy] }));
}
/* the attempts at a machine for a need, in the order they were kept */
export const machineAttemptsAt = (W, need) => (W.machines[need] || []).map(id => W.byId[id]);
/* the lab's curve (Moore's law for ideas): for every attempt kept at a need, in order, its energy and the best energy so
   far. Moore's law counts years; Wright's law counts how many have been made (facts.json wright-law); this counts
   attempts. The law is a straight line through the best so far against the attempts so far, both on log scales:
   slope b, so the best falls to 2^b of itself each time the attempts double (perDoubling: the share it falls by).
   It needs three attempts and a best that has moved; until then there is no law, only points. */
export function labCurve(W, need) {
  let best = Infinity;
  const points = machineAttemptsAt(W, need).map((e, i) => { best = Math.min(best, e.facts.energy); return { n: i + 1, id: e.id, by: e.by, made: e.made, energy: e.facts.energy, best, draft: !!e.draft }; });
  if (points.length < 3 || points[0].best === best) return { points, slope: null, perDoubling: null };
  const X = points.map(p => Math.log(p.n)), Y = points.map(p => Math.log(p.best)), mx = X.reduce((a, b) => a + b) / X.length, my = Y.reduce((a, b) => a + b) / Y.length;
  const slope = X.reduce((a, x, i) => a + (x - mx) * (Y[i] - my), 0) / X.reduce((a, x) => a + (x - mx) ** 2, 0);
  return { points, slope, perDoubling: 1 - Math.pow(2, slope) };
}
/* the attempts at a level of the chef's kitchen, in the order they were kept, and the level's curve: for each, its
   time waiting and the best time waiting so far (each level has its own; nobody votes, the engine scores) */
export const chefAttemptsAt = (W, level) => ((W.chef || {})[level] || []).map(id => W.byId[id]);
export function chefCurve(W, level) {
  let best = Infinity;
  return chefAttemptsAt(W, level).map((e, i) => { best = Math.min(best, e.facts.wait); return { n: i + 1, id: e.id, by: e.by, made: e.made, wait: e.facts.wait, energy: e.facts.energy, cleared: e.facts.cleared, best, draft: !!e.draft }; });
}
/* the attempts at a front, in the order they were kept, each placed by the front's model: score(plan) -> { x, y }, both
   lower is better (the block's front: the block's energy per answer, and its hottest patch). An attempt is on the
   ledger's front while no other is at least as good on both and better on one (an equal one that came later is behind);
   nobody votes, the model places every point */
export function frontAttemptsAt(W, key, score) {
  const A = ((W.fronts || {})[key] || []).map(id => W.byId[id]).map((e, i) => { const r = score(e.plan); return { n: i + 1, id: e.id, by: e.by, made: e.made, words: e.words || '', plan: e.plan, draft: !!e.draft, x: r.x, y: r.y }; });
  const better = (o, a) => o.x <= a.x && o.y <= a.y && (o.x < a.x || o.y < a.y);
  A.forEach((a, i) => { a.state = A.some((o, j) => o !== a && (better(o, a) || (j < i && o.x === a.x && o.y === a.y))) ? 'beaten' : 'front'; });
  return A;
}
/* the choices kept for a need of A thousand that pass, as two groups that are never mixed: people's and AI agents',
   each in the order kept. Read from the entries alone: nobody votes, nothing is counted as a score */
export function choicesAt(W, need) {
  const all = ((W.choices || {})[need] || []).map(id => W.byId[id]);
  return { people: all.filter(e => e.made === 'person'), agents: all.filter(e => e.made === 'ai') };
}
/* the attempts at a puzzle, the best first, then those on the frontier, then the newest */
export const attemptsAt = (W, z) => (W.puzzles[z] || []).map(id => W.byId[id]).sort((a, b) => (W.best[z] === b.id) - (W.best[z] === a.id) || (a.state === 'front' ? 0 : 1) - (b.state === 'front' ? 0 : 1) || (a.id < b.id ? 1 : -1));
/* the reports at a place in the lab (its address), open first, then the newest */
export const reportsAt = (W, at) => W.entries.filter(e => e.kind === 'report' && e.at === at).sort((a, b) => (a.state === 'open' ? 0 : 1) - (b.state === 'open' ? 0 : 1) || (a.id < b.id ? 1 : -1));
/* the work done for a question: every entry that names it (a stop, or a question someone added) */
export const workFor = (W, key) => W.entries.filter(e => e.about === key);

/* ---- writing an entry: its id, its file, and the link that opens it on GitHub as a new file in a pull request ---- */
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 32).replace(/-+$/, '') || 'entry';
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36).slice(0, 4).padStart(4, '0'); };
export const today = d => (d || new Date()).toISOString().slice(0, 10);
/* fields: the entry without its id; name: a few words for the file's name */
export function draft(fields, name, day) {
  const body = {}; FIELDS[fields.kind].forEach(k => { if (fields[k] != null && fields[k] !== '') body[k] = fields[k]; });
  if (body.ai == null) body.ai = '';
  return Object.assign({ id: (day || today()) + '-' + fields.kind + '-' + slug(name) + '-' + hash(JSON.stringify(body)) }, body);
}
export function fileOf(e) {
  const body = {}; FIELDS[e.kind].forEach(k => { if (e[k] != null) body[k] = e[k]; });
  return { path: DIR + '/' + e.id + '.json', text: JSON.stringify(body, null, 2) + '\n' };
}
export function proposeUrl(e) { const f = fileOf(e); return REPO + '/new/main/' + DIR + '?filename=' + encodeURIComponent(e.id + '.json') + '&value=' + encodeURIComponent(f.text); }
/* check a draft against the ledger as it stands (and any other drafts of yours before it) */
export function tryEntry(e, extra) { const W = settle(ENTRIES.concat(extra || [])); return W.byId[e.id] ? no('same') : checkEntry(e, W); }
