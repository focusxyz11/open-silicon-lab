/* Serving a language model, at the data centre (src/engines/aiserve.js): where the cost of an AI answer comes from.
   One module for three kinds of the challenge player (src/v2/play.js), lab(L) -> { draw, click, input }:
     quantize     at the chip: store each weight in fewer bits; the weights' bell curve snaps to the steps a format can
                  hold, and memory is weighed against the rounding error (the engine's challenge fourBits);
     tokenenergy  at the rack: the energy of one answer as a flow from the grid, through cooling and the rest of the
                  server, to the chip; first the building at its best, then the answer at half its energy;
     prefill      at the board: reading a prompt is one pass over all its tokens, writing is a pass for every token
                  (the engine's challenge readFastWriteSlow).
   What the player has tried is kept in the view; the checks below are pure, over the engine's results. */
import * as A from '../../engines/aiserve.js';
import { fmtWords } from '../../core/i18n.js';

/* ---- the energy lab's check (the engine has none of its own): seen is a list of { s: settings, r: result } ---- */
export const TOKEN_GOAL = { building: 0.2, half: 0.5 };
export const chipAsStart = s => s.watts === A.ENERGY_DEFAULTS.watts && s.tokExp === A.ENERGY_DEFAULTS.tokExp;
export const buildingShare = r => r.shares[1] + r.shares[2];
/* building: the best answer seen with the chip untouched and the building's share under a fifth; half: an answer seen
   at half the energy it started with or less */
export function tokenMet(seen) {
  const start = A.energyPerToken().joulesPerToken;
  const building = seen.filter(x => chipAsStart(x.s) && buildingShare(x.r) <= TOKEN_GOAL.building).sort((a, b) => a.r.joulesPerToken - b.r.joulesPerToken)[0] || null;
  const half = seen.find(x => x.r.joulesPerToken <= TOKEN_GOAL.half * start) || null;
  return { start, building, half, ok: !!(building && half) };
}
export const TOKEN_RANGE = { watts: [300, 3000, 50], tokExp: [2.5, 5, 0.05], overhead: [10, 60, 1], pue: [1.05, 2, 0.01] };
export const ANSWERS = [30, 270, 1000, 4000];            // answer lengths offered, in tokens

/* a bell curve, and the weights' own: a share p of them 12 times bigger (the engine's outliers) */
const K = A.QUANT_OUTLIER;
const phi = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
const erf = x => { const a = Math.abs(x), k = 1 / (1 + 0.3275911 * a); return Math.sign(x) * (1 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-a * a)); };
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
const dens = (x, p) => (1 - p) * phi(x) + p * phi(x / K) / K, cum = (x, p) => (1 - p) * Phi(x) + p * Phi(x / K);
/* the steps of a format at a scale, from zero up to xmax: every weight between a and b is stored as v (by the engine's
   own rounding) */
