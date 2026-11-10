// The weave: every world is one continuous zoom, every question is tied to real parts of real scenes,
// questions connect the depths, and a core question never shows before its moment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEPTHS, WORLDS, SHARED, THREADS, STOPS, TRIED } from '../src/data/weave.js';
import * as E from '../src/engines/weave.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
/* The scenes need a browser to draw, but their parts are plain data: read them without one. */
globalThis.window = globalThis.window || {};
const { SCENES, partsOf } = await import('../src/app/scenes.js');
const each = fn => WORLDS.forEach(w => { E.setWorld(w.id); fn(w); });

test('three worlds, each its own way down, all meeting in the same lower depths', () => {
  assert.deepEqual(WORLDS.map(w => w.id), ['datacentre', 'phone', 'car']);
  assert.deepEqual(WORLDS[0].depths, ['building', 'rack', 'board', 'chip', 'block', 'gate', 'switch', 'atom']);
  for (const w of WORLDS) {
    assert.ok(EN['world.' + w.id + '.name'], w.id + ' has no name');
    assert.deepEqual(w.depths.slice(-SHARED.length), SHARED, w.id + ' does not end in the shared depths');
  }
  /* a depth above the shared ones belongs to one world only, so its portal leads to one place */
  const upper = WORLDS.flatMap(w => w.depths.filter(d => !SHARED.includes(d)));
  assert.equal(new Set(upper).size, upper.length);
  assert.deepEqual(Object.keys(DEPTHS).sort(), [...upper, ...SHARED].sort());
});

test('every depth is smaller than the last, with a scene, words and a portal inside its scene', () => each(w => {
  w.depths.forEach((id, i) => {
    const d = DEPTHS[id];
    assert.ok(SCENES[id], id + ' has no scene');
    assert.ok(EN['depth.' + id + '.name'] && EN['depth.' + id + '.see'], id + ' has no words');
    if (i) assert.ok(d.m < DEPTHS[w.depths[i - 1]].m, w.id + ': ' + id + ' is not smaller than ' + w.depths[i - 1]);
    if (i < w.depths.length - 1) { const [x, y, s] = d.portal; assert.ok(s > 0 && x >= 0 && y >= 0 && x + s <= 1000 && y + s <= 1000, id + ': the portal is outside the scene'); }
    else assert.equal(d.portal, undefined, 'the last depth has no portal');
  });
}));

test('the zoom is continuous in every world: the end of one depth is exactly the start of the next', () => each(w => {
  const B = 600, cx = 400, cy = 300, N = E.N;
  assert.equal(N, w.depths.length);
  for (let i = 0; i < N - 1; i++) {
    const end = E.frames(i + 0.999999, B, cx, cy).next, start = E.frames(i + 1, B, cx, cy).cur;
    assert.ok(Math.abs(end.s - start.s) < 1e-3 && Math.abs(end.tx - start.tx) < 0.5 && Math.abs(end.ty - start.ty) < 0.5, w.id + ': a jump between ' + E.IDS[i] + ' and ' + E.IDS[i + 1]);
    assert.deepEqual(E.cam(i, 0), { ox: 0, oy: 0, size: 1000 });
    const c1 = E.cam(i, 1), p = DEPTHS[E.IDS[i]].portal;
    assert.ok(Math.abs(c1.ox - p[0]) < 1e-6 && Math.abs(c1.oy - p[1]) < 1e-6 && Math.abs(c1.size - p[2]) < 1e-6);
  }
  let last = Infinity;
  for (let z = 0; z <= N - 1; z += 0.05) { const m = E.sizeAt(z); assert.ok(m < last + 1e-12, w.id + ': the size grows at ' + z); last = m; }
  assert.deepEqual(E.sizeParts(120), [120, 'm']);
  assert.deepEqual(E.sizeParts(2e-9), [2, 'nm']);
}));

