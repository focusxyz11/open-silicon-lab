/* A car, as one continuous flight (as the data centre is, src/v2/dc3d.js, and a phone, src/v2/phone3d-flight.js):
   from an electric car on its road, into it as its roof and near side are cut away (the floor is the battery, the
   motor sits at the back wheels, control units everywhere joined by the wiring), down to the one control unit in the
   driver's footwell whose lid lifts off and is laid beside it, onto its board, and onto the small chip that decides
   as its black package clears, to the die. One scene at true scale, in metres, with the car at the origin (front
   towards +x, the near side towards +z); the camera moves along a single path (depth z from 0 to 3, one step per
   level), and everything that opens (the cut through the body, the lid, the chip's package) opens as a function of
   z, so nothing appears from nowhere. The car is laid out as the dive draws it (src/app/scenes.js 'car', measured in
   centimetres), the control unit as the dive's (scenes.js 'ecu', src/v2/pcb3d.js) and the die from the plan the dive's
   car chip has (scenes.js 'mcu', drawn in 3D by src/v2/relief3d.js), so what you land on is what you saw; HANDOFF tells
   the dive where the flight ended. Words: place.car.<level>.t / .d; the parts' names come from their one home in the
   atlas (VIEW_PARTS.car in src/data/atlas.js). */
import { VIEW_PARTS } from '../data/atlas.js';
import { THREE, PALETTES, CHIP_TONES, BOARD, theme, stage, light, mat, metal, box, cyl, group, labels, clamp, smooth, ease, reduced, rnd } from './kit3d.js';
import { padsOf, tileOf, split, bitsOf } from '../data/die.js';
import { partsOf } from '../app/scenes.js';
import { DEPTHS } from '../data/weave.js';
import { t } from '../core/i18n.js';

export const LEVELS = ['car', 'inside', 'unit', 'chip'];
/* the question asked at each level: a stop of one thread (stop.<key>.q) */
export const ASKS = { car: 'life.car', inside: 'divide.car', unit: 'fail.ecu', chip: 'think.mcu' };
/* the depth of the dive each level shows (its card's Do and Ask), how big each is (src/data/atlas.js sizeOf), and
   where the flight carries on: the dive's car chip */
export const DEPTH = { car: 'car', inside: 'car', unit: 'ecu', chip: 'mcu' };
export const SIZE = { car: 'car', inside: 'cabin', unit: 'ecu', chip: 'mcu' };
export const BEYOND = '#/dive/mcu/car';

/* the dive's car plan, in centimetres (x from the back, y from the near side, z up), as metres in the scene */
const C = (x, y, z) => [(x - 231) / 100, z / 100, (90 - y) / 100];
/* the floor (the battery's top), and the control unit the dive follows: its middle on the footwell's floor */
const FLOOR = 0.345, E = [0.7, FLOOR + 0.012, 0.6];
/* the control unit's plan (1000 units across, as the dive's level has it) in metres; the chip's middle on it */
const UE = DEPTHS.ecu.m / 1000, BT = 0.0086;
const onUnit = (px, py, h = 0) => [E[0] + (px - 500) * UE, E[1] + h, E[2] + (py - 500) * UE];
const MCU = onUnit(475, 445);
/* the die's plan (1000 units a side) in metres, at the dive's own scale */
const UNIT = DEPTHS.mcu.m / 1000, DIE_Y = E[1] + BT + 0.0009;
const onDie = (x, y, h = DIE_Y) => [MCU[0] + (x - 500) * UNIT, h, MCU[2] + (y - 500) * UNIT];
/* where the camera looks at each level: the point, the distance to it, the turn and the tilt */
const KEYS = [
  { look: [0.15, 0.62, 0.1], dist: 8.6, yaw: 0.78, pitch: 0.34 },
  { look: [0.0, 0.45, 0.02], dist: 7.0, yaw: 0.6, pitch: 0.95 },
  { look: [E[0] - 0.004, E[1] + 0.012, E[2] + 0.004], dist: 0.34, yaw: 0.3, pitch: 1.0 },
  { look: [MCU[0], DIE_Y, MCU[2]], dist: 0.0135, yaw: -0.1, pitch: 1.2 }
];
const FOV = 38, FIT = 0.95, END = KEYS.length - 1;
/* how wide a screen each level needs, as a share of its height, before the camera stands back */
const WIDE = [1.1, 1.2, 0.95, FIT];
/* where the flight ends, for the dive's car chip to start from (src/v2/relief3d.js): the camera's turn and tilt, the
   point of the plan it looks at, how much of the plan's units it sees from top to bottom, and how wide a screen must be */
export const HANDOFF = { turn: KEYS[END].yaw, tilt: KEYS[END].pitch, at: [500, 500], span: 2 * KEYS[END].dist * Math.tan(FOV * Math.PI / 360) / UNIT, fit: FIT };

const v2 = (x, y) => new THREE.Vector2(x, y);
/* the body's side, in centimetres: the bottom with its two wheel arches, the nose, the bonnet, the line under the
   windows, the tail. Its edges are rounded by the extrusion's bevel (b), which also grows it by b all round */
function bodyShape(b) {
  const s = new THREE.Shape(), R = 40 + b, ZC = 34, B = 24, h = Math.sqrt(R * R - (ZC - B) ** 2), a = Math.asin((ZC - B) / R);
  s.moveTo(18, B);
  [85, 378].forEach(x => { s.lineTo(x - h, B); s.absarc(x, ZC, R, Math.PI + a, -a, true); });
  s.lineTo(440, B);
  s.splineThru([v2(450, 29), v2(456, 42), v2(457, 58), v2(453, 72), v2(442, 83), v2(424, 90)]);
  s.splineThru([v2(392, 96), v2(358, 100)]);
  s.lineTo(80, 104);
  s.splineThru([v2(50, 102), v2(28, 96), v2(14, 86), v2(8, 72), v2(6, 56), v2(9, 40), v2(13, 30), v2(18, B)]);
  return s;
}
/* the glass over it, drawn smaller by its bevel (the roof and the windows' curve) and reaching down inside the body */
function glassShape() {
  const s = new THREE.Shape(); s.moveTo(336, 82); s.lineTo(338, 96);
  s.splineThru([v2(318, 110), v2(290, 121), v2(250, 126), v2(190, 126), v2(140, 121), v2(112, 111), v2(96, 98)]);
  s.lineTo(96, 82); s.lineTo(336, 82); return s;
}
/* a side shape extruded across the car's width, centred, in metres; its normals made smooth over the curves (the flat
   sides keep theirs) */
