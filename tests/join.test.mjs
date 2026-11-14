/* the join's arithmetic (src/engines/join.js; docs/reviews/transitions.md step 1): the camera path starts at the
   parent's rest and ends at the child's, the two cameras are one, and the numbers the plan states hold */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pose, childPose, toParent, toChild, eye, scaleOf } from '../src/engines/join.js';

const GATE = { at: [0, 0.3, 0.35], tilt: 1.13, turn: 0, r: 5.9 };
const SWITCH = { at: [0, 2.1, -0.4], tilt: 0.44, turn: -0.32, r: 4.1 };
const ATOM = { at: [1.5, 1.24, 1], tilt: 0.3, turn: -0.62, r: 2.5 };
const GS = { door: { at: [-0.9, 0, 2.05], side: 0.9 }, foot: [0, 0, -0.6] };
const SA = { door: { at: [0, 2.34, 0.05], side: 0.05 * 2 * 4.1 / 1.05, yaw: 0.17 }, foot: [1.5, 2, 2] };
const PAIRS = [['gate to switch', GATE, SWITCH, GS], ['switch to atom', SWITCH, ATOM, SA]];
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const nearV = (a, b, e = 1e-9) => a.every((v, i) => near(v, b[i], e));

test('the join starts at the parent at rest and ends at the child at rest', () => {
  for (const [name, P, C, { door, foot }] of PAIRS) {
    const fit = 20, p0 = pose(0, P, C, door, foot, fit);
    assert.ok(nearV(p0.at, P.at) && near(p0.tilt, P.tilt) && near(p0.turn, P.turn) && near(p0.dist, fit), name + ': not the parent at f = 0');
    const c1 = childPose(pose(1, P, C, door, foot, fit), door, foot);
    assert.ok(nearV(c1.at, C.at) && near(c1.tilt, C.tilt) && near(c1.turn, C.turn) && near(c1.dist, fit * C.r / P.r), name + ': not the child at f = 1');
  }
});

test('a point goes to the child and back unchanged, with and without a turn', () => {
  for (const [, , C, { door, foot }] of PAIRS) {
    const s = scaleOf(door, C);
    for (const p of [[0, 0, 0], [1, 2, 3], [-2.5, 0.4, 1.7]]) assert.ok(nearV(toChild(toParent(p, door, foot, s), door, foot, s), p));
  }
});

test('the camera closes in all the way and its angle stays between the two levels', () => {
  for (const [name, P, C, { door, foot }] of PAIRS) {
    let last = Infinity;
    for (let i = 0; i <= 100; i++) {
      const p = pose(i / 100, P, C, door, foot, 20);
      assert.ok(p.dist < last, name + ': the distance grew at ' + i / 100); last = p.dist;
      assert.ok(p.tilt <= Math.max(P.tilt, C.tilt) + 1e-12 && p.tilt >= Math.min(P.tilt, C.tilt) - 1e-12, name + ': the tilt left its range');
    }
  }
});

test('the plan\'s numbers: scale and ratio of each pair', () => {
  const g = scaleOf(GS.door, SWITCH), a = scaleOf(SA.door, ATOM);
  assert.ok(near(g, 0.1152, 1e-3) && near(g * SWITCH.r / GATE.r, 0.0801, 1e-3), 'gate to switch');
  assert.ok(near(a, 0.0820, 1e-3) && near(a * ATOM.r / SWITCH.r, 0.0500, 1e-3), 'switch to atom');
});

test('the two cameras are one camera', () => {
  for (const [name, P, C, { door, foot }] of PAIRS) for (const f of [0.3, 0.7]) {
    const p = pose(f, P, C, door, foot, 20);
    assert.ok(nearV(eye(childPose(p, door, foot)), toChild(eye(p), door, foot, p.s), 1e-9), name + ' at ' + f);
  }
});
