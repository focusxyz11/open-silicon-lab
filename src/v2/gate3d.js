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

/* the layout, from the flat gate: [x, y, w, h] in its 1000 x 1000 space */
const DIFF = [[200, 220, 600, 150], [200, 630, 600, 150]];
const GATES = [[380, 150, 60, 700], [560, 150, 60, 700]];
const CONTACTS = [[250, 240], [486, 240], [702, 262], [250, 680], [702, 680], [702, 330], [250, 310]];
const METAL = [[120, 90, 760, 56], [120, 854, 760, 56], [690, 250, 50, 470], [240, 380, 500, 40], [476, 146, 44, 110], [240, 250, 44, 170], [240, 744, 44, 110]];
/* the layers' heights: at the review's 1 to 4 per cent of the scene the relief reads as a flat drawing, so they stand
   three times as tall (the review: raise the heights before lowering the camera) */
const H = { si: 0.3, gate: 0.3, stud: 0.6, metal: 0.3 }, LIFT = 1.2;
const X = x => (x - 500) / 100, Z = y => (y - 500) / 100;

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
    DIFF.forEach(r => tile(L[0], 'diff', r, 0, H.si, M.si));
    GATES.forEach(r => tile(L[1], 'gates', r, H.si, H.gate, M.gate));
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
        /* the door into the switch: the flat level's portal, the crossing of the left gate strip with the lower silicon
           strip, on the plane the tiles stand on (docs/reviews/transitions.md) */
        door: (() => { const p = DEPTHS.gate.portal; return { at: [X(p[0] + p[2] / 2), 0, Z(p[1] + p[2] / 2)], side: p[2] / 100 }; })() },
      update(dt, k) {
        t += dt;
        /* on arrival, once, the layers lift apart and settle back */
        if (k < 0.5) armed = true;
        if (armed && k > 0.85) { armed = false; lift = 0; }
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
