/* Your chip, zoomed: the My chip view's journey through scale, from the demo board on your desk to
   one transistor in your design switching. The model is src/engines/chipzoom.js (tested); this file
   draws it. Flip the board's switches and the same values light the LEDs, run along the wires,
   open and close the transistors and fill the channel of the one you zoom into. */
import { clamp, RM, fit, rgba, fmtLen, inView } from '../core/ui.js';
import { t } from '../core/i18n.js';
import { build, signals, evalCell, dual, GATE, SHARED } from '../engines/chipzoom.js';

const IDS = ['board', 'pkg', 'die', 'tile', 'design', 'cell', 'fet'];
/* Kept between renders of the view, so changing the design keeps where you are. */
const K = { t: 0, cell: null, fet: null, ins: {}, key: '', state: {}, ticks: 0 };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Photo-like colours: the drawing looks the same in light and dark mode, like a microscope image. */
const C = {
  bg: '#081117', pcb: '#0f3b2c', pcbHi: '#17543f', trace: '#2b7a5b', gold: '#d6b35a', pkg: '#1b1f23', pkgEdge: '#30373d',
  die: '#4d5277', tile: '#383c5a', tileHi: '#5b6190', mine: '#f0b13c', row: 'rgba(255,255,255,.05)', m2: '#5aa5d6', m3: '#b48ad6',
  one: '#f0b13c', zero: '#3f6b85', ink: '#e8eef2', mute: '#8c9da8', on: '#f0b13c', off: '#5f6f7b',
  sub: '#3a2f4f', nwell: '#2f3f5a', ndiff: '#3b6e8f', pdiff: '#8f5a3b', oxide: '#c9d2d8', poly: '#a33f3f', metal: '#8a8f99'
};
const CELLC = { INV: '#8fa3b3', BUF: '#8fa3b3', NAND2: '#9b8ce0', NOR2: '#c58ab3', AND2: '#7f9fe0', OR2: '#d6a35a', XOR2: '#5fb7a8', XNOR2: '#5fb7a8', TIE0: '#888888', TIE1: '#888888', DFF: '#e07a5f' };
const val = v => v === 1 ? C.one : C.zero;
const FONT = '"IBM Plex Sans", sans-serif'; /* i18n-ok: a font name */

/* The section's markup, for renderMyChip. */
export function zoomSection() {
  return '<section class="wrap czsec"><div class="vbar"><h2>' + t('cz.h2') + '</h2></div><p class="lede small">' + t('cz.lede') + '</p>' +
    '<div class="czgrid"><div class="viewer czview"><canvas id="yczCv" role="img" aria-label="' + esc(t('cz.label')) + '"></canvas>' +
    '<div class="vhud"><div><span id="yczIdx"></span><b id="yczName"></b></div><div class="fov">' + t('cz.fov') + '<b id="yczFov"></b></div></div>' +
    '<div class="scalebar"><span id="yczBar"></span><i id="yczBarI"></i></div></div>' +
    '<div class="czside"><div class="levels" id="yczLevels" role="group" aria-label="' + esc(t('cz.levels')) + '"></div>' +
    '<input type="range" id="yczRange" min="0" max="600" step="1" value="0" aria-label="' + esc(t('cz.levels')) + '">' +
    '<div class="row"><button type="button" class="btn primary" id="yczPlay"></button><button type="button" class="btn" id="yczBack">' + t('cz.back') + '</button></div>' +
    '<p class="eyebrow">' + t('cz.switches') + '</p><div class="seg czins" id="yczIns" role="group" aria-label="' + esc(t('cz.switches')) + '"></div>' +
    '<p class="eyebrow">' + t('cz.leds') + '</p><div class="czouts" id="yczOuts"></div>' +
    '<div class="row" id="yczClock" hidden><button type="button" class="btn primary" id="yczTick">' + t('cz.tick') + '</button><button type="button" class="btn" id="yczRst">' + t('cz.reset') + '</button><span class="small muted" id="yczTicks"></span></div>' +
    '<p class="czdesc" id="yczDesc" aria-live="polite"></p><p class="small muted" id="yczTip"></p></div></div>' +
    '<p class="note">' + t('cz.note') + '</p></section>';
}

