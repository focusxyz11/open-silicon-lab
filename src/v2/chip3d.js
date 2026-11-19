/* Inside a chip, layer by layer: the levels of the dive as they are made (the lower half of the Make column,
   docs/reviews/structure.md). A cut through a chip shows its layers stacked as they are, the package on top, then
   the wires, the gates, the switches, and the silicon at the bottom. The dive is the only way down through a chip;
   along from one of its levels turns to the same row here, as made. One position z (0 = the top row, 4 = the
   bottom row): the rows above you are not made yet, and the row at z is the factory step at work; going up a row,
   it comes down into place as its step runs, so the stack is built bottom up. Words: chipx.* and the depths' own
   (src/i18n/en.json). */
import { THREE, PALETTES, theme, stage, light, group, labels, clamp, smooth, reduced, rnd } from './kit3d.js';
import { t } from '../core/i18n.js';
import { VIEW_PARTS } from '../data/atlas.js';

/* each row: the depth you dive to, and the factory steps that make it (src/data/weave.js MADE) */
export const ROWS = [
  { dive: 'chip', made: ['pkg'] },
  { dive: 'block', made: ['wires'] },
  { dive: 'gate', made: ['print'] },
  { dive: 'switch', made: ['etch'] },
  { dive: 'atom', made: ['crystal', 'implant'] }
];
/* the question at each row, about how it is made (stops: stop.<key>.q); the dive asks its own */
export const ASK = ['make.pkg', 'make.wires', 'scale.print', 'make.etch', 'make.implant'];
/* each row's top and half width: at a row the picture is framed on it and everything under it */
const TOP = [8.95, 7.25, 3.98, 3.2, 2.3], HALF = [7, 6, 6, 6, 6];
/* the way in at each row: a point on the next row, where it shows under this one (in that row's own space) */
const INTO = [[-2, 5.4, 6], [-2, 2.9, 4.62], [-2.15, 2.7, 5.2], [-2, 1.1, 6]];

