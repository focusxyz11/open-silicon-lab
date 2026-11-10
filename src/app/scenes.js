/* The scenes of the dive, from Fable's world build (OSL-02), one per depth. Each is drawn in a 1000 x 1000
   space by draw(G), where G is the drawing helper from src/app/world.js. parts: the named shapes a
   question can light up ({ r: [x, y, w, h] } | { c: [x, y, r] } | { p: [[x, y], ...] }). Labels are text
   names: part.<depth>.<key> in src/i18n/en.json. No words in this file.
   A data centre: building, rack, board, chip. A phone: phone, phoneboard, soc. A car: car, ecu, mcu.
   Every chip: block, gate, switch, atom. */

const rnd = (i, j) => { const v = Math.sin(i * 127.1 + (j || 0) * 311.7) * 43758.5453; return v - Math.floor(v); };

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
    bCool.forEach(u => { G.r(u.r[0], u.r[1], u.r[2], u.r[3], c.mid, c.line, 1.1); G.c(u.r[0] + 24, u.r[1] + 20, 12, null, c.line, 1); G.c(u.r[0] + 70, u.r[1] + 20, 12, null, c.line, 1); });
    G.r(868, 200, 52, 580, c.mid, c.line, 1.1);
    for (let i = 0; i < 9; i++) G.r(876, 212 + i * 62, 36, 46, c.up, c.warm, 0.9);
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
      G.r(652, y + 12, 8, 8, rnd(i, Math.floor(G.t * 2)) > 0.3 ? c.cool : c.dim); G.r(652, y + 26, 8, 8, c.warm);
      G.l([[676, 96 + i * 2], [684 + i * 2, 96 + i * 2], [684 + i * 2, y + 36], [670, y + 36]], c.line, 0.8);
    });
    G.r(330, 862, 340, 66, c.up, c.line, 1.2);
    for (let i = 0; i < 4; i++) G.r(340 + i * 83, 872, 72, 46, c.mid, c.warm, 1);
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
    G.r(350, 350, 300, 300, c.up, c.hi, 1.6);
    for (let i = 0; i < 14; i++) { G.r(360 + i * 20, 358, 8, 8, c.line); G.r(360 + i * 20, 634, 8, 8, c.line); G.r(358, 380 + i * 18, 8, 8, c.line); G.r(634, 380 + i * 18, 8, 8, c.line); }
    G.r(425, 425, 150, 150, c.lo, c.line, 1.2);
    G.r(220, 858, 560, 32, c.up, c.line, 1.1);
    for (let i = 0; i < 40; i++) G.l([[228 + i * 14, 862], [228 + i * 14, 886]], c.warm, 1.4);
    G.label('bigchip', 350, 340); G.label('memory', 345, 216); G.label('power', 142, 240);
  }
};

