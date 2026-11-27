/* The field of every attempt (docs/PATH.md, "Architectures: the frontier of the path", step 6; #448). Zoomed out, your
   stack is one point among every attempt at an architecture: needs across, genes away from today's computer up, the best
   in each niche (a need at a distance from today), never one leaderboard. Pure logic, no words and no DOM; read by the
   stack's field (src/v2/stack/), the open port (src/engines/api.js architecture_field) and the tests
   (tests/population.test.mjs). Written by Claude Opus 5.5 in the nightly build, from the prototype's population and census
   (docs/prototypes/stack/, by Claude Fable 5.2).

   Where the points come from:
     built     the recipes someone has built (arch.js KNOWN): the field's landmarks, what exists, each as far along as
               it is (a product or in a lab). They are facts about the world, not attempts, so no entry holds them.
     ledger    every attempt kept in the community's ledger (src/engines/ledger.js, a try with an arch history), grown
               again here by the same engine, with who made it, how (a person, both, an AI, a search program, the lab's
               example), the day it was kept, and its credit: the first attempt at a recipe nobody has built (firstTry)
               and the first to win a need with a new recipe (firstIn), both read from the entries alone.
     yours     your own attempt, in this browser, until you send it.
   Nothing else: the lab runs no agent. An agent's sweep arrives as entries through the open port (docs/MCP.md) or from
   an agent of your own (scripts/agent.mjs --arch), and stands on the field like anyone's.

   census(atts): every plot (need x recipe) and who stands on it, the best attempt there (yours always shows on your
   plot); each niche's champion: the best standing on a plot of that need at that distance; how many recipes are tried
   and how many attempts beat today's computer somewhere.
   since(prev, atts, cen): what changed since your last visit, against what this browser kept then (snapOf): the attempts
   kept since, and the niches whose champion was deposed. */
import * as A from './arch.js';
import { PAST } from '../data/field.js';

/* who counts as an agent: an AI alone, or a program that searches (the ledger keeps their attempts apart from people's) */
export const ARCH_AGENTS = ['ai', 'program'];
const DAY = /^(\d{4}-\d{2}-\d{2})-/;

/* the built recipes, as points */
export const builtAttempts = () => A.KNOWN.map(k => ({ key: A.keyOf(k.g), g: k.g, st: A.start(k.g), by: k.status, id: k.id, built: true }));

/* the ledger's attempts: settled entries (or their facts' shape: any record with an arch history), each grown again */
export function ledgerAttempts(entries) {
  const out = [];
  for (const e of Array.isArray(entries) ? entries : []) {
    /* the current season's scored attempts only (#480): a closed season's stand in its record (pastChampions), and an
       entry over its author's day's cap is kept, not scored */
    if (!e || typeof e !== 'object' || typeof e.id !== 'string' || !A.histOk(e.arch) || e.over || e.past || (e.ok == null && A.seasonOf(e) !== A.VERSION)) continue;
    const R = A.replay(e.arch);
    out.push({ key: A.keyOf(R.st.g), g: R.st.g, st: R.st, by: 'ledger', id: e.id, who: typeof e.by === 'string' ? e.by : '', made: e.made, agent: ARCH_AGENTS.includes(e.made),
      day: (DAY.exec(e.id) || [])[1] || null, first: !!e.firstTry, firstIn: Array.isArray(e.firstIn) ? e.firstIn : [], draft: !!e.draft, years: R.st.year });
  }
  return out;
}
export const population = entries => builtAttempts().concat(ledgerAttempts(entries));

/* the census. atts in the order kept (built, the ledger's, then yours: a tie stays with the earlier) */
export function census(atts) {
  const at = A.NEEDS.map(() => new Map()), champ = A.NEEDS.map(() => [null, null, null, null, null]), tried = new Set(), beat = new Set();
  let wins = 0;
  for (const a of atts) {
    const sc = A.scoreOf(a.st), d = A.novelty(a.g); a.sc = sc; tried.add(a.key);
    let won = false;
    A.NEEDS.forEach((n, ni) => {
      if (!sc[n].can) return;
      const cur = at[ni].get(a.key);
      if (!cur || a.mine || (!cur.a.mine && sc[n].now > cur.now)) at[ni].set(a.key, { a, now: sc[n].now, could: sc[n].could });
      if (sc[n].wins && d > 0) won = true;
    });
    if (won) { wins++; beat.add(a.key); }
  }
  A.NEEDS.forEach((n, ni) => at[ni].forEach((e, key) => { const d = A.novelty(e.a.g), c = champ[ni][d]; if (!c || e.now > c.now) champ[ni][d] = { key, need: n, d, now: e.now, a: e.a }; }));
  return { at, champ, tried: tried.size, wins, beat: beat.size };
}
/* every niche's champion away from today's computer (today's own row has one recipe: nothing to hold) */
export const champions = cen => cen.champ.flatMap(row => row.filter((c, d) => c && d > 0));

