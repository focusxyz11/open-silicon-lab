/* Labs: REVERSIBLE COMPUTING. Energy per switch against the Landauer limit; a Toffoli gate run backwards. */
import { $, T, fit, watch, rgba } from '../core/ui.js';
import { switchLoss, adiabaticLoss, landauer, toffoli } from '../engines/paradigms.js';

const C = 1e-15, RES = 1e3;
const fmtJ = j => { const u = [[1e-15, 'fJ'], [1e-18, 'aJ'], [1e-21, 'zJ']]; for (const [f, n] of u) if (j >= f) return (j / f).toPrecision(3) + ' ' + n; return j.toExponential(2) + ' J'; };
const fmtT = s => s >= 1e-6 ? (s * 1e6).toPrecision(2) + ' µs' : s >= 1e-9 ? (s * 1e9).toPrecision(2) + ' ns' : (s * 1e12).toPrecision(2) + ' ps';

export function init() { energy(); tof(); }

function energy() {
  const cv = $('#rvCv'); if (!cv) return;
  const tI = $('#rvT'), vI = $('#rvV');
  [tI, vI].forEach(el => el.addEventListener('input', draw));
  let E = null;
  function draw() {
    const Tr = 10 ** +tI.value, V = +vI.value;
    $('#rvTO').textContent = fmtT(Tr) + ' (RC = 1 ps)'; $('#rvVO').textContent = V.toFixed(2) + ' V';
    E = [switchLoss(C, V), adiabaticLoss(C, V, RES, Tr), landauer(300)];
    $('#rvE1').textContent = fmtJ(E[0]); $('#rvE2').textContent = fmtJ(E[1]); $('#rvE3').textContent = fmtJ(E[2]);
    $('#rvTag').textContent = 'Adiabatic saves ' + (E[0] / E[1]).toFixed(E[0] / E[1] < 10 ? 1 : 0) + '×';
    $('#rvTxt').textContent = 'Ordinary switching sits about ' + Math.round(Math.log10(E[0] / E[2])) + ' orders of magnitude above the Landauer limit. Ramping the voltage over ' + fmtT(Tr) + ' instead of instantly cuts the loss ' + (E[0] / E[1]).toFixed(0) + '×, but the gate is now ' + Math.round(Tr / 1e-11) + ' times slower than a 10 ps edge. Reversible chips win only if they run many slow gates in parallel, and recover the energy with a resonant supply.';
    paint();
  }
  function paint() {
    if (!E) return; const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const lo = -22, hi = -14, L = 60, B = 24, Tp = 12; const Y = j => Tp + (hi - Math.log10(j)) / (hi - lo) * (h - Tp - B);
    c.font = '11px IBM Plex Mono, monospace'; c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let e = lo; e <= hi; e++) { c.strokeStyle = rgba(T.muted, 0.18); c.beginPath(); c.moveTo(L, Y(10 ** e)); c.lineTo(w - 10, Y(10 ** e)); c.stroke(); if (e % 3 === 0) { c.fillStyle = T.muted; c.fillText({ '-15': '1 fJ', '-18': '1 aJ', '-21': '1 zJ' }[e], L - 6, Y(10 ** e)); } }
    const bars = [['Ordinary', E[0], T['amber-fill']], ['Adiabatic', E[1], T.cyan], ['Landauer limit', E[2], T.violet]];
    const bw = (w - L - 40) / 3;
    bars.forEach(([n, v, col], i) => { const x = L + 20 + i * bw, y = Y(v); c.fillStyle = col; c.fillRect(x + bw * 0.2, y, bw * 0.6, h - B - y); c.fillStyle = T.ink; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.font = '600 12px IBM Plex Mono, monospace'; c.fillText(fmtJ(v), x + bw / 2, y - 4); c.textBaseline = 'top'; c.font = '11px IBM Plex Sans, sans-serif'; c.fillStyle = T.muted; c.fillText(n, x + bw / 2, h - B + 6); });
  }
  watch(cv, paint);
  draw();
}

function tof() {
  if (!$('#tfAnd')) return;
  const bits = n => n.toString(2).padStart(3, '0').split('').map(Number);
  $('#tfAnd').innerHTML = '<tr><th>a</th><th>b</th><th class="sep">a AND b</th></tr>' + [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => '<tr><td>' + a + '</td><td>' + b + '</td><td class="sep">' + (a & b) + '</td></tr>').join('');
  const rows = Array.from({ length: 8 }, (_, k) => { const [a, b, c] = bits(k); return { i: [a, b, c], o: toffoli(a, b, c) }; });
  let sel = null;
  $('#tfOut').innerHTML = rows.map(r => '<button type="button" data-o="' + r.o.join('') + '">' + r.o.join('') + '</button>').join('');
  $('#tfOut').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { sel = b.dataset.o; draw(); } });
  function draw() {
    $('#tfTof').innerHTML = '<tr><th>a</th><th>b</th><th>c</th><th class="sep">a′</th><th>b′</th><th>c′</th></tr>' + rows.map(r => '<tr' + (r.o.join('') === sel ? ' class="hl"' : '') + '><td>' + r.i.join('</td><td>') + '</td><td class="sep">' + r.o[0] + '</td><td>' + r.o[1] + '</td><td>' + r.o[2] + '</td></tr>').join('');
    $('#tfOut').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.o === sel));
    if (!sel) { $('#tfTxt').textContent = 'AND maps four inputs onto two outputs: three different inputs all give 0, so a 0 cannot tell you where it came from. That lost information is what Landauer says must be paid for in heat.'; $('#tfTag').textContent = 'Pick an output'; return; }
    const r = rows.find(x => x.o.join('') === sel);
    $('#tfTxt').textContent = 'Output ' + sel + ' comes from exactly one input: ' + r.i.join('') + '. The Toffoli gate is its own inverse: apply it again and you are back where you started. No information is erased, so in principle no energy has to be.';
    $('#tfTag').textContent = 'Every output has exactly one input';
  }
  draw();
}
