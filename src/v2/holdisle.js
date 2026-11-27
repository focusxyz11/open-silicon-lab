/* The last block of the first page's chip (src/v2/hold.js): the lab as one ladder, your stack (docs/PATH.md). Seven
   rungs from the atom up to the mind, each made of the one below, drawn in the page's own language (squares, straight
   lines, one red), the same ladder the page has just gone down: one transistor held into billions, a gate switched, a
   machine kept. A rung the page met says where; one the visitor tried here is red. Every rung is a way in to it in the
   stack (#/stack/<rung>), the lab's blue button the way into the whole (#/stack); the island and the Map are quieter
   ways on. The rungs are read from src/data/path.js, the stack's own list, here and never in the first page's closure:
   this is the page's last picture, so it is fetched once the page has drawn, not with it. */
import { w, h, S, K, fg, onChange, lab } from './holdkit.js';
import { at, put, out, glyph } from './holdplates.js';
import { RUNGS } from '../data/path.js';

/* where on this page each rung was met, and what the visitor did there that makes it theirs (the atom and the mind are
   not on this page: they are new) */
const TRIED = { switch: () => !!S.tried.switch, gate: () => !!S.done.gate, block: () => !!S.done.arr, chip: () => !!(S.done.job || S.done.bug), machine: () => !!S.kept };
const met = r => r in TRIED, mine = r => met(r) && TRIED[r]();
/* the ladder in plate units: the mind at the top, the atom at the bottom; a rung's slab, its drawing at the left */
const N = RUNGS.length, X0 = 60, X1 = 940, GX = 128;
/* a desktop's ladder fills the plate; a phone's is shorter, its rungs one line each, so the way in and the quieter ways
   on stay above the picture's foot */
const GEO = { d: { y0: 30, p: 112, h: 86, go: 86, more: 94 }, p: { y0: 18, p: 100, h: 80, go: 77, more: 87 } };
let G = GEO.d, H = G.h;
const top = r => G.y0 + (N - 1 - RUNGS.indexOf(r)) * G.p;
let hov = null;

