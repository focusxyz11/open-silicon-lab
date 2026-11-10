/* One answer (#one-answer): the first journey of the frame, as a prototype (docs/FRAME.md; roadmap,
   "Now: the frame", step 2). A question travels from a phone down through all ten depths to atoms,
   and the answer travels back.

   - The dive: one continuous zoom, the same scheme as Zoom into your chip (src/app/chipzoom.js). The
     block, gate and switch depths draw a real full adder from src/engines/chipzoom.js: its placed
     cells, routed wires, CMOS transistors and the values on every wire.
   - The time lens: the whole journey in any year from 1947 to 2040. Before a place existed it is a
     grey ghost; after today it is drawn unfinished, on blueprint paper.
   - Open edges: broken rings inside the scenes. Opening one shows the question behind it, what people
     are trying, a sourced fact, and a challenge that opens right here on the workbench.
   - The constellation: every edge opened becomes a star; lines between stars are the questions.
   The logic is in src/engines/journey.js (tested); the data in src/data/journeys.js. */
import { clamp, RM, fit, fmtLen, rng, inView } from '../core/ui.js';
import { t, fmtWords } from '../core/i18n.js';
import { DEPTHS } from '../data/frame.js';
import { EDGES, BENCH, LENS } from '../data/journeys.js';
import { NOW, clampYear, stateAt, lineAt, nodeFor, shapeFor, materialFor, adderAt, sizes, inner, levels, along, constellation, MAC } from '../engines/journey.js';
import { evalCell, signals } from '../engines/chipzoom.js';
import { snapshot, trendTransistors } from '../data/timeline.js';
import { topicById } from '../data/topics.js';
import { FACTS, fmtDate } from './facts.js';
import { ensureTopic } from './loader.js';
import { CHALLENGES } from '../data/challenges.js';
import { holds, isSolved, markSolved } from './checks.js';
import { getYear } from './era.js';

const IDS = DEPTHS.map(d => d.id), N = IDS.length;
const HOME_D = 1;                                      /* the answer comes home to the phone, at the region depth */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(String(u || '')) ? String(u) : '';
const FONT = '"IBM Plex Sans", sans-serif'; /* i18n-ok: a font name */
const D2R = Math.PI / 180;
const len = m => m >= 1000 ? fmtWords(+(m / 1000).toPrecision(3)) + ' km' : fmtLen(m);

/* Kept between visits to the view. */
const K = { t: 0, year: NOW, dir: 1, pk: 0, open: null, bench: null, arrived: false };
const STAR_KEY = 'osl-stars-v1';
let FOUND = []; try { FOUND = Object.keys(JSON.parse(localStorage.getItem(STAR_KEY) || '{}') || {}); } catch (e) { FOUND = []; }
const saveStars = () => { try { localStorage.setItem(STAR_KEY, JSON.stringify(Object.fromEntries(FOUND.map(id => [id, 1])))); } catch (e) { /* storage unavailable */ } };

/* Photo-like colours, the same in light and dark mode (like a microscope or satellite image). */
const C = {
  bg: '#081117', space: '#04080c', ink: '#e8eef2', mute: '#8c9da8', q: '#f0b13c', a: '#4cc6d2', blue: '#5aa5d6',
  one: '#f0b13c', zero: '#3f6b85', on: '#f0b13c', off: '#5f6f7b', pcb: '#0f3b2c', pcbHi: '#17543f', gold: '#d6b35a',
  pkg: '#1b1f23', die: '#3a3f63', sm: '#4a5180', hbm: '#5b4a3a', sub: '#3a2f4f', nwell: '#2f3f5a', ndiff: '#3b6e8f',
  pdiff: '#8f5a3b', oxide: '#c9d2d8', poly: '#a33f3f', metal: '#8a8f99', ge: '#7a8a6a', si: '#9aa9c0'
};
const CELLC = { INV: '#8fa3b3', BUF: '#8fa3b3', NAND2: '#9b8ce0', NOR2: '#c58ab3', AND2: '#7f9fe0', OR2: '#d6a35a', XOR2: '#5fb7a8', XNOR2: '#5fb7a8', TIE0: '#888888', TIE1: '#888888', DFF: '#e07a5f' };
const val = v => v === 1 ? C.one : C.zero;

/* ---------------- layouts that change with the year ---------------- */
/* Each returns what its scene draws and `target`: where the next depth sits, in this scene's units. */
const LAT0 = 25 * D2R, LON0 = -45 * D2R, RE = 0.98;
function proj(lat, lon) {
  const la = lat * D2R, lo = lon * D2R - LON0;
  return [RE * Math.cos(la) * Math.sin(lo), -RE * (Math.cos(LAT0) * Math.sin(la) - Math.sin(LAT0) * Math.cos(la) * Math.cos(lo)),
    Math.sin(LAT0) * Math.sin(la) + Math.cos(LAT0) * Math.cos(la) * Math.cos(lo)];
}
const HOME = [39, -77.5];                              /* where this answer is written: a data-centre region */
const REGION_T = [0.35, -0.15], USER = [-0.6, 0.38], MAST = [-0.44, 0.2];
function chipLayout(y, B) {
  const L = { dies: [], hbm: [], cols: 1, rows: 1, sub: [1, 1], gddr: 0 };
  if (y < 1971) { L.dies = [[0, 0, 0.1, 0.1]]; L.sub = [0.7, 0.5]; }
  else if (y < 1990) { L.dies = [[0, 0, 0.18, 0.22]]; L.sub = [1.2, 0.9]; }
  else if (y < 2006) { L.dies = [[0, 0, 0.55, 0.55]]; L.sub = [1.7, 1.7]; L.cols = 2; L.rows = 1; }
  else if (y < 2016) { L.dies = [[0, 0, 0.95, 0.8]]; L.sub = [2.4, 2.2]; L.cols = 4; L.rows = 4; L.gddr = y >= 1999 ? 8 : 0; }
  else {
    const two = y >= 2024, dw = two ? 0.92 : 1.1, dh = 1.2;
    L.dies = two ? [[-dw / 2 - 0.025, 0, dw, dh], [dw / 2 + 0.025, 0, dw, dh]] : [[0, 0, dw, dh]];
    L.sub = [3.6, 2.9]; L.cols = 6; L.rows = 8;
    const n = y < 2022 ? 4 : y < 2024 ? 6 : 8, per = n / 2, hw = 0.34, hh = 0.5, x = (two ? dw + 0.05 : dw / 2) + 0.06 + hw / 2;
    for (let k = 0; k < per; k++) { const yy = -((per - 1) * 0.58) / 2 + k * 0.58; L.hbm.push([-x, yy, hw, hh], [x, yy, hw, hh]); }
  }
  const d = L.dies[L.dies.length - 1], m = 0.04 * d[2];
  const strip = L.rows > 2 ? d[3] * 0.08 : 0, sw = (d[2] - 2 * m) / L.cols, sh = (d[3] - 2 * m - strip) / L.rows;
  const col = Math.max(0, L.cols - 2), row = Math.min(L.rows - 1, 2);
  const sx = d[0] - d[2] / 2 + m + col * sw, sy = d[1] - d[3] / 2 + m + row * sh + (row >= L.rows / 2 ? strip : 0);
  L.sm = { sw, sh, m, strip, col, row, x: sx, y: sy };
  L.target = L.cols > 1 ? [sx + sw * 0.27, sy + sh * 0.3] : [d[0] + d[2] * 0.1, d[1] - d[3] * 0.1];
  L.tile = (B / 2) / 0.0225;                         /* half the block's width, in chip units */
  return L;
}
/* The trays of a rack, top to bottom: [centre, height, kind]. One rack unit is 44.5 mm (0.0342 units). */
const U1 = 0.0342;
function trays(kind) {
  const out = []; let yy = -0.84;
  const add = (n, h, k, gap) => { for (let j = 0; j < n; j++) { out.push([yy + h / 2, h, k]); yy += h * (gap || 1.08); } };
  if (kind === 'servers') { yy = -0.82; for (let j = 0; j < 42; j++) add(1, U1, j % 10 === 0 ? 'sw' : 'gpu', 1.12); }
  else if (kind === 'gpu8') { yy = -0.77; add(8, U1 * 4, 'gpu', 1.3); }
  else if (kind === 'nvl') { yy = -0.8; add(1, U1, 'sw', 1.3); add(4, U1, 'pw', 1.12); add(10, U1 * 1.2, 'gpu', 1.12); add(9, U1 * 1.2, 'sw', 1.12); add(8, U1 * 1.2, 'gpu', 1.12); add(4, U1, 'pw', 1.12); }
  return out;
}
function layout(y, Z) {
  const S = sizes(Z);
  const building = y < 1960 ? { kind: 'eniac', target: [0.02, -0.22] } : y < 1995 ? { kind: 'room', target: [0.1, -0.02] } : { kind: 'hall', halls: y >= 2006 ? 2 : 1, liquid: y >= 2023, target: [-0.45 + 25 * 0.0235, -0.38 - 0.26 + 2 * 0.068] };
  const rk = y < 1960 ? 'eniac' : y < 1995 ? 'mainframe' : y < 2016 ? 'servers' : y < 2024 ? 'gpu8' : 'nvl', tr = trays(rk), gpus = tr.filter(x => x[2] === 'gpu');
  const pick = rk === 'nvl' ? gpus[13] : rk === 'gpu8' ? gpus[5] : rk === 'servers' ? gpus[30] : null;
  const rack = { kind: rk, trays: tr, target: pick ? [0, pick[0]] : [0, 0.42], th: pick ? pick[1] : 0.1 };
  const board = { kind: y < 1999 ? 'cpu' : y < 2016 ? 'card' : 'pkg', target: y < 1999 ? [-0.05, -0.1] : y < 2016 ? [0.1, -0.05] : [0.42, -0.05] };
  const chip = chipLayout(y, S.block);
  const up = { planet: proj(HOME[0], HOME[1]).slice(0, 2), region: REGION_T, building: building.target, rack: rack.target, board: board.target, chip: chip.target };
  return { building, rack, board, chip, up };
}

