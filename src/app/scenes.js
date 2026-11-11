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
import { rnd, clamp, poly, rr, blob, along2 } from './draw.js';
import { STATIONS, setJourneyChip } from './journey.js';

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
const bRows = [0, 1, 2, 3, 4, 5].map(r => ({ r: [146, 196 + r * 105, 708, 64] }));
const bCool = []; for (let i = 0; i < 6; i++) { bCool.push({ r: [140 + i * 125, 122, 95, 40] }); bCool.push({ r: [140 + i * 125, 838, 95, 40] }); }
const building = {
  parts: { racks: bRows, cooling: bCool, power: [{ r: [868, 200, 52, 580] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(60, 100, 880, 800, c.lo, c.hi, 1.6);
    for (let r = 0; r < 5; r++) { G.a(0.16); G.r(146, 256 + r * 105, 708, 49, r % 2 ? c.cool : c.warm); G.a(1); }
    for (let r = 0; r < 6; r++) {
      G.l([[140, 190 + r * 105], [860, 190 + r * 105]], c.dim, 1);
      for (let i = 0; i < 20; i++) {
        const x = 150 + i * 35, y = 200 + r * 105;
        G.r(x, y, 30, 56, c.up, c.line, 1);
        if (G.s > 1.6) { G.r(x + 4, y + 6, 22, 3, rnd(i, r + Math.floor(G.t * 2)) > 0.5 ? c.cool : c.dim); G.r(x + 4, y + 14, 22, 3, c.dim); }
      }
    }
    inside(G, 'building');
    bCool.forEach(u => { G.r(u.r[0], u.r[1], u.r[2], u.r[3], c.mid, c.line, 1.1); G.c(u.r[0] + 24, u.r[1] + 20, 12, null, c.line, 1); G.c(u.r[0] + 70, u.r[1] + 20, 12, null, c.line, 1); });
    G.r(868, 200, 52, 580, c.mid, c.line, 1.1);
    for (let i = 0; i < 9; i++) G.r(876, 212 + i * 62, 36, 46, c.up, c.warm, 0.9);
    /* your chip: the power drawn and the heat to carry away */
    const p = Math.min(9, Math.round(M.power * 4.5));
    G.a(0.55); for (let i = 0; i < p; i++) G.r(880, 216 + i * 62, 28, 38, c.warm); G.a(1);
    G.a(0.08 + 0.25 * heat(G)); for (let r = 0; r < 5; r++) G.r(146, 256 + r * 105, 708, 49, c.warm); G.a(1);
    G.label('racks', 150, 186); G.label('cooling', 140, 112); G.label('power', 860, 190, 'right');
  }
};

/* ---- rack: two metres tall ---- */
const sleds = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ r: [330, 130 + i * 80, 340, 68] }));
const rack = {
  parts: { servers: sleds, switch: [{ r: [330, 66, 340, 50] }], power: [{ r: [330, 862, 340, 66] }], cooling: [{ r: [272, 60, 16, 880] }, { r: [712, 60, 16, 880] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
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
  parts: { cells: cellRows, sram: [{ r: [660, 60, 300, 560] }], wires },
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
    inside(G, 'block');
    G.label('cells', 44, 52); G.label('sram', 660, 50); G.label('wires', 480, 968);
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

/* ======== a phone ======== */

/* ---- phone: the back opened, about fifteen centimetres tall: the main board, the battery, the camera ---- */
const phone = {
  parts: { board: [{ r: [380, 70, 300, 300] }], battery: [{ r: [310, 400, 380, 430] }], camera: [{ r: [300, 74, 68, 160] }], antenna: [{ r: [316, 30, 368, 14] }, { r: [316, 956, 368, 14] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    rr(G, 270, 30, 460, 940, 50, c.mid, c.hi, 1.8);
    rr(G, 290, 50, 420, 900, 32, c.lo, c.line, 1);
    /* the frame is the antenna, cut into bands; each band is fed from the board */
    [30, 956].forEach(y => { G.r(316, y, 368, 14, c.up, c.warm, 1); [400, 594].forEach(x => G.r(x, y - 1, 6, 16, c.lo)); });
    [[270, 210], [710, 210], [270, 784], [710, 784]].forEach(k => G.r(k[0], k[1], 20, 6, c.lo));
    G.l([[440, 44], [440, 70]], c.warm, 1.2); G.l([[620, 44], [620, 70]], c.warm, 1.2); G.l([[500, 956], [500, 940]], c.warm, 1.2);
    /* the camera: two lenses and a flash, on a ribbon to the board */
    rr(G, 300, 74, 68, 160, 14, c.mid, c.line, 1.1);
    [112, 196].forEach(y => { G.c(334, y, 25, c.up, c.hi, 1.2); G.c(334, y, 17, c.lo, c.line, 0.8); G.c(334, y, 9, c.mid, c.cool, 1); G.c(328, y - 6, 2.6, c.hi); });
    G.c(334, 154, 6, c.lo, c.warm, 1);
    G.r(368, 140, 12, 28, c.up, c.warm, 0.8);
    /* the card tray under it */
    rr(G, 300, 272, 68, 98, 8, c.mid, c.line, 1);
    G.r(312, 290, 44, 62, c.up, c.warm, 0.8); G.l([[334, 290], [334, 352]], c.warm, 0.7); G.l([[312, 321], [356, 321]], c.warm, 0.7);
    /* the battery, with its charge, and the charging coil lying on it */
    rr(G, 310, 400, 380, 430, 10, c.up, c.line, 1.2);
    G.r(330, 420, 340, 390, c.mid, c.dim, 0.8);
    const lvl = Math.max(0.06, Math.min(0.95, 0.55 * Math.sqrt(M.battery))) + 0.03 * Math.sin(G.t * 0.4);
    G.a(0.35); G.r(330, 420 + 390 * (1 - lvl), 340, 390 * lvl, c.grn); G.a(1);
    G.l([[330, 420 + 390 * (1 - lvl)], [670, 420 + 390 * (1 - lvl)]], c.grn, 1.2);
    [150, 136, 122, 108, 94].forEach(r => G.c(500, 615, r, null, c.dim, 1));
    G.l([[500, 521], [500, 400]], c.dim, 1);
    G.r(470, 386, 60, 14, c.mid, c.line, 0.9); G.r(488, 370, 24, 16, c.up, c.warm, 0.8);
    /* speaker, port, and the motor that taps */
    rr(G, 306, 852, 130, 84, 8, c.mid, c.line, 1);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) G.c(323 + i * 16, 874 + j * 20, 3.2, c.dim);
    rr(G, 564, 852, 130, 84, 8, c.mid, c.line, 1); G.r(580, 868, 98, 52, c.up, c.dim, 0.8);
    for (let k = 0; k < 5; k++) G.l([[593 + k * 18, 874], [593 + k * 18, 914]], c.warm, 0.9);
    G.r(452, 896, 96, 44, c.mid, c.line, 1); for (let i = 0; i < 8; i++) G.l([[462 + i * 11, 904], [462 + i * 11, 932]], c.warm, 1);
    [[302, 386], [698, 386], [302, 842], [698, 842]].forEach(k => G.c(k[0], k[1], 5, c.lo, c.line, 0.9));
    /* the main board: the next depth, as it is */
    inside(G, 'phone');
    G.label('board', 384, 62); G.label('battery', 316, 846); G.label('camera', 300, 258); G.label('antenna', 690, 24, 'right');
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
const ctrl = [[760, 500, 36, 36], [860, 470, 30, 26], [560, 480, 44, 40], [430, 360, 36, 30], [430, 610, 36, 30], [300, 482, 44, 36], [170, 482, 34, 34], [650, 380, 32, 28], [650, 592, 32, 28], [700, 430, 30, 26]];
const hub = [582, 500];
const carWires = ctrl.slice(1).filter((_, i) => i !== 1).map(k => ({ p: [hub, [k[0] + k[2] / 2, hub[1]], [k[0] + k[2] / 2, k[1] + k[3] / 2]] }));
carWires.push({ p: [hub, [778, 500]] });
const sensors = [{ c: [893, 500, 13] }, { c: [108, 500, 11] }, { c: [598, 318, 9] }, { c: [598, 682, 9] }, { c: [668, 500, 10] }];
const carBody = [[112, 420], [130, 345], [230, 322], [700, 322], [810, 334], [876, 372], [904, 440], [908, 500], [904, 560], [876, 628], [810, 666], [700, 678], [230, 678], [130, 655], [112, 580], [104, 500]];
const carWheels = [[200, 288], [200, 668], [680, 288], [680, 668]];
const car = {
  parts: { controllers: ctrl.map(r => ({ r })), wiring: carWires, sensors, wheels: carWheels.map(w => ({ r: [w[0], w[1], 130, 44] })) },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    /* the road, moving past */
    [140, 860].forEach(y => G.l([[0, y], [1000, y]], c.dim, 1.4));
    const run = (G.t * 70) % 120;
    [215, 785].forEach(y => { for (let i = 0; i < 10; i++) G.l([[i * 120 - run, y], [i * 120 - run + 56, y]], c.dim, 2.2); });
    /* what the sensors watch */
    G.a(0.1);
    [[[893, 500], [1000, 420], [1000, 580]], [[108, 500], [0, 440], [0, 560]], [[598, 318], [510, 150], [686, 150]], [[598, 682], [510, 850], [686, 850]]].forEach(v => poly(G, v, c.cool));
    G.a(1);
    const sweep = (G.t * 0.7) % 1;
    G.a(0.5 * (1 - sweep)); G.c(893, 500, 20 + sweep * 90, null, c.cool, 1); G.c(108, 500, 16 + sweep * 70, null, c.cool, 1); G.a(1);
    /* wheels, body, glass */
    carWheels.forEach(w => { rr(G, w[0], w[1], 130, 44, 10, c.up, c.line, 1.2); for (let k = 0; k < 9; k++) G.l([[w[0] + 10 + k * 13.8, w[1] + 5], [w[0] + 10 + k * 13.8, w[1] + 39]], c.dim, 0.7); });
    blob(G, carBody, c.mid, c.hi, 1.8);
    G.l([[708, 352], [724, 500], [708, 648]], c.dim, 1); G.l([[724, 392], [872, 428]], c.dim, 0.8); G.l([[724, 608], [872, 572]], c.dim, 0.8);
    G.l([[210, 350], [196, 500], [210, 650]], c.dim, 1);
    rr(G, 264, 372, 346, 256, 20, null, c.dim, 1);
    const glass = [[[610, 356], [694, 378], [694, 622], [610, 644]], [[226, 374], [264, 382], [264, 618], [226, 626]]], side = [[282, 350], [596, 344], [606, 360], [272, 366]];
    glass.forEach(g => poly(G, g, c.lo, c.line, 1)); poly(G, side, c.lo, c.dim, 0.8); poly(G, flipY(side), c.lo, c.dim, 0.8);
    /* seats, steering wheel, mirrors, lights */
    [[478, 392], [478, 532], [330, 392], [330, 532]].forEach(k => { rr(G, k[0], k[1], 76, 76, 14, c.up, c.dim, 1); rr(G, k[0] + 4, k[1] + 12, 14, 52, 6, null, c.dim, 0.8); });
    G.c(578, 432, 17, null, c.line, 1.2); G.l([[595, 432], [612, 432]], c.line, 1);
    const mirror = [[628, 326], [652, 326], [662, 306], [640, 302]], lamp = [[862, 380], [890, 430], [878, 436], [852, 390]];
    [mirror, flipY(mirror)].forEach(m => poly(G, m, c.mid, c.line, 1));
    [lamp, flipY(lamp)].forEach(m => poly(G, m, c.up, c.warm, 1.1));
    G.a(0.8); G.r(111, 410, 6, 44, c.red); G.r(111, 546, 6, 44, c.red); G.a(1);
    /* the wires, with messages travelling along them */
    carWires.forEach((w, i) => { G.l(w.p, c.cool, 1.2); const p = along2(w.p, (G.t * 0.5 + i * 0.13) % 1); G.a(0.9); G.r(p[0] - 4, p[1] - 4, 8, 8, c.cool); G.a(1); });
    G.c(hub[0], hub[1], 5, c.cool);
    ctrl.forEach((k, i) => { if (!i) return; G.r(k[0], k[1], k[2], k[3], c.up, c.line, 1); G.r(k[0] + k[2] * 0.3, k[1] + k[3] * 0.3, k[2] * 0.4, k[3] * 0.4, c.lo, c.dim, 0.7); G.l([[k[0] + 3, k[1] + 3], [k[0] + 3, k[1] + k[3] - 3]], c.warm, 0.8); });
    sensors.forEach(sn => { G.c(sn.c[0], sn.c[1], sn.c[2], c.lo, c.warm, 1.4); G.c(sn.c[0], sn.c[1], sn.c[2] * 0.4, c.warm); });
    /* the control unit the dive follows */
    G.r(ctrl[0][0] - 3, ctrl[0][1] - 3, 42, 42, c.up, c.hi, 1.4);
    inside(G, 'car');
    G.label('controllers', 760, 556); G.label('wiring', 300, 540); G.label('sensors', 905, 462, 'right'); G.label('wheels', 680, 278);
  }
};

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

export const SCENES = { building, rack, board, chip, phone, phoneboard, soc, car, ecu, mcu, scanner, wafer, die, block, gate, switch: swtch, atom, ...STATIONS };
/* a scene drawn by the dive itself tells how large the dive's box is */
Object.values(SCENES).forEach(sc => { const draw = sc.draw; sc.draw = function (G) { if (!NEST) measure(G); draw.call(sc, G); }; });
export const partsOf = id => SCENES[id].parts;
