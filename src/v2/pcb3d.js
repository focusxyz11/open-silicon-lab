/* A phone's board and a car's control unit in 3D (docs/reviews/art-direction.md, "Phone board" and "Car controller"):
   the same kind of thing as the data centre's board, smaller, so they are built from the same table of board
   materials (kit3d.js BOARD) and the same kinds of part, which makes "a board is a board" (docs/FRAME.md) true to the
   eye. A phone's board: one chip everything else serves, with its memory stacked on it, a power chip with its coils,
   a modem under its shield with its radios, storage, sockets for ribbons, and tiny parts everywhere. A control unit:
   one small chip that decides and big parts that switch real power, on a board in a sealed metal case whose lid lifts
   as you arrive from the car.

   Laid out as the flat levels are (src/app/scenes.js, phoneboard and ecu), one unit per hundred of their 1000 x 1000.
   create(level)(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat, box, BOARD } from './kit3d.js';
import { createLevel3D } from './level3d.js';
import { chipNow } from '../app/scenes.js';

const X = x => (x - 500) / 100, Z = y => (y - 500) / 100;
const rnd = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

export const create = level => (canvas, host, on = {}) => createLevel3D(canvas, host, on, (scene, root, P, night) => {
  const K = BOARD(night), col = (n, d) => (night ? n : d);
  const M = {
    board: mat(K.board, { roughness: 0.7 }), trace: mat(K.trace, { roughness: 0.35, metalness: 0.8 }), pin: mat(K.pin, { roughness: 0.3, metalness: 0.9 }),
    plastic: mat(K.plastic, { roughness: 0.5 }), power: mat(K.power, { roughness: 0.4 }), coil: mat(K.coil, { roughness: 0.3, metalness: 0.7 }),
    substrate: mat(K.substrate, { roughness: 0.6 }), lid: mat(K.lid, { roughness: 0.25, metalness: 0.85 }),
    caseM: mat(col(0x6c7684, 0xaab3bf), { roughness: 0.35, metalness: 0.75 }), body: mat(col(0x3a4250, 0xc9c2b4), { roughness: 0.6 }),
    live: new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: night ? 1 : 0.5, roughness: 0.4 })
  };
  /* a part: [x, y, w, h] of the plan, from height y0, h tall */
  const part = (key, r, y0, h, m, rad = 0.03) => { const b = box(root, r[2] / 100, h, r[3] / 100, m, X(r[0] + r[2] / 2), y0, Z(r[1] + r[3] / 2), rad, { cast: false, receive: false }); b.userData.part = key || null; return b; };
  const unit = new THREE.BoxGeometry(1, 1, 1), o = new THREE.Object3D();
  const many = (rects, y0, h, m) => { const mesh = new THREE.InstancedMesh(unit, m, rects.length); rects.forEach((r, i) => { o.position.set(X(r[0] + r[2] / 2), y0 + h / 2, Z(r[1] + r[3] / 2)); o.scale.set(r[2] / 100, h, r[3] / 100); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); }); root.add(mesh); return mesh; };
  const cyl = (key, x, y, r, y0, h, m) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r / 100, r / 100, h, 20), m); c.position.set(X(x), y0 + h / 2, Z(y)); c.userData.part = key || null; root.add(c); return c; };
  /* a trace that goes somewhere: along the plan's points, flat on the board */
  const traces = [], trace = pts => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; traces.push([Math.min(a[0], b[0]) - 3, Math.min(a[1], b[1]) - 3, Math.abs(b[0] - a[0]) + 6, Math.abs(b[1] - a[1]) + 6]); } return pts; };
  const T = 0.16, paths = [];
  let lid = null, drivers = [], heat = null;

  if (level === 'phoneboard') {
    /* the board, shaped to fit round the battery */
    const outline = [[60, 100], [940, 100], [940, 640], [860, 640], [860, 900], [60, 900]].map(p => new THREE.Vector2(X(p[0]), -Z(p[1])));
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(outline), { depth: T, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -T, 0);
    const pcb = new THREE.Mesh(g, M.board); pcb.userData.part = null; root.add(pcb);
    /* traces from the chip to the storage, the modem and the power chip */
    paths.push(trace([[410, 420], [300, 420], [300, 310]]), trace([[650, 420], [770, 420], [770, 330]]), trace([[480, 600], [480, 690], [370, 690]]), trace([[530, 600], [530, 740], [370, 740]]));
    /* the storage chip */
    part('storage', [150, 170, 200, 140], 0, 0.16, M.plastic);
    /* the power chip, its coils and its capacitors */
    part('pmic', [150, 620, 160, 140], 0, 0.14, M.plastic);
    for (let i = 0; i < 3; i++) cyl('pmic', 350, 640 + i * 48, 18, 0, 0.22, M.coil);
    many([0, 1, 2, 3, 4].map(i => [156 + i * 31, 772, 24, 14]), 0, 0.08, M.body);
    /* the modem under its shield (an open can, so you see in), its radio parts, the line out to the antenna */
    part('modem', [680, 180, 180, 150], 0, 0.14, M.plastic);
    [[668, 106, 204, 6], [668, 336, 204, 6], [668, 106, 6, 236], [866, 106, 6, 236]].forEach(r => part(null, r, 0, 0.3, M.lid, 0.005));
    many([0, 1, 2].map(i => [690 + i * 58, 116, 44, 40]), 0, 0.1, M.plastic);
    paths.push(trace([[860, 220], [940, 220]]));
    /* sockets where ribbons plug in, with their pins */
    const sockets = [[700, 720, 140, 50], [92, 380, 40, 170], [520, 818, 180, 44]];
    sockets.forEach(r => part(null, r, 0, 0.12, M.plastic, 0.01));
    const pins = []; for (let i = 0; i < 12; i++) pins.push([706 + i * 11, 726, 4, 38]); for (let i = 0; i < 14; i++) pins.push([98, 386 + i * 11.6, 28, 4]); for (let i = 0; i < 15; i++) pins.push([526 + i * 11.6, 824, 4, 32]);
    many(pins, 0.12, 0.015, M.pin);
    /* tiny resistors and capacitors everywhere (not under the chip, not where the battery sits) */
    const passives = []; for (let i = 0; i < 90; i++) { const x = 90 + rnd(i, 11) * 820, y = 130 + rnd(i, 12) * 740; if (!(x > 380 && x < 680 && y > 330 && y < 630) && !(x > 835 && y > 615)) passives.push([x, y, i % 3 ? 14 : 22, i % 3 ? 8 : 12]); }
    many(passives, 0, 0.05, M.body);
    /* the phone's chip: on its substrate, the processor, and the memory stacked on top of it; it warms with your chip */
    part('soc', [402, 352, 256, 256], 0, 0.08, M.substrate);
    part('soc', [420, 370, 220, 220], 0.08, 0.1, mat(col(0x1d2433, 0x2a3142), { roughness: 0.3, metalness: 0.5 }));
    part('soc', [430, 380, 200, 200], 0.18, 0.16, M.plastic);
    heat = part(null, [396, 346, 268, 268], -0.005, 0.02, new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: 0, transparent: true, opacity: 0, depthWrite: false }), 0.01);
    [[90, 130], [910, 130], [90, 870]].forEach(([x, y]) => cyl(null, x, y, 12, 0, 0.02, M.pin));
  } else {
    /* the control unit: a sealed metal case with ears to bolt it down and a plug for the car's wires; a board inside */
    part(null, [60, 120, 880, 760], -0.5, 0.08, M.caseM, 0.02);
    [[60, 120, 880, 14], [60, 866, 880, 14], [60, 120, 14, 760], [926, 120, 14, 760]].forEach(r => part(null, r, -0.5, 0.75, M.caseM, 0.01));
    [[140, 80], [780, 80], [140, 880], [780, 880]].forEach(([x, y]) => part(null, [x, y, 80, 40], -0.5, 0.06, M.caseM, 0.01));
    part(null, [34, 226, 28, 548], -0.5, 0.75, M.caseM, 0.01);
    part(null, [100, 160, 800, 680], -T, T, M.board, 0.01);
    /* the connector to the car's wires, two rows of pins */
    part('connector', [120, 190, 90, 620], 0, 0.34, M.plastic, 0.02);
    const cp = []; for (let i = 0; i < 26; i++) cp.push([142, 206 + i * 23, 12, 12], [176, 206 + i * 23, 12, 12]); many(cp, 0.34, 0.03, M.pin);
    /* traces from the connector to the chip, and from the chip to the drivers; thick copper for power */
    for (let i = 0; i < 6; i++) paths.push(trace([[210, 300 + i * 60], [300 + i * 14, 300 + i * 60], [300 + i * 14, 410 + i * 14], [425, 410 + i * 14]]));
    [0, 1, 2, 3].forEach(i => paths.push(trace([[525, 410 + i * 24], [600, 410 + i * 24], [600, 250 + i * 110], [660, 250 + i * 110]])));
    trace([[210, 760], [270, 760]]); trace([[330, 760], [430, 760], [430, 730]]); trace([[475, 640], [475, 495]]);
    /* the microcontroller: a package with legs, the one that decides */
    part('mcu', [425, 395, 100, 100], 0, 0.14, M.plastic, 0.01);
    const legs = []; for (let i = 0; i < 9; i++) legs.push([430 + i * 10.5, 387, 5, 8], [430 + i * 10.5, 495, 5, 8], [417, 400 + i * 10.5, 8, 5], [525, 400 + i * 10.5, 8, 5]); many(legs, 0, 0.04, M.pin);
    /* power in: big capacitors and a coil; a crystal, a transceiver, a watchdog */
    [[300, 230], [300, 760], [560, 770], [800, 770]].forEach(([x, y]) => cyl(null, x, y, 30, 0, 0.5, M.coil));
    part(null, [430, 640, 90, 90], 0, 0.3, M.power, 0.04);
    part(null, [555, 330, 50, 24], 0, 0.1, M.coil, 0.01); part(null, [290, 580, 70, 56], 0, 0.1, M.plastic, 0.01); part(null, [540, 548, 46, 46], 0, 0.1, M.plastic, 0.01);
    /* the drivers: power parts that switch real current, on a metal strip that takes their heat; each glows as it works */
    part(null, [790, 190, 60, 470], 0, 0.36, M.caseM, 0.01);
    drivers = [0, 1, 2, 3].map(i => { const r = [660, 210 + i * 110, 110, 80]; part('drivers', r, 0, 0.22, M.power, 0.02); const m = new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: 0.3, roughness: 0.4 }); return part('drivers', [r[0] + 14, r[1] + 14, r[2] - 28, r[3] - 28], 0.22, 0.02, m, 0.005); });
    /* the lid: on as you arrive from the car, then it lifts away */
    lid = part(null, [60, 120, 880, 760], 0.25, 0.08, mat(col(0x6c7684, 0xaab3bf), { roughness: 0.35, metalness: 0.75, transparent: true, opacity: 1 }), 0.02);
  }
  if (traces.length) many(traces, 0, 0.012, M.trace);
  /* signals on their way along the traces */
  const pulses = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.05, 0.1), M.live, Math.max(1, paths.length)); pulses.count = paths.length; root.add(pulses);
  root.traverse(m => { m.castShadow = m.receiveShadow = false; });

  const NAMES = level === 'phoneboard' ? { soc: [430, 380, 0.4], pmic: [170, 640, 0.2], modem: [700, 200, 0.2], storage: [170, 190, 0.2] } : { mcu: [445, 410, 0.2], connector: [150, 210, 0.4], drivers: [690, 230, 0.3] };
  const anchors = {}; Object.entries(NAMES).forEach(([k, p]) => { anchors[k] = [X(p[0]), p[2], Z(p[1])]; });
  let t = 0;
  return {
    level, parts: Object.keys(NAMES), anchors,
    /* a hero object: seen at an angle, turned like the stack, turnable and swaying; the control unit opens on arrival */
    view: { tilt: 0.62, turn: -0.62, r: 5.2, at: [0, 0, 0.1], arrive: level === 'ecu' ? { tilt: 0.8, turn: -0.45, ms: 1600 } : null },
    update(dt, k, dist, arrived) {
      t += dt;
      if (lid) { lid.visible = arrived < 1; lid.position.y = 0.25 + 0.04 + arrived * 2.6; lid.material.opacity = Math.max(0, 1 - arrived * 1.4); }
      drivers.forEach((d, i) => { d.material.emissiveIntensity = (night ? 0.5 : 0.25) * (0.5 + 0.5 * Math.sin(t * 2 + i)); });
      if (heat) { const c = chipNow(), h = Math.max(0, Math.min(1, ((c.power || 1) - 0.6) / 3)); heat.material.opacity = 0.15 + 0.5 * h; heat.material.emissiveIntensity = night ? 0.8 : 0.4; }
      paths.forEach((p, i) => { const u = (t * 0.4 + i * 0.23) % 1, n = p.length - 1, s = Math.min(n - 1, Math.floor(u * n)), f = u * n - s, a = p[s], b = p[s + 1]; o.position.set(X(a[0] + (b[0] - a[0]) * f), 0.04, Z(a[1] + (b[1] - a[1]) * f)); o.scale.set(1, 1, 1); o.updateMatrix(); pulses.setMatrixAt(i, o.matrix); });
      pulses.instanceMatrix.needsUpdate = true;
    }
  };
});
