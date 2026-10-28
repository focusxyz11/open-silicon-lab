/* Live facts: dated, sourced figures kept in src/data/facts.json and updated by pull request. */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : String(d || '–'); };
const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(String(u || '')) ? String(u) : '';
const KIND = { reported: ['ship', 'Reported'], claim: ['ann', 'Vendor claim'], estimate: ['out', 'Estimate'], projection: ['proj', 'Projection'] };

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
  return '<div class="factbox"><div class="fh"><p class="code">Live facts · ' + esc(fs.length) + '</p><span class="small muted">Last checked ' + esc(fmtDate(FACTS.lastCheck)) + '</span></div><div class="ftrack">' + fs.map(f => {
    const k = KIND[f.kind] || KIND.reported, u = safeUrl(f.url);
    return '<div class="f"><div><b>' + esc(f.label) + '</b>' + (f.detail ? '<small>' + esc(f.detail) + '</small>' : '') + '</div><div class="v">' + esc(f.value) + (f.previous ? '<small>Previously: ' + esc(f.previous) + '</small>' : '') + '</div><div class="meta"><span class="pill ' + k[0] + '">' + k[1] + '</span><span>Verified ' + esc(fmtDate(f.verified)) + '</span>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(f.source || 'Source') + '</a>' : '') + '</div></div>';
  }).join('') + '</div></div>';
}

export function changesHTML() {
  if (!FACTS.changes.length) return '';
  return '<div class="clog">' + FACTS.changes.slice(0, 6).map(x => { const u = safeUrl(x.url); return '<div class="it"><span class="y">' + esc(fmtDate(x.date)) + '</span><div><b>' + esc(x.title) + '</b><p>' + esc(x.summary) + (u ? ' <a href="' + esc(u) + '" target="_blank" rel="noopener">Source</a>' : '') + '</p></div></div>'; }).join('') + '</div>';
}
