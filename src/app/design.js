/* The design studio: the first half of a chip's journey, before the factory. Six stations, each showing
   your design (src/engines/design.js) at one step: the job it must do, its description, the check, the
   gates, the layout on a shared chip, and the masks that go to the factory's Print station.

   Scenes are drawn in the 1000 x 1000 space like every depth (world.js draws them side by side, as a line),
   in the site's blueprint style. No words in code: names of parts are part.<station>.<key>, everything
   else is drawn. drawDesignBand draws the band under the picture. */
import { t } from '../core/i18n.js';
import { build, simulate, patterns, START_DESIGN } from '../engines/design.js';
import { DESIGNS } from '../data/build.js';
import { plan, levels, needForProject } from '../engines/build.js';
import { NEEDS } from '../data/build.js';

const MONO = '"Martian Mono", ui-monospace, Menlo, monospace'; /* i18n-ok: a font name */
let B = build(START_DESIGN), MINE = [], BY = 'you';
export const setDesign = b => { B = b; };
/* the jobs you have finished here (they show in the plan as yours), and who wrote the description now */
export const setMine = (list, by) => { MINE = list || []; BY = by || 'you'; };
export const designNow = () => B;

const R = (x, y, w, h) => ({ r: [x, y, w, h] });
const sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
/* a panel standing in the studio: its face, and a little depth below and to the right */
function panel(G, x, y, w, h, fill) {
  const c = G.col, d = 12;
  G.ctx.beginPath(); G.ctx.moveTo(x + w, y); G.ctx.lineTo(x + w + d, y + d); G.ctx.lineTo(x + w + d, y + h + d); G.ctx.lineTo(x + d, y + h + d); G.ctx.lineTo(x, y + h); G.ctx.lineTo(x + w, y + h); G.ctx.closePath();
  G.ctx.fillStyle = c.dark ? c.up : c.dim; G.ctx.fill();
  G.r(x, y, w, h, fill || c.lo, c.line, 1);
}
function text(G, s, x, y, size, color, align, weight) {
  const ctx = G.ctx; ctx.font = (weight || 500) + ' ' + size + 'px ' + MONO; ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
/* the floor of the studio: a faint grid, so every station reads as one room */
function room(G) {
  const c = G.col; G.bg(c.bg);
  G.a(0.5); for (let x = 0; x <= 1000; x += 50) G.l([[x, 0], [x, 1000]], c.dim, 0.6); for (let y = 0; y <= 1000; y += 50) G.l([[0, y], [1000, y]], c.dim, 0.6); G.a(1);
}
/* which test pattern is shown now: they cycle, one a second or so */
const nowK = (G, n, rate) => Math.floor((G.t * (rate || 0.8))) % Math.max(1, n);
const bad = () => B.errs.length > 0;
/* a drawn tick or cross */
function mark(G, x, y, ok, s) {
  const c = G.col; s = s || 7;
  if (ok) G.l([[x - s, y], [x - s * 0.3, y + s * 0.7], [x + s, y - s * 0.8]], c.grn, 2.2);
  else { G.l([[x - s, y - s], [x + s, y + s]], c.red, 2.2); G.l([[x - s, y + s], [x + s, y - s]], c.red, 2.2); }
}
/* the design as a black box with its pins, values shown for one pattern */
function chipBox(G, x, y, w, h, v, o, lit) {
  const c = G.col, ni = B.ins.length, no = B.outs.length;
  panel(G, x, y, w, h, c.mid);
  G.r(x + 14, y + 14, w - 28, h - 28, null, lit ? c.warm : c.line, 1);
  const pin = (i, n, left, name, val) => {
    const py = y + (h * (i + 1)) / (n + 1), px = left ? x : x + w, ex = left ? x - 70 : x + w + 70;
    G.l([[px, py], [ex, py]], val ? c.warm : c.line, val ? 2.2 : 1.2);
    G.c(ex, py, 7, val ? c.warm : c.bg, val ? c.warm : c.line, 1.2);
    text(G, name, left ? ex - 16 : ex + 16, py, 19, c.hi, left ? 'right' : 'left', 600);
    text(G, String(val == null ? '·' : val), left ? px - 34 : px + 34, py - 14, 17, val ? c.warm : c.line, 'center', 600);
  };
  B.ins.forEach((n, i) => pin(i, ni, true, n, v ? v[n] : null));
  B.outs.forEach((n, i) => pin(i, no, false, n, o ? o[n] : null));
}

/* ---- 1. the job: one piece of a bigger goal, the community's computer (src/data/build.js) ---- */
/* who wrote a design: a person, an AI, both, or the lab's own example */
function who(G, kind, x, y, s) {
  const c = G.col;
  if (kind === 'person' || kind === 'both' || kind === 'example') { const cx = kind === 'both' ? x - s : x; G.c(cx, y - s * 0.45, s * 0.42, null, kind === 'example' ? c.line : c.hi, 1.1); G.ctx.beginPath(); G.ctx.arc(cx, y + s * 0.75, s * 0.75, Math.PI * 1.15, Math.PI * 1.85); G.ctx.strokeStyle = kind === 'example' ? c.line : c.hi; G.ctx.lineWidth = G.lw(1.1); G.ctx.stroke(); }
  if (kind === 'ai' || kind === 'both') { const cx = kind === 'both' ? x + s : x; G.r(cx - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2, null, c.cool, 1.1); G.c(cx - s * 0.22, y - s * 0.05, s * 0.12, c.cool); G.c(cx + s * 0.22, y - s * 0.05, s * 0.12, c.cool); for (const d of [-0.3, 0.3]) { G.l([[cx + d * s, y - s * 0.6], [cx + d * s, y - s * 0.85]], c.cool, 1); G.l([[cx + d * s, y + s * 0.6], [cx + d * s, y + s * 0.85]], c.cool, 1); } }
}
function planView(G, x0, y0, w, h) {
  const c = G.col, L = levels(), P = plan(MINE), here = needForProject(B.p), rh = Math.min(70, h / L.length), pos = {};
  L.forEach((row, i) => row.forEach((id, j) => { const bw = Math.min(150, w / row.length - 12); pos[id] = [x0 + (w * (j + 0.5)) / row.length - bw / 2, y0 + i * rh, bw, rh * 0.62]; }));
  /* lines from each piece up to what needs it */
  L.forEach(row => row.forEach(id => { const n = pos[id], par = (P[id] && NEEDS_PARENT[id]) || null; if (!par || !pos[par]) return; const q = pos[par]; G.l([[n[0] + n[2] / 2, n[1]], [n[0] + n[2] / 2, n[1] - rh * 0.19], [q[0] + q[2] / 2, n[1] - rh * 0.19], [q[0] + q[2] / 2, q[1] + q[3]]], c.line, 1); }));
  Object.entries(pos).forEach(([id, [x, y, bw, bh]]) => {
    const s = P[id], st = s.state, mineHere = here && here.id === id;
    if (s.yours) { G.a(0.22); G.r(x, y, bw, bh, c.warm); G.a(1); }
    const col = st === 'built' ? c.grn : st === 'open' ? c.warm : st === 'partly' ? c.hi : c.line;
    G.ctx.setLineDash(st === 'open' ? [5, 4] : st === 'engine' ? [2, 4] : []); G.r(x, y, bw, bh, s.yours ? null : c.lo, col, mineHere ? 2.6 : 1.2); G.ctx.setLineDash([]);
    text(G, t('build.need.' + id + '.t'), x + 8, y + bh * 0.36, Math.min(14, bw / 9), c.hi, 'left', 600);
    text(G, t('build.short.' + st, { built: s.built || 0, of: s.of || 0 }), x + 8, y + bh * 0.74, Math.min(11, bw / 12), col, 'left');
    (s.kinds || []).slice(0, 2).forEach((k, q) => who(G, k, x + bw - 14 - q * 26, y + bh * 0.4, 6));
    if (s.yours) who(G, BY === 'ai' ? 'ai' : BY === 'both' ? 'both' : 'person', x + bw - 14, y + bh * 0.4 + (s.kinds && s.kinds.length ? 0 : 0), 6);
  });
}
const NEEDS_PARENT = Object.fromEntries(NEEDS.map(n => [n.id, n.parent]));
const need = {
  parts: { plan: [R(20, 50, 960, 400)], box: [R(400, 520, 200, 230)], ins: [R(260, 510, 140, 250)], outs: [R(600, 510, 140, 250)], use: [R(770, 540, 200, 160)] },
  draw(G) {
    const c = G.col; room(G);
    planView(G, 20, 60, 960, 400);
    const vs = patterns(B), k = nowK(G, vs.length, 0.7), v = vs[k];
    /* what it must answer, from the job itself (not from your design) */
    let o = null, st = {};
    if (B.proj.f) { if (B.seq) { for (let j = 0; j <= k; j++) { const r = B.proj.f(vs[j], st); if (j === k) o = r.out; st = r.next; } } else o = B.proj.f(v); }
    chipBox(G, 400, 520, 200, 230, v, o, true);
    text(G, '?', 500, 635, 64, c.line, 'center', 300);
    useView(G, 780, 550, 180, 140, v, o);
  }
};
/* what the outputs mean where the circuit is used: a sum, a lamp, a display digit, a count, an ALU result */
function useView(G, x, y, w, h, v, o) {
  const c = G.col, d = B.proj.demo; panel(G, x, y, w, h, c.lo);
  if (!o || !v) return;
  const num = (bits) => bits.reduce((a, b) => a * 2 + (b | 0), 0);
  if (d === 'seg') {
    const n = { a: [[0, 0], [1, 0]], b: [[1, 0], [1, 1]], c: [[1, 1], [1, 2]], d: [[0, 2], [1, 2]], e: [[0, 1], [0, 2]], f: [[0, 0], [0, 1]], g: [[0, 1], [1, 1]] };
    const ox = x + w / 2 - 25, oy = y + 25, s = 50;
    Object.entries(n).forEach(([k, seg]) => G.l(seg.map(p => [ox + p[0] * s, oy + p[1] * s]), o[k] ? c.warm : c.dim, o[k] ? 6 : 3));
  } else if (d === 'lamp') {
    const on = o[B.outs[0]]; G.c(x + w / 2, y + h / 2, 34, on ? c.warm : c.bg, on ? c.warm : c.line, 1.5);
    if (on) { G.a(0.25); G.c(x + w / 2, y + h / 2, 52, c.warm); G.a(1); }
  } else if (d === 'count') {
    text(G, String(num(B.outs.map(n => o[n]))), x + w / 2, y + h / 2, 64, c.warm, 'center', 600);
  } else if (d === 'alu') {
    const op = ['and', 'or', 'xor', v.sub ? 'sub' : 'add'][v.op1 * 2 + v.op0];
    text(G, t('design.op.' + op), x + w / 2, y + 45, 22, c.hi, 'center', 600);
    text(G, 'y ' + o.y + '  cout ' + o.cout, x + w / 2, y + 100, 18, c.warm, 'center', 600); /* i18n-ok: pin names */
  } else {
    /* a sum: the inputs read as numbers, and the answer (half and full adders give sum then carry) */
    const three = B.ins.length === 3, half = three ? 1 : B.ins.length / 2;
    const a = num(B.ins.slice(0, half).map(n => v[n])), b = num(B.ins.slice(half, half * 2).map(n => v[n]));
    const s = B.outs.length === 2 ? o[B.outs[1]] * 2 + o[B.outs[0]] : num(B.outs.map(n => o[n]));
    text(G, a + ' + ' + b + (three ? ' + ' + v[B.ins[2]] : '') + ' = ' + s, x + w / 2, y + h / 2, 28, c.warm, 'center', 600); /* i18n-ok: a sum */
  }
}

/* ---- 2. the description: a few lines of text, and the table of what it must answer ---- */
const logic = {
  parts: { code: [R(60, 100, 520, 640)], table: [R(620, 100, 320, 640)] },
  draw(G) {
    const c = G.col; room(G);
    panel(G, 60, 100, 520, 640, c.lo);
    const lines = B.code.split('\n'), errAt = new Set(B.errs.map(e => e.l)), fs = Math.max(11, Math.min(22, 600 / Math.max(14, lines.length * 1.7)));
    const lh = fs * 1.7;
    lines.slice(0, Math.floor(600 / lh)).forEach((ln, i) => {
      const y = 140 + i * lh;
      if (errAt.has(i + 1)) { G.a(0.18); G.r(64, y - lh / 2, 512, lh, c.red); G.a(1); }
      text(G, String(i + 1), 92, y, fs * 0.85, c.line, 'right');
      /* names, operators and the rest in their own colours */
      let x = 110; const ctx = G.ctx; ctx.font = '500 ' + fs + 'px ' + MONO;
      ln.split(/(\s+|[=&|^~();])/).filter(Boolean).forEach(tok => {
        const col = /^[&|^~]$/.test(tok) ? c.warm : tok === '=' ? c.cool : /^reg$/.test(tok) ? c.grn : /^[01]$/.test(tok) ? c.cool : c.hi;
        text(G, tok, x, y, fs, col); x += ctx.measureText(tok).width;
      });
    });
    /* the table: every pattern of inputs, and the answer the job wants */
    panel(G, 620, 100, 320, 640, c.lo);
    const vs = patterns(B), cols = B.ins.concat(B.outs), n = Math.min(vs.length, 16), k = nowK(G, vs.length, 0.8), off = vs.length > 16 ? Math.max(0, Math.min(vs.length - 16, k - 8)) : 0;
    const cw = Math.min(40, 290 / cols.length), rh = Math.min(34, 560 / (n + 1)), x0 = 635;
    cols.forEach((nm, j) => text(G, nm, x0 + j * cw + cw / 2, 128, Math.min(13, cw * 0.42), j < B.ins.length ? c.line : c.warm, 'center', 600));
    G.l([[630, 146], [930, 146]], c.line, 1);
    let st = {};
    for (let j = 0; j < off + n; j++) {
      const v = vs[j]; let o = null;
      if (B.proj.f) { if (B.seq) { const r = B.proj.f(v, st); o = r.out; st = r.next; } else o = B.proj.f(v); } else if (B.rows) o = B.rows[j].o;
      if (j < off) continue;
      const y = 164 + (j - off) * rh;
      if (j === k) { G.a(0.16); G.r(628, y - rh / 2, 304, rh, c.warm); G.a(1); }
      cols.forEach((nm, q) => { const val = q < B.ins.length ? v[nm] : o ? o[nm] : '·'; text(G, String(val), x0 + q * cw + cw / 2, y, Math.min(14, rh * 0.5), q < B.ins.length ? c.hi : c.warm, 'center'); });
    }
  }
};

/* ---- 3. the check: every pattern run through your design, its answers against the job's ---- */
const check = {
  parts: { waves: [R(60, 120, 880, 520)], verdict: [R(60, 670, 880, 110)] },
  draw(G) {
    const c = G.col; room(G);
    panel(G, 60, 120, 880, 520, c.lo);
    if (bad() || !B.rows) { text(G, '—', 500, 380, 60, c.red, 'center'); return; }
    const rows = B.rows, n = Math.min(rows.length, 32), sig = B.ins.concat(B.outs), sh = Math.min(56, 470 / sig.length), x0 = 170, w = 750, cw = w / n;
    const live = G.mine && G.run != null ? Math.min(n, Math.floor(G.run * 4) + 1) : n;
    sig.forEach((nm, i) => {
      const y = 150 + i * sh + sh / 2, out = i >= B.ins.length;
      text(G, nm, x0 - 18, y, 14, out ? c.warm : c.line, 'right', 600);
      /* the trace: high for 1, low for 0; your design's answer, and where it differs from the job's, in red */
      const pts = [];
      for (let k = 0; k < live; k++) {
        const r = rows[k], val = out ? r.o[nm] : r.v[nm], yy = y + (val ? -sh * 0.28 : sh * 0.28);
        pts.push([x0 + k * cw, yy], [x0 + (k + 1) * cw, yy]);
        if (out && r.e && r.e[nm] !== r.o[nm]) { G.a(0.22); G.r(x0 + k * cw, y - sh * 0.42, cw, sh * 0.84, c.red); G.a(1); }
      }
      if (pts.length) G.l(pts, out ? c.warm : c.hi, out ? 2 : 1.4);
    });
    for (let k = 0; k <= n; k += Math.max(1, Math.round(n / 16))) G.l([[x0 + k * cw, 140], [x0 + k * cw, 620]], c.dim, 0.6);
    /* the verdict: one mark per pattern */
    panel(G, 60, 670, 880, 110, c.lo);
    for (let k = 0; k < live; k++) mark(G, x0 + (k + 0.5) * cw, 725, !rows[k].mis.length, Math.min(9, cw * 0.32));
  }
};

/* ---- 4. the gates: your description turned into cells from a library, wired together ---- */
function gateShape(G, type, x, y, w, h, fill, stroke) {
  const ctx = G.ctx, c = G.col; ctx.beginPath();
  const base = type.replace(/[0-9]/g, '');
  if (base === 'AND' || base === 'NAND') { ctx.moveTo(x, y); ctx.lineTo(x + w * 0.5, y); ctx.arc(x + w * 0.5, y + h / 2, h / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x, y + h); ctx.closePath(); }
  else if (base === 'OR' || base === 'NOR' || base === 'XOR' || base === 'XNOR') { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w * 0.6, y, x + w, y + h / 2); ctx.quadraticCurveTo(x + w * 0.6, y + h, x, y + h); ctx.quadraticCurveTo(x + w * 0.3, y + h / 2, x, y); }
  else if (base === 'INV' || base === 'BUF') { ctx.moveTo(x, y); ctx.lineTo(x + w * 0.85, y + h / 2); ctx.lineTo(x, y + h); ctx.closePath(); }
  else ctx.rect(x, y, w, h);
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = G.lw(1.4); ctx.stroke();
  if (base === 'XOR' || base === 'XNOR') { ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.quadraticCurveTo(x - 8 + w * 0.3, y + h / 2, x - 8, y + h); ctx.stroke(); }
  if (/^N|INV|XNOR/.test(base)) G.c(x + (base === 'INV' ? w * 0.85 : w) + 5, y + h / 2, 5, c.bg, stroke, 1.4);
  if (type === 'DFF') { G.l([[x, y + h - 14], [x + 10, y + h - 7], [x, y + h]], stroke, 1.2); }
}
function gatesLayout() {
  const M = B.M, L = B.levels, cols = Math.max(1, ...L), byCol = {};
  M.cells.forEach((cell, i) => { (byCol[L[i]] = byCol[L[i]] || []).push(i); });
  const most = Math.max(B.ins.length, B.outs.length, ...Object.values(byCol).map(a => a.length));
  const gw = Math.min(64, 560 / (cols + 1)), gh = Math.min(44, 560 / most * 0.62), pos = {};
  Object.entries(byCol).forEach(([col, list]) => list.forEach((i, j) => { const x = 180 + ((+col) * (640 / (cols + 1))), y = 130 + (560 * (j + 0.5)) / list.length; pos[i] = [x, y - gh / 2]; }));
  return { pos, gw, gh, cols };
}
const gates = {
  parts: { cells: [R(160, 110, 700, 600)], pins: [R(50, 110, 110, 600)], outs: [R(860, 110, 110, 600)] },
  draw(G) {
    const c = G.col; room(G);
    if (bad() || !B.M) { text(G, '—', 500, 380, 60, c.red, 'center'); return; }
    const M = B.M, { pos, gw, gh } = gatesLayout(), vs = patterns(B), k = nowK(G, vs.length, 0.6);
    let st = {}; if (B.seq) for (let j = 0; j < k; j++) st = simulate(B, vs[j], st).next;
    const S = simulate(B, vs[k], st), val = n => (S.val ? S.val[n] : undefined);
    /* where each net starts: an input pin, a flip-flop or a cell's output */
    const src = {};
    M.inputs.forEach((p, i) => { src[p.net] = [90, 130 + (560 * (i + 0.5)) / M.inputs.length]; });
    M.cells.forEach((cell, i) => { src[cell.out] = [pos[i][0] + gw + 10, pos[i][1] + gh / 2]; });
    const wire = (net, to, j) => { const a = src[net]; if (!a) return; const mid = a[0] + Math.max(14, (to[0] - a[0]) * (0.35 + 0.1 * (j % 3))); const on = val(net) === 1; G.l([a, [mid, a[1]], [mid, to[1]], to], on ? c.warm : c.line, on ? 2 : 1); };
    M.cells.forEach((cell, i) => { const [x, y] = pos[i]; cell.ins.forEach((net, j) => wire(net, [x, y + (gh * (j + 1)) / (cell.ins.length + 1)], i + j)); });
    M.outs.forEach((o, i) => wire(o.net, [910, 130 + (560 * (i + 0.5)) / M.outs.length], i));
    M.cells.forEach((cell, i) => { const [x, y] = pos[i], on = val(cell.out) === 1; gateShape(G, cell.type, x, y, gw, gh, c.mid, on ? c.warm : c.hi); if (gw > 40) text(G, cell.type.replace('2', ''), x + gw * 0.4, y + gh / 2, Math.min(11, gw * 0.2), c.line, 'center'); });
    M.inputs.forEach(p => { const [x, y] = src[p.net], on = val(p.net) === 1; G.c(x, y, 8, on ? c.warm : c.bg, on ? c.warm : c.line, 1.2); text(G, p.name, x - 16, y, 14, c.hi, 'right'); });
    M.outs.forEach((o, i) => { const y = 130 + (560 * (i + 0.5)) / M.outs.length, on = val(o.net) === 1; G.c(918, y, 8, on ? c.warm : c.bg, on ? c.warm : c.line, 1.2); text(G, o.name, 934, y, 14, c.hi); });
  }
};

