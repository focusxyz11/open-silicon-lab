/* Boot: load every topic's content, start every lab, then hand over to the router. */
import { TOPICS } from './data/topics.js';
import { LABS } from './labs/index.js';
import { init as initRiscv } from './labs/riscv-lab.js';
import { loadFacts } from './app/facts.js';
import { initLearning } from './app/learning.js';
import { initAsk } from './app/ask.js';
import { initRouter } from './app/router.js';
import { initEra } from './app/era.js';
import { initMyChip } from './app/mychip.js';
import { renderMapShell } from './app/map.js';
import { issueURL, REPO_URL } from './app/config.js';

/* Section ids in the order they sit in the library. Reference pages come last. */
export const SECTION_IDS = TOPICS.map(t => t.id).concat(['glossary', 'sources']);

async function text(path) {
  const inline = window.__OSL_CONTENT__;
  if (inline && inline[path] !== undefined) return inline[path];
  const r = await fetch(path);
  if (!r.ok) throw new Error('Could not load ' + path);
  return r.text();
}

function wireFooter() {
  document.querySelectorAll('#siteFoot [data-issue]').forEach(a => { a.href = issueURL(a.dataset.issue); a.target = '_blank'; a.rel = 'noopener'; });
  document.querySelectorAll('#siteFoot [data-repo]').forEach(a => { a.href = REPO_URL; a.target = '_blank'; a.rel = 'noopener'; });
}

async function boot() {
  wireFooter();
  const lib = document.getElementById('library');
  const [zoom, ...secs] = await Promise.all(['content/zoom.html'].concat(SECTION_IDS.map(id => 'content/sections/' + id + '.html')).map(text));
  /* The map view holds the zoom viewer, so its lab can start with the others. */
  renderMapShell(zoom);
  const frag = document.createDocumentFragment();
  const holder = document.createElement('div');
  holder.innerHTML = secs.join('\n');
  [...holder.children].forEach(el => { el.hidden = true; frag.appendChild(el); });
  const foot = document.createElement('div'); foot.className = 'topfoot'; foot.id = 'topicFoot';
  frag.appendChild(foot);
  lib.appendChild(frag);
  document.getElementById('loading').remove();
  /* Give every lab panel a stable anchor: lab-<topic>-<n>. */
  SECTION_IDS.forEach(id => { const s = document.getElementById(id); if (s) s.querySelectorAll(':scope > .lab, :scope .lab').forEach((l, i) => { if (!l.id) l.id = 'lab-' + id + '-' + (i + 1); }); });
  initEra();
  initMyChip();
  await loadFacts();
  /* Start labs one by one, so one failure never takes down the rest. */
  for (const [name, init] of LABS) { try { init(); } catch (e) { console.error('Lab failed to start:', name, e); } }
  try { initRiscv(); } catch (e) { console.error('Lab failed to start: riscv', e); }
  initLearning();
  initAsk();
  initRouter();
}
boot().catch(e => { const l = document.getElementById('loading'); if (l) l.textContent = 'The lab could not load: ' + e.message + '. If you opened index.html directly from disk, run a local server instead (see README).'; console.error(e); });
