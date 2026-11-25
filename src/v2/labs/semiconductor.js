/* Too hot for silicon (kind 'semiconductor', at the switch level), from src/engines/dope.js.
   Two pieces of silicon on one heater: a pure one, and one lightly doped (10^15 phosphorus atoms per cm3). Heat frees
   electrons from the crystal's own bonds (siliconPure); the doped piece adds its dopants' electrons to those, by the
   same charge balance the engine uses for doped silicon. The dial sets the heater; the silicon warms and cools
   through every temperature on the way, on real elapsed time, and each one it passed is kept in the view; the
   engine's challenge decides. A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as D from '../../engines/dope.js';
import { met } from '../../engines/fabsteps.js';
import { rng, clamp } from '../../engines/fabkit.js';

/* a power of ten, raised in the same font as its number (#373): Unicode's superscript digits are not in the site's
   fonts, so they came from a fallback font ('10-1 0'). In a figure a tspan raised by dy (the exponent ends its text, so
   nothing after it moves), in HTML a sup (src/styles/labs.css); words with a number in them are escaped around it */
const pow = n => String(n).replace('-', '−');
const supSvg = n => '<tspan class="exp" dy="-0.42em" font-size="72%">' + pow(n) + '</tspan>';
const supHtml = n => '<sup class="exp">' + pow(n) + '</sup>';
const MARK = '\u0001';
/* the same, as plain text for a screen reader's label */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻';
const supText = n => String(n).replace(/[0-9-]/g, c => SUP[c === '-' ? 10 : +c]);
const LOGN = 15, N = Math.pow(10, LOGN);                              // light doping, dopants per cm3
const [T0, T1] = D.SEMI_RANGE.T, STEP = 10;                             // the heater's range and its dial's step, kelvin
const ROOM = 300, LIMIT = 398;                                         // room temperature, and 125 °C
const X0 = 36, X1 = 292, Y0 = 14, Y1 = 150, LO = 0, HI = 18;            // the plot, and the powers of ten it spans
const SIDE = 0.5e-4, VOL = SIDE * SIDE * SIDE;                          // the cube of each panel: half a micrometre across, in cm
const ATOMS = D.siliconDoped('n', LOGN).atomsPerDopant * N * VOL;       // silicon atoms in that cube
const PW = 138, PH = 104, MAXDOTS = 700;
/* where the dots of a panel sit: fixed, so that more heat adds dots and never moves one */
const spots = (seed, n) => { const r = rng(seed); return Array.from({ length: n }, () => [(3 + r() * (PW - 6)).toFixed(1), (3 + r() * (PH - 6)).toFixed(1)]); };
const SPOTS = { pure: spots(11, MAXDOTS), heat: spots(23, MAXDOTS), dope: spots(37, Math.round(N * VOL)) };
const doped = T => N / 2 + Math.sqrt(N * N / 4 + D.ni(T) * D.ni(T));     // free electrons of the doped piece at T
/* the temperature where heat alone frees as many as the doping gave */
const CROSS = (() => { let a = T0, b = T1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (D.ni(m) < N) a = m; else b = m; } return (a + b) / 2; })();

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.semi || (view.semi = { goal: D.SEMI_DEFAULTS.T, T: D.SEMI_DEFAULTS.T });
  const seen = () => view.semiSeen || (view.semiSeen = [D.siliconPure(set().T)]);
  const won = () => met(ch.id, seen());
  const see = T => { const s = seen(); s.push(D.siliconPure(T)); if (s.length > 400) s.splice(1, 1); };
  /* the silicon moves from a to b: every step of the dial it passed on the way was seen, and so is where it is now */
  function pass(a, b) {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    for (let g = Math.ceil(lo / STEP) * STEP; g <= hi; g += STEP) see(g);
    see(b); if (won()) win();
  }
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* the heater: the silicon follows the dial on the clock (a slow screen takes bigger steps, not longer) */
  function loop(now) {
    const o = set(); if (!view.semiRun || !el.isConnected) { view.semiRun = false; return; }
    const dt = Math.min(0.5, (now - (view.semiAt || now)) / 1000); view.semiAt = now;
    const gap = o.goal - o.T, move = Math.sign(gap) * Math.min(Math.abs(gap), (60 + Math.abs(gap) * 2.4) * dt), to = Math.abs(gap - move) < 0.5 ? o.goal : o.T + move;
    pass(o.T, to); o.T = to; if (o.T === o.goal) view.semiRun = false;
    draw(); fx(); if (view.semiRun) requestAnimationFrame(loop);
  }
  function heat(goal) {
    const o = set(); o.goal = clamp(Math.round(goal / STEP) * STEP, T0, T1);
    if (still()) { pass(o.T, o.goal); o.T = o.goal; draw(); fx(); return true; }
    draw(); if (!view.semiRun && o.T !== o.goal) { view.semiRun = true; view.semiAt = null; requestAnimationFrame(loop); }
    return true;
  }

  /* a number as m × 10 to a power: as HTML (sci), or as plain text for a label (sciText) */
  const mE = v => { const e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e); return m.toFixed(1) === '10.0' ? ['1.0', e + 1] : [m.toFixed(1), e]; };
  const sci = v => { const [m, e] = mE(v); return esc(t('semi.sci', { m, e: MARK })).replace(MARK, supHtml(e)); };
  const sciText = v => { const [m, e] = mE(v); return t('semi.sci', { m, e: supText(e) }); };
  /* words with one number as HTML in them */
  const withH = (key, o, k, html) => esc(t(key, Object.assign({}, o, { [k]: MARK }))).replace(MARK, html);
  const num = v => v >= 100 ? (+v.toPrecision(2)).toLocaleString('en-US') : v >= 10 ? v.toFixed(0) : v.toFixed(1);
  const lead = n => n < N ? t('semi.lead.dope', { v: num(N / n) }) : t('semi.lead.heat', { v: num(n / N) });
  const kc = T => t('semi.kc', { k: Math.round(T), c: String(Math.round(T - 273.15)).replace('-', '−') });

  /* free electrons against temperature, on a scale of powers of ten: pure silicon climbs, the doped piece stays
     level until the pure one's curve reaches it */
  function plot(T, r) {
    const px = v => X0 + (X1 - X0) * (v - T0) / (T1 - T0), py = c => Y1 - (Y1 - Y0) * (clamp(Math.log10(c), LO, HI) - LO) / (HI - LO);
    const xs = Array.from({ length: 101 }, (_, i) => T0 + (T1 - T0) * i / 100), line = f => xs.map(v => px(v).toFixed(1) + ',' + py(f(v)).toFixed(1)).join(' ');
    const x = px(T).toFixed(1), yN = py(N), ok = won(), cx = px(CROSS);
    let s = '<svg viewBox="0 0 300 186" role="img" aria-label="' + esc(t('semi.aria', { k: Math.round(T), n: sciText(r.n) })) + '">';
    if (ok) s += '<rect class="hot" x="' + cx.toFixed(1) + '" y="' + Y0 + '" width="' + (X1 - cx).toFixed(1) + '" height="' + (Y1 - Y0) + '"/>';
    for (const p of [0, 5, 10, 15]) s += '<line class="gl" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(Math.pow(10, p)).toFixed(1) + '" y2="' + py(Math.pow(10, p)).toFixed(1) + '"/><text class="ax" x="' + (X0 - 4) + '" y="' + (py(Math.pow(10, p)) + 3.5).toFixed(1) + '" text-anchor="end">' + (p ? '10' + supSvg(p) : '1') + '</text>';
    for (const v of [200, 300, 400, 500, 600]) s += '<line class="tk" x1="' + px(v).toFixed(1) + '" x2="' + px(v).toFixed(1) + '" y1="' + Y1 + '" y2="' + (Y1 + 3) + '"/><text class="ax" x="' + px(v).toFixed(1) + '" y="' + (Y1 + 13) + '" text-anchor="middle">' + v + '</text>';
    /* two temperatures a learner knows: a room, and the hottest a chip is meant to run */
    for (const [v, k] of [[ROOM, 'room'], [LIMIT, 'limit']]) s += '<line class="mk" x1="' + px(v).toFixed(1) + '" x2="' + px(v).toFixed(1) + '" y1="' + Y0 + '" y2="' + Y1 + '"/><text class="ax" x="' + (px(v) + 4).toFixed(1) + '" y="' + (Y1 - 5) + '">' + esc(t('semi.at.' + k)) + '</text>';
    s += '<line class="lvl" x1="' + X0 + '" x2="' + X1 + '" y1="' + yN.toFixed(1) + '" y2="' + yN.toFixed(1) + '"/>' +
      '<polyline class="dop" points="' + line(doped) + '"/><polyline class="pur" points="' + line(D.ni) + '"/>' +
      '<text class="lt dopt" x="' + (X0 + 5) + '" y="' + (yN - 5).toFixed(1) + '">' + esc(t('semi.doped')) + '</text>' +
      '<text class="lt purt" x="' + (px(340) + 7).toFixed(1) + '" y="' + (py(D.ni(340)) + 13).toFixed(1) + '">' + esc(t('semi.pure')) + '</text>';
    if (ok) s += '<circle class="cr" cx="' + cx.toFixed(1) + '" cy="' + yN.toFixed(1) + '" r="6"/>';
    s += '<line class="now" x1="' + x + '" x2="' + x + '" y1="' + Y0 + '" y2="' + Y1 + '"/><circle class="dd" cx="' + x + '" cy="' + py(doped(T)).toFixed(1) + '" r="3.5"/><circle class="pd" cx="' + x + '" cy="' + py(r.n).toFixed(1) + '" r="4"/>' +
      '<text class="ax" x="' + X1 + '" y="' + (Y1 + 27) + '" text-anchor="end">' + esc(t('semi.x')) + '</text><text class="ax" x="' + X0 + '" y="' + (Y0 - 4) + '">' + esc(t('semi.y')) + '</text></svg>';
    return '<figure class="semifig" data-f2="instrument">' + s + '</figure>';
  }
  /* the same number as a thing to see: a cube of each piece half a micrometre across, every free electron in it a dot */
  function cubes(T, r) {
    const nP = r.n * VOL, nH = (doped(T) - N) * VOL, nD = SPOTS.dope.length, warm = clamp((T - ROOM) / (T1 - ROOM), 0, 1).toFixed(2);
    const dots = (list, n) => list.slice(0, Math.min(list.length, Math.round(n))).map(([x, y]) => 'M' + x + ' ' + y + 'h0').join('');
    const panel = (k, body, count) => '<div class="semicube"><svg viewBox="0 0 ' + PW + ' ' + PH + '" role="img" aria-label="' + esc(t('semi.cube.' + k) + ': ' + count) + '"><rect class="si" style="--h:' + warm + '" x="0.5" y="0.5" width="' + (PW - 1) + '" height="' + (PH - 1) + '" rx="8"/>' + body + '</svg><b>' + esc(t('semi.cube.' + k)) + '</b><span class="small muted">' + esc(count) + '</span></div>';
    const whole = v => Math.round(v).toLocaleString('en-US');
    const few = v => v >= 0.5 ? t('semi.count.heat', { n: whole(v) }) : t('semi.count.rare', { n: num(1 / v) });
    return '<div class="semicubes">' + panel('pure', '<path class="eh" d="' + dots(SPOTS.pure, nP) + '"/>', few(nP)) +
      panel('doped', '<path class="ed" d="' + dots(SPOTS.dope, nD) + '"/><path class="eh" d="' + dots(SPOTS.heat, nH) + '"/>', t('semi.count.both', { d: whole(nD), h: whole(nH) })) + '</div>' +
      '<p class="small muted semikey"><span class="k d"></span>' + esc(t('semi.key.dope')) + ' <span class="k h"></span>' + esc(t('semi.key.heat')) + ' · ' + esc(t('semi.key.cube', { a: Math.round(ATOMS / 1e9) })) + '</p>';
  }
  function goalbox(r) {
    const ok = won(), base = Math.log10(D.ni(ROOM)), f = clamp((Math.log10(r.n) - base) / (LOGN - base), 0, 1);   // from a room's count to the doping's, in powers of ten
    return '<div class="goalbox' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p><div class="gauge' + (r.n >= N ? ' ok' : '') + '"><span class="gl">' + esc(t('semi.g.own')) + '</span><span class="gv">' + sci(r.n) + ' <span class="muted">' + withH('semi.g.of', {}, 'v', '10' + supHtml(LOGN)) + '</span></span><span class="gbar"><span style="width:' + (f * 100).toFixed(0) + '%"></span></span></div></div>';
  }
  /* what is happening, in one line: which of the two decides how the silicon conducts */
  const say = (T, r) => { const k = r.n >= N ? (T > 615 ? 'over' : 'cross') : T < 250 ? 'cold' : T < 340 ? 'room' : T <= LIMIT + 2 ? 'chip' : 'hot';
    return esc(t('semi.say.' + k, { v: num(r.n < N ? N / r.n : r.n / N), b: MARK })).replace(MARK, sci(r.bondsPerCarrier)); };

  function bench() {
    const o = set(), T = o.T, r = D.siliconPure(T), ok = won();
    let h = head() + '<p class="small semiintro">' + esc(t('semi.intro', { a: Math.round(D.siliconDoped('n', LOGN).atomsPerDopant / 1e6) })) + '</p>' + goalbox(r) + plot(T, r);
    /* the dial sits between the two pictures, so that both move under the hand */
    h += '<div class="semidial"><label class="lab" for="semi-T"><b>' + esc(t('semi.set.T')) + '</b> <output>' + esc(kc(o.goal)) + '</output>' + (Math.round(T) !== o.goal ? ' <span class="small muted">' + esc(t('semi.now', { v: kc(T) })) + '</span>' : '') + '</label>' +
      '<div class="semistep"><button type="button" class="chipb" data-semi-nudge="-1" aria-label="' + esc(t('semi.cooler')) + '">−</button><input type="range" id="semi-T" data-semi="T" min="' + T0 + '" max="' + T1 + '" step="' + STEP + '" value="' + o.goal + '"><button type="button" class="chipb" data-semi-nudge="1" aria-label="' + esc(t('semi.hotter')) + '">+</button></div></div>';
    h += cubes(T, r) + '<div class="semiread">' + [['pure', sci(r.n)], ['doped', sci(doped(T))], ['lead', esc(lead(r.n))], ['bonds', withH('semi.oneIn', {}, 'n', sci(r.bondsPerCarrier))]].map(([k, v]) => '<span><span class="small muted">' + esc(t('semi.r.' + k)) + '</span><b class="mono">' + v + '</b></span>').join('') + '</div>';
    h += '<p class="small semisay">' + say(T, r) + '</p>';
    if (!ok) h += view.hint ? '<p class="small hint">' + esc(t('semi.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else if (S.done[ch.id]) h += '<p class="small good">' + withH('semi.done', {}, 'p', '10' + supHtml(LOGN)) + '</p>';
    return h + doneNote() + reward();
  }
  return {
    draw: bench,
    click(e) { const n = e.target.closest('[data-semi-nudge]'); return n ? heat(set().goal + STEP * +n.dataset.semiNudge) : false; },
    input(e) { const r = e.target.closest('[data-semi]'); return r ? heat(+r.value) : false; }
  };
}
