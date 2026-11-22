/* The content from first principles (content/): eleven worlds, each in the same twelve sections, linking only to
   documents and pictures that exist. These tests keep the shape so any world can be read the same way. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { THREADS } from '../src/data/weave.js';
import { readWords } from '../scripts/words.mjs';

const read = p => readFileSync(new URL('../content/' + p, import.meta.url), 'utf8');
const EN = readWords();
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
  for (const f of ['README.md', 'STRUCTURE.md', ...THREADS.map(t => t.id + '.md'), 'puzzles/README.md', 'puzzles/energy.md', 'puzzles/errors.md']) {
    const md = read(f), dir = f.includes('/') ? f.slice(0, f.lastIndexOf('/') + 1) : '';
    for (const [, href] of md.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https:\/\//.test(href)) continue;
      assert.ok(!/^http:/.test(href), f + ': ' + href + ' is not https');
      assert.ok(existsSync(new URL('../content/' + dir + href, import.meta.url)), f + ': ' + href + ' does not exist');
    }
  }
});

test('the README names all eleven and the reader lists every document', () => {
  const readme = read('README.md'), reader = read('index.html');
  for (const { id } of THREADS) { assert.ok(readme.includes('](' + id + '.md)'), 'README links ' + id); assert.ok(reader.includes("['" + id + "']"), 'the reader lists ' + id); }
});

test('the site shows each world from its document: every challenge it says is playable is one the document names, and every picture it uses exists', async () => {
  const { WORLDS, WORLD_IDS, challengeName } = await import('../src/data/worlds.js');
  const { parseWorld } = await import('../src/v2/md.js');
  const { PROBES } = await import('../src/v2/probes.js');
  assert.deepEqual(WORLD_IDS, THREADS.map(t => t.id));
  for (const id of WORLD_IDS) {
    const W = WORLDS[id], P = parseWorld(read(id + '.md')), names = P.challenges.map(r => challengeName(r[0]));
    assert.ok(P.truths.length >= 6 && P.questions.length >= 6 && P.challenges.length >= 3, id + ': truths, questions and challenges parsed');
    assert.equal(P.title, EN['thread.' + id + '.root'], id + ': title');
    for (const k of Object.keys(W.play)) assert.ok(names.includes(k), id + ': "' + k + '" is not a challenge its document names');
    for (const v of Object.values(W.play)) assert.ok(v === 'here' || /^#\/[a-z0-9\/-]+$/.test(v), id + ': ' + v);
    if (Object.values(W.play).includes('here')) assert.ok(['copies', 'walls', 'probes', 'forms', 'plan', 'clock', 'side', 'swarm', 'tune'].includes(W.lens), id + ': played "here" needs a live picture');
    for (const p of W.probes || []) assert.ok(PROBES[p], id + ': no try ' + p);
    assert.ok(existsSync(new URL('../content/img/' + (W.sketch || id) + '.svg', import.meta.url)), id + ': its sketch');
  }
});
