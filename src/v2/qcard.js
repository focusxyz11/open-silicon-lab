/* A card for each core question (#517; its design: docs/prototypes/cards/README.md): the whole question, one still
   picture you can move, why it matters, and where it lives in the lab. The lens pulled back out of every level: pull
   back from a lens (the question at the foot of its card) and you hold the card; tap a lit level on the card and you
   land on that level with the lens on. #/q/<id>, loaded when a card first opens (the first page never loads it).

   One card at a time: no row, list or menu of the thirteen anywhere; the only way from one card to another is It meets.
   Nothing on a card moves by itself: the picture is complete when it opens and changes only under the hand (a drag
   across it, or its sliders, keyboard too).

   Three bands: see it (the question, why it matters in one sentence, the picture, its caption, its controls and
   measures), place it (where it lives: the Map's cut in small, read from src/data/frame.js MARKS and RISES and
   src/data/places.js, never typed; it meets; it also asks) and read it (why it matters in three parts, True with its
   facts, Still open). Data: src/data/cards.js; words: src/i18n/en/cards.json (qc.*); pictures: src/v2/qcpics1.js to 3.
   Built by Claude Opus 5.5 in the nightly build of 28 November 2026, from the prototype by Claude Fable 5.2.

   createQCard(stage, { levelHref, still }) → { show(id), hide() }; cardHtml(id) is the card's words and structure
   alone (no picture drawn), for the tests. */
import { t, has, fmtNum } from '../core/i18n.js';
import { esc } from '../core/esc.js';
import { facts } from '../core/facts.js';
import { QUESTIONS, FILED, MARKS, MEETS, RISES } from '../data/frame.js';
import { INSIDE, ABOVE } from '../data/places.js';
import { stageOfPlace, STAGES } from '../engines/way.js';
import { CARDS, WHY, SHARED_DEPTHS, CUT } from '../data/cards.js';
import { clamp } from './qckit.js';

export const IDS = QUESTIONS.map(q => q.id);
const Q = id => QUESTIONS.find(q => q.id === id);
const icon = id => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + esc(Q(id).icon) + '"/></svg>';
const w = (id, k, v) => t('qc.' + id + '.' + k, v);
const RUNGS = ['atom', 'switch', 'gate', 'block', 'chip', 'machine', 'mind'];
const rungName = r => (r === 'machine' ? t('qc.ui.machine') : t('depth.' + r + '.name'));

/* ---- what a card shows of the lab, read from its data ---- */
/* the Map's cut: each place in the loop's order with its levels, lit where the question has its mark */
export function footOf(id) {
  return CUT.map(p => ({ p, stage: stageOfPlace(p), levels: (ABOVE[p] || []).concat(INSIDE[p] || []).map(l => ({ l, d: l.depth, on: !!(MARKS[l.depth] && MARKS[l.depth][id]) })) }));
}
export const risesOf = id => [...new Set(RISES.filter(r => r.q === id).map(r => r.rung))];
export const meetsOf = id => MEETS.filter(m => m.a === id || m.b === id).map(m => ({ id: m.a === id ? m.b : m.a, key: m.a + '.' + m.b }));
export const fieldOf = id => Object.entries(FILED.field).filter(([, v]) => v[0] === id).map(([k]) => k);
const count = (o, id) => Object.values(o || {}).filter(v => v.includes(id)).length;

/* where it lives, drawn: your stack standing at the Lab (seven rungs, lit where the question rises), the loop's
   stages written on the ground, each place a shaft of its levels, and the four depths every chip shares under the
   three places that hold one. A lit cell is a way there: data-go its address, data-name what it is */
