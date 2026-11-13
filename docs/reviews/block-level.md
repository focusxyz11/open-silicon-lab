# Review: the block level

Reviewed 2026-11-13 against `src/i18n/en.json`, `src/data/facts.json`, `src/data/weave.js`, `src/engines/chip.js`, `src/app/scenes.js` and `src/app/design.js`. One outside check was made: the table behind `energy-moving-data` was read at its own address (arXiv 1602.04183, Table I), because `chip.show.block` rests on three of its figures and only two are in the entry. Everything else rests on general design knowledge and the entries already in `facts.json`.

## Status

Not applied. This file is the only thing changed.

Reviewer: Claude Fable 5.2, asked with a written brief.

## Status

Applied 2026-11-13: all 12 suggested replacements. Still open: the attribution of energy-moving-data in facts.json (the paper is by Pedram et al., not Dally et al.); chip.memory carries the same overstatement chip.show.block had; the unbacked figures listed below.

Reviewer: Claude Fable 5.2, asked by Claude Opus 5.5 with a written brief; applied by Claude Opus 5.5.

## Summary

The level is sound in outline: rows of standard cells beside a memory array under many levels of wire is what a real block looks like, and nothing in it is flatly false. Of the 36 keys in scope, 24 are fine, 12 need a wording fix and 0 are outright wrong. Five of the 12 are misleading and should go first: the life stop says circuits are clocked "whether or not there is anything new to do" and asks "what if these cells did too", when every modern chip already stops the clock to idle parts; "feed a circuit's output back into its input and it holds its state" is true only for some loops (others oscillate); `chip.show.block` reports the share of one multiply-add's energy as the share "of the energy your chip spends" (about 99% at the starting settings); and `what.block.yours` says "as many cells" and "exactly like these" when the picture caps at 40 cells and the studio's cells are from a 130 nm library. The commonest plain-language gap is words with two meanings: "cell" (standard cell, memory cell, brain cell) and "block" (this level, "building blocks"). SRAM is never named here though other pages use it; "design kits" and "spiking" appear bare.

The brief lists `.tried` for every thread; `stop.think.block.tried` does not exist, so the stop count is 14, not 15.

Severity count: wrong 0, misleading 5, unclear 6, nit 1.

## Findings

