/* Your stack: one world. A sheet of every recipe, need by need (the population); your recipe is one plot on it; out of
   that plot your computer rises as eight plates, matter to mind (the anatomy), its forks the recipe's genes; time runs
   from the dock (growth). One camera: plan from far, tilted and opened up close. */
import { STR, t } from './strings.js';
import { A, SW, RUNGS, GENE_OF, GENE_AT, RUNG_DIR, EXAMPLE, FINE_OF, UNITS, clamp, carry, X0, marksOf, topMarks, RECIPES, RIDX, BLOCK, NEEDS, POT, CAN, CELLCAN, fxOf, bestNeed, recipeName, POP, explore, regrow, census, SWEEP_YEARS, fmtX, times, fmtE, pct } from './model.js';
import { PIC, makePen, glyph } from './pics.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lerp = (a, b, u) => a + (b - a) * u, ease = u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2), smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- colour: the lab's ground and ink; blue is a way in, red the signal, warm a question ---------- */
const THEMES = { dark: { bg: '#0b1120', ink: '#eef2f8', mut: '#9aa8bd', acc: '#5aa9ff', bad: '#ff6b62', warm: '#ffb347', panel: '#121b2e' }, light: { bg: '#dfe8f2', ink: '#16202e', mut: '#5b6a80', acc: '#2f7de1', bad: '#d8403a', warm: '#b86f0c', panel: '#f6f9fc' } };
const mk = h => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return a => 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
let C = {}, theme = 'dark';
function setTheme() { theme = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); C = {}; for (const k in THEMES[theme]) C[k] = mk(THEMES[theme][k]); C.dark = theme === 'dark'; dirty = true; }
const FONT = { serif: '"Besley", Georgia, serif', sans: '"Atkinson Hyperlegible Next", system-ui, sans-serif', mono: '"Martian Mono", ui-monospace, Menlo, monospace' };
const fSerif = (px, w = 600, it = false) => (it ? 'italic ' : '') + w + ' ' + px + 'px ' + FONT.serif, fSans = (px, w = 400) => w + ' ' + px + 'px ' + FONT.sans, fMono = (px, w = 400) => w + ' condensed ' + px + 'px ' + FONT.mono;

/* ---------- the sheet: six needs across, distance from today's computer going away from you ---------- */
const PW = 9, PD = 2, GX = 0.7, GY = 0.55, NX = 7, COLGAP = 8, BGAP = 6;
const COLW = NX * PW + (NX - 1) * GX, CSTEP = COLW + COLGAP, WID = 6 * COLW + 5 * COLGAP;
const BY = []; { let y = 0; for (let d = 0; d < 5; d++) { const rows = d ? Math.ceil(BLOCK[d].length / NX) : 1; BY[d] = { y0: y, rows, y1: y + rows * (PD + GY) - GY }; y = BY[d].y1 + BGAP; } }
const TOP = BY[4].y1, SHEET = { x0: -36, x1: WID + 5, y0: -20, y1: TOP + 23 };
function plotRect(n, ri) { const r = RECIPES[ri]; if (!r.d) return { x: n * CSTEP + (COLW - PW) / 2, y: 0 }; return { x: n * CSTEP + (r.slot % NX) * (PW + GX), y: BY[r.d].y0 + ((r.slot / NX) | 0) * (PD + GY) }; }
function plotAt(x, y) {
  const n = Math.floor((x + COLGAP / 2) / CSTEP); if (n < 0 || n > 5) return null;
  const cx = x - n * CSTEP; if (cx < -0.4 || cx > COLW + 0.4) return null;
  for (let d = 0; d < 5; d++) {
    if (y < BY[d].y0 - 0.3 || y > BY[d].y1 + 0.3) continue;
    if (!d) return Math.abs(cx - COLW / 2) <= PW / 2 + 0.4 ? { n, ri: BLOCK[0][0] } : null;
    const row = clamp(Math.floor((y - BY[d].y0) / (PD + GY)), 0, BY[d].rows - 1), col = clamp(Math.floor(cx / (PW + GX)), 0, NX - 1), ri = BLOCK[d][row * NX + col];
    return ri == null ? null : { n, ri };
  }
  return null;
}

/* ---------- your stack: what you have made, kept in this browser ---------- */
const KEY = 'osl-stack-fable';
const S = { F: Object.assign({}, EXAMPLE), g: Object.assign({}, A.TODAY), aim: 'any', A: A.start(A.TODAY), T: A.treeOf(A.TODAY), focus: [], stones: {}, first: {} };
try { const k = JSON.parse(localStorage.getItem(KEY) || 'null'); if (k && k.A && A.isKey(A.keyOf(k.A.g)) && NEEDS.includes(k.aim)) { Object.assign(S.F, k.F); S.g = k.A.g; S.A = k.A; S.T = k.T || A.treeOf(S.g); S.aim = k.aim; S.focus = k.focus || []; S.stones = k.stones || {}; S.first = k.first || {}; regrow(k.agents); } } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ F: S.F, aim: S.aim, A: S.A, T: S.T, focus: S.focus, stones: S.stones, first: S.first, agents: POP.filter(a => a.by === 'agent').map(a => a.key) })); } catch (e) {} };
let R = carry(S.F, S.g, S.aim), Rprev = R, marks = [], lens = null, CEN = null, proposals = null, wave = null, pings = [], grewAt = -1e9;
const mineKey = () => A.keyOf(S.g), mineRi = () => RIDX.get(mineKey()), aimN = () => NEEDS.indexOf(S.aim);
const mineAtt = () => ({ key: mineKey(), g: S.g, st: S.A, by: 'you', mine: true });
const recount = () => { CEN = census(mineAtt()); };
const yoursAt = r => FINE_OF[r].some(k => S.F[k] !== EXAMPLE[k]) || !!R.fork[r];

/* ---------- the camera ---------- */
const cv = $('#world'), ctx = cv.getContext('2d');
let vw = 0, vh = 0, dpr = 1, dirty = true;
const cam = { x: WID / 2, y: TOP / 2, z: 0, s: 3, T: 0, G: 0.9, ex: 0, ox: 0, oy: 0, cosT: 1, sinT: 0, kx: 0 };
const view = { level: 'field', n: aimN(), r: mineRi(), i: -1 };
let anim = null, stackAt = null;                 // stackAt: where the opened stack stands while it travels
const trig = () => { cam.cosT = Math.cos(cam.T); cam.sinT = Math.sin(cam.T); cam.kx = 0.2 * cam.sinT; };
function proj(x, y, z = 0) { const dy = y - cam.y; return [vw / 2 + cam.ox + (x - cam.x + dy * cam.kx) * cam.s, vh / 2 + cam.oy - (dy * cam.cosT + (z - cam.z) * cam.sinT) * cam.s]; }
function unproj(X, Y, z = 0) { const dy = (-(Y - vh / 2 - cam.oy) / cam.s - (z - cam.z) * cam.sinT) / cam.cosT; return [cam.x + (X - vw / 2 - cam.ox) / cam.s - dy * cam.kx, cam.y + dy]; }
const phone = () => vw < 760;
let footH = 0;
const chrome = () => (phone() ? { top: 92, bot: Math.max(120, footH + 14) } : { top: 72, bot: Math.max(128, footH + 18) });
const fitAll = () => { const c = chrome(); return Math.min((vw - 24) / (SHEET.x1 - SHEET.x0), (vh - c.top - c.bot) / (SHEET.y1 - SHEET.y0)); };
function poseField() {
  const c = chrome(), h = SHEET.y1 - SHEET.y0, tall = phone() && vh > vw, s = tall ? (vh - c.top - c.bot) / h : fitAll();   /* a tall phone fits the sheet's height and pans across the needs */
  return { x: tall ? clamp(aimN() * CSTEP + COLW / 2, SHEET.x0 + vw / 2 / s - 2, SHEET.x1 - vw / 2 / s + 2) : (SHEET.x0 + SHEET.x1) / 2, y: (SHEET.y0 + SHEET.y1) / 2, z: 0, s, T: 0, G: 0.9, ex: 0, ox: 0, oy: (c.top - c.bot) / 2 };
}
function poseStack(n, ri) {
  const c = chrome(), ph = phone(), rc = plotRect(n, ri), uh = vh - c.top - c.bot, mL = ph ? 12 : clamp(vw * 0.18, 215, 380), mR = ph ? 12 : clamp(vw * 0.17, 215, 350), head = ph ? 30 : 64, K = 1.36;
  let s = (vw - mL - mR) / PW, cos = 0.3, depth = PD * s * cos, pitch = depth * K;
  if (7 * pitch + depth + head > uh) { s = (uh - head) / ((7 * K + 1) * PD * cos); depth = PD * s * cos; pitch = depth * K; }
  else { pitch = Math.min((uh - head) / (7 + 1 / K), PD * s * 0.66 * 1.9); cos = clamp(pitch / K / (PD * s), 0.3, 0.66); depth = PD * s * cos; }
  const T = Math.acos(cos), G = pitch / (s * Math.sin(T)), free = vw - PW * s, skew = PD * 0.2 * Math.sin(T) * s, right = ph ? free / 2 : clamp(free * 0.53, 225, 400) + skew * 0.5;
  return { x: rc.x + PW / 2, y: rc.y + PD / 2, z: 3.5 * G, s, T, G, ex: 1, ox: (free - right) - free / 2, oy: (c.top - c.bot) / 2 + head / 2 };
}
function poseRung(n, ri, i) {
  const st = poseStack(n, ri), ph = phone(), c = chrome();
  if (ph) return Object.assign(st, { z: clamp(i, 1.2, 5.8) * st.G, oy: st.oy - (vh * 0.2) });
  const s = Math.min((vw - 540) / PW, st.s * 1.14), cos = 0.58, T = Math.acos(cos), depth = PD * s * cos, G = (depth + 190) / (s * Math.sin(T));
  return { x: st.x, y: st.y, z: i * G, s, T, G, ex: 1, ox: -8, oy: (c.top - c.bot) / 2 - 40 };
}
function poseNear(n, ri) { const rc = plotRect(n, ri), f = poseField(), st = poseStack(n, ri); return { x: rc.x + PW / 2, y: rc.y + PD / 2, z: 0, s: Math.max(f.s * 1.6, st.s * 0.2), T: 0, G: st.G, ex: 0, ox: 0, oy: f.oy }; }
function fly(to, ms = 900, done) {
  const from = { x: cam.x, y: cam.y, z: cam.z, s: cam.s, T: cam.T, G: cam.G, ex: cam.ex, ox: cam.ox, oy: cam.oy };
  const dist = Math.hypot(to.x - from.x, to.y - from.y) * Math.min(from.s, to.s), hop = dist > vw * 0.7 ? clamp(1 - vw * 0.7 / dist, 0, 0.93) : 0;
  if (REDUCED) ms = 0;
  anim = { from, to, t0: performance.now(), dur: ms * (1 + hop * 0.7), hop, done, sFrom: stackAt || plotRect(view.n, view.r), sTo: null };
  dirty = true;
}
function stepAnim(now) {
  if (!anim) return;
  const u = anim.dur ? clamp((now - anim.t0) / anim.dur, 0, 1) : 1, e = ease(u), a = anim.from, b = anim.to;
  for (const k of ['z', 'G', 'ex', 'ox', 'oy']) cam[k] = lerp(a[k], b[k], e);
  const dip = 1 - anim.hop * Math.sin(Math.PI * u);
  cam.s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)) * dip; cam.T = lerp(a.T, b.T, e) * (1 - 0.6 * anim.hop * Math.sin(Math.PI * u));
  /* the place you are flying to (or from) keeps its way across the screen even while the scale changes a hundredfold */
  if (b.s >= a.s) { const k = Math.min(1.6, a.s / cam.s) * (1 - e); cam.x = b.x + (a.x - b.x) * k; cam.y = b.y + (a.y - b.y) * k; } else { const k = Math.min(1.6, b.s / cam.s) * e; cam.x = a.x + (b.x - a.x) * k; cam.y = a.y + (b.y - a.y) * k; }
  if (anim.sTo) stackAt = { x: lerp(anim.sFrom.x, anim.sTo.x, e), y: lerp(anim.sFrom.y, anim.sTo.y, e) };
  trig(); dirty = true;
  if (u >= 1) { const d = anim.done; anim = null; stackAt = null; if (d) d(); ui(); }
}
/* the moves */
function goField() { view.level = 'field'; view.i = -1; closeAll(); fly(poseField(), 1100); ui(); }
function goNear(n, ri) { view.level = 'field'; view.i = -1; view.n = n; view.r = ri; closeAll(); fly(poseNear(n, ri), 900); ui(); }
function goStack(n, ri, ms = 1150) {
  if (ri === mineRi() && n !== aimN() && POT[n][ri] > 0) { setAim(NEEDS[n], true); refresh(7); }
  if (ri === mineRi()) n = aimN();
  const moved = cam.ex > 0.5 && (view.n !== n || view.r !== ri), from = stackAt || plotRect(view.n, view.r);
  view.level = 'stack'; view.i = -1; view.n = n; view.r = ri; lens = null; SK = null;
  fly(poseStack(n, ri), ms); if (moved) { anim.sFrom = from; anim.sTo = plotRect(n, ri); stackAt = from; }
  ui();
}
function goRung(i) { if (view.level === 'field') return; view.level = 'rung'; view.i = i; fly(poseRung(view.n, view.r, i), 700); ui(); }
function goOut() { if (pop()) return; if (lens) { lens = null; ui(); return; } if (view.level === 'rung') { view.level = 'stack'; view.i = -1; fly(poseStack(view.n, view.r), 700); ui(); } else if (view.level === 'stack') goNear(view.n, view.r); else goField(); }
const onMine = () => view.r === mineRi();

