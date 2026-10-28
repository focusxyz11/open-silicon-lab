/* Learning layer: Beginner/Engineer explanations, optional quizzes, glossary and term pop-ups.
   Nothing here gates content; quiz results only feed the progress display. */
import { LV, QZ, GL } from '../data/learning.js';
import { TOPICS, topicById, bandById } from '../data/topics.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const topicLabel = id => { const t = topicById(id); if (!t) return id === 'glossary' ? 'Glossary' : id === 'sources' ? 'Sources' : id; const b = bandById(t.band); return (b ? b.t + ' · ' : '') + t.t; };

/* ---- mode ---- */
export let mode = 'beginner';
try { const m = localStorage.getItem('sjl-mode'); if (m === 'engineer' || m === 'beginner') mode = m; } catch (e) { /* ignore */ }
export function setMode(m) {
  mode = m; document.documentElement.dataset.mode = m;
  try { localStorage.setItem('sjl-mode', m); } catch (e) { /* ignore */ }
  document.querySelectorAll('.modeseg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m ? 'true' : 'false'));
  document.dispatchEvent(new CustomEvent('osl:mode'));
}

/* ---- progress: topics seen and quizzes answered (this browser only) ---- */
const PKEY = 'sjl-progress-v3';
export const P = { quiz: {}, seen: {} };
try { const j = JSON.parse(localStorage.getItem(PKEY) || 'null'); if (j && typeof j === 'object') { P.quiz = j.quiz && typeof j.quiz === 'object' ? j.quiz : {}; P.seen = j.seen && typeof j.seen === 'object' ? j.seen : {}; } } catch (e) { /* ignore */ }
export const saveP = () => { try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch (e) { /* ignore */ } };
export const quizDone = s => { const q = QZ[s], a = P.quiz[s] || {}; return !!q && q.every((_, i) => a[i] !== undefined); };
export function markSeen(id) { if (topicById(id) && !P.seen[id]) { P.seen[id] = 1; saveP(); updProgress(); } }
export function updProgress() {
  const n = TOPICS.filter(t => P.seen[t.id]).length; const t = $('#progTop'); if (!t) return;
  t.querySelector('i').style.setProperty('--p', (n / TOPICS.length * 100) + '%');
  t.querySelector('span').textContent = n + '/' + TOPICS.length + ' explored';
  t.setAttribute('aria-label', 'You have explored ' + n + ' of ' + TOPICS.length + ' topics');
}

/* ---- quizzes, collapsed by default ---- */
function renderQuiz(s) {
  const box = document.querySelector('.quiz[data-s="' + s + '"]'); if (!box) return;
  const q = QZ[s], a = P.quiz[s] || {}; let right = 0, ans = 0;
  const body = q.map((x, i) => {
    const ch = a[i]; if (ch !== undefined) { ans++; if (ch === x[2]) right++; }
    return '<div class="q"><p class="qt">' + (i + 1) + '. ' + esc(x[0]) + '</p><div class="opts">' + x[1].map((o, j) => { let cl = ''; if (ch !== undefined) { if (j === x[2]) cl = 'right'; else if (j === ch) cl = 'wrong'; } return '<button type="button" data-i="' + i + '" data-j="' + j + '"' + (cl ? ' class="' + cl + '"' : '') + (ch !== undefined ? ' aria-disabled="true"' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div>' + (ch !== undefined ? '<p class="exp"><b>' + (ch === x[2] ? 'Correct.' : 'Not quite.') + '</b> ' + esc(x[3]) + '</p>' : '') + '</div>';
  }).join('');
  const open = box.querySelector('details') ? box.querySelector('details').open : false;
  box.innerHTML = '<details' + (open ? ' open' : '') + '><summary><span class="code">Check yourself</span><span class="score">' + (ans ? right + ' of ' + q.length + ' correct' + (ans < q.length ? ' so far' : '') : '3 quick questions, optional') + '</span></summary>' + body + (ans === q.length ? '<div class="row"><button type="button" class="btn" data-reset="1">Try again</button></div>' : '') + '</details>';
  box.querySelectorAll('.opts button').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i; if ((P.quiz[s] || {})[i] !== undefined) return; P.quiz[s] = Object.assign({}, P.quiz[s]); P.quiz[s][i] = +b.dataset.j; saveP(); renderQuiz(s); }));
  const r = box.querySelector('[data-reset]'); if (r) r.addEventListener('click', () => { delete P.quiz[s]; saveP(); renderQuiz(s); box.querySelector('details').open = true; });
}

/* ---- glossary page and term pop-ups ---- */
function glList(q) {
  q = (q || '').trim().toLowerCase();
  const items = GL.filter(g => !q || g[0].toLowerCase().includes(q) || g[2].toLowerCase().includes(q)).sort((a, b) => a[0].localeCompare(b[0]));
  const box = $('#glList'); if (!box) return;
  box.innerHTML = items.length ? items.map(g => '<div><b>' + esc(g[0]) + '</b><p>' + esc(g[2]) + '</p><a href="#' + g[3] + '">' + esc(topicLabel(g[3])) + '</a></div>').join('') : '<p class="muted">No terms match that search.</p>';
}
function wrapTerms() {
  const vari = []; GL.forEach((g, i) => g[1].forEach(v => { vari.push([v, i]); if (/^[a-z]/.test(v)) vari.push([v[0].toUpperCase() + v.slice(1), i]); }));
  vari.sort((a, b) => b[0].length - a[0].length); const VM = new Map(); vari.forEach(([v, i]) => { if (!VM.has(v)) VM.set(v, i); });
  let rx; try { rx = new RegExp('(?<![\\w\\-])(' + [...VM.keys()].map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\w\\-])', 'g'); } catch (e) { return; }
  document.querySelectorAll('#library > section').forEach(sec => {
    if (sec.id === 'glossary' || sec.id === 'sources') return; const used = new Set();
    sec.querySelectorAll('.prose p, .lede, .isa dd, .callout p, .sub p, .beg p, .eng p, .forces p').forEach(el => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach(n => {
        if (!n.parentElement || n.parentElement.closest('a,button,pre,code,h1,h2,h3,h4,.mono,label,output,.term,.eyebrow')) return;
        const t = n.nodeValue; rx.lastIndex = 0; let m, last = 0, frag = null;
        while ((m = rx.exec(t))) { const gi = VM.get(m[1]); if (gi === undefined || used.has(gi)) continue; used.add(gi); frag = frag || document.createDocumentFragment(); frag.append(t.slice(last, m.index)); const b = document.createElement('button'); b.type = 'button'; b.className = 'term'; b.dataset.g = gi; b.textContent = m[1]; frag.append(b); last = m.index + m[1].length; }
        if (frag) { frag.append(t.slice(last)); n.replaceWith(frag); }
      });
    });
  });
}
function popovers() {
  const pop = document.createElement('div'); pop.className = 'pop'; pop.hidden = true; pop.setAttribute('role', 'tooltip'); document.body.appendChild(pop);
  let popFor = null, hideT = 0; const hoverable = matchMedia('(hover:hover)');
  function showPop(b) {
    const g = GL[+b.dataset.g]; if (!g) return; clearTimeout(hideT);
    pop.innerHTML = '<b>' + esc(g[0]) + '</b><p>' + esc(g[2]) + '</p><a href="#' + g[3] + '">More in ' + esc(topicLabel(g[3])) + '</a>'; pop.hidden = false;
    const r = b.getBoundingClientRect(), pw = Math.min(320, innerWidth - 32); pop.style.maxWidth = pw + 'px'; pop.style.left = Math.min(Math.max(16, r.left), innerWidth - pw - 16) + 'px'; pop.style.top = (r.bottom + 8) + 'px';
    const ph = pop.offsetHeight; if (r.bottom + 8 + ph > innerHeight - 12) pop.style.top = Math.max(12, r.top - ph - 8) + 'px'; popFor = b;
  }
  const hidePop = () => { pop.hidden = true; popFor = null; };
  document.addEventListener('click', e => { const b = e.target.closest('#library .term'); if (b) { e.preventDefault(); if (popFor === b && !hoverable.matches) hidePop(); else showPop(b); return; } if (!e.target.closest('.pop')) hidePop(); });
  document.addEventListener('mouseover', e => { if (!hoverable.matches) return; const b = e.target.closest && e.target.closest('#library .term'); if (b) showPop(b); });
  document.addEventListener('mouseout', e => { if (!hoverable.matches) return; const b = e.target.closest && e.target.closest('#library .term'); if (b) { clearTimeout(hideT); hideT = setTimeout(() => { if (!pop.matches(':hover')) hidePop(); }, 250); } });
  pop.addEventListener('mouseleave', () => { if (hoverable.matches) { clearTimeout(hideT); hideT = setTimeout(hidePop, 200); } });
  pop.addEventListener('mouseenter', () => clearTimeout(hideT));
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('term') && e.target.closest('#library')) showPop(e.target); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePop(); });
  addEventListener('scroll', () => { if (!pop.hidden) hidePop(); }, { passive: true });
  document.addEventListener('osl:route', hidePop);
}

