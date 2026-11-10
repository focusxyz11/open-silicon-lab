/* One answer: the logic of the journey, with no DOM, so it is tested (tests/journey.test.mjs).

   - The time lens: what state each depth is in for a year (a ghost before it existed, real, or
     unfinished after today) and which time line to show.
   - The dive: the size of the view at every depth and where the next depth sits inside it. The lower
     three depths (block, gate, switch) come from src/engines/chipzoom.js: a real full adder,
     synthesised, placed and routed by the same engines the tiny-chip studio uses, at the process
     nearest the chosen year.
   - The constellation: the visitor's stars and the lines between them. Stars of one question join
     into a shape; links between questions (frame LINKS) join shapes faintly. The lines are the eleven
     questions, seen only as patterns in what the visitor found.

   What is simplified: the upper scenes (planet to chip) are drawn in general terms; only the adder
   and its transistors are computed. The process for a year is the nearest of the four this lab
   models (180, 130, 28 and 3 nm), not the exact node of that year. */
import { build, GATE } from './chipzoom.js';
import TC from './tinychip.js';
import { DEPTHS, LINKS, QUESTIONS } from '../data/frame.js';
import { STOPS, EDGES, SKY, LENS } from '../data/journeys.js';

export const NOW = 2026;
export const clampYear = y => Math.max(LENS.min, Math.min(LENS.max, Math.round(+y || NOW)));

/* ---------- the time lens ---------- */
export const stopOf = depth => STOPS.find(s => s.depth === depth);
/* 'ghost' before the place existed in the story, 'future' after today, otherwise 'real'. */
export function stateAt(depth, year) {
  const s = stopOf(depth), y = clampYear(year);
  if (y < s.born) return 'ghost';
  return y > NOW ? 'future' : 'real';
}
/* Which time line holds in that year: a year from the stop's times, or 'before'. */
export function lineAt(depth, year) {
  const s = stopOf(depth), y = clampYear(year);
  let k = 'before';
  for (const t of s.times) if (t <= y) k = t;
  return y < s.born ? 'before' : String(k);
}
/* The process this lab models nearest to a year. */
export function nodeFor(year) { const y = clampYear(year); return y < 2001 ? '180' : y < 2011 ? '130' : y < 2022 ? '28' : '3'; }
/* The shape of the switch: point contact (1947), flat (planar), a fin, sheets wrapped by the gate, or
   stacked n- and p-type sheets (CFET, a projection: imec roadmap, fact imec-cfet). */
export function shapeFor(year) { const y = clampYear(year); return y < 1959 ? 'contact' : y < 2011 ? 'planar' : y < 2022 ? 'fin' : y < 2033 ? 'gaa' : 'cfet'; }
/* The material of the switch: germanium until silicon took over (1954 on). */
export const materialFor = year => clampYear(year) < 1954 ? 'ge' : 'si';

/* ---------- the dive ---------- */
/* The adder at every process, built once each: the same full adder the studio offers, written as its solution. */
const ADDER = TC.PROJ.find(p => p.id === 'full');
const cache = {};
export function adderAt(node) {
  if (!cache[node]) cache[node] = build({ p: 'full', code: ADDER.sol, node, lib: 'basic', util: 0.5 });
  return cache[node];
}
/* The multiply-add array at the block depth: G × G units, the adder sits in unit `mine`. */
export const MAC = { G: 7, mine: [4, 3] };

/* Metres across the view at each depth. The upper six follow the frame's depths (the rack and chip are
   widened a little so the whole rack and a whole package fit); the lower three come from the adder. */
