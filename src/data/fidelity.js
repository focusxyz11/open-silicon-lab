/* How true is each thing (#325, docs/SYSTEM.md "How true"): one mark, the same everywhere, for how far the lab's
   picture of a thing goes. Data only, no words: the words are fid.* in src/i18n/en/atlas.json; the mark is drawn by
   src/v2/fid.js; tests/fidelity.test.mjs checks that nothing shown goes without one.

   FIDS, from least to most true:
     idea      an idea drawn: a sketch of how it works, its shapes and sizes chosen to be read, not measured;
     figures   shaped by real numbers: drawn to sourced figures (fact: an entry of src/data/facts.json), nothing on it
               computed as you move it;
     computed  an engine's model runs it (by: an engine of ENGINES): the numbers are the lab's model, not one real chip;
     checked   the model's results match a published measurement (by, and fact: what was measured); the test file
               (tests/fidelity.test.mjs, CHECKS) runs the engine and compares.
   The rule for choosing: a model is as true as the surprise its question needs, no more. A thing is marked for what
   it is, never lifted to look better: a picture whose lesson is a shape is an idea drawn even when an engine sets one
   of its numbers.

   A record: { f, by?, fact? }. Kept here, one table per kind of thing, so each thing's mark has one home:
     LABS     each challenge (src/v2/game.js CHALLENGES), by its id; KINDS for the challenges the ledger makes;
     LEVELS   each level of the dive (its picture, flat or in 3D: the same drawing either way);
     LENSES   each lens's measure (src/engines/lens.js MODELS), and PAIRS for two lenses held whose instrument is one
              model of its own (a front, a chain, the fork of memory that computes); any other pair shows its two
              lenses' marks side by side;
     FRONTS   a front drawn beside a machine (src/v2/machines.js).
   A machine's claims carry their mark beside their status (src/data/inventions.js, liquid.js, fabs.js): fid says how
   the lab knows, status whether anyone has built it, and a guess is never more than an idea drawn (STATUS_MAX). */

export const FIDS = ['idea', 'figures', 'computed', 'checked'];
export const rankOf = f => FIDS.indexOf(f);
/* the most a claim of each status can be marked: a guess has nothing to be measured or run, only drawn */
export const STATUS_MAX = { product: 'checked', lab: 'checked', guess: 'idea' };

/* the engines that compute, by the name their words use (fid.by.<id>), and the file that holds each */
export const ENGINES = {
  design: 'src/engines/design.js', bet: 'src/engines/bet.js', chip: 'src/engines/chip.js', life: 'src/engines/life.js',
  agent: 'src/data/agent.js', aichip: 'src/engines/aichip.js', analog: 'src/engines/analog.js', bench: 'src/engines/bench.js',
  evolve: 'src/engines/evolve.js', crystal: 'src/engines/crystal.js', dope: 'src/engines/dope.js', fabline: 'src/engines/fabline.js',
  etch: 'src/engines/etch.js', litho: 'src/engines/litho.js', paradigms: 'src/engines/paradigms.js', grover: 'src/engines/grover.js',
  aibuild: 'src/engines/aibuild.js', clockpower: 'src/engines/clockpower.js', aiserve: 'src/engines/aiserve.js', bits: 'src/engines/bits.js',
  redundancy: 'src/engines/redundancy.js', mortal: 'src/engines/mortal.js', errors: 'src/engines/errors.js', riscv: 'src/engines/riscv.js',
  halt: 'src/engines/halt.js', thousand: 'src/engines/thousand.js', search: 'src/engines/search.js', listen: 'src/engines/listen.js',
  corearch: 'src/engines/corearch.js', machine: 'src/engines/machine.js', budget: 'src/engines/budget.js', plan: 'src/data/partfacts.js',
  noise: 'src/engines/lens.js', lens: 'src/engines/lens.js',
  switch: 'src/engines/switch.js', strands: 'src/engines/strands.js',
  timing: 'src/engines/timing.js', rules: 'src/engines/rules.js', arch: 'src/engines/arch.js', path: 'src/engines/path.js'
};

const C = by => ({ f: 'computed', by });
const IDEA = { f: 'idea' };