/* ---------- what is opened: your stack, or the lab's sketch of another recipe ---------- */
let SK = null;
function shown() {
  if (onMine()) return { mine: true, R, F: S.F, g: S.g, st: S.A, need: S.aim };
  const rec = RECIPES[view.r], need = NEEDS[view.n];
  if (!SK || SK.key !== rec.key + need) { const e = CEN.P[view.n][view.r] || POP.find(a => a.key === rec.key); const att = e && e.a ? e.a : e; SK = { key: rec.key + need, mine: false, R: carry(EXAMPLE, rec.g, need), F: EXAMPLE, g: rec.g, st: att && att.st ? att.st : A.start(rec.g), need, att: att && att.st ? att : null }; }
  return SK;
}

/* ---------- changing things ---------- */
let sayT = 0, saying = false, rest = '';
function say(s) { const el = $('#say'); el.textContent = s; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); sayT = performance.now(); saying = true; }
/* the line at the foot of the picture says what you are looking at, until something happens */
function restLine(sh) {
  const F = STR.field;
  if (!sh) { if (cam.s < poseField().s * 1.45) return F.rest; const h = plotAt(cam.x, cam.y); if (!h) return F.rest; const d = RECIPES[h.ri].d; return t(F.restNear, { need: STR.need[NEEDS[h.n]], d: d === 0 ? F.today : d === 1 ? F.away1 : t(F.away, { d }), n: CELLCAN[h.n][d] }); }
  const g = sh.g, d = A.novelty(g), kn = A.knownOf(g), R0 = STR.recipe;
  return d ? t(R0.line, { name: recipeName(g), d: d === 1 ? R0.d1 : t(R0.dn, { d }), status: kn ? STR.st[kn.status] : R0.newOne }) : t(R0.lineToday, { name: recipeName(g) });
}
function refresh(from) {
  Rprev = R; R = carry(S.F, S.g, S.aim);
  marks = topMarks(marksOf(R, S.F, S.g)); if (lens && !marksOf(R, S.F, S.g).some(m => m.rung === lens.rung && m.id === lens.id)) lens = null;
  if (from != null && !REDUCED) wave = { k: from, t0: performance.now() };
  if (R.stone && !S.stones.device) { S.stones.device = A.KEPT_SWITCH; S.A = A.bring(S.A, { device: A.KEPT_SWITCH }); if (A.novelty(S.g)) say(STR.say.stone); }
  recount(); save(); dirty = true; ui();
}
function setFine(k, v) {
  const was = !!R.broken; S.F[k] = v;
  if (k === 'mat') S.F.shape = SW.normal({ mat: S.F.mat, shape: S.F.shape, mech: S.F.mech }).shape;
  const rung = RUNGS.findIndex(r => FINE_OF[r].includes(k)); refresh(k === 'mat' ? 0 : rung);
  if (R.broken && !was) say(STR.say.broken); else if (!R.broken && was) say(STR.say.mended); else if (!sayOnce.yours) { sayOnce.yours = 1; say(STR.say.yours); }
}
const sayOnce = {};
const asNeed = n => STR.asNeed[n];
function setAim(n, quiet) { if (!NEEDS.includes(n) || n === S.aim) return; S.aim = n; if (!quiet) { refresh(7); say(t(STR.say.aimSet, { need: asNeed(n) })); if (view.level !== 'field' && onMine()) goStack(aimN(), mineRi(), 1000); } }
function fixAim() { if (A.potentialOf(S.g, S.aim) > 0) return null; const b = bestNeed(S.g); if (b < 0) return null; const what = STR.cant[A.missesOf(S.g, S.aim)[0]] || ''; S.aim = NEEDS[b]; return t(STR.say.aim, { what, need: STR.needA[S.aim] }); }
function setGene(k, o) {
  if (S.g[k] === o) return;
  const g2 = Object.assign({}, S.g, { [k]: o }), wasOn = onMine(), yr = S.A.year;
  let msg;
  if (!yr) { S.A = A.start(g2, S.stones); S.T = A.treeStart(S.T, g2); }
  else { const lost = A.LINK[k].filter(d => S.A.tries[d] > 0); S.A = A.forkOf(S.A, k, o); S.T = A.treeFork(S.T, g2, yr); msg = lost.length ? t(STR.say.fork, { gene: STR.gene[k].toLowerCase(), option: STR.opt[k][o][0].toLowerCase(), dirs: lost.map(d => STR.dir[d].toLowerCase()).join(', ') }) : t(STR.say.forkFree, { gene: STR.gene[k].toLowerCase(), option: STR.opt[k][o][0].toLowerCase() }); }
  S.g = S.A.g; proposals = null;
  const aimMsg = fixAim(); S.focus = A.novelty(S.g) ? A.suggest(S.A, 'archniche').dirs.slice() : [];
  refresh(GENE_AT[k][0]);
  if (!msg) { const kn = A.knownOf(S.g), sc = A.scoreOf(S.A)[S.aim];
    msg = !A.novelty(S.g) ? STR.say.today : kn ? t(STR.say.known, { name: STR.known[kn.id], status: STR.st[kn.status] }) : sc.could < 1 && !NEEDS.some(n => A.scoreOf(S.A)[n].could >= 1) ? STR.say.newNone : t(STR.say.newOne, { v: times(sc.now), need: asNeed(S.aim), could: times(sc.could) }); }
  say(aimMsg ? aimMsg : msg);
  if (wasOn && view.level !== 'field') { const lv = view.level, i = view.i; goStack(aimN(), mineRi(), 1200); if (lv === 'rung') { view.level = 'rung'; view.i = i; anim.to = poseRung(view.n, view.r, i); } } else { view.n = aimN(); view.r = mineRi(); }
  ui();
}
function grow(n) {
  if (R.broken || !A.novelty(S.g)) return;
  let msg = '';
  for (let k = 0; k < n && S.A.year < 80; k++) {
    const before = A.winsOf(S.A), firstTry = !S.A.year && !A.knownOf(S.g) && !POP.some(a => a.key === mineKey()) && !S.first[mineKey()];
    S.A = A.year(S.A, S.focus); S.T = A.treeYear(S.T, A.winsOf(S.A));
    const L = S.A.log[S.A.log.length - 1], sc = A.scoreOf(S.A)[S.aim];
    if (firstTry) { S.first[mineKey()] = 1; msg = STR.say.first; }
    if (L.fresh.length) msg = t(STR.say.win, { y: S.A.year, need: asNeed(L.fresh[0]), p: Math.round(S.A.people) });
    else if (!msg || !firstTry) msg = L.focus.length ? t(STR.say.year, { y: S.A.year, n: L.attempts.toLocaleString('en'), dirs: L.focus.map(d => STR.dir[d].toLowerCase()).join(', '), v: times(sc.now), need: asNeed(S.aim) }) : t(STR.say.idle, { y: S.A.year });
  }
  grewAt = performance.now(); proposals = null; recount(); save(); say(msg); dirty = true; ui();
}
function restart() { S.A = A.start(S.g, S.stones); S.T = A.treeStart(S.T, S.g); proposals = null; recount(); save(); dirty = true; ui(); }
function resetAll() { Object.assign(S, { F: Object.assign({}, EXAMPLE), g: Object.assign({}, A.TODAY), aim: 'any', A: A.start(A.TODAY), T: A.treeOf(A.TODAY), focus: [], stones: {}, first: {} }); proposals = null; lens = null; refresh(0); say(STR.say.reset); goStack(aimN(), mineRi(), 1000); }
function takeOver() {
  const sh = shown(); if (sh.mine) return;
  S.g = Object.assign({}, sh.g); S.A = sh.att ? JSON.parse(JSON.stringify(sh.att.st)) : A.start(sh.g, S.stones); S.T = A.treeStart(S.T, sh.g);
  S.aim = POT[view.n][view.r] > 0 ? NEEDS[view.n] : S.aim; fixAim(); S.focus = A.novelty(S.g) ? A.suggest(S.A, 'archniche').dirs.slice() : []; SK = null;
  refresh(0); say(t(STR.say.taken, { y: S.A.year })); view.n = aimN(); view.r = mineRi(); ui();
}
function sweep() {
  const run = () => {
    const out = explore(6, mineKey()); if (!out.length) { say(STR.say.sweepNone); return; }
    recount(); save(); const now = performance.now();
    out.forEach((a, k) => { const ri = RIDX.get(a.key); let bn = 0, bv = -1; NEEDS.forEach((n, i) => { if (a.sc[n].can && a.sc[n].now > bv) { bv = a.sc[n].now; bn = i; } }); pings.push({ n: bn, ri, t0: now + k * 260 }); });
    say(t(STR.say.sweep, { n: out.length, y: SWEEP_YEARS, w: out.filter(a => A.winsOf(a.st).length).length })); dirty = true; ui();
  };
  if (view.level !== 'field' || cam.s > poseField().s * 1.3) { view.level = 'field'; view.i = -1; closeAll(); fly(poseField(), 1100, run); ui(); } else run();
}

