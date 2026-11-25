/* Let the noise compute (kind 'pbits', at the switch), from src/engines/paradigms.js: the core question "Fight or use
   physics". A switch too small to sit still flickers between 0 and 1; a p-bit is such a switch used on purpose, leaning
   toward the value its neighbours ask for. Here p-bits hold two numbers p and q, and the product is clamped to N: a
   multiplier run backwards. Left alone they wander, and they spend most of their time on the pairs whose product is N.
   Beside them, the exact digital search tries every pair in order, spending the same energy as the p-bits so far.
   Two dials: how strongly the p-bits follow their neighbours (beta, the cold) and how long you wait before reading
   them (the state they visited most). Two challenges: 'noise' factors 15, 'noise-big' factors 143, where trying every
   pair costs four times as much and the p-bits hardly more. The goal is the engine's own check (factorGoal).
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import { still } from '../../core/ui.js';
import * as P from '../../engines/paradigms.js';

export const START = { b: 1, w: 2, seed: 3 };
const SIZES = { noise: 'small', 'noise-big': 'large' };
/* the engine's results, kept by their settings: the same dials always give the same answer */
const GOALS = {}, LEAST = {};
export const goalOf = (size, b, w) => { const k = size + ':' + b + ':' + w; return GOALS[k] || (GOALS[k] = P.factorGoal(size, { beta: P.BETAS[b], wait: P.WAITS[w] })); };
/* the least wait that is right 90% of the time at a cold, for a problem, and the energy of one read then (null: none) */
function leastAt(size, b) {
  const k = size + ':' + b; if (k in LEAST) return LEAST[k];
  const F = P.FACTOR[size]; let out = null;
  for (const w of P.WAITS) { const st = P.factorStats({ N: F.N, bits: F.bits, beta: P.BETAS[b], wait: w }); if (st.right >= P.PBIT_RIGHT) { out = { wait: w, energy: st.energy }; break; } }
  return (LEAST[k] = out);
}

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const size = SIZES[ch.id] || 'small', F = P.FACTOR[size], bits = F.bits, side = 1 << bits, n = 2 * bits, X = P.exactSearch(F.N, bits);
  const set = () => view.pb || (view.pb = Object.assign({}, START));
  const pj = v => t('pb.pj', { v: v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(0) : v.toFixed(1) });
  const pct = v => t('pb.pct', { v: Math.round(v * 100) });

  /* one network, live: it flickers on the clock (a slow screen takes bigger steps, never longer), and the exact search
     beside it tries as many pairs as the same energy pays for */
  function live() {
    const o = set(), beta = P.BETAS[o.b], wait = P.WAITS[o.w];
    if (!view.pbLive || view.pbLive.key !== o.b + ':' + o.w + ':' + o.seed) {
      view.pbLive = { key: o.b + ':' + o.w + ':' + o.seed, w: P.factorWalker({ N: F.N, bits, beta, seed: o.seed * 7919 + 1 }), wait, at: 0, carry: 0 };
      if (still()) view.pbLive.w.walk(wait);
    }
    return view.pbLive;
  }
  const rate = wait => Math.max(12, wait / 2.5);         // sweeps a second: a whole wait takes at most about 2.5 s
  function loop(now) {
    const V = view.pbLive; if (!V || !el.isConnected || V.w.sweeps >= V.wait) { view.pbRun = false; return; }
    const dt = Math.min(0.25, (now - (V.at || now)) / 1000); V.at = now;
    V.carry += dt * rate(V.wait); const k = Math.min(V.wait - V.w.sweeps, Math.floor(V.carry)); V.carry -= k;
    if (k > 0) { V.w.walk(k); draw(); }
    if (V.w.sweeps < V.wait) requestAnimationFrame(loop); else { view.pbRun = false; draw(); }
  }
  function start() { const V = live(); if (view.pbRun || V.w.sweeps >= V.wait) return; view.pbRun = true; V.at = 0; requestAnimationFrame(loop); }

  /* the picture: the p-bits with the clamped product, and two maps of every pair (p across, q down): where the p-bits
     spend their time, and how far the exact search has got for the same energy */
  function figure(V) {
    const done = V.w.sweeps >= V.wait, read = done ? V.w.read() : -1, s = done ? read : V.w.state, W = 300, H = 226, [p, q] = P.pqOf(s, bits), ok = p * q === F.N;
    const spent = V.w.sweeps * n * P.E_UPDATE, tried = Math.min(X.tries, Math.floor(spent / P.E_TRY + 1e-9));
    const answers = new Set(X.answers);
    let g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('pb.aria', { n: F.N, p, q, sweeps: V.w.sweeps, wait: V.wait })) + '">';
    /* the p-bits: p and q, the most significant bit first, each lit when it is 1; the product's bits, clamped */
    const r = bits === 3 ? 6.5 : 5.4, step = r * 2 + 3.4;
    const row = (v, x0, cls) => { let h = ''; for (let i = bits - 1, j = 0; i >= 0; i--, j++) h += '<circle class="pbbit ' + cls + ((v >> i) & 1 ? ' on' : '') + '" cx="' + (x0 + j * step + r).toFixed(1) + '" cy="20" r="' + r + '"/>'; return h; };
    const wGroup = bits * step - 3.4, nb = n, sq = 9, total = 2 * wGroup + 44 + nb * (sq + 2), x0 = (W - total) / 2, xq = x0 + wGroup + 22, xn = xq + wGroup + 22;
    g += row(p, x0, 'p') + '<text class="pbop" x="' + (x0 + wGroup + 11) + '" y="24" text-anchor="middle">×</text>' + row(q, xq, 'q') + '<text class="pbop" x="' + (xq + wGroup + 11) + '" y="24" text-anchor="middle">=</text>';
    for (let i = nb - 1, j = 0; i >= 0; i--, j++) g += '<rect class="pbclamp' + ((F.N >> i) & 1 ? ' on' : '') + '" x="' + (xn + j * (sq + 2)).toFixed(1) + '" y="' + (20 - sq / 2).toFixed(1) + '" width="' + sq.toFixed(1) + '" height="' + sq.toFixed(1) + '" rx="1.5"/>';
    g += '<text class="ax" x="' + (x0 + wGroup / 2) + '" y="40" text-anchor="middle">' + esc(t('pb.fig.p', { v: p })) + '</text><text class="ax" x="' + (xq + wGroup / 2) + '" y="40" text-anchor="middle">' + esc(t('pb.fig.q', { v: q })) + '</text>' +
      '<text class="ax" x="' + (xn + nb * (sq + 2) / 2) + '" y="40" text-anchor="middle">' + esc(t('pb.fig.n', { v: F.N })) + '</text>' +
      '<text class="pbnow' + (ok ? ' good' : '') + '" x="' + W / 2 + '" y="58" text-anchor="middle">' + esc(t(done ? (ok ? 'pb.fig.readHit' : 'pb.fig.readMiss') : ok ? 'pb.fig.hit' : 'pb.fig.miss', { p, q, v: p * q })) + '</text>';
    /* the two maps */
    const G0 = 130, c = G0 / side, Y0 = 80, L0 = 12, R0 = 158;
    const cell = (x0, k) => { const [a, b] = P.pqOf(k, bits); return [x0 + a * c, Y0 + b * c]; };
    let max = 1; for (let k = 0; k < V.w.counts.length; k++) max = Math.max(max, V.w.counts[k]);
    g += '<text class="ax" x="' + L0 + '" y="' + (Y0 - 6) + '">' + esc(t('pb.fig.time')) + '</text><text class="ax" x="' + R0 + '" y="' + (Y0 - 6) + '">' + esc(t('pb.fig.search')) + '</text>';
    g += '<rect class="pbmap" x="' + L0 + '" y="' + Y0 + '" width="' + G0 + '" height="' + G0 + '"/><rect class="pbmap" x="' + R0 + '" y="' + Y0 + '" width="' + G0 + '" height="' + G0 + '"/>';
    for (let k = 0; k < V.w.counts.length; k++) {
      const v = V.w.counts[k]; if (!v) continue; const [x, y] = cell(L0, k);
      g += '<rect class="pbheat" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + c.toFixed(1) + '" height="' + c.toFixed(1) + '" opacity="' + (0.06 + 0.94 * v / max).toFixed(2) + '"/>';
    }
    for (let k = 0; k < tried; k++) { const [x, y] = cell(R0, k); g += '<rect class="pbtry' + (answers.has(k) ? ' found' : '') + '" x="' + (x + 0.5).toFixed(1) + '" y="' + (y + 0.5).toFixed(1) + '" width="' + (c - 1).toFixed(1) + '" height="' + (c - 1).toFixed(1) + '"/>'; }
    answers.forEach(k => { [L0, R0].forEach(x0 => { const [x, y] = cell(x0, k); g += '<rect class="pbans" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + c.toFixed(1) + '" height="' + c.toFixed(1) + '"/>'; }); });
    if (read >= 0) { const [x, y] = cell(L0, read); g += '<rect class="pbread' + (answers.has(read) ? ' good' : '') + '" x="' + (x - 1.5).toFixed(1) + '" y="' + (y - 1.5).toFixed(1) + '" width="' + (c + 3).toFixed(1) + '" height="' + (c + 3).toFixed(1) + '"/>'; }
    else { const [x, y] = cell(L0, s); g += '<rect class="pbcur" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + c.toFixed(1) + '" height="' + c.toFixed(1) + '"/>'; }
    if (tried < X.tries) { const [x, y] = cell(R0, tried); g += '<rect class="pbcur" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + c.toFixed(1) + '" height="' + c.toFixed(1) + '"/>'; }
    /* what each has spent, and how far each has got */
    g += '<text class="pbspent" x="' + (L0 + G0 / 2) + '" y="' + (H - 2) + '" text-anchor="middle">' + esc(t('pb.fig.sweeps', { n: V.w.sweeps, e: pj(spent) })) + '</text>' +
      '<text class="pbspent" x="' + (R0 + G0 / 2) + '" y="' + (H - 2) + '" text-anchor="middle">' + esc(t('pb.fig.tried', { n: tried, of: X.tries, e: pj(tried * P.E_TRY) })) + '</text></svg>';
    return '<figure class="pbfig" data-f2="instrument">' + g + '<figcaption class="small muted">' + esc(t('pb.legend')) + '</figcaption></figure>';
  }
  function goalbox(R) {
    const share = P.FACTOR_SHARE[size], budget = R.st.exact * share, gs = [
      { k: 'right', ok: R.right, v: pct(R.st.right), target: t('pb.t.right', { v: Math.round(P.PBIT_RIGHT * 100) }), f: Math.min(1, R.st.right / P.PBIT_RIGHT) },
      { k: 'least', ok: R.least, v: R.shorter == null ? t('pb.none') : pct(R.shorter), target: t('pb.t.least', { v: Math.round(P.PBIT_RIGHT * 100) }), f: R.least ? 1 : R.right ? 0.5 : 0 },
      { k: size === 'large' ? 'third' : 'cheap', ok: R.cheap, v: pj(R.st.energy), target: t('pb.t.atMost', { v: pj(budget) }), f: Math.min(1, budget / R.st.energy) }];
    return '<div class="goalbox' + (R.met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(R.met ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('pb.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  const dial = (id, value, max) => '<div class="pbdial"><label class="lab" for="pb-' + id + '"><b>' + esc(t('pb.set.' + id)) + '</b> <output>' + esc(value) + '</output></label><div class="pbstep"><button type="button" class="chipb" data-pb-nudge="' + id + ':-1" aria-label="' + esc(t('pb.less')) + '">−</button><input type="range" id="pb-' + id + '" data-pb="' + id + '" min="0" max="' + max + '" step="1" value="' + set()[id] + '"><button type="button" class="chipb" data-pb-nudge="' + id + ':1" aria-label="' + esc(t('pb.more')) + '">+</button></div></div>';
  /* the 200 reads: how many were right, and the energy of one read against trying every pair */
  function reads(R) {
    const top = Math.max(R.st.energy, R.st.exact), w = v => (v / top * 100).toFixed(1), right = Math.round(R.st.right * P.PBIT_RUNS);
    return '<div class="pben"><p class="kicker">' + esc(t('pb.e.t')) + '</p>' +
      '<div class="pbrow"><span class="pbn">' + esc(t('pb.e.pbits')) + '</span><span class="pbbar"><i class="pb" style="width:' + w(R.st.energy) + '%"></i></span><b class="mono">' + esc(pj(R.st.energy)) + '</b></div>' +
      '<div class="pbrow"><span class="pbn">' + esc(t('pb.e.exact')) + '</span><span class="pbbar"><i class="ex" style="width:' + w(R.st.exact) + '%"></i></span><b class="mono">' + esc(pj(R.st.exact)) + '</b></div>' +
      '<p class="small muted">' + esc(t('pb.e.reads', { n: right, of: P.PBIT_RUNS, tries: X.tries })) + '</p></div>';
  }
  /* as the number grows: trying every pair costs four times as much for every bit added to p and q; the p-bits, at this cold */
  function growth(o) {
    const rows = Object.keys(P.FACTOR).map(k => { const f = P.FACTOR[k], x = P.exactSearch(f.N, f.bits).energy, l = leastAt(k, o.b); return { k, f, x, l }; });
    const top = Math.max(...rows.map(r => Math.max(r.x, r.l ? r.l.energy : 0))), w = v => (v / top * 100).toFixed(1);
    const [a, b] = rows, rx = b.x / a.x, rp = a.l && b.l ? b.l.energy / a.l.energy : null;
    return '<div class="pbgrow"><p class="kicker">' + esc(t('pb.grow.t')) + '</p>' + rows.map(r => '<div class="pbgr' + (r.k === size ? ' now' : '') + '"><span class="pbn">' + esc(t('pb.grow.n', { n: r.f.N, bits: r.f.bits })) + '</span><span class="pbbars">' +
      '<span class="pbbar"><i class="pb" style="width:' + (r.l ? w(r.l.energy) : 0) + '%"></i></span><span class="pbbar"><i class="ex" style="width:' + w(r.x) + '%"></i></span></span>' +
      '<span class="pbv mono small">' + esc(r.l ? pj(r.l.energy) : t('pb.grow.never')) + '<br>' + esc(pj(r.x)) + '</span></div>').join('') +
      '<p class="small pbkey"><span><i class="pb"></i>' + esc(t('pb.grow.pbits')) + '</span><span><i class="ex"></i>' + esc(t('pb.e.exact')) + '</span></p>' +
      '<p class="small muted">' + esc(rp == null ? t('pb.grow.noneD', { x: Math.round(rx) }) : t('pb.grow.d', { x: Math.round(rx), p: rp.toFixed(1) })) + '</p></div>';
  }
  function bench() {
    const o = set(), R = goalOf(size, o.b, o.w), V = live(), beta = P.BETAS[o.b];
    let h = head() + '<p class="small pbintro">' + esc(t(size === 'large' ? 'pb.intro.big' : 'pb.intro')) + '</p>' + goalbox(R) + figure(V);
    h += dial('b', t('pb.v.b', { v: beta }), P.BETAS.length - 1) + dial('w', t('pb.v.w', { v: P.WAITS[o.w] }), P.WAITS.length - 1);
    h += '<div class="chips"><button type="button" class="chipb" data-pb-again>' + esc(t('pb.again')) + '</button></div>';
    const msg = R.met ? 'met' : !R.right ? (beta < 0.75 ? 'warm' : beta >= 2 ? 'cold' : 'short') : !R.least ? 'long' : 'costly';
    h += '<p class="small pbmsg ' + (R.met ? 'good' : msg === 'long' ? '' : 'bad') + '">' + esc(t('pb.msg.' + msg, { v: Math.round(R.st.right * 100) })) + '</p>' + reads(R) + growth(o);
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('pb.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t(size === 'large' ? 'pb.done.big' : 'pb.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('pb.note')) + '</p>' + doneNote() + reward();
  }
  /* a dial moved: the engine's check on the new settings decides, and a fresh network runs with them */
  const after = () => { const o = set(); if (goalOf(size, o.b, o.w).met) win(); draw(); fx(); start(); return true; };
  return {
    draw() { const h = bench(); if (!view.pbRun) requestAnimationFrame(() => { if (el.isConnected) start(); }); return h; },
    click(e) { const q = s => e.target.closest(s), o = set();
      const nb = q('[data-pb-nudge]'); if (nb) { const [k, d] = nb.dataset.pbNudge.split(':'), max = (k === 'b' ? P.BETAS : P.WAITS).length - 1; o[k] = Math.min(max, Math.max(0, o[k] + +d)); return after(); }
      if (q('[data-pb-again]')) { o.seed++; return after(); }
      return false; },
    input(e) { const r = e.target.closest('[data-pb]'); if (!r) return false; set()[r.dataset.pb] = +r.value; return after(); }
  };
}
