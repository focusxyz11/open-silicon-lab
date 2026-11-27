/* The pictures on the plates. Each is drawn in the plate's own plan, 900 across by 200 deep (the front edge is y = 0),
   through a pen that projects plan and height onto the screen, so flat parts lie on the plate and upright parts stand
   on it. The left 170 are kept clear for the rung's name. No words here: notes are placed by the page from STR. */
import { A, SW, UNITS, clamp } from './model.js';

const H = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;
export function makePen(ctx, proj, cam, px, py, z, gap = 9) {
  const k = cam.s / 100, sq = 0.35 + 0.65 * cam.cosT, tan = cam.cosT / Math.max(0.05, cam.sinT);
  const q = (lx, ly, h = 0) => proj(px + lx / 100, py + ly / 100, z + h / 100);
  const P = { ctx, q, k, lo: cam.s < 70,
    M(lx, ly, h) { const a = q(lx, ly, h); ctx.moveTo(a[0], a[1]); }, L(lx, ly, h) { const a = q(lx, ly, h); ctx.lineTo(a[0], a[1]); },
    seg(x1, y1, x2, y2, h1 = 0, h2 = h1) { P.M(x1, y1, h1); P.L(x2, y2, h2); },
    quad(lx, ly, w, d, h = 0) { P.M(lx, ly, h); P.L(lx + w, ly, h); P.L(lx + w, ly + d, h); P.L(lx, ly + d, h); ctx.closePath(); },
    wall(x1, x2, ly, h0, h1) { P.M(x1, ly, h0); P.L(x1, ly, h1); P.L(x2, ly, h1); P.L(x2, ly, h0); ctx.closePath(); },
    dot(lx, ly, r, h = 0, round = false) { const a = q(lx, ly, h), rx = Math.max(0.7, r * k); ctx.moveTo(a[0] + rx, a[1]); ctx.ellipse(a[0], a[1], rx, round ? rx : Math.max(0.6, rx * sq), 0, 0, TAU); },
    begin() { ctx.beginPath(); }, stroke(c, w = 1, dash) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.setLineDash(dash || P.dash); ctx.stroke(); ctx.setLineDash([]); },
    fill(c) { ctx.fillStyle = c; ctx.fill(); }, dash: [],
    /* how much of a part `want` tall, standing `ly` back from the front edge, clears the plate above: 1 when it all does */
    fit(ly, want) { return clamp(((gap - ly / 100 * tan) * 100 - 8) / want, 0.12, 1); } };
  return P;
}

