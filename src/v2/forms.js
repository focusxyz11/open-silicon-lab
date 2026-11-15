/* Forms: one design in every form it takes, at once (content/idea.md, the visual system of "how could your idea
   become a chip?"). Not stations in a row: the job, the description, what it does, its gates, its layout and its
   masks side by side, all from one run of the Design flow engine (src/engines/design.js). Change the description
   and every form follows; touch a signal in any form and it lights in all of them: its words in the description,
   its column in the table, the gates that make it, their cells and wires in the layout and on the masks. Under each
   form, one line says who made that step. Words: forms.*, and the studio's own design.*. */
import { t, fmtNum } from '../core/i18n.js';
import { build, starterOf, solutionOf } from '../engines/design.js';
import { TWO_WAYS } from './probes.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const JOBS = ['half', 'vote', 'full'];
/* the descriptions to start from: the lab's own (with a bug to find), a right one, and another right one */
const VERSIONS = ['starter', 'right', 'other'];
const S = { p: 'full', v: 'right', code: null, sel: null, edit: false };
/* another right one: of the descriptions the lab keeps for this job, one that makes a different chip from the right one
   shown (fewer or more switches): the engine decides which */
const other = p => { const base = build({ p, code: solutionOf(p) }).transistors; return (TWO_WAYS[p] || []).find(c => build({ p, code: c }).transistors !== base) || solutionOf(p); };
const codeOf = (p, v) => (v === 'starter' ? starterOf(p) : v === 'right' ? solutionOf(p) : other(p));

/* the cone of a signal: the cells that make it, back to the inputs */
function cone(B, name) {
  const net = (B.M.outs.find(o => o.name === name) || B.M.inputs.find(i => i.name === name) || {}).net;
  const by = {}, out = new Set(), nets = new Set();
  B.M.cells.forEach((c, i) => (by[c.out] = i));
  (function back(n) { if (n == null || nets.has(n)) return; nets.add(n); const ci = by[n]; if (ci == null) return; out.add(ci); B.M.cells[ci].ins.forEach(back); })(net);
  return { cells: out, nets, net };
}
const sigBtn = (name, cls) => '<button type="button" class="fsig' + (S.sel === name ? ' on' : '') + (cls ? ' ' + cls : '') + '" data-fsig="' + esc(name) + '">' + esc(name) + '</button>';