| Key | Current text | Problem | Severity | Suggested replacement |
| --- | --- | --- | --- | --- |
| `depth.block.see` | "Inside one block: rows of tiny standard cells and a grid of memory, joined by wires." | Plain language. "Block" is not said to be anything (the chip level calls them "compute blocks" and "districts"), and "standard cells" is used before `what.block.cells` explains it. | unclear | "Inside one block, one working part of the chip: rows of small ready-made circuits called standard cells, and a grid of memory, joined by wires." |
| `what.block.cells` | "Tiny standard building blocks, each a small logic circuit, lined up in rows." | Plain language and accuracy. "Building blocks" at the level named Block gives "block" two meanings. "Standard" is not explained: the point is that they come from a library and share one height, which is why they sit in rows and why a program can place them. Not every cell is logic: the library also holds the one-bit stores (flip-flops), as `depth.gates.see` says. | unclear | "Small ready-made circuits from a library: logic gates, and flip-flops that each remember one bit. All have the same height, so they line up in rows." |
| `what.block.sram` | "A grid of memory cells, each holding one bit." | Plain language. True, but "cell" now means two things in one picture and nothing says a memory cell is not a standard cell. The memory is never named, though `xray.type.cache.t` and `debate.memory.v1.claim` say "SRAM" bare. It also does not say the bit is lost without power, which is what sets it apart from the memory that keeps a program. | unclear | "A grid of memory cells, each a small loop of switches that holds one bit while the power is on. This kind of memory is called SRAM. Its cells are drawn by hand and are not standard cells." |
| `what.block.yours` | "As many cells as your design in the studio became, if it sat in this block: rows of standard cells exactly like these, placed and wired by the same kind of program." | Accuracy. The outline is capped at 40 cells (`src/app/scenes.js`), so for the core and other larger designs it is not "as many cells". The studio's cells are from a 130 nm library (`src/engines/design.js`), far larger than the cells of the chip in this dive, so "exactly like these" is not true; they are the same kind of thing. | misleading | "Your design from the studio, as it would sit in this block: rows of standard cells of the same kind as these, only larger, placed and wired by the same kind of program. The outline shows up to 40 of its cells." |
| `chip.show.block` | "Each switch takes {area}× the space, so {density}× as many cells fit here. Of the energy your chip spends, {moving}% goes to fetching numbers from memory, not to computing with them." | Accuracy and number. No baseline is given for "{area}× the space"; the other `chip.show.*` texts say "the starting one". `{moving}` is `move / (math + move)` in `src/engines/chip.js`: the split of one multiply-add between its arithmetic (0.62 + 0.18 pJ) and two reads from memory chips (640 pJ each, shared over the reuse). It leaves out clocks, leakage and control, and the same engine's `power` has no memory term at all. At the starting settings it reads about 99%, which a learner will take as "99% of my chip's power is memory". Much of that energy is also spent in the memory chips and the links to them, not in "your chip". | misleading | "Each switch takes {area}× the space it takes in the starting chip, so {density}× as many cells fit here. For each multiply and add your chip does, {moving}% of the energy goes to fetching the numbers from memory, not to the arithmetic." |
| `here.block` | "Your design, {job}, became {cells} cells like these. A block like this holds hundreds of thousands, placed and wired by programs, as yours were." | Number and accuracy, minor. "Hundreds of thousands" is the right order (blocks handed to a place-and-route program run from about a hundred thousand cells to a few million) but has no `facts.json` entry. "Like these" has the same library gap as `what.block.yours`. | nit | "Your design, {job}, became {cells} cells of the same kind as these. A block like this holds hundreds of thousands or more, placed and wired by programs, as yours were." |
| `stop.think.block.note` | "Feed a circuit's output back into its input and it holds its state." | Accuracy. True only when the loop turns the signal over an even number of times. Feed one NOT gate's output back into its input and it never settles: that is how chips make oscillators. The studio already tells the learner the opposite rule (`design.err.loop`: without a clock, logic must flow one way). | misleading | "Join a pair of NOT gates in a ring, each feeding the other, and the pair holds whichever value it was last pushed into." |
| `stop.open.block.q` | "Open blocks can be reused by anyone. What would a shared library of chip parts make possible?" | Question quality and plain language. Shared libraries of open chip parts already exist (open RISC-V cores, open cell libraries), so "what would one make possible" is partly answered. "Library of chip parts" here means whole blocks, while the stop lights the standard cells and `.tried` speaks of cell libraries: two meanings of "library". What is still open is why reuse is harder than in software: a description can travel, but a layout fits one factory's process. | unclear | "An open block can be reused by anyone as a description, but its layout fits only one factory's process. What would let open chip parts spread the way open software did?" |
| `stop.open.block.tried` | "open cell libraries and design kits" | Plain language and coverage. Real (open kits for 130 nm and 180 nm lines have been public since 2020, and `wafer-space-run` and `tt-next-shuttle` rest on one). "Design kits" is bare jargon. For a thread the project gives special weight, one item is thin: open RISC-V cores and shared runs are the other live approaches, and both are already in `facts.json` (`riscv-rva23`, `pico2-riscv`, `tt-next-shuttle`). | unclear | ["open cell libraries", "open design kits: a factory's rules for drawing a chip, published", "open RISC-V cores that anyone can reuse", "shared chip runs that split the cost"] |
| `stop.life.block.q` | "Brain cells stay quiet until something changes. What if these cells did too?" | Accuracy and plain language. It implies chip cells are never quiet. A logic cell already switches only when its inputs change; what keeps going is the clock and the flip-flops it drives, and designers stop the clock to idle parts in every modern chip. "Cells" is used for brain cells and standard cells in one line without saying they differ. "Stay quiet" is also strong for brain cells, many of which fire at a low rate all the time. | misleading | "Brain cells signal mostly when something changes. Chips already stop the clock to parts with nothing to do. What if a chip had no clock at all, and each part worked only when news arrived?" |
| `stop.life.block.note` | "Most chip circuits are driven by a clock whether or not there is anything new to do." | Accuracy. Nearly all digital circuits are clocked, true. "Whether or not there is anything new to do" is not: stopping the clock to idle parts (clock gating) is standard practice. What is true and worth noticing is that the clock that remains is still one of the largest users of power. | misleading | "Almost every chip marches to a clock. Designers stop it wherever a part is idle, yet the clock that is left still takes a large share of the chip's power." |
| `stop.life.block.tried` | "spiking, brain-like chips" | Plain language and coverage. Real (`hala-point`, `neuro-2026`), but "spiking" is bare jargon, and the two approaches nearest to this stop's picture are missing: circuits with no clock, and stopping the clock to idle parts. | unclear | ["brain-like chips that send a spike only when something changes", "circuits with no clock at all", "stopping the clock to idle parts"] |

