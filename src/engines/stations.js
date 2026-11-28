/* The line's stations, every machine a function (#505, docs/CHIP.md rule 2). A station takes the chip so far and the
   line's care and returns { chip, report }: the chip after it (a new object; the old one is left alone) and what it
   added, what went wrong, what it cost and the mark of every number. The line is these functions in order
   (STATIONS in src/data/chiprecord.js); the record (src/engines/chiprecord.js) and the stack's carry
   (src/engines/path.js) both run it, so nothing computes the line twice. Pure.

   Each station wraps the engine the lab already has and adds no formula of its own beyond reading it onto your die:
   - crystal: the puller's autopilot (crystal.js, pullRun): the ingot and how many wafers it gives;
   - deposit: a film laid in a trench (fabline.js, depoRun) and the cleanroom's air at the care (isoLimit): the
     specks a cm², against today's line's (chip.js, defectsOf);
   - print: the EUV scanner at the care's dose (litho.js, euv): its photon noise against today's (the copies' spread)
     and its wafers an hour against today's (the line's pace); and it prints the design's masks and cells, each copy's
     width strayed by its own seed (the guide's wavy edges, an idea drawn);
   - etch: the plasma etch (etch.js, etchRun) cuts what Print left; a copy whose width strays too far switches late;
   - implant: the junction (dope.js, implant);
   - wires: the vias your routing drew, each landing with the scanner's overlay (fabline.js, overlay, VIA);
   - test: the dies of the wafer (chip.js, dieOf): how many fit, how many no speck hits, what a good one costs, and
     which of the frame's dies fail, each by its own seed.
   Package waits for its engine (#500): it keeps its place in STATIONS and has no function yet.
   A design whose path misses its clock (the record's late, #508) is made anyway, and Test fails every die for speed. */
import { pullRun } from './crystal.js';
import { depoRun, isoLimit, overlay, OVERLAY_DEFAULTS } from './fabline.js';
import { euv } from './litho.js';
import { etchRun } from './etch.js';
import { implant } from './dope.js';
import { dieOf, defectsOf, START as CHIP_START } from './chip.js';
import { CARE, CHOICES, EXAMPLE, DENSITY } from '../data/path.js';
import { STATIONS, SETTINGS, WAFER_DIES, WIDTH, STRAY } from '../data/chiprecord.js';

const C = by => ({ f: 'computed', by }), IDEA = by => ({ f: 'idea', by });

