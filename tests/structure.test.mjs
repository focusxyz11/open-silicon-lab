// The topic folders keep their contract: every topic has its folder, the generated catalog and graph
// are up to date, element ids never clash across topics, and simulations import shared code the agreed way.
// When one of these fails, the message says what to do; see topics/README.md for the contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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

test('shared styles stay shared: a rule only one topic uses lives in that topic\'s style.css', () => {
  const css = readFileSync(new URL('src/styles/base.css', root), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const topics = readdirSync(new URL('topics/', root), { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name);
  const text = {};
  const read = p => readFileSync(new URL(p, root), 'utf8');
  for (const t of topics) { let s = read('topics/' + t + '/content.html'); if (existsSync(new URL('topics/' + t + '/labs/', root))) for (const f of readdirSync(new URL('topics/' + t + '/labs/', root))) s += read('topics/' + t + '/labs/' + f); text[t] = s; }
  let shell = read('index.html');
  for (const d of ['src/app/', 'src/labs/', 'src/core/', 'src/engines/', 'src/data/', 'content/']) for (const f of readdirSync(new URL(d, root))) shell += read(d + f);
  const uses = (name, s) => new RegExp('(["\'\\s.#(]|class=")' + name.replace(/-/g, '\\-') + '(["\'\\s:.)\\[,]|$)').test(s);
  const strays = [];
  for (const m of css.matchAll(/(^|\})\s*([^{}@]+)\{/g)) {
    const names = [...m[2].matchAll(/[.#]([a-zA-Z][\w-]*)/g)].map(x => x[1]); if (!names.length) continue;
    if (names.some(n => uses(n, shell))) continue;
    const owners = new Set(names.flatMap(n => topics.filter(t => uses(n, text[t]))));
    if (owners.size === 1) strays.push(m[2].trim() + '  →  topics/' + [...owners][0] + '/style.css');
  }
  assert.deepEqual(strays, [], 'These rules in src/styles/base.css are used by only one topic. Move each to that topic\'s style.css (it loads when the topic opens):\n' + strays.join('\n'));
});
