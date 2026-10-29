/* What if? Propagates lever settings through the causal model in src/data/ripple.js.
   Pure logic, no DOM. Linear rules on a graph with no loops: each indicator is the sum of
   strength × change over its inputs (or the smallest input, for MIN indicators). */
import { LEVERS, INDICATORS, RULES, MIN } from '../data/ripple.js';

export const IND = Object.fromEntries(INDICATORS.map(i => [i.id, i]));
export const LEVER_OF = Object.fromEntries(LEVERS.map(l => [l.ind, l]));
export const NEUTRAL = Object.fromEntries(LEVERS.map(l => [l.id, 0]));

/* Indicators in an order where every input comes before what it feeds. Throws on a loop. */
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

/* levers: { demand: 50, hbm: -20, ... } → values, the contributions behind each, and how
   many causal steps each indicator sits from a lever (for the ripple animation). */
export function ripple(levers = {}) {
  const v = {}, why = {}, depth = {};
  for (const id of ORDER) {
    const L = LEVER_OF[id];
    if (L) { v[id] = +levers[L.id] || 0; why[id] = []; depth[id] = 0; continue; }
    const terms = RULES.filter(r => r[1] === id).map(r => ({ from: r[0], k: r[2], s: r[3], d: r[4], amt: r[2] * v[r[0]] }));
    let val;
    if (MIN[id]) { const pick = terms.reduce((a, b) => (b.amt < a.amt ? b : a)); val = pick.amt; terms.forEach(t => (t.bind = t === pick)); }
    else val = terms.reduce((s, t) => s + t.amt, 0);
    v[id] = clamp(val, IND[id].unit);
    why[id] = terms.filter(t => (MIN[id] ? t.bind : true) && Math.abs(t.amt) >= 0.05).sort((a, b) => Math.abs(b.amt) - Math.abs(a.amt));
    depth[id] = why[id].length ? 1 + Math.max(...why[id].map(t => depth[t.from])) : 0;
  }
  return { v, why, depth };
}

/* Is a change big enough to show? */
export const shows = (val, unit) => Math.abs(val) >= (unit === 'yr' ? 0.25 : 0.5);

/* The headline change for each topic: its largest change. `lever` marks topics a moved lever sits on. */
export function topicHeads(res) {
  const heads = {};
  INDICATORS.forEach(i => {
    const val = res.v[i.id]; if (!shows(val, i.unit)) return;
    const cur = heads[i.topic]; const lever = !!LEVER_OF[i.id];
    if (!cur || Math.abs(val) > Math.abs(cur.v)) heads[i.topic] = { id: i.id, v: val, lever: lever || (cur && cur.lever) || false };
    else if (lever) cur.lever = true;
  });
  return heads;
}

/* The strongest path back from an indicator to a lever, lever first: [{id, v, s}], where s is
   the label of the rule that leads into that step. */
export function chain(res, id) {
  const path = [{ id, v: res.v[id], s: null }];
  for (let guard = 0; guard < 40; guard++) {
    const top = (res.why[path[0].id] || [])[0]; if (!top) break;
    path[0].s = top.s; path.unshift({ id: top.from, v: res.v[top.from], s: null });
  }
  return path;
}

export function fmt(val, unit) {
  if (unit === 'yr') return (val > 0 ? '+' : '') + (Math.round(val * 10) / 10) + ' yr';
  const r = Math.abs(val) >= 10 ? Math.round(val) : Math.round(val * 10) / 10;
  return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r) + '%';
}
