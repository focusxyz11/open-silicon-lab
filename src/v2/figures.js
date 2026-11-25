/* The shared figures (src/data/figures.js) as words in the visitor's language: an amount of money, a range, a plain
   number, ready to fill the placeholders of any page's words (fig.* in src/i18n/<lang>/shared.json). */
import { t, fmtWords, lang } from '../core/i18n.js';
import { FIG } from '../data/figures.js';

/* money: "$7,000", "$725 million"; a range shares its unit once: "$25–35 billion", "250–350亿美元" */
export const money = v => t(v >= 1e6 ? 'fig.money.big' : 'fig.money', { n: fmtWords(v) });
export function moneySpan(a, b) {
  const x = fmtWords(a), y = fmtWords(b); let i = 0;
  while (i < x.length && i < y.length && x[x.length - 1 - i] === y[y.length - 1 - i]) i++;
  let suf = y.slice(y.length - i); while (/^[\d.,]/.test(suf)) suf = suf.slice(1);
  return t(a >= 1e6 ? 'fig.money.big' : 'fig.money', { n: x.slice(0, x.length - suf.length) + '–' + y });
}
let memo = null, memoL = '';
export function figVars() {
  if (memo && memoL === lang()) return memo;
  memoL = lang(); const num = v => fmtWords(v);
  memo = { dc: num(FIG.dc.v), dc2030: num(FIG.dc2030.v), design28: money(FIG.design28.v), design: money(FIG.design.v), module: moneySpan(...FIG.module.v), euv: money(FIG.euv.v), run: money(FIG.run.v) };
  return memo;
}