/* ---- 5. the layout: the gates placed in rows on a tile of a shared chip, joined by two layers of metal ---- */
function tileXY(x0, y0, w, h) { const P = B.PL, s = Math.min(w / P.GW, h / P.H); return { s, X: x => x0 + (w - P.GW * s) / 2 + x * s, Y: y => y0 + (h - P.H * s) / 2 + y * s }; }
function drawTile(G, x0, y0, w, h, layers) {
  const c = G.col, P = B.PL, RT = B.RT, M = B.M, { s, X, Y } = tileXY(x0, y0, w, h), on = k => !layers || layers.includes(k);
  if (on('cells')) {
    for (let r = 0; r < P.rows; r++) { G.a(0.5); G.r(X(2), Y(r * P.TR + 1), (P.GW - 4) * s, 3 * s, c.mid); G.a(1); }
    M.cells.forEach((cell, i) => { const p = P.pos[i]; if (!p) return; G.r(X(2 + p.x) + 1, Y(p.r * P.TR + 1) + 1, p.w * s - 2, 3 * s - 2, c.dark ? c.up : c.dim, c.line, 0.8); if (p.w * s > 30 && !layers) text(G, cell.type.replace('2', ''), X(2 + p.x + p.w / 2), Y(p.r * P.TR + 2.5), Math.min(11, s * 0.8), c.line, 'center'); });
  }
  const seg = (want) => Object.values(RT.paths).forEach(segs => segs.forEach(path => { for (let k = 1; k < path.length; k++) {
    const a = path[k - 1], b = path[k], la = a % 2, lb = b % 2, ca = (a - la) / 2, cb = (b - lb) / 2, ax = ca % P.GW, ay = (ca - ax) / P.GW, bx = cb % P.GW, by = (cb - bx) / P.GW;
    if (la !== lb) { if (want === 'via') G.r(X(ax + 0.5) - s * 0.2, Y(ay + 0.5) - s * 0.2, s * 0.4, s * 0.4, c.hi); continue; }
    if ((want === 'm1' && la === 1) || (want === 'm2' && la === 0)) G.l([[X(ax + 0.5), Y(ay + 0.5)], [X(bx + 0.5), Y(by + 0.5)]], la === 1 ? c.cool : c.warm, Math.max(1.4, s * 0.3 * G.s));
  } }));
  if (on('m1')) seg('m1'); if (on('m2')) seg('m2'); if (on('via')) seg('via');
  if (on('pins')) { Object.values(P.ioIn).concat(Object.values(P.ioOut)).forEach(p => G.r(X(p.x), Y(p.y), s, s, c.warm)); }
  return { s, X, Y };
}
const layout = {
  parts: { tile: [R(40, 120, 600, 560)], shared: [R(690, 160, 270, 400)] },
  draw(G) {
    const c = G.col; room(G);
    if (bad() || !B.PL) { text(G, '—', 500, 380, 60, c.red, 'center'); return; }
    panel(G, 40, 120, 600, 560, c.lo);
    drawTile(G, 60, 140, 560, 520);
    /* the shared chip: many small designs side by side, each on its own tile, picked by a selector (as Tiny Tapeout does) */
    const sx = 700, sy = 170, cols = 4, rows = 6, tw = 60, th = 60, gap = 4;
    panel(G, sx - 16, sy - 16, cols * (tw + gap) + 28, rows * (th + gap) + 28, c.mid);
    const mineAt = DESIGNS.length;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const n = j * cols + i, x = sx + i * (tw + gap), y = sy + j * (th + gap);
      if (n < DESIGNS.length) { G.r(x, y, tw, th, c.dark ? c.up : c.dim, c.line, 0.8); who(G, DESIGNS[n].kind, x + tw / 2, y + th / 2, 9); }
      else if (n === mineAt) { G.r(x, y, tw, th, c.warm, c.warm, 1.5); who(G, BY === 'ai' ? 'ai' : BY === 'both' ? 'both' : 'person', x + tw / 2, y + th / 2, 9); }
      else { G.ctx.setLineDash([3, 4]); G.r(x, y, tw, th, null, c.line, 0.8); G.ctx.setLineDash([]); }
    }
    /* your tile, opened up into the big picture */
    const mx = sx + (mineAt % cols) * (tw + gap), my = sy + Math.floor(mineAt / cols) * (th + gap);
    G.ctx.setLineDash([5, 5]); G.l([[mx, my], [640, 120]], c.warm, 1); G.l([[mx, my + th], [640, 680]], c.warm, 1); G.ctx.setLineDash([]);
  }
};

