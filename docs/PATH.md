# The path: from matter to mind

One promise, in one sentence: **build a thinking machine from physics up, and invent your own along the way.**

This is the plan for the lab's spine. Status: agreed with the owner on 26 November 2026. Built so far: the carry as
data and engine (`src/data/path.js`, `src/engines/path.js`, steps 1 and 2 below: each gene option's carry contract in
`arch.js`, one figure against today's computer), the three faces as data (`FACE_OF`, `alongTo`), the line's care
handing its spread and yield up the carry (`CARE`, `lineOf`, `carry().fab`), and the view at `#/stack` (step 4:
`src/v2/stack/`, loaded only when it opens) with the challenges as stepping stones (step 9), its questions' marks and
the lab's card (step 5). Its working
prototype, *Your stack*, designed and built by Claude Fable 5.2 with a first version by Claude Opus, is in
`docs/prototypes/stack/` (open `index.html`; sources in `src/`, built by `build.mjs`).

## What it is

*Your stack* is the lab's **second core visual system, and its spine**. The first is the dive: a continuous zoom from
a data centre to silicon atoms, how a real chip *is*. The stack shows *the one you made*: your computer, rung by rung,
from matter to mind, each rung made of the one below. Change the switch and watch the mind at the top change; choose
light instead of charge and the rungs rebuild themselves.

It is the spine, not a ninth place: it uses the dive's own levels, the atlas's homes, the frame and its card. Other
parts of the lab hang on it instead of standing beside it.

## Seven rungs, one ladder

The stack's rungs are the dive's levels, and the lattice's layers. One ladder, three ways of seeing it.

| Rung | The dive's level | The lattice's layer | What you make there |
| --- | --- | --- | --- |
| Mind | (new: what the machine does) | intelligence | a small network running on your machine: answers a second, energy an answer, how often right |
| Machine | board, rack | machine | your chips joined, with memory near or far; its shape (few big cores, a grid of tiles, a stack, a swarm) |
| Chip | chip | processor | your cores on a die: clock, cycles an instruction, how it is told what to do |
| Block | block | sums | your adders and your memory: an ALU slice copied 32 times, a register file from your gates |
| Gate | gate | logic | gates made of your switch: delay, energy, the chance a copy fails |
| Switch | switch | switch | a transistor: material, shape, way of switching, its voltage (the lab's switch engine) |
| Atom | atom | physics | the matter: gap, electrons, holes, or another carrier (light, spikes, living cells) |

Sums and memory are not rungs a newcomer feels; *block* is, and it is the dive's word, so they are two parts of the
block. A core lives inside a chip, so cores are part of the chip. Mind is the one new level: not a size but what the
machine does, so it sits above the machine in the stack; how it shows in the data centre's column is step 3 below.

Some matter skips rungs: neurons and DNA learn without gates (the lattice marks those cells *past*). A fork may jump
rungs; the stack draws the rungs it skips as passed by, never forced.

## The carry

Each rung hands up a contract, and the rung above is made of it. This is what Nand to Tetris teaches: you use what you
built.

| From | Hands up |
| --- | --- |
| Atom → switch | the material: gap, electron and hole mobility, traps |
| Switch → gate | lowest clean voltage, threshold, swing, spread of the copies, on-current, both carriers or not, survives the line |
| Gate → block | delay and energy per gate at your voltage, the chance a copy fails, switches per gate |
| Block → chip | ALU delay, energy an operation, wrong operations; register read delay, energy, wire share |
| Chip → machine | clock, cycles an instruction, energy an instruction, wrong instructions |
| Machine → mind | instructions a second, energy an instruction with memory, power, share spent moving data |

Every rung opens on the lab's example and becomes *yours* when changed. Any rung can be entered: a spine, not a
corridor. Every figure carries the lab's mark of how true it is (`src/data/fidelity.js`): the switch is computed by its
engine; the rungs above are an idea drawn; forks are guesses until evidence.

## Architectures: the frontier of the path

The next generation of computer architecture, the lab's highest priority, is the path seen from above. *Grow an
architecture* (`src/engines/arch.js`) describes a computer as a recipe of four genes. **A recipe is a set of forks in
your stack:**

| Gene | Options today | Rungs it chooses |
| --- | --- | --- |
| What carries a value | charge, light, spikes, reversible charge, living cells | atom, switch, gate |
| Where it computes | far from memory, near it, in it, flowing through a mesh | block (memory), machine |
| How it is told what to do | a program, a graph, events, learning, wired for one job | chip |
| Its shape | a few big cores, a grid of tiles, layers stacked, a swarm | machine |

4 × 5 × 5 × 4 = 400 recipes; 10 are built (`KNOWN`), almost all the rest never tried, most of them three or four
genes from today's computer. **What it is for**, the need (any program, a large model, a hearing aid, a wildfire
sensor, a Mars rover, a radio), sits at the top of the stack, starts on *Any program*, and is never a forced first step.

**Four views of one architecture, in one world:**

- **Anatomy:** your stack, rung by rung.
- **Recipe:** its genes, beside the rungs they choose.
- **Growth:** fifty years of polish against today's computer, in five directions (devices, moving data, tools, errors,
  making) plus people; worse at first, improved by attempts as Wright's law describes; agents propose forks, you decide.