function footSvg(id, levelHref) {
  const foot = footOf(id), rises = risesOf(id);
  const CW = 31, C0 = 40, CS = 13, GP = 3, X0 = 5, gy = 86, top = gy + 18, colL = i => (i ? X0 + C0 + (i - 1) * CW : X0), colX = i => colL(i) + (CW - CS) / 2, FW = X0 * 2 + C0 + 8 * CW;
  let h = '', n = 0;
  const cell = (x, y, wd, on, name, place, href, hh = CS) => {
    h += '<rect class="c' + (on ? ' on' : '') + '" x="' + x + '" y="' + y + '" width="' + wd + '" height="' + hh + '" rx="2"' +
      (on ? ' tabindex="0" role="link" aria-label="' + esc(t('qc.ui.cell', { level: name, place })) + '" data-name="' + esc(name) + '" data-place="' + esc(place) + '" data-go="' + esc(href) + '"' : '') + '/>';
    if (on) n++; };
  RUNGS.forEach((r, i) => cell(X0 + 4, gy - 5 - (i + 1) * 11, C0 - 12, rises.includes(r), rungName(r), t('qc.ui.rungAt'), '#/stack/' + r, 9));
  h += '<text x="' + (X0 + C0 - 2) + '" y="' + (gy - 85) + '" text-anchor="end">' + esc(t('qc.ui.stack')) + '</text>';
  h += '<line class="g" x1="0" y1="' + gy + '" x2="' + FW + '" y2="' + gy + '"/>';
  /* the loop's stages, written on the ground under the places that stand at them */
  const span = { open: [0, 0], design: [1, 1], make: [2, 3], test: [4, 4], ship: [5, 5], use: [6, 8] };
  for (const s of STAGES) { const [a, b] = span[s]; h += '<text class="st" text-anchor="middle" x="' + ((colL(a) + colL(b) + (b ? CW : C0)) / 2) + '" y="' + (gy + 11) + '">' + esc(t('loop.stage.' + s)) + '</text>'; }
  foot.forEach((p, i) => {
    const x = colX(i + 1), own = p.levels.filter(l => !SHARED_DEPTHS.includes(l.d) && l.d !== 'mind'), mind = p.levels.find(l => l.d === 'mind'), pname = t('map.' + p.p + '.t');
    if (mind) cell(x, gy - 5 - CS, CS, mind.on, t('depth.mind.name'), t('qc.ui.above', { place: pname }), levelHref(p.p, mind.l));
    own.forEach((l, k) => cell(x, top + k * (CS + GP), CS, l.on, t('depth.' + l.d + '.name'), pname, levelHref(p.p, l.l)));
    if (p.stage === 'use' && own.length < 4) h += '<line class="sh" x1="' + (x + CS / 2) + '" y1="' + (top + own.length * (CS + GP) - GP + 1) + '" x2="' + (x + CS / 2) + '" y2="' + (top + 4 * (CS + GP) - 1) + '"/>';
  });
  const dc = foot.find(p => p.p === 'datacentre');
  dc.levels.filter(l => SHARED_DEPTHS.includes(l.d)).forEach((l, k) => cell(colX(6), top + (4 + k) * (CS + GP), 2 * CW + CS, l.on, t('depth.' + l.d + '.name'), t('qc.ui.inside'), levelHref('datacentre', l.l)));
  const H = top + 9 * (CS + GP) + 2;
  return { svg: '<svg viewBox="0 0 ' + FW + ' ' + H + '" role="group" aria-label="' + esc(t('qc.ui.whereAria')) + '">' + h + '</svg>', n,
    levels: new Set(foot.flatMap(p => p.levels.filter(l => l.on).map(l => l.d))).size, rungs: rises.length };
}

