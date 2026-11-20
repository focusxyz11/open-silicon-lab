/* Grow a crystal (kind 'pull', at the quarry's crystal step), from src/engines/crystal.js.
   A lab of the challenge player (src/v2/play.js): lab(L) gets the player's pieces and returns { draw, click, input };
   draw gives the card's HTML, click and input say whether they handled the event. */
import * as CZ from '../../engines/crystal.js';

export default function lab(L) {
  const { S, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L, view = L.view;
  /* ---- Grow a crystal (src/engines/crystal.js, the Czochralski puller): dip a seed in molten silicon and pull it up
     turning; set the pull speed and the melt's heat, and keep the crystal on its way: a thin neck, a wide shoulder, a
     body held at 300 mm, a tail tapered before it is lifted off. Time runs faster in the slow phases. ---- */
  const czSet = () => { const o = view.cz || (view.cz = { pull: CZ.PULL_DEFAULTS.pull, temp: CZ.PULL_DEFAULTS.temp, rot: CZ.PULL_DEFAULTS.rot, auto: false }); return o; };
  const czLoop = now => { if (!view.czRun || !el.isConnected) { view.czRun = false; return; }
    /* time follows the clock, so a slow device grows the same crystal in the same time, in bigger steps */
    const dtS = Math.min(0.5, (now - (view.czT || now)) / 1000); view.czT = now;
    const st = view.czS, ph = st.phase || 'dip', min = CZ.PULL_TIMESCALE[ph] * dtS * (view.czFast ? 8 : 1);
    view.czS = CZ.pullStep(st, min, czSet()); view.czSeen.push(view.czS);
    if (CZ.pullMet(view.czSeen)) win();
    if (view.czS.done) view.czRun = false;
    draw(); fx(); if (view.czRun) requestAnimationFrame(czLoop); };
  function czSvg(st) {
    /* the ingot so far, side on: its length down the page, its diameter across, the band that becomes wafers */
    const W = 300, H = 230, cx = W / 2, top = 10, len = Math.max(600, st.L + 60), k = (H - 60) / len, sx = 0.32;
    const pts = st.hist.concat([[st.L, st.D]]), side = sgn => pts.map(([L, D]) => (cx + sgn * D / 2 * sx).toFixed(1) + ',' + (top + L * k).toFixed(1)).join(' ');
    const meltY = top + st.L * k + 6, meltH = Math.max(4, 40 * st.melt / CZ.PULL.melt);
    return '<figure class="czfig"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('cz.aria', { d: Math.round(st.D), l: Math.round(st.L) })) + '">' +
      '<line class="band" x1="' + (cx - 150 * sx) + '" x2="' + (cx - 150 * sx) + '" y1="' + top + '" y2="' + (H - 10) + '"/><line class="band" x1="' + (cx + 150 * sx) + '" x2="' + (cx + 150 * sx) + '" y1="' + top + '" y2="' + (H - 10) + '"/>' +
      '<polygon class="ingot" points="' + side(-1) + ' ' + side(1).split(' ').reverse().join(' ') + '"/>' +
      '<rect class="melt" x="' + (cx - 80) + '" y="' + meltY.toFixed(1) + '" width="160" height="' + meltH.toFixed(1) + '" rx="6"/>' +
      '<path class="crucible" d="M' + (cx - 86) + ' ' + (meltY - 4).toFixed(1) + 'v' + (meltH + 8).toFixed(1) + 'q0 6 6 6h148q6 0 6-6v-' + (meltH + 8).toFixed(1) + '"/>' +
      '<text class="ax" x="' + (cx + 150 * sx + 4) + '" y="' + (top + 10) + '">' + esc(t('cz.band')) + '</text></svg></figure>';
  }
  function puller() {
    const set = czSet(); if (!view.czS) { view.czS = CZ.pullStart(); view.czSeen = [view.czS]; }
    const st = view.czS, ph = st.phase || 'dip';
    let h = head() + '<ol class="czph">' + CZ.PULL_PHASES.map(p => '<li class="' + (p === ph ? 'on' : CZ.PULL_PHASES.indexOf(p) < CZ.PULL_PHASES.indexOf(ph) ? 'past' : '') + '">' + esc(t('cz.phase.' + p)) + '</li>').join('') + '</ol>';
    h += '<div class="betview" data-f2="instrument">' + czSvg(st) + '<div class="czread">' +
      [['d', t('cz.mm', { v: st.D < 20 ? st.D.toFixed(1) : Math.round(st.D) })], ['l', t('cz.mm', { v: Math.round(st.L) })], ['melt', t('cz.kg', { v: Math.round(st.melt) })], ['wafers', String(st.wafers || 0)]].map(([k2, v]) => '<span><span class="small muted">' + esc(t('cz.r.' + k2)) + '</span><b class="mono">' + esc(v) + '</b></span>').join('') +
      '<span class="wide"><span class="small muted">' + esc(t('cz.r.target')) + '</span><b class="mono">' + esc(t('cz.mm', { v: Math.round(st.target || CZ.pullTarget(set.pull, set.temp)) })) + '</b></span>' +
      '<span class="wide ' + (st.dislocations === 'none' ? 'good' : 'bad') + '"><b class="small">' + esc(t('cz.disl.' + (st.dislocations || 'none'))) + '</b></span></div></div>';
    h += '<p class="small ' + (st.msg === 'done' ? 'good' : st.msg === 'neckfail' || st.msg === 'shock' || st.msg === 'thin' ? 'bad' : '') + '">' + esc(t('cz.msg.' + (st.msg || 'neck'), { wafers: st.wafers || 0 })) + '</p>';
    if (st.rotation && st.rotation !== 'ok') h += '<p class="small hint">' + esc(t('cz.rotation.' + st.rotation)) + '</p>';
    const R = CZ.PULL_RANGE, slider = (k2, step) => '<label class="lab" for="cz-' + k2 + '"><b>' + esc(t('cz.set.' + k2)) + '</b> <output>' + esc(t('cz.v.' + k2, { v: set[k2] })) + '</output></label><input type="range" id="cz-' + k2 + '" data-cz="' + k2 + '" min="' + R[k2][0] + '" max="' + R[k2][1] + '" step="' + step + '" value="' + set[k2] + '"' + (set.auto && k2 !== 'rot' ? ' disabled' : '') + '>';
    h += slider('pull', 0.05) + slider('temp', 0.5) + slider('rot', 1);
    h += '<div class="chips"><button type="button" class="btn primary" data-cz-go' + (st.done ? ' disabled' : '') + '>' + esc(t(view.czRun ? 'cz.pause' : st.L > 0 ? 'cz.resume' : 'cz.start')) + '</button><button type="button" class="chipb" data-cz-fast aria-pressed="' + !!view.czFast + '">' + esc(t('cz.fast')) + '</button><button type="button" class="chipb" data-cz-auto aria-pressed="' + set.auto + '">' + esc(t('cz.auto')) + '</button><button type="button" class="chipb" data-cz-reset>' + esc(t('cz.reset')) + '</button></div>';
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('fab.ch.crystal.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('cz.note')) + '</p>' + doneNote() + reward();
  }
  return {
    draw: puller,
    click(e) { const q = s => e.target.closest(s);
    if (q('[data-cz-go]')) { view.czRun = !view.czRun; view.czT = null; draw(); if (view.czRun) requestAnimationFrame(czLoop); return true; }
    if (q('[data-cz-fast]')) { view.czFast = !view.czFast; return ((draw()), true); }
    if (q('[data-cz-auto]')) { const o = czSet(); o.auto = !o.auto; return ((draw()), true); }
    if (q('[data-cz-reset]')) { view.czRun = false; view.czS = null; return ((draw()), true); }
      return false; },
    input(e) {
    const czr = e.target.closest('[data-cz]'); if (czr) { czSet()[czr.dataset.cz] = +czr.value; if (view.czS) view.czS = CZ.pullStep(view.czS, 0, czSet()); return ((draw()), true); }
      return false; }
  };
}
