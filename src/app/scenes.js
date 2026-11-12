/* The scenes of the dive, from Fable's world build (OSL-02), one per depth. Each is drawn in a 1000 x 1000
   space by draw(G), where G is the drawing helper from src/app/world.js. parts: the named shapes a
   question can light up ({ r: [x, y, w, h] } | { c: [x, y, r] } | { p: [[x, y], ...] }, with closed: true
   for an outline such as a box drawn in 2.5D). Labels are text
   names: part.<depth>.<key> in src/i18n/en.json. No words in this file.
   A data centre: building, rack, board, chip. A phone: phone, phoneboard, soc. A car: car, ecu, mcu.
   The journey's stations (crystal .. ship) are drawn in src/app/journey.js; inside the factory, a dive from
   the machine that prints with light: scanner, wafer, die.
   Every chip: block, gate, switch, atom.
   One picture all the way down: every scene draws the next depth's scene, small, inside its portal square
   (inside(G, id)), so the depth that fades in during the dive is the picture that was already there. */

import { DEPTHS, WORLDS } from '../data/weave.js';
import { START, model, dies, defects, hits, WAFER, dieSquare } from '../engines/chip.js';
import { rnd, clamp, poly, rr, blob, along2, closed } from './draw.js';
import { STATIONS, setJourneyChip } from './journey.js';
import { DESIGN_SCENES, designNow } from './design.js';
import { proj, kit, tones, mix } from './solid.js';

/* Your chip (src/engines/chip.js): the scenes that show it read its settings from here. */
let M = model(START);
let HITS = hits(START.size, START.gen), DIES = dies(START.size), SPECKS = defects(START.gen);
export const setChip = c => { M = model(c); HITS = hits(M.size, M.gen); DIES = dies(M.size); SPECKS = defects(M.gen); setJourneyChip(M, HITS, DIES); };
setJourneyChip(M, HITS, DIES);
/* "Build it": how far the switch has been made (null: finished) */
let BUILD = null;
export const BUILD_STEPS = 8;
export const setBuild = n => { BUILD = n == null || n >= BUILD_STEPS - 1 ? null : n; };
const heat = G => Math.max(0, Math.min(1, (M.power - 0.6) / 3));   /* 0 cool .. 1 very hot */

/* ---- the next depth, inside this one ---- */
/* a dive's next depth; on the journey's line there is no depth below, except the picture a station holds (inner) */
const NEXT = {}; WORLDS.filter(w => !w.line).forEach(w => w.depths.forEach((d, i) => { if (i + 1 < w.depths.length) NEXT[d] = w.depths[i + 1]; }));
Object.entries(DEPTHS).forEach(([d, v]) => { if (v.inner) NEXT[d] = v.inner; });
/* the wafer's portal follows your chip's size, as in src/app/ui.js */
const portalOf = id => (id === 'wafer' ? dieSquare(M.size) : DEPTHS[id].portal);
/* The side of the box the dive is drawn in, in screen pixels: line weights depend on it (world.js: k).
   world.js passes it as G.box; without it, it is read back from a scene drawn at a size where k is not
   clamped, and until then from the canvas. */
let BOX = 0, ROUGH = 800, NEST = 0;
function measure(G) {
  const cv = G.ctx.canvas, dpr = G.ctx.getTransform().a / G.s || 1;
  ROUGH = Math.min(cv.width, cv.height) / dpr;
  if (G.k > 0.3 && G.k < 1.5) BOX = (1000 * G.s) / G.k;
  if (BOX > ROUGH * 1.02) BOX = 0;
}
/* Draw the next depth's scene in this scene's portal: the same code, the same clock, the same line weights
   it will have when it fades in. Too small to see, it is left as a plain square. */
function inside(G, id) {
  const p = portalOf(id), next = SCENES[NEXT[id]], px = G.s * p[2], ctx = G.ctx, c = G.col;
  G.a(1);
  if (px < 9) { G.r(p[0], p[1], p[2], p[2], c.lo, c.line, 0.6); return; }
  /* As large as the dive's box, the next depth is the one being drawn there anyway (world.js draws it in
     full, on top): drawing it twice only costs time. */
  if (px > (G.box || BOX || ROUGH) * 0.9) return;
  const keep = { s: G.s, k: G.k, primary: G.primary, id: G.id };
  ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(p[2] / 1000, p[2] / 1000); ctx.beginPath(); ctx.rect(0, 0, 1000, 1000); ctx.clip();
  Object.assign(G, { s: px / 1000, k: clamp(px / (G.box || BOX || ROUGH), 0.3, 1.5), primary: false, id: NEXT[id] });
  NEST++; try { next.draw(G); } finally { NEST--; ctx.restore(); Object.assign(G, keep); }
  /* the same thin frame the dive draws around the depth you are in */
  ctx.save(); ctx.globalAlpha = 0.5 * G.base; ctx.strokeStyle = c.line; ctx.lineWidth = 1 / G.s; ctx.strokeRect(p[0], p[1], p[2], p[2]); ctx.restore();
}


/* ---- building: one hall of an AI data centre ---- */
/* ---- building: a data hall, cut open. Rows of racks face each other across cold aisles; the hot air
   behind them is closed in and carried off; cooling units line the left wall, the power room is through
   the wall on the right, and the plant that throws the heat away sits on the roof. You face the front row:
   the rack the dive follows is the one in the middle, and its front is the next depth. ---- */
const PB = proj({ s: 1.39, ox: -55.6, cx: 0, oy: 860 }), KB = kit(PB);
const ROWS = [[120, 1], [210, -1], [300, 1], [390, -1], [480, 1], [570, -1]];   /* [front y, which way it faces] */
const RACKX = [100, 460], RACKW = 20, RACKD = 30, RACKH = 48;
const hullB = pts3 => { const q = pts3.map(p => PB(p[0], p[1], p[2])).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of q.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return closed(lo.slice(0, -1).concat(up.slice(0, -1))); };
const boxHull = (x, y, z, w, d, h) => hullB([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]);
const CRAH = [130, 200, 270, 340, 410, 480].map(y => [16, y, 44, 58, 56]);
const building = {
  parts: { racks: ROWS.map(([y]) => boxHull(RACKX[0], y, 0, RACKX[1] - RACKX[0], RACKD, RACKH)), cooling: CRAH.map(u => boxHull(...u)).concat([boxHull(150, 572, 150, 316, 62, 52)]), power: [boxHull(550, 120, 0, 340, 460, 120)] },
  draw(G) {
    const c = G.col, T = tones(c), K = KB, hot = heat(G);
    G.bg(c.dark ? c.bg : mix(c.up, c.line, 0.12));
    /* the roof, cut back to show the hall; on it, the plant that throws the heat away */
    K.box(G, -200, 640, 0, 1500, 40, 150, { tone: 'base' });
    K.box(G, -200, 560, 150, 1500, 120, 6, { tone: 'base' });
    for (let i = 0; i < 3; i++) { const x = 150 + i * 108; K.box(G, x, 572, 156, 92, 62, 46, {}); for (let j = 0; j < 2; j++) { K.disc(G, x + 24 + j * 44, 603, 202, 16, T.base.top, T.edge); KB.line(G, [[x + 24 + j * 44 - 14, 603, 203], [x + 24 + j * 44 + 14, 603, 203]].map(q => q), T.seam, 0.6); }
      const sp = (G.t * (1 + hot * 3) + i) * 2; for (let j = 0; j < 2; j++) G.l([PB(x + 24 + j * 44 + Math.cos(sp) * 12, 603 + Math.sin(sp) * 12, 203), PB(x + 24 + j * 44 - Math.cos(sp) * 12, 603 - Math.sin(sp) * 12, 203)], T.edge, 0.9); }
    /* the floor: tiles over a space the cold air is pushed through */
    K.fill(G, [PB(-200, 0, 0), PB(1300, 0, 0), PB(1300, 640, 0), PB(-200, 640, 0)], c.dark ? mix(c.lo, c.mid, 0.35) : mix(c.mid, c.lo, 0.3));
    for (let x = -200; x <= 1300; x += 25) G.l([PB(x, 0, 0), PB(x, 640, 0)], T.seam, 0.4);
    for (let y = 0; y <= 640; y += 25) G.l([PB(-200, y, 0), PB(1300, y, 0)], T.seam, 0.4);
    K.fill(G, [PB(-200, 0, -16), PB(1300, 0, -16), PB(1300, 0, 0), PB(-200, 0, 0)], T.base.front, T.edge);
    for (let x = -190; x < 1300; x += 25) G.l([PB(x, 0, -16), PB(x, 0, -2)], T.seam, 0.8);
    /* the cooling units along the left wall, and the cold water pipes that feed them */
    CRAH.slice().reverse().forEach(([x, y, w, d, h], i) => {
      K.shadow(G, K.rectPlan(x, y, w, d), 0, 10);
      K.box(G, x, y, 0, w, d, h, {});
      for (let k = 0; k < 6; k++) G.l([PB(x + w, y + 6 + k * 8, 8), PB(x + w, y + 6 + k * 8, 30)], T.seam, 0.7);
      K.onSide(G, x + w, y + 8, 38, 20, 10, c.dark ? c.bg : c.lo, T.edge, 0.6);
      K.disc(G, x + w / 2, y + d / 2, h + 0.5, 12, T.base.top, T.edge);
      const a = G.t * 6 + i; G.l([PB(x + w / 2 + Math.cos(a) * 10, y + d / 2 + Math.sin(a) * 10, h + 1), PB(x + w / 2 - Math.cos(a) * 10, y + d / 2 - Math.sin(a) * 10, h + 1)], T.edge, 0.8);
    });
    /* the power room, through the wall on the right */
    K.box(G, 540, 110, 0, 10, 530, 120, { tone: 'base' });
    [[440, 'bat'], [330, 'ups'], [200, 'gear']].forEach(([y, kind]) => {
      K.shadow(G, K.rectPlan(580, y, 300, 34), 0, 8);
      K.box(G, 580, y, 0, 300, 34, kind === 'gear' ? 62 : 52, {});
      for (let k = 1; k < 10; k++) K.seamV(G, 580 + k * 30, y, 0, kind === 'gear' ? 62 : 52);
      for (let k = 0; k < 10; k++) K.onFront(G, 586 + k * 30, y, kind === 'gear' ? 44 : 36, 8, 4, kind === 'ups' && k < Math.round(M.power * 3) ? c.warm : kind === 'gear' ? c.grn : T.seam);
      if (kind === 'bat') for (let k = 0; k < 10; k++) for (let j = 0; j < 3; j++) K.onFront(G, 584 + k * 30, y, 6 + j * 14, 22, 10, null, T.seam, 0.6);
    });
    /* the rows, back to front: racks, the closed hot aisle between each pair, cable trays above */
    for (let r = ROWS.length - 1; r >= 0; r--) {
      const [y, face] = ROWS[r];
      if (face < 0) {
        /* a hot aisle: closed in with a roof and doors, the heat drawn off above */
        const y0 = ROWS[r - 1][0] + RACKD, y1 = y;
        K.box(G, RACKX[0] - 4, y0, 0, 4, y1 - y0, RACKH + 2, { tone: 'base' });
        K.fill(G, [PB(RACKX[0], y0, RACKH + 2), PB(RACKX[1], y0, RACKH + 2), PB(RACKX[1], y1, RACKH + 2), PB(RACKX[0], y1, RACKH + 2)], mix(T.body.top, c.warm, 0.08 + 0.4 * hot), T.edge, 0.7);
        for (let x = RACKX[0] + 40; x < RACKX[1]; x += 40) G.l([PB(x, y0, RACKH + 2), PB(x, y1, RACKH + 2)], T.seam, 0.6);
        G.a(0.1 + 0.5 * hot); for (let k = 0; k < 8; k++) { const u = (G.t * 0.4 + k / 8) % 1, q = PB(RACKX[0] + 30 + k * 60, (y0 + y1) / 2, RACKH + 4 + u * 50); G.l([q, [q[0] + 3, q[1] - 10]], c.warm, 1.2); } G.a(1);
      }
      K.shadow(G, K.rectPlan(RACKX[0], y, RACKX[1] - RACKX[0], RACKD), 0, 8);
      for (let x = RACKX[1] - RACKW; x >= RACKX[0]; x -= RACKW) {
        const front = face > 0;
        K.box(G, x, y, 0, RACKW, RACKD, RACKH, {});
        if (front) {
          K.onFront(G, x + 2, y, 3, RACKW - 4, RACKH - 6, mix(T.body.front, c.bg, c.dark ? 0.35 : 0.1), T.seam, 0.6);
          if (G.s * 4 > 1.5) for (let k = 0; k < 6; k++) K.onFront(G, x + 3, y, 6 + k * 7, RACKW - 6, 4, null, T.seam, 0.5);
          K.onFront(G, x + RACKW - 5, y, RACKH - 8, 2, 2, rnd(x, r + Math.floor(G.t * 2)) > 0.25 ? c.grn : c.warm);
        }
      }
      K.box(G, RACKX[1], y, 0, 26, RACKD, RACKH, { tone: 'base' });
      K.onFront(G, RACKX[1] + 4, y, RACKH - 14, 8, 6, c.warm);
      /* the cable tray and the power busway above the row */
      K.box(G, RACKX[0], y + 8, RACKH + 14, RACKX[1] - RACKX[0], 12, 3, { tone: { top: mix(T.body.top, c.warm, 0.25), front: mix(T.body.front, c.warm, 0.25), side: mix(T.body.side, c.warm, 0.2) } });
      K.box(G, RACKX[0], y + 22, RACKH + 20, RACKX[1] - RACKX[0], 5, 5, { tone: 'base' });
    }
    /* cold air rising out of the floor in front of each row */
    G.a(0.35); [60, 240, 420].forEach(y => { for (let k = 0; k < 8; k++) { const u = (G.t * 0.35 + k / 8) % 1, q = PB(RACKX[0] + 20 + k * 44, y + 30, u * 40); G.l([q, [q[0], q[1] - 6]], c.cool, 1.2); } }); G.a(1);
    /* the rack the dive follows: the next depth is its front */
    inside(G, 'building');
    KB.person(G, 170, 70, 0.3);
  }
};

