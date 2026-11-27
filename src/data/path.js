/* The path: from matter to mind (docs/PATH.md, the owner's decisions of 26 and 27 November 2026 in docs/DECISIONS.md).
   Your stack, the lab's spine: a computer rung by rung, each rung made of the one below and handing up a contract the
   rung above is made of. Data only, no words, no imports: the carry is computed by src/engines/path.js; tests in
   tests/path.test.mjs. Ported from the prototype by Claude Fable 5.2 (docs/prototypes/stack/src/model.js, faces in
   docs/prototypes/faces/src/faces.js), written for the lab by Claude Opus 5.5 in the nightly build.

   RUNGS     the seven rungs, from the bottom up, on the dive's level ids (the lattice's layers beside them: LAYER).
             Mind is the one new level (#445 gives it a home in the atlas); sums and memory are two parts of the block,
             the core a part of the chip (PARTS).
   LEVELS    the levels of the dive (and the flight) each rung is seen at as used.
   HANDS     what each rung hands up, field by field, with its unit (the mind's are what it does: nothing is above it).
   BY, FID   the engine or model behind each rung (an id of ENGINES, src/data/fidelity.js) and its mark of how true. The
             switch is the lab's switch engine; the atom reads its figures from that engine's table of materials (each
             with its source); every rung above is this model, an idea drawn. A fork is a guess until a fact backs it.
   GENE_RUNGS the gene-to-rung table: the rungs each gene of a recipe (src/engines/arch.js) chooses. A recipe is a set of
             forks in your stack.
   FINE_OF   the fine settings each rung holds (the switch engine's ids for the material, its shape and way of
             switching; CHOICES for the rest; V_RANGE for the voltage), and EXAMPLE, the lab's example every rung opens
             on, which becomes yours when changed.
   FACES     the three faces of every rung along a chip's life (#454): as designed (the studio, chip to switch), as made
             (the fab, atom to chip), as used (the dive). A face is { home, steps }: home is the level it lives at in the
             atlas (a depth of the studio's row, of the line or of the dive), steps are the steps that are its control,
             each { id, at, by }: at the depth it is shown at, by the engine behind it (an id of ENGINES). A face a rung
             does not have says so and why: { none: <id> }. */

export const RUNGS = ['atom', 'switch', 'gate', 'block', 'chip', 'machine', 'mind'];
/* the lattice's layer of each rung (src/data/lattice.js LAYERS): one ladder, seen three ways */
export const LAYER = { atom: 'physics', switch: 'switch', gate: 'logic', block: 'sums', chip: 'processor', machine: 'machine', mind: 'intelligence' };
/* the levels each rung is seen at as used: the dive's own, the flight's board and rack for the machine, and mind */
export const LEVELS = { atom: ['atom'], switch: ['switch'], gate: ['gate'], block: ['block'], chip: ['chip'], machine: ['board', 'rack'], mind: ['mind'] };
/* the parts of a rung that a newcomer does not feel as rungs of their own */
export const PARTS = { block: ['sums', 'memory'], chip: ['core'] };

/* what each rung hands up: [field, unit]. Units: eV; cm2/Vs; per cm2 per eV; V; mV; x (against today's silicon fin);
   yes (true or false); s; J; p (a chance, 0 to 1); n (a count); share (0 to 1); Hz; per s; W */
export const HANDS = {
  atom: [['gap', 'eV'], ['electrons', 'cm2/Vs'], ['holes', 'cm2/Vs'], ['traps', 'per cm2 eV']],
  switch: [['vmin', 'V'], ['vt', 'V'], ['swing', 'mV'], ['sigma', 'mV'], ['ion', 'x'], ['pair', 'yes'], ['survives', 'yes']],
  gate: [['delay', 's'], ['energy', 'J'], ['fail', 'p'], ['switches', 'n']],
  block: [['aluDelay', 's'], ['aluEnergy', 'J'], ['aluWrong', 'p'], ['readDelay', 's'], ['readEnergy', 'J'], ['readWrong', 'p'], ['wireShare', 'share'], ['gates', 'n']],
  chip: [['clock', 'Hz'], ['cpi', 'n'], ['energy', 'J'], ['wrong', 'p'], ['gates', 'n']],
  machine: [['ips', 'per s'], ['energy', 'J'], ['power', 'W'], ['moveShare', 'share'], ['fetch', 'J'], ['wrong', 'p']],
  mind: [['aps', 'per s'], ['energy', 'J'], ['right', 'share']]
};
export const fieldsOf = rung => (HANDS[rung] || []).map(h => h[0]);

/* the engine or model behind each rung, and its mark when it is built of today's option (a fork is a guess) */
export const BY = { atom: 'switch', switch: 'switch', gate: 'path', block: 'path', chip: 'path', machine: 'path', mind: 'path' };
export const FID = { atom: 'figures', switch: 'computed', gate: 'idea', block: 'idea', chip: 'idea', machine: 'idea', mind: 'idea' };
/* the engine behind a fork's contract: the architecture engine's options (arch.js CARRY, beside EFFECT) */
export const FORK_BY = 'arch';