/* ---------- drawing ---------- */
let U = 1, LBL = [], hover = null, hoverRung = -1, hoverDir = null, PL = [], NOTE_ON = true;
function label(x, y, text, font, px, color, o = {}) { LBL.push({ x, y, text, font, px, color, align: o.align || 'left', pri: o.pri || 0, bg: o.bg, force: o.force, max: o.max }); }
function flushLabels() {
  LBL.sort((a, b) => b.pri - a.pri); const placed = [];
  for (const L of LBL) {
    ctx.font = L.font; const w = ctx.measureText(L.text).width; if (L.max && w > L.max) continue;
    const x0 = L.align === 'right' ? L.x - w : L.align === 'center' ? L.x - w / 2 : L.x, b = [x0 - 4, L.y - L.px * 0.84, x0 + w + 4, L.y + L.px * 0.26];
    if (!L.force && (b[0] < 2 || b[2] > vw - 2 || placed.some(p => b[0] < p[2] && b[2] > p[0] && b[1] < p[3] && b[3] > p[1]))) continue;
    placed.push(b);
    if (L.bg) { ctx.fillStyle = C.bg(0.86); ctx.fillRect(b[0] - 1, b[1] - 3, b[2] - b[0] + 2, b[3] - b[1] + 6); }
    ctx.fillStyle = L.color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(L.text, x0, L.y);
  }
  LBL = [];
}
const frac = v => clamp((Math.log10(Math.max(v, 1e-9)) + 3) / 3, 0.035, 1);
function para(p, a0, a1, w, h, skew) { p.moveTo(a0, a1); p.lineTo(a0 + w, a1); p.lineTo(a0 + w + skew, a1 - h); p.lineTo(a0 + skew, a1 - h); p.closePath(); }
function fidGlyph(x, y, f, col) { const n = { guess: 0, idea: 1, figures: 2, computed: 3 }[f]; for (let i = 0; i < 4; i++) { const h = 3.5 + i * 2.2; if (i < n) { ctx.fillStyle = col(0.95); ctx.fillRect(x + i * 3.6, y - h, 2.4, h); } else { ctx.strokeStyle = col(0.5); ctx.lineWidth = 0.8; ctx.strokeRect(x + i * 3.6 + 0.4, y - h + 0.4, 1.6, h - 0.8); } } }

