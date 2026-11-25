/* The chip world as a game that grows. Pure logic, no DOM; tests in tests/game.test.mjs.

   The main thread is a chip's life, a loop: design, make, test, ship, use; and what fails goes back to
   design. Each step has a station on the island, and every station offers the same three doors:
     Do   challenges, each checked for real by one of the lab's engines (a circuit by the tiny-chip engine,
          a chip's settings by src/engines/chip.js, a chip's life by src/engines/life.js);
     Look ways inside: a place to fly through, a line to follow, a chip to read;
     Ask  open questions (stops of the threads) and debates.
   What you finish grows the island (GROWTH). What the community builds grows it too: the shared computer at
   the Lab rises with every piece of the plan that is built (src/data/build.js), community designs stand as
   workshops in the makers' village, and every open job is an empty plot anyone, person or AI, can take.
   To add content, add data here (a challenge, a door, a growth) or in src/data/build.js; the island and the
   pages are drawn from it. Words: game.*, look.*, grow.* (src/i18n/en/). The loop itself (the steps, the places,
   the challenges, the levels, and your state as far as the loop reads it) is src/v2/loop.js, which the shell imports on
   every page; this module adds the engines behind it and re-exports the loop, so a view, a lab or a test imports the
   whole game from here. It loads when a view that needs it first opens (docs/ARCHITECTURE.md, "What loads when"). */
import { build, projectOf, solutionOf } from '../engines/design.js';
import { model, CHALLENGES as CHIP, START, normal, SETTINGS } from '../engines/chip.js';
import { live, PERFECT, normalLife } from '../engines/life.js';
import { plan, progress, needOf, childrenOf, designsFor, allDesigns } from '../engines/build.js';
import { ledger, settle, frontier, questionsAt, society, workFor, KINDS as ENTRY_KINDS } from '../engines/ledger.js';
import { t, fmtNum } from '../core/i18n.js';
import { normalJoule } from './joule.js';
import { normalState as normalChef } from '../engines/bits.js';
import { NEEDS, AGENT } from '../data/build.js';
import { STOPS } from '../data/weave.js';
import { QUESTIONS } from '../data/atlas.js';
import { normalBetOf } from '../engines/bet.js';
import { normalLevers, PUZZLES } from '../engines/ripple.js';
import { normalAgent } from '../data/agent.js';
import { CHALLENGES, challengeOf, isDone, OPENS, FRONT_ASK, KEY, CHECKED, readState } from './loop.js';
export * from './loop.js';

/* a circuit's starting description: the job's own, or one that is almost right (a fix-it job) */
const STARTERS = { half: 'sum = a | b;\ncarry = a & b;' };
export const starter = p => STARTERS[p] || projectOf(p).starter;
export const ownStarter = p => p in STARTERS;   /* its words: game.own.<p> */

/* ---- the bench: one design of your own, carried from the job to the masks ----
   The pieces of the community's computer a design engine can check (src/data/build.js, engine 'logic'), by their job.
   Your design starts as the lab's working example for the piece you pick (the job's solution); changing it makes it
   yours. bench: { p, code (null: the lab's example), rows (your order of the cells on the tile, or null) }. */
export const BENCH_PIECES = NEEDS.filter(n => n.engine === 'logic' && n.project && projectOf(n.project).id === n.project && solutionOf(n.project)).map(n => ({ need: n.id, p: n.project }));
export const benchPieceOf = p => BENCH_PIECES.find(x => x.p === p) || null;
export function normalBench(b) {
  const o = b && typeof b === 'object' ? b : {}, p = benchPieceOf(o.p) ? o.p : 'half';
  const code = typeof o.code === 'string' && o.p === p ? o.code.slice(0, 4000) : null;
  const rows = Array.isArray(o.rows) && o.rows.length <= 12 && o.rows.every(r => Array.isArray(r) && r.length <= 60 && r.every(Number.isInteger)) ? o.rows.map(r => r.slice()) : null;
  const floor = Array.isArray(o.floor) && o.floor.length <= 12 && o.floor.every(r => Array.isArray(r) && r.every(Number.isInteger)) ? o.floor.map(r => r.slice()) : null;
  const q = x => ({ k: Number.isInteger(x && x.k) ? x.k : 0, run: Number.isInteger(x && x.run) ? Math.max(0, x.run) : 0 });
  return { p, code: code === solutionOf(p) ? null : code, rows, floor, mq: q(o.mq), jq: Object.assign(q(o.jq), { ans: o.jq && o.jq.ans && typeof o.jq.ans === 'object' ? Object.fromEntries(Object.entries(o.jq.ans).filter(([k, v]) => typeof k === 'string' && (v === 0 || v === 1))) : {} }) };
}
/* your design on the bench now: its job, its text, who wrote it (the lab's example until you change it), built */
export function benchDesign(s) {
  const b = normalBench(s && s.bench), code = b.code != null ? b.code : solutionOf(b.p);
  return { p: b.p, code, by: b.code != null ? 'you' : 'example', B: build({ p: b.p, code }) };
}

