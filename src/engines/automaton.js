/* An elementary cellular automaton: the picture of the core question "Beyond computation" (home.q.nat, the card at
   #/q/nat). A ring of cells, each 0 or 1, is redrawn row after row by one rule: each cell's next value is read from
   the rule's eight bits by the cell and its two neighbours (a number from 0 to 7). There are 256 rules; rule 110 is
   proved able to compute anything a computer can (Cook 2004, fact rule110-cook), so for some of its starts the only
   way to learn what happens is to run it.

   Pure functions, no words: next(row, rule), bit(rule, m), start(n, seed) and run(rule, row, o), which runs a rule
   on until it repeats a row (or for at most `limit` rows) and says what it did. */

export const RULES = 256;

/* what the rule gives a cell whose neighbourhood (left, itself, right) reads as the number m, 0..7 */
export const bit = (rule, m) => (rule >> m) & 1;

/* the next row: a ring, so the first cell's left neighbour is the last cell */
export function next(row, rule) {
  const n = row.length, b = new Uint8Array(n);
  for (let i = 0; i < n; i++) b[i] = bit(rule, (row[(i + n - 1) % n] << 2) | (row[i] << 1) | row[(i + 1) % n]);
  return b;
}

/* a start of n cells, half of them 1, from a seed (the same seed always gives the same row) */
export function start(n, seed = 3) {
  let s = seed >>> 0 || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  return Uint8Array.from({ length: n }, () => (r() < 0.5 ? 1 : 0));
}

/* run a rule on a row: the first `keep` rows (the start among them) for the picture, and what it does: verdict
   { from, period, all } when a row comes back (from: the row it first stood at, period: how many rows between, all:
   the row is one colour), or null when nothing repeated in `limit` rows (gen: how many rows were made) */
export function run(rule, row, { keep = 0, limit = 3000 } = {}) {
  const rows = keep ? [row] : [], seen = new Map([[key(row), 0]]);
  let cur = row, gen = 0, verdict = null;
  while (gen < limit && (!verdict || rows.length < keep)) {
    cur = next(cur, rule); gen++;
    if (rows.length < keep) rows.push(cur);
    if (!verdict) { const k = key(cur), was = seen.get(k); if (was != null) verdict = { from: was, period: gen - was, all: cur.every(v => v === cur[0]) }; else seen.set(k, gen); }
  }
  return { rows, gen, verdict };
}
const key = row => String.fromCharCode.apply(null, row);