/* ---- rack: two metres tall ---- */
const sleds = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ r: [330, 130 + i * 80, 340, 68] }));
const rack = {
  parts: { servers: sleds, switch: [{ r: [330, 66, 340, 50] }], power: [{ r: [330, 862, 340, 66] }], cooling: [{ r: [272, 60, 16, 880] }, { r: [712, 60, 16, 880] }] },
  draw(G) {
    const c = G.col, T = tones(c);
    /* as it stands in the hall: the tops of the row above it, the floor below, its neighbours either side */
    G.bg(T.body.top);
    G.r(0, 960, 1000, 40, c.dark ? mix(c.lo, c.mid, 0.35) : mix(c.mid, c.lo, 0.3));
    [-100, 700].forEach(x0 => {
      G.r(x0, 40, 400, 920, T.body.front, T.edge, 1.2);
      G.r(x0 + 40, 100, 320, 800, mix(T.body.front, c.bg, c.dark ? 0.35 : 0.1), T.seam, 1);
      for (let k = 0; k < 6; k++) G.r(x0 + 60, 160 + k * 140, 280, 80, null, T.seam, 1);
      G.r(x0 + 300, 120, 40, 40, c.grn);
    });
    G.r(300, 40, 400, 920, c.mid, c.hi, 1.8);
    G.r(320, 56, 360, 888, c.lo, c.line, 1);
    G.r(272, 60, 16, 880, c.cool); G.r(712, 60, 16, 880, c.warm);
    G.r(330, 66, 340, 50, c.up, c.line, 1.2);
    for (let i = 0; i < 16; i++) G.r(342 + i * 20, 82, 12, 12, rnd(i, Math.floor(G.t * 3)) > 0.4 ? c.cool : c.dim);
    sleds.forEach((sl, i) => {
      const y = sl.r[1];
      G.l([[288, y + 20], [330, y + 20]], c.cool, 1.4); G.l([[670, y + 48], [712, y + 48]], c.warm, 1.4);
      G.r(330, y, 340, 68, c.up, c.line, 1.2);
      for (let k = 0; k < 9; k++) G.l([[344 + k * 11, y + 10], [344 + k * 11, y + 58]], c.dim, 1);
      G.r(540, y + 10, 50, 48, c.mid, c.line, 0.9); G.r(596, y + 10, 50, 48, c.mid, c.line, 0.9);
      /* the board in every server; the one the dive follows is drawn whole */
      if (i !== 4) { G.r(468, y + 2, 64, 64, c.lo, c.dim, 0.8); G.r(471, y + 9, 58, 50, c.mid, c.dim, 0.7); G.r(490, y + 24, 20, 20, c.up, c.line, 0.8); }
      G.r(652, y + 12, 8, 8, rnd(i, Math.floor(G.t * 2)) > 0.3 ? c.cool : c.dim); G.r(652, y + 26, 8, 8, c.warm);
      G.l([[676, 96 + i * 2], [684 + i * 2, 96 + i * 2], [684 + i * 2, y + 36], [670, y + 36]], c.line, 0.8);
    });
    inside(G, 'rack');
    G.r(330, 862, 340, 66, c.up, c.line, 1.2);
    for (let i = 0; i < 4; i++) G.r(340 + i * 83, 872, 72, 46, c.mid, c.warm, 1);
    G.a(0.15 + 0.6 * heat(G)); for (let i = 0; i < 4; i++) G.r(346 + i * 83, 878, 60, 34, c.warm); G.a(1);
    G.label('switch', 742, 96); G.label('servers', 742, 300); G.label('power', 742, 900); G.label('cooling', 258, 150, 'right');
  }
};

/* ---- board: a large accelerator chip, with memory and power around it ---- */
const mem = []; for (let i = 0; i < 4; i++) { mem.push({ r: [345 + i * 82, 226, 64, 86] }); mem.push({ r: [345 + i * 82, 688, 64, 86] }); }
const traces = []; mem.forEach((m, k) => { for (let j = 0; j < 3; j++) { const x = m.r[0] + 14 + j * 18, top = k % 2 === 0; traces.push({ p: [[x, top ? 312 : 688], [x, top ? 350 : 650]] }); } });
const board = {
  parts: { bigchip: [{ r: [350, 350, 300, 300] }], memory: mem, power: [{ r: [130, 236, 190, 530] }], traces, connectors: [{ r: [220, 858, 560, 32] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(50, 110, 900, 780, c.mid, c.hi, 1.6);
    [[80, 140], [920, 140], [80, 860], [920, 860]].forEach(h => G.c(h[0], h[1], 12, c.lo, c.line, 1));
    for (let i = 0; i < 6; i++) {
      const y = 250 + i * 86;
      G.r(142, y, 78, 62, c.up, c.line, 1.1); G.r(236, y + 6, 52, 50, c.lo, c.warm, 1.1);
      G.l([[288, y + 31], [320, y + 31], [320, 380 + i * 48], [350, 380 + i * 48]], c.warm, 1.6);
    }
    traces.forEach(tr => G.l(tr.p, c.cool, 1.1));
    mem.forEach(m => { G.r(m.r[0], m.r[1], m.r[2], m.r[3], c.up, c.line, 1.2); G.r(m.r[0] + 8, m.r[1] + 10, m.r[2] - 16, m.r[3] - 20, c.lo, c.dim, 0.8); });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) G.r(720 + i * 28, 250 + j * 56, 14, 26, c.up, c.dim, 0.8);
    /* your chip's heat, spreading from the big chip */
    for (let k = 3; k >= 1; k--) { G.a((0.05 + 0.18 * heat(G)) / k); const e = 18 * k * (0.6 + heat(G)); G.r(350 - e, 350 - e, 300 + 2 * e, 300 + 2 * e, c.warm); }
    G.a(1);
    G.r(350, 350, 300, 300, c.up, c.hi, 1.6);
    for (let i = 0; i < 14; i++) { G.r(360 + i * 20, 358, 8, 8, c.line); G.r(360 + i * 20, 634, 8, 8, c.line); G.r(358, 380 + i * 18, 8, 8, c.line); G.r(634, 380 + i * 18, 8, 8, c.line); }
    inside(G, 'board');
    G.r(220, 858, 560, 32, c.up, c.line, 1.1);
    for (let i = 0; i < 40; i++) G.l([[228 + i * 14, 862], [228 + i * 14, 886]], c.warm, 1.4);
    G.label('bigchip', 350, 340); G.label('memory', 345, 216); G.label('power', 142, 240);
  }
};

/* ---- chip: compute blocks, memory, input and output, and the clock wires ---- */
/* the cores that fit depend on your chip's switch size */
const coreGrid = (cols, rows) => { const w = 740 / cols, h = 470 / rows, g = Math.min(14, w * 0.08), out = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ r: [130 + i * w + g / 2, 130 + j * h + g / 2, w - g, h - g] }); return out; };
const GRID_CACHE = {};
const cores = () => { const k = M.grid.join('x'); return GRID_CACHE[k] || (GRID_CACHE[k] = coreGrid(M.grid[0], M.grid[1])); };
function drawCores(G) {
  const c = G.col, tick = Math.floor(G.t * 1.5 * M.clock);
  cores().forEach((k, n) => {
    const r = k.r, m = Math.min(r[2], r[3]) * 0.07;
    G.r(r[0], r[1], r[2], r[3], c.up, c.line, 1.2);
    G.r(r[0] + m, r[1] + m, r[2] * 0.52, r[3] * 0.5, c.mid, c.dim, 0.9);
    G.r(r[0] + r[2] * 0.6, r[1] + m, r[2] * 0.4 - m, r[3] * 0.3, c.mid, c.dim, 0.9);
    G.r(r[0] + r[2] * 0.6, r[1] + r[3] * 0.4, r[2] * 0.4 - m, r[3] * 0.6 - m, c.lo, c.dim, 0.9);
    G.r(r[0] + m, r[1] + r[3] * 0.62, r[2] * 0.52, r[3] * 0.38 - m, c.lo, c.dim, 0.9);
    if (rnd(n, tick) > 0.55) { G.a(0.5); G.r(r[0] + m, r[1] + m, r[2] * 0.52, r[3] * 0.5, c.cool); G.a(1); }
    if (rnd(n + 50, tick) < M.late) { G.a(0.55); G.r(r[0], r[1], r[2], r[3], c.red); G.a(1); }
  });
}
const clock = [{ p: [[500, 136], [500, 594]] }, { p: [[315, 365], [685, 365]] }, { p: [[315, 208], [315, 522]] }, { p: [[685, 208], [685, 522]] }];
const chip = {
  get parts() { return { cores: cores(), cache: [{ r: [130, 620, 740, 100] }], io: [{ r: [130, 740, 740, 90] }], clock }; },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(40, 40, 920, 920, c.mid, c.hi, 1.8);
    for (let i = 0; i < 22; i++) { const t = 78 + i * 39; G.r(t, 56, 24, 24, c.lo, c.line, 0.9); G.r(t, 920, 24, 24, c.lo, c.line, 0.9); G.r(56, t, 24, 24, c.lo, c.line, 0.9); G.r(920, t, 24, 24, c.lo, c.line, 0.9); }
    G.r(112, 112, 776, 776, c.lo, c.line, 1);
    drawCores(G);   /* your chip's cores; signals that arrive after the tick turn red */
    clock.forEach(k => G.l(k.p, c.warm, 1.3));
    /* the clock's tick travelling along its wires, faster with your clock */
    clock.forEach((k, i) => { const u = (G.t * 0.6 * M.clock + i * 0.25) % 1, a = k.p[0], b = k.p[1]; G.r(a[0] + (b[0] - a[0]) * u - 5, a[1] + (b[1] - a[1]) * u - 5, 10, 10, c.warm); });
    for (let i = 0; i < 6; i++) { const x = 136 + i * 123; G.r(x, 626, 113, 88, c.up, c.line, 1); for (let k = 1; k < 8; k++) G.l([[x + k * 14, 630], [x + k * 14, 710]], c.dim, 0.7); }
    for (let i = 0; i < 8; i++) G.r(136 + i * 92, 746, 82, 78, c.mid, c.line, 1);
    inside(G, 'chip');
    G.label('cores', 136, 126); G.label('cache', 136, 612); G.label('io', 136, 846); G.label('clock', 508, 380);
  }
};

