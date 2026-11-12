/* Inside a chip, layer by layer: the dive and the factory line as one picture. A cut through a chip shows its
   layers stacked as they are, the package on top, then the wires, the gates, the switches, and the silicon at the
   bottom. Read from the top down it is the dive (what each depth is); read from the bottom up it is the line (how
   each was made, in the order the factory makes them). One position z (0 = the top row, 4 = the bottom row) and
   one mode: diving, the rows above you lift away; building, the rows above you are not made yet, and the row at
   z is the factory step at work. Words: chipx.* and the depths' own (src/i18n/en.json). */
import { THREE, PALETTES, theme, stage, light, group, labels, clamp, smooth, reduced, rnd } from './kit3d.js';
import { t } from '../core/i18n.js';

/* each row: the depth you dive to, and the factory steps that make it (src/data/weave.js MADE) */
export const ROWS = [
  { dive: 'chip', made: ['pkg'] },
  { dive: 'block', made: ['wires'] },
  { dive: 'gate', made: ['print'] },
  { dive: 'switch', made: ['etch'] },
  { dive: 'atom', made: ['crystal', 'implant'] }
];
/* the question at each row, one for diving and one for building (stops: stop.<key>.q) */
export const ASK = { dive: ['think.chip', 'divide.block', 'think.gate', 'scale.switch', 'limit.atom'], build: ['make.pkg', 'make.wires', 'scale.print', 'make.etch', 'make.implant'] };
const CENTER = [8.4, 5.4, 3.0, 2.6, 1.1];   /* the height of each row's middle */

