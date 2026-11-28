/* Inside a station of the line, drawn (#512): the machine at work, your wafer, your die as made down to a switch. */
import { DIE } from './plan.js';
import { alpha } from './kit.js';
import { madeDie } from './made.js';

/* ---- inside a station (#512, GUIDE.md §3): the machine cut open at the wafer's left, its one moving part at work, the
   wafer from above with the guide's 21 dies (each your die after this step, a failed one red), and your die at the
   centre, which the camera goes into, drawn closer as in the studio with this step's rules. At the switch level a cut
   through one switch stands at the cell's left, joined to it by a dotted line. Words come back as labels; figures are
   the record's, each with its mark ---- */
const DIES21 = (() => { const rows = [3, 5, 5, 5, 3], out = []; rows.forEach((n, j) => { for (let i = 0; i < n; i++) out.push([i - (n - 1) / 2, j - 2]); }); return out; })();
export function madeView(ctx, P, cam, o) {
  const { C, words } = o, S = P.station, s = cam.s, X = x => cam.ox + x * s, Y = y => cam.oy + y * s, labels = [], f = S.f, chip = S.chip || {}, test = chip.test;
  const Wf = S.wafer, t = o.time != null ? o.time / 1000 : 0;
  let moving = false;
  ctx.save();
  /* the machine, cut open: its walls, the wafer edge-on on its stage, your die a short mark, the moving part */
  const Mc = S.machine;
  if (Mc.w * s > 30) {
    const mx = X(Mc.x), my = Y(Mc.y), mw = Mc.w * s, mh = Mc.h * s, ink = alpha(C.ink, 0.85);
    ctx.setLineDash([]); ctx.lineWidth = 1.3; ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(mx, my + mh * 0.08); ctx.lineTo(mx, my + mh); ctx.lineTo(mx + mw, my + mh); ctx.lineTo(mx + mw, my + mh * 0.08); ctx.lineTo(mx + mw * 0.75, my); ctx.lineTo(mx + mw * 0.25, my); ctx.closePath(); ctx.stroke();
    const sy = my + mh * 0.82, wx0 = mx + mw * 0.25, wx1 = mx + mw * 0.75;
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(wx0, sy); ctx.lineTo(wx1, sy); ctx.stroke();
    ctx.lineWidth = 1.3; ctx.strokeRect(mx + mw * 0.2, sy + 4, mw * 0.6, mh * 0.06);
    ctx.strokeStyle = C.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo((wx0 + wx1) / 2 - mw * 0.02, sy); ctx.lineTo((wx0 + wx1) / 2 + mw * 0.02, sy); ctx.stroke();
    ctx.lineWidth = 1.4; const still = o.time == null;
    if (S.step === 'crystal') { ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(mx + mw * 0.3, my + mh * 0.5); ctx.lineTo(mx + mw * 0.3, my + mh * 0.7); ctx.lineTo(mx + mw * 0.7, my + mh * 0.7); ctx.lineTo(mx + mw * 0.7, my + mh * 0.5); ctx.stroke();
      ctx.fillStyle = alpha(C.accent, 0.35); ctx.fillRect(mx + mw * 0.31, my + mh * 0.6, mw * 0.38, mh * 0.095); ctx.strokeStyle = C.accent; ctx.strokeRect(mx + mw * 0.46, my + mh * 0.15, mw * 0.08, mh * 0.46);
      for (let k = 0; k < 5; k++) { const yy = my + mh * (0.18 + ((k * 0.09 + t * 0.05) % 0.42)); ctx.beginPath(); ctx.moveTo(mx + mw * 0.46, yy); ctx.lineTo(mx + mw * 0.54, yy); ctx.stroke(); } moving = !still; }
    else if (S.step === 'deposit') { ctx.strokeStyle = ink; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(mx + mw * 0.2, my + mh * 0.2); ctx.lineTo(mx + mw * 0.8, my + mh * 0.2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.accent; for (let k = 0; k < 18; k++) { const xx = mx + mw * (0.24 + (k * 0.031) % 0.52), yy = my + mh * (0.22 + ((k * 0.137 + t * 0.25) % 0.58)); ctx.fillRect(xx, yy, 2.5, 2.5); } moving = !still; }
    else if (S.step === 'print') { const pts = [[0.12, 0.1], [0.3, 0.22], [0.18, 0.34], [0.4, 0.3], [0.32, 0.12], [0.5, 0.06], [0.5, 0.16], [0.5, 0.78]];
      ctx.strokeStyle = alpha(C.accent, 0.8); ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(mx + mw * p[0], my + mh * p[1]) : ctx.moveTo(mx + mw * p[0], my + mh * p[1]))); ctx.stroke();
      ctx.strokeStyle = ink; ctx.lineWidth = 3.5; pts.slice(1, 5).forEach(p => { ctx.beginPath(); ctx.moveTo(mx + mw * (p[0] - 0.03), my + mh * p[1]); ctx.lineTo(mx + mw * (p[0] + 0.03), my + mh * p[1]); ctx.stroke(); });
      ctx.strokeRect(mx + mw * 0.42, my + mh * 0.14, mw * 0.16, mh * 0.03);
      const u = (t * 0.6) % 1, k = Math.floor(u * 7), e = u * 7 - k, a = pts[k], b = pts[k + 1]; ctx.fillStyle = C.accent; ctx.fillRect(mx + mw * (a[0] + (b[0] - a[0]) * e) - 3, my + mh * (a[1] + (b[1] - a[1]) * e) - 3, 6, 6); moving = !still; }
    else if (S.step === 'etch') { ctx.strokeStyle = ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(mx + mw * 0.22, my + mh * 0.18); ctx.lineTo(mx + mw * 0.78, my + mh * 0.18); ctx.stroke();
      const br = 0.5 + 0.2 * Math.sin(t * 2.4); ctx.fillStyle = alpha(C.bad, 0.18 + 0.12 * br); ctx.beginPath(); ctx.ellipse(mx + mw * 0.5, my + mh * 0.42, mw * 0.28, mh * (0.12 + 0.02 * br), 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 1.2; for (let k = 0; k < 12; k++) { const xx = mx + mw * (0.28 + (k * 0.047) % 0.44), yy = my + mh * (0.5 + ((k * 0.11 + t * 0.6) % 0.28)); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + mh * 0.03); ctx.stroke(); } moving = !still; }
    else if (S.step === 'implant') { ctx.strokeStyle = ink; ctx.strokeRect(mx + mw * 0.08, my + mh * 0.1, mw * 0.18, mh * 0.12); ctx.beginPath(); ctx.arc(mx + mw * 0.4, my + mh * 0.3, mw * 0.14, Math.PI, Math.PI * 1.5); ctx.stroke();
      const sw = Math.sin(t * 1.6) * 0.18; ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx + mw * 0.26, my + mh * 0.16); ctx.lineTo(mx + mw * 0.4, my + mh * 0.16); ctx.lineTo(mx + mw * (0.5 + sw), sy); ctx.stroke(); moving = !still; }
    else if (S.step === 'wires') { ctx.strokeStyle = ink; for (let k = 0; k < 4; k++) ctx.strokeRect(mx + mw * 0.25, sy - (k + 1) * mh * 0.035, mw * 0.5, mh * 0.03);
      const a0 = t * 1.5; ctx.beginPath(); ctx.ellipse(mx + mw * 0.5, my + mh * 0.35, mw * 0.22, mh * 0.05, 0, 0, 6.2832); ctx.stroke(); ctx.strokeStyle = C.accent; ctx.beginPath(); ctx.moveTo(mx + mw * 0.5, my + mh * 0.35); ctx.lineTo(mx + mw * (0.5 + 0.22 * Math.cos(a0)), my + mh * (0.35 + 0.05 * Math.sin(a0))); ctx.stroke(); moving = !still; }
    else if (S.step === 'test') { const dy = (Math.sin(t * 1.8) + 1) * 0.06; ctx.strokeStyle = ink; ctx.strokeRect(mx + mw * 0.3, my + mh * (0.45 + dy), mw * 0.4, mh * 0.06);
      ctx.strokeStyle = C.accent; for (let k = 0; k < 8; k++) { const xx = mx + mw * (0.33 + k * 0.048); ctx.beginPath(); ctx.moveTo(xx, my + mh * (0.51 + dy)); ctx.lineTo(xx, my + mh * (0.56 + dy)); ctx.stroke(); } moving = !still; }
    const mk = 'sd.fab.machine.' + S.step; if (mw > 120) labels.push({ x: mx, y: my - 8, text: words(mk), kind: 'name', part: 'machine' });
  }
  /* the wafer from above: a disc, its 21 dies, yours at the centre */
  const pitch = Wf.pitch, d = DIE;
  ctx.setLineDash([]); ctx.lineWidth = Math.max(1.5, Math.min(4, Wf.r * s / 60)); ctx.strokeStyle = alpha(C.ink, 0.85); ctx.fillStyle = alpha(C.accent, f >= 1 ? 0.1 : 0.05);
  ctx.beginPath(); ctx.arc(X(Wf.cx), Y(Wf.cy), Wf.r * s, 0, 6.2832); ctx.fill(); ctx.stroke();
  DIES21.forEach(([i, j], k) => {
    const x0 = Wf.cx + i * pitch - d / 2, y0 = Wf.cy + j * pitch - d / 2, c = { ox: X(x0), oy: Y(y0), s };
    if (i === 0 && j === 0) return;
    if (c.ox > o.W + 10 || c.ox + d * s < -10 || c.oy > o.H + 10 || c.oy + d * s < -10) return;
    madeDie(ctx, P, c, { C, made: { f, stopped: !!chip.stopped, failed: f === 6 && test ? !test.good[k] : false, cells: chip.cells } });
  });
  /* your die, closer: the made die, and its cells as layout once large */
  const centre = DIES21.findIndex(q => q[0] === 0 && q[1] === 0);
  madeDie(ctx, P, cam, { C, made: { f, stopped: !!chip.stopped, failed: f === 6 && test ? !test.good[centre] : false, cells: chip.cells } });
  const dieW = d * s;
  if (dieW > 140 && dieW < 1600) labels.push({ x: X(0), y: Y(0) - 8, text: words('sd.fab.yours'), kind: 'name', part: 'die' });
  /* a copy that strays, named; the cut through one switch */
  const mc = new Map((chip.cells || []).map(c => [c.id, c]));
  if (f >= 3 && !chip.stopped) P.cells.forEach(c => { const m = mc.get(c.id); if (m && m.stray && c.w * s > 110) labels.push({ x: X(c.x), y: Y(c.y + c.h) + 8, text: words('sd.fab.strays'), kind: 'aside', part: 'stray:' + c.id, bad: true }); });
  const c0 = P.cells[0];
  if (c0 && c0.h * s > 150 && !chip.stopped) section(ctx, c0, mc.get(c0.id), f, X, Y, s, C, labels, words);
  /* the step's figures, from the record, under the wafer */
  const R = S.report;
  if (R && Wf.r * s > 120 && Wf.r * s < 4000) {
    const key = { print: 'print', etch: 'etch', implant: 'specks', wires: 'specks', test: 'test' }[S.step];
    if (key) { const F = R.figures, fig = key === 'print' ? { x: F.spread.toFixed(2) } : key === 'etch' ? { x: F.spread.toFixed(2), n: F.strays } : key === 'specks' ? { x: F.specks.toFixed(2) } : { g: F.good, y: Math.round(F.yield * 100) };
      const fid = key === 'print' || key === 'etch' ? R.fid.spread : key === 'specks' ? R.fid.specks : R.fid.yield;
      const fk = 'sd.fab.fig.' + key; labels.push({ x: X(Wf.cx - Wf.r * 0.7), y: Y(Wf.cy + Wf.r) + 12, text: words(fk, fig), kind: 'figure', part: 'figure', fid, bad: key === 'test' && F.good < 21 }); }
  }
  ctx.restore();
  if (moving) labels.moving = true;
  return labels;
}
/* a cut through one switch, at the cell's left: bare silicon, the film, the resist (its exposed part blue), the gate
   standing at its copy's width, the wells, the contacts and a metal line, each from the step that adds it */