/* The design challenges are fixed by tapping, not typing (src/v2/play.js). Every gate in a description is a button
   that turns into the next kind (AND → OR → XOR); where the fix needs more than a gate, a tray holds pieces that
   can be added to one line and taken off again. Exactly one way leads to a right design, and the engine checks it
   after every tap. Typing stays open for anyone who wants it. */
export const TAPS = {
  half: { pieces: null },
  vote: { line: 0, pieces: ['| (a | c)', '| (a & c)', '& (a ^ c)'] },
  full: { line: 0, pieces: ['& cin', '| cin', '^ cin'] }
};
export const GATE_TURN = { '&': '|', '|': '^', '^': '&' };
/* turn the k-th gate of a description into the next kind */
export const turnGate = (code, k) => { let i = -1; return code.replace(/[&|^]/g, m => (++i === k ? GATE_TURN[m] : m)); };
/* a piece on a line, added before its ';' or taken off */
const lineOf = (code, n) => code.split('\n')[n] || '';
export const hasPiece = (code, n, piece) => lineOf(code, n).includes(' ' + piece);
export const togglePiece = (code, n, piece) => code.split('\n').map((l, i) => i !== n ? l : hasPiece(code, n, piece) ? l.replace(' ' + piece, '') : l.replace(/;?\s*$/, ' ' + piece + ';')).join('\n');

/* the goal of a chip challenge as gauges: each a value of your chip's model and the bound it must reach
   (ge: at least, le: at most). Together they say the same as the goal's met() in src/engines/chip.js. */
export const GAUGES = {
  months: [{ k: 'days', le: 60 }, { k: 'load', ge: 0.92 }],
  quick: [{ k: 'layers', le: 50 }, { k: 'cores', ge: 12 }],
  cores: [{ k: 'cores', ge: 16 }, { k: 'cost', le: 1.2 }],
  fed: [{ k: 'work', ge: 2.5 }, { k: 'late', le: 0 }],
  fast: [{ k: 'clock', ge: 1.5 }, { k: 'late', le: 0 }]
};
/* how far a gauge is toward its bound, 0..1, and whether it is there */
export function gauge(g, m) {
  const v = m[g.k], ok = g.ge != null ? v >= g.ge : v <= g.le;
  const f = ok ? 1 : g.ge != null ? Math.max(0, v / g.ge) : g.le === 0 ? 1 / (1 + v) : Math.max(0, g.le / v);
  return { v, ok, f: Math.min(1, f) };
}
/* your design, as the chip carries it: the last design challenge you finished, built by the design engine */
export function yourDesign(s) {
  /* the design you made your own on the bench, while it is right */
  const b = s.bench && s.bench.code != null ? benchDesign(s) : null; if (b && b.B.ok) return { p: b.p, B: b.B };
  const c = ['full', 'vote', 'half'].map(challengeOf).find(x => x && isDone(s, x.id)); if (!c) return null;
  const B = checkDesign(c.p, s.codes[c.p] || starter(c.p)); return B.ok ? { p: c.p, B } : null;
}
export const chipGoal = id => CHIP.find(c => c.id === id);

/* ---- your state, whole: what the loop reads (readState, src/v2/loop.js) and what the engines check ---- */
export function fresh() { return { done: {}, codes: {}, chip: Object.assign({}, START), life: {}, seen: false, drafts: [], sent: {}, met: {}, crossed: {}, bets: {}, whatif: { levers: {}, solved: {} }, agent: {}, teardown: {}, fit: {}, evolve: {}, litho: { best: {} }, aibuild: {}, looked: {}, joule: { on: false, plan: {} }, chef: normalChef(null), name: '', bench: normalBench(null) }; }
export function normalState(s) {
  const f = fresh();
  if (!s || typeof s !== 'object') return f;
  /* your entries not yet in the ledger (at most 24), and which of them you have sent */
  const drafts = (Array.isArray(s.drafts) ? s.drafts : []).filter(d => d && typeof d.id === 'string' && ENTRY_KINDS.includes(d.kind)).slice(-24);
  const sent = {}; Object.keys(s.sent || {}).forEach(k => { if (drafts.some(d => d.id === k)) sent[k] = true; });
  const lifeC = {}; Object.entries(s.life || {}).forEach(([k, v]) => { lifeC[k] = normalLife(v); });
  /* where you left each bet's dials (src/engines/bet.js) */
  const bets = {}; CHALLENGES.filter(c => c.kind === 'bet').forEach(c => { if (s.bets && s.bets[c.id]) bets[c.id] = normalBetOf(c.bet, s.bets[c.id]); });
  /* What if?: the levers where you left them, and the puzzles you solved (src/engines/ripple.js) */
  const w = s.whatif || {}, whatif = { levers: normalLevers(w.levers), solved: {} }; Object.keys(w.solved || {}).forEach(k => { if (PUZZLES.some(p => p.id === k)) whatif.solved[k] = true; });
  return Object.assign(readState(s), { drafts, sent, chip: normal(s.chip || START), life: lifeC, bets, whatif, agent: normalAgent(s.agent), joule: normalJoule(s.joule), chef: normalChef(s.chef), bench: normalBench(s.bench) });
}
export function load(store) { try { return normalState(JSON.parse(store.getItem(KEY) || 'null')); } catch (e) { return fresh(); } }
/* the state the shell read before the engines came (readState): what they check, checked now, in place */
export function complete(s) { const n = normalState(s); CHECKED.forEach(k => { s[k] = n[k]; }); return s; }

