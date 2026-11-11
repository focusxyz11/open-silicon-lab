/* The world: one continuous dive, from Fable's world build (OSL-02). Each depth is a scene in a 1000 x 1000
   space (src/app/scenes.js); the next depth lives inside its portal square, and the camera slides between
   the whole scene and that square, so the dive never cuts. The depth you came from stays faintly around it.
   The active question lights up the parts it is about; the other questions crossing this depth sit on their
   parts as coloured dots you can pick. The maths is in src/engines/weave.js. */
import { t } from '../core/i18n.js';
import { DEPTHS, THREADS, partWord } from '../data/weave.js';
import { N, IDS, clampZ, frames, lineFrames, isLine, stop } from '../engines/weave.js';
import { SCENES, partsOf } from './scenes.js';
import { drawJourney, stepStart } from './journey.js';

export const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
export const theme = () => {
  const a = document.documentElement.getAttribute('data-theme');
  if (a === 'dark' || a === 'light') return a;
  return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};
export const threadColor = id => { const th = THREADS.find(x => x.id === id); if (!th) return theme() === 'dark' ? '#e8edf6' : '#131c26'; return theme() === 'dark' ? 'hsl(' + th.hue + ' 88% 68%)' : 'hsl(' + th.hue + ' 72% 36%)'; };
const MONO = '"Martian Mono", ui-monospace, Menlo, monospace'; /* i18n-ok: a font name */

function palette() {
  return theme() === 'dark'
    ? { dark: true, bg: '#05070d', lo: '#0b1020', mid: '#151d36', up: '#1f2a4a', line: '#5a6b93', hi: '#c9d4ee', dim: '#27324f', veil: 'rgba(5,7,13,0.58)', warm: '#ffb057', cool: '#63b6ff', grn: '#35c994', red: '#ff6f5c' }
    : { dark: false, bg: '#e6eaf0', lo: '#f7f9fb', mid: '#e2e8f0', up: '#cfd8e4', line: '#5c6a82', hi: '#18222f', dim: '#c3ccd9', veil: 'rgba(240,243,247,0.66)', warm: '#b86a00', cool: '#1c64c8', grn: '#0b8a5c', red: '#cc3f2b' };
}

/* ---- shapes ---- */
function shapePath(c, sh) {
  if (sh.r) c.rect(sh.r[0], sh.r[1], sh.r[2], sh.r[3]);
  else if (sh.c) { c.moveTo(sh.c[0] + sh.c[2], sh.c[1]); c.arc(sh.c[0], sh.c[1], sh.c[2], 0, 6.2832); }
  else if (sh.closed) { sh.p.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
}
function outline(sh) {
  if (sh.r) { const r = sh.r; return [[r[0], r[1]], [r[0] + r[2], r[1]], [r[0] + r[2], r[1] + r[3]], [r[0], r[1] + r[3]], [r[0], r[1]]]; }
  if (sh.c) { const o = []; for (let i = 0; i <= 24; i++) o.push([sh.c[0] + Math.cos((i / 24) * 6.2832) * sh.c[2], sh.c[1] + Math.sin((i / 24) * 6.2832) * sh.c[2]]); return o; }
  return sh.p || [];
}
export function centre(sh) {
  if (sh.r) return [sh.r[0] + sh.r[2] / 2, sh.r[1] + sh.r[3] / 2];
  if (sh.c) return [sh.c[0], sh.c[1]];
  const p = sh.p[Math.floor(sh.p.length / 2)]; return [p[0], p[1]];
}
/* is (x, y) on this shape? Returns its area (smaller wins), or null */
function shapeHit(sh, x, y, tol) {
  if (sh.r) { const r = sh.r; return x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3] ? r[2] * r[3] : null; }
  if (sh.c) { const c = sh.c; return Math.hypot(x - c[0], y - c[1]) <= c[2] ? Math.PI * c[2] * c[2] : null; }
  const p = sh.p || [];
  if (sh.closed) {
    let inside = false, area = 0;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) inside = !inside;
      area += p[j][0] * p[i][1] - p[i][0] * p[j][1];
    }
    return inside ? Math.abs(area) / 2 : null;
  }
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L));
    if (Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy) <= tol) return tol * Math.sqrt(L);
  }
  return null;
}
function along(pts, f) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let d = f * L;
  for (let i = 1; i < pts.length; i++) {
    const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= s || i === pts.length - 1) { const u = s ? Math.min(1, d / s) : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; }
    d -= s;
  }
  return pts[0];
}
const smooth = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

