/* A level of the dive drawn in 3D on the one stage (docs/reviews/art-direction.md, "hero objects"): what every such
   level shares, so the switch and the atom behave the same. It lives inside the flat dive (src/app/world.js): as the
   zoom reaches the level, the shell (src/v2/app.js) fades the flat picture and this one takes its place on the same
   square, at the same size, so the zoom stays one movement; farther while you are still above it, nearer as you go
   on. Words are never drawn into the scene: the names are HTML over projected points, a picked part's note opens
   beside its name, and under Ask the questions' marks sit beside the names (overlay.js). A sideways drag turns it 20°
   each way (up and down still zoom); it sways when idle and holds still with reduced motion.

   createLevel3D(canvas, host, on, model) -> { show(k, depthOffset, frame), select(key, note), hit(x, y), active(),
     warm(), dispose(), failed }   (failed: too slow even at low settings; the shell then keeps the flat drawing)
   model(scene, root, P, night) -> { level, parts: [key], anchors: { key: [x, y, z] }, view: { tilt, turn, r, at: [x, y, z], fixed,
     arrive: { tilt, turn, ms }, door, foot, enter }, update(dt, k, dist, arrived, picked, leave), has(key) }   (r: the object's radius, so it fills the square; at:
     where the camera looks; dist: the camera's distance from it, which changes with the screen and the zoom; arrive:
     coming down from the level above, the camera starts at that angle and rises to the level's own, once, and
     arrived (0..1) says how far, for the model's own part of the move; 1 when there is none; picked: the part picked;
     has: optional, whether a part is there to name now; in a join (joinFrame) the child's arrived runs over its
     view.enter, the parent's leave (0 at rest) says how far the child has come into its view.door)
   on.part(key), on.marks() -> [{ part, threads }] under Ask, else null, on.mark(threadId), on.askMany([threadId]),
   on.failed(). */
import * as THREE from '../vendor/three.min.js';
import { PALETTES, theme, stage, light, labels, showStage, clamp, ease, QUALITY, lowQuality } from './kit3d.js';
import { partWord } from '../data/weave.js';
import { t } from '../core/i18n.js';
import { createOverlay } from './overlay.js';
import { pose, childPose, eye, smooth as sm, JOIN } from '../engines/join.js';

