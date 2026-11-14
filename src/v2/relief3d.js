/* A chip as a relief on the one stage (docs/reviews/art-direction.md, "Data-centre chip" and "Phone chip, car chip,
   die"): one drawing, four sets of data. A chip is a town of districts: compute blocks that are alike, memory that
   looks different (a low, regular field of bits), a ring of pads at the edge, and wires that reach every block. So the
   die is a slab and its districts stand a little proud of it, read straight from above and never turned: at this level
   direction means nothing, and a tilted floorplan is harder to read than a straight one. Drawing the data centre's
   chip, the phone's, the car's and the die on the wafer alike is itself the lesson.

   The districts are the flat scenes' parts (src/app/scenes.js: partsOf), so the plan is written once; your chip's
   cores, clock and timing come from there too (chipNow). Coming down from the board (the data centre's flight, which
   ends over the bare die), the camera rises from the flight's angle to the plan's and turns square to it.
   create(level)(canvas, host, on) -> the level (level3d.js). */
import * as THREE from '../vendor/three.min.js';
import { mat, box } from './kit3d.js';
import { createLevel3D } from './level3d.js';
import { partsOf, chipNow } from '../app/scenes.js';

const X = x => (x - 500) / 100, Z = y => (y - 500) / 100;
const rnd = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
/* split a rectangle into n across (and m down), with a gap */
const split = (r, n, m = 1, g = 8) => { const out = [], w = (r[2] - g * (n + 1)) / n, h = (r[3] - g * (m + 1)) / m; for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) out.push([r[0] + g + i * (w + g), r[1] + g + j * (h + g), w, h]); return out; };
const R = p => p.r;

/* each chip: its slab, its pads, and its districts by kind; names point where the flat level put them */
const PLANS = {
  chip: { slab: [40, 40, 920, 920], pads: 22, arrive: true,
    districts: P => [['cores', 'core', P.cores.map(R)], ['cache', 'memory', split(P.cache[0].r, 6), [7, 5]], ['io', 'row', split(P.io[0].r, 8)]],
    wires: P => P.clock.map(c => c.p), wiresPart: 'clock' },
  soc: { slab: [40, 40, 920, 920], pads: 24,
    districts: P => [['cpu', 'core', P.cpu.map(R)], ['gpu', 'units', [P.gpu[0].r], [6, 4]], ['npu', 'array', [P.npu[0].r], [10, 8]], ['isp', 'stages', [P.isp[0].r], [5, 1]], ['cache', 'memory', split(P.cache[0].r, 8), [4, 7]]],
    wires: () => [[[130, 408], [480, 408]], [[480, 130], [480, 728]], [[480, 425], [870, 425]]] },
  mcu: { slab: [40, 40, 920, 920], pads: 14,
    districts: P => [['cores', 'core', P.cores.map(R)], ['flash', 'memory', [P.flash[0].r], [16, 18]], ['sram', 'memory', [P.sram[0].r], [15, 5]], ['periph', 'blocks', P.periph.map(R)], [null, 'blocks', [[130, 750, 740, 120]]]],
    wires: () => [[[130, 570], [870, 570]]] },
  die: { slab: [30, 30, 940, 940], pads: 22, scribe: true, probes: true,
    districts: P => [['cores', 'core', P.cores.map(R)], [null, 'memory', split([130, 620, 740, 100], 6), [7, 5]], [null, 'row', split([130, 740, 740, 90], 8)]],
    wires: () => [[[500, 136], [500, 594]], [[315, 365], [685, 365]], [[315, 208], [315, 522]], [[685, 208], [685, 522]]] }
};
const NAMES = {
  chip: { cores: [175, 165], cache: [185, 650], io: [175, 770], clock: [500, 250] },
  soc: { isp: [180, 170], gpu: [560, 170], npu: [560, 480], cpu: [190, 470], cache: [190, 780] },
  mcu: { cores: [180, 170], flash: [560, 170], sram: [190, 450], periph: [200, 620] },
  die: { cores: [175, 165], pads: [330, 68], probes: [68, 300], scribe: [860, 15] }
};
/* heights, three times the review's table (step 4: lower, a relief reads as a flat drawing) */
const H = { slab: 0.25, core: 0.2, logic: 0.12, field: 0.07, bit: 0.05, row: 0.14, unit: 0.16, wire: 0.05, pad: 0.1 };

