/* Grow an architecture, played in the stack's Do (#450; docs/PATH.md "How it joins the lab"): the architecture lab's own
   race and map of 400 retire into the stack, whose growth bar (the dock) and field already do both; what stays is played
   here, in the card's Do face for the whole stack: its two challenges (src/engines/arch.js GOALS: beat today's computer
   at one need, then at three at once, each with a recipe nobody has built, at least two genes from today's, within its
   years), the family tree of every start and fork, the curve of your best need against the attempts so far (Wright's
   law's shape) and keeping the attempt in the community's ledger. Ported from the lab (src/v2/labs/arch.js, kept as it
   was on the branch claude/before-stack-2026-11) by Claude Opus 5.5 in the nightly build. HTML only, no state: the view
   (src/v2/stack/view.js) holds your stack and routes the clicks (data-sk-node, data-sk-keep).

   growHtml(c): c = { st, tree, done(id), title(id), keep: { on, slip, no, sign } }: st the architecture grown on your
   stack (arch.js state), tree its family tree (arch.js treeOf), done a challenge won, title its name, keep what the
   ledger's form shows (the slip of the attempt kept, a refusal, the signature's field). */
import * as A from '../../engines/arch.js';
import { t } from '../../core/i18n.js';
import { esc } from '../../core/esc.js';
import { mark as fidMark } from '../fid.js';

export const GOAL_IDS = ['archniche', 'archspread'];
const f1 = v => (+v).toFixed(1);
const opt = (k, id) => t('ar.opt.' + k + '.' + id);
const pct = v => (v >= 1 ? '×' + (v < 10 ? v.toFixed(1) : Math.round(v)) : v < 0.01 ? '<1%' : Math.round(v * 100) + '%');
const gname = g => (A.novelty(g) ? A.GENES.filter(k => g[k] !== A.TODAY[k]).map(k => opt(k, g[k])).join(' · ') : t('ar.tree.today'));

/* a challenge's goal, gauge by gauge: needs won, nobody has built it, genes from today's, years */
export function goalHtml(st, id, title, won) {
  const G = A.goalOf(st, id), late = st.year > G.years, nov = A.novelty(st.g);
  const rows = [
    ['wins', G.wins >= G.needs, t('ar.of', { n: Math.min(G.wins, G.needs), of: G.needs }), Math.min(1, G.wins / G.needs)],
    ['fresh', G.fresh && nov > 0, t(G.fresh && nov > 0 ? 'ar.yes' : 'ar.no'), G.fresh && nov > 0 ? 1 : 0],
    ['far', G.far, t('ar.of', { n: nov, of: 2 }), Math.min(1, nov / 2)],
    ['years', !late, t('ar.of', { n: st.year, of: G.years }), Math.min(1, st.year / G.years)]];
  return '<div class="goalbox sk-goal' + (G.met || won ? ' ok' : '') + '" data-sk-goal="' + id + '"' + (won ? ' data-won' : '') + '><p class="kicker">' + esc(title) + (won ? ' · ' + esc(t('game.reached')) : '') + '</p>' + rows.map(([k, ok, v, b]) =>
    '<div class="gauge' + (ok && k !== 'years' ? ' ok' : '') + (k === 'years' ? (late ? ' bad' : ' warmg') : '') + '" data-argoal="' + k + '"><span class="gl">' + (ok && k !== 'years' ? '✓ ' : '') + esc(t('ar.g.' + k)) + '</span><span class="gv">' + esc(v) + '</span><span class="gbar"><span style="width:' + (b * 100).toFixed(0) + '%"></span></span></div>').join('') +
    (won ? '<p class="small good">' + esc(t('ar.done.' + id)) + '</p>' : '') + '</div>';
}

/* the curve of attempts: your best need against the attempts so far, both on powers of ten; a dot where a need was won,
   a tick where you forked */
