/* A phone, as one continuous flight (as the data centre is, src/v2/dc3d.js): from the phone lying on a desk, its
   screen opened like a book as a repairer opens it, into the frame where the battery fills most of the space and the
   computer is one small board, down onto that board as its metal shields lift away, and onto the phone's chip as the
   memory stacked on top of it lifts off and its package clears, to the die. One scene at true scale, in metres, with
   the phone at the origin; the camera moves along a single path (depth z from 0 to 3, one step per level), and
   everything that opens (the screen, the shields, the memory, the chip's package) opens as a function of z, so
   nothing appears from nowhere. The die is drawn from the plan the dive's phone chip has (src/app/scenes.js, the
   districts of 'soc', in the tones of CHIP_TONES), so the chip you land on is the chip you saw; HANDOFF tells the dive
   where the flight ended (src/v2/relief3d.js). Words: place.phone.<level>.t / .d; the parts' names come from their one
   home in the atlas (VIEW_PARTS.phone in src/data/atlas.js). */
import { VIEW_PARTS } from '../data/atlas.js';
import { THREE, PALETTES, CHIP_TONES, BOARD, theme, stage, light, mat, metal, box, cyl, group, labels, clamp, smooth, ease, reduced, rnd } from './kit3d.js';
import { padsOf, tileOf, split, bitsOf } from '../data/die.js';
import { partsOf } from '../app/scenes.js';
import { DEPTHS } from '../data/weave.js';
import { t } from '../core/i18n.js';

export const LEVELS = ['phone', 'inside', 'board', 'chip'];
/* the question asked at each level: a stop of one thread (stop.<key>.q) */
export const ASKS = { phone: 'life.phone', inside: 'know.phone', board: 'fail.phoneboard', chip: 'think.soc' };
/* the depth of the dive each level shows (its card's Do and Ask), and where the flight carries on: the dive's phone chip */
export const DEPTH = { phone: 'phone', inside: 'phone', board: 'phoneboard', chip: 'soc' };
export const BEYOND = '#/dive/soc/phone';

/* the phone, in metres: across, long, thick, the corners' radius; the board's top; the chip's middle on it */
const PW = 0.0716, PL = 0.1476, PT = 0.0078, PR = 0.0095, BY = 0.0022, SOC = [0.0115, -0.044];
/* the die's plan (1000 units a side, as the dive's levels have it) in metres, at the dive's own scale */
const UNIT = DEPTHS.soc.m / 1000;
const onDie = (x, y, h) => [SOC[0] + (x - 500) * UNIT, h, SOC[1] + (y - 500) * UNIT];
/* where the camera looks at each level: the point, the distance to it, the turn and the tilt */
const KEYS = [
  { look: [0.012, 0.004, 0.004], dist: 0.4, yaw: -0.5, pitch: 0.88 },
  { look: [0.016, 0.012, -0.006], dist: 0.27, yaw: -0.36, pitch: 0.82 },
  { look: [0.0125, BY, -0.045], dist: 0.078, yaw: -0.24, pitch: 1.04 },
  { look: [SOC[0], BY + 0.0008, SOC[1]], dist: 0.025, yaw: -0.1, pitch: 1.2 }
];
const FOV = 38, FIT = 0.95, END = KEYS.length - 1;
/* how wide a screen each level needs, as a share of its height, before the camera stands back */
const WIDE = [0.62, 1.15, 0.8, FIT];
/* where the flight ends, for the dive's phone chip to start from (src/v2/relief3d.js): the camera's turn and tilt, the
   point of the plan it looks at, how much of the plan's units it sees from top to bottom, and how wide a screen must be */
export const HANDOFF = { turn: KEYS[END].yaw, tilt: KEYS[END].pitch, at: [500, 500], span: 2 * KEYS[END].dist * Math.tan(FOV * Math.PI / 360) / UNIT, fit: FIT };

/* a rounded rectangle, w across and l long, centred (a shape, or a hole in one) */
function rr(w, l, r, s = new THREE.Shape()) {
  const x = -w / 2, y = -l / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + l - r); s.absarc(x + w - r, y + l - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + l); s.absarc(x + r, y + l - r, r, Math.PI / 2, Math.PI); s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}
