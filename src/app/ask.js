/* "Ask Claude about this topic": a tutor drawer that appears only when the site runs inside
   Claude (the sample capability). On a plain website it stays hidden. */
import { SUG } from '../data/learning.js';
import { topicLabel, mode, showAskButtons } from './learning.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function initAsk() {
  const C = window.claude; if (!C || typeof C.use !== 'function') return;
  let sample = null; try { sample = await C.use('sample'); } catch (e) { /* unavailable */ } if (!sample) return;
  const dr = document.createElement('div'); dr.className = 'drawer'; dr.hidden = true; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-label', 'Ask Claude about this topic');
  dr.innerHTML = '<header><div><p class="eyebrow" id="askCtx"></p><b>Ask Claude</b></div><button type="button" class="btn" id="askClose">Close</button></header><div class="log" id="askLog" aria-live="polite"></div><form id="askForm"><textarea id="askIn" rows="2" placeholder="Ask about this topic…" aria-label="Your question"></textarea><button class="btn primary" id="askGo" type="submit">Ask</button></form>';
  document.body.appendChild(dr);
  const H = {}; let cur = null, ctl = null, busy = false;
  const md = t => esc(t).split(/\n{2,}/).map(b => { const L = b.split('\n'); if (L.every(l => /^\s*([-*•]|\d+\.)\s+/.test(l))) return '<ul>' + L.map(l => '<li>' + l.replace(/^\s*([-*•]|\d+\.)\s+/, '') + '</li>').join('') + '</ul>'; return '<p>' + b.replace(/\n/g, '<br>') + '</p>'; }).join('').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  function renderLog(extra) {
    const turns = H[cur] || [], log = $('#askLog');
    log.innerHTML = (turns.length ? '' : '<p class="small muted">Answers draw on this topic\'s content, at your chosen level, using your own Claude account. Try one of these:</p><div class="sugg">' + (SUG[cur] || []).map(q => '<button type="button">' + esc(q) + '</button>').join('') + '</div>') + turns.map(t => t.role === 'user' ? '<div class="msg u">' + esc(t.content) + '</div>' : '<div class="msg a">' + md(t.content) + '</div>').join('') + (extra || '');
    log.querySelectorAll('.sugg button').forEach(b => b.addEventListener('click', () => { if (!busy) go(b.textContent); })); log.scrollTop = log.scrollHeight;
  }
  function open(s) { cur = s; $('#askCtx').textContent = topicLabel(s) + ' · ' + (mode === 'engineer' ? 'Engineer' : 'Beginner') + ' level'; dr.hidden = false; renderLog(); setTimeout(() => $('#askIn').focus(), 0); }
  /* Topics load later, so listen on the page instead of on each button. */
  document.addEventListener('click', e => { const b = e.target.closest('.askbtn'); if (b) open(b.dataset.s); });
  showAskButtons();
  $('#askClose').addEventListener('click', () => { if (ctl) ctl.abort(); dr.hidden = true; });
  $('#askForm').addEventListener('submit', e => { e.preventDefault(); if (busy) { if (ctl) ctl.abort(); return; } const q = $('#askIn').value.trim(); if (q) go(q); });
  $('#askIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#askForm').requestSubmit(); } });
  function ctxText(s) { const sec = document.getElementById(s); if (!sec) return ''; const cl = sec.cloneNode(true); cl.querySelectorAll('canvas,script,svg,.quiz,.askbtn,.beg,.eng').forEach(n => n.remove()); return cl.textContent.replace(/\s+/g, ' ').trim().slice(0, 9000); }
  async function go(q) {
    const s = cur; H[s] = H[s] || []; H[s].push({ role: 'user', content: q }); $('#askIn').value = ''; busy = true; $('#askGo').textContent = 'Stop'; ctl = new AbortController();
    renderLog('<div class="msg a" id="askLive"><p class="muted">Thinking…</p></div>');
    const lvl = mode === 'engineer' ? 'The reader is comfortable with technical detail: be precise and use correct terms and numbers.' : 'The reader is new to chips but has basic hardware knowledge: use plain words, explain any jargon, and use one short everyday comparison if it helps.';
    const rules = 'You are the friendly tutor on "Open Silicon Lab", an open-source interactive site that teaches how chips are designed and made, and how they are used everywhere, from phones and cars to AI data centers. The reader is on the topic "' + topicLabel(s) + '". ' + lvl + ' Answer in under 180 words unless they ask for more. Base the answer on the topic text below when it is relevant. If the question goes beyond it, answer from general knowledge and say when a detail may have changed after mid-2026. Use short paragraphs or a few "- " bullets, and no headings.\n\nTopic text:\n"""\n' + ctxText(s) + '\n"""';
    try {
      const r = await sample([{ role: 'user', content: rules }].concat(H[s].slice(-8)), { cache: false, signal: ctl.signal, onText: ({ text }) => { const el = document.getElementById('askLive'); if (el) { el.innerHTML = md(text); const log = $('#askLog'); log.scrollTop = log.scrollHeight; } } });
      H[s].push({ role: 'assistant', content: r.text + (r.truncated ? '\n\n(The answer was cut short. Ask for less at a time.)' : '') }); renderLog();
    } catch (e) {
      const code = e && e.code; if (e && e.text) H[s].push({ role: 'assistant', content: e.text }); else H[s].pop(); let msg = '';
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) { msg = 'Asking Claude is not available on this page for your account.'; showAskButtons(false); }
      else if (code === 'rate_limited') msg = 'Too many questions right now. Please try again in a little while.';
      else if (code === 'session_expired') msg = 'Please sign in to Claude again, then ask again.';
      else if (code === 'refused') msg = 'Claude could not answer that. Try asking it a different way.';
      else if (code !== 'cancelled') msg = 'Something went wrong. Please try again.';
      renderLog(msg ? '<p class="small" style="color:var(--bad)">' + esc(msg) + '</p>' : '');
    } finally { busy = false; $('#askGo').textContent = 'Ask'; ctl = null; }
  }
}
