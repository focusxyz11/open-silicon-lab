/* Multiply as it travels (kind 'light', at the chip's links), from src/engines/paradigms.js: the core questions "Fight
   or use physics" and "Where things are". A number rides on light as its brightness. A Mach-Zehnder interferometer
   splits the light in two, delays one half by a phase set with a heater, and joins the halves again: they add or
   cancel, and the share that leaves the top is a weight, multiplied in as the light passes. First a guess (both arms
   the same: where does the light come out?), then the reveal; then two dials, the phase and the phase noise (heat and
   drift shift it on every pass). The goal is the engine's own check (lightGoal): a weight of a quarter, exact on at
   least 90% of 200 passes at this noise and no longer at one step more: the noise where it stops being exact. How sure
   each claim about light is comes from the matter it models (src/data/inventions.js light).
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as P from '../../engines/paradigms.js';
import { matterOf } from '../../data/inventions.js';
import { claimList } from '../fid.js';
import { needWords } from '../../core/i18n.js';

export const GOAL = 'quarter', TARGET = P.PHOTONIC_TARGETS[GOAL];
export const START = { th: 0, n: 0 };
export const RANGE = { th: [0, 360, 2.5], n: [0, P.LIGHT_NOISES.length - 1, 1] };
/* three numbers sent through, as brightness */
export const PULSES = [0.9, 0.6, 0.3];
/* the guess: where light put into the top comes out when both arms are the same; the answer is the engine's */
export const GUESSES = ['top', 'bottom', 'half'];
export function answer() { const p = P.mzi([1, 0], 0, 0).power; return p[0] > 0.9 ? 'top' : p[1] > 0.9 ? 'bottom' : 'half'; }
/* the engine's results, kept by their settings */
const GOALS = {};
export const goalOf = (th, n) => { const k = th + ':' + n; return GOALS[k] || (GOALS[k] = P.lightGoal({ goal: GOAL, theta: P.rad(th), noise: n })); };
/* the most noise (degrees) a weight stays exact at, for the phase that sets it (null: not exact even without noise) */
export function edgeOf(goal, th) {
  let at = null; for (const d of P.LIGHT_NOISES) { if (P.lightExact({ goal, theta: P.rad(th), noise: P.rad(d) }) >= P.LIGHT_EXACT) at = d; else break; }
  return at;
}
/* the phase that sends a share to the top: top = sin²(θ/2) */
export const phaseFor = share => 2 * Math.asin(Math.sqrt(share)) * 180 / Math.PI;

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.lgt || (view.lgt = Object.assign({ guess: null }, START));
  const pct = v => t('lgt.pct', { v: Math.round(v * 100) });
  const deg = v => t('lgt.deg', { v: Number.isInteger(v) ? v : v.toFixed(1) });
  if (!view.lgtWords) { view.lgtWords = 1; needWords('pages').then(() => { view.lgtWords = 2; if (el.isConnected) draw(); }); }

  function figure(o, G) {
    const shown = o.guess != null, p = P.mzi([1, 0], P.rad(o.th), 0).power, Wd = 380, H = 250, X = 44;
    let s = '<svg viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="' + esc(shown ? t('lgt.aria', { th: deg(o.th), top: pct(p[0]), n: deg(P.LIGHT_NOISES[o.n]), e: pct(G.exact) }) : t('lgt.ariaHid')) + '">';
    /* the interferometer: two waveguides that meet in a splitter, part into two arms (a heater on the top one sets its
       phase), and meet in a second splitter; the light drawn as bright as its power on each stretch */
    const seg = {
      inT: 'M8 40H50C70 40 70 61 88 61H98', inB: 'M8 92H50C70 92 70 71 88 71H98',
      armT: 'M98 61H104C124 61 124 36 144 36H176C196 36 196 61 214 61H222', armB: 'M98 71H104C124 71 124 96 144 96H176C196 96 196 71 214 71H222',
      outT: 'M222 61H228C248 61 248 40 268 40H292', outB: 'M222 71H228C248 71 248 92 268 92H292'
    };
    const pw = { inT: 1, inB: 0, armT: 0.5, armB: 0.5, outT: shown ? p[0] : 0, outB: shown ? p[1] : 0 };
    s += '<g transform="translate(' + X + ' 0)">' + Object.values(seg).map(d => '<path class="guide" d="' + d + '"/>').join('');
    for (const [k, d] of Object.entries(seg)) if (pw[k] > 0.004) s += '<path class="beam halo" d="' + d + '" stroke-width="' + (3 + 7 * pw[k]).toFixed(1) + '" opacity="' + (0.1 + 0.25 * pw[k]).toFixed(2) + '"/><path class="beam" d="' + d + '" stroke-width="' + (1 + 2.2 * pw[k]).toFixed(1) + '" opacity="' + (0.25 + 0.75 * pw[k]).toFixed(2) + '"/>';
    s += '<rect class="split" x="82" y="56" width="22" height="20" rx="4"/><rect class="split" x="206" y="56" width="22" height="20" rx="4"/>' +
      '<text class="ax" x="93" y="112" text-anchor="middle">' + esc(t('lgt.fig.split')) + '</text><text class="ax" x="217" y="112" text-anchor="middle">' + esc(t('lgt.fig.split')) + '</text>';
    /* the heater: warmer as the phase it adds grows */
    s += '<rect class="heat" x="146" y="25" width="28" height="7" rx="2" opacity="' + (0.25 + 0.75 * o.th / 360).toFixed(2) + '"/><text class="ax" x="160" y="17" text-anchor="middle">' + esc(t('lgt.fig.phase', { v: deg(o.th) })) + '</text></g>';
    s += '<text class="ax" x="' + (X + 8) + '" y="30">' + esc(t('lgt.fig.in')) + '</text>' +
      '<text class="ax lv' + (shown ? '' : ' hid') + '" x="' + (Wd - 4) + '" y="30" text-anchor="end">' + esc(t('lgt.fig.top', { v: shown ? pct(p[0]) : '?' })) + '</text>' +
      '<text class="ax lv' + (shown ? '' : ' hid') + '" x="' + (Wd - 4) + '" y="108" text-anchor="end">' + esc(t('lgt.fig.bottom', { v: shown ? pct(p[1]) : '?' })) + '</text>';
    /* the multiply: three numbers as brightness in, each times the weight out of the top */
    const ym = 146, xi = i => 40 + i * 32, xo = i => 276 + i * 32;
    s += '<text class="ax" x="' + xi(1) + '" y="' + (ym - 17) + '" text-anchor="middle">' + esc(t('lgt.fig.mulIn')) + '</text><text class="ax" x="' + xo(1) + '" y="' + (ym - 17) + '" text-anchor="middle">' + esc(t('lgt.fig.mulOut')) + '</text>';
    PULSES.forEach((x, i) => { const out = x * p[0];
      s += '<circle class="pulse" cx="' + xi(i) + '" cy="' + ym + '" r="' + (2 + 7 * Math.sqrt(x)).toFixed(1) + '" opacity="' + (0.3 + 0.7 * x).toFixed(2) + '"/><text class="num" x="' + xi(i) + '" y="' + (ym + 22) + '" text-anchor="middle">' + x.toFixed(2) + '</text>';
      if (shown) s += '<circle class="pulse" cx="' + xo(i) + '" cy="' + ym + '" r="' + (out < 0.004 ? 0.8 : 2 + 7 * Math.sqrt(out)).toFixed(1) + '" opacity="' + (0.3 + 0.7 * Math.min(1, out)).toFixed(2) + '"/><text class="num" x="' + xo(i) + '" y="' + (ym + 22) + '" text-anchor="middle">' + out.toFixed(2) + '</text>'; });
    s += '<text class="times" x="190" y="' + (ym + 5) + '" text-anchor="middle">' + esc(t('lgt.fig.times', { w: shown ? p[0].toFixed(2) : '?' })) + '</text><path class="arrow" d="M132 ' + ym + 'H150M230 ' + ym + 'H250M246 ' + (ym - 3) + 'L250 ' + ym + 'L246 ' + (ym + 3) + '"/>';
    /* the passes: where each of 200 lands at this noise, on a close-up of the shares around the target, the band of exact around it */
    const LO = TARGET - 0.15, HI = TARGET + 0.15, x0 = 14, x1 = Wd - 14, xs = v => (x0 + (x1 - x0) * (Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)).toFixed(1), y0 = 194, y1 = 226;
    s += '<text class="ax" x="' + x0 + '" y="' + (y0 - 8) + '">' + esc(t('lgt.fig.passes', { n: P.LIGHT_RUNS, v: deg(P.LIGHT_NOISES[o.n]) })) + '</text>';
    s += '<rect class="band" x="' + xs(TARGET - 0.03) + '" y="' + y0 + '" width="' + (xs(TARGET + 0.03) - xs(TARGET - 0.03)).toFixed(1) + '" height="' + (y1 - y0) + '"/><line class="aim" x1="' + xs(TARGET) + '" x2="' + xs(TARGET) + '" y1="' + (y0 - 2) + '" y2="' + (y1 + 2) + '"/>';
    s += '<line class="axis" x1="' + x0 + '" x2="' + x1 + '" y1="' + y1 + '" y2="' + y1 + '"/>';
    [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4].forEach(v => { s += '<line class="axis" x1="' + xs(v) + '" x2="' + xs(v) + '" y1="' + y1 + '" y2="' + (y1 + 3) + '"/><text class="ax" x="' + xs(v) + '" y="' + (y1 + 14) + '" text-anchor="middle">' + esc(pct(v)) + '</text>'; });
    if (shown) {
      P.lightPasses({ theta: P.rad(o.th), noise: P.rad(P.LIGHT_NOISES[o.n]) }).forEach((v, k) => { const jy = y0 + 3 + ((k * 37) % 29) / 29 * (y1 - y0 - 6), ok = Math.abs(v - TARGET) < 0.03;
        s += '<circle class="pass' + (ok ? ' ok' : '') + '" cx="' + xs(v) + '" cy="' + jy.toFixed(1) + '" r="1.6"/>'; });
      s += '<text class="exact' + (G.holds ? ' good' : ' bad') + '" x="' + x1 + '" y="' + (y0 - 8) + '" text-anchor="end">' + esc(t('lgt.fig.exact', { v: pct(G.exact) })) + '</text>';
    }
    s += '</svg>';
    return '<figure class="lgtfig" data-f2="instrument">' + s + '<figcaption class="small muted">' + esc(t('lgt.legend')) + '</figcaption></figure>';
  }
  function goalbox(o, G) {
    const p = P.mzi([1, 0], P.rad(o.th), 0).power[0], T = P.LIGHT_EXACT, gs = [
      { k: 'w', ok: G.steer, v: pct(p), target: t('lgt.t.w', { v: pct(TARGET) }), f: G.steer ? 1 : Math.max(0.05, 1 - Math.abs(p - TARGET) * 2) },
      { k: 'exact', ok: G.holds, v: pct(G.exact), target: t('lgt.t.exact', { v: pct(T) }), f: Math.min(1, G.exact / T) },
      { k: 'more', ok: G.edge, v: G.more == null ? t('lgt.none') : pct(G.more), target: t('lgt.t.more', { v: pct(T) }), f: G.edge ? 1 : Math.max(0.05, 1 - (G.more - T) / (1 - T)) }];
    return '<div class="goalbox' + (G.met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(G.met ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('lgt.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  const dial = (id, value) => '<div class="lgtdial"><label class="lab" for="lgt-' + id + '"><b>' + esc(t('lgt.set.' + id)) + '</b> <output>' + esc(value) + '</output></label><div class="lgtstep"><button type="button" class="chipb" data-lgt-nudge="' + id + ':-1" aria-label="' + esc(t('lgt.less')) + '">−</button><input type="range" id="lgt-' + id + '" data-lgt="' + id + '" min="' + RANGE[id][0] + '" max="' + RANGE[id][1] + '" step="' + RANGE[id][2] + '" value="' + set()[id] + '"><button type="button" class="chipb" data-lgt-nudge="' + id + ':1" aria-label="' + esc(t('lgt.more')) + '">+</button></div></div>';
  function bench() {
    const o = set(), G = goalOf(o.th, o.n);
    let h = head() + '<p class="small lgtintro">' + esc(t('lgt.intro')) + '</p>' + (o.guess == null ? '' : goalbox(o, G)) + figure(o, G);
    if (o.guess == null) {
      h += '<div class="lgtguess"><p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('lgt.predict')) + '</p><div class="chips">' +
        GUESSES.map(g => '<button type="button" class="chipb" data-lgt-guess="' + g + '">' + esc(t('lgt.guess.' + g)) + '</button>').join('') + '</div></div>';
      return h + '<p class="small muted">' + esc(t('lgt.note')) + '</p>' + reward();
    }
    const a = answer();
    h += '<p class="small ' + (o.guess === a ? 'good' : 'hint') + '">' + esc(t(o.guess === a ? 'lgt.guess.right' : 'lgt.guess.off', { g: t('lgt.guess.' + o.guess), a: t('lgt.where.' + a) })) + ' ' + esc(t('lgt.why')) + '</p>';
    h += dial('th', deg(o.th)) + dial('n', t('lgt.v.n', { v: deg(P.LIGHT_NOISES[o.n]) }));
    const say = G.met ? 'met' : !G.steer ? 'aim' : !G.holds ? 'noisy' : 'more';
    h += '<p class="small lgtmsg ' + (G.met ? 'good' : say === 'more' ? '' : 'bad') + '">' + esc(t('lgt.msg.' + say, { v: pct(G.exact), w: deg(Math.round(phaseFor(TARGET) * 10) / 10) })) + '</p>';
    if (view.lgtWords === 2) h += '<div class="lgtclaims"><p class="kicker">' + esc(t('lgt.claims')) + '</p>' + claimList(matterOf('light')) + '</div>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('lgt.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else { const q = edgeOf(GOAL, o.th), half = edgeOf('split', phaseFor(0.5)); h += '<p class="small good">' + esc(t('lgt.done', { q: deg(q == null ? 0 : q), h: deg(half == null ? 0 : half) })) + '</p>'; }
    return h + '<p class="small muted">' + esc(t('lgt.note')) + '</p>' + doneNote() + reward();
  }
  const after = () => { const o = set(); if (o.guess != null && goalOf(o.th, o.n).met) win(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), o = set();
      const g = q('[data-lgt-guess]'); if (g) { o.guess = g.dataset.lgtGuess; return after(); }
      const n = q('[data-lgt-nudge]'); if (n) { const [k, d] = n.dataset.lgtNudge.split(':'), [lo, hi, step] = RANGE[k]; o[k] = Math.min(hi, Math.max(lo, +(o[k] + step * +d).toFixed(2))); return after(); }
      return false; },
    input(e) { const r = e.target.closest('[data-lgt]'); if (!r) return false; set()[r.dataset.lgt] = +r.value; return after(); }
  };
}
