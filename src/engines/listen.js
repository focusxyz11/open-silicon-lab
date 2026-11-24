/* Listen: a level slowed until it can be heard (#316, on for everyone since #317). Pure logic, no DOM, no words (ids only); the
   sound is played by src/v2/sound.js and lit on the picture by src/v2/listen.js; tests in tests/listen.test.mjs.

   At the block, one second of sound is one nanosecond of the chip (TIME_SCALE in src/data/atlas.js): everything is
   slowed a billion times. Every voice plays a number an engine of the lab gives, never one made up here:
   - the clock ticks at the clock of the power curve (src/engines/clockpower.js), slowed: 3 GHz is three ticks a second;
   - a sum is a soft blip on every tick the block works; a fetch from its memory is a deep thump, and for the share of
     time the chef waits the work stops: the kitchen of Keep the chef busy (src/engines/bits.js) at its first level, the
     memory on the chip at the end of a wire, gives how long a trip to the memory takes, how often the door is busy and
     the share of time spent waiting;
   - how loud a blip and a thump are follows their energy (a stated scale, said on screen in one line: the sound's
     power is the energy's, so a fetch that costs n times a sum carries n times its sound energy): a sum's energy from
     the energy budget (src/engines/budget.js), a fetch's from the kitchen's trip, a number of 16 bits;
   - heat is a hum: its loudness follows the block's power (power(), clockpower.js), its pitch the temperature that
     power brings it to (THETA, the model's own: degrees for every watt);
   - noise on the wires is a hiss as loud as the noise the heat makes, against the wire's swing, and a wrong bit is a
     sharp click, as often as that noise carries a bit over the line where 1 begins (cleanOne, src/engines/lens.js, the
     chain of making a clean 1), on each of the block's wires once a tick; the block has no copies to catch one, so
     every wrong bit passes unseen (copies() with the errors puzzle's plan, src/engines/errors.js).

   Four states of the block, each the engines' own inputs (STATE): busy and healthy; waiting on memory (the same
   kitchen five rounds on, the chef faster and the pantry not: the memory wall); too hot, bits going wrong (every part
   busy, so the power and the heat climb); and saving power (half the clock, at the lowest voltage it runs on). The ear
   test (src/v2/labs/listen.js) plays one and asks which. */
import { TIME_SCALE } from '../data/atlas.js';
import { kitchen, ROUNDS } from './bits.js';
import { budget, JOB } from './budget.js';
import { power, lowestSafe } from './clockpower.js';
import { cleanOne } from './lens.js';
import { copies, PLAN as GUARD } from './errors.js';
import { factsOf } from '../data/partfacts.js';

/* the levels that sound, and so show the switch: each needs a line in TIME_SCALE (a test checks it) */
export const LEVELS = ['block'];
export const STATES = ['busy', 'wait', 'hot', 'saving'];
/* the engines' inputs for each state: the power curve's activity (the share of switches flipping each tick) and clock
   (GHz, run at the lowest voltage it is safe at), and the round of the kitchen (0: as the block was designed; the last:
   five rounds later) */
export const STATE = {
  busy: { a: 0.15, f: 3, round: 0 },
  wait: { a: 0.15, f: 3, round: ROUNDS - 1 },
  hot: { a: 0.4, f: 3, round: 0 },
  saving: { a: 0.15, f: 1.5, round: 0 }
};
/* the block's memory is the kitchen's first level: the pantry on the chip, at the end of a 10 mm wire */
export const KITCHEN = 'wire';
/* a fetch brings one number of 16 bits, the energy table's unit */
export const WORD = 16;
/* the block's temperature: the room's, plus THETA degrees for every watt it burns (the model's own round number, so
   the busy block runs warm and the block with every part busy runs hot) */
export const ROOM_C = 25, THETA = 0.63;
/* the sound: a tick and a click are markers (fixed); a blip at REF for a sum, everything else louder by its energy;
   the hum at HUM_REF for the busy block's power; the hiss is the noise's share of a full swing at SWING */
export const SOUND = { tick: { hz: 1400, gain: 0.07, dur: 0.025 }, sum: { hz: 2600, gain: 0.03, dur: 0.035 }, fetch: { hz: 90, dur: 0.24 }, click: { hz: 900, gain: 0.16, dur: 0.04 }, hum: { ref: 0.035 }, hiss: { swing: 0.25 } };

/* how much louder, as a gain, a sound whose energy is k times the reference's: the sound's power is the energy's */
export const louder = k => Math.sqrt(Math.max(0, k));

/* What each voice plays at a level in a state, with the engines' outputs it comes from (inputs). null for a level
   that does not sound or a state that is not one. */
