/* Six flaky parts, one reliable chip (kind 'redund', at the gate), from src/engines/redundancy.js: the core question
   "Whole beats parts". Each block of a small chip can be built once, three times or five times with a voter that
   takes the majority; the picture draws every copy and its voter, and a run of a thousand chips shows the copies that
   failed, the votes that held and the chips that failed anyway. The goal is the engine's own check (evaluate().met).
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as R from '../../engines/redundancy.js';
import { mark } from '../fid.js';

const RUNS = 1000;

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const plan = () => view.rd || (view.rd = R.startPlan());
  const pct = v => t('rd.pct', { v: v >= 0.9995 ? '99.9+' : (v * 100).toFixed(1) });
  const fails = v => t('rd.in100', { v: ((1 - v) * 100).toFixed(1) });
  const after = () => { const r = R.evaluate(plan()); view.rdTried = (view.rdTried || 0) + 1; if (r.met) win(); view.rdRun = null; draw(); fx(); return true; };

  /* the chip, block by block: its copies as tiles, its voter as a wedge, what got through on the right. During a run,
     the last chip drawn shows which copies failed (red), which votes held (the wedge lit) and which blocks failed */
  function figure(r, last) {
    const W = 300, rowH = 33, H = 14 + R.BLOCKS.length * rowH + 6;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('rd.aria', { v: pct(r.whole) })) + '">';
    r.rows.forEach((row, i) => {
      const b = R.BLOCKS[i], y = 14 + i * rowH, cy = y + 12, tw = 6 + b.area * 2.6, lt = last && last.blocks[i];
      s += '<text class="ax" x="2" y="' + (cy + 4) + '">' + esc(t('rd.b.' + b.id)) + '</text>';
      for (let k = 0; k < row.n; k++) {
        const x = 66 + k * (tw + 3), bad = lt && !lt.copies[k];
        s += '<rect class="rdcopy' + (bad ? ' bad' : lt ? ' ok' : '') + '" x="' + x.toFixed(1) + '" y="' + (cy - 8) + '" width="' + tw.toFixed(1) + '" height="16" rx="3"/>';
      }
      const vx = 172;
      if (row.n > 1) s += '<path class="rdvote' + (lt ? (lt.ok ? ' ok' : ' bad') : '') + '" d="M' + vx + ' ' + (cy - 9) + 'l14 9l-14 9z"/>';
      else s += '<line class="rdwire" x1="' + (66 + tw) + '" x2="' + (vx + 14) + '" y1="' + cy + '" y2="' + cy + '"/>';
      s += '<text class="rdp' + (row.worse ? ' bad' : row.n > 1 ? ' good' : '') + '" x="' + (W - 2) + '" y="' + (cy + 4) + '" text-anchor="end">' + esc(fails(row.ok)) + '</text>';
      if (lt && !lt.ok) s += '<line class="rdx" x1="' + (vx + 20) + '" x2="' + (vx + 26) + '" y1="' + (cy - 3) + '" y2="' + (cy + 3) + '"/><line class="rdx" x1="' + (vx + 26) + '" x2="' + (vx + 20) + '" y1="' + (cy - 3) + '" y2="' + (cy + 3) + '"/>';
    });
    s += '<text class="ax" x="66" y="8">' + esc(t('rd.fig.copies')) + '</text><text class="ax" x="' + (W - 2) + '" y="8" text-anchor="end">' + esc(t('rd.fig.fails')) + '</text></svg>';
    return '<figure class="rdfig" data-f2="instrument">' + s + '<figcaption class="small muted">' + esc(t('rd.legend')) + '</figcaption></figure>';
  }
  function goalbox(r) {
    const G = R.GOAL, gs = [
      { k: 'whole', ok: r.whole >= G.whole, v: fails(r.whole), target: t('rd.t.whole', { v: Math.round((1 - G.whole) * 100) }), f: Math.min(1, (1 - G.whole) / Math.max(1e-6, 1 - r.whole)) },
      { k: 'area', ok: r.area <= G.area + 1e-9, v: t('rd.units', { v: r.area }), target: t('rd.t.area', { v: G.area }), f: Math.min(1, G.area / r.area) }];
    return '<div class="goalbox' + (r.met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(r.met ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('rd.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  /* the copies of each block, chosen with three buttons */
  const picker = r => '<div class="rdpick">' + R.BLOCKS.map((b, i) => '<div class="rdrow"><span class="small"><b>' + esc(t('rd.b.' + b.id)) + '</b> <span class="muted">' + esc(t('rd.bd', { a: b.area, v: (b.p * 100).toFixed(1) })) + '</span></span><span class="rdseg">' +
    R.COPIES.map(n => '<button type="button" class="chipb" data-rd="' + b.id + ':' + n + '" aria-pressed="' + (r.rows[i].n === n) + '">' + esc(t('rd.n' + n)) + '</button>').join('') + '</span></div>').join('') + '</div>';
  /* below threshold (#498): the adder's chance of a wrong answer against its parts', for one copy, three and five, the
     voter made of the same parts; where three and five stop helping, computed by the engine; and error-corrected qubits
     on the same axes, each with the mark of its source */
  function thresholdHtml() {
    const b = R.BLOCKS.find(x => x.id === 'add'), c = R.voterShare(b.area), X0 = 40, X1 = 292, Y0 = 10, Y1 = 150, LX = [Math.log10(5e-4), Math.log10(0.5)], LY = [-6, 0];
    const px = p => X0 + (X1 - X0) * (Math.log10(p) - LX[0]) / (LX[1] - LX[0]), py = q => Y1 - (Y1 - Y0) * (Math.max(LY[0], Math.log10(Math.max(q, 1e-12))) - LY[0]) / (LY[1] - LY[0]);
    const ps = Array.from({ length: 61 }, (_, i) => Math.pow(10, LX[0] + (LX[1] - LX[0]) * i / 60)), th = { 3: R.threshold(3, c), 5: R.threshold(5, c) };
    let s = '<svg viewBox="0 0 300 176" role="img" aria-label="' + esc(t('rd.th.aria', { t3: th[3].toFixed(2), t5: th[5].toFixed(2) })) + '">';
    for (let e = LY[0]; e <= 0; e += 2) s += '<line class="gl" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(Math.pow(10, e)).toFixed(1) + '" y2="' + py(Math.pow(10, e)).toFixed(1) + '"/><text class="ax" x="' + (X0 - 3) + '" y="' + (py(Math.pow(10, e)) + 3).toFixed(1) + '" text-anchor="end">' + (e ? '10' + String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) : '1') + '</text>';
    for (let e = -3; e <= -1; e++) s += '<text class="ax" x="' + px(Math.pow(10, e)).toFixed(1) + '" y="' + (Y1 + 12) + '" text-anchor="middle">10' + String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) + '</text>';
    for (const n of [1, 3, 5]) s += '<polyline class="rdth n' + n + '" points="' + R.sweep(n, c, ps).map(q => px(q.p).toFixed(1) + ',' + py(q.wrong).toFixed(1)).join(' ') + '"/>';
    for (const n of [3, 5]) { const x = px(th[n]); s += '<line class="rdthv n' + n + '" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + Y0 + '" y2="' + Y1 + '"/><text class="ax rdthl n' + n + '" x="' + (x - 3).toFixed(1) + '" y="' + (n === 3 ? Y1 - 18 : Y1 - 6) + '" text-anchor="end">' + esc(t('rd.th.at', { n, v: th[n].toFixed(2) })) + '</text>'; }
    for (const q of R.QUANTUM) { const x = px(q.phys), y = py(q.logical); s += '<path class="rdq" d="M' + x.toFixed(1) + ' ' + (y - 5).toFixed(1) + 'l5 5l-5 5l-5 -5z"/><text class="ax rdql" x="' + (x + 7).toFixed(1) + '" y="' + (y + 3).toFixed(1) + '">' + esc(t('rd.th.q.' + q.id, { n: q.qubits })) + '</text>'; }
    s += '<text class="ax" x="' + ((X0 + X1) / 2) + '" y="' + (Y1 + 24) + '" text-anchor="middle">' + esc(t('rd.th.x')) + '</text></svg>';
    return '<div class="rdthbox"><p class="kicker">' + esc(t('rd.th.k')) + '</p><figure class="rdthfig">' + s + '<figcaption class="small muted">' + esc(t('rd.th.legend')) + '</figcaption></figure>' +
      '<p class="small">' + esc(t('rd.th.say', { t3: th[3].toFixed(2), t5: th[5].toFixed(2), c: Math.round(c * 100) })) + '</p>' +
      '<p class="small">' + esc(t('rd.th.quantum')) + ' ' + R.QUANTUM.map(q => mark({ f: 'figures', fact: q.fact })).join(' ') + '</p></div>';
  }
  /* a run of a thousand chips, a few at a time on the clock, so the copies and votes can be seen at work */
  function runLoop(now) {
    const run = view.rdRun; if (!run || !el.isConnected) return;
    const dt = Math.min(0.25, (now - (run.t || now)) / 1000); run.t = now;
    const n = Math.min(RUNS - run.done, Math.max(1, Math.round(dt * 320)));
    for (let i = 0; i < n; i++) { const tr = R.trial(plan(), run.rnd); run.done++; if (!tr.ok) run.bad++; if (tr.blocks.some(b => b.copies.length > 1 && b.copies.some(c => !c) && b.ok)) run.saved++; run.last = tr; }
    draw(); if (run.done < RUNS) requestAnimationFrame(runLoop);
  }
  function bench() {
    const r = R.evaluate(plan()), run = view.rdRun;
    let h = head() + '<p class="small rdintro">' + esc(t('rd.intro')) + '</p>' + goalbox(r) + figure(r, run && run.last);
    h += '<div class="rdrun"><button type="button" class="btn primary" data-rd-run>' + esc(t(run && run.done < RUNS ? 'rd.running' : 'rd.run', { n: RUNS.toLocaleString('en') })) + '</button>' +
      (run ? '<span class="small"><b class="mono">' + run.done + '</b> ' + esc(t('rd.r.done')) + ' · <b class="mono bad">' + run.bad + '</b> ' + esc(t('rd.r.bad')) + ' · <b class="mono good">' + run.saved + '</b> ' + esc(t('rd.r.saved')) + '</span>' : '<span class="small muted">' + esc(t('rd.r.none')) + '</span>') + '</div>';
    h += picker(r) + thresholdHtml();
    const worse = r.rows.find(x => x.worse), msg = r.met ? 'met' : worse ? 'worse' : r.area > R.GOAL.area ? 'big' : r.beats ? 'close' : r.rows.every(x => x.n === 1) ? 'bare' : 'more';
    h += '<p class="small rdmsg ' + (r.met ? 'good' : msg === 'worse' || msg === 'big' ? 'bad' : '') + '">' + esc(t('rd.msg.' + msg, { b: worse ? t('rd.b.' + worse.id) : '' })) + '</p>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('rd.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('rd.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('rd.note')) + '</p>' + doneNote() + reward();
  }
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s);
      const b = q('[data-rd]'); if (b) { const [id, n] = b.dataset.rd.split(':'); plan()[id] = +n; return after(); }
      if (q('[data-rd-run]')) { view.rdRun = { done: 0, bad: 0, saved: 0, rnd: R.rng(7 + (view.rdTried || 0)), t: 0 }; draw(); requestAnimationFrame(runLoop); return true; }
      return false; },
    input() { return false; }
  };
}
