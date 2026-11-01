/* Labs: Name the blocks, and What is this chip? The floorplans are in src/engines/xray.js (tested);
   this file draws each block with the texture that gives it away on a die photo. */
import { $, T, fit, watch, rgba } from 'osl/core/ui.js';
import * as X from 'osl/engines/xray.js';

const KIND_NAMES = { mcu: 'Microcontroller', phone: 'Phone chip', gpu: 'AI GPU', dram: 'Memory chip', camera: 'Camera sensor' };
const KIND_WHY = {
  mcu: 'Most of the area is memory (flash for the program, SRAM to work in) and analog circuits that talk to the outside world. The CPU itself is a speck.',
  phone: 'A block for each job: big and little CPU cores, a GPU, an AI engine, image and video engines, and memory interfaces along the edge.',
  gpu: 'A sea of identical cores, with a band of cache in the middle and memory interfaces to the HBM stacks down both sides.',
  dram: 'Almost the whole die is memory arrays, with a thin strip of control logic and a row of pads down the middle.',
  camera: 'Most of the area is the pixel array, with a row of converters above and below it, one for each column of pixels.'
};
const TYPE_NAMES = { core: 'CPU core', cache: 'Cache memory (SRAM)', gpu: 'GPU or AI cores', npu: 'AI engine (NPU)', logic: 'Logic', analog: 'Analog circuits', io: 'Pads', phy: 'Fast interfaces', flash: 'Flash memory', dram: 'DRAM arrays', pixels: 'Pixels', adc: 'Column converters', other: 'Other (wiring, spacing, edge ring)' };
const KIND_A = { mcu: 'a microcontroller', phone: 'a phone chip', gpu: 'an AI GPU', dram: 'a memory chip', camera: 'a camera sensor' };
const ASK = { core: 'a CPU core', cache: 'the cache memory (SRAM)', gpu: 'the GPU or AI cores', npu: 'the AI engine', logic: 'a block of logic', analog: 'an analog circuit', io: 'the pads', phy: 'a fast interface', flash: 'the flash memory', dram: 'the memory arrays', pixels: 'the pixels', adc: 'the column converters' };
const typeColor = t => ({ core: T.amber, cache: T.violet, gpu: T.cyan, npu: T.rose, logic: T.muted, analog: T.good, io: T['amber-fill'], phy: T.ink, flash: T.rose, dram: T.violet, pixels: T.rose, adc: T.good, other: T.line }[t] || T.muted);

/* A small seeded random number generator, so copies of one block look identical. */
const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

/* Draw one block's texture into a rectangle, in die-photo colours (they do not follow the theme:
   a die photo looks the same in light and dark mode). */