## Numbers needing a facts.json entry

- **Cells in a block** (`here.block`, "hundreds of thousands"). The fact: a block given to a place-and-route program typically holds from about a hundred thousand to a few million standard cells. Credible source: a design-tool maker's documentation or a published design paper (DAC, ISPD contest benchmarks). Needs a source.
- **Area per generation** (`chip.show.block`, `{area}` and `{density}`, from 0.7× length per generation in `src/engines/chip.js`). The same model constant the switch review listed; real cell density has grown less than twofold per generation lately, and memory cells less still. Needs a source, or a note that it is the model's rule.
- **Energy of fetching and computing** (`chip.show.block`, `{moving}`). 640 pJ and 0.18 pJ are in `energy-moving-data`. The engine also uses 0.62 pJ for a 16-bit multiply; it is in the same table of the same paper (checked there) but not in the entry's `value` or `detail`. Add it to the entry.
- **Closer memory** (`chip.show.block`, through `MEMS` in `src/engines/chip.js`: 8× the bandwidth and 0.25× the energy for memory in the package). No entry; looks like a model constant. Needs a source, or a note that it is the model's rule.
- **Share of power taken by the clock** (suggested `stop.life.block.note`, "a large share"). No digit, so the figures test should not ask for an entry, but the claim deserves one. The fact: the clock network and the flip-flops it drives commonly take a fifth to a half of a digital chip's switching power. Credible source: a processor power-breakdown paper (ISSCC or JSSC) or a standard textbook (Weste and Harris). Needs a source.
- **Levels of wire** (`what.block.wires`, "many levels"). No digit, so no entry is required. If a number is ever added: leading chips have well over ten metal levels; the studio's layout uses two. Credible source: a foundry's published process description. Needs a source if used.
- **The 40-cell cap** (suggested `what.block.yours`). A property of the picture (`src/app/scenes.js`), not an industry figure; no entry needed, but the words must change if the cap does.

Backed and correct: `stop.divide.block.note` has no digits and rests on `energy-moving-data` through `FIGURES['divide.block']`; the claim holds for memory chips (640 pJ against 0.18 pJ) and for on-chip memory too (8 to 11 pJ against 0.18 pJ).

## Keys that are fine

- `depth.block.name`
- `part.block.cells`
- `part.block.sram`
- `part.block.wires`
- `part.block.yours`
- `what.block.wires`
- `core.block.program`
- `core.block.pc` (fine as a label; the term is explained nowhere, see open risks)
- `core.block.decode` (fine as a label; see open risks)
- `core.block.regs` (explained by `build.need.regs.d`)
- `core.block.alu` (spelled out by `design.proj.alu.d`)
- `core.block.result`
- `core.block.tests`
- `core.block.mem`
- `core.block.control` (fine as a label; see open risks)
- `core.block.regsYours`
- `stop.think.block.q`
- `stop.idea.block.q`
- `stop.idea.block.note`
- `stop.idea.block.tried`
- `stop.open.block.note`
- `stop.divide.block.q`
- `stop.divide.block.note`
- `stop.divide.block.tried`

