/* The content from first principles (content/): eleven worlds, each in the same twelve sections, linking only to
   documents and pictures that exist. These tests keep the shape so any world can be read the same way. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { THREADS } from '../src/data/weave.js';

const read = p => readFileSync(new URL('../content/' + p, import.meta.url), 'utf8');
const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const SECTIONS = ['Why it is open', 'What is true', 'The visual system', 'The engine', 'Questions inside', 'Challenges', 'Innovation direction', 'Community topic', 'Real cases', 'Where it meets other questions', 'From earlier work'];

test('one document for each core question, titled with the question itself, in the same sections', () => {
  for (const { id } of THREADS) {
    const md = read(id + '.md'), h2 = [...md.matchAll(/^## (.+)$/gm)].map(m => m[1]);
    assert.equal(md.split('\n')[0], '# ' + EN['thread.' + id + '.root'], id + ': its title is its core question, word for word');
    assert.match(md, /^> \*\*The question behind it:\*\*/m, id + ': says the question behind it');
    let at = -1;
    for (const s of SECTIONS) { const i = h2.findIndex(h => h.startsWith(s)); assert.ok(i > at, id + ': section "' + s + '" missing or out of order'); at = i; }
  }
});

test('every link to another document or picture resolves, and every web link is https', () => {
  for (const f of ['README.md', 'STRUCTURE.md', ...THREADS.map(t => t.id + '.md')]) {
    const md = read(f);
    for (const [, href] of md.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https:\/\//.test(href)) continue;
      assert.ok(!/^http:/.test(href), f + ': ' + href + ' is not https');
      assert.ok(existsSync(new URL('../content/' + href, import.meta.url)), f + ': ' + href + ' does not exist');
    }
  }
});

test('the README names all eleven and the reader lists every document', () => {
  const readme = read('README.md'), reader = read('index.html');
  for (const { id } of THREADS) { assert.ok(readme.includes('](' + id + '.md)'), 'README links ' + id); assert.ok(reader.includes("['" + id + "']"), 'the reader lists ' + id); }
});
