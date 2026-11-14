/* The world: one continuous dive, from Fable's world build (OSL-02). Each depth is a scene in a 1000 x 1000
   space (src/app/scenes.js); the next depth lives inside its portal square, and the camera slides between
   the whole scene and that square, so the dive never cuts. The depth you came from stays faintly around it.
   The active question lights up the parts it is about; the other questions crossing this depth sit on their
   parts as coloured dots you can pick. The maths is in src/engines/weave.js. */
import { t } from '../core/i18n.js';
import { DEPTHS, THREADS, partWord } from '../data/weave.js';
import { N, IDS, WORLD, worldOf, clampZ, frames, lineFrames, isLine, stop } from '../engines/weave.js';
import { SCENES, partsOf } from './scenes.js';
import { drawMap } from './map.js';
import { drawJourney, stepStart, setParts3 } from './journey.js';
import { drawDesignBand } from './design.js';
import { wrap } from './draw.js';
/* a line drawn flat, without the factory's 3D: the design studio */
const flat = () => !!(worldOf(WORLD) || {}).flat;

export const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
export const theme = () => {
  const a = document.documentElement.getAttribute('data-theme');
  if (a === 'dark' || a === 'light') return a;
  return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};
export const threadColor = id => { const th = THREADS.find(x => x.id === id); if (!th) return theme() === 'dark' ? '#e8edf6' : '#131c26'; return theme() === 'dark' ? 'hsl(' + th.hue + ' 88% 68%)' : 'hsl(' + th.hue + ' 72% 36%)'; };
const MONO = '"Martian Mono", ui-monospace, Menlo, monospace'; /* i18n-ok: a font name */
const SANS = '"Atkinson Hyperlegible Next", system-ui, sans-serif'; /* i18n-ok: a font name */


/* the chip world's look (CHROME.lit): the same palette as its 3D views and its pages (src/styles/v2.css), with the
   same materials (si silicon, doped silicon, cu copper wires, au contact metal, glass insulator; the switch's gate is
   cool, the accent), and
   light from above: shapes are lit at the top and cast a soft shadow, as the lit 3D scenes do */
