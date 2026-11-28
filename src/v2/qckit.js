/* What the core question cards' pictures share (src/v2/qcard.js, src/v2/qcpics1.js to 3): seeded numbers, a little
   drawing, and numbers said in words (qc.n.*, src/i18n/en/cards.json). */
import { t, fmtNum } from '../core/i18n.js';

export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function gauss(r) { let u = 0; while (u < 1e-9) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r()); }
/* the complementary error function (Numerical Recipes' fit): the tail of the noise past a line */
export function erfc(x) { const z = Math.abs(x), k = 1 / (1 + 0.5 * z); const y = k * Math.exp(-z * z - 1.26551223 + k * (1.00002368 + k * (0.37409196 + k * (0.09678418 + k * (-0.18628806 + k * (0.27886807 + k * (-1.13520398 + k * (1.48851587 + k * (-0.82215223 + k * 0.17087277))))))))); return x >= 0 ? y : 2 - y; }
export const disc = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻';
const sup = n => String(n).split('').map(d => (d === '-' ? SUP[10] : SUP[+d])).join('');
export const whole = n => fmtNum(Math.round(n));
export const dec = (x, d) => fmtNum(x, { minimumFractionDigits: d, maximumFractionDigits: d });
/* a count in plain words up to trillions, then powers of ten */
export function big(n) {
  if (!isFinite(n)) return t('qc.n.endless');
  if (n < 1e4) return whole(n);
  if (n < 1e6) return whole(Math.round(n / 100) * 100);
  if (n < 1e15) { const u = n >= 1e12 ? [1e12, 'trillion'] : n >= 1e9 ? [1e9, 'billion'] : [1e6, 'million'], v = n / u[0]; return t('qc.n.' + u[1], { n: v < 10 ? dec(v, 1) : whole(v) }); }
  const e = Math.floor(Math.log10(n)); return dec(n / Math.pow(10, e), 1) + ' × 10' + sup(e);
}
export const times = x => '×' + (x >= 100 ? whole(x) : x >= 10 ? dec(x, 1) : dec(x, 2));
export const pct = (x, d = 0) => fmtNum(x, { style: 'percent', minimumFractionDigits: d, maximumFractionDigits: d });
/* one in how many */
export function oneIn(p) { if (p < 1e-15) return t('qc.n.none'); if (p >= 0.095) return pct(p); return t('qc.n.oneIn', { n: big(1 / p) }); }
/* a length of time, in the unit that reads best */
export function howLong(sec) {
  const p = x => fmtNum(x, { maximumSignificantDigits: 2 });
  if (sec < 1e-3) return t('qc.n.us', { n: p(sec * 1e6) });
  if (sec < 1) return t('qc.n.ms', { n: p(sec * 1e3) });
  if (sec < 90) return t('qc.n.s', { n: p(sec) });
  if (sec < 5400) return t('qc.n.min', { n: p(sec / 60) });
  if (sec < 172800) return t('qc.n.h', { n: p(sec / 3600) });
  if (sec < 3.156e7) return t('qc.n.d', { n: p(sec / 86400) });
  return t('qc.n.y', { n: big(sec / 3.15576e7) });
}
