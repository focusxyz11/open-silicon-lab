/* The journey in 3D: the line a chip is made on, as real places (a wafer plant, a chip factory's bay, a
   packaging plant), built with three.js (src/vendor/three.min.js) and drawn in the site's blueprint style:
   flat-lit solids with crisp edges, dark and light.

   It draws under the 2D canvas (world.js) only on the journey, and only the stations around you. The
   steps each machine plays are the same as in src/app/journey.js (JOURNEY, flow()): here they have places
   in 3D (where the pod docks, where each robot hands over, the chamber), so the wafer, the robots and the
   pod move through real machines. The camera rides along the line, follows your wafer, and moves in close
   while a machine works on it. The caption band, the slice through the wafer, the steps and the questions
   stay on the 2D canvas; the parts they point at come from here (parts()).

   Places are written in centimetres as [x, depth, height]: x along the line, depth back from the aisle,
   height up. A station is 9 metres of the line. No words in this file. */
import * as THREE from '../vendor/three.min.js';
import { PLANTS } from '../data/weave.js';
import { JOURNEY, flow, chipNow } from './journey.js';
const chip3 = () => chipNow();

const S = 900;                                   /* centimetres between stations */
const V = (x, d, h) => new THREE.Vector3(x / 100, h / 100, -d / 100);
const smooth = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ---- materials: the palette of the 2D site, as flat-lit surfaces with edges ---- */
function materials(col) {
  const d = col.dark, L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const glow = (c, i) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: i, depthWrite: false, blending: d ? THREE.AdditiveBlending : THREE.NormalBlending });
  return {
    body: L(d ? '#2a375f' : '#f4f6f9'), panel: L(d ? '#212d50' : '#e6ebf2'), base: L(d ? '#182240' : '#d3dbe6'),
    dark: L(d ? '#0b1020' : '#aeb9c9'), inner: L(d ? '#0d1428' : '#c5cedb', { side: THREE.DoubleSide }),
    floor: L(d ? '#111a33' : '#e9edf3'), aisle: L(d ? '#0d1529' : '#dde3eb'), wall: L(d ? '#0c1225' : '#d2d9e4'),
    metal: L(d ? '#3c4c7c' : '#c3ccda'), rail: L(d ? '#4a5b8c' : '#9aa8bd', { transparent: true, opacity: 1 }),
    glass: L(d ? '#7d93c7' : '#a9bde3', { transparent: true, opacity: d ? 0.14 : 0.22, depthWrite: false, side: THREE.DoubleSide }),
    pod: L(d ? '#9db1e6' : '#ffffff', { emissive: d ? '#2a3a6a' : '#000000' }), podOther: L(d ? '#3a4a78' : '#dfe5ee'),
    wafer: L('#c9d7ff', { emissive: d ? '#5a7de0' : '#3d63c8', emissiveIntensity: d ? 0.7 : 0.35 }), waferOther: L(d ? '#5a6894' : '#aab6c9'),
    chip: L('#c9d7ff', { emissive: d ? '#5a7de0' : '#3d63c8', emissiveIntensity: d ? 0.7 : 0.35 }),
    warm: L(col.warm, { emissive: col.warm, emissiveIntensity: d ? 0.5 : 0.15 }), cool: L(col.cool, { emissive: col.cool, emissiveIntensity: d ? 0.4 : 0.1 }),
    grn: L(col.grn, { emissive: col.grn, emissiveIntensity: d ? 0.6 : 0.2 }), red: L(col.red, { emissive: col.red, emissiveIntensity: d ? 0.6 : 0.2 }),
    off: L(d ? '#2a3350' : '#c9d1dc'), copper: L('#d58a3a', { emissive: '#7a4310', emissiveIntensity: d ? 0.4 : 0.05 }),
    crate: L(d ? '#5a4628' : '#e8d4b0'), screen: new THREE.MeshBasicMaterial({ color: d ? '#06090f' : '#f9fbfd' }),
    plasma: glow(col.red, d ? 0.42 : 0.3), beam: glow(col.grn, d ? 0.7 : 0.55), light: glow(col.warm, d ? 0.55 : 0.4), heat: glow(col.warm, d ? 0.35 : 0.25), spray: glow(col.cool, 0.6),
    edge: new THREE.LineBasicMaterial({ color: d ? '#7083b6' : '#5c6a82', transparent: true, opacity: d ? 0.75 : 0.55 }),
    seam: new THREE.LineBasicMaterial({ color: d ? '#3a4a78' : '#b7c1cf', transparent: true, opacity: 0.8 }),
    hi: new THREE.LineBasicMaterial({ color: col.warm })
  };
}

/* ---- a builder: static parts are merged by material (few draw calls); edges are one line set ---- */
class Builder {
  constructor(M) { this.M = M; this.byMat = new Map(); this.edges = []; this.seams = []; this.parts = {}; this.dyn = new THREE.Group(); this.focus = {}; }
  put(geo, mat, edges) {
    if (!this.byMat.has(mat)) this.byMat.set(mat, []);
    this.byMat.get(mat).push(geo);
    if (edges !== false) { const e = new THREE.EdgesGeometry(geo, 28).attributes.position.array; for (let i = 0; i < e.length; i++) this.edges.push(e[i]); }
    return geo;
  }
  /* a box from corner (x, d, h), w wide, dd deep, hh high */
  box(x, d, h, w, dd, hh, mat, edges) { const g = new THREE.BoxGeometry(w / 100, hh / 100, dd / 100); g.translate((x + w / 2) / 100, (h + hh / 2) / 100, -(d + dd / 2) / 100); return this.put(g, mat || this.M.body, edges); }
  /* an upright cylinder standing at (x, d) from height h */
  cyl(x, d, h, r, hh, mat, seg, edges, r2) { const g = new THREE.CylinderGeometry((r2 == null ? r : r2) / 100, r / 100, hh / 100, seg || 28); g.translate(x / 100, (h + hh / 2) / 100, -d / 100); return this.put(g, mat || this.M.body, edges); }
  /* a cylinder lying along x, or along depth */
  rod(x, d, h, r, len, axis, mat, seg) { const g = new THREE.CylinderGeometry(r / 100, r / 100, len / 100, seg || 16); if (axis === 'x') g.rotateZ(Math.PI / 2); else g.rotateX(Math.PI / 2); g.translate(x / 100, h / 100, -d / 100); return this.put(g, mat || this.M.metal, false); }
  /* a six-sided prism (the vacuum chamber in the middle of a cluster tool), open at the top */
  hex(x, d, h, r, hh, mat, open) {
    const g = new THREE.CylinderGeometry(r / 100, r / 100, hh / 100, 6, 1, !!open); g.rotateY(Math.PI / 6); g.translate(x / 100, (h + hh / 2) / 100, -d / 100); return this.put(g, mat || this.M.body);
  }
  /* a tube (a pipe) through points [x, d, h] */
  pipe(pts, r, mat) { const curve = new THREE.CatmullRomCurve3(pts.map(p => V(p[0], p[1], p[2])), false, 'catmullrom', 0.05); const g = new THREE.TubeGeometry(curve, pts.length * 8, r / 100, 8, false); return this.put(g, mat || this.M.metal, false); }
  /* lines only (a floor grid, a ceiling lattice) */
  line(a, b, seam) { const arr = seam ? this.seams : this.edges, A = V(...a), B = V(...b); arr.push(A.x, A.y, A.z, B.x, B.y, B.z); }
  part(key, x, d, h, w, dd, hh) { (this.parts[key] = this.parts[key] || []).push([V(x, d, h), V(x + w, d, h), V(x + w, d + dd, h), V(x, d + dd, h), V(x, d, h + hh), V(x + w, d, h + hh), V(x + w, d + dd, h + hh), V(x, d + dd, h + hh)]); }
  partCyl(key, x, d, h, r, hh) { this.part(key, x - r, d - r, h, 2 * r, 2 * r, hh); }
  /* a moving thing: its own mesh, with its edges */
  mesh(geo, mat, edges) { const m = new THREE.Mesh(geo, mat); if (edges !== false) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), this.M.edge)); m.castShadow = true; this.dyn.add(m); return m; }
  finish(x0) {
    const g = new THREE.Group();
    for (const [mat, list] of this.byMat) { const merged = mergeAll(list); const m = new THREE.Mesh(merged, mat); m.castShadow = !mat.transparent; m.receiveShadow = true; g.add(m); list.forEach(q => q.dispose()); }
    const lines = (arr, mat) => { if (!arr.length) return; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.add(new THREE.LineSegments(geo, mat)); };
    lines(this.edges, this.M.edge); lines(this.seams, this.M.seam);
    g.add(this.dyn); g.position.x = x0 / 100;
    for (const k in this.parts) this.parts[k].forEach(list => list.forEach(v => { v.x += x0 / 100; }));
    return g;
  }
}
/* merge geometries of one material (all are indexed, with normals and uvs) */
function mergeAll(list) {
  const norm = list.map(g => (g.index ? g : g)).map(g => { const q = g.index ? g.toNonIndexed() : g; ['position', 'normal', 'uv'].forEach(k => { if (!q.attributes[k]) q.setAttribute(k, new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count * (k === 'uv' ? 2 : 3)), k === 'uv' ? 2 : 3)); }); Object.keys(q.attributes).forEach(k => { if (!['position', 'normal', 'uv'].includes(k)) q.deleteAttribute(k); }); return q; });
  return THREE.mergeGeometries(norm, false);
}