const WORLD_LOOK = {
  dark: { lit: true, dark: true, bg: '#0b1120', lo: '#111a2b', mid: '#18233a', up: '#23314d', line: '#6f7f9c', hi: '#eef2f8', dim: '#2a3854', veil: 'rgba(11,17,32,0.6)', warm: '#ffb347', cool: '#5aa9ff', grn: '#45d08a', red: '#ff6b62', si: '#46536b', doped: '#87755e', cu: '#c77b45', au: '#c9a14a', glass: '#5aa9e6' },
  light: { lit: true, dark: false, bg: '#dfe8f2', lo: '#f5f8fc', mid: '#e7eef6', up: '#d4dfeb', line: '#5b6a80', hi: '#16202e', dim: '#c8d3e1', veil: 'rgba(223,232,242,0.66)', warm: '#c27400', cool: '#2f7de1', grn: '#138a5a', red: '#cc3f2b', si: '#8d99ab', doped: '#a08c6f', cu: '#b5683a', au: '#d2a744', glass: '#9fc4dc' }
};
function palette() {
  if (CHROME.lit) return WORLD_LOOK[theme() === 'dark' ? 'dark' : 'light'];
  return Object.assign({}, WORLD_LOOK[theme() === 'dark' ? 'dark' : 'light'], earlierPalette());
}
function earlierPalette() {
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

/* the earlier site's own chrome over the picture: the marks along the top and the dive label. The chip world's
   frame says the same things, so it switches them off (setChrome). */
const CHROME = { dots: true, dive: true, stage: null, lit: false };
export const setChrome = o => Object.assign(CHROME, o);
export function createWorld(cv, on) {
  const ctx = cv.getContext('2d'), t0 = performance.now();
  let W = 0, H = 0, dpr = 1, col = palette(), Z = 0, fly = null, lastD = -1, lastZ = -1;
  let inset = { l: 0, r: 0, t: 0, b: 0 }, anchor = null, thread = null, hits = [], hot = null, running = true;
  /* words on the picture: notes pinned to parts (set by the shell), and the way down into the next depth */
  let notes = [], dive = null;

  /* The drawing helper handed to every scene. */
  const G = {
    ctx, s: 1, k: 1, primary: false, t: 0, col, id: '', base: 1, mine: false, run: null,
    lw(px) { return (px * this.k) / this.s; },
    bg(c) { const x = this.ctx; x.fillStyle = c || this.col.lo; x.fillRect(0, 0, 1000, 1000);
      /* lit: the light falls from the top left, as on the 3D views */
      if (CHROME.lit && this.primary) { const g = x.createRadialGradient(260, 120, 40, 420, 380, 1050); g.addColorStop(0, this.col.dark ? 'rgba(120,160,230,0.10)' : 'rgba(255,255,255,0.55)'); g.addColorStop(1, this.col.dark ? 'rgba(0,0,0,0.28)' : 'rgba(30,50,80,0.10)'); x.fillStyle = g; x.fillRect(0, 0, 1000, 1000); } },
    r(x, y, w, h, fill, stroke, lw) {
      const c = this.ctx;
      /* lit: a shape big enough to read as a part gets rounded corners, a soft shadow below and light on its top */
      if (CHROME.lit && fill && w * h > 1600 && w > 14 && h > 14) {
        const rad = Math.min(7, w / 8, h / 8);
        c.save(); c.beginPath(); c.roundRect(x, y, w, h, rad);
        c.shadowColor = this.col.dark ? 'rgba(0,0,0,0.45)' : 'rgba(30,50,80,0.22)'; c.shadowBlur = 14 * this.k; c.shadowOffsetY = 4 * this.k;
        c.fillStyle = fill; c.fill(); c.shadowColor = 'transparent';
        const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, this.col.dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.45)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, this.col.dark ? 'rgba(0,0,0,0.18)' : 'rgba(30,50,80,0.06)');
        c.fillStyle = g; c.fill();
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = this.lw(lw || 1); c.stroke(); }
        c.restore(); return;
      }
      if (fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = this.lw(lw || 1); c.strokeRect(x, y, w, h); } },
    l(pts, stroke, lw) { const c = this.ctx; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = stroke; c.lineWidth = this.lw(lw || 1); c.stroke(); },
    c(x, y, r, fill, stroke, lw) { const c = this.ctx; c.beginPath(); c.arc(x, y, r, 0, 6.2832);
      /* lit: a round part is a small sphere, light on its upper left */
      if (CHROME.lit && fill && r > 6) { c.fillStyle = fill; c.fill(); const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, this.col.dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(0,0,0,' + (this.col.dark ? 0.25 : 0.1) + ')'); c.fillStyle = g; c.fill(); fill = null; }
      if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = this.lw(lw || 1); c.stroke(); } },
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
  let stay = { i: -1, t: 0 }, paused = false, names = false, lastTm = 0, jhits = null, jbox = null, lensBox = null;
  /* the journey in 3D (src/app/journey3d.js), loaded the first time the line is shown; until then, or
     without WebGL, the 2D stations */
  let J3 = null, j3state = 'none';
  const want3d = () => {
    if (j3state !== 'none') return;
    j3state = 'loading';
    import('./journey3d.js').then(m => { J3 = m.createJourney3D(cv.parentNode, cv, CHROME.stage ? CHROME.stage() : null); j3state = J3 ? 'ready' : 'off'; if (J3) cv.classList.add('over3d'); }).catch(() => { j3state = 'off'; });
  };
  function renderLine3(tm, b) {
    const near = Math.round(Z), dist = Math.abs(Z - near);
    if (!fly && !drag && dist < 0.02) { if (stay.i !== near) { stay = { i: near, t: tm }; paused = false; } else if (paused) stay.t += tm - lastTm; } else if (dist > 0.05 || fly) stay.i = -1;
    lastTm = tm;
    const run = stay.i === near ? (reduced() ? -1 : tm - stay.t) : null;
    J3.canvas.style.display = '';
    const r3 = J3.render({ ids: IDS, Z, near, dist, run, tm, W, H, dpr, box: b, col });
    setParts3(id => (id === IDS[near] ? J3.parts(id, b, W, H) : null));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W * dpr, H * dpr);
    const k = b.B / 1000, left = b.cx - b.B / 2, top = b.cy - b.B / 2, below = (H - inset.b - (top + b.B)) / k;
    ctx.save(); ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * left, dpr * top); ctx.beginPath(); ctx.rect(-left / k, 0, W / k, 1000 + (b.below ? below : 0)); ctx.clip();
    Object.assign(G, { s: k, k: 1, primary: true, t: tm, col, id: IDS[near], base: 1, box: b.B });
    jhits = drawJourney(G, { ids: IDS, Z, near, dist, run, paused, names, below: b.below ? below : 0, three: true, lens: r3 && r3.lens, lensMode: r3 && r3.mode }); jbox = { k, left, top, near };
    lensBox = r3 && r3.lens && r3.lens.alpha > 0.2 ? r3.lens.rect : null;
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const y = top + 12, gap = Math.min(18, (b.B - 40) / N);
    for (let i = 0; i < (CHROME.dots ? N : 0); i++) { const x = b.cx + (i - (N - 1) / 2) * gap; ctx.globalAlpha = i === near ? 1 : 0.5; ctx.fillStyle = i === near ? col.warm : col.line; ctx.beginPath(); ctx.arc(x, y, i === near ? 4 : 2.5, 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 0.3; ctx.fillStyle = col.bg; const L = b.cx - b.B / 2, Rr = b.cx + b.B / 2;
    ctx.fillRect(0, 0, L, H); ctx.fillRect(Rr, 0, W - Rr, H); ctx.globalAlpha = 1;
    return { pi: near, ptr: { tx: left, ty: top, s: k } };
  }
  function renderLine(tm, b) {
    if (!flat()) { want3d(); if (J3) return renderLine3(tm, b); } else if (J3) { J3.canvas.style.display = 'none'; setParts3(null); lensBox = null; }
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
    if (flat()) { drawDesignBand(G, { id: IDS[near], below: b.below ? below : 0 }); jhits = null; } else jhits = drawJourney(G, { ids: IDS, Z, near, dist, run, paused, names, below: b.below ? below : 0 }); jbox = { k, left, top, near };
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* where you are on the line: a mark per station */
    const y = top + 12, gap = Math.min(18, (b.B - 40) / N);
    for (let i = 0; i < (CHROME.dots ? N : 0); i++) { const x = b.cx + (i - (N - 1) / 2) * gap; ctx.globalAlpha = i === near ? 1 : 0.5; ctx.fillStyle = i === near ? col.warm : col.line; ctx.beginPath(); ctx.arc(x, y, i === near ? 4 : 2.5, 0, 6.2832); ctx.fill(); }
    /* everything outside the box fades back */
    ctx.globalAlpha = 0.45; ctx.fillStyle = col.bg;
    const L = b.cx - b.B / 2, Rr = b.cx + b.B / 2;
    ctx.fillRect(0, 0, L, H); ctx.fillRect(Rr, 0, W - Rr, H);
    ctx.globalAlpha = 0.5; ctx.strokeStyle = col.line; ctx.lineWidth = 1; const ptr = pi === F.i ? F.cur : F.next; ctx.strokeRect(ptr.tx, ptr.ty, b.B, b.B);
    ctx.globalAlpha = 1;
    return { F, pi, ptr };
  }

  /* the world around the line (map.js): it opens over the line, zooming out from where your station is;
     once open, the line is not drawn under it */
  let mapO = null, mapLast = null, mapK = 0, mapT = 0, mapHits = null, mapBox = null;
  function renderMap(tm, b, dt, full) {
    if (full) { if (J3) J3.canvas.style.display = 'none'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = col.bg; ctx.fillRect(0, 0, W * dpr, H * dpr); }
    const k = b.B / 1000, left = b.cx - b.B / 2, top = b.cy - b.B / 2, below = (H - inset.b - (top + b.B)) / k;
    ctx.save(); ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * left, dpr * top); ctx.beginPath(); ctx.rect(-left / k, -top / k, W / k, H / k); ctx.clip();
    Object.assign(G, { s: k, k: 1, primary: true, t: tm, col, base: 1, box: b.B });
    mapHits = drawMap(G, Object.assign({}, mapLast, { k: mapK, dt, below: b.below ? below : 0 })); mapBox = { k, left, top };
    ctx.restore();
  }
  const mapTap = e => {
    if (!mapHits || !mapBox) return;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left - mapBox.left) / mapBox.k, y = (e.clientY - r.top - mapBox.top) / mapBox.k, near = (p, R) => Math.hypot(p.x - x, p.y - y) <= R;
    const st = mapHits.steps.find(p => near(p, 22)); if (st) { on.mapStep && on.mapStep(st.i); return; }
    let best = null; mapHits.sites.forEach(p => { const d = Math.hypot(p.x - x, p.y - y); if (d < 26 && (!best || d < best.d)) best = { id: p.id, d }; });
    if (best) on.site && on.site(best.id);
  };
  function render(now) {
    const tm = reduced() ? 3 : Math.max(0, (now - t0) / 1000), b = box();
    if (J3 && !isLine()) { J3.canvas.style.display = 'none'; setParts3(null); lensBox = null; }
    if (isLine()) {
      const dt = Math.min(0.1, Math.max(0, tm - mapT)); mapT = tm;
      mapK = mapO ? (reduced() ? 1 : Math.min(1, mapK + dt / 0.8)) : (reduced() ? 0 : Math.max(0, mapK - dt / 0.5));
      if (mapK >= 1) { renderMap(tm, b, dt, true); return; }
      const L = renderLine(tm, b); overlays(tm, L.pi, L.ptr);
      /* in the studio, the notes pinned to the station's picture */
      dive = null;
      if (worldOf(WORLD).flat && !fly && !drag && Math.abs(Z - Math.round(Z)) < 0.04 && L.pi === Math.round(Z) && L.ptr) drawNotes(L.ptr, b);
      if (mapK > 0 && mapLast) renderMap(tm, b, dt, false);
      return;
    }
    mapK = 0;
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
    /* standing at a depth: the way down, marked where it is, and the notes pinned to parts */
    dive = null;
    const settled = !fly && !drag && Math.abs(Z - Math.round(Z)) < 0.04 && pi === F.i;
    if (settled && F.next && !worldOf(WORLD).flat && CHROME.dive) diveMark(tm, F, b);
    if (settled) drawNotes(F.cur, b);
  }
  /* "Dive into" the next depth: its square, outlined where it sits in this scene, with its name */
  function diveMark(tm, F, b) {
    const x = F.next.tx, y = F.next.ty, w = F.next.s * 1000, name = t('ui.diveInto', { depth: t('depth.' + IDS[F.i + 1] + '.name') });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pulse = reduced() ? 0 : (Math.sin(tm * 2.4) + 1) / 2;
    ctx.save(); ctx.strokeStyle = col.cool; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -tm * 12;
    const g = 4 + pulse * 3; ctx.globalAlpha = 0.9; ctx.strokeRect(x - g, y - g, w + 2 * g, w + 2 * g); ctx.restore();
    ctx.font = '600 12px ' + SANS;
    const tw = Math.min(ctx.measureText(name).width, 240), pw = tw + 30, ph = 24;
    const top = b.cy - b.B / 2, below = y + w + g + 8 + ph < top + b.B - 4;
    let px = Math.max(b.cx - b.B / 2 + 4, Math.min(b.cx + b.B / 2 - pw - 4, x + w / 2 - pw / 2)), py = below ? y + w + g + 8 : y - g - 8 - ph;
    ctx.globalAlpha = 0.95; ctx.fillStyle = col.cool; rrect(px, py, pw, ph, 12); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = col.bg; ctx.textBaseline = 'middle';
    ctx.fillText('▾', px + 10, py + ph / 2 + 1); ctx.save(); ctx.beginPath(); ctx.rect(px + 22, py, tw, ph); ctx.clip(); ctx.fillText(name, px + 22, py + ph / 2 + 1); ctx.restore();
    ctx.textBaseline = 'alphabetic';
    dive = { rects: [[x - g, y - g, w + 2 * g, w + 2 * g], [px, py, pw, ph]], to: F.i + 1 };
  }
  const rrect = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  /* Notes pinned to parts: a short box of words in the corner of the picture farthest from the part, joined
     to it by a line. A note: { part, title, text, tone } (tone: a colour name of the palette). */
  function drawNotes(ptr, b) {
    if (!notes.length) return;
    const P = partsOf(IDS[Math.round(Z)]), L = Math.max(b.cx - b.B / 2, 0), T = Math.max(b.cy - b.B / 2, 0), R = Math.min(b.cx + b.B / 2, W), B2 = Math.min(b.cy + b.B / 2, H);
    const used = [];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    notes.forEach(n => {
      const sh = n.part && P[n.part] && P[n.part][0]; if (!sh) return;
      const o = outline(sh), cx0 = o.reduce((a, p) => a + p[0], 0) / o.length, cy0 = o.reduce((a, p) => a + p[1], 0) / o.length;
      const px = ptr.tx + cx0 * ptr.s, py = ptr.ty + cy0 * ptr.s;
      const maxW = Math.max(150, Math.min(270, (R - L) * 0.46)), pad = 10;
      ctx.font = '600 11px ' + MONO; const tl = n.title ? wrap(ctx, n.title, maxW - 2 * pad) : [];
      ctx.font = '13px ' + SANS; let bl = wrap(ctx, n.text, maxW - 2 * pad); if (bl.length > 9) { bl = bl.slice(0, 9); bl[8] = bl[8].replace(/\s*\S*$/, '') + ' …'; }
      const w = maxW, h = pad * 2 + tl.length * 15 + bl.length * 17 + (tl.length && bl.length ? 4 : 0);
      /* the free corner farthest from the part */
      const corners = [[L + 10, T + 10], [R - w - 10, T + 10], [L + 10, B2 - h - 10], [R - w - 10, B2 - h - 10]].filter(c => !used.some(u => Math.abs(u[0] - c[0]) < w && Math.abs(u[1] - c[1]) < h));
      if (!corners.length) return;
      const c = corners.sort((a, z) => Math.hypot(z[0] + w / 2 - px, z[1] + h / 2 - py) - Math.hypot(a[0] + w / 2 - px, a[1] + h / 2 - py))[0];
      used.push(c);
      const tone = col[n.tone] || col.warm, ex = Math.max(c[0], Math.min(c[0] + w, px)), ey = Math.max(c[1], Math.min(c[1] + h, py));
      ctx.globalAlpha = 0.85; ctx.strokeStyle = tone; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(px, py); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = tone; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 0.94; ctx.fillStyle = col.bg; rrect(c[0], c[1], w, h, 8); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = tone; ctx.lineWidth = 1; ctx.stroke();
      let y = c[1] + pad + 11; ctx.fillStyle = tone; ctx.font = '600 11px ' + MONO;
      tl.forEach(line => { ctx.fillText(line, c[0] + pad, y); y += 15; }); if (tl.length) y += 4;
      ctx.fillStyle = col.hi; ctx.font = '13px ' + SANS; bl.forEach(line => { ctx.fillText(line, c[0] + pad, y + 2); y += 17; });
    });
    ctx.globalAlpha = 1;
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
        /* not on the lens: beside it */
        if (lensBox && isLine() && c0[0] > lensBox.x - 16 && c0[0] < lensBox.x + lensBox.w + 16 && c0[1] > lensBox.y - 16 && c0[1] < lensBox.y + lensBox.h + 16) x = ptr.tx + (lensBox.x - 22) * ptr.s;
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
  cv.addEventListener('wheel', e => { e.preventDefault(); if (isLine() && mapO) return; const d = isLine() && Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; setZ(Z + d * (e.deltaMode ? 0.03 : 0.0016)); if (isLine()) settleLine(); }, { passive: false });
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { y: e.clientY, x: e.clientX, z: Z, moved: false, map: isLine() && !!mapO }; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* no capture */ } });
  cv.addEventListener('pointermove', e => {
    if (drag) {
      if (Math.abs(e.clientY - drag.y) + Math.abs(e.clientX - drag.x) > 6) drag.moved = true;
      if (drag.moved && !drag.map) setZ(isLine() ? drag.z + (drag.x - e.clientX) / (box().B * 1.06) : drag.z + (drag.y - e.clientY) * 0.0062);
      return;
    }
    const h = hitAt(e), id = h ? h.id : null, dv = !id && onDive(e), pt = id || dv ? null : partAt(e);
    hot = id; hotPart = pt ? pt.key : null;
    cv.style.cursor = id || dv || pt ? 'pointer' : '';
  });
  cv.addEventListener('pointerleave', () => { hot = null; hotPart = null; cv.style.cursor = ''; });
  /* on the line, the steps under the picture: tap one to watch it again, or pause */
  const stepTap = e => {
    if (!isLine() || !jhits || !jbox) return false;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left - jbox.left) / jbox.k, y = (e.clientY - r.top - jbox.top) / jbox.k, inn = h => h && x >= h.x - 4 && x <= h.x + h.w + 4 && y >= h.y - 6 && y <= h.y + h.h + 6;
    if (inn(jhits.pause)) { paused = !paused; return true; }
    if (inn(jhits.names)) { names = !names; return true; }
    if (inn(jhits.map)) { on.map && on.map(); return true; }
    /* the lens: tap it to dive down into what it shows */
    if (inn(jhits.lens)) { on.lens && on.lens(jbox.near); return true; }
    const ch = jhits.chips.find(inn); if (!ch) return false;
    stay = { i: jbox.near, t: lastTm - stepStart(IDS[jbox.near], ch.i) }; paused = false; return true;
  };
  const onDive = e => { if (!dive) return false; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; return dive.rects.some(q => x >= q[0] && x <= q[0] + q[2] && y >= q[1] && y <= q[1] + q[3]); };
  const diveTap = e => { if (!onDive(e)) return false; api.flyTo(dive.to); return true; };
  const end = e => { if (!drag) return; const tap = !drag.moved, onMap = drag.map; drag = null; if (onMap) { if (tap && e.type === 'pointerup') mapTap(e); return; } if (tap && e.type === 'pointerup' && stepTap(e)) return; if (tap && e.type === 'pointerup' && diveTap(e)) return; if (tap && e.type === 'pointerup') { const h = hitAt(e); if (h) on.pick && on.pick(h.id); else { const pt = partAt(e); if (pt && view) { hotPart = pt.key; on.part && on.part(view.pi, pt.key); } } } if (!tap && isLine()) settleLine(); };
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
    /* the map: o (see map.js) to open or update it, null to close it */
    setMap(o) { mapO = o; if (o) mapLast = o; },
    get mapOpen() { return !!mapO; },
    setAnchor(p) { anchor = p; },
    /* words pinned to parts of the depth you stand in: [{ part, title, text, tone }] */
    setNotes(list) { notes = Array.isArray(list) ? list : []; },
    setInset(i) { inset = i; },
    retheme() { col = palette(); },
    stop() { running = false; },
    /* start again after stop (the redesign hides and shows this view) */
    start() { if (!running) { running = true; requestAnimationFrame(tick); } }
  };
  requestAnimationFrame(tick);
  return api;
}
export { N, IDS, DEPTHS };
