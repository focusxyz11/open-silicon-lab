/* The clock and the power (src/engines/clockpower.js): why chips cannot just run faster. Two labs of the challenge
   player (src/v2/play.js), both inside the data centre's chip:
   'powercurve' (the challenge 'power-curve', at the block): power against the clock for a few voltages, the frontier
     (the least power each clock can run on), the budget line and the point you are at; won by the engine's halfPower.
   'counter' (the challenge 'counter', at the gate): a four-bit counter as its flip-flops and the gates between them, the
     signal racing the next tick, and twenty ticks of waveforms in slow motion that go wrong when the tick comes
     before the slowest path ends; won by the engine's speedLimit, from the runs the player made.
   lab(L) gets the player's pieces and returns { draw, click, input }. What the player tried is kept in the view. */
import { still } from '../../core/ui.js';
import * as CP from '../../engines/clockpower.js';

const A = 0.15;                                                       // the share of the switches that flip each tick (the challenge's)
const HALF = 25.5, FGOAL = 2.2, START = { v: 0.75, f: 3 };            // the engine's halfPower: under 25.5 W at 2.2 GHz or more
const VOLTS = [0.6, 0.75, 0.9, 1.1];                                   // the voltages drawn as lines
const CYCLES = 20, RUN_MS = 5000;                                      // a run: twenty ticks, in five seconds on screen
const f1 = v => v.toFixed(1), n0 = v => Math.round(v).toLocaleString('en');

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const hintLine = (key, met) => met ? '' : view.hint ? '<p class="small hint">' + esc(t(key)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
  const gauges = (ok, gs) => '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + (g.c ? ' ' + g.c : '') + '"><span class="gl">' + esc(g.l) + '</span><span class="gv">' + esc(g.v) + (g.target ? ' <span class="muted">' + esc(g.target) + '</span>' : '') + '</span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  const dial = (id, label, value, R, val) => '<div class="ckpdial"><label class="lab" for="ckp-' + id + '"><b>' + esc(label) + '</b> <output>' + esc(value) + '</output></label><div class="ckpstep"><button type="button" class="chipb" data-ckp-nudge="' + id + ':-1" aria-label="' + esc(t('ckp.less')) + '">−</button><input type="range" id="ckp-' + id + '" data-ckp="' + id + '" min="' + R.min + '" max="' + R.max + '" step="' + R.step + '" value="' + val + '"><button type="button" class="chipb" data-ckp-nudge="' + id + ':1" aria-label="' + esc(t('ckp.more')) + '">+</button></div></div>';
  const reads = rows => '<div class="ckpread">' + rows.map(([k, v, c]) => '<span><span class="small muted">' + esc(t('ckp.r.' + k)) + '</span><b class="mono' + (c ? ' ' + c : '') + '">' + esc(v) + '</b></span>').join('') + '</div>';

  /* ================= the power curve ================= */
  const pset = () => view.pc || (view.pc = { v: START.v, f: START.f });
  const pmet = o => CP.CHALLENGES.halfPower.check({ a: A, v: o.v, f: o.f });
  function psee() { const o = pset(); if (pmet(o)) win(); }
  function pfigure(o, p) {
    const W = 320, H = 250, X0 = 34, X1 = 312, Y0 = 12, Y1 = 214, F0 = 0.5, F1 = 4.5, PMAX = 120;
    const px = f => X0 + (X1 - X0) * (f - F0) / (F1 - F0), py = w => Y1 - (Y1 - Y0) * Math.min(PMAX, Math.max(0, w)) / PMAX;
    const pt = (f, w) => px(f).toFixed(1) + ',' + py(w).toFixed(1), at = (v, f) => CP.power(A, v, f).total;
    const fr = CP.frontier(A, 0.04), top = CP.fmax(CP.VMAX), last = { f: top, w: at(CP.VMAX, top) };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('ckp.p.aria', { f: o.f.toFixed(2), v: o.v.toFixed(2), w: f1(p.total) })) + '">';
    s += '<clipPath id="ckpclip"><rect x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '"/></clipPath>';
    for (const w of [0, 25, 50, 75, 100]) s += '<line class="gl" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(w).toFixed(1) + '" y2="' + py(w).toFixed(1) + '"/><text class="ax" x="' + (X0 - 4) + '" y="' + (py(w) + 3.5).toFixed(1) + '" text-anchor="end">' + w + '</text>';
    for (const f of [1, 2, 3, 4]) s += '<line class="tk" x1="' + px(f).toFixed(1) + '" x2="' + px(f).toFixed(1) + '" y1="' + Y1 + '" y2="' + (Y1 + 3) + '"/><text class="ax" x="' + px(f).toFixed(1) + '" y="' + (Y1 + 13) + '" text-anchor="middle">' + f + '</text>';
    /* what no voltage can run: under the frontier, and past the fastest clock the highest voltage allows */
    const raw = (f, w) => px(f).toFixed(1) + ',' + (Y1 - (Y1 - Y0) * w / PMAX).toFixed(1), frLine = fr.map(q => raw(q.f, q.w)).concat(raw(last.f, last.w)).join(' ');
    s += '<g clip-path="url(#ckpclip)"><polygon class="no" points="' + pt(F0, 0) + ' ' + frLine + ' ' + px(top).toFixed(1) + ',-400 ' + X1 + ',-400 ' + X1 + ',' + Y1 + '"/></g>' +
      '<text class="ax not" x="' + px(3.7).toFixed(1) + '" y="' + py(9).toFixed(1) + '" text-anchor="middle">' + esc(t('ckp.p.cant')) + '</text>';
    /* one line a voltage, ending where its gates get too slow */
    for (const v of VOLTS) { const fm = CP.fmax(v), e = at(v, fm), out = e > PMAX, fx = out ? (PMAX - CP.leak(v)) / CP.power(A, v, 1).dyn : fm;
      s += '<line class="vl" clip-path="url(#ckpclip)" x1="' + raw(F0, at(v, F0)).replace(',', '" y1="') + '" x2="' + raw(fm, e).replace(',', '" y2="') + '"/>' +
        '<text class="ax vt" x="' + (px(fx) - 5).toFixed(1) + '" y="' + (out ? Y0 + 9 : py(e) - 5).toFixed(1) + '" text-anchor="end">' + esc(t('ckp.volt', { v: v.toFixed(v === 0.75 ? 2 : 1) })) + '</text>'; }
    s += '<polyline class="fr" clip-path="url(#ckpclip)" points="' + frLine + '"/>';
    /* half the power, and the clock to keep */
    s += '<line class="bud" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(HALF).toFixed(1) + '" y2="' + py(HALF).toFixed(1) + '"/><text class="ax budt" x="' + (X1 - 3) + '" y="' + (py(HALF) - 4).toFixed(1) + '" text-anchor="end">' + esc(t('ckp.p.budget', { w: HALF })) + '</text>' +
      '<line class="bud" x1="' + px(FGOAL).toFixed(1) + '" x2="' + px(FGOAL).toFixed(1) + '" y1="' + py(HALF).toFixed(1) + '" y2="' + Y1 + '"/><path class="aim" d="M' + px(FGOAL).toFixed(1) + ' ' + (Y1 + 1) + 'l-4 6h8z"/>';
    /* where the chip started */
    s += '<circle class="st" cx="' + px(START.f).toFixed(1) + '" cy="' + py(51).toFixed(1) + '" r="4"/><text class="ax" x="' + (px(START.f) + 7).toFixed(1) + '" y="' + (py(51) + 10).toFixed(1) + '">' + esc(t('ckp.p.start')) + '</text>';
    /* your voltage's line: solid as far as it runs, broken beyond; and the point you are at */
    const fm = Math.min(F1, CP.fmax(o.v)), cls = !p.ok ? 'bad' : pmet(o) ? 'good' : 'run';
    const ln = (c, fa, fb) => '<line class="' + c + '" x1="' + raw(fa, at(o.v, fa)).replace(',', '" y1="') + '" x2="' + raw(fb, at(o.v, fb)).replace(',', '" y2="') + '"/>';
    s += '<g clip-path="url(#ckpclip)">' + ln('me', F0, Math.max(F0, fm)) + (fm < F1 ? ln('me off', Math.max(F0, fm), F1) : '') + '</g>';
    s += '<line class="drop" x1="' + px(o.f).toFixed(1) + '" x2="' + px(o.f).toFixed(1) + '" y1="' + py(p.total).toFixed(1) + '" y2="' + Y1 + '"/>' +
      '<circle class="dot ' + cls + '" cx="' + px(o.f).toFixed(1) + '" cy="' + py(p.total).toFixed(1) + '" r="5.5"/>' +
      (p.ok ? '' : '<path class="xx" d="M' + (px(o.f) - 2.6).toFixed(1) + ' ' + (py(p.total) - 2.6).toFixed(1) + 'l5.2 5.2m0 -5.2l-5.2 5.2"/>');
    s += '<text class="ax" x="' + ((X0 + X1) / 2) + '" y="' + (Y1 + 28) + '" text-anchor="middle">' + esc(t('ckp.p.x')) + '</text><text class="ax" x="' + (X0 - 26) + '" y="' + (Y0 - 3) + '">' + esc(t('ckp.p.y')) + '</text></svg>';
    return '<figure class="ckpfig" data-f2="instrument">' + s + '<figcaption class="small muted">' + esc(t('ckp.p.legend')) + '</figcaption></figure>';
  }
  /* one tick against the slowest path at this voltage: why a voltage runs a clock or not */
  function ptick(o, p) {
    const per = 1000 / o.f, path = 1000 / p.fmaxAtV, top = Math.max(per, path), bar = (k, v, c) => '<div class="ckprow"><span class="small">' + esc(t('ckp.p.' + k, { v: o.v.toFixed(2) })) + '</span><span class="ckpbar"><span class="' + c + '" style="width:' + (v / top * 100).toFixed(1) + '%"></span></span><b class="mono small">' + esc(t('ckp.ps', { v: n0(v) })) + '</b></div>';
    return '<div class="ckptick">' + bar('tick', per, 'tick') + bar('path', path, p.ok ? 'ok' : 'late') + '</div>';
  }
  function pbench() {
    const o = pset(), p = CP.power(A, o.v, o.f), R = CP.POWER_INPUTS, met = pmet(o), ok = met || !!S.done[ch.id];
    let h = head() + '<p class="small ckpintro">' + esc(t('ckp.p.intro')) + '</p>';
    h += gauges(ok, [
      { l: t('ckp.p.g.clock'), ok: o.f >= FGOAL, v: t('ckp.ghz', { v: o.f.toFixed(2) }), target: t('ckp.p.t.clock', { v: FGOAL }), f: Math.min(1, o.f / FGOAL) },
      { l: t('ckp.p.g.power'), ok: p.total < HALF, v: t('ckp.watt', { v: f1(p.total) }), target: t('ckp.p.t.power', { v: HALF }), f: Math.min(1, HALF / p.total) },
      { l: t('ckp.p.g.runs'), ok: p.ok, v: t(p.ok ? 'ckp.yes' : 'ckp.no'), target: '', f: p.ok ? 1 : Math.min(0.95, p.fmaxAtV / o.f), c: 'ckpwide' }]);
    h += pfigure(o, p) + ptick(o, p);
    h += '<p class="small ckpsay ' + (p.ok ? (met ? 'good' : '') : 'bad') + '">' + esc(t('ckp.p.' + p.status, { f: p.fmaxAtV.toFixed(2), v: p.status === 'fails' ? CP.lowestSafe(o.f).toFixed(2) : o.v.toFixed(2) })) + '</p>';
    h += dial('f', t('ckp.p.set.f'), t('ckp.ghz', { v: o.f.toFixed(2) }), R.f, o.f) + dial('v', t('ckp.p.set.v'), t('ckp.volt', { v: o.v.toFixed(2) }), R.v, o.v);
    h += reads([['dyn', t('ckp.watt', { v: f1(p.dyn) })], ['leak', t('ckp.watt', { v: f1(p.leak) })], ['total', t('ckp.watt', { v: f1(p.total) })], ['energy', t('ckp.nj', { v: f1(p.energyNJ) })]]);
    h += hintLine('ckp.p.hint', ok);
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('ckp.p.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('ckp.p.note')) + '</p>' + doneNote() + reward();
  }

  /* ================= the counter that fails ================= */
  const cset = () => view.ck || (view.ck = { node: CP.COUNTER_START.node, s: CP.COUNTER_START.slider, T: null, running: false, runs: [] });
  /* the run at these dials, simulated once and kept */
  function crun(o) { const key = o.node + ':' + o.s; if (!view.ckR || view.ckR.key !== key) view.ckR = Object.assign({ key, hz: CP.hzOfSlider(o.node, o.s) }, CP.counterStatus(o.node, CP.hzOfSlider(o.node, o.s))); return view.ckR; }
  const tops = o => { const m = {}; for (const r of o.runs) if (r.top && !(r.node in m)) m[r.node] = r; return m; };
  const hzText = hz => hz >= 1e9 ? t('ckp.ghz', { v: (hz / 1e9).toFixed(2) }) : t('ckp.mhz', { v: n0(hz / 1e6) });
  function cend(o) {
    const R = crun(o); o.running = false; o.T = R.run.sim.tEnd;
    if (!o.runs.some(r => r.node === o.node && r.hz === R.hz)) o.runs.push({ node: o.node, hz: R.hz, top: R.top });
    if (o.runs.length > 200) o.runs.splice(0, o.runs.length - 200);
    if (CP.CHALLENGES.speedLimit.check(o.runs.filter(r => r.top))) win();
  }
  const cloop = now => { const o = cset();
    if (!o.running || !el.isConnected) { o.running = false; return; }
    /* time follows the clock on the wall, so a slow screen shows the same run in the same time, in bigger steps */
    const dt = Math.min(1000, now - (view.ckT || now)), R = crun(o); view.ckT = now;
    o.T = (o.T || 0) + dt / RUN_MS * R.run.sim.tEnd;
    if (o.T >= R.run.sim.tEnd) cend(o);
    draw(); fx(); if (o.running) requestAnimationFrame(cloop); };
  function cstart(o) {
    o.T = 0; view.ckT = null;
    if (still()) { cend(o); draw(); fx(); return; }
    o.running = true; draw(); requestAnimationFrame(cloop);
  }
  const clear = o => { o.running = false; o.T = null; };

  function cfigure(o, R) {
    /* on a phone the words keep a readable size: the names left of the waves get a wider column, and the twenty counts
       stand in a zigzag, every other one a little lower, so two figures never run into each other (#374) */
    const narrow = typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches, zig = k => narrow && k % 2 ? 10 : 0, gap = narrow ? 22 : 12;
    const W = 320, H = narrow ? 226 : 204, TM = R.timing, run = R.run, sim = run.sim, per = run.per, P = TM.period, T = o.T, on = T != null, end = on && !o.running;
    const TX = 46, K = 266 / (1.6 * P), ty = 26, th = 22, xe = TX + P * K, far = per > 1.6 * P, xt = TX + Math.min(per, 1.6 * P) * K;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('ckp.c.aria', { per: n0(per), path: n0(P), n: end ? run.errors : 0 })) + '">';
    /* ---- the race: the flip-flops, the gates between them, and the next tick ---- */
    const bit = i => on ? sim.at(CP.qOf(i), Math.min(T, sim.tEnd)) : 0;
    s += '<rect class="reg" x="10" y="14" width="24" height="46" rx="3"/>';
    for (let i = 0; i < 4; i++) s += '<rect class="cell' + (bit(i) === 1 ? ' on' : '') + '" x="13" y="' + (17 + (3 - i) * 10) + '" width="18" height="8" rx="1.5"/>';
    s += '<path class="ckin" d="M18 60l4 -4l4 4"/><path class="wire" d="M34 37H' + TX + '"/>';
    /* the top speed: the tick just after the race ends, no more than a tenth late */
    s += '<rect class="band" x="' + xe.toFixed(1) + '" y="' + (ty - 6) + '" width="' + (P * K / 9).toFixed(1) + '" height="' + (th + 12) + '" rx="2"/>';
    /* the slowest path, one piece a delay: out of the flip-flops, two ANDs and an XOR (the carry), and back in */
    const segs = [['out', TM.clkToQ], ...TM.steps.map(([g, d]) => [g, d]), ['in', TM.setup]]; let x = TX;
    /* how far the signal has come since the last tick */
    let tau = null; if (on && !end) { let e0 = null; for (const e of run.edges) if (e <= T) e0 = e; if (e0 != null) tau = T - e0; }
    const k0 = on && !end ? run.edges.filter(e => e <= T).length : -1;                 // the tick this race runs toward
    const lost = per < P, bad = k0 >= 0 && k0 < CYCLES && run.wrong[k0];
    for (const [g, d] of segs) { const w = d * K, cx = x + w / 2, cy = ty + th / 2;
      s += '<rect class="seg' + (g === 'out' || g === 'in' ? ' ff' : '') + '" x="' + x.toFixed(1) + '" y="' + ty + '" width="' + w.toFixed(1) + '" height="' + th + '"/>';
      if (g === 'AND') s += '<path class="gate" d="M' + (cx - 6).toFixed(1) + ' ' + (cy - 6.5) + 'h5.5a6.5 6.5 0 0 1 0 13h-5.5z"/>';
      else if (g === 'XOR' || g === 'NOT') s += '<path class="gate" d="M' + (cx - 5).toFixed(1) + ' ' + (cy - 6.5) + 'q4.2 6.5 0 13q9.5 0 13 -6.5q-3.5 -6.5 -13 -6.5z"/><path class="gate open" d="M' + (cx - 8).toFixed(1) + ' ' + (cy - 6.5) + 'q4.2 6.5 0 13"/>';
      else s += '<text class="ax in" x="' + cx.toFixed(1) + '" y="' + (cy + 3) + '" text-anchor="middle">' + esc(t('ckp.c.seg.' + g)) + '</text>';
      x += w; }
    if (lost) s += '<rect class="cut" x="' + xt.toFixed(1) + '" y="' + ty + '" width="' + (xe - xt).toFixed(1) + '" height="' + th + '"/>';
    if (tau != null) { const xf = TX + Math.min(tau, P, per) * K, home = tau >= P;
      s += '<rect class="gone' + (bad ? ' bad' : '') + '" x="' + TX + '" y="' + ty + '" width="' + (xf - TX).toFixed(1) + '" height="' + th + '"/><circle class="front ' + (bad ? 'bad' : home ? 'good' : '') + '" cx="' + xf.toFixed(1) + '" cy="' + (ty + th / 2) + '" r="4.5"/>'; }
    /* back into the flip-flops */
    s += '<path class="wire" d="M' + xe.toFixed(1) + ' 37h5v29H3V37h4"/><path class="arrow" d="M6 34l4.5 3l-4.5 3z"/>' +
      '<text class="ax" x="' + xe.toFixed(1) + '" y="78" text-anchor="end">' + esc(t('ckp.c.path', { v: n0(P) })) + '</text>';
    /* the next tick */
    s += '<line class="tick' + (lost ? ' bad' : '') + (far ? ' far' : '') + '" x1="' + xt.toFixed(1) + '" x2="' + xt.toFixed(1) + '" y1="13" y2="70"/>' +
      '<text class="ax tt' + (lost ? ' bad' : '') + '" x="' + (xt > 230 ? xt - 4 : xt + 4).toFixed(1) + '" y="10" text-anchor="' + (xt > 230 ? 'end' : 'start') + '">' + esc(t(far ? 'ckp.c.tickFar' : 'ckp.c.tick', { v: n0(per) })) + '</text>';
    /* ---- twenty ticks: the clock, the four bits, and the count read at each tick ---- */
    const WX0 = narrow ? 58 : 46, WX1 = 314, WY = 88, RH = 15, wx = tt => WX0 + (WX1 - WX0) * tt / sim.tEnd, upto = on ? Math.min(T, sim.tEnd) : 0;
    const wave = (w, lim, row) => { const lo = WY + row * RH + 12, hi = lo - 9, y = v => v === 1 ? hi : v === 0 ? lo : (lo + hi) / 2; let d = 'M' + WX0 + ' ' + y(w[0][1]);
      for (let i = 1; i < w.length && w[i][0] <= lim; i++) { d += 'H' + wx(w[i][0]).toFixed(1) + 'V' + y(w[i][1]); }
      return d + 'H' + wx(lim).toFixed(1); };
    const names = [t('ckp.c.clk')].concat([0, 1, 2, 3].map(i => t('ckp.c.bit', { n: i })));
    names.forEach((n, r) => { s += '<text class="ax" x="' + (WX0 - 5) + '" y="' + (WY + r * RH + 11) + '" text-anchor="end">' + esc(n) + '</text><line class="base" x1="' + WX0 + '" x2="' + WX1 + '" y1="' + (WY + r * RH + 12) + '" y2="' + (WY + r * RH + 12) + '"/>'; });
    run.edges.forEach((e, k) => { s += '<line class="edge' + (on && e <= upto && run.wrong[k] ? ' bad' : '') + '" x1="' + wx(e).toFixed(1) + '" x2="' + wx(e).toFixed(1) + '" y1="' + (WY + 2) + '" y2="' + (WY + 5 * RH) + '"/>'; });
    s += '<path class="wv clk" d="' + wave(sim.waves.CLK, sim.tEnd, 0) + '"/>';
    if (on) for (let i = 0; i < 4; i++) s += '<path class="wv" d="' + wave(sim.waves[CP.qOf(i)], upto, i + 1) + '"/>';
    if (on && !end) s += '<line class="cur" x1="' + wx(upto).toFixed(1) + '" x2="' + wx(upto).toFixed(1) + '" y1="' + WY + '" y2="' + (WY + 5 * RH + 18 + gap + (narrow ? 10 : 0)) + '"/>';
    /* the count each tick stored, under the count it should be */
    const cy0 = WY + 5 * RH + 14;
    const ly = narrow ? 5 : 0;
    s += '<text class="ax" x="' + (WX0 - 5) + '" y="' + (cy0 + ly) + '" text-anchor="end">' + esc(t('ckp.c.count')) + '</text><text class="ax" x="' + (WX0 - 5) + '" y="' + (cy0 + gap + ly) + '" text-anchor="end">' + esc(t('ckp.c.right')) + '</text>';
    run.edges.forEach((e, k) => { const cx = wx(e + per / 2).toFixed(1), shown = on && upto >= Math.min(sim.tEnd, e + per * 0.9);
      if (shown) s += '<text class="num' + (run.wrong[k] ? ' bad' : '') + '" x="' + cx + '" y="' + (cy0 + zig(k)) + '" text-anchor="middle">' + (run.values[k] == null ? '?' : run.values[k]) + '</text>';
      s += '<text class="num want" x="' + cx + '" y="' + (cy0 + gap + zig(k)) + '" text-anchor="middle">' + run.expected[k] + '</text>'; });
    return '<figure class="ckpfig ckpc" data-f2="instrument">' + s + '</svg><figcaption class="small muted">' + esc(t('ckp.c.legend')) + '</figcaption></figure>';
  }
  function cbench() {
    const o = cset(), R = crun(o), TM = R.timing, per = R.run.per, top = tops(o), got = Object.values(top), ok = got.length >= 2 || !!S.done[ch.id], end = o.T != null && !o.running;
    const g = i => ({ l: t('ckp.c.g.' + i), ok: !!got[i], v: got[i] ? t('ckp.c.at', { node: t('ckp.node', { v: got[i].node }), hz: hzText(got[i].hz) }) : t('ckp.c.notyet'), target: '', f: got[i] ? 1 : 0 });
    let h = head() + '<p class="small ckpintro">' + esc(t('ckp.c.intro')) + '</p>' + gauges(ok, [g(0), g(1)]) + cfigure(o, R);
    const say = !end ? (o.running ? 'running' : 'ready') : R.status === 'top' && o.node === '3' ? 'top3' : R.status;
    h += '<p class="small ckpsay ' + (end && R.status === 'errors' ? 'bad' : end && R.status === 'top' ? 'good' : '') + '">' + esc(t('ckp.c.say.' + say, { n: R.errors, of: CYCLES })) + '</p>';
    h += '<p class="kicker">' + esc(t('ckp.c.set.node')) + '</p><div class="chips">' + CP.COUNTER_NODES.map(n => '<button type="button" class="chipb' + (o.node === n ? ' on' : '') + '" data-ckp-node="' + n + '"' + (top[n] ? ' data-top="1"' : '') + ' aria-pressed="' + (o.node === n) + '">' + esc(t('ckp.node', { v: n })) + (top[n] ? ' ✓' : '') + '</button>').join('') + '</div><p class="small muted ckpsub">' + esc(t('ckp.c.set.nodeD')) + '</p>';
    h += dial('hz', t('ckp.c.set.hz'), hzText(R.hz), { min: 0, max: 100, step: 1 }, o.s);
    h += '<div class="chips"><button type="button" class="btn primary" data-ckp-run aria-pressed="' + !!o.running + '"' + (o.running ? ' disabled' : '') + '>' + esc(t(end ? 'ckp.c.again' : 'ckp.c.run')) + '</button></div>';
    h += reads([['clock', hzText(R.hz)], ['tick', t('ckp.ps', { v: n0(per) })], ['path', t('ckp.ps', { v: n0(TM.period) })], ['wrong', end ? t('ckp.c.of', { n: R.errors, of: CYCLES }) : t('ckp.c.none'), end ? (R.errors ? 'bad' : 'good') : '']]);
    h += hintLine('ckp.c.hint', ok);
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('ckp.c.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('ckp.c.note')) + '</p>' + doneNote() + reward();
  }

  const isP = ch.kind === 'powercurve';
  const clamp = (inp, v) => Math.min(+inp.max, Math.max(+inp.min, +v.toFixed(2)));
  /* a dial moved: the power curve answers at once; the counter forgets its last run and waits to be run */
  function setDial(k, v) {
    if (isP) { const o = pset(); if (o[k] === v) return; o[k] = v; psee(); }
    else { const o = cset(); if (o.s === v) return; o.s = v; clear(o); }
    draw(); fx();
  }
  return {
    draw: isP ? pbench : cbench,
    click(e) { const q = s => e.target.closest(s);
      const n = q('[data-ckp-nudge]'); if (n) { const [k, d] = n.dataset.ckpNudge.split(':'), inp = el.querySelector('#ckp-' + k), cur = isP ? pset()[k] : cset().s; setDial(isP ? k : 'hz', clamp(inp, cur + +inp.step * +d)); return true; }
      if (isP) return false;
      const o = cset(), nd = q('[data-ckp-node]');
      if (nd) { if (o.node !== nd.dataset.ckpNode) { o.node = nd.dataset.ckpNode; clear(o); draw(); fx(); } return true; }
      if (q('[data-ckp-run]')) { if (!o.running) cstart(o); return true; }
      return false; },
    input(e) { const r = e.target.closest('[data-ckp]'); if (!r) return false; setDial(r.dataset.ckp, +r.value); return true; }
  };
}
