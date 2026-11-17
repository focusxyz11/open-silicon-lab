// The teardown and the right chip for the job as data (src/data/teardown.js): every id exists, every word is there
// and used, the leading-edge counts are the first version's, and each challenge check passes only for its answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../src/data/teardown.js';

const FACTS = JSON.parse(fs.readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => f.id);

test('every id a product, chip, kind or job points to exists', () => {
  const chips = T.PRODUCTS.flatMap(p => p.chips);
  assert.equal(new Set(chips.map(c => c.id)).size, chips.length, 'a chip id twice');
  assert.equal(new Set(T.PRODUCTS.map(p => p.id)).size, 5);
  for (const c of chips) {
    assert.ok(T.JOBS.includes(c.job), c.id + ' job');
    assert.ok(T.MADE.includes(c.made), c.id + ' made');
    assert.equal(c.leading, c.made === 'lead', c.id + ' leading');
    assert.ok(Array.isArray(c.topics) && c.topics.length > 0 && Array.isArray(c.facts), c.id);
  }
  for (const j of T.JOBS) assert.ok(chips.some(c => c.job === j), 'job ' + j + ' unused');
  for (const m of T.MADE) assert.ok(chips.some(c => c.made === m), 'made ' + m + ' unused');
  for (const p of T.PRODUCTS) assert.equal(p.chips.filter(c => c.big).length, 1, p.id + ' has one big chip');
  const kinds = T.FIT_KINDS.map(k => k.id);
  assert.equal(T.FIT_JOBS.length, 8);
  for (const j of T.FIT_JOBS) {
    assert.ok(kinds.includes(j.best), j.id);
    for (const o of j.ok) assert.ok(kinds.includes(o) && o !== j.best, j.id + ' ok ' + o);
  }
  assert.equal(T.FIT_KINDS.filter(k => k.pos === null).length, 1);
});

test('every fact id exists in the repo facts', () => {
  const used = [...T.PRODUCTS.flatMap(p => [...p.facts, ...p.chips.flatMap(c => c.facts)])];
  assert.deepEqual(T.productById('car').facts, ['chips-per-car', 'legacy-auto']);
  for (const f of used) assert.ok(FACTS.includes(f), 'unknown fact ' + f);
});

test('every thing has its words, and no word is unused', () => {
  const have = Object.keys(T.WORDS), want = T.wordKeys();
  assert.equal(new Set(want).size, want.length, 'a key listed twice');
  for (const k of want) assert.ok(typeof T.WORDS[k] === 'string' && T.WORDS[k].length > 0, 'missing words: ' + k);
  assert.deepEqual(have.filter(k => !want.includes(k)), [], 'words nothing uses');
  for (const k of have) assert.ok(k.startsWith('td.'), k);
  for (const p of T.PRODUCTS) {
    assert.ok(T.WORDS['td.product.' + p.id + '.t']);
    for (const c of p.chips) assert.ok(T.WORDS['td.chip.' + c.id + '.t'] && T.WORDS['td.chip.' + c.id + '.d'], c.id);
  }
  for (const c of T.CHALLENGES) for (const s of ['t', 'goal', 'done']) assert.ok(T.WORDS['td.ch.' + c.id + '.' + s]);
});

test('the leading-edge counts are what the first version showed', () => {
  const got = Object.fromEntries(T.PRODUCTS.map(p => [p.id, [T.leadingCount(p.id), p.chips.length]]));
  assert.deepEqual(got, { phone: [2, 12], car: [0, 11], thermo: [0, 5], laptop: [2, 11], server: [3, 10] });
  assert.equal(T.totalLeading(), 7);
  assert.deepEqual(T.PRODUCTS.find(p => p.id === 'phone').chips.filter(c => c.leading).map(c => c.id), ['ap', 'modem']);
  assert.deepEqual(T.PRODUCTS.find(p => p.id === 'server').chips.filter(c => c.leading).map(c => c.id), ['agpu', 'hcpu', 'nic']);
});

test('the summary picks the first version\'s words', () => {
  assert.equal(T.summaryOf('thermo').key, 'td.sum.none');
  assert.equal(T.summaryOf('car').key, 'td.sum.car');
  assert.equal(T.summaryOf('phone').key, 'td.sum.some');
  assert.deepEqual(T.summaryOf('server').vars, { lead: 3, n: 10 });
  for (const p of T.PRODUCTS) assert.ok(T.WORDS[T.summaryOf(p.id).key] && T.WORDS[T.summaryOf(p.id).then[0]]);
});

test('newest-fab challenge: all five opened and the right count, nothing less', () => {
  const all = T.PRODUCTS.map(p => p.id);
  assert.equal(T.checkNewest({ opened: all, count: 7 }).ok, true);
  assert.equal(T.checkNewest({ opened: all, count: 6 }).ok, false);
  assert.equal(T.checkNewest({ opened: all, count: 8 }).ok, false);
  assert.equal(T.checkNewest({ opened: all.slice(1), count: 7 }).ok, false);
  assert.equal(T.checkNewest({ opened: [], count: 7 }).ok, false);
  assert.equal(T.checkNewest(null).ok, false);
});

test('right-chip challenge: every best fit passes; a sensible second choice or a wrong one does not', () => {
  const best = Object.fromEntries(T.FIT_JOBS.map(j => [j.id, j.best]));
  assert.equal(T.checkJobs({ answers: best }).ok, true);
  assert.equal(T.checkJobs({ answers: {} }).ok, false);
  assert.equal(T.checkJobs(null).ok, false);
  for (const j of T.FIT_JOBS) {
    assert.equal(T.verdict(j.id, j.best), 'best');
    for (const o of j.ok) { assert.equal(T.verdict(j.id, o), 'ok'); assert.equal(T.checkJobs({ answers: { ...best, [j.id]: o } }).ok, false); }
    const wrong = T.FIT_KINDS.map(k => k.id).find(k => k !== j.best && !j.ok.includes(k));
    assert.equal(T.verdict(j.id, wrong), 'no');
    assert.equal(T.checkJobs({ answers: { ...best, [j.id]: wrong } }).best, 7);
  }
  assert.deepEqual(Object.values(best).sort(), ['asic', 'asic', 'cpu', 'dsp', 'fpga', 'gpu', 'mcu', 'power']);
});
