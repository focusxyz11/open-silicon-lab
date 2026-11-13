/* The chip world: the first page, drawn from the game (src/v2/game.js) and the community's plan.
   One island holds a chip's life as a loop road: the design studio, the factory (with the sand and crystal
   it starts from), the test hall, the port, the data centre; and back. Your chip stands on the road at the
   step you are on. The Lab in the south is where the community builds its shared computer, one floor per
   piece; the makers' village beside it holds a workshop for every community design and an empty plot for
   every open job. Across the sea: the islands where chips live (phones, cars) and room for a new one.
   What you finish grows the island (GROWERS). Drag, pinch or scroll; tap a place.
   World units: 1 = 10 metres. x east, z south, y up. Words: map.<place>.t / .d / .kind. */
import { THREE, PALETTES, theme, stage, light, mat, metal, glow, glass, box, cyl, group, flat, blob, ribbon, labels, clamp, ease, reduced, rnd } from './kit3d.js';
import { t } from '../core/i18n.js';
import { THREADS } from '../data/weave.js';
import { BEACON, STEPS, STATION, GROWTH } from './game.js';

/* where every place stands, and how close the camera comes */
export const PLACES = [
  { id: 'studio', at: [-48, -30], d: 76, r: 26 }, { id: 'quarry', at: [-62, -4], d: 56 }, { id: 'fab', at: [-8, -16], d: 72 },
  { id: 'test', at: [22, -2], d: 54 }, { id: 'port', at: [62, 6], d: 66 }, { id: 'datacentre', at: [36, -36], d: 64 },
  { id: 'lab', at: [6, 26], d: 62 }, { id: 'village', at: [-34, 24], d: 60 },
  { id: 'phones', at: [-178, 132], d: 110, far: true }, { id: 'cars', at: [158, 150], d: 110, far: true }, { id: 'idea', at: [214, -78], d: 90, far: true }
];
/* the loop road, closed, and the number pins along it (one per step) */
const LOOP = [[-28, -14], [-12, 0], [6, 8], [26, 10], [46, 12], [53, -6], [44, -20], [24, -22], [12, -32], [-8, -38], [-26, -38], [-29, -26]];
const PINS = { design: [-29, -22], make: [-12, 1], test: [22, 10], ship: [48, 11], use: [36, -21] };
const SPOKES = [[[-60, 2], [-40, -2], [-22, -5]], [[6, 8], [6, 17]], [[-12, 0], [-24, 12], [-30, 17]], [[53, -6], [60, 2]]];
const ISLAND = [[-82, -16], [-66, -46], [-34, -56], [2, -54], [40, -56], [72, -38], [82, -6], [78, 22], [54, 44], [16, 48], [-24, 48], [-60, 40], [-82, 14]];
const ISLE = (cx, cz, r, k = 9) => Array.from({ length: k }, (_, i) => { const a = i / k * Math.PI * 2, rr = r * (0.82 + rnd(i, cx) * 0.36); return [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr * 0.8]; });

