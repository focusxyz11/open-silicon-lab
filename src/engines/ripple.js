/* What if? Carries the levers' settings through the causal model in src/data/ripple.js, from island to island.
   Pure logic, no DOM. Linear rules on a graph with no loops: each effect is the sum of strength × change over its
   inputs (or the smallest input, for a MIN effect). Brought over from the first version of the site, where the
   effects sat on topics; here each sits on the island it is felt at. */
import { LEVERS, INDICATORS, RULES, MIN, PRESETS, PUZZLES } from '../data/ripple.js';

export { LEVERS, INDICATORS, RULES, PRESETS, PUZZLES };
export const IND = Object.fromEntries(INDICATORS.map(i => [i.id, i]));
export const LEVER_OF = Object.fromEntries(LEVERS.map(l => [l.ind, l]));
export const NEUTRAL = Object.fromEntries(LEVERS.map(l => [l.id, 0]));

/* effects in an order where every input comes before what it feeds; throws on a loop */
export function order(rules = RULES, inds = INDICATORS) {
  const ins = {}; inds.forEach(i => (ins[i.id] = [])); rules.forEach(r => ins[r[1]].push(r[0]));
  const out = [], mark = {};
  const visit = (id, path) => {
    if (mark[id] === 2) return; if (mark[id] === 1) throw new Error('loop: ' + path.concat(id).join(' → '));
    mark[id] = 1; ins[id].forEach(s => visit(s, path.concat(id))); mark[id] = 2; out.push(id);
  };
  inds.forEach(i => visit(i.id, []));
  return out;
}
const ORDER = order();
const clamp = (v, u) => (u === 'yr' ? v : Math.max(-95, Math.min(400, v)));

/* levers { demand: 50, hbm: -20, ... } → the values, the terms behind each, and how many steps each effect is from a
   lever (the light travels that many hops) */
export function ripple(levers = {}) {
  const v = {}, why = {}, depth = {};
  for (const id of ORDER) {
    const L = LEVER_OF[id];
    if (L) { v[id] = +levers[L.id] || 0; why[id] = []; depth[id] = 0; continue; }
    const terms = RULES.filter(r => r[1] === id).map(r => ({ from: r[0], k: r[2], amt: r[2] * v[r[0]] }));
    let val;
    if (MIN[id]) { const pick = terms.reduce((a, b) => (b.amt < a.amt ? b : a)); val = pick.amt; terms.forEach(x => (x.bind = x === pick)); }
    else val = terms.reduce((s, x) => s + x.amt, 0);
    v[id] = clamp(val, IND[id].unit);
    why[id] = terms.filter(x => (MIN[id] ? x.bind : true) && Math.abs(x.amt) >= 0.05).sort((a, b) => Math.abs(b.amt) - Math.abs(a.amt));
    depth[id] = why[id].length ? 1 + Math.max(...why[id].map(x => depth[x.from])) : 0;
  }
  return { v, why, depth };
}

/* is a change big enough to show? */
export const shows = (val, unit) => Math.abs(val) >= (unit === 'yr' ? 0.25 : 0.5);

/* what each island feels: its changes, largest first, and whether a moved lever sits there */
export function placeHeads(res, levers = {}) {
  const heads = {};
  INDICATORS.forEach(i => {
    const val = res.v[i.id], lever = LEVER_OF[i.id], moved = lever && !!levers[lever.id];
    if (!shows(val, i.unit) && !moved) return;
    const h = heads[i.place] || (heads[i.place] = { place: i.place, all: [], lever: false, depth: Infinity });
    h.all.push({ id: i.id, v: val, unit: i.unit, lever: !!lever });
    if (moved) h.lever = true;
    h.depth = Math.min(h.depth, res.depth[i.id]);
  });
  Object.values(heads).forEach(h => { h.all.sort((a, b) => (b.lever - a.lever) || Math.abs(b.v) - Math.abs(a.v)); h.top = h.all[0]; });
  return heads;
}

/* the islands a moved lever reaches, nearest in steps first: where the light goes from each lever's island */
export function reach(res, levers = {}) {
  const out = {};
  LEVERS.filter(l => levers[l.id]).forEach(l => {
    const seen = new Set([l.ind]), q = [l.ind];
    while (q.length) { const id = q.shift(); RULES.filter(r => r[0] === id && shows(res.v[r[1]], IND[r[1]].unit)).forEach(r => { if (!seen.has(r[1])) { seen.add(r[1]); q.push(r[1]); } }); }
    const places = [...seen].map(id => IND[id].place).filter((p, i, a) => p !== l.place && a.indexOf(p) === i);
    out[l.id] = { from: l.place, to: places };
  });
  return out;
}

/* the strongest path back from an effect to a lever, lever first: [{ id, v, rule }], rule the key of the step into it */
export function chain(res, id) {
  const path = [{ id, v: res.v[id], rule: null }];
  for (let guard = 0; guard < 40; guard++) {
    const top = (res.why[path[0].id] || [])[0]; if (!top) break;
    path[0].rule = top.from + '.' + path[0].id; path.unshift({ id: top.from, v: res.v[top.from], rule: null });
  }
  return path;
}

/* a change as it is written: +12%, −3.4%, +1.5 yr */
export function fmt(val, unit) {
  if (unit === 'yr') return (val > 0 ? '+' : '') + (Math.round(val * 10) / 10) + ' yr'; /* i18n-ok */
  const r = Math.abs(val) >= 10 ? Math.round(val) : Math.round(val * 10) / 10;
  return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r) + '%';
}

/* the puzzles solved by one setting */
export function solved(levers = {}) { const res = ripple(levers); return PUZZLES.filter(p => p.ok(Object.assign({}, NEUTRAL, levers), res.v)).map(p => p.id); }

/* a setting read back from what was saved: known levers, inside their range, on their steps */
export function normalLevers(o) {
  const out = {}; LEVERS.forEach(l => { const v = +((o || {})[l.id]); out[l.id] = Number.isFinite(v) ? Math.max(l.min, Math.min(l.max, Math.round(v / l.step) * l.step)) : 0; }); return out;
}
