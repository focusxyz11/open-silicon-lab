/* The switch in 3D: the first level of the zoom drawn on the one stage (docs/reviews/art-direction.md, "Switch: 3D").
   One transistor, cut open at the front: current runs from the source to the drain through three thin sheets of
   silicon, the gate wraps all the way round each sheet with a skin of insulator between, and the gate touches nothing
   it controls. That cannot be seen in a cross-section, so here 3D is the explanation, not a style.

   It lives inside the flat dive (src/app/world.js): as the zoom reaches the switch, the flat picture fades and this
   one takes its place on the same square, at the same size, so the zoom stays one movement. The flat drawing stays as
   the fallback. Materials and light are the shared ones (kit3d.js; the art direction's table): silicon blue-grey,
   doped silicon warmer, the gate in the accent, insulator as glass, contacts in contact metal, electrons glowing.
   Words are never drawn into the scene: the names are HTML over projected points, as everywhere.

   createSwitch(canvas, host, on) -> { show(k, depthOffset, frame), select(key, note), hit(x, y), active(), dispose() }
   on.part(key): a name or a part was tapped. on.marks() -> [{ part, threads: [{ id, color }] }] under Ask, else null:
   the questions' marks, drawn by the flat dive's overlay (overlay.js) so they look and behave the same;
   on.mark(threadId) and on.askMany([threadId]) when one is tapped. */
import * as THREE from '../vendor/three.min.js';
import { PALETTES, theme, stage, light, mat, glass, labels, showStage, clamp } from './kit3d.js';
import { t } from '../core/i18n.js';
import { createOverlay } from './overlay.js';