/* ---- checks: each challenge asks its engine ---- */
export function checkDesign(p, code) { return build({ p, code }); }
/* a job the studio has as a project (projectOf falls back to the first one for anything else) */
export const hasProject = p => projectOf(p).id === p;
export function checkChip(goal, settings) { const m = model(normal(settings)); return { m, ok: !!chipGoal(goal).met(m) }; }
export function checkLife(mission, choices) { return live(mission, normalLife(choices), { coverage: 1 }); }

/* Find the broken chip: four copies of a full adder, one spoiled at the factory with a wire stuck at 0 or 1.
   You may run a few test patterns; a pattern catches the fault only if it makes the broken copy answer wrong. */
export const SPOT = { chips: 4, tests: 3 };
/* The copies are of your own full adder once you have designed one that passes, else of the lab's.
   The factory's fault is the first that only some patterns catch, so choosing the patterns matters. */
const spotCache = new Map();
export const spotCode = s => (s && isDone(s, 'full') && s.codes.full && checkDesign('full', s.codes.full).ok ? s.codes.full : null);
export function spotCase(code) {
  const key = code || solutionOf('full');
  if (spotCache.has(key)) return spotCache.get(key);
  let found = null;
  for (let seed = 0; seed < 60 && !found; seed++) {
    const B = build({ p: 'full', code: key, defect: seed });
    if (!B.defect) continue;
    const wrong = B.defect.rows.filter(r => r.mis.length).length;
    if (wrong >= 2 && wrong <= 3) found = { seed, B };
  }
  if (!found) { for (let seed = 0; seed < 60 && !found; seed++) { const B = build({ p: 'full', code: key, defect: seed }); if (B.defect && B.defect.wrong < B.rows.length) found = { seed, B }; } }
  const { seed, B } = found;
  const C = { seed, yours: !!code, broken: 2, rows: B.rows, bad: B.defect.rows, ins: B.ins, outs: B.outs, net: B.defect.net, v: B.defect.v };
  spotCache.set(key, C); return C;
}
/* what a copy answers to a pattern: the broken one answers as spoiled, the others as designed */
export const spotAnswer = (S, chip, i) => (chip === S.broken ? S.bad[i].o : S.rows[i].e);


/* ---- the community: the ledger replayed (src/engines/ledger.js), with your own entries not yet in it ---- */
/* the world the ledger makes, with your drafts on top (marked draft: only you see them, until they are merged).
   A draft that is already in the ledger (merged since) is left out. */
