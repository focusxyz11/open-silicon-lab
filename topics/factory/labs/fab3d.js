/* Lab: a fab you run, in 3D. Eight bays of machines on a cleanroom floor, the sub-fab below, robot cars
   on ceiling rails carrying boxes (FOUPs) of 25 wafers, and the companies around the world that feed it.

   The numbers come from the factory-physics model in osl/engines/fabline.js (summary()); the moving
   boxes are its lot-by-lot simulation (step()) of the same line, drawn to show the flow. Every control
   and readout works without the 3D view, so a browser without WebGL gets the same lab as numbers. */
import * as THREE from 'osl/vendor/three/three.module.min.js';
import { OrbitControls } from 'osl/vendor/three/OrbitControls.js';
import { RoomEnvironment } from 'osl/vendor/three/RoomEnvironment.js';
import { GROUPS, PRODUCTS, LOT, line, visitsOf, capacity, summary, curve, startState, step, wait } from 'osl/engines/fabline.js';
import { T, fit, watch, redraws, inView, RM } from 'osl/core/ui.js';
import { depthLab } from 'osl/core/depth.js';

const fmt = (v, d = 0) => isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d }) : '∞';
const dark = () => { const t = document.documentElement.dataset.theme; return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches); };
function canWebGL() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

/* ---------------- what each machine is ---------------- */
const INFO = {
  depo: { name: 'Deposition', t: 'Deposition tool (cluster)', d: 'Lays down a new film, a few atoms to a few hundred nanometers thick: insulator, metal or silicon. A robot inside a vacuum moves each wafer from the load port to the process chambers around it.', f: 'Methods include CVD and ALD: see the trench lab in Inside the fab.' },
  litho: { name: 'Lithography', t: 'EUV scanner and track', d: 'The track coats the wafer with light-sensitive resist; the scanner prints the layer\'s pattern in light; the track then develops it. The bay is lit yellow so room light does not expose the resist.', f: 'ASML is the only maker of EUV scanners. About 230 wafers an hour (NXE:3800E, vendor claim); a High-NA scanner costs about $400 million (estimate).' },
  etch: { name: 'Etch', t: 'Etch tool (cluster)', d: 'Cuts the printed pattern into the film below with a plasma of reactive gas, straight down, while the resist protects the rest.', f: 'Try ions against radicals in the etch lab in Inside the fab.' },
  clean: { name: 'Clean', t: 'Wet bench', d: 'Strips the leftover resist and washes the wafer in baths of ultra-pure chemicals and water. Cleaning comes back again and again: one particle can kill a chip.', f: 'See how clean the air must be in Inside the fab.' },
  implant: { name: 'Implant', t: 'Ion implanter', d: 'Fires dopant ions, such as boron or arsenic, into the silicon to make the transistors\' n- and p-type regions. Only the first, front-end layers need it.', f: 'Choose the ion and energy in the implant lab in Device physics.' },
  anneal: { name: 'Anneal', t: 'Furnace and anneal', d: 'Heats the wafer so the implanted atoms take their places in the crystal and switch on. Hotter and shorter keeps junctions shallow.', f: '' },
  cmp: { name: 'Polish', t: 'CMP polisher', d: 'Chemical-mechanical polishing: spinning pads and a fine slurry grind the wafer flat, so the next layer can be printed in focus.', f: '' },
  metro: { name: 'Measure', t: 'Metrology and inspection', d: 'Measures thickness, line width and how well each layer lines up with the last, and looks for defects, so a problem is caught before it spreads to more wafers.', f: 'Find a defect by comparing dies in Inside the fab.' },
  stocker: { name: 'Stocker', t: 'Stocker', d: 'Shelves where boxes wait for a free machine. When the fab is nearly full these fill up: that waiting is most of the time a chip spends in the fab.', f: '' },
  subfab: { name: 'Sub-fab', t: 'The sub-fab, under the cleanroom', d: 'Vacuum pumps, chillers, power supplies, and the gas and chemical lines that feed each machine live on the floor below, so their dust and vibration stay out of the cleanroom. Clean air blown down from the ceiling passes through the holes in the cleanroom floor.', f: 'Every machine above has its own pump and supply lines here.' },
  start: { name: 'Start and ship', t: 'Wafer start and shipping', d: 'Blank wafers enter here in sealed boxes; finished wafers leave for testing and packaging, which add another 4 to 8 weeks.', f: 'ECIA, Understanding Lead Times.' }
};
const NAMES = { depo: 'Deposition', litho: 'Lithography (scanners)', etch: 'Etch', clean: 'Clean', implant: 'Implant', anneal: 'Anneal', cmp: 'Polish (CMP)', metro: 'Measure' };
const SHORT = { depo: 'Depo', litho: 'Litho', etch: 'Etch', clean: 'Clean', implant: 'Implant', anneal: 'anneal', cmp: 'Polish', metro: 'Measure' };
const STEP_WORDS = { depo: 'Deposition: a new film goes on', litho: 'Lithography: resist, then the pattern is printed in light', etch: 'Etch: the pattern is cut into the film', clean: 'Clean: the leftover resist is stripped and washed off', implant: 'Implant: dopant ions are fired into the silicon', anneal: 'Anneal: heat switches the dopants on', cmp: 'Polish: the wafer is ground flat', metro: 'Measure: thickness, width and alignment are checked' };
/* The most machines a bay can hold for each group (implant and anneal share one bay). */
const MAXT = { litho: 6, depo: 9, etch: 9, clean: 9, implant: 4, anneal: 4, cmp: 9, metro: 9 };

/* ---------------- the ecosystem around the fab ---------------- */
const ECO = [
  { id: 'scan', tag: 'ASML · Zeiss · Trumpf', kind: 'in', a: 200, t: 'Scanners', who: 'ASML, with mirrors from Zeiss SMT and lasers from Trumpf', d: 'ASML is the only maker of EUV scanners. Only Zeiss makes their mirrors, and Trumpf is the only supplier of the lasers that make the light.', shock: 'asml', shockT: 'Stop ASML\'s shipments', icon: 'scan' },
  { id: 'tools', tag: 'Applied Materials · Lam · TEL', kind: 'in', a: 228, t: 'Process tools', who: 'Applied Materials, Lam Research, Tokyo Electron', d: 'Deposition, etch, implant, polishing and cleaning tools. Almost every EUV scanner is paired with a Tokyo Electron track that coats and develops the resist.', icon: 'tool' },
  { id: 'insp', tag: 'KLA · Applied Materials', kind: 'in', a: 256, t: 'Inspection', who: 'KLA, Applied Materials', d: 'Tools that find nanometer defects and measure every layer. AI-driven inspection is growing faster than the market.', icon: 'insp' },
  { id: 'wafer', tag: 'Shin-Etsu · SUMCO', kind: 'in', a: 284, t: 'Wafers', who: 'Shin-Etsu Chemical, SUMCO', d: 'Together they supply more than half of the world\'s 300 mm wafers: ultra-pure, ultra-flat silicon.', icon: 'wafer' },
  { id: 'chem', tag: 'TOK · JSR · Entegris', kind: 'in', a: 312, t: 'Resists and chemicals', who: 'Tokyo Ohka Kogyo, JSR, Entegris', d: 'Light-sensitive resists (with new ones for EUV and High-NA), ultra-pure chemicals and filters, and the sealed boxes that carry the wafers.', icon: 'chem' },
  { id: 'design', tag: 'NVIDIA · Apple · AMD · Qualcomm', kind: 'in', a: 166, t: 'Designs', who: 'NVIDIA, Apple, AMD, Qualcomm, MediaTek; design software from Synopsys, Cadence and Siemens EDA; processor designs from Arm and RISC-V companies such as SiFive', d: 'A foundry makes other companies\' chips. A design arrives as a set of patterns, one mask for each layer.', icon: 'design' },
  { id: 'util', tag: 'Grids and water works', kind: 'ut', a: 138, t: 'Power and water', who: 'Local grids and water works', d: 'A fab runs day and night on large amounts of electricity and ultra-pure water. Where they are available decides where fabs can be built.', icon: 'util' },
  { id: 'pack', tag: 'TSMC CoWoS · ASE · Amkor', kind: 'out', a: 26, t: 'Packaging and test', who: 'TSMC (CoWoS), ASE, Amkor', d: 'Finished wafers are tested, cut into dies and packaged. AI chips need advanced packaging such as CoWoS, where TSMC has about 70% of capacity; supply has fallen short, a gap expected to narrow from about 20% to 10% by the end of 2026 (estimates).', shock: 'pack', shockT: 'Packaging is full', icon: 'pack' },
  { id: 'use', tag: 'Phones, PCs, clouds', kind: 'out', a: 62, t: 'Devices and data centers', who: 'Phone and PC makers; Microsoft, Google, Amazon, Meta', d: 'Chips end up in phones, cars and the clouds that run AI. Packaging and test add another 4 to 8 weeks after the fab.', icon: 'use' }];