/* ---- block: rows of standard cells, a memory array, and the wires over them ---- */
const cellRows = []; for (let i = 0; i < 12; i++) cellRows.push({ r: [40, 66 + i * 74, 584, 48] });
const wires = [];
for (let i = 0; i < 9; i++) { const y0 = 90 + Math.floor(rnd(i, 1) * 11) * 74, y1 = 90 + Math.floor(rnd(i, 2) * 11) * 74, x0 = 60 + rnd(i, 3) * 380, xm = 470 + rnd(i, 4) * 150; wires.push({ p: [[x0, y0], [xm, y0], [xm, y1], [i % 2 ? 660 : x0 + 80, y1]] }); }
const block = {
  parts: { cells: cellRows, sram: [{ r: [660, 60, 300, 560] }], wires, yours: [{ r: [40, 190, 584, 136] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    for (let i = 0; i < 12; i++) {
      const y = 60 + i * 74;
      G.l([[40, y], [624, y]], c.warm, 1.4); G.l([[40, y + 60], [624, y + 60]], c.cool, 1.4);
      let x = 44, n = 0;
      while (x < 600) {
        let w = Math.max(10, Math.round((22 + Math.floor(rnd(i, n) * 44)) * Math.min(1.8, M.s)));
        if (i === 5 && x < 300 && x + w > 296) w = 296 - x;
        if (i === 5 && Math.abs(x - 300) < 5) { x = 300; w = 44; }
        if (x + w > 620) w = 620 - x;
        const mine = i === 5 && x === 300;
        if (w > 8) { G.r(x, y + 8, w, 44, mine ? c.up : c.mid, mine ? c.hi : c.line, 0.9); if (w > 20) { G.l([[x + 6, y + 20], [x + w - 6, y + 20]], c.dim, 0.8); G.l([[x + 6, y + 40], [x + w - 6, y + 40]], c.dim, 0.8); } }
        x += w + 4; n++;
      }
    }
    G.r(660, 60, 300, 560, c.mid, c.hi, 1.3);
    for (let i = 0; i < 14; i++) for (let j = 0; j < 27; j++) G.r(670 + i * 20, 70 + j * 20, 14, 14, rnd(i * 31 + j, Math.floor(G.t * 1.2)) > 0.86 ? c.cool : c.up, null);
    G.r(660, 650, 300, 290, c.mid, c.line, 1.2);
    G.r(680, 672, 120, 110, c.up, c.dim, 1); G.r(820, 672, 120, 250, c.up, c.dim, 1); G.r(680, 800, 120, 122, c.lo, c.dim, 1);
    G.a(0.75); wires.forEach(w => G.l(w.p, c.cool, 1.3)); G.a(1);
    /* your design (the design studio): cells like these, as many as it became, outlined in two rows */
    const D = designNow(), n = D && D.M ? Math.min(40, D.M.cells.length * (D.p === 'core' ? 32 : 1)) : 0;
    if (n) { const w = Math.min(584, 40 + n * 26); G.ctx.setLineDash([6 / G.s, 5 / G.s]); G.r(40, 196, w, 128, null, c.warm, 1.8); G.ctx.setLineDash([]); G.a(0.12); G.r(40, 196, w, 128, c.warm); G.a(1); }
    inside(G, 'block');
    G.label('cells', 44, 52); G.label('sram', 660, 50); G.label('wires', 480, 968); if (n) G.label('yours', 44, 190);
  }
};

/* ---- gate: one logic gate, drawn as its layers. Green: where current flows; red: gates; blue: metal ---- */
const gate = {
  parts: {
    gates: [{ r: [380, 150, 60, 700] }, { r: [560, 150, 60, 700] }],
    diff: [{ r: [200, 220, 600, 150] }, { r: [200, 630, 600, 150] }],
    metal: [{ r: [120, 90, 760, 56] }, { r: [120, 854, 760, 56] }, { r: [690, 250, 50, 470] }]
  },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    for (let i = 1; i < 20; i++) { G.l([[i * 50, 0], [i * 50, 1000]], c.dim, 0.4); G.l([[0, i * 50], [1000, i * 50]], c.dim, 0.4); }
    G.a(0.5); G.r(200, 220, 600, 150, c.grn); G.r(200, 630, 600, 150, c.grn); G.a(1);
    G.r(200, 220, 600, 150, null, c.grn, 1.5); G.r(200, 630, 600, 150, null, c.grn, 1.5);
    G.a(0.45); [[120, 90, 760, 56], [120, 854, 760, 56], [690, 250, 50, 470], [240, 146, 44, 110], [476, 146, 44, 110], [240, 744, 44, 110]].forEach(m => G.r(m[0], m[1], m[2], m[3], c.cool)); G.a(1);
    [[120, 90, 760, 56], [120, 854, 760, 56], [690, 250, 50, 470]].forEach(m => G.r(m[0], m[1], m[2], m[3], null, c.cool, 1.3));
    G.a(0.62); G.r(380, 150, 60, 700, c.red); G.r(560, 150, 60, 700, c.red); G.a(1);
    G.r(380, 150, 60, 700, null, c.red, 1.5); G.r(560, 150, 60, 700, null, c.red, 1.5);
    [[250, 240], [486, 240], [702, 262], [250, 680], [702, 680], [702, 330], [250, 310]].forEach(k => G.r(k[0], k[1], 26, 26, c.hi));
    const u = (G.t * 0.35) % 1;
    G.r(708, 250 + u * 440, 14, 14, c.warm);
    inside(G, 'gate');
    /* your chip's timing: the slowest signal racing the tick */
    const X = v => 140 + v * 340, late = M.path > M.tick, sig = Math.min(1, ((G.t * 0.4) % 1.25)) * M.path;
    G.l([[140, 960], [880, 960]], c.line, 1);
    G.r(X(M.tick) - 2, 930, 4, 60, c.warm);
    G.r(140, 954, X(sig) - 140, 12, late && sig > M.tick ? c.red : c.grn);
    G.label('gates', 452, 500); G.label('diff', 208, 400); G.label('metal', 128, 80);
    G.label('tick', X(M.tick) + 8, 940); G.label('signal', 140, 990);
  }
};

/* ---- switch: one transistor in cross-section: a gate wrapped around thin sheets of silicon ---- */
const sheets = [400, 520, 640].map(y => ({ r: [340, y, 320, 50] }));
const skins = [400, 520, 640].map(y => ({ r: [390, y - 8, 220, 66] }));
const swtch = {
  parts: { gate: [{ r: [390, 300, 220, 500] }], channel: sheets, oxide: skins, source: [{ r: [110, 340, 235, 460] }], drain: [{ r: [655, 340, 235, 460] }] },
  draw(G) {
    const c = G.col, b = BUILD == null ? BUILD_STEPS - 1 : BUILD;
    G.bg(c.lo);
    /* 0: the silicon underneath */
    G.r(0, 800, 1000, 200, c.mid, null);
    G.l([[0, 800], [1000, 800]], c.line, 1.2);
    /* 1-2: a stack of thin layers grown on top, then cut down to a narrow stack */
    if (b >= 1 && b <= 4) {
      const x0 = b === 1 ? 110 : 340, x1 = b === 1 ? 890 : 660;
      [400, 520, 640].forEach(y => { G.a(0.6); G.r(x0, y, x1 - x0, 50, c.grn); G.a(1); G.r(x0, y, x1 - x0, 50, null, c.grn, 1.1); });
      [450, 570, 690].forEach(y => G.r(x0, y, x1 - x0, 70, c.up, c.dim, 0.9));
      G.r(x0, 760, x1 - x0, 40, c.up, c.dim, 0.9);
    }
    /* 3-4: a placeholder gate holds the shape while the source and drain grow on either side */
    if (b >= 3) { G.r(345, 300, 45, 500, c.mid, c.line, 1); G.r(610, 300, 45, 500, c.mid, c.line, 1); }
    if (b === 3 || b === 4) { G.a(0.7); G.r(390, 300, 220, 500, c.dim); G.a(1); G.r(390, 300, 220, 500, null, c.line, 1.2); }
    if (b >= 4) { G.r(110, 340, 235, 460, c.up, c.hi, 1.4); G.r(655, 340, 235, 460, c.up, c.hi, 1.4); }
    /* 5: the placeholder and the layers between the sheets are dissolved away, leaving sheets in the air */
    if (b === 5) sheets.forEach(sh => { G.a(0.6); G.r(sh.r[0], sh.r[1], sh.r[2], sh.r[3], c.grn); G.a(1); G.r(sh.r[0], sh.r[1], sh.r[2], sh.r[3], null, c.grn, 1.3); });
    /* 6: a thin insulating skin and the real gate wrap every sheet */
    if (b >= 6) {
      G.a(0.5); G.r(390, 300, 220, 500, c.red); G.a(1); G.r(390, 300, 220, 500, null, c.red, 1.5);
      skins.forEach(k => G.r(k.r[0], k.r[1], k.r[2], k.r[3], c.lo, c.warm, 1.6 * Math.min(1.6, M.s)));
      sheets.forEach((sh, i) => {
        G.a(0.6); G.r(sh.r[0], sh.r[1], sh.r[2], sh.r[3], c.grn); G.a(1); G.r(sh.r[0], sh.r[1], sh.r[2], sh.r[3], null, c.grn, 1.3);
        if (b === BUILD_STEPS - 1) for (let k = 0; k < 3; k++) { const x = 340 + (((G.t * 0.28 + k / 3 + i * 0.17) % 1) * 320); G.r(x - 5, sh.r[1] + 20, 10, 10, c.hi); }
      });
    }
    /* the atoms of one sheet, once there is a sheet */
    if (b >= 1) inside(G, 'switch');
    /* 7: metal contacts reach down to connect it */
    if (b >= 7) {
      G.a(0.45); G.r(180, 150, 90, 190, c.cool); G.r(730, 150, 90, 190, c.cool); G.r(465, 120, 70, 180, c.cool); G.a(1);
      G.r(180, 150, 90, 190, null, c.cool, 1.2); G.r(730, 150, 90, 190, null, c.cool, 1.2); G.r(465, 120, 70, 180, null, c.cool, 1.2);
      /* your chip: current slipping through the thinner walls */
      const leaks = Math.round(2 * M.wall);
      for (let n = 0; n < leaks; n++) { const k = skins[n % 3].r, x = 400 + rnd(n, 7) * 200, u = (G.t * 0.7 + rnd(n, 9)) % 1; G.c(x, k[1] + 4 - u * 40, 5, c.red); }
      G.label('gate', 470, 290); G.label('channel', 668, 560); G.label('source', 120, 330); G.label('drain', 880, 330, 'right'); G.label('oxide', 400, 386);
    }
  }
};

/* ---- atom: silicon atoms in a crystal, an added atom, an oxide wall, electrons moving through ---- */
const pos = (r, k) => [80 + k * 95 + (r % 2) * 47, 210 + r * 95];
const atom = {
  parts: { lattice: [{ r: [40, 170, 920, 790] }], dopant: [{ c: [507, 495, 44] }], electrons: [{ r: [40, 452, 920, 86] }], boundary: [{ r: [0, 0, 1000, 150] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(0, 0, 1000, 150, c.mid, null);
    G.l([[0, 150], [1000, 150]], c.warm, 1.4);
    for (let i = 0; i < 26; i++) { const x = 20 + i * 39 + rnd(i, 5) * 14, y = 34 + rnd(i, 6) * 86; G.c(x, y, i % 3 ? 13 : 19, i % 3 ? c.up : c.lo, i % 3 ? c.warm : c.line, 1); }
    for (let r = 0; r < 8; r++) for (let k = 0; k < 10; k++) {
      const p = pos(r, k);
      if (p[0] > 960) continue;
      if (r < 7) [k + (r % 2), k + (r % 2) - 1].forEach(n => { if (n < 0 || n > 9) return; const q = pos(r + 1, n); if (q[0] <= 960) G.l([p, q], c.line, 1.5); });
    }
    for (let r = 0; r < 8; r++) for (let k = 0; k < 10; k++) {
      const p = pos(r, k);
      if (p[0] > 960) continue;
      const dop = r === 3 && k === 4;
      G.c(p[0], p[1], dop ? 27 : 23, dop ? c.mid : c.up, dop ? c.warm : c.hi, dop ? 2 : 1.2);
      G.c(p[0] - 7, p[1] - 7, 5, c.lo);
    }
    /* your chip: electrons slipping through the wall, more as it gets thinner */
    const through = Math.round(1.5 * M.wall);
    for (let n = 0; n < through; n++) { const x = 60 + rnd(n, 21) * 880, u = (G.t * 0.5 + rnd(n, 22)) % 1; G.c(x, 200 - u * 170, 6, c.red); }
    for (let i = 0; i < 11; i++) {
      const x = ((G.t * 70 + i * 97) % 1000), y = 258 + (i % 7) * 95 + Math.sin(G.t * 2 + i) * 16;
      G.c(x, y, 6.5, c.cool); G.c(x, y, 2.4, c.dark ? '#fff' : c.lo);
    }
    G.label('boundary', 20, 142); G.label('dopant', 544, 470); G.label('lattice', 60, 968);
  }
};


const flipY = pts => pts.map(p => [p[0], 1000 - p[1]]);
/* the pads around the edge of a die */
const pads = (G, n) => { const c = G.col, step = 836 / n; for (let i = 0; i < n; i++) { const t = 82 + i * step + step * 0.2, w = step * 0.6; G.r(t, 56, w, 24, c.lo, c.line, 0.9); G.r(t, 920, w, 24, c.lo, c.line, 0.9); G.r(56, t, 24, w, c.lo, c.line, 0.9); G.r(920, t, 24, w, c.lo, c.line, 0.9); } };
/* a core's inside: its logic, its small memories */
function coreInside(G, r, m) {
  const c = G.col;
  G.r(r[0] + m, r[1] + m, r[2] * 0.52, r[3] * 0.5, c.mid, c.dim, 0.9);
  G.r(r[0] + r[2] * 0.6, r[1] + m, r[2] * 0.4 - m, r[3] * 0.3, c.mid, c.dim, 0.9);
  G.r(r[0] + r[2] * 0.6, r[1] + r[3] * 0.4, r[2] * 0.4 - m, r[3] * 0.6 - m, c.lo, c.dim, 0.9);
  G.r(r[0] + m, r[1] + r[3] * 0.62, r[2] * 0.52, r[3] * 0.38 - m, c.lo, c.dim, 0.9);
}
/* a block of memory: a grid of cells, some of them changing */
function cells(G, x, y, w, h, nx, ny, seed, live) {
  const c = G.col, sx = w / nx, sy = h / ny;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) G.r(x + i * sx, y + j * sy, sx * 0.74, sy * 0.74, live != null && rnd(i * 37 + j + seed, live) > 0.84 ? c.cool : rnd(i * 37 + j, seed) > 0.35 ? c.up : c.lo, null);
}

/* ======== things lying flat, seen from above: a phone with its back off, a car with its roof off ========
   The plane they lie in faces you, true to shape (so a dive can zoom straight into it); what stands up from
   it rises towards you, so its sides show below and to the left, in the same 2.5D view as the rest of the
   site. lift(h) shifts a drawing to the height h; walls(...) joins an outline on the floor to the same
   outline at height h; layer offsets show what lies behind (further away: up and to the right). */
const LX = 0.42, LY = 0.5;
const lifted = (G, h, fn) => { const c = G.ctx; c.save(); c.translate(-LX * h, LY * h); try { fn(); } finally { c.restore(); } };
function walls(G, pts, h, T) {
  const n = pts.length, q = pts.map(p => [p[0] - LX * h, p[1] + LY * h]);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1];
    if (ey * LX + ex * LY > 0) continue;          /* only the sides that show: those up and to the right */
    const sh = Math.max(0, Math.min(1, 0.5 + 0.5 * (ex + ey) / (Math.hypot(ex, ey) || 1)));
    poly(G, [a, b, q[(i + 1) % n], q[i]], mix(T.body.side, T.body.front, sh), T.edge, 0.6);
  }
}
const rrPts = (x, y, w, h, r, n) => { const out = [], k = n || 6, C = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  C.forEach(([cx, cy, a0]) => { for (let i = 0; i <= k; i++) { const a = a0 + (i / k) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }); return out; };
const shift = (pts, d) => pts.map(p => [p[0] + LX * d, p[1] - LY * d]);

/* ======== a phone ======== */

/* ---- phone: the back opened, about fifteen centimetres tall: the main board, the battery, the camera ---- */
const PS = 0.7, POX = -70, POY = 282;   /* the phone is drawn smaller, at the lower left, so what lies behind it shows */
const pr = r => [POX + r[0] * PS, POY + r[1] * PS, r[2] * PS, r[3] * PS];
const phone = {
  parts: { board: [{ r: pr([380, 70, 300, 300]) }], battery: [{ r: pr([310, 400, 380, 430]) }], camera: [{ r: pr([300, 74, 68, 160]) }], antenna: [{ r: pr([316, 30, 368, 14]) }, { r: pr([316, 956, 368, 14]) }] },
  draw(G) {
    const c = G.col, T = tones(c), body = rrPts(270, 30, 460, 940, 50);
    G.bg(c.lo);
    G.ctx.save(); G.ctx.translate(POX, POY); G.ctx.scale(PS, PS); const s0 = G.s; G.s = s0 * PS;
    /* taken apart, behind it: the screen at the back, then the frame that holds everything */
    const scr = shift(body, 800), frm = shift(body, 400);
    walls(G, scr, 16, T); poly(G, scr, c.dark ? c.bg : mix(c.line, c.hi, 0.55), T.edge, 1.2);
    G.a(0.1); poly(G, shift([[300, 60], [560, 60], [300, 520]], 800), c.hi); G.a(1);
    poly(G, shift(rrPts(300, 50, 400, 890, 36), 800), null, T.seam, 1);
    walls(G, frm, 12, T); poly(G, frm, T.body.top, T.edge, 1.2);
    poly(G, shift(rrPts(310, 400, 380, 430, 14), 400), T.inner.top, T.edge, 0.8);
    poly(G, shift(rrPts(300, 74, 68, 160, 14), 400), T.inner.top, T.edge, 0.8);
    poly(G, shift(rrPts(380, 70, 300, 300, 10), 400), null, T.seam, 0.8);
    rr(G, 270, 30, 460, 940, 50, c.mid, c.hi, 1.8);
    rr(G, 290, 50, 420, 900, 32, c.lo, c.line, 1);
    /* the frame is the antenna, cut into bands; each band is fed from the board */
    [30, 956].forEach(y => { G.r(316, y, 368, 14, c.up, c.warm, 1); [400, 594].forEach(x => G.r(x, y - 1, 6, 16, c.lo)); });
    [[270, 210], [710, 210], [270, 784], [710, 784]].forEach(k => G.r(k[0], k[1], 20, 6, c.lo));
    G.l([[440, 44], [440, 70]], c.warm, 1.2); G.l([[620, 44], [620, 70]], c.warm, 1.2); G.l([[500, 956], [500, 940]], c.warm, 1.2);
    /* the camera: two lenses and a flash, standing up from the frame, on a ribbon to the board */
    walls(G, rrPts(300, 74, 68, 160, 14), 26, T);
    lifted(G, 26, () => {
      rr(G, 300, 74, 68, 160, 14, c.mid, c.line, 1.1);
      [112, 196].forEach(y => { G.c(334, y, 25, c.up, c.hi, 1.2); G.c(334, y, 17, c.lo, c.line, 0.8); G.c(334, y, 9, c.mid, c.cool, 1); G.c(328, y - 6, 2.6, c.hi); });
      G.c(334, 154, 6, c.lo, c.warm, 1);
    });
    G.r(368, 140, 12, 28, c.up, c.warm, 0.8);
    /* the card tray under it */
    rr(G, 300, 272, 68, 98, 8, c.mid, c.line, 1);
    G.r(312, 290, 44, 62, c.up, c.warm, 0.8); G.l([[334, 290], [334, 352]], c.warm, 0.7); G.l([[312, 321], [356, 321]], c.warm, 0.7);
    /* the battery, with its charge, and the charging coil lying on it */
    walls(G, rrPts(310, 400, 380, 430, 10), 18, T);
    G.ctx.save(); G.ctx.translate(-LX * 18, LY * 18);
    rr(G, 310, 400, 380, 430, 10, c.up, c.line, 1.2);
    G.r(330, 420, 340, 390, c.mid, c.dim, 0.8);
    const lvl = Math.max(0.06, Math.min(0.95, 0.55 * Math.sqrt(M.battery))) + 0.03 * Math.sin(G.t * 0.4);
    G.a(0.35); G.r(330, 420 + 390 * (1 - lvl), 340, 390 * lvl, c.grn); G.a(1);
    G.l([[330, 420 + 390 * (1 - lvl)], [670, 420 + 390 * (1 - lvl)]], c.grn, 1.2);
    [150, 136, 122, 108, 94].forEach(r => G.c(500, 615, r, null, c.dim, 1));
    G.l([[500, 521], [500, 400]], c.dim, 1);
    G.ctx.restore();
    G.r(470, 386, 60, 14, c.mid, c.line, 0.9); G.r(488, 370, 24, 16, c.up, c.warm, 0.8);
    /* speaker, port, and the motor that taps */
    rr(G, 306, 852, 130, 84, 8, c.mid, c.line, 1);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) G.c(323 + i * 16, 874 + j * 20, 3.2, c.dim);
    rr(G, 564, 852, 130, 84, 8, c.mid, c.line, 1); G.r(580, 868, 98, 52, c.up, c.dim, 0.8);
    for (let k = 0; k < 5; k++) G.l([[593 + k * 18, 874], [593 + k * 18, 914]], c.warm, 0.9);
    G.r(452, 896, 96, 44, c.mid, c.line, 1); for (let i = 0; i < 8; i++) G.l([[462 + i * 11, 904], [462 + i * 11, 932]], c.warm, 1);
    [[302, 386], [698, 386], [302, 842], [698, 842]].forEach(k => G.c(k[0], k[1], 5, c.lo, c.line, 0.9));
    /* the main board: the next depth, as it is */
    /* the rim of the open case, rising towards you */
    const rim = body.map(p => [p[0] - LX * 30, p[1] + LY * 30]), inn = rrPts(286, 46, 428, 908, 36).map(p => [p[0] - LX * 30, p[1] + LY * 30]);
    walls(G, body, 30, T);
    G.ctx.beginPath(); rim.forEach((q, i) => (i ? G.ctx.lineTo(q[0], q[1]) : G.ctx.moveTo(q[0], q[1]))); G.ctx.closePath(); inn.forEach((q, i) => (i ? G.ctx.lineTo(q[0], q[1]) : G.ctx.moveTo(q[0], q[1]))); G.ctx.closePath();
    G.ctx.fillStyle = T.body.top; G.ctx.fill('evenodd'); G.ctx.strokeStyle = T.edge; G.ctx.lineWidth = G.lw(1); G.ctx.stroke();
    G.s = s0; G.ctx.restore();
    inside(G, 'phone');
  }
};