export function createWorld(cv, on) {
  const ctx = cv.getContext('2d'), t0 = performance.now();
  let W = 0, H = 0, dpr = 1, col = palette(), Z = 0, fly = null, lastD = -1, lastZ = -1;
  let inset = { l: 0, r: 0, t: 0, b: 0 }, anchor = null, thread = null, hits = [], hot = null, running = true;

  /* The drawing helper handed to every scene. */
  const G = {
    ctx, s: 1, k: 1, primary: false, t: 0, col, id: '', base: 1, mine: false, run: null,
    lw(px) { return (px * this.k) / this.s; },
    bg(c) { this.ctx.fillStyle = c || this.col.lo; this.ctx.fillRect(0, 0, 1000, 1000); },
    r(x, y, w, h, fill, stroke, lw) { const c = this.ctx; if (fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = this.lw(lw || 1); c.strokeRect(x, y, w, h); } },
    l(pts, stroke, lw) { const c = this.ctx; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = stroke; c.lineWidth = this.lw(lw || 1); c.stroke(); },
    c(x, y, r, fill, stroke, lw) { const c = this.ctx; c.beginPath(); c.arc(x, y, r, 0, 6.2832); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = this.lw(lw || 1); c.stroke(); } },
    a(alpha) { this.ctx.globalAlpha = this.base * alpha; },
    /* a small name beside a part, only on the depth you are standing in */
    label(key, x, y, align) {
      if (!this.primary) return;
      const s = t('part.' + partWord(this.id, key)), c = this.ctx, size = 11.5 / this.s;
      c.save(); c.font = '500 ' + size + 'px ' + MONO; c.textAlign = align || 'left';
      const m = c.measureText(s).width, bx = align === 'center' ? x - m / 2 : align === 'right' ? x - m : x;
      c.globalAlpha = this.base * 0.8; c.fillStyle = this.col.lo; c.fillRect(bx - 4 / this.s, y - size, m + 8 / this.s, size * 1.4);
      c.globalAlpha = this.base * 0.92; c.fillStyle = this.col.hi; c.fillText(s, x, y); c.restore();
    }
  };

  const focusShapes = i => { if (!thread) return []; const names = stop(thread, i) || [], P = partsOf(IDS[i]); return names.flatMap(n => P[n] || []); };

  /* the active question lights up the parts it is about */
  function highlight(i, tr, tm, alpha) {
    const shapes = focusShapes(i); if (!shapes.length) return;
    const color = threadColor(thread), many = shapes.length > 14, px = 1 / tr.s;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.rect(0, 0, 1000, 1000); shapes.forEach(sh => shapePath(ctx, sh));
    ctx.fillStyle = col.veil; ctx.fill('evenodd');
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineJoin = 'round';
    if (col.dark && !many) { ctx.shadowColor = color; ctx.shadowBlur = 14 * dpr; }
    shapes.forEach(sh => {
      const o = outline(sh); ctx.beginPath(); o.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.lineWidth = (sh.p && !sh.closed ? 3 : 2) * px; ctx.stroke();
      if (!sh.p || sh.closed) { ctx.globalAlpha = alpha * 0.1; ctx.fill(); ctx.globalAlpha = alpha; }
    });
    ctx.shadowBlur = 0;
    shapes.forEach((sh, k) => {
      if (many && k % 4) return;
      const p = along(outline(sh), (tm * 0.22 + k * 0.37) % 1), r = 3.6 * px;
      ctx.fillStyle = color; ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
      ctx.fillStyle = col.dark ? '#fff' : col.lo; ctx.fillRect(p[0] - r * 0.4, p[1] - r * 0.4, r * 0.8, r * 0.8);
    });
    ctx.restore();
  }

  function drawLevel(i, tr, alpha, primary, B, tm) {
    const id = IDS[i], sc = SCENES[id], size = tr.s * 1000;
    if (!sc || size < 5 || alpha <= 0.01) return;
    ctx.save();
    ctx.setTransform(dpr * tr.s, 0, 0, dpr * tr.s, dpr * tr.tx, dpr * tr.ty);
    ctx.beginPath(); ctx.rect(0, 0, 1000, 1000); ctx.clip();
    ctx.globalAlpha = alpha;
    Object.assign(G, { s: tr.s, k: Math.max(0.3, Math.min(1.5, size / B)), primary, t: tm, col, id, base: alpha, box: B });
    /* while it is small, the depth fading in is already drawn, small, by the scene around it (scenes.js) */
    if (size < 46 && !primary) { ctx.restore(); return; }
    sc.draw(G);
    ctx.globalAlpha = alpha;
    if (primary && !fly) highlight(i, tr, tm, alpha);
    ctx.restore();
  }

  function box() {
    const aw = Math.max(50, W - inset.l - inset.r), ah = Math.max(50, H - inset.t - inset.b);
    /* on the line, in a tall narrow space (a phone), the box moves up and the words go under it */
    if (isLine() && ah - aw > 90) { const below = Math.min(ah - aw, 200); return { B: aw, cx: inset.l + aw / 2, cy: inset.t + (ah - below) / 2, below }; }
    return { B: Math.min(aw, ah), cx: inset.l + aw / 2, cy: inset.t + ah / 2, below: 0 };
  }

  /* the journey: stations side by side, the camera sliding along the line. The station you stand at is
     yours (G.mine): your wafer is in it, and from the moment you stop, its steps play (G.run, seconds). */
  let stay = { i: -1, t: 0 }, paused = false, lastTm = 0, jhits = null, jbox = null;
  function renderLine(tm, b) {
    const F = lineFrames(Z, b.B, b.cx, b.cy), pi = F.f < 0.5 ? F.i : F.i + 1, near = Math.round(Z), dist = Math.abs(Z - near);
    if (!fly && !drag && dist < 0.02) { if (stay.i !== near) { stay = { i: near, t: tm }; paused = false; } else if (paused) stay.t += tm - lastTm; } else if (dist > 0.05 || fly) stay.i = -1;
    lastTm = tm;
    const run = stay.i === near ? (reduced() ? -1 : tm - stay.t) : null;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W * dpr, H * dpr);
    const all = [[F.i - 1, F.prev], [F.i, F.cur], [F.i + 1, F.next], [F.i + 2, F.after]].filter(k => k[1]);
    all.forEach(([k, tr]) => { G.mine = k === near && dist < 0.5; G.run = G.mine ? run : null; drawLevel(k, tr, 1, k === pi, b.B, tm); });
    G.mine = false; G.run = null;
    /* over the stations, fixed in the box: your pod, and the band that says what is happening */
    const k = b.B / 1000, left = b.cx - b.B / 2, top = b.cy - b.B / 2;
    const below = (H - inset.b - (top + b.B)) / k;
    ctx.save(); ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * left, dpr * top); ctx.beginPath(); ctx.rect(0, 0, 1000, 1000 + (b.below ? below : 0)); ctx.clip();
    Object.assign(G, { s: k, k: 1, primary: true, t: tm, col, id: IDS[near], base: 1, box: b.B });
    jhits = drawJourney(G, { ids: IDS, Z, near, dist, run, paused, below: b.below ? below : 0 }); jbox = { k, left, top, near };
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* where you are on the line: a mark per station */
    const y = top + 12, gap = Math.min(18, (b.B - 40) / N);
    for (let i = 0; i < N; i++) { const x = b.cx + (i - (N - 1) / 2) * gap; ctx.globalAlpha = i === near ? 1 : 0.5; ctx.fillStyle = i === near ? col.warm : col.line; ctx.beginPath(); ctx.arc(x, y, i === near ? 4 : 2.5, 0, 6.2832); ctx.fill(); }
    /* everything outside the box fades back */
    ctx.globalAlpha = 0.45; ctx.fillStyle = col.bg;
    const L = b.cx - b.B / 2, Rr = b.cx + b.B / 2;
    ctx.fillRect(0, 0, L, H); ctx.fillRect(Rr, 0, W - Rr, H);
    ctx.globalAlpha = 0.5; ctx.strokeStyle = col.line; ctx.lineWidth = 1; const ptr = pi === F.i ? F.cur : F.next; ctx.strokeRect(ptr.tx, ptr.ty, b.B, b.B);
    ctx.globalAlpha = 1;
    return { F, pi, ptr };
  }

  function render(now) {
    const tm = reduced() ? 3 : Math.max(0, (now - t0) / 1000), b = box();
    if (isLine()) { const L = renderLine(tm, b); overlays(tm, L.pi, L.ptr); return; }
    const F = frames(Z, b.B, b.cx, b.cy), pi = F.f < 0.5 ? F.i : F.i + 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W * dpr, H * dpr);
    if (F.prev) {
      /* the depth you came from stays as faint surroundings */
      drawLevel(F.i - 1, F.prev, 1, false, b.B, tm);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.74; ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W * dpr, H * dpr); ctx.globalAlpha = 1;
    }
    drawLevel(F.i, F.cur, 1, pi === F.i, b.B, tm);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 0.5; ctx.strokeStyle = col.line; ctx.lineWidth = 1;
    ctx.strokeRect(F.cur.tx, F.cur.ty, F.cur.s * 1000, F.cur.s * 1000); ctx.globalAlpha = 1;
    if (F.next) drawLevel(F.i + 1, F.next, smooth(0.16, 0.7, F.f), pi === F.i + 1, b.B, tm);
    overlays(tm, pi, pi === F.i ? F.cur : F.next);
  }

  /* the part under the pointer, in the scene in view: tap it to see what it does */
  let view = null, hotPart = null;
  function partAt(e) {
    if (!view || fly) return null;
    const r = cv.getBoundingClientRect(), sx = (e.clientX - r.left - view.ptr.tx) / view.ptr.s, sy = (e.clientY - r.top - view.ptr.ty) / view.ptr.s;
    if (sx < 0 || sy < 0 || sx > 1000 || sy > 1000) return null;
    const P = partsOf(IDS[view.pi]), tol = 12 / view.ptr.s; let best = null;
    for (const key of Object.keys(P)) for (const sh of P[key]) {
      const a = shapeHit(sh, sx, sy, tol); if (a != null && (!best || a < best.a)) best = { key, a };
    }
    return best;
  }
  function drawHotPart(pi, ptr) {
    if (!hotPart || fly) return;
    const shapes = partsOf(IDS[pi])[hotPart] || [];
    ctx.save(); ctx.setTransform(dpr * ptr.s, 0, 0, dpr * ptr.s, dpr * ptr.tx, dpr * ptr.ty);
    ctx.strokeStyle = col.hi; ctx.lineWidth = 2 / ptr.s; ctx.setLineDash([6 / ptr.s, 4 / ptr.s]); ctx.globalAlpha = 0.85;
    shapes.forEach(sh => { const o = outline(sh); ctx.beginPath(); o.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); });
    ctx.restore();
    /* its name, above it: the picture keeps no labels of its own where names would crowd it */
    if (shapes.length && isLine()) {
      const o = outline(shapes[0]), top = o.reduce((a, p) => (p[1] < a[1] ? p : a), o[0]), name = t('part.' + partWord(IDS[pi], hotPart));
      const x = ptr.tx + top[0] * ptr.s, y = ptr.ty + top[1] * ptr.s - 10;
      ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = '500 12px ' + MONO; ctx.textAlign = 'center';
      const w = ctx.measureText(name).width + 12; ctx.globalAlpha = 0.92; ctx.fillStyle = col.bg; ctx.fillRect(x - w / 2, y - 14, w, 19);
      ctx.strokeStyle = col.line; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2, y - 14, w, 19); ctx.globalAlpha = 1; ctx.fillStyle = col.hi; ctx.fillText(name, x, y);
      ctx.restore();
    }
  }

  /* drawn over the scene in view, in a dive or on the line */
  function overlays(tm, pi, ptr) {
    view = { pi, ptr };
    drawHotPart(pi, ptr);
    /* the tether: from the question in the card to what it is about */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (anchor && thread && ptr && !fly) {
      const shapes = focusShapes(pi);
      if (shapes.length) {
        const c0 = centre(shapes[0]), fx = ptr.tx + c0[0] * ptr.s, fy = ptr.ty + c0[1] * ptr.s, color = threadColor(thread);
        ctx.globalAlpha = 0.75; ctx.strokeStyle = color; ctx.lineWidth = 1.4;
        const mx = (anchor[0] + fx) / 2;
        ctx.beginPath(); ctx.moveTo(anchor[0], anchor[1]); ctx.bezierCurveTo(mx, anchor[1], mx, fy, fx, fy); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(fx, fy, 4, 0, 6.2832); ctx.fill();
      }
    }
    /* the other questions crossing here, sitting on the parts they are about */
    hits = [];
    const near = 1 - smooth(0.12, 0.34, Math.abs(Z - Math.round(Z)));
    if (!fly && ptr && near > 0.02) {
      const P = partsOf(IDS[pi]), used = [];
      THREADS.forEach(th => {
        if (th.id === thread) return;
        const names = stop(th.id, pi); if (!names) return;
        let sh = null; for (const n of names) if (!sh && P[n] && P[n].length) sh = P[n][0];
        if (!sh) return;
        const c0 = centre(sh); let x = ptr.tx + c0[0] * ptr.s, y = ptr.ty + c0[1] * ptr.s, n = 0;
        while (n < 9 && used.some(u => Math.hypot(u[0] - x, u[1] - y) < 26)) { x += 28; n++; }
        used.push([x, y]);
        hits.push({ id: th.id, x, y, r: 16 });
        const color = threadColor(th.id), isHot = hot === th.id, r = isHot ? 10 : 7.5;
        ctx.globalAlpha = near; ctx.fillStyle = col.bg; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 6.2832); ctx.fill();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = isHot ? col.hi : color; ctx.lineWidth = 1.5; ctx.globalAlpha = near * (isHot ? 1 : 0.5);
        ctx.beginPath(); ctx.arc(x, y, r + 5 + (isHot ? 0 : Math.sin(tm * 2 + x) * 1.5), 0, 6.2832); ctx.stroke();
      });
    }
    ctx.globalAlpha = 1;
  }

  function settle() {
    const d = Math.round(Z);
    if (Z !== lastZ) { lastZ = Z; on.zoom && on.zoom(Z); }
    if (d !== lastD && !fly) { lastD = d; on.depth && on.depth(d); }
  }
  function tick(now) {
    if (!running) return;
    requestAnimationFrame(tick);
    if (!cv.isConnected) return;
    if (fly) {
      const u = Math.max(0, Math.min(1, (now - fly.t0) / fly.ms)), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      Z = clampZ(fly.from + (fly.to - fly.from) * e);
      if (u >= 1) { Z = fly.to; fly = null; on.arrive && on.arrive(Math.round(Z)); }
    }
    render(now); settle();
  }
  function resize() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(100, r.width); H = Math.max(100, r.height);
    const w = Math.round(W * dpr), h = Math.round(H * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  }
  const hitAt = e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null; hits.forEach(h => { const d = Math.hypot(h.x - x, h.y - y); if (d <= h.r && (!best || d < best.d)) best = { id: h.id, d }; }); return best; };

  /* ---- input: wheel, drag and keys move the dive; a tap on a coloured dot picks that question ---- */
  const setZ = z => { fly = null; Z = clampZ(z); };
  /* on the line, moving sideways (drag, swipe, horizontal scroll) moves along it, and letting go settles on a station */
  let settleT = null;
  const settleLine = () => { clearTimeout(settleT); settleT = setTimeout(() => { if (isLine() && !drag && !fly && Math.abs(Z - Math.round(Z)) > 0.001) api.flyTo(Math.round(Z)); }, 260); };
  cv.addEventListener('wheel', e => { e.preventDefault(); const d = isLine() && Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; setZ(Z + d * (e.deltaMode ? 0.03 : 0.0016)); if (isLine()) settleLine(); }, { passive: false });
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { y: e.clientY, x: e.clientX, z: Z, moved: false }; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* no capture */ } });
  cv.addEventListener('pointermove', e => {
    if (drag) {
      if (Math.abs(e.clientY - drag.y) + Math.abs(e.clientX - drag.x) > 6) drag.moved = true;
      if (drag.moved) setZ(isLine() ? drag.z + (drag.x - e.clientX) / (box().B * 1.06) : drag.z + (drag.y - e.clientY) * 0.0062);
      return;
    }
    const h = hitAt(e), id = h ? h.id : null, pt = id ? null : partAt(e);
    hot = id; hotPart = pt ? pt.key : null;
    cv.style.cursor = id || pt ? 'pointer' : '';
  });
  cv.addEventListener('pointerleave', () => { hot = null; hotPart = null; cv.style.cursor = ''; });
  /* on the line, the steps under the picture: tap one to watch it again, or pause */
  const stepTap = e => {
    if (!isLine() || !jhits || !jbox) return false;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left - jbox.left) / jbox.k, y = (e.clientY - r.top - jbox.top) / jbox.k, inn = h => h && x >= h.x - 4 && x <= h.x + h.w + 4 && y >= h.y - 6 && y <= h.y + h.h + 6;
    if (inn(jhits.pause)) { paused = !paused; return true; }
    const ch = jhits.chips.find(inn); if (!ch) return false;
    stay = { i: jbox.near, t: lastTm - stepStart(IDS[jbox.near], ch.i) }; paused = false; return true;
  };
  const end = e => { if (!drag) return; const tap = !drag.moved; drag = null; if (tap && e.type === 'pointerup' && stepTap(e)) return; if (tap && e.type === 'pointerup') { const h = hitAt(e); if (h) on.pick && on.pick(h.id); else { const pt = partAt(e); if (pt && view) { hotPart = pt.key; on.part && on.part(view.pi, pt.key); } } } if (!tap && isLine()) settleLine(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('keydown', e => {
    const d = Math.round(Z);
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === '+' || e.key === 'ArrowRight') { e.preventDefault(); api.flyTo(d + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === '-' || e.key === 'ArrowLeft') { e.preventDefault(); api.flyTo(d - 1); }
    else if (e.key === 'Home') { e.preventDefault(); api.flyTo(0); }
    else if (e.key === 'End') { e.preventDefault(); api.flyTo(N - 1); }
  });
  new ResizeObserver(resize).observe(cv); resize();
  new MutationObserver(() => { col = palette(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const api = {
    get z() { return Z; },
    get flying() { return !!fly; },
    setZ(z) { setZ(z); },
    flyTo(d) {
      d = clampZ(d);
      if (reduced()) { fly = null; Z = d; on.arrive && on.arrive(Math.round(Z)); return; }
      /* on the line, a hop to the next station is slow enough to watch the pod travel */
      fly = { from: Z, to: d, t0: performance.now(), ms: Math.min(5200, isLine() ? 1000 + Math.abs(d - Z) * 1300 : 500 + Math.abs(d - Z) * 1150) };
    },
    setThread(th) { thread = th; },
    setAnchor(p) { anchor = p; },
    setInset(i) { inset = i; },
    retheme() { col = palette(); },
    stop() { running = false; }
  };
  requestAnimationFrame(tick);
  return api;
}
export { N, IDS, DEPTHS };
