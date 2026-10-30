/* Lab: COMPUTE IN MEMORY. An 8 × 4 analog crossbar: Ohm's law multiplies, Kirchhoff's law adds. */
import { $, T, fit, watch, rgba } from 'osl/core/ui.js';
import { crossbar, cimEnergy, rng } from 'osl/engines/paradigms.js';

export function init() {
  const cv = $('#cbCv'); if (!cv) return;
  const R = 8, C = 4; let seed = 5, W, x;
  const make = () => { const r = rng(seed * 97 + 1); W = Array.from({ length: R }, () => Array.from({ length: C }, () => Math.round((r() * 2 - 1) * 100) / 100)); x = Array.from({ length: R }, () => Math.round(r() * 100) / 100); };
  make();
  const wI = $('#cbW'), nI = $('#cbN'), aI = $('#cbA');
  [wI, nI, aI].forEach(el => el.addEventListener('input', draw));
  $('#cbNew').addEventListener('click', () => { seed++; make(); draw(); });
  let res = null;
  function draw() {
    const wBits = +wI.value, sigma = +nI.value, adcBits = +aI.value;
    $('#cbWO').textContent = wBits + ' bits (' + (((1 << (wBits - 1)) - 1) * 2 + 1) + ' levels)';
    $('#cbNO').textContent = '±' + Math.round(sigma * 100) + '%';
    $('#cbAO').textContent = adcBits + ' bits';
    res = crossbar(W, x, { wBits, sigma, adcBits, seed: seed + 3 });
    const E = cimEnergy(R, C, adcBits);
    $('#cbErr').textContent = (res.err * 100).toFixed(1) + '%';
    $('#cbErr').style.color = res.err > 0.05 ? 'var(--bad)' : 'var(--good)';
    $('#cbED').textContent = E.digital.toFixed(0) + ' pJ'; $('#cbEA').textContent = E.analog.toFixed(1) + ' pJ';
    $('#cbSave').textContent = E.digital > E.analog ? (E.digital / E.analog).toFixed(1) + '× less energy' : 'nothing: the converters cost more';
    $('#cbTag').textContent = res.err <= 0.05 ? 'Within 5% of exact' : 'Too inaccurate';
    $('#cbOut').innerHTML = res.exact.map((e, j) => { const a = res.analog[j], w = Math.min(100, Math.abs(e) / R * 100 * 2.5), wa = Math.min(100, Math.abs(a) / R * 100 * 2.5); return '<div><span>Column ' + (j + 1) + '</span><div class="cbbar"><i style="width:' + w + '%"></i><em style="width:' + wa + '%"></em></div><b>' + e.toFixed(2) + '</b><small>analog ' + a.toFixed(2) + '</small></div>'; }).join('') + '<p class="legend"><span><i style="background:var(--amber-fill)"></i>Exact digital result</span><span><i style="background:var(--cyan-fill)"></i>Analog result</span></p>';
    $('#cbTxt').textContent = res.err <= 0.05 && adcBits <= 5 ? 'Good trade: accurate enough for many small networks, with cheap converters.' : res.err > 0.05 && sigma > 0.08 ? 'The devices vary too much: more converter bits cannot fix errors already in the array.' : res.err > 0.05 ? 'Too coarse: raise the weight precision or the converter bits.' : adcBits >= 9 ? 'Accurate, but the converters now eat most of the energy saved in the array.' : 'Accurate and efficient. Can you get away with fewer converter bits?';
    paint();
  }
  function paint() {
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const L = 70, Tp = 18, B = 46, Rt = 20;
    const gx = j => L + (j + 0.5) * (w - L - Rt) / C, gy = i => Tp + (i + 0.5) * (h - Tp - B) / R;
    c.lineCap = 'round';
    for (let i = 0; i < R; i++) { c.strokeStyle = rgba(T.amber, 0.25 + 0.75 * x[i]); c.lineWidth = 1 + 4 * x[i]; c.beginPath(); c.moveTo(L - 8, gy(i)); c.lineTo(w - Rt, gy(i)); c.stroke();
      c.fillStyle = T.muted; c.font = '11px IBM Plex Mono, monospace'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText('V' + (i + 1) + ' ' + x[i].toFixed(2), L - 12, gy(i)); }
    for (let j = 0; j < C; j++) { const I = res ? Math.abs(res.analog[j]) / R : 0; c.strokeStyle = rgba(T.cyan, 0.3 + 0.7 * Math.min(1, I * 2.5)); c.lineWidth = 1.5 + 5 * Math.min(1, I * 2.5); c.beginPath(); c.moveTo(gx(j), Tp - 6); c.lineTo(gx(j), h - B + 6); c.stroke();
      c.fillStyle = T.ink; c.textAlign = 'center'; c.textBaseline = 'top'; c.font = '600 11px IBM Plex Mono, monospace'; c.fillText('I' + (j + 1), gx(j), h - B + 10); c.font = '10px IBM Plex Mono, monospace'; c.fillStyle = T.muted; c.fillText('ADC', gx(j), h - B + 24); }
    for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) { const v = W[i][j], s = 5 + 7 * Math.abs(v); c.fillStyle = v >= 0 ? rgba(T.violet, 0.25 + 0.6 * Math.abs(v)) : rgba(T.rose, 0.25 + 0.6 * Math.abs(v)); c.strokeStyle = T.surface; c.lineWidth = 1.5; c.beginPath(); c.arc(gx(j), gy(i), s, 0, 7); c.fill(); c.stroke(); }
    c.fillStyle = T.muted; c.textAlign = 'left'; c.textBaseline = 'top'; c.font = '11px IBM Plex Sans, sans-serif'; c.fillText('Cell size = weight · violet positive, rose negative', L, 2);
  }
  watch(cv, paint);
  draw();
}
