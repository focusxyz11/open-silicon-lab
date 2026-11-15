// The framework's own data (docs/framework/skeleton.json): checks it against the repository, and keeps the copy
// inside the map (docs/framework/map.html) the same, so the map opens from disk with nothing to fetch.
//   node scripts/framework.mjs          writes the copy into the map, after checking
//   node scripts/framework.mjs --check  only checks (tests/framework.test.mjs does the same)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('..', import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), 'utf8');
const SLOT = /(<script type="application\/json" id="skeleton">)([\s\S]*?)(<\/script>)/;

export const skeleton = () => JSON.parse(read('docs/framework/skeleton.json'));
export const embedded = () => { const m = SLOT.exec(read('docs/framework/map.html')); return m ? JSON.parse(m[2]) : null; };
export const STATES = ['live', 'ready', 'words', 'wanted'];
export const counts = S => Object.fromEntries(STATES.map(st => [st, S.worlds.flatMap(w => w.experiments).filter(x => x.state === st).length]));

/* everything that is wrong with the skeleton, as sentences; an empty list means it holds */
export function problems(S = skeleton()) {
  const out = [], ids = k => new Set(S[k].map(x => x.id)), EN = JSON.parse(read('src/i18n/en.json'));
  const L = ids('lenses'), E = ids('engines'), M = ids('measures'), G = ids('givens'), W = ids('worlds');
  const engine = id => S.engines.find(e => e.id === id);
  for (const k of ['measures', 'lenses', 'engines', 'givens', 'directions', 'specimens', 'record', 'worlds']) if (ids(k).size !== S[k].length) out.push(k + ' has an id twice');
  /* the questions are the site's own, word for word */
  for (const w of S.worlds) {
    if (EN['thread.' + w.id + '.root'] !== w.question) out.push(w.id + ': the question is not the site\'s (thread.' + w.id + '.root)');
    if (EN['thread.' + w.id + '.behind'] !== w.behind) out.push(w.id + ': the question behind is not the site\'s');
  }
  /* every lens is at home in exactly one world, and that world says so */
  for (const l of S.lenses) {
    const homes = S.worlds.filter(w => w.home === l.id).map(w => w.id);
    if (homes.length !== 1 || homes[0] !== l.home) out.push('lens ' + l.id + ' should be the home of exactly one world, ' + l.home);
    if (S.worlds.filter(w => w.lenses.includes(l.id)).length < 3) out.push('lens ' + l.id + ' is used by fewer than three worlds: it is not shared');
  }
  /* an engine that exists, or partly exists, names files that are there; a missing one names none */
  for (const e of S.engines) {
    if (e.state === 'missing' ? e.files.length : !e.files.length) out.push('engine ' + e.id + ': ' + e.state + ', with the wrong files');
    for (const f of e.files) if (!existsSync(new URL(f, ROOT))) out.push('engine ' + e.id + ' names ' + f + ', which is not there');
    for (const m of e.gives) if (!M.has(m)) out.push('engine ' + e.id + ' gives ' + m + ', which is no measure');
    for (const w of e.next || []) if (!W.has(w)) out.push('engine ' + e.id + ' names the world ' + w);
    if (!S.worlds.some(w => w.engines.includes(e.id))) out.push('engine ' + e.id + ' serves no world');
  }
  for (const m of S.measures) if (!S.engines.some(e => e.gives.includes(m.id))) out.push('no engine gives the measure ' + m.id);
  for (const g of S.givens) if (!S.directions.some(d => d.drops.includes(g.id))) out.push('no direction drops the given ' + g.id);
  for (const d of S.directions) {
    for (const g of d.drops) if (!G.has(g)) out.push('direction ' + d.id + ' drops ' + g + ', which is no given');
    if (!M.has(d.gains)) out.push('direction ' + d.id + ' gains ' + d.gains + ', which is no measure');
    for (const w of d.worlds) if (!W.has(w)) out.push('direction ' + d.id + ' names the world ' + w);
    if (!(d.stage >= 0 && d.stage <= 4)) out.push('direction ' + d.id + ' has no stage');
  }
  const seen = new Set();
  for (const w of S.worlds) {
    if (!L.has(w.home) || w.lenses[0] !== w.home) out.push(w.id + ': its home lens comes first among its lenses');
    for (const [k, set] of [['lenses', L], ['engines', E], ['measures', M], ['givens', G]]) for (const x of w[k]) if (!set.has(x)) out.push(w.id + ' names ' + x + ' among its ' + k);
    if (w.tension.length !== 2 || w.strands.length < 3) out.push(w.id + ' needs a tension of two and at least three strands');
    for (const k of w.links) if (!W.has(k.to) || k.to === w.id) out.push(w.id + ' links to ' + k.to);
    if (w.links.length < 3) out.push(w.id + ' meets fewer than three other worlds');
    for (const x of w.experiments) {
      if (seen.has(x.id)) out.push('experiment ' + x.id + ' twice'); seen.add(x.id);
      if (!x.id.startsWith(w.id + '-')) out.push('experiment ' + x.id + ' is in ' + w.id);
      if (!STATES.includes(x.state)) out.push('experiment ' + x.id + ' has no state');
      if (!w.lenses.includes(x.lens)) out.push('experiment ' + x.id + ' is seen through ' + x.lens + ', which is not one of its world\'s lenses');
      if (x.engine && !w.engines.includes(x.engine)) out.push('experiment ' + x.id + ' is judged by ' + x.engine + ', which is not one of its world\'s engines');
      /* the honest count: what can be played or is ready has an engine that is there; what is only words has none to judge it */
      const e = x.engine && engine(x.engine);
      if ((x.state === 'live' || x.state === 'ready') && !(e && e.state !== 'missing')) out.push('experiment ' + x.id + ' is ' + x.state + ' and has no engine that exists');
      if (x.state === 'wanted' && !x.from) out.push('experiment ' + x.id + ' does not say what it waits for');
      if (!x.ask || !x.from) out.push('experiment ' + x.id + ' needs a question and where it comes from');
    }
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const S = skeleton(), bad = problems(S);
  if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
  if (!process.argv.includes('--check')) {
    const file = new URL('docs/framework/map.html', ROOT), html = readFileSync(file, 'utf8');
    writeFileSync(file, html.replace(SLOT, (_, a, __, c) => a + JSON.stringify(S).replace(/<\//g, '<\\/') + c));
  }
  console.log('The skeleton holds: ' + S.worlds.length + ' worlds, ' + Object.entries(counts(S)).map(([k, n]) => n + ' ' + k).join(', ') + '.');
}
