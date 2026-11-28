/* The studio's die, laid out (#506, docs/prototypes/studio-fab/GUIDE.md §2): where each part of your chip as designed
   sits on one sheet, read from the record (src/engines/chiprecord.js). Geometry only: no figure is computed here, and
   the same plan is drawn by the studio and, as made, by the line (#511). Pure; tests in tests/studio-plan.test.mjs.

   The sheet: the die is 1000 x 1000 units. Its pads ring the edge. Inside it the units of the floorplan are laid out by
   the recipe's shape (few: one, four or eight; grid: a square of many; stack: layers one over another; swarm: a field
   of tiny ones), and the memory by where it computes (far: off the chip, at its right; near: a band along the bottom;
   in: a piece inside every unit; flow: columns between the units). The first unit holds your block (the design's
   cells in the rows the placer put them in), its registers and its control. Levels are framed by camera targets:
   chip (the die), block (the first unit), gate (about five by four cells around the first cell) and switch (one cell,
   with room at its left for the cut through it the line draws). */
import * as A from '../../engines/arch.js';

export const DIE = 1000, PADS = 10, PAD = 26;
export const LEVELS = ['chip', 'block', 'gate', 'switch'];
const INNER = { x: 60, y: 60, w: 880, h: 880 };

/* the units' grid for a shape and a count: columns, rows, and how many are drawn (a swarm and a big grid are drawn as
   a field, at most 20 x 20 and 16 x 16) */
function gridOf(shape, n) {
  if (shape === 'few') return n <= 1 ? [1, 1] : n <= 4 ? [2, 2] : [4, 2];
  if (shape === 'grid') { const c = Math.min(16, Math.round(Math.sqrt(n))); return [c, c]; }
  if (shape === 'swarm') { const c = Math.min(20, Math.round(Math.sqrt(n))); return [c, c]; }
  return [1, 1];
}

/* the memory's place, and the room it leaves the units */
function memoryOf(where, room) {
  if (where === 'far') return { kind: 'far', boxes: [{ x: DIE + 70, y: 300, w: 190, h: 400 }], room };
  if (where === 'near') return { kind: 'near', boxes: [{ x: room.x, y: room.y + room.h - 120, w: room.w, h: 120 }], room: { x: room.x, y: room.y, w: room.w, h: room.h - 150 } };
  return { kind: where, boxes: [], room };
}