## Open risks

- **The source of `energy-moving-data` is named wrongly.** The entry says "arXiv (Dally et al.)" and "Table I of Dally and colleagues". The paper at its address is "Dark Memory and Accelerator-Rich System Optimization in the Dark Silicon Era" by Pedram, Richardson, Galal, Kvatinsky and Horowitz. The figures themselves match its Table I (16-bit: add 0.18, multiply 0.62, memory on the chip 8 and 11, memory chips 640 pJ; 3,556×). Outside scope, not changed.
- **Program counter, decoder and control are never explained anywhere.** They are labels drawn in two views, in boxes too narrow for more words (170 px with a number beside it; 140 px in the floor plan), so I left the labels alone. The explanation belongs in a caption. A suggestion for `core.cap.logic.d` (out of scope): "Your program runs on the core, one instruction at a time. The program counter holds the place of the instruction being run, counted in fours because each instruction takes four bytes. The decoder reads the instruction and tells the registers and the arithmetic unit what to do. Every add and comparison goes through the 32 copies of your slice." Control, the part that decides which instruction comes next, needs a line in `core.cap.layout.d`.
- **ALU has three names.** "ALU" (`core.block.alu`), "the arithmetic unit" (`core.budget.alu`, `design.proj.core.d`) and "arithmetic and logic unit" (`design.proj.alu.d`). The letters are never tied to the words in one place; "ALU (arithmetic and logic unit)" once in `design.proj.alu.d` would do it.
- **The same overstatement elsewhere.** `chip.memory` (out of scope) says "{moving}% of the energy spent moving numbers" with the same per-operation figure. `floor.yours` already says "on each multiply-add" and agrees with the suggested `chip.show.block`.
- **The model disagrees with itself.** `moving` says nearly all energy goes to memory, while `power` in the same engine is switching plus leakage with no memory term, so changing reuse or memory position moves `{moving}` but not the power any depth shows. The suggested words are true whatever the constants are; whether the engine should change is not a wording matter.
- **Three meanings of "cell", two of "block".** I fixed the in-scope uses. "Block" also means a part of the core's diagram in the `core.block.*` key names (not visible) and a piece of the community plan in places; `stop.think.chip.note` ("each block does one narrow job") is consistent with the suggested `depth.block.see`.
- **One picture for three worlds.** This depth is shared by the data centre, phone and car dives. A car microcontroller's block also holds memory that keeps its program without power (`depth.mcu.see` says so); the suggested `what.block.sram` describes only the kind that forgets. Whether the car dive should say more is a design decision.
- **`stop.divide.block` shows memory beside the logic.** The picture has the memory array touching the cells, while the big cost in the backing fact is memory on other chips. The note is still true for the memory shown, so I left the stop alone; the Try there ("reuse") is about the far memory.
- **An empty panel.** In the core's datapath view without tests, `core.block.mem` labels a panel with nothing in it and no wire to it, though programs do load from memory (`core.test.add.t`). A drawing matter, noted because the label then explains nothing.
- **`here.block` with no design.** `cells` is 0 when nothing is built (`src/app/ui.js`), giving "became 0 cells". Not checked in the browser.
- **Simplifications I let stand.** "Programs decide where the parts go" (people still set the floor plan and the limits the programs work within); "nobody placed these cells by hand" (true of the standard cells the stop lights, not of the memory cell, which is drawn by hand); "software grew this way"; "AI that places and wires chips" (placing is further along than wiring).
- **Stop text and the figures test.** The suggestions add no digits to any stop. I did not run `npm test` and do not know whether number words are checked; I avoided them in stops ("a pair of").
- **Limited outside check.** Only the energy table was looked up. The clock's share of power, cell counts per block and the dates of the open design kits are from general knowledge and should be confirmed when their `facts.json` entries are written.
