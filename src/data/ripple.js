/* What if? The world as a simulator: a small causal model of the chip industry, between the islands.
   Five levers sit on the islands where they are decided (AI demand at the data centre, HBM supply at the port where
   memory and chips are packed together, the price of power on the power island, the next node and the supply of
   mature chips at the factory). Each effect lives on the island it is felt at; rules say how a change in one moves
   another (src/engines/ripple.js). Directions follow the economics and the 2021–2026 events in src/data/facts.json;
   the strengths are illustrative round numbers, chosen so the sizes are sensible next to one another. Not a
   forecast. Brought over from the first version of the site (the branch 'before', src/data/ripple.js), where every
   effect sat on a topic; the words are in src/i18n/en.json (whatif.*). */

/* Levers: what you can change. ind is the effect the lever sets, place the island it sits on, facts its sources. */
export const LEVERS = [
  { id: 'demand', ind: 'aidemand', place: 'datacentre', min: -50, max: 150, step: 10, unit: '%', facts: ['hyperscaler-capex','nvidia-q2fy27'] },
  { id: 'hbm', ind: 'hbm', place: 'port', min: -60, max: 40, step: 10, unit: '%', facts: ['memory-squeeze','hbm4','skhynix-margin'] },
  { id: 'elec', ind: 'elec', place: 'power', min: -50, max: 200, step: 10, unit: '%', facts: ['ai-dc-tco','dc-electricity'] },
  { id: 'node', ind: 'delay', place: 'fab', min: 0, max: 4, step: 0.5, unit: 'yr', facts: ['intel-10nm','tsmc-n2'] },
  { id: 'mature', ind: 'mature', place: 'fab', min: -40, max: 20, step: 5, unit: '%', facts: ['car-shortage-2021','legacy-auto'] }
];

/* Effects: where each is felt, and its unit. The levers' own come first. */
export const INDICATORS = [
  { id: 'aidemand', place: 'datacentre', unit: '%' },
  { id: 'hbm', place: 'port', unit: '%' },
  { id: 'elec', place: 'power', unit: '%' },
  { id: 'delay', place: 'fab', unit: 'yr' },
  { id: 'mature', place: 'fab', unit: '%' },
  { id: 'memtight', place: 'port', unit: '%' },
  { id: 'memprice', place: 'port', unit: '%' },
  { id: 'aiship', place: 'datacentre', unit: '%' },
  { id: 'gpuprice', place: 'datacentre', unit: '%' },
  { id: 'memprofit', place: 'port', unit: '%' },
  { id: 'perfw', place: 'fab', unit: '%' },
  { id: 'energytoken', place: 'datacentre', unit: '%' },
  { id: 'costtoken', place: 'datacentre', unit: '%' },
  { id: 'aicompute', place: 'datacentre', unit: '%' },
  { id: 'dcpower', place: 'power', unit: '%' },
  { id: 'grid', place: 'power', unit: '%' },
  { id: 'devprice', place: 'phones', unit: '%' },
  { id: 'cars', place: 'cars', unit: '%' },
  { id: 'archgain', place: 'studio', unit: '%' },
  { id: 'designcost', place: 'studio', unit: '%' },
  { id: 'rivals', place: 'fab', unit: '%' },
  { id: 'custom', place: 'studio', unit: '%' },
  { id: 'fabinvest', place: 'fab', unit: '%' },
  { id: 'tools', place: 'tools', unit: '%' },
  { id: 'engineers', place: 'village', unit: '%' },
  { id: 'newarch', place: 'idea', unit: '%' },
  { id: 'spatial', place: 'idea', unit: '%' },
  { id: 'cim', place: 'idea', unit: '%' },
  { id: 'photonic', place: 'idea', unit: '%' },
  { id: 'neuro', place: 'idea', unit: '%' },
  { id: 'pbits', place: 'idea', unit: '%' },
  { id: 'reversible', place: 'idea', unit: '%' }
];

/* Rules: [from, to, strength]. A strength of 0.5 means "a 10% change in from moves to by 5%"; from the node delay (in
   years) the strength is per year. A MIN effect follows the smallest of its inputs. The wire's label and the reason
   are words: whatif.rule.<from>.<to> and whatif.why.<from>.<to>. */
export const MIN = { aiship: true };
export const RULES = [
  ['aidemand', 'memtight', 1],
  ['hbm', 'memtight', -1],
  ['delay', 'memtight', 4],
  ['memtight', 'memprice', 0.8],
  ['memprice', 'memprofit', 1.5],
  ['memprice', 'devprice', 0.06],
  ['mature', 'devprice', -0.2],
  ['mature', 'cars', 0.6],
  ['aidemand', 'aiship', 1],
  ['hbm', 'aiship', 1],
  ['memtight', 'gpuprice', 0.4],
  ['memprice', 'gpuprice', 0.15],
  ['delay', 'perfw', -12],
  ['perfw', 'energytoken', -1],
  ['perfw', 'archgain', -1],
  ['aiship', 'aicompute', 1],
  ['perfw', 'aicompute', 1],
  ['aiship', 'dcpower', 0.5],
  ['energytoken', 'dcpower', 0.5],
  ['dcpower', 'grid', 1],
  ['elec', 'costtoken', 0.07],
  ['energytoken', 'costtoken', 0.07],
  ['gpuprice', 'costtoken', 0.6],
  ['gpuprice', 'custom', 0.5],
  ['delay', 'designcost', 5],
  ['delay', 'rivals', 15],
  ['mature', 'fabinvest', -0.5],
  ['aidemand', 'fabinvest', 0.2],
  ['memprice', 'fabinvest', 0.2],
  ['fabinvest', 'tools', 0.8],
  ['fabinvest', 'engineers', 0.6],
  ['energytoken', 'newarch', 1],
  ['elec', 'newarch', 0.15],
  ['memtight', 'newarch', 0.3],
  ['memtight', 'spatial', 0.4],
  ['newarch', 'spatial', 0.3],
  ['newarch', 'cim', 0.6],
  ['newarch', 'photonic', 0.4],
  ['dcpower', 'photonic', 0.2],
  ['newarch', 'neuro', 0.3],
  ['newarch', 'pbits', 0.2],
  ['newarch', 'reversible', 0.2]
];

/* Ready-made scenarios, three modelled on things that happened. */
export const PRESETS = [
  { id: 'squeeze', set: {demand: 60,hbm: -10} },
  { id: 'cars', set: {mature: -15} },
  { id: 'intel', set: {node: 3} },
  { id: 'power', set: {elec: 100} }
];

/* Small puzzles: ok gets the lever settings and the model's values. */
const onlyMoved = (L, id) => Object.keys(L).every(k => (k === id ? L[k] !== 0 : !L[k]));
export const PUZZLES = [
  { id: 'phones', ok: (L, v) => onlyMoved(L, 'demand') && v.devprice >= 2 },
  { id: 'power', ok: L => L.elec >= 100 },
  { id: 'answer', ok: (L, v) => !L.elec && v.costtoken >= 10 },
  { id: 'split', ok: (L, v) => onlyMoved(L, 'mature') && v.cars <= -5 && Math.abs(v.aicompute) < 1 }
];
