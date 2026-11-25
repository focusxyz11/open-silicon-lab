/* What is worked out about experiments (src/data/experiments/): their state, where they are seen, what backs
   them, and the ways on from each. Pure: data in, data out; words are chosen by the views.

   The state is never written down, so it cannot go stale:
   - live    it can be done on the site today: a challenge puts a target on it, a try sits on its own page
             (src/v2/probes.js), a stop of it has a try, or it names an address where it is played
   - wanted  it waits for something the lab does not have: an engine not written, a part of an engine, or
             cases, sources and people from outside
   - ready   an engine that exists could judge it; nothing on the site asks it yet
   - words   only words today: a question and something true to notice */
import { EXPERIMENTS, BY_WORLD } from '../data/experiments/index.js';
import { engineOf } from '../data/layers.js';
import { TRIES, CASES, FIGURES, TRIED } from '../data/weave.js';

export const STATES = ['live', 'ready', 'words', 'wanted'];
export const WORLD_IDS = Object.keys(BY_WORLD);
export { EXPERIMENTS };

const BY_ID = Object.fromEntries(EXPERIMENTS.map(x => [x.id, x]));
const AT_STOP = Object.fromEntries(EXPERIMENTS.flatMap(x => (x.stops || []).map(s => [s, x.id])));
export const experimentOf = id => BY_ID[id] || null;
/* the experiment a stop belongs to: every stop is in exactly one */
export const experimentAtStop = key => BY_ID[AT_STOP[key]] || null;
const unique = a => [...new Set(a)];

/* the tries of its stops: [{ stop, setting }] (src/data/weave.js TRIES, played inside the stop's question) */
const triesOf = x => (x.stops || []).filter(s => TRIES[s]).map(s => ({ stop: s, setting: TRIES[s] }));
export function stateOf(x) {
  if ((x.ch && x.ch.length) || x.probe || x.go || triesOf(x).length) return 'live';
  if (x.wants) return 'wanted';
  const e = x.engine && engineOf(x.engine);
  if (e && e.state !== 'missing') return 'ready';
  return e ? 'wanted' : 'words';
}
/* where it is seen: its stops' levels, or the levels it names */
export const levelsOf = x => unique((x.stops || []).map(s => s.split('.')[1]).concat(x.at || []));
export const casesOf = x => unique(CASES.filter(c => (x.stops || []).includes(c.stop)).map(c => c.id).concat(x.cases || []));
export const figuresOf = x => unique((x.stops || []).flatMap(s => FIGURES[s] || []).concat(x.figures || []));
/* stops whose words list what people are trying there (stop.<key>.tried) */
export const triedOf = x => (x.stops || []).filter(s => TRIED.includes(s));
/* the names its question may have, in order: words of its own, else its first stop's question */
export const askKeys = x => ['exp.' + x.id + '.ask'].concat(x.stops && x.stops.length ? ['stop.' + x.stops[0] + '.q'] : []);
/* where it is played: a challenge first, then an address of its own, then the stop that holds its try */
export function playOf(x) {
  if (x.ch && x.ch.length) return { kind: 'ch', id: x.ch[0], href: '#/do/' + x.ch[0] };
  if (x.probe) return { kind: 'probe', href: '#/read/' + x.id };
  if (x.go) return { kind: 'go', href: x.go };
  const t = triesOf(x)[0]; if (t) { const [th, d] = t.stop.split('.'); return { kind: 'try', id: t.setting, href: '#/ask/' + th + '/' + d }; }
  return null;
}
const worldsOf = x => [x.world].concat(x.also || []);

/* Ways on: the nearest other experiments, and what joins them. Never a fixed trail: what is near depends on what
   they share (the same strand of a question, the same engine, a given both question, a direction both try, the
   same level), and the list leans to other worlds, because connections across questions are what the framework is
   for. Each way says what joins: { id, by, what }. */
const share = (a, b) => (a || []).filter(v => (b || []).includes(v));
export function waysOn(x, n = 4) {
  const scored = EXPERIMENTS.filter(y => y.id !== x.id).map(y => {
    const reasons = [];
    const add = (w, by, what) => reasons.push({ w, by, what });
    if (y.world === x.world && y.strand === x.strand) add(3, 'strand', null);
    if (worldsOf(y).some(w => worldsOf(x).includes(w)) && y.world !== x.world) add(2, 'world', null);
    if (x.engine && y.engine === x.engine) add(2, 'engine', x.engine);
    share(x.open, y.open).forEach(d => add(1.5, 'dir', d));
    share(x.given, y.given).forEach(g => add(1.2, 'given', g));
    share(levelsOf(x), levelsOf(y)).forEach(l => add(0.8, 'level', l));
    if (y.lens === x.lens) add(0.4, 'lens', x.lens);
    share(x.trade, y.trade).forEach(m => add(0.3, 'measure', m));
    const s = reasons.reduce((a, r) => a + r.w, 0) + (y.world !== x.world ? 0.6 : 0) + (stateOf(y) === 'live' ? 0.3 : 0);
    const top = reasons.sort((a, b) => b.w - a.w)[0];
    return { y, s, top };
  }).filter(o => o.s > 1).sort((a, b) => b.s - a.s || (a.y.id < b.y.id ? -1 : 1));
  /* at most two from its own world, so the ways on cross questions */
  const out = [], own = { n: 0 };
  for (const o of scored) {
    if (o.y.world === x.world) { if (own.n >= 2) continue; own.n++; }
    out.push({ id: o.y.id, by: o.top ? o.top.by : 'near', what: o.top ? o.top.what : null });
    if (out.length >= n) break;
  }
  return out;
}

/* how many are in each state, overall or in one world */
export const counts = (L = EXPERIMENTS) => Object.fromEntries(STATES.map(st => [st, L.filter(x => stateOf(x) === st).length]));
