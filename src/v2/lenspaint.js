/* Lenses repaint the picture (#304, docs/FRAME13.md, "Each lens repaints"). One registry: for each core question, how
   it paints a level from its parts' facts (src/data/partfacts.js) and the model of its engine (src/engines/lens.js),
   and the instrument it puts in the lens's card, one control and its measures. A paint is drawn in the level's plan
   (the scene's 1000 by 1000, as src/app/scenes.js draws it) as an SVG layer of its own, and pinned onto the picture by
   where the plan's four corners are on the screen: the flat dive's square, or a level drawn in 3D seen in perspective
   (a plane seen in perspective is one projective map, so the whole layer follows the picture exactly). So one paint
   serves a flat scene and a 3D level alike, and each lens's layer can be drawn beside another's. Words are never in
   the paint: only shapes, colours and motion; what they mean is said in the card.
   Motion only where it carries meaning (energy travelling, currents adding), and none with reduced motion. */
import { still } from '../core/ui.js';
import { esc } from '../core/esc.js';
import { t, fmtNum, fmtWords } from '../core/i18n.js';
import { factsOf } from '../data/partfacts.js';
import { MODELS, geometry, efficiency, brainCopy, physics as physicsModel, digital, geoEffFront, memoryFork, cleanOne, HOT, SWING } from '../engines/lens.js';
import { pairOf } from '../engines/frame.js';
import { frontFigure } from './front.js';
import { mark as fidMark } from './fid.js';
import { LENSES, PAIRS } from '../data/fidelity.js';

const R = r => 'x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '"';
const path = p => 'M' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L');
/* a colour along short (cool) to long or hot (warm), for 0..1 */
/* a fixed spread of 0..1, the same on every visit (each copy keeps its own speed; Listen's too, src/v2/listen.js) */
export const spread = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ramp = f => 'hsl(' + Math.round(205 - 185 * Math.max(0, Math.min(1, f))) + ' 85% 56%)';

