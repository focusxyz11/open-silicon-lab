/* Design rules and masks: what the factory asks of a layout before it will make it. Pure logic, no DOM; tests
   in tests/rules.test.mjs.

   A layout is a drawing, layer by layer, of where every piece of a chip goes. The factory can print only some
   drawings: lines too thin break, lines too close run together, a via (a small plug joining two layers of metal)
   too near another one merges with it. It writes these limits down as design rules, in its process design kit
   (PDK: the factory's kit for designers, with its cells, its rules and models of how its parts behave), and a
   program checks every shape of a layout against them before the masks are made (a design rule check, DRC).
   A few such rules, in the tile's own terms, are checked here.

   The tile: the gates placed in rows and joined on two layers of metal by the tiny-chip engine
   (src/engines/tinychip.js place and route), read from a design built by src/engines/design.js (B.PL, B.RT).
   Its wires are drawn on a grid of tracks, one track apart, so a wire on a track keeps its width and its
   spacing by construction; the rules that are left are the ones the grid cannot promise.

   Masks: each layer the factory prints needs a mask (a plate of glass and chrome that lets light through in the
   shape of the layer). A design draws only some of them; the cells bring most, already drawn by the library's
   makers; the rest belong to the process: the upper metals, the pads, and layers other designs on the same
   wafer need. maskSet() splits SKY130's own list of masks (the PDK's masks table, 34 marked as used in SKY130)
   that way; the grouping is the lab's reading of that list, not a table the factory publishes. */

/* ---- design rules ---- */
/* the lab's antenna limit: wire, in tracks, that one gate input may collect before it needs a diode. While a
   layer is being etched its wires gather charge; a long wire ending only on a gate can discharge through the
   gate's thin oxide and break it. Real limits are ratios of metal area to gate area, set per layer in the PDK. */
export const ANTENNA_TRACKS = 60;
/* Each rule: id (words studio.rule.<id>), and whether it is the factory's own kind of rule or a check that the
   drawing is whole (connected). */
export const RULES = [
  { id: 'grid', kind: 'factory' },     /* every wire on a track: its width and spacing kept */
  { id: 'short', kind: 'factory' },    /* no two nets touch on one layer */
  { id: 'via', kind: 'factory' },      /* vias of different nets never on neighbouring tracks */
  { id: 'overlap', kind: 'factory' },  /* no two cells overlap in a row */
  { id: 'inside', kind: 'factory' },   /* every cell inside the tile */
  { id: 'antenna', kind: 'factory' },  /* no wire too long for the gates it ends on */
  { id: 'open', kind: 'whole' }        /* every net joined: nothing left unconnected */
];

const decode = (i, GW) => { const l = i % 2, c = (i - l) / 2, x = c % GW; return { x, y: (c - x) / GW, l }; };

/* Check a tile. PL: the placement, RT: the routing. Returns one result per rule: { id, ok, n, at: [{ x, y }] }
   (n: how many places break it; at: up to a few of them, in grid units, for drawing). */
export function checkRules(PL, RT, M) {
  const GW = RT.GW, H = RT.H, res = {};
  const put = (id, pts) => { res[id] = { id, ok: pts.length === 0, n: pts.length, at: pts.slice(0, 8) }; };
  /* grid: every step of every wire is one track along its layer's direction, or a via straight up or down */
  const off = [], used = new Map(), vias = new Map();
  Object.entries(RT.paths).forEach(([net, segs]) => segs.forEach(path => path.forEach((p, k) => {
    const a = decode(p, GW);
    if (a.x < 0 || a.x >= GW || a.y < 0 || a.y >= H) off.push({ x: a.x, y: a.y });
    const key = a.l + ':' + a.x + ':' + a.y, was = used.get(key);
    if (was == null) used.set(key, +net); else if (was !== +net) used.set(key, -1);
    if (!k) return;
    const b = decode(path[k - 1], GW), dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    if (a.l !== b.l) { if (dx || dy) off.push({ x: a.x, y: a.y }); else vias.set(a.x + ':' + a.y, +net); }
    else if (a.l === 0 ? !(dx === 1 && dy === 0) : !(dy === 1 && dx === 0)) off.push({ x: a.x, y: a.y });
  })));
  put('grid', off);
  put('short', [...used.entries()].filter(([, n]) => n === -1).map(([k]) => { const [, x, y] = k.split(':').map(Number); return { x, y }; }));
  /* via spacing: a via beside another net's via, on one of the four neighbouring tracks (each pair once) */
  const close = [];
  vias.forEach((net, k) => { const [x, y] = k.split(':').map(Number);
    [[1, 0], [0, 1]].forEach(([dx, dy]) => { const o = vias.get((x + dx) + ':' + (y + dy)); if (o != null && o !== net) close.push({ x, y }); }); });
  put('via', close);
  /* cells: inside the tile's rows, and never on top of each other */
  const cells = Object.entries(PL.pos).map(([i, p]) => ({ i: +i, x: p.x, r: p.r, w: p.w }));
  put('inside', cells.filter(c => c.x < 0 || c.x + c.w > PL.W || c.r < 0 || c.r >= PL.rows).map(c => ({ x: c.x + 2, y: c.r * PL.TR + 2 })));
  const lap = [];
  for (let r = 0; r < PL.rows; r++) { const row = cells.filter(c => c.r === r).sort((a, b) => a.x - b.x);
    for (let k = 1; k < row.length; k++) if (row[k].x < row[k - 1].x + row[k - 1].w) lap.push({ x: row[k].x + 2, y: r * PL.TR + 2 }); }
  put('overlap', lap);
  /* antenna: a net's wire per gate input it ends on */
  const sinks = {};
  if (M) M.cells.forEach(c => c.ins.forEach(n => { sinks[n] = (sinks[n] || 0) + 1; }));
  const ant = [];
  Object.entries(RT.paths).forEach(([net, segs]) => {
    let len = 0, first = null;
    segs.forEach(path => { for (let k = 1; k < path.length; k++) if (path[k] % 2 === path[k - 1] % 2) len++; if (!first && path.length) first = decode(path[0], GW); });
    const g = sinks[net] || 0;
    if (g && len > ANTENNA_TRACKS * g) ant.push({ x: first.x, y: first.y, net: +net, len });
  });
  put('antenna', ant);
  /* open: every net the router could not finish */
  put('open', (RT.failed || []).map(n => { const L = RT.P && RT.P[n]; return L && L[0] ? { x: L[0].x, y: L[0].y } : { x: 0, y: 0 }; }));
  return RULES.map(r => Object.assign({ kind: r.kind }, res[r.id]));
}

