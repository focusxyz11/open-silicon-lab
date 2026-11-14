/* The gate as a relief: the first plan drawn on the one stage (docs/reviews/art-direction.md, "Gate: 2.5D relief").
   One logic gate (a two-input NAND) is four switches: two strips of silicon crossed by two gate strips, each crossing
   one switch, and metal above that brings power and takes the result out. The lesson is which layer lies over which,
   which a flat layout hides (there, a gate over silicon is only a colour mix). So the layers stand in their true order
   and height (silicon lowest, the gate strips over it, contacts as studs, copper on top), seen from 65° and never
   turned, because this layout is also what the bench and the masks show and the three must look alike. On arrival the
   layers lift apart once and settle back. The slowest signal races the clock's tick along the bottom, from your chip.

   The same plan as the flat gate (src/app/scenes.js), in the same 1000 x 1000 space, one unit per hundred.
   create(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat, box } from './kit3d.js';
import { createLevel3D } from './level3d.js';
import { chipNow } from '../app/scenes.js';
import { DEPTHS } from '../data/weave.js';
import { smooth, JOIN } from '../engines/join.js';

/* the layout, from the flat gate: [x, y, w, h] in its 1000 x 1000 space (exported: the switch's flat form is drawn from
   it, so the two never drift apart) */
export const DIFF = [[200, 220, 600, 150], [200, 630, 600, 150]];
export const GATES = [[380, 150, 60, 700], [560, 150, 60, 700]];
const CONTACTS = [[250, 240], [486, 240], [702, 262], [250, 680], [702, 680], [702, 330], [250, 310]];
const METAL = [[120, 90, 760, 56], [120, 854, 760, 56], [690, 250, 50, 470], [240, 380, 500, 40], [476, 146, 44, 110], [240, 250, 44, 170], [240, 744, 44, 110]];
/* the layers' heights: at the review's 1 to 4 per cent of the scene the relief reads as a flat drawing, so they stand
   three times as tall (the review: raise the heights before lowering the camera) */
export const H = { si: 0.3, gate: 0.3, stud: 0.6, metal: 0.3 };
const LIFT = 1.2;
export const X = x => (x - 500) / 100, Z = y => (y - 500) / 100;
/* the door into the switch: the flat level's portal, the crossing of the left gate strip with the lower silicon strip,
   on the plane the tiles stand on (docs/reviews/transitions.md). Nothing lies over it: no stud, no copper. front: the
   strips run on in front of it, and are lowered as the switch stands up */
export const PORTAL = DEPTHS.gate.portal;
export const DOOR = { at: [X(PORTAL[0] + PORTAL[2] / 2), 0, Z(PORTAL[1] + PORTAL[2] / 2)], side: PORTAL[2] / 100, front: true };

