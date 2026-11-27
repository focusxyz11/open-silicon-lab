/* The drawing and the line: the design studio and the fab as one sheet. A guiding prototype by Claude Fable 5.2.
   Across runs a chip's life: the drawing (Design) at the left, then the line's stations (Make), one wafer in each.
   In and out is scale: chip, block, gate, switch, the same four levels in every frame, so <- -> keeps your depth
   ("a gate as designed, as made"). The studio is the dive as designed: the same die, drafted in dashed outline. Every
   station holds the same die as made so far: each step visibly does something to your design, and the masks drawn at the
   left are the ones Print sweeps across the wafer.
   REAL ENGINES: the carry, the line's care (spread, specks, yield, cost) and the die's area come from the lab's
   src/engines/path.js (with litho.js, fabline.js, chip.js behind it), the recipe's genes from arch.js.
   STAND-INS, to be replaced in the port (marked "a stand-in" on the picture): the heat map (a sum of blurred sources),
   the placer (annealing on 45 slots), timing on the layout (gate delay from the carry + a fixed delay per slot of wire;
   the port should use timing.js and tinychip.js), the coverage map (a 4-bit adder of NAND gates simulated here on all
   512 states, one wire moved), the cell's layout and cross-section (drawn, not from rules.js's mask set). */
import * as P from '../../../../src/engines/path.js';
import * as A from '../../../../src/engines/arch.js';
import { EXAMPLE } from '../../../../src/data/path.js';
import { STR, t } from './strings.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, u) => a + (b - a) * u, ease = u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const H = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const THEMES = { dark: { bg: '#0b1120', ink: '#eef2f8', mut: '#9aa8bd', acc: '#5aa9ff', bad: '#ff6b62', warm: '#ffb347', panel: '#121b2e' }, light: { bg: '#dfe8f2', ink: '#16202e', mut: '#5b6a80', acc: '#2f7de1', bad: '#d8403a', warm: '#b86f0c', panel: '#f6f9fc' } };
const mk = h => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return a => 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
let C = {}, dirty = true;
function setTheme() { const th = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); C = {}; for (const k in THEMES[th]) C[k] = mk(THEMES[th][k]); C.th = th; dirty = true; }
const fSerif = (px, w = 600, it) => (it ? 'italic ' : '') + w + ' ' + px + 'px "Besley", Georgia, serif', fSans = (px, w = 400) => w + ' ' + px + 'px "Atkinson Hyperlegible Next", system-ui, sans-serif', fMono = (px, w = 400) => w + ' condensed ' + px + 'px "Martian Mono", ui-monospace, monospace';

/* ---------- what you set, and what the lab's engines make of it ---------- */
const S = { g: Object.assign({}, A.TODAY), care: 1, period: 300, cover: false };
let R, die, line;
function recompute() { R = P.carry(P.stackOf(S.g, Object.assign({}, EXAMPLE, { care: S.care }), 'any')); die = R.rungs.chip.more.die; line = R.fab; heatOf(); dirty = true; }
const STAGES = ['design', 'crystal', 'deposit', 'print', 'etch', 'implant', 'wires', 'test'], LEVELS = ['line', 'chip', 'block', 'gate', 'switch'];

/* the floorplan, from the recipe's own genes: its shape, and where it computes */
function plan(g) {
  const far = g.where === 'far', x1 = far ? 640 : 930, U = [], M = [];
  const grid = (n, m) => { const w = (x1 - 70) / n, h = 860 / m; for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) U.push([70 + i * w + w * 0.06, 70 + j * h + h * 0.06, w * 0.88, h * 0.88]); };
  if (g.shape === 'few') grid(2, 2); else if (g.shape === 'grid') grid(4, 4); else if (g.shape === 'stack') grid(2, 1); else { grid(6, 5); U.forEach((u, i) => { u[0] += (H(i) - 0.5) * 30; u[1] += (H(i + 9) - 0.5) * 30; u[2] *= 0.7; u[3] *= 0.7; }); }
  if (far) M.push([700, 70, 230, 860]);
  if (g.where === 'near') U.forEach(u => { M.push([u[0] + u[2] * 0.8, u[1], u[2] * 0.2, u[3]]); u[2] *= 0.76; });
  const u = U[0], alu = [u[0] + u[2] * 0.05, u[1] + u[3] * 0.09, u[2] * 0.9, u[3] * 0.52];
  return { U, M, alu, reg: [u[0] + u[2] * 0.05, u[1] + u[3] * 0.72, u[2] * 0.52, u[3] * 0.22], ctl: [u[0] + u[2] * 0.63, u[1] + u[3] * 0.72, u[2] * 0.32, u[3] * 0.22], layers: g.shape === 'stack' ? 2 : 1 };
}
/* STAND-IN: heat as a sum of blurred sources; trips as the mean way from a unit to its memory */
let PL, HEAT;
function measure(g) {
  const pl = plan(g), N = 22, T = new Float32Array(N * N), pw = 4 / pl.U.length * pl.layers * (g.where === 'in' ? 1.15 : 1); let hot = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = (i + 0.5) * 1000 / N, y = (j + 0.5) * 1000 / N; let v = 0; for (const u of pl.U) { const dx = x - u[0] - u[2] / 2, dy = y - u[1] - u[3] / 2; v += pw * Math.exp(-(dx * dx + dy * dy) / 52000); } for (const m of pl.M) { const dx = x - m[0] - m[2] / 2, dy = y - m[1] - m[3] / 2; v += 0.25 * Math.exp(-(dx * dx + dy * dy) / 52000) / Math.max(1, pl.M.length / 4); } T[j * N + i] = v; hot = Math.max(hot, v); }
  const trip = g.where === 'far' ? pl.U.reduce((s, u) => s + Math.abs(815 - u[0] - u[2] / 2) + Math.abs(500 - u[1] - u[3] / 2) * 0.5, 0) / pl.U.length : g.where === 'near' ? pl.U[0][2] * 0.55 : g.where === 'flow' ? pl.U[0][2] * 1.1 : pl.U[0][2] * 0.1;
  return { pl, T, N, hot, deg: 30 + 21 * hot, trip };
}
function heatOf() { HEAT = measure(S.g); PL = HEAT.pl; }
const mm = () => Math.sqrt(die.area) * 10;                     /* the die's side in mm, from the chip engine's area */

/* STAND-IN: a 4-bit adder of NAND gates (four of your 32 slices), placed on 45 slots, timed and tested here */
const NET = []; const OUT = [];
{ const add = (a, b) => NET.push([a, b]) - 1; let c = 'c';
  for (let i = 0; i < 4; i++) { const a = 'a' + i, b = 'b' + i, n1 = add(a, b), n2 = add(a, n1), n3 = add(b, n1), n4 = add(n2, n3), n5 = add(n4, c), n6 = add(n4, n5), n7 = add(c, n5); OUT.push(add(n6, n7)); c = add(n1, n5); } OUT.push(c); }
