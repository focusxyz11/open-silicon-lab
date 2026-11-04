/* Wafer yield: one shared model for the picture, the numbers and the formulas. No DOM.
   The rain of defects is fixed for a seed, so cutting chips smaller changes the grid and never the
   rain. Density works by thinning: raising it adds drops and leaves the others where they were.

   Clumps: each patch of the wafer draws its own density from a gamma distribution, which is the
   assumption behind the negative binomial yield model. A die larger than a patch can straddle two,
   so big dies land a little under that formula; small dies match it. */
export const RAD = 150, USE = 147, DMAX = 0.6;
const SCRIBE = 0.1, PATCH = 70, SOFT = 5;

export const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let z = Math.imul(a ^ a >>> 15, 1 | a); z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z; return ((z ^ z >>> 14) >>> 0) / 4294967296; };
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function gamma(a, r) {
  if (a < 1) return gamma(a + 1, r) * Math.pow(r() || 1e-9, 1 / a);
  const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) { let x, v; do { x = gauss(r); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = r(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; }
}
function poisson(l, r) { let n = 0; while (l > 30) { n += poisson(30, r); l -= 30; } const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return n + k - 1; }

/* Every possible drop on a wafer. u decides at what density a drop falls; d is when it lands. */
export function rain(seed, clumped, alpha) {
  const r = seeded(seed * 7919 + (clumped ? 13 : 0)), pts = [], sx = r() * PATCH, sy = r() * PATCH, n = Math.ceil(2 * RAD / PATCH) + 1;
  for (let i = -3; i <= n; i++) for (let j = -3; j <= n; j++) {
    const w = clumped ? gamma(alpha, r) / alpha : 1, m = poisson(DMAX * w * PATCH * PATCH / 100, r), x0 = -RAD + i * PATCH - sx, y0 = -RAD + j * PATCH - sy;
    for (let k = 0; k < m; k++) { const x = x0 + r() * PATCH + gauss(r) * SOFT, y = y0 + r() * PATCH + gauss(r) * SOFT, u = r(), d = r(); if (x * x + y * y <= RAD * RAD) pts.push({ x, y, u, d }); }
  }
  return pts;
}

/* The best placement of w × h dies on the wafer; ok marks whole dies inside the usable edge. */
export function grid(w, h) {
  let best = null;
  for (const ox of [0, 0.5]) for (const oy of [0, 0.5]) {
    const dies = [], nx = Math.ceil(RAD / (w + SCRIBE)) + 1, ny = Math.ceil(RAD / (h + SCRIBE)) + 1;
    for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++) {
      const x = (i + ox) * (w + SCRIBE) - w / 2, y = (j + oy) * (h + SCRIBE) - h / 2, c = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
      const ok = c.every(([p, q]) => p * p + q * q <= USE * USE), any = c.some(([p, q]) => p * p + q * q <= RAD * RAD);
      if (ok || any) dies.push({ x, y, w, h, ok });
    }
    const n = dies.filter(d => d.ok).length;
    if (!best || n > best.n) best = { dies, n };
  }
  return best;
}

/* One piece when a w × h design is cut into n: links add area, and spares add area to a whole die. */
export function piece(w, h, n, link = 0.1, spare = 0) {
  if (n === 1) { const s = Math.sqrt(1 + spare); return { w: w * s, h: h * s, area: w * h * (1 + spare) }; }
  const area = w * h * (1 + link) / n, pw = Math.sqrt(area * w / h);
  return { w: pw, h: area / pw, area };
}

export const poissonY = l => Math.exp(-l);
export const murphyY = l => { if (l < 1e-6) return 1; const q = (1 - Math.exp(-l)) / l; return q * q; };
export const negBinY = (l, a) => Math.pow(1 + l / a, -a);
/* The chance a die works when it can absorb up to k defects. */
export function spareY(l, k, clumped, a) {
  if (!clumped) { let p = Math.exp(-l), s = p; for (let j = 0; j < k; j++) { p *= l / (j + 1); s += p; } return s; }
  let p = Math.pow(a / (a + l), a), s = p; for (let j = 0; j < k; j++) { p *= (j + a) / (j + 1) * l / (a + l); s += p; } return s;
}

/* Lay a rain over a grid at density D (defects per cm²). */
export function hit(g, pts, D, k = 0) {
  const keep = pts.filter(p => p.u < D / DMAX); let good = 0;
  const dies = g.dies.map(d => { const on = []; for (const p of keep) if (p.x >= d.x && p.x <= d.x + d.w && p.y >= d.y && p.y <= d.y + d.h) on.push(p); const bad = on.length > k; if (d.ok && !bad) good++; return { ...d, on, bad }; });
  return { dies, good, gross: g.n, keep };
}

/* Silicon cost of one working chip, from the formulas. */
export function costPerChip(w, h, n, D, price, { clumped = false, alpha = 1, link = 0.1, spare = 0, k = 0 } = {}) {
  const p = piece(w, h, n, link, spare), l = p.area / 100 * D, Y = spareY(l, k, clumped, alpha), g = grid(p.w, p.h);
  return { cost: price / (g.n * Y / n), Y, gross: g.n, area: p.area, l };
}
