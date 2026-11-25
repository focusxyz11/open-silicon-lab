/* Every view waits for the words it shows (src/core/i18n.js): a text read before its area has loaded shows as its name,
   and on a connection that saves data nothing loads the other areas ahead, so a view that forgot one shows names for
   good. This reads, for every module, the texts it names (t('a.b'), t('a.' + …), data-i18n, and any string that is the
   name of a text) and so the areas it shows; follows the imports (static, and import('…') with a written path) from each
   view's own module; and checks each view waits for every area its modules show:
     a view's glue (src/v2/glue/<k>.js): the areas in WORDS beside GLUE in src/v2/app.js, its own and those of the glue
       it builds on;
     a lab (src/v2/labs/<name>.js): played in the card of a view, with what every such view waits for and the labs
       area, which labsReady awaits (src/v2/play.js); what it grows on the island (src/v2/growers/<name>.js) is drawn
       with the island's words;
     the first page (src/v2/hold.js): hold, and the blueprint's words, which it loads when first touched and fills in
       then (fillWays);
     the views the shell opens itself (the island's map, the blueprint, the station map): what app.js awaits for each;
     the shell's own modules (loaded with the first page and run for every view): only what every view below the
       first page waits for.
   A module reached from a view counts whole, even the parts that view never runs: wait for its area, or move the
   word to an area the view has. The browser smoke test checks the same on the page, with Data Saver on
   (scripts/smoke/slow.mjs). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { areaOf } from '../src/core/i18n.js';
import { readWords } from '../scripts/words.mjs';
import { LABS } from '../src/data/labs/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EN = readWords();
const rel = f => relative(ROOT, f).split('\\').join('/');
const abs = p => resolve(ROOT, p);
const SRC = new Map();
const read = f => { if (!SRC.has(f)) SRC.set(f, readFileSync(f, 'utf8')); return SRC.get(f); };
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, p) => p);

/* the modules one module imports: statically, and (dynamic) with import('…') of a written path */
function importsOf(f, dynamic) {
  const s = noComments(read(f)), out = [];
  const re = dynamic ? /^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm
    : /^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm;
  for (let m; (m = re.exec(s));) { const p = m[1] || m[2] || m[3]; if (p.startsWith('.')) out.push(resolve(dirname(f), p)); }
  return out;
}
/* every module reached from some entries, leaving out those already loaded (skip) */
function reach(entries, { dynamic = true, skip = new Set() } = {}) {
  const seen = new Set(), visit = f => { if (seen.has(f) || skip.has(f)) return; seen.add(f); importsOf(f, dynamic).forEach(visit); };
  entries.map(abs).forEach(visit);
  return seen;
}
/* the areas a module shows, each with the texts that show it */
const AREAS_IN = new Map();
function areasIn(f) {
  if (AREAS_IN.has(f)) return AREAS_IN.get(f);
  const s = noComments(read(f)), A = new Map(), add = (k, as) => { const a = areaOf(k); if (!a) return; if (!A.has(a)) A.set(a, new Set()); A.get(a).add(as); };
  for (const m of s.matchAll(/\bt\(\s*'([\w-]+(?:\.[\w-]+)*)\.?'\s*\+/g)) add(m[1], m[1] + '.*');
  for (const m of s.matchAll(/'([\w-]+(?:\.[\w-]+)+)'|"([\w-]+(?:\.[\w-]+)+)"/g)) { const k = m[1] || m[2]; if (k in EN) add(k, k); }
  AREAS_IN.set(f, A);
  return A;
}
/* what a set of modules shows that the areas it waits for leave out */
function unwaited(mods, waits) {
  const W = new Set(['core', ...waits]), out = [];
  for (const f of [...mods].sort()) for (const [a, ks] of areasIn(f)) if (!W.has(a)) out.push(rel(f) + ' shows ' + a + ' (' + [...ks].slice(0, 4).join(', ') + ')');
  return out;
}
const tell = (who, waits, out) => who + ' waits for ' + ['core', ...waits].join(', ') + ' but:\n  ' + out.join('\n  ');

/* the shell's table of glue and the areas each awaits (src/v2/app.js): GLUE (what each builds on) and WORDS */
const APP = read(abs('src/v2/app.js'));
const objectAt = name => Function('return (' + APP.match(new RegExp('const ' + name + ' = (\\{[^}]*\\})'))[1] + ')')();
const GLUE = objectAt('GLUE'), WORDS = objectAt('WORDS');
const glueWaits = k => [...new Set((WORDS[k] || []).concat(...GLUE[k].map(glueWaits)))];
/* what every view below the first page waits for: the card of any view holds a challenge, a question, a level */
const EVERY = Object.keys(GLUE).map(glueWaits).reduce((a, b) => a.filter(x => b.includes(x)));
const BOOT = reach(['src/main2.js'], { dynamic: false });
const HOLD = reach(['src/v2/hold.js'], { dynamic: false });

test('the shell knows its glue and the words each awaits', () => {
  assert.ok(Object.keys(GLUE).length >= 8, 'GLUE in src/v2/app.js');
  for (const k of Object.keys(WORDS)) assert.ok(GLUE[k], 'WORDS names ' + k + ', which is not in GLUE');
  for (const a of Object.values(WORDS).flat()) assert.ok(read(abs('src/i18n/en/' + a + '.json')), a);
});

test('each view\'s glue waits for every area its modules show', () => {
  const bad = Object.keys(GLUE).flatMap(k => { const out = unwaited(reach(['src/v2/glue/' + k + '.js'], { skip: BOOT }), glueWaits(k)); return out.length ? [tell('glue/' + k, glueWaits(k), out)] : []; });
  assert.deepEqual(bad, [], 'A view shows words it does not wait for (add the area to WORDS in src/v2/app.js, or move the words to an area it has):\n' + bad.join('\n'));
});

test('each lab waits for every area it shows, and what it grows draws with the island\'s words', () => {
  const bad = [];
  for (const L of LABS) {
    const waits = EVERY.concat('labs'), out = unwaited(reach(['src/v2/labs/' + L.name + '.js'], { skip: BOOT }), waits);
    if (out.length) bad.push(tell('the lab ' + L.name, waits, out));
    const grows = unwaited(reach(['src/v2/growers/' + L.name + '.js'], { skip: BOOT }), glueWaits('island'));
    if (grows.length) bad.push(tell('what ' + L.name + ' grows', glueWaits('island'), grows));
  }
  assert.deepEqual(bad, [], 'A lab shows words it does not wait for (move them to the labs area, or to an area every view waits for):\n' + bad.join('\n'));
});

test('the first page and the views the shell opens itself wait for the areas they show', () => {
  /* what app.js awaits before each draws: Hold its own words (and the blueprint's and the shared ones when first
     touched), the blueprint its own and the shared ones, the station map the pages', the island's map the island's */
  const awaits = (re, what) => assert.ok(re.test(APP), 'src/v2/app.js no longer awaits ' + what);
  awaits(/needWords\('hold'\)\.then\(\(\) => \{ (?:if \(n !== V\.routeN\) return; )?if \(!hold\) hold = createHold/, 'hold before Hold');
  awaits(/import\('\.\/home\.js'\), needWords\('blueprint', 'shared'\)/, 'blueprint before the blueprint');
  awaits(/import\('\.\/stations\.js'\), needWords\('pages'\)/, 'pages before the station map');
  awaits(/import\('\.\/map3d\.js'\), needWords\(\.\.\.WORDS\.island\)/, 'the island\'s words before the island\'s map');
  assert.ok(/needWords\('blueprint', 'shared'\)\.then\(\(\) => \{ fillWays\(\); fillShared\(\)/.test(read(abs('src/v2/hold.js'))), 'Hold loads the blueprint\'s and the shared words when first touched and fills them in');
  const VIEWS = [['the first page (src/v2/hold.js)', HOLD, ['hold', 'blueprint', 'shared']], ['the blueprint (src/v2/home.js)', reach(['src/v2/home.js'], { skip: BOOT }), ['blueprint', 'shared']],
    ['the station map (src/v2/stations.js)', reach(['src/v2/stations.js'], { skip: BOOT }), ['pages']], ['the island\'s map (src/v2/map3d.js)', reach(['src/v2/map3d.js'], { skip: BOOT }), glueWaits('island')]];
  const bad = VIEWS.flatMap(([who, mods, waits]) => { const out = unwaited(mods, waits); return out.length ? [tell(who, waits, out)] : []; });
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('the shell\'s own modules show only what every view below the first page waits for', () => {
  /* the challenge player shows the labs' words too: the shell awaits labsReady before it plays */
  const PLAYER = abs('src/v2/play.js');
  const out = unwaited([...BOOT].filter(f => !HOLD.has(f) && f !== PLAYER), EVERY).concat(unwaited([PLAYER], EVERY.concat('labs')));
  assert.deepEqual(out, [], tell('the shell', EVERY, out));
});
