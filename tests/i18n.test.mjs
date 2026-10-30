// Words on screen live in src/i18n/<lang>.json, never in code, so the site can be translated without
// touching a line of JavaScript. These tests keep it that way: no visible English in the shell's
// code, every text the code asks for exists, no text sits unused, and a translation always has the
// same {names} as English. See src/core/i18n.js and docs/ARCHITECTURE.md ("Words and languages").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { englishIn } from '../scripts/i18n-check.mjs';
import { t, useTexts, fmtWords, fmtList, fmtDate } from '../src/core/i18n.js';

const root = new URL('..', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const EN = JSON.parse(read('src/i18n/en.json'));
/* The shell: everything outside the topic folders that draws something for a reader. */
const SHELL = ['src/main.js'].concat(...['src/app/', 'src/labs/', 'src/core/'].map(d => readdirSync(new URL(d, root)).filter(f => f.endsWith('.js')).map(f => d + f)));
const LANGS = readdirSync(new URL('src/i18n/', root)).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));

test('the shell has no visible English in its code (put it in src/i18n/en.json)', () => {
  const hits = SHELL.flatMap(f => englishIn(read(f)).map(([n, s]) => f + ':' + n + '  ' + s));
  assert.deepEqual(hits, [], 'These look like words for readers. Give each a name in src/i18n/en.json and use t(\'name\') (see src/core/i18n.js):\n' + hits.join('\n'));
});

test('every text the code names exists, and every text is used', () => {
  const code = SHELL.map(read).join('\n') + read('index.html');
  const literals = new Set([...code.matchAll(/'([\w.-]+)'|"([\w.-]+)"/g)].map(m => m[1] || m[2]));
  const prefixes = [...code.matchAll(/\bt[x]?\(\s*'([\w.-]+[.\w-]*)'\s*\+/g)].map(m => m[1]);
  const named = [...code.matchAll(/\bt[x]?\(\s*'([\w.-]+)'\s*[,)]/g)].map(m => m[1]).concat([...code.matchAll(/data-i18n="([\w.-]+)"/g)].map(m => m[1]), [...code.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap(m => m[1].split(';').map(p => p.split(':')[1])));
  const missing = [...new Set(named)].filter(k => !(k in EN));
  assert.deepEqual(missing, [], 'The code asks for texts that src/i18n/en.json does not have:\n' + missing.join('\n'));
  named.forEach(k => literals.add(k));
  const unused = Object.keys(EN).filter(k => !literals.has(k) && !prefixes.some(p => k.startsWith(p)));
  assert.deepEqual(unused, [], 'These texts in src/i18n/en.json are not used anywhere; remove them or use them:\n' + unused.join('\n'));
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
    const L = JSON.parse(read('src/i18n/' + lang + '.json'));
    for (const [k, v] of Object.entries(L)) {
      assert.ok(k in EN, lang + ': "' + k + '" is not a text in English');
      assert.equal(names(v), names(EN[k]), lang + ': "' + k + '" must use the same {names} as English');
    }
  }
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
