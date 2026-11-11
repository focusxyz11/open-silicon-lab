/* The journey: the line a chip is made on, drawn as one long hall in an oblique 2.5D view and travelled
   with one wafer. Every station stands on the same floor, under the same overhead track, so the stations
   join into one panorama (world.js slides along it).

   Moving the wafer is part of making it, so every station shows it: the sealed pod is lowered from the
   track onto the machine's door (the load port), a robot in the front module takes the wafer out, an
   airlock lets it into the vacuum, a second robot carries it to the chamber where the work is done, and
   it goes back the same way. Each station is a list of steps (CFG below): where the wafer goes, for how
   long, what the caption says, and what the cut through the wafer shows afterwards. The steps are
   numbered in the picture; the band under the picture says what is happening now and shows a slice
   through your wafer, so you can see what each machine changed.

   world.js tells a station whether it is yours (G.mine) and how long you have been standing at it
   (G.run, in seconds; -1 for reduced motion); other stations play the same steps with someone else's
   wafer. world.js also calls drawJourney() over the stations: your pod (or, after packaging, your tray)
   and the band. No words in this file: they are in src/i18n/en.json (handle.*, proc.*, slice.*). */
import { t } from '../core/i18n.js';
import { PLANTS, partWord } from '../data/weave.js';
import { rnd, clamp, poly, faces, closed } from './draw.js';
import { kit, tones, mix } from './solid.js';

/* your chip (src/engines/chip.js), set by scenes.js */
let M = { layers: 62 }, HITS = [], DIES = [];
export const setJourneyChip = (m, h, d) => { M = m; HITS = h; DIES = d; };
export const chipNow = () => ({ M, HITS, DIES });

const MONO = '"Martian Mono", ui-monospace, Menlo, monospace'; /* i18n-ok: a font name */
const SANS = '"Atkinson Hyperlegible Next", system-ui, sans-serif'; /* i18n-ok: a font name */

/* ---- the view: x along the line, y into the hall, z up ---- */
/* seen from the front, a little from the right and above; brought a little closer around the machines */
const ZOOM = 1.2, CX = 520, BACK = 480, DY = 0.5;
const obP = (x, y, z) => [CX + ZOOM * (x + 0.42 * y - CX), 800 - ZOOM * ((z || 0) + DY * y)];
const obPoly = pts => pts.map(p => obP(p[0], p[1], p[2]));
const sm = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const waferTint = c => (c.dark ? '#c9d7ff' : '#7d93c7');
/* a solid box: front, top and right side show */
function obBox(G, x, y, z, w, d, h, stroke, tint, lw) {
  const [ft, fl, fr] = faces(G.col), sk = stroke || G.col.line;
  poly(G, obPoly([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]]), fl, sk, lw || 0.9);
  poly(G, obPoly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]), fr, sk, lw || 0.9);
  poly(G, obPoly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]), ft, sk, lw || 0.9);
  if (tint) { G.a(tint[1]); poly(G, obPoly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]), tint[0]); G.a(1); }
}
/* a box cut open at the front: its back, left side and floor now; the returned function draws its frame */
function obCut(G, x, y, z, w, d, h, stroke) {
  const c = G.col, [, fl, fr] = faces(c), sk = stroke || c.line;
  /* the walls are glass-like, so what stands behind a machine still shows */
  G.a(0.55); poly(G, obPoly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]), fr); G.a(1);
  G.l(obPoly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h], [x, y + d, z]]), sk, 0.8);
  G.a(0.3); poly(G, obPoly([[x, y, z], [x, y + d, z], [x, y + d, z + h], [x, y, z + h]]), fl); G.a(1);
  G.l(obPoly([[x, y, z], [x, y + d, z], [x, y + d, z + h], [x, y, z + h], [x, y, z]]), sk, 0.8);
  G.a(0.85); poly(G, obPoly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]]), c.lo); G.a(1);
  return () => {
    G.l(obPoly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h], [x, y, z + h]]), sk, 1.4);
    G.l(obPoly([[x + w, y, z], [x + w, y, z + h]]), sk, 1.4); G.l(obPoly([[x, y, z], [x + w, y, z]]), sk, 1.4);
    G.l(obPoly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h]]), sk, 1);
    G.a(0.06); poly(G, obPoly([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]]), c.hi); G.a(1);
  };
}
/* a box's outline, as a part */
const obShape = (x, y, z, w, d, h) => closed(obPoly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h], [x, y, z + h]]));
/* a round thing lying flat: a wafer, a chuck, a polishing pad */
function disc(G, x, y, z, r, fill, stroke, lw) { const pts = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.2832; pts.push(obP(x + Math.cos(a) * r, y + Math.sin(a) * r, z)); } poly(G, pts, fill, stroke, lw); }
/* a short line across a disc, turning: shows that something spins */
function spin(G, x, y, z, r, a, color) { G.l([obP(x + Math.cos(a) * r, y + Math.sin(a) * r, z), obP(x - Math.cos(a) * r, y - Math.sin(a) * r, z)], color, 1.2); }
/* names beside parts; in a small picture (a phone) they would cover it, so the caption names the step instead */
const roomy = G => 1000 * G.s >= 480;
const name = (G, key, x, y, align) => { if (roomy(G)) G.label(key, x, y, align); };
const label = (G, key, p, dx, dy, align) => { const q = obP(p[0], p[1], p[2]); name(G, key, q[0] + (dx || 0), q[1] + (dy || 0), align); };

/* the outline of a solid, as a part: the hull of its corners on screen */
function hull(pts3) {
  const q = pts3.map(p => obP(p[0], p[1], p[2])).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of q.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return closed(lo.slice(0, -1).concat(up.slice(0, -1)));
}
const cylHull = (x, y, z, r, h) => { const pts = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.2832; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r, z], [x + Math.cos(a) * r, y + Math.sin(a) * r, z + h]); } return hull(pts); };

/* ======== the things every station shares ======== */

/* the overhead track runs through every station at the same place; the pod hangs from it, above the
   machine's door (the load port), and is lowered onto it */
const PODX = 245, PODY = 60, PORT_Z = 95, HANG_Z = 452;
export const TRACK = obP(PODX, PODY, 520);

/* the sealed box a wafer travels in (with others: it has slots for a stack of them) */
function pod(G, x, y, z, mine, open) {
  const c = G.col, sk = mine ? c.hi : c.line;
  obBox(G, x - 32, y - 34, z, 64, 68, 60, sk, mine ? [c.cool, 0.25] : null, mine ? 1.5 : 0.9);
  for (let k = 0; k < 4; k++) G.l(obPoly([[x - 24, y - 34, z + 12 + k * 11], [x + 24, y - 34, z + 12 + k * 11]]), c.dim, 0.7);
  obBox(G, x - 14, y - 14, z + 60, 28, 28, 7, sk, null, 0.8);
  if (open) poly(G, obPoly([[x + 32, y - 26, z + 8], [x + 32, y + 26, z + 8], [x + 32, y + 26, z + 52], [x + 32, y - 26, z + 52]]), c.lo, c.cool, 1);
}
/* after packaging, chips travel in trays: one pocket each */
function tray(G, x, y, z, mine, yoursIn) {
  const c = G.col, sk = mine ? c.hi : c.line;
  obBox(G, x - 42, y - 32, z, 84, 64, 10, sk, mine ? [c.cool, 0.25] : null, mine ? 1.5 : 0.9);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const px = x - 33 + i * 20, py = y - 22 + j * 18, me = mine && i === 1 && j === 0;
    if (!me) obBox(G, px, py, z + 10, 13, 12, 3, c.line, null, 0.6);
    else if (yoursIn) obBox(G, px, py, z + 10, 13, 12, 3, c.hi, [waferTint(c), 0.95], 1.2);
    else poly(G, obPoly([[px, py, z + 10], [px + 13, py, z + 10], [px + 13, py + 12, z + 10], [px, py + 12, z + 10]]), c.lo, c.dim, 0.6);
  }
}
/* packed for the road: a crate around the pod while it goes from one plant to the next */
function crate(G, x, y, z) {
  const c = G.col;
  G.a(0.85); obBox(G, x - 44, y - 44, z - 8, 88, 88, 84, c.warm, null, 1.2); G.a(1);
  for (let k = 1; k < 4; k++) G.l(obPoly([[x - 44, y - 44, z - 8 + k * 21], [x + 44, y - 44, z - 8 + k * 21]]), c.warm, 0.8);
}
/* the stand at the machine's door */
function port(G) { obBox(G, 205, 22, 0, 80, 76, PORT_Z, G.col.line); }
const portShape = obShape(205, 22, 0, 80, 76, PORT_Z + 70);

/* the wafer: yours (light, glowing) or someone else's; after it is cut, a chip */
function piece(G, p, mine, chip) {
  const c = G.col, fill = mine ? waferTint(c) : c.up, sk = mine ? c.hi : c.line;
  if (chip) { obBox(G, p[0] - 10, p[1] - 10, p[2], 20, 20, 5, sk, mine ? [fill, 0.95] : null, mine ? 1.4 : 0.8); return; }
  const ctx = G.ctx;
  if (mine && c.dark) { ctx.save(); ctx.shadowColor = fill; ctx.shadowBlur = 14; }
  disc(G, p[0], p[1], p[2], 30, fill, sk, mine ? 1.4 : 0.8);
  if (mine && c.dark) ctx.restore();
}

