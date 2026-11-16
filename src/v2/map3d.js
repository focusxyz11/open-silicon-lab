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
import { STEPS, STATION, GROWTH } from './game.js';

/* where every place stands, and how close the camera comes */
export const PLACES = [
  { id: 'studio', at: [-48, -30], d: 76, r: 26 }, { id: 'quarry', at: [-62, -4], d: 56 }, { id: 'fab', at: [-8, -16], d: 72 },
  { id: 'test', at: [22, -2], d: 54 }, { id: 'port', at: [62, 6], d: 66 }, { id: 'datacentre', at: [36, -36], d: 64 },
  { id: 'lab', at: [6, 26], d: 62 }, { id: 'village', at: [-34, 24], d: 60 },
  { id: 'phones', at: [-178, 132], d: 110, far: true }, { id: 'cars', at: [158, 150], d: 110, far: true }, { id: 'idea', at: [214, -78], d: 90, far: true }
];
/* the loop road, closed, and the number pins along it (one per step) */
/* the ring road passes the Lab's square: the loop starts and comes back where the community stands */
const LOOP = [[-28, -14], [-12, 0], [-3, 9], [6, 15], [16, 13], [28, 10], [46, 12], [53, -6], [44, -20], [24, -22], [12, -32], [-8, -38], [-26, -38], [-29, -26]];
/* six stops, one for each stage of the loop, with no numbers: a loop has no first and no last */
const PINS = { open: [6, 16], design: [-29, -22], make: [-12, 1], test: [24, 11.5], ship: [48, 11], use: [36, -21] };
const STOPS6 = ['open'].concat(STEPS), STOP_PLACE = Object.assign({ open: 'lab' }, STATION);
/* where your chip stands when you are at the need: at the end of the Lab's road, off the loop */
const NEED_AT = PINS.open;
const SPOKES = [[[-60, 2], [-40, -2], [-22, -5]], [[6, 15], [6, 19]], [[-12, 0], [-24, 12], [-30, 17]], [[53, -6], [60, 2]]];
const ISLAND = [[-82, -16], [-66, -46], [-34, -56], [2, -54], [40, -56], [72, -38], [82, -6], [78, 22], [54, 44], [16, 48], [-24, 48], [-60, 40], [-82, 14]];
const ISLE = (cx, cz, r, k = 9) => Array.from({ length: k }, (_, i) => { const a = i / k * Math.PI * 2, rr = r * (0.82 + rnd(i, cx) * 0.36); return [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr * 0.8]; });

/* the island's own ground, sea and trees, muted (the shared palette stays as it is for every other scene) */
const TERRAIN = {
  light: { ground: 0x95a982, lush: 0x76935f, dry: 0xb8b48a, dark: 0x667d58, sand: 0xd8c8a2, wet: 0xa99a7c, shallow: 0x88b0b8, sea: 0x56809a, pine: 0x4a6b4c, leaf: 0x67845a, bark: 0x6b5643 },
  dark: { ground: 0x1d2a2f, lush: 0x1b302b, dry: 0x2a3330, dark: 0x15221f, sand: 0x4f4a3e, wet: 0x38362f, shallow: 0x16405a, sea: 0x0a1a2c, pine: 0x1d3a2e, leaf: 0x284534, bark: 0x3a3128 }
};
/* the island's buildings, grown up: roofs, trims, cranes, hulls and containers in the muted colours real ones wear,
   so the few bright things left (your chip, the loop's flow, lit windows, the lights of what grows) carry meaning */
const ARCH = {
  light: { roof: 0x8d969f, trim: 0x59626d, crane: 0xb39a66, hull: 0x6c4f48, truck: 0xe4e2dc, tile: 0x9a6f60, box: [0x6f8796, 0x9c6352, 0x878a76, 0xb4a07e, 0x5f6b77] },
  dark: { roof: 0x2f3845, trim: 0x232a35, crane: 0x7a6846, hull: 0x3a2f2f, truck: 0x8f98a3, tile: 0x5a4039, box: [0x3c4d5a, 0x5c3c35, 0x4a4d43, 0x675b47, 0x3a434e] }
};
/* a slow value noise, smooth, from 0 to 1 */
const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = t => t * t * (3 - 2 * t);
/* three overlapping faceted balls in one geometry: a tree crown with an outline */
function lump() {
  const parts = [[0, 0, 0, 1], [0.55, -0.15, 0.25, 0.72], [-0.5, -0.2, -0.3, 0.68]].map(([x, y, z, r]) => { const g = new THREE.IcosahedronGeometry(r, 1); g.translate(x, y, z); return g.toNonIndexed(); });
  const n = parts.reduce((a, g) => a + g.attributes.position.count, 0), pos = new Float32Array(n * 3);
  let o = 0; parts.forEach(g => { pos.set(g.attributes.position.array, o); o += g.attributes.position.array.length; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => 0.55 * noise2(x, y) + 0.3 * noise2(x * 2.1 + 5, y * 2.1 + 9) + 0.15 * noise2(x * 4.3 + 11, y * 4.3 + 3);
/* the ground's top: a fine grid inside the coast whose colour wanders between lush, dry and dark, and settles to
   the plain ground colour near the coast, so the grid's edge never shows */
function terrain(coast, T) {
  const X0 = -92, X1 = 92, Z0 = -62, Z1 = 58, NX = 184, NZ = 120;
  const g = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, NX, NZ); g.rotateX(-Math.PI / 2); g.translate((X0 + X1) / 2, 0.012, (Z0 + Z1) / 2);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), base = new THREE.Color(T.ground), c = new THREE.Color();
  const lush = new THREE.Color(T.lush), dry = new THREE.Color(T.dry), dark = new THREE.Color(T.dark);
  const segD = (x, z) => { let m = 1e9; for (let i = 0, j = coast.length - 1; i < coast.length; j = i++) { const [ax, az] = coast[j], [bx, bz] = coast[i], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9))); m = Math.min(m, Math.hypot(x - ax - t * dx, z - az - t * dz)); } return m; };
  const inside = (x, z) => { let k = false; for (let i = 0, j = coast.length - 1; i < coast.length; j = i++) { const [xi, zi] = coast[i], [xj, zj] = coast[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) k = !k; } return k; };
  const keep = new Uint8Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), d = inside(x, z) ? segD(x, z) : 0; keep[i] = d > 2.5 ? 1 : 0;
    const n = fbm(x / 26, z / 26), m = fbm(x / 9 + 40, z / 9 + 40), f = Math.min(1, Math.max(0, (d - 3) / 9));
    c.copy(base).lerp(n > 0.5 ? dry : lush, Math.min(1, Math.abs(n - 0.5) * 3.4)).lerp(dark, Math.min(0.7, Math.max(0, m - 0.56) * 2.4));
    c.lerp(base, 1 - f); col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const idx = g.index.array, out = [];
  for (let i = 0; i < idx.length; i += 3) if (keep[idx[i]] && keep[idx[i + 1]] && keep[idx[i + 2]]) out.push(idx[i], idx[i + 1], idx[i + 2]);
  g.setIndex(out);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 }));
  m.receiveShadow = true; return m;
}

