/* Machines from shared blocks (#/machines/<need>, docs/MACHINES.md): a place, not a page (#320). No standard computer:
   pick a need, and its machine stands on the stage as a live block diagram, a few shared blocks joined by one grammar,
   each block drawn in the form the need calls for (a circuit, software running on the core, a liquid fabric, a kind of
   new matter), with what flows along its wires (a signal, a number, a bit) moving. Change a block's form and it
   changes on the picture; let an agent assemble it, and its offers stand on a front of today's best compromises
   (src/v2/front.js, the same drawing as two lenses meeting, #315), your machine a dot, a corner where nobody is yet.
   Beyond today's chip: new matter may not exist yet, and every claim says how sure it is, one mark on the picture and
   in the words (in products, shown in a lab, a guess); the energy is a range, physics sets the floor, and the agent
   counts guesses only when told to.

   The picture has layers, each opened from the machine and each repainting it: what flows; where each part is made
   and how long a try takes (Fab on a desk, src/data/fabs.js); how fast each part reshapes (liquid hardware,
   src/data/liquid.js: a need whose job keeps changing draws the line its parts must beat); how true each claim is
   (src/data/inventions.js); the attempts kept for the need (Moore's law for ideas, src/engines/ledger.js labCurve; an
   attempt of yours is kept as a draft with its slip, src/v2/commons.js); and the shared blocks themselves.
   Look explores; Do plays the need's challenge on the picture (GOALS in src/data/blocks.js, checked by
   src/engines/machine.js play): meet its rules with the least energy, then a harder goal. The address says where you
   are: #/machines/<need>, #/machines/<need>/do, #/machines/<need>/<layer>.
   The blocks, the grammar and the needs: src/data/blocks.js; the checks, the scores, the agent and the goals:
   src/engines/machine.js; how each block is checked: the community's plan (src/engines/build.js).

   machines(el, ctx) draws into el; each need keeps its state for the visit. ctx: { need, sub ('do' or a layer), go(need,
   sub), FACT (facts.json by id, optional), and, to keep attempts (optional): world() (the ledger with your drafts),
   keep(need, plan, el), slip(id), slipClick(ev, done), refusal(r), signHtml() }. */
import { t, fmtNum } from '../core/i18n.js';
import { BLOCKS, NEEDS, FORMS, GOALS, blockOf, needOf } from '../data/blocks.js';
import { mattersFor, STATUS } from '../data/inventions.js';
import { liquidsFor, liquidOf, FALLBACK } from '../data/liquid.js';
import * as M from '../engines/machine.js';
import { plan as buildPlan } from '../engines/build.js';
import { FABS, fabOf } from '../data/fabs.js';
import { labCurve } from '../engines/ledger.js';
import { frontFigure } from './front.js';

const REPO = 'https://github.com/focusxyz11/open-silicon-lab/blob/main/';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches;
/* the layers of the picture, each opened from the machine */
export const LAYERS = ['flow', 'made', 'reshape', 'claims', 'tries', 'blocks'];
/* a block's way into a view of its own, from its row beside the machine: { blockId: '#/address' }, its words
   machines.way.<blockId> (the core's view, #321, joins here) */
export const WAYS = {};
/* each need's state, for the visit: the plan, the agent, the layer, the mode, the goal */
const KEEP = {};
/* the goals won, in this browser only (a convenience: the challenge can be played again at will) */
const WON_KEY = 'osl-machines-v1';
let WON = {};
try { WON = JSON.parse(localStorage.getItem(WON_KEY) || '{}').won || {}; } catch (e) { WON = {}; }
const saveWon = () => { try { localStorage.setItem(WON_KEY, JSON.stringify({ won: WON })); } catch (e) { /* no storage */ } };

/* the four families drawn as one small mark each: a circuit solid, software dashed, new matter a hexagon, a liquid
   fabric a drop */
const MARK = {
  circuit: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/></svg>',
  software: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><rect x="1.75" y="1.75" width="14.5" height="14.5" rx="3"/></svg>',
  matter: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><polygon points="1,9 5,2 13,2 17,9 13,16 5,16"/></svg>',
  liquid: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 1.5C9 1.5 3 8.2 3 11.6a6 6 0 0 0 12 0C15 8.2 9 1.5 9 1.5z"/></svg>'
};
/* how sure a claim is, one mark everywhere (on the picture and in the words): in products a full disc, shown in a lab
   half of one, a guess a dashed ring */
const TRUTH = {
  product: '<svg class="mtr t-product" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6"/></svg>',
  lab: '<svg class="mtr t-lab" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" class="o"/><path d="M6 1.4a4.6 4.6 0 0 0 0 9.2z"/></svg>',
  guess: '<svg class="mtr t-guess" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6"/></svg>'
};
const mst = s => '<span class="mst s-' + s + '">' + TRUTH[s] + esc(t('invent.status.' + s)) + '</span>';
const RANK = { product: 0, lab: 1, guess: 2 };
const weakest = list => list.reduce((w, s) => (RANK[s] > RANK[w] ? s : w), 'product');
/* how sure the energy of a form is: the weakest claim it rests on (new matter: its gains and catches; a fabric: its
   energy and its time to rewire); a circuit and software are the yardsticks, and carry no mark */
function truthOf(f) {
  const k = M.matterIn(f); if (k) { const c = k.claims.filter(x => x.kind !== 'note'); return weakest((c.length ? c : k.claims).map(x => x.status)); }
  const L = M.liquidIn(f); return L ? weakest([L.energy.status, L.reshape.status]) : null;
}
/* the kinds a family offers a block: kinds of new matter, or liquid fabrics */
const kindsOf = (k, blockId) => (k === 'matter' ? mattersFor(blockId) : k === 'liquid' ? liquidsFor(blockId) : []);
const kindName = (k, id) => t((k === 'matter' ? 'invent.matter.' : 'liquid.kind.') + id + '.t');
const markOf = f => MARK[M.familyOf(f)] || '';
const fam = f => 'f-' + M.familyOf(f);
const times = x => (x >= 10 ? fmtNum(Math.round(x)) : fmtNum(x, x < 0.01 ? { maximumSignificantDigits: 1 } : { maximumFractionDigits: x < 1 ? 2 : 1 })) + '×';
const span = s => (Math.abs(s.low - s.high) / s.high < 0.005 ? times(s.high) : times(s.low) + ' – ' + times(s.high));
const days = (lo, hi) => (!isFinite(lo) ? t('machines.ui.never') : lo === hi || !isFinite(hi) ? fmtNum(lo) + (isFinite(hi) ? '' : '+') : fmtNum(lo) + '–' + fmtNum(hi));
const frac = v => (v >= 1 ? '1' : '1/' + fmtNum(Math.round(1 / v)));
/* a place to make parts, drawn as one small mark: a giant fab, a small one, a roll of film, a desk */
const FABMARK = {
  giant: '<svg class="fmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M2 22V10l7 4V10l7 4V10l7 4V3h6v19z"/></svg>',
  small: '<svg class="fmark" viewBox="0 0 32 24" aria-hidden="true"><rect x="5" y="9" width="8" height="13" rx="1.5"/><rect x="15" y="9" width="8" height="13" rx="1.5"/><path d="M5 6h18"/></svg>',
  flexible: '<svg class="fmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M3 15c5-9 9 9 14 0s9-9 12 0"/><path d="M3 20c5-9 9 9 14 0s9-9 12 0"/></svg>',
  desk: '<svg class="fmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M3 13h26M6 13v9M26 13v9"/><rect x="11" y="5" width="10" height="8" rx="1.5"/></svg>'
};
/* a layer's mark on its tab */
const LAYERMARK = {
  flow: '<path d="M1.5 9h5.5M11 9h5.5"/><rect x="7" y="5.5" width="4" height="7" rx="1"/><circle cx="4" cy="9" r="1.6" class="fl"/>',
  made: '<path d="M2 16V8l4 2.5V8l4 2.5V8l4 2.5V3h2v13z"/>',
  reshape: '<circle cx="9" cy="9" r="6.5"/><path d="M9 5v4l3 2"/>',
  claims: '<circle cx="5" cy="9" r="3.2" class="fl"/><circle cx="13" cy="9" r="3.2" stroke-dasharray="1.6 1.4"/>',
  tries: '<circle cx="3" cy="5" r="1.5" class="fl"/><circle cx="7" cy="9" r="1.5" class="fl"/><circle cx="11" cy="11.5" r="1.5" class="fl"/><circle cx="15" cy="13" r="1.5" class="fl"/>',
  blocks: '<rect x="2" y="3" width="6" height="5" rx="1"/><rect x="10" y="3" width="6" height="5" rx="1"/><rect x="6" y="10.5" width="6" height="5" rx="1"/>'
};
const formName = f => (M.matterIn(f) ? t('invent.matter.' + M.matterIn(f).id + '.t') : M.liquidIn(f) ? t('liquid.kind.' + M.liquidIn(f).id + '.t') : t('machines.form.' + f));
/* a time in seconds, in words */
const secs = x => (!isFinite(x) ? t('liquid.tick.never') : x < 1e-6 ? t('liquid.time.ns', { n: fmtNum(+(x * 1e9).toPrecision(2)) }) : x < 1e-3 ? t('liquid.time.us', { n: fmtNum(+(x * 1e6).toPrecision(3)) }) : x < 1 ? t('liquid.time.ms', { n: fmtNum(+(x * 1e3).toPrecision(3)) }) : t('liquid.time.s', { n: fmtNum(+x.toPrecision(2)) }));

