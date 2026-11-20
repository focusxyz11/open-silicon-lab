/* The design studio, walked inside (#267): the building you saw on the island, entered without a cut. The flight comes
   down through the opened floor, as the island opens it, to the first corner; walking along (← →, Next →, the line of
   steps) moves the camera from corner to corner along the room, in the order of the design's steps, and out to the mask
   house's loading bay, beside the road to the factory. The room is drawn from the studio's one plan (src/data/studio.js)
   with the island's own furnishing (src/v2/furnish.js): the same desks, screens and people.

   Each corner has a screen. At a corner, the way in (↓, the button on the picture, a push of the wheel) settles the
   camera on that screen until it fills the picture, and the step's bench takes over there (handoff, in the manner of
   HANDOFF in src/v2/dc3d.js and arrive in src/v2/level3d.js); coming back out of the bench starts on the screen and pulls
   back into the room (back). Names are HTML over projected points (src/v2/kit3d.js), never words in the scene.

   createStudio(canvas, host, on): on.level(i) at each stop (0 outside, then the corners in order), on.depth(z),
   on.portal({ x, y } | null) where the screen stands on the picture, on.beyond() for a push in at a corner.
   Returns { go(i), jump(i), z, handoff(), back(i), screen(), pause(), resume(), warm(), dispose() }. */
import { THREE, PALETTES, theme, stage, light, mat, glass, box, cyl, group, flat, labels, clamp, smooth, ease, reduced, rnd } from './kit3d.js';
import { furnisher, lump } from './furnish.js';
import { FLOOR, AISLE, HOUSE, CORNERS, screenAt } from '../data/studio.js';
import { t } from '../core/i18n.js';

/* the stops of the walk: outside, over the opened floor, then the corners in order */
export const STOPS = ['outside'].concat(CORNERS.map(c => c.id));
const FOV = 40;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
/* where the camera stands at each stop, and what it looks at. Outside: high over the opened floor, from the south-west,
   as the island looks at it. At a corner: in the walk, a little raised, looking at the corner; at the mask house, from
   its open south side, down on the light table */
const POSES = [{ from: V3(-22, 25, 27), look: V3(-1, 0, -1) }].concat(CORNERS.map(c => c.house
  ? { from: V3(c.at[0] - 0.8, 4.6, c.at[1] + 7.6), look: V3(c.at[0], 1.1, c.at[1] - 0.6) }
  : { from: V3(c.at[0] + 0.6, AISLE.eye + 0.8, AISLE.z + 4.2), look: V3(c.at[0], 1.35, c.at[1] - 0.3) }));

