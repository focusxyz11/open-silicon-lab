/* The six bets (kind 'bet'): say where you think the balance is, then turn two dials until three primitives meet,
   checked by src/engines/bet.js: Moore's bet (cheaper), Cray's (oxen), the pieces' (onebad), the proof's (prove),
   Jevons' (jevons) and the batch bet (batch).
   They are the loop's own challenges (src/v2/loop.js), each opening a question of the field (src/data/questions.js),
   growing on the island from src/v2/map3d.js and styled in src/styles/labs.css, so they are not declared in
   src/data/labs/; the player (src/v2/play.js) plays them as it plays a lab, lab(L) -> { draw, after, click, input },
   and loads this file with the labs (labsReady), before any challenge is played. after() paints what the HTML cannot:
   the wafer's canvas, and the scene behind the card (src/app/betscene.js). */
import * as Bet from '../../engines/bet.js';
import { setBetScene } from '../../app/betscene.js';
import { WAFER as SCENE_WAFER } from '../../engines/chip.js';
import { glyph } from '../field.js';

export default function lab(L) {
  const { S, view, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L;
  /* ---- bet: say where you think the balance is, then find it. Moore's bet: a real wafer, cut into chips of the
     size you choose, specked by the line you choose; each part's cost is counted from what works ---- */
  const betOf = () => (S.bets[ch.id] = Bet.normalBetOf(ch.bet, S.bets[ch.id]));
  const million = i => t('bet.sizeV', { n: Bet.SIZES[i] });
  /* the bets' guesses: [the bet's attribute, what the answer is shown beside] */
  const GUESSES = [['bt', '.betview'], ['jv', '.betview'], ['pv', '.pblocks'], ['pc', '.betview'], ['ox', '.betview'], ['size', '.betview']];
  const times = v => isFinite(v) ? t('bet.times', { v: v >= 10 ? Math.round(v) : v.toFixed(2) }) : t('bet.none');
  function bet() { return ch.bet === 'oxen' ? betOxen() : ch.bet === 'onebad' ? betPieces() : ch.bet === 'prove' ? betProve() : ch.bet === 'jevons' ? betJevons() : ch.bet === 'batch' ? betBatch() : betMoore(); }
  function betMoore() {
    const b = betOf();
    let h = head();
    if (b.guess == null) {
      /* first, a guess: the act of predicting before you look */
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.predict')) + '</p><div class="chips">' +
        Bet.SIZES.map((_, i) => '<button type="button" class="chipb" data-guess-size="' + i + '">' + esc(million(i)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.model')) + '</p>';
      return h + reward();
    }
    const M = Bet.moore(b.size, b.clean), C = Bet.check(b), cur = Bet.curve(b.clean), low = Bet.cheapest(b.clean);
    const gs = [{ k: 'size', ok: C.big, v: million(b.size), target: t('bet.gSize', { n: Bet.GOAL.minParts }), f: Math.min(1, Bet.SIZES[b.size] / Bet.GOAL.minParts) },
      { k: 'cost', ok: C.close, v: times(C.rel), target: t('bet.gCost', { v: Bet.GOAL.maxRel }), f: C.ok || C.close ? 1 : Math.min(1, Bet.GOAL.maxRel / C.rel) }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    /* the wafer and the curve, side by side where there is room */
    h += '<div class="betview" data-f2="instrument"><figure class="wafer"><canvas class="betwafer" width="320" height="320" role="img" aria-label="' + esc(t('bet.waferAria', { chips: M.chips, good: M.good })) + '"></canvas><figcaption class="small muted">' + esc(t('bet.counts', { chips: M.chips, good: M.good })) + '</figcaption></figure>' + curveSvg(cur, low, b) + '</div>';
    h += '<label class="lab" for="bet-size"><b>' + esc(t('bet.size')) + '</b> <output>' + esc(million(b.size)) + '</output></label><input type="range" id="bet-size" data-bet="size" min="0" max="' + (Bet.SIZES.length - 1) + '" step="1" value="' + b.size + '">';
    h += '<label class="lab" for="bet-clean"><b>' + esc(t('bet.clean')) + '</b> <output>' + esc(t('bet.cleanV', { d: Bet.CLEAN[b.clean] })) + '</output></label><input type="range" id="bet-clean" data-bet="clean" min="0" max="' + (Bet.CLEAN.length - 1) + '" step="1" value="' + b.clean + '">';
    h += '<p class="readout small">' + esc(t('bet.readout', { wafer: times(M.wafer), cost: times(C.rel) })) + '</p>';
    h += '<p class="small ' + (b.guess === low ? 'good' : 'hint') + '">' + esc(t(b.guess === low ? 'bet.guessRight' : 'bet.guessOff', { g: Bet.SIZES[b.guess], n: Bet.SIZES[low] })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* ---- Cray's bet: one strong core, many small ones, or both, on one chip that serves two jobs ---- */
  function betOxen() {
    const b = betOf(), G = Bet.GUESSES;
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.ox.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-ox="' + i + '">' + esc(t('bet.ox.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.ox.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkOxen(b), M = C.M, X = Bet.OX_GOAL;
    const gs = [{ k: 'app', ok: C.app, v: times(M.app), target: t('bet.ox.gApp', { v: X.app }), f: Math.min(1, M.app / X.app) },
      { k: 'ai', ok: C.ai, v: times(M.ai), target: t('bet.ox.gApp', { v: X.ai }), f: Math.min(1, M.ai / X.ai) },
      { k: 'size', ok: C.size, v: t('bet.ox.sizeV', { v: M.size }), target: t('bet.ox.gSize', { v: X.size }), f: C.size ? 1 : X.size / M.size }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.ox.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    h += '<div class="betview" data-f2="instrument">' + planSvg(M) + '<div class="races">' + ['app', 'ai'].map(k => race(k, M[k], X[k])).join('') + '<p class="small muted">' + esc(t('bet.ox.raceNote')) + '</p></div></div>';
    h += '<label class="lab" for="bet-ox"><b>' + esc(t('bet.ox.ox')) + '</b> <output>' + esc(M.r > 1 ? t('bet.ox.units', { n: M.r }) : t('bet.ox.noOx')) + '</output></label><input type="range" id="bet-ox" data-bet="ox" min="0" max="' + (Bet.OX.length - 1) + '" step="1" value="' + b.ox + '">';
    h += '<label class="lab" for="bet-hens"><b>' + esc(t('bet.ox.hens')) + '</b> <output>' + esc(t('bet.ox.hensV', { n: M.m })) + '</output></label><input type="range" id="bet-hens" data-bet="hens" min="0" max="' + (Bet.HENS.length - 1) + '" step="1" value="' + b.hens + '">';
    h += '<p class="small ' + (G[b.guess] === 'both' ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === 'both' ? 'bet.ox.right' : 'bet.ox.off', { g: t('bet.ox.g.' + G[b.guess]) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.ox.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.ox.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* one job's speed, on a log scale up to 300 times one small core, with the goal as a mark */
  function race(k, v, goal) {
    const p = x => Math.max(2, Math.min(100, 100 * Math.log(x) / Math.log(300)));
    return '<div class="race' + (v >= goal ? ' ok' : '') + '"><span class="rl">' + esc(t('bet.ox.race.' + k)) + '</span><span class="rbar"><span style="width:' + p(v).toFixed(1) + '%"></span><i style="left:' + p(goal).toFixed(1) + '%"></i></span><span class="rv">' + esc(times(v)) + '</span></div>';
  }
  /* the chip as units: the strong core one big block, small cores squares, more than the budget past a dashed line; the
     caption names them by size, never by colour (the block is drawn in ink, dark by day and light at night), and speaks
     of the dashed line only when it is drawn (#373) */
  function planSvg(M) {
    const F = Bet.floorplan(M.r, M.m), c = 10, W = F.W * c, H = F.rows * c, over = F.rows > F.budgetRows;
    return '<figure class="oxplan"><svg viewBox="-2 -2 ' + (W + 4) + ' ' + (H + 4) + '" role="img" aria-label="' + esc(t('bet.ox.planAria', { r: M.r, m: M.m, size: M.size })) + '">' +
      (over ? '<rect class="over" x="0" y="' + F.budgetRows * c + '" width="' + W + '" height="' + (H - F.budgetRows * c) + '"/>' : '') +
      (F.ox ? '<rect class="ox" x="0.6" y="0.6" width="' + (F.ox.w * c - 1.2) + '" height="' + (F.ox.h * c - 1.2) + '" rx="2"/>' : '') +
      F.hens.map(([x, y]) => '<rect class="hen" x="' + (x * c + 1.2) + '" y="' + (y * c + 1.2) + '" width="' + (c - 2.4) + '" height="' + (c - 2.4) + '" rx="1"/>').join('') +
      '<rect class="edge" x="0" y="0" width="' + W + '" height="' + Math.min(H, F.budgetRows * c) + '"/>' +
      (over ? '<line class="budget" x1="0" x2="' + W + '" y1="' + F.budgetRows * c + '" y2="' + F.budgetRows * c + '"/>' : '') +
      '</svg><figcaption class="small muted">' + esc(t(F.ox ? 'bet.ox.plan' : 'bet.ox.planHens', { size: M.size }) + ' ' + t(over ? 'bet.ox.planOver' : 'bet.ox.planIn')) + '</figcaption></figure>';
  }
  /* each part's cost at every size on this line (log scale), the cheapest point, your size, your guess, the goal */
  function curveSvg(cur, low, b) {
    const W = 300, H = 200, l = 34, r = 10, top = 12, bot = 34, n = cur.length, top2 = 6, x = i => l + i * (W - l - r) / (n - 1);
    const y = v => top + (H - top - bot) * (1 - Math.log(Math.min(v, top2)) / Math.log(top2));
    const pts = cur.map((v, i) => x(i).toFixed(1) + ',' + y(isFinite(v) ? v : top2).toFixed(1)).join(' ');
    const gx = x(Bet.SIZES.indexOf(Bet.GOAL.minParts)), gy = y(Bet.GOAL.maxRel);
    return '<figure class="betcurve"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('bet.curveAria', { n: Bet.SIZES[low] })) + '">' +
      '<rect class="goalzone" x="' + (gx - 8).toFixed(1) + '" y="' + top + '" width="' + (W - r - gx + 8).toFixed(1) + '" height="' + (gy - top).toFixed(1) + '"/>' +
      [1, 2, 4].map(v => '<line class="grid" x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="ax" x="' + (l - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + esc(t('bet.times', { v })) + '</text>').join('') +
      Bet.SIZES.map((sz, i) => i % 2 ? '' : '<text class="ax" x="' + x(i).toFixed(1) + '" y="' + (H - bot + 20) + '" text-anchor="middle">' + sz + '</text>').join('') +
      '<text class="ax" x="' + ((l + W - r) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(t('bet.axis')) + '</text>' +
      '<polyline class="line" points="' + pts + '"/>' +
      '<circle class="low" cx="' + x(low).toFixed(1) + '" cy="' + y(cur[low]).toFixed(1) + '" r="7"/>' +
      '<path class="guess" d="M' + x(b.guess).toFixed(1) + ' ' + (H - bot + 1) + 'l-4.5 6.5h9z"/>' +
      '<circle class="you" cx="' + x(b.size).toFixed(1) + '" cy="' + y(isFinite(cur[b.size]) ? cur[b.size] : top2).toFixed(1) + '" r="4.5"/>' +
      '</svg><figcaption class="small muted">' + esc(t('bet.legend')) + '</figcaption></figure>';
  }
  /* the wafer, painted from the engine's own layout and specks. Moore's bet: dead chips dark, working ones light.
     The pieces' bet: good pieces light, pieces the test caught dark, bad pieces it missed in the warm colour. */
  function paintWafer() {
    const cv = el.querySelector('.betwafer'); if (!cv) return;
    const b = betOf(), dpr = Math.min(2, window.devicePixelRatio || 1), px = 320;
    if (cv.width !== px * dpr) { cv.width = px * dpr; cv.height = px * dpr; }
    const g = cv.getContext('2d'), cs = getComputedStyle(el), col = (k, d) => cs.getPropertyValue(k).trim() || d;
    const ink = col('--ink', '#222'), bad = col('--bad', '#c33'), good = col('--good', '#2a7'), warm = col('--warm', '#d80');
    let s, cells, paint, d;
    if (ch.bet === 'onebad') { const P = Bet.pieces(b.k, b.test); s = P.s; cells = P.cells; d = Bet.CLEAN[2]; paint = n => P.state[n] === 'good' ? [good, 0.55] : P.state[n] === 'caught' ? [bad, 0.75] : [warm, 0.95]; }
    else { const M = Bet.moore(b.size, b.clean); s = M.s; cells = M.cells; d = M.d; paint = n => M.alive[n] ? [good, 0.55] : [bad, 0.75]; }
    const k = px * dpr / (2 * Bet.WAFER.r + 8), o = px * dpr / 2;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.save(); g.translate(o, o); g.scale(k, -k);
    g.beginPath(); g.arc(0, 0, Bet.WAFER.r, 0, Math.PI * 2); g.fillStyle = ink; g.globalAlpha = 0.07; g.fill(); g.globalAlpha = 0.35; g.lineWidth = 1 / k * dpr; g.strokeStyle = ink; g.stroke();
    const gap = Math.min(0.6, s * 0.06);
    cells.forEach(([i, j], n) => { const [c, a] = paint(n); g.globalAlpha = a; g.fillStyle = c; g.fillRect(i * s + gap / 2, j * s + gap / 2, s - gap, s - gap); });
    g.globalAlpha = 0.9; g.fillStyle = ink; const rr = Math.max(0.7, 1.1 / k * dpr);
    Bet.specksOf(d).forEach(([x, y]) => { g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); });
    g.restore();
  }
  /* the scene behind the card answers the dials (src/app/scenes.js setBetScene): the 3D wafer shows the bet's
     wafer, the data centre's chip the bet's cores. Before the guess, the scene stays yours. */
  function betScene() {
    const b = betOf(); if (b.guess == null) return setBetScene(null, null, '');
    /* bets whose answer is in the card alone leave the scene as it is */
    if (ch.bet === 'prove' || ch.bet === 'batch') return setBetScene(null, null, '');
    if (ch.bet === 'jevons') { const J = Bet.jevons(b.eff, b.cap); return setBetScene(null, null, 'jevons:' + b.eff + ':' + b.cap, { need: J.turbines, own: Bet.TURBINES }); }
    if (ch.bet === 'oxen') { const M = Bet.oxen(b.ox, b.hens); return setBetScene(null, { r: M.r, m: M.m, plan: Bet.floorplan(M.r, M.m) }, 'oxen:' + b.ox + ':' + b.hens); }
    let s, cells, tone, d;
    if (ch.bet === 'onebad') { const P = Bet.pieces(b.k, b.test); s = P.s; cells = P.cells; d = Bet.CLEAN[2]; tone = n => P.state[n] === 'good' ? 'ok' : P.state[n] === 'caught' ? 'lost' : 'missed'; }
    else { const M = Bet.moore(b.size, b.clean); s = M.s; cells = M.cells; d = M.d; tone = n => M.alive[n] ? 'ok' : 'lost'; }
    /* millimetres on the bet's wafer to the scene's 1000 x 1000, the wafer's middle at 500; a 2-unit gap between chips */
    const k = SCENE_WAFER.R / Bet.WAFER.r, at = v => 500 + v * k, side = s * k;
    const dies = cells.map(([i, j]) => [at(i * s) + 1, at(j * s) + 1, side - 2, side - 2]), tones = cells.map((_, n) => tone(n));
    const near = dies.map((q, n) => [n, Math.hypot(q[0] + q[2] / 2 - 500, q[1] + q[3] / 2 - 500)]).filter(([n]) => tones[n] === 'ok').sort((x, y) => x[1] - y[1])[0];
    const f = dies[near ? near[0] : 0] || [500, 500, 40, 40];
    setBetScene({ dies, hits: tones.map(x => x !== 'ok'), tones, specks: Bet.specksOf(d).map(([x, y]) => [at(x), at(y)]), R: SCENE_WAFER.R, follow: [f[0], f[1], f[2]] }, null, ch.bet + ':' + JSON.stringify(b));
  }
  /* ---- the proof's bet: run random tests, or prove blocks by machine; tap a block to prove it ---- */
  /* a power of ten as it is written: 10⁶ */
  const sup = n => String(n).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const pct = v => v < 0.0001 ? t('bet.pv.tiny') : v < 0.01 ? t('bet.pv.pctFine', { v: (v * 100).toFixed(2) }) : t('gauge.pct', { v: Math.round(v * 100) });
  function betProve() {
    const b = betOf(), G = Bet.PROVE_GUESSES;
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.pv.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-pv="' + i + '">' + esc(t('bet.pv.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.pv.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkProve(b), R = C.R, X = Bet.PROVE_GOAL;
    const gs = [{ k: 'escape', ok: C.safe, v: pct(R.escape), target: t('bet.pv.gEscape', { v: Math.round(X.maxEscape * 100) }), f: C.safe ? 1 : Math.min(1, X.maxEscape / R.escape) },
      { k: 'cost', ok: C.cheap, v: t('bet.pv.costV', { v: R.cost < 10 ? R.cost.toFixed(1) : Math.round(R.cost) }), target: t('bet.pv.gCost', { v: X.maxCost }), f: C.cheap ? 1 : X.maxCost / R.cost }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.pv.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    /* the chip, block by block: how rare its bug is, the chance it is still hidden, and the proof's price */
    h += '<p class="kicker">' + esc(t('bet.pv.blocksK')) + '</p><div class="pblocks" data-f2="instrument">' + R.blocks.map((B, i) => {
      const st = B.proved ? 'proved' : B.hidden > 0.01 ? 'hidden' : 'found';
      return '<button type="button" class="pblock ' + st + '" data-prove="' + i + '" aria-pressed="' + B.proved + '"><span class="pn">' + (B.proved ? glyph('limit') : '') + esc(t('bet.pv.b.' + B.id)) + '</span>' +
        '<span class="pr small muted">' + esc(t('bet.pv.rare', { n: sup(Math.round(-Math.log10(B.p))) })) + '</span>' +
        '<span class="ph"><span style="width:' + (B.hidden * 100).toFixed(1) + '%"></span></span>' +
        '<span class="pv small">' + esc(B.proved ? t('bet.pv.provedV', { c: B.proof }) : t('bet.pv.hiddenV', { v: pct(B.hidden), c: B.proof })) + '</span></button>';
    }).join('') + '</div><p class="small muted">' + esc(t('bet.pv.blocksNote')) + '</p>';
    const n = Math.round(Math.log10(R.T));
    h += '<label class="lab" for="bet-tests"><b>' + esc(t('bet.pv.tests')) + '</b> <output>' + esc(t('bet.pv.testsV', { n: sup(n), c: Bet.testCost(R.T) < 1 ? Bet.testCost(R.T).toFixed(2) : Math.round(Bet.testCost(R.T)) })) + '</output></label><input type="range" id="bet-tests" data-bet="tests" min="0" max="' + (Bet.PTESTS.length - 1) + '" step="1" value="' + b.tests + '">';
    h += '<p class="small ' + (G[b.guess] === Bet.PROVE_ANSWER ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === Bet.PROVE_ANSWER ? 'bet.pv.right' : 'bet.pv.off', { g: t('bet.pv.g.' + G[b.guess]) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.pv.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.pv.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* ---- Jevons' bet: a better chip makes each answer cheaper; the world asks more; does the island hold? ---- */
  const frac = v => v >= 1 ? String(v) : '1/' + Math.round(1 / v);
  function betJevons() {
    const b = betOf(), G = Bet.J_GUESSES, right = Bet.jevonsAnswer();
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.jv.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-jv="' + i + '">' + esc(t('bet.jv.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.jv.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkJevons(b), J = C.J, X = Bet.J_GOAL;
    const gs = [{ k: 'answers', ok: C.many, v: times(J.answers), target: t('bet.jv.gAnswers', { v: X.minAnswers }), f: Math.min(1, J.answers / X.minAnswers) },
      { k: 'energy', ok: C.held, v: times(J.energy), target: t('bet.jv.gEnergy', { v: Math.round(X.maxEnergy * 100) }), f: C.held ? 1 : X.maxEnergy / J.energy }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.jv.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    h += '<div class="betview" data-f2="instrument">' + turbinesSvg(J) + pathSvg(b) + '</div>';
    h += '<label class="lab" for="bet-eff"><b>' + esc(t('bet.jv.eff')) + '</b> <output>' + esc(t(b.eff ? 'bet.jv.effV' : 'bet.jv.eff0', { v: frac(J.e) })) + '</output></label><input type="range" id="bet-eff" data-bet="eff" min="0" max="' + (Bet.EFF.length - 1) + '" step="1" value="' + b.eff + '">';
    h += '<label class="lab" for="bet-cap"><b>' + esc(t('bet.jv.cap')) + '</b> <output>' + esc(isFinite(J.cap) ? t('bet.jv.capV', { v: J.cap }) : t('bet.jv.capNone')) + '</output></label><input type="range" id="bet-cap" data-bet="cap" min="0" max="' + (Bet.CAP.length - 1) + '" step="1" value="' + b.cap + '">';
    const J8 = Bet.jevons(3, Bet.CAP.length - 1);
    h += '<p class="small ' + (G[b.guess] === right ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === right ? 'bet.jv.right' : 'bet.jv.off', { g: t('bet.jv.g.' + G[b.guess]), a: Math.round(J8.answers), e: J8.energy.toFixed(1) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.jv.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.jv.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* the turbines the answers draw: the island's own (turning, or standing idle), the ones it would need beyond them,
     and, past the island's limit, the asking it turns away (drawn as outlines) */
  function turbinesSvg(J) {
    const n = J.turbines, N = Bet.TURBINES, want = J.asked * J.e * N, all = Math.max(N, Math.ceil(want - 1e-9)), cols = 15, c = 20, rows = Math.ceil(all / cols), W = cols * c, H = rows * 26 + 4;
    const one = i => { const x = (i % cols) * c + c / 2, y = Math.floor(i / cols) * 26 + 2, hub = y + 8, st = i < n ? (i < N ? 'on' : 'more') : i < N ? 'idle' : 'away', part = i + 1 > n && i < n ? Math.max(0.25, n - i) : 1;
      return '<g class="tb ' + st + '"' + (part < 1 ? ' opacity="' + part.toFixed(2) + '"' : '') + '><line class="mast" x1="' + x + '" y1="' + (y + 24) + '" x2="' + x + '" y2="' + hub + '"/>' +
        '<g class="rot" style="transform-origin:' + x + 'px ' + hub + 'px">' + [0, 120, 240].map(a => { const r = (a - 90) * Math.PI / 180; return '<line x1="' + x + '" y1="' + hub + '" x2="' + (x + 7 * Math.cos(r)).toFixed(1) + '" y2="' + (hub + 7 * Math.sin(r)).toFixed(1) + '"/>'; }).join('') + '</g></g>'; };
    const shore = '<rect class="isle" x="0.5" y="0.5" width="' + (Math.min(N, cols) * c - 1) + '" height="' + (Math.ceil(N / cols) * 26 + 1) + '" rx="6"/>';
    /* past the island's own, a part of a turbine still needs a whole one */
    const k = n > N ? Math.ceil(n - 1e-9) : Math.round(n), key = k > N ? 'bet.jv.more' : k < N ? 'bet.jv.idle' : 'bet.jv.held', away = Math.round(want - n);
    const words = t(key, { n: k, N, x: k - N, i: N - k }) + (away >= 1 ? ' ' + t('bet.jv.away', { w: away }) : '');
    return '<figure class="turbines"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(words) + '">' + shore + Array.from({ length: all }, (_, i) => one(i)).join('') + '</svg>' +
      '<figcaption class="small muted">' + esc(words) + '</figcaption></figure>';
  }
  /* where the world goes: answers across, energy up, both against today, on scales of tens. Each line is one limit on
     the island's power; along it, each dot a better chip. Under a limit the line turns flat: a better chip then buys
     answers, not energy. The ring is today; the hollow dot what the world asks, the asking past the limit dashed. */
  function pathSvg(b) {
    const W = 300, H = 210, l = 36, r = 10, top = 10, bot = 36, lx = [0.5, 400], ly = [0.3, 8];
    const x = v => l + (W - l - r) * Math.log(v / lx[0]) / Math.log(lx[1] / lx[0]), y = v => top + (H - top - bot) * (1 - Math.log(v / ly[0]) / Math.log(ly[1] / ly[0]));
    const P = (ei, ci) => { const J = Bet.jevons(ei, ci); return [x(J.answers), y(J.energy)]; };
    const line = ci => Bet.EFF.map((_, ei) => P(ei, ci).map(v => v.toFixed(1)).join(',')).join(' ');
    const J = Bet.jevons(b.eff, b.cap), gx = x(Bet.J_GOAL.minAnswers), gy = y(Bet.J_GOAL.maxEnergy), [px, py] = P(b.eff, b.cap), ax = x(J.asked), ay = y(J.asked * J.e);
    return '<figure class="betcurve jpath"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('bet.jv.pathAria')) + '">' +
      '<rect class="goalzone" x="' + gx.toFixed(1) + '" y="' + gy.toFixed(1) + '" width="' + (W - r - gx).toFixed(1) + '" height="' + (H - bot - gy).toFixed(1) + '"/>' +
      [1, 10, 100].map(v => '<line class="grid" x1="' + x(v).toFixed(1) + '" x2="' + x(v).toFixed(1) + '" y1="' + top + '" y2="' + (H - bot) + '"/><text class="ax" x="' + x(v).toFixed(1) + '" y="' + (H - bot + 14) + '" text-anchor="middle">' + esc(t('bet.times', { v })) + '</text>').join('') +
      [0.5, 1, 4].map(v => '<text class="ax" x="' + (l - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + esc(t('bet.times', { v })) + '</text>').join('') +
      '<line class="cap" x1="' + l + '" x2="' + (W - r) + '" y1="' + y(1).toFixed(1) + '" y2="' + y(1).toFixed(1) + '"/>' +
      Bet.CAP.map((_, ci) => ci === b.cap ? '' : '<polyline class="other" points="' + line(ci) + '"/>').join('') +
      '<polyline class="line" points="' + line(b.cap) + '"/>' + Bet.EFF.map((_, ei) => { const [cx, cy] = P(ei, b.cap); return '<circle class="step" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="2.4"/>'; }).join('') +
      (J.waiting > 1e-9 ? '<line class="awayline" x1="' + px.toFixed(1) + '" y1="' + py.toFixed(1) + '" x2="' + ax.toFixed(1) + '" y2="' + ay.toFixed(1) + '"/><circle class="asked" cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="4"/>' : '') +
      '<circle class="today" cx="' + x(1).toFixed(1) + '" cy="' + y(1).toFixed(1) + '" r="5"/>' +
      '<circle class="you" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="5"/>' +
      '<text class="ax" x="' + ((l + W - r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(t('bet.jv.axisX')) + '</text>' +
      '<text class="ax" transform="translate(11 ' + ((top + H - bot) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(t('bet.jv.axisY')) + '</text>' +
      '</svg><figcaption class="small muted">' + esc(t('bet.jv.legend')) + '</figcaption></figure>';
  }
  /* ---- the batch bet: how many people the chip serves at once, and how many bits each number takes ---- */
  function betBatch() {
    const b = betOf(), G = Bet.BATCH_GUESSES, right = Bet.batchAnswer();
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.bt.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-bt="' + i + '">' + esc(t('bet.bt.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.bt.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkBatch(b), R = C.R, X = Bet.BATCH_GOAL, pctB = v => v < 0.01 ? t('bet.pv.pctFine', { v: (v * 100).toFixed(2) }) : t('gauge.pct', { v: Math.round(v * 100) });
    const gs = [{ k: 'speed', ok: C.fast, v: t('bet.bt.tps', { v: Math.round(R.tokPerUser) }), target: t('bet.bt.gSpeed', { v: X.minSpeed }), f: Math.min(1, R.tokPerUser / X.minSpeed) },
      { k: 'busy', ok: C.busy, v: pctB(R.utilization), target: t('bet.bt.gBusy', { v: Math.round(X.minBusy * 100) }), f: Math.min(1, R.utilization / X.minBusy) }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.bt.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    /* one step of writing: reading every weight, against doing the sums for everyone; the step takes the longer */
    const ms = v => v * 1000 < 1 ? (v * 1000).toFixed(2) : (v * 1000).toFixed(1), top = Math.max(R.tMemS, R.tCmpS), w = v => Math.max(0.8, v / top * 100).toFixed(1);
    h += '<div class="betview" data-f2="instrument"><figure class="btstep"><div class="agrace"><span class="small">' + esc(t('bet.bt.read')) + '</span><span class="agbar' + (R.memoryBound ? ' hot' : '') + '"><span style="width:' + w(R.tMemS) + '%"></span></span><b class="mono small">' + esc(t('agent.tool.ms', { v: ms(R.tMemS) })) + '</b>' +
      '<span class="small">' + esc(t('bet.bt.sums', { n: R.people })) + '</span><span class="agbar' + (R.memoryBound ? '' : ' hot') + '"><span style="width:' + w(R.tCmpS) + '%"></span></span><b class="mono small">' + esc(t('agent.tool.ms', { v: ms(R.tCmpS) })) + '</b></div>' +
      '<figcaption class="small muted">' + esc(t(R.memoryBound ? 'bet.bt.waitsMem' : 'bet.bt.waitsSum', { n: R.people })) + '</figcaption></figure>' + batchSvg(b) + '</div>';
    h += '<label class="lab" for="bet-batch"><b>' + esc(t('bet.bt.batch')) + '</b> <output>' + esc(t('bet.bt.batchV', { n: R.people })) + '</output></label><input type="range" id="bet-batch" data-bet="batch" min="0" max="' + (Bet.BATCH.length - 1) + '" step="1" value="' + b.batch + '">';
    h += '<label class="lab" for="bet-format"><b>' + esc(t('bet.bt.format')) + '</b> <output>' + esc(t('bet.bt.f.' + Bet.BFORMATS[b.format])) + '</output></label><input type="range" id="bet-format" data-bet="format" min="0" max="' + (Bet.BFORMATS.length - 1) + '" step="1" value="' + b.format + '">';
    const R1 = Bet.batched(0, 0);
    h += '<p class="small ' + (G[b.guess] === right ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === right ? 'bet.bt.right' : 'bet.bt.off', { g: t('bet.bt.g.' + G[b.guess]), v: (R1.utilization * 100).toFixed(1) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.bt.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.bt.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* each person's speed against how many are served at once, one line for each number size; the chip is 80% busy
     right of the dashed line; the green corner is the goal */
  function batchSvg(b) {
    const W = 300, H = 210, l = 40, r = 10, top = 10, bot = 36, lx = [1, 4096], ly = [10, 1000];
    const x = v => l + (W - l - r) * Math.log(v / lx[0]) / Math.log(lx[1] / lx[0]), y = v => top + (H - top - bot) * (1 - Math.log(Math.max(ly[0], Math.min(ly[1], v)) / ly[0]) / Math.log(ly[1] / ly[0]));
    const line = fi => Bet.BATCH.map((_, bi) => { const R = Bet.batched(bi, fi); return x(R.people).toFixed(1) + ',' + y(R.tokPerUser).toFixed(1); }).join(' ');
    /* while the chip waits on memory, each person more adds the same share of busy arithmetic */
    const busyAt = Math.min(4096, Bet.BATCH_GOAL.minBusy / Bet.batched(0, 0).utilization);
    const R = Bet.batched(b.batch, b.format), gx = x(busyAt), gy = y(Bet.BATCH_GOAL.minSpeed);
    return '<figure class="betcurve jpath btcurve"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('bet.bt.aria')) + '">' +
      '<rect class="goalzone" x="' + gx.toFixed(1) + '" y="' + top + '" width="' + (W - r - gx).toFixed(1) + '" height="' + (gy - top).toFixed(1) + '"/>' +
      [1, 16, 256, 4096].map(v => '<line class="grid" x1="' + x(v).toFixed(1) + '" x2="' + x(v).toFixed(1) + '" y1="' + top + '" y2="' + (H - bot) + '"/><text class="ax" x="' + x(v).toFixed(1) + '" y="' + (H - bot + 14) + '" text-anchor="' + (v === 4096 ? 'end' : 'middle') + '">' + v + '</text>').join('') +
      [10, 100, 1000].map(v => '<text class="ax" x="' + (l - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>').join('') +
      '<line class="cap" x1="' + gx.toFixed(1) + '" x2="' + gx.toFixed(1) + '" y1="' + top + '" y2="' + (H - bot) + '"/>' +
      Bet.BFORMATS.map((_, fi) => fi === b.format ? '' : '<polyline class="other" points="' + line(fi) + '"/>').join('') + '<polyline class="line" points="' + line(b.format) + '"/>' +
      '<circle class="you" cx="' + x(R.people).toFixed(1) + '" cy="' + y(R.tokPerUser).toFixed(1) + '" r="5"/>' +
      '<text class="ax" x="' + ((l + W - r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(t('bet.bt.axisX')) + '</text>' +
      '<text class="ax" transform="translate(11 ' + ((top + H - bot) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(t('bet.bt.axisY')) + '</text>' +
      '</svg><figcaption class="small muted">' + esc(t('bet.bt.legend')) + '</figcaption></figure>';
  }
  /* ---- the pieces' bet: one big piece, or many joined in one package; test each first, or not ---- */
  function betPieces() {
    const b = betOf(), G = Bet.PIECE_GUESSES, right = Bet.piecesAnswer();
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.pc.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-pc="' + i + '">' + esc(t('bet.pc.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.pc.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkPieces(b), P = C.P, X = Bet.PIECES_GOAL;
    const gs = [{ k: 'cost', ok: C.cheap, v: times(C.rel), target: t('bet.pc.gCost', { v: X.maxRel }), f: C.cheap ? 1 : Math.min(1, X.maxRel / C.rel) },
      { k: 'share', ok: C.works, v: t('gauge.pct', { v: Math.round(P.share * 100) }), target: t('bet.pc.gShare', { v: Math.round(X.minShare * 100) }), f: Math.min(1, P.share / X.minShare) }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.pc.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    const caught = P.state.filter(x => x === 'caught').length, missed = P.state.filter(x => x === 'missed').length;
    h += '<div class="betview" data-f2="instrument"><figure class="wafer"><canvas class="betwafer" width="320" height="320" role="img" aria-label="' + esc(t('bet.pc.waferAria', { n: P.cells.length, good: P.good, caught, missed })) + '"></canvas><figcaption class="small muted">' + esc(t('bet.pc.counts', { n: P.cells.length, good: P.good, caught, missed })) + '</figcaption></figure>' + packsSvg(P) + '</div>';
    h += '<label class="lab" for="bet-k"><b>' + esc(t('bet.pc.k')) + '</b> <output>' + esc(t(P.k === 1 ? 'bet.pc.one' : 'bet.pc.kV', { n: P.k, a: Math.round(Bet.LOGIC / P.k + (P.k > 1 ? Bet.LINK : 0)) })) + '</output></label><input type="range" id="bet-k" data-bet="k" min="0" max="' + (Bet.PIECES.length - 1) + '" step="1" value="' + b.k + '">';
    h += '<label class="lab" for="bet-test"><b>' + esc(t('bet.pc.test')) + '</b> <output>' + esc(t('bet.pc.t.' + Bet.TESTS[b.test])) + '</output></label><input type="range" id="bet-test" data-bet="test" min="0" max="' + (Bet.TESTS.length - 1) + '" step="1" value="' + b.test + '">';
    h += '<p class="small ' + (G[b.guess] === right ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === right ? 'bet.pc.right' : 'bet.pc.off', { g: t('bet.pc.g.' + G[b.guess]), r: t('bet.pc.g.' + right) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.pc.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.pc.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* the first packages off the wafer: each holds its pieces; one bad piece, or a join that fails, sinks it */
  function packsSvg(P) {
    const N = 12, L = P.packs.slice(0, N), cols = Math.ceil(Math.sqrt(P.k)), rows = Math.ceil(P.k / cols), cell = 40 / Math.max(cols, rows), W = 6 * 52, H = 2 * 56;
    const pk = (q, n) => { const x0 = (n % 6) * 52 + 4, y0 = Math.floor(n / 6) * 56 + 4;
      return '<g class="pack' + (q.ok ? '' : ' sunk') + '"><rect class="pk" x="' + x0 + '" y="' + y0 + '" width="44" height="44" rx="5"' + (q.joins ? '' : ' stroke-dasharray="3 2"') + '/>' +
        q.ids.map((id, i) => { const st = P.state[id]; return '<rect class="pc ' + st + '" x="' + (x0 + 2 + (i % cols) * cell + 0.8).toFixed(1) + '" y="' + (y0 + 2 + Math.floor(i / cols) * cell + 0.8).toFixed(1) + '" width="' + (cell - 1.6).toFixed(1) + '" height="' + (cell - 1.6).toFixed(1) + '" rx="1"/>'; }).join('') +
        (q.ok ? '' : '<path class="x" d="M' + (x0 + 8) + ' ' + (y0 + 8) + 'l28 28M' + (x0 + 36) + ' ' + (y0 + 8) + 'l-28 28"/>') + '</g>'; };
    return '<figure class="packs"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('bet.pc.packsAria', { ok: L.filter(q => q.ok).length, n: L.length })) + '">' + L.map(pk).join('') + '</svg><figcaption class="small muted">' + esc(t('bet.pc.packs', { ok: P.working, n: P.packs.length })) + '</figcaption></figure>';
  }
  return {
    draw: bet,
    after() { paintWafer(); betScene(); },
    click(e) {
      const q = s => e.target.closest(s);
      /* a bet's guess (data-guess-<bet>), then the answer it is shown beside */
      const gb = q(GUESSES.map(([k]) => '[data-guess-' + k + ']').join(',')); if (gb) { const [k, sel] = GUESSES.find(([g]) => gb.hasAttribute('data-guess-' + g)); betOf().guess = +gb.getAttribute('data-guess-' + k); ctx.save(); draw(); fx(); show(sel); return true; }
      const pb = q('[data-prove]'); if (pb) { const b = betOf(); b.proved ^= 1 << +pb.dataset.prove; ctx.save(); draw(); fx(); return true; }
      if (q('[data-reguess]')) { betOf().guess = null; ctx.save(); draw(); return true; }
      return false;
    },
    input(e) {
      const bd = e.target.closest('[data-bet]'); if (!bd) return false;
      betOf()[bd.dataset.bet] = +bd.value; ctx.save(); draw(); fx(); return true;
    }
  };
}
