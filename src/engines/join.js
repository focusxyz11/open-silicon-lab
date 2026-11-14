/* The join: going from one level in 3D to the next with no flat picture between (docs/reviews/transitions.md, by
   Claude Fable 5.2). Between two neighbouring levels the parent's scene is drawn, then the child's over it with the
   same camera expressed in the child's units, so the child stands exactly in the parent's door. This file is the
   arithmetic only: no DOM, no three.js. Points are [x, y, z], angles radians, a level is { at, tilt, turn, r } as a
   model's view (src/v2/level3d.js).
   door (the parent's): where the next level stands, in the parent's units: { at, side, yaw }.
   foot (the child's): the child's point, in its own units, that stands on the door's at. */
export const square = r => 2 * r / 1.05;                               // a level's square, in its own units (level3d.js place())
export const scaleOf = (door, child) => door.side / square(child.r);   // parent units per child unit
export const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
/* a turn about y, as three.js's rotation.y: x' = x cos a + z sin a, z' = -x sin a + z cos a */
export const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
/* a point of the child, in the parent's units, and back */
export function toParent(p, door, foot, s) { const q = rotY([p[0] - foot[0], p[1] - foot[1], p[2] - foot[2]], door.yaw || 0); return [door.at[0] + s * q[0], door.at[1] + s * q[1], door.at[2] + s * q[2]]; }
export function toChild(p, door, foot, s) { const q = rotY([(p[0] - door.at[0]) / s, (p[1] - door.at[1]) / s, (p[2] - door.at[2]) / s], -(door.yaw || 0)); return [foot[0] + q[0], foot[1] + q[1], foot[2] + q[2]]; }
/* the camera at fraction f of the way from parent P to child C, in the parent's units. fitP: the parent's rest
   distance (what place() computes); the child's is fitP * C.r / P.r on the same screen. The distance falls
   geometrically, as the flat zoom does, and the look-at follows the same law as cam() in weave.js, so the door is
   the zoom's fixed point; the angles turn within the window win, so the first fifth of the move is straight in */
export function pose(f, P, C, door, foot, fitP, win = [0.2, 0.9]) {
  const s = scaleOf(door, C), rho = s * C.r / P.r, k = Math.pow(rho, f), u = (1 - k) / (1 - rho), e = smooth(win[0], win[1], f);
  const a1 = toParent(C.at, door, foot, s), at = P.at.map((v, i) => v + (a1[i] - v) * u);
  return { at, tilt: P.tilt + (C.tilt - P.tilt) * e, turn: P.turn + (C.turn + (door.yaw || 0) - P.turn) * e, dist: fitP * k, s };
}
/* the same camera in the child's units */
export const childPose = (p, door, foot) => ({ at: toChild(p.at, door, foot, p.s), tilt: p.tilt, turn: p.turn - (door.yaw || 0), dist: p.dist / p.s });
/* where the camera stands (as place() in level3d.js) */
export const eye = p => [p.at[0] + Math.sin(p.turn) * Math.cos(p.tilt) * p.dist, p.at[1] + Math.sin(p.tilt) * p.dist, p.at[2] + Math.cos(p.turn) * Math.cos(p.tilt) * p.dist];
/* the windows of a join, so the shell, the levels and the tests agree: joined between from and to, the child drawn
   from child, the child leads from lead, the parent fades into the sky over veil; behind a door with tiles in front
   of it (door.front) the child is hidden by them until the parent's leave reaches clear (the parent has lowered them
   by then) */
export const JOIN = { from: 0.08, to: 0.92, child: 0.12, lead: 0.5, veil: [0.55, 0.92], clear: 0.7 };
