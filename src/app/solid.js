/* Solids in 2.5D: the one way things with volume are drawn across the site (the journey's machines, the
   data centre's hall, the phone taken apart, the car cut open).

   The view is oblique: x runs across, z up, and depth (y) goes back and up to the right. A face turned
   towards you (a plane of constant y) is drawn true to shape, which is what lets a dive zoom straight into
   a face: the next depth is that face, seen straight on. Things are solid and shaded in four tones (top
   lightest, front, right side, base darkest) with thin lines, painted back to front, and they stand on a
   soft shadow. One thing at a time is lit: the thing to watch. Rules from the "anatomy" and "teardown"
   drawing skills: solids not wireframes, no floating labels, every line ends on something.

   proj({ ox, oy, s, cx }) makes a projector: P(x, y, z) -> [X, Y] in the scene's 1000 x 1000 space. */
import { clamp } from './draw.js';

export const KX = 0.42, KY = 0.5;
export function proj(o) {
  const s = o.s || 1, ox = o.ox || 0, oy = o.oy || 800, cx = o.cx || 0, ky = o.ky || KY;
  return (x, y, z) => [cx + ox + s * (x + KX * y - cx), oy - s * ((z || 0) + ky * y)];
}

/* ---- colour ---- */
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const CACHE = new WeakMap();
/* tones for a palette: body (machines), base (stands, floors), hi (the subject), inner (inside a cut) */
export function tones(c) {
  if (CACHE.has(c)) return CACHE.get(c);
  const d = c.dark, T = d
    ? { body: { top: mix(c.up, c.line, 0.32), front: mix(c.mid, c.up, 0.55), side: c.mid },
        base: { top: mix(c.mid, c.up, 0.5), front: c.mid, side: mix(c.lo, c.mid, 0.4) },
        hi: { top: mix(c.up, c.hi, 0.45), front: mix(c.up, c.hi, 0.25), side: mix(c.mid, c.hi, 0.18) },
        inner: { top: mix(c.bg, c.lo, 0.7), front: c.bg, side: mix(c.bg, c.lo, 0.3) },
        edge: mix(c.line, c.hi, 0.12), seam: mix(c.line, c.mid, 0.45), shadow: 'rgba(0,0,0,0.5)' } /* i18n-ok: a colour */
    : { body: { top: '#ffffff', front: mix(c.mid, c.lo, 0.35), side: c.up }, /* i18n-ok: a colour */
        base: { top: c.mid, front: c.up, side: mix(c.up, c.line, 0.18) },
        hi: { top: '#ffffff', front: mix(c.lo, c.cool, 0.06), side: mix(c.up, c.cool, 0.08) }, /* i18n-ok: a colour */
        inner: { top: mix(c.up, c.line, 0.3), front: mix(c.up, c.line, 0.38), side: mix(c.up, c.line, 0.45) },
        edge: mix(c.line, c.lo, 0.15), seam: mix(c.dim, c.line, 0.15), shadow: 'rgba(40,55,80,0.16)' }; /* i18n-ok: a colour */
  CACHE.set(c, T); return T;
}

