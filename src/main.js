/* Boot: load the words, put them on the page, then start the dive (src/app/ui.js). */
import { loadLang, applyTexts, t } from './core/i18n.js';
import { start } from './app/ui.js';

/* A file of the site: fetched, or read from the single-file build (scripts/build-single.mjs). */
const text = async path => {
  const inline = window.__OSL_CONTENT__;
  if (inline && path in inline) return inline[path];
  const r = await fetch(path); if (!r.ok) throw new Error(path + ' ' + r.status); return r.text();
};

loadLang(text).then(() => { applyTexts(); document.title = t('ui.title'); start(); })
  .catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<p style="padding:24px">The lab could not start. Reload the page to try again.</p>'); }); // i18n-ok: the words themselves failed to load
