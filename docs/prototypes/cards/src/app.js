/* The shell: one card at a time, its picture, its two controls, and the same question in the lab. */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function gauss(r) { let u = 0; while (u < 1e-9) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r()); }
function erfc(x) { const z = Math.abs(x), t = 1 / (1 + 0.5 * z); const y = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? y : 2 - y; }
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(d => SUP[+d]).join('');
const comma = n => Math.round(n).toLocaleString('en-US');
/* a count in plain words up to trillions, then powers of ten */
function big(n) {
  if (!isFinite(n)) return 'without end';
  if (n < 1e4) return comma(n);
  if (n < 1e6) return comma(Math.round(n / 100) * 100);
  const U = [[1e6, 'million'], [1e9, 'billion'], [1e12, 'trillion']];
  if (n < 1e15) { let u = U[0]; for (const x of U) if (n >= x[0]) u = x; const v = n / u[0]; return (v < 10 ? v.toFixed(1) : comma(v)) + ' ' + u[1]; }
  const e = Math.floor(Math.log10(n)), m = n / Math.pow(10, e); return m.toFixed(1) + ' × 10' + sup(e);
}
const times = x => '×' + (x >= 100 ? comma(x) : x >= 10 ? x.toFixed(1) : x.toFixed(2));
const pct = (x, d = 0) => (x * 100).toFixed(d) + '%';
/* one in how many */
function oneIn(p) { if (p <= 0 || p < 1e-15) return 'none in a million billion'; if (p >= 0.095) return pct(p); return '1 in ' + big(1 / p); }

const Q = Object.fromEntries(DATA.questions.map(q => [q.id, q]));
const IDS = DATA.questions.map(q => q.id);
const icon = q => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + esc(Q[q].icon) + '"/></svg>';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const el = { pic: $('#pic'), cv: $('#cv'), labels: $('#labels'), cap: $('#cap'), reads: $('#reads'), hu: $('#hu'), vv: $('#vv'), vw: $('#vwrap') };
const ctx = el.cv.getContext('2d');
let cur = null, inst = null, st = { u: 0.5, v: 0.5 }, P = {}, size = { W: 0, H: 0 }, dirty = true;

function palette() {
  const s = getComputedStyle(document.documentElement), g = k => s.getPropertyValue(k).trim();
  P = { bg: g('--bg'), solid: g('--solid'), line: g('--line'), ink: g('--ink'), muted: g('--muted'), blue: g('--accent'), warm: g('--warm'), red: g('--bad'), green: g('--good') };
  dirty = true;
}
function resize() {
  const r = el.pic.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
  size = { W: Math.round(r.width), H: Math.round(r.height) };
  el.cv.width = Math.round(size.W * d); el.cv.height = Math.round(size.H * d); ctx.setTransform(d, 0, 0, d, 0, 0); dirty = true;
}
/* words over the picture are HTML, never drawn into it (the lab's rule) */
let pool = [], want = [];
function syncLabels() {
  while (pool.length < want.length) { const s = document.createElement('span'); s.className = 'lbl'; el.labels.appendChild(s); pool.push({ s, t: '', c: '', x: NaN, y: NaN, a: '' }); }
  pool.forEach((p, i) => { const w = want[i];
    if (!w) { if (p.t !== '') { p.s.textContent = ''; p.t = ''; } return; }
    if (p.t !== w.t) { p.s.textContent = w.t; p.t = w.t; }
    if (p.c !== w.c) { p.s.className = 'lbl ' + w.c; p.c = w.c; }
    if (p.x !== w.x || p.y !== w.y || p.a !== w.a) { p.s.style.transform = 'translate(' + w.x + 'px,' + w.y + 'px)' + (w.a === 'r' ? ' translateX(-100%)' : w.a === 'c' ? ' translateX(-50%)' : ''); p.x = w.x; p.y = w.y; p.a = w.a; } });
}
let readsKey = '';
function syncReads(R) {
  const key = R.map(r => r.k).join('|');
  if (key !== readsKey) { el.reads.innerHTML = R.map(r => '<div class="read"><b></b><span>' + esc(r.k) + '</span></div>').join(''); readsKey = key; }
  [...el.reads.children].forEach((d, i) => { const b = d.firstChild, r = R[i]; if (b.textContent !== r.v) b.textContent = r.v; const c = r.tone || ''; if (b.className !== c) b.className = c; });
}
let capNow = '';
/* nothing moves by itself: the picture is drawn again only when a control changes it (or while a search is still working) */
function frame() {
  requestAnimationFrame(frame);
  if (!inst || !dirty) return;
  dirty = false; want = [];
  const g = { c: ctx, W: size.W, H: size.H, box: { x: 14, y: 30, w: size.W - 28, h: size.H - 44 }, t: 0, dt: 0, u: st.u, v: st.v, P, still: true,
    again: () => { dirty = true; }, lab: (x, y, text, c = '', a = '') => want.push({ x: Math.round(x), y: Math.round(y), t: text, c, a }) };
  ctx.clearRect(0, 0, size.W, size.H);
  const out = inst.frame(g, st) || {};
  syncLabels(); syncReads(out.reads || []);
  const cap = out.cap || CARDS[cur].cap; if (cap !== capNow) { el.cap.textContent = cap; capNow = cap; }
}

