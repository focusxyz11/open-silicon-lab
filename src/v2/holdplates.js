/* Hold's plates (the first page, src/v2/hold.js): every picture of the page is one square drawn in 1000 units, with its
   own controls on it (HTML over it, placed in per cent), so the thing you try is on the picture, never beside it; and
   Moore's law, live, along the bottom of the fifty years (mkChart, mkCQ). Designed with Claude Fable 5.2 and brought
   into the lab with Claude Opus 5.5. */
import { t } from '../core/i18n.js';
import { w, sw, Q, $, h, clamp, lerp, ss, mix, rnd, nf, sig, xOf, S, done, tried, setOut, K, fg, rd, src, lab, viewAt, momOut, Yr, bindHold, ROOT, TICK, changed, onChange } from './holdkit.js';
import { money } from './figures.js';
import { FIG } from '../data/figures.js';
import { AHEAD, ARR, BEHIND, CHIPS, COST, DWALL, ERAS, FCOST, FDIV, FORMS, KNEE, LIGHTS, LOOP, MOORE65, NEEDS, RUNGS, SERIES, STOCK, TRIP, dAt, formAt, rule, trend, yearAt } from '../data/hold.js';

/* ================= the plates =================
   Each plate is drawn in a square of 1000 units and carries its own controls (HTML over it, placed in per cent), so
   the thing you try is on the picture, never beside it. Words on a picture are HTML labels over it. */
export const PL = {};
export function mkPlate(id, o = {}) {
  const def = PL[id], el = h('div', 'plate'), cv = h('canvas'), c = cv.getContext('2d'); el.dataset.id = id; el.appendChild(cv);
  const pl = { id, el, cv, c, P: 0, mini: !!o.mini, fade: 0, key: '', view: '' };
  if (!o.mini) { pl.ui = h('div', 'pl-ui'); el.appendChild(pl.ui); pl.fr = h('div', 'pl-fr mono', '<span></span><span></span>'); el.appendChild(pl.fr); if (def.ui) def.ui(pl.ui, pl); }
  pl.fit = () => { const s = el.clientWidth; if (!s) return; const dpr = o.dpr ? o.dpr : o.mini ? Math.min(2, (devicePixelRatio || 1) * 1.5) : Math.min(2, devicePixelRatio || 1), P = Math.round(s * dpr); if (cv.width !== P) cv.width = cv.height = P; pl.P = P; el.style.setProperty('--p', s / 1000 + 'px'); };
  pl.paint = (T, dt) => { if (!pl.P) pl.fit(); if (!pl.P) return;
    c.setTransform(pl.P / 1000, 0, 0, pl.P / 1000, 0, 0); c.globalAlpha = 1; c.fillStyle = K.plate; c.fillRect(0, 0, 1000, 1000); c.lineCap = 'butt'; c.lineJoin = 'miter'; c.setLineDash([]);
    def.paint(c, T, dt || 0, pl); c.globalAlpha = 1; c.setLineDash([]);
    if (pl.fade > 0) { c.globalAlpha = pl.fade; c.fillStyle = K.plate; c.fillRect(0, 0, 1000, 1000); c.globalAlpha = 1; pl.fade = Math.max(0, pl.fade - (dt || .016) * 3.2); }
    if (pl.sync) pl.sync();
    if (pl.fr) { const f = def.frame ? def.frame() : [w('pl.' + id), '']; if (pl.key !== f[0] + '|' + f[1]) { pl.key = f[0] + '|' + f[1]; pl.fr.children[0].textContent = f[0]; pl.fr.children[1].textContent = f[1]; } } };
  return pl;
}
export const at = (e, l, tp, wd, ht) => { e.style.left = l + '%'; e.style.top = tp + '%'; if (wd != null) e.style.width = wd + '%'; if (ht != null) e.style.height = ht + '%'; return e; };
export function seg(host, labels, get, set, pos, cls) { const s = h('div', 'seg ' + (cls || '')); labels.forEach((l, i) => { const b = h('button', '', l); b.type = 'button'; b.onclick = () => set(i); s.appendChild(b); }); at(s, ...pos); host.appendChild(s);
  return () => [...s.children].forEach((b, i) => b.classList.toggle('on', get() === i)); }
export const lbl = (host, html, l, tp, cls) => { const e = h('span', 'lb ' + (cls || ''), html); at(e, l, tp); host.appendChild(e); return e; };
export const btn = (host, html, pos, fn, cls) => { const b = h('button', 'pbtn ' + (cls || ''), html); b.type = 'button'; b.onclick = fn; at(b, ...pos); host.appendChild(b); return b; };
export const big = (host, l, tp) => { const e = h('div', 'big'); at(e, l, tp); host.appendChild(e); return e; };
export const put = (e, html) => { if (e._h !== html) { e._h = html; e.innerHTML = html; } };
export const path = (c, pts, col, lw, dash) => { c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke(); c.setLineDash([]); };
export const hatch = (c, x, y, ww, hh, step, col, lw) => { c.save(); c.beginPath(); c.rect(x, y, ww, hh); c.clip(); c.strokeStyle = col; c.lineWidth = lw || 1.5; c.beginPath(); for (let q = -hh; q < ww; q += step) { c.moveTo(x + q, y + hh); c.lineTo(x + q + hh, y); } c.stroke(); c.restore(); };
/* a point a given way along a line of points */
export function along(pts, f) { let tot = 0; const L = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
  let u = ((f % 1) + 1) % 1 * tot; for (let i = 0; i < L.length; i++) { if (u <= L[i]) return [lerp(pts[i][0], pts[i + 1][0], u / L[i]), lerp(pts[i][1], pts[i + 1][1], u / L[i])]; u -= L[i]; } return pts[pts.length - 1]; }
export const train = (c, pts, T, n, speed, s) => { c.fillStyle = K.red; for (let i = 0; i < n; i++) { const p = along(pts, T * speed + i / n); c.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); } };

/* ---------------- the transistor, seen from the side: no current is 0, current is 1 ---------------- */
export function bigT(c, a, T, on, o = {}) {
  if (a <= .01) return;
  const cx = 500, cy = 560, ww = 640, x0 = cx - ww / 2, bh = 190, wl = ww * .27, wh = 78, gw = ww * .38, gh = 115, ox = 13, top = cy - 270, lw = 4.2, sx = x0 + ww * .15, dx = x0 + ww * .85;
  c.save(); c.globalAlpha = a; c.lineJoin = 'round'; c.lineCap = 'round';
  hatch(c, x0, cy, ww, bh, 16, fg(.16), 2);
  c.strokeStyle = K.ink; c.lineWidth = lw; c.strokeRect(x0, cy, ww, bh);
  c.fillStyle = K.ink; for (const wx of [x0 + ww * .02, x0 + ww * .98 - wl]) { c.beginPath(); c.roundRect(wx, cy, wl, wh, [0, 0, wh * .5, wh * .5]); c.fill(); }
  const cl = x0 + ww * .02 + wl, cr = x0 + ww * .98 - wl;
  if (on > .01) { c.fillStyle = K.red; c.globalAlpha = a * on; c.fillRect(cl - 2, cy, cr - cl + 4, wh * .34); c.globalAlpha = a; }
  c.strokeStyle = K.ink; c.lineWidth = lw * .6; c.beginPath(); c.moveTo(cx - gw / 2 - 4, cy - ox * .5); c.lineTo(cx + gw / 2 + 4, cy - ox * .5); c.stroke();
  c.fillStyle = K.plate; c.fillRect(cx - gw / 2, cy - ox - gh, gw, gh);
  c.fillStyle = K.red; c.globalAlpha = a * Math.max(on, (o.idle || 0) * .22); c.fillRect(cx - gw / 2, cy - ox - gh, gw, gh); c.globalAlpha = a;
  if (o.volt != null) { c.fillStyle = fg(.82); c.fillRect(cx - gw / 2, cy - ox - gh * o.volt, gw, gh * o.volt); }
  c.strokeStyle = on > .5 ? K.red : K.ink; c.lineWidth = lw * 1.25; c.strokeRect(cx - gw / 2, cy - ox - gh, gw, gh);
  c.strokeStyle = K.ink; c.lineWidth = lw; c.beginPath(); c.moveTo(sx, cy); c.lineTo(sx, top); c.moveTo(dx, cy); c.lineTo(dx, top); c.stroke();
  c.strokeStyle = on > .5 ? K.red : K.ink; c.beginPath(); c.moveTo(cx, cy - ox - gh); c.lineTo(cx, top - 50); c.stroke();
  for (const [px, py, r] of [[sx, top, 0], [dx, top, 0], [cx, top - 50, 1]]) { c.fillStyle = r && on > .5 ? K.red : K.plate; c.strokeStyle = r && on > .5 ? K.red : K.ink; c.beginPath(); c.arc(px, py, 11, 0, 7); c.fill(); c.stroke(); }
  const pathI = [[sx, top], [sx, cy + wh * .2], [dx, cy + wh * .2], [dx, top]];
  if (on > .05) { c.fillStyle = '#fff'; c.globalAlpha = a * on; for (let i = 0; i < 7; i++) { const px = cx - gw / 2 + gw * (i + .5) / 7, py = cy - ox - gh * .28; c.fillRect(px - 7, py - 1, 14, 2); c.fillRect(px - 1, py - 7, 2, 14); }
    c.fillStyle = K.red; for (let i = 0; i < 16; i++) { const p = along(pathI, T * .55 + i / 16); c.beginPath(); c.arc(p[0], p[1], 7.5, 0, 7); c.fill(); } }
  if (o.leak) { c.fillStyle = K.red; c.globalAlpha = a; const n = Math.round(1 + o.leak * 5); for (let i = 0; i < n; i++) { const f = (T * (.1 + .012 * o.leak) + i / n) % 1, px = lerp(cl - 30, cr + 30, f), py = cy + wh * .16 + 6 * Math.sin(i * 2.4 + T * 3); c.beginPath(); c.arc(px, py, 4.2 + .5 * o.leak, 0, 7); c.fill(); }
    c.globalAlpha = a * Math.min(.5, .1 * o.leak); c.fillRect(cl - 2, cy, cr - cl + 4, wh * .34); }
  c.restore();
}
/* ---- and small: its three forms, as the years made them ---- */
export function glyph(c, cx, cy, g, on, a, lw, form, leak) {
  if (a <= .01 || g < 1.2) return;
  c.globalAlpha = a; c.lineWidth = lw; c.strokeStyle = K.ink; const hot = on > .6;
  if (form === 'fin') { const y0 = cy + .8 * g;
    c.beginPath(); c.moveTo(cx - 1.5 * g, y0); c.lineTo(cx + 1.5 * g, y0); c.stroke();
    c.fillStyle = K.ink; c.fillRect(cx - .17 * g, y0 - 1.3 * g, .34 * g, 1.3 * g);
    c.strokeStyle = hot ? K.red : K.ink; c.lineWidth = Math.max(lw, .3 * g); c.beginPath(); c.moveTo(cx - .6 * g, y0 - lw); c.lineTo(cx - .6 * g, y0 - 1.72 * g); c.lineTo(cx + .6 * g, y0 - 1.72 * g); c.lineTo(cx + .6 * g, y0 - lw); c.stroke();
  } else if (form === 'gaa') {
    c.fillStyle = hot ? K.red : K.plate; c.fillRect(cx - .85 * g, cy - g, 1.7 * g, 2 * g); c.strokeStyle = hot ? K.red : K.ink; c.lineWidth = Math.max(lw, .14 * g); c.strokeRect(cx - .85 * g, cy - g, 1.7 * g, 2 * g);
    for (let i = 0; i < 3; i++) { c.fillStyle = hot ? K.plate : K.ink; c.fillRect(cx - .55 * g, cy - .7 * g + i * .56 * g, 1.1 * g, .28 * g); }
  } else { const y0 = cy + .42 * g;
    c.beginPath(); c.moveTo(cx - 1.6 * g, y0); c.lineTo(cx + 1.6 * g, y0); c.stroke();
    c.fillStyle = K.ink; c.fillRect(cx - 1.5 * g, y0, .9 * g, .34 * g); c.fillRect(cx + .6 * g, y0, .9 * g, .34 * g);
    if (hot) { c.fillStyle = K.red; c.fillRect(cx - .6 * g, y0, 1.2 * g, .17 * g); }
    else if (leak) { c.fillStyle = K.red; c.globalAlpha = a * leak; c.fillRect(cx - .6 * g, y0, 1.2 * g, .17 * g); c.globalAlpha = a; }
    c.fillStyle = hot ? K.red : K.plate; c.fillRect(cx - .62 * g, y0 - .8 * g, 1.24 * g, .64 * g); c.strokeStyle = hot ? K.red : K.ink; c.strokeRect(cx - .62 * g, y0 - .8 * g, 1.24 * g, .64 * g);
    c.beginPath(); c.moveTo(cx, y0 - .8 * g); c.lineTo(cx, y0 - 1.25 * g); c.stroke(); }
  c.globalAlpha = 1;
}

