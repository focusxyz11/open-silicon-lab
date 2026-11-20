/* Learn on one chip, copy to a thousand (kind 'mortal', at the block), from src/engines/mortal.js: the core question
   "Brain or copy". The network's layers are kept as bits or as analog cells; it learns in software or on the chip
   itself; each copy may relearn a little on its own chip. The picture draws the layers, the first chip and a fleet
   of its copies, each coloured by how often it answers right, and the energy of one answer against all-digital. The
   goal is the engine's own check (evaluate().met). A lab of the challenge player (src/v2/play.js). */
import * as M from '../../engines/mortal.js';

const FLEET = 60, LAYERS = 10;

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.mo || (view.mo = M.start());
  const after = () => { if (M.evaluate(set()).met) win(); draw(); fx(); return true; };
  const tone = a => (a >= M.GOAL.copied ? 'ok' : a >= 85 ? 'mid' : 'bad');

  function figure(o, r) {
    const W = 300, H = 214, nA = Math.round(o.share * LAYERS), F = M.fleet(o, FLEET, M.rng(11));
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('mo.aria', { own: r.own, copied: r.copied })) + '">';
    /* the network, layer by layer: bits (a grid) or analog cells (a wave) */
    s += '<text class="ax" x="2" y="10">' + esc(t('mo.fig.net')) + '</text>';
    for (let i = 0; i < LAYERS; i++) {
      const x = 6 + i * 29, an = i < nA;
      s += '<rect class="mol ' + (an ? 'an' : 'dg') + '" x="' + x + '" y="16" width="25" height="26" rx="4"/>';
      s += an ? '<path class="mowave" d="M' + (x + 3) + ' 29q3.5-7 7 0t7 0t7 0"/>' : '<path class="mogrid" d="M' + (x + 8) + ' 19v20M' + (x + 16.5) + ' 19v20M' + (x + 3) + ' 25.5h19M' + (x + 3) + ' 32.5h19"/>';
    }
    /* the first chip, where it learned, and its copies */
    s += '<text class="ax" x="2" y="62">' + esc(t(o.learn === 'chip' ? 'mo.fig.first.chip' : 'mo.fig.first.sw')) + '</text>';
    s += '<rect class="mochip ' + tone(r.own) + '" x="6" y="70" width="64" height="64" rx="8"/><text class="monum" x="38" y="107" text-anchor="middle">' + esc(t('mo.pc', { v: r.own })) + '</text>';
    s += '<path class="moarrow" d="M76 102h16m-5-5l5 5l-5 5"/><text class="ax" x="' + (W - 2) + '" y="62" text-anchor="end">' + esc(t('mo.fig.copies', { n: '1,000' })) + '</text>';
    F.forEach((a, i) => { const c = i % 12, rw = Math.floor(i / 12); s += '<rect class="mocopy ' + tone(a) + '" x="' + (98 + c * 16.5) + '" y="' + (70 + rw * 13.2) + '" width="13" height="10" rx="2"/>'; });
    /* one answer's energy, against all-digital */
    const bw = 190;
    s += '<text class="ax" x="2" y="160">' + esc(t('mo.fig.energy')) + '</text>';
    s += '<text class="ax" x="2" y="179">' + esc(t('mo.e.digital')) + '</text><rect class="mobar dg" x="98" y="171" width="' + bw + '" height="10" rx="3"/>';
    s += '<text class="ax" x="2" y="200">' + esc(t('mo.e.this')) + '</text><rect class="mobar ' + (r.energy <= M.GOAL.energy ? 'ok' : 'an') + '" x="98" y="192" width="' + Math.max(2, bw * r.energy).toFixed(1) + '" height="10" rx="3"/>' +
      '<line class="mogoal" x1="' + (98 + bw * M.GOAL.energy).toFixed(1) + '" x2="' + (98 + bw * M.GOAL.energy).toFixed(1) + '" y1="166" y2="206"/>';
    return '<figure class="mofig" data-f2="instrument">' + s + '</svg><figcaption class="small muted">' + esc(t('mo.legend')) + '</figcaption></figure>';
  }
  function goalbox(r) {
    const G = M.GOAL, gs = [
      { k: 'energy', ok: r.energy <= G.energy + 1e-9, v: t('mo.x', { v: Math.round(r.energy * 100) }), target: t('mo.t.energy', { v: Math.round(G.energy * 100) }), f: Math.min(1, G.energy / r.energy) },
      { k: 'own', ok: r.own >= G.own, v: t('mo.pc', { v: r.own }), target: t('mo.t.at', { v: G.own }), f: Math.min(1, Math.max(0, (r.own - 50) / (G.own - 50))) },
      { k: 'copied', ok: r.copied >= G.copied, v: t('mo.pc', { v: r.copied }), target: t('mo.t.at', { v: G.copied }), f: Math.min(1, Math.max(0, (r.copied - 50) / (G.copied - 50))) }];
    return '<div class="goalbox' + (r.met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(r.met ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('mo.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  function bench() {
    const o = set(), r = M.evaluate(o);
    let h = head() + '<p class="small mointro">' + esc(t('mo.intro')) + '</p>' + goalbox(r) + figure(o, r);
    h += '<label class="lab" for="mo-share"><b>' + esc(t('mo.set.share')) + '</b> <output>' + esc(t('mo.v.share', { v: Math.round(o.share * 100) })) + '</output></label><input type="range" id="mo-share" data-mo-share min="0" max="10" step="1" value="' + Math.round(o.share * 10) + '">';
    h += '<p class="lab"><b>' + esc(t('mo.set.learn')) + '</b></p><div class="chips">' + ['software', 'chip'].map(k => '<button type="button" class="chipb" data-mo-learn="' + k + '" aria-pressed="' + (o.learn === k) + '">' + esc(t('mo.learn.' + k)) + '</button>').join('') + '</div>';
    h += '<div class="chips"><button type="button" class="chipb" data-mo-cal aria-pressed="' + o.calibrate + '">' + esc(t('mo.cal')) + '</button>' + (o.calibrate ? '<span class="small muted">' + esc(t('mo.minutes', { v: r.minutes })) + '</span>' : '') + '</div>';
    const msg = r.met ? 'met' : o.share === 0 ? 'digital' : r.energy > M.GOAL.energy ? 'costly' : o.learn === 'chip' && !o.calibrate ? 'brain' : r.own < M.GOAL.own ? 'blind' : 'more';
    h += '<p class="small momsg ' + (r.met ? 'good' : msg === 'brain' || msg === 'blind' ? 'bad' : '') + '">' + esc(t('mo.msg.' + msg)) + '</p>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('mo.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('mo.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('mo.note')) + '</p>' + doneNote() + reward();
  }
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), o = set();
      const l = q('[data-mo-learn]'); if (l) { o.learn = l.dataset.moLearn; return after(); }
      if (q('[data-mo-cal]')) { o.calibrate = !o.calibrate; return after(); }
      return false; },
    input(e) { const r = e.target.closest('[data-mo-share]'); if (!r) return false; set().share = M.SHARES[+r.value]; return after(); }
  };
}
