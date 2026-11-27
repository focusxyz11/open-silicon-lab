/* The open port: the lab's engines as tools any AI agent (or person, or program) can call, so agents
   design with the community instead of the lab running an AI of its own. Pure logic, no DOM. The MCP
   server (scripts/mcp.mjs) wraps these functions; so could anything else. Words come from src/i18n/en/
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
import { settled, frontier, draft, tryEntry, fileOf, proposeUrl, runCase, caseOk, attemptsAt, choicesAt, frontAttemptsAt, archAttempts, ARCH_AGENTS } from './ledger.js';
import * as Arch from './arch.js';
import * as Pop from './population.js';
import { geoEffFront } from './lens.js';
import * as Thousand from './thousand.js';
import { budget, where as whereEnergy, LEVELS as ENERGY_LEVELS, LEVERS, PLAN, JOB } from './budget.js';
import { build, projectOf, PROJECTS, starterOf, patterns } from './design.js';
import { TESTS, START_PROGRAM } from './core.js';
import { live, MISSION_IDS, PERFECT } from './life.js';

const KINDS = ['person', 'ai', 'both', 'program'];
/* an agent's argument as words for an entry's file name: a string, or nothing (an object or a list is never turned
   into a string here: its form is the ledger's to refuse, with a reason) */
const txt = s => (typeof s === 'string' ? s : '');
const jobOf = id => { if (typeof id !== 'string') return null; const n = needOf(id); if (n && n.project) return n.project; return PROJECTS.includes(id) ? id : null; };
/* a design of the ledger by its id (the world's tables have no prototype, so only an entry's own id finds one) */
const entryOf = id => (typeof id === 'string' ? settled().byId[id] || null : null);

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
  const p = jobOf(id); if (!p) return { error: t('api.noJob', { id: txt(id), jobs: PROJECTS.join(', ') }) };
  const proj = projectOf(p), n = needForProject(p);
  const out = { job: p, need: n ? n.id : null, name: t('design.proj.' + p + '.t'), what: t('design.proj.' + p + '.d'), inputs: proj.ins, outputs: proj.outs, clocked: !!proj.seq, starter: starterOf(p) };
  if (p === 'core') Object.assign(out, { language: t('api.langCore'), tests: TESTS.map(T => ({ id: T.id, name: t('core.test.' + T.id + '.t'), program: T.src })), example: START_PROGRAM, needs: t('api.coreNeeds') });
  else Object.assign(out, { language: t('build.prompt', { job: out.what, ins: proj.ins.join(', '), outs: proj.outs.join(', '), clock: t(proj.seq ? 'build.promptClock' : 'build.promptNoClock') }), patterns: patterns(build({ p })).length, spec: !!proj.f });
  return out;
}