function drawGround(now) {
  const gf = 1 - 0.94 * smooth(cam.ex), flat = cam.T < 0.02, wpx = PW * cam.s, hpx = PD * cam.s * cam.cosT, skew = PD * cam.kx * cam.s, la = 1 - smooth(cam.ex * 2.2);
  const snap = v => (flat && wpx < 80 ? Math.round(v) + 0.5 : v);
  /* the sheet's frame, the band of today's computer, the open edge of the genome */
  const f0 = proj(SHEET.x0, SHEET.y0), f1 = proj(SHEET.x1, SHEET.y1);
  if (la > 0.02) { ctx.strokeStyle = C.ink(0.2 * la); ctx.lineWidth = 1; ctx.strokeRect(snap(f0[0]), snap(f1[1]), f1[0] - f0[0], f0[1] - f1[1]);
    ctx.beginPath(); for (let n = 0; n <= 6; n++) { const x = n * CSTEP - COLGAP / 2, a = proj(x, SHEET.y0); ctx.moveTo(snap(a[0]), a[1]); ctx.lineTo(snap(a[0]), a[1] - 6); const b = proj(x, SHEET.y1); ctx.moveTo(snap(b[0]), b[1]); ctx.lineTo(snap(b[0]), b[1] + 6); } ctx.stroke(); }
  { const a = proj(-1.2, -0.7), p = new Path2D(); para(p, a[0], a[1], (WID + 2.4) * cam.s, (PD + 1.4) * cam.s * cam.cosT, (PD + 1.4) * cam.kx * cam.s); ctx.fillStyle = C.ink(0.07 * gf); ctx.fill(p); ctx.strokeStyle = C.ink(0.5 * gf); ctx.lineWidth = 1; ctx.stroke(p); }
  { const a = proj(0, TOP + 2.2), p = new Path2D(); para(p, a[0], a[1], WID * cam.s, 3.6 * cam.s * cam.cosT, 3.6 * cam.kx * cam.s); ctx.setLineDash([6, 5]); ctx.strokeStyle = C.ink(0.3 * gf); ctx.stroke(p); ctx.setLineDash([]); }
  /* every plot */
  const pOpen = new Path2D(), pCould = new Path2D(), tried = [], gl = flat && wpx >= 84;
  for (let n = 0; n < 6; n++) {
    const cxa = proj(n * CSTEP, cam.y)[0]; if (cxa > vw + 400 || cxa + COLW * cam.s < -400) continue;
    for (let ri = 0; ri < RECIPES.length; ri++) {
      const pot = POT[n][ri], e = CEN.P[n][ri]; if (!pot && !e) continue;
      const rc = plotRect(n, ri), a = proj(rc.x, rc.y); if (a[0] > vw + 20 || a[0] + wpx + skew < -20 || a[1] < -20 || a[1] - hpx > vh + 20) continue;
      const a0 = snap(a[0]), a1 = snap(a[1]);
      if (e) { tried.push([n, ri, a0, a1, e]); continue; }
      if (flat) pOpen.rect(a0, a1 - Math.round(hpx), Math.round(wpx), Math.round(hpx)); else para(pOpen, a0, a1, wpx, hpx, skew);
      if (pot >= 1 && wpx > 10) { pCould.moveTo(a0 + wpx + skew, a1 - hpx); pCould.lineTo(a0 + wpx, a1); }
      if (gl && pot >= 1) glyph(ctx, a0, a1 - hpx, wpx, hpx, RECIPES[ri].g, C, 0.15 * gf);
    }
  }
  if (wpx < 22) { ctx.fillStyle = C.ink(0.075 * gf); ctx.fill(pOpen); } else { ctx.lineWidth = 1; ctx.strokeStyle = C.ink((gl ? 0.06 : 0.11) * gf); ctx.stroke(pOpen); }
  ctx.lineWidth = wpx < 30 ? 1.2 : 2; ctx.strokeStyle = C.ink(0.38 * gf); ctx.stroke(pCould);
  const mr = mineRi(), an = aimN(); let nNames = 0;
  for (const [n, ri, a0, a1, e] of tried) {
    const d = RECIPES[ri].d, mine = e.a.mine, here = mine && n === an, ch = CEN.champ[n][d] && CEN.champ[n][d].ri === ri, win = e.now >= 1 && d > 0, col = here ? C.acc : C.ink, f = frac(e.now), broke = mine && R.broken;
    if (cam.ex > 0.3 && n === view.n && ri === view.r) continue;
    const p = new Path2D(); para(p, a0, a1, wpx, hpx, skew); ctx.fillStyle = C.bg(0.9 * gf); ctx.fill(p);
    if (!broke) { const q = new Path2D(), gh = gl ? Math.max(5, hpx * 0.2) : hpx; para(q, a0, a1, wpx * f, gh, skew * gh / hpx); if (win && cam.ex < 0.2) { ctx.shadowColor = col(0.8); ctx.shadowBlur = clamp(wpx * 0.2, 4, 12); } ctx.fillStyle = col((here ? 0.95 : win ? 0.92 : ch ? 0.7 : 0.4) * gf * (1 - 0.7 * cam.ex)); ctx.fill(q); ctx.shadowBlur = 0; }
    ctx.strokeStyle = broke ? C.bad(0.9 * gf) : col((ch || here ? 0.9 : 0.6) * gf); ctx.lineWidth = 1; if (broke) ctx.setLineDash([3, 3]); ctx.stroke(p); ctx.setLineDash([]);
    if (e.could < 1 && wpx > 16) { const fx = frac(e.could) * wpx; ctx.beginPath(); ctx.moveTo(a0 + fx + skew, a1 - hpx); ctx.lineTo(a0 + fx, a1); ctx.strokeStyle = col(0.8 * gf); ctx.stroke(); }
    if (gl) glyph(ctx, a0, a1 - hpx, wpx, hpx * 0.8, RECIPES[ri].g, C, (win ? 1 : 0.75) * gf);
    if (here || (ri === mr && flat)) { const m = n === an ? 1 : 0.5, k = clamp(wpx * 0.12, 4, 9), o = 3; ctx.strokeStyle = C.acc(m * Math.max(gf, 0.5)); ctx.lineWidth = n === an ? 1.6 : 1; ctx.beginPath();
      for (const [sx, sy, cx, cy] of [[-1, 1, a0, a1], [1, 1, a0 + wpx, a1], [1, -1, a0 + wpx + skew, a1 - hpx], [-1, -1, a0 + skew, a1 - hpx]]) { ctx.moveTo(cx + sx * o, cy + sy * (o - k)); ctx.lineTo(cx + sx * o, cy + sy * o); ctx.lineTo(cx + sx * (o - k), cy + sy * o); } ctx.stroke(); }
    if (ch && d > 0 && flat && wpx > 20) { const x = a0 + wpx - 1, y = a1 - hpx; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 8); ctx.lineTo(x - 7, y - 5.5); ctx.lineTo(x, y - 3); ctx.fillStyle = col(0.95 * gf); ctx.fill(); ctx.strokeStyle = col(0.95 * gf); ctx.stroke(); }
    /* words on the plot */
    if (la > 0.3 && flat) {
      const who = mine ? STR.field.yours : null, name = recipeName(RECIPES[ri].g);
      const home = e.a.sc && NEEDS.every((x, k) => !e.a.sc[x].can || e.a.sc[x].now <= e.now + 1e-9 || k === n);
      if (here) label(a0 + wpx / 2, wpx >= 150 ? a1 + 16 : a1 - hpx - 6, STR.field.yours, fSans(12.5, 700), 12.5, C.acc(1), { align: 'center', pri: 100, bg: true });
      if (wpx >= 150 && (ch || win || e.a.id || ++nNames <= 8)) label(a0 + 2, a1 - hpx - 5, name + '  ' + times(e.now), fSans(11.5, ch ? 700 : 400), 11.5, col(0.95), { pri: 20 + e.now, max: wpx * 1.6, bg: true });
      else if (d > 0 && !mine && home && (win || e.a.id) && wpx > 18) label(a0 + wpx + 6, a1 - Math.max(0, (hpx - 9) / 2), (e.a.id ? STR.known[e.a.id] : name) + '  ' + times(e.now), fSans(11, win ? 700 : 400), 11, C.ink(win ? 1 : 0.8), { pri: (e.a.id ? 12 : 4) + e.now + (ch ? 3 : 0), bg: true, max: 240 });
    }
  }
  /* your line through the sheet: every start and fork, in the need you aim at */
  if (S.T.nodes.length > 1) { ctx.beginPath(); for (const nd of S.T.nodes) { if (nd.from == null) continue; const pa = A.nodeOf(S.T, nd.from); if (!pa) continue; const r0 = plotRect(an, RIDX.get(pa.g)), r1 = plotRect(an, RIDX.get(nd.g)), a = proj(r0.x + PW / 2, r0.y + PD / 2), b = proj(r1.x + PW / 2, r1.y + PD / 2); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.strokeStyle = C.acc(0.55 * Math.max(gf, 0.3)); ctx.lineWidth = 1.2; ctx.setLineDash([2, 4]); ctx.stroke(); ctx.setLineDash([]); }
  /* agents landing */
  pings = pings.filter(pg => now - pg.t0 < 1600); for (const pg of pings) { const u = (now - pg.t0) / 1600; if (u < 0) continue; const rc = plotRect(pg.n, pg.ri), a = proj(rc.x + PW / 2, rc.y + PD / 2); ctx.beginPath(); ctx.arc(a[0], a[1], 4 + u * 34, 0, 6.283); ctx.strokeStyle = C.ink(0.9 * (1 - u)); ctx.lineWidth = 1.5; ctx.stroke(); }
  if (la < 0.03) return;
  /* words on the sheet */
  const s = cam.s, F = STR.field;
  NEEDS.forEach((nd, n) => { const a = proj(n * CSTEP + COLW / 2, -5.6), px = clamp(s * 4.4, 13, 30), top = chrome().top + 26;
    if (a[1] + px * 0.35 < top) { const l = proj(n * CSTEP, cam.y)[0], r = proj(n * CSTEP + COLW, cam.y)[0]; if (r < 40 || l > vw - 40) return; const x = clamp(a[0], Math.max(l, 0) + 90, Math.min(r, vw) - 90); label(x, top, STR.need[nd], fSerif(16), 16, C.ink(la), { align: 'center', pri: 61, bg: true, force: true }); return; }
    label(a[0], a[1] + px * 0.35, STR.need[nd], fSerif(px), px, C.ink(la), { align: 'center', pri: 60 }); if (s * COLW > 150) label(a[0], a[1] + px * 0.35 + 17, t(F.can, { n: CAN[n] }), fMono(10.5), 10.5, C.mut(la), { align: 'center', pri: 30 }); });
  for (let d = 0; d < 5; d++) { const a = proj(-3.5, (BY[d].y0 + BY[d].y1) / 2), stick = a[0] < 104, o = { align: stick ? 'left' : 'right', pri: 55, bg: stick, force: stick }, x = stick ? 8 : a[0], y = a[1]; if (y < chrome().top + 34 || y > vh - chrome().bot - 6) continue;
    label(x, y + (d ? -1 : 4), d === 0 ? F.today : d === 1 ? F.away1 : t(F.away, { d }), fMono(11, 500), 11, C.ink(la), o); if (d && s * (BY[d].y1 - BY[d].y0) > 30) label(x, y + 14, t(F.recipes, { n: BLOCK[d].length }), fMono(10.5), 10.5, C.mut(la), Object.assign({}, o, { pri: 25 })); }
  { const a = proj(0, SHEET.y1), px = clamp(s * 5.4, 16, 32); label(a[0], a[1] + px + 8, F.caption, fSerif(px, 700), px, C.ink(la), { pri: 58 }); label(a[0], a[1] + px + 27, t(F.sub, { tried: CEN.tried, wins: CEN.wins }), fMono(11), 11, C.mut(la), { pri: 40 });
    const b = proj(WID / 2, TOP + 3.4); label(b[0], b[1], F.open, fSerif(clamp(s * 2.6, 11, 15), 400, true), 13, C.mut(la), { align: 'center', pri: 22, max: WID * s - 20 }); }
  if (s * COLW > 170) { const a = proj(COLW / 2, (BY[4].y0 + BY[4].y1) / 2); label(a[0], a[1], F.cannot, fSerif(12.5, 400, true), 12.5, C.mut(la), { align: 'center', pri: 18, max: COLW * s }); const b = proj(2 * CSTEP + COLW / 2, BY[4].y0 + 11.2 * (PD + GY) - 0.6); label(b[0], b[1], F.nobody, fSerif(12.5, 400, true), 12.5, C.ink(la), { align: 'center', pri: 18, bg: true }); }
  if (hover && flat) { const rc = plotRect(hover.n, hover.ri), a = proj(rc.x, rc.y), e = CEN.P[hover.n][hover.ri], pot = POT[hover.n][hover.ri], g = RECIPES[hover.ri].g;
    ctx.strokeStyle = C.acc(1); ctx.lineWidth = 1.5; ctx.strokeRect(a[0] - 1.5, a[1] - hpx - 1.5, wpx + 3, hpx + 3);
    const l2 = e ? t(F.now, { x: times(e.now) }) + ' · ' + t(F.could, { x: times(e.could) }) + (e.a.by === 'agent' ? ' · ' + t(F.first, { who: F.agentHere }) : e.a.by === 'ledger' ? ' · ' + F.ledger : e.a.id ? ' · ' + STR.st[e.a.by] : '') : pot ? F.nobody + ' · ' + t(F.could, { x: times(pot) }) : t(F.cant, { what: STR.cant[A.missesOf(g, NEEDS[hover.n])[0]] || '' });
    const up = a[1] - hpx - 26 > 70, y = up ? a[1] - hpx - 24 : a[1] + 18; label(a[0], y, recipeName(g), fSans(13, 700), 13, C.ink(1), { pri: 200, bg: true, force: true }); label(a[0], y + 15, l2, fMono(10.5), 10.5, C.mut(1), { pri: 199, bg: true, force: true }); }
}

/* notes on the parts of the opened rung */
function notesOf(rung, sh, pen) {
  const N = STR.note, Rn = sh.R, g = sh.g, out = [];
  if (rung === 'matter' && g.carrier === 'charge') out.push([825, 24, (26 + Rn.M.eg * 24) * pen.fit(24, 110) + 8, N.gap]);
  if (rung === 'switch' && g.carrier === 'charge') { const xv = v => 650 + v * 220, HC = 138 * pen.fit(22, 138); out.push([xv(Rn.V), 22, HC + 4, N.yourV]); out.push([xv(0.3), 22, HC * 0.58, N.siFin]); if (Rn.sw.clean) out.push([xv(Rn.sw.vmin / 2), 2, -6, t(N.band, { v: Rn.sw.vmin.toFixed(2) })]); }
  if (rung === 'gate' && g.carrier === 'charge' && Rn.gate && Rn.gate.p > 1e-11) out.push([520, 186, 0, N.badCell]);
  if (rung === 'sums' && !Rn.broken) out.push(sh.F.adder === 'ripple' ? [520, 36, 20, N.carry] : [520, 34, 110 * pen.fit(34, 104), N.tree]);
  if (rung === 'memory' && !Rn.broken) { if (g.where === 'far') out.push([620, 100, 14, N.far]); if (g.where === 'far' || g.where === 'near') out.push([330, 186, 0, N.regs]); }
  if (rung === 'core' && g.told === 'program' && !Rn.broken) out.push([219, 26, 100 * pen.fit(26, 100) + 6, N.prog]);
  if (rung === 'mind' && !Rn.broken) { out.push([240, 6, 0, N.seven]); out.push([780, 100, 94, N.todayLine]); const ai = NEEDS.indexOf(sh.need); out.push([700 + ai * 31, 100, -12, STR.needShort[sh.need]]); }
  return out;
}