export function createMap(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const st = stage(canvas), { env } = st;
  /* the sky is a gradient, deeper overhead and paler at the horizon, where the fog meets it (the art pass) */
  const skyTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
    (night ? [[0, '#03060d'], [0.55, '#0a1222'], [1, '#13213a']] : [[0, '#8db6d6'], [0.6, '#c4d9e7'], [1, '#e4ecf0']]).forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; })();
  const scene = new THREE.Scene(); scene.background = skyTex; scene.fog = new THREE.Fog(P.fog, 240, 560); scene.environment = env; scene.environmentIntensity = night ? 0.35 : 0.5;
  const sunL = light(scene, P, 200); if (!night) { sunL.sun.color.setHex(0xffead0); sunL.sun.intensity = 2.3; sunL.hemi.intensity = 0.6; }
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 2400);
  const L = labels(host);
  const moving = [], spinning = [], bobbing = [], pulses = [], pick = [], growing = [];
  const G = {};
  const placeAt = id => PLACES.find(x => x.id === id);
  const place = id => { const p = placeAt(id), g = group(scene, p.at[0], 0, p.at[1]); g.userData.place = id; G[id] = g; return g; };

  /* ---- sea, beach, islands ----
     Grown up, not a toy (docs/reviews/art-direction.md): muted ground whose colour wanders the way fields, scrub and
     dry grass do, a narrow beach with wet sand at the water, a ring of shallow water, and deep sea beyond. */
  const T = TERRAIN[night ? 'dark' : 'light'], A = ARCH[night ? 'dark' : 'light'];
  /* the sea moves: a field of small ripples (a normal map drawn once from noise, tiled and drifting), so the sky and
     the sun catch on it */
  const ripples = (() => { const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
    const h = (i, j) => noise2(i / 9, j / 9) * 0.6 + noise2(i / 3.5 + 40, j / 3.5) * 0.4;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = h((i + 1) % N, j) - h((i + N - 1) % N, j), dy = h(i, (j + 1) % N) - h(i, (j + N - 1) % N), k = (j * N + i) * 4;
      im.data[k] = 128 + dx * 160; im.data[k + 1] = 128 + dy * 160; im.data[k + 2] = 255; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(90, 90); return tx; })();
  const seaM = new THREE.MeshStandardMaterial({ color: T.sea, roughness: night ? 0.22 : 0.16, metalness: 0.25, normalMap: ripples, normalScale: new THREE.Vector2(night ? 0.3 : 0.5, night ? 0.3 : 0.5) });
  const sea = new THREE.Mesh(new THREE.CircleGeometry(1400, 72), seaM);
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.6; sea.receiveShadow = true; scene.add(sea);
  const mean = (c, k) => c.reduce((a, p) => a + p[k], 0) / c.length;
  const grow = (c, k) => { const mx = mean(c, 0), mz = mean(c, 1); return c.map(([x, z]) => [x + (x - mx) * k, z + (z - mz) * k * 1.25]); };
  const shallowM = new THREE.MeshStandardMaterial({ color: T.shallow, roughness: 0.3, metalness: 0.05, transparent: true, opacity: night ? 0.55 : 0.6, depthWrite: false });
  const island = (pts, n) => { const c = blob(pts, n); flat(scene, grow(c, 0.09), shallowM, -0.55); flat(scene, grow(c, 0.03), mat(T.wet, { roughness: 0.5 }), -2.2, { depth: 1.2, bevel: 0.6 }); flat(scene, grow(c, 0.016), mat(T.sand, { roughness: 0.95 }), -2.0, { depth: 1.2, bevel: 0.6 }); flat(scene, c, mat(T.ground, { roughness: 0.95 }), -1.6, { depth: 1.2, bevel: 0.4 }); return c; };
  const coast = island(ISLAND, 160);
  scene.add(terrain(coast, T));
  island(ISLE(-178, 132, 34), 60); island(ISLE(158, 150, 36), 60);
  flat(scene, blob(ISLE(214, -78, 12, 7), 40), mat(T.sand, { roughness: 0.95 }), -0.45);

  /* ---- the loop road: the chip's life ---- */
  const roadM = mat(P.road, { roughness: 0.9 });
  const loop = ribbon(scene, LOOP, 2.6, roadM, 0.05, true);
  const flowM = new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: night ? 0.9 : 0.8 });
  const flowGeo = new THREE.BoxGeometry(1.2, 0.08, 0.32), flows = [];
  for (let i = 0; i < 42; i++) { const m = new THREE.Mesh(flowGeo, flowM); scene.add(m); flows.push(m); }
  SPOKES.forEach(s => ribbon(scene, s, 1.8, roadM, 0.04));
  /* street lamps along the loop road: a pole, an arm, and a lamp that is lit at night */
  { const pole = metal(night ? 0x4a5464 : 0x7d8794, { roughness: 0.5 }), lampM = night ? glow(0xffd9a0, 3) : mat(0xe9e6de, { roughness: 0.4 }), poolM = new THREE.MeshBasicMaterial({ color: 0xffb860, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const poolG = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); poolM.map = new THREE.CanvasTexture(c); return new THREE.PlaneGeometry(5, 5); })();
    const pts = loop.curve.getSpacedPoints(36); pts.slice(0, -1).forEach((p, i) => { const tg = loop.curve.getTangentAt(i / 36), side = i % 2 ? 1 : -1, nx = -tg.z * side, nz = tg.x * side, x = p.x + nx * 2.2, z = p.z + nz * 2.2;
      cyl(scene, 0.07, 0.09, 3.2, pole, x, 0, z, 6); const arm = box(scene, 0.9, 0.06, 0.06, pole, x - nx * 0.4, 3.15, z - nz * 0.4, 0.01, { cast: false }); arm.rotation.y = Math.atan2(nx, nz) + Math.PI / 2;
      box(scene, 0.34, 0.1, 0.18, lampM, x - nx * 0.82, 3.05, z - nz * 0.82, 0.03, { cast: false });
      if (night) { const pool = new THREE.Mesh(poolG, poolM); pool.rotation.x = -Math.PI / 2; pool.position.set(x - nx * 0.82, 0.12, z - nz * 0.82); scene.add(pool); } }); }

  /* ---- trees where nothing stands ---- */
  const loopPts = loop.curve.getSpacedPoints(120).map(p => [p.x, p.z]);
  const inPoly = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const free = (x, z) => inPoly(coast, x, z) && !PLACES.some(p => Math.hypot(p.at[0] - x, p.at[1] - z) < (p.r || 16)) && !loopPts.some(([a, b]) => Math.hypot(a - x, b - z) < 5) && !SPOKES.flat().some(([a, b]) => Math.hypot(a - x, b - z) < 4);
  /* groves, not a scatter: trees stand where a slow noise says the ground is wooded, thicker inland, in two kinds
     (pines and broadleaf), each one a little taller or darker than the next */
  const trees = []; for (let i = 0; i < 6000 && trees.length < 520; i++) { const x = -82 + rnd(i, 3) * 164, z = -56 + rnd(i, 7) * 104; if (free(x, z) && noise2(x / 22, z / 22) > 0.52 - 0.12 * rnd(i, 4)) trees.push([x, z, 0.65 + rnd(i, 9) * 0.6, rnd(i, 17)]); }
  ['phones', 'cars'].forEach((k, j) => { const c = placeAt(k).at; for (let i = 0; i < 110; i++) { const a = rnd(i, 11 + j) * 6.28, r = 15 + rnd(i, 13 + j) * 15; trees.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.75, 0.55 + rnd(i, 5) * 0.5, rnd(i, 19 + j)]); } });
  const pines = trees.filter(tr => tr[3] < 0.45), broad = trees.filter(tr => tr[3] >= 0.45);
  const pineG = new THREE.ConeGeometry(1, 1, 7, 1); pineG.translate(0, 0.5, 0);
  /* a broadleaf crown is a lump of three, not a ball on a stick */
  const broadG = lump();
  const leafM = mat(0xffffff, { roughness: 0.9 }), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), V = new THREE.Vector3(), C = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);
  const crown = new THREE.InstancedMesh(pineG, leafM, pines.length), canopy = new THREE.InstancedMesh(broadG, leafM, broad.length);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.16, 1, 5), mat(T.bark), trees.length);
  pines.forEach(([x, z, s, k], i) => { const h = 4.2 * s * (0.85 + k * 0.6); Q.setFromAxisAngle(UP, k * 40); M4.compose(V.set(x, 0.9 * s, z), Q, S3.set(0.95 * s, h, 0.95 * s)); crown.setMatrixAt(i, M4); crown.setColorAt(i, C.setHex(T.pine).offsetHSL((k - 0.2) * 0.02, 0, (k - 0.22) * 0.07)); });
  broad.forEach(([x, z, s, k], i) => { Q.setFromAxisAngle(UP, k * 40); M4.compose(V.set(x, 1.9 * s, z), Q, S3.set(1.5 * s, 1.15 * s, 1.5 * s)); canopy.setMatrixAt(i, M4); canopy.setColorAt(i, C.setHex(T.leaf).offsetHSL((k - 0.7) * 0.03, -0.03 * k, (k - 0.72) * 0.08)); });
  trees.forEach(([x, z, s], i) => { M4.compose(V.set(x, 0.6 * s, z), Q.identity(), S3.set(s, 1.3 * s, s)); trunk.setMatrixAt(i, M4); });
  [crown, canopy, trunk].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });

  const winM = night ? glow(0xffd58a, 0.9) : mat(0x3d4f66, { roughness: 0.2, metalness: 0.3 });
  const winCool = night ? glow(0x8fd0ff, 0.8) : mat(0x3d4f66, { roughness: 0.2, metalness: 0.3 });
  const cols = A.box;
  const tree = (g, x, z, s = 0.8, y = 0) => { const m = new THREE.Mesh(broadG, mat(T.leaf, { roughness: 0.9 })); m.position.set(x, y + s * 1.9, z); m.scale.set(1.2 * s, 0.95 * s, 1.2 * s); m.castShadow = true; g.add(m); cyl(g, s * 0.1, s * 0.15, s * 1.3, mat(T.bark), x, y, z, 5); };
  const houseRoof = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.6, 0), new THREE.Vector2(1.6, 0), new THREE.Vector2(0, 1.4)]), { depth: 3, bevelEnabled: false }); houseRoof.translate(0, 0, -1.5);
  const house = (g, x, z, ry, roofC, lit) => { const h = group(g, x, 0, z, ry); box(h, 3, 2, 2.8, mat(P.white), 0, 0, 0, 0.1); const r = new THREE.Mesh(houseRoof, mat(roofC)); r.position.y = 2; r.castShadow = true; h.add(r); box(h, 0.6, 0.7, 0.06, lit ? winM : mat(P.dark), -0.6, 0.7, 1.42, 0.02, { cast: false }); return h; };
  const carModel = color => { const c = new THREE.Group(); box(c, 4.2, 1, 1.9, mat(color, { roughness: 0.35, metalness: 0.3 }), 0, 0.35, 0, 0.35); box(c, 2.4, 0.8, 1.7, glass(P.dark, { opacity: 0.85 }), -0.2, 1.3, 0, 0.3);
    [[-1.3, -0.95], [1.3, -0.95], [-1.3, 0.95], [1.3, 0.95]].forEach(([x, z]) => { const w = cyl(c, 0.42, 0.42, 0.3, mat(0x1d1f24), x, 0, z, 14); w.rotation.x = Math.PI / 2; w.position.y = 0.42; }); return c; };
  const truck = color => { const tr = new THREE.Group(); box(tr, 1.6, 1.4, 1.5, mat(P.white), 1.6, 0.3, 0, 0.15); box(tr, 3.2, 1.8, 1.6, mat(color), -0.9, 0.3, 0, 0.12); return tr; };
  const ship = len => { const s = new THREE.Group(); box(s, len, 1.6, 3.4, mat(A.hull), 0, -1, 0, 0.4); box(s, len * 0.96, 0.3, 3.2, mat(P.dark), 0, 0.6, 0, 0.1);
    for (let i = 0; i < Math.floor(len / 1.5) - 2; i++) box(s, 1.2, 1, 2.6, mat(cols[(i * 3) % 5]), -len / 2 + 1.6 + i * 1.3, 0.9, 0, 0.04); box(s, 1.8, 2.4, 2.6, mat(P.white), len / 2 - 1.4, 0.9, 0, 0.1); return s; };
  const onLoop = (obj, u, speed, lane) => { scene.add(obj); moving.push({ obj, curve: loop.curve, u, speed, lane, car: true }); };
  const route = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));

  /* ---- the stations of the loop ---- */
  /* ---- furnishing, drawn small but whole ---- */
  /* screens show the work in shapes, never words (words are HTML over the scene): code as indented lines, a
     simulation as waveforms, the circuit as gates, the layout as its two metals, a rack's front as its servers */
  const TEX = {};
  const screenTex = kind => {
    if (TEX[kind]) return TEX[kind];
    const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'), R = (i, k) => rnd(i * 7 + kind.length, k);
    x.fillStyle = kind === 'rack' ? '#1a1f28' : '#0d1522'; x.fillRect(0, 0, 256, 160);
    if (kind === 'code') for (let i = 0; i < 14; i++) { const ind = [0, 1, 2, 2, 1, 2, 3, 3, 2, 1, 0, 1, 2, 1][i] * 14; x.fillStyle = ['#7fb6ff', '#e8c56a', '#8fd6b0', '#c9d3e6'][i % 4]; x.fillRect(14 + ind, 10 + i * 10.5, 30 + R(i, 1) * 120, 5); }
    if (kind === 'wave') { x.lineWidth = 2; for (let r = 0; r < 6; r++) { x.strokeStyle = r % 2 ? '#5ee0a0' : '#7fb6ff'; x.beginPath(); let hi = R(r, 2) > 0.5; x.moveTo(8, 18 + r * 24 + (hi ? 0 : 12)); for (let k = 1; k < 16; k++) { const nx = 8 + k * 15.5; x.lineTo(nx, 18 + r * 24 + (hi ? 0 : 12)); if (R(r * 20 + k, 3) > 0.55) { hi = !hi; x.lineTo(nx, 18 + r * 24 + (hi ? 0 : 12)); } } x.stroke(); } }
    if (kind === 'gates') { x.strokeStyle = '#66d0e0'; x.lineWidth = 2; for (let i = 0; i < 6; i++) { const gx = 30 + (i % 3) * 76, gy = 30 + Math.floor(i / 3) * 70; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + 18, gy); x.arc(gx + 18, gy + 16, 16, -Math.PI / 2, Math.PI / 2); x.lineTo(gx, gy + 32); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(gx - 16, gy + 8); x.lineTo(gx, gy + 8); x.moveTo(gx - 16, gy + 24); x.lineTo(gx, gy + 24); x.moveTo(gx + 34, gy + 16); x.lineTo(gx + 58, gy + 16); x.stroke(); } }
    if (kind === 'layout') { for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(90,169,255,.85)'; x.fillRect(0, 8 + i * 13, 256, 5); } for (let i = 0; i < 18; i++) { x.fillStyle = 'rgba(224,136,79,.8)'; x.fillRect(6 + i * 14, 0, 5, 160); } for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(94,224,160,.7)'; x.fillRect(R(i, 4) * 240, R(i, 5) * 150, 10, 6); } }
    if (kind === 'rack') for (let u = 0; u < 20; u++) { x.fillStyle = u % 5 === 4 ? '#11151c' : '#2a313d'; x.fillRect(6, 4 + u * 7.6, 244, 6.4); for (let k = 0; k < 3; k++) { x.fillStyle = R(u * 3 + k, 6) > 0.3 ? (k === 0 ? '#45d08a' : '#5aa9ff') : '#333'; x.fillRect(224 + k * 8, 5.5 + u * 7.6, 4, 3); } x.fillStyle = '#151a22'; for (let h = 0; h < 22; h++) x.fillRect(14 + h * 9, 5 + u * 7.6, 5, 4.4); }
    if (kind === 'back') { x.fillStyle = '#161a21'; x.fillRect(0, 0, 256, 160); for (let i = 0; i < 4; i++) { x.fillStyle = '#232934'; x.beginPath(); x.arc(40 + i * 58, 40, 20, 0, 7); x.fill(); x.beginPath(); x.arc(40 + i * 58, 112, 20, 0, 7); x.fill(); }
      for (let k = 0; k < 16; k++) { x.strokeStyle = ['#3b8ad9', '#e0b43c', '#45d08a', '#c9d3e6'][k % 4]; x.lineWidth = 1.5; x.beginPath(); x.moveTo(228 + (k % 4) * 6, 0); x.lineTo(228 + (k % 4) * 6, 10 + k * 9); x.lineTo(8 + R(k, 7) * 200, 10 + k * 9); x.stroke(); } }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return (TEX[kind] = tx);
  };
  const scrM = kind => new THREE.MeshBasicMaterial({ map: screenTex(kind), color: night ? 0xffffff : 0xd8dde6, toneMapped: false });
  const sheet = (g, w, h, kind, x, y, z, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scrM(kind)); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); g.add(m); return m; };
  const CLOTHES = [0x3d5a80, 0x7a5c61, 0x4f6d5a, 0x8a7a5c, 0x5b5f73], SKIN = [0xc99a7a, 0x8d5f45, 0xe2bfa2, 0xa8745a];
  const headG = new THREE.SphereGeometry(0.11, 14, 10);
  const figure = (g, x, z, ry, k, seated) => { const f = group(g, x, 0, z, ry), cl = mat(CLOTHES[k % 5], { roughness: 0.8 });
    if (seated) { box(f, 0.34, 0.12, 0.42, mat(0x2b2f38, { roughness: 0.8 }), 0, 0.46, -0.12, 0.04); box(f, 0.36, 0.52, 0.22, cl, 0, 0.56, 0.08, 0.08); [-0.1, 0.1].forEach(a => box(f, 0.1, 0.46, 0.12, mat(0x2b2f38), a, 0, -0.3, 0.03, { cast: false })); box(f, 0.44, 0.1, 0.3, cl, 0, 0.82, -0.12, 0.04); }
    else { [-0.08, 0.08].forEach(a => box(f, 0.12, 0.8, 0.14, mat(0x2b2f38, { roughness: 0.8 }), a, 0, 0, 0.04)); box(f, 0.38, 0.58, 0.22, cl, 0, 0.8, 0, 0.08); [-0.24, 0.24].forEach(a => box(f, 0.09, 0.52, 0.1, cl, a, 0.84, 0, 0.03)); }
    const hd = new THREE.Mesh(headG, mat(SKIN[k % 4], { roughness: 0.7 })); hd.position.set(0, seated ? 1.22 : 1.52, seated ? 0.06 : 0); hd.castShadow = true; f.add(hd); return f; };
  const chair = (g, x, z, ry) => { const ch = group(g, x, 0, z, ry), dk = mat(P.dark, { roughness: 0.6 }), leg = metal(P.slate);
    cyl(ch, 0.24, 0.24, 0.07, dk, 0, 0.44, 0, 16); box(ch, 0.42, 0.48, 0.06, dk, 0, 0.5, 0.22, 0.03); cyl(ch, 0.03, 0.03, 0.42, leg, 0, 0.02, 0, 8);
    for (let k = 0; k < 5; k++) { const a = k * 1.2566; box(ch, 0.05, 0.03, 0.3, leg, Math.sin(a) * 0.14, 0, Math.cos(a) * 0.14, 0.01, { cast: false }).rotation.y = a; } return ch; };
  /* a workplace: a desk on panel legs, two screens on one stand, a keyboard, a chair, and often someone at it */
  let who = 0;
  const workdesk = (g, x, z, ry, kind, seated = true) => { const d = group(g, x, 0, z, ry), top = mat(night ? 0x8f8270 : 0xd2bf9f, { roughness: 0.55 }), leg = metal(P.slate);
    box(d, 1.6, 0.05, 0.8, top, 0, 0.72, 0, 0.02); [-0.74, 0.74].forEach(a => box(d, 0.05, 0.72, 0.7, leg, a, 0, 0, 0.01, { cast: false }));
    box(d, 0.3, 0.02, 0.18, leg, 0, 0.77, -0.25, 0.01, { cast: false }); box(d, 0.04, 0.2, 0.04, leg, 0, 0.77, -0.3, 0.005, { cast: false });
    [-0.33, 0.33].forEach((mx, i) => { const mon = group(d, mx, 0.94, -0.28, i ? -0.2 : 0.2); box(mon, 0.64, 0.4, 0.03, mat(P.dark, { roughness: 0.4 }), 0, 0, 0, 0.01, { cast: false }); sheet(mon, 0.6, 0.36, kind, 0, 0.2, 0.017); });
    box(d, 0.46, 0.015, 0.15, mat(P.dark), 0, 0.77, 0.12, 0.004, { cast: false });
    chair(d, 0, 0.62, Math.PI); if (seated) figure(d, 0, 0.62, Math.PI, who++, true); return d; };
  const plant = (g, x, z, s = 1) => { cyl(g, 0.22 * s, 0.17 * s, 0.4 * s, mat(night ? 0x6b5f52 : 0xb7a48d, { roughness: 0.8 }), x, 0, z, 12); const c = new THREE.Mesh(lump(), mat(T.leaf, { roughness: 0.8 })); c.scale.setScalar(0.42 * s); c.position.set(x, 0.75 * s, z); c.castShadow = true; g.add(c); };

  /* 1 design: the studio, a campus at the start of the loop. The design halls, a plaza, and on the road
     the mask house, where a finished design leaves as masks for the factory (the mask truck grows from it) */
  /* ---- buildings that open where they stand (docs/INTERACTION.md) ----
     each has a lid that lifts away, near walls that fade (south and west: the camera looks from the south-west), a
     little that hides (windows on the near walls), and an inside with its parts, each one picked as itself */
  const OPEN = {}, working = [];   /* what moves inside the open buildings, each frame */
  const opening = (id, o) => (OPEN[id] = Object.assign({ k: 0, want: 0, near: [], tools: {}, lidUp: 16, deco: null, inside: null, lid: null }, o));
  const ghost = (color = P.white, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.72, metalness: 0.02, transparent: true, opacity: 1 }, o));
  const panelM = () => mat(night ? 0x8d97a5 : 0xd9dbd8, { roughness: 0.55 });
  const ghosts = (O, ...walls) => walls.forEach(w => { w.userData.ghost = true; O.near.push(w); });
  const tagParts = (O, id, g) => { O.tools[id] = g; g.traverse(o => { if (o.isMesh) o.userData.part = id; }); };
  /* a screen: dark glass with a lit face (code, a waveform, gates, a layout) */
  const screen = (g, w, h, color, x, y, z, ry = 0) => { const m = box(g, w, h, 0.06, mat(color, { emissive: color, emissiveIntensity: night ? 0.9 : 0.45, roughness: 0.3 }), x, y, z, 0.02, { cast: false }); m.rotation.y = ry; return m; };
  const desk = (g, x, z, ry, face) => { const d = group(g, x, 0, z, ry); box(d, 1.8, 0.08, 0.9, mat(night ? 0x8f8270 : 0xcdb99a, { roughness: 0.6 }), 0, 0.74, 0, 0.02); [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].forEach(([a, b]) => box(d, 0.06, 0.74, 0.06, metal(P.slate), a, 0, b, 0.01, { cast: false }));
    box(d, 0.08, 0.35, 0.08, metal(P.slate), 0, 0.82, -0.25, 0.01, { cast: false }); screen(d, 1.1, 0.62, face, 0, 1.12, -0.25); cyl(d, 0.26, 0.26, 0.5, mat(P.dark, { roughness: 0.6 }), 0, 0, 0.75, 12); return d; };

  /* 1 design: the studio, a campus at the start of the loop. Its ground floor opens: where a job is written down,
     described, checked, turned into gates and laid out. On the road, the mask house, where a finished design leaves
     as masks for the factory (the mask truck grows from it) */
  const STUDIO_PARTS = [['need', -12, -3.6], ['logic', -6.4, -3.6], ['check', -0.6, -3.8], ['gates', -0.6, 1.8], ['layout', -6.4, 1.8]];
  { const g = place('studio'), O = opening('studio', { lidUp: 14 });
    flat(g, [[-20, 5], [12, 5], [14, 13], [-18, 13]], mat(P.wall, { roughness: 0.9 }), 0.03);
    /* the ground floor: a floor, the far walls, glass on the near side */
    box(g, 21.6, 0.1, 10.6, mat(night ? 0x3a3631 : 0xd9cfbf, { roughness: 0.55 }), -4, 0, -1, 0.02, { cast: false });
    box(g, 22, 3.6, 0.3, mat(P.white), -4, 0, -6.35, 0.06); box(g, 0.3, 3.6, 11, mat(P.white), 6.85, 0, -1, 0.06);
    const gl = { opacity: night ? 0.6 : 0.5, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.35 : 0, roughness: 0.08, metalness: 0.1 };
    ghosts(O, box(g, 22, 3.6, 0.2, ghost(P.glass, gl), -4, 0, 4.4, 0.04), box(g, 0.2, 3.6, 11, ghost(P.glass, gl), -14.9, 0, -1, 0.04));
    O.near.forEach(w => { w.userData.glass = gl.opacity; });
    O.deco = group(g, 0, 0, 0);
    for (let i = 0; i < 6; i++) box(O.deco, 2.4, 2.6, 0.06, mat(P.white, { roughness: 0.6 }), -13 + i * 3.6, 0.2, 4.52, 0.03, { cast: false });
    /* the upper floor and roof lift away together */
    const lid = O.lid = group(g, 0, 0, 0);
    box(lid, 24, 3.4, 11.6, mat(P.white), -4, 3.6, -1.2, 0.3);
    box(lid, 24.2, 0.5, 11.8, mat(A.roof, { roughness: 0.7 }), -4, 7, -1.2, 0.12);
    for (let i = 0; i < 9; i++) box(lid, 1.6, 1.2, 0.12, winCool, -14.2 + i * 2.55, 4.7, 4.66, 0.04, { cast: false });
    box(g, 9, 6.2, 7, mat(P.white), -20, 0, -6, 0.3); box(g, 9.2, 0.5, 7.2, mat(P.slate), -20, 6.2, -6, 0.1);
    for (let i = 0; i < 3; i++) box(g, 1.8, 3.6, 0.1, winCool, -22.6 + i * 2.6, 1.4, -2.45, 0.03, { cast: false });
    /* inside: one corner for each step of the design */
    const IN = O.inside = group(g, 0, 0, 0); IN.visible = false;
    const st = {}; STUDIO_PARTS.forEach(([id, x, z]) => { st[id] = group(IN, x, 0.1, z); });
    /* the job: a wall of notes, two people at it, and a table to talk round */
    box(st.need, 4, 2, 0.08, mat(0xf4f3ee, { roughness: 0.5 }), 0, 0.7, -2.6, 0.02);
    for (let i = 0; i < 14; i++) box(st.need, 0.34, 0.34, 0.03, mat([0xe8c86a, 0x9cc7e0, 0xe9a38c, 0xa8d4a0][i % 4]), -1.6 + (i % 7) * 0.52, 1.05 + Math.floor(i / 7) * 0.62 + rnd(i, 9) * 0.1, -2.54, 0.01, { cast: false });
    figure(st.need, -0.9, -1.9, Math.PI, 1, false); figure(st.need, 0.5, -1.7, Math.PI + 0.4, 2, false);
    cyl(st.need, 0.85, 0.85, 0.05, mat(night ? 0x8f8270 : 0xd2bf9f, { roughness: 0.55 }), 0, 0.72, 0.1, 28); cyl(st.need, 0.06, 0.1, 0.72, metal(P.slate), 0, 0, 0.1, 8);
    [0.4, 2.5, 4.6].forEach((a, i) => { chair(st.need, Math.cos(a) * 1.25, 0.1 + Math.sin(a) * 1.25, -a - Math.PI / 2); if (i === 1) figure(st.need, Math.cos(a) * 1.25, 0.1 + Math.sin(a) * 1.25, -a - Math.PI / 2, 3, true); });
    plant(st.need, 1.9, -2.2, 1.2);
    /* describe: four desks of people writing the circuit as text */
    [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.8], [0.9, 0.8]].forEach(([dx, dz], i) => workdesk(st.logic, dx, dz, i < 2 ? 0 : Math.PI, 'code', i !== 3));
    /* check: the machines that run every case, a wall of results, and someone watching them */
    [-1.2, 0, 1.2].forEach(dx => { box(st.check, 1, 2.2, 1, mat(P.rack, { roughness: 0.5 }), dx, 0, -1.6, 0.04); sheet(st.check, 0.9, 2, 'rack', dx, 1.1, -1.09); });
    box(st.check, 3.5, 1.5, 0.06, mat(P.dark), 0, 0.85, -2.6, 0.02); sheet(st.check, 3.36, 1.36, 'wave', 0, 1.6, -2.56); workdesk(st.check, 0, 0.7, Math.PI, 'wave');
    /* gates: the program's drawing of the circuit, on every screen */
    [[-0.9, -0.4], [0.9, -0.4], [0, 1.2]].forEach(([dx, dz], i) => workdesk(st.gates, dx, dz, i < 2 ? 0 : Math.PI, 'gates', i !== 1));
    /* layout: a table that is a screen, the tile's two metals on it, and two people leaning over it */
    box(st.layout, 3.2, 0.86, 1.8, mat(P.dark, { roughness: 0.4 }), 0, 0, 0, 0.06); sheet(st.layout, 3, 1.6, 'layout', 0, 0.87, 0, 0, -Math.PI / 2);
    figure(st.layout, -0.6, 1.25, Math.PI, 0, false); figure(st.layout, 1.0, -1.2, 0, 4, false); plant(st.layout, -2.2, -0.9);
    STUDIO_PARTS.forEach(([id]) => tagParts(O, id, st[id]));
    /* the mask house: a loading bay facing the road to the factory; once the studio is open it is the last step */
    const mh = group(g, 13, 0, 3);
    box(mh, 8, 4, 7, mat(P.white), 0, 0, 0, 0.3); box(mh, 8.1, 0.7, 7.1, mat(A.roof, { roughness: 0.7 }), 0, 3.45, 0, 0.1);
    box(mh, 0.12, 2.6, 3.6, mat(P.dark), 4.06, 0, 0, 0.02, { cast: false });
    for (let i = 0; i < 4; i++) pulses.push(box(mh, 0.9, 0.9, 0.06, glow([P.accent, P.good, P.warm, P.accent][i], 1.1), -2.6 + i * 1.7, 2, 3.56, 0.02, { cast: false }));
    tagParts(O, 'masks', mh);
    [[-15, 10], [-6, 11], [4, 10.5], [10, 11.5]].forEach(([x, z]) => tree(g, x, z, 0.9)); }
  /* 2 make: sand to crystal, and the factory */
  { const g = place('quarry');
    [[-6, 2, 3.2], [-2, -4, 2.6], [-9, -5, 2.2]].forEach(([x, z, r]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, r * 0.9, 20), mat(P.sand, { roughness: 1 })); m.position.set(x, r * 0.45, z); m.castShadow = m.receiveShadow = true; g.add(m); });
    box(g, 9, 0.4, 0.9, metal(P.metal), 0, 1.6, 0, 0.1).rotation.y = -0.25;
    [-3, 0, 3].forEach(x => box(g, 0.25, 1.6, 0.25, metal(P.slate), x, 0, 0, 0.05));
    box(g, 8, 3.2, 6, mat(P.white), 5, 0, 1, 0.3);
    [3, 5, 7].forEach(x => { cyl(g, 0.55, 0.55, 2.8, metal(P.metal), x, 3.2, 1); pulses.push(cyl(g, 0.3, 0.3, 0.3, glow(P.warm, 1.4), x, 6, 1)); });
    const ingot = cyl(g, 0.7, 0.7, 4, metal(0x8c95a3, { roughness: 0.2 }), 5, 0.7, 5.2); ingot.rotation.z = Math.PI / 2; ingot.position.y = 0.75; }
  /* the factory opens where it stands (docs/INTERACTION.md): come close and its roof lifts away and the near walls
     fade, and inside are the tools of the loop in their bays along an aisle, carriers riding the overhead rail
     between them. Every tool can be picked; its name stands over it once the factory is open. */
  const FAB = opening('fab', { lidUp: 20, oht: null, carriers: [] });
  const FAB_W = 26, FAB_D = 16, FAB_H = 6.4, FAB_T = 0.4;
  /* the six steps of the loop, in the order a wafer meets them: along the far row, then back along the near one */
  const FAB_TOOLS = [['clean', -8, -1], ['deposit', 0, -1], ['print', 8, -1], ['etch', 8, 1], ['implant', 0, 1], ['wires', -8, 1]];
  { const g = place('fab');
    /* the cleanroom floor, and the shell: the far walls stay, the near ones fade, the roof lifts */
    box(g, FAB_W - 0.6, 0.12, FAB_D - 0.6, mat(night ? 0x2b323d : 0xc6cbcf, { roughness: 0.45 }), 0, 0, 0, 0.02, { cast: false });
    box(g, FAB_W, FAB_H, FAB_T, mat(P.white), 0, 0, -FAB_D / 2 + FAB_T / 2, 0.08);
    box(g, FAB_T, FAB_H, FAB_D, mat(P.white), FAB_W / 2 - FAB_T / 2, 0, 0, 0.08);
    const south = box(g, FAB_W, FAB_H, FAB_T, ghost(), 0, 0, FAB_D / 2 - FAB_T / 2, 0.08), west = box(g, FAB_T, FAB_H, FAB_D, ghost(), -FAB_W / 2 + FAB_T / 2, 0, 0, 0.08);
    ghosts(FAB, south, west);
    FAB.deco = group(g, 0, 0, 0);
    for (let i = 0; i < 10; i++) box(FAB.deco, 1.6, 0.7, 0.1, winM, -10 + i * 2.3, 3, FAB_D / 2 + 0.05, 0.03, { cast: false });
    const lid = FAB.lid = group(g, 0, 0, 0);
    box(lid, FAB_W + 0.2, 0.6, FAB_D + 0.2, mat(A.roof, { roughness: 0.7 }), 0, FAB_H, 0, 0.2);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const x = -9 + i * 4.5, z = -3.6 + j * 7.2; box(lid, 3.4, 1.2, 3.2, mat(P.wall), x, FAB_H + 0.6, z, 0.15); spinning.push(cyl(lid, 1.1, 1.1, 0.2, metal(P.dark), x, FAB_H + 1.8, z, 20)); }
    /* outside: the gas annex, its tanks and the stacks */
    box(g, 10, 5, 8, mat(P.wall), -18.5, 0, 3, 0.3);
    [-21.5, -18.5, -15.5].forEach(x => cyl(g, 1.2, 1.2, 6, metal(P.metal), x, 0, -4));
    [[-22, 8], [-15, 8]].forEach(([x, z]) => { cyl(g, 0.45, 0.6, 12, mat(P.wall), x, 0, z, 16); cyl(g, 0.48, 0.48, 0.8, mat(A.trim), x, 12, z, 16); });

    /* ---- inside ---- */
    const IN = FAB.inside = group(g, 0, 0, 0); IN.visible = false;
    const shell = mat(night ? 0xc3cad4 : 0xf4f4f1, { roughness: 0.45 }), panel = mat(night ? 0x8d97a5 : 0xd9dbd8, { roughness: 0.55 }), dark = glass(P.dark, { opacity: 0.8 });
    const steel = metal(night ? 0x8a929e : 0xb9c0c8), run = glow(P.good, 0.9);
    box(IN, FAB_W - 3, 0.02, 2.4, mat(night ? 0x232a33 : 0xb3b9bf, { roughness: 0.4 }), 0, 0.12, 0, 0.01, { cast: false });
    const tool = (id, x, side) => {
      const tg = group(IN, x, 0.12, side * 4.3, side < 0 ? 0 : Math.PI);
      /* the front of every tool faces the aisle: a load port where carriers set down, and a light that says it runs */
      box(tg, 1.6, 0.9, 0.7, panel, -1.9, 0, 2.3, 0.06); box(tg, 0.5, 0.06, 0.5, steel, -1.9, 0.9, 2.3, 0.02, { cast: false });
      pulses.push(box(tg, 1.2, 0.08, 0.05, run, -1.9, 0.6, 2.67, 0.01, { cast: false }));
      if (id === 'clean') {
        /* a wet bench: a long cabinet under a glass hood, three wafers spinning in their bowls */
        box(tg, 6.2, 2.1, 2.4, shell, 0.4, 0, 0, 0.1); box(tg, 6, 0.8, 2.2, glass(P.glass, { opacity: 0.3 }), 0.4, 2.1, 0, 0.05);
        [-1.6, 0.4, 2.4].forEach(bx => { cyl(tg, 0.62, 0.62, 0.14, steel, bx, 2.1, 0.1, 24); spinning.push(cyl(tg, 0.5, 0.5, 0.05, glow(0x8cc8ff, night ? 0.8 : 0.35), bx, 2.25, 0.1, 24)); });
        box(tg, 6.2, 0.35, 0.08, dark, 0.4, 1.2, 1.22, 0.02, { cast: false });
      } else if (id === 'deposit' || id === 'etch') {
        /* a cluster tool: a robot in a six-sided hub hands each wafer to the chambers around it; deposition glows
           warm with heat, etch violet with plasma */
        const c = id === 'etch' ? 0xb48cff : 0xffab5c;
        cyl(tg, 1.35, 1.35, 1.5, shell, 0, 0, 0, 6); cyl(tg, 1.4, 1.4, 0.12, panel, 0, 1.5, 0, 6);
        [[-2.2, -0.4], [0, -2.3], [2.2, -0.4]].forEach(([cx, cz], i) => { cyl(tg, 0.95, 0.95, 2, shell, cx, 0, cz, 20); pulses.push(cyl(tg, 0.5, 0.5, 0.06, glow(c, night ? 1.4 : 0.8), cx, 2, cz, 20)); box(tg, 0.4, 0.5, 0.4, panel, cx * 0.55, 0.5, cz * 0.55, 0.04); });
        box(tg, 2, 1.7, 1, shell, 0, 0, 1.7, 0.08);
      } else if (id === 'print') {
        /* lithography: the scanner, the largest tool in the room, joined to its coating track; the bay is lit
           yellow, because the coating it prints into is changed by ordinary light */
        flat(IN, [[x - 4.6, side * 4.3 - 2.6], [x + 4.6, side * 4.3 - 2.6], [x + 4.6, side * 4.3 + 2.8], [x - 4.6, side * 4.3 + 2.8]], mat(night ? 0x4a4126 : 0xeee0a8, { roughness: 0.5, emissive: night ? 0x3a3014 : 0, emissiveIntensity: 0.6 }), 0.15);
        box(tg, 4.6, 3.3, 3.2, shell, 1.2, 0, -0.2, 0.15); box(tg, 4.62, 0.5, 3.22, panel, 1.2, 2.5, -0.2, 0.05, { cast: false });
        box(tg, 0.08, 1.5, 2, dark, 3.52, 0.8, -0.2, 0.02, { cast: false });
        box(tg, 2.4, 2.2, 3, panel, -2.5, 0, -0.2, 0.1); box(tg, 2.2, 0.3, 0.06, dark, -2.5, 1.5, 1.32, 0.02, { cast: false });
        pulses.push(box(tg, 8, 0.12, 0.3, glow(0xffd25a, night ? 1.3 : 0.7), 0, 5.6, 0, 0.02, { cast: false }));
      } else if (id === 'implant') {
        /* an ion implanter: a source, a magnet that bends the beam to pick one kind of atom, a long beamline, and the
           end station where the wafer waits */
        box(tg, 1.8, 2.4, 2, shell, -2.6, 0, -0.2, 0.1);
        const bl = cyl(tg, 0.32, 0.32, 3.8, steel, 0, 1.2, -0.2, 16); bl.rotation.z = Math.PI / 2; bl.position.set(0.1, 1.55, -0.2);
        box(tg, 1.1, 1.6, 1.6, mat(night ? 0x5d6878 : 0x7f8a99, { roughness: 0.4 }), -0.9, 0.7, -0.2, 0.08);
        const beam = box(tg, 3.6, 0.06, 0.06, glow(0x7fc4ff, night ? 1.6 : 1), 0.1, 1.52, 0.18, 0.01, { cast: false }); pulses.push(beam);
        box(tg, 2, 2.6, 2.2, shell, 2.6, 0, -0.2, 0.1); box(tg, 0.06, 1.2, 1.6, dark, 3.62, 0.8, -0.2, 0.02, { cast: false });
      } else if (id === 'wires') {
        /* copper: plating tanks fill the trenches, then a polisher grinds the wafer flat on a turning platen */
        box(tg, 3.4, 1.3, 2.8, shell, -1.4, 0, -0.2, 0.1);
        spinning.push(cyl(tg, 1.15, 1.15, 0.12, metal(night ? 0x77808c : 0xa7aeb6, { roughness: 0.25 }), -1.4, 1.3, -0.2, 32));
        const arm = box(tg, 0.2, 0.2, 1.6, steel, -0.3, 1.9, -0.2, 0.04); arm.rotation.y = 0.5; cyl(tg, 0.12, 0.12, 0.5, steel, 0.2, 1.4, -0.2, 8);
        [1.6, 2.9].forEach(bx => { box(tg, 1.1, 1.6, 2.2, shell, bx, 0, -0.2, 0.08); box(tg, 0.9, 0.06, 1.9, metal(0xb87333, { roughness: 0.3 }), bx, 1.6, -0.2, 0.02, { cast: false }); });
      }
      tagParts(FAB, id, tg);
    };
    FAB_TOOLS.forEach(([id, x, side]) => tool(id, x, side));
    /* the overhead rail: one loop over the aisle, past every tool's load port, and the carriers riding it */
    const railPts = [[-11, -2.0], [11, -2.0], [12.2, 0], [11, 2.0], [-11, 2.0], [-12.2, 0]].map(([x, z]) => new THREE.Vector3(x, 5.6, z));
    const rail = FAB.oht = new THREE.CatmullRomCurve3(railPts, true, 'catmullrom', 0.2);
    const railM = new THREE.Mesh(new THREE.TubeGeometry(rail, 120, 0.08, 6, true), steel); IN.add(railM);
    for (let i = 0; i < 8; i++) { const p = rail.getPointAt(i / 8); box(IN, 0.08, 0.8, 0.08, steel, p.x, 5.6, p.z, 0.01, { cast: false }); }
    for (let i = 0; i < 7; i++) {
      const c = new THREE.Group(); box(c, 0.8, 0.45, 0.6, shell, 0, -0.5, 0, 0.06); box(c, 0.05, 0.4, 0.05, steel, 0, -0.1, 0, 0.01, { cast: false });
      box(c, 0.6, 0.55, 0.5, glass(night ? 0x7fa6d6 : 0x9ab7cf, { opacity: 0.75 }), 0, -1.1, 0, 0.08); IN.add(c); c.position.copy(rail.getPointAt(i / 7)); FAB.carriers.push({ obj: c, u: i / 7 });
    }
  }
  /* 3 test: the hall where every chip is probed before it is cut and packed */
  { const g = place('test'), O = opening('test', { lidUp: 12 });
    box(g, 11.6, 0.1, 7.6, mat(night ? 0x2b323d : 0xe6e7e3, { roughness: 0.45 }), 0, 0, 0, 0.02, { cast: false });
    box(g, 12, 3.4, 0.3, mat(P.white), 0, 0, -3.85, 0.06); box(g, 0.3, 3.4, 8, mat(P.white), 5.85, 0, 0, 0.06);
    ghosts(O, box(g, 12, 3.4, 0.3, ghost(), 0, 0, 3.85, 0.06), box(g, 0.3, 3.4, 8, ghost(), -5.85, 0, 0, 0.06));
    O.deco = group(g, 0, 0, 0); for (let i = 0; i < 4; i++) box(O.deco, 1.8, 0.8, 0.08, winCool, -4 + i * 2.6, 1.8, 4.02, 0.02, { cast: false });
    const lid = O.lid = group(g, 0, 0, 0);
    box(lid, 12.1, 0.6, 8.1, mat(A.roof, { roughness: 0.7 }), 0, 3.4, 0, 0.1);
    pulses.push(cyl(lid, 1.6, 1.6, 0.12, glow(0x9aa6b8, 0.3, { metalness: 0.6, roughness: 0.15 }), -3, 4, 0, 40));
    /* inside: probers that bring each chip under the needles, the test head with its card of needles docked on one,
       and the wafer map on the wall, every chip green or red */
    const IN = O.inside = group(g, 0, 0, 0); IN.visible = false;
    const shell = mat(night ? 0xc3cad4 : 0xf4f4f1, { roughness: 0.45 }), steel = metal(night ? 0x8a929e : 0xb9c0c8);
    const pr = group(IN, -3.4, 0.1, -1.2);
    [-1.3, 1.3].forEach(dx => { box(pr, 1.8, 1.3, 1.8, shell, dx, 0, 0, 0.08); box(pr, 1.2, 0.05, 1.2, mat(P.dark, { roughness: 0.3 }), dx, 1.3, 0, 0.02, { cast: false }); cyl(pr, 0.45, 0.45, 0.04, metal(0x9aa3ad, { roughness: 0.2 }), dx, 1.35, 0, 28); pulses.push(box(pr, 0.8, 0.06, 0.04, glow(P.good, 0.9), dx, 1.05, 0.92, 0.01, { cast: false })); });
    const nd = group(IN, 0.6, 0.1, -1.2);
    box(nd, 1.8, 1.3, 1.8, shell, 0, 0, 0, 0.08); box(nd, 1.1, 2.2, 1.1, mat(P.rack, { roughness: 0.5 }), 1.7, 0, -0.2, 0.06);
    const arm = box(nd, 1.6, 0.2, 0.3, steel, 0.9, 2.1, -0.2, 0.04); arm.rotation.y = 0.2;
    box(nd, 1.3, 0.5, 1.3, mat(P.dark, { roughness: 0.4 }), 0, 1.35, 0, 0.06);
    for (let i = 0; i < 8; i++) box(nd, 0.02, 0.12, 0.02, metal(P.gold), -0.35 + i * 0.1, 1.28, 0, 0.002, { cast: false });
    const mp = group(IN, 3.7, 0.1, -3.55);
    box(mp, 2.6, 1.8, 0.08, mat(P.dark, { roughness: 0.4 }), 0, 0.9, 0, 0.02);
    for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) if (i * i + j * j <= 26) { const bad = rnd(i * 13 + j, 5) < 0.14; box(mp, 0.18, 0.13, 0.02, glow(bad ? P.bad : P.good, night ? 0.9 : 0.5), i * 0.2, 1.75 + j * 0.15, 0.06, 0.005, { cast: false }); }
    tagParts(O, 'prober', pr); tagParts(O, 'needles', nd); tagParts(O, 'map', mp); }
  /* 4 ship: the port; ships to the islands and to the world */
  { const g = place('port');
    box(g, 8, 1.4, 30, mat(P.wall), 4, -1, 0, 0.2);
    for (let i = 0; i < 18; i++) box(g, 1.2, 1.1, 2.6, mat(cols[i % 5]), -2 + (i % 3) * 1.3, Math.floor(i / 9) * 1.1, -8 + Math.floor(i % 9 / 3) * 3 + (i > 8 ? 9 : 0), 0.04);
    [-6, 6].forEach(z => { const c = group(g, 5, 0, z); [-1.4, 1.4].forEach(x => box(c, 0.4, 9, 0.4, mat(A.crane), x, 0, 0, 0.05)); box(c, 0.6, 0.6, 10, mat(A.crane), 0, 9, 3, 0.05); box(c, 3.4, 0.5, 0.5, mat(A.crane), 0, 9, 0, 0.05); });
    const moored = ship(14); moored.position.set(11.5, 0, -2); moored.rotation.y = Math.PI / 2; g.add(moored);
    const out = ship(18); scene.add(out); moving.push({ obj: out, path: route([[78, 16], [120, 30], [260, 40], [420, 60]]), speed: 0.016, ship: true });
    /* the packing hall on the quay opens like the others: the wafer is cut, each chip set on its package by its
       bumps and closed with a lid; then a last test, and the chips packed for the ships */
    const O = opening('port', { lidUp: 12 }), hx = -8, hz = 8, HW = 11, HD = 7, HH = 3.6;
    box(g, HW - 0.4, 0.1, HD - 0.4, mat(night ? 0x2b323d : 0xe6e7e3, { roughness: 0.45 }), hx, 0, hz, 0.02, { cast: false });
    box(g, HW, HH, 0.3, mat(P.white), hx, 0, hz - HD / 2 + 0.15, 0.06); box(g, 0.3, HH, HD, mat(P.white), hx + HW / 2 - 0.15, 0, hz, 0.06);
    ghosts(O, box(g, HW, HH, 0.3, ghost(), hx, 0, hz + HD / 2 - 0.15, 0.06), box(g, 0.3, HH, HD, ghost(), hx - HW / 2 + 0.15, 0, hz, 0.06));
    O.deco = group(g, 0, 0, 0); for (let i = 0; i < 4; i++) box(O.deco, 1.6, 0.7, 0.08, winCool, hx - 3.9 + i * 2.6, 1.9, hz + HD / 2 + 0.02, 0.02, { cast: false });
    O.lid = group(g, 0, 0, 0); box(O.lid, HW + 0.2, 0.6, HD + 0.2, mat(A.roof, { roughness: 0.7 }), hx, HH, hz, 0.1);
    const IN = O.inside = group(g, 0, 0, 0); IN.visible = false;
    const shell = mat(night ? 0xc3cad4 : 0xf4f4f1, { roughness: 0.45 }), steel = metal(night ? 0x8a929e : 0xb9c0c8);
    const part = (id, x, z) => group(IN, hx + x, 0.1, hz + z);
    const saw = part('saw', -3.6, -1.6); box(saw, 1.8, 1.1, 1.5, shell, 0, 0, 0, 0.08); box(saw, 1, 0.05, 1, mat(P.dark, { roughness: 0.3 }), 0, 1.1, 0, 0.02, { cast: false });
    const blade = cyl(saw, 0.32, 0.32, 0.03, metal(0xd0d6dc, { roughness: 0.15 }), 0.2, 1.5, 0, 28); blade.rotation.x = Math.PI / 2; spinning.push(blade); box(saw, 0.2, 0.5, 0.2, steel, 0.2, 1.1, -0.2, 0.02);
    const bum = part('bumps', -0.6, -1.6); box(bum, 2, 0.9, 1.5, shell, 0, 0, 0, 0.08); [-0.85, 0.85].forEach(x => box(bum, 0.14, 1.3, 0.14, steel, x, 0.9, -0.55, 0.02)); box(bum, 1.9, 0.18, 0.24, steel, 0, 2.1, -0.55, 0.02);
    box(bum, 0.3, 0.5, 0.3, panelM(), 0.2, 1.6, -0.55, 0.03); for (let i = 0; i < 6; i++) box(bum, 0.18, 0.04, 0.18, metal(P.gold), -0.6 + (i % 3) * 0.25, 0.92, 0.2 + Math.floor(i / 3) * 0.25, 0.01, { cast: false });
    const lidp = part('lid', 2.4, -1.6); box(lidp, 1.7, 1, 1.5, shell, 0, 0, 0, 0.08); box(lidp, 1.2, 0.6, 1, mat(P.rack, { roughness: 0.5 }), 0, 1.6, 0, 0.05); box(lidp, 0.1, 0.6, 0.1, steel, 0, 1, 0, 0.01);
    for (let i = 0; i < 3; i++) box(lidp, 0.36, 0.06, 0.36, metal(0x9aa3ad, { roughness: 0.2 }), -0.45 + i * 0.45, 1, 0.45, 0.01, { cast: false });
    const trays = part('trays', -2.6, 1.8); box(trays, 2, 1.6, 1.4, mat(P.rack, { roughness: 0.5 }), 0, 0, 0, 0.06); pulses.push(box(trays, 1.2, 0.06, 0.03, glow(P.good, 1), 0, 1.2, 0.72, 0.01, { cast: false }));
    for (let i = 0; i < 5; i++) box(trays, 0.9, 0.06, 0.6, mat(P.dark), 1.6, i * 0.12, 0, 0.01, { cast: false });
    const boxes = part('boxes', 1.4, 1.8); for (let i = 0; i < 7; i++) box(boxes, 0.7, 0.5, 0.6, mat(night ? 0x6b5a45 : 0xb89a73, { roughness: 0.8 }), -0.8 + (i % 3) * 0.75, Math.floor(i / 3) * 0.5, (i % 2) * 0.1, 0.02);
    [['saw', saw], ['bumps', bum], ['lid', lidp], ['trays', trays], ['boxes', boxes]].forEach(([id, gp]) => tagParts(O, id, gp)); }
  /* 5 use: the data centre */
  /* the nearer hall opens like the other buildings: rows of racks, and a server pulled out onto a cart */
  { const g = place('datacentre'), O = opening('datacentre', { lidUp: 12 });
    box(g, 24, 4, 6, mat(P.wall), 0, 0, -6, 0.3);
    for (let i = 0; i < 7; i++) { box(g, 2.4, 0.8, 2.4, mat(P.white), -9 + i * 3, 4, -6, 0.12); spinning.push(cyl(g, 0.9, 0.9, 0.15, metal(P.dark), -9 + i * 3, 4.8, -6, 18)); }
    for (let i = 0; i < 9; i++) box(g, 1.6, 0.5, 0.08, winCool, -9.6 + i * 2.4, 2.4, -2.98, 0.02, { cast: false });
    const z0 = 2, HH = 3.6;
    box(g, 23.6, 0.1, 5.6, mat(night ? 0x2b323d : 0xe6e7e3, { roughness: 0.45 }), 0, 0, z0, 0.02, { cast: false });
    box(g, 24, HH, 0.3, mat(P.wall), 0, 0, z0 - 2.85, 0.06); box(g, 0.3, HH, 6, mat(P.wall), 11.85, 0, z0, 0.06);
    ghosts(O, box(g, 24, HH, 0.3, ghost(P.wall), 0, 0, z0 + 2.85, 0.06), box(g, 0.3, HH, 6, ghost(P.wall), -11.85, 0, z0, 0.06));
    O.deco = group(g, 0, 0, 0); for (let i = 0; i < 9; i++) box(O.deco, 1.6, 0.5, 0.08, winCool, -9.6 + i * 2.4, 2.4, z0 + 3.02, 0.02, { cast: false });
    O.lid = group(g, 0, 0, 0); box(O.lid, 24.2, 0.4, 6.2, mat(A.roof, { roughness: 0.7 }), 0, HH, z0, 0.1);
    for (let i = 0; i < 7; i++) { box(O.lid, 2.4, 0.8, 2.4, mat(P.white), -9 + i * 3, HH + 0.4, z0, 0.12); spinning.push(cyl(O.lid, 0.9, 0.9, 0.15, metal(P.dark), -9 + i * 3, HH + 1.2, z0, 18)); }
    const IN = O.inside = group(g, 0, 0, 0); IN.visible = false;
    /* two rows of racks facing a cold aisle closed in glass, cable trays over them, and the cooling units at the end;
       every rack's front its servers, their lights blinking */
    const racks = group(IN, 0, 0.1, z0), leds = [], ledOn = glow(P.good, night ? 1.6 : 1), ledOff = mat(0x30353f);
    [-1.25, 1.25].forEach(rz => { const face = rz < 0 ? 1 : -1; for (let i = 0; i < 11; i++) { const x = -9 + i * 1.6;
      box(racks, 1.2, 2.4, 1.1, mat(P.rack, { roughness: 0.5 }), x, 0, rz, 0.04); sheet(racks, 1.06, 2.2, 'rack', x, 1.2, rz + face * 0.556, face < 0 ? Math.PI : 0); sheet(racks, 1.06, 2.2, 'back', x, 1.2, rz - face * 0.556, face < 0 ? 0 : Math.PI);
      for (let k = 0; k < 3; k++) { const l = box(racks, 0.06, 0.04, 0.02, ledOn, x - 0.42, 0.5 + k * 0.6 + rnd(i * 3 + k, 7) * 0.2, rz + face * 0.565, 0.005, { cast: false }); leds.push(l); } } });
    const gl2 = glass(P.glass, { opacity: night ? 0.22 : 0.18 });
    box(racks, 17.6, 0.04, 1.4, gl2, -1, 2.4, 0, 0.01, { cast: false }); [-9.9, 7.9].forEach(x => box(racks, 0.04, 2.4, 1.4, gl2, x, 0, 0, 0.01, { cast: false }));
    [-1.25, 1.25].forEach(rz => { box(racks, 17.6, 0.06, 0.3, mat(0xe0b43c, { roughness: 0.6 }), -1, 2.75, rz - 0.2, 0.01, { cast: false }); box(racks, 17.6, 0.06, 0.3, mat(P.dark), -1, 2.75, rz + 0.2, 0.01, { cast: false });
      for (let x = -9; x <= 7; x += 4) box(racks, 0.03, 0.5, 0.03, metal(P.slate), x, 2.8, rz, 0.005, { cast: false }); });
    [-1.3, 1.3].forEach(rz => { box(racks, 1.3, 2.3, 1.9, mat(P.white, { roughness: 0.6 }), 9.7, 0, rz, 0.06); for (let k = 0; k < 6; k++) box(racks, 0.04, 1.5, 1.5, mat(P.slate), 9.03, 0.5, rz - 0.6 + k * 0.24, 0.005, { cast: false }); });
    working.push({ place: 'datacentre', animate: t => { const s0 = Math.floor(t * 6); leds.forEach((l, i) => { l.material = rnd(i * 31 + s0, 8) > 0.25 ? ledOn : ledOff; }); } });
    /* a server pulled out onto a cart: its board, the big chip in the middle with memory stacked round it, rows of
       memory either side, fans at the front; its heat sink lifted off beside it */
    const cart = group(IN, -10.4, 0.1, z0 + 1.4);
    box(cart, 1.6, 0.06, 1, metal(P.slate), 0, 0.72, 0, 0.02); [[-0.72, -0.42], [0.72, -0.42], [-0.72, 0.42], [0.72, 0.42]].forEach(([a, b]) => { box(cart, 0.05, 0.72, 0.05, metal(P.slate), a, 0.06, b, 0.01, { cast: false }); cyl(cart, 0.05, 0.05, 0.04, mat(P.dark), a, 0, b, 10); });
    box(cart, 1.36, 0.08, 0.86, metal(0x9aa3ad, { roughness: 0.4 }), -0.05, 0.78, 0, 0.01);
    box(cart, 1.28, 0.02, 0.78, mat(night ? 0x1f4a37 : 0x2b6b52, { roughness: 0.6 }), -0.05, 0.86, 0, 0.005, { cast: false });
    box(cart, 0.34, 0.04, 0.34, mat(0x2a2f38), -0.05, 0.88, 0, 0.01); box(cart, 0.24, 0.03, 0.24, metal(0xc9ccd2, { roughness: 0.2 }), -0.05, 0.92, 0, 0.01);
    [[-0.27, 0], [0.17, 0], [-0.05, -0.22], [-0.05, 0.22]].forEach(([x, z]) => box(cart, 0.07, 0.06, 0.07, mat(P.dark), x, 0.9, z, 0.005, { cast: false }));
    for (let k = 0; k < 6; k++) { [-0.55, 0.45].forEach(x => box(cart, 0.03, 0.1, 0.5, mat(P.dark), x + (k % 3) * 0.04 * (x < 0 ? 1 : -1), 0.88, k < 3 ? -0.05 : 0.05, 0.003, { cast: false })); }
    for (let k = 0; k < 5; k++) cyl(cart, 0.06, 0.06, 0.12, mat(P.dark), -0.55 + k * 0.26, 0.88, 0.36, 14);
    const sink = group(cart, 0.55, 0.78, -0.3); box(sink, 0.3, 0.04, 0.3, metal(0xb9c0c8), 0, 0, 0, 0.01); for (let k = 0; k < 9; k++) box(sink, 0.3, 0.16, 0.012, metal(0xb9c0c8, { roughness: 0.3 }), 0, 0.04, -0.14 + k * 0.035, 0.002, { cast: false });
    tagParts(O, 'rack', racks); tagParts(O, 'board', cart);
    box(g, 6, 0.3, 10, mat(P.road), -17, 0, -2, 0.1);
    [[-18.5, -5], [-15.5, -5], [-18.5, -1], [-15.5, -1]].forEach(([x, z]) => { box(g, 2, 2, 1.6, mat(P.slate), x, 0.3, z, 0.1); for (let k = 0; k < 3; k++) cyl(g, 0.12, 0.12, 0.8, mat(P.white), x - 0.5 + k * 0.5, 2.3, z, 8); }); }
  /* trucks carrying wafers round the loop */
  for (let i = 0; i < 3; i++) onLoop(truck(A.box[i]), i / 3, 0.012, 0.7);

  /* ---- the Lab: the shared computer, one floor per piece, a crane, and the open port where AI agents dock ---- */
  const lab = place('lab');
  box(lab, 16, 0.3, 14, mat(P.road), 0, 0, 0, 0.1);
  const crane = group(lab, 6.5, 0, -3); box(crane, 0.5, 18, 0.5, mat(A.crane), 0, 0, 0, 0.05); const jib = group(crane, 0, 18, 0); box(jib, 12, 0.5, 0.5, mat(A.crane), -3, 0, 0, 0.05); box(jib, 0.3, 4, 0.3, metal(P.dark), -7, -4, 0, 0.02); spinning.push({ jib });
  const floors = group(lab, -1.5, 0.3, 0);
  const dock = group(lab, 4, 0, 18); box(dock, 3, 0.6, 9, mat(P.wall), 0, -0.4, 0, 0.1); box(dock, 0.3, 3, 0.3, metal(P.metal), 0, 0.2, 4, 0.02); pulses.push(cyl(dock, 0.3, 0.3, 0.3, glow(P.accent, 1.6), 0, 3.2, 4));
  for (let i = 0; i < 2; i++) { const b = new THREE.Group(); box(b, 3, 0.8, 1.4, mat(P.white), 0, -0.3, 0, 0.3); box(b, 1, 0.5, 0.9, glow(P.accent, 1.2), 0.2, 0.5, 0, 0.15); scene.add(b);
    moving.push({ obj: b, path: route([[-30 + i * 70, 120], [-10 + i * 30, 76], [10, 54], [10, 52.5]]), speed: 0.025, ship: true, u: i * 0.5, bounce: true }); }
  /* ---- the makers' village: workshops (community designs) and plots (open jobs, engines to write) ---- */
  const village = place('village');
  /* the village grows by rows: six plots across, and as many rows as the ledger needs (the first four fit its ground) */
  const SLOT = i => [-12.5 + (i % 6) * 5, -6 + Math.floor(i / 6) * 6.5], SLOTS = { length: 36 };
  const slotsG = group(village, 0, 0, 0);

  /* ---- the islands across the sea ---- */
  const phones = place('phones'), cars = place('cars'), idea = place('idea');
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; house(phones, Math.cos(a) * 12, Math.sin(a) * 9, -a, A.tile, false); }
  box(phones, 5, 10, 5, mat(P.wall), 0, 0, 0, 0.3); cyl(phones, 0.2, 0.5, 15, metal(P.metal), 7, 0, -4, 8);
  const carLoop = ribbon(scene, ISLE(158, 150, 18, 8), 3, roadM, 0.05, true);
  box(cars, 14, 5, 9, mat(P.white), 0, 0, 0, 0.4); box(cars, 14.1, 0.6, 9.1, mat(A.roof, { roughness: 0.7 }), 0, 4, 0, 0.1);
  { const f = group(idea, 0, 0, 0); box(f, 0.25, 6, 0.25, metal(P.metal), 0, -0.4, 0, 0.03); box(f, 3, 1.8, 0.1, mat(A.crane), 1.6, 3.6, 0, 0.03); }

  /* ---- what grows: one builder per growth (src/v2/game.js GROWTH); each starts hidden and grows in ---- */
  const GROWERS = {
    'studio-screen': g => { const s = box(g, 5, 2.8, 0.25, glow(P.accent, night ? 1.3 : 0.7), 0, 0.5, 0, 0.1); s.rotation.y = 0.5; box(g, 0.25, 0.6, 0.25, metal(P.slate), 0, 0, 0, 0.05); pulses.push(s); },
    /* your first masks leave the studio: a truck goes back and forth on the road between the mask house and the factory */
    'masks': () => { const tr = truck(A.truck); box(tr, 2.6, 0.12, 1.2, glow(P.accent, 1.2), -0.9, 2.15, 0, 0.03, { cast: false }); scene.add(tr); moving.push({ obj: tr, path: route([[-31, -27], [-29, -20], [-27.5, -13], [-22, -6], [-14, -2], [-8, -6]]), speed: 0.05, ship: true, bounce: true }); },
    'studio-wing': g => { box(g, 8, 4.5, 6, glass(P.glass, { opacity: 0.55, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.4 : 0 }), 0, 0, 0, 0.3); box(g, 8.2, 0.4, 6.2, mat(P.white), 0, 4.5, 0, 0.1); },
    'fab-trucks': () => { for (let i = 0; i < 4; i++) onLoop(truck(A.box[(i + 3) % 5]), 0.12 + i * 0.25, 0.012, -0.7); },
    'fab-line': g => { box(g, 22, 6, 7, mat(P.white), 0, 0, 0, 0.4); box(g, 22.2, 0.7, 7.2, mat(A.roof, { roughness: 0.7 }), 0, 4.8, 0, 0.15); for (let i = 0; i < 4; i++) { box(g, 3, 1, 3, mat(P.wall), -7.5 + i * 5, 6, 0, 0.12); spinning.push(cyl(g, 1, 1, 0.18, metal(P.dark), -7.5 + i * 5, 7, 0, 18)); } },
    'test-probe': g => { cyl(g, 0.3, 0.4, 6, metal(P.metal), 0, 0, 0, 10); for (let i = 0; i < 3; i++) pulses.push(box(g, 0.5, 0.5, 0.5, glow([P.good, P.warm, P.accent][i], 1.4), 0, 2 + i * 1.6, 0.35, 0.1)); },
    'test-hall': g => { box(g, 9, 3.2, 7, mat(P.white), 0, 0, 0, 0.3); box(g, 9.1, 0.4, 7.1, mat(A.roof, { roughness: 0.7 }), 0, 2.6, 0, 0.1); },
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

  /* No question floats over a place any more (docs/framework/rebuild.md, section 3): a question shown as a dot on a
     map was rejected once already. The questions are on the first page and on every page of #/read. */
  const beaconOrbs = [];
  /* ---- every place can be picked ---- */
  const pickable = () => { pick.length = 0; Object.values(G).forEach(g => g.traverse(o => { if (o.isMesh && !o.userData.nopick) { o.userData.place = g.userData.place; pick.push(o); } })); beaconOrbs.forEach(o => pick.push(o)); };
  pickable();
  /* ---- names, with the state of each station's challenges ---- */
  const HGT = { studio: 9, quarry: 7, fab: 10, test: 7, port: 11, datacentre: 7, lab: 22, village: 19, phones: 16, cars: 9, idea: 8 };
  const names = {};
  PLACES.forEach(p => { names[p.id] = L.add(G[p.id], new THREE.Vector3(0, HGT[p.id], 0), '', { cls: 'place3' + (p.far ? ' far' : ''), button: true, data: { place: p.id }, html: '', max: p.far ? Infinity : 520 }); });
  /* the factory's tools, drawn as the line draws them: on the first opening, each simple tool is replaced by the
     line's own machine (src/app/journey3d.js machineModel), so diving in shows the same machine, closer */
  const detailed = {}, IDLE = { s: { k: '' }, p: null }, LABEL_NUDGE = { needles: [-1.9, 1.3], lid: [1.1, 0.3], bumps: [-0.7, 0] };
  const lineCol = () => ({ lit: true, dark: night, warm: P.warm, cool: P.accent, grn: P.good, red: P.bad });
  const shade = g => g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  /* a part of a machine is picked by an unseen box round it, and stands where its box stands */
  const pickBox = (tg, B) => { const sz = new THREE.Vector3(), c = new THREE.Vector3(); B.getSize(sz); B.getCenter(c); const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(sz.x, 0.6), Math.max(sz.y, 0.6), Math.max(sz.z, 0.6)), new THREE.MeshBasicMaterial({ visible: false })); m.position.copy(c).sub(tg.position); tg.add(m); return m; };
  const DRESS = {
    fab: m => FAB_TOOLS.forEach(([id]) => { const tg = FAB.tools[id], mm = m.machineModel(id, lineCol()); if (!tg || !mm) return;
      while (tg.children.length) tg.remove(tg.children[0]);
      const g = mm.group; g.position.set(0, 0, 3.1); tg.add(g); shade(g);
      g.traverse(o => { o.userData.part = id; }); working.push({ place: 'fab', animate: mm.animate }); }),
    /* the test house and the port's hall hold the line's whole station, and their parts are the station's own */
    test: m => station(m, 'test', 'test', 1.6, [0, 0.2], { prober: 'prober', needles: 'needles', map: 'map' }),
    port: m => station(m, 'port', 'pkg', 0.95, [-8, 6.4], { saw: 'saw', bumps: 'bumps', lid: 'lid' })
  };
  function station(m, place, id, s, [cx, cz], partOf) {
    const O = OPEN[place], mm = m.machineModel(id, lineCol()); if (!O || !mm) return;
    const g = mm.group; g.scale.setScalar(s); const B = new THREE.Box3().setFromObject(g), c = new THREE.Vector3(); B.getCenter(c);
    g.position.set(cx - c.x, 0.1, cz - c.z); O.inside.add(g); shade(g); g.traverse(o => { o.userData.nopick = true; });
    Object.entries(partOf).forEach(([part, key]) => { const tg = O.tools[part], PB = mm.parts[key]; if (!tg || !PB) return;
      while (tg.children.length) tg.remove(tg.children[0]);
      const W = PB.clone().applyMatrix4(new THREE.Matrix4().makeScale(s, s, s)); W.translate(g.position); const wc = new THREE.Vector3(); W.getCenter(wc);
      tg.position.set(wc.x, 0.1, wc.z); const pb = pickBox(tg, W); pb.userData.part = part;
      /* its name stands just over it, nudged where two parts share one cabinet */
      const lb = toolNames[place + ':' + part], nd = LABEL_NUDGE[part] || [0, 0]; if (lb) lb.offset.set(nd[0], W.max.y + 0.5 + nd[1], 0); });
    working.push({ place, animate: mm.animate });
  }
  /* the ring of light under the part selected (placed again once a building's machines have arrived) */
  const placeRing = (place, part) => { const T = OPEN[place] && OPEN[place].tools[part]; if (!T) return; const v = new THREE.Vector3(); T.getWorldPosition(v); ring.position.set(v.x, 0.25, v.z); ring.scale.setScalar(RING_R[part] || RING_R[place] || 3.6); };
  const detail = place => { if (detailed[place] || !DRESS[place]) return; detailed[place] = import('../app/journey3d.js').then(m => { if (m.machineModel) { DRESS[place](m); pickable(); if (sel && sel.place === place && sel.part) placeRing(place, sel.part); } }).catch(() => { /* the simple ones stay */ }); };
  /* the tool selected stands on a ring of light */
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 48), new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0.85, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
  /* inside an open building, every part's name over it (shown only while the inside is) */
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1), PART_WORD = { test: id => cap(t('part.test.' + id)), port: id => cap(t('part.' + (['trays', 'boxes'].includes(id) ? 'ship' : 'pkg') + '.' + id)) }, PART_UP = { print: 4.2, masks: 5.4, need: 3.2, check: 3, prober: 2.4, needles: 3, map: 3.2, rack: 3.2, board: 1.8 };
  const RING_R = { studio: 2.6, test: 1.9, masks: 5.4, port: 1.5, rack: 2.4, board: 1.6 };
  const toolNames = {}; Object.entries(OPEN).forEach(([pl, O]) => Object.entries(O.tools).forEach(([id, g]) => { toolNames[pl + ':' + id] = L.add(g, new THREE.Vector3(0, PART_UP[id] || (pl === 'fab' ? 3.8 : 2.6), 0), (PART_WORD[pl] || (x => t('depth.' + x + '.name')))(id), { cls: 'tool3', button: true, data: { place: pl, part: id }, need: O.inside, max: 340 }); }));
  /* seen from far out, the island's places fold into one name */
  L.add(scene, new THREE.Vector3(0, 12, 0), t('map.home'), { cls: 'place3 far home', min: 560 });
  /* the number pins of the loop, and your chip on it */
  const pins = {};
  STOPS6.forEach(s => { const [x, z] = PINS[s], g = group(scene, x, 0, z); cyl(g, 0.12, 0.12, 3, metal(P.metal), 0, 0, 0, 8); pins[s] = L.add(g, new THREE.Vector3(0, 3.6, 0), '', { cls: 'pin3', button: true, data: { place: STOP_PLACE[s] }, max: 380 }); });
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

  /* ---- the minimap (docs/INTERACTION.md: an overview kept in step with the view): the island, its road, every
     place, and what the camera sees now; a place on it is picked as on the island, anywhere else flies there ---- */
  const mini = document.createElement('div'); mini.className = 'mini3'; mini.setAttribute('aria-label', t('mini.aria')); host.appendChild(mini);
  { const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]), M0 = { x0: -90, z0: -60, w: 180, h: 112 }, pt = ([x, z]) => (x - M0.x0).toFixed(1) + ',' + (z - M0.z0).toFixed(1);
    let h = '<svg viewBox="0 0 ' + M0.w + ' ' + M0.h + '" role="img" aria-hidden="true"><polygon class="isle" points="' + coast.filter((_, i) => i % 4 === 0).map(pt).join(' ') + '"/>';
    h += '<polyline class="road" points="' + loopPts.filter((_, i) => i % 3 === 0).concat([loopPts[0]]).map(pt).join(' ') + '"/><polygon class="view" points=""/></svg>';
    h += PLACES.filter(p => !p.far).map(p => '<button type="button" class="mdot" data-place="' + p.id + '" style="left:' + ((p.at[0] - M0.x0) / M0.w * 100).toFixed(1) + '%;top:' + ((p.at[1] - M0.z0) / M0.h * 100).toFixed(1) + '%" title="' + esc(t('map.' + p.id + '.t')) + '" aria-label="' + esc(t('map.' + p.id + '.t')) + '"></button>').join('');
    mini.innerHTML = h; mini.M0 = M0; }
  const miniView = mini.querySelector('.view');
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const footprint = () => { const out = []; for (const [cx, cy] of corners) { ray.setFromCamera(new THREE.Vector2(cx, cy), camera); const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(groundPlane, p)) { const d = ray.ray.direction; p.set(camera.position.x + d.x * 400, 0, camera.position.z + d.z * 400); } out.push([clamp(p.x, -400, 400), clamp(p.z, -400, 400)]); } return out; };
  mini.addEventListener('click', e => { if (e.target.closest('[data-place]')) return; const r = mini.getBoundingClientRect(), M0 = mini.M0; flyTo(M0.x0 + (e.clientX - r.left) / r.width * M0.w, M0.z0 + (e.clientY - r.top) / r.height * M0.h, Math.min(cam.d, 230)); on.interact && on.interact(); });

  /* names never sit on one another: where two meet, the one that matters less steps back until there is room (the
     selected part first, then the one pointed at, then the parts of an open building, then the places) */
  const declutter = () => {
    const els = [...Object.values(toolNames), ...Object.values(names), ...Object.values(pins)].map(lb => lb.el).filter(e => e && e.isConnected && e.offsetParent && e.style.opacity !== '0');
    const rank = e => (e.classList.contains('sel') ? 0 : e.classList.contains('on') ? 1 : e.classList.contains('tool3') ? 2 : e.classList.contains('place3') ? 4 : 3);
    els.sort((a, b) => rank(a) - rank(b)); const kept = [];
    for (const e of els) { const r = e.getBoundingClientRect(); if (!r.width) continue;
      const hit = kept.some(k => Math.min(k.right, r.right) - Math.max(k.left, r.left) > 2 && Math.min(k.bottom, r.bottom) - Math.max(k.top, r.top) > 2);
      e.classList.toggle('hush', hit); if (!hit) kept.push(r); } };

  /* ---- input ---- */
  const ptrs = new Map(); let downAt = null, moved = 0, pinch0 = null, hover = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const toNdc = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const ground = e => { toNdc(e); ray.setFromCamera(ndc, camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(groundPlane, p) ? p : null; };
  /* what is under the pointer: hidden things and the faded walls of an open building do not count; inside an open
     building, a tool is picked as itself */
  const seen = o => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
  const pickAt = e => { toNdc(e); ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(pick, false)) { const u = h.object.userData, open = !!OPEN[u.place] && OPEN[u.place].k > 0.5; if (!seen(h.object) || (u.ghost && open)) continue;
      return u.question ? { q: u.question } : { place: u.place, part: open && u.part ? u.part : null }; }
    return null; };
  /* what is selected (docs/INTERACTION.md): a place, and inside an open one a part; zooming further into it goes
     deeper, zooming far enough out leaves it */
  let sel = null, push = 0, pinchDeep = false;
  const deepAt = () => (!sel ? 0 : sel.part ? 40 : OPEN[sel.place] ? 0 : Math.max(38, placeAt(sel.place).d * 0.6));
  const leaveAt = () => placeAt(sel.place).d * 3.2;
  const deeper = () => { if (!sel || !on.deeper) return; const s0 = sel; push = 0; on.deeper(s0.place, s0.part); };
  const MAXD = innerWidth > 720 ? 820 : 1300;
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, g: ground(e) }); downAt = { x: e.clientX, y: e.clientY }; moved = 0; fly = null; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { dist: Math.hypot(a.x - b.x, a.y - b.y), d: cam.d }; } on.interact && on.interact(); });
  canvas.addEventListener('pointermove', e => {
    if (!ptrs.size) { const h = pickAt(e), id = h && (h.part ? 'part:' + h.part : h.place || h.q); if (id !== hover) { hover = id; canvas.style.cursor = id ? 'pointer' : ''; Object.entries(names).forEach(([k, lb]) => lb.el.classList.toggle('on', k === hover)); Object.entries(toolNames).forEach(([k, lb]) => lb.el.classList.toggle('on', 'part:' + k.split(':')[1] === hover && OPEN[k.split(':')[0]].k > 0.5)); } return; }
    const p = ptrs.get(e.pointerId); if (!p) return;
    moved += Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y); p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()], want = pinch0.d * pinch0.dist / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)); cam.d = clamp(want, 38, MAXD);
      if (!pinchDeep && sel && deepAt() && want < deepAt() * 0.8) { pinchDeep = true; deeper(); } return; }
    const g = ground(e); if (g && p.g) { const lim = cam.d > 300 ? 220 : 80; cam.x = clamp(cam.x + p.g.x - g.x, -lim, lim); cam.z = clamp(cam.z + p.g.z - g.z, -lim * 0.7, lim * 0.9); place2(); p.g = ground(e); }
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) { pinch0 = null; pinchDeep = false; } if (downAt && moved < 8 && !ptrs.size) { const h = pickAt(e); if (h && h.part) on.part && on.part(h.place, h.part); else if (h && h.place) on.place && on.place(h.place); else if (h && h.q) on.question && on.question(h.q); } downAt = null; };
  /* a double tap goes in: into a building (it opens), or deeper into what is already selected */
  canvas.addEventListener('dblclick', e => { const h = pickAt(e); if (!h || !h.place) return; if (sel && sel.place === h.place && (h.part || null) === (sel.part || null) && deepAt()) deeper(); });
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); fly = null; cam.d = clamp(cam.d * Math.exp(e.deltaY * 0.0012), 38, MAXD); on.interact && on.interact();
    /* zooming on into what is selected, past where the camera stops, goes deeper */
    if (e.deltaY < 0 && sel && deepAt() && cam.d <= deepAt() + 0.5) { push += -e.deltaY; if (push > 180) deeper(); } else if (e.deltaY > 0) push = 0; }, { passive: false });
  host.addEventListener('click', e => { const b = e.target.closest('[data-place],[data-q],[data-step],[data-job],[data-entry]'); if (!b) return; if (b.dataset.part) on.part && on.part(b.dataset.place, b.dataset.part); else if (b.dataset.entry) on.entry && on.entry(b.dataset.entry); else if (b.dataset.place) on.place && on.place(b.dataset.place); else if (b.dataset.step) on.place && on.place(STATION[b.dataset.step]); else if (b.dataset.job) on.job && on.job(b.dataset.job); else on.question && on.question(b.dataset.q); });

  /* ---- the state: what has grown, the community's pieces, where your chip is ---- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let slotLabels = [], villageSeen = null;
  function setState(st, animate) {
    /* growth */
    let grew = false;
    growing.forEach(gr => { if (st.grown.has(gr.id) && !gr.built) { GROWERS[gr.id](gr.g); gr.built = true; gr.g.visible = true; grew = true; gr.t0 = animate && !reduced() ? performance.now() : -1; if (gr.t0 < 0) gr.g.scale.setScalar(1); if (animate) sparkle(gr.g); } });
    /* names, with a flag for what is left to do */
    PLACES.forEach(p => { const s = st.places[p.id];
      const flag = s && s.total ? (s.done === s.total ? '<span class="flag done">✓</span>' : '<span class="flag">' + (s.total - s.done) + '</span>') : p.id === 'village' && st.jobList.length ? '<span class="flag job">' + st.jobList.length + '</span>' : '';
      names[p.id].el.innerHTML = esc(t('map.' + p.id + '.t')) + flag + '<span class="peek">' + esc(t('map.' + p.id + '.d')) + '</span>'; });
    /* your chip, at the pin of its step */
    const [x, z] = PINS[st.chipAt] || NEED_AT; tokenGoal = new THREE.Vector3(x + 3, 1.2, z + 2.4);
    STOPS6.forEach(s => { const full = !!st.steps[s] && st.steps[s].done === st.steps[s].total; pins[s].el.classList.toggle('full', full); pins[s].el.classList.toggle('here', s === st.chipAt); pins[s].el.innerHTML = (full ? '✓' : '') + (s === st.chipAt ? '<span class="you">' + esc(t('map.yourChip')) + '</span>' : ''); pins[s].el.setAttribute('aria-label', t('loop.at.' + s)); });
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
    /* a design stands as a workshop: lit while it holds a record, dark once another beats it, its roof grey and a red
       lamp beside it when a case has broken it; one of yours that is not in the ledger yet is only its outline */
    const items = st.designs.map(d => ({ kind: 'design', d })).concat(st.jobList.map(j => ({ kind: 'job', j })), st.engineList.map(e => ({ kind: 'engine', e })));
    const loud = st.loud || {};
    const seenNow = new Set(), vp = m => { m.userData.village = true; pulses.push(m); };
    for (let i = pulses.length - 1; i >= 0; i--) if (pulses[i].userData.village) pulses.splice(i, 1);
    items.slice(0, SLOTS.length).forEach((it, i) => {
      const [sx, sz] = SLOT(i), g = group(slotsG, sx, 0, sz); if (it.kind === 'design') g.scale.setScalar(0.8);
      box(g, it.kind === 'design' ? 5.5 : 4.4, 0.15, it.kind === 'design' ? 5.5 : 4.4, mat(it.kind === 'design' ? P.grass : P.sand), 0, 0, 0, 0.05, { cast: false });
      if (it.kind === 'design') {
        const d = it.d, stt = d.draft ? 'draft' : d.state; seenNow.add(d.id);
        if (d.draft) { [[new THREE.BoxGeometry(3, 2, 2.8), 1.1], [houseRoof, 2.1]].forEach(([geo, y]) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: P.accent })); e.position.y = y; g.add(e); }); }
        else house(g, 0, 0, 0, d.state === 'broken' ? P.bad : ({ example: P.accent, person: P.dark, ai: P.warm, both: P.sand, program: P.metal }[d.kind] || P.accent), d.state === 'holds');
        if (d.state === 'broken') { box(g, 0.18, 3.4, 0.18, metal(P.dark), 2.2, 0.15, 1.8, 0.02); vp(box(g, 0.5, 0.5, 0.5, glow(P.bad, 1.6), 2.2, 3.5, 1.8, 0.1, { cast: false })); }
        /* what it has survived: a small green light in front for every try that held */
        for (let k = 0; k < Math.min(d.tries || 0, 6); k++) vp(box(g, 0.34, 0.34, 0.34, glow(P.good, 1.3), -1.6 + k * 0.62, 0.15, 2.5, 0.08, { cast: false }));
        const lb = L.add(g, new THREE.Vector3(0, 4.6, 0), d.title, { cls: 'work3 ent ' + stt + (loud.kind === 'break' && loud.of === d.id ? ' loud' : ''), button: true, data: { entry: d.id }, max: 150 });
        lb.el.title = t('map.house.' + stt, { by: d.author }); slotLabels.push(lb);
        if (animate && villageSeen && !villageSeen.has(d.id)) sparkle(g);
      }
      else { box(g, 0.2, 2.4, 0.2, mat(0x7a5b40), -1.6, 0.15, 1.6, 0.02); box(g, 1.8, 1.1, 0.12, mat(it.kind === 'job' ? P.white : P.bad), -1.6, 2, 1.6, 0.03);
        const lb = L.add(g, new THREE.Vector3(-1.6, 3.6, 1.6), it.kind === 'job' ? '?' : '⚙', { cls: 'plot3' + (it.kind === 'engine' ? ' engine' : '') + (it.kind === 'job' && loud.kind === 'build' && loud.piece === it.j.need ? ' loud' : ''), button: true, data: it.kind === 'job' ? { job: it.j.need } : { place: 'lab' }, max: 260 });
        lb.el.title = it.kind === 'job' ? t('map.plot.job', { job: t('design.proj.' + it.j.p + '.t') }) : t('map.plot.engine'); slotLabels.push(lb); }
    });
    /* every case a break added to a check stands guard at the village's edge: a watchtower with its lamp lit
       (an outline, while the break is only yours) */
    (st.cases || []).slice(0, 6).forEach((c, i) => {
      const g = group(slotsG, -12.5 + i * 4.2, 0, -11); seenNow.add(c.id);
      box(g, 1, 6.4, 1, mat(P.white), 0, 0, 0, 0.1); box(g, 1.9, 0.3, 1.9, mat(P.slate), 0, 6.4, 0, 0.05); box(g, 1.2, 0.5, 1.2, mat(P.wall), 0, 0, 0, 0.05);
      vp(box(g, 0.8, 0.8, 0.8, glow(c.draft ? P.accent : P.good, 1.6), 0, 6.9, 0, 0.14, { cast: false }));
      const lb = L.add(g, new THREE.Vector3(0, 9.4, 0), '✓', { cls: 'plot3 guard' + (c.draft ? ' draft' : ''), button: true, data: { entry: c.of }, max: 260 });
      lb.el.title = t('map.tower', { piece: t('build.need.' + c.piece + '.t'), by: c.by }); slotLabels.push(lb);
      if (animate && villageSeen && !villageSeen.has(c.id)) sparkle(g);
    });
    /* a question someone asked stands at the village's edge as a lantern: warm while it calls, with a small light for
       each piece of work done for it. It never goes out: a question stays open. */
    (st.asks || []).slice(0, 6).forEach((a, i) => {
      const g = group(slotsG, 17.5, 0, 0.5 + i * 4.4); seenNow.add(a.q);
      box(g, 0.22, 3.6, 0.22, metal(P.dark), 0, 0, 0, 0.03); vp(box(g, 0.9, 0.9, 0.9, glow(P.warm, 1.5), 0, 3.6, 0, 0.2, { cast: false }));
      for (let k = 0; k < Math.min(a.work, 6); k++) vp(box(g, 0.3, 0.3, 0.3, glow(P.accent, 1.2), 0.8 + k * 0.55, 0.1, 0, 0.07, { cast: false }));
      const lb = L.add(g, new THREE.Vector3(0, 5.8, 0), '?', { cls: 'plot3 asked' + (a.draft ? ' draft' : '') + (loud.kind === 'ask' && loud.q === a.q ? ' loud' : ''), button: true, data: a.under ? { q: a.under } : { place: 'village' }, max: 260 });
      lb.el.title = t('map.asked', { by: a.by, q: a.words }); slotLabels.push(lb);
      if (animate && villageSeen && !villageSeen.has(a.q)) sparkle(g);
    });
    villageSeen = seenNow;
    if (grew) pickable();
  }
  /* sparkles where something grew */
  const sparks = [];
  function sparkle(g) {
    const p = new THREE.Vector3(); g.getWorldPosition(p);
    for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), glow(i % 2 ? P.warm : P.accent, 1.8, { transparent: true })); m.position.copy(p).add(new THREE.Vector3(0, 2, 0)); m.userData.v = new THREE.Vector3((rnd(i, 3) - 0.5) * 14, 6 + rnd(i, 5) * 10, (rnd(i, 7) - 0.5) * 14); m.userData.t = 0; scene.add(m); sparks.push(m); }
  }

  /* ---- the loop ---- */
  let raf = 0, last = performance.now(), W = 1, H = 1, running = true, frameN = 0, declutAt = 0;
  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; H = r.height; st.size(W, H); camera.aspect = W / Math.max(1, H); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  const easeBack = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000), tm = now / 1000; last = now;
    if (fly) { const k = ease(clamp((now - fly.t0) / fly.ms)); ['x', 'z', 'd', 'yaw', 'pitch'].forEach(q => { cam[q] = fly.from[q] + (fly.to[q] - fly.from[q]) * k; }); if (k >= 1) fly = null; }
    else { const want = cam.d > 400 ? 1.0 : cam.d > 90 ? 0.92 : 0.8; cam.pitch += (want - cam.pitch) * 0.08; }
    place2();
    /* the sun's shadows follow what is in view */
    const sp = Math.min(260, Math.max(120, cam.d * 0.9)), sc = sunL.sun.shadow.camera; if (Math.abs(sc.right - sp / 2) > 1) { Object.assign(sc, { left: -sp / 2, right: sp / 2, top: sp / 2, bottom: -sp / 2 }); sc.updateProjectionMatrix(); }
    sunL.sun.position.set(cam.x - sp * 0.55, sp * (night ? 0.9 : 0.66), cam.z + sp * 0.6);   /* a lower sun by day: longer, softer shadows */ sunL.sun.target.position.set(cam.x, 0, cam.z);
    growing.forEach(gr => { if (gr.t0 > 0) { const k = clamp((now - gr.t0) / 1300); gr.g.scale.setScalar(Math.max(0.001, easeBack(k))); if (k >= 1) gr.t0 = -1; } });
    for (let i = sparks.length - 1; i >= 0; i--) { const m = sparks[i]; m.userData.t += dt; m.userData.v.y -= 18 * dt; m.position.addScaledVector(m.userData.v, dt); m.rotation.y += dt * 4; m.material.opacity = Math.max(0, 1 - m.userData.t / 1.4); if (m.userData.t > 1.4) { scene.remove(m); sparks.splice(i, 1); } }
    /* the factory opens and closes with the camera */
    /* the buildings open and close with the camera */
    Object.entries(OPEN).forEach(([id, O]) => { if (O.want > 0) detail(id); });
    /* the machines work while you watch: plasma, beams, sprays, the polisher's head, the prober stepping */
    if (!reduced()) for (const w of working) if (OPEN[w.place].inside.visible) w.animate(tm, dt);
    Object.entries(OPEN).forEach(([id, O]) => { O.k += (O.want - O.k) * Math.min(1, dt * (reduced() ? 60 : 3.2)); const k = ease(clamp(O.k));
      O.lid.position.y = O.lidUp * k; O.lid.visible = k < 0.96; if (O.deco) O.deco.visible = k < 0.4; O.inside.visible = k > 0.02; names[id].show = k < 0.5;
      O.near.forEach(w => { w.material.opacity = (w.userData.glass || 1) * (1 - 0.9 * k); w.material.depthWrite = k < 0.5 && !w.userData.glass; w.castShadow = k < 0.5; }); });
    ring.visible = !!(sel && sel.part && OPEN[sel.place] && OPEN[sel.place].k > 0.4);
    if (FAB.inside.visible && !reduced()) FAB.carriers.forEach(c => { c.u = (c.u + dt * 0.03) % 1; c.obj.position.copy(FAB.oht.getPointAt(c.u)); const tg = FAB.oht.getTangentAt(c.u); c.obj.rotation.y = Math.atan2(-tg.z, tg.x); });
    /* pulling far enough out of what is selected leaves it */
    if (sel && !fly && cam.d > leaveAt()) { const was = sel; sel = null; Object.values(OPEN).forEach(O => { O.want = 0; }); on.leave && on.leave(was.place); }
    token.position.lerp(tokenGoal, Math.min(1, dt * 2.2)); token.position.y = 1.2 + Math.sin(tm * 2) * 0.25; token.rotation.y += dt * 0.8;
    if (!reduced()) {
      spinning.forEach((f, i) => { if (f.jib) f.jib.rotation.y = Math.sin(tm * 0.2) * 0.9; else if (f.hand) f.hand.rotation.z = -tm * 0.8; else f.rotation.y += dt * (2 + (i % 3)); });
      ripples.offset.set(tm * 0.004, tm * 0.0025);
      pulses.forEach((p, i) => { if (p.material.emissiveIntensity != null) p.material.emissiveIntensity = (night ? 1.2 : 0.6) * (0.75 + 0.25 * Math.sin(tm * 2 + i)); });
      bobbing.forEach(b => { if (b.ring !== undefined) { const u = (tm * 0.5 + b.ring / 3) % 1; b.obj.scale.setScalar(1 + u * 6); b.obj.material.opacity = 0.6 * (1 - u); } else b.obj.position.y = b.base + Math.sin(tm * 1.4 + b.k) * 0.4; });
      flows.forEach((m, i) => { const u = (tm * 0.018 + i / flows.length) % 1, p = loop.curve.getPointAt(u), tg = loop.curve.getTangentAt(u); m.position.set(p.x, 0.12, p.z); m.rotation.y = Math.atan2(-tg.z, tg.x); });
      moving.forEach(m => {
        if (m.ship) { m.u = (m.u || 0) + dt * m.speed; const u = m.bounce ? 1 - Math.abs(1 - (m.u % 2)) : m.u % 1, back = m.bounce && (m.u % 2) > 1; const p = m.path.getPointAt(u), q = m.path.getTangentAt(u); m.obj.position.set(p.x, 0, p.z); m.obj.rotation.y = Math.atan2(-q.z, q.x) + (back ? Math.PI : 0); return; }
        m.u = (m.u + dt * m.speed + 1) % 1; const p = m.curve.getPointAt(m.u), tg = m.curve.getTangentAt(m.u), n = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
        m.obj.position.set(p.x + n.x * m.lane, 0.05, p.z + n.z * m.lane); m.obj.rotation.y = Math.atan2(-tg.z, tg.x) + (m.speed < 0 ? Math.PI : 0);
      });
    }
    st.draw(scene, camera);
    L.update(camera, W, H);
    /* by the clock, not by frames, so a slow device does not leave names on one another for long */
    if (now - declutAt > 120) { declutAt = now; declutter(); }
    if ((frameN = (frameN + 1) % 6) === 0 && mini.offsetParent) { const M0 = mini.M0; miniView.setAttribute('points', footprint().map(([x, z]) => (x - M0.x0).toFixed(1) + ',' + (z - M0.z0).toFixed(1)).join(' ')); mini.querySelectorAll('.mdot').forEach(b => b.classList.toggle('sel', !!sel && b.dataset.place === sel.place)); }
  };
  raf = requestAnimationFrame(frame);
  place2();

  return {
    focus(id) {
      const p = placeAt(id); if (!p) return;
      /* the place sits in the upper part of the screen: the dock takes the lower part */
      /* an opened place is framed on its inside (the port's packing hall stands off its centre) */
      const off = { port: [-8, 8], datacentre: [0, 2], studio: [-4, -1] }[id] || [0, 0];
      /* on a phone an opened building is framed closer and lower, in the room between the bar and the card */
      const wide = innerWidth > 720, near = { fab: 1.3, studio: 1.15, test: 1.05, port: 1.05, datacentre: 1.2 }[id], nearP = { fab: 1.3, studio: 1.0, test: 1.0, port: 0.85, datacentre: 1.15 }[id];
      const d = p.d * (wide ? near || 1.6 : nearP || 2), upv = d * (wide ? 0.14 : id === 'village' ? 0.08 : nearP ? 0.17 : 0.24);
      flyTo(p.at[0] + off[0] + Math.sin(cam.yaw) * upv, p.at[1] + off[1] + Math.cos(cam.yaw) * upv, d);
    },
    overview() { const h = home(); flyTo(h.x, h.z, h.d); },
    selected: () => sel,
    /* where a place, or a part inside it, is on the screen now: the point a portal opens from (0 to 1 across, down) */
    screenOf(place, part) { const p = placeAt(place); if (!p) return null; const v = new THREE.Vector3(p.at[0], 2, p.at[1]); const T = part && OPEN[place] && OPEN[place].tools[part]; if (T) { T.getWorldPosition(v); v.y += 1; } v.project(camera); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }; },
    /* select a place, and inside an open one a part; the factory opens while it is selected */
    select(place, part) {
      sel = place ? { place, part: part || null } : null; push = 0; Object.entries(OPEN).forEach(([id, O]) => { O.want = id === place ? 1 : 0; });
      const T = place && part && OPEN[place] && OPEN[place].tools[part];
      Object.entries(toolNames).forEach(([k, lb]) => lb.el.classList.toggle('sel', !!T && k === place + ':' + part));
      if (T) { const v = new THREE.Vector3(), wide = innerWidth > 720; placeRing(place, part); T.getWorldPosition(v);
        const d = wide ? 48 : 64, upv = d * (wide ? 0.12 : 0.18); flyTo(v.x + Math.sin(cam.yaw) * upv, v.z + Math.cos(cam.yaw) * upv, d); }
    },
    /* the first visit opens on a wide shot of the sea and comes down to the island, turning toward it */
    intro() { if (reduced()) return; const h = home(); Object.assign(cam, { x: h.x + 70, z: h.z + 120, d: MAXD * 0.8, yaw: cam.yaw - 0.8, pitch: 1.08 }); place2();
      fly = { from: { ...cam }, to: { x: h.x, z: h.z, d: h.d, yaw: -0.42, pitch: 0.92 }, t0: performance.now(), ms: 2800 }; },
    /* a win lands: the camera leans in and settles back */
    punch() { if (reduced() || fly) return; const d0 = cam.d; cam.d *= 0.9; place2(); flyTo(cam.x, cam.z, d0, 700); },
    /* the hand-offs with the views below: dive close into a place before going inside, and start close to the
       place you come back from, then rise (no cut: the camera carries you in and out) */
    dive(id, part) { const p = placeAt(id); if (!p) return Promise.resolve(); const ms = reduced() ? 1 : 650, v = new THREE.Vector3(p.at[0], 0, p.at[1]); if (part && OPEN[id] && OPEN[id].tools[part]) OPEN[id].tools[part].getWorldPosition(v); flyTo(v.x, v.z, part ? 30 : Math.max(38, p.d * 0.55), ms); return new Promise(r => setTimeout(r, ms)); },
    from(id, part) { const p = placeAt(id); if (!p) return; fly = null; const v = new THREE.Vector3(p.at[0], 0, p.at[1]); if (OPEN[id]) { OPEN[id].want = OPEN[id].k = 1; if (part && OPEN[id].tools[part]) OPEN[id].tools[part].getWorldPosition(v); }
      Object.assign(cam, { x: v.x, z: v.z, d: part ? 32 : Math.max(38, p.d * 0.55), pitch: 0.8 }); place2(); },
    /* the archipelago: the islands where chips live, and the sea between */
    ecosystem() { if (innerWidth > 720) flyTo(106, 80, 800, 1500); else flyTo(-22, 166, 1250, 1500); },
    setState,
    pause() { running = false; cancelAnimationFrame(raf); },
    warm: () => st.warm(scene, camera),
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    camera
  };
}
