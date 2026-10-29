/* Lab: PHOTONICS. One Mach-Zehnder interferometer: two couplers and two phase shifters. */
import { $, T, fit, watch, rgba } from '../core/ui.js';
import { mzi } from '../engines/paradigms.js';

export function init() {
  const cv = $('#mzCv'); if (!cv) return;
  const th = $('#mzTh'), ph = $('#mzPh'), inp = $('#mzIn'), nz = $('#mzNz');
  let goal = 'bottom', res = null, seed = 1;
  [th, ph, inp].forEach(el => el.addEventListener('input', draw));
  nz.addEventListener('input', () => { seed++; draw(); });
  $('#mzGoals').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { goal = b.dataset.g; draw(); } });
  const deg = r => Math.round(r * 180 / Math.PI) + '°';
  function draw() {
    const a = Math.sqrt(+inp.value), b = Math.sqrt(1 - +inp.value);
    $('#mzThO').textContent = deg(+th.value); $('#mzPhO').textContent = deg(+ph.value); $('#mzInO').textContent = Math.round(+inp.value * 100) + '% (bottom ' + Math.round((1 - +inp.value) * 100) + '%)'; $('#mzNzO').textContent = '±' + deg(+nz.value);
    res = mzi([a, b], +th.value, +ph.value, { phaseNoise: +nz.value, seed });
    const [p1, p2] = res.power;
    $('#mzO1').textContent = Math.round(p1 * 100) + '%'; $('#mzO2').textContent = Math.round(p2 * 100) + '%';
    $('#mzGoals').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.g === goal));
    const target = { bottom: [0, 1], split: [0.5, 0.5], quarter: [0.25, 0.75] }[goal];
    const off = Math.abs(p1 - target[0]);
    const ok = off < 0.03 && Math.abs(+inp.value - 1) < 1e-9;
    $('#mzTag').textContent = ok ? 'Challenge met' : 'Top ' + Math.round(p1 * 100) + '% · bottom ' + Math.round(p2 * 100) + '%';
    $('#mzTxt').textContent = Math.abs(+inp.value - 1) > 1e-9 ? 'With light in both inputs, the outputs depend on how the two waves line up: change the outer phase φ and watch them trade power. That is interference doing arithmetic.'
      : ok ? 'Done. The inner phase θ alone decides how the light divides: ' + (goal === 'bottom' ? 'at the right θ, the two paths cancel at the top output.' : 'any split ratio is just a different θ.') + (+nz.value > 0.05 ? ' Notice how phase error spoils precise ratios: photonic chips must hold every phase steady against heat.' : '')
        : 'Set all light into the top input, then turn the inner phase θ until the outputs match the challenge.';
    paint();
  }
  function paint() {
    if (!res) return;
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const y1 = h * 0.3, y2 = h * 0.7, xs = [30, w * 0.16, w * 0.3, w * 0.42, w * 0.58, w * 0.7, w * 0.84, w - 30];
    const pin = [+inp.value, 1 - +inp.value], pout = res.power;
    const line = (x0, ya, x1, yb, p) => { c.strokeStyle = rgba(T['amber-fill'], 0.15 + 0.85 * p); c.lineWidth = 3 + 7 * p; c.beginPath(); c.moveTo(x0, ya); c.bezierCurveTo((x0 + x1) / 2, ya, (x0 + x1) / 2, yb, x1, yb); c.stroke(); };
    c.lineCap = 'round';
    /* inputs, outer phase on the top input */
    line(xs[0], y1, xs[1], y1, pin[0]); line(xs[0], y2, xs[1], y2, pin[1]);
    const mid = 0.5;
    line(xs[1], y1, xs[2], h / 2 - 6, mid); line(xs[1], y2, xs[2], h / 2 + 6, mid); line(xs[2], h / 2 - 6, xs[3], y1, mid); line(xs[2], h / 2 + 6, xs[3], y2, mid);
    line(xs[3], y1, xs[4], y1, mid); line(xs[3], y2, xs[4], y2, mid);
    line(xs[4], y1, xs[5], h / 2 - 6, mid); line(xs[4], y2, xs[5], h / 2 + 6, mid); line(xs[5], h / 2 - 6, xs[6], y1, pout[0]); line(xs[5], h / 2 + 6, xs[6], y2, pout[1]);
    line(xs[6], y1, xs[7], y1, pout[0]); line(xs[6], y2, xs[7], y2, pout[1]);
    const box = (x, y, t) => { c.fillStyle = T.surface; c.strokeStyle = T.violet; c.lineWidth = 1.5; c.beginPath(); c.roundRect ? c.roundRect(x - 24, y - 13, 48, 26, 5) : c.rect(x - 24, y - 13, 48, 26); c.fill(); c.stroke(); c.fillStyle = T.ink; c.font = '600 12px IBM Plex Mono, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y); };
    box((xs[0] + xs[1]) / 2, y1, 'φ'); box((xs[3] + xs[4]) / 2, y1, 'θ');
    c.fillStyle = T.muted; c.font = '11px IBM Plex Sans, sans-serif'; c.textAlign = 'center'; c.fillText('coupler', xs[2], h / 2 + 30); c.fillText('coupler', xs[5], h / 2 + 30);
    c.textAlign = 'left'; c.fillText('in', 6, y1 - 14); c.textAlign = 'right'; c.fillStyle = T.ink; c.font = '600 12px IBM Plex Mono, monospace'; c.fillText(Math.round(pout[0] * 100) + '%', w - 6, y1 - 14); c.fillText(Math.round(pout[1] * 100) + '%', w - 6, y2 + 20);
  }
  watch(cv, paint);
  draw();
}