/* ---------------- the view ---------------- */
export function renderJourney() {
  const v = document.getElementById('view-journey'); if (!v) return;
  if (!v.dataset.built) {
    v.dataset.built = '1';
    v.innerHTML = '<section class="wrap vhead oahead"><p class="eyebrow">' + t('oa.eyebrow') + '</p><h1>' + t('oa.title') + '</h1><p class="lede">' + t('oa.lede') + '</p></section>' +
      '<section class="wrap oagrid"><div class="oastage"><div class="viewer oaview"><div class="oacv"><canvas id="oaCv" role="img" aria-label="' + esc(t('oa.label')) + '"></canvas>' +
      '<div class="vhud"><div><span id="oaIdx"></span><b id="oaName"></b></div><div class="fov">' + t('oa.fov') + '<b id="oaFov"></b></div></div>' +
      '<div class="oaedges" id="oaEdges"></div><p class="oastamp" id="oaStamp" hidden></p>' +
      '<div class="scalebar"><span id="oaBar"></span><i id="oaBarI"></i></div></div>' +
      '<div class="oacard" id="oaCard" hidden aria-live="polite"></div></div>' +
      '<div class="oacontrols"><div class="row"><button type="button" class="btn primary" id="oaPlay"></button><button type="button" class="btn" id="oaTop"></button></div>' +
      '<div class="levels oalevels" id="oaLevels" role="group" aria-label="' + esc(t('oa.depths')) + '"></div></div>' +
      '<div class="oalens"><div class="oalenshead"><span class="code">' + t('oa.lens') + '</span><b id="oaYear"></b><span class="pill" id="oaState"></span></div>' +
      '<input type="range" id="oaYearR" min="' + LENS.min + '" max="' + LENS.max + '" step="1" aria-label="' + esc(t('oa.lensLabel')) + '">' +
      '<div class="seg" id="oaJump">' + [1947, 1971, 1995, 2012, NOW, 2035].map(y => '<button type="button" data-y="' + y + '">' + (y === NOW ? t('oa.today') : y) + '</button>').join('') + '</div>' +
      '<p class="oatime" id="oaTime"></p></div></div>' +
      '<div class="oaside"><p class="code" id="oaDir"></p><p class="oastory" id="oaStory" aria-live="polite"></p><p class="small muted" id="oaHere"></p>' +
      '<div class="oasky"><div class="oaskyhead"><b>' + t('oa.sky.title') + '</b><span class="small muted" id="oaSkyN"></span></div>' +
      '<canvas id="oaSky" role="img" aria-label="' + esc(t('oa.sky.label')) + '"></canvas><p class="small muted" id="oaSkyTxt"></p>' +
      '<button type="button" class="btn oaclear" id="oaClear" hidden>' + t('oa.sky.clear') + '</button></div></div></section>' +
      '<section class="wrap oabench" id="oaBench" hidden></section>' +
      '<section class="wrap"><p class="note">' + t('oa.note') + '</p></section>';
    if (K.year === NOW) K.year = getYear();
    mount();
  }
  sky();
}