function jobForm(B) {
  return '<p class="fjob"><b>' + esc(t('design.proj.' + B.p + '.t')) + '</b> ' + esc(t('forms.job.' + B.p)) + '</p><p class="small">' + esc(t('forms.ins')) + ' ' + B.ins.map(n => sigBtn(n)).join(' ') + '</p><p class="small">' + esc(t('forms.outs')) + ' ' + B.outs.map(n => sigBtn(n, 'out')).join(' ') + '</p>';
}
function descForm(B) {
  if (S.edit) return '<textarea class="fcode" data-fcode spellcheck="false" aria-label="' + esc(t('forms.code')) + '">' + esc(S.code) + '</textarea>' + (B.errs.length ? '<p class="small bad">' + esc(t('forms.errs', { n: B.errs.length })) + '</p>' : '');
  const names = new Set(B.ins.concat(B.outs).concat(Object.keys(B.D && B.D.asg || {})));
  return '<pre class="fcode">' + S.code.split('\n').map(line => line.replace(/[A-Za-z_][A-Za-z0-9_]*|[^A-Za-z_]+/g, w => (B.ins.includes(w) || B.outs.includes(w) ? sigBtn(w, B.outs.includes(w) ? 'out' : '') : names.has(w) ? '<span class="fn">' + esc(w) + '</span>' : esc(w)))).join('\n') + '</pre>';
}
function tableForm(B) {
  if (!B.rows.length) return '<p class="small muted">—</p>';
  const cols = B.ins.concat(B.outs);
  return '<div class="ftw"><table class="ftab"><thead><tr>' + cols.map(n => '<th class="' + (S.sel === n ? 'on' : '') + '">' + sigBtn(n, B.outs.includes(n) ? 'out' : '') + '</th>').join('') + '</tr></thead><tbody>' +
    B.rows.map(r => '<tr>' + B.ins.map(n => '<td class="' + (S.sel === n ? 'on' : '') + '">' + r.v[n] + '</td>').join('') + B.outs.map(n => '<td class="o' + ((r.mis || []).includes(n) ? ' bad' : '') + (S.sel === n ? ' on' : '') + '">' + r.o[n] + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}
/* the gates, in columns by how many gates stand before them */
function gatesForm(B, K) {
  const M = B.M, L = B.levels || [], depth = Math.max(1, ...L), cols = {}, at = {};
  M.cells.forEach((c, i) => (cols[L[i] || 1] = cols[L[i] || 1] || []).push(i));
  const W = 250, H = 180, colX = l => 30 + (l - 0.5) * ((W - 80) / depth), y = (k, n) => 18 + (k + 0.5) * ((H - 30) / n);
  M.inputs.forEach((p, k) => (at[p.net] = [16, y(k, M.inputs.length)]));
  Object.entries(cols).forEach(([l, list]) => list.forEach((ci, k) => (at[M.cells[ci].out] = [colX(+l) + 22, y(k, list.length)])));
  let s = '<svg class="fgates" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('forms.gatesAria', { n: M.cells.length })) + '">';
  Object.entries(cols).forEach(([l, list]) => list.forEach((ci, k) => { const c = M.cells[ci], x = colX(+l), yy = y(k, list.length), on = K && K.cells.has(ci);
    c.ins.forEach((n, j) => { const [sx, sy] = at[n] || [16, yy]; const ty = yy - 6 + j * (12 / Math.max(1, c.ins.length - 1)); s += '<path class="fw' + (on && K.nets.has(n) ? ' on' : '') + '" d="M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' C' + (sx + 18).toFixed(1) + ' ' + sy.toFixed(1) + ' ' + (x - 18).toFixed(1) + ' ' + ty.toFixed(1) + ' ' + x.toFixed(1) + ' ' + ty.toFixed(1) + '"/>'; });
    s += '<rect class="fg' + (on ? ' on' : '') + '" x="' + x.toFixed(1) + '" y="' + (yy - 11).toFixed(1) + '" width="44" height="22" rx="6"/><text x="' + (x + 22).toFixed(1) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="middle">' + esc(c.type.replace(/\d$/, '')) + '</text>'; }));
  M.inputs.forEach(p => { const [x, yy] = at[p.net]; s += '<text x="' + (x - 6) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end" class="fio' + (S.sel === p.name ? ' on' : '') + '">' + esc(p.name) + '</text><circle cx="' + x + '" cy="' + yy.toFixed(1) + '" r="3" class="fpin"/>'; });
  M.outs.forEach(o => { const src = at[o.net]; if (!src) return; s += '<path class="fw' + (K && K.net === o.net ? ' on' : '') + '" d="M' + (src[0] + 22).toFixed(1) + ' ' + src[1].toFixed(1) + ' H' + (W - 40) + '"/><text x="' + (W - 36) + '" y="' + (src[1] + 4).toFixed(1) + '" class="fio' + (S.sel === o.name ? ' on' : '') + '">' + esc(o.name) + '</text>'; });
  return s + '</svg>';
}
/* the placed cells and their wires, from the engine's placement and router; layers: which to draw */
function tileSvg(B, K, layers, cls) {
  const P = B.PL, RT = B.RT, M = B.M, s = 10, W = P.GW * s, H = P.H * s, X = x => x * s, Y = y => y * s, on = k => layers.includes(k);
  let g = '<svg class="' + cls + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
  if (on('cells')) { for (let r = 0; r < P.rows; r++) g += '<rect class="frow" x="' + X(2) + '" y="' + Y(r * P.TR + 1) + '" width="' + (P.GW - 4) * s + '" height="' + 3 * s + '"/>';
    M.cells.forEach((c, i) => { const p = P.pos[i]; if (p) g += '<rect class="fcell' + (K && K.cells.has(i) ? ' on' : '') + '" x="' + (X(2 + p.x) + 1) + '" y="' + (Y(p.r * P.TR + 1) + 1) + '" width="' + (p.w * s - 2) + '" height="' + (3 * s - 2) + '" rx="2"/>'; }); }
  Object.entries(RT.paths).forEach(([net, segs]) => segs.forEach(path => { for (let k = 1; k < path.length; k++) {
    const a = path[k - 1], b = path[k], la = a % 2, lb = b % 2, ca = (a - la) / 2, cb = (b - lb) / 2, ax = ca % P.GW, ay = (ca - ax) / P.GW, bx = cb % P.GW, by = (cb - bx) / P.GW, hit = K && K.nets.has(+net) ? ' on' : '';
    if (la !== lb) { if (on('via')) g += '<rect class="fvia' + hit + '" x="' + (X(ax + 0.5) - 2) + '" y="' + (Y(ay + 0.5) - 2) + '" width="4" height="4"/>'; continue; }
    if ((la === 1 && on('m1')) || (la === 0 && on('m2'))) g += '<line class="' + (la === 1 ? 'fm1' : 'fm2') + hit + '" x1="' + X(ax + 0.5) + '" y1="' + Y(ay + 0.5) + '" x2="' + X(bx + 0.5) + '" y2="' + Y(by + 0.5) + '"/>';
  } }));
  if (on('pins')) Object.values(P.ioIn).concat(Object.values(P.ioOut)).forEach(p => (g += '<rect class="fpinr" x="' + X(p.x) + '" y="' + Y(p.y) + '" width="' + s + '" height="' + s + '"/>'));
  return g + '</svg>';
}
function masksForm(B, K) {
  return '<div class="fmasks">' + ['cells', 'm1', 'via', 'm2'].map(ly => '<figure class="fplate">' + tileSvg(B, K, [ly, 'pins'], 'fmask') + '<figcaption>' + esc(t('design.layer.' + ly)) + '</figcaption></figure>').join('') + '</div>';
}

export function formsHtml() {
  if (S.code == null) S.code = codeOf(S.p, S.v);
  const B = build({ p: S.p, code: S.code }), ok = !B.errs.length && B.M, K = ok && S.sel ? cone(B, S.sel) : null;
  const made = (k, vars) => '<p class="fmade small">' + esc(t('forms.made.' + k, vars)) + '</p>';
  let h = '<section class="formsbox" data-forms>';
  h += '<div class="fctl"><div class="pctl"><span class="small"><b>' + esc(t('probe.two.job')) + '</b></span><div class="chips">' + JOBS.map(p => '<button type="button" class="chipb" data-fjob="' + p + '" aria-pressed="' + (S.p === p) + '">' + esc(t('design.proj.' + p + '.t')) + '</button>').join('') + '</div></div>' +
    '<div class="pctl"><span class="small"><b>' + esc(t('forms.version')) + '</b></span><div class="chips">' + VERSIONS.map(v => '<button type="button" class="chipb" data-fver="' + v + '" aria-pressed="' + (!S.edit && S.v === v) + '">' + esc(t('forms.v.' + v)) + '</button>').join('') + '<button type="button" class="chipb" data-fedit aria-pressed="' + S.edit + '">' + esc(t('forms.write')) + '</button></div></div></div>';
  const state = B.errs.length ? t('forms.state.errs', { n: B.errs.length }) : B.bad ? t('forms.state.wrong', { bad: B.bad, total: B.total }) : t('forms.state.right', { total: B.total });
  h += '<p class="fstate ' + (B.errs.length || B.bad ? 'bad' : 'ok') + '">' + esc(state) + (ok ? ' ' + esc(t('forms.size', { gates: B.M.cells.length, tr: B.transistors, ps: B.st ? B.st.crit : 0 })) : '') + '</p>';
  if (S.sel) h += '<p class="small fhint">' + esc(t('forms.lit', { name: S.sel })) + ' <button type="button" class="chipb" data-fsig="">' + esc(t('forms.unlight')) + '</button></p>'; else h += '<p class="small muted fhint">' + esc(t('forms.touch')) + '</p>';
  const box = (k, body, foot) => '<article class="fform"><h3>' + esc(t('forms.f.' + k)) + '</h3>' + body + (foot || '') + '</article>';
  h += '<div class="fgrid">';
  h += box('job', jobForm(B), made('job'));
  h += box('desc', descForm(B), made(S.edit ? 'descYou' : 'descLab'));
  h += box('does', tableForm(B), made('does', { total: B.total, bad: B.bad }));
  h += box('gates', ok ? gatesForm(B, K) : '<p class="muted">—</p>', ok ? made('gates', { gates: B.M.cells.length, tr: B.transistors, ps: B.st ? B.st.crit : 0 }) : '');
  h += box('layout', ok && B.PL ? tileSvg(B, K, ['cells', 'm1', 'via', 'm2', 'pins'], 'flayout') : '<p class="muted">—</p>', ok && B.RT ? made('layout', { wire: B.RT.wl, vias: B.RT.vias }) : '');
  h += box('masks', ok && B.PL ? masksForm(B, K) : '<p class="muted">—</p>', ok ? made('masks', { n: B.masks }) : '');
  return h + '</div><p class="small muted">' + esc(t('forms.how')) + '</p></section>';
}

/* something was touched: a job, a version, a signal, or the text being written */
let typing = null;
export function formsInput(el) {
  const box = el.closest('[data-forms]'); if (!box) return false;
  if (el.matches('[data-fcode]')) { S.code = el.value; clearTimeout(typing); typing = setTimeout(() => { const ta = document.querySelector('[data-forms] [data-fcode]'); redraw(box, '[data-fcode]', ta ? ta.selectionStart : null); }, 250); return true; }   // i18n-ok: a selector
  if (el.dataset.fjob) { S.p = el.dataset.fjob; S.code = codeOf(S.p, S.v); S.sel = null; S.edit = false; }
  else if (el.dataset.fver) { S.v = el.dataset.fver; S.code = codeOf(S.p, S.v); S.edit = false; }
  else if (el.hasAttribute('data-fedit')) S.edit = !S.edit;
  else if (el.dataset.fsig != null) S.sel = el.dataset.fsig && S.sel !== el.dataset.fsig ? el.dataset.fsig : null;
  else return false;
  redraw(box, el.dataset.fjob ? '[data-fjob="' + el.dataset.fjob + '"]' : el.dataset.fver ? '[data-fver="' + el.dataset.fver + '"]' : el.hasAttribute('data-fedit') ? '[data-fedit]' : null);
  return true;
}
function redraw(box, focus, caret) {
  const live = document.body.contains(box) ? box : document.querySelector('[data-forms]'); if (!live) return;
  const w = document.createElement('div'); w.innerHTML = formsHtml(); const fresh = w.firstElementChild; live.replaceWith(fresh);
  const f = focus && fresh.querySelector(focus); if (f) { f.focus(); if (caret != null && f.setSelectionRange) f.setSelectionRange(caret, caret); }
}