/* a robot arm: a column, two links, and a fork that holds the wafer from below */
function arm(G, R, hand) {
  const c = G.col, [bx, by, bz] = R.b, h = R.h;
  obBox(G, bx - 12, by - 12, bz, 24, 24, h - bz - 8, c.line, null, 0.8);
  const s = [bx, by, h], dx = hand[0] - bx, dy = hand[1] - by, d = Math.hypot(dx, dy) || 1, m = Math.min(d / 2, R.L * 0.97), off = Math.sqrt(Math.max(0, R.L * R.L - m * m));
  const e = [bx + dx / 2 - (dy / d) * off, by + dy / 2 + (dx / d) * off, (h + hand[2]) / 2 + 4], w = [hand[0], hand[1], hand[2] - 4];
  G.l(obPoly([s, e, w]), c.line, 5); G.l(obPoly([s, e, w]), c.hi, 1.6);
  [s, e].forEach(q => { const a = obP(q[0], q[1], q[2]); G.c(a[0], a[1], 4.5, c.up, c.hi, 1); });
  const ux = dx / d, uy = dy / d;
  for (const sg of [-1, 1]) G.l(obPoly([[w[0] - ux * 30 + sg * uy * 12, w[1] - uy * 30 - sg * ux * 12, w[2]], [w[0] + ux * 8 + sg * uy * 12, w[1] + uy * 8 - sg * ux * 12, w[2]]]), c.hi, 1.6);
}
/* a robot drawn solid: a hub, two flat links, a fork; the hand follows the wafer, eased */
function arm2(G, R, f) {
  const K2 = kit(obP), T = tones(G.col), [bx, by, bz] = R.b, h = R.h, hand = f.p && f.hold === R.id ? f.p : R.rest;
  const dx = hand[0] - bx, dy = hand[1] - by, d = Math.hypot(dx, dy) || 1, m = Math.min(d / 2, R.L * 0.97), off = Math.sqrt(Math.max(0, R.L * R.L - m * m));
  const e = [bx + dx / 2 - (dy / d) * off, by + dy / 2 + (dx / d) * off], z = h, ux = dx / d, uy = dy / d;
  K2.cyl(G, bx, by, bz, 16, h - bz, { tone: 'base' });
  const bar = (a, b, w, zz, tone) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L * w, ny = (b[0] - a[0]) / L * w;
    K2.fill(G, [K2.P(a[0] + nx, a[1] + ny, zz), K2.P(b[0] + nx, b[1] + ny, zz), K2.P(b[0] - nx, b[1] - ny, zz), K2.P(a[0] - nx, a[1] - ny, zz)], tone, T.edge, 0.8); };
  bar([bx, by], e, 9, z, T.hi.top); K2.disc(G, e[0], e[1], z + 1, 9, T.hi.top, T.edge);
  bar(e, [hand[0] - ux * 12, hand[1] - uy * 12], 7, z + 3, T.hi.top);
  for (const sg of [-1, 1]) bar([hand[0] - ux * 14 + sg * uy * 10, hand[1] - uy * 14 - sg * ux * 10], [hand[0] + ux * 18 + sg * uy * 10, hand[1] + uy * 18 - sg * ux * 10], 2.6, hand[2] - 3, T.hi.top);
  K2.disc(G, bx, by, h + 1, 12, T.base.top, T.edge);
}
/* the front robot rides a rail: its base slides under the hand */
function armA(G, R, f) {
  const hand = f.p && f.hold === R.id ? f.p : R.rest, bx = clamp(hand[0], R.rail[0], R.rail[1]);
  const K2 = kit(obP), T = tones(G.col);
  K2.box(G, bx - 18, R.b[1] - 14, R.b[2], 36, 28, 10, { tone: 'base' });
  arm2(G, Object.assign({}, R, { b: [bx, R.b[1], R.b[2] + 10] }), f);
}
/* a pick-up head on a beam overhead, for chips */
function head(G, R, hand) {
  const c = G.col, z = R.h;
  G.l(obPoly([[R.x0, R.y, z], [R.x1, R.y, z]]), c.line, 4);
  G.l(obPoly([[hand[0], R.y, z], [hand[0], hand[1], z], [hand[0], hand[1], hand[2] + 10]]), c.hi, 1.6);
  obBox(G, hand[0] - 9, hand[1] - 9, hand[2] + 8, 18, 18, 14, c.hi, null, 1);
}

/* the hall: floor, back wall; in the factory its ceiling of filters; the track, and other pods on it */
function hall(G, plant, from, seed) {
  const c = G.col, T = tones(c);
  G.bg(c.dark ? c.bg : mix(c.up, c.line, 0.12));
  /* the back wall, then the floor of square tiles (in the factory, a raised floor that lets air through) */
  poly(G, obPoly([[-400, BACK, 0], [1400, BACK, 0], [1400, BACK, 900], [-400, BACK, 900]]), c.dark ? mix(c.bg, c.lo, 0.6) : mix(c.up, c.line, 0.08), null);
  poly(G, obPoly([[-400, 0, 0], [1400, 0, 0], [1400, BACK, 0], [-400, BACK, 0]]), c.dark ? mix(c.lo, c.mid, 0.35) : mix(c.mid, c.lo, 0.3), null);
  for (let x = -400; x <= 1400; x += 60) G.l(obPoly([[x, 0, 0], [x, BACK, 0]]), T.seam, 0.5);
  for (let y = 0; y <= BACK; y += 60) G.l(obPoly([[-400, y, 0], [1400, y, 0]]), T.seam, 0.5);
  G.l(obPoly([[-400, BACK, 0], [1400, BACK, 0]]), T.edge, 0.8);
  if (plant === 'fab') {
    for (let x = -400; x < 1400; x += 80) poly(G, obPoly([[x + 6, BACK, 360], [x + 74, BACK, 360], [x + 74, BACK, 400], [x + 6, BACK, 400]]), T.body.side, T.seam, 0.6);
    for (let x = -360; x < 1400; x += 160) G.l(obPoly([[x, BACK, 0], [x, BACK, 340]]), T.seam, 0.5);
  } else {
    for (let x = -360; x < 1400; x += 240) poly(G, obPoly([[x, BACK, 240], [x + 140, BACK, 240], [x + 140, BACK, 360], [x, BACK, 360]]), c.dark ? c.bg : c.lo, T.seam, 0.7);
  }
  /* where one building ends and the next begins: a wall the track passes through */
  if (from) { poly(G, obPoly([[-10, 0, 0], [10, 0, 0], [10, 0, 900], [-10, 0, 900]]), c.up, c.line, 1); poly(G, obPoly([[10, 0, 0], [10, BACK, 0], [10, BACK, 900], [10, 0, 900]]), faces(c)[2], c.line, 1); }
  /* the overhead track, at the same height in every station, hung from the ceiling */
  G.l([[-400, TRACK[1]], [1400, TRACK[1]]], c.line, 3);
  for (let x = -300; x < 1400; x += 200) G.l([obP(x, PODY, 520), obP(x, PODY, 620)], c.dim, 0.8);
  /* other pods on their way */
  for (let k = 0; k < 2; k++) { const u = ((G.t * 0.035 + k / 2 + seed) % 1) * 1500 - 300; if (Math.abs(obP(u, PODY, 0)[0] - TRACK[0]) > 120) { G.l([obP(u, PODY, 520), obP(u, PODY, HANG_Z + 66)], c.dim, 1); pod(G, u, PODY, HANG_Z, false, false); } }
}
/* where wafers come in from another plant: a door in the wall, crates waiting */
function dock(G) {
  const c = G.col;
  poly(G, obPoly([[10, 280, 0], [10, 450, 0], [10, 450, 230], [10, 280, 230]]), c.bg, c.line, 1);
  for (let k = 1; k < 6; k++) G.l(obPoly([[10, 280, 230 - k * 7], [10, 450, 230 - k * 7]]), c.dim, 0.7);
  obBox(G, 40, 320, 0, 120, 110, 12, c.line);
  obBox(G, 48, 328, 12, 104, 94, 74, c.warm, [c.warm, 0.12]);
  for (let k = 1; k < 3; k++) G.l(obPoly([[48, 328, 12 + k * 25], [152, 328, 12 + k * 25]]), c.warm, 0.7);
}
const dockShape = [closed(obPoly([[10, 280, 0], [10, 450, 0], [10, 450, 230], [10, 280, 230]])), obShape(40, 320, 0, 120, 110, 86)];

/* ======== steps: where the wafer goes, for how long, what is said, what changes ======== */
/* A station: at (places, as [x, y, z]), part (the part each numbered place is), robots (each with the places
   it reaches), hold (who holds the wafer while it rests at a place), free (moves the machine makes on its
   own), in (what the slice shows on arrival), steps. A step:
   S(caption, to, seconds, { via: [places on the way], sl: what the slice shows after, appear }) */
const S = (k, to, d, o) => Object.assign({ k, to, d, via: [] }, o);
/* steps that are not numbered in the picture: going back, and leaving */
const UNNUMBERED = ['handle.back', 'handle.done', 'handle.start', 'handle.loop', 'handle.out'];

/* the usual machine: front module with a robot, airlock, vacuum robot, chambers */
const AT = { pod: [PODX, PODY, PORT_Z + 32], efem: [340, 120, 150], lock: [416, 150, 134], xfer: [513, 175, 134], ch: [689, 170, 124], ch2: [515, 395, 134] };
const ROBOT_A = { id: 'A', b: [340, 150, 0], h: 140, L: 80, rest: [352, 196, 140], zone: ['pod', 'efem', 'lock'] };
const ROBOT_B = { id: 'B', b: [513, 200, 90], h: 122, L: 106, rest: [540, 150, 122], zone: ['lock', 'xfer', 'ch', 'ch2'] };
const PART = { pod: 'pod', efem: 'efem', lock: 'lock', xfer: 'xfer', ch: 'tool' };
const LIFT = { pod: 80, efem: 170, lock: 80, xfer: 130, ch: 230, ch2: 260 };
const vacuum = extra => ({
  at: AT, robots: [ROBOT_A, ROBOT_B], hold: { efem: 'A', xfer: 'B' }, part: PART, lift: LIFT,
  steps: [S('handle.arrive', 'pod', 3.2), S('handle.take', 'efem', 3.2), S('handle.lock', 'lock', 3.6), S('handle.move', 'xfer', 3.2)]
    .concat(extra, [S('handle.back', 'pod', 4, { via: ['xfer', 'lock', 'efem'] }), S('handle.done', 'pod', 3.6)])
});

