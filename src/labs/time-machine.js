/* Lab: TIME MACHINE (on the map page). Drag from 1971 to 2040: transistor counts, processes,
   printing light, wafers, design cost and which of today's companies exist. The same year
   drives the whole site through src/app/era.js. */
import { $, RM, T, fit, watch, rgba } from '../core/ui.js';
import { NOW, MIN, MAX, RUPP, CHIPS, snapshot, words, trendTransistors } from '../data/timeline.js';
import { getYear, setYear, kindPill } from '../app/era.js';
import { topicById } from '../data/topics.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function init() {
  const R = $('#tmR'); if (!R) return;
  const cv = $('#tmCv');
  R.min = MIN; R.max = MAX;
  let playT = 0;
  R.addEventListener('input', () => { stop(); setYear(R.value); });
  $('#tmJump').addEventListener('click', e => { const b = e.target.closest('[data-y]'); if (b) { stop(); setYear(b.dataset.y); } });
  const stop = () => { clearInterval(playT); playT = 0; $('#tmPlay').textContent = '▶ Play history'; };
  $('#tmPlay').addEventListener('click', () => {
    if (playT) { stop(); return; }
    if (getYear() >= NOW) setYear(MIN);
    $('#tmPlay').textContent = '❚❚ Pause';
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
      card(s.proj ? 'Biggest chip, if the trend holds' : 'Biggest chip so far', words(s.flagship) + ' transistors', s.proj ? 'Today\'s AI-chip trend: twice the transistors every 2.25 years' : esc(s.biggest.name) + ' (' + s.biggest.year + ')', s.proj ? 'trend' : 'ship') +
      card('Landmark chip', esc(s.chip.name), s.chip.year + ' · ' + words(s.chip.tr) + ' transistors · ' + esc(s.chip.node) + '. ' + esc(s.chip.why), null) +
      card('Leading-edge process', esc(s.node.t), 'Node names stopped matching any real length in the 2000s.', s.node.kind) +
      card('Transistor shape', esc(s.shape.t.split(':')[0]), esc(s.shape.t.split(':').slice(1).join(':').trim()), s.shape.kind) +
      card('Printing light', esc(s.litho.t), '', s.litho.kind) +
      card('Wafer size, newest fabs', esc(s.wafer), y > NOW ? '450 mm wafers were tried and shelved in the 2010s.' : '', y > NOW ? 'proj' : null) +
      card('Cost to design a leading-edge chip', s.cost ? '$' + s.cost.m + ' million' : 'Not in the series', s.cost ? s.cost.node + ', IBS estimate' + (y > 2025 ? '; still rising' : '') : 'The IBS series starts with 28 nm in 2011.', s.cost ? 'ship' : null) +
      card('Today\'s key companies that exist', s.companies.n + ' of ' + s.companies.total, y < NOW ? 'See which in The ecosystem' : 'Plus companies not yet founded', null) +
      (missing.length ? card('Topics on the map not invented yet', esc(missing.join(', ')), 'They are dimmed on the map below.', null) : '');
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
    c.font = '11px IBM Plex Sans, sans-serif'; c.fillStyle = T.muted; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('Transistors per chip (log scale)', L + 6, Tp + 4);
  }
  watch(cv, drawChart);
  draw();
}
