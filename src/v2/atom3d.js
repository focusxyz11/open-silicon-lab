/* The atom in 3D: the bottom of the zoom drawn on the one stage (docs/reviews/art-direction.md, "Atom: 3D").
   A small crystal of silicon, two cells deep: every atom holds four neighbours in the same regular pattern (the
   diamond lattice), which a flat net cannot show; one added atom of another kind sits in a place of that pattern; a
   few electrons move loose through it; and on top lies the insulating skin, a different, disordered material. The
   back fades into the sky, and a slow sway lets the pattern be read by movement.

   Six draws in all: one instanced sphere and one instanced bond for the crystal, the same for the skin, the added
   atom, and the electrons. Materials are the shared ones: silicon blue-grey, the added atom doped (silicon mixed
   towards warm), the skin glass, electrons glowing in the accent.
   create(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat } from './kit3d.js';
import { createLevel3D } from './level3d.js';

/* the diamond lattice: a face-centred cubic pattern, and the same again shifted a quarter along the diagonal */
const BASIS = [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0], [0.25, 0.25, 0.25], [0.25, 0.75, 0.75], [0.75, 0.25, 0.75], [0.75, 0.75, 0.25]];
export function crystal(nx, ny, nz) {
  const pts = [], key = new Set(), e = 1e-6;
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) for (let k = 0; k <= nz; k++) BASIS.forEach(b => {
    const p = [i + b[0], j + b[1], k + b[2]];
    if (p[0] > nx + e || p[1] > ny + e || p[2] > nz + e) return;
    const s = p.map(v => v.toFixed(3)).join(); if (!key.has(s)) { key.add(s); pts.push(p); }
  });
  /* bonds: each pair of atoms a quarter of a cube's diagonal apart */
  const L = Math.sqrt(3) / 4, near = (a, b) => Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - L) < 0.02;
  /* an atom left at a corner with a single bond is only noise: the block keeps those with two or more */
  const count = pts.map(p => pts.filter(q => q !== p && near(p, q)).length), keep = pts.filter((p, i) => count[i] >= 2), bonds = [];
  for (let a = 0; a < keep.length; a++) for (let b = a + 1; b < keep.length; b++) if (near(keep[a], keep[b])) bonds.push([a, b]);
  return { pts: keep, bonds };
}
const TURN = -0.17;
const rnd = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