/* ---- 6. the masks: the layout split into one stencil per layer, to be printed at the factory ---- */
const LAYERS = ['cells', 'm1', 'via', 'm2'];
const masks = {
  parts: { masks: [R(80, 90, 620, 640)], reticle: [R(790, 600, 160, 160)] },
  draw(G) {
    const c = G.col; room(G);
    if (bad() || !B.PL) { text(G, '—', 500, 380, 60, c.red, 'center'); return; }
    /* each layer on its own glass plate, stacked apart; the plates drift together and apart */
    const spread = 0.7 + 0.3 * Math.sin(G.t * 0.6), W = 440, H = 240;
    LAYERS.forEach((ly, i) => {
      const z = (LAYERS.length - 1 - i) * 150 * spread, ox = 110 + i * 20, oy = 520 - z;
      const ctx = G.ctx; ctx.save();
      /* a plate seen from above at a slant: a sheared rectangle */
      ctx.transform(1, 0, -0.5, 0.42, ox + H * 0.5, oy);
      G.a(0.85); G.r(0, 0, W, H, c.lo, c.line, 1.2); G.a(1);
      drawTile(G, 10, 10, W - 20, H - 20, [ly, 'pins']);
      ctx.restore();
      text(G, t('design.layer.' + ly), ox + W + 30, oy + 52, 14, ly === 'm1' ? c.cool : ly === 'm2' ? c.warm : c.hi, 'left', 600);
    });
    /* the reticle: one plate of quartz and chrome per layer, which the factory's scanner prints from */
    panel(G, 790, 600, 160, 160, c.mid);
    G.r(810, 620, 120, 120, c.dark ? c.up : c.dim, c.hi, 1);
    drawTile(G, 818, 628, 104, 104, ['m2']);
    G.l([[870, 590], [870, 560], [975, 560]], c.warm, 1.6); G.l([[963, 552], [975, 560], [963, 568]], c.warm, 1.6);
  }
};