let run = 0;
function mount() {
  const cv = document.getElementById('oaCv'); if (!cv) return;
  const me = ++run, $ = id => document.getElementById(id);
  let Z, L, LY, NODE = null;
  function setYear(y) {
    K.year = clampYear(y);
    const node = nodeFor(K.year);
    if (node !== NODE) { NODE = node; Z = adderAt(node); }
    LY = layout(K.year, Z); L = levels(Z, LY.up, K.year);
    $('oaYearR').value = K.year; $('oaYear').textContent = K.year;
    $('oaJump').querySelectorAll('[data-y]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.y === K.year));
    lastIdx = -1; draw(performance.now());
  }

  /* ---- text drawn in screen pixels (very small canvas fonts get squashed) ---- */
  let GA = 1;
  const alpha = (c, a) => { c.globalAlpha = GA * a; };
  const text = (c, s, x, y, px, u, col, align, w) => {
    const m = c.getTransform(), q = m.transformPoint(new DOMPoint(x, y)), d = m.a / u;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = (w || 600) + ' ' + Math.round(px * d) + 'px ' + FONT; c.fillStyle = col || C.ink; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillText(s, q.x, q.y); c.restore();
  };
  const rect = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x - w / 2, y - h / 2, w, h); };
  const dot = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); };
  const glow = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); const o = c.globalAlpha; c.globalAlpha = o * (a == null ? 1 : a); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.globalAlpha = o; };
  const line = (c, pts, col, lw, dash) => { c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.setLineDash([]); };
  /* The moving question (amber, going down) or answer (cyan, coming back) along a path. */
  function packet(c, u, pts, sec) {
    const col = K.dir > 0 ? C.q : C.a, p = RM ? 0.6 : K.pk, P = K.dir > 0 ? pts : pts.slice().reverse();
    for (let k = 5; k >= 0; k--) { const q = along(P, p - k * 0.025); alpha(c, (1 - k / 6) * 0.9); dot(c, q[0], q[1], (k ? 3 : 5) / u, col); }
    const q = along(P, p); alpha(c, 1); glow(c, q[0], q[1], 16 / u, K.dir > 0 ? 'rgba(240,177,60,.55)' : 'rgba(76,198,210,.55)');
  }
  const future = () => K.year > NOW;
  const fdash = u => [6 / u, 5 / u];

  /* ---------------- the ten scenes, each drawn in [-1, 1] ---------------- */
  const R1 = rng(3), STARS = Array.from({ length: 140 }, () => [R1() * 6 - 3, R1() * 6 - 3, R1()]);
  const CITIES = [[40.7, -74, 3], [38.9, -77, 2], [41.9, -87.6, 3], [43.7, -79.4, 2], [33.7, -84.4, 2], [25.8, -80.2, 2], [29.8, -95.4, 2], [32.8, -96.8, 2], [34, -118, 3], [37.8, -122.4, 2], [47.6, -122.3, 2], [39.7, -105, 1], [19.4, -99.1, 3], [4.7, -74, 2], [-12, -77, 2], [-23.5, -46.6, 3], [-22.9, -43.2, 2], [-34.6, -58.4, 2], [-33.4, -70.6, 2], [10.5, -66.9, 1], [-3.7, -38.5, 1], [-8, -35, 1], [51.5, -0.1, 3], [48.9, 2.35, 3], [40.4, -3.7, 2], [38.7, -9.1, 1], [43.3, -2.9, 1], [53.3, -6.3, 1], [52.4, 4.9, 2], [50.1, 8.7, 2], [52.5, 13.4, 2], [41.9, 12.5, 2], [43.3, 5.4, 1], [59.3, 18.1, 1], [33.6, -7.6, 1], [6.5, 3.4, 2], [5.6, -0.2, 1], [14.7, -17.5, 1], [5.3, -4, 1], [36.8, 3.1, 1], [30, 31.2, 2], [-4.3, 15.3, 1], [-26.2, 28, 2], [-33.9, 18.4, 1], [64.1, -21.9, 1], [45.5, -73.6, 2], [23.1, -82.4, 1], [9, -79.5, 1], [42.4, -71, 2], [45.5, 9.2, 2], [55.7, 37.6, 2], [41, 29, 2], [-1.3, 36.8, 1], [9, 38.7, 1]];
  /* [year, from, to]: sea cables. 1866 telegraph, 1956 the first telephone cable, 1988 the first fibre. */
  const CABLES = [[1866, [51.9, -10.3], [47.9, -53.9]], [1956, [55.9, -5], [48.9, -54]], [1988, [39.9, -74.1], [50.1, -5.5]], [1992, [25.8, -80.2], [-3.7, -38.5]], [1996, [40.6, -73.9], [51.5, -3]], [2000, [36.8, -76], [43.3, -2.9]], [2001, [40.6, -73.9], [-22.9, -43.2]], [2004, [6.5, 3.4], [38.7, -9.1]], [2010, [-33.9, 18.4], [14.7, -17.5]], [2012, [-22.9, -43.2], [-33.9, 18.4]], [2017, [39, -76], [43.3, -2.9]], [2021, [-3.7, -38.5], [38.7, -9.1]], [2023, [25.8, -80.2], [36.8, 3.1]]];
  const FUTURE_CABLES = [[[64.1, -21.9], [59.3, 18.1]], [[-1.3, 36.8], [-26.2, 28]], [[14.7, -17.5], [-3.7, -38.5]]];
  const DCS = [[1995, 39, -77.5], [1998, 41.9, -87.6], [2006, 45.6, -121.2], [2007, 53.3, -6.3], [2008, 50.1, 8.7], [2009, 52.4, 4.9], [2011, -23.5, -46.6], [2013, 32.8, -96.8], [2015, 40.4, -3.7], [2018, -26.2, 28], [2020, 6.5, 3.4]];
  const AI = [[2023, 39, -77.5], [2024, 32.8, -96.8], [2024, 41.6, -93.6], [2025, 45.6, -121.2], [2025, 53.3, -6.3]];
  const vec = (lat, lon) => [Math.cos(lat * D2R) * Math.cos(lon * D2R), Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R)];
  function arc(a, b) {
    const A = vec(a[0], a[1]), B = vec(b[0], b[1]), om = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1)), pts = [];
    for (let k = 0; k <= 32; k++) { const f = k / 32, s1 = Math.sin((1 - f) * om) / Math.sin(om), s2 = Math.sin(f * om) / Math.sin(om); const v = A.map((x, i) => x * s1 + B[i] * s2); const lat = Math.asin(v[2]) / D2R, lon = Math.atan2(v[1], v[0]) / D2R; const lift = 1 + Math.sin(f * Math.PI) * 0.02; const p = proj(lat, lon); pts.push([p[0] * lift, p[1] * lift, p[2]]); }
    return pts;
  }
  const ARCS = CABLES.map(([y, a, b]) => [y, arc(a, b)]), FARCS = FUTURE_CABLES.map(([a, b]) => arc(a, b));
  function sPlanet(c, u, sec) {
    const y = K.year;
    rect(c, 0, 0, 8, 8, C.space);
    STARS.forEach(s => { alpha(c, 0.25 + s[2] * 0.5); dot(c, s[0], s[1], 0.8 / u, '#cfe0ea'); }); alpha(c, 1);
    glow(c, 0, 0, RE * 1.12, 'rgba(76,198,210,.35)');
    const g = c.createRadialGradient(-0.3, -0.35, 0.1, 0, 0, RE); g.addColorStop(0, '#12263a'); g.addColorStop(1, '#060e17');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, RE, 0, 6.2832); c.fill();
    /* the grid of latitudes and longitudes */
    c.strokeStyle = 'rgba(140,180,210,.12)'; c.lineWidth = 1 / u;
    for (let lat = -60; lat <= 60; lat += 30) { c.beginPath(); let pen = false; for (let lon = -180; lon <= 180; lon += 4) { const p = proj(lat, lon); if (p[2] > 0) { pen ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); pen = true; } else pen = false; } c.stroke(); }
    for (let lon = -180; lon < 180; lon += 30) { c.beginPath(); let pen = false; for (let lat = -88; lat <= 88; lat += 4) { const p = proj(lat, lon); if (p[2] > 0) { pen ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); pen = true; } else pen = false; } c.stroke(); }
    /* city lights: dimmer the further back in time */
    const lit = clamp(0.35 + (y - 1947) / 90, 0.35, 1);
    const R = rng(9);
    CITIES.forEach(([la, lo, w]) => { const p = proj(la, lo); if (p[2] < 0.05) return; for (let k = 0; k < 3 + w * 3; k++) { const dx = (R() - 0.5) * 0.035 * w, dy = (R() - 0.5) * 0.03 * w; alpha(c, lit * (0.35 + R() * 0.5) * p[2]); dot(c, p[0] + dx, p[1] + dy, (0.7 + R()) / u, '#ffd890'); } });
    alpha(c, 1);
    /* sea cables: copper before 1988, glass fibre after */
    ARCS.forEach(([cy, pts]) => {
      if (cy > y) return;
      const fibre = cy >= 1988; c.strokeStyle = fibre ? 'rgba(76,198,210,.55)' : 'rgba(214,150,90,.45)'; c.lineWidth = (fibre ? 1.4 : 1) / u;
      c.beginPath(); let pen = false; pts.forEach(p => { if (p[2] > 0) { pen ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); pen = true; } else pen = false; }); c.stroke();
      if (!RM && fibre) { const q = pts[Math.floor(((sec * 0.25 + cy * 0.13) % 1) * pts.length)]; if (q[2] > 0) { dot(c, q[0], q[1], 1.8 / u, '#bff4fa'); } }
    });
    if (y >= 1969 && y < 1988) [[34, -118.4], [37.4, -122.2], [34.4, -119.8], [40.8, -111.9]].forEach(([la, lo]) => { const p = proj(la, lo); dot(c, p[0], p[1], 2.2 / u, '#9fd'); });
    DCS.forEach(([dy, la, lo]) => { if (dy > y) return; const p = proj(la, lo); if (p[2] < 0.1) return; glow(c, p[0], p[1], 9 / u, 'rgba(120,200,255,.6)'); dot(c, p[0], p[1], 1.6 / u, '#cfeeff'); });
    AI.forEach(([dy, la, lo]) => { if (dy > y) return; const p = proj(la, lo); glow(c, p[0], p[1], 15 / u, 'rgba(240,177,60,.65)'); dot(c, p[0], p[1], 2.2 / u, '#ffe2a8'); });
    if (future()) {
      FARCS.forEach(pts => line(c, pts.filter(p => p[2] > 0).map(p => [p[0], p[1]]), 'rgba(160,220,255,.6)', 1.2 / u, fdash(u)));
      [[41.6, -93.6], [-26.2, 28], [64.1, -21.9]].forEach(([la, lo]) => { const p = proj(la, lo); c.strokeStyle = 'rgba(160,220,255,.7)'; c.setLineDash(fdash(u)); c.lineWidth = 1.2 / u; c.beginPath(); c.arc(p[0], p[1], 10 / u, 0, 6.2832); c.stroke(); c.setLineDash([]); });
    }
    /* your question: a ring pulsing where it will be answered */
    if (y < 1969) return;
    const h = LY.up.planet, ph = RM ? 0.5 : (sec * 0.7) % 1;
    c.strokeStyle = K.dir > 0 ? C.q : C.a; c.lineWidth = 1.6 / u; alpha(c, 1 - ph); c.beginPath(); c.arc(h[0], h[1], (4 + ph * 26) / u, 0, 6.2832); c.stroke(); alpha(c, 1);
    dot(c, h[0], h[1], 3 / u, K.dir > 0 ? C.q : C.a);
  }

  const R2 = rng(21), TOWNS = [[-0.6, 0.38, 1.2], [0.5, 0.5, 0.8], [-0.1, -0.55, 0.7], [0.7, -0.4, 0.6], [-0.85, -0.3, 0.5], [0.15, 0.25, 0.5]];
  const LIGHTS = TOWNS.flatMap(([x, y, s]) => Array.from({ length: Math.round(90 * s) }, () => { const r = Math.abs(R2() + R2() - 1) * 0.22 * s, a = R2() * 6.28; return [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, R2()]; }));
  const ROADS = Array.from({ length: 9 }, (_, k) => { const a = TOWNS[k % TOWNS.length], b = TOWNS[(k * 3 + 1) % TOWNS.length]; return [[a[0], a[1]], [(a[0] + b[0]) / 2 + (R2() - 0.5) * 0.3, (a[1] + b[1]) / 2 + (R2() - 0.5) * 0.3], [b[0], b[1]]]; });
  const FIBRE = [USER, MAST, [-0.25, 0.12], [-0.02, -0.04], [0.2, -0.12], REGION_T];
  function sRegion(c, u, sec) {
    const y = K.year;
    rect(c, 0, 0, 8, 8, '#0a1410');
    c.strokeStyle = '#123b4a'; c.lineWidth = 7 / u; c.beginPath(); c.moveTo(-3, 0.95); c.bezierCurveTo(-0.6, 0.62, -0.2, 0.9, 0.3, 0.55); c.bezierCurveTo(0.8, 0.2, 1.2, 0.6, 3, 0.1); c.stroke();
    ROADS.forEach(r => line(c, r, 'rgba(150,160,140,.18)', 1.2 / u));
    LIGHTS.forEach(([x, yy, b]) => { alpha(c, 0.25 + b * 0.55); dot(c, x, yy, (0.6 + b * 0.9) / u, '#ffd890'); }); alpha(c, 1);
    /* the path: radio to the mast, light in a fibre (copper wire before the mast and the fibre) */
    const cell = y >= 1979, fibre = y >= 1988;
    line(c, cell ? FIBRE.slice(1) : [USER].concat(FIBRE.slice(2)), fibre ? 'rgba(76,198,210,.75)' : 'rgba(214,150,90,.6)', 2 / u, fibre ? [] : [3 / u, 3 / u]);
    if (cell) { for (let k = 1; k <= 3; k++) { c.strokeStyle = 'rgba(240,177,60,' + (0.5 - k * 0.12) + ')'; c.lineWidth = 1.2 / u; c.beginPath(); c.arc(MAST[0], MAST[1], k * 0.035, 3.6, 5.9); c.stroke(); } line(c, [[MAST[0], MAST[1] + 0.03], [MAST[0], MAST[1] - 0.04]], '#d8dde0', 2 / u); text(c, t('oa.lab.mast'), MAST[0] + 0.05, MAST[1] - 0.03, 11, u, C.mute, 'left'); }
    /* the data centre, at its real size, with a glow so it shows from far away */
    const big = y >= 2023 ? 1.6 : y >= 2006 ? 1.2 : 0.8;
    glow(c, REGION_T[0], REGION_T[1], 22 / u, 'rgba(120,200,255,.45)');
    c.fillStyle = '#9fb4c2'; c.fillRect(REGION_T[0] - 0.0011 * big, REGION_T[1] - 0.0006, 0.0021 * big, 0.0012); c.fillRect(REGION_T[0] - 0.0011 * big, REGION_T[1] + 0.0001, 0.0021 * big, 0.0007);
    text(c, t('oa.lab.dc'), REGION_T[0], REGION_T[1] - 22 / u, 11, u, C.ink);
    if (future()) [[-0.3, 0.5], [0.55, 0.3], [-0.2, -0.45]].forEach(p => { c.strokeStyle = 'rgba(160,220,255,.7)'; c.setLineDash(fdash(u)); c.lineWidth = 1.2 / u; c.strokeRect(p[0] - 0.03, p[1] - 0.02, 0.06, 0.04); c.setLineDash([]); });
    /* you, and your question or the answer in a bubble */
    dot(c, USER[0], USER[1], 4 / u, C.ink); text(c, t('oa.lab.you'), USER[0], USER[1] + 16 / u, 11, u, C.mute);
    if (y >= 1969) {
      const s = K.dir > 0 ? t('oa.ask') : t('oa.reply'), bx = USER[0] - 0.05, by = USER[1] - 40 / u;
      c.save(); const m = c.getTransform(), q = m.transformPoint(new DOMPoint(bx, by)); c.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = m.a / u; c.font = '600 ' + Math.round(12 * dpr) + 'px ' + FONT; const tw = c.measureText(s).width + 16 * dpr, th = 24 * dpr;
      c.fillStyle = K.dir > 0 ? 'rgba(240,177,60,.95)' : 'rgba(76,198,210,.95)'; c.beginPath(); c.roundRect(q.x - 8 * dpr, q.y - th / 2, tw, th, 8 * dpr); c.fill();
      c.fillStyle = '#081117'; c.textBaseline = 'middle'; c.fillText(s, q.x, q.y); c.restore();
    }
    packet(c, u, y >= 1979 ? FIBRE : [USER].concat(FIBRE.slice(2)), sec);
  }

  function sBuilding(c, u, sec) {
    const B = LY.building, y = K.year;
    rect(c, 0, 0, 8, 8, '#0d1512');
    if (B.kind === 'eniac') {
      /* ENIAC's room: about 30 m of panels in a U shape */
      rect(c, 0, 0, 1.1, 0.8, '#2a2622'); c.strokeStyle = '#5a524a'; c.lineWidth = 2 / u; c.strokeRect(-0.55, -0.4, 1.1, 0.8);
      const panel = (x, yy, w, h) => { rect(c, x, yy, w, h, '#4a3b2c'); for (let k = 0; k < 4; k++) dot(c, x - w / 2 + (k + 0.5) * w / 4, yy, Math.min(w, h) * 0.12, 'rgba(255,150,60,.7)'); };
      for (let k = 0; k < 16; k++) panel(-0.4 + k * 0.053, -0.22, 0.045, 0.05);
      for (let k = 0; k < 8; k++) { panel(-0.43, -0.15 + k * 0.05, 0.05, 0.045); panel(0.43, -0.15 + k * 0.05, 0.05, 0.045); }
      packet(c, u, [[-1.2, 0.5], [-0.6, 0.5], [-0.2, 0.1], B.target], sec);
      return;
    }
    if (B.kind === 'room') {
      rect(c, 0, 0, 1.2, 0.8, '#1e262a'); c.strokeStyle = '#4a5860'; c.lineWidth = 2 / u; c.strokeRect(-0.6, -0.4, 1.2, 0.8);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) { rect(c, -0.42 + k * 0.14, -0.22 + r * 0.2, 0.1, 0.06, '#38464e'); dot(c, -0.45 + k * 0.14, -0.22 + r * 0.2, 0.008, (k + r) % 3 ? '#7fd' : '#fa5'); }
      packet(c, u, [[-1.2, 0.5], [-0.65, 0.3], [-0.3, 0.1], B.target], sec);
      return;
    }
    /* the campus: substation, halls (one opened to show its racks), cooling on the roof */
    rect(c, -0.8, -0.5, 0.26, 0.4, '#1b2420'); c.strokeStyle = '#47524d'; c.lineWidth = 1 / u; c.strokeRect(-0.93, -0.7, 0.26, 0.4);
    for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) { rect(c, -0.88 + k * 0.08, -0.62 + j * 0.16, 0.05, 0.08, '#5b6560'); }
    if (future()) { line(c, [[-0.93, -0.42], [-1.6, -0.42]], 'rgba(160,220,255,.8)', 2 / u, fdash(u)); c.strokeStyle = 'rgba(160,220,255,.7)'; c.setLineDash(fdash(u)); c.lineWidth = 1.2 / u; c.strokeRect(-0.5, 0.82, 1.3, 0.55); c.setLineDash([]); }
    const hall = (y0, open) => {
      rect(c, 0.15, y0, 1.3, 0.62, open ? '#1a2328' : '#262f35'); c.strokeStyle = '#56656e'; c.lineWidth = 1.5 / u; c.strokeRect(-0.5, y0 - 0.31, 1.3, 0.62);
      if (open) {
        for (let r = 0; r < 8; r++) {
          const ry = y0 - 0.26 + r * 0.068;
          for (let k = 0; k < 52; k++) { const x = -0.45 + k * 0.0235; rect(c, x, ry, 0.0095, 0.019, r === 2 && k === 25 ? '#f0b13c' : '#3c4b54'); }
          if (B.liquid) line(c, [[-0.46, ry + 0.017], [0.76, ry + 0.017]], 'rgba(76,198,210,.55)', 1.2 / u);
        }
      } else {
        for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) { const x = -0.4 + k * 0.12, yy = y0 - 0.21 + r * 0.14; dot(c, x, yy, 0.035, '#33404a'); c.strokeStyle = '#4c5a64'; c.lineWidth = 1 / u; c.beginPath(); c.arc(x, yy, 0.035, 0, 6.2832); c.stroke(); if (!RM) { const a = sec * 4 + k + r; line(c, [[x - Math.cos(a) * 0.03, yy - Math.sin(a) * 0.03], [x + Math.cos(a) * 0.03, yy + Math.sin(a) * 0.03]], '#5d6c76', 1 / u); } }
        if (B.liquid) glow(c, 0.15, y0, 0.7, 'rgba(255,120,60,.12)');
      }
    };
    hall(-0.38, true); if (B.halls > 1) hall(0.43, false);
    line(c, [[-0.67, -0.5], [-0.5, -0.5]], '#c9a85a', 2 / u);
    packet(c, u, [[-1.6, -0.3], [-0.5, -0.3], [-0.47, B.target[1]], B.target], sec);
  }

  function sRack(c, u, sec) {
    const R = LY.rack, y = K.year;
    rect(c, 0, 0, 8, 8, '#0b1216'); rect(c, 0, 1.6, 8, 1.5, '#0f181d');
    const frame = (x, a) => { alpha(c, a); rect(c, x, 0, 0.5, 1.72, '#11181d'); c.strokeStyle = '#3a4650'; c.lineWidth = 2 / u; c.strokeRect(x - 0.25, -0.86, 0.5, 1.72); };
    [-0.7, 0.7].forEach(x => frame(x, 0.45)); frame(0, 1);
    const tray = (yy, h, kind, x0) => {
      const x = x0 || 0; rect(c, x, yy, 0.44, h * 0.92, kind === 'sw' ? '#1d262d' : kind === 'pw' ? '#2a2a2a' : '#232c33');
      if (kind === 'gpu') for (let k = 0; k < 6; k++) dot(c, x - 0.19 + k * 0.012, yy, 0.0035, k === 0 ? '#5f5' : '#f0b13c');
      if (kind === 'sw') for (let k = 0; k < 18; k++) rect(c, x - 0.17 + k * 0.02, yy, 0.012, h * 0.4, '#0b0f12');
    };
    [-0.7, 0, 0.7].forEach((x, idx) => {
      alpha(c, idx === 1 ? 1 : 0.45);
      if (R.kind === 'eniac') { for (let r = 0; r < 18; r++) for (let k = 0; k < 8; k++) dot(c, x - 0.19 + k * 0.054, -0.78 + r * 0.09, 0.016, 'rgba(255,150,60,' + (0.4 + ((r * 7 + k * 3) % 5) * 0.12) + ')'); }
      else if (R.kind === 'mainframe') { for (let k = 0; k < 2; k++) { c.strokeStyle = '#8a949c'; c.lineWidth = 2 / u; c.beginPath(); c.arc(x - 0.1 + k * 0.2, -0.5, 0.08, 0, 6.2832); c.stroke(); } for (let r = 0; r < 6; r++) for (let k = 0; k < 10; k++) dot(c, x - 0.18 + k * 0.04, 0.1 + r * 0.05, 0.007, (r + k) % 4 ? '#fa4' : '#5f5'); }
      else R.trays.forEach(([yy, th, kind]) => tray(yy, th, kind, x));
      if (y >= 2023 && R.kind !== 'eniac') { line(c, [[x - 0.235, -0.84], [x - 0.235, 0.84]], 'rgba(76,198,210,.7)', 3 / u); line(c, [[x + 0.235, -0.84], [x + 0.235, 0.84]], 'rgba(230,110,80,.7)', 3 / u); }
    });
    alpha(c, 1);
    c.strokeStyle = '#f0b13c'; c.lineWidth = 1.5 / u; c.strokeRect(-0.23, R.target[1] - R.th / 2, 0.46, R.th);
    if (future()) for (let k = 0; k < 5; k++) line(c, [[-0.2, -0.3 + k * 0.05], [0.2, 0.42 - k * 0.04]], 'rgba(160,220,255,.6)', 1 / u, fdash(u));
    packet(c, u, [[0.6, -1.2], [0.1, -0.9], [0, -0.3], [0, 0.0], R.target], sec);
  }

  /* A package: substrate, dies (with their grid of cores) and memory around them. k: scale; full: draw the cores. */
  function pkgDraw(c, u, L, x0, y0, k, full, sec) {
    rect(c, x0, y0, L.sub[0] * k, L.sub[1] * k, '#2b3a2a');
    if (L.hbm.length) rect(c, x0, y0, (L.sub[0] - 0.3) * k, (L.sub[1] - 0.6) * k, '#3a3f45');
    for (let g = 0; g < L.gddr; g++) { const a = g / L.gddr * 6.283; rect(c, x0 + Math.cos(a) * 0.95 * k, y0 + Math.sin(a) * 0.85 * k, 0.22 * k, 0.16 * k, '#20262b'); }
    L.hbm.forEach(([hx, hy, hw, hh]) => { rect(c, x0 + hx * k, y0 + hy * k, hw * k, hh * k, C.hbm); if (full) for (let j = 0; j < 4; j++) line(c, [[x0 + (hx - hw / 2 + 0.03) * k, y0 + (hy - hh / 2 + (j + 1) * hh / 5) * k], [x0 + (hx + hw / 2 - 0.03) * k, y0 + (hy - hh / 2 + (j + 1) * hh / 5) * k]], 'rgba(255,220,180,.2)', 1 / u); });
    L.dies.forEach(([dx, dy, dw, dh]) => {
      rect(c, x0 + dx * k, y0 + dy * k, dw * k, dh * k, C.die);
      if (!full) return;
      const S = L.sm, left = dx - dw / 2 + S.m, top = dy - dh / 2 + S.m;
      if (S.strip) rect(c, dx, dy, dw - 2 * S.m, S.strip * 0.8, '#5b5f86');
      for (let r = 0; r < L.rows; r++) for (let q = 0; q < L.cols; q++) {
        const sx = left + q * S.sw, sy = top + r * S.sh + (r >= L.rows / 2 ? S.strip : 0);
        c.fillStyle = C.sm; c.fillRect(x0 + (sx + S.sw * 0.05) * k, y0 + (sy + S.sh * 0.05) * k, S.sw * 0.9 * k, S.sh * 0.9 * k);
        if (L.cols > 1) for (let a = 0; a < 4; a++) { c.fillStyle = '#6b73a8'; c.fillRect(x0 + (sx + S.sw * (0.1 + (a % 2) * 0.43)) * k, y0 + (sy + S.sh * (0.12 + (a >> 1) * 0.42)) * k, S.sw * 0.34 * k, S.sh * 0.32 * k); }
      }
    });
  }
  function sBoard(c, u, sec) {
    const B = LY.board, L = LY.chip, y = K.year;
    rect(c, 0, 0, 8, 8, '#0a1210'); rect(c, 0, 0, 2.9, 1.9, C.pcb);
    c.strokeStyle = 'rgba(43,122,91,.6)'; c.lineWidth = 1 / u; c.beginPath(); for (let k = 0; k < 26; k++) { const yy = -0.85 + k * 0.068; c.moveTo(-1.4, yy); c.lineTo(-0.9, yy); c.lineTo(-0.75, yy * 0.6); } c.stroke();
    const k = 0.0225 / 0.15;                                 /* chip units to board units */
    if (B.kind === 'cpu') {
      rect(c, B.target[0], B.target[1], 0.32, 0.32, '#3a3a3a'); pkgDraw(c, u, L, B.target[0], B.target[1], k, false);
      for (let j = 0; j < 4; j++) rect(c, 0.45 + j * 0.09, 0, 0.04, 0.9, '#1d4a3a');
      text(c, t('oa.lab.cpu'), B.target[0], B.target[1] + 0.25, 11, u, C.mute);
    } else if (B.kind === 'card') {
      rect(c, 0, 0, 1.8, 0.9, '#123528'); pkgDraw(c, u, L, B.target[0], B.target[1], k, false);
      line(c, [[-0.9, 0.46], [0.9, 0.46]], C.gold, 4 / u);
    } else {
      [[-0.42, -0.05], [0.42, -0.05]].forEach(([x, yy]) => pkgDraw(c, u, L, x, yy, k, false));
      rect(c, 0, 0.62, 0.36, 0.3, '#2b3a2a'); rect(c, 0, 0.62, 0.2, 0.17, C.die); text(c, t('oa.lab.cpu'), 0, 0.84, 11, u, C.mute);
      for (let j = 0; j < 8; j++) rect(c, -0.3 + (j % 4) * 0.2, 0.62 + (j < 4 ? -0.24 : 0.24) * 0.9, 0.1, 0.05, '#20262b');
      text(c, t('oa.lab.gpu'), -0.42, -0.36, 11, u, C.mute); text(c, t('oa.lab.gpu'), 0.42, -0.36, 11, u, C.mute);
      if (y >= 2023) { c.strokeStyle = 'rgba(76,198,210,.6)'; c.lineWidth = 2 / u; c.strokeRect(-0.7, -0.33, 1.4, 0.56); }
    }
    if (future()) { c.strokeStyle = 'rgba(160,220,255,.75)'; c.setLineDash(fdash(u)); c.lineWidth = 1.2 / u; c.strokeRect(B.target[0] - 0.1, B.target[1] - 0.2, 0.2, 0.14); c.setLineDash([]); }
    packet(c, u, [[-1.5, 0.75], [-0.4, 0.75], [0, 0.62], [0.2, 0.3], B.target], sec);
  }

  function sChip(c, u, sec) {
    const L = LY.chip, y = K.year;
    rect(c, 0, 0, 8, 8, '#14201a');
    pkgDraw(c, u, L, 0, 0, 1, true, sec);
    /* inside the target core: its quarters, one tensor core, and the multiply-add grid at its real size */
    const tg = L.target, S = L.sm;
    if (L.cols > 1) { c.strokeStyle = '#f0b13c'; c.lineWidth = 1.5 / u; c.strokeRect(S.x + S.sw * 0.05, S.y + S.sh * 0.05, S.sw * 0.9, S.sh * 0.9); }
    const tc = L.tile * 6;
    rect(c, tg[0], tg[1], tc, tc, '#7d86c4'); rect(c, tg[0], tg[1], L.tile * 2.1, L.tile * 2.1, '#5b5f86');
    for (let a = 0; a < MAC.G; a++) for (let b = 0; b < MAC.G; b++) rect(c, tg[0] + (a - 3) * L.tile * 2 / 8, tg[1] + (b - 3) * L.tile * 2 / 8, L.tile * 2 / 8 * 0.8, L.tile * 2 / 8 * 0.8, '#8f98d8');
    if (L.hbm.length) text(c, t('oa.lab.hbm'), L.hbm[1][0], L.hbm[1][1] - L.hbm[1][3] / 2 - 14 / u, 11, u, C.mute);
    if (L.dies.length > 1) line(c, [[0, -0.62], [0, 0.62]], 'rgba(240,177,60,.35)', 1 / u, [3 / u, 3 / u]);
    if (future()) { c.strokeStyle = 'rgba(160,220,255,.75)'; c.setLineDash(fdash(u)); c.lineWidth = 1.2 / u; L.dies.forEach(([dx, dy, dw, dh]) => c.strokeRect(dx - dw / 2 - 0.05, dy - dh / 2 - 0.05, dw + 0.1, dh + 0.1)); c.setLineDash([]); }
    const from = L.hbm.length ? [L.hbm[1][0], L.hbm[1][1]] : [1.2, -0.6];
    packet(c, u, [from, [tg[0] + 0.2, tg[1] - 0.12], tg], sec);
  }

  /* design coordinates of the adder (grid steps) to block units, inside its multiply-add unit */
  function sBlock(c, u, sec) {
    const Sz = sizes(Z), U = Z.um, h = Sz.block / 2, p = Sz.pitch / h, y = K.year, I = inner(Z);
    rect(c, 0, 0, 8, 8, '#2c3048');
    const G = MAC.G, R = rng(5), show = (a, b) => y >= 2017 ? true : y >= 2006 ? b === MAC.mine[1] : b === MAC.mine[1] && Math.abs(a - MAC.mine[0]) <= 1;
    for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) {
      const x = (a - (G - 1) / 2) * p, yy = (b - (G - 1) / 2) * p, mine = a === MAC.mine[0] && b === MAC.mine[1], empty = a === 1 && b === G - 1;
      if (!show(a, b)) continue;
      if (empty) { c.strokeStyle = 'rgba(200,205,255,.5)'; c.setLineDash([4 / u, 4 / u]); c.lineWidth = 1.2 / u; c.strokeRect(x - p * 0.43, yy - p * 0.43, p * 0.86, p * 0.86); c.setLineDash([]); continue; }
      rect(c, x, yy, p * 0.86, p * 0.86, mine ? '#3a3f63' : '#383c5a');
      if (!mine) for (let r = 0; r < 6; r++) { let cx = -0.4; while (cx < 0.4) { const w = 0.05 + R() * 0.12; c.fillStyle = 'rgba(160,170,230,' + (0.15 + R() * 0.25) + ')'; c.fillRect(x + cx * p, yy + (-0.38 + r * 0.13) * p, Math.min(w, 0.4 - cx) * p * 0.9, 0.1 * p); cx += w; } }
    }
    /* numbers flowing through the grid: rightwards along rows, downwards along columns */
    if (y >= 2017 && !RM) for (let a = 0; a < G; a++) { const ph = (sec * 0.6 + a * 0.17) % 1; dot(c, (-0.5 * G + ph * G) * p, (a - 3) * p, 2.2 / u, 'rgba(240,177,60,.8)'); dot(c, (a - 3) * p, (-0.5 * G + ((sec * 0.6 + a * 0.29) % 1) * G) * p, 2.2 / u, 'rgba(76,198,210,.8)'); }
    if (future()) for (let b = 0; b < G - 1; b++) { c.strokeStyle = 'rgba(160,220,255,.6)'; c.setLineDash(fdash(u)); c.lineWidth = 1 / u; c.strokeRect(-G / 2 * p, (b - 2.5) * p - p * 0.06, G * p, p * 0.12); c.setLineDash([]); }
    /* the adder: real cells, real wires, real values */
    const ox = I.unit[0] / h, oy = I.unit[1] / h, ux = U.ux / h, uy = U.uy / h;
    const dX = gx => ox + (gx * U.ux - U.dW / 2) / h, dY = gy => oy + (gy * U.uy - U.dH / 2) / h;
    c.fillStyle = '#5b5f86'; c.fillRect(dX(0), dY(0), Z.PL.GW * ux, Z.PL.H * uy);
    Z.cells.forEach((cl, i) => {
      c.fillStyle = CELLC[cl.type]; alpha(c, 0.85); c.fillRect(dX(cl.x) + ux * 0.08, dY(cl.y) + uy * 0.1, cl.w * ux - ux * 0.16, 3 * uy - uy * 0.2); alpha(c, 1);
      if (cl.w * ux * u > 30) text(c, cl.type, dX(cl.x + cl.w / 2), dY(cl.y + 0.55), Math.min(11, cl.w * ux * u / 5), u, '#10161a');
      if (i === Z.pick) { c.strokeStyle = C.q; c.lineWidth = 2.5 / u; c.strokeRect(dX(cl.x), dY(cl.y), cl.w * ux, 3 * uy); }
    });
    const GW = Z.PL.GW;
    Object.entries(Z.RT.paths).forEach(([n, segs]) => {
      const col = val(SIG.net[n]); c.strokeStyle = col; c.lineWidth = Math.max(1, Math.min(ux, uy) * u * 0.35) / u;
      segs.forEach(pth => { for (let k = 1; k < pth.length; k++) { const a = pth[k - 1], b = pth[k]; if (a % 2 !== b % 2) continue; const qa = (a - a % 2) / 2, qb = (b - b % 2) / 2, xa = qa % GW, ya = (qa - xa) / GW, xb = qb % GW, yb = (qb - xb) / GW; alpha(c, a % 2 ? 0.75 : 1); c.beginPath(); c.moveTo(dX(xa + 0.5), dY(ya + 0.5)); c.lineTo(dX(xb + 0.5), dY(yb + 0.5)); c.stroke(); alpha(c, 1); } });
    });
    c.strokeStyle = 'rgba(240,177,60,.6)'; c.lineWidth = 1.5 / u; c.strokeRect(ox - p * 0.43, oy - p * 0.43, p * 0.86, p * 0.86);
    text(c, sumLine(), ox, oy + p * 0.56, 11, u, C.ink);
  }
  /* The adder's inputs change by themselves, so the bits keep moving: a + b + cin. */
  let SIG = null, INS = [1, 1, 0];
  const sumLine = () => Z.proj.ins.map((k, j) => k + '=' + INS[j]).join(' ') + '  →  ' + Z.proj.outs.map(k => k + '=' + SIG.out[k]).join(' ');
  function tickInputs(sec) {
    const n = RM ? 3 : Math.floor(sec / 1.8) % 8, ins = [n & 1, n >> 1 & 1, n >> 2 & 1];
    if (!SIG || ins.join() !== INS.join() || SIG.z !== Z) { INS = ins; SIG = signals(Z, INS, {}); SIG.z = Z; }
  }

  function sGate(c, u) {
    const half = sizes(Z).gate / 2, w = Z.um.cW / half, h = Z.um.cH / half, x0 = -w / 2, y0 = -h / 2, X = f => x0 + f * w, Y = f => y0 + f * h;
    const cl = Z.cell, E = evalCell(cl.type, SIG.cellIns[Z.pick]), V = E.v, lw = Math.max(1.5, w * u * 0.006) / u;
    rect(c, 0, 0, 8, 8, '#30344f');
    c.fillStyle = CELLC[cl.type]; alpha(c, 0.22); c.fillRect(x0, y0, w, h); alpha(c, 1);
    c.strokeStyle = CELLC[cl.type]; c.lineWidth = lw; c.strokeRect(x0, y0, w, h);
    const fs = Math.max(10, Math.min(13, w * u / 30));
    c.fillStyle = C.one; c.fillRect(x0, Y(0.04), w, h * 0.03); c.fillStyle = C.zero; c.fillRect(x0, Y(0.93), w, h * 0.03);
    text(c, t('cz.vdd'), X(0.012), Y(0.0), fs * 0.85, u, C.mute, 'left'); text(c, t('cz.gnd'), X(0.012), Y(1.0), fs * 0.85, u, C.mute, 'left');
    const wire = (xa, ya, xb, yb, on) => { c.strokeStyle = on ? C.on : C.off; c.lineWidth = lw; c.beginPath(); c.moveTo(X(xa), Y(ya)); c.lineTo(X(xb), Y(yb)); c.stroke(); };
    const fet = (f, on) => {
      const cx = f.x, top = f.box.y + f.box.h * 0.22, bot = f.box.y + f.box.h * 0.78, mid = (top + bot) / 2, gp = f.box.h * 0.14;
      wire(cx, f.box.y, cx, mid - gp, on); wire(cx, mid + gp, cx, f.box.y + f.box.h, on);
      c.strokeStyle = on ? C.on : C.off; c.lineWidth = lw * 1.6; c.beginPath(); c.moveTo(X(cx), Y(mid - gp)); c.lineTo(on ? X(cx) : X(cx + f.box.w * 0.22), Y(mid + gp)); c.stroke();
      const gv = f.gate === '1' ? 1 : f.gate === '0' ? 0 : V[f.gate];
      dot(c, X(cx - f.box.w * 0.18), Y(mid), Math.min(w * f.box.w, h * f.box.h) * 0.07, f.kind === 'p' ? '#c58ab3' : '#7fb0e0');
      text(c, f.gate + '=' + gv, X(cx - f.box.w * 0.18), Y(mid + f.box.h * 0.2), fs * 0.8, u, C.ink);
      if (f.i === Z.fetI) { c.strokeStyle = C.q; c.setLineDash([4 / u, 3 / u]); c.lineWidth = lw; c.strokeRect(X(f.box.x + f.box.w * 0.05), Y(f.box.y + f.box.h * 0.05), w * f.box.w * 0.9, h * f.box.h * 0.9); c.setLineDash([]); }
    };
    const net = (n, on) => {
      if (n.fet != null) { fet(Z.circuit.fets[n.fet], E.on[n.fet]); return; }
      const b = n.box, kids = n.s || n.p;
      if (n.p) { const xs = kids.map(k => k.box.x + k.box.w / 2); wire(xs[0], b.y, xs[xs.length - 1], b.y, on); wire(xs[0], b.y + b.h, xs[xs.length - 1], b.y + b.h, on); }
      kids.forEach(k => net(k, on));
      if (n.p) kids.forEach(k => { const kx = k.box.x + k.box.w / 2; wire(kx, b.y, kx, k.box.y, on); wire(kx, k.box.y + k.box.h, kx, b.y + b.h, on); });
    };
    Z.circuit.stages.forEach(st => {
      const mx = st.mid, outV = V[st.out];
      wire(mx, 0.055, mx, 0.12, outV === 1); net(st.pu, outV === 1); wire(mx, 0.46, mx, 0.54, true);
      net(st.pd, outV === 0); wire(mx, 0.88, mx, 0.94, outV === 0);
      dot(c, X(mx), Y(0.5), Math.min(w, h) * 0.022, val(outV));
      text(c, st.out + '=' + outV, X(mx + st.box.w * 0.08), Y(0.5), fs, u, C.ink, 'left');
    });
    text(c, cl.type + ' · ' + sumLine(), 0, y0 + h + 22 / u, 12, u, C.ink);
    if (future()) { [-0.3, 0.3].forEach(yy => line(c, [[-1.4, yy * h], [1.4, yy * h]], 'rgba(160,220,255,.55)', 3 / u, fdash(u))); }
  }

  function sSwitch(c, u, sec) {
    const f = Z.circuit.fets[Z.fetI], E = evalCell(Z.cell.type, SIG.cellIns[Z.pick]), on = E.on[Z.fetI];
    const gate = f.gate === '1' ? 1 : f.gate === '0' ? 0 : E.v[f.gate], p = f.kind === 'p', sh = shapeFor(K.year), Lg = 2 / 7, fs = 13;
    rect(c, 0, 0, 8, 8, C.bg);
    const flow = (ys) => { if (!on) return; const n = 9; for (let k = 0; k < n; k++) { const ph = RM ? k / n : ((k / n + sec * 0.35) % 1); dot(c, -0.62 + ph * 1.24, ys[k % ys.length], 0.018, p ? '#ffb4a0' : '#a8e0ff'); } };
    if (sh === 'contact') {
      /* 1947: a germanium crystal, two gold contacts pressed onto it a hair's width apart */
      rect(c, 0, 0.5, 2.2, 0.9, '#55624a'); rect(c, 0, 1.0, 2.2, 0.12, C.metal);
      c.fillStyle = '#c9b88a'; c.beginPath(); c.moveTo(-0.3, -0.7); c.lineTo(0.3, -0.7); c.lineTo(0.02, 0.05); c.lineTo(-0.02, 0.05); c.closePath(); c.fill();
      line(c, [[-0.06, -0.3], [-0.03, 0.05]], C.gold, 4 / u); line(c, [[0.06, -0.3], [0.03, 0.05]], C.gold, 4 / u);
      text(c, t('oa.lab.contact'), 0.32, -0.25, fs, u, C.ink, 'left'); text(c, t('oa.lab.ge'), 0, 0.62, fs, u, C.ink);
      if (on && !RM) for (let k = 0; k < 6; k++) { const ph = (k / 6 + sec * 0.4) % 1; dot(c, -0.03 + ph * 0.06, 0.08 + Math.sin(ph * 3.14) * 0.06, 0.012, '#ffb4a0'); }
    } else {
      const base = sh === 'planar' ? 0.05 : sh === 'fin' ? 0.37 : 0.27; rect(c, 0, base + 0.5, 2.4, 1, p ? C.nwell : C.sub);
      if (sh === 'planar') {
        rect(c, -0.53, 0.21, 0.82, 0.32, p ? C.pdiff : C.ndiff); rect(c, 0.53, 0.21, 0.82, 0.32, p ? C.pdiff : C.ndiff);
        rect(c, 0, 0.035, Lg, 0.03, C.oxide); rect(c, 0, -0.13, Lg, 0.3, K.year >= 2007 ? C.metal : C.poly);
        if (on) rect(c, 0, 0.07, Lg + 0.04, 0.035, 'rgba(240,177,60,.85)');
        flow([0.07]);
      } else if (sh === 'fin') {
        rect(c, 0, 0.06, 1.9, 0.62, p ? C.pdiff : C.ndiff); rect(c, 0, 0.06, Lg + 0.02, 0.62, '#9aa6ae');
        c.fillStyle = 'rgba(138,143,153,.55)'; c.fillRect(-Lg / 2 - 0.02, -0.42, Lg + 0.04, 0.82); c.strokeStyle = C.metal; c.lineWidth = 2 / u; c.strokeRect(-Lg / 2 - 0.02, -0.42, Lg + 0.04, 0.82);
        if (on) rect(c, 0, 0.06, Lg, 0.5, 'rgba(240,177,60,.55)');
        flow([-0.12, 0.05, 0.2]);
      } else {
        const stack = (ys, col, dash) => { ys.forEach(yy => { rect(c, -0.5, yy, 0.76, 0.1, col); rect(c, 0.5, yy, 0.76, 0.1, col); }); c.fillStyle = dash ? 'rgba(109,116,128,.35)' : '#6d7480'; c.fillRect(-Lg / 2, ys[0] - 0.12, Lg, ys[ys.length - 1] - ys[0] + 0.24); ys.forEach(yy => rect(c, 0, yy, Lg + 0.06, 0.05, on && !dash ? C.on : '#9aa6ae')); };
        if (sh === 'gaa') { stack([-0.17, -0.02, 0.13], p ? C.pdiff : C.ndiff); flow([-0.17, -0.02, 0.13]); }
        else { stack([0.04, 0.17], C.ndiff); c.setLineDash(fdash(u)); stack([-0.34, -0.21], C.pdiff, true); c.strokeStyle = 'rgba(160,220,255,.8)'; c.lineWidth = 1.2 / u; c.strokeRect(-0.9, -0.42, 1.8, 0.32); c.setLineDash([]); flow([0.04, 0.17]); }
        rect(c, -0.55, -0.42, 0.14, 0.16, C.metal); rect(c, 0.55, -0.42, 0.14, 0.16, C.metal);
      }
      rect(c, 0, -0.42, 0.1, 0.14, val(gate));
      text(c, t('cz.source'), -0.55, 0.47, fs, u); text(c, t('cz.drain'), 0.55, 0.47, fs, u); text(c, t('cz.gate') + ' = ' + gate, 0, -0.55, fs, u);
    }
    text(c, (sh === 'contact' ? '' : t(p ? 'cz.pfet' : 'cz.nfet') + ' · ') + t(on ? 'cz.isOn' : 'cz.isOff'), 0, 0.76, fs, u, on ? C.on : C.mute);
  }

  const R3 = rng(77), OX = Array.from({ length: 120 }, () => [R3() * 4 - 2, -0.51 + R3() * 0.24]), DOP = Array.from({ length: 5 }, () => [Math.floor(R3() * 14) - 7, Math.floor(R3() * 8) + 1]);
  function sAtom(c, u, sec) {
    const ge = materialFor(K.year) === 'ge', a = (ge ? 0.566 : 0.543) / 2, y = K.year;
    const E = evalCell(Z.cell.type, SIG.cellIns[Z.pick]), on = E.on[Z.fetI];
    rect(c, 0, 0, 8, 8, '#070d12');
    /* the crystal: a diamond lattice seen from the side, bonds and atoms */
    const at = (i, j) => [i * a + (j % 2 ? a / 2 : 0), -0.22 + j * a * 0.72];
    c.strokeStyle = 'rgba(150,170,200,.25)'; c.lineWidth = 1.5 / u;
    for (let j = 0; j < 12; j++) for (let i = -10; i <= 10; i++) { const p0 = at(i, j), p1 = at(i, j + 1), p2 = at(i + (j % 2 ? 1 : -1), j + 1); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.moveTo(p0[0], p0[1]); c.lineTo(p2[0], p2[1]); c.stroke(); }
    for (let j = 0; j < 12; j++) for (let i = -10; i <= 10; i++) { const p0 = at(i, j), d = DOP.some(q => q[0] === i && q[1] === j); dot(c, p0[0], p0[1], a * 0.2, d ? '#e0a050' : ge ? C.ge : C.si); }
    /* the insulator (amorphous; heavier atoms after 2007) and the gate on top */
    OX.forEach(([x, yy], k) => { if (x < -0.45 && x > -0.9 && yy < -0.45) alpha(c, 0.25); const heavy = y >= 2007 && k % 3 === 0; dot(c, x, yy, heavy ? 0.048 : 0.032, heavy ? '#d0b070' : '#c96a6a'); alpha(c, 1); });
    rect(c, 0, -0.95, 8, 0.82, '#2c3038'); for (let i = -14; i <= 14; i++) for (let j = 0; j < 3; j++) dot(c, i * 0.2 + j * 0.1, -0.86 + j * 0.11, 0.045, '#7a808a');
    text(c, t('oa.lab.oxide'), -1.1, -0.38, 12, u, C.ink, 'left'); text(c, t(ge ? 'oa.lab.ge' : 'oa.lab.si'), -1.1, 0.25, 12, u, C.ink, 'left');
    /* electrons: drifting under the insulator while the switch is on; now and then one slips through */
    if (on) for (let k = 0; k < 10; k++) { const ph = RM ? k / 10 : (k / 10 + sec * 0.22) % 1; const x = -1.8 + ph * 3.6, yy = -0.16 + Math.sin(ph * 40 + k) * 0.03; glow(c, x, yy, 0.09, 'rgba(120,200,255,.5)'); dot(c, x, yy, 0.025, '#bfe8ff'); }
    if (!RM) { const ph = (sec * 0.3) % 1; if (ph < 0.5) { const yy = -0.16 - ph * 0.8; c.setLineDash([3 / u, 3 / u]); line(c, [[0.3, -0.16], [0.3, yy]], 'rgba(191,232,255,.6)', 1 / u); dot(c, 0.3, yy, 0.025, '#bfe8ff'); } }
    if (on) text(c, t('oa.lab.electrons'), 0.75, -0.02, 12, u, '#bfe8ff', 'left');
    if (future()) { c.setLineDash(fdash(u)); c.strokeStyle = 'rgba(160,220,255,.8)'; c.lineWidth = 1.2 / u; c.beginPath(); for (let i = -12; i < 12; i++) { const x = i * 0.25; c.moveTo(x, 0.98); c.lineTo(x + 0.125, 0.9); c.lineTo(x + 0.25, 0.98); } c.stroke(); c.setLineDash([]); }
  }
  const SC = [sPlanet, sRegion, sBuilding, sRack, sBoard, sChip, sBlock, sGate, sSwitch, sAtom];

  /* ---- open edges: broken rings, drawn at a fixed size on screen ---- */
  function edgeMarks(c, u, idx, sec) {
    EDGES.forEach(e => {
      if (e.depth !== IDS[idx]) return;
      const [x, y] = e.at, r = 15 / u, got = FOUND.includes(e.id), rot = RM ? 0 : sec * 0.6;
      glow(c, x, y, 34 / u, got ? 'rgba(255,240,200,.35)' : 'rgba(255,220,150,.4)');
      c.strokeStyle = got ? '#fff1c9' : '#ffe0a0'; c.lineWidth = 2 / u;
      for (let k = 0; k < 5; k++) { const a0 = rot + k * 1.2566; c.beginPath(); c.arc(x, y, r, a0, a0 + 0.75); c.stroke(); }
      if (got) { c.fillStyle = '#fff6dc'; c.beginPath(); for (let k = 0; k < 8; k++) { const rr = (k % 2 ? 2.4 : 7) / u, a0 = k * Math.PI / 4 - Math.PI / 2; c.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr); } c.closePath(); c.fill(); }
      else { c.setLineDash([2 / u, 3 / u]); for (let k = 0; k < 3; k++) { const a0 = rot * 0.5 + k * 2.1; line(c, [[x + Math.cos(a0) * r * 1.2, y + Math.sin(a0) * r * 1.2], [x + Math.cos(a0) * r * 2, y + Math.sin(a0) * r * 2]], 'rgba(255,224,160,.7)', 1.2 / u, [2 / u, 3 / u]); } c.setLineDash([]); dot(c, x, y, 2.5 / u, '#ffe0a0'); }
    });
  }
  /* After today: the scene sits on blueprint paper. */
  function blueprint(c, u, A, B) {
    c.strokeStyle = 'rgba(120,200,255,.09)'; c.lineWidth = 1 / u; const st = 26 / u; c.beginPath();
    for (let x = -A - st; x < A + st; x += st) { c.moveTo(x, -B - st); c.lineTo(x, B + st); }
    for (let y = -B - st; y < B + st; y += st) { c.moveTo(-A - st, y); c.lineTo(A + st, y); }
    c.stroke();
  }

  /* ---- the zoom ---- */
  let playing = false, goal = null, dwell = 0, last = performance.now(), visible = true, lastIdx = -1, A = 1, Bv = 1, U = 1;
  function frame(w, h) {
    let i = Math.floor(K.t + 1e-9), f = K.t - i; if (i >= N - 1) { i = N - 1; f = 0; }
    U = Math.min(w, h) / 2 * 0.94; A = w / 2 / U; Bv = h / 2 / U;
    const r = i < N - 1 ? L[i].size / L[i + 1].size : 1, s = Math.pow(r, f);
    return { i, f, r, s, Tg: i < N - 1 ? L[i].T : [0, 0] };
  }
  function draw(now) {
    if (!cv.isConnected) return;
    const { ctx: c, w, h, d } = fit(cv), sec = now / 1000;
    tickInputs(sec);
    c.setTransform(d, 0, 0, d, 0, 0); c.fillStyle = C.bg; c.fillRect(0, 0, w, h);
    const { i, f, r, s, Tg } = frame(w, h), k = r > 1 ? (1 - 1 / s) * r / (r - 1) : 0;
    const base = new DOMMatrix([d, 0, 0, d, 0, 0]).translate(w / 2, h / 2).scale(U * s).translate(-Tg[0] * k, -Tg[1] * k);
    const scene = (idx, m, px, a) => {
      c.save(); c.setTransform(m); GA = a; c.globalAlpha = a; c.beginPath(); c.rect(-A, -Bv, 2 * A, 2 * Bv); c.clip();
      const st = stateAt(IDS[idx], K.year);
      if (st === 'ghost') c.filter = 'grayscale(1) brightness(.8)';
      SC[idx](c, px, sec);
      c.filter = 'none';
      if (st === 'ghost') { c.globalAlpha = a; c.fillStyle = 'rgba(8,17,23,.62)'; c.fillRect(-4, -4, 8, 8); }
      if (st === 'future') { c.globalAlpha = a; blueprint(c, px, A, Bv); }
      c.globalAlpha = a; edgeMarks(c, px, idx, sec);
      c.restore(); GA = 1;
    };
    scene(i, base, U * s, 1);
    if (i < N - 1) {
      c.save(); c.setTransform(base); c.globalAlpha = Math.max(0, 1 - f * 1.6); c.strokeStyle = C.q; c.lineWidth = 1.5 / (U * s); c.setLineDash([5 / (U * s), 4 / (U * s)]); c.strokeRect(Tg[0] - A / r, Tg[1] - Bv / r, 2 * A / r, 2 * Bv / r); c.restore();
      const a = clamp((f - 0.12) / 0.5, 0, 1); if (a > 0) scene(i + 1, base.translate(Tg[0], Tg[1]).scale(1 / r), U * s / r, a);
    }
    hud(i, s);
    placeEdges(w, h);
  }
  function hud(i, s) {
    const fov = L[i].size / s * A;                         /* metres across the whole canvas */
    $('oaFov').textContent = len(fov);
    const mPerPx = L[i].size / s / (2 * U), target = mPerPx * 90, p10 = Math.pow(10, Math.floor(Math.log10(target)));
    let nice = p10; for (const m of [1, 2, 5]) if (m * p10 <= target) nice = m * p10;
    $('oaBar').textContent = len(nice); $('oaBarI').style.width = (nice / mPerPx) + 'px';
    const near = Math.round(K.t);
    if (near !== lastIdx) { lastIdx = near; words(near); }
  }
  /* Everything in words for one depth: name, story, the time line, how many edges are here. */
  function words(near) {
    const id = IDS[near], st = stateAt(id, K.year), snap = snapshot(K.year), node = Z.nd.t;
    $('oaName').textContent = t('oa.depth.' + id); $('oaIdx').textContent = t('oa.of', { n: near + 1, total: N });
    [...$('oaLevels').children].forEach((b, k) => b.setAttribute('aria-current', k === near ? 'true' : 'false'));
    const arrived = K.dir < 0 && near === HOME_D && K.arrived;
    $('oaDir').textContent = arrived ? t('oa.arrived') : t(K.dir > 0 ? 'oa.down' : 'oa.up');
    $('oaStory').textContent = arrived ? t('oa.arrivedD') : K.dir < 0 ? t('oa.u.' + id) : t('oa.d.' + id + '.story', { node });
    const key = lineAt(id, K.year), fy = K.year > NOW ? K.year : snap.y;
    $('oaTime').textContent = t('oa.t.' + id + '.' + key, { year: fy, chip: snap.biggest.name, n: fmtWords(K.year > NOW ? trendTransistors(K.year) : snap.biggest.tr) });
    const kind = st === 'ghost' ? 'ghost' : st === 'future' ? 'future' : K.year === NOW ? 'now' : 'past';
    const pill = $('oaState'); pill.textContent = t('oa.state.' + kind); pill.className = 'pill ' + ({ ghost: 'out', future: 'proj', now: 'ship', past: 'ann' }[kind]);
    const stamp = $('oaStamp'); stamp.hidden = st === 'real'; stamp.textContent = st === 'ghost' ? t('oa.stamp.ghost', { year: K.year }) : st === 'future' ? t('oa.stamp.future') : '';
    stamp.className = 'oastamp ' + st;
    const n = EDGES.filter(e => e.depth === id).length;
    $('oaHere').textContent = n ? t('oa.here', { n }) : t('oa.hereNone');
    edgeButtons(id);
    setPlay();
  }

  /* ---- edges as real buttons over the canvas, so they can be reached by keyboard and touch ---- */
  const box = $('oaEdges');
  function edgeButtons(id) {
    box.innerHTML = EDGES.filter(e => e.depth === id).map(e => '<button type="button" class="oaedge' + (FOUND.includes(e.id) ? ' got' : '') + '" data-edge="' + e.id + '" aria-label="' + esc(t('oa.edgeBtn', { place: t('oa.e.' + e.id + '.place') })) + '" title="' + esc(t('oa.e.' + e.id + '.place')) + '"></button>').join('');
  }
  function placeEdges(w, h) {
    const rest = Math.abs(K.t - Math.round(K.t)) < 0.015 && !playing && goal === null;
    box.hidden = !rest; if (!rest) return;
    box.querySelectorAll('[data-edge]').forEach(b => { const e = EDGES.find(x => x.id === b.dataset.edge); b.style.left = (w / 2 + e.at[0] * U) + 'px'; b.style.top = (h / 2 + e.at[1] * U) + 'px'; });
  }
  box.addEventListener('click', ev => { const b = ev.target.closest('[data-edge]'); if (b) openEdge(b.dataset.edge); });

  /* ---- the edge card: the question behind the place ---- */
  const card = $('oaCard');
  function openEdge(id) {
    const e = EDGES.find(x => x.id === id); if (!e) return;
    K.open = id;
    if (!FOUND.includes(id)) { FOUND.push(id); saveStars(); sky(id); }
    const f = e.fact && FACTS.facts.find(x => x.id === e.fact), u = f && safeUrl(f.url), tp = topicById(e.topic);
    card.innerHTML = '<div class="oacardhead"><span class="code">' + t('oa.edge.code') + ' · ' + esc(t('oa.depth.' + e.depth)) + '</span><button type="button" class="x" data-close aria-label="' + esc(t('oa.edge.close')) + '">×</button></div>' +
      '<h3>' + esc(t('oa.e.' + id + '.place')) + '</h3><p class="oaq">' + esc(t('oa.e.' + id + '.q')) + '</p>' +
      '<p class="small"><b>' + t('oa.edge.trying') + ':</b> ' + esc(t('oa.e.' + id + '.try')) + '</p>' +
      (f ? '<p class="oafact small"><b>' + esc(f.label) + ':</b> ' + esc(f.value) + ' <span class="muted">(' + esc(fmtDate(f.verified)) + (u ? ', <a href="' + esc(u) + '" target="_blank" rel="noopener">' + t('oa.edge.source') + '</a>' : '') + ')</span></p>' : '') +
      '<div class="row">' + (e.bench ? '<button type="button" class="btn primary" data-bench="' + e.bench + '">' + t('oa.edge.push') + '</button>' : '') +
      (tp ? '<a class="btn" href="#' + e.topic + '">' + esc(t('oa.edge.go', { topic: tp.t })) + '</a>' : '') + '</div>' +
      '<p class="small oastar">★ ' + t('oa.edge.star') + '</p>';
    card.hidden = false;
    edgeButtons(IDS[Math.round(K.t)]);
  }
  card.addEventListener('click', ev => {
    if (ev.target.closest('[data-close]')) { card.hidden = true; K.open = null; return; }
    const b = ev.target.closest('[data-bench]'); if (b) openBench(b.dataset.bench);
  });

  /* ---- the workbench: an existing challenge, opened right here ---- */
  function openBench(key) {
    closeBench();
    const b = BENCH[key], ch = CHALLENGES.find(x => x.topic === b.topic && x.t === b.title), sec = $('oaBench');
    if (!ch) return;
    sec.hidden = false;
    sec.innerHTML = '<div class="oabenchhead"><div><p class="code">' + t('oa.bench.code') + '</p><h2>' + esc(ch.t) + '</h2><p class="lede small">' + esc(ch.d) + '</p></div>' +
      '<div class="row"><a class="btn" href="' + esc(ch.href) + '">' + t('oa.bench.page') + '</a><button type="button" class="btn primary" data-unbench>' + t('oa.bench.back') + '</button></div></div>' +
      '<p class="oabenchstate small" id="oaBenchState">' + t('oa.bench.loading') + '</p>' + (ch.hint ? '<details class="small"><summary>' + t('oa.bench.hint') + '</summary><p>' + esc(ch.hint) + '</p></details>' : '') +
      '<div class="oabenchbody" id="oaBenchBody"></div><div class="oawhy" id="oaWhy" hidden></div>';
    sec.scrollIntoView({ block: 'start', behavior: RM ? 'auto' : 'smooth' });
    const job = K.bench = { key, ch, el: null, home: null, next: null, off: [] };
    ensureTopic(b.topic).then(() => {
      if (K.bench !== job) return;
      const el = document.getElementById(b.lab);
      if (!el) { $('oaBenchState').textContent = t('oa.bench.failed'); return; }
      job.el = el; job.home = el.parentNode; job.next = el.nextSibling;
      $('oaBenchBody').appendChild(el);
      watch(job);
      window.dispatchEvent(new Event('resize'));
    }).catch(() => { if (K.bench === job) $('oaBenchState').textContent = t('oa.bench.failed'); });
  }
  /* The topic watches its own page for solved checks; here the panel lives elsewhere, so watch it here. */
  function watch(job) {
    const ch = job.ch, body = $('oaBenchBody'), seen = new Set();
    const show = () => {
      const done = isSolved(ch);
      $('oaBenchState').textContent = done ? t('oa.bench.solved') : t('oa.bench.steps', { n: seen.size, total: ch.check.length });
      $('oaBenchState').classList.toggle('done', done);
      if (done && ch.why) { const w = $('oaWhy'); w.hidden = false; w.textContent = ch.why; }
    };
    let q = false;
    const run = () => { if (q) return; q = true; setTimeout(() => { q = false; if (K.bench !== job) return; if (!isSolved(ch)) { ch.check.forEach((step, i) => { if (step.every(cond => holds(cond, body))) seen.add(i); }); if (seen.size === ch.check.length) markSolved(ch); } show(); }, 120); };
    ['input', 'change', 'click'].forEach(ev => { body.addEventListener(ev, run); job.off.push(() => body.removeEventListener(ev, run)); });
    const mo = new MutationObserver(run); mo.observe(body, { subtree: true, childList: true, characterData: true }); job.off.push(() => mo.disconnect());
    run();
  }
  function closeBench() {
    const job = K.bench; if (!job) return;
    job.off.forEach(f => f());
    if (job.el && job.home) job.home.insertBefore(job.el, job.next && job.next.parentNode === job.home ? job.next : null);
    K.bench = null; const sec = $('oaBench'); sec.hidden = true; sec.innerHTML = '';
  }
  $('oaBench').addEventListener('click', ev => { if (ev.target.closest('[data-unbench]')) { closeBench(); cv.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); } });
  document.addEventListener('osl:route', ev => { if (ev.detail !== 'one-answer') { closeBench(); playing = false; } });

  /* ---- controls ---- */
  const lv = $('oaLevels');
  lv.innerHTML = IDS.map((id, i) => '<button type="button" data-z="' + i + '">' + (i + 1) + ' ' + esc(t('oa.depth.' + id)) + '</button>').join('');
  lv.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; playing = false; card.hidden = true; goal = +b.dataset.z; if (RM) { K.t = goal; goal = null; } setPlay(); });
  function setPlay() {
    const atEnd = K.dir > 0 ? K.t >= N - 1 - 1e-3 : K.t <= HOME_D + 1e-3;
    $('oaPlay').textContent = playing ? t('oa.pause') : K.dir > 0 && atEnd ? t('oa.goBack') : K.dir < 0 && atEnd ? t('oa.again') : t(K.dir > 0 ? 'oa.follow' : 'oa.followBack');
    $('oaTop').textContent = t('oa.top');
  }
  $('oaPlay').addEventListener('click', () => {
    card.hidden = true;
    if (playing) { playing = false; setPlay(); return; }
    if (K.dir > 0 && K.t >= N - 1 - 1e-3) { K.dir = -1; K.arrived = false; }
    else if (K.dir < 0 && K.t <= HOME_D + 1e-3) { K.dir = 1; K.arrived = false; }
    playing = true; goal = null; dwell = 0.6; lastIdx = -1;
    if (RM) { playing = false; K.t = clamp(Math.round(K.t) + K.dir, 0, N - 1); if (K.dir < 0 && K.t <= HOME_D) K.arrived = true; }
    setPlay();
  });
  $('oaTop').addEventListener('click', () => { playing = false; card.hidden = true; goal = 0; if (RM) { K.t = 0; goal = null; } setPlay(); });
  $('oaYearR').addEventListener('input', e => setYear(e.target.value));
  $('oaJump').addEventListener('click', e => { const b = e.target.closest('[data-y]'); if (b) setYear(b.dataset.y); });

  function loop(now) {
    if (me !== run || !cv.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const moving = playing || goal !== null;
    K.pk = (K.pk + dt * 0.45) % 1;
    if (playing) {
      if (dwell > 0) dwell -= dt;
      else {
        /* the segment being crossed, and its length in powers of ten: every power of ten takes the same time */
        const i = K.dir > 0 ? Math.min(N - 2, Math.floor(K.t + 1e-9)) : Math.max(0, Math.ceil(K.t - 1e-9) - 1);
        const decades = Math.max(0.5, Math.log10(L[i].size / L[i + 1].size)), old = K.t;
        K.t = clamp(K.t + K.dir * dt * 1.1 / decades, 0, N - 1);
        const crossed = K.dir > 0 ? Math.floor(K.t + 1e-9) > Math.floor(old + 1e-9) : Math.ceil(K.t - 1e-9) < Math.ceil(old - 1e-9);
        if (crossed) { K.t = Math.round(K.t); dwell = 1.1; }
        if ((K.dir > 0 && K.t >= N - 1) || (K.dir < 0 && K.t <= HOME_D)) { if (K.dir < 0) { K.t = HOME_D; K.arrived = true; } playing = false; lastIdx = -1; setPlay(); }
      }
    } else if (goal !== null) {
      const diff = goal - K.t;
      if (Math.abs(diff) < 0.004) { K.t = goal; goal = null; lastIdx = -1; setPlay(); }
      else K.t += diff * Math.min(1, dt * 3.2) + Math.sign(diff) * dt * 0.3 * (Math.abs(diff) > 0.3 ? 1 : 0);
    }
    if (visible || moving) draw(now);   /* keep the words in step even while scrolled away */
    requestAnimationFrame(loop);
  }
  inView(cv, vis => { visible = vis; });
  new ResizeObserver(() => draw(performance.now())).observe(cv);
  /* Wheel and pinch would fight page scrolling; the depth buttons, the play button and the keyboard move the zoom. */
  cv.tabIndex = 0;
  cv.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { goal = clamp(Math.round(K.t) + 1, 0, N - 1); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { goal = clamp(Math.round(K.t) - 1, 0, N - 1); e.preventDefault(); } });
  /* a star in the sky takes you back to its place */
  document.addEventListener('osl:oa-star', ev => {
    if (!ev.detail) { edgeButtons(IDS[Math.round(K.t)]); return; }
    const e = EDGES.find(x => x.id === ev.detail); if (!e) return;
    playing = false; goal = IDS.indexOf(e.depth); if (RM) { K.t = goal; goal = null; }
    openEdge(e.id); cv.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
  });
  setYear(K.year); setPlay();
  requestAnimationFrame(loop);
}

