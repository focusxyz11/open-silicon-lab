/* What design really is, in each studio step's card (Look): under the step's question, what is true there, the real
   practice and its open tools, what the engines say about your design at that step, and what people are trying.
   The words are in src/i18n/en/ (stop.<key>.*, studio.*); the content behind them is content/design.md; the engines are
   src/engines/timing.js (in time?), rules.js (the factory's rules on the tile, and the masks) and verilog.js (the
   lab's lines as Verilog). Returns HTML for the card; draws nothing on the picture. */
import { t, has, fmtNum } from '../core/i18n.js';
import { timeDesign, chained, periodOf, overhead } from '../engines/timing.js';
import { rulesOf, maskSet } from '../engines/rules.js';
import { verilogOf } from '../engines/verilog.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ps = n => fmtNum(Math.round(n));
/* the clock the card times against: the fastest a Tiny Tapeout chip's pins carry (facts: tt-clock) */
export const CLOCK_MHZ = 66;
export const STEPS = ['need', 'logic', 'check', 'gates', 'layout', 'masks'];

const kick = w => '<p class="kicker">' + esc(w) + '</p>';
const para = (cls, s) => '<p class="' + cls + '">' + esc(s) + '</p>';

/* the time from tick to tick as one bar: the launching flip-flop, the gates, the catching flip-flop, against the tick */
function bar(arrival, logic, period, node, label) {
  const ff = overhead(node), W = 300, max = Math.max(period, arrival) * 1.04, x = v => (v / max) * W, P = x(period);
  const a = x(ff * 0.72), g = x(logic), ok = arrival <= period;
  return '<div class="sl-bar"><span class="sl-barl">' + esc(label) + '</span><svg viewBox="0 0 ' + W + ' 22" preserveAspectRatio="none" aria-hidden="true">' +
    '<rect x="0" y="5" width="' + W + '" height="12" rx="3" class="sl-track"/>' +
    '<rect x="0" y="5" width="' + a.toFixed(1) + '" height="12" class="sl-ff"/>' +
    '<rect x="' + a.toFixed(1) + '" y="5" width="' + Math.max(1.5, g).toFixed(1) + '" height="12" class="sl-gate' + (ok ? '' : ' late') + '"/>' +
    '<rect x="' + (a + Math.max(1.5, g)).toFixed(1) + '" y="5" width="' + x(ff * 0.28).toFixed(1) + '" height="12" class="sl-ff"/>' +
    '<line x1="' + P.toFixed(1) + '" x2="' + P.toFixed(1) + '" y1="1" y2="21" class="sl-tick"/></svg></div>';
}