/* ======== the places every station shares ======== */
/* the floor (the aisle in front, the tools' floor behind), the back wall, the overhead track */
function bay(b, plant, firstOfPlant) {
  const M = b.M;
  b.box(-450, -460, -12, 900, 460, 12, M.aisle, false);
  b.box(-450, 0, -12, 900, 700, 12, M.floor, false);
  for (let x = -420; x <= 450; x += 60) { b.line([x, -460, 0.3], [x, 700, 0.3], true); }
  for (let d = -420; d <= 700; d += 60) { b.line([-450, d, 0.3], [450, d, 0.3], true); }
  b.box(-450, 690, 0, 900, 20, plant === 'fab' ? 420 : 360, M.wall, false);
  b.line([-450, 690, 0.4], [450, 690, 0.4]);
  if (plant === 'fab') {
    /* the ceiling of air filters, as a lattice (so you can see down into the bay), and the columns */
    for (let x = -450; x <= 450; x += 120) b.line([x, 0, 430], [x, 690, 430], true);
    for (let d = 0; d <= 690; d += 115) b.line([-450, d, 430], [450, d, 430], true);
    b.box(-450, 670, 0, 26, 20, 430, M.base);
  } else if (plant === 'pack' || plant === 'wafers') {
    for (let x = -390; x < 450; x += 240) b.box(x, 686, 160, 160, 4, 120, M.dark, false);
  }
  /* the overhead track, at the same place in every station */
  b.box(-450, 26, 336, 900, 8, 8, M.rail);
  b.part('track', -450, 20, 326, 900, 20, 26);
  if (plant === 'fab') b.part('filters', -450, 300, 425, 900, 390, 10);
  for (let x = -405; x < 450; x += 150) b.box(x, 28, 344, 4, 4, 86, M.rail, false);
  /* where one plant ends and the next begins: a wall the track passes through, and a loading dock */
  if (firstOfPlant) {
    b.box(-470, -460, 0, 20, 400, 420, M.wall); b.box(-470, 60, 0, 20, 650, 420, M.wall);
    b.box(-470, -60, 0, 20, 120, 300, M.wall); b.box(-470, -60, 380, 20, 120, 40, M.wall);
    b.box(-448, 360, 0, 120, 100, 12, M.base); b.box(-440, 368, 12, 104, 84, 80, M.crate);
    b.part('dock', -448, 360, 0, 120, 100, 92);
  }
}
/* a pod: the sealed box a wafer travels in */
function makePod(M, mine) {
  const g = new THREE.Group(), body = new THREE.BoxGeometry(0.42, 0.33, 0.38); body.translate(0, 0.165, 0);
  const m = new THREE.Mesh(body, mine ? M.pod : M.podOther); m.castShadow = true; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(body), mine ? M.hi : M.edge)); g.add(m);
  const top = new THREE.BoxGeometry(0.16, 0.04, 0.16); top.translate(0, 0.35, 0); const t = new THREE.Mesh(top, M.metal); t.add(new THREE.LineSegments(new THREE.EdgesGeometry(top), M.edge)); g.add(t);
  return g;
}
function makeTray(M, mine) {
  const g = new THREE.Group(), body = new THREE.BoxGeometry(0.5, 0.05, 0.36); body.translate(0, 0.025, 0);
  const m = new THREE.Mesh(body, mine ? M.pod : M.podOther); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(body), mine ? M.hi : M.edge)); g.add(m);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const c = new THREE.BoxGeometry(0.07, 0.015, 0.07); c.translate(-0.18 + i * 0.12, 0.057, -0.11 + j * 0.11); g.add(new THREE.Mesh(c, mine && i === 1 && j === 0 ? M.chip : M.waferOther)); }
  return g;
}
/* the wafer (or, after the cut, a chip) */
function makeWafer(b, mine) { const g = new THREE.CylinderGeometry(0.15, 0.15, 0.012, 40); const m = b.mesh(g, mine ? b.M.wafer : b.M.waferOther, false); m.visible = false; return m; }
function makeChip(b) { const g = new THREE.BoxGeometry(0.06, 0.012, 0.06); const m = b.mesh(g, b.M.chip, false); m.visible = false; return m; }