/* ---- the machine as a block diagram: where each block stands, its ports, its wires ---- */
/* columns by how far a block is from the world (the longest path of wires to it), rows in the order of the parts; a
   desktop's machine runs left to right, a phone's top to bottom */
function layout(need, vertical) {
  const depth = {}; need.parts.forEach(p => { depth[p.id] = 0; });
  for (let k = 0; k < need.parts.length; k++) need.wires.forEach(([a, b]) => { if (a === 'world') return; const A = M.portOf(a), B = M.portOf(b); if (A && B) depth[B.part] = Math.max(depth[B.part], depth[A.part] + 1); });
  const cols = []; need.parts.forEach(p => (cols[depth[p.id]] = cols[depth[p.id]] || []).push(p.id));
  const C = cols.length, at = {};
  const R = Math.max(...cols.map(c => c.length));
  if (!vertical) {
    /* as wide as its columns and as tall as its rows, so a short machine stands as large as a tall one */
    const bw = 150, VW = 250 + (C - 1) * 224 + 110, VH = 330 + (R - 1) * 196;
    cols.forEach((ids, d) => ids.forEach((id, i) => { at[id] = { x: 250 + d * 224, y: VH / 2 + (i - (ids.length - 1) / 2) * 196 }; }));
    return { VW, VH, bw, bh: bw / 1.4, at, depth, vertical, world: { x: 72, y: VH / 2 } };
  }
  const VW = 400, bw = 132, gap = 212, VH = 150 + (C - 1) * gap + 140;
  cols.forEach((ids, d) => ids.forEach((id, i) => { at[id] = { x: VW / 2 + (i - (ids.length - 1) / 2) * 196, y: 150 + d * gap }; }));
  return { VW, VH, bw, bh: bw / 1.4, at, depth, vertical, world: { x: VW / 2, y: 38 } };
}
/* where a port is on its block's edge: inputs on the side facing the world, spread by their number; the output on the
   other side (on a phone, under the block's name) */
function portAt(L, need, ref) {
  if (ref === 'world') return { x: L.vertical ? L.world.x : L.world.x + 26, y: L.vertical ? L.world.y + 24 : L.world.y };
  const P = M.portOf(ref), c = L.at[P.part], b = blockOf(need.parts.find(p => p.id === P.part).block), n = (b[P.dir] || []).length, off = (P.i - (n - 1) / 2) * 24;
  /* a phone's machine runs down: a block's output leaves from under its name */
  if (L.vertical) return { x: c.x + off, y: c.y + (P.dir === 'in' ? -L.bh / 2 : L.bh / 2 + 60) };
  return { x: c.x + (P.dir === 'in' ? -L.bw / 2 : L.bw / 2), y: c.y + off };
}
const pt = p => p.x.toFixed(1) + ' ' + p.y.toFixed(1);
/* a wire's path: a smooth bend from one port to the next; one that leaps over a column goes round the blocks between */
function wirePath(L, need, from, to) {
  const a = portAt(L, need, from), b = portAt(L, need, to), F = M.portOf(from), T = M.portOf(to);
  const leap = F && T && L.depth[T.part] - L.depth[F.part] > 1;
  if (L.vertical) {
    if (leap) { const side = a.x <= L.VW / 2 ? 10 : L.VW - 10; return 'M' + pt(a) + 'C' + side + ' ' + (a.y + 90).toFixed(1) + ' ' + side + ' ' + (b.y - 90).toFixed(1) + ' ' + pt(b); }
    const dy = Math.max(30, (b.y - a.y) / 2); return 'M' + pt(a) + 'C' + a.x.toFixed(1) + ' ' + (a.y + dy).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + (b.y - dy).toFixed(1) + ' ' + pt(b);
  }
  if (leap) { const top = Math.min(a.y, b.y) - 210; return 'M' + pt(a) + 'C' + (a.x + 120).toFixed(1) + ' ' + top.toFixed(1) + ' ' + (b.x - 120).toFixed(1) + ' ' + top.toFixed(1) + ' ' + pt(b); }
  const dx = Math.max(36, (b.x - a.x) / 2); return 'M' + pt(a) + 'C' + (a.x + dx).toFixed(1) + ' ' + a.y.toFixed(1) + ' ' + (b.x - dx).toFixed(1) + ' ' + b.y.toFixed(1) + ' ' + pt(b);
}
/* what flows along a wire: the kind of the port it leaves (or, from the world, the one it enters) */
function kindOf(need, from, to) {
  const ref = from === 'world' ? to : from, P = M.portOf(ref), b = blockOf(need.parts.find(p => p.id === P.part).block);
  return (b[P.dir] || [])[P.i] || 'word';
}
/* a packet of each kind: a signal a soft disc, a number a small square, a bit a diamond */
const PACKET = { signal: '<circle r="6"/>', word: '<rect x="-5.5" y="-5.5" width="11" height="11" rx="2"/>', bit: '<path d="M0 -7L7 0L0 7L-7 0Z"/>' };
const PORTMARK = { signal: '<circle cx="8" cy="8" r="5"/>', word: '<rect x="3" y="3" width="10" height="10" rx="2"/>', bit: '<path d="M8 1.5L14.5 8L8 14.5L1.5 8Z"/>' };

/* each block's look says its form: a circuit a solid die with pins and traces, software dashed lines of code, a liquid
   fabric a soft lattice of switches, new matter a hexagon with its kind's own pattern; the block's own kind is a glyph
   at its heart */
const GLYPH = {
  sensor: '<path d="M52 50c6-14 10 14 16 0s10 14 16 0" class="g"/>',
  learner: '<circle cx="56" cy="40" r="5" class="gf"/><circle cx="56" cy="60" r="5" class="gf"/><circle cx="84" cy="50" r="6" class="gf"/><path d="M61 40L78 49M61 60L78 51" class="g"/>',
  adder: '<path d="M70 36v28M56 50h28" class="g w"/>',
  memory: '<rect x="54" y="36" width="32" height="7" rx="2" class="gf"/><rect x="54" y="47" width="32" height="7" rx="2" class="gf"/><rect x="54" y="58" width="32" height="7" rx="2" class="gf"/>',
  counter: '<circle cx="70" cy="50" r="15" class="g"/><path d="M70 41v9l7 5" class="g"/>',
  voter: '<path d="M54 38h8l8 12M54 50h16M54 62h8l8-12M70 50h16" class="g"/><circle cx="70" cy="50" r="3.5" class="gf"/>',
  parity: '<path d="M55 51l9 9 21-21" class="g w"/>',
  core: '<rect x="54" y="34" width="32" height="32" rx="4" class="g"/><rect x="62" y="42" width="16" height="16" rx="2" class="gf"/><path d="M60 30v4M70 30v4M80 30v4M60 66v4M70 66v4M80 66v4M50 40h4M50 50h4M50 60h4M86 40h4M86 50h4M86 60h4" class="g"/>'
};
const PATTERN = {
  cim: '<path d="M38 30v40M54 30v40M86 30v40M102 30v40M30 36h80M30 64h80" class="p"/><g class="pf"><circle cx="38" cy="36" r="2.4"/><circle cx="102" cy="36" r="2.4"/><circle cx="38" cy="64" r="2.4"/><circle cx="102" cy="64" r="2.4"/></g>',
  light: '<path d="M28 30c8-6 12 6 20 0s12 6 20 0 12 6 20 0 12 6 20 0M28 70c8-6 12 6 20 0s12 6 20 0 12 6 20 0 12 6 20 0" class="p"/>',
  spikes: '<path d="M26 72h14l4-12 4 12h22l4-14 4 14h20l4-10 4 10h14" class="p"/>',
  reversible: '<path d="M34 34a40 30 0 0 1 72 0M106 66a40 30 0 0 1-72 0" class="p"/><path d="M102 26l4 8-9 1M38 74l-4-8 9-1" class="p"/>',
  living: '<path d="M30 36c10 8 14-4 22 4M110 64c-10-8-14 4-22-4M34 70c8-6 4-14 14-12M106 30c-8 6-4 14-14 12" class="p"/><g class="pf"><circle cx="30" cy="36" r="3"/><circle cx="110" cy="64" r="3"/><circle cx="34" cy="70" r="2.6"/><circle cx="106" cy="30" r="2.6"/></g>'
};
function shapeSvg(f, blockId) {
  const k = M.familyOf(f), g = GLYPH[blockId] || '';
  let s = '';
  if (k === 'circuit') {
    s = '<g class="pins">' + [28, 46, 64, 82, 100].map(x => '<path d="M' + (x + 6) + ' 6v8M' + (x + 6) + ' 86v8"/>').join('') + '</g>' +
      '<rect x="12" y="14" width="116" height="72" rx="10" class="body"/><path d="M22 26h18v10h14M118 74h-20v-8H84M22 74h12v-10" class="p"/>';
  } else if (k === 'software') {
    s = '<rect x="12" y="14" width="116" height="72" rx="12" class="body"/>' +
      '<path d="M24 28h26M30 38h18M30 48h12M24 58h22M30 68h16M98 28h18M104 72h12" class="p"/>';
  } else if (k === 'liquid') {
    let cells = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { if (c > 1 && c < 4) continue; cells += '<rect x="' + (24 + c * 16) + '" y="' + (28 + r * 16) + '" width="9" height="9" rx="2.5" class="' + ((r * 6 + c) % 3 === 0 ? 'pf' : 'p') + '"/>'; }
    s = '<rect x="10" y="14" width="120" height="72" rx="32" class="body"/>' + cells;
  } else {
    const m = M.matterIn(f);
    s = '<polygon points="8,50 34,10 106,10 132,50 106,90 34,90" class="body"/>' + (m ? PATTERN[m.id] || '' : '');
  }
  return '<svg class="mbks" viewBox="0 0 140 100" aria-hidden="true">' + s + '<g class="glyph">' + g + '</g></svg>';
}
/* the need's rules on a block, as small marks beside it: must still change (a turning arrow), must be exact (equals) */
const RULEMARK = {
  change: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.5 6A5 5 0 1 0 13 10"/><path d="M13.5 2.5v4h-4"/></svg>',
  exact: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6h10M3 10h10"/></svg>'
};

