/* Lab: QUANTUM. Build a two-qubit circuit and watch amplitudes, interference and entanglement. */
import { $ } from 'osl/core/ui.js';
import { qrun, qprobs, qsample } from 'osl/engines/paradigms.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLS = 6, LABELS = ['00', '01', '10', '11'];
const GOALS = {
  one: { t: 'Make 11 for certain', ok: p => p[3] > 0.999, hint: 'X flips a qubit from 0 to 1. Put one on each wire.' },
  back: { t: 'Superposition, then undo it', ok: (p, c) => p[0] > 0.999 && c.some(col => col[0] === 'H' || col[1] === 'H'), hint: 'H makes 0 and 1 equally likely. A second H on the same wire makes the two paths interfere, and the 1 cancels out.' },
  bell: { t: 'Entangle: only 00 or 11', ok: p => Math.abs(p[0] - 0.5) < 0.01 && Math.abs(p[3] - 0.5) < 0.01, hint: 'H on the first qubit, then CX: the second qubit copies whatever the first turns out to be.' },
  odd: { t: 'Only 01 or 10', ok: p => Math.abs(p[1] - 0.5) < 0.01 && Math.abs(p[2] - 0.5) < 0.01, hint: 'Start from the entangled 00-or-11 circuit and flip one qubit at the end.' }
};

export function init() {
  if (!$('#qcGrid')) return;
  let grid = Array.from({ length: COLS }, () => [null, null]), pal = 'H', goal = 'bell', hist = null;
  const PAL = ['H', 'X', 'Z', 'S', 'CX', 'XC', '–'];
  $('#qcPal').innerHTML = PAL.map(g => '<button type="button" data-g="' + g + '">' + (g === '–' ? 'Erase' : g) + '</button>').join('');
  $('#qcPal').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { pal = b.dataset.g; draw(); } });
  $('#qcGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return; const col = +b.dataset.c, q = +b.dataset.q;
    if (pal === '–') grid[col] = (grid[col][0] === 'CX' || grid[col][0] === 'XC') ? [null, null] : (grid[col][q] = null, grid[col]);
    else if (pal === 'CX' || pal === 'XC') grid[col] = [pal, null];
    else { if (grid[col][0] === 'CX' || grid[col][0] === 'XC') grid[col] = [null, null]; grid[col][q] = grid[col][q] === pal ? null : pal; }
    hist = null; draw();
  });
  $('#qcClear').addEventListener('click', () => { grid = Array.from({ length: COLS }, () => [null, null]); hist = null; draw(); });
  $('#qcShot').addEventListener('click', () => { hist = qsample(qrun(circuit()), 100, (Date.now() & 0xffff) + 1); draw(); });
  $('#qcGoals').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { goal = b.dataset.g; draw(); } });
  const circuit = () => grid.filter(c => c[0] || c[1]);
  function cell(col, q) {
    const g = grid[col]; const two = g[0] === 'CX' || g[0] === 'XC';
    let txt = '', cls = '';
    if (two) { const ctrl = g[0] === 'CX' ? 0 : 1; txt = q === ctrl ? '●' : '⊕'; cls = 'two'; }
    else if (g[q]) { txt = g[q]; cls = 'g'; }
    return '<button type="button" role="gridcell" class="qslot ' + cls + '" data-c="' + col + '" data-q="' + q + '" aria-label="Qubit ' + q + ', step ' + (col + 1) + (txt ? ': ' + txt : ': empty') + '">' + txt + '</button>';
  }
  function draw() {
    $('#qcPal').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.g === pal));
    $('#qcGrid').innerHTML = [0, 1].map(q => '<div class="qrow"><span>q' + q + ' |0⟩</span>' + Array.from({ length: COLS }, (_, c) => cell(c, q)).join('') + '<span class="meas">⟶ measure</span></div>').join('');
    const s = qrun(circuit()), p = qprobs(s);
    $('#qcBars').innerHTML = s.map((a, i) => { const pr = p[i], ph = Math.atan2(a.im, a.re); const hue = pr < 1e-9 ? 'var(--line)' : Math.abs(ph) < 0.01 ? 'var(--cyan-fill)' : Math.abs(Math.abs(ph) - Math.PI) < 0.01 ? 'var(--rose)' : 'var(--violet)'; return '<div><span>' + LABELS[i] + '</span><div class="track"><i style="width:' + (pr * 100).toFixed(1) + '%;background:' + hue + '"></i></div><b>' + Math.round(pr * 100) + '%</b><small>' + (pr < 1e-9 ? '' : Math.abs(ph) < 0.01 ? 'phase +' : Math.abs(Math.abs(ph) - Math.PI) < 0.01 ? 'phase −' : 'phase ' + Math.round(ph * 180 / Math.PI) + '°') + '</small></div>'; }).join('');
    $('#qcHist').innerHTML = hist ? hist.map((n, i) => '<div><span>' + LABELS[i] + '</span><div class="track"><i style="width:' + n + '%;background:var(--amber-fill)"></i></div><b>' + n + '</b><small></small></div>').join('') : '<p class="small muted">Measuring collapses the state: each shot gives one outcome, at random, with the probabilities on the left.</p>';
    $('#qcGoals').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.g === goal));
    const G = GOALS[goal], ok = G.ok(p, circuit());
    $('#qcTag').textContent = ok ? 'Puzzle solved: ' + G.t : 'Puzzle: ' + G.t;
    $('#qcTxt').innerHTML = ok ? '<b style="color:var(--good)">Solved.</b> ' + esc(goal === 'bell' || goal === 'odd' ? 'Each qubit alone is a coin flip, yet the two always agree' + (goal === 'odd' ? ' to differ' : '') + '. That correlation, entanglement, has no classical twin, and it is what quantum algorithms and error correction are built from.' : goal === 'back' ? 'The two paths to 1 cancelled each other: interference. Quantum algorithms steer interference so that wrong answers cancel.' : 'Classical logic works on qubits too; the quantum part starts with H.') : '<b>Hint:</b> ' + esc(G.hint);
  }
  draw();
}