/* a robot arm: a column, two links, a fork. Its hand goes where the wafer is while it carries it. */
function gantry(b, R) {
  const M = b.M, g = new THREE.Group(), rod = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1, 0.03).translate(0, 0.5, 0), M.metal), head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.14), M.body);
  head.add(new THREE.LineSegments(new THREE.EdgesGeometry(head.geometry), M.edge)); g.add(rod, head); b.dyn.add(g);
  b.box(R.x0, R.d - 6, R.top, R.x1 - R.x0, 12, 10, M.rail);
  const st = { x: R.rest[0], d: R.rest[1], h: R.rest[2] };
  return (hand, dt) => {
    const k = 1 - Math.exp(-dt * 10); st.x = lerp(st.x, hand[0], k); st.d = lerp(st.d, hand[1], k); st.h = lerp(st.h, (hand[2] == null ? R.rest[2] : hand[2]) + 8, k);
    g.position.copy(V(st.x, st.d, st.h)); head.position.y = 0.05; rod.scale.y = Math.max(0.05, (R.top - st.h) / 100);
  };
}
function robot(b, R) {
  if (R.gantry) return gantry(b, R);
  const M = b.M, g = new THREE.Group(), base = R.b, plane = R.h;
  const col = new THREE.CylinderGeometry(0.14, 0.16, (plane - base[2]) / 100, 24); col.translate(0, (plane - base[2]) / 200, 0);
  const cm = new THREE.Mesh(col, M.metal); cm.add(new THREE.LineSegments(new THREE.EdgesGeometry(col, 28), M.edge)); g.add(cm);
  const link = len => { const q = new THREE.BoxGeometry(len / 100, 0.05, 0.12); q.translate(len / 200, 0, 0); const m = new THREE.Mesh(q, M.body); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(q), M.edge)); m.castShadow = true; return m; };
  const l1 = link(R.L), l2 = link(R.L), fork = new THREE.Group();
  for (const s of [-1, 1]) { const q = new THREE.BoxGeometry(0.34, 0.012, 0.035); q.translate(0.09, -0.03, s * 0.07); const m = new THREE.Mesh(q, M.metal); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(q), M.edge)); fork.add(m); }
  g.add(l1); l1.add(l2); l2.add(fork);
  l2.position.x = R.L / 100; l2.position.y = 0.05; fork.position.x = R.L / 100; fork.position.y = 0.02;
  l1.position.y = (plane - base[2]) / 100 + 0.03;
  g.position.copy(V(base[0], base[1], base[2]));
  b.dyn.add(g);
  const st = { hx: R.rest[0], hd: R.rest[1] };
  return (hand, dt) => {
    /* ease the hand towards where it should be */
    const k = 1 - Math.exp(-dt * 14); st.hx = lerp(st.hx, hand[0], k); st.hd = lerp(st.hd, hand[1], k);
    let bx = base[0];
    if (R.rail) { bx = Math.max(R.rail[0], Math.min(R.rail[1], st.hx)); g.position.x = bx / 100; }
    const dx = st.hx - bx, dd = st.hd - base[1], dist = Math.min(Math.hypot(dx, dd), 2 * R.L * 0.98), a = Math.atan2(dd, dx), e = Math.acos(Math.min(1, dist / (2 * R.L)));
    /* angles in the x-depth plane; three.js turns about y with depth as -z */
    l1.rotation.y = a + e; l2.rotation.y = -2 * e; fork.rotation.y = e;
  };
}

/* ======== a cluster tool: the usual machine of the chip factory ========
   Load ports facing the aisle, a front module (a small extra-clean room with a robot on a rail), two
   airlocks, a six-sided vacuum chamber with its lid off and its robot, process chambers around it. Yours is
   the chamber on the right, cut open. kind: 'etch', 'dep', 'clean', 'implant'. */
const HEXC = [0, 330], CH_R = 55;
const CHAMBERS = [[175, 330], [-175, 330], [88, 482], [-88, 482]];
function front3(b) {
  const M = b.M;
  /* load ports and the pods on them */
  [-70, 0, 70].forEach(x => { b.box(x - 30, 0, 0, 60, 60, 90, M.base); b.box(x - 26, 4, 90, 52, 52, 4, M.metal); });
  b.part('pod', -30, 0, 0, 60, 60, 128);
  /* the front module: a frame with glass sides and top (drawn cut away, so its robot shows), the rail for its robot */
  const EH = 160;
  [[-120, 60], [114, 60], [-120, 144], [114, 144]].forEach(([x, d]) => b.box(x, d, 0, 6, 6, EH, M.body));
  b.box(-120, 60, 0, 240, 6, 26, M.body); b.box(-120, 60, EH - 8, 240, 6, 8, M.body); b.box(-120, 144, EH - 8, 240, 6, 8, M.body);
  b.box(-120, 66, EH - 8, 6, 78, 8, M.body); b.box(114, 66, EH - 8, 6, 78, 8, M.body);
  b.box(-120, 144, 0, 240, 6, EH, M.panel);
  b.box(-114, 62, 26, 228, 2, EH - 34, M.glass, false); b.box(-114, 66, EH - 2, 228, 78, 1, M.glass, false);
  b.box(-110, 100, 6, 220, 10, 8, M.metal);
  b.box(-120, 60, -1, 240, 90, 1, M.dark, false);
  b.part('efem', -120, 60, 0, 240, 90, EH);
  /* the stack light on its corner */
  b.cyl(100, 135, 160, 3, 24, M.metal, 8, false);
}
function clusterTool(b, kind, vacuum) {
  const M = b.M;
  front3(b);
  /* the airlocks */
  [-45, 45].forEach((x, i) => { b.box(x - 30, 150, 0, 60, 70, 60, M.base); b.box(x - 30, 150, 60, 60, 70, 70, vacuum ? M.body : M.panel); b.box(x - 26, 154, 130, 52, 62, 1, M.glass, false); b.part(vacuum ? 'lock' : 'shelf', x - 30, 150, 0, 60, 70, 130); });
  /* the vacuum chamber in the middle, open at the top so its robot shows */
  b.hex(HEXC[0], HEXC[1], 0, 95, 70, M.base);
  b.hex(HEXC[0], HEXC[1], 70, 110, 60, M.body, true);
  b.hex(HEXC[0], HEXC[1], 71, 108, 1, M.inner);
  b.part('xfer', -110, 220, 0, 220, 220, 130);
  /* the process chambers: a short passage with its gate from the middle, legs, a pump below */
  CHAMBERS.forEach(([x, d], i) => {
    const dx = x - HEXC[0], dd = d - HEXC[1], L = Math.hypot(dx, dd), ux = dx / L, ud = dd / L;
    const mid = [HEXC[0] + ux * 105, HEXC[1] + ud * 105];
    const g = new THREE.BoxGeometry(0.36, 0.42, 0.3); g.rotateY(Math.atan2(ud, ux)); g.translate(mid[0] / 100, 1.0, -mid[1] / 100); b.put(g, M.metal);
    [[-35, -30], [35, -30], [0, 40]].forEach(([ox, od]) => b.box(x + ox - 4, d + od - 4, 0, 8, 8, 70, M.base, false));
    b.cyl(x + 10, d + 18, 8, 18, 58, M.base); b.cyl(x + 10, d + 18, 66, 10, 4, M.metal, 16, false);
    if (i === 0) return;   /* yours is drawn by the station, cut open */
    b.cyl(x, d, 70, CH_R, 70, M.body);
    b.cyl(x, d, 140, CH_R - 6, 10, M.base);
    b.box(x - 22, d - 18, 150, 44, 36, 30, M.panel);
    b.cyl(x, d, 140.5, 30, 0.5, M.copper, 32, false);
  });
  b.partCyl('tool', CHAMBERS[0][0], CHAMBERS[0][1], 0, CH_R, 150);
  /* the gas cabinet at the back and its lines to the chambers; pumps and power behind */
  b.box(-260, 560, 0, 90, 80, 230, M.body); for (let h = 60; h < 230; h += 55) b.line([-260, 560, h], [-170, 560, h], true);
  b.box(-250, 560, 170, 34, 1, 22, M.screen, false);
  CHAMBERS.forEach(([x, d], i) => b.pipe([[-170, 600, 200 - i * 8], [x - 20, 600, 200 - i * 8], [x - 20, d + 30, 200 - i * 8], [x - 20, d + 30, 150]], 2.2, M.metal));
  b.box(200, 540, 0, 80, 70, 150, M.body); for (let h = 30; h < 150; h += 30) b.line([200, 540, h], [280, 540, h], true);
}
/* yours: a process chamber cut open at the front, with what is inside it */
function openChamber(b, x, d, inner) {
  const M = b.M;
  const wall = new THREE.CylinderGeometry(CH_R / 100, CH_R / 100, 0.7, 40, 1, true, Math.PI * 0.9, Math.PI * 1.45); wall.translate(x / 100, 1.05, -d / 100); b.put(wall, M.body);
  const inn = new THREE.CylinderGeometry((CH_R - 4) / 100, (CH_R - 4) / 100, 0.7, 40, 1, true, Math.PI * 0.9, Math.PI * 1.45); inn.translate(x / 100, 1.05, -d / 100); b.put(inn, M.inner, false);
  b.cyl(x, d, 69, CH_R, 2, M.base);
  b.cyl(x, d, 70, 34, 32, M.metal);
  b.cyl(x, d, 102, 32, 1, M.dark, 40, false);
  inner(b, x, d);
}
/* the wafer's places in a cluster tool, and its robots: the same names as the 2D steps */
const CLUSTER_AT = { pod: [0, 30, 110], efem: [0, 105, 120], lock: [-45, 185, 104], xfer: [0, 330, 110], ch: [175, 330, 104], ch2: [-88, 482, 110] };
const CLUSTER_ROBOTS = [
  { id: 'A', rail: [-90, 90], b: [0, 105, 14], h: 112, L: 42, rest: [20, 115], zone: ['pod', 'efem', 'lock'] },
  { id: 'B', b: [0, 330, 72], h: 106, L: 92, rest: [0, 280], zone: ['lock', 'xfer', 'ch', 'ch2'] }
];

