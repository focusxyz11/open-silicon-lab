/* Clock: time at every length (content/scale.md, the visual system of "what will be the next Moore's law?"). Above,
   one scale of time, tenfold at each step, the way the dive is one scale of space: every mark on it comes from an
   engine (your full adder's slowest path, a tick of your chip, a wafer's months in the factory, a chip's years of
   life, fifty years of processors). Below, the fifty years themselves: every processor in Karl Rupp's trend data
   (src/data/trends.js, CC BY 4.0), five measures on one scale, and for the one you choose, how many years each
   doubling took in each decade, fitted by the Scaling engine (src/engines/scaling.js). Hold a doubling every two
   years against it and see where the line stops matching. Words: clk.*. */
import { esc } from '../core/esc.js';
import { t, fmtNum } from '../core/i18n.js';
import { TRENDS, TRENDS_SOURCE } from '../data/trends.js';
import { MEASURES, byDecade, fit, doublingLine } from '../engines/scaling.js';
import { model } from '../engines/chip.js';
import { BASE_GHZ } from '../engines/floor.js';
import { MISSIONS } from '../engines/life.js';
import { build, solutionOf } from '../engines/design.js';

const S = { m: 'transistors', ref: false };
const COL = { transistors: 'var(--qc)', frequency: '#5aa9ff', specint: '#45c08a', watts: '#f0a33a', cores: '#c07ff0' };
const YEAR = 365.25 * 86400;
const sig = v => fmtNum(Number(v.toPrecision(2)));