export function planOf(record) {
  const D = record && record.designed, g = (D && D.recipe) || A.TODAY, F = (D && D.fine) || {};
  const shape = A.CARRY.shape[g.shape] ? g.shape : 'few', where = A.CARRY.where[g.where] ? g.where : 'far';
  const n = A.CARRY.shape[shape].units[F.ui != null ? F.ui : 1] || 1;
  const M = memoryOf(where, INNER), R = M.room, units = [], mem = M.boxes.slice();
  if (shape === 'stack') {
    /* layers one over another: drawn as up to five sheets offset up and to the right, the front one is the first */
    const k = Math.min(5, n), off = 26, w = R.w - off * (k - 1), h = R.h - off * (k - 1);
    for (let i = k - 1; i >= 0; i--) units.push({ i, x: R.x + off * i, y: R.y + off * (k - 1 - i), w, h, back: i > 0 });
    units.reverse();
  } else {
    const [c, r] = gridOf(shape, n), gap = shape === 'few' ? 26 : shape === 'grid' ? Math.max(3, 40 / c) : 4;
    const flow = where === 'flow' && c > 1, mw = flow ? Math.min(60, R.w / c * 0.22) : 0;
    const cw = (R.w - gap * (c - 1) - mw * (c - 1)) / c, rh = (R.h - gap * (r - 1)) / r;
    for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) units.push({ i: j * c + i, x: R.x + i * (cw + gap + mw), y: R.y + j * (rh + gap), w: cw, h: rh, back: false });
    if (flow) for (let i = 1; i < c; i++) mem.push({ x: R.x + i * (cw + gap + mw) - mw - gap / 2, y: R.y, w: mw, h: R.h });
    if (where === 'flow' && c === 1) mem.push({ x: R.x + R.w - 70, y: R.y, w: 60, h: R.h });
  }
  /* memory inside every unit: its right quarter */
  if (where === 'in') units.forEach(u => { const m = { x: u.x + u.w * 0.74, y: u.y + u.h * 0.06, w: u.w * 0.2, h: u.h * 0.88 }; u.mem = m; if (!u.back) mem.push(m); });
  const u0 = units[0], usable = u0.mem ? { x: u0.x, y: u0.y, w: u0.w * 0.72, h: u0.h } : u0;
  /* the first unit: your block at its top left, its registers beside it, its control under both */
  const pad = usable.w * 0.06, top = usable.y + usable.h * 0.08;
  const block = { x: usable.x + pad, y: top, w: usable.w * 0.56, h: usable.h * 0.56 };
  const regs = { x: block.x + block.w + pad * 0.7, y: top, w: usable.x + usable.w - pad - (block.x + block.w + pad * 0.7), h: block.h };
  const ctl = { x: block.x, y: block.y + block.h + usable.h * 0.08, w: usable.w - 2 * pad, h: usable.h * 0.18 };
  /* the cells in their slots: the placer's rows and sites */
  const cellsIn = (D && D.cells) || [], cols = Math.max(1, ...cellsIn.map(c => (c.slot ? c.slot.x + c.slot.w : 0))), rows = Math.max(1, ...cellsIn.map(c => (c.slot ? c.slot.r + 1 : 0)));
  const sw = block.w / (cols + 1), rh = block.h / rows, cells = cellsIn.map((c, k) => {
    const s = c.slot || { x: k * 2, r: 0, w: 2 }, w = Math.max(1, s.w) * sw * 0.86;
    return { id: c.id, type: c.type, ins: c.ins, out: c.out, x: block.x + sw * 0.5 + s.x * sw, y: block.y + s.r * rh + rh * 0.2, w, h: rh * 0.6 };
  });
  /* the wires: from the cell that drives a net (or the block's left edge, where a net comes in) to each cell it feeds */
  const driver = new Map(cells.map(c => [c.out, c])), pins = [], wires = [];
  cells.forEach(c => (c.ins || []).forEach((net, k) => {
    const d = driver.get(net), y1 = c.y + c.h * (c.ins.length > 1 ? 0.3 + 0.4 * k : 0.5);
    let x0, y0;
    if (d) { x0 = d.x + d.w; y0 = d.y + d.h / 2; } else { let p = pins.find(q => q.net === net); if (!p) { p = { net, x: block.x, y: block.y + block.h * (0.15 + 0.7 * (pins.length % 6) / 5) }; pins.push(p); } x0 = p.x; y0 = p.y; }
    wires.push({ from: d ? d.id : null, to: c.id, net, pts: [[x0, y0], [(x0 + c.x) / 2, y0], [(x0 + c.x) / 2, y1], [c.x, y1]] });
  }));
  /* the trips between the units and the memory: from each unit's middle to the nearest memory, for at most 64 units */
  const trips = mem.length && units.length <= 64 ? units.filter(u => !u.back && !u.mem).map(u => {
    const cx = u.x + u.w / 2, cy = u.y + u.h / 2, m = mem.reduce((b, q) => (Math.hypot(q.x + q.w / 2 - cx, q.y + q.h / 2 - cy) < Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy) ? q : b), mem[0]);
    return [[cx, cy], [m.x + (m.x > cx ? 0 : m.w), Math.max(m.y, Math.min(m.y + m.h, cy))]];
  }) : [];
  /* the pads: ten a side, on the die's edge */
  const padsAt = [];
  for (let s = 0; s < 4; s++) for (let i = 0; i < PADS; i++) {
    const a = 70 + (DIE - 140 - PAD) * i / (PADS - 1);
    padsAt.push(s === 0 ? { x: a, y: 14 } : s === 1 ? { x: DIE - 14 - PAD, y: a } : s === 2 ? { x: a, y: DIE - 14 - PAD } : { x: 14, y: a });
  }
  /* the camera's targets, one per level: the rectangle each frames */
  const c0 = cells[0], span = c0 ? { w: c0.w, h: c0.h } : { w: block.w / 6, h: block.h / 4 };
  const cx0 = c0 ? c0.x : block.x, cy0 = c0 ? c0.y : block.y;
  const right = mem.length ? Math.max(DIE, ...mem.map(m => m.x + m.w)) : DIE;
  const targets = {
    chip: { x: -20, y: -60, w: right + 40, h: DIE + 80 },
    block: { x: u0.x - 10, y: u0.y - 10, w: u0.w + 20, h: u0.h + 20 },
    gate: { x: cx0 - span.w * 1.2, y: cy0 - span.h * 2.2, w: span.w * 5.2, h: span.h * 6.4 },
    switch: { x: cx0 - span.w * 1.9, y: cy0 - span.h * 0.8, w: span.w * 3.2, h: span.h * 2.6 }
  };
  /* each level at most half as wide as the one above it, shrunk about the first cell (a design of two cells has wide
     cells: its gate level would otherwise frame more than its block) */
  const ax = cx0 + span.w / 2, ay = cy0 + span.h / 2;
  for (const [l, up] of [['gate', 'block'], ['switch', 'gate']]) {
    const r = targets[l], k = Math.min(1, targets[up].w * 0.5 / r.w);
    if (k < 1) targets[l] = { x: ax + (r.x - ax) * k, y: ay + (r.y - ay) * k, w: r.w * k, h: r.h * k };
  }
  return { shape, where, n, units, mem, memKind: M.kind, block, regs, ctl, cells, wires, pins, trips, pads: padsAt, targets, empty: !cells.length, broken: (D && D.broken) || null };
}

/* the level a scale stands at, and how far along the levels it is (0 = chip, 3 = switch), continuously: from the
   width each level's target asks for on a view of a given width */
export function levelAt(plan, scale, viewW) {
  const s = LEVELS.map(l => Math.log(viewW / plan.targets[l].w)), v = Math.log(scale);
  if (v <= s[0]) return { level: 'chip', pos: 0 };
  for (let i = 1; i < s.length; i++) if (v <= s[i]) { const f = (v - s[i - 1]) / (s[i] - s[i - 1]); return { level: LEVELS[f < 0.5 ? i - 1 : i], pos: i - 1 + f }; }
  return { level: 'switch', pos: LEVELS.length - 1 };
}