function drawStack(now, tm) {
  PL = []; const ex = cam.ex, fade = smooth((ex - 0.12) / 0.5); if (fade <= 0) return;
  const sh = shown(), rc = stackAt || plotRect(view.n, view.r), Rn = sh.R, nov = A.novelty(sh.g), mat = A.maturityOf(sh.st), sc = A.scoreOf(sh.st), ph = phone();
  const race = NEEDS.map(n => ({ can: sc[n].can, now: sc[n].now, could: sc[n].could, wins: sc[n].wins && nov > 0, aim: n === sh.need }));
  const bi = Rn.broken ? RUNGS.indexOf(Rn.broken) : 9, wl = wave && sh.mine ? wave.k + (now - wave.t0) / 95 : 99; if (wave && wl > 9.5) wave = null;
  const skew = PD * cam.kx * cam.s, wpx = PW * cam.s, dpx = PD * cam.s * cam.cosT, focus = view.level === 'rung' ? view.i : -1, th = clamp(cam.s * 0.045, 3, 7), grew = clamp(1 - (now - grewAt) / 900, 0, 1);
  ctx.font = fMono(12.5 * U, 500); const vwid = Math.max(...RUNGS.map(r => Math.max(...(Rn.fig[r] || []).map(f => ctx.measureText(f[1]).width), 30))) + 12;
  const Cd = a => (k => C[k]), words = fade > 0.75;
  for (let i = 0; i < 8; i++) {
    const z = i * cam.G * ex, a = proj(rc.x, rc.y, z), rung = RUNGS[i], dead = i > bi, dir = RUNG_DIR[rung];
    const dim = (focus >= 0 && focus !== i ? 0.42 : 1) * (lens && lens.rung !== rung ? 0.5 : 1);
    PL[i] = { x: a[0], y: a[1], w: wpx, d: dpx, skew, z };
    if (a[1] - dpx > vh + 60 || a[1] < -260) continue;
    const m = nov ? mat[dir] : 1, pm = clamp((Math.log10(m) + 2.3) / 2.3, 0, 1), bar = Math.sqrt(m), inFocus = sh.mine && nov && (S.focus.includes(dir) || hoverDir === dir);
    /* the carry: vias from the plate below, a pulse rising in each */
    if (i > 0 && ex > 0.6) {
      const zb = (i - 1) * cam.G * ex, cut = i > bi || (i - 1) >= bi && bi < 9;
      for (let v = 0; v < 3; v++) {
        const lx = (i % 2 ? 3.3 : 3.9) + v * 1.9, b = proj(rc.x + lx, rc.y + 1, zb), tp = proj(rc.x + lx, rc.y + 1, z);
        ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(tp[0], tp[1]); ctx.strokeStyle = cut ? C.bad(0.6 * fade) : C.acc(0.38 * fade); ctx.lineWidth = 1; if (cut) ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
        if (cut) continue;
        const u = REDUCED ? 0.5 : (tm * 0.55 + v * 0.31 + i * 0.17) % 1; ctx.beginPath(); ctx.arc(b[0], lerp(b[1], tp[1], u), 2, 0, 6.283); ctx.fillStyle = C.acc(0.9 * fade); ctx.fill();
        if (wave && wl > i - 1 && wl < i) { const y = lerp(b[1], tp[1], wl - (i - 1)); ctx.beginPath(); ctx.arc(b[0], y, 5, 0, 6.283); ctx.fillStyle = C.acc(1); ctx.shadowColor = C.acc(1); ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0; }
      }
    }
    /* the plate */
    const p = new Path2D(); para(p, a[0], a[1], wpx, dpx, skew);
    ctx.fillStyle = C.panel((C.dark ? 0.9 : 0.93) * fade); ctx.fill(p);
    const flash = wave && Math.abs(wl - i) < 0.7 ? 1 : 0, edge = dead ? C.bad(0.6 * fade) : focus === i || hoverRung === i || flash ? C.acc(0.95 * fade) : C.ink(0.36 * fade * dim);
    ctx.strokeStyle = edge; ctx.lineWidth = focus === i || flash ? 1.8 : 1; if (dead) ctx.setLineDash([5, 4]); ctx.stroke(p); ctx.setLineDash([]);
    /* its front edge is inked as far as its direction is polished */
    ctx.fillStyle = C.ink(0.12 * fade * dim); ctx.fillRect(a[0], a[1], wpx, th);
    if (!dead) { ctx.fillStyle = inFocus ? C.acc((0.85 + 0.15 * grew) * fade) : C.ink(0.72 * fade * dim); ctx.fillRect(a[0], a[1], wpx * Math.max(0.012, bar), th); if (inFocus && grew > 0) { ctx.fillStyle = C.acc(0.5 * grew); ctx.fillRect(a[0], a[1] - 2, wpx * bar, th + 4); } }
    if (!dead && dpx > 20) { const pen = makePen(ctx, proj, cam, rc.x, rc.y, z, i < 7 ? cam.G * ex : 1.5); pen.dash = pm < 0.5 ? [5, 3] : []; ctx.globalAlpha = fade * dim; ctx.lineJoin = 'round'; PIC[rung](pen, C, Rn, sh.F, sh.g, tm, 0.5 + 0.5 * pm, rung === 'mind' ? race : null); ctx.globalAlpha = 1; }
    if (!words) continue;
    /* words on the plate: its name at the front left, what it hands up at the right */
    const al = fade * dim, lx = h => a[0] + 15 + skew * (h / dpx), zone = wpx * 0.185, pxN = clamp(dpx * 0.26, 15, 27), three = dpx >= 74, two = dpx >= 46;
    const yT = a[1] - 9, yW = three ? yT - 15 * U : yT, yN = two ? yW - 14 - pxN * 0.2 : yT - 2;
    label(lx(a[1] - yN), yN, STR.rung[rung], fSerif(pxN, 700), pxN, dead ? C.mut(al) : C.ink(al), { pri: 90 - i, force: true });
    if (sh.mine && yoursAt(rung) && !three) { ctx.fillStyle = C.acc(al); ctx.fillRect(lx(a[1] - yN) - 9, yN - pxN * 0.62, 4, pxN * 0.62); }
    const way = dead ? STR.tag.cannot : rung === 'switch' && sh.g.carrier === 'charge' ? STR.shape[Rn.spec.shape] + ' · ' + Rn.V.toFixed(2) + ' V' : Rn.way[rung] || '';
    if (two) label(lx(a[1] - yW), yW, way, fMono(10.5 * U), 10.5 * U, dead ? C.bad(al) : C.mut(al), { pri: 70, max: zone + (three ? 30 : 10) });
    if (three) { const mineY = sh.mine && yoursAt(rung); label(lx(a[1] - yT), yT, sh.mine ? (mineY ? STR.tag.yours : STR.tag.lab) : STR.tag.sketch, fMono(10.5 * U, mineY ? 600 : 400), 10.5 * U, mineY ? C.acc(al) : C.mut(0.8 * al), { pri: 60, max: zone + 20 }); }
    const figs = (wave && sh.mine && i > wave.k && wl < i ? Rprev.fig[rung] : Rn.fig[rung]) || [];
    if (anim && ex < 0.985) continue;
    if (ph) { const f0 = figs[0]; if (f0) { ctx.font = fMono(11, 500); const vx = a[0] + wpx + skew - 2, w = ctx.measureText(f0[1]).width; label(vx, a[1] - dpx - 6, f0[1], fMono(11, 500), 11, f0[2] ? C.bad(al) : C.ink(al), { align: 'right', pri: 50 }); label(vx - w - 14, a[1] - dpx - 6, f0[0], fSans(11), 11, C.mut(al), { align: 'right', pri: 49 }); } continue; }
    const X = a[0] + wpx + Math.max(skew, 0) + 20, big = focus === i, rowH = Math.min(17 * U, (cam.G * cam.sinT * cam.s - 9) / 4), top = rung === 'mind' ? 2 : 0, n = figs.length, y0 = a[1] - dpx / 2 - ((n + 1) * rowH) / 2 + 11 - top * rowH - (top ? 6 : 0);
    if (rung === 'mind' && !dead) { const s = sc[sh.need], head = !nov ? STR.race.level : s.can ? t(STR.race.times, { x: times(s.now) }) : t(STR.race.cannot, { what: STR.cant[A.missesOf(sh.g, sh.need)[0]] || '' });
      label(X, y0, head, fSerif(15.5 * U, 600), 15.5 * U, s.can || !nov ? C.ink(al) : C.bad(al), { pri: 86, force: true });
      label(X, y0 + rowH, asNeed(sh.need) + (nov && s.can ? ' · ' + t(STR.field.could, { x: times(s.could) }) : ''), fSans(12 * U), 12 * U, C.mut(al), { pri: 85 }); }
    figs.forEach((f, k) => { const y = y0 + (k + top) * rowH; label(X, y, f[1], fMono(12.5 * U, 500), 12.5 * U, f[2] ? C.bad(al) : C.ink(al), { pri: 80 - k }); label(X + (f[1] ? vwid : 0), y, f[0], fSans(12 * U), 12 * U, f[2] && !f[1] ? C.bad(al) : C.mut(al), { pri: 78 - k }); });
    if (!dead) { const y = y0 + (n + top) * rowH + 1, f = Rn.fid[rung]; fidGlyph(X, y, f, a2 => C.mut(a2 * al)); label(X + 19, y, STR.fid[f] + (nov && big ? ' · ' + t(STR.tag.polish, { p: pct(m) }) : ''), fMono(10.5 * U), 10.5 * U, C.mut(al), { pri: 40 }); }
    if (i === 0 && !dead && rowH >= 16.5) { const y = y0 - rowH - 2; ctx.beginPath(); ctx.moveTo(X + 1, y); ctx.lineTo(X + 5, y - 7); ctx.lineTo(X + 9, y); ctx.strokeStyle = C.acc(al); ctx.lineWidth = 1.3; ctx.stroke(); label(X + 15, y, STR.hands, fSans(11.5 * U), 11.5 * U, C.acc(al), { pri: 39 }); }
    if (big && NOTE_ON) { const pen = makePen(ctx, proj, cam, rc.x, rc.y, z, i < 7 ? cam.G * ex : 1.5); for (const [nx, ny, nh, txt] of notesOf(rung, sh, pen)) { const q = pen.q(nx, ny, nh); label(q[0], q[1] - 5, txt, fSans(12.5), 12.5, C.ink(1), { pri: 95, bg: true, align: 'center' }); } }
  }
  /* the gene that chooses each fork: a bracket beside the rungs it rules */
  if (!ph && words && PL[7] && focus < 0) for (const k of A.GENES) { const [lo, hi] = GENE_AT[k], x = PL[lo].x - 12, y0 = PL[lo].y + 2, y1 = PL[hi].y - PL[hi].d * 0.7; ctx.beginPath(); ctx.moveTo(x + 6, y0); ctx.lineTo(x, y0); ctx.lineTo(x, y1); ctx.lineTo(x + 6, y1); ctx.strokeStyle = C.acc(0.75 * fade); ctx.lineWidth = 1.3; ctx.stroke(); }
}

