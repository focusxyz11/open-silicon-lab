/* The open port: the lab's engines as tools any AI agent (or person, or program) can call, so agents
   design with the community instead of the lab running an AI of its own. Pure logic, no DOM. The MCP
   server (scripts/mcp.mjs) wraps these functions; so could anything else. Words come from en.json
   through t(), so an agent reads the same job and the same verdicts a visitor does.

   Every tool returns plain data. Nothing here posts anywhere: proposeDesign checks a design and returns
   the GitHub form to submit it, so a person stays in the loop. */
import { t } from '../core/i18n.js';
import { REPO } from '../data/weave.js';
import { NEEDS, GOAL, DESIGNS } from '../data/build.js';
import { plan, progress, needOf, needForProject, childrenOf } from './build.js';
import { build, projectOf, PROJECTS, starterOf, patterns } from './design.js';
import { TESTS, START_PROGRAM } from './core.js';
import { live, MISSION_IDS, PERFECT } from './life.js';

const KINDS = ['person', 'ai', 'both'];
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

/* propose a design for a piece of the plan: checked first; returns the GitHub form, filled in, for a person to submit */
export function proposeDesign({ need, code, slice, title, author, kind, ai }) {
  const n = needOf(need); if (!n || !n.project) return { ok: false, reason: t('api.noNeed', { need }) };
  if (!KINDS.includes(kind)) return { ok: false, reason: t('api.kind') };
  if ((kind === 'ai' || kind === 'both') && !(ai && String(ai).trim())) return { ok: false, reason: t('api.sayAI') };
  const c = checkDesign({ job: n.project, code, slice });
  if (!c.right) return { ok: false, reason: t('api.notRight'), check: c };
  if (DESIGNS.some(d => d.need === need && d.code.trim() === String(code).trim())) return { ok: false, reason: t('api.same') };
  const url = REPO + '/issues/new?' + new URLSearchParams({ template: 'design.yml', title: t('design.addYours') + ': ' + (title || t('design.proj.' + n.project + '.t')), need, author: author || '', code: n.project === 'core' ? slice || '' : code, ai: ai || t('build.aiUse.you') });
  return { ok: true, form: url, note: t('api.person'), check: c };
}
