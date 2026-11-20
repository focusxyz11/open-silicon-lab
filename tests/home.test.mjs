// The map, the first page (src/data/home.js, src/engines/home.js, src/v2/home.js): every station is an address of the
// chip world with words that exist, every challenge is at one station, the twelve questions are threads through real
// stations (one starting at each station at most), and the toys behave as they say.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STATIONS, THREADS, WAYS, STARTS, TOYS, LINES } from '../src/data/home.js';
import * as H from '../src/engines/home.js';
import { CHALLENGES, viewOfDepth } from '../src/v2/game.js';
import { doHome } from '../src/engines/way.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));

test('every station has its own address and words that exist', () => {
  const hrefs = STATIONS.map(s => s.href);
  assert.equal(new Set(hrefs).size, hrefs.length, 'two stations share an address');
  for (const s of STATIONS) {
    for (const k of [s.name, s.see]) assert.ok(k in EN, s.id + ' names the word ' + k + ', which en.json does not have');
    if (s.sub) assert.ok(('home.sub.' + s.id) in EN, s.id + ' needs home.sub.' + s.id);
    for (const [href, k] of s.pages) { assert.ok(k in EN, s.id + ': ' + k); assert.match(href, /^#\//); }
    for (const l of s.links) assert.ok(H.byId[l], s.id + ' links to ' + l + ', which is not a station');
  }
  /* a station named after a level of the chip world opens that level's own view */
  for (const s of STATIONS.filter(x => x.name === 'depth.' + x.id + '.name' && x.line !== 'scale')) assert.equal(s.href, viewOfDepth(s.id), s.id);
});

test('every challenge is at exactly one station', () => {
  const at = H.challengesAt(CHALLENGES, doHome), all = Object.values(at).flat();
  assert.equal(all.length, new Set(all).size, 'a challenge is at two stations');
  const missing = CHALLENGES.map(c => c.id).filter(id => !all.includes(id));
  assert.deepEqual(missing, [], 'these challenges are on no station of the map (give their view or place to one): ' + missing.join(', '));
});

test('the twelve questions are threads through the map, one starting at a station at most', () => {
  assert.equal(THREADS.length, 12);
  const homes = THREADS.map(x => x.home);
  assert.equal(new Set(homes).size, homes.length, 'two questions start at one station');
  for (const T of THREADS) {
    assert.ok(T.word in EN, T.word);
    assert.equal(T.path[0], T.home);
    for (const s of T.path) assert.ok(H.byId[s], T.id + ' runs through ' + s + ', which is not a station');
    assert.ok(H.threadRuns(T.id).length > 0);
  }
  assert.equal(H.nextThread(THREADS[11].id), THREADS[0].id, 'the next question comes round again');
});

test('ways in and first things to try name real things', () => {
  const lines = LINES.map(l => l.id), ids = new Set(CHALLENGES.map(c => c.id));
  for (const W of WAYS) { assert.ok(('home.way.' + W.id + '.t') in EN, W.id); W.lines.forEach(l => assert.ok(lines.includes(l))); W.stations.forEach(s => assert.ok(H.byId[s], W.id + ': ' + s)); }
  for (const S of STARTS) { assert.ok(H.byId[S.at]); if (S.ch) assert.ok(ids.has(S.ch), S.ch); else assert.ok(('home.start.' + S.word + '.t') in EN); }
  for (const k of ['wafer', 'gate', 'shrink', 'pack']) { const T = TOYS[k]; if (T.at) assert.ok(H.byId[T.at], k); if (T.ch) assert.ok(ids.has(T.ch), k); if (T.thread) assert.ok(H.threadOf(T.thread), k); }
});

test('a level is joined to how it is designed and made', () => {
  assert.deepEqual(H.twinsOf('chip').ids.sort(), ['need', 'pkg']);
  assert.ok(H.twinsOf('print').ids.includes('gate'));
  assert.equal(H.twinsOf('rack'), null);
  assert.ok(H.linksOf('masks').includes('print') && H.linksOf('print').includes('masks'), 'joins go both ways');
});

test('the wafer: the same dust ruins more of the wafer when the chips are bigger', () => {
  const a = H.wafer(1, 7), b = H.wafer(1, 7);
  assert.deepEqual(a, b, 'the same seed makes the same wafer');
  const mean = size => { let g = 0, n = 0; for (let s = 1; s <= 40; s++) { const y = H.yieldOf(H.wafer(size, s).dies); g += y.good; n += y.total; } return g / n; };
  const small = mean(0), mid = mean(1), big = mean(2);
  assert.ok(small > mid && mid > big, 'yield falls as chips grow: ' + [small, mid, big].map(x => x.toFixed(2)).join(' > '));
  assert.ok(H.wafer(0, 3).dies.length > H.wafer(2, 3).dies.length * 4, 'small chips fit many more to a wafer');
  const y = H.yieldOf(a.dies, 5); assert.equal(y.done, 5); assert.equal(H.yieldOf(a.dies, 0).pct, null);
});

test('the gate, the shrinking switch and the packed cores', () => {
  assert.deepEqual([[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => H.gate('NAND', a, b)), [1, 1, 1, 0]);
  assert.deepEqual([[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => H.gate('XOR', a, b)), [0, 1, 1, 0]);
  const counts = TOYS.shrink.years.map(H.shrinkAt);
  counts.forEach((n, i) => { assert.ok(n > 0, 'no processor in ' + TOYS.shrink.years[i]); if (i) assert.ok(n > counts[i - 1], 'more switches each step'); });
  assert.equal(H.shrinkAt(1971), 2310);
  const p = [0, 1, 2].map(H.packAt);
  assert.ok(p[0].heat > p[1].heat && p[1].heat > p[2].heat && p[0].talk < p[2].talk, 'closer is hotter and quicker');
});

test('every word the map\'s view asks for exists', () => {
  const src = readFileSync(new URL('../src/v2/home.js', import.meta.url), 'utf8');
  const keys = [...src.matchAll(/\bw\('([\w.-]+)'[,)]/g)].map(m => 'home.' + m[1]);
  assert.ok(keys.length > 40);
  const missing = [...new Set(keys)].filter(k => !(k in EN));
  assert.deepEqual(missing, [], 'en.json lacks: ' + missing.join(', '));
  /* words named by pieces: each piece's whole set */
  const sets = { 'home.wafer.s': [0, 1, 2], 'home.pack.n': [0, 1, 2], 'home.pack.p': [0, 1, 2] };
  for (const [p, xs] of Object.entries(sets)) xs.forEach(x => assert.ok((p + x) in EN, p + x));
  for (const k of ['design', 'make', 'scale', 'loop']) ['home.line.', 'home.read.'].forEach(p => assert.ok((p + k) in EN, p + k));
  for (const k of ['design', 'make', 'scale']) assert.ok(('home.col.' + k + '.d') in EN && ('home.twin.' + k) in EN);
  for (const k of ['play', 'puzzle', 'build', 'lab', 'see', 'page', 'q']) assert.ok(('home.tag.' + k) in EN, k);
});