/* ---- the paints, one per core question: (facts, model) -> SVG in the plan ---- */
export const PAINT = {
  /* Geometry: every wire coloured by its length, every trip from the logic to the memory as a thin line coloured by
     its length, the logic where the control puts it, its heat as it packs */
  geo: (F, m) => {
    const L = Math.max(...m.wires.map(w => w.len), ...m.trips.map(x => x.len), 1);
    return '<g class="lp-heat">' + m.placed.map(r => '<rect ' + R(r) + ' rx="6" fill="var(--bad)" fill-opacity="' + (0.12 + 0.28 * (m.measures.heat - 1) / 1.5).toFixed(2) + '"/>').join('') + '</g>' +
      '<g fill="none" stroke-linecap="round">' + m.trips.filter((x, i) => i % 3 === 0).map(x => { const [px, py] = x.from, mem = m.mem, tx = Math.max(mem[0], Math.min(px, mem[0] + mem[2])), ty = Math.max(mem[1], Math.min(py, mem[1] + mem[3]));
        return '<path d="M' + px.toFixed(0) + ' ' + py.toFixed(0) + 'H' + tx.toFixed(0) + 'V' + ty.toFixed(0) + '" stroke="' + ramp(x.len / L) + '" stroke-width="3" stroke-opacity=".55"/>'; }).join('') +
      m.wires.map(w => '<path d="' + path(w.p) + '" stroke="' + ramp(w.len / L) + '" stroke-width="10"/>').join('') + '</g>' +
      '<rect ' + R(m.mem) + ' rx="8" fill="none" stroke="var(--accent)" stroke-width="5"/>';
  },
  /* Efficiency fuels use: a fetch from memory is a big pulse travelling to the logic, a sum a small spark where it
     lands; as answers get cheaper the world asks more, and the picture fills with them */
  eff: (F, m) => {
    const mem = F.parts.find(p => p.kind === 'memory').rects[0], rows = F.parts.filter(p => p.kind === 'logic' && p.by === 'program').flatMap(p => p.rects), cx = mem[0], move = !still();
    let h = '<rect ' + R(mem) + ' rx="8" fill="var(--warm)" fill-opacity=".12" stroke="var(--warm)" stroke-width="4"/>';
    for (let i = 0; i < m.pulses; i++) {
      const r = rows[i % rows.length], y0 = mem[1] + ((i * 97) % mem[3]), x1 = r[0] + ((i * 211) % r[2]), y1 = r[1] + r[3] / 2, d = 'M' + cx + ' ' + y0 + 'H' + x1 + 'V' + y1, dur = (2.6 + (i % 5) * 0.4).toFixed(1) + 's', begin = (-(i * 0.37) % 3).toFixed(2) + 's';
      h += '<path d="' + d + '" fill="none" stroke="var(--warm)" stroke-opacity=".18" stroke-width="3"/>' +
        (move ? '<circle r="13" fill="var(--warm)"><animateMotion dur="' + dur + '" begin="' + begin + '" repeatCount="indefinite" path="' + d + '"/></circle>'
          : '<circle r="11" cx="' + ((cx + x1) / 2).toFixed(0) + '" cy="' + y0 + '" fill="var(--warm)"/>') +
        '<circle r="5" cx="' + x1 + '" cy="' + y1 + '" fill="var(--accent)">' + (move ? '<animate attributeName="opacity" values="0;1;0" dur="' + dur + '" begin="' + begin + '" repeatCount="indefinite"/>' : '') + '</circle>';
    }
    return h;
  },
  /* Brain or copy: where memory lives. The array of bits fades as the numbers move into the logic, where they are
     cells of the logic itself, each tinted by how well its copy on a new chip still answers */
  copy: (F, m) => {
    const mem = F.parts.find(p => p.kind === 'memory').rects[0], rows = F.parts.filter(p => p.kind === 'logic' && p.by === 'program').flatMap(p => p.rects);
    let h = '<rect ' + R(mem) + ' rx="8" fill="var(--accent)" fill-opacity="' + (0.35 * (1 - m.share)).toFixed(2) + '" stroke="var(--accent)" stroke-width="4" stroke-dasharray="' + (m.share > 0 ? '14 10' : 'none') + '"/>';
    const n = Math.round(m.share * 120);
    for (let i = 0; i < n; i++) { const r = rows[i % rows.length], x = r[0] + 12 + ((i * 53) % Math.max(1, r[2] - 24)), y = r[1] + r[3] / 2, a = m.fleet[i % m.fleet.length];
      h += '<rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="14" height="14" rx="3" fill="' + ramp((98 - a) / 30) + '"/>'; }
    return h;
  },
  /* Digital meets physical: one wire carries bits, each a dot along it, filled for 1, open for 0; a bit the noise
     carried over the line where 1 begins is read wrong, and ringed */
  dig: (F, m) => {
    if (!m.wire) return '';
    const p = m.wire, segs = p.slice(1).map((q, i) => [p[i], q]), lens = segs.map(([a, b]) => Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])), L = lens.reduce((s, v) => s + v, 0);
    const at = f => { let d = f * L; for (let i = 0; i < segs.length; i++) { if (d <= lens[i] || i === segs.length - 1) { const [a, b] = segs[i], u = lens[i] ? d / lens[i] : 0; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; } d -= lens[i]; } return p[0]; };
    return '<path d="' + path(p) + '" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-opacity=".7"/>' +
      m.reads.map((r, i) => { const [x, y] = at((i + 0.5) / m.reads.length), bad = r.read !== r.bit;
        return '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="11" fill="' + (r.bit ? 'var(--ink)' : 'var(--panel-solid)') + '" stroke="var(--ink)" stroke-width="3"/>' + (bad ? '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="22" fill="none" stroke="var(--bad)" stroke-width="5"/>' : ''); }).join('');
  },
  /* Fight or use physics. Fight: a margin round every row of logic and check bits beside every word of memory. Use:
     the memory array's columns add with currents, flowing down them; the hotter, the more of them stray */
  physics: (F, m) => {
    const mem = F.parts.find(p => p.kind === 'memory').rects[0], rows = F.parts.filter(p => p.kind === 'logic' && p.by === 'program').flatMap(p => p.rects), move = !still(), cols = 12;
    let h = m.part === 'use' ? '' : rows.map(r => '<rect x="' + (r[0] - 6) + '" y="' + (r[1] - 6) + '" width="' + (r[2] + 12) + '" height="' + (r[3] + 12) + '" rx="8" fill="none" stroke="var(--good)" stroke-width="3" stroke-dasharray="10 8"/>').join('') +
      '<rect x="' + (mem[0] + mem[2] * 0.89) + '" y="' + mem[1] + '" width="' + (mem[2] * 0.11) + '" height="' + mem[3] + '" fill="var(--good)" fill-opacity=".35"/>';
    if (m.part !== 'fight') for (let c = 0; c < cols; c++) { const x = mem[0] + mem[2] * 0.89 * (c + 0.5) / cols, stray = (c * 7 % 10) / 10 < m.measures.off;
      h += '<line x1="' + x.toFixed(0) + '" y1="' + mem[1] + '" x2="' + x.toFixed(0) + '" y2="' + (mem[1] + mem[3]) + '" stroke="' + (stray ? 'var(--bad)' : 'var(--warm)') + '" stroke-width="6" stroke-dasharray="18 14"' + (move ? '><animate attributeName="stroke-dashoffset" from="64" to="0" dur="' + (1.2 + c % 3 * 0.3).toFixed(1) + 's" repeatCount="indefinite"/></line>' : '/>'); }
    return h;
  },
  /* Perfect fails: every copy of a cell its own speed, from the quickest (pale) to the slowest; those whose path is
     longer than a tick of the clock are late, in red */
  perfect: (F, m) => {
    const rows = F.parts.filter(p => p.kind === 'logic' && p.by === 'program').flatMap(p => p.rects), per = 14, cut = m.tick / m.path;
    return rows.map((r, j) => Array.from({ length: per }, (_, i) => { const u = 0.5 + 0.5 * spread(j * per + i), late = u > cut, w = r[2] / per;
      return '<rect x="' + (r[0] + i * w + 3).toFixed(0) + '" y="' + (r[1] + 6) + '" width="' + (w - 6).toFixed(0) + '" height="' + (r[3] - 12) + '" rx="4" fill="' + (late ? 'var(--bad)' : ramp((u - 0.5) * 1.2)) + '" fill-opacity="' + (late ? 0.85 : 0.45) + '"/>'; }).join('')).join('');
  },
  /* Only humans: every part tinted by who decided it, a program (cool), a person (warm), or nobody yet (open, dashed) */
  human: (F, m) => F.parts.filter(p => p.kind !== 'wire').map(p => p.rects.map(r => p.by === 'open'
    ? '<rect ' + R(r) + ' rx="8" fill="none" stroke="var(--muted)" stroke-width="5" stroke-dasharray="16 12"/>'
    : '<rect ' + R(r) + ' rx="6" fill="' + (p.by === 'person' ? 'var(--warm)' : 'var(--accent)') + '" fill-opacity="' + (p.by === 'person' ? '.45' : '.18') + '" stroke="' + (p.by === 'person' ? 'var(--warm)' : 'var(--accent)') + '" stroke-width="3"/>').join('')).join('') +
    F.parts.filter(p => p.kind === 'wire').flatMap(p => p.paths).map(q => '<path d="' + path(q) + '" fill="none" stroke="var(--accent)" stroke-width="6" stroke-opacity=".6"/>').join('')
};

