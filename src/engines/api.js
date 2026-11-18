/* The open port: the lab's engines as tools any AI agent (or person, or program) can call, so agents
   design with the community instead of the lab running an AI of its own. Pure logic, no DOM. The MCP
   server (scripts/mcp.mjs) wraps these functions; so could anything else. Words come from en.json
   through t(), so an agent reads the same job and the same verdicts a visitor does.

   Every tool returns plain data. Nothing here posts anywhere: a proposal is checked against the ledger
   (src/engines/ledger.js) and comes back as the entry's file and the link that opens it in a pull request,
   so a person stays in the loop. */
import { t, has } from '../core/i18n.js';
import { REPO, STOPS, partWord } from '../data/weave.js';
import { INSIDE, stopsAt } from '../data/places.js';
import { fieldAtLevel, fieldAtPlace } from '../data/questions.js';
import { STAGES, STAGE_PLACE, stageOfPlace, nextPlace, whereOf, alongTo } from './way.js';
import { viewOfDepth, CHALLENGES, PLACES } from '../v2/game.js';
import { NEEDS, GOAL } from '../data/build.js';
import { plan, progress, needOf, needForProject, childrenOf } from './build.js';
import { settled, frontier, draft, tryEntry, fileOf, proposeUrl, runCase, caseOk, attemptsAt } from './ledger.js';
import { budget, where as whereEnergy, LEVELS as ENERGY_LEVELS, LEVERS, PLAN, JOB } from './budget.js';
import { build, projectOf, PROJECTS, starterOf, patterns } from './design.js';
import { TESTS, START_PROGRAM } from './core.js';
import { live, MISSION_IDS, PERFECT } from './life.js';

const KINDS = ['person', 'ai', 'both', 'program'];
const jobOf = id => { const n = needOf(id); if (n && n.project) return n.project; return PROJECTS.includes(id) ? id : null; };

/* the community's plan: every piece, its state, and who built it */
export function listPlan() {
  const P = plan([]);
  return {
    goal: { id: GOAL, name: t('build.need.' + GOAL + '.t'), what: t('build.need.' + GOAL + '.d') },
    progress: progress(P),
    pieces: NEEDS.map(n => ({ id: n.id, name: t('build.need.' + n.id + '.t'), what: t('build.need.' + n.id + '.d'), parent: n.parent, children: childrenOf(n.id).map(c => c.id),
      engine: n.engine, state: P[n.id].state, job: n.project || null, designs: (P[n.id].designs || []).map(d => ({ title: d.title, author: d.author, kind: d.kind })) }))
  };
}

/* one job: what it must do, its pins, the rules of its description, and where to start */
export function getJob(id) {
  const p = jobOf(id); if (!p) return { error: t('api.noJob', { id, jobs: PROJECTS.join(', ') }) };
  const proj = projectOf(p), n = needForProject(p);
  const out = { job: p, need: n ? n.id : null, name: t('design.proj.' + p + '.t'), what: t('design.proj.' + p + '.d'), inputs: proj.ins, outputs: proj.outs, clocked: !!proj.seq, starter: starterOf(p) };
  if (p === 'core') Object.assign(out, { language: t('api.langCore'), tests: TESTS.map(T => ({ id: T.id, name: t('core.test.' + T.id + '.t'), program: T.src })), example: START_PROGRAM, needs: t('api.coreNeeds') });
  else Object.assign(out, { language: t('build.prompt', { job: out.what, ins: proj.ins.join(', '), outs: proj.outs.join(', '), clock: t(proj.seq ? 'build.promptClock' : 'build.promptNoClock') }), patterns: patterns(build({ p })).length, spec: !!proj.f });
  return out;
}

