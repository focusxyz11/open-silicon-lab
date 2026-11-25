/* The data centre, as one continuous flight: from the campus outside, through the opened roof into the hall,
   down to one rack, the server tray that slides out of it, the board inside, and the chip on the board.
   One scene at true scale, in metres, with the followed chip near the origin so that the closest views stay
   steady. The camera moves along a single path (depth z from 0 to 5, one step per level); everything that
   opens (the roof, the rack door, the tray, its lid, the heat sink, the chip's lid) opens as a function of z,
   so nothing appears from nowhere. Words: place.dc.<level>.t / .d; the parts' names come from their one home in the atlas (src/data/atlas.js). */
import { VIEW_PARTS } from '../data/atlas.js';
import { THREE, PALETTES, CHIP_TONES, theme, stage, light, mat, metal, glow, glass, box, cyl, group, labels, clamp, smooth, ease, reduced, rnd } from './kit3d.js';
import { SLAB, METRES, PADS, padsOf, coreGrid, tileOf, CACHE, CACHE_FIELDS, CACHE_BITS, bitsOf, IO, IO_BLOCKS, CLOCK, split, STACKS, STACK_LAYERS, BASE, PACKAGE } from '../data/die.js';
import { model, START } from '../engines/chip.js';
import { t } from '../core/i18n.js';
import { DC_LEVELS as LEVELS, DC_ASKS as ASKS } from '../data/views3d.js';

/* the levels, and the question asked at each: plain data, kept in src/data/views3d.js */
export { LEVELS, ASKS };

/* a point of the dive's plan of the chip (src/data/die.js), in metres on the package, and at a height */
const onPkg = (x, y) => [(x - PACKAGE.at[0]) * METRES, (y - PACKAGE.at[1]) * METRES];
const onTop = (x, y, h) => { const [a, b] = onPkg(x, y); return [a, h, b]; };
/* where the camera looks at each level: the point, the distance to it, the turn and the tilt */
const KEYS = [
  { look: [8, 2, -6], dist: 120, yaw: -0.62, pitch: 0.6 },
  { look: [0, 0.8, -4.5], dist: 22, yaw: -0.4, pitch: 0.82 },
  { look: [0, 1.15, 0.6], dist: 3.4, yaw: -0.22, pitch: 0.14 },
  { look: [0, 1.08, 0.82], dist: 1.0, yaw: -0.32, pitch: 0.8 },
  { look: [0, 1.082, 0.77], dist: 0.24, yaw: -0.2, pitch: 1.0 },
  { look: [0, 1.081, 0.77], dist: 0.052, yaw: -0.12, pitch: 1.12 }
];
const FOV = 38, FIT = 0.95;
/* where the flight ends, for the dive's chip level to start from (src/v2/relief3d.js): the camera's turn and tilt, the
   point of the plan it looks at (the middle of the package: the die and its stacks), and how much of the plan's units
   it sees from top to bottom, on a screen at least fit as wide as it is tall (narrower, it stands back by as much) */
export const HANDOFF = { turn: KEYS[5].yaw, tilt: KEYS[5].pitch, at: PACKAGE.at, span: 2 * KEYS[5].dist * Math.tan(FOV * Math.PI / 360) / METRES, fit: FIT };

/* the die, as the dive's chip level has it (src/data/die.js, in the relief's tones), so the chip you land on is the
   chip you saw: copies of one compute tile, a band of memory, the links to the outside, the clock wires, the pads */
