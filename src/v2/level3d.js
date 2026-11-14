/* A level of the dive drawn in 3D on the one stage (docs/reviews/art-direction.md, "hero objects"): what every such
   level shares, so the switch and the atom behave the same. It lives inside the flat dive (src/app/world.js): as the
   zoom reaches the level, the shell (src/v2/app.js) fades the flat picture and this one takes its place on the same
   square, at the same size, so the zoom stays one movement; farther while you are still above it, nearer as you go
   on. Words are never drawn into the scene: the names are HTML over projected points, a picked part's note opens
   beside its name, and under Ask the questions' marks sit beside the names (overlay.js). A sideways drag turns it 20°
   each way (up and down still zoom); it sways when idle and holds still with reduced motion.

   createLevel3D(canvas, host, on, model) -> { show(k, depthOffset, frame), select(key, note), hit(x, y), active(),
     warm(), dispose() }
   model(scene, root, P, night) -> { level, parts: [key], anchors: { key: [x, y, z] }, view: { tilt, turn, r, at: [x, y, z], fixed,
     arrive: { tilt, turn, ms } }, update(dt, k, dist, arrived, picked), has(key) }   (r: the object's radius, so it fills the square; at:
     where the camera looks; dist: the camera's distance from it, which changes with the screen and the zoom; arrive:
     coming down from the level above, the camera starts at that angle and rises to the level's own, once, and
     arrived (0..1) says how far, for the model's own part of the move; 1 when there is none; picked: the part picked;
     has: optional, whether a part is there to name now)
   on.part(key), on.marks() -> [{ part, threads }] under Ask, else null, on.mark(threadId), on.askMany([threadId]). */
import * as THREE from '../vendor/three.min.js';
import { PALETTES, theme, stage, light, labels, showStage, clamp, ease } from './kit3d.js';
import { partWord } from '../data/weave.js';
import { t } from '../core/i18n.js';
import { createOverlay } from './overlay.js';

