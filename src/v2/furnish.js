/* Furnishing, drawn small but whole, shared by the island (src/v2/map3d.js) and the studio walked inside
   (src/v2/studio3d.js), so a room seen from outside and the same room walked through are one room: the same desks,
   screens, chairs, plants and people, from one plan (src/data/studio.js).

   Screens show the work in shapes, never words (words are HTML over the scene): code as indented lines, a simulation
   as waveforms, the circuit as gates, the layout as its two metals, a rack's front as its servers, a mask as its
   chrome pattern on glass. People are figures in muted clothes, standing or seated; nothing cartoonish. */
import { THREE, mat, metal, box, cyl, group, rnd } from './kit3d.js';
import { cornerOf } from '../data/studio.js';

/* three overlapping faceted balls in one geometry: a tree crown, or a plant's leaves, with an outline */
export function lump() {
  const parts = [[0, 0, 0, 1], [0.55, -0.15, 0.25, 0.72], [-0.5, -0.2, -0.3, 0.68]].map(([x, y, z, r]) => { const g = new THREE.IcosahedronGeometry(r, 1); g.translate(x, y, z); return g.index ? g.toNonIndexed() : g; });
  const n = parts.reduce((a, g) => a + g.attributes.position.count, 0), pos = new Float32Array(n * 3);
  let o = 0; parts.forEach(g => { pos.set(g.attributes.position.array, o); o += g.attributes.position.array.length; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}

/* the furnishing in one palette: P the palette, night, leaf the colour of plants */
export function furnisher(P, night, leaf) {
  const TEX = {};
  const screenTex = kind => {
    if (TEX[kind]) return TEX[kind];
    const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'), R = (i, k) => rnd(i * 7 + kind.length, k);
    x.fillStyle = kind === 'rack' ? '#1a1f28' : '#0d1522'; x.fillRect(0, 0, 256, 160);
    if (kind === 'code') for (let i = 0; i < 14; i++) { const ind = [0, 1, 2, 2, 1, 2, 3, 3, 2, 1, 0, 1, 2, 1][i] * 14; x.fillStyle = ['#7fb6ff', '#e8c56a', '#8fd6b0', '#c9d3e6'][i % 4]; x.fillRect(14 + ind, 10 + i * 10.5, 30 + R(i, 1) * 120, 5); }
    if (kind === 'wave') { x.lineWidth = 2; for (let r = 0; r < 6; r++) { x.strokeStyle = r % 2 ? '#5ee0a0' : '#7fb6ff'; x.beginPath(); let hi = R(r, 2) > 0.5; x.moveTo(8, 18 + r * 24 + (hi ? 0 : 12)); for (let k = 1; k < 16; k++) { const nx = 8 + k * 15.5; x.lineTo(nx, 18 + r * 24 + (hi ? 0 : 12)); if (R(r * 20 + k, 3) > 0.55) { hi = !hi; x.lineTo(nx, 18 + r * 24 + (hi ? 0 : 12)); } } x.stroke(); } }
    if (kind === 'gates') { x.strokeStyle = '#66d0e0'; x.lineWidth = 2; for (let i = 0; i < 6; i++) { const gx = 30 + (i % 3) * 76, gy = 30 + Math.floor(i / 3) * 70; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + 18, gy); x.arc(gx + 18, gy + 16, 16, -Math.PI / 2, Math.PI / 2); x.lineTo(gx, gy + 32); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(gx - 16, gy + 8); x.lineTo(gx, gy + 8); x.moveTo(gx - 16, gy + 24); x.lineTo(gx, gy + 24); x.moveTo(gx + 34, gy + 16); x.lineTo(gx + 58, gy + 16); x.stroke(); } }
    if (kind === 'layout') { for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(90,169,255,.85)'; x.fillRect(0, 8 + i * 13, 256, 5); } for (let i = 0; i < 18; i++) { x.fillStyle = 'rgba(224,136,79,.8)'; x.fillRect(6 + i * 14, 0, 5, 160); } for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(94,224,160,.7)'; x.fillRect(R(i, 4) * 240, R(i, 5) * 150, 10, 6); } }
    if (kind === 'rack') for (let u = 0; u < 20; u++) { x.fillStyle = u % 5 === 4 ? '#11151c' : '#2a313d'; x.fillRect(6, 4 + u * 7.6, 244, 6.4); for (let k = 0; k < 3; k++) { x.fillStyle = R(u * 3 + k, 6) > 0.3 ? (k === 0 ? '#45d08a' : '#5aa9ff') : '#333'; x.fillRect(224 + k * 8, 5.5 + u * 7.6, 4, 3); } x.fillStyle = '#151a22'; for (let h = 0; h < 22; h++) x.fillRect(14 + h * 9, 5 + u * 7.6, 5, 4.4); }
    if (kind === 'back') { x.fillStyle = '#161a21'; x.fillRect(0, 0, 256, 160); for (let i = 0; i < 4; i++) { x.fillStyle = '#232934'; x.beginPath(); x.arc(40 + i * 58, 40, 20, 0, 7); x.fill(); x.beginPath(); x.arc(40 + i * 58, 112, 20, 0, 7); x.fill(); }
      for (let k = 0; k < 16; k++) { x.strokeStyle = ['#3b8ad9', '#e0b43c', '#45d08a', '#c9d3e6'][k % 4]; x.lineWidth = 1.5; x.beginPath(); x.moveTo(228 + (k % 4) * 6, 0); x.lineTo(228 + (k % 4) * 6, 10 + k * 9); x.lineTo(8 + R(k, 7) * 200, 10 + k * 9); x.stroke(); } }
    /* a mask: the chip's pattern in chrome on a plate of quartz, repeated tile by tile, a frame of chrome round it */
    if (kind === 'mask') { x.fillStyle = '#c9d6dd'; x.fillRect(0, 0, 256, 160); x.fillStyle = '#5b6670'; x.fillRect(10, 10, 236, 140); x.fillStyle = '#d8e3ea';
      for (let ty = 0; ty < 3; ty++) for (let tx = 0; tx < 4; tx++) { const ox = 18 + tx * 57, oy = 18 + ty * 44; x.fillRect(ox, oy, 52, 38); x.fillStyle = '#5b6670';
        for (let k = 0; k < 7; k++) x.fillRect(ox + 4 + k * 7, oy + 4, 3, 22 + Math.round(R(k + tx, 8) * 8)); x.fillRect(ox + 4, oy + 31, 44, 3); x.fillStyle = '#d8e3ea'; } }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return (TEX[kind] = tx);
  };
  const scrM = kind => new THREE.MeshBasicMaterial({ map: screenTex(kind), color: night ? 0xffffff : 0xd8dde6, toneMapped: false });
  const sheet = (g, w, h, kind, x, y, z, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scrM(kind)); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); g.add(m); return m; };
  const CLOTHES = [0x3d5a80, 0x7a5c61, 0x4f6d5a, 0x8a7a5c, 0x5b5f73], SKIN = [0xc99a7a, 0x8d5f45, 0xe2bfa2, 0xa8745a];
  const headG = new THREE.SphereGeometry(0.11, 14, 10);
  const figure = (g, x, z, ry, k, seated) => { const f = group(g, x, 0, z, ry), cl = mat(CLOTHES[k % 5], { roughness: 0.8 });
    if (seated) { box(f, 0.34, 0.12, 0.42, mat(0x2b2f38, { roughness: 0.8 }), 0, 0.46, -0.12, 0.04); box(f, 0.36, 0.52, 0.22, cl, 0, 0.56, 0.08, 0.08); [-0.1, 0.1].forEach(a => box(f, 0.1, 0.46, 0.12, mat(0x2b2f38), a, 0, -0.3, 0.03, { cast: false })); box(f, 0.44, 0.1, 0.3, cl, 0, 0.82, -0.12, 0.04); }
    else { [-0.08, 0.08].forEach(a => box(f, 0.12, 0.8, 0.14, mat(0x2b2f38, { roughness: 0.8 }), a, 0, 0, 0.04)); box(f, 0.38, 0.58, 0.22, cl, 0, 0.8, 0, 0.08); [-0.24, 0.24].forEach(a => box(f, 0.09, 0.52, 0.1, cl, a, 0.84, 0, 0.03)); }
    const hd = new THREE.Mesh(headG, mat(SKIN[k % 4], { roughness: 0.7 })); hd.position.set(0, seated ? 1.22 : 1.52, seated ? 0.06 : 0); hd.castShadow = true; f.add(hd); return f; };
  const chair = (g, x, z, ry) => { const ch = group(g, x, 0, z, ry), dk = mat(P.dark, { roughness: 0.6 }), leg = metal(P.slate);
    cyl(ch, 0.24, 0.24, 0.07, dk, 0, 0.44, 0, 16); box(ch, 0.42, 0.48, 0.06, dk, 0, 0.5, 0.22, 0.03); cyl(ch, 0.03, 0.03, 0.42, leg, 0, 0.02, 0, 8);
    for (let k = 0; k < 5; k++) { const a = k * 1.2566; box(ch, 0.05, 0.03, 0.3, leg, Math.sin(a) * 0.14, 0, Math.cos(a) * 0.14, 0.01, { cast: false }).rotation.y = a; } return ch; };
  /* a workplace: a desk on panel legs, two screens on one stand (or one wide screen: one), a keyboard, a chair, and
     often someone at it */
  let who = 0;
  const workdesk = (g, x, z, ry, kind, seated = true, one = false) => { const d = group(g, x, 0, z, ry), top = mat(night ? 0x8f8270 : 0xd2bf9f, { roughness: 0.55 }), leg = metal(P.slate);
    box(d, 1.6, 0.05, 0.8, top, 0, 0.72, 0, 0.02); [-0.74, 0.74].forEach(a => box(d, 0.05, 0.72, 0.7, leg, a, 0, 0, 0.01, { cast: false }));
    box(d, 0.3, 0.02, 0.18, leg, 0, 0.77, -0.25, 0.01, { cast: false }); box(d, 0.04, 0.2, 0.04, leg, 0, 0.77, -0.3, 0.005, { cast: false });
    if (one) { const mon = group(d, 0, 0.94, -0.28); box(mon, 0.96, 0.58, 0.03, mat(P.dark, { roughness: 0.4 }), 0, -0.03, 0, 0.01, { cast: false }); sheet(mon, 0.9, 0.52, kind, 0, 0.26, 0.017); }
    else [-0.33, 0.33].forEach((mx, i) => { const mon = group(d, mx, 0.94, -0.28, i ? -0.2 : 0.2); box(mon, 0.64, 0.4, 0.03, mat(P.dark, { roughness: 0.4 }), 0, 0, 0, 0.01, { cast: false }); sheet(mon, 0.6, 0.36, kind, 0, 0.2, 0.017); });
    box(d, 0.46, 0.015, 0.15, mat(P.dark), 0, 0.77, 0.12, 0.004, { cast: false });
    chair(d, 0, 0.62, Math.PI); if (seated) figure(d, 0, 0.62, Math.PI, who++, true); return d; };
  const leafG = lump();
  const plant = (g, x, z, s = 1) => { cyl(g, 0.22 * s, 0.17 * s, 0.4 * s, mat(night ? 0x6b5f52 : 0xb7a48d, { roughness: 0.8 }), x, 0, z, 12); const c = new THREE.Mesh(leafG, mat(leaf, { roughness: 0.8 })); c.scale.setScalar(0.42 * s); c.position.set(x, 0.75 * s, z); c.castShadow = true; g.add(c); };

  /* one corner of the studio, furnished at its place in the plan: g is the corner's own group (its middle). The screen
     each bench opens on is where the plan says (src/data/studio.js), facing the walk */
  function corner(g, id) {
    const C = cornerOf(id), S = C && C.screen;
    if (id === 'need') {
      /* the job: a wall of notes, two people at it, and a table to talk round */
      box(g, 4, 2, 0.08, mat(0xf4f3ee, { roughness: 0.5 }), 0, 0.7, -2.6, 0.02);
      for (let i = 0; i < 14; i++) box(g, 0.34, 0.34, 0.03, mat([0xe8c86a, 0x9cc7e0, 0xe9a38c, 0xa8d4a0][i % 4]), -1.6 + (i % 7) * 0.52, 1.05 + Math.floor(i / 7) * 0.62 + rnd(i, 9) * 0.1, -2.54, 0.01, { cast: false });
      figure(g, -1.5, -1.8, Math.PI, 1, false); figure(g, 1.4, -1.6, Math.PI + 0.4, 2, false);
      cyl(g, 0.85, 0.85, 0.05, mat(night ? 0x8f8270 : 0xd2bf9f, { roughness: 0.55 }), 0, 0.72, 0.4, 28); cyl(g, 0.06, 0.1, 0.72, metal(P.slate), 0, 0, 0.4, 8);
      [0.4, 2.5, 4.6].forEach((a, i) => { chair(g, Math.cos(a) * 1.25, 0.4 + Math.sin(a) * 1.25, -a - Math.PI / 2); if (i === 1) figure(g, Math.cos(a) * 1.25, 0.4 + Math.sin(a) * 1.25, -a - Math.PI / 2, 3, true); });
      plant(g, 1.9, -2.2, 1.2);
    } else if (id === 'logic') {
      /* describe: four desks of people writing the circuit as text, all facing the walk; the near one on the left is
         free, its one wide screen waiting for your description */
      [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([dx, dz], i) => workdesk(g, dx, dz, 0, 'code', i !== 2, i === 2));
    } else if (id === 'check') {
      /* check: the machines that run every case, a wall of results, and someone watching them */
      /* the machines stand in a row at the side, their fronts to the room, so nothing hides the wall from the walk */
      [-2.0, -1.0, 0].forEach(dz => { box(g, 0.7, 2.2, 0.9, mat(P.rack, { roughness: 0.5 }), -2.05, 0, dz, 0.04); sheet(g, 0.8, 2, 'rack', -1.69, 1.1, dz, Math.PI / 2); });
      box(g, 3, 1.44, 0.06, mat(P.dark), 0, 0.88, -2.6, 0.02); sheet(g, S.w, S.h, 'wave', 0, S.at[1], S.at[2]);
      workdesk(g, 1.2, 0.7, Math.PI, 'wave');
    } else if (id === 'gates') {
      /* gates: the program's drawing of the circuit, on every screen; the free desk on the right is yours */
      [[-0.9, -0.4], [0.9, -0.4], [-0.9, 1.3]].forEach(([dx, dz], i) => workdesk(g, dx, dz, i < 2 ? 0 : Math.PI, 'gates', i !== 1, i === 1));
    } else if (id === 'layout') {
      /* layout: a table that is a screen, the tile's two metals on it, and two people leaning over it */
      box(g, 3.2, 0.86, 1.8, mat(P.dark, { roughness: 0.4 }), 0, 0, 0, 0.06); sheet(g, 3, 1.6, 'layout', 0, 0.87, 0, 0, -Math.PI / 2);
      figure(g, -1.9, 0.4, -Math.PI / 2, 0, false); figure(g, 1.0, -1.2, 0, 4, false); plant(g, 1.9, -1.4);
    } else if (id === 'masks') {
      /* the masks: a light table with a mask on it, the racks the finished masks wait in, someone checking one */
      box(g, 1.9, 0.86, 1.3, mat(P.slate, { roughness: 0.5 }), 0, 0, 0, 0.04);
      box(g, 1.7, 0.04, 1.1, mat(0xf2f6f8, { emissive: 0xf2f6f8, emissiveIntensity: night ? 0.7 : 0.25, roughness: 0.3 }), 0, 0.86, 0, 0.01, { cast: false });
      sheet(g, S.w, S.h, 'mask', 0, S.at[1], 0, 0, -Math.PI / 2);
      [-1.4, 1.4].forEach((rx, r) => { box(g, 2.2, 1.9, 0.5, metal(P.slate, { roughness: 0.5 }), rx, 0, -2.6, 0.03);
        for (let k = 0; k < 6; k++) box(g, 0.5, 0.5, 0.42, mat((k + r) % 4 ? 0xd9dcd6 : P.accent, { roughness: 0.5 }), rx - 0.66 + (k % 3) * 0.66, 0.25 + Math.floor(k / 3) * 0.8, -2.5, 0.02, { cast: false }); });
      figure(g, -1.3, 0.5, Math.PI / 2, 2, false);
    }
  }
  return { screenTex, scrM, sheet, figure, chair, workdesk, plant, corner, CLOTHES, SKIN, headG };
}