/* ---- chip: compute blocks, memory, input and output, and the clock wires ---- */
const CORES = (() => { const cols = 4, rows = 3, w = 740 / cols, h = 470 / rows, out = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ r: [130 + i * w + 7, 130 + j * h + 7, w - 14, h - 14] }); return out; })();
const clock = [{ p: [[500, 136], [500, 594]] }, { p: [[315, 365], [685, 365]] }, { p: [[315, 208], [315, 522]] }, { p: [[685, 208], [685, 522]] }];
const chip = {
  parts: { cores: CORES, cache: [{ r: [130, 620, 740, 100] }], io: [{ r: [130, 740, 740, 90] }], clock },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(40, 40, 920, 920, c.mid, c.hi, 1.8);
    for (let i = 0; i < 22; i++) { const t = 78 + i * 39; G.r(t, 56, 24, 24, c.lo, c.line, 0.9); G.r(t, 920, 24, 24, c.lo, c.line, 0.9); G.r(56, t, 24, 24, c.lo, c.line, 0.9); G.r(920, t, 24, 24, c.lo, c.line, 0.9); }
    G.r(112, 112, 776, 776, c.lo, c.line, 1);
    CORES.forEach((k, n) => {
      const r = k.r, m = Math.min(r[2], r[3]) * 0.07;
      G.r(r[0], r[1], r[2], r[3], c.up, c.line, 1.2);
      G.r(r[0] + m, r[1] + m, r[2] * 0.52, r[3] * 0.5, c.mid, c.dim, 0.9);
      G.r(r[0] + r[2] * 0.6, r[1] + m, r[2] * 0.4 - m, r[3] * 0.3, c.mid, c.dim, 0.9);
      G.r(r[0] + r[2] * 0.6, r[1] + r[3] * 0.4, r[2] * 0.4 - m, r[3] * 0.6 - m, c.lo, c.dim, 0.9);
      G.r(r[0] + m, r[1] + r[3] * 0.62, r[2] * 0.52, r[3] * 0.38 - m, c.lo, c.dim, 0.9);
      if (rnd(n, Math.floor(G.t * 1.5)) > 0.55) { G.a(0.5); G.r(r[0] + m, r[1] + m, r[2] * 0.52, r[3] * 0.5, c.cool); G.a(1); }
    });
    clock.forEach(k => G.l(k.p, c.warm, 1.3));
    for (let i = 0; i < 6; i++) { const x = 136 + i * 123; G.r(x, 626, 113, 88, c.up, c.line, 1); for (let k = 1; k < 8; k++) G.l([[x + k * 14, 630], [x + k * 14, 710]], c.dim, 0.7); }
    for (let i = 0; i < 8; i++) G.r(136 + i * 92, 746, 82, 78, c.mid, c.line, 1);
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
        let w = 22 + Math.floor(rnd(i, n) * 44);
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
    G.label('gates', 452, 500); G.label('diff', 208, 400); G.label('metal', 128, 80);
  }
};