const COLS = 9, ROWS = 5, HAND = NET.map((_, i) => i + ((i / 9) | 0) * 0);
let pos = HAND.slice();
const slotXY = s => [s % COLS, (s / COLS) | 0], pinXY = p => (p === 'c' ? [-0.9, -0.55] : [-0.9, +p[1] + (p[0] === 'a' ? -0.22 : 0.22)]);
const srcXY = (r, ps) => (typeof r === 'number' ? slotXY(ps[r]) : pinXY(r));
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const wireOf = ps => NET.reduce((s, g, i) => s + dist(srcXY(g[0], ps), slotXY(ps[i])) + dist(srcXY(g[1], ps), slotXY(ps[i])), 0);
const WIRE_PS = 7;
function timing(ps) { const gd = R.rungs.gate.hands.delay * 1e12, arr = [], from = []; NET.forEach((g, i) => { let best = -1, bi = 0; g.forEach((r, k) => { const v = (typeof r === 'number' ? arr[r] : 0) + WIRE_PS * dist(srcXY(r, ps), slotXY(ps[i])); if (v > best) { best = v; bi = k; } }); arr[i] = best + gd; from[i] = g[bi]; });
  let end = OUT[0]; for (const o of OUT) if (arr[o] > arr[end]) end = o; const path = []; for (let x = end; typeof x === 'number'; x = from[x]) path.push(x); return { arr, worst: arr[end], path, from }; }
const HAND_WIRE = wireOf(HAND); let settledWire = null, anneal = null;
function evalNet(net, st) { const v = {}, pin = p => (p === 'c' ? st >> 8 & 1 : p[0] === 'a' ? st >> +p[1] & 1 : st >> (4 + +p[1]) & 1), val = r => (typeof r === 'number' ? v[r] : pin(r)); net.forEach((g, i) => { v[i] = 1 - (val(g[0]) & val(g[1])); }); let o = 0; OUT.forEach((x, k) => { o |= v[x] << k; }); return o; }
const want = st => (st & 15) + (st >> 4 & 15) + (st >> 8 & 1);
/* the bug: the one moved wire that the fewest states show (the engine picks the hardest to find) */
let BUG = null, tested = new Uint8Array(512), nTested = 0, nWrong = 0;
function findBug() { let best = 600; const pins = ['c', 'a0', 'a1', 'a2', 'a3', 'b0', 'b1', 'b2', 'b3'];
  NET.forEach((g, i) => { for (const k of [0, 1]) for (const alt of pins.concat([...Array(i).keys()].slice(-10))) { if (alt === g[k]) continue; const net = NET.map(x => x.slice()); net[i][k] = alt; let w = 0; for (let st = 0; st < 512 && w < best; st++) if (evalNet(net, st) !== want(st)) w++; if (w > 0 && w < best) { best = w; BUG = net; } } }); }
function runTests(all) { if (!BUG) findBug(); S.cover = true; let n = all ? 512 : 20, st = 0; while (n-- > 0) { if (all) st = 511 - n; else { let tries = 0; do st = Math.floor(Math.random() * 512); while (tested[st] && tries++ < 40); } if (tested[st]) continue; tested[st] = evalNet(BUG, st) === want(st) ? 1 : 2; nTested++; if (tested[st] === 2) nWrong++; } dirty = true; tools(); }

/* ---------- the sheet: frames across (a chip's life), the same die in each ---------- */
const FW = 1400;
const dieT = f => (f ? { ox: f * FW + 630, oy: 530, k: 0.14 } : { ox: 200, oy: 100, k: 1 });
const cellRect = s => { const a = PL.alu, [c, r] = slotXY(s), cw = a[2] * 0.86 / COLS, ch = a[3] * 0.84 / ROWS; return [a[0] + a[2] * 0.12 + c * cw, a[1] + a[3] * 0.13 + r * ch, cw * 0.62, ch * 0.56]; };
const pinPt = p => { const a = PL.alu, [c, r] = pinXY(p), cw = a[2] * 0.86 / COLS, ch = a[3] * 0.84 / ROWS; return [a[0] + a[2] * 0.12 + (c + 0.5) * cw, a[1] + a[3] * 0.13 + (r + 0.28) * ch]; };
function rectOf(f, l) {
  const T = dieT(f), d = r => [T.ox + r[0] * T.k, T.oy + r[1] * T.k, r[2] * T.k, r[3] * T.k];
  if (l <= 0) return f ? [f * FW + 40, -90, 1320, 1360] : [60, -330, 1900, 1560];
  if (l === 1) return d([-60, -60, 1120, 1120]);
  if (l === 2) return d([PL.alu[0] - PL.alu[2] * 0.06, PL.alu[1] - PL.alu[3] * 0.1, PL.alu[2] * 1.12, PL.alu[3] * 1.2]);
  const c0 = cellRect(pos[0]);
  if (l === 3) return d([c0[0] - c0[2] * 0.9, c0[1] - c0[3] * 0.9, c0[2] * 5.4, c0[3] * 4.4]);
  return d([c0[0] - c0[2] * 0.5, c0[1] - c0[3] * 0.42, c0[2] * 2, c0[3] * 2.2]);
}
const HOME = [-80, -420, 8 * FW + 160, 1900];
const cv = $('#world'), ctx = cv.getContext('2d'); let vw = 0, vh = 0, dpr = 1;
const cam = { x: 0, y: 0, s: 0.1 }, view = { f: 0, l: -1 }; let anim = null;
const phone = () => vw < 760, pad = () => (phone() ? { l: 10, r: 10, t: 100, b: 150 } : { l: 190, r: 30, t: 96, b: 190 });
function fit(r) { const p = pad(), s = Math.min((vw - p.l - p.r) / r[2], (vh - p.t - p.b) / r[3]); return { s, x: r[0] + r[2] / 2 - ((p.l - p.r) / 2) / s, y: r[1] + r[3] / 2 - ((p.t - p.b) / 2) / s }; }
function fly(to, ms = 900) { const from = { x: cam.x, y: cam.y, s: cam.s }, far = Math.hypot(to.x - from.x, to.y - from.y) * Math.min(from.s, to.s), hop = far > vw ? clamp(1 - vw / far, 0, 0.8) : 0; anim = { from, to, t0: performance.now(), dur: REDUCED ? 0 : ms * (1 + hop * 0.5), hop }; dirty = true; }
function stepAnim(now) { if (!anim) return; const u = anim.dur ? clamp((now - anim.t0) / anim.dur, 0, 1) : 1, e = ease(u), a = anim.from, b = anim.to; cam.s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)) * (1 - anim.hop * Math.sin(Math.PI * u));
  if (b.s >= a.s) { const k = Math.min(1.5, a.s / cam.s) * (1 - e); cam.x = b.x + (a.x - b.x) * k; cam.y = b.y + (a.y - b.y) * k; } else { const k = Math.min(1.5, b.s / cam.s) * e; cam.x = a.x + (b.x - a.x) * k; cam.y = a.y + (b.y - a.y) * k; }
  dirty = true; if (u >= 1) { anim = null; ui(); } }
function go(f, l, ms) { view.f = clamp(f, 0, 7); view.l = clamp(l, -1, 4); lens = null; fly(fit(view.l < 0 ? HOME : rectOf(view.f, view.l)), ms); ui(); }
const X = x => (x - cam.x) * cam.s + vw / 2, Y = y => (y - cam.y) * cam.s + vh / 2;

