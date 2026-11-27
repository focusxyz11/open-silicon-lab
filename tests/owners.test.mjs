/* CI's lanes (scripts/smoke/owners.mjs): every smoke section is owned and run by one of CI's groups, and a file given to
   a view is really that view's alone, so a pull request that skips the other sections cannot break them. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, NOT_IN_CI, OWNERS, CORE, WORDS, SHELL_OWNED, LAB_ALSO, ownersOf, matches, plan } from '../scripts/smoke/owners.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rel = f => relative(ROOT, f).split('\\').join('/');
const walk = d => readdirSync(join(ROOT, d)).flatMap(n => { const p = d + '/' + n; return statSync(join(ROOT, p)).isDirectory() ? walk(p) : [p]; });
const FILES = ['index.html', 'classic.html', 'package.json'].concat(walk('src'), walk('scripts'));
const JS = FILES.filter(f => /\.m?js$/.test(f) && !f.startsWith('src/vendor/'));
const importsOf = f => { const s = readFileSync(join(ROOT, f), 'utf8'), re = /^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm, out = [];
  for (let m; (m = re.exec(s));) { const p = m[1] || m[2]; if (p.startsWith('.')) out.push(rel(resolve(dirname(join(ROOT, f)), p))); } return out; };
const reach = entries => { const seen = new Set(); const v = f => { if (seen.has(f) || !JS.includes(f)) return; seen.add(f); importsOf(f).forEach(v); }; entries.forEach(v); return seen; };

test('the sections are the smoke test\'s own, in its order', () => {
  const names = readFileSync(join(ROOT, 'scripts/smoke.mjs'), 'utf8').match(/const NAMES = \[([^\]]*)\]/)[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));
  assert.deepEqual(SECTIONS, names);
});

test('every smoke section is owned by a pattern, and every owner names real sections and real files', () => {
  const owned = new Set(OWNERS.flatMap(([, s]) => s));
  assert.deepEqual(SECTIONS.filter(s => !owned.has(s) && !(s in NOT_IN_CI)), [], 'sections no pattern owns');
  assert.deepEqual(Object.keys(NOT_IN_CI).filter(s => owned.has(s)), [], 'a section CI does not run owns no files: they are core');
  for (const [p, secs] of OWNERS) {
    assert.ok(secs.length && secs.every(s => SECTIONS.includes(s)), p + ' names a section that is not there');
    assert.ok(FILES.some(f => matches(p, f)) || /^scripts\/smoke\/labs\/|^src\/styles\/labs\//.test(p), p + ' matches no file');
  }
});

test('every smoke section runs in exactly one of CI\'s groups', () => {
  const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
  const block = ci.match(/^(\s*)CI_GROUPS: \|\n((?:\1  .*\n)+)/m);
  assert.ok(block, 'ci.yml holds the groups in the plan\'s CI_GROUPS');
  const groups = block[2].trim().split('\n').map(l => l.split(':')[1].trim().split(','));
  assert.equal(groups.length, 4);
  for (const s of SECTIONS) assert.equal(groups.filter(g => g.includes(s)).length, s in NOT_IN_CI ? 0 : 1, s + (s in NOT_IN_CI ? ' is in a group: take it out of NOT_IN_CI' : ' should be in exactly one group of ci.yml'));
  assert.deepEqual(groups.flat().filter(s => !SECTIONS.includes(s)), [], 'groups name sections that are not there');
});

test('a lab played in another section names that section (LAB_ALSO)', async () => {
  const { LABS } = await import('../src/data/labs/index.js');
  const lab = Object.fromEntries(LABS.flatMap(l => (l.challenges || []).map(c => [c.id, l.name])));
  const bad = [];
  for (const f of FILES.filter(f => /^scripts\/smoke\/[\w-]+\.mjs$/.test(f))) {
    const n = f.slice(14, -4), secs = n === 'walk' ? ['explore-desktop', 'explore-phone'] : SECTIONS.includes(n) ? [n] : [];
    for (const m of readFileSync(join(ROOT, f), 'utf8').matchAll(/#\/do\/([a-z0-9-]+)/g)) { const l = lab[m[1]];
      for (const s of secs) if (l && s !== 'labs' && !(LAB_ALSO[l] || []).includes(s)) bad.push(l + ' is played in ' + s + ' (#/do/' + m[1] + ')'); }
  }
  assert.deepEqual([...new Set(bad)], []);
});

test('no file of a view is loaded by the shell on every page', () => {
  const shell = reach(['src/main2.js', 'src/v2/beyond.js']);
  const bad = [...shell].filter(f => ownersOf(f) && !SHELL_OWNED.some(p => matches(p, f)));
  assert.deepEqual(bad, [], 'loaded by the shell on every page, so a change to them is core');
});

test('a file given to a view is imported only by files of the same views', () => {
  const bad = [];
  for (const g of JS.filter(f => f.startsWith('src/'))) for (const f of importsOf(g)) {
    const of = ownersOf(f); if (!of) continue;
    const og = CORE.some(p => matches(p, g)) ? null : ownersOf(g);
    if (SHELL_OWNED.some(p => matches(p, f)) && !og) continue;
    if (!og || og.some(s => !of.includes(s))) bad.push(f + ' (' + of + ') is imported by ' + g + ' (' + (og || 'core') + ')');
  }
  assert.deepEqual(bad, []);
});

test('the plan: words alone, one lab, the shell, a file nobody owns, and ci:full', () => {
  assert.equal(plan(['docs/WORKFLOW.md', 'content/fail.md', 'src/i18n/fr/hold.json']).lane, 'words');
  assert.deepEqual(plan(['src/v2/labs/litho.js', 'src/styles/labs/litho.css', 'scripts/smoke/labs/litho.mjs', 'docs/LABS.md']), { lane: 'view', sections: ['labs'], why: 'only the files of labs' });
  assert.deepEqual(plan(['src/v2/labs/litho.js', 'src/v2/holdboard.js']).sections, ['home', 'labs']);
  assert.equal(plan(['src/v2/stack/view.js']).lane, 'core');
  assert.equal(plan(['src/v2/labs/litho.js', 'src/v2/app.js']).lane, 'core');
  assert.equal(plan(['src/v2/map3d.js']).lane, 'core');
  assert.equal(plan(['.github/pull_request_template.md']).lane, 'core');
  assert.equal(plan(['docs/STATUS.md'], { full: true }).lane, 'core');
  assert.equal(plan([]).lane, 'core');
  assert.deepEqual(plan(['src/v2/app.js']).sections, SECTIONS);
});

test('the words lane holds no file the site runs', () => {
  for (const f of FILES.filter(f => /\.(m?js|css|html)$/.test(f))) assert.ok(!WORDS.some(p => matches(p, f)) || f.startsWith('tests/'), f + ' is in the words lane');
});
