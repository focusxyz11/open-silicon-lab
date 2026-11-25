/* Hold, the first page (#/): fifty years of computing under one finger (src/data/hold.js holds its numbers and plan,
   src/styles/hold.css its look, src/i18n/<lang>/hold.json its words, hd.*). One gesture all the way: hold, and one
   square of silicon splits again at every doubling, from one transistor (0 or 1) to 336 billion. Three moments on the
   way slow the hold and wait with something to try; the wall stops it; then the same square turns into the four walls,
   the arrangement, your machine and the island, each section beside its core question (home.q.*, one at a time).
   Designed with Claude Fable 5.2 and brought into the lab with Claude Opus 5.5. Nothing 3D: the island (#/island) is
   one way out of it.
   createHold(host, ctx) → { show(), hide() }; ctx: still() (reduced motion), record() (the ledger's entries by who made
   them). For checks: window.__hold.set(v) jumps to v doublings (99: the wall), window.__hold.state(). */
import { t, lang, locale, LANGS, needWords } from '../core/i18n.js';
import { D71, DGAR, DWALL, D95, D2011, COST, COSTSRC, GEN, yearOf, formAt, MOMENTS, FDIV, LIGHTS, WALLS, ARR, TRIP,
  NEEDS, STOCK, FORMS, FCOST, LOOP, PARTS, FACT_IDS, CHIPS, BEHIND, AHEAD, RUNGS, ZONE_RUNG, yearAt, dAt, nodeAt, trend,
  SERIES, KNEE, ERAS, CHALS, MOORE65, upTo, rule } from '../data/hold.js';
import { INK, PAPER, RED, mix, rnd, ss, lerp, SPEC } from './holdspec.js';