test('changing world keeps a shared depth, and matches the steps above it', () => {
  E.setWorld('datacentre');
  const at = (w, id) => WORLDS.find(x => x.id === w).depths.indexOf(id);
  assert.equal(E.zIn('phone', E.IDS.indexOf('gate')), at('phone', 'gate'));
  assert.equal(E.zIn('car', 0), 0);
  assert.equal(E.zIn('phone', E.IDS.indexOf('chip')), at('phone', 'soc'));
  assert.equal(E.zIn('car', E.IDS.indexOf('board')), at('car', 'ecu'));
  assert.equal(E.zIn('phone', E.IDS.indexOf('rack')), 0);
  E.setWorld('car');
  assert.equal(E.zIn('datacentre', 0), 0);
  assert.equal(E.zIn('phone', at('car', 'mcu')), at('phone', 'soc'));
  assert.equal(E.zIn('datacentre', at('car', 'ecu')), at('datacentre', 'board'));
  E.setWorld('nowhere');
  assert.equal(E.WORLD, 'datacentre');
});

test('every question lights up parts that exist in its scene, and has its words', () => {
  for (const [key, parts] of Object.entries(STOPS)) {
    const [th, depth] = key.split('.');
    assert.ok(THREADS.some(t => t.id === th), key + ': unknown thread');
    assert.ok(DEPTHS[depth], key + ': unknown depth');
    const P = partsOf(depth);
    for (const p of parts) assert.ok(P[p] && P[p].length, key + ': the scene has no part "' + p + '"');
    assert.ok(EN['stop.' + key + '.q'] && EN['stop.' + key + '.note'], key + ' has no words');
    assert.equal(Array.isArray(EN['stop.' + key + '.tried']), TRIED.includes(key), key + ': "being tried" does not match TRIED');
  }
  for (const th of THREADS) assert.ok(EN['thread.' + th.id + '.root'] && EN['thread.' + th.id + '.behind'], th.id + ' has no core question');
});

test('questions connect the depths: in every world, every depth is crossed by at least two', () => each(w => {
  for (let d = 0; d < E.N; d++) assert.ok(E.crossing(d).length >= 2, w.id + ': ' + E.IDS[d] + ' is crossed by fewer than two questions');
  for (const th of THREADS) {
    const ds = E.threadDepths(th.id);
    if (ds.length < 2) continue;
    assert.equal(E.below(th.id, ds[0]), ds[1]); assert.equal(E.above(th.id, ds[1]), ds[0]);
    assert.equal(E.below(th.id, ds[ds.length - 1]), null); assert.equal(E.above(th.id, ds[0]), null);
    assert.ok(ds.includes(E.nearest(th.id, 0)));
  }
}));

test('each question runs through at least two depths, and meets a new world', () => {
  for (const th of THREADS) {
    const at = Object.keys(STOPS).filter(k => k.startsWith(th.id + '.')).map(k => k.split('.')[1]);
    assert.ok(at.length >= 2, th.id + ' has a form at only ' + at.length + ' depth');
  }
  E.setWorld('datacentre');
  assert.equal(E.stop('think', E.IDS.indexOf('rack'))[0], 'servers');
});

test('a core question waits for its moment: it appears only after its thread has been followed through two depths', () => {
  assert.equal(E.rootShown([]), false);
  assert.equal(E.rootShown(['chip']), false);
  assert.equal(E.rootShown(['chip', 'chip']), false);
  assert.equal(E.rootShown(['chip', 'gate']), true);
  assert.equal(E.rootShown(['soc', 'gate']), true);
  assert.equal(E.rootShown([3, 5]), false, 'depth indexes from an earlier version count for nothing');
  assert.equal(E.rootShown(undefined), false);
});

test('no list of the core questions: the words never gather them in one place', () => {
  const roots = THREADS.map(t => EN['thread.' + t.id + '.root']);
  for (const [k, v] of Object.entries(EN)) {
    if (k.startsWith('thread.')) continue;
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    assert.ok(roots.filter(r => s.includes(r)).length <= 1, k + ' gathers several core questions');
  }
});
