// Your design (src/engines/design.js): one circuit from the job to the masks, with the earlier site's
// tiny-chip engine. These tests hold the studio together: every job can be done, the starting
// descriptions that are meant to be wrong are wrong, and every design on the shared chip works.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROJECTS, build, starterOf, solutionOf, normalDesign } from '../src/engines/design.js';
import { GOAL, NEEDS, DESIGNS, AGENT } from '../src/data/build.js';
import { ENGINES, plan, progress, levels } from '../src/engines/build.js';
import TC from '../src/engines/tinychip.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));

test('every job can be done, and goes all the way from description to masks', () => {
  for (const p of PROJECTS) {
    for (const k of ['t', 'd']) assert.ok(EN['design.proj.' + p + '.' + k], 'design.proj.' + p + '.' + k);
    const B = build({ p, code: solutionOf(p) || starterOf(p), slice: solutionOf('alu') });
    assert.equal(B.errs.length, 0, p + ' does not read');
    assert.equal(B.bad, 0, p + ': the working description is wrong');
    assert.ok(B.M.cells.length > 0 && B.RT.failed.length === 0, p + ': not every wire could be routed');
    assert.ok(B.coverage > 0.9, p + ': its test patterns catch too few faults');
    assert.equal(B.levels.length, B.M.cells.length);
    if (p !== 'core') assert.ok(build({ p, code: solutionOf(p) || starterOf(p), defect: 5 }).defect.wrong > 0, p + ': a stuck wire from the factory changes no answer');
  }
});

test('the starting descriptions: right where the job says so, wrong where it says there is a bug', () => {
  const wrong = ['vote', 'full', 'seg', 'alu', 'count', 'parity', 'core'];
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

test('the plan is one tree from the goal; every piece has words, and an engine or an open slot for one', () => {
  const ids = new Set(NEEDS.map(n => n.id));
  assert.equal(NEEDS.filter(n => n.parent === null).map(n => n.id).join(), GOAL, 'one goal at the top');
  for (const n of NEEDS) {
    assert.ok(EN['build.need.' + n.id + '.t'] && EN['build.need.' + n.id + '.d'], n.id + ' has no words');
    if (n.parent) assert.ok(ids.has(n.parent), n.id + ': unknown parent');
    assert.ok(n.engine === null || ENGINES[n.engine], n.id + ': unknown engine ' + n.engine);
    if (n.engine === 'logic') assert.ok(PROJECTS.includes(n.project), n.id + ': no such job');
    if (n.engine === 'repeat') assert.ok(ids.has(n.of) && n.n > 1, n.id + ': repeats nothing');
  }
  assert.equal(levels().flat().length, NEEDS.length, 'every piece hangs from the goal');
  for (const k of ['built', 'open', 'engine', 'partly']) assert.ok(EN['build.state.' + k]);
});

test('every design in the plan reads, does its job, is built into gates and wires, and says who wrote it', () => {
  const slugs = new Set();
  for (const d of DESIGNS) {
    assert.match(d.slug, /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/); assert.ok(!slugs.has(d.slug)); slugs.add(d.slug);
    for (const k of ['title', 'author', 'description', 'code']) assert.ok(typeof d[k] === 'string' && d[k].trim(), d.slug + ': ' + k);
    assert.ok(EN['build.kind.' + d.kind], d.slug + ': kind must be person, ai, both or example');
    if (d.kind === 'ai' || d.kind === 'both') assert.ok(d.ai && d.ai.trim(), d.slug + ': say how AI was used');
    const n = NEEDS.find(x => x.id === d.need);
    assert.ok(n && n.engine === 'logic', d.slug + ': its need cannot take a design yet');
    assert.ok(ENGINES.logic.check(n, d), d.slug + ' does not do its job');
    const B = build({ p: n.project, code: d.code });
    assert.equal(B.RT.failed.length, 0, d.slug + ': not every wire could be routed');
  }
  assert.ok(DESIGNS.length < 23, 'the shared chip in the picture has 24 tiles, one kept for yours');
  const P = plan([]), pr = progress(P);
  assert.equal(pr.built + pr.open + pr.engine, pr.total);
  assert.equal(P.computer.state, 'partly');
  assert.equal(plan(['half']).half.yours, true);
});

test("an AI agent's proposals: some right, some subtly wrong, each with a claim; the check, not the claim, decides", () => {
  let right = 0, wrong = 0;
  for (const [p, code] of Object.entries(AGENT)) {
    assert.ok(PROJECTS.includes(p), p); assert.ok(EN['build.agent.' + p], p + ' has no claim');
    const B = build({ p, code });
    assert.equal(B.errs.length, 0, p + ': the proposal should read, its flaw is in what it does');
    if (B.spec) { if (B.bad) wrong++; else right++; }
  }
  assert.ok(right >= 2 && wrong >= 4, 'a mix of right and wrong proposals: ' + right + ' right, ' + wrong + ' wrong');
});

test('the core: your slice inside it decides whether real programs give the right answers; the factory can spoil a perfect one', async () => {
  const { buildCore, TESTS, START_PROGRAM } = await import('../src/engines/core.js');
  const good = buildCore(solutionOf('alu'), START_PROGRAM, null);
  assert.equal(good.passed, TESTS.length, 'a right slice runs every test program');
  assert.equal(good.result, 55, 'and the example program adds 1 to 10');
  for (const T of TESTS) assert.ok(EN['core.test.' + T.id + '.t'], T.id + ' has no name');
  assert.ok(buildCore(starterOf('alu'), START_PROGRAM, null).passed < TESTS.length, 'an unfinished slice cannot run them');
  const ai = buildCore(AGENT.alu, START_PROGRAM, null);
  assert.ok(ai.passed > 0 && ai.passed < TESTS.length, "the AI agent's slice passes some programs and fails those that subtract");
  assert.ok(buildCore(solutionOf('alu'), START_PROGRAM, 3).passed < TESTS.length, 'a copy the factory spoiled fails, though its design was perfect');
  assert.equal(build({ p: 'core', slice: solutionOf('alu') }).ok, true);
  assert.equal(plan(['core']).core.yours, true);
});