/* check a design: does it read, is it right, and what it becomes (gates, layout, test coverage, masks) */
export function checkDesign({ job, code, slice, regbit, select }) {
  const p = jobOf(job); if (!p) return { error: t('api.noJob', { id: job, jobs: PROJECTS.join(', ') }) };
  const B = build({ p, code: typeof code === 'string' ? code : undefined, slice, regs: { bit: regbit || null, select: select || null } });
  const out = { job: p, reads: !B.errs.length, errors: B.errs.map(e => ({ line: e.l, message: t('design.err.' + e.k, { l: e.l, n: e.n || '' }) })) };
  if (p === 'core') {
    const C = B.core;
    return Object.assign(out, { right: B.ok, sliceRight: C.sliceOk, registers: { yours: C.regs.yours, right: C.regs.right }, tests: C.tests.map(T => ({ name: t('core.test.' + T.id + '.t'), right: T.ok, cases: T.cases })), result: C.result, cycles: C.cycles, transistors: C.budget });
  }
  if (!out.reads) return out;
  const r = B.rows.find(x => x.mis.length);
  return Object.assign(out, {
    right: B.spec ? B.bad === 0 : null, wrong: B.bad, patterns: B.total,
    firstWrong: r ? { inputs: r.v, want: Object.fromEntries(r.mis.map(k => [k, r.e[k]])), got: Object.fromEntries(r.mis.map(k => [k, r.o[k]])) } : null,
    gates: { cells: B.M.cells.length, transistors: B.transistors, longestPathPs: Math.round(B.st.crit), fastestMHz: Math.round(B.st.fmax), depth: B.st.depth },
    layout: { wireSteps: B.RT.wl, vias: B.RT.vias, unrouted: B.RT.failed.length, areaSquareMicrometres: Math.round(B.area) },
    test: { patterns: B.vectors, faultsCaught: Math.round(B.coverage * 100) + '%' },
    masks: B.masks
  });
}

/* make a copy at the factory: one wire left stuck. What goes wrong, and would the Test station catch it? */
export function atFactory({ job, code, slice, seed }) {
  const p = jobOf(job); if (!p) return { error: t('api.noJob', { id: job, jobs: PROJECTS.join(', ') }) };
  const s = Number.isInteger(seed) ? seed : 1, B = build({ p, code: typeof code === 'string' ? code : undefined, slice, defect: s });
  if (B.errs.length) return { job: p, reads: false };
  if (p === 'core') { const C = B.core; return { job: p, stuckInSlice: C.defect ? C.defect.bit : null, testsStillRight: C.passed, tests: C.total }; }
  if (!B.defect) return { job: p, note: t('api.noFault') };
  return { job: p, stuckAt: B.defect.v, wrongAnswers: B.defect.wrong, patterns: B.total, caughtAtTest: B.defect.caught };
}

/* its life: a right design, made and shipped to a phone, a car or a data centre, with what the design and the
   factory decide (margin, grid, protect; hot, burn). Year by year, which causes fail it, and whether the place's
   needs are met. */
export function lifeOf({ job, code, slice, where, choices }) {
  const p = jobOf(job); if (!p) return { error: t('api.noJob', { id: job, jobs: PROJECTS.join(', ') }) };
  if (!MISSION_IDS.includes(where)) return { error: t('api.noPlace', { where, places: MISSION_IDS.join(', ') }) };
  const B = build({ p, code: typeof code === 'string' ? code : undefined, slice });
  const L = live(where, Object.assign({}, PERFECT, choices || {}), { coverage: B.M ? B.coverage : undefined, mhz: B.st ? B.st.fmax : undefined });
  return {
    job: p, right: !!B.ok, where, years: L.life, choices: L.s, ships: L.pass, notice: t('life.hint.' + L.hint, { cov: Math.round(L.cover * 100) }),
    failedByEnd: Object.fromEntries(Object.entries(L.at).map(([k, v]) => [k, +v.toPrecision(3)])),
    needs: L.req.map(r => ({ need: t('life.req.' + r.id, { life: L.life }), have: +r.have.toPrecision(3), accepted: r.need, met: r.ok })),
    passTest: +(L.yTiming * L.yDefect).toFixed(3), soldMHz: L.sold ? Math.round(L.sold) : null, model: t('life.model')
  };
}

/* ---- the ledger: what the community has added, as it settles, and what is open ---- */
const refusal = r => t('ledger.no.' + r.reason, { n: r.wrong || 0, of: r.of || 0 });
/* an entry, checked against the ledger as it stands: its file, and the link that opens it on GitHub as a new file
   in a pull request. Nothing is posted: a person opens the link and sends it. */
