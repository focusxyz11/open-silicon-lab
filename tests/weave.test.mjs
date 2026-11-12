// The weave: every world is one continuous zoom, every question is tied to real parts of real scenes,
// questions connect the depths, and a core question never shows before its moment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEPTHS, WORLDS, SHARED, THREADS, STOPS, TRIED, CASES, FIGURES, REPO, DIVES, EXITS, MADE, partWord } from '../src/data/weave.js';
import * as E from '../src/engines/weave.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const FACTS = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8'));
const FACT = Object.fromEntries(FACTS.facts.map(f => [f.id, f]));
/* The scenes need a browser to draw, but their parts are plain data: read them without one. */
globalThis.window = globalThis.window || {};
const { SCENES, partsOf } = await import('../src/app/scenes.js');
const each = fn => WORLDS.forEach(w => { E.setWorld(w.id); fn(w); });
const DIVE_WORLDS = WORLDS.filter(w => !w.line), LINE = WORLDS.find(w => w.line && !w.flat);
const eachDive = fn => DIVE_WORLDS.forEach(w => { E.setWorld(w.id); fn(w); });

test('the dives each have their own way down and meet in the same lower depths; the design studio and the journey are lines', () => {
  assert.deepEqual(WORLDS.map(w => w.id), ['datacentre', 'phone', 'car', 'design', 'journey', 'made']);
  const STUDIO = WORLDS.find(w => w.flat);
  assert.deepEqual(STUDIO.depths, ['need', 'logic', 'check', 'gates', 'layout', 'masks']);
  assert.deepEqual(WORLDS[0].depths, ['building', 'rack', 'board', 'chip', 'block', 'gate', 'switch', 'atom']);
  assert.deepEqual(LINE.depths, ['crystal', 'slice', 'clean', 'deposit', 'print', 'etch', 'implant', 'wires', 'test', 'pkg', 'ship']);
  for (const w of DIVE_WORLDS) {
    assert.ok(EN['world.' + w.id + '.name'], w.id + ' has no name');
    assert.deepEqual(w.depths.slice(-SHARED.length), SHARED, w.id + ' does not end in the shared depths');
  }
  /* a depth above the shared ones belongs to one world only, so its portal leads to one place */
  const upper = DIVE_WORLDS.flatMap(w => w.depths.filter(d => !SHARED.includes(d)));
  assert.equal(new Set(upper).size, upper.length);
  assert.deepEqual(Object.keys(DEPTHS).sort(), [...new Set([...upper, ...SHARED, ...LINE.depths, ...STUDIO.depths])].sort());
  assert.ok(EN['world.journey.name'] && EN['world.made.name'] && EN['world.design.name']);
});

test('the journey: stations side by side, moved along smoothly, with ways down and ways out that exist', () => {
  E.setWorld('journey');
  assert.ok(E.isLine() && !E.isLine('datacentre'));
  for (const id of LINE.depths) {
    assert.ok(SCENES[id], id + ' has no scene');
    assert.ok(EN['depth.' + id + '.name'] && EN['depth.' + id + '.see'] && EN['station.' + id + '.when'], id + ' has no words');
  }
  const B = 600, a = E.lineFrames(2, B, 400, 300), b = E.lineFrames(2.5, B, 400, 300), c = E.lineFrames(3, B, 400, 300);
  assert.ok(Math.abs(a.next.tx - a.cur.tx - B * (1 + E.GAP)) < 1e-6, 'stations are evenly spaced, joined into one panorama');
  assert.ok(Math.abs((a.cur.tx + c.prev.tx) / 2 - b.cur.tx) < 1e-6, 'the camera slides evenly');
  assert.ok(Math.abs(E.lineFrames(2.999999, B, 400, 300).next.tx - c.cur.tx) < 1e-3, 'no jump between stations');
  for (const [st, list] of Object.entries({ ...DIVES, ...EXITS })) {
    assert.ok(LINE.depths.includes(st), st + ' is not a station');
    for (const [w, at] of list) { const W = WORLDS.find(x => x.id === w); assert.ok(W && !W.line && W.depths.includes(at), st + ': no ' + w + ':' + at); }
  }
  for (const [at, st] of Object.entries(MADE)) { assert.ok(LINE.depths.includes(st), st + ' is not a station'); assert.ok(WORLDS.some(w => !w.line && w.depths.includes(at)), at + ' is in no dive'); }
  assert.equal(E.zIn('datacentre', 3), 0, 'leaving the line starts a dive at its top');
});

