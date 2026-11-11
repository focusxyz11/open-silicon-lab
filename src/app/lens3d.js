/* The lens: while a machine works on your wafer, a small block of its surface, magnified, floats beside the
   machine and shows what the machine is doing to it: drops washing specks away, gas settling into a film,
   light passing a mask, ions cutting straight down, atoms shot in, copper growing and polished back, a
   needle touching, a chip joined to its package; and, at the start, atoms joining a crystal in rows.

   The block is the slice the band shows (journey.js, section()), in 3D: the same levels (sl), the same
   columns (every other one open), the same colours. It is drawn in its own pass, over the factory, and
   joined to the place in the machine by two lines, like a magnifying glass. No words in this file: it says
   where its layers are on screen, and the 2D canvas writes their names.

   Units: the block is 1 wide, 0.4 deep; the silicon's top is at height 0. */
import * as THREE from '../vendor/three.min.js';

const COLS = 6, CW = 1 / COLS, DEP = 0.4, SI = 0.3, FILM = 0.11, RES = 0.08;
const open = i => i % 2 === 1;
const colX = i => -0.5 + (i + 0.5) * CW;
const smooth = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const rnd = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/* which picture each step shows in the lens; steps not listed show none */
export const LENS = {
  'proc.crystal.pull': 'crystal', 'proc.slice.polish': 'polish', 'proc.clean': 'clean', 'proc.deposit': 'deposit',
  'proc.print.coat': 'coat', 'proc.print.expose': 'expose', 'proc.print.develop': 'develop', 'proc.etch': 'etch',
  'proc.implant.beam': 'implant', 'proc.implant.heat': 'heat', 'proc.wires.plate': 'plate', 'proc.wires.polish': 'cmp',
  'proc.test': 'probe', 'proc.pkg.saw': 'dice', 'proc.pkg.pick': 'dice', 'proc.pkg.bond': 'bond', 'proc.ship.test': 'final'
};

