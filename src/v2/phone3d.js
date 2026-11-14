/* The phone in 3D (docs/reviews/art-direction.md, "Phone: 3D"): the first picture of the way down a phone. A learner
   must see that most of a phone is battery and screen, and the computer is one small board. So the phone comes apart
   along one axis as you arrive, its layers sliding out to lie side by side as in a teardown: the screen, the frame
   with the battery that fills most of it, the small main board at one end and the camera beside it, the frame's edges
   that are its antennas, and the back with the camera's lenses. Coming back up from the board, it stays apart.

   Bright metal for the frame, glass for screen and back, the board as every board is (kit3d.js BOARD), the battery
   plastic with a warm band that is its charge, from your chip's power. No texture: the screen is dark glass.
   create(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat, box, glass, BOARD } from './kit3d.js';
import { createLevel3D } from './level3d.js';
import { chipNow } from '../app/scenes.js';

/* the phone's size in units: across, thick, long */
const PW = 3.6, PT = 0.32, PL = 7.6;

export function create(canvas, host, on = {}) {
  return createLevel3D(canvas, host, on, (scene, root, P, night) => {
    const K = BOARD(night), col = (n, d) => (night ? n : d);
    const M = {
      frame: mat(col(0x6c7684, 0xb8c0cc), { roughness: 0.28, metalness: 0.85 }),
      band: mat(col(0x3a4250, 0x5d6b7e), { roughness: 0.4, metalness: 0.6 }),
      screen: mat(col(0x05080e, 0x111824), { roughness: 0.08, metalness: 0.4 }),
      bezel: glass(col(0x5aa9e6, 0x9fc4dc), { opacity: 0.25, depthWrite: false }),
      back: mat(col(0x2a3346, 0xd9dee6), { roughness: 0.18, metalness: 0.25 }),
      battery: mat(col(0x2c3442, 0x3a4250), { roughness: 0.55, metalness: 0.2 }),
      board: mat(K.board, { roughness: 0.7 }), plastic: mat(K.plastic, { roughness: 0.5 }), pin: mat(K.pin, { roughness: 0.3, metalness: 0.9 }),
      lens: mat(0x0b0f16, { roughness: 0.05, metalness: 0.6 }), ring: mat(col(0x8b95a5, 0xb9c1cc), { roughness: 0.25, metalness: 0.85 })
    };
    const tag = (m, part) => { m.userData.part = part || null; m.traverse(q => { q.userData.part = part || null; q.castShadow = q.receiveShadow = false; }); return m; };
    const layer = () => { const g = new THREE.Group(); root.add(g); return g; };
    /* three layers: the back (below), the frame and what is in it, the screen (above) */
    const backL = layer(), midL = layer(), topL = layer();

    /* the back: glass, with the camera's bump and its lenses (seen from outside, as it lies turned over) */
    tag(box(backL, PW, 0.06, PL, M.back, 0, 0, 0, 0.3), null);
    tag(box(backL, 1.3, 0.08, 1.3, M.back, -0.95, 0.06, -2.75, 0.3), 'camera');
    [[-1.22, -3.02], [-0.68, -3.02], [-1.22, -2.48]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 24), M.ring); r.position.set(x, 0.17, z); backL.add(tag(r, 'camera')); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.07, 24), M.lens); l.position.set(x, 0.18, z); backL.add(tag(l, 'camera')); });

    /* the frame: four walls of bright metal; the bands across them are the antennas */
    const FT = 0.12;
    [[PW, FT, 0, -PL / 2 + FT / 2], [PW, FT, 0, PL / 2 - FT / 2], [FT, PL, -PW / 2 + FT / 2, 0], [FT, PL, PW / 2 - FT / 2, 0]].forEach(([w, d, x, z]) => tag(box(midL, w, PT, d, M.frame, x, 0, z, 0.04), null));
    [[-PL / 2 + 0.7], [PL / 2 - 0.7]].forEach(([z]) => [-1, 1].forEach(s => tag(box(midL, FT + 0.01, PT + 0.01, 0.06, M.band, s * (PW / 2 - FT / 2), -0.005, z, 0), 'antenna')));
    tag(box(midL, PW - 0.25, 0.02, PL - 0.25, M.band, 0, 0, 0, 0.1), null);   /* the plate the parts sit on */
    /* the battery: most of the phone; its warm band is the charge left, which your chip spends */
    tag(box(midL, PW - 0.6, 0.22, 4.3, M.battery, 0, 0.02, 1.15, 0.12), 'battery');
    const charge = new THREE.Mesh(new THREE.BoxGeometry(1, 0.01, 1), new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: night ? 0.5 : 0.2, roughness: 0.5 }));
    charge.position.set(PW / 2 - 0.62, 0.245, 1.15); midL.add(tag(charge, 'battery'));   /* a thin gauge along its edge */
    /* the main board: small, at the top end, with the chip and its memory stacked on it, and a few parts */
    tag(box(midL, PW - 0.5, 0.05, 2.2, M.board, 0.1, 0.02, -2.4, 0.06), 'board');
    tag(box(midL, 0.95, 0.12, 0.95, M.plastic, 0.45, 0.07, -2.35, 0.03), 'board');
    tag(box(midL, 0.7, 0.08, 0.5, M.plastic, -0.4, 0.07, -1.75, 0.02), 'board');
    tag(box(midL, 0.5, 0.06, 0.5, M.plastic, 1.15, 0.07, -1.7, 0.02), 'board');
    tag(box(midL, 0.8, 0.04, 0.22, M.pin, 1.1, 0.07, -3.2, 0.01), 'board');
    /* the camera's module, beside the board, under the bump */
    tag(box(midL, 1.1, 0.24, 1.1, M.plastic, -0.95, 0.02, -2.75, 0.08), 'camera');

    /* the screen: dark glass on top, with a thin glass edge */
    tag(box(topL, PW, 0.07, PL, M.screen, 0, 0, 0, 0.3), null);
    tag(box(topL, PW + 0.02, 0.075, PL + 0.02, M.bezel, 0, -0.003, 0, 0.31), null);

    /* closed, the layers sit on each other; apart, they slide along one axis and lie side by side, as in a teardown:
       the screen to one side, the frame and what is in it in the middle, the back (turned over, camera up) to the other */
    const shut = { back: 0, mid: 0.06, top: 0.06 + PT }, GAP = PW + 0.7;
    const place = e => {
      const lift = Math.sin(Math.PI * e) * 0.9;   /* each lifts as it slides, and settles */
      backL.position.set(GAP * e, shut.back * (1 - e) + lift * 0.6, 0);
      midL.position.set(0, shut.mid * (1 - e), 0);
      topL.position.set(-GAP * e, shut.top * (1 - e) + lift, 0);
    };
    place(1);
    let t = 0;
    return {
      level: 'phone', parts: ['battery', 'board', 'camera', 'antenna'],
      anchors: { battery: [-0.3, 0.3, 1.6], board: [0.5, 0.25, -2.0], camera: [-0.95 + GAP, 0.3, -2.75], antenna: [-PW / 2, 0.35, PL / 2 - 0.7] },
      /* a hero object: seen from above at an angle, turned like the stack; as you arrive, it comes apart */
      view: { tilt: 0.75, turn: -0.42, r: 6.4, at: [0, 0.2, 0.3], arrive: { tilt: 0.5, turn: -0.7, ms: 2200 } },
      update(dt, k, dist, arrived) {
        t += dt;
        place(arrived);
        const c = chipNow(), level = Math.max(0.08, Math.min(0.95, 0.55 * Math.sqrt(c.battery || 1)));
        charge.scale.set(0.16, 1, 4.0 * level); charge.position.z = 1.15 + 2.0 * (1 - level);
      }
    };
  });
}