export const create = level => (canvas, host, on = {}) => createLevel3D(canvas, host, on, (scene, root, P, night) => {
  const plan = PLANS[level], parts = partsOf(level), C = () => chipNow();
  const col = (n, d) => (night ? n : d);
  const M = {
    slab: mat(col(0x1f2a3e, 0x7f8da2), { roughness: 0.5, metalness: 0.3 }),
    tile: mat(0xffffff, { roughness: 0.45, metalness: 0.15 }),
    field: mat(col(0x222e47, 0xaebdd0), { roughness: 0.5 }),
    bit: mat(col(0x56709a, 0x6a809f), { roughness: 0.4, metalness: 0.2 }),
    cu: mat(col(0xc77b45, 0xb5683a), { roughness: 0.3, metalness: 0.85 }),
    pad: mat(col(0xc9a14a, 0xe0b070), { roughness: 0.3, metalness: 0.9 }),
    live: new THREE.MeshStandardMaterial({ color: P.warm, emissive: P.warm, emissiveIntensity: night ? 1 : 0.5, roughness: 0.4 })
  };
  /* a block at work is live, so it warms (blue is a material here: the switch's gate); late is wrong, so red */
  const TONE = { tile: new THREE.Color(col(0x2f3d58, 0xc9d4e2)), top: new THREE.Color(col(0x3d4f70, 0xe8edf4)), idle: new THREE.Color(col(0x1c2638, 0xa9b6c8)), late: new THREE.Color(P.bad) };
  TONE.busy = TONE.top.clone().lerp(new THREE.Color(P.warm), night ? 0.5 : 0.6);
  const unit = new THREE.BoxGeometry(1, 1, 1);
  /* many boxes of one kind in one draw: [x, y, w, h] in the plan, from height y0, h tall */
  const many = (rects, y0, h, m, part, tone) => {
    const mesh = new THREE.InstancedMesh(unit, m, rects.length), o = new THREE.Object3D();
    rects.forEach((r, i) => { o.position.set(X(r[0] + r[2] / 2), y0 + h / 2, Z(r[1] + r[3] / 2)); o.scale.set(r[2] / 100, h, r[3] / 100); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); if (tone) mesh.setColorAt(i, tone); });
    mesh.userData.part = part || null; mesh.castShadow = mesh.receiveShadow = false; root.add(mesh); return mesh;
  };

  /* the die, and the ring of pads at its edge */
  const s = plan.slab; box(root, s[2] / 100, H.slab, s[3] / 100, M.slab, X(s[0] + s[2] / 2), -H.slab, Z(s[1] + s[3] / 2), 0.04, { cast: false, receive: false });
  const pads = [], step = 836 / plan.pads;
  for (let i = 0; i < plan.pads; i++) { const t = 82 + i * step + step * 0.2, w = step * 0.6; pads.push([t, 56, w, 24], [t, 920, w, 24], [56, t, 24, w], [920, t, 24, w]); }
  many(pads, 0, H.pad, M.pad, level === 'die' ? 'pads' : null);

  /* the districts, each kind with its own look */
  const live = {};
  plan.districts(parts).forEach(([part, kind, rects, grid]) => {
    if (kind === 'core') {
      /* alike: a block, its logic standing on it, its own small memory beside it; lit while it works */
      many(rects, 0, H.core, M.tile, part, TONE.tile);
      const logic = rects.map(r => { const m = Math.min(r[2], r[3]) * 0.08; return [r[0] + m, r[1] + m, r[2] * 0.52, r[3] * 0.5]; });
      live.cores = many(logic, H.core, H.logic, M.tile, part, TONE.top); live.n = rects.length;
      many(rects.map(r => [r[0] + r[2] * 0.6, r[1] + r[3] * 0.1, r[2] * 0.32, r[3] * 0.8]), H.core, H.bit, M.bit, part);
    } else if (kind === 'memory') {
      /* different: a low field of bits in a perfect grid */
      many(rects, 0, H.field, M.field, part);
      const [nx, ny] = grid, bits = [];
      rects.forEach(r => { const w = r[2] / nx, h = r[3] / ny; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) bits.push([r[0] + i * w + w * 0.18, r[1] + j * h + h * 0.18, w * 0.64, h * 0.64]); });
      many(bits, H.field, H.bit, M.bit, part);
    } else if (kind === 'row') many(rects, 0, H.row, M.tile, part, TONE.tile);
    else if (kind === 'units' || kind === 'array' || kind === 'stages') {
      /* many identical units on one base (graphics, the AI unit's multipliers, the camera's pipeline) */
      many(rects, 0, H.field, M.field, part);
      const [nx, ny] = grid, r = rects[0], u = split(kind === 'array' ? [r[0], r[1], r[2] - 70, r[3]] : r, nx, ny, kind === 'array' ? 6 : 12);
      live[kind] = many(u, H.field, kind === 'stages' ? H.unit * 1.4 : kind === 'array' ? H.bit * 1.6 : H.unit, M.tile, part, TONE.tile); live[kind + 'N'] = u.length; live[kind + 'G'] = grid;
      if (kind === 'array') { const side = [r[0] + r[2] - 58, r[1] + 16, 46, r[3] - 32], bits = []; for (let j = 0; j < 14; j++) for (let i = 0; i < 3; i++) bits.push([side[0] + i * 15 + 2, side[1] + j * (side[3] / 14) + 2, 11, side[3] / 14 - 4]); many(bits, H.field, H.bit, M.bit, part); }
    } else if (kind === 'blocks') {
      many(rects, 0, H.field, M.field, part);
      const sub = []; rects.forEach((r, n) => split(r, 3 + (n % 2), 2, 10).forEach((q, j) => { if (rnd(n * 7 + j, 3) > 0.25) sub.push(q); }));
      live.blocks = many(sub, H.field, H.row * 0.7, M.tile, part, TONE.tile); live.blocksN = sub.length;
    }
  });

  /* the wires that reach every block (the clock, or the roads between districts), in copper, with what travels on them */
  const lines = plan.wires(parts), WY = H.core + H.logic + 0.02, strips = [];
  lines.forEach(p => { for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i]; strips.push([Math.min(a[0], b[0]) - 5, Math.min(a[1], b[1]) - 5, Math.abs(b[0] - a[0]) + 10, Math.abs(b[1] - a[1]) + 10]); } });
  many(strips, WY, H.wire, M.cu, plan.wiresPart || null);
  const pulses = many(lines.map(() => [0, 0, 14, 14]), WY + H.wire, 0.07, M.live, plan.wiresPart || null);

  /* the die on the wafer: the cutting line round it, with the factory's test patterns, and needles on its pads */
  let probes = null;
  if (plan.scribe) { const ring = []; for (let i = 0; i < 16; i++) ring.push([44 + i * 60, 9, 22, 12], [44 + i * 60, 979, 22, 12], [9, 44 + i * 60, 12, 22], [979, 44 + i * 60, 12, 22]); many(ring, -H.slab, 0.08, M.field, 'scribe'); }
  if (plan.probes) {
    const tips = []; [200, 440, 680].forEach(y => tips.push([68, y], [932, y + 120])); [260, 500, 740].forEach(x => tips.push([x, 68], [x + 160, 932]));
    const needle = new THREE.CylinderGeometry(0.012, 0.03, 1, 6), nm = mat(col(0xb8c0cc, 0x8c96a3), { roughness: 0.25, metalness: 0.85 });
    probes = tips.map(([x, y], i) => {
      const from = new THREE.Vector3(X(x) * 1.25, 1.6, Z(y) * 1.25), to = new THREE.Vector3(X(x), H.pad, Z(y)), d = to.clone().sub(from), n = new THREE.Mesh(needle, nm);
      n.position.copy(from).add(to).multiplyScalar(0.5); n.scale.y = d.length(); n.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); n.userData.part = 'probes'; root.add(n);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M.live); tip.position.copy(to); tip.userData.part = 'probes'; root.add(tip); return tip;
    });
  }

  let t = 0, tick = -1;
  const anchors = {}; Object.entries(NAMES[level]).forEach(([k, p]) => { anchors[k] = [X(p[0]), k === 'clock' ? WY + H.wire : k === 'scribe' ? 0 : k === 'probes' ? 0.6 : H.core + H.logic, Z(p[1])]; });
  return {
    level, parts: Object.keys(NAMES[level]), anchors,
    /* read from straight above, nearly: 72°, never turned */
    view: { tilt: 1.26, turn: 0, r: 5.6, at: [0, 0.1, 0.25], fixed: true, arrive: plan.arrive ? { tilt: 0.5, turn: -0.62, ms: 1800 } : null },
    update(dt, k) {
      t += dt;
      const c = C(), now = Math.floor(t * 1.5 * (c.clock || 1));
      /* the clock's beat (or the data) travelling along each wire */
      const o = new THREE.Object3D();
      lines.forEach((p, i) => { const u = (t * 0.6 * (c.clock || 1) + i * 0.25) % 1, n = p.length - 1, seg = Math.min(n - 1, Math.floor(u * n)), f = u * n - seg, a = p[seg], b = p[seg + 1]; o.position.set(X(a[0] + (b[0] - a[0]) * f), WY + H.wire + 0.035, Z(a[1] + (b[1] - a[1]) * f)); o.scale.set(0.14, 0.07, 0.14); o.updateMatrix(); pulses.setMatrixAt(i, o.matrix); });
      pulses.instanceMatrix.needsUpdate = true;
      if (now === tick) return; tick = now;
      /* each beat: a core waiting for memory stands dark, a working one lights, one whose signal came late turns red */
      if (live.cores) { for (let i = 0; i < live.n; i++) live.cores.setColorAt(i, rnd(i + 50, now) < (c.late || 0) ? TONE.late : rnd(i + 90, now) > (c.busy == null ? 1 : c.busy) ? TONE.idle : rnd(i, now) > 0.55 ? TONE.busy : TONE.top); live.cores.instanceColor.needsUpdate = true; }
      if (live.units) { for (let i = 0; i < live.unitsN; i++) live.units.setColorAt(i, rnd(i, now) > 0.6 ? TONE.busy : TONE.tile); live.units.instanceColor.needsUpdate = true; }
      if (live.array) { const [nx] = live.arrayG, col0 = now % nx; for (let i = 0; i < live.arrayN; i++) live.array.setColorAt(i, i % nx === col0 ? TONE.busy : TONE.tile); live.array.instanceColor.needsUpdate = true; }
      if (live.stages) { for (let i = 0; i < live.stagesN; i++) live.stages.setColorAt(i, i === now % live.stagesN ? TONE.busy : TONE.tile); live.stages.instanceColor.needsUpdate = true; }
      if (live.blocks) { for (let i = 0; i < live.blocksN; i++) live.blocks.setColorAt(i, rnd(i, now) > 0.7 ? TONE.busy : TONE.tile); live.blocks.instanceColor.needsUpdate = true; }
      if (probes) probes.forEach((p, i) => { p.visible = rnd(i, now) > 0.45; });
    }
  };
});