const CFG = {
  crystal: { nowafer: true, lift: { sand: 70, melt: 40, ingot: 140 }, at: { sand: [200, 40, 40], melt: [500, 280, 85], ingot: [500, 280, 300] }, part: { sand: 'sand', melt: 'melt', ingot: 'ingot' }, robots: [], hold: {},
    steps: [S('proc.crystal.sand', 'sand', 6), S('proc.crystal.melt', 'melt', 6), S('proc.crystal.pull', 'ingot', 7)] },
  slice: { lift: { saw: 200, pol: 130, pod: 80 }, at: { saw: [165, 300, 200], pol: [540, 240, 112], efem: AT.efem, pod: AT.pod }, part: { saw: 'saw', pol: 'polish', pod: 'pod' }, in: 0, appear: 1, seed: 0.3,
    robots: [Object.assign({}, ROBOT_A, { L: 100, zone: ['pod', 'efem', 'pol'] })], hold: { efem: 'A' },
    steps: [S('proc.slice.saw', 'saw', 5.5), S('proc.slice.polish', 'pol', 6, { appear: true, sl: 0 }), S('handle.into', 'pod', 4, { via: ['efem'] }), S('handle.start', 'pod', 4)] },
  clean: { lift: LIFT, at: AT, robots: [ROBOT_A, ROBOT_B], hold: { efem: 'A', xfer: 'B' }, part: { pod: 'pod', efem: 'efem', lock: 'shelf', xfer: 'xfer', ch: 'chamber' }, in: 0, dust: true, seed: 0.5,
    steps: [S('handle.arrive', 'pod', 3.2), S('handle.take', 'efem', 3.2), S('handle.handoff', 'lock', 3.2), S('handle.inside', 'xfer', 3.2), S('proc.clean', 'ch', 6.5, { sl: 1 }), S('handle.back', 'pod', 4, { via: ['xfer', 'lock', 'efem'] }), S('handle.done', 'pod', 3.6)] },
  deposit: Object.assign(vacuum([S('proc.deposit', 'ch', 6.5, { sl: 2 })]), { in: 1, seed: 0.1 }),
  print: { lift: { pod: 80, efem: 170, coat: 150, dev: 150, scan: 300 }, at: { pod: AT.pod, efem: AT.efem, coat: [452, 120, 112], dev: [548, 120, 112], iface: [590, 230, 132], scan: [705, 165, 128] },
    part: { pod: 'pod', efem: 'efem', coat: 'coat', dev: 'develop', scan: 'scanner' }, in: 2, seed: 0.7, free: [['iface', 'scan']],
    robots: [Object.assign({}, ROBOT_A, { L: 116, zone: ['pod', 'efem', 'coat', 'dev'] }), { id: 'B', b: [500, 205, 0], h: 132, L: 62, rest: [520, 175, 132], zone: ['coat', 'dev', 'iface'] }], hold: { efem: 'A', iface: 'B' },
    steps: [S('handle.arrive', 'pod', 3.2), S('handle.take', 'efem', 3.2), S('proc.print.coat', 'coat', 5.5, { sl: 3 }), S('proc.print.expose', 'scan', 6.5, { via: ['iface'], sl: 4 }), S('proc.print.develop', 'dev', 5.5, { via: ['iface'], sl: 5 }), S('handle.back', 'pod', 3.6, { via: ['efem'] }), S('handle.done', 'pod', 3.6)] },
  etch: Object.assign(vacuum([S('proc.etch', 'ch', 8, { sl: 6 })]), { in: 5, seed: 0.9,
    at: { pod: [PODX, PODY, PORT_Z + 32], efem: [300, 150, 140], lock: [370, 208, 104], xfer: [480, 230, 114], ch: [619, 230, 106] },
    robots: [{ id: 'A', rail: [150, 312], b: [300, 150, 14], h: 112, L: 58, rest: [306, 168, 122], zone: ['pod', 'efem', 'lock'] },
      { id: 'B', b: [480, 230, 62], h: 108, L: 74, rest: [470, 205, 108], zone: ['lock', 'xfer', 'ch'] }] }),
  implant: Object.assign(vacuum([S('proc.implant.beam', 'ch', 6.5, { sl: 7 }), S('proc.implant.heat', 'ch2', 5)]), { in: 6, seed: 0.2, part: Object.assign({}, PART, { ch2: 'heater' }) }),
  wires: { lift: { pod: 80, efem: 170, plate: 150, pol: 170 }, at: { pod: AT.pod, efem: AT.efem, plate: [470, 120, 112], hand: [440, 220, 136], pol: [690, 170, 132] },
    part: { pod: 'pod', efem: 'efem', plate: 'plating', pol: 'polish' }, in: 7, seed: 0.4,
    robots: [Object.assign({}, ROBOT_A, { L: 82, zone: ['pod', 'efem', 'plate', 'hand'] }), { id: 'B', b: [560, 240, 0], h: 134, L: 82, rest: [580, 200, 134], zone: ['plate', 'hand', 'pol'] }], hold: { efem: 'A' },
    steps: [S('handle.arrive', 'pod', 3.2), S('handle.take', 'efem', 3.2), S('proc.wires.plate', 'plate', 6, { sl: 8 }), S('proc.wires.polish', 'pol', 6.5, { sl: 9 }), S('handle.back', 'pod', 4, { via: ['hand', 'efem'] }), S('handle.loop', 'pod', 4.5)] },
  test: { leaves: 9, lift: { pod: 80, efem: 170, lock: 80, probe: 220 }, at: { pod: AT.pod, efem: AT.efem, lock: AT.lock, probe: [585, 175, 118] }, part: { pod: 'pod', efem: 'efem', lock: 'shelf', probe: 'prober' }, in: 9, seed: 0.6,
    robots: [ROBOT_A, { id: 'B', b: [500, 250, 0], h: 130, L: 72, rest: [520, 210, 130], zone: ['lock', 'probe'] }], hold: { efem: 'A' },
    steps: [S('handle.arrive', 'pod', 3.2), S('handle.take', 'efem', 3.2), S('handle.handoff', 'lock', 3.2), S('proc.test', 'probe', 8, { sl: 10 }), S('handle.back', 'pod', 4, { via: ['lock', 'efem'] }), S('handle.done', 'pod', 3.6)] },
  pkg: { lift: { pod: 80, efem: 170, saw: 140, head: 120, sub: 190, tray: 110 }, at: { pod: AT.pod, efem: AT.efem, saw: [470, 150, 104], head: [600, 185, 230], sub: [680, 175, 132], tray: [840, 70, 70] },
    part: { pod: 'pod', efem: 'efem', saw: 'saw', head: 'die', sub: 'substrate', tray: 'tray' }, in: 9, chip: 3, seed: 0.8,
    robots: [Object.assign({}, ROBOT_A, { L: 90, zone: ['pod', 'efem', 'saw'] }), { id: 'P', gantry: true, x0: 420, x1: 860, y: 175, h: 300, rest: [560, 175, 230], zone: ['saw', 'head', 'sub', 'tray'] }], hold: { efem: 'A', head: 'P' },
    steps: [S('handle.arrive', 'pod', 3.2), S('handle.take', 'efem', 3.2), S('proc.pkg.saw', 'saw', 6, { sl: 11 }), S('proc.pkg.pick', 'head', 4.5), S('proc.pkg.bond', 'sub', 6, { sl: 12 }), S('handle.packed', 'tray', 4.5, { sl: 13 })] },
  ship: { home: 'tray', lift: { tray: 80, sock: 150, box: 120 }, at: { tray: [PODX, PODY, PORT_Z + 13], sock: [480, 170, 122], box: [690, 180, 92], out: [837, 72, 52] }, part: { tray: 'tray', sock: 'trays', box: 'boxes' }, in: 13, chip: 0, seed: 0.15,
    robots: [{ id: 'P', gantry: true, x0: 200, x1: 860, y: 170, h: 300, rest: [380, 170, 230], zone: ['tray', 'sock', 'box', 'out'] }], hold: {},
    steps: [S('handle.trays', 'tray', 3.6), S('proc.ship.test', 'sock', 6.5), S('proc.ship.pack', 'box', 5.5), S('handle.out', 'out', 5)] }
};
/* totals, numbers, and the level the slice shows when the wafer leaves */
Object.values(CFG).forEach(cfg => {
  cfg.home = cfg.home || 'pod'; cfg.seed = cfg.seed || 0;
  cfg.tot = cfg.steps.reduce((a, s) => a + s.d, 0);
  let n = 0; cfg.num = cfg.steps.map(s => (UNNUMBERED.includes(s.k) ? 0 : ++n));
  cfg.out = cfg.leaves != null ? cfg.leaves : cfg.steps.reduce((a, s) => (s.sl != null ? s.sl : a), cfg.in);
});
/* for the tests: every station's steps */
export const JOURNEY = CFG;
/* where a step starts, in seconds from arriving: tapping a step replays it from there */
export const stepStart = (id, i) => CFG[id] ? CFG[id].steps.slice(0, i).reduce((a, s) => a + s.d, 0) + 0.01 : 0;

/* where the wafer is at time r (seconds into the station), who holds it, and what the slice shows */
export function flow(cfg, run) {
  const st = cfg.steps; let i = 0, r;
  if (run < 0) { i = st.findIndex(s => s.k.startsWith('proc')); r = st[i].d * 0.75; }
  else { r = ((run % cfg.tot) + cfg.tot) % cfg.tot; while (i < st.length - 1 && r >= st[i].d) { r -= st[i].d; i++; } }
  const s = st[i], from = s.appear || i === 0 ? s.to : st[(i + st.length - 1) % st.length].to, path = [from].concat(s.via, [s.to]);
  const segs = path.length - 1, mv = Math.min(s.d * 0.5, 0.6 + 0.6 * segs), u = s.appear ? 1 : sm(r / mv);
  const fp = u * segs, k = Math.min(segs - 1, Math.floor(fp)), g = fp - k, A = cfg.at[path[k]], B = cfg.at[path[k + 1]];
  const moving = u < 1 && path[k] !== path[k + 1];
  let p = [A[0] + (B[0] - A[0]) * g, A[1] + (B[1] - A[1]) * g, A[2] + (B[2] - A[2]) * g + (moving ? Math.sin(g * Math.PI) * 10 : 0)];
  let hold = null;
  if (moving) { const R = cfg.robots.find(R => R.zone.includes(path[k]) && R.zone.includes(path[k + 1])); hold = R ? R.id : null; }
  else hold = cfg.hold[s.to] || null;
  if (cfg.nowafer || i < (cfg.appear || 0)) p = null;
  const h = cfg.at[cfg.home], home = !!p && !!h && Math.abs(p[0] - h[0]) + Math.abs(p[1] - h[1]) + Math.abs(p[2] - h[2]) < 1;
  /* the slice: the level after the last step that changed it; the step doing it now animates */
  let sl = cfg.in, was = cfg.in, a = 1;
  for (let j = 0; j <= i; j++) if (st[j].sl != null) { was = sl; sl = st[j].sl; a = j === i ? clamp((r - mv) / Math.max(0.5, s.d - mv - 0.8), 0, 1) : 1; }
  if (run < 0) a = 0.6;
  return { i, s, r, p, hold, home, moving, open: !home, proc: s.k.startsWith('proc') && r > mv, pu: clamp((r - mv) / (s.d - mv), 0, 1), sl, was, a, chip: cfg.chip != null && i >= cfg.chip };
}
/* the station's clock: yours, from when you arrived; anyone else's, running on its own */
const clockOf = (G, cfg) => (G.mine ? (G.run == null ? 0 : G.run) : G.t * 0.8 + cfg.seed * cfg.tot);

/* the robots and the wafer: robots first, someone else's wafer inside the machine, yours on top */
function robots(G, cfg, f, only) {
  cfg.robots.forEach(R => { if (only && !only.includes(R.id)) return; const hand = f.p && f.hold === R.id ? f.p : R.rest; (R.gantry ? head : arm)(G, R, hand); });
}
function theirs(G, f) { if (!G.mine && f.p && !f.home) piece(G, f.p, false, f.chip); }
function yours(G, f) { if (G.mine && f.p && !f.home) piece(G, f.p, true, f.chip); }
/* the door the pod docks on: someone else's pod, unless yours is coming */
function docked(G, cfg, f) { if (G.mine) return; if (cfg.home === 'tray') tray(G, PODX, PODY, PORT_Z, false, true); else pod(G, PODX, PODY, PORT_Z, false, f.open); }

/* the numbered route: where the wafer goes, in order; the step under way is lit */
function route(G, id, cfg, f) {
  /* the steps are listed under the picture now (drawJourney), and the current one is lit there */
  if (!G.primary || true) return;
  const c = G.col, ctx = G.ctx, R = 10.5 / G.s, live = G.mine && G.run != null, pts = [];
  cfg.steps.forEach((s, i) => { if (cfg.num[i]) pts.push(cfg.at[s.to]); });
  G.a(0.5); ctx.setLineDash([4 / G.s, 5 / G.s]); G.l(obPoly(pts), c.warm, 1.2); ctx.setLineDash([]); G.a(1);
  cfg.steps.forEach((s, i) => {
    const n = cfg.num[i]; if (!n) return;
    const a = cfg.at[s.to], w = obP(a[0], a[1], a[2]), q = obP(a[0], a[1], a[2] + ((cfg.lift || {})[s.to] || 80)), now = live && i === f.i, past = live && i < f.i;
    G.l([w, q], now ? c.warm : c.line, now ? 1.5 : 0.8);
    G.c(q[0], q[1], R, now ? c.warm : past ? c.up : c.bg, now ? c.warm : c.hi, 1.2);
    ctx.save(); ctx.font = '700 ' + 11.5 / G.s + 'px ' + MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = now ? c.bg : c.hi; ctx.fillText(n, q[0], q[1] + 0.5 / G.s); ctx.restore();
    if (cfg.part[s.to] && roomy(G)) { const left = q[0] > 760; G.label(cfg.part[s.to], q[0] + (left ? -1 : 1) * (R + 4 / G.s), q[1] + 4 / G.s, left ? 'right' : 'left'); }
  });
}

