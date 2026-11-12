/* The chip world: the first page. One small island where every part of a chip's life has a place: sand
   becoming crystal, the design studio, the factory, the port to the rest of the world, the data centre,
   a town full of phones, and a road full of cars. Questions glow above the places they belong to.
   Drag to look around, pinch or scroll to come closer, tap a place to visit it.
   World units: 1 = 10 metres. x east, z south, y up. Words: map.<place>.t / .d (src/i18n/en.json). */
import { THREE, PALETTES, theme, stage, light, mat, metal, glow, glass, box, cyl, group, flat, blob, ribbon, labels, clamp, ease, reduced, rnd } from './kit3d.js';
import { t } from '../core/i18n.js';
import { THREADS } from '../data/weave.js';

/* the places: where they stand, how close the camera comes, and where a visit leads (src/v2/app.js) */
export const PLACES = [
  { id: 'quarry', at: [-56, -6], d: 60 },
  { id: 'studio', at: [-34, -30], d: 60 },
  { id: 'fab', at: [-4, -12], d: 70 },
  { id: 'datacentre', at: [32, -30], d: 64 },
  { id: 'port', at: [58, 6], d: 66 },
  { id: 'town', at: [-26, 24], d: 62 },
  { id: 'cars', at: [26, 28], d: 58 }
];
/* one question glows above each place: a stop of one thread (stop.<key>.q) */
export const BEACONS = { quarry: 'make.crystal', studio: 'open.need', fab: 'scale.clean', datacentre: 'life.building', port: 'divide.ship', town: 'divide.phone', cars: 'know.car' };

const ISLAND = [[-80, -16], [-66, -44], [-34, -54], [2, -52], [40, -52], [70, -36], [80, -6], [76, 22], [52, 42], [14, 46], [-24, 46], [-58, 38], [-80, 14]];
const MAIN_ROAD = [[-56, 2], [-30, -2], [-4, 0], [22, -6], [44, -4], [58, 2]];
const ROADS = [[[-30, -2], [-34, -20]], [[22, -6], [30, -20]], [[-4, 0], [-10, 14], [-22, 18]]];
const HIGHWAY = [[-82, 14], [-50, 12], [-22, 14], [6, 20], [32, 20], [56, 14], [84, 6]];