/* ======== the stations ======== */
const BUILD = {};
const proc = (f, mine, key) => (mine ? f.s.k === key && f.proc : true);

/* clean, deposit, etch, implant: one cluster tool each, with what makes each chamber different */
function clusterStation(id, kind, vacuum, inner) {
  BUILD[id] = (b, plant, first) => {
    bay(b, plant, first);
    clusterTool(b, kind, vacuum);
    const extra = inner(b);
    return extra;
  };
}
clusterStation('clean', 'clean', false, b => {
  const M = b.M; let spray, arm;
  openChamber(b, 175, 330, (b2, x, d) => {
    b2.cyl(x, d, 103, 46, 10, M.dark, 40, false);
    arm = b2.mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04).translate(0.25, 0, 0), M.metal); arm.position.copy(V(x + 50, d - 30, 140));
    spray = b2.mesh(new THREE.ConeGeometry(0.1, 0.25, 16, 1, true).translate(0, -0.125, 0), M.spray, false); spray.position.copy(V(x, d, 136));
  });
  b.part('chamber', 120, 275, 0, 110, 110, 150);
  return { ch: [175, 330, 104], update(f, mine, t) { const on = proc(f, mine, 'proc.clean'); spray.visible = on; arm.rotation.y = 2.4 + (on ? Math.sin(t * 1.6) * 0.5 : 0); spray.position.x = (175 + (on ? Math.sin(t * 1.6) * 20 : 0)) / 100; } };
});
clusterStation('deposit', 'dep', true, b => {
  const M = b.M; let haze, heater;
  openChamber(b, 175, 330, (b2, x, d) => {
    heater = b2.mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.01, 40).translate(x / 100, 1.035, -d / 100), M.heat, false);
    b2.cyl(x, d, 158, 44, 6, M.metal);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const px = x - 25 + i * 10, pd = d - 25 + j * 10; if (Math.hypot(px - x, pd - d) < 30) b2.line([px, pd, 157.6], [px + 0.1, pd, 157.6]); }
    haze = b2.mesh(new THREE.CylinderGeometry(0.36, 0.33, 0.5, 32, 1, true).translate(x / 100, 1.3, -d / 100), M.spray, false);
  });
  b.part('heater', 140, 295, 70, 70, 70, 34);
  b.part('gas', -260, 560, 0, 90, 80, 230);
  return { ch: [175, 330, 104], update(f, mine, t) { const on = proc(f, mine, 'proc.deposit'); haze.visible = on; haze.material.opacity = 0.15 + 0.08 * Math.sin(t * 3); heater.visible = on || !mine; } };
});
clusterStation('etch', 'etch', true, b => {
  const M = b.M; let plasma;
  openChamber(b, 175, 330, (b2, x, d) => {
    plasma = b2.mesh(new THREE.CylinderGeometry(0.36, 0.33, 0.42, 32, 1, true).translate(x / 100, 1.27, -d / 100), M.plasma, false);
    b2.cyl(x, d, 150, CH_R - 4, 4, M.glass, 40, false);
    for (let k = 0; k < 3; k++) { const tor = new THREE.TorusGeometry((40 - k * 10) / 100, 0.012, 8, 40); tor.rotateX(Math.PI / 2); tor.translate(x / 100, 1.58 + k * 0.03, -d / 100); b2.put(tor, M.copper, false); }
  });
  b.part('plasma', 135, 290, 104, 80, 80, 46);
  /* the technician at a screen, beside the tool */
  b.box(300, 40, 0, 50, 40, 120, M.body); b.box(298, 38, 100, 54, 2, 34, M.screen, false);
  person(b, 330, -20);
  b.part('people', 310, -40, 0, 40, 40, 175);
  return { ch: [175, 330, 104], update(f, mine, t) { const on = proc(f, mine, 'proc.etch'); plasma.visible = on; plasma.scale.y = 0.94 + 0.06 * Math.sin(t * 7); } };
});
clusterStation('implant', 'implant', true, b => {
  const M = b.M; let beam, glow2;
  openChamber(b, 175, 330, (b2, x, d) => {
    beam = b2.mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8).rotateX(Math.PI / 2).rotateY(-0.7).translate((x + 50) / 100, 1.15, -(d + 60) / 100), M.beam, false);
  });
  /* the beamline: a source, a magnet that sorts the atoms, a tube to the chamber */
  b.box(300, 520, 0, 90, 90, 160, M.body); b.box(270, 430, 90, 70, 70, 70, M.panel);
  const tor = new THREE.TorusGeometry(0.32, 0.06, 10, 24, Math.PI / 2); tor.rotateX(Math.PI / 2); tor.translate(3.05, 1.25, -4.65); b.put(tor, M.metal);
  b.pipe([[330, 470, 125], [260, 420, 118], [215, 360, 112]], 7, M.metal);
  b.part('beam', 200, 340, 100, 150, 160, 40); b.part('magnet', 270, 430, 90, 70, 70, 70);
  /* the flash heater: one of the other chambers, glowing when it works */
  b.part('heater', -88 - CH_R, 482 - CH_R, 0, 2 * CH_R, 2 * CH_R, 150);
  return { ch: [175, 330, 104], update(f, mine, t) { beam.visible = proc(f, mine, 'proc.implant.beam'); beam.material.opacity = 0.5 + 0.3 * Math.sin(t * 9); } };
});