function texture(c, b, X0, Y0, W, H) {
  const x = X0 + b.x * W, y = Y0 + b.y * H, w = b.w * W, h = b.h * H;
  const r = rng(b.type.length * 977 + Math.round(b.w * 1000) * 31 + Math.round(b.h * 1000));
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const fill = (col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const lines = (col, step, vert, horiz, lw = 1) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); if (vert) for (let i = x; i < x + w; i += step) { c.moveTo(i, y); c.lineTo(i, y + h); } if (horiz) for (let j = y; j < y + h; j += step) { c.moveTo(x, j); c.lineTo(x + w, j); } c.stroke(); };
  const speckle = (cols, n, s1, s2) => { for (let i = 0; i < n; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(x + r() * w, y + r() * h, s1 + r() * s2, s1 + r() * s2 * 0.6); } };
  switch (b.type) {
    case 'cache': fill('#3c3a6b'); lines('rgba(190,185,255,.35)', 3, true, true, 0.7); lines('rgba(20,18,50,.6)', Math.max(14, w / 6), true, false, 2); break;
    case 'flash': fill('#4a3d6e'); lines('rgba(210,190,255,.32)', 5, true, true, 1); break;
    case 'dram': fill('#352f5c'); lines('rgba(200,190,255,.28)', 2, true, true, 0.5); lines('rgba(15,12,40,.85)', Math.max(18, h / 5), false, true, 3); break;
    case 'core': fill('#5c4a2a'); speckle(['#8a6d3b', '#3e3220', '#a88a50'], Math.round(w * h / 6), 1, 3);
      c.fillStyle = '#3c3a6b'; c.fillRect(x + w * 0.62, y + h * 0.08, w * 0.32, h * 0.38); lines('rgba(190,185,255,.3)', 3, false, false); break;
    case 'gpu': fill('#244c56'); speckle(['#3b7380', '#183840', '#5a98a5'], Math.round(w * h / 7), 1, 2.5);
      c.fillStyle = '#2b2f5e'; c.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.18); break;
    case 'npu': { fill('#5a2f45'); const n = 8; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { c.fillStyle = (i + j) % 2 ? '#7d4462' : '#6a3854'; c.fillRect(x + w * (0.08 + 0.84 * i / n), y + h * (0.08 + 0.84 * j / n), w * 0.84 / n - 1.5, h * 0.84 / n - 1.5); } break; }
    case 'logic': fill('#4b4a42'); speckle(['#6d6b5f', '#33322c', '#85826f'], Math.round(w * h / 5), 0.8, 2.5); break;
    case 'analog': fill('#2f4a33'); c.strokeStyle = 'rgba(160,210,160,.55)'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const s = Math.min(w, h) * (0.15 + r() * 0.2); const cx = x + w * (0.2 + 0.6 * r()), cy = y + h * (0.25 + 0.5 * r()); for (let k = 0; k < 4; k++) c.strokeRect(cx - s + k * s / 5, cy - s + k * s / 5, 2 * s - 2 * k * s / 5, 2 * s - 2 * k * s / 5); }
      c.fillStyle = 'rgba(120,170,120,.5)'; for (let i = 0; i < 4; i++) c.fillRect(x + r() * w * 0.8, y + r() * h * 0.8, w * (0.08 + r() * 0.12), h * (0.06 + r() * 0.1)); break;
    case 'io': fill('#b8923e'); c.strokeStyle = 'rgba(80,60,20,.7)'; c.lineWidth = 1; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); break;
    case 'phy': fill('#2f5059'); lines('rgba(150,200,210,.5)', 4, w < h ? false : true, w < h, 1.5); break;
    case 'pixels': { const s = 3; for (let i = x; i < x + w; i += s) for (let j = y; j < y + h; j += s) { const a = ((i - x) / s | 0) % 2, d = ((j - y) / s | 0) % 2; c.fillStyle = a === d ? '#2f6b3a' : a ? '#7a2e34' : '#2f3f7a'; c.fillRect(i, j, s - 0.6, s - 0.6); } break; }
    case 'adc': fill('#2d4734'); lines('rgba(150,210,160,.55)', 3, true, false, 1); break;
  }
  c.restore();
}

