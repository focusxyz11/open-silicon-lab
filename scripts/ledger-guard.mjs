#!/usr/bin/env node
// The ledger's floor in CI (#484; docs/reviews/community.md, "Known holes, for stage 1"): a pull request that adds a
// ledger entry adds exactly one new file under community/ledger/ and changes no existing one (entries are never
// edited); the date in its name is the day the pull request was opened (UTC, a day either side allowed); and its
// `github` field names the pull request's author (an entry `made: example` comes only from the owner). A pull request
// that mixes an entry with code is allowed only from the owner or the nightly build. Merging stays by hand.
//
// Safe with forks: it reads the list of changed files and the entry as data. It runs none of the pull request's code,
// needs no token that can write, and never puts an entry's words into a shell command.
//
//   node scripts/ledger-guard.mjs <changed-files.tsv> <author> <opened-at ISO> [owner] [head-branch]
//     changed-files.tsv: one line per file, "<status>\t<path>" as `git diff --name-status <base>...<head>` prints it
//     (A added, M modified, D deleted, R renamed); the entry is read from the working tree (the pull request's head).
// One line on stdout: "ledger guard: ok" or "ledger guard: <guard>: <why>"; the exit code is 1 when a guard fails.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DIR = 'community/ledger/';
export const OWNER = 'focusxyz11';
export const NIGHTLY = /^claude\/(task|train)-/;
const DAY = 86400000;
const login = s => (typeof s === 'string' ? s.trim().toLowerCase() : '');

/* the changed files as `git diff --name-status` prints them: [{ status, path }] (a rename keeps its new path) */
export function readChanges(tsv) {
  return String(tsv || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const p = l.split('\t'), st = p[0].charAt(0);
    return { status: st, path: p[p.length - 1], from: st === 'R' || st === 'C' ? p[1] : null };
  });
}

/* the guards. changes: [{ status, path, from }]; author: the pull request's author; opened: when it was opened (ISO or
   Date); entry: the new entry's parsed file (or null when it could not be read); owner, branch: who may mix. Returns
   { ok: true } or { ok: false, guard, why } with the first guard that fails */
export function guard({ changes, author, opened, entry, owner = OWNER, branch = '' }) {
  const no = (g, why) => ({ ok: false, guard: g, why });
  const inLedger = c => c.path.startsWith(DIR) || (c.from && c.from.startsWith(DIR));
  const L = changes.filter(inLedger), others = changes.filter(c => !inLedger(c));
  if (!L.length) return { ok: true, ledger: false };
  /* entries are never edited: only added */
  const touched = L.filter(c => c.status !== 'A');
  if (touched.length) return no('never-edited', 'an existing entry is changed, renamed or deleted: ' + touched.map(c => c.from || c.path).join(', '));
  /* one entry per pull request */
  if (L.length > 1) return no('one-entry', L.length + ' entries in one pull request; send one at a time');
  const isOwner = login(author) === login(owner), nightly = isOwner && NIGHTLY.test(branch || '');
  /* an entry with code: only from the owner or the nightly build */
  if (others.length && !isOwner && !nightly) return no('entry-only', 'a ledger entry comes alone; this pull request also changes ' + others.length + ' other file(s)');
  const path = L[0].path, m = /^community\/ledger\/(\d{4}-\d{2}-\d{2})-[a-z]+-[a-z0-9-]+\.json$/.exec(path);
  if (!m) return no('name', 'the file is not named <date>-<kind>-<name>.json: ' + path);
  /* the date in the name is the day the pull request was opened (UTC), a day either side */
  const named = Date.parse(m[1] + 'T00:00:00Z'), at = new Date(opened).getTime(), day = Math.floor(at / DAY) * DAY;
  if (!Number.isFinite(named) || !Number.isFinite(at) || Math.abs(named - day) > DAY) return no('date', 'the file is dated ' + m[1] + ' but the pull request was opened on ' + new Date(day).toISOString().slice(0, 10));
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return no('read', 'the entry could not be read as one record');
  /* who sent it: an example only from the owner; any other entry names its author's GitHub account */
  if (entry.made === 'example') return isOwner ? { ok: true, ledger: true } : no('example', 'only the lab\'s owner adds entries made: example');
  if (login(entry.github) !== login(author)) return no('who', 'the entry\'s github field (' + (entry.github || 'missing') + ') is not the pull request\'s author (' + author + ')');
  return { ok: true, ledger: true };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [tsvPath, author, opened, owner = OWNER, branch = ''] = process.argv.slice(2);
  const changes = readChanges(readFileSync(tsvPath, 'utf8'));
  const added = changes.find(c => c.path.startsWith(DIR) && c.status === 'A');
  let entry = null;
  if (added) { try { entry = JSON.parse(readFileSync(added.path, 'utf8')); } catch (e) { entry = null; } }
  const r = guard({ changes, author, opened, entry, owner, branch });
  console.log(r.ok ? 'ledger guard: ok' + (r.ledger ? '' : ' (no ledger entry)') : 'ledger guard: ' + r.guard + ': ' + r.why);
  process.exit(r.ok ? 0 : 1);
}
