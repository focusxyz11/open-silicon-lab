/* Boot: draw the app shell and the map, start the map's own simulations, then hand over to the
   router. Topics are not loaded here: each one loads the first time it is opened (src/app/loader.js). */
import { LABS } from './labs/index.js';
import { loadFacts } from './app/facts.js';
import { initLearning } from './app/learning.js';
import { initAsk } from './app/ask.js';
import { initRouter } from './app/router.js';
import { initEra } from './app/era.js';
import { initMyChip } from './app/mychip.js';
import { initStudioLinks } from './app/studio.js';
import { renderMapShell } from './app/map.js';
import { initGuide } from './app/guide.js';
import { text } from './app/loader.js';
import { issueURL, REPO_URL } from './app/config.js';
import { loadLang, applyTexts, t } from './core/i18n.js';

function wireFooter() {
  document.querySelectorAll('#siteFoot [data-issue]').forEach(a => { a.href = issueURL(a.dataset.issue); a.target = '_blank'; a.rel = 'noopener'; });
  document.querySelectorAll('#siteFoot [data-repo]').forEach(a => { a.href = REPO_URL; a.target = '_blank'; a.rel = 'noopener'; });
}

async function boot() {
  /* Words first: every view asks src/i18n/<lang>.json for its text. */
  await loadLang(text);
  applyTexts();
  document.getElementById('loading').textContent = t('boot.loading');
  wireFooter();
  const [zoom] = await Promise.all([text('content/zoom.html'), loadFacts()]);
  /* The map view holds the zoom viewer and the time machine, whose labs start here. */
  renderMapShell(zoom);
  const foot = document.createElement('div'); foot.className = 'topfoot'; foot.id = 'topicFoot';
  document.getElementById('library').appendChild(foot);
  document.getElementById('loading').hidden = true;
  initEra();
  initMyChip();
  initStudioLinks();
  for (const [name, init] of LABS) { try { init(); } catch (e) { console.error('Lab failed to start:', name, e); } }
  initLearning();
  initAsk();
  initRouter();
  initGuide();
}
boot().catch(e => { const l = document.getElementById('loading'); if (l) { l.hidden = false; l.textContent = /* i18n-ok: the texts may be what failed to load */ 'The lab could not load: ' + e.message + '. If you opened index.html directly from disk, run a local server instead (see README).'; } console.error(e); });
