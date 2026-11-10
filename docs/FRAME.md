# The frame

The structure of the lab from November 2026 on. New content fills it; it does not change it.
Data: `src/data/weave.js`. Logic: `src/engines/weave.js`. Tests: `tests/weave.test.mjs`.

## The idea

The lab is one world, entered by diving. There is one thing on screen: a continuous zoom from a data centre, a phone or a car down to silicon atoms. Open questions run through it as threads. A visitor meets a question on the part of a scene it is about; once picked, the question stays with them as they go deeper or higher, and takes a new form at every depth it reaches. The question behind the question matters more than any answer.

## What visitors see

- **Three ways down.** The dive starts in a data centre (building, rack, board, chip), a phone (phone, board, chip) or a car (car, control unit, chip), chosen in the top bar. Every way down meets the others in the same four lower depths (block, gate, switch, atom), because every chip is built from the same kinds of cells, switches and atoms. Changing the start keeps a shared depth where it is, and matches the steps above it (a chip is a chip, a board is a board).
- **The dive.** Each depth is a scene in a 1000 x 1000 space; the next depth lives inside a small square of it (its portal), and the camera slides between the whole scene and that square, so the dive never cuts. The depth you came from stays faintly around the edges. Scroll, drag, the arrow keys or the rail move it.
- **Questions on the parts.** At every depth, the questions crossing it sit as coloured dots on the parts they are about, and are listed in the card. Picking one lights up its parts and draws a line from the card to them.
- **Threads through the depths.** A question you follow shows its form at this depth, something true to notice, and what people are trying; then *Go deeper* or *Go back up* flies to its next form. The rail shows the depths where it has a form, joined by its colour.
- **What backs a stop.** Under a question, the figures behind it, each with its source, its kind (reported, estimate, a maker's claim, a projection) and the date it was checked; and, at some stops, a real case: a chip that passed its checks and still failed, told in three parts (what happened, why, what changed), with its source.
- **The companion.** *What's behind this question?* opens a prompt that carries the place and the question, for the visitor to paste into any AI assistant. It asks the assistant not to answer, but to help find the question behind it, one question at a time. It names the core question only once the visitor has met it.
- **Open places.** Where a followed question has no form yet, the card says nobody has asked it here yet and invites the visitor to write it, through the repository's question form, with the place and the question it follows on from filled in. Every depth also offers *Propose a question*.
- **The core questions, one at a time.** Each thread begins as one of eleven core questions. A core question is never listed with the others: it appears on its own, in the card, once the visitor has followed its thread through two depths, with the question it leads toward.
- **One drawing style.** Simple glowing outlines, the same at every depth (Fable's world build), in dark and light.

## The structure

- **Worlds (3).** `WORLDS`: each kind of chip's way down, as a list of depths ending in the `SHARED` ones. Words: `world.<id>.name`.
- **Depths (14).** `DEPTHS`: metres across the view, and the portal square of the next depth. A depth above the shared ones belongs to one world only, so its portal always leads to one place.
- **Threads (11).** `THREADS`: one per core question, recognised by colour and words, never by a name. Words: `thread.<id>.root` (the core question) and `thread.<id>.behind` (the question it leads toward).
- **Stops (65).** `STOPS['thread.depth']`: the parts of that depth's scene the question lights up. Words: `stop.<thread>.<depth>.q`, `.note` and, for some, `.tried`.
- **Figures.** `FIGURES['thread.depth']`: ids in `src/data/facts.json`. A number in a stop's question or note must have one.
- **Cases (7).** `CASES`: real events shown at a stop, with a year and a link. Words: `case.<id>.t`, `.what`, `.why`, `.after`, `.src`.

Adding a question means adding a stop: a thread, a depth, the parts it is about, and its words. Tests check, in every world, that the zoom never jumps, every stop lights up real parts, every depth is crossed by at least two questions; that every thread spans at least two depths and no text gathers the core questions together; and that every figure and case has its source.

| Core question | Depths where it has a form |
|---|---|
| How does a chip think? | rack, board, chip, block, gate, switch, atom, soc, mcu |
| What is the strangest thing that could compute? | chip, gate, switch, atom |
| What could a chip never do, and could it learn to? | rack, chip, gate, atom |
| Why can a perfect design fail in the real world? | building, board, chip, gate, switch, atom, phoneboard, car, ecu |
| How could your idea become a chip? | chip, block, gate, soc |
| What would chipmaking look like if we invented it from scratch today? | chip, switch, atom, mcu |
| What part of making chips can't be written down? | chip, switch, phone, car |
| What happens when anyone can make a chip? | chip, block, gate, phoneboard, ecu |
| How should a chip divide its work? | building, rack, board, chip, block, phone, soc, car, ecu |
| What new kinds of computers could brains, swarms and living cells inspire? | building, block, switch, atom, phone, car |
| What will be the next Moore's law? | building, chip, switch, atom, phoneboard, soc, mcu |

This table is for people building the lab. Visitors never see the questions together.

## History

- **Before November 2026** the site was a map of 38 topics with over 90 simulations, a RISC-V lab, a tiny-chip studio and much more. It is kept, unchanged, on the branch `claude/before-dive-2026-11`, to learn from and to bring pieces back when they fit.
- **First prototype:** a journey called *One answer* (a reply travelling from a phone down to the atoms and back), starting at the planet, with a time lens and a sky of found questions. Dropped: the site leads into an open world rather than to answers, a story is a linear path, and the planet added nothing. Kept on `claude/one-answer-prototype-2026-11`.
- **Second prototype:** the dive with separate questions at places, each pointing to the question behind it, plus the time lens. Replaced by this: questions now run through the depths as threads, the dive follows Fable's continuous zoom, and the time lens is gone (time and the dive did not belong together).
- **Third version (November 2026):** the same dive, with three ways down (a data centre, a phone, a car) instead of a timeline.
- **From the earlier site and Fable's build (November 2026):** the real cases and the sourced figures came from the earlier site; the companion and the open places came from Fable's world build (its companion could also talk live when the page can reach Claude; its open places kept questions on one device; here they go to GitHub instead).
- **Fable's world build** (an artifact, November 2026) is the reference for the zoom, the scenes, the threads and their words.

## Open

- **More ways down,** such as a satellite, a hearing aid or a tiny open-source chip made by a learner.
- **More questions,** above all where few threads stop (know, make, idea), and questions from the community.
- **The question behind the core question:** what a visitor can do once they reach it.