/* each rung's drawing, in a box about 70 units across centred on (x, y) */
const DRAW = {
  atom(c, x, y, T, lit) { c.strokeStyle = fg(.5); c.lineWidth = 2; c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(x - 30, y + i * 22); c.lineTo(x + 30, y + i * 22); c.moveTo(x + i * 22, y - 30); c.lineTo(x + i * 22, y + 30); } c.stroke();
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { c.fillStyle = K.plate; c.strokeStyle = K.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(x + i * 22, y + j * 22, 6.5, 0, 7); c.fill(); c.stroke(); }
    const f = (T * .35) % 1, e = [x - 22 + 44 * f, y + 11]; c.fillStyle = lit ? K.red : K.ink; c.fillRect(e[0] - 4, e[1] - 4, 8, 8); },
  switch(c, x, y, T, lit) { glyph(c, x, y + 4, 21, lit && Math.floor(T / 1.6) % 2 ? 1 : 0, 1, 3, 'planar'); c.globalAlpha = 1; },
  gate(c, x, y, T, lit) { const o = lit ? K.red : K.ink; c.strokeStyle = K.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 36, y - 12); c.lineTo(x - 16, y - 12); c.moveTo(x - 36, y + 12); c.lineTo(x - 16, y + 12); c.stroke();
    c.fillStyle = K.plate; c.beginPath(); c.moveTo(x - 16, y - 24); c.lineTo(x + 4, y - 24); c.arc(x + 4, y, 24, -Math.PI / 2, Math.PI / 2); c.lineTo(x - 16, y + 24); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = o; c.beginPath(); c.arc(x + 33, y, 5, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x + 38, y); c.lineTo(x + 44, y); c.stroke(); },
  block(c, x, y, T, lit) { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.strokeRect(x - 36, y - 26, 72, 52); c.beginPath(); c.moveTo(x + 2, y - 26); c.lineTo(x + 2, y + 26); c.stroke();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { c.fillStyle = fg(.55); c.fillRect(x - 30 + i * 11, y - 19 + j * 11, 6, 6); }
    c.fillStyle = lit ? K.red : fg(.5); for (let j = 0; j < 3; j++) c.fillRect(x + 10, y - 16 + j * 13, 18 - (j % 2) * 6, 6); },
  chip(c, x, y, T, lit) { c.strokeStyle = K.ink; c.lineWidth = 2; c.beginPath(); for (let i = -2; i <= 2; i++) { const q = i * 11; c.moveTo(x + q, y - 36); c.lineTo(x + q, y - 28); c.moveTo(x + q, y + 28); c.lineTo(x + q, y + 36); c.moveTo(x - 36, y + q); c.lineTo(x - 28, y + q); c.moveTo(x + 28, y + q); c.lineTo(x + 36, y + q); } c.stroke();
    c.fillStyle = K.plate; c.fillRect(x - 28, y - 28, 56, 56); c.lineWidth = 3; c.strokeRect(x - 28, y - 28, 56, 56);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const on = lit && (Math.floor(T * 1.2) % 4) === i * 2 + j; c.fillStyle = on ? K.red : fg(.32); c.fillRect(x - 19 + i * 20, y - 19 + j * 20, 17, 17); } },
  machine(c, x, y, T, lit) { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 26, y - 14); c.lineTo(x + 26, y - 14); c.moveTo(x, y - 14); c.lineTo(x, y + 14); c.stroke();
    for (const [px, py] of [[x - 26, y - 14], [x + 26, y - 14]]) { c.fillStyle = K.plate; c.fillRect(px - 13, py - 13, 26, 26); c.strokeRect(px - 13, py - 13, 26, 26); }
    c.fillStyle = K.plate; c.fillRect(x - 24, y + 14, 48, 18); c.strokeRect(x - 24, y + 14, 48, 18); c.fillStyle = fg(.5); for (let i = 0; i < 5; i++) c.fillRect(x - 19 + i * 9, y + 20, 5, 6);
    if (lit) { const f = (T * .6) % 1, px = x - 26 + 52 * f; c.fillStyle = K.red; c.fillRect(px - 4, y - 18, 8, 8); } },
  mind(c, x, y, T, lit) { const L = [[-30, [-16, 16]], [0, [-24, 0, 24]], [30, [0]]], P2 = L.map(([dx, ys]) => ys.map(dy => [x + dx, y + dy]));
    c.strokeStyle = fg(.45); c.lineWidth = 1.8; c.beginPath(); for (let k = 0; k < 2; k++) for (const a of P2[k]) for (const b of P2[k + 1]) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    const hot = Math.floor(T * 1.5) % 6; P2.flat().forEach((p, i) => { const on = lit && i === hot; c.fillStyle = on ? K.red : K.plate; c.strokeStyle = on ? K.red : K.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(p[0], p[1], 7.5, 0, 7); c.fill(); c.stroke(); }); }
};

