/* A thousand that pass (the core question "Only humans", home.q.human): a program designs an AI chip for a need, and
   gives back a thousand designs that pass every check, their measured scores close together. Pure logic, no DOM, no
   words (ids only; the words are th.* in src/i18n/en/labs.json). Tests: tests/thousand.test.mjs.

   The measured side is the AI chip model of Build your own AI chip (src/engines/aibuild.js): a seeded search over its
   dials keeps the first thousand choices that meet every requirement of the need's mission and score well on its
   goal (tokens per joule for the phone), so the four numbers a check can see (power, cost, speed, area) sit close.
   The need also has sides no check measures, shown as people around it: who uses it, who repairs it, who pays for
   it, what it costs the planet, and what it must never do. Each design also makes four choices the chip model does not
   score (where hard questions are answered, the years of updates built in, whether its documents are open, where its
   memory sits), and each choice leans toward some of those people and away from others, by the plain rules in LEAN.
   The rules are a model, shown to the player with every design: they are what makes the choice a person's, not a
   score. Nothing here ranks the designs; a choice is kept as a ledger try with its reason (src/engines/ledger.js). */
import { design } from './aibuild.js';

/* the needs a thousand can be made for: the mission of the chip model, the search's seed, how many, and the lowest
   score on the mission's goal a design may have (so the measured scores sit close together) */
export const NEEDS = { phone: { mission: 'phone', seed: 2026, n: 1000, floor: 7 } };
export const PEOPLE = ['user', 'repair', 'payer', 'planet', 'never'];
/* the four choices no check scores, and how each value leans toward (+) or away from (-) each person */
export const TRAITS = [
  { id: 'data', values: ['device', 'cloud'] },
  { id: 'years', values: ['3', '5', '8'] },
  { id: 'docs', values: ['open', 'closed'] },
  { id: 'memory', values: ['beside', 'stacked'] }
];
export const LEAN = {
  data: { device: { never: 2, planet: 1, user: -1 }, cloud: { user: 2, payer: 1, never: -2, planet: -1 } },
  years: { 3: { payer: 2, user: -1, planet: -2 }, 5: {}, 8: { planet: 2, user: 1, payer: -2 } },
  docs: { open: { repair: 2, payer: -1 }, closed: { repair: -2, payer: 1 } },
  memory: { beside: { repair: 1, planet: 1, user: -1 }, stacked: { user: 1, repair: -1 } }
};
/* what a check can measure, and the two the field is drawn on (lower is better on both; the need's limits bound them) */
export const MEASURES = ['power', 'cost', 'tps', 'area'];
export const AXES = ['power', 'cost'];
export const REASON = [8, 140];

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const clamp = v => Math.max(-2, Math.min(2, v));
/* how a design's four choices treat each person, from -2 (badly) to 2 (well) */
export function leanOf(traits) {
  const out = Object.fromEntries(PEOPLE.map(p => [p, 0]));
  for (const T of TRAITS) Object.entries(LEAN[T.id][traits[T.id]] || {}).forEach(([p, v]) => { out[p] += v; });
  PEOPLE.forEach(p => { out[p] = clamp(out[p]); });
  return out;
}
/* the limits of the need's mission on what a check measures */
export function limits(need) {
  const N = NEEDS[need]; if (!N) return null;
  const design0 = design({ mission: N.mission, arch: 'sys', node: 'n3', area: 12, dies: 1, sram: 16, fp4: true, mem: 'lp', memN: 2, pkg: 'org', f: 1.2, agents: true });
  return Object.fromEntries(design0.rows.filter(r => r.op !== 'fit').map(r => [r.key, { op: r.op, value: r.limit }]));
}

const MADE = {};
/* the thousand, made once for each need: [{ id, c (the chip model's choice), m (what a check measures), traits, lean }] */
export function thousand(need) {
  if (MADE[need]) return MADE[need];
  const N = NEEDS[need]; if (!N) return [];
  const r = rng(N.seed), pick = a => a[Math.floor(r() * a.length)], out = [], seen = new Set();
  for (let tries = 0; out.length < N.n && tries < 200000; tries++) {
    const c = { mission: N.mission, arch: pick(['sys', 'gpu']), node: pick(['n5', 'n3']), area: 8 + Math.floor(r() * 23), dies: 1, sram: pick([4, 8, 12, 16, 24, 32, 48]), fp4: r() < 0.85, mem: 'lp', memN: 1 + Math.floor(r() * 4), pkg: 'org', f: Math.round((0.6 + r() * 1.4) * 20) / 20, agents: true };
    const k = JSON.stringify(c); if (seen.has(k)) continue; seen.add(k);
    const d = design(c); if (!d.all || d.goal.value < N.floor) continue;
    const traits = Object.fromEntries(TRAITS.map(T => [T.id, pick(T.values)]));
    out.push({ id: 'd' + String(out.length + 1).padStart(4, '0'), c, m: { power: d.power, cost: d.cost, tps: d.tps, area: d.dieA, goal: d.goal.value }, traits, lean: leanOf(traits) });
  }
  return (MADE[need] = out);
}
export const designOf = (need, id) => thousand(need).find(d => d.id === id) || null;
/* is a reason a reason: one line of plain words, long enough to say something (the ledger checks it again) */
export const reasonOk = s => typeof s === 'string' && s.trim().length >= REASON[0] && s.length <= REASON[1] && !/[\n\r<>]|https?:|www\./i.test(s);
/* what a group of choices leans toward: for each person, the average lean of the designs chosen (null for none) */
export function leaningOf(need, picks) {
  const D = picks.map(id => designOf(need, id)).filter(Boolean); if (!D.length) return null;
  return Object.fromEntries(PEOPLE.map(p => [p, D.reduce((a, d) => a + d.lean[p], 0) / D.length]));
}
/* the person a design treats best (the first, if equal), and the one it treats worst */
export function sides(d) {
  const best = PEOPLE.reduce((a, p) => (d.lean[p] > d.lean[a] ? p : a), PEOPLE[0]), worst = PEOPLE.reduce((a, p) => (d.lean[p] < d.lean[a] ? p : a), PEOPLE[0]);
  return { best, worst };
}