/* the two controls: drag across the picture, or the sliders */
function setUV(u, v, from) {
  st.u = clamp(u); if (inst.v0 != null) st.v = clamp(v);
  if (from !== 'hu') el.hu.value = Math.round(st.u * +el.hu.max);
  if (from !== 'vv') el.vv.value = Math.round(st.v * +el.vv.max);
  el.hu.setAttribute('aria-valuetext', CARDS[cur].h[1]); dirty = true;
}
let drag = null;
el.pic.addEventListener('pointerdown', e => { const r = el.pic.getBoundingClientRect(); drag = { x: e.clientX, y: e.clientY, u: st.u, v: st.v, moved: false, px: e.clientX - r.left, py: e.clientY - r.top }; el.pic.setPointerCapture(e.pointerId); });
el.pic.addEventListener('pointermove', e => {
  const r = el.pic.getBoundingClientRect();
  if (!drag) { if (inst && inst.hover) { inst.hover(e.clientX - r.left, e.clientY - r.top, st); dirty = true; } return; }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
  if (drag.moved) setUV(drag.u + dx / (size.W * 0.8), drag.v - dy / (size.H * 0.8));
});
const endDrag = e => { if (!drag) return; if (!drag.moved && inst.tap) { inst.tap(drag.px, drag.py, st); dirty = true; } drag = null; };
el.pic.addEventListener('pointerup', endDrag); el.pic.addEventListener('pointercancel', () => { drag = null; });
el.pic.addEventListener('pointerleave', () => { if (inst && inst.hover) { inst.hover(-1, -1, st); dirty = true; } });
el.hu.addEventListener('input', () => setUV(el.hu.value / el.hu.max, st.v, 'hu'));
el.vv.addEventListener('input', () => setUV(st.u, el.vv.value / el.vv.max, 'vv'));

/* where it lives: the lab's Map in small, a cut through the ground. The loop is the ground line, every place digs a
   shaft of its levels, the places that hold a chip run on through the four shared depths, and your stack stands at the Lab */