/* ---------- drawing ---------- */
let LBL = [], MARKS = [];
function label(x, y, text, font, px, color, o = {}) { LBL.push({ x, y, text, font, px, color, align: o.align || 'left', pri: o.pri || 0, bg: o.bg, fid: o.fid, by: o.by }); }
function flush() { LBL.sort((a, b) => b.pri - a.pri); const placed = [];
  for (const L of LBL) { ctx.font = L.font; const w = ctx.measureText(L.text).width + (L.fid ? 18 : 0), x0 = L.align === 'right' ? L.x - w : L.align === 'center' ? L.x - w / 2 : L.x, b = [x0 - 4, L.y - L.px * 0.84, x0 + w + 4, L.y + L.px * 0.26 + (L.fid ? 13 : 0)];
    if (b[0] < 2 || b[2] > vw - 2 || b[1] < 60 || placed.some(p => b[0] < p[2] && b[2] > p[0] && b[1] < p[3] && b[3] > p[1])) continue; placed.push(b);
    if (L.bg) { ctx.fillStyle = C.bg(0.84); ctx.fillRect(b[0] - 1, b[1] - 3, b[2] - b[0] + 2, b[3] - b[1] + 6); }
    ctx.fillStyle = L.color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(L.text, x0, L.y);
    if (L.fid) { const n = { stand: 0, idea: 1, figures: 2, computed: 3 }[L.fid]; for (let i = 0; i < 4; i++) { const h = 3 + i * 2; ctx.fillStyle = C.mut(i < n ? 0.95 : 0.3); ctx.fillRect(x0 + i * 3.4, L.y + 12 - h, 2.2, h); } ctx.font = fMono(10); ctx.fillStyle = C.mut(0.95); ctx.fillText(STR.fid[L.fid] + (L.by ? ': ' + STR.fid.by[L.by] : ''), x0 + 17, L.y + 12); } }
  LBL = []; }
const mark = (x, y, id) => MARKS.push({ x, y, id });
function rr(x, y, w, h) { ctx.rect(X(x), Y(y), w * cam.s, h * cam.s); }

