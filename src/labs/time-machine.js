/* Lab: TIME MACHINE (on the map page). Drag from 1971 to 2040: transistor counts, processes,
   printing light, wafers, design cost and which of today's companies exist. The same year
   drives the whole site through src/app/era.js. */
import { $, RM, T, fit, watch, rgba } from '../core/ui.js';
import { NOW, MIN, MAX, RUPP, CHIPS, snapshot, words, trendTransistors } from '../data/timeline.js';
import { getYear, setYear, kindPill } from '../app/era.js';
import { topicById } from '../data/topics.js';
import { t, fmtList } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function init() {
  const R = $('#tmR'); if (!R) return;
  const cv = $('#tmCv');
  R.min = MIN; R.max = MAX;
  let playT = 0;
  R.addEventListener('input', () => { stop(); setYear(R.value); });
  $('#tmJump').addEventListener('click', e => { const b = e.target.closest('[data-y]'); if (b) { stop(); setYear(b.dataset.y); } });
  const stop = () => { clearInterval(playT); playT = 0; $('#tmPlay').textContent = t('tm.play'); };
  $('#tmPlay').addEventListener('click', () => {
    if (playT) { stop(); return; }
    if (getYear() >= NOW) setYear(MIN);
    $('#tmPlay').textContent = t('tm.pause');
    playT = setInterval(() => { const y = getYear(); if (y >= NOW) { stop(); return; } setYear(y + 1); }, RM ? 400 : 160);
  });
  document.addEventListener('osl:year', draw);

  function card(label, value, sub, kind) { return '<div><span>' + esc(label) + '</span><b>' + value + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + (kind ? kindPill(kind) : '') + '</div>'; }
  function draw() {
    const y = getYear(), s = snapshot(y);
    R.value = y; $('#tmYear').textContent = y;
    $('#tmEra').textContent = s.era.t; $('#tmEraD').textContent = s.era.d;
    $('#tmJump').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.y === y));
    const missing = s.missing.map(id => (topicById(id) || { t: id }).t);
    $('#tmCards').innerHTML =
      card(t(s.proj ? 'tm.bigTrend' : 'tm.big'), esc(t('tm.count', { n: words(s.flagship) })), s.proj ? esc(t('tm.trendNote')) : esc(s.biggest.name) + ' (' + s.biggest.year + ')', s.proj ? 'trend' : 'ship') +
      card(t('tm.landmarkCard'), esc(s.chip.name), esc(t('tm.landmarkSub', { year: s.chip.year, n: words(s.chip.tr), node: s.chip.node, why: s.chip.why })), null) +
      card(t('tm.process'), esc(s.node.t), esc(t('tm.nodeNote')), s.node.kind) +
      card(t('tm.shape'), esc(s.shape.t.split(':')[0]), esc(s.shape.t.split(':').slice(1).join(':').trim()), s.shape.kind) +
      card(t('tm.light'), esc(s.litho.t), '', s.litho.kind) +
      card(t('tm.wafer'), esc(s.wafer), y > NOW ? esc(t('tm.waferNote')) : '', y > NOW ? 'proj' : null) +
      card(t('tm.cost'), s.cost ? esc(t('tm.costValue', { n: s.cost.m })) : t('tm.costNone'), s.cost ? esc(t(y > 2025 ? 'tm.costRising' : 'tm.costSub', { node: s.cost.node })) : esc(t('tm.costStart')), s.cost ? 'ship' : null) +
      card(t('tm.companies'), t('tm.companiesValue', { n: s.companies.n, total: s.companies.total }), t(y < NOW ? 'tm.companiesPast' : 'tm.companiesFuture'), null) +
      (missing.length ? card(t('tm.missing'), esc(fmtList(missing)), t('tm.missingNote'), null) : '');
    drawChart();
  }
  function drawChart() {
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const y = getYear();
    const L = 52, Rr = 12, Tp = 12, B = 26;
    const X = v => L + (v - MIN) / (MAX - MIN) * (w - L - Rr);
    const lo = 3, hi = 14; const Y = n => Tp + (hi - Math.log10(n)) / (hi - lo) * (h - Tp - B);
    c.font = '11px IBM Plex Mono, monospace'; c.fillStyle = T.muted; c.strokeStyle = rgba(T.muted, 0.18); c.lineWidth = 1;
    for (let e = lo; e <= hi; e += 1) { const yy = Y(10 ** e); c.beginPath(); c.moveTo(L, yy); c.lineTo(w - Rr, yy); c.stroke(); if (e % 3 === 0) { c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText({ 3: '1k', 6: '1M', 9: '1B', 12: '1T' }[e], L - 6, yy); } }
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    [1971, 1990, 2010, NOW, 2040].forEach(v => { if (X(v) < L + 10 && v !== MIN) return; c.fillText(v, X(v), h - 8); });
    /* the future is shaded */
    c.fillStyle = rgba(T.violet, 0.07); c.fillRect(X(NOW), Tp, X(MAX) - X(NOW), h - Tp - B);
    /* Rupp's microprocessor data */
    c.fillStyle = rgba(T.cyan, 0.55);
    RUPP.forEach(([yr, n]) => { if (yr > y + 0.99) return; c.beginPath(); c.arc(X(yr), Y(n), 2.6, 0, 7); c.fill(); });
    c.fillStyle = rgba(T.cyan, 0.15);
    RUPP.forEach(([yr, n]) => { if (yr <= y + 0.99) return; c.beginPath(); c.arc(X(yr), Y(n), 2.6, 0, 7); c.fill(); });
    /* named landmarks */
    CHIPS.forEach(ch => { const on = ch[0] <= y; c.fillStyle = on ? T['amber-fill'] : rgba(T.muted, 0.25); c.beginPath(); c.arc(X(ch[0]), Y(ch[4]), on ? 4 : 3, 0, 7); c.fill(); });
    /* the trend line into the future */
    c.strokeStyle = rgba(T.violet, 0.8); c.setLineDash([5, 4]); c.lineWidth = 1.6; c.beginPath(); c.moveTo(X(NOW), Y(trendTransistors(NOW))); c.lineTo(X(MAX), Y(trendTransistors(MAX))); c.stroke(); c.setLineDash([]);
    /* the selected year */
    const s = snapshot(y); const xx = X(y), yy = Y(s.flagship);
    c.strokeStyle = T.amber; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xx, Tp); c.lineTo(xx, h - B); c.stroke();
    c.fillStyle = T.amber; c.beginPath(); c.arc(xx, yy, 5.5, 0, 7); c.fill(); c.strokeStyle = T.surface; c.lineWidth = 2; c.stroke();
    const lab = words(s.flagship); c.font = '600 12px IBM Plex Mono, monospace'; c.fillStyle = T.ink;
    c.textAlign = xx > w * 0.7 ? 'right' : 'left'; c.textBaseline = 'middle'; c.fillText(lab, xx + (xx > w * 0.7 ? -10 : 10), Math.max(Tp + 8, yy - 14));
    c.font = '11px IBM Plex Sans, sans-serif'; c.fillStyle = T.muted; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(t('tm.axis'), L + 6, Tp + 4);
  }
  watch(cv, drawChart);
  draw();
}
