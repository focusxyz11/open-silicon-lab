/* One board, as a place to look at closely: the accelerator chip at its centre, the memory stacks beside the
   die, the power stages that feed it, the links to other boards. No side panel: the parts carry their own names
   and figures, a story docked below moves the camera, and the scene answers what you do. The numbers stream
   between memory and the die as light; the die's cores light up as much as they are busy (src/engines/chip.js).
   Units: centimetres. Words: board.* (src/i18n/en.json). */
import { THREE, PALETTES, theme, stage, light, group, labels, clamp, smooth, reduced, rnd } from './kit3d.js';

/* the camera for each view of the story: where it looks, how far, the turn and the tilt */
export const VIEWS = {
  board: { look: [0, 0, 0], dist: 58, yaw: -0.55, pitch: 0.78 },
  die: { look: [0, 0.8, 0], dist: 21, yaw: -0.35, pitch: 1.05 },
  hbm: { look: [1.6, 0.8, 0], dist: 22, yaw: -0.85, pitch: 0.8 },
  flow: { look: [0, 0.8, 0], dist: 24, yaw: -0.5, pitch: 0.95 },
  vrm: { look: [-9.5, 0.6, 0], dist: 22, yaw: -1.0, pitch: 0.7 },
  links: { look: [0, 0.6, -12], dist: 26, yaw: 0.2, pitch: 0.7 }
};