/* ---- the usual machine, drawn: door, front module, airlock (or shelf), inner robot, chamber ---- */
function frontModule(G, cfg, f) {
  const c = G.col;
  port(G); docked(G, cfg, f);
  const fd = obCut(G, 295, 0, 0, 90, 250, 270, c.line);
  robots(G, cfg, f, ['A']);
  fd();
  obBox(G, 295, 0, 270, 90, 250, 14, c.line, [c.cool, 0.18]);
}
const efemShape = obShape(295, 0, 0, 90, 250, 284);
function airlock(G, f, vac) {
  const c = G.col;
  obBox(G, 392, 110, 0, 48, 80, 100, c.line);
  const ld = obCut(G, 392, 110, 100, 48, 80, 66, vac ? c.cool : c.line);
  const pumping = vac && f.s.k === 'handle.lock' && f.r > 0.9;
  if (pumping) { G.a(0.25 + 0.15 * Math.sin(G.t * 6)); poly(G, obPoly([[392, 110, 100], [440, 110, 100], [440, 190, 100], [392, 190, 100]]), c.cool); G.a(1);
    for (let k = 0; k < 4; k++) { const u = (G.t * 1.2 + k / 4) % 1, q = obP(416, 150, 96 - u * 80); G.a(1 - u); G.c(q[0], q[1], 2.4, c.cool); G.a(1); } }
  ld();
}
const lockShape = obShape(392, 110, 0, 48, 80, 166);
function transfer(G, cfg, f) {
  const c = G.col;
  obBox(G, 448, 60, 0, 130, 240, 90, c.line);
  const td = obCut(G, 448, 60, 90, 130, 240, 80, c.line);
  robots(G, cfg, f, ['B']);
  td();
}
const xferShape = obShape(448, 60, 0, 130, 240, 170);
const CH = [588, 40, 0, 202, 260, 300], chShape = obShape(...CH);
function chamber(G, inner, stroke) {
  const c = G.col, cd = obCut(G, ...CH, stroke || c.line);
  obBox(G, 649, 130, 0, 80, 80, 104, c.line);
  disc(G, 689, 170, 104, 46, c.up, c.line, 1);
  inner();
  return cd;
}
const toolShapes = [efemShape, lockShape, xferShape, chShape];

/* a station built from the usual machine; draw(G, f) adds what is particular to it */
function cluster(id, o) {
  const cfg = CFG[id], parts = { pod: [portShape], efem: [efemShape], xfer: [xferShape], tool: [chShape] };
  parts[o.vacuum ? 'lock' : 'shelf'] = [lockShape];
  return {
    parts: Object.assign(parts, o.parts),
    draw(G) {
      const c = G.col, f = flow(cfg, clockOf(G, cfg));
      hall(G, 'fab', o.from, cfg.seed);
      if (o.from) dock(G);
      if (o.back) o.back(G, f);
      frontModule(G, cfg, f);
      airlock(G, f, o.vacuum);
      transfer(G, cfg, f);
      const cd = chamber(G, () => { theirs(G, f); if (o.inner) o.inner(G, f); }, o.stroke && o.stroke(c));
      cd();
      if (o.front) o.front(G, f);
      route(G, id, cfg, f);
      yours(G, f);
      if (o.labels) o.labels(G, f);
    }
  };
}

/* ======== the stations ======== */

/* ---- crystal: sand purified, melted, and pulled up as one perfect crystal (a wafer plant) ---- */
const stCrystal = {
  parts: { sand: [{ c: [obP(200, 40, 0)[0], obP(200, 40, 0)[1] - 30, 80] }], furnace: [obShape(360, 140, 0, 280, 280, 480)], melt: [obShape(420, 220, 60, 160, 120, 50)], ingot: [obShape(470, 250, 120, 60, 60, 260)] },
  draw(G) {
    const c = G.col, cfg = CFG.crystal, f = flow(cfg, clockOf(G, cfg)), live = G.mine && G.run != null;
    hall(G, 'wafers', false, 0.25);
    const sp = obP(200, 40, 0);
    poly(G, [[sp[0] - 80, sp[1]], [sp[0] - 40, sp[1] - 50], [sp[0] + 30, sp[1] - 56], [sp[0] + 80, sp[1]]], c.up, c.warm, 1);
    for (let i = 0; i < 24; i++) G.c(sp[0] - 60 + rnd(i, 41) * 120, sp[1] - 40 + rnd(i, 42) * 36, 2.5 + rnd(i, 43) * 2, c.warm);
    const done = obCut(G, 360, 140, 0, 280, 280, 480, c.line);
    obBox(G, 420, 220, 20, 160, 120, 40, c.warm);
    const glow = !live || f.i >= 1;
    G.a(glow ? 0.55 + 0.25 * Math.sin(G.t * 2) : 0.15); poly(G, obPoly([[425, 225, 62], [575, 225, 62], [575, 335, 62], [425, 335, 62]]), c.warm); G.a(1);
    /* the crystal grows as it is pulled; while you watch the pull, it grows in front of you */
    const grow = live ? (f.i < 2 ? 0 : f.pu) : (G.t * 0.05) % 1, lift = 70 + 60 * grow, len = 30 + 230 * grow;
    if (len > 32 || !live) obBox(G, 470, 250, lift, 60, 60, len, c.hi);
    for (let k = 0; k < 5; k++) { const z = lift + 20 + ((G.t * 30 + k * 52) % Math.max(20, len - 20)); if (z < lift + len) G.l(obPoly([[470, 250, z], [530, 250, z]]), c.dim, 0.8); }
    G.l([obP(500, 280, lift + len), obP(500, 280, 470)], c.hi, 1.2);
    done();
    route(G, 'crystal', cfg, f);
    label(G, 'furnace', [360, 140, 480], -8, 0, 'right');
  }
};

/* ---- slice: sawn into wafers, polished; your wafer goes into its pod and the journey starts ---- */
const stSlice = {
  parts: { ingot: [obShape(140, 270, 40, 50, 50, 260)], saw: [obShape(80, 200, 0, 170, 170, 340)], wafers: [obShape(715, 195, 0, 90, 90, 80)], polish: [obShape(430, 120, 0, 220, 240, 150)], pod: [portShape], efem: [efemShape] },
  draw(G) {
    const c = G.col, cfg = CFG.slice, f = flow(cfg, clockOf(G, cfg)), live = G.mine && G.run != null;
    hall(G, 'wafers', false, 0.65);
    const sd = obCut(G, 80, 200, 0, 170, 170, 340, c.line);
    obBox(G, 140, 270, 40, 50, 50, 260, c.hi);
    const run = live ? (f.i === 0 ? f.pu : 1) : (G.t * 0.4) % 1;
    for (let k = 0; k < 9; k++) G.l(obPoly([[80, 220, 60 + k * 28], [250, 350, 60 + k * 28]]), k / 9 < run ? c.warm : c.cool, 0.9);
    sd();
    /* polished wafers, stacked */
    for (let k = 0; k < 6; k++) disc(G, 760, 240, 8 + k * 12, 44, faces(c)[0], c.line, 0.8);
    port(G); docked(G, cfg, f);
    const fd = obCut(G, 295, 0, 0, 90, 250, 270, c.line); fd();
    const pd = obCut(G, 430, 120, 0, 220, 240, 150, c.line);
    disc(G, 540, 240, 100, 90, c.up, c.hi, 1);
    spin(G, 540, 240, 100, 80, G.t * 1.6, c.dim);
    theirs(G, f);
    pd();
    robots(G, cfg, f);
    route(G, 'slice', cfg, f);
    yours(G, f);
    label(G, 'wafers', [805, 195, 80], 8, 0); label(G, 'ingot', [190, 270, 300], 8, 0);
  }
};

/* ---- clean: entering the factory; every layer starts with a wash ---- */
const stClean = cluster('clean', {
  from: true,
  parts: { chamber: [chShape], tool: toolShapes, filters: [closed(obPoly([[-400, BACK, 360], [1400, BACK, 360], [1400, BACK, 400], [-400, BACK, 400]]))], track: [{ p: [[0, TRACK[1]], [1000, TRACK[1]]] }], dock: dockShape },
  stroke: c => c.cool,
  inner(G, f) {
    const c = G.col, on = f.proc || !G.mine;
    /* the spray arm sweeps across the spinning wafer */
    const a = on ? Math.sin(G.t * 1.5) * 0.6 : 0.9, nx = 689 + Math.cos(a) * 60, ny = 170 + Math.sin(a) * 60;
    G.l(obPoly([[760, 280, 230], [nx, ny, 230], [nx, ny, 200]]), c.line, 3);
    if (on) spin(G, 689, 170, 106, 40, G.t * 5, c.dim);
    if (on) for (let k = 0; k < 8; k++) { const u = (G.t * 2.2 + k / 8) % 1, q = obP(nx + (rnd(k, 2) - 0.5) * 16, ny, 200 - u * 70); G.c(q[0], q[1], 2.4, c.cool); }
  },
  labels(G) { name(G, 'filters', 40, obP(0, BACK, 400)[1] - 8); name(G, 'track', 40, TRACK[1] - 10); label(G, 'dock', [10, 280, 250], 6, 0); }
});

/* ---- deposit: a thin new film laid over the whole wafer, from gases ---- */
const stDeposit = cluster('deposit', {
  vacuum: true,
  parts: { gas: [obShape(610, 330, 0, 110, 110, 300)], heater: [obShape(649, 130, 0, 80, 80, 104)] },
  back(G) {
    const c = G.col;
    obBox(G, 450, 330, 0, 130, 130, 230, c.line);
    obBox(G, 610, 330, 0, 110, 110, 300, c.line);
    for (let k = 0; k < 4; k++) G.l(obPoly([[625 + k * 26, 330, 300], [625 + k * 26, 330, 330], [625 + k * 26, 190, 330], [625 + k * 26, 190, 300]]), c.cool, 1.2);
  },
  inner(G, f) {
    const c = G.col, on = f.proc || !G.mine;
    G.a(on ? 0.3 + 0.15 * Math.sin(G.t * 2) : 0.08); disc(G, 689, 170, 104, 46, c.warm); G.a(1);
    obBox(G, 635, 120, 250, 110, 100, 14, c.line);
    if (on) for (let k = 0; k < 22; k++) { const u = (G.t * 0.4 + rnd(k, 3)) % 1, q = obP(645 + rnd(k, 4) * 90, 130 + rnd(k, 5) * 80, 248 - u * 118); G.a(1 - u * 0.5); G.c(q[0], q[1], 2.6, c.cool); G.a(1); }
  },
  labels(G) { label(G, 'gas', [720, 330, 300], 8, 0); }
});