function draw(now) {
  const tm = REDUCED ? 0 : now / 1000;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, vw, vh);
  drawGround(now); flushLabels();
  drawStack(now, tm); flushLabels();
}

/* ---------- the page's own controls: built once from STR, kept in step by ui() ---------- */
function build() {
  document.title = STR.doc; cv.setAttribute('aria-label', STR.aria.world);
  $('#lab').textContent = STR.lab; $('#ttl').textContent = STR.title;
  $('#rail').setAttribute('aria-label', STR.rail.aria);
  $('#rail').innerHTML = ['field', 'niche', 'stack'].map(k => '<button type="button" data-go="' + k + '">' + esc(STR.rail[k]) + '</button>').join('') + '<i id="pin"></i>';
  $('#reset').textContent = STR.tools.reset; $('#reset').setAttribute('aria-label', STR.tools.resetAria); $('#theme').setAttribute('aria-label', STR.tools.theme);
  $('#rungs').innerHTML = RUNGS.map((r, i) => '<button type="button" data-rung="' + i + '">' + esc(t(STR.tag.open, { rung: STR.rung[r] })) + '</button>').reverse().join('');
  $('#genes').innerHTML = [...A.GENES, 'aim'].map(k => '<div class="gene" data-gene="' + k + '"><span>' + esc(STR.gene[k]) + '</span><button type="button" class="way" data-pop="' + k + '" aria-haspopup="true"></button></div>').join('');
  $('#dock').innerHTML = '<div class="clock"><b id="yr"></b><span id="ppl"></span><button type="button" id="again" class="lnk" hidden>' + esc(STR.dock.again) + '</button></div>' +
    '<div class="dirs" id="dirs" role="group" aria-label="' + esc(STR.dock.into) + '">' + [...A.DIRS, 'people'].map(d => '<button type="button" data-dir="' + d + '" aria-pressed="false"><span class="nm">' + esc(STR.dir[d]) + '</span><span class="bar"><i></i></span><span class="v"></span></button>').join('') + '</div>' +
    '<div class="go"><button type="button" id="grow1" class="btn pri">' + esc(STR.dock.grow) + '</button><button type="button" id="grow5" class="btn">' + esc(STR.dock.five) + '</button><button type="button" id="more" class="btn" aria-expanded="false">' + esc(STR.dock.more) + '</button></div>' +
    '<div class="ag"><button type="button" id="ask" class="btn">' + esc(STR.dock.ask) + '</button><button type="button" id="explore" class="btn">' + esc(STR.dock.explore) + '</button></div>';
}
const seg = (key, opts, cur, dis = []) => '<span class="seg" role="group">' + opts.map(([v, tx, sub]) => '<button type="button" data-k="' + key + '" data-v="' + esc(v) + '" aria-pressed="' + (String(cur) === String(v)) + '"' + (dis.includes(v) ? ' disabled' : '') + (sub ? ' title="' + esc(sub) + '"' : '') + '>' + esc(tx) + '</button>').join('') + '</span>';
const row = (lbl, html) => '<div class="row"><span class="lbl">' + esc(lbl) + '</span>' + html + '</div>';
const geneRow = k => row(STR.gene[k], seg('g:' + k, A.OPTIONS[k].map(o => [o, STR.opt[k][o][0], STR.opt[k][o][1]]), S.g[k]));
function ctlHTML(i) {
  const r = RUNGS[i], F = S.F, c = STR.ctl, charge = S.g.carrier === 'charge'; let h = '';
  if (GENE_OF[r]) h += geneRow(GENE_OF[r]);
  if (R.broken && i > 1) return h + '<p class="warn">' + esc(STR.say.broken) + '</p>';
  if (r === 'matter' && charge) h += row(c.mat, seg('mat', SW.MATERIALS.map(m => [m.id, STR.mat[m.id]]), F.mat));
  if (r === 'switch' && charge) { const ok = SW.shapesFor(R.M), sw = R.sw;
    h += row(c.shape, seg('shape', SW.SHAPES.map(s => [s.id, STR.shape[s.id]]), R.spec.shape, SW.SHAPES.map(s => s.id).filter(x => !ok.includes(x)))) + row(c.mech, seg('mech', SW.MECHS.map(m => [m.id, STR.mech[m.id]]), F.mech)) +
      '<div class="row"><label class="lbl" for="volt">' + esc(c.V) + '</label><input id="volt" type="range" min="0.15" max="1" step="0.01" value="' + F.V + '"><output id="vout">' + F.V.toFixed(2) + ' V</output></div>' +
      (sw.clean && !sw.pair ? '<p class="warn">' + esc(c.onecar) + '</p>' : '') + (sw.clean && !sw.survives ? '<p class="warn">' + esc(c.melted) + '</p>' : ''); }
  if ((r === 'matter' || r === 'switch' || r === 'gate') && !charge && r !== 'matter') h += '<p class="quiet">' + esc(c.noEngine) + '</p>';
  if (r === 'gate' && charge) h += row(c.lib, seg('lib', [['nand', STR.lib.nand], ['rich', STR.lib.rich]], F.lib));
  if (r === 'sums') h += row(c.adder, seg('adder', [['ripple', STR.adder.ripple], ['look', STR.adder.look]], F.adder)) + row(c.vote, seg('vote', [[0, STR.vote[0]], [1, STR.vote[1]]], F.vote));
  if (r === 'memory') h += row(c.regs, seg('regs', [[8, '8'], [16, '16'], [32, '32']], F.regs));
  if (r === 'core' && S.g.told === 'program') h += row(c.stages, seg('stages', [[1, STR.stages[1]], [3, STR.stages[3]], [5, STR.stages[5]]], F.stages));
  if (r === 'machine') h += row(c.units, seg('ui', UNITS[S.g.shape].map((n, k) => [k, n.toLocaleString('en') + ' ' + STR.unit[S.g.shape]]), F.ui));
  if (r === 'mind') h += row(c.aim, seg('aim', NEEDS.map(n => [n, STR.need[n]]), S.aim, NEEDS.filter(n => !A.potentialOf(S.g, n)))) + row(c.bits, seg('bits', [[1, '1'], [2, '2'], [4, '4'], [8, '8']], F.bits));
  const fk = STR.forks[r]; if (fk.length) h += '<div class="row forks"><span class="lbl">' + esc(c.forks) + '</span>' + fk.map(([tx, href]) => '<a href="' + STR.site + href + '" target="_blank" rel="noopener">' + esc(tx) + '</a>').join('') + '</div>';
  return h + '<button type="button" class="btn done" data-out="1">' + esc(c.done) + '</button>';
}
let popKey = null;
const pop = () => { if (!popKey) return false; popKey = null; $('#pop').hidden = true; return true; };
function closeAll() { pop(); lens = null; proposals = null; }
function openPop(k, anchor) {
  if (popKey === k) { pop(); return; }
  popKey = k; const el = $('#pop'), yr = S.A.year; let h = '';
  if (k === 'aim') { const sc = A.scoreOf(S.A); h = NEEDS.map(n => { const s = sc[n], cant = !s.can; return '<button type="button" data-opt="' + n + '" aria-pressed="' + (n === S.aim) + '"' + (cant ? ' disabled' : '') + '><b>' + esc(STR.need[n]) + '</b><span>' + esc(cant ? t(STR.field.cant, { what: STR.cant[A.missesOf(S.g, n)[0]] || '' }) : A.novelty(S.g) ? t(STR.field.now, { x: times(s.now) }) + ' · ' + t(STR.field.could, { x: times(s.could) }) : STR.race.level) + '</span></button>'; }).join(''); }
  else h = (yr ? '<p>' + esc(t(STR.agent.loses, { dirs: A.LINK[k].map(d => STR.dir[d].toLowerCase()).join(', ') })) + '</p>' : '') + A.OPTIONS[k].map(o => { const g2 = Object.assign({}, S.g, { [k]: o }), kn = A.knownOf(g2), d = A.novelty(g2);
    return '<button type="button" data-opt="' + o + '" aria-pressed="' + (S.g[k] === o) + '"><b>' + esc(STR.opt[k][o][0]) + '</b><span>' + esc(STR.opt[k][o][1]) + '</span>' + (fxOf(k, o) ? '<span class="fx">' + esc(fxOf(k, o)) + '</span>' : '') + '<em>' + esc(!d ? STR.recipe.today : kn ? STR.known[kn.id] + ', ' + STR.st[kn.status] : STR.recipe.newOne) + '</em></button>'; }).join('');
  el.innerHTML = h; el.hidden = false; el.dataset.for = k;
  const b = anchor.getBoundingClientRect(), w = Math.min(340, vw - 24); el.style.width = w + 'px'; el.style.left = clamp(b.left, 12, vw - w - 12) + 'px';
  const hh = el.offsetHeight; el.style.top = clamp(b.bottom + 8 + hh > vh - 12 ? b.top - hh - 8 : b.bottom + 8, 12, Math.max(12, vh - hh - 12)) + 'px';
  const first = el.querySelector('[aria-pressed=true]') || el.querySelector('button'); if (first) first.focus({ preventScroll: true });
}
function ui() {
  const nov = A.novelty(S.g), today = !nov, broken = !!R.broken, lvl = view.level, sh = lvl !== 'field' ? shown() : null, mine = !sh || sh.mine;
  document.body.dataset.level = lvl; document.body.classList.toggle('sketch', !mine);
  const rl = railAt(); lastRl = rl;
  $$('#rail button').forEach(b => { const on = b.dataset.go === rl; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'true' : 'false'); if (b.dataset.go === 'stack') b.textContent = mine ? STR.rail.stack : STR.rail.other; });
  $('#pin').style.left = { field: '16.6%', niche: '50%', stack: '83.3%' }[rl];
  /* the dock: time */
  const mat = A.maturityOf(S.A), sug = nov && !broken ? A.suggest(S.A, 'archniche').dirs : [];
  $('#yr').textContent = today ? STR.dock.today : broken ? STR.dock.broken : t(STR.dock.year, { y: S.A.year });
  $('#ppl').textContent = today ? STR.dock.todaySub : t(STR.dock.people, { p: Math.round(S.A.people).toLocaleString('en'), n: Math.round(S.A.people * A.ATTEMPTS).toLocaleString('en') });
  $('#again').hidden = !(S.A.year > 0 && nov);
  $$('#dirs button').forEach(b => { const d = b.dataset.dir, m = d === 'people' ? clamp(Math.log10(S.A.people / 4) / 3, 0.02, 1) : clamp(Math.sqrt(mat[d]), 0.02, 1);
    b.disabled = today || broken; b.setAttribute('aria-pressed', S.focus.includes(d)); b.classList.toggle('sug', sug.includes(d)); b.title = sug.includes(d) ? STR.dock.suggested : '';
    b.querySelector('i').style.width = (today ? 100 : m * 100) + '%'; b.querySelector('.v').textContent = d === 'people' ? Math.round(S.A.people).toLocaleString('en') : today ? '100%' : pct(mat[d]); });
  $('#grow1').disabled = $('#grow5').disabled = $('#ask').disabled = today || broken;
  /* the forks beside the stack */
  if (sh) $$('#genes .gene').forEach(el => { const k = el.dataset.gene, b = el.querySelector('button'); b.textContent = k === 'aim' ? STR.need[sh.need] : STR.opt[k][sh.g[k]][0]; b.disabled = !sh.mine; b.classList.toggle('forked', k !== 'aim' && sh.g[k] !== A.TODAY[k]); });
  /* the opened rung's controls */
  const ctl = $('#ctl'), key = lvl === 'rung' && mine ? view.i + '|' + JSON.stringify(S.F) + mineKey() + S.aim : '';
  if (ctl.dataset.key !== key) { const act = document.activeElement, sel = act && ctl.contains(act) && act.dataset.k ? '[data-k="' + act.dataset.k + '"][data-v="' + act.dataset.v + '"]' : null, slide = act && act.id === 'volt';
    if (!(slide && key)) { ctl.innerHTML = key ? ctlHTML(view.i) : ''; if (sel) { const b = ctl.querySelector(sel); if (b) b.focus({ preventScroll: true }); } } else $('#vout').textContent = S.F.V.toFixed(2) + ' V';
    ctl.dataset.key = key; ctl.hidden = !key; }
  /* another recipe's sketch */
  const card = $('#card');
  if (sh && !sh.mine) { const kn = A.knownOf(sh.g), a = sh.att; card.innerHTML = '<span>' + esc(kn ? t(STR.plot.built, { name: STR.known[kn.id], status: STR.st[kn.status] }) + ' ' + STR.plot.sketch : a && a.by === 'agent' ? t(STR.plot.agent, { y: a.years }) : a && a.by === 'ledger' ? STR.plot.ledger : STR.plot.sketch) + '</span><button type="button" class="btn pri" id="take">' + esc(STR.plot.take) + '</button><button type="button" class="btn" id="tomine">' + esc(STR.plot.mine) + '</button>'; card.hidden = false; } else card.hidden = true;
  /* the questions that bite here, at most three */
  const mk = $('#marks'); mk.innerHTML = sh && sh.mine ? marks.map((m, k) => '<button type="button" data-mark="' + k + '" aria-pressed="' + !!(lens && lens.rung === m.rung && lens.id === m.id) + '" class="' + (lens && !(lens.rung === m.rung && lens.id === m.id) ? 'dim' : '') + '" aria-label="' + esc(STR.q[m.id][0]) + '"><i></i><span>' + esc(STR.q[m.id][0]) + '</span></button>').join('') : '';
  const ln = $('#lens'); if (lens) { const m = marksOf(R, S.F, S.g).find(x => x.rung === lens.rung && x.id === lens.id); ln.innerHTML = '<q>' + esc(STR.q[lens.id][1]) + '</q><p>' + esc(m ? m.here : '') + '</p><button type="button" class="btn" data-lens="off">' + esc(STR.here.down) + '</button>'; ln.hidden = false; } else ln.hidden = true;
  /* the agents' forks: they propose, you decide */
  const cs = $('#cards');
  if (proposals) cs.innerHTML = proposals.length ? '<p>' + esc(STR.agent.head) + ' <button type="button" class="lnk" data-fork="x">' + esc(STR.agent.dismiss) + '</button></p><div class="hand">' + proposals.map((p, k) => '<div class="prop"><span class="k">' + esc(STR.agent.proposes) + '</span><b>' + esc(STR.opt[p.gene][p.option][0]) + '</b><span>' + esc(STR.gene[p.gene].toLowerCase()) + '</span><span class="n">' + esc(t(STR.agent.could, { n: p.could })) + '</span><span class="' + (p.lost.length ? 'lose' : '') + '">' + esc(p.lost.length ? t(STR.agent.loses, { dirs: p.lost.map(d => STR.dir[d].toLowerCase()).join(', ') }) : STR.agent.keeps) + '</span><button type="button" class="btn pri" data-fork="' + k + '">' + esc(STR.agent.fork) + '</button></div>').join('') + '</div>' : '<div class="prop none"><span>' + esc(STR.agent.none) + '</span><button type="button" class="btn" data-fork="x">' + esc(STR.agent.dismiss) + '</button></div>';
  cs.hidden = !proposals; document.body.classList.toggle('cards', !!proposals);
  if (!!proposals !== lastCards) { lastCards = !!proposals; requestAnimationFrame(() => { measure(); if (anim) return; if (view.level === 'stack') fly(poseStack(view.n, view.r), 450); else if (view.level === 'rung') fly(poseRung(view.n, view.r, view.i), 450); }); }
  const fb = $('#fidb'), ff = lvl === 'field' ? 'idea' : lvl === 'rung' ? sh.R.fid[RUNGS[view.i]] : null; fb.hidden = !ff; if (ff) { fb.innerHTML = '<i class="g g' + ({ guess: 0, idea: 1, figures: 2, computed: 3 }[ff]) + '"><u></u><u></u><u></u><u></u></i>' + esc(STR.fid[ff]); fb.dataset.f = lvl === 'field' ? 'field' : ff; }
  rest = restLine(rl === 'stack' ? sh : null); if (!saying) $('#say').textContent = rest;
  dirty = true;
}
/* which stop of the rail the camera is at: during a flight it follows the camera, not where the flight is going */
let lastRl = null, lastCards = false;
function railAt() {
  const f = poseField().s;
  if (view.level !== 'field' && (!anim || cam.ex > 0.5)) return 'stack';
  if (view.level !== 'field') return cam.s > f * 1.45 ? 'niche' : 'field';
  return cam.s > f * 1.45 || (anim && anim.to.s > f * 1.45) ? 'niche' : 'field';
}
/* where the page's controls stand: on the picture, beside the part they are about */
function place() {
  if (railAt() !== lastRl) ui();
  const lvl = view.level, on = cam.ex > 0.97 && !anim && PL[7], ph = phone(), rc = plotRect(view.n, view.r);
  const G = $('#genes'); G.classList.toggle('on', !!(on && lvl === 'stack' && !ph));
  if (on && lvl === 'stack' && !ph) $$('#genes .gene').forEach(el => { const k = el.dataset.gene, [lo, hi] = k === 'aim' ? [7, 7] : GENE_AT[k], y = (PL[lo].y + PL[hi].y - PL[hi].d * 0.7) / 2; el.style.top = y + 'px'; el.style.right = (vw - PL[lo].x + 26) + 'px'; el.style.maxWidth = Math.max(120, PL[lo].x - 44) + 'px'; });
  const M = $('#marks'); M.classList.toggle('on', !!(on && lvl !== 'field'));
  if (on) $$('#marks button').forEach(b => { const m = marks[+b.dataset.mark]; if (!m) return; const i = RUNGS.indexOf(m.rung), q = proj(rc.x + m.at[0] / 100, rc.y + m.at[1] / 100, PL[i].z); b.style.left = q[0] + 'px'; b.style.top = q[1] + 'px'; b.hidden = q[1] < 64 || q[1] > vh - 110; if (lens && lens.rung === m.rung && lens.id === m.id && !ph) { const ln = $('#lens'), w = ln.offsetWidth, h = ln.offsetHeight; ln.style.left = clamp(q[0] - w / 2, 14, vw - w - 14) + 'px'; ln.style.top = clamp(q[1] + 24 + h > vh - 130 ? q[1] - h - 26 : q[1] + 24, 70, vh - h - 20) + 'px'; } });
  const ctl = $('#ctl'); ctl.classList.toggle('on', !!(on && lvl === 'rung'));
  if (on && lvl === 'rung' && !ph && PL[view.i]) { const p = PL[view.i], w = Math.min(980, vw - 48); ctl.style.width = w + 'px'; ctl.style.left = clamp(p.x + p.w / 2 - w / 2, 16, vw - w - 16) + 'px'; ctl.style.top = Math.min(p.y + 30, vh - ctl.offsetHeight - 14) + 'px'; }
  else if (ph) { ctl.style.width = ''; ctl.style.left = ''; ctl.style.top = ''; }
  void 0;
}