/* who holds a point, as a key that stays the same from visit to visit: the entry's id, the built recipe's, or you */
export const holderOf = a => (a.mine ? 'you' : a.id);
/* what this browser keeps of a visit: when, the ledger's attempts it saw, and each niche's holder (yours left out) */
export function snapOf(atts, cen, at) {
  const champ = {};
  cen.champ.forEach((row, ni) => row.forEach((c, d) => { if (c && d > 0 && !c.a.mine) champ[A.NEEDS[ni] + '.' + d] = holderOf(c.a); }));
  return { at: at || null, ids: atts.filter(a => a.by === 'ledger' && !a.draft).map(a => a.id), champ };
}
const isSnap = p => !!p && typeof p === 'object' && Array.isArray(p.ids) && p.ids.every(x => typeof x === 'string') && (p.champ == null || (typeof p.champ === 'object' && !Array.isArray(p.champ)));
/* what changed since that visit; cen is the census without yours. A visit with nothing kept is the first */
export function since(prev, atts, cen) {
  if (!isSnap(prev)) return { first: true, fresh: [], deposed: [] };
  const seen = new Set(prev.ids), fresh = atts.filter(a => a.by === 'ledger' && !a.draft && !seen.has(a.id)), deposed = [];
  cen.champ.forEach((row, ni) => row.forEach((c, d) => {
    const k = A.NEEDS[ni] + '.' + d, was = prev.champ && Object.hasOwn(prev.champ, k) ? prev.champ[k] : null;
    if (c && d > 0 && !c.a.mine && typeof was === 'string' && was !== holderOf(c.a)) deposed.push({ need: A.NEEDS[ni], d, was, now: c.a });
  }));
  return { first: false, at: typeof prev.at === 'string' ? prev.at : null, fresh, deposed };
}

/* the field in one line, for the first page (#480): how many of the recipes have been tried (built or attempted) and how
   many beat today's computer in some niche, in the current season */
export function summary(entries) { const c = census(population(entries)); return { tried: c.tried, beat: c.beat, of: A.RECIPES, season: A.VERSION }; }

/* the closed seasons' champions, as history (src/data/field.js PAST, written when each season closed): the season, the
   niche (a need at a distance from today's computer), the entry or built recipe that held it, how far it had come.
   Never deleted: a champion of season 1 stays one */
export function pastChampions(past = PAST) {
  const out = [];
  for (const v of Object.keys(past || {}).map(Number).filter(Number.isInteger).sort((a, b) => a - b)) {
    const R = past[v]; if (!R || !Array.isArray(R.champ)) continue;
    for (const c of R.champ) if (c && A.NEEDS.includes(c.need) && Number.isInteger(c.d) && c.d > 0 && typeof c.id === 'string') out.push({ season: v, need: c.need, d: c.d, id: c.id, built: !!c.built, who: typeof c.who === 'string' ? c.who : '', now: typeof c.now === 'number' ? c.now : null, closed: R.closed || null });
  }
  return out;
}
/* a closed season's record, as scripts/season.mjs writes it into PAST: every scored attempt's facts and credit, and
   each niche's champion, from the settled ledger W at the season's end */
export function seasonRecord(W, closed) {
  const L = (W.arch || []).map(id => W.byId[id]), facts = {};
  L.forEach(e => { facts[e.id] = Object.assign({}, e.facts, { state: e.state, firstTry: !!e.firstTry, firstIn: (e.firstIn || []).slice() }); });
  const cen = census(population(L));
  const champ = champions(cen).map(c => ({ need: c.need, d: c.d, id: c.a.id, built: !!c.a.built, who: c.a.built ? '' : c.a.who, now: Math.round(c.now * 1000) / 1000 }));
  return { closed: closed || null, facts, champ };
}
