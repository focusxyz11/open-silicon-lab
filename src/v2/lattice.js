/* The lattice (#411): the Map's second arrangement (#/log/lattice[/<path>]). Across, kinds of matter; up, layers from
   physics to intelligence. Each cell lists what the lab has there (its challenges, levels and pages, read from the
   lab's own data by id), says whether the thing is real elsewhere (a fact with its source) or still open, or that this
   matter climbs past the layer. One of six paths can be lit at a time: its cells numbered, the things of the lab it
   passes lit, and a wire drawn from cell to cell in the gutters between them. On a narrow screen it is one column of
   matter at a time. The data is src/data/lattice.js; the Map (src/v2/glue/pages.js) draws it and keeps its state. */
import { t, has } from '../core/i18n.js';
import { esc } from '../core/esc.js';
import { REPO } from '../data/weave.js';
import { MATTERS, LAYERS, PAGES, PATHS, cellOf, cellKey, pathOf, itemOf } from '../data/lattice.js';
import { GENE_RUNGS, LAYER } from '../data/path.js';
import { statusMark, mark } from './fid.js';

const SHOW = 3;   /* the challenges a cell shows before the rest fold away */
const SVGNS = 'http://www.w3.org/2000/svg';

/* o: { path, matter, FACT, been, chOf, titleOf, doHref, isDone, levelHref(place, depth), proposals }. proposals: the open
   genome's (#452), the ledger's gene entries, each shown in the open column (yours) at the layer of the first rung its
   gene chooses (src/data/path.js GENE_RUNGS, LAYER), marked a guess until a fact backs it */
