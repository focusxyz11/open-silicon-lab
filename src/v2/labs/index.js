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
import analog from './analog.js';
export const LABS = { agent, teardown, fit: teardown, evolve, pull: crystal, implant, overlay, etch: films, deposit: films, litho, euv: litho, capture: analog, regulate: analog };
