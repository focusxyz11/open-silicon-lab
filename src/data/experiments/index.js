/* Experiments: the one kind of piece the lab is made of (docs/framework/README.md). An experiment is one small
   question, put to an engine, seen through one way of seeing. Content, pictures, challenges and the community's
   work are made of the same thing, and every experiment reads as a plain document (#/read/<id>).

   One file per world. A world is one of the eleven core questions, kept hidden (its id is its thread's id in
   src/data/weave.js); an experiment's home world is the file it is in, and `also` names other worlds it serves.
   Data only: the words a visitor reads are in src/i18n/en.json.

   - id        world-name, unique
   - strand    which of the world's strands it belongs to (0..4); worked out ways on prefer the same strand
   - stops     the stops it gathers ('thread.depth', src/data/weave.js): the levels where it is seen, each with
               its own question, its note (something true to notice) and what people try. Every stop is in
               exactly one experiment. The cases and figures of its stops are its own.
   - at        levels or steps it is about, when it has no stops (depth ids of the weave)
   - ask       the question is exp.<id>.ask when that text exists, otherwise its first stop's question. An
               experiment with no stop must have words of its own
   - engine    the engine that judges it (src/data/layers.js), or null: then it is only words
   - wants     what it waits for when it cannot be done yet: an engine id that is missing, 'part' (its engine
               exists but cannot work this out yet) or 'outside' (it needs real cases, sources or people)
   - lens      the way of seeing it is best shown through
   - ch        the challenges that put a target on it (src/v2/game.js): then it is played
   - probe     1 when a try of its engine sits on its own page (src/v2/probes.js)
   - go        an address where it can be done on the site today, besides a challenge or a try
   - trade     measures that move · given: what it stands on · open: directions being tried
   - figures, cases: beyond its stops' own · debate: an open argument it raises (src/data/debates.js)

   What is not here is worked out (src/engines/experiments.js): its state (live, ready, words, wanted), the tries
   of its stops, and its ways on. */
import think from './think.js';
import strange from './strange.js';
import limit from './limit.js';
import fail from './fail.js';
import idea from './idea.js';
import make from './make.js';
import know from './know.js';
import open from './open.js';
import divide from './divide.js';
import life from './life.js';
import scale from './scale.js';

export const BY_WORLD = { think, strange, limit, fail, idea, make, know, open, divide, life, scale };
export const EXPERIMENTS = Object.entries(BY_WORLD).flatMap(([world, L]) => L.map(x => Object.assign({ world }, x)));