export const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createLevel3D(canvas, host, on, model) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const st = stage(canvas);
  const scene = new THREE.Scene(); scene.environment = st.env; scene.environmentIntensity = night ? 0.35 : 0.7;
  scene.background = new THREE.Color(night ? 0x0b1120 : 0xdfe8f2);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  light(scene, P, 16);
  const root = new THREE.Group(); scene.add(root);
  const M = model(scene, root, P, night), V = M.view, at = new THREE.Vector3(...V.at);

  /* names on the parts, from the level's words; a tap picks the part */
  const L = labels(host);
  const names = M.parts.map(k => { const lb = L.add(root, new THREE.Vector3(...M.anchors[k]), t('part.' + partWord(M.level, k)), { cls: 'part3 pick', button: true, data: { part3: k } }); lb.key = k; return lb; });
  host.addEventListener('click', e => { const b = e.target.closest('[data-part3]'); if (b) { e.stopPropagation(); on.part && on.part(b.dataset.part3); } });
  const card = document.createElement('div'); card.className = 'swnote'; card.hidden = true; host.appendChild(card);
  let picked = null;
  const marks = createOverlay(host, { mark: th => on.mark && on.mark(th), marks: ths => on.askMany && on.askMany(ths) }), mv = new THREE.Vector3();

  let k = 0, off = 0, raf = 0, last = performance.now(), yaw = 0, yawGoal = 0, frame = null, W = 1, H = 1, arr = null, arrived = 1;
  /* a plan (V.fixed: the gate) is read straight, not turned: it neither sways nor turns with a drag */
  const sway = now => (still() || V.fixed ? 0 : Math.sin(now / 14000 * Math.PI * 2) * 0.052);
  function place(now) {
    const r = canvas.getBoundingClientRect(); W = r.width || 1; H = r.height || 1;
    const f = frame || { B: Math.min(W, H) * 0.8, cx: W / 2, cy: H / 2 };
    /* the object fills the square the flat level stood in; farther while you are still above it */
    const fov = camera.fov * Math.PI / 180, fit = (V.r / Math.tan(fov / 2)) * (H / Math.min(f.B * 1.05, W * 0.74));
    /* arriving from the level above: from its angle to this level's own, closing in (the camera carries the change of
       style) */
    arrived = arr ? ease(clamp(arr.t / V.arrive.ms)) : 1;
    if (arrived >= 1) arr = null;
    const dist = fit * (off < 0 ? 1 + 3 * -off : 1 / (1 + 2.5 * off)) * (1 + 0.45 * (1 - arrived));
    const A = V.arrive && arrived < 1 ? V.arrive : V, a = A.turn + (V.turn - A.turn) * arrived + yaw + sway(now), b = A.tilt + (V.tilt - A.tilt) * arrived;
    camera.position.set(at.x + Math.sin(a) * Math.cos(b) * dist, at.y + Math.sin(b) * dist, at.z + Math.cos(a) * Math.cos(b) * dist);
    camera.lookAt(at);
    camera.aspect = W / H; camera.setViewOffset(W, H, W / 2 - f.cx, H / 2 - f.cy, W, H); camera.updateProjectionMatrix();
    st.size(W, H);
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
  /* under Ask, the questions' marks on their parts, beside the names, never on them */
  function placeMarks() {
    const ms = k > 0.85 && on.marks ? on.marks() : null;
    if (!ms || !ms.length) return marks.draw({ labels: [], marks: [] });
    const hr = host.getBoundingClientRect(), avoid = names.filter(n => n.el.style.opacity !== '0').map(n => { const r = n.el.getBoundingClientRect(); return [r.left - hr.left, r.top - hr.top, r.width, r.height]; });
    root.updateWorldMatrix(true, false);
    marks.draw({ labels: [], avoid, marks: ms.filter(m => M.anchors[m.part]).map(m => { mv.set(...M.anchors[m.part]).applyMatrix4(root.matrixWorld).project(camera); return { part: m.part, x: (mv.x + 1) / 2 * W, y: (1 - mv.y) / 2 * H, threads: m.threads }; }) });
  }
  function tick(now) {
    raf = 0; if (k <= 0) return;
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000); last = now;
    /* the arrival goes by frames (each counting at most 50 ms), so a slow first frame (shaders compiling) never eats
       it; it starts after a moment at the old angle */
    if (arr) { if (arr.hold > 0) arr.hold -= dt * 1000; else arr.t += dt * 1000; }
    yaw += (yawGoal - yaw) * Math.min(1, dt * 6);
    place(now);
    M.update(still() ? 0 : dt, k, camera.position.distanceTo(at), arrived, picked);
    /* names hide while the camera moves in (the arrival) and show once it rests */
    names.forEach(n => { n.show = k > 0.85 && arrived >= 1 && (!M.has || M.has(n.key)); n.el.classList.toggle('on', n.key === picked); });
    L.update(camera, W, H);
    if (picked && k > 0.85 && arrived >= 1) placeCard(); else card.hidden = true;
    placeMarks();
    st.draw(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  /* turning with a sideways drag */
  let drag = null;
  canvas.addEventListener('pointerdown', e => { if (k > 0.5 && !V.fixed) drag = { x: e.clientX, y0: yawGoal }; });
  canvas.addEventListener('pointermove', e => { if (drag && k > 0.5) yawGoal = clamp(drag.y0 + (e.clientX - drag.x) / 260, -0.35, 0.35); });
  addEventListener('pointerup', () => { drag = null; });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  return {
    /* how present the level is (0..1), how far the zoom is from it (negative: still above), and the square to fill;
       the shell fades the flat picture and shows the stage */
    show(kk, depthOffset, f) {
      const was = k; k = clamp(kk); off = depthOffset || 0; if (f) frame = f;
      host.hidden = k <= 0;
      if (k > 0 && was <= 0) { last = performance.now(); arr = V.arrive && off <= 0.05 && !still() ? { hold: 250, t: 0 } : null; }
      if (k <= 0 && was > 0) { card.hidden = true; marks.clear(); }
      if (k > 0 && !raf) raf = requestAnimationFrame(tick);
    },
    active: () => k > 0.5,
    /* the part under a point of the screen, or null */
    hit(x, y) {
      const r = canvas.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const h = ray.intersectObjects(root.children, true).find(i => i.object.userData.part);
      return h ? h.object.userData.part : null;
    },
    /* the picked part and its note ({ title, text }), or null */
    select(key, note) {
      picked = M.parts.includes(key) ? key : null;
      if (picked && note) card.innerHTML = '<b>' + esc(note.title) + '</b><span>' + esc(note.text) + '</span>';
      if (!picked) card.hidden = true;
    },
    warm: () => st.warm(scene, camera),
    dispose() { cancelAnimationFrame(raf); L.clear(); marks.clear(); card.remove(); }
  };
}
export { showStage };
