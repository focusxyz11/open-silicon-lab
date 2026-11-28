/* Your block placed, timed on its layout and tested (#508, docs/prototypes/studio-fab/GUIDE.md §2, "The four
   simulations"). Pure; tests in tests/placer.test.mjs. The studio draws what these return and computes nothing.

   - Placement: your design's cells (src/engines/design.js, build) sit in rows of sites, as the tiny-chip engine places
     them (its rows and width). By hand, a person lays them out in the order the description names them, row after row
     (handOf); scrambled, at random (scrambleOf); settled, an annealer swaps cells while the wire gets shorter and,
     less and less often, longer (settleFrames: the frames you watch). The wire is the half perimeter of every net's
     pins, in sites (wireOf), as placers count it.
   - Timing on the layout (timeLayout): the longest chain from an input to an output, each cell's own delay (the
     tiny-chip library's, as src/engines/timing.js counts it) plus the wire it drives, WIRE_PS_PER_SITE a site of
     distance from its output to the next cell's input. A long wire makes a path late: the scramble shows it. The wire
     delay is an idea drawn (at 130 nm a short wire is much faster than this; across a large block it is not).
   - The clock to meet: four periods around the hand placement's own delay (CLOCKS: x1.6, x1.12, x0.95, x0.8).
   - Coverage (coverageOf): every state of the block's inputs, and one wire of the netlist moved, the change that the
     fewest states reveal (the engine tries every input of every cell against every other net); a few random tests
     usually miss it, testing every state finds it. */
import TC from './tinychip.js';
import { overhead } from './timing.js';

export const WIRE_PS_PER_SITE = 6, ROW_SITES = 6;            // a row is about six sites tall (2.72 µm against 0.46)
export const CLOCKS = [1.6, 1.12, 0.95, 0.8];
export const CLOCK_EXAMPLE = 1;                              // the lab's example: x1.12 of the hand placement's delay
const delayOf = c => TC.LIB[c.type][2] * TC.NODE['130'].dly;

/* the rows and width the tiny-chip engine gave the block */
export const gridOf = B => ({ cols: B.PL.W, rows: Array.isArray(B.PL.rows) ? B.PL.rows.length : B.PL.rows });

/* lists of cells per row, packed: each row's cells side by side with even gaps */
function pack(B, rowsL) {
  const { cols } = gridOf(B), place = {};
  rowsL.forEach((L, r) => {
    const used = L.reduce((s, i) => s + widthOf(B, i), 0), gap = Math.max(0, (cols - used) / (L.length + 1));
    let x = gap;
    L.forEach(i => { const w = TC.LIB[B.M.cells[i].type][1]; place[i] = { x: Math.round(x * 100) / 100, r, w }; x += w + gap; });
  });
  return place;
}
const widthOf = (B, i) => TC.LIB[B.M.cells[i].type][1];
/* fill rows in order: each cell goes in the row being filled while it fits */
function fill(B, order) {
  const { cols, rows } = gridOf(B), rowsL = Array.from({ length: rows }, () => []);
  let r = 0, used = 0;
  for (const i of order) { const w = widthOf(B, i); if (used + w > cols && r < rows - 1 && rowsL[r].length) { r++; used = 0; } rowsL[r].push(i); used += w; }
  return rowsL;
}
/* the rows of a placement, as ordered lists */
const rowsOf = (B, place) => { const { rows } = gridOf(B), L = Array.from({ length: rows }, () => []); B.M.cells.forEach((c, i) => { if (place[i]) L[place[i].r].push(i); }); L.forEach(l => l.sort((a, b) => place[a].x - place[b].x)); return L; };

/* by hand: in the order the description names the cells */
export function handOf(B) { return pack(B, fill(B, B.M.cells.map((c, i) => i))); }
/* scrambled: in an order drawn at random (seeded) */
export function scrambleOf(B, seed = 1) {
  let s = seed * 9301 + 49297; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const order = B.M.cells.map((c, i) => i);
  for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
  /* spread over every row, not filled one by one */
  const { rows } = gridOf(B), rowsL = Array.from({ length: rows }, () => []);
  order.forEach((i, k) => rowsL[k % rows].push(i));
  return pack(B, rowsL);
}
/* a placement made whole: every cell in a row, inside the block, else the hand placement */
export function normalPlace(B, place) {
  if (!place || typeof place !== 'object') return null;
  const { cols, rows } = gridOf(B);
  const ok = B.M.cells.every((c, i) => { const p = place[i]; return p && Number.isInteger(p.r) && p.r >= 0 && p.r < rows && Number.isFinite(p.x) && p.x >= 0 && p.x + widthOf(B, i) <= cols + 1e-6; });
  return ok ? Object.fromEntries(B.M.cells.map((c, i) => [i, { x: +place[i].x, r: place[i].r, w: widthOf(B, i) }])) : null;
}

