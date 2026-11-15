// The sketches of the eleven visual systems (content/img/*.svg), drawn from one script so they share one style.
//   node scripts/draw-content.mjs
// Each sketch shows what its visual system lays out across the picture; it is a sketch of the idea, not the site's
// drawing. Words in a sketch are the sketch's own labels (the documents are in English for now).
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const W = 720, H = 400;
const BG = '#0e1626', PANEL = '#152036', LINE = '#2a3a57', INK = '#e6ecf5', MUTED = '#8a9bb5', SOFT = '#4a5d7d';
const hue = h => `hsl(${h} 70% 58%)`, hueDim = (h, a = 0.18) => `hsla(${h}, 70%, 58%, ${a})`;
const HUE = { think: 215, strange: 262, limit: 305, fail: 350, idea: 24, make: 46, know: 82, open: 135, divide: 168, life: 192, scale: 0 };
const F = 'font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif"';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const r = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 6}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? 'none'}" stroke-width="${o.sw ?? 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
const l = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? LINE}" stroke-width="${o.sw ?? 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''} stroke-linecap="round"/>`;
const c = (x, y, rad, o = {}) => `<circle cx="${x}" cy="${y}" r="${rad}" fill="${o.fill ?? INK}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 1}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" ${F} font-size="${o.size ?? 11}" fill="${o.fill ?? MUTED}" font-weight="${o.weight ?? 500}" text-anchor="${o.anchor ?? 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
const p = (d, o = {}) => `<path d="${d}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? INK}" stroke-width="${o.sw ?? 1.5}" stroke-linecap="round" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
/* a frame: the visual system's name, what it lays out, and the world's colour */
const frame = (world, name, lays, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(name + ': ' + lays)}">
<rect width="${W}" height="${H}" rx="14" fill="${BG}"/>
<rect x="0" y="0" width="6" height="${H}" rx="3" fill="${hue(HUE[world])}"/>
${t(26, 32, name.toUpperCase(), { size: 12, fill: hue(HUE[world]), weight: 700, ls: '0.12em' })}
${t(26, 52, lays, { size: 13, fill: INK, weight: 500 })}
${body}
</svg>
`;
/* a little random that is the same every time */
const rnd = (i, k = 1) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
const gauss = (i, k) => { const u = Math.max(1e-6, rnd(i, k)), v = rnd(i, k + 7); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

const S = {};

/* ---- Dive: each depth inside a small square of the one above ---- */
S.dive = (() => {
  const H0 = HUE.think, levels = [['Data centre', '29 m'], ['Rack', '2 m'], ['Board', '30 cm'], ['Chip', '2 cm'], ['Block', '10 µm'], ['Gate', '300 nm'], ['Switch', '50 nm'], ['Atom', '2 nm']];
  const sz = 132, gapX = 40, x0 = 34, y0 = 84;
  let b = '';
  levels.forEach(([name, m], i) => {
    const row = Math.floor(i / 4), col = row ? 3 - (i % 4) : i % 4, x = x0 + col * (sz + gapX), y = y0 + row * (sz + 42);
    b += r(x, y, sz, sz, { fill: PANEL, stroke: LINE });
    const cx = x + sz / 2, cy = y + sz / 2, k = hue(H0);
    /* what each depth holds, simply */
    if (i === 0) for (let j = 0; j < 4; j++) b += r(x + 18, y + 22 + j * 24, sz - 36, 12, { fill: SOFT, rx: 2 });
    if (i === 1) for (let j = 0; j < 8; j++) b += r(x + 40, y + 16 + j * 13, sz - 80, 9, { fill: SOFT, rx: 2 });
    if (i === 2) { b += r(x + 18, y + 18, sz - 36, sz - 36, { stroke: SOFT, rx: 4 }); b += r(cx - 24, cy - 24, 48, 48, { fill: SOFT, rx: 3 }); [-1, 1].forEach(d => b += r(cx + d * 38 - 7, cy - 16, 14, 32, { fill: LINE, rx: 2 })); }
    if (i === 3) for (let a = 0; a < 4; a++) for (let j = 0; j < 4; j++) b += r(x + 18 + a * 25, y + 18 + j * 25, 21, 21, { fill: (a + j) % 3 ? SOFT : LINE, rx: 2 });
    if (i === 4) for (let j = 0; j < 7; j++) b += r(x + 16, y + 16 + j * 15, sz - 32, 10, { fill: j % 2 ? SOFT : LINE, rx: 1 });
    if (i === 5) { for (let j = 0; j < 3; j++) b += l(x + 20, y + 34 + j * 32, x + sz - 20, y + 34 + j * 32, { stroke: SOFT, sw: 5 }); for (let j = 0; j < 4; j++) b += l(x + 30 + j * 24, y + 20, x + 30 + j * 24, y + sz - 20, { stroke: LINE, sw: 7 }); }
    if (i === 6) { b += r(x + 20, cy + 6, sz - 40, 22, { fill: SOFT, rx: 3 }); b += r(cx - 18, cy - 28, 36, 34, { fill: LINE, rx: 3 }); b += r(x + 20, cy + 6, 22, 22, { fill: LINE, rx: 2 }); b += r(x + sz - 42, cy + 6, 22, 22, { fill: LINE, rx: 2 }); }
    if (i === 7) for (let a = 0; a < 6; a++) for (let j = 0; j < 6; j++) b += c(x + 24 + a * 17 + (j % 2) * 8, y + 24 + j * 17, 4.2, { fill: j === 2 && a === 3 ? k : SOFT });
    b += t(x, y - 8, name, { size: 12, fill: INK, weight: 600 }) + t(x + sz, y - 8, m, { size: 11, anchor: 'end' });
    /* the portal: the square the next depth lives in, and the lines that open it */
    if (i < levels.length - 1) {
      const ps = 18, px = x + sz * 0.62, py = y + sz * 0.6;
      b += r(px, py, ps, ps, { stroke: k, sw: 1.5, rx: 2 });
      const nrow = Math.floor((i + 1) / 4), ncol = nrow ? 3 - ((i + 1) % 4) : (i + 1) % 4, nx = x0 + ncol * (sz + gapX), ny = y0 + nrow * (sz + 42);
      if (nrow === row) { const dir = ncol > col ? 1 : -1, sx = dir > 0 ? px + ps : px, tx = dir > 0 ? nx : nx + sz; b += l(sx, py, tx, ny, { stroke: k, op: 0.5, dash: '3 3' }) + l(sx, py + ps, tx, ny + sz, { stroke: k, op: 0.5, dash: '3 3' }); }
      else b += l(px, py + ps, nx, ny, { stroke: k, op: 0.5, dash: '3 3' }) + l(px + ps, py + ps, nx + sz, ny, { stroke: k, op: 0.5, dash: '3 3' });
    }
  });
  return frame('think', 'Dive', 'Scale: one thing inside the next, from a hall of machines to the atoms', b);
})();

/* ---- Side by side: one job, many media, the same measures under each ---- */
S.side = (() => {
  const h = HUE.strange, lanes = [['Silicon switches', 1, true, '1 ns'], ['Light', 0.9, true, '10 ps'], ['Spin', 0.75, false, '1 ns'], ['Superconducting loops', 1, true, '5 ps'], ['Dominoes', 1, null, '1 s'], ['DNA strands', 0.8, false, '1 h'], ['Living neurons', 0.85, false, '1 ms']];
  let b = t(26, 78, 'The same job: pass a 1 down a chain of ten parts', { size: 11 });
  b += t(470, 78, 'still a 1?', { size: 11 }) + t(560, 78, 'one step', { size: 11 }) + t(640, 78, 'again?', { size: 11 });
  lanes.forEach(([name, keep, ok, step], i) => {
    const y = 96 + i * 42;
    b += r(26, y, 668, 34, { fill: i % 2 ? 'transparent' : PANEL, rx: 6 });
    b += t(38, y + 21, name, { size: 12, fill: INK, weight: 600 });
    let v = 1;
    for (let j = 0; j <= 10; j++) {
      const x = 196 + j * 25, cy = y + 17;
      if (j) v = keep >= 1 ? Math.min(1, 0.95 + 0.05 * rnd(i, j)) : Math.max(0, v * keep + 0.06 * (rnd(i * 3, j) - 0.5));
      b += c(x, cy, 3 + 5 * v, { fill: v > 0.7 ? hue(h) : v > 0.3 ? '#f0a33a' : '#d8504a', op: 0.35 + 0.65 * v });
      if (j) b += l(x - 20, cy, x - 9, cy, { stroke: SOFT });
    }
    b += t(470, y + 21, v > 0.7 ? 'yes' : v > 0.3 ? 'unsure' : 'no', { size: 12, fill: v > 0.7 ? INK : MUTED, weight: 600 });
    b += t(560, y + 21, step, { size: 12, fill: INK });
    b += t(640, y + 21, ok === null ? 'by hand' : 'yes', { size: 12, fill: ok === null ? '#f0a33a' : INK });
  });
  b += t(26, 392, 'A sketch of the idea: the times are rough orders of size; the Substrate engine and the strange shelf will carry sourced numbers.', { size: 10 });
  return frame('strange', 'Side by side', 'Different things doing the same job at the same moment', b);
})();

/* ---- Walls: everything a chip could be, and the walls around it ---- */
S.walls = (() => {
  const h = HUE.limit, cx = 250, cy = 240;
  let b = r(26, 68, 668, 312, { fill: PANEL, rx: 10 });
  /* soft walls, near; hard walls, far */
  const rings = [[70, 'Cost, habit, missing ideas', '#f0a33a', '5 5'], [120, 'Problems that double with each item', hue(h), null], [168, 'Light in one tick', '#5aa9ff', null]];
  rings.forEach(([rad, name, col, dash], i) => { b += p(`M ${cx - rad} ${cy} A ${rad} ${rad * 0.8} 0 0 1 ${cx + rad} ${cy}`, { stroke: col, sw: 3, dash }); b += r(cx - 95, cy - rad * 0.8 - 17, 190, 16, { fill: PANEL, rx: 3 }) + t(cx, cy - rad * 0.8 - 5, name, { size: 11, fill: col, weight: 600, anchor: 'middle' }); });
  /* the energy floor: far below today's chips, a straight line */
  b += l(46, 360, 676, 360, { stroke: '#e6ecf5', sw: 2.5 }) + t(56, 352, 'The energy floor (kT ln 2): today\'s chips sit millions of times above it', { size: 11, fill: INK, weight: 600 });
  /* a mathematical wall: no machine can cross */
  b += r(560, 92, 116, 120, { fill: hueDim(h, 0.12), stroke: hue(h), sw: 1.5, rx: 8 }) + t(618, 140, 'Questions no', { size: 11, fill: INK, anchor: 'middle', weight: 600 }) + t(618, 156, 'machine can settle', { size: 11, fill: INK, anchor: 'middle', weight: 600 }) + t(618, 178, 'mathematics, 1936', { size: 10, anchor: 'middle' });
  /* where today's chips stand */
  b += c(cx, cy, 16, { fill: hue(h) }) + t(cx, cy + 34, "Today's chips", { size: 12, fill: INK, anchor: 'middle', weight: 600 });
  /* a soft wall that moved */
  b += p(`M ${cx - 52} ${cy} A 52 42 0 0 1 ${cx + 52} ${cy}`, { stroke: '#f0a33a', sw: 1.5, dash: '2 4', op: 0.6 }) + t(cx + 22, cy + 20, 'a wall that moved', { size: 10, fill: '#f0a33a' });
  b += t(470, 250, 'Kinds of wall:', { size: 11, fill: INK, weight: 600 }) + t(470, 268, 'physics: solid', { size: 11 }) + t(470, 284, 'mathematics: solid', { size: 11 }) + t(470, 300, 'money and habit: dashed, dated;', { size: 11 }) + t(470, 316, 'some of them fell', { size: 11 });
  return frame('limit', 'Walls', 'Everything a chip could be, as open ground, and the walls of each kind around it', b);
})();

/* ---- Copies: one design as a crowd of chips, against the window it must stay in ---- */
S.copies = (() => {
  const h = HUE.fail; let b = '';
  const years = [['Day one', 0], ['Year 3', 1], ['Year 10', 2]];
  years.forEach(([name, k], i) => {
    const x = 40 + i * 226, y = 80, w = 200, hh = 270;
    b += r(x, y, w, hh, { fill: PANEL, rx: 10 });
    /* the window every copy must stay inside: fast enough (left of the edge), cool enough (below the edge) */
    b += r(x + 16, y + 40, 132, 160, { stroke: '#e6ecf5', sw: 1.5, dash: '5 4', rx: 4 });
    let out = 0;
    for (let j = 0; j < 140; j++) {
      const sx = x + 70 + 20 * gauss(j, 3) + k * 22 + (k ? 6 * gauss(j, 11 + k) : 0), sy = y + 120 + 22 * gauss(j, 5) + k * 14;
      const fail = sx > x + 148 || sy > y + 200 || (k === 2 && rnd(j, 9) < 0.03);
      if (fail) out++;
      b += c(sx, sy, 2.6, { fill: fail ? '#d8504a' : '#8fb3e6', op: fail ? 1 : 0.7 });
    }
    b += t(x + 16, y + 26, name, { size: 13, fill: INK, weight: 600 }) + t(x + 16, y + 226, out + ' of 140 outside', { size: 11, fill: out ? '#d8504a' : MUTED, weight: 600 });
    b += t(x + 16, y + 246, 'slower →', { size: 10 }) + t(x + 150, y + 214, 'hotter ↓', { size: 10 });
  });
  b += t(40, 384, 'The perfect design is the centre of the crowd. Nobody lives at the centre; age and heat move the crowd toward the edge.', { size: 11 });
  return frame('fail', 'Copies', 'One design as the many chips made from it, each a little different, over its years', b);
})();

/* ---- Forms: one design in every form at once, tied ---- */
S.forms = (() => {
  const h = HUE.idea, k = hue(h); let b = '';
  const forms = [['The job', 'add two bits'], ['Description', ''], ['What it does', ''], ['Gates', ''], ['Layout', ''], ['Masks', '']];
  forms.forEach(([name], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 30 + col * 226, y = 72 + row * 160, w = 210, hh = 146;
    b += r(x, y, w, hh, { fill: PANEL, rx: 10 }) + t(x + 14, y + 22, name, { size: 12, fill: INK, weight: 600 });
    const X = x + 14, Y = y + 40;
    if (i === 0) b += t(X, Y + 18, 'Two bits in;', { size: 13, fill: INK }) + t(X, Y + 38, 'their sum and carry out.', { size: 13, fill: INK }) + t(X, Y + 74, 'said by a person', { size: 10 });
    if (i === 1) b += t(X, Y + 18, 'sum   = a ^ b;', { size: 13, fill: k, weight: 600 }) + t(X, Y + 40, 'carry = a & b;', { size: 13, fill: INK }) + t(X, Y + 74, 'written by a person or an AI', { size: 10 });
    if (i === 2) { ['a b  sum carry', '0 0   0    0', '0 1   1    0', '1 0   1    0', '1 1   0    1'].forEach((row2, j) => b += t(X, Y + 4 + j * 17, row2, { size: 12, fill: j ? INK : MUTED })); b += r(X + 34, Y - 8, 30, 88, { stroke: k, sw: 1.5, rx: 4 }); }
    if (i === 3) { b += r(X + 70, Y + 2, 44, 28, { stroke: k, sw: 2, rx: 6 }) + t(X + 92, Y + 21, 'XOR', { size: 11, fill: k, anchor: 'middle', weight: 700 }) + r(X + 70, Y + 44, 44, 28, { stroke: INK, sw: 1.5, rx: 6 }) + t(X + 92, Y + 63, 'AND', { size: 11, fill: INK, anchor: 'middle', weight: 700 });
      b += l(X, Y + 10, X + 70, Y + 10, { stroke: SOFT }) + l(X, Y + 54, X + 70, Y + 54, { stroke: SOFT }) + l(X + 114, Y + 16, X + 180, Y + 16, { stroke: k, sw: 2 }) + l(X + 114, Y + 58, X + 180, Y + 58, { stroke: SOFT }) + t(X, Y + 96, 'chosen by a program: 2 gates, 18 switches', { size: 10 }); }
    if (i === 4) { for (let a = 0; a < 2; a++) b += r(X + 14 + a * 88, Y + 4, 70, 50, { fill: a ? LINE : hueDim(h, 0.35), stroke: a ? SOFT : k, rx: 3 }); b += p(`M ${X + 50} ${Y + 54} V ${Y + 72} H ${X + 150} V ${Y + 54}`, { stroke: SOFT, sw: 3 }); b += t(X, Y + 96, 'placed by a program', { size: 10 }); }
    if (i === 5) { for (let a = 0; a < 4; a++) b += r(X + a * 12, Y + a * 6, 120, 64, { fill: a === 3 ? hueDim(h, 0.28) : PANEL, stroke: a === 3 ? k : SOFT, rx: 3 }); b += t(X, Y + 96, '26 masks, one for each layer', { size: 10 }); }
  });
  b += t(30, 392, 'Touch "sum" in any form and it lights in all six: its line, its column, its gate, its cell, its shape on the masks.', { size: 11 });
  return frame('idea', 'Forms', 'One design in every form it takes, at once, tied together', b);
})();

/* ---- Line: one slice of the wafer, followed through every step ---- */
S.line = (() => {
  const h = HUE.make, k = hue(h); let b = '';
  const steps = ['Crystal', 'Film', 'Print', 'Etch', 'Add atoms', 'Gate', 'Wires'];
  const SI = '#3a4c6a', OX = '#7f9bc0', RES = '#c58b2c', POLY = k, MET = '#c9a14a', DOP = '#5aa9ff';
  steps.forEach((name, i) => {
    const x = 30 + i * 96, y = 110, w = 84, base = 300;
    b += t(x + w / 2, 92, (i + 1) + '. ' + name, { size: 11, fill: i === 6 ? INK : MUTED, anchor: 'middle', weight: 600 });
    b += r(x, base - 60, w, 60, { fill: SI, rx: 2 });
    if (i >= 4) b += r(x + 6, base - 60, 18, 14, { fill: DOP, rx: 2, op: 0.9 }) + r(x + w - 24, base - 60, 18, 14, { fill: DOP, rx: 2, op: 0.9 });
    if (i === 1) b += r(x, base - 72, w, 12, { fill: OX, rx: 1 });
    if (i === 2) b += r(x, base - 72, w, 12, { fill: OX, rx: 1 }) + r(x, base - 84, w * 0.35, 12, { fill: RES, rx: 1 }) + r(x + w * 0.65, base - 84, w * 0.35, 12, { fill: RES, rx: 1 }) + l(x + w / 2, base - 130, x + w / 2, base - 90, { stroke: '#e6ecf5', dash: '2 3' });
    if (i === 3) b += r(x, base - 72, w * 0.35, 12, { fill: OX, rx: 1 }) + r(x + w * 0.65, base - 72, w * 0.35, 12, { fill: OX, rx: 1 });
    if (i >= 4) b += r(x + w * 0.32, base - 66, w * 0.36, 6, { fill: OX, rx: 1 });
    if (i >= 5) b += r(x + w * 0.32, base - 90, w * 0.36, 24, { fill: POLY, rx: 2 });
    if (i === 6) { b += r(x - 2, base - 150, w + 4, 50, { fill: 'none', stroke: SOFT, rx: 3 }); [x + 14, x + w / 2 - 4, x + w - 22].forEach(xx => b += r(xx, base - 140, 8, i === 6 ? 50 : 0, { fill: MET, rx: 1 })); b += r(x - 2, base - 150, w + 4, 10, { fill: MET, rx: 2 }); }
    if (i < steps.length - 1) b += p(`M ${x + w + 2} ${base - 30} l 8 0`, { stroke: SOFT, sw: 2 });
  });
  const key = [['silicon', SI], ['insulator', OX], ['coating', RES], ['added atoms', DOP], ['gate', POLY], ['metal', MET]];
  key.forEach(([n, col], i) => { b += r(36 + i * 110, 334, 14, 14, { fill: col, rx: 3 }) + t(56 + i * 110, 345, n, { size: 11 }); });
  b += t(30, 384, 'A thousand steps or more go round this loop of lay down, print, carve, clean, once for every layer.', { size: 11 });
  return frame('make', 'Line', 'The order things are made in: one slice through the wafer, step by step', b);
})();

/* ---- Probe: a machine known only by the trace of what you try ---- */
S.probe = (() => {
  const h = HUE.know, k = hue(h); let b = r(26, 68, 668, 312, { fill: PANEL, rx: 10 });
  /* the trace: tries spread over two dials; the colour is the result, noisy; a region comes to be trusted */
  const bx = 330, by = 90, bw = 340, bh = 270;
  b += r(bx, by, bw, bh, { stroke: LINE, rx: 6 }) + t(bx + bw / 2, by + bh + 16, 'dial A (labelled)', { size: 10, anchor: 'middle' }) + t(bx + 10, by + 16, '↑ dial B (unlabelled)', { size: 10 });
  const best = [bx + bw * 0.62, by + bh * 0.38];
  for (let j = 0; j < 70; j++) {
    const late = j > 30, x = late ? best[0] + 40 * gauss(j, 2) : bx + 20 + rnd(j, 2) * (bw - 40), y = late ? best[1] + 34 * gauss(j, 4) : by + 20 + rnd(j, 4) * (bh - 40);
    const d = Math.hypot((x - best[0]) / bw, (y - best[1]) / bh), q = Math.max(0, Math.min(1, 1 - d * 2.4 + 0.15 * (rnd(j, 8) - 0.5)));
    b += c(x, y, 4, { fill: q > 0.7 ? k : q > 0.4 ? '#f0a33a' : '#d8504a', op: 0.4 + 0.6 * (j / 70) });
  }
  b += `<ellipse cx="${best[0]}" cy="${best[1]}" rx="58" ry="46" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="5 4"/>` + t(best[0], best[1] - 54, 'the region you came to trust', { size: 11, fill: INK, anchor: 'middle', weight: 600 });
  /* the closed machine */
  b += r(56, 120, 200, 150, { fill: BG, stroke: SOFT, sw: 2, rx: 10 }) + t(156, 190, 'the machine', { size: 13, fill: INK, anchor: 'middle', weight: 600 }) + t(156, 208, 'cannot be opened', { size: 11, anchor: 'middle' });
  [0, 1, 2].forEach(i => b += c(96 + i * 60, 248, 9, { fill: 'none', stroke: i === 2 ? MUTED : k, sw: 2 }) + l(96 + i * 60, 248, 96 + i * 60 + 6, 242, { stroke: i === 2 ? MUTED : k, sw: 2 }));
  b += t(56, 302, 'Your note:', { size: 11, fill: INK, weight: 600 }) + t(56, 320, '"A high, B just past the click."', { size: 11, fill: k }) + t(56, 342, 'How far does it carry someone else?', { size: 11 });
  return frame('know', 'Probe', 'A thing you cannot open, known only by the trace of what you try on it', b);
})();

/* ---- Map: who does what, where, and who depends on whom ---- */
S.map = (() => {
  const h = HUE.open, k = hue(h); let b = r(26, 68, 668, 312, { fill: PANEL, rx: 10 });
  const N = { design: [110, 150, 'Design houses'], ip: [110, 270, 'Licensed blocks'], fab: [330, 210, 'Factories'], tool: [330, 320, 'The printing machine: one maker'], wafer: [330, 100, 'Wafers and gases'], pack: [520, 150, 'Packaging'], world: [620, 260, 'Phones, cars, data centres'], open: [520, 330, 'Shared runs, open kits'] };
  const E = [['design', 'fab'], ['ip', 'design'], ['wafer', 'fab'], ['tool', 'fab'], ['fab', 'pack'], ['pack', 'world'], ['open', 'fab'], ['design', 'pack']];
  E.forEach(([a, z]) => { const [x1, y1] = N[a], [x2, y2] = N[z], narrow = a === 'tool'; b += l(x1, y1, x2, y2, { stroke: narrow ? '#d8504a' : a === 'open' ? k : SOFT, sw: narrow ? 1.5 : a === 'open' ? 3 : 2.5, dash: a === 'open' ? '6 4' : null }); });
  Object.entries(N).forEach(([id, [x, y, name]]) => { const one = id === 'tool'; b += c(x, y, one ? 10 : 14, { fill: id === 'open' ? k : one ? '#d8504a' : INK, op: id === 'open' || one ? 1 : 0.9 }) + t(x, y + 30, name, { size: 11, fill: INK, anchor: 'middle', weight: 600 }); });
  b += t(46, 100, 'Close one place and watch what stops.', { size: 11 }) + t(46, 100 + 18, 'The chain is as open as its narrowest link.', { size: 11, fill: '#d8504a', weight: 600 });
  return frame('open', 'Map', 'The world around the chip: who does what, where, and who depends on whom', b);
})();

/* ---- Plan: districts, and what flows between them ---- */
S.plan = (() => {
  const h = HUE.divide, k = hue(h); let b = '';
  const x0 = 40, y0 = 74, w = 420, hh = 300;
  b += r(x0, y0, w, hh, { fill: PANEL, stroke: LINE, rx: 8 });
  const D = { c1: [x0 + 20, y0 + 20, 110, 90, 'Cores'], c2: [x0 + 20, y0 + 120, 110, 90, 'Cores'], ai: [x0 + 150, y0 + 20, 150, 190, 'AI unit'], sram: [x0 + 320, y0 + 20, 80, 190, 'Memory'], io: [x0 + 20, y0 + 230, 380, 50, 'Links to the outside'] };
  Object.values(D).forEach(([x, y, ww, h2, name], i) => { b += r(x, y, ww, h2, { fill: name === 'AI unit' ? hueDim(h, 0.3) : BG, stroke: name === 'AI unit' ? k : SOFT, rx: 6 }) + t(x + 10, y + 20, name, { size: 11, fill: INK, weight: 600 }); });
  /* the streams: thickness is how much flows */
  b += p(`M ${x0 + 300} ${y0 + 110} H ${x0 + 320}`, { stroke: k, sw: 10, op: 0.8 }) + p(`M ${x0 + 225} ${y0 + 210} V ${y0 + 230}`, { stroke: '#f0a33a', sw: 7, op: 0.85 }) + p(`M ${x0 + 130} ${y0 + 65} H ${x0 + 150}`, { stroke: k, sw: 3, op: 0.8 }) + p(`M ${x0 + 130} ${y0 + 165} H ${x0 + 150}`, { stroke: k, sw: 3, op: 0.8 });
  /* the memory chips off the chip: far, big, costly to reach */
  b += r(510, 150, 170, 70, { fill: BG, stroke: SOFT, rx: 6 }) + t(522, 176, 'Memory chips (far)', { size: 11, fill: INK, weight: 600 }) + t(522, 196, '3,500× an add, per number', { size: 11, fill: '#f0a33a' });
  b += p(`M ${x0 + w} ${y0 + 255} C 490 ${y0 + 255}, 480 185, 510 185`, { stroke: '#f0a33a', sw: 6, op: 0.85 });
  b += t(510, 262, 'Each stream costs energy by', { size: 11 }) + t(510, 278, 'how much it carries and how far.', { size: 11 }) + t(510, 312, 'Redraw a boundary;', { size: 11, fill: INK }) + t(510, 328, 'watch who waits.', { size: 11, fill: INK });
  b += t(40, 392, '3,500×: reading 16 bits from a memory chip against a 16-bit add, at 45 nm (Pedram et al.).', { size: 10 });
  return frame('divide', 'Plan', 'The ground divided into districts, and what flows between them', b);
})();

/* ---- Swarm: many small things, no one in charge, and the pattern that comes out ---- */
S.swarm = (() => {
  const h = HUE.life, k = hue(h); let b = r(26, 68, 668, 312, { fill: PANEL, rx: 10 });
  const pts = Array.from({ length: 120 }, (_, i) => [50 + rnd(i, 1) * 620, 90 + rnd(i, 2) * 270]);
  /* local links: each part talks only to its near neighbours */
  pts.forEach(([x, y], i) => pts.forEach(([x2, y2], j) => { if (j > i && Math.hypot(x - x2, y - y2) < 52) b += l(x, y, x2, y2, { stroke: SOFT, op: 0.5 }); }));
  /* the pattern nobody wrote: a path from nest to food, grown from trails */
  const path = [[70, 330], [170, 300], [260, 250], [360, 215], [470, 180], [570, 140], [650, 110]];
  b += p('M ' + path.map(q => q.join(' ')).join(' L '), { stroke: k, sw: 6, op: 0.85 });
  pts.forEach(([x, y], i) => { const near = path.some(([a, z]) => Math.hypot(a - x, z - y) < 40); b += c(x, y, near ? 4.5 : 3, { fill: near ? k : INK, op: near ? 1 : 0.55 }); });
  b += c(70, 330, 12, { fill: '#f0a33a' }) + t(70, 360, 'nest', { size: 11, fill: INK, anchor: 'middle', weight: 600 }) + c(650, 110, 12, { fill: '#45d08a' }) + t(650, 96, 'food', { size: 11, fill: INK, anchor: 'middle', weight: 600 });
  b += r(40, 86, 380, 22, { fill: PANEL, rx: 4 }) + t(46, 101, 'Each part follows a local rule; the path belongs to the whole.', { size: 11 }) + r(300, 356, 380, 22, { fill: PANEL, rx: 4 }) + t(674, 371, 'Remove a tenth of the parts: the path is still found.', { size: 11, fill: INK, anchor: 'end' });
  return frame('life', 'Swarm', 'Many small things with no one in charge, and the pattern that comes out of them', b);
})();

/* ---- Clock: time at every length, and the doublings that bent ---- */
S.clock = (() => {
  const h = HUE.scale, k = hue(h); let b = '';
  /* one scale of time, tenfold at each step */
  const ticks = [[-12, 'a switch flips'], [-9, 'one tick'], [-6, 'an instruction'], [-3, 'a program'], [0, 'a second'], [3, ''], [6, "a wafer's months"], [8, "a chip's years"], [9.2, 'fifty years of chips']];
  const X = e => 80 + (e + 12) / 21.2 * 560;
  b += l(80, 118, 640, 118, { stroke: INK, sw: 1.5 });
  ticks.forEach(([e, name], i) => { b += l(X(e), 112, X(e), 124, { stroke: INK, sw: 1.5 }) + (name ? t(X(e), e > 9 ? 88 : i % 2 ? 144 : 104, name, { size: 10, fill: i % 2 ? MUTED : INK, anchor: e > 9 ? 'end' : 'middle' }) : ''); });
  b += t(80, 168, 'seconds, ten times more at each step: 10⁻¹² to 10⁹', { size: 10 });
  /* fifty years, on a scale that grows tenfold at each step: straight lines that bend */
  const gx = 60, gy = 190, gw = 480, gh = 160, yr = y => gx + (y - 1971) / (2026 - 1971) * gw;
  b += r(gx - 20, gy - 10, 660, gh + 34, { fill: PANEL, rx: 10 });
  const line = (pts, col, name, wid = 3) => { b += p('M ' + pts.map(([y, v]) => `${yr(y).toFixed(1)} ${(gy + gh - v * gh).toFixed(1)}`).join(' L '), { stroke: col, sw: wid }); const [ly, lv] = pts[pts.length - 1]; b += t(yr(ly) + 6, gy + gh - lv * gh + 4, name, { size: 10, fill: col, weight: 600 }); };
  line([[1971, 0.05], [2005, 0.66], [2026, 0.98]], k, 'switches per chip');
  line([[1971, 0.02], [2005, 0.62], [2026, 0.66]], '#5aa9ff', 'clock speed');
  line([[1971, 0.95], [2012, 0.18], [2026, 0.14]], '#f0a33a', 'cost per switch');
  b += l(yr(2005), gy, yr(2005), gy + gh, { stroke: SOFT, dash: '3 4' }) + t(yr(2005) + 6, gy + gh - 8, 'around 2005: smaller stops meaning cooler', { size: 10 });
  [1971, 1990, 2005, 2026].forEach(y => b += t(yr(y), gy + gh + 12, String(y), { size: 10, anchor: 'middle' }));
  b += t(40, 392, 'The shapes of the lines are a sketch; the engine will draw them from sourced figures.', { size: 10 });
  return frame('scale', 'Clock', 'Time at every length, from a switch flipping to fifty years of chips', b);
})();

/* ---- Joints: where the worlds meet, read from the documents' own "Where it meets other questions" ---- */
S.joints = (() => {
  const ids = Object.keys(HUE), meets = {};
  for (const id of ids) {
    const md = readFileSync(new URL('../content/' + id + '.md', import.meta.url), 'utf8'), sec = (md.split('## Where it meets other questions')[1] || '').split('\n## ')[0];
    meets[id] = [...new Set([...sec.matchAll(/\]\(([a-z]+)\.md\)/g)].map(m => m[1]))];
  }
  /* two halves came out: what a chip is (left), how a chip comes to be (right); fail and scale stand between */
  const P = { think: [150, 140], strange: [80, 250], limit: [190, 320], life: [270, 220], divide: [300, 110],
    fail: [380, 190], idea: [480, 130], make: [560, 240], know: [650, 150], open: [610, 330], scale: [380, 320] };
  const NAME = { think: 'think', strange: 'strange', limit: 'limit', life: 'life', divide: 'divide', fail: 'fail', idea: 'idea', make: 'make', know: 'know', open: 'open', scale: 'scale' };
  let b = r(26, 68, 668, 312, { fill: PANEL, rx: 10 });
  b += r(40, 80, 300, 288, { fill: 'none', stroke: SOFT, dash: '4 5', rx: 14 }) + t(56, 100, 'What a chip is', { size: 12, fill: INK, weight: 700 });
  b += r(420, 80, 262, 288, { fill: 'none', stroke: SOFT, dash: '4 5', rx: 14 }) + t(666, 100, 'How a chip comes to be', { size: 12, fill: INK, weight: 700, anchor: 'end' });
  const seen = new Set();
  for (const a of ids) for (const z of meets[a]) {
    const key = [a, z].sort().join('-'); if (seen.has(key) || !P[z]) continue; seen.add(key);
    const both = meets[z].includes(a), [x1, y1] = P[a], [x2, y2] = P[z];
    b += l(x1, y1, x2, y2, { stroke: both ? '#9fb3d1' : SOFT, sw: both ? 2 : 1.2, dash: both ? null : '3 4', op: both ? 0.9 : 0.8 });
  }
  for (const id of ids) { const [x, y] = P[id]; b += c(x, y, 22, { fill: BG, stroke: hue(HUE[id]), sw: 3 }) + t(x, y + 4, NAME[id], { size: 11, fill: INK, anchor: 'middle', weight: 700 }); }
  b += t(26, 394, 'Solid: both documents name the joint. Dashed: one does. Positions are a reading, not data.', { size: 10 });
  return frame('fail', 'Where the worlds meet', 'Read from each document\'s own list of real joints', b);
})();

mkdirSync(new URL('../content/img/', import.meta.url), { recursive: true });
for (const [name, svg] of Object.entries(S)) writeFileSync(new URL('../content/img/' + name + '.svg', import.meta.url), svg);
console.log('Drew ' + Object.keys(S).length + ' sketches into content/img/.');
