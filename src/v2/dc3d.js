/* The data centre, as one continuous flight: from the campus outside, through the opened roof into the hall,
   down to one rack, the server tray that slides out of it, the board inside, and the chip on the board.
   One scene at true scale, in metres, with the followed chip near the origin so that the closest views stay
   steady. The camera moves along a single path (depth z from 0 to 5, one step per level); everything that
   opens (the roof, the rack door, the tray, its lid, the heat sink, the chip's lid) opens as a function of z,
   so nothing appears from nowhere. Words: place.dc.<level>.t / .d; the parts' names come from their one home in the atlas (src/data/atlas.js). */
import { VIEW_PARTS } from '../data/atlas.js';
import { THREE, PALETTES, theme, stage, light, mat, metal, glow, glass, box, cyl, group, labels, clamp, smooth, ease, reduced, rnd } from './kit3d.js';
import { t } from '../core/i18n.js';

export const LEVELS = ['campus', 'hall', 'rack', 'server', 'board', 'chip'];
/* the question asked at each level: a stop of one thread (stop.<key>.q) */
export const ASKS = { campus: 'life.building', hall: 'divide.building', rack: 'think.rack', server: 'divide.rack', board: 'think.board', chip: 'think.chip' };

/* where the camera looks at each level: the point, the distance to it, the turn and the tilt */
const KEYS = [
  { look: [8, 2, -6], dist: 120, yaw: -0.62, pitch: 0.6 },
  { look: [0, 0.8, -4.5], dist: 22, yaw: -0.4, pitch: 0.82 },
  { look: [0, 1.15, 0.6], dist: 3.4, yaw: -0.22, pitch: 0.14 },
  { look: [0, 1.08, 0.82], dist: 1.0, yaw: -0.32, pitch: 0.8 },
  { look: [0, 1.082, 0.77], dist: 0.3, yaw: -0.2, pitch: 1.0 },
  { look: [-0.004, 1.081, 0.77], dist: 0.07, yaw: -0.12, pitch: 1.12 }
];

/* the die, as a photo of it would show: copies of one compute tile, a band of memory, links on the edges */
function dieTexture(P) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#1c2230'; g.fillRect(0, 0, 1024, 1024);
  const tile = (x, y, w, h, s) => { g.fillStyle = '#3a3324'; g.fillRect(x, y, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = rnd(i, s) > 0.8 ? '#e9c37a' : rnd(i, s + 1) > 0.5 ? '#9a7b44' : '#5d4a2c'; g.fillRect(x + rnd(i, s + 2) * (w - 6), y + rnd(i, s + 3) * (h * 0.66 - 4), 2 + rnd(i, s + 4) * 6, 1.5 + rnd(i, s + 5) * 3); }
    g.fillStyle = '#244a6a'; g.fillRect(x + 3, y + h * 0.7, w - 6, h * 0.27); g.strokeStyle = 'rgba(140,200,255,.35)'; g.lineWidth = 1; for (let u = x + 5; u < x + w - 3; u += 4) { g.beginPath(); g.moveTo(u, y + h * 0.7); g.lineTo(u, y + h * 0.97); g.stroke(); } };
  for (let j = 0; j < 8; j++) for (let i = 0; i < 12; i++) tile(60 + i * 76, 70 + j * 76, 70, 70, 7);
  g.fillStyle = '#20476a'; g.fillRect(60, 690, 908, 120); g.strokeStyle = 'rgba(140,200,255,.45)'; for (let u = 64; u < 966; u += 5) { g.beginPath(); g.moveTo(u, 692); g.lineTo(u, 808); g.stroke(); }
  g.fillStyle = '#2f3a2e'; for (let i = 0; i < 24; i++) g.fillRect(60 + i * 38, 840, 30, 110);
  g.strokeStyle = '#c9a14a'; g.lineWidth = 6; g.strokeRect(20, 20, 984, 984);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}