/* the gene-to-rung table: the rungs each gene chooses, the first its home (where a stack's gene is read from) */
export const GENE_RUNGS = { carrier: ['atom', 'switch', 'gate'], where: ['block', 'machine'], told: ['chip'], shape: ['machine'] };

/* the fine settings, rung by rung: what you change on a rung without changing the recipe */
export const FINE_OF = { atom: ['mat'], switch: ['shape', 'mech', 'V'], gate: ['lib'], block: ['adder', 'vote', 'regs'], chip: ['stages'], machine: ['ui'], mind: ['bits'] };
/* the choices of each fine setting but the switch engine's three (mat, shape, mech: its MATERIALS, SHAPES and MECHS) */
export const CHOICES = { lib: ['nand', 'rich'], adder: ['ripple', 'look'], vote: [0, 1], regs: [8, 16, 32], stages: [1, 3, 5], ui: [0, 1, 2], bits: [1, 2, 4, 8] };
/* the supply voltage, volts: least and most */
export const V_RANGE = [0.15, 1];
/* the lab's example: today's silicon fin at 0.70 V, a library of NAND gates, a ripple adder with no vote, 32 registers,
   one stage, the middle number of units, eight-bit weights */
export const EXAMPLE = { mat: 'si', shape: 'fin', mech: 'therm', V: 0.70, lib: 'nand', adder: 'ripple', vote: 0, regs: 32, stages: 1, ui: 1, bits: 8 };
/* the need at the top of the stack starts on any program, never a forced first step (arch.js NEEDS) */
export const AIM = 'any';

/* ---- the three faces (docs/PATH.md, "Three faces: the studio and the fab") ----
   The studio's steps are the design world's depths (src/data/weave.js: need, logic, check, gates, layout, masks), the
   line's are the journey's (crystal ... ship). A step inside another (Arrange on the job's screen, timing among the
   gates, the cell on the masks) is shown at that step's depth (at). Why a face is missing:
     chosen      the atom as designed: matter is chosen, not drawn; the studio starts at the switch's cell
     outside     the machine as designed: chips are joined into machines outside the studio (Machines from shared blocks)
     assembled   the machine as made: the line ends at the package; chips are put together into machines after it
     trained     the mind as designed or made: a network is trained on the machine, not drawn or printed */
export const FACES = ['design', 'make', 'use'];
/* the stage of the loop each face is seen at (src/engines/way.js STAGES) */
export const FACE_STAGE = { design: 'design', make: 'make', use: 'use' };
const S = (id, by, at = id) => ({ id, at, by });
export const FACE_OF = {
  atom: {
    design: { none: 'chosen' },
    make: { home: 'implant', steps: [S('crystal', 'crystal'), S('implant', 'dope')] },
    use: { home: 'atom' }
  },
  switch: {
    design: { home: 'masks', steps: [S('cell', 'design', 'masks'), S('masks', 'rules')] },
    make: { home: 'etch', steps: [S('deposit', 'fabline'), S('etch', 'etch')] },
    use: { home: 'switch' }
  },
  gate: {
    design: { home: 'gates', steps: [S('gates', 'design'), S('timing', 'timing', 'gates'), S('rules', 'rules', 'layout')] },
    make: { home: 'print', steps: [S('print', 'litho')] },
    use: { home: 'gate' }
  },
  block: {
    design: { home: 'layout', steps: [S('logic', 'design'), S('check', 'design'), S('layout', 'bench')] },
    make: { home: 'wires', steps: [S('wires', 'fabline')] },
    use: { home: 'block' }
  },
  chip: {
    design: { home: 'need', steps: [S('need', 'design'), S('arrange', 'arch', 'need')] },
    make: { home: 'pkg', steps: [S('test', 'chip'), S('pkg', 'chip')] },
    use: { home: 'chip' }
  },
  machine: {
    design: { none: 'outside' },
    make: { none: 'assembled' },
    use: { home: 'board' }
  },
  mind: {
    design: { none: 'trained' },
    make: { none: 'trained' },
    use: { home: 'mind' }
  }
};
/* Arrange at the chip as designed is the recipe's own shape and where genes (docs/PATH.md) */
export const ARRANGE = ['shape', 'where'];

/* the challenges where you invent a fork of a rung yourself, each played in its own lab: offered in the rung's controls,
   by challenge id (src/v2/loop.js CHALLENGES) */
export const INVENT = { atom: [], switch: ['transistor', 'noise', 'reversible'], gate: ['bridge'], block: ['light', 'cim'], chip: ['dataflow', 'corearch'], machine: ['spikes', 'archniche'], mind: ['dnawta', 'mortal'] };
