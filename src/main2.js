/* Boot of the redesign: load the words, put them on the page, then start the chip world (src/v2/app.js). */
import { loadLang, applyTexts, t } from './core/i18n.js';
import { start } from './v2/app.js';
import { useLedger } from './engines/ledger.js';

const text = async path => { const r = await fetch(path); if (!r.ok) throw new Error(path + ' ' + r.status); return r.text(); };
/* the community's ledger: one list of every entry (made from community/ledger/ by the server, and at deploy). The lab
   still opens without it, with nothing built yet. */
const entries = () => fetch('community/ledger.json').then(r => (r.ok ? r.json() : [])).catch(() => []);
Promise.all([loadLang(text), entries()]).then(([, list]) => { useLedger(list); applyTexts(); document.title = t('ui.lab'); start(); })
  .catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<p style="padding:24px">The lab could not start. Reload the page to try again.</p>'); }); // i18n-ok: the words themselves failed to load