/* a rack's front: the servers stacked, their lights */
function rackTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 448; const g = c.getContext('2d');
  g.fillStyle = '#1b2029'; g.fillRect(0, 0, 128, 448);
  for (let i = 0; i < 18; i++) { const y = 20 + i * 23; g.fillStyle = i === 0 ? '#2b3442' : '#232a35'; g.fillRect(8, y, 112, 20); g.fillStyle = '#11151c'; for (let k = 0; k < 9; k++) g.fillRect(14 + k * 8, y + 4, 5, 12); g.fillStyle = rnd(i, 3) > 0.25 ? '#45d08a' : '#ffb347'; g.fillRect(108, y + 7, 5, 5); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}

export function createDataCentre(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const st = stage(canvas), { env } = st;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.sky); scene.fog = new THREE.Fog(P.fog, 260, 700); scene.environment = env; scene.environmentIntensity = night ? 0.35 : 0.5;
  const { sun } = light(scene, P, 60);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 2000);
  const L = labels(host);
  const fades = [];                                     /* [material, from z, to z, direction] */
  const fader = (m, a, b, out = true) => { const mm = m.clone(); mm.transparent = true; fades.push({ m: mm, a, b, out }); return mm; };
  const spins = [];

  /* ---- outside: the campus, its three halls, coolers on their roofs, the substation ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), mat(P.ground, { roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), mat(P.grass, { roughness: 1 })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(10, 0, -10); lawn.receiveShadow = true; scene.add(lawn);
  box(scene, 120, 0.06, 7, mat(P.road), 10, 0, 22, 0.01, { cast: false });
  const HALL = { x0: -13, x1: 13, z0: -18, z1: 9, h: 5.2 };
  /* our hall: walls stay, the roof opens */
  const wallM = mat(P.wall), roofM = fader(mat(P.white), 0.2, 0.75), coolM = fader(mat(P.white), 0.2, 0.7), fanM = fader(metal(P.dark), 0.2, 0.7);
  const hw = HALL.x1 - HALL.x0, hd = HALL.z1 - HALL.z0, hx = (HALL.x0 + HALL.x1) / 2, hz = (HALL.z0 + HALL.z1) / 2;
  box(scene, hw, HALL.h, 0.3, wallM, hx, 0, HALL.z0, 0.05); box(scene, 0.3, HALL.h, hd, wallM, HALL.x0, 0, hz, 0.05); box(scene, 0.3, HALL.h, hd, wallM, HALL.x1, 0, hz, 0.05);
  const front = box(scene, hw, HALL.h, 0.3, fader(wallM, 0.9, 1.4), hx, 0, HALL.z1, 0.05);
  for (let i = 0; i < 9; i++) box(scene, 1.8, 0.7, 0.05, fader(night ? glow(0x8fd0ff, 0.8) : mat(0x3d4f66, { roughness: 0.2, metalness: 0.3 }), 0.9, 1.4), HALL.x0 + 2 + i * 2.8, 3.4, HALL.z1 + 0.18, 0.02, { cast: false });
  const roof = box(scene, hw + 0.6, 0.4, hd + 0.6, roofM, hx, HALL.h, hz, 0.1);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const x = HALL.x0 + 4 + i * 4.6, z = HALL.z0 + 5 + j * 8; box(scene, 3, 1.1, 3, coolM, x, HALL.h + 0.4, z, 0.15); const f = cyl(scene, 1.15, 1.15, 0.12, fanM, x, HALL.h + 1.5, z, 20); spins.push(f); }
  /* the other two halls, further along */
  [[34, -4], [62, -4]].forEach(([x, z]) => { box(scene, hw, HALL.h, hd, wallM, x, 0, z, 0.2); box(scene, hw + 0.6, 0.4, hd + 0.6, mat(P.white), x, HALL.h, z, 0.1);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { box(scene, 3, 1.1, 3, mat(P.white), x - 9.4 + i * 4.6, HALL.h + 0.4, z - 8.5 + j * 8, 0.15); const f = cyl(scene, 1.15, 1.15, 0.12, metal(P.dark), x - 9.4 + i * 4.6, HALL.h + 1.5, z - 8.5 + j * 8, 20); spins.push(f); }
    for (let i = 0; i < 9; i++) box(scene, 1.8, 0.7, 0.05, night ? glow(0x8fd0ff, 0.8) : mat(0x3d4f66, { roughness: 0.2, metalness: 0.3 }), x - 11 + i * 2.8, 3.4, z + hd / 2 + 0.16, 0.02, { cast: false }); });
  /* the substation: transformers, and the line that brings the power */
  const sub = group(scene, -30, 0, -8);
  box(sub, 16, 0.2, 18, mat(P.road), 0, 0, 0, 0.05);
  [[-4, -5], [4, -5], [-4, 4], [4, 4]].forEach(([x, z]) => { box(sub, 4, 3, 3, mat(P.slate), x, 0.2, z, 0.2); for (let k = 0; k < 3; k++) cyl(sub, 0.18, 0.22, 1.4, mat(P.white), x - 1.2 + k * 1.2, 3.2, z, 10); });
  for (let k = -1; k <= 1; k += 2) { const m = cyl(sub, 0.25, 0.45, 22, metal(P.metal), -12, 0, k * 10, 6); m.castShadow = true; }
  /* trees round the campus */
  for (let i = 0; i < 60; i++) { const a = rnd(i, 4) * 6.28, r = 55 + rnd(i, 6) * 60, x = 10 + Math.cos(a) * r, z = -10 + Math.sin(a) * r * 0.7; const s = 1.5 + rnd(i, 7) * 2; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), mat(night ? 0x2e4a3a : 0x6f9a62, { flatShading: true })); m.position.set(x, s * 1.6, z); m.castShadow = true; scene.add(m); cyl(scene, s * 0.12, s * 0.16, s, mat(0x7a5b40), x, 0, z, 6); }

  /* ---- inside the hall: rows of racks, hot aisles closed in between, cable trays above ---- */
  const floorTile = new THREE.Mesh(new THREE.PlaneGeometry(hw - 0.4, hd - 0.4), mat(night ? 0x2a3242 : 0xdfe3ea, { roughness: 0.8 })); floorTile.rotation.x = -Math.PI / 2; floorTile.position.set(hx, 0.01, hz); floorTile.receiveShadow = true; scene.add(floorTile);
  const ROWS = [[0, 1], [-3, -1], [-6.2, 1], [-9.2, -1], [-12.4, 1], [-15.4, -1]];   /* z of the row's centre, which way its fronts face */
  const RACK = { w: 0.6, h: 2.1, d: 1.2 }, NR = 14;
  const rackFront = rackTexture();
  const bodyGeo = new THREE.BoxGeometry(RACK.w - 0.02, RACK.h, RACK.d), faceGeo = new THREE.PlaneGeometry(RACK.w - 0.08, RACK.h - 0.12);
  const bodies = new THREE.InstancedMesh(bodyGeo, mat(P.rack, { roughness: 0.55, metalness: 0.2 }), ROWS.length * NR);
  const faces = new THREE.InstancedMesh(faceGeo, new THREE.MeshStandardMaterial({ map: rackFront, emissiveMap: rackFront, emissive: 0xffffff, emissiveIntensity: night ? 0.55 : 0.18, roughness: 0.5 }), ROWS.length * NR);
  bodies.castShadow = true; bodies.receiveShadow = true;
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  let n = 0;
  ROWS.forEach(([z, f], r) => {
    for (let i = 0; i < NR; i++) {
      const x = (i - 7) * RACK.w;
      if (r === 0 && i === 7) { M4.makeScale(0, 0, 0); bodies.setMatrixAt(n, M4); faces.setMatrixAt(n, M4); n++; continue; }   /* the followed rack is drawn in full below */
      M4.compose(V.set(x, RACK.h / 2, z), Q.identity(), S1); bodies.setMatrixAt(n, M4);
      M4.compose(V.set(x, RACK.h / 2, z + f * (RACK.d / 2 + 0.003)), Q.setFromEuler(E.set(0, f > 0 ? 0 : Math.PI, 0)), S1); faces.setMatrixAt(n, M4); n++;
    }
    /* the cable tray and the power busway above the row */
    box(scene, NR * RACK.w, 0.06, 0.3, mat(P.warm, { roughness: 0.6 }), -0.3, 2.75, z - f * 0.25, 0.015);
    box(scene, NR * RACK.w, 0.14, 0.18, metal(P.metal), -0.3, 2.95, z + f * 0.3, 0.02);
  });
  scene.add(bodies, faces);
  /* hot aisles: between rows whose backs face each other, closed with a glass roof and doors at the ends */
  for (let r = 0; r < ROWS.length - 1; r++) if (ROWS[r][1] > 0 && ROWS[r + 1][1] < 0) {
    const z0 = ROWS[r][0] - RACK.d / 2, z1 = ROWS[r + 1][0] + RACK.d / 2, zc = (z0 + z1) / 2, w = Math.abs(z0 - z1);
    box(scene, NR * RACK.w, 0.05, w, glass(P.warm, { opacity: 0.28 }), -0.3, RACK.h, zc, 0.01, { cast: false });
    [-1, 1].forEach(s => box(scene, 0.05, RACK.h, w, glass(P.glass, { opacity: 0.35 }), -0.3 + s * NR * RACK.w / 2, 0, zc, 0.01, { cast: false }));
  }
  /* cold air rising through the perforated tiles in front of the racks */
  const cold = [];
  for (let i = 0; i < 28; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), glow(P.accent, 1.2, { transparent: true, opacity: 0.5 })); m.userData = { x: -4.2 + rnd(i, 2) * 7.8, z: 0.8 + rnd(i, 3) * 1.4, k: rnd(i, 5) }; scene.add(m); cold.push(m); }
  for (let i = 0; i < 14; i++) box(scene, 0.58, 0.012, 0.58, mat(night ? 0x34405a : 0xc8d2e2, { roughness: 0.7 }), (i - 7) * 0.6, 0, 1.3, 0.01, { cast: false });

  /* ---- the rack the dive follows: its frame, the door that opens, eight server trays, the switch, the power shelf, the coolant ---- */
  const rack = group(scene, 0, 0, 0);
  const frameM = metal(P.rack, { roughness: 0.45 });
  box(rack, RACK.w, RACK.h, 0.04, frameM, 0, 0, -RACK.d / 2, 0.01);
  [-1, 1].forEach(s => box(rack, 0.04, RACK.h, RACK.d, frameM, s * (RACK.w / 2 - 0.02), 0, 0, 0.01));
  box(rack, RACK.w, 0.05, RACK.d, frameM, 0, RACK.h - 0.05, 0, 0.01); box(rack, RACK.w, 0.05, RACK.d, frameM, 0, 0, 0, 0.01);
  /* the switch at the top, the power shelf at the bottom */
  box(rack, 0.52, 0.09, 1.0, mat(P.dark), 0, 1.86, 0, 0.01);
  for (let k = 0; k < 16; k++) box(rack, 0.018, 0.012, 0.02, glow(rnd(k, 9) > 0.4 ? P.accent : P.good, 1.3), -0.2 + k * 0.027, 1.92, 0.5, 0.002, { cast: false });
  box(rack, 0.52, 0.18, 1.0, mat(P.slate), 0, 0.08, 0, 0.01);
  for (let k = 0; k < 4; k++) box(rack, 0.11, 0.12, 0.02, mat(P.warm, { roughness: 0.5 }), -0.18 + k * 0.12, 0.11, 0.5, 0.005);
  /* coolant: blue in, orange out, up the back */
  [[-0.24, P.accent], [0.24, P.warm]].forEach(([x, col]) => cyl(rack, 0.018, 0.018, 1.9, metal(col, { metalness: 0.4, roughness: 0.4 }), x, 0.1, -0.52, 10));
  /* the trays: one is ours */
  const TRAY = { w: 0.5, h: 0.085, d: 1.0 }, OURS = 4;
  const trays = [];
  for (let i = 0; i < 8; i++) {
    const y = 0.32 + i * 0.185, tr = group(rack, 0, y, 0);
    box(tr, TRAY.w, 0.012, TRAY.d, metal(P.slate, { roughness: 0.5 }), 0, 0, 0, 0.004);
    [-1, 1].forEach(s => box(tr, 0.008, TRAY.h, TRAY.d, metal(P.slate), s * TRAY.w / 2, 0, 0, 0.002));
    const face = box(tr, TRAY.w, TRAY.h, 0.012, mat(P.dark, { roughness: 0.5 }), 0, 0, TRAY.d / 2, 0.003);
    for (let k = 0; k < 6; k++) box(tr, 0.05, 0.05, 0.004, mat(0x10141b), -0.2 + k * 0.065, 0.017, TRAY.d / 2 + 0.006, 0.002, { cast: false });
    box(tr, 0.012, 0.012, 0.004, glow(i === OURS ? P.accent : P.good, 1.6), 0.215, 0.04, TRAY.d / 2 + 0.007, 0.002, { cast: false });
    trays.push(tr);
    /* every other tray is closed: a lid */
    if (i !== OURS) box(tr, TRAY.w, 0.006, TRAY.d, metal(P.slate, { roughness: 0.55 }), 0, TRAY.h - 0.006, 0, 0.002);
  }
  /* the door: glass in a frame, hinged on the left */
  const doorPivot = group(rack, -RACK.w / 2, 0, RACK.d / 2 + 0.01);
  const doorGlass = glass(P.dark, { opacity: night ? 0.55 : 0.4 }), doorM = fader(doorGlass, 1.95, 2.35);
  fades[fades.length - 1].max = doorGlass.opacity;
  box(doorPivot, RACK.w, RACK.h, 0.02, doorM, RACK.w / 2, 0, 0, 0.01, { cast: false });
  box(doorPivot, 0.025, 0.3, 0.025, fader(metal(P.metal), 1.95, 2.35), RACK.w - 0.05, 0.9, 0.02, 0.01);

  /* ---- inside our tray: fans at the front, the board, the accelerator under its heat sink, power stages, memory, connectors ---- */
  const tray = trays[OURS];
  const lid = box(tray, TRAY.w, 0.006, TRAY.d, fader(metal(P.slate, { roughness: 0.55 }), 2.55, 2.95), 0, TRAY.h - 0.006, 0, 0.002);
  for (let k = 0; k < 6; k++) { const f = cyl(tray, 0.033, 0.033, 0.03, mat(P.dark), -0.2 + k * 0.08, 0.012, 0.42, 16); f.rotation.x = Math.PI / 2; f.position.y = 0.045; spins.push({ rotation: f.rotation, axis: 'y', f }); }
  const pcb = box(tray, 0.44, 0.004, 0.62, mat(P.board, { roughness: 0.6 }), 0, 0.012, 0.02, 0.002);
  /* the package sits at the board's centre: x 0, z 0.02 in the tray; in the scene, z = 1.32 once the tray is out */
  const pkg = group(tray, 0, 0.016, 0.02);
  box(pkg, 0.075, 0.003, 0.075, mat(0x2b3a2f, { roughness: 0.5 }), 0, 0, 0, 0.001);
  box(pkg, 0.058, 0.0012, 0.05, mat(0x55606e, { roughness: 0.4, metalness: 0.3 }), 0, 0.003, 0, 0.0004);
  const dieM = new THREE.MeshStandardMaterial({ map: dieTexture(P), roughness: 0.25, metalness: 0.35, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 });
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.0008, 0.03), [mat(0x2a2f38), mat(0x2a2f38), dieM, mat(0x2a2f38), mat(0x2a2f38), mat(0x2a2f38)]);
  die.position.set(-0.004, 0.0046, 0); die.castShadow = true; pkg.add(die);
  for (let k = 0; k < 4; k++) { const s = group(pkg, 0.0175, 0.0042, -0.0135 + k * 0.009); for (let l = 0; l < 8; l++) box(s, 0.011, 0.00025, 0.0075, mat(l % 2 ? 0x3a4250 : 0x6b7586, { metalness: 0.4, roughness: 0.4 }), 0, l * 0.00026, 0, 0.0001, { cast: false }); }
  const ihs = box(pkg, 0.066, 0.004, 0.062, fader(metal(0xb8bec6, { roughness: 0.25 }), 4.35, 4.8), 0, 0.0055, 0, 0.002);
  /* the heat sink: a block of fins; it lifts away as you come close to the board */
  const sink = group(pkg, 0, 0.0095, 0); const sinkM = fader(metal(0xc9ced6, { roughness: 0.3 }), 3.35, 3.85);
  box(sink, 0.11, 0.006, 0.11, sinkM, 0, 0, 0, 0.002);
  for (let k = 0; k < 20; k++) box(sink, 0.0014, 0.05, 0.11, sinkM, -0.052 + k * 0.0055, 0.006, 0, 0.0005);
  /* power stages round the package, memory to its sides, connectors at the back */
  for (let k = 0; k < 10; k++) box(tray, 0.012, 0.006, 0.012, mat(P.dark), -0.075 + k * 0.016, 0.016, 0.11, 0.002);
  for (let k = 0; k < 10; k++) box(tray, 0.012, 0.006, 0.012, mat(P.dark), -0.075 + k * 0.016, 0.016, -0.07, 0.002);
  [-0.17, 0.17].forEach(x => { for (let k = 0; k < 4; k++) box(tray, 0.008, 0.035, 0.13, mat(0x1d3d2c), x + (k - 1.5) * 0.014, 0.016, 0.02, 0.002); });
  [-0.12, 0, 0.12].forEach(x => box(tray, 0.08, 0.03, 0.04, mat(P.slate), x, 0.016, -0.44, 0.004));

  /* ---- names on the picture, each at the levels where it belongs ---- */
  const W3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const NAMES = [
    ['halls', scene, W3(34, 7.5, -4), [0, 0.6]], ['cooling', scene, W3(hx, HALL.h + 2.4, HALL.z0 + 5), [0, 0.5]], ['substation', scene, W3(-30, 5, -8), [0, 0.6]],
    ['racks', scene, W3(-3.5, 2.4, -6.2), [0.6, 1.6]], ['hotaisle', scene, W3(3.5, 2.3, -7.7), [0.6, 1.6]], ['trays', scene, W3(-3.6, 3.05, -12.6), [0.6, 1.5]], ['coldair', scene, W3(-3, 0.4, 1.6), [1.3, 2.3]],
    ['switch', rack, W3(0.3, 1.98, 0.5), [1.6, 2.5]], ['servers', rack, W3(0.32, 1.3, 0.5), [1.6, 2.4]], ['power', rack, W3(0.3, 0.3, 0.5), [1.6, 2.5]],
    ['fans', tray, W3(0.21, 0.09, 0.42), [2.6, 3.5]], ['accelerator', tray, W3(0.0, 0.08, 0.02), [2.7, 3.4]], ['memory', tray, W3(-0.17, 0.06, 0.1), [2.7, 3.5]], ['network', tray, W3(0.12, 0.05, -0.44), [2.7, 3.4]],
    ['package', pkg, W3(0.038, 0.012, 0.03), [3.7, 4.5]], ['powerstages', tray, W3(0.06, 0.03, 0.11), [3.7, 4.4]],
    ['die', pkg, W3(-0.004, 0.006, -0.012), [4.6, 5.1]], ['hbm', pkg, W3(0.0175, 0.0065, 0.018), [4.6, 5.1]]
  ];
  const named = NAMES.map(([id, obj, at, lv]) => { const lb = L.add(obj, at, t('part.' + VIEW_PARTS.flight[id]), { cls: 'part3' }); lb.lv = lv; return lb; });

  /* ---- the camera along the path ---- */
  let z = 0, goal = 0, raf = 0, running = true, W = 1, H = 1, last = performance.now();
  const lerp = (a, b, k) => a + (b - a) * k;
  const keyAt = zz => {
    const i = Math.max(0, Math.min(KEYS.length - 2, Math.floor(zz))), k = ease(clamp(zz - i)), A = KEYS[i], B = KEYS[i + 1];
    return { look: A.look.map((v, j) => lerp(v, B.look[j], k)), dist: Math.exp(lerp(Math.log(A.dist), Math.log(B.dist), k)), yaw: lerp(A.yaw, B.yaw, k), pitch: lerp(A.pitch, B.pitch, k) };
  };
  const pose = () => {
    const K = keyAt(z), c = Math.cos(K.pitch);
    camera.position.set(K.look[0] + Math.sin(K.yaw) * c * K.dist, K.look[1] + Math.sin(K.pitch) * K.dist, K.look[2] + Math.cos(K.yaw) * c * K.dist);
    camera.lookAt(K.look[0], K.look[1], K.look[2]);
    camera.near = Math.max(0.002, K.dist * 0.04); camera.far = Math.max(60, K.dist * 30 + 400); camera.updateProjectionMatrix();
    /* the sun's shadows cover what is in view */
    const s = sun.shadow.camera, span = Math.max(0.4, K.dist * 1.4);
    Object.assign(s, { left: -span, right: span, top: span, bottom: -span, near: 0.01, far: span * 8 }); s.updateProjectionMatrix();
    sun.position.set(K.look[0] - span * 1.2, K.look[1] + span * 2.2, K.look[2] + span * 1.4); sun.target.position.set(...K.look);
    sun.shadow.bias = -0.0002 * Math.min(1, span / 10);
  };
  /* what opens with depth */
  const states = () => {
    fades.forEach(f => { const k = smooth(f.a, f.b, z), o = (f.out ? 1 - k : k) * (f.max != null ? f.max : 1); f.m.opacity = o; f.m.visible = o > 0.01; f.m.depthWrite = o > 0.6 && f.max == null; });
    doorPivot.rotation.y = -smooth(1.45, 2.0, z) * 1.9;
    tray.position.z = smooth(2.2, 2.75, z) * 0.75;
    sink.position.y = 0.0095 + smooth(3.35, 3.85, z) * 0.06;
    dieM.emissiveIntensity = 0;
    front.visible = true;
    named.forEach(lb => { lb.show = z >= lb.lv[0] && z <= lb.lv[1]; });
  };

  /* ---- input: scroll, drag or keys move along the path; on.level tells the shell where you are ---- */
  const go = v => { goal = clamp(v, 0, LEVELS.length - 1); };
  let drag = null;
  canvas.addEventListener('wheel', e => { e.preventDefault(); go(goal + e.deltaY * 0.0016); }, { passive: false });
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); drag = { y: e.clientY, g: goal }; });
  canvas.addEventListener('pointermove', e => { if (drag) go(drag.g + (drag.y - e.clientY) * 0.006); });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'PageDown') { go(Math.floor(goal + 1)); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { go(Math.ceil(goal - 1)); e.preventDefault(); } });
  let settle = 0, lastLevel = -1;

  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; H = r.height; st.size(W, H); camera.aspect = W / Math.max(1, H); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000), tm = now / 1000; last = now;
    /* after a pause in scrolling, come to rest at the nearest level */
    if (!drag && Math.abs(goal - z) < 0.002) { settle += dt; if (settle > 0.6 && Math.abs(goal - Math.round(goal)) > 0.001) goal = Math.round(goal); } else settle = 0;
    z += (goal - z) * (reduced() ? 1 : Math.min(1, dt * 4.5));
    pose(); states();
    if (!reduced()) {
      spins.forEach(s => { if (s.f) s.f.rotation.y += dt * 18; else s.rotation.y += dt * 3; });
      cold.forEach(m => { const u = (tm * 0.25 + m.userData.k) % 1; m.position.set(m.userData.x, u * 1.6, m.userData.z); m.material.opacity = 0.5 * Math.sin(u * Math.PI) * (1 - smooth(2.3, 2.8, z)); });
    }
    const lv = Math.round(z); if (lv !== lastLevel) { lastLevel = lv; on.level && on.level(lv); }
    on.depth && on.depth(z);
    st.draw(scene, camera);
    L.update(camera, W, H);
  };
  raf = requestAnimationFrame(frame);
  return {
    go(v) { go(v); },
    get z() { return z; },
    pause() { running = false; cancelAnimationFrame(raf); },
    warm: () => st.warm(scene, camera),
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    dispose() { running = false; cancelAnimationFrame(raf); L.clear(); }
  };
}
