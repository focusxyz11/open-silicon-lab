/* The switch in 3D: the first level of the zoom drawn on the one stage (docs/reviews/art-direction.md, "Switch: 3D").
   One transistor, cut open at the front: current runs from the source to the drain through three thin sheets of
   silicon, the gate wraps all the way round each sheet with a skin of insulator between, and the gate touches nothing
   it controls. That cannot be seen in a cross-section, so here 3D is the explanation, not a style.

   It lives inside the flat dive (src/app/world.js): as the zoom reaches the switch, the flat picture fades and this
   one takes its place on the same square, at the same size, so the zoom stays one movement. The flat drawing stays as
   the fallback. Materials and light are the shared ones (kit3d.js; the art direction's table): silicon blue-grey,
   doped silicon warmer, the gate in the accent, insulator as glass, contacts in contact metal, electrons glowing.
   Words are never drawn into the scene: the names are HTML over projected points, as everywhere.

   Coming down from the gate (a join, docs/reviews/transitions.md) it starts as the gate's own plan in the door: a wide
   gate strip lying across silicon. It stands up into the switch: the strip narrows to a gate, the silicon beside it
   rises and warms into source and drain, the silicon under it thins into three sheets as the gate comes down round
   them. Every box has the two forms, the flat one drawn from the gate's own layout (gate3d.js), so they never drift.

   What it shares with the other levels in 3D (the camera, names, notes, marks, turning) is in level3d.js.
   create(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat, glass } from './kit3d.js';
import { createLevel3D } from './level3d.js';
import { DIFF, GATES, H as GH, X, Z, DOOR, PORTAL } from './gate3d.js';
import { toChild, square, smooth } from '../engines/join.js';

/* the switch stands on the gate's door by the middle of its base slab's underside; R is its radius (view.r) */
const FOOT = [0, 0, -0.6], R = 4.1;
/* the gate's plan in the door, in the switch's units: the door's square, the gate strip's two edges, and the tops of
   the silicon and of the gate strip (the relief's heights, three times true) */
const PLAN = (() => {
  const s = DOOR.side / square(R), c = (x, y, z) => toChild([x, y, z], DOOR, FOOT, s);
  const [dx, dy, ds] = PORTAL;
  const a = c(X(dx), 0, Z(dy)), b = c(X(dx + ds), 0, Z(dy + ds)), g = GATES[0];
  /* the door must lie on the silicon strip and across the gate strip, or the flat form is not what the gate shows */
  if (!(dx >= DIFF[1][0] && dx + ds <= DIFF[1][0] + DIFF[1][2] && dy >= DIFF[1][1] && dy + ds <= DIFF[1][1] + DIFF[1][3])) console.warn('switch3d: the door is off the silicon strip');
  return { x: [a[0], b[0]], z: [a[2], b[2]], gate: [c(X(g[0]), 0, 0)[0], c(X(g[0] + g[2]), 0, 0)[0]], si: c(0, GH.si, 0)[1], top: c(0, GH.si + GH.gate, 0)[1] };
})();