export const ISLAND = {
  frame: () => [w('pl.island'), w('isle.lit', { n: RUNGS.filter(mine).length, of: N })],
  paint(c, T) {
    /* the carry: each rung hands up to the one above, a mark climbing the gaps one rung at a time */
    const up = Math.floor(T * 1.4) % (N - 1);
    for (let i = 0; i < N - 1; i++) { const y = top(RUNGS[i]) - (G.p - H) / 2, on = i === up; c.strokeStyle = on ? K.red : fg(.4); c.lineWidth = on ? 3.5 : 2.5;
      c.beginPath(); c.moveTo(GX, y + 9); c.lineTo(GX, y - 9); c.moveTo(GX - 7, y - 2); c.lineTo(GX, y - 9); c.lineTo(GX + 7, y - 2); c.stroke(); }
    RUNGS.forEach(r => { const y = top(r), m = met(r), lit = mine(r), hv = hov === r;
      c.fillStyle = K.plate; c.fillRect(X0, y, X1 - X0, H);
      c.strokeStyle = hv ? K.go : m ? K.ink : fg(.38); c.lineWidth = hv ? 4.5 : m ? 3.5 : 2.5; c.setLineDash(m || hv ? [] : [10, 8]); c.strokeRect(X0, y, X1 - X0, H); c.setLineDash([]);
      if (lit) { c.fillStyle = K.red; c.fillRect(X0, y, 12, H); }
      c.save(); c.translate(GX, y + H / 2); c.scale(.92, .92); c.translate(-GX, -(y + H / 2)); DRAW[r](c, GX, y + H / 2, T, lit); c.restore(); c.globalAlpha = 1; }); },
  ui(host, pl) {
    const rows = RUNGS.map(r => { const a = h('a', 'sk-r' + (met(r) ? ' met' : '')); a.href = '#/stack/' + r; a.dataset.rung = r;
      a.innerHTML = '<span class="nm"><b>' + w('sk.' + r + '.t') + '</b><span class="tg mono"></span><small>' + w('sk.' + r + '.d') + '</small></span><i class="ar" aria-hidden="true">→</i>';
      a.onpointerenter = () => { hov = r; }; a.onpointerleave = () => { if (hov === r) hov = null; }; a.onfocus = a.onpointerenter; a.onblur = a.onpointerleave; host.appendChild(a); return a; });
    /* the way in, as the lab draws it everywhere; and quieter, the island and the Map */
    const go = h('a', 'goin'); go.href = '#/stack'; go.dataset.go = 'stack'; go.innerHTML = '<span class="wia" aria-hidden="true">↑</span><b>' + w('isle.go') + '</b>'; host.appendChild(go);
    const more = h('div', 'sk-more mono', '<a href="#/island">' + w('isle.walk') + '</a><a href="#/log">' + w('isle.map') + '</a>'); at(more, 50, 96); host.appendChild(more); let geo = '';
    const lay = () => { const k = innerWidth <= 760 ? 'p' : 'd'; if (k === geo) return; geo = k; G = GEO[k]; H = G.h; rows.forEach(a => at(a, X0 / 10, top(a.dataset.rung) / 10, (X1 - X0) / 10, H / 10)); at(go, 50, G.go); at(more, 50, G.more); };
    pl.sync = () => { lay(); rows.forEach(a => { const r = a.dataset.rung, lit = mine(r); a.classList.toggle('lit', lit); put(a.querySelector('.tg'), met(r) ? '<i></i>' + w('sk.' + r + '.m') : ''); }); };
    onChange(() => out('island')); },
  /* what the card says: how many rungs are already the visitor's, and the question to take inside */
  out: () => w('sk.out', { n: RUNGS.filter(mine).length, of: N })
};

/* the foot of the page: the less important things, one line (the sources, the lab's home, how to join, the licence).
   It returns the page's last step, the way in: plain navigation to your stack */
const REPO = 'https://github.com/focusxyz11/open-silicon-lab';
export function landing(end, sources) {
  if (end) { const f = h('footer', '', '<button type="button" class="bbtn mono">' + w('sources') + '</button><a href="' + REPO + '" target="_blank" rel="noopener">GitHub ↗</a><a href="' + REPO + '/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">' + w('foot.join') + ' ↗</a><a href="' + REPO + '/blob/main/LICENSE" target="_blank" rel="noopener">' + w('foot.mit') + '</a>');   // i18n-ok: GitHub is a name
    f.firstChild.onclick = sources; end.appendChild(f); }
  return () => { location.hash = '#/stack'; };
}

/* the field of every attempt at an architecture in one line, on the arrangements block (#480): how many of the recipes
   have been tried and how many beat today's computer somewhere, read from the community's ledger by the population
   engine (ctx.field in src/v2/hold.js). It comes with the shell's idle preload, never with the first page's own load */
export function fillField(sum) {
  if (!sum || !Number.isFinite(sum.tried)) return;
  /* it comes late: where it appears above what you are reading, the page keeps your place (nothing jumps) */
  const box = document.getElementById('home');
  document.querySelectorAll('#hd-root [data-field]').forEach(e => { const above = box && e.getBoundingClientRect().top < box.getBoundingClientRect().top, h0 = box ? box.scrollHeight : 0;
    e.innerHTML = w('field.line', { tried: sum.tried, of: sum.of, beat: sum.beat }) + ' ' + lab(w('field.go'), '#/stack/field'); e.hidden = false;
    if (above) box.scrollTop += box.scrollHeight - h0; });
}
