/* Your chip, zoomed: one design from the tiny-chip studio, seen at every scale from the board on
   your desk to one transistor switching. Pure logic, no DOM; tests in tests/chipzoom.test.mjs.

   Everything here is computed from the design with the same engines the labs use: the cells come
   from synthesis, their places from simulated annealing, the wires from the maze router, and the
   values on every wire from simulating the cells. Each standard cell is opened up into the CMOS
   transistors that build it, and the tests prove those transistors compute the same logic.

   What is simplified: the board, package and shared chip are drawn in general terms (Tiny Tapeout
   style: a shared chip of 160 tiles, each sized like a Tiny Tapeout tile; see facts tt-tile and
   tt-next-shuttle), and a cell is drawn as its circuit inside its real outline, not as its masks. */
import TC from './tinychip.js';

/* ---------- CMOS: every cell as transistors ----------
   A cell is one or more stages. Each stage drives one node: a network of n-type transistors pulls
   it down to 0 (they conduct when their gate is 1), and the mirror network of p-type transistors
   pulls it up to 1 (they conduct when their gate is 0). Only the pull-down network is written; the
   pull-up is its dual (series becomes parallel and back), which is what makes static CMOS draw no
   current when it is not switching. A network is a gate signal (a string), { s: [...] } for
   transistors in series, or { p: [...] } for transistors in parallel.
   Signals: a, b are the cell's inputs, y its output, na / nb / n internal nodes, '1' and '0' the
   supply rails (a tie cell is an inverter whose input is tied to a rail). */
export const CELLS = {
  INV: [{ out: 'y', pd: 'a' }],
  BUF: [{ out: 'n', pd: 'a' }, { out: 'y', pd: 'n' }],
  NAND2: [{ out: 'y', pd: { s: ['a', 'b'] } }],
  NOR2: [{ out: 'y', pd: { p: ['a', 'b'] } }],
  AND2: [{ out: 'n', pd: { s: ['a', 'b'] } }, { out: 'y', pd: 'n' }],
  OR2: [{ out: 'n', pd: { p: ['a', 'b'] } }, { out: 'y', pd: 'n' }],
  XOR2: [{ out: 'na', pd: 'a' }, { out: 'nb', pd: 'b' }, { out: 'y', pd: { p: [{ s: ['a', 'b'] }, { s: ['na', 'nb'] }] } }],
  XNOR2: [{ out: 'na', pd: 'a' }, { out: 'nb', pd: 'b' }, { out: 'y', pd: { p: [{ s: ['a', 'nb'] }, { s: ['na', 'b'] }] } }],
  TIE0: [{ out: 'y', pd: '1' }],
  TIE1: [{ out: 'y', pd: '0' }]
};
export const dual = e => typeof e === 'string' ? e : e.s ? { p: e.s.map(dual) } : { s: e.p.map(dual) };
const sig = (name, v) => name === '1' ? 1 : name === '0' ? 0 : v[name];
/* Does a network conduct? kind 'n': a transistor is on when its gate is 1; 'p': when it is 0. */
export function conducts(e, v, kind) {
  if (typeof e === 'string') return kind === 'n' ? sig(e, v) === 1 : sig(e, v) === 0;
  return e.s ? e.s.every(x => conducts(x, v, kind)) : e.p.some(x => conducts(x, v, kind));
}
export const leaves = e => typeof e === 'string' ? [e] : (e.s || e.p).flatMap(leaves);

/* A cell opened up: its stages, each with both networks laid out in a box, and a flat list of
   transistors. Coordinates are fractions of the cell outline (0..1 across and down): VDD runs
   along the top, ground along the bottom, each stage's output node across the middle. */