let worldKey = null, worldOf_ = null;
export function world(s) {
  const L = ledger(), ids = new Set(L.map(e => e.id)), mine = ((s && s.drafts) || []).filter(d => !ids.has(d.id)).map(d => Object.assign({}, d, { draft: true }));
  const key = L.length + '|' + mine.map(d => d.id).join(',');
  if (key !== worldKey) { worldKey = key; worldOf_ = settle(L.concat(mine)); }
  return worldOf_;
}
export function community(s) {
  const jobsDone = Object.keys(s.done).filter(k => k.startsWith('job:')).map(k => needOf(k.slice(4))).filter(n => n && n.project).map(n => n.project);
  const mine = CHALLENGES.filter(c => c.kind === 'design' && isDone(s, c.id)).map(c => c.p).concat(jobsDone);
  const W = world(s), P = plan(mine, W), pr = progress(P), F = frontier(W);
  const leaves = NEEDS.filter(n => !childrenOf(n.id).length);
  return {
    built: pr.built, total: pr.total, W,
    /* jobs anyone can take: pieces a design can fill, still without one */
    jobs: leaves.filter(n => P[n.id].state === 'open' && n.engine === 'logic').map(n => ({ need: n.id, p: n.project, ai: !!AGENT[n.project] })),
    /* pieces no engine can check yet: the job is to write the engine */
    engines: leaves.filter(n => P[n.id].state === 'engine').map(n => ({ need: n.id })),
    /* every design of the ledger: standing (holding a record, or behind one), broken, or yours and not yet in it */
    designs: allDesigns(W),
    /* the cases that breaks have added to the checks: each stands guard over its piece from then on */
    cases: W.entries.filter(e => e.kind === 'break').map(e => ({ id: e.id, piece: W.byId[e.of].piece, of: e.of, by: e.by, made: e.made, draft: !!e.draft })),
    /* designs whose check tried some cases, not all: nobody has broken them yet */
    breaks: F.filter(f => f.kind === 'break'),
    /* the questions people and agents asked, each a call of its own, and the loudest call of all */
    asks: F.filter(f => f.kind === 'ask').map(f => Object.assign({}, f, { words: W.byId[f.q].q, by: W.byId[f.q].by, draft: !!W.byId[f.q].draft })), loud: F[0] || null,
    state: P
  };
}
/* what there is to do about a question: the challenges that open it, and the open things of the ledger that sit there */
export function doAtStop(key, s) {
  const out = CHALLENGES.filter(c => OPENS[c.id] === key).map(c => ({ ch: c }));
  const C = community(s);
  if (FRONT_ASK.break === key) C.breaks.forEach(b => out.unshift({ ch: breakOf(b.of, s) }));
  if (FRONT_ASK.build === key) C.jobs.forEach(j => out.push({ ch: jobOf(j.need) }));
  if (FRONT_ASK.engine === key) C.engines.forEach(e => out.push({ engine: e.need }));
  return out.filter(x => x.engine || x.ch);
}
/* what people have asked under a question, yours first */
export const askedAt = (key, s) => { const W = world(s); return questionsAt(W, key.split('.')[1], key).sort((a, b) => !!b.draft - !!a.draft); };
/* everything people and agents have asked at a level, under whichever question */
export const askedAtLevel = (d, s) => questionsAt(world(s), d, null).sort((a, b) => !!b.draft - !!a.draft);
/* the society, the work done for a question, and an entry or a question in a few words */
export const societyOf = W => society(W);
export const workAt = (key, s) => workFor(world(s), key);
export const aboutWords = (about, W) => (STOPS[about] ? t('stop.' + about + '.q') : (W.byId[about] || {}).q || about);
/* what is open now, loudest first, read from the ledger and your drafts */
export const frontierOf = s => frontier(world(s));
export function entryWords(e, s) { const W = world(s), T = W.byId[e.of];
  return e.kind === 'design' ? t('ledger.rec.design', { title: e.title, piece: t('build.need.' + e.piece + '.t') }) : e.kind === 'break' ? t('ledger.rec.break', { title: T.title }) : e.kind === 'try' && e.puzzle ? t('ledger.rec.attempt', { wh: fmtNum(+(e.facts.joules / 3600).toPrecision(2)) })
    : e.kind === 'try' && e.chef ? t('ledger.rec.chef', { level: t('mb.lv.' + e.chef + '.t'), wait: fmtNum(Math.round(e.facts.wait * 100)), e: fmtNum(+e.facts.energy.toPrecision(2)) })
    : e.kind === 'try' && e.machine ? t('ledger.rec.machine', { need: t('machines.need.' + e.machine + '.t'), x: fmtNum(+e.facts.energy.toPrecision(2)), days: isFinite(e.facts.days) ? fmtNum(e.facts.days) : '?', n: isFinite(e.facts.days) ? e.facts.days : 2 })
    : e.kind === 'try' ? t('ledger.rec.try', { title: T.title, n: e.facts.cases })
    : e.kind === 'report' ? t('ledger.rec.report', { say: t('report.say.' + e.say), at: e.at, words: e.words }) : e.kind === 'fix' ? t('ledger.rec.fix', { words: e.words }) : e.q; }
/* break a design: a challenge made by the ledger itself, for every clocked design that stands, and kept for the
   broken ones, so anyone can find the case again */
export function breakOf(id, s) { const e = world(s).byId[id]; if (!e || e.kind !== 'design' || !e.ok) return null; const n = needOf(e.piece);
  return projectOf(n.project).seq ? { id: 'break:' + id, step: null, kind: 'break', of: id, p: n.project, need: e.piece, title: e.title, place: 'village', at: 'check', grows: null } : null; }
/* a challenge by its id: one of the loop's, an open job (job:<piece>) or a break (break:<entry>) */
export const anyChallenge = (id, s) => !id ? null : id.startsWith('break:') ? breakOf(id.slice(6), s) : id.startsWith('job:') ? jobOf(id.slice(4)) : challengeOf(id);
export const jobOf = need => { const n = needOf(need); return n && n.project ? { id: 'job:' + need, step: null, kind: 'design', p: n.project, need, grows: null } : null; };
export const aiProposal = p => AGENT[p] || null;
export { SETTINGS, START, PERFECT, designsFor };
