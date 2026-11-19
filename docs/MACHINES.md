# Machines from shared blocks

**What would you build if machines were assembled from shared blocks, for one person and one need?**

The question behind it: *when AI can assemble a machine for every need, what should people share, and what should
they decide?*

This replaces the idea of one standard computer that the community builds. It grows out of the build
(`src/data/build.js`, "a small open computer on a shared chip, around a RISC-V core"): its pieces become the first
blocks, and the RISC-V core becomes one block family. The name is a working name. On the site, "commons" already
means the community's record (the ledger), so it is not used here.

## Why it is open

- **Diverse against shared.** A machine built for one need fits it far better than a standard one, but people only
  build on each other's work when they share something. The grammar has to be small enough to share and rich enough
  to allow almost anything.
- **Flexible against efficient.** A block as software can change at any time. As a circuit it runs far cheaper, but it
  is fixed. Where the line between them falls has no fixed answer, and now an AI can redraw it for every need.
- **AI assembles against people decide.** An AI can try more combinations than any person. Only people know what a
  need is really for, and someone has to check what the AI built.

## What it is

- **Blocks**: the parts anyone can add (a sensor input, a learner, an adder, a memory, a counter, a voter, a parity
  check, a RISC-V core). Each can take several forms: software, a circuit, or new matter.