/* ---- switch: one transistor in cross-section: a gate wrapped around thin sheets of silicon ---- */
const sheets = [400, 520, 640].map(y => ({ r: [340, y, 320, 50] }));
const skins = [400, 520, 640].map(y => ({ r: [390, y - 8, 220, 66] }));
const swtch = {
  parts: { gate: [{ r: [390, 300, 220, 500] }], channel: sheets, oxide: skins, source: [{ r: [110, 340, 235, 460] }], drain: [{ r: [655, 340, 235, 460] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(0, 800, 1000, 200, c.mid, null);
    G.l([[0, 800], [1000, 800]], c.line, 1.2);
    G.r(110, 340, 235, 460, c.up, c.hi, 1.4); G.r(655, 340, 235, 460, c.up, c.hi, 1.4);
    G.a(0.45); G.r(180, 150, 90, 190, c.cool); G.r(730, 150, 90, 190, c.cool); G.r(465, 120, 70, 180, c.cool); G.a(1);
    G.r(180, 150, 90, 190, null, c.cool, 1.2); G.r(730, 150, 90, 190, null, c.cool, 1.2); G.r(465, 120, 70, 180, null, c.cool, 1.2);
    G.r(345, 300, 45, 500, c.mid, c.line, 1); G.r(610, 300, 45, 500, c.mid, c.line, 1);
    G.a(0.5); G.r(390, 300, 220, 500, c.red); G.a(1); G.r(390, 300, 220, 500, null, c.red, 1.5);
    skins.forEach(k => G.r(k.r[0], k.r[1], k.r[2], k.r[3], c.lo, c.warm, 1.6));
    sheets.forEach((sh, i) => {
      G.a(0.6); G.r(sh.r[0], sh.r[1], sh.r[2], sh.r[3], c.grn); G.a(1); G.r(sh.r[0], sh.r[1], sh.r[2], sh.r[3], null, c.grn, 1.3);
      for (let k = 0; k < 3; k++) { const x = 340 + (((G.t * 0.28 + k / 3 + i * 0.17) % 1) * 320); G.r(x - 5, sh.r[1] + 20, 10, 10, c.hi); }
    });
    G.label('gate', 470, 290); G.label('channel', 668, 560); G.label('source', 120, 330); G.label('drain', 880, 330, 'right'); G.label('oxide', 400, 386);
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
    for (let i = 0; i < 11; i++) {
      const x = ((G.t * 70 + i * 97) % 1000), y = 258 + (i % 7) * 95 + Math.sin(G.t * 2 + i) * 16;
      G.c(x, y, 6.5, c.cool); G.c(x, y, 2.4, c.dark ? '#fff' : c.lo);
    }
    G.label('boundary', 20, 142); G.label('dopant', 544, 470); G.label('lattice', 60, 968);
  }
};


/* A filled outline: the scenes below use it for shapes that are not boxes. */
const poly = (G, pts, fill, stroke, lw) => {
  const c = G.ctx; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = G.lw(lw || 1); c.stroke(); }
};
/* the pads around the edge of a die */
const pads = (G, n) => { const c = G.col, step = 880 / n; for (let i = 0; i < n; i++) { const t = 60 + i * step + step * 0.2, w = step * 0.6; G.r(t, 56, w, 24, c.lo, c.line, 0.9); G.r(t, 920, w, 24, c.lo, c.line, 0.9); G.r(56, t, 24, w, c.lo, c.line, 0.9); G.r(920, t, 24, w, c.lo, c.line, 0.9); } };

/* ======== a phone ======== */

/* ---- phone: the back opened, about fifteen centimetres tall: the main board, the battery, the camera ---- */
const phone = {
  parts: { board: [{ r: [380, 70, 300, 300] }], battery: [{ r: [310, 400, 380, 430] }], camera: [{ r: [300, 74, 68, 160] }], antenna: [{ r: [282, 30, 436, 14] }, { r: [282, 956, 436, 14] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(270, 30, 460, 940, c.mid, c.hi, 1.8);
    G.r(290, 50, 420, 900, c.lo, c.line, 1);
    /* the frame is the antenna, cut into bands */
    [[282, 30, 436, 14], [282, 956, 436, 14]].forEach(a => G.r(a[0], a[1], a[2], a[3], c.up, c.warm, 1));
    [[360, 30], [640, 30], [360, 956], [640, 956]].forEach(k => G.r(k[0], k[1], 6, 14, c.lo));
    /* the camera */
    G.r(300, 74, 68, 160, c.mid, c.line, 1.1);
    [112, 196].forEach(y => { G.c(334, y, 25, c.up, c.hi, 1.2); G.c(334, y, 13, c.lo, c.cool, 1); });
    /* the main board, a small copy of the next depth */
    G.r(380, 70, 300, 300, c.up, c.line, 1.2);
    G.r(503, 178, 72, 72, c.mid, c.hi, 1.2); G.r(515, 190, 48, 48, c.lo, c.dim, 0.8);
    G.r(425, 256, 48, 42, c.mid, c.line, 0.9); G.r(584, 124, 54, 45, c.mid, c.line, 0.9); G.r(425, 121, 60, 42, c.mid, c.line, 0.9);
    for (let i = 0; i < 18; i++) G.r(392 + rnd(i, 1) * 270, 82 + rnd(i, 2) * 270, 6, 4, c.dim);
    /* the battery, with its charge */
    G.r(310, 400, 380, 430, c.up, c.line, 1.2);
    G.r(330, 420, 340, 390, c.mid, c.dim, 0.8);
    const lvl = 0.55 + 0.1 * Math.sin(G.t * 0.4);
    G.a(0.35); G.r(330, 420 + 390 * (1 - lvl), 340, 390 * lvl, c.grn); G.a(1);
    G.r(470, 386, 60, 14, c.mid, c.line, 0.9);
    /* speaker and port */
    for (let i = 0; i < 8; i++) G.c(330 + i * 14, 900, 3.5, c.dim);
    G.r(450, 880, 100, 40, c.mid, c.line, 1);
    G.label('board', 384, 62); G.label('battery', 316, 846); G.label('camera', 300, 254); G.label('antenna', 722, 966, 'right');
  }
};

/* ---- phoneboard: five centimetres of board, packed on both sides; no fan ---- */
const passives = []; for (let i = 0; i < 70; i++) { const x = 90 + rnd(i, 11) * 820, y = 130 + rnd(i, 12) * 740; if (!(x > 380 && x < 680 && y > 330 && y < 630)) passives.push([x, y, i % 3 ? 14 : 22, i % 3 ? 8 : 12]); }
const phoneboard = {
  parts: { soc: [{ r: [410, 360, 240, 240] }], pmic: [{ r: [150, 620, 160, 140] }], modem: [{ r: [680, 180, 180, 150] }], storage: [{ r: [150, 170, 200, 140] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    poly(G, [[60, 100], [940, 100], [940, 640], [860, 640], [860, 900], [60, 900]], c.mid, c.hi, 1.6);
    [[90, 130], [910, 130], [90, 870]].forEach(h => G.c(h[0], h[1], 12, c.lo, c.line, 1));
    /* tiny resistors and capacitors everywhere */
    passives.forEach(q => { G.r(q[0], q[1], q[2], q[3], c.up, c.line, 0.6); G.r(q[0], q[1], 3, q[3], c.warm); G.r(q[0] + q[2] - 3, q[1], 3, q[3], c.warm); });
    /* the storage chip and the power chip with its coils */
    G.r(150, 170, 200, 140, c.up, c.line, 1.2); G.r(166, 186, 168, 108, c.mid, c.dim, 0.8);
    G.r(150, 620, 160, 140, c.up, c.line, 1.2);
    for (let i = 0; i < 3; i++) { G.r(330, 620 + i * 48, 40, 40, c.mid, c.line, 1); G.c(350, 640 + i * 48, 12, null, c.warm, 1.2); }
    /* the modem and its radio lines to the edge */
    G.r(680, 180, 180, 150, c.up, c.line, 1.2);
    [[700, 180, 700, 100], [760, 180, 760, 100], [860, 220, 940, 220]].forEach(l => G.l([[l[0], l[1]], [l[2], l[3]]], c.cool, 1.6));
    /* the phone's chip: the memory sits on top of the processor */
    G.l([[410, 480], [340, 480], [340, 300], [350, 300]], c.cool, 1.2); G.l([[530, 600], [530, 700], [310, 700]], c.warm, 1.2); G.l([[650, 420], [700, 420], [700, 330]], c.cool, 1.2);
    G.r(410, 360, 240, 240, c.up, c.hi, 1.6);
    for (let i = 0; i < 11; i++) { G.r(418 + i * 21, 366, 8, 6, c.line); G.r(418 + i * 21, 588, 8, 6, c.line); }
    G.r(430, 380, 200, 200, c.lo, c.line, 1.1);
    G.a(0.6); G.r(445, 395, 170, 170, c.mid); G.a(1);
    const pulse = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(G.t * 1.3));
    G.a(pulse); G.r(430, 380, 200, 200, c.warm); G.a(1);
    G.r(700, 720, 140, 50, c.up, c.line, 1); for (let i = 0; i < 12; i++) G.l([[708 + i * 11, 726], [708 + i * 11, 764]], c.warm, 1);
    G.label('soc', 410, 350); G.label('pmic', 150, 610); G.label('modem', 680, 170); G.label('storage', 150, 160);
  }
};

/* ---- soc: the phone's chip: every kind of work has its own district ---- */
const socCpu = [{ r: [140, 430, 140, 140] }, { r: [300, 430, 140, 140] }, { r: [140, 590, 90, 110] }, { r: [245, 590, 90, 110] }, { r: [350, 590, 90, 110] }];
const soc = {
  parts: { cpu: socCpu, gpu: [{ r: [500, 130, 370, 280] }], npu: [{ r: [500, 440, 370, 270] }], isp: [{ r: [130, 130, 330, 260] }], cache: [{ r: [130, 740, 740, 130] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(40, 40, 920, 920, c.mid, c.hi, 1.8); pads(G, 24);
    G.r(112, 112, 776, 776, c.lo, c.line, 1);
    /* the camera's district: a pipeline of stages */
    G.r(130, 130, 330, 260, c.mid, c.line, 1.2);
    for (let i = 0; i < 5; i++) { G.r(146 + i * 62, 170, 50, 180, c.up, c.dim, 0.9); if (i < 4) G.l([[196 + i * 62, 260], [208 + i * 62, 260]], c.cool, 1.4); }
    /* the graphics district: many small identical cores */
    G.r(500, 130, 370, 280, c.mid, c.line, 1.2);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) G.r(514 + i * 59, 146 + j * 64, 50, 54, rnd(i * 4 + j, Math.floor(G.t * 2)) > 0.6 ? c.up : c.lo, c.dim, 0.8);
    /* the AI district: a grid of multiply units, data flowing across it */
    G.r(500, 440, 370, 270, c.mid, c.line, 1.2);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) G.r(514 + i * 29.5, 456 + j * 30.5, 22, 22, c.up, null);
    const w = (G.t * 0.5) % 1;
    G.a(0.55); for (let j = 0; j < 8; j++) G.r(514 + ((w + j * 0.07) % 1) * 330, 456 + j * 30.5, 22, 22, c.cool); G.a(1);
    /* the processor: two big cores, three little ones */
    socCpu.forEach((k, n) => {
      const r = k.r; G.r(r[0], r[1], r[2], r[3], c.up, c.line, 1.2);
      G.r(r[0] + 8, r[1] + 8, r[2] * 0.55, r[3] * 0.5, c.mid, c.dim, 0.8); G.r(r[0] + r[2] * 0.62, r[1] + 8, r[2] * 0.38 - 8, r[3] - 16, c.lo, c.dim, 0.8);
      if (rnd(n, Math.floor(G.t * 1.5)) > 0.5) { G.a(0.45); G.r(r[0] + 8, r[1] + 8, r[2] * 0.55, r[3] * 0.5, c.warm); G.a(1); }
    });
    /* shared memory along the bottom */
    G.r(130, 740, 740, 130, c.mid, c.line, 1.2);
    for (let i = 0; i < 8; i++) { const x = 140 + i * 91; G.r(x, 750, 82, 110, c.up, c.dim, 0.8); for (let k = 1; k < 6; k++) G.l([[x + k * 14, 756], [x + k * 14, 854]], c.dim, 0.6); }
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
const car = {
  parts: { controllers: ctrl.map(r => ({ r })), wiring: carWires, sensors, wheels: [{ r: [200, 288, 130, 44] }, { r: [200, 668, 130, 44] }, { r: [680, 288, 130, 44] }, { r: [680, 668, 130, 44] }] },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    for (let i = 0; i < 9; i++) G.l([[40 + i * 120, 820], [100 + i * 120, 820]], c.dim, 2);
    [[200, 288], [200, 668], [680, 288], [680, 668]].forEach(w => G.r(w[0], w[1], 130, 44, c.up, c.line, 1.2));
    poly(G, [[150, 320], [820, 320], [880, 360], [905, 500], [880, 640], [820, 680], [150, 680], [110, 630], [96, 500], [110, 370]], c.mid, c.hi, 1.8);
    poly(G, [[620, 345], [700, 368], [700, 632], [620, 655]], c.lo, c.line, 1);
    poly(G, [[210, 360], [256, 370], [256, 630], [210, 640]], c.lo, c.line, 1);
    [[380, 350], [380, 560], [500, 350], [500, 560]].forEach(k => G.r(k[0], k[1], 90, 90, null, c.dim, 0.8));
    /* the wires, with messages travelling along them */
    carWires.forEach((w, i) => { G.l(w.p, c.cool, 1.2); const u = (G.t * 0.5 + i * 0.13) % 1, a = w.p[0], b = w.p[w.p.length - 1]; G.a(0.9); G.r(a[0] + (b[0] - a[0]) * u - 4, a[1] + (b[1] - a[1]) * u - 4, 8, 8, c.cool); G.a(1); });
    ctrl.forEach((k, i) => { G.r(k[0], k[1], k[2], k[3], c.up, i ? c.line : c.hi, i ? 1 : 1.6); G.r(k[0] + k[2] * 0.3, k[1] + k[3] * 0.3, k[2] * 0.4, k[3] * 0.4, c.lo, c.dim, 0.7); });
    sensors.forEach(sn => G.c(sn.c[0], sn.c[1], sn.c[2], c.lo, c.warm, 1.4));
    G.label('controllers', 760, 556); G.label('wiring', 300, 540); G.label('sensors', 905, 470, 'right'); G.label('wheels', 680, 278);
  }
};

/* ---- ecu: one control unit, its lid off: a small chip that decides, big parts that push ---- */
const drivers = [0, 1, 2, 3].map(i => ({ r: [660, 210 + i * 110, 110, 80] }));
const ecu = {
  parts: { mcu: [{ r: [425, 395, 100, 100] }], connector: [{ r: [120, 190, 90, 620] }], drivers },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(60, 120, 880, 760, c.mid, c.hi, 1.8);
    G.r(100, 160, 800, 680, c.up, c.line, 1.2);
    /* the connector to the car's wires */
    G.r(120, 190, 90, 620, c.mid, c.line, 1.2);
    for (let i = 0; i < 26; i++) { G.c(148, 212 + i * 23, 6, c.lo, c.warm, 1); G.c(182, 212 + i * 23, 6, c.lo, c.warm, 1); }
    /* wires from the connector to the chip, and from the chip to the drivers */
    for (let i = 0; i < 6; i++) G.l([[210, 300 + i * 60], [300 + i * 14, 300 + i * 60], [300 + i * 14, 410 + i * 14], [425, 410 + i * 14]], c.cool, 1.1);
    drivers.forEach((d, i) => G.l([[525, 410 + i * 24], [600, 410 + i * 24], [600, d.r[1] + 40], [660, d.r[1] + 40]], c.warm, 1.6));
    /* capacitors, a clock crystal, a transceiver */
    [[300, 230], [300, 760], [560, 770], [800, 770]].forEach(k => { G.c(k[0], k[1], 30, c.mid, c.line, 1.1); G.c(k[0], k[1], 12, null, c.dim, 0.8); });
    G.r(555, 330, 50, 24, c.mid, c.line, 1);
    G.r(290, 580, 70, 56, c.mid, c.line, 1);
    /* the drivers: power parts that switch real current, on a metal strip that takes their heat */
    G.r(790, 190, 60, 470, c.mid, c.line, 1);
    for (let i = 0; i < 10; i++) G.l([[796, 205 + i * 45], [844, 205 + i * 45]], c.dim, 1);
    drivers.forEach((d, i) => { const r = d.r; G.r(r[0], r[1], r[2], r[3], c.mid, c.line, 1.2); G.r(r[0] + 14, r[1] + 14, r[2] - 28, r[3] - 28, c.lo, c.warm, 1); G.a(0.25 + 0.25 * (0.5 + 0.5 * Math.sin(G.t * 2 + i))); G.r(r[0] + 14, r[1] + 14, r[2] - 28, r[3] - 28, c.warm); G.a(1); });
    /* the microcontroller */
    G.r(425, 395, 100, 100, c.mid, c.hi, 1.5);
    for (let i = 0; i < 9; i++) { G.r(430 + i * 10.5, 387, 5, 8, c.line); G.r(430 + i * 10.5, 495, 5, 8, c.line); G.r(417, 400 + i * 10.5, 8, 5, c.line); G.r(525, 400 + i * 10.5, 8, 5, c.line); }
    G.r(455, 425, 40, 40, c.lo, c.line, 1);
    G.label('mcu', 425, 386); G.label('connector', 120, 180); G.label('drivers', 660, 200);
  }
};

/* ---- mcu: a microcontroller: two small cores in step, the memory that keeps its program, and its senses ---- */
const mcuCores = [{ r: [130, 130, 150, 260] }, { r: [300, 130, 150, 260] }];
const periph = [{ r: [130, 590, 180, 130] }, { r: [330, 590, 180, 130] }, { r: [530, 590, 160, 130] }, { r: [710, 590, 160, 130] }];
const mcu = {
  parts: { cores: mcuCores, flash: [{ r: [490, 130, 380, 420] }], sram: [{ r: [130, 420, 320, 130] }], periph },
  draw(G) {
    const c = G.col;
    G.bg(c.lo);
    G.r(40, 40, 920, 920, c.mid, c.hi, 1.8); pads(G, 14);
    G.r(112, 112, 776, 776, c.lo, c.line, 1);
    /* the two cores run the same work; a checker compares them */
    mcuCores.forEach((k, n) => {
      const r = k.r; G.r(r[0], r[1], r[2], r[3], c.up, c.line, 1.2);
      G.r(r[0] + 10, r[1] + 10, r[2] - 20, r[3] * 0.45, c.mid, c.dim, 0.8); G.r(r[0] + 10, r[1] + r[3] * 0.55, r[2] - 20, r[3] * 0.4, c.lo, c.dim, 0.8);
      if (Math.floor(G.t * 1.5) % 2) { G.a(0.45); G.r(r[0] + 10, r[1] + 10, r[2] - 20, r[3] * 0.45, c.warm); G.a(1); }
    });
    G.r(282, 240, 16, 40, c.mid, c.grn, 1.2);
    /* flash memory: the program, kept with the power off */
    G.r(490, 130, 380, 420, c.mid, c.line, 1.2);
    for (let i = 0; i < 18; i++) for (let j = 0; j < 20; j++) G.r(500 + i * 20.5, 140 + j * 20.3, 15, 15, rnd(i * 20 + j, 3) > 0.35 ? c.up : c.lo, null);
    G.r(130, 420, 320, 130, c.mid, c.line, 1.2);
    for (let i = 0; i < 15; i++) for (let j = 0; j < 5; j++) G.r(138 + i * 20.5, 428 + j * 23.5, 15, 17, rnd(i * 5 + j, Math.floor(G.t)) > 0.8 ? c.cool : c.up, null);
    /* its senses and its hands: a converter for signals, a link to the car's network, timers */
    periph.forEach((k, n) => {
      const r = k.r; G.r(r[0], r[1], r[2], r[3], c.mid, c.line, 1.2);
      if (n === 0) { const pts = []; for (let i = 0; i <= 30; i++) pts.push([r[0] + 12 + i * ((r[2] - 24) / 30), r[1] + r[3] / 2 + Math.sin(i * 0.5 + G.t * 2) * 30]); G.l(pts, c.grn, 1.4); }
      else for (let i = 0; i < 4; i++) G.r(r[0] + 12 + i * ((r[2] - 24) / 4), r[1] + 20, (r[2] - 24) / 4 - 8, r[3] - 40, c.up, c.dim, 0.8);
    });
    G.r(130, 750, 740, 120, c.mid, c.line, 1);
    for (let i = 0; i < 4; i++) G.c(200 + i * 190, 810, 34, null, c.dim, 1);
    G.label('cores', 136, 124); G.label('flash', 494, 124); G.label('sram', 136, 414); G.label('periph', 136, 584);
  }
};

export const SCENES = { building, rack, board, chip, phone, phoneboard, soc, car, ecu, mcu, block, gate, switch: swtch, atom };
export const partsOf = id => SCENES[id].parts;