/* ---- crystal: sand purified, melted in a crucible, and a single crystal pulled up out of it ---- */
BUILD.crystal = (b, plant, first) => {
  const M = b.M; bay(b, plant, first);
  /* sand, and pure silicon in chunks */
  const cone = new THREE.ConeGeometry(0.62, 0.42, 24); cone.translate(-2.8, 0.21, -0.9); b.put(cone, M.crate);
  b.box(-200, 40, 0, 80, 60, 30, M.base); for (let i = 0; i < 9; i++) b.box(-196 + (i % 3) * 25, 44 + Math.floor(i / 3) * 18, 30, 18, 14, 8 + (i % 2) * 4, M.metal, false);
  b.part('sand', -340, 20, 0, 230, 140, 50);
  /* the puller: a base, a chamber cut open at the front, the crucible glowing inside, a tall pull chamber above */
  b.box(-110, 160, 0, 220, 200, 80, M.base);
  const wall = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 48, 1, true, Math.PI * 0.85, Math.PI * 1.5); wall.translate(0, 1.55, -2.6); b.put(wall, M.body);
  const inn = new THREE.CylinderGeometry(0.76, 0.76, 1.5, 48, 1, true, Math.PI * 0.85, Math.PI * 1.5); inn.translate(0, 1.55, -2.6); b.put(inn, M.inner, false);
  b.cyl(0, 260, 80, 80, 2, M.dark);
  b.cyl(0, 260, 230, 80, 8, M.body); b.cyl(0, 260, 238, 30, 260, M.body); b.cyl(0, 260, 498, 36, 14, M.metal);
  b.box(-6, 228, 330, 12, 2, 60, M.glass, false);
  b.cyl(0, 260, 82, 46, 36, M.metal);
  b.part('furnace', -80, 180, 0, 160, 160, 512); b.partCyl('melt', 0, 260, 82, 46, 40);
  /* finished crystals on a rack */
  b.box(180, 120, 0, 200, 80, 40, M.base); for (let k = 0; k < 3; k++) b.rod(280, 140 + k * 22, 52, 10, 170, 'x', M.metal, 20);
  let melt, ingot, wire;
  melt = b.mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 40).translate(0, 1.19, -2.6), M.heat, false);
  ingot = b.mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 28).translate(0, 0.5, 0), M.metal); ingot.position.copy(V(0, 260, 120));
  wire = b.mesh(new THREE.BoxGeometry(0.006, 1, 0.006).translate(0, 0.5, 0), M.metal, false);
  b.partCyl('ingot', 0, 260, 120, 12, 120);
  return { noPorts: true, close: 2.3, at: { sand: [-280, 90, 40], melt: [0, 260, 120], ingot: [0, 260, 170] }, robots: [],
    update(f, mine, t) {
      const g = mine ? (f.i < 2 ? 0 : f.pu) : (t * 0.05) % 1, len = 0.15 + 0.85 * g;
      melt.visible = !mine || f.i >= 1; melt.material.opacity = 0.25 + 0.1 * Math.sin(t * 2);
      ingot.visible = !mine || f.i >= 2; ingot.scale.y = len; ingot.position.y = 1.2 + 0.02; ingot.rotation.y = t * 0.6;
      wire.position.copy(V(0, 260, 120 + len * 100)); wire.scale.y = Math.max(0.05, (498 - 120 - len * 100) / 100);
    } };
};

/* ---- slice: a wire saw cuts the crystal into slices, a polisher makes each flat, a robot puts yours in a pod ---- */
BUILD.slice = (b, plant, first) => {
  const M = b.M; bay(b, plant, first);
  [0].forEach(x => { b.box(x - 30, 0, 0, 60, 60, 90, M.base); b.box(x - 26, 4, 90, 52, 52, 4, M.metal); });
  b.part('pod', -30, 0, 0, 60, 60, 128);
  /* the wire saw */
  b.box(-340, 150, 0, 220, 180, 50, M.base);
  [[-340, 150], [-130, 150], [-340, 320], [-130, 320]].forEach(([x, d]) => b.box(x, d, 50, 10, 10, 150, M.body));
  b.box(-340, 150, 200, 220, 180, 14, M.body);
  [-310, -150].forEach(x => b.rod(x, 240, 90, 18, 160, 'z', M.metal, 24));
  b.rod(-230, 240, 160, 14, 150, 'x', M.metal, 24);
  for (let k = 0; k < 14; k++) b.line([-310, 160 + k * 11, 90], [-150, 160 + k * 11, 90]);
  b.part('saw', -340, 150, 0, 220, 180, 214); b.part('ingot', -305, 225, 146, 150, 30, 30);
  /* the polisher: a big turning pad and a head */
  b.box(130, 180, 0, 200, 180, 80, M.base); b.cyl(230, 270, 80, 82, 8, M.metal, 48);
  b.box(300, 250, 88, 20, 20, 90, M.body); b.box(220, 250, 160, 100, 20, 14, M.body);
  b.part('polish', 130, 180, 0, 200, 180, 180);
  /* finished wafers, stacked in a cassette */
  b.box(330, 60, 0, 70, 70, 70, M.base); for (let k = 0; k < 6; k++) b.cyl(365, 95, 70 + k * 5, 28, 2, M.waferOther, 32, false);
  b.part('wafers', 330, 60, 0, 70, 70, 100);
  b.box(80, 140, 0, 60, 60, 20, M.base);
  const pad = b.mesh(new THREE.BoxGeometry(1.5, 0.004, 0.02), M.dark, false); pad.position.copy(V(230, 270, 89));
  const web = b.mesh(new THREE.BoxGeometry(1.6, 0.02, 1.6), M.copper, false); web.position.copy(V(-230, 240, 90));
  b.part('efem', 80, 140, 0, 60, 60, 110);
  return { close: 1.6, at: { saw: [-230, 240, 160], pol: [230, 270, 92], efem: [110, 120, 110], pod: [0, 30, 110] },
    robots: [{ id: 'A', b: [110, 170, 20], h: 108, L: 92, rest: [110, 120], zone: ['pod', 'efem', 'pol'] }],
    update(f, mine, t) { pad.rotation.y = t * 2; web.scale.set(1, 1, 1); web.position.y = (mine && f.i === 0 ? 1.6 - f.pu * 0.6 : 1.0); web.visible = !mine || f.i === 0; } };
};

/* ---- print: a coating track (coat, then develop) joined to the scanner that prints with light ---- */
BUILD.print = (b, plant, first) => {
  const M = b.M; bay(b, plant, first);
  front3(b);
  /* the track: two bowls behind the front module, an interface robot */
  b.box(-200, 150, 0, 340, 200, 90, M.base);
  b.box(-200, 150, 90, 340, 200, 2, M.glass, false);
  [[-20, 'coat'], [80, 'develop']].forEach(([x, k]) => { b.cyl(x, 210, 90, 40, 18, M.body, 32); b.cyl(x, 210, 107, 34, 1, M.dark, 32, false); b.partCyl(k, x, 210, 0, 40, 110); });
  /* the scanner: a big machine, its side cut away to show the wafer stage, the lenses, the mask, the light source behind */
  b.box(180, 120, 0, 280, 320, 40, M.base);
  b.box(180, 120, 40, 8, 320, 200, M.body); b.box(180, 432, 40, 280, 8, 200, M.body); b.box(452, 120, 40, 8, 320, 200, M.body);
  b.box(180, 120, 232, 280, 320, 10, M.glass, false);
  b.box(260, 190, 40, 140, 140, 50, M.metal);
  b.cyl(320, 260, 120, 32, 90, M.body); b.cyl(320, 260, 210, 40, 6, M.metal);
  b.box(260, 220, 216, 120, 80, 8, M.panel); for (let k = 0; k < 5; k++) b.box(270 + k * 22, 230, 224, 10, 60, 1, M.dark, false);
  b.box(380, 330, 40, 70, 90, 180, M.body);
  b.part('scanner', 180, 120, 0, 280, 320, 242); b.part('mask', 260, 220, 216, 120, 80, 10); b.part('light', 300, 240, 130, 100, 100, 110);
  const light = b.mesh(new THREE.CylinderGeometry(0.05, 0.12, 1.2, 16, 1, true).translate(3.2, 1.62, -2.6), M.light, false);
  const spin = b.mesh(new THREE.BoxGeometry(0.6, 0.01, 0.04), M.metal, false); spin.position.copy(V(-20, 210, 108));
  return { close: 1.3, at: { pod: [0, 30, 110], efem: [0, 110, 110], coat: [-20, 210, 108], dev: [80, 210, 108], iface: [190, 240, 110], scan: [320, 260, 92] },
    robots: [{ id: 'A', rail: [-80, 80], b: [0, 105, 14], h: 108, L: 60, rest: [10, 115], zone: ['pod', 'efem', 'coat', 'dev'] },
      { id: 'B', b: [140, 290, 0], h: 112, L: 92, rest: [140, 250], zone: ['coat', 'dev', 'iface'] }],
    update(f, mine, t) { light.visible = mine ? f.s.k === 'proc.print.expose' && f.proc : (t * 0.8) % 1 < 0.6; light.material.opacity = 0.35 + 0.2 * Math.sin(t * 12); spin.rotation.y = t * (mine && f.s.k !== 'proc.print.coat' ? 0.5 : 9); } };
};

