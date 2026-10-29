/* Lab: PROBABILISTIC BITS. An invertible AND gate: clamp inputs to compute forwards, clamp the output to run it backwards. */
import { $ } from '../core/ui.js';
import { pSample, pEnergy } from '../engines/paradigms.js';

const NAMES = ['A', 'B', 'C = A AND B'];
export function init() {
  if (!$('#pbHist')) return;
  const clamp = [null, null, null]; let seed = 11, last = null;
  $('#pbClamp').innerHTML = NAMES.map((n, i) => '<div class="pbrow"><span>' + n + '</span><div class="seg" data-i="' + i + '"><button type="button" data-v="">Free</button><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button></div></div>').join('');
  $('#pbClamp').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const i = +b.closest('[data-i]').dataset.i; clamp[i] = b.dataset.v === '' ? null : +b.dataset.v; run(); });
  $('#pbBeta').addEventListener('input', run);
  $('#pbRun').addEventListener('click', () => { seed++; run(); });
  function run() {
    const beta = +$('#pbBeta').value; $('#pbBetaO').textContent = beta.toFixed(1);
    const cl = {}; clamp.forEach((v, i) => { if (v !== null) cl[i] = v ? 1 : -1; });
    last = pSample({ beta, clamp: cl, sweeps: 2000, seed });
    draw(beta);
  }
  function draw(beta) {
    $('#pbClamp').querySelectorAll('[data-i]').forEach(seg => { const i = +seg.dataset.i; seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === '' ? clamp[i] === null : +b.dataset.v === clamp[i]) ? 'true' : 'false')); });
    const total = Object.values(last).reduce((a, b) => a + b, 0);
    const keys = ['000', '010', '100', '111', '001', '011', '101', '110'];
    $('#pbHist').innerHTML = keys.map(k => { const n = last[k] || 0, valid = (k[2] === '1') === (k[0] === '1' && k[1] === '1'); const pr = n / total; return '<div><span>' + k + '</span><div class="track"><i style="width:' + (pr * 100).toFixed(1) + '%;background:' + (valid ? 'var(--good)' : 'var(--bad)') + '"></i></div><b>' + Math.round(pr * 100) + '%</b><small>' + (valid ? 'valid AND' : 'breaks the rule') + ' · energy ' + pEnergy(k.split('').map(c => (c === '1' ? 1 : -1))) + '</small></div>'; }).join('');
    const valid = keys.filter(k => (k[2] === '1') === (k[0] === '1' && k[1] === '1')).reduce((s, k) => s + (last[k] || 0), 0) / total;
    $('#pbTag').textContent = Math.round(valid * 100) + '% of the time in valid AND states';
    const freeIn = clamp[0] === null && clamp[1] === null, back = clamp[2] !== null && freeIn;
    let t;
    if (beta < 0.3) t = 'With almost no steering, the bits wander at random: every state shows up about equally. Noise alone computes nothing.';
    else if (back && clamp[2] === 1) t = 'Running backwards: you fixed the output to 1 and the network found the only inputs that make it, A = 1 and B = 1. An ordinary AND gate cannot do this.';
    else if (back) t = 'Running backwards with C = 0: the network keeps visiting all three input pairs that give 0. It samples every answer, not just one.';
    else if (clamp[0] !== null && clamp[1] !== null) t = 'Running forwards: with both inputs fixed, C settles to A AND B almost every time.';
    else if (clamp.every(v => v === null)) t = beta > 2 ? 'Fully free and strongly steered, the network can get stuck in one valid state: the barrier to the others is too high. Lower the steering to let it explore.' : 'Fully free, the network spends its time in the four valid AND states. That is the rule, stored as an energy landscape.';
    else t = 'Partly clamped: the free bits settle into states consistent with the ones you fixed.';
    $('#pbTxt').textContent = t;
  }
  run();
}
