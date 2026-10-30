/* Lab: NEUROMORPHIC. Two leaky integrate-and-fire neurons listen to four spiking sensors. */
import { $, T, fit, watch, rgba } from 'osl/core/ui.js';
import { spikeTrains, lif, SNN_W } from 'osl/engines/paradigms.js';

const KEY = 'osl-neuro-v1';
export function init() {
  const cv = $('#snCv'); if (!cv) return;
  let pat = 'A', run = null;
  const tI = $('#snT'), lI = $('#snL');
  $('#snPat').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { pat = b.dataset.p; draw(); } });
  [tI, lI].forEach(el => el.addEventListener('input', draw));
  /* The goal is met when detector A fires for pattern A, and stays silent for B, noise and quiet. */
  function goal(threshold, leak) {
    const n = p => lif(spikeTrains(p), SNN_W, { threshold, leak }).counts[0];
    return { a: n('A'), others: n('B') + n('noise') + n('quiet') };
  }
  function draw() {
    const threshold = +tI.value, leak = +lI.value;
    $('#snTO').textContent = threshold.toFixed(2); $('#snLO').textContent = Math.round(leak * 100) + '%';
    $('#snPat').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === pat));
    const tr = spikeTrains(pat); run = { tr, ...lif(tr, SNN_W, { threshold, leak }) };
    $('#snA').textContent = run.counts[0]; $('#snB').textContent = run.counts[1];
    $('#snEv').textContent = run.events.toLocaleString('en-US'); $('#snDn').textContent = run.dense.toLocaleString('en-US');
    const g = goal(threshold, leak); const ok = g.a >= 3 && g.others === 0;
    let solved = false; try { solved = localStorage.getItem(KEY) === '1'; } catch (e) { /* ignore */ }
    if (ok && !solved) { try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ } solved = true; }
    const box = $('#snGoal'); box.querySelector('p:last-child').textContent = ok ? 'Done: detector A fires ' + g.a + ' times for pattern A and never for B, noise or silence. It reacts to the pattern, not to activity in general.' : 'Make detector A fire at least 3 times for pattern A, and not at all for pattern B, noise or silence. Right now: ' + g.a + ' spikes for A, ' + g.others + ' false alarm' + (g.others === 1 ? '' : 's') + '.';
    box.style.borderColor = ok ? 'var(--good)' : '';
    $('#snTag').textContent = ok ? 'Goal met' : (solved ? 'Solved before · keep exploring' : 'Goal: detect pattern A');
    paint();
  }
  function paint() {
    if (!run) return;
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const L = 74, Rt = 10, steps = run.tr[0].length; const X = t => L + (t + 0.5) * (w - L - Rt) / steps;
    c.font = '11px IBM Plex Mono, monospace'; c.textBaseline = 'middle'; c.textAlign = 'right';
    const rowH = 16; let y = 14;
    run.tr.forEach((s, i) => { c.fillStyle = T.muted; c.fillText('sensor ' + (i + 1), L - 8, y); c.strokeStyle = rgba(T.muted, 0.2); c.beginPath(); c.moveTo(L, y); c.lineTo(w - Rt, y); c.stroke(); c.fillStyle = i < 2 ? T['amber-fill'] : T.cyan; s.forEach((v, t) => { if (v) c.fillRect(X(t) - 1.5, y - 6, 3, 12); }); y += rowH; });
    const top = y + 8, bandH = (h - top - 8) / 2, thr = +tI.value;
    ['A', 'B'].forEach((nm, k) => {
      const y0 = top + k * bandH, Y = v => y0 + bandH - 8 - Math.max(0, Math.min(1.15, v / (thr * 1.15))) * (bandH - 20);
      c.fillStyle = T.ink; c.fillText('detector ' + nm, L - 8, y0 + bandH / 2);
      c.strokeStyle = rgba(T.bad, 0.6); c.setLineDash([4, 3]); c.beginPath(); c.moveTo(L, Y(thr)); c.lineTo(w - Rt, Y(thr)); c.stroke(); c.setLineDash([]);
      c.strokeStyle = k ? T.cyan : T['amber-fill']; c.lineWidth = 1.8; c.beginPath();
      run.V[k].forEach((v, t) => { const vv = run.S[k][t] ? thr : v; t ? c.lineTo(X(t), Y(vv)) : c.moveTo(X(t), Y(vv)); }); c.stroke(); c.lineWidth = 1;
      run.S[k].forEach((s, t) => { if (s) { c.fillStyle = T.bad; c.beginPath(); c.moveTo(X(t), y0 + 4); c.lineTo(X(t) - 4, y0 + 12); c.lineTo(X(t) + 4, y0 + 12); c.fill(); } });
    });
    c.textAlign = 'left'; c.fillStyle = T.muted; c.fillText('dashed: threshold · ▲ spike out', L, h - 4);
  }
  watch(cv, paint);
  draw();
}