/* ---- wires: a copper bath, then a polisher that leaves copper only in the cuts; then round again ---- */
BUILD.wires = (b, plant, first) => {
  const M = b.M; bay(b, plant, first);
  front3(b);
  b.box(-200, 170, 0, 160, 160, 80, M.base); b.box(-196, 174, 80, 152, 152, 2, M.copper, false); b.box(-200, 170, 80, 160, 4, 30, M.glass, false);
  b.part('plating', -200, 170, 0, 160, 160, 110);
  b.box(100, 200, 0, 200, 190, 80, M.base); b.cyl(190, 290, 80, 92, 8, M.metal, 48);
  b.box(270, 270, 88, 20, 20, 100, M.body); b.box(180, 270, 170, 110, 20, 14, M.body);
  b.part('polish', 100, 200, 0, 200, 190, 190);
  b.cyl(60, 260, 0, 18, 100, M.base);
  b.part('xfer', 40, 240, 0, 40, 40, 112);
  /* the loop: an arrow on the back wall, back to cleaning for the next layer */
  b.pipe([[300, 686, 250], [300, 686, 300], [-320, 686, 300], [-320, 686, 250]], 4, M.warm);
  b.part('loop', -330, 680, 240, 640, 10, 70);
  const pad = b.mesh(new THREE.BoxGeometry(1.7, 0.004, 0.02), M.dark, false); pad.position.copy(V(190, 290, 89));
  return { close: 1.3, at: { pod: [0, 30, 110], efem: [0, 105, 120], plate: [-120, 250, 100], hand: [0, 210, 110], pol: [190, 290, 100] },
    robots: [{ id: 'A', rail: [-90, 90], b: [0, 105, 14], h: 112, L: 76, rest: [10, 115], zone: ['pod', 'efem', 'plate', 'hand'] },
      { id: 'B', b: [60, 260, 0], h: 112, L: 92, rest: [60, 220], zone: ['plate', 'hand', 'pol'] }],
    update(f, mine, t) { pad.rotation.y = t * (mine && f.s.k !== 'proc.wires.polish' ? 0.4 : 3); } };
};

/* ---- test: a prober touches every chip with needles; the map shows which work ---- */
BUILD.test = (b, plant, first) => {
  const M = b.M; bay(b, plant, first);
  front3(b);
  b.box(10, 150, 0, 60, 70, 60, M.base); b.box(10, 150, 60, 60, 70, 44, M.panel); b.part('shelf', 10, 150, 0, 60, 70, 104);
  b.box(120, 150, 0, 230, 230, 90, M.body); b.box(120, 150, 90, 230, 230, 2, M.glass, false);
  b.box(150, 160, 90, 170, 8, 70, M.body); b.box(150, 360, 90, 170, 8, 70, M.body); b.box(150, 160, 160, 170, 208, 8, M.panel, false);
  b.cyl(230, 270, 90, 50, 8, M.metal, 40);
  b.part('prober', 120, 150, 0, 230, 230, 170); b.part('needles', 200, 240, 140, 60, 60, 24);
  const card = b.mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 32), M.body); card.position.copy(V(230, 270, 140));
  /* the wafer map, on a screen beside it */
  b.box(380, 80, 0, 10, 10, 120, M.base); b.box(345, 72, 120, 80, 6, 80, M.body); b.box(349, 70, 124, 72, 2, 72, M.screen, false);
  b.part('map', 345, 66, 120, 80, 10, 80);
  const { DIES: dies, HITS: hits } = chip3();
  const n = dies.length, mapM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), Math.max(1, n)), mm = new THREE.Matrix4(), c = new THREE.Color();
  dies.forEach((d, i) => { const s = Math.max(0.004, (d[2] / 1000) * 0.68); mm.makeScale(s, s, 1).setPosition(3.53 + (d[0] / 1000) * 0.68 + s / 2 - 0.0, 1.96 - (d[1] / 1000) * 0.68 - s / 2, -0.689); mapM.setMatrixAt(i, mm); mapM.setColorAt(i, c.set(b.M.dark.color)); });
  b.dyn.add(mapM);
  return { at: { pod: [0, 30, 110], efem: [0, 105, 120], lock: [40, 185, 104], probe: [230, 270, 100] },
    robots: [CLUSTER_ROBOTS[0], { id: 'B', b: [120, 230, 0], h: 108, L: 72, rest: [130, 210], zone: ['lock', 'probe'] }],
    update(f, mine, t) {
      const upto = mine ? (f.s.k === 'proc.test' ? f.pu : f.i > 3 ? 1 : 0) : 1, k = Math.floor(n * upto), col = b.M;
      card.position.y = 1.4 + ((mine && f.s.k === 'proc.test') || !mine ? ((t * 3) % 1 < 0.5 ? -0.02 : 0) : 0.06);
      if (mapM.userData.k !== k) { for (let i = 0; i < n; i++) mapM.setColorAt(i, c.set(i < k ? (hits[i] ? col.red.color : col.grn.color) : col.dark.color)); mapM.instanceColor.needsUpdate = true; mapM.userData.k = k; }
    } };
};

/* ---- pkg: in the packaging plant, the wafer is cut into chips; a good one is joined to its package ---- */
BUILD.pkg = (b, plant, first) => {
  const M = b.M; bay(b, plant, first);
  [-70, 0].forEach(x => { b.box(x - 30, 0, 0, 60, 60, 90, M.base); b.box(x - 26, 4, 90, 52, 52, 4, M.metal); });
  b.part('pod', -30, 0, 0, 60, 60, 128);
  b.box(-90, 130, 0, 60, 60, 20, M.base); b.part('efem', -90, 130, 0, 60, 60, 110);
  /* the dicing saw */
  b.box(-300, 160, 0, 180, 160, 80, M.base); b.box(-300, 160, 80, 180, 160, 2, M.glass, false); b.cyl(-200, 240, 80, 40, 10, M.metal);
  b.part('saw', -300, 160, 0, 180, 160, 130);
  const blade = b.mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 32).rotateX(Math.PI / 2), M.metal); blade.position.copy(V(-200, 240, 128));
  /* the bonder: the package base, memory beside it, lids waiting */
  b.box(90, 170, 0, 210, 160, 80, M.base);
  b.box(170, 220, 80, 60, 50, 6, M.grn); b.part('substrate', 170, 220, 80, 60, 50, 6);
  for (let m = 0; m < 5; m++) b.box(240, 225, 80 + m * 6, 18, 40, 5, M.body); b.part('memory', 240, 225, 80, 18, 40, 30);
  for (let m = 0; m < 4; m++) b.box(120, 300, 80 + m * 5, 30, 24, 4, M.metal); b.part('lid', 120, 300, 80, 30, 24, 20);
  b.part('bumps', 180, 225, 86, 40, 40, 4); b.part('die', 110, 220, 130, 40, 40, 40);
  /* the trays for finished chips */
  b.box(290, 50, 0, 80, 70, 60, M.base);
  const tray = makeTray(M, false); tray.position.copy(V(330, 85, 60)); b.dyn.add(tray); b.part('tray', 290, 50, 0, 80, 70, 70);
  return { close: 1.3, at: { pod: [0, 30, 110], efem: [-60, 160, 110], saw: [-200, 240, 92], head: [130, 240, 150], sub: [200, 245, 92], tray: [330, 85, 70] },
    robots: [{ id: 'A', b: [-60, 160, 20], h: 108, L: 90, rest: [-60, 120], zone: ['pod', 'efem', 'saw'] }, { id: 'P', gantry: true, x0: -240, x1: 380, d: 240, top: 230, rest: [60, 240, 160], zone: ['saw', 'head', 'sub', 'tray'] }],
    update(f, mine, t) { blade.rotation.z = t * 20; blade.visible = true; blade.position.x = (-230 + ((t * 0.3) % 1) * 60) / 100 + (mine && f.s.k !== 'proc.pkg.saw' ? 0 : 0); } };
};