/* ---- each lens's state (its control's value), for the visit ---- */
const STATE = {};
const valueOf = q => (q in STATE ? STATE[q] : MODELS[q].control.start);
export const paints = (q, level) => !!(PAINT[q] && MODELS[q] && factsOf(level));

/* the measures, in words: each lens's own, from its model */
const unit = { trip: v => t('lp.um', { v: fmtNum(v) }), heat: v => t('lp.times', { v: fmtNum(v) }), energy: (v, q) => (q === 'copy' ? t('lp.times', { v: fmtNum(v) }) : t('lp.joules', { v: fmtWords(v) })),
  answers: v => t('lp.times', { v: fmtNum(v) }), power: v => t('lp.times', { v: fmtNum(v) }), own: v => t('lp.pct', { v: fmtNum(v) }), copied: v => t('lp.pct', { v: fmtNum(v) }),
  wrong: v => (v < 1e-9 ? t('lp.none') : t('lp.oneIn', { v: fmtWords(Math.round(1 / v)) })), fight: v => t('lp.pj', { v: fmtNum(v) }), use: v => t('lp.pj', { v: fmtNum(v) }),
  off: v => t('lp.pct', { v: fmtNum(Math.round(v * 100)) }), late: v => t('lp.pct', { v: fmtNum(Math.round(v * 100)) }), drawn: v => fmtNum(v), pass: v => fmtNum(v), shortest: v => t('lp.tracks', { v: fmtNum(v) }), longest: v => t('lp.tracks', { v: fmtNum(v) }) };
/* one measure, its name and its value (id: the measure it shows, kept in step as the instrument moves) */
const meter = (label, value, id) => '<div class="lpm"><span class="lpml">' + esc(label) + '</span><b' + (id ? ' data-lpm="' + id + '"' : '') + '>' + esc(value) + '</b></div>';
const measuresHtml = (q, m) => MODELS[q].measures.map(id => meter(t('lp.' + q + '.m.' + id), unit[id](m.measures[id], q), id)).join('');
/* where a control stands, in words (a share as a percentage) */
const atText = (q, v) => t('lp.' + q + '.at', { v: fmtNum(['geo', 'copy', 'dig'].includes(q) ? Math.round(v * 100) : v) });
/* the control: a slider over its values, its two ends said; Only humans' is a button that draws one more layout */
const controlHtml = q => {
  const C = MODELS[q].control, i = Math.max(0, C.values.indexOf(valueOf(q)));
  if (q === 'human') return '<button type="button" class="btn ghost lpdraw" data-lpdraw>' + esc(t('lp.human.ctl')) + '</button>';
  return '<label class="lpc"><span class="lpcl">' + esc(t('lp.' + q + '.ctl')) + '</span><input type="range" min="0" max="' + (C.values.length - 1) + '" step="1" value="' + i + '" data-lpctl="' + q + '" aria-valuetext="' + esc(atText(q, C.values[i])) + '">' +
    '<span class="lpends" aria-hidden="true"><span>' + esc(t('lp.' + q + '.lo')) + '</span><span>' + esc(t('lp.' + q + '.hi')) + '</span></span></label>';
};
/* Digital meets physical's scope: the wire's voltage, bit by bit, against the line where 1 begins */
const scopeHtml = m => {
  const n = m.reads.length, X = i => (i + 0.5) * 300 / n, Y = v => 70 - Math.max(-0.4, Math.min(1.4, v)) * 45;
  return '<svg class="lpscope" viewBox="0 0 300 90" aria-hidden="true"><line x1="0" x2="300" y1="' + Y(0.5) + '" y2="' + Y(0.5) + '" class="lpline"/>' +
    '<polyline points="' + m.reads.map((r, i) => X(i).toFixed(0) + ',' + Y(r.v).toFixed(1)).join(' ') + '" class="lptrace"/>' +
    m.reads.map((r, i) => '<circle cx="' + X(i).toFixed(0) + '" cy="' + Y(r.v).toFixed(1) + '" r="3.5" class="' + (r.read !== r.bit ? 'lpbad' : 'lpok') + '"/>').join('') + '</svg>';
};
/* Only humans' layouts: one small mark each, its wire, every one passing; the one chosen is yours */
let chosen = null;
const layoutsHtml = m => '<div class="lplays">' + m.layouts.map((l, i) => '<button type="button" class="lplay' + (i === chosen ? ' on' : '') + '" data-lppick="' + i + '" aria-pressed="' + (i === chosen) + '" aria-label="' + esc(t('lp.human.pick', { n: i + 1, v: l.wire })) + '">' +
  '<span class="lpok2" aria-hidden="true">✓</span>' + fmtNum(l.wire) + '</button>').join('') + '</div>' + (chosen != null ? '<p class="small lpyours">' + esc(t('lp.human.yours', { n: chosen + 1 })) + '</p>' : '');

/* what the paint's colours and shapes say, beside the control (#326): every mark the paint draws, named once, drawn
   the way the paint draws it, so the picture reads without guessing */
