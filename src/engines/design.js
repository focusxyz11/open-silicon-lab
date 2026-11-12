/* Your design: one small circuit, followed from the job it must do to the masks the fab prints. Pure
   logic, no DOM; tests in tests/design.test.mjs.

   Every step uses the earlier site's tiny-chip engine (src/engines/tinychip.js) on the same text:
   the description is parsed, checked against the job (every input pattern, or every clock cycle of a
   test for a clocked design), turned into gates from a small cell library (synthesis), the gates placed
   in rows by simulated annealing and joined by a maze router on two metal layers, and the test patterns
   graded by how many possible faults they would catch (stuck-at faults). The process is a 130 nm line,
   the kind open shuttles such as Tiny Tapeout use.

   What is simplified: the cell library is tiny, wires have no delay, and the masks are drawn from the
   layout's cells and wires in general terms, not as real mask shapes. */
import TC from './tinychip.js';
import { buildCore, START_PROGRAM } from './core.js';

/* the core is a job too: its description is the program you run on it, and its ALU is your slice */
const CORE = { id: 'core', ins: ['program'], outs: ['a0'], demo: 'core', starter: START_PROGRAM, sol: START_PROGRAM, f: true };
export const PROJECTS = TC.PROJ.map(p => p.id).concat('core');
export const NODE = '130';
export const START_DESIGN = { p: 'half' };
const cache = new Map();

/* the project behind a design, and the code it starts from */
export const projectOf = id => id === 'core' ? CORE : TC.PROJ.find(p => p.id === id) || TC.PROJ[0];
export const starterOf = id => projectOf(id).starter;
export const solutionOf = id => projectOf(id).sol;
export const normalDesign = d => { const p = projectOf(d && d.p).id; return { p, code: d && typeof d.code === 'string' && d.p === p ? d.code.slice(0, 4000) : starterOf(p) }; };

/* the whole flow for one design. Returns what each station shows. */
export function build(d) {
  const { p, code } = normalDesign(d), defect = d && Number.isInteger(d.defect) ? d.defect : null, slice = p === 'core' ? (d && typeof d.slice === 'string' ? d.slice : starterOf('alu')) : '';
  const regs = p === 'core' && d && d.regs ? { bit: typeof d.regs.bit === 'string' ? d.regs.bit : null, select: typeof d.regs.select === 'string' ? d.regs.select : null } : null;
  const key = p + '\n' + code + '\n' + slice + '\n' + defect + '\n' + JSON.stringify(regs);
  if (cache.has(key)) return cache.get(key);
  if (p === 'core') return remember(key, coreDesign(code, slice, defect, regs));
  const proj = projectOf(p), seq = !!proj.seq;
  const D = TC.parse(code, proj.ins, proj.outs, { regs: seq });
  const out = { p, code, proj, ins: proj.ins, outs: proj.outs, seq, spec: proj.f != null, errs: D.errs || [] };
  if (!out.errs.length) {
    const V = TC.verify(D, proj);
    out.rows = V.rows; out.bad = proj.f ? V.bad : 0; out.total = V.rows.length;
    const SY = TC.synth(D, proj.ins, proj.outs, 'basic', false, NODE);
    out.M = SY.M; out.st = SY.st;
    const PL = TC.place(SY.M, 0.5, 7); PL.anneal(Math.min(3000, 300 + SY.M.cells.length * 80), null);
    out.PL = PL; out.RT = TC.route(PL);
    const vecs = TC.testVectors(proj), F = TC.faults(SY.M, vecs);
    out.vectors = vecs.length; out.faults = F.F.length; out.caught = Math.round(F.cov * F.F.length); out.coverage = F.cov;
    out.transistors = SY.M.cells.reduce((a, c) => a + TC.LIB[c.type][0], 0);
    out.masks = TC.NODE[NODE].masks;
    out.levels = levels(SY.M);
    out.area = SY.M.cells.reduce((a, c) => a + TC.LIB[c.type][1], 0) * TC.NODE[NODE].site[0] * TC.NODE[NODE].site[1];
    if (defect != null) out.defect = spoil(out, vecs, defect);
  }
  out.ok = !out.errs.length && out.bad === 0;
  return remember(key, out);
}
function remember(key, out) { if (cache.size > 40) cache.clear(); cache.set(key, out); return out; }

/* a copy the factory spoiled: one wire stuck at 0 or 1, chosen among those that change an answer.
   Says which patterns now go wrong, and whether the test patterns would catch it at the Test station. */
function spoil(B, vecs, seed) {
  const F = TC.faults(B.M, vecs), live = F.F.map((f, i) => ({ f, i })).filter(x => F.detected[x.i] >= 0);
  if (!live.length) return null;
  const pick = live[Math.abs(seed) % live.length], rows = []; let st = {}, gst = {};
  for (const v of vecs) {
    const r = TC.simCells(B.M, v, pick.f, st), g = TC.simCells(B.M, v, null, gst);
    rows.push({ v, o: r.out, mis: Object.keys(r.out).filter(k => r.out[k] !== g.out[k]) }); st = r.next; gst = g.next;
  }
  return { net: pick.f.net, v: pick.f.v, rows, wrong: rows.filter(r => r.mis.length).length, caught: true };
}

/* the core as a design: your slice inside, and your register bit and select if you have written them;
   checked by the test programs, running your program */
function coreDesign(code, slice, defect, regs) {
  const C = buildCore(slice, code, defect, regs), S = build({ p: 'alu', code: slice });
  const out = { p: 'core', code, proj: CORE, ins: CORE.ins, outs: CORE.outs, seq: false, spec: true, core: C, slice: S,
    errs: C.errs.map(e => ({ l: e.l, k: 'core.' + e.k, n: e.n })), bad: C.total - C.passed, total: C.total };
  if (S.M) Object.assign(out, { M: S.M, st: S.st, PL: S.PL, RT: S.RT, levels: S.levels, masks: S.masks, vectors: S.vectors, coverage: S.coverage, area: S.area * 32 });
  out.transistors = C.budget.alu + C.budget.regs + C.budget.rest;
  out.ok = C.ok;
  return out;
}

/* the values on every wire for one input pattern (and the flip-flops' state), for drawing */
export const simulate = (B, v, state) => TC.simCells(B.M, v, null, state);
export const patterns = B => TC.testVectors(B.proj);
export const cellSize = type => TC.LIB[type];

/* how many gates deep each cell sits from the inputs, for drawing the gates in columns */
function levels(M) {
  const byOut = {}, lv = {};
  M.cells.forEach((c, i) => { if (c.type !== 'DFF') byOut[c.out] = i; });
  const at = n => { if (lv['n' + n] != null) return lv['n' + n]; const i = byOut[n]; if (i == null) return (lv['n' + n] = 0); lv['n' + n] = -1; const v = 1 + Math.max(0, ...M.cells[i].ins.map(at)); return (lv['n' + n] = v); };
  return M.cells.map(c => (c.type === 'DFF' ? 0 : at(c.out)));
}