export function createBoard(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const { renderer, env } = stage(canvas);
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = night ? 0.4 : 0.75;
  scene.background = new THREE.Color(night ? 0x090f1c : 0xe2eaf3);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 600);
  const { sun } = light(scene, P, 80);
  const L = labels(host);
  const parts = {};   /* id -> { meshes, mats } for picking and lighting */
  const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.5, metalness: 0.1 }, o));
  const B = (part, parent, w, h, d, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.castShadow = b.receiveShadow = true; parent.add(b);
    if (part) { (parts[part] = parts[part] || { meshes: [], mats: new Set() }).meshes.push(b); parts[part].mats.add(m); b.userData.part = part; }
    return b;
  };

  /* the board and its copper */
  const board = group(scene);
  B('board', board, 40, 0.2, 28, M(night ? 0x16352d : 0x2b5e4c, { roughness: 0.7 }), 0, -0.2, 0);
  const cu = M(0xb88a4a, { roughness: 0.35, metalness: 0.8 });
  for (let i = 0; i < 26; i++) { const z = -12 + i * 0.95, w = 6 + rnd(i, 3) * 8; B(null, board, w, 0.02, 0.12, cu, (i % 2 ? 1 : -1) * (6 + w / 2), 0, z); }
  /* the power stages: a row of regulators and their coils, feeding the chip from one side */
  const vrmM = M(0x1d2129, { roughness: 0.4 }), coil = M(0x7c8594, { roughness: 0.3, metalness: 0.7 });
  for (let i = 0; i < 10; i++) { B('vrm', board, 1.2, 0.5, 1.2, vrmM, -11.5, 0, -6.3 + i * 1.4); B('vrm', board, 1.5, 1.1, 1.3, coil, -9.4, 0, -6.3 + i * 1.4); }
  /* the links: connectors on the far edge, to other boards and the network */
  const conn = M(0x2a2f38, { roughness: 0.5 }), pin = M(0xd8b25a, { metalness: 0.9, roughness: 0.3 });
  for (let i = 0; i < 4; i++) { B('links', board, 5, 1.6, 2, conn, -9 + i * 6, 0, -12.6); B('links', board, 4.4, 0.12, 0.3, pin, -9 + i * 6, 1.6, -11.8); }
  /* the package: a substrate, the interposer, the die with its cores, four memory stacks, and a lid */
  const pkg = group(scene);
  B('chip', pkg, 10, 0.4, 10, M(0x2f3d35, { roughness: 0.6 }), 0, 0, 0);
  B('chip', pkg, 8, 0.15, 6.4, M(0x4b5566, { roughness: 0.4, metalness: 0.4 }), 0, 0.4, 0);
  const dieM = M(night ? 0x1d2433 : 0x2a3142, { roughness: 0.3, metalness: 0.5 });
  B('die', pkg, 3.6, 0.15, 4.4, dieM, 0, 0.55, 0);
  const cores = [];
  for (let i = 0; i < 6; i++) for (let k = 0; k < 8; k++) { const m = M(night ? 0x26324a : 0x3a4560, { emissive: P.accent, emissiveIntensity: 0, roughness: 0.4 }); const c = B('die', pkg, 0.42, 0.05, 0.42, m, -1.3 + i * 0.52, 0.7, -1.82 + k * 0.52); cores.push({ c, m, k: rnd(i * 8 + k, 5) }); }
  const hbmM = M(0x3a4458, { roughness: 0.35, metalness: 0.5 }), hbmTop = M(0x8a96aa, { roughness: 0.3, metalness: 0.7 });
  const stacks = [[-2.9, -1.4], [-2.9, 1.4], [2.9, -1.4], [2.9, 1.4]];
  stacks.forEach(([x, z]) => { for (let l = 0; l < 6; l++) B('hbm', pkg, 1.3, 0.11, 2.2, l === 5 ? hbmTop : hbmM, x, 0.55 + l * 0.12, z); });
  const lidM = M(0xb9c1cc, { roughness: 0.25, metalness: 0.85, transparent: true });
  const lid = B('chip', pkg, 9.4, 0.6, 9.4, lidM, 0, 0.45, 0);

  /* the numbers on their way: light running from the memory stacks into the die */
  const dotG = new THREE.SphereGeometry(0.055, 8, 6), dotM = M(P.warm, { emissive: P.warm, emissiveIntensity: night ? 1.6 : 0.9 });
  const dots = Array.from({ length: 90 }, (_, i) => { const d = new THREE.Mesh(dotG, dotM); d.visible = false; pkg.add(d); return { d, u: rnd(i, 9), s: stacks[i % 4], j: rnd(i, 4) - 0.5 }; });

  /* names on the parts; figures on the parts (set by the story) */
  const NAMES = { chip: [0, 1.4, 4.9], die: [0, 0.9, -2.2], hbm: [2.9, 1.4, 2.6], vrm: [-10.4, 1.3, 7.2], links: [3, 1.8, -12.6] };
  const names = Object.fromEntries(Object.entries(NAMES).map(([id, p]) => [id, L.add(scene, new THREE.Vector3(...p), '', { cls: 'part3 pick', button: true, data: { part: id } })]));
  const figs = { die: L.add(scene, new THREE.Vector3(0, 0.9, 0.6), '', { cls: 'fig3' }), hbm: L.add(scene, new THREE.Vector3(-2.9, 1.4, -2.6), '', { cls: 'fig3 warm' }) };

  /* ---- state the story sets ---- */
  let view = VIEWS.board, open = 0, openGoal = 0, busy = 1, flow = 0, lit = null, hover = null;
  const cam = { look: new THREE.Vector3(...view.look), dist: view.dist, yaw: view.yaw, pitch: view.pitch }, goal = { ...cam, look: cam.look.clone() };
  let orbit = 0, drag = null;
  const pose = () => {
    const y = cam.yaw + orbit, p = cam.pitch;
    camera.position.set(cam.look.x + Math.sin(y) * Math.cos(p) * cam.dist, cam.look.y + Math.sin(p) * cam.dist, cam.look.z + Math.cos(y) * Math.cos(p) * cam.dist);
    camera.lookAt(cam.look);
  };
  /* the part in focus glows; the rest steps back a little */
  const glow = () => {
    for (const [id, pt] of Object.entries(parts)) {
      const on = id === lit || id === hover || (lit === 'chip' && (id === 'die' || id === 'hbm'));
      pt.mats.forEach(m => { if (m === dotM || cores.some(c => c.m === m)) return; m.emissive.set(on ? P.accent : 0x000000); m.emissiveIntensity = on ? (id === hover && id !== lit ? 0.06 : 0.12) : 0; });
    }
    Object.entries(names).forEach(([id, n]) => n.el.classList.toggle('on', id === lit));
  };

  /* ---- picking: tap a part to bring it into the story; drag to turn the board a little ---- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pick = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(Object.values(parts).flatMap(p => p.meshes), false).find(h => h.object.visible && !(h.object === lid && open > 0.5)); return hit ? hit.object.userData.part : null; };
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, o: orbit, moved: false }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (drag) { const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; orbit = clamp(drag.o + dx * 0.004, -0.7, 0.7); return; }
    const h = pick(e); if (h !== hover) { hover = h === 'board' ? null : h; canvas.style.cursor = hover ? 'pointer' : 'grab'; glow(); }
  });
  canvas.addEventListener('pointerup', e => { const d = drag; drag = null; if (d && !d.moved) { const h = pick(e); if (h && h !== 'board') on.part && on.part(h); } });
  canvas.addEventListener('dblclick', e => { if (pick(e) === 'die' || pick(e) === 'chip') on.dive && on.dive(); });
  host.addEventListener('click', e => { const b = e.target.closest('[data-part]'); if (b) on.part && on.part(b.dataset.part); });

  const resize = () => { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; renderer.setSize(W, H, false); camera.aspect = W / Math.max(1, H);
    /* the story docks below: lift the picture so its middle sits in the open part of the screen */
    camera.setViewOffset(W, H, 0, H * 0.13, W, H); camera.updateProjectionMatrix(); };
  let W = 1, H = 1, running = true, raf = 0, last = performance.now();
  new ResizeObserver(resize).observe(canvas); resize();
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000), tm = now / 1000, k = reduced() ? 1 : Math.min(1, dt * 2.6); last = now;
    cam.look.lerp(goal.look, k); cam.dist += (goal.dist - cam.dist) * k; cam.yaw += (goal.yaw - cam.yaw) * k; cam.pitch += (goal.pitch - cam.pitch) * k;
    if (!drag) orbit *= 1 - Math.min(1, dt * 0.6);
    /* narrow screens stand back, so the board sits above the story */
    const narrow = camera.aspect < 0.8; if (narrow) { cam.dist = Math.max(cam.dist, goal.dist * 1.7); }
    pose();
    open += (openGoal - open) * k; lid.position.y = 0.45 + 0.3 + smooth(0, 1, open) * 6; lidM.opacity = 1 - 0.85 * open; lid.visible = lidM.opacity > 0.05; lidM.depthWrite = open < 0.5;
    /* the cores: as many lit as are busy, flickering as work arrives */
    cores.forEach(({ m, k: s }) => { const on = s < busy, f = reduced() ? 0 : Math.sin(tm * 9 + s * 40) * 0.25; m.emissiveIntensity += ((on ? 1.6 + f : 0) - m.emissiveIntensity) * (reduced() ? 1 : Math.min(1, dt * 8)); });
    /* the stream: as many lights as numbers are moving */
    dots.forEach((o, i) => { const show = i < flow * dots.length && open > 0.4; o.d.visible = show; if (!show) return; o.u = (o.u + dt * (reduced() ? 0 : 0.7)) % 1; const [x, z] = o.s, t2 = o.u;
      o.d.position.set(x + (0 - x) * t2 * 0.62, 0.9 + Math.sin(t2 * Math.PI) * 0.45, z * (1 - t2 * 0.6) + o.j * 1.2); });
    sun.position.set(-30, 50, 26); sun.target.position.set(0, 0, 0);
    renderer.render(scene, camera); L.update(camera, W, H);
  };
  raf = requestAnimationFrame(frame);
  return {
    /* what the story asks of the scene */
    set(o) {
      if (o.view) { const v = VIEWS[o.view]; goal.look = new THREE.Vector3(...v.look); goal.dist = v.dist; goal.yaw = v.yaw; goal.pitch = v.pitch; }
      if (o.open != null) openGoal = o.open;
      if (o.busy != null) busy = o.busy;
      if (o.flow != null) flow = o.flow;
      if ('lit' in o) { lit = o.lit; glow(); }
      if (o.names) Object.entries(o.names).forEach(([id, s]) => { names[id].el.textContent = s; });
      if (o.figs) Object.entries(figs).forEach(([id, f]) => { const s = o.figs[id]; f.show = !!s; if (s) f.el.textContent = s; });
    },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  };
}
