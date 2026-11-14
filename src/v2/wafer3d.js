/* The wafer in 3D (docs/reviews/art-direction.md, "Wafer: 3D"): a round disc of silicon printed with your chips. A
   learner must see that it is cut into square chips, that the pieces at the rim are wasted, and that specks land at
   random and each one kills the chip it lands on. The disc and its chips are the object people know from
   photographs, and they cost almost nothing: one disc, one instanced draw for the whole chips, one for the pieces at
   the rim, one for the specks. Seen from 65°, so the grid still reads as a grid; it turns 20° each way and sways.

   The chips, the specks and which chips they kill are the flat wafer's (src/app/scenes.js: waferNow), from your
   chip's size and generation, so a bigger chip shows fewer chips and more of them lost.
   create(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat } from './kit3d.js';
import { createLevel3D } from './level3d.js';
import { waferNow } from '../app/scenes.js';

const X = x => (x - 500) / 100, Z = y => (y - 500) / 100;
/* the part of a square inside a circle (the circle as a polygon of 72 sides), clipped edge by edge */
function clipToDisc(r, R) {
  let poly = [[r[0], r[1]], [r[0] + r[2], r[1]], [r[0] + r[2], r[1] + r[3]], [r[0], r[1] + r[3]]];
  const N = 72;
  for (let k = 0; k < N && poly.length; k++) {
    const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2, A = [500 + Math.cos(a0) * R, 500 + Math.sin(a0) * R], B = [500 + Math.cos(a1) * R, 500 + Math.sin(a1) * R];
    const inside = p => (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]) >= 0;
    const cut = (p, q) => { const d1 = (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]), d2 = (B[0] - A[0]) * (q[1] - A[1]) - (B[1] - A[1]) * (q[0] - A[0]), u = d1 / (d1 - d2); return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]; };
    const out = [];
    poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], pi = inside(p), qi = inside(q); if (pi) out.push(p); if (pi !== qi) out.push(cut(p, q)); });
    poly = out;
  }
  return poly;
}

export function create(canvas, host, on = {}) {
  return createLevel3D(canvas, host, on, (scene, root, P, night) => {
    const W = waferNow(), R = W.R, col = (n, d) => (night ? n : d);
    /* the chuck that holds it, and the disc: polished silicon, with its notch */
    const chuck = new THREE.Mesh(new THREE.CylinderGeometry(R / 100 + 0.35, R / 100 + 0.35, 0.12, 96), mat(col(0x151d2c, 0x9aa4b2), { roughness: 0.7 }));
    chuck.position.y = -0.2; root.add(chuck);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(R / 100, R / 100, 0.08, 128), mat(col(0x3b4862, 0x8e9bb0), { roughness: 0.22, metalness: 0.65 }));
    disc.position.y = -0.04; disc.userData.part = 'dies'; root.add(disc);
    const notch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), mat(col(0x151d2c, 0x9aa4b2), { roughness: 0.7 }));
    notch.position.set(0, -0.04, R / 100); root.add(notch);

    /* the whole chips: each a low tile; one a speck touched is lost (red: wrong), and the one the dive follows is a
       shade lighter */
    const unit = new THREE.BoxGeometry(1, 1, 1), o = new THREE.Object3D(), f = W.follow;
    const tones = { ok: new THREE.Color(col(0x33415c, 0xd5dde8)), lost: new THREE.Color(col(0x33415c, 0xd5dde8)).lerp(new THREE.Color(P.bad), night ? 0.45 : 0.55), follow: new THREE.Color(col(0x51678d, 0xf3f6fa)) };
    const chips = new THREE.InstancedMesh(unit, mat(0xffffff, { roughness: 0.35, metalness: 0.3 }), W.dies.length); chips.userData.part = 'dies';
    W.dies.forEach((d, i) => {
      const followed = Math.abs(d[0] - f[0]) < 1 && Math.abs(d[1] - f[1]) < 1;
      o.position.set(X(d[0] + d[2] / 2), followed ? 0.05 : 0.025, Z(d[1] + d[3] / 2)); o.scale.set(d[2] / 100, followed ? 0.1 : 0.05, d[3] / 100); o.updateMatrix();
      chips.setMatrixAt(i, o.matrix); chips.setColorAt(i, W.hits[i] ? tones.lost : followed ? tones.follow : tones.ok);
    });
    root.add(chips);

    /* the pieces at the rim: the pattern is printed across the whole disc, but a chip cut by the edge is wasted */
    const side = W.dies.length ? W.dies[0][2] : 44, pitch = side + 2, x0 = W.dies.length ? W.dies[0][0] : 500 - side / 2, y0 = W.dies.length ? W.dies[0][1] : 500 - side / 2;
    const whole = new Set(W.dies.map(d => Math.round(d[0]) + ',' + Math.round(d[1]))), shapes = [];
    const n = Math.ceil(R / pitch) + 2, i0 = Math.round((500 - x0) / pitch), j0 = Math.round((500 - y0) / pitch);
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
      const x = x0 + i0 * pitch + i * pitch, y = y0 + j0 * pitch + j * pitch;   /* the grid, from the chip at the middle */
      if (whole.has(Math.round(x) + ',' + Math.round(y))) continue;
      const poly = clipToDisc([x, y, side, side], R - 2); if (poly.length < 3) continue;
      const area = Math.abs(poly.reduce((a, p, k) => { const q = poly[(k + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2; if (area < 30) continue;
      shapes.push(new THREE.Shape(poly.map(p => new THREE.Vector2(X(p[0]), -Z(p[1])))));
    }
    if (shapes.length) {
      /* lower and duller than a whole chip: printed, but lost */
      const g = new THREE.ExtrudeGeometry(shapes, { depth: 0.025, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
      const rim = new THREE.Mesh(g, mat(col(0x4d5566, 0x9aa5b4), { roughness: 0.75, metalness: 0.1 })); rim.userData.part = 'dies'; root.add(rim);
    }

    /* the specks, each glowing where it landed */
    const specks = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: night ? 1.1 : 0.6, roughness: 0.4 }), Math.max(1, W.specks.length));
    specks.userData.part = 'defects'; specks.count = W.specks.length; root.add(specks);
    const placeSpecks = t => { W.specks.forEach((p, i) => { const k = 0.6 + 0.4 * Math.sin(t * 2 + i); o.position.set(X(p[0]), 0.1, Z(p[1])); o.scale.setScalar(0.05 + 0.03 * k); o.updateMatrix(); specks.setMatrixAt(i, o.matrix); }); specks.instanceMatrix.needsUpdate = true; };
    placeSpecks(0);
    [chips, specks].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    root.traverse(m => { m.castShadow = m.receiveShadow = false; });

    let t = 0;
    const firstSpeck = W.specks[0] || [700, 300], aChip = W.dies.find((d, i) => !W.hits[i] && d[0] < 400 && d[1] < 400) || W.dies[0] || [300, 300, 40];
    return {
      level: 'wafer', parts: ['dies', 'defects'],
      anchors: { dies: [X(aChip[0] + aChip[2] / 2), 0.08, Z(aChip[1] + aChip[3] / 2)], defects: [X(firstSpeck[0]), 0.14, Z(firstSpeck[1])] },
      /* looking down 65°, turned like the stack */
      view: { tilt: 1.13, turn: -0.62, r: R / 100 + 0.6, at: [0, 0, 0] },
      update(dt) { if (!dt) return; t += dt; placeSpecks(t); }
    };
  });
}
