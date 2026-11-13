/* The redesign's 3D kit: one renderer, light, materials and shapes shared by the map and the places.
   Look: a lit, softly shadowed diorama: rounded solids, matte paint, a little metal, glass that glows at
   night. Two palettes, light (day) and dark (night). Words are never drawn into the 3D scene: labels are
   HTML elements placed over projected points (label()), so any language and any length works. */
import * as THREE from '../vendor/three.min.js';
import { RoomEnvironment, RoundedBoxGeometry } from '../vendor/three-extras.js';

export { THREE };

/* the palettes: day and night */
export const PALETTES = {
  light: { sky: 0xcfe0ee, fog: 0xcfe0ee, ground: 0xb9cf9e, grass: 0x93b679, sea: 0x6fa8d0, road: 0x6f7682, roadLine: 0xf4f1ea, white: 0xf3f1ec, wall: 0xdcd8d0, slate: 0x5d6b7e, dark: 0x2f3a4a, metal: 0xb7bec8, glass: 0x9fc4dc, accent: 0x2f7de1, warm: 0xf0a33a, good: 0x2fa36b, bad: 0xd8504a, sand: 0xe6cf9c, rack: 0x39424f, board: 0x2b5f45, gold: 0xd2a744, chip: 0x2a2f38, emissive: 0.0 },
  dark: { sky: 0x0b1120, fog: 0x0b1120, ground: 0x1d2a33, grass: 0x1f3a32, sea: 0x0e2238, road: 0x343c4c, roadLine: 0x6b7586, white: 0xc9d1dc, wall: 0x3a4456, slate: 0x55657c, dark: 0x1c2330, metal: 0x7d8796, glass: 0x5aa9e6, accent: 0x5aa9ff, warm: 0xffb347, good: 0x45d08a, bad: 0xff6b62, sand: 0x6e6047, rack: 0x262d38, board: 0x1f4a37, gold: 0xc9a14a, chip: 0x1d222a, emissive: 1.0 }
};
export const theme = () => (document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

/* one stage: a single renderer and one GL canvas, shared by every 3D view (the island, the data centre, the chip,
   the board). Each view keeps its own canvas as the surface you touch and focus; the pictures are all drawn on
   the one GL canvas beneath, by whichever view is running. One context instead of one per view: less memory on a
   phone, shaders compiled once for every scene that shares a material, and a view that comes back has nothing
   to rebuild. Soft shadows and image-based light for the metal and glass. */
let ONE = null;
const SZ = new THREE.Vector2();
function one() {
  if (ONE) return ONE;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer), env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const cv = renderer.domElement; cv.className = 'gl'; cv.setAttribute('aria-hidden', 'true');
  return (ONE = { renderer, env, cv });
}
/* a view on the stage: size() says how big its picture is (a hidden view's zero size is ignored), draw() puts
   its scene on the GL canvas, warm() compiles its shaders ahead while another view is showing */
export function stage(canvas) {
  const o = one();
  if (!o.cv.parentNode) canvas.parentNode.insertBefore(o.cv, canvas.parentNode.firstChild);
  let w = 0, h = 0;
  return {
    renderer: o.renderer, env: o.env,
    size(W, H) { if (W > 0 && H > 0) { w = W; h = H; } },
    draw(scene, camera) { if (!w) return; o.renderer.getSize(SZ); if (SZ.x !== w || SZ.y !== h) o.renderer.setSize(w, h, false); o.renderer.render(scene, camera); },
    warm(scene, camera) { const c = o.renderer.compileAsync; return c ? c.call(o.renderer, scene, camera).catch(() => { /* compiled on first draw instead */ }) : Promise.resolve(); }
  };
}
/* the GL canvas shows while a 3D view is in front, and steps aside for the flat views and the pages */
export const showStage = on => { if (ONE) ONE.cv.hidden = !on; };

/* light for a scene: sky and ground bounce, and a sun that casts soft shadows over a square of side `span` */
export function light(scene, P, span = 120) {
  const night = P.emissive > 0;
  const hemi = new THREE.HemisphereLight(night ? 0x6f86b6 : 0xeaf2ff, night ? 0x10141c : 0x8a8270, night ? 0.5 : 0.55);
  const sun = new THREE.DirectionalLight(night ? 0xa9bff0 : 0xfff1dc, night ? 0.9 : 2.1);
  sun.position.set(-span * 0.5, span * 0.9, span * 0.6); sun.castShadow = true;
  const s = sun.shadow; s.mapSize.set(innerWidth > 900 ? 4096 : 2048, innerWidth > 900 ? 4096 : 2048); s.bias = -0.0008; s.normalBias = 0.06; s.radius = 3;
  Object.assign(s.camera, { left: -span / 2, right: span / 2, top: span / 2, bottom: -span / 2, near: 1, far: span * 3 });
  scene.add(hemi, sun, sun.target);
  return { hemi, sun };
}