const sw = inner => '<svg class="lpsw" viewBox="0 0 28 16" aria-hidden="true">' + inner + '</svg>';
const RAMP = '<defs><linearGradient id="lpramp"><stop offset="0" stop-color="' + ramp(0) + '"/><stop offset=".5" stop-color="' + ramp(0.5) + '"/><stop offset="1" stop-color="' + ramp(1) + '"/></linearGradient></defs><rect x="1" y="5" width="26" height="6" rx="3" fill="url(#lpramp)"/>';
const KEYS = {
  geo: [[RAMP, 'ramp'], ['<rect x="2" y="2" width="24" height="12" rx="3" fill="var(--bad)" fill-opacity=".4"/>', 'heat'], ['<rect x="2" y="2" width="24" height="12" rx="3" fill="none" stroke="var(--accent)" stroke-width="2"/>', 'mem']],
  eff: [['<circle cx="14" cy="8" r="6" fill="var(--warm)"/>', 'fetch'], ['<circle cx="14" cy="8" r="3" fill="var(--accent)"/>', 'sum']],
  copy: [['<rect x="2" y="2" width="24" height="12" rx="3" fill="var(--accent)" fill-opacity=".35" stroke="var(--accent)" stroke-width="1.5"/>', 'bits'], ['<rect x="4" y="3" width="9" height="9" rx="2" fill="' + ramp(0) + '"/><rect x="16" y="3" width="9" height="9" rx="2" fill="' + ramp(1) + '"/>', 'cells']],
  dig: [['<circle cx="8" cy="8" r="5" fill="var(--ink)"/><circle cx="21" cy="8" r="5" fill="var(--panel-solid)" stroke="var(--ink)" stroke-width="1.5"/>', 'bits'], ['<circle cx="14" cy="8" r="4" fill="var(--ink)"/><circle cx="14" cy="8" r="7" fill="none" stroke="var(--bad)" stroke-width="2"/>', 'wrong']],
  physics: [['<rect x="2" y="3" width="24" height="10" rx="3" fill="none" stroke="var(--good)" stroke-width="2" stroke-dasharray="4 3"/>', 'fight'], ['<line x1="14" y1="1" x2="14" y2="15" stroke="var(--warm)" stroke-width="3" stroke-dasharray="4 3"/>', 'use'], ['<line x1="14" y1="1" x2="14" y2="15" stroke="var(--bad)" stroke-width="3" stroke-dasharray="4 3"/>', 'stray']],
  perfect: [['<rect x="2" y="4" width="11" height="8" rx="2" fill="' + ramp(0) + '" fill-opacity=".6"/><rect x="15" y="4" width="11" height="8" rx="2" fill="' + ramp(0.6) + '" fill-opacity=".6"/>', 'speed'], ['<rect x="8" y="4" width="12" height="8" rx="2" fill="var(--bad)" fill-opacity=".85"/>', 'late']],
  human: [['<rect x="2" y="3" width="24" height="10" rx="3" fill="var(--accent)" fill-opacity=".25" stroke="var(--accent)" stroke-width="1.5"/>', 'program'], ['<rect x="2" y="3" width="24" height="10" rx="3" fill="var(--warm)" fill-opacity=".45" stroke="var(--warm)" stroke-width="1.5"/>', 'person'], ['<rect x="2" y="3" width="24" height="10" rx="3" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"/>', 'open']]
};
const keyHtml = q => KEYS[q] ? '<ul class="lpkeys" aria-label="' + esc(t('lp.key')) + '">' + KEYS[q].map(([g, id]) => '<li>' + sw(g) + '<span>' + esc(t('lp.' + q + '.key.' + id)) + '</span></li>').join('') + '</ul>' : '';

const run = (q, level) => MODELS[q].run(factsOf(level), valueOf(q));
/* the instrument a lens puts in its card at a level: its control, then its measures (and the scope, the layouts) */
export function instrument(q, level) {
  if (!paints(q, level)) return '';
  const m = run(q, level);
  /* how true its measures are: one mark, tapped for what it means here (#325) */
  return '<div class="lpinst" data-lpinst="' + q + '" data-lplevel="' + esc(level) + '"><p class="fidrow">' + fidMark(LENSES[q]) + '</p>' + keyHtml(q) + controlHtml(q) + '<div class="lpms">' + measuresHtml(q, m) + '</div>' +
    (q === 'dig' ? scopeHtml(m) : q === 'human' ? layoutsHtml(m) : '') + '</div>';
}

/* ---- the layer on the picture ---- */
/* the projective map that takes the plan's square (0..1000 both ways) onto four points (its corners in order: top
   left, top right, bottom right, bottom left), as a CSS matrix3d on an element 1000 px square */
export function squareTo(pts) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = pts, dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = den ? (sx * dy2 - dx2 * sy) / den : 0, h = den ? (dx1 * sy - sx * dy1) / den : 0;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, S = 1000;
  return [a / S, d / S, 0, g / S, b / S, e / S, 0, h / S, 0, 0, 1, 0, x0, y0, 0, 1];
}

/* ---- two lenses held at once (#315): where they meet, drawn as a front, a fork or a chain (MEETS in
   src/data/frame.js). The picture is the two lenses' own paints and the shape's layer over them; the card holds the
   pair's instrument. Each pair's state, for the visit ---- */
const PAIR = {};
const keyOf = (a, b) => { const p = pairOf(a, b); return p ? p.a + '.' + p.b : null; };
const pairState = k => PAIR[k] || (PAIR[k] = { p: 0, n: 0, celsius: 45, swing: 1, split: 0.5 });
/* a pair can be drawn at a level where both lenses paint it and its shape has what it needs */
export function paintsPair(a, b, level) {
  const P = pairOf(a, b); if (!P || !paints(a, level) || !paints(b, level)) return false;
  return P.shape === 'fork' || (P.shape === 'front' && !!P.front) || (P.shape === 'chain' && !!P.chain);
}
const PLAN_W = 1000;
/* where a chain's steps stand on the plan: the logic that heats, the wire that shakes, the gate at its end, the memory
   that keeps the word */
