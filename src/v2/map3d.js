/* The chip world: the first page, drawn from the game (src/v2/game.js) and the community's plan.
   One island holds a chip's life as a loop road: the design studio, the factory (with the sand and crystal
   it starts from), the test hall, the port, the data centre; and back. Your chip stands on the road at the
   step you are on. The Lab in the south is where the community builds its shared computer, one floor per
   piece; the makers' village beside it holds a workshop for every community design and an empty plot for
   every open job. Across the sea, in an arc beyond the north shore: the islands a chip depends on (where chips are
   used, where a factory's machines and materials are made, where the power comes from) and a sandbank for what is
   not yet, joined by lanes, cables and a plane.
   What you finish grows the island (GROWERS). Drag, pinch or scroll; tap a place.
   World units: 1 = 10 metres. x east, z south, y up. Words: map.<place>.t / .d / .kind. */
import { THREE, PALETTES, theme, stage, light, mat, metal, glow, glass, box, cyl, group, flat, blob, ribbon, labels, clamp, ease, reduced, rnd } from './kit3d.js';
import { t } from '../core/i18n.js';
import { STEPS, STATION, GROWTH } from './game.js';
import { betPowerNow } from '../app/betscene.js';
import { furnisher, lump } from './furnish.js';
import { CORNERS, HOUSE } from '../data/studio.js';