/* ---- print: coat, print with light through a mask, develop: a coating track joined to the scanner ---- */
const SC = [610, 60, 0, 190, 210, 450];
const stPrint = {
  parts: { pod: [portShape], efem: [efemShape], coat: [obShape(400, 40, 0, 100, 200, 200)], develop: [obShape(500, 40, 0, 100, 200, 200)], scanner: [obShape(...SC)], light: [{ p: [obP(765, 240, 440), obP(705, 165, 440), obP(705, 165, 140)] }], mask: [obShape(655, 125, 380, 100, 80, 12)] },
  draw(G) {
    const c = G.col, cfg = CFG.print, f = flow(cfg, clockOf(G, cfg)), k = f.s.k;
    hall(G, 'fab', false, 0.75);
    frontModule(G, cfg, f);
    /* the coating track: a spinning bowl to coat, another to develop, a robot between */
    const td = obCut(G, 400, 40, 0, 200, 200, 200, c.line);
    obBox(G, 422, 90, 0, 60, 60, 96, c.line); obBox(G, 518, 90, 0, 60, 60, 96, c.line);
    disc(G, 452, 120, 104, 40, c.lo, c.line, 1); disc(G, 548, 120, 104, 40, c.lo, c.line, 1);
    if (!G.mine || k === 'proc.print.coat') { spin(G, 452, 120, 114, 30, G.t * 6, c.warm); G.l([obP(452, 120, 190), obP(452, 120, 150)], c.warm, 2); }
    if (!G.mine || k === 'proc.print.develop') for (let j = 0; j < 8; j++) { const u = (G.t * 1.4 + j / 8) % 1, q = obP(536 + (j % 4) * 8, 120, 170 - u * 50); G.c(q[0], q[1], 2.2, c.cool); }
    robots(G, cfg, f, ['B']);
    theirs(G, f);
    td();
    /* the scanner: light from the source, through the mask, shrunk by the lenses onto the wafer */
    const sd = obCut(G, ...SC, c.warm);
    obBox(G, 740, 220, 290, 50, 40, 130, c.line);
    obBox(G, 665, 125, 0, 80, 80, 116, c.line); disc(G, 705, 165, 116, 44, c.up, c.line, 1);
    obBox(G, 680, 145, 200, 50, 40, 170, c.line, [c.cool, 0.15]);
    obBox(G, 655, 125, 380, 100, 80, 12, c.hi);
    for (let j = 0; j < 5; j++) obBox(G, 662 + j * 19, 133, 392, 9, 64, 2, c.lo);
    const on = G.mine ? k === 'proc.print.expose' && f.proc : (G.t * 0.8) % 1 < 0.6;
    G.a(on ? 0.85 : 0.15); G.l([obP(765, 240, 440), obP(705, 165, 440), obP(705, 165, 380)], c.warm, 3); G.l([obP(705, 165, 200), obP(705, 165, 132)], c.warm, 3); G.a(1);
    if (on && G.mine) { const step = Math.floor(G.t * 3) % 9, q = obP(705 - 16 + (step % 3) * 16, 165 - 16 + Math.floor(step / 3) * 16, 130); G.a(0.85); G.r(q[0] - 5, q[1] - 3, 10, 6, c.warm); G.a(1); }
    sd();
    route(G, 'print', cfg, f);
    yours(G, f);
    label(G, 'mask', [655, 125, 392], -8, 0, 'right'); label(G, 'light', [790, 240, 440], 8, -6);
  }
};

/* ---- etch: plasma cuts the film wherever the pattern left it bare; people keep the machines in tune ----
   Drawn as a real cluster tool, solid, in the site's crafted style (src/app/solid.js): three load ports, a
   front module with a robot on a rail behind its window, two airlocks, a six-sided vacuum chamber with its
   lid off and a robot inside, and four process chambers round it. The one that etches your wafer is cut
   open at the front; the others work on other wafers. Pumps under the chambers, gas lines from the gas
   cabinet, an RF generator, a stack light, a screen, a technician. */
const K = kit(obP);
const HX = [480, 230], HR = 80, HROT = Math.PI / 6;
const ECH = [[619, 230], [549, 350], [410, 350]];   /* yours (cut open), then the others */
const EFEM = [110, 105, 0, 220, 85, 190], LOCKS = [[340, 190], [340, 232]];
/* the short passage from the middle chamber to a process chamber, with its gate (a slit valve) */
function neck(G, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, p0 = [a[0] + ux * 60, a[1] + uy * 60], p1 = [a[0] + ux * (L - 50), a[1] + uy * (L - 50)];
  const nx = -uy * 16, ny = ux * 16, T = tones(G.col);
  K.prism(G, [[p0[0] - nx, p0[1] - ny], [p1[0] - nx, p1[1] - ny], [p1[0] + nx, p1[1] + ny], [p0[0] + nx, p0[1] + ny]].sort(() => 0), 76, 34, {});
  const m = [a[0] + ux * (L * 0.5), a[1] + uy * (L * 0.5)];
  K.box(G, m[0] - 10, m[1] - 10, 72, 20, 20, 48, { tone: 'base' });
}
const etchShapes = {
  pod: [portShape],
  efem: [hull([[110, 105, 0], [330, 105, 0], [330, 190, 0], [330, 190, 206], [110, 190, 206], [110, 105, 206]])],
  lock: LOCKS.map(([x, y]) => hull([[x, y, 0], [x + 60, y, 0], [x + 60, y + 36, 0], [x + 60, y + 36, 140], [x, y + 36, 140], [x, y, 140]])),
  xfer: [hull(K.hexPlan(HX[0], HX[1], HR, HROT).flatMap(([x, y]) => [[x, y, 0], [x, y, 118]]))],
  tool: [cylHull(ECH[0][0], ECH[0][1], 0, 58, 176)],
  plasma: [cylHull(ECH[0][0], ECH[0][1], 104, 40, 50)],
  people: [hull([[788, 22, 0], [812, 22, 0], [812, 38, 0], [812, 38, 150], [788, 38, 150], [788, 22, 150]])]
};
function etchChamber(G, cx, cy, mine, f, wafer) {
  const c = G.col, T = tones(c), on = f.proc || !G.mine;
  /* legs and the pump under it */
  K.shadow(G, Array.from({ length: 16 }, (_, i) => [cx + Math.cos(i / 16 * 6.2832) * 62, cy + Math.sin(i / 16 * 6.2832) * 62]), 0, 18);
  K.cyl(G, cx + 8, cy + 16, 0, 17, 58, { tone: 'base' }); K.disc(G, cx + 8, cy + 16, 58, 8, T.base.side);
  for (const [dx, dy] of [[-40, -28], [40, -28], [0, 42]]) K.box(G, cx + dx - 4, cy + dy - 4, 0, 8, 8, 60, { tone: 'base' });
  if (mine) {
    K.cutCyl(G, cx, cy, 60, 58, 116, 96, () => {
      K.cyl(G, cx, cy, 62, 40, 40, { tone: 'base' });                       /* the chuck that holds the wafer */
      K.disc(G, cx, cy, 102, 36, T.base.top, T.edge);
      if (wafer) wafer();
      /* the plasma: a glowing gas between the window above and the wafer */
      const pl = G.ctx, gl = on ? 0.28 + 0.12 * Math.sin(G.t * 5) : 0.04, top = K.P(cx, cy, 160), bot = K.P(cx, cy, 106);
      const gr = pl.createLinearGradient(0, top[1], 0, bot[1]); gr.addColorStop(0, mix(c.red, c.hi, 0.2)); gr.addColorStop(1, c.red);
      pl.save(); pl.globalAlpha = gl * G.base; K.fill(G, K.arc(cx, cy, 160, 38, K.A1, K.A2 + 6.2832, 30).concat(K.arc(cx, cy, 106, 38, K.A2 + 6.2832, K.A1, 30)), gr); pl.restore();
      if (on) for (let k = 0; k < 14; k++) { const u = (G.t * 1.6 + rnd(k, 7)) % 1, a = rnd(k, 8) * 6.2832, rr2 = rnd(k, 9) * 30, q = K.P(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2, 156 - u * 50); G.l([q, [q[0], q[1] + 7]], c.red, 1.3); }
      K.disc(G, cx, cy, 166, 50, null, mix(c.warm, c.bg, 0.3), 1);         /* the ceramic window, seen edge-on behind */
    });
    /* the coil that makes the plasma, above the window */
    for (let k = 0; k < 3; k++) G.l(K.arc(cx, cy, 182 + k * 5, 38 - k * 9, K.A1, K.A2, 20), c.warm, 2);
  } else {
    K.cyl(G, cx, cy, 60, 58, 110, {});
    G.l(K.arc(cx, cy, 120, 58, K.A2, K.A1 + 6.2832, 28), T.seam, 0.7);
    K.cyl(G, cx, cy, 170, 50, 8, { tone: 'base' });
    for (let k = 0; k < 2; k++) G.l(K.arc(cx, cy, 182 + k * 5, 36 - k * 10, K.A2, K.A1 + 6.2832, 20), mix(c.warm, c.bg, 0.25), 1.6);
    K.box(G, cx - 22, cy - 18, 178, 44, 36, 34, {});                         /* the RF match box */
    K.onFront(G, cx - 14, cy - 18, 188, 10, 6, on && (G.t * 2 + cx) % 2 < 1.4 ? c.grn : mix(c.grn, c.bg, 0.6));
  }
}
const stEtch = {
  parts: etchShapes,
  draw(G) {
    const c = G.col, T = tones(c), cfg = CFG.etch, f = flow(cfg, clockOf(G, cfg)), p = f.p;
    const at = (x0, x1, y0, y1) => p && !f.home && p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
    const w = () => piece(G, p, G.mine, f.chip);
    hall(G, 'fab', false, cfg.seed);
    /* the gas cabinet at the back, and its lines to every chamber */
    K.shadow(G, K.rectPlan(150, 330, 90, 100), 0, 18);
    K.box(G, 150, 330, 0, 90, 100, 270, {});
    for (let k = 1; k < 4; k++) K.seamH(G, 150, 330, 90, k * 66);
    K.onFront(G, 162, 330, 206, 30, 18, c.dark ? mix(c.cool, c.bg, 0.55) : mix(c.cool, '#ffffff', 0.6), T.edge, 0.6); /* i18n-ok: a colour */
    ECH.forEach(([cx, cy], i) => K.pipe(G, [[240, 380 - i * 8, 250 - i * 10], [cx - 20, 380 - i * 8, 250 - i * 10], [cx - 20, cy + 26, 250 - i * 10], [cx - 20, cy + 26, 196]], 2));
    /* the chambers at the back, each joined to the middle by a slit valve */
    neck(G, HX, ECH[2]); neck(G, HX, ECH[1]);
    etchChamber(G, ECH[2][0], ECH[2][1], false, f); etchChamber(G, ECH[1][0], ECH[1][1], false, f);
    /* the vacuum chamber in the middle, lid off, with its robot */
    K.shadow(G, K.hexPlan(HX[0], HX[1], HR + 6, HROT), 0, 16);
    K.prism(G, K.hexPlan(HX[0], HX[1], HR - 10, HROT), 0, 60, { tone: 'base' });
    K.prism(G, K.hexPlan(HX[0], HX[1], HR, HROT), 60, 58, { open: () => { arm2(G, cfg.robots[1], f); if (at(400, 556, 150, 310)) w(); } });
    /* your chamber, to the right, cut open, joined to the middle by its slit valve */
    neck(G, HX, ECH[0]);
    etchChamber(G, ECH[0][0], ECH[0][1], true, f, at(560, 680, 170, 290) ? w : null);
    /* the two airlocks, between the front module and the vacuum: small boxes with a window on top */
    LOCKS.slice().reverse().forEach(([x, y], j) => {
      const i = 1 - j, pumping = i === 0 && G.mine && f.s.k === 'handle.lock' && f.r > 0.9;
      K.box(G, x, y, 0, 60, 36, 64, { tone: 'base' });
      K.box(G, x, y, 64, 60, 36, 72, { top: false });
      K.onTop(G, x + 4, y + 4, 136, 52, 28, pumping ? mix(c.cool, c.bg, c.dark ? 0.4 : 0.1) : T.inner.top, T.edge, 0.8);
      if (i === 0 && at(334, 404, 186, 230)) w();
      K.onTop(G, x, y, 136, 60, 36, null, T.edge, 0.8);
      K.onFront(G, x + 8, y, 100, 26, 7, pumping && (G.t * 4) % 1 < 0.5 ? c.cool : T.seam);
    });
    /* the front module: a clean little room with a robot on a rail, seen through its window */
    const [ex, ey, , ew, ed, eh] = EFEM, cx2 = G.ctx;
    K.shadow(G, K.rectPlan(ex, ey, ew, ed), 0, 16);
    K.onFront(G, ex, ey + ed, 0, ew, eh, T.inner.front, T.edge);
    K.onTop(G, ex, ey, 2, ew, ed, T.inner.top);
    K.box(G, 130, 142, 6, 190, 14, 8, { tone: 'base' });
    armA(G, cfg.robots[0], f);
    if (at(ex, ex + ew + 6, ey - 4, ey + ed + 2)) w();
    const win = [ex + 36, 54, ew - 52, 118];
    const fr = [K.P(ex, ey, 0), K.P(ex + ew, ey, 0), K.P(ex + ew, ey, eh), K.P(ex, ey, eh)], wp = [K.P(win[0], ey, win[1]), K.P(win[0] + win[2], ey, win[1]), K.P(win[0] + win[2], ey, win[1] + win[3]), K.P(win[0], ey, win[1] + win[3])];
    cx2.beginPath(); fr.forEach((q, i) => (i ? cx2.lineTo(q[0], q[1]) : cx2.moveTo(q[0], q[1]))); cx2.closePath(); wp.forEach((q, i) => (i ? cx2.lineTo(q[0], q[1]) : cx2.moveTo(q[0], q[1]))); cx2.closePath();
    cx2.fillStyle = T.body.front; cx2.fill('evenodd'); cx2.strokeStyle = T.edge; cx2.lineWidth = G.lw(0.8); cx2.stroke();
    cx2.save(); cx2.globalAlpha = 0.06 * G.base; K.fill(G, wp, c.hi); cx2.restore();
    K.fill(G, [K.P(ex + ew, ey, 0), K.P(ex + ew, ey + ed, 0), K.P(ex + ew, ey + ed, eh), K.P(ex + ew, ey, eh)], T.body.side, T.edge);
    K.box(G, ex, ey, eh, ew, ed, 16, {});
    for (let i = 0; i < 11; i++) G.l([K.P(ex + 14 + i * 18, ey, eh + 4), K.P(ex + 14 + i * 18, ey, eh + 12)], T.seam, 0.7);
    K.tower(G, ex + 14, ey + ed - 14, eh + 16, G.mine ? (f.proc ? 2 : 1) : 2);
    /* the load ports, and the pods on them */
    K.box(G, 115, 22, 0, 80, 76, PORT_Z, { tone: 'base' }); pod(G, 155, PODY, PORT_Z, false, false);
    K.box(G, 205, 22, 0, 80, 76, PORT_Z, { tone: 'base' }); docked(G, cfg, f);
    if (p && !f.home && p[1] < ey - 4) w();
    /* a screen on a stand showing the plasma's light as the etch goes on; the RF generator; the technician */
    K.shadow(G, K.rectPlan(690, 70, 70, 60), 0, 14);
    K.box(G, 690, 70, 0, 70, 60, 160, {});
    for (let k = 0; k < 4; k++) { K.seamH(G, 690, 70, 70, 28 + k * 34); K.onFront(G, 696, 70, 36 + k * 34, 8, 5, k === 1 && f.proc ? c.warm : T.seam); }
    K.box(G, 742, 14, 0, 8, 8, 120, { tone: 'base' });
    K.box(G, 716, 8, 120, 60, 10, 42, {});
    K.onFront(G, 720, 8, 124, 52, 34, c.dark ? c.bg : mix(c.lo, c.line, 0.05));
    const tr = []; for (let i = 0; i <= 20; i++) { const u = i / 20, v = 0.2 + 0.6 * Math.exp(-((u - 0.55) ** 2) * 30) * (G.mine && !f.proc ? 0.15 : 1); tr.push(K.P(722 + u * 48, 8, 127 + v * 28)); }
    G.l(tr, c.grn, 1);
    K.person(G, 800, 30);
  }
};

