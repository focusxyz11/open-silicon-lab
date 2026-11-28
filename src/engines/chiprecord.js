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
import { handOf, normalPlace, timeLayout, clocksOf, wireOf, CLOCKS, CLOCK_EXAMPLE } from './placer.js';
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
  /* your placement (cell by cell: its site and row) and the clock you set (one of CLOCKS), if you changed them (#508) */
  if (design.place && typeof design.place === 'object') out.place = Object.fromEntries(Object.entries(design.place).map(([i, p]) => [i, { x: +p.x, r: +p.r }]));
  if (Number.isInteger(design.clock) && design.clock >= 0 && design.clock < CLOCKS.length) out.clock = design.clock;
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
  /* the block placed (yours, or by hand: the lab's example) and timed on its layout against the clock you set (#508) */
  const place = built ? normalPlace(B, d.place) || handOf(B) : null, ck = d && d.clock != null ? d.clock : CLOCK_EXAMPLE;
  const timing = built && !B.M.regs.length ? timeLayout(B, place, clocksOf(B)[ck]) : null;
  const cells = built ? B.M.cells.map((c, i) => ({ id: 'c' + i, type: c.type, ins: c.ins.slice(), out: c.out, slot: { x: place[i].x, r: place[i].r, w: place[i].w } })) : [];
  const M = built ? maskSet(B) : null;
  const masks = M ? { total: M.total, drawn: M.drawn, cells: M.cells, groups: M.groups.map(g => ({ id: g.id, masks: g.masks.slice(), n: g.n, drawn: g.drawn.slice() })) } : null;
  const broken = R.broken === 'switch' ? 'switch' : !B ? 'empty' : !B.ok ? 'design' : null;
  /* the floorplan your recipe lays out, and its heat and trips (src/engines/floorplan.js, #507) */
  const fp = floorplanOf(recipeOf(st), fineOf(st)), heat = heatOf(fp);
  return {
    recipe: recipeOf(st), fine: fineOf(st), aim: aimOf(st), design: d, ok: !broken, broken, errs: B ? B.errs.slice() : [],
    cells, vias: built && B.RT ? B.RT.vias : 0, coverage: built && Number.isFinite(B.coverage) ? B.coverage : null,
    transistors: built && Number.isFinite(B.transistors) ? B.transistors : null, area: built ? B.area : null, masks, die, floorplan: fp, heat,
    place, wire: built ? { now: wireOf(B, place), hand: wireOf(B, handOf(B)) } : null, clock: ck,
    timing: timing ? { path: timing.path.map(i => 'c' + i), arrival: timing.arrival, period: timing.period, slack: timing.slack, meets: timing.meets, wire: timing.wire } : null, late: !!timing && !timing.meets,
    fid: { cells: C('design'), vias: C('design'), coverage: C('design'), transistors: C('design'), area: C('design'), masks: C('rules'), die: { f: 'idea', by: 'bet' }, hottest: heat.fid.hottest, trip: heat.fid.trip, timing: { f: 'idea', by: 'placer' }, wire: { f: 'computed', by: 'placer' } }
  };
}

/* ---- the record ---- */
export function recordOf(stack, design, care) {
  const st = care == null ? (stack || stackOf()) : withCare(stack, care), c = fineOf(st).care, D = designedOf(st, design);
  const plan = { area: D.die ? D.die.area : null, cells: D.cells.map(x => ({ id: x.id, type: x.type })), masks: D.masks ? { drawn: D.masks.drawn, total: D.masks.total } : null, vias: D.vias, broken: D.broken, late: D.late };
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
