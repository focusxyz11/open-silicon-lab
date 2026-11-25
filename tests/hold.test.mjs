// Hold, the first page (src/v2/hold.js, src/data/hold.js): every number it shows has a fact, the moments come in order
// on the way to the wall and slow the hold without stopping it, the chart of Moore's law beside the count reads true
// data, its three challenges can be won, and every word its plan names exists in every language it is translated into.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { D71, D95, D2011, DWALL, GEN, COST, MOMENTS, WALLS, ARR, TRIP, NEEDS, STOCK, LIGHTS, PARTS, FACT_IDS, FDIV, yearOf, yearAt, dAt, NODES, nodeAt,
  trend, upTo, SERIES, KNEE, ERAS, CHALS, CHIPS, rule } from '../src/data/hold.js';
import { TRANSLATED } from '../src/core/i18n.js';

const read = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const FACTS = new Set(read('src/data/facts.json').facts.map(f => f.id));
const EN = read('src/i18n/en/hold.json'), CORE = read('src/i18n/en/core.json'), BP = read('src/i18n/en/blueprint.json');
const LANGS = Object.keys(TRANSLATED).filter(l => TRANSLATED[l].includes('hold'));

test('every fact the first page names is in src/data/facts.json', () => {
  const missing = FACT_IDS.filter(id => !FACTS.has(id));
  assert.deepEqual(missing, [], 'facts missing: ' + missing.join(', '));
});

test('the count runs from one transistor in order: 1971, 1995, the paid years, the wall', () => {
  assert.ok(D71 < D95 && D95 < D2011 && D2011 < DWALL);
  assert.equal(Math.round(yearOf(D95)), 1995);
  assert.equal(Math.round(2 ** DWALL / 1e9), 336);
  assert.equal(COST.length, 6);
  for (let i = 0; i < COST.length; i++) assert.ok(GEN(i) < GEN(i + 1));
  assert.ok(Math.abs(GEN(COST.length) - DWALL) < 1e-9);
});