export function createStudio(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0;
  const st = stage(canvas), { env } = st;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.sky); scene.fog = new THREE.Fog(P.fog, 120, 420); scene.environment = env; scene.environmentIntensity = night ? 0.35 : 0.5;
  const { sun } = light(scene, P, 40); if (!night) sun.intensity = 2.2;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 900);
  const L = labels(host);
  const leaf = night ? 0x284534 : 0x67845a;
  const F = furnisher(P, night, leaf);
  const fades = [];
  const fader = (m, a, b, max = 1) => { const mm = m.clone(); mm.transparent = true; fades.push({ m: mm, a, b, max }); return mm; };

  /* ---- the ground round the studio: grass, its plot, the road past the mask house to the factory, trees ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(night ? 0x1b302b : 0x87a06f, { roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; scene.add(ground);
  /* the forecourt before the glass front, as on the island, and a path from it to the road */
  flat(scene, [[-16, 4.6], [8, 4.6], [9, 8.5], [-15, 8.5]], mat(night ? 0x2f3540 : 0xcfc8b8, { roughness: 0.9 }), 0.0);
  box(scene, 14, 0.04, 2.2, mat(night ? 0x2f3540 : 0xcfc8b8, { roughness: 0.9 }), 15, 0, 7.6, 0.01, { cast: false });
  box(scene, 6, 0.05, 90, mat(night ? 0x252b33 : 0x5d636c, { roughness: 0.9 }), 22.5, 0, 0, 0.01, { cast: false });
  for (let i = 0; i < 18; i++) box(scene, 0.16, 0.012, 1.6, mat(night ? 0x8a919c : 0xf1efe8, { roughness: 0.6 }), 22.5, 0.05, -42 + i * 5, 0.005, { cast: false });
  const crown = lump();
  for (let i = 0; i < 46; i++) { const a = rnd(i, 3) * 6.28, r = 32 + rnd(i, 5) * 40, x = -6 + Math.cos(a) * r, z = -2 + Math.sin(a) * r * 0.8; if (x > 16 && x < 28) continue;
    const s = 0.8 + rnd(i, 7) * 0.7, m = new THREE.Mesh(crown, mat(leaf, { roughness: 0.9 })); m.position.set(x, 1.9 * s, z); m.scale.set(1.5 * s, 1.15 * s, 1.5 * s); m.castShadow = true; scene.add(m); cyl(scene, 0.12 * s, 0.18 * s, 1.3 * s, mat(night ? 0x3a3128 : 0x6b5643), x, 0, z, 5); }

  /* ---- the studio's ground floor, opened: the floor, the far walls, the glass front faded as the island fades it ---- */
  const fw = FLOOR.x1 - FLOOR.x0, fd = FLOOR.z1 - FLOOR.z0, fx = (FLOOR.x0 + FLOOR.x1) / 2, fz = (FLOOR.z0 + FLOOR.z1) / 2;
  box(scene, fw - 0.2, 0.1, fd - 0.2, mat(night ? 0x3a3631 : 0xd9cfbf, { roughness: 0.55 }), fx, 0, fz, 0.02, { cast: false });
  box(scene, fw + 0.4, FLOOR.h, 0.3, mat(P.white), fx, 0, FLOOR.z0, 0.06);
  box(scene, 0.3, FLOOR.h, fd, mat(P.white), FLOOR.x0, 0, fz, 0.06);
  /* the east wall opens as the walk goes on to the mask house */
  box(scene, 0.3, FLOOR.h, fd, fader(mat(P.white), 5.1, 5.6), FLOOR.x1, 0, fz, 0.06);
  const gl = glass(P.glass, { opacity: night ? 0.12 : 0.1, emissive: night ? P.glass : 0, emissiveIntensity: night ? 0.3 : 0 });
  box(scene, fw, FLOOR.h, 0.12, gl, fx, 0, FLOOR.z1, 0.02, { cast: false });
  /* a line of light along the walk, and a strip of the floor's own tone under it */
  box(scene, fw - 1.2, 0.012, 1.6, mat(night ? 0x47423b : 0xe6dccd, { roughness: 0.5 }), fx, 0.1, AISLE.z, 0.01, { cast: false });
  /* the wing beside it, as on the island */
  box(scene, 9, 6.2, 7, mat(P.white), -20, 0, -6, 0.3); box(scene, 9.2, 0.5, 7.2, mat(P.slate), -20, 6.2, -6, 0.1);

  /* ---- the corners, from the plan, furnished as the island furnishes them ---- */
  const G = {};
  CORNERS.forEach(c => { G[c.id] = group(scene, c.at[0], c.house ? 0 : 0.1, c.at[1]); F.corner(G[c.id], c.id); });

  /* ---- the mask house: its walls, the bay door open on the road, the roof lifting as the walk comes to it ---- */
  const H = HOUSE, hx = H.at[0], hz = H.at[1];
  box(scene, H.w, H.h, 0.3, mat(P.white), hx, 0, hz - H.d / 2, 0.06);
  box(scene, 0.3, H.h, H.d, mat(P.white), hx - H.w / 2, 0, hz, 0.06);
  [-1, 1].forEach(s => box(scene, 0.3, H.h, (H.d - 3.6) / 2, mat(P.white), hx + H.w / 2, 0, hz + s * (H.d / 4 + 0.9), 0.06));
  box(scene, 0.3, H.h - 2.8, 3.6, mat(P.white), hx + H.w / 2, 2.8, hz, 0.04);
  box(scene, H.w, H.h, 0.3, fader(mat(P.white), 4.9, 5.5), hx, 0, hz + H.d / 2, 0.06);
  box(scene, H.w + 0.2, 0.6, H.d + 0.2, fader(mat(P.slate, { roughness: 0.7 }), 4.9, 5.5), hx, H.h, hz, 0.1);
  box(scene, H.w - 0.4, 0.1, H.d - 0.4, mat(night ? 0x2f343c : 0xc9ccd0, { roughness: 0.6 }), hx, 0, hz, 0.02, { cast: false });
  /* the truck that takes the masks to the factory, at the bay */
  { const tr = group(scene, hx + H.w / 2 + 3.2, 0, hz, Math.PI / 2); box(tr, 1.6, 1.4, 1.5, mat(P.white), 1.6, 0.3, 0, 0.15); box(tr, 3.2, 1.8, 1.6, mat(P.accent, { roughness: 0.5 }), -0.9, 0.3, 0, 0.12);
    [[-1.6, -0.8], [-1.6, 0.8], [1.6, -0.8], [1.6, 0.8]].forEach(([x, z]) => { const w = cyl(tr, 0.38, 0.38, 0.25, mat(0x15181d), x, 0, z, 12); w.rotation.x = Math.PI / 2; w.position.y = 0.38; }); }

  /* ---- names on the picture: each corner (at a corner, the way in on the picture names its screen) ---- */
  const corners = CORNERS.map((c, i) => { const lb = L.add(G[c.id], V3(c.house ? -0.6 : 0, c.house ? 2.6 : 2.9, c.house ? -2 : -1.2), t('depth.' + c.id + '.name'), { cls: 'part3 corner3' }); lb.i = i + 1; return lb; });

  /* ---- the camera: along the stops, and at a corner as close to its screen as fills the picture (k) ---- */
  let z = 0, goal = 0, k = 0, hand = null, walk = null, raf = 0, running = true, W = 1, H2 = 1, last = performance.now(), lastLevel = -1, push = 0;
  const from = new THREE.Vector3(), look = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  /* the screen pose: along the screen's face, far enough that it fills most of the picture */
  /* the part of the picture the frame leaves free (the bar and the line of steps above, the card below on a phone), as
     shares of its height: the screen is fitted into it, and centred in it */
  const free = () => { const wide = innerWidth > 720; return { t: Math.min(0.4, (wide ? 196 : 164) / H2), b: Math.min(0.4, (wide ? 40 : 150) / H2) }; };
  const screenPose = i => { const c = CORNERS[i - 1]; if (!c) return null; const s = screenAt(c), th = Math.tan(FOV * Math.PI / 360), fr = free(), fh = 1 - fr.t - fr.b;
    /* from a little above, looking a little down: over a chair, or over the edge of a table */
    const n = (s.n[1] ? V3(0, 1, 0.16) : V3(0, 0.22, 1)).normalize(), up = V3(0, 1, 0).addScaledVector(n, -n.y).normalize();
    const d = Math.max(s.h / 2 / (th * fh), s.w / 2 / (th * camera.aspect * 0.92)) / 0.94, at = V3(s.x, s.y, s.z);
    /* the free part's middle is below the picture's: the camera rises by as much, so the screen sits in it */
    const off = up.multiplyScalar((fr.t - fr.b) * d * th);
    return { from: at.clone().addScaledVector(n, d).add(off), look: at.clone().add(off) }; };
  const pose = () => {
    const i = Math.max(0, Math.min(POSES.length - 2, Math.floor(z))), f = ease(clamp(z - i)), A = POSES[i], B = POSES[i + 1];
    from.lerpVectors(A.from, B.from, f); look.lerpVectors(A.look, B.look, f);
    /* coming down from outside, the camera falls in an arc, over the glass rather than through it */
    if (i === 0) from.y += Math.sin(f * Math.PI) * 4;
    const lv = Math.round(z), Sp = k > 0 && lv >= 1 ? screenPose(lv) : null;
    if (Sp) { const e = ease(k); from.lerp(Sp.from, e); look.lerp(Sp.look, e); }
    camera.position.copy(from); camera.lookAt(look);
    const span = Math.max(6, from.distanceTo(look) * 1.6), s = sun.shadow.camera;
    Object.assign(s, { left: -span, right: span, top: span, bottom: -span, near: 0.1, far: span * 8 }); s.updateProjectionMatrix();
    sun.position.set(look.x - span * 1.1, look.y + span * 2, look.z + span * 1.3); sun.target.position.copy(look);
  };
  const states = () => {
    fades.forEach(f => { const o = (1 - smooth(f.a, f.b, z)) * f.max; f.m.opacity = o; f.m.visible = o > 0.01; f.m.depthWrite = o > 0.6; });
    const lv = Math.round(z), near = Math.abs(z - lv) < 0.35;
    /* the corners are named from outside, and while walking past them; at a corner the line of steps says where you are */
    corners.forEach(lb => { lb.show = k < 0.2 && (z < 0.5 || (!near || Math.abs(z - lv) > 0.04) && Math.abs(lb.i - z) < 1.4 && z >= 0.5); });
  };
  const pv = new THREE.Vector3();
  const screenNow = () => { const lv = Math.round(z), c = CORNERS[lv - 1]; if (!c || Math.abs(z - lv) > 0.06) return null; const s = screenAt(c); pv.set(s.x, s.y, s.z).project(camera); return pv.z < 1 ? { x: (pv.x + 1) / 2, y: (1 - pv.y) / 2 } : null; };

  /* ---- input: a push of the wheel at a corner goes in; a swipe sideways on a touch screen walks along ---- */
  /* the move to or from a screen is timed on the clock, not counted in frames, so a slow machine takes as long */
  const HAND_MS = 700, STEP_MAX = 120;
  const go = v => { const g = clamp(Math.round(v), 0, STOPS.length - 1); if (g !== goal || Math.abs(z - g) > 1e-3) { goal = g; walk = { from: z, e: 0 }; } if (k > 0) hand = { e: 0, from: k, to: 0 }; };
  canvas.addEventListener('wheel', e => { e.preventDefault(); const lv = Math.round(z);
    if (e.deltaY > 0 && lv >= 1 && Math.abs(z - lv) < 0.06 && k < 0.05) { push += e.deltaY; if (push > 240) { push = 0; on.beyond && on.beyond(); } } else push = 0; }, { passive: false });
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, t: performance.now(), touch: e.pointerType === 'touch' }; });
  const end = e => { const d = drag; drag = null; if (!d || !d.touch || e.type !== 'pointerup') return; const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (performance.now() - d.t > 500 || Math.abs(dx) < 40 || Math.abs(dx) < 1.5 * Math.abs(dy)) return; on.swipe && on.swipe(dx < 0 ? 1 : -1); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; H2 = r.height; st.size(W, H2); camera.aspect = W / Math.max(1, H2); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    /* the time this frame moves the walk on: the clock's, but never more than a long frame's, so a frame that stalls (the
       room's first draw on a slow machine) cannot carry the whole flight past unseen; on a quick machine nothing changes */
    const dt = Math.min(Math.max(0, now - last), STEP_MAX); last = now;
    const still = reduced();
    /* the walk is timed on the clock too: longer for a longer way, the same on any machine */
    if (walk) { walk.e += dt; const u = still ? 1 : Math.min(1, walk.e / Math.min(2600, 900 + 500 * Math.abs(goal - walk.from))); z = walk.from + (goal - walk.from) * u; if (u >= 1) { z = goal; walk = null; } }
    /* to or from the screen, once the walk has come to rest at the corner */
    if (hand && !walk) { hand.e += dt; const u = still ? 1 : Math.min(1, hand.e / HAND_MS); k = hand.from + (hand.to - hand.from) * u;
      if (u >= 1) { const h = hand; hand = null; if (h.done) { pose(); h.done(screenNow()); } } }
    pose(); states();
    const lv = Math.round(z); if (lv !== lastLevel) { lastLevel = lv; on.level && on.level(lv); }
    on.depth && on.depth(z);
    st.draw(scene, camera);
    L.update(camera, W, H2);
    on.portal && on.portal(k < 0.05 ? screenNow() : null);
  };
  raf = requestAnimationFrame(frame);
  return {
    go(v) { go(v); },
    /* straight to a stop, without walking (coming in from the island starts outside; coming back from a bench, at its corner) */
    jump(v) { z = goal = clamp(Math.round(v), 0, STOPS.length - 1); k = 0; hand = walk = null; lastLevel = -1; },
    get z() { return z; },
    /* the way in at a corner: the camera settles on the screen until it fills the picture; resolves once it does */
    handoff() { const lv = Math.round(goal); if (lv < 1) return Promise.resolve(null); goal = lv; return new Promise(r => { hand = { e: 0, from: k, to: 1, done: r }; }); },
    /* the way back out of a bench: start on its screen and pull back into the room */
    back(i) { z = goal = clamp(i, 1, STOPS.length - 1); walk = null; k = 1; hand = { e: 0, from: 1, to: 0 }; lastLevel = -1; },
    /* where the screen at this corner stands on the picture now, or null */
    screen: () => screenNow(),
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    warm: () => st.warm(scene, camera),
    dispose() { running = false; cancelAnimationFrame(raf); L.clear(); }
  };
}