export function create(canvas, host, on = {}) {
  return createLevel3D(canvas, host, on, (scene, root, P, night) => {
    const bg = new THREE.Color(night ? 0x0b1120 : 0xdfe8f2);
    const fog = scene.fog = new THREE.Fog(bg, 10, 20);   /* the back fades into the sky (set from the camera's distance) */
    const NX = 3, NY = 2, NZ = 2, A = 1, C = crystal(NX, NY, NZ);
    const SI = night ? 0x7f93b3 : 0x8d99ab, R = 0.105, BR = 0.03;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), w = new THREE.Vector3();
    const sphere = new THREE.SphereGeometry(1, 14, 10), rod = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    /* a bond from p to q: a thin rod, scaled and turned to join them */
    const bondAt = (mesh, i, p, r) => { v.set(...p[0]); w.set(...p[1]); const d = w.clone().sub(v), len = d.length(); q.setFromUnitVectors(up, d.normalize()); m4.compose(v.add(w).multiplyScalar(0.5), q, new THREE.Vector3(r, len, r)); mesh.setMatrixAt(i, m4); };
    const atomAt = (mesh, i, p, r) => { m4.compose(new THREE.Vector3(...p), new THREE.Quaternion(), new THREE.Vector3(r, r, r)); mesh.setMatrixAt(i, m4); };

    /* the crystal; one atom in it is the added one, drawn apart */
    const DOP = C.pts.findIndex(p => Math.abs(p[0] - 1.75) < 0.01 && Math.abs(p[1] - 1.25) < 0.01 && Math.abs(p[2] - 1.75) < 0.01);
    const siM = mat(SI, { roughness: 0.35, metalness: 0.3 }), bondM = mat(night ? 0x5c6c88 : 0x9aa6b7, { roughness: 0.5, metalness: 0.2 });
    const atoms = new THREE.InstancedMesh(sphere, siM, C.pts.length - 1); atoms.userData.part = 'lattice';
    let n = 0; C.pts.forEach((p, i) => { if (i !== DOP) atomAt(atoms, n++, p.map(x => x * A), R); });
    const bonds = new THREE.InstancedMesh(rod, bondM, C.bonds.length); bonds.userData.part = 'lattice';
    C.bonds.forEach(([a, b], i) => bondAt(bonds, i, [C.pts[a].map(x => x * A), C.pts[b].map(x => x * A)], BR));
    root.add(atoms, bonds);
    const dopM = mat(new THREE.Color(SI).lerp(new THREE.Color(P.warm), 0.35).getHex(), { roughness: 0.35, metalness: 0.3, emissive: P.warm, emissiveIntensity: night ? 0.35 : 0.12 });
    const dop = new THREE.Mesh(sphere, dopM); dop.scale.setScalar(R * 1.25); dop.position.set(...C.pts[DOP].map(x => x * A)); dop.userData.part = 'dopant'; root.add(dop);

    /* the skin on top: oxygen and silicon in no order, a network with no pattern (a few atoms thick) */
    const TOP = NY * A, skinPts = [], skinCol = [];
    for (let i = 0; i < 52; i++) skinPts.push([0.05 + rnd(i, 1) * (NX * A - 0.1), TOP + 0.22 + rnd(i, 2) * 0.62, 0.05 + rnd(i, 3) * (NZ * A - 0.1)]);
    const skinBonds = [];
    skinPts.forEach((p, i) => { let c = 0; for (let j = i + 1; j < skinPts.length && c < 3; j++) { const d = Math.hypot(p[0] - skinPts[j][0], p[1] - skinPts[j][1], p[2] - skinPts[j][2]); if (d > 0.3 && d < 0.62) { skinBonds.push([i, j]); c++; } } });
    const glassC = new THREE.Color(night ? 0x5aa9e6 : 0x7fb1d2), siC = new THREE.Color(SI);
    const skinM = mat(0xffffff, { roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.85 });
    const skin = new THREE.InstancedMesh(sphere, skinM, skinPts.length); skin.userData.part = 'boundary';
    skinPts.forEach((p, i) => { const o = i % 3 !== 0; atomAt(skin, i, p, o ? R * 0.75 : R); skin.setColorAt(i, o ? glassC : siC); });
    const skinB = new THREE.InstancedMesh(rod, mat(night ? 0x3f6f99 : 0x9cc0d8, { roughness: 0.3, transparent: true, opacity: 0.7 }), skinBonds.length); skinB.userData.part = 'boundary';
    skinBonds.forEach(([a, b], i) => bondAt(skinB, i, [skinPts[a], skinPts[b]], BR * 0.8));
    root.add(skin, skinB);

    /* a few loose electrons drifting through, from left to right */
    const E = 10, eM = new THREE.MeshStandardMaterial({ color: P.accent, emissive: P.accent, emissiveIntensity: night ? 1.2 : 0.7, roughness: 0.4 });
    const elec = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 10, 8), eM, E); elec.userData.part = 'electrons';
    const paths = Array.from({ length: E }, (_, i) => ({ u: rnd(i, 7), y: 0.2 + rnd(i, 8) * (TOP - 0.4), z: 0.15 + rnd(i, 9) * (NZ * A - 0.3), s: 0.75 + rnd(i, 10) * 0.5 }));
    const placeE = () => paths.forEach((p, i) => atomAt(elec, i, [p.u * NX * A, p.y + Math.sin(p.u * 18 + i) * 0.06, p.z], 1));
    placeE(); root.add(elec);
    [atoms, bonds, skin, skinB, elec].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.castShadow = m.receiveShadow = false; });
    dop.castShadow = false;

    /* turned so that one of the crystal's diagonals ([1 1 0]) lies near the line of sight: its rows and channels line up,
       and the sway shows the bonds that go back */
    root.rotation.y = TURN;
    const cx = NX * A / 2, cz = NZ * A / 2;
    return {
      level: 'atom', parts: ['lattice', 'dopant', 'electrons', 'boundary'],
      anchors: { lattice: [0.25, 0.15, NZ * A], dopant: [1.75 * A, 1.25 * A + 0.2, 1.75 * A], electrons: [NX * A * 0.78, 0.75, NZ * A], boundary: [cx, TOP + 0.95, cz] },
      /* looking down about 17°, turned like the stack (-35°) */
      view: { tilt: 0.3, turn: -0.62, r: 2.5, at: [cx, TOP * 0.62, cz] },
      update(dt, k, dist) {
        fog.near = dist - 1.4; fog.far = dist + 2.2;
        elec.visible = k > 0.6;
        if (!dt) return;
        /* each crosses in about three seconds */
        paths.forEach(p => { p.u = (p.u + dt * 0.33 * p.s) % 1; });
        placeE(); elec.instanceMatrix.needsUpdate = true;
      }
    };
  });
}
