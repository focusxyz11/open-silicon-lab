/* The die drawn (#506, docs/prototypes/studio-fab/GUIDE.md §2 and §6): one drawing of your chip, the same at every
   level, closer. Parts appear when they are large enough to read (the guide's thresholds, in screen pixels); nothing is
   swapped between levels. As designed, everything is drafted: stroke only, accent blue, dashed; wires dotted. The
   line's stations (#511) draw the same plan with the rules of their step. Words are returned as labels, for the view
   to place as HTML over the picture (CLAUDE.md: no word drawn into a picture that moves). No figure is computed here. */
import { DIE } from './plan.js';

/* the lab's palette, read from its tokens (base.css), so day and night follow the page */
export function paletteOf(el) {
  const cs = getComputedStyle(el || document.documentElement), v = k => cs.getPropertyValue(k).trim();
  return { bg: v('--bg'), ink: v('--ink'), muted: v('--muted'), line: v('--line'), accent: v('--accent'), bad: v('--bad'), warm: v('--warm'), panel: v('--panel-solid') };
}
/* a token's colour at an opacity (the tokens are hex colours) */
export const alpha = (c, a) => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return c; const n = parseInt(m[1], 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

/* thresholds, in screen pixels (the guide's) */
export const SHOW = { outline: 34, units: 200, block: 130, cells: 150, layout: 44, cellWords: 110, heat: 220, heatBlock: 620 };

/* draw the plan P on ctx with the camera cam ({ ox, oy, s }: a point x, y of the sheet is at ox + x s, oy + y s on the
   screen); W, H the view's size in CSS pixels; words(key, vars) gives the labels' words. Returns the labels:
   { x, y, text, kind ('name', 'aside', 'figure'), part, bad } in screen pixels, the label's top left */
export function drawDie(ctx, P, cam, o) {
  const { W, H, C, words } = o, s = cam.s, X = x => cam.ox + x * s, Y = y => cam.oy + y * s, labels = [];
  const on = r => X(r.x + r.w) > -40 && X(r.x) < W + 40 && Y(r.y + r.h) > -40 && Y(r.y) < H + 40;
  const rect = r => ctx.rect(X(r.x), Y(r.y), r.w * s, r.h * s);
  const drafted = (a = 0.9, lw = 1.3) => { ctx.strokeStyle = alpha(C.accent, a); ctx.lineWidth = lw; ctx.setLineDash([6, 4]); };
  const name = (r, key, vars, kind = 'name', part = key, bad = false) => { if (on(r)) labels.push({ x: X(r.x), y: Y(r.y) - 6, text: words(key, vars), kind, part, bad }); };
  const dieW = DIE * s;
  ctx.save();
  /* the die and its pads */
  drafted(0.9, 1.4); ctx.beginPath(); rect({ x: 0, y: 0, w: DIE, h: DIE }); ctx.stroke();
  if (dieW < SHOW.outline) { ctx.restore(); return labels; }
  if (dieW >= SHOW.units) { drafted(0.7, 1.1); ctx.beginPath(); P.pads.forEach(p => rect({ x: p.x, y: p.y, w: 26, h: 26 })); ctx.stroke(); }
  if (dieW >= SHOW.units && dieW < W) name({ x: 0, y: -28, w: DIE, h: 28 }, 'sd.die', null, 'title', 'die');
  if (P.empty && !P.broken) {
    if (dieW >= SHOW.units) labels.push({ x: X(DIE * 0.36), y: Y(DIE * 0.48), text: words('sd.empty'), kind: 'aside', part: 'empty' });
    ctx.restore(); return labels;
  }
  /* the heat under it all (src/engines/floorplan.js, #507): red where it is hot, while the die is large and the block not
     yet; its two figures under the die, each with its mark */
  if (P.heat && dieW >= SHOW.heat && P.block.w * s < SHOW.heatBlock) {
    const N = Math.round(Math.sqrt(P.heat.grid.length)), c = DIE / N;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = Math.min(0.5, (P.heat.grid[j * N + i] - 0.12) * 0.55); if (a <= 0.01) continue;
      const x0 = Math.round(X(i * c)), y0 = Math.round(Y(j * c)); ctx.fillStyle = alpha(C.bad, a); ctx.fillRect(x0, y0, Math.round(X((i + 1) * c)) - x0, Math.round(Y((j + 1) * c)) - y0); }
    labels.push({ x: X(0), y: Y(DIE) + 34, text: words('sd.fig.hot', { t: Math.round(P.heat.hottest) }), kind: 'figure', part: 'hottest', fid: P.heat.fid.hottest, bad: P.heat.hottest > 105 });
    labels.push({ x: X(0), y: Y(DIE) + 58, text: words('sd.fig.trip', { d: P.heat.trip < 10 ? P.heat.trip.toFixed(1) : Math.round(P.heat.trip) }), kind: 'figure', part: 'trip', fid: P.heat.fid.trip });
  }
  /* the memory: off the chip (dashed further out), a band, a piece inside every unit, or columns between them */
  drafted(0.8, 1.2); ctx.beginPath(); P.mem.forEach(m => { if (on(m)) rect(m); }); ctx.stroke();
  if (dieW >= SHOW.units && P.mem.length && P.memKind !== 'in') name(P.mem[0], P.memKind === 'far' ? 'sd.memFar' : 'sd.mem', null, 'name', 'memory');
  /* the units of the floorplan */
  const u0 = P.units[0];
  ctx.beginPath(); P.units.forEach(u => { if (on(u)) rect(u); }); drafted(0.9, 1.3); ctx.stroke();
  /* the trips between them and the memory, dotted */
  if (P.trips.length && dieW >= SHOW.units) { ctx.strokeStyle = alpha(C.accent, 0.4); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); P.trips.forEach(([a, b]) => { ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); }); ctx.stroke(); }
  if (dieW >= SHOW.units && dieW < 2400) labels.push({ x: X(0), y: Y(DIE) + 10, text: words(P.layers > 1 ? 'sd.layers' : P.n > 1 ? 'sd.units' : 'sd.unit', { n: P.n.toLocaleString('en'), k: P.layers }), kind: 'aside', part: 'units' });
  /* the first unit: your block, its registers, its control */
  if (u0.w * s >= SHOW.block) {
    const bad = P.broken === 'design' || P.broken === 'switch';
    ctx.beginPath(); rect(P.regs); rect(P.ctl); drafted(0.75, 1.2); ctx.stroke();
    ctx.beginPath(); rect(P.block); drafted(0.95, 1.4); if (bad) ctx.strokeStyle = C.bad; ctx.stroke();
    name(P.block, P.empty ? 'sd.blockEmpty' : 'sd.block', { n: P.cells.length }, 'name', 'block', bad);
    name(P.regs, 'sd.regs', null, 'aside', 'regs'); name(P.ctl, 'sd.ctl', null, 'aside', 'ctl');
    if (P.empty && P.block.w * s >= SHOW.cells) labels.push({ x: X(P.block.x + P.block.w * 0.08), y: Y(P.block.y + P.block.h * 0.45), text: words('sd.empty'), kind: 'aside', part: 'empty' });
    if (P.block.w * s >= SHOW.cells && !P.empty) cellsOf(ctx, P, X, Y, s, C, labels, words, on, bad);
  }
  ctx.restore();
  return labels;
}

