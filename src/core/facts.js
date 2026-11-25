/* The industry's figures (src/data/facts.json), fetched once for every view that names one: facts() -> a promise of
   the facts by id; factsNow() -> them by id once they have arrived, or null. If the fetch fails, the views get no
   facts for now ({}), and the next facts() asks again. No imports, so any page can load it, the first one too. */
let FACT = null, asked = null;
export const facts = () => asked || (asked = fetch('src/data/facts.json').then(r => r.json()).then(j => (FACT = Object.fromEntries((j.facts || []).map(f => [f.id, f]))), () => { asked = null; return FACT || (FACT = {}); }));
export const factsNow = () => FACT;