function entryOut(e, extra) {
  const r = tryEntry(e);
  if (!r.ok) return Object.assign({ ok: false, reason: refusal(r) }, extra || {});
  const f = fileOf(e);
  return Object.assign({ ok: true, entry: { id: e.id, path: f.path, file: f.text }, link: proposeUrl(e), facts: r.facts, note: t('api.person') }, extra || {});
}
const whoOk = (kind, ai) => !KINDS.includes(kind) ? t('api.kind') : (kind !== 'person') && !(ai && String(ai).trim()) ? t('api.sayAI') : null;
/* ---- look: the lab as a visitor sees it, for an agent. The same grid (src/engines/way.js): a place or a level, what
   is there (its parts, the questions that stop there, what people asked, what there is to do), and where each move
   leads: in and out for scale, along for the chip's life. With nothing, the island and its loop. ---- */
/* the questions from the field at a level or a place: their shape, the primitives that meet, who asked, where to read it */
const fieldOut = qs => qs.map(q => ({ id: q.id, shape: q.shape, meets: q.prims, question: t('field.' + q.id + '.q'), askedBy: t('field.' + q.id + '.who'), opened: t('field.' + q.id + '.opened'), stillOpen: t('field.' + q.id + '.open'), seam: q.seam || null, source: q.src }));
const levelOut = (d, extra) => Object.assign({ level: d, name: t('depth.' + d + '.name') }, extra);
export function look({ at } = {}) {
  const moves = t('api.look.moves');
  if (!at) return { where: 'island', what: t('loop.lead'), moves,
    loop: STAGES.map(s => ({ stage: s, place: STAGE_PLACE[s], name: t('map.' + STAGE_PLACE[s] + '.t'), what: t('loop.at.' + s) })),
    places: PLACES.filter(p => stageOfPlace(p)).map(p => ({ place: p, name: t('map.' + p + '.t'), stage: stageOfPlace(p), levels: (INSIDE[p] || []).map(l => l.depth) })) };
  if (PLACES.includes(at) && stageOfPlace(at)) return { where: at, name: t('map.' + at + '.t'), what: t('map.' + at + '.d'), stage: stageOfPlace(at), moves,
    levels: (INSIDE[at] || []).map(l => levelOut(l.depth, { questions: stopsAt(l.depth).length, challenges: CHALLENGES.filter(c => c.at === l.depth).length })),
    field: fieldOut(fieldAtPlace(at)),
    out: 'island', in: ((INSIDE[at] || [])[0] || {}).depth || null, along: nextPlace(at), ...(stageOfPlace(at) === 'open' ? { record: ['list_plan', 'list_ledger'] } : {}) };
  const W = has('depth.' + at + '.name') ? whereOf(viewOfDepth(at)) : null, L = W && INSIDE[W.place], i = L ? L.findIndex(l => l.depth === at) : -1;
  if (i < 0) return { ok: false, reason: t('api.look.none') };
  /* the steps of a line (the factory, the studio) follow each other; the levels of a dive are one inside the next */
  const steps = ['journey', 'design'].includes(L[i].world) && (!L[i + 1] || L[i + 1].world === L[i].world), prev = i ? L[i - 1].depth : W.place, next = L[i + 1] ? L[i + 1].depth : null;
  const parts = [...new Set(stopsAt(at).flatMap(k => STOPS[k]))].map(k => partWord(at, k)).filter(w => has('part.' + w)).map(w => ({ name: t('part.' + w), what: t('what.' + w) }));
  const along = {}; STAGES.filter(s => s !== W.stage).forEach(s => { const w = whereOf(alongTo(W, s)); along[s] = w.view === 'island' ? w.place : w.level; });
  return Object.assign(levelOut(at, { where: at, place: W.place, stage: W.stage, what: t('depth.' + at + '.see'), moves }), steps ? { back: prev, on: next } : { out: prev, in: next }, { along, parts,
    field: fieldOut(fieldAtLevel(at)),
    questions: stopsAt(at).map(k => ({ id: k, question: t('stop.' + k + '.q'), noticed: t('stop.' + k + '.note') })),
    asked: settled().entries.filter(e => e.kind === 'question' && e.at === at).map(e => ({ id: e.id, by: e.by, under: e.under || null, question: e.q })),
    challenges: CHALLENGES.filter(c => c.at === at).map(c => ({ id: c.id, goal: t('game.ch.' + c.id + '.goal') })), note: t('api.untrusted') });
}
export function listLedger() {
  const W = settled(), F = frontier(W);
  return {
    note: t('api.untrusted'),
    entries: W.entries.map(e => Object.assign({ id: e.id, kind: e.kind, by: e.by, made: e.made, state: e.state }, e.kind === 'design' ? { piece: e.piece, title: e.title, inside: W.inside[e.piece] === e.id, transistors: e.facts.transistors, longestPathPs: e.facts.ps, brokenBy: e.brokenBy, code: e.code }
      : e.kind === 'break' ? { of: e.of, case: e.case, wrongAtTick: e.facts.tick } : e.kind === 'try' && e.puzzle ? { puzzle: e.puzzle, plan: e.plan, ...attemptFacts(e), best: W.best[e.puzzle] === e.id }
      : e.kind === 'try' && e.machine ? { machine: e.machine, plan: e.plan, ...e.facts, best: (W.bestMachine || {})[e.machine] === e.id }
      : e.kind === 'try' ? { of: e.of, casesItHeldOn: e.facts.cases }
      : e.kind === 'report' ? { at: e.at, part: e.part || null, says: e.say, words: e.words, fixedBy: e.fixedBy || null } : e.kind === 'fix' ? { of: e.of, words: e.words, pullRequest: e.pr || null }
      : { at: e.at, under: e.under || null, question: e.q, noticed: e.noticed || '' })),
    open: F.map(f => f.kind === 'puzzle' ? { do: 'attempt a puzzle', puzzle: f.puzzle, attempts: f.attempts, best: f.best, pull: +f.pull.toFixed(2), what: t('api.open.puzzle'), tools: ['energy_budget', 'submit_attempt'] } : f.kind === 'report' ? { do: 'fix', report: f.of, at: f.at, says: f.say, words: W.byId[f.of].words, pull: +f.pull.toFixed(2), what: t('api.open.report') } : f.kind === 'build' ? { do: 'build', piece: f.piece, job: f.p, what: t('build.need.' + f.piece + '.d') }
      : f.kind === 'break' ? { do: 'break', design: f.of, piece: f.piece, job: f.p, insideTheComputer: f.inside, triesSurvived: f.tries, pull: +f.pull.toFixed(2), what: t('api.open.break') } : f.kind === 'ask' ? { do: 'work on a question', question: f.q, words: W.byId[f.q].q, workSoFar: f.work, pull: +f.pull.toFixed(2), what: t('api.open.ask') } : { do: 'engine', piece: f.piece, what: t('build.need.' + f.piece + '.d') }),
    whoChecksWhom: W.cross, whoMakesWhat: W.mix
  };
}
/* propose a design for a piece of the plan: checked by the ledger first (it must read, do the job, pass every case a
   break has added, and not be there already) */
