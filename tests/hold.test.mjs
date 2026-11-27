// Hold, the first page (src/v2/hold.js, src/data/hold.js): every number it shows has a fact, the moments come in order
// on the way to the wall and slow the hold without stopping it, the chart of Moore's law beside the count reads true
// data, its three challenges can be won, and every word its plan names exists in every language it is translated into.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { D71, D94, D2011, DWALL, GEN, COST, MOMENTS, WALLS, ARR, TRIP, NEEDS, STOCK, LIGHTS, PARTS, FACT_IDS, FDIV, yearOf, yearAt, dAt, NODES, nodeAt,
  trend, upTo, SERIES, KNEE, ERAS, CHALS, CHIPS, rule } from '../src/data/hold.js';
import { TRANSLATED } from '../src/core/i18n.js';
import { FIG } from '../src/data/figures.js';

const read = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const FACTS = new Set(read('src/data/facts.json').facts.map(f => f.id));
const EN = read('src/i18n/en/hold.json'), CORE = read('src/i18n/en/core.json'), BP = read('src/i18n/en/blueprint.json'), SH = read('src/i18n/en/shared.json');
const LANGS = Object.keys(TRANSLATED).filter(l => TRANSLATED[l].includes('hold'));

test('every fact the first page names is in src/data/facts.json', () => {
  const missing = FACT_IDS.filter(id => !FACTS.has(id));
  assert.deepEqual(missing, [], 'facts missing: ' + missing.join(', '));
});

test('the count runs from one transistor in order: 1971, 1994, the paid years, the wall', () => {
  assert.ok(D71 < D94 && D94 < D2011 && D2011 < DWALL);
  assert.equal(Math.round(yearOf(D94)), 1994);
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
    for (const k of ['t', 's']) assert.ok(EN['hd.wall.' + w.id + '.' + k], 'hd.wall.' + w.id + '.' + k);
    assert.ok(SH['wall.' + w.id + '.d'], 'wall.' + w.id + '.d (shared.json)');
    for (const k of ['q', 'lab']) assert.ok(EN['hd.w.' + w.id + '.' + k], 'hd.w.' + w.id + '.' + k);
    assert.ok(CORE['home.q.' + w.q], w.id + ': ' + w.q);
    for (const [id] of w.ways) assert.ok(EN['hd.bet.' + id + '.t'] || BP['bp.next.' + id + '.t'], 'the way ' + id + ' has no words');
  }
  for (const [id] of ARR) { assert.ok(EN['hd.arr.' + id + '.b'], id); assert.ok(EN['hd.trip.' + TRIP[id]], id + ': its trip'); if (id !== 'classic') assert.ok(EN['hd.bet.' + id + '.t'] || BP['bp.next.' + id + '.t'], id); }
  assert.ok(Object.values(TRIP).filter(v => !v).length >= 1, 'the arrangement challenge needs an arrangement with no trip');
  for (const n of NEEDS) {
    for (const k of ['t', 'd', 'why']) assert.ok(SH['machines.need.' + n.id + '.' + k], n.id + '.' + k);
    for (const [p] of n.parts) assert.ok(EN['hd.piece.' + p], p);
    assert.ok(n.parts.some(p => !STOCK.includes(p[1])), n.id + ' has nothing to choose');
  }
  for (const [k] of PARTS) assert.ok(EN['hd.tab.' + k], 'tab ' + k);
});

