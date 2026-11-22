/* Words on screen come from src/i18n/<lang>.json, never from code. Code names a text and asks for it:
     t('ui.lab')                         → "Open Silicon Lab"
     t('ui.across', { n: 2, unit: 'm' }) → "2 m across"
     plural forms are written { "one": …, "other": … } and chosen by vars.n
   A missing text falls back to English, so a half-finished translation still works.

   Texts may hold {names} filled from the second argument, and the simple tags <b>, <em>, <i>,
   <br> and <a href="…">; nothing else (tests/i18n.test.mjs checks). Numbers and dates go through
   fmtNum and fmtDate so each language writes them its own way.

   The words are split by area, so a view's words load with the view and a language can be translated area by area:
   src/i18n/<lang>/<area>.json, one file per area of AREAS below, each holding the texts whose name starts with one of
   its prefixes (the part before the first dot). core holds what shows before any view opens (the bar, the loop, the
   frame, the map page, Your log, Break it); loadLang loads it, and needWords(area, …) loads an area's file once, before
   a view that shows it draws. A new word goes in the file of its prefix's area; a new prefix gets an area here first
   (tests/i18n.test.mjs checks both).

   Today only English exists. To add a language, area by area: make src/i18n/<lang>/, copy any of src/i18n/en/*.json
   into it and translate the values (never the names), and add the language to LANGS below. An area not yet translated
   shows in English. */
export const LANGS = { en: 'English' };   // i18n-ok: each language is named in its own words
const KEY = 'osl-lang';
let LANG = 'en', MSG = {}, EN = {};

/* every area and the prefixes of the texts it holds. A prefix is the start of a name, whole parts only: 'stop' holds
   every stop.*, 'game.ch' only the challenges' names among game.*; the longest prefix that fits decides. A prefix is in
   one area only */
export const AREAS = {
  core: ['ui', 'loop', 'hero', 'break', 'report', 'sheet', 'nav', 'jump', 'frame2', 'home', 'exp', 'stop', 'depth',
    'map', 'game.ch', 'game.stepAria', 'design.proj', 'build.aiUse', 'build.need', 'ledger.sign',
    'machines.ui.kicker', 'field.perfect.q', 'frame.size', 'board.aria', 'chipx.aria', 'dive.aria', 'lens.aria',
    'place.aria'],
  atlas: ['what', 'part', 'field', 'frame', 'seek', 'debate', 'case', 'thread', 'fact', 'proc', 'handle', 'slice',
    'station', 'plant', 'prim', 'q', 'here', 'zoom', 'dive', 'line', 'ask', 'trail', 'way', 'route', 'lens', 'layer',
    'joule', 'curve', 'world', 'chal', 'mini'],
  place: ['place', 'game', 'grow', 'look', 'dial', 'insp', 'carry', 'door', 'around', 'follow', 'room', 'studio',
    'board', 'story', 'chipx', 'lab', 'society', 'fab', 'whatif'],
  design: ['design', 'bench', 'build', 'ledger', 'api', 'core'],
  labs: ['td', 'bet', 'aib', 'agent', 'srv', 'ana', 'ckp', 'rv', 'er', 'cim', 'grv', 'semi', 'imp', 'ovl', 'eu',
    'lt', 'cz', 'fl', 'mo', 'rd', 'evolve', 'clk', 'floor', 'xray', 'xr', 'chip', 'life', 'gauge', ],
  pages: ['machines', 'mb', 'invent', 'liquid', 'read', 'page', 'site', 'tune', 'swm', 'side', 'walls',
    'forms', 'copies', 'probe', 'plan']
};
const AREA_OF = Object.fromEntries(Object.entries(AREAS).flatMap(([a, ps]) => ps.map(p => [p, a])));
/* the area a text is in, by its name */
export function areaOf(key) {
  const s = String(key).split('.');
  for (let i = s.length; i > 0; i--) { const a = AREA_OF[s.slice(0, i).join('.')]; if (a) return a; }
  return null;
}

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

/* Load the core texts once, at start-up; the other areas when a view needs them (needWords). text(path) fetches a file
   (or reads it from the single-file build). */
let TEXT = null;
const loaded = {};
async function loadArea(area) {
  const en = JSON.parse(await TEXT('src/i18n/en/' + area + '.json'));
  Object.assign(EN, en);
  if (LANG === PSEUDO) { Object.assign(MSG, Object.fromEntries(Object.entries(en).map(([k, v]) => [k, pseudo(v)]))); return; }
  if (LANG !== 'en') { try { Object.assign(MSG, JSON.parse(await TEXT('src/i18n/' + LANG + '/' + area + '.json'))); } catch (e) { /* this area is not translated yet: it shows in English */ } }
}
export async function loadLang(text, chosen) {
  LANG = chosen || pick(); TEXT = text;
  EN = {}; MSG = LANG === 'en' ? EN : {};
  await needWords('core');
  try { document.documentElement.lang = LANG; } catch (e) { /* no document (tests) */ }
}
/* the words of one or more areas, each loaded once; resolves when all are in */
export function needWords(...areas) {
  return Promise.all(areas.map(a => loaded[a] || (loaded[a] = TEXT ? loadArea(a).catch(e => { delete loaded[a]; console.error('Words missing for', a, e); }) : Promise.resolve())));
}
/* every area not loaded yet, for an idle moment */
export const needAllWords = () => needWords(...Object.keys(AREAS));
/* For tests and tools: use a set of texts directly. */
export function useTexts(texts, language = 'en') { EN = texts; MSG = texts; LANG = language; TEXT = null; }

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

/* Static page text: <b data-i18n="ui.lab"></b>, and attributes with data-i18n-attr="aria-label:ui.depths". */
export function applyTexts(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(';').forEach(p => { const [a, k] = p.split(':'); if (a && k) el.setAttribute(a.trim(), t(k.trim())); }));
}