function drawDie(f, lite, bad) {
  const T = dieT(f), k = T.k * cam.s, dx = x => X(T.ox + x * T.k), dy = y => Y(T.oy + y * T.k), px = 1000 * k, made = f > 0, tm = REDUCED ? 0 : performance.now() / 1000;
  if (dx(1000) < -50 || dx(0) > vw + 50 || dy(1000) < -50 || dy(0) > vh + 50) return;
  const R4 = r => ctx.rect(dx(r[0]), dy(r[1]), r[2] * k, r[3] * k), dash = made ? [] : [6, 4];
  const ink = made ? (f === 3 ? C.acc : C.ink) : C.acc, shown = !made || f >= 3, solid = made && f >= 4;
  ctx.beginPath(); R4([0, 0, 1000, 1000]); if (made && f >= 2) { ctx.fillStyle = bad ? C.bad(0.75) : C.ink(f === 2 ? 0.1 : 0.05); ctx.fill(); }
  ctx.strokeStyle = made ? C.ink(f < 3 ? 0.25 : 0.55) : C.acc(0.9); ctx.lineWidth = lite ? 1 : 1.4; ctx.setLineDash(made && f < 3 ? [3, 3] : dash); ctx.stroke(); ctx.setLineDash([]);
  if (px < 34 || !shown || bad) return;
  /* heat under the drafted floorplan */
  if (!made && px > 220 && PL.alu[2] * k < 620) { const N = HEAT.N, c = 1000 / N; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = HEAT.T[j * N + i] / 3.2; if (v > 0.12) { ctx.fillStyle = C.bad(Math.min(0.5, (v - 0.12) * 0.55)); ctx.fillRect(dx(i * c), dy(j * c), c * k + 0.5, c * k + 0.5); } } }
  ctx.beginPath(); for (const u of PL.U) { R4(u); if (PL.layers > 1) R4([u[0] + 22, u[1] + 22, u[2], u[3]]); }
  if (solid) { ctx.fillStyle = C.ink(0.1); ctx.fill(); } else if (made) { ctx.fillStyle = C.acc(0.16); ctx.fill(); }
  ctx.strokeStyle = ink(0.9); ctx.lineWidth = 1.2; ctx.setLineDash(dash); ctx.stroke();
  ctx.beginPath(); for (const m of PL.M) { R4(m); if (px > 120) for (let q = 1; q < 6; q++) { ctx.moveTo(dx(m[0] + m[2] * 0.15), dy(m[1] + m[3] * q / 6)); ctx.lineTo(dx(m[0] + m[2] * 0.85), dy(m[1] + m[3] * q / 6)); } }
  if (S.g.where === 'far') for (const u of PL.U) { ctx.moveTo(dx(u[0] + u[2]), dy(u[1] + u[3] / 2)); ctx.lineTo(dx(700), dy(u[1] + u[3] / 2)); }
  if (S.g.where === 'flow') PL.U.forEach((u, i) => { const v = PL.U[i + 1]; if (v && v[1] === u[1]) { ctx.moveTo(dx(u[0] + u[2]), dy(u[1] + u[3] / 2)); ctx.lineTo(dx(v[0]), dy(v[1] + v[3] / 2)); } });
  if (S.g.where === 'in' && px > 90) for (const u of PL.U) for (let q = 0.15; q < 1; q += 0.14) { ctx.moveTo(dx(u[0] + u[2] * q), dy(u[1])); ctx.lineTo(dx(u[0] + u[2] * Math.max(0, q - 0.3)), dy(u[1] + u[3])); }
  ctx.strokeStyle = made ? ink(0.6) : C.mut(0.9); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
  if (lite || px < 200) return;
  ctx.beginPath(); for (let i = 0; i < 24; i++) { for (const e of [8, 972]) { ctx.rect(dx(40 + i * 39), dy(e), 20 * k, 20 * k); ctx.rect(dx(e), dy(40 + i * 39), 20 * k, 20 * k); } } ctx.strokeStyle = ink(0.5); ctx.stroke();
  const u0 = PL.U[0], a = PL.alu, apx = a[2] * k;
  if (!made) { label(dx(0), dy(0) - 10, STR.d.die, fSerif(clamp(px * 0.03, 14, 24), 700), clamp(px * 0.03, 14, 24), C.ink(1), { pri: 60 });
    if (apx < 620 && view.f === 0) { const big = clamp(px * 0.022, 12, 16); label(dx(500), dy(1000) + 22, t(STR.d.hot, { x: HEAT.deg.toFixed(0) }), fMono(big, 500), big, HEAT.deg > 80 ? C.bad(1) : C.ink(1), { align: 'center', pri: 50, fid: 'stand', by: 'here' }); label(dx(500), dy(1000) + 56, t(STR.d.trip, { x: (HEAT.trip / 1000 * mm()).toFixed(2) }), fMono(big, 500), big, C.ink(1), { align: 'center', pri: 49, fid: 'stand', by: 'here' });
      let hi = 0; HEAT.T.forEach((v, i) => { if (v > HEAT.T[hi]) hi = i; }); mark(dx((hi % HEAT.N + 0.5) * 1000 / HEAT.N), dy(((hi / HEAT.N | 0) + 0.5) * 1000 / HEAT.N), 'geo'); }
    if (PL.M[0] && S.g.where === 'far' && px > 300) label(dx(PL.M[0][0] + PL.M[0][2] / 2), dy(PL.M[0][1]) - 6, STR.d.mem, fSans(12), 12, C.mut(1), { align: 'center', pri: 20 }); }
  if (u0[2] * k < 130) return;
  /* inside a core: your block, the registers, the control */
  ctx.beginPath(); R4(a); R4(PL.reg); R4(PL.ctl); ctx.strokeStyle = ink(0.95); ctx.lineWidth = 1.3; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
  if (!made && apx < 900) { label(dx(a[0]), dy(a[1]) - 6, STR.d.alu, fSans(12.5, 700), 12.5, C.ink(1), { pri: 40, bg: true }); if (!S.cover) label(dx(PL.reg[0]), dy(PL.reg[1]) - 6, STR.d.reg, fSans(12), 12, C.mut(1), { pri: 18 }); label(dx(PL.ctl[0]), dy(PL.ctl[1]) - 6, STR.d.ctl, fSans(12), 12, C.mut(1), { pri: 18 }); }
  /* the check: every state of the block, tested or not, a wrong answer red */
  if (!made && S.cover && apx > 120) { const r = PL.reg, cw = r[2] / 32, ch = r[3] / 16; for (let st = 0; st < 512; st++) { const v = tested[st]; ctx.fillStyle = v === 2 ? C.bad(1) : v ? C.acc(0.75) : C.ink(0.09); ctx.fillRect(dx(r[0] + (st % 32) * cw) + 0.5, dy(r[1] + (st / 32 | 0) * ch) + 0.5, cw * k - 1, ch * k - 1); }
    label(dx(r[0]), dy(r[1]) - 8, t(STR.d.cover, { n: nTested }), fMono(11.5, 500), 11.5, C.ink(1), { pri: 45, bg: true, fid: 'computed', by: 'here' }); label(dx(r[0]), dy(r[1] + r[3]) + 16, nWrong ? STR.d.found : STR.d.none, fSans(12.5, 700), 12.5, nWrong ? C.bad(1) : C.mut(1), { pri: 44, bg: true }); mark(dx(r[0] + r[2]), dy(r[1] + r[3] * 0.5), 'trust'); }
  if (apx < 150) return;
  /* your slices, placed: cells, wires, and the longest path against the clock */
  const tim = timing(pos), late = tim.worst > S.period, crit = new Set(tim.path), cen = i => { const c = cellRect(pos[i]); return [c[0] + c[2] / 2, c[1] + c[3] / 2]; }, src = r => (typeof r === 'number' ? (c => [c[0] + c[2], c[1] + c[3] / 2])(cellRect(pos[r])) : pinPt(r));
  const wires = (pick, col, lw) => { ctx.beginPath(); NET.forEach((g, i) => g.forEach(r => { const on = crit.has(i) && tim.from[i] === r; if (on !== pick) return; const p = src(r), c = cellRect(pos[i]), q = [c[0], c[1] + c[3] * (r === g[0] ? 0.3 : 0.7)], mx = (p[0] + q[0]) / 2; ctx.moveTo(dx(p[0]), dy(p[1])); ctx.lineTo(dx(mx), dy(p[1])); ctx.lineTo(dx(mx), dy(q[1])); ctx.lineTo(dx(q[0]), dy(q[1])); })); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); };
  if (!made || f >= 6) { ctx.setLineDash(made ? [] : [3, 3]); wires(false, made ? C.ink(0.55) : C.acc(0.4), 1); ctx.setLineDash([]); wires(true, made ? C.ink(0.9) : late ? C.bad(1) : C.acc(1), made ? 1.4 : 2.6); }
  const cpx = cellRect(0)[2] * k, sp = line.spread;
  NET.forEach((g, i) => { const c = cellRect(pos[i]), jit = (H(i + 3) - 0.5) * sp, stray = made && f >= 4 && Math.abs(jit) > 0.42;
    ctx.beginPath(); R4(c); if (solid) { ctx.fillStyle = stray ? C.bad(0.3) : C.panel(1); ctx.fill(); } ctx.strokeStyle = stray ? C.bad(1) : crit.has(i) && !made ? (late ? C.bad(1) : C.acc(1)) : ink(0.85); ctx.lineWidth = drag && drag.cell === i ? 2.6 : 1.2; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
    if (cpx < 44) return;
    /* one cell: two strips of silicon, two gates across them, rails above and below; as made, each step adds its layer */
    const sx = c[0], sy = c[1], w = c[2], h = c[3], gw = w * 0.07 * (made ? 1 + jit * 0.9 : 1), strips = [[sx + w * 0.12, sy + h * 0.16, w * 0.76, h * 0.24], [sx + w * 0.12, sy + h * 0.6, w * 0.76, h * 0.24]];
    ctx.beginPath(); strips.forEach(R4); if (made && f >= 5) { ctx.fillStyle = C.acc(0.3); ctx.fill(); } ctx.strokeStyle = made ? C.ink(0.6) : C.acc(0.9); ctx.setLineDash(dash); ctx.stroke();
    ctx.beginPath(); for (const gx of [0.36, 0.6]) { const x0 = sx + w * gx - gw / 2; if (made && cpx > 120) { ctx.moveTo(dx(x0), dy(sy + h * 0.08)); for (let q = 0; q <= 10; q++) ctx.lineTo(dx(x0 + gw + (H(i * 31 + q + gx * 9) - 0.5) * gw * 0.45 * sp), dy(sy + h * (0.08 + 0.84 * q / 10))); for (let q = 10; q >= 0; q--) ctx.lineTo(dx(x0 + (H(i * 17 + q + gx * 5) - 0.5) * gw * 0.45 * sp), dy(sy + h * (0.08 + 0.84 * q / 10))); ctx.closePath(); } else R4([x0, sy + h * 0.08, gw, h * 0.84]); }
    if (made) { ctx.fillStyle = f === 3 ? C.acc(0.45) : stray ? C.bad(0.9) : C.ink(0.85); ctx.fill(); } ctx.strokeStyle = made ? (stray ? C.bad(1) : ink(1)) : C.bad(0.9); ctx.stroke(); ctx.setLineDash([]);
    if (!made || f >= 6) { ctx.beginPath(); ctx.moveTo(dx(sx), dy(sy + h * 0.04)); ctx.lineTo(dx(sx + w), dy(sy + h * 0.04)); ctx.moveTo(dx(sx), dy(sy + h * 0.96)); ctx.lineTo(dx(sx + w), dy(sy + h * 0.96)); ctx.strokeStyle = ink(0.9); ctx.lineWidth = made ? 3 : 1.6; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]); }
    if (i === 0 && cpx > 110) {
      if (!made) { label(dx(sx), dy(sy) - 8, STR.d.cell, fSans(13, 700), 13, C.ink(1), { pri: 48, bg: true, fid: 'idea' }); label(dx(sx), dy(sy + h) + 20, STR.d.drafted, fSerif(13, 400, true), 13, C.mut(1), { pri: 30 }); }
      else { /* cut through one switch: what this station has added */
        const y0 = sy + h * 1.42, bx = sx + w * 0.1, bw = w * 0.8, u = h * 0.07; ctx.fillStyle = C.bg(1); ctx.fillRect(dx(sx - w * 0.2), dy(sy + h * 1.06), w * 1.4 * k, h * 0.8 * k); ctx.fillStyle = C.ink(0.14); ctx.fillRect(dx(bx), dy(y0), bw * k, u * 3 * k); ctx.strokeStyle = C.ink(0.7); ctx.lineWidth = 1; ctx.strokeRect(dx(bx), dy(y0), bw * k, u * 3 * k);
        if (f === 2 || f === 3) { ctx.fillStyle = C.ink(0.45); ctx.fillRect(dx(bx), dy(y0 - u), bw * k, u * k); }
        if (f === 3) { ctx.fillStyle = C.acc(0.6); ctx.fillRect(dx(bx + bw * 0.42), dy(y0 - u * 2.4), bw * 0.16 * k, u * 1.4 * k); }
        if (f >= 4) { ctx.fillStyle = C.ink(0.9); ctx.fillRect(dx(bx + bw * 0.42 - bw * 0.03 * jit), dy(y0 - u * 1.6), bw * 0.16 * (1 + jit * 0.5) * k, u * 1.6 * k); }
        if (f >= 5) { ctx.fillStyle = C.acc(0.55); ctx.fillRect(dx(bx + bw * 0.12), dy(y0), bw * 0.3 * k, u * k); ctx.fillRect(dx(bx + bw * 0.58), dy(y0), bw * 0.3 * k, u * k); }
        if (f >= 6) { ctx.fillStyle = C.ink(0.8); for (const q of [0.24, 0.72]) ctx.fillRect(dx(bx + bw * q), dy(y0 - u * 3.4), bw * 0.04 * k, u * 3.4 * k); ctx.fillRect(dx(bx + bw * 0.14), dy(y0 - u * 4.2), bw * 0.72 * k, u * 0.8 * k); }
        label(dx(bx), dy(y0 + u * 3) + 18, STR.m.section, fSans(12.5), 12.5, C.mut(1), { pri: 30, fid: 'idea' }); label(dx(sx), dy(sy) - 8, [0, 0, STR.m.film, STR.m.latent, STR.m.etched, STR.m.doped, STR.m.wired, STR.m.wired][f], fSans(13, 700), 13, C.ink(1), { pri: 48, bg: true });
      } }
    if (stray && cpx > 70) label(dx(sx), dy(sy + h) + 14, STR.m.strays, fSans(11.5), 11.5, C.bad(1), { pri: 12, bg: true });
  });
  if (!made && apx > 240 && view.f === 0) { const e = cen(tim.path[0]); label(dx(e[0]) + 12, dy(e[1]) - cellRect(0)[3] * k * 0.5 - 8, late ? t(STR.d.late, { x: Math.round(tim.worst - S.period) }) : t(STR.d.spare, { x: Math.round(S.period - tim.worst) }), fMono(12.5, 600), 12.5, late ? C.bad(1) : C.acc(1), { pri: 55, bg: true, fid: 'stand', by: 'here' }); mark(dx(e[0]) - 18, dy(e[1]), 'perfect');
    const w = wireOf(pos); label(dx(a[0]), dy(a[1] + a[3]) + 18, t(STR.d.wire, { x: w.toFixed(0) }) + '   ' + t(STR.d.hand, { x: HAND_WIRE.toFixed(0) }) + (settledWire ? '   ' + t(STR.d.settled, { x: settledWire.toFixed(0) }) : ''), fMono(12, 500), 12, C.ink(1), { pri: 46, bg: true, fid: 'stand', by: 'here' }); mark(dx(a[0] + a[2]) + 4, dy(a[1] + a[3] * 0.2), 'sutton');
    if (cpx > 30) for (const p of ['c', 'a0', 'b0', 'a1', 'b1', 'a2', 'b2', 'a3', 'b3']) { const q = pinPt(p); ctx.beginPath(); ctx.arc(dx(q[0]), dy(q[1]), 3, 0, 7); ctx.fillStyle = C.acc(1); ctx.fill(); } }
  if (made && f >= 4 && apx > 240 && view.f === f) mark(dx(a[0] + a[2]) + 4, dy(a[1] + a[3] * 0.2), 'perfect');
}

