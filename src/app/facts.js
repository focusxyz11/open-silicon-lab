/* Live facts: dated, sourced figures kept in src/data/facts.json and updated by pull request. */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
import { t, fmtDate as fmtDay } from '../core/i18n.js';
/* Dates in the reader's language; a missing date shows as a dash. */
export const fmtDate = d => d ? fmtDay(d) : '–';
const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(String(u || '')) ? String(u) : '';
const KIND = { reported: 'ship', claim: 'ann', estimate: 'out', projection: 'proj' };

export const FACTS = { facts: [], changes: [], lastCheck: null, nextCheck: null };

export async function loadFacts() {
  try {
    const inline = window.__OSL_CONTENT__ && window.__OSL_CONTENT__['src/data/facts.json'];
    const j = inline ? JSON.parse(inline) : await (await fetch('src/data/facts.json')).json();
    Object.assign(FACTS, j);
  } catch (e) { console.warn('Facts unavailable', e); }
}
export const factsFor = topic => FACTS.facts.filter(f => f.topic === topic);

export function factsHTML(topic) {
  const fs = factsFor(topic);
  if (!fs.length) return '';
  return '<div class="factbox"><div class="fh"><p class="code">' + t('fact.code', { n: fs.length }) + '</p><span class="small muted">' + esc(t('fact.checked', { date: fmtDate(FACTS.lastCheck) })) + '</span></div><div class="ftrack">' + fs.map(f => {
    const kind = KIND[f.kind] ? f.kind : 'reported', u = safeUrl(f.url);
    return '<div class="f"><div><b>' + esc(f.label) + '</b>' + (f.detail ? '<small>' + esc(f.detail) + '</small>' : '') + '</div><div class="v">' + esc(f.value) + (f.previous ? '<small>' + esc(t('fact.previous', { value: f.previous })) + '</small>' : '') + '</div><div class="meta"><span class="pill ' + KIND[kind] + '">' + t('fact.' + kind) + '</span><span>' + esc(t('fact.verified', { date: fmtDate(f.verified) })) + '</span>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(f.source || t('fact.source')) + '</a>' : '') + '</div></div>';
  }).join('') + '</div></div>';
}

export function changesHTML() {
  if (!FACTS.changes.length) return '';
  return '<div class="clog">' + FACTS.changes.slice(0, 6).map(x => { const u = safeUrl(x.url); return '<div class="it"><span class="y">' + esc(fmtDate(x.date)) + '</span><div><b>' + esc(x.title) + '</b><p>' + esc(x.summary) + (u ? ' <a href="' + esc(u) + '" target="_blank" rel="noopener">' + t('fact.source') + '</a>' : '') + '</p></div></div>'; }).join('') + '</div>';
}