const PARTS = ['gate', 'channel', 'oxide', 'source', 'drain'];
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createSwitch(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const st = stage(canvas);
  const scene = new THREE.Scene(); scene.environment = st.env; scene.environmentIntensity = night ? 0.35 : 0.7;
  scene.background = new THREE.Color(night ? 0x0b1120 : 0xdfe8f2);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  light(scene, P, 16);
  const root = new THREE.Group(); scene.add(root);
  const L = labels(host);

  /* the materials of the art direction's table */
  const SI = night ? 0x46536b : 0x8d99ab;
  const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
  const si = mat(SI, { roughness: 0.35, metalness: 0.3 });
  const sheetM = mat(night ? 0x7f93b3 : 0xa7b3c4, { roughness: 0.32, metalness: 0.35 });
  const doped = mat(mix(SI, P.warm, 0.35).getHex(), { roughness: 0.35, metalness: 0.3 });
  const gateM = mat(P.accent, { roughness: 0.35, metalness: 0.6 });
  const skin = glass(night ? 0x5aa9e6 : 0x9fc4dc, { opacity: 0.55, depthWrite: false });
  const contact = mat(night ? 0xc9a14a : 0xe0b070, { roughness: 0.3, metalness: 0.9 });
  const ebox = new THREE.MeshStandardMaterial({ color: P.accent, emissive: P.accent, emissiveIntensity: night ? 1 : 0.6, roughness: 0.4 });

  const meshes = {};
  const B = (key, w, h, d, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z);
    b.castShadow = b.receiveShadow = true; b.userData.part = key; root.add(b); (meshes[key] = meshes[key] || []).push(b); return b;
  };
  /* the silicon underneath, and an insulating layer that keeps the switch apart from its neighbours */
  B(null, 9.4, 0.9, 4.4, si, 0, 0, -0.6);
  /* the whole switch is cut open along one plane at the front (z = CUT), so its cut face shows the sheets inside the
     gate, each in its skin; behind the cut it is whole */
  const CUT = 0.05, back = -1.65, depthZ = CUT - back, midZ = (back + CUT) / 2;
  /* source and drain: silicon grown with added atoms, on either side */
  B('source', 2.2, 2.6, depthZ, doped, -3.3, 0.9, midZ);
  B('drain', 2.2, 2.6, depthZ, doped, 3.3, 0.9, midZ);
  /* three sheets of silicon from source to drain: the channel */
  const SHEETS = [1.45, 2.1, 2.75];
  SHEETS.forEach(y => B('channel', 4.4, 0.24, depthZ - 0.5, sheetM, 0, y, midZ + 0.25));
  /* the gate wraps round every sheet */
  const GX = 1.7, cut = CUT;
  /* drawn as slabs round the sheets, so the cut face shows each sheet in its skin */
  const gz = (cut - back), gzc = (back + cut) / 2;
  B('gate', GX, 0.25, gz, gateM, 0, 1.1, gzc);                                   /* below the lowest sheet */
  for (let i = 0; i < SHEETS.length - 1; i++) B('gate', GX, SHEETS[i + 1] - SHEETS[i] - 0.36, gz, gateM, 0, SHEETS[i] + 0.3, gzc);
  B('gate', GX, 0.55, gz, gateM, 0, SHEETS[SHEETS.length - 1] + 0.3, gzc);      /* above the highest */
  B('gate', GX, 2.25, 0.35, gateM, 0, 1.1, back - 0.17);                         /* the back wall */
  /* the skin: insulator between the gate and each sheet, a few atoms thick */
  SHEETS.forEach(y => B('oxide', GX, 0.36, gz + 0.06, skin, 0, y - 0.06, gzc + 0.03));
  /* spacers keep the gate apart from source and drain */
  const spacer = mat(night ? 0x2a3854 : 0xc8d3e1, { roughness: 0.6 });
  [-1, 1].forEach(s => B(null, 0.35, 2.55, gz, spacer, s * (GX / 2 + 0.17), 1.1, gzc));
  /* contacts: metal down to the source, the drain and the gate */
  B(null, 0.7, 1.6, 0.7, contact, -3.3, 3.5, midZ); B(null, 0.7, 1.6, 0.7, contact, 3.3, 3.5, midZ); B(null, 0.6, 1.4, 0.6, contact, 0, 3.4, midZ - 0.2);

  /* electrons: carried from source to drain through the sheets while the switch is on */
  const eg = new THREE.SphereGeometry(0.09, 10, 8), electrons = [];
  for (let i = 0; i < 18; i++) { const e = new THREE.Mesh(eg, ebox); e.userData = { sheet: i % 3, u: (i * 0.37) % 1, z: CUT + 0.02 - ((i * 0.61) % 1) * 0.25 }; root.add(e); electrons.push(e); }

  /* names on the parts, from the words of the switch level; a tap picks the part */
  const anchor = { gate: [0, 3.65, -0.9], channel: [1.75, 2.99, 0.05], oxide: [-0.55, 1.5, 0.08], source: [-3.9, 3.5, 0.05], drain: [3.9, 3.5, 0.05] };
  const names = PARTS.map(k => { const lb = L.add(root, new THREE.Vector3(...anchor[k]), t('part.switch.' + k), { cls: 'part3 pick', button: true, data: { swpart: k } }); lb.key = k; return lb; });
  host.addEventListener('click', e => { const b = e.target.closest('[data-swpart]'); if (b) { e.stopPropagation(); on.part && on.part(b.dataset.swpart); } });
  /* the note on the picked part: beside its name, in HTML */
  const card = document.createElement('div'); card.className = 'swnote'; card.hidden = true; host.appendChild(card);
  let picked = null;
  /* under Ask, the questions' marks on their parts, beside the names, never on them */
  const marks = createOverlay(host, { mark: th => on.mark && on.mark(th), marks: ths => on.askMany && on.askMany(ths) }), mv = new THREE.Vector3();
  function placeMarks() {
    const ms = k > 0.85 && on.marks ? on.marks() : null;
    if (!ms || !ms.length) return marks.draw({ labels: [], marks: [] });
    const hr = host.getBoundingClientRect(), avoid = names.filter(n => n.el.style.opacity !== '0').map(n => { const r = n.el.getBoundingClientRect(); return [r.left - hr.left, r.top - hr.top, r.width, r.height]; });
    root.updateWorldMatrix(true, false);
    marks.draw({ labels: [], avoid, marks: ms.filter(m => anchor[m.part]).map(m => { mv.set(...anchor[m.part]).applyMatrix4(root.matrixWorld).project(camera); return { part: m.part, x: (mv.x + 1) / 2 * W, y: (1 - mv.y) / 2 * H, threads: m.threads }; }) });
  }

  /* camera: looking down about 32° from a little left of the front, so the cut face of the gate shows between the
     source and the drain (the stack's -35° would hide it behind the source); you may turn it 20° each way; it sways */
  let k = 0, off = 0, raf = 0, last = performance.now(), yaw = 0, yawGoal = 0, frame = null, W = 1, H = 1;
  const BASE = { tilt: 0.44, turn: -0.32, r: 4.1 };
  const sway = now => (still() ? 0 : Math.sin(now / 14000 * Math.PI * 2) * 0.052);
  function place(now) {
    const r = canvas.getBoundingClientRect(); W = r.width || 1; H = r.height || 1;
    const f = frame || { B: Math.min(W, H) * 0.8, cx: W / 2, cy: H / 2 };
    /* the object fills the square the flat level stood in; farther while you are still above it */
    const fov = camera.fov * Math.PI / 180, fit = (BASE.r / Math.tan(fov / 2)) * (H / Math.min(f.B * 1.05, W * 0.74));
    const dist = fit * (off < 0 ? 1 + 3 * -off : 1 / (1 + 2.5 * off));
    const a = BASE.turn + yaw + sway(now), b = BASE.tilt;
    camera.position.set(Math.sin(a) * Math.cos(b) * dist, Math.sin(b) * dist + 2.1, Math.cos(a) * Math.cos(b) * dist - 0.4);
    camera.lookAt(0, 2.1, -0.4);
    camera.aspect = W / H; camera.setViewOffset(W, H, W / 2 - f.cx, H / 2 - f.cy, W, H); camera.updateProjectionMatrix();
    st.size(W, H);
  }
  function tick(now) {
    raf = 0; if (k <= 0) return;
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000); last = now;
    yaw += (yawGoal - yaw) * Math.min(1, dt * 6);
    place(now);
    /* electrons only flow once you are at the switch */
    electrons.forEach(e => { const d = e.userData; if (!still()) d.u = (d.u + dt * 0.22) % 1; e.position.set(-2.2 + d.u * 4.4, SHEETS[d.sheet] + 0.12, d.z); e.visible = k > 0.6; });
    names.forEach(n => { n.show = k > 0.85; n.el.classList.toggle('on', n.key === picked); });
    L.update(camera, W, H);
    if (picked && k > 0.85) placeCard(); else card.hidden = true;
    placeMarks();
    st.draw(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  function placeCard() {
    const n = names.find(x => x.key === picked); if (!n || n.el.style.opacity === '0') { card.hidden = true; return; }
    card.hidden = false;
    const r = n.el.getBoundingClientRect(), hr = host.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
    const right = r.left - hr.left + r.width / 2 < W / 2;
    let x = right ? r.right - hr.left + 10 : r.left - hr.left - cw - 10, y = r.top - hr.top - ch / 2 + r.height / 2;
    x = clamp(x, 8, W - cw - 8); y = clamp(y, 8, H - ch - 8);
    card.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
  }

  /* turning with a sideways drag (an up or down drag still zooms the dive) */
  let drag = null;
  canvas.addEventListener('pointerdown', e => { if (k > 0.5) drag = { x: e.clientX, y0: yawGoal }; });
  canvas.addEventListener('pointermove', e => { if (drag && k > 0.5) yawGoal = clamp(drag.y0 + (e.clientX - drag.x) / 260, -0.35, 0.35); });
  addEventListener('pointerup', () => { drag = null; });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  return {
    /* how present the switch is (0..1), how far the zoom is from it (negative: still above), and the square to fill */
    show(kk, depthOffset, f) {
      const was = k; k = clamp(kk); off = depthOffset || 0; if (f) frame = f;
      canvas.style.opacity = String(1 - k);
      host.hidden = k <= 0;
      if (k > 0 && was <= 0) { showStage(true); last = performance.now(); }
      if (k <= 0 && was > 0) { showStage(false); card.hidden = true; marks.clear(); }
      if (k > 0 && !raf) raf = requestAnimationFrame(tick);
    },
    active: () => k > 0.5,
    /* the part under a point of the screen, or null */
    hit(x, y) {
      const r = canvas.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const h = ray.intersectObjects(root.children, false).find(i => i.object.userData.part);
      return h ? h.object.userData.part : null;
    },
    /* the picked part and its note ({ title, text }), or null */
    select(key, note) {
      picked = PARTS.includes(key) ? key : null;
      if (picked && note) card.innerHTML = '<b>' + note.title.replace(/</g, '&lt;') + '</b><span>' + note.text.replace(/</g, '&lt;') + '</span>';
      if (!picked) card.hidden = true;
    },
    warm: () => st.warm(scene, camera),
    dispose() { cancelAnimationFrame(raf); L.clear(); marks.clear(); card.remove(); canvas.style.opacity = ''; }
  };
}
