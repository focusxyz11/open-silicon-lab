/* Tests that read the plan need the ledger loaded, as the site does at start-up: import this file first. */
import { collect } from '../scripts/ledger.mjs';
import { useLedger } from '../src/engines/ledger.js';
useLedger(collect());
