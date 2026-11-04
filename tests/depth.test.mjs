// Depth labs keep their promise: all four stops exist, each is a working link, and each has a mission.
// The guide is docs/DEPTH.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { DEPTHS } from '../src/core/depth.js';

const root = new URL('..', import.meta.url);
const topics = readdirSync(new URL('topics/', root), { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name);
const pages = topics.map(id => [id, existsSync(new URL('topics/' + id + '/content.html', root)) ? readFileSync(new URL('topics/' + id + '/content.html', root), 'utf8') : '']).filter(([, h]) => /class="lab depthlab"/.test(h));

test('at least the two first depth labs exist', () => {
  assert.deepEqual(pages.map(p => p[0]).sort(), ['quantum', 'yield']);
});

test('every depth lab has a rail with four linkable stops and a mission at each', () => {
  for (const [id, h] of pages) {
    for (const d of DEPTHS) assert.match(h, new RegExp('id="[\\w-]+" data-depth="' + d + '"'), id + ' has no ' + d + ' stop');
    DEPTHS.forEach((_, i) => assert.match(h, new RegExp('class="depthmission" data-on="' + i + '"'), id + ' has no mission at depth ' + i));
    assert.match(h, /class="btn depthnext"/, id + ' has no button to the next depth');
  }
});

test('See it stays nearly wordless, and its first challenge is one a newcomer can do', () => {
  for (const [id, h] of pages) {
    const words = [...h.matchAll(/<(p|li|span|button)[^>]*data-on="0[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)].map(m => m[2].replace(/<[^>]+>/g, ' ')).join(' ').trim().split(/\s+/).length;
    assert.ok(words <= 40, id + ': ' + words + ' words only at See it');
    const first = JSON.parse(readFileSync(new URL('topics/' + id + '/topic.json', root), 'utf8')).challenges[0];
    assert.ok(/^#(lab-|[a-z]+-see)/.test(first.href), id + ': the first challenge should start at See it');
  }
});