/* a flat piece cut from that shape, h thick, standing on height y, its edges rounded by bv */
function slab(parent, shape, h, material, y = 0, bv = 0) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(1e-6, h - 2 * bv), bevelEnabled: bv > 0, bevelSize: bv, bevelThickness: bv, bevelSegments: 2, curveSegments: 12 });
  g.rotateX(-Math.PI / 2); g.translate(0, y + bv, 0);
  const m = new THREE.Mesh(g, material); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}

/* the screen as it is lit: a wallpaper, rows of apps, the dock. No words */
function screenTexture(night) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1056; const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 360, 1056); bg.addColorStop(0, night ? '#14223f' : '#8fb4dc'); bg.addColorStop(0.55, night ? '#26305a' : '#a9b9e2'); bg.addColorStop(1, night ? '#3a2b55' : '#c3b3df');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 1056);
  const rnd2 = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); };
  const tones = night ? ['rgba(255,255,255,.16)', 'rgba(120,170,255,.32)', 'rgba(255,190,110,.28)', 'rgba(110,220,170,.26)'] : ['rgba(255,255,255,.5)', 'rgba(47,125,225,.45)', 'rgba(240,163,58,.5)', 'rgba(47,163,107,.45)'];
  for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) { g.fillStyle = tones[Math.floor(rnd(i + j * 4, 3) * 4)]; rnd2(52 + i * 108, 150 + j * 128, 84, 84, 20); }
  g.fillStyle = night ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.35)'; rnd2(30, 920, 452, 112, 34);
  for (let i = 0; i < 4; i++) { g.fillStyle = tones[(i + 1) % 4]; rnd2(56 + i * 108, 934, 84, 84, 20); }
  g.fillStyle = '#05070b'; rnd2(196, 30, 120, 34, 17);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}
/* the die, as the dive's phone chip has it (src/app/scenes.js 'soc', drawn in 3D by src/v2/relief3d.js), from above:
   the general cores, the graphics, the AI unit, the camera's pipeline, the shared memory, and the roads between them */
function dieTexture(night) {
  const T = CHIP_TONES[night ? 'dark' : 'light'], hex = n => '#' + n.toString(16).padStart(6, '0'), S = [40, 40, 920, 920];
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  const k = 1024 / S[2], R = (r, col) => { g.fillStyle = hex(col); g.fillRect((r[0] - S[0]) * k, (r[1] - S[1]) * k, r[2] * k, r[3] * k); };
  const shade = (r, d, a) => { g.globalAlpha = a; R([r[0] + d, r[1] + d, r[2], r[3]], 0x000000); g.globalAlpha = 1; };
  const proud = (r, col) => { shade(r, 3, 0.35); R(r, col); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect((r[0] - S[0]) * k, (r[1] - S[1]) * k, r[2] * k, 2); };
  const P = partsOf('soc'), one = id => P[id][0].r;
  R(S, T.slab);
  padsOf(24).forEach(r => { shade(r, 3, 0.35); R(r, T.pad); });
  P.cpu.map(x => x.r).forEach(r => { shade(r, 4, 0.4); R(r, T.tile); const { logic, own } = tileOf(r); proud(logic, T.top); R(own, T.bit); });
  const gpu = one('gpu'); R(gpu, T.field); split(gpu, 6, 4, 12).forEach(r => proud(r, T.tile));
  const npu = one('npu'); R(npu, T.field); split([npu[0], npu[1], npu[2] - 70, npu[3]], 10, 8, 6).forEach(r => proud(r, T.tile));
  for (let j = 0; j < 14; j++) for (let i = 0; i < 3; i++) R([npu[0] + npu[2] - 58 + i * 15 + 2, npu[1] + 16 + j * ((npu[3] - 32) / 14) + 2, 11, (npu[3] - 32) / 14 - 4], T.bit);
  const isp = one('isp'); R(isp, T.field); split(isp, 5, 1, 12).forEach(r => proud(r, T.tile));
  split(one('cache'), 8).forEach(r => { R(r, T.field); bitsOf(r, 4, 7).forEach(b => R(b, T.bit)); });
  [[[130, 408], [480, 408]], [[480, 130], [480, 728]], [[480, 425], [870, 425]]].forEach(([a, b]) => R([Math.min(a[0], b[0]) - 5, Math.min(a[1], b[1]) - 5, Math.abs(b[0] - a[0]) + 10, Math.abs(b[1] - a[1]) + 10], T.cu));
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}