function drawSheet(now) {
  const tm = REDUCED ? 0 : now / 1000, s = cam.s;
  /* the masks: drawn at the left, carried down the road to Print (and, by the side road, onto a shared shuttle) */
  const ry = -170, px0 = 3 * FW + 700; ctx.beginPath(); ctx.moveTo(X(1200), Y(330)); ctx.lineTo(X(1330), Y(330)); ctx.lineTo(X(1330), Y(ry)); ctx.lineTo(X(px0), Y(ry)); ctx.lineTo(X(px0), Y(40)); ctx.moveTo(X(1330), Y(ry)); ctx.lineTo(X(1330), Y(-300)); ctx.lineTo(X(1520), Y(-300));
  ctx.strokeStyle = C.acc(0.7); ctx.lineWidth = 1.2; ctx.setLineDash([2, 5]); ctx.stroke(); ctx.setLineDash([]);
  STR.d.mask.forEach((nm, i) => { const x = 1560 + i * 560 + (REDUCED ? 0 : (tm * 30) % 560 * 0), y = ry - 60, z = 120; ctx.beginPath(); rr(x, y, z, z); ctx.fillStyle = C.bg(1); ctx.fill(); ctx.strokeStyle = C.acc(0.9); ctx.lineWidth = 1.2; ctx.stroke();
    if (z * s > 26) { ctx.beginPath(); for (let j = 0; j < 5; j++) for (let q = 0; q < 5; q++) { const cx = x + 14 + q * 20, cy = y + 14 + j * 20; if (i === 0) { rr(cx, cy + 2, 14, 4); rr(cx, cy + 9, 14, 4); } else if (i === 1) { rr(cx + 3, cy, 2, 15); rr(cx + 9, cy, 2, 15); } else if (i === 2) { rr(cx + 1, cy + 3, 2, 2); rr(cx + 11, cy + 10, 2, 2); } else { rr(cx, cy, 14, 2); rr(cx, cy + 13, 14, 2); } } ctx.strokeStyle = [C.acc, C.bad, C.ink, C.ink][i](0.9); ctx.lineWidth = 1; ctx.stroke(); }
    if (s > 0.2) label(X(x + z / 2), Y(y) - 6, nm, fMono(10.5), 10.5, C.mut(1), { align: 'center', pri: 14 }); });
  if (s > 0.16) { label(X(1560), Y(ry + 92) + 4, STR.d.masks + ', ' + STR.d.road, fSerif(clamp(s * 60, 12, 17), 400, true), 14, C.ink(1), { pri: 35 }); ctx.beginPath(); for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) rr(1530 + i * 30, -350 + j * 24, 26, 20); ctx.strokeStyle = C.mut(0.8); ctx.lineWidth = 1; ctx.stroke(); ctx.beginPath(); rr(1590, -326, 26, 20); ctx.fillStyle = C.acc(0.8); ctx.fill(); label(X(1720), Y(-300) + 4, STR.d.shuttle, fSerif(13, 400, true), 13, C.mut(1), { pri: 12 }); }
  drawDie(0, false);
  /* the line: one machine a frame, the wafer inside it seen from above, your design on every die */
  for (let f = 1; f < 8; f++) {
    const x0 = f * FW, cx = x0 + 700, cy = 600, wr = 520; if (X(x0 + FW) < -40 || X(x0) > vw + 40) continue;
    ctx.beginPath(); ctx.roundRect(X(x0 + 90), Y(-20), 1220 * s, 1240 * s, 26 * s); ctx.fillStyle = C.panel(0.5); ctx.fill(); ctx.strokeStyle = C.ink(view.f === f && view.l >= 0 ? 0.7 : 0.3); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(x0 - 90), Y(cy)); ctx.lineTo(X(x0 + 90), Y(cy)); ctx.strokeStyle = C.ink(0.4); ctx.setLineDash([1, 6]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(X(cx), Y(cy), wr * s, 0.06 - Math.PI / 2, -0.06 + 1.5 * Math.PI); ctx.closePath(); ctx.fillStyle = C.bg(0.9); ctx.fill(); if (f === 2) { ctx.fillStyle = C.ink(0.1); ctx.fill(); } ctx.strokeStyle = C.ink(0.8); ctx.lineWidth = 1.4; ctx.stroke();
    const nmPx = clamp(s * 90, 13, 30); label(X(x0 + 130), Y(-20) + nmPx + 12, STR.stage[STAGES[f]], fSerif(nmPx, 700), nmPx, C.ink(1), { pri: 58 });
    if (f === 1) { ctx.beginPath(); for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) if (i * i + j * j < 82 && 50 * s > 5) ctx.rect(X(cx + i * 54) - 1, Y(cy + j * 54) - 1, 2, 2); ctx.fillStyle = C.mut(0.7); ctx.fill(); }
    let good = 0, all = 0;
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { if (Math.hypot(Math.abs(i) * 150 + 70, Math.abs(j) * 150 + 70) > wr) continue; all++; const bad = f === 7 && (i || j) && H(i * 7 + j * 13 + 40 + S.care) > die.yield * 0.999; if (!bad) good++; if (!(i || j)) continue;
      const Ts = dieT(f); Ts.ox += i * 150; Ts.oy += j * 150; const sv = dieT; drawDieAt(f, Ts, bad); }
    drawDie(f, false);
    /* the machine at work, over the wafer */
    const sw = (tm * 0.25) % 1;
    if (f === 1) { ctx.beginPath(); ctx.arc(X(cx), Y(cy), wr * s * (0.3 + 0.7 * ((tm * 0.1) % 1)), 0, 7); ctx.strokeStyle = C.acc(0.5); ctx.stroke(); }
    if (f === 2) { ctx.beginPath(); ctx.arc(X(cx), Y(cy), wr * s * sw, 0, 7); ctx.strokeStyle = C.ink(0.5); ctx.lineWidth = 2; ctx.stroke(); }
    if (f === 3) { const di = Math.floor(tm * 0.8) % 5 - 2, yy = cy - 70 + ((tm * 0.8) % 1) * 140; ctx.fillStyle = C.acc(0.5); ctx.fillRect(X(cx - 70 + di * 150), Y(yy), 140 * s, 10 * s); ctx.beginPath(); rr(cx - 76 + di * 150, cy - 76, 152, 152); ctx.strokeStyle = C.acc(1); ctx.lineWidth = 1.6; ctx.stroke(); }
    if (f === 4) { ctx.beginPath(); ctx.arc(X(cx), Y(cy), (wr + 24 + 6 * Math.sin(tm * 9)) * s, 0, 7); ctx.strokeStyle = C.bad(0.5); ctx.lineWidth = 3; ctx.stroke(); }
    if (f === 5) { const yy = cy - wr + ((tm * 0.3) % 1) * 2 * wr, hw = Math.sqrt(Math.max(0, wr * wr - (yy - cy) * (yy - cy))); ctx.beginPath(); ctx.moveTo(X(cx - hw), Y(yy)); ctx.lineTo(X(cx + hw), Y(yy)); ctx.strokeStyle = C.acc(0.9); ctx.lineWidth = 2; ctx.stroke(); }
    if (f === 6) { ctx.beginPath(); ctx.arc(X(cx), Y(cy), wr * s * 0.98, tm, tm + 1.2); ctx.strokeStyle = C.ink(0.8); ctx.lineWidth = 4; ctx.stroke(); }
    if (f === 7) { const di = Math.floor(tm * 1.5) % 5 - 2; ctx.beginPath(); rr(cx - 76 + di * 150, cy - 76, 152, 152); ctx.strokeStyle = C.ink(1); ctx.lineWidth = 1.6; ctx.stroke(); }
    if (s * 1220 > 260 && s < 2.2) { const yb = Y(1220) - 34, xl = X(x0 + 130), big = 12.5, note = [0, STR.m.seed, STR.m.film, STR.m.slit, STR.m.etched, STR.m.doped, STR.m.wired, t(STR.m.tested, { g: good, n: all })][f];
      label(xl, yb - 34, note, fSans(13.5, 700), 13.5, C.ink(1), { pri: 52 });
      if (f === 1 || f === 2) label(xl, yb, STR.m.waits, fSerif(13, 400, true), 13, C.mut(1), { pri: 30 });
      if (f === 3 || f === 4) { label(xl, yb - 12, t(STR.m.spread, { x: line.spread.toFixed(2) }), fMono(big, 500), big, line.spread > 1.2 ? C.bad(1) : C.ink(1), { pri: 51, fid: 'computed', by: 'litho' }); mark(X(x0 + 1240), Y(120), f === 3 ? 'moore' : 'perfect'); }
      if (f === 5 || f === 6) label(xl, yb - 12, t(STR.m.dust, { x: line.defects.toFixed(2) }), fMono(big, 500), big, line.defects > 0.5 ? C.bad(1) : C.ink(1), { pri: 51, fid: 'computed', by: 'fabline' });
      if (f === 7) { label(xl, yb - 12, t(STR.m.yield, { x: (die.yield * 100).toFixed(0) }) + '   ' + t(STR.m.cost, { x: R.rungs.chip.hands.cost.toFixed(2) }), fMono(big, 500), big, die.yield < 0.7 ? C.bad(1) : C.ink(1), { pri: 51, fid: 'computed', by: 'chip' }); mark(X(x0 + 1240), Y(120), 'eff'); } }
  }
}
function drawDieAt(f, T, bad) { const k = T.k * cam.s, x = X(T.ox), y = Y(T.oy), z = 1000 * k; if (x > vw || y > vh || x + z < 0 || y + z < 0) return; ctx.beginPath(); ctx.rect(x, y, z, z); if (bad) { ctx.fillStyle = C.bad(0.8); ctx.fill(); } else if (f >= 2) { ctx.fillStyle = C.ink(f === 2 ? 0.1 : 0.05); ctx.fill(); } ctx.strokeStyle = C.ink(f < 3 ? 0.25 : 0.5); ctx.lineWidth = 1; ctx.setLineDash(f < 3 ? [3, 3] : []); ctx.stroke(); ctx.setLineDash([]);
  if (f >= 3 && !bad && z > 30) { ctx.beginPath(); for (const u of PL.U) ctx.rect(x + u[0] * k, y + u[1] * k, u[2] * k, u[3] * k); for (const m of PL.M) ctx.rect(x + m[0] * k, y + m[1] * k, m[2] * k, m[3] * k); ctx.strokeStyle = (f === 3 ? C.acc : C.ink)(0.7); ctx.stroke(); } }