/* ---------- hands: wheel, drag, pinch, tap, keys ---------- */
function plateAt(X, Y) { for (let i = 7; i >= 0; i--) { const p = PL[i]; if (!p) continue; const ly = (p.y - Y) / p.d, lx = (X - p.x - p.skew * ly) / p.w; if (ly >= -0.08 && ly <= 1.02 && lx >= 0 && lx <= 1) return i; } return -1; }
const live = h => h && (POT[h.n][h.ri] > 0 || CEN.P[h.n][h.ri]) ? h : null;
function clampCam() { cam.x = clamp(cam.x, SHEET.x0, SHEET.x1); cam.y = clamp(cam.y, SHEET.y0, SHEET.y1); }
function zoomAt(X, Y, f) {
  const lo = fitAll() * 0.85, hi = poseStack(view.n, view.r).s * 0.3, [wx, wy] = unproj(X, Y), ns = clamp(cam.s * f, lo, hi);
  cam.s = ns; cam.x = wx - (X - vw / 2 - cam.ox) / ns; cam.y = wy + (Y - vh / 2 - cam.oy) / ns; clampCam(); dirty = true; ui();
  return ns >= hi * 0.999;
}
let wlock = 0;
cv.addEventListener('wheel', e => {
  e.preventDefault(); if (anim) return; const now = performance.now(), inw = e.deltaY < 0;
  if (view.level === 'field') { const top = zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0017)); if (top && inw && now > wlock) { const h = live(plotAt(...unproj(e.clientX, e.clientY))); if (h) { wlock = now + 900; goStack(h.n, h.ri); } } return; }
  if (now < wlock || Math.abs(e.deltaY) < 4) return; wlock = now + 900;
  if (!inw) goOut(); else if (view.level === 'stack') { const i = plateAt(e.clientX, e.clientY); if (i >= 0 && onMine()) goRung(i); }
}, { passive: false });
const ptr = new Map(); let drag = null, pinch = null;
cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); pop(); if (ptr.size === 1) drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: 0 }; else if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: cam.s }; drag = null; } });
cv.addEventListener('pointermove', e => {
  if (ptr.has(e.pointerId)) ptr.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && ptr.size === 2) { const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = d / pinch.d; if (anim) return;
    if (view.level === 'field') { const top = zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, pinch.s * r / cam.s); if (top && r > 1.25) { const h = live(plotAt(...unproj((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))); if (h) { pinch = null; goStack(h.n, h.ri); } } }
    else if (r < 0.75) { pinch = null; goOut(); } return; }
  if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.abs(dx), Math.abs(dy)); if (view.level === 'field' && !anim && drag.moved > 4) { cam.x = drag.cx - dx / cam.s; cam.y = drag.cy + dy / cam.s; clampCam(); dirty = true; } return; }
  if (e.pointerType === 'mouse') { let h = null, hr = -1; if (view.level === 'field' && !anim) h = plotAt(...unproj(e.clientX, e.clientY)); else if (!anim) hr = plateAt(e.clientX, e.clientY);
    if ((h ? h.n + '/' + h.ri : '') !== (hover ? hover.n + '/' + hover.ri : '') || hr !== hoverRung) { hover = h; hoverRung = hr; dirty = true; } cv.style.cursor = (h && live(h)) || (hr >= 0 && hr !== view.i) ? 'pointer' : view.level === 'field' ? 'grab' : 'default'; }
});
const up = e => { const was = drag; ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; if (ptr.size === 0) drag = null; if (was && was.moved < 6 && e.type === 'pointerup') tap(e.clientX, e.clientY); };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', () => { if (hover || hoverRung >= 0) { hover = null; hoverRung = -1; dirty = true; } });
function tap(X, Y) {
  if (anim) return;
  if (view.level === 'field') { const h = live(plotAt(...unproj(X, Y))); if (!h) return; if (PW * cam.s < 64) goNear(h.n, h.ri); else goStack(h.n, h.ri); return; }
  const i = plateAt(X, Y); if (i >= 0) { if (i !== view.i) goRung(i); } else if (view.level === 'rung') goOut();
}
addEventListener('keydown', e => {
  if (e.key === 'Escape') { goOut(); return; }
  if (e.target.closest && e.target.closest('input,#pop,#ctl,#dock')) return;
  if (e.key === '-' || e.key === '_') goOut(); else if (e.key === '+' || e.key === '=') { if (view.level === 'field') goStack(view.n, view.r); else if (view.level === 'stack') goRung(1); }
  else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && view.level !== 'field') { e.preventDefault(); goRung(clamp((view.i < 0 ? (e.key === 'ArrowUp' ? -1 : 8) : view.i) + (e.key === 'ArrowUp' ? 1 : -1), 0, 7)); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('button,a'); if (!b) { if (!e.target.closest('#pop')) pop(); return; }
  const d = b.dataset;
  if (d.go) { if (d.go === 'field') goField(); else if (d.go === 'niche') goNear(view.level === 'field' ? aimN() : view.n, view.level === 'field' ? mineRi() : view.r); else goStack(aimN(), mineRi()); }
  else if (d.rung) goRung(+d.rung);
  else if (d.pop) openPop(d.pop, b);
  else if (d.opt) { const k = $('#pop').dataset.for; pop(); if (k === 'aim') setAim(d.opt); else setGene(k, d.opt); }
  else if (d.k) { const k = d.k, v = d.v; if (k.startsWith('g:')) setGene(k.slice(2), v); else if (k === 'aim') setAim(v); else setFine(k, ['vote', 'regs', 'stages', 'ui', 'bits'].includes(k) ? +v : v); }
  else if (d.out) goOut();
  else if (d.dir) { const x = d.dir, i = S.focus.indexOf(x); if (i >= 0) S.focus.splice(i, 1); else { S.focus.push(x); if (S.focus.length > A.FOCUS_MAX) S.focus.shift(); } save(); ui(); }
  else if (d.mark) { const m = marks[+d.mark]; lens = lens && lens.rung === m.rung && lens.id === m.id ? null : { rung: m.rung, id: m.id }; ui(); }
  else if (d.lens) { lens = null; ui(); }
  else if (d.fork) { if (d.fork !== 'x') { const p = proposals[+d.fork]; proposals = null; setGene(p.gene, p.option); } else { proposals = null; ui(); } }
  else if (b.id === 'grow1') grow(1); else if (b.id === 'grow5') grow(5);
  else if (b.id === 'ask') { proposals = A.agentForks(S.A); ui(); }
  else if (b.id === 'explore') sweep();
  else if (b.id === 'again') restart();
  else if (b.id === 'more') { const on = document.body.classList.toggle('more'); b.setAttribute('aria-expanded', on); measure(); if (view.level === 'stack' && !anim) fly(poseStack(view.n, view.r), 400); }
  else if (b.id === 'reset') resetAll();
  else if (b.id === 'take') takeOver(); else if (b.id === 'tomine') goStack(aimN(), mineRi());
  else if (b.id === 'theme') { const cur = document.documentElement.dataset.theme || theme; document.documentElement.dataset.theme = cur === 'dark' ? 'light' : 'dark'; setTheme(); }
  else if (b.id === 'fidb') say(STR.fid.line[b.dataset.f] || '');
});
document.addEventListener('input', e => { if (e.target.id === 'volt') setFine('V', +e.target.value); });
document.addEventListener('focusin', e => { const b = e.target.closest && e.target.closest('#rungs button'); hoverRung = b ? +b.dataset.rung : hoverRung; if (b) dirty = true; });
$('#dock').addEventListener('pointerover', e => { const b = e.target.closest('[data-dir]'); hoverDir = b ? b.dataset.dir : null; dirty = true; });
$('#dock').addEventListener('pointerleave', () => { hoverDir = null; dirty = true; });
matchMedia('(prefers-color-scheme: light)').addEventListener('change', setTheme);

