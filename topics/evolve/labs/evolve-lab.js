/* Labs: Let evolution design it, and Machine or human? The search is src/engines/evolve.js (tested);
   this file runs it a few hundred generations per frame and draws it.
   The site calls init(section) once, after this topic's content is on the page. */
import { $, T, RM, fit, watch, rgba, inView } from 'osl/core/ui.js';
import TC from 'osl/engines/tinychip.js';
import * as EV from 'osl/engines/evolve.js';
import { openStudio } from 'osl/app/studio.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const JOBS = ['half', 'vote', 'full', 'add2', 'seg'];
const KITS = { all: { t: 'All gates', g: EV.GATES }, nand: { t: 'NAND only', g: ['NAND'] }, noxor: { t: 'No XOR', g: ['AND', 'OR', 'NAND', 'NOR', 'NOT'] } };
const MAXGEN = 80000, AFTER = 15000;                     /* keep shrinking for a while after it first works */

export function init() {
  if (!$('#evCv')) return;
  const S = { job: 'vote', kit: 'all', nodes: 30, seed: 1, E: null, running: false, done: false, visible: true };
  const P = () => TC.PROJ.find(p => p.id === S.job);
  $('#evJob').innerHTML = JOBS.map(id => '<button type="button" data-k="' + id + '">' + esc(TC.PROJ.find(p => p.id === id).t) + '</button>').join('');
  $('#evKit').innerHTML = Object.entries(KITS).map(([k, v]) => '<button type="button" data-k="' + k + '">' + v.t + '</button>').join('');
  $('#evJob').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { S.job = b.dataset.k; restart(); } });
  $('#evKit').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { S.kit = b.dataset.k; restart(); } });
  $('#evNodes').addEventListener('input', () => { S.nodes = +$('#evNodes').value; restart(); });
  $('#evNew').addEventListener('click', () => { S.seed = 1 + Math.floor(Math.random() * 1e6); restart(); });
  $('#evRun').addEventListener('click', () => { if (S.done) { restart(); } S.running = !S.running; if (RM && S.running) { /* no animation: run it all at once */ while (!S.done) tick(4000); S.running = false; } ui(); });
  $('#evOpen').addEventListener('click', () => { if (!S.E || !S.E.fit.solved) return; openStudio(S.job, 1, EV.toCode(S.E.T, S.E.best)); location.hash = 'lab-tiny-1'; });
  const human = () => EV.measure(P(), P().sol);

  function restart() {
    S.E = EV.evolution(P(), { seed: S.seed, nodes: S.nodes, gates: KITS[S.kit].g }); S.done = false; S.running = false; ui();
  }
  function tick(n) {
    const E = S.E; E.step(n);
    if (E.gen >= MAXGEN || (E.solvedAt !== null && E.gen >= E.solvedAt + AFTER)) { S.done = true; S.running = false; }
  }
  function ui() {
    const E = S.E, f = E.fit, h = human(), p = P();
    ['#evJob', '#evKit'].forEach((id, k) => $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === (k ? S.kit : S.job))));
    $('#evNodesO').textContent = S.nodes;
    $('#evRun').textContent = S.running ? 'Pause' : S.done ? 'Evolve again' : E.gen ? 'Keep evolving' : 'Evolve';
    $('#evGen').textContent = E.gen.toLocaleString('en-US');
    $('#evOk').textContent = f.correct + ' of ' + E.T.bits + ' (' + Math.round(f.correct / E.T.bits * 100) + '%)';
    $('#evSize').textContent = f.size; $('#evHuman').textContent = h.cells + ' cells';
    $('#evTag').textContent = f.solved ? '✓ Works' + (E.solvedAt ? ' from generation ' + E.solvedAt.toLocaleString('en-US') : '') : S.running ? 'Searching…' : 'Not working yet';
    $('#evHint').textContent = !E.gen ? 'The first circuit is random wiring: it gets about half the answers right by luck. Press Evolve.'
      : !f.solved ? (S.done ? 'Evolution ran out of time. Give it more room for gates, allow more kinds of gate, or start again with a new seed.' : 'Every improvement was found by chance and kept. Most changes make things worse and are thrown away.')
      : S.running ? 'It works. Now it keeps going, looking for the same answers with fewer gates.'
      : 'Done. Compare it with the human design below.';
    draw(); chart(); compare();
  }
  function draw() {
    const E = S.E, G = E.best, T0 = E.T, I = T0.ins.length, on = EV.active(T0, G);
    const cv = $('#evCv'), { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    /* columns by depth from the inputs */
    const lvl = {}; T0.ins.forEach((_, i) => { lvl[i] = 0; });
    G.nodes.forEach((nd, k) => { if (!on[k]) return; lvl[I + k] = 1 + Math.max(lvl[nd.a] || 0, nd.t === 'NOT' ? 0 : (lvl[nd.b] || 0)); });
    const used = G.nodes.map((_, k) => k).filter(k => on[k]), maxL = Math.max(1, ...used.map(k => lvl[I + k]));
    const cols = Array.from({ length: maxL + 2 }, () => []); T0.ins.forEach((_, i) => cols[0].push(i)); used.forEach(k => cols[lvl[I + k]].push(I + k));
    const L = 54, R = 70, X = l => L + (l / (maxL + 1)) * (w - L - R), pos = {};
    cols.forEach((col, l) => col.forEach((id, j) => { pos[id] = { x: X(l), y: (j + 1) * h / (col.length + 1) }; }));
    const ox = w - R + 20;
    c.lineWidth = 1.4; c.strokeStyle = rgba(T.muted, 0.7);
    const wire = (a, b) => { c.beginPath(); c.moveTo(a.x + 14, a.y); const mx = (a.x + b.x) / 2; c.bezierCurveTo(mx, a.y, mx, b.y, b.x - 14, b.y); c.stroke(); };
    used.forEach(k => { const nd = G.nodes[k]; wire(pos[nd.a], pos[I + k]); if (nd.t !== 'NOT') wire(pos[nd.b], pos[I + k]); });
    G.outs.forEach((o, j) => { const y = (j + 1) * h / (T0.outs.length + 1); wire(pos[o], { x: ox + 14, y }); });
    c.font = '600 10px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    used.forEach(k => { const q = pos[I + k], t = G.nodes[k].t; c.fillStyle = T.surface; c.strokeStyle = T.ink; c.lineWidth = 1.5; c.fillRect(q.x - 16, q.y - 10, 32, 20); c.strokeRect(q.x - 16, q.y - 10, 32, 20); c.fillStyle = T.ink; c.fillText(t, q.x, q.y + 1); });
    c.font = '600 12px "IBM Plex Mono", monospace';
    T0.ins.forEach((n, i) => { const q = pos[i]; c.fillStyle = T.cyan; c.textAlign = 'right'; c.fillText(n, q.x + 8, q.y); });
    T0.outs.forEach((n, j) => { const y = (j + 1) * h / (T0.outs.length + 1); c.fillStyle = T.amber; c.textAlign = 'left'; c.fillText(n, ox + 18, y); });
    if (!used.length) { c.fillStyle = T.muted; c.textAlign = 'center'; c.fillText('no gates yet: outputs wired straight to inputs', w / 2, h - 14); }
  }
  function chart() {
    const E = S.E, H = E.history.concat([[E.gen, E.fit.correct, E.fit.size]]);
    const cv = $('#evChart'), { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const L = 8, R = 8, top = 16, bot = h - 18, gmax = Math.max(100, E.gen), X = g => L + g / gmax * (w - L - R);
    const smax = Math.max(4, ...H.map(x => x[2]));
    c.strokeStyle = T.line; c.beginPath(); c.moveTo(L, bot); c.lineTo(w - R, bot); c.stroke();
    const line = (f, col) => { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); H.forEach((x, i) => { const y = f(x); if (i) c.lineTo(X(x[0]), y); else c.moveTo(X(x[0]), y); }); c.stroke(); };
    line(x => bot - x[1] / E.T.bits * (bot - top), T.good); line(x => bot - x[2] / smax * (bot - top), T.amber);
    if (E.solvedAt) { c.strokeStyle = rgba(T.good, 0.6); c.setLineDash([3, 3]); c.beginPath(); c.moveTo(X(E.solvedAt), top); c.lineTo(X(E.solvedAt), bot); c.stroke(); c.setLineDash([]); }
    c.font = '11px "IBM Plex Sans", sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.fillStyle = T.good; c.fillText('correct answers', L, 8); c.fillStyle = T.amber; c.fillText('gates used', L + 110, 8);
    c.fillStyle = T.muted; c.textAlign = 'right'; c.fillText(E.gen.toLocaleString('en-US') + ' generations', w - R, h - 7);
  }
  function compare() {
    const E = S.E, p = P(), h = EV.measure(p, p.sol), ok = E.fit.solved;
    const code = EV.toCode(E.T, E.best), m = ok ? EV.measure(p, code) : null;
    $('#evCode').textContent = ok ? code : '(not working yet: evolve until every answer is correct)';
    $('#evHumanCode').textContent = p.sol;
    const rows = x => x ? '<div><span>Cells</span><b>' + x.cells + '</b></div><div><span>Transistors</span><b>' + x.tr + '</b></div><div><span>Gates on the longest path</span><b>' + x.depth + '</b></div>' : '';
    $('#evMeas').innerHTML = rows(m); $('#evHMeas').innerHTML = rows(h);
    $('#evOpen').disabled = !ok;
    $('#evCTag').textContent = !m ? '–' : m.cells < h.cells ? 'Evolution wins on cells' : m.cells > h.cells ? 'The person wins on cells' : 'A tie on cells';
    $('#evVerdict').textContent = !m ? '' : (m.cells < h.cells ? 'Evolution found a smaller circuit than the person did. ' : m.cells === h.cells ? 'Evolution matched the person. ' : 'The person\'s design is smaller, for now. ') +
      (m.tr < h.tr ? 'It also uses fewer transistors.' : m.tr > h.tr ? 'But it uses more transistors: it counts gates, and some gates are bigger than others.' : 'It uses the same number of transistors.') +
      ' Now try to explain how it works, line by line, without running it. That is the hard part.';
  }
  function loop() {
    if (!$('#evCv').isConnected) return;
    if (S.running && S.visible) { tick(S.job === 'seg' || S.job === 'add2' ? 600 : 250); ui(); }
    requestAnimationFrame(loop);
  }
  inView($('#evCv'), v => { S.visible = v; });
  watch($('#evCv'), draw); watch($('#evChart'), chart);
  restart(); requestAnimationFrame(loop);
}