export const DESIGN_SCENES = { need, logic, check, gates, layout, masks };

/* ---- the band under the picture: what this station does with your design ---- */
export function drawDesignBand(G, o) {
  const c = G.col, id = o.id, u = 1 / G.s, top = o.below > 120 ? 1000 : 818, bottom = top + (o.below > 120 ? o.below : 182);
  G.a(0.96); G.r(-2000, top, 5000, bottom - top + 400, c.bg); G.a(1); G.l([[0, top], [1000, top]], c.line, 1);
  const pad = 16, x = pad, ctx = G.ctx, w = 1000 - 2 * pad;
  /* your design's state, in a word and a mark, and which job it is */
  const ok = B.ok, state = B.errs.length ? 'errs' : B.spec ? (B.bad ? 'wrong' : 'right') : 'free';
  mark(G, x + 8 * u, top + 22 * u, state === 'right' || state === 'free', 6 * u);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = '600 ' + 11.5 * u + 'px ' + MONO; ctx.fillStyle = ok ? c.grn : c.red;
  const said = t('design.state.' + state, { bad: B.bad || 0, total: B.total || 0, errs: B.errs.length }) + ' · ' + t('build.by.' + BY), job = t('design.proj.' + B.p + '.t');
  ctx.fillText(said, x + 22 * u, top + 22 * u);
  /* the job's name on the right, when there is room for both (the card names it too) */
  if (ctx.measureText(said).width + ctx.measureText(job).width + 50 * u < w) { ctx.textAlign = 'right'; ctx.fillStyle = c.warm; ctx.fillText(job, 1000 - pad, top + 22 * u); ctx.textAlign = 'left'; }
  /* the caption: what happens at this station */
  ctx.font = '600 ' + 14 * u + 'px ' + MONO; ctx.fillStyle = c.hi; ctx.fillText(t('design.cap.' + id + '.t'), x, top + 46 * u);
  ctx.font = '400 ' + 13 * u + 'px system-ui, sans-serif'; ctx.textBaseline = 'top'; /* i18n-ok: a font name */
  let line = '', y = top + 58 * u; const words = t('design.cap.' + id + '.d', numbers()).split(/\s+/);
  for (const wd of words) { const tr = line ? line + ' ' + wd : wd; if (ctx.measureText(tr).width > w && line) { ctx.fillText(line, x, y); y += 17 * u; line = wd; if (y > bottom - 14 * u) { line = ''; break; } } else line = tr; }
  if (line) ctx.fillText(line, x, y);
}
/* the numbers the captions can use */
export const numbers = () => ({ cells: B.M ? B.M.cells.length : 0, transistors: B.transistors || 0, vectors: B.vectors || 0, caught: Math.round((B.coverage || 0) * 100), wire: B.RT ? B.RT.wl : 0, vias: B.RT ? B.RT.vias : 0, masks: B.masks || 0, depth: B.st ? B.st.depth : 0, total: B.total || 0, bad: B.bad || 0 });
