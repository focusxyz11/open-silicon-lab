/* What the first page loads (docs/ARCHITECTURE.md): the shell imports no 3D module, so three.js and the 3D views
   load only when a view that draws them is opened; the labs load with the first challenge played. Walks the static
   imports from the entry point; the browser smoke test measures the same on the page. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/* every module reached by static imports (import … from, export … from, bare import) from one file */
const reach = entry => {
  const seen = new Map();
  const visit = (f, from) => {
    if (seen.has(f)) return; seen.set(f, from);
    const s = readFileSync(f, 'utf8'), re = /^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm;
    for (let m; (m = re.exec(s));) { const p = m[1] || m[2]; if (p.startsWith('.')) visit(resolve(dirname(f), p), f); }
  };
  visit(resolve(ROOT, entry), null);
  return seen;
};
const rel = f => relative(ROOT, f).split('\\').join('/');

test('the first page imports no 3D: three.js and the 3D views load when their view opens', () => {
  const R = reach('src/main2.js');
  const three = [...R.keys()].filter(f => /(vendor\/three|kit3d|3d[a-z-]*)\.js$/.test(f) && !/views3d\.js$/.test(f));
  assert.deepEqual(three.map(f => rel(f) + ' (from ' + rel(R.get(f)) + ')'), []);
});

test('the labs load with the first challenge played, not with the first page', () => {
  const R = reach('src/main2.js');
  assert.deepEqual([...R.keys()].filter(f => /\/v2\/labs\//.test(f)).map(rel), []);
});

test('the first page imports no engine but the shell\'s own: the game, the ledger and the labs\' engines load beyond it', () => {
  /* the shell knows the loop (src/v2/loop.js) and the moves (src/engines/way.js); the game's checks, the community's
     standings (the ledger replayed through the engines) and the challenge player come with src/v2/beyond.js */
  const R = reach('src/main2.js'), mods = [...R.keys()].map(rel);
  assert.deepEqual(mods.filter(f => f.startsWith('src/engines/')), ['src/engines/way.js'], 'engines the first page imports');
  for (const f of ['src/v2/game.js', 'src/v2/play.js', 'src/v2/commons.js', 'src/v2/beyond.js']) assert.ok(!mods.includes(f), f + ' is imported by the first page (from ' + rel(R.get(resolve(ROOT, f)) || '') + ')');
  /* and what beyond brings is the game whole: it re-exports the loop, which keeps no engine of its own */
  const L = reach('src/v2/loop.js');
  assert.deepEqual([...L.keys()].map(rel).filter(f => f.startsWith('src/engines/') || f.startsWith('src/v2/')), ['src/v2/loop.js']);
});

test('the shell stays small, and each view\'s glue loads when its view opens', () => {
  const lines = readFileSync(resolve(ROOT, 'src/v2/app.js'), 'utf8').split('\n').length;
  assert.ok(lines < 600, 'src/v2/app.js has ' + lines + ' lines');
  const R = reach('src/main2.js');
  assert.deepEqual([...R.keys()].filter(f => /\/v2\/glue\//.test(f)).map(rel), []);
  /* every glue module named in the shell's GLUE exists and makes itself once */
  const app = readFileSync(resolve(ROOT, 'src/v2/app.js'), 'utf8'), names = [...app.match(/const GLUE = \{([^}]+)\}/)[1].matchAll(/'([a-z]+)':/g)].map(m => m[1]);
  assert.ok(names.length >= 8);
  for (const k of names) assert.match(readFileSync(resolve(ROOT, 'src/v2/glue/' + k + '.js'), 'utf8'), /export function create\(\)/, k);
});