function need(B) {
  if (!B.spec) return para('sl-read', t('studio.need.free'));
  return para('sl-read', t(B.seq ? 'studio.need.seq' : 'studio.need.spec', { ins: B.ins.length, outs: B.outs.length, n: B.total || 0 }));
}
function logic(B) {
  const V = verilogOf(B); if (!V || !V.text) return para('sl-read', t('studio.check.none'));
  const lab = B.p === 'core' ? B.slice.code : B.code, n = lab.split('\n').filter(l => l.trim()).length;
  return (B.p === 'core' ? para('sl-read', t('studio.logic.core')) : '') +
    '<div class="sl-code"><p class="sl-codek">' + esc(t('studio.logic.lab')) + '</p><pre>' + esc(lab) + '</pre>' +
    '<p class="sl-codek">' + esc(t('studio.logic.v')) + '</p><pre>' + esc(V.text) + '</pre></div>' + para('sl-read', t('studio.logic.lines', { v: V.lines, n }));
}
function check(B) {
  if (B.errs && B.errs.length) return para('sl-read', t('studio.check.none'));
  const n = B.total || 0, k = B.p === 'core' ? 'studio.check.core' : B.seq ? 'studio.check.seq' : 'studio.check.all';
  return para('sl-read', t(k, { n })) + (B.coverage != null ? para('sl-read', t('studio.check.cov', { caught: Math.round(B.coverage * 100) })) : '');
}
const end = e => !e ? '—' : e.reg ? t('studio.gates.ff', { n: e.reg }) : e.pin ? t('studio.gates.pin', { n: e.pin }) : '—';
function gates(B) {
  if (!B.M) return para('sl-read', t('studio.check.none'));
  const period = periodOf(CLOCK_MHZ), T = timeDesign(B, period);
  let h = para('sl-read', t('studio.gates.chain', { n: T.chain.cells.length, logic: ps(T.chain.logic), from: end(T.chain.from), to: end(T.chain.to) }));
  h += bar(T.arrival, T.copies ? T.arrival - overhead('130') : T.chain.logic, period, '130', T.copies ? t('studio.gates.row', { n: T.copies }) : t('studio.gates.alone'));
  /* a slice with a carry: what it does copied in a row, as real adders are built */
  const carry = !T.copies && B.ins.includes('cin') && B.outs.includes('cout') ? chained(B, 32, 'cin', 'cout', period) : null;
  if (carry) h += bar(carry.arrival, carry.arrival - overhead('130'), period, '130', t('studio.gates.row', { n: 32 }));
  h += '<p class="sl-legend"><span><i class="sl-sw sl-ff"></i>' + esc(t('studio.gates.lff')) + '</span><span><i class="sl-sw sl-gate"></i>' + esc(t('studio.gates.lgate')) + '</span><span><i class="sl-sw sl-tk"></i>' + esc(t('studio.gates.ltick')) + '</span></p>';
  h += para('sl-read', t('studio.gates.tick', { need: ps(T.arrival), mhz: CLOCK_MHZ, period: ps(period) }));
  h += '<p class="sl-verdict ' + (T.meets ? 'good' : 'bad') + '">' + esc(T.meets ? t('studio.gates.meets', { slack: ps(T.slack) }) : t('studio.gates.fails', { late: ps(-T.slack) })) + ' ' + esc(t('studio.gates.fmax', { fmax: fmtNum(Math.round(T.fmax)) })) + '</p>';
  if (T.copies) h += para('sl-read', t('studio.gates.core', { n: T.copies }));
  if (carry) h += para('sl-read', t('studio.gates.chained', { n: 32, need: ps(carry.arrival), fmax: fmtNum(Math.round(carry.fmax)) }));
  return h;
}
function layout(B) {
  const R = rulesOf(B); if (!R) return para('sl-read', t('studio.check.none'));
  const broken = R.filter(r => !r.ok).length;
  return '<ul class="sl-rules">' + R.map(r => '<li class="' + (r.ok ? 'ok' : 'bad') + '" data-rule="' + r.id + '"><span class="sl-mark" aria-hidden="true">' + (r.ok ? '✓' : '✕') + '</span><span>' + esc(t('studio.rule.' + r.id)) + '</span><em>' + esc(r.ok ? t('studio.rule.ok') : t('studio.rule.bad', { n: r.n })) + '</em></li>').join('') + '</ul>' +
    '<p class="sl-verdict ' + (broken ? 'bad' : 'good') + '">' + esc(broken ? t('studio.layout.some', { n: broken }) : t('studio.layout.all')) + '</p>';
}
function masks(B) {
  if (!B.RT) return para('sl-read', t('studio.check.none'));
  const S = maskSet(B), cells = S.groups.filter(g => g.id === 'transistors' || g.id === 'cellwires').reduce((a, g) => a + g.n, 0);
  const squares = S.groups.map(g => g.masks.map(m => '<i class="sl-m sl-' + g.id + (g.drawn.includes(m) ? ' drawn' : '') + '" title="' + esc(m) + '"></i>').join('')).join('');
  return '<div class="sl-masks" aria-hidden="true">' + squares + '</div><ul class="sl-mkey">' + S.groups.map(g => '<li><i class="sl-m sl-' + g.id + (g.id === 'yours' ? ' drawn' : '') + '"></i>' + esc(t('studio.mask.' + g.id)) + ' <b>' + g.n + '</b></li>').join('') + '</ul>' +
    para('sl-read', t('studio.masks.sum', { total: S.total, drawn: S.drawn, cells, rest: S.total - S.drawn - cells }));
}
const READ = { need, logic, check, gates, layout, masks };

/* the card's block for a step. key: the question the card shows (its true thing and its tries go with it) */
export function studioLook(step, B, key) {
  if (!STEPS.includes(step)) return '';
  let h = '<div class="sl" data-studio="' + step + '">';
  if (key && has('stop.' + key + '.note')) h += kick(t('studio.look.true')) + para('sl-true', t('stop.' + key + '.note'));
  h += kick(t('studio.look.practice')) + para('sl-prac', t('studio.practice.' + step));
  if (B) h += '<div class="sl-eng">' + kick(t('studio.k.' + step)) + READ[step](B) + '</div>';
  const tried = key && has('stop.' + key + '.tried') ? t('stop.' + key + '.tried') : null;
  if (Array.isArray(tried)) h += kick(t('studio.look.tried')) + '<ul class="sl-tried">' + tried.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  return h + '</div>';
}