export function createChip(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const { renderer, env } = stage(canvas);
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
  const wellN = M(4, P.warm, { emissive: P.warm, emissiveIntensity: night ? 0.35 : 0.1 }), wellP = M(4, P.accent, { emissive: P.accent, emissiveIntensity: night ? 0.35 : 0.1 });
  for (let i = 0; i < 4; i++) B(4, 2.2, 0.08, S - 1, i % 2 ? wellP : wellN, -4.5 + i * 3, 2.2, 0);
  /* 3: the switches: thin fins of silicon standing on the wells, etched out of the crystal */
  const fin = M(3, night ? 0x9fb0c8 : 0xb7c2d2, { roughness: 0.3, metalness: 0.35 });
  for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) B(3, 0.28, 0.9, S - 1.6, fin, -5 + i * 3 + k * 1, 2.28, 0);
  /* 2: the gates: printed lines crossing the fins; where a gate crosses a fin there is a switch. Contacts above */
  const gate = M(2, P.accent, { roughness: 0.35, metalness: 0.6 }), contact = M(2, 0xc9a14a, { roughness: 0.3, metalness: 0.9 });
  for (let j = 0; j < 5; j++) B(2, S - 0.6, 1.1, 0.42, gate, 0, 2.28, -4.4 + j * 2.2);
  for (let i = 0; i < 8; i++) B(2, 0.3, 0.6, 0.3, contact, -5 + (i % 4) * 3 + 0.5, 3.38, -3.3 + Math.floor(i / 4) * 4.4 + (i % 2) * 2.2);
  /* 1: the wires: layers of copper, each running across the one below, joined by vias; wider as they go up */
  const cu = M(1, 0xc77b45, { roughness: 0.3, metalness: 0.85 }), via = M(1, 0xe0b070, { roughness: 0.3, metalness: 0.9 }), ild = M(1, night ? 0x6d8db8 : 0xa9c2e0, { opacity: 0.12, depthWrite: false });
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

  /* names on the parts (HTML over points); shown while their row is in view */
  const named = [
    [0, [5.5, 8.95, 5.5], 'lid'], [0, [-4.5, 7.75, 6.2], 'bumps'], [1, [5.6, 6.6, 3], 'wires'], [1, [-3.2, 4.4, -4], 'vias'],
    [2, [5.8, 3.4, 0.0], 'gates'], [2, [-4.5, 3.98, -3.3], 'contacts'], [3, [-5, 3.2, 5], 'fins'], [4, [-4.5, 2.3, 5.6], 'wells'], [4, [5.8, 1.1, 5.8], 'silicon']
  ].map(([r, p, id]) => { const lb = L.add(rows[r].g, new THREE.Vector3(...p), t('chipx.part.' + id), { cls: 'part3' }); lb.row = r; return lb; });

  /* ---- the position and the mode, and what each row does at them ---- */
  let z = 0, goal = 0, mode = 'dive', W = 1, Hh = 1, running = true, raf = 0, last = performance.now(), work = 0;
  const states = () => {
    rows.forEach((R, r) => {
      let lift = 0, op = 1;
      if (mode === 'dive') { const k = smooth(r + 0.15, r + 0.9, z); lift = k * (4 + (4 - r) * 0.6); op = 1 - 0.88 * k; }
      else { const k = smooth(r + 0.1, r + 0.9, z); lift = k * 3.5; op = 1 - k; }   /* not made yet: it comes down into place as its step runs */
      R.g.position.y = lift; R.g.visible = op > 0.02;
      R.mats.forEach(m => { if (m.userData.base == null) m.userData.base = m.opacity; m.opacity = m.userData.base * op; m.depthWrite = op > 0.9 && m.userData.base > 0.5; });
    });
    /* building: the row at work glows a little while its step runs */
    const r = Math.round(z); rows.forEach((R, i) => R.mats.forEach(m => { if (m.emissive && m.userData.e == null) m.userData.e = m.emissiveIntensity; if (m.emissive) m.emissiveIntensity = (m.userData.e || 0) + (mode === 'build' && i === r ? 0.25 * work : 0); }));
    named.forEach(lb => { lb.show = Math.abs(lb.row - z) < 0.6; });
  };
  const pose = () => {
    const i = Math.floor(clamp(z, 0, 3.999)), f = z - i, cy = CENTER[i] + (CENTER[i + 1] - CENTER[i]) * f, d = 30 - z * 2.4, yaw = -0.62, pitch = 0.5 - z * 0.03;
    /* a narrow screen stands back, and keeps the chip in the top part, above the panel */
    const narrow = camera.aspect < 0.8, D = narrow ? d * 2.6 : d, ty = narrow ? cy - D * 0.12 : cy;
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * D, ty + Math.sin(pitch) * D, Math.cos(yaw) * Math.cos(pitch) * D);
    camera.lookAt(0, ty, 0);
  };

  /* ---- input: scroll or drag up and down the stack; keys step a row ---- */
  const go = v => { goal = clamp(v, 0, ROWS.length - 1); };
  let drag = null;
  canvas.addEventListener('wheel', e => { e.preventDefault(); go(goal + e.deltaY * 0.0016); }, { passive: false });
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); drag = { y: e.clientY, g: goal }; });
  canvas.addEventListener('pointermove', e => { if (drag) go(drag.g + (drag.y - e.clientY) * 0.008); });
  const end = () => { drag = null; }; canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'PageDown') { go(Math.floor(goal + 1)); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { go(Math.ceil(goal - 1)); e.preventDefault(); } });

  const resize = () => { const r = canvas.getBoundingClientRect(); W = r.width; Hh = r.height; renderer.setSize(W, Hh, false); camera.aspect = W / Math.max(1, Hh); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  let settle = 0, lastRow = -1;
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag && Math.abs(goal - z) < 0.002) { settle += dt; if (settle > 0.6 && Math.abs(goal - Math.round(goal)) > 0.001) goal = Math.round(goal); } else settle = 0;
    z += (goal - z) * (reduced() ? 1 : Math.min(1, dt * 4));
    work = reduced() ? 0 : Math.max(0, work - dt * 0.6);
    pose(); states();
    sun.position.set(-14, 30, 18); sun.target.position.set(0, 3, 0);
    const row = Math.round(z); if (row !== lastRow) { lastRow = row; if (mode === 'build') work = 1; on.row && on.row(row); }
    on.depth && on.depth(z);
    renderer.render(scene, camera);
    L.update(camera, W, Hh);
  };
  raf = requestAnimationFrame(frame);
  return {
    go(v) { go(v); },
    set(v) { goal = z = clamp(v, 0, ROWS.length - 1); },
    mode(m) { if (m) { mode = m; if (m === 'build') work = 1; } return mode; },
    get z() { return z; },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  };
}
