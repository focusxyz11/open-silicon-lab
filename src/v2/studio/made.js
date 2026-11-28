/* Your die as made, drawn (#511): the studio's plan with the rules of each step of the line. No words. */
import { DIE } from './plan.js';
import { alpha } from './kit.js';

/* ---- your die as made (#511, GUIDE.md §3, "What each step does to your design"): the same plan, drawn with the rules of
   every step of the line up to the one it has passed. o.made: { f (0 crystal, 1 deposit, 2 print, 3 etch, 4 implant,
   5 wires, 6 test), stopped (the line made nothing from Print on), failed (this die failed Test), cells (the made
   chip's cells: each copy's width and whether it strays) }. Before Print the die waits for it: a dotted outline;
   Deposit tints it; Print leaves it in the resist, accent filled 16%; from Etch it is solid, a copy that strays red;
   Implant fills the silicon blue; Wires thickens the rails and makes the wires solid; Test fills a failed die red.
   Drawn small (a wafer's dies) only the outline and the units show, as in the studio. Returns no words ---- */
export const MADE_STEPS = ['crystal', 'deposit', 'print', 'etch', 'implant', 'wires', 'test'];
export function madeDie(ctx, P, cam, o) {
  const { C } = o, M = o.made, s = cam.s, X = x => cam.ox + x * s, Y = y => cam.oy + y * s, dieW = DIE * s, f = M.f;
  const bare = f < 2 || M.stopped, solid = !bare && f >= 3, rect = r => ctx.rect(X(r.x), Y(r.y), r.w * s, r.h * s);
  ctx.save();
  if (f >= 1) { ctx.fillStyle = alpha(C.accent, 0.08); ctx.fillRect(X(0), Y(0), dieW, dieW); }
  if (M.failed) { ctx.fillStyle = C.bad; ctx.fillRect(X(0), Y(0), dieW, dieW); ctx.restore(); return []; }
  ctx.setLineDash(bare ? [2, 3] : solid ? [] : [6, 4]); ctx.lineWidth = Math.max(0.8, Math.min(1.4, dieW / 200)); ctx.strokeStyle = solid ? alpha(C.ink, 0.85) : alpha(C.accent, 0.9);
  ctx.beginPath(); rect({ x: 0, y: 0, w: DIE, h: DIE }); ctx.stroke();
  if (bare || dieW < 24) { ctx.restore(); return []; }
  /* the units: printed in the resist (accent, filled 16%), or cut solid */
  ctx.beginPath(); P.units.forEach(u => { if (!u.back) rect(u); });
  if (solid) { ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = alpha(C.ink, 0.85); } else { ctx.fillStyle = alpha(C.accent, 0.16); ctx.fill(); ctx.strokeStyle = C.accent; }
  ctx.setLineDash([]); ctx.lineWidth = Math.max(0.6, Math.min(1.2, dieW / 260)); ctx.stroke();
  /* your block's cells, close enough: each copy at its own width, a stray one red; implanted silicon blue; wires solid */
  if (P.block.w * s >= 40) {
    const mc = new Map((M.cells || []).map(c => [c.id, c]));
    if (f >= 5) { ctx.strokeStyle = alpha(C.ink, 0.6); ctx.lineWidth = 1; ctx.beginPath(); P.wires.forEach(w => w.pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))))); ctx.stroke(); }
    P.cells.forEach(c => {
      const m = mc.get(c.id), stray = !!(m && m.stray && f >= 3), x = X(c.x), y = Y(c.y), w = c.w * s, h = c.h * s;
      ctx.beginPath(); ctx.rect(x, y, w, h);
      if (solid) { ctx.fillStyle = stray ? alpha(C.bad, 0.3) : C.panel; ctx.fill(); ctx.strokeStyle = stray ? C.bad : alpha(C.ink, 0.85); }
      else { ctx.fillStyle = alpha(C.accent, 0.16); ctx.fill(); ctx.strokeStyle = C.accent; }
      ctx.lineWidth = 1; ctx.stroke();
      if (w < 30) return;
      if (f >= 4) { ctx.fillStyle = alpha(C.accent, 0.3); ctx.fillRect(x + w * 0.12, y + h * 0.16, w * 0.76, h * 0.24); ctx.fillRect(x + w * 0.12, y + h * 0.6, w * 0.76, h * 0.24); }
      const gw = w * 0.07 * (m && f >= 3 ? m.width : 1);
      ctx.fillStyle = f === 2 ? alpha(C.accent, 0.45) : stray ? alpha(C.bad, 0.9) : alpha(C.ink, 0.85);
      for (const gx of [0.36, 0.6]) ctx.fillRect(x + w * gx - gw / 2, y + h * 0.08, gw, h * 0.84);
      if (f >= 5) { ctx.fillStyle = alpha(C.ink, 0.9); ctx.fillRect(x, y + h * 0.02, w, Math.max(1.5, h * 0.05)); ctx.fillRect(x, y + h * 0.93, w, Math.max(1.5, h * 0.05)); }
    });
  }
  ctx.restore();
  return [];
}

