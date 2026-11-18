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

## Not yet

- The agent chooses forms only; choosing the blocks themselves, and the wires, comes next.
- Attempts are not kept in the ledger yet, and the open port has no tool for machines yet.
- The energy and errors puzzles (`src/engines/budget.js`, `src/engines/errors.js`) do not score machines yet: each
  need already names its place among the errors engine's environments.
- New blocks and needs from the community, through the forms on GitHub.

## Open decisions

- The name.
- What goes into the grammar first: which ports, what flows through them, and how a block says which forms it has.
- How far the "new matter" form goes: a learner only for now.
- What a person must decide, and what an agent may decide alone.
- When the first block goes to a real shared run.