let run = 0;
/* Start the zoom on the canvas renderMyChip just wrote. d: the design as the studio keeps it. */
export function mountZoom(d) {
  const cv = document.getElementById('yczCv'); if (!cv) return;
  const me = ++run, $ = id => document.getElementById(id);
  const key = d.p + '|' + d.node;
  if (K.key !== key) { K.key = key; K.cell = null; K.fet = null; K.ins = {}; K.state = {}; K.ticks = 0; }
  let Z = build(d, { cell: K.cell, fet: K.fet });
  if (!Z.ok) return;
  const N = IDS.length;
  let S = null;
  const ins = () => Z.proj.ins.map(k => K.ins[k] | 0);
  function resim() {
    S = signals(Z, ins(), K.state);
    const clocked = (Z.SY.M.regs || []).length > 0; $('yczClock').hidden = !clocked; if (clocked) $('yczTicks').textContent = t('cz.ticks', { n: K.ticks });
    $('yczIns').innerHTML = Z.proj.ins.map(k => '<button type="button" data-in="' + esc(k) + '" aria-pressed="' + (K.ins[k] ? 'true' : 'false') + '">' + esc(k) + ' = ' + (K.ins[k] | 0) + '</button>').join('');
    $('yczOuts').innerHTML = Z.proj.outs.map(k => '<span class="' + (S.out[k] ? 'lit' : '') + '"><i aria-hidden="true"></i>' + esc(k) + ' = ' + S.out[k] + '</span>').join('');
    lastIdx = -1; draw(performance.now());
  }
  $('yczTick').addEventListener('click', () => { K.state = S.next; K.ticks++; resim(); });
  $('yczRst').addEventListener('click', () => { K.state = {}; K.ticks = 0; resim(); });
  $('yczIns').addEventListener('click', e => { const b = e.target.closest('[data-in]'); if (!b) return; K.ins[b.dataset.in] = K.ins[b.dataset.in] ? 0 : 1; resim(); });

  /* ---- the scenes, each drawn in [-1, 1]; u = pixels per unit, sec = time ---- */
  const half = id => Z.levels[IDS.indexOf(id)].size / 2;          /* meters per unit at that level */
  /* Text is drawn in screen pixels: browsers round very small font sizes, which squashes letters. */
  const text = (c, s, x, y, px, u, col, align) => {
    const m = c.getTransform(), q = m.transformPoint(new DOMPoint(x, y)), d = m.a / u;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = '600 ' + Math.round(px * d) + 'px ' + FONT; c.fillStyle = col || C.ink; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillText(s, q.x, q.y); c.restore();
  };

  function sBoard(c, u) {
    c.fillStyle = C.bg; c.fillRect(-3, -3, 6, 6);
    c.fillStyle = C.pcb; c.fillRect(-0.92, -0.64, 1.84, 1.28);
    c.strokeStyle = C.trace; c.lineWidth = 2 / u; c.beginPath();
    for (let i = 0; i < 9; i++) { const y = -0.5 + i * 0.12; c.moveTo(-0.85, y); c.lineTo(-0.3, y); c.lineTo(-0.2, y * 0.4); }
    for (let i = 0; i < 9; i++) { const y = -0.5 + i * 0.12; c.moveTo(0.85, y); c.lineTo(0.3, y); c.lineTo(0.2, y * 0.4); }
    c.stroke();
    c.fillStyle = C.gold; for (const [x, y] of [[-0.86, -0.58], [0.86, -0.58], [-0.86, 0.58], [0.86, 0.58]]) { c.beginPath(); c.arc(x, y, 0.025, 0, 6.283); c.fill(); }
    /* a helper microcontroller and a USB socket, as on Tiny Tapeout's demo board (fact tt-demoboard) */
    c.fillStyle = C.pkg; c.fillRect(-0.7, -0.2, 0.2, 0.2); c.fillStyle = C.metal; c.fillRect(-0.95, -0.08, 0.12, 0.16);
    /* the carrier board with your chip in the middle */
    c.fillStyle = C.pcbHi; c.fillRect(-0.16, -0.2, 0.32, 0.32); c.fillStyle = C.pkg; c.fillRect(-0.1, -0.14, 0.2, 0.2);
    /* switches drive the inputs, LEDs show the outputs */
    const I = Z.proj.ins, O = Z.proj.outs;
    I.forEach((k, j) => { const x = -0.6 + (j + 0.5) * 1.2 / I.length, on = K.ins[k] | 0; c.fillStyle = '#c23b3b'; c.fillRect(x - 0.035, 0.32, 0.07, 0.14); c.fillStyle = '#f2f2f2'; c.fillRect(x - 0.022, on ? 0.335 : 0.4, 0.044, 0.045); text(c, k, x, 0.53, 12, u, C.ink); });
    O.forEach((k, j) => { const x = -0.6 + (j + 0.5) * 1.2 / O.length, on = S.out[k]; if (on) { const g = c.createRadialGradient(x, -0.42, 0, x, -0.42, 0.09); g.addColorStop(0, 'rgba(255,90,60,.7)'); g.addColorStop(1, 'rgba(255,90,60,0)'); c.fillStyle = g; c.fillRect(x - 0.1, -0.52, 0.2, 0.2); } c.fillStyle = on ? '#ff5a3c' : '#4a1f1a'; c.beginPath(); c.arc(x, -0.42, 0.03, 0, 6.283); c.fill(); text(c, k, x, -0.53, 12, u, C.ink); });
  }
  function sPkg(c, u) {
    const m = half('pkg'), body = 0.0035 / m, dh = Z.um.dieW / 2 / m, dv = Z.um.dieH / 2 / m;
    c.fillStyle = C.pcbHi; c.fillRect(-2, -2, 4, 4);
    c.fillStyle = C.gold; const n = 16;
    for (let k = 0; k < n; k++) { const p = -body + (k + 0.5) * 2 * body / n; c.fillRect(p - 0.02, -body - 0.06, 0.04, 0.07); c.fillRect(p - 0.02, body - 0.01, 0.04, 0.07); c.fillRect(-body - 0.06, p - 0.02, 0.07, 0.04); c.fillRect(body - 0.01, p - 0.02, 0.07, 0.04); }
    c.fillStyle = C.pkg; c.fillRect(-body, -body, 2 * body, 2 * body); c.strokeStyle = C.pkgEdge; c.lineWidth = 2 / u; c.strokeRect(-body, -body, 2 * body, 2 * body);
    /* the lid is off: bond wires from the die's pads to the package's pins */
    c.strokeStyle = 'rgba(214,179,90,.8)'; c.lineWidth = 1 / u; c.beginPath();
    for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, p = -body + f * 2 * body; c.moveTo(-dh + f * 2 * dh, -dv); c.lineTo(p, -body + 0.03); c.moveTo(-dh + f * 2 * dh, dv); c.lineTo(p, body - 0.03); c.moveTo(-dh, -dv + f * 2 * dv); c.lineTo(-body + 0.03, p); c.moveTo(dh, -dv + f * 2 * dv); c.lineTo(body - 0.03, p); }
    c.stroke();
    c.fillStyle = C.die; c.fillRect(-dh, -dv, 2 * dh, 2 * dv);
  }
  const tiles = (() => { const out = []; let s = 7; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; for (let i = 0; i < SHARED.cols * SHARED.rows; i++) out.push([r(), r(), r()]); return out; })();
  function sDie(c, u) {
    const m = half('die'), U = Z.um, W = U.dieW / m, H = U.dieH / m, tw = U.tw / m, th = U.th / m, g = U.gap / m;
    c.fillStyle = C.bg; c.fillRect(-2, -2, 4, 4);
    c.fillStyle = '#2c3048'; c.fillRect(-W / 2, -H / 2, W, H);
    c.fillStyle = C.gold; for (let k = 0; k < 30; k++) { const f = (k + 0.5) / 30; c.fillRect(-W / 2 + f * W - 0.012, -H / 2 + 0.006, 0.024, 0.024); c.fillRect(-W / 2 + f * W - 0.012, H / 2 - 0.03, 0.024, 0.024); }
    /* the shared control strip, then 160 tiles: other people's designs, and yours */
    c.fillStyle = '#454a6a'; c.fillRect(-W / 2 + g, H / 2 - g - 0.05 * U.tw / m, W - 2 * g, 0.05 * U.tw / m * 0.8);
    for (let r = 0; r < SHARED.rows; r++) for (let q = 0; q < SHARED.cols; q++) {
      const x = -W / 2 + g + q * tw, y = -H / 2 + g + r * th, R = tiles[r * SHARED.cols + q], mine = q === SHARED.mine[0] && r === SHARED.mine[1];
      c.fillStyle = mine ? C.tileHi : C.tile; c.fillRect(x + tw * 0.04, y + th * 0.05, tw * 0.92, th * 0.9);
      if (!mine) { c.fillStyle = 'rgba(200,205,255,' + (0.08 + R[2] * 0.12) + ')'; c.fillRect(x + tw * 0.08, y + th * 0.1, tw * (0.2 + R[0] * 0.66), th * (0.2 + R[1] * 0.6)); }
    }
    const x = -W / 2 + g + SHARED.mine[0] * tw, y = -H / 2 + g + SHARED.mine[1] * th;
    c.strokeStyle = C.mine; c.lineWidth = 2 / u; c.strokeRect(x + tw * 0.04, y + th * 0.05, tw * 0.92, th * 0.9);
  }
  function sTile(c, u) {
    const m = half('tile'), U = Z.um, tw = U.tw / m, th = U.th / m;
    c.fillStyle = C.tile; c.fillRect(-2, -2, 4, 4);
    c.fillStyle = '#30344f'; c.fillRect(-tw / 2, -th / 2, tw, th);
    const rowH = U.cH / m; c.fillStyle = C.row; for (let y = -th / 2 + rowH; y < th / 2 - rowH; y += rowH * 2) c.fillRect(-tw / 2 + 0.02, y, tw - 0.04, rowH);
    c.fillStyle = 'rgba(180,138,214,.18)'; for (let x = -tw / 2 + tw / 8; x < tw / 2; x += tw / 4) c.fillRect(x, -th / 2, 0.012, th);
    /* your design, at its real size in the corner of the tile */
    const s = U.inTile, bw = U.dW * s / m, bh = U.dH * s / m, bx = -tw / 2 + 0.06 * U.tw / m, by = -th / 2 + 0.08 * U.th / m;
    c.fillStyle = '#5b5f86'; c.fillRect(bx, by, bw, bh);
    Z.cells.forEach(cl => { c.fillStyle = CELLC[cl.type]; c.fillRect(bx + cl.x / Z.PL.GW * bw, by + cl.y / Z.PL.H * bh, cl.w / Z.PL.GW * bw, 3 / Z.PL.H * bh); });
    c.strokeStyle = C.mine; c.lineWidth = 2 / u; c.strokeRect(bx, by, bw, bh);
  }
  /* design coordinates: grid steps to units of the design level */
  const dX = gx => (gx * Z.um.ux - Z.um.dW / 2) / half('design'), dY = gy => (gy * Z.um.uy - Z.um.dH / 2) / half('design');
  function sDesign(c, u) {
    const PL = Z.PL, ux = Z.um.ux / half('design'), uy = Z.um.uy / half('design');
    c.fillStyle = '#30344f'; c.fillRect(-3, -3, 6, 6);
    c.fillStyle = '#5b5f86'; c.fillRect(dX(0), dY(0), PL.GW * ux, PL.H * uy);
    c.fillStyle = 'rgba(255,255,255,.05)'; for (let r = 0; r < PL.rows; r++) c.fillRect(dX(2), dY(r * PL.TR + 1), (PL.GW - 4) * ux, 3 * uy);
    Z.cells.forEach((cl, i) => {
      c.fillStyle = CELLC[cl.type]; c.globalAlpha = 0.85; c.fillRect(dX(cl.x) + ux * 0.08, dY(cl.y) + uy * 0.1, cl.w * ux - ux * 0.16, 3 * uy - uy * 0.2); c.globalAlpha = 1;
      if (cl.w * ux * u > 34) text(c, cl.type === 'DFF' ? 'DFF ' + S.net[cl.out] : cl.type, dX(cl.x + cl.w / 2), dY(cl.y + 0.55), Math.min(11, cl.w * ux * u / 5), u, '#10161a');
      if (i === Z.pick) { c.strokeStyle = C.mine; c.lineWidth = 2.5 / u; c.strokeRect(dX(cl.x), dY(cl.y), cl.w * ux, 3 * uy); }
    });
    /* the routed wires, coloured by the value they carry */
    const GW = PL.GW;
    Object.entries(Z.RT.paths).forEach(([n, segs]) => {
      const col = val(S.net[n]); c.strokeStyle = col; c.lineWidth = Math.max(1.2, Math.min(ux, uy) * u * 0.35) / u;
      segs.forEach(p => { for (let k = 1; k < p.length; k++) { const a = p[k - 1], b = p[k]; if (a % 2 !== b % 2) { const q = (a - a % 2) / 2, x = q % GW, y = (q - x) / GW; c.fillStyle = col; c.fillRect(dX(x + 0.5) - 1.6 / u, dY(y + 0.5) - 1.6 / u, 3.2 / u, 3.2 / u); continue; } const qa = (a - a % 2) / 2, qb = (b - b % 2) / 2, xa = qa % GW, ya = (qa - xa) / GW, xb = qb % GW, yb = (qb - xb) / GW; c.globalAlpha = a % 2 ? 0.75 : 1; c.beginPath(); c.moveTo(dX(xa + 0.5), dY(ya + 0.5)); c.lineTo(dX(xb + 0.5), dY(yb + 0.5)); c.stroke(); c.globalAlpha = 1; } });
    });
    /* pins */
    const pin = (x, y, name, v, right) => { c.fillStyle = val(v); c.fillRect(dX(x + 0.1), dY(y + 0.1), 0.8 * ux, 0.8 * uy); text(c, name + '=' + v, dX(right ? x + 1.4 : x - 0.4), dY(y + 0.5), 11, u, C.ink, right ? 'left' : 'right'); };
    Z.SY.M.inputs.forEach(p => { const io = PL.ioIn[p.net]; pin(io.x, io.y, p.name, S.net[p.net], false); });
    Object.entries(PL.ioOut).forEach(([name, io]) => pin(io.x, io.y, name, S.out[name], true));
  }
  function sCell(c, u, sec) {
    const m = half('cell'), w = Z.um.cW / m, h = Z.um.cH / m, x0 = -w / 2, y0 = -h / 2, X = f => x0 + f * w, Y = f => y0 + f * h;
    const cl = Z.cell, E = evalCell(cl.type, S.cellIns[Z.pick]), V = E.v, lw = Math.max(1.5, w * u * 0.006) / u;
    c.fillStyle = '#30344f'; c.fillRect(-3, -3, 6, 6);
    c.fillStyle = CELLC[cl.type]; c.globalAlpha = 0.25; c.fillRect(x0, y0, w, h); c.globalAlpha = 1;
    c.strokeStyle = CELLC[cl.type]; c.lineWidth = lw; c.strokeRect(x0, y0, w, h);
    const fs = Math.max(10, Math.min(14, w * u / 26));
    c.fillStyle = C.one; c.fillRect(x0, Y(0.04), w, h * 0.03); c.fillStyle = C.zero; c.fillRect(x0, Y(0.93), w, h * 0.03);
    text(c, t('cz.vdd'), X(0.012), Y(0.02), fs * 0.85, u, C.mute, 'left'); text(c, t('cz.gnd'), X(0.012), Y(0.985), fs * 0.85, u, C.mute, 'left');
    const wire = (xa, ya, xb, yb, on) => { c.strokeStyle = on ? C.on : C.off; c.lineWidth = lw; c.beginPath(); c.moveTo(X(xa), Y(ya)); c.lineTo(X(xb), Y(yb)); c.stroke(); };
    /* a transistor as a switch: closed and bright when on */
    const fet = (f, on) => {
      const cx = f.x, top = f.box.y + f.box.h * 0.22, bot = f.box.y + f.box.h * 0.78, mid = (top + bot) / 2, gp = f.box.h * 0.14;
      wire(cx, f.box.y, cx, mid - gp, on); wire(cx, mid + gp, cx, f.box.y + f.box.h, on);
      c.strokeStyle = on ? C.on : C.off; c.lineWidth = lw * 1.6; c.beginPath(); c.moveTo(X(cx), Y(mid - gp)); c.lineTo(on ? X(cx) : X(cx + f.box.w * 0.22), Y(mid + gp)); c.stroke();
      const gname = f.gate === '1' || f.gate === '0' ? f.gate : f.gate, gv = f.gate === '1' ? 1 : f.gate === '0' ? 0 : V[f.gate];
      c.fillStyle = f.kind === 'p' ? '#c58ab3' : '#7fb0e0'; c.beginPath(); c.arc(X(cx - f.box.w * 0.18), Y(mid), Math.min(w * f.box.w, h * f.box.h) * 0.07, 0, 6.283); c.fill();
      text(c, gname + '=' + gv, X(cx - f.box.w * 0.18), Y(mid + f.box.h * 0.2), fs * 0.8, u, C.ink);
      if (f.i === Z.fetI) { c.strokeStyle = C.mine; c.setLineDash([4 / u, 3 / u]); c.lineWidth = lw; c.strokeRect(X(f.box.x + f.box.w * 0.05), Y(f.box.y + f.box.h * 0.05), w * f.box.w * 0.9, h * f.box.h * 0.9); c.setLineDash([]); }
    };
    /* networks: series stack top to bottom, parallel branches share a bar at the top and bottom */
    const net = (n, kind, on) => {
      if (n.fet != null) { const f = Z.circuit.fets[n.fet]; fet(f, E.on[n.fet]); return; }
      const b = n.box, kids = n.s || n.p;
      if (n.p) { const xs = kids.map(k => k.box.x + k.box.w / 2); wire(xs[0], b.y, xs[xs.length - 1], b.y, on); wire(xs[0], b.y + b.h, xs[xs.length - 1], b.y + b.h, on); }
      kids.forEach(k => net(k, kind, on));
      if (n.p) kids.forEach(k => { const cx = k.box.x + k.box.w / 2, kx = k.fet != null ? cx : cx; wire(kx, b.y, kx, k.box.y, on); wire(kx, k.box.y + k.box.h, kx, b.y + b.h, on); });
    };
    Z.circuit.stages.forEach(st => {
      const mx = st.mid, outV = V[st.out], up = outV === 1, down = outV === 0;
      wire(mx, 0.055, mx, 0.12, up); net(st.pu, 'p', up); wire(mx, 0.46, mx, 0.54, true);
      net(st.pd, 'n', down); wire(mx, 0.88, mx, 0.94, down);
      c.fillStyle = val(outV); c.beginPath(); c.arc(X(mx), Y(0.5), Math.min(w, h) * 0.022, 0, 6.283); c.fill();
      text(c, st.out + '=' + outV, X(mx + st.box.w * 0.08), Y(0.5), fs, u, C.ink, 'left');
    });
  }
  function sFet(c, u, sec) {
    const f = Z.circuit.fets[Z.fetI], on = evalCell(Z.cell.type, S.cellIns[Z.pick]).on[Z.fetI];
    const gate = f.gate === '1' ? 1 : f.gate === '0' ? 0 : evalCell(Z.cell.type, S.cellIns[Z.pick]).v[f.gate];
    const L = 2 / 7, p = f.kind === 'p', node = Z.node, fs = 13;
    c.fillStyle = C.bg; c.fillRect(-3, -3, 6, 6);
    c.fillStyle = p ? C.nwell : C.sub; c.fillRect(-1, 0.05, 2, 1);
    if (node === '3') {
      /* gate all around: three thin silicon sheets run from source to drain, and the gate wraps each one */
      c.fillStyle = p ? C.pdiff : C.ndiff; c.fillRect(-0.88, -0.26, 0.88 - L / 2 - 0.03, 0.5); c.fillRect(L / 2 + 0.03, -0.26, 0.88 - L / 2 - 0.03, 0.5);
      c.fillStyle = C.metal; c.fillRect(-0.62, -0.42, 0.14, 0.16); c.fillRect(0.48, -0.42, 0.14, 0.16);
      c.fillStyle = '#6d7480'; c.fillRect(-L / 2, -0.3, L, 0.58);
      for (let k = 0; k < 3; k++) { const y = -0.17 + k * 0.15; c.fillStyle = on ? C.on : '#9aa6ae'; c.fillRect(-L / 2 - 0.03, y, L + 0.06, 0.05); }
    } else {
      c.fillStyle = p ? C.pdiff : C.ndiff; c.fillRect(-0.95, 0.05, 0.95 - L / 2 - 0.02, 0.32); c.fillRect(L / 2 + 0.02, 0.05, 0.95 - L / 2 - 0.02, 0.32);
      c.fillStyle = C.metal; c.fillRect(-0.62, -0.4, 0.14, 0.45); c.fillRect(0.48, -0.4, 0.14, 0.45);
      c.fillStyle = C.oxide; c.fillRect(-L / 2, 0.02, L, 0.03);
      c.fillStyle = node === '28' ? C.metal : C.poly; c.fillRect(-L / 2, -0.28, L, 0.3);
      if (on) { c.fillStyle = rgba(C.on, 0.85); c.fillRect(-L / 2 - 0.02, 0.055, L + 0.04, 0.035); }
    }
    c.fillStyle = val(gate); c.fillRect(-0.05, -0.42, 0.1, 0.14);
    /* carriers flow from source to drain only while the channel is open */
    if (on) { c.fillStyle = p ? '#ffb4a0' : '#a8e0ff'; const n = 9; for (let k = 0; k < n; k++) { const ph = RM ? k / n : ((k / n + sec * 0.35) % 1); const x = -0.55 + ph * 1.1, y = node === '3' ? -0.145 + (k % 3) * 0.15 : 0.07; c.beginPath(); c.arc(x, y, 0.018, 0, 6.283); c.fill(); } }
    text(c, t('cz.source'), -0.55, 0.47, fs, u); text(c, t('cz.drain'), 0.55, 0.47, fs, u); text(c, t('cz.gate') + ' = ' + gate, 0, -0.52, fs, u);
    text(c, t(p ? 'cz.pfet' : 'cz.nfet') + ' · ' + t(on ? 'cz.isOn' : 'cz.isOff'), 0, 0.72, fs, u, on ? C.on : C.mute);
  }
  const SC = [sBoard, sPkg, sDie, sTile, sDesign, sCell, sFet];

  /* ---- the zoom: the same scheme as the map's rack-to-atom zoom ---- */
  const lv = $('yczLevels'), range = $('yczRange');
  range.max = String((N - 1) * 100);
  lv.innerHTML = IDS.map((id, i) => '<button type="button" data-z="' + i + '">' + (i + 1) + ' ' + esc(t('cz.level.' + id + '.name')) + '</button>').join('');
  let playing = false, goal = null, last = performance.now(), visible = true, lastIdx = -1;
  lv.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; playing = false; goal = +b.dataset.z; if (RM) { K.t = goal; goal = null; } setPlay(); });
  const L = () => Z.levels;
  function frame(w, h) {
    let i = Math.floor(K.t + 1e-9), f = K.t - i; if (i >= N - 1) { i = N - 1; f = 0; }
    const U = Math.min(w, h) / 2 * 0.94, r = i < N - 1 ? L()[i].size / L()[i + 1].size : 1, s = Math.pow(r, f);
    return { i, f, U, r, s, Tg: i < N - 1 ? L()[i].T : [0, 0] };
  }
  function hud(w, h) {
    const { i, U, s } = frame(w, h), fov = L()[i].size / s;
    $('yczFov').textContent = fmtLen(fov);
    const near = Math.round(K.t);
    if (near !== lastIdx) {
      lastIdx = near; const id = IDS[near];
      $('yczName').textContent = t('cz.level.' + id + '.name'); $('yczIdx').textContent = t('cz.of', { n: near + 1, total: N });
      $('yczDesc').textContent = t('cz.level.' + id + '.d' + (id === 'die' && (Z.node === '28' || Z.node === '3') ? Z.node : ''), vars(id));
      $('yczTip').textContent = id === 'design' ? t('cz.tipCell') : id === 'cell' ? t('cz.tipFet') : '';
      [...lv.children].forEach((b, k) => b.setAttribute('aria-current', k === near ? 'true' : 'false'));
    }
    const mPerPx = fov / (2 * U), target = mPerPx * 90, p10 = Math.pow(10, Math.floor(Math.log10(target)));
    let nice = p10; for (const m of [1, 2, 5]) if (m * p10 <= target) nice = m * p10;
    $('yczBar').textContent = fmtLen(nice); $('yczBarI').style.width = (nice / mPerPx) + 'px';
  }
  function vars(id) {
    const cl = Z.cell, f = Z.circuit.fets[Z.fetI], on = evalCell(cl.type, S.cellIns[Z.pick]).on[Z.fetI];
    return {
      tiles: SHARED.cols * SHARED.rows, node: Z.nd.t, cells: Z.cells.length, tr: Z.SY.st.tr, type: cl.type, n: Z.circuit.fets.length,
      w: Math.round(Z.um.dW * 1e6 * 10) / 10, h: Math.round(Z.um.dH * 1e6 * 10) / 10, tw: Math.round(Z.um.tw * 1e6), th: Math.round(Z.um.th * 1e6),
      share: Math.max(0.1, Math.round(Z.um.dW * Z.um.dH / (Z.um.tw * Z.um.th) * 1000) / 10), wires: Math.round(Z.RT.wl * Z.um.ux * 1e6),
      vias: Z.RT.vias, kind: t(f.kind === 'p' ? 'cz.pfet' : 'cz.nfet'), state: t(on ? 'cz.isOn' : 'cz.isOff'),
      len: fmtLen(GATE[Z.node]), shape: t('cz.shape.' + Z.node)
    };
  }
  function draw(time) {
    if (!cv.isConnected) return;
    const { ctx: c, w, h, d } = fit(cv);
    c.setTransform(d, 0, 0, d, 0, 0); c.fillStyle = C.bg; c.fillRect(0, 0, w, h);
    const { i, f, U, r, s, Tg } = frame(w, h), k = r > 1 ? (1 - 1 / s) * r / (r - 1) : 0;
    const base = new DOMMatrix([d, 0, 0, d, 0, 0]).translate(w / 2, h / 2).scale(U * s).translate(-Tg[0] * k, -Tg[1] * k), sec = time / 1000;
    const scene = (idx, m, px, clip, a) => { c.save(); c.setTransform(m); c.globalAlpha = a; if (clip) { c.beginPath(); c.rect(-1, -1, 2, 2); c.clip(); } SC[idx](c, px, sec); c.restore(); };
    if (i > 0) { const rp = L()[i - 1].size / L()[i].size, P = L()[i - 1].T; scene(i - 1, base.scale(rp).translate(-P[0], -P[1]), U * s * rp, false, 1); }
    scene(i, base, U * s, i > 0, 1);
    if (i < N - 1) {
      c.save(); c.setTransform(base); c.globalAlpha = Math.max(0, 1 - f * 1.6); c.strokeStyle = C.mine; c.lineWidth = 1.5 / (U * s); c.setLineDash([5 / (U * s), 4 / (U * s)]); c.strokeRect(Tg[0] - 1 / r, Tg[1] - 1 / r, 2 / r, 2 / r); c.restore();
      const a = clamp((f - 0.12) / 0.5, 0, 1); if (a > 0) scene(i + 1, base.translate(Tg[0], Tg[1]).scale(1 / r), U * s / r, true, a);
    }
    hud(w, h);
  }
  function setPlay() { $('yczPlay').textContent = playing ? t('cz.pause') : K.t >= N - 1 - 1e-3 ? t('cz.again') : t('cz.in'); }
  $('yczPlay').addEventListener('click', () => { if (!playing && K.t >= N - 1 - 1e-3) K.t = 0; playing = !playing; goal = null; if (RM && playing) { playing = false; K.t = Math.min(N - 1, Math.floor(K.t) + 1); } setPlay(); });
  $('yczBack').addEventListener('click', () => { playing = false; goal = 0; if (RM) { K.t = 0; goal = null; } setPlay(); });
  range.addEventListener('input', () => { playing = false; goal = null; K.t = range.value / 100; setPlay(); });

  /* pick a cell at the design level, a transistor at the cell level */
  cv.addEventListener('click', e => {
    const near = Math.round(K.t); if (Math.abs(K.t - near) > 0.02 || (IDS[near] !== 'design' && IDS[near] !== 'cell')) return;
    const rc = cv.getBoundingClientRect(), U = Math.min(rc.width, rc.height) / 2 * 0.94;
    const x = (e.clientX - rc.left - rc.width / 2) / U, y = (e.clientY - rc.top - rc.height / 2) / U;
    if (IDS[near] === 'design') {
      const gx = (x * half('design') + Z.um.dW / 2) / Z.um.ux, gy = (y * half('design') + Z.um.dH / 2) / Z.um.uy;
      const k = Z.cells.findIndex(cl => gx >= cl.x && gx <= cl.x + cl.w && gy >= cl.y && gy <= cl.y + 3);
      if (k >= 0 && Z.cells[k].type === 'DFF') { $('yczTip').textContent = t('cz.tipFlop'); return; }
      if (k >= 0 && k !== Z.pick) { K.cell = k; K.fet = null; Z = build(d, { cell: k }); lastIdx = -1; }
    } else {
      const fx = (x * half('cell')) / Z.um.cW + 0.5, fy = (y * half('cell')) / Z.um.cH + 0.5;
      const k = Z.circuit.fets.findIndex(f => fx >= f.box.x && fx <= f.box.x + f.box.w && fy >= f.box.y && fy <= f.box.y + f.box.h);
      if (k >= 0 && k !== Z.fetI) { K.fet = k; Z = build(d, { cell: Z.pick, fet: k }); lastIdx = -1; }
    }
    draw(performance.now());
  });

  function loop(now) {
    if (me !== run || !cv.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (playing) { K.t += dt * 0.38; if (K.t >= N - 1) { K.t = N - 1; playing = false; setPlay(); } }
    else if (goal !== null) { const diff = goal - K.t; if (Math.abs(diff) < 0.004) { K.t = goal; goal = null; setPlay(); } else K.t += diff * Math.min(1, dt * 3.2) + Math.sign(diff) * dt * 0.25 * (Math.abs(diff) > 0.3 ? 1 : 0); }
    range.value = String(Math.round(K.t * 100));
    if (visible) draw(now);
    requestAnimationFrame(loop);
  }
  inView(cv, v => { visible = v; });
  new ResizeObserver(() => draw(performance.now())).observe(cv);
  resim(); setPlay(); requestAnimationFrame(loop);
}