test('every depth is smaller than the last, with a scene, words and a portal inside its scene', () => eachDive(w => {
  w.depths.forEach((id, i) => {
    const d = DEPTHS[id];
    assert.ok(SCENES[id], id + ' has no scene');
    assert.ok(EN['depth.' + id + '.name'] && EN['depth.' + id + '.see'], id + ' has no words');
    if (i) assert.ok(d.m < DEPTHS[w.depths[i - 1]].m, w.id + ': ' + id + ' is not smaller than ' + w.depths[i - 1]);
    if (i < w.depths.length - 1) { const [x, y, s] = d.portal; assert.ok(s > 0 && x >= 0 && y >= 0 && x + s <= 1000 && y + s <= 1000, id + ': the portal is outside the scene'); }
    else assert.equal(d.portal, undefined, 'the last depth has no portal');
  });
}));

test('the zoom is continuous in every world: the end of one depth is exactly the start of the next', () => eachDive(w => {
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

test('the zoom stays continuous for every chip size: the wafer follows the chip in its middle', async () => {
  const { SIDES, dieSquare } = await import('../src/engines/chip.js');
  E.setWorld('made');
  const w = E.IDS.indexOf('wafer');
  for (let size = 0; size < SIDES.length; size++) {
    E.reshape('wafer', { portal: dieSquare(size) }); E.reshape('die', { m: SIDES[size] / 1000 });
    const end = E.frames(w + 0.999999, 600, 400, 300).next, start = E.frames(w + 1, 600, 400, 300).cur;
    assert.ok(Math.abs(end.s - start.s) < 1e-3 && Math.abs(end.tx - start.tx) < 0.5 && Math.abs(end.ty - start.ty) < 0.5, 'a jump at size ' + size);
    let last = Infinity; for (let z = 0; z <= E.N - 1; z += 0.05) { const m = E.sizeAt(z); assert.ok(m < last + 1e-12); last = m; }
  }
  E.reshape('wafer'); E.reshape('die');
});

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

test('one picture all the way down: every scene with a depth below draws it, small, in its portal', () => {
  const src = readFileSync(new URL('../src/app/scenes.js', import.meta.url), 'utf8');
  for (const w of DIVE_WORLDS) w.depths.slice(0, -1).forEach(id => assert.ok(src.includes("inside(G, '" + id + "')"), id + ' does not draw the next depth in its portal'));
  for (const [id, d] of Object.entries(DEPTHS)) if (d.inner) assert.ok(src.includes("inside(G, '" + id + "')"), id + ' does not draw the depth it holds');
});

test('every part of every scene has a name and says what it does', () => {
  for (const [id, sc] of Object.entries(SCENES)) for (const key of Object.keys(sc.parts)) {
    assert.ok(EN['part.' + partWord(id, key)], id + ': the part "' + key + '" has no name');
    assert.ok(EN['what.' + partWord(id, key)], id + ': the part "' + key + '" does not say what it does');
  }
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

test('every figure has a source, a date it was checked and a kind; a number in a question or note comes with one', () => {
  for (const [key, ids] of Object.entries(FIGURES)) {
    assert.ok(STOPS[key], key + ': figures for a stop that does not exist');
    for (const id of ids) {
      const f = FACT[id];
      assert.ok(f, key + ': no figure "' + id + '" in src/data/facts.json');
      assert.ok(f.value && f.label && f.source && /^https:\/\//.test(f.url) && /^\d{4}-\d{2}-\d{2}$/.test(f.verified), id + ': needs a value, a label, a source, a link and the date it was checked');
      assert.ok(f.kind in FACTS.kinds && EN['fact.' + f.kind], id + ': unknown kind ' + f.kind);
    }
  }
  for (const key of Object.keys(STOPS)) {
    const words = EN['stop.' + key + '.q'] + ' ' + EN['stop.' + key + '.note'];
    if (/\d/.test(words)) assert.ok(FIGURES[key] && FIGURES[key].length, key + ' has a number but no figure with a source behind it');
  }
});

test('every real case shows at a stop, with its words, its source and the figures it names', () => {
  for (const c of CASES) {
    assert.ok(STOPS[c.stop], c.id + ': no stop ' + c.stop);
    for (const k of ['t', 'what', 'why', 'after', 'src']) assert.ok(EN['case.' + c.id + '.' + k], c.id + ' has no ' + k);
    assert.match(c.url, /^https:\/\//);
    assert.ok(c.year > 1900 && c.year < 2100);
    for (const id of c.facts) assert.ok(FACT[id], c.id + ': no figure ' + id);
  }
  assert.match(REPO, /^https:\/\/github\.com\//);
});

test('the journey: every step goes somewhere real and says what happens; a robot makes every move; the slice carries on', async () => {
  const { JOURNEY } = await import('../src/app/journey.js');
  const line = WORLDS.find(w => w.line && !w.flat).depths;
  assert.deepEqual(Object.keys(JOURNEY).sort(), [...line].sort(), 'every station of the line has its steps');
  let was = null;
  for (const id of line) {
    const cfg = JOURNEY[id], at = Object.keys(cfg.at);
    cfg.robots.forEach(R => R.zone.forEach(p => assert.ok(at.includes(p), id + ': a robot reaches "' + p + '", which is nowhere')));
    cfg.steps.forEach((s, i) => {
      [s.to, ...s.via].forEach(p => assert.ok(at.includes(p), id + ': step ' + s.k + ' goes to "' + p + '", which is nowhere'));
      assert.ok(EN[s.k], id + ': no words for ' + s.k);
      if (cfg.num[i]) assert.ok(cfg.part[s.to] && EN['part.' + partWord(id, cfg.part[s.to])], id + ': the numbered place "' + s.to + '" is not a part with a name');
      const from = i === 0 || s.appear ? s.to : cfg.steps[i - 1].to, path = [from, ...s.via, s.to];
      if (cfg.nowafer) return;
      for (let k = 1; k < path.length; k++) {
        const a = path[k - 1], b = path[k];
        if (a === b || (cfg.free || []).some(f => f.includes(a) && f.includes(b))) continue;
        assert.ok(cfg.robots.some(R => R.zone.includes(a) && R.zone.includes(b)), id + ': nothing carries the wafer from ' + a + ' to ' + b);
      }
    });
    if (cfg.in != null) { if (was != null) assert.equal(cfg.in, was, id + ': the wafer arrives looking different from how it left the last station'); was = cfg.out; }
  }
});

test('the journey in 3D: every station is built, its parts have words, and the wafer has a place and a robot for every step', async () => {
  const { stationForTest } = await import('../src/app/journey3d.js');
  const { JOURNEY } = await import('../src/app/journey.js');
  const line = WORLDS.find(w => w.line && !w.flat).depths;
  for (const id of line) {
    const st = stationForTest(id, line), cfg = JOURNEY[id];
    assert.ok(st.built, id + ': no 3D machine');
    st.parts.forEach(k => assert.ok(EN['part.' + partWord(id, k)] && EN['what.' + partWord(id, k)], id + ': the 3D part "' + k + '" has no words'));
    (STOPS ? Object.entries(STOPS) : []).filter(([key]) => key.split('.')[1] === id).forEach(([key, parts]) => assert.ok(parts.some(p => st.parts.includes(p)), id + ': ' + key + ' points at nothing in 3D'));
    if (cfg.nowafer) continue;
    const at = Object.keys(st.at);
    cfg.steps.forEach((s, i) => {
      [s.to, ...s.via].forEach(p => assert.ok(at.includes(p), id + ': in 3D, step ' + s.k + ' goes to "' + p + '", which is nowhere'));
      const from = i === 0 || s.appear ? s.to : cfg.steps[i - 1].to, path = [from, ...s.via, s.to];
      for (let k = 1; k < path.length; k++) {
        const a = path[k - 1], b = path[k];
        if (a === b || (cfg.free || []).some(f => f.includes(a) && f.includes(b))) continue;
        assert.ok(st.robots.some(R => R.zone.includes(a) && R.zone.includes(b)), id + ': in 3D, nothing carries the wafer from ' + a + ' to ' + b);
      }
    });
  }
});

test('the lens: it shows only steps that work on the wafer, each picture says what it shows, and every layer it names has a name', async () => {
  const { LENS } = await import('../src/app/lens3d.js');
  const { JOURNEY } = await import('../src/app/journey.js');
  const steps = new Set(Object.values(JOURNEY).flatMap(cfg => cfg.steps.map(s => s.k)));
  for (const [k, mode] of Object.entries(LENS)) {
    assert.ok(steps.has(k) && k.startsWith('proc.'), k + ' is not a step a machine does');
    assert.ok(EN['lens.' + mode], 'the lens has no words for ' + mode);
  }
  const src = readFileSync(new URL('../src/app/lens3d.js', import.meta.url), 'utf8');
  for (const [, k] of src.matchAll(/lab\('(\w+)'/g)) assert.ok(EN['slice.' + k], 'the lens names a layer with no word: ' + k);
  for (const id of Object.keys(DIVES)) for (const [, at] of DIVES[id]) assert.ok(EN['depth.' + at + '.name'], at);
});

test('the world around the line: every place a trip uses is on the map with its words, joined to real stations and worlds', async () => {
  const { SITES, ROUTES } = await import('../src/data/world.js');
  const { sitesOf } = await import('../src/engines/supply.js');
  for (const [w, route] of Object.entries(ROUTES)) {
    assert.ok(WORLDS.some(x => x.id === w && !x.line), w + ' is not a dive');
    for (const id of sitesOf(route)) { assert.ok(SITES[id], id + ' is not on the map'); for (const k of ['name', 'where', 'what', 'who']) assert.ok(EN['site.' + id + '.' + k], 'site.' + id + '.' + k); }
    for (const step of route) {
      assert.ok(EN['route.step.' + step.id], 'route.step.' + step.id);
      assert.ok(EN['route.' + w + '.' + step.id] || EN['route.any.' + step.id], 'no words for ' + w + ' ' + step.id);
      if (step.st) assert.ok(LINE.depths.includes(step.st), step.st);
      if (step.dive) assert.ok(WORLDS.some(x => x.id === step.dive), step.dive);
    }
  }
  for (const [id, s] of Object.entries(SITES)) if (s[3]) assert.ok(LINE.depths.includes(s[3]), id + ' joins a station that does not exist');
});

test('a trip stops after the only place that can do a step, and only strains where others can take over', async () => {
  const { ROUTES } = await import('../src/data/world.js');
  const { status, worst } = await import('../src/engines/supply.js');
  const dc = ROUTES.datacentre, car = ROUTES.car, at = (r, id) => r.findIndex(s => s.id === id);
  assert.ok(status(dc, []).every(s => s.state === 'ok'), 'nothing closed, nothing stops');
  const euv = status(dc, ['vel']);
  assert.equal(euv[at(dc, 'fab')].state, 'stopped', 'no EUV scanners, no advanced fab');
  assert.equal(euv[at(dc, 'use')].state, 'waits', 'and everything after it waits');
  assert.equal(euv[at(dc, 'design')].state, 'ok', 'what comes before goes on');
  assert.deepEqual(worst(euv), { i: at(dc, 'fab'), state: 'stopped' }, 'the trip stops at the fab');
  assert.equal(euv[at(dc, 'tools')].state, 'strained', 'other tools are still made');
  assert.notEqual(status(car, ['vel'])[at(car, 'fab')].state, 'stopped', 'car chips need no EUV');
  assert.equal(status(dc, ['odz'])[at(dc, 'fab')].state, 'strained', 'neon comes from elsewhere too, dearer');
  assert.equal(status(dc, ['hsc', 'tnn'])[at(dc, 'fab')].state, 'strained', 'other fabs exist, not drawn');
});