const SHARED = ['block', 'gate', 'switch', 'atom'], RUNGS = [['atom', 'Atom'], ['switch', 'Switch'], ['gate', 'Gate'], ['block', 'Block'], ['chip', 'Chip'], ['machine', 'Machine'], ['mind', 'Mind']];
const STAGE_NAME = { open: 'Open', design: 'Design', make: 'Make', test: 'Test', ship: 'Ship', use: 'Use' };
function footSVG(q) {
  const CW = 31, C0 = 40, CS = 13, GP = 3, X0 = 5, gy = 86, top = gy + 18, colL = i => (i ? X0 + C0 + (i - 1) * CW : X0), colX = i => colL(i) + (CW - CS) / 2, FW = X0 * 2 + C0 + 8 * CW;
  let h = '', n = 0;
  const cell = (x, y, w, on, name, place, hh = CS) => { h += '<rect class="c' + (on ? ' on' : '') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="2"' + (on ? ' tabindex="0" role="button" aria-label="' + esc(name + ', ' + place) + '" data-n="' + esc(name) + '" data-p="' + esc(place) + '"' : '') + '/>'; if (on) n++; };
  /* your stack, standing at the Lab: seven rungs, the ones where this question rises lit */
  RUNGS.forEach(([id, name], i) => cell(X0 + 4, gy - 5 - (i + 1) * 11, C0 - 12, q.rises.includes(id), name, 'a rung of your stack, where it rises when what you built makes it real', 9));
  h += '<text x="' + (X0 + C0 - 2) + '" y="' + (gy - 66) + '">your stack</text>';
  h += '<line class="g" x1="0" y1="' + gy + '" x2="' + FW + '" y2="' + gy + '"/>';
  /* the loop's stages, written on the ground */
  const span = { open: [0, 0], design: [1, 1], make: [2, 3], test: [4, 4], ship: [5, 5], use: [6, 8] };
  for (const s of DATA.stages) { const [a, b] = span[s]; h += '<text class="st" text-anchor="middle" x="' + ((colL(a) + colL(b) + (b ? CW : C0)) / 2) + '" y="' + (gy + 11) + '">' + STAGE_NAME[s] + '</text>'; }
  q.foot.forEach((p, i) => {
    const x = colX(i + 1), own = p.levels.filter(l => !SHARED.includes(l.d) && l.d !== 'mind'), mind = p.levels.find(l => l.d === 'mind');
    if (mind) cell(x, gy - 5 - CS, CS, mind.on, mind.n, 'above the ' + p.name.toLowerCase());
    own.forEach((l, k) => cell(x, top + k * (CS + GP), CS, l.on, l.n, p.name));
    if (p.stage === 'use' && own.length < 4) h += '<line class="sh" x1="' + (x + CS / 2) + '" y1="' + (top + own.length * (CS + GP) - GP + 1) + '" x2="' + (x + CS / 2) + '" y2="' + (top + 4 * (CS + GP) - 1) + '"/>';
  });
  /* the four depths every chip shares, under the three places that hold one */
  const dc = q.foot.find(p => p.p === 'datacentre');
  dc.levels.filter(l => SHARED.includes(l.d)).forEach((l, k) => cell(colX(6), top + (4 + k) * (CS + GP), 2 * CW + CS, l.on, l.n, 'inside every chip'));
  const H = top + 9 * (CS + GP) + 2;
  return { svg: '<svg viewBox="0 0 ' + FW + ' ' + H + '" role="group" aria-label="Where this question lives in the lab">' + h + '</svg>', n };
}

function show(id, quick) {
  if (!Q[id]) id = IDS[0];
  if (id === cur) return;
  const q = Q[id], C = CARDS[id];
  const swap = () => {
    cur = id; inst = INST[id]; st = { u: inst.u0, v: inst.v0 == null ? 0.5 : inst.v0 }; if (inst.setup) inst.setup(st);
    readsKey = ''; capNow = '';
    $('#kick').innerHTML = '<span class="ring">' + icon(id) + '</span><span>' + esc(q.name) + '</span>';
    $('#q').textContent = q.q;
    el.hu.max = inst.hstep || 1000; el.vv.max = inst.vstep || 1000;
    $('#hname').textContent = C.h[1]; $('#hl').textContent = C.h[0]; $('#hr').textContent = C.h[2];
    el.pic.classList.toggle('two', inst.v0 != null); el.vw.hidden = inst.v0 == null;
    if (C.v) { $('#vname').textContent = C.v[1]; $('#vl').textContent = C.v[0]; $('#vr').textContent = C.v[2]; }
    $('#stand').textContent = C.stand;
    $('#why').innerHTML = ['In a chip', 'In the age of AI', 'Beyond chips'].map((h, i) => '<div><h3>' + h + '</h3><p>' + esc(C.why[i]) + '</p></div>').join('');
    setUV(st.u, st.v);
    $('#true').innerHTML = '<b>True</b>' + esc(C.true) + '<span class="src">' + C.src.map(s => (s.u ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a>' : esc(s.t)) + (s.k ? '<span class="kind" title="how sure: the kind of source">' + esc(s.k) + '</span>' : '')).join(' · ') + '</span>';
    $('#open').innerHTML = '<b>Still open</b><i>' + esc(C.open) + '</i>';
    const F = footSVG(q); $('#foot').innerHTML = F.svg;
    const lv = new Set(q.foot.flatMap(p => p.levels.filter(l => l.on).map(l => l.d))).size;
    const base = 'Lit: where this question lives. ' + lv + ' levels across the lab' + (q.rises.length ? ', and ' + q.rises.length + (q.rises.length > 1 ? ' rungs' : ' rung') + ' of your stack' : '') + '.';
    $('#where').textContent = base; $('#where').dataset.base = base;
    $('#mks').innerHTML = q.meets.map((m, i) => '<button type="button" class="mk" data-m="' + m.id + '" aria-pressed="' + (i === 0) + '" aria-label="It meets: ' + esc(Q[m.id].name) + '" title="' + esc(Q[m.id].name) + '">' + icon(m.id) + '</button>').join('');
    meet(q.meets[0].id);
    $('#asks').innerHTML = q.field.slice(0, 3).map(f => '<li>' + esc(f.q) + '<small>' + esc(f.who || '') + '</small></li>').join('') || '<li>' + esc(C.ask || '') + '</li>';
    const pl = (n, w) => '<span><b>' + n + '</b> ' + w + (n === 1 ? '' : 's') + '</span>';
    $('#counts').innerHTML = pl(q.n.ch, 'challenge') + pl(q.n.exp, 'experiment') + '<span><b>' + q.n.field + '</b> question' + (q.n.field === 1 ? '' : 's') + ' from the field</span>';
    $('#note').innerHTML = '<b>For the build.</b> ' + C.eng + ' Its address in the lab would be <code>#/q/' + id + '</code>.';
    document.querySelectorAll('.tick').forEach(b => b.setAttribute('aria-current', b.dataset.q === id));
    document.title = q.name + ' · core question cards';
    try { if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id); } catch (e) { /* the frame may refuse it */ }
    resize(); el.pic.classList.remove('swap');
  };
  if (quick || reduced || !cur) swap(); else { el.pic.classList.add('swap'); setTimeout(swap, 200); }
}
function meet(mid) {
  const m = Q[cur].meets.find(x => x.id === mid); if (!m) return;
  document.querySelectorAll('.mk').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === mid));
  $('#join').innerHTML = '<b>' + esc(Q[mid].name) + '</b><br>What joins them: ' + esc(m.join) + '.<i>' + esc(m.q) + '</i><button type="button" class="go" data-go="' + mid + '">Turn to that question →</button>';
}
document.addEventListener('click', e => {
  const mk = e.target.closest('.mk'); if (mk) return meet(mk.dataset.m);
  const go = e.target.closest('[data-go]'); if (go) { show(go.dataset.go); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
  const tk = e.target.closest('.tick'); if (tk) return show(tk.dataset.q);
  const c = e.target.closest('.foot .c.on'); if (c) pick(c, true);
});
function pick(c, keep) {
  const w = $('#where');
  if (!c) { if (!w.dataset.kept) w.textContent = w.dataset.base; return; }
  w.innerHTML = '<b>' + esc(c.dataset.n) + '</b>, ' + esc(c.dataset.p) + '.' + (keep ? ' In the lab a tap lands there with this lens on.' : '');
  if (keep) { document.querySelectorAll('.foot .sel').forEach(x => x.classList.remove('sel')); c.classList.add('sel'); w.dataset.kept = '1'; }
}
$('#foot').addEventListener('pointerover', e => { const c = e.target.closest('.c.on'); if (c) { delete $('#where').dataset.kept; pick(c); } });
$('#foot').addEventListener('focusin', e => { const c = e.target.closest('.c.on'); if (c) pick(c); });
$('#foot').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.c.on')) { e.preventDefault(); pick(e.target, true); } });
document.addEventListener('keydown', e => {
  if (e.target.closest('input, button, [tabindex]')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') show(IDS[(IDS.indexOf(cur) + (e.key === 'ArrowRight' ? 1 : IDS.length - 1)) % IDS.length]);
});
$('#ticks').innerHTML = IDS.map((id, i) => '<button type="button" class="tick" data-q="' + id + '" title="' + (i + 1) + '. ' + esc(Q[id].name) + '" aria-label="' + esc(Q[id].name) + '">' + icon(id) + '</button>').join('');
$('#theme').addEventListener('click', () => {
  const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  r.dataset.theme = dark ? 'light' : 'dark'; palette();
});
new MutationObserver(palette).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', palette);
new ResizeObserver(resize).observe(el.pic);
addEventListener('hashchange', () => show(location.hash.slice(1)));
palette(); show(location.hash.slice(1) || 'perfect', true); requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; });
window.__cards = { show, set: (u, v) => setUV(u, v == null ? st.v : v), state: () => ({ cur, u: st.u, v: st.v }) };
