// The topic folders keep their contract: every topic has its folder, the generated catalog and graph
// are up to date, element ids never clash across topics, and simulations import shared code the agreed way.
// When one of these fails, the message says what to do; see topics/README.md for the contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildCatalog } from '../scripts/catalog.mjs';
import { TOPICS } from '../src/data/topics.js';

const root = new URL('..', import.meta.url);

test('every topic folder follows the contract (ids unique, labs listed, imports via osl/)', async () => {
  const { problems } = await buildCatalog();
  assert.deepEqual(problems, [], '\n' + problems.join('\n'));
});

test('the generated catalog and graph are up to date (run `npm run catalog` if this fails)', async () => {
  const { outputs } = await buildCatalog();
  for (const [p, text] of Object.entries(outputs)) assert.equal(existsSync(new URL(p, root)) ? readFileSync(new URL(p, root), 'utf8') : '', text, p + ' is out of date. Run: npm run catalog');
});

test('every topic has a folder with content and topic.json', () => {
  for (const t of TOPICS) {
    for (const f of ['content.html', 'topic.json']) assert.ok(existsSync(new URL('topics/' + t.id + '/' + f, root)), 'topics/' + t.id + '/' + f);
  }
});

test('the app shell never imports a topic directly (topics load on demand)', () => {
  for (const f of ['src/main.js', 'src/app/router.js', 'src/app/map.js', 'src/app/views.js']) {
    const src = readFileSync(new URL(f, root), 'utf8');
    assert.doesNotMatch(src, /from\s+'[^']*topics\//, f + ' imports from topics/; use ensureTopic() from src/app/loader.js');
  }
});