export function curveHtml(st, tree) {
  const h = '<div class="sk-curve"><p class="kicker">' + esc(t('ar.curve.kicker')) + '</p>';
  if (!A.novelty(st.g) || !st.log.length) return h + '<p class="small muted">' + esc(t(A.novelty(st.g) ? 'ar.curve.empty' : 'ar.curve.today')) + '</p></div>';
  let sum = 0; const pts = st.log.map(e => { sum += e.attempts; return { n: sum, v: Math.max(1e-4, e.best || 1e-4), fresh: e.fresh, year: e.year }; });
  const W = 320, H = 178, L0 = 40, R0 = 14, T0 = 16, B0 = 36;
  const nl = Math.floor(Math.log10(pts[0].n)), nh = Math.max(nl + 2, Math.ceil(Math.log10(pts[pts.length - 1].n) + 1e-9));
  const vs = pts.map(p => p.v), vl = Math.min(-1, Math.floor(Math.log10(Math.min(...vs)))), vh = Math.max(1, Math.ceil(Math.log10(Math.max(...vs)) + 1e-9));
  const X = n => L0 + (W - L0 - R0) * (Math.log10(n) - nl) / (nh - nl), Y = v => T0 + (H - T0 - B0) * (1 - (Math.log10(v) - vl) / (vh - vl));
  let g = '';
  for (let e = nl; e <= nh; e++) g += '<line class="gl" x1="' + f1(X(10 ** e)) + '" x2="' + f1(X(10 ** e)) + '" y1="' + T0 + '" y2="' + (H - B0) + '"/><text class="ax" x="' + f1(X(10 ** e)) + '" y="' + (H - B0 + 13) + '" text-anchor="middle">10<tspan dy="-0.42em" font-size="72%">' + e + '</tspan></text>';
  for (let e = vl; e <= vh; e++) g += '<line class="gl" x1="' + L0 + '" x2="' + (W - R0) + '" y1="' + f1(Y(10 ** e)) + '" y2="' + f1(Y(10 ** e)) + '"/><text class="ax" x="' + (L0 - 5) + '" y="' + f1(Y(10 ** e) + 3) + '" text-anchor="end">×' + (e < 0 ? (10 ** e).toFixed(-e) : String(10 ** e)) + '</text>';
  g += '<line class="today" x1="' + L0 + '" x2="' + (W - R0) + '" y1="' + f1(Y(1)) + '" y2="' + f1(Y(1)) + '"/><text class="tl" x="' + (L0 + 4) + '" y="' + f1(Y(1) - 4) + '">' + esc(t('ar.race.today')) + '</text>';
  A.lineOf(tree).filter(n => n.how === 'fork' && n.at > 0 && n.at <= pts.length).forEach(n => { const x = X(pts[n.at - 1].n);
    g += '<line class="fk" x1="' + f1(x) + '" x2="' + f1(x) + '" y1="' + T0 + '" y2="' + (H - B0) + '"/><text class="fkl" x="' + f1(x + 3) + '" y="' + (T0 + 8) + '">' + esc(t('ar.curve.fork')) + '</text>'; });
  const d = pts.map((p, i) => (i ? 'L' : 'M') + f1(X(p.n)) + ' ' + f1(Y(p.v))).join('');
  g += '<path class="cv" d="' + d + '"/>' + pts.map((p, i) => (p.fresh.length ? '<circle class="cw" cx="' + f1(X(p.n)) + '" cy="' + f1(Y(p.v)) + '" r="4.2"><title>' + esc(t('ar.curve.win', { y: p.year, need: p.fresh.map(x => t('ar.need.' + x)).join(t('ar.and')) })) + '</title></circle>' : i === pts.length - 1 ? '<circle class="cn" cx="' + f1(X(p.n)) + '" cy="' + f1(Y(p.v)) + '" r="3.4"/>' : '')).join('');
  g += '<text class="ay" x="' + L0 + '" y="10">' + esc(t('ar.curve.y')) + '</text><text class="ay" x="' + f1((L0 + W - R0) / 2) + '" y="' + (H - 3) + '" text-anchor="middle">' + esc(t('ar.curve.x')) + '</text>';
  return h + '<figure><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('ar.curve.aria', { n: Math.round(sum), v: pct(pts[pts.length - 1].v) })) + '">' + g + '</svg></figure>' +
    '<p class="small muted">' + esc(t('ar.curve.lead', { x: (+Math.pow(2, A.GROWTH).toFixed(2)).toString() })) + ' ' + fidMark({ f: 'figures', fact: A.GROWTH_FACT }) + '</p></div>';
}

/* the family tree: every start and fork; tap one to start again from it. A node is its recipe as a glyph (four squares,
   lit where it differs from today's computer), the year it was made and the needs it won */
