/* Design it, or search for it? (kind 'search', at the studio's gates), from src/engines/search.js: the core question
   "Compute beats cleverness". A person's design (the studio's working example) is the flat line to beat; a blind
   search, given more and more circuits to try, finds smaller and smaller circuits that work, and the picture marks
   where it passes the person. A wider circuit moves the crossing to the right. Then the checker tries only half the
   inputs: the search "wins" on those and is wrong on the rest. Two goals, met in order; won when both are.
   The search runs in slices of real time (a slow screen does not slow it), only as far as the budget asks.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as SR from '../../engines/search.js';

const SLICE = 14;   /* milliseconds of search per slice */

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const st = () => view.srch || (view.srch = { job: 'vote', checker: 'all', b: 2, seed: 1, runs: {}, met: { beat: false, fooled: false }, busy: false });
  const budget = s => SR.BUDGETS[s.b];
  const keyOf = s => s.job + ':' + s.checker + ':' + s.seed;
  const runOf = s => s.runs[keyOf(s)] || (s.runs[keyOf(s)] = SR.start(s.job, { seed: s.seed, checker: s.checker }));
  const num = v => Number(v).toLocaleString('en-GB');
  const short = v => { const r = Number(Number(v).toPrecision(2)); return r >= 1e6 ? (r / 1e6) + 'M' : r >= 1e3 ? (r / 1e3) + 'k' : String(r); };

  /* advance the search toward the budget in slices, drawing as it goes; the goals are checked when it gets there */
  function tick() {
    const s = st(); if (!el.isConnected) { s.busy = false; return; }
    const R = runOf(s), B = budget(s), t0 = performance.now();
    while (R.tried < B && performance.now() - t0 < SLICE) SR.advance(R, Math.min(B, R.tried + 400));
    if (R.tried + SR.POP > B) { s.busy = false; settle(); }
    draw();
    if (s.busy) setTimeout(tick, 0);
  }
  function go() { const s = st(), R = runOf(s); if (R.tried + SR.POP > budget(s)) { settle(); draw(); fx(); return; } if (!s.busy) { s.busy = true; setTimeout(tick, 0); } draw(); }
  function settle() {
    const s = st(), c = SR.check(runOf(s), budget(s));
    if (c.beat) s.met.beat = true;
    if (c.fooled && s.met.beat) s.met.fooled = true;
    if (s.met.beat && s.met.fooled) win();
  }

  /* the instrument: the smallest working circuit found against circuits tried (log), the person's design flat, the
   budget, the crossing; under it, every input of the table, tested or not, right or wrong */
  function figure(s, R, r) {
    const J = SR.jobOf(s.job), W = 300, H = 222, x0 = 30, x1 = 292, y0 = 14, y1 = 142, B = budget(s);
    /* the scale of cells: the person's design with room above it, and the search's first finds when they are larger */
    const top = Math.max(J.hand * 1.3, ...SR.curve(R).filter(p => p.tried <= B).map(p => p.cells * 1.05)), ymax = Math.ceil(top / 4) * 4, lx = v => x0 + (Math.log10(Math.max(100, v)) - 2) / 4 * (x1 - x0), ly = v => y1 - v / ymax * (y1 - y0);
    const some = s.checker === 'some';
    let h = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('srch.aria', { hand: J.hand, best: r.cells == null ? '—' : r.cells })) + '">';
    /* axes: cells up, circuits tried along, a decade per tick */
    for (let k = 0; k <= ymax; k += Math.max(2, ymax / 4)) h += '<line class="srgrid" x1="' + x0 + '" x2="' + x1 + '" y1="' + ly(k).toFixed(1) + '" y2="' + ly(k).toFixed(1) + '"/><text class="ax" x="' + (x0 - 4) + '" y="' + (ly(k) + 3).toFixed(1) + '" text-anchor="end">' + k + '</text>';
    for (let d = 2; d <= 6; d++) h += '<text class="ax" x="' + lx(10 ** d).toFixed(1) + '" y="' + (y1 + 11) + '" text-anchor="middle">' + short(10 ** d) + '</text>';
    h += '<text class="ax" x="' + x0 + '" y="8">' + esc(t('srch.fig.cells')) + '</text><text class="ax" x="' + x1 + '" y="' + (y1 + 22) + '" text-anchor="end">' + esc(t('srch.fig.tried')) + '</text>';
    /* what has not been spent yet, beyond the budget, is shaded */
    h += '<rect class="srbeyond" x="' + lx(B).toFixed(1) + '" y="' + y0 + '" width="' + Math.max(0, x1 - lx(B)).toFixed(1) + '" height="' + (y1 - y0) + '"/>';
    /* the person's design: a flat line */
    h += '<line class="srhand" x1="' + x0 + '" x2="' + x1 + '" y1="' + ly(J.hand).toFixed(1) + '" y2="' + ly(J.hand).toFixed(1) + '"/><text class="srhandt" x="' + (x0 + 4) + '" y="' + (ly(J.hand) - 4).toFixed(1) + '">' + esc(t('srch.fig.hand', { n: J.hand })) + '</text>';
    /* the search: steps down, from the first circuit that passed the checker to what has been run */
    const pts = SR.curve(R).filter(p => p.tried <= B);
    if (pts.length) {
      const end = Math.min(B, R.tried);
      let d = 'M' + lx(pts[0].tried).toFixed(1) + ' ' + ly(pts[0].cells).toFixed(1);
      for (let i = 1; i < pts.length; i++) d += 'H' + lx(pts[i].tried).toFixed(1) + 'V' + ly(pts[i].cells).toFixed(1);
      d += 'H' + lx(end).toFixed(1);
      h += '<path class="srcurve' + (some ? ' some' : '') + '" d="' + d + '"/>';
      pts.forEach(p => { h += '<circle class="srdot' + (some ? ' some' : '') + '" cx="' + lx(p.tried).toFixed(1) + '" cy="' + ly(p.cells).toFixed(1) + '" r="2.2"/>'; });
    } else h += '<text class="srnone" x="' + ((x0 + x1) / 2).toFixed(1) + '" y="' + (ly(J.hand) + 22).toFixed(1) + '" text-anchor="middle">' + esc(t(R.tried < B ? 'srch.fig.running' : 'srch.fig.none')) + '</text>';
    /* where the search passed the person */
    const cx = SR.crossing(R);
    if (cx != null && cx <= B) { const p = pts.find(q => q.tried === cx) || pts.find(q => q.tried >= cx); if (p) { const X = lx(cx), Y = ly(p.cells), right = X > 150;
      h += '<circle class="srcross' + (some ? ' some' : '') + '" cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="5.5"/><text class="srcrosst" x="' + (X + (right ? -9 : 9)).toFixed(1) + '" y="' + (Y + 4).toFixed(1) + '" text-anchor="' + (right ? 'end' : 'start') + '">' + esc(t(some ? 'srch.fig.crossSome' : 'srch.fig.cross', { n: short(cx) })) + '</text>'; } }
    /* the budget */
    h += '<line class="srbudget" x1="' + lx(B).toFixed(1) + '" x2="' + lx(B).toFixed(1) + '" y1="' + (y0 - 2) + '" y2="' + y1 + '"/>';
    /* every input of the table: right or wrong for the best within the budget, and whether the checker tried it */
    const N = J.patterns, cw = 22, gx = (W - N * cw) / 2 + 30, gy = 192;
    h += '<text class="ax" x="' + (gx - 8) + '" y="' + (gy + 12) + '" text-anchor="end">' + esc(t('srch.fig.inputs')) + '</text>';
    for (let i = 0; i < N; i++) { const p = r.pats ? r.pats[i] : null, tested = s.checker === 'all' || i < N / 2;
      h += '<rect class="srpat' + (p ? (p.ok ? ' ok' : ' bad') : '') + (tested ? '' : ' untested') + '" x="' + (gx + i * cw) + '" y="' + gy + '" width="' + (cw - 4) + '" height="18" rx="3"/>' +
        (p ? '<text class="srpatm" x="' + (gx + i * cw + (cw - 4) / 2) + '" y="' + (gy + 13) + '" text-anchor="middle">' + (p.ok ? '✓' : '✗') + '</text>' : ''); }
    if (some) h += '<line class="srsplit" x1="' + (gx + N / 2 * cw - 2) + '" x2="' + (gx + N / 2 * cw - 2) + '" y1="' + (gy - 6) + '" y2="' + (gy + 24) + '"/><text class="ax" x="' + (gx + N / 4 * cw - 2) + '" y="' + (gy - 9) + '" text-anchor="middle">' + esc(t('srch.fig.tested')) + '</text><text class="ax" x="' + (gx + 3 * N / 4 * cw - 2) + '" y="' + (gy - 9) + '" text-anchor="middle">' + esc(t('srch.fig.untested')) + '</text>';
    return '<figure class="srfig" data-f2="instrument">' + h + '</svg><figcaption class="small muted">' + esc(t('srch.legend')) + '</figcaption></figure>';
  }
  function goalbox(s, r) {
    const J = SR.jobOf(s.job), M = s.met, ok = M.beat && M.fooled;
    const gs = [
      { k: 'beat', ok: M.beat, v: M.beat ? t('srch.g.done') : s.checker === 'all' && r.cells != null ? t('srch.v.cells', { a: r.cells, b: J.hand }) : '—', f: M.beat ? 1 : s.checker === 'all' && r.cells != null ? Math.min(1, J.hand / r.cells) : 0 },
      { k: 'fooled', ok: M.fooled, v: M.fooled ? t('srch.g.done') : s.checker === 'some' && r.pats ? t('srch.v.right', { a: r.right, b: r.patterns }) : '—', f: M.fooled ? 1 : M.beat ? 0.5 : 0 }];
    return '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('srch.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + '</span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  /* one line of what happened */
  function line(s, R, r) {
    const J = SR.jobOf(s.job), B = budget(s);
    if (R.tried + SR.POP <= B) return '<p class="small muted srmsg">' + esc(t('srch.msg.running', { n: num(R.tried), b: num(B) })) + '</p>';
    if (!r.passes) return '<p class="small srmsg">' + esc(t('srch.msg.none', { b: num(B) })) + '</p>';
    const k = s.checker === 'some' ? (r.fooled ? (r.beats ? 'fooled' : 'wrong') : 'lucky') : r.beats ? 'beat' : r.cells === J.hand ? 'tie' : 'bigger';
    return '<p class="small srmsg ' + (k === 'beat' ? 'good' : k === 'fooled' ? 'bad' : '') + '">' + esc(t('srch.msg.' + k, { b: num(B), c: r.cells, h: J.hand, r: r.right, n: r.patterns })) + '</p>';
  }
  function bench() {
    const s = st(), R = runOf(s), B = budget(s), r = SR.at(R, B);
    /* the search starts as soon as the lab opens, and goes on whenever the budget is raised */
    if (!s.busy && R.tried + SR.POP <= B) { s.busy = true; setTimeout(tick, 0); }
    let h = head() + '<p class="small srintro">' + esc(t('srch.intro')) + '</p>' + goalbox(s, r) + figure(s, R, r);
    h += '<p class="kicker">' + esc(t('srch.ui.job')) + '</p><div class="chips srjobs">' + SR.JOBS.map(j => '<button type="button" class="chipb" data-sr-job="' + j.id + '" aria-pressed="' + (s.job === j.id) + '">' + esc(t('srch.job.' + j.id)) + ' <span class="muted">' + esc(t('srch.outs', { n: j.outs.length })) + '</span></button>').join('') + '</div>';
    h += '<p class="kicker">' + esc(t('srch.ui.checker')) + '</p><div class="chips" data-sr-next="' + (s.met.beat ? 'fooled' : 'beat') + '">' + SR.CHECKERS.map(c => '<button type="button" class="chipb" data-sr-check="' + c + '" aria-pressed="' + (s.checker === c) + '">' + esc(t('srch.check.' + c)) + '</button>').join('') + '</div>';
    h += '<label class="lab" for="sr-budget"><b>' + esc(t('srch.ui.budget')) + '</b> <output>' + esc(t('srch.ui.tried', { n: num(B) })) + '</output></label><input type="range" id="sr-budget" data-sr-budget min="0" max="' + (SR.BUDGETS.length - 1) + '" step="1" value="' + s.b + '">';
    h += '<div class="chips"><button type="button" class="chipb" data-sr-again>' + esc(t('srch.ui.again')) + '</button><span class="small muted">' + esc(t('srch.ui.run', { n: s.seed })) + '</span></div>';
    h += line(s, R, r);
    if (r.code) h += '<details class="srcode"><summary class="small">' + esc(t('srch.ui.code')) + '</summary><pre class="agcode mono">' + esc(r.code) + '</pre></details>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t(s.met.beat ? 'srch.hint.fooled' : 'srch.hint.beat')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('srch.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('srch.note')) + '</p>' + doneNote() + reward();
  }
  return {
    draw: bench,
    click(e) { const q = sel => e.target.closest(sel), s = st();
      const j = q('[data-sr-job]'); if (j) { s.job = j.dataset.srJob; go(); return true; }
      const c = q('[data-sr-check]'); if (c) { s.checker = c.dataset.srCheck; go(); return true; }
      if (q('[data-sr-again]')) { s.seed += 1; go(); return true; }
      return false; },
    input(e) { const b = e.target.closest('[data-sr-budget]'); if (!b) return false; st().b = Math.max(0, Math.min(SR.BUDGETS.length - 1, +b.value | 0)); go(); return true; }
  };
}
