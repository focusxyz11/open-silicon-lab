/* Lenses repaint the picture (#304, docs/FRAME13.md, "Each lens repaints"). One registry: for each core question, how
   it paints a level from its parts' facts (src/data/partfacts.js) and the model of its engine (src/engines/lens.js),
   and the instrument it puts in the lens's card, one control and its measures. A paint is drawn in the level's plan
   (the scene's 1000 by 1000, as src/app/scenes.js draws it) as an SVG layer of its own, and pinned onto the picture by
   where the plan's four corners are on the screen: the flat dive's square, or a level drawn in 3D seen in perspective
   (a plane seen in perspective is one projective map, so the whole layer follows the picture exactly). So one paint
   serves a flat scene and a 3D level alike, and each lens's layer can be drawn beside another's. Words are never in
   the paint: only shapes, colours and motion; what they mean is said in the card.
   Motion only where it carries meaning (energy travelling, currents adding), and none with reduced motion. */
import { t, fmtNum, fmtWords } from '../core/i18n.js';
import { factsOf } from '../data/partfacts.js';
import { MODELS } from '../engines/lens.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const R = r => 'x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '"';
const path = p => 'M' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L');
/* a colour along short (cool) to long or hot (warm), for 0..1 */
/* a fixed spread of 0..1, the same on every visit (each copy keeps its own speed) */
const spread = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
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
    let h = rows.map(r => '<rect x="' + (r[0] - 6) + '" y="' + (r[1] - 6) + '" width="' + (r[2] + 12) + '" height="' + (r[3] + 12) + '" rx="8" fill="none" stroke="var(--good)" stroke-width="3" stroke-dasharray="10 8"/>').join('');
    h += '<rect x="' + (mem[0] + mem[2] * 0.89) + '" y="' + mem[1] + '" width="' + (mem[2] * 0.11) + '" height="' + mem[3] + '" fill="var(--good)" fill-opacity=".35"/>';
    for (let c = 0; c < cols; c++) { const x = mem[0] + mem[2] * 0.89 * (c + 0.5) / cols, stray = (c * 7 % 10) / 10 < m.measures.off;
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
const measuresHtml = (q, m) => MODELS[q].measures.map(id => '<div class="lpm"><span class="lpml">' + esc(t('lp.' + q + '.m.' + id)) + '</span><b data-lpm="' + id + '">' + esc(unit[id](m.measures[id], q)) + '</b></div>').join('');
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

const run = (q, level) => MODELS[q].run(factsOf(level), valueOf(q));
/* the instrument a lens puts in its card at a level: its control, then its measures (and the scope, the layouts) */
export function instrument(q, level) {
  if (!paints(q, level)) return '';
  const m = run(q, level);
  return '<div class="lpinst" data-lpinst="' + q + '" data-lplevel="' + esc(level) + '">' + controlHtml(q) + '<div class="lpms">' + measuresHtml(q, m) + '</div>' +
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

/* createLensPaint(where) -> { show(q, level), hide(), update() }. where() -> { host, corners } or null: the element the
   layer stands in (under the picture's names) and the plan's four corners on the screen, null while the picture moves
   between levels or the level is not in view */
export function createLensPaint(where) {
  let layer = null, now = null, raf = 0;
  const draw = () => { if (!now || !layer) return; layer.innerHTML = '<svg viewBox="0 0 1000 1000" width="1000" height="1000" data-lens="' + now.q + '">' + PAINT[now.q](factsOf(now.level), run(now.q, now.level)) + '</svg>'; };
  function follow() {
    raf = requestAnimationFrame(follow);
    const W = now && where(); if (!W || !W.corners) { if (layer) layer.hidden = true; return; }
    if (!layer || layer.parentNode !== W.host) { if (layer) layer.remove(); layer = document.createElement('div'); layer.className = 'lenspaint'; W.host.insertBefore(layer, W.before || null); draw(); }
    const o = W.host.getBoundingClientRect();
    layer.hidden = false; layer.style.transform = 'matrix3d(' + squareTo(W.corners.map(([x, y]) => [x - o.left, y - o.top])).map(v => +v.toFixed(6)).join(',') + ')';
  }
  return {
    show(q, level) {
      if (!paints(q, level)) return this.hide();
      if (now && now.q === q && now.level === level) return;
      now = { q, level }; if (layer) draw(); cancelAnimationFrame(raf); follow();
    },
    hide() { now = null; cancelAnimationFrame(raf); if (layer) { layer.remove(); layer = null; } },
    /* a control moved: the layer and the card's measures follow it */
    update() { draw(); },
    lens: () => (now ? now.q : null)
  };
}

/* the instrument's controls, wherever its card is: a control moved re-runs the lens's model, redraws its measures (and
   scope or layouts) in the card, and tells the layer (onChange) */
export function wire(onChange) {
  document.addEventListener('input', e => {
    const c = e.target.closest('[data-lpctl]'); if (!c) return;
    const q = c.dataset.lpctl, box = c.closest('[data-lpinst]'), C = MODELS[q].control, v = C.values[+c.value];
    STATE[q] = v; c.setAttribute('aria-valuetext', atText(q, v));
    refresh(box); onChange(q);
  });
  document.addEventListener('click', e => {
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
