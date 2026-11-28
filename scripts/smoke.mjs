// Browser smoke test (the chip world, index.html): the dive opens on desktop and phone, in dark and light, with no errors; every depth
// can be reached; tapping a part says what it does; a question can be picked, followed deeper and let go; the dive can start in a phone or a car,
// keeping a depth they share; a stop can show a real case, its figures and the companion;
// a "Try it" changes your chip and another depth shows it; the journey runs from crystal to a shipped chip; a gap invites a
// question; nothing scrolls sideways.
// Needs Playwright:  npm install --no-save playwright && npx playwright install chromium
import { serve } from './serve.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

/* The run is made of sections, each opening its own pages and closing them, and leaning on no other section's state:
     node scripts/smoke.mjs                 every section
     node scripts/smoke.mjs --only a,b      only the sections named
     node scripts/smoke.mjs --list          the sections and what each covers
   (npm run test:browser -- --only a,b does the same). CI runs them in groups, side by side (.github/workflows/ci.yml).
   Each section is a file of its own, scripts/smoke/<section>.mjs: its default export runs it, `about` says what it
   covers. What they share (the browsers, the address, the problems, where the run is) is scripts/smoke/shared.mjs; the
   labs section plays each lab's own check from scripts/smoke/labs/<lab>.mjs. A new check goes in its section's file. */
import { S } from './smoke/shared.mjs';
const NAMES = ['old', 'home', 'blueprint', 'stations', 'explore-desktop', 'explore-phone', 'joins', 'break', 'slow', 'motion', 'seams', 'labs', 'search',
  'ways', 'frame', 'flights', 'machines', 'stack', 'studio'];
const RUN = Object.fromEntries(await Promise.all(NAMES.map(n => import('./smoke/' + n + '.mjs').then(m => [n, m]))));
const SECTIONS = NAMES.map(n => [n, RUN[n].about]);
const argv = process.argv.slice(2);
if (argv.includes('--list')) { for (const [n, about] of SECTIONS) console.log(n.padEnd(16) + about); process.exit(0); }
const oi = argv.indexOf('--only'), onlyArg = oi >= 0 ? argv[oi + 1] || '' : (argv.find(a => a.startsWith('--only=')) || '').slice(7);
const only = oi >= 0 || argv.some(a => a.startsWith('--only=')) ? onlyArg.split(',').map(s => s.trim()).filter(Boolean) : null;
if (only) { const unknown = only.filter(n => !SECTIONS.some(([s]) => s === n)); if (unknown.length || !only.length) { console.error('Unknown section: ' + (unknown.join(', ') || '(none given)') + '\nThe sections: ' + SECTIONS.map(([s]) => s).join(', ')); process.exit(2); } }

const server = await serve(0), base = 'http://localhost:' + server.address().port + '/';
const browser = await chromium.launch(), problems = S.problems;
/* a watchdog: a page that stops answering (a stuck software renderer on a CI machine) fails the test with where it was,
   instead of hanging the run */
setTimeout(() => { console.error('Smoke test stuck at: ' + S.at + (problems.length ? '\nProblems so far:\n' + problems.join('\n') : '')); process.exit(1); }, 28 * 60 * 1000).unref();
/* its own browser, with software WebGL, so the 3D levels can draw on a machine without a GPU */
const browser3d = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
/* a text asked for and not found (src/core/i18n.js warns "Missing text:", as when a view draws before its words' area
   has loaded) never reaches the screen silently: on any page of either browser it fails the run */
for (const b of [browser, browser3d]) { const open = b.newPage.bind(b);
  b.newPage = async (...a) => { const p = await open(...a); p.on('console', m => { if (/^Missing text:/.test(m.text())) problems.push(S.at + ': ' + m.text()); }); return p; }; }
Object.assign(S, { base, browser, browser3d });

/* the sections asked for, in order; each says how long it took, so the groups in CI can be balanced */
const times = [];
for (const [name] of SECTIONS) {
  if (only && !only.includes(name)) continue;
  S.at = name; const t0 = Date.now(), n0 = problems.length;
  try { await RUN[name].default(); } catch (e) { problems.push(name + ': the section stopped: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); }
  const s = Math.round((Date.now() - t0) / 1000); times.push(name + ' ' + s + ' s');
  console.log('Section ' + name + ': ' + s + ' s' + (problems.length > n0 ? ', ' + (problems.length - n0) + ' problem(s)' : ''));
}
await browser.close(); await browser3d.close(); server.close();
if (problems.length) { console.error('Smoke test found problems (' + times.join(', ') + '):\n' + problems.join('\n')); process.exit(1); }
console.log((only ? 'Smoke test passed (' + only.join(', ') + '): ' : 'Smoke test passed: ') + 'the dive works in every world, and the redesign\'s island plays, on desktop and phone, in dark and light.');