/* ---- phoneboard: five centimetres of board, packed on both sides; no fan ---- */
const passives = []; for (let i = 0; i < 90; i++) { const x = 90 + rnd(i, 11) * 820, y = 130 + rnd(i, 12) * 740; if (!(x > 380 && x < 680 && y > 330 && y < 630) && !(x > 835 && y > 615)) passives.push([x, y, i % 3 ? 14 : 22, i % 3 ? 8 : 12]); }
const pbBus = [];
for (let j = 0; j < 6; j++) pbBus.push([[410, 396 + j * 9], [344 - j * 8, 396 + j * 9], [344 - j * 8, 310]]);
for (let j = 0; j < 5; j++) pbBus.push([[566 + j * 9, 360], [566 + j * 9, 318 - j * 8], [680, 318 - j * 8]]);
const phoneboard = {
  parts: { soc: [{ r: [410, 360, 240, 240] }], pmic: [{ r: [150, 620, 160, 140] }], modem: [{ r: [680, 180, 180, 150] }], storage: [{ r: [150, 170, 200, 140] }] },
  draw(G) {
    const c = G.col, h = heat(G);
    G.bg(c.lo);
    poly(G, [[60, 100], [940, 100], [940, 640], [860, 640], [860, 900], [60, 900]], c.mid, c.hi, 1.6);
    poly(G, [[72, 112], [928, 112], [928, 628], [848, 628], [848, 888], [72, 888]], null, c.dim, 0.7);
    [[90, 130], [910, 130], [90, 870]].forEach(k => { G.c(k[0], k[1], 12, c.lo, c.line, 1); G.c(k[0], k[1], 17, null, c.warm, 0.6); });
    /* wires inside the board: data to the storage and the modem, power from the power chip */
    pbBus.forEach(b => G.l(b, c.cool, 1));
    for (let i = 0; i < 3; i++) G.l([[370, 640 + i * 48], [480 + i * 30, 640 + i * 48], [480 + i * 30, 600]], c.warm, 2);
    pbBus.forEach((b, i) => { if (i % 2) return; const p = along2(b, (G.t * 0.45 + i * 0.17) % 1); G.r(p[0] - 3.5, p[1] - 3.5, 7, 7, c.cool); });
    /* tiny resistors and capacitors everywhere */
    passives.forEach(q => { G.r(q[0], q[1], q[2], q[3], c.up, c.line, 0.6); G.r(q[0], q[1], 3, q[3], c.warm); G.r(q[0] + q[2] - 3, q[1], 3, q[3], c.warm); });
    /* the storage chip */
    G.r(150, 170, 200, 140, c.up, c.line, 1.2); G.r(166, 186, 168, 108, c.mid, c.dim, 0.8);
    for (let k = 0; k < 4; k++) G.l([[180, 204 + k * 24], [320, 204 + k * 24]], c.dim, 0.8);
    G.c(162, 182, 4, c.line);
    /* the power chip, its coils and its capacitors */
    G.r(150, 620, 160, 140, c.up, c.line, 1.2); G.r(166, 636, 128, 108, c.mid, c.dim, 0.8); G.c(162, 632, 4, c.line);
    for (let i = 0; i < 3; i++) { G.r(330, 620 + i * 48, 40, 40, c.mid, c.line, 1); G.c(350, 640 + i * 48, 12, null, c.warm, 1.2); G.c(350, 640 + i * 48, 6, null, c.warm, 0.8); }
    for (let i = 0; i < 5; i++) G.r(156 + i * 31, 772, 24, 14, c.up, c.warm, 0.8);
    G.a(0.1 + 0.3 * h); G.r(166, 636, 128, 108, c.warm); G.a(1);
    /* the modem under its shield, its radio parts, and the lines out to the antenna */
    G.r(668, 106, 204, 236, null, c.dim, 1.2);
    G.r(680, 180, 180, 150, c.up, c.line, 1.2); G.r(696, 196, 148, 118, c.mid, c.dim, 0.8); G.c(692, 192, 4, c.line);
    for (let i = 0; i < 3; i++) { const x = 690 + i * 58; G.r(x, 116, 44, 40, c.up, c.line, 1); G.l([[x + 22, 156], [x + 22, 180]], c.cool, 1.4); G.l([[x + 22, 116], [x + 22, 100]], c.cool, 1.6); G.r(x + 14, 96, 16, 8, c.warm); }
    G.l([[860, 220], [940, 220]], c.cool, 1.6); G.r(932, 212, 8, 16, c.warm);
    const ring = (G.t * 0.8) % 1; G.a(0.5 * (1 - ring)); for (let i = 0; i < 3; i++) G.c(712 + i * 58, 100, 6 + ring * 22, null, c.cool, 1); G.a(1);
    /* places where ribbons plug in */
    G.r(700, 720, 140, 50, c.up, c.line, 1); for (let i = 0; i < 12; i++) G.l([[708 + i * 11, 726], [708 + i * 11, 764]], c.warm, 1);
    G.r(92, 380, 40, 170, c.up, c.line, 1); for (let i = 0; i < 14; i++) G.l([[98, 388 + i * 11.6], [126, 388 + i * 11.6]], c.warm, 1);
    G.r(520, 818, 180, 44, c.up, c.line, 1); for (let i = 0; i < 15; i++) G.l([[528 + i * 11.6, 824], [528 + i * 11.6, 856]], c.warm, 1);
    [[420, 180], [470, 250], [560, 150], [240, 420], [250, 500], [420, 700], [640, 680], [780, 420], [820, 560], [600, 760]].forEach(k => G.c(k[0], k[1], 5, c.lo, c.warm, 0.8));
    /* the phone's chip: the memory sits on top of the processor. Your chip's heat spreads from it. */
    const beat = 0.5 + 0.5 * Math.sin(G.t * 1.3 * M.clock);
    for (let k = 3; k >= 1; k--) { G.a((0.05 + 0.16 * h + 0.05 * beat) / k); const e = 14 * k * (0.6 + h); G.r(410 - e, 360 - e, 240 + 2 * e, 240 + 2 * e, c.warm); }
    G.a(1);
    G.r(402, 352, 256, 256, c.up, c.hi, 1.4);
    inside(G, 'phoneboard');
    G.label('soc', 404, 342); G.label('pmic', 150, 610); G.label('modem', 668, 96); G.label('storage', 150, 160);
  }
};