/* The whole die, with optional mirroring. Returns the drawing area so clicks can be mapped back. */
function drawDie(cv, blocks, opt) {
  const { ctx: c, w } = fit(cv); const size = w; c.clearRect(0, 0, size, size);
  const m = 6, S = size - 2 * m;
  c.fillStyle = '#1f2326'; c.fillRect(m, m, S, S);
  /* wiring between the blocks: faint metal lines */
  c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; c.beginPath(); for (let i = m; i < m + S; i += 4) { c.moveTo(i, m); c.lineTo(i, m + S); } c.stroke();
  const map = b => opt.flip ? { ...b, x: opt.flip.h ? 1 - b.x - b.w : b.x, y: opt.flip.v ? 1 - b.y - b.h : b.y } : b;
  const placed = blocks.map(map);
  placed.forEach(b => texture(c, b, m, m, S, S));
  c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; placed.forEach(b => c.strokeRect(m + b.x * S + 0.5, m + b.y * S + 0.5, b.w * S - 1, b.h * S - 1));
  if (opt.labels) placed.forEach(b => { if (b.type === 'io') return; c.fillStyle = rgba(typeColor(b.type), 0.28); c.fillRect(m + b.x * S, m + b.y * S, b.w * S, b.h * S); c.strokeStyle = typeColor(b.type); c.lineWidth = 2; c.strokeRect(m + b.x * S + 1, m + b.y * S + 1, b.w * S - 2, b.h * S - 2); });
  (opt.marks || []).forEach(({ b, ok }) => { const q = map(b); c.strokeStyle = ok ? T.good : T.bad; c.lineWidth = 3; c.strokeRect(m + q.x * S + 1.5, m + q.y * S + 1.5, q.w * S - 3, q.h * S - 3); });
  if (opt.labels) { c.font = '600 ' + (S < 400 ? 10 : 11) + 'px IBM Plex Sans, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const seen = new Set(); placed.forEach(b => { if (b.type === 'io' || b.h * S < 16) return; const key = b.type + Math.round(b.y * 10); if (b.type === 'gpu' && seen.has(key)) return; seen.add(key); const tx = m + (b.x + b.w / 2) * S, ty = m + (b.y + b.h / 2) * S, label = b.name.replace(/ \d+$/, ''); c.fillStyle = 'rgba(0,0,0,.65)'; const tw = c.measureText(label).width + 8; if (tw > b.w * S + 2) return; c.fillRect(tx - tw / 2, ty - 9, tw, 18); c.fillStyle = '#fff'; c.fillText(label, tx, ty); }); }
  return { m, S, flip: opt.flip };
}
const toUnit = (geo, cv, e) => { const rc = cv.getBoundingClientRect(); let x = (e.clientX - rc.left - geo.m) / geo.S, y = (e.clientY - rc.top - geo.m) / geo.S; if (geo.flip && geo.flip.h) x = 1 - x; if (geo.flip && geo.flip.v) y = 1 - y; return { x, y }; };

function areaBar(el, legend, blocks) {
  const s = X.shares(blocks), order = Object.keys(s).filter(t => s[t] > 0.004).sort((a, b) => (a === 'other') - (b === 'other') || s[b] - s[a]);
  el.innerHTML = order.map(t => '<i style="flex:' + s[t].toFixed(4) + ';background:' + typeColor(t) + '" title="' + TYPE_NAMES[t] + ' ' + Math.round(s[t] * 100) + '%"></i>').join('');
  el.setAttribute('aria-label', order.map(t => TYPE_NAMES[t] + ' ' + Math.round(s[t] * 100) + '%').join(', '));
  if (legend) legend.innerHTML = order.map(t => '<span><i style="background:' + typeColor(t) + '"></i>' + TYPE_NAMES[t] + ' ' + Math.round(s[t] * 100) + '%</span>').join('');
  return order[0] === 'other' ? order[1] : order[0];
}

export function init() {
  if (!$('#xrCv')) return;
  nameLab(); guessLab();
}

/* ---- Name the blocks ---- */
function nameLab() {
  const cv = $('#xrCv'); let kind = 'mcu', blocks = X.plan(kind), asks = [], qi = 0, found = 0, miss = 0, marks = [], geo = null;
  $('#xrKind').innerHTML = X.KIND_IDS.map(k => '<button type="button" data-k="' + k + '">' + KIND_NAMES[k] + '</button>').join('');
  $('#xrKind').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) start(b.dataset.k); });
  $('#xrLabels').addEventListener('change', draw);
  $('#xrClue').addEventListener('click', () => { if (asks[qi]) $('#xrClueText').textContent = 'Clue: look for ' + X.BLOCKS[asks[qi]].clue + '.'; });
  $('#xrSkip').addEventListener('click', () => { if (!asks[qi]) return; const b = blocks.find(x => x.type === asks[qi]); marks = [{ b, ok: true }]; $('#xrFeedback').textContent = 'Here it is: ' + b.name.replace(/ \d+$/, '') + '.'; next(); });
  cv.addEventListener('click', e => {
    if (!geo || !asks[qi]) return; const p = toUnit(geo, cv, e), b = X.hit(blocks, p.x, p.y);
    if (!b) { $('#xrFeedback').textContent = 'That is wiring and spacing between the blocks.'; return; }
    if (b.type === asks[qi]) { found++; marks = [{ b, ok: true }]; $('#xrFeedback').textContent = '✓ Yes: ' + b.name.replace(/ \d+$/, '') + '. ' + X.BLOCKS[b.type].clue[0].toUpperCase() + X.BLOCKS[b.type].clue.slice(1) + '.'; next(); }
    else { miss++; marks = [{ b, ok: false }]; $('#xrFeedback').textContent = '✗ That is ' + b.name.replace(/ \d+$/, '') + ' (' + TYPE_NAMES[b.type].toLowerCase() + '). Try again.'; update(); }
  });
  function start(k) { kind = k; blocks = X.plan(k); asks = X.askFor(k); qi = 0; found = 0; miss = 0; marks = []; $('#xrFeedback').textContent = ''; $('#xrClueText').textContent = ''; update(); }
  function next() { qi++; $('#xrClueText').textContent = ''; update(); }
  function update() {
    $('#xrKind').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === kind));
    const done = qi >= asks.length;
    $('#xrQ').textContent = done ? 'All found. Pick another chip.' : ASK[asks[qi]] + ' (' + (qi + 1) + ' of ' + asks.length + ')';
    $('#xrFound').textContent = found + ' of ' + asks.length; $('#xrMiss').textContent = miss;
    $('#xrTag').textContent = KIND_NAMES[kind] + (done ? ' · done' : '');
    const top = areaBar($('#xrBar'), $('#xrLeg'), blocks); $('#xrTop').textContent = TYPE_NAMES[top];
    draw();
  }
  function draw() { geo = drawDie(cv, blocks, { labels: $('#xrLabels').checked || qi >= asks.length, marks }); }
  watch(cv, draw);
  start('mcu');
}