export function create(canvas, host, on = {}) {
  return createLevel3D(canvas, host, on, (scene, root, P, night) => {
    const SI = night ? 0x46536b : 0x8d99ab;
    const M = {
      si: mat(SI, { roughness: 0.35, metalness: 0.3 }),
      gate: mat(P.accent, { roughness: 0.35, metalness: 0.6 }),
      stud: mat(night ? 0xc9a14a : 0xe0b070, { roughness: 0.3, metalness: 0.9 }),
      cu: mat(night ? 0xc77b45 : 0xb5683a, { roughness: 0.3, metalness: 0.85 })
    };
    const layer = () => { const g = new THREE.Group(); root.add(g); return g; };
    const L = [layer(), layer(), layer(), layer()];
    const tile = (g, part, r, y, h, m) => { const b = box(g, r[2] / 100, h, r[3] / 100, m, X(r[0] + r[2] / 2), y, Z(r[1] + r[3] / 2), 0.02, { cast: false, receive: false }); b.userData.part = part; return b; };
    const whole = [tile(L[0], 'diff', DIFF[0], 0, H.si, M.si), tile(L[0], 'diff', DIFF[1], 0, H.si, M.si)];
    whole.push(tile(L[1], 'gates', GATES[0], H.si, H.gate, M.gate), tile(L[1], 'gates', GATES[1], H.si, H.gate, M.gate));
    /* in a join the switch stands in the door: the lower silicon strip and the left gate strip are then drawn in pieces
       round the door, and the switch's flat form takes the door's place in the same two colours, so nothing is seen to
       change as it comes on. At rest the strips are whole (no seams, no extra draws) */
    const [dx, dy, ds] = PORTAL, [sx, sy, sw, sh] = DIFF[1], [gx, gy, gw, gh] = GATES[0];
    const round = [
      [L[0], 'diff', [sx, sy, dx - sx, sh], 0, H.si, M.si], [L[0], 'diff', [dx + ds, sy, sx + sw - dx - ds, sh], 0, H.si, M.si],
      [L[0], 'diff', [dx, sy, ds, dy - sy], 0, H.si, M.si], [L[0], 'diff', [dx, dy + ds, ds, sy + sh - dy - ds], 0, H.si, M.si],
      [L[1], 'gates', [gx, gy, gw, dy - gy], H.si, H.gate, M.gate], [L[1], 'gates', [gx, dy + ds, gw, gy + gh - dy - ds], H.si, H.gate, M.gate]
    ].map(a => { const b = tile(...a); b.visible = false; b.userData.y = b.position.y; return b; });
    /* the silicon and the gate strip in front of the door lower into the ground as the switch stands up, so its cut
       face can be seen (they are gone by leave = JOIN.clear, when the switch is drawn in front) */
    const front = [round[3], round[5]];
    const pieces = (on, sink) => {
      whole[1].visible = whole[2].visible = !on; round.forEach(b => { b.visible = on; });
      front.forEach(b => { const k = 1 - sink; b.visible = on && k > 0.01; b.scale.y = Math.max(0.01, k); b.position.y = b.userData.y * k; });
    };
    CONTACTS.forEach(([x, y]) => tile(L[2], null, [x, y, 26, 26], H.si, H.stud, M.stud));
    METAL.forEach(r => tile(L[3], 'metal', r, H.si + H.stud, H.metal, M.cu));
    const TOPY = H.si + H.stud + H.metal;

    /* a signal on the output wire, and your chip's timing along the bottom: the slowest signal racing the tick */
    const live = new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: night ? 1 : 0.5, roughness: 0.4 });
    const sig = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), live); L[3].add(sig);
    const tm = (v, o) => new THREE.MeshStandardMaterial(Object.assign({ color: v, roughness: 0.5 }, o));
    const track = box(root, 7.4, 0.02, 0.1, tm(night ? 0x6f7f9c : 0x5b6a80), X(510), 0, Z(960), 0, { cast: false, receive: false }); track.userData.part = 'signal';
    const good = tm(P.good), bad = tm(P.bad);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.12), good); bar.userData.part = 'signal'; root.add(bar);
    const tick = box(root, 0.05, 0.36, 0.5, live, 0, 0, Z(960), 0, { cast: false, receive: false }); tick.userData.part = 'tick';
    const XT = v => X(140 + v * 340);
    let t = 0, lift = -1, armed = true;

    return {
      level: 'gate', parts: ['gates', 'diff', 'metal', 'tick', 'signal'],
      anchors: { gates: [X(410), H.si + H.gate, Z(560)], diff: [X(260), H.si, Z(330)], metal: [X(200), TOPY, Z(118)], tick: [XT(chipNow().tick), 0.4, Z(940)], signal: [X(170), 0.08, Z(960)] },
      /* looking down 65° (the review's 70° hides every side), never turned: the plan's across is the screen's across */
      view: { tilt: 1.13, turn: 0, r: 5.9, at: [0, 0.3, 0.35], fixed: true,
        door: DOOR,
        /* foot: it stands in the block's lighter cell by the middle of its plan, on the plane its tiles stand on */
        foot: [0, 0, 0] },
      /* leave (0..1): how far a join into the switch has gone; the door is the switch's while it is above 0 */
      update(dt, k, dist, arrived, picked, leave = 0) {
        t += dt;
        pieces(leave > 0, smooth(0.25, JOIN.clear - 0.05, leave));
        if (leave > 0) lift = -1;   /* the lift is at rest before a join draws over the door */
        /* on arrival, once, the layers lift apart and settle back */
        if (k < 0.5) armed = true;
        if (armed && k > 0.85 && arrived >= 1) { armed = false; lift = 0; }   /* not while it is still rising in a join */
        if (lift >= 0 && dt) { lift += dt / 1.8; if (lift >= 1) lift = -1; }
        const up = lift >= 0 ? Math.sin(Math.PI * lift) * LIFT : 0;
        L.forEach((g, i) => { g.position.y = i * up / 3; });
        /* the signal runs down the output wire */
        const u = (t * 0.35) % 1; sig.position.set(X(715), TOPY + 0.04, Z(250 + u * 440));
        /* the race: the slowest signal along the track; red if it arrives after the tick */
        const C = chipNow(), late = C.path > C.tick, s = Math.min(1, ((t * 0.4) % 1.25)) * C.path, x0 = X(140), x1 = XT(s);
        bar.scale.x = Math.max(0.001, x1 - x0); bar.position.set((x0 + x1) / 2, 0.03, Z(960)); bar.material = late && s > C.tick ? bad : good;
        tick.position.x = XT(C.tick);
      }
    };
  });
}