function glyph(key, x, y, z) {
  const g = A.recipeOf(key), q = z / 2 - 1;
  return A.GENES.map((k, i) => '<rect class="gq' + (g[k] !== A.TODAY[k] ? ' on' : '') + '" x="' + f1(x + (i % 2) * (q + 2)) + '" y="' + f1(y + Math.floor(i / 2) * (q + 2)) + '" width="' + f1(q) + '" height="' + f1(q) + '" rx="1.4"/>').join('');
}
export function treeHtml(T) {
  const kids = {}, pos = {}, line = new Set(A.lineOf(T).map(n => n.id));
  T.nodes.forEach(n => { const p = n.from == null ? 'root' : n.from; (kids[p] = kids[p] || []).push(n); });
  let row = 0, deep = 0;
  const walk = (n, d) => { pos[n.id] = [d, row]; deep = Math.max(deep, d); const ks = kids[n.id] || []; if (!ks.length) row++; ks.forEach(k => walk(k, d + 1)); };
  (kids.root || []).forEach(n => walk(n, 0));
  const CW = 58, RH = 40, Z = 16, W = 20 + (deep + 1) * CW, H = row * RH + 6, at = id => [14 + pos[id][0] * CW + Z / 2, 14 + pos[id][1] * RH];
  const made = n => (n.how === 'fork' ? t('ar.tree.at', { y: n.at }) : t('ar.tree.' + n.how));
  const label = n => gname(A.recipeOf(n.g)) + ' · ' + made(n) + (n.won.length ? ' · ' + t('ar.tree.won', { needs: n.won.map(x => t('ar.need.' + x)).join(t('ar.and')) }) : '');
  let e = '', v = '';
  T.nodes.forEach(n => { if (n.from == null || !pos[n.from]) return; const [px, py] = at(n.from), [cx, cy] = at(n.id), mx = px + Z / 2 + (CW - Z) / 2;
    e += '<path class="te' + (n.how === 'back' ? ' tback' : '') + (line.has(n.id) && line.has(n.from) ? ' on' : '') + '" d="M' + f1(px + Z / 2) + ' ' + py + 'H' + f1(mx) + 'V' + cy + 'H' + f1(cx - Z / 2 - 1) + '"/>'; });
  T.nodes.forEach(n => { if (!pos[n.id]) return; const [cx, cy] = at(n.id), cur = n.id === T.cur;
    v += '<g class="tn' + (cur ? ' cur' : '') + '" data-sk-node="' + n.id + '" tabindex="0" role="button" aria-label="' + esc(label(n)) + '"' + (cur ? ' aria-current="true"' : '') + '><title>' + esc(label(n)) + '</title>' +
      '<rect class="tring" x="' + f1(cx - Z / 2 - 3) + '" y="' + (cy - Z / 2 - 3) + '" width="' + (Z + 6) + '" height="' + (Z + 6) + '" rx="5"/>' + glyph(n.g, cx - Z / 2, cy - Z / 2, Z) +
      '<text class="tl" x="' + f1(cx) + '" y="' + (cy + Z / 2 + 11) + '" text-anchor="middle">' + esc(n.how === 'fork' ? t('ar.tree.y', { y: n.at }) : t('ar.tree.' + n.how + '.s')) + (n.won.length ? ' ✓' + n.won.length : '') + '</text></g>'; });
  return '<div class="sk-tree"><p class="kicker">' + esc(t('ar.tree.kicker', { n: T.nodes.length })) + '</p><p class="small muted">' + esc(t('ar.tree.lead')) + '</p>' +
    '<figure><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:' + Math.round(W * 1.4) + 'px" role="group" aria-label="' + esc(t('ar.tree.aria', { n: T.nodes.length })) + '">' + e + v + '</svg></figure></div>';
}

/* keep this attempt in the ledger: once a recipe nobody has grown is grown a year */
export function keepHtml(st, k) {
  if (!k || !k.on) return '';
  if (k.slip) return '<div class="sk-kept">' + k.slip + '</div>';
  const wins = A.winsOf(st), lead = wins.length ? t('ar.keep.lead', { needs: wins.map(n => t('ar.need.' + n)).join(t('ar.and')), y: st.year }) : t('ar.keep.leadNone', { y: st.year });
  return '<div class="keep sk-keep"><p class="kicker">' + esc(t('ar.keep.kicker')) + '</p><p class="small muted">' + esc(lead) + '</p>' + (k.sign || '') +
    (k.no ? '<p class="small bad">' + esc(k.no) + '</p>' : '') + '<button type="button" class="btn" data-sk-keep>' + esc(t('ar.keep')) + '</button></div>';
}

export function growHtml(c) {
  const st = c.st;
  return '<div class="sk-grow"><p class="small">' + esc(t('ar.grow.lead')) + '</p>' + GOAL_IDS.map(id => goalHtml(st, id, c.title(id), c.done(id))).join('') +
    curveHtml(st, c.tree) + keepHtml(st, c.keep) + treeHtml(c.tree) + '</div>';
}