/* ---- What is this chip? ---- */
function guessLab() {
  const cv = $('#xrGCv'); let kind = null, flip = null, answered = false, right = 0, streak = 0, last = null;
  $('#xrGuess').innerHTML = X.KIND_IDS.map(k => '<button type="button" data-k="' + k + '">' + KIND_NAMES[k] + '</button>').join('');
  $('#xrGuess').addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b || answered) return; answered = true;
    const ok = b.dataset.k === kind; if (ok) { right++; streak++; } else streak = 0;
    $('#xrGuess').querySelectorAll('button').forEach(x => { x.setAttribute('aria-pressed', x.dataset.k === b.dataset.k); x.classList.toggle('right', x.dataset.k === kind); x.classList.toggle('wrong', !ok && x === b); });
    $('#xrGResult').innerHTML = (ok ? '<b>✓ Right: ' : '<b>✗ No: ') + 'it is ' + KIND_A[kind] + '.</b> ' + KIND_WHY[kind];
    $('#xrGBar').hidden = false; areaBar($('#xrGBar'), null, X.plan(kind));
    $('#xrRight').textContent = right; $('#xrStreak').textContent = streak; $('#xrGTag').textContent = streak > 2 ? streak + ' in a row' : '';
    draw();
  });
  $('#xrNext').addEventListener('click', round);
  function round() {
    const pool = X.KIND_IDS.filter(k => k !== last); kind = pool[Math.floor(Math.random() * pool.length)]; last = kind;
    flip = { h: Math.random() < 0.5, v: Math.random() < 0.5 }; answered = false;
    $('#xrGuess').querySelectorAll('button').forEach(x => { x.setAttribute('aria-pressed', 'false'); x.classList.remove('right', 'wrong'); });
    $('#xrGResult').textContent = ''; $('#xrGBar').hidden = true; draw();
  }
  function draw() { if (kind) drawDie(cv, X.plan(kind), { flip, labels: answered }); }
  watch(cv, draw);
  round();
}