export function proposeDesign({ need, code, title, author, kind, ai, words, from, about }) {
  const n = needOf(need); if (!n || !n.project || n.engine !== 'logic') return { ok: false, reason: t('api.noNeed', { need }) };
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const c = checkDesign({ job: n.project, code });
  if (!c.right) return { ok: false, reason: t('api.notRight'), check: c };
  const name = title || t('design.proj.' + n.project + '.t');
  return entryOut(draft({ kind: 'design', piece: need, title: name, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', code, from: from || null, about: about || null }, (author || '') + ' ' + name), { check: c });
}
/* propose a break: a case, tick by tick, that makes a design of the ledger answer wrong */
export function proposeBreak({ design, case: seq, author, kind, ai, words }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const T = settled().byId[design];
  const e = draft({ kind: 'break', of: design, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', case: seq }, (author || '') + ' ' + (T && T.title || 'break'));
  const out = entryOut(e);
  if (T && T.kind === 'design' && T.ok && caseOk(needOf(T.piece).project, seq)) { const r = runCase(needOf(T.piece).project, T.code, seq); if (r) out.ticks = r.rows.map((x, i) => ({ tick: i + 1, inputs: x.v, should: x.e, does: x.o, wrong: x.mis.length > 0 })); }
  return out;
}
/* propose a try: cases meant to break a design that did not. It records what the design has survived. */
export function proposeTry({ design, cases, author, kind, ai, words, about }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const T = settled().byId[design];
  return entryOut(draft({ kind: 'try', of: design, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', cases, about: about || null }, (author || '') + ' ' + (T && T.title || 'try')));
}
/* propose a question: it needs a home (a level, perhaps the question it sits under) and what was noticed */
/* report something wrong with the lab itself, at a place given by its address: checked by the ledger first */
export function proposeReport({ at, part, say, words, author, kind, ai }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  return entryOut(draft({ kind: 'report', at, part: part || null, say, words, by: author || t('api.anon'), made: kind, ai: ai || '' }, (author || '') + ' ' + String(at || '').replace(/[#/]+/g, ' ')));
}
export function proposeQuestion({ at, under, part, question, noticed, author, kind, ai, about }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  return entryOut(draft({ kind: 'question', at, part: part || null, under: under || null, q: question, noticed: noticed || '', by: author || t('api.anon'), made: kind, ai: ai || '', about: about || null }, (author || '') + ' ' + String(question || '').split(/\s+/).slice(0, 5).join(' ')));
}

/* ---- the energy puzzle (content/puzzles/energy.md): where does the energy of one answer go? ---- */
const sig = x => +x.toPrecision(4);
const attemptFacts = e => ({ joules: sig(e.facts.joules), wattHours: sig(e.facts.joules / 3600), secondsPerAnswer: sig(e.facts.seconds), accuracyDb: sig(e.facts.snrDb), timesTheFloor: sig(e.facts.times) });
/* the budget of one answer for a plan: joules at every level of the data centre's dive, split into computing, moving
   data and heat, with the floor, the time and the accuracy; the levers (each a parameter of the plan, at its level, with
   the lab already there), and the attempts so far, the best first */
export function energyBudget({ plan } = {}) {
  const P = plan && typeof plan === 'object' ? plan : {}, b = budget(JOB, P);
  const levers = LEVERS.map(l => ({ id: l.id, level: l.level, lab: l.lab, labName: t('game.ch.' + l.lab + '.t'), values: l.values, now: P[l.id] === undefined ? PLAN[l.id] : P[l.id], what: t('joule.lever.' + l.id + '.d') }));
  const W = settled(), tried = attemptsAt(W, 'energy').map(e => ({ id: e.id, by: e.by, made: e.made, ai: e.ai || '', state: e.state, plan: e.plan, ...attemptFacts(e) }));
  const base = { puzzle: 'energy', question: t('joule.q'), job: { ...JOB, what: t('joule.job') }, levers, attempts: tried, note: t('api.untrusted') };
  if (!b.ok) return { ...base, ok: false, reason: t('joule.no.' + b.why) };
  const W2 = whereEnergy(b);
  return { ...base, ok: true, plan: { ...PLAN, ...P, volt: b.volt },
    levels: ENERGY_LEVELS.map(l => ({ level: l, name: t('depth.' + l + '.name'), joules: sig(b.levels[l].total), share: sig(b.shares[l]), computing: sig(b.levels[l].compute), moving: sig(b.levels[l].move), heat: sig(b.levels[l].heat) })),
    total: { joules: sig(b.total), wattHours: sig(b.total / 3600), floorJoules: sig(b.floor), timesTheFloor: sig(b.times), computing: sig(b.parts.compute), moving: sig(b.parts.move), heat: sig(b.parts.heat) },
    mostAt: W2.level, mostIs: { compute: 'computing', move: 'moving', heat: 'heat' }[W2.part], secondsPerAnswer: sig(b.seconds), answersPerSecond: sig(b.perSecond), accuracyDb: sig(b.snrDb), model: t('joule.model') };
}
/* submit an attempt at the energy puzzle: a plan, scored by the budget engine and checked by the ledger (new among the
   attempts, a plan the engine can run). Comes back as the entry's file and the link, like every proposal */
export function submitAttempt({ plan, words, author, kind, ai, about }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const P = plan && typeof plan === 'object' && !Array.isArray(plan) ? plan : null;
  if (!P) return { ok: false, reason: t('ledger.no.plan') };
  const b = budget(JOB, P);
  return entryOut(draft({ kind: 'try', puzzle: 'energy', plan: P, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', about: about || null }, (author || '') + ' energy'), b.ok ? { joules: sig(b.total), wattHours: sig(b.total / 3600), secondsPerAnswer: sig(b.seconds), accuracyDb: sig(b.snrDb) } : {});
}