/* ---------------- the die: one square, split again at every doubling ---------------- */
export const TYPES = ['core', 'memory', 'core', 'io', 'memory', 'ctrl', 'clock', 'core'], LMAX = 13;
export function walk(L, onSplit, onLeaf) {
  (function rec(x, y, ww, hh, hash, depth, type, idx) {
    if (depth === 3) { type = TYPES[idx]; if (type === 'core') hash = 0xC0DE5; }
    const vert = depth < 3 ? depth !== 1 : type === 'core' ? depth % 2 === 0 : ww >= hh, r = type === 'memory' ? .5 : .4 + .2 * rnd(hash);
    const end = type === 'clock' ? 3 : type === 'io' ? Math.max(3, L - 5) : L;
    if (depth >= end || depth === L) { onLeaf(x, y, ww, hh, hash, vert, r, type, idx); return; }
    onSplit(x, y, ww, hh, vert, r, depth, type);
    const i1 = depth < 3 ? idx * 2 : idx, i2 = depth < 3 ? idx * 2 + 1 : idx;
    if (vert) { rec(x, y, ww * r, hh, mix(hash, 1), depth + 1, type, i1); rec(x + ww * r, y, ww * (1 - r), hh, mix(hash, 2), depth + 1, type, i2); }
    else { rec(x, y, ww, hh * r, mix(hash, 1), depth + 1, type, i1); rec(x, y + hh * r, ww, hh * (1 - r), mix(hash, 2), depth + 1, type, i2); }
  })(0, 0, 1000, 1000, 0x51ab5, 0, null, 0);
}
export function htree(c, x, y, ww, hh, n, min) {
  if (n <= 0 || Math.min(ww, hh) < min) return;
  c.moveTo(x + ww / 4, y + hh / 2); c.lineTo(x + 3 * ww / 4, y + hh / 2); c.moveTo(x + ww / 4, y + hh / 4); c.lineTo(x + ww / 4, y + 3 * hh / 4); c.moveTo(x + 3 * ww / 4, y + hh / 4); c.lineTo(x + 3 * ww / 4, y + 3 * hh / 4);
  for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) htree(c, x + a * ww / 2, y + b * hh / 2, ww / 2, hh / 2, n - 1, min);
}
/* what fifty years of splitting leaves behind: every region its own texture, as on a real die */
export const floors = {};
export function floorFor(P) {
  const key = P + (S.night ? 'n' : 'd'); if (floors[key]) return floors[key];
  const f = document.createElement('canvas'); f.width = f.height = P; const c = f.getContext('2d'), u = 1000 / P; c.setTransform(P / 1000, 0, 0, P / 1000, 0, 0);
  c.fillStyle = S.night ? '#100f0d' : '#e2ddd0'; c.fillRect(0, 0, 1000, 1000);
  const TONE = { core: 30, ctrl: 20, memory: 50, io: 15, clock: 11 };
  walk(P < 260 ? 7 : 9, () => {}, (x, y, ww, hh, hash, vert, r, type) => {
    const k = rnd(hash), g = Math.round(type === 'memory' ? 44 + 12 * ((Math.round(x / 15.6) + Math.round(y / 15.6)) % 2) : TONE[type] * (.45 + k * k * 1.35));
    c.fillStyle = S.night ? 'rgb(' + (g + 4) + ',' + (g + 2) + ',' + Math.max(0, g - 2) + ')' : 'rgb(' + (240 - g * 1.25) + ',' + (237 - g * 1.25) + ',' + (228 - g * 1.25) + ')'; c.fillRect(x, y, ww + u, hh + u);
    if (type === 'memory') { c.fillStyle = fg(.1); for (let i = 0; i < hh; i += 4 * u) c.fillRect(x, y + i, ww, u); }
    else if (type === 'io') { const m = 8; c.strokeStyle = fg(.55); c.lineWidth = 1.6; c.strokeRect(x + m, y + m, ww - 2 * m, hh - 2 * m); c.fillStyle = fg(.12); c.fillRect(x + m * 2.2, y + m * 2.2, ww - m * 4.4, hh - m * 4.4); }
    else if (type === 'clock') { c.strokeStyle = fg(.5); c.lineWidth = 1.6; c.beginPath(); htree(c, x, y, ww, hh, 5, 5); c.stroke(); }
    else if (rnd(hash >>> 3) > .8) { c.fillStyle = S.night ? 'rgba(0,0,0,.35)' : 'rgba(19,18,16,.1)'; c.fillRect(x, y, ww + u, hh + u); } });
  for (const [L, a, lw] of [[3, .55, 2.5], [5, .2, 1.6]]) { c.strokeStyle = fg(a); c.lineWidth = lw; c.beginPath(); walk(L, (x, y, ww, hh, vert, r) => { if (vert) { c.moveTo(x + ww * r, y); c.lineTo(x + ww * r, y + hh); } else { c.moveTo(x, y + hh * r); c.lineTo(x + ww, y + hh * r); } }, () => {}); c.stroke(); }
  floors[key] = f; return f;
}
export const isOn = (hash, T, type) => (type === 'memory' ? rnd(hash ^ 0x77aa) < .5 : rnd(mix(hash, Math.floor(T * (.5 + rnd(hash >>> 5)) + rnd(hash >>> 9) * 9))) < .34);
export function drawField(c, L, f, T, form) {
  const thin = new Path2D(), thick = new Path2D(), fresh = new Path2D(), tree = new Path2D(), leaves = [], lw = 2.2;
  walk(L, (x, y, ww, hh, vert, r, depth, type) => { const p = depth < 3 || depth < L - 9 ? thick : thin;
    if (vert) { p.moveTo(x + ww * r, y); p.lineTo(x + ww * r, y + hh); } else { p.moveTo(x, y + hh * r); p.lineTo(x + ww, y + hh * r); }
    if (depth === 3 && type === 'memory' && L > 5) { c.fillStyle = fg(.06); c.fillRect(x, y, ww, hh); } },
  (x, y, ww, hh, hash, vert, r, type) => {
    if (type === 'clock') { htree(tree, x, y, ww, hh, 1 + Math.floor(L / 2), 7); return; }
    const splits = !(type === 'io' && L - 5 < 3);
    if (f > 0 && splits) { const e = f * .5;
      if (vert) { const u = x + ww * r; fresh.moveTo(u, y); fresh.lineTo(u, y + hh * e); fresh.moveTo(u, y + hh); fresh.lineTo(u, y + hh - hh * e); }
      else { const u = y + hh * r; fresh.moveTo(x, u); fresh.lineTo(x + ww * e, u); fresh.moveTo(x + ww, u); fresh.lineTo(x + ww - ww * e, u); } }
    if (Math.min(ww, hh) >= 8) leaves.push([x, y, ww, hh, hash, vert, r, type, splits]); });
  c.strokeStyle = K.ink; c.lineWidth = lw; c.stroke(thin); c.lineWidth = lw * 2; c.stroke(thick); c.lineWidth = lw * 1.2; c.stroke(tree);
  if (f > 0) { c.strokeStyle = S.holding ? K.red : K.ink; c.lineWidth = lw * (S.holding ? 1.6 : 1); c.stroke(fresh); }
  const gs = m => Math.min(m * .2, 150);
  for (const [x, y, ww, hh, hash, vert, r, type, splits] of leaves) {
    const a0 = splits ? 1 - ss(.2, .62, f) : 1, g0 = gs(Math.min(ww, hh));
    if (L === 0) bigT(c, a0, T, S.press, { idle: S.d < .01 ? .5 + .5 * Math.sin(T * 3) : 0 }); else glyph(c, x + ww / 2, y + hh / 2, g0, isOn(hash, T, type) ? 1 : 0, a0, Math.max(lw * 1.15, g0 * .03), form);
    if (f > .4 && splits) { const a1 = ss(.5, 1, f), kids = vert ? [[x, y, ww * r, hh, 1], [x + ww * r, y, ww * (1 - r), hh, 2]] : [[x, y, ww, hh * r, 1], [x, y + hh * r, ww, hh * (1 - r), 2]];
      for (const k of kids) { const g1 = gs(Math.min(k[2], k[3])); glyph(c, k[0] + k[2] / 2, k[1] + k[3] / 2, g1, isOn(mix(hash, k[4]), T, type) ? 1 : 0, a1, Math.max(lw * 1.15, g1 * .03), form); } }
  }
}
/* ---- what hides behind 0 and 1: two transistors, a NOT gate; four, a NAND gate. Every wire red while it carries 1 ---- */
export const wire = (c, pts, v, lw) => { c.strokeStyle = v ? K.red : K.ink; c.lineWidth = lw * (v ? 1.6 : 1); c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke(); };
export const fet = (c, x, y, on, a) => { c.save(); c.translate(x, y); c.rotate(-Math.PI / 2); glyph(c, 0, 0, 46, on ? 1 : 0, a, 4, 'planar'); c.restore(); c.globalAlpha = a; };
/* i18n-ok: styles */ export const bit = (c, x, y, v, al, sz) => { c.fillStyle = v ? K.red : K.ink; c.font = '400 ' + (sz || 92) + 'px Anton, Impact, sans-serif'; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillText(v ? '1' : '0', x, y); };
export const GT = 46 * 1.5, GX = 46 * .83, GD = 46 * .45;
export function drawNot(c, A, a) {
  const x = 520, yp = 330, yn = 670, out = A ? 0 : 1; c.globalAlpha = a; c.lineCap = 'square';
  wire(c, [[380, 180], [660, 180]], 1, 4); wire(c, [[380, 820], [660, 820]], 0, 4);
  wire(c, [[x + GD, 180], [x + GD, yp - GT]], 1, 4); wire(c, [[x + GD, yp + GT], [x + GD, yn - GT]], out, 4); wire(c, [[x + GD, 500], [810, 500]], out, 4); wire(c, [[x + GD, yn + GT], [x + GD, 820]], 0, 4);
  wire(c, [[190, 500], [330, 500]], A, 4); wire(c, [[330, yp], [330, yn]], A, 4); wire(c, [[330, yp], [x - GX, yp]], A, 4); wire(c, [[330, yn], [x - GX, yn]], A, 4);
  fet(c, x, yp, !A, a); fet(c, x, yn, A, a);
  bit(c, 340, 180, 1, 'right'); bit(c, 340, 820, 0, 'right'); bit(c, 150, 500, A); bit(c, 860, 500, out); c.lineCap = 'butt';
}
export function drawNand(c, A, B, a) {
  const xa = 400, xb = 640, yp = 320, xn = 560, ya = 580, yb = 730, out = A && B ? 0 : 1; c.globalAlpha = a; c.lineCap = 'square';
  wire(c, [[330, 170], [770, 170]], 1, 4); wire(c, [[330, 850], [770, 850]], 0, 4);
  wire(c, [[xa + GD, 170], [xa + GD, yp - GT]], 1, 4); wire(c, [[xb + GD, 170], [xb + GD, yp - GT]], 1, 4);
  wire(c, [[xa + GD, yp + GT], [xa + GD, 450], [xb + GD, 450], [xb + GD, yp + GT]], out, 4);
  wire(c, [[xn + GD, 450], [xn + GD, ya - GT]], out, 4); wire(c, [[xb + GD, 450], [820, 450]], out, 4);
  wire(c, [[xn + GD, ya + GT], [xn + GD, yb - GT]], B ? 0 : A ? out : 0, 4); wire(c, [[xn + GD, yb + GT], [xn + GD, 850]], 0, 4);
  wire(c, [[190, ya], [280, ya], [280, yp], [xa - GX, yp]], A, 4); wire(c, [[280, ya], [xn - GX, ya]], A, 4);
  wire(c, [[190, yb], [230, yb], [230, ya + 18]], B, 4); c.beginPath(); c.arc(230, ya, 18, Math.PI / 2, -Math.PI / 2, true); c.stroke();
  wire(c, [[230, ya - 18], [230, 240], [xb - GX - 40, 240], [xb - GX - 40, yp], [xb - GX, yp]], B, 4); wire(c, [[230, yb], [xn - GX, yb]], B, 4);
  fet(c, xa, yp, !A, a); fet(c, xb, yp, !B, a); fet(c, xn, ya, A, a); fet(c, xn, yb, B, a);
  bit(c, 300, 170, 1, 'right'); bit(c, 300, 850, 0, 'right'); bit(c, 140, ya, A); bit(c, 140, yb, B); bit(c, 880, 450, out); c.lineCap = 'butt';
}
export function paintDie(c, T, d) {
  const L = Math.min(Math.floor(d), LMAX), f = d >= LMAX ? 0 : d - Math.floor(d), aF = ss(10, 13, d);
  if (aF < 1) drawField(c, L, f, T, 'planar');
  if (aF > 0) { c.globalAlpha = aF; c.drawImage(floorFor(c.canvas.width), 0, 0, 1000, 1000); c.globalAlpha = 1;
    c.fillStyle = K.red; for (let i = 0; i < 46; i++) { const hh = mix(i * 7919, Math.floor(T * 11)); c.globalAlpha = aF * (.35 + .65 * rnd(hh >>> 2)); const s = 2 + 2.6 * rnd(hh >>> 7); c.fillRect(rnd(hh) * 1000, rnd(hh ^ 0xabc) * 1000, s, s); } c.globalAlpha = 1; }
  const kNot = ss(.85, 1, d) * (1 - ss(1.45, 1.65, d)); if (kNot > .01) { c.globalAlpha = kNot; c.fillStyle = K.plate; c.fillRect(0, 0, 1000, 1000); drawNot(c, Math.floor(T / 1.1) % 2, kNot); c.globalAlpha = 1; }
  /* the glass: you can no longer see them, so it shows what is there, in the form the years gave the transistor */
  const aG = ss(14, 16, d); if (aG > .01) { const gx = 705, gy = 300, gr = 148, form = formAt(d); c.save(); c.globalAlpha = aG; c.beginPath(); c.arc(gx, gy, gr, 0, 7); c.fillStyle = K.plate; c.fill(); c.clip();
    c.strokeStyle = K.ink; c.lineWidth = 2; c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(gx + i * 74 - 37, gy - gr); c.lineTo(gx + i * 74 - 37, gy + gr); c.moveTo(gx - gr, gy + i * 74 - 37); c.lineTo(gx + gr, gy + i * 74 - 37); } c.stroke();
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) glyph(c, gx + i * 74, gy + j * 74, 17, isOn(mix(i * 31 + j, 77), T, 'core') ? 1 : 0, aG, 2.6, form);
    c.restore(); c.globalAlpha = aG; c.strokeStyle = K.ink; c.lineWidth = 5; c.beginPath(); c.arc(gx, gy, gr, 0, 7); c.stroke(); c.globalAlpha = 1; }
}

