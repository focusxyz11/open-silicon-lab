// Your design (src/engines/design.js): one circuit from the job to the masks, with the earlier site's
// tiny-chip engine. These tests hold the studio together: every job can be done, the starting
// descriptions that are meant to be wrong are wrong, and every design on the shared chip works.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROJECTS, build, starterOf, solutionOf, normalDesign } from '../src/engines/design.js';
import { COMMUNITY } from '../src/data/community.js';
import TC from '../src/engines/tinychip.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));

test('every job can be done, and goes all the way from description to masks', () => {
  for (const p of PROJECTS) {
    for (const k of ['t', 'd']) assert.ok(EN['design.proj.' + p + '.' + k], 'design.proj.' + p + '.' + k);
    const B = build({ p, code: solutionOf(p) || starterOf(p) });
    assert.equal(B.errs.length, 0, p + ' does not read');
    assert.equal(B.bad, 0, p + ': the working description is wrong');
    assert.ok(B.M.cells.length > 0 && B.RT.failed.length === 0, p + ': not every wire could be routed');
    assert.ok(B.coverage > 0.9, p + ': its test patterns catch too few faults');
    assert.equal(B.levels.length, B.M.cells.length);
  }
});

test('the starting descriptions: right where the job says so, wrong where it says there is a bug', () => {
  const wrong = ['vote', 'full', 'seg', 'alu', 'count'];
  for (const p of PROJECTS) {
    const B = build({ p });
    assert.equal(B.errs.length, 0, p + ': the starting description should read');
    if (wrong.includes(p)) assert.ok(B.bad > 0, p + ' should start with a bug or unfinished');
    else assert.equal(B.bad, 0, p + ' should start right');
  }
});

test('mistakes in a description are named in words', () => {
  const B = build({ p: 'half', code: 'sum = a ^ ;\ncarry = a & q;\na = 1;' });
  assert.ok(B.errs.length >= 2);
  for (const e of B.errs) assert.ok(EN['design.err.' + e.k], 'no words for the error ' + e.k);
  assert.equal(normalDesign({ p: 'nope' }).p, 'half', 'an unknown job falls back to the first');
});

test('every design on the shared chip reads, does its job, and is built into gates and wires', () => {
  const slugs = new Set();
  for (const d of COMMUNITY) {
    assert.match(d.slug, /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/); assert.ok(!slugs.has(d.slug)); slugs.add(d.slug);
    for (const k of ['title', 'author', 'description', 'code']) assert.ok(typeof d[k] === 'string' && d[k].trim(), d.slug + ': ' + k);
    const base = d.project ? TC.PROJ.find(p => p.id === d.project) : { ins: d.ins, outs: d.outs, seq: false };
    assert.ok(base, d.slug + ': unknown job');
    const D = TC.parse(d.code, base.ins, base.outs, { regs: !!base.seq });
    assert.equal(D.errs.length, 0, d.slug + ' does not read');
    if (base.f) assert.equal(TC.verify(D, base).bad, 0, d.slug + ' does not do its job');
    const SY = TC.synth(D, base.ins, base.outs, 'basic', false, '130');
    assert.ok(TC.route(TC.place(SY.M, 0.5, 7)).failed.length === 0, d.slug + ': not every wire could be routed');
  }
  assert.ok(COMMUNITY.length < 24, 'the shared chip in the picture has 24 tiles');
});