function section(ctx, c, m, f, X, Y, s, C, labels, words) {
  const w = c.w * s * 1.3, h = c.h * s, x = X(c.x) - w - c.w * s * 0.4, y0 = Y(c.y) + h * 0.62, u = h * 0.1, ink = alpha(C.ink, 0.85);
  ctx.setLineDash([2, 4]); ctx.strokeStyle = alpha(C.ink, 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(c.x), Y(c.y) + h / 2); ctx.lineTo(x + w, y0 - u); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = alpha(C.ink, 0.18); ctx.fillRect(x, y0, w, u * 2.4);
  if (f >= 1 && f < 3) { ctx.fillStyle = alpha(C.ink, 0.45); ctx.fillRect(x, y0 - u, w, u); }
  if (f === 2) { ctx.fillStyle = alpha(C.accent, 0.6); ctx.fillRect(x + w * 0.42, y0 - u * 2.4, w * 0.16, u * 1.4); }
  const jit = m ? m.jit : 0;
  if (f >= 3) { ctx.fillStyle = m && m.stray ? C.bad : ink; ctx.fillRect(x + w * 0.42 - w * 0.03 * jit, y0 - u * 1.6, w * 0.16 * (1 + jit * 0.5), u * 1.6); }
  if (f >= 4) { ctx.fillStyle = alpha(C.accent, 0.55); ctx.fillRect(x + w * 0.12, y0, w * 0.26, u * 1.2); ctx.fillRect(x + w * 0.62, y0, w * 0.26, u * 1.2); }
  if (f >= 5) { ctx.fillStyle = ink; ctx.fillRect(x + w * 0.22, y0 - u * 2.6, w * 0.05, u * 2.6); ctx.fillRect(x + w * 0.73, y0 - u * 2.6, w * 0.05, u * 2.6); ctx.fillRect(x + w * 0.1, y0 - u * 3.1, w * 0.8, u * 0.5); }
  labels.push({ x, y: y0 - u * 3.4 - 8, text: words('sd.fab.section'), kind: 'aside', part: 'section' });
}