/* ---------------- the moments on the way ---------------- */
export function paintJob(c) { const n = S.jobK ?? 500, cw = 31.2, x0 = 110, y0 = 300;
  for (let i = 0; i < 500; i++) { const cx = x0 + (i % 25) * cw, cy = y0 + Math.floor(i / 25) * cw; if (i < Math.round(n)) { c.fillStyle = K.red; c.fillRect(cx + 2, cy + 2, cw - 4, cw - 4); } else { c.strokeStyle = fg(.22); c.lineWidth = 1.5; c.strokeRect(cx + 2.5, cy + 2.5, cw - 5, cw - 5); } } }
export const BUGCOLS = [8, 15, 22, 29, 36];
export function paintBug(c, T) { const cw = 20, x0 = 90, y0 = 250, b = S.bug;
  for (let i = 0; i < 41; i++) { const mid = 2.5 + i * .42; for (let j = 0; j < 22; j++) { const k = Math.round(j - mid), x = x0 + i * cw, y = y0 + j * cw;
    if (Math.abs(k) > 2) { c.fillStyle = fg(.1); c.fillRect(x + 8, y + 8, 4, 4); continue; }
    if (k === -2 && BUGCOLS.includes(i)) { if (b.worst) { c.fillStyle = rd(.25 + .2 * Math.sin(T * 5)); c.fillRect(x + 1, y + 1, cw - 2, cw - 2); c.strokeStyle = K.red; c.lineWidth = 3; c.strokeRect(x - 4, y - 4, cw + 8, cw + 8); } continue; }
    c.fillStyle = fg([.66, .4, .17, .4, .66][k + 2]); c.fillRect(x + 1.5, y + 1.5, cw - 3, cw - 3); } }
  if (b.run > 0) { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.beginPath(); for (let i = 0; i < 70; i++) { const hh = mix(i, Math.floor(T * 40)), x = x0 + rnd(hh) * 820, y = y0 + rnd(hh >>> 3) * 440; c.moveTo(x - 7, y); c.lineTo(x + 7, y); c.moveTo(x, y - 7); c.lineTo(x, y + 7); } c.stroke(); } }
export function paintLight(c, T) { const l = LIGHTS[S.light], lam = l === 'euv' ? 23 : 328, y0 = 255;
  c.strokeStyle = K.red; c.lineWidth = 4; c.beginPath(); for (let x = 100; x <= 900; x += 2) { const y = y0 + 52 * Math.sin((x - T * (l === 'euv' ? 40 : 90)) / lam * 6.283); if (x === 100) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
  c.strokeStyle = K.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(100, y0 + 86); c.lineTo(100 + lam, y0 + 86); c.moveTo(100, y0 + 78); c.lineTo(100, y0 + 94); c.moveTo(100 + lam, y0 + 78); c.lineTo(100 + lam, y0 + 94); c.stroke();
  const gx = 100, gy = 430, gh = 400, pitch = 50;
  if (l === 'one') { for (let x = 0; x < 800; x += 4) { c.fillStyle = fg(.3 + .1 * Math.cos(x / pitch * 6.283)); c.fillRect(gx + x, gy, 4, gh); } }
  else for (let i = 0; i < 16; i++) { const x = gx + i * pitch, p = i % 3;
    if (l === 'euv' || p === 0) { c.fillStyle = K.ink; c.fillRect(x, gy, 25, gh); } else if (p === 1) { c.fillStyle = fg(.55); c.fillRect(x + 2.5, gy, 25, gh); } else { hatch(c, x - 2, gy, 25, gh, 9, K.ink, 2.4); c.strokeStyle = K.ink; c.lineWidth = 2; c.strokeRect(x - 2, gy, 25, gh); } }
  c.strokeStyle = K.ink; c.lineWidth = 2; c.strokeRect(gx - 14, gy - 14, 828, gh + 28); }
export function paintWall(c, T) {
  const j = Yr.wallPush * 5 * Math.sin(T * 60); c.save(); c.translate(j, 0);
  c.drawImage(floorFor(c.canvas.width), 0, 0, 1000, 1000);
  c.fillStyle = K.plate; c.globalAlpha = .9; c.fillRect(250, 260, 500, 500); c.globalAlpha = 1;
  const cx = 500, cy = 510; hatch(c, cx - 110, cy - 110, 220, 220, 14, fg(.3), 2); c.strokeStyle = K.ink; c.lineWidth = 4; c.strokeRect(cx - 110, cy - 110, 220, 220);
  const s1 = 220 * Math.sqrt(1.15); c.strokeStyle = K.red; c.lineWidth = 4; c.strokeRect(cx - 110, cy + 110 - s1, s1, s1);
  const s2 = 220 * Math.SQRT2; c.strokeStyle = K.ink; c.lineWidth = 2.5; c.setLineDash([10, 9]); c.strokeRect(cx - 110, cy + 110 - s2, s2, s2); c.setLineDash([]);
  c.restore(); c.fillStyle = K.red; c.fillRect(972, 0, 28, 1000); if (Yr.wallPush > .02) { c.globalAlpha = Yr.wallPush * .35; c.fillRect(0, 0, 1000, 1000); c.globalAlpha = 1; } }

PL.years = {
  frame: () => { const v = viewAt(S.d); return v === 'one' ? [w('pl.one'), S.press > .5 ? w('bit.1') : w('bit.0')] : v === 'die' || v === 'wall' ? [w('die.same'), w('dens', { n: sig(Math.sqrt(Math.pow(2, S.d)), 2) })] : [w('mo.' + v + '.k') + ' · ' + w('mo.try'), '']; },
  paint(c, T, dt, pl) { const v = viewAt(S.d); if (pl.view !== v) { if (pl.view && !(pl.view === 'one' && v === 'die') && !(pl.view === 'die' && v === 'one')) pl.fade = 1; pl.view = v; }
    if (v === 'gate') drawNand(c, S.gate.a, S.gate.b, 1); else if (v === 'job') paintJob(c); else if (v === 'bug') paintBug(c, T); else if (v === 'light') paintLight(c, T); else if (v === 'wall') paintWall(c, T); else paintDie(c, T, S.d); },
  ui(host, pl) {
    const L = {}; for (const v of ['one', 'die', 'gate', 'job', 'bug', 'light', 'wall']) { L[v] = h('div', 'layer'); host.appendChild(L[v]); }
    /* one transistor: its three parts named, and the bit it holds */
    lbl(L.one, w('t.source'), 26.5, 23, 'c'); lbl(L.one, w('t.gate'), 50, 18, 'c'); lbl(L.one, w('t.drain'), 73.5, 23, 'c'); const bitE = big(L.one, 8, 80);
    const glass = lbl(L.die, '', 70.5, 46.5, 'c');
    /* four transistors, a gate: tap the inputs */
    const ta = h('button', 'tap'), tb = h('button', 'tap'); ta.type = tb.type = 'button'; ta.setAttribute('aria-label', w('mo.gate.a')); tb.setAttribute('aria-label', w('mo.gate.b')); at(ta, 14, 58, 12, 12); at(tb, 14, 73, 12, 12); L.gate.append(ta, tb);
    const flip = k => { S.gate[k] ^= 1; S.tried.mgate = 1; ta.classList.add('used'); tb.classList.add('used'); if (S.gate.a && S.gate.b) done('gate'); setOut('m-gate', momOut('gate')); };
    ta.onclick = () => flip('a'); tb.onclick = () => flip('b'); lbl(L.gate, w('mo.gate.a'), 6, 47.5); lbl(L.gate, w('mo.gate.b'), 6, 81); lbl(L.gate, w('mo.gate.out'), 83, 34.5);
    /* 1971: one job, or any program */
    const jb = big(L.job, 11, 4.5), jr = h('input', 'rng'); jr.type = 'range'; jr.min = 0; jr.max = 2; jr.step = 1; jr.value = S.job; jr.setAttribute('aria-label', w('mo.job.aria')); at(jr, 11, 17.5, 78); L.job.appendChild(jr);
    jr.oninput = () => { S.job = +jr.value; done('job'); setOut('m-job', momOut('job')); };
    lbl(L.job, w('mo.job.l'), 11, 24.5); lbl(L.job, w('mo.job.m'), 50, 25.8, 'c'); lbl(L.job, w('mo.job.r'), 89, 24.5, 'r');
    /* 1995: test it yourself */
    const bb = big(L.bug, 9, 5);
    btn(L.bug, w('mo.bug.run'), [9, 76, 44], () => { if (S.bug.run <= 0) S.bug.run = 1.2; }); btn(L.bug, w('mo.bug.worst', { a: nf(FDIV.a), b: nf(FDIV.b) }), [55, 76, 36], () => { S.bug.worst = true; done('bug'); setOut('m-bug', momOut('bug')); }, 'ghost');
    lbl(L.bug, w('bug.table'), 9, 71);
    /* the light: how do you print lines finer than it */
    const ls = seg(L.light, LIGHTS.map(l => w('mo.light.' + l)), () => S.light, i => { S.light = i; if (i) done('light'); setOut('m-light', momOut('light')); }, [6, 4, 88]);
    const lam = lbl(L.light, '', 10, 36.5); lbl(L.light, w('light.lines'), 10, 86.5);
    /* the wall */
    lbl(L.wall, w('g.now'), 39.5, 62.5, 'hot'); lbl(L.wall, w('g.gets'), 39.5, 66.8, 'hot wrap').style.maxWidth = '36%'; lbl(L.wall, w('g.twice'), 62, 30.2, 'up');
    btn(L.wall, w('m.wall.go') + ' →', [27, 82, 46], () => S.onWallGo && S.onWallGo());
    pl.sync = () => { const v = viewAt(S.d); for (const k in L) L[k].classList.toggle('on', k === v);
      if (v === 'one') put(bitE, (S.press > .5 ? '1' : '0') + '<small>' + (S.press > .5 ? w('bit.1') : w('bit.0')) + '</small>');
      else if (v === 'die') { glass.style.opacity = S.d > 15 ? 1 : 0; put(glass, w('form.' + formAt(S.d))); }
      else if (v === 'job') { put(jb, w('mo.job.' + S.job + '.v')); if (+jr.value !== S.job) jr.value = S.job; }
      else if (v === 'bug') put(bb, S.bug.worst ? w('bug.found') : S.bug.n ? w('mo.bug.wrong0') + '<small>' + w('bug.in', { n: nf(S.bug.n) }) + '</small>' : '');
      else if (v === 'light') { ls(); put(lam, w(LIGHTS[S.light] === 'euv' ? 'light.euv' : 'light.duv')); } };
  }
};

/* ---------------- the four walls ---------------- */
export const leakX = () => Math.pow(10, S.leak / 60);
export const OUTS = {
  leak: () => (S.leak ? w('w.switch.out', { n: nf(leakX()), mv: S.leak }) : w('w.switch.out0')),
  distance: () => w('w.memory.o' + 'abc'[S.dist]) + ' ' + src('energy-moving-data'),
  power: () => { const g = S.power.g; return S.power.shown ? w('w.power.out', { n: g, verdict: w(g < 800 ? 'w.power.low' : g > 1100 ? 'w.power.high' : 'w.power.near') }) + ' ' + src('dc-electricity') : w('w.power.guess', { n: g }); },
  price: () => w('w.cost.o' + 'ab'[S.price]) + ' ' + (S.price ? src('wafer-space-run', 'design-cost-2nm') : src('design-cost-older', 'design-cost-recent', 'design-cost-2nm')),
  next: () => { const i = S.next.at; if (i < 0) return w('next.out0'); const r = RUNGS[i]; return '<b>' + w('rung.' + r[0] + '.t') + '</b> ' + w('rung.' + r[0] + '.d') + ' ' + src(...r[2]); },
  levels: () => (S.lv === 3 ? '<b>' + w('arr.classic.t') + '</b> ' + w('arr.classic.d') : w('lv.' + (3 - S.lv) + '.d')),
  eras: () => { const e = ERAS[S.era]; return '<b>' + w('era.' + e[0] + '.t') + '</b> ' + w('era.' + e[0] + '.d') + ' ' + src(...e[2]); },
  arr: () => { const a = ARR[S.arr], id = a[0], n = ['cim', 'spikes'].filter(k => S.arrSeen[k]).length;
    return '<b>' + (id === 'classic' ? w('arr.classic.t') : t('bp.next.' + id + '.t')) + '</b> ' + (id === 'classic' ? w('arr.classic.d') : t('bp.next.' + id + '.d')) + ' ' + src(...a[2]) + '<br><span class="mono dim">' + w('arr.trip') + '</span> ' + w('trip.' + TRIP[id]) + (a[1] ? ' · <span class="mono dim">' + w('status.' + a[1]) + '</span>' : '') +
      '<br><span class="ok">' + (n >= 2 ? w('arch.ch.done') + ' ' + w('arch.ch.why') : w('arr.found', { n, of: 2 })) + '</span>'; },
  machine: () => { const m = machNow(); return sw('machines.need.' + m.need.id + '.why') + (m.ok ? '' : '<br><span class="ok">' + w('mach.bad', { part: w('piece.' + m.bad).toLowerCase() }) + '</span>') + (S.agent ? '<br>' + w('tri.gen.done', S.agent) : '') + (S.kept ? ' <b class="ok">' + w('tri.dec.done') + '</b>' : ''); },
  island: () => { const p = S.place; if (!p) return w('isle.out0'); const lit = LIT[p](); return '<b>' + w('place.' + p) + '</b> ' + w('tr.' + p + (lit || p === 'port' ? '' : '.0')) + '<br>' + lab(w('tr.' + p + '.go'), '#/place/' + p); }
};
export const out = id => setOut(id, OUTS[id]());

PL.leak = {
  frame: () => [w('pl.leak'), S.leak ? '−' + S.leak + ' mV' : ''],
  paint(c, T) { const lg = S.leak / 60; bigT(c, 1, T, 0, { leak: lg, volt: 1 - S.leak / 330 });
    for (let i = 0; i < 14; i++) glyph(c, 96 + i * 62, 880, 17, 0, 1, 2.4, 'planar', Math.min(1, lg / 5)); },
  ui(host, pl) { const r = h('input', 'rng'); r.type = 'range'; r.min = 0; r.max = 300; r.step = 10; r.value = S.leak; r.setAttribute('aria-label', w('w.switch.q')); at(r, 9, 5.5, 82); host.appendChild(r);
    r.oninput = () => { S.leak = +r.value; tried('switch'); out('leak'); };
    lbl(host, w('w.switch.lo'), 9, 12); lbl(host, w('w.switch.hi'), 91, 12, 'r'); lbl(host, w('t.gate'), 50, 17.5, 'c'); lbl(host, w('leak.row'), 6, 93.5);
    const b = big(host, 9, 18.5); pl.sync = () => { put(b, '×' + (S.leak ? nf(leakX()) : '1') + '<small>' + w('leak.unit') + '</small>'); if (+r.value !== S.leak) r.value = S.leak; }; }
};
export function memBlock(c, x, y, ww, hh, n, a) { c.fillStyle = K.plate; c.fillRect(x, y, ww, hh); c.strokeStyle = K.ink; c.lineWidth = 3.5; c.strokeRect(x, y, ww, hh);
  const m = ww * .07, cw = (ww - 2 * m) / n, rows = Math.max(1, Math.round((hh - 2 * m) / cw)), ch = (hh - 2 * m) / rows; c.fillStyle = fg(.45 * (a || 1));
  for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) c.fillRect(x + m + i * cw + cw * .14, y + m + j * ch + ch * .14, cw * .72, ch * .72); }
