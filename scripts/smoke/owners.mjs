/* Which browser checks a change needs: CI's plan (scripts/ci-plan.mjs) sorts the files a pull request changes into a
   lane (docs/WORKFLOW.md, "CI's lanes").
   - words: only words and documents changed; the logic and words tests are enough, no browser.
   - view: every file changed belongs to a known view or lab; the logic and words tests and only that view's sections.
   - core: anything else, or a file of the shell, or a file this list does not know; the whole suite.
   When in doubt, core. tests/owners.test.mjs keeps this list honest: every smoke section is owned, no file of a view
   is loaded by the shell on every page, and a file imported by another view is owned by that view too. */

/* the browser smoke test's sections, as scripts/smoke.mjs names them (NAMES) */
export const SECTIONS = ['old', 'home', 'blueprint', 'stations', 'explore-desktop', 'explore-phone', 'joins', 'break', 'slow',
  'motion', 'seams', 'labs', 'search', 'ways', 'frame', 'flights', 'machines', 'stack'];
/* sections not yet in any of CI's groups, each with the issue that brings it in; their files are core meanwhile */
export const NOT_IN_CI = { stack: 489 };

/* words and documents: the logic and words tests check them (tests/ only runs there) */
export const WORDS = ['**/*.md', 'docs/**', 'content/**', 'community/**', 'src/i18n/**', 'tests/**'];

/* the shell and what every page shares, and CI itself: always the whole suite, whatever else the list says */
export const CORE = ['src/core/**', 'src/main2.js', 'src/v2/app.js', 'src/v2/game.js', 'src/v2/shell.js', 'src/v2/loop.js',
  'src/v2/beyond.js', 'src/engines/way.js', 'src/v2/labs/loop.js', 'src/v2/labs/bets.js', 'src/styles/base.css', 'src/styles/frame.css', 'src/vendor/**', 'index.html',
  'scripts/smoke.mjs', 'scripts/smoke/shared.mjs', 'scripts/smoke/owners.mjs', 'scripts/ci-plan.mjs', 'package.json',
  '.github/**'];

/* the labs section plays every lab to its win; these labs are played in other sections too (their challenges' addresses,
   #/do/<id>, in those sections' checks; the bench lab also beside the bench's own pages) */
export const LAB_ALSO = {
  bench: ['frame', 'explore-desktop', 'explore-phone', 'ways', 'slow', 'flights'], bits: ['slow'],
  clockpower: ['explore-phone', 'frame'], dataflow: ['machines'], evolve: ['explore-phone'], halt: ['flights'],
  light: ['explore-phone', 'machines'], reversible: ['machines'], rv: ['machines'], switch: ['machines'],
  teardown: ['explore-phone']
};
/* the labs' own engines, imported by these labs alone */
const LAB_ENGINES = { analog: ['analog'], corearch: ['corearch'], crystal: ['crystal'], dies: ['dies'], etch: ['films'],
  evolve: ['evolve'], fabsteps: ['overlay', 'implant', 'semiconductor'], grover: ['grover'], halt: ['halt'],
  redundancy: ['vote'], rvpuzzles: ['rv'], search: ['search'], strands: ['bridge'], tiers: ['tiers'], trigger: ['trigger'] };
const labSections = labs => ['labs', ...new Set(labs.flatMap(l => LAB_ALSO[l] || []))];