function stepsOf(f, sc, xmax) {
  const N = 640, h = xmax / N, out = []; let cur = null;
  for (let i = 0; i <= N; i++) { const x = h * i, v = A.roundTo(x / sc, f.e, f.m, f.max) * sc;
    if (!cur || v !== cur.v) { if (cur) cur.b = x - h / 2; cur = { v, a: cur ? x - h / 2 : 0, b: xmax }; out.push(cur); } }
  return out;
}
const fix = n => n.toFixed(1);

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const num = v => v >= 100 ? fmtWords(Math.round(v)) : v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : String(+v.toPrecision(2));
  const pct = v => t('srv.pct', { v: v >= 0.1 ? Math.round(v * 100) : +(v * 100).toFixed(1) });
  const gauges = (ok, gs) => '<div class="goalbox' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(g.l) + '</span><span class="gv">' + esc(g.v) + (g.target ? ' <span class="muted">' + esc(g.target) + '</span>' : '') + '</span><span class="gbar"><span style="width:' + (Math.max(0, Math.min(1, g.f)) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  const reads = rows => '<div class="srvread">' + rows.map(([k, v, c]) => '<span' + (c ? ' class="' + c + '"' : '') + '><span class="small muted">' + esc(k) + '</span><b class="mono">' + esc(v) + '</b></span>').join('') + '</div>';
  const dial = (id, label, value, [min, max, step], val) => '<div class="srvdial"><label class="lab" for="' + id + '"><b>' + esc(label) + '</b> <output>' + esc(value) + '</output></label><div class="srvstep"><button type="button" class="chipb" data-srv-nudge="' + id + ':-1" aria-label="' + esc(t('srv.less')) + '">−</button><input type="range" id="' + id + '" data-srv="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><button type="button" class="chipb" data-srv-nudge="' + id + ':1" aria-label="' + esc(t('srv.more')) + '">+</button></div></div>';
  const pick = (attr, id, on, label, sub, off) => '<button type="button" class="chipb' + (sub ? ' srvpick' : '') + '" ' + attr + '="' + id + '" aria-pressed="' + on + '"' + (off ? ' disabled' : '') + '>' + esc(label) + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</button>';
  const hint = (ok, key) => ok ? '' : view.hint ? '<p class="small hint">' + esc(t(key)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';

  /* ================= quantization: fewer bits for every weight ================= */
  const qSet = () => view.sq || (view.sq = { ...A.QUANT_DEFAULTS });
  const qSeen = () => view.sqSeen || (view.sqSeen = {});
  function qSee() { const o = qSet(), r = A.quantize(o); qSeen()[o.format + ':' + r.mode] = r; if (A.fourBits(o)) win(); return r; }
  /* the weights as trained (a bell curve) and as stored: every weight in a step becomes that step's one value */
  function qFigure(o, r) {
    const W = 300, H = 168, X0 = 8, X1 = 292, Y0 = 18, Y1 = 132, XM = 4, TOP = 0.43, p = o.outliers / 100, f = A.QUANT_FORMATS[o.format];
    const px = x => X0 + (X1 - X0) * (x + XM) / (2 * XM), py = d => Y1 - (Y1 - Y0) * Math.min(d, TOP) / TOP, P = (x, d) => px(x).toFixed(1) + ',' + py(d).toFixed(1);
    const st = stepsOf(f, r.scale, XM), fine = st.length > 110;
    const bell = Array.from({ length: 81 }, (_, i) => { const x = -XM + i * 2 * XM / 80; return P(x, dens(x, p)); }).join(' ');
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('srv.q.aria', { bits: r.bits, zero: pct(r.zeroShare) })) + '">';
    s += '<polygon class="bell" points="' + px(-XM).toFixed(1) + ',' + Y1 + ' ' + bell + ' ' + px(XM).toFixed(1) + ',' + Y1 + '"/>';
    if (fine) s += '<polyline class="stair" points="' + bell + '"/><rect class="lvband" x="' + X0 + '" y="' + (Y1 + 3) + '" width="' + (X1 - X0) + '" height="3" rx="1.5"/>';
    else {
      const z = st[0], hz = (2 * cum(z.b, p) - 1) / (2 * z.b), rest = st.slice(1).map(c => [c.a, c.b, (cum(c.b, p) - cum(c.a, p)) / (c.b - c.a), c.v]);
      const segs = rest.slice().reverse().map(([a, b, h]) => [-b, -a, h]).concat([[-z.b, z.b, hz]], rest);
      s += '<path class="stair" d="M' + px(-XM).toFixed(1) + ' ' + Y1 + segs.map(([a, b, h]) => 'L' + P(a, h).replace(',', ' ') + 'L' + P(b, h).replace(',', ' ')).join('') + 'L' + px(XM).toFixed(1) + ' ' + Y1 + '"/>';
      const lost = r.zeroShare >= 0.03;
      if (lost) s += '<rect class="zero" x="' + px(-z.b).toFixed(1) + '" y="' + py(hz).toFixed(1) + '" width="' + (px(z.b) - px(-z.b)).toFixed(1) + '" height="' + (Y1 - py(hz)).toFixed(1) + '"/>' +
        '<text class="zt" x="' + px(0).toFixed(1) + '" y="' + (py(hz) - 5).toFixed(1) + '" text-anchor="middle">' + esc(t('srv.q.zero', { v: pct(r.zeroShare) })) + '</text>';
      s += [0].concat(rest.flatMap(c => [c[3], -c[3]])).filter(v => Math.abs(v) <= XM).map(v => '<line class="lv" x1="' + px(v).toFixed(1) + '" x2="' + px(v).toFixed(1) + '" y1="' + (Y1 + 2) + '" y2="' + (Y1 + 8) + '"/>').join('');
    }
    s += '<line class="base" x1="' + X0 + '" x2="' + X1 + '" y1="' + Y1 + '" y2="' + Y1 + '"/>' +
      [-XM, -2, 0, 2, XM].map(v => '<text class="ax" x="' + px(v).toFixed(1) + '" y="' + (Y1 + 20) + '" text-anchor="' + (v === -XM ? 'start' : v === XM ? 'end' : 'middle') + '">' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '</text>').join('') +
      '<text class="ax" x="' + (W / 2) + '" y="' + (H - 3) + '" text-anchor="middle">' + esc(t('srv.q.x')) + '</text>';
    /* the outliers lie far outside the picture: how far, from the scale one tensor-wide scale has to take */
    if (o.outliers > 0) s += '<text class="ot" x="' + (X1 - 1) + '" y="' + (Y0 - 6) + '" text-anchor="end">' + esc(t('srv.q.far', { v: Math.round(A.quantize({ format: 'fp4', scaling: 'tensor', outliers: o.outliers }).scale * A.QUANT_FORMATS.fp4.max) })) + ' →</text>';
    return '<figure class="srvfig srvq">' + s + '</svg><figcaption class="small muted">' + esc(t(fine ? 'srv.q.legendFine' : r.mode === 'tensor' ? 'srv.q.legend' : 'srv.q.legendBlock')) + '</figcaption></figure>';
  }
  /* everything tried so far: memory across, signal over rounding error up, the goal a green corner */
  function qMap(o, r) {
    const W = 300, H = 150, l = 42, rr = 10, top = 8, bot = 30, lx = [30, 160], ly = [0, 80];
    const x = v => l + (W - l - rr) * Math.log(v / lx[0]) / Math.log(lx[1] / lx[0]), y = v => top + (H - top - bot) * (1 - Math.max(ly[0], Math.min(ly[1], v)) / ly[1]);
    const now = o.format + ':' + r.mode;
    return '<figure class="betcurve srvmap"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('srv.q.mapAria')) + '">' +
      '<rect class="goalzone" x="' + l + '" y="' + top + '" width="' + (x(40) - l).toFixed(1) + '" height="' + (y(20) - top).toFixed(1) + '"/>' +
      [35, 70, 140].map(v => '<line class="grid" x1="' + x(v).toFixed(1) + '" x2="' + x(v).toFixed(1) + '" y1="' + top + '" y2="' + (H - bot) + '"/><text class="ax" x="' + x(v).toFixed(1) + '" y="' + (H - bot + 13) + '" text-anchor="middle">' + v + '</text>').join('') +
      [20, 40, 60, 80].map(v => '<line class="grid" x1="' + l + '" x2="' + (W - rr) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="ax" x="' + (l - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>').join('') +
      Object.entries(qSeen()).filter(([k]) => k !== now).map(([, q]) => '<circle class="tried" cx="' + x(q.memGB).toFixed(1) + '" cy="' + y(q.snrDb).toFixed(1) + '" r="3.2"/>').join('') +
      '<circle class="you" cx="' + x(r.memGB).toFixed(1) + '" cy="' + y(r.snrDb).toFixed(1) + '" r="5"/>' +
      '<text class="ax" x="' + ((l + W - rr) / 2) + '" y="' + (H - 3) + '" text-anchor="middle">' + esc(t('srv.q.mapX')) + '</text>' +
      '<text class="ax" transform="translate(9 ' + ((top + H - bot) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(t('srv.q.mapY')) + '</text>' +
      '</svg><figcaption class="small muted">' + esc(t('srv.q.mapLegend')) + '</figcaption></figure>';
  }
  function quant() {
    const o = qSet(), r = A.quantize(o), ok = A.fourBits(o), mem = +fix(r.memGB), snr = +fix(r.snrDb), is16 = A.QUANT_FORMATS[o.format].bits === 16;
    if (!qSeen()[o.format + ':' + r.mode]) qSeen()[o.format + ':' + r.mode] = r;
    let h = head() + '<p class="small srvintro">' + esc(t('srv.q.intro', { n: A.QUANT_PARAMS_B })) + '</p>';
    h += gauges(ok, [{ l: t('srv.q.g.out'), ok: o.outliers >= 1, v: pct(o.outliers / 100), target: t('srv.q.t.out'), f: o.outliers },
      { l: t('srv.q.g.mem'), ok: mem < 40, v: t('srv.gb', { v: fix(r.memGB) }), target: t('srv.q.t.mem'), f: mem < 40 ? 1 : 40 / mem * 0.97 },
      { l: t('srv.q.g.snr'), ok: snr > 20, v: t('srv.db', { v: fix(r.snrDb) }), target: t('srv.q.t.snr'), f: snr > 20 ? 1 : snr / 20 * 0.97 }]);
    h += qFigure(o, r) + reads([[t('srv.q.r.bits'), String(r.bits)], [t('srv.q.r.mem'), t('srv.gb', { v: fix(r.memGB) })], [t('srv.q.r.err'), pct(r.rel)], [t('srv.q.r.zero'), pct(r.zeroShare), r.zeroShare >= 0.03 ? 'bad' : '']]);
    h += '<p class="kicker">' + esc(t('srv.q.set.format')) + '</p><div class="chips">' + Object.keys(A.QUANT_FORMATS).map(k => pick('data-sq-format', k, o.format === k, t('srv.q.format.' + k), t('srv.q.bits', { n: A.QUANT_FORMATS[k].bits }))).join('') + '</div>';
    h += '<p class="kicker">' + esc(t('srv.q.set.scale')) + '</p><div class="chips">' + Object.keys(A.QUANT_SCALES).map(k => pick('data-sq-scale', k, o.scaling === k, t('srv.q.scale.' + k), A.QUANT_SCALES[k].extra ? t('srv.q.extra', { v: A.QUANT_SCALES[k].extra }) : t('srv.q.extra0'), is16)).join('') + '</div>';
    h += dial('sq-outliers', t('srv.q.set.out'), t('srv.q.v.out', { v: o.outliers, k: K }), [0, 3, 0.5], o.outliers);
    h += '<p class="small srvsay ' + (r.verdict === 'coarse' ? 'bad' : '') + '">' + esc(t('srv.q.verdict.' + r.verdict)) + (r.zeroShare >= 0.03 ? ' ' + esc(t('srv.q.zeros', { v: pct(r.zeroShare) })) : '') + (is16 ? ' ' + esc(t('srv.q.is16')) : '') + '</p>';
    h += qMap(o, r) + hint(ok || S.done[ch.id], 'srv.q.hint');
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('srv.q.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('srv.q.note', { n: fmtWords(A.QUANT_N) })) + '</p>' + doneNote() + reward();
  }

  /* ================= energy per token: where the energy of one answer goes ================= */
  const eSet = () => view.se || (view.se = { ...A.ENERGY_DEFAULTS });
  const eSeen = () => view.seSeen || (view.seSeen = []);
  function eSee() { const s = { ...eSet() }, L2 = eSeen(); L2.push({ s, r: A.energyPerToken(s) }); const M = tokenMet(L2);
    if (L2.length > 400) view.seSeen = L2.filter((x, i) => x === M.building || x === M.half || i > 200);
    if (M.ok) win(); }
  /* the flow of one token's energy: in from the grid at the left; cooling and power losses turn away first, then the
     rest of the server and its network; what is left reaches the chip. Thickness is joules; the dashes are the start. */
  function eFigure(r, M) {
    const W = 300, H = 186, x0 = 22, top = 26, FULL = 92, yb = 150, J = r.joulesPerToken, k = FULL / Math.max(J, M.start), jp = r.parts.map(p => p / r.tokPerS);
    const tA = jp[0] * k, tS = jp[1] * k, tC = jp[2] * k, yA = top, yS = yA + tA, yC = yS + tS, rad = 7;
    /* a band from the left that turns down and leaves at the bottom, its right edge at xr */
    const turn = (y1, th, xr) => { const R = th + rad; return 'M' + x0 + ' ' + y1.toFixed(1) + 'H' + (xr - R).toFixed(1) + 'A' + R.toFixed(1) + ' ' + R.toFixed(1) + ' 0 0 1 ' + xr + ' ' + (y1 + R).toFixed(1) + 'V' + yb + 'H' + (xr - th).toFixed(1) + 'V' + (y1 + R).toFixed(1) + 'A' + rad + ' ' + rad + ' 0 0 0 ' + (xr - R).toFixed(1) + ' ' + (y1 + th).toFixed(1) + 'H' + x0 + 'Z'; };
    const xC = Math.max(92, x0 + tC + rad + 30), xS = Math.max(212, xC + tS + rad + 30), xA = 262, sh = r.shares;
    const lab = (x, y, a, name, v, cls) => '<text class="nm ' + cls + '" x="' + x + '" y="' + y + '" text-anchor="' + a + '">' + esc(name) + '</text><text class="pv" x="' + x + '" y="' + (y + 12) + '" text-anchor="' + a + '">' + esc(v) + '</text>';
    return '<figure class="srvfig srve"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('srv.e.aria', { a: pct(sh[0]), s: pct(sh[1]), c: pct(sh[2]) })) + '">' +
      '<path class="fc" d="' + turn(yC, tC, Math.min(xC, 150)) + '"/><path class="fs" d="' + turn(yS, tS, Math.min(xS, 240)) + '"/>' +
      '<path class="fa" d="M' + x0 + ' ' + yA + 'H' + xA + 'l10 ' + (tA / 2).toFixed(1) + 'l-10 ' + (tA / 2).toFixed(1) + 'H' + x0 + 'Z"/>' +
      '<rect class="was" x="' + (x0 - 9) + '" y="' + top + '" width="5" height="' + (M.start * k).toFixed(1) + '" rx="2.5"/><rect class="now" x="' + (x0 - 9) + '" y="' + top + '" width="5" height="' + (J * k).toFixed(1) + '" rx="2.5"/>' +
      '<text class="ax" x="' + (x0 - 10) + '" y="' + (top - 8) + '">' + esc(t('srv.e.in', { v: num(J) })) + '</text>' +
      '<text class="nm ta" x="' + (xA + 10) + '" y="' + (top - 8) + '" text-anchor="end">' + esc(t('srv.e.band.accel')) + ' <tspan class="pv">' + esc(pct(sh[0])) + '</tspan></text>' +
      lab(Math.min(xC, 150) - tC / 2, yb + 13, 'middle', t('srv.e.band.cooling'), pct(sh[2]), 'tc') + lab(Math.min(xS, 240) - tS / 2, yb + 13, 'middle', t('srv.e.band.server'), pct(sh[1]), 'ts') +
      '</svg><figcaption class="small muted">' + esc(t('srv.e.legend')) + '</figcaption></figure>';
  }
  function energy() {
    const o = eSet(), r = A.energyPerToken(o), M = tokenMet(eSeen()), same = chipAsStart(o), share = buildingShare(r), half = M.start * TOKEN_GOAL.half, R = TOKEN_RANGE;
    const wh = j => t('srv.e.wh', { v: num(j * 1000 / 3600) });
    let h = head();
    h += gauges(M.ok, [{ l: t('srv.e.g.building'), ok: !!M.building, v: M.building && !same ? pct(buildingShare(M.building.r)) : same ? pct(share) : t('srv.e.changed'), target: t('srv.e.t.building', { v: Math.round(TOKEN_GOAL.building * 100) }), f: M.building ? 1 : same ? TOKEN_GOAL.building / share * 0.97 : 0 },
      { l: t('srv.e.g.half'), ok: !!M.half, v: wh(r.joulesPerToken), target: t('srv.e.t.half', { v: num(half * 1000 / 3600) }), f: M.half ? 1 : half / r.joulesPerToken * 0.97 }]);
    h += eFigure(r, M) + reads([[t('srv.e.r.j'), t('srv.e.j', { v: num(r.joulesPerToken) })], [t('srv.e.r.wh'), wh(r.joulesPerToken)], [t('srv.e.r.wall'), t('srv.e.w', { v: num(r.facilityW) })], [t('srv.e.r.gw'), fmtWords(Math.round(r.acceleratorsPerGW / 1000) * 1000)]]);
    h += '<p class="kicker">' + esc(t('srv.e.set.building')) + '</p>' + dial('se-pue', t('srv.e.set.pue'), t('srv.e.v.pue', { v: o.pue.toFixed(2) }), R.pue, o.pue) + dial('se-overhead', t('srv.e.set.overhead'), t('srv.e.v.overhead', { v: o.overhead }), R.overhead, o.overhead);
    h += '<p class="kicker">' + esc(t('srv.e.set.chip')) + '</p>' + dial('se-tokExp', t('srv.e.set.tok'), t('srv.e.v.tok', { v: t('srv.p.tokens', { n: fmtWords(+Math.pow(10, o.tokExp).toPrecision(2)) }) }), R.tokExp, o.tokExp) + dial('se-watts', t('srv.e.set.watts'), t('srv.e.v.watts', { v: fmtWords(o.watts) }), R.watts, o.watts);
    const cut = j => Math.round((1 - j / M.start) * 100), d = cut(r.joulesPerToken);
    h += '<p class="small srvsay">' + esc(d === 0 ? t('srv.e.say.same') : t(d > 0 ? 'srv.e.say.less' : 'srv.e.say.more', { v: Math.abs(d) })) + (M.building ? ' ' + esc(t('srv.e.say.building', { v: cut(M.building.r.joulesPerToken) })) : '') + '</p>';
    h += '<button type="button" class="link" data-se-reset>' + esc(t('srv.e.reset')) + '</button>' + hint(M.ok || S.done[ch.id], 'srv.e.hint');
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('srv.e.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('srv.e.note')) + '</p>' + doneNote() + reward();
  }

  /* ================= prefill and decode: read the prompt at once, write the answer token by token ================= */
  const pSet = () => view.sp || (view.sp = { chipId: A.PREFILL_DEFAULTS.chipId, paramsB: A.PREFILL_DEFAULTS.paramsB, promptSlider: A.PREFILL_DEFAULTS.promptSlider, answerTokens: A.answerOfSlider(A.PREFILL_DEFAULTS.answerSlider) });
  function pSee() { if (A.readFastWriteSlow(pSet())) win(); }
  const secs = v => v < 0.0995 ? t('srv.ms', { v: +(v * 1000).toPrecision(2) }) : v < 0.9995 ? t('srv.ms', { v: Math.round(v * 1000) }) : t('srv.s', { v: v.toFixed(2) });
  /* the time of one request: the prompt read in one block, then the answer, a stripe for every token (or every few) */
  function pFigure(r) {
    const W = 300, H = 150, X0 = 8, X1 = 292, xr = X0 + (X1 - X0) * r.prefillS / r.totalS, wd = X1 - xr, n = Math.max(1, Math.min(r.answerTokens, Math.floor(wd / 3))), u = wd / n, flip = xr > 190;
    return '<figure class="srvfig srvp"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('srv.p.aria', { read: secs(r.prefillS), write: secs(r.decodeS) })) + '">' +
      '<rect class="rd" x="' + X0 + '" y="22" width="' + Math.max(1.5, xr - X0).toFixed(1) + '" height="28" rx="3"/>' +
      '<text class="nm tr" x="' + X0 + '" y="63">' + esc(t('srv.p.read', { n: fmtWords(r.promptTokens), v: secs(r.prefillS) })) + '</text>' +
      '<line class="wr" x1="' + xr.toFixed(1) + '" x2="' + X1 + '" y1="86" y2="86" stroke-dasharray="' + (u * 0.62).toFixed(2) + ' ' + (u * 0.38).toFixed(2) + '"/>' +
      '<text class="nm tw" x="' + X1 + '" y="113" text-anchor="end">' + esc(t('srv.p.write', { n: fmtWords(r.answerTokens), v: secs(r.decodeS) })) + '</text>' +
      '<line class="ft" x1="' + xr.toFixed(1) + '" x2="' + xr.toFixed(1) + '" y1="14" y2="124"/><text class="ax" x="' + (xr + (flip ? -4 : 4)).toFixed(1) + '" y="11" text-anchor="' + (flip ? 'end' : 'start') + '">' + esc(t('srv.p.first')) + '</text>' +
      '<line class="base" x1="' + X0 + '" x2="' + X1 + '" y1="124" y2="124"/><text class="ax" x="' + X0 + '" y="138">0</text><text class="ax" x="' + X1 + '" y="138" text-anchor="end">' + esc(secs(r.totalS)) + '</text>' +
      '<text class="ax" x="' + (W / 2) + '" y="138" text-anchor="middle">' + esc(t('srv.p.x')) + '</text>' +
      '</svg><figcaption class="small muted">' + esc(t('srv.p.legend', { k: t('srv.p.tokens', { n: Math.max(1, Math.round(r.answerTokens / n)) }) })) + '</figcaption></figure>';
  }
  function prefill() {
    const o = pSet(), r = A.prefillDecode(o), ok = A.readFastWriteSlow(o), D = A.PREFILL_DEFAULTS, setup = o.chipId === D.chipId && o.paramsB === D.paramsB && o.answerTokens === A.answerOfSlider(D.answerSlider), ratio = r.prefillS / r.decodeS;
    let h = head() + '<p class="small srvintro">' + esc(t('srv.p.intro')) + '</p>';
    h += gauges(ok, [{ l: t('srv.p.g.ratio'), ok, v: t('srv.p.ratioV', { v: ratio >= 10 ? Math.round(ratio) : ratio.toFixed(2) }), target: t('srv.p.t.ratio'), f: ok ? 1 : Math.min(ratio, 1 / ratio) * (setup ? 0.97 : 0.5) },
      { l: t('srv.p.g.setup'), ok: setup, v: t(setup ? 'srv.p.asked' : 'srv.p.changed'), target: '', f: setup ? 1 : 0.3 }]);
    h += pFigure(r) + reads([[t('srv.p.r.first'), secs(r.prefillS)], [t('srv.p.r.speed'), num(r.tokPerS)], [t('srv.p.r.times'), t('srv.p.timesV', { v: Math.round(r.readVsWrite) })], [t('srv.p.r.chips'), String(r.chips)]]);
    h += dial('sp-prompt', t('srv.p.set.prompt'), t('srv.p.tokens', { n: fmtWords(r.promptTokens) }), [0, 1000, 1], o.promptSlider);
    h += '<p class="kicker">' + esc(t('srv.p.set.answer')) + '</p><div class="chips">' + ANSWERS.map(n => pick('data-sp-answer', n, o.answerTokens === n, t('srv.p.tokens', { n: fmtWords(n) }))).join('') + '</div>';
    h += '<p class="kicker">' + esc(t('srv.p.set.model')) + '</p><div class="chips">' + A.PREFILL_MODELS.map(n => pick('data-sp-model', n, o.paramsB === n, t('srv.p.model', { n }))).join('') + '</div>';
    h += '<p class="kicker">' + esc(t('srv.p.set.chip')) + '</p><div class="chips">' + A.SERVE_CHIPS.map(c => pick('data-sp-chip', c.id, o.chipId === c.id, t('srv.p.chip.' + c.id))).join('') + '</div>';
    h += '<p class="small srvsay">' + esc(t('srv.p.say.' + r.dominant)) + ' ' + esc(t('srv.p.say.times', { v: Math.round(r.readVsWrite) })) + (r.chips > 1 ? ' ' + esc(t('srv.p.say.chips', { n: r.chips })) : '') + '</p>';
    h += hint(ok || S.done[ch.id], 'srv.p.hint');
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('srv.p.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('srv.p.note')) + '</p>' + doneNote() + reward();
  }

  const KIND = ch.kind, see = KIND === 'quantize' ? qSee : KIND === 'tokenenergy' ? eSee : pSee;
  const after = () => { see(); draw(); fx(); return true; };
  /* where a dial's value lives: the view's settings, by the dial's id */
  const DIALS = { 'sq-outliers': [qSet, 'outliers'], 'se-pue': [eSet, 'pue'], 'se-overhead': [eSet, 'overhead'], 'se-tokExp': [eSet, 'tokExp'], 'se-watts': [eSet, 'watts'], 'sp-prompt': [pSet, 'promptSlider'] };
  const setDial = (id, v) => { const d = DIALS[id]; if (!d) return false; d[0]()[d[1]] = v; return true; };
  if (KIND === 'tokenenergy' && !eSeen().length) eSeen().push({ s: { ...eSet() }, r: A.energyPerToken(eSet()) });
  return {
    draw: KIND === 'quantize' ? quant : KIND === 'tokenenergy' ? energy : prefill,
    click(e) { const q = s => e.target.closest(s);
      const n = q('[data-srv-nudge]'); if (n) { const [id, d] = n.dataset.srvNudge.split(':'), inp = el.querySelector('#' + id); if (!inp) return false; const step = +inp.step, v = Math.min(+inp.max, Math.max(+inp.min, +(+inp.value + step * +d).toFixed(2))); inp.value = v; return setDial(id, v) && after(); }
      const f = q('[data-sq-format]'); if (f) { qSet().format = f.dataset.sqFormat; return after(); }
      const sc = q('[data-sq-scale]'); if (sc) { qSet().scaling = sc.dataset.sqScale; return after(); }
      if (q('[data-se-reset]')) { view.se = { ...A.ENERGY_DEFAULTS }; return after(); }
      const a = q('[data-sp-answer]'); if (a) { pSet().answerTokens = +a.dataset.spAnswer; return after(); }
      const m = q('[data-sp-model]'); if (m) { pSet().paramsB = +m.dataset.spModel; return after(); }
      const c = q('[data-sp-chip]'); if (c) { pSet().chipId = c.dataset.spChip; return after(); }
      return false; },
    input(e) { const r = e.target.closest('[data-srv]'); if (!r) return false; return setDial(r.dataset.srv, +r.value) && after(); }
  };
}