export function logicBlock(c, x, y, ww, hh, n) { c.fillStyle = K.plate; c.fillRect(x, y, ww, hh); c.strokeStyle = K.ink; c.lineWidth = 3.5; c.strokeRect(x, y, ww, hh);
  const m = ww * .08, cw = (ww - 2 * m) / n, rows = Math.max(1, Math.round((hh - 2 * m) / cw)), ch = (hh - 2 * m) / rows;
  for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { const k = rnd(i * 17 + j * 5 + n); c.fillStyle = fg(.16 + .3 * k); c.fillRect(x + m + i * cw + cw * .1, y + m + j * ch + ch * .1, cw * (.5 + .3 * k), ch * .8); } }
PL.distance = {
  pts: { mem: [26, 30], logic: [72, 60] },
  frame: () => [w('pl.distance'), ['640 pJ', '8–11 pJ', '?'][S.dist]],
  paint(c, T) { const k = Math.min(1, S.distK), k2 = clamp(S.distK - 1, 0, 1), L2 = (a, b) => lerp(a, b, k);
    if (k2 < 1) { c.globalAlpha = 1 - k2;
      const m = [L2(90, 170), L2(180, 290), 320, L2(300, 380)], g = [L2(590, 510), L2(470, 290), 320, L2(330, 380)];
      if (k > .5) { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.setLineDash([9, 8]); c.strokeRect(140, 255, 720, 450); c.setLineDash([]); }
      else for (const r of [m, g]) { c.strokeStyle = fg(.5); c.lineWidth = 2; c.setLineDash([9, 8]); c.strokeRect(r[0] - 26, r[1] - 26, r[2] + 52, r[3] + 52); c.setLineDash([]); }
      const p = k > .5 ? [[m[0] + m[2], m[1] + m[3] / 2], [g[0], g[1] + g[3] / 2]] : [[m[0] + m[2], m[1] + 230], [g[0] + 160, m[1] + 230], [g[0] + 160, g[1]]];
      path(c, p, K.ink, 3); memBlock(c, ...m, 8); logicBlock(c, ...g, 4); c.globalAlpha = 1 - k2; train(c, p, T, 6, k > .5 ? .9 : .32, 13); c.globalAlpha = 1; }
    if (k2 > 0) { c.globalAlpha = k2; c.strokeStyle = K.ink; c.lineWidth = 2.5; c.setLineDash([9, 8]); c.strokeRect(140, 255, 720, 450); c.setLineDash([]);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = 180 + i * 220, y = 290 + j * 200; logicBlock(c, x, y, 200, 180, 3); memBlock(c, x + 100, y + 14, 86, 86, 4);
        if (rnd(mix(i * 3 + j, Math.floor(T * 3))) < .4) { c.fillStyle = K.red; c.fillRect(x + 100 + 20 + 30 * rnd(i + j), y + 38, 13, 13); } } c.globalAlpha = 1; }
    /* what the trip costs, against the sum itself: steps of ten */
    const X = v => 100 + (Math.log10(v) + 1) / 4 * 800, v = [640, 9.5, .18][S.dist], yb = 862; c.fillStyle = fg(.14); c.fillRect(100, yb, 800, 8); c.fillStyle = K.red; c.fillRect(X(.18), yb - 5, Math.max(8, X(v) - X(.18)), 18);
    c.fillStyle = K.ink; for (const q of [.18, 9.5, 640]) c.fillRect(X(q) - 1.5, yb - 14, 3, 36); },
  ui(host, pl) { const s = seg(host, ['a', 'b', 'c'].map(k => w('w.memory.' + k)), () => S.dist, i => { S.dist = i; tried('memory'); out('distance'); }, [6, 4, 88]);
    const m = lbl(host, w('s.mem'), 9, 13.5), g = lbl(host, w('s.logic'), 91, 13.5, 'r'); const X = v => 10 + (Math.log10(v) + 1) / 4 * 80;
    lbl(host, w('pj.sum'), X(.18) - .4, 90.5); lbl(host, '8–11 pJ', X(9.5), 90.5, 'c').style.transform = 'translate(-50%,0)'; lbl(host, '640 pJ', X(640), 90.5, 'r');
    pl.sync = () => { s(); m.style.opacity = g.style.opacity = S.dist === 2 ? 0 : 1; }; }
};
PL.power = {
  frame: () => [w('pl.power'), 'TWh'],
  paint(c) { const yb = 830, sc = .43, k = S.power.k || 0, now = FIG.dc.v, y30 = FIG.dc2030.v;
    c.fillStyle = fg(.5); for (const v of [500, 1000, 1500]) { c.fillStyle = fg(.14); c.fillRect(120, yb - v * sc, 780, 2); }
    c.fillStyle = K.ink; c.fillRect(120, yb, 780, 3);
    c.fillStyle = K.ink; c.fillRect(170, yb - now * sc, 170, now * sc);
    const gh = S.power.g * sc; hatch(c, 415, yb - gh, 170, gh, 13, K.ink, 2); c.strokeStyle = K.ink; c.lineWidth = 3; c.strokeRect(415, yb - gh, 170, gh);
    if (k > .01) { c.fillStyle = K.red; c.fillRect(660, yb - y30 * sc * k, 170, y30 * sc * k); } else { c.strokeStyle = fg(.4); c.lineWidth = 2; c.setLineDash([8, 8]); c.strokeRect(660, yb - 200, 170, 200); c.setLineDash([]); } },
  ui(host, pl) { const yb = 83, sc = .043, twh = v => '<b>' + nf(v) + ' TWh</b>', tag = (html, x, cls) => { const e = lbl(host, html, x, 85.5, 'c col' + (cls ? ' ' + cls : '')); e.style.transform = 'translate(-50%,0)'; return e; };
    tag(w('s.pnow') + twh(FIG.dc.v), 25.5); const gl = tag('', 50, 'hot'), fl = tag('', 74.5);
    for (const v of [500, 1000, 1500]) lbl(host, nf(v), 11.5, yb - v * sc - 1.2, 'r');
    /* i18n-ok: styles */ const hd = h('div', 'pw-h'); hd.style.cssText = 'width:21%;height:5%;background:var(--red);cursor:ns-resize;transform:translate(0,-50%);touch-action:none;display:grid;place-items:center;color:#fff'; hd.innerHTML = '<span class="lb" style="position:static">↕ ' + w('power.drag') + '</span>'; hd.classList.add('nohold'); host.appendChild(hd);
    /* i18n-ok: styles */ const col = h('div', 'nohold'); at(col, 39.5, 14, 21, 69); col.style.cssText += ';cursor:ns-resize;touch-action:none'; host.insertBefore(col, hd);
    const drag = e => { const r = host.getBoundingClientRect(), y = (e.clientY - r.top) / r.height * 100; S.power.g = Math.round(clamp((yb - y) / sc, 100, 1550) / 10) * 10; tried('power'); out('power'); };
    for (const el of [hd, col]) { el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); el._d = 1; drag(e); e.preventDefault(); }); el.addEventListener('pointermove', e => { if (el._d) drag(e); }); el.addEventListener('pointerup', () => { el._d = 0; }); el.addEventListener('pointercancel', () => { el._d = 0; }); }
    const b = btn(host, w('w.power.reveal'), [66, 5, 25], () => { S.power.shown = 1; tried('power'); out('power'); });
    pl.sync = () => { at(hd, 39.5, yb - S.power.g * sc); put(gl, w('s.pguess') + twh(S.power.g)); put(fl, w('s.p2030') + (S.power.shown ? twh(FIG.dc2030.v) : '<b>?</b>')); fl.classList.toggle('hot', !!S.power.shown); b.style.display = S.power.shown ? 'none' : ''; }; }
};
export let dotPat = null, dotKey = '';
PL.price = {
  frame: () => [w('pl.price'), S.price ? w('price.dots') : w('price.scale')],
  paint(c, T) { const x0 = 110, yb = 905, sd = v => 770 * Math.sqrt(v / 725);
    if (S.price) { const key = K.ink; if (dotKey !== key) { dotKey = key; const pc = document.createElement('canvas'); pc.width = pc.height = 8; const g = pc.getContext('2d'); g.fillStyle = K.ink; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.fillRect(i * 4 + 1, j * 4 + 1, 2, 2); dotPat = pc; }
      c.save(); c.beginPath(); c.rect(x0, yb - 770, 770, 770); c.clip(); const pt = c.createPattern(dotPat, 'repeat'); pt.setTransform(new DOMMatrix().scale(770 / 322 / 4)); c.fillStyle = pt; c.fillRect(x0, yb - 770, 770, 770); c.restore();
      c.strokeStyle = K.red; c.lineWidth = 4; c.strokeRect(x0, yb - 770, 770, 770);
      const gx = 640, gy = 370, gr = 150; c.save(); c.beginPath(); c.arc(gx, gy, gr, 0, 7); c.fillStyle = K.plate; c.fill(); c.clip(); for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { c.fillStyle = i === 0 && j === 0 ? K.red : K.ink; c.fillRect(gx + i * 40 - 11, gy + j * 40 - 11, 22, 22); } c.restore(); c.strokeStyle = K.ink; c.lineWidth = 5; c.beginPath(); c.arc(gx, gy, gr, 0, 7); c.stroke(); return; }
    COST.forEach(([node, v], i) => { const s = sd(v), last = i === COST.length - 1; if (last) hatch(c, x0, yb - s, s, s, 16, rd(.3), 2); c.strokeStyle = last ? K.red : K.ink; c.lineWidth = last ? 4.5 : 2.6; c.strokeRect(x0, yb - s, s, s); }); },
  ui(host, pl) { const s = seg(host, [w('w.cost.a'), w('w.cost.b')], () => S.price, i => { S.price = i; tried('cost'); out('price'); }, [6, 4, 88]);
    const A = h('div', 'layer'), B = h('div', 'layer'); host.append(A, B); const sd = v => 77 * Math.sqrt(v / 725);
    /* each price in its square's corner, the node above it; a price too long for a small square on a small plate is
       left to the words beside the picture rather than cut off */
    const cl = COST.map(([node, v], i) => { const e = lbl(A, node + '<b>' + money(v * 1e6) + '</b>', 11 + sd(v) - .8, 90.5 - sd(v) + .8, 'r' + (i === COST.length - 1 ? ' hot' : '')); if (i === 4) e.style.display = 'none'; return e; });
    lbl(B, w('s.c2'), 64, 53.5, 'c hot').style.transform = 'translate(-50%,0)'; let cw = 0;
    pl.sync = () => { s(); A.classList.toggle('on', !S.price); B.classList.toggle('on', !!S.price);
      const ck = host.clientWidth + (document.fonts ? document.fonts.status : ''); if (ck !== cw) { cw = ck; const pw = host.clientWidth; cl.forEach((e, i) => { if (i !== 4) e.style.visibility = e.offsetWidth > (11 + sd(COST[i][1]) - .8) / 100 * pw ? 'hidden' : ''; }); } }; }
};