/* ---------------- the constellation ---------------- */
let skyNote = '';
function sky(newId) {
  const cv = document.getElementById('oaSky'); if (!cv) return;
  const { ctx: c, w, h, d } = fit(cv);
  c.setTransform(d, 0, 0, d, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#070d18'); g.addColorStop(1, '#0b1622'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const R = rng(17); for (let k = 0; k < 90; k++) { c.globalAlpha = 0.15 + R() * 0.35; c.fillStyle = '#cfe0ea'; c.beginPath(); c.arc(R() * w, R() * h, R() * 0.9 + 0.2, 0, 6.283); c.fill(); }
  c.globalAlpha = 1;
  const S = constellation(FOUND), P = id => { const s = S.stars.find(x => x.id === id); return [s.at[0] * w, s.at[1] * h]; };
  S.lines.forEach(l => {
    const a = P(l.a), b = P(l.b);
    c.strokeStyle = l.kind === 'same' ? 'rgba(255,236,190,.75)' : 'rgba(160,210,255,.32)'; c.lineWidth = l.kind === 'same' ? 1.4 : 1; c.setLineDash(l.kind === 'same' ? [] : [3, 4]);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]);
  });
  S.stars.forEach(s => {
    const [x, y] = P(s.id), r = s.id === newId ? 7 : 5;
    const gl = c.createRadialGradient(x, y, 0, x, y, 16); gl.addColorStop(0, 'rgba(255,236,190,.55)'); gl.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = gl; c.fillRect(x - 16, y - 16, 32, 32);
    c.fillStyle = '#fff6dc'; c.beginPath(); for (let k = 0; k < 8; k++) { const rr = k % 2 ? r * 0.32 : r, a = k * Math.PI / 4 - Math.PI / 2; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill();
  });
  /* a shape that has formed shows its question, faintly, beside it */
  c.font = '500 11px ' + FONT; c.fillStyle = 'rgba(255,236,190,.8)';
  S.formed.forEach(q => {
    const pts = S.stars.filter(s => s.q === q).map(s => P(s.id)), x = pts.reduce((a, p) => a + p[0], 0) / pts.length, low = Math.max(...pts.map(p => p[1])) > h * 0.62;
    const y = low ? Math.min(...pts.map(p => p[1])) - 14 - 13 * (c.measureText(t('oa.q.' + q)).width > w * 0.46 ? 1 : 0) : Math.max(...pts.map(p => p[1])) + 16;
    const s = t('oa.q.' + q), wmax = w * 0.46; let lineTxt = '', yy = y; c.textAlign = x > w * 0.6 ? 'right' : x < w * 0.35 ? 'left' : 'center';
    const xx = c.textAlign === 'right' ? Math.min(w - 6, x + 30) : c.textAlign === 'left' ? Math.max(6, x - 30) : x;
    s.split(' ').forEach(wd => { const tr = lineTxt ? lineTxt + ' ' + wd : wd; if (c.measureText(tr).width > wmax && lineTxt) { c.fillText(lineTxt, xx, Math.min(h - 6, yy)); lineTxt = wd; yy += 13; } else lineTxt = tr; });
    c.fillText(lineTxt, xx, Math.min(h - 6, yy));
  });
  const n = S.stars.length;
  document.getElementById('oaSkyN').textContent = n ? t('oa.sky.count', { n }) : '';
  if (newId) {
    const e = EDGES.find(x => x.id === newId), joined = S.formed.includes(e.q) && S.stars.filter(s => s.q === e.q).length === 2;
    const portal = S.lines.find(l => l.kind === 'portal' && (l.a === newId || l.b === newId));
    skyNote = joined ? t('oa.sky.formed', { question: t('oa.q.' + e.q) }) : portal ? t('oa.sky.portal', { why: t('oa.why.' + portal.qs[0] + '.' + portal.qs[1]) }) : skyNote;
  }
  document.getElementById('oaSkyTxt').textContent = !n ? t('oa.sky.empty') : skyNote || t('oa.sky.lines');
  document.getElementById('oaClear').hidden = !n;
  if (!cv.dataset.wired) {
    cv.dataset.wired = '1';
    new ResizeObserver(() => sky()).observe(cv);
    cv.addEventListener('click', ev => {
      const rc = cv.getBoundingClientRect(), x = ev.clientX - rc.left, y = ev.clientY - rc.top;
      const hit = constellation(FOUND).stars.find(s => Math.hypot(s.at[0] * rc.width - x, s.at[1] * rc.height - y) < 14);
      if (hit) document.dispatchEvent(new CustomEvent('osl:oa-star', { detail: hit.id }));
    });
    document.getElementById('oaClear').addEventListener('click', () => { FOUND = []; saveStars(); skyNote = ''; sky(); document.dispatchEvent(new CustomEvent('osl:oa-star', { detail: null })); });
  }
}
