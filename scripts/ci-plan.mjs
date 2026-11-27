/* CI's plan (.github/workflows/ci.yml, job `plan`): what this run tests. Reads the files a pull request changes, sorts
   them into a lane (scripts/smoke/owners.mjs) and writes to $GITHUB_OUTPUT:
     logic    true when the logic and words tests run
     browser  true when any browser group runs
     matrix   the browser groups to run, each with only the sections the lane chose
   Environment: EVENT (the event's name), DRAFT, FULL (the label ci:full), CI_GROUPS (CI's groups, one "name: a,b" a line),
   and the changed files on standard input, one a line (an empty list means the whole suite).
   Locally: git diff --name-only origin/main... | EVENT=pull_request CI_GROUPS="$(...)" node scripts/ci-plan.mjs */
import { appendFileSync, readFileSync } from 'node:fs';
import { plan, SECTIONS, NOT_IN_CI } from './smoke/owners.mjs';

const env = process.env, event = env.EVENT || 'pull_request';
const groups = (env.CI_GROUPS || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':');
  return { group: l.slice(0, i).trim(), sections: l.slice(i + 1).trim().split(',').map(s => s.trim()).filter(Boolean) }; });
const lost = SECTIONS.filter(s => !(s in NOT_IN_CI) && !groups.some(g => g.sections.includes(s)));
if (lost.length) { console.error('Sections in no CI group: ' + lost.join(', ')); process.exit(1); }

let out;
if (event === 'push') out = { lane: 'none', why: 'a push to main was tested in its pull request', logic: false, sections: [] };
else if (event === 'pull_request' && env.DRAFT === 'true') out = { lane: 'none', why: 'a draft waits until it is ready for review', logic: false, sections: [] };
else {
  const files = event === 'pull_request' ? readFileSync(0, 'utf8').split('\n').map(s => s.trim()).filter(Boolean) : [];
  const p = event === 'pull_request' ? plan(files, { full: env.FULL === 'true' }) : { lane: 'core', sections: SECTIONS.slice(), why: 'a ' + event + ' run tests everything' };
  out = { ...p, logic: true, files: files.length };
}
const matrix = groups.map(g => ({ group: g.group, sections: g.sections.filter(s => out.sections.includes(s)).join(',') })).filter(g => g.sections);
const lines = { lane: out.lane, logic: String(out.logic), browser: String(matrix.length > 0), matrix: JSON.stringify({ include: matrix.length ? matrix : [{ group: 'none', sections: '' }] }) };
console.log('Lane: ' + out.lane + ' (' + out.why + ')' + (matrix.length ? '\nBrowser: ' + matrix.map(g => g.group + ' (' + g.sections + ')').join('; ') : '\nBrowser: none'));
if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, Object.entries(lines).map(([k, v]) => k + '=' + v).join('\n') + '\n');
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, '**Lane: ' + out.lane + '**: ' + out.why + '\n\n' + (matrix.length ? matrix.map(g => '- browser (' + g.group + '): ' + g.sections).join('\n') : '- no browser groups') + '\n');