/* your block's cells in their slots, the wires between them (dotted) and, close enough, each cell as layout: two strips
   of silicon, two gates across them, a rail above and below */
function cellsOf(ctx, P, X, Y, s, C, labels, words, on, bad) {
  const line = w => w.pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
  ctx.strokeStyle = alpha(C.accent, 0.4); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath();
  P.wires.forEach(w => { if (!w.path) line(w); }); ctx.stroke();
  /* the longest path, solid: blue with the time to spare, red when it is late (#508) */
  if (P.timing) { ctx.setLineDash([]); ctx.lineWidth = 2.6; ctx.strokeStyle = P.late ? C.bad : C.accent; ctx.beginPath(); P.wires.forEach(w => { if (w.path) line(w); }); ctx.stroke(); }
  ctx.setLineDash([]); ctx.fillStyle = alpha(C.accent, 0.7); P.pins.forEach(p => { ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 2.4, 0, 6.3); ctx.fill(); });
  const cw = P.cells.length ? P.cells[0].w * s : 0;
  P.cells.forEach((c, k) => {
    if (!on(c)) return;
    ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2; ctx.strokeStyle = bad ? C.bad : alpha(C.accent, 0.9);
    ctx.beginPath(); ctx.rect(X(c.x), Y(c.y), c.w * s, c.h * s); ctx.stroke();
    if (cw >= 44) layoutOf(ctx, c, X, Y, s, C, P.broken === 'switch');
    if (c.w * s >= 110) labels.push({ x: X(c.x), y: Y(c.y) - 6, text: words('sd.cell', { type: c.type }), kind: 'name', part: 'cell:' + c.id, bad });
    if (k === 0 && c.w * s >= 300) labels.push({ x: X(c.x), y: Y(c.y + c.h) + 10, text: words('sd.drafted'), kind: 'aside', part: 'drafted' });
  });
  /* the path's figure at its last cell, and the wire under the block */
  const T = P.timing, last = T && P.cells.find(c => c.id === T.path[T.path.length - 1]);
  if (last && on(last)) labels.push({ x: X(last.x), y: Y(last.y + last.h) + 6, text: words(P.late ? 'sd.fig.late' : 'sd.fig.spare', { n: Math.round(Math.abs(T.slack)) }), kind: 'figure', part: 'path', fid: P.fid.timing, bad: P.late });
  if (P.wire && on(P.block)) labels.push({ x: X(P.ctl.x), y: Y(P.ctl.y + P.ctl.h) + 8, text: words(P.settled != null ? 'sd.fig.wireSettled' : 'sd.fig.wire', { now: Math.round(P.wire.now), hand: Math.round(P.wire.hand), settled: Math.round(P.settled || 0) }), kind: 'figure', part: 'wire', fid: P.fid.wire });
  /* the coverage map in the registers' rectangle, once a test has run: untested faint, tested blue, wrong red */
  const V = P.cover;
  if (V && on(P.regs)) {
    const r = P.regs, pad = r.w * 0.06, cw = (r.w - 2 * pad) / V.cols, ch = Math.min(cw, (r.h - 2 * pad) / V.rows);
    for (let st = 0; st < V.cols * V.rows; st++) { const t = V.tested.has(st), bad2 = t && V.wrong.has(st);
      ctx.fillStyle = bad2 ? C.bad : t ? alpha(C.accent, 0.75) : alpha(C.ink, 0.09); ctx.fillRect(X(r.x + pad + (st % V.cols) * cw) + 0.5, Y(r.y + pad + Math.floor(st / V.cols) * ch) + 0.5, cw * s - 1, ch * s - 1); }
    labels.push({ x: X(r.x), y: Y(r.y + pad + V.rows * ch) + 8, text: words('sd.cover.n', { n: V.tested.size, m: V.cols * V.rows }), kind: 'figure', part: 'cover', fid: V.fid });
    labels.push({ x: X(r.x), y: Y(r.y + pad + V.rows * ch) + 30, text: words(V.found ? 'sd.cover.found' : 'sd.cover.none'), kind: 'aside', part: 'found', bad: V.found });
  }
}
export function layoutOf(ctx, c, X, Y, s, C, badGate) {
  const x = X(c.x), y = Y(c.y), w = c.w * s, h = c.h * s;
  ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2; ctx.strokeStyle = alpha(C.accent, 0.9);
  ctx.beginPath(); ctx.rect(x + w * 0.12, y + h * 0.16, w * 0.76, h * 0.24); ctx.rect(x + w * 0.12, y + h * 0.6, w * 0.76, h * 0.24); ctx.stroke();
  ctx.strokeStyle = badGate ? C.bad : alpha(C.accent, 0.9); ctx.beginPath();
  for (const gx of [0.36, 0.6]) ctx.rect(x + w * gx - w * 0.035, y + h * 0.08, w * 0.07, h * 0.84);
  ctx.stroke();
  ctx.strokeStyle = alpha(C.accent, 0.9); ctx.beginPath(); ctx.moveTo(x, y + h * 0.04); ctx.lineTo(x + w, y + h * 0.04); ctx.moveTo(x, y + h * 0.96); ctx.lineTo(x + w, y + h * 0.96); ctx.stroke();
}
