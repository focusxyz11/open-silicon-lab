/* The labs: every lab declares itself in a file of its own here, so adding a lab touches its own files, its words and
   src/data/frame.js, and its name below (docs/LABS.md). There is no build step, so a browser cannot list a folder: this
   list is the one place a new lab is named, in an import and in LABS, both at the end; when two branches both add one,
   keep both.

   A lab's file (src/data/labs/<name>.js) holds its challenges, each as the loop reads it, { id, step, place, at, kind,
   grows }, plus:
     opens   the question it opens once won: a stop at its level or the one beside it (src/data/weave.js)
     exp     the experiment it puts a target on (src/data/experiments/): each challenge is in exactly one
     growAt  where its growth stands when not at the challenge's place (the island's other places, src/v2/game.js PLACES)
     after   where it stands in the loop's order (the next thing to do, the lists by step): after that challenge; without
             it, after every challenge named before it
     flag    shown only where the address asks for it (?<flag>=1), as an experiment the owner has not decided on
   and the lab's other files are found by its name:
     src/v2/labs/<name>.js        the lab itself, lab(L) -> { draw, click, input }, playing every kind its challenges have
     src/v2/growers/<name>.js     what each of its challenges grows on the island, and where it stands
     src/styles/labs/<name>.css   its styles, when it has any (css: true), loaded when one of its challenges is played
     scripts/smoke/labs/<name>.mjs  its check in the browser smoke test, each challenge played to its win
   Data only; tests/labs.test.mjs checks every file here is listed and every file a lab names is there. */
import agent from './agent.js';
import teardown from './teardown.js';
import analog from './analog.js';
import bench from './bench.js';
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
import serve from './serve.js';
import bits from './bits.js';
import vote from './vote.js';
import mortal from './mortal.js';
import dies from './dies.js';
import errors from './errors.js';
import rv from './rv.js';
import pbits from './pbits.js';
import thousand from './thousand.js';
import search from './search.js';
import halt from './halt.js';
import listen from './listen.js';
import corearch from './corearch.js';
import spikes from './spikes.js';
import light from './light.js';

export const LABS = [agent, teardown, analog, bench, evolve, crystal, implant, overlay, films, litho, cim, grover, semiconductor,
  aibuild, clockpower, serve, bits, vote, mortal, dies, errors, rv, pbits, thousand, search, halt, listen, corearch, spikes, light];

/* a challenge as the loop reads it (src/v2/game.js CHALLENGES): the rest of a lab's challenge is gathered from it
   (OPENS, GROW_AT, the experiments' challenges, the order) */
const OWN = ['opens', 'exp', 'growAt', 'after'];
export const challengeOnly = c => Object.fromEntries(Object.entries(c).filter(([k]) => !OWN.includes(k)));
/* every lab's challenges, in the order of the list above */
export const LAB_CHALLENGES = LABS.flatMap(l => l.challenges);
/* the kinds a lab plays: its challenges' kinds */
export const kindsOf = l => [...new Set(l.challenges.map(c => c.kind))];
/* the lab that plays a kind */
export const labOfKind = kind => LABS.find(l => l.challenges.some(c => c.kind === kind)) || null;