/* ---- seeds: the same copy strays at every station and every visit ---- */
/* a number from an id (FNV-1a), and a hash in 0..1 from it (the prototype's) */
export function seedOf(id) {
  let h = 2166136261;
  for (const ch of String(id)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 100003;
}
export const hashOf = id => { const x = Math.sin(seedOf(id) * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

/* ---- the care ---- */
export const careOf = care => (CHOICES.care.includes(care) ? care : EXAMPLE.care);
/* what today's line does, the measure of every care's spread, pace and specks */
const TODAY = { print: euv({ dose: CARE.dose[EXAMPLE.care] }), air: isoLimit(CARE.clean[EXAMPLE.care]) };

/* the engines no care changes, run once */
const once = f => { let v; return () => (v === undefined ? (v = f()) : v); };
const INGOT = once(() => pullRun(SETTINGS.crystal)), FILM = once(() => depoRun(SETTINGS.deposit)), ETCHED = once(() => etchRun({}, SETTINGS.etch.seed));
const JUNCTION = once(() => implant(SETTINGS.implant)), LANDING = once(() => overlay(OVERLAY_DEFAULTS));

/* ---- the chip before the line: a bare wafer to be, carrying what the design asks the line to make ---- */
/* plan: { area (cm², the die your stack makes; none for the line alone), cells ([{ id, type }]), masks ({ drawn,
   total } or null), vias, broken (null, 'empty', 'design' or 'switch') } */
export function bareChip(plan) {
  const p = Object.assign({ area: null, cells: [], masks: null, vias: 0, broken: null, late: false }, plan || {});
  return { plan: p, done: [], stopped: null };
}

const step = (chip, id, add) => Object.assign({}, chip, add, { done: chip.done.concat(id) });
const report = (id, o) => Object.assign({ step: id, adds: [], wrong: [], cost: null, figures: {}, fid: {} }, STATIONS.find(s => s.id === id).mark ? { mark: STATIONS.find(s => s.id === id).mark } : {}, o);

/* ---- the stations ---- */
function crystal(chip) {
  const s = INGOT(), ingot = { usableMm: s.usable, wafers: s.wafers, neckOk: s.neckOk === true };
  return { chip: step(chip, 'crystal', { ingot }),
    report: report('crystal', { adds: ['ingot'], wrong: ingot.neckOk ? [] : [{ what: 'neck' }], figures: { usableMm: ingot.usableMm, wafers: ingot.wafers }, fid: { usableMm: C('crystal'), wafers: C('crystal') } }) };
}
function deposit(chip, care) {
  const f = FILM(), c = careOf(care), perM3 = isoLimit(CARE.clean[c]), specks = defectsOf(CHIP_START.gen) * perM3 / TODAY.air;
  const film = { coveragePct: f.coveragePct, voided: !!f.voided }, air = { iso: CARE.clean[c], perM3 };
  return { chip: step(chip, 'deposit', { film, air, specks }),
    report: report('deposit', { adds: ['film', 'air', 'specks'], wrong: film.voided ? [{ what: 'void' }] : [],
      figures: { coveragePct: film.coveragePct, specks }, fid: { coveragePct: C('fabline'), perM3: C('fabline'), specks: C('fabline') } }) };
}
function print(chip, care) {
  const c = careOf(care), e = euv({ dose: CARE.dose[c] }), spread = e.noisePct / TODAY.print.noisePct, pace = e.wph / TODAY.print.wph;
  const P = chip.plan, stopped = P.broken || null;
  const cells = stopped ? [] : P.cells.map(x => { const jit = (hashOf(x.id) - 0.5) * spread; return { id: x.id, type: x.type, width: 1 + jit * WIDTH, jit }; });
  const masks = stopped || !P.masks ? null : { drawn: P.masks.drawn, total: P.masks.total };
  return { chip: step(chip, 'print', { print: { dose: e.dose, noisePct: e.noisePct, wph: e.wph }, spread, pace, masks, cells, stopped }),
    report: report('print', { adds: ['print', 'spread', 'pace', 'masks', 'cells'], wrong: stopped ? [{ what: stopped }] : [], cost: { wph: e.wph },
      figures: { spread, pace, noisePct: e.noisePct }, fid: { dose: IDEA('path'), noisePct: C('litho'), wph: C('litho'), spread: C('litho'), pace: C('litho'), width: IDEA('litho') } }) };
}
function etch(chip) {
  const s = ETCHED(), et = { depthNm: s.depthNm, undercutNm: s.undercutNm, maskPct: s.maskPct };
  const cells = (chip.cells || []).map(x => Object.assign({}, x, { stray: Math.abs(x.jit) > STRAY })), strays = cells.filter(x => x.stray).length;
  return { chip: step(chip, 'etch', { etch: et, cells }),
    report: report('etch', { adds: ['etch', 'cells'], wrong: strays ? [{ what: 'stray', n: strays }] : [],
      figures: { spread: chip.spread, strays }, fid: { depthNm: C('etch'), undercutNm: C('etch'), maskPct: C('etch'), spread: C('litho'), strays: IDEA('litho') } }) };
}
function implantSt(chip) {
  const j = JUNCTION(), imp = { ion: j.ion, anneal: j.anneal, xjNm: j.xj, activePct: j.activePct };
  return { chip: step(chip, 'implant', { implant: imp }),
    report: report('implant', { adds: ['implant'], figures: { specks: chip.specks }, fid: { xjNm: C('dope'), activePct: C('dope'), specks: C('fabline') } }) };
}
function wires(chip) {
  const o = LANDING(), vias = chip.stopped ? 0 : chip.plan.vias, wiring = { vias, p: o.p, failed: o.p * vias };
  return { chip: step(chip, 'wires', { wiring }),
    report: report('wires', { adds: ['wiring'], wrong: wiring.failed >= 1 ? [{ what: 'via', n: Math.round(wiring.failed) }] : [],
      figures: { specks: chip.specks }, fid: { p: C('fabline'), failed: C('fabline'), specks: C('fabline') } }) };
}
/* the die the Test station finds for an area on a line with these specks and pace: the chip engine's, read by the
   carry too when it has no record (src/engines/path.js) */
export const dieAt = (area, specks, pace) => dieOf(area, specks, pace);
function test(chip) {
  const A = chip.plan.area;
  if (!(A > 0)) return { chip: step(chip, 'test', { test: null }), report: report('test', { wrong: [{ what: 'noDie' }] }) };
  /* a design whose path misses its clock is made anyway, and every die fails Test for speed (GUIDE.md §7, Late) */
  const late = !!chip.plan.late && !chip.stopped, d = dieAt(A, chip.specks, chip.pace), good = Array.from({ length: WAFER_DIES }, (_, i) => !late && hashOf('die' + i) < d.yield);
  const strays = (chip.cells || []).filter(x => x.stray).length, t = { area: d.area, dies: d.dies, yield: d.yield, cost: d.cost, wafer: d.wafer, good, strays, slow: late };
  return { chip: step(chip, 'test', { test: t }),
    report: report('test', { adds: ['test'], wrong: late ? [{ what: 'speed', n: WAFER_DIES }] : good.some(g => !g) ? [{ what: 'dies', n: good.filter(g => !g).length }] : [], cost: { goodDie: d.cost },
      figures: { good: good.filter(Boolean).length, yield: d.yield, cost: d.cost }, fid: { area: IDEA('bet'), dies: C('chip'), yield: C('chip'), cost: C('chip'), good: C('chip') } }) };
}

/* every station that has a function, by its id; Package (#500) is added here when it is built */
export const STATION_FNS = { crystal, deposit, print, etch, implant: implantSt, wires, test };

/* the line run on a chip with a care: every station with a function, in order, up to and including upTo; one
   { step, chip, report } per station */
export function runLine(chip, care, upTo) {
  const out = [];
  let c = chip;
  for (const s of STATIONS) {
    const fn = STATION_FNS[s.id];
    if (!fn) continue;
    const r = fn(c, careOf(care));
    out.push({ step: s.id, chip: r.chip, report: r.report });
    c = r.chip;
    if (s.id === upTo) break;
  }
  return out;
}

/* what the line hands up the stack, read from the made part: the care, the print's dose, noise, spread, wafers an
   hour and pace, the air and its specks, each with the engine behind it and its mark, and the die Test found (if
   the line reached it). The stack's carry reads this (src/engines/path.js), never the engines behind it. */
export function fabOf(made, care) {
  const at = id => (made.find(m => m.step === id) || {}).chip || {}, P = at('print'), D = at('deposit'), T = at('test');
  const fab = {
    care: careOf(care), dose: P.print.dose, noise: P.print.noisePct, spread: P.spread, wph: P.print.wph, pace: P.pace,
    iso: D.air.iso, air: D.air.perM3, defects: D.specks,
    fid: { spread: C('litho'), pace: C('litho'), defects: C('fabline'), density: { f: 'figures', fact: DENSITY.fact }, area: IDEA('bet'), yield: C('chip'), cost: C('chip') }
  };
  return { fab, die: T.test || null };
}
