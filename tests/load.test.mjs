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