function chainPoints(F) {
  const d = digital(F, 0), w = d.wire || [[300, 500], [500, 500]], mid = w[Math.floor(w.length / 2)], start = w[0], mem = F.parts.find(p => p.kind === 'memory').rects[0];
  return [[430, 150], mid, start, [mem[0] + mem[2] / 2, mem[1] + mem[3] / 2]];
}
function pairSvg(a, b, level) {
  const P = pairOf(a, b), k = P.a + '.' + P.b, S = pairState(k), F = factsOf(level);
  if (P.shape === 'front') {
    /* Geometry's paint with the logic where the control puts it, Efficiency's pulses, and the memory moved into the
       rows in slices as the innovation grows; the array it left fades */
    const g = geometry(F, S.p), mem = g.mem; let h = PAINT.geo(F, g) + PAINT.eff(F, efficiency(F, valueOf('eff')));
    if (S.n > 0) { h += '<rect ' + R(mem) + ' rx="8" fill="var(--bg)" fill-opacity="' + (0.55 * S.n).toFixed(2) + '"/>';
      g.placed.forEach(r => { for (let i = 0; i < 4; i++) { const w = r[2] / 4 * 0.22 * S.n, x = r[0] + r[2] * (i + 0.5) / 4 - w / 2; h += '<rect x="' + x.toFixed(0) + '" y="' + (r[1] + 4) + '" width="' + w.toFixed(1) + '" height="' + (r[3] - 8) + '" rx="3" fill="var(--good)" fill-opacity=".85"/>'; } }); }
    return h;
  }
  if (P.shape === 'fork') {
    /* the same block two ways, the line between them where you drag it: Brain or copy and Fight or use physics as
       exact bits (memory in its array, margins and check bits) against memory that computes (the numbers in the cells,
       currents adding); any other fork, each lens's own paint on its side */
    const X = (S.split * PLAN_W).toFixed(1), clip = (id, x, w) => '<clipPath id="' + id + '"><rect x="' + x + '" y="-200" width="' + w + '" height="1400"/></clipPath>';
    const mem = k === 'copy.physics';
    const left = mem ? PAINT.copy(F, brainCopy(F, 0)) + PAINT.physics(F, Object.assign(physicsModel(F, S.celsius), { part: 'fight' })) : PAINT[P.a](F, run(P.a, level));
    const right = mem ? PAINT.copy(F, brainCopy(F, 1)) + PAINT.physics(F, Object.assign(physicsModel(F, S.celsius), { part: 'use' })) : PAINT[P.b](F, run(P.b, level));
    return '<defs>' + clip('lpL', -200, +X + 200) + clip('lpR', X, 1400) + '</defs><g clip-path="url(#lpL)">' + left + '</g><g clip-path="url(#lpR)">' + right + '</g>' +
      '<line x1="' + X + '" y1="-10" x2="' + X + '" y2="1010" stroke="var(--ink)" stroke-width="6" stroke-dasharray="18 10"/>';
  }
  /* a chain: the logic warming with the temperature, the wire's bits read with the noise the heat makes, and the steps
     joined in order (their numbers are pins over the picture) */
  const C = cleanOne(F, S.celsius, S.swing), pts = chainPoints(F), rows = F.parts.filter(p => p.kind === 'logic' && p.by === 'program').flatMap(p => p.rects);
  const hot = (S.celsius - HOT[0]) / (HOT[HOT.length - 1] - HOT[0]);
  return rows.map(r => '<rect ' + R(r) + ' rx="6" fill="var(--bad)" fill-opacity="' + (0.06 + 0.4 * hot).toFixed(2) + '"/>').join('') + PAINT.dig(F, digital(F, C.noise)) +
    '<path d="' + path(pts) + '" fill="none" stroke="var(--warm)" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round"/>';
}
/* the pins over the picture, in plan coordinates: a chain's numbered steps, lit once past their threshold; a fork's
   handle on its line */
function pairPins(a, b, level) {
  const P = pairOf(a, b), k = P.a + '.' + P.b, S = pairState(k), F = factsOf(level);
  if (P.shape === 'chain') { const C = cleanOne(F, S.celsius, S.swing); return chainPoints(F).map((pt, i) => ({ at: pt, cls: 'lppin' + (C.steps[i].lit ? ' lit' : ''), html: String(i + 1), label: t('lp.chain.step.' + C.steps[i].id) })); }
  if (P.shape === 'fork') return [{ at: [S.split * PLAN_W, 300], cls: 'lppin lphandle', html: '⇔', label: t('lp.fork.drag'), drag: k }];
  return [];
}

/* the projective map, and its inverse: a point of the plan onto the screen, and back */
const fwd = (m, x, y) => { const w = m[3] * x + m[7] * y + m[15]; return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w]; };
function back(m, sx, sy) {
  const A = m[0], B = m[4], C = m[12], D = m[1], E = m[5], Fm = m[13], G = m[3], H = m[7], I = m[15];
  const a = E * I - Fm * H, b = C * H - B * I, c = B * Fm - C * E, d = Fm * G - D * I, e = A * I - C * G, f = C * D - A * Fm, g = D * H - E * G, h = B * G - A * H, i = A * E - B * D;
  const w = g * sx + h * sy + i; return [(a * sx + b * sy + c) / w, (d * sx + e * sy + f) / w];
}

/* createLensPaint(where) -> { show(q, level, q2), hide(), update() }. where() -> { host, before, corners } or null: the
   element the layer stands in (under the picture's names, before `before`) and the plan's four corners on the screen,
   null while the picture moves between levels or the level is not in view */