/* ---- ship: a last test in a socket, packed, and out: to a data centre, a phone, a car ---- */
BUILD.ship = (b, plant, first) => {
  const M = b.M; bay(b, plant, first);
  b.box(-30, 0, 0, 60, 60, 90, M.base); b.part('tray', -30, 0, 0, 60, 60, 100);
  b.box(120, 140, 0, 130, 120, 90, M.body); b.box(170, 185, 90, 30, 30, 8, M.metal); b.part('trays', 120, 140, 0, 130, 120, 100);
  for (let k = 0; k < 3; k++) b.box(290, 110 + k * 45, 0, 90, 40, 60 - k * 8, M.crate); b.part('boxes', 290, 110, 0, 90, 130, 60);
  /* three doors out, and what waits beyond each */
  [[-300, 'datacentre'], [-60, 'phone'], [180, 'car']].forEach(([x, k]) => {
    b.box(x, 684, 0, 160, 8, 220, M.dark, false); b.box(x - 6, 684, 220, 172, 8, 10, M.metal);
    if (k === 'datacentre') for (let i = 0; i < 3; i++) b.box(x + 20 + i * 42, 600, 0, 34, 50, 150, M.body);
    if (k === 'phone') { b.box(x + 60, 610, 0, 40, 10, 84, M.body); b.box(x + 64, 608, 6, 32, 2, 72, M.screen, false); }
    if (k === 'car') { b.box(x + 10, 560, 20, 150, 90, 50, M.body); b.box(x + 40, 570, 70, 80, 70, 30, M.glass); [[x + 35, 555], [x + 135, 555], [x + 35, 655], [x + 135, 655]].forEach(([wx, wd]) => b.rod(wx, wd, 20, 20, 12, 'z', M.dark, 20)); }
    b.part(k, x, 560, 0, 160, 132, 230);
  });
  return { close: 1.5, at: { tray: [0, 30, 100], sock: [185, 200, 105], box: [335, 150, 70], out: [330, 400, 60] },
    robots: [{ id: 'P', gantry: true, x0: -60, x1: 380, d: 180, top: 230, rest: [100, 180, 160], zone: ['tray', 'sock', 'box', 'out'] }],
    update() {} };
};

/* a person in a clean-room suit */
function person(b, x, d) {
  const M = b.M;
  b.box(x - 12, d - 7, 0, 10, 14, 85, M.body); b.box(x + 2, d - 7, 0, 10, 14, 85, M.body);
  b.box(x - 17, d - 10, 85, 34, 20, 60, M.body); b.box(x - 24, d - 7, 92, 7, 14, 50, M.body); b.box(x + 17, d - 7, 92, 7, 14, 50, M.body);
  b.cyl(x, d, 145, 12, 26, M.body, 16); b.box(x - 8, d - 13, 154, 16, 2, 10, M.cool, false);
}

/* stations not drawn yet in 3D get the bay and a simple stand-in, so the line stays whole */
function standIn(b, plant, first) { bay(b, plant, first); b.box(-120, 60, 0, 240, 200, 160, b.M.body); return {}; }