/* ---- soc: the phone's chip: every kind of work has its own district ---- */
const socCpu = [{ r: [140, 430, 140, 140] }, { r: [300, 430, 140, 140] }, { r: [140, 590, 90, 110] }, { r: [245, 590, 90, 110] }, { r: [350, 590, 90, 110] }];
const socBus = [[[130, 408], [480, 408]], [[480, 130], [480, 728]], [[480, 425], [870, 425]]];
const soc = {
  parts: { cpu: socCpu, gpu: [{ r: [500, 130, 370, 280] }], npu: [{ r: [500, 440, 370, 270] }], isp: [{ r: [130, 130, 330, 260] }], cache: [{ r: [130, 740, 740, 130] }] },
  draw(G) {
    const c = G.col, tick = Math.floor(G.t * 1.5 * M.clock);
    G.bg(c.lo);
    G.r(40, 40, 920, 920, c.mid, c.hi, 1.8); pads(G, 24);
    G.r(112, 112, 776, 776, c.lo, c.line, 1);
    /* the camera's district: a pipeline of stages, and the lines of the picture waiting below */
    G.r(130, 130, 330, 260, c.mid, c.line, 1.2);
    const stage = Math.floor(G.t * 2) % 5;
    for (let i = 0; i < 5; i++) {
      const x = 146 + i * 62;
      G.r(x, 146, 50, 174, c.up, i === stage ? c.cool : c.dim, 0.9);
      for (let k = 0; k < 4; k++) G.r(x + 7, 155 + k * 40, 36, 32, (i + k) % 3 ? c.lo : c.mid, c.dim, 0.6);
      if (i < 4) G.l([[x + 50, 233], [x + 62, 233]], c.cool, 1.4);
    }
    for (let k = 0; k < 3; k++) { G.r(146, 332 + k * 17, 298, 12, c.up, c.dim, 0.6); G.a(0.6); G.r(146 + ((G.t * 0.3 + k * 0.33) % 1) * 268, 332 + k * 17, 30, 12, c.cool); G.a(1); }
    /* the graphics district: many small identical cores */
    G.r(500, 130, 370, 280, c.mid, c.line, 1.2);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      const x = 514 + i * 59, y = 146 + j * 64, on = rnd(i * 4 + j, Math.floor(G.t * 2)) > 0.6;
      G.r(x, y, 50, 54, on ? c.up : c.lo, c.dim, 0.8); G.r(x + 6, y + 6, 22, 20, c.mid, null); G.r(x + 6, y + 32, 38, 14, on ? c.cool : c.mid, null);
    }
    /* the AI district: a grid of multiply units, data flowing across it, its own memory beside it */
    G.r(500, 440, 370, 270, c.mid, c.line, 1.2);
    for (let i = 0; i < 10; i++) for (let j = 0; j < 8; j++) G.r(514 + i * 29.5, 456 + j * 30.5, 22, 22, c.up, null);
    const w = (G.t * 0.5) % 1;
    G.a(0.55); for (let j = 0; j < 8; j++) G.r(514 + ((w + j * 0.07) % 1) * 266, 456 + j * 30.5, 22, 22, c.cool); G.a(1);
    cells(G, 812, 456, 46, 240, 3, 16, 5, Math.floor(G.t * 1.5));
    /* the roads between the districts */
    G.a(0.85); socBus.forEach(b => G.l(b, c.cool, 1.8)); G.a(1);
    socBus.forEach((b, i) => { for (let k = 0; k < 2; k++) { const p = along2(b, (G.t * 0.4 + i * 0.3 + k * 0.5) % 1); G.r(p[0] - 5, p[1] - 5, 10, 10, c.cool); } });
    /* the processor: two big cores, three little ones */
    G.r(130, 420, 320, 290, null, c.dim, 0.8);
    socCpu.forEach((k, n) => {
      const r = k.r; G.r(r[0], r[1], r[2], r[3], c.up, c.line, 1.2);
      coreInside(G, r, 8);
      if (rnd(n, tick) > 0.5) { G.a(0.45); G.r(r[0] + 8, r[1] + 8, r[2] * 0.52, r[3] * 0.5, c.warm); G.a(1); }
      if (rnd(n + 50, tick) < M.late) { G.a(0.55); G.r(r[0], r[1], r[2], r[3], c.red); G.a(1); }
    });
    inside(G, 'soc');
    /* shared memory along the bottom */
    G.r(130, 740, 740, 130, c.mid, c.line, 1.2);
    for (let i = 0; i < 8; i++) { const x = 140 + i * 91; G.r(x, 750, 82, 110, c.up, c.dim, 0.8); for (let k = 1; k < 6; k++) G.l([[x + k * 14, 756], [x + k * 14, 854]], c.dim, 0.6); G.r(x, 750, 82, 10, c.mid, null); }
    G.label('isp', 136, 124); G.label('gpu', 504, 124); G.label('npu', 504, 434); G.label('cpu', 136, 424); G.label('cache', 136, 734);
  }
};

/* ======== a car ======== */

/* ---- car: seen from above: dozens of small computers, joined by wires ---- */
/* ---- car: seen from the side, the near side and the roof cut away. Driving to the right on its road:
   the battery under the floor, the motor at the back wheels, seats and dashboard, the radar and cameras that
   watch the road, and dozens of control units joined by the wiring. The one the dive follows stands with
   its lid off, its board facing you. Measured in centimetres. ---- */
