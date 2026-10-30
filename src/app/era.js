/* The year the whole site is set to. Today by default; drag it from 1971 to 2040 and the map,
   every topic page and the labs that know about time show that year instead. The choice lasts
   for this browser tab only, so a returning visitor always starts in the present. */
import { NOW, MIN, MAX, snapshot, topicLine, words } from '../data/timeline.js';
import { topicData } from './loader.js';
import { t } from '../core/i18n.js';

const KEY = 'osl-year-v1';
let year = NOW;
try { const v = +sessionStorage.getItem(KEY); if (v >= MIN && v <= MAX) year = v; } catch (e) { /* storage unavailable */ }

export const getYear = () => year;
export const isNow = () => year === NOW;
export function setYear(y) {
  const v = Math.max(MIN, Math.min(MAX, Math.round(+y)));
  if (!Number.isFinite(v) || v === year) return;
  year = v;
  try { if (v === NOW) sessionStorage.removeItem(KEY); else sessionStorage.setItem(KEY, String(v)); } catch (e) { /* ignore */ }
  document.dispatchEvent(new CustomEvent('osl:year', { detail: { year: v } }));
}

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const kindPill = k => k === 'proj' ? '<span class="pill proj">' + t('era.proj') + '</span>' : k === 'plan' ? '<span class="pill ann">' + t('era.plan') + '</span>' : k === 'trend' ? '<span class="pill out">' + t('era.trend') + '</span>' : '<span class="pill ship">' + t('era.history') + '</span>';

/* The banner at the top of a topic page when the site is set to another year. */
export function renderEraBanner(id) {
  const box = document.getElementById('eraBanner'); if (!box) return;
  box.dataset.topic = id || '';
  if (!id || isNow()) { box.hidden = true; box.innerHTML = ''; return; }
  const s = snapshot(year);
  box.hidden = false;
  box.className = 'erabanner' + (s.proj ? ' future' : '');
  box.innerHTML = '<div><p class="code">' + t(s.proj ? 'era.codeProj' : 'era.code', { year: s.y }) + '</p><p><b>' + esc(s.era.t) + '.</b> ' + esc(topicLine(id, s.y, (topicData(id).time || {}).then)) + '</p></div><div class="row"><button type="button" class="btn" data-era-open>' + t('era.change') + '</button><button type="button" class="btn primary" data-era-now>' + t('era.back', { year: NOW }) + '</button></div>';
}

/* The year button in the top bar, with a small pop-over slider. */
function popHTML() {
  return '<div class="yphead"><b>' + t('era.title') + '</b><button type="button" class="btn" data-era-close aria-label="' + t('era.close') + '">×</button></div>' +
    '<div class="ctl"><label for="ypR">' + t('era.year') + ' <output id="ypO"></output></label><input type="range" id="ypR" min="' + MIN + '" max="' + MAX + '" step="1"></div>' +
    '<div class="seg" id="ypJump">' + [1971, 1985, 2000, 2012, NOW, 2035].map(y => '<button type="button" data-y="' + y + '">' + (y === NOW ? t('era.today') : y) + '</button>').join('') + '</div>' +
    '<div class="ypsnap" id="ypSnap"></div><a href="#map" data-era-map class="small">' + t('era.full') + '</a>';
}
function renderTop() {
  const b = $('#yearBtn'); if (!b) return;
  b.querySelector('b').textContent = isNow() ? t('era.today') : year;
  b.classList.toggle('away', !isNow());
  b.setAttribute('aria-label', isNow() ? t('era.labelNow', { year: NOW }) : t('era.labelYear', { year }));
  document.documentElement.dataset.era = isNow() ? 'now' : year > NOW ? 'future' : 'past';
  const pop = $('#yearPop'); if (!pop || pop.hidden) return;
  const s = snapshot(year);
  $('#ypR').value = year; $('#ypO').textContent = year;
  $('#ypJump').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.y === year));
  $('#ypSnap').innerHTML = '<p><b>' + esc(s.era.t) + '</b></p><p class="small">' + esc(t(s.proj ? 'era.snapProj' : 'era.snap', { chip: s.biggest.name, count: words(s.flagship), node: s.node.t })) + '</p>';
}

export function initEra() {
  const tools = document.querySelector('.topbar .tools');
  if (tools && !$('#yearBtn')) {
    const b = document.createElement('button'); b.type = 'button'; b.id = 'yearBtn'; b.className = 'yearbtn'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'yearPop');
    b.innerHTML = '<span aria-hidden="true">◷</span><b>' + t('era.today') + '</b>';
    tools.insertBefore(b, tools.firstChild);
    const pop = document.createElement('div'); pop.id = 'yearPop'; pop.className = 'yearpop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', t('era.title'));
    pop.innerHTML = popHTML(); document.body.appendChild(pop);
    const open = on => { pop.hidden = !on; b.setAttribute('aria-expanded', on); if (on) { renderTop(); $('#ypR').focus(); } };
    b.addEventListener('click', () => open(pop.hidden));
    pop.addEventListener('input', e => { if (e.target.id === 'ypR') setYear(e.target.value); });
    pop.addEventListener('click', e => {
      const j = e.target.closest('[data-y]'); if (j) setYear(j.dataset.y);
      if (e.target.closest('[data-era-close]') || e.target.closest('[data-era-map]')) open(false);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { open(false); b.focus(); } });
    document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target) && !b.contains(e.target)) open(false); });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-era-now]')) setYear(NOW);
      if (e.target.closest('[data-era-open]')) { open(true); }
    });
  }
  document.addEventListener('osl:year', () => { renderTop(); const bx = document.getElementById('eraBanner'); if (bx) renderEraBanner(bx.dataset.topic); });
  renderTop();
}