/* ---------------- the next fifty years: down the ladder of energy per bit, to the floor ---------------- */
export const NX0 = Math.log10(RUNGS[0][1]), NX1 = Math.log10(RUNGS[RUNGS.length - 1][1]), RP = RUNGS.map(r => (NX0 - Math.log10(r[1])) / (NX0 - NX1));
export const fmtE = j => { const u = [['pJ', 1e-12], ['fJ', 1e-15], ['aJ', 1e-18], ['zJ', 1e-21]].find(q => j >= q[1] * .99) || ['zJ', 1e-21]; const v = j / u[1]; return (v >= 10 ? Math.round(v) : v.toFixed(1)) + ' ' + u[0]; };
PL.next = {
  frame: () => [w('pl.next'), fmtE(Math.pow(10, lerp(NX0, NX1, S.next.pos))) + ' ' + w('next.abit')],
  paint(c, T) { const y0 = 240, hh = 640, Y = p => y0 + p * hh, ax = 470, pos = S.next.pos;
    /* behind, and ahead: fifty years of shrinking against the room left in energy, on the same scale of tens */
    const bh = Math.log10(BEHIND) / Math.log10(AHEAD) * hh; c.fillStyle = K.ink; c.fillRect(110, Y(1) - bh, 70, bh);
    c.strokeStyle = K.ink; c.lineWidth = 3; c.strokeRect(215, y0, 70, hh); c.fillStyle = K.red; c.fillRect(215, y0, 70, hh * pos);
    path(c, [[ax, y0], [ax, Y(1)]], K.ink, 3); hatch(c, ax - 26, Y(RP[2]) + 24, 52, Y(1) - Y(RP[2]) - 48, 12, fg(.5), 2);
    RUNGS.forEach((r, i) => { if (i === 3) return; const y = Y(RP[i]), hit = S.next.at >= i; c.fillStyle = i === 4 ? K.red : hit ? K.red : K.ink; c.fillRect(ax - 34, y - (i === 4 ? 5 : 2.5), i === 4 ? 440 : 68, i === 4 ? 10 : 5); });
    const my = Y(pos); c.fillStyle = K.red; c.fillRect(ax - 17, my - 17, 34, 34); if (S.next.hold && pos < 1) { c.globalAlpha = .4; c.fillRect(ax - 3, my - 60, 6, 44); c.globalAlpha = 1; } },
  ui(host, pl) { const Y = p => 24 + p * 64;
    const ls = RUNGS.map((r, i) => lbl(host, '<b>' + w('rung.' + r[0] + '.t') + '</b>' + (i === 3 ? w('nx.zone') : fmtE(r[1]) + ' ' + w('next.abit')), 53, Y(RP[i]) - (i === 4 ? 6.6 : 1.6), 'wrap'));
    /* each bar's name ends just above its bar, however many lines it takes */
    lbl(host, w('nx.behind') + '<b>×' + sig(BEHIND, 3) + '</b>', 18.2, 35.5, 'r up wrap side'); const ah = lbl(host, '', 21.5, 23, 'up wrap');
    /* its own hold button: beside the ladder on a wide plate; on a phone, in the empty corner above the bars */
    const b = big(host, 53, 3.5); const hb = h('button', 'holdbtn', w('btn')); hb.type = 'button'; host.appendChild(hb); let hbAt = '';
    bindHold(host, () => { S.next.hold = true; }, () => { S.next.hold = false; });
    pl.sync = () => { const x = Math.pow(10, (NX0 - NX1) * S.next.pos), ph = innerWidth <= 760 ? 'p' : 'd'; if (hbAt !== ph) { hbAt = ph; at(hb, ...(ph === 'p' ? [3, 2] : [77, 49])); }
      put(b, (x < 1.5 ? '×1' : w('nx.x', { x: x < 1e4 ? nf(x) : xOf(x) })) + '<small>' + w('nx.unit') + '</small>'); put(ah, w('nx.ahead') + '<b>×' + sig(AHEAD, 2) + '</b>');
      ls.forEach((e, i) => e.classList.toggle('hot', S.next.at === i)); hb.style.opacity = S.next.pos >= 1 ? .25 : 1; hb.classList.toggle('down', !!S.next.hold); }; }
};

/* ---------------- how a computer is arranged ---------------- */
export function blockView(c, T) { c.strokeStyle = fg(.5); c.lineWidth = 2.5; c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(140, 215 + i * 142); c.lineTo(860, 215 + i * 142); c.moveTo(215 + i * 142, 140); c.lineTo(215 + i * 142, 860); } c.stroke();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = 250 + i * 142, y = 250 + j * 142, on = rnd(mix(i * 4 + j, Math.floor(T * 1.6 + i * .3))) < .4; c.fillStyle = on ? K.red : K.plate; c.strokeStyle = on ? K.red : K.ink; c.lineWidth = 3.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 36, y); c.arc(x + 36, y + 36, 36, -Math.PI / 2, Math.PI / 2); c.lineTo(x, y + 72); c.closePath(); c.fill(); c.stroke();
    path(c, [[x - 35, y + 20], [x, y + 20]], K.ink, 2.5); path(c, [[x - 35, y + 52], [x, y + 52]], K.ink, 2.5); path(c, [[x + 72, y + 36], [x + 107, y + 36]], on ? K.red : K.ink, on ? 4 : 2.5); } }