/* ---- implant: atoms of another element shot into the silicon, then a flash of heat heals the crystal ---- */
const stImplant = cluster('implant', {
  vacuum: true,
  parts: { beam: [{ p: [obP(650, 420, 260), obP(745, 380, 260), obP(689, 170, 140)] }], magnet: [obShape(715, 340, 220, 60, 70, 80)], heater: [obShape(450, 330, 0, 130, 130, 230)] },
  back(G, f) {
    const c = G.col, on = G.mine ? f.s.k === 'proc.implant.heat' && f.proc : true;
    obBox(G, 600, 390, 0, 80, 70, 300, c.line);
    obBox(G, 715, 340, 220, 60, 70, 80, c.cool, [c.cool, 0.25]);
    obBox(G, 450, 330, 0, 130, 130, 230, c.warm);
    G.a(on ? 0.35 + 0.3 * Math.sin(G.t * 4) : 0.06); poly(G, obPoly([[460, 330, 60], [570, 330, 60], [570, 330, 200], [460, 330, 200]]), c.warm); G.a(1);
  },
  inner(G, f) {
    const c = G.col, on = G.mine ? f.s.k === 'proc.implant.beam' && f.proc : true, path = [obP(650, 420, 260), obP(745, 380, 260), obP(689, 170, 140)];
    G.a(on ? 0.7 : 0.12); G.l(path, c.grn, 2.2); G.a(1);
    if (on) for (let k = 0; k < 6; k++) { const u = (G.t * 0.6 + k / 6) % 1, q = u < 0.5 ? [path[0][0] + (path[1][0] - path[0][0]) * u * 2, path[0][1] + (path[1][1] - path[0][1]) * u * 2] : [path[1][0] + (path[2][0] - path[1][0]) * (u - 0.5) * 2, path[1][1] + (path[2][1] - path[1][1]) * (u - 0.5) * 2]; G.c(q[0], q[1], 3.5, c.grn); }
  },
  labels(G) { label(G, 'magnet', [715, 340, 300], -8, 0, 'right'); }
});

/* ---- wires: copper fills the cuts (and everything), polishing leaves it only in them; then round again ---- */
const LOOPLINE = [[700, BACK, 250], [700, BACK, 310], [40, BACK, 310], [40, BACK, 250]];
const stWires = {
  parts: { pod: [portShape], efem: [efemShape], plating: [obShape(400, 40, 0, 140, 170, 190)], polish: [obShape(590, 60, 0, 200, 220, 170)], xfer: [obShape(548, 228, 0, 24, 24, 134)], loop: [{ p: obPoly(LOOPLINE) }] },
  draw(G) {
    const c = G.col, cfg = CFG.wires, f = flow(cfg, clockOf(G, cfg)), k = f.s.k;
    hall(G, 'fab', false, 0.45);
    G.a(0.8); G.l(obPoly(LOOPLINE), c.warm, 2.4); G.a(1);
    const ah = obP(40, BACK, 250); G.l([[ah[0] - 12, ah[1] - 16], ah, [ah[0] + 12, ah[1] - 16]], c.warm, 2.4);
    frontModule(G, cfg, f);
    /* the copper bath */
    const bd = obCut(G, 400, 40, 0, 140, 170, 190, c.warm);
    obBox(G, 415, 60, 0, 110, 120, 96, c.warm, [c.warm, G.mine && k !== 'proc.wires.plate' ? 0.2 : 0.4 + 0.1 * Math.sin(G.t * 3)]);
    theirs(G, f.p && f.p[0] < 560 ? f : { p: null });
    bd();
    robots(G, cfg, f, ['B']);
    /* the polisher: a big turning pad, a head pressing the wafer face down onto it */
    const pd = obCut(G, 590, 60, 0, 200, 220, 170, c.line);
    obBox(G, 615, 95, 0, 150, 150, 90, c.line);
    disc(G, 690, 170, 90, 72, c.up, c.hi, 1.2);
    const on = !G.mine || k === 'proc.wires.polish';
    spin(G, 690, 170, 91, 64, G.t * (on ? 2 : 0.3), c.dim);
    if (on) for (let j = 0; j < 6; j++) { const a = G.t * 2 + j, q = obP(690 + Math.cos(a) * 50, 170 + Math.sin(a) * 50, 91); G.c(q[0], q[1], 2, c.cool); }
    theirs(G, f.p && f.p[0] >= 560 ? f : { p: null });
    G.l([obP(690, 170, 140), obP(690, 170, 165)], c.line, 3);
    pd();
    route(G, 'wires', cfg, f);
    yours(G, f);
    label(G, 'loop', [370, BACK, 310], 0, -10, 'center');
  }
};

/* ---- test: needles touch every chip on the wafer; a map shows which are good ---- */
const MAP = [856, 462, 130, 130];
const stTest = {
  get parts() { return { pod: [portShape], efem: [efemShape], shelf: [lockShape], prober: [obShape(448, 40, 0, 250, 270, 290)], needles: [obShape(545, 140, 170, 80, 70, 30)], map: [{ r: MAP }] }; },
  draw(G) {
    const c = G.col, cfg = CFG.test, f = flow(cfg, clockOf(G, cfg));
    hall(G, 'fab', false, 0.05);
    frontModule(G, cfg, f);
    airlock(G, f, false);
    const pd = obCut(G, 448, 40, 0, 250, 270, 290, c.grn);
    obBox(G, 545, 135, 0, 80, 80, 100, c.line); disc(G, 585, 175, 100, 44, c.up, c.line, 1);
    robots(G, cfg, f, ['B']);
    theirs(G, f);
    obBox(G, 530, 125, 200, 110, 100, 16, c.hi);
    const tap = (G.t * 3) % 1 < 0.5 ? 0 : 8;
    for (let k = 0; k < 7; k++) G.l([obP(560 + k * 8, 160, 200), obP(570 + k * 5, 170, 150 + tap)], c.hi, 0.8);
    pd();
    /* the map: every chip on your wafer, good or not; while yours is tested, it fills in */
    const [mx, my, mw] = MAP, upto = G.mine ? (f.s.k === 'proc.test' ? f.pu : f.i > 3 ? 1 : 0) : 1;
    G.r(mx, my, mw, mw, c.lo, c.line, 1.2);
    const nd = Math.floor(DIES.length * upto);
    DIES.forEach((d, i) => { const x = mx + (d[0] / 1000) * mw, y = my + (d[1] / 1000) * mw, w = Math.max(1.2, (d[2] / 1000) * mw - 1); G.r(x, y, w, w, i < nd ? (HITS[i] ? c.red : c.grn) : c.dim); });
    G.l([[mx + mw / 2, my + mw], [mx + mw / 2, my + mw + 60]], c.line, 2);
    route(G, 'test', cfg, f);
    yours(G, f);
    label(G, 'needles', [640, 125, 216], 8, 0); name(G, 'map', mx, my - 10);
  }
};