export function createMap(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const { renderer, env } = stage(canvas);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.sky); scene.fog = new THREE.Fog(P.fog, 240, 560); scene.environment = env; scene.environmentIntensity = night ? 0.35 : 0.5;
  light(scene, P, 190);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 900);
  const L = labels(host);
  const moving = [], spinning = [], bobbing = [], pulses = [], pick = [];

  /* ---- the sea, the beach, the island ---- */
  const sea = new THREE.Mesh(new THREE.CircleGeometry(600, 64), mat(P.sea, { roughness: 0.25, metalness: 0.15 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.6; sea.receiveShadow = true; scene.add(sea);
  const coast = blob(ISLAND, 160);
  flat(scene, coast.map(([x, z]) => [x * 1.035, z * 1.045]), mat(P.sand), -2.1, { depth: 1.2, bevel: 0.6 });
  flat(scene, coast, mat(P.ground), -1.6, { depth: 1.2, bevel: 0.4 });
  /* fields and parks */
  [[[-70, 0], [-62, -18], [-46, -16], [-44, 4]], [[-60, 26], [-44, 22], [-40, 36], [-58, 38]], [[2, 28], [16, 30], [12, 42], [-4, 40]], [[40, -48], [62, -40], [66, -24], [48, -20]], [[-20, -50], [0, -48], [-2, -34], [-18, -36]]]
    .forEach(f => flat(scene, blob(f, 40), mat(P.grass), 0.02));

  /* ---- roads, and the highway along the south ---- */
  const roadM = mat(P.road, { roughness: 0.9 }), lineM = mat(P.roadLine, { roughness: 0.9 });
  const main = ribbon(scene, MAIN_ROAD, 2.4, roadM, 0.04);
  ROADS.forEach(r => ribbon(scene, r, 1.8, roadM, 0.035));
  const hw = ribbon(scene, HIGHWAY, 4.2, roadM, 0.05); ribbon(scene, HIGHWAY, 0.18, lineM, 0.06);

  /* ---- trees and houses scattered where nothing stands ---- */
  const free = (x, z) => {
    if (PLACES.some(p => Math.hypot(p.at[0] - x, p.at[1] - z) < 15)) return false;
    const inside = (() => { let c = false; for (let i = 0, j = coast.length - 1; i < coast.length; j = i++) { const [xi, zi] = coast[i], [xj, zj] = coast[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; })();
    if (!inside) return false;
    const near = pts => pts.some(([a, b]) => Math.hypot(a - x, b - z) < 4.5);
    return !near(main.curve.getSpacedPoints(60).map(p => [p.x, p.z])) && !near(hw.curve.getSpacedPoints(80).map(p => [p.x, p.z]));
  };
  const trees = []; for (let i = 0; i < 900 && trees.length < 170; i++) { const x = -78 + rnd(i, 3) * 156, z = -52 + rnd(i, 7) * 98; if (free(x, z) && (Math.hypot(x * 0.012, z * 0.02) > 0.15)) trees.push([x, z, 0.7 + rnd(i, 9) * 0.6]); }
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.2, 1), mat(night ? 0x2e4a3a : 0x6f9a62, { flatShading: true }), trees.length);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.22, 1.2, 6), mat(night ? 0x3a3128 : 0x7a5b40), trees.length);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
  trees.forEach(([x, z, s], i) => {
    M4.compose(V.set(x, 1.2 * s + 0.9 * s, z), Q, S.set(s, s * 1.15, s)); crown.setMatrixAt(i, M4);
    M4.compose(V.set(x, 0.6 * s, z), Q, S.set(s, s, s)); trunk.setMatrixAt(i, M4);
  });
  crown.castShadow = trunk.castShadow = true; crown.receiveShadow = true; scene.add(crown, trunk);

  /* ---- the places ---- */
  const G = {};
  const place = id => { const p = PLACES.find(x => x.id === id), g = group(scene, p.at[0], 0, p.at[1]); g.userData.place = id; G[id] = g; return g; };
  const winM = night ? glow(0xffd58a, 0.9) : mat(0x3d4f66, { roughness: 0.2, metalness: 0.3 });
  const winCool = night ? glow(0x8fd0ff, 0.8) : mat(0x3d4f66, { roughness: 0.2, metalness: 0.3 });

  /* sand to crystal: sand piles, a conveyor, the crystal hall with its pullers */
  { const g = place('quarry');
    [[-6, 2, 3.2], [-2, -4, 2.6], [-9, -5, 2.2]].forEach(([x, z, r]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.9, 20), mat(P.sand, { roughness: 1 })); m.position.set(x, r * 0.45, z); m.castShadow = m.receiveShadow = true; g.add(m); });
    box(g, 9, 0.4, 0.9, metal(P.metal), 0, 1.6, 0, 0.1).rotation.y = -0.25;
    [-3, 0, 3].forEach(x => box(g, 0.25, 1.6, 0.25, metal(P.slate), x, 0, 0, 0.05));
    box(g, 8, 3.2, 6, mat(P.white), 5, 0, 1, 0.3);
    [3, 5, 7].forEach(x => { cyl(g, 0.55, 0.55, 2.8, metal(P.metal), x, 3.2, 1); const c = cyl(g, 0.3, 0.3, 0.3, glow(P.warm, 1.4), x, 6, 1); pulses.push(c); });
    const ingot = cyl(g, 0.7, 0.7, 4, metal(0x8c95a3, { roughness: 0.2 }), 5, 0.7, 5.2); ingot.rotation.z = Math.PI / 2; ingot.position.y = 0.75; }

  /* the design studio: a glass ground floor, a white floor above, a big screen, a garden on the roof */
  { const g = place('studio');
    box(g, 11, 3, 7, glass(P.glass, { opacity: night ? 0.6 : 0.5, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.35 : 0 }), 0, 0, 0, 0.2);
    box(g, 13, 3.2, 6.5, mat(P.white), 1.2, 3, -0.6, 0.3);
    for (let i = 0; i < 6; i++) box(g, 1.4, 1.1, 0.12, winCool, -3.6 + i * 2.1, 4.1, 2.7, 0.04, { cast: false });
    box(g, 12, 0.3, 5.5, mat(P.grass), 1.2, 6.2, -0.6, 0.1);
    [[-3, -2], [3, -1], [5.5, -2.4]].forEach(([x, z]) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), mat(0x6f9a62, { flatShading: true })); m.position.set(x, 7.1, z); m.castShadow = true; g.add(m); });
    const scr = box(g, 4.6, 2.6, 0.2, glow(P.accent, night ? 1.2 : 0.6), -8.4, 0.6, 2.4, 0.08); scr.rotation.y = 0.5;
    box(g, 0.25, 0.8, 0.25, metal(P.slate), -8.4, 0, 2.4, 0.05); pulses.push(scr); }

  /* the factory: the white cleanroom block with its blue band, machines for air on the roof, gas tanks and stacks beside */
  { const g = place('fab');
    box(g, 26, 7, 16, mat(P.white), 0, 0, 0, 0.5);
    box(g, 26.2, 0.9, 16.2, mat(P.accent, { roughness: 0.5 }), 0, 5.6, 0, 0.2);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const x = -9 + i * 4.5, z = -3.6 + j * 7.2; box(g, 3.4, 1.2, 3.2, mat(P.wall), x, 7, z, 0.15); const f = cyl(g, 1.1, 1.1, 0.2, metal(P.dark), x, 8.2, z, 20); spinning.push(f); }
    box(g, 10, 5, 8, mat(P.wall), -19, 0, 3, 0.3);
    [-22, -19, -16].forEach(x => { cyl(g, 1.2, 1.2, 6, metal(P.metal), x, 0, -5); });
    [[-23, 8], [-15, 8]].forEach(([x, z]) => { cyl(g, 0.45, 0.6, 12, mat(P.wall), x, 0, z, 16); cyl(g, 0.48, 0.48, 0.8, mat(P.bad), x, 12, z, 16); });
    box(g, 9, 3.6, 4, glass(P.glass, { opacity: 0.55, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.4 : 0 }), 6, 0, 10, 0.2);
    for (let i = 0; i < 10; i++) box(g, 1.6, 0.7, 0.1, winM, -10 + i * 2.3, 3, 8.05, 0.03, { cast: false }); }

  /* the data centre: three long halls, coolers on their roofs, the substation that feeds them */
  { const g = place('datacentre');
    [-8, 0, 8].forEach((z, k) => {
      box(g, 24, 4, 6, mat(P.wall), 0, 0, z, 0.3);
      for (let i = 0; i < 7; i++) { box(g, 2.4, 0.8, 2.4, mat(P.white), -9 + i * 3, 4, z, 0.12); const f = cyl(g, 0.9, 0.9, 0.15, metal(P.dark), -9 + i * 3, 4.8, z, 18); spinning.push(f); }
      for (let i = 0; i < 9; i++) box(g, 1.6, 0.5, 0.08, winCool, -9.6 + i * 2.4, 2.4, z + 3.02, 0.02, { cast: false });
      if (k === 2) box(g, 3, 2.6, 0.2, mat(P.dark), 10, 0, z + 3.05, 0.05);
    });
    box(g, 6, 0.3, 10, mat(P.road), -17, 0, 0, 0.1);
    [[-18.5, -3], [-15.5, -3], [-18.5, 1], [-15.5, 1]].forEach(([x, z]) => { box(g, 2, 2, 1.6, mat(P.slate), x, 0.3, z, 0.1); for (let k = 0; k < 3; k++) cyl(g, 0.12, 0.12, 0.8, mat(P.white), x - 0.5 + k * 0.5, 2.3, z, 8); });
    [[-24, -14], [-26, 4]].forEach(([x, z]) => { cyl(g, 0.15, 0.3, 10, metal(P.metal), x, 0, z, 6); box(g, 3, 0.2, 0.2, metal(P.metal), x, 9, z, 0.02); }); }

  /* the port: the quay, two cranes, stacks of containers, and ships coming and going */
  { const g = place('port');
    box(g, 8, 1.4, 30, mat(P.wall), 4, -1, 0, 0.2);
    const cols = [P.accent, P.warm, P.bad, P.good, P.slate];
    for (let i = 0; i < 18; i++) box(g, 1.2, 1.1, 2.6, mat(cols[i % 5]), -2 + (i % 3) * 1.3, Math.floor(i / 9) * 1.1, -8 + Math.floor(i % 9 / 3) * 3 + (i > 8 ? 9 : 0), 0.04);
    [-6, 6].forEach(z => { const c = group(g, 5, 0, z); [-1.4, 1.4].forEach(x => box(c, 0.4, 9, 0.4, mat(P.warm), x, 0, 0, 0.05)); box(c, 0.6, 0.6, 10, mat(P.warm), 0, 9, 3, 0.05); box(c, 3.4, 0.5, 0.5, mat(P.warm), 0, 9, 0, 0.05); });
    const ship = (len) => { const s = new THREE.Group(); box(s, len, 1.6, 3.4, mat(night ? 0x3a2f2f : 0x8a3b32), 0, -1, 0, 0.4); box(s, len * 0.96, 0.3, 3.2, mat(P.dark), 0, 0.6, 0, 0.1);
      for (let i = 0; i < Math.floor(len / 1.5) - 2; i++) box(s, 1.2, 1, 2.6, mat(cols[(i * 3) % 5]), -len / 2 + 1.6 + i * 1.3, 0.9, 0, 0.04); box(s, 1.8, 2.4, 2.6, mat(P.white), len / 2 - 1.4, 0.9, 0, 0.1); return s; };
    const moored = ship(14); moored.position.set(11.5, 0, -2); moored.rotation.y = Math.PI / 2; g.add(moored);
    const out = ship(18); g.add(out); moving.push({ obj: out, path: new THREE.CatmullRomCurve3([new THREE.Vector3(14, 0, 10), new THREE.Vector3(40, 0, 26), new THREE.Vector3(110, 0, 40), new THREE.Vector3(150, 0, 70)]), speed: 0.018, ship: true }); }

  /* the town: houses, flats with lit windows, and the mast that carries every phone's signal */
  { const g = place('town');
    const roof = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.6, 0), new THREE.Vector2(1.6, 0), new THREE.Vector2(0, 1.4)]), { depth: 3, bevelEnabled: false }); roof.translate(0, 0, -1.5);
    const roofM = mat(night ? 0x5a3f3a : 0xb4574a);
    for (let i = 0; i < 14; i++) { const x = -12 + (i % 5) * 5.2 + rnd(i, 2) * 1.2, z = -6 + Math.floor(i / 5) * 6 + rnd(i, 4) * 1.2; if (Math.hypot(x, z) < 4) continue; const h = group(g, x, 0, z, rnd(i, 5) > 0.5 ? 0 : Math.PI / 2);
      box(h, 3, 2, 2.8, mat(i % 3 ? P.white : P.wall), 0, 0, 0, 0.1); const r = new THREE.Mesh(roof, roofM); r.position.y = 2; r.castShadow = true; h.add(r); box(h, 0.6, 0.7, 0.06, winM, -0.6, 0.7, 1.42, 0.02, { cast: false }); }
    box(g, 5, 9, 5, mat(P.wall), 12, 0, -2, 0.3);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(g, 0.9, 1.1, 0.08, rnd(i * 3 + j, 6) > 0.35 ? winM : mat(P.dark), 10.4 + j * 1.6, 1 + i * 2, 0.55, 0.02, { cast: false });
    cyl(g, 0.2, 0.5, 14, metal(P.metal), 0, 0, 0, 8);
    [0, 2.1, 4.2].forEach(a => box(g, 0.3, 1.6, 0.7, mat(P.white), Math.cos(a) * 0.6, 12, Math.sin(a) * 0.6, 0.05).rotation.y = -a);
    const tip = cyl(g, 0.25, 0.25, 0.4, glow(P.bad, 1.5), 0, 14, 0); pulses.push(tip);
    for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 48), glow(P.accent, 1, { transparent: true, opacity: 0.6, depthWrite: false })); r.rotation.x = Math.PI / 2; r.position.set(0, 12.6, 0); g.add(r); bobbing.push({ obj: r, ring: k }); } }

  /* cars: a charging plaza beside the highway, and cars on it */
  const carModel = (color) => { const c = new THREE.Group(); box(c, 4.2, 1, 1.9, mat(color, { roughness: 0.35, metalness: 0.3 }), 0, 0.35, 0, 0.35); box(c, 2.4, 0.8, 1.7, glass(P.dark, { opacity: 0.85 }), -0.2, 1.3, 0, 0.3);
    [[-1.3, -0.95], [1.3, -0.95], [-1.3, 0.95], [1.3, 0.95]].forEach(([x, z]) => { const w = cyl(c, 0.42, 0.42, 0.3, mat(0x1d1f24), x, 0, z, 14); w.rotation.x = Math.PI / 2; w.position.y = 0.42; }); return c; };
  { const g = place('cars');
    box(g, 16, 0.25, 9, mat(P.road), 0, 0, 0, 0.1);
    box(g, 14, 0.4, 7, mat(P.white), 0, 4.4, 0, 0.15);
    [[-6.5, -3], [6.5, -3], [-6.5, 3], [6.5, 3]].forEach(([x, z]) => box(g, 0.3, 4.4, 0.3, metal(P.metal), x, 0, z, 0.05));
    [-4.5, -1.5, 1.5, 4.5].forEach((x, i) => { box(g, 0.8, 1.7, 0.6, mat(P.white), x, 0.25, -2.6, 0.12); box(g, 0.5, 0.35, 0.05, glow(i === 1 ? P.warm : P.good, 1.2), x, 1.3, -2.28, 0.02, { cast: false });
      if (i !== 2) { const c = carModel([P.accent, P.white, P.bad, P.slate][i]); c.position.set(x, 0.25, 0.4); c.rotation.y = Math.PI / 2; g.add(c); } }); }
  for (let i = 0; i < 9; i++) { const c = carModel([P.accent, P.white, P.bad, P.slate, P.warm][i % 5]); scene.add(c); moving.push({ obj: c, curve: hw.curve, u: i / 9, speed: (i % 2 ? 1 : -1) * (0.012 + rnd(i, 8) * 0.006), lane: i % 2 ? 0.9 : -0.9, car: true }); }
  /* trucks carrying wafers from the factory to the port */
  for (let i = 0; i < 3; i++) { const tr = new THREE.Group(); box(tr, 1.6, 1.4, 1.5, mat(P.white), 1.6, 0.3, 0, 0.15); box(tr, 3.2, 1.8, 1.6, mat(P.accent), -0.9, 0.3, 0, 0.12); scene.add(tr); moving.push({ obj: tr, curve: main.curve, u: i / 3, speed: 0.02 * (i % 2 ? 1 : -1), lane: i % 2 ? 0.6 : -0.6, car: true }); }

  /* every place can be picked */
  Object.values(G).forEach(g => g.traverse(o => { if (o.isMesh) { o.userData.place = g.userData.place; pick.push(o); } }));

  /* ---- the questions, glowing above their places ---- */
  const hue = id => (THREADS.find(x => x.id === id) || { hue: 200 }).hue;
  Object.entries(BEACONS).forEach(([pid, key]) => {
    const g = G[pid], th = key.split('.')[0], color = new THREE.Color().setHSL(hue(th) / 360, 0.75, night ? 0.62 : 0.5);
    const b = group(g, 4, 0, 4);
    const beam = cyl(b, 0.16, 0.16, 12, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: night ? 0.45 : 0.6, depthWrite: false }), 0, 0, 0, 8, { cast: false });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: night ? 1.6 : 0.8, roughness: 0.3 }));
    orb.position.y = 12.5; b.add(orb); bobbing.push({ obj: orb, base: 12.5, k: rnd(pid.length, 3) * 6 });
    orb.userData.question = key; pick.push(orb); beam.userData.question = key;
    const lb = L.add(orb, new THREE.Vector3(0, 1.2, 0), '?', { cls: 'q3', button: true, data: { q: key }, max: 420 });
    lb.el.style.setProperty('--qc', '#' + color.getHexString());
    lb.el.setAttribute('aria-label', t('stop.' + key + '.q'));
  });
  /* each place's name */
  const names = {};
  PLACES.forEach(p => { const hgt = { fab: 10, datacentre: 7, studio: 8, port: 11, town: 16, cars: 6, quarry: 7 }[p.id]; names[p.id] = L.add(G[p.id], new THREE.Vector3(0, hgt, 0), t('map.' + p.id + '.t'), { cls: 'place3', button: true, data: { place: p.id } }); });

  /* ---- the camera: a target on the ground, a distance, a fixed tilt and turn ---- */
  const home = () => (innerWidth > 900 ? { x: -16, z: 4, d: 230 } : { x: 2, z: 10, d: 250 });
  const cam = Object.assign({ yaw: -0.42, pitch: 0.92 }, home()), goal = { ...cam };
  let fly = null;
  const place2 = () => {
    const { x, z, d, yaw, pitch } = cam;
    camera.position.set(x + Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, z + Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(x, 0, z);
  };
  const flyTo = (x, z, d, ms = 1100) => { fly = { from: { ...cam }, to: { x, z, d, yaw: cam.yaw, pitch: d < 90 ? 0.8 : 0.92 }, t0: performance.now(), ms: reduced() ? 1 : ms }; };

  /* ---- input: drag to look around, wheel or pinch to come closer, tap to pick ---- */
  const ptrs = new Map(); let downAt = null, moved = 0, pinch0 = null, hover = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const toNdc = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const ground = e => { toNdc(e); ray.setFromCamera(ndc, camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(groundPlane, p) ? p : null; };
  const pickAt = e => { toNdc(e); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(pick, false)[0]; return h ? (h.object.userData.question ? { q: h.object.userData.question } : { place: h.object.userData.place }) : null; };
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, g: ground(e) }); downAt = { x: e.clientX, y: e.clientY }; moved = 0; fly = null; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { dist: Math.hypot(a.x - b.x, a.y - b.y), d: cam.d }; } on.interact && on.interact(); });
  canvas.addEventListener('pointermove', e => {
    if (!ptrs.size) { const h = pickAt(e); const id = h && (h.place || h.q); if (id !== hover) { hover = id; canvas.style.cursor = id ? 'pointer' : ''; Object.entries(names).forEach(([k, lb]) => lb.el.classList.toggle('on', k === hover)); } return; }
    const p = ptrs.get(e.pointerId); if (!p) return;
    moved += Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y); p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; cam.d = clamp(pinch0.d * pinch0.dist / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 38, 260); return; }
    const g = ground(e); if (g && p.g) { cam.x = clamp(cam.x + p.g.x - g.x, -70, 70); cam.z = clamp(cam.z + p.g.z - g.z, -50, 45); place2(); p.g = ground(e); }
  });
  const up = e => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null;
    if (downAt && moved < 8 && !ptrs.size) { const h = pickAt(e); if (h && h.place) on.place && on.place(h.place); else if (h && h.q) on.question && on.question(h.q); }
    downAt = null;
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); fly = null; cam.d = clamp(cam.d * Math.exp(e.deltaY * 0.0012), 38, 260); on.interact && on.interact(); }, { passive: false });
  host.addEventListener('click', e => { const b = e.target.closest('[data-place],[data-q]'); if (!b) return; if (b.dataset.place) on.place && on.place(b.dataset.place); else on.question && on.question(b.dataset.q); });

  /* ---- the loop ---- */
  let raf = 0, last = performance.now(), W = 1, H = 1, running = true;
  const resize = () => { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; renderer.setSize(W, H, false); camera.aspect = W / Math.max(1, H); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000), tm = now / 1000; last = now;
    if (fly) { const k = ease(clamp((now - fly.t0) / fly.ms)); ['x', 'z', 'd', 'yaw', 'pitch'].forEach(q => { cam[q] = fly.from[q] + (fly.to[q] - fly.from[q]) * k; }); if (k >= 1) fly = null; }
    else if (cam.d > 90) cam.pitch += (0.92 - cam.pitch) * 0.08; else cam.pitch += (0.8 - cam.pitch) * 0.08;
    place2();
    const still = reduced();
    if (!still) {
      spinning.forEach((f, i) => { f.rotation.y += dt * (2 + (i % 3)); });
      pulses.forEach((p, i) => { p.material.emissiveIntensity = (night ? 1.2 : 0.6) * (0.75 + 0.25 * Math.sin(tm * 2 + i)); });
      bobbing.forEach(b => { if (b.ring !== undefined) { const u = (tm * 0.5 + b.ring / 3) % 1; b.obj.scale.setScalar(1 + u * 6); b.obj.material.opacity = 0.6 * (1 - u); } else b.obj.position.y = b.base + Math.sin(tm * 1.4 + b.k) * 0.4; });
      moving.forEach(m => {
        if (m.ship) { m.u = ((m.u || 0) + dt * m.speed) % 1; const p = m.path.getPointAt(m.u), q = m.path.getTangentAt(m.u); m.obj.position.set(p.x, 0, p.z); m.obj.rotation.y = Math.atan2(-q.z, q.x); return; }
        m.u = (m.u + dt * m.speed + 1) % 1; const p = m.curve.getPointAt(m.u), tg = m.curve.getTangentAt(m.u), n = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
        m.obj.position.set(p.x + n.x * m.lane, 0.05, p.z + n.z * m.lane); m.obj.rotation.y = Math.atan2(-tg.z, tg.x) + (m.speed < 0 ? Math.PI : 0);
      });
    }
    renderer.render(scene, camera);
    L.update(camera, W, H);
  };
  raf = requestAnimationFrame(frame);
  place2();

  return {
    /* come close to a place, or back out to see the whole island */
    focus(id) {
      const p = PLACES.find(x => x.id === id); if (!p) return;
      /* on a wide screen the sheet stands on the right: the place goes left of it; on a phone the sheet is below: the place goes up */
      const wide = innerWidth > 720, d = p.d * (wide ? 1.35 : 2), k = wide ? d * 0.2 : 0, up = wide ? 0 : d * 0.22;
      flyTo(p.at[0] + Math.cos(cam.yaw) * k + Math.sin(cam.yaw) * up, p.at[1] - Math.sin(cam.yaw) * k + Math.cos(cam.yaw) * up, d);
    },
    overview() { const h = home(); flyTo(h.x, h.z, h.d); },
    /* where a place appears on the screen: for the sheet to point at */
    screenOf(id) { const v = new THREE.Vector3(...[G[id].position.x, 4, G[id].position.z]).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    camera
  };
}