export const layerOfGene = g => (GENE_RUNGS[g] ? LAYER[GENE_RUNGS[g][0]] : null);
export function latticeHtml(o) {
  const P = pathOf(o.path), marks = new Set(P ? P.marks : []), step = new Map();
  if (P) P.strands.flat().forEach(c => { if (!step.has(c)) step.set(c, step.size + 1); });
  const inPath = new Set(P ? P.strands.flat().map(c => c.split('.')[0]) : []);
  const m0 = MATTERS.includes(o.matter) ? o.matter : 'silicon', B = o.been || {};
  const name = m => t('page.lat.m.' + m + '.t'), lname = l => t('page.lat.l.' + l + '.t');

  const itemHtml = (s, dup) => {
    const [k, id] = itemOf(s), mk = marks.has(s) ? ' mk' : '';
    if (k === 'ch') { const c = o.chOf(id); if (!c) return null;
      return { k, html: '<li class="' + (o.isDone(c.id) ? 'done' : '') + mk + '"><a href="' + esc(o.doHref(c)) + '"><i></i>' + esc(o.titleOf(c)) + '</a></li>' }; }
    if (k === 'lv') { const [p, d] = id.split('/'), h = o.levelHref(p, d); if (!h) return null;
      /* a level named alike in another place of the same cell (the chip of a phone, of a car) says its place */
      const nm = t('depth.' + d + '.name');
      return { k, html: '<a class="' + (B[h] ? 'been' : '') + mk + '" href="' + esc(h) + '" title="' + esc(t('map.' + p + '.t')) + '">' + esc(nm) + (dup(nm) ? ' <small>' + esc(t('map.' + p + '.t')) + '</small>' : '') + '</a>' }; }
    const g = PAGES[id]; return g ? { k, html: '<a class="lat-go' + mk + '" href="' + esc(g.href) + '">' + esc(t(g.word)) + ' →</a>' } : null;
  };
  const factHtml = id => { const f = o.FACT && o.FACT[id]; if (!f) return '';
    return '<p class="lat-fact"><b>' + esc(f.label) + '</b> ' + esc(f.value) + ' <a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('page.lat.source', { name: f.source })) + '</a></p>'; };

  const cellHtml = (m, l) => {
    const key = cellKey(m, l), c = cellOf(m, l), n = step.get(key);
    /* the things the path passes come first, so they are never folded away */
    const names = c.has.filter(x => x.startsWith('lv:')).map(x => t('depth.' + x.split('/')[1] + '.name')), dup = nm => names.filter(x => x === nm).length > 1;
    const items = c.has.slice().sort((a, b) => marks.has(b) - marks.has(a)).map(x => itemHtml(x, dup)).filter(Boolean);
    const chs = items.filter(x => x.k === 'ch').map(x => x.html), lvs = items.filter(x => x.k === 'lv').map(x => x.html), gos = items.filter(x => x.k === 'go').map(x => x.html);
    let h = '<span class="lat-ck">' + esc(lname(l)) + '</span>';
    if (chs.length) h += '<ul class="lat-ch">' + chs.slice(0, SHOW).join('') + '</ul>' +
      (chs.length > SHOW ? '<details class="lat-more"><summary>' + esc(t('page.lat.more', { n: chs.length - SHOW })) + '</summary><ul class="lat-ch">' + chs.slice(SHOW).join('') + '</ul></details>' : '');
    if (lvs.length) h += '<p class="lat-lv"><span>' + esc(t('page.lat.levels')) + '</span> ' + lvs.join(' ') + '</p>';
    h += gos.join('');
    if (c.real.length) h += '<div class="lat-real"><span class="lat-tag">' + esc(t('page.lat.real')) + '</span>' + c.real.map(factHtml).join('') + '</div>';
    const props = m === 'yours' ? (o.proposals || []).filter(p => layerOfGene(p.gene) === l) : [];
    if (props.length) h += '<div class="lat-prop"><span class="lat-tag">' + esc(t('page.lat.proposed')) + '</span><ul>' + props.map(p => '<li><b>' + esc(p.name) + '</b> <span class="small">' + esc(t('ar.gene.' + p.gene)) + ' · ' + esc(t('page.lat.by', { who: p.by })) + '</span> ' + (p.fact ? mark({ f: 'figures', fact: p.fact }) : statusMark('guess')) + '</li>').join('') + '</ul></div>';
    if (c.open) h += '<p class="lat-open"><span class="lat-tag">' + esc(t('page.lat.open')) + '</span> ' + esc(t(has('page.lat.q.' + key) ? 'page.lat.q.' + key : 'page.lat.q.' + m)) + '</p>';
    if (c.past) h += '<p class="lat-past"><span class="lat-tag">' + esc(t('page.lat.past')) + '</span> ' + esc(t('page.lat.pastD')) + '</p>';
    /* on a phone, where one matter shows at a time, a lit cell leads on to the path's step in another matter */
    if (n) { const K = [...step.keys()], go = (k2, dir) => { const m2 = k2 && k2.split('.')[0]; return m2 && m2 !== m ? '<button type="button" class="lat-to ' + dir + '" data-latm="' + m2 + '" aria-label="' + esc(t('page.lat.stepTo', { n: step.get(k2), where: name(m2) + ' · ' + lname(k2.split('.')[1]) })) + '">' + (dir === 'prev' ? '← ' : '') + esc(name(m2)) + (dir === 'next' ? ' →' : '') + '</button>' : ''; };
      const nav = go(K[n - 2], 'prev') + go(K[n], 'next'); if (nav) h += '<p class="lat-nav">' + nav + '</p>'; }
    const cls = ['lat-c', c.has.length ? 'k-has' : c.real.length ? 'k-real' : c.past ? 'k-past' : 'k-open', m !== m0 ? 'mo' : '', n ? 'lit' : ''].filter(Boolean).join(' ');
    return '<div class="' + cls + '" data-cell="' + key + '" data-m="' + m + '" aria-label="' + esc(name(m) + ' · ' + lname(l)) + '">' + (n ? '<span class="lat-n" aria-label="' + esc(t('page.lat.step', { n })) + '">' + n + '</span>' : '') + h + '</div>';
  };

  const paths = '<div class="lat-paths" role="group" aria-label="' + esc(t('page.lat.paths')) + '"><span class="kicker">' + esc(t('page.lat.paths')) + '</span>' +
    PATHS.map(p => '<button type="button" class="lat-pb" data-latpath="' + p.id + '" aria-pressed="' + (P && P.id === p.id) + '">' + esc(t('page.lat.path.' + p.id + '.t')) + '</button>').join('') + '</div>' +
    '<p class="lat-pd small" aria-live="polite">' + esc(t(P ? 'page.lat.path.' + P.id + '.d' : 'page.lat.pathHint')) + '</p>';
  const tabs = '<div class="lat-tabs" role="group" aria-label="' + esc(t('page.lat.tabs')) + '">' + MATTERS.map(m => '<button type="button" data-latm="' + m + '" aria-pressed="' + (m === m0) + '"' + (inPath.has(m) ? ' class="onpath"' : '') + '>' + esc(name(m)) + '</button>').join('') + '</div>';
  const heads = '<div class="lat-corner small">' + esc(t('page.lat.up')) + '</div>' + MATTERS.map(m => '<div class="lat-mh' + (m !== m0 ? ' mo' : '') + '" data-m="' + m + '"><b>' + esc(name(m)) + '</b><span class="small">' + esc(t('page.lat.m.' + m + '.d')) + '</span>' +
    (m === 'yours' ? '<a class="small" href="' + esc(REPO + '/issues/new?template=gene.yml') + '" target="_blank" rel="noopener">' + esc(t('page.lat.propose')) + ' ↗</a>' : '') + '</div>').join('');
  const rows = LAYERS.slice().reverse().map(l => '<div class="lat-lh" data-l="' + l + '"><b>' + esc(lname(l)) + '</b><span class="small">' + esc(t('page.lat.l.' + l + '.d')) + '</span></div>' + MATTERS.map(m => cellHtml(m, l)).join('')).join('');
  return '<div class="lat' + (P ? ' pathon' : '') + '" data-lat data-path="' + (P ? P.id : '') + '" data-matter="' + m0 + '">' + paths + tabs +
    '<p class="wm-axis wm-across small">' + esc(t('page.lat.across')) + '</p><div class="lat-grid">' + heads + rows + '<svg class="lat-wire" aria-hidden="true"></svg></div></div>';
}

/* the wire of the lit path: from cell to cell in order, through the gutters between them, so it never crosses a cell's
   words. Drawn after layout, and again when the page is resized; a cell that is hidden (a phone shows one matter) is
   left out */
export function drawWires(root) {
  const lat = root && root.querySelector('[data-lat]'); if (!lat) return;
  const svg = lat.querySelector('.lat-wire'), grid = lat.querySelector('.lat-grid'), P = pathOf(lat.dataset.path);
  if (!svg || !grid) return;
  const G = grid.getBoundingClientRect(), cs = getComputedStyle(grid), cg = parseFloat(cs.columnGap) || 12, rg = parseFloat(cs.rowGap) || 12;
  svg.setAttribute('viewBox', '0 0 ' + G.width + ' ' + G.height); svg.setAttribute('width', G.width); svg.setAttribute('height', G.height);
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  if (!P) return;
  const box = key => { const el = grid.querySelector('[data-cell="' + key + '"]'); if (!el || !el.offsetParent) return null; const r = el.getBoundingClientRect();
    return { l: r.left - G.left, r: r.right - G.left, t: r.top - G.top, b: r.bottom - G.top, x: (r.left + r.right) / 2 - G.left, y: (r.top + r.bottom) / 2 - G.top }; };
  const seg = (A, Bx) => {
    const sameCol = Math.abs(A.x - Bx.x) < 2, sameRow = Math.abs(A.y - Bx.y) < 2;
    if (sameCol) { const up = Bx.y < A.y, adj = up ? A.t - Bx.b < rg * 2 : Bx.t - A.b < rg * 2;
      if (adj) return [[A.x, up ? A.t : A.b], [A.x, up ? Bx.b : Bx.t]];
      const gx = A.r + cg / 2; return [[A.r, A.y], [gx, A.y], [gx, Bx.y], [Bx.r, Bx.y]]; }
    if (sameRow) { const right = Bx.x > A.x, adj = right ? Bx.l - A.r < cg * 2 : A.l - Bx.r < cg * 2;
      if (adj) return [[right ? A.r : A.l, A.y], [right ? Bx.l : Bx.r, A.y]];
      const gy = A.b + rg / 2; return [[A.x, A.b], [A.x, gy], [Bx.x, gy], [Bx.x, Bx.b]]; }
    /* to a cell beside and above or below: out of the side, along the row's gutter, into the cell */
    const right = Bx.x > A.x, up = Bx.y < A.y, gy = up ? A.t - rg / 2 : A.b + rg / 2, sx = right ? A.r - 14 : A.l + 14;
    return [[sx, up ? A.t : A.b], [sx, gy], [Bx.x, gy], [Bx.x, up ? Bx.b : Bx.t]];
  };
  const defs = document.createElementNS(SVGNS, 'defs'), mk = document.createElementNS(SVGNS, 'marker'), tip = document.createElementNS(SVGNS, 'path');
  mk.setAttribute('id', 'lat-tip'); mk.setAttribute('viewBox', '0 0 10 10'); mk.setAttribute('refX', '8'); mk.setAttribute('refY', '5');
  mk.setAttribute('markerWidth', '7'); mk.setAttribute('markerHeight', '7'); mk.setAttribute('orient', 'auto-start-reverse');
  tip.setAttribute('d', 'M0 0 L10 5 L0 10 z'); tip.setAttribute('class', 'lat-tip'); mk.appendChild(tip); defs.appendChild(mk); svg.appendChild(defs);
  P.strands.forEach(S => { const bs = S.map(box);
    for (let i = 1; i < S.length; i++) { const A = bs[i - 1], Bx = bs[i]; if (!A || !Bx) continue;
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', seg(A, Bx).map((q, j) => (j ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' '));
      p.setAttribute('marker-end', 'url(#lat-tip)'); svg.appendChild(p); } });
}
