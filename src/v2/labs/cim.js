/* Compute in memory (kind 'cim', at the block, where memory and logic sit apart), from src/engines/paradigms.js.
   A grid of memory cells does the multiplying where the numbers are stored: each cell passes a current in proportion
   to its stored number times its row's input, each column wire adds them, and a converter reads the sum. Three things
   spoil a sum (cells with too few levels, cells that differ from what was written, a converter with too few steps);
   the goal is the engine's own check (checkCimBits): within 5% of exact with the fewest converter bits that do it.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as P from '../../engines/paradigms.js';

export const ROWS = 8, COLS = 4, START = { seed: 5, w: 4, n: 0.06, adc: 10 };
const RANGE = { w: [2, 8, 1], n: [0, 0.15, 0.01], adc: [2, 12, 1] };
/* one array's numbers: the weights stored in the cells and the inputs on the rows */
export function numbers(seed) {
  const r = P.rng(seed * 97 + 1);
  const W = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => Math.round((r() * 2 - 1) * 100) / 100));
  return { W, x: Array.from({ length: ROWS }, () => Math.round(r() * 100) / 100) };
}
/* the engine's settings of a state of the dials */
export const settings = o => Object.assign(numbers(o.seed), { wBits: o.w, sigma: o.n, adcBits: o.adc, seed: o.seed + 3 });
/* what each cell really holds, drawn as the engine's crossbar draws it (the same levels, the same order of noise) */
export function cells(W, { wBits, sigma, seed }) {
  const r = P.rng(seed), L = (1 << (wBits - 1)) - 1 || 1, G = W.map(row => row.map(() => 0));
  for (let j = 0; j < W[0].length; j++) for (let i = 0; i < W.length; i++) G[i][j] = Math.round(W[i][j] * L) / L * (1 + sigma * P.gauss(r));
  return G;
}
/* the energy of one pass in pJ: the engine's totals, and the parts of each (moving against math, array against converters) */
export function energy(adcBits) {
  const E = P.cimEnergy(ROWS, COLS, adcBits), move = ROWS * COLS * P.E16.sram4k / 2, array = ROWS * COLS * 0.01;
  return { digital: E.digital, analog: E.analog, move, math: E.digital - move, array, conv: E.analog - array };
}
/* which of the three spoils the sums, or what there is still to ask */
export function verdict(st) {
  const err = b => P.crossbar(st.W, st.x, Object.assign({}, st, { adcBits: b })).err, T = P.CIM_TOLERANCE;
  if (P.checkCimBits(st)) return 'fewest';
  if (err(st.adcBits) > T) return err(RANGE.adc[1]) <= T ? 'coarse' : P.crossbar(st.W, st.x, Object.assign({}, st, { adcBits: RANGE.adc[1], sigma: 0 })).err > T ? 'cells' : 'noise';
  const E = P.cimEnergy(ROWS, COLS, st.adcBits); return E.analog >= E.digital ? 'costly' : 'spare';
}

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.cim || (view.cim = Object.assign({}, START));
  const seen = () => view.cimSeen || (view.cimSeen = []);
  const pct = v => t('cim.pct', { v: v >= 0.995 ? Math.round(v * 100) : (v * 100).toFixed(1) });
  const pj = v => t('cim.pj', { v: v >= 100 ? Math.round(v) : v.toFixed(1) });
  /* what the player has tried is kept; the engine's check on the latest decides */
  function see() { const st = settings(set()); seen().push({ w: st.wBits, n: st.sigma, adc: st.adcBits }); if (seen().length > 400) seen().shift(); if (P.checkCimBits(st)) win(); }
  const f1 = v => v.toFixed(1);

  function figure(st, R) {
    const W = 300, H = 262, G = cells(st.W, st), cx = j => 92 + j * 56, ry = i => 24 + i * 15, Z = 204;
    const top = Math.max(1, ...R.exact.map(Math.abs), ...R.analog.map(Math.abs)) * 1.12, k = 34 / top, step = ROWS / ((1 << (st.adcBits - 1)) - 1);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('cim.aria', { e: pct(R.err) })) + '">';
    s += '<text class="ax" x="50" y="12" text-anchor="end">' + esc(t('cim.fig.in')) + '</text>';
    st.x.forEach((v, i) => { s += '<line class="row" x1="56" x2="282" y1="' + ry(i) + '" y2="' + ry(i) + '" stroke-width="' + f1(0.6 + 2.6 * v) + '" opacity="' + (0.35 + 0.65 * v).toFixed(2) + '"/><text class="ax mono" x="50" y="' + (ry(i) + 3.5) + '" text-anchor="end">' + v.toFixed(2) + '</text>'; });
    for (let j = 0; j < COLS; j++) {
      const a = R.analog[j], e = R.exact[j], x = cx(j);
      s += '<line class="col" x1="' + x + '" x2="' + x + '" y1="16" y2="146" stroke-width="' + f1(1 + 3 * Math.min(1, Math.abs(a) / top)) + '"/>';
      for (let i = 0; i < ROWS; i++) { const w = st.W[i][j], g = G[i][j];
        s += '<circle class="want" cx="' + x + '" cy="' + ry(i) + '" r="' + f1(1.5 + 5 * Math.abs(w)) + '"/><circle class="cell ' + (g >= 0 ? 'pos' : 'neg') + '" cx="' + x + '" cy="' + ry(i) + '" r="' + f1(Math.min(8, 1.5 + 5 * Math.abs(g))) + '"/>'; }
      /* the converter: a staircase with as many steps as it has bits */
      let d = 'M' + (x - 12) + ' 160'; for (let n = 1; n <= st.adcBits; n++) d += 'H' + f1(x - 12 + 24 * n / st.adcBits) + 'V' + f1(160 - 10 * n / st.adcBits);
      s += '<rect class="adc" x="' + (x - 16) + '" y="146" width="32" height="18" rx="4"/><path class="stair" d="' + d + '"/><line class="col thin" x1="' + x + '" x2="' + x + '" y1="164" y2="168"/>';
      /* the sum: the converter's steps, the exact value (a line) and the value read (a bar) */
      if (step * k >= 3) for (let n = Math.ceil(-34 / (step * k)); n * step * k <= 34; n++) s += '<line class="lv" x1="' + (x - 15) + '" x2="' + (x + 15) + '" y1="' + f1(Z - n * step * k) + '" y2="' + f1(Z - n * step * k) + '"/>';
      const h = Math.max(-34, Math.min(34, a * k));
      /* the gap between what was read and the exact value is the error, drawn as it is */
      s += '<rect class="read" x="' + (x - 8) + '" y="' + f1(Math.min(Z, Z - h)) + '" width="16" height="' + f1(Math.max(1, Math.abs(h))) + '" rx="2"/><line class="zero" x1="' + (x - 17) + '" x2="' + (x + 17) + '" y1="' + Z + '" y2="' + Z + '"/>' +
        '<rect class="gap" x="' + (x - 3) + '" y="' + f1(Z - Math.max(h, e * k)) + '" width="6" height="' + f1(Math.abs(h - e * k)) + '"/>' +
        '<line class="exact" x1="' + (x - 14) + '" x2="' + (x + 14) + '" y1="' + f1(Z - e * k) + '" y2="' + f1(Z - e * k) + '"/>' +
        '<text class="num" x="' + x + '" y="248" text-anchor="middle">' + a.toFixed(2) + '</text><text class="ax mono" x="' + x + '" y="259" text-anchor="middle">' + e.toFixed(2) + '</text>';
    }
    s += '<text class="ax" x="50" y="158.5" text-anchor="end">' + esc(t('cim.fig.conv')) + '</text><text class="ax" x="50" y="' + (Z + 3.5) + '" text-anchor="end">' + esc(t('cim.fig.sum')) + '</text>' +
      '<text class="ax" x="50" y="248" text-anchor="end">' + esc(t('cim.fig.read')) + '</text><text class="ax" x="50" y="259" text-anchor="end">' + esc(t('cim.fig.exact')) + '</text></svg>';
    return '<figure class="cimfig">' + s + '<figcaption class="small muted">' + esc(t('cim.legend')) + '</figcaption></figure>';
  }
  /* the energy of one pass, two ways: fetch every number and compute, or compute where the numbers are */
  function bars(E) {
    const top = Math.max(E.digital, E.analog), w = v => (v / top * 100).toFixed(1);
    const row = (k, total, parts) => '<div class="cimrow"><span class="cimn">' + esc(t('cim.e.' + k)) + '</span><span class="cimbar">' + parts.map(([c, v]) => '<i class="' + c + '" style="width:' + w(v) + '%"></i>').join('') + '</span><b class="mono">' + esc(pj(total)) + '</b></div>';
    return '<div class="cimen"><p class="kicker">' + esc(t('cim.e.t')) + '</p>' + row('digital', E.digital, [['mv', E.move], ['ma', E.math]]) + row('analog', E.analog, [['ar', E.array], ['cv', E.conv]]) +
      '<p class="cimkey small muted">' + ['mv', 'ma', 'ar', 'cv'].map(c => '<span><i class="' + c + '"></i>' + esc(t('cim.e.' + c)) + '</span>').join('') + '</p>' +
      '<p class="small cimsave">' + esc(E.analog < E.digital ? t('cim.e.less', { v: (E.digital / E.analog).toFixed(E.digital / E.analog >= 10 ? 0 : 1) }) : t('cim.e.more')) + '</p></div>';
  }
  function goalbox(st, R) {
    const ok = P.checkCimBits(st), T = P.CIM_TOLERANCE, lo = st.adcBits > RANGE.adc[0] ? P.crossbar(st.W, st.x, Object.assign({}, st, { adcBits: st.adcBits - 1 })).err : null;
    const gs = [{ k: 'err', ok: R.err <= T, v: pct(R.err), target: t('cim.t.err', { v: Math.round(T * 100) }), f: Math.min(1, T / Math.max(R.err, 1e-9)) },
      { k: 'fewer', ok: lo == null || lo > T, v: lo == null ? t('cim.none') : pct(lo), target: t('cim.t.fewer', { v: Math.round(T * 100) }), f: lo == null ? 1 : Math.min(1, lo / T) }];
    return '<div class="goalbox' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('cim.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  const dial = (id, value) => '<div class="cimdial"><label class="lab" for="cim-' + id + '"><b>' + esc(t('cim.set.' + id)) + '</b> <output>' + esc(value) + '</output></label><div class="cimstep"><button type="button" class="chipb" data-cim-nudge="' + id + ':-1" aria-label="' + esc(t('cim.less')) + '">−</button><input type="range" id="cim-' + id + '" data-cim="' + id + '" min="' + RANGE[id][0] + '" max="' + RANGE[id][1] + '" step="' + RANGE[id][2] + '" value="' + set()[id] + '"><button type="button" class="chipb" data-cim-nudge="' + id + ':1" aria-label="' + esc(t('cim.more')) + '">+</button></div></div>';

  function bench() {
    const o = set(), st = settings(o), R = P.crossbar(st.W, st.x, st), v = verdict(st);
    let h = head() + '<p class="small cimintro">' + esc(t('cim.intro')) + '</p>' + goalbox(st, R) + figure(st, R);
    h += dial('w', t('cim.v.w', { v: o.w, n: ((1 << (o.w - 1)) - 1) * 2 + 1 })) + dial('n', t('cim.v.n', { v: Math.round(o.n * 100) })) + dial('adc', t('cim.v.adc', { v: o.adc, n: ((1 << (o.adc - 1)) - 1) * 2 + 1 }));
    h += '<p class="small cimmsg ' + (v === 'fewest' ? 'good' : v === 'spare' ? '' : 'bad') + '">' + esc(t('cim.msg.' + v)) + '</p>' + bars(energy(o.adc));
    h += '<div class="chips"><button type="button" class="chipb" data-cim-new>' + esc(t('cim.new')) + '</button></div>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('cim.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('cim.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('cim.note')) + '</p>' + doneNote() + reward();
  }
  const after = () => { see(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), o = set();
      const n = q('[data-cim-nudge]'); if (n) { const [k, d] = n.dataset.cimNudge.split(':'), [lo, hi, step] = RANGE[k]; o[k] = Math.min(hi, Math.max(lo, +(o[k] + step * +d).toFixed(2))); return after(); }
      if (q('[data-cim-new]')) { o.seed++; return after(); }
      return false; },
    input(e) { const r = e.target.closest('[data-cim]'); if (!r) return false; set()[r.dataset.cim] = +r.value; return after(); }
  };
}
