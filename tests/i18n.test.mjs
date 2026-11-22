// Words on screen live in src/i18n/<lang>/<area>.json, never in code, so the site can be translated without
// touching a line of JavaScript. These tests keep it that way: no visible English in the shell's
// code, every text the code asks for exists, no text sits unused, and a translation always has the
// same {names} as English. See src/core/i18n.js and docs/ARCHITECTURE.md ("Words and languages").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { englishIn } from '../scripts/i18n-check.mjs';
import { t, useTexts, fmtWords, fmtList, fmtDate, AREAS, areaOf, LANGS as NAMED, TRANSLATED } from '../src/core/i18n.js';
import { readWords, readAreas } from '../scripts/words.mjs';

const root = new URL('..', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const EN = readWords();
/* The code that draws something for a reader. */
const SHELL = ['src/main2.js'].concat(...['src/app/', 'src/core/', 'src/v2/', 'src/v2/labs/', 'src/v2/glue/'].map(d => readdirSync(new URL(d, root)).filter(f => f.endsWith('.js')).map(f => d + f)));
const LANGS = readdirSync(new URL('src/i18n/', root), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);

test('the shell has no visible English in its code (put it in src/i18n/en/)', () => {
  const hits = SHELL.flatMap(f => englishIn(read(f)).map(([n, s]) => f + ':' + n + '  ' + s));
  assert.deepEqual(hits, [], 'These look like words for readers. Give each a name in src/i18n/en/<area>.json and use t(\'name\') (see src/core/i18n.js):\n' + hits.join('\n'));
});

test('every text the code names exists, and every text is used', () => {
  /* the open port (src/engines/api.js and its MCP server) gives agents the same words */
  const code = SHELL.map(read).join('\n') + read('index.html') + read('src/engines/api.js') + read('scripts/mcp.mjs');
  const literals = new Set([...code.matchAll(/'([\w.-]+)'|"([\w.-]+)"/g)].map(m => m[1] || m[2]));
  const prefixes = [...code.matchAll(/\bt[x]?\(\s*'([\w.-]+[.\w-]*)'\s*\+/g)].map(m => m[1]);
  const named = [...code.matchAll(/\bt[x]?\(\s*'([\w.-]+)'\s*[,)]/g)].map(m => m[1]).concat([...code.matchAll(/data-i18n="([\w.-]+)"/g)].map(m => m[1]), [...code.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap(m => m[1].split(';').map(p => p.split(':')[1])));
  const missing = [...new Set(named)].filter(k => !(k in EN));
  assert.deepEqual(missing, [], 'The code asks for texts that src/i18n/en/ does not have:\n' + missing.join('\n'));
  named.forEach(k => literals.add(k));
  /* words from the earlier site waiting for a view in the chip world (src/data/waiting-words.json): kept, not yet shown */
  const WAITING = new Set(JSON.parse(readFileSync(new URL('src/data/waiting-words.json', root), 'utf8')).keys);
  [...WAITING].forEach(k => assert.ok(k in EN, 'src/data/waiting-words.json names ' + k + ', which src/i18n/en/ does not have'));
  const unused = Object.keys(EN).filter(k => !literals.has(k) && !prefixes.some(p => k.startsWith(p)) && !WAITING.has(k));
  assert.deepEqual(unused, [], 'These texts in src/i18n/en/ are not used anywhere; remove them or use them:\n' + unused.join('\n'));
});

test('texts are plain words with {names}, a few simple tags, plural forms or lists', () => {
  const tags = /<(\/?(b|em|i)|br)>|<a href="[^"]*">|<\/a>/g;
  for (const [k, v] of Object.entries(EN)) {
    const vals = Array.isArray(v) ? v : typeof v === 'object' ? Object.values(v) : [v];
    if (typeof v === 'object' && !Array.isArray(v)) assert.ok('other' in v, k + ' needs an "other" plural form');
    for (const s of vals) {
      assert.equal(typeof s, 'string', k);
      assert.doesNotMatch(s.replace(tags, ''), /<[a-z/]/i, k + ' uses a tag other than <b>, <em>, <i>, <br> and <a href>');
    }
  }
});

test('every translation has the same {names} as English and no texts English lacks', () => {
  const names = v => JSON.stringify([...new Set((typeof v === 'string' ? v : JSON.stringify(v)).match(/\{\w+\}/g) || [])].sort());
  for (const lang of LANGS.filter(l => l !== 'en')) {
    for (const [area, L] of Object.entries(readAreas(lang))) for (const [k, v] of Object.entries(L)) {
      assert.equal(areaOf(k), area, lang + ': "' + k + '" belongs in ' + areaOf(k) + '.json');
      assert.ok(k in EN, lang + ': "' + k + '" is not a text in English');
      assert.equal(names(v), names(EN[k]), lang + ': "' + k + '" must use the same {names} as English');
    }
  }
});

test('every language on disk is named in LANGS, and TRANSLATED lists exactly the areas it has a file for', () => {
  assert.deepEqual([...LANGS].sort(), Object.keys(NAMED).sort(), 'src/i18n/ and LANGS (src/core/i18n.js) name the same languages');
  for (const lang of LANGS.filter(l => l !== 'en'))
    assert.deepEqual(Object.keys(readAreas(lang)).sort(), [...(TRANSLATED[lang] || [])].sort(), lang + ': TRANSLATED in src/core/i18n.js must list exactly the areas in src/i18n/' + lang + '/');
});

test('the words are split by area: every text is in the file of its prefix\'s area, and every area has its file', () => {
  const files = readAreas('en'), prefixes = Object.values(AREAS).flat();
  assert.equal(new Set(prefixes).size, prefixes.length, 'a prefix is in two areas');
  assert.deepEqual(Object.keys(files).sort(), Object.keys(AREAS).sort(), 'src/i18n/en/ holds one file per area of AREAS (src/core/i18n.js)');
  for (const [area, words] of Object.entries(files)) for (const k of Object.keys(words)) {
    assert.ok(areaOf(k), k + ': its prefix has no area; add it to AREAS in src/core/i18n.js');
    assert.equal(areaOf(k), area, k + ' is in ' + area + '.json but belongs in ' + areaOf(k) + '.json');
  }
  /* the first page fetches core.json before anything: it stays small */
  assert.ok(read('src/i18n/en/core.json').length < 120 * 1024, 'core.json is over 120 KB');
});

test('t() fills names, picks plural forms and falls back to the name', () => {
  useTexts({ a: 'Hello {who}', n: { one: '{n} chip', other: '{n} chips' }, l: ['x', 'y'] });
  assert.equal(t('a', { who: 'world' }), 'Hello world');
  assert.equal(t('n', { n: 1 }), '1 chip');
  assert.equal(t('n', { n: 3 }), '3 chips');
  assert.deepEqual(t('l'), ['x', 'y']);
  assert.equal(t('nope'), 'nope');
  useTexts(EN);
});

test('numbers, lists and dates follow the language (English as the site writes it)', () => {
  assert.equal(fmtWords(2300), '2,300');
  assert.equal(fmtWords(1.208e6), '1.21 million');
  assert.equal(fmtWords(3.36e11), '336 billion');
  assert.equal(fmtWords(4e12), '4 trillion');
  assert.equal(fmtList(['x86', 'Arm', 'RISC-V']), 'x86, Arm and RISC-V');
  assert.equal(fmtDate('2026-10-30'), '30 Oct 2026');
});