/* ---------- the loop ---------- */
function measure() { const cs = $('#cards'); footH = Math.max($('#dock').getBoundingClientRect().height, $('#card').getBoundingClientRect().height) + (cs.hidden ? 0 : cs.getBoundingClientRect().height + 8) + (innerWidth < 760 ? 52 : 34); }
function resize() {
  vw = innerWidth; vh = innerHeight; U = clamp(vw / 1750, 1, 1.4); measure(); dpr = Math.min(devicePixelRatio || 1, Math.sqrt(7e6 / (vw * vh)), 2.5);
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  const p = view.level === 'field' ? null : view.level === 'rung' ? poseRung(view.n, view.r, view.i) : poseStack(view.n, view.r);
  if (p && !anim) { Object.assign(cam, { x: p.x, y: p.y, z: p.z, s: p.s, T: p.T, G: p.G, ex: p.ex, ox: p.ox, oy: p.oy }); trig(); } else if (!anim) { const f = poseField(); if (cam.s < f.s * 1.3) { Object.assign(cam, { x: f.x, y: f.y, s: f.s, ox: f.ox, oy: f.oy }); } trig(); }
  dirty = true;
}
function loop(now) {
  stepAnim(now);
  const amb = !REDUCED && (cam.ex > 0.25 || pings.length || wave || now - grewAt < 1000);
  if (saying && now - sayT > 7000) { saying = false; const el = $('#say'); el.textContent = rest; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
  if (dirty || amb) { dirty = false; draw(now); place(); }
  requestAnimationFrame(loop);
}
setTheme(); build(); recount(); marks = topMarks(marksOf(R, S.F, S.g)); ui();
addEventListener('resize', () => { resize(); ui(); });
resize();
{ const f = poseField(); Object.assign(cam, { x: f.x, y: f.y, z: 0, s: f.s, T: 0, G: f.G, ex: 0, ox: f.ox, oy: f.oy }); trig(); }
const hash = location.hash.replace('#', '');
if (!A.novelty(S.g) && !RUNGS.some(yoursAt)) say(STR.say.hello);
if (hash === 'field') ui();
else if (REDUCED || hash) { view.level = 'stack'; const p = poseStack(view.n, view.r); Object.assign(cam, { x: p.x, y: p.y, z: p.z, s: p.s, T: p.T, G: p.G, ex: 1, ox: p.ox, oy: p.oy }); trig(); if (hash.startsWith('rung/')) goRung(Math.max(0, RUNGS.indexOf(hash.slice(5)))); ui(); }
else { ui(); setTimeout(() => { if (view.level === 'field' && !anim && !drag) goStack(aimN(), mineRi(), 2100); }, 900); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; });
requestAnimationFrame(loop);
/* for the lab's own checks */
window.OSLW = { S, view, cam, A, goField, goNear, goStack, goRung, goOut, setGene, setFine, setAim, grow, sweep, ask: () => { proposals = A.agentForks(S.A); ui(); }, busy: () => !!anim, mine: () => [aimN(), mineRi()], at: (n, ri) => { const rc = plotRect(n, ri); return proj(rc.x + PW / 2, rc.y + PD / 2); }, plates: () => PL, RECIPES, RIDX, ms: () => { const t0 = performance.now(); for (let i = 0; i < 20; i++) draw(performance.now()); return (performance.now() - t0) / 20; } };