/* where every place stands, and how close the camera comes */
export const PLACES = [
  { id: 'studio', at: [-48, -30], d: 76, r: 26 }, { id: 'quarry', at: [-62, -4], d: 56 }, { id: 'fab', at: [-8, -16], d: 72 },
  { id: 'test', at: [22, -2], d: 54 }, { id: 'port', at: [62, 6], d: 66 }, { id: 'datacentre', at: [36, -36], d: 64 },
  { id: 'lab', at: [6, 26], d: 62 }, { id: 'village', at: [-34, 24], d: 60 },
  { id: 'phones', at: [-62, -196], d: 110, far: true }, { id: 'cars', at: [228, -40], d: 110, far: true }, { id: 'idea', at: [180, -116], d: 90, far: true },
  { id: 'tools', at: [-160, -138], d: 100, far: true }, { id: 'materials', at: [-232, -46], d: 100, far: true }, { id: 'power', at: [92, -178], d: 100, far: true }
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
/* lump (a tree crown with an outline) is shared with the studio's furnishing (src/v2/furnish.js) */
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
  /* the grass up close: a fine speckle of lighter and darker blades over the colour, tiled, so the ground is not one
     smooth paint when the camera comes down */
  const tex = (() => { const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'), im = x.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = (j * N + i) * 4, r = (Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1, v = 0.86 + 0.14 * (0.6 * Math.abs(r) + 0.4 * noise2(i / 6, j / 6));
      im.data[k] = im.data[k + 1] = im.data[k + 2] = Math.round(v * 255); im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); const t2 = new THREE.CanvasTexture(cv); t2.wrapS = t2.wrapT = THREE.RepeatWrapping; t2.repeat.set(46, 30); t2.anisotropy = 4; return t2; })();
  const uv = g.attributes.uv; if (uv) for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 0.96, metalness: 0 }));
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
  /* everything that moves can be tapped and followed: a ship, the plane, a truck on the loop, a figure */
  const moverPick = [], tagMover = (obj, info) => { info.obj = obj; obj.traverse(o => { if (o.isMesh) { o.userData.mover = info; moverPick.push(o); } }); return obj; };
  let follow = null;
  const tokenPick = [];
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
  /* the shore: a line of foam where the water meets the wet sand, and rocks here and there along it */
  const foamM = new THREE.MeshBasicMaterial({ color: night ? 0x8fb0d0 : 0xffffff, transparent: true, opacity: night ? 0.45 : 0.75, depthWrite: false, side: THREE.DoubleSide });
  const foamR = ribbon(scene, grow(coast, 0.05).filter((_, i) => i % 2 === 0), 1.1, foamM, -0.46, true);
  const rockM = mat(night ? 0x3b4048 : 0x8d8f8c, { roughness: 0.9, flatShading: true }), rockG = new THREE.DodecahedronGeometry(1, 0);
  grow(coast, 0.028).forEach(([x, z], i) => { if (rnd(i, 31) > 0.16) return; for (let k = 0; k < 1 + Math.floor(rnd(i, 32) * 3); k++) { const r = new THREE.Mesh(rockG, rockM), sc = 0.5 + rnd(i * 3 + k, 33) * 0.9;
    r.scale.set(sc * 1.3, sc * 0.7, sc); r.position.set(x + (rnd(i + k, 34) - 0.5) * 2, -0.45 + sc * 0.2, z + (rnd(i + k, 35) - 0.5) * 2); r.rotation.set(rnd(i, 36) * 3, rnd(i, 37) * 6, 0); r.castShadow = true; r.receiveShadow = true; scene.add(r); } });
  /* the islands across the sea stand in an arc beyond the north shore, so from the island you see them on the horizon */
  const AT = id => placeAt(id).at;
  [['phones', 34], ['cars', 36], ['tools', 27], ['materials', 29], ['power', 24]].forEach(([id, r]) => island(ISLE(AT(id)[0], AT(id)[1], r), 60));
  flat(scene, blob(ISLE(AT('idea')[0], AT('idea')[1], 14, 7), 40), mat(T.sand, { roughness: 0.95 }), -0.45);

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
  /* the ground between: a footpath from every building's way in to the road, and car parks with their bays marked and
     some cars in them (docs/INTERACTION.md: grown up, not a toy; colour only where it means something) */
  const ENTRANCES = [[-50.6, -25.4], [-18.2, -7.9], [25.9, 2.1], [57.6, 17.5], [25.8, -30.9]];
  const nearRoad = ([x, z]) => loopPts.reduce((b, p) => (Math.hypot(p[0] - x, p[1] - z) < Math.hypot(b[0] - x, b[1] - z) ? p : b));
  const PATHS = ENTRANCES.map(e => [[e[0], e[1] + 1.4], nearRoad([e[0], e[1] + 1.4])]);
  const pathM = mat(night ? 0x46443f : 0xd8d1c0, { roughness: 0.95 });
  PATHS.forEach(([a, b]) => ribbon(scene, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], 1.3, pathM, 0.035));
  const segD2 = (x, z, [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9))); return Math.hypot(x - ax - u * dx, z - az - u * dz); };
  const CARS = [0x8e949b, 0x3d4652, 0xd9d9d4, 0x6b2f2f, 0x2f4a63, 0x56604f, 0x1f2329];
  const LOTS = [[-41, -20, 'x', 4], [37.5, -26.5, 'x', 5], [31.5, -3, 'z', 3]];
  const asphalt = mat(night ? 0x2a303a : 0x5d636c, { roughness: 0.92 }), lineM = mat(night ? 0x8a919c : 0xf1efe8, { roughness: 0.6 });
  LOTS.forEach(([cx, cz, along, n], li) => { const X = along === 'x', L = n * 2.7, D = 5.4, g = group(scene, cx, 0, cz);
    box(g, X ? L + 0.6 : D, 0.06, X ? D : L + 0.6, asphalt, 0, 0.02, 0, 0.02, { cast: false });
    for (let i = 0; i <= n; i++) { const o = -L / 2 + i * 2.7; box(g, X ? 0.1 : D - 0.6, 0.02, X ? D - 0.6 : 0.1, lineM, X ? o : 0, 0.085, X ? 0 : o, 0.005, { cast: false }); }
    for (let i = 0; i < n; i++) { if (rnd(i + li * 7, 41) < 0.3) continue; const o = -L / 2 + 1.35 + i * 2.7, c = group(g, X ? o : 0, 0.08, X ? 0 : o, X ? Math.PI / 2 : 0), col = mat(CARS[Math.floor(rnd(i + li * 7, 42) * CARS.length)], { roughness: 0.35, metalness: 0.4 });
      box(c, 1.9, 0.55, 3.9, col, 0, 0.18, 0, 0.18); box(c, 1.6, 0.48, 2.0, mat(night ? 0x2a3442 : 0x33404f, { roughness: 0.15, metalness: 0.4 }), 0, 0.72, -0.15, 0.16);
      [[-0.85, -1.25], [0.85, -1.25], [-0.85, 1.25], [0.85, 1.25]].forEach(([wx, wz]) => { const w = cyl(c, 0.32, 0.32, 0.22, mat(0x15181d, { roughness: 0.8 }), wx, 0.3, wz, 12); w.rotation.z = Math.PI / 2; w.position.y = 0.32; }); } });
  const inLot = (x, z) => LOTS.some(([cx, cz, along, n]) => { const hx = (along === 'x' ? n * 2.7 + 0.6 : 5.4) / 2 + 1.5, hz = (along === 'x' ? 5.4 : n * 2.7 + 0.6) / 2 + 1.5; return Math.abs(x - cx) < hx && Math.abs(z - cz) < hz; });
  const inPoly = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  /* where each place's square stands (what calls there, see squares() below); no tree grows on one */
  const SQUARE = { studio: [-50.3, -17.8], quarry: [-48, 3.2], fab: [-3, -4.2], test: [20, 5], port: [57.4, 22.6], datacentre: [50, -27], lab: [-5.5, 30] };
  const free = (x, z) => inPoly(coast, x, z) && !Object.values(SQUARE).some(([a, b]) => Math.hypot(a - x, (b - z) * (z > b ? 0.7 : 1)) < 6) && !PLACES.some(p => Math.hypot(p.at[0] - x, p.at[1] - z) < (p.r || 16)) && !loopPts.some(([a, b]) => Math.hypot(a - x, b - z) < 5) && !SPOKES.flat().some(([a, b]) => Math.hypot(a - x, b - z) < 4) && !PATHS.some(([a, b]) => segD2(x, z, a, b) < 2.2) && !inLot(x, z);
  /* groves, not a scatter: trees stand where a slow noise says the ground is wooded, thicker inland, in two kinds
     (pines and broadleaf), each one a little taller or darker than the next */
  const trees = []; for (let i = 0; i < 6000 && trees.length < 520; i++) { const x = -82 + rnd(i, 3) * 164, z = -56 + rnd(i, 7) * 104; if (free(x, z) && noise2(x / 22, z / 22) > 0.52 - 0.12 * rnd(i, 4)) trees.push([x, z, 0.65 + rnd(i, 9) * 0.6, rnd(i, 17)]); }
  /* no tree on a quay, in a yard or on a square of the islands across the sea (each [x, z, r], from the island's middle) */
  const along = (x, z, dx, dz, n, r) => Array.from({ length: n }, (_, k) => [x + dx * k * 3, z + dz * k * 3, r]);
  const KEEP = { phones: [[12, 10, 5.5], ...along(20, 2, 1, 0, 6, 4)], cars: [[6, 9.5, 5], ...along(-20, -2, -1, 0, 6, 4)], tools: [[-6, 9.5, 8], ...along(8, 12, 0.48, 0.88, 6, 4)], materials: along(16, 2, 1, 0, 6, 4), power: [[-6, 8, 6]] };
  [['phones', 15, 15, 110], ['cars', 15, 15, 110], ['tools', 15, 9, 50], ['materials', 17, 8, 50], ['power', 14, 7, 30]].forEach(([k, r0, dr, n], j) => { const c = placeAt(k).at; for (let i = 0; i < n; i++) { const a = rnd(i, 11 + j) * 6.28, r = r0 + rnd(i, 13 + j) * dr; const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.75; if ((KEEP[k] || []).some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr)) continue; trees.push([c[0] + x, c[1] + z, 0.55 + rnd(i, 5) * 0.5, rnd(i, 19 + j)]); } });
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
  const onLoop = (obj, u, speed, lane) => { scene.add(obj); tagMover(obj, { kind: 'truck' }); moving.push({ obj, curve: loop.curve, u, speed, lane, car: true }); };
  const route = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));

  /* ---- the stations of the loop ---- */
  /* ---- furnishing, drawn small but whole: one set shared with the studio walked inside (src/v2/furnish.js), so the
     rooms seen from here are the rooms walked there ---- */
  const { sheet, plant, corner, CLOTHES, SKIN, headG } = furnisher(P, night, T.leaf);

  /* ---- fronts (the art pass): what makes a box read as a building from above. Windows in bands with frames, a sill
     and a head; a parapet round the roof; plant on the roof; a canopy and glass doors at the way in; a darker plinth
     at the foot of a wall; louvres where air goes in. On the near walls of a building that opens they hide with it. ---- */
  const frameM = mat(night ? 0x59616e : 0xebe9e3, { roughness: 0.5 }), trimM = mat(night ? 0x343c49 : 0x9aa2ab, { roughness: 0.6 });
  const plantM = mat(night ? 0x687282 : 0xc6cacf, { roughness: 0.5 });
  const band = (g, x, y, z, len, h, along, m = winCool, step = 1.3) => { const X = along === 'x', bx = (l, hh, px, py, pz, mm, t) => box(g, X ? l : t, hh, X ? t : l, mm, px, py, pz, 0.005, { cast: false });
    bx(len, h, x, y, z, m, 0.05); const n = Math.max(1, Math.round(len / step));
    for (let i = 0; i <= n; i++) { const o = -len / 2 + i * len / n; bx(0.09, h, X ? x + o : x, y, X ? z : z + o, frameM, 0.1); }
    bx(len + 0.2, 0.1, x, y - 0.1, z, frameM, 0.16); bx(len + 0.1, 0.07, x, y + h, z, frameM, 0.12); };
  const parapet = (g, cx, y, cz, w, d, h = 0.45, m = trimM) => { const t = 0.22;
    box(g, w, h, t, m, cx, y, cz - d / 2 + t / 2, 0.02); box(g, w, h, t, m, cx, y, cz + d / 2 - t / 2, 0.02); box(g, t, h, d, m, cx - w / 2 + t / 2, y, cz, 0.02); box(g, t, h, d, m, cx + w / 2 - t / 2, y, cz, 0.02); };
  const unit = (g, x, y, z, k = 1) => { box(g, 1.6 * k, 0.8 * k, 1.1 * k, plantM, x, y, z, 0.06); [-0.38, 0.38].forEach(o => cyl(g, 0.34 * k, 0.34 * k, 0.05, mat(P.dark, { roughness: 0.5 }), x + o * k, y + 0.8 * k, z, 16));
    box(g, 0.32 * k, 0.32 * k, 1.2 * k, metal(night ? 0x6c7584 : 0xb5bcc4), x + 1.0 * k, y, z, 0.03); };
  const entrance = (g, x, z, along, side = 1, w = 2.4) => { const X = along === 'x';
    box(g, X ? w + 0.8 : 1.3, 0.14, X ? 1.3 : w + 0.8, frameM, X ? x : x + side * 0.65, 2.7, X ? z + side * 0.65 : z, 0.03);
    box(g, X ? w : 0.08, 2.5, X ? 0.08 : w, winM, x, 0, z, 0.01, { cast: false }); box(g, X ? 0.08 : 0.1, 2.5, X ? 0.1 : 0.08, frameM, x, 0, z, 0.01, { cast: false });
    box(g, X ? w + 0.6 : 0.9, 0.1, X ? 0.9 : w + 0.6, trimM, X ? x : x + side * 0.45, 0, X ? z + side * 0.45 : z, 0.02, { cast: false }); };
  const plinth = (g, x, z, len, along) => box(g, along === 'x' ? len : 0.06, 0.45, along === 'x' ? 0.06 : len, trimM, x, 0, z, 0.005, { cast: false });
  const louvres = (g, x, y, z, len, h, along) => { const n = Math.round(h / 0.22); for (let i = 0; i < n; i++) box(g, along === 'x' ? len : 0.12, 0.07, along === 'x' ? 0.12 : len, trimM, x, y + i * 0.22, z, 0.005, { cast: false }); };
  const fins = (g, x0, x1, y, z, h, step = 1) => { for (let x = x0; x <= x1 + 1e-6; x += step) box(g, 0.12, h, 0.34, trimM, x, y, z, 0.01, { cast: false }); };

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
  /* the corners in the room, in the order of the design's steps along it, from the studio's one plan (src/data/studio.js);
     the last, the masks, is the mask house beside it */
  const STUDIO_PARTS = CORNERS.filter(c => !c.house).map(c => [c.id, c.at[0], c.at[1]]);
  { const g = place('studio'), O = opening('studio', { lidUp: 14 });
    flat(g, [[-20, 5], [12, 5], [14, 13], [-18, 13]], mat(P.wall, { roughness: 0.9 }), 0.03);
    /* the ground floor: a floor, the far walls, glass on the near side */
    box(g, 21.6, 0.1, 10.6, mat(night ? 0x3a3631 : 0xd9cfbf, { roughness: 0.55 }), -4, 0, -1, 0.02, { cast: false });
    box(g, 22, 3.6, 0.3, mat(P.white), -4, 0, -6.35, 0.06); box(g, 0.3, 3.6, 11, mat(P.white), 6.85, 0, -1, 0.06);
    const gl = { opacity: night ? 0.6 : 0.5, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.35 : 0, roughness: 0.08, metalness: 0.1 };
    ghosts(O, box(g, 22, 3.6, 0.2, ghost(P.glass, gl), -4, 0, 4.4, 0.04), box(g, 0.2, 3.6, 11, ghost(P.glass, gl), -14.9, 0, -1, 0.04));
    O.near.forEach(w => { w.userData.glass = gl.opacity; });
    O.deco = group(g, 0, 0, 0);
    for (let i = 0; i < 7; i++) box(O.deco, 0.12, 3.5, 0.12, frameM, -14.8 + i * 3.6, 0, 4.52, 0.01, { cast: false });
    box(O.deco, 22, 0.12, 0.14, frameM, -4, 3.45, 4.52, 0.01, { cast: false }); entrance(O.deco, -2.6, 4.56, 'x', 1, 2.8);
    /* the upper floor and roof lift away together */
    const lid = O.lid = group(g, 0, 0, 0);
    box(lid, 24, 3.4, 11.6, mat(P.white), -4, 3.6, -1.2, 0.3);
    box(lid, 24.2, 0.5, 11.8, mat(A.roof, { roughness: 0.7 }), -4, 7, -1.2, 0.12);
    band(lid, -4, 4.4, 4.64, 22.4, 1.5, 'x', winCool, 1.6); band(lid, -16.04, 4.4, -1.2, 10.6, 1.5, 'z', winCool, 1.6);
    parapet(lid, -4, 7.5, -1.2, 24.2, 11.8); unit(lid, -11, 7.5, -3.5); unit(lid, -1, 7.5, -4.5); unit(lid, 4, 7.5, 0.5, 0.8);
    box(g, 9, 6.2, 7, mat(P.white), -20, 0, -6, 0.3); box(g, 9.2, 0.5, 7.2, mat(P.slate), -20, 6.2, -6, 0.1);
    for (let i = 0; i < 3; i++) box(g, 1.8, 3.6, 0.1, winCool, -22.6 + i * 2.6, 1.4, -2.45, 0.03, { cast: false });
    band(g, -24.56, 1.2, -6, 6.2, 1.4, 'z', winCool, 1.55); band(g, -24.56, 3.9, -6, 6.2, 1.4, 'z', winCool, 1.55); plinth(g, -24.53, -6, 7, 'z');
    parapet(g, -20, 6.7, -6, 9.2, 7.2, 0.4); unit(g, -21.5, 6.7, -7.5, 0.9);
    /* inside: one corner for each step of the design */
    const IN = O.inside = group(g, 0, 0, 0); IN.visible = false;
    const st = {}; STUDIO_PARTS.forEach(([id, x, z]) => { st[id] = group(IN, x, 0.1, z); });
    STUDIO_PARTS.forEach(([id]) => corner(st[id], id));
    STUDIO_PARTS.forEach(([id]) => tagParts(O, id, st[id]));
    /* the mask house: a loading bay facing the road to the factory; once the studio is open it is the last step */
    const mh = group(g, HOUSE.at[0], 0, HOUSE.at[1]);
    box(mh, 8, 4, 7, mat(P.white), 0, 0, 0, 0.3); box(mh, 8.1, 0.7, 7.1, mat(A.roof, { roughness: 0.7 }), 0, 3.45, 0, 0.1);
    box(mh, 0.12, 2.6, 3.6, mat(P.dark), 4.06, 0, 0, 0.02, { cast: false }); box(mh, 1.3, 0.12, 4.4, frameM, 4.65, 2.8, 0, 0.02);
    for (let i = 0; i < 9; i++) box(mh, 0.14, 0.05, 3.5, trimM, 4.13, 0.2 + i * 0.27, 0, 0.005, { cast: false });
    parapet(mh, 0, 4.15, 0, 8.1, 7.1, 0.35); unit(mh, -1.6, 4.15, -1.4, 0.8); band(mh, -4.05, 1.4, 0, 5.4, 1.1, 'z', winCool, 1.35); plinth(mh, -4.03, 0, 7, 'z');
    for (let i = 0; i < 4; i++) pulses.push(box(mh, 0.9, 0.9, 0.06, glow([P.accent, P.good, P.warm, P.accent][i], 1.1), -2.6 + i * 1.7, 2, 3.56, 0.02, { cast: false }));
    tagParts(O, 'masks', mh);
    [[-15, 10], [-10.5, 11.6], [-17, 12.5]].forEach(([x, z]) => tree(g, x, z, 0.9)); }
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
    band(FAB.deco, 1.5, 2.9, FAB_D / 2 + 0.06, 21, 0.9, 'x', winM, 2.1); band(FAB.deco, -FAB_W / 2 - 0.06, 2.9, 0, 13, 0.9, 'z', winM, 2.2);
    plinth(FAB.deco, 0, FAB_D / 2 + 0.04, FAB_W, 'x'); plinth(FAB.deco, -FAB_W / 2 - 0.04, 0, FAB_D, 'z'); entrance(FAB.deco, -10.2, FAB_D / 2 + 0.08, 'x', 1, 2.6);
    louvres(FAB.deco, 8, 0.7, FAB_D / 2 + 0.08, 6, 1.4, 'x');
    const lid = FAB.lid = group(g, 0, 0, 0);
    box(lid, FAB_W + 0.2, 0.6, FAB_D + 0.2, mat(A.roof, { roughness: 0.7 }), 0, FAB_H, 0, 0.2); parapet(lid, 0, FAB_H + 0.6, 0, FAB_W + 0.2, FAB_D + 0.2, 0.5);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const x = -9 + i * 4.5, z = -3.6 + j * 7.2; box(lid, 3.4, 1.2, 3.2, mat(P.wall), x, FAB_H + 0.6, z, 0.15); spinning.push(cyl(lid, 1.1, 1.1, 0.2, metal(P.dark), x, FAB_H + 1.8, z, 20)); }
    /* outside: the gas annex, its tanks and the stacks */
    box(g, 10, 5, 8, mat(P.wall), -18.5, 0, 3, 0.3); parapet(g, -18.5, 5, 3, 10, 8, 0.4); louvres(g, -23.56, 0.8, 3, 5, 2.6, 'z'); louvres(g, -18.5, 0.8, 7.06, 7, 2.6, 'x'); unit(g, -17, 5, 1.5, 0.9);
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
    O.deco = group(g, 0, 0, 0); band(O.deco, -1.6, 1.6, 4.06, 7.6, 1.0, 'x', winCool, 1.5); entrance(O.deco, 3.9, 4.06, 'x', 1, 2); plinth(O.deco, 0, 4.03, 12, 'x');
    band(O.deco, -6.06, 1.6, 0, 6, 1.0, 'z', winCool, 1.5); plinth(O.deco, -6.03, 0, 8, 'z');
    const lid = O.lid = group(g, 0, 0, 0);
    box(lid, 12.1, 0.6, 8.1, mat(A.roof, { roughness: 0.7 }), 0, 3.4, 0, 0.1); parapet(lid, 0, 4.0, 0, 12.1, 8.1, 0.35); unit(lid, 2.6, 4.0, 1.6, 0.8);
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
    O.deco = group(g, 0, 0, 0); band(O.deco, hx - 1.6, 1.8, hz + HD / 2 + 0.06, 7, 0.9, 'x', winCool, 1.4); entrance(O.deco, hx + 3.6, hz + HD / 2 + 0.06, 'x', 1, 2); plinth(O.deco, hx, hz + HD / 2 + 0.03, HW, 'x');
    box(O.deco, 0.1, 2.8, 3.2, mat(P.dark), hx - HW / 2 - 0.06, 0, hz, 0.01, { cast: false }); for (let i = 0; i < 10; i++) box(O.deco, 0.14, 0.05, 3.1, trimM, hx - HW / 2 - 0.13, 0.2 + i * 0.27, hz, 0.005, { cast: false });
    O.lid = group(g, 0, 0, 0); box(O.lid, HW + 0.2, 0.6, HD + 0.2, mat(A.roof, { roughness: 0.7 }), hx, HH, hz, 0.1); parapet(O.lid, hx, HH + 0.6, hz, HW + 0.2, HD + 0.2, 0.35); unit(O.lid, hx + 2.5, HH + 0.6, hz - 1.6, 0.8);
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
    fins(g, -11.5, 11.5, 0.3, -2.8, 3.3); parapet(g, 0, 4, -6, 24, 6, 0.35); louvres(g, -12.06, 0.6, -6, 4.5, 2.6, 'z');
    const z0 = 2, HH = 3.6;
    box(g, 23.6, 0.1, 5.6, mat(night ? 0x2b323d : 0xe6e7e3, { roughness: 0.45 }), 0, 0, z0, 0.02, { cast: false });
    box(g, 24, HH, 0.3, mat(P.wall), 0, 0, z0 - 2.85, 0.06); box(g, 0.3, HH, 6, mat(P.wall), 11.85, 0, z0, 0.06);
    ghosts(O, box(g, 24, HH, 0.3, ghost(P.wall), 0, 0, z0 + 2.85, 0.06), box(g, 0.3, HH, 6, ghost(P.wall), -11.85, 0, z0, 0.06));
    O.deco = group(g, 0, 0, 0); for (let i = 0; i < 8; i++) box(O.deco, 1.6, 0.5, 0.08, winCool, -7.2 + i * 2.4, 2.4, z0 + 3.02, 0.02, { cast: false });
    fins(O.deco, -8.5, 11.5, 0.3, z0 + 3.2, 3.0); entrance(O.deco, -10.2, z0 + 3.06, 'x', 1, 2); plinth(O.deco, 0, z0 + 3.03, 24, 'x'); louvres(O.deco, -12.06, 0.6, z0, 4.5, 2.6, 'z');
    O.lid = group(g, 0, 0, 0); box(O.lid, 24.2, 0.4, 6.2, mat(A.roof, { roughness: 0.7 }), 0, HH, z0, 0.1); parapet(O.lid, 0, HH + 0.4, z0, 24.2, 6.2, 0.35);
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

  /* ---- the islands across the sea: where chips are used, and where what a factory needs is made ----
     Each one is one kind of place the line depends on, drawn as grown up as the island's own: the phone makers' town,
     the car works, the machine makers, the materials works, the power island, and a sandbank for what is not yet. */
  const phones = place('phones'), cars = place('cars'), idea = place('idea'), tools = place('tools'), materials = place('materials'), power = place('power');
  const FACE = -0.42, paleM = mat(P.white, { roughness: 0.72 }), roofM = mat(A.roof, { roughness: 0.65 }), craneM = mat(A.crane, { roughness: 0.6 });
  const bandM = night ? glow(0x86a9c8, 0.32) : mat(0x4a5c70, { roughness: 0.2, metalness: 0.35 });
  /* an office tower: a pale core with a glass band at every floor and plant on its roof */
  const tower = (g, x, z, w, h, d, ry = 0) => { const tg = group(g, x, 0, z, ry); box(tg, w, h, d, paleM, 0, 0, 0, 0.12);
    for (let y = 1.1; y < h - 0.9; y += 1.6) box(tg, w + 0.06, 0.48, d + 0.06, bandM, 0, y, 0, 0.02, { cast: false });
    box(tg, w * 0.45, 0.7, d * 0.45, roofM, 0, h, 0, 0.08); return tg; };
  /* a works hall with a saw-tooth roof, its glazed sides turned to the sky */
  const toothG = {};
  const tooth = (s, d) => toothG[s + ':' + d] || (toothG[s + ':' + d] = (() => { const geo = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-s / 2, 0), new THREE.Vector2(s / 2, 0), new THREE.Vector2(s / 2, s * 0.42)]), { depth: d, bevelEnabled: false }); geo.translate(0, 0, -d / 2); return geo; })());
  const works = (g, x, z, w, d, h, ry = 0) => { const wg = group(g, x, 0, z, ry); box(wg, w, h, d, paleM, 0, 0, 0, 0.15); const n = Math.max(2, Math.round(w / 2.8)), s = w / n;
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(tooth(s, d - 0.1), roofM); m.position.set(-w / 2 + (i + 0.5) * s, h, 0); m.castShadow = m.receiveShadow = true; wg.add(m);
      box(wg, 0.06, s * 0.38, d - 0.3, winCool, -w / 2 + (i + 1) * s - 0.05, h + 0.02, 0, 0.01, { cast: false }); }
    box(wg, w + 0.08, 0.5, d + 0.08, trimM, 0, 0, 0, 0.04, { cast: false }); return wg; };
  /* a quay into the sea, with a crane over its end */
  const quay = (g, x, z, ry, len = 12, crane = true) => { const q = group(g, x, 0, z, ry); box(q, 4, 0.7, len, mat(P.wall, { roughness: 0.9 }), 0, -0.6, len / 2, 0.08);
    for (let k = 0; k < 4; k++) cyl(q, 0.12, 0.14, 0.3, metal(P.dark), 1.7, 0.1, 1.5 + k * (len - 3) / 3, 8);
    if (crane) { [[-1.4, len - 4.5], [1.4, len - 4.5], [-1.4, len - 1.5], [1.4, len - 1.5]].forEach(([a, b]) => box(q, 0.3, 7, 0.3, craneM, a, 0.1, b, 0.03));
      box(q, 3.4, 0.6, 0.6, craneM, 0, 7, len - 4.5, 0.04); box(q, 3.4, 0.6, 0.6, craneM, 0, 7, len - 1.5, 0.04); box(q, 0.7, 0.6, 12, craneM, 0, 7.5, len - 1, 0.04); box(q, 1.4, 1.1, 1.6, mat(P.white), 0, 8.1, len - 3, 0.1); }
    return q; };
  const crateM = mat(night ? 0x5d5446 : 0xc4ae88, { roughness: 0.85 }), wrapM = mat(night ? 0x8a929c : 0xe9ecef, { roughness: 0.45 });
  /* ships that are not all the same: a heavy-lift ship with a machine in crates, a gas carrier, a car carrier */
  const hull = (s, len, w = 3.4) => { box(s, len, 1.6, w, mat(A.hull), 0, -1, 0, 0.4); box(s, len * 0.96, 0.3, w - 0.2, mat(P.dark), 0, 0.6, 0, 0.1); box(s, 1.8, 2.6, w - 0.8, mat(P.white), len / 2 - 1.4, 0.9, 0, 0.1); };
  const liftShip = () => { const s = new THREE.Group(); hull(s, 12); box(s, 3, 2.2, 2.6, wrapM, -3, 0.9, 0, 0.08); box(s, 2.4, 1.8, 2.4, crateM, 0.4, 0.9, 0, 0.06); box(s, 0.3, 5.4, 0.3, craneM, 3.1, 0.9, 1.3, 0.03); return s; };
  const domeG = new THREE.SphereGeometry(1.15, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2);
  const gasShip = () => { const s = new THREE.Group(); hull(s, 13); for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(domeG, paleM); d.position.set(-4.6 + i * 2.35, 0.9, 0); d.castShadow = true; s.add(d); } box(s, 9.6, 0.12, 0.16, metal(P.metal), -1.2, 2.1, 0, 0.02, { cast: false }); return s; };
  const carShip = () => { const s = new THREE.Group(); hull(s, 13); box(s, 11.6, 3.4, 3.2, paleM, -0.6, 0.9, 0, 0.3); box(s, 11.6, 0.3, 3.24, bandM, -0.6, 3, 0, 0.02, { cast: false }); return s; };

  /* the phone makers' town: towers where phones are designed, a works where they are put together, masts that carry
     what they send, and a quay that takes them away (the tower and the mast are where what grows here is drawn) */
  box(phones, 5, 10, 5, paleM, 0, 0, 0, 0.3); for (let y = 1.4; y < 9; y += 1.8) box(phones, 5.06, 0.5, 5.06, bandM, 0, y, 0, 0.02, { cast: false });
  cyl(phones, 0.2, 0.5, 15, metal(P.metal), 7, 0, -4, 8); pulses.push(box(phones, 0.4, 0.4, 0.4, glow(P.bad, 1.4), 7, 15, -4, 0.1, { cast: false }));
  [[-7, -3, 4, 14, 4], [6.5, 4.5, 3.6, 8, 3.6], [-5, 6, 3.4, 7, 5], [-1, -8, 4.5, 11, 3.6], [8, -9, 3.2, 6, 3.2]].forEach(([x, z, w, h, d], i) => tower(phones, x, z, w, h, d, i * 0.2));
  works(phones, -2, 15, 15, 6, 3.4, FACE * 0.4); quay(phones, 20, 2, Math.PI / 2, 12);
  [-12, -6].forEach((x, i) => { cyl(phones, 0.14, 0.3, 11, metal(P.metal), x, 0, 12 + i * 3, 6); pulses.push(box(phones, 0.3, 0.3, 0.3, glow(P.bad, 1.3), x, 11, 12 + i * 3, 0.06, { cast: false })); });
  for (let i = 0; i < 8; i++) { const a = 2.3 + i / 8 * 2.4; house(phones, Math.cos(a) * 16, Math.sin(a) * 11, -a, A.tile, i % 3 === 0); }
  /* the car works: the hall cars are built in, a paint shop with its stacks, a yard of new cars, charging bays, and
     the test track round it all (cars drive it once the car chip has been made) */
  const carLoop = ribbon(scene, ISLE(AT('cars')[0], AT('cars')[1], 18, 8), 3, roadM, 0.05, true);
  box(cars, 14, 5, 9, paleM, 0, 0, 0, 0.4); box(cars, 14.1, 0.6, 9.1, roofM, 0, 4, 0, 0.1); for (let k = 0; k < 6; k++) box(cars, 1.6, 2.6, 0.08, mat(P.slate), -5 + k * 2, 0.4, 4.52, 0.02, { cast: false });
  works(cars, -3, -9, 10, 5, 3, 0); [-5, -2].forEach(x => cyl(cars, 0.35, 0.4, 7, mat(P.white), x, 0, -12.4, 10));
  { const yard = group(cars, 4, 0, -10); box(yard, 9, 0.06, 6.5, mat(P.road), 0, 0.02, 0, 0.05, { cast: false }); for (let i = 0; i < 10; i++) { const c = carModel(cols[i % 5]); c.scale.setScalar(0.55); c.position.set(-3.4 + (i % 5) * 1.7, 0.08, i < 5 ? -1.6 : 1.6); c.rotation.y = Math.PI / 2; yard.add(c); } }
  { const cb = group(cars, 10.5, 0, 5); box(cb, 6, 0.2, 3, roofM, 0, 2.6, 0, 0.05); [[-2.8, -1.3], [2.8, -1.3], [-2.8, 1.3], [2.8, 1.3]].forEach(([a, b]) => box(cb, 0.18, 2.6, 0.18, metal(P.slate), a, 0, b, 0.02));
    for (let k = 0; k < 3; k++) { box(cb, 0.4, 1.1, 0.3, mat(P.white), -2 + k * 2, 0, -1.1, 0.05); pulses.push(box(cb, 0.3, 0.12, 0.05, glow(P.good, 1.3), -2 + k * 2, 0.8, -0.94, 0.01, { cast: false })); } }
  quay(cars, -20, -2, -Math.PI / 2, 14, false);
  /* the machine makers: a long clean works where the factory's machines are put together, its offices, the machines
     leaving in crates, and the heavy crane that lifts them aboard */
  works(tools, -2, -2, 20, 8, 5, FACE * 0.3); tower(tools, 11, 4, 5, 7, 4, FACE * 0.3);
  { const fr = group(tools, -2, 0, 2.2, FACE * 0.3); for (let k = 0; k < 13; k++) box(fr, 0.12, 4.6, 0.3, frameM, -9.6 + k * 1.6, 0.2, 0, 0.02, { cast: false }); }
  { const yd = group(tools, -6, 0, 9.5, FACE * 0.3); box(yd, 12, 0.06, 6, mat(P.road), 0, 0.02, 0, 0.05, { cast: false }); [[-4.2, -1.2, wrapM, 3, 2.4, 2.4], [-1, -1.2, crateM, 2.6, 2, 2.2], [2, -1.2, crateM, 2.2, 1.8, 2], [-3.4, 1.6, crateM, 2.4, 1.6, 2], [0, 1.6, wrapM, 2.8, 2.2, 2.2]].forEach(([x, z, m, w, h, d]) => box(yd, w, h, d, m, x, 0.08, z, 0.06)); }
  quay(tools, 8, 12, 0.5, 12);
  /* the materials works: a hall where crystals are grown, its pullers standing out of the roof; tanks of gas and
     chemicals joined by a pipe rack; a heap of the purest sand */
  { const ch = group(materials, -4, 0, -2, FACE * 0.3); box(ch, 10, 7, 6, paleM, 0, 0, 0, 0.2); box(ch, 10.1, 0.4, 6.1, roofM, 0, 7, 0, 0.05);
    for (let k = 0; k < 4; k++) { cyl(ch, 0.45, 0.45, 2.4, metal(0xb8bec6, { roughness: 0.3 }), -3.6 + k * 2.4, 7.2, 0, 14); pulses.push(cyl(ch, 0.3, 0.3, 0.16, glow(P.warm, 1.4), -3.6 + k * 2.4, 9.6, 0, 14)); }
    for (let k = 0; k < 6; k++) box(ch, 1.1, 0.6, 0.08, winM, -3.8 + k * 1.5, 4.6, 3.02, 0.02, { cast: false }); }
  const sphG = new THREE.SphereGeometry(2.1, 20, 14);
  [[8, -6], [12.6, -4], [9.4, -0.6]].forEach(([x, z]) => { const s = new THREE.Mesh(sphG, paleM); s.position.set(x, 3.2, z); s.castShadow = s.receiveShadow = true; materials.add(s); for (let k = 0; k < 4; k++) box(materials, 0.18, 1.6, 0.18, metal(P.slate), x + Math.cos(k * 1.57 + 0.8) * 1.4, 0, z + Math.sin(k * 1.57 + 0.8) * 1.4, 0.02); });
  for (let k = 0; k < 3; k++) { const c = cyl(materials, 1, 1, 6, paleM, -2 + k * 2.4, 1.1, 8, 16); c.rotation.x = Math.PI / 2; c.position.z = 8; c.position.y = 1.1; }
  { const pr = group(materials, 2.5, 0, 3.5, 0.5); for (let k = 0; k < 5; k++) box(pr, 0.16, 2.2, 0.16, metal(P.slate), -6 + k * 3, 0, 0, 0.02); for (let j = 0; j < 3; j++) { const p = cyl(pr, 0.12, 0.12, 12.4, metal(j === 1 ? A.crane : 0xa7adb5, { roughness: 0.4 }), 0, 2.3, -0.3 + j * 0.3, 8); p.rotation.z = Math.PI / 2; p.position.set(0, 2.3, -0.3 + j * 0.3); } }
  { const cone = new THREE.Mesh(new THREE.ConeGeometry(3, 2.4, 18), mat(night ? 0x6d6656 : 0xe6dcc6, { roughness: 1 })); cone.position.set(-12, 1.2, 7); cone.receiveShadow = cone.castShadow = true; materials.add(cone); }
  quay(materials, 16, 2, Math.PI / 2, 12);
  /* the power island: turbines on its hills and out at sea, a field of panels, and the station that sends what they
     make down a cable to the data centre */
  const bladeG = new THREE.BoxGeometry(0.4, 6.4, 0.1); bladeG.translate(0, 3.2, 0);
  const turbine = (g, x, z, y0 = 0, k = 0) => { const tg = group(g, x, y0, z, FACE); cyl(tg, 0.16, 0.34, 13, mat(P.white, { roughness: 0.45 }), 0, 0, 0, 10);
    if (y0 < 0) cyl(tg, 0.5, 0.5, 1.6, mat(A.crane), 0, 0, 0, 10);
    box(tg, 0.7, 0.7, 1.7, mat(P.white), 0, 12.9, -0.3, 0.2); const rotor = group(tg, 0, 13.25, 0.62);
    for (let b = 0; b < 3; b++) { const m = new THREE.Mesh(bladeG, mat(P.white, { roughness: 0.4 })); m.rotation.z = b * 2.094; m.castShadow = true; rotor.add(m); }
    rotor.rotation.z = k; spinning.push({ rotor, spin: 0.7 + rnd(k * 9, 61) * 0.3 }); };
  [[-8, -6], [-1, -10], [6, -7], [-12, 3]].forEach(([x, z], i) => turbine(power, x, z, 0, i));
  const offshore = group(scene, 0, 0, 0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) turbine(offshore, AT('power')[0] + 32 + i * 14 + j * 4, AT('power')[1] - 22 + j * 14, -0.6, i * 3 + j + 4);
  /* Jevons' bet (src/v2/play.js betJevons): the island's thirteen turbines turn for the answers the world asks, and
     stand still when fewer are needed; the turbines it would need beyond its own rise from the sea further out, pale
     and warm, one for each (built when first needed, one mesh for every tower, one for every blade) */
  const powerSpin = spinning.filter(f => f.rotor);
  const GHOST_AT = (() => { const c = AT('power'), sb = AT('idea'), mid = [c[0] + 50, c[1] - 8], out = [];
    for (let i = 0; i < 11; i++) for (let j = -3; j < 6; j++) { if (i < 3 && j >= 0 && j < 3) continue; const x = c[0] + 32 + i * 14 + j * 4, z = c[1] - 22 + j * 14; if (Math.hypot(x - sb[0], z - sb[1]) > 36) out.push([x, z]); }
    return out.sort((a, b) => Math.hypot(a[0] - mid[0], a[1] - mid[1]) - Math.hypot(b[0] - mid[0], b[1] - mid[1])).slice(0, 64); })();
  let spare = null;
  const ghostsBuild = () => { const n = GHOST_AT.length, m = mat(P.warm, { transparent: true, opacity: 0.62, roughness: 0.5 });
    const im = (geo, k) => { const x = new THREE.InstancedMesh(geo, m, k); x.count = 0; x.frustumCulled = false; scene.add(x); return x; };
    spare = { tower: im(new THREE.CylinderGeometry(0.16, 0.34, 13, 8), n), nac: im(new THREE.BoxGeometry(0.7, 0.7, 1.7), n), blade: im(bladeG, n * 3), h: new Float32Array(n), turn: GHOST_AT.map((_, i) => rnd(i, 71) * 6.28) }; };
  const GM = new THREE.Matrix4(), GB = new THREE.Matrix4(), GT = new THREE.Matrix4(), GR = new THREE.Matrix4();
  function powerBet(dt) {
    const B = betPowerNow(), need = !B ? powerSpin.length : B.need > B.own ? Math.ceil(B.need - 1e-9) : Math.round(B.need), want = B ? Math.max(0, Math.min(GHOST_AT.length, need - B.own)) : 0;
    powerSpin.forEach((f, i) => { const go = i < need ? 1 : 0; f.on = f.on == null ? 1 : reduced() ? go : f.on + (go - f.on) * Math.min(1, dt * 1.5); });
    if (!want && !spare) return; if (!spare) ghostsBuild();
    let top = 0; for (let i = 0; i < GHOST_AT.length; i++) { const go = i < want ? 1 : 0; spare.h[i] = reduced() ? go : spare.h[i] + (go - spare.h[i]) * Math.min(1, dt * (2.2 - (i % 5) * 0.25)); if (spare.h[i] > 0.01) top = i + 1; }
    ['tower', 'nac'].forEach(k => { spare[k].count = top; }); spare.blade.count = top * 3;
    for (let i = 0; i < top; i++) { const [x, z] = GHOST_AT[i], y = -0.6 - 15 * (1 - ease(spare.h[i])); if (!reduced()) spare.turn[i] -= dt * 0.8 * spare.h[i];
      GB.makeRotationY(FACE).setPosition(x, y, z);
      spare.tower.setMatrixAt(i, GM.multiplyMatrices(GB, GT.makeTranslation(0, 6.5, 0)));
      spare.nac.setMatrixAt(i, GM.multiplyMatrices(GB, GT.makeTranslation(0, 13.25, -0.3)));
      for (let b = 0; b < 3; b++) spare.blade.setMatrixAt(i * 3 + b, GM.multiplyMatrices(GB, GT.makeTranslation(0, 13.25, 0.62)).multiply(GR.makeRotationZ(spare.turn[i] + b * 2.094)));
    }
    ['tower', 'nac', 'blade'].forEach(k => { spare[k].instanceMatrix.needsUpdate = true; });
  }
  { const sf = group(power, 4, 0, 6, FACE * 0.3); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const p = box(sf, 2.6, 0.1, 1.5, metal(0x27406a, { roughness: 0.25 }), -7 + i * 2.8, 0.8, -3.4 + j * 2.3, 0.02); p.rotation.x = -0.45; } }
  { const ss = group(power, -6, 0, 8, FACE * 0.3); box(ss, 7, 0.06, 5, mat(P.road), 0, 0.02, 0, 0.05, { cast: false }); for (let k = 0; k < 3; k++) { box(ss, 1.4, 1.6, 1.2, mat(P.slate), -2.2 + k * 2.2, 0.08, -0.8, 0.08); for (let j = 0; j < 3; j++) cyl(ss, 0.1, 0.1, 0.9, mat(P.white), -2.6 + k * 2.2 + j * 0.4, 1.68, -0.8, 6); }
    box(ss, 3, 2.2, 1.6, paleM, 0, 0.08, 1.4, 0.1); }
  /* the sandbank of what is not yet: a flag, and a stake for every question nobody can try yet (setState) */
  { const f = group(idea, 0, 0, 0); box(f, 0.25, 6, 0.25, metal(P.metal), -6, -0.4, -2, 0.03); box(f, 3, 1.8, 0.1, craneM, -4.4, 3.6, -2, 0.03); }
  const stakesG = group(idea, 0, 0, 0);
  /* a jetty on the west coast, by the quarry, where sand, gases and machines come ashore */
  { const j = group(scene, -86, 0, -7, -Math.PI / 2); box(j, 3, 0.6, 12, mat(P.wall, { roughness: 0.9 }), 0, -0.6, 6, 0.08); for (let k = 0; k < 3; k++) cyl(j, 0.12, 0.14, 0.3, metal(P.dark), 1.3, 0, 2 + k * 4, 8); }

  /* the islands across the sea stand still: each is baked into one mesh per material, so six islands cost about as
     much to draw as one building (what moves or glows in time is kept apart) */
  const bake = (root, keep) => {
    root.updateMatrixWorld(true); const inv = root.matrixWorld.clone().invert(), M = new THREE.Matrix4(), byM = new Map(), out = [];
    const kept = o => { for (let x = o; x && x !== root; x = x.parent) if (keep.has(x)) return true; return false; };
    root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !kept(o)) out.push(o); });
    out.forEach(o => { const g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); M.multiplyMatrices(inv, o.matrixWorld); g0.applyMatrix4(M);
      if (!byM.has(o.material)) byM.set(o.material, []); byM.get(o.material).push(g0); o.parent.remove(o); });
    byM.forEach((gs, m) => { const n = gs.reduce((a, g0) => a + g0.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let k = 0;
      gs.forEach(g0 => { pos.set(g0.attributes.position.array, k * 3); if (g0.attributes.normal) nor.set(g0.attributes.normal.array, k * 3); k += g0.attributes.position.count; g0.dispose(); });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, m); mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); });
  };
  { const keep = new Set(pulses.concat(spinning.filter(f => f.rotor).map(f => f.rotor))); [phones, cars, tools, materials, power, offshore].forEach(g => bake(g, keep)); }

  /* ---- what joins the islands: lanes on the sea where the ships go, a power cable and a data cable under the
     water, each a line of moving light, and one plane, since finished chips are small and dear and mostly fly ---- */
  const lanes = [];
  const lane = (pts, color, n, speed, o = {}) => { const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))), m = new THREE.InstancedMesh(new THREE.BoxGeometry(o.len || 2.4, 0.04, o.w || 0.5),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o.op || (night ? 0.45 : 0.55), depthWrite: false, blending: night && o.glow ? THREE.AdditiveBlending : THREE.NormalBlending }), n);
    m.frustumCulled = false; m.renderOrder = 2; scene.add(m); lanes.push({ c, m, n, speed, y: o.y == null ? -0.4 : o.y }); return c; };
  const seaLane = night ? 0x7e9bb4 : 0xf4f7fa;
  const LANES = {
    phones: [[78, 2], [98, -46], [70, -110], [10, -164], [-30, -192]],
    cars: [[80, 8], [130, -14], [176, -36], [194, -42]],
    tools: [[-98, -10], [-120, -60], [-140, -100], [-146, -114]],
    materials: [[-98, -6], [-150, -24], [-190, -40], [-204, -44]]
  };
  const laneC = Object.fromEntries(Object.entries(LANES).map(([k, pts]) => [k, lane(pts, seaLane, Math.round(pts.length * 11), 0.006, { op: night ? 0.3 : 0.42, w: 0.35, len: 1.6 })]));
  lane([[86, -166], [66, -120], [46, -80], [40, -60]], P.warm, 34, 0.03, { glow: true, w: 0.5, len: 1.4, op: night ? 0.9 : 0.75, y: -0.38 });
  lane([[12, 56], [70, 54], [96, 10], [120, -50], [168, -100]], P.accent, 60, 0.02, { glow: true, w: 0.45, len: 1.2, op: night ? 0.9 : 0.7, y: -0.38 });
  /* a ship on every lane, each its own kind */
  [['phones', ship(10)], ['cars', carShip()], ['tools', liftShip()], ['materials', gasShip()]].forEach(([k, s], i) => { scene.add(s); tagMover(s, { kind: 'ship', lane: k }); moving.push({ obj: s, path: laneC[k], speed: 0.012 + i * 0.002, ship: true, u: 0.3 + i * 0.37, bounce: true }); });
  /* the plane */
  const plane = new THREE.Group(); { const f = cyl(plane, 0.5, 0.55, 8, paleM, 0, -4, 0, 12); f.geometry = f.geometry.clone().rotateZ(-Math.PI / 2); f.position.set(0, 0, 0); box(plane, 1.7, 0.14, 10, paleM, 0.4, -0.15, 0, 0.05); box(plane, 0.9, 0.1, 3.4, paleM, -3.4, 0.3, 0, 0.03); box(plane, 1, 1.8, 0.12, paleM, -3.5, 0.3, 0, 0.03); scene.add(plane); } tagMover(plane, { kind: 'plane' });
  const flight = new THREE.CatmullRomCurve3([[-62, 40, -190], [40, 44, -150], [110, 42, -40], [60, 40, 40], [-80, 38, 30], [-150, 36, -110]].map(([x, y, z]) => new THREE.Vector3(x, y, z)), true, 'centripetal');
  /* ---- what calls, standing in the world (docs/INTERACTION.md, "What calls"): by the door of every place that holds
     questions or challenges, a small paved square with a board for the questions asked there (a light for each), a
     standing bench for each challenge played there (its screen lit while it waits, green once done), and a lantern for
     each question someone added under one of them. Never a sign floating over a place (docs/framework/rebuild.md,
     section 3): each is a thing on the ground, named only when you come near; from far out they fold into the count
     on the place's name. Questions nobody has a place for stand on the sandbank, by its stakes. */
  Object.assign(SQUARE, Object.fromEntries([['phones', 12, 10], ['cars', 6, 9.5], ['idea', 0, 8]].map(([id, x, z]) => [id, [AT(id)[0] + x, AT(id)[1] + z]])));
  const squaresG = group(scene, 0, 0, 0), paveM = mat(night ? 0x3a3f47 : 0xcfc9bc, { roughness: 0.85 }), kerbM = mat(night ? 0x2a2f36 : 0xa9a397, { roughness: 0.8 }),
    bodyM = mat(night ? 0x232830 : 0x3e454f, { roughness: 0.45, metalness: 0.25 }), deskM = mat(night ? 0x8f8270 : 0xd2bf9f, { roughness: 0.55 });
  const poiPick = []; let squareSig = '', poiLabels = [];
  const poiMark = (g, poi) => g.traverse(o => { if (o.isMesh) { o.userData.poi = poi; poiPick.push(o); } });
  const poiLabel = (g, y, text, cls, poi, title) => { const lb = L.add(g, new THREE.Vector3(0, y, 0), text, { cls: 'poi3 ' + cls, button: true, data: { poi }, max: 150 }); if (title) lb.el.title = title; poiLabels.push(lb); return lb; };
  /* the board: a slim dark stand, its face lit, a strip of light for each question (up to six) */
  const board = (g, x, z, n, poi, place) => { const b = group(g, x, 0, z); box(b, 1.5, 2.5, 0.28, bodyM, 0, 0.08, 0, 0.06);
    box(b, 1.24, 1.9, 0.04, glow(night ? 0xe9f1ff : 0xf6f8fb, night ? 0.5 : 0.25), 0, 0.42, 0.15, 0.01, { cast: false });
    for (let k = 0; k < Math.min(n, 6); k++) box(b, 0.9, 0.12, 0.05, glow(P.warm, 1.1), -0.04, 2.05 - k * 0.27, 0.16, 0.01, { cast: false });
    poiMark(b, poi); poiLabel(b, 3.6, t('map.sq.qs', { n }), 'qs', poi, t('map.sq.qsT', { place: t('map.' + place + '.t') })); };
  /* the bench: a standing desk with its screen tilted up, lit while the challenge waits, green once it is done */
  const bench = (g, x, z, c) => { const b = group(g, x, 0, z), leg = metal(P.slate);
    box(b, 1.5, 0.08, 0.7, deskM, 0, 1.02, 0, 0.02); [[-0.66, -0.26], [0.66, -0.26], [-0.66, 0.26], [0.66, 0.26]].forEach(([a, d]) => box(b, 0.06, 1.02, 0.06, leg, a, 0, d, 0.01, { cast: false }));
    const sc = group(b, 0, 1.12, -0.12); sc.rotation.x = -0.35; box(sc, 1.1, 0.68, 0.06, bodyM, 0, 0, 0, 0.02);
    const lit = box(sc, 0.98, 0.56, 0.02, glow(c.done ? P.good : P.accent, c.done ? 0.8 : 1.2), 0, 0.06, 0.035, 0.005, { cast: false }); if (!c.done) pulses.push(lit), lit.userData.square = true;
    poiMark(b, 'ch:' + c.id); poiLabel(b, 1.9 + (c.k % 2) * 1.1, (c.done ? '✓ ' : '') + c.name, 'ch' + (c.done ? ' done' : ''), 'ch:' + c.id).max = 90; };
  /* the lantern: a post with a warm light, and a small light at its foot for each piece of work done for it */
  const lantern = (g, x, z, a) => { const b = group(g, x, 0, z); box(b, 0.16, 3.2, 0.16, metal(P.dark), 0, 0, 0, 0.03);
    const l = box(b, 0.6, 0.6, 0.6, glow(P.warm, 1.5), 0, 3.2, 0, 0.12, { cast: false }); l.userData.square = true; pulses.push(l);
    for (let k = 0; k < Math.min(a.work, 5); k++) box(b, 0.24, 0.24, 0.24, glow(P.accent, 1.2), 0.45 + k * 0.4, 0.05, 0, 0.05, { cast: false });
    const poi = a.under ? 'q:' + a.under : 'place:idea'; poiMark(b, poi); poiLabel(b, 4.4, '?', 'asked' + (a.draft ? ' draft' : ''), poi, t('map.asked', { by: a.by, q: a.words })); };
  /* a report: the lab said to be broken here, by someone using it. A striped barrier with an amber lamp stands at the
     square of the place it was seen, until a fix names it (docs/reviews/community.md); it is never part of the plan */
  const stripeA = mat(night ? 0xb8463c : 0xc9483c, { roughness: 0.6 }), stripeB = mat(night ? 0xc9c2b6 : 0xf1eee8, { roughness: 0.6 });
  const barrier = (g, x, z, r) => { const b = group(g, x, 0, z, 0.25); [-0.8, 0.8].forEach(px => box(b, 0.12, 1.05, 0.12, metal(P.slate), px, 0, 0, 0.02, { cast: false }));
    for (let k = 0; k < 6; k++) box(b, 0.3, 0.2, 0.08, k % 2 ? stripeB : stripeA, -0.75 + k * 0.3, 0.72, 0, 0.01, { cast: false });
    const l = box(b, 0.22, 0.22, 0.22, glow(P.warm, 1.6), 0.8, 1.05, 0, 0.06, { cast: false }); l.userData.square = true; pulses.push(l);
    const poi = 'report:' + r.href; poiMark(b, poi); poiLabel(b, 1.9, '⚑', 'report' + (r.draft ? ' draft' : ''), poi, t('map.reported', { say: t('report.say.' + r.say), words: r.words })); };
  function squares(st) {
    const sig = JSON.stringify([st.square, (st.asks || []).map(a => [a.q, a.work, a.at, a.draft]), (st.wanted || []).length, (st.reports || []).map(r => [r.id, r.draft])]); if (sig === squareSig) return false; squareSig = sig;
    while (squaresG.children.length) squaresG.remove(squaresG.children[0]); while (stakesG.children.length) stakesG.remove(stakesG.children[0]);
    poiLabels.forEach(lb => { lb.el.remove(); const i = L.list.indexOf(lb); if (i >= 0) L.list.splice(i, 1); }); poiLabels = []; poiPick.length = 0;
    for (let i = pulses.length - 1; i >= 0; i--) if (pulses[i].userData.square) pulses.splice(i, 1);
    Object.entries(SQUARE).forEach(([pl, at]) => {
      const s = (st.square || {})[pl] || { n: 0, chs: [] }, asks = (st.asks || []).filter(a => a.at === pl).slice(0, 4), reps = (st.reports || []).filter(rp => (SQUARE[rp.at] ? rp.at : 'lab') === pl).slice(0, 3);
      if (!s.n && !s.chs.length && !asks.length && !reps.length) return;
      const g = group(squaresG, at[0], 0, at[1], FACE), r = 2.3 + Math.max(s.chs.length, 1) * 0.5;
      cyl(g, r, r, 0.1, paveM, 0, -0.02, 0, 40, { cast: false }); cyl(g, r + 0.25, r + 0.25, 0.06, kerbM, 0, -0.03, 0, 40, { cast: false });
      if (s.n) board(g, 0, -r * 0.45, s.n, 'ask:' + pl, pl);
      s.chs.forEach((c, i) => bench(g, (i - (s.chs.length - 1) / 2) * 2.3, r * 0.34, Object.assign({ k: i }, c)));
      asks.forEach((a, i) => lantern(g, (i % 2 ? 1 : -1) * (r - 0.6), -r * 0.35 + Math.floor(i / 2) * 1.2, a));
      reps.forEach((rp, i) => barrier(g, -r * 0.55 + i * 2, r * 0.82, rp));
    });
    /* on the sandbank, a stake for every question nobody can try yet, flagged in the colour of its world */
    const W = st.wanted || [], rows = Math.ceil(W.length / 6);
    W.forEach((w, i) => { const x = -5 + (i % 6) * 2.2, z = -2 + Math.floor(i / 6) * 2.4 - rows * 0.6, sg = group(stakesG, x, -0.45, z);
      box(sg, 0.1, 1.6, 0.1, mat(night ? 0x8a7a63 : 0xb59a72), 0, 0, 0, 0.02); box(sg, 0.55, 0.32, 0.03, mat(new THREE.Color().setHSL(w.hue / 360, 0.5, night ? 0.45 : 0.55).getHex(), { roughness: 0.7 }), 0.3, 1.2, 0, 0.01, { cast: false }); });
    if (W.length) { const pts = [[-6, -2.8 - rows * 0.6], [7.4, -2.8 - rows * 0.6], [7.4, -1 + (rows - 1) * 2.4 - rows * 0.6 + 0.8], [-6, -1 + (rows - 1) * 2.4 - rows * 0.6 + 0.8]];
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, 0.55, z))), new THREE.LineBasicMaterial({ color: night ? 0xcfc2a8 : 0x7c6a52 })); stakesG.add(line); }
    return true;
  }

  /* ---- what grows: one builder per growth (src/v2/game.js GROWTH); each starts hidden and grows in ---- */
  const GROWERS = {
    'studio-screen': g => { const s = box(g, 5, 2.8, 0.25, glow(P.accent, night ? 1.3 : 0.7), 0, 0.5, 0, 0.1); s.rotation.y = 0.5; box(g, 0.25, 0.6, 0.25, metal(P.slate), 0, 0, 0, 0.05); pulses.push(s); },
    /* your first masks leave the studio: a truck goes back and forth on the road between the mask house and the factory */
    'masks': () => { const tr = truck(A.truck); box(tr, 2.6, 0.12, 1.2, glow(P.accent, 1.2), -0.9, 2.15, 0, 0.03, { cast: false }); scene.add(tr); moving.push({ obj: tr, path: route([[-31, -27], [-29, -20], [-27.5, -13], [-22, -6], [-14, -2], [-8, -6]]), speed: 0.05, ship: true, bounce: true }); },
    'studio-wing': g => { box(g, 8, 4.5, 6, glass(P.glass, { opacity: 0.55, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.4 : 0 }), 0, 0, 0, 0.3); box(g, 8.2, 0.4, 6.2, mat(P.white), 0, 4.5, 0, 0.1); },
    'fab-trucks': () => { for (let i = 0; i < 4; i++) onLoop(truck(A.box[(i + 3) % 5]), 0.12 + i * 0.25, 0.012, -0.7); },
    'island-teardown': g => { box(g, 6, 1.1, 3, mat(P.wall), 0, 0, 0, 0.2); for (let k = 0; k < 4; k++) box(g, 1, 0.12, 1.6, mat(k % 2 ? P.chip : P.board), -2.1 + k * 1.4, 1.1, 0, 0.04); box(g, 0.2, 2.6, 0.2, metal(P.metal), 2.6, 1.1, -1, 0.02); pulses.push(cyl(g, 0.5, 0.3, 0.4, glow(P.warm, 1.1), 2.6, 3.4, -1, 12)); },
    /* chips that touch the real world (#220): a listening post whose roof is a converter's steps, a power house with its coils, and a stand where a sensor listens to a wheel */
    'island-adc': g => { box(g, 4, 1.5, 2.6, mat(P.white), 0, 0, 0, 0.2); box(g, 4.2, 0.2, 2.8, mat(A.roof, { roughness: 0.7 }), 0, 1.5, 0, 0.06); for (let k = 0; k < 6; k++) pulses.push(box(g, 0.42, 0.3 + k * 0.3, 0.9, glow(P.accent, night ? 1.1 : 0.55), -1.5 + k * 0.6, 1.7, 0, 0.03, { cast: false })); box(g, 0.9, 1, 0.06, mat(P.slate), 0, 0.1, 1.31, 0.02, { cast: false }); },
    'island-reg': g => { box(g, 4.4, 0.25, 3, mat(P.slate), 0, 0, 0, 0.06); box(g, 1.5, 2, 2.2, mat(P.wall), -1.2, 0.25, 0, 0.12); pulses.push(box(g, 0.9, 0.22, 0.06, glow(P.good, 1), -1.2, 1.6, 1.11, 0.02, { cast: false }));
      [[0.5, -0.6], [1.5, -0.6], [1, 0.6]].forEach(([x, z]) => { cyl(g, 0.42, 0.42, 1.3, metal(0xb87333, { roughness: 0.35 }), x, 0.45, z, 18); cyl(g, 0.5, 0.5, 0.2, metal(P.dark), x, 0.25, z, 18); cyl(g, 0.16, 0.16, 0.3, metal(P.metal), x, 1.75, z, 10); }); },
    'island-sensor': g => { box(g, 3.8, 0.25, 2.4, mat(P.slate), 0, 0, 0, 0.06); [-0.45, 0.45].forEach(z => box(g, 0.3, 1.5, 0.22, metal(P.metal), -0.6, 0.25, z, 0.04));
      const w = cyl(g, 1, 1, 0.5, metal(P.dark, { roughness: 0.5 }), -0.6, 1.55, 0, 28); w.rotation.x = Math.PI / 2; const hub = cyl(g, 0.36, 0.36, 0.56, metal(P.metal), -0.6, 1.55, 0, 16); hub.rotation.x = Math.PI / 2;
      box(g, 1, 1.5, 1.2, mat(P.white), 1.2, 0.25, 0, 0.1); pulses.push(box(g, 0.26, 0.26, 0.26, glow(P.warm, 1.2), -0.6, 1.42, 0.62, 0.05, { cast: false })); },
    'studio-evolve': g => { box(g, 7, 0.4, 5, mat(P.wall), 0, 0, 0, 0.1); const d = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 7, 20, 1, false, 0, Math.PI), glass(P.glass, { opacity: 0.45 })); d.rotation.z = Math.PI / 2; d.position.y = 0.4; g.add(d); for (let k = 0; k < 6; k++) box(g, 0.5, 0.5 + rnd(k, 31) * 1.2, 0.5, mat(P.good), -2.5 + k, 0.4, (k % 2) - 0.5, 0.1); },
    'studio-fit': g => { box(g, 9, 3, 0.6, mat(P.white), 0, 0, 0, 0.1); for (let k = 0; k < 6; k++) box(g, 1.1, 1.1, 0.12, mat(k < 2 ? P.accent : k < 4 ? P.good : P.warm), -3.4 + k * 1.36, 1, 0.36, 0.05, { cast: false }); },
    /* the bench's own challenges: a board of jobs, a table where cells are set out in rows, a rack of glass masks */
    'studio-piece': g => { [-1.8, 1.8].forEach(x => box(g, 0.18, 0.5, 0.18, metal(P.slate), x, 0, 0, 0.02)); box(g, 4.2, 2.4, 0.24, mat(P.white), 0, 0.5, 0, 0.06); for (let k = 0; k < 8; k++) box(g, 0.62, 0.62, 0.06, mat(k % 3 ? P.warm : P.accent), -1.5 + (k % 4), 1.05 + Math.floor(k / 4) * 0.9, 0.15, 0.02, { cast: false }); pulses.push(box(g, 0.62, 0.62, 0.06, glow(P.warm, night ? 1.2 : 0.6), 1.5, 1.95, 0.16, 0.02, { cast: false })); },
    'studio-floor': g => { box(g, 5, 0.9, 3.4, mat(P.wall), 0, 0, 0, 0.1); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) box(g, 0.66 + (k + r) % 2 * 0.36, 0.18, 0.62, mat(P.slate), -1.65 + k * 1.1, 0.9, -1.05 + r * 1.05, 0.03, { cast: false }); pulses.push(box(g, 4.2, 0.05, 0.08, glow(P.warm, night ? 1.2 : 0.6), 0, 1.0, -0.52, 0.01, { cast: false })); },
    'studio-masks': g => { box(g, 3.8, 0.3, 1.7, mat(P.slate), 0, 0, 0, 0.05); for (let k = 0; k < 5; k++) box(g, 0.08, 2.2, 1.4, glass(P.glass, { opacity: 0.5 }), -1.4 + k * 0.7, 0.3, 0, 0.02); pulses.push(box(g, 0.1, 2.2, 1.4, glow(P.accent, night ? 1.2 : 0.6), 1.4, 0.3, 0, 0.02, { cast: false })); },
    /* your chip's first wafer on show: a wafer standing on a plinth, its dies good and dead, and the packaged chip in front of it */
    'studio-aichip': g => { box(g, 5.4, 0.5, 2.8, mat(P.wall), 0, 0, 0, 0.1); const w = cyl(g, 2.1, 2.1, 0.14, metal(P.dark), 0, 0, -0.5, 40); w.rotation.x = Math.PI / 2; w.position.y = 3.1;
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i * i + j * j < 11) box(g, 0.46, 0.46, 0.05, (i * 3 + j * 5 + 22) % 6 ? mat(P.good) : glow(P.warm, 1), i * 0.52, 2.87 + j * 0.52, -0.41, 0.01, { cast: false });
      [-1.2, 1.2].forEach(x => box(g, 0.3, 1, 0.3, metal(P.slate), x, 0.5, -0.5, 0.03)); box(g, 1.7, 0.2, 1.7, mat(P.white), 0, 0.5, 0.75, 0.04); pulses.push(box(g, 0.8, 0.12, 0.8, glow(P.accent, night ? 1.3 : 0.7), 0, 0.7, 0.75, 0.02, { cast: false })); },
    'fab-etch': g => { box(g, 11, 0.3, 4.4, mat(P.wall), 0, 0, 0, 0.1); for (let k = 0; k < 4; k++) { const x = -4.05 + k * 2.7; box(g, 2.1, 2.5, 2.6, mat(P.white), x, 0.3, 0, 0.2); cyl(g, 0.8, 0.8, 0.4, metal(P.dark), x, 2.8, 0, 20); pulses.push(box(g, 1.1, 0.3, 0.06, glow(P.accent, night ? 1.4 : 0.7), x, 1.5, 1.32, 0.02, { cast: false })); cyl(g, 0.12, 0.12, 1.2, metal(P.metal), x, 3.1, -0.9, 8); } box(g, 10.4, 0.14, 0.14, metal(P.metal), 0, 4.2, -0.9, 0.02); },
    'fab-ald': g => { box(g, 9, 0.3, 9, mat(P.wall), 0, 0, 0, 0.1); cyl(g, 1.9, 1.9, 1.5, mat(P.white), 0, 0.3, 0, 6); cyl(g, 1.2, 1.2, 0.2, metal(P.dark), 0, 1.8, 0, 6); for (let k = 0; k < 4; k++) { const a = Math.PI + k * (Math.PI / 3), x = Math.cos(a) * 3.5, z = Math.sin(a) * 3.5; cyl(g, 1.05, 1.05, 1.9, mat(P.white), x, 0.3, z, 20); cyl(g, 0.8, 0.8, 0.2, metal(P.dark), x, 2.2, z, 20); pulses.push(box(g, 0.7, 0.25, 0.06, glow(P.accent, night ? 1.4 : 0.7), x * 1.0, 1.2, z + 1.07, 0.02, { cast: false })); } box(g, 2.2, 1.2, 1.6, mat(P.wall), 0, 0.3, 3.4, 0.15); },
    'quarry-ingot': g => { box(g, 6, 0.4, 3, mat(P.wall), 0, 0, 0, 0.1); for (let k = 0; k < 4; k++) { const c = cyl(g, 0.5, 0.5, 4.6, metal(0x8e959e, { roughness: 0.22 }), -2.1 + k * 1.4, 0.4, 0, 24); c.rotation.x = Math.PI / 2; c.position.y = 1; } },
    /* the implanter: an ion source, a long beam line and the chamber where the wafer waits */
    'fab-implanter': g => { box(g, 9, 0.4, 3, mat(P.wall), 0, 0, 0, 0.1); box(g, 2, 2, 2, mat(P.white), -3.4, 0.4, 0, 0.2); const b = cyl(g, 0.3, 0.3, 4.2, metal(0x8e959e, { roughness: 0.25 }), -0.4, 1.4, 0, 16); b.rotation.z = Math.PI / 2; pulses.push(box(g, 3.4, 0.08, 0.08, glow(P.accent, night ? 1.5 : 0.8), -0.4, 1.4, 0, 0.02, { cast: false })); cyl(g, 1.2, 1.2, 1.8, metal(P.dark), 3, 0.4, 0, 28); },
    /* the anneal tool: a lamp head over a wafer on a plinth */
    'fab-anneal': g => { box(g, 3.4, 1.2, 3.4, mat(P.white), 0, 0, 0, 0.2); cyl(g, 1.2, 1.2, 0.12, metal(P.dark), 0, 1.2, 0, 28); box(g, 0.5, 3, 0.5, metal(P.slate), -1.2, 1.2, -1.2, 0.05); box(g, 3, 0.5, 0.5, metal(P.slate), 0, 4.2, -1.2, 0.05); pulses.push(cyl(g, 0.5, 0.2, 0.6, glow(P.warm, 1.4), 0.6, 3.6, -1.2, 16)); },
    /* the overlay tool: two rings, one layer on the one below, a little out of line */
    'fab-overlay': g => { box(g, 3.6, 1.4, 3.6, mat(P.white), 0, 0, 0, 0.2); for (let k = 0; k < 2; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.1, 8, 40), k ? glow(P.accent, 1, { transparent: true, opacity: 0.7 }) : metal(P.dark)); r.rotation.x = Math.PI / 2; r.position.set(k ? 0.28 : 0, 1.8 + k * 0.5, 0); g.add(r); } },
    /* a second scanner bay: the machine that prints with light, a white body on its slab, a dark head and a lit window */
    'fab-scanner': g => { box(g, 7, 0.3, 5, mat(P.wall), 0, 0, 0, 0.1); box(g, 4.6, 2.4, 3.2, mat(P.white), -0.6, 0.3, 0, 0.2); box(g, 3.2, 0.9, 2.4, mat(P.dark), -0.6, 2.7, 0, 0.12); box(g, 1.2, 1.5, 3.2, mat(P.slate), 2.5, 0.3, 0, 0.1); pulses.push(box(g, 1.6, 0.5, 0.06, glow(P.accent, night ? 1.3 : 0.7), -0.6, 1.6, 1.62, 0.02, { cast: false })); },
    /* the light source of an EUV scanner: a long vacuum vessel with a warm glow where the tin droplets are hit */
    'fab-euv': g => { box(g, 7, 0.3, 3.4, mat(P.wall), 0, 0, 0, 0.1); const v = cyl(g, 0.95, 0.95, 5.2, metal(0x8e959e, { roughness: 0.22 }), 0, 0.3, 0, 28); v.rotation.z = Math.PI / 2; v.position.y = 1.35; const c = cyl(g, 0.4, 0.4, 0.5, metal(P.dark), -2.8, 0.3, 0, 20); c.rotation.z = Math.PI / 2; c.position.y = 1.35; pulses.push(cyl(g, 0.3, 0.3, 0.2, glow(P.warm, 1.2), 0.4, 2.3, 0, 14)); box(g, 0.5, 1.0, 0.5, mat(P.slate), -1.6, 0.3, 0, 0.05); box(g, 0.5, 1.0, 0.5, mat(P.slate), 1.6, 0.3, 0, 0.05); },
    'dc-batch': g => { box(g, 11, 3.2, 7, mat(P.white), 0, 0, 0, 0.3); box(g, 11.2, 0.3, 7.2, mat(A.roof, { roughness: 0.7 }), 0, 3.2, 0, 0.1); for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) spinning.push(cyl(g, 0.7, 0.7, 0.2, metal(P.dark), -4 + i * 2, 3.5, -1.6 + j * 3.2, 16)); },
    'lab-desk': g => { box(g, 7, 2.6, 4.5, mat(P.white), 0, 0, 0, 0.3); box(g, 7.2, 0.25, 4.7, mat(A.roof, { roughness: 0.7 }), 0, 2.6, 0, 0.1); for (let k = 0; k < 3; k++) pulses.push(box(g, 1.6, 0.9, 0.06, glow(k === 1 ? P.warm : P.accent, night ? 1.2 : 0.6), -2.2 + k * 2.2, 1.1, 2.27, 0.02, { cast: false })); },
    'power-store': g => { for (let k = 0; k < 4; k++) { box(g, 1.8, 2.2, 4.2, mat(P.white), -3.3 + k * 2.2, 0, 0, 0.15); box(g, 0.08, 0.3, 3.2, glow(P.good, night ? 1.2 : 0.5), -3.3 + k * 2.2 + 0.92, 1.5, 0, 0.02, { cast: false }); } },
    'studio-proof': g => { box(g, 6, 3, 6, mat(P.white), 0, 0, 0, 0.3); const d = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass(P.glass, { opacity: 0.6, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.4 : 0 })); d.position.y = 3; g.add(d); },
    'test-dies': g => { box(g, 10, 2.6, 6, mat(P.white), 0, 0, 0, 0.3); box(g, 10.2, 0.3, 6.2, mat(A.roof, { roughness: 0.7 }), 0, 2.6, 0, 0.1); for (let i = 0; i < 4; i++) { box(g, 1.1, 0.5, 1.1, mat(P.wall), -3.3 + i * 2.2, 2.9, 0, 0.1); cyl(g, 0.12, 0.12, 1.1, metal(P.dark), -3.3 + i * 2.2, 3.4, 0, 8); } },
    'dc-cores': g => { box(g, 12, 3, 7, mat(P.white), 0, 0, 0, 0.3); box(g, 12.2, 0.3, 7.2, mat(A.roof, { roughness: 0.7 }), 0, 3, 0, 0.1); spinning.push(cyl(g, 1.7, 1.7, 0.25, metal(P.dark), -3.4, 3.3, 0, 28)); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) spinning.push(cyl(g, 0.55, 0.55, 0.2, metal(P.dark), 0.4 + i * 1.5, 3.3, -1.8 + j * 1.8, 16)); },
    'fab-wafers': g => { box(g, 9, 3.2, 6, mat(P.white), 0, 0, 0, 0.3); box(g, 9.2, 0.35, 6.2, mat(A.roof, { roughness: 0.7 }), 0, 3.2, 0, 0.1); for (let i = 0; i < 3; i++) box(g, 1.5, 1.3, 1.5, mat(P.wall), -3 + i * 3, 0, 3.9, 0.2); for (let i = 0; i < 7; i++) cyl(g, 1.25, 1.25, 0.07, metal(P.dark), 6.3, 0.25 + i * 0.2, 0, 32); },
    'fab-line': g => { box(g, 22, 6, 7, mat(P.white), 0, 0, 0, 0.4); box(g, 22.2, 0.7, 7.2, mat(A.roof, { roughness: 0.7 }), 0, 4.8, 0, 0.15); for (let i = 0; i < 4; i++) { box(g, 3, 1, 3, mat(P.wall), -7.5 + i * 5, 6, 0, 0.12); spinning.push(cyl(g, 1, 1, 0.18, metal(P.dark), -7.5 + i * 5, 7, 0, 18)); } },
    'test-probe': g => { cyl(g, 0.3, 0.4, 6, metal(P.metal), 0, 0, 0, 10); for (let i = 0; i < 3; i++) pulses.push(box(g, 0.5, 0.5, 0.5, glow([P.good, P.warm, P.accent][i], 1.4), 0, 2 + i * 1.6, 0.35, 0.1)); },
    'test-hall': g => { box(g, 9, 3.2, 7, mat(P.white), 0, 0, 0, 0.3); box(g, 9.1, 0.4, 7.1, mat(A.roof, { roughness: 0.7 }), 0, 2.6, 0, 0.1); },
    'island-phones': g => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) box(g, 0.9, 1.1, 0.08, winM, -1.6 + j * 1.6, 1 + i * 2.2, 2.55, 0.02, { cast: false });
      for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 48), glow(P.accent, 1, { transparent: true, opacity: 0.6, depthWrite: false })); r.rotation.x = Math.PI / 2; r.position.set(7, 13.5, -4); g.add(r); bobbing.push({ obj: r, ring: k }); }
      const f = ship(9); scene.add(f); tagMover(f, { kind: 'ship', lane: 'phones' }); pickable(); moving.push({ obj: f, path: laneC.phones, speed: 0.016, ship: true, bounce: true, u: 0.9 }); },
    'island-cars': g => { for (let i = 0; i < 7; i++) { const c = carModel(cols[i % 5]); scene.add(c); moving.push({ obj: c, curve: carLoop.curve, u: i / 7, speed: 0.02, lane: 0.7, car: true }); }
      for (let i = 0; i < 3; i++) pulses.push(box(g, 1.4, 0.5, 0.1, glow(P.good, 1.3), -4 + i * 4, 2.6, 4.6, 0.02, { cast: false }));
      const f = ship(9); scene.add(f); tagMover(f, { kind: 'ship', lane: 'cars' }); pickable(); moving.push({ obj: f, path: laneC.cars, speed: 0.03, ship: true, bounce: true, u: 0.9 }); },
    'dc-hall': g => { box(g, 24, 4, 6, mat(P.wall), 0, 0, 0, 0.3); for (let i = 0; i < 7; i++) { box(g, 2.4, 0.8, 2.4, mat(P.white), -9 + i * 3, 4, 0, 0.12); spinning.push(cyl(g, 0.9, 0.9, 0.15, metal(P.dark), -9 + i * 3, 4.8, 0, 18)); } for (let i = 0; i < 9; i++) box(g, 1.6, 0.5, 0.08, winCool, -9.6 + i * 2.4, 2.4, 3.02, 0.02, { cast: false }); },
    /* a hot plate under test: a wafer on a glowing plate, and a thermometer beside it with its red top mark */
    'dc-heat': g => { box(g, 5, 0.3, 4, mat(P.wall), 0, 0, 0, 0.1); box(g, 2.8, 1, 2.8, mat(P.white), -0.6, 0.3, 0, 0.15); pulses.push(cyl(g, 1.15, 1.15, 0.14, glow(P.warm, night ? 1.5 : 0.9), -0.6, 1.3, 0, 28)); cyl(g, 0.95, 0.95, 0.06, metal(P.dark, { roughness: 0.25 }), -0.6, 1.44, 0, 28);
      box(g, 0.5, 3.2, 0.3, mat(P.white), 1.7, 0.3, 0.9, 0.06); box(g, 0.16, 1.9, 0.06, glow(P.warm, night ? 1.3 : 0.7), 1.7, 0.7, 1.06, 0.02, { cast: false }); box(g, 0.34, 0.08, 0.06, glow(P.bad, 1), 1.7, 2.95, 1.06, 0.01, { cast: false }); },
    'dc-solar': g => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const p = box(g, 2.6, 0.12, 1.6, metal(0x27406a, { roughness: 0.25 }), -4.5 + i * 3, 0.9, -3 + j * 3, 0.03); p.rotation.x = -0.4; } },
    /* new ways to compute, at the Lab: a grid of memory cells (rows under, columns over, a cell at every crossing), and a quantum machine's cold stage hanging in its frame */
    'way-cim': g => { box(g, 5, 1, 5, mat(P.white), 0, 0, 0, 0.2); box(g, 5.2, 0.14, 5.2, mat(A.roof, { roughness: 0.7 }), 0, 1, 0, 0.05);
      for (let i = 0; i < 4; i++) { box(g, 4.5, 0.14, 0.14, metal(P.dark), 0, 1.35, -1.5 + i, 0.03, { cast: false }); box(g, 0.14, 0.14, 4.5, metal(P.metal), -1.5 + i, 1.95, 0, 0.03, { cast: false });
        for (let j = 0; j < 4; j++) { const c = box(g, 0.34, 0.46, 0.34, glow((i * 3 + j * 5) % 4 === 1 ? P.warm : P.accent, night ? 1.2 : 0.6), -1.5 + i, 1.49, -1.5 + j, 0.06, { cast: false }); if ((i + j) % 2 === 0) pulses.push(c); } } },
    'way-quantum': g => { box(g, 3.6, 0.3, 3.6, mat(P.wall), 0, 0, 0, 0.08); [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([x, z]) => box(g, 0.2, 6.4, 0.2, metal(P.dark), x, 0.3, z, 0.04)); [-1.5, 1.5].forEach(v => { box(g, 3.2, 0.2, 0.2, metal(P.dark), 0, 6.5, v, 0.04); box(g, 0.2, 0.2, 3.2, metal(P.dark), v, 6.5, 0, 0.04); }); box(g, 3.2, 0.16, 0.16, metal(P.dark), 0, 6.52, 0, 0.03);
      cyl(g, 0.07, 0.07, 4.1, metal(P.metal), 0, 2.4, 0, 8); [[1.3, 5.7], [1.05, 4.8], [0.8, 4], [0.58, 3.3]].forEach(([r, y]) => { cyl(g, r, r, 0.12, metal(P.gold, { roughness: 0.25 }), 0, y, 0, 32); for (let k = 0; k < 3; k++) cyl(g, 0.035, 0.035, 0.8, metal(P.gold), Math.cos(k * 2.094) * r * 0.75, y - 0.8, Math.sin(k * 2.094) * r * 0.75, 6, { cast: false }); });
      pulses.push(box(g, 0.42, 0.14, 0.42, glow(P.accent, night ? 1.4 : 0.8), 0, 2.28, 0, 0.03, { cast: false })); },
    /* the clock and the power (src/v2/labs/clockpower.js): a meter whose column climbs from green to red, and four lamps that count */
    'blk-power': g => { box(g, 2.8, 1.3, 2.2, mat(P.white), 0, 0, 0, 0.12); box(g, 3, 0.2, 2.4, mat(A.roof, { roughness: 0.7 }), 0, 1.3, 0, 0.05); box(g, 1, 6, 0.8, metal(P.slate), 0, 1.5, -0.3, 0.08); [P.good, P.good, P.warm, P.warm, P.bad].forEach((c, i) => pulses.push(box(g, 0.62, 0.8, 0.1, glow(c, night ? 1.4 : 0.8), 0, 2.1 + i * 1.02, 0.12, 0.03, { cast: false }))); box(g, 1.3, 0.25, 1.1, metal(P.dark), 0, 7.5, -0.3, 0.05); },
    'gate-counter': g => { box(g, 5.4, 0.45, 1.5, mat(P.wall), 0, 0, 0, 0.08); for (let i = 0; i < 4; i++) { cyl(g, 0.1, 0.14, 1.3, metal(P.slate), -1.8 + i * 1.2, 0.45, 0, 10); const l = box(g, 0.62, 0.62, 0.62, glow(i % 2 ? P.accent : P.warm, night ? 1.5 : 0.9), -1.8 + i * 1.2, 1.75, 0, 0.14, { cast: false }); if (i !== 2) pulses.push(l); } },
    /* serving a language model: the weights kept in fewer bits (stacks of 8, 4 and 2 slabs), a meter yard where each answer's energy is read, and a hall that reads at once (one bar) and writes word by word (a row of lamps) */
    'dc-quant': g => { box(g, 5.4, 0.3, 3.4, mat(P.wall), 0, 0, 0, 0.1); [8, 4, 2].forEach((n, i) => { const x = -1.7 + i * 1.7; for (let k = 0; k < n; k++) box(g, 1.2, 0.17, 2.2, k === n - 1 ? metal(P.slate) : metal(P.dark), x, 0.3 + k * 0.27, 0, 0.03); pulses.push(box(g, 1.0, 0.05, 2.0, glow(P.accent, night ? 1.3 : 0.7), x, 0.3 + n * 0.27 - 0.09, 0, 0.01, { cast: false })); }); },
    'dc-token': g => { box(g, 5.4, 0.3, 3.4, mat(P.wall), 0, 0, 0, 0.1); box(g, 2, 1.7, 1.6, mat(P.white), -1.3, 0.3, 0, 0.12); for (let k = 0; k < 6; k++) box(g, 0.08, 1.2, 0.5, metal(P.slate), -2.05 + k * 0.3, 0.5, 1.02, 0.01, { cast: false }); for (let k = 0; k < 3; k++) cyl(g, 0.1, 0.16, 0.6, mat(P.wall), -1.9 + k * 0.6, 2, 0, 10); box(g, 0.14, 2.3, 0.14, metal(P.slate), 1.5, 0.3, 0, 0.02); box(g, 1.3, 1.0, 0.3, metal(P.dark), 1.5, 1.7, 0, 0.06); pulses.push(box(g, 1.0, 0.2, 0.05, glow(P.warm, night ? 1.3 : 0.7), 1.5, 1.85, 0.17, 0.01, { cast: false })); pulses.push(box(g, 0.6, 0.2, 0.05, glow(P.accent, night ? 1.3 : 0.7), 1.3, 2.25, 0.17, 0.01, { cast: false })); },
    /* keep the chef busy: a low kitchen with its pantry stacked on top, warm with the heat it cannot shed, its door lit */
    'dc-pantry': g => { box(g, 4.6, 0.3, 3.2, mat(P.wall), 0, 0, 0, 0.1); box(g, 3.2, 1.3, 2.4, mat(P.white), -0.4, 0.3, 0, 0.12); box(g, 3.4, 0.16, 2.6, mat(A.roof, { roughness: 0.7 }), -0.4, 1.6, 0, 0.04);
      box(g, 2.6, 0.9, 1.9, metal(P.slate), -0.4, 1.76, 0, 0.08); for (let k = 0; k < 3; k++) pulses.push(box(g, 2.0, 0.08, 0.05, glow(P.warm, night ? 1.2 : 0.6), -0.4, 1.98 + k * 0.24, 0.97, 0.01, { cast: false }));
      box(g, 0.9, 1.0, 0.9, mat(P.white), 1.75, 0.3, 0, 0.08); pulses.push(box(g, 0.9, 0.12, 0.12, glow(P.accent, night ? 1.4 : 0.8), 1.3, 0.85, 0, 0.02, { cast: false })); },
    'dc-prefill': g => { box(g, 5.4, 0.3, 3.4, mat(P.wall), 0, 0, 0, 0.1); box(g, 4.6, 0.7, 0.9, mat(P.white), 0, 0.3, -0.85, 0.08); pulses.push(box(g, 4.2, 0.12, 0.5, glow(P.accent, night ? 1.3 : 0.7), 0, 1.0, -0.85, 0.02, { cast: false })); for (let k = 0; k < 7; k++) { box(g, 0.44, 0.7, 0.9, mat(P.white), -2.08 + k * 0.693, 0.3, 0.85, 0.06); pulses.push(box(g, 0.26, 0.12, 0.5, glow(P.good, night ? 1.3 : 0.7), -2.08 + k * 0.693, 1.0, 0.85, 0.02, { cast: false })); } },
    'clock-tower': g => { box(g, 2.4, 9, 2.4, mat(P.white), 0, 0, 0, 0.2); const face = cyl(g, 1, 1, 0.2, mat(P.wall), 0, 7, 1.25, 24); face.rotation.x = Math.PI / 2; const hand = box(g, 0.12, 0.9, 0.08, mat(P.dark), 0, 6.95, 1.42, 0.02, { cast: false }); hand.geometry = hand.geometry.clone().translate(0, 0.4, 0); spinning.push({ hand }); }
  };
  /* where each growth stands, relative to its place: [x, z, y] */
  const GROW_SPOT = { 'studio-screen': [-4, 9], masks: [0, 0], 'studio-wing': [-4, -12], 'fab-trucks': [0, 0], 'fab-line': [2, -14], 'fab-wafers': [-13, 9], 'dc-cores': [-14, 6], 'test-dies': [-11, 9], 'studio-proof': [10, -10], 'power-store': [12, -3], 'lab-desk': [-9, 9], 'dc-batch': [-14, -8], 'quarry-ingot': [10, 6], 'fab-scanner': [18.5, -5], 'fab-euv': [18.5, 0.5], 'fab-overlay': [16.5, 5.5], 'fab-anneal': [20.8, 5.5], 'fab-ald': [-4, -24], 'fab-etch': [8.5, -21], 'fab-implanter': [8, -26.5], 'island-teardown': [14, -4], 'studio-fit': [10, 10], 'studio-piece': [16, 2], 'studio-floor': [-12, -6], 'studio-masks': [3, 14], 'studio-evolve': [-14, 6], 'test-probe': [3, 0, 4], 'test-hall': [11, 0],
    'island-phones': [0, 0], 'island-cars': [0, 0], 'dc-hall': [0, 10], 'dc-solar': [21, 4], 'clock-tower': [-8, -2],
    'way-cim': [13, 3], 'way-quantum': [13, -5], 'dc-heat': [20.5, -15], 'studio-aichip': [-21, 3], 'blk-power': [-20.5, 8.5], 'gate-counter': [5, 6],
    'island-adc': [11.5, 18.5], 'island-reg': [5.5, 24], 'island-sensor': [-11.5, 3],
    /* serving a language model: together, east of the halls and north of the solar field */
    'dc-quant': [22.5, -4], 'dc-token': [20.5, -9.5], 'dc-prefill': [16.5, -4],
    /* keep the chef busy: east of the hall that keeps numbers small */
    'dc-pantry': [28.5, -2.5] };
  GROWTH.forEach(gw => { const [x, z, y] = GROW_SPOT[gw.id] || [0, 0], g = group(G[gw.at], x, y || 0, z); g.visible = false; g.scale.setScalar(0.001); growing.push({ id: gw.id, g, built: false, t0: 0 }); });

  /* No question floats over a place any more (docs/framework/rebuild.md, section 3): a question shown as a dot on a
     map was rejected once already. The questions are on the first page and on every page of #/read. */
  const beaconOrbs = [];
  /* ---- every place can be picked ---- */
  const pickable = () => { pick.length = 0; Object.values(G).forEach(g => g.traverse(o => { if (o.isMesh && !o.userData.nopick) { o.userData.place = g.userData.place; pick.push(o); } })); beaconOrbs.forEach(o => pick.push(o)); poiPick.forEach(o => pick.push(o)); moverPick.forEach(o => pick.push(o)); tokenPick.forEach(o => pick.push(o)); };
  pickable();
  /* ---- names, with the state of each station's challenges ---- */
  const HGT = { studio: 9, quarry: 7, fab: 10, test: 7, port: 11, datacentre: 7, lab: 22, village: 19, phones: 16, cars: 9, idea: 8, tools: 10, materials: 13, power: 18 };
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
  /* a building with an inside (or a machine in an open one) says so when the mouse points at it: a ring of light round
     it on the ground, and Go inside over it, like the parts' names. A click still selects it, a double click goes in;
     a phone has the card's button */
  const canHover = matchMedia('(hover: hover) and (pointer: fine)');
  const goAt = new THREE.Object3D(); scene.add(goAt);
  const goLbl = L.add(goAt, new THREE.Vector3(), '', { cls: 'go3', html: '<span class="wia" aria-hidden="true">↓</span>' + t('frame.in.k').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]) });
  goLbl.show = false;
  const goRing = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 72), new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0.9, depthWrite: false }));
  goRing.rotation.x = -Math.PI / 2; goRing.visible = false; goRing.renderOrder = 3; scene.add(goRing);
  const footR = {}, gv = new THREE.Vector3();
  const footOf = id => { if (footR[id]) return footR[id]; const B = new THREE.Box3().setFromObject(G[id]), sz = new THREE.Vector3(); B.getSize(sz); return (footR[id] = Math.min(30, Math.max(6, Math.max(sz.x, sz.z) * 0.58))); };
  let goOn = null;
  const goHover = h => {
    const ok = !!(h && h.place && canHover.matches && on.inside && on.inside(h.place, h.part || null) && !(OPEN[h.place] && !h.part && OPEN[h.place].k > 0.5));
    goOn = ok ? h : null; goRing.visible = goLbl.show = ok; goLbl.el.classList.toggle('tool', ok && !!h.part); canvas.classList.toggle('goin', ok);
    if (!ok) return;
    if (h.part) { const T = OPEN[h.place].tools[h.part]; T.getWorldPosition(gv); goRing.position.set(gv.x, 0.3, gv.z); goRing.scale.setScalar((RING_R[h.part] || RING_R[h.place] || 3.6) * 1.2); goAt.position.set(gv.x, (PART_UP[h.part] || (h.place === 'fab' ? 3.8 : 2.6)) + 0.1, gv.z); }
    else { G[h.place].getWorldPosition(gv); goRing.position.set(gv.x, 0.3, gv.z); goRing.scale.setScalar(footOf(h.place)); goAt.position.set(gv.x, HGT[h.place] || 8, gv.z); }
  };
  /* seen from far out, the island's places fold into one name */
  L.add(scene, new THREE.Vector3(0, 12, 0), t('map.home'), { cls: 'place3 far home', min: 560 });
  /* the number pins of the loop, and your chip on it */
  const pins = {};
  STOPS6.forEach(s => { const [x, z] = PINS[s], g = group(scene, x, 0, z); cyl(g, 0.12, 0.12, 3, metal(P.metal), 0, 0, 0, 8); pins[s] = L.add(g, new THREE.Vector3(0, 3.6, 0), '', { cls: 'pin3', button: true, data: { place: STOP_PLACE[s] }, max: 380 }); });
  const token = new THREE.Group();
  box(token, 2.2, 0.35, 2.2, mat(P.chip, { roughness: 0.35, metalness: 0.4 }), 0, 0, 0, 0.12); box(token, 1.3, 0.12, 1.3, glow(P.accent, 1.5), 0, 0.35, 0, 0.05);
  for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) { const a = k * Math.PI / 2, pn = box(token, 0.12, 0.08, 0.4, metal(P.gold), 0, 0.1, 0, 0.02); pn.position.set(Math.cos(a) * 1.25 + Math.sin(a) * (j - 2) * 0.4, 0.14, Math.sin(a) * 1.25 - Math.cos(a) * (j - 2) * 0.4); pn.rotation.y = -a; }
  token.position.set(PINS.design[0] + 3, 1.2, PINS.design[1] + 2.4); scene.add(token);
  token.traverse(o => { if (o.isMesh) { o.userData.token = true; tokenPick.push(o); } }); pickable();
  let tokenGoal = token.position.clone(), tokenHome = tokenGoal.clone(), carriedTo = null;

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
    const els = [...Object.values(toolNames), ...Object.values(names), ...Object.values(pins), ...poiLabels].map(lb => lb.el).filter(e => e && e.isConnected && e.offsetParent && e.style.opacity !== '0');
    const rank = e => (e.classList.contains('sel') ? 0 : e.classList.contains('on') ? 1 : e.classList.contains('tool3') ? 2 : e.classList.contains('place3') ? 4 : 3);
    els.sort((a, b) => rank(a) - rank(b)); const kept = [];
    for (const e of els) { const r = e.getBoundingClientRect(); if (!r.width) continue;
      const hit = kept.some(k => Math.min(k.right, r.right) - Math.max(k.left, r.left) > 2 && Math.min(k.bottom, r.bottom) - Math.max(k.top, r.top) > 2);
      e.classList.toggle('hush', hit); if (!hit) kept.push(r); } };

  /* ---- input ---- */
  const ptrs = new Map(); let downAt = null, moved = 0, pinch0 = null, hover = null, carrying = null, carriedOnce = false;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const toNdc = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const ground = e => { toNdc(e); ray.setFromCamera(ndc, camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(groundPlane, p) ? p : null; };
  /* what is under the pointer: hidden things and the faded walls of an open building do not count; inside an open
     building, a tool is picked as itself */
  const seen = o => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
  const pickAt = e => { toNdc(e); ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(pick, false)) { const u = h.object.userData, open = !!OPEN[u.place] && OPEN[u.place].k > 0.5; if (!seen(h.object) || (u.ghost && open)) continue;
      if (u.token) return { token: true };
      if (u.walk) { const w = walkers.find(x => x.ai === (u.walk === 'd') && x.slot === h.instanceId); if (w) return { mover: w }; continue; }
      if (u.mover) return { mover: u.mover };
      return u.poi ? { poi: u.poi } : u.question ? { q: u.question } : { place: u.place, part: open && u.part ? u.part : null }; }
    return null; };
  /* what is selected (docs/INTERACTION.md): a place, and inside an open one a part; zooming further into it goes
     deeper, zooming far enough out leaves it */
  let sel = null, push = 0, pinchDeep = false;
  /* how close the camera must come before pushing on goes in: a part, an opened building as a whole (its first level), or a place */
  const deepAt = () => (!sel ? 0 : sel.part ? 40 : Math.max(38, placeAt(sel.place).d * 0.6));
  const leaveAt = () => placeAt(sel.place).d * 3.2;
  const deeper = () => { if (!sel || !on.deeper) return; const s0 = sel; push = 0; on.deeper(s0.place, s0.part); };
  const MAXD = innerWidth > 720 ? 1100 : 1400;
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId);
    /* your chip is picked up and carried (docs/INTERACTION.md, "Carry your chip") */
    { const h0 = ptrs.size ? null : pickAt(e); if (h0 && h0.token) { carrying = { id: e.pointerId, over: null }; fly = null; follow = null; canvas.style.cursor = 'grabbing'; on.interact && on.interact(); return; } } if (follow) { follow = null; on.unfollow && on.unfollow(); } ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, g: ground(e) }); downAt = { x: e.clientX, y: e.clientY }; moved = 0; fly = null; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { dist: Math.hypot(a.x - b.x, a.y - b.y), d: cam.d }; } on.interact && on.interact(); });
  canvas.addEventListener('pointermove', e => {
    if (carrying && e.pointerId === carrying.id) { const g = ground(e); if (!g) return; tokenGoal.set(g.x, 4, g.z); token.position.x = g.x; token.position.z = g.z;
      const over = PLACES.filter(p => !p.far).map(p => [p.id, Math.hypot(p.at[0] - g.x, p.at[1] - g.z)]).filter(([id, d]) => d < (placeAt(id).r || 14)).sort((a, b) => a[1] - b[1])[0];
      const id = over ? over[0] : null; if (id !== carrying.over) { Object.entries(names).forEach(([k, lb]) => lb.el.classList.toggle('drop', k === id)); carrying.over = id; } return; }
    if (!ptrs.size) { const h = pickAt(e), id = h && (h.part ? 'part:' + h.part : h.place || h.q || h.poi || (h.mover && 'mover') || (h.token && 'token')); if (id !== hover) { hover = id; canvas.style.cursor = id === 'token' ? 'grab' : id ? 'pointer' : ''; Object.entries(names).forEach(([k, lb]) => lb.el.classList.toggle('on', k === hover)); Object.entries(toolNames).forEach(([k, lb]) => lb.el.classList.toggle('on', 'part:' + k.split(':')[1] === hover && OPEN[k.split(':')[0]].k > 0.5)); goHover(h); } return; }
    const p = ptrs.get(e.pointerId); if (!p) return;
    moved += Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y); p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()], want = pinch0.d * pinch0.dist / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)); cam.d = clamp(want, 38, MAXD);
      if (!pinchDeep && sel && deepAt() && want < deepAt() * 0.8) { pinchDeep = true; deeper(); } return; }
    const g = ground(e); if (g && p.g) { const lim = cam.d > 300 ? 220 : 80; cam.x = clamp(cam.x + p.g.x - g.x, -lim, lim); cam.z = clamp(cam.z + p.g.z - g.z, -lim * 0.7, lim * 0.9); place2(); p.g = ground(e); }
  });
  const up = e => {
    if (carrying && e.pointerId === carrying.id) { const id = carrying.over; carrying = null; canvas.style.cursor = ''; Object.values(names).forEach(lb => lb.el.classList.remove('drop'));
      if (id) { const p = placeAt(id); tokenGoal.set(p.at[0] + 3, 1.2, p.at[1] + 2.4); carriedTo = id; on.carry && on.carry(id); } else tokenGoal.copy(tokenHome); return; }
    ptrs.delete(e.pointerId); if (ptrs.size < 2) { pinch0 = null; pinchDeep = false; } if (downAt && moved < 8 && !ptrs.size) { const h = pickAt(e); if (h && h.part) on.part && on.part(h.place, h.part); else if (h && h.place) on.place && on.place(h.place); else if (h && h.q) on.question && on.question(h.q); else if (h && h.poi) poiGo(h.poi); else if (h && h.mover) followMover(h.mover); } downAt = null; };
  /* following something that moves: the camera keeps it in the middle until you take the camera back (a drag, a
     pinch, a scroll) or close its card */
  const followMover = m => { follow = m; fly = null; sel = null; Object.values(OPEN).forEach(O => { O.want = 0; }); on.mover && on.mover(m.call ? { kind: m.ai ? 'agent' : 'person', call: m.call } : { kind: m.kind, lane: m.lane }); };
  const followAt = () => { if (!follow) return null; if (follow.pos) return follow.pos; if (follow.obj) return follow.obj.position; return null; };
  /* what calls: a bench plays its challenge, a board opens the questions asked at its place, a lantern its question */
  const poiGo = poi => { const [k, v] = [poi.slice(0, poi.indexOf(':')), poi.slice(poi.indexOf(':') + 1)];
    if (k === 'ch') on.challenge && on.challenge(v); else if (k === 'report') on.report && on.report(v); else if (k === 'ask') on.ask && on.ask(v); else if (k === 'q') on.question && on.question(v); else if (k === 'place') on.place && on.place(v); };
  /* a double tap goes in: into a building (it opens), or deeper into what is already selected */
  canvas.addEventListener('dblclick', e => { const h = pickAt(e); if (!h || !h.place) return; if (sel && sel.place === h.place && (h.part || null) === (sel.part || null) && deepAt()) deeper(); });
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (ptrs.size) return; hover = null; goHover(null); });
  /* pointing at a place's or a part's name says the same */
  host.addEventListener('pointerover', e => { const b = e.target.closest('[data-place]'); if (b && e.pointerType === 'mouse') goHover({ place: b.dataset.place, part: b.dataset.part || null }); });
  host.addEventListener('pointerout', e => { if (e.target.closest('[data-place]')) { hover = null; goHover(null); } });
  canvas.addEventListener('wheel', e => { e.preventDefault(); fly = null; if (follow) follow.near = true;   /* closer or further, still following */ cam.d = clamp(cam.d * Math.exp(e.deltaY * 0.0012), 38, MAXD); on.interact && on.interact();
    /* zooming on into what is selected, past where the camera stops, goes deeper */
    if (e.deltaY < 0 && sel && deepAt() && cam.d <= deepAt() + 0.5) { push += -e.deltaY; if (push > 180) deeper(); } else if (e.deltaY > 0) push = 0; }, { passive: false });
  /* the name over your chip is a handle too: pressing it picks the chip up */
  host.addEventListener('pointerdown', e => { if (!e.target.closest('.you')) return; e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* the canvas follows the pointer anyway */ }
    carrying = { id: e.pointerId, over: null }; carriedOnce = true; fly = null; follow = null; canvas.style.cursor = 'grabbing'; on.interact && on.interact(); });
  host.addEventListener('click', e => { if (carriedOnce) { carriedOnce = false; return; } const b = e.target.closest('[data-wf],[data-poi],[data-place],[data-q],[data-step],[data-job],[data-entry]'); if (!b) return; if (b.dataset.wf) on.whatif && on.whatif(b.dataset.wf); else if (b.dataset.poi) poiGo(b.dataset.poi); else if (b.dataset.part) on.part && on.part(b.dataset.place, b.dataset.part); else if (b.dataset.entry) on.entry && on.entry(b.dataset.entry); else if (b.dataset.place) on.place && on.place(b.dataset.place); else if (b.dataset.step) on.place && on.place(STATION[b.dataset.step]); else if (b.dataset.job) on.job && on.job(b.dataset.job); else on.question && on.question(b.dataset.q); });

  /* ---- the state: what has grown, the community's pieces, where your chip is ---- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let slotLabels = [], villageSeen = null;
  function setState(st, animate) {
    /* your chip's numbers: the columns they move, and the pace of the trucks round the loop (a fuller factory is slower) */
    if (st.chip) { const c = st.chip, fx = { heat: { datacentre: Math.min(1, 0.4 + 0.4 * c.powerBoard) }, fail: { test: Math.min(1, 0.45 + 0.8 * c.late + 1.2 * (1 - c.yield)), fab: Math.min(1, 0.4 + 1.5 * (1 - c.yield)) }, time: { fab: Math.min(1, c.days / 120) } };
      const was = JSON.stringify(chipFx); chipFx = fx; if (lens !== 'look' && was !== JSON.stringify(fx)) setLens(lens);
      const pace = Math.max(0.35, Math.min(1.6, 68 / c.days)); moving.forEach(m => { if (m.car) { if (m.base == null) m.base = m.speed; m.speed = m.base * pace; } }); }
    /* growth */
    let grew = false;
    growing.forEach(gr => { if (st.grown.has(gr.id) && !gr.built) { GROWERS[gr.id](gr.g); gr.built = true; gr.g.visible = true; grew = true; gr.t0 = animate && !reduced() ? performance.now() : -1; if (gr.t0 < 0) gr.g.scale.setScalar(1); if (animate) sparkle(gr.g); } });
    /* names, with a flag for what is left to do */
    PLACES.forEach(p => { const s = st.places[p.id];
      const flag = s && s.total ? (s.done === s.total ? '<span class="flag done">✓</span>' : '<span class="flag">' + (s.total - s.done) + '</span>') : p.id === 'village' && st.jobList.length ? '<span class="flag job">' + st.jobList.length + '</span>' : '';
      names[p.id].el.innerHTML = esc(t('map.' + p.id + '.t')) + flag + '<span class="peek">' + esc(t('map.' + p.id + '.d')) + '</span>'; });
    /* your chip, at the pin of its step */
    const [x, z] = PINS[st.chipAt] || NEED_AT; tokenHome = new THREE.Vector3(x + 3, 1.2, z + 2.4); if (!carriedTo) tokenGoal = tokenHome.clone();
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
    villageSeen = seenNow;
    if (squares(st) || grew) pickable();
    walk(st);
  }
  /* ---- the pull, walking (docs/INTERACTION.md, "What calls"): what is open pulls attention, read from the traces
     alone (src/engines/ledger.js, frontier), and the island shows it as figures setting out from the Lab for where the
     pull is, more of them the louder the call. People walk the roads; agents (AI) fly straight from the open port
     where they dock. They come in the shares the record shows of who has made what. They are the pull made visible,
     never anyone in particular. ---- */
  const WALK_FROM = [6, 21], PORT_AT = [10, 47], LANE = 2.3;
  const legG = new THREE.BoxGeometry(0.3, 0.8, 0.14), bodyG = new THREE.BoxGeometry(0.4, 0.62, 0.24), eyeG = new THREE.BoxGeometry(0.16, 0.05, 0.16);
  /* an agent: a small four-rotor drone, one geometry (a body, two crossed arms, four rotors) */
  const droneG = (() => { const parts = [new THREE.BoxGeometry(0.46, 0.14, 0.46)], arm = a => { const g0 = new THREE.BoxGeometry(1.3, 0.05, 0.08); g0.rotateY(a); return g0; };
    parts.push(arm(Math.PI / 4), arm(-Math.PI / 4)); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { const r0 = new THREE.CylinderGeometry(0.26, 0.26, 0.03, 16); r0.translate(a * 0.46, 0.08, b * 0.46); parts.push(r0); });
    const flatP = parts.map(g0 => (g0.index ? g0.toNonIndexed() : g0)), n = flatP.reduce((a, g0) => a + g0.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let k = 0;
    flatP.forEach(g0 => { pos.set(g0.attributes.position.array, k * 3); nor.set(g0.attributes.normal.array, k * 3); k += g0.attributes.position.count; });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return g; })();
  const NW = 28, inst = (geo, m) => { const im = new THREE.InstancedMesh(geo, m, NW); im.count = 0; im.castShadow = true; im.frustumCulled = false; scene.add(im); return im; };
  const W3 = { legs: inst(legG, mat(0x2b2f38, { roughness: 0.8 })), body: inst(bodyG, mat(0xffffff, { roughness: 0.8 })), head: inst(headG, mat(0xffffff, { roughness: 0.7 })),
    drone: inst(droneG, mat(night ? 0x6b7480 : 0x5a626d, { roughness: 0.4, metalness: 0.4 })), eye: inst(eyeG, glow(P.accent, 1.6)) };
  let walkers = [], walkSig = '';
  [W3.legs, W3.body, W3.drone].forEach(m => { m.userData.walk = m === W3.drone ? 'd' : 'p'; });
  /* the nearest point of the loop road, as a fraction of the way round */
  const LOOPN = 240, loopAt = [...Array(LOOPN)].map((_, i) => loop.curve.getPointAt(i / LOOPN));
  const nearLoop = ([x, z]) => { let b = 0, bd = Infinity; loopAt.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; b = i; } }); return b; };
  const roads = {};
  /* a person's way: down the Lab's road to the loop, along the loop on its pavement the shorter way, then across to
     where the call is */
  const roadTo = (key, T) => roads[key] || (roads[key] = (() => {
    const a = nearLoop([6, 15]), b = nearLoop(T), n = LOOPN, fw = (b - a + n) % n, dir = fw <= n / 2 ? 1 : -1, steps = dir > 0 ? fw : n - fw, pts = [new THREE.Vector3(WALK_FROM[0], 0, WALK_FROM[1]), new THREE.Vector3(6.6, 0, 17)];
    for (let k = 0; k <= steps; k += 4) { const i = (a + dir * k + n) % n, p = loopAt[i], tg = loop.curve.getTangentAt(i / n), nx = -tg.z * dir, nz = tg.x * dir; pts.push(new THREE.Vector3(p.x + nx * LANE, 0, p.z + nz * LANE)); }
    pts.push(new THREE.Vector3(T[0], 0, T[1])); return new THREE.CatmullRomCurve3(pts, false, 'centripetal'); })());
  /* an agent's way: up from the open port and straight over, coming down where the call is */
  const flightTo = T => { const a = new THREE.Vector3(PORT_AT[0], 3, PORT_AT[1]), b = new THREE.Vector3(T[0], 2.4, T[1]), m = a.clone().lerp(b, 0.5); m.y = 9 + a.distanceTo(b) * 0.06; return new THREE.QuadraticBezierCurve3(a, m, b); };
  function walk(st) {
    const pull = st.pull || [], sig = JSON.stringify([pull.map(f => [f.kind, f.key, f.at, Math.round(f.pull)]), st.aiShare, st.designs.length, st.jobList.length]);
    if (sig === walkSig) return; walkSig = sig;
    /* where each call stands: a workshop or a plot of the village, or a place's square */
    const vIdx = f => { const D = st.designs.findIndex(d => d.id === f.key); if (f.kind === 'break' && D >= 0) return D; const J = st.jobList.findIndex(j => j.need === f.key); if (J >= 0) return st.designs.length + J; const E = st.engineList.findIndex(e => e.need === f.key); return E >= 0 ? st.designs.length + st.jobList.length + E : -1; };
    const at = f => { if (['break', 'build', 'engine'].includes(f.kind)) { const i = vIdx(f); if (i >= 0 && i < SLOTS.length) { const [sx, sz] = SLOT(i), v = placeAt('village').at; return [v[0] + sx, v[1] + sz + 2.6]; } }
      const q = SQUARE[f.at] || SQUARE.lab; return [q[0] + 1.5, q[1] + 2.4]; };
    const was = walkers; walkers = []; let j = 0;
    for (const f of pull) { const n = Math.max(1, Math.min(2, Math.round(f.pull / 2))), T = at(f), far = Math.hypot(T[0], T[1]) > 120; if (far) continue;
      for (let k = 0; k < n && walkers.length < NW; k++, j++) { const ai = rnd(j, 77) < (st.aiShare == null ? 0.5 : st.aiShare), Tk = [T[0] + (rnd(j, 78) - 0.5) * 2.4, T[1] + (rnd(j, 79) - 0.5) * 1.6];
        const path = ai ? flightTo(Tk) : roadTo(f.kind + f.key + k, Tk), len = path.getLength(), speed = ai ? 7 : 3.2;
        const w = { ai, path, go: len / speed, stay: 5 + rnd(j, 80) * 6, rest: 2 + rnd(j, 81) * 5, t: rnd(j, 82) * (len / speed * 2 + 10), col: CLOTHES[j % 5], call: { kind: f.kind, key: f.key, at: f.at } };
        /* attention moves: a figure already out on the island turns from where it is toward the new call, rather than
           starting again from the Lab */
        const old = was.find(o => o.ai === ai && o.pos && !o.taken); if (old && was.length) { old.taken = true; const a = old.pos.clone(), b = new THREE.Vector3(Tk[0], ai ? 2.4 : 0, Tk[1]), m = a.clone().lerp(b, 0.5); if (ai) m.y = Math.max(a.y, b.y) + 4;
          w.lead = new THREE.QuadraticBezierCurve3(a, m, b); w.leadT = 0; w.leadGo = w.lead.getLength() / speed; w.t = w.rest + w.go; w.col = old.col; if (follow === old) follow = w; }
        walkers.push(w); } }
    const C2 = new THREE.Color(); let p = 0;
    walkers.forEach((w, i) => { if (!w.ai) { W3.body.setColorAt(p, C2.setHex(w.col)); W3.head.setColorAt(p, C2.setHex(SKIN[i % 4])); w.slot = p++; } });
    W3.legs.count = W3.body.count = W3.head.count = p; W3.drone.count = W3.eye.count = walkers.filter(w => w.ai).length; let q = 0; walkers.forEach(w => { if (w.ai) w.slot = q++; });
    [W3.body, W3.head].forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  const WP = new THREE.Vector3(), WT = new THREE.Vector3(), WQ = new THREE.Quaternion(), WS = new THREE.Vector3(1, 1, 1), WM = new THREE.Matrix4(), WUP = new THREE.Vector3(0, 1, 0);
  function walkFrame(dt, tm) {
    if (!walkers.length) return;
    walkers.forEach(w => {
      const cyc = w.rest + w.go + w.stay + w.go;
      if (w.lead) { if (!reduced()) w.leadT += dt; const k = reduced() ? 1 : Math.min(1, w.leadT / w.leadGo); w.lead.getPointAt(k, WP); w.lead.getTangentAt(Math.min(0.999, Math.max(0.001, k)), WT); if (k >= 1) w.lead = null; place1(w, WP, WT, k < 1, tm); return; }
      if (!reduced()) w.t = (w.t + dt) % cyc; const t = reduced() ? w.rest + w.go + 1 : w.t;
      /* resting at the Lab, on the way, there for a while, and back */
      let s, back = false; if (t < w.rest) s = 0; else if (t < w.rest + w.go) s = (t - w.rest) / w.go; else if (t < w.rest + w.go + w.stay) s = 1; else { s = 1 - (t - w.rest - w.go - w.stay) / w.go; back = true; }
      w.path.getPointAt(Math.min(1, Math.max(0, s)), WP); w.path.getTangentAt(Math.min(0.999, Math.max(0.001, s)), WT); if (back) WT.negate();
      place1(w, WP, WT, s > 0 && s < 1, tm);
    });
    Object.values(W3).forEach(m => { m.instanceMatrix.needsUpdate = true; m.boundingSphere = null; });
  }
  /* one figure drawn where it is, facing the way it goes; where it is is kept, for following and for turning it */
  function place1(w, WP, WT, moving, tm) {
      const yaw = Math.atan2(WT.x, WT.z); w.pos = (w.pos || new THREE.Vector3()).copy(WP);
      if (w.ai) { const y = WP.y + Math.sin(tm * 3 + w.slot) * 0.12; WQ.setFromAxisAngle(WUP, yaw); WS.set(0.7, 0.7, 0.7);
        WM.compose(WT.set(WP.x, y, WP.z), WQ, WS); W3.drone.setMatrixAt(w.slot, WM); WM.compose(WT.set(WP.x, y + 0.06, WP.z), WQ, WS); W3.eye.setMatrixAt(w.slot, WM); WS.set(1, 1, 1); }
      else { const bob = moving ? Math.abs(Math.sin(tm * 9 + w.slot)) * 0.06 : 0; WQ.setFromAxisAngle(WUP, yaw);
        WM.compose(WT.set(WP.x, 0.4 + bob, WP.z), WQ, WS); W3.legs.setMatrixAt(w.slot, WM); WM.compose(WT.set(WP.x, 1.11 + bob, WP.z), WQ, WS); W3.body.setMatrixAt(w.slot, WM);
        WM.compose(WT.set(WP.x, 1.56 + bob, WP.z), WQ, WS.set(1.6, 1.6, 1.6)); W3.head.setMatrixAt(w.slot, WM); WS.set(1, 1, 1); }
  }
  /* ---- lenses (docs/INTERACTION.md, "Lenses"): the same world seen for one thing at a time. The world drains to grey
     and what the lens is about rises out of it: a column of light over each place, as tall as that place has of it.
     The values are relative and qualitative (no figures without a source): where the heat is, where things fail,
     where a chip spends its time; flow lights everything that moves. ---- */
  const LENS_VAL = {
    heat: { datacentre: 1, fab: 0.72, quarry: 0.6, materials: 0.55, power: 0.45, cars: 0.4, phones: 0.35, test: 0.3, tools: 0.3, port: 0.25, lab: 0.2, studio: 0.15, village: 0.08 },
    fail: { test: 1, fab: 0.8, cars: 0.72, datacentre: 0.65, studio: 0.55, phones: 0.45, port: 0.35, quarry: 0.3 },
    time: { fab: 1, studio: 0.9, quarry: 0.45, materials: 0.4, port: 0.3, test: 0.25 }
  };
  const LENS_COL = { heat: [0xf2c14e, 0xe0442e], fail: [0xf3a0a0, 0xd02f3a], time: [0xa9d0f2, 0x2f6fd0] };
  const lensG = group(scene, 0, 0, 0), colG = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true); colG.translate(0, 0.5, 0);
  const discG = new THREE.CircleGeometry(1, 40); discG.rotateX(-Math.PI / 2);
  /* your chip's own numbers move the columns where it is made, tested and used (src/engines/chip.js, model) */
  let chipFx = null;
  let lens = 'look', lensK = 0, colK = 0, lensWant = 0, lensMats = null, lensCols = [], lensArrs = null;
  const lensSave = () => { if (lensMats) return; const seen = new Set(); lensMats = [];
    /* colours kept per vertex (the ground) or per copy (the trees) drain too */
    lensArrs = []; scene.traverse(o => { if (!o.isMesh || o.userData.lens) return; const a = o.isInstancedMesh ? o.instanceColor : o.geometry && o.geometry.attributes.color; if (a && a.array.length > 2) lensArrs.push({ a, c: a.array.slice() }); });
    scene.traverse(o => { if (!o.isMesh || o.parent === lensG || o.userData.lens) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!m || seen.has(m) || !m.color) return; seen.add(m); lensMats.push({ m, c: m.color.clone(), e: m.emissiveIntensity }); }); }); };
  const GREY = new THREE.Color();
  const lensPaint = k => { if (!lensMats) return; lensMats.forEach(({ m, c, e }) => { const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; GREY.setRGB(l * 0.9 + 0.08, l * 0.9 + 0.09, l * 0.9 + 0.1); m.color.copy(c).lerp(GREY, 0.82 * k); if (e != null) m.emissiveIntensity = e * (1 - 0.7 * k); });
    (lensArrs || []).forEach(({ a, c }) => { const A = a.array, w = 0.8 * k; for (let i = 0; i < A.length; i += 3) { const l = (0.2126 * c[i] + 0.7152 * c[i + 1] + 0.0722 * c[i + 2]) * 0.92 + 0.06; A[i] = c[i] + (l - c[i]) * w; A[i + 1] = c[i + 1] + (l - c[i + 1]) * w; A[i + 2] = c[i + 2] + (l + 0.01 - c[i + 2]) * w; } a.needsUpdate = true; });
    lensCols.forEach(c => { const q = Math.min(k, colK); c.mesh.scale.set(c.r, Math.max(0.01, c.h * q), c.r); c.disc.material.opacity = 0.55 * q; c.mesh.material.opacity = 0.42 * q; });
    lanes.forEach(ln => { ln.m.material.opacity = (night ? 0.45 : 0.55) * (1 - k) + (lens === 'flow' ? 1 : 0.2) * k; }); };
  function setLens(name) {
    lens = name || 'look'; lensWant = lens === 'look' ? 0 : 1; if (lensWant) lensSave();
    lensCols.forEach(c => { lensG.remove(c.mesh); lensG.remove(c.disc); }); lensCols = [];
    const V = LENS_VAL[lens] && Object.assign({}, LENS_VAL[lens], (chipFx || {})[lens] || {}); if (!V) return;
    const [lo, hi] = LENS_COL[lens];
    Object.entries(V).forEach(([id, v]) => { const p = placeAt(id); if (!p) return; const col = new THREE.Color(lo).lerp(new THREE.Color(hi), v), r = p.far ? 14 : Math.min(9, (p.r || 9) * 0.55);
      const mesh = new THREE.Mesh(colG, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: night ? THREE.AdditiveBlending : THREE.NormalBlending }));
      const disc = new THREE.Mesh(discG, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false }));
      mesh.position.set(p.at[0], 0.2, p.at[1]); disc.position.set(p.at[0], 0.25, p.at[1]); disc.scale.setScalar(r * 1.6); mesh.userData.lens = disc.userData.lens = true;
      lensG.add(mesh, disc); lensCols.push({ mesh, disc, r, h: 6 + v * 38, v }); });
    colK = 0;
  }
  /* a change made at one place, seen arriving at the others: a light travels over the island from where you changed
     something to where it shows, and rings out there */
  const flashes = [], ripG = new THREE.SphereGeometry(1, 16, 10), ringG = new THREE.RingGeometry(0.8, 1, 48); ringG.rotateX(-Math.PI / 2);
  function ripple(from, tos, color) { const a = placeAt(from); if (!a || reduced()) return; tos.forEach((to, i) => { const b = placeAt(to); if (!b) return;
    const m = new THREE.Mesh(ripG, new THREE.MeshBasicMaterial({ color: color || P.accent, transparent: true, opacity: 0.95, depthWrite: false })); m.scale.setScalar(1.3); m.userData.lens = true; scene.add(m);
    const A = new THREE.Vector3(a.at[0], 3, a.at[1]), B = new THREE.Vector3(b.at[0], 3, b.at[1]), M = A.clone().lerp(B, 0.5); M.y = 10 + A.distanceTo(B) * 0.25;
    flashes.push({ m, c: new THREE.QuadraticBezierCurve3(A, M, B), t: -i * 0.25, to: B, color: color || P.accent }); }); }
  function rippleFrame(dt) { for (let i = flashes.length - 1; i >= 0; i--) { const r = flashes[i]; r.t += dt / 1.3;
      if (!r.ring && r.t >= 0) { r.c.getPointAt(Math.min(1, r.t), r.m.position); }
      if (!r.ring && r.t >= 1) { scene.remove(r.m); r.ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide })); r.ring.position.set(r.to.x, 0.4, r.to.z); r.ring.userData.lens = true; scene.add(r.ring); r.t0 = r.t; }
      if (r.ring) { const k = (r.t - r.t0) / 0.9; r.ring.scale.setScalar(2 + k * 16); r.ring.material.opacity = 0.9 * (1 - k); if (k >= 1) { scene.remove(r.ring); flashes.splice(i, 1); } } } }
  function lensFrame(dt) { rippleFrame(dt); whatifFrame(dt); const k0 = lensK, c0 = colK; lensK += (lensWant - lensK) * Math.min(1, dt * 3); colK += (lensWant - colK) * Math.min(1, dt * 2.2); if (Math.abs(lensK - k0) > 1e-4 || Math.abs(colK - c0) > 1e-4) lensPaint(lensK);
    if (!lensWant && lensK < 0.002 && lensMats) { lensPaint(0); lensMats = null; lensArrs = null; lensCols.forEach(c => { lensG.remove(c.mesh); lensG.remove(c.disc); }); lensCols = []; } }
  /* What if? between the islands (src/engines/ripple.js, src/v2/whatif.js): the world goes grey as under a lens, and
     each island the levers reach raises a column, warm where a thing rises and cool where it falls, as tall as the
     change (on a scale of tens); a tag over it says the island's largest change. When a lever moves, a light flies
     from its island to each island it reaches. st: { heads: [{ place, v, up, lever, html }], flights } or null. */
  const wfG = group(scene, 0, 0, 0); let wfCols = [], wfTags = [], wfK = 0, wfWant = 0;
  const wfClear = () => { wfCols.forEach(c => { wfG.remove(c.mesh, c.disc); c.mesh.material.dispose(); c.disc.material.dispose(); }); wfCols = [];
    wfTags.forEach(T => { T.el.remove(); const i = L.list.indexOf(T); if (i >= 0) L.list.splice(i, 1); }); wfTags = []; };
  function whatif(state) {
    const on = !!state; host.classList.toggle('whatif', on); wfWant = on ? 1 : 0;
    if (!on) { wfTags.forEach(T => { T.show = false; T.el.style.opacity = '0'; T.el.style.pointerEvents = 'none'; }); if (lens === 'whatif') setLens('look'); return; }
    if (lens !== 'whatif') setLens('whatif');
    wfClear();
    state.heads.forEach(h => { const p = placeAt(h.place); if (!p) return; const r = p.far ? 9 : 5.5, col = h.up ? P.warm : P.accent;
      const mesh = new THREE.Mesh(colG, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: night ? THREE.AdditiveBlending : THREE.NormalBlending }));
      const disc = new THREE.Mesh(discG, new THREE.MeshBasicMaterial({ color: h.lever ? P.white : col, transparent: true, opacity: 0, depthWrite: false }));
      mesh.position.set(p.at[0], 0.2, p.at[1]); disc.position.set(p.at[0], 0.3, p.at[1]); disc.scale.setScalar(r * (h.lever ? 2.1 : 1.6)); mesh.userData.lens = disc.userData.lens = true;
      const hgt = 4 + 14 * Math.log10(1 + Math.abs(h.v)); wfG.add(mesh, disc); const c = { mesh, disc, r, h: hgt, lever: h.lever }; wfCols.push(c);
      const anchor = new THREE.Object3D(); anchor.position.set(p.at[0], 0, p.at[1]); wfG.add(anchor); c.anchor = anchor;
      wfTags.push(L.add(anchor, new THREE.Vector3(0, hgt + 3, 0), '', { cls: 'wf3' + (h.up ? ' up' : ' down') + (h.lever ? ' lever' : ''), button: true, data: { wf: h.place }, html: h.html })); });
    (state.flights || []).forEach(f => ripple(f.from, f.to, P.warm));
  }
  function whatifFrame(dt) { wfK += (wfWant - wfK) * Math.min(1, dt * 2.4); const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 380);
    wfCols.forEach(c => { c.mesh.scale.set(c.r, Math.max(0.01, c.h * wfK), c.r); c.mesh.material.opacity = (night ? 0.45 : 0.62) * wfK; c.disc.material.opacity = (c.lever ? 0.55 * pulse : 0.45) * wfK; });
    if (!wfWant && wfK < 0.01 && wfCols.length) wfClear(); }
  /* tags over islands close together (the main island holds seven places) step down out of each other's way */
  function whatifDeclutter() { if (!wfTags.length) return; const R0 = wfTags.map(T => { T.el.style.marginTop = '0px'; return { T, r: T.el.getBoundingClientRect() }; }).filter(x => x.r.width).sort((a, b) => a.r.top - b.r.top), placed = [];
    R0.forEach(({ T, r }) => { let dy = 0; for (let n = 0; n < 6; n++) { const hit = placed.find(q => r.left < q.right + 4 && r.right > q.left - 4 && r.top + dy < q.bottom + 3 && r.bottom + dy > q.top - 3); if (!hit) break; dy = hit.bottom + 3 - r.top; }
      if (dy) T.el.style.marginTop = dy.toFixed(0) + 'px'; placed.push({ left: r.left, right: r.right, top: r.top + dy, bottom: r.bottom + dy }); }); }
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
    { const fp = followAt(); if (fp && !fly) { const k = Math.min(1, dt * 2.5), want = follow.kind === 'plane' ? 140 : follow.kind === 'ship' ? 70 : 34; cam.x += (fp.x - cam.x) * k; cam.z += (fp.z - cam.z) * k; if (!follow.near) { cam.d += (want - cam.d) * k; if (Math.abs(cam.d - want) < 1) follow.near = true; } } }
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
    if (goRing.visible) goRing.material.opacity = reduced() ? 0.9 : 0.62 + 0.3 * Math.sin(tm * 4);
    if (FAB.inside.visible && !reduced()) FAB.carriers.forEach(c => { c.u = (c.u + dt * 0.03) % 1; c.obj.position.copy(FAB.oht.getPointAt(c.u)); const tg = FAB.oht.getTangentAt(c.u); c.obj.rotation.y = Math.atan2(-tg.z, tg.x); });
    /* pulling far enough out of what is selected leaves it */
    if (sel && !fly && cam.d > leaveAt()) { const was = sel; sel = null; Object.values(OPEN).forEach(O => { O.want = 0; }); on.leave && on.leave(was.place); }
    token.position.lerp(tokenGoal, Math.min(1, dt * (carrying ? 12 : 2.2))); token.position.y = (carrying ? 4 : 1.2) + Math.sin(tm * 2) * 0.25; token.rotation.y += dt * 0.8;
    powerBet(dt);
    if (!reduced()) {
      spinning.forEach((f, i) => { if (f.rotor) f.rotor.rotation.z -= dt * f.spin * (f.on == null ? 1 : f.on); else if (f.jib) f.jib.rotation.y = Math.sin(tm * 0.2) * 0.9; else if (f.hand) f.hand.rotation.z = -tm * 0.8; else f.rotation.y += dt * (2 + (i % 3)); });
      ripples.offset.set(tm * 0.004, tm * 0.0025); foamM.opacity = (night ? 0.4 : 0.68) + (night ? 0.1 : 0.2) * Math.sin(tm * 0.9);
      pulses.forEach((p, i) => { if (p.material.emissiveIntensity != null) p.material.emissiveIntensity = (night ? 1.2 : 0.6) * (0.75 + 0.25 * Math.sin(tm * 2 + i)); });
      bobbing.forEach(b => { if (b.ring !== undefined) { const u = (tm * 0.5 + b.ring / 3) % 1; b.obj.scale.setScalar(1 + u * 6); b.obj.material.opacity = 0.6 * (1 - u); } else b.obj.position.y = b.base + Math.sin(tm * 1.4 + b.k) * 0.4; });
      flows.forEach((m, i) => { const u = (tm * 0.018 + i / flows.length) % 1, p = loop.curve.getPointAt(u), tg = loop.curve.getTangentAt(u); m.position.set(p.x, 0.12, p.z); m.rotation.y = Math.atan2(-tg.z, tg.x); });
      lanes.forEach(ln => { for (let i = 0; i < ln.n; i++) { const u = (i / ln.n + tm * ln.speed) % 1, p = ln.c.getPointAt(u), q = ln.c.getTangentAt(u); M4.compose(V.set(p.x, ln.y, p.z), Q.setFromAxisAngle(UP, Math.atan2(-q.z, q.x)), S3.set(1, 1, 1)); ln.m.setMatrixAt(i, M4); } ln.m.instanceMatrix.needsUpdate = true; });
      { const u = (tm * 0.006) % 1, p = flight.getPointAt(u), q = flight.getTangentAt(u); plane.position.copy(p); plane.rotation.set(0, Math.atan2(-q.z, q.x), 0); plane.rotateX(-0.18); }
      moving.forEach(m => {
        if (m.ship) { m.u = (m.u || 0) + dt * m.speed; const u = m.bounce ? 1 - Math.abs(1 - (m.u % 2)) : m.u % 1, back = m.bounce && (m.u % 2) > 1; const p = m.path.getPointAt(u), q = m.path.getTangentAt(u); m.obj.position.set(p.x, 0, p.z); m.obj.rotation.y = Math.atan2(-q.z, q.x) + (back ? Math.PI : 0); return; }
        m.u = (m.u + dt * m.speed + 1) % 1; const p = m.curve.getPointAt(m.u), tg = m.curve.getTangentAt(m.u), n = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
        m.obj.position.set(p.x + n.x * m.lane, 0.05, p.z + n.z * m.lane); m.obj.rotation.y = Math.atan2(-tg.z, tg.x) + (m.speed < 0 ? Math.PI : 0);
      });
    }
    walkFrame(dt, tm); lensFrame(dt);
    st.draw(scene, camera);
    L.update(camera, W, H); if (wfTags.length && frameN % 6 === 3) whatifDeclutter();
    /* by the clock, not by frames, so a slow device does not leave names on one another for long */
    if (now - declutAt > 120) { declutAt = now; declutter(); }
    if ((frameN = (frameN + 1) % 6) === 0 && mini.offsetParent) { const M0 = mini.M0; miniView.setAttribute('points', footprint().map(([x, z]) => (x - M0.x0).toFixed(1) + ',' + (z - M0.z0).toFixed(1)).join(' ')); mini.querySelectorAll('.mdot').forEach(b => b.classList.toggle('sel', !!sel && b.dataset.place === sel.place)); }
  };
  raf = requestAnimationFrame(frame);
  place2();

  return {
    focus(id, o = {}) {
      const p = placeAt(id); if (!p) return; follow = null;
      /* the place sits in the upper part of the screen: the dock takes the lower part */
      /* an opened place is framed on its inside (the port's packing hall stands off its centre) */
      const off = { port: [-8, 8], datacentre: [0, 2], studio: [-4, -1] }[id] || [0, 0];
      /* on a phone an opened building is framed closer and lower, in the room between the bar and the card */
      const wide = innerWidth > 720, near = { fab: 1.3, studio: 1.15, test: 1.05, port: 1.05, datacentre: 1.2 }[id], nearP = { fab: 1.3, studio: 1.0, test: 1.0, port: 0.85, datacentre: 1.15 }[id];
      /* on a wide screen the card is a bench at the right and the picture keeps the place in its middle */
      const d = p.d * (wide ? near || 1.6 : nearP || 2), upv = innerWidth >= 1100 ? 0 : o.center ? (wide ? -d * 0.03 : d * 0.16) : d * (wide ? 0.14 : id === 'village' ? 0.08 : nearP ? 0.17 : 0.24);
      flyTo(p.at[0] + off[0] + Math.sin(cam.yaw) * upv, p.at[1] + off[1] + Math.cos(cam.yaw) * upv, d);
    },
    overview() { follow = null; const h = home(); flyTo(h.x, h.z, h.d); },
    unfollow() { follow = null; },
    setLens,
    ripple,
    whatif,
    /* pull back far enough to see several places at once (a change and where it shows) */
    frame(ids) { const ps = ids.map(placeAt).filter(Boolean); if (!ps.length) return; follow = null; const xs = ps.map(p => p.at[0]), zs = ps.map(p => p.at[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      const ext = Math.max(Math.max(...xs) - Math.min(...xs), (Math.max(...zs) - Math.min(...zs)) * 1.5); flyTo(cx, cz + 6, Math.max(cam.d, ext * 1.25 + 70), 900); },
    lens: () => lens,
    /* your chip, set down by the island after a carry it did not take (it goes back to its step) */
    chipHome() { carriedTo = null; tokenGoal.copy(tokenHome); },
    selected: () => sel,
    /* where a place, or a part inside it, is on the screen now: the point a portal opens from (0 to 1 across, down) */
    screenOf(place, part) { const p = placeAt(place); if (!p) return null; const v = new THREE.Vector3(p.at[0], 2, p.at[1]); const T = part && OPEN[place] && OPEN[place].tools[part]; if (T) { T.getWorldPosition(v); v.y += 1; } v.project(camera); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }; },
    /* select a place, and inside an open one a part; the factory opens while it is selected */
    select(place, part) {
      sel = place ? { place, part: part || null } : null; push = 0; Object.entries(OPEN).forEach(([id, O]) => { O.want = id === place ? 1 : 0; });
      const T = place && part && OPEN[place] && OPEN[place].tools[part];
      Object.entries(toolNames).forEach(([k, lb]) => lb.el.classList.toggle('sel', !!T && k === place + ':' + part));
      if (T) { const v = new THREE.Vector3(), wide = innerWidth > 720; placeRing(place, part); T.getWorldPosition(v);
        const d = wide ? 48 : 64, upv = innerWidth >= 1100 ? 0 : d * (wide ? 0.12 : 0.18); flyTo(v.x + Math.sin(cam.yaw) * upv, v.z + Math.cos(cam.yaw) * upv, d); }
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
    /* What if?: every island in view, and on a desktop the world set to the right of the bench at the left */
    whatifView() { const xs = PLACES.map(p => p.at[0]), zs = PLACES.map(p => p.at[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2, wide = innerWidth > 720;
      const d = wide ? 640 : 1250, k = wide && innerWidth < 1100 ? d * 0.22 * (420 / innerWidth) * 2.2 : 0; flyTo(cx - Math.cos(cam.yaw) * k, cz + Math.sin(cam.yaw) * k + (wide ? 0 : 60), d, 1400); },
    /* the archipelago: the islands where chips live, and the sea between */
    ecosystem() { if (innerWidth > 720) flyTo(-6, 6, 760, 1500); else flyTo(-4, 120, 1400, 1500); },
    setState,
    pause() { running = false; cancelAnimationFrame(raf); },
    warm: () => st.warm(scene, camera),
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    camera
  };
}