function across(shape, width, bt, bs, segs) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: width - 2 * bt, bevelEnabled: true, bevelSize: bs, bevelThickness: bt, bevelSegments: segs, curveSegments: 20 });
  g.translate(-231, 0, -(width - 2 * bt) / 2); g.scale(0.01, 0.01, 0.01);
  return smoothed(g);
}
function smoothed(g) {
  const p = g.attributes.position, n = p.count, key = i => Math.round(p.getX(i) * 2e4) + ',' + Math.round(p.getY(i) * 2e4) + ',' + Math.round(p.getZ(i) * 2e4);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), fn = [], acc = new Map();
  for (let f = 0; f < n; f += 3) {
    A.fromBufferAttribute(p, f); B.fromBufferAttribute(p, f + 1); Cc.fromBufferAttribute(p, f + 2);
    const nn = B.clone().sub(A).cross(Cc.clone().sub(A)); fn.push(nn.clone().normalize());
    if (Math.abs(fn[fn.length - 1].z) > 0.999) continue;          /* a flat side keeps its own normal */
    for (let k = 0; k < 3; k++) { const id = key(f + k); if (!acc.has(id)) acc.set(id, []); acc.get(id).push(nn); }
  }
  const out = new Float32Array(n * 3), tmp = new THREE.Vector3();
  for (let f = 0; f < n; f += 3) {
    const own = fn[f / 3];
    for (let k = 0; k < 3; k++) {
      if (Math.abs(own.z) > 0.999) tmp.copy(own);
      else { tmp.set(0, 0, 0); (acc.get(key(f + k)) || []).forEach(v => { if (v.clone().normalize().dot(own) > 0.6) tmp.add(v); }); if (tmp.lengthSq() < 1e-20) tmp.copy(own); tmp.normalize(); }
      out[(f + k) * 3] = tmp.x; out[(f + k) * 3 + 1] = tmp.y; out[(f + k) * 3 + 2] = tmp.z;
    }
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3)); return g;
}

/* the die, as the dive's car chip has it (src/app/scenes.js 'mcu', drawn in 3D by src/v2/relief3d.js), from above:
   the two cores in step, the flash that keeps the program, the working memory, its senses and links, the parts that
   keep it steady, and the bus between them */
function dieTexture(night) {
  const T = CHIP_TONES[night ? 'dark' : 'light'], hex = v => '#' + v.toString(16).padStart(6, '0'), S = [40, 40, 920, 920];
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  const k = 1024 / S[2], R = (r, col) => { g.fillStyle = hex(col); g.fillRect((r[0] - S[0]) * k, (r[1] - S[1]) * k, r[2] * k, r[3] * k); };
  const shade = (r, d, a) => { g.globalAlpha = a; R([r[0] + d, r[1] + d, r[2], r[3]], 0x000000); g.globalAlpha = 1; };
  const proud = (r, col) => { shade(r, 3, 0.35); R(r, col); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect((r[0] - S[0]) * k, (r[1] - S[1]) * k, r[2] * k, 2); };
  const P = partsOf('mcu');
  R(S, T.slab);
  padsOf(14).forEach(r => { shade(r, 3, 0.35); R(r, T.pad); });
  P.cores.map(x => x.r).forEach(r => { shade(r, 4, 0.4); R(r, T.tile); const { logic, own } = tileOf(r); proud(logic, T.top); R(own, T.bit); });
  [[P.flash[0].r, 16, 18], [P.sram[0].r, 15, 5]].forEach(([r, nx, ny]) => { shade(r, 3, 0.3); R(r, T.field); bitsOf(r, nx, ny).forEach(b => R(b, T.bit)); });
  P.periph.map(x => x.r).concat([[130, 750, 740, 120]]).forEach((r, n) => { shade(r, 3, 0.3); R(r, T.field); split(r, 3 + (n % 2), 2, 10).forEach((q, j) => { if (rnd(n * 7 + j, 3) > 0.25) proud(q, T.tile); }); });
  R([125, 565, 750, 10], T.cu); [205, 375, 470, 680].forEach(x => R([x - 5, 550, 10, 40], T.cu));
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}

