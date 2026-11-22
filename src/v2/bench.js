/* The bench (#268): one design of your own, worked on directly, carried from the job to the masks.

   A surface of a known size and place: the square the studio's step is drawn in (the flat world's frame, dive.frame),
   laid over the picture, so the 3D studio can hand over to it and the questions' marks under Ask still land on the
   parts they are about (the regions below are the parts of src/app/design.js, in its 1000 x 1000 space). Only the step
   in view is drawn; moving along slides it with the step line.

   Each step is live: the job (pick a piece of the community's computer, its patterns played), describe (the text on
   the bench, every answer re-checked as you type, errors at their line), check (every pattern as waves, scrubbed;
   a wrong answer traced to its pattern and its line; a test that skips patterns, and what it misses), gates (the
   description as cells; flip the inputs and watch the 1s travel; a cell's transistors; the cost), layout (your cells
   on your tile; drag one onto another and the wires are routed again, vias drawn), masks (the layout peeled into its
   layers, and what a mistake left in costs from here).

   The design engine decides everything (src/engines/design.js, src/engines/bench.js); this file draws and listens.
   The same drawing serves a challenge played at the bench, as its instrument in the card (data-f2="instrument"),
   so in Do mode it takes the stage. Words: bench.*, design.*. */
import { t } from '../core/i18n.js';
import * as G from './game.js';
import * as X from '../engines/bench.js';
import { SKY130_TOTAL } from '../engines/rules.js';
import { simulate, cellSize } from '../engines/design.js';
import { plan, allDesigns } from '../engines/build.js';
import { NEEDS } from '../data/build.js';
import { DESIGN_SCENES } from '../app/design.js';
import { patch } from './patch.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const STEPS = ['need', 'logic', 'check', 'gates', 'layout', 'masks'];
/* a part's region of the 1000 x 1000 square, as a box on the surface */
const reg = (step, part) => { const r = DESIGN_SCENES[step].parts[part][0].r; return r; };
/* a region's size for drawing in it: on a phone the bench is taller than it is wide (asp), and a drawing keeps its shapes */
let ASP = 1;
const dim = (step, part) => { const r = reg(step, part); return [r[2], r[3] * ASP]; };
const box = (step, part, cls, inner, attrs) => { const [x, y, w, h] = reg(step, part);
  return '<div class="bk-r ' + (cls || '') + '" data-part="' + part + '" style="left:' + x / 10 + '%;top:' + y / 10 + '%;width:' + w / 10 + '%;height:' + h / 10 + '%"' + (attrs || '') + '>' + inner + '</div>'; };
/* an SVG filling a region exactly: its viewBox is the region's own size, so a point (x, y) inside is at x/w, y/h */
const svgOf = (w, h, inner, cls) => '<svg class="' + (cls || '') + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' + inner + '</svg>';
const pct = (v, of) => (100 * v / of).toFixed(2) + '%';
/* words placed on a drawing, as HTML (never drawn into it) */
const tag = (x, y, w, h, text, cls) => '<span class="bk-tag ' + (cls || '') + '" style="left:' + pct(x, w) + ';top:' + pct(y, h) + '">' + text + '</span>';
const LINE = ' vector-effect="non-scaling-stroke"';
const num = bits => bits.reduce((a, b) => a * 2 + (b | 0), 0);

/* the design's numbers, words a learner reads in the card: one sentence for each step (design.cap.<step>.d) */
export function caption(step, D, L) {
  const B = D.B, ok = !B.errs.length;
  if (!ok && step !== 'need' && step !== 'logic') return t('bench.cap.unread');
  const n = { cells: B.M ? B.M.cells.length : 0, transistors: B.transistors || 0, n: B.st ? B.st.depth : 0, total: B.total || 0, bad: B.bad || 0, masks: SKY130_TOTAL,
    wire: L ? L.wl : B.RT ? B.RT.wl : 0, vias: L ? L.vias : B.RT ? B.RT.vias : 0, drawn: X.MASKS.length, rest: SKY130_TOTAL - X.MASKS.length };
  if (step === 'check') return t(B.bad ? 'design.cap.check.d' : 'design.cap.check.ok', Object.assign(n, { n: B.bad || 0 }));
  return t('design.cap.' + step + '.d', n);
}

