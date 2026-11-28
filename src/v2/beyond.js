/* What the shell (src/v2/app.js) uses beyond the first page, loaded in one piece when a view that shows it first opens,
   or once the first page has painted (beyond() in app.js), never with the first page (docs/ARCHITECTURE.md, "What
   loads when"): the game's checks and the community's standings (src/v2/game.js: the ledger replayed through the
   engines), the challenge player and the labs (src/v2/play.js), your chip's model, the experiments' states, the slips
   that keep an entry, and what the station map borrows from the reading pages and the frame. Until it is in, the shell
   knows the loop alone (src/v2/loop.js). */
export * as Game from './game.js';
export { useLedger, reportsAt, SAYS, PLACE } from '../engines/ledger.js';
import { settled } from '../engines/ledger.js';
import { summary } from '../engines/population.js';
/* the field of every attempt, in one line for the first page (#480): the current season's scored attempts */
export const fieldSummary = () => { const W = settled(); return summary((W.arch || []).map(id => W.byId[id])); };
export { childrenOf } from '../engines/build.js';
export { model as chipModel } from '../engines/chip.js';
export { EXPERIMENTS, stateOf } from '../engines/experiments.js';
export { signHtml, signOf, keep, refusal, slipHtml, slipClick, byLine } from './commons.js';
export { play, waitHtml, labsLoaded, labsReady } from './play.js';
export { askOf } from './read.js';
export { sizeWords } from './frame.js';