const PCAR = proj({ s: 1.75, ox: 31, cx: 0, oy: 712 }), KC = kit(PCAR);
const CAR = [[8, 34], [0, 52], [3, 82], [22, 98], [72, 108], [118, 140], [250, 146], [298, 141], [362, 102], [432, 90], [458, 76], [462, 52], [455, 33], [415, 31], [338, 31], [122, 31], [48, 33]];
const WHEELS = [85, 378], ECUS = [[290, 20, 68, 18, 22, 18], [408, 60, 62, 30, 26, 16], [168, 70, 36, 24, 20, 12], [228, 120, 40, 20, 18, 14], [64, 80, 60, 26, 20, 14], [320, 130, 80, 18, 16, 12]];
const carParts = (() => {
  const hull3 = pts3 => { const q = pts3.map(p => PCAR(p[0], p[1], p[2])).sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of q.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return closed(lo.slice(0, -1).concat(up.slice(0, -1))); };
  const boxH = (x, y, z, w, d, h) => hull3([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]);
  return {
    controllers: ECUS.map(e => boxH(...e)),
    wiring: [{ p: [[408, 74, 62], [340, 74, 36], [200, 74, 36], [70, 74, 50]].map(p => PCAR(...p)) }, { p: [[300, 74, 36], [300, 29, 77]].map(p => PCAR(...p)) }],
    sensors: [[462, 90, 52], [330, 90, 136], [4, 90, 80]].map(([x, y, z]) => { const q = PCAR(x, y, z); return { c: [q[0], q[1], 16] }; }),
    wheels: WHEELS.map(x => { const q = PCAR(x, 0, 34); return { c: [q[0], q[1], 56] }; })
  };
})();
const car = {
  parts: carParts,
  draw(G) {
    const c = G.col, T = tones(c), K = KC, P = PCAR;
    G.bg(c.dark ? c.bg : mix(c.up, c.line, 0.12));
    /* the road, moving past */
    K.fill(G, [P(-200, -60, 0), P(800, -60, 0), P(800, 260, 0), P(-200, 260, 0)], c.dark ? mix(c.lo, c.mid, 0.3) : mix(c.mid, c.lo, 0.3));
    const run = (G.t * 260) % 140;
    [-30, 220].forEach(y => { for (let i = -2; i < 8; i++) { const x = i * 140 - run; K.fill(G, [P(x, y, 0.2), P(x + 70, y, 0.2), P(x + 70, y + 5, 0.2), P(x, y + 5, 0.2)], T.seam); } });
    /* what the radar watches, ahead */
    G.a(0.12); K.fill(G, [P(462, 90, 52), P(700, 20, 20), P(700, 160, 80)], c.cool); G.a(1);
    const sw = (G.t * 0.8) % 1; G.a(0.5 * (1 - sw)); G.l([P(470 + sw * 200, 90 - sw * 60, 52 - sw * 25), P(470 + sw * 200, 90 + sw * 60, 52 + sw * 20)], c.cool, 1.2); G.a(1);
    K.shadow(G, [[0, 0], [462, 0], [462, 180], [0, 180]], 0, 24);
    /* the far wheels, the far side of the body seen from inside */
    WHEELS.forEach(x => wheel(G, x, 158, 180));
    K.fill(G, CAR.map(([x, z]) => P(x, 180, z)), T.inner.front, T.edge, 0.8);
    /* the floor, with the battery under it */
    K.box(G, 112, 18, 16, 240, 144, 14, { tone: 'base' });
    for (let k = 1; k < 8; k++) KC.line(G, [[112 + k * 30, 18, 30], [112 + k * 30, 162, 30]], T.seam, 0.6);
    K.fill(G, [P(40, 4, 31), P(430, 4, 31), P(430, 176, 31), P(40, 176, 31)], T.body.top, T.edge, 0.7);
    /* the motor at the back wheels, with its inverter */
    K.box(G, 60, 40, 32, 50, 100, 34, {}); K.box(G, 64, 80, 66, 26, 20, 14, {});
    /* the bonnet's insides: the computer that drives, the 12-volt battery */
    K.box(G, 386, 30, 46, 40, 40, 28, { tone: 'base' });
    /* seats and dashboard, the steering wheel */
    [[120, 26], [120, 96]].forEach(([x, y]) => { K.box(G, x, y, 34, 52, 58, 18, {}); K.box(G, x, y, 52, 14, 58, 44, {}); });
    [[230, 26], [230, 104]].forEach(([x, y]) => { K.box(G, x, y, 34, 50, 50, 20, {}); K.box(G, x, y, 54, 12, 50, 52, {}); K.box(G, x + 2, y + 10, 106, 8, 30, 12, {}); });
    K.box(G, 318, 12, 70, 34, 156, 26, {}); K.onFront(G, 326, 12, 78, 20, 12, c.dark ? c.bg : c.lo, T.edge, 0.6);
    const sp = P(310, 52, 98); G.ctx.save(); G.ctx.beginPath(); G.ctx.ellipse(sp[0], sp[1], 15, 18, 0, 0, 6.2832); G.ctx.strokeStyle = T.edge; G.ctx.lineWidth = G.lw(3); G.ctx.stroke(); G.ctx.restore();
    /* the wiring, with messages travelling along it */
    const harness = [[[408, 74, 62], [340, 74, 36], [200, 74, 36], [70, 74, 50]], [[300, 74, 36], [300, 29, 77]], [[200, 74, 36], [178, 80, 42]], [[250, 74, 36], [238, 128, 46]], [[340, 74, 36], [328, 136, 86]], [[408, 74, 62], [460, 90, 52]], [[70, 74, 50], [8, 90, 80]]];
    harness.forEach((h, i) => { const q = h.map(p => P(...p)); G.l(q, c.cool, 1.6); const pt = along2(q, (G.t * 0.5 + i * 0.17) % 1); G.a(0.9); G.r(pt[0] - 3, pt[1] - 3, 6, 6, c.cool); G.a(1); });
    /* the control units; the one the dive follows faces you with its lid off */
    ECUS.slice(1).forEach(([x, y, z, w, d, h]) => { K.box(G, x, y, z, w, d, h, {}); K.onFront(G, x + 3, y, z + 3, 4, 4, c.warm); });
    const [ex, ey, ez, ew, ed, eh] = ECUS[0];
    K.box(G, ex - 4, ey + 4, 31, ew + 8, ed - 4, ez - 31, {});
    K.box(G, ex - 1, ey, ez - 1, ew + 2, ed, eh + 2, { tone: 'base' });
    inside(G, 'car');
    /* sensors: the radar in front, a camera at the top of the windscreen, one at the back */
    [[462, 90, 52], [330, 90, 136], [4, 90, 80]].forEach(([x, y, z]) => { const q = P(x, y, z); G.c(q[0], q[1], 7, c.lo, c.warm, 1.4); G.c(q[0], q[1], 3, c.warm); });
    /* the glass that is left: the windscreen and the back window, edge on */
    [[[298, 141], [362, 102]], [[72, 108], [118, 140]]].forEach(([a, b]) => { G.a(0.35); K.fill(G, [P(a[0], 8, a[1]), P(b[0], 8, b[1]), P(b[0], 172, b[1]), P(a[0], 172, a[1])], mix(c.cool, c.bg, 0.5), T.edge, 0.8); G.a(1); });
    /* the near side, cut away above the sills: what is left of it, and the near wheels */
    K.fill(G, [[0, 52], [3, 66], [462, 66], [462, 52], [455, 33], [415, 31], [338, 31], [122, 31], [48, 33], [8, 34]].map(([x, z]) => P(x, 0, z)), T.body.front, T.edge, 1);
    G.l(CAR.concat([CAR[0]]).map(([x, z]) => P(x, 0, z)), T.edge, 1.1);
    WHEELS.forEach(x => wheel(G, x, 0, 22));
  }
};
/* a wheel standing in the side plane, from depth y0 to y1: the tyre's tread between its two faces */
function wheel(G, x, y0, y1) {
  const c = G.col, T = tones(c), a = PCAR(x, y0, 34), b = PCAR(x, y1, 34), r = 34 * 1.75, ctx = G.ctx;
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * r, ny = dx / L * r;
  poly(G, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], T.base.side, null);
  ctx.beginPath(); ctx.arc(b[0], b[1], r, 0, 6.2832); ctx.fillStyle = T.base.side; ctx.fill();
  ctx.beginPath(); ctx.arc(a[0], a[1], r, 0, 6.2832); ctx.fillStyle = c.dark ? c.bg : T.base.front; ctx.fill(); ctx.strokeStyle = T.edge; ctx.lineWidth = G.lw(1); ctx.stroke();
  ctx.beginPath(); ctx.arc(a[0], a[1], r * 0.62, 0, 6.2832); ctx.fillStyle = T.body.top; ctx.fill(); ctx.stroke();
  const spin = G.t * 6; for (let k = 0; k < 5; k++) { const an = spin + (k / 5) * 6.2832; G.l([[a[0] + Math.cos(an) * r * 0.18, a[1] + Math.sin(an) * r * 0.18], [a[0] + Math.cos(an) * r * 0.58, a[1] + Math.sin(an) * r * 0.58]], T.edge, 1.4); }
  ctx.beginPath(); ctx.arc(a[0], a[1], r * 0.16, 0, 6.2832); ctx.fillStyle = T.base.top; ctx.fill(); ctx.stroke();
}

