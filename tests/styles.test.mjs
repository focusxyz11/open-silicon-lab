/* The styles, one sheet per view (src/styles/, loaded by src/core/styles.js): the first page loads only base.css and
   blueprint.css, under 60 KB together; every other sheet loads with its view, has its place in ORDER, and is asked for
   by name somewhere; a lab's sheet is its own (src/data/labs/). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { ORDER } from '../src/core/styles.js';
import { LABS } from '../src/data/labs/index.js';

const at = p => new URL('../' + p, import.meta.url);
const read = p => readFileSync(at(p), 'utf8');
/* the chip world's sheets (site.css is the earlier site's, which no page loads now) */
const SHEETS = readdirSync(at('src/styles/')).filter(f => f.endsWith('.css') && f !== 'site.css').map(f => f.slice(0, -4));

test('the first page loads only base.css and blueprint.css, and they weigh under 60 KB together', () => {
  const html = read('index.html');
  const links = [...html.matchAll(/<link rel="stylesheet" href="(src\/styles\/[^"]+)"( data-css="([^"]+)")?>/g)];
  assert.deepEqual(links.map(m => m[1]), ['src/styles/base.css', 'src/styles/blueprint.css']);
  assert.deepEqual(links.map(m => m[3]), ['base', 'blueprint'], 'each named as src/core/styles.js knows it');
  const bytes = ['base', 'blueprint'].reduce((n, s) => n + statSync(at('src/styles/' + s + '.css')).size, 0);
  assert.ok(bytes < 60 * 1024, 'the first page\'s styles weigh ' + Math.round(bytes / 1024) + ' KB');
});

test('every sheet has its place in ORDER, and every view\'s sheet is asked for where its view opens', () => {
  assert.deepEqual(SHEETS.slice().sort(), ORDER.slice().sort(), 'src/styles/*.css and ORDER name the same sheets');
  assert.equal(ORDER[0], 'base'); assert.equal(ORDER[ORDER.length - 1], 'blueprint');
  const shell = read('src/v2/app.js') + read('src/v2/play.js');
  for (const s of ORDER.filter(s => !['base', 'blueprint'].includes(s))) assert.ok(new RegExp("'" + s + "'").test(shell), s + '.css is never asked for (needStyles)');
});

test('a lab\'s sheet is its own: named for a lab that says it has one', () => {
  for (const f of readdirSync(at('src/styles/labs/'))) {
    const l = LABS.find(x => x.name + '.css' === f);
    assert.ok(l && l.css, 'src/styles/labs/' + f + ' belongs to a lab with css: true');
  }
});

test('the old shared sheets are gone, and nothing names them', () => {
  for (const s of ['v2', 'frame2']) assert.ok(!SHEETS.includes(s), s + '.css is split by view now');
  assert.ok(!/v2\.css|frame2\.css/.test(read('index.html')));
});
