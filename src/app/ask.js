/* "Ask Claude about this topic": a tutor drawer that appears only when the site runs inside
   Claude (the sample capability). On a plain website it stays hidden. */
import { topicLabel, mode, showAskButtons, learnOf } from './learning.js';
import { t, langName } from '../core/i18n.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function initAsk() {
  const C = window.claude; if (!C || typeof C.use !== 'function') return;
  let sample = null; try { sample = await C.use('sample'); } catch (e) { /* unavailable */ } if (!sample) return;
  const dr = document.createElement('div'); dr.className = 'drawer'; dr.hidden = true; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-label', t('ask.button'));
  dr.innerHTML = '<header><div><p class="eyebrow" id="askCtx"></p><b>' + t('ask.title') + '</b></div><button type="button" class="btn" id="askClose">' + t('ask.close') + '</button></header><div class="log" id="askLog" aria-live="polite"></div><form id="askForm"><textarea id="askIn" rows="2" placeholder="' + t('ask.placeholder') + '" aria-label="' + t('ask.yourQ') + '"></textarea><button class="btn primary" id="askGo" type="submit">' + t('ask.send') + '</button></form>';
  document.body.appendChild(dr);
  const H = {}; let cur = null, ctl = null, busy = false;
  const md = t => esc(t).split(/\n{2,}/).map(b => { const L = b.split('\n'); if (L.every(l => /^\s*([-*•]|\d+\.)\s+/.test(l))) return '<ul>' + L.map(l => '<li>' + l.replace(/^\s*([-*•]|\d+\.)\s+/, '') + '</li>').join('') + '</ul>'; return '<p>' + b.replace(/\n/g, '<br>') + '</p>'; }).join('').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  function renderLog(extra) {
    const turns = H[cur] || [], log = $('#askLog');
    log.innerHTML = (turns.length ? '' : '<p class="small muted">' + t('ask.intro') + '</p><div class="sugg">' + (learnOf(cur).ask || []).map(q => '<button type="button">' + esc(q) + '</button>').join('') + '</div>') + turns.map(m => m.role === 'user' ? '<div class="msg u">' + esc(m.content) + '</div>' : '<div class="msg a">' + md(m.content) + '</div>').join('') + (extra || '');
    log.querySelectorAll('.sugg button').forEach(b => b.addEventListener('click', () => { if (!busy) go(b.textContent); })); log.scrollTop = log.scrollHeight;
  }
  function open(s) { cur = s; $('#askCtx').textContent = t('ask.context.' + (mode === 'engineer' ? 'engineer' : 'beginner'), { topic: topicLabel(s) }); dr.hidden = false; renderLog(); setTimeout(() => $('#askIn').focus(), 0); }
  /* Topics load later, so listen on the page instead of on each button. */
  document.addEventListener('click', e => { const b = e.target.closest('.askbtn'); if (b) open(b.dataset.s); });
  showAskButtons();
  $('#askClose').addEventListener('click', () => { if (ctl) ctl.abort(); dr.hidden = true; });
  $('#askForm').addEventListener('submit', e => { e.preventDefault(); if (busy) { if (ctl) ctl.abort(); return; } const q = $('#askIn').value.trim(); if (q) go(q); });
  $('#askIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#askForm').requestSubmit(); } });
  function ctxText(s) { const sec = document.getElementById(s); if (!sec) return ''; const cl = sec.cloneNode(true); cl.querySelectorAll('canvas,script,svg,.quiz,.askbtn,.beg,.eng').forEach(n => n.remove()); return cl.textContent.replace(/\s+/g, ' ').trim().slice(0, 9000); }
  async function go(q) {
    const s = cur; H[s] = H[s] || []; H[s].push({ role: 'user', content: q }); $('#askIn').value = ''; busy = true; $('#askGo').textContent = t('ask.stop'); ctl = new AbortController();
    renderLog('<div class="msg a" id="askLive"><p class="muted">' + t('ask.thinking') + '</p></div>');
    /* Instructions to Claude stay in English, which it reads best; it answers in the reader's language. */
    const lvl = /* i18n-ok */ mode === 'engineer' ? 'The reader is comfortable with technical detail: be precise and use correct terms and numbers.' : 'The reader is new to chips but has basic hardware knowledge: use plain words, explain any jargon, and use one short everyday comparison if it helps.';
    const rules = /* i18n-ok */ 'You are the friendly tutor on "Open Silicon Lab", an open-source interactive site that teaches how chips are designed and made, and how they are used everywhere, from phones and cars to AI data centers. The reader is on the topic "' + topicLabel(s) + '". ' + lvl + ' Answer in under 180 words unless they ask for more. Base the answer on the topic text below when it is relevant. If the question goes beyond it, answer from general knowledge and say when a detail may have changed after mid-2026. Use short paragraphs or a few "- " bullets, and no headings. Reply in ' + langName() + '.\n\nTopic text:\n"""\n' + ctxText(s) + '\n"""';
    try {
      const r = await sample([{ role: 'user', content: rules }].concat(H[s].slice(-8)), { cache: false, signal: ctl.signal, onText: ({ text }) => { const el = document.getElementById('askLive'); if (el) { el.innerHTML = md(text); const log = $('#askLog'); log.scrollTop = log.scrollHeight; } } });
      H[s].push({ role: 'assistant', content: r.text + (r.truncated ? '\n\n' + t('ask.cut') : '') }); renderLog();
    } catch (e) {
      const code = e && e.code; if (e && e.text) H[s].push({ role: 'assistant', content: e.text }); else H[s].pop(); let msg = '';
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) { msg = t('ask.unavailable'); showAskButtons(false); }
      else if (code === 'rate_limited') msg = t('ask.busy');
      else if (code === 'session_expired') msg = t('ask.signin');
      else if (code === 'refused') msg = t('ask.refused');
      else if (code !== 'cancelled') msg = t('ask.error');
      renderLog(msg ? '<p class="small" style="color:var(--bad)">' + esc(msg) + '</p>' : '');
    } finally { busy = false; $('#askGo').textContent = t('ask.send'); ctl = null; }
  }
}