export function createChip(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const st = stage(canvas), { env } = st;
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = night ? 0.35 : 0.7;
  scene.background = new THREE.Color(night ? 0x0b1120 : 0xdfe8f2);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  const { sun } = light(scene, P, 40);
  const L = labels(host);

  /* every row has its own materials, so a row can fade on its own */
  const rows = ROWS.map(() => ({ g: group(scene), mats: [] }));
  const M = (r, color, o = {}) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.5, metalness: 0.1, transparent: true }, o)); rows[r].mats.push(m); return m; };
  const B = (r, w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.castShadow = b.receiveShadow = true; rows[r].g.add(b); return b; };
  const S = 12, H = S / 2;

  /* 4: the silicon: one crystal, with regions doped by implanting (the wells under the switches) */
  const si = M(4, night ? 0x46536b : 0x8d99ab, { roughness: 0.35, metalness: 0.3 });
  B(4, S, 2.2, S, si, 0, 0, 0);
  /* doped silicon, the art direction's way: silicon mixed 35% towards warm for one kind, towards the accent for the
     other, pale, so it never reads as live (the same as the switch level's source and drain) */
  /* (the accent kind at a quarter, so it never reads as a gate, the accent's own material: the review's colour risk) */
  const SI = night ? 0x46536b : 0x8d99ab, dope = c => new THREE.Color(SI).lerp(new THREE.Color(c), c === P.accent ? 0.22 : 0.35).getHex();
  const wellN = M(4, dope(P.warm), { roughness: 0.35, metalness: 0.3 }), wellP = M(4, dope(P.accent), { roughness: 0.35, metalness: 0.3 });
  for (let i = 0; i < 4; i++) B(4, 2.2, 0.08, S - 1, i % 2 ? wellP : wellN, -4.5 + i * 3, 2.2, 0);
  /* 3: the switches: stacks of thin sheets of silicon above the wells, the same sheets as the switch level (older chips
     stood them up as fins). Each stack is three sheets with gaps between, where the gate will wrap round them; between
     the gates, source and drain grow on the sheets' ends, doped like the well below */
  const sheet = M(3, night ? 0x7f93b3 : 0xa7b3c4, { roughness: 0.32, metalness: 0.35 });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) for (let s = 0; s < 3; s++) B(3, 0.7, 0.13, S - 1.6, sheet, -5.15 + i * 3 + k * 1.3, 2.34 + s * 0.3, 0);
  const sdN = M(3, dope(P.warm), { roughness: 0.35, metalness: 0.3 }), sdP = M(3, dope(P.accent), { roughness: 0.35, metalness: 0.3 });
  [sdN, sdP].forEach((m, kind) => {
    const spots = []; for (let i = kind; i < 4; i += 2) for (let k = 0; k < 2; k++) for (let j = 0; j < 4; j++) spots.push([-5.15 + i * 3 + k * 1.3, -4.4 + j * 2.2 + 1.1]);
    const sd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.84, 0.86, 1.5), m, spots.length), o = new THREE.Object3D();
    spots.forEach(([x, zz], n) => { o.position.set(x, 2.3 + 0.43, zz); o.updateMatrix(); sd.setMatrixAt(n, o.matrix); });
    sd.castShadow = sd.receiveShadow = true; rows[3].g.add(sd);
  });
  /* 2: the gates: printed lines crossing the sheets and wrapping round them; where a gate crosses a stack there is a
     switch. Contacts above */
  const gate = M(2, P.accent, { roughness: 0.35, metalness: 0.6 }), contact = M(2, night ? 0xc9a14a : 0xe0b070, { roughness: 0.3, metalness: 0.9 });
  /* each gate in its skin of insulator, which shows as a thin glass edge where the gate meets the sheets */
  const skin = M(2, night ? 0x5aa9e6 : 0x9fc4dc, { roughness: 0.08, metalness: 0.1, opacity: 0.5, depthWrite: false });
  for (let j = 0; j < 5; j++) { B(2, S - 0.6, 1.1, 0.42, gate, 0, 2.28, -4.4 + j * 2.2); B(2, S - 0.7, 1.0, 0.56, skin, 0, 2.3, -4.4 + j * 2.2); }
  for (let i = 0; i < 8; i++) B(2, 0.3, 0.6, 0.3, contact, -5 + (i % 4) * 3 + 0.5, 3.38, -3.3 + Math.floor(i / 4) * 4.4 + (i % 2) * 2.2);
  /* 1: the wires: layers of copper, each running across the one below, joined by vias; wider as they go up */
  const cu = M(1, night ? 0xc77b45 : 0xb5683a, { roughness: 0.3, metalness: 0.85 }), via = M(1, night ? 0xc9a14a : 0xe0b070, { roughness: 0.3, metalness: 0.9 }), ild = M(1, night ? 0x5aa9e6 : 0x9fc4dc, { opacity: 0.12, depthWrite: false });
  for (let l = 0; l < 4; l++) {
    const y = 4.0 + l * 0.8, n = [10, 8, 6, 4][l], w = [0.25, 0.35, 0.5, 0.8][l];
    for (let i = 0; i < n; i++) { const u = -H + 0.8 + i * (S - 1.6) / (n - 1); if (l % 2) B(1, S - 0.6, 0.32, w, cu, 0, y, u); else B(1, w, 0.32, S - 0.6, cu, u, y, 0); }
    for (let i = 0; i < 6; i++) B(1, 0.22, 0.48, 0.22, via, -4 + rnd(i, l + 3) * 8, y - 0.48, -4 + rnd(i, l + 7) * 8);
  }
  B(1, S, 3.3, S, ild, 0, 3.95, 0);
  /* 0: the package: bumps of solder on the top wires, the package's own board, and the lid */
  const bump = M(0, 0xd8dde6, { roughness: 0.25, metalness: 0.9 }), sub = M(0, night ? 0x2f5a46 : 0x3f7a5c, { roughness: 0.6 }), lid = M(0, 0xb8c0cc, { roughness: 0.25, metalness: 0.85 });
  const ball = new THREE.SphereGeometry(0.32, 16, 10);
  for (let i = 0; i < 6; i++) for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(ball, bump); b.position.set(-4.5 + i * 1.8, 7.45, -4.5 + k * 1.8); b.castShadow = true; rows[0].g.add(b); }
  B(0, S + 2, 0.7, S + 2, sub, 0, 7.75, 0); B(0, S + 1, 0.5, S + 1, lid, 0, 8.45, 0);

  /* names on the parts (HTML over points), from their one home in the atlas; shown while their row is in view */
  const named = [
    [0, [5.5, 8.95, 5.5], 'lid'], [0, [-4.5, 7.75, 6.2], 'bumps'], [1, [5.6, 6.6, 3], 'wires'],
    [2, [5.8, 3.4, 0.0], 'gates'], [2, [-4.5, 3.98, -3.3], 'contacts'], [3, [-5, 3.2, 5], 'sheets'], [4, [-4.5, 2.3, 5.6], 'wells'], [4, [5.8, 1.1, 5.8], 'silicon']
  ].map(([r, p, id]) => { const lb = L.add(rows[r].g, new THREE.Vector3(...p), t('part.' + VIEW_PARTS.chip[id]), { cls: 'part3' }); lb.row = r; return lb; });

  /* ---- the position, and what each row does at it ---- */
  let z = 0, goal = 0, W = 1, Hh = 1, running = true, raf = 0, last = performance.now(), work = 0;
  const states = () => {
    rows.forEach((R, r) => {
      /* not made yet: it comes down into place as its step runs */
      const k = smooth(r + 0.1, r + 0.9, z), lift = k * 3.5, op = 1 - k;
      R.g.position.y = lift; R.g.visible = op > 0.02;
      R.mats.forEach(m => { if (m.userData.base == null) m.userData.base = m.opacity; m.opacity = m.userData.base * op; m.depthWrite = op > 0.9 && m.userData.base > 0.5; });
    });
    /* the row at work glows a little while its step runs */
    const r = Math.round(z); rows.forEach((R, i) => R.mats.forEach(m => { if (m.emissive && m.userData.e == null) m.userData.e = m.emissiveIntensity; if (m.emissive) m.emissiveIntensity = (m.userData.e || 0) + (i === r ? 0.25 * work : 0); }));
    named.forEach(lb => { lb.show = Math.abs(lb.row - z) < 0.6; });
  };
  /* framed in the part of the picture the frame leaves free (on.inset: pixels from each edge): the row in view and
     what is under it fit there, with room round them for the names, as near as they can be */
  const corner = new THREE.Vector3(), box = [];
  const aimAt = (D, ty, yaw, pitch) => {
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, Math.cos(yaw) * Math.cos(pitch) * D);
    camera.lookAt(0, ty, 0); camera.updateMatrixWorld();
  };
  const pose = () => {
    const i = Math.floor(clamp(z, 0, 3.999)), f = clamp(z - i, 0, 1), top = TOP[i] + (TOP[i + 1] - TOP[i]) * f, hw = HALF[i] + (HALF[i + 1] - HALF[i]) * f;
    const yaw = -0.62, pitch = 0.5 - z * 0.03, ty = top / 2;
    const n = on.inset ? on.inset() : { l: 0, r: 0, t: 0, b: 0 }, l = n.l, r = Math.max(l + 80, W - n.r), t0 = n.t, b = Math.max(t0 + 80, Hh - n.b);
    camera.setViewOffset(W, Hh, W / 2 - (l + r) / 2, Hh / 2 - (t0 + b) / 2, W, Hh); camera.updateProjectionMatrix();
    /* a name stands above its point and half its width to each side: keep that much room inside the edges */
    const mx = Math.min(56, (r - l) * 0.12), L = l + mx, R = r - mx, T = t0 + 30, Bm = b - 6;
    box.length = 0; for (const x of [-hw, hw]) for (const y of [0, top]) for (const zz of [-hw, hw]) box.push([x, y, zz]);
    const fits = D => { aimAt(D, ty, yaw, pitch); return box.every(([x, y, zz]) => { corner.set(x, y, zz).project(camera); const px = (corner.x + 1) / 2 * W, py = (1 - corner.y) / 2 * Hh; return px >= L && px <= R && py >= T && py <= Bm; }); };
    let lo = 4, hi = 400; for (let k = 0; k < 16; k++) { const mid = Math.sqrt(lo * hi); if (fits(mid)) hi = mid; else lo = mid; }
    aimAt(hi, ty, yaw, pitch);
  };
  /* the way in (a level deeper, as made): beside the next row, at rest */
  const pv = new THREE.Vector3();
  const portal = () => {
    const r = Math.round(z); if (!on.portal) return;
    if (drag || Math.abs(z - r) > 0.02 || Math.abs(goal - z) > 0.02 || !INTO[r]) return on.portal(null);
    rows[r + 1].g.updateWorldMatrix(true, false); pv.set(...INTO[r]).applyMatrix4(rows[r + 1].g.matrixWorld).project(camera);
    on.portal(pv.z < 1 ? { x: (pv.x + 1) / 2, y: (1 - pv.y) / 2 } : null);
  };

  /* ---- input: scroll or drag up and down the stack; keys step a row ---- */
  const go = v => { goal = clamp(v, 0, ROWS.length - 1); };
  let drag = null;
  canvas.addEventListener('wheel', e => { e.preventDefault(); go(goal + e.deltaY * 0.0016); }, { passive: false });
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); drag = { y: e.clientY, g: goal }; });
  canvas.addEventListener('pointermove', e => { if (drag) go(drag.g + (drag.y - e.clientY) * 0.008); });
  const end = () => { drag = null; }; canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'PageDown') { go(Math.floor(goal + 1)); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { go(Math.ceil(goal - 1)); e.preventDefault(); } });

  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; Hh = r.height; st.size(W, Hh); camera.aspect = W / Math.max(1, Hh); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  let settle = 0, lastRow = -1;
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000); last = now;
    if (!drag && Math.abs(goal - z) < 0.002) { settle += dt; if (settle > 0.6 && Math.abs(goal - Math.round(goal)) > 0.001) goal = Math.round(goal); } else settle = 0;
    z += (goal - z) * (reduced() ? 1 : Math.min(1, dt * 4));
    work = reduced() ? 0 : Math.max(0, work - dt * 0.6);
    pose(); states();
    sun.position.set(-14, 30, 18); sun.target.position.set(0, 3, 0);
    const row = Math.round(z); if (row !== lastRow) { lastRow = row; work = 1; on.row && on.row(row); }
    on.depth && on.depth(z);
    st.draw(scene, camera);
    L.update(camera, W, Hh); portal();
  };
  raf = requestAnimationFrame(frame);
  return {
    go(v) { go(v); },
    set(v) { goal = z = clamp(v, 0, ROWS.length - 1); },
    get z() { return z; },
    pause() { running = false; cancelAnimationFrame(raf); },
    warm: () => st.warm(scene, camera),
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  };
}
