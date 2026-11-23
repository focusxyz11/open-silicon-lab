/* The labs of the challenge player, by kind (src/v2/play.js): each is a module of its own, lab(L) -> { draw, click,
   input }, so a new lab is a new file here and a line below. */
import agent from './agent.js';
import teardown from './teardown.js';
import evolve from './evolve.js';
import crystal from './crystal.js';
import implant from './implant.js';
import overlay from './overlay.js';
import films from './films.js';
import litho from './litho.js';
import cim from './cim.js';
import grover from './grover.js';
import semiconductor from './semiconductor.js';
import aibuild from './aibuild.js';
import clockpower from './clockpower.js';
import analog from './analog.js';
import serve from './serve.js';
import bench from './bench.js';
import bits from './bits.js';
import vote from './vote.js';
import mortal from './mortal.js';
import dies from './dies.js';
import errors from './errors.js';
import rv from './rv.js';
/* labs-a: design it or search for it (search.js), the program nobody can judge (halt.js) */
import search from './search.js';
import halt from './halt.js';
/* labs-b: let the noise compute (pbits.js), a thousand that pass (thousand.js) */
import pbits from './pbits.js';
import thousand from './thousand.js';
/* Listen and tell, the ear test (#316, behind ?listen=1) */
import listen from './listen.js';
export const LABS = { agent, teardown, fit: teardown, evolve, pull: crystal, implant, overlay, etch: films, deposit: films, litho, euv: litho,
  cim, grover, semiconductor, aibuild, powercurve: clockpower, counter: clockpower, capture: analog, regulate: analog, quantize: serve, tokenenergy: serve, prefill: serve,
  piece: bench, floor: bench, maskof: bench, chef: bits, redund: vote, mortal, xray: dies, errors, rv,
  search, halt,
  pbits, thousand,
  listen };