export function machines(el, ctx) {
  const id = needOf(ctx.need) ? ctx.need : NEEDS[0].id, need = needOf(id), goals = GOALS[id] || [{ id: 'least' }];
  const view = KEEP[id] || (KEEP[id] = { plan: M.startPlan(id), agent: null, front: null, guesses: false, kept: null, keepErr: '', sel: null, layer: 'flow', mode: 'look', goal: 0, changed: null });
  /* the address is where you are: a mode, a layer, or the machine as it flows */
  if (ctx.sub === 'do') view.mode = 'do'; else { view.mode = 'look'; view.layer = LAYERS.includes(ctx.sub) ? ctx.sub : 'flow'; }
  if (!view.sel) view.sel = (need.change && need.change[0]) || (need.parts.find(p => M.formsOf(p.block).length > 1) || need.parts[0]).id;
  let P = null; try { P = buildPlan(); } catch (e) { P = null; }
  const partName = p => t('machines.role.' + id + '.' + p);
  const goalKey = i => id + '.' + goals[i].id;
  /* a layer or a mode is a new place on the same machine: the address is written, not walked */
  const address = () => { const sub = view.mode === 'do' ? 'do' : view.layer !== 'flow' ? view.layer : '', h = '#/machines/' + id + (sub ? '/' + sub : '');
    if (location.hash !== h) try { history.replaceState(history.state, '', h); } catch (e) { /* the address stays */ } };

  function headHtml() {
    return '<header class="f2rhead mhead"><p class="kicker">' + esc(t('machines.ui.kicker')) + '</p><h1>' + esc(t('machines.ui.title')) + '</h1>' +
      '<div class="mmodes" role="tablist" aria-label="' + esc(t('machines.ui.modes')) + '">' + ['look', 'do'].map(m => '<button type="button" role="tab" data-mmode="' + m + '" aria-selected="' + (view.mode === m) + '">' + esc(t('machines.ui.' + m)) + '</button>').join('') + '</div>' +
      '<div class="mneeds" role="tablist" aria-label="' + esc(t('machines.ui.needs')) + '">' + NEEDS.map(n => '<button type="button" role="tab" data-mneed="' + n.id + '" aria-selected="' + (n.id === id) + '"><b>' + esc(t('machines.need.' + n.id + '.t')) + '</b><span class="small">' + esc(t('machines.need.' + n.id + '.d')) + '</span>' + ((GOALS[n.id] || []).every(g => WON[n.id + '.' + g.id]) ? '<span class="mwonmark" title="' + esc(t('machines.do.allWon')) + '">✓</span>' : '') + '</button>').join('') + '</div>' +
      '<p class="small mwhy">' + esc(t('machines.need.' + id + '.why')) + '</p></header>';
  }

  /* ---- the stage: the machine, its layer, and in Do the goal across the top ---- */
  let PLAY = null;
  const playNow = () => PLAY || (PLAY = M.play(id, view.plan, goals[view.goal]));
  function badgeOf(p, m) {
    const f = view.plan[p.id], b = blockOf(p.block), L = view.layer;
    if (L === 'made') {
      if (f === 'software') return ['', t('machines.badge.software')];
      if (b.stock) return ['', t('machines.badge.bought')];
      if (M.liquidIn(f)) return ['', t('machines.badge.configured')];
      if ((M.matterIn(f) || {}).grown) return ['bad', t('machines.badge.grown')];
      const fab = view.plan.fab || M.START_FAB, can = m.check.breaks.every(x => !(x.rule === 'fab' && x.part === p.id));
      return [can ? 'fab' : 'bad', t('fab.name.' + fab + '.t')];
    }
    if (L === 'reshape') {
      const r = M.reshapeOf(f), s = view.guesses ? r.low : r.high, must = (need.change || []).includes(p.id);
      return [must && need.every ? (s <= need.every ? 'good' : 'bad') : must && !isFinite(s) ? 'bad' : '', secs(s)];
    }
    if (L === 'claims') { const tr = truthOf(f); return tr ? ['tr s-' + tr, t('invent.status.' + tr)] : ['', t(f === 'software' ? 'machines.badge.measured' : 'machines.badge.yardstick')]; }
    if (L === 'blocks') return ['', t('machines.badge.ports', { ins: b.in.map(x => t('machines.port.' + x)).join(', '), outs: b.out.map(x => t('machines.port.' + x)).join(', ') })];
    return ['', formName(f)];
  }
  function blockHtml(L, p, m) {
    const c = L.at[p.id], f = view.plan[p.id], b = blockOf(p.block), tr = truthOf(f), doing = view.mode === 'do';
    const bad = m.check.breaks.some(x => x.part === p.id) || m.meets.misses.some(x => x.part === p.id) || (doing && playNow().extra.some(x => x.part === p.id));
    const rules = [];
    if ((need.change || []).includes(p.id)) rules.push(['change', m.meets.misses.some(x => x.part === p.id && (x.rule === 'change' || x.rule === 'keep'))]);
    if ((need.exact || []).includes(p.id) || (doing && (goals[view.goal].exact || []).includes(p.id))) rules.push(['exact', !M.exact(f)]);
    const [bc, bt] = badgeOf(p, m);
    const style = 'left:' + ((c.x - L.bw / 2) / L.VW * 100).toFixed(2) + '%;top:' + ((c.y - L.bh / 2) / L.VH * 100).toFixed(2) + '%;width:' + (L.bw / L.VW * 100).toFixed(2) + '%';
    return '<button type="button" class="mpart mbk ' + fam(f) + (bad ? ' bad' : '') + (view.sel === p.id ? ' on' : '') + (view.changed === p.id ? ' morph' : '') + '" data-mpart="' + p.id + '" data-mblock="' + b.id + '" style="' + style + '" aria-pressed="' + (view.sel === p.id) + '" aria-label="' + esc(partName(p.id) + ': ' + formName(f)) + '">' +
      shapeSvg(f, b.id) + (tr ? '<span class="mbkt" title="' + esc(t('invent.status.' + tr)) + '">' + TRUTH[tr] + '</span>' : '') +
      (rules.length ? '<span class="mbkr">' + rules.map(([r, miss]) => '<span class="mrule r-' + r + (miss ? ' miss' : '') + '" title="' + esc(t('machines.ui.must.' + r)) + '">' + RULEMARK[r] + '</span>').join('') + '</span>' : '') +
      '<span class="mbkl"><b>' + esc(partName(p.id)) + '</b><span class="' + esc(bc) + '">' + esc(bt) + '</span></span></button>';
  }
  function diagramHtml(m) {
    const L = layout(need, narrow()), moving = !still();
    let w = '';
    /* software runs on the core: a dotted line from each part run as software to the core it runs on, under their names */
    const core = need.parts.find(p => blockOf(p.block).runs);
    if (core) need.parts.filter(p => view.plan[p.id] === 'software').forEach(p => {
      const a = L.at[p.id], b = L.at[core.id], d = L.vertical ? 'M' + (a.x + L.bw / 2).toFixed(1) + ' ' + a.y.toFixed(1) + 'C' + (L.VW - 6) + ' ' + a.y.toFixed(1) + ' ' + (L.VW - 6) + ' ' + b.y.toFixed(1) + ' ' + (b.x + L.bw / 2).toFixed(1) + ' ' + b.y.toFixed(1)
        : 'M' + a.x.toFixed(1) + ' ' + (a.y + L.bh / 2 + 62).toFixed(1) + 'C' + a.x.toFixed(1) + ' ' + (a.y + L.bh / 2 + 112).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + (b.y + L.bh / 2 + 112).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + (b.y + L.bh / 2 + 62).toFixed(1);
      w += '<path d="' + d + '" class="mrun"/>';
    });
    need.wires.forEach(([from, to], i) => {
      const d = wirePath(L, need, from, to), k = kindOf(need, from, to), a = portAt(L, need, from), b = portAt(L, need, to);
      w += '<path d="' + d + '" class="mw k-' + k + '"/><g class="mp k-' + k + '" transform="translate(' + b.x.toFixed(1) + ',' + b.y.toFixed(1) + ')">' + PACKET[k] + '</g>';
      if (from !== 'world') w += '<g class="mp k-' + k + '" transform="translate(' + a.x.toFixed(1) + ',' + a.y.toFixed(1) + ')">' + PACKET[k] + '</g>';
      if (moving && view.layer === 'flow') for (let j = 0; j < 2; j++) w += '<g class="pk k-' + k + '">' + PACKET[k] + '<animateMotion dur="2.8s" repeatCount="indefinite" begin="-' + ((j * 1.4 + i * 0.37) % 2.8).toFixed(2) + 's" path="' + d + '"/></g>';
    });
    const W = L.world, ws = 'left:' + ((W.x - 30) / L.VW * 100).toFixed(2) + '%;top:' + ((W.y - 30) / L.VH * 100).toFixed(2) + '%;width:' + (60 / L.VW * 100).toFixed(2) + '%';
    return '<div class="mpic' + (L.vertical ? ' v' : '') + ' l-' + view.layer + '" style="--ar:' + L.VW + '/' + L.VH + '">' +
      '<svg class="mwires" viewBox="0 0 ' + L.VW + ' ' + L.VH + '" aria-hidden="true">' + w + '</svg>' +
      '<span class="mworld" style="' + ws + '"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="8"/><path d="M18 18a17 17 0 0 0 0 24M42 18a17 17 0 0 1 0 24M11 11a27 27 0 0 0 0 38M49 11a27 27 0 0 1 0 38"/></svg><span>' + esc(t('machines.ui.world')) + '</span></span>' +
      need.parts.map(p => blockHtml(L, p, m)).join('') + '</div>';
  }
  /* one line under the picture: what the layer says of the whole machine */
  function ribbonHtml(m) {
    const s = m.score, L = view.layer;
    if (L === 'made' || L === 'tries') {
      const un = m.check.breaks.some(x => x.rule === 'fab'), lo = un ? Infinity : s.daysLow, hi = un ? Infinity : s.daysHigh;
      return esc(t('machines.rib.try', { days: days(lo, hi) })) + (s.tries && !un ? ' · ' + esc(t('machines.ui.tries', { n: fmtNum(Math.round(s.tries)) })) : '');
    }
    if (L === 'reshape') return esc(need.every ? t('liquid.ui.every', { t: secs(need.every) }) + ' · ' + t('machines.rib.every') : t('machines.rib.reshape'));
    if (L === 'claims') return STATUS.map(x => '<span class="mkey">' + TRUTH[x] + esc(t('invent.status.' + x)) + '</span>').join('');
    if (L === 'blocks') return esc(t('machines.rib.blocks'));
    const ks = [...new Set(need.wires.map(([a, b]) => kindOf(need, a, b)))];
    return ks.map(k => '<span class="mkey k-' + k + '"><svg viewBox="0 0 16 16" aria-hidden="true">' + PORTMARK[k] + '</svg>' + esc(t('machines.port.' + k)) + '</span>').join('') +
      (need.parts.some(p => view.plan[p.id] === 'software') ? '<span class="mkey krun"><svg viewBox="0 0 22 16" aria-hidden="true"><path d="M2 8h18"/></svg>' + esc(t('machines.ui.runsOn')) + '</span>' : '');
  }
  function layersHtml() {
    return '<div class="mlayers" role="group" aria-label="' + esc(t('machines.layer.aria')) + '">' + LAYERS.map(k => '<button type="button" data-mlayer="' + k + '" aria-pressed="' + (view.layer === k) + '"><svg viewBox="0 0 18 18" aria-hidden="true">' + LAYERMARK[k] + '</svg>' + esc(t('machines.layer.' + k)) + '</button>').join('') + '</div>';
  }
  function goalBarHtml() {
    const G = playNow(), g = goals[view.goal], s = G.m.score, rules = G.m.check.breaks.length + G.m.meets.misses.length + G.extra.filter(x => x.rule !== 'days').length;
    const meter = (k, v, cls) => '<div class="mgm' + (cls ? ' ' + cls : '') + '"><span>' + esc(t('machines.do.m.' + k)) + '</span><b>' + esc(v) + '</b></div>';
    const daysNow = G.m.check.breaks.some(x => x.rule === 'fab') ? t('machines.ui.never') : days(s.daysHigh, s.daysHigh);
    return '<div class="mgoal" data-f2="goal">' + meter('energy', times(s.energy), G.won ? 'good' : G.ok ? '' : 'bad') + meter('best', times(G.best)) +
      meter('rules', rules ? t('machines.do.rulesN', { n: rules }) : t('machines.do.rulesOk'), rules ? 'bad' : 'good') +
      (g.days != null ? meter('days', daysNow, G.extra.some(x => x.rule === 'days') ? 'bad' : 'good') : '') + '</div>';
  }
  function stageHtml(m) {
    const doing = view.mode === 'do', G = doing ? playNow() : null;
    return '<section class="mstage' + (doing ? ' doing' : '') + (G && G.won ? ' mwin' : '') + '" data-f2="instrument" aria-label="' + esc(t('machines.ui.machine') + ' · ' + t('machines.need.' + id + '.t')) + '">' +
      '<p class="kicker mcap">' + esc(t('machines.ui.machine')) + ' · <b>' + esc(t('machines.need.' + id + '.t')) + '</b></p>' +
      (doing ? goalBarHtml() : '') + diagramHtml(m) +
      (G && G.won ? '<p class="mwon" role="status"><b>' + esc(t('machines.do.won')) + '</b></p>' : '') +
      (doing ? '' : '<p class="small mrib">' + ribbonHtml(m) + '</p>' + layersHtml()) + '</section>';
  }

  /* ---- beside the picture: the parts and their forms, what it scores, the agent's front, the layer's words ---- */
  function partHtml(p, m) {
    const b = blockOf(p.block), f = view.plan[p.id], forms = M.formsOf(b.id), fm = M.familyOf(f), kinds = kindsOf(fm, b.id);
    const bad = m.check.breaks.some(x => x.part === p.id) || m.meets.misses.some(x => x.part === p.id);
    const famBtn = k => { const ks = kindsOf(k, b.id), multi = k === 'matter' || k === 'liquid', on = fm === k, has = multi ? ks.length > 0 : forms.includes(k), to = multi ? (on ? f : k + ':' + (ks[0] || {}).id) : k;
      return '<button type="button" class="f-' + k + '" data-mform="' + p.id + ':' + to + '" aria-pressed="' + on + '"' + (has ? '' : ' disabled') + ' title="' + esc(t('machines.form.' + k)) + '">' + MARK[k] + '<span class="sr">' + esc(t('machines.form.' + k)) + '</span></button>'; };
    const rules = [(need.change || []).includes(p.id) ? t('machines.ui.must.change') : '', (need.exact || []).includes(p.id) ? t('machines.ui.must.exact') : ''].filter(Boolean);
    let h = '<div class="mrow' + (bad ? ' bad' : '') + (view.sel === p.id ? ' on' : '') + '" data-mrow="' + p.id + '"><div class="mtile ' + fam(f) + '">' + markOf(f) + '<span><b>' + esc(partName(p.id)) + '</b><span class="small muted">' + esc(t('machines.block.' + b.id + '.t')) + ' · ' + esc(formName(f)) + '</span>' +
      (rules.length ? '<span class="small mmust">' + esc(rules.join(' · ')) + '</span>' : '') + '</span></div>' +
      '<div class="mforms" role="group" aria-label="' + esc(partName(p.id)) + '">' + FORMS.map(famBtn).join('') + '</div>';
    /* the core runs: go into it, at work on this machine's job (#321, src/v2/labs/rv.js) */
    if (b.runs) h += '<a class="mcoreway" href="#/do/rvrun/' + id + '"><span aria-hidden="true">↓</span> ' + esc(t('machines.ui.intoCore')) + '</a>';
    if (kinds.length > 1) h += '<div class="mkinds k-' + fm + '" role="group" aria-label="' + esc(t('machines.form.' + fm)) + '">' + kinds.map(k => '<button type="button" data-mform="' + p.id + ':' + fm + ':' + k.id + '" aria-pressed="' + (f === fm + ':' + k.id) + '">' + esc(kindName(fm, k.id)) + '</button>').join('') + '</div>';
    if (view.sel === p.id && WAYS[b.id]) h += '<a class="link mway" href="' + esc(WAYS[b.id]) + '" data-mway="' + b.id + '">' + esc(t('machines.way.' + b.id)) + '</a>';
    return h + '</div>';
  }
  function partsHtml(m) {
    return '<section class="mparts"><p class="kicker">' + esc(t('machines.ui.parts')) + '</p><p class="small muted mtap">' + esc(t(narrow() ? 'machines.ui.tap' : 'machines.ui.partsLead')) + '</p>' +
      need.parts.map(p => partHtml(p, m)).join('') + '<button type="button" class="link small" data-mreset>' + esc(t('machines.ui.reset')) + '</button></section>';
  }
  /* a machine its fab cannot make has no days a try */
  const unmade = m => m.check.breaks.some(x => x.rule === 'fab');
  function scoreHtml(m) {
    const s = Object.assign({}, m.score), list = [];
    if (unmade(m)) Object.assign(s, { daysLow: Infinity, daysHigh: Infinity, tries: 0 });
    m.check.breaks.forEach(x => list.push('<li class="bad">' + esc(t('machines.rule.' + x.rule, { part: partName(x.part) })) + '</li>'));
    m.meets.misses.forEach(x => list.push('<li class="bad">' + esc(t('machines.miss.' + x.rule, { part: partName(x.part) })) + '</li>'));
    if (view.mode === 'do') playNow().extra.forEach(x => list.push('<li class="bad">' + esc(t('machines.do.miss.' + x.rule, { part: x.part ? partName(x.part) : '' })) + '</li>'));
    if (m.check.ok) list.unshift('<li class="good">' + esc(t('machines.ui.grammarOk')) + '</li>');
    if (m.check.ok && m.meets.ok) list.push('<li class="good">' + esc(t('machines.ui.meetsOk')) + '</li>');
    return '<section class="mscorebox"><div class="mscore"><div class="mread"><b>' + esc(span(s)) + '</b><span class="small">' + esc(t('machines.ui.energy')) + '</span></div>' +
      '<div class="mread"><b>' + s.changes + ' / ' + s.parts + '</b><span class="small">' + esc(t('machines.ui.changes')) + '</span></div>' +
      '<div class="mread"><b>' + s.exact + ' / ' + s.parts + '</b><span class="small">' + esc(t('machines.ui.exact')) + '</span></div>' +
      '<div class="mread"><b>' + esc(days(s.daysLow, s.daysHigh)) + '</b><span class="small">' + esc(t('machines.ui.days')) + (s.tries ? ' · ' + esc(t('machines.ui.tries', { n: fmtNum(Math.round(s.tries)) })) : '') + '</span></div></div><ul class="mchecks">' + list.join('') + '</ul></section>';
  }
  /* the front: every machine the agent found that no other beats, as a point (less energy to the left, more parts that
     can still change higher up, filled when every part is exact); today's best compromises the line through them; the
     corner up and to the left where nobody has a machine yet; yours the warm dot. The lab's one front drawing */
  function frontHtml(m) {
    const all = view.front || [], N = need.parts.length, W = 360, H = 214, box = [40, 12, 350, 182];
    const es = all.map(p => p.score.energy).concat([m.score.energy]).filter(e => isFinite(e) && e > 0);
    const lo = Math.min(...es) / 1.8, hi = Math.max(...es) * 1.8, lg = Math.log10;
    const px = e => box[0] + (lg(Math.max(lo, Math.min(hi, e))) - lg(lo)) / (lg(hi) - lg(lo)) * (box[2] - box[0]), py = c => box[3] - c / N * (box[3] - box[1] - 14);
    const stair = [];
    if (all.length) {
      const pts = all.map(p => [p.score.energy, p.score.changes]).sort((a, b) => a[0] - b[0] || b[1] - a[1]);
      let top = -1; pts.forEach(([e, c]) => { if (c <= top) return; if (stair.length) stair.push([px(e), py(top)]); stair.push([px(e), py(c)]); top = c; });
      stair.push([box[2], stair[stair.length - 1][1]]);
    }
    /* the scale's marks: every power of ten in sight, and the counts of parts that can change */
    let extra = '';
    for (let k = Math.ceil(lg(lo)); k <= Math.floor(lg(hi)); k++) { const x = px(Math.pow(10, k)); extra += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + box[1] + '" y2="' + box[3] + '" class="mfgrid"/><text x="' + x.toFixed(1) + '" y="' + (box[3] + 17) + '" class="mftick" text-anchor="middle">' + esc(times(Math.pow(10, k))) + '</text>'; }
    for (let c = 0; c <= N; c++) extra += '<text x="' + (box[0] - 9) + '" y="' + (py(c) + 4).toFixed(1) + '" class="mftick" text-anchor="end">' + c + '</text>';
    const dots = all.map((p, i) => ({ x: px(p.score.energy), y: py(p.score.changes), r: i < 4 ? 7 : 5, cls: 'mfo' + (p.score.exact === N ? ' full' : '') + (i < 4 ? ' pick' : ''),
      attrs: i < 4 ? 'data-muse="' + i + '"' : '', title: span(p.score) + ' · ' + t('machines.ui.pickKeeps', { changes: p.score.changes, exact: p.score.exact, parts: N }) }));
    dots.push({ x: px(m.score.energy), y: py(m.score.changes), r: 8, cls: 'lpdot mme' + (m.ok ? '' : ' broken'), title: t('machines.front.yours') });
    return '<div class="mfront">' + frontFigure({ W, H, box, corner: 'tl', cls: 'mfrontfig', aria: t('machines.front.aria'), lines: stair.length ? [{ pts: stair, cls: 'lpline0' }] : [], extra, dots,
      key: [['', t('machines.front.x')], ['', t('machines.front.y')]].concat(all.length ? [['k0', t('machines.front.today')], ['ko', t('machines.front.offers')], ['kn', t('machines.front.nobody')]] : [], [['kd', t(m.ok ? 'machines.front.dot' : 'machines.front.broken')]]) }) +
      (all.length ? '' : '<p class="small muted mfwait">' + esc(t('machines.front.wait')) + '</p>') + '</div>';
  }
  function agentHtml(m) {
    const A = view.agent;
    let h = '<section class="magent"><p class="kicker">' + esc(t('machines.ui.agentK')) + '</p><p class="small muted">' + esc(t('machines.ui.agentLead')) + '</p>' + frontHtml(m) +
      '<label class="small mguess"><input type="checkbox" data-mguess' + (view.guesses ? ' checked' : '') + '> ' + esc(t('invent.ui.guesses')) + '</label>';
    if (!A) return h + '<button type="button" class="btn primary" data-magent>' + esc(t('machines.ui.agent')) + '</button></section>';
    h += '<p class="small">' + esc(t('machines.ui.tried', { tried: A.tried, valid: A.valid, front: A.front })) + '</p><div class="mpicks">';
    A.picks.forEach((p, i) => {
      const on = need.parts.every(q => p.plan[q.id] === view.plan[q.id]) && (!p.score.fab || p.plan.fab === (view.plan.fab || M.START_FAB));
      h += '<div class="mpick' + (on ? ' on' : '') + '"><div class="mpickf">' + need.parts.map(q => '<span class="' + fam(p.plan[q.id]) + '" title="' + esc(partName(q.id) + ' · ' + formName(p.plan[q.id])) + '">' + markOf(p.plan[q.id]) + '</span>').join('') + '</div>' +
        '<p class="small"><b>' + esc(span(p.score)) + '</b> · ' + esc(t('machines.ui.pickKeeps', { changes: p.score.changes, exact: p.score.exact, parts: p.score.parts })) + '</p>' +
        '<p class="small">' + (p.score.fab ? FABMARK[p.score.fab] + ' ' + esc(t('fab.name.' + p.score.fab + '.t')) + ' · ' : '') + esc(days(p.score.daysLow, p.score.daysHigh)) + ' · ' + esc(t('machines.ui.daysShort')) + '</p>' +
        '<p class="small muted">' + esc(need.parts.filter(q => p.plan[q.id] !== 'circuit').map(q => partName(q.id) + ': ' + formName(p.plan[q.id])).join(' · ') || t('machines.ui.allCircuit')) + '</p>' +
        (on ? '<p class="small mon">' + esc(t('machines.ui.inUse')) + '</p>' : '<button type="button" class="btn" data-muse="' + i + '">' + esc(t('machines.ui.use')) + '</button>') + '</div>';
    });
    return h + '</div><p class="small mdecide">' + esc(t('machines.ui.decide')) + '</p></section>';
  }

  /* ---- the layers' words, each opened from the machine ---- */
  /* fab on a desk: where the made parts are made, and how long a try takes there */
  function fabHtml() {
    const cur = view.plan.fab || M.START_FAB, F = fabOf(cur), none = !M.made(need, view.plan).length;
    const grown = need.parts.some(p => (M.matterIn(view.plan[p.id]) || {}).grown);
    let h = '<section class="mfab"><p class="kicker">' + esc(t('fab.ui.kicker')) + '</p><p class="small muted">' + esc(t('fab.ui.lead')) + '</p><div class="mfabs" role="group" aria-label="' + esc(t('fab.ui.kicker')) + '">' +
      FABS.map(f => {
        const d = M.daysOf(f.id), dc = f.claims.find(c => c.kind === 'days'), su = M.setupOf(f.id);
        return '<button type="button" data-mfab="' + f.id + '" aria-pressed="' + (f.id === cur) + '">' + FABMARK[f.id] + '<b>' + esc(t('fab.name.' + f.id + '.t')) + '</b>' +
          '<span class="small">' + mst(dc.status) + ' ' + esc(isFinite(d.high) ? t('fab.ui.days', { low: fmtNum(d.low), high: fmtNum(d.high) }) : t('fab.ui.guessDays', { low: fmtNum(d.low) + '–' + fmtNum(dc.value[1]) })) + '</span>' +
          (su ? '<span class="small muted">' + esc(t('fab.ui.setup', { x: su.value.map(frac).join('–') })) + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    if (none) h += '<p class="small mfabnone">' + esc(t('fab.ui.none')) + '</p>';
    if (grown) h += '<p class="small mfabnone">' + esc(t('fab.ui.grown')) + '</p>';
    h += '<div class="mclaims"><p><b>' + esc(t('fab.name.' + cur + '.t')) + '</b> <span class="small muted">' + esc(t('fab.name.' + cur + '.d')) + ' ' + esc(t('fab.ui.makes', { list: F.makes.map(formName).join(', ') })) + '</span></p><ul>' + F.claims.map(cl => {
      const f = cl.fact && ctx.FACT && ctx.FACT[cl.fact], src = f && f.url ? ' <span class="small"><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a></span>' : '';
      return '<li class="k-note">' + mst(cl.status) + '<span>' + esc(t('fab.claim.' + cl.id)) + src + '</span></li>';
    }).join('') + '</ul>' + (cur !== 'giant' ? '<p class="small muted">' + esc(t('fab.ui.note')) + '</p>' : '') + '</div></section>';
    return h;
  }
  /* the places to make parts, small, beside a challenge */
  function fabsSmall() {
    const cur = view.plan.fab || M.START_FAB;
    return '<section class="mfabsm"><p class="kicker">' + esc(t('fab.ui.kicker')) + '</p><div class="mfabs" role="group" aria-label="' + esc(t('fab.ui.kicker')) + '">' + FABS.map(f => { const d = M.daysOf(f.id), dc = f.claims.find(c => c.kind === 'days');
      return '<button type="button" data-mfab="' + f.id + '" aria-pressed="' + (f.id === cur) + '">' + FABMARK[f.id] + '<b>' + esc(t('fab.name.' + f.id + '.t')) + '</b><span class="small muted">' + esc(isFinite(d.high) ? t('fab.ui.days', { low: fmtNum(d.low), high: fmtNum(d.high) }) : t('fab.ui.guessDays', { low: fmtNum(d.low) + '–' + fmtNum(dc.value[1]) })) + '</span></button>'; }).join('') + '</div></section>';
  }
  /* liquid hardware: how fast each part can reshape against what it costs, the line a changing job draws, and the
     claims behind every fabric in use */
  function liquidMap() {
    const W = 600, H = 210, L = 46, R = 12, T = 14, B = 34, G = view.guesses;
    const X = s => (!isFinite(s) ? L + 10 : L + 40 + (W - L - R - 50) * (8 - Math.log10(s)) / 17), Y = e => T + (H - T - B) * (1 - Math.log10(Math.max(1, Math.min(1000, e))) / 3);
    let g = '';
    [1, 10, 100, 1000].forEach(e => { g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(e).toFixed(1) + '" y2="' + Y(e).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (Y(e) + 4).toFixed(1) + '" text-anchor="end">' + esc(times(e)) + '</text>'; });
    [[Infinity, 'never'], [1e7, 'months'], [1e5, 'days'], [1, 's'], [1e-3, 'ms'], [1e-6, 'us'], [1e-9, 'ns']].forEach(([s, k]) => { g += '<text class="tick tk-' + k + '" x="' + X(s).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + esc(t('liquid.tick.' + k)) + '</text>'; });
    const cx = X(1e-7), cy = Y(4);
    g += '<rect class="lcorner" x="' + cx.toFixed(1) + '" y="' + cy.toFixed(1) + '" width="' + (W - R - cx).toFixed(1) + '" height="' + (Y(1) - cy + 6).toFixed(1) + '" rx="8"/>';
    if (need.every) { const ex = X(need.every); g += '<line class="every" x1="' + ex.toFixed(1) + '" x2="' + ex.toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '"/><text class="evt" x="' + (ex - 6).toFixed(1) + '" y="' + (T + 10) + '" text-anchor="end">' + esc(t('liquid.ui.every', { t: secs(need.every) })) + '</text>'; }
    /* the reference points: a circuit, an FPGA rewired, software */
    const fp = liquidOf(FALLBACK);
    g += '<circle class="ref" cx="' + X(Infinity) + '" cy="' + Y(1) + '" r="5"/><line class="refl" x1="' + X(fp.reshape.value[1]).toFixed(1) + '" x2="' + X(fp.reshape.value[0]).toFixed(1) + '" y1="' + Y(fp.energy.value).toFixed(1) + '" y2="' + Y(fp.energy.value).toFixed(1) + '"/><circle class="ref" cx="' + X(1e-6).toFixed(1) + '" cy="' + Y(500).toFixed(1) + '" r="5"/>';
    /* this machine's parts, one dot per form, every part with that form named beside it */
    const at = {};
    need.parts.forEach(p => { const f = view.plan[p.id], r = M.reshapeOf(f), c = M.costOf(f, need), s = G ? r.low : r.high, e = G ? c.low : c.high, k = f + '|' + s + '|' + e;
      (at[k] = at[k] || { f, s, e, names: [] }).names.push(partName(p.id)); });
    Object.values(at).forEach((a, i) => { const x = X(a.s), y = Y(a.e);
      g += '<g class="pt ' + fam(a.f) + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7"/><text x="' + (x + (x > W - 150 ? -11 : 11)).toFixed(1) + '" y="' + (y - 9 - (i % 2) * 12).toFixed(1) + '" text-anchor="' + (x > W - 150 ? 'end' : 'start') + '">' + esc(a.names.join(', ')) + '</text></g>'; });
    return '<svg class="lmap" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('liquid.ui.mapAria')) + '">' + g + '</svg>';
  }
  function liquidHtml() {
    const parts = need.parts.filter(p => M.liquidIn(view.plan[p.id]));
    let h = '<section class="mliquid"><p class="kicker">' + esc(t('liquid.ui.kicker')) + '</p><p class="small muted">' + esc(t('liquid.ui.lead')) + '</p>' +
      '<div class="lmapbox"><span class="small muted">' + esc(t('liquid.ui.axisY')) + '</span>' + liquidMap() + '<span class="small muted lax">' + esc(t('liquid.ui.axisX')) + '</span><p class="small lkey"><span class="lk lk-corner"></span> ' + esc(t('liquid.ui.corner')) + (need.every ? ' · <span class="lk lk-every"></span> ' + esc(t('liquid.ui.everyKey')) : '') + ' · <span class="lk lk-ref"></span> ' + esc(t('liquid.ui.refs')) + '</p></div>';
    const src = fact => { const f = fact && ctx.FACT && ctx.FACT[fact]; return f && f.url ? ' <span class="small"><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a></span>' : ''; };
    const li = (status, words, fact) => '<li class="k-note">' + mst(status) + '<span>' + esc(words) + src(fact) + '</span></li>';
    if (!parts.length) h += '<p class="small">' + esc(t('liquid.ui.none')) + '</p>';
    const shown = new Set();
    parts.forEach(p => { const L = M.liquidIn(view.plan[p.id]); if (shown.has(L.id)) return; shown.add(L.id);
      const names = parts.filter(q => M.liquidIn(view.plan[q.id]).id === L.id).map(q => partName(q.id)).join(', '), r = L.reshape.value;
      h += '<div class="mclaims"><p><b>' + esc(names) + ' · ' + esc(t('liquid.kind.' + L.id + '.t')) + '</b> <span class="small muted">' + esc(t('liquid.kind.' + L.id + '.d')) + '</span></p><ul>' +
        li(L.energy.status, t('liquid.ui.energy', { x: times(L.energy.value) }), L.energy.fact) +
        li(L.reshape.status, t('liquid.ui.reshape', { range: r[0] === r[1] ? secs(r[0]) : secs(r[0]) + ' – ' + secs(r[1]) }), L.reshape.fact) +
        L.notes.map(n => li(n.status, t('liquid.note.' + n.id), n.fact)).join('') + '</ul>' +
        (L.energy.status === 'guess' || L.reshape.status === 'guess' ? '<p class="small muted">' + esc(t('liquid.ui.fallback')) + '</p>' : '') + '</div>'; });
    const ev = ctx.FACT && ctx.FACT['thompson-evolved'];
    h += '<p class="small levolve">' + esc(t('liquid.ui.evolve')) + (ev && ev.url ? ' <a href="' + esc(ev.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a>' : '') + ' <a href="#/do/evolve">' + esc(t('liquid.ui.evolveGo')) + '</a></p>';
    return h + '</section>';
  }
  /* beyond today's chip: the claims behind every part made of new matter */
  function inventHtml(m) {
    const parts = need.parts.filter(p => M.matterIn(view.plan[p.id]));
    let h = '<section class="minvent"><p class="kicker">' + esc(t('invent.ui.kicker')) + '</p><p class="small muted">' + esc(t('invent.ui.lead')) + '</p>';
    if (!parts.length) return h + '<p class="small">' + esc(t('invent.ui.none')) + '</p></section>';
    parts.forEach(p => {
      const k = M.matterIn(view.plan[p.id]), c = M.costOf(view.plan[p.id], need);
      h += '<div class="mclaims"><p><b>' + esc(partName(p.id)) + ' · ' + esc(t('invent.matter.' + k.id + '.t')) + '</b> <span class="small muted">' + esc(t('invent.matter.' + k.id + '.d')) + '</span></p>' +
        '<p class="small mrange">' + esc(t('invent.ui.range', { low: times(c.low), high: times(c.high) })) + '</p><ul>' + k.claims.map(cl => {
          const f = cl.fact && ctx.FACT && ctx.FACT[cl.fact], src = f && f.url ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a>' : cl.engine ? '<a href="' + esc(REPO + cl.engine) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.engine')) + '</a>' : '';
          return '<li class="k-' + cl.kind + '">' + mst(cl.status) + '<span>' + esc(t('invent.claim.' + cl.id)) + (src ? ' <span class="small">' + src + '</span>' : '') + '</span></li>';
        }).join('') + '</ul>' + (m.score.walls.includes(p.id) ? '<p class="small mwall">' + esc(t('invent.wall.floor')) + '</p>' : '') + '</div>';
    });
    return h + '</section>';
  }
  /* Moore's law for ideas: the attempts kept for this need, the best so far, and where yours would land */
  const LAWS = [['moore', 'ideas-harder'], ['wright', 'wright-law'], ['lab', null]];
  const LAWMARK = {
    moore: '<svg class="lmark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    wright: '<svg class="lmark" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="15" width="16" height="4" rx="1"/><rect x="6" y="10" width="12" height="4" rx="1"/><rect x="8" y="5" width="8" height="4" rx="1"/></svg>',
    lab: '<svg class="lmark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="15" cy="15" r="2"/><circle cx="20" cy="17" r="2"/></svg>'
  };
  function curveSvg(C, mine) {
    const pts = C.points, N = Math.max(pts.length + (mine ? 1 : 0), 4), W = 640, H = 230, L = 46, R = 14, T = 12, B = 30;
    const vals = pts.map(p => p.energy).concat(mine ? [mine.energy] : []).filter(v => isFinite(v) && v > 0);
    if (!vals.length) vals.push(1);
    const lo = Math.pow(10, Math.floor(Math.log10(Math.min(...vals)))), hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...vals)) + 1e-9));
    const top = hi === lo ? hi * 10 : hi;
    const X = n => L + (W - L - R) * Math.log2(n) / Math.log2(N), Y = v => T + (H - T - B) * (1 - (Math.log10(v) - Math.log10(lo)) / (Math.log10(top) - Math.log10(lo)));
    let g = '';
    for (let e = Math.log10(lo); e <= Math.log10(top) + 1e-9; e++) g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(Math.pow(10, e)).toFixed(1) + '" y2="' + Y(Math.pow(10, e)).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (Y(Math.pow(10, e)) + 4).toFixed(1) + '" text-anchor="end">' + esc(times(Math.pow(10, e))) + '</text>';
    for (let n = 1; n <= N; n *= 2) g += '<line class="grid" y1="' + T + '" y2="' + (H - B) + '" x1="' + X(n).toFixed(1) + '" x2="' + X(n).toFixed(1) + '"/><text class="tick" x="' + X(n).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + n + '</text>';
    let path = '';
    pts.forEach((p, i) => { path += (i ? 'H' + X(p.n).toFixed(1) + 'V' : 'M' + X(p.n).toFixed(1) + ',') + Y(p.best).toFixed(1); });
    if (pts.length) path += 'H' + X(N).toFixed(1);
    const dots = pts.map(p => '<circle class="dot c-' + esc(p.made) + (p.draft ? ' mine' : '') + '" cx="' + X(p.n).toFixed(1) + '" cy="' + Y(p.energy).toFixed(1) + '" r="5"><title>' + esc(p.by + ' · ' + times(p.energy)) + '</title></circle>').join('');
    const you = mine && isFinite(mine.energy) ? '<circle class="dot you" cx="' + X(pts.length + 1).toFixed(1) + '" cy="' + Y(mine.energy).toFixed(1) + '" r="6"><title>' + esc(t('curve.ui.yours') + ' · ' + times(mine.energy)) + '</title></circle>' : '';
    return '<svg class="mcurve" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('curve.ui.kicker')) + '">' + g + (path ? '<path class="best" d="' + path + '"/>' : '') + dots + you + '</svg>';
  }
  function curveHtml(m) {
    const W = ctx.world ? ctx.world() : null, C = W ? labCurve(W, id) : { points: [], slope: null, perDoubling: null }, n = C.points.length;
    const mine = m.ok ? { energy: m.score.high } : null;
    let h = '<section class="mlab"><p class="kicker">' + esc(t('curve.ui.kicker')) + '</p><h2>' + esc(t('curve.ui.title')) + '</h2><p class="small muted">' + esc(t('curve.ui.lead')) + '</p>' +
      '<div class="mcurvebox"><div class="mplot"><span class="small muted maxis ay">' + esc(t('curve.ui.axisY')) + '</span>' + curveSvg(C, mine) + '<span class="small muted maxis ax">' + esc(t('curve.ui.axisX')) + '</span>' +
      '<p class="small mlegend"><span class="dot you"></span> ' + esc(t('curve.ui.yours')) + '</p></div><div class="mlawbox">';
    h += '<p class="mlaw"><b>' + esc(!n ? t('curve.ui.none') : C.slope == null ? t('curve.ui.noLaw', { n }) : t('curve.ui.law', { x: fmtNum(Math.pow(2, C.slope), { maximumSignificantDigits: 2 }) + '×' })) + '</b></p>';
    const tries = m.score.tries;
    if (!m.ok) h += '<p class="small">' + esc(t('curve.ui.cannot')) + '</p>';
    else if (!tries) h += '<p class="small">' + esc(t('curve.ui.paceNever')) + '</p>';
    else {
      const yrs = Math.max(n, 1) / tries, time = yrs * 365 < 60 ? t('curve.time.days', { n: fmtNum(Math.max(1, Math.round(yrs * 365))) }) : yrs < 2 ? t('curve.time.months', { n: fmtNum(Math.round(yrs * 12)) }) : t('curve.time.years', { n: fmtNum(Math.round(yrs)) });
      h += '<p class="small">' + esc(t('curve.ui.pace', { tries: fmtNum(Math.round(tries)), n: Math.max(n, 1), time })) + '</p>';
    }
    h += '<p class="small muted">' + esc(t('curve.ui.many')) + '</p></div></div>';
    h += '<p class="kicker">' + esc(t('curve.ui.laws')) + '</p><div class="mlaws">' + LAWS.map(([k, fact]) => { const f = fact && ctx.FACT && ctx.FACT[fact];
      return '<div class="mlaw1 l-' + k + '">' + LAWMARK[k] + '<p class="small">' + esc(t('curve.law.' + k)) + (f && f.url ? ' <a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a>' : '') + '</p></div>'; }).join('') + '</div>';
    if (ctx.keep) {
      h += '<div class="mkeep"><p class="small muted">' + esc(t('curve.ui.keepLead')) + '</p>' + ctx.signHtml() + (view.keepErr ? '<p class="small err" role="alert">' + esc(view.keepErr) + '</p>' : '') +
        '<div class="acts"><button type="button" class="btn primary" data-mkeep' + (m.ok ? '' : ' disabled') + '>' + esc(t('curve.ui.keep')) + '</button>' + (m.ok ? '' : '<span class="small muted">' + esc(t('curve.ui.cannot')) + '</span>') + '</div>' +
        (view.kept ? ctx.slip(view.kept) : '') + '</div>';
    }
    return h + '</section>';
  }
  function blocksHtml() {
    return '<section class="mblocks"><p class="kicker">' + esc(t('machines.ui.blocks')) + '</p><p class="small muted">' + esc(t('machines.ui.blocksLead')) + '</p><div class="grid">' + BLOCKS.map(b => {
      const c = M.checkOf(b.id, P), ports = k => b[k].map(x => t('machines.port.' + x)).join(', '), kinds = mattersFor(b.id);
      return '<div class="chcard mblock"><span class="st">' + b.forms.concat(kinds.length ? ['matter'] : [], liquidsFor(b.id).length ? ['liquid'] : []).map(f => '<span class="f-' + f + '">' + MARK[f] + '</span>').join('') + '</span><span><b>' + esc(t('machines.block.' + b.id + '.t')) + '</b><span class="small">' + esc(t('machines.block.' + b.id + '.d')) + '</span>' +
        '<span class="small muted">' + esc(t('machines.ui.ports', { ins: ports('in'), outs: ports('out') })) + '</span>' +
        (kinds.length ? '<span class="small muted">' + esc(t('invent.ui.matters', { list: kinds.map(k => t('invent.matter.' + k.id + '.t')).join(', ') })) + '</span>' : '') +
        '<span class="small muted">' + esc(t('machines.check.' + c.state)) + '</span></span></div>';
    }).join('') + '</div></section>';
  }
  function layerHtml(m) {
    const L = view.layer;
    const body = L === 'made' ? fabHtml() : L === 'reshape' ? liquidHtml() : L === 'claims' ? inventHtml(m) : L === 'tries' ? curveHtml(m) : L === 'blocks' ? blocksHtml() : '';
    return body ? '<div class="mlayer" data-mlayerbox="' + L + '">' + body + '</div>' : '';
  }

  /* ---- Do: the need's challenge, played on the picture ---- */
  function doHtml() {
    const G = playNow(), g = goals[view.goal];
    return '<section class="mdo"><p class="kicker">' + esc(t('machines.do.k')) + '</p>' +
      '<div class="mgoals" role="tablist" aria-label="' + esc(t('machines.do.goals')) + '">' + goals.map((x, i) => '<button type="button" role="tab" data-mgoal="' + i + '" aria-selected="' + (i === view.goal) + '">' + esc(t('machines.do.goal', { n: i + 1 })) + (WON[goalKey(i)] ? ' <span class="mwonmark">✓</span>' : '') + '</button>').join('') + '</div>' +
      '<h2>' + esc(t('machines.do.' + g.id + '.t')) + '</h2><p class="small">' + esc(t('machines.do.' + g.id + '.d')) + '</p>' +
      (G.won ? '<p class="small mdone"><b>' + esc(t('machines.do.won')) + '</b> ' + esc(t('machines.do.why.' + goalKey(view.goal))) + '</p>' + (view.goal < goals.length - 1 ? '<button type="button" class="btn primary" data-mgoal="' + (view.goal + 1) + '">' + esc(t('machines.do.next')) + '</button>' : '')
        : '<p class="small muted mhint">' + esc(t('machines.do.hint.' + goalKey(view.goal))) + '</p>') + '</section>';
  }

  let wasVertical = narrow();
  function draw() {
    PLAY = null;
    const m = M.machine(id, view.plan, view.guesses), doing = view.mode === 'do';
    if (doing) { const G = playNow(); if (G.won && !WON[goalKey(view.goal)]) { WON[goalKey(view.goal)] = 1; saveWon(); } }
    const act = document.activeElement, keepFocus = act && el.contains(act) ? ['data-mform', 'data-mpart', 'data-mlayer', 'data-mmode', 'data-mfab', 'data-mgoal', 'data-mneed'].map(a => [a, act.getAttribute(a)]).find(x => x[1] != null) : null;
    wasVertical = narrow();
    el.innerHTML = '<article class="mach' + (doing ? ' mdoing' : '') + '">' + headHtml() + stageHtml(m) +
      '<div class="mside">' + (doing ? doHtml() + partsHtml(m) + fabsSmall() + scoreHtml(m)
        : layerHtml(m) + partsHtml(m) + scoreHtml(m) + agentHtml(m) + '<section class="mabout"><p class="small muted">' + esc(t('machines.ui.lead')) + '</p><p class="small muted mnote">' + t('machines.ui.note') + '</p></section>') + '</div></article>';
    view.changed = null; address();
    if (keepFocus) { const n = el.querySelector('[' + keepFocus[0] + '="' + CSS.escape(keepFocus[1]) + '"]'); if (n) n.focus({ preventScroll: true }); }
  }
  /* a layer opened: its words come into view beside the picture (on a phone, under it) */
  const showLayer = () => { const box = el.querySelector('.mlayer'); if (box && box.getBoundingClientRect().top > innerHeight * 0.6) box.scrollIntoView({ block: 'start', behavior: still() ? 'auto' : 'smooth' }); };
  /* the agent: every machine nobody beats, for the front, and the four cheapest as offers */
  function agent() { const A = M.assemble(id, Infinity, view.guesses); view.front = A.picks; view.agent = Object.assign({}, A, { picks: A.picks.slice(0, 4) }); }
  el.onclick = e => {
    const q = s => e.target.closest(s);
    const n = q('[data-mneed]'); if (n) { if (n.dataset.mneed !== id) ctx.go(n.dataset.mneed, view.mode === 'do' ? 'do' : view.layer !== 'flow' ? view.layer : ''); return; }
    if (ctx.slipClick && ctx.slipClick(e, () => draw())) return;
    const md = q('[data-mmode]'); if (md) { view.mode = md.dataset.mmode; return draw(); }
    const ly = q('[data-mlayer]'); if (ly) { view.layer = ly.dataset.mlayer === view.layer && view.layer !== 'flow' ? 'flow' : ly.dataset.mlayer; draw(); return showLayer(); }
    const gl = q('[data-mgoal]'); if (gl) { view.goal = Math.max(0, Math.min(goals.length - 1, +gl.dataset.mgoal)); return draw(); }
    const bk = q('[data-mpart]'); if (bk) { view.sel = bk.dataset.mpart; draw(); const r = el.querySelector('.mrow.on'); if (r) { const b = r.getBoundingClientRect(); if (b.top < 80 || b.bottom > innerHeight) r.scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' }); } return; }
    const fb = q('[data-mfab]'); if (fb) { view.plan = Object.assign({}, view.plan, { fab: fb.dataset.mfab }); return draw(); }
    const kp = q('[data-mkeep]'); if (kp && !kp.disabled && ctx.keep) {
      const k = ctx.keep(id, Object.assign({}, M.machine(id, view.plan).plan), el.querySelector('.mkeep'));
      if (k.ok) { view.kept = k.e.id; view.keepErr = ''; } else view.keepErr = ctx.refusal(k.r);
      return draw();
    }
    const f = q('[data-mform]'); if (f && !f.disabled) { const s = f.dataset.mform, i = s.indexOf(':'), part = s.slice(0, i); if (view.plan[part] !== s.slice(i + 1)) view.changed = part; view.plan = Object.assign({}, view.plan, { [part]: s.slice(i + 1) }); view.sel = part; return draw(); }
    if (q('[data-magent]')) { agent(); return draw(); }
    const u = q('[data-muse]'); if (u && view.agent) { const p = view.agent.picks[+u.dataset.muse]; if (p) { need.parts.forEach(x => { if (view.plan[x.id] !== p.plan[x.id]) view.changed = x.id; }); view.plan = Object.assign({}, p.plan); return draw(); } }
    if (q('[data-mreset]')) { view.plan = M.startPlan(id); return draw(); }
  };
  el.onchange = e => { const g = e.target.closest('[data-mguess]'); if (!g) return; view.guesses = g.checked; if (view.agent) agent(); draw(); };
  /* a screen turned or resized across a phone's width: the machine runs the other way */
  CUR = { el, redraw: () => { if (narrow() !== wasVertical) draw(); } };
  draw();
}
let CUR = null;
if (typeof addEventListener === 'function') addEventListener('resize', () => { if (CUR && CUR.el.isConnected) CUR.redraw(); });
