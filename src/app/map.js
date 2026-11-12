/* The world around the line: the journey seen from far away. Every step of a chip's trip, from design to
   the place it is used, on one map: where each happens, and what travels between them (moving crates,
   like the pods on the line). Stop a place and the trip shows what stops after it (src/engines/supply.js).

   Drawn on the 2D canvas, in the box's 1000 x 1000 space, by world.js when the map is open. No words in
   code: names are site.<id>.name and route.step.<id>. Returns where its sites and steps are, for taps. */
import { t } from '../core/i18n.js';
import { LAND, SITES, map as P } from '../data/world.js';
import { sitesOf } from '../engines/supply.js';

const MONO = '"Martian Mono", ui-monospace, Menlo, monospace'; /* i18n-ok: a font name */
const sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
let land = null, view = null;
const AREA = { x: 24, y: 70, w: 952, h: 560 };

/* the part of the map a route covers, fitted into the area above the steps */
function fit(route, step, narrow) {
  /* the picked step's places and what flows into it; or the whole route */
  const ids = step != null && route[step] ? sitesOf([route[step]]) : [];
  const pts = (ids.length > 1 ? ids : sitesOf(route)).map(id => P(SITES[id][0], SITES[id][1]));
  if (!pts.length) return { x: 500, y: 170, s: 1 };
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), m = narrow ? 34 : 40;
  const x0 = Math.min(...xs) - m, x1 = Math.max(...xs) + m, y0 = Math.min(...ys) - m, y1 = Math.max(...ys) + m;
  const s = Math.min((narrow ? AREA.w - 120 : AREA.w - 60) / (x1 - x0), AREA.h / (y1 - y0), 3.2);
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, s };
}
const arc = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - Math.min(90, L * 0.25 + 8)]; };
const qpt = (a, c, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];

/* o: { route, world, step (picked), here (the step your station is in), site (picked), closed (Set), st (status
   per step), k (0..1, opening), from ([lon, lat] it opens from), dt } */
