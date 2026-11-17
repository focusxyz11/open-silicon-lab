/* Evolve a circuit (kind 'evolve', at the studio's gates), from src/engines/evolve.js; the circuit it has now is drawn by the studio above (S.evolve.code, src/v2/app.js syncDesign).
   A lab of the challenge player (src/v2/play.js): lab(L) gets the player's pieces and returns { draw, click, input };
   draw gives the card's HTML, click and input say whether they handled the event. */
import * as EV from '../../engines/evolve.js';

export default function lab(L) {
  const { S, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L, view = L.view;
  /* ---- Evolve a circuit (src/engines/evolve.js): pick a job, the gates allowed and the room, and let evolution run;
     the circuit it has now is shared with the studio's drawings above (S.evolve.code, src/v2/app.js syncDesign) ---- */
  const evOf = () => { const o = S.evolve || {}; return (S.evolve = { job: EV.jobOf(o.job) ? o.job : 'vote', gates: EV.GATE_SETS[o.gates] ? o.gates : 'all', room: Number.isInteger(o.room) ? Math.max(EV.ROOM.min, Math.min(EV.ROOM.max, o.room)) : EV.ROOM.default, seed: Number.isInteger(o.seed) && o.seed > 0 ? o.seed : 1, code: typeof o.code === 'string' ? o.code : '' }); };
  const evFresh = () => { const E = evOf(); view.ev = EV.start(E.job, { seed: E.seed, gates: E.gates, room: E.room }); view.evR = EV.step(view.ev, 0); E.code = ''; };
  const evLoop = () => { if (!view.evRun || !el.isConnected) { view.evRun = false; return; }
    /* as many generations as fit in a slice of each frame, so a slow screen does not slow the search */
    const t0 = performance.now(); let R = EV.step(view.ev, 40); while (performance.now() - t0 < 12 && !(R.solved && R.gen - R.solvedAt > 3000) && R.gen < 20000) R = EV.step(view.ev, 40);
    view.evR = R; const E = evOf();
    if (R.solved) E.code = R.code.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    if (R.challenges.beat && !S.done[ch.id]) win();
    const quiet = R.solved && R.gen - R.solvedAt > 3000;
    if (quiet || R.gen >= 20000) view.evRun = false;
    ctx.save(); draw(); fx(); if (view.evRun) requestAnimationFrame(evLoop); };
  function evolve() {
    const E = evOf(); if (!view.ev) evFresh();
    const R = view.evR, J = EV.jobOf(E.job), code = R.code.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    let h = head() + '<p class="kicker">' + esc(t('evolve.ui.job')) + '</p><div class="chips tdby">' + EV.JOBS.map(j => '<button type="button" class="chipb' + (E.job === j.id ? ' on' : '') + '" data-ev-job="' + j.id + '" aria-pressed="' + (E.job === j.id) + '">' + esc(t('evolve.job.' + j.id)) + '</button>').join('') + '</div>';
    h += '<p class="kicker">' + esc(t('evolve.ui.gates')) + '</p><div class="chips tdby">' + Object.keys(EV.GATE_SETS).map(g => '<button type="button" class="chipb' + (E.gates === g ? ' on' : '') + '" data-ev-gates="' + g + '" aria-pressed="' + (E.gates === g) + '">' + esc(t('evolve.gates.' + g)) + '</button>').join('') + '</div>';
    h += '<label class="lab" for="ev-room"><b>' + esc(t('evolve.ui.room')) + '</b> <output>' + E.room + '</output></label><input type="range" id="ev-room" data-ev-room min="' + EV.ROOM.min + '" max="' + EV.ROOM.max + '" step="1" value="' + E.room + '">';
    h += '<div class="chips"><button type="button" class="btn primary" data-ev-go>' + esc(t(view.evRun ? 'evolve.ui.stop' : 'evolve.ui.go')) + '</button><button type="button" class="chipb" data-ev-new>' + esc(t('evolve.ui.again')) + '</button></div>';
    const f = R.correct / R.total, beat = R.solved && R.cells != null && R.cells < R.human;
    h += '<div class="evread"><span><span class="small muted">' + esc(t('evolve.ui.gen')) + '</span><b class="mono">' + R.gen + '</b></span><span><span class="small muted">' + esc(t('evolve.ui.right')) + '</span><b class="mono">' + esc(t('evolve.ui.ofV', { a: R.correct, b: R.total })) + '</b></span><span><span class="small muted">' + esc(t('evolve.ui.used')) + '</span><b class="mono">' + R.gates + '</b></span><span><span class="small muted">' + esc(t('evolve.ui.cells')) + '</span><b class="mono ' + (beat ? 'good' : '') + '">' + (R.cells == null ? '—' : R.cells) + '</b></span></div>' +
      '<div class="agbar evbar"><span style="width:' + (f * 100).toFixed(1) + '%"></span></div><p class="small muted">' + esc(t('evolve.ui.human', { n: J.human })) + '</p>';
    h += '<p class="kicker">' + esc(t('evolve.ui.firstK')) + '</p><pre class="agcode mono">' + esc(code) + '</pre>';
    h += '<p class="small ' + (R.solved ? (beat ? 'good' : 'hint') : 'muted') + '">' + esc(R.gen === 0 ? t('evolve.ui.start') : R.solved ? t('evolve.ui.solved', { n: R.solvedAt }) + ' ' + t(beat ? 'evolve.ui.beaten' : 'evolve.ui.notBeaten') : t('evolve.ui.start')) + '</p>';
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('evolve.ch.beat.done')) + '</p><p class="small">' + esc(t('evolve.ui.nand')) + (R.challenges.nand ? ' ' + esc(t('evolve.ch.nand.done')) : '') + '</p>';
    return h + '<p class="small muted">' + esc(t('evolve.ui.note')) + '</p>' + doneNote() + reward();
  }
  return {
    draw: evolve,
    click(e) { const q = s => e.target.closest(s);
    const evj = q('[data-ev-job]'); if (evj) { evOf().job = evj.dataset.evJob; view.evRun = false; evFresh(); ctx.save(); return ((draw()), true); }
    const evg = q('[data-ev-gates]'); if (evg) { evOf().gates = evg.dataset.evGates; view.evRun = false; evFresh(); ctx.save(); return ((draw()), true); }
    if (q('[data-ev-new]')) { evOf().seed += 1; view.evRun = false; evFresh(); ctx.save(); return ((draw()), true); }
    if (q('[data-ev-go]')) { view.evRun = !view.evRun; draw(); if (view.evRun) requestAnimationFrame(evLoop); return true; }
      return false; },
    input(e) {
    if (e.target.closest('[data-ev-room]')) { evOf().room = +e.target.value; view.evRun = false; evFresh(); ctx.save(); return ((draw()), true); }
      return false; }
  };
}
