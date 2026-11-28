#!/usr/bin/env node
// Close the architecture engine's current season (#480; src/engines/arch.js SEASONS): settle the ledger with the engine
// as it stands, and write that season's standings into src/data/field.js PAST, where they stay as history. Run it
// before the engine's tables change, then raise VERSION by adding the new season to SEASONS with its print.
//
//   node scripts/season.mjs [--dry]     write the record (--dry: print it instead)
//
// A season already closed is never written again: its record is history.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect } from './ledger.mjs';
import { settle } from '../src/engines/ledger.js';
import { seasonRecord } from '../src/engines/population.js';
import { VERSION } from '../src/engines/arch.js';
import { PAST } from '../src/data/field.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url)), FILE = join(ROOT, 'src', 'data', 'field.js');
if (Object.hasOwn(PAST, String(VERSION))) { console.error('Season ' + VERSION + ' is already closed: raise VERSION in src/engines/arch.js before changing its tables.'); process.exit(1); }
const rec = seasonRecord(settle(collect()), new Date().toISOString().slice(0, 10));
const past = Object.assign({}, PAST, { [VERSION]: rec });
if (process.argv.includes('--dry')) { console.log(JSON.stringify(rec, null, 2)); process.exit(0); }
const src = readFileSync(FILE, 'utf8'), line = /export const PAST = [\s\S]*?;\n/;
if (!line.test(src)) { console.error('No PAST in ' + FILE); process.exit(1); }
writeFileSync(FILE, src.replace(line, 'export const PAST = ' + JSON.stringify(past, null, 2) + ';\n'));
console.log('Season ' + VERSION + ' closed: ' + Object.keys(rec.facts).length + ' attempts, ' + rec.champ.length + ' champions → src/data/field.js');