export const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/* joins, for the visit: off once joined frames have come too slowly (or osl-quality = slow) */
export const JOINS = { off: false };
const JP = { skip: 4, times: [], done: false };
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

  let k = 0, off = 0, raf = 0, last = performance.now(), yaw = 0, yawGoal = 0, frame = null, W = 1, H = 1, arr = null, arrived = 1, link = null;
  /* a plan (V.fixed: the gate) is read straight, not turned: it neither sways nor turns with a drag */
  const sway = now => (still() || V.fixed ? 0 : Math.sin(now / 14000 * Math.PI * 2) * 0.052);
  /* the picture's size, and the square of the flat level it fills */
  const size = () => { const r = canvas.getBoundingClientRect(); W = r.width || 1; H = r.height || 1; return frame || { B: Math.min(W, H) * 0.8, cx: W / 2, cy: H / 2 }; };
  /* the distance at which the object fills that square */
  const fitOf = f => (V.r / Math.tan(camera.fov * Math.PI / 360)) * (H / Math.min(f.B * 1.05, W * 0.74));
  /* the camera from a pose { at, tilt, turn, dist } (src/engines/join.js eye); near and far follow the distance, which
     in a join can be hundreds of the level's own units */
  function aim(p, f) {
    const e = eye(p); camera.position.set(e[0], e[1], e[2]); camera.lookAt(p.at[0], p.at[1], p.at[2]);
    camera.near = Math.max(0.1, p.dist / 200); camera.far = Math.max(200, 3 * p.dist);
    camera.aspect = W / H; camera.setViewOffset(W, H, W / 2 - f.cx, H / 2 - f.cy, W, H); camera.updateProjectionMatrix();
    camera.updateMatrixWorld();   /* now, not at the draw: the names are projected first, and a still level draws once */
    st.size(W, H);
  }
  function place(now) {
    const f = size();
    /* arriving from the level above: from its angle to this level's own, closing in (the camera carries the change of
       style) */
    arrived = arr ? ease(clamp(arr.t / V.arrive.ms)) : 1;
    if (arrived >= 1) arr = null;
    /* the object fills the square the flat level stood in; farther while you are still above it */
    const dist = fitOf(f) * (off < 0 ? 1 + 3 * -off : 1 / (1 + 2.5 * off)) * (1 + 0.45 * (1 - arrived));
    const A = V.arrive && arrived < 1 ? V.arrive : V, a = A.turn + (V.turn - A.turn) * arrived + yaw + sway(now), b = A.tilt + (V.tilt - A.tilt) * arrived;
    aim({ at: V.at, tilt: b, turn: a, dist }, f);
  }
  /* a join (docs/reviews/transitions.md): this level and its neighbour in one frame, on one camera path. The parent's
     scene, a veil of the sky over it as the child comes, then the child's scene over that with the same camera in its
     own units, so it stands in the parent's door. Everything is a function of f, so a fly, a drag and going back up
     all show the same thing. leave and enter are the two models' own parts of the move */
  function joinFrame(dt) {
    const guest = !!link.guest, Pl = guest ? api : link.host, Cl = guest ? link.guest : api, P = Pl.rig, C = Cl.rig;
    const door = typeof P.V.door === 'function' ? P.V.door() : P.V.door, foot = C.V.foot, f = guest ? off : 1 + off;
    const fr = size(); P.size(); C.size();
    const p = pose(f, P.V, C.V, door, foot, P.fitOf(fr)), cp = childPose(p, door, foot);
    const quiet = still() || QUALITY.low, step = v => (quiet ? (f >= JOIN.lead ? 1 : 0) : v), win = C.V.enter || [JOIN.child, 0.8];
    /* a child with a move of its own (enter) starts as exactly what the parent shows in its door, so it is drawn only
       once that move has begun: until then the parent's door is the parent's (drawn over it, the child's flat form
       would show faces the parent's tiles in front of the door hide) */
    const enter = step(sm(win[0], win[1], f)), drawn = f >= JOIN.child && (!C.V.enter || enter > 0);
    const leave = drawn ? step(sm(JOIN.child, JOIN.lead, f)) : 0;
    P.aim(p, fr); P.M.update(quiet ? 0 : dt, 1, p.dist, 1, null, leave);
    st.draw(P.scene, P.camera);
    st.veil(P.scene.background, sm(JOIN.veil[0], JOIN.veil[1], f));
    if (drawn) {
      C.aim(cp, fr); C.M.update(quiet ? 0 : dt, 1, cp.dist, enter, null, 0);
      /* such a child is hidden by the parent's tiles in front of the door while the parent clears them (leave below
         JOIN.clear); its camera is the parent's in its own units, near and far included, so the two depths agree.
         After that it is drawn in front, as every child is */
      const keep = !!C.V.enter && leave < JOIN.clear;
      if (keep) { C.camera.near = P.camera.near / p.s; C.camera.far = P.camera.far / p.s; C.camera.updateProjectionMatrix(); }
      const bg = C.scene.background; C.scene.background = null; st.over(C.scene, C.camera, keep); C.scene.background = bg;
    }
    document.documentElement.dataset.join = P.M.level + '>' + C.M.level;
  }  function placeCard() {
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
  /* too slow? the middle of a level's first 20 frame times, after it has settled: above 40 ms it drops to low
     settings and counts again; still above, the level gives up and the flat drawing stays (the shell reads failed) */
  const perf = { skip: 4, times: [], done: false };
  function watch(ms) {
    if (perf.done || k < 0.85) return;
    if (perf.skip > 0) { perf.skip--; return; }
    perf.times.push(QUALITY.test === 'slow' ? 99 : ms);
    if (perf.times.length < 20) return;
    const mid = perf.times.slice().sort((a, b) => a - b)[10]; perf.times = [];
    if (mid <= 40 || QUALITY.test === 'keep') { perf.done = true; return; }
    if (!QUALITY.low) { lowQuality(); perf.skip = 4; return; }
    perf.done = true; api.failed = true; on.failed && on.failed();
  }
  /* joins have a count of their own: if joined frames come too slowly, joins are off for the visit and every move
     goes through the flat drawing again, as before (JOINS.off, read by the shell) */
  function joinWatch(ms) {
    if (JOINS.off || JP.done) return;
    if (JP.skip > 0) { JP.skip--; return; }
    JP.times.push(QUALITY.test === 'slow' ? 99 : ms);
    if (JP.times.length < 20) return;
    const mid = JP.times.slice().sort((a, b) => a - b)[10]; JP.done = true;
    if (mid > 40 && QUALITY.test !== 'keep') { JOINS.off = true; on.failed && on.failed(); }
  }
  /* draw on demand: with nothing live moving (reduced motion, or low settings), a frame is drawn only when what it
     shows changes: the camera, the size, the presence, the picked part, the marks */
  let shown = '';
  function tick(now) {
    raf = 0; if (k <= 0) return;
    const raw = Math.max(0, now - last), dt = Math.min(0.05, raw / 1000); last = now;
    const f = link ? (link.guest ? off : 1 + off) : 0;
    if (link && f > JOIN.from && f < JOIN.to) {
      /* in a join no names, note or marks: they come back at rest */
      joinWatch(raw);
      const key = 'J' + off.toFixed(4) + '|' + W + '|' + H + (frame ? frame.B + ',' + frame.cx + ',' + frame.cy : '');
      if (!(still() || QUALITY.low) || key !== shown) {
        shown = key;
        names.forEach(n => { n.show = false; }); L.update(camera, W, H); card.hidden = true; marks.draw({ labels: [], marks: [] });
        joinFrame(dt);
      }
      raf = requestAnimationFrame(tick); return;
    }
    if (document.documentElement.dataset.join) delete document.documentElement.dataset.join;
    watch(raw);
    if (api.failed) return;
    /* the arrival goes by frames (each counting at most 50 ms), so a slow first frame (shaders compiling) never eats
       it; it starts after a moment at the old angle */
    if (arr) { if (arr.hold > 0) arr.hold -= dt * 1000; else arr.t += dt * 1000; }
    yaw += (yawGoal - yaw) * Math.min(1, dt * 6);
    place(now);
    const quiet = still() || QUALITY.low, ms = on.marks ? on.marks() : null;
    const key = [k.toFixed(3), off.toFixed(3), yaw.toFixed(4), arrived.toFixed(3), W, H, picked, frame ? frame.B + ',' + frame.cx + ',' + frame.cy : '', ms ? ms.length : 0].join('|');
    if (!quiet || key !== shown) {
      shown = key;
      M.update(quiet ? 0 : dt, k, camera.position.distanceTo(at), arrived, picked, 0);
      /* names hide while the camera moves in (the arrival) and show once it rests */
      names.forEach(n => { n.show = k > 0.85 && arrived >= 1 && (!M.has || M.has(n.key)); n.el.classList.toggle('on', n.key === picked); });
      L.update(camera, W, H);
      if (picked && k > 0.85 && arrived >= 1) placeCard(); else card.hidden = true;
      placeMarks();
      st.draw(scene, camera);
    }
    raf = requestAnimationFrame(tick);
  }

  /* turning with a sideways drag */
  let drag = null;
  canvas.addEventListener('pointerdown', e => { if (k > 0.5 && !V.fixed) drag = { x: e.clientX, y0: yawGoal }; });
  canvas.addEventListener('pointermove', e => { if (drag && k > 0.5) yawGoal = clamp(drag.y0 + (e.clientX - drag.x) / 260, -0.35, 0.35); });
  addEventListener('pointerup', () => { drag = null; });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const api = {
    failed: false,
    /* what a join needs of this level: its scene and camera, its model and view, and how to aim and fit */
    rig: { scene, camera, M, V, size, fitOf, aim },
    get door() { return V.door || null; }, get foot() { return V.foot || null; },
    /* how present the level is (0..1), how far the zoom is from it (negative: still above), and the square to fill;
       the shell fades the flat picture and shows the stage */
    /* link: null, { guest: level } (this level is the parent of a join and leads it) or { host: level } (the child,
       and leads it) */
    show(kk, depthOffset, f, lk) {
      if (api.failed) kk = 0;
      const was = k; k = clamp(kk); off = depthOffset || 0; if (f) frame = f; link = lk || null;
      host.hidden = k <= 0;
      if (k > 0 && was <= 0) { last = performance.now(); arr = V.arrive && off <= 0.05 && !still() && !link ? { hold: 250, t: 0 } : null; }
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
  return api;
}
export { showStage };