/* ---- pkg: in another plant, the wafer is cut into chips; a good one is joined to its package ---- */
const stPkg = {
  parts: { pod: [portShape], efem: [efemShape], dock: dockShape, saw: [obShape(400, 70, 0, 150, 160, 160)], substrate: [obShape(640, 140, 112, 80, 70, 12)], bumps: [obShape(652, 150, 124, 56, 50, 8)], die: [obShape(585, 170, 230, 30, 30, 40)], memory: [obShape(730, 140, 112, 25, 70, 60)], lid: [obShape(735, 230, 112, 40, 45, 50)], tray: [obShape(798, 38, 0, 84, 64, 70)] },
  draw(G) {
    const c = G.col, cfg = CFG.pkg, f = flow(cfg, clockOf(G, cfg)), k = f.s.k;
    hall(G, 'pack', true, 0.35);
    dock(G);
    frontModule(G, cfg, f);
    /* the dicing saw: a blade runs along every line between the chips */
    const sd = obCut(G, 400, 70, 0, 150, 160, 160, c.line);
    obBox(G, 430, 110, 0, 80, 80, 100, c.line);
    theirs(G, f.p && f.p[0] < 560 ? f : { p: null });
    const cut = G.mine ? (k === 'proc.pkg.saw' ? f.pu : f.i > 2 ? 1 : 0) : (G.t * 0.2) % 1;
    for (let j = -2; j <= 2; j++) if ((j + 2) / 5 < cut * 1.2) { G.l([obP(458 + j * 11, 124, 105), obP(458 + j * 11, 176, 105)], c.dim, 0.7); G.l([obP(444, 138 + (j + 2) * 11, 105), obP(496, 138 + (j + 2) * 11, 105)], c.dim, 0.7); }
    if (!G.mine || k === 'proc.pkg.saw') { const q = obP(440 + ((G.t * 0.4) % 1) * 60, 150, 150); G.ctx.beginPath(); G.ctx.arc(q[0], q[1], 18, 0, 6.2832); G.ctx.strokeStyle = c.warm; G.ctx.lineWidth = G.lw(1.4); G.ctx.stroke(); }
    sd();
    /* the bonder: the package base, memory beside it, lids waiting; the chip is lowered face down */
    const bd = obCut(G, 580, 60, 0, 200, 230, 260, c.line);
    obBox(G, 615, 110, 0, 150, 150, 112, c.line);
    obBox(G, 640, 140, 112, 80, 70, 12, c.grn);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const q = obP(658 + i * 13, 158 + j * 15, 125); G.c(q[0], q[1], 2.2, c.warm); }
    for (let m = 0; m < 5; m++) obBox(G, 730, 140, 112 + m * 12, 25, 70, 10, c.line);
    for (let m = 0; m < 4; m++) obBox(G, 735, 230, 112 + m * 12, 40, 45, 8, c.hi);
    if (!G.mine) obBox(G, 665, 160, 124 + 40 * (0.5 + 0.5 * Math.sin(G.t * 1.2)), 30, 30, 10, c.line);
    theirs(G, f.p && f.p[0] >= 560 ? f : { p: null });
    bd();
    obBox(G, 798, 38, 0, 84, 64, 60, c.line); tray(G, 840, 70, 60, false, true);
    robots(G, cfg, f);
    route(G, 'pkg', cfg, f);
    yours(G, f);
    label(G, 'memory', [755, 140, 172], 8, 0); label(G, 'dock', [10, 280, 250], 6, 0);
  }
};

/* ---- ship: a last test in a socket, packed, and out: into a data centre, a phone, a car ---- */
const DOORS = { datacentre: [700, 96, 110, 140], phone: [834, 112, 60, 110], car: [720, 270, 200, 64] };
const stShip = {
  parts: { tray: [portShape], trays: [obShape(400, 100, 0, 160, 150, 160)], boxes: [obShape(630, 120, 0, 120, 120, 90)], datacentre: [{ r: DOORS.datacentre }], phone: [{ r: DOORS.phone }], car: [{ r: DOORS.car }] },
  draw(G) {
    const c = G.col, cfg = CFG.ship, f = flow(cfg, clockOf(G, cfg));
    hall(G, 'pack', false, 0.95);
    /* what is waiting beyond the doors */
    const d = DOORS.datacentre, p = DOORS.phone, r = DOORS.car;
    G.r(d[0], d[1], d[2], d[3], c.mid, c.line, 1.2); for (let i = 0; i < 5; i++) G.r(d[0] + 12, d[1] + 12 + i * 25, d[2] - 24, 17, c.up, c.dim, 0.7);
    G.r(p[0], p[1], p[2], p[3], c.mid, c.line, 1.2); G.r(p[0] + 10, p[1] + 12, p[2] - 20, p[3] - 34, c.lo, c.dim, 0.6);
    G.r(r[0], r[1], r[2], r[3] - 14, c.mid, c.line, 1.2); G.c(r[0] + 40, r[1] + r[3] - 12, 13, c.up, c.line, 1); G.c(r[0] + r[2] - 40, r[1] + r[3] - 12, 13, c.up, c.line, 1);
    port(G); docked(G, cfg, f);
    const td = obCut(G, 400, 100, 0, 160, 150, 160, c.line);
    obBox(G, 440, 130, 0, 80, 80, 116, c.line); obBox(G, 465, 155, 116, 30, 30, 6, c.hi);
    G.a(!G.mine || f.s.k === 'proc.ship.test' ? 0.3 + 0.2 * Math.sin(G.t * 4) : 0.06); poly(G, obPoly([[440, 130, 116], [520, 130, 116], [520, 210, 116], [440, 210, 116]]), c.warm); G.a(1);
    theirs(G, f);
    td();
    for (let b = 0; b < 3; b++) obBox(G, 630, 120 + b * 40, 0, 120, 38, 80 - b * 10, c.line, [c.warm, 0.08]);
    obBox(G, 800, 40, 0, 80, 70, 12, c.line); obBox(G, 812, 50, 12, 50, 44, 40, c.warm, [c.warm, 0.12]);
    robots(G, cfg, f);
    route(G, 'ship', cfg, f);
    yours(G, f);
    name(G, 'datacentre', d[0], d[1] - 10); name(G, 'phone', p[0], p[1] - 10); name(G, 'car', r[0], r[1] - 10);
  }
};

/* when the 3D view draws the journey, a station's parts are where its 3D parts are on screen */
let PARTS3 = null;
export const setParts3 = fn => { PARTS3 = fn; };
export const STATIONS = { crystal: stCrystal, slice: stSlice, clean: stClean, deposit: stDeposit, print: stPrint, etch: stEtch, implant: stImplant, wires: stWires, test: stTest, pkg: stPkg, ship: stShip };
Object.entries(STATIONS).forEach(([id, st]) => { const d = Object.getOwnPropertyDescriptor(st, 'parts'); Object.defineProperty(st, 'parts', { get() { const p = PARTS3 && PARTS3(id); return p || (d.get ? d.get.call(st) : d.value); } }); });

/* ======== over the stations: your pod, and the band that says what is happening ======== */

/* the slice: a cut through your wafer's surface, drawn bottom-up in (x, y, w, h); returns the labels */
function section(G, x, y, w, h, L, a, dust) {
  const c = G.col, out = [], bot = y + h, si = 30, film = 16, res = 12, top = bot - si, seg = w / 6;
  const open = i => i % 2 === 1, cu = '#d58a3a'; /* i18n-ok: copper's colour */
  if (L >= 11) {
    /* after packaging: the chip, face down on its package base, with a lid */
    const sub = L >= 12 ? 18 : 0;
    if (sub) { G.r(x, bot - sub, w, sub, c.grn, c.line, 0.8); out.push([bot - sub / 2, 'package', L === 12]); }
    const by = bot - sub - 8, n = 7;
    for (let j = 0; j < n; j++) { const bx = x + 18 + j * ((w - 36) / (n - 1)); G.a(L === 11 ? a : 1); G.c(bx, by + 3, 4, c.warm); G.a(1); }
    out.push([by + 3, 'bumps', L === 11]);
    G.r(x + 10, by - 34, w - 20, 30, c.mid, c.line, 0.8); for (let j = 0; j < 5; j++) G.r(x + 16 + j * ((w - 40) / 5), by - 12, (w - 40) / 10, 6, cu);
    out.push([by - 26, 'silicon', false]);
    if (L >= 13) { G.a(L === 13 ? a : 1); G.l([[x + 4, bot - sub], [x + 4, by - 44], [x + w - 4, by - 44], [x + w - 4, bot - sub]], c.hi, 2); G.a(1); out.push([by - 44, 'lid', true]); }
    return out;
  }
  G.r(x, top, w, si, c.mid, c.line, 0.8); out.push([top + si / 2, 'silicon', false]);
  /* atoms of another element, under the openings */
  if (L >= 7) { const k = L === 7 ? a : 1; for (let i = 0; i < 6; i++) if (open(i)) for (let j = 0; j < 6; j++) if (j / 6 < k) G.c(x + i * seg + 5 + (j % 3) * (seg - 10) / 2, top + 6 + Math.floor(j / 3) * 9, 2.2, c.grn); out.push([top + 8, 'atoms', L === 7]); }
  if (L === 7 && a < 1) for (let j = 0; j < 8; j++) { const u = (G.t * 1.4 + j / 8) % 1, i = 1 + 2 * (j % 3); G.c(x + i * seg + seg / 2 + (rnd(j, 5) - 0.5) * seg * 0.5, y + 6 + u * (top - y - 6), 2, c.grn); }
  /* the film, cut where the stencil left it open; copper in the cuts */
  if (L >= 2) {
    const grow = L === 2 ? a : 1;
    for (let i = 0; i < 6; i++) {
      let fh = film * grow;
      if (open(i) && L >= 6) fh = L === 6 ? film * (1 - a) : 0;
      if (fh > 0.3) G.r(x + i * seg, top - fh, seg, fh, c.cool, null);
      if (open(i) && L >= 8) G.r(x + i * seg + 1, top - film, seg - 2, film, cu);
    }
    if (L === 8 || (L === 9 && a < 1)) { const over = L === 8 ? 8 * a : 8 * (1 - a); G.r(x, top - film - over, w, over, cu); }
    out.push([top - film / 2, L >= 8 ? 'copper' : 'film', L === 2 || L === 6 || L === 8 || L === 9]);
  }
  /* the light-sensitive layer: coated, printed by light, washed away where printed */
  if (L >= 3 && (L <= 5 || (L === 6 && a < 0.85))) {
    for (let i = 0; i < 6; i++) {
      const rh = L === 3 ? res * a : res;
      if (open(i) && (L === 6 || (L === 5 && a >= 1))) continue;
      const shrink = open(i) && L === 5 ? 1 - a : 1;
      G.r(x + i * seg, top - film - rh * shrink, seg, rh * shrink, open(i) && L >= 4 ? c.hi : c.warm, null);
    }
    out.push([top - film - res / 2, 'resist', L >= 3 && L <= 5]);
  }
  /* what is happening right now, above the surface */
  if (L === 4 && a < 1) for (let i = 0; i < 6; i++) { if (open(i)) { G.a(0.3 + 0.25 * Math.sin(G.t * 8)); G.r(x + i * seg + 2, y + 4, seg - 4, top - film - res - y - 4, c.warm); G.a(1); } else G.r(x + i * seg, y + 4, seg, 5, c.line); }
  if (L === 6 && a < 1) for (let j = 0; j < 9; j++) { const u = (G.t * 1.8 + j / 9) % 1, i = 1 + 2 * (j % 3); G.r(x + i * seg + seg / 2 - 1, y + 4 + u * (top - film - y - 4), 2, 5, c.red); }
  if (L === 1 && a < 1) for (let j = 0; j < 10; j++) { const u = (G.t * 2 + j / 10) % 1; G.c(x + rnd(j, 9) * w, y + 4 + u * (top - y - 6), 1.8, c.cool); }
  if (dust && L <= 1) { const k = L === 0 ? 1 : 1 - a; G.a(k); for (let j = 0; j < 7; j++) G.c(x + 8 + rnd(j, 3) * (w - 16), top - 3, 3, c.red); G.a(1); if (k > 0.05) out.push([top - 3, 'specks', false]); }
  if (L === 10) { const nx = x + 3 * seg + seg / 2; G.l([[nx - 18, y + 4], [nx, top - film]], c.hi, 1.6); out.push([top - film - 6, 'needle', true]); }
  return out;
}