const KINDT = { in: 'Feeds the fab', out: 'Takes what it makes', ut: 'Keeps it running' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function init(sec) {
  const $ = s => sec.querySelector(s), $$ = s => [...sec.querySelectorAll(s)];
  const canvas = $('#fyGl'); if (!canvas) return;
  const press = (sel, on) => $$(sel).forEach(b => b.setAttribute('aria-pressed', String(on(b))));

  /* ---------------- state ---------------- */
  const BASE = Object.fromEntries(GROUPS.map(g => [g.id, g.tools]));
  const st = { prod: 'phone', load: 0.85, tools: { ...BASE }, speed: 1, print: 'euv', ai: false, shock: { asml: false, pack: false } };
  const mkLine = () => line(st.tools, { print: st.print, ai: st.ai });
  let L = mkLine(), S = null, watchId = null, lastSum = null, view = 'all';
  const layers = () => PRODUCTS[st.prod].layers;
  const starts = () => st.load * capacity(L, layers());
  /* where a lot is, from the model: at a machine (its group) or waiting in the stocker of the next one */
  function whereOf(lot) {
    for (let gi = 0; gi < L.length; gi++) { const k = S.tools[gi].findIndex(j => j && j.lot === lot); if (k >= 0) return { gi, k, wait: false }; }
    return { gi: lot.g, k: S.queues[lot.g].indexOf(lot), wait: true };
  }

  const G = canWebGL() ? scene3D() : null;
  if (!G) { canvas.hidden = true; $('.fy-views').hidden = true; $('#fyHint').hidden = true; $('#fyNo3d').hidden = false; }

  /* ================= the 3D fab ================= */
  function scene3D() {
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { return null; }
    const small = matchMedia('(max-width: 700px)').matches;
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.72; renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); }
    const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 6; controls.maxDistance = 110;
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a9aa6, 0.55); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(30, 60, 40); sun.castShadow = true; sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 150 }); sun.target.position.set(22, 0, 20); scene.add(sun, sun.target);
    const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.08 }, o));
    const MAT = { white: M(0xE3E8EC), panel: M(0xC9D2D9), grey: M(0x9AA8B2), dark: M(0x36424B, { roughness: 0.4 }), glass: M(0x9FD3E6, { transparent: true, opacity: 0.28, roughness: 0.1 }),
      rail: M(0xAAB6BE, { metalness: 0.5, roughness: 0.35 }), foup: M(0xE9A93A, { roughness: 0.4 }), foupMe: M(0x2FC4D2, { roughness: 0.35, emissive: 0x0a6a72, emissiveIntensity: 0.5 }),
      green: M(0x33d17a, { emissive: 0x22aa55, emissiveIntensity: 1.2 }), amber: M(0xf2b53c, { emissive: 0xaa7710, emissiveIntensity: 0.9 }), off: M(0x55606a),
      bath: M(0x5FB6E8, { transparent: true, opacity: 0.55, roughness: 0.05 }), pad: M(0x2C3A44, { roughness: 0.8 }), steel: M(0xC4CDD3, { metalness: 0.6, roughness: 0.3 }), yellowFloor: M(0xF3E3A6, { roughness: 0.9 }) };
    const SHARED = new Set(Object.values(MAT));
    const ACC = { depo: 0x4E8FD6, litho: 0x7A5BE0, etch: 0xD6604E, clean: 0x3FB4C8, implant: 0xC9853A, anneal: 0xD9473B, cmp: 0x5C9E6C, metro: 0x8C6BC4 };
    const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m; };
    const cyl = (r, h, mat, x = 0, y = 0, z = 0, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m; };

    /* layout: four bays north of the central aisle, four south; x along the aisle */
    const BAYS = [
      { id: 'litho', side: -1, i: 0 }, { id: 'etch', side: -1, i: 1 }, { id: 'depo', side: -1, i: 2 }, { id: 'cmp', side: -1, i: 3 },
      { id: 'clean', side: 1, i: 0 }, { id: 'implant', side: 1, i: 1, also: 'anneal' }, { id: 'metro', side: 1, i: 2 }, { id: 'start', side: 1, i: 3 }];
    const BW = 9.6, BX0 = 2, BG = 1.2, AISLE = 20, BD = 15, RAIL = 4.3, SLOT = 2.85, SFY = -5, CX = 22.8, CZ = 20;
    const bayOf = id => BAYS.find(b => b.id === id || b.also === id);
    const bayX = b => BX0 + b.i * (BW + BG) + BW / 2;
    const bayEntrance = b => AISLE + b.side * 2.2;
    const bayWall = b => AISLE + b.side * (2.2 + BD);

    /* floor: raised cleanroom tiles; below the slab, the sub-fab */
    function tileTexture() {
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      g.fillStyle = '#D3DCE2'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#B6C2CA'; g.lineWidth = 3;
      for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
      g.fillStyle = '#C3CDD4'; for (let x = 8; x < 256; x += 16) for (let y = 8; y < 256; y += 16) g.fillRect(x, y, 3, 3);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 10); t.colorSpace = THREE.SRGBColorSpace; return t;
    }
    const floorMat = M(0xffffff, { map: tileTexture(), roughness: 0.85 });
    const FL = new THREE.Mesh(new THREE.PlaneGeometry(48, 42), floorMat); FL.rotation.x = -Math.PI / 2; FL.position.set(CX, 0, CZ); FL.receiveShadow = true; scene.add(FL);
    const slabMat = M(0xB9C4CB, { roughness: 0.9, transparent: true, opacity: 1 });
    const SLAB = box(48, 0.5, 42, slabMat, CX, -0.52, CZ); SLAB.castShadow = false; scene.add(SLAB);
    const subfab = new THREE.Group(); scene.add(subfab);
    {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(48, 42), M(0x7D8B95, { roughness: 0.95 })); pl.rotation.x = -Math.PI / 2; pl.position.set(CX, SFY, CZ); pl.receiveShadow = true; pl.userData.pick = 'subfab'; subfab.add(pl);
      for (let x = 2; x < 46; x += 6) for (let z = 2; z < 40; z += 6) { const c = box(0.35, 4.5, 0.35, MAT.grey, x, SFY, z); c.userData.pick = 'subfab'; subfab.add(c); }
      const sl = new THREE.PointLight(0x9fd3ff, 30, 40, 1.4); sl.position.set(CX, -1.5, CZ); subfab.add(sl);
    }
    /* the ceiling: fan filter units blowing clean air down */
    function ffuTexture() {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#F4F7F9'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#B8C3CA'; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128); g.fillStyle = '#DCE4E9';
      for (let i = 16; i < 128; i += 12) g.fillRect(14, i, 100, 3);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 21); t.colorSpace = THREE.SRGBColorSpace; return t;
    }
    const CEIL = new THREE.Mesh(new THREE.PlaneGeometry(48, 42), new THREE.MeshStandardMaterial({ map: ffuTexture(), transparent: true, opacity: 0.5, side: THREE.DoubleSide, roughness: 0.9 }));
    CEIL.rotation.x = Math.PI / 2; CEIL.position.set(CX, 6.6, CZ); CEIL.visible = false; scene.add(CEIL);
    const AIR = (() => {
      const n = 260, pos = new Float32Array(n * 6), seed = [];
      for (let i = 0; i < n; i++) seed.push([1 + Math.random() * 44, 1 + Math.random() * 38, Math.random() * 6.4]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x7fc6e0, transparent: true, opacity: 0.35 })); m.visible = false; m.userData.seed = seed; scene.add(m); return m;
    })();
    function stepAir(dt) {
      const a = AIR.geometry.attributes.position.array, sd = AIR.userData.seed;
      sd.forEach((q, i) => { q[2] -= dt * 1.4; if (q[2] < 0) q[2] += 6.4; a.set([q[0], q[2], q[1], q[0], q[2] + 0.45, q[1]], i * 6); });
      AIR.geometry.attributes.position.needsUpdate = true;
    }

    /* bays: glass walls, a back wall, yellow light in lithography */
    const TAGS = [];
    BAYS.forEach(b => {
      const x = bayX(b), ze = bayEntrance(b), zw = bayWall(b), zc = (ze + zw) / 2, g = new THREE.Group();
      if (b.id === 'litho') {
        const y = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), MAT.yellowFloor); y.rotation.x = -Math.PI / 2; y.position.set(x, 0.01, zc); y.receiveShadow = true; g.add(y);
        const pl = new THREE.PointLight(0xffc840, 40, 18, 1.6); pl.position.set(x, 5, zc); g.add(pl);
      }
      [-1, 1].forEach(s => { g.add(box(0.12, 2.8, BD, MAT.glass, x + s * BW / 2, 0, zc)); g.add(box(0.16, 0.12, BD, MAT.grey, x + s * BW / 2, 2.8, zc)); });
      g.add(box(BW, 3.2, 0.2, MAT.panel, x, 0, zw));
      scene.add(g);
      TAGS.push({ id: b.id, also: b.also, pos: new THREE.Vector3(x, 5.6, zw - b.side * 1.0), el: null });
    });
    /* the interbay rail loop and a rail into every bay */
    function rail(x1, z1, x2, z2) { const len = Math.hypot(x2 - x1, z2 - z1), m = box(len, 0.14, 0.22, MAT.rail); m.position.set((x1 + x2) / 2, RAIL, (z1 + z2) / 2); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); m.castShadow = false; scene.add(m); }
    rail(1, AISLE - 0.8, 45, AISLE - 0.8); rail(1, AISLE + 0.8, 45, AISLE + 0.8); rail(1, AISLE - 0.8, 1, AISLE + 0.8); rail(45, AISLE - 0.8, 45, AISLE + 0.8);
    BAYS.forEach(b => { const x = bayX(b), zw = bayWall(b); rail(x - 0.6, AISLE + b.side * 0.8, x - 0.6, zw - b.side * 0.8); rail(x + 0.6, AISLE + b.side * 0.8, x + 0.6, zw - b.side * 0.8); rail(x - 0.6, zw - b.side * 0.8, x + 0.6, zw - b.side * 0.8); });
    for (let x = 2; x < 45; x += 4) { scene.add(box(0.06, 2, 0.06, MAT.grey, x, RAIL, AISLE - 0.8)); scene.add(box(0.06, 2, 0.06, MAT.grey, x, RAIL, AISLE + 0.8)); }

    /* ---------------- machines ---------------- */
    /* Each bay has slots on both sides of its own aisle; slot 0 on the west side holds the stocker. */
    function slotPos(b, side, k) { return { x: bayX(b) + side * 2.75, z: bayEntrance(b) + b.side * (1.6 + k * SLOT) }; }
    function lightTower(x, y, z) { const g = new THREE.Group(); g.add(cyl(0.05, 0.5, MAT.grey, x, y, z, 8)); const a = cyl(0.09, 0.12, MAT.off, x, y + 0.5, z, 12), gr = cyl(0.09, 0.12, MAT.off, x, y + 0.64, z, 12); g.add(a, gr); g.userData.lamps = { a, gr }; return g; }
    function loadPort(x, z) { const g = new THREE.Group(); g.add(box(0.7, 0.85, 0.6, MAT.panel, x, 0, z)); g.add(box(0.6, 0.04, 0.52, MAT.steel, x, 0.85, z)); return g; }
    /* Builders: face points from the machine to the bay aisle, so the front, where boxes dock, is toward the aisle. */
    function clusterTool(acc, x, z, face) {
      const g = new THREE.Group();
      g.add(box(0.9, 2.0, 2.6, MAT.white, x + face * 0.8, 0, z));
      g.add(box(0.06, 0.5, 2.2, M(acc), x + face * 1.26, 1.3, z));
      g.add(cyl(0.72, 1.0, MAT.steel, x - face * 0.25, 0.55, z, 6));
      [[-1.0, -0.95], [-1.45, 0], [-1.0, 0.95]].forEach(([dx, dz]) => { const cx = x + face * dx - face * 0.05; g.add(box(0.85, 1.75, 0.85, MAT.panel, cx, 0, z + dz)); g.add(cyl(0.28, 0.22, MAT.dark, cx, 1.75, z + dz, 16)); });
      return g;
    }
    function scanner(x, z, face) {
      if (st.print === 'duv') return scannerDUV(x, z, face);
      if (st.print === 'highna') return scannerHigh(x, z, face);
      const g = new THREE.Group();
      g.add(box(1.0, 2.2, 2.6, MAT.white, x + face * 0.75, 0, z));
      g.add(box(0.06, 0.35, 2.5, M(ACC.litho), x + face * 1.26, 1.6, z));
      g.add(box(2.1, 2.9, 1.9, MAT.white, x - face * 0.9, 0, z - 0.4));
      g.add(box(2.0, 0.22, 1.8, MAT.panel, x - face * 0.9, 2.9, z - 0.4));
      g.add(box(1.9, 2.3, 0.75, MAT.dark, x - face * 0.9, 0, z + 0.97));
      g.add(cyl(0.18, 0.5, MAT.steel, x - face * 0.9, 2.3, z + 0.97, 12));
      return g;
    }
    /* an older 193 nm immersion scanner: smaller, with no plasma light source */
    function scannerDUV(x, z, face) {
      const g = new THREE.Group(); g.add(box(1.0, 2.2, 2.6, MAT.white, x + face * 0.75, 0, z)); g.add(box(0.06, 0.35, 2.5, M(0x3FB4C8), x + face * 1.26, 1.6, z));
      g.add(box(2.0, 2.3, 2.4, MAT.white, x - face * 0.9, 0, z)); g.add(box(1.9, 0.2, 2.3, MAT.panel, x - face * 0.9, 2.3, z)); g.add(box(0.6, 0.9, 0.6, MAT.steel, x - face * 1.6, 0, z + 0.9)); return g;
    }
    /* a High-NA EUV scanner: taller and heavier, with a bigger optics module */
    function scannerHigh(x, z, face) {
      const g = new THREE.Group(); g.add(box(1.0, 2.2, 2.6, MAT.white, x + face * 0.75, 0, z)); g.add(box(0.06, 0.35, 2.5, M(0xF0B13C), x + face * 1.26, 1.6, z));
      g.add(box(2.3, 3.6, 2.0, MAT.white, x - face * 0.95, 0, z - 0.4)); g.add(box(2.1, 0.6, 1.9, M(0xF0B13C, { roughness: 0.4 }), x - face * 0.95, 3.6, z - 0.4)); g.add(box(2.0, 2.6, 0.8, MAT.dark, x - face * 0.95, 0, z + 1.0)); g.add(cyl(0.2, 0.7, MAT.steel, x - face * 0.95, 2.6, z + 1.0, 12)); return g;
    }
    function wetBench(x, z, face) { const g = new THREE.Group(); g.add(box(1.7, 1.1, 2.7, MAT.white, x - face * 0.3, 0, z)); for (let i = -1; i <= 1; i++) g.add(box(1.2, 0.12, 0.7, MAT.bath, x - face * 0.3, 1.1, z + i * 0.85)); g.add(box(1.7, 0.9, 0.2, MAT.panel, x - face * 0.3, 1.1, z + 1.3)); g.add(box(0.06, 1.4, 2.5, M(ACC.clean), x + face * 0.57, 0.3, z)); return g; }
    function furnace(x, z, face) { const g = new THREE.Group(); g.add(box(1.5, 3.4, 1.6, MAT.white, x - face * 0.5, 0, z - 0.5)); g.add(box(1.2, 0.45, 1.3, M(ACC.anneal), x - face * 0.5, 3.4, z - 0.5)); g.add(box(1.0, 1.4, 1.1, MAT.panel, x + face * 0.5, 0, z + 0.8)); return g; }
    function implanter(x, z, face) { const g = new THREE.Group(); g.add(box(1.5, 2.0, 1.3, MAT.white, x - face * 1.1, 0, z - 0.9)); const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.0, 16), MAT.steel); tube.rotation.z = Math.PI / 2; tube.position.set(x - face * 0.2, 1.3, z - 0.9); tube.castShadow = true; g.add(tube); g.add(box(1.4, 1.8, 1.4, MAT.panel, x + face * 0.5, 0, z + 0.6)); g.add(box(0.06, 0.45, 1.0, M(ACC.implant), x + face * 1.21, 1.3, z + 0.6)); return g; }
    function cmpTool(x, z, face) { const g = new THREE.Group(); g.add(box(2.1, 1.1, 2.7, MAT.white, x - face * 0.55, 0, z)); [-0.66, 0.6].forEach(dz => g.add(cyl(0.55, 0.08, MAT.pad, x - face * 0.55, 1.1, z + dz, 32))); g.add(box(0.6, 1.7, 2.7, MAT.panel, x + face * 0.9, 0, z)); g.add(box(0.06, 0.4, 2.4, M(ACC.cmp), x + face * 1.21, 1.2, z)); return g; }
    function metroTool(x, z, face) { const g = new THREE.Group(); g.add(box(1.9, 1.9, 2.3, MAT.white, x - face * 0.35, 0, z)); g.add(box(0.05, 0.7, 1.2, MAT.glass, x + face * 0.62, 1.0, z)); g.add(box(1.3, 0.5, 1.5, MAT.panel, x - face * 0.35, 1.9, z)); g.add(box(0.06, 0.3, 1.9, M(ACC.metro), x + face * 0.62, 0.55, z)); return g; }
    function stockerRack(x, z) { const g = new THREE.Group(); g.add(box(1.5, 3.6, 2.6, MAT.panel, x, 0, z)); g.add(box(1.55, 0.12, 2.65, MAT.grey, x, 3.6, z)); for (let r = 0; r < 5; r++) g.add(box(0.08, 0.05, 2.5, MAT.grey, x + 0.74, 0.55 + r * 0.62, z)); return g; }
    const BUILD = { depo: (x, z, f) => clusterTool(ACC.depo, x, z, f), etch: (x, z, f) => clusterTool(ACC.etch, x, z, f), litho: scanner, clean: wetBench, anneal: furnace, implant: implanter, cmp: cmpTool, metro: metroTool };
    const slotsFor = () => { const out = []; for (let k = 0; k < 5; k++) out.push([1, k]); for (let k = 1; k < 5; k++) out.push([-1, k]); return out; };

    const machines = [], stockers = {};
    let machineRoot = new THREE.Group(); scene.add(machineRoot);
    function dispose(root) { root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && !SHARED.has(o.material)) o.material.dispose(); }); }
    function buildMachines() {
      scene.remove(machineRoot); dispose(machineRoot); machineRoot = new THREE.Group(); scene.add(machineRoot); machines.length = 0;
      BAYS.forEach(b => {
        { const cx = bayX(b), cz = (bayEntrance(b) + bayWall(b)) / 2; const ch = box(2.2, 1.6, 1.4, M(0x8FA4B2), cx, SFY, cz); ch.userData.pick = 'subfab'; machineRoot.add(ch); const cab = box(1.2, 2.2, 2.4, M(0xC9D3DA), cx, SFY, cz + b.side * 4); cab.userData.pick = 'subfab'; machineRoot.add(cab); }
        const sp = slotPos(b, -1, 0), r = stockerRack(sp.x, sp.z); r.traverse(o => { o.userData.pick = 'stocker'; }); machineRoot.add(r);
        const slots = []; for (let row = 0; row < 5; row++) for (let c = 0; c < 4; c++) slots.push(new THREE.Vector3(sp.x + 0.95, 0.35 + row * 0.62, sp.z - 1.0 + c * 0.66));
        stockers[b.id] = { pos: new THREE.Vector3(sp.x + 1.2, 1, sp.z), slots };
        machineRoot.add(lightTower(sp.x - 0.6, 3.6, sp.z - 1.1));
        if (b.id === 'start') { for (let k = 0; k < 3; k++) { const p = slotPos(b, 1, k); const g = box(1.6, 1.2, 2.6, MAT.white, p.x, 0, p.z); g.userData.pick = 'start'; machineRoot.add(g); machineRoot.add(loadPort(p.x - 1.05, p.z)); } return; }
        const ids = [b.id].concat(b.also ? [b.also] : []), slots2 = slotsFor(); let si = 0;
        ids.forEach(id => {
          const g = L.find(x => x.id === id), n = Math.min(g.tools, MAXT[id]);
          for (let k = 0; k < n; k++) {
            const [side, slot] = slots2[si++] || slots2[slots2.length - 1]; const p = slotPos(b, side, slot), face = -side;
            const grp = BUILD[id](p.x, p.z, face); grp.traverse(o => { o.userData.pick = id; }); machineRoot.add(grp);
            const portX = p.x - side * 1.55; machineRoot.add(loadPort(portX, p.z));
            const lt = lightTower(p.x + side * 0.2, id === 'litho' ? 3.05 : 2.1, p.z - 1.2); machineRoot.add(lt);
            machines.push({ gid: id, k, port: new THREE.Vector3(portX, 1.05, p.z), lamps: lt.userData.lamps, bay: b });
            /* below it: a vacuum pump and the line that feeds it */
            const pump = cyl(0.38, 1.0, M(0x5F6E79, { metalness: 0.4 }), p.x - side * 0.4, SFY, p.z); pump.userData.pick = 'subfab'; machineRoot.add(pump);
            const pipe = cyl(0.08, Math.abs(SFY) - 0.55, M(ACC[id] || 0x9AA8B2, { metalness: 0.3 }), p.x - side * 0.4, SFY + 1, p.z, 8); pipe.userData.pick = 'subfab'; machineRoot.add(pipe);
          }
        });
      });
    }

    /* ---------------- the ecosystem ring ---------------- */
    const ECOC = { in: 0x7A5BE0, out: 0x2A9D57, ut: 0x2B9EAA };
    const ecoRoot = new THREE.Group(); ecoRoot.visible = false; scene.add(ecoRoot);
    const ECOR = 54, flows = [], ECOTAGS = [];
    const ecoPos = e => { const r = e.a * Math.PI / 180; return new THREE.Vector3(CX + Math.cos(r) * ECOR, 0, CZ + Math.sin(r) * ECOR * 0.78); };
    function ecoIcon(e, c) {
      const g = new THREE.Group(), { x, z } = c;
      if (e.icon === 'scan') { g.add(box(3, 3, 2.4, MAT.white, x - 1, 0.6, z)); g.add(box(2.6, 2.4, 1, MAT.dark, x - 1, 0.6, z + 1.8)); g.add(box(1.4, 2.4, 2.4, MAT.white, x + 1.6, 0.6, z)); }
      if (e.icon === 'tool') { g.add(cyl(1, 1.2, MAT.steel, x, 0.6, z, 6)); for (let k = 0; k < 4; k++) { const r = k * Math.PI / 2; g.add(box(1.1, 1.8, 1.1, MAT.panel, x + Math.cos(r) * 1.8, 0.6, z + Math.sin(r) * 1.8)); } }
      if (e.icon === 'insp') { g.add(box(2.6, 2.4, 2.6, MAT.white, x, 0.6, z)); g.add(box(0.1, 1, 1.6, MAT.glass, x + 1.33, 1.4, z)); }
      if (e.icon === 'wafer') { const wm = M(0x8C99A3, { metalness: 0.7, roughness: 0.2 }); for (let k = 0; k < 6; k++) g.add(cyl(1.8, 0.12, wm, x, 0.6 + k * 0.35, z, 40)); }
      if (e.icon === 'chem') { const cm = M(0xD7E2E8, { metalness: 0.3 }); for (let k = -1; k <= 1; k++) g.add(cyl(0.8, 2.6, cm, x + k * 2, 0.6, z, 20)); }
      if (e.icon === 'design') { g.add(box(4, 0.2, 3, M(0x203040), x, 0.6, z)); const lm = M(0x2FC4D2, { emissive: 0x2FC4D2, emissiveIntensity: 0.8 }); for (let k = 0; k < 6; k++) g.add(box(3.6, 0.05, 0.08, lm, x, 0.81, z - 1.2 + k * 0.48)); }
      if (e.icon === 'util') { g.add(cyl(1.3, 3.4, MAT.steel, x - 1.4, 0.6, z, 24)); g.add(cyl(1.0, 2.6, MAT.steel, x + 1.4, 0.6, z, 24)); }
      if (e.icon === 'pack') { g.add(box(3.6, 0.3, 3.6, M(0x2E7D4F), x, 0.6, z)); g.add(box(1.4, 0.35, 2.2, MAT.dark, x - 0.5, 0.9, z)); for (let k = 0; k < 4; k++) g.add(box(0.6, 1, 0.6, MAT.grey, x + 1.2, 0.9, z - 1.2 + k * 0.8)); }
      if (e.icon === 'use') { for (let k = 0; k < 4; k++) g.add(box(0.9, 3.2, 1.6, MAT.dark, x - 1.8 + k * 1.2, 0.6, z)); }
      return g;
    }
    const ecoBase = {};
    function flow(a, b, color, n, rise, id) {
      const mid = a.clone().lerp(b, 0.5); mid.y = rise; const cv = new THREE.QuadraticBezierCurve3(a, mid, b);
      ecoRoot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cv.getPoints(40)), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })));
      const dm = new THREE.MeshBasicMaterial({ color }), dg = new THREE.SphereGeometry(0.45, 12, 12), dots = [];
      for (let k = 0; k < n; k++) { const d = new THREE.Mesh(dg, dm); d.userData.t = k / n; ecoRoot.add(d); dots.push(d); }
      flows.push({ id, curve: cv, dots });
    }
    ECO.forEach(e => {
      const c = ecoPos(e), base = cyl(6, 0.6, M(ECOC[e.kind], { roughness: 0.6, transparent: true, opacity: 0.85 }), c.x, 0, c.z, 6);
      base.userData.eco = e.id; ecoBase[e.id] = base; ecoRoot.add(base);
      const ic = ecoIcon(e, c); ic.traverse(o => { o.userData.eco = e.id; }); ecoRoot.add(ic);
      ECOTAGS.push({ e, pos: new THREE.Vector3(c.x, 6.5, c.z), el: null });
      const edge = new THREE.Vector3(Math.max(1, Math.min(45, c.x)), 0.5, Math.max(1, Math.min(39, c.z)));
      const a = e.kind === 'out' ? edge : c.clone().setY(0.8), b = e.kind === 'out' ? c.clone().setY(0.8) : edge;
      flow(a, b, ECOC[e.kind], 7, 14, e.id);
    });
    flow(ecoPos(ECO.find(e => e.id === 'pack')).setY(0.8), ecoPos(ECO.find(e => e.id === 'use')).setY(0.8), ECOC.out, 5, 10, 'pack2');
    function stepFlows(dt) {
      flows.forEach(f => {
        const stopped = f.id === 'scan' && st.shock.asml, slow = (f.id === 'pack' || f.id === 'pack2') && st.shock.pack;
        f.dots.forEach(d => { d.visible = !stopped; if (stopped) return; d.userData.t = (d.userData.t + dt * (slow ? 0.05 : 0.12)) % 1; d.position.copy(f.curve.getPoint(d.userData.t)); });
      });
      ECO.forEach(e => { const hit = (e.shock === 'asml' && st.shock.asml) || (e.shock === 'pack' && st.shock.pack); ecoBase[e.id].material.color.set(hit ? 0xC8402E : ECOC[e.kind]); });
    }

    /* ---------------- boxes and robot cars ---------------- */
    const foupGeo = new THREE.BoxGeometry(0.42, 0.36, 0.38), carGeo = new THREE.BoxGeometry(0.55, 0.3, 0.5), carMat = M(0xF4F6F8, { metalness: 0.2 });
    const ropeMat = new THREE.LineBasicMaterial({ color: 0x7d8a94 });
    const foups = new Map();   /* lot id → { mesh, car, rope, path, t, key, bay, where } */
    function foupFor(lot) {
      let f = foups.get(lot.id); if (f) return f;
      const mesh = new THREE.Mesh(foupGeo, MAT.foup); mesh.castShadow = true; scene.add(mesh);
      const car = new THREE.Mesh(carGeo, carMat); car.visible = false; scene.add(car);
      const rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), ropeMat); rope.visible = false; scene.add(rope);
      f = { mesh, car, rope, path: null, t: 0, key: '' }; foups.set(lot.id, f); return f;
    }
    function dropFoup(f) { scene.remove(f.mesh, f.car, f.rope); f.rope.geometry.dispose(); }
    /* a route along the rails: up to the rail, along the bay, round the aisle loop, into the next bay, down */
    function railPath(from, to, fromBay, toBay) {
      const H = RAIL - 0.45, P = [from.clone(), new THREE.Vector3(from.x, H, from.z)], lane = b => bayX(b) + (b.side < 0 ? -0.6 : 0.6);
      const cross = !fromBay || !toBay || fromBay !== toBay;
      if (fromBay) { P.push(new THREE.Vector3(lane(fromBay), H, from.z)); if (cross) P.push(new THREE.Vector3(lane(fromBay), H, AISLE + fromBay.side * 0.8)); }
      if (cross) { const z = AISLE + (toBay ? toBay.side : -1) * 0.8; P.push(new THREE.Vector3(P[P.length - 1].x, H, z)); P.push(new THREE.Vector3(toBay ? lane(toBay) : to.x, H, z)); }
      if (toBay) P.push(new THREE.Vector3(lane(toBay), H, to.z));
      P.push(new THREE.Vector3(to.x, H, to.z)); P.push(to.clone());
      const pts = [P[0]]; for (let i = 1; i < P.length; i++) if (P[i].distanceTo(pts[pts.length - 1]) > 0.01) pts.push(P[i]);
      let len = 0; for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
      return { pts, len };
    }
    function along(path, d) {
      let left = d;
      for (let i = 1; i < path.pts.length; i++) { const a = path.pts[i - 1], b = path.pts[i], l = a.distanceTo(b); if (left <= l) return a.clone().lerp(b, l ? left / l : 1); left -= l; }
      return path.pts[path.pts.length - 1].clone();
    }
    /* where a lot should be drawn right now: at a machine's load port, or on a stocker shelf */
    function targetOf(lot) {
      const w = whereOf(lot), gid = L[w.gi].id;
      if (!w.wait) { const m = machines.find(x => x.gid === gid && x.k === w.k); if (m) return { pos: m.port, bay: m.bay, key: 't' + gid + w.k, wait: false }; }
      const b = bayOf(gid), sk = stockers[b.id], qi = Math.max(0, w.k);
      return { pos: qi >= sk.slots.length ? sk.pos : sk.slots[qi], bay: b, key: 'q' + b.id + qi, wait: true };
    }
    const beacon = new THREE.Group();
    { const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6, 8), new THREE.MeshBasicMaterial({ color: 0x2FC4D2, transparent: true, opacity: 0.55 })); beam.position.y = 3; beacon.add(beam); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 32), new THREE.MeshBasicMaterial({ color: 0x2FC4D2 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.35; beacon.add(ring); scene.add(beacon);
    function updateFoups(dt) {
      const alive = new Set();
      for (const lot of S.lots) {
        alive.add(lot.id); const f = foupFor(lot), tg = targetOf(lot);
        if (f.key !== tg.key) {
          const from = f.mesh.position.clone(), fresh = !f.key; f.key = tg.key;
          if (fresh) { const sp = stockers.start.pos.clone(); f.mesh.position.copy(sp); f.path = railPath(sp, tg.pos, bayOf('start'), tg.bay); }
          else f.path = f.bay === tg.bay && tg.wait && f.wait ? { pts: [from, tg.pos.clone()], len: from.distanceTo(tg.pos) } : railPath(from, tg.pos, f.bay, tg.bay);
          f.t = 0; f.bay = tg.bay; f.wait = tg.wait;
        }
        if (f.path) {
          f.t += dt * 7.5; const p = along(f.path, f.t); f.mesh.position.copy(p); const moving = f.t < f.path.len, high = p.y > 1.6;
          f.car.visible = moving && high; if (f.car.visible) f.car.position.set(p.x, RAIL - 0.15, p.z);
          f.rope.visible = moving && !high && f.t > 0.2 && f.t < f.path.len - 0.2;
          if (f.rope.visible) f.rope.geometry.setFromPoints([new THREE.Vector3(p.x, RAIL - 0.15, p.z), p.clone().add(new THREE.Vector3(0, 0.18, 0))]);
          if (!moving) { f.path = null; f.car.visible = false; f.rope.visible = false; }
        }
        const me = lot.id === watchId; f.mesh.material = me ? MAT.foupMe : MAT.foup; f.mesh.scale.setScalar(me ? 1.35 : 1);
      }
      for (const [id, f] of foups) if (!alive.has(id)) { dropFoup(f); foups.delete(id); }
      /* lamps: green while working, amber while waiting for a box */
      machines.forEach(m => { const gi = L.findIndex(g => g.id === m.gid), busy = !!(S.tools[gi] && S.tools[gi][m.k]); m.lamps.gr.material = busy ? MAT.green : MAT.off; m.lamps.a.material = busy ? MAT.off : MAT.amber; });
    }
    function resetFoups() {
      for (const f of foups.values()) dropFoup(f); foups.clear(); buildMachines();
      for (const lot of S.lots) { const f = foupFor(lot), tg = targetOf(lot); f.mesh.position.copy(tg.pos); f.key = tg.key; f.bay = tg.bay; f.wait = tg.wait; }
    }

    /* ---------------- labels over the bays and the ecosystem ---------------- */
    const host = $('#fyTags');
    function placeTag(l, v, html, hot) {
      if (!l.el) { l.el = document.createElement('div'); l.el.className = 'fy-tag'; host.appendChild(l.el); }
      const W = canvas.clientWidth, H = canvas.clientHeight, vis = v && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      l.el.hidden = !vis; if (!vis) return;
      l.el.style.left = ((v.x + 1) / 2 * W) + 'px'; l.el.style.top = ((1 - v.y) / 2 * H) + 'px';
      l.el.classList.toggle('hot', !!hot); if (l.html !== html) { l.el.innerHTML = html; l.html = html; }
    }
    function tags(sum) {
      const wide = canvas.clientWidth >= 760, tiny = canvas.clientWidth < 480;
      TAGS.forEach(l => {
        const v = view !== 'eco' ? l.pos.clone().project(camera) : null;
        if (l.id === 'start') return placeTag(l, v, (tiny ? 'Ship' : 'Start and ship') + '<small>' + fmt(sum.outWafers, 1) + (wide ? ' wafers a day out' : ' a day') + '</small>');
        const ids = [l.id].concat(l.also ? [l.also] : []), hot = ids.includes(sum.bottleneck);
        const q = ids.reduce((a, id) => a + S.queues[L.findIndex(g => g.id === id)].length, 0);
        placeTag(l, v, ids.map(id => tiny ? SHORT[id] : INFO[id].name).join(' + ') + (hot && wide ? ' · bottleneck' : '') + '<small>' + ids.map(id => Math.round(sum.groups.find(g => g.id === id).u * 100) + '%').join(' / ') + (wide ? ' busy · ' + q + ' waiting' : tiny ? '' : ' · ' + q + ' wait') + '</small>', hot);
      });
      ECOTAGS.forEach(l => {
        const hit = (l.e.shock === 'asml' && st.shock.asml) || (l.e.shock === 'pack' && st.shock.pack);
        placeTag(l, ecoRoot.visible ? l.pos.clone().project(camera) : null, esc(l.e.t) + (hit ? ' · stopped' : '') + (wide ? '<small>' + esc(l.e.tag) + '</small>' : ''), hit);
      });
    }

    /* ---------------- camera views ---------------- */
    const VIEWS = { eco: { p: [CX, 128, 140], t: [CX, 0, 24] }, subfab: { p: [CX, -1.6, 58], t: [CX, -3.8, 20] }, all: { p: [CX, 46, 54], t: [CX, 0, 18.5] }, litho: { p: [bayX(BAYS[0]) + 12, 13, 25], t: [bayX(BAYS[0]), 1, 9] } };
    /* narrower screens: step back, and look down more steeply in portrait, so the whole floor fits */
    const back = (V, wide) => { const k = Math.min(2.2, Math.max(1, wide / camera.aspect)); return { p: V.t.map((t, i) => t + (V.p[i] - t) * k), t: V.t }; };
    const allView = () => camera.aspect < 1 ? back({ p: [CX, 82, 46], t: [CX, 0, 20] }, 0.75) : back(VIEWS.all, 1.3);
    let goal = null;
    function setView(v) {
      view = v; const sub = v === 'subfab';
      floorMat.transparent = sub; floorMat.opacity = sub ? 0.16 : 1; slabMat.opacity = sub ? 0.12 : 1; floorMat.needsUpdate = slabMat.needsUpdate = true;
      ecoRoot.visible = v === 'eco'; controls.maxDistance = v === 'eco' ? 240 : 110; theme();
      press('.fy-views [data-v]', b => b.dataset.v === v);
      const V = v === 'all' ? allView() : v === 'eco' ? back(VIEWS.eco, 1.45) : VIEWS[v];
      if (V) goal = { p: new THREE.Vector3(...V.p), t: new THREE.Vector3(...V.t) };
    }
    controls.addEventListener('start', () => { goal = null; if (view === 'all' || view === 'litho') press('.fy-views [data-v]', () => false); });

    /* click a machine, a box or a place in the ecosystem */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let downAt = null;
    canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', e => {
      if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
      const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
      const hf = ray.intersectObjects([...foups.values()].map(f => f.mesh));
      if (hf.length) { for (const [id, f] of foups) if (f.mesh === hf[0].object) { watchId = id; setView('follow'); return; } }
      if (ecoRoot.visible) { const he = ray.intersectObjects(ecoRoot.children, true).find(x => x.object.userData.eco); if (he) { showEco(he.object.userData.eco); return; } }
      /* the cleanroom floor hides the sub-fab, except in the sub-fab view */
      const h = ray.intersectObjects(machineRoot.children.concat(subfab.children, view === 'subfab' ? [] : [FL]), true).find(x => x.object === FL || x.object.userData.pick);
      if (h && h.object === FL) { $('#fyInfo').hidden = true; return; }
      if (!h) { $('#fyInfo').hidden = true; return; }
      showInfo(h.object.userData.pick);
    });

    function theme() {
      const dk = dark(), bg = dk ? 0x0E171D : 0xDDE4E9;
      scene.background = new THREE.Color(bg); scene.fog = view === 'eco' ? null : new THREE.Fog(bg, 70, 150);
      floorMat.color.set(dk ? 0x55636c : 0xffffff); hemi.intensity = dk ? 0.4 : 0.55;
    }
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight; if (w < 2 || h < 2) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(canvas);
    redraws.push(theme);
    $('#fyCeil').addEventListener('click', () => { const on = !CEIL.visible; CEIL.visible = on; AIR.visible = on; $('#fyCeil').setAttribute('aria-pressed', String(on)); });

    function frame(dt) {
      updateFoups(dt); if (AIR.visible) stepAir(dt); if (ecoRoot.visible) stepFlows(dt);
      const me = foups.get(watchId);
      if (view === 'follow' && me) { const p = me.mesh.position, k = RM ? 1 : 1 - Math.exp(-dt * 3); controls.target.lerp(p, Math.min(1, k * 2)); camera.position.lerp(p.clone().add(new THREE.Vector3(8, 12, 13)), k); }
      else if (goal) { const k = RM ? 1 : Math.min(1, dt * 4); camera.position.lerp(goal.p, k); controls.target.lerp(goal.t, k); if (camera.position.distanceTo(goal.p) < 0.05) goal = null; }
      if (me) { beacon.visible = true; beacon.position.set(me.mesh.position.x, me.mesh.position.y + 0.25, me.mesh.position.z); ring.rotation.z += dt * 2; } else beacon.visible = false;
      controls.update(); renderer.render(scene, camera);
    }
    theme(); resize();
    { const V = allView(); camera.position.set(...V.p); controls.target.set(...V.t); }
    return { buildMachines, resetFoups, frame, tags, setView, get view() { return view; } };
  }

  /* ================= the panel: works with or without 3D ================= */
  const setView = v => { if (G) G.setView(v); else view = v; };
  function showInfo(id) {
    const I = INFO[id], g = lastSum && lastSum.groups.find(x => x.id === id);
    $('#fyICode').textContent = I.name + (g ? ' · ' + Math.round(g.u * 100) + '% busy' : ''); $('#fyIT').textContent = I.t; $('#fyID').textContent = I.d; $('#fyIF').textContent = I.f; $('#fyInfo').hidden = false;
  }
  function showEco(id) {
    const e = ECO.find(x => x.id === id); if (!e) return;
    $('#fyICode').textContent = KINDT[e.kind]; $('#fyIT').textContent = e.t; $('#fyID').textContent = e.d; $('#fyIF').textContent = e.who; if (G) $('#fyInfo').hidden = false;
    $$('.fy-ecard').forEach(c => c.classList.toggle('on', c.dataset.e === id));
  }
  $('#fyInfoX').addEventListener('click', () => { $('#fyInfo').hidden = true; });
  function ecoList() {
    $('#fyEco').innerHTML = ECO.map(e => '<article class="fy-ecard fy-k-' + e.kind + '" data-e="' + e.id + '"><p class="code">' + KINDT[e.kind] + '</p><h3>' + esc(e.t) + '</h3><p class="fy-who">' + esc(e.who) + '</p><p>' + esc(e.d) + '</p>' +
      (e.shock ? '<button type="button" class="fy-shock" data-shock="' + e.shock + '" aria-pressed="' + st.shock[e.shock] + '">' + esc(e.shockT) + '</button>' : '') + '</article>').join('');
  }

  /* ---------------- readouts ---------------- */
  /* Each row's count has the id 'fyN' + group, e.g. 'fyNlitho' for the scanners: challenges read it. */
  const changed = () => Object.keys(BASE).reduce((a, k) => a + Math.abs(st.tools[k] - BASE[k]), 0);
  const visitsPerChip = Lx => GROUPS.reduce((t, g) => t + visitsOf(Lx, g, layers()), 0);
  function readouts() {
    const N = layers(), sum = summary(L, N, starts()); lastSum = sum;
    $('#fyLoadO').textContent = fmt(sum.starts * LOT, 1) + ' wafers · ' + Math.round(st.load * 100) + '% full';
    $('#fyOut').textContent = fmt(sum.outWafers, 1); $('#fyDays').textContent = fmt(sum.days) + ' days'; $('#fyDays').classList.toggle('fy-bad', sum.days > 120);
    $('#fyDpl').textContent = fmt(sum.daysPerLayer, 2); $('#fyWip').textContent = fmt(sum.wip);
    $('#fyCap').textContent = fmt(capacity(L, N) * LOT, 1); $('#fyAdded').textContent = String(changed());
    $('#fyTag').textContent = 'Bottleneck: ' + NAMES[sum.bottleneck].split(' (')[0].toLowerCase();
    $('#fyTools').innerHTML = L.map((g, i) => {
      const u = sum.groups[i].u, hot = g.id === sum.bottleneck, no = g.id === 'litho' && st.shock.asml;
      return '<div class="fy-trow' + (hot ? ' hot' : '') + '"><span class="fy-nm">' + NAMES[g.id] + (hot ? ' · bottleneck' : '') + (no ? ' · no new scanners' : '') + '</span>' +
        '<button type="button" data-g="' + g.id + '" data-d="-1" aria-label="One fewer: ' + NAMES[g.id] + '">−</button><span class="fy-n" id="fyN' + g.id + '">' + g.tools + '</span>' +
        '<button type="button" data-g="' + g.id + '" data-d="1" aria-label="One more: ' + NAMES[g.id] + '"' + (no ? ' aria-disabled="true"' : '') + '>+</button>' +
        '<span class="fy-pct">' + Math.round(u * 100) + '%</span><span class="fy-u"><i style="width:' + Math.min(100, u * 100) + '%"></i></span></div>';
    }).join('');
    /* the queueing formula, with the bottleneck's own numbers */
    const b = sum.groups.find(g => g.id === sum.bottleneck), bg = L.find(g => g.id === sum.bottleneck), v2 = st.ai ? 1.0 : 1.5;
    $('#fyEq').innerHTML = 'wait ≈ (ca² + cs²)/2 · u<sup>√(2(m+1))−1</sup> / (m(1−u)) · t' +
      '<small>At the bottleneck, ' + NAMES[bg.id].split(' (')[0].toLowerCase() + ': ca² = cs² = ' + v2 + (st.ai ? ' (AI on)' : '') + ', u = ' + Math.round(b.u * 100) + '% busy, m = ' + bg.tools + ' machines, t = ' + fmt(b.te, 2) + ' h a visit → wait ≈ ' + fmt(wait(b.u, bg.tools, b.te, { ca2: v2, cs2: v2 }), 1) + ' h, ' + b.n + ' times per chip.</small>';
    drawCurve(); inno(sum); eco(sum);
  }
  /* innovations: compared with the fab as you found it (EUV, no AI), at the same starts */
  function inno(sum) {
    const N = layers(), base = line(st.tools, { print: 'euv', ai: false }), b = summary(base, N, sum.starts);
    const pr = line(st.tools, { print: st.print, ai: false }), sp = summary(pr, N, sum.starts);
    $('#fyDPrint').innerHTML = st.print === 'euv' ? 'This is the fab as you found it.' :
      'Machine visits per chip: ' + visitsPerChip(base) + ' → <b>' + visitsPerChip(pr) + '</b> · most it can make: ' + fmt(capacity(base, N) * LOT, 1) + ' → <b>' + fmt(capacity(pr, N) * LOT, 1) + '</b> wafers a day · each chip: ' + fmt(b.days) + ' → <b>' + fmt(sp.days) + '</b> days · bottleneck: ' + NAMES[sp.bottleneck].split(' (')[0].toLowerCase() + '. ' +
      (st.print === 'highna' && st.prod !== 'ai' ? 'High-NA only pays off on the very finest layers of the newest chips: try the AI chip.' : st.print === 'duv' && st.prod === 'mature' ? 'An older car chip never needed EUV: for it, 193 nm light is cheaper and quicker.' : st.print === 'highna' ? 'The finest layers of the AI chip no longer need a second EUV pattern.' : 'Every fine layer now needs a second pattern: deposit, print and etch again.');
    const ai = summary(line(st.tools, { print: st.print, ai: true }), N, sum.starts), noai = summary(line(st.tools, { print: st.print, ai: false }), N, sum.starts);
    $('#fyDAi').innerHTML = 'At your starts, each chip: <b>' + fmt(noai.days) + '</b> days without AI, <b>' + fmt(ai.days) + '</b> with it' + (isFinite(ai.days) && isFinite(noai.days) ? ' (' + Math.round((1 - ai.days / noai.days) * 100) + '% faster)' : '') + ', with the same machines.';
    const m = sum.outWafers * 30; $('#fyMWaf').textContent = fmt(m); $('#fyMX').textContent = fmt(20000 / m);
  }
  function eco(sum) {
    const share = st.shock.pack && st.prod === 'ai' ? 0.8 : 1;
    $('#fyEOut').textContent = fmt(sum.outWafers, 1); $('#fyShip').textContent = fmt(sum.outWafers * share, 1); $('#fyShip').classList.toggle('fy-bad', share < 1);
    $('#fyENote').textContent = st.shock.pack ? (st.prod === 'ai' ? 'Packaging can take about 80% of the AI-chip wafers (an illustrative share): the rest wait as finished wafers, however well the fab runs.' : 'Phone and car chips use other packaging lines, so a CoWoS shortage does not stop them. Try the AI chip.') :
      st.shock.asml ? 'With no new scanners, the fab can never grow past what its scanners can print. Try adding machines.' : 'Every wafer the fab makes depends on all of these. Two of them can be stopped.';
  }
  const cv = $('#fyCv');
  function drawCurve() {
    if (!lastSum) return;
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const N = layers(), pts = curve(L, N, 60, 0.985), maxD = Math.max(220, N * 3), X = l => 34 + (w - 44) * l, Y = v => h - 20 - (h - 30) * Math.min(1, v / maxD);
    c.strokeStyle = T.line; c.lineWidth = 1; c.font = '10.5px IBM Plex Mono, monospace'; c.fillStyle = T.muted;
    [0, 0.5, 1].forEach(l => { c.beginPath(); c.moveTo(X(l), h - 20); c.lineTo(X(l), 8); c.stroke(); c.fillText(Math.round(l * 100) + '% full', X(l) - (l ? 34 : 0), h - 5); });
    [100, 200].forEach(v => { if (v < maxD) c.fillText(v + ' d', 0, Y(v) + 4); });
    c.strokeStyle = T['amber-fill']; c.lineWidth = 2.4; c.beginPath(); pts.forEach((p, i) => { i ? c.lineTo(X(p.load), Y(p.days)) : c.moveTo(X(p.load), Y(p.days)); }); c.stroke();
    c.fillStyle = T.ink; c.beginPath(); c.arc(X(lastSum.load), Y(lastSum.days), 5, 0, 7); c.fill(); c.fillStyle = T.muted; c.fillText('time in the fab', 38, 16);
  }
  watch(cv, drawCurve);

  /* ---------------- cross-section of the followed box ---------------- */
  const xs = $('#fyXs');
  function drawSection() {
    const { ctx: c, w: w0, h } = fit(xs); c.clearRect(0, 0, w0, h);
    const lot = S && S.lots.find(l => l.id === watchId); if (!lot) return;
    const N = layers(), li = Math.min(lot.layer, N - 1), front = Math.round(0.25 * N), show = 10, first = Math.max(0, li - show + 1), bandH = (h - 46) / show, w = w0 - 26;
    const where = whereOf(lot), gId = L[where.gi].id, waiting = where.wait, order = L.map(g => g.id), stepIdx = order.indexOf(gId);
    c.fillStyle = '#7E8C96'; c.fillRect(0, h - 26, w0, 26); c.fillStyle = '#fff'; c.font = '11px IBM Plex Mono, monospace'; c.fillText(first === 0 ? 'silicon wafer' : '… ' + first + ' layers below', 8, h - 9);
    for (let i = first; i <= li; i++) {
      const y = h - 26 - (i - first + 1) * bandH, isFront = i < front, cur = i === li, prog = cur ? (waiting ? stepIdx - 0.5 : stepIdx) : 99, did = id => prog >= order.indexOf(id);
      if (cur && !did('depo')) continue;
      c.fillStyle = isFront ? '#5A7D8C' : '#A9C8DA'; c.fillRect(0, y, w, bandH - 1);
      const pitch = isFront ? 18 : 10 + Math.floor((i - front) / (N - front) * 30);
      if (did('etch')) for (let x = 4; x < w; x += pitch) { c.fillStyle = isFront ? '#C9853A' : '#D08A3E'; const lw = pitch * 0.45; if (isFront) c.fillRect(x, y + bandH * 0.25, lw, bandH * 0.75); else c.fillRect(x, y + 1, lw, bandH - 2); }
      if (cur && did('litho') && !did('clean')) {
        c.fillStyle = 'rgba(122,91,224,.85)'; c.fillRect(0, y - bandH * 0.45, w, bandH * 0.45);
        if (gId === 'litho' || did('etch')) for (let x = 4; x < w; x += pitch) c.clearRect(x, y - bandH * 0.45, pitch * 0.45, bandH * 0.45);
        if (gId === 'litho' && !waiting) { c.fillStyle = 'rgba(170,150,255,.35)'; for (let x = 4; x < w; x += pitch) c.fillRect(x, 0, pitch * 0.45, y); }
      }
      if (cur && gId === 'implant' && !waiting) { c.fillStyle = '#F2B53C'; for (let k = 0; k < 40; k++) c.fillRect(Math.random() * w, y + Math.random() * bandH, 2, 2); }
      if (cur && gId === 'anneal' && !waiting) { c.fillStyle = 'rgba(240,90,60,.25)'; c.fillRect(0, y, w, bandH); }
      if (cur && gId === 'metro' && !waiting) { c.strokeStyle = '#33d17a'; c.lineWidth = 2; c.strokeRect(1, y, w - 2, bandH - 1); }
    }
    c.fillStyle = T.ink; c.font = '600 12px IBM Plex Sans, sans-serif'; c.fillText('Layer ' + (li + 1) + ' of ' + N + (li < front ? ' · transistors (front end)' : ' · wiring (back end)'), 8, 16);
    /* the whole chip: one tick per layer, the finished ones filled */
    const bx = w0 - 16, bt = 26, bb = h - 30, th = (bb - bt) / N;
    for (let i = 0; i < N; i++) { const y = bb - (i + 1) * th; c.fillStyle = i < li ? (i < front ? '#5A7D8C' : '#D08A3E') : i === li ? '#2FC4D2' : T.line; c.fillRect(bx, y, 10, Math.max(1, th - 0.6)); }
    $('#fyNow').innerHTML = (waiting ? 'Waiting in the ' + INFO[gId].name.toLowerCase() + ' stocker for a free machine' : '<b>' + INFO[gId].t + '</b> · ' + STEP_WORDS[gId]) + '. ' + Math.round(li / N * 100) + '% built.';
  }
  watch(xs, drawSection);

  /* ---------------- controls ---------------- */
  /* follow a box about a third of the way through, so its chip already has layers to see */
  function pickWatch() { if (!S.lots.length) return; const goal = layers() * 0.3; watchId = S.lots.reduce((a, b) => Math.abs(b.layer - goal) < Math.abs(a.layer - goal) ? b : a).id; }
  function restart() {
    L = mkLine(); S = startState(L, 11); const s = starts(), warm = Math.min(3000, (summary(L, layers(), s).days || 100) * 24 * 1.05);
    for (let t = 0; t < warm; t += 1) step(S, L, layers(), s, 1);
    if (G) G.resetFoups();
    pickWatch();
  }
  const status = m => { $('#fyStatus').textContent = m; };
  $$('#fyProd button').forEach(b => b.addEventListener('click', () => { st.prod = b.dataset.p; press('#fyProd button', x => x === b); restart(); readouts(); drawSection(); }));
  $('#fyLoad').addEventListener('input', e => { st.load = +e.target.value / 100; readouts(); });
  $$('#fyQ1 button').forEach(b => b.addEventListener('click', () => {
    press('#fyQ1 button', x => x === b);
    const s = $('#fyQ1S'), right = b.dataset.a === '100';
    s.textContent = right ? (st.prod === 'ai' ? 'Yes: once for every layer.' : 'Yes. Now pick the AI chip and watch its box come back.') : 'Not quite. Watch the box you follow: how often is it back in the yellow bay?';
    s.classList.toggle('ok', right);
  }));
  $('#fyTools').addEventListener('click', e => {
    const b = e.target.closest('button[data-g]'); if (!b) return; const g = b.dataset.g, d = +b.dataset.d;
    if (b.getAttribute('aria-disabled') === 'true') { status('No new scanners can arrive: ASML has stopped shipping, and no one else makes them.'); if (b.animate && !RM) b.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], { duration: 220 }); return; }
    const was = st.tools[g]; st.tools[g] = Math.max(1, Math.min(MAXT[g], was + d));
    status(st.tools[g] === was ? (d > 0 ? 'That bay is full.' : 'Every group needs at least one machine.') : '');
    if (st.tools[g] === was) return;
    /* keep the boxes already at machines; any on a removed machine go back to the queue */
    const old = S; L = mkLine();
    S.tools = L.map((gg, gi) => Array.from({ length: gg.tools }, (_, k) => (old.tools[gi] || [])[k] || null));
    old.tools.forEach((Tg, gi) => Tg.slice(L[gi].tools).forEach(j => { if (j) S.queues[gi].unshift(j.lot); }));
    if (G) G.buildMachines(); readouts();
  });
  $('#fyReset').addEventListener('click', () => { st.tools = { ...BASE }; status(''); restart(); readouts(); });
  $$('#fyPrint button').forEach(b => b.addEventListener('click', () => {
    const s0 = starts(); st.print = b.dataset.x; press('#fyPrint button', x => x === b); L = mkLine();
    /* keep the wafers started per day: the fab now runs fuller or emptier */
    st.load = Math.max(0.1, Math.min(0.99, s0 / capacity(L, layers()))); $('#fyLoad').value = Math.round(st.load * 100);
    INFO.litho.t = { duv: '193 nm immersion scanner and track', euv: 'EUV scanner and track', highna: 'High-NA EUV scanner and track' }[st.print];
    if (G) G.buildMachines(); readouts(); setView('litho');
  }));
  $$('#fyAi button').forEach(b => b.addEventListener('click', () => { st.ai = b.dataset.x === '1'; press('#fyAi button', x => x === b); L = mkLine(); readouts(); }));
  $('#fyEco').addEventListener('click', e => {
    const sh = e.target.closest('[data-shock]');
    if (sh) { st.shock[sh.dataset.shock] = !st.shock[sh.dataset.shock]; ecoList(); readouts(); setView('eco'); return; }
    const c = e.target.closest('[data-e]'); if (c) { setView('eco'); showEco(c.dataset.e); }
  });
  $$('#fySpeed button').forEach(b => b.addEventListener('click', () => { st.speed = +b.dataset.s; press('#fySpeed button', x => x === b); }));
  $$('.fy-views [data-v]').forEach(b => b.addEventListener('click', () => { if (b.dataset.v === 'follow') pickWatch(); setView(b.dataset.v); }));
  if (matchMedia('(pointer: coarse)').matches) $('#fyHint').textContent = 'drag to turn · pinch to zoom · tap a machine';

  depthLab($('.depthlab'), d => { if (d === 3) setView('eco'); else if (view === 'eco') setView('all'); });

  /* ---------------- run, only while the fab is on screen ---------------- */
  const stage = $('#fyStage'); let onScreen = true, last = 0, tick = 0;
  inView(stage, v => { onScreen = v; });
  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden || !onScreen || !stage.offsetParent) { last = 0; return; }
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    let left = dt * st.speed; while (left > 0) { const d = Math.min(0.25, left); step(S, L, layers(), starts(), d); left -= d; }
    if (!S.lots.find(l => l.id === watchId)) pickWatch();
    if (G) G.frame(dt);
    if (++tick % 6 === 0 && lastSum) { if (G) G.tags(lastSum); drawSection(); }
  }
  ecoList(); restart(); readouts(); drawSection();
  requestAnimationFrame(loop);
}