export function createBench(o) {
  const S = o.state;
  const el = document.createElement('div'); el.className = 'bsurf'; el.hidden = true; el.setAttribute('role', 'group');
  if (o.before) o.before.before(el);
  let step = 'need', CH = null, on = false, k0 = 0, scrub = 0, sub = 0, why = null, gate = null, pin = { a: 1, d: 1, x0: 1, s0: 1, en: 1 }, tick = {}, sel = null, peel = 0.6, plate = null, undo = [], live = true, timer = 0, flash = null;
  const listeners = new Set();
  const changed = () => { listeners.forEach(f => f()); };

  /* ---- the design shown: a challenge's while one is played here, else yours ---- */
  function now() {
    const ch = CH;
    if (ch && ch.kind === 'design') { const own = S.codes[ch.p] != null, code = own ? S.codes[ch.p] : G.starter(ch.p); return { p: ch.p, code, by: own ? 'you' : G.ownStarter(ch.p) ? 'starter' : 'example', B: G.checkDesign(ch.p, code), ro: true }; }
    if (ch && ch.kind === 'evolve' && S.evolve && S.evolve.code && G.hasProject(S.evolve.job)) return { p: S.evolve.job, code: S.evolve.code, by: 'evolved', B: G.checkDesign(S.evolve.job, S.evolve.code), ro: true };
    if (ch && ch.kind === 'floor') { const B = X.floorDesign(); return { p: B.p, code: B.code, by: 'example', B, ro: true, floor: true }; }
    return Object.assign(G.benchDesign(S), { ro: !!ch && ch.kind !== 'piece' });
  }
  /* the layout shown: the challenge's scrambled tile, or your order of the cells, or the placer's */
  const lcache = new Map();
  function layoutOf(D) {
    const B = D.B; if (!B.M || !B.PL) return null;
    let rows = D.floor ? S.bench.floor : S.bench.rows;
    if (!rows || !X.validRows(B.M, rows, B.PL)) rows = D.floor ? X.floorStart(B) : X.rowsOf(B.PL);
    const key = B.p + '\n' + B.code + '\n' + JSON.stringify(rows);
    if (!lcache.has(key)) { if (lcache.size > 30) lcache.clear(); lcache.set(key, Object.assign({ rows }, X.measure(B.M, rows, B.PL))); }
    return lcache.get(key);
  }
  const setRows = (D, rows) => { if (D.floor) S.bench.floor = rows; else S.bench.rows = rows; o.save(); };
  /* change your design's text: kept as yours unless it is the lab's example again */
  function setCode(code) {
    const D = now(); if (D.ro) return;
    const b = S.bench; undo.push(b.code); if (undo.length > 40) undo.shift();
    b.code = code === G.benchDesign({ bench: { p: b.p } }).code ? null : code.slice(0, 4000); b.rows = null; o.save(); changed();
  }

  /* ---- 1. the job ---- */
  function need(D, inst) {
    const P = plan([]), mine = G.benchPieceOf(D.p), B = D.B, proj = B.proj, quiz = CH && CH.kind === 'piece';
    const kids = id => NEEDS.filter(n => n.parent === id), rows = [];
    const walk = (n, d) => { rows.push({ n, d }); kids(n.id).forEach(c => walk(c, d + 1)); }; walk(NEEDS[0], 0);
    const tree = '<ul class="bk-tree">' + rows.map(({ n, d }) => { const s = P[n.id], st = s.state, pick = G.BENCH_PIECES.find(x => x.need === n.id), cur = mine && mine.need === n.id;
      const inner = '<i class="bk-dot st-' + st + '"></i><span class="bk-nm">' + esc(t('build.need.' + n.id + '.t')) + '</span><span class="bk-st">' + esc(t('build.short.' + st, { built: s.built || 0, of: s.of || 0 })) + '</span>';
      return '<li style="--d:' + d + '">' + (pick && !D.ro ? '<button type="button" class="bk-node' + (cur ? ' on' : '') + '" data-bk-pick="' + pick.p + '" aria-pressed="' + !!cur + '" title="' + esc(t('build.need.' + n.id + '.d')) + '">' + inner + '</button>'
        : '<span class="bk-node' + (cur ? ' on' : '') + (pick ? '' : ' fixed') + '" title="' + esc(t('build.need.' + n.id + '.d')) + '">' + inner + '</span>') + '</li>'; }).join('') + '</ul>';
    const head = '<p class="bk-k">' + esc(t(D.ro ? 'bench.need.yours' : 'bench.need.pick')) + '</p>';
    if (!proj.f) return box('need', 'plan', 'bk-plan', head + tree);
    /* the job's patterns, played one after another until you take over: inputs on the left, the answers it wants on the right */
    const R = X.jobRows(D.p), asked = quiz ? X.jobAsk(D.p, S.bench.jq.k) : null, ak = quiz ? asked[S.bench.jq.run % asked.length] : null;
    const k = quiz ? ak : ((live ? k0 : 0) % R.length + R.length) % R.length;
    const v = quiz ? R[k].v : live ? R[k].v : Object.assign({}, R[0].v, pin), want = proj.seq ? R[k].want : proj.f(v);
    const ins = proj.ins.map(nm => '<button type="button" class="bk-pin' + (v[nm] ? ' hi' : '') + '" data-bk-in="' + esc(nm) + '"' + (quiz || proj.seq ? ' disabled' : '') + '><b>' + esc(nm) + '</b><span class="bk-v">' + v[nm] + '</span></button>').join('');
    const ans = S.bench.jq.ans || {};
    const outs = proj.outs.map(nm => quiz ? '<button type="button" class="bk-pin out ask' + (ans[nm] ? ' hi' : '') + '" data-bk-ans="' + esc(nm) + '" aria-pressed="' + !!ans[nm] + '"><span class="bk-v">' + (ans[nm] ? 1 : 0) + '</span><b>' + esc(nm) + '</b></button>'
      : '<span class="bk-pin out' + (want[nm] ? ' hi' : '') + '"><span class="bk-v">' + want[nm] + '</span><b>' + esc(nm) + '</b></span>').join('');
    return box('need', 'plan', 'bk-plan', head + tree) +
      box('need', 'ins', 'bk-pins', '<p class="bk-k">' + esc(t(proj.seq ? 'bench.need.cycle' : quiz ? 'bench.need.asked' : 'bench.need.in', { n: k + 1 })) + '</p>' + ins) +
      box('need', 'box', 'bk-boxr', '<div class="bk-box"><span class="bk-q">?</span><span class="bk-boxt">' + esc(t('design.proj.' + D.p + '.t')) + '</span></div>') +
      box('need', 'outs', 'bk-pins outs', '<p class="bk-k">' + esc(t(quiz ? 'bench.need.yourAns' : 'bench.need.wants')) + '</p>' + outs) +
      box('need', 'use', 'bk-user', quiz ? '' : useHtml(B, v, want));
  }
  /* what the answers mean where the circuit is used: a sum, a lamp, a digit, a count, a result */
  function useHtml(B, v, o) {
    const d = B.proj.demo;
    if (d === 'seg') { const S7 = { a: 'M20 10H60', b: 'M64 14V56', c: 'M64 64V106', d: 'M20 110H60', e: 'M16 64V106', f: 'M16 14V56', g: 'M20 60H60' };
      return '<svg class="bk-seg" viewBox="0 0 80 120" aria-hidden="true">' + Object.entries(S7).map(([k, p]) => '<path d="' + p + '" class="' + (o[k] ? 'on' : '') + '"/>').join('') + '</svg>'; }
    if (d === 'lamp') return '<span class="bk-lamp' + (o[B.outs[0]] ? ' on' : '') + '"></span>';
    if (d === 'count') return '<span class="bk-big">' + num(B.outs.map(n => o[n])) + '</span>';
    if (d === 'alu') { const op = ['and', 'or', 'xor', v.sub ? 'sub' : 'add'][v.op1 * 2 + v.op0]; return '<span class="bk-mid">' + esc(t('design.op.' + op)) + '</span><span class="bk-big sm">' + o.y + ' · ' + o.cout + '</span>'; }
    const three = B.ins.length === 3, half = three ? 1 : B.ins.length / 2;
    const a = num(B.ins.slice(0, half).map(n => v[n])), b = num(B.ins.slice(half, half * 2).map(n => v[n]));
    const s = B.outs.length === 2 ? o[B.outs[1]] * 2 + o[B.outs[0]] : num(B.outs.map(n => o[n]));
    return '<span class="bk-big sm">' + esc(three ? t('bench.sum3', { a, b, c: v[B.ins[2]], s }) : t('bench.sum2', { a, b, s })) + '</span>';
  }

  /* ---- 2. describe: the text, and every answer the job wants ---- */
  function logic(D) {
    const B = D.B, lines = D.code.split('\n'), errAt = new Map(B.errs.map(e => [e.l, e]));
    const hl = lines.map((ln, i) => '<span class="bk-ln' + (errAt.has(i + 1) ? ' err' : '') + '"><i>' + (i + 1) + '</i>' + esc(ln) + '</span>').join('');
    const ed = '<p class="bk-k">' + esc(t('bench.code.k', { job: t('design.proj.' + D.p + '.t') })) + ' · <span class="bk-by ' + D.by + '">' + esc(t('build.by.' + D.by)) + '</span></p>' +
      '<div class="bk-code"><pre class="bk-hl" aria-hidden="true">' + hl + '</pre><textarea data-bk-code wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="' + esc(t('game.describe')) + '"' + (D.ro ? ' readonly' : '') + '>' + esc(D.code) + '</textarea></div>' +
      (B.errs.length ? '<ul class="bk-errs">' + B.errs.slice(0, 3).map(e => '<li><button type="button" data-bk-line="' + e.l + '">' + esc(t('design.err.' + e.k, { l: e.l, n: e.n || '' })) + '</button></li>').join('') + '</ul>' : '') +
      (D.ro ? '<p class="bk-note">' + esc(t('bench.ro')) + '</p>' : '<div class="bk-tools"><button type="button" class="chipb" data-bk-undo' + (undo.length ? '' : ' disabled') + '>' + esc(t('bench.undo')) + '</button>' + (D.by === 'you' ? '<button type="button" class="chipb" data-bk-reset>' + esc(t('bench.reset')) + '</button>' : '') + '</div>');
    return box('logic', 'code', 'bk-ed', ed) + box('logic', 'table', 'bk-ttr', table(B));
  }
  function table(B) {
    const R = X.jobRows(B.p), ok = !B.errs.length && B.rows, ins = B.ins, outs = B.outs;
    if (!R.length) return '<p class="bk-note">' + esc(t('design.state.free')) + '</p>';
    return '<p class="bk-k">' + esc(t('bench.tt.k')) + '</p><div class="bk-tt"><table><thead><tr>' + ins.map(i => '<th>' + esc(i) + '</th>').join('') + '<th class="sep"></th>' + outs.map(n => '<th class="o">' + esc(n) + '</th>').join('') + '<th></th></tr></thead><tbody>' +
      R.map((r, k) => { const mine = ok ? B.rows[k] : null, bad = mine && mine.mis.length;
        return '<tr class="' + (mine ? (bad ? 'bad' : 'good') : '') + '">' + ins.map(i => '<td>' + r.v[i] + '</td>').join('') + '<td class="sep"></td>' +
          outs.map(n => '<td class="o">' + (mine && mine.o[n] !== r.want[n] ? '<s>' + mine.o[n] + '</s>' : '') + r.want[n] + '</td>').join('') + '<td class="mk">' + (mine ? (bad ? '✗' : '✓') : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }

  /* ---- 3. check: every pattern run, as waves ---- */
  function check(D) {
    const B = D.B;
    if (B.errs.length || !B.rows) return box('check', 'waves', 'bk-wv', '<p class="bk-note bad">' + esc(t('bench.cap.unread')) + '</p>') + box('check', 'verdict', 'bk-vd', '');
    const [W, H] = dim('check', 'waves'), rows = B.rows, n = rows.length, win = Math.min(n, 16), k = Math.max(0, Math.min(n - 1, scrub)), off = Math.max(0, Math.min(n - win, k - Math.floor(win / 2)));
    const sig = B.ins.concat(B.outs), x0 = 120, cw = (W - x0 - 10) / win, sh = Math.min(110, (H - 30) / sig.length);
    let g = '', tags = '';
    g += '<rect class="bk-cur" x="' + (x0 + (k - off) * cw) + '" y="0" width="' + cw + '" height="' + H + '"/>';
    sig.forEach((nm, i) => {
      const y = 20 + i * sh + sh / 2, out = i >= B.ins.length, pts = [];
      tags += tag(x0 - 14, y, W, H, esc(nm), 'r' + (out ? ' o' : ''));
      for (let j = off; j < off + win; j++) {
        const r = rows[j], val = out ? r.o[nm] : r.v[nm], yy = y + (val ? -sh * 0.26 : sh * 0.26), xa = x0 + (j - off) * cw;
        pts.push(xa + ',' + yy, (xa + cw) + ',' + yy);
        if (out && r.e && r.e[nm] !== r.o[nm]) g += '<rect class="bk-wrong' + (why && why.k === j && why.o === nm ? ' on' : '') + '" data-bk-why="' + j + ':' + esc(nm) + '" x="' + xa + '" y="' + (y - sh * 0.42) + '" width="' + cw + '" height="' + sh * 0.84 + '"/>';
      }
      g += '<polyline class="bk-wave' + (out ? ' o' : '') + '" points="' + pts.join(' ') + '"' + LINE + '/>';
    });
    for (let j = 0; j <= win; j++) g += '<line class="bk-grid" x1="' + (x0 + j * cw) + '" x2="' + (x0 + j * cw) + '" y1="10" y2="' + (H - 4) + '"' + LINE + '/>';
    /* the test you choose: the first m patterns only; what it would have caught, and what slipped past */
    const m = sub || n, tested = rows.slice(0, m), caught = tested.filter(r => r.mis.length).length, all = B.bad;
    for (let j = off; j < off + win; j++) if (j >= m) g += '<rect class="bk-skip" x="' + (x0 + (j - off) * cw) + '" y="0" width="' + cw + '" height="' + H + '"/>';
    const v = rows[k].v, say = t('bench.check.at', { k: k + 1, n, ins: B.ins.map(i => i + ' ' + v[i]).join(', ') });
    const subs = [n, Math.max(1, Math.round(n / 2)), Math.max(1, Math.round(n / 4)), 1].filter((x, i, a) => a.indexOf(x) === i);
    const verdict = all === 0 ? t('bench.check.clean', { n }) : caught === all ? t('bench.check.caught', { m, n: all }) : caught ? t('bench.check.some', { m, c: caught, n: all }) : t('bench.check.miss', { m, n: all });
    const wy = why && rows[why.k] ? rows[why.k] : null, line = wy ? lineOf(D.code, why.o) : 0;
    const whyHtml = wy ? '<p class="bk-why">' + esc(t('bench.check.why', { k: why.k + 1, ins: B.ins.map(i => i + ' ' + wy.v[i]).join(', '), out: why.o, got: wy.o[why.o], want: wy.e[why.o], l: line })) + ' <button type="button" class="link" data-bk-goline="' + line + '">' + esc(t('bench.check.fix')) + '</button></p>' : '';
    return box('check', 'waves', 'bk-wv', svgOf(W, H, g, 'bk-svg') + tags) +
      box('check', 'verdict', 'bk-vd', '<label class="bk-scrub"><span>' + esc(say) + '</span><input type="range" data-bk-scrub min="0" max="' + (n - 1) + '" step="1" value="' + k + '"></label>' +
        '<div class="bk-subs"><span class="bk-k">' + esc(t('bench.check.sub')) + '</span>' + subs.map(x => '<button type="button" class="chipb" data-bk-sub="' + x + '" aria-pressed="' + (m === x) + '">' + esc(x === n ? t('bench.check.all', { n }) : String(x)) + '</button>').join('') + '</div>' +
        '<p class="bk-say ' + (all && caught < all ? 'bad' : all ? 'warm' : 'good') + '">' + esc(verdict) + '</p>' + whyHtml);
  }
  /* the line that gives an output its value */
  const lineOf = (code, name) => { const L = code.split('\n'); const i = L.findIndex(l => new RegExp('^\\s*(reg\\s+)?' + name + '\\s*=').test(l)); return i + 1; };

  /* ---- 4. gates: the description as cells, values travelling ---- */
  function gatesView(D) {
    const B = D.B;
    if (B.errs.length || !B.M) return box('gates', 'cells', 'bk-gt', '<p class="bk-note bad">' + esc(t('bench.cap.unread')) + '</p>');
    const M = B.M, Lv = B.levels, [W, H] = dim('gates', 'cells'), cols = Math.max(1, ...Lv) + (M.cells.some(c => c.type === 'DFF') ? 1 : 0), byCol = {};
    M.cells.forEach((c, i) => { const col = c.type === 'DFF' ? cols : Lv[i]; (byCol[col] = byCol[col] || []).push(i); });
    const most = Math.max(B.ins.length, B.outs.length, ...Object.values(byCol).map(a => a.length));
    const top = 90, span = H - top - 20, gw = Math.min(84, (W - 80) / (cols + 1) * 0.5), gh = Math.min(64, span / most * 0.62), pos = {};
    Object.entries(byCol).forEach(([col, list]) => list.forEach((i, j) => { pos[i] = [40 + (+col - 0.5) * ((W - 80 - gw) / Math.max(1, cols - 0.5)) + 10, top + span * (j + 0.5) / list.length - gh / 2]; }));
    /* the values: the pattern you set (and the flip-flops' state after your ticks) */
    const v = {}; B.ins.forEach(n => { v[n] = pin[n] | 0; });
    const Sv = simulate(B, v, tick.st || {}), val = n => Sv.val ? Sv.val[n] : undefined;
    const inY = i => top + span * (i + 0.5) / M.inputs.length, outY = i => top + span * (i + 0.5) / M.outs.length;
    const src = {}, lev = {};
    M.inputs.forEach((p, i) => { src[p.net] = [0, inY(i)]; lev[p.net] = 0; });
    M.cells.forEach((c, i) => { src[c.out] = [pos[i][0] + gw + (/^N|INV|XNOR/.test(c.type) ? 12 : 2), pos[i][1] + gh / 2]; lev[c.out] = c.type === 'DFF' ? 0 : Lv[i]; });
    let wires = '', cells = '', tags = '';
    const wire = (net, to, j) => { const a = src[net]; if (!a) return; const mid = a[0] + Math.max(14, (to[0] - a[0]) * (0.35 + 0.1 * (j % 3))), on = val(net) === 1;
      wires += '<polyline class="bk-w' + (on ? ' on' : '') + '" style="transition-delay:' + ((lev[net] || 0) * 0.14).toFixed(2) + 's" points="' + [a, [mid, a[1]], [mid, to[1]], to].map(p => p.join(',')).join(' ') + '"' + LINE + '/>'; };
    M.cells.forEach((c, i) => { const [x, y] = pos[i]; c.ins.forEach((net, j) => wire(net, [x, y + gh * (j + 1) / (c.ins.length + 1)], i + j)); });
    M.outs.forEach((p, i) => wire(p.net, [W, outY(i)], i));
    M.cells.forEach((c, i) => { const [x, y] = pos[i], on = val(c.out) === 1;
      cells += '<g class="bk-g' + (on ? ' on' : '') + (gate === i ? ' sel' : '') + '" data-bk-gate="' + i + '" style="transition-delay:' + ((lev[c.out] || 0) * 0.14).toFixed(2) + 's">' + gatePath(c.type, x, y, gw, gh) + '<rect class="hit" x="' + (x - 6) + '" y="' + (y - 6) + '" width="' + (gw + 18) + '" height="' + (gh + 12) + '"/></g>';
      tags += tag(x + gw * 0.42, y + gh / 2, W, H, esc(c.type.replace(/2$/, '')), 'g'); });
    const cost = '<div class="bk-cost"><span><b>' + M.cells.length + '</b> ' + esc(t('bench.gates.cells', { n: M.cells.length })) + '</span><span><b>' + B.transistors + '</b> ' + esc(t('bench.gates.tr', { n: B.transistors })) + '</span><span><b>' + B.st.depth + '</b> ' + esc(t('bench.gates.chain', { n: B.st.depth })) + '</span></div>';
    const c = gate != null && M.cells[gate], L = c && cellSize(c.type);
    const card = c ? '<div class="bk-cell"><b>' + esc(c.type) + '</b><span>' + esc(t('bench.gates.cell', { n: L[0], w: L[1], ps: L[2] })) + '</span>' + transistors(L[0]) + '</div>' : '<p class="bk-hint">' + esc(t(B.seq ? 'bench.gates.tapSeq' : 'bench.gates.tap')) + '</p>';
    const ins = M.inputs.map((p, i) => '<button type="button" class="bk-pin' + (val(p.net) ? ' hi' : '') + '" data-bk-flip="' + esc(p.name) + '" style="top:' + pct(inY(i), H) + '"><b>' + esc(p.name) + '</b><span class="bk-v">' + (val(p.net) | 0) + '</span></button>').join('') + (B.seq ? '<button type="button" class="chipb bk-tick" data-bk-tick>' + esc(t('bench.gates.tick')) + '</button>' : '');
    const outs = M.outs.map((p, i) => '<span class="bk-pin out' + (val(p.net) ? ' hi' : '') + '" style="top:' + pct(outY(i), H) + '"><span class="bk-v">' + (val(p.net) | 0) + '</span><b>' + esc(p.name) + '</b></span>').join('');
    return box('gates', 'pins', 'bk-gpins', ins) + box('gates', 'cells', 'bk-gt', cost + svgOf(W, H, wires + cells, 'bk-svg') + tags + card) + box('gates', 'outs', 'bk-gpins outs', outs);
  }
  /* a cell's transistors: half pull up (p-type), half pull down (n-type), drawn as small switches */
  const transistors = n => { const half = Math.ceil(n / 2), cols = Math.min(12, half), w = cols * 16 + 8;
    let g = ''; for (let i = 0; i < n; i++) { const r = i < half ? 0 : 1, c = (i % half) % cols, rr = r * 2 + Math.floor((i % half) / cols); g += '<rect class="' + (r ? 'tn' : 'tp') + '" x="' + (6 + c * 16) + '" y="' + (6 + rr * 14) + '" width="11" height="9" rx="2"/>'; }
    return '<svg class="bk-tr" viewBox="0 0 ' + w + ' ' + (Math.ceil(half / cols) * 28 + 8) + '" aria-hidden="true">' + g + '</svg>'; };
  function gatePath(type, x, y, w, h) {
    const base = type.replace(/[0-9]/g, ''); let d;
    if (base === 'AND' || base === 'NAND') d = 'M' + x + ' ' + y + 'H' + (x + w / 2) + 'A' + h / 2 + ' ' + h / 2 + ' 0 0 1 ' + (x + w / 2) + ' ' + (y + h) + 'H' + x + 'Z';
    else if (/OR$/.test(base)) d = 'M' + x + ' ' + y + 'Q' + (x + w * 0.6) + ' ' + y + ' ' + (x + w) + ' ' + (y + h / 2) + 'Q' + (x + w * 0.6) + ' ' + (y + h) + ' ' + x + ' ' + (y + h) + 'Q' + (x + w * 0.3) + ' ' + (y + h / 2) + ' ' + x + ' ' + y + 'Z';
    else if (base === 'INV' || base === 'BUF') d = 'M' + x + ' ' + y + 'L' + (x + w * 0.85) + ' ' + (y + h / 2) + 'L' + x + ' ' + (y + h) + 'Z';
    else d = 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + -w + 'Z';
    let s = '<path class="body" d="' + d + '"' + LINE + '/>';
    if (base === 'XOR' || base === 'XNOR') s += '<path class="body2" d="M' + (x - 9) + ' ' + y + 'Q' + (x - 9 + w * 0.3) + ' ' + (y + h / 2) + ' ' + (x - 9) + ' ' + (y + h) + '"' + LINE + '/>';
    if (/^N|INV|XNOR/.test(base)) s += '<circle class="body" cx="' + (x + (base === 'INV' ? w * 0.85 : w) + 6) + '" cy="' + (y + h / 2) + '" r="6"' + LINE + '/>';
    return s;
  }

  /* ---- 5. layout: your cells in rows on your tile, joined by two metals ---- */
  function layoutView(D) {
    const B = D.B, Lo = layoutOf(D);
    if (!Lo) return box('layout', 'tile', 'bk-lt', '<p class="bk-note bad">' + esc(t('bench.cap.unread')) + '</p>');
    const P = Lo.PL, RT = Lo.RT, [W, H] = dim('layout', 'tile'), top = 110, s = Math.min((W - 20) / P.GW, (H - top - 10) / P.H), ox = (W - P.GW * s) / 2, oy = top + Math.min(40, (H - top - 10 - P.H * s) / 2);
    const Xp = x => ox + x * s, Yp = y => oy + y * s;
    let g = '<rect class="bk-tile" x="' + Xp(0) + '" y="' + Yp(0) + '" width="' + P.GW * s + '" height="' + P.H * s + '" rx="6"/>', tags = '';
    for (let r = 0; r < P.rows; r++) g += '<rect class="bk-row" data-bk-row="' + r + '" x="' + Xp(2) + '" y="' + Yp(r * P.TR + 1) + '" width="' + (P.GW - 4) * s + '" height="' + 3 * s + '" rx="3"/>';
    B.M.cells.forEach((c, i) => { const p = P.pos[i]; if (!p) return;
      g += '<rect class="bk-c' + (sel === i ? ' sel' : '') + (flash && flash.includes(i) ? ' just' : '') + '" data-bk-cell="' + i + '" x="' + (Xp(2 + p.x) + 1.5) + '" y="' + (Yp(p.r * P.TR + 1) + 1.5) + '" width="' + (p.w * s - 3) + '" height="' + (3 * s - 3) + '" rx="3"/>';
      if (p.w * s > 34) tags += tag(Xp(2 + p.x + p.w / 2), Yp(p.r * P.TR + 1) + 2.2 * s, W, H, esc(c.type.replace(/2$/, '')), 'c'); });
    /* the wires: up and down on the lower metal, across on the upper, a via wherever a wire changes metal */
    const xy = a => { const l = a % 2, c = (a - l) / 2, x = c % P.GW; return { l, x, y: (c - x) / P.GW }; };
    let m1 = '', m2 = '', vias = '';
    Object.values(RT.paths).forEach(segs => segs.forEach(path => { for (let k = 1; k < path.length; k++) { const a = xy(path[k - 1]), b = xy(path[k]);
      if (a.l !== b.l) { vias += '<rect class="bk-via" x="' + (Xp(a.x + 0.5) - s * 0.22) + '" y="' + (Yp(a.y + 0.5) - s * 0.22) + '" width="' + s * 0.44 + '" height="' + s * 0.44 + '"/>'; continue; }
      const seg = 'M' + Xp(a.x + 0.5) + ' ' + Yp(a.y + 0.5) + 'L' + Xp(b.x + 0.5) + ' ' + Yp(b.y + 0.5); if (a.l === 1) m1 += seg; else m2 += seg; } }));
    const lw = Math.max(1.4, s * 0.28 * (o.px() / 1000));
    g += '<path class="bk-m1" d="' + m1 + '" stroke-width="' + lw.toFixed(2) + '"' + LINE + '/><path class="bk-m2" d="' + m2 + '" stroke-width="' + (lw * 1.2).toFixed(2) + '"' + LINE + '/>' + vias;
    Object.values(P.ioIn).concat(Object.values(P.ioOut)).forEach(p => { g += '<rect class="bk-io" x="' + Xp(p.x) + '" y="' + Yp(p.y) + '" width="' + s + '" height="' + s + '"/>'; });
    const best = D.B.RT.wl, goal = D.floor ? X.floorGoal(B) : null;
    const cost = '<div class="bk-cost"><span><b>' + Lo.wl + '</b> ' + esc(t('bench.layout.wire', { n: Lo.wl })) + '</span><span><b>' + Lo.vias + '</b> ' + esc(t('bench.layout.vias', { n: Lo.vias })) + '</span>' +
      (goal != null ? '<span class="' + (Lo.wl <= goal && !Lo.failed ? 'good' : 'warm') + '"><b>≤ ' + goal + '</b> ' + esc(t('bench.layout.goal')) + '</span>' : '<span class="muted">' + esc(t('bench.layout.best', { n: best })) + '</span>') + '</div>';
    const foot = '<p class="bk-hint">' + esc(t(Lo.failed ? 'bench.layout.failed' : D.ro && !D.floor ? 'bench.ro' : 'bench.layout.drag', { n: Lo.failed })) + '</p>' +
      ((!D.ro && S.bench.rows) || (D.floor && S.bench.floor) ? '<div class="bk-tools"><button type="button" class="chipb" data-bk-placer>' + esc(t(D.floor ? 'bench.layout.again' : 'bench.layout.reset')) + '</button></div>' : '');
    return box('layout', 'tile', 'bk-lt', cost + svgOf(W, H, g, 'bk-svg') + tags + foot) + box('layout', 'shared', 'bk-sh', shared());
  }
  /* the shared chip: many small designs side by side, each on its own tile (as Tiny Tapeout does), yours lit */
  /* the shared chip: one tile each, square, in their own drawing under the heading, so a heading that wraps in a narrow
     region never runs into them */
  function shared() {
    const D = allDesigns().filter(d => d.state !== 'broken').length, cols = 3, rows = 8;
    let g = ''; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const n = j * cols + i;
      g += '<rect class="' + (n === D ? 'bk-mine' : n < D ? 'bk-other' : 'bk-free') + '" x="' + (i * 10 + 1) + '" y="' + (j * 10 + 1) + '" width="8" height="8" rx="1"' + LINE + '/>'; }
    return '<p class="bk-k">' + esc(t('bench.layout.shared')) + '</p><svg class="bk-tiles" viewBox="-1 -1 32 82" preserveAspectRatio="xMidYMin meet" aria-hidden="true">' + g + '</svg>';
  }

  /* ---- 6. masks: the layout peeled into its layers ---- */
  function masksView(D) {
    const B = D.B, Lo = layoutOf(D);
    if (!Lo) return box('masks', 'masks', 'bk-mk', '<p class="bk-note bad">' + esc(t('bench.cap.unread')) + '</p>');
    const quiz = CH && CH.kind === 'maskof', P = Lo.PL, [W, H] = dim('masks', 'masks'), narrow = o.px() < 480;
    const shapes = X.maskShapes(P, Lo.RT), ask = quiz ? X.maskAsk(shapes, S.bench.mq.k) : null;
    const plateW = W * (narrow ? 0.5 : 0.62), s = Math.min(plateW / P.GW, (H * 0.2) / P.H), pw = P.GW * s, ph = P.H * s;
    const shapeSvg = (sh, ox, oy, k) => { const Xp = x => ox + x * k, Yp = y => oy + y * k;
      if (sh.mask === 'cells') return '<rect class="mk-c" x="' + Xp(sh.x) + '" y="' + Yp(sh.y) + '" width="' + sh.w * k + '" height="' + sh.h * k + '" rx="2"/>';
      if (sh.mask === 'via') return '<rect class="mk-v" x="' + (Xp(sh.x + 0.5) - k * 0.25) + '" y="' + (Yp(sh.y + 0.5) - k * 0.25) + '" width="' + k * 0.5 + '" height="' + k * 0.5 + '"/>';
      return '<line class="mk-' + sh.mask + '" x1="' + Xp(sh.x1 + 0.5) + '" y1="' + Yp(sh.y1 + 0.5) + '" x2="' + Xp(sh.x2 + 0.5) + '" y2="' + Yp(sh.y2 + 0.5) + '" stroke-width="' + Math.max(2, k * 0.35 * o.px() / 1000).toFixed(2) + '"' + LINE + '/>'; };
    let g = '', tags = '';
    if (quiz) {
      /* the whole layout flat and faint, the shape asked about lit */
      const k = Math.min((W - 40) / P.GW, (H - 140) / P.H), ox = (W - P.GW * k) / 2, oy = 100;
      g += '<rect class="mk-plate" x="' + ox + '" y="' + oy + '" width="' + P.GW * k + '" height="' + P.H * k + '" rx="6"/>';
      g += '<g class="mk-faint">' + shapes.map(sh => shapeSvg(sh, ox, oy, k)).join('') + '</g>';
      if (ask) g += '<g class="mk-ask">' + shapeSvg(ask, ox, oy, k) + '</g>';
      tags += '<p class="bk-k bk-top">' + esc(t('bench.masks.which')) + '</p>';
    } else {
      /* one glass plate per layer, stacked and slanted; the slider spreads them apart. Each name stands past its plate's
         right edge at mid-height (the plate leans right by 0.55 of its depth, so half of that at the middle) */
      X.MASKS.forEach((m, i) => {
        const z = (X.MASKS.length - 1 - i), gap = 70 + peel * 150, oy = H - 170 - z * gap - ph * 0.42, ox = 24 + i * 18, lift = plate === m;
        const tf = 'matrix(1 0 -0.55 0.42 ' + (ox + ph * 0.55) + ' ' + (oy - (lift ? 40 : 0)) + ')';
        g += '<g class="mk-layer' + (plate && !lift ? ' dim' : '') + (lift ? ' lift' : '') + '" data-bk-plate="' + m + '"><g transform="' + tf + '"><rect class="mk-plate" x="0" y="0" width="' + pw + '" height="' + ph + '" rx="4"/>' +
          shapes.filter(sh => sh.mask === m).map(sh => shapeSvg(sh, 0, 0, s)).join('') + '</g></g>';
        tags += narrow ? tag(ox + ph * 0.55, oy - (lift ? 40 : 0) - 14, W, H, esc(t('design.layer.' + m)), 'l mk-t-' + m) : tag(ox + pw + ph * 0.275 + 14, oy - (lift ? 40 : 0) + ph * 0.21, W, H, esc(t('design.layer.' + m)), 'l mk-t-' + m);
      });
    }
    const side = '<p class="bk-k">' + esc(t('bench.masks.k')) + '</p><p class="bk-set">' + esc(t('bench.masks.set', { drawn: X.MASKS.length, n: SKY130_TOTAL, rest: SKY130_TOTAL - X.MASKS.length })) + '</p>' +
      (B.ok ? '' : '<p class="bk-say bad">' + esc(t('bench.masks.bad', { bad: B.bad, total: B.total })) + '</p>') +
      '<p class="bk-set muted">' + esc(t('bench.masks.next')) + '</p>';
    const ctl = quiz ? '' : '<label class="bk-scrub bk-peel"><span>' + esc(t('bench.masks.peel')) + '</span><input type="range" data-bk-peel min="0" max="100" step="1" value="' + Math.round(peel * 100) + '"></label>';
    return box('masks', 'masks', 'bk-mk', svgOf(W, H, g, 'bk-svg') + tags + ctl) + box('masks', 'reticle', 'bk-rt', side);
  }

  /* ---- the surface ---- */
  function html(st, opt) {
    const D = now(), id = st || step, f = { need, logic, check, gates: gatesView, layout: layoutView, masks: masksView }[id];
    if (!f) return '';
    return '<div class="bk bk-' + id + (D.ro ? ' ro' : '') + (opt && opt.inst ? ' inst' : '') + '" data-bk-step="' + id + '" data-bk-p="' + D.p + '">' + f(D, opt && opt.inst) + '</div>';
  }
  function render() {
    if (!on) return;
    const h = html(step), old = el.firstElementChild;
    if (!old || old.dataset.bkStep !== step) el.innerHTML = h;
    else { const tp = document.createElement('template'); tp.innerHTML = h; patch(old, tp.content.firstElementChild); }
    syncScroll();
  }
  /* the text box and its coloured copy scroll together */
  const syncScroll = () => { const ta = el.querySelector('[data-bk-code]'), pre = el.querySelector('.bk-hl'); if (ta && pre) { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; } };
  el.addEventListener('scroll', syncScroll, true);
  /* the job's patterns play one after another until you set the inputs yourself */
  const play = () => { clearInterval(timer); timer = setInterval(() => { if (!on || !el.isConnected || el.hidden) return; if (step === 'need' && live && !(CH && CH.kind === 'piece')) { k0++; render(); } }, 1400); };

  /* ---- what the visitor does ---- */
  function click(e) {
    const q = s => e.target.closest(s), D = now();
    const pk = q('[data-bk-pick]'); if (pk) { const b = S.bench, p = pk.dataset.bkPick; if (p !== b.p) { undo = []; S.bench = G.normalBench({ p }); S.bench.jq = b.jq; S.bench.floor = b.floor; S.bench.mq = b.mq; S.bench.jq.ans = {}; k0 = 0; pin = {}; G.benchDesign({ bench: { p } }).B.ins.slice(0, 1).forEach(n => { pin[n] = 1; }); tick = {}; gate = null; sel = null; why = null; scrub = 0; sub = 0; o.save(); changed(); } return true; }
    const ip = q('[data-bk-in]'); if (ip) { const n = ip.dataset.bkIn, R = X.jobRows(D.p); if (live) { live = false; pin = Object.assign({}, R[(k0 % R.length + R.length) % R.length].v); } pin[n] = pin[n] ? 0 : 1; changed(); return true; }
    const an = q('[data-bk-ans]'); if (an) { const a = S.bench.jq.ans || (S.bench.jq.ans = {}); a[an.dataset.bkAns] = a[an.dataset.bkAns] ? 0 : 1; o.save(); changed(); return true; }
    if (q('[data-bk-undo]')) { if (undo.length) { S.bench.code = undo.pop(); S.bench.rows = null; o.save(); changed(); } return true; }
    if (q('[data-bk-reset]')) { undo.push(S.bench.code); S.bench.code = null; S.bench.rows = null; o.save(); changed(); return true; }
    const ln = q('[data-bk-line]'); if (ln) { focusLine(+ln.dataset.bkLine); return true; }
    const wy = q('[data-bk-why]'); if (wy) { const [k, out] = wy.dataset.bkWhy.split(':'); why = why && why.k === +k && why.o === out ? null : { k: +k, o: out }; scrub = +k; changed(); return true; }
    const gl = q('[data-bk-goline]'); if (gl) { o.go && o.go('logic', +gl.dataset.bkGoline); return true; }
    const sb = q('[data-bk-sub]'); if (sb) { sub = +sb.dataset.bkSub; const n = D.B.rows ? D.B.rows.length : 0; if (sub >= n) sub = 0; changed(); return true; }
    const fl = q('[data-bk-flip]'); if (fl) { pin[fl.dataset.bkFlip] = pin[fl.dataset.bkFlip] ? 0 : 1; changed(); return true; }
    if (q('[data-bk-tick]')) { const v = {}; D.B.ins.forEach(n => { v[n] = pin[n] | 0; }); tick.st = simulate(D.B, v, tick.st || {}).next; changed(); return true; }
    const gt = q('[data-bk-gate]'); if (gt) { const i = +gt.dataset.bkGate; gate = gate === i ? null : i; changed(); return true; }
    const cl = q('[data-bk-cell]'); if (cl && !dragMoved) { const i = +cl.dataset.bkCell; if (D.ro && !D.floor) return true; if (sel == null || sel === i) { sel = sel === i ? null : i; changed(); } else swap(D, sel, i); return true; }
    if (q('[data-bk-placer]')) { if (D.floor) S.bench.floor = null; else S.bench.rows = null; sel = null; o.save(); changed(); return true; }
    const pl = q('[data-bk-plate]'); if (pl) { plate = plate === pl.dataset.bkPlate ? null : pl.dataset.bkPlate; changed(); return true; }
    return false;
  }
  function input(e) {
    const ta = e.target.closest('[data-bk-code]'); if (ta) { clearTimeout(input.t); const v = ta.value; input.t = setTimeout(() => setCode(v), 90); return true; }
    const sc = e.target.closest('[data-bk-scrub]'); if (sc) { scrub = +sc.value; changed(); return true; }
    const pe = e.target.closest('[data-bk-peel]'); if (pe) { peel = +pe.value / 100; changed(); return true; }
    return false;
  }
  function swap(D, a, b) {
    const Lo = layoutOf(D), R = X.swapCells(D.B.M, Lo.rows, a, b, D.B.PL.W); sel = null;
    if (R) { flash = [a, b]; setRows(D, R); setTimeout(() => { flash = null; render(); }, 700); changed(); } else changed();
  }
  /* drag a cell onto another (or onto a row with room) */
  let drag = null, dragMoved = false;
  function down(e) {
    const c = e.target.closest('[data-bk-cell]'); dragMoved = false; if (!c) return;
    const D = now(); if (D.ro && !D.floor) return;
    drag = { i: +c.dataset.bkCell, x: e.clientX, y: e.clientY, node: c }; try { c.setPointerCapture(e.pointerId); } catch (x) { /* no capture */ }
  }
  function move(e) { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) dragMoved = true;
    /* the drawing's own units: the cell follows the finger on the screen */
    if (dragMoved) { const sv = drag.node.ownerSVGElement, r = sv && sv.getBoundingClientRect(), k = r && r.width ? sv.viewBox.baseVal.width / r.width : 1; drag.node.setAttribute('transform', 'translate(' + (dx * k).toFixed(1) + ' ' + (dy * k).toFixed(1) + ')'); drag.node.classList.add('drag'); } }
  function up(e) {
    if (!drag) return; const d = drag; drag = null; d.node.removeAttribute('transform'); d.node.classList.remove('drag');
    if (!dragMoved) return;
    d.node.style.pointerEvents = 'none'; const under = document.elementFromPoint(e.clientX, e.clientY); d.node.style.pointerEvents = '';
    const D = now(), c = under && under.closest('[data-bk-cell]'), r = under && under.closest('[data-bk-row]');
    if (c && +c.dataset.bkCell !== d.i) swap(D, d.i, +c.dataset.bkCell);
    else if (r) { const Lo = layoutOf(D), R = X.moveCell(D.B.M, Lo.rows, d.i, +r.dataset.bkRow, D.B.PL.W); if (R) { flash = [d.i]; setRows(D, R); setTimeout(() => { flash = null; changed(); }, 700); changed(); } else changed(); }
    setTimeout(() => { dragMoved = false; }, 0);
  }
  const focusLine = l => { const ta = el.querySelector('[data-bk-code]'); if (!ta) return; const L = ta.value.split('\n'), at = L.slice(0, Math.max(0, l - 1)).join('\n').length + (l > 1 ? 1 : 0); ta.focus(); ta.setSelectionRange(at, at + (L[l - 1] || '').length); };
  const wire = node => { node.addEventListener('click', e => { if (click(e)) e.stopPropagation(); }); node.addEventListener('input', e => { if (input(e)) e.stopPropagation(); });
    node.addEventListener('pointerdown', down); node.addEventListener('pointermove', move); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up); };
  wire(el);
  listeners.add(render);

  const api = {
    el,
    /* the surface on or off (the bench shown, or another view) */
    show(v) { on = !!v; el.hidden = !on; if (on) { render(); play(); } else clearInterval(timer); },
    step(id) { if (!STEPS.includes(id) || id === step) return; step = id; why = null; plate = null; sel = null; gate = null; render(); },
    get stepNow() { return step; },
    /* the square the step is drawn in (the flat world's frame): the surface takes it, exactly */
    place(f) { if (!f || !f.B) return; const s = el.style, B = Math.round(f.B), h = Math.round(Math.max(B, f.h || B)); s.width = B + 'px'; s.height = h + 'px'; s.left = Math.round(f.cx - B / 2) + 'px'; s.top = Math.round(f.top != null ? f.top : f.cy - h / 2) + 'px';
      if (api.px !== B || api.ph !== h) { api.px = B; api.ph = h; ASP = h / B; render(); } },
    ph: 0,
    px: 0,
    /* while the step line moves, the surface slides with it and fades between two steps */
    slide(dz) { const a = Math.min(1, Math.abs(dz) * 2.2); el.style.transform = dz ? 'translateX(' + (-dz * 106).toFixed(2) + '%)' : ''; el.style.opacity = String(1 - a * 0.85); },
    challenge(ch) { CH = ch || null; if (ch && ch.kind === 'piece') S.bench.jq.ans = S.bench.jq.ans || {}; render(); },
    html, click, input, down, move, up, now, layoutOf, caption: id => caption(id || step, now(), (id || step) === 'layout' || (id || step) === 'masks' ? layoutOf(now()) : null),
    /* call f after every change of the design (the card's words, a challenge's card) */
    listen(f) { listeners.add(f); return () => listeners.delete(f); },
    changed, render, focusLine
  };
  o.px = () => api.px || 600;
  return api;
}