function draw(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, vw, vh); MARKS = [];
  drawSheet(now); flush();
  /* the questions that bite here: at most three, the nearest to the middle */
  MARKS = MARKS.filter(m => m.x > 20 && m.x < vw - 20 && m.y > 90 && m.y < vh - 140).sort((a, b) => Math.hypot(a.x - vw / 2, a.y - vh / 2) - Math.hypot(b.x - vw / 2, b.y - vh / 2)).filter((m, i, a) => a.findIndex(o => o.id === m.id) === i).slice(0, 3);
  const pulse = REDUCED ? 0 : 3 * (0.5 + 0.5 * Math.sin(now / 420));
  for (const m of MARKS) { ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, 7); ctx.fillStyle = C.bg(0.8); ctx.fill(); ctx.strokeStyle = C.warm(1); ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(m.x, m.y, 12 + pulse, 0, 7); ctx.strokeStyle = C.warm(0.3); ctx.stroke(); if (lens === m.id || hoverMark === m.id) { ctx.font = fSans(12.5, 500); ctx.fillStyle = C.warm(1); ctx.textAlign = 'left'; ctx.fillText(STR.q[m.id][0], m.x + 16, m.y + 4); } }
}

/* ---------- the page's controls ---------- */
let W0 = 0, PERIODS = [], lens = null, hoverMark = null, prop = null, drag = null;
function build() {
  document.title = STR.doc; $('#lab').textContent = STR.lab; $('#ttl').textContent = STR.title;
  $('#along').innerHTML = STAGES.map((sg, f) => '<button type="button" data-f="' + f + '">' + esc(STR.stage[sg]) + '</button>').join('') + '<a href="' + STR.site + '">' + esc(STR.stage.use) + '</a>';
}
const seg = (key, opts, cur) => '<span class="seg">' + opts.map(([v, tx]) => '<button type="button" data-k="' + key + '" data-v="' + esc(v) + '" aria-pressed="' + (String(cur) === String(v)) + '">' + esc(tx) + '</button>').join('') + '</span>';
const row = (lbl, html) => '<div class="row"><span class="lbl">' + esc(lbl) + '</span>' + html + '</div>';
function tools() {
  const T = STR.tool, f = view.f, l = view.l; let h = '';
  if (l < 0) h = '';
  else if (f > 0) h = row(T.care, seg('care', T.cares.map((x, k) => [k, x]), S.care));
  else if (l <= 1) h = row(T.shape, seg('g:shape', A.OPTIONS.shape.map(o => [o, STR.opt.shape[o]]), S.g.shape)) + row(T.where, seg('g:where', A.OPTIONS.where.map(o => [o, STR.opt.where[o]]), S.g.where)) + '<button type="button" class="btn" id="agent">' + esc(T.agent) + '</button>';
  else if (l === 2) h = '<div class="row"><button type="button" class="btn" id="hand">' + esc(T.hand) + '</button><button type="button" class="btn" id="scramble">' + esc(T.scramble) + '</button><button type="button" class="btn pri" id="settle">' + esc(T.settle) + '</button></div><div class="row"><span class="lbl">' + esc(T.map) + '</span><button type="button" class="btn" id="t20">' + esc(T.test20) + '</button><button type="button" class="btn" id="tall">' + esc(T.testAll) + '</button></div><span class="hint">' + esc(T.drag) + '</span>';
  else if (l === 3) h = row(T.clock, seg('period', PERIODS.map(p => [p, p + ' ps']), S.period));
  $('#tools').innerHTML = h; $('#tools').hidden = !h;
  const pe = $('#prop'); pe.hidden = !prop; if (prop) pe.innerHTML = '<span>' + esc(prop.text) + '</span>' + (prop.g ? '<button type="button" class="btn pri" id="take">' + esc(T.take) + '</button>' : '') + '<button type="button" class="btn" id="notnow">' + esc(T.no) + '</button>';
}
function ui() {
  const f = view.f, l = view.l, sp = STR.spine, h = R.rungs, made = f > 0, span = l < 0 ? [] : made ? ['atom', 'switch', 'gate', 'block', 'chip'] : ['switch', 'gate', 'block', 'chip'], cur = LEVELS[l];
  $$('#along button').forEach(b => b.setAttribute('aria-current', l >= 0 && +b.dataset.f === f));
  const fig = { mind: t(sp.right, { x: (h.mind.hands.right * 100).toFixed(1) }), machine: t(sp.ips, { x: (h.machine.hands.ips / 1e9).toFixed(1) }), chip: t(sp.yield, { x: (h.chip.hands.yield * 100).toFixed(0), c: h.chip.hands.cost.toFixed(2) }), block: t(sp.alu, { x: (h.block.hands.aluDelay * 1e9).toFixed(2) }), gate: t(sp.delay, { x: (h.gate.hands.delay * 1e12).toFixed(0) }), switch: t(sp.spread, { x: h.switch.hands.sigma.toFixed(1) }), atom: t(sp.gap, { x: h.atom.hands.gap.toFixed(2) }) };
  $('#spine').innerHTML = ['mind', 'machine', 'chip', 'block', 'gate', 'switch', 'atom'].map(r => '<button type="button" data-rung="' + r + '" class="' + (span.includes(r) ? 'in' : '') + (r === cur ? ' on' : '') + '"' + (span.includes(r) && LEVELS.includes(r) ? '' : ' disabled') + '><b>' + esc(STR.rung[r]) + '</b><span>' + esc(fig[r]) + '</span></button>').join('');
  $('#say').textContent = l < 0 ? STR.rest.home : made ? t(STR.rest.make, { s: STR.stage[STAGES[f]] }) : STR.rest.design;
  const ln = $('#lens'); ln.hidden = !lens; if (lens) ln.innerHTML = '<q>' + esc(STR.q[lens][1]) + '</q><p>' + esc(STR.q[lens][2]) + '</p><button type="button" class="btn" id="down">' + esc(STR.q.down) + '</button>';
  tools(); dirty = true;
}
function askAgent() { const now = HEAT; let best = null; for (const sh of A.OPTIONS.shape) for (const wh of A.OPTIONS.where) { const g = Object.assign({}, S.g, { shape: sh, where: wh }), m = measure(g), sc = m.deg + m.trip * 0.05; if (m.deg < now.deg - 0.5 && m.trip < now.trip * 0.95 && (!best || sc < best.sc)) best = { g, m, sc }; }
  prop = best ? { g: best.g, text: t(STR.tool.proposes, { what: STR.opt.shape[best.g.shape].toLowerCase() + ', ' + STR.opt.where[best.g.where].toLowerCase(), deg: (now.deg - best.m.deg).toFixed(0), x: '×' + (now.trip / Math.max(best.m.trip, 1)).toFixed(1) }) } : { text: STR.tool.best }; lens = 'human'; ui(); }