const X0 = 180, X1 = 880;
function lattice(p, C, a, form, n = 40) {
  p.begin();
  if (form === 'tube') { for (let j = 0; j < 5; j++) p.seg(X0, 30 + j * 35, 740, 30 + j * 35); p.stroke(C.mut(0.7 * a), 1.4); return; }
  const nx = p.lo ? n >> 1 : n;
  for (let j = 0; j < 6; j++) for (let i = 0; i < nx; i++) p.dot(X0 + 8 + (i + (form === 'sheet' && j % 2 ? 0.5 : 0)) * 560 / nx, 25 + j * 30, 2.3);
  p.fill(C.mut(0.5 * a));
}
export const PIC = {
  matter(p, C, R, F, g, tm, a) {
    const c = g.carrier;
    if (c === 'light') {
      p.begin(); for (let j = 0; j < 5; j++) { p.seg(X0, 30 + j * 35, X1, 30 + j * 35); p.seg(X0, 38 + j * 35, X1, 38 + j * 35); } p.stroke(C.mut(0.55 * a), 1);
      p.begin(); for (let j = 0; j < 5; j++) { const x = X0 + ((tm * 90 + H(j) * 700) % 640); const kf = p.fit(34 + j * 35, 26); for (let u = 0; u <= 60; u += 3) { const e = Math.sin(u / 60 * Math.PI), h = (8 + e * 16 * Math.sin(u * 0.5 - tm * 6)) * kf; u ? p.L(x + u, 34 + j * 35, h) : p.M(x + u, 34 + j * 35, h); } } p.stroke(C.acc(a), 1.5, []);
      return;
    }
    if (c === 'living') {
      p.begin(); for (let i = 0; i < 16; i++) { const x = X0 + 30 + H(i) * 640, y = 30 + H(i + 40) * 140, r = 13 + H(i + 9) * 9; p.dot(x, y, r); const j = (i + 3) % 16; p.seg(x, y, X0 + 30 + H(j) * 640, 30 + H(j + 40) * 140); } p.stroke(C.ink(0.5 * a), 1);
      p.begin(); for (let i = 0; i < 16; i++) if ((Math.floor(tm * 1.5 + H(i) * 9)) % 5 === 0) p.dot(X0 + 30 + H(i) * 640, 30 + H(i + 40) * 140, 6); p.fill(C.acc(0.9 * a));
      return;
    }
    const M = R.M || { form: 'bulk', me: 1400, mh: 450, eg: 1.12 };
    lattice(p, C, a, M.form);
    const ne = Math.round(4 + 3 * Math.log10(M.me)), sp = 18 + Math.log10(M.me) * 22;
    p.begin();
    for (let i = 0; i < ne; i++) { const y = 40 + H(i + 50) * 120, x = c === 'reversible' ? X0 + 60 + H(i) * 440 + Math.sin(tm * 1.6 + i) * 46 : X0 + ((H(i) * 560 + tm * sp) % 560); if (c === 'spikes' && (Math.floor(tm * 2 + H(i) * 7) % 4)) continue; p.dot(x, y, 4.2); }
    p.fill(C.acc(a));
    if (c !== 'charge') return;
    if (M.mh) { p.begin(); for (let i = 0; i < Math.round(3 + 2 * Math.log10(M.mh)); i++) p.dot(X0 + 560 - ((H(i + 99) * 560 + tm * sp * 0.4) % 560), 40 + H(i + 150) * 120, 4); p.stroke(C.ink(0.7 * a), 1.2, []); }
    /* the gap, standing at the back: the band the electrons must cross */
    const kf = p.fit(24, 110), gh = (4 + M.eg * 24) * kf, b0 = 14 * kf, bad = M.eg < 0.3;
    p.begin(); p.wall(770, 880, 24, b0, b0 + gh); p.fill(bad ? C.bad(0.2) : C.acc(0.12));
    p.begin(); p.seg(770, 24, 880, 24, b0 + gh); p.stroke(bad ? C.bad(1) : C.acc(a), 1.8, []);
    p.begin(); p.seg(770, 24, 880, 24, b0); p.stroke(C.ink(0.8 * a), 1.8, []);
    p.begin(); p.wall(770, 880, 24, 0, b0); p.fill(C.ink(0.14));
    p.begin(); p.dot(790 + ((tm * 14) % 70), 24, 3.4, b0 + gh + 6 * kf, true); p.fill(bad ? C.bad(1) : C.acc(1));
  },
  switch(p, C, R, F, g, tm, a) {
    const c = g.carrier, ctx = p.ctx;
    if (c === 'charge') {
      const sw = R.sw, sh = R.spec.shape, V = R.V, n = 12, kf = p.fit(140, 46);
      for (let i = 0; i < n; i++) {
        const x = 200 + i * 35, vti = sw.vt + (H(i + 3) - 0.5) * 6 * sw.sigma / 1000, dead = !sw.clean || V < vti + 0.02, on = !dead && ((tm * 1.4 - i * 0.22) % 3 + 3) % 3 < 1;
        p.begin();
        if (sh === 'fin') { p.M(x, 60, 0); p.L(x, 140, 0); p.L(x, 140, 30 * kf); p.L(x, 60, 30 * kf); ctx.closePath(); }
        else if (sh === 'planar') p.quad(x - 8, 60, 16, 80);
        else if (sh === 'gaa') for (const h of [10, 22, 34]) p.seg(x, 60, x, 140, h * kf);
        else p.seg(x, 60, x, 140, 6 * kf);
        p.stroke(C.ink(0.6 * a), 1.1);
        p.begin();
        const gh = (sh === 'planar' ? 9 : sh === 'sheet' ? 12 : 42) * kf;
        p.M(x - 10, 100, 0); p.L(x - 10, 100, gh); p.L(x + 10, 100, gh); p.L(x + 10, 100, 0); if (sh === 'gaa' || sh === 'sheet') ctx.closePath();
        p.stroke(dead ? C.bad(1) : on ? C.acc(1) : C.acc(0.45 * a), on || dead ? 2 : 1.3, []);
      }
      /* its switching curve, standing on the plate: the engine's own current against the gate's voltage */
      const HC = 138 * p.fit(22, 138), xv = v => 650 + v * 220, hl = l => clamp((l + 12) / 10, 0, 1) * HC, ly = 22;
      if (sw.clean) { p.begin(); p.wall(xv(0), xv(Math.min(1, sw.vmin)), ly, 0, HC); p.fill(C.bad(0.13)); }
      p.begin(); p.M(xv(0), ly, HC); p.L(xv(0), ly, 0); p.L(xv(1), ly, 0); p.stroke(C.mut(0.8), 1, []);
      const curve = (r, col, w, dash) => { p.begin(); for (let i = 0; i <= 50; i++) { const v = i / 50, h = hl(SW.current(r, v)); i ? p.L(xv(v), ly, h) : p.M(xv(v), ly, h); } p.stroke(col, w, dash); };
      curve(SW.SILICON, C.mut(0.9), 1.2, [4, 3]);
      curve(sw, sw.clean ? C.acc(1) : C.bad(1), 2.2, []);
      p.begin(); p.seg(xv(V), ly, xv(V), ly, 0, HC); p.stroke(sw.clean && V >= sw.vmin ? C.ink(0.9) : C.bad(1), 1.4, []);
      return;
    }
    if (c === 'light') {
      p.begin(); p.seg(X0 + 10, 55, X1, 55); p.seg(X0 + 10, 62, X1, 62); p.stroke(C.mut(0.7 * a), 1);
      const px = X0 + 10 + ((tm * 150) % 690);
      for (let i = 0; i < 7; i++) { const x = 250 + i * 92, hit = Math.abs(px - x) < 46; p.begin(); p.dot(x, 112, 34); p.dot(x, 112, 27); p.stroke(hit ? C.acc(1) : C.ink(0.5 * a), hit ? 1.8 : 1); }
      p.begin(); p.dot(px, 58, 6); p.fill(C.acc(1)); return;
    }
    if (c === 'spikes') {
      p.begin(); p.dot(250, 100, 30); p.seg(X0 + 5, 60, 226, 90); p.seg(X0 + 5, 100, 220, 100); p.seg(X0 + 5, 140, 226, 110); p.stroke(C.ink(0.6 * a), 1.2);
      const kf = p.fit(30, 124);
      p.begin(); p.seg(330, 30, X1, 30, 62 * kf); p.stroke(C.mut(0.7), 1, [4, 3]);
      p.begin(); for (let x = 330; x <= X1; x += 5) { const ph = ((x / 150 - tm * 0.55) % 1 + 1) % 1, h = (ph > 0.95 ? 120 : ph * 62) * kf; x === 330 ? p.M(x, 30, h) : p.L(x, 30, h); } p.stroke(C.acc(a), 1.8, []);
      p.begin(); p.seg(330, 30, X1, 30, 0); p.stroke(C.mut(0.6), 1, []); return;
    }
    if (c === 'reversible') {
      const tr = u => { const v = ((u % 230) + 230) % 230; return v < 60 ? v / 60 : v < 115 ? 1 : v < 175 ? 1 - (v - 115) / 60 : 0; };
      const HR = 78 * p.fit(40, 84);
      p.begin(); for (let x = X0 + 10; x <= X1; x += 5) { const h = tr(x - tm * 40) * HR; x === X0 + 10 ? p.M(x, 40, h) : p.L(x, 40, h); } p.stroke(C.ink(0.7 * a), 1.4);
      p.begin(); p.seg(X0 + 10, 40, X1, 40, 0); p.stroke(C.mut(0.6), 1, []);
      p.begin(); for (let i = 0; i < 3; i++) { const x = X0 + 85 + i * 230 + ((tm * 40) % 230); if (x < X1) p.dot(x, 40, 5, tr(x - tm * 40) * HR, true); } p.fill(C.acc(1)); return;
    }
    /* living: one neuron */
    p.begin(); p.dot(300, 100, 28);
    for (let i = 0; i < 6; i++) { const ang = 2.0 + i * 0.45, x1 = 300 + Math.cos(ang) * 28, y1 = 100 + Math.sin(ang) * 28, x2 = 300 + Math.cos(ang) * 95, y2 = clamp(100 + Math.sin(ang) * 85, 12, 188); p.seg(x1, y1, x2, y2); p.seg(x2, y2, x2 - 26, clamp(y2 + (i % 2 ? 22 : -22), 8, 192)); }
    p.M(328, 100, 0); for (let x = 340; x <= X1; x += 12) p.L(x, 100 + Math.sin(x / 38) * 9, 0);
    p.stroke(C.ink(0.65 * a), 1.3);
    const px = 330 + ((tm * 120) % 550); p.begin(); p.dot(px, 100 + Math.sin(px / 38) * 9, 6); p.fill(C.acc(1));
  },
  gate(p, C, R, F, g, tm, a) {
    const c = g.carrier;
    if (c === 'charge' || c === 'reversible') {
      const cols = p.lo ? 36 : 60, rows = 6, n = cols * rows, w = 690 / cols, P = c === 'charge' ? 1 - Math.exp(-R.gate.p * 1e9 / n) : 0, bad = [];
      p.begin(); for (let i = 0; i < n; i++) { const cx = i % cols, r = (i / cols) | 0; if (H(i + 7) < P) { bad.push(i); continue; } p.quad(X0 + 5 + cx * w, 22 + r * 27, w * 0.7, 18); }
      if (c === 'charge') p.fill(C.acc(0.26 * a)); else p.stroke(C.acc(0.6 * a), 1);
      if (c === 'reversible') { p.begin(); for (let i = 0; i < n; i++) { const cx = i % cols, r = (i / cols) | 0; p.seg(X0 + 5 + cx * w, 31 + r * 27, X0 + 5 + cx * w + w * 0.7, 31 + r * 27); } p.stroke(C.acc(0.35 * a), 1); }
      p.begin(); for (const i of bad) p.quad(X0 + 5 + (i % cols) * w, 22 + ((i / cols) | 0) * 27, w * 0.7, 18); p.fill(C.bad(0.95));
      return;
    }
    if (c === 'light') {
      p.begin(); const n = 14, dx = 690 / n;
      for (let j = 0; j < 4; j++) for (let i = 0; i < n; i++) { const x = X0 + 5 + i * dx, y = 30 + j * 46, up = (i + j) % 2; p.seg(x, y + (up ? 0 : 23), x + dx, y + (up ? 23 : 0)); }
      p.stroke(C.ink(0.5 * a), 1);
      p.begin(); for (let j = 0; j < 4; j++) for (let i = 1; i < n; i += 2) p.dot(X0 + 5 + i * dx, 30 + j * 46 + ((i + j) % 2 ? 23 : 0), 3 + 2 * H(i * 7 + j)); p.fill(C.acc(0.85 * a));
      const k = Math.floor(tm * 5) % n; p.begin(); for (let j = 0; j < 4; j++) p.dot(X0 + 5 + k * dx + dx / 2, 41 + j * 46, 4.5); p.fill(C.acc(1)); return;
    }
    if (c === 'spikes') {
      p.begin(); for (let i = 0; i < 24; i++) p.seg(X0 + 10 + i * 29, 16, X0 + 10 + i * 29, 184); for (let j = 0; j < 6; j++) p.seg(X0 + 5, 28 + j * 29, X1, 28 + j * 29); p.stroke(C.mut(0.45 * a), 1);
      p.begin(); for (let i = 0; i < 24; i++) for (let j = 0; j < 6; j++) p.dot(X0 + 10 + i * 29, 28 + j * 29, 1.2 + 4.2 * H(i * 6 + j)); p.fill(C.ink(0.7 * a));
      const k = Math.floor(tm * 3) % 6, col = Math.floor(H(Math.floor(tm * 3)) * 24); p.begin(); p.seg(X0 + 5, 28 + k * 29, X1, 28 + k * 29); p.seg(X0 + 10 + col * 29, 16, X0 + 10 + col * 29, 184); p.stroke(C.acc(0.9), 1.6, []); return;
    }
    const N = 44, pos = i => [X0 + 20 + H(i) * 660, 22 + H(i + 60) * 156];
    p.begin(); for (let i = 0; i < N; i++) { const [x, y] = pos(i); for (const j of [(i + 1) % N, (i + 9) % N]) { const [x2, y2] = pos(j); if (Math.abs(x2 - x) < 220) p.seg(x, y, x2, y2); } } p.stroke(C.ink(0.3 * a), 1);
    p.begin(); for (let i = 0; i < N; i++) { const [x, y] = pos(i); p.dot(x, y, 5); } p.fill(C.ink(0.7 * a));
    p.begin(); for (let i = 0; i < N; i++) if (Math.floor(tm * 2 + H(i) * 11) % 6 === 0) { const [x, y] = pos(i); p.dot(x, y, 7); } p.fill(C.acc(1));
  },
  sums(p, C, R, F, g, tm, a) {
    const rows = F.vote ? 3 : 1, xs = i => 186 + i * 21.6, dur = clamp(R.sums.aluD / 300, 0.6, 6);
    for (let k = 0; k < rows; k++) {
      const y = rows === 1 ? 62 : 26 + k * 54, d = rows === 1 ? 70 : 38;
      p.begin(); for (let i = 0; i < 32; i++) p.quad(xs(i), y, 16, d, 7); p.fill(C.acc(0.16 * a)); p.stroke(C.acc(0.6 * a), 1);
      p.begin(); for (let i = 0; i < 32; i++) { p.seg(xs(i), y, xs(i), y, 0, 7); p.seg(xs(i) + 16, y, xs(i) + 16, y, 0, 7); } p.stroke(C.acc(0.35 * a), 1);
    }
    if (R.sums.Pw > 1e-4) { const i = Math.floor(H(3) * 32); p.begin(); p.quad(xs(i), rows === 1 ? 62 : 26, 16, rows === 1 ? 70 : 38, 7); p.fill(C.bad(0.95)); }
    if (F.adder === 'ripple') {
      p.begin(); p.seg(xs(0), 40, xs(31) + 16, 40, 7); p.stroke(C.mut(0.6), 1, []);
      const ph = (tm / dur) % 1, i = Math.floor((1 - ph) * 32); p.begin(); p.dot(xs(i) + 8, 40, 5.5, 7); p.fill(C.acc(1));
      p.begin(); p.quad(xs(clamp(i, 0, 31)), rows === 1 ? 62 : 26, 16, rows === 1 ? 70 : 38, 7); p.fill(C.acc(0.5));
    } else {
      const kf = p.fit(34, 104); p.begin(); for (let L = 1; L <= 5; L++) { const st = 2 ** L, h0 = (7 + (L - 1) * 19) * kf, h1 = (7 + L * 19) * kf; for (let i = st - 1; i < 32; i += st) { p.seg(xs(i - st / 2) + 8, 34, xs(i) + 8, 34, h0, h1); p.seg(xs(i) + 8, 34, xs(i) + 8, 34, h0, h1); } } p.stroke(C.acc(0.85 * a), 1.1);
    }
    if (F.vote) { p.begin(); p.seg(xs(31) + 30, 45, xs(31) + 30, 153, 7); p.quad(xs(31) + 22, 86, 16, 26, 7); p.stroke(C.ink(0.8 * a), 1.3); }
  },
  memory(p, C, R, F, g, tm, a) {
    const w = g.where, ctx = p.ctx;
    if (w === 'in') {
      p.begin(); for (let i = 0; i < 30; i++) p.seg(X0 + 10 + i * 23.5, 16, X0 + 10 + i * 23.5, 184); p.stroke(C.mut(0.5 * a), 1);
      p.begin(); for (let j = 0; j < 7; j++) p.seg(X0 + 5, 24 + j * 25, X1, 24 + j * 25); p.stroke(C.ink(0.45 * a), 1);
      p.begin(); for (let i = 0; i < 30; i++) for (let j = 0; j < 7; j++) p.dot(X0 + 10 + i * 23.5, 24 + j * 25, 1 + 3 * H(i * 7 + j)); p.fill(C.ink(0.7 * a));
      const k = Math.floor(tm * 6) % 30; p.begin(); p.seg(X0 + 10 + k * 23.5, 16, X0 + 10 + k * 23.5, 184); p.stroke(C.acc(1), 2, []); p.begin(); p.dot(X0 + 10 + k * 23.5, 190, 5); p.fill(C.acc(1)); return;
    }
    if (w === 'flow') {
      p.begin(); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const x = X0 + 15 + i * 116, y = 22 + j * 58; p.quad(x, y, 74, 34); if (i < 5) p.seg(x + 74, y + 17, x + 116, y + 17); if (j < 2 && i % 2) p.seg(x + 37, y + 34, x + 37, y + 58); } p.stroke(C.ink(0.55 * a), 1.1);
      p.begin(); for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) p.dot(X0 + 89 + i * 116 + ((tm * 40 + j * 13) % 42), 39 + j * 58, 4); p.fill(C.acc(1)); return;
    }
    const RG = F.regs, d = 160 / RG;
    for (let r = 0; r < RG; r++) { p.begin(); p.quad(X0 + 8, 20 + r * d, 288, Math.max(1.5, d - (RG > 16 ? 1.4 : 3))); p.fill(C.acc((0.12 + 0.3 * H(r + 5)) * a)); }
    p.begin(); for (let cl = 0; cl <= 8; cl++) p.seg(X0 + 8 + cl * 36, 20, X0 + 8 + cl * 36, 180); p.stroke(C.acc(0.35 * a), 1);
    const bx = w === 'near' ? 500 : 760, lit = Math.floor(tm * 3) % 6;
    p.begin(); p.quad(bx, 30, 118, 140); for (let r = 1; r < 6; r++) p.seg(bx + 10, 30 + r * 23.3, bx + 108, 30 + r * 23.3); p.stroke(C.ink(0.6 * a), 1.2);
    p.begin(); p.seg(bx + 10, 30 + (lit + 0.5) * 23.3, bx + 108, 30 + (lit + 0.5) * 23.3); p.stroke(C.acc(0.9), 2, []);
    ctx.lineDashOffset = -tm * 26; p.begin(); p.seg(476, 100, bx, 100); p.stroke(R.memory.wireShare > 0.2 ? C.bad(0.9) : C.ink(0.7), 1.5, w === 'near' ? [3, 3] : [9, 7]); ctx.lineDashOffset = 0;
  },
  core(p, C, R, F, g, tm, a) {
    const told = g.told, ctx = p.ctx;
    if (told === 'program') {
      const SG = R.core.SG, w = 600 / SG, pc = Math.floor(tm * 3) % 7;
      const kf = p.fit(26, 100);
      p.begin(); p.wall(188, 250, 26, 4 * kf, 96 * kf); p.fill(C.bg(0.7)); p.stroke(C.ink(0.5 * a), 1);
      p.begin(); for (let i = 0; i < 7; i++) if (i !== pc) p.seg(196, 26, 232 + 10 * H(i), 26, (86 - i * 12) * kf); p.stroke(C.mut(0.8 * a), 1.3);
      p.begin(); p.seg(196, 26, 242, 26, (86 - pc * 12) * kf); p.stroke(C.acc(1), 2, []);
      p.begin(); for (let i = 0; i < SG; i++) p.quad(280 + i * w + 5, 58, w - 10, 84); p.fill(C.acc(0.1 * a)); p.stroke(C.acc(0.6 * a), 1.1);
      const sp = clamp(R.core.period / 600, 0.5, 5);
      for (let k = 0; k < SG; k++) { const ph = ((tm / (sp * SG) + k / SG) % 1); p.begin(); p.dot(285 + ph * 590, 100, 6, 3); p.fill(R.core.q > 1e-6 && k === 0 ? C.bad(1) : C.acc(1)); }
      return;
    }
    if (told === 'graph') {
      const N = [[215, 100], [330, 48], [330, 152], [460, 36], [460, 100], [460, 164], [600, 68], [600, 136], [730, 100], [855, 100]], E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8], [8, 9]];
      p.begin(); for (const [i, j] of E) p.seg(N[i][0], N[i][1], N[j][0], N[j][1]); p.stroke(C.ink(0.5 * a), 1.1);
      p.begin(); for (const [x, y] of N) p.quad(x - 16, y - 13, 32, 26); p.fill(C.bg(1)); p.stroke(C.acc(0.7 * a), 1.2);
      p.begin(); E.forEach(([i, j], e) => { const ph = (tm * 0.7 + e * 0.37) % 1; p.dot(N[i][0] + (N[j][0] - N[i][0]) * ph, N[i][1] + (N[j][1] - N[i][1]) * ph, 4.5); }); p.fill(C.acc(1)); return;
    }
    if (told === 'events') {
      p.begin(); p.seg(X0 + 8, 40, X1, 40); p.stroke(C.mut(0.6), 1, []);
      const ev = [0, 1, 2, 3].map(i => X0 + 8 + (((H(i + 2) * 690 - tm * 60) % 690) + 690) % 690);
      p.begin(); for (const x of ev) p.seg(x, 40, x, 40, 0, 46 * p.fit(40, 50)); p.stroke(C.acc(1), 2, []);
      for (let i = 0; i < 8; i++) { const x = 200 + i * 84, hit = ev.some(e => Math.abs(e - x - 30) < 26); p.begin(); p.quad(x, 92, 60, 62); if (hit) p.fill(C.acc(0.55)); p.stroke(hit ? C.acc(1) : C.ink(0.35 * a), 1.1); }
      return;
    }
    if (told === 'learns') {
      const cols = p.lo ? 18 : 28; for (let j = 0; j < 5; j++) for (let i = 0; i < cols; i++) { p.begin(); p.quad(X0 + 8 + i * 690 / cols, 22 + j * 32, 690 / cols * 0.78, 24); p.fill(C.acc((0.08 + 0.5 * (0.5 + 0.5 * Math.sin(tm * 0.9 + H(i * 5 + j) * 6.283))) * a)); }
      return;
    }
    p.begin(); for (const x of [225, 395, 565, 735]) p.quad(x, 60, 104, 80); p.fill(C.ink(0.1 * a)); p.stroke(C.ink(0.7 * a), 1.3);
    p.begin(); p.M(X0 + 5, 100, 0); p.L(225, 100, 0); for (const x of [329, 499, 669]) p.seg(x, 100, x + 66, 100); p.seg(839, 100, X1, 100); p.stroke(C.ink(0.9 * a), 2.6, []);
    p.begin(); p.dot(X0 + 5 + ((tm * 190) % 695), 100, 6, 2); p.fill(C.acc(1));
  },
  machine(p, C, R, F, g, tm, a) {
    const sh = g.shape, w = g.where, n = UNITS[sh][clamp(F.ui, 0, 2)], far = w === 'far', A0 = X0 + 8, A1 = far ? 640 : X1, U = [], ctx = p.ctx;
    if (sh === 'few') { const uw = (A1 - A0) / n; for (let i = 0; i < n; i++) U.push([A0 + i * uw, 44, uw * 0.84, 112, 0]); }
    else if (sh === 'grid') { const cols = n === 16 ? 8 : n === 64 ? 16 : 32, rows = n / cols, uw = (A1 - A0) / cols, ud = 164 / rows; for (let i = 0; i < n; i++) U.push([A0 + (i % cols) * uw, 18 + ((i / cols) | 0) * ud, uw * 0.8, ud * 0.76, 0]); }
    else if (sh === 'stack') { const per = n / 4, uw = (A1 - A0) / per; for (let L = 0; L < 4; L++) for (let i = 0; i < per; i++) U.push([A0 + i * uw, 50, uw * 0.86, 100, L * 24 * p.fit(150, 78)]); }
    else { const m = Math.min(n, p.lo ? 70 : 150); for (let i = 0; i < m; i++) U.push([A0 + H(i) * (A1 - A0 - 14), 16 + H(i + 300) * 160, 11, 9, 0]); }
    if (sh === 'swarm') { p.begin(); for (let i = 0; i < U.length; i++) { const u = U[i], v = U[(i * 7 + 3) % U.length]; if (Math.abs(u[0] - v[0]) < 150) p.seg(u[0] + 5, u[1] + 4, v[0] + 5, v[1] + 4); } p.stroke(C.ink(0.2 * a), 1); }
    p.begin(); for (const u of U) p.quad(u[0], u[1], u[2], u[3], u[4]); p.fill(C.acc((sh === 'stack' ? 0.07 : 0.2) * a)); p.stroke(C.acc(0.7 * a), 1.1);
    if (w === 'in') { p.begin(); for (const u of U) { if (u[2] < 14) continue; for (let x = 6; x < u[2]; x += 9) p.seg(u[0] + x, u[1], u[0] + Math.max(0, x - u[3] * 0.4), u[1] + u[3], u[4]); } p.stroke(C.ink(0.5 * a), 1); }
    if (w === 'near') { p.begin(); for (const u of U) p.quad(u[0], u[1] + u[3], u[2], Math.max(3, u[3] * 0.12), u[4]); p.fill(C.ink(0.55 * a)); }
    if (w === 'flow') { p.begin(); for (let i = 0; i + 1 < U.length; i++) { const u = U[i], v = U[i + 1]; if (v[0] > u[0] && Math.abs(v[1] - u[1]) < 2 && v[4] === u[4]) { const ph = (tm * 0.9 + i * 0.13) % 1; p.dot(u[0] + u[2] + (v[0] - u[0] - u[2]) * ph, u[1] + u[3] / 2, 3.2, u[4]); } } p.fill(C.acc(1)); }
    if (far) {
      p.begin(); p.quad(760, 30, 118, 140); for (let r = 1; r < 6; r++) p.seg(770, 30 + r * 23.3, 868, 30 + r * 23.3); p.stroke(C.ink(0.6 * a), 1.2);
      ctx.lineDashOffset = -tm * 30; p.begin(); p.seg(A1 - 4, 100, 760, 100); p.stroke(R.machine.moveShare > 0.6 ? C.bad(0.9) : C.ink(0.8), 1 + 3.5 * R.machine.moveShare, [9, 7]); ctx.lineDashOffset = 0;
    }
  },
  mind(p, C, R, F, g, tm, a, race) {
    const SEVEN = ['11111110', '11111110', '00000110', '00001100', '00011000', '00110000', '00110000', '00110000'], M = R.mind, lv = 2 ** M.B, err = Math.min(1, M.lam / 4);
    p.begin(); SEVEN.forEach((row, r) => [...row].forEach((v, cl) => { if (v === '1') p.quad(186 + cl * 13.5, 152 - r * 17.5, 11.5, 14.5); })); p.fill(C.ink(0.9 * a));
    p.begin(); SEVEN.forEach((row, r) => [...row].forEach((v, cl) => { if (v !== '1') p.quad(186 + cl * 13.5, 152 - r * 17.5, 11.5, 14.5); })); p.fill(C.ink(0.09));
    const hx = 440, ox = 600, hy = i => 16 + i * 11.2, oy = j => 22 + j * 17.3;
    p.begin(); for (let i = 0; i < 16; i++) p.seg(300, 100, hx, hy(i)); p.stroke(C.acc(0.16 * a), 1);
    for (let b = 0; b < 3; b++) { p.begin(); for (let i = 0; i < 16; i++) for (let j = 0; j < 10; j++) { const wv = Math.round(H(i * 10 + j) * (lv - 1)) / Math.max(1, lv - 1); if (Math.min(2, (wv * 3) | 0) === b && H(i * 31 + j) >= err * 0.3) p.seg(hx, hy(i), ox, oy(j)); } p.stroke(C.acc((0.07 + 0.2 * b) * a), 1); }
    if (err > 0) { p.begin(); for (let i = 0; i < 16; i++) for (let j = 0; j < 10; j++) if (H(i * 31 + j) < err * 0.3) p.seg(hx, hy(i), ox, oy(j)); p.stroke(C.bad(0.5), 1); }
    p.begin(); for (let i = 0; i < 16; i++) p.dot(hx, hy(i), 3.2); p.fill(C.acc(0.8 * a));
    for (let j = 0; j < 10; j++) { const hit = j === 7, h = hit ? 14 + 40 * M.acc : 4 + 26 * H(j + 4) * (1.15 - M.acc); p.begin(); p.seg(ox, oy(j), ox, oy(j), 0, h); p.stroke(hit ? (M.acc > 0.8 ? C.acc(1) : C.bad(1)) : C.mut(0.7), hit ? 3.4 : 2, []); }
    if (!race) return;
    /* against today's computer, need by need: outlined to what it could reach once polished, filled to where it is now */
    const hv = v => clamp((Math.log10(Math.max(v, 1e-6)) + 3) / 4, 0, 1) * 108;
    race.forEach((s, i) => {
      const x = 700 + i * 31;
      if (!s.can) { p.begin(); p.seg(x - 4, 96, x + 4, 104); p.seg(x - 4, 104, x + 4, 96); p.stroke(C.mut(0.6), 1.2, []); return; }
      p.begin(); p.wall(x - 6, x + 6, 100, 0, hv(s.could)); p.stroke(C.mut(0.9), 1, [3, 3]);
      p.begin(); p.wall(x - 6, x + 6, 100, 0, hv(s.now)); p.fill(s.aim ? C.acc(s.wins ? 1 : 0.85) : C.ink(s.wins ? 0.95 : 0.5));
    });
    p.begin(); p.seg(684, 100, 878, 100, hv(1)); p.stroke(C.ink(0.85), 1.2, [5, 4]);
  }
};

