/* Hold's small drawings (src/v2/hold.js): the hash and easing it draws with, and the living drawings of what people
   are trying against each wall, each drawn on a square canvas of side s at time T, k from 0 to 1 while it is pointed
   at, m its own memory. Ink, paper and one red, as on the page. */
export const INK = '#131210', PAPER = '#efece3', RED = '#e5401a';
export const mix = (h, k) => { h = Math.imul(h ^ k, 0x9E3779B1); h ^= h >>> 15; h = Math.imul(h, 0x85EBCA77); h ^= h >>> 13; return h >>> 0; };
export const rnd = h => mix(h, 0x27d4eb2f) / 4294967296;
export const ss = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
export const lerp = (a, b, f) => a + (b - a) * f;
const E = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const SPEC = {
  /* a turn-on that is soft today, and the sharp one people want: what leaks is red */
  switches(c, s, T, k) { const n = 15, w = s * .8 / n, st = 0.55 + 4.2 * (0.5 - 0.5 * Math.cos(T * 0.9)) + k * 2;
    for (let i = 0; i < n; i++) { const v = 1 / (1 + Math.exp(-(i - 8.5) * st)), h = Math.max(1, v * s * .62), x = s * .1 + i * w;
      c.fillStyle = i < 9 && v > 0.012 ? RED : INK; c.fillRect(x, s * .82 - h, w - 3, h); }
    c.fillStyle = INK; c.fillRect(s * .1, s * .82 + 5, s * .8 - 3, 1); c.fillRect(s * .1 + 8.5 * w - 2, s * .16, 1, s * .66 + 12); },
  /* neurons growing: no two the same */
  living(c, s, T, k, m) { if (!m.tips || m.n > 620) { m.tips = [0, 1, 2].map(i => ({ x: s * (.25 + .25 * i), y: s * (.3 + .2 * ((i * 7) % 3)), a: i * 2.1 + T, g: 0 })); m.segs = []; m.n = 0; m.warm = !m.warmed; m.warmed = 1; }
    const steps = m.warm ? 70 : 1 + Math.round(k * 2); m.warm = 0;
    for (let q = 0; q < steps; q++) for (const p of m.tips.slice()) { const a = p.a + (Math.random() - .5) * .9, nx = p.x + Math.cos(a) * 3.2, ny = p.y + Math.sin(a) * 3.2;
      if (nx < s * .06 || nx > s * .94 || ny < s * .06 || ny > s * .94) { p.a += 2.4; continue; }
      m.segs.push([p.x, p.y, nx, ny, p.g]); p.x = nx; p.y = ny; p.a = a; m.n++;
      if (Math.random() < 0.035 && m.tips.length < 26) m.tips.push({ x: nx, y: ny, a: a + (Math.random() < .5 ? 1 : -1) * (0.6 + Math.random() * .5), g: p.g + 1 }); }
    c.strokeStyle = INK; c.lineCap = 'round';
    for (const g of m.segs) { c.lineWidth = Math.max(.7, 2.2 - g[4] * .45); c.beginPath(); c.moveTo(g[0], g[1]); c.lineTo(g[2], g[3]); c.stroke(); }
    c.fillStyle = RED; for (const p of m.tips) { c.beginPath(); c.arc(p.x, p.y, 2.2, 0, 7); c.fill(); } },
  /* the sums happen where the numbers are stored: a row is asked, and each column adds up */
  cim(c, s, T, k) { const n = 6, g = s * .68 / n, x0 = s * .16, y0 = s * .1, row = Math.floor(T * (1.2 + k * 2)) % n, ph = (T * (1.2 + k * 2)) % 1;
    for (let j = 0; j < n; j++) { let sum = 0;
      for (let i = 0; i < n; i++) { const on = rnd(mix(i * 17 + j, 99)) < .5; c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x0 + j * g + 3.5, y0 + i * g + 3.5, g - 7, g - 7);
        if (on) { c.fillStyle = i === row ? RED : INK; c.fillRect(x0 + j * g + 6, y0 + i * g + 6, g - 12, g - 12); if (i <= row) sum++; } }
      c.fillStyle = RED; c.fillRect(x0 + j * g + 6, y0 + n * g + 8, g - 12, sum * s * .028); }
    c.fillStyle = INK; c.fillRect(x0 - 9, y0 + row * g + g / 2 - 1, 6 + ph * 0, 2); c.beginPath(); c.moveTo(x0 - 3, y0 + row * g + g / 2 - 4); c.lineTo(x0 + 2, y0 + row * g + g / 2); c.lineTo(x0 - 3, y0 + row * g + g / 2 + 4); c.fill(); },
  /* memory stacked on the logic: a number travels up, not across */
  stack(c, s, T, k) { const n = 6, cyc = (T * (0.32 + k * .5)) % 1, w = s * .5, sk = s * .16, th = s * .085;
    for (let i = 0; i < n; i++) { const a = E(Math.min(1, Math.max(0, cyc * (n + 2.5) - i))), y = s * .86 - i * th * 1.25 - (1 - a) * s * .5, x = s * .17;
      if (a <= 0) continue; c.globalAlpha = a; c.fillStyle = i ? PAPER : INK; c.strokeStyle = INK; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w + sk, y - sk * .55); c.lineTo(x + sk, y - sk * .55); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + th * .5); c.lineTo(x + w, y + th * .5); c.lineTo(x + w + sk, y - sk * .55 + th * .5); c.lineTo(x + w + sk, y - sk * .55); c.moveTo(x + w, y); c.lineTo(x + w, y + th * .5); c.stroke(); }
    c.globalAlpha = 1; const top = Math.min(n - 1, Math.floor(cyc * (n + 2.5))) ; const yy = s * .86 - ((T * 2.2) % 1) * top * th * 1.25;
    c.fillStyle = RED; c.fillRect(s * .17 + w * .62, yy - s * .09, 5, 5); },
  /* light: the lines may cross, and nothing is lost on the way */
  light(c, s, T, k) { const n = 7; c.lineWidth = 1;
    c.fillStyle = INK; c.fillRect(s * .08, s * .2, s * .13, s * .6); c.fillRect(s * .79, s * .2, s * .13, s * .6);
    for (let i = 0; i < n; i++) { const y1 = s * (.25 + .5 * i / (n - 1)), j = (i * 3 + 2) % n, y2 = s * (.25 + .5 * j / (n - 1));
      c.strokeStyle = INK; c.globalAlpha = .55; c.beginPath(); c.moveTo(s * .21, y1); c.lineTo(s * .79, y2); c.stroke(); c.globalAlpha = 1;
      for (let q = 0; q < 2; q++) { const p = (T * (0.5 + k * .8) + i * .37 + q * .5) % 1, f = i % 2 ? 1 - p : p; c.fillStyle = RED;
        const x = s * .21 + s * .58 * f, y = y1 + (y2 - y1) * f, dx = s * .58, dy = y2 - y1, l = Math.hypot(dx, dy); c.save(); c.translate(x, y); c.rotate(Math.atan2(dy, dx)); c.fillRect(-6, -1.5, 12, 3); c.restore(); } } },
  /* spikes: silent until something changes, then it passes it on */
  spikes(c, s, T, k, m) { const n = 7, g = s * .8 / (n - 1); m.sp = m.sp || [];
    if (Math.random() < 0.02 + k * .08) m.sp.push({ i: Math.floor(Math.random() * n), j: Math.floor(Math.random() * n), t: T, gen: 0 });
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { c.fillStyle = INK; c.beginPath(); c.arc(s * .1 + i * g, s * .1 + j * g, 2, 0, 7); c.fill(); }
    m.sp = m.sp.filter(p => T - p.t < 1.1);
    for (const p of m.sp.slice()) { const a = (T - p.t) / 1.1, x = s * .1 + p.i * g, y = s * .1 + p.j * g;
      c.fillStyle = RED; c.globalAlpha = 1 - a; c.beginPath(); c.arc(x, y, 5.5 * (1 - a * .5), 0, 7); c.fill();
      c.strokeStyle = RED; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 4 + a * g * .9, 0, 7); c.stroke(); c.globalAlpha = 1;
      if (!p.done && a > .45) { p.done = 1; if (p.gen < 2 && Math.random() < .62) { const dd = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)], ni = p.i + dd[0], nj = p.j + dd[1]; if (ni >= 0 && nj >= 0 && ni < n && nj < n) m.sp.push({ i: ni, j: nj, t: T, gen: p.gen + 1 }); } } } },
  /* noise that settles into an answer, and melts again */
  pbits(c, s, T, k) { const n = 9, g = s * .8 / n, heat = 0.5 + 0.5 * Math.cos(T * (0.7 + k)), tick = Math.floor(T * 9);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const want = (i + j) % 2 === 0, noisy = rnd(mix(i * 131 + j * 17, tick)) < heat * .5, on = noisy ? !want : want;
      const x = s * .1 + i * g, y = s * .1 + j * g; if (on) { c.fillStyle = noisy ? RED : INK; c.fillRect(x + 2, y + 2, g - 4, g - 4); } else { c.strokeStyle = INK; c.lineWidth = .8; c.globalAlpha = .4; c.strokeRect(x + 2.5, y + 2.5, g - 5, g - 5); c.globalAlpha = 1; } } },
  /* a circuit that keeps being rewired after it is made */
  liquid(c, s, T, k) { const pts = []; c.strokeStyle = INK; c.lineWidth = 1.1;
    (function rec(x, y, w, h, hash, dep) { if (dep === 4) { pts.push([x + w / 2, y + h / 2, hash]); c.strokeRect(x + .5, y + .5, w, h); return; }
      const r = 0.5 + 0.27 * Math.sin(T * (0.5 + k) * (0.6 + rnd(hash)) + rnd(hash >>> 4) * 6.3);
      if (w >= h) { rec(x, y, w * r, h, mix(hash, 1), dep + 1); rec(x + w * r, y, w * (1 - r), h, mix(hash, 2), dep + 1); } else { rec(x, y, w, h * r, mix(hash, 1), dep + 1); rec(x, y + h * r, w, h * (1 - r), mix(hash, 2), dep + 1); } })(s * .1, s * .1, s * .8, s * .8, 77, 0);
    const ord = Math.floor(T * (0.45 + k * .6)); const pick = [0, 1, 2, 3, 4].map(i => pts[Math.floor(rnd(mix(i, ord)) * pts.length)]);
    c.strokeStyle = RED; c.lineWidth = 2; c.beginPath(); pick.forEach((p, i) => { if (!i) c.moveTo(p[0], p[1]); else { c.lineTo(p[0], pick[i - 1][1]); c.lineTo(p[0], p[1]); } }); c.stroke();
    c.fillStyle = RED; for (const p of pick) c.fillRect(p[0] - 3, p[1] - 3, 6, 6); },
  /* the same few blocks, put together differently for each need */
  machines(c, s, T, k) { const A = [[[.1, .1, .36, .36], [.5, .1, .4, .16], [.5, .3, .18, .16], [.72, .3, .18, .16], [.1, .5, .8, .16], [.1, .7, .36, .2], [.5, .7, .4, .2]],
      [[.32, .32, .36, .36], [.1, .1, .8, .16], [.1, .32, .18, .36], [.72, .32, .18, .36], [.1, .74, .36, .16], [.5, .74, .18, .16], [.72, .74, .18, .16]],
      [[.1, .54, .36, .36], [.1, .1, .18, .4], [.32, .1, .14, .4], [.5, .1, .4, .2], [.5, .34, .4, .2], [.5, .58, .18, .32], [.72, .58, .18, .32]]];
    const u = T * (0.3 + k * .5), a = Math.floor(u) % 3, b = (a + 1) % 3, f = E(ss(.55, 1, u % 1));
    A[a].forEach((r, i) => { const q = A[b][i], x = (r[0] + (q[0] - r[0]) * f) * s, y = (r[1] + (q[1] - r[1]) * f) * s, w = (r[2] + (q[2] - r[2]) * f) * s, h = (r[3] + (q[3] - r[3]) * f) * s;
      if (i === 0) { c.fillStyle = RED; c.fillRect(x, y, w, h); } else if (i % 3 === 1) { c.fillStyle = INK; c.fillRect(x, y, w, h); } else { c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x + .6, y + .6, w - 1.2, h - 1.2);
        if (i % 3 === 2) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.lineWidth = .8; c.beginPath(); for (let v = -h; v < w; v += 6) { c.moveTo(x + v, y + h); c.lineTo(x + v + h, y); } c.stroke(); c.restore(); } } }); },
  /* a small wafer, printed in minutes, and then the next try */
  smallfab(c, s, T, k) { const u = T * (0.5 + k * .8), n = Math.floor((u % 1) * 22), R = s * .3, cx = s * .5, cy = s * .47, g = R * 2 / 5;
    const sl = ss(.9, 1, u % 1); c.save(); c.translate(sl * s * .9, 0);
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); let q = 0;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const x = cx - R + i * g, y = cy - R + j * g; if (Math.hypot(x + g / 2 - cx, y + g / 2 - cy) > R - g * .42) continue;
      if (q < n) { c.fillStyle = q === n - 1 ? RED : INK; c.fillRect(x + 2, y + 2, g - 4, g - 4); } else { c.lineWidth = .7; c.globalAlpha = .35; c.strokeRect(x + 2.5, y + 2.5, g - 5, g - 5); c.globalAlpha = 1; } q++; }
    c.restore(); const tries = Math.floor(u) % 9 + 1; c.fillStyle = INK; for (let i = 0; i < 9; i++) { if (i < tries) c.fillRect(s * .1 + i * 11, s * .9, 7, 7); else { c.globalAlpha = .3; c.fillRect(s * .1 + i * 11, s * .9 + 3, 7, 1); c.globalAlpha = 1; } } }
};
