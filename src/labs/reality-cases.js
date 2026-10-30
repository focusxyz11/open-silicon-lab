/* Lab: CASE FILES. Seven real chips that passed their checks and still failed. Name the gap between
   design and reality, then see what the industry changed because of it. */
import { $ } from '../core/ui.js';
import { GAPS, CASES } from '../data/reality-cases.js';
import { FACTS } from '../app/facts.js';
import { topicById } from '../data/topics.js';

const KEY = 'osl-reality-cases-v1';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(String(u || '')) ? String(u) : '';

export function init() {
  const box = $('#rcCase'); if (!box) return;
  const S = { i: 0, a: {} };
  try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && typeof j === 'object' && j.a && typeof j.a === 'object') { CASES.forEach(c => { if (GAPS.some(g => g.id === j.a[c.id])) S.a[c.id] = j.a[c.id]; }); if (Number.isInteger(j.i) && CASES[j.i]) S.i = j.i; } } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
  const gap = id => GAPS.find(g => g.id === id);

  $('#rcDots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { S.i = +b.dataset.i; save(); render(true); } });
  box.addEventListener('click', e => {
    const g = e.target.closest('[data-gap]'); const c = CASES[S.i];
    if (g && !S.a[c.id]) { S.a[c.id] = g.dataset.gap; save(); render(); return; }
    const nav = e.target.closest('[data-go]'); if (nav) { S.i = (S.i + (+nav.dataset.go) + CASES.length) % CASES.length; save(); render(true); return; }
    if (e.target.closest('[data-again]')) { S.a = {}; S.i = 0; save(); render(true); }
  });

  function render(focus) {
    const c = CASES[S.i], pick = S.a[c.id], done = CASES.filter(x => S.a[x.id]).length, right = CASES.filter(x => S.a[x.id] === x.gap).length;
    $('#rcScore').textContent = done ? right + ' of ' + done + ' right' + (done < CASES.length ? ' · ' + (CASES.length - done) + ' to go' : '') : CASES.length + ' cases';
    $('#rcDots').innerHTML = CASES.map((x, i) => { const st = !S.a[x.id] ? '' : S.a[x.id] === x.gap ? ' right' : ' wrong'; return '<button type="button" class="' + st.trim() + '" data-i="' + i + '" aria-current="' + (i === S.i) + '" aria-label="Case ' + (i + 1) + ': ' + esc(x.t) + (st ? (st === ' right' ? ', answered correctly' : ', answered') : '') + '">' + x.year + '</button>'; }).join('');
    const facts = c.facts.map(id => FACTS.facts.find(f => f.id === id)).filter(Boolean);
    const t = topicById(c.topic);
    let html = '<p class="eyebrow">Case ' + (S.i + 1) + ' of ' + CASES.length + ' · ' + c.year + '</p><h3>' + esc(c.t) + '</h3><p>' + esc(c.what) + '</p>';
    html += '<p class="rc-q">Which gap between design and reality was it?</p><div class="rc-gaps">' + GAPS.map(g => {
      const cls = !pick ? '' : g.id === c.gap ? 'right' : g.id === pick ? 'wrong' : 'off';
      return '<button type="button" data-gap="' + g.id + '" class="' + cls + '"' + (pick ? ' aria-disabled="true"' : '') + '><b>' + esc(g.t) + '</b><small>' + esc(g.d) + '</small></button>';
    }).join('') + '</div>';
    if (pick) {
      html += '<div class="rc-reveal"><p class="rc-verdict ' + (pick === c.gap ? 'ok' : 'no') + '">' + (pick === c.gap ? 'Right: ' : 'Not quite. Mostly: ') + esc(gap(c.gap).t) + '.</p>' +
        '<p><b>Why it failed.</b> ' + esc(c.why) + '</p><p><b>What changed afterwards.</b> ' + esc(c.after) + '</p>' +
        (facts.length ? '<ul class="rc-facts">' + facts.map(f => { const u = safeUrl(f.url); return '<li>' + esc(f.label) + ': <b>' + esc(f.value) + '</b>' + (u ? ' · <a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(f.source) + '</a>' : '') + '</li>'; }).join('') + '</ul>' : '') +
        '<p class="small">' + (safeUrl(c.url) ? '<a href="' + esc(c.url) + '" target="_blank" rel="noopener">Source: ' + esc(c.src) + '</a> · ' : '') + (t ? '<a href="#' + t.id + '">See the mechanism: ' + esc(t.t) + ' →</a>' : '') + '</p></div>';
    }
    html += '<div class="row rc-nav"><button type="button" class="btn" data-go="-1">← Previous</button>' + (done === CASES.length && S.i === CASES.length - 1 ? '<button type="button" class="btn" data-again>Start again</button>' : '<button type="button" class="btn' + (pick ? ' primary' : '') + '" data-go="1">Next case →</button>') + '</div>';
    if (done === CASES.length) html += '<p class="rc-sum">You named ' + right + ' of ' + CASES.length + '. Notice the pattern: almost every case passed the checks of its time, and each one changed how chips are checked afterwards.</p>';
    box.innerHTML = html;
    if (focus) { const h = box.querySelector('h3'); if (h) { h.tabIndex = -1; } }
  }
  render();
}
