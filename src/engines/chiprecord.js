/* Your chip's record (#505, docs/CHIP.md): one record that the studio, the line and its machines, the simulations and
   the stack's carry all read, and none keeps a copy of. Its shape and the line's order are src/data/chiprecord.js.
   Pure: every number comes from an engine, and the record is plain data, kept as its inputs (osl-chip).

   - designedOf(stack, design): as designed: the recipe, the fine settings and the aim of your stack; the studio's
     design built (design.js, build: the netlist placed and routed) and its masks (rules.js, maskSet); and the die
     your stack makes (the carry's core: its gates at the line's density, path.js areaOf). What stops the line is
     said here: no design yet (empty), a design that does not do its job (design), a switch that never turns off
     (switch).
   - recordOf(stack, design, care): the record: as designed, as made (the line's stations run in order on a chip
     that carries what the design asks, src/engines/stations.js) and as used (the carry reading the made part,
     path.js carryWith). A care, if given, is set on the stack first, so the line and the carry run with the same.
   - madeAt(record, step): your chip after a step of the line, with that step's report.
   - keepOf(record) and fromKept(kept): the record kept as its inputs and made again from them. */
import { build, normalDesign } from './design.js';
import { maskSet } from './rules.js';
import { floorplanOf, heatOf } from './floorplan.js';
import { stackOf, recipeOf, fineOf, aimOf, carry, carryWith, areaOf } from './path.js';
import { STATION_FNS, runLine, bareChip, careOf } from './stations.js';
import { KIND, VERSION, STEPS } from '../data/chiprecord.js';

export { STATION_FNS as stationFns };

const C = by => ({ f: 'computed', by });

/* the studio's input, as the record keeps it */
function designIn(design) {
  if (!design) return null;
  const d = normalDesign(design), out = { p: d.p, code: d.code };
  if (d.p === 'core' && typeof design.slice === 'string') out.slice = design.slice;
  if (d.p === 'core' && design.regs) out.regs = { bit: typeof design.regs.bit === 'string' ? design.regs.bit : null, select: typeof design.regs.select === 'string' ? design.regs.select : null };
  return out;
}

/* a stack with the line's care set (the care is a fine setting of the switch rung) */
export function withCare(stack, care) {
  const c = careOf(care), s = JSON.parse(JSON.stringify(stack || stackOf()));
  s.rungs.switch.fine = Object.assign({}, s.rungs.switch.fine, { care: c });
  return s;
}

/* ---- as designed ---- */
export function designedOf(stack, design) {
  const st = stack || stackOf(), R = carry(st), d = designIn(design), B = d ? build(d) : null;
  const K = R.rungs.chip && R.rungs.chip.hands, G = R.rungs.gate && R.rungs.gate.hands;
  const die = K && Number.isFinite(K.gates) && G && Number.isFinite(G.switches) ? { gates: K.gates, switches: G.switches, area: areaOf(K.gates, G.switches, G.area) } : null;
  const built = !!(B && B.M);
  const cells = built ? B.M.cells.map((c, i) => {
    const p = B.PL && B.PL.pos && B.PL.pos[i];
    return { id: 'c' + i, type: c.type, ins: c.ins.slice(), out: c.out, slot: p ? { x: p.x, r: p.r, w: p.w } : null };
  }) : [];
  const M = built ? maskSet(B) : null;
  const masks = M ? { total: M.total, drawn: M.drawn, cells: M.cells, groups: M.groups.map(g => ({ id: g.id, masks: g.masks.slice(), n: g.n, drawn: g.drawn.slice() })) } : null;
  const broken = R.broken === 'switch' ? 'switch' : !B ? 'empty' : !B.ok ? 'design' : null;
  /* the floorplan your recipe lays out, and its heat and trips (src/engines/floorplan.js, #507) */
  const fp = floorplanOf(recipeOf(st), fineOf(st)), heat = heatOf(fp);
  return {
    recipe: recipeOf(st), fine: fineOf(st), aim: aimOf(st), design: d, ok: !broken, broken, errs: B ? B.errs.slice() : [],
    cells, vias: built && B.RT ? B.RT.vias : 0, coverage: built && Number.isFinite(B.coverage) ? B.coverage : null,
    transistors: built && Number.isFinite(B.transistors) ? B.transistors : null, area: built ? B.area : null, masks, die, floorplan: fp, heat,
    fid: { cells: C('design'), vias: C('design'), coverage: C('design'), transistors: C('design'), area: C('design'), masks: C('rules'), die: { f: 'idea', by: 'bet' }, hottest: heat.fid.hottest, trip: heat.fid.trip }
  };
}

/* ---- the record ---- */
export function recordOf(stack, design, care) {
  const st = care == null ? (stack || stackOf()) : withCare(stack, care), c = fineOf(st).care, D = designedOf(st, design);
  const plan = { area: D.die ? D.die.area : null, cells: D.cells.map(x => ({ id: x.id, type: x.type })), masks: D.masks ? { drawn: D.masks.drawn, total: D.masks.total } : null, vias: D.vias, broken: D.broken };
  const made = runLine(bareChip(plan), c);
  return { kind: KIND, v: VERSION, care: c, designed: D, made, used: carryWith(st, made) };
}

/* your chip after a step of the line (the chip and its report), or null for a step it has not reached */
export const madeAt = (record, step) => (record && record.made.find(m => m.step === step)) || null;
/* the steps of the line, in order, and those this record's line has run */
export const stepsOf = record => STEPS.filter(s => !!madeAt(record, s));

/* ---- kept as data ---- */
export const keepOf = record => ({ kind: KIND, v: VERSION, recipe: record.designed.recipe, fine: record.designed.fine, aim: record.designed.aim, design: record.designed.design, care: record.care });
export function fromKept(kept) {
  if (!kept || kept.kind !== KIND || kept.v !== VERSION) return null;
  return recordOf(stackOf(kept.recipe, kept.fine, kept.aim), kept.design, kept.care);
}