function dieTexture(night) {
  const T = CHIP_TONES[night ? 'dark' : 'light'], hex = n => '#' + n.toString(16).padStart(6, '0');
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  const k = 1024 / SLAB[2], R = (r, col) => { g.fillStyle = hex(col); g.fillRect((r[0] - SLAB[0]) * k, (r[1] - SLAB[1]) * k, r[2] * k, r[3] * k); };
  /* a district stands a little proud of the slab: a shade on its far edges, light on its near ones */
  const shade = (r, d, a) => { g.globalAlpha = a; R([r[0] + d, r[1] + d, r[2], r[3]], 0x000000); g.globalAlpha = 1; };
  const proud = (r, col) => { shade(r, 3, 0.35); R(r, col); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect((r[0] - SLAB[0]) * k, (r[1] - SLAB[1]) * k, r[2] * k, 2); };
  R(SLAB, T.slab);
  padsOf(PADS).forEach(r => shade(r, 3, 0.35));
  padsOf(PADS).forEach(r => R(r, T.pad));
  /* the tiles of the chip the dive shows: the starting chip's (src/app/scenes.js draws the same) */
  const tiles = coreGrid(...model(START).grid).map(x => x.r);
  tiles.forEach(r => { shade(r, 4, 0.4); R(r, T.tile); const { logic, own } = tileOf(r); proud(logic, T.top); R(own, T.bit); });
  split(CACHE, CACHE_FIELDS).forEach(r => { R(r, T.field); bitsOf(r, ...CACHE_BITS).forEach(b => R(b, T.bit)); });
  split(IO, IO_BLOCKS).forEach(r => proud(r, T.tile));
  CLOCK.forEach(p => { for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i]; R([Math.min(a[0], b[0]) - 5, Math.min(a[1], b[1]) - 5, Math.abs(b[0] - a[0]) + 10, Math.abs(b[1] - a[1]) + 10], T.cu); } });
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
  const P = PALETTES[theme()], night = P.emissive > 0, CT = CHIP_TONES[night ? 'dark' : 'light'];
  const st = stage(canvas), { env } = st;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.sky); scene.fog = new THREE.Fog(P.fog, 260, 700); scene.environment = env; scene.environmentIntensity = night ? 0.35 : 0.5;
  const { sun } = light(scene, P, 60);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 2000);
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
  /* the package sits at the board's centre: x 0, z 0.02 in the tray; in the scene, z = 1.32 once the tray is out. On it,
     the base (the interposer), the die and the four memory stacks beside it, placed as the dive's plan has them */
  const pkg = group(tray, 0, 0.016, 0.02);
  const Sz = r => [r[2] * METRES, r[3] * METRES], mid = r => onPkg(r[0] + r[2] / 2, r[1] + r[3] / 2);
  box(pkg, PACKAGE.side * METRES, 0.003, PACKAGE.side * METRES, mat(CT.pkg, { roughness: 0.5 }), 0, 0, 0, 0.001);
  const [bw, bd] = Sz(BASE), [bx, bz] = mid(BASE);
  box(pkg, bw, 0.0012, bd, mat(CT.base, { roughness: 0.4, metalness: 0.3 }), bx, 0.003, bz, 0.0004);
  const dieM = new THREE.MeshStandardMaterial({ map: dieTexture(night), roughness: 0.45, metalness: 0.15, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 });
  const edgeM = mat(CT.slab);
  const [dw, dd] = Sz(SLAB), [dx, dz] = mid(SLAB);
  const die = new THREE.Mesh(new THREE.BoxGeometry(dw, 0.0008, dd), [edgeM, edgeM, dieM, edgeM, edgeM, edgeM]);
  die.position.set(dx, 0.0046, dz); die.castShadow = true; pkg.add(die);
  STACKS.forEach(r => { const [x, z] = mid(r), [w, d] = Sz(r), s = group(pkg, x, 0.0042, z); for (let l = 0; l < STACK_LAYERS; l++) box(s, w, 0.00025, d, mat(CT.stack[l % 2], { metalness: 0.4, roughness: 0.4 }), 0, l * 0.00026, 0, 0.0001, { cast: false }); });
  const ihs = box(pkg, 0.048, 0.004, 0.045, fader(metal(0xb8bec6, { roughness: 0.25 }), 4.35, 4.8), 0, 0.0055, 0, 0.002);
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
    ['package', pkg, W3(0.028, 0.012, 0.022), [3.7, 4.5]], ['powerstages', tray, W3(-0.011, 0.024, -0.07), [3.7, 4.4]], ['lid', pkg, W3(-0.01, 0.0076, -0.01), [3.7, 4.4]],
    ['die', pkg, W3(...onTop(300, 60, 0.006)), [4.6, 5.1]], ['hbm', pkg, W3(...onTop(1125, 820, 0.0065)), [4.6, 5.1]], ['base', pkg, W3(...onTop(60, 985, 0.0043)), [4.6, 5.1]]
  ];
  const named = NAMES.map(([id, obj, at, lv]) => { const lb = L.add(obj, at, t('part.' + VIEW_PARTS.flight[id]), { cls: 'part3', data: { word: VIEW_PARTS.flight[id] } }); lb.lv = lv; return lb; });
  named.forEach((lb, i) => { lb.id = lb.el.dataset.hl = NAMES[i][0]; });
  /* the way in at each level: the thing you would enter next, where the shell's button stands with a ring on it */
  /* at the server, the ring stands on the board beside the accelerator, never on its name: finding that chip is the
     level's search (src/data/seek.js) */
  const INTO = [[scene, W3(0, HALL.h, -4.5)], [rack, W3(0, 1.2, 0.45)], [rack, W3(0.02, 1.0, 0.5)], [tray, W3(0.1, 0.016, 0.17)], [pkg, W3(0, 0.012, 0)], [pkg, W3(...onTop(500, 150, 0.006))]];
  const pv = new THREE.Vector3();
  const portal = () => {
    const lv = Math.round(z), T = INTO[lv]; if (!T || Math.abs(z - lv) > 0.08 || drag) return on.portal && on.portal(null);
    T[0].updateWorldMatrix(true, false); pv.copy(T[1]).applyMatrix4(T[0].matrixWorld).project(camera);
    on.portal && on.portal(pv.z < 1 ? { x: (pv.x + 1) / 2, y: (1 - pv.y) / 2 } : null);
  };

  /* ---- the camera along the path ---- */
  let z = 0, goal = 0, raf = 0, running = true, W = 1, H = 1, last = performance.now();
  const lerp = (a, b, k) => a + (b - a) * k;
  const keyAt = zz => {
    const i = Math.max(0, Math.min(KEYS.length - 2, Math.floor(zz))), k = ease(clamp(zz - i)), A = KEYS[i], B = KEYS[i + 1];
    return { look: A.look.map((v, j) => lerp(v, B.look[j], k)), dist: Math.exp(lerp(Math.log(A.dist), Math.log(B.dist), k)), yaw: lerp(A.yaw, B.yaw, k), pitch: lerp(A.pitch, B.pitch, k) };
  };
  const pose = () => {
    const K = keyAt(z), c = Math.cos(K.pitch);
    /* at the chip, a narrow screen (a phone) stands back until the die and its stacks fit across it */
    K.dist *= 1 + (Math.max(1, FIT / camera.aspect) - 1) * smooth(4, 5, z);
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
  /* aim: the level asked for by address, said (on.level) from the start of the move there, not the ones passed on the
     way; any move of your own drops it */
  let aim = null;
  const go = v => { aim = null; goal = clamp(v, 0, LEVELS.length - 1); };
  let drag = null;
  /* past the chip, the flight carries on into it: a scroll that keeps pushing at the last level, or ↓ there, goes inside */
  const END = LEVELS.length - 1; let push = 0;
  const atEnd = () => goal >= END - 1e-6 && Math.abs(z - END) < 0.06;
  canvas.addEventListener('wheel', e => { e.preventDefault();
    if (e.deltaY > 0 && atEnd()) { push += e.deltaY; if (push > 260) { push = 0; on.beyond && on.beyond(); } return; }
    push = 0; go(goal + e.deltaY * 0.0016); }, { passive: false });
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); drag = { y: e.clientY, x: e.clientX, g: goal, t: performance.now(), touch: e.pointerType === 'touch' }; });
  canvas.addEventListener('pointermove', e => { if (drag) go(drag.g + (drag.y - e.clientY) * 0.006); });
  /* on a touch screen, a quick swipe up or down moves one whole level in or out; up at the chip goes inside it */
  const end = e => { const d = drag; drag = null; if (!d || !d.touch || e.type !== 'pointerup') return;
    const dy = e.clientY - d.y, dx = e.clientX - d.x; if (performance.now() - d.t > 450 || Math.abs(dy) < 36 || Math.abs(dy) < 1.5 * Math.abs(dx)) return;
    const from = Math.round(d.g); if (dy < 0 && from >= END) { go(END); on.beyond && on.beyond(); return; } go(from + (dy < 0 ? 1 : -1)); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'PageDown') { if (atEnd()) on.beyond && on.beyond(); else go(Math.floor(goal + 1)); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { go(Math.ceil(goal - 1)); e.preventDefault(); } });
  let settle = 0, lastLevel = -1;

  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; H = r.height; st.size(W, H); camera.aspect = W / Math.max(1, H); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const real = Math.max(0, now - last) / 1000, dt = Math.min(0.05, real), tm = now / 1000; last = now;
    /* after a pause in scrolling, come to rest at the nearest level */
    if (!drag && Math.abs(goal - z) < 0.002) { settle += dt; if (settle > 0.6 && Math.abs(goal - Math.round(goal)) > 0.001) goal = Math.round(goal); } else settle = 0;
    /* eased in time, not in frames: on a slow device each frame goes further, so a move takes as long */
    z += (goal - z) * (reduced() ? 1 : 1 - Math.exp(-Math.min(0.5, real) * 4.5));
    pose(); states();
    if (!reduced()) {
      spins.forEach(s => { if (s.f) s.f.rotation.y += dt * 18; else s.rotation.y += dt * 3; });
      cold.forEach(m => { const u = (tm * 0.25 + m.userData.k) % 1; m.position.set(m.userData.x, u * 1.6, m.userData.z); m.material.opacity = 0.5 * Math.sin(u * Math.PI) * (1 - smooth(2.3, 2.8, z)); });
    }
    if (aim != null && Math.abs(z - aim) < 0.5) aim = null;
    const lv = aim != null ? aim : Math.round(z); if (lv !== lastLevel) { lastLevel = lv; on.level && on.level(lv); }
    on.depth && on.depth(z);
    st.draw(scene, camera);
    L.update(camera, W, H);
    portal();
  };
  raf = requestAnimationFrame(frame);
  return {
    /* asked: the move is to a level asked for by address, which is said from the start */
    go(v, asked) { go(v); if (asked) aim = Math.round(goal); },
    /* a level arrived at from elsewhere (a link, a reload): the flight starts there, with nothing passed on the way */
    jump(v) { go(v); z = goal; },
    get z() { return z; },
    /* the parts named at a level (ids of src/data/atlas.js VIEW_PARTS.flight), and one of them lit on the picture */
    parts: lv => named.filter(lb => lv >= lb.lv[0] - 0.01 && lv <= lb.lv[1] + 0.01).map(lb => lb.id),
    mark(id) { named.forEach(lb => lb.el.classList.toggle('hl', lb.id === id)); },
    pause() { running = false; cancelAnimationFrame(raf); },
    warm: () => st.warm(scene, camera),
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    dispose() { running = false; cancelAnimationFrame(raf); L.clear(); }
  };
}
