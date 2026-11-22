/* The blueprint's geometry (the first page, src/v2/home.js; data in src/data/blueprint.js). The lab's grid bent into a
   wheel: around it a chip's life, the loop's six stages, each a sector of 60 degrees with Open at the top and going
   clockwise; inward its scale, a ring for each level from the world at the rim to the atom at the centre. Pure: angles
   in degrees, points in the wheel's own units (its centre at 0,0). */
import { STAGES, RINGS } from '../data/blueprint.js';

const RAD = Math.PI / 180;
export const SPAN = 360 / STAGES.length;
/* the centre angle of a stage's sector (Open at the top, -90 degrees) */
export const angleOf = stage => -90 + SPAN * STAGES.indexOf(stage);
export const radiusOf = ring => RINGS.find(r => r.id === ring).r;
export const pol = (r, deg) => [+(r * Math.cos(deg * RAD)).toFixed(2), +(r * Math.sin(deg * RAD)).toFixed(2)];

/* where a thing sits: its stage's angle moved by off (a share of half the sector, -1 to 1), at its ring's radius moved by dr */
export function placeOf({ stage, ring, off = 0, dr = 0 }) {
  const deg = angleOf(stage) + off * SPAN / 2, r = radiusOf(ring) + dr;
  const [x, y] = pol(r, deg);
  return { x, y, deg, r };
}

/* an arc of radius r from angle a0 to a1, drawn clockwise; reverse draws it the other way, so text along it reads upright
   in the lower half of the wheel */
export function arc(r, a0, a1, reverse = false) {
  const [x0, y0] = pol(r, reverse ? a1 : a0), [x1, y1] = pol(r, reverse ? a0 : a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return 'M' + x0 + ' ' + y0 + 'A' + r + ' ' + r + ' 0 ' + large + ' ' + (reverse ? 0 : 1) + ' ' + x1 + ' ' + y1;
}
/* a band between two radii over an angle: a sector of a ring */
export function band(r0, r1, a0, a1) {
  const [ax, ay] = pol(r1, a0), [bx, by] = pol(r1, a1), [cx, cy] = pol(r0, a1), [dx, dy] = pol(r0, a0);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return 'M' + ax + ' ' + ay + 'A' + r1 + ' ' + r1 + ' 0 ' + large + ' 1 ' + bx + ' ' + by + 'L' + cx + ' ' + cy + 'A' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + dx + ' ' + dy + 'Z';
}
/* a stage's sector from r0 to r1 */
export const sector = (stage, r0, r1, pad = 0) => { const a = angleOf(stage); return band(r0, r1, a - SPAN / 2 + pad, a + SPAN / 2 - pad); };
/* text along the rim reads upright: in the lower half (angles 0 to 180) the arc is drawn the other way round */
export const lower = deg => { const d = ((deg % 360) + 360) % 360; return d > 0 && d < 180; };

/* a path through things in order, as straight runs between them */
export const through = items => items.map((it, i) => (i ? 'L' : 'M') + it.x + ' ' + it.y).join('');

/* where a wall bites, nearest to a point: the point on its arc at the point's angle, kept inside the arc's span */
export function onWall(wall, p) {
  const a0 = wall.from, a1 = wall.to;
  let deg = Math.atan2(p.y, p.x) / RAD;
  while (deg < a0) deg += 360;
  while (deg > a0 + 360) deg -= 360;
  const clamped = deg > a1 ? (deg - a1 < a0 + 360 - deg ? a1 : a0) : deg;
  const [x, y] = pol(wall.r, clamped);
  return { x, y };
}

/* the people and AI band: how much of each stage's work AI generates at a step of the slider (0 today, 1, 2) and how much
   is left to people; never less than the floor, what only people can bring (data: ROLES[stage].ai, a share per step) */
export const PEOPLE_FLOOR = 0.2;
export function shares(role, step) {
  const ai = Math.min(1 - PEOPLE_FLOOR, role.ai[Math.max(0, Math.min(role.ai.length - 1, step))]);
  return { ai, people: 1 - ai };
}