/* the card's words and structure (the picture is drawn into .qc-pic once it is in the page) */
export function cardHtml(id, { levelHref = () => '#/' } = {}) {
  const C = CARDS[id], F = footSvg(id, levelHref), M = meetsOf(id), field = fieldOf(id);
  const ends = (k, i) => '<div class="qc-ends"><span>' + esc(w(id, k + '0')) + '</span><span>' + esc(w(id, k + '1')) + '</span></div>';
  const slider = (k, ar, name) => '<div class="qc-hs"><label for="qc-' + k + '"><span class="qc-ar" aria-hidden="true">' + ar + '</span><span>' + esc(name) + '</span></label><input type="range" id="qc-' + k + '" data-qc="' + k + '" min="0" max="1000" value="500">' + ends(k) + '</div>';
  const lit = t('qc.ui.lit', { n: F.levels }) + (F.rungs ? ' ' + t('qc.ui.litRungs', { n: F.rungs }) : '');
  const cnt = (n, k) => '<span><b>' + fmtNum(n) + '</b> ' + esc(t('qc.ui.' + k, { n })) + '</span>';
  const asks = field.slice(0, 3).map(k => '<li>' + esc(t('field.' + k + '.q')) + (has('field.' + k + '.who') ? '<small>' + esc(t('field.' + k + '.who')) + '</small>' : '') + '</li>').join('') || (C.ask ? '<li>' + esc(t('field.' + C.ask + '.q')) + '</li>' : '');
  return '<article class="qc-card" data-q="' + esc(id) + '">' +
    '<div class="qc-alone"><header class="qc-head"><p class="qc-kick"><span class="qc-ring">' + icon(id) + '</span><span>' + esc(t('frame.q.' + id)) + '</span></p>' +
    '<h1 class="qc-q">' + esc(t(Q(id).word)) + '</h1><p class="qc-stand">' + esc(w(id, 'stand')) + '</p></header>' +
    '<figure class="qc-fig"><div class="qc-pic' + (C.two ? ' two' : '') + '" data-qcpic><canvas role="img" aria-label="' + esc(t('qc.ui.picAria')) + '"></canvas><div class="qc-labels" aria-hidden="true"></div></div>' +
    '<figcaption class="qc-cap" data-qccap>' + esc(w(id, 'cap')) + '</figcaption></figure>' +
    '<div class="qc-band"><div class="qc-ctl"><p class="qc-hint">' + esc(t('qc.ui.drag')) + '</p>' + slider('h', '↔', w(id, 'h')) + (C.two ? slider('v', '↕', w(id, 'v')) : '') + '</div>' +
    '<div class="qc-reads" data-qcreads aria-live="polite"></div></div></div>' +
    '<aside class="qc-inlab" aria-label="' + esc(t('qc.ui.inlab')) + '">' +
    '<section class="qc-foot"><h2>' + esc(t('qc.ui.where')) + '</h2>' + F.svg + '<p class="qc-where" data-qcwhere data-base="' + esc(lit) + '">' + esc(lit) + '</p></section>' +
    (M.length ? '<section><h2>' + esc(t('qc.ui.meets')) + '</h2><div class="qc-mks">' + M.map((m, i) => '<button type="button" class="qc-mk" data-meet="' + esc(m.id) + '" aria-pressed="' + (i === 0) + '" aria-label="' + esc(t('qc.ui.meetAria', { q: t('frame.q.' + m.id) })) + '" title="' + esc(t('frame.q.' + m.id)) + '">' + icon(m.id) + '</button>').join('') + '</div><div class="qc-join" data-qcjoin>' + joinHtml(id, M[0]) + '</div></section>' : '') +
    (asks ? '<section><h2>' + esc(t('qc.ui.asks')) + '</h2><ul class="qc-asks">' + asks + '</ul><p class="qc-counts">' + cnt(count(FILED.challenges, id), 'ch') + cnt(count(FILED.experiments, id), 'exp') + cnt(field.length, 'field') + '</p></section>' : '') +
    '</aside>' +
    '<div class="qc-text"><section class="qc-why"><h2>' + esc(t('qc.ui.why')) + '</h2><div class="qc-cols">' + WHY.map(k => '<div><h3>' + esc(t('qc.ui.why.' + k)) + '</h3><p>' + esc(w(id, 'why.' + k)) + '</p></div>').join('') + '</div></section>' +
    '<div class="qc-say"><p class="qc-true"><b>' + esc(t('qc.ui.true')) + '</b>' + esc(w(id, 'true')) + '<span class="qc-src" data-qcsrc>' + srcHtml(id, null) + '</span></p>' +
    '<p class="qc-open"><b>' + esc(t('qc.ui.open')) + '</b><i>' + esc(C.open ? t(C.open) : w(id, 'open')) + '</i></p></div></div></article>';
}
/* what joins two questions, the pair's own question, and the way to the other card */
function joinHtml(id, m) {
  return '<p><b>' + esc(t('frame.q.' + m.id)) + '</b><br>' + esc(t('qc.ui.joins', { join: t('frame.meet.' + m.key) })) + '</p>' +
    (has('frame.meet.' + m.key + '.q') ? '<p class="qc-pairq">' + esc(t('frame.meet.' + m.key + '.q')) + '</p>' : '') +
    '<a class="qc-go" href="#/q/' + esc(m.id) + '">' + esc(t('qc.ui.turn')) + '</a>';
}
/* the True line's sources: its facts with their kind (src/data/facts.json, once loaded), or the lab's own model */
function srcHtml(id, FACT) {
  const C = CARDS[id];
  if (C.src) return esc(w(id, 'src')) + '<span class="qc-kind">' + esc(t('qc.ui.model')) + '</span>';
  if (!FACT) return '';
  return C.facts.map(k => FACT[k]).filter(Boolean).map(f => '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.source) + '</a><span class="qc-kind" title="' + esc(t('qc.ui.kind')) + '">' + esc(t('fact.' + f.kind)) + '</span>').join(' · ');
}

/* ---- the view ---- */
const PIC_MODULES = { 1: () => import('./qcpics1.js'), 2: () => import('./qcpics2.js'), 3: () => import('./qcpics3.js') };

export function createQCard(stage, { levelHref = () => '#/', still = () => false } = {}) {
  const el = document.createElement('section'); el.className = 'home qcv'; el.id = 'qcard'; el.hidden = true; el.setAttribute('aria-label', t('qc.ui.aria'));
  stage.insertBefore(el, document.getElementById('page'));
  let cur = null, pic = null, st = null, P = {}, size = { W: 0, H: 0 }, dirty = false, raf = 0, drag = null, cv = null, ctx = null, box = null, n = 0, frames = 0;
  const $ = s => el.querySelector(s);
  const watch = new MutationObserver(() => palette()), dark = matchMedia('(prefers-color-scheme: dark)');
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;

  function palette() {
    const s = getComputedStyle(document.documentElement), g = k => s.getPropertyValue(k).trim();
    const was = JSON.stringify(P);
    P = { bg: g('--bg'), solid: g('--panel-solid'), line: g('--line'), ink: g('--ink'), muted: g('--muted'), blue: g('--accent'), warm: g('--warm'), red: g('--bad'), green: g('--good') };
    if (JSON.stringify(P) !== was) redraw();
  }
  function resize() {
    if (!box || el.hidden) return;
    const r = box.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), W = Math.round(r.width), H = Math.round(r.height);
    if (W === size.W && H === size.H && cv.width === Math.round(W * d)) return;   /* the same size: nothing to draw again */
    size = { W, H };
    cv.width = Math.round(size.W * d); cv.height = Math.round(size.H * d); ctx.setTransform(d, 0, 0, d, 0, 0); redraw();
  }
  const redraw = () => { dirty = true; if (!raf && !el.hidden) raf = requestAnimationFrame(frame); };
  /* words over the picture are HTML, never drawn into it */
  function frame() {
    raf = 0; if (!pic || !dirty || !ctx || el.hidden) return; dirty = false; frames++;
    const want = [];
    const g = { c: ctx, W: size.W, H: size.H, box: { x: 14, y: 30, w: size.W - 28, h: size.H - 44 }, u: st.u, v: st.v, P,
      again: redraw, lab: (x, y, text, c = '', a = '') => want.push({ x: Math.round(x), y: Math.round(y), text, c, a }) };
    ctx.clearRect(0, 0, size.W, size.H);
    const out = pic.frame(g, st) || {};
    $('.qc-labels').innerHTML = want.map(l => '<span class="qc-lbl ' + esc(l.c) + '" style="transform:translate(' + l.x + 'px,' + l.y + 'px)' + (l.a === 'r' ? ' translateX(-100%)' : l.a === 'c' ? ' translateX(-50%)' : '') + '">' + esc(l.text) + '</span>').join('');
    $('[data-qcreads]').innerHTML = (out.reads || []).map(r => '<div class="qc-read"><b class="' + esc(r.tone || '') + '">' + esc(r.v) + '</b><span>' + esc(r.k) + '</span></div>').join('');
    const cap = out.cap || w(cur, 'cap'), ce = $('[data-qccap]'); if (ce.textContent !== cap) ce.textContent = cap;
  }
  /* the two controls: a drag across the picture, or the sliders */
  function setUV(u, v, from) {
    if (!pic) return;
    st.u = clamp(u); if (pic.v0 != null) st.v = clamp(v);
    const hu = $('[data-qc="h"]'), vv = $('[data-qc="v"]');
    if (hu && from !== 'h') hu.value = Math.round(st.u * +hu.max);
    if (vv && from !== 'v') vv.value = Math.round(st.v * +vv.max);
    redraw();
  }

  function draw(id) {
    cur = id; pic = null; drag = null;
    el.innerHTML = '<div class="qc-wrap">' + cardHtml(id, { levelHref }) + '</div>';
    el.scrollTop = 0;
    box = $('[data-qcpic]'); cv = box.querySelector('canvas'); ctx = cv.getContext('2d'); size = { W: 0, H: 0 };
    if (ro) { ro.disconnect(); ro.observe(box); }
    const m = n;
    facts().then(F => { if (m === n) { const s = $('[data-qcsrc]'); if (s) s.innerHTML = srcHtml(id, F); } });
    PIC_MODULES[CARDS[id].pic]().then(mod => { if (m !== n) return;
      pic = mod.PICS[id]; st = { u: pic.u0, v: pic.v0 == null ? 0.5 : pic.v0 }; if (pic.setup) pic.setup(st);
      const hu = $('[data-qc="h"]'), vv = $('[data-qc="v"]'); hu.max = pic.hstep || 1000; if (vv) vv.max = pic.vstep || 1000;
      setUV(st.u, st.v); palette(); resize(); redraw(); });
  }

  /* ---- the hand ---- */
  el.addEventListener('pointerdown', e => { const b = e.target.closest('[data-qcpic]'); if (!b || !pic) return; const r = b.getBoundingClientRect(); drag = { x: e.clientX, y: e.clientY, u: st.u, v: st.v, moved: false, px: e.clientX - r.left, py: e.clientY - r.top }; try { b.setPointerCapture(e.pointerId); } catch (x) { /* a synthetic pointer */ } });
  el.addEventListener('pointermove', e => {
    const b = e.target.closest('[data-qcpic]');
    if (!drag) { if (b && pic && pic.hover) { const r = b.getBoundingClientRect(); pic.hover(e.clientX - r.left, e.clientY - r.top, st); redraw(); } return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
    if (drag.moved) setUV(drag.u + dx / (size.W * 0.8), drag.v - dy / (size.H * 0.8));
  });
  el.addEventListener('pointerup', () => { if (!drag) return; if (!drag.moved && pic && pic.tap) { pic.tap(drag.px, drag.py, st); redraw(); } drag = null; });
  el.addEventListener('pointercancel', () => { drag = null; });
  el.addEventListener('pointerout', e => { if (pic && pic.hover && e.target.closest('[data-qcpic]') && !e.relatedTarget?.closest?.('[data-qcpic]')) { pic.hover(-1, -1, st); redraw(); } });
  el.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.qc; if (!k || !pic) return; if (k === 'h') setUV(e.target.value / e.target.max, st.v, 'h'); else setUV(st.u, e.target.value / e.target.max, 'v'); });
  /* it meets: one opened at a time */
  el.addEventListener('click', e => {
    const mk = e.target.closest('[data-meet]');
    if (mk) { el.querySelectorAll('[data-meet]').forEach(b => b.setAttribute('aria-pressed', String(b === mk))); const m = meetsOf(cur).find(x => x.id === mk.dataset.meet); if (m) $('[data-qcjoin]').innerHTML = joinHtml(cur, m); return; }
    const c = e.target.closest('[data-go]'); if (c) goLens(c.dataset.go, cur);
  });
  el.addEventListener('keydown', e => { const c = e.target.closest && e.target.closest('[data-go]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); goLens(c.dataset.go, cur); } });
  /* where it lives: what a lit cell is, said under the cut while the hand or the focus is on it */
  const say = c => { const p = $('[data-qcwhere]'); if (!p) return; p.innerHTML = c ? '<b>' + esc(c.dataset.name) + '</b>, ' + esc(c.dataset.place) + '. ' + esc(t('qc.ui.go')) : esc(p.dataset.base); };
  el.addEventListener('pointerover', e => { if (e.target.closest('.qc-foot')) say(e.target.closest('[data-go]')); });
  el.addEventListener('focusin', e => { const c = e.target.closest('[data-go]'); if (c) say(c); });
  el.addEventListener('focusout', e => { if (e.target.closest('[data-go]')) say(null); });

  /* a lit level tapped: that level opens, and the lens is put on there (its mark, or the lens under Ask) once the
     level's frame is drawn; given up if the address changes first or nothing offers it in time */
  function goLens(href, q) {
    location.hash = href;
    const t0 = performance.now(); let asked = false, tries = 0, lastTry = 0;
    const open = x => !x.parentElement || !x.parentElement.closest('[hidden]');
    const poll = () => {
      if (location.hash !== href || performance.now() - t0 > 20000) return;
      const on = [...document.querySelectorAll('.qlcard .qlq a[href="#/q/' + q + '"]')].some(open);
      if (on) return;
      const m = [...document.querySelectorAll('[data-lens="' + q + '"]')].find(open);
      if (m && performance.now() - lastTry > 1500 && tries < 4) { tries++; lastTry = performance.now(); m.click(); }
      else if (!m && !asked) { const a = [...document.querySelectorAll('[data-mode="ask"]')].find(x => open(x) && x.getClientRects().length); if (a) { asked = true; a.click(); } }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }

    const api = {
    show(id) {
      if (!CARDS[id]) { location.replace('#/'); return; }
      el.hidden = false; n++;
      watch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); dark.addEventListener('change', palette);
      if (id !== cur || !el.firstChild) draw(id); else { if (ro) ro.observe(box); palette(); resize(); }
      el.classList.toggle('still', still());
    },
    hide() { if (el.hidden) return; el.hidden = true; n++; watch.disconnect(); dark.removeEventListener('change', palette); if (ro) ro.disconnect(); if (raf) cancelAnimationFrame(raf); raf = 0; },
    /* for checks: the card open, and its controls (0..1) */
    state: () => ({ q: el.hidden ? null : cur, u: st ? st.u : null, v: st ? st.v : null, drawn: !!pic, frames }),
    set: (u, v) => setUV(u, v == null ? st.v : v)
  };
  window.__qcard = api;
  return api;
}