/* a caption that may start with <b>a short title</b>: wrapped to width, drawn from (x, y) */
function caption(G, raw, x, y0, w, maxY, n) {
  const ctx = G.ctx, c = G.col, B = 1000 * G.s, fs = clamp(B / 52, 10.5, 14.5) / G.s, lh = fs * 1.36, y = y0 + fs * 1.05, m = /^<b>(.*?)<\/b>\s*([\s\S]*)$/.exec(raw);
  const title = m ? m[1] : '', body = (m ? m[2] : raw).replace(/<[^>]+>/g, '');
  let cx = x;
  ctx.save(); ctx.textBaseline = 'alphabetic';
  if (n) { const r = fs * 0.78; G.c(x + r, y - fs * 0.35, r, c.warm); ctx.font = '700 ' + fs * 0.82 + 'px ' + MONO; ctx.textAlign = 'center'; ctx.fillStyle = c.bg; ctx.fillText(n, x + r, y - fs * 0.35 + fs * 0.3); cx += r * 2 + fs * 0.5; }
  ctx.textAlign = 'left';
  if (title) { ctx.font = '700 ' + fs + 'px ' + SANS; ctx.fillStyle = c.warm; ctx.fillText(title, cx, y); }
  ctx.font = '400 ' + fs + 'px ' + SANS; ctx.fillStyle = c.hi;
  const words = body.split(/\s+/); let line = '', ly = y + (title ? lh : 0);
  for (const wd of words) {
    const tryL = line ? line + ' ' + wd : wd;
    if (ctx.measureText(tryL).width > w && line) { if (ly > maxY) break; ctx.fillText(line, x, ly); line = wd; ly += lh; } else line = tryL;
  }
  if (line && ly <= maxY + lh * 0.3) ctx.fillText(line, x, ly);
  ctx.restore();
}

/* o: { ids, Z, near, dist, run }: called by world.js, in the box's own 1000 x 1000 space */
export function drawJourney(G, o) {
  const c = G.col, ctx = G.ctx, id = o.ids[o.near], cfg = CFG[id], si = o.ids.indexOf('slice'), pk = o.ids.indexOf('pkg');
  const lo = Math.max(0, Math.floor(o.Z + 1e-6)), hi = Math.min(o.ids.length - 1, Math.ceil(o.Z - 1e-6)), cross = PLANTS[o.ids[lo]] !== PLANTS[o.ids[hi]];
  const f = o.run != null && cfg ? flow(cfg, o.run) : null;
  /* your pod: on the track while you travel, lowered onto the machine's door when you stop */
  if (o.Z >= si - 1e-6 && !o.three) {
    const down = sm((0.3 - o.dist) / 0.2), x = PODX + (o.near - o.Z) * 1000 * down, z = HANG_Z + (PORT_Z - HANG_Z) * down, trays = o.Z > pk + 0.5;
    if (z + 66 < 518) G.l([obP(x, PODY, 520), obP(x, PODY, z + 67)], c.hi, 1.2);
    if (trays) tray(G, x, PODY, z, true, !f || f.home); else pod(G, x, PODY, z, true, f ? f.open : false);
    if (cross && o.dist > 0.06) crate(G, x, PODY, z);
  }
  /* the part the current step happens in, lit in the picture */
  if (f && o.dist < 0.02 && cfg.part && cfg.part[f.s.to] && STATIONS[id].parts[cfg.part[f.s.to]]) {
    const shapes = (STATIONS[id].parts[cfg.part[f.s.to]] || []).slice(), ctx2 = G.ctx;
    if (o.three && f.proc) shapes.length = 0;   /* in 3D the camera moves in to the work itself */
    ctx2.save(); ctx2.strokeStyle = c.warm; ctx2.lineWidth = G.lw(o.three ? 1.1 : 1.6); ctx2.lineJoin = 'round'; ctx2.globalAlpha = (o.three ? 0.4 : 0.55) + 0.2 * Math.sin(G.t * 3);
    if (o.three) ctx2.setLineDash([6 / G.s, 5 / G.s]);
    if (c.dark) { ctx2.shadowColor = c.warm; ctx2.shadowBlur = 10; }
    shapes.forEach(sh => { ctx2.beginPath(); if (sh.r) ctx2.rect(sh.r[0], sh.r[1], sh.r[2], sh.r[3]); else if (sh.c) ctx2.arc(sh.c[0], sh.c[1], sh.c[2], 0, 6.2832); else sh.p.forEach((q, i) => (i ? ctx2.lineTo(q[0], q[1]) : ctx2.moveTo(q[0], q[1]))); ctx2.stroke(); });
    ctx2.restore();
  }
  /* the band: what is happening, and the slice through your wafer. Inside the bottom of the picture, or,
     on a phone, under it. */
  const under = o.below > 120, top = under ? 1000 : 818, bottom = under ? 1000 + o.below : 1000, small = !roomy(G);
  if (!under || o.three) { G.a(0.94); G.r(-2000, top, 5000, bottom - top + 2000, c.bg); G.a(1); }
  G.l([[0, top], [1000, top]], c.line, 1);
  let key, n = 0, L = null, a = 1, dust = false;
  if (f) { key = f.s.k; n = cfg.num[f.i]; if (cfg.in != null) { L = f.sl; a = f.a; dust = !!cfg.dust; } if (cfg.appear && f.i < cfg.appear) L = null; }
  else { key = o.Z < si ? 'handle.ingot' : cross && o.dist > 0.06 ? 'handle.ship' : 'handle.travel'; const was = CFG[o.ids[lo]]; if (was && was.in != null && o.Z >= si) L = was.out; }
  let tx = 24;
  const u = 1 / G.s;
  if (L != null) {
    const sw = small ? 300 : 290, sx = 16, sy = top + 12, sh = Math.min(bottom - top - 22, small ? 170 : 1e9);
    G.r(sx, sy, sw, sh, c.lo, c.line, 0.8);
    if (!small) { ctx.save(); ctx.font = '500 ' + 10 * u + 'px ' + MONO; ctx.fillStyle = c.line; ctx.fillText(t('slice.title'), sx + 4 * u, sy + 13 * u); ctx.restore(); }
    const pad = small ? 4 * u : 19 * u, lw = small ? sw - 8 * u : sw * 0.55, labs = section(G, sx + 4 * u, sy + pad, lw, sh - pad - 4 * u, L, a, dust);
    if (!small) {
      ctx.save(); ctx.font = '500 ' + 10 * u + 'px ' + MONO; ctx.textBaseline = 'middle';
      let last = -1e9; labs.sort((p, q) => q[0] - p[0]).forEach(([ly, k, isNew]) => {
        let yy = Math.min(ly, last - 12 / G.s); if (last < -1e8) yy = ly; last = yy;
        const lx = sx + 4 * u + lw;
        G.l([[lx + 2, ly], [lx + 10, yy]], c.dim, 0.8);
        ctx.fillStyle = isNew ? c.warm : c.hi; ctx.fillText(t('slice.' + k), lx + 13, yy);
      });
      ctx.restore();
    }
    tx = sx + sw + 18;
  }
  /* the steps of this station, in a row: the one under way is lit; tap one to watch it again, or pause */
  const hits = { chips: [], pause: null };
  let ctop = top + 12;
  if (cfg && o.dist < 0.3) {
    const R = 9.5 * u, fs = 11.5 * u, gap = 8 * u, y = top + 12 + R, steps = cfg.steps.map((s, i) => ({ s, i, n: cfg.num[i] })).filter(q => q.n);
    const titleOf = k => { const m = /^<b>(.*?)<\/b>/.exec(t(k)); return m ? m[1] : ''; };
    ctx.save(); ctx.font = '600 ' + fs + 'px ' + SANS; ctx.textBaseline = 'middle';
    const room = 1000 - tx - 16 - 3 * R, full = steps.reduce((w, q) => w + 2 * R + 5 * u + ctx.measureText(titleOf(q.s.k)).width + gap, 0) <= room;
    let x = tx;
    steps.forEach(q => {
      const now = f && f.i === q.i, past = f && f.i > q.i, title = titleOf(q.s.k), tw = full || now ? ctx.measureText(title).width + 5 * u : 0;
      G.c(x + R, y, R, now ? c.warm : past ? c.up : c.bg, now ? c.warm : c.line, 1.1);
      ctx.font = '700 ' + 10.5 * u + 'px ' + MONO; ctx.textAlign = 'center'; ctx.fillStyle = now ? c.bg : c.hi; ctx.fillText(q.n, x + R, y + 0.5 * u);
      ctx.font = '600 ' + fs + 'px ' + SANS; ctx.textAlign = 'left';
      if (tw) { ctx.fillStyle = now ? c.warm : past ? c.hi : c.line; ctx.fillText(title, x + 2 * R + 5 * u, y); }
      hits.chips.push({ x, y: y - R, w: 2 * R + tw, h: 2 * R, i: q.i });
      x += 2 * R + tw + gap;
    });
    /* pause or play */
    const px = 1000 - 16 - 2 * R;
    G.c(px + R, y, R, c.bg, c.line, 1.1);
    ctx.fillStyle = c.hi;
    if (o.paused) { ctx.beginPath(); ctx.moveTo(px + R - 3 * u, y - 4.5 * u); ctx.lineTo(px + R + 4.5 * u, y); ctx.lineTo(px + R - 3 * u, y + 4.5 * u); ctx.closePath(); ctx.fill(); }
    else { ctx.fillRect(px + R - 3.5 * u, y - 4 * u, 2.4 * u, 8 * u); ctx.fillRect(px + R + 1.1 * u, y - 4 * u, 2.4 * u, 8 * u); }
    hits.pause = { x: px, y: y - R, w: 2 * R, h: 2 * R };
    ctx.restore();
    ctop = y + R + 4 * u;
    n = 0;
  }
  caption(G, t(key, { layers: M.layers }), tx, ctop, 1000 - tx - 16, bottom - 8, n);
  return hits;
}