- **Population:** zoom out to its niche, then to every attempt: needs across, distance from today up, each niche's
  champion, attempts from the ledger as points, the untried regions open, your stack one point among them.

**What keeps it diverse:** the best per niche, never one leaderboard (quality-diversity, as in MAP-Elites); an open
genome (genes and options are data, so a new carrier, way of telling or shape can be proposed with its trait effects
and carry contract, a guess until evidence); "worse at first" drawn as missing polish, not as a bad idea; credit for the
first attempt at an untried recipe, not only for wins; agents explore, people choose.

## The thirteen questions in the stack

The questions stay what `docs/FRAME13.md` says: lenses, met as marks on the picture, at most three while you look, one
opened alone, never listed together. The stack uses the same machinery: `lensesAt(level)` for its seven levels, with a
table of carry conditions that weighs them (a question rises when what you built makes it real).

**A lens repaints the whole stack.** This is what the stack adds: a question becomes a vertical story.

- *Perfect fails:* every plate shows its failing copies; one wrong copy in 10¹⁴ at the gate becomes one in 10¹¹ at the
  chip.
- *Geometry:* every plate shows the share of its time and energy spent on wires.
- *Fixed or fluid:* fixed rungs solid, rungs that can rewire themselves outlined.
- *Only humans:* each rung tinted by who chose it: you, the lab's example, or an agent.
- The others where they bite: *Fight or use physics* and *The next Moore's law* at the switch, *Whole beats parts*
  and *Compute beats cleverness* at the block, *Trust without inspection* at the chip, *Efficiency fuels use* at the
  machine, *Brain or copy* at the mind, *Digital meets physical* at the atom, *Beyond computation* through the chip's
  forks.

**Two lenses held together** keep FRAME13's three shapes: a *chain* is the carry itself (*Fight or use physics* ×
*Digital meets physical* climbing switch, gate, block); a *fork* is a gene, the same rung built two ways split by a
line you drag; a *front* is the field of attempts for two needs. On the field itself only *Efficiency fuels use*, *Only
humans* and *The next Moore's law* live, marked on a niche, never in a legend.

## How it joins the lab

| Part of the lab | Becomes |
| --- | --- |
| The dive | the same levels: from a rung, *in* lands on that dive level; from the dive's chip, *out and up* reaches machine and mind |
| The island | the stack stands at **the Lab** (Open); zooming out of the Lab is the field of every attempt; a plate's way along leads to the studio, the factory, the quarry |
| Hold | its last block, your machine, lands on your stack, then the island |
| The lattice | not a separate picture: an arrangement of the same ladder, silicon the spine, other matter the forks, each cell opening its rung |
| *Grow an architecture* | its own race and map of 400 retire: the growth bar and the field do both; its two challenges, family tree, curve and keeping in the ledger stay, played in the stack's Do |
| Machines from shared blocks | the machine rung, opened: a machine of shared blocks for one need, never only "more cores" |
| The frame and the card | Look is the stack; Do is a rung's challenge played on its plate, with its controls as the card's Do face; Read is `#/read` |
| Challenges | each lab's challenge is a **stepping stone** on its rung (`STONES` in `arch.js`); a challenge won inks that plate's edge |
| The ledger and the port | a stack is one entry (its recipe, fine settings and history); every point on the field comes from the ledger; agents' sweeps arrive through the port, never run by the lab |
| The atlas | the rungs are levels with homes; the stack's parts are named by their home ids; words in `src/i18n/` |

## Three faces: the studio and the fab

Each rung has three faces along the chip's life (the grid's rule: along keeps the level, a gate as used, as made, as
designed). **As designed** is the design studio, chip to switch: drafted outlines, with the studio's steps as the
plate's control (the job and Arrange at the chip, describe, check, place and route at the block, gates, timing and
rules at the gate, one cell and its masks at the switch). **As made** is the fab, atom to chip: the same plates solid,
with the line's steps as the control, each step showing what it does to your design. **As used** is the dive. The
stack does not move: along turns every plate at once (owner, 27 November 2026; guiding prototype
`docs/prototypes/faces/`).

- The studio on the island becomes a door onto the stack at Design; its walk-through room and its wall panels go (kept
  on a `before-` branch first).
- **The factory keeps its 3D line** as its own place, the process view: one wafer through its stations (owner, 27
  November 2026). It is redesigned for continuity, one camera with no cut: from the island into the line; the wafer on
  the line is your design, printed at Print; a station's *Go inside* zooms into its machine at work and on into your
  rung as made (deposit and etch the switch, Print the gate, Wires the block, Package the chip); what the line does
  comes back up the stack as the spread of the copies and yield.
- Arrange at the chip as designed *is* the recipe's `shape` and `where` genes; the community computer's plan is the chip
  rung as designed, your slice a tile in its block.