/* a recipe's plan seen from above, small: its machine plate, used for the plots of the sheet */
export function glyph(ctx, x, y, w, h, g, C, a) {
  const pad = h * 0.16, n = { few: 3, grid: 8, stack: 4, swarm: 14 }[g.shape], far = g.where === 'far', uw = (w * (far ? 0.62 : 0.94)) / n, col = g.carrier === 'charge' ? C.ink : C.acc;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (g.shape === 'swarm') { ctx.rect(x + pad + H(i) * (w * 0.9 - pad), y + pad + H(i + 20) * (h - 2 * pad - 2), 2.2, 2.2); continue; }
    if (g.shape === 'stack') { ctx.rect(x + pad + i * 2.5, y + pad + i * 1.6, w * (far ? 0.5 : 0.8), h - 2 * pad - 6); continue; }
    ctx.rect(x + pad + i * uw, y + pad, uw * 0.78, h - 2 * pad);
  }
  ctx.lineWidth = 1; ctx.strokeStyle = col(0.75 * a); ctx.setLineDash(g.carrier === 'light' ? [3, 2] : g.carrier === 'spikes' ? [1, 2] : g.carrier === 'living' ? [5, 2, 1, 2] : []);
  if (g.where === 'in') { ctx.fillStyle = col(0.3 * a); ctx.fill(); }
  ctx.stroke(); ctx.setLineDash([]);
  if (far) { ctx.strokeRect(x + w * 0.8, y + pad, w * 0.16, h - 2 * pad); ctx.beginPath(); ctx.moveTo(x + w * 0.66, y + h / 2); ctx.lineTo(x + w * 0.8, y + h / 2); ctx.stroke(); }
  const tx = x + w - pad - 3, ty = y + h - pad - 3; ctx.fillStyle = col(0.9 * a);
  if (g.told === 'graph') { ctx.beginPath(); ctx.arc(tx, ty, 2, 0, TAU); ctx.fill(); } else if (g.told === 'events') { ctx.fillRect(tx - 0.8, ty - 4, 1.6, 6); } else if (g.told === 'learns') { ctx.beginPath(); ctx.moveTo(tx - 3, ty + 2); ctx.lineTo(tx, ty - 3); ctx.lineTo(tx + 3, ty + 2); ctx.closePath(); ctx.fill(); } else if (g.told === 'fixed') ctx.fillRect(tx - 2.5, ty - 2.5, 5, 5);
}