/* ======== the view ======== */
export function createJourney3D(host, before) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
  const cv = renderer.domElement; cv.id = 'world3d'; cv.setAttribute('aria-hidden', 'true');
  host.insertBefore(cv, before);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  /* if frames come too slowly (an older phone), drop shadows and sharpness, once */
  const perf = { ema: 16, low: false, seen: 0 };
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8090a8, 1.6), sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 }); sun.shadow.bias = -0.0008;
  scene.add(hemi, sun, sun.target);
  let M = null, theme = '', ids = [], built = new Map(), pod = null, podCrate = null, hoist = null, lastT = 0;
  const cam = { p: new THREE.Vector3(), t: new THREE.Vector3(), init: false };
  const ambientPods = [];

  function reset(col) {
    built.forEach(s => { scene.remove(s.group); s.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }); built.clear();
    if (pod) scene.remove(pod.group);
    M = materials(col);
    scene.background = new THREE.Color(col.dark ? '#05070d' : '#e6eaf0');
    scene.fog = new THREE.Fog(scene.background, 14, 34);
    hemi.color.set(col.dark ? '#aab8e6' : '#ffffff'); hemi.groundColor.set(col.dark ? '#141c34' : '#9aa6b8'); hemi.intensity = col.dark ? 1.25 : 1.7;
    sun.intensity = col.dark ? 1.1 : 1.6;
    /* your pod, the vehicle that carries it along the track, and the crate it travels in between plants */
    const g = new THREE.Group(), veh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.5), M.metal); veh.add(new THREE.LineSegments(new THREE.EdgesGeometry(veh.geometry), M.edge));
    const p = makePod(M, true), tr = makeTray(M, true), cr = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.58).translate(0, 0.24, 0), M.crate); cr.add(new THREE.LineSegments(new THREE.EdgesGeometry(cr.geometry), M.edge));
    const belt = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3)), M.edge);
    g.add(veh, p, tr, cr, belt); scene.add(g);
    pod = { group: g, veh, pod: p, tray: tr, crate: cr, belt };
  }
  function station(i) {
    if (built.has(i)) return built.get(i);
    const id = ids[i], plant = PLANTS[id], first = i > 0 && PLANTS[ids[i - 1]] !== plant, b = new Builder(M);
    const extra = (BUILD[id] || standIn)(b, plant, first) || {}, J = JOURNEY[id], cluster = !!extra.ch && !extra.at;
    /* the wafer's places: a cluster tool's, the station's own, or (not drawn yet) spread out in the middle */
    const at = extra.at || (cluster ? CLUSTER_AT : Object.fromEntries(Object.keys(J.at).map((k, n) => [k, [-120 + n * 60, 200, 120]])));
    const robots = extra.robots || (cluster ? CLUSTER_ROBOTS : J.robots);
    const cfg = Object.assign({}, J, { at, robots });
    const arms = (extra.robots || cluster ? robots : []).map(R => ({ R, move: robot(b, R) }));
    const wafer = makeWafer(b, false), mineW = makeWafer(b, true), chip = makeChip(b);
    const others = [70, -70].map(x => { const q = makePod(M, false); q.position.copy(V(x, 30, 94)); b.dyn.add(q); return q; });
    const dock = J.home === 'tray' ? makeTray(M, false) : makePod(M, false); dock.position.copy(V(0, 30, 94)); b.dyn.add(dock); others.forEach(q => { q.visible = !extra.noPorts; });
    if (J.nowafer || extra.noPorts) dock.visible = false;
    const group = b.finish(i * S); scene.add(group);
    const st = { id, i, group, parts: b.parts, cfg, extra, arms, wafer, mineW, chip, dock, others };
    built.set(i, st); return st;
  }

  /* everything about one frame: o = { ids, Z, near, dist, run, tm, W, H, dpr, box: { B, cx, cy }, col } */
  function render(o) {
    const col = o.col, key = col.dark ? 'd' : 'l';
    if (o.ids !== ids) { ids = o.ids; theme = ''; }
    if (key !== theme) { theme = key; reset(col); }
    const dt = Math.min(0.1, Math.max(0, o.tm - lastT)); lastT = o.tm;
    if (dt > 0) { perf.ema = lerp(perf.ema, dt * 1000, 0.05); perf.seen++; }
    if (!perf.low && perf.seen > 90 && perf.ema > 30) { perf.low = true; renderer.shadowMap.enabled = false; scene.traverse(q => { if (q.material) q.material.needsUpdate = true; }); }
    /* the stations near you; the rest are let go */
    const want = new Set([o.near - 1, o.near, o.near + 1, Math.floor(o.Z), Math.ceil(o.Z)].filter(i => i >= 0 && i < ids.length));
    built.forEach((s, i) => { if (!want.has(i)) { scene.remove(s.group); s.group.traverse(q => { if (q.geometry) q.geometry.dispose(); }); built.delete(i); } });
    want.forEach(i => station(i));
    let focus = null, closeK = 0;
    built.forEach(s => {
      const mine = s.i === o.near && o.dist < 0.5, run = mine ? (o.run == null ? 0 : o.run) : o.tm * 0.8 + (s.cfg.seed || 0) * s.cfg.tot;
      const f = flow(s.cfg, run);
      s.arms.forEach(({ R, move }) => move(f.p && f.hold === R.id ? f.p : R.rest.length > 2 ? R.rest : R.rest.concat([R.h]), dt));
      const w = mine ? s.mineW : s.wafer, ch = s.chip;
      s.wafer.visible = s.mineW.visible = ch.visible = false;
      if (f.p && !f.home) { const m = f.chip ? ch : w; m.visible = true; m.material = f.chip ? M.chip : mine ? M.wafer : M.waferOther; m.position.copy(V(f.p[0], f.p[1], f.p[2])); }
      s.dock.visible = !mine && !s.cfg.nowafer && !s.extra.noPorts;
      if (s.extra.update) s.extra.update(f, mine, o.tm);
      if (mine && o.run != null && o.dist < 0.02) focus = { s, f };
    });
    /* your pod: on the track while you travel, lowered onto the machine's door when you stop */
    const si = ids.indexOf('slice'), pk = ids.indexOf('pkg'), lo = Math.floor(o.Z + 1e-6), hi = Math.ceil(o.Z - 1e-6);
    const cross = PLANTS[ids[lo]] !== PLANTS[ids[Math.min(hi, ids.length - 1)]];
    pod.group.visible = o.Z >= si - 1e-6;
    if (pod.group.visible) {
      const down = smooth((0.3 - o.dist) / 0.2), x = o.Z * S + (o.near - o.Z) * S * down, h = lerp(250, 94, down), trays = o.Z > pk + 0.5;
      pod.group.position.copy(V(x, 30, 0)); pod.pod.position.y = pod.tray.position.y = pod.crate.position.y = h / 100;
      pod.pod.visible = !trays; pod.tray.visible = trays; pod.crate.visible = cross && o.dist > 0.06;
      pod.veh.position.y = 3.1; pod.belt.geometry.attributes.position.array.set([-0.12, 2.89, 0, -0.12, h / 100 + 0.36, 0, 0.12, 2.89, 0, 0.12, h / 100 + 0.36, 0]); pod.belt.geometry.attributes.position.needsUpdate = true;
    }
    /* the camera: along the line; when you stop, it follows your wafer, and moves in while a machine works on it */
    const x0 = o.Z * S / 100;
    const P = new THREE.Vector3(x0 + 1.0, 11.8, 6.4), T = new THREE.Vector3(x0 + 0.2, 0.2, -2.7);
    if (focus) {
      const { s, f } = focus, here = s.cfg.at[f.s.to], chW = here ? V(here[0], here[1], here[2]).add(s.group.position) : null;
      if (f.p) { const w = V(f.p[0], f.p[1], f.p[2]).add(s.group.position); T.lerp(w, 0.18); }
      if (f.proc && chW) { const k = smooth(f.pu * 6) * smooth((1 - f.pu) * 8), c = s.extra.close || 1; T.lerp(chW, k); P.lerp(chW.clone().add(new THREE.Vector3(1.0 * c, 3.0 * c, 1.9 * c)), k * 0.85); closeK = k; }
    }
    /* the overhead track fades while the camera is in close, so it never stands in the way */
    cam.k = lerp(cam.k || 0, closeK, 1 - Math.exp(-dt * 3)); M.rail.opacity = 1 - 0.85 * cam.k; M.rail.depthWrite = cam.k < 0.2;
    if (!cam.init) { cam.p.copy(P); cam.t.copy(T); cam.init = true; }
    const k = 1 - Math.exp(-dt * 3.2); cam.p.lerp(P, k); cam.t.lerp(T, k);
    if (Math.abs(cam.p.x - P.x) > 4) { cam.p.copy(P); cam.t.copy(T); }
    camera.position.copy(cam.p); camera.lookAt(cam.t);
    sun.position.set(cam.t.x - 4, 12, cam.t.z + 6); sun.target.position.copy(cam.t);
    /* fit: the station fills the dive's box; the rest of the canvas shows its surroundings */
    const { W, H, dpr, box } = o;
    const pr = Math.min(dpr, perf.low ? 1 : 1.5); if (renderer.getPixelRatio() !== pr) renderer.setPixelRatio(pr);
    const sz = renderer.getSize(new THREE.Vector2()); if (sz.x !== W || sz.y !== H) renderer.setSize(W, H, false);
    camera.fov = (2 * Math.atan(Math.tan((30 * Math.PI) / 360) * (H / box.B)) * 180) / Math.PI; camera.aspect = W / H;
    /* the band covers the bottom of the box on a wide screen: aim a little above the middle */
    const cy = box.below ? box.cy : box.cy - box.B * 0.07;
    camera.setViewOffset(W, H, W / 2 - box.cx, H / 2 - cy, W, H); camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    return focus;
  }
  /* where a station's parts are on screen, in the dive box's 1000 x 1000 space */
  function parts(id, box, W, H) {
    let st = null; built.forEach(s => { if (s.id === id && (!st || Math.abs(s.i * S / 100 - cam.t.x) < Math.abs(st.i * S / 100 - cam.t.x))) st = s; });
    if (!st) return null;
    const left = box.cx - box.B / 2, top = box.cy - box.B / 2, out = {}, v = new THREE.Vector3();
    for (const k in st.parts) out[k] = st.parts[k].map(list => hull(list.map(p => { v.copy(p).project(camera); return [((v.x + 1) / 2 * W - left) / box.B * 1000, ((1 - v.y) / 2 * H - top) / box.B * 1000]; })));
    return out;
  }
  return { render, parts, canvas: cv, dispose() { renderer.dispose(); cv.remove(); } };
}
function hull(q) {
  q = q.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of q.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const pts = lo.slice(0, -1).concat(up.slice(0, -1));
  return { p: pts.concat([pts[0]]), closed: true };
}