/* each challenge, by its id */
export const LABS = {
  half: C('design'), vote: C('design'), full: C('design'), prove: C('bet'),
  /* your chip's settings: the fab's days per layer match the industry's cycle time (facts.json fab-cycle-time) */
  months: { f: 'checked', by: 'chip', fact: 'fab-cycle-time' }, quick: { f: 'checked', by: 'chip', fact: 'fab-cycle-time' },
  cheaper: C('bet'), onebad: C('bet'), spot: C('design'), cores: C('chip'),
  phone: C('life'), car: C('life'), dclife: C('life'), fed: C('chip'), fast: C('chip'), oxen: C('bet'), jevons: C('bet'),
  agent: C('agent'), batch: C('aichip'),
  /* what is inside five products, as reported; nothing in it moves */
  newest: { f: 'figures', fact: 'chips-per-car' },
  'sig-heart': C('analog'), 'sig-bearing': C('analog'), 'reg-jobs': C('analog'),
  /* the right chip for the job: kinds of chip on a line from flexible to specialized, a judgement drawn */
  jobs: IDEA,
  piece: C('bench'), evolve: C('evolve'), floor: C('bench'), maskof: C('bench'), crystal: C('crystal'),
  furnace: C('dope'), shallow: C('dope'), vias: C('fabline'), etch: C('etch'), bottom: C('fabline'), 'litho-finest': C('litho'),
  cim: C('paradigms'), grover: C('grover'),
  /* the scanner's wafers an hour come out at what the real machine is sold for (facts.json euv-throughput) */
  'euv-1000': { f: 'checked', by: 'litho', fact: 'euv-throughput' },
  'too-hot': C('dope'), 'ai-chip': C('aibuild'), 'power-curve': C('clockpower'), counter: C('clockpower'),
  quantize: C('aiserve'), 'token-energy': C('aiserve'), prefill: C('aiserve'), chef: C('bits'), flaky: C('redundancy'), mortal: C('mortal'),
  /* typical floorplans drawn in general terms, not any one product (src/engines/dies.js) */
  dieread: IDEA,
  /* the errors engine's stops in a training run match Llama 3's (facts.json llama3-interruptions) */
  silent: { f: 'checked', by: 'errors', fact: 'llama3-interruptions' },
  rvrun: C('riscv'), noise: C('paradigms'), 'noise-big': C('paradigms'), thousand: C('thousand'), search: C('search'), halt: C('halt'),
  ear: C('listen'), corearch: C('corearch'),
  /* invent a transistor: the switching curve, its voltage, energy and speed are the switch engine's compact model;
     its parts carry their own marks in the lab (material values shaped by real numbers, the traps an idea) */
  transistor: C('switch'),
  /* new ways to compute (#323): an adder of Toffoli gates ramped slowly, a model's layers laid across tiles */
  reversible: C('paradigms'), dataflow: C('paradigms'),
  spikes: C('paradigms'), light: C('paradigms'),
  /* grow an architecture: a toy model of how architectures win, whose lesson is a shape (worse at first, one need, then
     more); its numbers are its own choices, so it is an idea drawn even though an engine runs it (src/engines/arch.js) */
  archniche: IDEA, archspread: IDEA,
  /* one spec, two matters: silicon from the bench's cell library, the tube from a kinetic model of seesaw gates and a
     winner-take-all network with honest trends, not a chemistry simulator (src/engines/strands.js) */
  bridge: C('strands'), dnawta: C('strands')
};
/* the challenges the ledger makes: a design someone kept, to be broken */
export const KINDS = { break: C('design'), design: C('design') };
export const labFid = ch => (ch && (LABS[ch.id] || KINDS[ch.kind])) || null;

/* each level of the dive, its picture */
export const LEVELS = {
  building: IDEA, rack: IDEA, board: IDEA,
  /* your chip's cores, clock and timing come from the chip engine (src/app/scenes.js chipNow) */
  chip: C('chip'),
  block: IDEA,
  /* the slowest signal racing the tick is your chip's, from the chip engine */
  gate: C('chip'),
  switch: IDEA, atom: IDEA,
  phone: IDEA, phoneboard: IDEA, soc: IDEA, car: IDEA, ecu: IDEA, mcu: IDEA, scanner: IDEA,
  /* the chips on the wafer, the pieces lost at the rim and the specks that kill: your chip's size and generation, by
     the chip engine's yield */
  wafer: C('chip'),
  die: IDEA
};

/* each lens's measure (src/engines/lens.js MODELS) */
export const LENSES = {
  geo: C('plan'), eff: C('budget'), copy: C('mortal'), perfect: C('chip'), dig: C('noise'), physics: C('paradigms'), human: C('bench')
};
/* two lenses held, where one model computes the pair (the key is pairOf's: a.b) */
export const PAIRS = { 'eff.geo': C('lens'), 'dig.physics': C('lens'), 'copy.physics': C('paradigms') };

/* a front beside a machine: the machine engine scores every offer and yours, both measures from one model */
export const FRONTS = { machines: C('machine') };
