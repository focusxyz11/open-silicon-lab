/* Plain data of the 3D views that the shell reads before a view is opened: where the island's places stand, the
   data centre's flight levels and their questions, and the chip's layers as made. Kept here, with no three.js, so
   the shell (src/v2/app.js) never imports a 3D module statically: a view's 3D, and three.js with it, loads only
   when that view is first opened (docs/ARCHITECTURE.md). The 3D modules re-export these. */
import { t } from '../core/i18n.js';

/* what a part of a building that opens is called (#/place/fab/etch), on its card (src/v2/app.js, PARTS) and over it on
   the island (src/v2/map3d.js): its level's name, or at the test house and the port the part's own word */
export const shipOrPkg = p => (['trays', 'boxes'].includes(p) ? 'ship' : 'pkg');
export const partName = (place, p) => { if (place !== 'test' && place !== 'port') return t('depth.' + p + '.name');
  const w = t('part.' + (place === 'test' ? 'test' : shipOrPkg(p)) + '.' + p); return w.charAt(0).toUpperCase() + w.slice(1); };

/* the island (src/v2/map3d.js): where every place stands, and how close the camera comes */
export const PLACES = [
  { id: 'studio', at: [-48, -30], d: 76, r: 26 }, { id: 'quarry', at: [-62, -4], d: 56 }, { id: 'fab', at: [-8, -16], d: 72 },
  { id: 'test', at: [22, -2], d: 54 }, { id: 'port', at: [62, 6], d: 66 }, { id: 'datacentre', at: [36, -36], d: 64 },
  { id: 'lab', at: [6, 26], d: 62 }, { id: 'village', at: [-34, 24], d: 60 },
  { id: 'phones', at: [-62, -196], d: 110, far: true }, { id: 'cars', at: [228, -40], d: 110, far: true }, { id: 'idea', at: [180, -116], d: 90, far: true },
  { id: 'tools', at: [-160, -138], d: 100, far: true }, { id: 'materials', at: [-232, -46], d: 100, far: true }, { id: 'power', at: [92, -178], d: 100, far: true }
];

/* the data centre's flight (src/v2/dc3d.js): its levels, and the question asked at each (a stop of one thread, stop.<key>.q) */
export const DC_LEVELS = ['campus', 'hall', 'rack', 'server', 'board', 'chip'];
export const DC_ASKS = { campus: 'life.building', hall: 'divide.building', rack: 'think.rack', server: 'divide.rack', board: 'think.board', chip: 'think.chip' };

/* the chip's layers (src/v2/chip3d.js): each row, the depth you dive to and the factory steps that make it (src/data/weave.js MADE) */
export const CHIP_ROWS = [
  { dive: 'chip', made: ['pkg'] },
  { dive: 'block', made: ['wires'] },
  { dive: 'gate', made: ['print'] },
  { dive: 'switch', made: ['etch'] },
  { dive: 'atom', made: ['crystal', 'implant'] }
];
/* the question at each row, about how it is made (stops: stop.<key>.q); the dive asks its own */
export const CHIP_ASK = ['make.pkg', 'make.wires', 'scale.print', 'make.etch', 'make.implant'];