/* a view's or a lab's files → the sections that open them */
export const OWNERS = [
  ['classic.html', ['old']],
  ['scripts/smoke/old.mjs', ['old']],

  /* Hold's pieces fetched on a tap (the rest of the first page, its sheet and its island, opens in many sections: core) */
  ['src/v2/holdchals.js', ['home']],
  ['src/v2/holdnotes.js', ['home']],
  ['src/styles/holdnotes.css', ['home']],
  ['scripts/smoke/home.mjs', ['home']],

  ['src/v2/home.js', ['blueprint']],
  ['src/data/blueprint.js', ['blueprint']],
  ['src/engines/blueprint.js', ['blueprint']],
  ['src/styles/blueprint.css', ['blueprint']],
  ['scripts/smoke/blueprint.mjs', ['blueprint']],

  ['src/v2/stations.js', ['stations']],
  ['src/styles/stations.css', ['stations']],
  ['scripts/smoke/stations.mjs', ['stations']],

  ['scripts/smoke/walk.mjs', ['explore-desktop', 'explore-phone']],
  ['scripts/smoke/explore-desktop.mjs', ['explore-desktop']],
  ['scripts/smoke/explore-phone.mjs', ['explore-phone']],
  ['scripts/smoke/joins.mjs', ['joins']],
  ['scripts/smoke/break.mjs', ['break']],
  ['scripts/smoke/slow.mjs', ['slow']],
  ['scripts/smoke/motion.mjs', ['motion']],
  ['scripts/smoke/seams.mjs', ['seams']],
  ['scripts/smoke/search.mjs', ['search']],
  ['scripts/smoke/ways.mjs', ['ways']],
  ['scripts/smoke/frame.mjs', ['frame']],
  ['scripts/smoke/flights.mjs', ['flights']],
  ['scripts/smoke/machines.mjs', ['machines']],

  /* a lab: its declaration, its lab, its engine, its styles and its smoke check (docs/LABS.md); the declarations are
     read by the loop too, and checked by tests/labs.test.mjs */
  ['src/data/labs/**', ['labs']],
  ['src/v2/labs/**', ['labs']],
  ['src/styles/labs/**', ['labs']],
  ['src/styles/labs.css', ['labs']],
  ['scripts/smoke/labs.mjs', ['labs']],
  ['scripts/smoke/labs/**', ['labs']],
  ...Object.entries(LAB_ALSO).flatMap(([l, also]) => ['src/v2/labs/', 'src/data/labs/', 'src/styles/labs/', 'scripts/smoke/labs/']
    .map(d => [d + l + (d.startsWith('src/styles') ? '.css' : d.startsWith('scripts') ? '.mjs' : '.js'), ['labs', ...also]])),
  ['src/v2/labs/datapath.js', labSections(['rv'])],
  ...Object.entries(LAB_ENGINES).map(([e, labs]) => ['src/engines/' + e + '.js', labSections(labs)]),
  /* what a lab grows stands on the island, which the explore walks grow */
  ['src/v2/growers/**', ['labs', 'explore-desktop', 'explore-phone']],
];

/* files the shell loads on every page that a view may still own: plain declarations, checked by the logic tests and
   played whole by their section */
export const SHELL_OWNED = ['src/data/labs/**'];

/* a path pattern: ** any folders, * any name within one folder */
const rx = p => new RegExp('^' + p.split('**/').map(a => a.split('**').map(b => b.split('*').map(c => c.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*')).join('(?:.*/)?') + '$');
const RX = new Map();
export const matches = (p, f) => { if (!RX.has(p)) RX.set(p, rx(p)); return RX.get(p).test(f); };
const any = (list, f) => list.some(p => matches(p, f));

/* the sections that own a file, or null when no pattern does */
export const ownersOf = f => { if (any(CORE, f)) return null; const s = new Set(); for (const [p, secs] of OWNERS) if (matches(p, f)) secs.forEach(x => s.add(x)); return s.size ? [...s] : null; };

/* the plan for a list of changed files: { lane, sections, why } */
export const plan = (files, { full = false } = {}) => {
  const core = why => ({ lane: 'core', sections: SECTIONS.slice(), why });
  if (full) return core('the label ci:full');
  if (!files.length) return core('no changed files known');
  const sections = new Set();
  for (const f of files) {
    if (any(CORE, f)) return core(f + ' is shared by every page');
    if (any(WORDS, f)) continue;
    const o = ownersOf(f);
    if (!o) return core(f + ' belongs to no known view');
    o.forEach(s => sections.add(s));
  }
  if (!sections.size) return { lane: 'words', sections: [], why: 'only words and documents changed' };
  return { lane: 'view', sections: SECTIONS.filter(s => sections.has(s)), why: 'only the files of ' + SECTIONS.filter(s => sections.has(s)).join(', ') };
};