export function circuit(type) {
  const stages = CELLS[type]; if (!stages) return null;
  const width = st => Math.max(span(st.pd), span(dual(st.pd)));
  const total = stages.reduce((s, st) => s + width(st), 0);
  const fets = []; let x0 = 0.04;
  const out = stages.map((st, si) => {
    const w = 0.92 * width(st) / total, box = { x: x0, w };
    const pu = lay(dual(st.pd), { x: x0, y: 0.12, w, h: 0.34 }, 'p', si, fets);
    const pd = lay(st.pd, { x: x0, y: 0.54, w, h: 0.34 }, 'n', si, fets);
    x0 += w; return { ...st, box, pu, pd, mid: x0 - w / 2 };
  });
  return { type, stages: out, fets };
}
/* How many transistors side by side a network needs. */
function span(e) { if (typeof e === 'string') return 1; return e.s ? Math.max(...e.s.map(span)) : e.p.reduce((s, x) => s + span(x), 0); }
function lay(e, b, kind, stage, fets) {
  if (typeof e === 'string') { const f = { i: fets.length, kind, gate: e, stage, x: b.x + b.w / 2, y: b.y + b.h / 2, box: b }; fets.push(f); return { fet: f.i, box: b }; }
  const kids = e.s || e.p, n = kids.length;
  if (e.s) return { s: kids.map((k, j) => lay(k, { x: b.x, y: b.y + j * b.h / n, w: b.w, h: b.h / n }, kind, stage, fets)), box: b };
  const tot = kids.reduce((s, k) => s + span(k), 0); let x = b.x;
  return { p: kids.map(k => { const w = b.w * span(k) / tot, r = lay(k, { x, y: b.y, w, h: b.h }, kind, stage, fets); x += w; return r; }), box: b };
}

/* A cell's inputs (in cell pin order a, b) to every node's value and every transistor's state. */
export function evalCell(type, ins) {
  const v = { a: ins[0] | 0, b: ins[1] | 0 };
  for (const st of CELLS[type]) {
    const down = conducts(st.pd, v, 'n'), up = conducts(dual(st.pd), v, 'p');
    v[st.out] = up && !down ? 1 : down && !up ? 0 : NaN; /* never both, never neither: tested */
  }
  const C = circuit(type);
  return { v, out: v.y, on: C.fets.map(f => f.kind === 'n' ? sig(f.gate, v) === 1 : sig(f.gate, v) === 0) };
}

/* ---------- the scales ---------- */
/* A tile: about 160 × 110 µm at 130 nm, the size of a Tiny Tapeout tile on SKY130 (a two-tile
   analog slot is about 160 × 225 µm), scaled with the process's cell size so it holds the same
   number of cells everywhere. Tiny Tapeout aims for about 1,000 real cells per tile (fact tt-tile). */
export function tileSize(node) { const s = TC.NODE[node].site; return [160 * s[0] / 0.46, 110 * s[1] / 2.72]; }
export const SHARED = { cols: 10, rows: 16, mine: [3, 5] };       /* 160 tiles; yours is one of them */
/* Roughly how long one transistor's gate is. Modern node names are labels, not lengths. */
export const GATE = { '180': 180e-9, '130': 130e-9, '28': 30e-9, '3': 14e-9 };