/* check a design: does it read, is it right, and what it becomes (gates, layout, test coverage, masks) */
export function checkDesign({ job, code, slice, regbit, select }) {
  const p = jobOf(job); if (!p) return { error: t('api.noJob', { id: txt(job), jobs: PROJECTS.join(', ') }) };
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
  const p = jobOf(job); if (!p) return { error: t('api.noJob', { id: txt(job), jobs: PROJECTS.join(', ') }) };
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
  const p = jobOf(job); if (!p) return { error: t('api.noJob', { id: txt(job), jobs: PROJECTS.join(', ') }) };
  if (!MISSION_IDS.includes(where)) return { error: t('api.noPlace', { where: txt(where), places: MISSION_IDS.join(', ') }) };
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
const whoOk = (kind, ai) => !KINDS.includes(kind) ? t('api.kind') : (ai != null && typeof ai !== 'string') || ((kind !== 'person') && !txt(ai).trim()) ? t('api.sayAI') : null;
/* ---- look: the lab as a visitor sees it, for an agent. The same grid (src/engines/way.js): a place or a level, what
   is there (its parts, the questions that stop there, what people asked, what there is to do), and where each move
   leads: in and out for scale, along for the chip's life. With nothing, the island and its loop. ---- */
/* the questions from the field at a level or a place: their shape, the primitives that meet, who asked, where to read it */
const fieldOut = qs => qs.map(q => ({ id: q.id, shape: q.shape, meets: q.prims, question: t('field.' + q.id + '.q'), askedBy: t('field.' + q.id + '.who'), opened: t('field.' + q.id + '.opened'), stillOpen: t('field.' + q.id + '.open'), seam: q.seam || null, source: q.src }));
const levelOut = (d, extra) => Object.assign({ level: d, name: t('depth.' + d + '.name') }, extra);
export function look({ at } = {}) {
  const moves = t('api.look.moves');
  if (at != null && typeof at !== 'string') return { ok: false, reason: t('api.look.none') };
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
  const along = {}; STAGES.filter(s => s !== W.stage).forEach(s => { const w = whereOf(alongTo(W, s)); along[s] = w.view === 'island' ? w.place : w.step || w.level; });   /* a level as made is named by the step that makes it */
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
      : e.kind === 'try' && e.chef ? { chef: e.chef, plan: e.plan, waiting: sig(e.facts.wait), joulesPerAnswer: sig(e.facts.energy), cleared: e.facts.cleared, best: (W.bestChef || {})[e.chef] === e.id }
      : e.kind === 'try' && e.front ? { front: e.front, plan: e.plan, words: e.words || '' }
      : e.kind === 'try' && e.choice ? { choice: e.choice, pick: e.pick, reason: e.words }
      : e.kind === 'try' && e.arch ? { arch: e.arch, recipe: e.facts.g, wins: e.facts.wins, years: e.facts.years, firstToWin: e.firstIn, marksItsSquare: e.marks }
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
  const n = needOf(need); if (!n || !n.project || n.engine !== 'logic') return { ok: false, reason: t('api.noNeed', { need: txt(need) }) };
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const c = checkDesign({ job: n.project, code });
  if (!c.right) return { ok: false, reason: t('api.notRight'), check: c };
  const name = title || t('design.proj.' + n.project + '.t');
  return entryOut(draft({ kind: 'design', piece: need, title: name, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', code, from: from || null, about: about || null }, txt(author) + ' ' + txt(name)), { check: c });
}
/* propose a break: a case, tick by tick, that makes a design of the ledger answer wrong */
export function proposeBreak({ design, case: seq, author, kind, ai, words }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const T = entryOf(design);
  const e = draft({ kind: 'break', of: design, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', case: seq }, txt(author) + ' ' + (T && T.title || 'break'));
  const out = entryOut(e);
  if (T && T.kind === 'design' && T.ok && caseOk(needOf(T.piece).project, seq)) { const r = runCase(needOf(T.piece).project, T.code, seq); if (r) out.ticks = r.rows.map((x, i) => ({ tick: i + 1, inputs: x.v, should: x.e, does: x.o, wrong: x.mis.length > 0 })); }
  return out;
}
/* propose a try: cases meant to break a design that did not. It records what the design has survived. */
export function proposeTry({ design, cases, author, kind, ai, words, about }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const T = entryOf(design);
  return entryOut(draft({ kind: 'try', of: design, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', cases, about: about || null }, txt(author) + ' ' + (T && T.title || 'try')));
}
/* propose a question: it needs a home (a level, perhaps the question it sits under) and what was noticed */
/* report something wrong with the lab itself, at a place given by its address: checked by the ledger first */
export function proposeReport({ at, part, say, words, author, kind, ai }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  return entryOut(draft({ kind: 'report', at, part: part || null, say, words, by: author || t('api.anon'), made: kind, ai: ai || '' }, txt(author) + ' ' + txt(at).replace(/[#/]+/g, ' ')));
}
export function proposeQuestion({ at, under, part, question, noticed, author, kind, ai, about }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  return entryOut(draft({ kind: 'question', at, part: part || null, under: under || null, q: question, noticed: noticed || '', by: author || t('api.anon'), made: kind, ai: ai || '', about: about || null }, txt(author) + ' ' + txt(question).split(/\s+/).slice(0, 5).join(' ')));
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
  return entryOut(draft({ kind: 'try', puzzle: 'energy', plan: P, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', about: about || null }, txt(author) + ' energy'), b.ok ? { joules: sig(b.total), wattHours: sig(b.total / 3600), secondsPerAnswer: sig(b.seconds), accuracyDb: sig(b.snrDb) } : {});
}

/* ---- the block's front (#315, #326): where Geometry and Efficiency fuels use meet. Two controls (where the logic sits,
   p; how much of the memory moves into the rows of logic, n; each 0 to 1 in tenths), and one model (geoEffFront in
   src/engines/lens.js) that places a plan on the chart: the energy the block spends on one answer, and its hottest patch
   against today's. Today's front, the front with all the memory moved in, the attempts kept in the ledger (each placed by
   the model, on the ledger's front while nothing kept beats it on both), and the plan asked for ---- */
const FRONT = 'eff.geo';
const frontScore = E => p => { const r = E.at(p.p, p.n); return { x: r.energy, y: r.heat }; };
const pointOut = r => ({ p: r.p, n: r.n, blockJoulesPerAnswer: sig(r.energy), hottestPatch: sig(r.heat), averageTripUm: sig(r.trip) });
export function blockFront({ plan } = {}) {
  const E = geoEffFront(), P = plan && typeof plan === 'object' ? plan : { p: 0, n: 0 }, ok = [P.p, P.n].every(v => typeof v === 'number' && v >= 0 && v <= 1);
  const line = n => E.line(n).filter((x, i) => i % 2 === 0).map(x => pointOut(E.at(x.p, n)));
  return { front: FRONT, question: t('frame.meet.eff.geo.q'), model: t('frame.meet.eff.geo.true'), whole: t('lp.front.whole', { v: Math.round(E.whole), share: +(100 * E.today.energy / E.whole).toPrecision(1) }),
    controls: { p: t('lp.geo.ctl'), n: t('lp.front.n'), values: t('api.front.values') }, today: line(0), allMovedIn: line(1),
    attempts: frontAttemptsAt(settled(), FRONT, frontScore(E)).map(a => ({ id: a.id, by: a.by, made: a.made, words: a.words, state: a.state, ...pointOut(E.at(a.plan.p, a.plan.n)) })),
    ...(ok ? { yours: pointOut(E.at(P.p, P.n)) } : { ok: false, reason: t('ledger.no.plan') }), note: t('api.untrusted') };
}
/* submit an attempt at the block's front: a plan, placed by the model and checked by the ledger (two values in tenths,
   new among the attempts there). Comes back as the entry's file and the link, like every proposal */
export function submitFront({ plan, words, author, kind, ai, about }) {
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const P = plan && typeof plan === 'object' && !Array.isArray(plan) ? plan : null; if (!P) return { ok: false, reason: t('ledger.no.plan') };
  const E = geoEffFront(), placed = [P.p, P.n].every(v => typeof v === 'number' && v >= 0 && v <= 1) ? pointOut(E.at(P.p, P.n)) : null;
  return entryOut(draft({ kind: 'try', front: FRONT, plan: P, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', about: about || null }, txt(author) + ' front'), placed ? { placed } : {});
}

/* ---- A thousand that pass (src/engines/thousand.js): a program's thousand designs for a need, all passing every check;
   the people around the need that no check measures; and a choice with its reason, prepared as a try entry for a person
   to send. People's choices and agents' come back apart, never mixed, read from the entries alone ---- */
const r3 = x => +x.toPrecision(3);
export function chooseDesign({ need, pick, reason, author, kind, ai, about } = {}) {
  const id = need || 'phone', N = Thousand.needOf(id);
  if (!N) return { ok: false, reason: t('ledger.no.choice'), needs: Object.keys(Thousand.NEEDS) };
  const D = Thousand.thousand(id), L = Thousand.limits(id), C = choicesAt(settled(), id);
  const group = list => list.map(e => ({ id: e.id, by: e.by, pick: e.pick, reason: e.words }));
  const out = {
    need: id, what: t('th.intro', { n: D.length }), limits: L,
    people: Thousand.PEOPLE.map(p => ({ id: p, name: t('th.person.' + p + '.s'), what: t('th.person.' + p + '.d') })),
    choicesNoCheckScores: Thousand.TRAITS.map(T => ({ id: T.id, name: t('th.trait.' + T.id + '.t'), values: T.values.map(v => ({ id: v, what: t('th.trait.' + T.id + '.' + v), leans: Thousand.LEAN[T.id][v] })) })),
    columns: ['id', 'powerW', 'costUsd', 'tokensPerSecond', 'areaMm2', ...Thousand.TRAITS.map(T => T.id), ...Thousand.PEOPLE.map(p => 'lean.' + p)],
    designs: D.map(d => [d.id, r3(d.m.power), r3(d.m.cost), Math.round(d.m.tps), Math.round(d.m.area), ...Thousand.TRAITS.map(T => d.traits[T.id]), ...Thousand.PEOPLE.map(p => d.lean[p])]),
    chosen: { people: group(C.people), agents: group(C.agents) },
    how: t('api.choose.how'), note: t('api.untrusted')
  };
  if (pick == null && reason == null) return out;
  const bad = whoOk(kind, ai); if (bad) return Object.assign(out, { ok: false, reason: bad });
  if (kind !== 'person' && kind !== 'ai') return Object.assign(out, { ok: false, reason: t('ledger.no.chooser') });
  const e = draft({ kind: 'try', choice: id, pick, words: typeof reason === 'string' ? reason.trim() : reason, by: author || t('api.anon'), made: kind, ai: ai || '', about: about || null }, txt(author) + ' choice ' + id);
  const res = entryOut(e);
  delete out.designs; delete out.columns;
  return Object.assign(out, res, res.ok ? { picked: Thousand.designOf(id, pick) } : {});
}

/* ---- Grow an architecture nobody has built (src/engines/arch.js, #407, #410): score a recipe and a history, the agents'
   forks for the state it reaches, and an attempt prepared as a try entry. A history is plain data (Arch.histOf): the
   recipe it starts from (a key, where/carrier/told/shape, or the four as an object), the stepping stones it starts with,
   the focus of each year, and the forks and stones between years in order. The ledger grows it again the same way ---- */
const archRecipeKey = x => (typeof x === 'string' ? x : x && typeof x === 'object' && !Array.isArray(x) ? Arch.GENES.map(k => x[k]).join('/') : '');
function archRead(a) {
  const h = { start: archRecipeKey(a.start == null ? Arch.TODAY : a.start), stones: a.stones == null ? {} : a.stones, years: a.years == null ? [] : a.years, changes: a.changes == null ? [] : a.changes };
  const empty = Array.isArray(h.years) && !h.years.length;
  if (!Arch.histOk(Object.assign({}, h, { years: empty ? [[]] : h.years }), false) || (empty && !(Array.isArray(h.changes) && !h.changes.length))) return null;
  return { h, st: empty ? Arch.start(Arch.recipeOf(h.start), h.stones) : Arch.replay(h).st };
}
const archNo = () => ({ ok: false, reason: t('ledger.no.arch'), how: t('api.arch.how') });
const recipeOut = g => ({ key: Arch.keyOf(g), ...g, words: t('ar.recipe', { where: t('ar.opt.where.' + g.where), carrier: t('ar.opt.carrier.' + g.carrier), told: t('ar.opt.told.' + g.told), shape: t('ar.opt.shape.' + g.shape) }) });
const archBy = e => ({ id: e.id, by: e.by, made: e.made, group: ARCH_AGENTS.includes(e.made) ? 'agents' : 'people', recipe: e.facts.g, wins: e.facts.wins, years: e.facts.years, state: e.state });
export function growArchitecture(a = {}) {
  const R = archRead(a || {}); if (!R) return archNo();
  const { h, st } = R, sc = Arch.scoreOf(st), M = Arch.maturityOf(st), kn = Arch.knownOf(st.g), L = archAttempts(settled()), key = Arch.keyOf(st.g);
  return {
    recipe: recipeOut(st.g), built: kn ? { name: t('ar.known.' + kn.id), status: t('ar.st.' + kn.status) } : null, genesFromToday: Arch.novelty(st.g), year: st.year, people: Math.round(st.people), attemptsAYear: Math.round(st.people * Arch.ATTEMPTS),
    needs: Arch.NEEDS.map(n => ({ need: n, name: t('ar.need.' + n), now: sig(sc[n].now), could: sig(sc[n].could), can: sc[n].can, wins: sc[n].wins, lacks: Arch.missesOf(st.g, n) })),
    wins: Arch.winsOf(st), polish: Object.fromEntries(Arch.DIRS.map(d => [d, sig(M[d])])), suggest: Arch.novelty(st.g) ? Arch.suggest(st, 'archniche') : null,
    goals: Object.fromEntries(Object.keys(Arch.GOALS).map(id => [id, Arch.goalOf(st, id)])),
    history: Arch.histClaim(h, Arch.winsOf(st)),
    ledger: { here: L.all.filter(e => e.facts.g === key).map(archBy), firstToWin: Object.fromEntries(Arch.NEEDS.map(n => [n, L.first[n] ? archBy(settled().byId[L.first[n]]) : null])), people: L.people.length, agents: L.agents.length },
    how: t('api.arch.how'), note: t('api.untrusted')
  };
}
/* the field of every attempt (#448, src/engines/population.js): every niche (a need, at a distance from today's computer) with
   its champion and how many recipes there could serve it and nobody has tried; every attempt the ledger keeps with its
   credit. Read from the entries alone, so an agent can choose where to sweep; its attempts come back as entries */
export function architectureField() {
  const W = settled(), atts = Pop.population((W.arch || []).map(id => W.byId[id])), cen = Pop.census(atts), tried = new Set(atts.map(a => a.key));
  const who = a => (a.built ? { built: a.id, name: t('ar.known.' + a.id), status: t('ar.st.' + a.by) } : { id: a.id, by: a.who, made: a.made, group: a.agent ? 'agents' : 'people' });
  const open = Arch.NEEDS.map(n => [0, 0, 0, 0, 0]);
  Arch.allRecipes().forEach(g => { if (tried.has(Arch.keyOf(g))) return; Arch.NEEDS.forEach((n, ni) => { if (Arch.potentialOf(g, n) > 0) open[ni][Arch.novelty(g)]++; }); });
  return {
    needs: Arch.NEEDS.map(n => ({ need: n, name: t('ar.need.' + n) })),
    niches: Arch.NEEDS.flatMap((n, ni) => [1, 2, 3, 4].map(d => { const c = cen.champ[ni][d]; return { need: n, genesFromToday: d, champion: c ? Object.assign({ recipe: c.key, now: sig(c.now) }, who(c.a)) : null, untried: open[ni][d] }; })),
    attempts: atts.filter(a => a.by === 'ledger').map(a => Object.assign(who(a), { recipe: a.key, genesFromToday: Arch.novelty(a.g), years: a.years, wins: Arch.winsOf(a.st), firstToTry: a.first, firstToWin: a.firstIn })),
    tried: cen.tried, aheadOfToday: cen.wins, how: t('api.field.how'), note: t('api.untrusted')
  };
}
/* the agents' forks for the state a history reaches (after its first year, as in the lab): each one gene changed,
   worked out by the engine, with the history that takes it. They propose; whoever runs them decides */
export function archForks(a = {}) {
  const R = archRead(a || {}); if (!R) return archNo();
  const { h, st } = R;
  if (!st.year) return { year: 0, forks: [], note: t('ar.ag.first') };
  return { year: st.year, recipe: recipeOut(st.g), how: t('ar.ag.how'),
    forks: Arch.agentForks(st).map(c => ({ gene: c.gene, option: c.option, name: t('ar.gene.' + c.gene) + ': ' + t('ar.opt.' + c.gene + '.' + c.option), couldWin: c.could, bestNow: sig(c.now), loses: c.lost, opens: c.gain,
      then: { start: h.start, stones: h.stones, years: h.years, changes: h.changes.concat({ at: st.year, gene: c.gene, option: c.option }) } })) };
}
/* submit an attempt: a history and the needs it claims (left out: the needs its recipe wins at the end), grown again by
   the ledger, which refuses a claimed win it does not reach. Comes back as the entry's file and the link */
export function submitArchitecture(a = {}) {
  const { words, author, kind, ai, about } = a || {};
  const bad = whoOk(kind, ai); if (bad) return { ok: false, reason: bad };
  const R = archRead(a || {}); if (!R || !R.h.years.length) return archNo();
  /* a claim that is not a list goes to the ledger as it is, to be refused there with a reason */
  const arch = Object.assign(Arch.histClaim(R.h, []), { wins: a.wins == null ? Arch.winsOf(R.st) : a.wins });
  return entryOut(draft({ kind: 'try', arch, by: author || t('api.anon'), made: kind, ai: ai || '', words: words || '', about: about || null }, txt(author) + ' arch ' + R.h.start.split('/').join(' ')), { recipe: recipeOut(R.st.g), reached: Arch.winsOf(R.st) });
}
