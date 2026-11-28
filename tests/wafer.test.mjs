/* Your design on the wafer at every station (#511, src/v2/studio/wafer.js, made.js): which made step each station of
   the line shows, the guide's 21 dies, and the made die drawn by the rules of each step. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIES, CENTRE, madeStepOf } from '../src/v2/studio/wafer.js';
import { MADE_STEPS } from '../src/v2/studio/made.js';
import { STEPS } from '../src/data/chiprecord.js';
import { WAFER_DIES } from '../src/data/chiprecord.js';
import { WORLDS } from '../src/data/weave.js';

test('every station of the journey shows a made step of the record, in the line\'s order', () => {
  const journey = WORLDS.find(w => w.id === 'journey').depths;
  let last = -1;
  for (const id of journey) { const s = madeStepOf(id); assert.ok(s, id + ' shows a made step'); const k = MADE_STEPS.indexOf(s); assert.ok(k >= last, id + ' never shows an earlier step than the station before it'); last = k; }
  assert.deepEqual(MADE_STEPS, STEPS.filter(s => s !== 'pkg'), 'the made steps are the record\'s stations, Package waiting');
  assert.equal(DIES.length, WAFER_DIES, 'the wafer\'s dies are the ones Test finds');
  assert.deepEqual(DIES[CENTRE], [0, 0], 'the centre die is yours to follow');
});

test('the made die is drawn by the rules of each step: bare before Print, printed, then solid; a failed die red', () => {
  const calls = []; const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...a) => calls.push([k, ...a])), set: (o, k, v) => { o[k] = v; calls.push(['set', k, v]); return true; } });
  return import('../src/v2/studio/made.js').then(async ({ madeDie }) => {
    const { planOf } = await import('../src/v2/studio/plan.js'), { recordOf } = await import('../src/engines/chiprecord.js'), { stackOf } = await import('../src/engines/path.js'), { solutionOf } = await import('../src/engines/design.js');
    const P = planOf(recordOf(stackOf(), { p: 'alu', code: solutionOf('alu') })), C = { bg: '#000000', ink: '#ffffff', accent: '#5aa9ff', bad: '#ff6b62', panel: '#111a2b' }, cam = { ox: 0, oy: 0, s: 0.3 };
    const run = made => { calls.length = 0; madeDie(ctx, P, cam, { C, made }); return calls.slice(); };
    const dashes = c => c.filter(x => x[0] === 'setLineDash').map(x => x[1].join(','));
    assert.ok(dashes(run({ f: 0 })).includes('2,3'), 'before Print: a dotted outline');
    assert.ok(!run({ f: 0 }).some(x => x[0] === 'set' && x[1] === 'fillStyle' && x[2] === C.panel), 'and nothing cut');
    assert.ok(run({ f: 2 }).some(x => x[0] === 'set' && x[1] === 'fillStyle' && /0\.16\)$/.test(x[2])), 'Print: printed in the resist, filled 16%');
    assert.ok(run({ f: 3 }).some(x => x[0] === 'set' && x[1] === 'fillStyle' && x[2] === C.panel), 'Etch: solid');
    assert.ok(run({ f: 6, failed: true }).some(x => x[0] === 'set' && x[1] === 'fillStyle' && x[2] === C.bad), 'Test: a failed die red');
    assert.ok(dashes(run({ f: 4, stopped: true })).includes('2,3'), 'a design that stops the line leaves the wafer bare from Print on');
  });
});
