/* The lenses at a level, as models (#304): each of the core questions, seen at a level, is a rule over the facts its
   parts carry (src/data/partfacts.js), with one control and the measures it moves. Every number comes from an
   engine of the lab or from the parts' own geometry, never written here: the energies of a sum and a fetch from
   src/engines/paradigms.js (E16, after Horowitz's 45 nm table, facts.json energy-moving-data), an AI answer's energy
   from src/engines/budget.js, the rebound from Jevons' bet (src/engines/bet.js), copies that drift from Brain or copy
   (src/engines/mortal.js), the memory array adding with currents from compute in memory (src/engines/paradigms.js),
   and layouts a program draws from the bench's place-and-route (src/engines/bench.js). Pure, no DOM; drawn by
   src/v2/lenspaint.js; tests in tests/lens.test.mjs.
   Each model: (facts, control) -> { measures: { id: value }, ...what its paint needs }. */
import { E16, crossbar, cimEnergy, rng, gauss } from './paradigms.js';
import { budget, JOB, PLAN } from './budget.js';
import { jevons, EFF, CAP } from './bet.js';
import { evaluate, fleet, rng as mrng, SHARES } from './mortal.js';
import { CIM_ERR } from './bits.js';
import { CIM_TOLERANCE } from './paradigms.js';
import { ni } from './dope.js';
import * as Bench from './bench.js';
import { model as chipModel, START as CHIP, CLOCKS } from './chip.js';
import { build, solutionOf } from './design.js';

const parts = (F, kind) => F.parts.filter(p => p.kind === kind);
const rectsOf = (F, kind) => parts(F, kind).flatMap(p => p.rects);
const pathLen = p => p.slice(1).reduce((s, q, i) => s + Math.abs(q[0] - p[i][0]) + Math.abs(q[1] - p[i][1]), 0);
/* the shortest way along wires (across, then down) from a point to a rectangle */
const toRect = ([x, y], [rx, ry, rw, rh]) => Math.max(rx - x, 0, x - rx - rw) + Math.max(ry - y, 0, y - ry - rh);
const round = (v, d = 2) => Number(v.toPrecision(d));

/* ---- Geometry: distance and heat. Control: where the logic sits, from spread out (0) to packed beside the memory
   (1). Packing shortens every trip to memory and crowds the same work into less room: the same heat in less area. */
export const PACK_SQUEEZE = 0.6;   /* packed, the logic keeps 40% of its room: it is the same cells, closer together */
export function geometry(F, pack = 0) {
  const mem = rectsOf(F, 'memory')[0], logic = parts(F, 'logic').filter(p => p.by === 'program').flatMap(p => p.rects);
  const right = mem[0] - 36, keep = 1 - PACK_SQUEEZE * pack;
  const placed = logic.map(([x, y, w, h]) => { const w2 = w * keep, x2 = x + (right - (x + w)) * pack + (w - w2) * pack; return [x2, y, w2, h]; });
  /* every trip: from points along each row of logic to the nearest edge of the memory, along the wires */
  const trips = placed.flatMap(([x, y, w, h]) => Array.from({ length: 8 }, (_, i) => { const p = [x + w * (i + 0.5) / 8, y + h / 2]; return { from: p, len: toRect(p, mem) }; }));
  const avg = trips.reduce((s, t) => s + t.len, 0) / trips.length;
  const wires = parts(F, 'wire').flatMap(p => p.paths).map(p => ({ p, len: pathLen(p) }));
  return { placed, trips, wires, mem, measures: { trip: round(avg * F.um, 2), heat: round(1 / keep, 2) } };
}

/* ---- Efficiency fuels use: an AI answer's energy (the budget engine's, for today's chip), each answer made cheaper
   again, step by step (Jevons' bet's steps), and the world asking more as the price falls (its rebound). Control:
   how many times each answer has been made cheaper (0 to 5 halvings). */
export const EFF_STEPS = EFF.length - 1;
export function efficiency(F, step = 0) {
  const J = jevons(Math.max(0, Math.min(EFF_STEPS, step)), CAP.length - 1), base = budget(JOB, PLAN);
  /* where today's answer goes at this level: moving numbers against computing with them */
  const blk = base.levels.block || { move: 0, compute: 0 }, moving = blk.move / Math.max(1e-30, blk.move + blk.compute);
  return { step, moving, measures: { energy: round(base.total * J.e, 2), answers: round(J.answers, 2), power: round(J.energy, 2) },
    /* what the picture carries: a fetch from memory is a big pulse, a sum a small spark, about as many as there are answers */
    pulses: Math.min(40, Math.round(6 * Math.sqrt(J.answers))) };
}

/* ---- Brain or copy: where memory lives. Control: the share of the network's numbers kept inside the logic as analog
   cells (learned there, on this chip), against bits in the memory array; then the block copied to a new chip. */
export const COPY_SHARES = SHARES;
export function brainCopy(F, share = 0) {
  const o = { share, learn: 'chip', calibrate: false }, r = evaluate(o), R = mrng(7);
  return { share, fleet: fleet(o, 24, R), measures: { energy: round(r.energy, 2), own: r.own, copied: r.copied } };
}

/* ---- Digital meets physical: one wire's voltage, read against the line where 1 begins (half the swing). Control: the
   noise on the wire, as a share of the swing. Measure: bits read wrong, of every bit sent. */