function settle() { anneal = { T: 2.4, n: 0, ps: pos.slice(), w: wireOf(pos) }; }
function stepAnneal() { if (!anneal) return; const a = anneal, occ = new Array(45).fill(-1); a.ps.forEach((s, i) => { occ[s] = i; });
  for (let q = 0; q < (REDUCED ? 9000 : 90); q++) { const i = Math.floor(Math.random() * NET.length), s2 = Math.floor(Math.random() * 45), s1 = a.ps[i], j = occ[s2]; if (s1 === s2) continue; a.ps[i] = s2; if (j >= 0) a.ps[j] = s1; const w = wireOf(a.ps); if (w < a.w || Math.random() < Math.exp((a.w - w) / a.T)) { a.w = w; occ[s2] = i; occ[s1] = j; } else { a.ps[i] = s1; if (j >= 0) a.ps[j] = s2; } a.T *= 0.9994; a.n++; }
  pos = a.ps.slice(); dirty = true; if (a.n > 8500) { settledWire = a.w; anneal = null; } }
document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if (d.f) go(+d.f, Math.max(0, view.l)); else if (d.rung) go(view.f, LEVELS.indexOf(d.rung));
  else if (d.k) { if (d.k.startsWith('g:')) { S.g[d.k.slice(2)] = d.v; prop = null; recompute(); if (view.l >= 2) fly(fit(rectOf(view.f, view.l)), 500); } else if (d.k === 'care') { S.care = +d.v; recompute(); } else if (d.k === 'period') S.period = +d.v; ui(); }
  else if (b.id === 'agent') askAgent(); else if (b.id === 'take') { S.g = prop.g; prop = null; recompute(); ui(); } else if (b.id === 'notnow') { prop = null; ui(); }
  else if (b.id === 'hand') { anneal = null; pos = HAND.slice(); dirty = true; } else if (b.id === 'scramble') { anneal = null; const sl = [...Array(45).keys()].sort(() => Math.random() - 0.5); pos = NET.map((_, i) => sl[i]); dirty = true; } else if (b.id === 'settle') settle();
  else if (b.id === 't20') runTests(false); else if (b.id === 'tall') runTests(true); else if (b.id === 'down') { lens = null; ui(); }
  else if (b.id === 'theme') { document.documentElement.dataset.theme = C.th === 'dark' ? 'light' : 'dark'; setTheme(); } else if (b.id === 'home') go(0, -1);
});
/* hands */
const frameAt = x => clamp(Math.floor(x / FW), 0, 7), wx = Xp => (Xp - vw / 2) / cam.s + cam.x, wy = Yp => (Yp - vh / 2) / cam.s + cam.y;
function cellAt(Xp, Yp) { if (view.f !== 0 || cellRect(0)[2] * cam.s < 22) return -1; const T = dieT(0), x = (wx(Xp) - T.ox) / T.k, y = (wy(Yp) - T.oy) / T.k; return NET.findIndex((_, i) => { const c = cellRect(pos[i]); return x >= c[0] && x <= c[0] + c[2] && y >= c[1] && y <= c[1] + c[3]; }); }
function slotAt(Xp, Yp) { const T = dieT(0), x = (wx(Xp) - T.ox) / T.k, y = (wy(Yp) - T.oy) / T.k; for (let s = 0; s < 45; s++) { const c = cellRect(s); if (x >= c[0] - c[2] * 0.3 && x <= c[0] + c[2] * 1.3 && y >= c[1] - c[3] * 0.4 && y <= c[1] + c[3] * 1.4) return s; } return -1; }
function levelNow() { const f = frameAt(cam.x); if (cam.s < fit(rectOf(f, 0)).s * 0.6) return [f, -1]; let bl = 0, bd = 9; for (let l = 0; l < 5; l++) { const d = Math.abs(Math.log(cam.s / fit(rectOf(f, l)).s)); if (d < bd) { bd = d; bl = l; } } return [f, bl]; }
cv.addEventListener('wheel', e => { e.preventDefault(); if (anim) return; const k = Math.exp(-e.deltaY * 0.0016), x = wx(e.clientX), y = wy(e.clientY), ns = clamp(cam.s * k, fit(HOME).s * 0.8, fit(rectOf(frameAt(x), 4)).s * 1.5); cam.s = ns; cam.x = x - (e.clientX - vw / 2) / ns; cam.y = y - (e.clientY - vh / 2) / ns; const [f, l] = levelNow(); if (f !== view.f || l !== view.l) { view.f = f; view.l = l; ui(); } dirty = true; }, { passive: false });
const ptr = new Map(); let pan = null, pinch = null;
cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: cam.s }; pan = null; return; } const c = cellAt(e.clientX, e.clientY); if (c >= 0) { drag = { cell: c, moved: 0, x: e.clientX, y: e.clientY }; anneal = null; } else pan = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: 0 }; });
cv.addEventListener('pointermove', e => { if (ptr.has(e.pointerId)) ptr.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && ptr.size === 2) { const [a, b] = [...ptr.values()]; cam.s = clamp(pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, fit(HOME).s * 0.8, fit(rectOf(0, 4)).s * 1.6); dirty = true; return; }
  if (drag) { drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x), Math.abs(e.clientY - drag.y)); const s = slotAt(e.clientX, e.clientY); if (s >= 0 && s !== pos[drag.cell]) { const j = pos.indexOf(s); if (j >= 0) pos[j] = pos[drag.cell]; pos[drag.cell] = s; dirty = true; } return; }
  if (pan && !anim) { const dx = e.clientX - pan.x, dy = e.clientY - pan.y; pan.moved = Math.max(pan.moved, Math.abs(dx), Math.abs(dy)); if (pan.moved > 4) { cam.x = pan.cx - dx / cam.s; cam.y = pan.cy - dy / cam.s; dirty = true; } return; }
  const m = MARKS.find(q => Math.hypot(q.x - e.clientX, q.y - e.clientY) < 16); if ((m ? m.id : null) !== hoverMark) { hoverMark = m ? m.id : null; dirty = true; } cv.style.cursor = m || cellAt(e.clientX, e.clientY) >= 0 ? 'pointer' : 'grab'; });
