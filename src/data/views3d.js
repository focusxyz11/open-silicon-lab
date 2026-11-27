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

/* the island's plan (where every place stands, its coast, its loop road) is plain data with no words: src/data/isle.js,
   which the first page reads too */
export { PLACES, ISLE_COAST, ISLE_ROAD, ISLE_YAW, isleFlat } from './isle.js';

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

/* where the line's camera stands at a station (src/app/journey3d.js), in the station's own metres ([along, up, toward
   the aisle], three.js axes): its eye and the point it looks at. The island's factory stands the same machines
   (src/v2/map3d.js), so going in, the island's camera flies to this eye over the machine it stands, and the line starts
   from where that flight ended; coming out, the island starts where the line's camera was (one camera, no cut) */
export const LINE_EYE = { eye: [1.0, 11.8, 6.4], look: [0.2, 0.2, -2.7] };