export function sizes(Z) {
  const m = id => DEPTHS.find(d => d.id === id).m, U = Z.um;
  const pitch = Math.max(U.dW, U.dH) * 1.35;
  return {
    planet: m('planet'), region: m('region'), building: m('building'), rack: 2.6, board: m('board'), chip: 0.045,
    block: Math.max(m('block'), pitch * (MAC.G + 1)), gate: Math.max(U.cW, U.cH) * 1.3, switch: GATE[Z.node] * 7, atom: m('atom'),
    pitch
  };
}
/* Where the next depth sits inside block, gate and switch, in metres from the centre of the view. */
export function inner(Z) {
  const S = sizes(Z), U = Z.um, cl = Z.cell, f = Z.circuit.fets[Z.fetI];
  const unit = [(MAC.mine[0] - (MAC.G - 1) / 2) * S.pitch, (MAC.mine[1] - (MAC.G - 1) / 2) * S.pitch];
  const cellC = [unit[0] + (cl.x + cl.w / 2) * U.ux - U.dW / 2, unit[1] + (cl.y + 1.5) * U.uy - U.dH / 2];
  const fetC = [(f.x - 0.5) * U.cW, (f.y - 0.5) * U.cH];
  return { unit, cellC, fetC };
}
/* The levels of the zoom: id, size in metres, and T = the next level's centre as a fraction of this
   level's half-width. up: the centres the view draws for the upper depths, by depth id. */
export function levels(Z, up, year) {
  const S = sizes(Z), I = inner(Z), sh = shapeFor(year);
  const T = (c, size) => [c[0] / (size / 2), c[1] / (size / 2)];
  const sw = sh === 'gaa' || sh === 'cfet' ? [0, -0.145] : sh === 'fin' ? [0, -0.06] : [0, 0.075];
  return DEPTHS.map(d => {
    const id = d.id, size = S[id];
    let t = up[id] || null;
    if (id === 'block') t = T(I.cellC, size);
    if (id === 'gate') t = T(I.fetC, size);
    if (id === 'switch') t = sw;
    if (id === 'atom') t = null;
    return { id, size, T: t };
  });
}
/* A point along a polyline at p (0..1), by length. */
export function along(pts, p) {
  const seg = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
  let d = Math.max(0, Math.min(1, p)) * tot;
  for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const f = seg[i] ? Math.min(1, d / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; } d -= seg[i]; }
  return pts[pts.length - 1];
}

/* ---------- the constellation ---------- */
/* A small fixed scatter, so each question's stars form a shape around its place in the sky. */
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
export const DEPTH_ORDER = DEPTHS.map(d => d.id);
export function starAt(edge) {
  const [x, y] = SKY[edge.q], a = hash(edge.id) * Math.PI * 2, r = 0.05 + 0.06 * hash(edge.id + '*');
  return [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9];
}
/* found: the ids of the edges the visitor has opened. Returns the stars, the lines and the questions
   whose shape has formed (two or more stars). */
export function constellation(found) {
  const stars = EDGES.filter(e => found.includes(e.id)).map(e => ({ id: e.id, q: e.q, depth: e.depth, at: starAt(e) }));
  const lines = [], byQ = {};
  stars.forEach(s => { (byQ[s.q] = byQ[s.q] || []).push(s); });
  for (const q in byQ) {
    const list = byQ[q].sort((a, b) => DEPTH_ORDER.indexOf(a.depth) - DEPTH_ORDER.indexOf(b.depth));
    for (let i = 1; i < list.length; i++) lines.push({ a: list[i - 1].id, b: list[i].id, kind: 'same', q });
  }
  for (const [qa, qb, why] of LINKS) {
    if (!byQ[qa] || !byQ[qb]) continue;
    /* the closest pair of stars between the two shapes */
    let best = null;
    for (const a of byQ[qa]) for (const b of byQ[qb]) { const d = Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]); if (!best || d < best.d) best = { a: a.id, b: b.id, d }; }
    lines.push({ a: best.a, b: best.b, kind: 'portal', why, qs: [qa, qb] });
  }
  const formed = Object.keys(byQ).filter(q => byQ[q].length >= 2);
  return { stars, lines, formed, questions: QUESTIONS.length };
}
