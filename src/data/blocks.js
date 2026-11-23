/* Machines from shared blocks (docs/MACHINES.md): the blocks everyone shares, the grammar that joins them, and the
   needs a machine is assembled for. Data only, no words: the words are machines.* in src/i18n/en.json. The engine
   that checks and scores a machine is src/engines/machine.js.

   There is no standard computer here. A machine is a few blocks joined for one need, and each block takes the form
   that need calls for: as software (run on a core, it can change at any time), as a circuit (far cheaper to run,
   fixed once made), as new matter: a kind of matter beyond today's chip (src/data/inventions.js), each resting on
   claims that say how sure they are, or as liquid hardware: a fabric rewired after it is made, exact like a circuit
   and changeable like software (src/data/liquid.js). Where the line between hardware and software falls is chosen per need, by people or by
   an agent, and the engine shows what every choice gains and fixes in place.

   PORTS: the kinds of thing that flow between blocks. A port joins only a port of the same kind.
   BLOCKS: what anyone can add. Each has its ports (in, out), the forms it can take (software, circuit; the kinds of new
   matter that can be made into it are listed with each matter, src/data/inventions.js), and how it is checked: a piece
   of the community's plan (need, src/data/build.js, checked by the build's engines) or a lab's engine (lab). A block
   anyone can buy ready-made (stock: a sensor, a memory, a core) is bought, not made, so it never waits on a fab
   (src/data/fabs.js).
   NEEDS: one machine each, assembled from blocks (parts: an id, the block, its share of the work per answer; a
   choice of the model, never shown as a figure), the wires between them (from 'part.out<i>' to 'part.in<i>', or
   from 'world' for what comes in from outside), and the need's rules: parts that must stay changeable after the
   machine is made (change), parts that must be exact (exact), the place it lives (env, an environment of
   src/engines/errors.js), how much of the time it has something to do (activity, src/data/inventions.js ACTIVITY),
   and, for a need whose job keeps changing, how often it changes (every, in seconds): a part that must change has to
   be able to reshape that fast (src/data/liquid.js RESHAPE). */

export const PORTS = ['signal', 'word', 'bit'];
export const FORMS = ['software', 'circuit', 'matter', 'liquid'];   /* the families; new matter is matter:<kind>, a liquid fabric liquid:<kind> */

export const BLOCKS = [
  { id: 'sensor', in: ['signal'], out: ['word'], forms: ['circuit'], lab: 'analog', stock: true },
  { id: 'learner', in: ['word'], out: ['word'], forms: ['software', 'circuit'], lab: 'cim' },
  { id: 'adder', in: ['word', 'word'], out: ['word'], forms: ['software', 'circuit'], need: 'adder2' },
  { id: 'memory', in: ['word'], out: ['word'], forms: ['circuit'], need: 'regbit', stock: true },
  { id: 'counter', in: ['bit'], out: ['word'], forms: ['software', 'circuit'], need: 'timer' },
  { id: 'voter', in: ['bit', 'bit', 'bit'], out: ['bit'], forms: ['software', 'circuit'], need: 'safety' },
  { id: 'parity', in: ['word'], out: ['bit'], forms: ['software', 'circuit'], need: 'check' },
  { id: 'core', in: ['word'], out: ['word'], forms: ['circuit'], need: 'core', runs: true, stock: true }
];
export const BLOCK_IDS = BLOCKS.map(b => b.id);
export const blockOf = id => BLOCKS.find(b => b.id === id) || null;

export const NEEDS = [
  { id: 'hearing', env: 'phone', activity: 'steady',
    parts: [{ id: 'mic', block: 'sensor', work: 2 }, { id: 'filter', block: 'learner', work: 40 }, { id: 'mem', block: 'memory', work: 4 }, { id: 'ctl', block: 'core', work: 3 }],
    wires: [['world', 'mic.in0'], ['mic.out0', 'filter.in0'], ['filter.out0', 'mem.in0'], ['mem.out0', 'ctl.in0']],
    change: ['filter'], exact: [] },
  { id: 'wildfire', env: 'car', activity: 'rare',
    parts: [{ id: 'smoke', block: 'sensor', work: 2 }, { id: 'detect', block: 'learner', work: 30 }, { id: 'check', block: 'parity', work: 1 }, { id: 'clock', block: 'counter', work: 1 }, { id: 'ctl', block: 'core', work: 4 }],
    wires: [['world', 'smoke.in0'], ['world', 'clock.in0'], ['smoke.out0', 'detect.in0'], ['detect.out0', 'check.in0'], ['detect.out0', 'ctl.in0']],
    change: [], exact: [] },
  { id: 'rover', env: 'space', activity: 'steady',
    parts: [{ id: 'cam', block: 'sensor', work: 2 }, { id: 'nav', block: 'learner', work: 60 }, { id: 'vote', block: 'voter', work: 2 }, { id: 'clock', block: 'counter', work: 1 }, { id: 'ctl', block: 'core', work: 10 }],
    wires: [['world', 'cam.in0'], ['world', 'vote.in0'], ['world', 'vote.in1'], ['world', 'vote.in2'], ['vote.out0', 'clock.in0'], ['cam.out0', 'nav.in0'], ['nav.out0', 'ctl.in0']],
    change: ['nav'], exact: ['vote', 'ctl'] },
  /* a radio that listens everywhere: the signals around it change in nanoseconds (facts.json prowess), so the parts
     that find and pull out a signal must reshape as fast, and pulling it out must be exact */
  { id: 'radio', env: 'phone', activity: 'steady', every: 1e-7,
    parts: [{ id: 'ant', block: 'sensor', work: 2 }, { id: 'find', block: 'learner', work: 20 }, { id: 'mix', block: 'adder', work: 10 }, { id: 'clock', block: 'counter', work: 1 }, { id: 'ctl', block: 'core', work: 3 }],
    wires: [['world', 'ant.in0'], ['world', 'clock.in0'], ['ant.out0', 'find.in0'], ['ant.out0', 'mix.in0'], ['find.out0', 'mix.in1'], ['mix.out0', 'ctl.in0']],
    change: ['find', 'mix'], exact: ['mix'] }
];
export const NEED_IDS = NEEDS.map(n => n.id);
export const needOf = id => NEEDS.find(n => n.id === id) || null;

/* GOALS: one challenge per need, played on the machine in Do mode (src/v2/machines.js) and checked by the engine
   (src/engines/machine.js play, bestFor). Each has two goals: the first is always to meet the need's rules with the
   least energy; the second adds a harder rule of its own: every try back within a week (days, the most days a try may
   take if a guess fails), or more parts that must be exact (exact). Energy, as everywhere here, counts only what is in
   products or shown in a lab. */
export const GOALS = {
  hearing: [{ id: 'least' }, { id: 'week', days: 7 }],
  wildfire: [{ id: 'least' }, { id: 'week', days: 7 }],
  rover: [{ id: 'least' }, { id: 'exact', exact: ['nav'] }],
  radio: [{ id: 'least' }, { id: 'week', days: 7 }]
};