export function createLens(M, col) {
  const scene = new THREE.Scene(), root = new THREE.Group(), block = new THREE.Group();
  scene.add(root); root.add(block);
  const exposed = new THREE.MeshLambertMaterial({ color: col.dark ? '#ffe6c2' : '#ffd9a0', emissive: col.warm, emissiveIntensity: col.dark ? 0.55 : 0.2 });
  const hemi = new THREE.HemisphereLight(col.dark ? '#c4d0f2' : '#ffffff', col.dark ? '#1a2240' : '#8f9bb0', col.dark ? 1.5 : 1.8);
  const key = new THREE.DirectionalLight('#ffffff', col.dark ? 1.2 : 1.4);
  scene.add(hemi, key, key.target);
  const unit = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), unitEdges = new THREE.EdgesGeometry(unit);
  const box = (mat, edges) => { const m = new THREE.Mesh(unit, mat); if (edges !== false) m.add(new THREE.LineSegments(unitEdges, M.edge)); block.add(m); return m; };
  const place = (m, x, y, z, w, h, d) => { m.position.set(x, y, z); m.scale.set(w, Math.max(1e-4, h), d); m.visible = h > 1e-3; };

  /* the stage the block stands on, and the silicon */
  const stage = box(M.dark); place(stage, 0, -SI - 0.035, 0, 1.12, 0.03, DEP + 0.12);
  const si = box(M.silicon); place(si, 0, -SI, 0, 1, SI, DEP);
  const heat = box(M.heat, false);
  const film = [], res = [], cu = [];
  for (let i = 0; i < COLS; i++) { film.push(box(M.cool)); res.push(box(M.warm)); cu.push(box(M.copper)); }
  const over = box(M.copper);
  /* the mask the light passes, above the stencil */
  const mask = []; for (let i = 0; i < COLS; i++) if (!open(i)) { const m = box(M.dark); mask.push([m, i]); }
  const rays = []; for (let i = 0; i < COLS; i++) if (open(i)) rays.push([box(M.light, false), i]);
  /* the needle */
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.002, 1, 8).translate(0, 0.5, 0), M.metal); block.add(needle);
  /* after the cut: the chip, its solder bumps, the package base, the lid */
  const sub = box(M.grn), chip = box(M.silicon), lid = [box(M.metal), box(M.metal), box(M.metal)];
  const lines = []; for (let j = 0; j < 5; j++) lines.push(box(M.copper, false));
  const ball = new THREE.SphereGeometry(1, 12, 8);
  const bumps = new THREE.InstancedMesh(ball, M.warm, 7); block.add(bumps);
  /* atoms: of another element, on the cut face under the openings; or the crystal's own, in rows */
  const atoms = new THREE.InstancedMesh(ball, M.grn, 27); block.add(atoms);
  const lattice = new THREE.InstancedMesh(ball, M.silicon, 6 * 4 * 6); block.add(lattice);
  /* what moves above the surface: drops, gas, ions, atoms on their way, copper */
  const motes = new THREE.InstancedMesh(ball, M.cool, 36); block.add(motes);
  const specks = new THREE.InstancedMesh(ball, M.red, 6); block.add(specks);
  /* the lines to the place in the machine */
  const tie = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3)), new THREE.LineDashedMaterial({ color: col.warm, dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0.8 }));
  scene.add(tie);

  const mm = new THREE.Matrix4(), q0 = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  const set = (im, i, x, y, z, r) => { mm.compose(pv.set(x, y, z), q0, sv.set(r, r, r)); im.setMatrixAt(i, mm); };
  const done = (im, n) => { im.count = n; im.instanceMatrix.needsUpdate = true; };

  /* the block at a level L (as the slice), a (how far the step doing it has got), for one picture (mode) */
  function shape(mode, L, a, t) {
    const pkg = L >= 11, cry = mode === 'crystal';
    si.visible = !pkg && !cry; heat.visible = false;
    film.concat(res, cu, [over, sub, chip, needle], lid, lines, mask.map(m => m[0]), rays.map(r => r[0])).forEach(m => { m.visible = false; });
    let nAt = 0, nLat = 0, nMote = 0, nSpeck = 0, nBump = 0;
    const labels = [], lab = (k, y, now) => labels.push({ k, y, now: !!now });
    motes.material = M.cool;
    if (cry) {
      /* rows of atoms, each placed exactly on the one below, the newest row lit; atoms from the melt drifting up to join */
      const n = Math.floor(Math.min(1, 0.08 + a) * 144), rows = Math.ceil(n / 24);
      for (let j = 0; j < n; j++) { const r = Math.floor(j / 24), i = Math.floor((j % 24) / 4), k = j % 4; set(lattice, nLat++, -0.42 + i * 0.168, -SI + 0.03 + r * 0.075, -0.15 + k * 0.1, 0.028); }
      /* atoms from the melt, drifting up to the growing face */
      for (let j = 0; j < 14; j++) { const u = (t * 0.35 + j / 14) % 1; set(motes, nMote++, -0.45 + rnd(j, 2) * 0.9, -SI + 0.03 + rows * 0.075 + 0.25 * (1 - u), -0.15 + rnd(j, 5) * 0.3, 0.02 * (0.4 + 0.6 * (1 - u))); }
      motes.material = M.silicon;
      lab('crystal', -SI + 0.03 + Math.max(0, rows - 1) * 0.075, true);
      done(lattice, nLat); done(atoms, 0); done(motes, nMote); done(specks, 0); done(bumps, 0);
      return labels;
    }
    done(lattice, 0);
    if (pkg) {
      /* the chip, face down: its copper lines underneath, solder bumps, the package base, the lid */
      const down = mode === 'bond' ? smooth(a) : L >= 12 ? 1 : 0;
      const sb = L >= 12 || mode === 'bond', cy = 0.02 + (1 - down) * 0.18;
      if (sb) { place(sub, 0, -SI, 0, 1, 0.1, DEP); lab('package', -SI + 0.05, mode === 'bond'); }
      for (let j = 0; j < 7; j++) set(bumps, nBump++, -0.39 + j * 0.13, cy - 0.035, 0.12, mode === 'dice' ? 0.03 * Math.min(1, a * 1.6) + 0.002 : 0.03);
      lab('bumps', cy - 0.035, mode === 'dice');
      place(chip, 0, cy, 0, 0.92, 0.22, DEP - 0.06);
      lines.forEach((m, j) => place(m, -0.36 + j * 0.18, cy - 0.006, 0.13, 0.09, 0.012, 0.06));
      lab('silicon', cy + 0.11);
      if (L >= 13 || mode === 'final') { place(lid[0], 0, cy + 0.25, 0, 1.0, 0.025, DEP); place(lid[1], -0.49, -SI + 0.1, 0, 0.02, cy + 0.25 + SI - 0.1, DEP); place(lid[2], 0.49, -SI + 0.1, 0, 0.02, cy + 0.25 + SI - 0.1, DEP); lab('lid', cy + 0.26); }
      if (mode === 'final') { heat.material = Math.sin(t * 1.3) > 0 ? M.heat : M.spray; place(heat, 0, -SI - 0.02, 0, 1.1, 0.68, DEP + 0.1); heat.visible = true; }
      done(bumps, nBump); done(atoms, 0); done(motes, 0); done(specks, 0);
      return labels;
    }
    lab('silicon', -SI / 2);
    /* atoms of another element, under the openings, on the cut face */
    if (L >= 7) {
      const k = L === 7 && mode === 'implant' ? a : 1;
      for (let i = 0; i < COLS; i++) if (open(i)) for (let j = 0; j < 9; j++) if (j / 9 < k) {
        const jit = mode === 'heat' ? Math.sin(t * 9 + j * 2 + i) * 0.006 * (1 - a) : 0;
        set(atoms, nAt++, colX(i) - 0.05 + (j % 3) * 0.05 + jit, -0.035 - Math.floor(j / 3) * 0.045 + jit, DEP / 2 + 0.004, 0.017);
      }
      lab('atoms', -0.08, mode === 'implant' || mode === 'heat');
    }
    if (mode === 'heat') { place(heat, 0, -SI - 0.01, 0, 1.04, SI + 0.02, DEP + 0.04); heat.material = M.heat; heat.visible = true; }
    /* the film, cut where the stencil was open; copper in the cuts */
    let ftop = 0;
    if (L >= 2) {
      const grow = L === 2 ? (mode === 'deposit' ? a : 1) : 1;
      for (let i = 0; i < COLS; i++) {
        let fh = FILM * grow;
        if (open(i) && L >= 6) fh = L === 6 && mode === 'etch' ? FILM * (1 - a) : 0;
        place(film[i], colX(i), 0, 0, CW, fh, DEP);
        if (open(i) && L >= 8) place(cu[i], colX(i), 0, 0, CW - 0.004, FILM, DEP - 0.004);
      }
      ftop = FILM * grow;
      if (L === 8 || (L === 9 && mode === 'cmp' && a < 1)) { const oh = L === 8 ? 0.07 * (mode === 'plate' ? a : 1) : 0.07 * (1 - a); place(over, 0, FILM, 0, 1, oh, DEP); }
      lab(L >= 8 ? 'copper' : 'film', FILM / 2, mode === 'deposit' || mode === 'etch' || mode === 'plate' || mode === 'cmp');
    }
    /* the stencil: coated, printed by light, washed away where printed */
    if (L >= 3 && (L <= 5 || (L === 6 && mode === 'etch' && a < 0.85))) {
      for (let i = 0; i < COLS; i++) {
        const rh = L === 3 && mode === 'coat' ? RES * a : RES;
        if (open(i) && (L === 6 || (L === 5 && mode !== 'develop'))) continue;
        const shrink = open(i) && L === 5 ? 1 - a : 1;
        const m = res[i]; m.material = open(i) && L >= 4 ? exposed : M.warm;
        place(m, colX(i), ftop, 0, CW, rh * shrink, DEP);
      }
      lab('resist', ftop + RES / 2, mode === 'coat' || mode === 'expose' || mode === 'develop');
    }
    const top = ftop + (L >= 3 && L <= 5 ? RES : 0);
    /* what is happening now, above the surface */
    if (mode === 'expose') {
      mask.forEach(([m, i]) => place(m, colX(i), 0.5, 0, CW, 0.03, DEP));
      rays.forEach(([m, i]) => { place(m, colX(i), top, 0, CW * 0.9, 0.5 - top, DEP * 0.9); m.material.opacity = 0.35 + 0.2 * Math.sin(t * 8); });
      lab('mask', 0.515); lab('light', 0.36, true);
    }
    const fall = (n, speed, mat, colsOnly, r, sway) => {
      motes.material = mat;
      for (let j = 0; j < n; j++) {
        const u = (t * speed + j / n) % 1, i = colsOnly ? 1 + 2 * (j % 3) : -1;
        const x = colsOnly ? colX(i) + (rnd(j, 4) - 0.5) * CW * 0.6 : -0.48 + rnd(j, 9) * 0.96;
        const floor = colsOnly ? (mode === 'etch' ? FILM * (1 - a) : 0) : top;
        set(motes, nMote++, x + (sway ? Math.sin(t * 2 + j) * 0.02 : 0), floor + 0.02 + (1 - u) * (0.55 - floor), -0.16 + rnd(j, 7) * 0.32, r);
      }
    };
    if (mode === 'clean' || mode === 'develop' || mode === 'polish' || mode === 'cmp') { fall(16, 1.1, M.spray, false, 0.016, true); lab('drops', 0.42, true); }
    if (mode === 'deposit') { fall(24, 0.55, M.cool, false, 0.016, true); lab('gas', 0.42, true); }
    if (mode === 'etch') { fall(15, 1.6, M.red, true, 0.014); lab('ions', 0.42, true); }
    if (mode === 'implant') { fall(15, 1.3, M.grn, true, 0.014); lab('beam', 0.42, true); }
    if (mode === 'plate') { fall(20, 0.7, M.copper, false, 0.015, true); lab('ionsCu', 0.42, true); }
    if (mode === 'probe') { needle.visible = true; needle.position.set(colX(3), FILM + 0.004 + (Math.sin(t * 4) > 0 ? 0 : 0.03), 0.05); needle.scale.set(1, 0.42, 1); needle.rotation.z = 0.5; lab('needle', 0.25, true); }
    /* specks of dust, washed away while it is cleaned */
    if (L <= 1) { const k = L === 0 ? 1 : mode === 'clean' ? 1 - a : 0; if (k > 0.03) { for (let j = 0; j < 5; j++) set(specks, nSpeck++, -0.4 + rnd(j, 3) * 0.8, 0.02 * k, -0.14 + rnd(j, 6) * 0.28, 0.025 * k); lab('specks', 0.03); } }
    done(atoms, nAt); done(motes, nMote); done(specks, nSpeck); done(bumps, 0);
    return labels;
  }

  const cam = new THREE.Vector3(), wpos = new THREE.Vector3(), sz = new THREE.Vector2();
  let shown = 0;
  /* one frame. o: { camera, renderer, mode, L, a, t, anchor (where in the machine, world), k (0..1: in view),
     box: { B, cx, cy }, W, H }. Draws over what is drawn; returns where the block and its layers are, in
     the box's 1000 x 1000 space */
  function render(o) {
    shown += ((o.mode && o.k > 0.05 ? 1 : 0) - shown) * Math.min(1, o.dt * 5);
    if (shown < 0.02 || !o.mode) return null;
    const { camera, renderer, box, W, H } = o;
    const labels = shape(o.mode, o.L, o.a, o.t);
    /* where it floats: up and to the right in the picture, a fixed size on screen, turned to show its top and cut face */
    const narrow = box.B < 560, fx = narrow ? 0.7 : 0.75, fy = narrow ? 0.22 : 0.24, wpx = box.B * (narrow ? 0.3 : 0.25);
    const sx = box.cx + (fx - 0.5) * box.B, sy = box.cy + (fy - 0.5) * box.B;
    camera.getWorldPosition(cam);
    const dir = new THREE.Vector3((sx / W) * 2 - 1, -(sy / H) * 2 + 1, 0.5).unproject(camera).sub(cam).normalize();
    const D = 2.4; root.position.copy(cam).addScaledVector(dir, D);
    const worldH = 2 * D * Math.tan((camera.fov * Math.PI) / 360) * (camera.view ? camera.view.height / camera.view.fullHeight : 1);
    const s = (wpx / H) * worldH * (0.75 + 0.25 * smooth(shown));
    root.scale.setScalar(s);
    root.quaternion.copy(camera.quaternion);
    block.rotation.set(0.36, -0.3, 0);
    block.position.y = Math.sin(o.t * 1.2) * 0.012;
    key.position.copy(cam).add(new THREE.Vector3(-2, 4, 3)); key.target.position.copy(root.position);
    /* the two lines, from the stage's near corners down to the place in the machine */
    root.updateMatrixWorld(true);
    const a1 = new THREE.Vector3(-0.56, -SI - 0.05, DEP / 2 + 0.06).applyMatrix4(block.matrixWorld), a2 = new THREE.Vector3(-0.56, -SI - 0.05, -DEP / 2 - 0.06).applyMatrix4(block.matrixWorld);
    wpos.copy(o.anchor);
    tie.geometry.attributes.position.array.set([a1.x, a1.y, a1.z, wpos.x, wpos.y, wpos.z, a2.x, a2.y, a2.z, wpos.x, wpos.y, wpos.z]);
    tie.geometry.attributes.position.needsUpdate = true; tie.geometry.computeBoundingSphere(); tie.computeLineDistances();
    tie.material.opacity = 0.8 * smooth(shown);
    renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); renderer.autoClear = true;
    /* where the block is on screen, and each layer's right end, in the box's space */
    renderer.getSize(sz);
    const toBox = v => { v.project(camera); return [(((v.x + 1) / 2) * W - (box.cx - box.B / 2)) / box.B * 1000, (((1 - v.y) / 2) * H - (box.cy - box.B / 2)) / box.B * 1000]; };
    const corners = []; for (const x of [-0.56, 0.56]) for (const y of [-SI - 0.05, o.mode === 'expose' || o.mode === 'crystal' ? 0.56 : 0.4]) for (const z of [-DEP / 2 - 0.06, DEP / 2 + 0.06]) corners.push(toBox(new THREE.Vector3(x, y, z).applyMatrix4(block.matrixWorld)));
    const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
    const rect = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    const out = labels.map(l => { const p = toBox(new THREE.Vector3(0.5, l.y, DEP / 2).applyMatrix4(block.matrixWorld)); return { k: l.k, now: l.now, x: p[0], y: p[1] }; });
    return { rect, labels: out, alpha: smooth(shown) };
  }
  function dispose() { scene.traverse(q => { if (q.geometry) q.geometry.dispose(); }); }
  return { render, dispose };
}
