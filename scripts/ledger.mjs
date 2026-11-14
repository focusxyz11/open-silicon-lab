#!/usr/bin/env node
// The ledger's folder, read as one list: community/ledger/<id>.json, one entry per file, the file's name its id.
// The site cannot list a folder, so the list is made for it: by the local server on the fly (scripts/serve.mjs),
// and at deploy into community/ledger.json. Tests and the open port read the folder directly through collect().
//
//   node scripts/ledger.mjs [out.json]     write the list (default: print how the ledger settles)
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const FOLDER = join(ROOT, 'community', 'ledger');

/* every entry, its id taken from its file's name; a file that does not read as an object becomes an entry that
   no check can pass, so the test names it instead of skipping it */
export function collect(dir = FOLDER) {
  let names = []; try { names = readdirSync(dir).filter(n => n.endsWith('.json')).sort(); } catch (e) { /* no ledger yet */ }
  return names.map(n => {
    const id = n.slice(0, -5);
    try { const j = JSON.parse(readFileSync(join(dir, n), 'utf8')); return j && typeof j === 'object' && !Array.isArray(j) ? Object.assign({ id }, j, { id }) : { id, kind: 'unreadable' }; }
    catch (e) { return { id, kind: 'unreadable' }; }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2], list = collect();
  if (out) { mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(list) + '\n'); console.log(list.length + ' entries → ' + out); }
  else {
    const { settle } = await import('../src/engines/ledger.js'), W = settle(list);
    W.entries.forEach(e => console.log(e.id, '·', e.state, e.facts ? JSON.stringify(e.facts) : ''));
    W.refused.forEach(e => console.log(e.id, '· REFUSED:', e.reason));
    process.exitCode = W.refused.length ? 1 : 0;
  }
}