export function drawMap(G, o) {
  const ctx = G.ctx, c = G.col, u = 1 / G.s, k = sm(o.k), narrow = 1000 * G.s < 560;
  if (!land) land = new Path2D(LAND);
  /* the view: fitted to the route, opening from the place your station is in */
  const goal = fit(o.route, o.step, narrow);
  if (!view || o.reset) view = Object.assign({}, goal);
  const e = Math.min(1, (o.dt || 0.016) * 4);
  view.x += (goal.x - view.x) * e; view.y += (goal.y - view.y) * e; view.s += (goal.s - view.s) * e;
  const f = o.from ? P(o.from[0], o.from[1]) : [view.x, view.y], zoom = 1 + (1 - k) * 7;
  const vs = view.s * zoom, vx = view.x + (f[0] - view.x) * (1 - k), vy = view.y + (f[1] - view.y) * (1 - k);
  const cx = AREA.x + AREA.w / 2, cy = AREA.y + AREA.h / 2;
  const at = (x, y) => [cx + (x - vx) * vs, cy + (y - vy) * vs];
  const S = id => { const s = SITES[id]; const p = P(s[0], s[1]); return at(p[0], p[1]); };

  ctx.save(); ctx.globalAlpha = k;
  ctx.fillStyle = c.bg; ctx.fillRect(-2000, -2000, 5000, 5000);
  ctx.beginPath(); ctx.rect(-2000, AREA.y - 40, 5000, AREA.h + 80); ctx.clip();
  /* lines of longitude and latitude, every 15 degrees */
  ctx.strokeStyle = c.dim; ctx.lineWidth = 0.6 * u; ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 15) { const a = at(P(lon, 0)[0], P(0, 80)[1]), b = at(P(lon, 0)[0], P(0, -60)[1]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  for (let lat = -60; lat <= 75; lat += 15) { const a = at(P(-180, 0)[0], P(0, lat)[1]), b = at(P(180, 0)[0], P(0, lat)[1]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  ctx.stroke();
  /* the land */
  ctx.save(); ctx.translate(cx - vx * vs, cy - vy * vs); ctx.scale(vs, vs);
  ctx.fillStyle = c.dark ? c.mid : c.lo; ctx.fill(land); ctx.strokeStyle = c.line; ctx.globalAlpha = k * 0.7; ctx.lineWidth = (0.8 * u) / vs; ctx.stroke(land);
  ctx.restore(); ctx.globalAlpha = k;
  /* every other place, faint */
  const mine = new Set(sitesOf(o.route));
  Object.keys(SITES).forEach(id => { if (mine.has(id)) return; const p = S(id); G.c(p[0], p[1], 2.2 * u, c.dim); });
  /* what travels: arcs into each step, crates moving along them; a stopped step's arcs are broken and still */
  const bad = s => s && (s.state === 'stopped' || s.state === 'waits');
  o.route.forEach((step, i) => step.flow.forEach(([a, b], j) => {
    if (a === b) return;
    const A = S(a), B = S(b), C = arc(A, B), sel = i === o.step, st = o.st[i], off = bad(st) || o.closed.has(a);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(C[0], C[1], B[0], B[1]);
    ctx.strokeStyle = off ? c.red : sel ? c.warm : c.line; ctx.lineWidth = (sel ? 1.8 : 1) * u;
    ctx.globalAlpha = k * (sel ? 1 : 0.55); ctx.setLineDash(off ? [4 * u, 4 * u] : []); ctx.stroke(); ctx.setLineDash([]);
    if (!off) for (let q = 0; q < 2; q++) {
      const p = qpt(A, C, B, ((G.t * 0.18 + q / 2 + j * 0.31 + i * 0.13) % 1)), r = (sel ? 3.4 : 2.6) * u;
      ctx.fillStyle = sel ? c.warm : c.hi; ctx.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r);
    }
    ctx.globalAlpha = k;
  }));
  /* the places of this trip: lit where the picked step happens; crossed out where stopped */
  const pickAt = new Set(o.step != null ? [...o.route[o.step].at, ...(o.route[o.step].needs || []).flatMap(n => n.at)] : []);
  const hits = { sites: [], steps: [] };
  ctx.font = '500 ' + 10 * u + 'px ' + MONO; ctx.textBaseline = 'middle';
  [...mine].forEach(id => {
    const [x, y] = S(id), side = SITES[id][2], lit = pickAt.has(id), shut = o.closed.has(id), picked = o.site === id;
    if (picked) { G.c(x, y, (9 + 2 * Math.sin(G.t * 4)) * u, null, c.hi, 1.2); }
    G.c(x, y, (lit ? 5 : 3.8) * u, shut ? c.red : lit ? c.warm : c.bg, shut ? c.red : lit ? c.warm : c.hi, 1.2);
    if (shut) { const r = 7 * u; G.l([[x - r, y - r], [x + r, y + r]], c.red, 1.6); G.l([[x - r, y + r], [x + r, y - r]], c.red, 1.6); }
    const name = t('site.' + id + '.name'), w = ctx.measureText(name).width;
    let tx = x + 9 * u, ty = y; ctx.textAlign = 'left';
    if (side === 'l') { tx = x - 9 * u; ctx.textAlign = 'right'; } else if (side === 't') { tx = x; ty = y - 12 * u; ctx.textAlign = 'center'; } else if (side === 'b') { tx = x; ty = y + 13 * u; ctx.textAlign = 'center'; }
    if (lit || picked || shut || !narrow) {
      ctx.lineWidth = 3 * u; ctx.strokeStyle = c.bg; ctx.strokeText(name, tx, ty);
      ctx.fillStyle = shut ? c.red : lit || picked ? c.warm : c.hi; ctx.globalAlpha = k * (lit || picked || shut ? 1 : 0.75); ctx.fillText(name, tx, ty); ctx.globalAlpha = k;
    }
    hits.sites.push({ id, x, y, w });
  });
  ctx.restore();

  /* the trip as steps, in a row under the map: picked, where your wafer is now, and what stops */
  ctx.save(); ctx.globalAlpha = k;
  const n = o.route.length, x0 = 70, x1 = 930, y = 700, gap = (x1 - x0) / (n - 1);
  ctx.font = '600 ' + 10.5 * u + 'px ' + MONO; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = c.warm; ctx.textAlign = 'left';
  ctx.fillText(t('map.route.' + o.world), AREA.x, AREA.y - 30);
  G.l([[x0, y], [x1, y]], c.line, 1);
  ctx.font = '500 ' + 10 * u + 'px ' + MONO; ctx.textAlign = 'center';
  const cramped = gap * G.s < 76;
  o.route.forEach((step, i) => {
    const x = x0 + i * gap, st = o.st[i], sel = i === o.step;
    const fill = st.state === 'stopped' || st.state === 'waits' ? c.red : st.state === 'strained' ? c.warm : sel ? c.hi : c.bg;
    if (i > 0 && (st.state === 'waits')) { ctx.setLineDash([4 * u, 4 * u]); G.l([[x - gap, y], [x, y]], c.red, 1.4); ctx.setLineDash([]); }
    G.c(x, y, (sel ? 10 : 8) * u, fill, sel ? c.warm : c.line, sel ? 2 : 1.2);
    if (i === o.here) { const r = 4.5 * u; ctx.fillStyle = c.warm; ctx.fillRect(x - r, y - 24 * u - r, 2 * r, 2 * r); G.l([[x, y - 19 * u], [x, y - 12 * u]], c.warm, 1); }
    const label = t('route.step.' + step.id), ly = y + (cramped && i % 2 ? 34 : 22) * u;
    ctx.fillStyle = sel ? c.warm : st.state !== 'ok' ? (st.state === 'strained' ? c.warm : c.red) : c.hi;
    ctx.fillText(label, Math.max(x0 - 30, Math.min(x1 + 30, x)), ly);
    hits.steps.push({ i, x, y });
  });
  if (o.here != null) { ctx.font = '500 ' + 9.5 * u + 'px ' + MONO; ctx.fillStyle = c.warm; ctx.textAlign = 'center'; ctx.fillText(t('map.here'), x0 + o.here * gap, y - 34 * u); }
  ctx.restore();
  return hits;
}
export const resetMapView = () => { view = null; };
