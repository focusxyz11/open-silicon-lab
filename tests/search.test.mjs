/* Design it, or search for it? (src/engines/search.js): a person's design against a seeded blind search. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as SR from '../src/engines/search.js';
import { measure } from '../src/engines/evolve.js';
import TC from '../src/engines/tinychip.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();

test('the jobs: three inputs each, small to wide, the person\'s design measured by the studio', () => {
  assert.deepEqual(SR.JOBS.map(j => j.outs.length), [1, 4, 7]);
  for (const j of SR.JOBS) {
    assert.equal(j.patterns, 8);
    assert.ok(measure(j.proj, j.handCode).correct, j.id + ': the person\'s design is right');
    assert.ok(('srch.job.' + j.id) in EN, j.id);
  }
  assert.deepEqual(SR.BUDGETS, [...SR.BUDGETS].sort((a, b) => a - b));
  for (const c of SR.CHECKERS) assert.ok(('srch.check.' + c) in EN, c);
});

test('a seeded search repeats exactly, and goes on where it stopped', () => {
  const a = SR.advance(SR.start('vote', { seed: 3 }), 2e4), b = SR.advance(SR.advance(SR.start('vote', { seed: 3 }), 5e3), 2e4);
  assert.deepEqual(a.marks.map(m => [m.tried, m.correct, m.cells]), b.marks.map(m => [m.tried, m.correct, m.cells]));
  assert.equal(a.tried, 2e4); assert.equal(a.tried % SR.POP, 0);
});

test('with every input checked, the search passes the person, later for wider circuits, and every circuit it keeps is right', () => {
  const at = {};
  /* run each only as far as its first run needs (seed 1), to keep the test quick */
  const RUN = { vote: 2e4, select: 5e4, seg: 5e5 };
  for (const id of SR.JOB_IDS) {
    const s = SR.advance(SR.start(id, { seed: 1 }), RUN[id]), J = SR.jobOf(id);
    at[id] = SR.crossing(s);
    assert.ok(at[id] != null, id + ' is passed within a million circuits');
    const r = SR.at(s, RUN[id]);
    assert.ok(r.beats && r.all && r.cells < J.hand, id);
    /* honest: what passes the checker is right on every input, and the studio agrees */
    for (const p of SR.curve(s)) assert.ok(p.all, id + ': a kept circuit is wrong somewhere');
    assert.ok(measure(J.proj, r.code).correct, id + ': the studio verifies the found circuit');
    assert.equal(SR.check(s, RUN[id]).beat, true);
    assert.equal(SR.check(s, at[id] - 1).beat, false, id + ': before the crossing, not yet');
    /* the best only gets smaller as the budget grows */
    const sizes = SR.BUDGETS.map(b => SR.at(s, b).cells).filter(c => c != null);
    assert.deepEqual(sizes, [...sizes].sort((x, y) => y - x));
  }
  assert.ok(at.vote < at.select && at.select < at.seg, 'a wider circuit moves the crossing right: ' + JSON.stringify(at));
});

test('with half the inputs checked, the search "wins" on those and fails on the rest', () => {
  for (const id of SR.JOB_IDS) {
    const s = SR.advance(SR.start(id, { seed: 1, checker: 'some' }), 1e5), r = SR.at(s, 1e5), J = SR.jobOf(id);
    assert.ok(r.passes && r.beats, id + ' passes the checker with fewer cells than the person');
    assert.ok(r.fooled && r.right < r.patterns, id + ' is wrong on an input nobody tried');
    assert.ok(r.pats.filter(p => p.tested).every(p => p.ok), id + ': right on every input the checker tried');
    assert.equal(r.pats.filter(p => p.tested).length, J.patterns / 2);
    assert.deepEqual(SR.check(s, 1e5), { beat: false, fooled: true });
  }
});

test('the default lab path: the voter at 10,000 circuits beats the person; at 500 it has not yet', () => {
  const s = SR.advance(SR.start('vote', { seed: 1 }), 1e4);
  assert.equal(SR.check(s, 500).beat, false);
  assert.equal(SR.check(s, 1e4).beat, true);
  const f = SR.advance(SR.start('vote', { seed: 1, checker: 'some' }), 500);
  assert.equal(SR.check(f, 500).fooled, true);
  assert.equal(TC.PROJ.find(p => p.id === 'vote').ins.length, 3);
});