/* where a cell's pins are, in sites: its output at its right, its inputs at its left; the block's inputs at its left
   edge, its outputs at its right */
const pinOut = (place, i) => [place[i].x + place[i].w, place[i].r * ROW_SITES + ROW_SITES / 2];
const pinIn = (place, i) => [place[i].x, place[i].r * ROW_SITES + ROW_SITES / 2];
function ioOf(B) {
  const { cols, rows } = gridOf(B), H = rows * ROW_SITES, inn = {}, out = {};
  B.M.inputs.forEach((p, k) => { inn[p.net] = [-1, (k + 1) * H / (B.M.inputs.length + 1)]; });
  B.M.outs.forEach((p, k) => { out[p.net] = [cols + 1, (k + 1) * H / (B.M.outs.length + 1)]; });
  return { inn, out };
}
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

/* the wire: every net's half perimeter, in sites */
export function wireOf(B, place) {
  const io = ioOf(B), P = {};
  const add = (n, pt) => { (P[n] = P[n] || []).push(pt); };
  B.M.inputs.forEach(p => add(p.net, io.inn[p.net]));
  B.M.cells.forEach((c, i) => { add(c.out, pinOut(place, i)); c.ins.forEach(n => add(n, pinIn(place, i))); });
  B.M.outs.forEach(p => add(p.net, io.out[p.net]));
  let s = 0;
  for (const L of Object.values(P)) { if (L.length < 2) continue; const xs = L.map(p => p[0]), ys = L.map(p => p[1]); s += Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys); }
  return Math.round(s * 10) / 10;
}

/* settling: annealing from a placement, swapping two cells at a time; frames of it to watch (the last is where it
   settled). Seeded, so the same start settles the same way */
export function settleFrames(B, place, { steps = 6000, frames = 24, seed = 7 } = {}) {
  let s = seed >>> 0; const R = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const rowsL = rowsOf(B, place), { cols } = gridOf(B), used = L => L.reduce((a, i) => a + widthOf(B, i), 0);
  let cur = pack(B, rowsL), cost = wireOf(B, cur), T = Math.max(2, cost / 3);
  const out = [];
  for (let k = 0; k < steps; k++) {
    const r1 = Math.floor(R() * rowsL.length), r2 = Math.floor(R() * rowsL.length), L1 = rowsL[r1], L2 = rowsL[r2];
    if (L1.length && L2.length) {
      const i1 = Math.floor(R() * L1.length), i2 = Math.floor(R() * L2.length), a = L1[i1], b = L2[i2];
      if (a !== b && (r1 === r2 || (used(L1) - widthOf(B, a) + widthOf(B, b) <= cols && used(L2) - widthOf(B, b) + widthOf(B, a) <= cols))) {
        L1[i1] = b; L2[i2] = a; const next = pack(B, rowsL), nc = wireOf(B, next);
        if (nc <= cost || R() < Math.exp((cost - nc) / T)) { cur = next; cost = nc; } else { L1[i1] = a; L2[i2] = b; }
      }
    }
    T *= 0.9985;
    if ((k + 1) % Math.ceil(steps / frames) === 0) out.push(cur);
  }
  if (out[out.length - 1] !== cur) out.push(cur);
  return out;
}
/* two cells swapped by hand (dragged one onto the other) */
export function swapOf(B, place, a, b) {
  if (a === b || !place[a] || !place[b]) return place;
  const rowsL = rowsOf(B, place), ra = place[a].r, rb = place[b].r, ia = rowsL[ra].indexOf(a), ib = rowsL[rb].indexOf(b), { cols } = gridOf(B), used = L => L.reduce((s, i) => s + widthOf(B, i), 0);
  rowsL[ra][ia] = b; rowsL[rb][ib] = a;
  if (used(rowsL[ra]) > cols || used(rowsL[rb]) > cols) return place;
  return pack(B, rowsL);
}

