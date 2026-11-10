// The weave: the dive is one continuous zoom, every question is tied to real parts of real scenes,
// questions connect the depths, and a core question never shows before its moment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEPTHS, THREADS, STOPS, TRIED } from '../src/data/weave.js';
import { N, IDS, cam, frames, sizeAt, sizeParts, stop, threadDepths, crossing, below, above, nearest, rootShown } from '../src/engines/weave.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
/* The scenes need a browser to draw, but their parts are plain data: read them without one. */
globalThis.window = globalThis.window || {};
const { SCENES, partsOf } = await import('../src/app/scenes.js');

test('eight depths, building to atom, each smaller than the last, each with a scene and words', () => {
  assert.deepEqual(IDS, ['building', 'rack', 'board', 'chip', 'block', 'gate', 'switch', 'atom']);
  DEPTHS.forEach((d, i) => {
    assert.ok(SCENES[d.id], d.id + ' has no scene');
    assert.ok(EN['depth.' + d.id + '.name'] && EN['depth.' + d.id + '.see'], d.id + ' has no words');
    if (i) assert.ok(d.m < DEPTHS[i - 1].m, d.id + ' is not smaller than ' + DEPTHS[i - 1].id);
    if (i < N - 1) { const [x, y, s] = d.portal; assert.ok(s > 0 && x >= 0 && y >= 0 && x + s <= 1000 && y + s <= 1000, d.id + ': the portal is outside the scene'); }
    else assert.equal(d.portal, undefined, 'the last depth has no portal');
  });
});

test('the zoom is continuous: the end of one depth is exactly the start of the next', () => {
  const B = 600, cx = 400, cy = 300;
  for (let i = 0; i < N - 1; i++) {
    /* at the end of depth i, the next depth fills the box exactly as it does at the start of depth i + 1 */
    const end = frames(i + 0.999999, B, cx, cy).next, start = frames(i + 1, B, cx, cy).cur;
    assert.ok(Math.abs(end.s - start.s) < 1e-3 && Math.abs(end.tx - start.tx) < 0.5 && Math.abs(end.ty - start.ty) < 0.5, 'a jump between ' + IDS[i] + ' and ' + IDS[i + 1]);
    assert.deepEqual(cam(i, 0), { ox: 0, oy: 0, size: 1000 });
    const c1 = cam(i, 1), p = DEPTHS[i].portal;
    assert.ok(Math.abs(c1.ox - p[0]) < 1e-6 && Math.abs(c1.oy - p[1]) < 1e-6 && Math.abs(c1.size - p[2]) < 1e-6);
  }
  /* and the size in view shrinks smoothly from the building to the atom */
  let last = Infinity;
  for (let z = 0; z <= N - 1; z += 0.05) { const m = sizeAt(z); assert.ok(m < last + 1e-12); last = m; }
  assert.deepEqual(sizeParts(120), [120, 'm']);
  assert.deepEqual(sizeParts(2e-9), [2, 'nm']);
});

test('every question lights up parts that exist in its scene, and has its words', () => {
  for (const [key, parts] of Object.entries(STOPS)) {
    const [th, depth] = key.split('.');
    assert.ok(THREADS.some(t => t.id === th), key + ': unknown thread');
    assert.ok(IDS.includes(depth), key + ': unknown depth');
    const P = partsOf(depth);
    for (const p of parts) assert.ok(P[p] && P[p].length, key + ': the scene has no part "' + p + '"');
    assert.ok(EN['stop.' + key + '.q'] && EN['stop.' + key + '.note'], key + ' has no words');
    assert.equal(Array.isArray(EN['stop.' + key + '.tried']), TRIED.includes(key), key + ': "being tried" does not match TRIED');
  }
  for (const th of THREADS) assert.ok(EN['thread.' + th.id + '.root'] && EN['thread.' + th.id + '.behind'], th.id + ' has no core question');
});

test('questions connect the depths: each runs through at least two, and every depth is crossed', () => {
  for (const th of THREADS) {
    const ds = threadDepths(th.id);
    assert.ok(ds.length >= 2, th.id + ' has a form at only ' + ds.length + ' depth');
    assert.equal(below(th.id, ds[0]), ds[1]); assert.equal(above(th.id, ds[1]), ds[0]);
    assert.equal(below(th.id, ds[ds.length - 1]), null); assert.equal(above(th.id, ds[0]), null);
    assert.ok(ds.includes(nearest(th.id, 0)));
  }
  for (let d = 0; d < N; d++) assert.ok(crossing(d).length >= 2, IDS[d] + ' is crossed by fewer than two questions');
  assert.equal(stop('think', IDS.indexOf('rack'))[0], 'servers');
});

test('a core question waits for its moment: it appears only after its thread has been followed through two depths', () => {
  assert.equal(rootShown([]), false);
  assert.equal(rootShown([3]), false);
  assert.equal(rootShown([3, 3]), false);
  assert.equal(rootShown([3, 5]), true);
  assert.equal(rootShown(undefined), false);
});

test('no list of the core questions: the words never gather them in one place', () => {
  const roots = THREADS.map(t => EN['thread.' + t.id + '.root']);
  for (const [k, v] of Object.entries(EN)) {
    if (k.startsWith('thread.')) continue;
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    assert.ok(roots.filter(r => s.includes(r)).length <= 1, k + ' gathers several core questions');
  }
});