/* ---- ecu: one control unit, its lid off: a small chip that decides, big parts that push ---- */
const drivers = [0, 1, 2, 3].map(i => ({ r: [660, 210 + i * 110, 110, 80] }));
const ecuVias = []; for (let i = 0; i < 46; i++) ecuVias.push([230 + rnd(i, 31) * 400, 180 + rnd(i, 32) * 640]);
const ecu = {
  parts: { mcu: [{ r: [425, 395, 100, 100] }], connector: [{ r: [120, 190, 90, 620] }], drivers },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    /* the metal case: ears to bolt it down, a plug for the car's wires */
    [[140, 80], [780, 80], [140, 880], [780, 880]].forEach(k => { G.r(k[0], k[1], 80, 40, c.mid, c.hi, 1.4); G.c(k[0] + 40, k[1] + 20, 11, c.lo, c.line, 1); });
    G.r(34, 226, 28, 548, c.mid, c.hi, 1.4); for (let i = 0; i < 12; i++) G.l([[38, 246 + i * 46], [58, 246 + i * 46]], c.dim, 1);
    G.r(60, 120, 880, 760, c.mid, c.hi, 1.8);
    G.r(80, 140, 840, 720, null, c.dim, 0.8);
    G.r(100, 160, 800, 680, c.up, c.line, 1.2);
    [[116, 176], [884, 176], [116, 824], [884, 824]].forEach(k => G.c(k[0], k[1], 8, c.lo, c.line, 1));
    ecuVias.forEach(v => G.c(v[0], v[1], 2.6, c.lo, c.dim, 0.6));
    /* the connector to the car's wires */
    G.r(120, 190, 90, 620, c.mid, c.line, 1.2);
    for (let i = 0; i < 26; i++) { G.c(148, 212 + i * 23, 6, c.lo, c.warm, 1); G.c(182, 212 + i * 23, 6, c.lo, c.warm, 1); }
    /* wires from the connector to the chip, and from the chip to the drivers */
    for (let i = 0; i < 6; i++) G.l([[210, 300 + i * 60], [300 + i * 14, 300 + i * 60], [300 + i * 14, 410 + i * 14], [425, 410 + i * 14]], c.cool, 1.1);
    drivers.forEach((d, i) => G.l([[525, 410 + i * 24], [600, 410 + i * 24], [600, d.r[1] + 40], [660, d.r[1] + 40]], c.warm, 1.6));
    for (let i = 0; i < 3; i++) { const p = along2([[210, 300 + i * 120], [300 + i * 28, 300 + i * 120], [300 + i * 28, 410 + i * 28], [425, 410 + i * 28]], (G.t * 0.4 + i * 0.3) % 1); G.r(p[0] - 4, p[1] - 4, 8, 8, c.cool); }
    /* power in: thick copper, a coil, big capacitors */
    G.l([[210, 760], [270, 760]], c.warm, 3); G.l([[330, 760], [430, 760], [430, 730]], c.warm, 3); G.l([[475, 640], [475, 495]], c.warm, 2);
    [[300, 230], [300, 760], [560, 770], [800, 770]].forEach(k => { G.c(k[0], k[1], 30, c.mid, c.line, 1.1); G.c(k[0], k[1], 12, null, c.dim, 0.8); G.l([[k[0] - 30, k[1]], [k[0] - 18, k[1]]], c.warm, 1.4); });
    G.r(430, 640, 90, 90, c.mid, c.line, 1.1); [34, 24, 14].forEach(r => G.c(475, 685, r, null, c.warm, 1));
    /* a clock crystal, a transceiver for the car's network, a watchdog */
    rr(G, 555, 330, 50, 24, 10, c.mid, c.line, 1); G.r(540, 362, 12, 8, c.up, c.warm, 0.7); G.r(608, 362, 12, 8, c.up, c.warm, 0.7);
    G.r(290, 580, 70, 56, c.mid, c.line, 1); for (let i = 0; i < 4; i++) { G.r(298 + i * 15, 572, 6, 8, c.line); G.r(298 + i * 15, 636, 6, 8, c.line); }
    G.r(540, 548, 46, 46, c.mid, c.line, 1); G.c(563, 571, 9, null, c.grn, 1);
    /* the drivers: power parts that switch real current, on a metal strip that takes their heat */
    G.r(790, 190, 60, 470, c.mid, c.line, 1);
    for (let i = 0; i < 10; i++) G.l([[796, 205 + i * 45], [844, 205 + i * 45]], c.dim, 1);
    drivers.forEach((d, i) => {
      const r = d.r, on = 0.5 + 0.5 * Math.sin(G.t * 2 + i);
      G.r(r[0], r[1], r[2], r[3], c.mid, c.line, 1.2); G.r(r[0] + r[2] - 4, r[1] + 12, 24, r[3] - 24, c.up, c.line, 0.9); G.c(r[0] + r[2] + 8, r[1] + r[3] / 2, 5, c.lo, c.line, 0.8);
      for (let k = 0; k < 3; k++) G.r(r[0] - 10, r[1] + 16 + k * 20, 10, 8, c.line);
      G.r(r[0] + 14, r[1] + 14, r[2] - 28, r[3] - 28, c.lo, c.warm, 1); G.a(0.25 + 0.25 * on); G.r(r[0] + 14, r[1] + 14, r[2] - 28, r[3] - 28, c.warm); G.a(1);
      G.l([[850, r[1] + 40], [900, r[1] + 40]], c.warm, 3);
    });
    /* the microcontroller: a package, its legs, and inside it the chip, as it is */
    G.r(425, 395, 100, 100, c.mid, c.hi, 1.5);
    for (let i = 0; i < 9; i++) { G.r(430 + i * 10.5, 387, 5, 8, c.line); G.r(430 + i * 10.5, 495, 5, 8, c.line); G.r(417, 400 + i * 10.5, 8, 5, c.line); G.r(525, 400 + i * 10.5, 8, 5, c.line); }
    G.c(434, 404, 3, c.line);
    for (let i = 0; i < 9; i++) { const u = 432.5 + i * 10.5, v = 459 + (i - 4) * 4; G.l([[u, 398], [v + 16, 425]], c.dim, 0.5); G.l([[u, 492], [v + 16, 465]], c.dim, 0.5); G.l([[428, u - 30], [455, v - 14]], c.dim, 0.5); G.l([[522, u - 30], [495, v - 14]], c.dim, 0.5); }
    inside(G, 'ecu');
    G.label('mcu', 425, 380); G.label('connector', 120, 180); G.label('drivers', 660, 200);
  }
};

/* ---- mcu: a microcontroller: two small cores in step, the memory that keeps its program, and its senses ---- */
const mcuCores = [{ r: [130, 130, 150, 260] }, { r: [300, 130, 150, 260] }];
const periph = [{ r: [130, 590, 180, 130] }, { r: [330, 590, 180, 130] }, { r: [530, 590, 160, 130] }, { r: [710, 590, 160, 130] }];
const mcuBus = [[130, 570], [870, 570]];
const mcu = {
  parts: { cores: mcuCores, flash: [{ r: [490, 130, 380, 420] }], sram: [{ r: [130, 420, 320, 130] }], periph },
  draw(G) {
    const c = G.col, tick = Math.floor(G.t * 1.5 * M.clock);
    G.bg(c.lo);
    G.r(40, 40, 920, 920, c.mid, c.hi, 1.8); pads(G, 14);
    G.r(112, 112, 776, 776, c.lo, c.line, 1);
    G.a(0.5); G.r(120, 120, 760, 760, null, c.warm, 0.8); G.a(1);
    /* the two cores run the same work; a checker between them compares every result */
    mcuCores.forEach((k, n) => {
      const r = k.r; G.r(r[0], r[1], r[2], r[3], c.up, c.line, 1.2);
      G.r(r[0] + 10, r[1] + 10, r[2] - 20, r[3] * 0.45, c.mid, c.dim, 0.8); G.r(r[0] + 10, r[1] + r[3] * 0.55, r[2] * 0.5 - 14, r[3] * 0.4, c.lo, c.dim, 0.8); G.r(r[0] + r[2] * 0.5 + 4, r[1] + r[3] * 0.55, r[2] * 0.5 - 14, r[3] * 0.4, c.mid, c.dim, 0.8);
      for (let j = 1; j < 5; j++) G.l([[r[0] + 16, r[1] + 10 + j * 23], [r[0] + r[2] - 16, r[1] + 10 + j * 23]], c.dim, 0.6);
      if (tick % 2) { G.a(0.45); G.r(r[0] + 10, r[1] + 10, r[2] - 20, r[3] * 0.45, c.warm); G.a(1); }
      if (rnd(n + 50, tick) < M.late) { G.a(0.55); G.r(r[0], r[1], r[2], r[3], c.red); G.a(1); }
    });
    G.l([[280, 250], [300, 250]], c.grn, 1.2); G.l([[280, 270], [300, 270]], c.grn, 1.2);
    G.r(282, 240, 16, 40, c.mid, c.grn, 1.2); G.a(tick % 2 ? 0.7 : 0.25); G.r(285, 244, 10, 32, c.grn); G.a(1);
    inside(G, 'mcu');
    /* flash memory: the program, kept with the power off; around it, the parts that pick a row and read it */
    G.r(490, 130, 380, 420, c.mid, c.line, 1.2);
    for (let j = 0; j < 18; j++) G.r(500, 142 + j * 21, 18, 15, c.up, c.dim, 0.5);
    for (let i = 0; i < 16; i++) G.r(528 + i * 21, 520, 15, 20, c.up, c.dim, 0.5);
    cells(G, 528, 142, 336, 378, 16, 18, 3, null);
    const row = Math.floor(G.t * 3) % 18; G.a(0.4); G.r(500, 142 + row * 21, 358, 15, c.cool); G.a(1);
    /* working memory */
    G.r(130, 420, 320, 130, c.mid, c.line, 1.2);
    cells(G, 138, 428, 307, 117, 15, 5, 5, Math.floor(G.t));
    /* the bus that joins them */
    G.a(0.85); G.l(mcuBus, c.cool, 1.8); G.a(1);
    [205, 375, 470, 680].forEach(x => G.l([[x, 550], [x, 590]], c.cool, 1.2));
    for (let k = 0; k < 3; k++) { const p = along2(mcuBus, (G.t * 0.35 + k / 3) % 1); G.r(p[0] - 5, p[1] - 5, 10, 10, c.cool); }
    /* its senses and its hands: a converter for signals, a link to the car's network, timers, pins */
    periph.forEach((k, n) => {
      const r = k.r, x0 = r[0] + 12, w = r[2] - 24, my = r[1] + r[3] / 2; G.r(r[0], r[1], r[2], r[3], c.mid, c.line, 1.2);
      if (n === 0) {
        const pts = []; for (let i = 0; i <= 30; i++) pts.push([x0 + i * (w / 30), my + Math.sin(i * 0.5 + G.t * 2) * 30]); G.l(pts, c.grn, 1.4);
        for (let i = 0; i < 8; i++) { const v = Math.round((Math.sin(i * 1.9 + G.t * 2) * 30) / 12) * 12; G.r(x0 + i * (w / 8) + 4, my + Math.min(0, v), 6, Math.abs(v) + 2, c.dim); }
      } else if (n === 1) {
        const pts = [[x0, my + 22]]; for (let i = 0; i < 12; i++) { const b = rnd(i + Math.floor(G.t * 4), 9) > 0.5 ? -22 : 22, x = x0 + i * (w / 12); pts.push([x, my + b], [x + w / 12, my + b]); } G.l(pts, c.cool, 1.4);
        G.l([[x0, my - 40], [x0 + w, my - 40]], c.dim, 0.8); G.l([[x0, my + 40], [x0 + w, my + 40]], c.dim, 0.8);
      } else if (n === 2) {
        for (let i = 0; i < 3; i++) { const x = r[0] + 32 + i * 48, a = G.t * (1 + i) * 1.3; G.c(x, my, 19, c.up, c.dim, 0.9); G.l([[x, my], [x + Math.cos(a) * 15, my + Math.sin(a) * 15]], c.warm, 1.4); }
      } else for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) G.r(x0 + i * (w / 4), r[1] + 16 + j * 34, w / 4 - 8, 26, rnd(i * 3 + j, Math.floor(G.t * 2)) > 0.6 ? c.warm : c.up, c.dim, 0.8);
    });
    /* what keeps it steady: its own clock, and the parts that tame the car's rough power */
    G.r(130, 750, 740, 120, c.mid, c.line, 1);
    for (let i = 0; i < 2; i++) { const x = 196 + i * 150; G.c(x, 810, 38, c.up, c.dim, 1); G.c(x, 810, 24, null, c.warm, 1); const a = G.t * 3 * M.clock + i; G.c(x + Math.cos(a) * 24, 810 + Math.sin(a) * 24, 5, c.warm); }
    for (let i = 0; i < 5; i++) G.r(450 + i * 46, 768, 36, 84, c.up, c.warm, 0.9);
    for (let i = 0; i < 3; i++) { G.r(700 + i * 56, 768, 46, 38, c.up, c.dim, 0.8); G.r(700 + i * 56, 814, 46, 38, c.lo, c.dim, 0.8); }
    G.label('cores', 136, 124); G.label('flash', 494, 124); G.label('sram', 136, 414); G.label('periph', 136, 584);
  }
};

/* ======== a chip factory ======== */


