/* The atom in 3D: the bottom of the zoom drawn on the one stage (docs/reviews/art-direction.md, "Atom: 3D").
   A small crystal of silicon, two cells deep: every atom holds four neighbours in the same regular pattern (the
   diamond lattice), which a flat net cannot show; one added atom of another kind sits in a place of that pattern; a
   few electrons move loose through it; and on top lies the insulating skin, a different, disordered material. The
   back fades into the sky, and a slow sway lets the pattern be read by movement.

   Six draws in all: one instanced sphere and one instanced bond for the crystal, the same for the skin, the added
   atom, and the electrons. Materials are the shared ones: silicon blue-grey, the added atom doped (silicon mixed
   towards warm), the skin glass, electrons glowing in the accent.

   Coming down from the switch (a join, docs/reviews/transitions.md) it starts as a smooth piece of the switch's middle
   sheet behind the glass of its skin, lying where it is part of the sheet; then it breaks into atoms from the cut face
   back, row by row, as the zoom goes on. Two more solids while it moves, none at rest.
   create(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat, glass } from './kit3d.js';
import { smooth, rotY } from '../engines/join.js';
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
/* the crystal's turn (exported: the switch's door undoes it, so the crystal's faces lie along the sheet's) */
export const TURN = -0.17;
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

    /* the break (brk, 0..1, the join's arrived): at 0 the crystal is a smooth piece of the switch's middle sheet. Of
       that piece only its cut face can be seen in the switch (the rest is inside the sheet, under the gate), behind
       the glass the switch's skin puts in front of it: so it is that face, in the sheet's own material, and a pane of
       the same glass the same size, no box (drawn in front of
       the switch, a box would show sides the sheet hides). A front moves from the cut face to the back: the face goes
       back with it, and in front of it the atoms come, each as the front reaches its row */
    const EX = NX * A, EY = NY * A, EZ = NZ * A;
    const sheet = new THREE.MeshStandardMaterial({ color: night ? 0x7f93b3 : 0xa7b3c4, roughness: 0.32, metalness: 0.35 });
    const face = new THREE.PlaneGeometry(EX, EY);
    const block = new THREE.Mesh(face, sheet), pane = new THREE.Mesh(face, glass(night ? 0x5aa9e6 : 0x9fc4dc, { opacity: 0.55, depthWrite: false }));
    [block, pane].forEach(b => { b.castShadow = b.receiveShadow = false; b.visible = false; root.add(b); });
    const grow = z => w => smooth(0, 0.25, 1.25 * w - (EZ - z) / EZ);   /* the back row is whole as w reaches 1 */
    const atomG = C.pts.map(p => grow(p[2] * A)), skinG = skinPts.map(p => grow(p[2]));
    const size = (mesh, n, at) => { for (let i = 0; i < n; i++) at(i); mesh.instanceMatrix.needsUpdate = true; };
    let brk = -1;
    function breakUp(b) {
      if (b === brk) return; brk = b;
      const w = smooth(0.1, 0.9, b), zf = EZ * (1 - w), ga = atomG.map(g => g(w)), gs = skinG.map(g => g(w));
      block.visible = b < 1 && zf > 0.001; block.position.set(EX / 2, EY / 2, zf);
      /* the pane lies on the face: in front of it by the skin's real depth, it would not cover the face exactly at an
         angle, and its edges would show */
      pane.visible = block.visible; pane.position.set(EX / 2, EY / 2, zf + 0.004);
      let k = 0; C.pts.forEach((p, i) => { if (i !== DOP) atomAt(atoms, k++, p.map(x => x * A), R * ga[i]); }); atoms.instanceMatrix.needsUpdate = true;
      size(bonds, C.bonds.length, i => { const [a, c] = C.bonds[i]; bondAt(bonds, i, [C.pts[a].map(x => x * A), C.pts[c].map(x => x * A)], BR * Math.min(ga[a], ga[c])); });
      dop.scale.setScalar(Math.max(R * 1.25 * ga[DOP], 1e-4)); dop.visible = ga[DOP] > 0;
      skinPts.forEach((p, i) => atomAt(skin, i, p, (i % 3 !== 0 ? R * 0.75 : R) * gs[i])); skin.instanceMatrix.needsUpdate = true;
      size(skinB, skinBonds.length, i => { const [a, c] = skinBonds[i]; bondAt(skinB, i, [skinPts[a], skinPts[c]], BR * 0.8 * Math.min(gs[a], gs[c])); });
    }

    /* turned so that one of the crystal's diagonals ([1 1 0]) lies near the line of sight: its rows and channels line up,
       and the sway shows the bonds that go back */
    root.rotation.y = TURN;
    const cx = NX * A / 2, cz = NZ * A / 2;
    return {
      level: 'atom', parts: ['lattice', 'dopant', 'electrons', 'boundary'],
      anchors: { lattice: [0.25, 0.15, NZ * A], dopant: [1.75 * A, 1.25 * A + 0.2, 1.75 * A], electrons: [NX * A * 0.78, 0.75, NZ * A], boundary: [cx, TOP + 0.95, cz] },
      /* looking down about 17°, turned like the stack (-35°). foot: where it stands in the switch's door, the
         crystal's top front edge in the middle, in the scene's coordinates (through the crystal's turn); enter: the
         stretch of a join over which it breaks into atoms */
      view: { tilt: 0.3, turn: -0.62, r: 2.5, at: [cx, TOP * 0.62, cz], foot: rotY([EX / 2, EY, EZ], TURN), enter: [0.2, 0.8] },
      update(dt, k, dist, arrived = 1) {
        breakUp(arrived);
        /* while it is still part of the sheet, the fog is pushed back: the sheet behind it does not fade */
        const far = (1 - arrived) * 50; fog.near = dist - 1.4 + far; fog.far = dist + 2.2 + far;
        elec.visible = k > 0.6 && arrived >= 0.9;
        if (!dt) return;
        /* each crosses in about three seconds */
        paths.forEach(p => { p.u = (p.u + dt * 0.33 * p.s) % 1; });
        placeE(); elec.instanceMatrix.needsUpdate = true;
      }
    };
  });
}