/* a design's tile, checked: null when it has no layout yet */
export const rulesOf = B => (B && B.PL && B.RT ? checkRules(B.PL, B.RT, B.M) : null);
export const allKept = R => !!R && R.every(r => r.ok);

/* ---- masks ---- */
/* SKY130's masks, as its PDK lists those used on the node (docs/rules/masks.csv in the SkyWater PDK), each by its
   acronym, in the order they are printed, grouped by what they make. */
export const SKY130_MASKS = [
  /* the transistors: wells, the thin oxide, the gates (poly) and the implants that make sources and drains;
     drawn inside every cell by the library's makers, or worked out by the factory from what the cells draw */
  { g: 'transistors', m: ['FOM', 'NWM', 'HVTPM', 'LVTNM', 'LVOM', 'P1M', 'NTM', 'LDNTM', 'NPCM', 'PSDM', 'NSDM'] },
  /* the cells' own wiring: contacts, the local interconnect and the first metal */
  { g: 'cellwires', m: ['LICM1', 'LI1M', 'CTM1', 'MM1'] },
  /* the wires a design draws between its cells (on the lab's tile: across on one layer, up and down on the next) */
  { g: 'yours', m: ['VIM', 'MM2', 'VIM2', 'MM3'] },
  /* the upper metals: the chip's power grid and its long wires */
  { g: 'upper', m: ['VIM3', 'MM4', 'VIM4', 'MM5'] },
  /* the chip's edge and its way out: the seal ring, the pad openings, and layers for packaging */
  { g: 'outside', m: ['NSM', 'PDM', 'PBO', 'CU1M', 'PMM2'] },
  /* parts other designs on the same wafer may need: deep wells, flash memory, high-voltage parts, resistors */
  { g: 'others', m: ['DNM', 'HVTRM', 'TUNM', 'ONOM', 'HVNTM', 'RPM'] }
];
export const SKY130_TOTAL = SKY130_MASKS.reduce((a, x) => a + x.m.length, 0);

/* The masks a design's tile needs, against the process's own: each group with its masks, and which of them this
   design draws itself (its routing: a via from the cells' first metal, the layer across, a via, the layer up and
   down, each only if the router used it). */
export function maskSet(B) {
  const rt = B && B.RT, segs = rt ? Object.values(rt.paths).flat() : [];
  const uses = { MM2: false, MM3: false, VIM2: false, VIM: segs.length > 0 };
  segs.forEach(p => { for (let k = 0; k < p.length; k++) { const l = p[k] % 2; if (l === 0) uses.MM2 = true; else uses.MM3 = true; if (k && l !== p[k - 1] % 2) uses.VIM2 = true; } });
  const groups = SKY130_MASKS.map(x => ({ id: x.g, masks: x.m.slice(), n: x.m.length, drawn: x.g === 'yours' ? x.m.filter(m => uses[m]) : [] }));
  const drawn = groups.reduce((a, g) => a + g.drawn.length, 0);
  return { total: SKY130_TOTAL, groups, drawn, cells: B && B.M ? B.M.cells.length : 0 };
}
