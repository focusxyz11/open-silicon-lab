/* The Scaling engine, begun (content/scale.md): what doubled, how fast, and when it stopped. Pure; tests in
   tests/scaling.test.mjs. It reads fifty years of processors (src/data/trends.js, Karl Rupp, CC BY 4.0) and fits a
   straight line to the logarithm of each measure over a stretch of years: the slope is how many doublings a year,
   its inverse the years one doubling takes. A slope near zero means that measure stopped doubling. */
import { TRENDS } from '../data/trends.js';

export const MEASURES = Object.keys(TRENDS);
export const DECADES = [1970, 1980, 1990, 2000, 2010];

/* least squares on log2(value) against year, over [from, to): { doubling (years), slope, n } */
export function fit(series, from, to) {
  const P = series.filter(([y, v]) => y >= from && y < to && v > 0);
  if (P.length < 3) return { doubling: null, slope: null, n: P.length };
  const n = P.length, mx = P.reduce((a, p) => a + p[0], 0) / n, my = P.reduce((a, p) => a + Math.log2(p[1]), 0) / n;
  const sxy = P.reduce((a, [y, v]) => a + (y - mx) * (Math.log2(v) - my), 0), sxx = P.reduce((a, [y]) => a + (y - mx) * (y - mx), 0);
  const slope = sxx ? sxy / sxx : 0;
  return { slope, doubling: slope > 0.03 ? 1 / slope : null, n };
}
/* each decade's doubling time for one measure; null where it had stopped doubling (or too few points) */
export const byDecade = id => DECADES.map(d => ({ from: d, ...fit(TRENDS[id], d, d + 10) }));
/* a doubling every `years`, from a value at a year: the straight line a law of doubling would draw */
export const doublingLine = (v0, y0, years) => y => v0 * Math.pow(2, (y - y0) / years);
