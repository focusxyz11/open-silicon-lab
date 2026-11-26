/* Hold's kit (the first page, src/v2/hold.js): its words, what the visitor has set and done, the sources, the twelve
   challenges and where each is played, and the words that go with each picture. Every picture of the page is a plate,
   one square drawn in 1000 units with its own controls on it (src/v2/holdplates.js). Designed with Claude Fable 5.2
   (prototype D: B's story on A's chip) and brought into the lab with Claude Opus 5.5. */
import { esc } from '../core/esc.js';
import { facts } from '../core/facts.js';
import { t, locale, hasWords } from '../core/i18n.js';
import { ARR, CHALS, CH_AT, COST, COSTSRC, D2011, D71, D94, DGAR, DWALL, ERAS, FDIV, FORMS, GEN, HOLD_KEY, LIGHTS, LOOP, MOMENTS, NAMED_ONLY, NEEDS, WALLS, costAt, heldDone, nodeAt, upTo, yearShown } from '../data/hold.js';
import { figVars, money } from './figures.js';

/* the page's words (hd.*, src/i18n/<lang>/hold.json, with the figures it shares with the blueprint, src/v2/figures.js)
   and the core questions (home.q.*, one at a time) */
export const w = (k, v) => t('hd.' + k, v ? { ...figVars(), ...v } : figVars()), Q = id => t('home.q.' + id);
/* "247 million" times: in French and Spanish a number in words takes "de" before what it counts */
export const xOf = f => (f < 1000 ? nf(f) : f >= 1e6 ? w('cq.xof', { x: sig(f, 2) }) : sig(f, 2));
export const $ = (s, r = ROOT || document) => r.querySelector(s), $$ = (s, r = ROOT || document) => [...r.querySelectorAll(s)];
export const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, f) => a + (b - a) * f, ss = (a, b, v) => { v = clamp((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); };
export const mix = (a, b) => { let v = (a ^ Math.imul(b + 1, 0x9e3779b1)) >>> 0; v ^= v >>> 16; v = Math.imul(v, 0x85ebca6b); v ^= v >>> 13; v = Math.imul(v, 0xc2b2ae35); v ^= v >>> 16; return v >>> 0; };
export const rnd = v => (mix(v, 0x1234567) & 0xffffff) / 0x1000000;
export const nf = n => Math.round(n).toLocaleString(locale());
export const sig = (n, d = 2) => new Intl.NumberFormat(locale(), { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: d }).format(n);
/* the phone's layout (the picture above, the story under it): on a phone, on a tablet held upright (any window under
   1,100 px not much wider than tall), and, with the picture at the left, on a phone turned sideways (under 520 px tall,
   LAND); hold.css asks the same of @media */
const MQ = q => matchMedia(q).matches;
export const PHONE = () => MQ('(max-width:760px),(max-width:1099px) and (max-aspect-ratio:23/20),(max-width:1099px) and (max-height:519px)'), LAND = () => innerWidth > 760 && innerHeight < 520 && PHONE();
/* the page's root (every popover, sheet and toast is drawn inside it) and whether it is on screen */
export let ROOT = null;
export const LIVE = { on: false };

/* ---- what the visitor has set and done ---- */
export const S = { night: false, d: 0, press: 0, holding: false, done: {}, tried: {}, out: {}, T: 0,
  gate: { a: 0, b: 0 }, job: 2, bug: { n: 0, worst: false, run: 0 }, light: 0,
  leak: 0, dist: 0, distK: 0, power: { g: 600, shown: 0 }, price: 0, next: { pos: 0, at: -1, wait: 0 },
  lv: 0, lvK: 0, era: 0, eraSeen: {}, arr: 0, arrSeen: {}, need: 0, forms: {}, kept: false, agent: null, place: null,
  cq: { every: 1, hz: false, cores: false, w: false, pick: null, guess: null, msg: '', stage: null, maxD: 0 } };
const subs = []; export const onChange = f => subs.push(f); export const changed = what => { subs.forEach(f => f(what)); keepSoon(); };
/* what the visitor has done and set is kept in this browser (osl-hold) and read back when the page opens, so a reload,
   day or night, or a new language keeps it; the lab counts the challenges done from it (src/v2/game.js firstPage) */
const num = (v, a, b, d) => (typeof v === 'number' && v >= a && v <= b ? v : d), obj = v => (v && typeof v === 'object' ? v : {});
let keepTm = 0;
export function keep() { clearTimeout(keepTm); keepTm = 0; const q = S.cq;
  try { localStorage.setItem(HOLD_KEY, JSON.stringify({ done: S.done, tried: S.tried, kept: S.kept, place: S.place, need: S.need, forms: S.forms, agent: S.agent, eraSeen: S.eraSeen, arrSeen: S.arrSeen,
    gate: S.gate, job: S.job, light: S.light, leak: S.leak, dist: S.dist, price: S.price, power: S.power, cq: { every: q.every, guess: q.guess, hz: q.hz, cores: q.cores, w: q.w } })); } catch (e) { /* no storage */ } }
const keepSoon = () => { clearTimeout(keepTm); keepTm = setTimeout(keep, 300); };
addEventListener('pagehide', () => { if (keepTm) keep(); });
export function restore() { let o = null; try { o = JSON.parse(localStorage.getItem(HOLD_KEY) || 'null'); } catch (e) { o = null; } if (!o || typeof o !== 'object') return;
  const pick = (v, ok) => Object.fromEntries(Object.keys(obj(v)).filter(ok).map(k => [k, 1]));
  S.done = heldDone(o); S.tried = pick(o.tried, k => ['switch', 'memory', 'power', 'cost', 'mgate'].includes(k));
  S.eraSeen = pick(o.eraSeen, k => +k >= 0 && +k < ERAS.length); S.arrSeen = pick(o.arrSeen, k => ARR.some(a => a[0] === k));
  S.need = Math.round(num(o.need, 0, NEEDS.length - 1, 0)); S.forms = Object.fromEntries(Object.entries(obj(o.forms)).filter(([k, v]) => k.length < 40 && FORMS.includes(v)));
  S.place = LOOP.some(l => l[1] === o.place) ? o.place : null; S.kept = o.kept === true; S.agent = o.agent && Number.isFinite(o.agent.n) ? { n: o.agent.n, ok: !!o.agent.ok } : null;
  const g = obj(o.gate), p = obj(o.power), q = obj(o.cq); S.gate = { a: g.a ? 1 : 0, b: g.b ? 1 : 0 };
  S.job = Math.round(num(o.job, 0, 2, 2)); S.light = Math.round(num(o.light, 0, LIGHTS.length - 1, 0)); S.leak = num(o.leak, 0, 330, 0); S.dist = Math.round(num(o.dist, 0, 2, 0)); S.price = o.price === 1 ? 1 : 0;
  S.power = { g: num(p.g, 100, 1550, 600), shown: p.shown ? 1 : 0 };
  Object.assign(S.cq, { every: num(q.every, .5, 4, 1), guess: num(q.guess, 1, 1e16, null), hz: q.hz === true, cores: q.cores === true, w: q.w === true }); }
export function done(id) { if (S.done[id]) return; S.done[id] = 1; changed('done'); toast('<i></i>' + w('toast.done', { n: Object.keys(S.done).length, of: CHALS.length }) + ' · ' + w('ch.' + id)); }
export function tried(id) { if (S.tried[id]) return; S.tried[id] = 1; if (WALLS.every(v => S.tried[v.id])) done('walls'); changed('tried'); }
export function setOut(id, html) { if (S.out[id] === html) return; S.out[id] = html; keepSoon(); $$('[data-out="' + id + '"]').forEach(e => { e.innerHTML = html; }); }

/* ---- day or night: as the lab is set (◐ in the bar), all the way down; the page never changes it by itself ---- */
export const K = { get ink() { return S.night ? '#efece3' : '#131210'; }, get paper() { return S.night ? '#131210' : '#efece3'; }, get plate() { return S.night ? '#1a1917' : '#e8e4d8'; }, red: '#e5401a', get mid() { return S.night ? '#aca89d' : '#6b675d'; } };
export const fg = a => (S.night ? 'rgba(239,236,227,' + a + ')' : 'rgba(19,18,16,' + a + ')');
export const rd = a => 'rgba(229,64,26,' + a + ')';

/* ---- one unit for every size, from the window: the page is composed once and grows with the screen (on a tablet
   held upright too, so no word is under 11 px) ---- */
export function fitU(...also) { const W = innerWidth, H = innerHeight, u = PHONE() ? (W <= 760 ? 1 : clamp(W / 700, 1.05, LAND() ? 1.05 : 1.3)) : clamp(Math.min(W / 1280, H / 790), .86, 2.2); for (const e of [ROOT, ...also]) if (e) e.style.setProperty('--u', u + 'px'); return u; }

/* ---- sources: a small mark beside the number; one sheet for all of them, by chapter ---- */
/* the lab's facts (src/data/facts.json), loaded when the page is first touched; a mark asks for them if it needs them */
export const FACTS = {};
export const loadFacts = () => facts().then(F => { for (const f of Object.values(F)) FACTS[f.id] = [f.source, f.url, f.value, f.verified]; });
export const src = (...ids) => ids.map(id => '<button type="button" class="src" data-f="' + id + '" aria-label="' + esc(w('src.k')) + '">↗</button>').join('');
export const CH_FACTS = { years: ['moore-1965', 'transistor-trend', 'zeloof-garage', 'chm-x86', 'core2-410m', 'northpole', 'rubin-gpu', 'cerebras-cs4', 'node-years', 'node-names', 'clock-stall', 'dual-core-2005', 'asic-vs-cpu', 'fdiv-rate', 'fdiv-charge', 'euv-wavelength', 'high-na-price', 'tsmc-n2', 'node-n2'],
  walls: ['energy-moving-data', 'dc-electricity', 'design-cost-older', 'design-cost-recent', 'design-cost-2nm', 'fab-module-cost', 'wafer-space-run', 'cortical-cl1', 'brain-power', 'minimal-fab'],
  next: ['energy-moving-data', 'hbm4', 'encharge-en100', 'landauer-measured'],
  arch: ['alexnet-gpu', 'epyc-chiplets', 'hbm4', 'encharge-en100', 'cpo-production', 'hala-point'],
  machine: ['asic-vs-cpu', 'fpga-asic-gap'] };
export const CHAPS = ['years', 'walls', 'next', 'arch', 'machine', 'island'];
let pop = null, sheetEl = null, toastEl = null, toastTm = 0;
const inRoot = el => { ROOT.appendChild(el); return el; };
function showPop(b) { b._want = 1;
  if (!FACTS[b.dataset.f]) { if (!Object.keys(FACTS).length) loadFacts().then(() => { if (b._want && FACTS[b.dataset.f]) showPop(b); }); return; }
  if (!pop) { pop = inRoot(h('div', 'srcpop')); }
  const f = FACTS[b.dataset.f]; if (!f) return; $$('.src.on').forEach(e => e.classList.remove('on')); b.classList.add('on');
  pop.innerHTML = '<span class="mono">' + w('src.k') + ' · ' + w('src.verified', { d: esc(f[3]) }) + '</span>' + esc(f[2]) + '<br><a href="' + esc(f[1]) + '" target="_blank" rel="noopener">' + esc(f[0]) + ' ↗</a><button type="button" class="all mono">' + w('sources') + '</button>';
  pop.querySelector('.all').onclick = () => { hidePop(); sheet(true); };
  const r = b.getBoundingClientRect(), pw = Math.min(300, innerWidth - 24); pop.style.left = clamp(r.left - 20, 12, innerWidth - pw - 12) + 'px';
  pop.classList.add('on'); const ph = pop.offsetHeight; pop.style.top = (r.bottom + 8 + ph > innerHeight ? r.top - ph - 8 : r.bottom + 8) + 'px'; }
function hidePop() { if (pop) pop.classList.remove('on'); $$('.src.on').forEach(e => e.classList.remove('on')); }
export function sheet(on) {
  if (on && !Object.keys(FACTS).length) { loadFacts().then(() => sheet(true)); return; }
  if (!sheetEl && on) { sheetEl = inRoot(h('div', 'sheet')); sheetEl.setAttribute('role', 'dialog'); sheetEl.setAttribute('aria-label', w('sheet.h').replace(/<[^>]+>/g, ''));
    /* each source once, in the first chapter that names it, and counted as listed */
    const seen = new Set(), by = Object.entries(CH_FACTS).map(([ch, ids]) => [ch, ids.filter(id => FACTS[id] && !seen.has(id) && seen.add(id))]);
    sheetEl.innerHTML = '<header><div><span class="mono dim">' + w('sheet.k', { n: seen.size }) + '</span><h2 class="anton">' + w('sheet.h') + '</h2></div><p>' + w('sheet.p') + '</p><button type="button" class="bbtn mono" data-x="1">' + w('close') + ' ✕</button></header><div class="cols">' +
      by.map(([ch, ids], i) => '<div class="col"><h3 class="anton"><span>0' + (i + 1) + '</span>' + w('tab.' + ch) + '</h3>' + ids.map(id => '<a class="f" href="' + esc(FACTS[id][1]) + '" target="_blank" rel="noopener"><b>' + esc(FACTS[id][2]) + '</b><span>' + esc(FACTS[id][0]) + ' ↗ · ' + esc(FACTS[id][3]) + '</span></a>').join('') + '</div>').join('') + '</div>';
    $('[data-x]', sheetEl).onclick = () => sheet(false); }
  if (sheetEl) sheetEl.classList.toggle('on', on); }
export function toast(html) { if (!toastEl) { toastEl = inRoot(h('div', 'toast mono')); toastEl.setAttribute('role', 'status'); } toastEl.innerHTML = html; toastEl.classList.add('on'); clearTimeout(toastTm); toastTm = setTimeout(() => toastEl.classList.remove('on'), 2600); }
/* the page's root: sources open on a tap (or under the pointer), Esc closes them */
export function setRoot(r) { ROOT = r;
  r.addEventListener('click', e => { const b = e.target.closest('.src'); if (b) { e.stopPropagation(); e.preventDefault(); if (b.classList.contains('on')) hidePop(); else showPop(b); return; } if (!e.target.closest('.srcpop')) hidePop(); });
  r.addEventListener('mouseover', e => { const b = e.target.closest('.src'); if (b) showPop(b); });
  r.addEventListener('mouseout', e => { const b = e.target.closest('.src'); if (b) b._want = 0; if (b && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.srcpop'))) setTimeout(() => { if (pop && !pop.matches(':hover')) hidePop(); }, 220); });
  addEventListener('keydown', e => { if (LIVE.on && e.key === 'Escape') { sheet(false); hidePop(); } }); }

/* ---- the page's part of the lab's bar: the small chip (its map), the chapter, the twelve challenges, the sources ---- */
export function mkTop(mid, goChallenge) {
  const bar = h('div', 'hbar');
  if (mid) bar.appendChild(mid);
  bar.appendChild(h('span', 'sp'));
  const tl = h('div', 'tally mono'); tl.setAttribute('role', 'group'); tl.innerHTML = '<span class="tl-n"></span><div class="sq">' + CHALS.map(id => '<button type="button" data-ch="' + id + '" data-tip="' + esc(w('ch.' + id)) + '" aria-label="' + esc(w('ch.' + id)) + '"></button>').join('') + '</div>';
  tl.onclick = e => { const b = e.target.closest('[data-ch]'); if (b) goChallenge(b.dataset.ch); };
  const rv = rove($('.sq', tl)), paintTally = () => { const s = w('rail.chals', { n: Object.keys(S.done).length, of: CHALS.length }); $('.tl-n', tl).innerHTML = s; tl.setAttribute('aria-label', s.replace(/<[^>]+>/g, ''));
    $$('[data-ch]', tl).forEach(b => { b.classList.toggle('on', !!S.done[b.dataset.ch]); b.setAttribute('aria-pressed', S.done[b.dataset.ch] ? 'true' : 'false'); }); rv(); };
  onChange(paintTally); paintTally(); bar.appendChild(tl);
  const sb = h('button', 'bbtn mono', '<span>' + w('sources') + '</span>'); sb.type = 'button'; sb.setAttribute('aria-label', w('sources')); sb.onclick = () => sheet(true); bar.appendChild(sb);
  return bar;
}
/* a row of buttons as one stop of the keyboard: Tab comes to the one lit (pick), or to the last one used, and the
   arrows (Home, End) move along it */
export function rove(el, pick) { const L = () => [...el.querySelectorAll('button')]; let last = null;
  const set = () => { const bs = L(); if (bs.includes(document.activeElement)) return; const on = (pick && pick(bs)) || (bs.includes(last) ? last : bs[0]); bs.forEach(b => { const v = b === on ? 0 : -1; if (b.tabIndex !== v) b.tabIndex = v; }); };
  el.addEventListener('keydown', e => { const bs = L(), i = bs.indexOf(document.activeElement); if (i < 0) return; const j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: bs.length - 1 }[e.key]; if (j == null) return;
    e.preventDefault(); last = bs[(j + bs.length) % bs.length]; bs.forEach(b => { b.tabIndex = b === last ? 0 : -1; }); last.focus(); });
  el.addEventListener('focusout', () => setTimeout(set)); set(); return set; }
/* where each challenge is played: a plate, and for the fifty years the count it waits at (src/data/hold.js) */
export { CH_AT };

/* ---- the plates after the wall, in order, and the words that go with each ---- */
export const ORDER = ['years', 'leak', 'distance', 'power', 'price', 'next', 'levels', 'eras', 'arr', 'machine', 'island'];
export const WALL_OF = { leak: 0, distance: 1, power: 2, price: 3 }, WID = ['switch', 'memory', 'power', 'cost'];
export const PW = {
  years: { ch: 'years', name: () => w('tab.years') },
  leak: { ch: 'walls', name: () => w('wall.switch.s'), k: () => w('walls.n', { n: 1 }), viol: 1, h: 'wall.switch.t', sd: 'wall.switch.d', note: 'wall.switch.phys', tryq: 'w.switch.q', q: 'physics', facts: [], ways: [['switches', 'lab', '#/dive/switch'], ['pbits', 'lab', '#/dive/switch']], lab: ['w.switch.lab', '#/dive/switch'] },
  distance: { ch: 'walls', name: () => w('wall.memory.s'), k: () => w('walls.n', { n: 2 }), viol: 2, h: 'wall.memory.t', sd: 'wall.memory.d', tryq: 'w.memory.q', q: 'geo', facts: ['energy-moving-data'], ways: [['stack', 'product', '#/dive/chip'], ['cim', 'product', '#/dive/block']], lab: ['w.memory.lab', '#/dive/block'] },
  power: { ch: 'walls', name: () => w('wall.power.s'), k: () => w('walls.n', { n: 3 }), viol: 3, h: 'wall.power.t', sd: 'wall.power.d', tryq: 'w.power.q', q: 'eff', facts: ['dc-electricity'], ways: [['living', 'product', '#/machines']], lab: ['w.power.lab', '#/place/power'] },
  price: { ch: 'walls', name: () => w('wall.cost.s'), k: () => w('walls.n', { n: 4 }), viol: 4, h: 'wall.cost.t', sd: 'wall.cost.d', tryq: 'w.cost.q', q: 'moore', facts: ['design-cost-older', 'design-cost-2nm', 'fab-module-cost'], ways: [['smallfab', 'lab', '#/machines'], ['liquid', 'product', '#/machines']], lab: ['w.cost.lab', '#/dive/wafer/made'] },
  next: { ch: 'next', name: () => w('tab.next'), k: () => w('next.n'), h: 'next.h', d: 'next.d', tryq: 'next.q', q: 'sutton', facts: ['energy-moving-data', 'landauer-measured'] },
  levels: { ch: 'arch', name: () => w('pl.levels'), k: () => w('arch.n'), h: 'arch.h', d: 'arch.d', tryq: 'arch.q1' },
  eras: { ch: 'arch', name: () => w('era.k'), k: () => w('era.k'), hx: 'eras.h', dx: 'eras.d', tryq: 'arch.q3' },
  arr: { ch: 'arch', name: () => w('pl.arr'), k: () => w('ways.k'), hx: 'arr.h', dx: 'arr.d', tryq: 'arch.ch.q', q: 'copy' },
  machine: { ch: 'machine', name: () => w('tab.machine'), k: () => w('mach.n'), h: 'mach.h', dx: 'mach.d', tryq: 'mach.try', q: 'human', facts: ['asic-vs-cpu', 'fpga-asic-gap'] },
  island: { ch: 'island', name: () => w('tab.island'), k: () => w('isle.n'), h: 'isle.h', dx: 'isle.d', tryq: 'isle.try', q: 'vn' }
};
/* what people are trying: told once, in the blueprint's words (bp.next.*, loaded when the page is first touched),
   except where this page says it its own way */
const wayW = (id, k) => (id === 'switches' || id === 'spikes' ? w('bet.' + id + '.' + k) : t('bp.next.' + id + '.' + k));
/* the words Hold shares with other pages (src/i18n/<lang>/shared.json): '' until they are in, then filled where they show */
export const sw = (k, v) => (hasWords('shared') ? t(k, v ? { ...figVars(), ...v } : figVars()) : '');
export function fillShared() { if (!hasWords('shared')) return; $$('[data-sw]').forEach(e => { e.innerHTML = sw(e.dataset.sw); }); changed('words'); }
export function fillWays() { if (!hasWords('blueprint')) return; $$('.w-ways button[data-way]').forEach(b => { b.querySelector('b').innerHTML = wayW(b.dataset.way, 't'); b.querySelector('span').innerHTML = wayW(b.dataset.way, 'd'); b.hidden = false; }); }
/* a way into the lab: the place where it is played for real */
export const lab = (key, href, cls) => '<a class="' + (cls || 'lnk') + '" href="' + href + '">' + key + '</a>';
/* the words of a plate, as pieces a shell can place: head (kicker and headline), cap, try (the question to try, what
   came out, where it is played for real), q (the core question behind it, alone), ways (what people are trying) */
export function words(id) {
  const p = PW[id], o = {};
  o.head = h('div', 'w-head', '<div class="w-k mono' + (p.viol ? ' viol' : '') + '">' + (p.viol ? '✕ 0' + p.viol + ' · ' : '') + p.k() + '</div><h2 class="w-h anton">' + w(p.h || p.hx) + '</h2>');
  /* a wall says what it is in the words the blueprint uses too (wall.*, shared.json): told once */
  o.cap = h('div', 'w-cap', '<p class="w-d">' + (p.sd ? '<span data-sw="' + p.sd + '">' + sw(p.sd) + '</span>' : w(p.d || p.dx)) + ' ' + src(...(p.facts || [])) + '</p>' + (p.note ? '<p class="w-note mono">' + w(p.note) + '</p>' : ''));
  o.try = h('div', 'w-try', '<div class="w-k mono"><i></i>' + w('try.k') + '</div><p class="w-p">' + w(p.tryq) + '</p><div class="w-out" data-out="' + id + '">' + (S.out[id] || '') + '</div>' + (p.lab ? lab(w('play') + ': ' + w(p.lab[0]), p.lab[1]) : ''));
  if (p.q) o.q = h('div', 'w-q', '<span class="mono">' + w('q.label') + '</span><p>' + Q(p.q) + '</p>' + lab(w('q.meet'), (p.lab && p.lab[1]) || '#/log'));
  if (p.ways && p.ways.length) { o.ways = h('div', 'w-ways', '<span class="mono">' + w('ways.k') + '</span>' + p.ways.map(([wid, st]) => '<button type="button" data-way="' + wid + '" hidden><small class="' + st + '">' + w('status.' + st) + '</small><b></b><span></span></button>').join(''));
    o.ways.onclick = e => { const b = e.target.closest('button'); if (b) b.classList.toggle('open'); }; }
  return o;
}

/* ---- the fifty years: the count, the year, and what is said ---- */
const NARR = [[0, 'one'], [.9, 'not'], [3.4, 'double'], [DGAR - .7, 'garage'], [D71 + 2.3, 'rule'], [16.5, 'coast'], [20.5, 'invisible'], [D94 + 2.5, 'named'], [D2011, 'pay'], [GEN(5), 'gaa'], [DWALL - .9, 'push']];
export const momAt = d => MOMENTS.find(m => d >= m.at && d < m.at + m.span) || null;
export const viewAt = d => { if (d >= DWALL - 1e-4) return 'wall'; const m = momAt(d); return m ? m.id : d < .5 ? 'one' : 'die'; };
export function countParts(d) { const n = d >= DWALL - 1e-4 ? 336e9 : Math.pow(2, d);
  if (n < 1e6) return [nf(n), w(Math.round(n) === 1 ? 'unit.one' : 'unit.many'), ''];
  const big = n >= 1e9, v = n / (big ? 1e9 : 1e6); return [v >= 100 ? Math.round(v) : v.toFixed(1), w('unit.many'), w(big ? 'billion' : 'million')]; }
/* the count and the year in words, as the square says them to a screen reader */
export const countSay = d => { const c = countParts(d); return c[0] + ' ' + (c[2] ? c[2] + ' ' : '') + c[1] + ', ' + w('st.year') + ' ' + yearShown(d); };
function hzW(v) { return v >= 1e9 ? w('st.ghz', { n: (v / 1e9).toFixed(1) }) : v >= 1e6 ? w('st.mhz', { n: Math.round(v / 1e6) }) : w('st.khz', { n: Math.round(v / 1e3) }); }
export function statsHTML(d) { const y = yearShown(d), n = nodeAt(y), hz = upTo('hz', y), co = upTo('cores', y);
  return '<div><span class="mono">' + w('st.year') + '</span><b>' + y + '</b></div><div><span class="mono">' + w('st.node') + '</span><b>' + (n ? (y >= NAMED_ONLY ? w('st.named', { n }) : n) : '–') + '</b></div><div><span class="mono">' + w('st.clock') + '</span><b>' + (hz ? hzW(hz) : '–') + '</b></div><div><span class="mono">' + w('st.cores') + '</span><b>' + (co || (y >= 1971 ? 1 : '–')) + '</b></div>'; }
export function momOut(id) {
  if (id === 'gate') { const o = S.gate.a && S.gate.b; return o ? '<b>' + w('mo.gate.yes.v') + '</b> ' + w('mo.gate.yes') : S.tried.mgate ? w('mo.gate.no') : w('mo.gate.lead'); }
  if (id === 'job') return '<b>' + w('mo.job.' + S.job + '.v') + '</b> ' + w('mo.job.' + S.job + '.d') + ' ' + src('asic-vs-cpu') + (S.done.job ? '<br>' + w('mo.job.after') : '');
  if (id === 'bug') { const b = S.bug; if (b.worst) return '<span class="calc"><span>' + w('mo.bug.right') + ' ' + (FDIV.a / FDIV.b).toFixed(12) + '</span><span class="red">' + w('mo.bug.chip') + ' ' + FDIV.wrong.toFixed(12) + '</span></span>' + w('mo.bug.after') + ' ' + src('fdiv-charge');
    return b.n ? '<b>' + w('mo.bug.wrong0') + '</b> ' + w('mo.bug.ran', { n: nf(b.n), left: sig(Math.max(1, FDIV.rate - b.n)) }) + ' ' + src('fdiv-rate') : w('mo.bug.lead'); }
  const l = LIGHTS[S.light]; return '<b>' + w('mo.light.' + l + '.v') + '</b> ' + w('mo.light.' + l + '.d') + ' ' + (l === 'euv' ? src('euv-wavelength', 'high-na-price') : '') + (S.done.light ? '<br>' + w('mo.light.after') : '');
}
/* what is said at a count: a line of the story, or the moment's thing to try with its question */
export function yearsWordsHTML(d) {
  const v = viewAt(d), m = momAt(d);
  if (v === 'wall') return '<p class="say"><b>' + w('m.wall.h') + '</b> ' + w('m.wall.p') + ' ' + src('node-n2', 'design-cost-2nm') + '</p>';
  if (m) return '<div class="w-try"><div class="w-k mono"><i></i>' + w('mo.' + m.id + '.k') + ' · ' + w('mo.try') + '</div><p class="w-p">' + w('mo.' + m.id + '.q') + '</p><div class="w-out" data-out="m-' + m.id + '">' + momOut(m.id) + '</div></div>';
  let k = 'one'; for (const [at, key] of NARR) if (d >= at) k = key;
  if (k === 'one' && S.press > .5) k = 'on';
  let s = '<p class="say">' + w('m.' + k) + ' ' + ({ garage: src('zeloof-garage'), rule: src('moore-1965', 'transistor-trend'), named: src('node-names'), gaa: src('tsmc-n2'), push: src('rubin-gpu') }[k] || '') + '</p>';
  /* the price of a design: the one for the newest node in production in the year beside the count */
  const c = (k === 'pay' || k === 'gaa') && costAt(yearShown(d));
  if (c) { const i = COST.indexOf(c); s += '<div class="cost"><b>' + money(c[1] * 1e6) + '</b><span class="mono dim">' + w('m.cost.at', { node: c[0] }) + '</span>' + src(COSTSRC[i]) + '</div>'; }
  return s;
}
/* the hold: how fast the count moves. Quick while a smaller transistor was a cheaper one, slower as each design costs
   more, slow at a moment (let go and it waits), and at the wall it stops */
export const Yr = { wallPush: 0, lead: 0,
  set(d) { S.d = clamp(d, 0, DWALL); S.cq.maxD = Math.max(S.cq.maxD, S.d); },
  step(dt) { S.press += ((S.holding ? 1 : 0) - S.press) * Math.min(1, dt * 12);
    if (!S.holding) { this.lead = 0; this.wallPush *= Math.pow(.02, dt); return; }
    if (S.d >= DWALL - 1e-4) { this.wallPush = Math.min(1, this.wallPush + dt * 2.5); return; }
    this.lead += dt; if (S.d < .01 && this.lead < .7) return;
    const m = momAt(S.d), v = m ? .32 : S.d < 2 ? .7 : S.d > D2011 ? 1.0 - .55 * ss(D2011, DWALL, S.d) : 1.9;
    this.set(S.d + v * dt); } };

/* the ways to move through the fifty years, said once, before the first question on the curve takes their place */
export function movesEl() { return h('div', 'moves', '<span class="mono">' + w('moves.k') + '</span>' + ['hold', 'scroll', 'drag', 'tap'].map(k => '<p>' + w('moves.' + k) + '</p>').join('')); }
/* a headline as large as its cell allows: no word cut, and no taller than its share of the cell */
export function fitHead(el, max, maxH) { if (!el || !el.clientWidth) return; let fs = max, n = 0; el.style.fontSize = fs + 'px'; while ((el.scrollWidth > el.clientWidth + 1 || el.offsetHeight > maxH) && fs > 24 && n++ < 60) { fs *= .96; el.style.fontSize = fs + 'px'; } }
/* ---- one loop for everything that moves ---- */
export const TICK = []; let lastTs = 0;
let raf = 0;
function frame(ts) { const dt = Math.min(.05, (ts - lastTs) / 1000 || 0); lastTs = ts; S.T = ts / 1000; for (const f of TICK) f(S.T, dt); raf = requestAnimationFrame(frame); }
export const loop = on => { cancelAnimationFrame(raf); raf = 0; if (on) { lastTs = performance.now(); raf = requestAnimationFrame(frame); } };
/* a hold: press and keep pressing (not on a control), or the space bar */
export function bindHold(el, down, up) { let on = false;
  const rel = () => { if (on) { on = false; el.classList && el.classList.remove('down'); up(); } };
  el.addEventListener('pointerdown', e => { if (e.target.closest('button:not(.holdbtn),input,a,.chart,.nohold')) return; if (e.button) return; on = true; el.classList && el.classList.add('down'); down(e); });
  addEventListener('pointerup', rel); addEventListener('pointercancel', rel); addEventListener('blur', rel);
  el.addEventListener('contextmenu', e => e.preventDefault()); }
export function setHolding(v) { S.holding = v; if (ROOT) ROOT.classList.toggle('holding', v); }
