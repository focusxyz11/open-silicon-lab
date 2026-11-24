/* A detector made of spikes (kind 'spikes', at the block), from src/engines/paradigms.js: the core question "Fight or
   use physics", and "Copy the brain". A neuron of a spiking chip gathers charge from its inputs, loses a share of it
   every tick (its leak), and fires a spike when the charge reaches its threshold, starting again from zero. Detector A
   has four inputs: the first two add to its charge, the last two take from it. Four patterns come in: its own (A), the
   other one (B), noise on every input, and almost nothing (quiet). Two dials, the threshold and the leak; the goal is
   the engine's own check (checkNeuroSpot): it fires at least 3 times on its pattern, and never on the others.
   First a guess, then the reveal: a clocked circuit works out every input on every tick, whatever comes in; the spiking
   one works only when a spike arrives (spikeWork). How sure each claim about spikes is comes from the matter it models
   (src/data/inventions.js spikes), and one of them, what a spike costs, is a switch on the count.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as P from '../../engines/paradigms.js';
import { matterOf } from '../../data/inventions.js';
import { claimList } from '../fid.js';
import { needWords } from '../../core/i18n.js';

export const START = { th: 0.6, lk: 0.1 };
export const RANGE = { th: [0.4, 2, 0.1], lk: [0, 0.8, 0.05] };
export const TICKS = 40, W = P.SNN_W[0];
/* the guesses: how much of the clocked circuit's work the spiking detector does on quiet input, each a range of shares */
export const GUESSES = [['all', 0.75, 1.01], ['half', 0.25, 0.75], ['tenth', 0.05, 0.25], ['none', 0, 0.05]];
export const guessOf = share => GUESSES.find(([, lo, hi]) => share >= lo && share < hi)[0];
/* the charge the picture draws: detector A tick by tick, before it fires (the engine's lif keeps it after) */
export function trace(trains, { th, lk }) {
  let v = 0; const pre = [], fired = [];
  for (let t = 0; t < trains[0].length; t++) {
    v = v * (1 - lk) + trains.reduce((s, tr, i) => s + tr[t] * W[i], 0); pre.push(v);
    if (v >= th) { fired.push(1); v = 0; } else fired.push(0);
  }
  return { pre, fired };
}
/* what a spike costs against a clocked step, when the guess is counted (inventions.js spikesCost) */
export const spikeCost = () => matterOf('spikes').claims.find(c => c.id === 'spikesCost').energy;
/* where the dials stand: the goal's two numbers, and what to say */
export function verdict(o) {
  const g = P.neuroGoal(o.th, o.lk), met = P.checkNeuroSpot({ threshold: o.th, leak: o.lk });
  return { a: g.a, others: g.others, met, say: met ? 'met' : g.a < 3 && g.others ? 'both' : g.a < 3 ? 'deaf' : 'eager' };
}

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.spk || (view.spk = Object.assign({ pat: 'A', guess: null, cost: false }, START));
  const pct = v => t('spk.pct', { v: v < 0.1 ? (v * 100).toFixed(1) : Math.round(v * 100) });
  const f2 = v => v.toFixed(2);
  /* the claims are in the pages' words (invent.*): drawn once they are here */
  if (!view.spkWords) { view.spkWords = 1; needWords('pages').then(() => { view.spkWords = 2; if (el.isConnected) draw(); }); }

  function figure(o, work) {
    const trains = P.spikeTrains(o.pat), T = trace(trains, o), Wd = 380, H = 232, x0 = 70, xr = 372, dx = (xr - x0) / TICKS, xt = t => x0 + (t + 0.5) * dx;
    const lo = -1, hi = 2.4, y0 = 172, h = 76, yv = v => (y0 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * h).toFixed(1), shown = o.guess != null;
    const w = work.find(x => x.p === o.pat), wanted = o.pat === 'A';
    let s = '<svg viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(t('spk.aria', { pat: t('spk.pat.' + o.pat), n: w.fired })) + '">';
    /* the four inputs: a tick for each spike, blue where it adds to the charge, orange where it takes; once you have
       guessed, a faint dot for every input on every tick: the work a clocked circuit does */
    trains.forEach((tr, i) => {
      const y = 14 + i * 17, add = W[i] > 0;
      s += '<text class="ax" x="4" y="' + (y + 3) + '">' + esc(t('spk.fig.in', { n: i + 1 })) + '</text><text class="ax mono" x="' + (x0 - 6) + '" y="' + (y + 3) + '" text-anchor="end">' + (add ? '+' : '−') + Math.abs(W[i]).toFixed(2) + '</text>' +
        '<line class="track" x1="' + x0 + '" x2="' + xr + '" y1="' + y + '" y2="' + y + '"/>';
      if (shown) for (let k = 0; k < TICKS; k++) s += '<circle class="tick" cx="' + xt(k).toFixed(1) + '" cy="' + y + '" r=".9"/>';
      tr.forEach((b, k) => { if (b) s += '<line class="spike ' + (add ? 'add' : 'take') + '" x1="' + xt(k).toFixed(1) + '" x2="' + xt(k).toFixed(1) + '" y1="' + (y - 6) + '" y2="' + (y + 6) + '"/>'; });
    });
    /* the charge: the zero line, the threshold, and the charge tick by tick, falling to zero where it fires */
    s += '<text class="ax" x="4" y="' + (y0 - h + 8) + '">' + esc(t('spk.fig.charge')) + '</text>' +
      '<line class="zero" x1="' + x0 + '" x2="' + xr + '" y1="' + yv(0) + '" y2="' + yv(0) + '"/>' +
      '<line class="thr" x1="' + x0 + '" x2="' + xr + '" y1="' + yv(o.th) + '" y2="' + yv(o.th) + '"/><text class="ax thrl" x="' + (x0 - 6) + '" y="' + (+yv(o.th) + 3) + '" text-anchor="end">' + esc(t('spk.fig.thr')) + '</text>';
    let d = 'M' + x0 + ' ' + yv(0);
    T.pre.forEach((v, k) => { d += 'L' + xt(k).toFixed(1) + ' ' + yv(v); if (T.fired[k]) d += 'L' + xt(k).toFixed(1) + ' ' + yv(0); });
    s += '<path class="charge" d="' + d + '"/>';
    T.fired.forEach((f, k) => { if (f) s += '<circle class="fire ' + (wanted ? 'good' : 'bad') + '" cx="' + xt(k).toFixed(1) + '" cy="' + yv(T.pre[k]) + '" r="2.6"/>'; });
    /* what it sends: a spike out each time it fires, green on its own pattern, red on any other */
    const yo = 192;
    s += '<text class="ax" x="4" y="' + (yo + 3) + '">' + esc(t('spk.fig.out')) + '</text><line class="track" x1="' + x0 + '" x2="' + xr + '" y1="' + yo + '" y2="' + yo + '"/>';
    T.fired.forEach((f, k) => { if (f) s += '<line class="out ' + (wanted ? 'good' : 'bad') + '" x1="' + xt(k).toFixed(1) + '" x2="' + xt(k).toFixed(1) + '" y1="' + (yo - 7) + '" y2="' + (yo + 7) + '"/>'; });
    s += '<text class="ax" x="' + x0 + '" y="' + (yo + 22) + '">' + esc(t('spk.fig.ticks', { n: TICKS })) + '</text>';
    s += '<text class="ax" x="' + xr + '" y="' + (yo + 22) + '" text-anchor="end">' + esc(t('spk.fig.leak', { v: Math.round(o.lk * 100) })) + '</text>';
    if (shown) s += '<text class="work" x="' + xr + '" y="' + (H - 2) + '" text-anchor="end">' + esc(t('spk.fig.work', { d: w.dense, e: w.events })) + '</text>';
    s += '</svg>';
    /* the four patterns, each with what the detector did on it: tap one to see it */
    const tabs = '<div class="spktabs" role="group" aria-label="' + esc(t('spk.pats')) + '">' + P.SPIKE_PATTERNS.map(p => { const n = work.find(x => x.p === p).fired, ok = p === 'A' ? n >= 3 : n === 0;
      return '<button type="button" class="chipb' + (ok ? ' ok' : ' no') + '" data-spk-pat="' + p + '" aria-pressed="' + (o.pat === p) + '"><b>' + esc(t('spk.pat.' + p)) + '</b><span>' + esc(t('spk.fired', { n })) + '</span></button>'; }).join('') + '</div>';
    return '<figure class="spkfig" data-f2="instrument">' + tabs + s + '<figcaption class="small muted">' + esc(t('spk.legend')) + '</figcaption></figure>';
  }
  function goalbox(V) {
    const gs = [{ k: 'a', ok: V.a >= 3, v: t('spk.n', { n: V.a }), target: t('spk.t.a'), f: Math.min(1, V.a / 3) },
      { k: 'rest', ok: V.others === 0, v: t('spk.n', { n: V.others }), target: t('spk.t.rest'), f: V.others === 0 ? 1 : Math.max(0.08, 1 - V.others / 12) }];
    return '<div class="goalbox' + (V.met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(V.met ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('spk.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  const dial = (id, value) => '<div class="spkdial"><label class="lab" for="spk-' + id + '"><b>' + esc(t('spk.set.' + id)) + '</b> <output>' + esc(value) + '</output></label><div class="spkstep"><button type="button" class="chipb" data-spk-nudge="' + id + ':-1" aria-label="' + esc(t('spk.less')) + '">−</button><input type="range" id="spk-' + id + '" data-spk="' + id + '" min="' + RANGE[id][0] + '" max="' + RANGE[id][1] + '" step="' + RANGE[id][2] + '" value="' + set()[id] + '"><button type="button" class="chipb" data-spk-nudge="' + id + ':1" aria-label="' + esc(t('spk.more')) + '">+</button></div></div>';
  /* the reveal: the work on each pattern, clocked against spiking, and what a spike may cost */
  function work(o, list) {
    const c = o.cost ? spikeCost() : 1, top = Math.max(...list.map(x => Math.max(x.dense, x.events * c))), w = v => (v / top * 100).toFixed(1);
    const quiet = list.find(x => x.p === 'quiet'), right = guessOf(quiet.share);
    let h = '<div class="spken"><p class="kicker">' + esc(t('spk.e.t')) + '</p>';
    h += list.map(x => '<div class="spkrow' + (x.p === o.pat ? ' now' : '') + '"><span class="spkn">' + esc(t('spk.pat.' + x.p)) + '</span><span class="spkbars"><span class="spkbar"><i class="ck" style="width:' + w(x.dense) + '%"></i></span><span class="spkbar"><i class="sp' + (x.events * c > x.dense ? ' over' : '') + '" style="width:' + w(x.events * c) + '%"></i></span></span>' +
      '<span class="spkv mono small">' + x.dense + '<br>' + Math.round(x.events * c) + '</span></div>').join('');
    h += '<p class="small spkkey"><span><i class="ck"></i>' + esc(t('spk.e.clock')) + '</span><span><i class="sp"></i>' + esc(t('spk.e.spike')) + '</span></p>';
    h += '<label class="small spkcost"><input type="checkbox" data-spk-cost' + (o.cost ? ' checked' : '') + '> ' + esc(t('spk.e.cost', { v: spikeCost() })) + '</label>';
    const busy = list.find(x => x.p === 'A'), over = busy.events * c > busy.dense;
    h += '<p class="small ' + (o.guess === right ? 'good' : 'hint') + '">' + esc(t(o.guess === right ? 'spk.guess.right' : 'spk.guess.off', { g: t('spk.guess.' + o.guess), v: pct(quiet.share) })) + '</p>';
    h += '<p class="small muted">' + esc(t(o.cost ? (over ? 'spk.e.over' : 'spk.e.under') : 'spk.e.say', { a: pct(busy.share), q: pct(quiet.share), v: spikeCost() })) + '</p>';
    return h + '</div>';
  }
  function bench() {
    const o = set(), V = verdict(o), list = P.spikeWork({ threshold: o.th, leak: o.lk });
    let h = head() + '<p class="small spkintro">' + esc(t('spk.intro')) + '</p>' + goalbox(V) + figure(o, list);
    if (o.guess == null) {
      /* first, a guess: the act of predicting before you look */
      h += '<div class="spkguess"><p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('spk.predict', { d: TICKS * W.length })) + '</p><div class="chips">' +
        GUESSES.map(([g]) => '<button type="button" class="chipb" data-spk-guess="' + g + '">' + esc(t('spk.guess.' + g)) + '</button>').join('') + '</div></div>';
      return h + '<p class="small muted">' + esc(t('spk.note')) + '</p>' + reward();
    }
    h += dial('th', t('spk.v.th', { v: o.th.toFixed(1) })) + dial('lk', t('spk.v.lk', { v: Math.round(o.lk * 100) }));
    h += '<p class="small spkmsg ' + (V.met ? 'good' : 'bad') + '">' + esc(t('spk.msg.' + V.say, { n: V.others })) + '</p>' + work(o, list);
    if (view.spkWords === 2) h += '<div class="spkclaims"><p class="kicker">' + esc(t('spk.claims')) + '</p>' + claimList(matterOf('spikes')) + '</div>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('spk.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('spk.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('spk.note')) + '</p>' + doneNote() + reward();
  }
  /* a move: the engine's check on the dials decides, once the guess is made */
  const after = () => { const o = set(); if (o.guess != null && verdict(o).met) win(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), o = set();
      const g = q('[data-spk-guess]'); if (g) { o.guess = g.dataset.spkGuess; return after(); }
      const p = q('[data-spk-pat]'); if (p) { o.pat = p.dataset.spkPat; draw(); return true; }
      const n = q('[data-spk-nudge]'); if (n) { const [k, d] = n.dataset.spkNudge.split(':'), [lo, hi, step] = RANGE[k]; o[k] = Math.min(hi, Math.max(lo, +(o[k] + step * +d).toFixed(2))); return after(); }
      return false; },
    input(e) { const o = set();
      if (e.target.closest('[data-spk-cost]')) { o.cost = !!e.target.checked; draw(); return true; }
      const r = e.target.closest('[data-spk]'); if (!r) return false; o[r.dataset.spk] = +(+r.value).toFixed(2); return after(); }
  };
}