/* ---- the kit, bound to a projector ---- */
export function kit(P) {
  const path = (G, pts) => { const c = G.ctx; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const fill = (G, pts, f, s, lw) => { path(G, pts); const c = G.ctx; if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = G.lw(lw || 0.8); c.lineJoin = 'round'; c.stroke(); } };
  const line = (G, pts3, s, lw) => G.l(pts3.map(p => P(p[0], p[1], p[2])), s, lw);
  const tn = (G, k) => (typeof k === 'object' ? k : tones(G.col)[k || 'body']);

  /* a soft shadow under a footprint (plan rectangle or plan points), cast back and to the right */
  function shadow(G, pts2, z, spread) {
    /* two soft layers instead of a blur, which is slow on phones */
    const T = tones(G.col), sp = spread || 14, c = G.ctx, cx = pts2.reduce((a, p) => a + p[0], 0) / pts2.length, cy = pts2.reduce((a, p) => a + p[1], 0) / pts2.length;
    const at = k => pts2.map(([x, y]) => P(cx + (x - cx) * k + sp * 0.6, cy + (y - cy) * k + sp, z || 0));
    c.save(); c.globalAlpha = 0.45 * G.base; fill(G, at(1.08), T.shadow); fill(G, at(0.96), T.shadow); c.restore();
  }
  const rectPlan = (x, y, w, d) => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];

  /* a box: front, right side and top; o: { tone, stroke, lit, lw, top: false } */
  function box(G, x, y, z, w, d, h, o) {
    o = o || {}; const t = tn(G, o.tone), sk = o.lit ? G.col.hi : o.stroke || tones(G.col).edge, lw = o.lit ? 1.4 : o.lw || 0.8;
    fill(G, [P(x, y, z), P(x + w, y, z), P(x + w, y, z + h), P(x, y, z + h)], t.front, sk, lw);
    fill(G, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], t.side, sk, lw);
    if (o.top !== false) fill(G, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], t.top, sk, lw);
  }
  /* a panel line across the front face at height zz, or a vertical one at xx */
  const seamH = (G, x, y, w, zz, col) => line(G, [[x, y, zz], [x + w, y, zz]], col || tones(G.col).seam, 0.7);
  const seamV = (G, xx, y, z, h, col) => line(G, [[xx, y, z], [xx, y, z + h]], col || tones(G.col).seam, 0.7);
  /* a rectangle drawn on the front face (a screen, a label plate, a window frame) */
  const onFront = (G, x, y, z, w, h, f, s, lw) => fill(G, [P(x, y, z), P(x + w, y, z), P(x + w, y, z + h), P(x, y, z + h)], f, s, lw);
  const onTop = (G, x, y, z, w, d, f, s, lw) => fill(G, [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], f, s, lw);
  const onSide = (G, x, y, z, d, h, f, s, lw) => fill(G, [P(x, y, z), P(x, y + d, z), P(x, y + d, z + h), P(x, y, z + h)], f, s, lw);

  /* a horizontal circle (the top of a cylinder, a wafer, a pad) */
  const ring = (x, y, z, r, n) => { const out = []; n = n || 44; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832; out.push(P(x + Math.cos(a) * r, y + Math.sin(a) * r, z)); } return out; };
  const arc = (x, y, z, r, a0, a1, n) => { const out = []; n = n || 24; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push(P(x + Math.cos(a) * r, y + Math.sin(a) * r, z)); } return out; };
  const A1 = Math.atan(KX), A2 = A1 + Math.PI;   /* where a cylinder's outline leaves its top and bottom */
  function disc(G, x, y, z, r, f, s, lw) { fill(G, ring(x, y, z, r), f, s, lw); }
  /* the shaded side of a cylinder from z0 to z1 (the half that faces you) */
  function side(G, x, y, z0, z1, r, t, sk, lw) {
    const pts = arc(x, y, z0, r, A2, A1 + 6.2832, 28).concat(arc(x, y, z1, r, A1 + 6.2832, A2, 28));
    const L = P(x + Math.cos(A2) * r, y + Math.sin(A2) * r, z0), R = P(x + Math.cos(A1) * r, y + Math.sin(A1) * r, z0);
    const g = G.ctx.createLinearGradient(L[0], 0, R[0], 0);
    g.addColorStop(0, mix(t.front, t.side, 0.35)); g.addColorStop(0.3, t.front); g.addColorStop(0.62, mix(t.front, t.side, 0.5)); g.addColorStop(1, t.side);
    fill(G, pts, g, sk, lw);
  }
  /* a cylinder standing on z; o: { tone, lit, top: false } */
  function cyl(G, x, y, z, r, h, o) {
    o = o || {}; const t = tn(G, o.tone), sk = o.lit ? G.col.hi : o.stroke || tones(G.col).edge, lw = o.lit ? 1.4 : 0.8;
    side(G, x, y, z, z + h, r, t, sk, lw);
    if (o.top !== false) disc(G, x, y, z + h, r, t.top, sk, lw);
  }
  /* a cylinder cut open at the front down to height zc, to show what is inside; inner() draws the inside */
  function cutCyl(G, x, y, z, r, h, zc, inner, o) {
    o = o || {}; const T = tones(G.col), t = tn(G, o.tone), sk = o.stroke || T.edge;
    /* outside first where it shows behind: the back rim, then the inside wall and floor */
    fill(G, arc(x, y, z + h, r, A1, A2, 24).concat(arc(x, y, z + 2, r, A2, A1, 24)), T.inner.front, sk, 0.8);
    disc(G, x, y, z + 2, r - 1, T.inner.top);
    if (inner) inner();
    /* the front wall, cut at zc, with its cut edge */
    side(G, x, y, z, zc, r, t, sk, 0.8);
    const wall = 5;
    fill(G, arc(x, y, zc, r, A2, A1 + 6.2832, 28).concat(arc(x, y, zc, r - wall, A1 + 6.2832, A2, 28)), t.top, sk, 0.7);
    line(G, [[x + Math.cos(A1) * r, y + Math.sin(A1) * r, zc], [x + Math.cos(A1) * r, y + Math.sin(A1) * r, z + h]], sk, 0.8);
    line(G, [[x + Math.cos(A2) * r, y + Math.sin(A2) * r, zc], [x + Math.cos(A2) * r, y + Math.sin(A2) * r, z + h]], sk, 0.8);
    G.l(arc(x, y, z + h, r, A1, A2, 24), sk, 0.9);
    fill(G, arc(x, y, z + h, r, A1, A2, 24).concat(arc(x, y, z + h, r - wall, A2, A1, 24)), t.top, sk, 0.7);
  }

  /* a prism on a plan polygon (counter-clockwise, seen from above); o: { tone, open: draws the inside first } */
  function prism(G, pl, z, h, o) {
    o = o || {}; const T = tones(G.col), t = tn(G, o.tone), sk = o.stroke || T.edge, n = pl.length;
    const faces = [];
    for (let i = 0; i < n; i++) {
      const a = pl[i], b = pl[(i + 1) % n], nx = b[1] - a[1], ny = -(b[0] - a[0]), L = Math.hypot(nx, ny) || 1;
      const q = [P(a[0], a[1], z), P(b[0], b[1], z), P(b[0], b[1], z + h), P(a[0], a[1], z + h)];
      const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
      const lit = clamp(0.5 + 0.5 * ((-ny / L) * 0.8 - (nx / L) * 0.25), 0, 1);
      faces.push({ q, out: area < 0, col: mix(t.side, t.front, lit), d: -(a[1] + b[1]) + (a[0] + b[0]) * 0.1 });
    }
    if (o.open) {
      faces.filter(f => !f.out).forEach(f => fill(G, f.q, T.inner.front, sk, 0.7));
      fill(G, pl.map(p => P(p[0], p[1], z + 2)), T.inner.top);
      o.open();
    }
    faces.filter(f => f.out).sort((p, q) => q.d - p.d).forEach(f => fill(G, f.q, f.col, sk, 0.8));
    if (!o.open) fill(G, pl.map(p => P(p[0], p[1], z + h)), t.top, sk, 0.8);
    else { const w = o.wall || 5, cx = pl.reduce((s, p) => s + p[0], 0) / n, cy = pl.reduce((s, p) => s + p[1], 0) / n;
      const inn = pl.map(p => { const dx = p[0] - cx, dy = p[1] - cy, L = Math.hypot(dx, dy); return [p[0] - (dx / L) * w, p[1] - (dy / L) * w]; });
      G.ctx.beginPath(); pl.forEach((p, i) => { const s2 = P(p[0], p[1], z + h); i ? G.ctx.lineTo(s2[0], s2[1]) : G.ctx.moveTo(s2[0], s2[1]); }); G.ctx.closePath();
      inn.forEach((p, i) => { const s2 = P(p[0], p[1], z + h); i ? G.ctx.lineTo(s2[0], s2[1]) : G.ctx.moveTo(s2[0], s2[1]); }); G.ctx.closePath();
      G.ctx.fillStyle = t.top; G.ctx.fill('evenodd'); G.ctx.strokeStyle = sk; G.ctx.lineWidth = G.lw(0.7); G.ctx.stroke(); }
  }
  const hexPlan = (cx, cy, R, rot) => { const out = []; for (let i = 0; i < 6; i++) { const a = (rot || 0) + (i / 6) * 6.2832; out.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } return out; };

  /* a pipe along 3D points: a dark body and a thin light line, so it reads round */
  function pipe(G, pts3, r, col) {
    const T = tones(G.col), q = pts3.map(p => P(p[0], p[1], p[2])), c = G.ctx;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    G.l(q, T.edge, r * 2 + 1.6); G.l(q, col || T.body.front, r * 2); G.l(q.map(p => [p[0] - r * 0.3, p[1] - r * 0.45]), T.body.top, Math.max(0.6, r * 0.6));
    c.restore();
  }
  /* a stack light on a tool: red, amber, green; one is on */
  function tower(G, x, y, z, on) {
    const c = G.col, cols = [c.red, c.warm, c.grn];
    cyl(G, x, y, z, 2.5, 26, {});
    for (let i = 0; i < 3; i++) {
      const lit = on === i, zz = z + 26 + i * 11;
      cyl(G, x, y, zz, 5, 10, { tone: { top: lit ? cols[2 - i] : mix(cols[2 - i], c.bg, 0.6), front: mix(cols[2 - i], c.bg, lit ? 0.1 : 0.62), side: mix(cols[2 - i], c.bg, lit ? 0.3 : 0.72) } });
    }
    if (on != null && c.dark) { const p = P(x, y, z + 26 + on * 11 + 5); const g = G.ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 22); g.addColorStop(0, mix(cols[2 - on], c.bg, 0.2)); g.addColorStop(1, 'rgba(0,0,0,0)'); /* i18n-ok: a colour */ G.ctx.save(); G.ctx.globalAlpha = 0.35 * G.base; G.ctx.fillStyle = g; G.ctx.fillRect(p[0] - 22, p[1] - 22, 44, 44); G.ctx.restore(); }
  }
  /* a person in a clean-room suit, standing at (x, y) */
  function person(G, x, y, k) {
    k = k || 1;
    const T = tones(G.col), c = G.col, suit = { top: T.hi.top, front: T.hi.front, side: T.hi.side }, B = (dx, dy, dz, w, d, h) => box(G, x + dx * k, y + dy * k, dz * k, w * k, d * k, h * k, { tone: suit });
    shadow(G, rectPlan(x - 12 * k, y - 8 * k, 24 * k, 16 * k), 0, 8 * k);
    B(-9, -5, 0, 7, 10, 62); B(2, -5, 0, 7, 10, 62); B(-12, -7, 60, 24, 14, 64); B(-17, -5, 72, 5, 10, 48); B(12, -5, 72, 5, 10, 48);
    cyl(G, x, y, 124 * k, 10 * k, 26 * k, { tone: suit });
    onFront(G, x - 7 * k, y - 10 * k, 136 * k, 14 * k, 9 * k, c.dark ? mix(c.cool, c.bg, 0.4) : mix(c.cool, '#ffffff', 0.4), T.edge, 0.7); /* i18n-ok: a colour */
  }
  return { P, fill, line, shadow, rectPlan, box, seamH, seamV, onFront, onTop, onSide, ring, arc, disc, side, cyl, cutCyl, prism, hexPlan, pipe, tower, person, A1, A2 };
}
