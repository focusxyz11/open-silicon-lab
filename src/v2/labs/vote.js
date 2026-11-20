/* Six flaky parts, one reliable chip (kind 'redund', at the gate), from src/engines/redundancy.js: the core question
   "Whole beats parts". Each block of a small chip can be built once, three times or five times with a voter that
   takes the majority; the picture draws every copy and its voter, and a run of a thousand chips shows the copies that
   failed, the votes that held and the chips that failed anyway. The goal is the engine's own check (evaluate().met).
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as R from '../../engines/redundancy.js';

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
    h += picker(r);
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
