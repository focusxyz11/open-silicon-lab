/* Words on screen come from src/i18n/<lang>.json, never from code. Code names a text and asks for it:
     t('doors.title')                    → "Three ways to start"
     t('map.sims', { n: 3 })             → "3 simulations"   (plural forms: { "one": …, "other": … })
     t('era.back', { year: 2026 })       → "Back to 2026"
   A missing text falls back to English, so a half-finished translation still works.

   Texts may hold {names} filled from the second argument, and the simple tags <b>, <em>, <i>,
   <br> and <a href="…">; nothing else (tests/i18n.test.mjs checks). Numbers and dates go through
   fmtNum and fmtDate so each language writes them its own way.

   Today only English exists. To add a language: copy src/i18n/en.json to src/i18n/<lang>.json,
   translate the values (never the names), and add the language to LANGS below. */
export const LANGS = { en: 'English' };   // i18n-ok: each language is named in its own words
const KEY = 'osl-lang';
let LANG = 'en', MSG = {}, EN = {};

export const lang = () => LANG;
/* The locale used for formatting. English follows the site's style: 30 Oct 2026, "x86, Arm and RISC-V". */
const LOCALE = { en: 'en-GB' };
export const locale = () => LOCALE[LANG] || (LANG === 'qps' ? 'en-GB' : LANG);
export const langName = () => LANGS[LANG] || LANG;

/* Which language to show: ?lang=… in the address, then the reader's last choice, then English. */
function pick() {
  let want = null;
  try { want = new URLSearchParams(location.search).get('lang'); } catch (e) { /* no location (tests) */ }
  if (!want) { try { want = localStorage.getItem(KEY); } catch (e) { /* storage unavailable */ } }
  return want && (LANGS[want] || want === PSEUDO) ? want : 'en';
}
/* A pretend language for checking: ?lang=qps shows every text from the files as [Ŵóŕđş], so any plain
   English left on screen did not come through t() and could not be translated. */
const PSEUDO = 'qps';
const ACC = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', c: 'ç', n: 'ñ', s: 'ş', y: 'ý', A: 'Á', E: 'É', O: 'Ó', S: 'Ş' };
const pseudo = v => Array.isArray(v) ? v.map(pseudo) : typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, pseudo(x)]))
  : '[' + v.split(/(\{\w+\}|<[^>]+>|&\w+;)/).map((p, i) => i % 2 ? p : p.replace(/[a-zA-Z]/g, c => ACC[c] || c)).join('') + ']';

/* Load the texts once, at start-up. text(path) fetches a file (or reads it from the single-file build). */
export async function loadLang(text, chosen) {
  LANG = chosen || pick();
  EN = JSON.parse(await text('src/i18n/en.json'));
  MSG = EN;
  if (LANG === PSEUDO) { MSG = Object.fromEntries(Object.entries(EN).map(([k, v]) => [k, pseudo(v)])); return; }
  if (LANG !== 'en') { try { MSG = Object.assign({}, EN, JSON.parse(await text('src/i18n/' + LANG + '.json'))); } catch (e) { console.error('Language file missing for', LANG, e); LANG = 'en'; } }
  try { document.documentElement.lang = LANG; } catch (e) { /* no document (tests) */ }
}
/* For tests and tools: use a set of texts directly. */
export function useTexts(texts, language = 'en') { EN = texts; MSG = texts; LANG = language; }

const missing = new Set();
const rules = new Map();
const plural = n => { if (!rules.has(LANG)) rules.set(LANG, new Intl.PluralRules(locale())); return rules.get(LANG).select(n); };

/* The text named key, with {names} filled in from vars. */
export function t(key, vars) {
  let m = MSG[key];
  if (m === undefined) m = EN[key];
  if (m === undefined) { if (!missing.has(key)) { missing.add(key); console.warn('Missing text:', key); } return key; }
  if (Array.isArray(m)) return m;   /* a list, such as the steps of a build */
  if (typeof m === 'object') m = m[plural(vars && typeof vars.n === 'number' ? vars.n : 0)] ?? m.other;
  return vars ? m.replace(/\{(\w+)\}/g, (x, k) => (k in vars ? String(vars[k]) : x)) : m;
}
export const has = key => MSG[key] !== undefined || EN[key] !== undefined;

/* Numbers and dates in the reader's language. Dates are YYYY-MM-DD, read as calendar days. */
export const fmtNum = (n, opts) => new Intl.NumberFormat(locale(), opts).format(n);
export function fmtDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(iso || '')); if (!m) return String(iso || '');
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 1));
  return new Intl.DateTimeFormat(locale(), Object.assign({ timeZone: 'UTC' }, m[3] ? opts : { month: 'short', year: 'numeric' })).format(d);
}
/* A list such as "x86, Arm and RISC-V", joined the way the language joins lists. */
export const fmtList = (items, type = 'conjunction') => items.length < 2 ? items.join('') : new Intl.ListFormat(locale(), { style: 'long', type }).format(items);
/* Big numbers in words: 2,300 · 1.21 million · 336 billion · 4 trillion. */
export function fmtWords(n) {
  if (n < 1e6) return fmtNum(Math.round(n));
  return new Intl.NumberFormat(locale(), { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: n >= 1e12 ? 2 : 3 }).format(n);
}

/* Static page text: <a data-i18n="nav.map"></a>, and attributes with data-i18n-attr="aria-label:nav.label". */
export function applyTexts(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(';').forEach(p => { const [a, k] = p.split(':'); if (a && k) el.setAttribute(a.trim(), t(k.trim())); }));
}