/* the marks on the scale of time, each from an engine */
function marks(chip) {
  const fa = build({ p: 'full', code: solutionOf('full') }), m = model(chip || {});
  return [
    { k: 'path', s: (fa.st ? fa.st.crit : 500) * 1e-12, v: { ps: fa.st ? fa.st.crit : 0 } },
    { k: 'tick', s: 1 / (BASE_GHZ * 1e9 * m.clock), v: { ghz: sig(BASE_GHZ * m.clock) } },
    { k: 'factory', s: m.days * 86400, v: { days: Math.round(m.days) } },
    { k: 'phone', s: MISSIONS.phone.life * YEAR, v: { y: MISSIONS.phone.life } },
    { k: 'fifty', s: (TRENDS_SOURCE.to - 1971) * YEAR, v: { y: TRENDS_SOURCE.to - 1971 } }];
}
function ladder(chip) {
  /* one row per mark, each on the same scale of time, so no label sits on another at any width */
  const lo = -12, hi = 10, P = s => (((Math.log10(s) - lo) / (hi - lo)) * 100).toFixed(1) + '%';
  const ticks = [1, 3600, YEAR].map(s => '<i style="left:' + P(s) + '"></i>').join('');
  let h = '<div class="clkl" role="img" aria-label="' + esc(t('clk.ladderAria')) + '">';
  marks(chip).forEach(mk => (h += '<div class="clr"><span class="cll">' + esc(t('clk.m.' + mk.k, mk.v)) + '</span><span class="clt">' + ticks + '<b style="left:' + P(mk.s) + '"></b></span></div>'));
  h += '<div class="clr cla"><span class="cll"></span><span class="clt">' + [[1, 'clk.sec'], [3600, 'clk.hour'], [YEAR, 'clk.year']].map(([s, k]) => '<em style="left:' + P(s) + '">' + esc(t(k)) + '</em>').join('') + '</span></div>';
  return h + '</div>';
}
function chart() {
  const x0 = 1970, x1 = 2023, ylo = -1, yhi = 8, W = 640, H = 300, X = y => 46 + ((y - x0) / (x1 - x0)) * (W - 60), Y = v => 14 + (1 - (Math.log10(v) - ylo) / (yhi - ylo)) * (H - 44);
  let g = '<svg class="clkc" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('clk.chartAria', { m: t('clk.name.' + S.m) })) + '">';
  for (let e = ylo; e <= yhi; e++) g += '<line x1="46" x2="' + (W - 14) + '" y1="' + Y(Math.pow(10, e)).toFixed(1) + '" y2="' + Y(Math.pow(10, e)).toFixed(1) + '" class="grid"/><text x="40" y="' + (Y(Math.pow(10, e)) + 4).toFixed(1) + '" text-anchor="end" class="u">10' + String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) + '</text>';
  [1971, 1980, 1990, 2000, 2010, 2021].forEach(y => (g += '<text x="' + X(y).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" class="u">' + y + '</text>'));
  MEASURES.forEach(m => { const on = m === S.m; TRENDS[m].forEach(([y, v]) => { if (v > 0) g += '<circle cx="' + X(y).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="' + (on ? 3.2 : 2) + '" fill="' + COL[m] + '" opacity="' + (on ? 0.95 : 0.22) + '"/>'; }); });
  if (S.ref) { const first = TRENDS[S.m].filter(p => p[0] < 1981), v0 = first.length ? Math.exp(first.reduce((a, p) => a + Math.log(p[1]), 0) / first.length) : TRENDS[S.m][0][1], y0 = first.length ? first.reduce((a, p) => a + p[0], 0) / first.length : 1972, L = doublingLine(v0, y0, 2);
    const pts = []; for (let y = 1971; y <= 2022; y += 1) { const v = L(y); if (v > Math.pow(10, ylo) && v < Math.pow(10, yhi + 0.5)) pts.push(X(y).toFixed(1) + ',' + Y(v).toFixed(1)); }
    g += '<polyline points="' + pts.join(' ') + '" class="ref"/>'; }
  return g + '</svg>';
}
export function clockHtml(chip) {
  const D = byDecade(S.m), all = fit(TRENDS[S.m], 1971, 2022);
  let h = '<section class="clockbox" data-clock style="--mc:' + COL[S.m] + '"><p class="kicker">' + esc(t('clk.ladderK')) + '</p>' + ladder(chip);
  h += '<p class="kicker">' + esc(t('clk.chartK')) + '</p><div class="chips">' + MEASURES.map(m => '<button type="button" class="chipb" data-clk="' + m + '" aria-pressed="' + (S.m === m) + '"><i class="sw" style="background:' + COL[m] + '"></i>' + esc(t('clk.name.' + m)) + '</button>').join('') + '<button type="button" class="chipb" data-clkref aria-pressed="' + S.ref + '">' + esc(t('clk.ref')) + '</button></div>';
  h += chart();
  h += '<div class="clkcard"><p class="plead">' + esc(all.doubling ? t('clk.all', { m: t('clk.name.' + S.m), y: sig(all.doubling) }) : t('clk.allNone', { m: t('clk.name.' + S.m) })) + '</p><div class="clkdec">' +
    D.map(d => '<span class="' + (d.doubling ? '' : 'stop') + '"><b>' + esc(t('clk.decade', { d: d.from })) + '</b> ' + esc(d.n < 3 ? t('clk.few') : d.doubling ? t('clk.every', { y: sig(d.doubling) }) : t('clk.stopped')) + '</span>').join('') + '</div>' +
    '<p>' + esc(t('clk.say.' + S.m)) + '</p></div>';
  return h + '<p class="small muted">' + esc(t('clk.source', { name: TRENDS_SOURCE.name, licence: TRENDS_SOURCE.licence })) + ' <a href="' + TRENDS_SOURCE.url + '" target="_blank" rel="noopener">' + esc(t('clk.data')) + '</a></p></section>';
}
export function clockInput(btn, chip) {
  const box = btn.closest('[data-clock]'); if (!box) return false;
  if (btn.dataset.clk) S.m = btn.dataset.clk; else if (btn.hasAttribute('data-clkref')) S.ref = !S.ref; else return false;
  const w = document.createElement('div'); w.innerHTML = clockHtml(chip); const fresh = w.firstElementChild; box.replaceWith(fresh);
  const f = fresh.querySelector(btn.dataset.clk ? '[data-clk="' + btn.dataset.clk + '"]' : '[data-clkref]'); if (f) f.focus();
  return true;
}