export function create(canvas, host, on = {}) {
  return createLevel3D(canvas, host, on, (scene, root, P, night) => {
    /* the materials of the art direction's table */
    const SI = night ? 0x46536b : 0x8d99ab;
    const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
    const si = mat(SI, { roughness: 0.35, metalness: 0.3 });
    /* the source, the drain and the sheets start as the gate's plain silicon and change colour as they stand up, so
       they have materials of their own (a cached mat() is shared with other levels) */
    const own = () => new THREE.MeshStandardMaterial({ color: SI, roughness: 0.35, metalness: 0.3 });
    const doped = own(), sheetM = own();
    const DOPED = mix(SI, P.warm, 0.35), SHEET = new THREE.Color(night ? 0x7f93b3 : 0xa7b3c4), SIC = new THREE.Color(SI);
    const gateM = mat(P.accent, { roughness: 0.35, metalness: 0.6 });
    const skin = glass(night ? 0x5aa9e6 : 0x9fc4dc, { opacity: 0.55, depthWrite: false });
    const contact = mat(night ? 0xc9a14a : 0xe0b070, { roughness: 0.3, metalness: 0.9 });
    const ebox = new THREE.MeshStandardMaterial({ color: P.accent, emissive: P.accent, emissiveIntensity: night ? 1 : 0.6, roughness: 0.4 });

    /* each box keeps its built form (as made here) and gets a flat one (flat: { x: [a, b], y, z }, its extent in the
       gate's plan; none given: no height, at its built top) and the stretch of the stand-up in which it goes from one to the other */
    const forms = [];
    const B = (key, w, h, d, m, x, y, z, flat, win = [0, 1]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z);
      b.castShadow = b.receiveShadow = true; b.userData.part = key; root.add(b);
      forms.push({ b, w, h, d, x, y: y + h / 2, z, f: flat || { x: [x - w / 2, x + w / 2], y: [y + h, y + h], z: [z - d / 2, z + d / 2] }, win });
      return b;
    };
    const { x: DX, z: DZ, gate: [G0, G1], si: YS, top: YT } = PLAN;
    /* the silicon underneath, and an insulating layer that keeps the switch apart from its neighbours: no height in
       the plan, everything rides up on it */
    B(null, 9.4, 0.9, 4.4, si, 0, 0, -0.6, { x: DX, y: [0, 0], z: DZ }, [0, 0.5]);
    /* the whole switch is cut open along one plane at the front (z = CUT), so its cut face shows the sheets inside the
       gate, each in its skin; behind the cut it is whole */
    const CUT = 0.05, back = -1.65, depthZ = CUT - back, midZ = (back + CUT) / 2;
    /* source and drain: silicon grown with added atoms, on either side */
    /* in the plan: the silicon strip's two ends beside the gate strip */
    B('source', 2.2, 2.6, depthZ, doped, -3.3, 0.9, midZ, { x: [DX[0], G0], y: [0, YS], z: DZ }, [0, 0.6]);
    B('drain', 2.2, 2.6, depthZ, doped, 3.3, 0.9, midZ, { x: [G1, DX[1]], y: [0, YS], z: DZ }, [0, 0.6]);
    /* three sheets of silicon from source to drain: the channel. In the plan, the silicon under the gate strip cut in
       three slabs lying on each other; they thin and part */
    const SHEETS = [1.45, 2.1, 2.75];
    SHEETS.forEach((y, i) => B('channel', 4.4, 0.24, depthZ - 0.5, sheetM, 0, y, midZ + 0.25, { x: [G0, G1], y: [YS * i / 3, YS * (i + 1) / 3], z: DZ }, [0.2, 0.8]));
    /* the gate wraps round every sheet */
    const GX = 1.7, cut = CUT;
    /* drawn as slabs round the sheets, so the cut face shows each sheet in its skin */
    const gz = (cut - back), gzc = (back + cut) / 2;
    /* the gate's pieces below and between the sheets, and its back wall, have no height in the plan, at the strip's
       underside: the gate grows down between the sheets and closes behind them */
    const down = (x, z) => ({ x: [x - GX / 2, x + GX / 2], y: [YS, YS], z: [z - gz / 2, z + gz / 2] }), W2 = [0.3, 0.9];
    B('gate', GX, 0.25, gz, gateM, 0, 1.1, gzc, down(0, gzc), W2);                                   /* below the lowest sheet */
    for (let i = 0; i < SHEETS.length - 1; i++) B('gate', GX, SHEETS[i + 1] - SHEETS[i] - 0.36, gz, gateM, 0, SHEETS[i] + 0.3, gzc, down(0, gzc), W2);
    /* above the highest: in the plan, the whole gate strip; it narrows and comes down */
    B('gate', GX, 0.55, gz, gateM, 0, SHEETS[SHEETS.length - 1] + 0.3, gzc, { x: [G0, G1], y: [YS, YT], z: DZ }, [0, 0.6]);
    B('gate', GX, 2.25, 0.35, gateM, 0, 1.1, back - 0.17, { x: [-GX / 2, GX / 2], y: [YS, YS], z: [back - 0.35, back] }, W2);   /* the back wall */
    /* the skin: insulator between the gate and each sheet, a few atoms thick; it comes as the gate reaches each sheet */
    SHEETS.forEach(y => B('oxide', GX, 0.36, gz + 0.06, skin, 0, y - 0.06, gzc + 0.03, { x: [-GX / 2, GX / 2], y: [y + 0.12, y + 0.12], z: [cut - gz, cut + 0.06] }, [0.5, 0.9]));
    /* spacers keep the gate apart from source and drain */
    const spacer = mat(night ? 0x2a3854 : 0xc8d3e1, { roughness: 0.6 });
    [-1, 1].forEach(s => B(null, 0.35, 2.55, gz, spacer, s * (GX / 2 + 0.17), 1.1, gzc, null, [0.4, 0.8]));
    /* contacts: metal down to the source, the drain and the gate; they come down last */
    const W3 = [0.7, 1];
    B(null, 0.7, 1.6, 0.7, contact, -3.3, 3.5, midZ, null, W3); B(null, 0.7, 1.6, 0.7, contact, 3.3, 3.5, midZ, null, W3); B(null, 0.6, 1.4, 0.6, contact, 0, 3.4, midZ - 0.2, null, W3);

    /* the stand-up: stand 0 is the gate's plan in the door, 1 the switch as built; each box in its own stretch */
    let was = -1;
    const lerp = (a, b, t) => a + (b - a) * t;
    function stand(v) {
      if (v === was) return; was = v;
      for (const o of forms) {
        const t = smooth(o.win[0], o.win[1], v), f = o.f;
        const w = lerp(f.x[1] - f.x[0], o.w, t), h = lerp(f.y[1] - f.y[0], o.h, t), d = lerp(f.z[1] - f.z[0], o.d, t);
        o.b.visible = w > 0.005 && h > 0.005 && d > 0.005;
        o.b.scale.set(Math.max(w, 1e-4) / o.w, Math.max(h, 1e-4) / o.h, Math.max(d, 1e-4) / o.d);
        o.b.position.set(lerp((f.x[0] + f.x[1]) / 2, o.x, t), lerp((f.y[0] + f.y[1]) / 2, o.y, t), lerp((f.z[0] + f.z[1]) / 2, o.z, t));
        /* the plan casts no shadows (the gate's tiles do not), so the first frames match it */
        o.b.castShadow = v > 0.15;
      }
      doped.color.copy(SIC).lerp(DOPED, smooth(0.3, 0.8, v));
      sheetM.color.copy(SIC).lerp(SHEET, smooth(0.2, 0.8, v)); sheetM.roughness = lerp(0.35, 0.32, v); sheetM.metalness = lerp(0.3, 0.35, v);
    }

    /* electrons: carried from source to drain through the sheets while the switch is on */
    const eg = new THREE.SphereGeometry(0.09, 10, 8), electrons = [];
    for (let i = 0; i < 18; i++) { const e = new THREE.Mesh(eg, ebox); e.userData = { sheet: i % 3, u: (i * 0.37) % 1, z: CUT + 0.02 - ((i * 0.61) % 1) * 0.25 }; root.add(e); electrons.push(e); }

    /* camera: looking down about 25° from a little left of the front, so the cut face of the gate shows between the
       source and the drain (the stack's -35° would hide it behind the source) */
    return {
      level: 'switch', parts: ['gate', 'channel', 'oxide', 'source', 'drain'],
      anchors: { gate: [0, 3.65, -0.9], channel: [1.75, 2.99, 0.05], oxide: [-0.55, 1.5, 0.08], source: [-3.9, 3.5, 0.05], drain: [3.9, 3.5, 0.05] },
      /* foot: where the switch stands on the gate's door, the middle of its base slab's underside */
      /* enter: the stretch of a join over which it stands up */
      view: { tilt: 0.44, turn: -0.32, r: R, at: [0, 2.1, -0.4], foot: FOOT, enter: [0.25, 0.85] },
      /* arrived: how far it has stood up (1 at rest). Electrons only flow once you are at the switch */
      update(dt, k, dist, arrived = 1) {
        stand(arrived);
        electrons.forEach(e => { const d = e.userData; d.u = (d.u + dt * 0.22) % 1; e.position.set(-2.2 + d.u * 4.4, SHEETS[d.sheet] + 0.12, d.z); e.visible = k > 0.6 && arrived >= 0.9; });
      }
    };
  });
}