export function createLensPaint(where) {
  let layer = null, pinsEl = null, now = null, raf = 0, M = null, drag = null;
  const draw = () => {
    if (!now || !layer) return;
    const svg = now.q2 ? pairSvg(now.q, now.q2, now.level) : PAINT[now.q](factsOf(now.level), run(now.q, now.level));
    layer.innerHTML = '<svg viewBox="0 0 1000 1000" width="1000" height="1000" data-lens="' + now.q + '"' + (now.q2 ? ' data-pair="' + keyOf(now.q, now.q2) + '"' : '') + '>' + svg + '</svg>';
    const pins = now.q2 ? pairPins(now.q, now.q2, now.level) : [];
    pinsEl.innerHTML = pins.map((p, i) => '<button type="button" class="' + p.cls + '" data-pin="' + i + '"' + (p.drag ? ' data-pindrag="' + p.drag + '"' : ' tabindex="-1"') + ' aria-label="' + esc(p.label) + '" title="' + esc(p.label) + '">' + esc(p.html) + '</button>').join('');
    pinsEl._at = pins.map(p => p.at); place();
  };
  const place = () => { if (!M || !pinsEl) return; [...pinsEl.children].forEach((el, i) => { const [x, y] = fwd(M, ...pinsEl._at[i]); el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)'; }); };
  function follow() {
    raf = requestAnimationFrame(follow);
    const W = now && where(); if (!W || !W.corners) { if (layer) layer.hidden = pinsEl.hidden = true; return; }
    if (!layer || layer.parentNode !== W.host) {
      if (layer) { layer.remove(); pinsEl.remove(); }
      layer = document.createElement('div'); layer.className = 'lenspaint'; pinsEl = document.createElement('div'); pinsEl.className = 'lenspins';
      W.host.insertBefore(layer, W.before || null); W.host.insertBefore(pinsEl, W.before || null); draw();
    }
    const o = W.host.getBoundingClientRect();
    M = squareTo(W.corners.map(([x, y]) => [x - o.left, y - o.top]));
    layer.hidden = pinsEl.hidden = false; layer.style.transform = 'matrix3d(' + M.map(v => +v.toFixed(6)).join(',') + ')'; place();
  }
  /* the fork's line, dragged across the picture: the pointer, taken back onto the plan, sets where it falls */
  document.addEventListener('pointerdown', e => { const h = e.target.closest('[data-pindrag]'); if (!h || !M) return; e.preventDefault(); drag = h.dataset.pindrag; h.setPointerCapture && h.setPointerCapture(e.pointerId); });
  document.addEventListener('pointermove', e => {
    if (!drag || !M || !pinsEl) return; const o = pinsEl.parentNode.getBoundingClientRect(), [x] = back(M, e.clientX - o.left, e.clientY - o.top);
    pairState(drag).split = Math.max(0.05, Math.min(0.95, x / PLAN_W)); draw();
    const r = document.querySelector('[data-lppc="' + drag + ':split"]'); if (r) r.value = Math.round(pairState(drag).split * 20);
  });
  document.addEventListener('pointerup', () => { drag = null; });
  return {
    show(q, level, q2) {
      if (q2 ? !paintsPair(q, q2, level) : !paints(q, level)) return this.hide();
      if (now && now.q === q && now.q2 === q2 && now.level === level) return;
      now = { q, level, q2: q2 || null }; if (layer) draw(); cancelAnimationFrame(raf); follow();
    },
    hide() { now = null; cancelAnimationFrame(raf); if (layer) { layer.remove(); pinsEl.remove(); layer = pinsEl = null; } },
    /* a control moved: the layer, and the card's measures, follow it */
    update() { draw(); },
    lens: () => (now ? now.q : null)
  };
}

/* ---- the pair's instrument in its card ---- */
const range = (key, prop, values, at, lo, hi, label, text) => '<label class="lpc"><span class="lpcl">' + esc(label) + '</span><input type="range" min="0" max="' + (values.length - 1) + '" step="1" value="' + at + '" data-lppc="' + key + ':' + prop + '" aria-valuetext="' + esc(text) + '">' +
  '<span class="lpends" aria-hidden="true"><span>' + esc(lo) + '</span><span>' + esc(hi) + '</span></span></label>';
/* the front's two controls go in tenths: an attempt kept in the ledger is one of these points (FRONTS in
   src/engines/ledger.js) */
const TENTHS = Array.from({ length: 11 }, (_, i) => i / 10);
const STEPS = { p: TENTHS, n: TENTHS, celsius: HOT, swing: SWING, split: Array.from({ length: 21 }, (_, i) => i / 20) };
/* the ledger, for a front's attempts (#326): given by the shell (src/v2/glue/frame.js), so this file stays free of the
   game's state. o: { attempts(key, score) -> frontAttemptsAt's list (yours too, marked draft), keep(key, plan, box) ->
   { ok, e, r }, slip(id) -> html, slipClick(ev, done(redraw)) -> handled, refusal(r), signHtml() } */
let LEDGER = null, KEPT = {}, NO = {};
export function useLedger(o) { LEDGER = o; }
const pct = v => fmtNum(Math.round(v * 100));
/* the front's chart: energy per answer across, the hottest patch up; today's front dashed, the front moved solid, the
   corner nobody has reached shaded, your design a dot */
function frontChart(F, S, k) {
  const E = geoEffFront(F), l0 = E.line(0), l1 = S.n > 0 ? E.line(S.n) : null, me = E.at(S.p, S.n), all = l0.concat(E.line(1));
  /* the attempts kept in the ledger, each placed by this model; the ones nothing beats joined, the ledger's front */
  const A = LEDGER ? LEDGER.attempts(k, pl => { const r = E.at(pl.p, pl.n); return { x: r.energy, y: r.heat }; }) : [], best = A.filter(a => a.state === 'front').sort((a, b) => a.x - b.x);
  const xs = all.map(p => p.x), ys = all.map(p => p.y), x0 = 0, x1 = Math.max(...xs) * 1.05, y0 = Math.min(...ys) * 0.9, y1 = Math.max(...ys) * 1.05, W = 360, H = 200;
  const px = x => 24 + (x - x0) / (x1 - x0) * (W - 34), py = y => H - 22 - (y - y0) / (y1 - y0) * (H - 34), pts = L => L.map(p => [px(p.x), py(p.y)]);
  /* the lab's one front (src/v2/front.js): today's dashed, moved solid, nobody's corner shaded, your design a dot */
  return frontFigure({ W, H, box: [24, 12, W - 10, H - 22], corner: 'bl', aria: t('lp.front.aria'),
    lines: [{ pts: pts(l0), cls: 'lpline0' }, l1 ? { pts: pts(l1), cls: 'lpline1' } : null, best.length > 1 ? { pts: best.map(a => [px(a.x), py(a.y)]), cls: 'lpledger' } : null],
    dots: A.map(a => ({ x: px(a.x), y: py(a.y), r: 4.5, cls: 'lpatt ' + a.state + (a.draft ? ' mine' : ''), attrs: 'data-lpatt="' + esc(a.id) + '"', title: a.by + ' · ' + t('build.kind.' + a.made) })).concat([{ x: px(me.energy), y: py(me.heat), r: 7, cls: 'lpdot' }]),
    key: [['', t('lp.front.x')], ['', t('lp.front.y')], ['k0', t('lp.front.today')]].concat(l1 ? [['k1', t('lp.front.moved')]] : [], [['kd', t('lp.front.dot')]], A.length ? [['ka', t('lp.front.tries')]] : [], [['kn', t('lp.front.nobody')]]) }) +
    '<div class="lpms">' + meter(t('lp.front.energy'), t('lp.joules', { v: fmtNum(+me.energy.toPrecision(2)) })) + meter(t('lp.front.heat'), t('lp.times', { v: fmtNum(+me.heat.toPrecision(2)) })) + meter(t('lp.geo.m.trip'), t('lp.um', { v: fmtNum(+me.trip.toPrecision(2)) })) + '</div>' +
    '<p class="small muted lpwhole">' + esc(t('lp.front.whole', { v: fmtWords(Math.round(E.whole)), share: fmtNum(+(100 * E.today.energy / E.whole).toPrecision(1)) })) + '</p>';
}
/* the open problem, live (#326): the attempts kept at this front, the ledger's best first, and yours to keep */
function frontTries(k, S) {
  if (!LEDGER) return '';
  const F = geoEffFront(), A = LEDGER.attempts(k, pl => { const r = F.at(pl.p, pl.n); return { x: r.energy, y: r.heat }; });
  const on = A.filter(a => a.state === 'front').sort((a, b) => a.x - b.x), plan = { p: S.p, n: S.n };
  const same = A.find(a => a.plan.p === plan.p && a.plan.n === plan.n);
  let h = '<section class="lptries"><p class="kicker">' + esc(t('lp.front.triesK')) + '</p><p class="small">' + esc(A.length ? t('lp.front.triesN', { n: A.length, front: on.length }) : t('lp.front.triesNone')) + '</p>';
  if (on.length) h += '<ul class="lptry">' + on.slice(0, 4).map(a => '<li><b>' + esc(a.by) + '</b> <span class="muted">' + esc(t('build.kind.' + a.made)) + ' · ' + esc(t('lp.front.at', { p: pct(a.plan.p), n: pct(a.plan.n) })) + '</span>' + (a.words ? '<span class="lptw">' + esc(a.words) + '</span>' : '') + '</li>').join('') + '</ul>';
  const mine = KEPT[k] && A.find(a => a.id === KEPT[k]) ? KEPT[k] : null;
  if (mine) h += LEDGER.slip(mine);
  else if (same) h += '<p class="small muted">' + esc(t('lp.front.taken', { by: same.by })) + '</p>';
  else h += '<div class="lpkeep">' + LEDGER.signHtml() + '<label class="lpkw"><span class="kicker">' + esc(t('lp.front.why')) + '</span><input type="text" maxlength="300" data-lpwords placeholder="' + esc(t('lp.front.whyPh')) + '"></label>' +
    (NO[k] ? '<p class="small bad">' + esc(NO[k]) + '</p>' : '') + '<button type="button" class="btn primary" data-lpkeep="' + esc(k) + '">' + esc(t('lp.front.keep')) + '</button></div>';
  return h + '</section>';
}
function pairBody(a, b, level) {
  const P = pairOf(a, b), k = P.a + '.' + P.b, S = pairState(k), F = factsOf(level), at = (prop, v) => STEPS[prop].indexOf(v) < 0 ? 0 : STEPS[prop].indexOf(v);
  if (P.shape === 'front') return frontChart(F, S, k) +
    range(k, 'p', STEPS.p, at('p', S.p), t('lp.geo.lo'), t('lp.geo.hi'), t('lp.geo.ctl'), t('lp.geo.at', { v: pct(S.p) })) +
    range(k, 'n', STEPS.n, at('n', S.n), t('lp.front.nlo'), t('lp.front.nhi'), t('lp.front.n'), t('lp.front.nat', { v: pct(S.n) })) + frontTries(k, S);
  const hot = range(k, 'celsius', HOT, at('celsius', S.celsius), t('lp.physics.lo'), t('lp.physics.hi'), t('lp.physics.ctl'), t('lp.physics.at', { v: fmtNum(S.celsius) }));
  if (P.shape === 'chain') {
    const C = cleanOne(F, S.celsius, S.swing), sci = v => (v < 1e-30 ? t('lp.none') : t('lp.oneIn', { v: fmtWords(Math.round(1 / v)) }));
    return '<ol class="lpchain">' + C.steps.map((s, i) => '<li class="' + (s.lit ? 'lit' : '') + '"><b>' + (i + 1) + '</b><span>' + esc(t('lp.chain.step.' + s.id)) + '</span><em>' + esc(t(s.lit ? 'lp.chain.lit' : 'lp.chain.unlit')) + '</em></li>').join('') + '</ol>' +
      hot + range(k, 'swing', SWING, at('swing', S.swing), t('lp.chain.lo'), t('lp.chain.hi'), t('lp.chain.swing'), t('lp.chain.at', { v: fmtNum(S.swing) })) +
      '<div class="lpms">' + meter(t('lp.chain.noise'), t('lp.pct', { v: fmtNum(+(C.noise * 100).toPrecision(2)) })) + meter(t('lp.chain.misread'), sci(C.measures.misread)) + meter(t('lp.chain.kept'), sci(C.measures.kept)) + meter(t('lp.chain.energy'), t('lp.times', { v: fmtNum(+C.measures.energy.toPrecision(3)) })) + '</div>';
  }
  /* a fork: the two ways side by side; where an engine measures both (memory that computes), its measures; any other,
     each lens's own */
  const split = range(k, 'split', STEPS.split, Math.round(S.split * 20), t('lp.fork.slo'), t('lp.fork.shi'), t('lp.fork.split'), t('lp.fork.at', { v: pct(S.split) }));
  if (k === 'copy.physics') { const Fk = memoryFork(F, S.celsius), row = (id, f) => '<span>' + esc(t('lp.fork.' + id)) + '</span><span class="n">' + esc(f(Fk.exact[id])) + '</span><span class="n">' + esc(f(Fk.computes[id])) + '</span>';
    return '<div class="lptwo"><span></span><span class="hd">' + esc(t('lp.fork.exact')) + '</span><span class="hd">' + esc(t('lp.fork.computes')) + '</span>' +
      row('energy', v => t('lp.pj', { v: fmtNum(v) })) + row('off', v => t('lp.pct', { v: pct(v) })) + row('copied', v => t('lp.pct', { v: fmtNum(v) })) + '</div>' + split + hot; }
  const side = q => { const m = run(q, level); return '<div class="lpside"><p class="kicker">' + esc(t('frame.q.' + q)) + '</p>' + (PAIRS[k] ? '' : '<p class="fidrow">' + fidMark(LENSES[q]) + '</p>') + MODELS[q].measures.map(id => meter(t('lp.' + q + '.m.' + id), unit[id](m.measures[id], q))).join('') + '</div>'; };
  return '<div class="lpsides">' + side(P.a) + side(P.b) + '</div>' + split;
}
export function pairInstrument(a, b, level) {
  if (!paintsPair(a, b, level)) return '';
  /* a pair one model computes carries that model's mark; any other fork, each side its own lens's (pairBody) */
  const k = keyOf(a, b);
  return '<div class="lpinst" data-lppair="' + k + '" data-lpa="' + a + '" data-lpb="' + b + '" data-lplevel="' + esc(level) + '">' + (PAIRS[k] ? '<p class="fidrow">' + fidMark(PAIRS[k]) + '</p><div class="lppairb">' : '<div class="lppairb">') + pairBody(a, b, level) + '</div></div>';
}
function refreshPair(box) {
  if (!box) return; const focus = document.activeElement && document.activeElement.dataset.lppc;
  (box.querySelector(':scope > .lppairb') || box).innerHTML = pairBody(box.dataset.lpa, box.dataset.lpb, box.dataset.lplevel);
  if (focus) { const r = box.querySelector('[data-lppc="' + focus + '"]'); if (r) r.focus(); }
}

/* the instruments' controls, wherever their card is: a control moved re-runs its model, redraws its measures in the
   card, and tells the layer (onChange) */
export function wire(onChange) {
  document.addEventListener('input', e => {
    const pc = e.target.closest('[data-lppc]');
    if (pc) { const [k, prop] = pc.dataset.lppc.split(':'), v = STEPS[prop][+pc.value]; pairState(k)[prop] = v; refreshPair(pc.closest('[data-lppair]')); return onChange(k); }
    const c = e.target.closest('[data-lpctl]'); if (!c) return;
    const q = c.dataset.lpctl, box = c.closest('[data-lpinst]'), C = MODELS[q].control, v = C.values[+c.value];
    STATE[q] = v; c.setAttribute('aria-valuetext', atText(q, v));
    refresh(box); onChange(q);
  });
  document.addEventListener('click', e => {
    /* a front's point kept in the ledger: signed, checked, then its slip (src/v2/commons.js) */
    const kp = e.target.closest('[data-lpkeep]'), box0 = e.target.closest('[data-lppair]');
    if (kp && LEDGER && box0) { const k = kp.dataset.lpkeep, S = pairState(k), w = box0.querySelector('[data-lpwords]'), r = LEDGER.keep(k, { p: S.p, n: S.n }, box0.querySelector('.lpkeep') || box0, w ? w.value.trim() : '');
      if (r.ok) { KEPT[k] = r.e.id; NO[k] = ''; } else NO[k] = LEDGER.refusal(r.r); refreshPair(box0); return onChange(k); }
    if (box0 && LEDGER && box0.querySelector('.lptries') && LEDGER.slipClick(e, redraw => { if (redraw) KEPT[keyOf(box0.dataset.lpa, box0.dataset.lpb)] = null; refreshPair(box0); onChange(); })) return;
    const d = e.target.closest('[data-lpdraw]'), p = e.target.closest('[data-lppick]'); if (!d && !p) return;
    const box = e.target.closest('[data-lpinst]'), C = MODELS.human.control;
    if (d) STATE.human = Math.min(C.values[C.values.length - 1], valueOf('human') + 1); else chosen = +p.dataset.lppick;
    refresh(box); onChange('human');
  });
}
function refresh(box) {
  if (!box) return; const q = box.dataset.lpinst, level = box.dataset.lplevel, m = run(q, level);
  box.querySelector('.lpms').innerHTML = measuresHtml(q, m);
  const extra = box.querySelector('.lpscope, .lplays'); if (extra) { const tail = q === 'dig' ? scopeHtml(m) : layoutsHtml(m), wrap = document.createElement('div'); wrap.innerHTML = tail;
    box.querySelectorAll('.lpscope, .lplays, .lpyours').forEach(el => el.remove()); [...wrap.childNodes].forEach(n => box.appendChild(n)); }
}