const FONTS = 'https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&family=Anton&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Gelasio:ital,wght@1,400;1,500&display=swap';
const FONTS_ZH = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;900&family=Noto+Serif+SC:wght@500&display=swap';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createHold(host, ctx = {}) {
  const w = (k, v) => t('hd.' + k, v), Q = k => t('home.q.' + k);
  /* what people are trying: told once, in the blueprint's words (bp.next.*), except where this page says it its own way */
  const OWN = ['switches', 'spikes'], bet = (id, k) => (OWN.includes(id) ? w('bet.' + id + '.' + k) : t('bp.next.' + id + '.' + k));
  const nf = n => new Intl.NumberFormat(locale()).format(n);
  const compact = (n, o = {}) => new Intl.NumberFormat(locale(), Object.assign({ notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: 3 }, o));
  const coarse = matchMedia('(pointer:coarse)').matches;
  const reduce = () => (ctx.still ? ctx.still() : matchMedia('(prefers-reduced-motion:reduce)').matches);
  let FACT = {};
  const src = (...ids) => ids.filter(id => FACT[id]).map(id => '<a class="h-src" target="_blank" rel="noopener" href="' + esc(FACT[id].url) + '">' + esc(FACT[id].source) + '</a>').join(' ');

  /* ---- day or night: the page follows the lab's setting (◐ in the bar). By day it is ink on paper and turns dark at
     the wall; by night it is paper on ink from the start ---- */
  const night = (document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')) === 'dark';
  const ink = night ? PAPER : INK, paper = night ? '#131210' : PAPER;
  /* the square's ground after the hold, a colour over it (fg) and under it (bg), and a number on its way (HI): by day
     ink on paper all the way down, by night paper on ink; the page never changes its colours by itself */
  const BG = night ? '#0d0c0a' : '#e8e4d8', RGB_FG = night ? '239,236,227' : '19,18,16', RGB_BG = night ? '13,12,10' : '239,236,227';
  const fg = a => 'rgba(' + RGB_FG + ',' + a + ')', bg = a => 'rgba(' + RGB_BG + ',' + a + ')', HI = night ? '#fff' : INK;
  /* ---- the page ---- */
  host.classList.add('holdhome'); host.classList.toggle('hold-night', night);
  host.innerHTML = '<div class="hold' + (night ? ' is-night' : '') + '" id="hd-root">' +
    /* the rail: the page's chapters down the left, the one you are in lit, and the challenges done so far */
    '<nav class="h-rail" id="hd-rail"><button type="button" class="h-railbtn" id="hd-railbtn" aria-expanded="false"><i></i><i></i><i></i><span>' + w('rail.open') + '</span></button><ol class="h-chap" id="hd-chap"></ol>' +
    '<div class="h-tally"><span class="h-mono" id="hd-tallyn"></span><div class="h-tsq" id="hd-tsq"></div></div></nav>' +
    '<div class="h-world">' +
    /* the fifty years: scrolling is time. Holding scrolls for you, slower at each moment; nothing waits for the hold */
    '<section class="h-years" id="hd-years"><div class="h-panel" id="hd-hero">' +
    '<div class="h-kick h-mono"><i></i><span>' + w('hero.k') + '</span></div>' +
    '<div class="h-countrow"><div class="h-num h-anton" id="hd-num">1</div><div class="h-unit h-anton" id="hd-unit"></div></div>' +
    '<div class="h-stats h-mono" id="hd-stats"><span><small>' + w('st.year') + '</small><b id="hd-year"></b></span><span><small>' + w('st.node') + '</small><b id="hd-node"></b></span><span><small>' + w('st.clock') + '</small><b id="hd-clock"></b></span><span><small>' + w('st.cores') + '</small><b id="hd-cores"></b></span></div>' +
    '<div class="h-chart" id="hd-chart"><canvas id="hd-cv" aria-label="' + esc(w('cv.aria')) + '"></canvas><div class="h-ctag h-mono" id="hd-ctag"></div></div>' +
    '<div class="h-cctl"><div class="h-seg h-sm" id="hd-c-sc">' + ['log', 'lin'].map((k, i) => '<button type="button" data-i="' + i + '" class="' + (i ? '' : 'on') + '">' + w('curve.' + k) + '</button>').join('') + '</div>' +
    '<div class="h-chips" id="hd-c-ser">' + SERIES.map(k => '<button type="button" class="h-chipb" data-s="' + k + '" aria-pressed="false"><i class="h-sw h-sw-' + k + '"></i>' + w('ser.' + k) + '</button>').join('') + '</div></div>' +
    '<div class="h-cq2" id="hd-cq2"></div>' +
    '<div class="h-say" id="hd-say" aria-live="polite"></div>' +
    '<div class="h-gauge" id="hd-gauge"><div class="h-gbar"><div class="h-fill" id="hd-gfill"></div><i class="h-mk" style="left:57.5%"></i><i class="h-mk" style="left:100%"></i></div>' +
    '<div class="h-lb h-mono"><span>' + w('g.now') + '</span><span style="margin-left:22%">' + w('g.gets') + '</span><span>' + w('g.twice') + '</span></div></div>' +
    '<div class="h-act"><button type="button" class="h-holdbtn" id="hd-hold" aria-describedby="hd-hint"><span>' + w('btn') + '</span>' +
    '<svg viewBox="0 0 110 110" aria-hidden="true"><circle id="hd-ring" cx="55" cy="55" r="52" pathLength="1"/></svg></button>' +
    '<div class="h-hint h-mono" id="hd-hint"></div><button type="button" class="h-again h-mono" id="hd-again">' + w('again') + '</button><button type="button" class="h-skipl h-mono" id="hd-skip">' + w('skip') + '</button></div>' +
    '</div></section>' +
    '<div class="h-diewrap" id="hd-diewrap" data-scene="gate"><i class="h-crop h-a"></i><i class="h-crop h-b"></i><i class="h-crop h-c"></i><i class="h-crop h-d"></i>' +
    '<div class="h-dielab h-mono"><span id="hd-dtop"></span><span id="hd-dens"></span></div><canvas class="h-die" id="hd-die"></canvas>' +
    '<div class="h-dl" id="hd-dl"></div>' +
    '<div class="h-loupe" id="hd-loupe"><canvas id="hd-lcv" width="464" height="464"></canvas><div class="h-mag h-mono" id="hd-mag"></div></div>' +
    '<div class="h-dielab h-bot h-mono"><span id="hd-dreg"></span><span id="hd-dfound"></span></div></div>' +
    '<div class="h-steps" id="hd-steps"></div><footer class="h-foot h-mono" id="hd-foot"></footer></div>' +
    /* the wires across the middle: from the words to the part of the square they are about */
    '<canvas class="h-wires" id="hd-wires" aria-hidden="true"></canvas></div>';
  const root = host.querySelector('#hd-root'), el = id => host.querySelector('#hd-' + id);
  const cls = (k, on) => root.classList.toggle('is-' + k, on);

  /* ============ the die: one square, split again at every doubling ============ */
  /* the chip's plan: eight regions, each a kind of thing. A core is laid down three times (the same design, copied);
     memory is every cell alike; input and output keep big transistors; the clock is one wire to everything */
  const TYPES = ['core', 'memory', 'core', 'io', 'memory', 'ctrl', 'clock', 'core'];
  function walk(L, v, onSplit, onLeaf) {
    (function rec(x, y, ww, h, hash, depth, type, idx) {
      if (x > v[2] || y > v[3] || x + ww < v[0] || y + h < v[1]) return;
      if (depth === 3) { type = TYPES[idx]; if (type === 'core') hash = 0xC0DE5; }
      const vert = depth < 3 ? depth !== 1 : type === 'core' ? depth % 2 === 0 : ww >= h, r = type === 'memory' ? 0.5 : 0.4 + 0.2 * rnd(hash);
      const end = type === 'clock' ? 3 : type === 'io' ? Math.max(3, L - 5) : L;
      if (depth >= end || depth === L) { onLeaf(x, y, ww, h, hash, vert, r, type, idx); return; }
      onSplit(x, y, ww, h, vert, r, depth, type);
      const i1 = depth < 3 ? idx * 2 : idx, i2 = depth < 3 ? idx * 2 + 1 : idx;
      if (vert) { rec(x, y, ww * r, h, mix(hash, 1), depth + 1, type, i1); rec(x + ww * r, y, ww * (1 - r), h, mix(hash, 2), depth + 1, type, i2); }
      else { rec(x, y, ww, h * r, mix(hash, 1), depth + 1, type, i1); rec(x, y + h * r, ww, h * (1 - r), mix(hash, 2), depth + 1, type, i2); }
    })(0, 0, 1, 1, 0x51ab5, 0, null, 0);
  }
  const regionAt = (x, y) => { let out = null; walk(3, [x, y, x, y], () => {}, (a, b, c, d2, h, f, g, type, idx) => { out = { type, idx, key: type === 'core' && idx ? 'copy' : type }; }); return out; };
  /* a clock's wire: an H, with an H at each of its four ends, and so on down */
  function htree(c, x, y, ww, h, n, min, view) {
    if (n <= 0 || Math.min(ww, h) < min) return; if (view && (x > view[2] || y > view[3] || x + ww < view[0] || y + h < view[1])) return;
    c.moveTo(x + ww / 4, y + h / 2); c.lineTo(x + 3 * ww / 4, y + h / 2); c.moveTo(x + ww / 4, y + h / 4); c.lineTo(x + ww / 4, y + 3 * h / 4); c.moveTo(x + 3 * ww / 4, y + h / 4); c.lineTo(x + 3 * ww / 4, y + 3 * h / 4);
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) htree(c, x + a * ww / 2, y + b * h / 2, ww / 2, h / 2, n - 1, min, view);
  }
  const die = el('die'), dc = die.getContext('2d'), lcv = el('lcv'), lc = lcv.getContext('2d'), loupe = el('loupe'), wrap = el('diewrap');
  let S = 600, DPR = 1, floor = null, dots = null, phone = false;
  const LMAX = 16;
  let d = 0, holding = false, press = 0, atWall = false, now = 0, focus = [0.69, 0.3], focusTo = [0.69, 0.3];
  let lastMoveT = -1e9, lastTap = 0, touchedWalls = false, capK = '';
  const found = {};
  let vel = 0, push = 0, pushT = 0, bits = null, pow = false, live = false, raf = 0;
  /* the moments: which one is showing, what was tried there, and what it left behind */
  let mom = null; const tried = {}; const T1 = { gate: { a: 0, b: 0 }, job: 2, bug: { n: 0, worst: false }, light: 0 };
  let heavy = false;

  const ART = [0.215, 0.775];
  function sizeDie() {
    DPR = Math.min(2, window.devicePixelRatio || 1); S = wrap.clientWidth || 600; phone = innerWidth <= 760;
    die.width = die.height = Math.round(S * DPR);
    floor = document.createElement('canvas'); floor.width = floor.height = die.width;
    const f = floor.getContext('2d'), P = die.width;
    f.fillStyle = night ? '#100f0d' : '#e2ddd0'; f.fillRect(0, 0, P, P);
    /* what fifty years of splitting leaves behind: every region its own texture, as on a real die */
    const TONE = { core: 30, ctrl: 20, memory: 50, io: 15, clock: 11 };
    walk(9, [0, 0, 1, 1], () => {}, (x, y, ww, h, hash, vert, r, type) => {
      const k = rnd(hash), g = Math.round(type === 'memory' ? 44 + 12 * ((Math.round(x * 64) + Math.round(y * 64)) % 2) : TONE[type] * (0.45 + k * k * 1.35));
      f.fillStyle = night ? 'rgb(' + (g + 4) + ',' + (g + 2) + ',' + Math.max(0, g - 2) + ')' : 'rgb(' + (240 - g * 1.25) + ',' + (237 - g * 1.25) + ',' + (228 - g * 1.25) + ')'; f.fillRect(x * P, y * P, ww * P + 1, h * P + 1);
      if (type === 'memory') { f.fillStyle = fg(.1); const st = 2 * DPR; for (let i = 0; i < h * P; i += st * 2) f.fillRect(x * P, y * P + i, ww * P, st * .5); }
      else if (type === 'io') { const m = 5 * DPR; f.strokeStyle = fg(.55); f.lineWidth = DPR; f.strokeRect(x * P + m, y * P + m, ww * P - 2 * m, h * P - 2 * m); f.fillStyle = fg(.12); f.fillRect(x * P + m * 2.2, y * P + m * 2.2, ww * P - m * 4.4, h * P - m * 4.4); }
      else if (type === 'clock') { f.strokeStyle = fg(.5); f.lineWidth = DPR; f.beginPath(); htree(f, x * P, y * P, ww * P, h * P, 5, 3 * DPR); f.stroke(); }
      else if (rnd(hash >>> 3) > 0.8) { f.fillStyle = night ? 'rgba(0,0,0,.35)' : 'rgba(19,18,16,.1)'; f.fillRect(x * P, y * P, ww * P + 1, h * P + 1); }
    });
    f.strokeStyle = fg(.55); f.lineWidth = 1.5 * DPR; f.beginPath();
    walk(3, [0, 0, 1, 1], (x, y, ww, h, vert, r) => { if (vert) { f.moveTo((x + ww * r) * P, y * P); f.lineTo((x + ww * r) * P, (y + h) * P); } else { f.moveTo(x * P, (y + h * r) * P); f.lineTo((x + ww) * P, (y + h * r) * P); } }, () => {});
    f.stroke();
    f.strokeStyle = fg(.2); f.lineWidth = DPR; f.beginPath();
    walk(5, [0, 0, 1, 1], (x, y, ww, h, vert, r) => { if (vert) { f.moveTo((x + ww * r) * P, y * P); f.lineTo((x + ww * r) * P, (y + h) * P); } else { f.moveTo(x * P, (y + h * r) * P); f.lineTo((x + ww) * P, (y + h * r) * P); } }, () => {});
    f.stroke();
    /* chip art: a speck, for whoever brings the glass */
    f.fillStyle = fg(.55); f.fillRect(ART[0] * P - DPR, ART[1] * P - DPR, 2 * DPR, 2 * DPR);
    /* about 100,000 dots: 322 a side (wafer-space-run against design-cost-2nm) */
    const pt = P * .94 / 322, pc = document.createElement('canvas'); pc.width = pc.height = Math.max(2, Math.round(pt * 4)); const pg = pc.getContext('2d'), q = pc.width / 4; pg.fillStyle = ink;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) pg.fillRect(i * q + q * .22, j * q + q * .22, q * .56, q * .56);
    dots = { pat: dc.createPattern(pc, 'repeat'), k: (pt * 4) / pc.width };
  }

  /* ---- the transistor itself, seen from the side, large: no current is 0, current is 1 ---- */
  function bigT(c, P, a, T) {
    if (a <= 0.01) return;
    const cx = P / 2, cy = P * .56, ww = P * .64, x0 = cx - ww / 2, bh = P * .19, wl = ww * .27, wh = P * .078, gw = ww * .38, gh = P * .115, ox = P * .013, top = cy - P * .27, lw = Math.max(2, P * .0042);
    const sx = x0 + ww * .15, dx = x0 + ww * .85, on = press, idle = !root.classList.contains('is-touched') && !reduce() ? .5 + .5 * Math.sin(T * 3) : 0;
    c.save(); c.globalAlpha = a; c.lineJoin = 'round'; c.lineCap = 'round';
    /* the silicon it is made in */
    c.save(); c.beginPath(); c.rect(x0, cy, ww, bh); c.clip(); c.strokeStyle = fg(.16); c.lineWidth = lw * .5; c.beginPath(); for (let q = -bh; q < ww; q += P * .016) { c.moveTo(x0 + q, cy + bh); c.lineTo(x0 + q + bh, cy); } c.stroke(); c.restore();
    c.strokeStyle = ink; c.lineWidth = lw; c.strokeRect(x0, cy, ww, bh);
    /* source and drain: two wells in it */
    c.fillStyle = ink; for (const wx of [x0 + ww * .02, x0 + ww * .98 - wl]) { c.beginPath(); if (c.roundRect) c.roundRect(wx, cy, wl, wh, [0, 0, wh * .5, wh * .5]); else c.rect(wx, cy, wl, wh); c.fill(); }
    /* the channel: nothing, until the gate is charged */
    const cl = x0 + ww * .02 + wl, cr = x0 + ww * .98 - wl;
    if (on > .01) { c.fillStyle = RED; c.globalAlpha = a * on; c.fillRect(cl - 2, cy, cr - cl + 4, wh * .34); c.globalAlpha = a; }
    /* the gate, on a thin layer that lets no current through */
    c.strokeStyle = ink; c.lineWidth = lw * .6; c.beginPath(); c.moveTo(cx - gw / 2 - 4, cy - ox * .5); c.lineTo(cx + gw / 2 + 4, cy - ox * .5); c.stroke();
    c.fillStyle = paper; c.fillRect(cx - gw / 2, cy - ox - gh, gw, gh);
    c.fillStyle = RED; c.globalAlpha = a * Math.max(on, idle * .22); c.fillRect(cx - gw / 2, cy - ox - gh, gw, gh); c.globalAlpha = a;
    c.strokeStyle = on > .5 ? RED : ink; c.lineWidth = lw * 1.25; c.strokeRect(cx - gw / 2, cy - ox - gh, gw, gh);
    /* three wires out */
    c.strokeStyle = ink; c.lineWidth = lw; c.beginPath(); c.moveTo(sx, cy); c.lineTo(sx, top); c.moveTo(dx, cy); c.lineTo(dx, top); c.stroke();
    c.strokeStyle = on > .5 ? RED : ink; c.beginPath(); c.moveTo(cx, cy - ox - gh); c.lineTo(cx, top - P * .05); c.stroke();
    for (const [x, y, r] of [[sx, top, 0], [dx, top, 0], [cx, top - P * .05, 1]]) { c.fillStyle = r && on > .5 ? RED : paper; c.strokeStyle = r && on > .5 ? RED : ink; c.beginPath(); c.arc(x, y, P * .011, 0, 7); c.fill(); c.stroke(); }
    /* charge on the gate, and the current it lets cross */
    if (on > .05) { c.fillStyle = '#fff'; c.globalAlpha = a * on; const n = 7; for (let i = 0; i < n; i++) { const x = cx - gw / 2 + gw * (i + .5) / n, y = cy - ox - gh * .28; c.fillRect(x - P * .007, y - 1, P * .014, 2); c.fillRect(x - 1, y - P * .007, 2, P * .014); }
      const path = [[sx, top], [sx, cy + wh * .2], [dx, cy + wh * .2], [dx, top]], seg = [cy - top, dx - sx, cy - top], tot = seg[0] + seg[1] + seg[2]; c.fillStyle = RED;
      for (let i = 0; i < 16; i++) { let u = ((T * .55 + i / 16) % 1) * tot, k = 0; while (k < 2 && u > seg[k]) { u -= seg[k]; k++; } const p = path[k], q = path[k + 1], f = u / seg[k]; c.beginPath(); c.arc(p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, P * .0075, 0, 7); c.fill(); }
      c.globalAlpha = a; }
    c.restore();
  }
  /* ---- and small: its three forms, as the years made them ---- */
  function glyph(c, cx, cy, g, on, a, lw, form, leak) {
    if (a <= 0.01 || g < 1.2) return;
    c.globalAlpha = a; c.lineWidth = lw; c.strokeStyle = ink; c.lineCap = 'butt'; c.lineJoin = 'miter';
    const hot = on > .6;
    if (form === 'fin') { const y0 = cy + .8 * g;
      c.beginPath(); c.moveTo(cx - 1.5 * g, y0); c.lineTo(cx + 1.5 * g, y0); c.stroke();
      c.fillStyle = ink; c.fillRect(cx - .17 * g, y0 - 1.3 * g, .34 * g, 1.3 * g);
      c.strokeStyle = hot ? RED : ink; c.lineWidth = Math.max(lw, .3 * g); c.beginPath(); c.moveTo(cx - .6 * g, y0 - lw); c.lineTo(cx - .6 * g, y0 - 1.72 * g); c.lineTo(cx + .6 * g, y0 - 1.72 * g); c.lineTo(cx + .6 * g, y0 - lw); c.stroke();
      if (leak && !hot) { c.fillStyle = RED; c.fillRect(cx - .17 * g, y0 - 1.3 * g * leak, .34 * g, 1.3 * g * leak); }
    } else if (form === 'gaa') {
      c.fillStyle = hot ? RED : paper; c.fillRect(cx - .85 * g, cy - 1 * g, 1.7 * g, 2 * g); c.strokeStyle = hot ? RED : ink; c.lineWidth = Math.max(lw, .14 * g); c.strokeRect(cx - .85 * g, cy - 1 * g, 1.7 * g, 2 * g);
      for (let i = 0; i < 3; i++) { c.fillStyle = hot ? paper : ink; c.fillRect(cx - .55 * g, cy - .7 * g + i * .56 * g, 1.1 * g, .28 * g); if (leak && !hot) { c.fillStyle = RED; c.fillRect(cx - .55 * g, cy - .7 * g + i * .56 * g, 1.1 * g * leak, .28 * g); } }
    } else { const y0 = cy + .42 * g;
      c.beginPath(); c.moveTo(cx - 1.6 * g, y0); c.lineTo(cx + 1.6 * g, y0); c.stroke();
      c.fillStyle = ink; c.fillRect(cx - 1.5 * g, y0, .9 * g, .34 * g); c.fillRect(cx + .6 * g, y0, .9 * g, .34 * g);
      if (hot) { c.fillStyle = RED; c.fillRect(cx - .6 * g, y0, 1.2 * g, .17 * g); }
      c.fillStyle = hot ? RED : paper; c.fillRect(cx - .62 * g, y0 - .8 * g, 1.24 * g, .64 * g); c.strokeStyle = hot ? RED : ink; c.strokeRect(cx - .62 * g, y0 - .8 * g, 1.24 * g, .64 * g);
      c.beginPath(); c.moveTo(cx, y0 - .8 * g); c.lineTo(cx, y0 - 1.25 * g); c.stroke(); }
    c.globalAlpha = 1;
  }
  const isOn = (hash, T, type) => bits !== null ? bits : type === 'memory' ? rnd(hash ^ 0x77aa) < 0.5 : rnd(mix(hash, Math.floor(T * (0.5 + rnd(hash >>> 5)) + rnd(hash >>> 9) * 9))) < 0.34;

  function drawField(c, L, f, view, scale, ox, oy, lw, glyphMin, o = {}) {
    const X = x => (x - ox) * scale, Y = y => (y - oy) * scale, form = o.form || 'planar';
    const thin = new Path2D(), thick = new Path2D(), fresh = new Path2D(), tree = new Path2D(), leaves = [];
    walk(L, view, (x, y, ww, h, vert, r, depth, type) => {
      const p = depth < 3 || depth < L - 9 ? thick : thin;
      if (vert) { p.moveTo(X(x + ww * r), Y(y)); p.lineTo(X(x + ww * r), Y(y + h)); } else { p.moveTo(X(x), Y(y + h * r)); p.lineTo(X(x + ww), Y(y + h * r)); }
      if (depth === 3 && type === 'memory' && L > 5) { c.fillStyle = fg(.06); c.fillRect(X(x), Y(y), ww * scale, h * scale); }
      if (o.jobs && depth === 3 && type === 'core') { c.fillStyle = 'rgba(229,64,26,' + (.1 * o.jobs) + ')'; c.fillRect(X(x), Y(y), ww * scale, h * scale); }
    }, (x, y, ww, h, hash, vert, r, type) => {
      if (type === 'clock') { htree({ moveTo: (a, b) => tree.moveTo(X(a), Y(b)), lineTo: (a, b) => tree.lineTo(X(a), Y(b)) }, x, y, ww, h, 1 + Math.floor(L / 2), 7 / scale, view); return; }
      const splits = !(type === 'io' && L - 5 < 3);
      if (f > 0 && splits) { const e = f * 0.5;
        if (vert) { const u = X(x + ww * r); fresh.moveTo(u, Y(y)); fresh.lineTo(u, Y(y + h * e)); fresh.moveTo(u, Y(y + h)); fresh.lineTo(u, Y(y + h - h * e)); }
        else { const u = Y(y + h * r); fresh.moveTo(X(x), u); fresh.lineTo(X(x + ww * e), u); fresh.moveTo(X(x + ww), u); fresh.lineTo(X(x + ww - ww * e), u); } }
      if (Math.min(ww, h) * scale >= glyphMin) leaves.push([x, y, ww, h, hash, vert, r, type, splits]);
    });
    c.lineCap = 'butt'; c.strokeStyle = ink; c.lineWidth = lw; c.stroke(thin); c.lineWidth = lw * 2; c.stroke(thick); c.lineWidth = lw * 1.2; c.stroke(tree);
    if (f > 0) { c.strokeStyle = holding ? RED : ink; c.lineWidth = lw * (holding ? 1.6 : 1); c.stroke(fresh); }
    const T = now / 1000, gs = m => Math.min(m * scale * (o.small ? 0.25 : 0.2), 150 * DPR);
    for (const [x, y, ww, h, hash, vert, r, type, splits] of leaves) {
      const a0 = splits ? 1 - ss(0.2, 0.62, f) : 1, g0 = gs(Math.min(ww, h));
      if (L === 0 && !o.small) bigT(c, die.width, a0, T); else glyph(c, X(x + ww / 2), Y(y + h / 2), g0, isOn(hash, T, type) ? 1 : 0, a0, Math.max(lw * 1.15, g0 * 0.03), form, o.leak);
      if (f > 0.4 && splits) { const a1 = ss(0.5, 1, f);
        const kids = vert ? [[x, y, ww * r, h, 1], [x + ww * r, y, ww * (1 - r), h, 2]] : [[x, y, ww, h * r, 1], [x, y + h * r, ww, h * (1 - r), 2]];
        for (const k of kids) { const g1 = gs(Math.min(k[2], k[3])); glyph(c, X(k[0] + k[2] / 2), Y(k[1] + k[3] / 2), g1, isOn(mix(hash, k[4]), T, type) ? 1 : 0, a1, Math.max(lw * 1.15, g1 * 0.03), form, o.leak); } }
    }
  }
  function sparks(c, P, n, a) { c.fillStyle = RED; for (let i = 0; i < n; i++) { const h = mix(i * 7919, Math.floor(now / 90)); c.globalAlpha = a * (0.35 + 0.65 * rnd(h >>> 2)); const s = DPR * (1 + 1.4 * rnd(h >>> 7)); c.fillRect(rnd(h) * P, rnd(h ^ 0xabc) * P, s, s); } c.globalAlpha = 1; }
  /* ---- what hides behind 0 and 1: with two transistors, one above the other, a NOT gate; with four, a NAND gate.
     Drawn as they are wired (1000 units a side): each transistor on its side (drain up, gate to the left), every wire
     red while it carries 1, the bits large at the pins. With nobody pressing the inputs, they take turns ---- */
  function wire(c, pts, v, lw) { c.strokeStyle = v ? RED : ink; c.lineWidth = lw * (v ? 1.6 : 1); c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke(); }
  function fet(c, x, y, on, a) { c.save(); c.translate(x, y); c.rotate(-Math.PI / 2); glyph(c, 0, 0, 46, on ? 1 : 0, a, 4, 'planar'); c.restore(); c.globalAlpha = a; }
  function bit(c, x, y, v, al) { c.fillStyle = v ? RED : ink; c.font = '400 92px Anton, Impact, sans-serif'; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(v ? '1' : '0', x, y); }
  const TOP = 46 * 1.5, GX = 46 * .83, DX = 46 * .45;
  function drawNot(c, A, a) {
    const x = 520, yp = 330, yn = 670, out = A ? 0 : 1; c.globalAlpha = a; c.lineCap = 'square';
    wire(c, [[380, 180], [660, 180]], 1, 4); wire(c, [[380, 820], [660, 820]], 0, 4);
    wire(c, [[x + DX, 180], [x + DX, yp - TOP]], 1, 4);
    wire(c, [[x + DX, yp + TOP], [x + DX, yn - TOP]], out, 4); wire(c, [[x + DX, 500], [810, 500]], out, 4);
    wire(c, [[x + DX, yn + TOP], [x + DX, 820]], 0, 4);
    wire(c, [[190, 500], [330, 500]], A, 4); wire(c, [[330, yp], [330, yn]], A, 4); wire(c, [[330, yp], [x - GX, yp]], A, 4); wire(c, [[330, yn], [x - GX, yn]], A, 4);
    fet(c, x, yp, !A, a); fet(c, x, yn, A, a);
    bit(c, 340, 180, 1, 'right'); bit(c, 340, 820, 0, 'right'); bit(c, 150, 500, A); bit(c, 860, 500, out);
  }
  function drawNand(c, A, B, a) {
    const xa = 400, xb = 640, yp = 320, xn = 560, ya = 580, yb = 730, out = A && B ? 0 : 1; c.globalAlpha = a; c.lineCap = 'square';
    wire(c, [[330, 170], [770, 170]], 1, 4); wire(c, [[330, 850], [770, 850]], 0, 4);
    wire(c, [[xa + DX, 170], [xa + DX, yp - TOP]], 1, 4); wire(c, [[xb + DX, 170], [xb + DX, yp - TOP]], 1, 4);
    wire(c, [[xa + DX, yp + TOP], [xa + DX, 450], [xb + DX, 450], [xb + DX, yp + TOP]], out, 4);
    wire(c, [[xn + DX, 450], [xn + DX, ya - TOP]], out, 4); wire(c, [[xb + DX, 450], [820, 450]], out, 4);
    wire(c, [[xn + DX, ya + TOP], [xn + DX, yb - TOP]], B ? 0 : A ? out : 0, 4); wire(c, [[xn + DX, yb + TOP], [xn + DX, 850]], 0, 4);
    /* A to both of its gates; B to both of its, hopping over A */
    wire(c, [[190, ya], [280, ya], [280, yp], [xa - GX, yp]], A, 4); wire(c, [[280, ya], [xn - GX, ya]], A, 4);
    wire(c, [[190, yb], [230, yb], [230, ya + 18]], B, 4); c.beginPath(); c.arc(230, ya, 18, Math.PI / 2, -Math.PI / 2, true); c.stroke();
    wire(c, [[230, ya - 18], [230, 240], [xb - GX - 40, 240], [xb - GX - 40, yp], [xb - GX, yp]], B, 4); wire(c, [[230, yb], [xn - GX, yb]], B, 4);
    fet(c, xa, yp, !A, a); fet(c, xb, yp, !B, a); fet(c, xn, ya, A, a); fet(c, xn, yb, B, a);
    bit(c, 300, 170, 1, 'right'); bit(c, 300, 850, 0, 'right'); bit(c, 140, ya, A); bit(c, 140, yb, B); bit(c, 880, 450, out);
  }
  function drawGates(c, P, T) {
    const kNot = ss(.85, 1, d) * (1 - ss(1.45, 1.65, d)), kNand = ss(1.5, 1.7, d) * (1 - ss(3, 3.4, d)); if (kNot <= .01 && kNand <= .01) return;
    const own = mom && mom.id === 'gate', A = own ? T1.gate.a : Math.floor(T / 1.1) % 2, B = own ? T1.gate.b : Math.floor(T / 2.2) % 2, k = Math.max(kNot, kNand);
    c.save(); c.globalAlpha = k; c.fillStyle = paper; c.fillRect(0, 0, P, P); c.setTransform(P / 1000, 0, 0, P / 1000, 0, 0);
    if (kNot > .01) drawNot(c, Math.floor(T / 1.1) % 2, kNot);
    if (kNand > .01) drawNand(c, A, B, kNand);
    c.restore(); c.globalAlpha = 1;
  }
  let jobsK = 0;
  function drawHeroDie() {
    const P = die.width, L = Math.min(Math.floor(d), LMAX), f = d >= LMAX ? 0 : d - Math.floor(d);
    dc.setTransform(1, 0, 0, 1, 0, 0); dc.fillStyle = paper; dc.fillRect(0, 0, P, P);
    const dark = ss(13.2, 17.6, d);
    /* 1971: slide toward one job and the cores light up as made for it */
    jobsK += (((mom && mom.id === 'job') ? (2 - T1.job) / 2 : 0) - jobsK) * 0.15;
    if (dark < 1) drawField(dc, L, f, [0, 0, 1, 1], P, 0, 0, DPR * (d > 11 ? 0.8 : 1), 26 * DPR, { jobs: jobsK > .02 ? jobsK : 0 });
    if (d < 3.5) drawGates(dc, P, now / 1000);
    if (dark > 0) { dc.globalAlpha = dark; dc.drawImage(floor, 0, 0); dc.globalAlpha = 1; sparks(dc, P, holding ? 260 : 70, dark);
      /* 1995: five entries missing, somewhere in there, once you have looked for them */
      if (T1.bug.worst && d < D2011 + 1) { dc.strokeStyle = RED; dc.lineWidth = 1.5 * DPR; for (let i = 0; i < 5; i++) { const x = P * (.58 + .03 * i), y = P * (.66 + .017 * ((i * 3) % 5)); dc.strokeRect(x - 4 * DPR, y - 4 * DPR, 8 * DPR, 8 * DPR); } } }
    if (phase() === 'wall' && push > 0) { dc.strokeStyle = RED; dc.lineWidth = 3 * DPR * Math.min(1, push); dc.strokeRect(6 * DPR, 6 * DPR, P - 12 * DPR, P - 12 * DPR); }
  }
  const CELLS = 4.6;
  let magK = '';
  const setMag = h => { if (h !== magK) { magK = h; el('mag').innerHTML = h; } };
  const setCap = (a, b) => { if (a + b !== capK) { capK = a + b; el('dreg').textContent = a; el('dfound').textContent = b; } };
  let artSeen = 0;
  /* the light: finer than 193 nm and printed in one pass, the lines in the glass go soft */
  const soft = () => mom && mom.id === 'light' && T1.light === 0;
  function drawLoupe(show, o = {}) {
    loupe.style.opacity = show;
    if (o.dots && show > 0) { const R = loupe.clientWidth / 2, P = lcv.width, g = P / 5.2; focus[0] += (focusTo[0] - focus[0]) * 0.18; focus[1] += (focusTo[1] - focus[1]) * 0.18;
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.fillStyle = BG; lc.fillRect(0, 0, P, P); const ox = (focus[0] * 322) % 1, oy = (focus[1] * 322) % 1;
      for (let i = -1; i < 7; i++) for (let j = -1; j < 7; j++) { const x = (i - ox) * g, y = (j - oy) * g, id = mix(Math.floor(focus[0] * 322) + i, Math.floor(focus[1] * 322) + j); lc.fillStyle = ink; lc.fillRect(x + g * .14, y + g * .14, g * .72, g * .72); lc.fillStyle = paper; for (let q = 0; q < 3; q++) lc.fillRect(x + g * .26, y + g * (.3 + q * .16), g * (.2 + .28 * rnd(id + q)), g * .06); }
      loupe.style.transform = 'translate(' + (focus[0] * S - R) + 'px,' + (focus[1] * S - R) + 'px)'; setMag(w('s.c2')); setCap('', ''); return; } if (show <= .5) setCap('', '');
    if (show <= 0) return;
    const R = loupe.clientWidth / 2, P = lcv.width, dd = Math.min(d, DWALL);
    focus[0] += (focusTo[0] - focus[0]) * 0.18; focus[1] += (focusTo[1] - focus[1]) * 0.18;
    const half = CELLS * Math.pow(2, -dd / 2) / 2;
    const fx = Math.min(1 - half, Math.max(half, focus[0])), fy = Math.min(1 - half, Math.max(half, focus[1])), scale = P / (2 * half);
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.filter = 'none'; lc.fillStyle = paper; lc.fillRect(0, 0, P, P);
    if (soft()) lc.filter = 'blur(' + (P * .011) + 'px)';
    drawField(lc, Math.floor(dd), dd - Math.floor(dd), [fx - half, fy - half, fx + half, fy + half], scale, fx - half, fy - half, (P / (2 * R)) * 1.1, 20, { small: true, form: formAt(dd), leak: o.leak });
    lc.filter = 'none';
    /* chip art, where the speck is */
    const ax = (ART[0] - focus[0]) / .07, ay = (ART[1] - focus[1]) / .07;
    if (Math.hypot(ax, ay) < 1.25 && d > 20) { const x = P / 2 + ax * P * .4, y = P / 2 + ay * P * .4, u = P * .0042; lc.save(); lc.translate(x, y); lc.fillStyle = paper; lc.beginPath(); lc.ellipse(0, 0, 44 * u, 32 * u, 0, 0, 7); lc.fill(); lc.strokeStyle = ink; lc.lineWidth = 2.2 * u; lc.beginPath();
      SHORE.forEach((p, i) => { const q = [p[0] * .36 * u, p[1] * .42 * u]; if (i) lc.lineTo(q[0], q[1]); else lc.moveTo(q[0], q[1]); }); lc.closePath(); lc.stroke();
      for (const p of ISLE) { lc.fillStyle = p[0] === 'lab' ? RED : ink; lc.fillRect(p[1] * .36 * u - 2.2 * u, p[2] * .42 * u - 2.2 * u, 4.4 * u, 4.4 * u); } lc.restore();
      if (Math.hypot(ax, ay) < .6 && show > .9 && ++artSeen === 25) egg('art'); } else artSeen = 0;
    loupe.style.transform = 'translate(' + (focus[0] * S - R) + 'px,' + (focus[1] * S - R) + 'px) scale(' + (0.86 + 0.14 * show) + ')';
    const m = (2 * R / (2 * half)) / S, reg = regionAt(fx, fy);
    el('mag').classList.toggle('h-up', focus[1] > .66);
    if (reg && show > .5) { found[reg.key] = 1; const n = Object.keys(found).length;
      setMag('<b>' + w('r.' + reg.key) + '</b>' + w('mag', { n: nf(m >= 1000 ? Math.round(m / 100) * 100 : Math.round(m)) }) + ' · ' + w('form.' + formAt(dd)));
      setCap(w('r.' + reg.key + '.d'), n >= 6 ? w('found.all') : w('found', { n })); }
  }

  /* ============ one gesture, all the way: hold. Scrolling is time: the fifty years are a length of page, and holding
     scrolls it for you, slower near each moment. Nothing waits for the hold ============ */
  const phase = () => d >= DWALL - 1e-6 ? 'wall' : d < 0.05 ? 'gate' : d < D95 ? 'run' : d < D2011 ? 'coast' : 'pay';
  const genIdx = () => Math.max(0, Math.min(COST.length - 1, Math.floor((d - D2011) / (DWALL - D2011) * COST.length + 1e-6)));
  const momentAt = v => MOMENTS.find(m => v >= m.at - 1e-9 && v < m.at + m.span) || null;
  const VMAX = 3.6, SLOW = 0.24, ZONE = 0.75;
  /* how fast a hold moves the count: quick while a smaller transistor was a cheaper one, slower as each design costs more */
  function vstar() {
    if (d < 6) return 1.3 + d * 0.38;
    let v = VMAX;
    if (d >= D2011) { const i = genIdx(), f = (d - GEN(i)) / (GEN(i + 1) - GEN(i)), c = lerp(COST[i][1], COST[Math.min(5, i + 1)][1], Math.min(1, Math.max(0, f))); v = VMAX * Math.pow(51 / c, 0.6); }
    if (heavy && d >= GEN(3)) v *= 0.5;
    return v;
  }
  /* the page's length for the fifty years: a run of scroll for each doubling, and a stretch at the start, at each moment
     and at the wall where the count stays put while you look. SEG: [from, to (px), d from, d to] */
  const years = el('years'), panel = el('hero');
  let SEG = [], YLEN = 1, WALL_S = 1, K = 100, y0 = 0, pos = 0;
  function layoutYears() {
    const vh = host.clientHeight || innerHeight; K = Math.max(64, vh * .13); const stay0 = vh * .3, plat = vh * .5;
    SEG = []; let s = 0, dd = 0;
    const lin = to => { const len = (to - dd) * K; SEG.push([s, s + len, dd, to]); s += len; dd = to; };
    const stay = len => { SEG.push([s, s + len, dd, dd]); s += len; };
    stay(stay0); for (const m of MOMENTS) { lin(m.at); stay(plat); } lin(DWALL); WALL_S = s; stay(vh * .8); YLEN = s;
    years.style.height = Math.round(YLEN + panel.offsetHeight) + 'px';
    const top = parseFloat(getComputedStyle(panel).top) || 0;
    /* the panel is pinned once the years' top passes its sticky line: from there on, scroll is time */
    y0 = Math.max(0, years.getBoundingClientRect().top - host.getBoundingClientRect().top + host.scrollTop - top);
    pos = sOfD(d);
  }
  const segAt = s => SEG.find(g => s < g[1]) || SEG[SEG.length - 1];
  const dOfS = s => { const g = segAt(Math.max(0, s)); return g[2] === g[3] ? g[2] : g[2] + (g[3] - g[2]) * Math.min(1, Math.max(0, (s - g[0]) / (g[1] - g[0]))); };
  const sOfD = v => { if (v >= DWALL - 1e-6) return WALL_S; if (v <= 0) return 0; const g = SEG.find(x => x[2] !== x[3] && v >= x[2] && v <= x[3]); return g ? g[0] + (v - g[2]) / (g[3] - g[2]) * (g[1] - g[0]) : 0; };
  /* go to a count: smoothly when asked by a tap, at once for checks */
  const goD = (v, now) => { const sv = sOfD(Math.min(DWALL, Math.max(0, v))), top = Math.round(y0 + sv); vel = 0; if (now) { pos = sv; host.scrollTop = top; } else host.scrollTo({ top, behavior: reduce() ? 'auto' : 'smooth' }); touch(); };
  let lastGen = 0, thudT = 0;
  function advance(dt) {
    const sNow = host.scrollTop - y0;
    /* the visitor scrolled: the count follows, and nothing rolls on */
    if (Math.abs(sNow - pos) > 2) { pos = sNow; if (!holding) vel = 0; if (sNow > 10) touch(); }
    if (pos > YLEN + 2) { push = 0; pushT = 0; return; }
    if (pos >= WALL_S - 1 && holding) {
      /* the wall: holding stops working */
      vel = 0; push = Math.min(1, push + dt * 1.4); pushT += dt; if (pushT > 6 && pushT - dt <= 6) egg('push', '#/build'); return; }
    push = Math.max(0, push - dt * 4); pushT = 0;
    const g = segAt(pos), still = g[2] === g[3];
    /* near a moment the hold slows, and stays slow for a while past it */
    const nx = MOMENTS.find(m => d < m.at + ZONE);
    const lim = Math.max(SLOW, nx ? SLOW + Math.max(0, nx.at - d) * 2.4 : 99);
    /* let go, and it stops; except in the easy years, when it rolls on by itself */
    const fr = lerp(7, 0.75, ss(D95 - 1, D95 + 1.5, d)) + 6.5 * ss(D2011 - 2, D2011 - 0.3, d) + (still ? 30 : 0) + (mom ? 8 : 0);
    if (holding) vel += (Math.min(vstar(), lim) - vel) * Math.min(1, dt * 3.2); else vel *= Math.exp(-fr * dt);
    vel = Math.min(vel, lim);
    const px = still ? (holding ? (g[1] - g[0]) / (g[2] < .01 ? 1.1 : 2.4) : 0) : vel * K;
    if (px > .5) { pos = Math.min(WALL_S, pos + px * dt); host.scrollTop = Math.round(y0 + pos); }
    if (d >= D2011) { const i = genIdx(); if (i > lastGen) thudT = 1; lastGen = i; }
  }
  /* what comes after the wall, with the facts behind it and the blueprint's words for what people are trying: fetched
     once the visitor moves or the lab starts its idle preload, so the first page asks for nothing more than its own
     words before it paints */
  let factsP = null, stepsP = null, touched = false;
  const loadFacts = () => factsP || (factsP = fetch('src/data/facts.json').then(r => r.json()).then(j => { FACT = Object.fromEntries((j.facts || []).map(f => [f.id, f])); said = ''; cqK = ''; }, () => {}));
  const steps = () => stepsP || (stepsP = Promise.all([loadFacts(), needWords('blueprint')]).then(buildSteps));
  function touch() { if (touched) return; touched = true; cls('touched', true); steps(); }

  /* ============ the count, the year and what is said ============ */
  const curYear = () => (d >= DWALL - 1e-6 ? 2026 : yearAt(d));
  const hz = v => (v >= 1e9 ? w('st.ghz', { n: (v / 1e9).toLocaleString(locale(), { maximumFractionDigits: 1 }) }) : v >= 1e6 ? w('st.mhz', { n: nf(Math.round(v / 1e6)) }) : w('st.khz', { n: nf(Math.round(v / 1e3)) }));
  const setT = (id, v) => { const e = el(id); if (e.innerHTML !== v) e.innerHTML = v; };
  function count() {
    const n = Math.pow(2, d);
    let num, unit;
    if (pow) { num = d.toFixed(d % 1 < .005 || d % 1 > .995 ? 0 : 1); unit = w('unit.pow', { n: num }); }
    /* the first few beats in whole doublings, 1, 2, 4, 8, 16: a gate is four transistors, never five */
    else if (n < 32) { const k = Math.pow(2, Math.floor(d + 1e-6)); num = nf(k); unit = k === 1 ? w('unit.one') : w('unit.many'); }
    else if (n < 9999.5) { num = nf(Math.round(n)); unit = w('unit.many'); }
    else { const parts = compact().formatToParts(n);
      num = parts.filter(p => p.type !== 'compact' && p.type !== 'literal').map(p => p.value).join('');
      const c = parts.filter(p => p.type === 'compact').map(p => p.value).join(' ');
      unit = c ? w(n < 1e6 ? 'unit.k' : 'unit.big', { c }) : w('unit.many'); }
    setT('num', num); setT('unit', unit);
    /* the year, the generation's name, the fastest clock and the most cores so far */
    const y = curYear(), yr = Math.round(y), late = y >= 1971.9;
    setT('year', d < .05 ? '—' : (y < 1971 ? w('st.about', { y: yr }) : String(yr)));
    const nd = nodeAt(y); setT('node', nd ? (y >= 1997 ? w('st.named', { n: nd }) : nd) : '—');
    setT('clock', late ? hz(upTo('hz', y)) : '—'); setT('cores', late ? nf(upTo('cores', y)) : '—');
    const side = Math.pow(2, d / 2);
    const dens = d < 1 || scene !== 'hero' ? '' : w('dens', { n: side < 1000 ? nf(Math.round(side)) : new Intl.NumberFormat(locale(), { notation: 'compact', maximumSignificantDigits: 2 }).format(side) });
    if (el('dens').textContent !== dens) el('dens').textContent = dens;
    el('ring').style.strokeDashoffset = 1 - Math.min(1, d / DWALL);
    el('gfill').style.width = (57.5 * Math.min(1, push) + (holding && !reduce() ? Math.random() * 1.5 : 0)) + '%';
    /* the bit the big transistor holds */
    const b = press > .5 ? '1' : '0';
    if (bitEl.dataset.b !== b) { bitEl.dataset.b = b; bitEl.innerHTML = '<b>' + b + '</b><small>' + w(b === '1' ? 'bit.1' : 'bit.0') + '</small>'; }
  }
  const money = m => w('money', { n: compact().format(m * 1e6) });
  let said = '';
  function say() {
    const ph = phase(); let k;
    if (ph === 'wall') k = 'wall';
    else if (mom) k = 'mo.' + mom.id;
    else if (ph === 'gate') k = press > .5 ? 'on' : 'one';
    else if (ph === 'run') k = d >= .85 && d < 1.8 ? 'not' : d < DGAR - 0.4 ? 'double' : d < D71 ? 'garage' : 'rule';
    else if (ph === 'coast') k = d < D95 + 4.6 ? 'coast' : 'invisible';
    else k = 'pay' + genIdx();
    if (k !== said) { said = k; let html;
      if (mom) html = momentCard(mom);
      else if (k === 'wall') html = (CV.guess ? '<p class="h-cqr">' + w('cq.guess.out', guessOut()) + '</p>' : '') + '<b class="h-price">' + w('m.wall.h') + '</b>' + w('m.wall.p') + ' ' + src('rubin-gpu', 'node-n2', 'design-cost-2nm') + '<br><button type="button" class="h-go" data-go="hd-s-switch">' + w('m.wall.go') + '</button>';
      else if (ph === 'pay') { const i = genIdx(), c = COST[i]; html = (i === 5 ? w('m.gaa') + ' ' + src('tsmc-n2') + ' ' : heavy && i >= 3 ? w('m.old') + ' ' : '') + w('m.pay') + '<span class="h-price">' + money(c[1]) + '<small>' + w('m.cost.at', { node: c[0] }) + '</small></span>' + src(COSTSRC[i]); }
      else html = w('m.' + k) + ' ' + ({ garage: src('zeloof-garage'), rule: src('moore-1965', 'transistor-trend') }[k] || '');
      el('say').innerHTML = html; if (mom) wireMoment(mom); }
    /* the line beside the button says how the hold feels now */
    const hk = mom ? 'moment' : ph === 'run' && d > 9.4 ? 'look' : ph;
    if (el('hint').dataset.k !== hk) { el('hint').dataset.k = hk; el('hint').innerHTML = coarse && TOUCH.includes(hk) ? w('hint.' + hk + '.t') : w('hint.' + hk); }
    cls('pushing', ph === 'wall' && holding); cls('sayon', !!mom || ph === 'gate' || ph === 'wall');
    const tk = scene === 'hero' ? w('die.same') : '';
    if (el('dtop').textContent !== tk) el('dtop').textContent = tk;
  }
  const TOUCH = ['gate', 'look'];

  /* ============ the moments: the hold slows, and something waits to be tried ============ */
  function momentCard(m) {
    const id = m.id, lead = '<div class="h-mk2 h-mono"><i></i>' + w('mo.' + id + '.k') + ' · ' + w('mo.try') + '</div><p class="h-mq">' + w('mo.' + id + '.q') + '</p>';
    let toy = '';
    if (id === 'gate') toy = '<div class="h-row h-gatebits">' + ['a', 'b'].map(k => '<button type="button" class="h-bitbtn" id="hd-g' + k + '" aria-label="' + esc(w('mo.gate.' + k)) + '">' + T1.gate[k] + '</button>').join('') + '<span class="h-gout h-mono">' + w('mo.gate.out') + ' <b id="hd-gout"></b></span></div>';
    else if (id === 'job') toy = '<input type="range" id="hd-mj" min="0" max="2" step="1" value="' + T1.job + '" aria-label="' + esc(w('mo.job.aria')) + '"><div class="h-ticks h-mono"><span>' + w('mo.job.l') + '</span><span>' + w('mo.job.m') + '</span><span>' + w('mo.job.r') + '</span></div>';
    else if (id === 'bug') toy = '<div class="h-row"><button type="button" class="h-btn" id="hd-mb1">' + w('mo.bug.run') + '</button><button type="button" class="h-btn h-ghost" id="hd-mb2">' + w('mo.bug.worst', { a: nf(FDIV.a), b: nf(FDIV.b) }) + '</button></div>';
    else toy = '<div class="h-seg" id="hd-ml">' + LIGHTS.map((k, i) => '<button type="button" data-i="' + i + '" class="' + (i === T1.light ? 'on' : '') + '">' + w('mo.light.' + k) + '</button>').join('') + '</div>';
    return '<div class="h-moment" data-m="' + id + '">' + lead + toy + '<p class="h-out" id="hd-mo"></p>' +
      '<p class="h-mqq"><em>' + Q(m.q) + '</em> <a class="h-lnk" href="' + m.lab + '">' + w('mo.' + id + '.lab') + '</a></p></div>';
  }
  function momentOut(m) {
    const o = el('mo'); if (!o) return; const id = m.id;
    if (id === 'gate') { const g = T1.gate, out = g.a && g.b ? 0 : 1; el('gout').textContent = out; el('gout').classList.toggle('h-one', !!out);
      el('ga').textContent = g.a; el('gb').textContent = g.b; el('ga').classList.toggle('h-one', !!g.a); el('gb').classList.toggle('h-one', !!g.b);
      o.innerHTML = out ? w(tried.gate ? 'mo.gate.no' : 'mo.gate.lead') : '<b>' + w('mo.gate.yes.v') + '</b>' + w('mo.gate.yes'); if (!out) done('gate'); }
    else if (id === 'job') { const v = T1.job; o.innerHTML = '<b>' + w('mo.job.' + v + '.v') + '</b>' + w('mo.job.' + v + '.d') + ' ' + src('asic-vs-cpu') + (tried.job ? ' ' + w('mo.job.after') : ''); }
    else if (id === 'bug') { const b = T1.bug;
      let h = b.n && !b.worst ? '<b>' + w('mo.bug.wrong0') + '</b>' + w('mo.bug.ran', { n: compact({ maximumSignificantDigits: 3 }).format(b.n), left: compact({ maximumSignificantDigits: 2 }).format(Math.max(1, FDIV.rate / 1e6 - b.n / 1e6)) }) + ' ' + src('fdiv-rate') : b.worst ? '' : w('mo.bug.lead');
      if (b.worst) { const right = (FDIV.a / FDIV.b).toFixed(9), bad = FDIV.wrong.toFixed(9); let i = 0; while (i < right.length && right[i] === bad[i]) i++;
        h += '<span class="h-calc"><span>' + w('mo.bug.right') + ' ' + right + '</span><span>' + w('mo.bug.chip') + ' ' + bad.slice(0, i) + '<em>' + bad.slice(i) + '</em></span></span>' + w('mo.bug.after') + ' ' + src('fdiv-charge'); }
      o.innerHTML = h; }
    else { const k = LIGHTS[T1.light]; o.innerHTML = '<b>' + w('mo.light.' + k + '.v') + '</b>' + w('mo.light.' + k + '.d') + ' ' + src(k === 'euv' ? 'high-na-price' : 'euv-wavelength') + (tried.light ? ' ' + w('mo.light.after') : ''); }
  }
  function wireMoment(m) {
    const id = m.id, mark = () => { if (!tried[id]) { tried[id] = 1; } if (id === 'job' || id === 'light') done(id); };
    if (id === 'gate') ['a', 'b'].forEach(k => { el('g' + k).onclick = () => { T1.gate[k] ^= 1; mark(); momentOut(m); }; });
    else if (id === 'job') el('mj').oninput = e => { T1.job = +e.target.value; mark(); momentOut(m); };
    else if (id === 'bug') { el('mb1').onclick = () => { T1.bug.n += 1e6; mark(); momentOut(m); }; el('mb2').onclick = () => { T1.bug.worst = true; mark(); done('bug'); momentOut(m); }; }
    else el('ml').onclick = e => { const b = e.target.closest('button'); if (!b) return; T1.light = +b.dataset.i; heavy = T1.light === 1; mark(); el('ml').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); momentOut(m); };
    momentOut(m);
  }

  /* ============ the rail: the page's chapters down the left (on a phone, a strip that opens), the one you are in lit;
     under them the challenges of this page, each a square filled once it is done and a tap away ============ */
  const DONE = {};
  const SUBS = { years: [...MOMENTS.map(m => [m.id, m.at + .05]), ['wall', DWALL]], walls: WALLS.map(wl => [wl.id, 'hd-s-' + wl.id]) };
  el('chap').innerHTML = PARTS.map(([k, to]) => '<li data-k="' + k + '"><button type="button" class="h-ch" data-go="' + to + '"><i></i><span>' + w('tab.' + k) + '</span></button>' +
    (SUBS[k] ? '<ol>' + SUBS[k].map(([id, at]) => '<li><button type="button" data-sub="' + id + '" ' + (typeof at === 'number' ? 'data-d="' + at + '"' : 'data-go="' + at + '"') + '>' + w(k === 'years' ? 'rail.' + id : 'wall.' + id + '.s') + '</button></li>').join('') + '</ol>' : '') + '</li>').join('');
  el('tsq').innerHTML = CHALS.map(id => '<button type="button" data-ch="' + id + '" title="' + esc(w('ch.' + id)) + '" aria-label="' + esc(w('ch.' + id)) + '"></button>').join('');
  el('chap').setAttribute('aria-label', w('tabs.aria'));
  const CH_GO = { gate: 2.05, job: D71 + .05, bug: D95 + .05, light: GEN(3) + .05, walls: 'hd-s-switch', floor: 'hd-s-next', eras: 'hd-s-arch', arr: 'hd-s-arch', keep: 'hd-s-machine' };
  function tally() {
    const n = CHALS.filter(id => DONE[id]).length;
    el('tallyn').innerHTML = w('rail.chals', { n, of: CHALS.length });
    el('tsq').querySelectorAll('button').forEach(b => b.classList.toggle('on', !!DONE[b.dataset.ch]));
  }
  function done(id) { if (DONE[id]) return; DONE[id] = 1; tally(); cqK = ''; }
  let railK = '';
  function railNow() {
    const part = scene === 'hero' ? 'years' : ['switch', 'memory', 'power', 'cost'].includes(scene) ? 'walls' : scene;
    let sub = '';
    if (part === 'years') { sub = d >= DWALL - 1e-6 ? 'wall' : ''; for (const m of MOMENTS) if (d >= m.at - 1e-6 && d < DWALL - 1e-6) sub = m.id; }
    else if (part === 'walls') sub = scene;
    const k = part + '/' + sub; if (k === railK) return; railK = k;
    el('chap').querySelectorAll(':scope > li').forEach(li => { const on = li.dataset.k === part; li.classList.toggle('on', on); li.querySelector('.h-ch').setAttribute('aria-current', on ? 'true' : 'false'); });
    el('chap').querySelectorAll('[data-sub]').forEach(b => b.classList.toggle('on', b.dataset.sub === sub && b.closest('li[data-k]').dataset.k === part));
  }
  const railOpen = v => { const r = el('rail'); r.classList.toggle('is-open', v); el('railbtn').setAttribute('aria-expanded', v ? 'true' : 'false'); };
  el('railbtn').addEventListener('click', () => railOpen(!el('rail').classList.contains('is-open')));
  el('rail').addEventListener('click', ev => {
    const b = ev.target.closest('[data-d],[data-ch]'); if (!b) return;
    if (b.dataset.d) goD(+b.dataset.d);
    else { const to = CH_GO[b.dataset.ch]; if (typeof to === 'number') goD(to); else if (to) goTo(to); else { CV.stage = b.dataset.ch; cqK = ''; if (pos > YLEN) goD(Math.min(d, DWALL - 1.5)); } }
    railOpen(false); });

  /* ============ after the hold stops: the same square, scene by scene ============ */
  let scene = 'hero';
  const A = { hero: 1, switch: 0, memory: 0, power: 0, cost: 0, next: 0, arch: 0, machine: 0, island: 0 };

  /* ============ Moore's law, live: the chart beside the count. Up the side, steps of ten (or plain); along the bottom,
     the years. Your count draws its own line as you go; real chips appear as you reach their year; a red line is a
     pace you choose, to fit them. Add the clock, the cores or the power to see what else changed. Drag to go to a year.
     Three challenges ask about it: find the pace, find the year the clock stopped, guess 2026 before you get there ============ */
  const cv = el('cv'), cc = cv.getContext('2d'), Y0 = 1957, Y1 = 2031, CAP = 4e11;
  const CV = { lin: 0, to: 0, every: 1, on: { hz: 0, cores: 0, w: 0 }, k: { hz: 0, cores: 0, w: 0 }, guess: null, guessing: false, maxD: 0, hover: null, g: null, stage: null, msg: '' };
  const MARK = { hz: 'o', cores: 's', w: 't' };
  function paintChart(dt) {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (cv.width !== Math.round(r.width * DPR) || cv.height !== Math.round(r.height * DPR)) { cv.width = Math.round(r.width * DPR); cv.height = Math.round(r.height * DPR); }
    const W = r.width, H = r.height, small = W < 420, L = small ? 34 : 44, R = 8, T = 8, B = small ? 18 : 34;
    CV.lin += (CV.to - CV.lin) * Math.min(1, dt * 2.6); const k = CV.lin * CV.lin * (3 - 2 * CV.lin);
    for (const s of SERIES) CV.k[s] += ((CV.on[s] ? 1 : 0) - CV.k[s]) * Math.min(1, dt * 5);
    const X = y => L + (y - Y0) / (Y1 - Y0) * (W - L - R), ph = H - T - B;
    const YL = v => T + (1 - Math.log10(Math.max(v, 1)) / 12) * ph, YP = v => T + (1 - v / CAP) * ph, Y = v => lerp(YL(v), YP(v), k);
    CV.g = { L, R, T, B, W, H, ph, k };
    const c = cc, yNow = curYear(), num = v => new Intl.NumberFormat(locale(), { notation: 'compact', maximumSignificantDigits: 2 }).format(v);
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
    c.font = (small ? 10 : 11) + "px 'Anonymous Pro', 'Noto Sans SC', monospace"; c.textBaseline = 'middle'; c.lineWidth = 1;   // i18n-ok: a canvas font
    /* steps of ten, or plain */
    for (const [vals, al, Yf] of [[[1, 1e3, 1e6, 1e9, 1e12], 1 - k, YL], [[1e11, 2e11, 3e11, 4e11], k, YP]]) { if (al < .02) continue;
      for (const v of vals) { const y = Yf(v); c.globalAlpha = al; c.strokeStyle = fg(.12); c.beginPath(); c.moveTo(L, Math.round(y) + .5); c.lineTo(W - R, Math.round(y) + .5); c.stroke(); c.fillStyle = fg(.6); c.textAlign = 'right'; c.fillText(num(v), L - 6, y); } }
    c.globalAlpha = 1; c.strokeStyle = fg(.5); c.beginPath(); c.moveTo(L, T + ph + .5); c.lineTo(W - R, T + ph + .5); c.stroke();
    c.fillStyle = fg(.6); c.textAlign = 'center';
    for (const y of small ? [1971, 2000, 2026] : [1960, 1971, 1990, 2010, 2026]) { c.fillText(y, X(y), T + ph + 9); c.fillRect(X(y) - .5, T + ph, 1, 4); }
    /* how the machine grew, along the bottom: one era after another */
    if (!small) ERAS.forEach(([id, y0e], i) => { const x0 = X(y0e), x1 = X(i < ERAS.length - 1 ? ERAS[i + 1][1] : 2026), on = yNow >= y0e && (i === ERAS.length - 1 || yNow < ERAS[i + 1][1]), yb = H - 9;
      c.fillStyle = on ? RED : fg(.16); c.fillRect(x0 + 1, yb - 1.5, x1 - x0 - 2, 3); c.fillStyle = on ? RED : fg(.55); c.textAlign = 'left';
      const tx = w('era.' + id + '.b'); if (c.measureText(tx).width < x1 - x0 - 6) c.fillText(tx, x0 + 3, yb - 8); });
    c.save(); c.beginPath(); c.rect(L, T - 2, W - L - R, ph + 2); c.clip();
    /* Moore's line of 1965: twice every year */
    if (k < .98) { c.globalAlpha = 1 - k; c.strokeStyle = fg(.4); c.setLineDash([3, 4]); c.beginPath(); MOORE65.forEach(([y, v], i) => (i ? c.lineTo(X(y), Y(v)) : c.moveTo(X(y), Y(v)))); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
    /* every microprocessor, as you reach its year */
    c.fillStyle = fg(.28); for (const [y, v] of trend('tr')) { if (y > yNow + .05) break; c.fillRect(X(y) - 1.2, Y(v) - 1.2, 2.4, 2.4); }
    /* what else changed: the clock (ticks a second), the cores, the power (watts) */
    for (const s of SERIES) { const a = CV.k[s]; if (a < .02) continue; c.globalAlpha = a; c.strokeStyle = s === 'hz' ? RED : ink; c.fillStyle = ink; c.lineWidth = 1.2; let lastP = null;
      for (const [y, v] of trend(s)) { if (y > yNow + .05) break; const x = X(y), yy = Y(v); lastP = [x, yy];
        if (MARK[s] === 'o') { c.beginPath(); c.arc(x, yy, 2.6, 0, 7); c.stroke(); } else if (MARK[s] === 's') c.fillRect(x - 2, yy - 2, 4, 4); else { c.beginPath(); c.moveTo(x, yy - 3); c.lineTo(x + 3, yy + 2.4); c.lineTo(x - 3, yy + 2.4); c.closePath(); c.stroke(); } }
      if (lastP) { c.fillStyle = s === 'hz' ? RED : ink; c.textAlign = 'left'; c.fillText(w('ser.' + s + '.u'), Math.min(lastP[0] + 6, W - R - 70), lastP[1] - 8); }
      c.globalAlpha = 1; c.lineWidth = 1; }
    /* the pace you chose, from 2,300 in 1971 */
    c.strokeStyle = RED; c.lineWidth = 1.6; c.setLineDash([6, 4]); c.beginPath(); for (let y = 1971; y <= Y1; y += .25) { const p = [X(y), Y(rule(y, CV.every))]; if (y === 1971) c.moveTo(...p); else c.lineTo(...p); } c.stroke(); c.setLineDash([]);
    /* your count's own line, so far */
    c.strokeStyle = ink; c.lineWidth = 2.6; c.beginPath(); const dn = Math.min(d, DWALL); for (let dd = 0; dd <= dn; dd += .1) { const p = [X(yearAt(dd)), Y(Math.pow(2, dd))]; if (!dd) c.moveTo(...p); else c.lineTo(...p); } c.lineTo(X(yNow), Y(Math.pow(2, dn))); c.stroke();
    /* the chips, as you reach them */
    let lastC = null; CHIPS.forEach(([y, v, key]) => { if (y > yNow + .3) return; lastC = [y, v, key]; c.fillStyle = paper; c.strokeStyle = ink; c.lineWidth = 1.5; c.beginPath(); c.arc(X(y), Y(v), 3.6, 0, 7); c.fill(); c.stroke(); });
    /* your guess for 2026, and how it came out */
    if (CV.guess) { const gx = X(2026), gy = Y(CV.guess); c.fillStyle = RED; c.save(); c.translate(gx, gy); c.rotate(Math.PI / 4); c.fillRect(-4.5, -4.5, 9, 9); c.restore();
      if (CV.maxD >= DWALL - 1e-6) { const ay = Y(CHIPS[CHIPS.length - 1][1]); c.strokeStyle = RED; c.lineWidth = 1; c.beginPath(); c.moveTo(gx - 10, gy); c.lineTo(gx - 10, ay); c.stroke(); } }
    c.restore();
    /* where you are: a line down the year, the dot on your count */
    const cx = X(yNow), cy = Y(Math.pow(2, dn)); c.strokeStyle = fg(.25); c.lineWidth = 1; c.beginPath(); c.moveTo(Math.round(cx) + .5, T); c.lineTo(Math.round(cx) + .5, T + ph); c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(cx, cy, holding ? 6 + Math.sin(now / 90) : 5.5, 0, 7); c.fill();
    if (lastC) { const lx = X(lastC[0]), ly = Y(lastC[1]), right = lx > W * .6; c.fillStyle = ink; c.textAlign = right ? 'right' : 'left'; c.font = "600 " + (small ? 10 : 11.5) + "px 'DM Sans', 'Noto Sans SC', sans-serif"; c.fillText(w('chip.' + lastC[2]), lx + (right ? -8 : 8), Math.max(T + 8, ly - 10)); }   // i18n-ok: a canvas font
    /* a hand over the chart: the year under it */
    if (CV.hover !== null && !CV.drag) { const hx = X(CV.hover); c.strokeStyle = fg(.4); c.setLineDash([2, 3]); c.beginPath(); c.moveTo(hx, T); c.lineTo(hx, T + ph); c.stroke(); c.setLineDash([]); c.fillStyle = fg(.8); c.textAlign = 'center'; c.font = (small ? 10 : 11) + "px 'Anonymous Pro', monospace"; c.fillText(Math.round(CV.hover), hx, T + 4); }   // i18n-ok: a canvas font
  }
  const yearOfX = x => { const g = CV.g; return Y0 + (x - g.L) / (g.W - g.L - g.R) * (Y1 - Y0); };
  const valOfY = y => { const g = CV.g, f = 1 - (y - g.T) / g.ph; return g.k < .5 ? Math.pow(10, Math.max(0, Math.min(12, f * 12))) : Math.max(1, f * CAP); };
  const scrub = x => { const y = Math.min(2026, Math.max(1959.9, yearOfX(x))); goD(y >= 2025.6 ? DWALL : Math.min(DWALL - .02, dAt(y)), true); };
  let cvDown = null;
  cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; e.preventDefault(); touch();
    if (CV.guessing) { CV.guess = valOfY(y); CV.guessing = false; cls('guessing', false); cqK = ''; return; }
    cvDown = { x, y, moved: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* no capture */ } CV.drag = true; scrub(x); });
  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left; if (!CV.g) return; CV.hover = Math.min(2026, Math.max(Y0, yearOfX(x)));
    if (cvDown) { if (Math.abs(x - cvDown.x) > 5) cvDown.moved = true; scrub(x); } });
  cv.addEventListener('pointerup', e => { if (!cvDown) return; const r = cv.getBoundingClientRect(), y = yearOfX(e.clientX - r.left);
    if (!cvDown.moved && CV.on.hz) { if (y >= KNEE[0] && y <= KNEE[1]) { done('knee'); CV.msg = 'knee.yes'; } else CV.msg = 'knee.no'; cqK = ''; }
    cvDown = null; CV.drag = false; });
  cv.addEventListener('pointercancel', () => { cvDown = null; CV.drag = false; });
  cv.addEventListener('pointerleave', () => { CV.hover = null; });
  /* the chart's controls: steps of ten or plain, and what else to show */
  el('c-sc').onclick = e => { const b = e.target.closest('button'); if (!b) return; el('c-sc').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); CV.to = +b.dataset.i; touch(); };
  const setSer = (s, v) => { CV.on[s] = v ? 1 : 0; const b = el('c-ser').querySelector('[data-s="' + s + '"]'); b.classList.toggle('on', !!v); b.setAttribute('aria-pressed', v ? 'true' : 'false'); cqK = ''; };
  el('c-ser').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { setSer(b.dataset.s, !CV.on[b.dataset.s]); touch(); } };
  /* the chart's questions, one at a time: the first not yet answered, and what it gives when it is */
  let cqK = '';
  const stageNow = () => CV.stage && !DONE[CV.stage] ? CV.stage : ['fit', 'knee', 'guess'].find(id => !DONE[id]) || 'done';
  function chartQ() {
    const st = stageNow(), key = st + '|' + CV.every + '|' + CV.on.hz + '|' + (CV.guess ? 1 : 0) + '|' + (CV.maxD >= DWALL - 1e-6 ? 1 : 0) + '|' + CV.guessing + '|' + CV.msg + '|' + (FACT['moore-1965'] ? 1 : 0);
    if (key === cqK) return; cqK = key;
    const last = CHIPS[CHIPS.length - 1], skip = st !== 'done' ? '<button type="button" class="h-cqs h-mono" id="hd-cqs">' + w('cq.skip') + '</button>' : '', lead = '<div class="h-cqh"><span class="h-cqk h-mono"><i></i>' + w('cq.k') + '</span>' + skip + '</div>';
    let h = '';
    if (st === 'fit') { const miss = rule(2026, CV.every) / last[1], far = miss >= 1 ? miss : 1 / miss;
      h = lead + '<p>' + w('cq.fit') + ' ' + src('moore-1965') + '</p><div class="h-every"><input type="range" id="hd-c-ev" min="0.5" max="4" step="0.1" value="' + CV.every + '" aria-label="' + esc(w('cq.fit.aria')) + '"><b>' + (CV.every === 1 ? w('cq.every1') : w('cq.every', { n: CV.every.toLocaleString(locale(), { maximumFractionDigits: 1 }) })) + '</b></div>' +
        '<p class="h-cqo">' + (Math.abs(CV.every - 2) <= .25 ? '' : w(miss >= 1 ? 'cq.fit.over' : 'cq.fit.under', { x: far < 1000 ? nf(Math.round(far)) : compact({ maximumSignificantDigits: 2 }).format(far) })) + '</p>'; }
    else if (st === 'knee') h = lead + '<p>' + w('cq.knee') + '</p>' + (CV.on.hz ? '' : '<button type="button" class="h-btn h-ghost h-smb" id="hd-c-hz">' + w('cq.knee.b') + '</button>') + (CV.msg === 'knee.no' ? '<p class="h-cqo">' + w('cq.knee.no') + '</p>' : '');
    else if (st === 'guess') { const seen = CV.maxD >= DWALL - 1e-6;
      h = lead + '<p>' + w(seen && !CV.guess ? 'cq.guess.seen' : 'cq.guess') + '</p>' + (CV.guess ? '<p class="h-cqo">' + w('cq.guess.yours', { n: compact({ maximumSignificantDigits: 2 }).format(CV.guess) }) + '</p>' : seen ? '' : '<button type="button" class="h-btn h-ghost h-smb" id="hd-c-gs">' + w(CV.guessing ? 'cq.guess.tap' : 'cq.guess.b') + '</button>'); }
    else h = '<div class="h-cqh"><span class="h-cqk h-mono h-ok2"><i></i>' + w('cq.done.k') + '</span></div><p>' + w('cq.done') + '</p><p class="h-cqq"><em>' + Q('moore') + '</em></p>';
    /* what the last answer gave, above the next question */
    const res = { fit: '<b>' + w('cq.fit.yes.v') + '</b> ' + w('cq.fit.yes'), 'knee.yes': '<b>' + w('cq.knee.yes.v') + '</b> ' + w('cq.knee.yes') + ' ' + src('clock-stall', 'dual-core-2005'), guess: w('cq.guess.out', guessOut()) }[CV.msg];
    if (res) h = '<p class="h-cqr">' + res + '</p>' + h;
    el('cq2').innerHTML = h;
    const ev = el('c-ev'); if (ev) ev.oninput = () => { CV.every = Math.round(+ev.value * 10) / 10; if (Math.abs(CV.every - 2) <= .25) { done('fit'); CV.msg = 'fit'; } touch(); };
    const hb = el('c-hz'); if (hb) hb.onclick = () => setSer('hz', true);
    const gs = el('c-gs'); if (gs) gs.onclick = () => { CV.guessing = !CV.guessing; cls('guessing', CV.guessing); cqK = ''; };
    const sk = el('cqs'); if (sk) sk.onclick = () => { const order = ['fit', 'knee', 'guess'].filter(id => !DONE[id]), i = order.indexOf(st); CV.stage = order[(i + 1) % order.length] || null; CV.msg = ''; cqK = ''; };
  }
  function guessOut() { const real = CHIPS[CHIPS.length - 1][1], g = CV.guess || 1, f = g > real ? g / real : real / g, x = f < 1000 ? nf(Math.round(f)) : compact({ maximumSignificantDigits: 2 }).format(f);
    return { n: compact({ maximumSignificantDigits: 2 }).format(g), x, verdict: w(f <= 2 ? 'cq.guess.v1' : f <= 10 ? 'cq.guess.v2' : g < real ? 'cq.guess.v3' : 'cq.guess.v4', { x }) }; }

  /* ============ the next fifty years: hold again, and go down, from the energy of a bit fetched off another chip to
     the floor physics sets for one bit. Beside it, as long as the room the last fifty years used: how much is left ============ */
  const NX = { p: 0, v: 0, hold: false, at: -1 };
  const LT = Math.log10(RUNGS[0][1]), LB = Math.log10(RUNGS[RUNGS.length - 1][1]), lp = E => (LT - Math.log10(E)) / (LT - LB), RP = RUNGS.map(r => lp(r[1]));
  function advanceNext(dt) {
    const nxt = RP.find(r => NX.p < r - 1e-4), lim = nxt === undefined ? 0 : .035 + Math.max(0, nxt - NX.p) * .9;
    if (NX.hold) NX.v += (Math.min(.17, lim) - NX.v) * Math.min(1, dt * 3); else NX.v *= Math.exp(-8 * dt);
    NX.p = Math.min(1, NX.p + NX.v * dt);
    const at = RP.filter(r => NX.p >= r - 2e-3).length - 1; if (at !== NX.at) { NX.at = at; nextOut(); }
    const b = el('nbtn'); if (b) { b.classList.toggle('on', NX.hold); el('nnum').innerHTML = nextNum(); }
  }
  const nextNum = () => { const r = RUNGS[NX.at]; if (r && r[0] === ZONE_RUNG && NX.p < RP[RP.length - 1] - .01 && Math.abs(NX.p - RP[NX.at]) < .08) return '×?';
    const E = Math.pow(10, LT - NX.p * (LT - LB)); return '×' + (RUNGS[0][1] / E < 1000 ? nf(Math.round(RUNGS[0][1] / E)) : compact({ maximumSignificantDigits: 2 }).format(RUNGS[0][1] / E)); };
  function nextOut() { const o = el('nout'); if (!o) { NX.at = -1; return; } if (NX.at < 0) return; const [id, , facts, href] = RUNGS[NX.at];
    el('nunit').textContent = id === ZONE_RUNG ? w('nx.zone') : w('nx.unit');
    o.innerHTML = '<b>' + w('rung.' + id + '.t') + '</b>' + w('rung.' + id + '.d') + ' ' + src(...facts) + '<br><a class="h-lnk" href="' + href + '">' + w('way.try') + '</a>';
    el('ncq').hidden = NX.at < RUNGS.length - 1; if (NX.at >= RUNGS.length - 1) done('floor'); }
  function paintNext(c, T, dt, a) {
    const top = 120, bot = 860, dec = (bot - top) / (LT - LB), yB = top + Math.log10(BEHIND) * dec, yP = top + NX.p * (bot - top);
    c.globalAlpha = a; c.font = "22px 'Anonymous Pro', monospace"; c.textBaseline = 'alphabetic'; c.textAlign = 'left';   // i18n-ok: a canvas font
    /* behind: the room fifty years of shrinking used */
    c.fillStyle = fg(.85); c.fillRect(130, top, 110, yB - top);
    c.fillStyle = fg(.75); c.fillText(w('nx.behind').toUpperCase(), 130, top - 22);
    c.font = "400 34px Anton, Impact, sans-serif"; c.fillStyle = ink; c.fillText('×' + compact({ maximumSignificantDigits: 3 }).format(BEHIND), 130, yB + 44);   // i18n-ok: a canvas font
    /* ahead: the room left in energy */
    c.strokeStyle = RED; c.lineWidth = 3; c.strokeRect(330, top, 110, bot - top);
    c.fillStyle = 'rgba(229,64,26,.35)'; c.fillRect(330, top, 110, yP - top);
    c.font = "22px 'Anonymous Pro', monospace"; c.fillStyle = RED; c.fillText(w('nx.ahead').toUpperCase(), 330, top - 22);   // i18n-ok: a canvas font
    c.font = "400 34px Anton, Impact, sans-serif"; c.fillText('×' + compact({ maximumSignificantDigits: 2 }).format(AHEAD), 330, bot + 44);   // i18n-ok: a canvas font
    /* the rungs, and the band where the bets aim */
    c.font = "500 23px 'DM Sans', sans-serif"; c.textBaseline = 'middle';   // i18n-ok: a canvas font
    RUNGS.forEach(([id], i) => { const y = top + RP[i] * (bot - top), on = i <= NX.at; c.globalAlpha = a * (on ? 1 : .45);
      if (id === ZONE_RUNG) { const y0 = top + RP[i - 1] * (bot - top) + 30, y1 = top + RP[i + 1] * (bot - top) - 30; c.setLineDash([6, 6]); c.strokeStyle = ink; c.lineWidth = 2; c.beginPath(); c.moveTo(466, y0); c.lineTo(476, y0); c.lineTo(476, y1); c.lineTo(466, y1); c.stroke(); c.setLineDash([]); }
      else { c.fillStyle = ink; c.fillRect(440, y - 1.5, 30, 3); }
      c.fillStyle = on ? ink : fg(.8); c.textAlign = 'left'; c.fillText(w('rung.' + id + '.t'), 494, y); });
    /* the bit on its way down */
    NXPT = [385, yP]; c.globalAlpha = a; c.fillStyle = RED; const s0 = 26 + (NX.hold && !reduce() ? 4 * Math.sin(T * 20) : 0); c.fillRect(385 - s0 / 2, yP - s0 / 2, s0, s0);
    c.globalAlpha = 1; c.textBaseline = 'alphabetic';
  }
  const W4 = { switch: { n: 0 }, memory: { sel: 0, pos: 0 }, power: { guess: 485, shown: false, rv: 0 }, cost: { open: 0, f: 0 } };
  /* ============ how a computer is arranged: rise from the transistor to the machine, then try another arrangement ============ */
  const AR = { z: 3, zTo: 3, sel: 0, f: [1, 0, 0, 0, 0], seen: {}, era: -1, ef: [0, 0, 0, 0], eras: {} };
  function archOut() { if (!el('o-arch')) return; const lv = Math.round(AR.zTo), r = ARR[AR.sel], id = r[0];
    el('a-z').value = 3 - AR.zTo; el('a-sel').querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === AR.sel && lv === 0 && AR.era < 0));
    el('a-era').querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === AR.era && lv === 0));
    /* how the machine grew: an era, drawn on the square, and where it shows on the chart of the fifty years */
    if (AR.era >= 0 && lv === 0) { const [eid, , ef, ehref] = ERAS[AR.era]; AR.eras[eid] = 1; if (ERAS.every(e => AR.eras[e[0]])) done('eras');
      el('o-era').innerHTML = '<b>' + w('era.' + eid + '.t') + '</b>' + w('era.' + eid + '.d') + ' ' + src(...ef) + '<br><button type="button" class="h-go h-up" data-era="' + AR.era + '">' + w('era.see') + '</button> <a class="h-lnk" href="' + ehref + '">' + w('way.try') + '</a>';
      return; }
    if (AR.era < 0 && el('o-era').innerHTML) el('o-era').innerHTML = '';
    if (lv === 0) AR.seen[id] = 1;
    el('o-arch').innerHTML = lv > 0 ? w('lv.' + lv + '.d') : '<b>' + (id === 'classic' ? w('arr.classic.t') : bet(id, 't')) + '</b>' + (r[1] ? '<span class="h-mono h-st0">' + w('status.' + r[1]) + '</span> ' : '') + (id === 'classic' ? w('arr.classic.d') : bet(id, 'd')) + ' ' + src(...r[2]) +
      '<br><span class="h-trip h-mono">' + w('arr.trip') + ' <b>' + w('trip.' + TRIP[id]) + '</b></span><br><span class="h-mono h-st0">' + w('arr.legend') + '</span><br><a class="h-lnk" href="' + r[3] + '">' + w('way.try') + '</a>';
    const zero = Object.keys(TRIP).filter(k => !TRIP[k]), got = zero.filter(k => AR.seen[k]).length;
    el('a-ch').innerHTML = got >= zero.length ? '<b>' + w('arch.ch.done') + '</b> ' + w('arch.ch.why') : w('arch.ch', { n: got, of: zero.length });
    el('a-cq').hidden = got < zero.length; }
  const bx = (c, r, m) => { c.fillStyle = bg(.92); c.fillRect(r[0], r[1], r[2], r[3]); c.strokeStyle = ink; c.lineWidth = 2.5; c.strokeRect(r[0], r[1], r[2], r[3]);
    const nx = m ? Math.max(3, Math.round(r[2] / 38)) : Math.max(2, Math.round(r[2] / 90)), ny = m ? Math.max(2, Math.round(r[3] / 38)) : Math.max(1, Math.round(r[3] / 100)), gw = (r[2] - 20) / nx, gh = (r[3] - 20) / ny;
    c.fillStyle = m ? fg(.34) : fg(.15); for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) c.fillRect(r[0] + 10 + i * gw + 3, r[1] + 10 + j * gh + 3, gw - 6, gh - 6); };
  const run = (c, pts, T, sp, col, gap, sz) => { let len = 0; const sg = pts.slice(1).map((q, i) => { const l = Math.abs(q[0] - pts[i][0]) + Math.abs(q[1] - pts[i][1]); len += l; return l; });
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); if (reduce()) return;
    c.fillStyle = HI; for (let k = 0; k < Math.max(1, Math.round(len / gap)); k++) { let s = (T * sp + k * gap) % len, i = 0; while (i < sg.length - 1 && s > sg[i]) { s -= sg[i]; i++; } const p = pts[i], q = pts[i + 1], f = s / sg[i]; c.fillRect(p[0] + (q[0] - p[0]) * f - sz / 2, p[1] + (q[1] - p[1]) * f - sz / 2, sz, sz); } };
  const ARRDRAW = {
    classic(c, T) { c.setLineDash([8, 8]); c.strokeStyle = fg(.45); c.lineWidth = 1.5; c.strokeRect(50, 60, 390, 310); c.setLineDash([]); bx(c, [80, 90, 330, 250], 1); bx(c, [560, 560, 360, 340], 0); run(c, [[245, 340], [245, 730], [560, 730]], T, 260, RED, 150, 14); },
    stack(c, T) { bx(c, [280, 560, 440, 320], 0); for (let i = 0; i < 4; i++) bx(c, [280 + i * 14, 470 - i * 84 - 14, 440 - i * 28, 62], 1); for (const x of [380, 500, 620]) run(c, [[x, 560], [x, 532]], T + x, 60, RED, 40, 10); },
    cim(c, T) { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = 100 + i * 280, y = 100 + j * 280; bx(c, [x, y, 240, 130], 0); bx(c, [x, y + 130, 240, 110], 1); if (!reduce() && (Math.floor(T * 3) + i * 2 + j * 5) % 4 === 0) { c.fillStyle = RED; c.fillRect(x + 80 + ((i + j) % 3) * 30, y + 122, 16, 16); } } },
    light(c, T) { bx(c, [90, 110, 300, 200], 0); bx(c, [90, 310, 300, 110], 1); bx(c, [610, 560, 300, 200], 0); bx(c, [610, 760, 300, 110], 1); c.setLineDash([16, 10]); run(c, [[390, 210], [760, 210], [760, 560]], T, 950, ink, 120, 0); c.setLineDash([]); if (!reduce()) { c.strokeStyle = HI; c.lineWidth = 6; for (let k = 0; k < 4; k++) { const s = (T * 950 + k * 180) % 720, p = s < 370 ? [390 + s, 210] : [760, 210 + s - 370]; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - (s < 370 ? 46 : 0), p[1] - (s < 370 ? 0 : 46)); c.stroke(); } } },
    spikes(c, T) { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const x = 150 + i * 100, y = 150 + j * 100, k = rnd(mix(i * 8 + j, Math.floor(T * 2.5))) < 0.07 && !reduce(); if (k) { c.fillStyle = RED; c.beginPath(); c.arc(x, y, 20, 0, 7); c.fill(); c.strokeStyle = RED; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 20 + ((T * 2.5) % 1) * 46, 0, 7); c.stroke(); } else { c.fillStyle = fg(.6); c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } } }
  };
  /* how the machine grew: one core with a faster and faster clock; then several cores sharing one memory; then a chip made
     for one kind of work beside the general one; then one package of small chips around a hub */
  const wave = (c, x0, x1, y, per, T, hgt) => { c.strokeStyle = RED; c.lineWidth = 3; c.beginPath(); const o = reduce() ? 0 : (T * per * 1.5) % (2 * per); for (let x = x0; x <= x1; x += 2) { const up = Math.floor((x - x0 + o) / per) % 2; const yy = y - (up ? hgt : 0); if (x === x0) c.moveTo(x, yy); else c.lineTo(x, yy); } c.stroke(); };
  const ERADRAW = {
    clock(c, T) { bx(c, [260, 220, 480, 330], 0); bx(c, [260, 650, 480, 190], 1); wave(c, 260, 740, 180, 34 - 22 * ((T * .25) % 1), T, 34); run(c, [[500, 550], [500, 650]], T, 220, RED, 60, 12); },
    cores(c, T) { for (const [x, y] of [[180, 130], [520, 130], [180, 360], [520, 360]]) bx(c, [x, y, 300, 190], 0); bx(c, [180, 650, 640, 200], 1);
      for (const x of [330, 670]) run(c, [[x, 550], [x, 650]], T + x / 300, 200, RED, 50, 11); wave(c, 180, 820, 100, 40, T, 22); },
    special(c, T) { bx(c, [100, 120, 250, 180], 0); bx(c, [100, 420, 250, 420], 1); c.fillStyle = bg(.92); c.fillRect(420, 120, 480, 720); c.strokeStyle = ink; c.lineWidth = 2.5; c.strokeRect(420, 120, 480, 720);
      for (let i = 0; i < 12; i++) for (let j = 0; j < 18; j++) { const on = !reduce() && rnd(mix(i * 18 + j, Math.floor(T * 6))) < .5; c.fillStyle = on ? RED : fg(.2); c.fillRect(438 + i * 38.5, 138 + j * 38.5, 30, 30); }
      run(c, [[350, 210], [420, 210]], T, 120, RED, 40, 10); run(c, [[225, 420], [225, 300]], T, 120, RED, 40, 10); },
    chiplets(c, T) { c.setLineDash([12, 9]); c.strokeStyle = fg(.45); c.lineWidth = 2; c.strokeRect(70, 70, 860, 860); c.setLineDash([]); bx(c, [390, 360, 220, 280], 1);
      const pos8 = [[110, 110], [390, 110], [670, 110], [110, 390], [670, 390], [110, 670], [390, 690], [670, 670]];
      pos8.forEach(([x, y], i) => { bx(c, [x, y, 220, 190], 0); const cxp = x + 110, cyp = y + 95; run(c, cxp === 500 ? [[cxp, y < 360 ? y + 190 : y], [cxp, y < 360 ? 360 : 640]] : [[x < 390 ? x + 220 : x, cyp], [x < 390 ? 390 : 610, cyp]], T + i * .3, 140, RED, 50, 10); }); }
  };
  const plate = c => { c.fillStyle = paper; c.fillRect(110, 110, 780, 780); };
  function switchView(c, T) { plate(c); const sv = press, a = c.globalAlpha, on = Math.floor(T / 1.6) % 2; press = on; bigT(c, 1000, a, T); press = sv; c.globalAlpha = a;
    if (!on && !reduce()) { c.fillStyle = RED; for (let i = 0; i < 3; i++) { const f = (T * .35 + i / 3) % 1; c.beginPath(); c.arc(430 + f * 140, 574, 6, 0, 7); c.fill(); } } }
  function gateView(c, T) { plate(c); const A1 = Math.floor(T / 1.2) % 2, B1 = Math.floor(T / 2.4) % 2, out = !(A1 && B1), a = c.globalAlpha;
    c.strokeStyle = ink; c.lineWidth = 4; c.beginPath(); c.moveTo(390, 200); c.lineTo(390, 420); c.moveTo(610, 200); c.lineTo(610, 420); c.moveTo(250, 200); c.lineTo(750, 200); c.moveTo(390, 420); c.lineTo(610, 420); c.moveTo(500, 420); c.lineTo(500, 800); c.moveTo(250, 800); c.lineTo(750, 800); c.moveTo(500, 420); c.lineTo(800, 420); c.stroke();
    for (const [x, y, on] of [[390, 310, !A1], [610, 310, !B1], [500, 520, A1], [500, 680, B1]]) { c.fillStyle = paper; c.fillRect(x - 70, y - 54, 140, 108); glyph(c, x, y, 34, on ? 1 : 0, a, 3.2, 'planar'); }
    c.globalAlpha = a; c.fillStyle = out ? RED : paper; c.strokeStyle = out ? RED : ink; c.lineWidth = 4; c.beginPath(); c.arc(800, 420, 20, 0, 7); c.fill(); c.stroke();
    for (const [y, v] of [[520, A1], [680, B1]]) { c.fillStyle = v ? RED : paper; c.strokeStyle = v ? RED : ink; c.beginPath(); c.arc(300, y, 16, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(316, y); c.lineTo(430, y); c.stroke(); } }
  function blockView(c, T) { c.strokeStyle = fg(.5); c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(140, 200 + i * 150); c.lineTo(860, 200 + i * 150); c.moveTo(200 + i * 150, 140); c.lineTo(200 + i * 150, 860); } c.stroke();
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const x = 200 + i * 150, y = 200 + j * 150, on = rnd(mix(i * 5 + j, Math.floor(T * 2))) < 0.3 && !reduce(); c.fillStyle = on ? RED : BG; c.strokeStyle = on ? RED : ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 34, y - 30); c.lineTo(x, y - 30); c.arc(x, y, 30, -Math.PI / 2, Math.PI / 2); c.lineTo(x - 34, y + 30); c.closePath(); c.fill(); c.stroke(); } }
  function paintArch(c, T, dt, a) {
    AR.z += (AR.zTo - AR.z) * Math.min(1, dt * 3.5); AR.f = AR.f.map((v, i) => v + ((i === AR.sel && AR.era < 0 ? 1 : 0) - v) * Math.min(1, dt * 5)); AR.ef = AR.ef.map((v, i) => v + ((i === AR.era ? 1 : 0) - v) * Math.min(1, dt * 5));
    const lv = (k, fn) => { const q = Math.pow(6, AR.z - k), al = q < 1 ? ss(0.2, 0.62, q) : 1 - ss(2.2, 5.5, q); if (al <= .01) return; c.save(); c.translate(500, 500); c.scale(q, q); c.translate(-500, -500); c.globalAlpha = a * al; fn(); c.restore(); };
    lv(0, () => { const g = c.globalAlpha; ARR.forEach((r, i) => { if (AR.f[i] > .02) { c.globalAlpha = g * AR.f[i]; ARRDRAW[r[0]](c, T); } }); ERAS.forEach((r, i) => { if (AR.ef[i] > .02) { c.globalAlpha = g * AR.ef[i]; ERADRAW[r[0]](c, T); } }); });
    lv(1, () => blockView(c, T)); lv(2, () => gateView(c, T)); lv(3, () => switchView(c, T)); c.globalAlpha = 1;
  }

  /* ---- the next machine ---- */
  const LAY = { 4: [[60, 60, 500, 880], [600, 60, 340, 400], [600, 500, 340, 200], [600, 740, 340, 200]], 5: [[60, 60, 520, 560], [620, 60, 320, 270], [620, 370, 320, 250], [60, 660, 420, 280], [520, 660, 420, 280]] };
  const M = { need: 'hearing', plan: {}, kept: false, tried: null, agentT: 0, cand: null };
  const needNow = () => NEEDS.find(n => n.id === M.need);
  const formOf = p => (STOCK.includes(p[1]) ? 'circuit' : (M.plan[M.need + '.' + p[0]] || 'software'));
  const energyOf = (n, f) => n.parts.reduce((s, p) => s + p[2] * FCOST[f(p)], 0) / n.parts.reduce((s, p) => s + p[2], 0);
  const missOf = (n, f) => n.change.filter(id => f(n.parts.find(p => p[0] === id)) === 'circuit');
  const rectsOf = n => { const order = n.parts.map((p, i) => i).sort((a, b) => n.parts[b][2] - n.parts[a][2]), L = LAY[n.parts.length], out = []; order.forEach((pi, k) => { out[pi] = L[k]; }); return out; };
  function agent() { const n = needNow(), free = n.parts.filter(p => !STOCK.includes(p[1])), all = []; let ok = 0, best = null;
    for (let c = 0; c < Math.pow(3, free.length); c++) { const plan = {}; free.forEach((p, i) => { plan[p[0]] = FORMS[Math.floor(c / Math.pow(3, i)) % 3]; }); const f = p => (STOCK.includes(p[1]) ? 'circuit' : plan[p[0]]), e = energyOf(n, f), m = missOf(n, f).length; all.push(plan); if (!m) { ok++; if (!best || e < best.e) best = { plan, e }; } }
    M.cand = all; M.agentT = reduce() ? .01 : 1.1; M.best = best.plan; M.tried = { n: all.length, ok }; }
  const setPlan = plan => { for (const k in plan) M.plan[M.need + '.' + k] = plan[k]; };

  const SHORE = [[-86, -26], [-70, -52], [-30, -58], [10, -52], [44, -60], [78, -36], [92, 2], [80, 34], [40, 48], [4, 52], [-36, 50], [-70, 36], [-92, 6]];
  const ISLE = [['lab', 6, 26], ['studio', -48, -30], ['quarry', -62, -4], ['fab', -8, -16], ['test', 22, -2], ['port', 62, 6], ['datacentre', 36, -36], ['village', -34, 24]];
  let hotPlace = null, isleT = 0;

  /* ============ the checks (after Fable's Tapeout prototype): each wall is a violation that a check finds on the
     square, a red line sweeping down it the first time you reach that wall; what the check found stays marked where it
     bites, and the status strip under the square counts them. Nobody can waive one ============ */
  const VIO = {}, FOUND4 = {}, SCAN = { k: null, y: 2000 }, VLAB = {};
  let NXPT = [385, 500];
  function drawChecks(c, dt) {
    const k = WALLS.some(x => x.id === scene) ? scene : null;
    if (k && SCAN.k !== k) { SCAN.k = k; if (reduce()) FOUND4[k] = 1; SCAN.y = FOUND4[k] ? 2000 : -40; }
    if (SCAN.y < 1100) { SCAN.y += dt * 1150; if (SCAN.y >= 1000 && k) FOUND4[k] = 1; }
    WALLS.forEach((wl, i) => { const a = A[wl.id], r = wl.id === 'switch' ? loupeBox() : VIO[wl.id], on = a > .02 && r && (FOUND4[wl.id] || (SCAN.k === wl.id && SCAN.y > r[1]));
      vioLabel(wl.id, i, r, on && a > .5);
      if (!on) return; const [x, y, ww, h] = r, pulse = reduce() ? .12 : .1 + .06 * Math.sin(now / 320 + i);
      c.globalAlpha = a; c.fillStyle = 'rgba(229,64,26,' + pulse + ')'; c.fillRect(x, y, ww, h);
      c.save(); c.beginPath(); c.rect(x, y, ww, h); c.clip(); c.strokeStyle = 'rgba(229,64,26,.4)'; c.lineWidth = 2; c.beginPath(); const off = reduce() ? 0 : (now / 110) % 18; for (let q = -h; q < ww + 18; q += 18) { c.moveTo(x + q + off, y + h); c.lineTo(x + q + off + h, y); } c.stroke(); c.restore();
      c.strokeStyle = RED; c.lineWidth = 4; c.strokeRect(x, y, ww, h); c.fillStyle = RED; for (const [cx, cy] of [[x, y], [x + ww, y], [x, y + h], [x + ww, y + h]]) c.fillRect(cx - 8, cy - 8, 16, 16); c.globalAlpha = 1; });
    if (SCAN.y > -40 && SCAN.y < 1000 && k) { const g = c.createLinearGradient(0, SCAN.y - 120, 0, SCAN.y); g.addColorStop(0, 'rgba(229,64,26,0)'); g.addColorStop(1, 'rgba(229,64,26,.22)'); c.fillStyle = g; c.fillRect(0, SCAN.y - 120, 1000, 120); c.fillStyle = RED; c.fillRect(0, SCAN.y, 1000, 4); }
  }
  /* the leak is in every transistor: the check marks the one in the glass */
  const loupeBox = () => { const R = loupe.clientWidth / 2 / S * 1000; return R ? [focus[0] * 1000 - R, focus[1] * 1000 - R, R * 2, R * 2] : null; };
  function vioLabel(id, i, r, on) { let e = VLAB[id]; if (!e) { e = VLAB[id] = document.createElement('span'); e.className = 'h-vio h-mono'; e.textContent = '✕ 0' + (i + 1) + ' ' + w('wall.' + id + '.s'); el('dl').appendChild(e); }   /* i18n-ok: a mark and a number */
    e.classList.toggle('on', !!on); if (on) { e.style.left = Math.max(0, r[0]) / 10 + '%'; e.style.top = Math.max(0, r[1]) / 10 + '%'; } }
  /* the status strip under the square: where the pointer is, how many walls the checks found, and who signed off */
  const pad4 = v => String(Math.max(0, Math.min(1000, Math.round(v * 1000)))).padStart(4, '0');
  function statusStrip() { setCap(w('chk.xy', { x: pad4(focus[0]), y: pad4(focus[1]) }), w('chk.found', { n: Object.keys(FOUND4).length, of: WALLS.length }) + ' · ' + w(M.kept ? 'chk.signed' : 'chk.unsigned')); }
  /* the wires across the middle, as on a chip: from what the words are about, straight across and at right angles, to
     where it is on the square. A wall's own wire is red; what people are trying against it runs as a change order,
     solid when in products, dashed in a lab, dotted when still a guess; a part of your machine to its block; a place on
     the island to its pad. On a desktop wide enough, never on a phone */
  const wcv = el('wires'), wc = wcv.getContext('2d');
  function wiresOf() {
    const out = [], st = id => el('s-' + id), mid = r => (r.top + r.bottom) / 2;
    const wl = WALLS.find(x => x.id === scene);
    if (wl) { const s0 = st(wl.id), r = wl.id === 'switch' ? loupeBox() : VIO[wl.id]; if (!s0 || !r || !(FOUND4[wl.id] || (SCAN.k === wl.id && SCAN.y > r[1]))) return out;
      const h2 = s0.querySelector('h2'); out.push({ s0, y: mid(h2.getBoundingClientRect()), t: [r[0], r[1] + Math.min(r[3] / 2, 90)], col: RED, w: 2.4 });
      s0.querySelectorAll('.h-way').forEach((b, i) => { const cvb = b.querySelector('canvas'), stt = wl.ways[i][1], sp = specs.find(x => x.cv === cvb);
        out.push({ s0, y: mid(cvb.getBoundingClientRect()), t: [r[0], r[1] + Math.min(r[3] - 20, 140 + i * 60)], col: ink, w: sp && sp.hot ? 2 : 1.3, dash: stt === 'product' ? [] : stt === 'lab' ? [7, 5] : [2, 5], hot: sp && sp.hot }); }); }
    else if (scene === 'next') { const s0 = st('next'), b = el('nbtn'); if (s0 && b) out.push({ s0, y: mid(b.getBoundingClientRect()), t: NXPT, col: RED, w: 2.2 }); }
    else if (scene === 'arch') { const s0 = st('arch'), o = el('a-z'); if (s0 && o) out.push({ s0, y: mid(o.getBoundingClientRect()), t: [110, 500], col: ink, w: 1.6 }); }
    else if (scene === 'machine') { const s0 = st('machine'), n = needNow(), R = rectsOf(n), miss = missOf(n, formOf);
      el('parts').querySelectorAll('.h-part').forEach((p, i) => out.push({ s0, y: mid(p.getBoundingClientRect()), t: [R[i][0], R[i][1] + R[i][3] / 2], col: miss.includes(n.parts[i][0]) ? RED : ink, w: 1.5 })); }
    else if (scene === 'island') { const s0 = st('island');
      el('trail').querySelectorAll('a').forEach((a2, i) => { const p = LOOP[i]; if (p) out.push({ s0, y: mid(a2.getBoundingClientRect()), t: [p[2] - 36, p[3]], col: ROWS[i] && ROWS[i][5] ? RED : ink, w: ROWS[i] && ROWS[i][5] ? 2 : 1.3, hot: hotPlace === p[1] }); }); }
    return out;
  }
  function drawWires() {
    const on = !phone && innerWidth >= 1100 && scene !== 'hero', W = innerWidth, H = innerHeight;
    if (wcv.width !== Math.round(W * DPR) || wcv.height !== Math.round(H * DPR)) { wcv.width = Math.round(W * DPR); wcv.height = Math.round(H * DPR); }
    wc.setTransform(DPR, 0, 0, DPR, 0, 0); wc.clearRect(0, 0, W, H); if (!on) return;
    const a = A[scene] || 0; if (a < .05) return;
    const wr = wrap.getBoundingClientRect(), X = u => wr.left + u / 1000 * wr.width, Y = u => wr.top + u / 1000 * wr.height, top = 84, L = wiresOf(), n = L.length;
    wc.lineJoin = 'miter'; wc.lineCap = 'butt';
    L.forEach((q, i) => { if (q.y < top || q.y > H - 8) return;
      const sx = q.s0.getBoundingClientRect().left + q.s0.clientWidth + 12, ex = wr.left - 16, tx = X(q.t[0]), ty = Math.max(wr.top + 4, Math.min(wr.bottom - 4, Y(q.t[1])));
      if (ex - sx < 16) return;
      const mx = Math.round(sx + (ex - sx) * (n > 1 ? .25 + .5 * i / (n - 1) : .5)) + .5, pts = [[sx, q.y], [mx, q.y], [mx, ty], [ex, ty], [tx, ty]];
      wc.globalAlpha = a * (q.hot ? 1 : .85); wc.strokeStyle = q.col; wc.lineWidth = q.w; wc.setLineDash(q.dash || []); wc.beginPath(); pts.forEach((p, j) => (j ? wc.lineTo(p[0], p[1]) : wc.moveTo(p[0], p[1]))); wc.stroke(); wc.setLineDash([]);
      /* a pad where it leaves the words, one where it enters the chip, a via where it lands */
      wc.fillStyle = paper; wc.fillRect(sx - 4, q.y - 4, 8, 8); wc.strokeStyle = q.col; wc.lineWidth = 1.5; wc.strokeRect(sx - 4, q.y - 4, 8, 8);
      wc.fillStyle = paper; wc.fillRect(ex - 5, ty - 5, 10, 10); wc.strokeRect(ex - 5, ty - 5, 10, 10); wc.fillStyle = q.col; wc.fillRect(ex - 2, ty - 2, 4, 4);
      wc.fillRect(tx - 3.5, ty - 3.5, 7, 7);
      /* what flows along it */
      if (!reduce()) { const seg = pts.slice(1).map((p, j) => Math.abs(p[0] - pts[j][0]) + Math.abs(p[1] - pts[j][1])), len = seg.reduce((s2, v) => s2 + v, 0), sp = q.hot ? 220 : 120;
        for (let k = 0; k < Math.max(1, Math.round(len / 260)); k++) { let d0 = ((now / 1000 * sp + k * 260 + i * 70) % len), j = 0; while (j < seg.length - 1 && d0 > seg[j]) { d0 -= seg[j]; j++; } const p = pts[j], p2 = pts[j + 1], f = d0 / (seg[j] || 1);
          wc.fillStyle = q.col === RED ? RED : HI; wc.globalAlpha = a; wc.fillRect(p[0] + (p2[0] - p[0]) * f - 3, p[1] + (p2[1] - p[1]) * f - 3, 6, 6); } }
      wc.globalAlpha = 1; });
  }
  function paintScenes(T, dt) {
    const P = die.width, u = P / 1000, c = dc;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = BG; c.fillRect(0, 0, P, P);
    const fa = A.hero + A.switch + .5 * A.memory + .38 * A.power + .3 * A.cost;
    if (fa > .01) { c.globalAlpha = Math.min(1, fa); c.drawImage(floor, 0, 0); c.globalAlpha = 1; }
    if (A.hero > .01) sparks(c, P, 70, A.hero);
    if (A.switch > .01) sparks(c, P, Math.min(5200, Math.round(70 * Math.pow(10, W4.switch.n * .38))), A.switch);
    c.setTransform(u, 0, 0, u, 0, 0); c.lineJoin = 'miter';
    if (A.memory > .01) { const a = A.memory, m4 = W4.memory; m4.pos += (m4.sel - m4.pos) * Math.min(1, dt * 5);
      const Lr = [540, 560, 380, 340], far = [80, 90, 330, 250], near = [540, 250, 380, 250], k = Math.min(1, m4.pos), k2 = Math.max(0, m4.pos - 1);
      const Mr = [lerp(far[0], near[0], k), lerp(far[1], near[1], k) + k2 * 330, lerp(far[2], near[2], k) - k2 * 40, lerp(far[3], near[3], k) - k2 * 20];
      c.globalAlpha = a; if (k < .5) { c.setLineDash([8, 8]); c.strokeStyle = fg(.5); c.lineWidth = 1.5; c.strokeRect(far[0] - 30, far[1] - 30, far[2] + 60, far[3] + 60); c.setLineDash([]); }
      c.fillStyle = bg(.82); c.fillRect(...Lr); c.strokeStyle = ink; c.lineWidth = 2.5; c.strokeRect(...Lr);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { c.fillStyle = k2 > .5 && (i + j) % 2 ? RED : fg(.16); c.fillRect(Lr[0] + 24 + i * 70, Lr[1] + 30 + j * 76, 52, 52); }
      if (k2 < .9) { c.globalAlpha = a * (1 - k2); c.fillStyle = bg(.82); c.fillRect(...Mr); c.strokeStyle = ink; c.strokeRect(...Mr); c.fillStyle = fg(.3); for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) c.fillRect(Mr[0] + 18 + i * (Mr[2] - 36) / 9, Mr[1] + 18 + j * (Mr[3] - 36) / 6, (Mr[2] - 36) / 9 - 6, (Mr[3] - 36) / 6 - 6);
        /* the trip a number makes, there and back */
        const p0 = [Mr[0] + Mr[2] / 2, Mr[1] + Mr[3]], p2 = [Lr[0] + Lr[2] / 2, Lr[1]], p1 = [p2[0], p0[1]], l1 = Math.abs(p1[0] - p0[0]), l2 = Math.abs(p2[1] - p1[1]), len = l1 + l2;
        VIO.memory = len > 8 && k2 < .5 ? [Math.min(p0[0], p1[0]) - 26, Math.min(p0[1], p2[1]) - 26, Math.abs(p1[0] - p0[0]) + 52, Math.abs(p2[1] - p0[1]) + 52] : null;
        if (len > 8) { c.strokeStyle = RED; c.lineWidth = 3; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.lineTo(...p2); c.stroke();
          const at = s => (s < l1 ? [p0[0] + (p1[0] - p0[0]) * s / (l1 || 1), p0[1]] : [p1[0], p1[1] + (p2[1] - p1[1]) * (s - l1) / (l2 || 1)]); c.fillStyle = HI;
          for (let i = 0; i < Math.max(1, Math.round(len / 150)); i++) { const s = ((T * 260 + i * 150) % len), q = at(s); c.fillRect(q[0] - 7, q[1] - 7, 14, 14); } } }
      if (k2 >= .9) VIO.memory = null;
      c.globalAlpha = 1; lab('mem', Mr[0] + 6, Mr[1] - 26, k2 < .5); lab('logic', Lr[0] + 6, Lr[1] + Lr[3] + 10, true); }
    if (A.power > .01) { const a = A.power, p4 = W4.power, sc = v => 940 * Math.sqrt(v / 1250); p4.rv += ((p4.shown ? 1 : 0) - p4.rv) * Math.min(1, dt * 3);
      c.globalAlpha = a; const s0 = sc(485), sg = sc(p4.guess), s9 = sc(950);
      if (p4.rv > .01) { const s = lerp(s0, s9, p4.rv * p4.rv * (3 - 2 * p4.rv)); c.fillStyle = 'rgba(229,64,26,' + (.28 * p4.rv) + ')'; c.fillRect(30, 970 - s, s, s); c.strokeStyle = RED; c.lineWidth = 5; c.strokeRect(30, 970 - s, s, s); }
      c.fillStyle = fg(.16); c.fillRect(30, 970 - s0, s0, s0); c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(30, 970 - s0, s0, s0);
      VIO.power = p4.shown ? [30, 970 - s9, s9, s9] : [30, 970 - sg, sg, sg];
      c.setLineDash([10, 8]); c.strokeStyle = ink; c.lineWidth = 2.5; c.strokeRect(30, 970 - sg, sg, sg); c.setLineDash([]);
      c.globalAlpha = 1; lab('pnow', 44, 970 - s0 + 14, true); lab('pguess', 30 + sg - 6, 970 - sg - 28, !p4.shown, 'right'); lab('p2030', 30 + s9 - 6, 970 - s9 - 28, p4.shown, 'r right'); }
    if (A.cost > .01) { const a = A.cost, c4 = W4.cost; c4.f += (c4.open - c4.f) * Math.min(1, dt * 3.5);
      if (c4.f < .99) { c.globalAlpha = a * (1 - c4.f); COST.forEach((k, i) => { const s = 940 * Math.sqrt(k[1] / 725), last = i === 5; if (!i) { c.fillStyle = ink; c.fillRect(30, 970 - s, s, s); } c.strokeStyle = last ? RED : ink; c.lineWidth = last ? 5 : 2; c.strokeRect(30, 970 - s, s, s); }); }
      if (c4.f > .01) { c.save(); c.globalAlpha = a * c4.f; c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); c.rect(P * .03, P * .03, P * .94 * Math.min(1, c4.f * 1.02), P * .94); c.clip(); c.translate(P * .03, P * .03); c.scale(dots.k, dots.k); c.fillStyle = dots.pat; c.fillRect(0, 0, P * .94 / dots.k, P * .94 / dots.k); c.restore(); c.setTransform(u, 0, 0, u, 0, 0); c.strokeStyle = RED; c.lineWidth = 5; c.globalAlpha = a * c4.f; c.strokeRect(30, 30, 940, 940); }
      VIO.cost = [30, 30, 940, 940];
      c.globalAlpha = 1; lab('c1', 44, 44, c4.f < .5, 'r'); }
    drawChecks(c, dt);
    if (A.next > .01) paintNext(c, T, dt, A.next);
    if (A.arch > .01) paintArch(c, T, dt, A.arch);
    if (A.machine > .01 || A.island > .01) { isleT = scene === 'island' ? Math.min(1, isleT + dt / 1.5) : Math.max(0, isleT - dt * 2);
      const e = isleT * isleT * (3 - 2 * isleT), a = Math.max(A.machine, A.island), sc = lerp(1, .24, e), tx = lerp(0, 380, e), ty = lerp(0, 380, e);
      if (A.island > .01) paintLoop(c, T, A.island, ss(.3, 1, isleT));
      c.save(); c.translate(tx, ty); c.scale(sc, sc); c.globalAlpha = a; paintMachine(c, T, dt, e); c.restore(); c.globalAlpha = 1; }
  }
  function paintMachine(c, T, dt, e) {
    const n = needNow(), R = rectsOf(n); let f = formOf;
    if (M.agentT > 0) { M.agentT -= dt; const cand = M.cand[Math.floor(T * 22) % M.cand.length]; f = p => (STOCK.includes(p[1]) ? 'circuit' : cand[p[0]]); if (M.agentT <= 0) { setPlan(M.best); drawMachineUI(); } }
    const miss = missOf(n, f);
    c.fillStyle = BG; c.fillRect(0, 0, 1000, 1000); c.setLineDash([12, 9]); c.strokeStyle = e > .5 ? RED : fg(.5); c.lineWidth = e > .5 ? 14 : 2; c.strokeRect(22, 22, 956, 956); c.setLineDash([]);
    /* what flows between the blocks */
    c.strokeStyle = fg(.4); c.lineWidth = 2; const ctr = i => [R[i][0] + R[i][2] / 2, R[i][1] + R[i][3] / 2];
    n.wires.forEach(([a, b]) => { const p = ctr(a), q = ctr(b); c.beginPath(); c.moveTo(...p); c.lineTo(...q); c.stroke(); });
    n.parts.forEach((p, i) => { const [x, y, ww, h] = R[i], fm = f(p), stock = STOCK.includes(p[1]), bad = miss.includes(p[0]);
      c.fillStyle = BG; c.fillRect(x, y, ww, h);
      if (stock) { c.strokeStyle = fg(.75); c.lineWidth = 2; c.strokeRect(x, y, ww, h); c.save(); c.beginPath(); c.rect(x, y, ww, h); c.clip(); c.strokeStyle = fg(.14); c.beginPath(); for (let q = -h; q < ww; q += 16) { c.moveTo(x + q, y + h); c.lineTo(x + q + h, y); } c.stroke(); c.restore(); }
      else if (fm === 'circuit') { c.fillStyle = ink; c.fillRect(x, y, ww, h); for (let q = 18; q < ww - 10; q += 26) { c.fillRect(x + q, y - 12, 10, 12); c.fillRect(x + q, y + h, 10, 12); } c.fillStyle = bg(.14); for (let q = 70; q < h - 20; q += 22) c.fillRect(x + 20, y + q, ww - 40, 8); }
      else if (fm === 'software') { c.setLineDash([9, 7]); c.strokeStyle = ink; c.lineWidth = 2.5; c.strokeRect(x, y, ww, h); c.setLineDash([]); c.fillStyle = fg(.55); let li = 0; for (let q = 76; q < h - 24; q += 26, li++) { const ind = [0, 1, 2, 1, 1, 0, 1, 2, 2, 1][li % 10] * 26, ln = (ww - 60 - ind) * (.35 + .6 * rnd(mix(li, i * 31 + 5))); c.fillRect(x + 24 + ind, y + q, ln, 7); if (!reduce() && Math.floor(T * 5 + i) % 14 === li % 14) { c.fillStyle = RED; c.fillRect(x + 24 + ind, y + q, ln, 7); c.fillStyle = fg(.55); } } }
      else { c.strokeStyle = ink; c.lineWidth = 2.5; c.strokeRect(x, y, ww, h); const g = 34, tick = Math.floor(T * 1.6); for (let yy = y + 70; yy + 20 < y + h - 12; yy += g) for (let xx = x + 20; xx + 20 < x + ww - 12; xx += g) { const on = rnd(mix((xx * 7 + yy) | 0, tick + i)) < .33; c.strokeStyle = on ? RED : fg(.5); c.lineWidth = on ? 3.5 : 1.5; c.beginPath(); c.moveTo(xx, yy + 10); c.lineTo(xx + 20, on ? yy + 10 : yy); c.stroke(); c.fillStyle = fg(.7); c.fillRect(xx - 2.5, yy + 7.5, 5, 5); } }
      if (n.change.includes(p[0])) { c.strokeStyle = RED; c.lineWidth = bad ? 9 + 3 * Math.sin(T * 6) : 4; c.strokeRect(x - 7, y - 7, ww + 14, h + 14); if (bad) { c.beginPath(); c.moveTo(x + ww - 60, y + 22); c.lineTo(x + ww - 22, y + 60); c.moveTo(x + ww - 22, y + 22); c.lineTo(x + ww - 60, y + 60); c.stroke(); } } });
    if (!reduce()) n.wires.forEach(([a, b], wi) => { const p = ctr(a), q = ctr(b), k = (T * .7 + wi * .31) % 1; c.fillStyle = RED; c.fillRect(p[0] + (q[0] - p[0]) * k - 7, p[1] + (q[1] - p[1]) * k - 7, 14, 14); });
  }
  /* one wire: out of your machine, round the six stages of a chip's life, and back to what is open. A pad is lit when
     you have already done something there on this page */
  const TRACK = [[500, 380], [500, 150], [850, 150], [850, 850], [150, 850], [150, 150], [500, 150]];
  let ROWS = [];
  function paintLoop(c, T, a, e) {
    const seg = TRACK.slice(1).map((q, i) => Math.abs(q[0] - TRACK[i][0]) + Math.abs(q[1] - TRACK[i][1])), tot = seg.reduce((s, v) => s + v, 0);
    const part = (s0, s1) => { c.beginPath(); let acc = 0; for (let i = 0; i < seg.length; i++) { const a0 = acc; acc += seg[i]; if (s1 <= a0 || s0 >= acc) continue; const p = TRACK[i], q = TRACK[i + 1], f0 = Math.max(0, (s0 - a0) / seg[i]), f1 = Math.min(1, (s1 - a0) / seg[i]); c.moveTo(p[0] + (q[0] - p[0]) * f0, p[1] + (q[1] - p[1]) * f0); c.lineTo(p[0] + (q[0] - p[0]) * f1, p[1] + (q[1] - p[1]) * f1); } c.stroke(); };
    c.globalAlpha = a; c.lineCap = 'square'; c.lineJoin = 'miter';
    c.strokeStyle = fg(.1); c.lineWidth = 34; part(0, tot * e);
    c.strokeStyle = ink; c.lineWidth = 2.5; part(0, tot * e);
    if (e >= 1) { c.fillStyle = ink; for (const [x, y, r] of [[675, 150, 0], [850, 500, 1], [675, 850, 2], [325, 850, 2], [150, 500, 3], [325, 150, 0]]) { c.save(); c.translate(x, y); c.rotate(r * Math.PI / 2); c.beginPath(); c.moveTo(11, 0); c.lineTo(-7, -9); c.lineTo(-7, 9); c.fill(); c.restore(); }
      if (!reduce()) { const s = seg[0] + ((T * 190) % (tot - seg[0])); c.strokeStyle = RED; c.lineWidth = 7; c.lineCap = 'butt'; part(Math.max(seg[0], s - 110), s); } }
    LOOP.forEach((p, i) => { const row = ROWS[i] || [], done = row[5], hot = hotPlace === p[1], s = hot ? 36 : 28, pa = ss(i / 7, i / 7 + .2, e); if (pa <= 0) return;
      c.globalAlpha = a * pa; c.fillStyle = done ? RED : BG; c.fillRect(p[2] - s, p[3] - s, 2 * s, 2 * s); c.strokeStyle = done ? RED : ink; c.lineWidth = hot ? 5 : 2.5; c.setLineDash(done ? [] : [7, 6]); c.strokeRect(p[2] - s, p[3] - s, 2 * s, 2 * s); c.setLineDash([]);
      if (done) { c.fillStyle = ink; c.fillRect(p[2] - 9, p[3] - 9, 18, 18); } });
    c.globalAlpha = 1;
  }
  /* words over the square: placed by the picture, written in the words */
  const LABS = {};
  function lab(id, x, y, on, k) { let e = LABS[id]; if (!e) { e = LABS[id] = document.createElement('span'); e.innerHTML = w('s.' + id); el('dl').appendChild(e); }
    const sc = { mem: 'memory', logic: 'memory', pnow: 'power', pguess: 'power', p2030: 'power', c1: 'cost' }[id];
    e.className = 'h-sl h-s-' + sc + (k ? ' ' + k.split(' ').map(x2 => 'h-' + x2).join(' ') : ''); e.style.left = x / 10 + '%'; e.style.top = y / 10 + '%'; e.style.visibility = on ? '' : 'hidden';
    e.style.transform = k && k.includes('right') ? 'translateX(-100%)' : ''; }

  /* ============ the steps beside it ============ */
  let built = false, specs = [], io = null;
  const nextBtn = (to, what) => '<button type="button" class="h-next h-mono" data-go="' + to + '">' + w('next', { what }) + '</button>';
  const WT = {};
  const wallTried = id => { WT[id] = 1; if (WALLS.every(x => WT[x.id])) done('walls'); };
  function buildSteps() {
    if (built) return; built = true;
    const wallW = {
      switch: '<input type="range" id="hd-w-sw" min="0" max="5" step="1" value="0" aria-label="' + esc(w('w.switch.q')) + '"><div class="h-ticks h-mono"><span>' + w('w.switch.lo') + '</span><span>' + w('w.switch.hi') + '</span></div>',
      memory: '<div class="h-seg" id="hd-w-mem">' + ['a', 'b', 'c'].map((k, i) => '<button type="button" data-i="' + i + '" class="' + (i ? '' : 'on') + '">' + w('w.memory.' + k) + '</button>').join('') + '</div>',
      power: '<input type="range" id="hd-w-pw" min="300" max="1250" step="5" value="485" aria-label="' + esc(w('w.power.q')) + '"><div class="h-ticks h-mono"><span id="hd-w-pwv"></span><button type="button" class="h-btn" id="hd-w-pwb">' + w('w.power.reveal') + '</button></div>',
      cost: '<div class="h-seg" id="hd-w-co">' + ['a', 'b'].map((k, i) => '<button type="button" data-i="' + i + '" class="' + (i ? '' : 'on') + '">' + w('w.cost.' + k) + '</button>').join('') + '</div>'
    };
    let h = '';
    h += WALLS.map((wl, i) => '<section class="h-step" id="hd-s-' + wl.id + '" data-scene="' + wl.id + '">' +
      '<div class="h-n h-mono"><i></i>' + w('walls.n', { n: i + 1 }) + '</div><h2 class="h-anton">' + w('wall.' + wl.id + '.t') + '</h2>' +
      '<p class="h-d">' + w('wall.' + wl.id + '.d') + ' ' + (wl.facts.length ? src(...wl.facts) : '<span class="h-src h-phys">' + w('wall.switch.phys') + '</span>') + '</p>' +
      '<div class="h-box"><div class="h-bk h-mono"><i></i>' + w('try.k') + '</div><p class="h-bq">' + w('w.' + wl.id + '.q') + '</p>' + wallW[wl.id] + '<p class="h-out" id="hd-o-' + wl.id + '"></p><a class="h-lnk" href="' + wl.lab + '">' + w('play') + ': ' + w('w.' + wl.id + '.lab') + '</a></div>' +
      '<div class="h-cq"><span class="h-mono">' + w('q.label') + '</span><p>' + Q(wl.q) + '</p><a class="h-lnk" href="' + wl.meet + '">' + w('q.meet') + '</a></div>' +
      (wl.ways.length ? '<div class="h-ways"><span class="h-mono">' + w('ways.k') + '</span>' + wl.ways.map(([id, st, href, facts]) => '<div class="h-way"><canvas data-bet="' + id + '"></canvas><div><h3>' + bet(id, 't') + '<span class="h-st h-' + st + '"><i></i>' + w('status.' + st) + '</span></h3><p>' + bet(id, 'd') + '</p><div class="h-ft">' + (facts.length ? src(...facts) : '') + '<a class="h-lnk" href="' + href + '">' + w('way.try') + '</a></div></div></div>').join('') + '</div>' : '') +
      (i < WALLS.length - 1 ? nextBtn('hd-s-' + WALLS[i + 1].id, w('wall.' + WALLS[i + 1].id + '.s')) : nextBtn('hd-s-next', w('tab.next'))) +
      '</section>').join('');
    h += '<section class="h-step" id="hd-s-next" data-scene="next"><div class="h-n h-mono"><i></i>' + w('next.n') + '</div><h2 class="h-anton">' + w('next.h') + '</h2><p class="h-d">' + w('next.d') + ' ' + src('energy-moving-data', 'landauer-measured') + '</p>' +
      '<div class="h-box"><div class="h-bk h-mono"><i></i>' + w('try.k') + '</div><p class="h-bq">' + w('next.q') + '</p>' +
      '<div class="h-nhold"><button type="button" class="h-holdbtn h-nbtn" id="hd-nbtn"><span>' + w('btn') + '</span></button><div class="h-nread"><span class="h-big" id="hd-nnum">×1</span><span class="h-mono h-st0" id="hd-nunit"></span></div></div>' +
      '<p class="h-out" id="hd-nout"></p></div>' +
      '<div class="h-cq" id="hd-ncq" hidden><span class="h-mono">' + w('q.label') + '</span><p>' + Q('sutton') + '</p><a class="h-lnk" href="#/machines">' + w('q.meet') + '</a></div>' +
      nextBtn('hd-s-arch', w('tab.arch')) + '</section>';
    h += '<section class="h-step" id="hd-s-arch" data-scene="arch"><div class="h-n h-mono"><i></i>' + w('arch.n') + '</div><h2 class="h-anton">' + w('arch.h') + '</h2><p class="h-d">' + w('arch.d') + '</p>' +
      '<div class="h-box"><div class="h-bk h-mono"><i></i>' + w('try.k') + '</div><p class="h-bq">' + w('arch.q1') + '</p>' +
      '<input type="range" id="hd-a-z" min="0" max="3" step="0.01" value="0" aria-label="' + esc(w('arch.q1')) + '"><div class="h-ticks h-mono">' + [3, 2, 1, 0].map(k => '<span>' + w('lv.' + k) + '</span>').join('') + '</div>' +
      '<p class="h-bq" style="margin-top:18px">' + w('arch.q2') + '</p><div class="h-seg h-asel" id="hd-a-sel">' + ARR.map((r, i) => '<button type="button" data-i="' + i + '" class="' + (i ? '' : 'on') + '">' + w('arr.' + r[0] + '.b') + '</button>').join('') + '</div>' +
      '<p class="h-out" id="hd-o-arch"></p></div>' +
      '<div class="h-box"><div class="h-bk h-mono"><i></i>' + w('era.k') + '</div><p class="h-bq">' + w('arch.q3') + '</p><div class="h-seg h-asel" id="hd-a-era">' + ERAS.map((r, i) => '<button type="button" data-i="' + i + '">' + w('era.' + r[0] + '.b') + '<small>' + r[1] + '</small></button>').join('') + '</div>' +
      '<p class="h-out" id="hd-o-era"></p></div>' +
      '<div class="h-box h-chal"><div class="h-bk h-mono"><i></i>' + w('arch.ch.k') + '</div><p class="h-bq">' + w('arch.ch.q') + '</p><p class="h-out" id="hd-a-ch"></p></div>' +
      '<div class="h-cq" id="hd-a-cq" hidden><span class="h-mono">' + w('q.label') + '</span><p>' + Q('copy') + '</p><a class="h-lnk" href="#/machines">' + w('q.meet') + '</a></div>' +
      nextBtn('hd-s-machine', w('tab.machine')) + '</section>';
    h += '<section class="h-step" id="hd-s-machine" data-scene="machine"><div class="h-n h-mono"><i></i>' + w('mach.n') + '</div><h2 class="h-anton">' + w('mach.h') + '</h2><p class="h-d">' + w('mach.d') + '</p>' +
      '<div class="h-needs" id="hd-needs">' + NEEDS.map(n => '<button type="button" class="h-need" data-need="' + n.id + '"><b>' + w('need.' + n.id + '.t') + '</b><span>' + w('need.' + n.id + '.d') + '</span></button>').join('') + '</div>' +
      '<p class="h-why" id="hd-why"></p><div class="h-parts" id="hd-parts"></div>' +
      '<div class="h-read"><span class="h-big" id="hd-m-e"></span><span><span class="h-mono h-st0">' + w('mach.energy') + '</span><br><span class="h-ok" id="hd-m-ok"></span></span></div>' +
      '<div class="h-tri"><div><span class="h-who h-mono">' + w('tri.gen.who') + '</span><span class="h-w">' + w('tri.gen') + '</span><p id="hd-m-gen">' + w('tri.gen.p') + '</p><button type="button" class="h-btn h-ghost" id="hd-m-agent">' + w('tri.gen.b') + '</button></div>' +
      '<div><span class="h-who h-mono">' + w('tri.chk.who') + '</span><span class="h-w">' + w('tri.chk') + '</span><p>' + w('tri.chk.p') + '</p></div>' +
      '<div><span class="h-who h-mono">' + w('tri.dec.who') + '</span><span class="h-w h-redw">' + w('tri.dec') + '</span><p id="hd-m-dec">' + w('tri.dec.p') + '</p><button type="button" class="h-btn h-red" id="hd-m-keep">' + w('tri.dec.b') + '</button></div></div>' +
      '<div class="h-cq"><span class="h-mono">' + w('q.label') + '</span><p>' + Q('human') + '</p></div>' +
      '<p class="h-fine">' + w('mach.fine') + ' ' + src('asic-vs-cpu', 'fpga-asic-gap') + '<br><a class="h-lnk" href="#/machines">' + w('mach.more') + '</a></p>' +
      nextBtn('hd-s-island', w('tab.island')) + '</section>';
    const R = ctx.record ? ctx.record() : null;
    h += '<section class="h-step" id="hd-s-island" data-scene="island"><div class="h-n h-mono"><i></i>' + w('isle.n') + '</div><h2 class="h-anton">' + w('isle.h') + '</h2><p class="h-d" id="hd-isle-d"></p>' +
      '<div class="h-trail" id="hd-trail"></div>' +
      (R ? '<div class="h-record h-mono">' + ['all', 'ai', 'program', 'example', 'person'].map(k => '<span class="' + (R[k] ? '' : 'h-zero') + '"><b>' + nf(R[k] || 0) + '</b>' + w('rec.' + k) + '</span>').join('') + '</div>' : '') +
      '<a class="h-enter" href="#/island" id="hd-enter"></a>' +
      '<div class="h-doors">' + [['build', '#/build/computer'], ['break', '#/build'], ['ask', '#/read']].map(([k, hr]) => '<a class="h-lnk" href="' + hr + '">' + w('door.' + k) + '</a>').join('') + '</div></section>';
    el('steps').innerHTML = h;
    el('foot').innerHTML = '<span>' + w('foot') + '</span>' + src(...FACT_IDS);
    /* the four walls: each answers on the square */
    const out = (id, html) => { el('o-' + id).innerHTML = html; };
    const sw = (ev) => { const n = +el('w-sw').value; W4.switch.n = n; if (ev) wallTried('switch'); out('switch', n ? w('w.switch.out', { n: nf(Math.pow(10, n)), mv: n * 60 }) : w('w.switch.out0')); }; el('w-sw').oninput = sw; sw();
    const seg = (id, fn) => { el(id).onclick = e => { const b = e.target.closest('button'); if (!b) return; el(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(+b.dataset.i); }; };
    seg('w-mem', i => { W4.memory.sel = i; wallTried('memory'); out('memory', w('w.memory.o' + 'abc'[i]) + (i < 2 ? ' ' + src('energy-moving-data') : '')); }); out('memory', w('w.memory.oa') + ' ' + src('energy-moving-data'));
    seg('w-co', i => { W4.cost.open = i; wallTried('cost'); out('cost', w('w.cost.o' + 'ab'[i]) + ' ' + (i ? src('wafer-space-run', 'design-cost-2nm') : src('design-cost-older', 'design-cost-recent', 'design-cost-2nm'))); }); out('cost', w('w.cost.oa') + ' ' + src('design-cost-older', 'design-cost-recent', 'design-cost-2nm'));
    const pw = () => { const v = +el('w-pw').value; W4.power.guess = v; el('w-pwv').textContent = w('w.power.guess', { n: nf(v) }); if (W4.power.shown) out('power', w('w.power.out', { n: nf(v), verdict: w('w.power.' + (v < 855 ? 'low' : v > 1045 ? 'high' : 'near')) }) + ' ' + src('dc-electricity')); else out('power', ''); };
    el('w-pw').oninput = pw; el('w-pwb').onclick = () => { W4.power.shown = true; wallTried('power'); pw(); }; pw();
    el('a-z').oninput = () => { AR.zTo = 3 - +el('a-z').value; AR.era = -1; archOut(); };
    el('a-era').onclick = ev => { const b = ev.target.closest('button'); if (b) { AR.era = +b.dataset.i; AR.zTo = 0; archOut(); } };
    el('a-sel').onclick = ev => { const b = ev.target.closest('button'); if (b) { AR.sel = +b.dataset.i; AR.zTo = 0; AR.era = -1; archOut(); } };
    archOut();
    /* the second hold */
    el('nbtn').addEventListener('pointerdown', e => { e.preventDefault(); NX.hold = true; });
    el('nbtn').addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); NX.hold = true; } });
    el('nbtn').addEventListener('keyup', () => { NX.hold = false; });
    /* the machine */
    el('needs').onclick = e => { const b = e.target.closest('[data-need]'); if (!b) return; M.need = b.dataset.need; M.tried = null; M.kept = false; drawMachineUI(); };
    el('parts').onclick = e => { const b = e.target.closest('[data-part]'); if (!b) return; M.plan[M.need + '.' + b.dataset.part] = b.dataset.form; M.kept = false; drawMachineUI(); };
    el('m-agent').onclick = () => { agent(); M.kept = false; drawMachineUI(); };
    el('m-keep').onclick = () => { M.kept = true; done('keep'); drawMachineUI(); };
    drawMachineUI();
    el('trail').addEventListener('pointerover', e => { const a = e.target.closest('a'); hotPlace = a ? a.dataset.place : null; });
    el('trail').addEventListener('pointerleave', () => { hotPlace = null; });
    /* the living drawings */
    specs = [...root.querySelectorAll('canvas[data-bet]')].map(cv => ({ cv, c: cv.getContext('2d'), id: cv.dataset.bet, m: {}, vis: false, k: 0, hot: false }));
    io = new IntersectionObserver(es => es.forEach(e => { const s = specs.find(x => x.cv === e.target); if (s) s.vis = e.isIntersecting; }), { root: host, rootMargin: '80px' });
    specs.forEach(s => { io.observe(s.cv); const b = s.cv.closest('.h-way'); b.addEventListener('pointerenter', () => { s.hot = true; }); b.addEventListener('pointerleave', () => { s.hot = false; }); b.addEventListener('pointerdown', () => { s.hot = true; }); });
    /* the stages' names, over the square */
    LOOP.forEach((p, i) => { const s = document.createElement('span'), side = p[2] > 600 ? 'r' : p[2] < 400 ? 'l' : 'm'; s.className = 'h-pl h-s-island h-' + side; s.style.left = (p[2] + (side === 'r' ? -44 : side === 'l' ? 44 : 0)) / 10 + '%'; s.style.top = (p[3] + (side === 'm' ? (i ? -44 : 44) : 0)) / 10 + '%'; if (side === 'm' && i) s.classList.add('h-up'); if (!i) { s.className = 'h-pl h-s-island'; s.style.left = '52.6%'; }
      s.innerHTML = '<b>' + w('place.' + p[1]) + '</b><small>0' + (i + 1) + ' · ' + t('loop.stage.' + p[0]) + '</small>'; el('dl').appendChild(s); });
    { const s = document.createElement('span'); s.className = 'h-pl h-s-island h-m h-yours'; s.style.left = '50%'; s.style.top = '63.4%'; s.innerHTML = '<small>' + w('s.yours') + '</small>'; el('dl').appendChild(s); }
    el('steps').addEventListener('input', () => { if (!touchedWalls) { touchedWalls = true; drawMachineUI(); } });
    el('steps').addEventListener('click', ev => { if (ev.target.closest('.h-box') && !touchedWalls) { touchedWalls = true; drawMachineUI(); } });
  }
  function drawMachineUI() {
    const n = needNow(), R = rectsOf(n), miss = missOf(n, formOf), e = energyOf(n, formOf);
    el('needs').querySelectorAll('.h-need').forEach(b => b.classList.toggle('on', b.dataset.need === M.need));
    el('why').textContent = w('need.' + n.id + '.why');
    el('parts').innerHTML = n.parts.map(p => '<div class="h-part"><div class="h-pn">' + w('piece.' + p[0]) + (n.change.includes(p[0]) ? ' <span class="h-must h-mono">· ' + w('mach.must') + '</span>' : '') + '<small>' + w('blk.' + p[1]) + (STOCK.includes(p[1]) ? '' : ' · ' + w('form.' + formOf(p) + '.d')) + '</small></div>' +
      (STOCK.includes(p[1]) ? '<span class="h-stock h-mono">' + w('form.stock') + '</span>' : '<div class="h-seg">' + FORMS.map(f => '<button type="button" data-part="' + p[0] + '" data-form="' + f + '" class="' + (formOf(p) === f ? 'on' : '') + '">' + w('form.' + f) + '</button>').join('') + '</div>') + '</div>').join('');
    el('m-e').innerHTML = '<i>×</i>' + (e < 10 ? e.toFixed(1).replace(/\.0$/, '') : nf(Math.round(e)));
    el('m-ok').className = 'h-ok' + (miss.length ? ' h-bad' : ''); el('m-ok').textContent = miss.length ? w('mach.bad', { part: w('piece.' + miss[0]) }) : w('mach.ok');
    el('m-gen').textContent = M.tried ? w('tri.gen.done', M.tried) : w('tri.gen.p');
    el('m-keep').disabled = !!miss.length || M.kept; el('m-dec').textContent = M.kept ? w('tri.dec.done') : w('tri.dec.p');
    /* names on the blocks */
    el('dl').querySelectorAll('.h-ml').forEach(x => x.remove());
    n.parts.forEach((p, i) => { const s = document.createElement('span'), f = formOf(p), solid = !STOCK.includes(p[1]) && f === 'circuit'; s.className = 'h-ml h-sl h-s-machine' + (solid ? ' h-dk' : ''); s.style.left = (R[i][0] + 16) / 10 + '%'; s.style.top = (R[i][1] + 14) / 10 + '%'; s.style.maxWidth = (R[i][2] - 24) / 10 + '%'; s.innerHTML = w('piece.' + p[0]) + '<small>' + (STOCK.includes(p[1]) ? w('form.stock') : w('form.' + f)) + '</small>'; el('dl').appendChild(s); });
    /* the island, as what you did */
    ROWS = [['lab', 'open', w(M.kept ? 'tr.lab' : 'tr.lab.0'), w('tr.lab.go'), '#/machines/' + M.need, M.kept],
      ['studio', 'design', w(tried.job ? 'tr.studio' : 'tr.studio.0'), w('tr.studio.go'), '#/bench/need', !!tried.job],
      ['fab', 'make', w(tried.light ? 'tr.fab' : 'tr.fab.0'), w('tr.fab.go'), '#/line/print', !!tried.light],
      ['test', 'test', w(tried.bug ? 'tr.test' : 'tr.test.0'), w('tr.test.go'), '#/line/test', !!tried.bug],
      ['port', 'ship', w('tr.port'), w('tr.port.go'), '#/line/ship', false],
      ['datacentre', 'use', w(touchedWalls ? 'tr.datacentre' : 'tr.datacentre.0'), w('tr.datacentre.go'), '#/place/datacentre/0', touchedWalls]];
    el('trail').innerHTML = ROWS.map((r, i) => '<a href="' + r[4] + '" data-place="' + r[0] + '" class="' + (r[5] ? 'h-done' : '') + '"><i class="h-tk"></i><span class="h-tp">' + w('place.' + r[0]) + '<small>0' + (i + 1) + ' · ' + t('loop.stage.' + r[1]) + '</small></span><span class="h-tw">' + r[2] + '<b>' + r[3] + '</b></span></a>').join('');
    el('isle-d').textContent = w(M.kept ? 'isle.d' : 'isle.d0'); el('enter').textContent = w(M.kept ? 'isle.go' : 'isle.go0'); el('enter').href = M.kept ? '#/machines/' + M.need : '#/island';
  }
  function drawSpecimens(dt) {
    for (const s of specs) { if (!s.vis) continue; const ww = s.cv.clientWidth; if (!ww) continue; const P = Math.round(ww * DPR); if (s.cv.width !== P) { s.cv.width = s.cv.height = P; s.m = {}; }
      s.k += ((s.hot ? 1 : 0) - s.k) * Math.min(1, dt * 6); s.T = (s.T || 0) + dt * (reduce() ? 0 : 1) * (1 + s.k * 0.6);
      s.c.setTransform(DPR, 0, 0, DPR, 0, 0); s.c.clearRect(0, 0, ww, ww); SPEC[s.id](s.c, ww, s.T + 3, s.k, s.m); }
  }
  function whichScene() {
    let sc = 'hero'; const line = innerHeight * (phone ? .86 : .6);
    root.querySelectorAll('.h-step').forEach(s => { if (s.getBoundingClientRect().top < line) sc = s.dataset.scene; }); return sc;
  }

  /* ============ found by playing ============ */
  const eggs = {}; let eggEl = null, eggTm = 0, bitsTm = 0;
  function egg(id, href) { if (eggs[id]) return; eggs[id] = 1; if (!eggEl) { eggEl = document.createElement('div'); eggEl.className = 'h-egg'; eggEl.setAttribute('role', 'status'); root.appendChild(eggEl); eggEl.onclick = () => eggEl.classList.remove('on'); }
    eggEl.innerHTML = '<span class="h-mono">' + w('egg.k') + '</span>' + w('egg.' + id) + (href ? ' <a href="' + href + '">' + w('egg.' + id + '.go') + ' →</a>' : ''); eggEl.classList.add('on'); clearTimeout(eggTm); eggTm = setTimeout(() => eggEl.classList.remove('on'), 9000); }
  function flip(v) { bits = v === undefined ? !bits : v; egg('bits'); clearTimeout(bitsTm); bitsTm = setTimeout(() => { bits = null; }, 2600); }
  el('num').addEventListener('click', () => { pow = !pow; if (pow) egg('pow'); });

  /* ============ going somewhere on the page: a chapter, a moment, a year ============ */
  const goTo = id => { if (!id || id === 'hd-years') { goD(id ? Math.min(d, DWALL) : 0); return; } touch(); steps().then(() => requestAnimationFrame(() => { const e = host.querySelector('#' + id); if (e) e.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); })); };
  root.addEventListener('click', ev => { const b = ev.target.closest('[data-go],[data-era]'); if (!b || b.closest('#hd-rail [data-d],#hd-rail [data-ch]')) return;
    if (b.dataset.era !== undefined) { const [eid, ey] = ERAS[+b.dataset.era]; if (eid === 'clock' || eid === 'cores') setSer(eid === 'clock' ? 'hz' : 'cores', true); goD(dAt(ey + .5)); return; }
    goTo(b.dataset.go); railOpen(false); });

  /* the bit the transistor holds, large, beside it */
  const bitEl = document.createElement('span'); bitEl.className = 'h-tl h-bit'; el('dl').appendChild(bitEl);
  [['source', 29.6, 27.4], ['gate', 50, 22.2], ['drain', 70.4, 27.4]].forEach(([k, x, y]) => { const s = document.createElement('span'); s.className = 'h-tl'; s.style.left = x + '%'; s.style.top = y + '%'; s.textContent = w('t.' + k); el('dl').appendChild(s); });

  /* ============ every frame ============ */
  let last = 0;
  function frame(ts) {
    if (!live) return;
    const dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts; now = ts; const T = ts / 1000;
    press += ((holding ? 1 : 0) - press) * Math.min(1, dt * 14); thudT = Math.max(0, thudT - dt * 4);
    advance(dt);
    d = dOfS(Math.min(pos, YLEN)); atWall = pos >= WALL_S - 1; CV.maxD = Math.max(CV.maxD, d);
    if (CV.guess && CV.maxD >= DWALL - 1e-6 && !DONE.guess) { done('guess'); CV.msg = 'guess'; }
    if (!touched && document.documentElement.dataset.preload) { loadFacts(); steps(); }
    cls('wall', d >= DWALL - 1e-6);
    const m = momentAt(d); if (m !== mom) { mom = m; said = ''; cls('moment', !!m); }
    const sc = whichScene(); if (sc !== scene) scene = sc;
    railNow();
    wrap.dataset.scene = scene === 'hero' ? (d < .2 ? 'gate' : 'hero') : scene;
    for (const k in A) A[k] += ((k === scene ? 1 : 0) - A[k]) * Math.min(1, dt * 6);
    const shake = reduce() || scene !== 'hero' ? 0 : phase() === 'wall' && holding ? push * 5 : Math.max(thudT * 3, phase() === 'pay' && holding ? (1 - vel / VMAX) * 2.2 : 0);
    /* nobody is steering the glass: let it wander, so the parts are seen */
    if (holding && now - lastMoveT > 2500 && !reduce()) focusTo = [.5 + .37 * Math.sin(T * .42), .5 + .35 * Math.sin(T * .58 + 1)];
    die.style.transform = shake ? 'translate(' + ((Math.random() - .5) * shake) + 'px,' + ((Math.random() - .5) * shake) + 'px)' : '';
    if (scene === 'hero') { drawHeroDie(); drawLoupe(ss(7.6, 9.4, d)); for (const k in VLAB) VLAB[k].classList.remove('on'); }
    else { paintScenes(T, dt); const dotsOn = scene === 'cost' && W4.cost.f > .6; drawLoupe(A.switch > .5 || dotsOn ? 1 : 0, { leak: scene === 'switch' ? W4.switch.n / 5 : 0, dots: dotsOn }); }
    if (built) advanceNext(dt);
    if (scene !== 'hero') statusStrip();
    count(); say(); chartQ(); if (pos < YLEN + innerHeight) paintChart(dt); drawSpecimens(dt); drawWires();
    raf = requestAnimationFrame(frame);
  }

  /* ============ the finger ============ */
  const setHold = v => { holding = v; cls('holding', v); if (v) touch(); };
  const dieXY = e => { const r = wrap.getBoundingClientRect(), k = v => Math.min(1, Math.max(0, v)); return [k((e.clientX - r.left) / r.width), k((e.clientY - r.top) / r.height)]; };
  function down(e) {
    const onDie = e.target.closest('.h-diewrap'), onBtn = e.target.closest('.h-holdbtn');
    if (!onBtn && e.target.closest('a,button,input,canvas#hd-cv,.h-moment,.h-cq2,.h-egg,.h-num')) return;
    if (scene === 'machine' && onDie) { const [x, y] = dieXY(e), n = needNow(), R = rectsOf(n), i = R.findIndex(r => x * 1000 >= r[0] && x * 1000 <= r[0] + r[2] && y * 1000 >= r[1] && y * 1000 <= r[1] + r[3]);
      if (i >= 0 && !STOCK.includes(n.parts[i][1])) { const p = n.parts[i]; M.plan[M.need + '.' + p[0]] = FORMS[(FORMS.indexOf(formOf(p)) + 1) % 3]; M.kept = false; drawMachineUI(); } return; }
    if (scene === 'next' && onDie) { NX.hold = true; return; }
    if (scene === 'arch' && onDie) { if (AR.zTo > .5) AR.zTo = Math.round(AR.zTo) - 1; else if (AR.era >= 0) AR.era = (AR.era + 1) % ERAS.length; else AR.sel = (AR.sel + 1) % ARR.length; archOut(); return; }
    if (scene === 'island' && onDie) { const [x, y] = dieXY(e), i = LOOP.findIndex(p => Math.abs(x * 1000 - p[2]) < 80 && Math.abs(y * 1000 - p[3]) < 80); if (i >= 0 && ROWS[i]) location.hash = ROWS[i][4]; return; }
    if (onDie) { focusTo = dieXY(e); lastMoveT = now; if (now - lastTap < 320 && d > 8) flip(); lastTap = now; }
    if (scene !== 'hero') return;
    if (e.pointerType === 'touch' && !onDie && !onBtn) return;
    if (pos > YLEN) return;
    setHold(true);
  }
  el('hero').addEventListener('pointerdown', down); wrap.addEventListener('pointerdown', down);
  wrap.addEventListener('pointermove', e => { focusTo = dieXY(e); lastMoveT = now; });
  const up = () => { setHold(false); NX.hold = false; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up); addEventListener('blur', up);
  el('hero').addEventListener('contextmenu', e => e.preventDefault()); wrap.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => {
    if (!live || (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]'))) return;
    if ((e.key === '0' || e.key === '1') && d > 8 && !e.ctrlKey && !e.metaKey) { flip(e.key === '1'); return; }
    if (e.code === 'Space' && pos <= YLEN && !(e.target.closest && e.target.closest('a,button:not(.h-holdbtn),[role=dialog]'))) { e.preventDefault(); if (e.repeat) return; setHold(true); } });   // i18n-ok: selectors
  addEventListener('keyup', e => { if (e.code === 'Space') setHold(false); });
  el('again').addEventListener('click', () => goD(0));
  el('skip').addEventListener('click', () => goTo('hd-s-switch'));
  addEventListener('resize', () => { if (live) { sizeDie(); layoutYears(); host.scrollTop = Math.round(y0 + pos); } });
  /* for checks: set(20) jumps to that many doublings; 99 to the wall */
  function set(v) { loadFacts(); touch(); goD(Math.min(DWALL, v), true); d = dOfS(pos); mom = null; cls('moment', false); said = ''; }
  window.__hold = { set, state: () => ({ d, phase: phase(), moment: mom && mom.id, tried: Object.keys(tried), vel, atWall, scene, found: Object.keys(found), eggs: Object.keys(eggs), done: Object.keys(DONE), chart: { every: CV.every, on: Object.keys(CV.on).filter(k => CV.on[k]), guess: CV.guess, stage: stageNow() } }) };

  /* the page's look and its facts, once */
  let ready = null;
  const prepare = () => ready || (ready = new Promise(res => {
    /* the page's type, once */
    /* i18n-ok: a selector */ if (document.querySelector('link[data-hold-fonts]')) return res();
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = lang() === 'zh' ? FONTS + '&' + FONTS_ZH.split('?')[1] : FONTS; l.dataset.holdFonts = '1'; l.onload = l.onerror = res; document.head.appendChild(l); setTimeout(res, 1500); }));
  return {
    show() { host.hidden = false; host.style.scrollBehavior = 'auto'; return prepare().then(() => { if (live) return; live = true; sizeDie(); layoutYears(); tally(); said = ''; railK = ''; last = 0; raf = requestAnimationFrame(frame); }); },
    hide() { host.hidden = true; live = false; cancelAnimationFrame(raf); setHold(false); }
  };
}