- **The shared grammar**: what everyone shares instead of a standard machine. How blocks connect (their ports, and
  what flows through them: a signal, a number, a bit) and how each is checked (a piece of the community's plan, or a
  lab's engine). A block run as software needs a core, made as a circuit, to run on.
- **A machine**: blocks assembled for one need, each in the form that need calls for.
- **AI-native**: a person brings the need; agents assemble (pick blocks and forms); engines check and the puzzles
  score; the person judges, picks the trade-off, or breaks it. Every machine leaves its blocks, forms and scores
  behind for the next need.

## What is built (first slice)

| | Where |
| --- | --- |
| The blocks, the grammar's port kinds, three needs (a hearing aid, a wildfire sensor, a Mars rover) | `src/data/blocks.js` |
| The engine: the grammar's check, a need's rules, the score, the agent | `src/engines/machine.js`, `tests/machine.test.mjs` |
| The page: pick a need, change each part's form, let an agent assemble it, use a pick | `src/v2/machines.js`, `#/machines`, `#/machines/<need>` |
| The way in | the Lab's card, *Do* |
| The browser check | `scripts/smoke.mjs`, section `machines` |

**How it is scored.** For the same work, software costs about 500 times a circuit made for it (a general-purpose chip
against a custom one, for video; `facts.json` `asic-vs-cpu`). A learner as new matter costs what compute in memory
costs against a digital array (`cimEnergy` in `src/engines/paradigms.js`, at the energy puzzle's array size). Each
part's share of the work is a choice of the model, so the energy is always a machine against itself (all as
circuits), never in joules. Software and new matter can still change after the machine is made; new matter is not
exact.

**The agent** tries every plan, keeps those that follow the grammar and meet the need, and offers the ones no other
beats on energy, change and exactness at once. It decides nothing.

## Beyond today's chip (Invent)

The core idea *Invent* (simulate machines and kinds of matter that don't exist yet, and see where they break) starts
here, at the middle of three scales: a new switch, a new block, a new machine. A part's third form, new matter, is now
a choice of kinds (`src/data/inventions.js`):

| Kind | Can be made into | Changes | Exact | Rests on |
| --- | --- | --- | --- | --- |
| In memory | a learner | yes | no | the compute-in-memory engine (shown in a lab) |
| Light | a learner | yes | no | processors in use (in products), phase noise (engine), two guesses |
| Spikes | a learner | yes | no | spiking systems built (shown in a lab), cost with activity, one guess |
| Reversible | adder, counter, voter, parity | no | yes | a test chip's recovered energy (shown in a lab), one guess |
| Living | a learner | yes | no | a living-neuron computer on sale (in products), two guesses |

**The honesty rule.** Every claim says how sure it is: in products, shown in a lab, or a guess, with its source (an
entry of `facts.json`) or the engine that computes it. A claim is a gain, a catch or a note. The energy is a range: if
the guesses hold (every gain, only the shown catches) and if they fail (only the shown gains, every catch). No claim
goes below the floor: erasing a bit costs at least kT ln 2 (`src/engines/floor.js`); reversible logic counts only its
answer's bits. The agent counts only what is shown unless the person tells it to count guesses, and the page shows why
that matters: counting guesses, a hearing aid's filter becomes living neurons at 0.18× to 82× the energy.

**Next in Invent:** the switch (invent a transistor: material properties to a switch, with the gain-and-threshold
test of the `strange` world) and the machine (a new machine and its code invented together, against the hardware
lottery). Anyone can raise a claim with a source or lower it with a break; machine attempts are kept in the ledger now
(see Moore's law for ideas), claims are next.

## Liquid hardware

Hardware is fixed and only software changes: that is the line this part of the lab melts. A block can now be a
**liquid fabric** (`src/data/liquid.js`), rewired after it is made: exact like a circuit, changeable like software.
It is bought ready-made and configured, so it never waits on a fab: a try is a new configuration, a day.

| Fabric | Energy against a circuit | Rewires in | Rests on |
| --- | --- | --- | --- |
| Rewired by bits (FPGA) | about 14× (in products) | 324 µs – 209 ms (in products) | Kuon and Rose 2007; a measured partial rewiring |
| Rewired by words (coarse-grained array) | 3× (a guess) | every clock tick, 1 ns (shown in a lab) | the HyCUBE test chip |
| Rewired on the fly | 1.5× (a guess) | 50 ns (a guess) | DARPA PROWESS's goal |

A guessed fabric that fails is no better than an FPGA. The engine adds a need rule, **keep**: a need whose job
changes every so often (`every`, in seconds) needs its changing parts to reshape that fast (software switches
programs in about a microsecond, changeable new matter rewrites in about a millisecond: choices of the model). A new
need, **a radio that listens everywhere**, changes every 100 ns: software and FPGAs miss it, an array rewired every
tick keeps up (shown in a lab), the goal keeps up only if the guesses hold. The page draws a map of how fast each
part can reshape against what it costs, with the empty corner (fast to reshape, costs like a circuit) and the line
the need draws; and it links to the Evolve lab, after Thompson's 1996 circuit evolved on an FPGA that nobody could
fully explain. Because a fabric is exact, changeable and a try a day, it now beats plain software on energy wherever
speed of switching is not asked: on the hearing aid the agent offers an FPGA beside memory that computes.

## Fab on a desk

A try that runs as software can change the same day. Anything else has to be made first, and *where* it is made sets
how many tries fit in a year. A machine's plan now names a place to make its parts (`src/data/fabs.js`):

| Place | Makes | Days a try | A line costs, against a giant fab | Rests on |
| --- | --- | --- | --- | --- |
| A giant fab | every form but living matter | 126–182 (in products) | 1, the yardstick | Pragmatic's comparison, 18–26 weeks |
| A small fab | circuits | 3–14 (a guess) | 1/1,000–1/100 (in products) | Minimal Fab (AIST, Yokogawa) |
| A flexible line | circuits | 2–7 (in products) | 1/100 (the maker's claim) | Pragmatic FlexLogic: under 48 hours a run |
| A fab on a desk | circuits | 1–7 (a guess) | 1/10,000 (a guess) | a garage chip of 1,200 transistors; Fab2's "fab fab" |

Parts anyone can buy (a sensor, a memory, a core: `stock` in `src/data/blocks.js`) are bought, not made; living matter
is grown, and its days are not known, so they count as never. The engine adds a rule, **fab** (a place makes only
what it makes), a range of days a try (if a guessed number fails, the days are not known) and tries a year. The agent
now weighs four things at once: energy, change, exactness and days, so a flexible line stays on the frontier beside
the cheapest machine from a giant fab. Energy is still counted as if made at 45 nm: coarse lines cost more energy per
step, so the page says to try here and make the winner at a giant fab.

## Moore's law for ideas

Moore's law counts years, and keeping its pace now takes more than 18 times the researchers of the early 1970s (Bloom
et al., 2020). Wright's law counts things made, and it forecast 62 technologies best (Nagy et al., 2013). The lab's
curve counts **attempts**.

- An attempt at a machine is a `try` entry in the ledger with `machine` (the need) and `plan` (a form for each part,
  and a place to make them). `src/engines/ledger.js` checks it with the machine engine: it must follow the grammar,
  meet its need and be new (a plan with nothing to make is the same in every place). Its facts are the engine's score,
  counting only what is shown.
- Standings come from the scores alone: an attempt is on the frontier while no other beats it on energy, change,
  exactness and days; the best is the cheapest there.
- `labCurve(W, need)`: every attempt in order, its energy and the best so far; the law is a straight line through the
  best so far against the attempts so far, both on log scales (the share the best falls by each time the attempts
  double). It needs three attempts and a best that has moved.
- The page draws the curve, where your machine would land, and how long doubling the attempts would take at your
  machine's pace. *Keep this attempt* keeps it as a draft with its slip into the ledger, like every entry. Four
  example attempts at the hearing aid start the curve.
- This is where the two ideas meet: faster tries (a fab on a desk) mean more attempts a year, and more attempts move
  the curve.

## Not yet

- The agent chooses forms only; choosing the blocks themselves, and the wires, comes next.
- The open port lists machine attempts with the ledger, but has no tool to score or submit one yet.
- Energy does not yet depend on where a part is made (coarser lines cost more per step).
- A fabric's rewiring time is not yet spent: a part that reshapes does no work while it rewires, and the score does not count that.
- The energy and errors puzzles (`src/engines/budget.js`, `src/engines/errors.js`) do not score machines yet: each
  need already names its place among the errors engine's environments.
- New blocks and needs from the community, through the forms on GitHub.

## Open decisions

- The name.
- What goes into the grammar first: which ports, what flows through them, and how a block says which forms it has.
- How far the "new matter" form goes: a learner only for now.
- What a person must decide, and what an agent may decide alone.
- When the first block goes to a real shared run.