/* timing on the layout: the longest chain from an input to an output, cells and wires; its slack against a period */
export function timeLayout(B, place, period) {
  const io = ioOf(B), byOut = {}, memo = {};
  B.M.cells.forEach((c, i) => { if (c.type !== 'DFF') byOut[c.out] = i; });
  const arrive = i => {
    if (memo[i]) return memo[i];
    const c = B.M.cells[i]; let best = { t: 0, from: null, wire: 0 };
    c.ins.forEach(n => { const d = byOut[n], src = d != null ? pinOut(place, d) : io.inn[n] || pinIn(place, i), w = dist(src, pinIn(place, i)) * WIRE_PS_PER_SITE, t = (d != null ? arrive(d).t : 0) + w; if (t > best.t || best.from == null) best = { t, from: d != null ? d : null, wire: w }; });
    return (memo[i] = { t: best.t + delayOf(c), from: best.from, wire: best.wire });
  };
  let end = null, endT = -1;
  B.M.outs.forEach(p => { const d = byOut[p.net]; if (d == null) return; const t = arrive(d).t + dist(pinOut(place, d), io.out[p.net]) * WIRE_PS_PER_SITE; if (t > endT) { endT = t; end = d; } });
  const path = []; for (let i = end; i != null; i = memo[i].from) path.unshift(i);
  const arrival = endT + overhead('130'), wire = path.reduce((s, i) => s + memo[i].wire, 0);
  return { path, arrival, wire, period: period || null, slack: period ? period - arrival : null, meets: period ? arrival <= period : null, fid: { arrival: { f: 'idea', by: 'placer' }, slack: { f: 'idea', by: 'placer' } } };
}
/* the clock to meet: four periods around the hand placement's own delay */
export const clocksOf = B => { const t = timeLayout(B, handOf(B)).arrival; return CLOCKS.map(k => Math.round(t * k)); };

/* coverage: the block's states, and the one-wire change the fewest of them reveal */
const COVER = new Map();
export function coverageOf(B) {
  const key = B.p + '\n' + B.code; if (COVER.has(key)) return COVER.get(key);
  const ins = B.M.inputs.map(p => p.name), n = 1 << ins.length;
  const vec = s => Object.fromEntries(ins.map((nm, k) => [nm, (s >> (ins.length - 1 - k)) & 1]));
  const outsOf = M => s => { const v = TC.simCells(M, vec(s), null, null).out; return B.M.outs.map(o => v[o.name]).join(''); };
  const good = Array.from({ length: n }, (_, s) => outsOf(B.M)(s));
  /* a wire moved to a net worked out before its cell (the block's inputs, or an earlier cell's output), so the block
     stays a chain from inputs to outputs */
  const before = i => [...B.M.inputs.map(p => p.net), ...B.M.cells.slice(0, i).map(c => c.out)];
  let bug = null, wrong = null;
  B.M.cells.forEach((c, i) => c.ins.forEach((net, k) => before(i).forEach(to => {
    if (to === net) return;
    const M2 = { ...B.M, cells: B.M.cells.map((x, j) => (j === i ? { ...x, ins: x.ins.map((y, q) => (q === k ? to : y)) } : x)) };
    let sim; try { sim = outsOf(M2); } catch (e) { return; }
    const w = []; for (let s = 0; s < n; s++) if (sim(s) !== good[s]) w.push(s);
    if (w.length && (!wrong || w.length < wrong.length)) { wrong = w; bug = { cell: i, input: k, from: net, to }; }
  })));
  const out = { states: n, cols: 1 << Math.ceil(ins.length / 2), rows: 1 << Math.floor(ins.length / 2), bug, wrong: wrong || [], fid: { f: 'computed', by: 'design' } };
  if (COVER.size > 20) COVER.clear(); COVER.set(key, out); return out;
}
/* how many random tests a run tries: the guide's twenty of 512 states, in proportion (at least two) */
export const randomCount = C => Math.max(2, Math.round(C.states * 20 / 512));
/* the states a run of tests tries: n random ones (seeded), or all */
export function testsOf(C, n, seed = 1) {
  if (n == null || n >= C.states) return Array.from({ length: C.states }, (_, s) => s);
  let s = seed >>> 0; const R = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  const set = new Set(); while (set.size < n) set.add(Math.floor(R() * C.states)); return [...set];
}

/* ---- what an agent proposes for your block (#510): a placement settled from yours, with what it gains; or a
   placement it brings, scored beside yours. It changes nothing: the person takes it or not ---- */
export function scorePlacement(B, place, period) {
  const T = timeLayout(B, place, period); return { wire: wireOf(B, place), arrival: T.arrival, slack: T.slack, meets: T.meets };
}
export function proposePlacement(B, place, period, proposed) {
  const p = proposed ? normalPlace(B, proposed) : (fr => fr[fr.length - 1])(settleFrames(B, place, { seed: 11 }));
  if (!p) return { yours: scorePlacement(B, place, period), proposed: null, refused: 'place' };
  const yours = scorePlacement(B, place, period), theirs = scorePlacement(B, p, period);
  return { yours, proposed: theirs, place: p, shorter: yours.wire - theirs.wire, faster: yours.arrival - theirs.arrival, better: theirs.wire < yours.wire && theirs.arrival <= yours.arrival + 1e-9 };
}
