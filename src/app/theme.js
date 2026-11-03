/* Light, dark or automatic (follow the device). The choice sets data-theme on <html>, which the
   color tokens in src/styles/base.css and every canvas (src/core/ui.js redraws) follow. It is
   remembered in this browser only. */
import { t } from '../core/i18n.js';

const KEY = 'osl.theme', MODES = ['auto', 'light', 'dark'];
const ICON = {
  auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
};
let mode = 'auto';

function read() { try { const v = localStorage.getItem(KEY); return MODES.includes(v) ? v : 'auto'; } catch (e) { return 'auto'; } }
function save(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage may be off: the choice lasts for this visit */ } }

function apply() {
  if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', mode);
  const b = document.getElementById('themeBtn');
  if (!b) return;
  const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  b.innerHTML = ICON[mode] + '<span>' + t('theme.' + mode) + '</span>';
  b.setAttribute('aria-label', t('theme.label', { mode: t('theme.' + mode), next: t('theme.' + next) }));
  b.title = b.getAttribute('aria-label');
}

export function initTheme() {
  mode = read();
  apply();
  const b = document.getElementById('themeBtn');
  if (b) b.addEventListener('click', () => { mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length]; save(mode); apply(); });
}
