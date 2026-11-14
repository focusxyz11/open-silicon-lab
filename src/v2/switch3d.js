/* The switch in 3D: the first level of the zoom drawn on the one stage (docs/reviews/art-direction.md, "Switch: 3D").
   One transistor, cut open at the front: current runs from the source to the drain through three thin sheets of
   silicon, the gate wraps all the way round each sheet with a skin of insulator between, and the gate touches nothing
   it controls. That cannot be seen in a cross-section, so here 3D is the explanation, not a style.

   It lives inside the flat dive (src/app/world.js): as the zoom reaches the switch, the flat picture fades and this
   one takes its place on the same square, at the same size, so the zoom stays one movement. The flat drawing stays as
   the fallback. Materials and light are the shared ones (kit3d.js; the art direction's table): silicon blue-grey,
   doped silicon warmer, the gate in the accent, insulator as glass, contacts in contact metal, electrons glowing.
   Words are never drawn into the scene: the names are HTML over projected points, as everywhere.

   What it shares with the other levels in 3D (the camera, names, notes, marks, turning) is in level3d.js.
   create(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat, glass } from './kit3d.js';
import { createLevel3D } from './level3d.js';

export function create(canvas, host, on = {}) {
  return createLevel3D(canvas, host, on, (scene, root, P, night) => {
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

    const B = (key, w, h, d, m, x, y, z) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z);
      b.castShadow = b.receiveShadow = true; b.userData.part = key; root.add(b); return b;
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

    /* camera: looking down about 25° from a little left of the front, so the cut face of the gate shows between the
       source and the drain (the stack's -35° would hide it behind the source) */
    return {
      level: 'switch', parts: ['gate', 'channel', 'oxide', 'source', 'drain'],
      anchors: { gate: [0, 3.65, -0.9], channel: [1.75, 2.99, 0.05], oxide: [-0.55, 1.5, 0.08], source: [-3.9, 3.5, 0.05], drain: [3.9, 3.5, 0.05] },
      /* foot: where the switch stands on the gate's door, the middle of its base slab's underside */
      view: { tilt: 0.44, turn: -0.32, r: 4.1, at: [0, 2.1, -0.4], foot: [0, 0, -0.6] },
      /* electrons only flow once you are at the switch */
      update(dt, k) { electrons.forEach(e => { const d = e.userData; d.u = (d.u + dt * 0.22) % 1; e.position.set(-2.2 + d.u * 4.4, SHEETS[d.sheet] + 0.12, d.z); e.visible = k > 0.6; }); }
    };
  });
}