export function arrView(c, T, id) {
  if (id === 'classic') { const p = [[270, 610], [270, 760], [730, 760], [730, 610]]; c.strokeStyle = fg(.5); c.lineWidth = 2; c.setLineDash([9, 8]); c.strokeRect(80, 230, 380, 430); c.strokeRect(540, 230, 380, 430); c.setLineDash([]); path(c, p, K.ink, 3.5); logicBlock(c, 110, 260, 320, 350, 4); memBlock(c, 570, 260, 320, 350, 8); train(c, p, T, 6, .3, 14); }
  else if (id === 'stack') { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.setLineDash([9, 8]); c.strokeRect(150, 230, 700, 520); c.setLineDash([]); logicBlock(c, 200, 310, 330, 360, 4); for (let i = 4; i >= 0; i--) memBlock(c, 600 + i * 16, 300 + i * 16 - 30, 170, 330, 5, i ? .4 : 1); const p = [[530, 490], [600, 490]]; path(c, p, K.ink, 3.5); train(c, p, T, 2, 1.6, 14); }
  else if (id === 'cim') { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.setLineDash([9, 8]); c.strokeRect(150, 230, 700, 520); c.setLineDash([]); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const x = 185 + i * 162, y = 265 + j * 158; memBlock(c, x, y, 144, 100, 5); c.fillStyle = fg(.3); c.fillRect(x, y + 106, 144, 26); c.strokeStyle = K.ink; c.lineWidth = 3; c.strokeRect(x, y + 106, 144, 26); if (rnd(mix(i * 3 + j, Math.floor(T * 3))) < .45) { c.fillStyle = K.red; c.fillRect(x + 12 + 100 * rnd(i * 7 + j + Math.floor(T * 3)), y + 112, 14, 14); } } }
  else if (id === 'light') { logicBlock(c, 70, 380, 220, 240, 3); memBlock(c, 710, 380, 220, 240, 6); c.strokeStyle = fg(.5); c.lineWidth = 2; c.beginPath(); c.moveTo(290, 478); c.lineTo(710, 478); c.moveTo(290, 522); c.lineTo(710, 522); c.stroke();
    c.strokeStyle = K.red; c.lineWidth = 4; c.beginPath(); for (let x = 290; x <= 710; x += 3) { const y = 500 + 15 * Math.sin((x - T * 260) / 22) * Math.min(1, (x - 290) / 40, (710 - x) / 40); if (x === 290) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    c.strokeStyle = fg(.5); c.setLineDash([9, 8]); c.lineWidth = 2; c.strokeRect(40, 340, 280, 320); c.strokeRect(680, 340, 280, 320); c.setLineDash([]); }
  else { const N = []; for (let i = 0; i < 16; i++) N.push([150 + (i % 4) * 230 + 70 * (rnd(i * 5) - .5), 280 + Math.floor(i / 4) * 150 + 60 * (rnd(i * 9 + 3) - .5)]);
    c.strokeStyle = fg(.28); c.lineWidth = 2; c.beginPath(); N.forEach((p, i) => { for (const j of [i + 1, i + 4, i + 5]) if (N[j] && (j % 4 !== 0 || j === i + 4)) { c.moveTo(p[0], p[1]); c.lineTo(N[j][0], N[j][1]); } }); c.stroke();
    N.forEach((p, i) => { const ph = (T * .5 + rnd(i * 13) * 4) % 4, on = ph < .5; c.fillStyle = on ? K.red : K.plate; c.strokeStyle = on ? K.red : K.ink; c.lineWidth = 3.5; c.beginPath(); c.arc(p[0], p[1], 30, 0, 7); c.fill(); c.stroke(); c.fillStyle = on ? '#fff' : fg(.55); c.fillRect(p[0] - 9, p[1] - 9, 18, 18);
      if (on) { c.globalAlpha = 1 - ph * 2; c.strokeStyle = K.red; c.lineWidth = 3; c.beginPath(); c.arc(p[0], p[1], 30 + ph * 70, 0, 7); c.stroke(); c.globalAlpha = 1; } }); }
}
PL.levels = {
  frame: () => [w('pl.levels'), w('lv.' + (3 - S.lv))],
  paint(c, T) { const k = S.lvK; for (let n = 0; n < 4; n++) { const e = k - n; if (Math.abs(e) >= .98) continue; const sc = e > 0 ? 1 / (1 + 5 * e) : 1 + 2 * -e, a = 1 - Math.abs(e);
    c.save(); c.translate(500, 500); c.scale(sc, sc); c.translate(-500, -500); c.globalAlpha = a;
    if (n === 0) bigT(c, a, T, Math.floor(T / 1.6) % 2); else if (n === 1) drawNand(c, Math.floor(T / 1.2) % 2, Math.floor(T / 2.4) % 2, a); else if (n === 2) blockView(c, T); else arrView(c, T, 'classic');
    c.restore(); c.globalAlpha = 1; } },
  ui(host, pl) { const s = seg(host, [3, 2, 1, 0].map(i => w('lv.' + i)), () => S.lv, i => { S.lv = i; out('levels'); }, [6, 89, 88]);
    const a = lbl(host, w('s.logic'), 11, 21.5), b = lbl(host, w('s.mem'), 89, 21.5, 'r'); pl.sync = () => { s(); a.style.opacity = b.style.opacity = S.lv === 3 && S.lvK > 2.7 ? 1 : 0; }; }
};
PL.eras = {
  frame: () => [w('era.k'), ERAS[S.era][1] + ' →'],
  paint(c, T) { const id = ERAS[S.era][0];
    if (id === 'clock') { const k = (T % 7) / 7, per = lerp(170, 26, k); c.fillStyle = rd(.5 * k * k); c.fillRect(300, 400, 400, 400); logicBlock(c, 300, 400, 400, 400, 5); if (k > .05) { c.fillStyle = rd(.55 * k * k); c.fillRect(300, 400, 400, 400); }
      c.strokeStyle = K.ink; c.lineWidth = 4; c.beginPath(); let x = 110, up = 0; c.moveTo(x, 300); while (x < 890) { const nx = Math.min(890, x + per / 2); c.lineTo(x, up ? 220 : 300); c.lineTo(nx, up ? 220 : 300); x = nx; up ^= 1; } c.stroke(); }
    else if (id === 'cores') { const p = [[440, 520], [600, 520]]; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) logicBlock(c, 110 + i * 170, 320 + j * 220, 150, 190, 3); path(c, [[430, 415], [470, 415], [470, 635], [430, 635]], K.ink, 3.5); path(c, [[470, 520], [640, 520]], K.ink, 3.5); memBlock(c, 640, 320, 250, 410, 7);
      c.fillStyle = K.red; for (let i = 0; i < 5; i++) { const f = (T * .35 + i / 5) % 1; c.fillRect(470 + f * 160 - 7, 513, 14, 14); } }
    else if (id === 'special') { for (let i = 0; i < 16; i++) for (let j = 0; j < 11; j++) { const on = rnd(mix(i * 16 + j, Math.floor(T * 5))) < .32; c.fillStyle = on ? K.red : fg(.2); c.fillRect(124 + i * 47.5, 250 + j * 47.5, 38, 38); } c.strokeStyle = K.ink; c.lineWidth = 3.5; c.strokeRect(104, 230, 792, 554); }
    else { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.setLineDash([9, 8]); c.strokeRect(110, 230, 780, 560); c.setLineDash([]); const hub = [410, 440, 180, 140];
      for (let i = 0; i < 8; i++) { const x = 150 + (i % 4) * 185, y = i < 4 ? 270 : 610, cx = x + 72, cy = i < 4 ? y + 130 : y; path(c, [[cx, cy], [cx, i < 4 ? 440 + 0 : 580], [500, i < 4 ? 440 : 580]], fg(.5), 2.5); logicBlock(c, x, y, 145, 130, 3); if (rnd(mix(i, Math.floor(T * 2))) < .4) { c.fillStyle = K.red; c.fillRect(cx - 7, i < 4 ? 410 : 590, 14, 14); } }
      memBlock(c, ...hub, 6); } },
  ui(host, pl) { const sg = h('div', 'seg'); ERAS.forEach((e, i) => { const b = h('button', '', w('era.' + e[0] + '.b')); b.type = 'button'; b.onclick = () => { S.era = i; S.eraSeen[i] = 1; if (Object.keys(S.eraSeen).length === ERAS.length) done('eras'); out('eras'); }; sg.appendChild(b); }); at(sg, 6, 89, 88); host.appendChild(sg);
    const y = big(host, 9, 4); pl.sync = () => { [...sg.children].forEach((b, i) => { b.classList.toggle('on', S.era === i); b.classList.toggle('seen', !!S.eraSeen[i] && S.era !== i); }); put(y, ERAS[S.era][1] + '<small>' + w('era.' + ERAS[S.era][0] + '.t') + '</small>'); }; }
};
PL.arr = {
  pts: { trip: [50, 76] },
  frame: () => [w('pl.arr'), w('trip.' + TRIP[ARR[S.arr][0]]).split(',')[0]],
  paint(c, T) { arrView(c, T, ARR[S.arr][0]); },
  ui(host, pl) { const sg = h('div', 'seg wrap'); ARR.forEach((a, i) => { const b = h('button', '', w('arr.' + a[0] + '.b')); b.type = 'button'; b.onclick = () => { S.arr = i; S.arrSeen[a[0]] = 1; if (S.arrSeen.cim && S.arrSeen.spikes) done('arr'); pl.fade = 1; out('arr'); }; sg.appendChild(b); }); at(sg, 4, 86, 92); host.appendChild(sg);
    const tr = lbl(host, '', 9, 6); pl.sync = () => { [...sg.children].forEach((b, i) => { b.classList.toggle('on', S.arr === i); }); put(tr, w('arr.trip') + '<b>' + w('trip.' + TRIP[ARR[S.arr][0]]) + '</b>'); }; }
};

/* ---------------- your machine: pick a need, set each block's form; an agent generates, engines check, you decide ---------------- */
export const formOf = (need, part) => (STOCK.includes(part[1]) ? 'stock' : S.forms[need.id + '.' + part[0]] || 'software');
export function machEnergy(need, get) { let e = 0, tot = 0; for (const p of need.parts) { const f = get(p); e += p[2] * (f === 'stock' ? 1 : FCOST[f]); tot += p[2]; } return e / tot; }
export function machNow() { const need = NEEDS[S.need], bad = need.change.find(id => formOf(need, need.parts.find(p => p[0] === id)) === 'circuit'); return { need, e: machEnergy(need, p => formOf(need, p)), ok: !bad, bad }; }
export function agent() { const need = NEEDS[S.need], free = need.parts.filter(p => !STOCK.includes(p[1])); let n = 0, ok = 0, best = null;
  (function rec(i, pick) { if (i === free.length) { n++; const good = !need.change.some(id => pick[id] === 'circuit'); if (!good) return; ok++; const e = machEnergy(need, p => (STOCK.includes(p[1]) ? 'stock' : pick[p[0]])); if (!best || e < best.e) best = { e, pick: { ...pick } }; return; }
    for (const f of FORMS) { pick[free[i][0]] = f; rec(i + 1, pick); } })(0, {});
  for (const id in best.pick) S.forms[need.id + '.' + id] = best.pick[id]; S.agent = { n, ok }; }
export const tilePos = (need, i) => { const n = need.parts.length, sp = n > 4 ? 172 : 205, x0 = 500 - (n - 1) * sp / 2; return [x0 + i * sp, 400 + (i % 2 ? 62 : -62)]; };
PL.machine = {
  frame: () => [w('s.yours'), sw('machines.need.' + NEEDS[S.need].id + '.t')],
  paint(c, T) { const need = NEEDS[S.need], ts = need.parts.length > 4 ? 138 : 158;
    for (const [a, b] of need.wires) { const p = tilePos(need, a), q = tilePos(need, b), pp = [p, [q[0], p[1]], q]; path(c, pp, K.ink, 3.5); c.fillStyle = K.red; const pt = along(pp, (T * .5 + a * .3) % 1); c.fillRect(pt[0] - 7, pt[1] - 7, 14, 14); }
    need.parts.forEach((p, i) => { const [cx, cy] = tilePos(need, i), x = cx - ts / 2, y = cy - ts / 2, f = formOf(need, p), bad = need.change.includes(p[0]) && f === 'circuit';
      c.fillStyle = K.plate; c.fillRect(x, y, ts, ts);
      if (f === 'stock') hatch(c, x, y, ts, ts, 18, fg(.22), 2);
      else if (f === 'software') { c.fillStyle = fg(.5); for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) c.fillRect(x + 14 + a * (ts - 28) / 5 - 3, y + 14 + b * (ts - 28) / 5 - 3, 6, 6); }
      else if (f === 'circuit') { c.fillStyle = K.ink; c.fillRect(x, y, ts, ts); c.strokeStyle = K.plate; c.lineWidth = 2.5; c.beginPath(); for (let a = 1; a < 5; a++) { c.moveTo(x + a * ts / 5, y + 12); c.lineTo(x + a * ts / 5, y + ts - 12); } c.stroke(); }
      else { c.strokeStyle = K.ink; c.lineWidth = 3; c.beginPath(); for (let a = 0; a < 5; a++) { const yy = y + 22 + a * (ts - 44) / 4; for (let xx = 0; xx <= ts - 24; xx += 4) { const py = yy + 7 * Math.sin(xx / 13 + T * 2.2 + a); if (!xx) c.moveTo(x + 12, py); else c.lineTo(x + 12 + xx, py); } } c.stroke(); }
      c.strokeStyle = bad ? K.red : K.ink; c.lineWidth = bad ? 6 : 3.5; c.strokeRect(x, y, ts, ts);
      if (need.change.includes(p[0])) { c.fillStyle = K.red; c.beginPath(); c.moveTo(x + ts, y); c.lineTo(x + ts - 34, y); c.lineTo(x + ts, y + 34); c.fill(); } }); },
  ui(host, pl) { const s = seg(host, NEEDS.map(n => sw('machines.need.' + n.id + '.t')), () => S.need, i => { S.need = i; S.agent = null; S.kept = false; pl.fade = 1; out('machine'); build(); }, [6, 4, 88]);
    const sub = lbl(host, '', 6, 12.5), tiles = h('div', 'layer on'); host.appendChild(tiles); let tb = [];
    const build = () => { tiles.innerHTML = ''; tb = []; const need = NEEDS[S.need], ts = need.parts.length > 4 ? 13.8 : 15.8;
      /* i18n-ok: styles */ need.parts.forEach((p, i) => { const [cx, cy] = tilePos(need, i), b = h('button', 'mtile'); b.type = 'button'; at(b, cx / 10 - ts / 2 - 3, cy / 10 - ts / 2, ts + 6, ts + 6.4); b.style.cssText += ';display:flex;flex-direction:column;justify-content:flex-end;align-items:center;text-align:center;line-height:1.1';
        b.innerHTML = '<b style="font-weight:600;font-size:.92em;white-space:nowrap"></b><span class="lb" style="position:static;font-size:max(11px,calc(var(--p)*16))"></span>'; if (STOCK.includes(p[1])) b.disabled = true;
        b.onclick = () => { const k = need.id + '.' + p[0], f = S.forms[k] || 'software'; S.forms[k] = FORMS[(FORMS.indexOf(f) + 1) % FORMS.length]; S.kept = false; out('machine'); }; tiles.appendChild(b); tb.push([b, p]); }); };
    build();
    /* i18n-ok: styles */ const tri = h('div', 'tri'); at(tri, 6, 70.5, 88, 25); tri.style.cssText += ';display:grid;grid-template-columns:1fr 1.15fr 1fr;border:1.5px solid var(--ink);background:var(--plate)'; host.appendChild(tri);
    /* i18n-ok: styles */ const cell = (k, who) => { const d = h('div'); d.style.cssText = 'padding:5% 6% 4%;border-left:1.5px solid var(--ink);display:flex;flex-direction:column;justify-content:space-between;gap:4px;min-width:0'; d.innerHTML = '<span class="lb" style="position:static">' + w('tri.' + k) + ' · <span class="red">' + w('tri.' + k + '.who') + '</span></span>'; tri.appendChild(d); return d; };
    const g = cell('gen'), ck = cell('chk'), dc = cell('dec'); g.style.borderLeft = '0';
    const gb = h('button', 'pbtn ghost', w('tri.gen.b')); gb.type = 'button'; gb.style.position = 'static'; gb.onclick = () => { agent(); out('machine'); }; g.appendChild(gb);
    /* i18n-ok: styles */ const en = h('div', 'big'); en.style.cssText = 'position:static;font-size:calc(var(--p)*76)'; ck.appendChild(en);
    /* i18n-ok: styles */ const kb = h('button', 'pbtn', w('tri.dec.b')); kb.type = 'button'; kb.style.cssText = 'position:static;white-space:normal'; kb.onclick = () => { S.kept = true; done('keep'); out('machine'); out('island'); }; dc.appendChild(kb);
    const sg = host.querySelector('.seg');
    pl.sync = () => { s(); const m = machNow(); put(sub, sw('machines.need.' + m.need.id + '.d')); [...sg.children].forEach((b, i) => put(b, sw('machines.need.' + NEEDS[i].id + '.t'))); if (tb.length !== m.need.parts.length || tb[0][1] !== m.need.parts[0]) build();
      tb.forEach(([b, p]) => { const f = formOf(m.need, p); put(b.children[0], w('piece.' + p[0])); put(b.children[1], f === 'stock' ? w('form.stock') : w('form.' + f)); b.children[1].classList.toggle('hot', m.bad === p[0]); });
      put(en, '×' + (m.e >= 10 ? Math.round(m.e) : m.e.toFixed(1)) + '<small style="font-size:max(11px,calc(var(--p)*15.5))">' + (m.ok ? w('mach.ok') : w('mach.no')) + '</small>'); en.style.color = m.ok ? '' : 'var(--mid)'; kb.disabled = !m.ok || S.kept; put(kb, S.kept ? w('tri.dec.done') : w('tri.dec.b')); }; }
};