/* Everything the zoom needs for one design. d: { p, code, node, lib, util } as the studio keeps it. */
export function build(d, opt = {}) {
  const proj = TC.PROJ.find(x => x.id === d.p) || TC.PROJ[0];
  const D = TC.parse(d.code, proj.ins, proj.outs, { regs: !!proj.seq });
  if (D.errs && D.errs.length) return { ok: false, proj, errs: D.errs };
  const node = TC.NODE[d.node] ? d.node : '130', nd = TC.NODE[node];
  const SY = TC.synth(D, proj.ins, proj.outs, d.lib === 'nand' ? 'nand' : 'basic', false, node);
  const PL = TC.place(SY.M, d.util || 0.5, 7); PL.anneal(Math.min(3000, 300 + SY.M.cells.length * 80), null);
  const RT = TC.route(PL);
  const ux = nd.site[0] * 1e-6, uy = nd.site[1] / 3 * 1e-6;              /* one grid step, in meters */
  const dW = PL.GW * ux, dH = PL.H * uy;
  const [tw, th] = tileSize(node).map(v => v * 1e-6);
  const gap = 0.12 * tw, dieW = SHARED.cols * tw + 2 * gap, dieH = SHARED.rows * th + 2 * gap + 0.05 * tw;
  const cells = SY.M.cells.map((c, i) => { const q = PL.pos[i]; return { i, type: c.type, ins: c.ins, out: c.out, x: 2 + q.x, y: q.r * PL.TR + 1, w: q.w, h: 3 }; });
  const pick = opt.cell != null && cells[opt.cell] && cells[opt.cell].type !== 'DFF' ? opt.cell : defaultCell(cells);
  const cell = cells[pick], C = circuit(cell.type);
  const fetI = Math.max(0, Math.min(C.fets.length - 1, opt.fet == null ? C.fets.findIndex(f => f.kind === 'n') : opt.fet));
  const cW = cell.w * ux, cH = 3 * uy;
  /* Physical centre of each next level inside this one, then as a fraction of this level's half-width. */
  const [mc, mr] = SHARED.mine;
  const tileC = [gap + (mc + 0.5) * tw - dieW / 2, gap + (mr + 0.5) * th - dieH / 2];
  const inTile = Math.min(0.9 * tw / dW, 0.9 * th / dH, 1);                  /* only shrinks a design too big to fit */
  const blockC = [-tw / 2 + 0.06 * tw + dW * inTile / 2, -th / 2 + 0.08 * th + dH * inTile / 2];
  const cellC = [(cell.x + cell.w / 2) * ux - dW / 2, (cell.y + 1.5) * uy - dH / 2];
  const f = C.fets[fetI], fetC = [(f.x - 0.5) * cW, (f.y - 0.5) * cH];
  const sizes = {
    board: 0.07, pkg: 0.012, die: Math.max(dieW, dieH) * 1.08, tile: Math.max(tw, th) * 1.1,
    design: Math.max(dW, dH) * 1.4, cell: Math.max(cW, cH) * 1.3, fet: GATE[node] * 7
  };
  const T = (c, size) => [c[0] / (size / 2), c[1] / (size / 2)];
  const levels = [
    { id: 'board', size: sizes.board, T: [0, -0.04] },
    { id: 'pkg', size: sizes.pkg, T: [0, 0] },
    { id: 'die', size: sizes.die, T: T(tileC, sizes.die) },
    { id: 'tile', size: sizes.tile, T: T(blockC, sizes.tile) },
    { id: 'design', size: sizes.design / inTile, T: T(cellC, sizes.design / inTile) },
    { id: 'cell', size: sizes.cell, T: T(fetC, sizes.cell) },
    { id: 'fet', size: sizes.fet, T: null }
  ];
  return {
    ok: true, proj, node, nd, SY, PL, RT, cells, pick, cell, circuit: C, fetI, levels,
    um: { ux, uy, dW, dH, tw, th, dieW, dieH, gap, cW, cH, inTile }
  };
}
/* The first cell to open: the one driving the first output, which shows the most. */
function defaultCell(cells) { const k = cells.findIndex(c => !['BUF', 'TIE0', 'TIE1', 'DFF'].includes(c.type)); return k >= 0 ? k : Math.max(0, cells.findIndex(c => c.type !== 'DFF')); }

/* The value on every net for one set of inputs (and the flip-flops' current values), each cell's input
   values in pin order, and what each flip-flop takes at the next tick. */
export function signals(Z, inputs, state) {
  const v = {}; Z.proj.ins.forEach((k, j) => { v[k] = inputs[j] | 0; });
  const S = TC.simCells(Z.SY.M, v, null, state);
  return { net: S.val, out: S.out, next: S.next, cellIns: Z.cells.map(c => c.ins.map(n => S.val[n])) };
}