/* materials, cached by their settings */
const MATS = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.72, metalness: 0.02 }, o)));
  return MATS.get(key);
}
export const metal = (color, o = {}) => mat(color, Object.assign({ roughness: 0.32, metalness: 0.75 }, o));
export const glow = (color, intensity = 1, o = {}) => mat(color, Object.assign({ emissive: color, emissiveIntensity: intensity, roughness: 0.4 }, o));
export const glass = (color, o = {}) => mat(color, Object.assign({ roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.45 }, o));
export const clearMats = () => MATS.clear();

/* shapes: a rounded box standing on y = 0 of its own frame, placed at (x, y, z) */
const GEO = new Map();
const rbox = (w, h, d, r) => { const k = [w, h, d, r].join(); if (!GEO.has(k)) GEO.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2))); return GEO.get(k); };
export function box(parent, w, h, d, material, x = 0, y = 0, z = 0, r = 0.08, o = {}) {
  const m = new THREE.Mesh(r > 0 ? rbox(w, h, d, r) : new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y + h / 2, z); m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false;
  parent.add(m); return m;
}
export function cyl(parent, rTop, rBot, h, material, x = 0, y = 0, z = 0, seg = 24, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), material);
  m.position.set(x, y + h / 2, z); m.castShadow = o.cast !== false; m.receiveShadow = true;
  parent.add(m); return m;
}
export function group(parent, x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }
/* a flat shape on the ground from a 2D outline [[x, z], ...], at height y */
export function flat(parent, pts, material, y = 0.01, o = {}) {
  const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = o.depth ? new THREE.ExtrudeGeometry(s, { depth: o.depth, bevelEnabled: !!o.bevel, bevelSize: o.bevel || 0, bevelThickness: o.bevel || 0, bevelSegments: 2 }) : new THREE.ShapeGeometry(s, 12);
  const m = new THREE.Mesh(g, material); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; m.castShadow = !!o.depth;
  parent.add(m); return m;
}
/* a smooth closed outline: a rounded blob through the points (for coasts, lakes, fields) */
export function blob(pts, n = 120) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  return c.getPoints(n).map(p => [p.x, p.z]);
}
/* a ribbon along a path [[x, z], ...] at height y (roads, rails, cables) */
export function ribbon(parent, path, width, material, y = 0.02, closed = false) {
  const c = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, y, z)), closed, 'centripetal');
  const pts = c.getSpacedPoints(Math.max(16, path.length * 24)), pos = [], idx = [];
  pts.forEach((p, i) => {
    const t = c.getTangentAt(Math.min(1, i / (pts.length - 1))), n = new THREE.Vector3(-t.z, 0, t.x).normalize().multiplyScalar(width / 2);
    pos.push(p.x + n.x, y, p.z + n.z, p.x - n.x, y, p.z - n.z);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); m.receiveShadow = true; m.material.side = THREE.DoubleSide; parent.add(m);
  return { mesh: m, curve: c };
}

/* ---- labels: HTML over the canvas, at a 3D point; hidden when behind the camera or off screen ---- */
export function labels(host) {
  const list = [];
  const v = new THREE.Vector3();
  return {
    add(obj, offset, text, o = {}) {
      const el = document.createElement(o.button ? 'button' : 'span');
      el.className = 'lbl3 ' + (o.cls || ''); if (o.html != null) el.innerHTML = o.html; else el.textContent = text; if (o.button) el.type = 'button';
      if (o.data) Object.entries(o.data).forEach(([k, val]) => { el.dataset[k] = val; });
      host.appendChild(el);
      const L = { obj, offset: offset || new THREE.Vector3(), el, min: o.min || 0, max: o.max || Infinity, show: true, need: o.need || null };
      list.push(L); return L;
    },
    update(camera, w, h) {
      for (const L of list) {
        L.obj.updateWorldMatrix(true, false);
        v.copy(L.offset).applyMatrix4(L.obj.matrixWorld);
        const dist = v.distanceTo(camera.position);
        v.project(camera);
        const on = L.show && (!L.need || L.need.visible) && v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 && dist >= L.min && dist <= L.max;
        L.el.style.opacity = on ? '' : '0'; L.el.style.pointerEvents = on ? '' : 'none';
        if (on) L.el.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px) translate(-50%,-100%)';
      }
    },
    clear() { list.splice(0).forEach(L => L.el.remove()); },
    list
  };
}

/* easing and blends */
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/* a seeded random number in [0, 1) */
export const rnd = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