test('the first page says the same things in every language it is translated into', () => {
  for (const l of LANGS) {
    for (const [f, E] of [['hold', EN], ['shared', SH]]) {
      const W = read('src/i18n/' + l + '/' + f + '.json');
      assert.deepEqual(Object.keys(W).filter(k => !(k in E)), [], l + '/' + f + ' has words English does not');
      assert.deepEqual(Object.keys(E).filter(k => !(k in W)), [], l + '/' + f + ' is missing words');
    }
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
  const code = ['src/v2/hold.js', 'src/v2/holdkit.js', 'src/v2/holdplates.js', 'src/v2/holdisle.js', 'src/v2/holdnotes.js', 'src/v2/holdboard.js'].map(f => readFileSync(new URL('../' + f, import.meta.url), 'utf8')).join('\n');
  const named = [...code.matchAll(/\bw\(\s*'([\w.-]+)'\s*[,)]/g)].map(m => 'hd.' + m[1]);
  assert.deepEqual([...new Set(named)].filter(k => !(k in EN)), [], 'words missing from src/i18n/en/hold.json');
  const marked = [...code.matchAll(/\bsrc\(([^)]*)\)/g)].flatMap(m => [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map(q => q[1]));
  const listed = [...code.matchAll(/CH_FACTS = \{([\s\S]*?)\};/g)].flatMap(m => [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map(q => q[1]));
  assert.deepEqual([...new Set([...marked, ...listed])].filter(id => !FACTS.has(id)), [], 'sources the page marks that src/data/facts.json does not have');
});

test('a figure Hold and the blueprint both name has one home, and its fact says the same number', () => {
  const F = Object.fromEntries(read('src/data/facts.json').facts.map(f => [f.id, f.value]));
  /* each figure, as its fact writes it (485 → "485", 725e6 → "725", 25e9–35e9 → "25–35", 7000 → "7,000") */
  const said = v => (v >= 1e9 ? String(v / 1e9) : v >= 1e6 ? String(v / 1e6) : v >= 1e4 ? String(v) : v.toLocaleString('en-GB'));
  for (const [id, f] of Object.entries(FIG)) {
    assert.ok(FACTS.has(f.fact), id + ': its fact ' + f.fact + ' is not in facts.json');
    const want = Array.isArray(f.v) ? f.v.map(said).join('–') : said(f.v);
    assert.ok(F[f.fact].replace(/[−-]/g, '–').includes(want), id + ': ' + f.fact + ' does not say ' + want + ' (it says: ' + F[f.fact] + ')');
  }
  /* and no page's words type one of them out again: in every language, Hold, the blueprint and their shared words carry
     a placeholder instead ({dc}, {design}, …, src/v2/figures.js) */
  const typed = { dc: /\b485\b/, dc2030: /\b950\b/, design: /\b725\b|7[.,]25\s?亿/, module: /\b25\s?(–|-|à|a|亿至)\s?35\b|250\s?亿/, euv: /\b400\s?(million|millions|millones)|4\s?亿美元/, run: /\b7[ ,.\u00a0\u202f]?000\s?(\$|dollars|dólares|美元)|\$7,000/ };
  for (const l of ['en', ...LANGS]) for (const f of ['hold', 'blueprint', 'shared']) {
    const W = read('src/i18n/' + l + '/' + f + '.json');
    for (const [k, v] of Object.entries(W)) for (const [id, re] of Object.entries(typed))
      assert.ok(!re.test(String(v)), l + '/' + f + '.json ' + k + ' types out the figure ' + id + ' (src/data/figures.js): use {' + id + '}');
  }
});

test('the first page\'s addresses lead back where they were written, and what a visitor did there counts in the lab', async () => {
  const { CH_AT, HOLD_KEY, heldDone, yearShown } = await import('../src/data/hold.js');
  const { firstPage } = await import('../src/v2/game.js');
  /* a moment's address (#/hold/<moment>) opens at a count inside that moment, so the address written there is the same */
  for (const m of MOMENTS) { const [b, d] = CH_AT[m.id]; assert.equal(b, 'years'); assert.ok(d >= m.at && d < m.at + m.span, m.id + ' opens outside its moment'); }
  for (const id of CHALS) assert.ok(CH_AT[id], id + ' has no place on the page');
  /* a year's address (#/hold/years/<year>) opens at that year, the wall's included */
  for (let y = 1961; y <= 2026; y++) assert.equal(yearShown(Math.min(DWALL, dAt(y))), y, y + ' opens at another year');
  /* only the page's own challenges are read back, and the lab reads them with their addresses */
  assert.deepEqual(heldDone({ done: { gate: 1, keep: 1, half: 1 } }), { gate: 1, keep: 1 });
  assert.deepEqual(heldDone(null), {});
  const store = v => ({ getItem: k => (k === HOLD_KEY ? v : null) });
  const F = firstPage(store(JSON.stringify({ done: { gate: 1, walls: 1, nope: 1 } })));
  assert.equal(F.length, CHALS.length); assert.deepEqual(F.filter(c => c.done).map(c => c.id), ['gate', 'walls']);
  assert.ok(F.every(c => c.href === '#/hold/' + c.id));
  assert.equal(firstPage(store('{not json')).filter(c => c.done).length, 0);
  assert.equal(firstPage({ getItem: () => { throw new Error('no storage'); } }).length, CHALS.length);
});

test('the first page\'s files load: every name they use at the top is imported', async () => {
  /* a merge once used dAt in holdkit.js without importing it, and the first page threw before it drew (fixed with
     this test); the files need only a window's addEventListener to load in node */
  const had = 'addEventListener' in globalThis;
  if (!had) globalThis.addEventListener = () => {};
  try { for (const f of ['../src/v2/holdkit.js', '../src/v2/holdplates.js', '../src/v2/hold.js', '../src/v2/holdisle.js', '../src/v2/holdnotes.js', '../src/v2/holdboard.js']) await import(f); }
  finally { if (!had) delete globalThis.addEventListener; }
});

test('the first page\'s last block is your stack: every rung of the path, each a way in, named in every language', async () => {
  /* the rungs are the stack's own list (src/data/path.js), read by the lazy last picture and never by the first page */
  const { RUNGS } = await import('../src/data/path.js');
  const isle = readFileSync(new URL('../src/v2/holdisle.js', import.meta.url), 'utf8');
  assert.ok(/from '\.\.\/data\/path\.js'/.test(isle) && /'#\/stack\/' \+ r/.test(isle) && /href = '#\/stack'/.test(isle), 'each rung opens #/stack/<rung>, the button #/stack');
  for (const f of ['hold.js', 'holdkit.js', 'holdplates.js']) assert.ok(!/data\/path\.js|\/stack\//.test(readFileSync(new URL('../src/v2/' + f, import.meta.url), 'utf8')), f + ' does not reach the stack\'s code');
  for (const l of ['en', 'zh', 'fr', 'es']) { const W = JSON.parse(readFileSync(new URL('../src/i18n/' + l + '/hold.json', import.meta.url), 'utf8'));
    for (const r of RUNGS) assert.ok(W['hd.sk.' + r + '.t'] && W['hd.sk.' + r + '.d'], l + ': ' + r);
    for (const k of ['isle.go', 'isle.walk', 'isle.map', 'sk.out', 'pl.island', 'isle.lit']) assert.ok(W['hd.' + k], l + ': ' + k); }
});