/* ---------------- the island: a chip's life round the loop ---------------- */
export const LIT = { lab: () => S.kept, studio: () => !!S.done.job, fab: () => !!(S.done.light || S.tried.cost), test: () => !!S.done.bug, port: () => false, datacentre: () => !!(S.tried.switch || S.tried.memory || S.tried.power) };
PL.island = {
  frame: () => [w('pl.island'), w('isle.lit', { n: LOOP.filter(l => LIT[l[1]]()).length })],
  paint(c, T) { const pts = LOOP.map(l => [l[2], l[3] * .9 + 20]); pts.push(pts[0]);
    c.strokeStyle = fg(.14); c.lineWidth = 2; for (let r = 90; r < 520; r += 62) { c.beginPath(); c.ellipse(500, 470, r * 1.12, r * .92, 0, 0, 7); c.stroke(); }
    path(c, pts, K.ink, 4); train(c, pts, T, 1, .07, 22);
    c.fillStyle = K.plate; c.fillRect(425, 395, 150, 150); c.strokeStyle = S.kept ? K.red : K.ink; c.lineWidth = 4; c.strokeRect(425, 395, 150, 150); c.fillStyle = S.kept ? K.red : fg(.3); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c.fillRect(443 + i * 40, 413 + j * 40, 34, 34);
    LOOP.forEach((l, i) => { const [x, y] = pts[i], lit = LIT[l[1]](), sel = S.place === l[1]; c.fillStyle = lit ? K.red : K.plate; c.fillRect(x - 36, y - 36, 72, 72); c.strokeStyle = lit ? K.red : K.ink; c.lineWidth = sel ? 8 : 4; c.strokeRect(x - 36, y - 36, 72, 72); if (sel) { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.strokeRect(x - 50, y - 50, 100, 100); } }); },
  ui(host, pl) { LOOP.forEach((l, i) => { const x = l[2] / 10, y = (l[3] * .9 + 20) / 10, b = h('button'); b.type = 'button'; at(b, x - 13, y - 5, 26, i === 0 || i === 3 ? 13.5 : 13.5);
      /* i18n-ok: styles */ b.style.cssText += ';display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center'; b.innerHTML = '<span style="height:55%"></span><span class="lb" style="position:static">' + w('stage.' + l[0]) + '<b>' + w('place.' + l[1]) + '</b></span>';
      b.onclick = () => { S.place = l[1]; out('island'); }; host.appendChild(b); });
    lbl(host, w('s.yours'), 50, 56.5, 'c').style.transform = 'translate(-50%,0)';
    const go = h('a', 'pbtn'); go.href = '#/island'; go.dataset.go = 'island'; go.style.textDecoration = 'none'; at(go, 27, 89.5, 46); host.appendChild(go); pl.sync = () => put(go, (S.kept ? w('isle.go') : w('isle.go0')) + ' →'); }
};

/* ---- what moves by itself, once a frame ---- */
TICK.push((T, dt) => {
  S.distK += (S.dist - S.distK) * Math.min(1, dt * 5); S.lvK += (S.lv - S.lvK) * Math.min(1, dt * 4.5); S.jobK = (S.jobK ?? 500) + ([1, 3, 500][S.job] - (S.jobK ?? 500)) * Math.min(1, dt * 6);
  S.power.k = (S.power.k || 0) + ((S.power.shown ? 1 : 0) - (S.power.k || 0)) * Math.min(1, dt * 3);
  if (S.bug.run > 0) { const st = Math.min(S.bug.run, dt); S.bug.n += Math.round(1e6 * st / 1.2); S.bug.run -= st; if (S.bug.run <= 0) S.bug.n = Math.round(S.bug.n / 1e6) * 1e6; setOut('m-bug', momOut('bug')); }
  const N = S.next; if (N.hold && N.pos < 1) { if (N.wait > 0) N.wait -= dt; else { const p0 = N.pos, p1 = Math.min(1, p0 + dt * .13), i = RP.findIndex((r, k) => k > N.at && r <= p1 + 1e-6 && k !== 3); if (i >= 0) { N.pos = RP[i]; N.at = i; N.wait = .6; out('next'); if (i === RUNGS.length - 1) done('floor'); } else { N.pos = p1; if (N.at < 3 && p1 > RP[3] - .12) { N.at = 3; out('next'); } } } }
});
/* what each plate says it found, before anything is tried (once the words are in) */
export const initOuts = () => { for (const id in OUTS) S.out[id] = OUTS[id](); };

/* ================= Moore's law, live =================
   Up the side, steps of ten; along the bottom, the years, and under them how the machine grew, era by era. Your count
   draws its own line as you go; every microprocessor of the series appears as you reach its year; a red line is a pace
   you choose. Drag to go to a year. Three challenges ask about it, one at a time, in the empty corner above the line. */