export function initLearning() {
  document.querySelectorAll('.modeseg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
  setMode(mode);
  TOPICS.forEach(({ id }) => {
    const sec = document.getElementById(id); if (!sec) return;
    const head = sec.querySelector('.head');
    const lab = head && head.querySelector('[data-topic-label]'); if (lab) lab.textContent = topicLabel(id);
    if (head) { const ab = document.createElement('button'); ab.type = 'button'; ab.className = 'askbtn'; ab.hidden = true; ab.dataset.s = id; ab.textContent = 'Ask Claude about this topic'; head.appendChild(ab); }
    const lv = LV[id];
    if (lv && head) { const b = document.createElement('div'); b.className = 'beg'; b.innerHTML = '<p class="eyebrow">In plain words</p><p>' + esc(lv[0]) + '</p>'; const e = document.createElement('div'); e.className = 'eng'; e.innerHTML = '<p class="eyebrow">Engineer\'s notes</p><p>' + esc(lv[1]) + '</p>'; head.after(b, e); }
    if (QZ[id]) { const d = document.createElement('div'); d.className = 'quiz'; d.dataset.s = id; sec.appendChild(d); renderQuiz(id); }
  });
  const q = $('#glQ'); if (q) q.addEventListener('input', e => glList(e.target.value)); glList('');
  wrapTerms(); popovers(); updProgress();
}