export function createPhoneFlight(canvas, host, on = {}) {
  const P = PALETTES[theme()], night = P.emissive > 0, K = BOARD(night), CT = CHIP_TONES[night ? 'dark' : 'light'], col = (n, d) => (night ? n : d);
  const st = stage(canvas), { env } = st;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.sky); scene.fog = new THREE.Fog(P.fog, 0.9, 3.2); scene.environment = env; scene.environmentIntensity = night ? 0.45 : 0.6;
  const { sun } = light(scene, P, 1);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.001, 20);
  const L = labels(host);
  const fades = [];                                     /* [material, from z, to z, direction] */
  const fader = (m, a, b, out = true) => { const mm = m.clone(); mm.transparent = true; fades.push({ m: mm, a, b, out }); return mm; };
  const M = {
    desk: mat(col(0x29262a, 0xd2c6b3), { roughness: 0.9 }),
    frame: metal(col(0x6c7684, 0xb8c0cc), { roughness: 0.28, metalness: 0.85 }),
    back: mat(col(0x2a3346, 0xd9dee6), { roughness: 0.2, metalness: 0.25 }),
    plate: metal(col(0x4a5260, 0x9aa3ae), { roughness: 0.45, metalness: 0.7 }),
    battery: mat(col(0x2c3442, 0x3a4250), { roughness: 0.55, metalness: 0.2 }),
    plastic: mat(K.plastic, { roughness: 0.5 }), pin: metal(K.pin, { roughness: 0.3, metalness: 0.9 }),
    band: mat(col(0x1c2028, 0x8e96a2), { roughness: 0.6 }), flex: mat(col(0x8a5a26, 0xb0782f), { roughness: 0.5 }),
    lens: mat(0x0b0f16, { roughness: 0.05, metalness: 0.6 }), ring: metal(col(0x8b95a5, 0xb9c1cc), { roughness: 0.25, metalness: 0.85 }),
    cable: mat(col(0xb9c0ca, 0xf1f0ec), { roughness: 0.6 })
  };

  /* ---- the desk, and the cable that charges the phone ---- */
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), M.desk); desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);
  const cablePath = new THREE.CatmullRomCurve3([[0, 0.0039, 0.08], [0, 0.0034, 0.09], [0.004, 0.0019, 0.115], [0.026, 0.0019, 0.16], [0.085, 0.0019, 0.215], [0.2, 0.0019, 0.27], [0.42, 0.0019, 0.3]].map(p => new THREE.Vector3(...p)));
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cablePath, 80, 0.0019, 10), M.cable); cable.castShadow = cable.receiveShadow = true; scene.add(cable);
  box(scene, 0.0084, 0.0034, 0.009, M.cable, 0, PT / 2 - 0.0017, PL / 2 + 0.0046, 0.0012);

  /* ---- the phone: the back, the frame round it (its antennas cut into it), a plate inside ---- */
  const phone = group(scene, 0, 0, 0);
  slab(phone, rr(PW - 0.0008, PL - 0.0008, PR - 0.0004), 0.0009, M.back, 0, 0.0003);
  const rim = rr(PW, PL, PR); rim.holes.push(rr(PW - 0.0036, PL - 0.0036, PR - 0.0018, new THREE.Path()));
  slab(phone, rim, PT, M.frame, 0, 0.0007);
  slab(phone, rr(PW - 0.004, PL - 0.004, PR - 0.002), 0.0004, M.plate, 0.0009);
  /* the bands of plastic that cut the frame into antennas */
  [-1, 1].forEach(s => [-0.058, 0.052].forEach(z => box(phone, 0.0012, PT * 0.8, 0.0016, M.band, s * (PW / 2 - 0.0002), PT * 0.1, z, 0.0003, { cast: false })));
  [-0.017, 0.017].forEach(x => box(phone, 0.0016, PT * 0.8, 0.0012, M.band, x, PT * 0.1, PL / 2 - 0.0002, 0.0003, { cast: false }));

  /* ---- inside: the battery that fills most of it, the small board at the top, the cameras beside it, speakers, the port ---- */
  const battery = box(phone, 0.06, 0.0044, 0.08, M.battery, 0, 0.0013, 0.0235, 0.0016);
  const board = box(phone, 0.0375, 0.0008, 0.0485, mat(K.board, { roughness: 0.7 }), 0.01275, 0.0014, -0.04525, 0.0004);
  const cam = group(phone, -0.0205, 0.0013, -0.0565);
  box(cam, 0.021, 0.005, 0.024, metal(col(0x3c4450, 0x6b7586), { roughness: 0.4 }), 0, 0, 0, 0.0012);
  [[-0.0045, -0.0055], [0.0045, -0.0055], [-0.0045, 0.0055]].forEach(([x, z]) => { cyl(cam, 0.0034, 0.0034, 0.0012, M.ring, x, 0.005, z, 28); cyl(cam, 0.0024, 0.0024, 0.0013, M.lens, x, 0.005, z, 28); });
  box(phone, 0.022, 0.0026, 0.019, M.plastic, -0.0205, 0.0013, -0.0325, 0.0008);
  box(phone, 0.019, 0.0034, 0.0055, M.plastic, -0.019, 0.0013, 0.0675, 0.0008);
  box(phone, 0.019, 0.0034, 0.0055, metal(col(0x3c4450, 0x6b7586)), 0.019, 0.0013, 0.0675, 0.0008);
  box(phone, 0.0094, 0.0034, 0.0055, M.ring, 0, 0.0021, 0.0705, 0.001);
  box(phone, 0.005, 0.00025, 0.016, M.flex, -0.0035, 0.0057, -0.014, 0.0001, { cast: false });
  box(phone, 0.004, 0.00025, 0.012, M.flex, 0.026, 0.0022, -0.0145, 0.0001, { cast: false });

  /* ---- on the board: the phone's chip with its memory on top, the power chip, the modem, the storage, under two shields ---- */
  const parts = group(phone, 0, BY, 0);
  const pkgBox = (w, h, d, x, z, m = M.plastic) => box(parts, w, h, d, m, x, 0, z, Math.min(0.0003, h / 2));
  const pmic = pkgBox(0.0065, 0.0008, 0.0065, 0.0005, -0.0285);
  const modem = pkgBox(0.0075, 0.0009, 0.0075, 0.0265, -0.0315);
  const storage = pkgBox(0.008, 0.0011, 0.011, 0.0265, -0.054);
  [[-0.0038, -0.0236], [-0.0038, -0.0262], [0.0052, -0.0236]].forEach(([x, z]) => box(parts, 0.0021, 0.001, 0.0021, metal(K.coil, { roughness: 0.5 }), x, 0, z, 0.0003));
  [-0.035, -0.053].forEach(z => { box(parts, 0.003, 0.0009, 0.008, M.plastic, -0.0035, 0, z, 0.0002); box(parts, 0.0022, 0.0002, 0.0072, M.pin, -0.0035, 0.0009, z, 0.00005, { cast: false }); });
  /* the small parts everywhere else: capacitors and resistors, a few hundred */
  const taken = [[SOC[0], SOC[1], 0.0085], [0.0005, -0.0285, 0.0042], [0.0265, -0.0315, 0.0046], [0.0265, -0.054, 0.0068], [-0.0035, -0.035, 0.0048], [-0.0035, -0.053, 0.0048], [-0.0025, -0.025, 0.0028]];
  const dots = [];
  for (let i = 0; dots.length < 220 && i < 2000; i++) {
    const x = -0.0055 + rnd(i, 11) * 0.0365, z = -0.069 + rnd(i, 13) * 0.0475;
    if (!taken.some(([cx, cz, h]) => Math.abs(x - cx) < h && Math.abs(z - cz) < h)) dots.push([x, z, rnd(i, 17)]);
  }
  const passives = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0006, 0.0003, 0.0003), mat(0xffffff, { roughness: 0.5 }), dots.length);
  const o3 = new THREE.Object3D(), cA = new THREE.Color(col(0x8a7a5a, 0xb8a27a)), cB = new THREE.Color(0x22262e);
  dots.forEach(([x, z, r], i) => { o3.position.set(x, BY + 0.00015, z); o3.rotation.y = r > 0.5 ? Math.PI / 2 : 0; o3.updateMatrix(); passives.setMatrixAt(i, o3.matrix); passives.setColorAt(i, r > 0.3 ? cA : cB); });
  phone.add(passives);
  /* the chip: its package base, the die (drawn from the dive's plan), the mould over it, and the memory on top */
  const soc = group(parts, SOC[0], 0, SOC[1]);
  box(soc, 0.0145, 0.0005, 0.0145, mat(K.substrate, { roughness: 0.6 }), 0, 0, 0, 0.0002);
  const dieM = new THREE.MeshStandardMaterial({ map: dieTexture(night), roughness: 0.45, metalness: 0.15 }), edgeM = mat(CT.slab);
  const die = new THREE.Mesh(new THREE.BoxGeometry(920 * UNIT, 0.0003, 920 * UNIT), [edgeM, edgeM, dieM, edgeM, edgeM, edgeM]); die.position.set(0, 0.00065, 0); die.castShadow = true; soc.add(die);
  box(soc, 0.0139, 0.0008, 0.0139, fader(mat(col(0x1d2129, 0x23272f), { roughness: 0.55 }), 2.45, 2.85), 0, 0.0005, 0, 0.0002);
  const dram = group(soc, 0, 0.0013, 0), dramM = [fader(mat(K.substrate, { roughness: 0.6 }), 2.3, 2.7), fader(mat(col(0x262a33, 0x2c3038), { roughness: 0.5 }), 2.3, 2.7)];
  box(dram, 0.0145, 0.0003, 0.0145, dramM[0], 0, 0, 0, 0.0001); box(dram, 0.0141, 0.0008, 0.0141, dramM[1], 0, 0.0003, 0, 0.0002);
  /* the shields: thin metal cans that keep the chips' noise in and the radio's out; they lift away as you come down */
  const shieldM = fader(metal(K.lid, { roughness: 0.35 }), 1.5, 1.88);
  const can = (x, z, w, d) => { const g = group(parts, x, 0, z); box(g, w, 0.0002, d, shieldM, 0, 0.0026, 0, 0.00005); [[0, d / 2], [0, -d / 2]].forEach(([, zz]) => box(g, w, 0.0026, 0.0002, shieldM, 0, 0, zz, 0.00005, { cast: false })); [w / 2, -w / 2].forEach(xx => box(g, 0.0002, 0.0026, d, shieldM, xx, 0, 0, 0.00005, { cast: false })); return g; };
  const cans = [can(SOC[0], SOC[1], 0.0195, 0.0195), can(0.02635, -0.04525, 0.0097, 0.0375)];

  /* ---- the screen: hinged on its long side, it opens like a book and stands lit beside the phone ---- */
  const hinge = group(phone, PW / 2 + PT / 2, PT / 2, 0);
  const scrBody = fader(mat(col(0x05080e, 0x111824), { roughness: 0.1, metalness: 0.4 }), 1.35, 1.8), scrBack = fader(metal(col(0x3a414c, 0x7d8692), { roughness: 0.5 }), 1.35, 1.8);
  const scrTx = screenTexture(night), scrM = fader(new THREE.MeshStandardMaterial({ map: scrTx, emissiveMap: scrTx, emissive: 0xffffff, emissiveIntensity: night ? 0.9 : 0.35, roughness: 0.12, metalness: 0.1 }), 1.35, 1.8);
  slab(hinge, rr(PW - 0.0014, PL - 0.0014, PR - 0.0007), 0.0012, scrBody, PT / 2 - 0.0003, 0.0002).position.x = -PW / 2 - PT / 2;
  slab(hinge, rr(PW - 0.005, PL - 0.008, PR - 0.0025), 0.0002, scrBack, PT / 2 - 0.0005, 0).position.x = -PW / 2 - PT / 2;
  const sg = new THREE.ShapeGeometry(rr(PW - 0.0024, PL - 0.0024, PR - 0.0012), 12), sp = sg.attributes.position, uv = [];
  for (let i = 0; i < sp.count; i++) uv.push((sp.getX(i) + (PW - 0.0024) / 2) / (PW - 0.0024), (sp.getY(i) + (PL - 0.0024) / 2) / (PL - 0.0024));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.rotateX(-Math.PI / 2);
  const glassTop = new THREE.Mesh(sg, scrM); glassTop.position.set(-PW / 2 - PT / 2, PT / 2 + 0.00092, 0); hinge.add(glassTop);

  /* ---- names on the picture, each at the levels where it belongs ---- */
  const W3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const NAMES = [
    ['screen', hinge, W3(-PW / 2 - PT / 2, PT / 2 + 0.001, -0.02), [0, 0.6]], ['antenna', phone, W3(PW / 2, PT, 0.052), [0, 1.4]], ['cable', scene, W3(0.004, 0.0042, 0.113), [0, 0.6]],
    ['battery', phone, W3(0, 0.0058, 0.03), [0.6, 1.5]], ['board', phone, W3(-0.003, 0.003, -0.022), [0.6, 1.5]], ['camera', phone, W3(-0.0205, 0.0075, -0.062), [0.6, 1.5]], ['shield', parts, W3(0.0265, 0.0028, -0.06), [0.6, 1.5]],
    ['soc', soc, W3(-0.006, 0.0008, 0.006), [1.6, 2.4]], ['dram', dram, W3(0.004, 0.0011, -0.005), [1.6, 2.4]], ['pmic', parts, W3(0.0005, 0.0008, -0.0285), [1.6, 2.4]], ['modem', parts, W3(0.0265, 0.0009, -0.0315), [1.6, 2.4]], ['storage', parts, W3(0.0265, 0.0011, -0.054), [1.6, 2.4]],
    ...[['isp', 180, 170], ['gpu', 560, 170], ['npu', 560, 480], ['cpu', 190, 470], ['cache', 190, 780]].map(([id, x, y]) => [id, scene, W3(...onDie(x, y, BY + 0.0008)), [2.6, 3.05]])
  ];
  const named = NAMES.map(([id, obj, at, lv]) => { const lb = L.add(obj, at, t('part.' + VIEW_PARTS.phone[id]), { cls: 'part3', data: { word: VIEW_PARTS.phone[id] } }); lb.lv = lv; lb.id = lb.el.dataset.hl = id; return lb; });
  /* the way in at each level: the thing you would enter next (at the chip, the dive's door into the block), where the shell's button stands with a ring on it */
  const INTO = [[phone, W3(0, PT, 0)], [phone, W3(0.0125, BY + 0.003, -0.045)], [soc, W3(0, 0.0022, 0)], [scene, W3(...onDie(DEPTHS.soc.portal[0] + DEPTHS.soc.portal[2] / 2, DEPTHS.soc.portal[1] + DEPTHS.soc.portal[2] / 2, BY + 0.0008))]];
  const pv = new THREE.Vector3();
  const portal = () => {
    const lv = Math.round(z), T = INTO[lv]; if (!T || Math.abs(z - lv) > 0.08 || drag) return on.portal && on.portal(null);
    T[0].updateWorldMatrix(true, false); pv.copy(T[1]).applyMatrix4(T[0].matrixWorld).project(camera);
    on.portal && on.portal(pv.z < 1 ? { x: (pv.x + 1) / 2, y: (1 - pv.y) / 2 } : null);
  };

  /* ---- the camera along the path ---- */
  let z = 0, goal = 0, raf = 0, running = true, W = 1, H = 1, last = performance.now(), drag = null;
  const lerp = (a, b, k) => a + (b - a) * k;
  const keyAt = zz => {
    const i = Math.max(0, Math.min(KEYS.length - 2, Math.floor(zz))), k = ease(clamp(zz - i)), A = KEYS[i], B = KEYS[i + 1];
    return { look: A.look.map((v, j) => lerp(v, B.look[j], k)), dist: Math.exp(lerp(Math.log(A.dist), Math.log(B.dist), k)), yaw: lerp(A.yaw, B.yaw, k), pitch: lerp(A.pitch, B.pitch, k) };
  };
  const pose = () => {
    const Kz = keyAt(z), c = Math.cos(Kz.pitch);
    /* a narrow screen (a phone) stands back until what is in view fits across it (the opened screen beside the phone
       needs the most), and looks a little lower, so the picture stands above the card that covers the screen's foot */
    const i = Math.min(KEYS.length - 2, Math.floor(z)), fit = lerp(WIDE[i], WIDE[i + 1], ease(clamp(z - i)));
    Kz.dist *= Math.max(1, fit / camera.aspect);
    const lift = W < 720 ? H * 0.17 : 0; camera.setViewOffset(W, H, 0, lift, W, H);
    camera.position.set(Kz.look[0] + Math.sin(Kz.yaw) * c * Kz.dist, Kz.look[1] + Math.sin(Kz.pitch) * Kz.dist, Kz.look[2] + Math.cos(Kz.yaw) * c * Kz.dist);
    camera.lookAt(Kz.look[0], Kz.look[1], Kz.look[2]);
    camera.near = Math.max(0.0004, Kz.dist * 0.04); camera.far = Math.max(4, Kz.dist * 30); camera.updateProjectionMatrix();
    /* the sun's shadows cover what is in view */
    const s = sun.shadow.camera, span = Math.max(0.012, Kz.dist * 1.2);
    Object.assign(s, { left: -span, right: span, top: span, bottom: -span, near: span * 0.05, far: span * 8 }); s.updateProjectionMatrix();
    sun.position.set(Kz.look[0] - span * 1.2, Kz.look[1] + span * 2.2, Kz.look[2] + span * 1.4); sun.target.position.set(...Kz.look);
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = span * 0.004;
  };
  /* what opens with depth */
  const states = () => {
    fades.forEach(f => { const k = smooth(f.a, f.b, z), o = f.out ? 1 - k : k; f.m.opacity = o; f.m.visible = o > 0.01; f.m.depthWrite = o > 0.6; });
    hinge.rotation.z = -smooth(0.15, 0.95, z) * Math.PI * 0.58;
    cans.forEach((g, i) => { g.position.y = smooth(1.3 + i * 0.05, 1.85, z) * 0.016; });
    dram.position.y = 0.0013 + smooth(2.1, 2.65, z) * 0.009; dram.position.x = smooth(2.1, 2.65, z) * 0.006;
    named.forEach(lb => { lb.show = z >= lb.lv[0] && z <= lb.lv[1]; });
  };

  /* ---- input: scroll, drag or keys move along the path; on.level tells the shell where you are ---- */
  const go = v => { goal = clamp(v, 0, END); };
  /* past the chip, the flight carries on into it: a scroll that keeps pushing at the last level, or ↓ there, goes inside */
  let push = 0;
  const atEnd = () => goal >= END - 1e-6 && Math.abs(z - END) < 0.06;
  canvas.addEventListener('wheel', e => { e.preventDefault();
    if (e.deltaY > 0 && atEnd()) { push += e.deltaY; if (push > 260) { push = 0; on.beyond && on.beyond(); } return; }
    push = 0; go(goal + e.deltaY * 0.0016); }, { passive: false });
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); drag = { y: e.clientY, x: e.clientX, g: goal, t: performance.now(), touch: e.pointerType === 'touch' }; });
  canvas.addEventListener('pointermove', e => { if (drag) go(drag.g + (drag.y - e.clientY) * 0.006); });
  /* on a touch screen, a quick swipe up or down moves one whole level in or out; up at the last goes inside (as dc3d.js) */
  const end = e => { const d = drag; drag = null; if (!d || !d.touch || e.type !== 'pointerup') return;
    const dy = e.clientY - d.y, dx = e.clientX - d.x; if (performance.now() - d.t > 450 || Math.abs(dy) < 36 || Math.abs(dy) < 1.5 * Math.abs(dx)) return;
    const from = Math.round(d.g); if (dy < 0 && from >= END) { go(END); on.beyond && on.beyond(); return; } go(from + (dy < 0 ? 1 : -1)); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'PageDown') { if (atEnd()) on.beyond && on.beyond(); else go(Math.floor(goal + 1)); e.preventDefault(); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { go(Math.ceil(goal - 1)); e.preventDefault(); } });
  let settle = 0, lastLevel = -1;

  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; H = r.height; st.size(W, H); camera.aspect = W / Math.max(1, H); camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  const frame = now => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000); last = now;
    /* after a pause in scrolling, come to rest at the nearest level */
    if (!drag && Math.abs(goal - z) < 0.002) { settle += dt; if (settle > 0.6 && Math.abs(goal - Math.round(goal)) > 0.001) goal = Math.round(goal); } else settle = 0;
    z += (goal - z) * (reduced() ? 1 : Math.min(1, dt * 4.5));
    pose(); states();
    const lv = Math.round(z); if (lv !== lastLevel) { lastLevel = lv; on.level && on.level(lv); }
    on.depth && on.depth(z);
    st.draw(scene, camera);
    L.update(camera, W, H);
    portal();
  };
  raf = requestAnimationFrame(frame);
  return {
    go(v) { go(v); },
    get z() { return z; },
    /* the parts named at a level (ids of src/data/atlas.js VIEW_PARTS.phone), and one of them lit on the picture */
    parts: lv => named.filter(lb => lv >= lb.lv[0] - 0.01 && lv <= lb.lv[1] + 0.01).map(lb => lb.id),
    mark(id) { named.forEach(lb => lb.el.classList.toggle('hl', lb.id === id)); },
    pause() { running = false; cancelAnimationFrame(raf); },
    warm: () => st.warm(scene, camera),
    resume() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    dispose() { running = false; cancelAnimationFrame(raf); L.clear(); }
  };
}