/* ---- scanner: the machine that prints with light, cut open ---- */
const beam = [[230, 640], [300, 330], [470, 210], [530, 110], [620, 210], [760, 330], [730, 760]];
const scanMirrors = [[300, 330], [470, 210], [620, 210], [760, 330]];
const scanner = {
  parts: { source: [{ r: [60, 580, 240, 300] }], mirrors: scanMirrors.map(m => ({ c: [m[0], m[1], 26] })), mask: [{ r: [430, 70, 200, 40] }], stage: [{ r: [600, 640, 260, 240] }] },
  draw(G) {
    const c = G.col, ctx = G.ctx;
    G.bg(c.lo);
    /* the frame, standing on feet that keep the floor's shaking out */
    [100, 430, 840].forEach(x => { G.r(x, 940, 60, 26, c.mid, c.line, 1); G.l([[x + 8, 953], [x + 52, 953]], c.dim, 1); });
    G.r(40, 40, 920, 900, c.mid, c.hi, 1.8);
    G.r(70, 60, 860, 860, c.lo, c.line, 1);
    /* pumps keep the inside empty: the light cannot travel through air */
    for (let i = 0; i < 3; i++) { const x = 122 + i * 62, a = G.t * 2.4 + i; G.c(x, 130, 24, c.mid, c.line, 1); for (let k = 0; k < 3; k++) G.l([[x, 130], [x + Math.cos(a + k * 2.094) * 19, 130 + Math.sin(a + k * 2.094) * 19]], c.dim, 1.2); G.l([[x, 154], [x, 190]], c.dim, 1.4); }
    G.l([[100, 190], [270, 190]], c.dim, 1.4);
    /* the light: a laser hits drops of tin, which glow with very short light; a curved mirror gathers it */
    G.r(60, 580, 240, 300, c.mid, c.line, 1.2);
    G.r(204, 588, 40, 22, c.up, c.line, 0.9); G.r(204, 856, 40, 16, c.up, c.line, 0.9);
    G.r(70, 796, 44, 56, c.up, c.red, 1); G.l([[114, 800], [222, 694]], c.red, 2);
    for (let i = 0; i < 6; i++) { const y = 612 + ((G.t * 0.9 + i / 6) % 1) * 240; G.c(224, y, 5, c.warm); }
    ctx.beginPath(); ctx.arc(225, 690, 74, 0.12 * Math.PI, 0.88 * Math.PI); ctx.strokeStyle = c.hi; ctx.lineWidth = G.lw(2.2); ctx.stroke();
    const flash = 0.5 + 0.5 * Math.sin(G.t * 9);
    G.a(0.25 + 0.3 * flash); G.c(225, 690, 30, c.warm); G.a(1); G.c(225, 690, 34, null, c.warm, 1.4); G.c(225, 690, 7, c.hi);
    /* the barrel of mirrors that shrinks the picture */
    G.r(684, 388, 150, 226, c.mid, c.line, 1.1);
    [430, 490, 550].forEach((y, i) => { G.l([[704 + i * 8, y], [814 - i * 8, y]], c.cool, 1.6); G.l([[700 + i * 8, y + 7], [818 - i * 8, y + 7]], c.dim, 0.8); });
    /* the path: bounced off mirrors, off the mask, down to the wafer */
    G.a(0.22); G.l(beam, c.warm, 9); G.a(0.85); G.l(beam, c.warm, 2); G.a(1);
    const u = (G.t * 0.5) % 1, n = beam.length - 1, k = Math.floor(u * n), f = u * n - k, a = beam[k], b = beam[k + 1];
    G.c(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 9, c.warm);
    scanMirrors.forEach((m, i) => {
      const j = i < 2 ? i + 1 : i + 2, p = beam[j - 1], q = beam[j + 1], d1 = Math.atan2(p[1] - m[1], p[0] - m[0]), d2 = Math.atan2(q[1] - m[1], q[0] - m[0]), t = (d1 + d2) / 2 + Math.PI / 2;
      G.c(m[0], m[1], 26, c.up, c.hi, 1.4); G.c(m[0], m[1], 14, null, c.cool, 1);
      G.l([[m[0] - Math.cos(t) * 22, m[1] - Math.sin(t) * 22], [m[0] + Math.cos(t) * 22, m[1] + Math.sin(t) * 22]], c.hi, 2.4);
    });
    /* the mask: the pattern, held upside down on its own moving stage */
    G.r(396, 62, 268, 8, c.up, c.line, 0.9); G.l([[380, 66], [396, 66]], c.dim, 1.4); G.l([[664, 66], [680, 66]], c.dim, 1.4);
    G.r(430, 70, 200, 40, c.up, c.hi, 1.4); for (let i = 0; i < 9; i++) G.r(440 + i * 21, 78, 12, 24, i % 3 ? c.lo : c.cool);
    /* wafers waiting their turn, and the arm that brings them */
    G.r(360, 690, 120, 150, c.mid, c.line, 1.1); for (let i = 0; i < 8; i++) G.l([[372, 708 + i * 16], [468, 708 + i * 16]], i === 2 ? c.warm : c.cool, 1.2);
    G.l([[480, 770], [540, 800], [600, 770]], c.line, 2); G.c(540, 800, 7, c.up, c.line, 1); G.c(480, 770, 5, c.up, c.line, 1);
    /* the stage: the wafer, moving under the light */
    G.r(600, 640, 260, 240, c.mid, c.line, 1.2);
    G.r(626, 656, 208, 208, c.up, c.dim, 0.9);
    G.l([[580, 896], [880, 896]], c.line, 1.4); const sl = 0.5 + 0.5 * Math.sin(G.t * 1.6); G.r(600 + sl * 216, 890, 44, 12, c.warm);
    inside(G, 'scanner');
    G.label('source', 66, 570); G.label('mirrors', 330, 380); G.label('mask', 640, 96); G.label('stage', 860, 630, 'right');
  }
};

/* ---- wafer: one wafer of your chips; specks land at random ---- */
const wafer = {
  get parts() { return { dies: DIES.map(r => ({ r })), defects: SPECKS.map(p => ({ c: [p[0], p[1], 7] })) }; },
  draw(G) {
    const c = G.col, R = WAFER.R, ctx = G.ctx, side = DIES.length ? DIES[0][2] : 44, pitch = side + 2;
    G.bg(c.lo);
    /* the plate that holds it, and the three pins that lift it */
    G.c(500, 500, R + 46, null, c.dim, 1); G.c(500, 500, R + 34, null, c.dim, 0.6);
    for (let i = 0; i < 3; i++) { const a = -1.5708 + i * 2.0944; G.c(500 + Math.cos(a) * (R + 40), 500 + Math.sin(a) * (R + 40), 7, c.mid, c.line, 0.9); }
    G.c(500, 500, R + 12, c.mid, c.hi, 1.8);
    G.c(500, 500 + R + 12, 11, c.lo, c.hi, 1.2);
    /* the pattern is printed across the whole disc; chips cut by the edge are lost */
    ctx.save(); ctx.beginPath(); ctx.arc(500, 500, R + 4, 0, 6.2832); ctx.clip();
    const n = Math.ceil((R + 12) / pitch) + 1;
    for (let i = -n; i <= n; i++) { const v = 500 - side / 2 - 1 + i * pitch; G.l([[v, 40], [v, 960]], c.dim, 0.6); G.l([[40, v], [960, v]], c.dim, 0.6); }
    ctx.restore();
    G.c(500, 500, R - 3, null, c.dim, 0.7);
    const fine = side * G.s > 12;
    DIES.forEach((d, i) => {
      G.r(d[0], d[1], d[2], d[3], HITS[i] ? c.mid : c.up, c.line, 0.6);
      if (HITS[i]) { G.a(0.55); G.r(d[0], d[1], d[2], d[3], c.red); G.a(1); }
      else if (fine) { G.r(d[0] + d[2] * 0.12, d[1] + d[3] * 0.12, d[2] * 0.76, d[3] * 0.46, c.mid, null); G.r(d[0] + d[2] * 0.12, d[1] + d[3] * 0.64, d[2] * 0.76, d[3] * 0.1, c.lo, null); G.r(d[0] + d[2] * 0.12, d[1] + d[3] * 0.78, d[2] * 0.76, d[3] * 0.1, c.mid, null); }
    });
    /* the specks, each pulsing where it landed */
    SPECKS.forEach((p, i) => { const k = 0.6 + 0.4 * Math.sin(G.t * 2 + i); G.a(0.3); G.c(p[0], p[1], 7 + 3 * k, c.warm); G.a(1); G.c(p[0], p[1], 3 + 2 * k, c.warm); });
    /* the chip the dive follows: the next depth, as it is */
    const q = portalOf('wafer');
    inside(G, 'wafer');
    const e = G.lw(1.6) / 2 + 0.5 / G.s; G.r(q[0] - e, q[1] - e, q[2] + 2 * e, q[2] + 2 * e, null, c.hi, 1.6);
    G.label('dies', 70, 60); G.label('defects', 930, 60, 'right');
  }
};

/* ---- die: one of your chips, still on the wafer, with test needles on its pads ---- */
const dieProbes = [];
[200, 320, 440, 560, 680, 800].forEach((y, i) => { if (i % 2) return; dieProbes.push({ p: [[-20, y - 140], [68, y]] }, { p: [[1020, y - 20], [932, y + 120]] }); });
[260, 500, 740].forEach(x => dieProbes.push({ p: [[x - 140, -20], [x, 68]] }, { p: [[x + 20, 1020], [x + 160, 932]] }));
const die = {
  get parts() { return { cores: cores(), pads: [{ r: [56, 56, 888, 24] }, { r: [56, 920, 888, 24] }, { r: [56, 56, 24, 888] }, { r: [920, 56, 24, 888] }], probes: dieProbes, scribe: [{ r: [0, 0, 1000, 30] }] }; },
  draw(G) {
    const c = G.col;
    /* the cutting lines around it, with the small test patterns the factory measures */
    G.bg(c.lo);
    for (let i = 0; i < 16; i++) { G.r(44 + i * 60, 9, 22, 12, i % 4 ? c.mid : c.up, c.dim, 0.6); G.r(44 + i * 60, 979, 22, 12, i % 4 ? c.mid : c.up, c.dim, 0.6); G.r(9, 44 + i * 60, 12, 22, c.mid, c.dim, 0.6); G.r(979, 44 + i * 60, 12, 22, c.mid, c.dim, 0.6); }
    G.r(30, 30, 940, 940, c.mid, c.hi, 1.8);
    G.r(44, 44, 912, 912, null, c.dim, 0.8);
    [[100, 100], [900, 100], [100, 900], [900, 900]].forEach(k => { G.l([[k[0] - 9, k[1]], [k[0] + 9, k[1]]], c.line, 1.2); G.l([[k[0], k[1] - 9], [k[0], k[1] + 9]], c.line, 1.2); });
    pads(G, 22);
    G.r(112, 112, 776, 776, c.lo, c.line, 1);
    drawCores(G);
    G.a(0.6); clock.forEach(k => G.l(k.p, c.warm, 1.1)); G.a(1);
    for (let i = 0; i < 6; i++) { const x = 136 + i * 123; G.r(x, 626, 113, 88, c.up, c.line, 1); for (let k = 1; k < 8; k++) G.l([[x + k * 14, 630], [x + k * 14, 710]], c.dim, 0.7); }
    for (let i = 0; i < 8; i++) { G.r(136 + i * 92, 746, 82, 78, c.mid, c.line, 1); G.r(148 + i * 92, 758, 58, 24, c.up, c.dim, 0.7); }
    inside(G, 'die');
    /* the needles, touching down: each sends a test signal in, or listens */
    dieProbes.forEach((pr, i) => {
      const e = pr.p[1], on = rnd(i, Math.floor(G.t * 3)) > 0.45;
      G.l(pr.p, c.hi, 1.6); G.c(e[0], e[1], 5, on ? c.warm : c.line);
      if (on) { G.a(0.4); G.c(e[0], e[1], 11, null, c.warm, 1); G.a(1); }
    });
    G.label('cores', 136, 126); G.label('probes', 40, 150); G.label('pads', 500, 18, 'center'); G.label('scribe', 990, 18, 'right');
  }
};

export const SCENES = { building, rack, board, chip, phone, phoneboard, soc, car, ecu, mcu, scanner, wafer, die, block, gate, switch: swtch, atom, ...STATIONS, ...DESIGN_SCENES };
/* a scene drawn by the dive itself tells how large the dive's box is */
Object.values(SCENES).forEach(sc => { const draw = sc.draw; sc.draw = function (G) { if (!NEST) measure(G); draw.call(sc, G); }; });
export const partsOf = id => SCENES[id].parts;
