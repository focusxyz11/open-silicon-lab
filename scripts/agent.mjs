#!/usr/bin/env node
// An agent of your own, on your own machine: the lab runs none. This one is the simplest kind, a search program
// with no language model. It reads the ledger, goes where the pull is strongest among the clocked designs nobody
// has broken, and attacks each with random cases. A case that breaks a design becomes a break entry; if none does,
// the hardest cases it tried become a try entry: the trace of an attack that failed. It writes the entry files into
// community/ledger/ for you to read and send as a pull request. Nothing is posted.
//
//   node scripts/agent.mjs --name "Rook" --by "who runs it" [--cases 4000] [--leave <design id>] [--about fail.check] [--dry]
//
// Any other agent (a language model through the port, docs/MCP.md, or your own program) plays by the same rules:
// same files, same replay. Write your own from this one: the engine is src/engines/ledger.js.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect } from './ledger.mjs';
import { useLedger, settled, frontier, runCase, draft, tryEntry, fileOf, needOf } from '../src/engines/ledger.js';
import { projectOf } from '../src/engines/design.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url)), A = process.argv.slice(2);
const arg = (k, d) => { const i = A.indexOf('--' + k); return i >= 0 ? A[i + 1] : d; }, all = k => A.flatMap((x, i) => (x === '--' + k ? [A[i + 1]] : []));
const mode = arg('mode', 'random'), depth = Math.min(10, +arg('depth', 6));
const name = arg('name'), by = arg('by'), N = +arg('cases', 4000), leave = all('leave'), about = arg('about', null), dry = A.includes('--dry');
if (!name || !by) { console.error('Usage: node scripts/agent.mjs --name <the agent\'s name> --by <who runs it>'); process.exit(2); }
/* a small seeded generator, so a run can be repeated */
let seed = 20261114; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
useLedger(collect());
const how = n => 'A search program, not a language model, run by ' + by + (mode === 'sweep' ? ': it tried every one of the ' + n + ' cases of ' + depth + ' ticks, so every shorter case too.' : ': it tried ' + n + ' random cases of up to 16 ticks.');
for (const f of frontier(settled()).filter(x => x.kind === 'break')) {
  const T = settled().byId[f.of], ins = projectOf(f.p).ins;
  if (leave.includes(f.of)) { console.log('left alone, as asked:', f.of); continue; }
  if (T.by === name) continue;
  let hit = null, tried = N; const kept = [];
  if (mode === 'sweep') {   /* every case of this many ticks, in order: a small proof instead of a sample */
    const base = 1 << ins.length, total = base ** depth; tried = total;
    for (let k = 0; k < total && !hit; k++) { let x = k; const seq = Array.from({ length: depth }, () => { const d = x % base; x = Math.floor(x / base); return Object.fromEntries(ins.map((i, j) => [i, (d >> j) & 1])); });
      const r = runCase(f.p, T.code, seq); if (r.first >= 0) hit = seq.slice(0, r.first + 1); else if (k % Math.ceil(total / 4) === Math.ceil(total / 8)) kept.push(seq); }
  } else
  for (let k = 0; k < N && !hit; k++) {
    const len = 2 + Math.floor(rnd() * 15), p1 = 0.2 + rnd() * 0.7, seq = Array.from({ length: len }, () => Object.fromEntries(ins.map(i => [i, rnd() < p1 ? 1 : 0])));
    const r = runCase(f.p, T.code, seq);
    if (r.first >= 0) hit = seq.slice(0, r.first + 1); else if (len === 16 && kept.length < 4) kept.push(seq);
  }
  const e = hit ? draft({ kind: 'break', of: f.of, by: name, made: 'program', ai: how(tried), case: hit, about }, name + ' ' + T.title)
    : draft({ kind: 'try', of: f.of, by: name, made: 'program', ai: how(tried), cases: kept, about, words: mode === 'sweep' ? 'It held on every case of ' + depth + ' ticks; four of them are kept here.' : 'It held on every case tried; four of the longest are kept here.' }, name + ' ' + T.title);
  const r = tryEntry(e), file = fileOf(e);
  console.log((hit ? 'BROKE ' : 'held  ') + T.title + ' (' + needOf(T.piece).id + ', pull ' + f.pull.toFixed(1) + ') → ' + (r.ok ? file.path : 'refused: ' + r.reason));
  if (r.ok && !dry) { writeFileSync(join(ROOT, file.path), file.text); useLedger(collect()); }
}