export function mkChart(o = {}) {
  const el = h('div', 'chart'), cv = h('canvas'), lab = h('div', 'lab'); el.append(cv, lab);
  const c = cv.getContext('2d'), Y0 = 1957, Y1 = 2030; let W = 0, H = 0, g = { l: 36, r: 10, t: 10, b: 40 }, ph = 1, dpr = 1;
  const mk = (cls, html) => { const s = h('span', cls, html); lab.appendChild(s); return s; };
  const yl = [[1e3, 'k'], [1e6, 'm'], [1e9, 'bn'], [1e12, 'tn']].map(([v, k]) => [v, mk('yl', w('ax.' + k))]), xl = [1960, 1971, 1990, 2010, 2026].map(y => [y, mk('xl', y)]);
  const eraL = ERAS.map(e => mk('era', w('era.' + e[0] + '.b'))), chip = mk('chip', ''), gsL = mk('gs', w('chart.guess'));
  /* the series beside the transistors: their switches are their legend, in the corner the data never reaches (early
     years, high counts); nothing is drawn under them */
  const serT = h('div', 'ser-t mono'); SERIES.forEach(s => { const b = h('button', ''); b.type = 'button'; b.dataset.s = s; b.onclick = e => { e.stopPropagation(); S.cq[s] = !S.cq[s]; changed('cq'); }; serT.appendChild(b); }); el.appendChild(serT);
  let serK = null, serR = null;
  const serSync = () => { const k = SERIES.map(s => (S.cq[s] ? 1 : 0)).join(''); if (k === serK) return; serK = k;
    [...serT.children].forEach(b => { const on = !!S.cq[b.dataset.s]; b.classList.toggle('on', on); b.innerHTML = on ? '<i class="g ' + b.dataset.s + '"></i>' + w('ser.' + b.dataset.s + '.u') : '+ ' + w('ser.' + b.dataset.s); });
    serR = serT.offsetWidth && serT.offsetHeight ? [serT.offsetLeft - 4, serT.offsetTop - 3, serT.offsetWidth + 8, serT.offsetHeight + 6] : null; };
  const X = y => g.l + (y - Y0) / (Y1 - Y0) * (W - g.l - g.r), Y = v => g.t + (1 - Math.log10(Math.max(v, 1)) / 12) * ph;
  const yearOfX = x => Y0 + (x - g.l) / (W - g.l - g.r) * (Y1 - Y0), valOfY = y => Math.pow(10, clamp((1 - (y - g.t) / ph) * 12, 0, 12));
  const pos = (e, x, y) => { const k = Math.round(x) + ',' + Math.round(y); if (e._k !== k) { e._k = k; e.style.left = x + 'px'; e.style.top = y + 'px'; } };
  function fit() { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return; dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    /* the axis's own words decide how much room it keeps at the left ("1 000 Md" is wider than "1tn") */
    const u = parseFloat(getComputedStyle(ROOT || document.documentElement).getPropertyValue('--u')) || 1, low = H < 150 * u, yw = H < 84 ? 0 : Math.max(...yl.map(([, e]) => e.offsetWidth));
    g = { l: Math.max(34 * u, yw + 10 * u), r: 12 * u, t: 10 * u, b: (low ? 30 : 40) * u, u, low }; ph = H - g.t - g.b;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    yl.forEach(([v, e]) => { pos(e, g.l - 6 * u, Y(v)); e.style.display = H < 84 ? 'none' : ''; }); xl.forEach(([y, e]) => { pos(e, X(y), g.t + ph + 5 * u); e.style.display = W < 300 && y !== 1971 && y !== 2026 ? 'none' : ''; });
    ERAS.forEach(([id, y0], i) => { pos(eraL[i], X(y0) + 3, g.t + ph + 17 * u); eraL[i].style.display = low || W < 420 ? 'none' : ''; eraL[i]._fits = eraL[i].offsetWidth < X(i < ERAS.length - 1 ? ERAS[i + 1][1] : 2026) - X(y0) - 4; }); serT.style.left = g.l + 8 * u + 'px'; serT.style.top = g.t + 3 * u + 'px'; serK = null; serSync(); }
  function paint(T) {
    if (!W) fit(); if (!W) return; const d = Math.min(S.d, DWALL), yNow = yearAt(d), u = g.u;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H); c.lineWidth = 1;
    for (const v of [1, 1e3, 1e6, 1e9, 1e12]) { const y = Math.round(Y(v)) + .5; c.strokeStyle = fg(.12); c.beginPath(); c.moveTo(g.l, y); c.lineTo(W - g.r, y); c.stroke(); }
    c.strokeStyle = fg(.5); c.beginPath(); c.moveTo(g.l, g.t + ph + .5); c.lineTo(W - g.r, g.t + ph + .5); c.stroke();
    c.fillStyle = fg(.6); for (const [y] of xl) c.fillRect(X(y) - .5, g.t + ph, 1, 4);
    ERAS.forEach(([id, y0], i) => { const x0 = X(y0), x1 = X(i < ERAS.length - 1 ? ERAS[i + 1][1] : 2026), on = yNow >= y0 && (i === ERAS.length - 1 || yNow < ERAS[i + 1][1]); c.fillStyle = on ? K.red : fg(.18); c.fillRect(x0 + 1, H - 4 * u, x1 - x0 - 2, 3 * u); eraL[i].classList.toggle('on', on); eraL[i].style.visibility = eraL[i]._fits || on ? '' : 'hidden'; if (on && !eraL[i]._fits) eraL[i].style.transform = 'translate(-100%,0)', pos(eraL[i], x1 - 2, g.t + ph + 17 * u); });
    serSync(); c.save(); c.beginPath(); c.rect(g.l, g.t - 2, W - g.l - g.r, ph + 2); if (serR) c.rect(serR[0] + serR[2], serR[1], -serR[2], serR[3]); c.clip('evenodd');
    c.strokeStyle = fg(.4); c.setLineDash([3, 4]); c.beginPath(); MOORE65.forEach(([y, v], i) => (i ? c.lineTo(X(y), Y(v)) : c.moveTo(X(y), Y(v)))); c.stroke(); c.setLineDash([]);
    const ds = Math.max(1.3, 1.25 * u); c.fillStyle = fg(.32); for (const [y, v] of trend('tr')) { if (y > yNow + .05) break; c.fillRect(X(y) - ds, Y(v) - ds, ds * 2, ds * 2); }
    for (const s of SERIES) { if (!S.cq[s]) continue; c.strokeStyle = s === 'hz' ? K.red : K.ink; c.fillStyle = K.ink; c.lineWidth = 1.3 * u;
      for (const [y, v] of trend(s)) { if (y > yNow + .05) break; const x = X(y), yy = Y(v);
        if (s === 'hz') { c.beginPath(); c.arc(x, yy, 2.7 * u, 0, 7); c.stroke(); } else if (s === 'cores') c.fillRect(x - 2 * u, yy - 2 * u, 4 * u, 4 * u); else { c.beginPath(); c.moveTo(x, yy - 3 * u); c.lineTo(x + 3 * u, yy + 2.4 * u); c.lineTo(x - 3 * u, yy + 2.4 * u); c.closePath(); c.stroke(); } } }
    if (!S.done.fit || S.cq.every !== 2) { c.strokeStyle = K.red; c.lineWidth = 1.7 * u; c.setLineDash([6 * u, 4 * u]); c.beginPath(); for (let y = 1971; y <= Y1; y += .5) { const p = [X(y), Y(rule(y, S.cq.every))]; if (y === 1971) c.moveTo(...p); else c.lineTo(...p); } c.stroke(); c.setLineDash([]); }
    c.strokeStyle = K.ink; c.lineWidth = 2.7 * u; c.lineJoin = 'round'; c.beginPath(); for (let dd = 0; dd <= d; dd += .1) { const p = [X(yearAt(dd)), Y(Math.pow(2, dd))]; if (!dd) c.moveTo(...p); else c.lineTo(...p); } c.lineTo(X(yNow), Y(Math.pow(2, d))); c.stroke();
    let lastC = null; CHIPS.forEach(ch => { if (ch[0] > yNow + .3) return; lastC = ch; c.fillStyle = K.paper; c.strokeStyle = K.ink; c.lineWidth = 1.5 * u; c.beginPath(); c.arc(X(ch[0]), Y(ch[1]), 3.6 * u, 0, 7); c.fill(); c.stroke(); });
    if (S.cq.guess) { const gx = X(2026), gy = Y(S.cq.guess); c.fillStyle = K.red; c.save(); c.translate(gx, gy); c.rotate(Math.PI / 4); c.fillRect(-4.5 * u, -4.5 * u, 9 * u, 9 * u); c.restore(); pos(gsL, gx, gy); }
    const cx = X(yNow), cy = Y(Math.pow(2, d)); c.strokeStyle = fg(.28); c.lineWidth = 1; c.beginPath(); c.moveTo(Math.round(cx) + .5, g.t); c.lineTo(Math.round(cx) + .5, g.t + ph); c.stroke();
    c.restore(); gsL.style.display = S.cq.guess ? '' : 'none';
    c.fillStyle = K.red; c.beginPath(); c.arc(cx, cy, (S.holding ? 6.5 + Math.sin(T * 11) : 5.5) * u, 0, 7); c.fill();
    if (lastC && H >= 84) { put(chip, w('chip.' + lastC[2])); pos(chip, Math.max(X(lastC[0]), g.l + 80 * u), Y(lastC[1])); chip.style.display = ''; } else chip.style.display = 'none';
    el.classList.toggle('pick', !!S.cq.pick);
  }
  const scrub = x => { const y = clamp(yearOfX(x), 1959.9, 2026), d = y >= 2025.6 ? DWALL : Math.min(DWALL - .02, dAt(y)); if (o.onScrub) o.onScrub(d); else Yr.set(d); };
  let down = null;
  el.addEventListener('pointerdown', e => { if (e.target.closest('button,input,.cq')) return; const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; e.preventDefault();
    if (S.cq.pick === 'guess') { S.cq.guess = valOfY(y); S.cq.pick = null; changed('cq'); return; }
    down = { x, moved: false }; try { el.setPointerCapture(e.pointerId); } catch (er) { /* no capture */ } if (S.cq.pick !== 'knee') scrub(x); });
  el.addEventListener('pointermove', e => { if (!down) return; const x = e.clientX - el.getBoundingClientRect().left; if (Math.abs(x - down.x) > 5) down.moved = true; if (S.cq.pick !== 'knee' || down.moved) scrub(x); });
  el.addEventListener('pointerup', e => { if (!down) return; const y = yearOfX(e.clientX - el.getBoundingClientRect().left);
    if (!down.moved && S.cq.pick === 'knee') { if (y >= KNEE[0] && y <= KNEE[1]) { done('knee'); S.cq.msg = 'knee.yes'; S.cq.pick = null; } else S.cq.msg = 'knee.no'; changed('cq'); } down = null; });
  el.addEventListener('pointercancel', () => { down = null; });
  if (window.ResizeObserver) new ResizeObserver(() => fit()).observe(el);
  return { el, fit, paint, X: y => X(y), Yv: v => Y(v), geo: () => g };
}
/* the chart's questions, one at a time: the first not yet answered, and what the last answer gave */
export const cqStage = () => (S.cq.stage && !S.done[S.cq.stage] ? S.cq.stage : ['fit', 'knee', 'guess'].find(id => !S.done[id]) || 'done');
export function guessOut(q = S.cq) { const real = 336e9, gv = q.guess || 1, f = gv > real ? gv / real : real / gv, xx = xOf(f), hi = f > 10 && gv > real;
  return { n: sig(gv, 2), x: xx, verdict: w(f <= 2 ? 'cq.guess.v1' : f <= 10 ? 'cq.guess.v2' : hi ? 'cq.guess.v4' : 'cq.guess.v3', { x: xx }) + (hi ? ' ' + src('cerebras-cs4') : '') }; }
const everyW = e => (e === 1 ? w('cq.every1') : w('cq.every', { n: e }));
const fitO = e => { const miss = rule(2026, e) / 336e9, far = miss >= 1 ? miss : 1 / miss; return Math.abs(e - 2) < .2 ? '' : w(miss >= 1 ? 'cq.fit.over' : 'cq.fit.under', { x: xOf(far) }); };
/* what the band says for a question (st), with what the last answer gave: from the state, or from a state made up to
   measure how much room the longest of them needs */
function cqBody(st, q, dn) {
  const seen = q.maxD >= DWALL - 1e-4, lead = '<div class="mono"><span>■ ' + w('cq.k') + '</span>' + (st !== 'done' && ['fit', 'knee', 'guess'].filter(id => !dn[id]).length > 1 ? '<button type="button" data-a="skip">' + w('cq.skip') + '</button>' : '') + '</div>';
  let s = '';
  if (st === 'fit') s = lead + '<p>' + w('cq.fit') + ' ' + src('moore-1965') + '</p><div class="row"><input type="range" class="rng" data-a="every" min="0.5" max="4" step="0.25" value="' + q.every + '" aria-label="' + w('cq.fit.aria') + '"><b>' + everyW(q.every) + '</b></div><p class="o">' + fitO(q.every) + '</p>';
  else if (st === 'knee') s = lead + '<p>' + w('cq.knee') + '</p>' + (q.hz ? '' : '<button type="button" class="pbtn ghost" data-a="hz">' + w('cq.knee.b') + '</button>') + (q.msg === 'knee.no' ? '<p class="o">' + w('cq.knee.no') + '</p>' : '');
  else if (st === 'guess') s = lead + '<p>' + w(seen && !q.guess ? 'cq.guess.seen' : 'cq.guess') + '</p>' + (q.guess ? '<p class="o">' + w('cq.guess.yours', { n: sig(q.guess, 2) }) + '</p>' : seen ? '' : '<button type="button" class="pbtn ghost" data-a="guess">' + w(q.pick === 'guess' ? 'cq.guess.tap' : 'cq.guess.b') + '</button>');
  else s = '<div class="mono"><span>■ ' + w('cq.done.k') + '</span></div><p>' + w('cq.done') + '</p><p class="cqq">' + Q('moore') + '</p>';
  const res = { fit: '<b>' + w('cq.fit.yes.v') + '</b> ' + w('cq.fit.yes'), 'knee.yes': '<b>' + w('cq.knee.yes.v') + '</b> ' + w('cq.knee.yes') + ' ' + src('clock-stall', 'dual-core-2005'), guess: q.guess ? w('cq.guess.out', guessOut(q)) : '' }[q.msg];
  return { s: res && (st !== 'done' || q.msg === 'guess') ? '<p class="res">' + res + '</p>' + s : s, res };
}
/* every state the band can be in, at its longest */
const CQ_ALL = [['fit', { every: .5 }, {}], ['fit', { every: 4 }, {}], ['fit', { every: 1 }, {}], ['knee', { msg: 'fit' }, { fit: 1 }], ['knee', { msg: 'knee.no', hz: true }, { fit: 1 }],
  ['guess', { msg: 'knee.yes' }, { fit: 1, knee: 1 }], ['guess', { msg: 'knee.yes', guess: 3.3e9 }, { fit: 1, knee: 1 }], ['guess', { maxD: 99 }, {}], ['guess', { msg: 'fit', pick: 'guess' }, { fit: 1 }],
  ['done', { msg: 'guess', guess: 3.3e9, maxD: 99 }, { fit: 1, knee: 1, guess: 1 }], ['done', { msg: 'guess', guess: 3.3e14, maxD: 99 }, { fit: 1, knee: 1, guess: 1 }]];
export function mkCQ() {
  const el = h('div', 'cq nohold');
  const draw = () => { const st = cqStage(), q = S.cq, { s, res } = cqBody(st, q, S.done);
    const key = s; if (el._k === key) return; const act = el._st === 'fit' && $('.row input', el) && !res;
    el._st = st; if (act && st === 'fit') { el._k = key; $('.row b', el).innerHTML = everyW(q.every); $('.o', el).innerHTML = fitO(q.every); return; }
    el._k = key; el.innerHTML = s; };
  /* the most room any question needs at this width (the band is made that tall) */
  /* i18n-ok: styles */ el.need = wd => { if (!el.parentNode || !wd) return 0; const m = el.cloneNode(false); m.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;height:auto;overflow:visible;width:' + wd + 'px';
    el.parentNode.appendChild(m); let mx = 0; el._hs = []; for (const [st, q, dn] of CQ_ALL) { m.innerHTML = cqBody(st, { every: 1, hz: false, guess: null, msg: '', pick: null, maxD: 0, ...q }, dn).s; el._hs.push(m.offsetHeight); mx = Math.max(mx, m.offsetHeight); } m.remove(); return mx; };
  let ftm = 0; const fitYes = () => { if (S.done.fit || Math.abs(S.cq.every - 2) >= .2) return; S.cq.every = 2; S.cq.msg = 'fit'; el._st = ''; done('fit'); changed('cq'); };
  el.addEventListener('input', e => { if (e.target.dataset.a !== 'every') return; S.cq.every = +e.target.value; clearTimeout(ftm); ftm = setTimeout(fitYes, 650); changed('cq'); });
  el.addEventListener('change', e => { if (e.target.dataset.a !== 'every') return; clearTimeout(ftm); fitYes(); });
  el.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a, q = S.cq;
    if (k === 'hz') { q.hz = true; q.pick = 'knee'; } else if (k === 'guess') q.pick = q.pick === 'guess' ? null : 'guess';
    else if (k === 'skip') { const order = ['fit', 'knee', 'guess'].filter(id => !S.done[id]), i = order.indexOf(cqStage()); q.stage = order[(i + 1) % order.length] || null; q.msg = ''; q.pick = q.stage === 'knee' && q.hz ? 'knee' : null; } else return;
    changed('cq'); });
  onChange(draw); draw(); return el;
}
/* the guess comes out when 2026 is reached; the clock's question waits for a tap once the clock is on the chart */
TICK.push(() => { const q = S.cq; if (q.guess && q.maxD >= DWALL - 1e-4 && !S.done.guess) { q.msg = 'guess'; done('guess'); changed('cq'); }
  if (cqStage() === 'knee' && q.hz && q.pick !== 'knee') { q.pick = 'knee'; } if (cqStage() !== 'knee' && q.pick === 'knee') q.pick = null; });