const up = e => { const p = pan, d = drag; ptr.delete(e.pointerId); pinch = null; pan = null; drag = null; if (e.type !== 'pointerup') return;
  if (d && d.moved < 5) { go(0, Math.min(4, Math.max(view.l, 2) + 1)); return; } if (d) { dirty = true; return; } if (!p) return;
  if (p.moved >= 5) { const [f, l] = levelNow(); view.f = f; view.l = l; ui(); return; }
  const m = MARKS.find(q => Math.hypot(q.x - e.clientX, q.y - e.clientY) < 18); if (m) { lens = lens === m.id ? null : m.id; ui(); return; }
  const f = frameAt(wx(e.clientX)); if (view.l < 0 || f !== view.f) go(f, Math.max(0, view.l)); else if (view.l < 4) go(f, view.l + 1); };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
addEventListener('keydown', e => { if (e.target.closest && e.target.closest('input')) return; const l = view.l;
  if (e.key === 'ArrowRight') go(Math.min(7, view.f + 1), Math.max(0, l)); else if (e.key === 'ArrowLeft') go(Math.max(0, view.f - 1), Math.max(0, l)); else if (e.key === 'ArrowDown' || e.key === '+' || e.key === '=') go(view.f, Math.min(4, l + 1)); else if (e.key === 'ArrowUp' || e.key === 'Escape' || e.key === '-') { if (lens) { lens = null; ui(); } else go(view.f, l - 1); } else return; e.preventDefault(); });
function resize() { vw = innerWidth; vh = innerHeight; dpr = Math.min(devicePixelRatio || 1, Math.sqrt(7e6 / (vw * vh)), 2.5); cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); if (!anim) Object.assign(cam, fit(view.l < 0 ? HOME : rectOf(view.f, view.l))); dirty = true; }
function loop(now) { stepAnim(now); stepAnneal(); if (dirty || !REDUCED) { dirty = false; draw(now); } requestAnimationFrame(loop); }
setTheme(); recompute(); build(); W0 = timing(HAND).worst; PERIODS = [1.6, 1.12, 0.95, 0.8].map(x => Math.round(W0 * x / 10) * 10); S.period = PERIODS[1]; matchMedia('(prefers-color-scheme: light)').addEventListener('change', setTheme); addEventListener('resize', resize);
resize(); ui(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; });
requestAnimationFrame(loop);
window.OSLW = { go, S, view, cam, busy: () => !!anim || !!anneal, settle, runTests, askAgent, set: (k, v) => { if (k === 'care') S.care = v; else if (k === 'period') S.period = v; else S.g[k] = v; recompute(); ui(); }, scramble: () => $('#scramble') && $('#scramble').click() };