export function createMap(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const { renderer, env } = stage(canvas);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.sky); scene.fog = new THREE.Fog(P.fog, 240, 560); scene.environment = env; scene.environmentIntensity = night ? 0.35 : 0.5;
  const sunL = light(scene, P, 200);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 2400);
  const L = labels(host);
  const moving = [], spinning = [], bobbing = [], pulses = [], pick = [], growing = [];
  const G = {};
  const placeAt = id => PLACES.find(x => x.id === id);
  const place = id => { const p = placeAt(id), g = group(scene, p.at[0], 0, p.at[1]); g.userData.place = id; G[id] = g; return g; };

  /* ---- sea, beach, islands ---- */
  const sea = new THREE.Mesh(new THREE.CircleGeometry(1400, 72), mat(P.sea, { roughness: 0.25, metalness: 0.15 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.6; sea.receiveShadow = true; scene.add(sea);
  const mean = (c, k) => c.reduce((a, p) => a + p[k], 0) / c.length;
  const island = (pts, n) => { const c = blob(pts, n), mx = mean(c, 0), mz = mean(c, 1); flat(scene, c.map(([x, z]) => [x + (x - mx) * 0.035, z + (z - mz) * 0.045]), mat(P.sand), -2.1, { depth: 1.2, bevel: 0.6 }); flat(scene, c, mat(P.ground), -1.6, { depth: 1.2, bevel: 0.4 }); return c; };
  const coast = island(ISLAND, 160);
  [[[-72, 0], [-64, -18], [-48, -18], [-46, 4]], [[-60, 30], [-48, 30], [-46, 40], [-62, 40]], [[26, 30], [40, 28], [44, 40], [24, 42]], [[50, -50], [66, -42], [70, -28], [56, -24]], [[-22, -52], [0, -50], [-2, -44], [-20, -44]]]
    .forEach(f => flat(scene, blob(f, 40), mat(P.grass), 0.02));
  island(ISLE(-178, 132, 34), 60); island(ISLE(158, 150, 36), 60);
  flat(scene, blob(ISLE(214, -78, 12, 7), 40), mat(P.sand), -0.45);

  /* ---- the loop road: the chip's life ---- */
  const roadM = mat(P.road, { roughness: 0.9 });
  const loop = ribbon(scene, LOOP, 3.2, roadM, 0.05, true);
  const flowM = new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: night ? 0.9 : 0.8 });
  const flowGeo = new THREE.BoxGeometry(1.2, 0.08, 0.32), flows = [];
  for (let i = 0; i < 42; i++) { const m = new THREE.Mesh(flowGeo, flowM); scene.add(m); flows.push(m); }
  SPOKES.forEach(s => ribbon(scene, s, 1.8, roadM, 0.04));

  /* ---- trees where nothing stands ---- */
  const loopPts = loop.curve.getSpacedPoints(120).map(p => [p.x, p.z]);
  const inPoly = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const free = (x, z) => inPoly(coast, x, z) && !PLACES.some(p => Math.hypot(p.at[0] - x, p.at[1] - z) < (p.r || 16)) && !loopPts.some(([a, b]) => Math.hypot(a - x, b - z) < 5) && !SPOKES.flat().some(([a, b]) => Math.hypot(a - x, b - z) < 4);
  const trees = []; for (let i = 0; i < 1200 && trees.length < 170; i++) { const x = -80 + rnd(i, 3) * 160, z = -54 + rnd(i, 7) * 100; if (free(x, z)) trees.push([x, z, 0.7 + rnd(i, 9) * 0.6]); }
  ['phones', 'cars'].forEach((k, j) => { const c = placeAt(k).at; for (let i = 0; i < 70; i++) { const a = rnd(i, 11 + j) * 6.28, r = 16 + rnd(i, 13 + j) * 14; trees.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.75, 0.6 + rnd(i, 5) * 0.5]); } });
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.2, 1), mat(night ? 0x2e4a3a : 0x6f9a62, { flatShading: true }), trees.length);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.22, 1.2, 6), mat(night ? 0x3a3128 : 0x7a5b40), trees.length);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), V = new THREE.Vector3();
  trees.forEach(([x, z, s], i) => { M4.compose(V.set(x, 2.1 * s, z), Q, S3.set(s, s * 1.15, s)); crown.setMatrixAt(i, M4); M4.compose(V.set(x, 0.6 * s, z), Q, S3.set(s, s, s)); trunk.setMatrixAt(i, M4); });
  crown.castShadow = trunk.castShadow = true; crown.receiveShadow = true; scene.add(crown, trunk);

  const winM = night ? glow(0xffd58a, 0.9) : mat(0x3d4f66, { roughness: 0.2, metalness: 0.3 });
  const winCool = night ? glow(0x8fd0ff, 0.8) : mat(0x3d4f66, { roughness: 0.2, metalness: 0.3 });
  const cols = [P.accent, P.warm, P.bad, P.good, P.slate];
  const tree = (g, x, z, s = 0.8, y = 0) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), mat(night ? 0x2e4a3a : 0x6f9a62, { flatShading: true })); m.position.set(x, y + s * 1.4, z); m.castShadow = true; g.add(m); cyl(g, s * 0.13, s * 0.18, s, mat(0x7a5b40), x, y, z, 6); };
  const houseRoof = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.6, 0), new THREE.Vector2(1.6, 0), new THREE.Vector2(0, 1.4)]), { depth: 3, bevelEnabled: false }); houseRoof.translate(0, 0, -1.5);
  const house = (g, x, z, ry, roofC, lit) => { const h = group(g, x, 0, z, ry); box(h, 3, 2, 2.8, mat(P.white), 0, 0, 0, 0.1); const r = new THREE.Mesh(houseRoof, mat(roofC)); r.position.y = 2; r.castShadow = true; h.add(r); box(h, 0.6, 0.7, 0.06, lit ? winM : mat(P.dark), -0.6, 0.7, 1.42, 0.02, { cast: false }); return h; };
  const carModel = color => { const c = new THREE.Group(); box(c, 4.2, 1, 1.9, mat(color, { roughness: 0.35, metalness: 0.3 }), 0, 0.35, 0, 0.35); box(c, 2.4, 0.8, 1.7, glass(P.dark, { opacity: 0.85 }), -0.2, 1.3, 0, 0.3);
    [[-1.3, -0.95], [1.3, -0.95], [-1.3, 0.95], [1.3, 0.95]].forEach(([x, z]) => { const w = cyl(c, 0.42, 0.42, 0.3, mat(0x1d1f24), x, 0, z, 14); w.rotation.x = Math.PI / 2; w.position.y = 0.42; }); return c; };
  const truck = color => { const tr = new THREE.Group(); box(tr, 1.6, 1.4, 1.5, mat(P.white), 1.6, 0.3, 0, 0.15); box(tr, 3.2, 1.8, 1.6, mat(color), -0.9, 0.3, 0, 0.12); return tr; };
  const ship = len => { const s = new THREE.Group(); box(s, len, 1.6, 3.4, mat(night ? 0x3a2f2f : 0x8a3b32), 0, -1, 0, 0.4); box(s, len * 0.96, 0.3, 3.2, mat(P.dark), 0, 0.6, 0, 0.1);
    for (let i = 0; i < Math.floor(len / 1.5) - 2; i++) box(s, 1.2, 1, 2.6, mat(cols[(i * 3) % 5]), -len / 2 + 1.6 + i * 1.3, 0.9, 0, 0.04); box(s, 1.8, 2.4, 2.6, mat(P.white), len / 2 - 1.4, 0.9, 0, 0.1); return s; };
  const onLoop = (obj, u, speed, lane) => { scene.add(obj); moving.push({ obj, curve: loop.curve, u, speed, lane, car: true }); };
  const route = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));

  /* ---- the stations of the loop ---- */
  /* 1 design: the studio, a campus at the start of the loop. The design halls, a plaza, and on the road
     the mask house, where a finished design leaves as masks for the factory (the mask truck grows from it) */
  { const g = place('studio');
    flat(g, [[-20, 5], [12, 5], [14, 13], [-18, 13]], mat(P.wall, { roughness: 0.9 }), 0.03);
    box(g, 22, 3.6, 11, glass(P.glass, { opacity: night ? 0.6 : 0.5, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.35 : 0 }), -4, 0, -1, 0.2);
    box(g, 24, 3.4, 11.6, mat(P.white), -4, 3.6, -1.2, 0.3);
    box(g, 24.2, 0.5, 11.8, mat(P.accent, { roughness: 0.5 }), -4, 7, -1.2, 0.12);
    for (let i = 0; i < 9; i++) box(g, 1.6, 1.2, 0.12, winCool, -14.2 + i * 2.55, 4.7, 4.66, 0.04, { cast: false });
    for (let i = 0; i < 6; i++) box(g, 2.4, 2.6, 0.06, mat(P.white, { roughness: 0.6 }), -13 + i * 3.6, 0.2, 4.52, 0.03, { cast: false });
    box(g, 9, 6.2, 7, mat(P.white), -20, 0, -6, 0.3); box(g, 9.2, 0.5, 7.2, mat(P.slate), -20, 6.2, -6, 0.1);
    for (let i = 0; i < 3; i++) box(g, 1.8, 3.6, 0.1, winCool, -22.6 + i * 2.6, 1.4, -2.45, 0.03, { cast: false });
    /* the mask house: a loading bay facing the road to the factory */
    box(g, 8, 4, 7, mat(P.white), 13, 0, 3, 0.3); box(g, 8.1, 0.6, 7.1, mat(P.warm, { roughness: 0.5 }), 13, 3.4, 3, 0.1);
    box(g, 0.12, 2.6, 3.6, mat(P.dark), 17.06, 0, 3, 0.02, { cast: false });
    for (let i = 0; i < 4; i++) pulses.push(box(g, 0.9, 0.9, 0.06, glow([P.accent, P.good, P.warm, P.accent][i], 1.1), 10.4 + i * 1.7, 2, 6.56, 0.02, { cast: false }));
    [[-15, 10], [-6, 11], [4, 10.5], [10, 11.5]].forEach(([x, z]) => tree(g, x, z, 0.9)); }
  /* 2 make: sand to crystal, and the factory */
  { const g = place('quarry');
    [[-6, 2, 3.2], [-2, -4, 2.6], [-9, -5, 2.2]].forEach(([x, z, r]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.9, 20), mat(P.sand, { roughness: 1 })); m.position.set(x, r * 0.45, z); m.castShadow = m.receiveShadow = true; g.add(m); });
    box(g, 9, 0.4, 0.9, metal(P.metal), 0, 1.6, 0, 0.1).rotation.y = -0.25;
    [-3, 0, 3].forEach(x => box(g, 0.25, 1.6, 0.25, metal(P.slate), x, 0, 0, 0.05));
    box(g, 8, 3.2, 6, mat(P.white), 5, 0, 1, 0.3);
    [3, 5, 7].forEach(x => { cyl(g, 0.55, 0.55, 2.8, metal(P.metal), x, 3.2, 1); pulses.push(cyl(g, 0.3, 0.3, 0.3, glow(P.warm, 1.4), x, 6, 1)); });
    const ingot = cyl(g, 0.7, 0.7, 4, metal(0x8c95a3, { roughness: 0.2 }), 5, 0.7, 5.2); ingot.rotation.z = Math.PI / 2; ingot.position.y = 0.75; }
  { const g = place('fab');
    box(g, 26, 7, 16, mat(P.white), 0, 0, 0, 0.5);
    box(g, 26.2, 0.9, 16.2, mat(P.accent, { roughness: 0.5 }), 0, 5.6, 0, 0.2);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const x = -9 + i * 4.5, z = -3.6 + j * 7.2; box(g, 3.4, 1.2, 3.2, mat(P.wall), x, 7, z, 0.15); spinning.push(cyl(g, 1.1, 1.1, 0.2, metal(P.dark), x, 8.2, z, 20)); }
    box(g, 10, 5, 8, mat(P.wall), -18.5, 0, 3, 0.3);
    [-21.5, -18.5, -15.5].forEach(x => cyl(g, 1.2, 1.2, 6, metal(P.metal), x, 0, -4));
    [[-22, 8], [-15, 8]].forEach(([x, z]) => { cyl(g, 0.45, 0.6, 12, mat(P.wall), x, 0, z, 16); cyl(g, 0.48, 0.48, 0.8, mat(P.bad), x, 12, z, 16); });
    for (let i = 0; i < 10; i++) box(g, 1.6, 0.7, 0.1, winM, -10 + i * 2.3, 3, 8.05, 0.03, { cast: false }); }
  /* 3 test: the hall where every chip is probed before it is cut and packed */
  { const g = place('test');
    box(g, 12, 4, 8, mat(P.white), 0, 0, 0, 0.3);
    box(g, 12.1, 0.5, 8.1, mat(P.good, { roughness: 0.5 }), 0, 3.2, 0, 0.1);
    for (let i = 0; i < 4; i++) box(g, 1.8, 0.8, 0.08, winCool, -4 + i * 2.6, 1.8, 4.02, 0.02, { cast: false });
    pulses.push(cyl(g, 1.6, 1.6, 0.12, glow(0x9aa6b8, 0.3, { metalness: 0.6, roughness: 0.15 }), -3, 4, 0, 40)); }
  /* 4 ship: the port; ships to the islands and to the world */
  { const g = place('port');
    box(g, 8, 1.4, 30, mat(P.wall), 4, -1, 0, 0.2);
    for (let i = 0; i < 18; i++) box(g, 1.2, 1.1, 2.6, mat(cols[i % 5]), -2 + (i % 3) * 1.3, Math.floor(i / 9) * 1.1, -8 + Math.floor(i % 9 / 3) * 3 + (i > 8 ? 9 : 0), 0.04);
    [-6, 6].forEach(z => { const c = group(g, 5, 0, z); [-1.4, 1.4].forEach(x => box(c, 0.4, 9, 0.4, mat(P.warm), x, 0, 0, 0.05)); box(c, 0.6, 0.6, 10, mat(P.warm), 0, 9, 3, 0.05); box(c, 3.4, 0.5, 0.5, mat(P.warm), 0, 9, 0, 0.05); });
    const moored = ship(14); moored.position.set(11.5, 0, -2); moored.rotation.y = Math.PI / 2; g.add(moored);
    const out = ship(18); scene.add(out); moving.push({ obj: out, path: route([[78, 16], [120, 30], [260, 40], [420, 60]]), speed: 0.016, ship: true }); }
  /* 5 use: the data centre */
  { const g = place('datacentre');
    [-6, 2].forEach(z => {
      box(g, 24, 4, 6, mat(P.wall), 0, 0, z, 0.3);
      for (let i = 0; i < 7; i++) { box(g, 2.4, 0.8, 2.4, mat(P.white), -9 + i * 3, 4, z, 0.12); spinning.push(cyl(g, 0.9, 0.9, 0.15, metal(P.dark), -9 + i * 3, 4.8, z, 18)); }
      for (let i = 0; i < 9; i++) box(g, 1.6, 0.5, 0.08, winCool, -9.6 + i * 2.4, 2.4, z + 3.02, 0.02, { cast: false });
    });
    box(g, 6, 0.3, 10, mat(P.road), -17, 0, -2, 0.1);
    [[-18.5, -5], [-15.5, -5], [-18.5, -1], [-15.5, -1]].forEach(([x, z]) => { box(g, 2, 2, 1.6, mat(P.slate), x, 0.3, z, 0.1); for (let k = 0; k < 3; k++) cyl(g, 0.12, 0.12, 0.8, mat(P.white), x - 0.5 + k * 0.5, 2.3, z, 8); }); }
  /* trucks carrying wafers round the loop */
  for (let i = 0; i < 3; i++) onLoop(truck(P.accent), i / 3, 0.012, 0.7);

  /* ---- the Lab: the shared computer, one floor per piece, a crane, and the open port where AI agents dock ---- */
  const lab = place('lab');
  box(lab, 16, 0.3, 14, mat(P.road), 0, 0, 0, 0.1);
  const crane = group(lab, 6.5, 0, -3); box(crane, 0.5, 18, 0.5, mat(P.warm), 0, 0, 0, 0.05); const jib = group(crane, 0, 18, 0); box(jib, 12, 0.5, 0.5, mat(P.warm), -3, 0, 0, 0.05); box(jib, 0.3, 4, 0.3, metal(P.dark), -7, -4, 0, 0.02); spinning.push({ jib });
  const floors = group(lab, -1.5, 0.3, 0);
  const dock = group(lab, 4, 0, 18); box(dock, 3, 0.6, 9, mat(P.wall), 0, -0.4, 0, 0.1); box(dock, 0.3, 3, 0.3, metal(P.metal), 0, 0.2, 4, 0.02); pulses.push(cyl(dock, 0.3, 0.3, 0.3, glow(P.accent, 1.6), 0, 3.2, 4));
  for (let i = 0; i < 2; i++) { const b = new THREE.Group(); box(b, 3, 0.8, 1.4, mat(P.white), 0, -0.3, 0, 0.3); box(b, 1, 0.5, 0.9, glow(P.accent, 1.2), 0.2, 0.5, 0, 0.15); scene.add(b);
    moving.push({ obj: b, path: route([[-30 + i * 70, 120], [-10 + i * 30, 76], [10, 54], [10, 52.5]]), speed: 0.025, ship: true, u: i * 0.5, bounce: true }); }
  /* ---- the makers' village: workshops (community designs) and plots (open jobs, engines to write) ---- */
  const village = place('village');
  const SLOTS = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) SLOTS.push([-10.5 + i * 7, -6 + j * 7]);
  const slotsG = group(village, 0, 0, 0);

  /* ---- the islands across the sea ---- */
  const phones = place('phones'), cars = place('cars'), idea = place('idea');
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; house(phones, Math.cos(a) * 12, Math.sin(a) * 9, -a, night ? 0x5a3f3a : 0xb4574a, false); }
  box(phones, 5, 10, 5, mat(P.wall), 0, 0, 0, 0.3); cyl(phones, 0.2, 0.5, 15, metal(P.metal), 7, 0, -4, 8);
  const carLoop = ribbon(scene, ISLE(158, 150, 18, 8), 3, roadM, 0.05, true);
  box(cars, 14, 5, 9, mat(P.white), 0, 0, 0, 0.4); box(cars, 14.1, 0.6, 9.1, mat(P.bad, { roughness: 0.5 }), 0, 4, 0, 0.1);
  { const f = group(idea, 0, 0, 0); box(f, 0.25, 6, 0.25, metal(P.metal), 0, -0.4, 0, 0.03); box(f, 3, 1.8, 0.1, mat(P.warm), 1.6, 3.6, 0, 0.03); }

  /* ---- what grows: one builder per growth (src/v2/game.js GROWTH); each starts hidden and grows in ---- */
  const GROWERS = {
    'studio-screen': g => { const s = box(g, 5, 2.8, 0.25, glow(P.accent, night ? 1.3 : 0.7), 0, 0.5, 0, 0.1); s.rotation.y = 0.5; box(g, 0.25, 0.6, 0.25, metal(P.slate), 0, 0, 0, 0.05); pulses.push(s); },
    /* your first masks leave the studio: a truck goes back and forth on the road between the mask house and the factory */
    'masks': () => { const tr = truck(P.warm); box(tr, 2.6, 0.12, 1.2, glow(P.accent, 1.2), -0.9, 2.15, 0, 0.03, { cast: false }); scene.add(tr); moving.push({ obj: tr, path: route([[-31, -27], [-29, -20], [-27.5, -13], [-22, -6], [-14, -2], [-8, -6]]), speed: 0.05, ship: true, bounce: true }); },
    'studio-wing': g => { box(g, 8, 4.5, 6, glass(P.glass, { opacity: 0.55, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.4 : 0 }), 0, 0, 0, 0.3); box(g, 8.2, 0.4, 6.2, mat(P.white), 0, 4.5, 0, 0.1); },
    'fab-trucks': () => { for (let i = 0; i < 4; i++) onLoop(truck([P.warm, P.good, P.white, P.slate][i]), 0.12 + i * 0.25, 0.012, -0.7); },
    'fab-line': g => { box(g, 22, 6, 7, mat(P.white), 0, 0, 0, 0.4); box(g, 22.2, 0.7, 7.2, mat(P.accent, { roughness: 0.5 }), 0, 4.8, 0, 0.15); for (let i = 0; i < 4; i++) { box(g, 3, 1, 3, mat(P.wall), -7.5 + i * 5, 6, 0, 0.12); spinning.push(cyl(g, 1, 1, 0.18, metal(P.dark), -7.5 + i * 5, 7, 0, 18)); } },
    'test-probe': g => { cyl(g, 0.3, 0.4, 6, metal(P.metal), 0, 0, 0, 10); for (let i = 0; i < 3; i++) pulses.push(box(g, 0.5, 0.5, 0.5, glow([P.good, P.warm, P.accent][i], 1.4), 0, 2 + i * 1.6, 0.35, 0.1)); },
    'test-hall': g => { box(g, 9, 3.2, 7, mat(P.white), 0, 0, 0, 0.3); box(g, 9.1, 0.4, 7.1, mat(P.good, { roughness: 0.5 }), 0, 2.6, 0, 0.1); },
    'island-phones': g => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(g, 0.9, 1.1, 0.08, winM, -1.6 + j * 1.6, 1 + i * 2.2, 2.55, 0.02, { cast: false });
      for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 48), glow(P.accent, 1, { transparent: true, opacity: 0.6, depthWrite: false })); r.rotation.x = Math.PI / 2; r.position.set(7, 13.5, -4); g.add(r); bobbing.push({ obj: r, ring: k }); }
      const f = ship(9); scene.add(f); moving.push({ obj: f, path: route([[72, 18], [10, 72], [-100, 110], [-148, 118]]), speed: 0.02, ship: true, bounce: true }); },
    'island-cars': g => { for (let i = 0; i < 7; i++) { const c = carModel(cols[i % 5]); scene.add(c); moving.push({ obj: c, curve: carLoop.curve, u: i / 7, speed: 0.02, lane: 0.7, car: true }); }
      for (let i = 0; i < 3; i++) pulses.push(box(g, 1.4, 0.5, 0.1, glow(P.good, 1.3), -4 + i * 4, 2.6, 4.6, 0.02, { cast: false }));
      const f = ship(9); scene.add(f); moving.push({ obj: f, path: route([[78, 20], [110, 80], [138, 116], [144, 122]]), speed: 0.02, ship: true, bounce: true }); },
    'dc-hall': g => { box(g, 24, 4, 6, mat(P.wall), 0, 0, 0, 0.3); for (let i = 0; i < 7; i++) { box(g, 2.4, 0.8, 2.4, mat(P.white), -9 + i * 3, 4, 0, 0.12); spinning.push(cyl(g, 0.9, 0.9, 0.15, metal(P.dark), -9 + i * 3, 4.8, 0, 18)); } for (let i = 0; i < 9; i++) box(g, 1.6, 0.5, 0.08, winCool, -9.6 + i * 2.4, 2.4, 3.02, 0.02, { cast: false }); },
    'dc-solar': g => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const p = box(g, 2.6, 0.12, 1.6, metal(0x27406a, { roughness: 0.25 }), -4.5 + i * 3, 0.9, -3 + j * 3, 0.03); p.rotation.x = -0.4; } },
    'clock-tower': g => { box(g, 2.4, 9, 2.4, mat(P.white), 0, 0, 0, 0.2); const face = cyl(g, 1, 1, 0.2, mat(P.wall), 0, 7, 1.25, 24); face.rotation.x = Math.PI / 2; const hand = box(g, 0.12, 0.9, 0.08, mat(P.dark), 0, 6.95, 1.42, 0.02, { cast: false }); hand.geometry = hand.geometry.clone().translate(0, 0.4, 0); spinning.push({ hand }); }
  };
  /* where each growth stands, relative to its place: [x, z, y] */
  const GROW_SPOT = { 'studio-screen': [-4, 9], masks: [0, 0], 'studio-wing': [-4, -12], 'fab-trucks': [0, 0], 'fab-line': [2, -14], 'test-probe': [3, 0, 4], 'test-hall': [11, 0],
    'island-phones': [0, 0], 'island-cars': [0, 0], 'dc-hall': [0, 10], 'dc-solar': [21, 4], 'clock-tower': [-8, -2] };
  GROWTH.forEach(gw => { const [x, z, y] = GROW_SPOT[gw.id] || [0, 0], g = group(G[gw.at], x, y || 0, z); g.visible = false; g.scale.setScalar(0.001); growing.push({ id: gw.id, g, built: false, t0: 0 }); });

  /* ---- one question glowing above each place ---- */
  const hue = id => (THREADS.find(x => x.id === id) || { hue: 200 }).hue;
  const beaconOrbs = [];
  PLACES.filter(p => !p.far && p.id !== 'village').forEach(p => {
    const key = BEACON[p.id]; if (!key) return;
    const th = key.split('.')[0], color = new THREE.Color().setHSL(hue(th) / 360, 0.85, night ? 0.62 : 0.48), b = group(G[p.id], -7, 0, -7);
    cyl(b, 0.16, 0.16, 12, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: night ? 0.45 : 0.6, depthWrite: false }), 0, 0, 0, 8, { cast: false });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: night ? 0.9 : 0.45, roughness: 0.3 }));
    orb.position.y = 12.5; b.add(orb); bobbing.push({ obj: orb, base: 12.5, k: rnd(p.id.length, 3) * 6 }); orb.userData.question = key; beaconOrbs.push(orb);
    const lb = L.add(orb, new THREE.Vector3(0, 1.3, 0), '?', { cls: 'q3', button: true, data: { q: key }, max: 520 });
    lb.el.style.setProperty('--qc', '#' + color.getHexString()); lb.el.setAttribute('aria-label', t('stop.' + key + '.q'));
  });
  /* ---- every place can be picked ---- */
  const pickable = () => { pick.length = 0; Object.values(G).forEach(g => g.traverse(o => { if (o.isMesh) { o.userData.place = g.userData.place; pick.push(o); } })); beaconOrbs.forEach(o => pick.push(o)); };
  pickable();
  /* ---- names, with the state of each station's challenges ---- */
  const HGT = { studio: 9, quarry: 7, fab: 10, test: 7, port: 11, datacentre: 7, lab: 22, village: 6, phones: 16, cars: 9, idea: 8 };
  const names = {};
  PLACES.forEach(p => { names[p.id] = L.add(G[p.id], new THREE.Vector3(0, HGT[p.id], 0), '', { cls: 'place3' + (p.far ? ' far' : ''), button: true, data: { place: p.id }, html: '', max: p.far ? Infinity : 520 }); });
  /* seen from far out, the island's places fold into one name */
  L.add(scene, new THREE.Vector3(0, 12, 0), t('map.home'), { cls: 'place3 far home', min: 560 });
  /* the number pins of the loop, and your chip on it */
  const pins = {};
  STEPS.forEach((s, i) => { const [x, z] = PINS[s], g = group(scene, x, 0, z); cyl(g, 0.12, 0.12, 3, metal(P.metal), 0, 0, 0, 8); pins[s] = L.add(g, new THREE.Vector3(0, 3.6, 0), String(i + 1), { cls: 'pin3', button: true, data: { step: s }, max: 380 }); });
  const token = new THREE.Group();
  box(token, 2.2, 0.35, 2.2, mat(P.chip, { roughness: 0.35, metalness: 0.4 }), 0, 0, 0, 0.12); box(token, 1.3, 0.12, 1.3, glow(P.accent, 1.5), 0, 0.35, 0, 0.05);
  for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) { const a = k * Math.PI / 2, pn = box(token, 0.12, 0.08, 0.4, metal(P.gold), 0, 0.1, 0, 0.02); pn.position.set(Math.cos(a) * 1.25 + Math.sin(a) * (j - 2) * 0.4, 0.14, Math.sin(a) * 1.25 - Math.cos(a) * (j - 2) * 0.4); pn.rotation.y = -a; }
  token.position.set(PINS.design[0] + 3, 1.2, PINS.design[1] + 2.4); scene.add(token);
  let tokenGoal = token.position.clone();

  /* ---- the camera: a target on the ground, a distance, a fixed tilt and turn ---- */
  /* on wide screens the island sits right of centre: the hero takes the lower left */
  const home = () => (innerWidth > 900 ? { x: -32, z: -8, d: 230 } : { x: -8, z: 4, d: 300 });
  const cam = Object.assign({ yaw: -0.42, pitch: 0.92 }, home());
  let fly = null;
  const place2 = () => {
    const { x, z, d, yaw, pitch } = cam;
    camera.position.set(x + Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, z + Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(x, 0, z);
    scene.fog.near = Math.max(200, d * 1.05); scene.fog.far = Math.max(540, d * 2.6);
  };
  const flyTo = (x, z, d, ms = 1100) => { fly = { from: { ...cam }, to: { x, z, d, yaw: cam.yaw, pitch: d < 90 ? 0.8 : d > 400 ? 1.0 : 0.92 }, t0: performance.now(), ms: reduced() ? 1 : ms }; };

  /* ---- input ---- */
  const ptrs = new Map(); let downAt = null, moved = 0, pinch0 = null, hover = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const toNdc = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const ground = e => { toNdc(e); ray.setFromCamera(ndc, camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(groundPlane, p) ? p : null; };
  const pickAt = e => { toNdc(e); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(pick, false)[0]; return h ? (h.object.userData.question ? { q: h.object.userData.question } : { place: h.object.userData.place }) : null; };
  const MAXD = innerWidth > 720 ? 820 : 1300;
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, g: ground(e) }); downAt = { x: e.clientX, y: e.clientY }; moved = 0; fly = null; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { dist: Math.hypot(a.x - b.x, a.y - b.y), d: cam.d }; } on.interact && on.interact(); });
  canvas.addEventListener('pointermove', e => {
    if (!ptrs.size) { const h = pickAt(e), id = h && (h.place || h.q); if (id !== hover) { hover = id; canvas.style.cursor = id ? 'pointer' : ''; Object.entries(names).forEach(([k, lb]) => lb.el.classList.toggle('on', k === hover)); } return; }
    const p = ptrs.get(e.pointerId); if (!p) return;
    moved += Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y); p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; cam.d = clamp(pinch0.d * pinch0.dist / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 38, MAXD); return; }
    const g = ground(e); if (g && p.g) { const lim = cam.d > 300 ? 220 : 80; cam.x = clamp(cam.x + p.g.x - g.x, -lim, lim); cam.z = clamp(cam.z + p.g.z - g.z, -lim * 0.7, lim * 0.9); place2(); p.g = ground(e); }
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; if (downAt && moved < 8 && !ptrs.size) { const h = pickAt(e); if (h && h.place) on.place && on.place(h.place); else if (h && h.q) on.question && on.question(h.q); } downAt = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); fly = null; cam.d = clamp(cam.d * Math.exp(e.deltaY * 0.0012), 38, MAXD); on.interact && on.interact(); }, { passive: false });
  host.addEventListener('click', e => { const b = e.target.closest('[data-place],[data-q],[data-step],[data-job]'); if (!b) return; if (b.dataset.place) on.place && on.place(b.dataset.place); else if (b.dataset.step) on.place && on.place(STATION[b.dataset.step]); else if (b.dataset.job) on.job && on.job(b.dataset.job); else on.question && on.question(b.dataset.q); });

  /* ---- the state: what has grown, the community's pieces, where your chip is ---- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let slotLabels = [];
  function setState(st, animate) {
    /* growth */
    let grew = false;
    growing.forEach(gr => { if (st.grown.has(gr.id) && !gr.built) { GROWERS[gr.id](gr.g); gr.built = true; gr.g.visible = true; grew = true; gr.t0 = animate && !reduced() ? performance.now() : -1; if (gr.t0 < 0) gr.g.scale.setScalar(1); if (animate) sparkle(gr.g); } });
    /* names, with a flag for what is left to do */
    PLACES.forEach(p => { const s = st.places[p.id];
      const flag = s && s.total ? (s.done === s.total ? '<span class="flag done">✓</span>' : '<span class="flag">' + (s.total - s.done) + '</span>') : p.id === 'village' && st.jobList.length ? '<span class="flag job">' + st.jobList.length + '</span>' : '';
      names[p.id].el.innerHTML = esc(t('map.' + p.id + '.t')) + flag; });
    /* your chip, at the pin of its step */
    const [x, z] = PINS[st.chipAt]; tokenGoal = new THREE.Vector3(x + 3, 1.2, z + 2.4);
    STEPS.forEach(s => { pins[s].el.classList.toggle('full', st.steps[s].done === st.steps[s].total); pins[s].el.classList.toggle('here', s === st.chipAt); pins[s].el.innerHTML = (STEPS.indexOf(s) + 1) + (s === st.chipAt ? '<span class="you">' + esc(t('map.yourChip')) + '</span>' : ''); pins[s].el.setAttribute('aria-label', t('game.stepN', { n: STEPS.indexOf(s) + 1, step: t('game.step.' + s) })); });
    /* the shared computer: a floor for every piece; built, yours (not yet in the plan), open, or waiting for an engine */
    while (floors.children.length) floors.remove(floors.children[0]);
    st.floors.forEach((f, i) => {
      const y = i * 1.6;
      if (f === 'built' || f === 'yours') { box(floors, 9, 1.4, 9, f === 'yours' ? glow(P.accent, night ? 0.9 : 0.5) : mat(P.white), 0, y, 0, 0.15); box(floors, 9.1, 0.3, 9.1, mat(P.slate), 0, y + 1.25, 0, 0.05); for (let k = 0; k < 4; k++) box(floors, 1.6, 0.6, 0.06, winCool, -3 + k * 2, y + 0.4, 4.53, 0.02, { cast: false }); }
      else { const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9, 1.4, 9)), new THREE.LineBasicMaterial({ color: f === 'engine' ? P.bad : P.slate, transparent: true, opacity: 0.8 })); edges.position.set(0, y + 0.7, 0); floors.add(edges); }
    });
    names.lab.offset.y = st.floors.length * 1.6 + 4;
    /* the village: a workshop for each community design, a plot for each open job, a sign for each engine wanted */
    while (slotsG.children.length) slotsG.remove(slotsG.children[0]);
    slotLabels.forEach(lb => { lb.el.remove(); const i = L.list.indexOf(lb); if (i >= 0) L.list.splice(i, 1); }); slotLabels = [];
    const items = st.designs.map(d => ({ kind: 'design', d })).concat(st.jobList.map(j => ({ kind: 'job', j })), st.engineList.map(e => ({ kind: 'engine', e })));
    items.slice(0, SLOTS.length).forEach((it, i) => {
      const [sx, sz] = SLOTS[i], g = group(slotsG, sx, 0, sz);
      box(g, 6, 0.15, 6, mat(it.kind === 'design' ? P.grass : P.sand), 0, 0, 0, 0.05, { cast: false });
      if (it.kind === 'design') { house(g, 0, 0, 0, { example: P.accent, person: P.good, ai: P.warm, both: P.bad }[it.d.kind] || P.accent, true); slotLabels.push(L.add(g, new THREE.Vector3(0, 4.6, 0), it.d.title, { cls: 'work3', max: 140 })); }
      else { box(g, 0.2, 2.4, 0.2, mat(0x7a5b40), -1.6, 0.15, 1.6, 0.02); box(g, 1.8, 1.1, 0.12, mat(it.kind === 'job' ? P.white : P.bad), -1.6, 2, 1.6, 0.03);
        const lb = L.add(g, new THREE.Vector3(-1.6, 3.6, 1.6), it.kind === 'job' ? '?' : '⚙', { cls: 'plot3' + (it.kind === 'engine' ? ' engine' : ''), button: true, data: it.kind === 'job' ? { job: it.j.need } : { place: 'lab' }, max: 260 });
        lb.el.title = it.kind === 'job' ? t('map.plot.job', { job: t('design.proj.' + it.j.p + '.t') }) : t('map.plot.engine'); slotLabels.push(lb); }
    });
    if (grew) pickable();
  }
  /* sparkles where something grew */
  const sparks = [];
  function sparkle(g) {
    const p = new THREE.Vector3(); g.getWorldPosition(p);
    for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), glow(i % 2 ? P.warm : P.accent, 1.8, { transparent: true })); m.position.copy(p).add(new THREE.Vector3(0, 2, 0)); m.userData.v = new THREE.Vector3((rnd(i, 3) - 0.5) * 14, 6 + rnd(i, 5) * 10, (rnd(i, 7) - 0.5) * 14); m.userData.t = 0; scene.add(m); sparks.push(m); }
  }

  /* ---- the loop ---- */
  let raf = 0, last = performance.now(), W = 1, H = 1, running = true;
  const resize = () => { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; renderer.setSize(W, H, false); camera.aspect = W / Math.max(1, H); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  const easeBack = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000), tm = now / 1000; last = now;
    if (fly) { const k = ease(clamp((now - fly.t0) / fly.ms)); ['x', 'z', 'd', 'yaw', 'pitch'].forEach(q => { cam[q] = fly.from[q] + (fly.to[q] - fly.from[q]) * k; }); if (k >= 1) fly = null; }
    else { const want = cam.d > 400 ? 1.0 : cam.d > 90 ? 0.92 : 0.8; cam.pitch += (want - cam.pitch) * 0.08; }
    place2();
    /* the sun's shadows follow what is in view */
    const sp = Math.min(260, Math.max(120, cam.d * 0.9)), sc = sunL.sun.shadow.camera; if (Math.abs(sc.right - sp / 2) > 1) { Object.assign(sc, { left: -sp / 2, right: sp / 2, top: sp / 2, bottom: -sp / 2 }); sc.updateProjectionMatrix(); }
    sunL.sun.position.set(cam.x - sp * 0.5, sp * 0.9, cam.z + sp * 0.6); sunL.sun.target.position.set(cam.x, 0, cam.z);
    growing.forEach(gr => { if (gr.t0 > 0) { const k = clamp((now - gr.t0) / 1300); gr.g.scale.setScalar(Math.max(0.001, easeBack(k))); if (k >= 1) gr.t0 = -1; } });
    for (let i = sparks.length - 1; i >= 0; i--) { const m = sparks[i]; m.userData.t += dt; m.userData.v.y -= 18 * dt; m.position.addScaledVector(m.userData.v, dt); m.rotation.y += dt * 4; m.material.opacity = Math.max(0, 1 - m.userData.t / 1.4); if (m.userData.t > 1.4) { scene.remove(m); sparks.splice(i, 1); } }
    token.position.lerp(tokenGoal, Math.min(1, dt * 2.2)); token.position.y = 1.2 + Math.sin(tm * 2) * 0.25; token.rotation.y += dt * 0.8;
    if (!reduced()) {
      spinning.forEach((f, i) => { if (f.jib) f.jib.rotation.y = Math.sin(tm * 0.2) * 0.9; else if (f.hand) f.hand.rotation.z = -tm * 0.8; else f.rotation.y += dt * (2 + (i % 3)); });
      pulses.forEach((p, i) => { if (p.material.emissiveIntensity != null) p.material.emissiveIntensity = (night ? 1.2 : 0.6) * (0.75 + 0.25 * Math.sin(tm * 2 + i)); });
      bobbing.forEach(b => { if (b.ring !== undefined) { const u = (tm * 0.5 + b.ring / 3) % 1; b.obj.scale.setScalar(1 + u * 6); b.obj.material.opacity = 0.6 * (1 - u); } else b.obj.position.y = b.base + Math.sin(tm * 1.4 + b.k) * 0.4; });
      flows.forEach((m, i) => { const u = (tm * 0.018 + i / flows.length) % 1, p = loop.curve.getPointAt(u), tg = loop.curve.getTangentAt(u); m.position.set(p.x, 0.12, p.z); m.rotation.y = Math.atan2(-tg.z, tg.x); });
      moving.forEach(m => {
        if (m.ship) { m.u = (m.u || 0) + dt * m.speed; const u = m.bounce ? 1 - Math.abs(1 - (m.u % 2)) : m.u % 1, back = m.bounce && (m.u % 2) > 1; const p = m.path.getPointAt(u), q = m.path.getTangentAt(u); m.obj.position.set(p.x, 0, p.z); m.obj.rotation.y = Math.atan2(-q.z, q.x) + (back ? Math.PI : 0); return; }
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
    focus(id) {
      const p = placeAt(id); if (!p) return;
      /* the place sits in the upper part of the screen: the dock takes the lower part */
      const wide = innerWidth > 720, d = p.d * (wide ? 1.6 : 2), upv = d * (wide ? 0.14 : 0.24);
      flyTo(p.at[0] + Math.sin(cam.yaw) * upv, p.at[1] + Math.cos(cam.yaw) * upv, d);
    },
    overview() { const h = home(); flyTo(h.x, h.z, h.d); },
    /* the archipelago: the islands where chips live, and the sea between */
    ecosystem() { if (innerWidth > 720) flyTo(106, 80, 800, 1500); else flyTo(-22, 166, 1250, 1500); },
    setState,
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    camera
  };
}