- The fab hands real things up the carry: the line's care sets the spread of the copies and the defects that give
  yield and the cost of a good chip (`chip.js`). *Perfect fails* made real. Built (#455): the care is a fine setting of
  the switch, three settings of the fab's engines (`CARE` in `src/data/path.js`). The print's dose sets the spread as
  its photon noise (`litho.js` `euv`), and a wider spread raises the lowest clean voltage, so more copies of a gate go
  wrong; the cleanroom's class sets the specks (`fabline.js` `isoLimit`, from `chip.js`'s defects for today's
  process); `chip.js` `dieOf` counts the whole dies and what a good one costs, a slower scanner making every wafer
  dearer. The etch engine is a Monte Carlo of one trench, too slow to run on every carry and a mean undercut rather
  than a spread, so it is not read yet.
- Questions on the faces: *Perfect fails* at the switch and gate as made and the block as designed (a late path);
  *Geometry* at the chip as designed; *Compute beats cleverness* at place and route; *Trust without inspection* at the
  gate's rules and checks; *Fight or use physics* at Print; *The next Moore's law* in the line's care; *Only humans* in
  Arrange; *Efficiency fuels use* in yield and cost.

## Building it

Each line is meant to become one task issue, in order.

1. **The contract as data and engine:** `src/data/path.js` (the seven rungs on the dive's level ids, contract fields,
   gene-to-rung table, fine settings) and `src/engines/path.js` (`carry`), ported from the prototype's `model.js`,
   with tests.
2. **One model for stack and recipe:** `recipeOf` and `stackOf`; each gene option's carry contract moves into
   `arch.js` beside its trait effects; one "against today" number, so the carry's and the engine's never drift apart.
3. **Mind as a level:** a home for it in the atlas and `places.js`, above the machine, without pretending it is a size.
   (Built, #445: a level of the data centre above its zoom, `ABOVE` in `src/data/places.js`, size `false` with its own
   readout; kept out of `INSIDE` and `DEPTHS`, so no view moves until step 4.)
4. **The stack view:** `src/v2/stack/` (camera, plates, pictures, the field) as modules loaded only when opened; words
   in `src/i18n/en/`; a DOM mirror of the canvas for the keyboard and screen readers; `#/stack`. (Built: `#/stack`, `#/stack/<rung>`,
   `#/stack/field`; the block plate holds the sums and the memory side by side, the chip its core; the field's
   attempts are the built recipes, the ledger's, the agents' run in your browser, and yours.)
5. **Marks and the card through the frame:** `lensesAt` and `MARKS` for the seven levels; Look, Do, Read. (Built, #447:
   each rung carries the lenses of its levels, `RUNG_LENS` in `src/data/frame.js`, the mind those of the data centre's
   building until something is filed at mind; the carry conditions, `RISES`, raise a question where what you built makes
   it real, weighed by `stackLenses` in `src/engines/frame.js`; a row may only raise a question that lives at its rung,
   so *Whole beats parts* rises at the gate when the block votes and *Compute beats cleverness* at the chip for a
   lookahead adder, and *Only humans*, which lives at none of the seven, waits. The marks stand on the plates as the
   plates' own pictures place them, rather than beside named parts as `MARKS` does. The stack wears the frame's card,
   `src/v2/stack/card.js`: Look the caption at the bottom left with its question leading to `#/read`, Do a rung's
   challenge with its controls in the side panel, Ask one question opened alone.)
6. **The field from the ledger:** champions per niche, attempts as points, credit for first attempts, what changed
   since your last visit.
7. **Lenses repaint the stack**, one at a time, starting with *Perfect fails*; then two lenses as a chain, fork, front.
8. **The ways in:** from the Lab, Hold's last block and the dive's chip; the lattice as an arrangement of the ladder;
   *Grow an architecture*'s race and map retired into the stack.
9. **Challenges as stepping stones** on their rungs, inking the plate's edge. (Built: a challenge's rung is the rung of the layer the lattice places
   it in, `rungOfChallenge`; a won one inks a square under its plate and shows in the rung's card.)
10. **The open genome's form** (after the first forks carry): a GitHub form and port tool to propose a gene option
    with its trait effects and carry contract, checked by tests.

**Risks:** the first page's budget (load everything lazily); the fork figures are guesses and their mark must stay
visible; a canvas world needs its DOM mirror; the field must stay readable at full scale (untried plots faint, ink for
tried ones, few names).

**The first thing to nudge a visitor to try is the wreck:** graphene, or the voltage taken down until the mind forgets.
The stack teaches when something breaks.

## Open

- The atlas's Turn (`TWINS` in `src/data/atlas.js`, which the router reads) and the faces (`FACE_OF` in
  `src/data/path.js`) agree on every level's home step (a test keeps them so), but the faces say more: the switch as
  designed (one cell and its masks), deposit as making the switch, and test with the package at the chip. When the
  stack's faces are drawn, the Turn should be read from the faces so it is written once.

- The niche field's design at full scale (a candidate for one more creative round), and glyphs that tell recipes apart.
- A software rung (your instructions, an assembler, one program) now or later.
- Where the need sits in the end: it depends on how the framework settles.
- The rungs' names in the four languages.
