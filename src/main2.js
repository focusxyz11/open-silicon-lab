/* Boot of the redesign: load the words, put them on the page, then start the chip world (src/v2/app.js). */
import { loadLang, applyTexts, t } from './core/i18n.js';
import { start } from './v2/app.js';

const text = async path => { const r = await fetch(path); if (!r.ok) throw new Error(path + ' ' + r.status); return r.text(); };
loadLang(text).then(() => { applyTexts(); document.title = t('ui.lab'); start(); })
  .catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<p style="padding:24px">The lab could not start. Reload the page to try again.</p>'); }); // i18n-ok: the words themselves failed to load