export function voices(state, level = 'block') {
  const S = STATE[state]; if (!S || !LEVELS.includes(level)) return null;
  const scale = TIME_SCALE[level];
  const K = kitchen(KITCHEN, {}), R = K.rounds[S.round];
  const wait = R.wait, busyDoor = R.tFetch / R.t;
  const volt = lowestSafe(S.f), P = power(S.a * (1 - wait), volt, S.f);
  const celsius = ROOM_C + THETA * P.total, C = cleanOne(undefined, celsius, 1);
  const wrong = copies(GUARD.logic, C.measures.misread).silent;
  const B = budget(), sumJ = (B.levels.gate.compute + B.levels.atom.compute) / JOB.ops, fetchJ = K.pantry.j * WORD;
  const ref = power(STATE.busy.a, lowestSafe(STATE.busy.f), STATE.busy.f).total;
  const wires = factsOf(level).parts.filter(p => p.kind === 'wire').reduce((n, p) => n + p.paths.length, 0);
  return {
    state, level, scale,
    clock: { ghz: S.f, perSecond: S.f * 1e9 * scale, ...SOUND.tick },
    sum: { joules: sumJ, ...SOUND.sum },
    fetch: { joules: fetchJ, times: fetchJ / sumJ, gain: SOUND.sum.gain * louder(fetchJ / sumJ), seconds: K.pantry.s / scale, cycle: K.pantry.s / busyDoor / scale, stop: wait * K.pantry.s / busyDoor / scale, wait, hz: SOUND.fetch.hz, dur: SOUND.fetch.dur },
    hum: { watts: P.total, celsius, gain: SOUND.hum.ref * louder(P.total / ref), hz: 80 + 2 * (celsius - ROOM_C) },
    hiss: { noise: C.measures.noise, gain: SOUND.hiss.swing * C.measures.noise },
    wrong: { perWire: wrong, wires, perTick: 1 - Math.pow(1 - wrong, wires), ...SOUND.click },
    inputs: { kitchen: { level: KITCHEN, round: S.round, wait, busyDoor, trip: K.pantry.s }, power: { a: S.a * (1 - wait), volt, f: S.f }, celsius, misread: C.measures.misread }
  };
}

/* a small seeded random number generator, so a score is the same every time it is asked for */
export function seeded(seed) { let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

/* The score: every event of the voices in `seconds` of sound, in time order. Each { t (seconds of sound), v ('tick',
   'sum', 'fetch', 'wrong'), i (which slot, row or wire it lights), and for a fetch dur (the trip) and stop (the wait
   it starts) }. The hum and the hiss are steady (the voices give them). seed varies where things land, never how
   often. ROW_SLOTS: the places a sum can light in a row of the picture. */
export const ROW_SLOTS = 8;
export function score(state, seconds = 12, seed = 1, level = 'block') {
  const V = voices(state, level); if (!V) return null;
  const r = seeded(mix(seed, 7)), F = factsOf(level), rows = F.parts.filter(p => p.kind === 'logic' && p.by === 'program').reduce((n, p) => n + p.rects.length, 0);
  const tick = 1 / V.clock.perSecond, cyc = V.fetch.cycle, stop = V.fetch.stop, ev = [];
  /* the first fetch lands soon after the start, so a short clip always holds one */
  const phase = 0.25 + r() * 0.35, stops = [];
  for (let tf = phase - cyc; tf < seconds; tf += cyc) { if (tf >= 0) ev.push({ t: tf, v: 'fetch', i: Math.floor(r() * rows), dur: V.fetch.seconds, stop }); if (stop > 0) stops.push([tf, tf + stop]); }
  const waiting = t => stops.some(([a, b]) => t >= a && t < b);
  for (let k = 0, t = 0; t < seconds; k++, t = k * tick) {
    ev.push({ t, v: 'tick', i: k });
    const ts = t + tick / 2; if (ts < seconds && !waiting(ts)) ev.push({ t: ts, v: 'sum', i: Math.floor(r() * rows * ROW_SLOTS) });
    for (let w = 0; w < V.wrong.wires; w++) if (r() < V.wrong.perWire) ev.push({ t: t + tick / 4, v: 'wrong', i: w });
  }
  return { state, level, seconds, voices: V, events: ev.sort((a, b) => a.t - b.t) };
}

/* what is heard, said for people who cannot hear it: the events worth a word, as ids ('work', 'fetch', 'wait',
   'wrong'), from the voices of a state */
export const caption = e => (e.v === 'fetch' ? (e.stop > 0 ? 'wait' : 'fetch') : e.v === 'wrong' ? 'wrong' : e.v === 'sum' ? 'work' : null);

/* a seed mixed with a count into another, every bit stirred (a 32-bit hash), so clip after clip shows no pattern */
export function mix(a, b) { let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35); h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16; return (h >>> 0) % 2147483646 + 1; }
/* The ear test: one of the states, from a seed, never the same three times in a row; and won when RIGHT of the last
   LAST answers are right */
export const EAR = { right: 8, last: 10 };
export function pick(seed, history = []) {
  const n = history.length, r = seeded(mix(seed, n));
  const banned = n >= 2 && history[n - 1] === history[n - 2] ? history[n - 1] : null, from = STATES.filter(s => s !== banned);
  return from[Math.floor(r() * from.length)];
}
export const rightOfLast = answers => answers.slice(-EAR.last).filter(Boolean).length;
export const earWon = answers => rightOfLast(answers) >= EAR.right;