test('the moments come in order before the wall, and each is gone before the next', () => {
  for (let i = 0; i < MOMENTS.length; i++) {
    const m = MOMENTS[i], n = MOMENTS[i + 1];
    assert.ok(m.at > 0 && m.at + m.span < DWALL, m.id + ' is not on the way to the wall');
    if (n) assert.ok(m.at + m.span <= n.at, m.id + ' still shows when ' + n.id + ' begins');
    assert.ok(CORE['home.q.' + m.q], m.id + ': its question ' + m.q + ' is not one of the core questions');
    assert.match(m.lab, /^#\//);
    for (const k of ['k', 'q', 'lab']) assert.ok(EN['hd.mo.' + m.id + '.' + k], 'hd.mo.' + m.id + '.' + k + ' missing');
  }
  for (const v of [0, 1, 2]) assert.ok(EN['hd.mo.job.' + v + '.v'] && EN['hd.mo.job.' + v + '.d']);
  for (const k of LIGHTS) assert.ok(EN['hd.mo.light.' + k] && EN['hd.mo.light.' + k + '.v'] && EN['hd.mo.light.' + k + '.d']);
  assert.equal(FDIV.a / FDIV.b > FDIV.wrong, true);
  assert.equal((FDIV.a / FDIV.b).toFixed(6), '1.333820');
  assert.equal(FDIV.wrong.toFixed(6), '1.333739');
});

test('every wall, arrangement, need and part has its words, and its question is a core one', () => {
  for (const w of WALLS) {
    for (const k of ['t', 's', 'd']) assert.ok(EN['hd.wall.' + w.id + '.' + k], 'hd.wall.' + w.id + '.' + k);
    for (const k of ['q', 'lab']) assert.ok(EN['hd.w.' + w.id + '.' + k], 'hd.w.' + w.id + '.' + k);
    assert.ok(CORE['home.q.' + w.q], w.id + ': ' + w.q);
    for (const [id] of w.ways) assert.ok(EN['hd.bet.' + id + '.t'] || BP['bp.next.' + id + '.t'], 'the way ' + id + ' has no words');
  }
  for (const [id] of ARR) { assert.ok(EN['hd.arr.' + id + '.b'], id); assert.ok(EN['hd.trip.' + TRIP[id]], id + ': its trip'); if (id !== 'classic') assert.ok(EN['hd.bet.' + id + '.t'] || BP['bp.next.' + id + '.t'], id); }
  assert.ok(Object.values(TRIP).filter(v => !v).length >= 1, 'the arrangement challenge needs an arrangement with no trip');
  for (const n of NEEDS) {
    for (const k of ['t', 'd', 'why']) assert.ok(EN['hd.need.' + n.id + '.' + k], n.id + '.' + k);
    for (const [p] of n.parts) assert.ok(EN['hd.piece.' + p], p);
    assert.ok(n.parts.some(p => !STOCK.includes(p[1])), n.id + ' has nothing to choose');
  }
  for (const [k] of PARTS) assert.ok(EN['hd.tab.' + k], 'tab ' + k);
});

test('the first page says the same things in every language it is translated into', () => {
  for (const l of LANGS) {
    const W = read('src/i18n/' + l + '/hold.json');
    assert.deepEqual(Object.keys(W).filter(k => !(k in EN)), [], l + ' has words English does not');
    assert.deepEqual(Object.keys(EN).filter(k => !(k in W)), [], l + ' is missing words');
  }
});

test('Moore\'s law, live: years and counts agree, and the data behind the chart is real and in order', () => {
  /* a doubling a year before 1971 (Moore, 1965), two after (transistor-trend) */
  assert.equal(yearAt(D71), 1971); assert.ok(Math.abs(dAt(yearAt(17.3)) - 17.3) < 1e-9); assert.ok(Math.abs(dAt(yearAt(5)) - 5) < 1e-9);
  assert.ok(yearAt(0) > 1958 && yearAt(0) < 1962, 'one transistor lands around the first chips');
  for (let i = 1; i < NODES.length; i++) assert.ok(NODES[i][0] > NODES[i - 1][0], 'the generations are in order');
  assert.equal(nodeAt(1970), '20 µm'); assert.equal(nodeAt(2025), '2 nm');
  for (const k of ['tr', ...SERIES]) { const t = trend(k); assert.ok(t.length > 60, k + ' has its chips'); assert.ok(t.every(([y, v]) => y > 1970 && y < 2023 && v > 0), k + ' reads as years and values'); }
  /* the clock stopped climbing: after its knee the best clock rises by less than half; the transistors kept going */
  assert.ok(upTo('hz', 2021) / upTo('hz', KNEE[1]) < 1.5 && upTo('hz', 2004) / upTo('hz', 1994) > 10, 'the clock stalls after its knee');
  assert.ok(upTo('tr', 2021) / upTo('tr', 2004) > 30, 'the transistors do not stall');
  assert.ok(KNEE[0] < 2004 && KNEE[1] > 2004);
  /* the pace that fits the chips is about two years, and Moore's first guess (every year) does not */
  const miss = e => Math.max(...CHIPS.map(([y, n]) => Math.abs(Math.log2(rule(y, e) / n))));
  assert.ok(miss(2) < 3, 'two years keeps every named chip within a few doublings'); assert.ok(miss(1) > 20, 'every year misses by far');
});

test('every era, challenge and chapter has its words; every era its facts', () => {
  for (const [id, y, facts, href] of ERAS) { for (const k of ['b', 't', 'd']) assert.ok(EN['hd.era.' + id + '.' + k], 'hd.era.' + id + '.' + k); assert.ok(y >= 1971 && y <= 2026); assert.ok(facts.every(f => FACTS.has(f)), id); assert.match(href, /^#\//); }
  for (const id of CHALS) assert.ok(EN['hd.ch.' + id], 'hd.ch.' + id);
  assert.equal(new Set(CHALS).size, CHALS.length);
  for (const s of SERIES) assert.ok(EN['hd.ser.' + s] && EN['hd.ser.' + s + '.u'], s);
});

test('every word the page asks for by name exists, and every source it marks is a fact', () => {
  const code = ['src/v2/hold.js', 'src/v2/holdkit.js', 'src/v2/holdplates.js'].map(f => readFileSync(new URL('../' + f, import.meta.url), 'utf8')).join('\n');
  const named = [...code.matchAll(/\bw\(\s*'([\w.-]+)'\s*[,)]/g)].map(m => 'hd.' + m[1]);
  assert.deepEqual([...new Set(named)].filter(k => !(k in EN)), [], 'words missing from src/i18n/en/hold.json');
  const marked = [...code.matchAll(/\bsrc\(([^)]*)\)/g)].flatMap(m => [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map(q => q[1]));
  const listed = [...code.matchAll(/CH_FACTS = \{([\s\S]*?)\};/g)].flatMap(m => [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map(q => q[1]));
  assert.deepEqual([...new Set([...marked, ...listed])].filter(id => !FACTS.has(id)), [], 'sources the page marks that src/data/facts.json does not have');
});