export const NOISE = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4];
const erfc = x => { const t = 1 / (1 + 0.5 * Math.abs(x)), y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? y : 2 - y; };
export const BITS = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0];
export function digital(F, noise = 0) {
  /* each bit's level plus noise, read at its middle; wrong where the noise carried it over the line */
  const r = rng(11), wrong = noise > 0 ? 0.5 * erfc(0.5 / (noise * Math.SQRT2)) : 0;
  const reads = BITS.map(b => { const v = b + noise * gauss(r); return { bit: b, v, read: v >= 0.5 ? 1 : 0 }; });
  const wires = parts(F, 'wire').flatMap(p => p.paths), wire = wires.slice().sort((a, b) => pathLen(b) - pathLen(a))[0] || null;
  return { noise, reads, wire, measures: { wrong } };
}

/* ---- Fight or use physics: the same sums done two ways as the block runs hotter. Fight: digital sums with check bits
   on every word (72 bits kept for 64), the margins hold, no answer is off. Use: the memory array adds with currents
   (compute in memory), far cheaper per sum, but hot silicon leaks: its own carriers grow with temperature (ni, from
   the semiconductor engine, src/engines/dope.js), the cells' leakage with them, and the noise of a current as its
   square root, starting from the lab's compute-in-memory error at room temperature. Control: how hot it runs (°C). */
export const HOT = [25, 45, 65, 85, 105];
const ARRAY = 16, ADC = 8, CHECK = 72 / 64, ROOM = 298.15;
export function physics(F, celsius = 25) {
  const T = celsius + 273.15, sigma = CIM_ERR * Math.sqrt(ni(T) / ni(ROOM)), E = cimEnergy(ARRAY, ARRAY, ADC), sums = ARRAY * ARRAY;
  /* answers off: of 40 products through the array, the share off by more than the lab's tolerance */
  const r = rng(5), W = Array.from({ length: ARRAY }, () => Array.from({ length: 8 }, () => r() * 2 - 1));
  let off = 0; for (let k = 0; k < 40; k++) { const x = Array.from({ length: ARRAY }, () => r()); if (crossbar(W, x, { sigma, adcBits: ADC, seed: k + 1 }).err > CIM_TOLERANCE) off++; }
  return { celsius, sigma, measures: { fight: round(E.digital / sums * CHECK, 2), use: round(E.analog / sums, 2), off: off / 40 } };
}

/* ---- Only humans: who made each part. A program draws layouts of your design, every one right (the same cells, the
   same answers, routed again), as many as you ask for; which one goes on the chip is a person's choice. Control: draw
   another layout. Measures: how many drawn, how many pass, and the shortest and longest wire among them. */
export function humans(F, drawn = 1, design = 'full') {
  const B = build({ p: design, code: solutionOf(design) }), rows0 = Bench.rowsOf(B.PL), R = rng(23), layouts = [];
  for (let n = 0; n < Math.max(1, drawn); n++) {
    /* the k-th layout: the cells of each row in an order of the program's own */
    const rows = n ? rows0.map(row => row.map(c => [R(), c]).sort((a, b) => a[0] - b[0]).map(x => x[1])) : rows0;
    const m = Bench.measure(B.M, rows, B.PL);
    layouts.push({ rows, wire: m.wl, vias: m.vias, pass: m.failed === 0 && B.ok });
  }
  const wires = layouts.map(l => l.wire);
  const by = Object.fromEntries(['program', 'person', 'open'].map(k => [k, F.parts.filter(p => p.by === k).map(p => p.key)]));
  return { layouts, by, measures: { drawn: layouts.length, pass: layouts.filter(l => l.pass).length, shortest: Math.min(...wires), longest: Math.max(...wires) } };
}

/* ---- Perfect fails: copies that differ. The cells are copies of a few designs, but no two come out the same: their
   paths spread between half and all of the slowest (your chip's model, src/engines/chip.js), and every one longer than
   a tick of the clock is late. Control: the clock, against today's. Measure: the share of signals that arrive late. */
export function perfect(F, clock = 1) {
  const m = chipModel(Object.assign({}, CHIP, { clock }));
  return { clock, path: m.path, tick: m.tick, measures: { late: m.late } };
}

/* each lens's model, its control (the values it takes, and where it starts) and its measures, by the core question */
export const MODELS = {
  geo: { run: geometry, control: { values: [0, 0.25, 0.5, 0.75, 1], start: 0 }, measures: ['trip', 'heat'] },
  eff: { run: efficiency, control: { values: Array.from({ length: EFF_STEPS + 1 }, (_, i) => i), start: 0 }, measures: ['energy', 'answers', 'power'] },
  copy: { run: brainCopy, control: { values: COPY_SHARES, start: 0.3 }, measures: ['energy', 'own', 'copied'] },
  perfect: { run: perfect, control: { values: CLOCKS, start: 1 }, measures: ['late'] },
  dig: { run: digital, control: { values: NOISE, start: 0.1 }, measures: ['wrong'] },
  physics: { run: physics, control: { values: HOT, start: 25 }, measures: ['fight', 'use', 'off'] },
  human: { run: humans, control: { values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], start: 1 }, measures: ['drawn', 'pass', 'shortest', 'longest'] }
};