export function createCarFlight(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0, K = BOARD(night), CT = CHIP_TONES[night ? 'dark' : 'light'], col = (n, d) => (night ? n : d);
  const st = stage(canvas), { env } = st;
  st.renderer.localClippingEnabled = true;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.sky); scene.fog = new THREE.Fog(P.fog, 30, 120); scene.environment = env; scene.environmentIntensity = night ? 0.45 : 0.6;
  const { sun } = light(scene, P, 1);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.001, 200);
  const L = labels(host);
  const fades = [];                                     /* [material, from z, to z] */
  const fader = (m, a, b) => { const mm = m.clone(); mm.transparent = true; fades.push({ m: mm, a, b }); return mm; };
  /* the cut through the body: the near side and the roof, coming in as you go inside (planes keep what is behind them) */
  const cutSide = new THREE.Plane(new THREE.Vector3(0, 0, -1), 5), cutTop = new THREE.Plane(new THREE.Vector3(0, -1, 0), 5), cuts = [cutSide, cutTop];
  /* the body's materials are cut; inside, the shell shows as the cabin's trim (its back faces in that colour) */
  const trimC = new THREE.Color(col(0x1f232b, 0x3b3f47));
  const cut = (o, inside) => { const m = new THREE.MeshStandardMaterial(Object.assign({ clippingPlanes: cuts, clipShadows: true, side: THREE.DoubleSide }, o));
    if (inside) { m.onBeforeCompile = sh => { sh.uniforms.trimC = { value: trimC }; sh.fragmentShader = 'uniform vec3 trimC;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = trimC;'); }; m.customProgramCacheKey = () => 'car-shell'; }
    return m; };
  const M = {
    ground: mat(P.ground, { roughness: 0.95 }), road: mat(P.road, { roughness: 0.9 }), line: mat(P.roadLine, { roughness: 0.8 }),
    paint: cut({ color: P.white, roughness: 0.3, metalness: 0.25, envMapIntensity: 1.1 }, true),
    glass: cut({ color: col(0x0b111c, 0x18222f), roughness: 0.05, metalness: 0.7 }),
    trim: cut({ color: col(0x161a21, 0x23272e), roughness: 0.55, metalness: 0.1 }),
    liner: cut({ color: 0x101318, roughness: 0.9 }),
    head: cut({ color: 0xeaf3ff, emissive: 0xdfeeff, emissiveIntensity: night ? 2.2 : 0.35, roughness: 0.2 }),
    tail: cut({ color: P.bad, emissive: P.bad, emissiveIntensity: night ? 1.8 : 0.4, roughness: 0.3 }),
    sill: mat(col(0x161a21, 0x23272e), { roughness: 0.55 }),
    tyre: mat(0x15171b, { roughness: 0.85 }), rim: metal(col(0x5d6573, 0x9aa3b0), { roughness: 0.32 }), hub: metal(col(0x2a2f38, 0x3a404a), { roughness: 0.4 }),
    seat: mat(col(0x2a2f39, 0x4a4e57), { roughness: 0.85 }), dash: mat(col(0x22262e, 0x3b3f47), { roughness: 0.7 }),
    tray: metal(col(0x3a414c, 0x6b7380), { roughness: 0.5 }), cells: mat(col(0x2c3646, 0x3e4a5c), { roughness: 0.5, metalness: 0.3 }),
    motor: metal(col(0x6c7684, 0x9aa3ae), { roughness: 0.35 }), box: metal(col(0x4f5866, 0x7d8692), { roughness: 0.4 }),
    caseM: metal(col(0x8c96a4, 0xb6bec9), { roughness: 0.3, metalness: 0.8 }),
    wire: mat(col(0xb5713e, 0xb86a35), { roughness: 0.45, metalness: 0.4 }), bundle: mat(0x1a1d22, { roughness: 0.7 }),
    led: new THREE.MeshStandardMaterial({ color: P.good, emissive: P.good, emissiveIntensity: night ? 1.6 : 0.6 }),
    live: new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: night ? 1.4 : 0.7, roughness: 0.4 }),
    screen: new THREE.MeshStandardMaterial({ color: col(0x1b2a44, 0x2a3f5e), emissive: P.glass, emissiveIntensity: night ? 0.6 : 0.25, roughness: 0.15 }),
    board: mat(K.board, { roughness: 0.7 }), trace: mat(K.trace, { roughness: 0.35, metalness: 0.8 }), pin: metal(K.pin, { roughness: 0.3, metalness: 0.9 }),
    plastic: mat(K.plastic, { roughness: 0.5 }), power: mat(K.power, { roughness: 0.4 }), can: metal(K.coil, { roughness: 0.35 }), lead: metal(col(0xa7b0bc, 0xc3cad3), { roughness: 0.3 }),
    gold: metal(0xd6aa4a, { roughness: 0.25, metalness: 1 })
  };

  /* ---- the road, and the land beside it ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), M.ground); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; scene.add(ground);
  box(scene, 400, 0.03, 7.6, M.road, 0, -0.03, -1.8, 0, { cast: false });
  box(scene, 400, 0.004, 0.12, M.line, 0, 0, 1.75, 0, { cast: false }); box(scene, 400, 0.004, 0.12, M.line, 0, 0, -5.35, 0, { cast: false });
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 0.004, 0.12), M.line, 60), o3 = new THREE.Object3D();
  for (let i = 0; i < 60; i++) { o3.position.set(-177 + i * 6, 0.002, -1.8); o3.updateMatrix(); dash.setMatrixAt(i, o3.matrix); } dash.receiveShadow = true; scene.add(dash);

  /* ---- the car: its body and glass, cut as you go in; the wheels, lights, sills ---- */
  const car = group(scene, 0, 0, 0);
  const body = new THREE.Mesh(across(bodyShape(7), 182, 9, 7, 6), M.paint); body.castShadow = body.receiveShadow = true; car.add(body);
  /* the glass reaches down inside the body; what is inside is never drawn, so the cut never shows it */
  M.glass.clippingPlanes = [...cuts, new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.0)];
  const glassM = new THREE.Mesh(across(glassShape(), 162, 22, 18, 7), M.glass); glassM.castShadow = true; car.add(glassM);
  /* where the body's surface is, found by a ray (so the lights sit on it, whatever its curves) */
  const ray = new THREE.Raycaster(), surf = (from, dir) => { ray.set(new THREE.Vector3(...from), new THREE.Vector3(...dir)); const h = ray.intersectObject(body, false)[0]; return h ? h.point : new THREE.Vector3(...from); };
  const front = surf([4, 0.78, 0], [-1, 0, 0]), rear = surf([-4, 0.86, 0], [1, 0, 0]);
  box(car, 0.05, 0.02, 1.4, M.head, front.x - 0.02, 0.78 - 0.01, 0, 0.008, { cast: false });
  [-1, 1].forEach(s => { const p = surf([4, 0.73, s * 0.62], [-1, 0, 0]); box(car, 0.04, 0.05, 0.3, M.head, p.x - 0.012, 0.705, s * 0.6, 0.02, { cast: false }); });
  box(car, 0.03, 0.035, 1.56, M.tail, rear.x + 0.008, 0.86 - 0.017, 0, 0.012, { cast: false });
  const radar = surf([4, 0.5, 0], [-1, 0, 0]); box(car, 0.03, 0.1, 0.16, M.trim, radar.x - 0.01, 0.45, 0, 0.02, { cast: false });
  box(car, 0.08, 0.06, 0.12, M.trim, 0.98, 1.24, 0, 0.02, { cast: false });               /* the camera behind the windscreen */
  [-1, 1].forEach(s => { const g = group(car, 1.18, 0.98, s * 0.9); box(g, 0.14, 0.09, 0.15, M.trim, 0, 0, s * 0.06, 0.035); box(g, 0.06, 0.03, 0.06, M.trim, 0.02, 0.0, s * -0.02, 0.01); });
  /* the doors' edges and their handles, on the flat of each side */
  [-1, 1].forEach(s => { [0.98, -0.02, -0.98].forEach(x => box(car, 0.006, 0.66, 0.004, M.trim, x, 0.36, s * 0.911, 0.002, { cast: false }));
    [0.36, -0.6].forEach(x => box(car, 0.16, 0.024, 0.008, M.trim, x, 0.85, s * 0.911, 0.008, { cast: false })); });
  /* the dark sills between the wheels: left standing when the near side is cut, as the dive draws it */
  [-1, 1].forEach(s => box(car, 2.06, 0.15, 0.04, M.sill, 0.0, 0.17, s * 0.905, 0.02));
  /* the wheels: tyres turned from a rounded section, discs and spokes; the arches lined dark */
  const tyreG = new THREE.LatheGeometry([[0.232, -0.1], [0.29, -0.113], [0.326, -0.106], [0.34, -0.07], [0.342, 0], [0.34, 0.07], [0.326, 0.106], [0.29, 0.113], [0.232, 0.1]].map(([r, y]) => v2(r, y)), 56);
  const wheels = [];
  [85, 378].forEach(x => [-1, 1].forEach(s => {
    const w = group(car, (x - 231) / 100, 0.342, s * 0.775); w.rotation.x = Math.PI / 2; wheels.push(w);
    const ty = new THREE.Mesh(tyreG, M.tyre); ty.castShadow = ty.receiveShadow = true; w.add(ty);
    cyl(w, 0.232, 0.232, 0.19, M.rim, 0, -0.095, 0, 40);
    const face = group(w, 0, s * 0.098, 0);
    cyl(face, 0.05, 0.05, 0.012, M.hub, 0, -0.006, 0, 20);
    for (let k = 0; k < 5; k++) { const sp = box(face, 0.17, 0.014, 0.05, M.hub, 0, -0.007, 0, 0.006); sp.position.x = Math.cos(k * 1.2566) * 0.12; sp.position.z = Math.sin(k * 1.2566) * 0.12; sp.rotation.y = -k * 1.2566; }
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.36, 32, 1, true, Math.PI - 1.3, 2.6), M.liner);
    liner.rotation.x = Math.PI / 2; liner.position.set((x - 231) / 100, 0.34, s * 0.73); car.add(liner);
  }));

  /* ---- inside: the floor is the battery; the motor at the back wheels; seats, the dashboard; the control units ---- */
  box(car, 2.06, 0.13, 1.52, M.tray, 0, 0.18, 0, 0.02, { cast: false });
  const cells = []; for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) cells.push([-1.015 + i * 0.29 + 0.14, -0.57 + j * 0.38]);
  const cellM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.035, 0.36), M.cells, cells.length);
  cells.forEach(([x, z], i) => { o3.position.set(x, 0.31 + 0.0175, z); o3.updateMatrix(); cellM.setMatrixAt(i, o3.matrix); }); cellM.receiveShadow = true; car.add(cellM);
  const motor = group(car, -1.47, 0.47, 0);
  const mc = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 32), M.motor); mc.rotation.x = Math.PI / 2; mc.castShadow = true; motor.add(mc);
  box(motor, 0.26, 0.12, 0.26, M.box, 0.02, 0.12, 0.12, 0.02);
  [-1, 1].forEach(s => { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 12), M.hub); sh.rotation.x = Math.PI / 2; sh.position.set(0.01, -0.12, s * 0.46); motor.add(sh); });
  box(car, 0.44, 0.24, 0.4, M.box, 1.83, 0.4, 0.3, 0.03); box(car, 0.3, 0.22, 0.26, mat(col(0x2a2f38, 0x3a4250), { roughness: 0.6 }), 1.76, 0.4, -0.23, 0.02);
  /* seats: two in front, a bench behind */
  const seat = (x, z, w) => { const g = group(car, x, FLOOR, z); box(g, 0.5, 0.15, w, M.seat, 0, 0.04, 0, 0.05); const b = group(g, -0.22, 0.17, 0); b.rotation.z = 0.2; box(b, 0.12, 0.56, w, M.seat, 0, 0, 0, 0.05); if (w < 0.6) box(b, 0.09, 0.15, 0.26, M.seat, -0.01, 0.6, 0, 0.04); };
  seat(0.2, 0.35, 0.5); seat(0.2, -0.39, 0.5); seat(-0.84, -0.02, 1.36);
  box(car, 0.34, 0.28, 1.5, M.dash, 1.19, 0.66, 0, 0.07);
  const scr = group(car, 1.05, 0.935, 0.05); scr.rotation.z = -0.35; box(scr, 0.012, 0.11, 0.34, M.dash, 0, 0, 0, 0.005); box(scr, 0.003, 0.095, 0.32, M.screen, -0.007, 0.008, 0, 0.0015, { cast: false });
  const sw = group(car, 0.93, 0.9, 0.34); sw.rotation.z = -0.5;
  const rimW = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 12, 48), M.dash); rimW.rotation.y = Math.PI / 2; rimW.castShadow = true; sw.add(rimW);
  const hubW = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 20), M.dash); hubW.rotation.z = Math.PI / 2; sw.add(hubW);
  const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.26, 12), M.dash); col1.rotation.z = Math.PI / 2; col1.position.x = 0.13; sw.add(col1);
  box(sw, 0.02, 0.15, 0.024, M.dash, 0, -0.16, 0, 0.006); [-1, 1].forEach(s => box(sw, 0.02, 0.024, 0.15, M.dash, 0, -0.012, s * 0.09, 0.006));
  /* the other control units (brakes at each axle, the battery's manager, the body's, a door's), each with its light */
  const ECUS = [[402, 150, 44, 22, 16, 14], [64, 150, 44, 20, 16, 14], [176, 98, 33, 30, 22, 10], [104, 150, 70, 22, 14, 14], [352, 132, 70, 20, 14, 14], [214, 162, 44, 20, 12, 14]];
  const ecuAt = ([x, y, z, w, d, h]) => C(x + w / 2, y + d / 2, Math.max(z, FLOOR * 100) + h / 2);
  ECUS.forEach(([x, y, z, w, d, h]) => { const p = C(x + w / 2, y + d / 2, Math.max(z, FLOOR * 100)); box(car, w / 100, h / 100, d / 100, M.box, p[0], p[1], p[2], 0.01); box(car, 0.012, 0.012, 0.012, M.led, p[0] + w / 200 - 0.03, p[1] + h / 100, p[2] + d / 200 - 0.02, 0.004, { cast: false }); });

  /* ---- the control unit the dive follows: a sealed metal case on a bracket, its plug, a board inside ---- */
  const unit = group(car, E[0], E[1], E[2]);
  const ux = px => (px - 500) * UE, uz = py => (py - 500) * UE;
  const part = (r, y0, h, m, rad = 0.0006, o) => box(unit, r[2] * UE, h, r[3] * UE, m, ux(r[0] + r[2] / 2), y0, uz(r[1] + r[3] / 2), rad, o);
  [-0.05, 0.05].forEach(dz => box(car, 0.2, 0.012, 0.02, M.tray, E[0], FLOOR, E[2] + dz, 0.003));
  part([60, 120, 880, 760], 0, 0.003, M.caseM, 0.001);
  [[60, 120, 880, 14], [60, 866, 880, 14], [60, 120, 14, 760], [926, 120, 14, 760]].forEach(r => part(r, 0, 0.026, M.caseM, 0.0008));
  [[140, 80], [780, 80], [140, 880], [780, 880]].forEach(([x, y]) => { part([x, y, 80, 40], 0, 0.003, M.caseM, 0.001); cyl(unit, 0.0034, 0.0034, 0.003, M.hub, ux(x + 40), 0.003, uz(y + 20), 16); });
  part([22, 226, 40, 548], 0.004, 0.02, M.plastic, 0.002);
  part([100, 160, 800, 680], 0.007, 0.0016, M.board, 0.0004, { cast: false });
  /* the plug's bundle of wires, off along the floor and into the car's wiring */
  const plug = new THREE.Vector3(...onUnit(22, 500, 0.014));
  /* the connector, two rows of pins */
  part([120, 190, 90, 620], BT, 0.011, M.plastic, 0.0008);
  const pins = []; for (let i = 0; i < 26; i++) pins.push([142, 206 + i * 23], [176, 206 + i * 23]);
  const pinM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0018, 0.0012, 0.0018), M.pin, pins.length);
  pins.forEach(([x, y], i) => { o3.position.set(ux(x + 6), BT + 0.0116, uz(y + 6)); o3.updateMatrix(); pinM.setMatrixAt(i, o3.matrix); }); unit.add(pinM);
  /* traces: from the connector to the chip, and from the chip to the drivers; thick copper for power */
  const traces = [], tr = (pts, w = 6) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; traces.push([Math.min(a[0], b[0]) - w / 2, Math.min(a[1], b[1]) - w / 2, Math.abs(b[0] - a[0]) + w, Math.abs(b[1] - a[1]) + w]); } };
  for (let i = 0; i < 6; i++) tr([[210, 300 + i * 60], [300 + i * 14, 300 + i * 60], [300 + i * 14, 410 + i * 14], [425, 410 + i * 14]]);
  [0, 1, 2, 3].forEach(i => tr([[525, 410 + i * 24], [600, 410 + i * 24], [600, 250 + i * 110], [660, 250 + i * 110]], 8));
  tr([[210, 760], [270, 760]], 16); tr([[330, 760], [430, 760], [430, 730]], 16); tr([[475, 640], [475, 495]], 12);
  const trM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.trace, traces.length);
  traces.forEach((r, i) => { o3.position.set(ux(r[0] + r[2] / 2), BT + 0.00003, uz(r[1] + r[3] / 2)); o3.scale.set(r[2] * UE, 0.00006, r[3] * UE); o3.updateMatrix(); trM.setMatrixAt(i, o3.matrix); }); unit.add(trM); o3.scale.set(1, 1, 1);
  /* big capacitors and a coil for the power coming in; a crystal, the network's transceiver, a watchdog */
  [[300, 230], [300, 760], [560, 770], [800, 770]].forEach(([x, y]) => { cyl(unit, 0.0054, 0.0054, 0.0095, M.power, ux(x), BT, uz(y), 28); cyl(unit, 0.0051, 0.0051, 0.0006, M.lead, ux(x), BT + 0.0095, uz(y), 28); });
  part([430, 640, 90, 90], BT, 0.006, M.power, 0.0015);
  part([555, 330, 50, 24], BT, 0.0022, M.can, 0.0008); part([290, 580, 70, 56], BT, 0.0016, M.plastic, 0.0003); part([540, 548, 46, 46], BT, 0.0011, M.plastic, 0.0003);
  /* the drivers: power parts that switch real current, on a metal strip that takes their heat; each glows as it works */
  part([790, 190, 60, 470], BT, 0.008, M.caseM, 0.0006);
  const glowM = [];
  [0, 1, 2, 3].forEach(i => { const r = [660, 210 + i * 110, 110, 80]; part(r, BT, 0.0045, M.power, 0.0006); part([r[0] + r[2] - 4, r[1] + 12, 24, r[3] - 24], BT, 0.0014, M.lead, 0.0003);
    for (let k = 0; k < 3; k++) part([r[0] - 12, r[1] + 16 + k * 20, 14, 8], BT, 0.0007, M.lead, 0.0001, { cast: false });
    const g = new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: 0.3, roughness: 0.4 }); glowM.push(g); part([r[0] + 18, r[1] + 18, r[2] - 40, r[3] - 36], BT + 0.0045, 0.0002, g, 0.0001, { cast: false }); });
  /* small parts everywhere else */
  const taken = [[100, 160, 120, 680], [250, 180, 110, 110], [250, 710, 110, 110], [510, 720, 110, 110], [750, 720, 110, 110], [400, 370, 150, 150], [420, 620, 120, 130], [540, 320, 80, 50], [280, 570, 90, 80], [530, 540, 70, 70], [640, 190, 230, 480]];
  const dots = []; for (let i = 0; dots.length < 120 && i < 3000; i++) { const x = 230 + rnd(i, 21) * 640, y = 180 + rnd(i, 22) * 640; if (!taken.some(r => x > r[0] - 8 && x < r[0] + r[2] + 8 && y > r[1] - 8 && y < r[1] + r[3] + 8)) dots.push([x, y, rnd(i, 23)]); }
  const passives = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0016, 0.0006, 0.0008), mat(0xffffff, { roughness: 0.5 }), dots.length);
  const cA = new THREE.Color(col(0x8a7a5a, 0xb8a27a)), cB = new THREE.Color(0x22262e);
  dots.forEach(([x, y, r], i) => { o3.position.set(ux(x), BT + 0.0003, uz(y)); o3.rotation.y = r > 0.5 ? Math.PI / 2 : 0; o3.updateMatrix(); passives.setMatrixAt(i, o3.matrix); passives.setColorAt(i, r > 0.3 ? cA : cB); });
  o3.rotation.y = 0; unit.add(passives);
  [[116, 176], [884, 176], [116, 824], [884, 824]].forEach(([x, y]) => cyl(unit, 0.0016, 0.0016, 0.0006, M.lead, ux(x), BT, uz(y), 14));

  /* ---- the microcontroller: legs out of a black package; inside it a lead frame, the die on its pad, fine wires ---- */
  const chip = group(scene, MCU[0], E[1] + BT, MCU[2]);
  box(chip, 0.0182, 0.0014, 0.0182, fader(mat(col(0x1d2129, 0x23272f), { roughness: 0.55 }), 2.45, 2.85), 0, 0.0001, 0, 0.0003);
  const LEGS = 14, PITCH = 0.001, legs = [], fingers = [], wires = [];
  const pads = padsOf(14).map(r => [r[0] + r[2] / 2, r[1] + r[3] / 2]);
  for (let s = 0; s < 4; s++) for (let i = 0; i < LEGS; i++) {
    const u = (i - (LEGS - 1) / 2) * PITCH, rot = ([a, b]) => (s === 0 ? [a, -b] : s === 1 ? [a, b] : s === 2 ? [-b, a] : [b, a]);
    legs.push({ at: rot([u, 0.0099]), turn: s >= 2 });
    fingers.push({ from: rot([u * 0.42, 0.0045]), to: rot([u, 0.0086]) });
  }
  const legM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.00034, 0.00016, 0.0016), M.lead, legs.length);
  legs.forEach((l, i) => { o3.position.set(l.at[0], 0.00008, l.at[1]); o3.rotation.y = l.turn ? Math.PI / 2 : 0; o3.updateMatrix(); legM.setMatrixAt(i, o3.matrix); }); chip.add(legM);
  /* a thin strip from a to b at height y, w wide and h thick (the lead frame's fingers, the bond wires) */
  const strip = (a, b, y0, y1, w, h) => { const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz, y1 - y0); o3.position.set((a[0] + b[0]) / 2, (y0 + y1) / 2, (a[1] + b[1]) / 2); o3.rotation.set(0, -Math.atan2(dz, dx), Math.atan2(y1 - y0, Math.hypot(dx, dz))); o3.scale.set(len, h, w); o3.updateMatrix(); return o3.matrix.clone(); };
  const fM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.lead, fingers.length);
  fingers.forEach((f, i) => fM.setMatrixAt(i, strip(f.from, f.to, 0.0005, 0.0005, 0.00024, 0.0001))); chip.add(fM);
  box(chip, 0.0074, 0.0001, 0.0074, M.lead, 0, 0.0004, 0, 0);
  const dieM = new THREE.MeshStandardMaterial({ map: dieTexture(night), roughness: 0.45, metalness: 0.15 }), edgeM = mat(CT.slab);
  const die = new THREE.Mesh(new THREE.BoxGeometry(920 * UNIT, 0.0003, 920 * UNIT), [edgeM, edgeM, dieM, edgeM, edgeM, edgeM]); die.position.set(0, 0.00065, 0); chip.add(die);
  /* each pad on the die's edge wired to the finger in front of it, in an arch */
  pads.forEach(([px, py]) => {
    const a = [(px - 500) * UNIT, (py - 500) * UNIT]; let best = null, bd = 1e9;
    fingers.forEach(f => { const d = Math.hypot(f.from[0] - a[0], f.from[1] - a[1]); if (d < bd) { bd = d; best = f; } });
    const m = [a[0] + (best.from[0] - a[0]) * 0.3, a[1] + (best.from[1] - a[1]) * 0.3];
    wires.push(strip(a, m, 0.0008, 0.0012, 0.00004, 0.00004), strip(m, best.from, 0.0012, 0.00055, 0.00004, 0.00004));
  });
  const wM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.gold, wires.length); wires.forEach((m, i) => wM.setMatrixAt(i, m)); chip.add(wM);
  o3.rotation.set(0, 0, 0); o3.scale.set(1, 1, 1);

  /* ---- the lid: on as you arrive, then lifted off and laid on the floor beside the unit ---- */
  const lid = group(unit, 0, 0, 0);
  box(lid, 880 * UE, 0.002, 760 * UE, M.caseM, ux(500), 0.026, uz(500), 0.001);
  [-1, 1].forEach(s => box(lid, 760 * UE, 0.0012, 0.008, M.caseM, ux(500), 0.028, uz(500) + s * 0.03, 0.0005));

  /* ---- the wiring: one bundle down the middle from the front to the motor, branches to every unit, messages along it ---- */
  const W = (...p) => new THREE.Vector3(...p);
  const lo = FLOOR + 0.02;
  const runs = [
    [W(1.8, 0.48, 0.1), W(1.3, 0.45, 0.0), W(0.75, lo, -0.02), W(-0.3, lo, -0.02), W(-1.05, 0.42, -0.02), W(-1.4, 0.66, 0.08)],
    [plug, W(plug.x - 0.05, lo, E[2]), W(0.55, lo, 0.52), W(0.55, lo, 0.08), W(0.5, lo, -0.02)],
    [W(1.3, 0.45, 0.0), W(1.55, 0.48, -0.45), W(...ecuAt(ECUS[0]))],
    [W(-1.05, 0.42, -0.02), W(-1.35, 0.45, -0.45), W(...ecuAt(ECUS[1]))],
    [W(-0.3, lo, -0.02), W(...ecuAt(ECUS[2]))],
    [W(-1.05, 0.42, -0.02), W(-1.12, 0.6, -0.5), W(...ecuAt(ECUS[3]))],
    [W(1.3, 0.45, 0.0), W(1.32, 0.62, -0.35), W(...ecuAt(ECUS[4]))],
    [W(-0.1, lo, -0.02), W(-0.06, 0.45, -0.6), W(...ecuAt(ECUS[5]))],
    [W(1.8, 0.48, 0.1), W(2.12, 0.48, 0.02), W(radar.x - 0.03, 0.5, 0)]
  ].map(p => new THREE.CatmullRomCurve3(p, false, 'centripetal'));
  runs.forEach((c, i) => { const m = new THREE.Mesh(new THREE.TubeGeometry(c, 64, i === 0 ? 0.013 : i === 1 ? 0.009 : 0.007, 8), i === 1 ? M.bundle : M.wire); m.castShadow = true; car.add(m); });
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 10, 8), M.live, runs.length); car.add(pulses);

  /* ---- names on the picture, each at the levels where it belongs ---- */
  const W3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const NAMES = [
    ['sensors', scene, W3(radar.x + 0.02, 0.56, 0), [0, 0.6]], ['wheels', scene, W3(1.47, 0.72, 0.8), [0, 0.6]],
    ['battery', scene, W3(-0.75, 0.36, 0.62), [0.6, 1.5]], ['motor', scene, W3(-1.47, 0.64, 0.1), [0.6, 1.5]], ['controllers', scene, W3(E[0], E[1] + 0.035, E[2]), [0.6, 1.5]], ['wiring', scene, W3(-0.3, lo + 0.02, -0.02), [0.6, 1.5]],
    ['case', scene, W3(...onUnit(180, 860, 0.03)), [1.6, 2.4]], ['connector', scene, W3(...onUnit(165, 190, BT + 0.012)), [1.6, 2.4]], ['mcu', scene, W3(...onUnit(475, 395, BT + 0.002)), [1.6, 2.4]], ['drivers', scene, W3(...onUnit(715, 210, BT + 0.005)), [1.6, 2.4]],
    ...[['cores', 180, 170], ['flash', 560, 170], ['sram', 190, 450], ['periph', 200, 620]].map(([id, x, y]) => [id, scene, W3(...onDie(x, y)), [2.6, 3.05]])
  ];
  const named = NAMES.map(([id, obj, at, lv]) => { const lb = L.add(obj, at, t('part.' + VIEW_PARTS.car[id]), { cls: 'part3' }); lb.lv = lv; lb.id = id; return lb; });
  /* the way in at each level: the thing you would enter next (at the chip, the dive's door into the block), where the shell's button stands with a ring on it */
  const portalAt = DEPTHS.mcu.portal;
  const INTO = [W3(0.62, 0.62, 0.9), W3(E[0], E[1] + 0.03, E[2]), W3(MCU[0], E[1] + BT + 0.0016, MCU[2]), W3(...onDie(portalAt[0] + portalAt[2] / 2, portalAt[1] + portalAt[2] / 2))];
  const pv = new THREE.Vector3();
  const portal = () => {
    const lv = Math.round(z), T = INTO[lv]; if (!T || Math.abs(z - lv) > 0.08 || drag) return on.portal && on.portal(null);
    pv.copy(T).project(camera);
    on.portal && on.portal(pv.z < 1 ? { x: (pv.x + 1) / 2, y: (1 - pv.y) / 2 } : null);
  };

  /* ---- the camera along the path ---- */
  let z = 0, goal = 0, raf = 0, running = true, Wd = 1, Ht = 1, last = performance.now(), drag = null, time = 0;
  const lerp = (a, b, k) => a + (b - a) * k;
  const keyAt = zz => {
    const i = Math.max(0, Math.min(KEYS.length - 2, Math.floor(zz))), k = ease(clamp(zz - i)), A = KEYS[i], B = KEYS[i + 1];
    return { look: A.look.map((v, j) => lerp(v, B.look[j], k)), dist: Math.exp(lerp(Math.log(A.dist), Math.log(B.dist), k)), yaw: lerp(A.yaw, B.yaw, k), pitch: lerp(A.pitch, B.pitch, k) };
  };
  const pose = () => {
    const Kz = keyAt(z), c = Math.cos(Kz.pitch);
    /* a narrow screen (a phone) stands back until what is in view fits across it, and looks a little lower, so the
       picture stands above the card that covers the screen's foot */
    const i = Math.min(KEYS.length - 2, Math.floor(z)), fit = lerp(WIDE[i], WIDE[i + 1], ease(clamp(z - i)));
    Kz.dist *= Math.max(1, fit / camera.aspect);
    const lift = Wd < 720 ? Ht * 0.17 : 0; camera.setViewOffset(Wd, Ht, 0, lift, Wd, Ht);
    camera.position.set(Kz.look[0] + Math.sin(Kz.yaw) * c * Kz.dist, Kz.look[1] + Math.sin(Kz.pitch) * Kz.dist, Kz.look[2] + Math.cos(Kz.yaw) * c * Kz.dist);
    camera.lookAt(Kz.look[0], Kz.look[1], Kz.look[2]);
    camera.near = Math.max(0.0004, Kz.dist * 0.04); camera.far = Math.max(4, Kz.dist * 60); camera.updateProjectionMatrix();
    scene.fog.near = Kz.dist * 2.5; scene.fog.far = Kz.dist * 14;
    /* the sun's shadows cover what is in view */
    const s = sun.shadow.camera, span = Math.max(0.012, Kz.dist * 0.9);
    Object.assign(s, { left: -span, right: span, top: span, bottom: -span, near: span * 0.05, far: span * 8 }); s.updateProjectionMatrix();
    sun.position.set(Kz.look[0] - span * 1.2, Kz.look[1] + span * 2.2, Kz.look[2] + span * 1.4); sun.target.position.set(...Kz.look);
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = span * 0.004;
  };
  /* what opens with depth: the cut sweeps in through the near side and the roof; the lid lifts, moves aside, lies down */
  const states = () => {
    fades.forEach(f => { const o = 1 - smooth(f.a, f.b, z); f.m.opacity = o; f.m.visible = o > 0.01; f.m.depthWrite = o > 0.6; });
    const k = smooth(0.12, 0.95, z);
    cutSide.constant = lerp(1.4, 0.1, k); cutTop.constant = lerp(2.0, 0.97, smooth(0.12, 0.75, z));
    lid.position.y = 0.045 * smooth(1.25, 1.55, z) - 0.083 * smooth(1.7, 2.0, z);
    lid.position.z = -0.17 * smooth(1.45, 1.85, z);
    named.forEach(lb => { lb.show = z >= lb.lv[0] && z <= lb.lv[1]; });
  };
  const live = dt => {
    if (reduced()) return; time += dt;
    runs.forEach((c, i) => { c.getPointAt((time * 0.18 + i * 0.29) % 1, o3.position); o3.updateMatrix(); pulses.setMatrixAt(i, o3.matrix); }); pulses.instanceMatrix.needsUpdate = true;
    glowM.forEach((g, i) => { g.emissiveIntensity = (night ? 0.6 : 0.3) * (0.5 + 0.5 * Math.sin(time * 2 + i)); });
  };

  /* ---- input: scroll, drag or keys move along the path; on.level tells the shell where you are ---- */
  const go = v => { goal = clamp(v, 0, END); };
  /* past the chip, the flight carries on into it: a scroll that keeps pushing at the last level, or ↓ there, goes inside */
  let push = 0;
  const atEnd = () => goal >= END - 1e-6 && Math.abs(z - END) < 0.06;
  canvas.addEventListener('wheel', e => { e.preventDefault();
    if (e.deltaY > 0 && atEnd()) { push += e.deltaY; if (push > 260) { push = 0; on.beyond && on.beyond(); } return; }
    push = 0; go(goal + e.deltaY * 0.0016); }, { passive: false });
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); drag = { y: e.clientY, x: e.clientX, g: goal, t: performance.now(), touch: e.pointerType === 'touch' }; });
  canvas.addEventListener('pointermove', e => { if (drag) go(drag.g + (drag.y - e.clientY) * 0.006); });
  /* on a touch screen, a quick swipe up or down moves one whole level in or out; up at the last goes inside (as dc3d.js) */
  const end = e => { const d = drag; drag = null; if (!d || !d.touch || e.type !== 'pointerup') return;
    const dy = e.clientY - d.y, dx = e.clientX - d.x; if (performance.now() - d.t > 450 || Math.abs(dy) < 36 || Math.abs(dy) < 1.5 * Math.abs(dx)) return;
    const from = Math.round(d.g); if (dy < 0 && from >= END) { go(END); on.beyond && on.beyond(); return; } go(from + (dy < 0 ? 1 : -1)); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'PageDown') { if (atEnd()) on.beyond && on.beyond(); else go(Math.floor(goal + 1)); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { go(Math.ceil(goal - 1)); e.preventDefault(); } });
  let settle = 0, lastLevel = -1;

  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; Wd = r.width; Ht = r.height; st.size(Wd, Ht); camera.aspect = Wd / Math.max(1, Ht); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000); last = now;
    /* after a pause in scrolling, come to rest at the nearest level */
    if (!drag && Math.abs(goal - z) < 0.002) { settle += dt; if (settle > 0.6 && Math.abs(goal - Math.round(goal)) > 0.001) goal = Math.round(goal); } else settle = 0;
    z += (goal - z) * (reduced() ? 1 : Math.min(1, dt * 4.5));
    pose(); states(); live(dt);
    const lv = Math.round(z); if (lv !== lastLevel) { lastLevel = lv; on.level && on.level(lv); }
    on.depth && on.depth(z);
    st.draw(scene, camera);
    L.update(camera, Wd, Ht);
    portal();
  };
  raf = requestAnimationFrame(frame);
  return {
    go(v) { go(v); },
    get z() { return z; },
    /* the parts named at a level (ids of src/data/atlas.js VIEW_PARTS.car), and one of them lit on the picture */
    parts: lv => named.filter(lb => lv >= lb.lv[0] - 0.01 && lv <= lb.lv[1] + 0.01).map(lb => lb.id),
    mark(id) { named.forEach(lb => lb.el.classList.toggle('hl', lb.id === id)); },
    pause() { running = false; cancelAnimationFrame(raf); },
    warm: () => st.warm(scene, camera),
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    dispose() { running = false; cancelAnimationFrame(raf); L.clear(); }
  };
}
