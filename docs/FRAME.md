# The frame

The structure of the lab from November 2026 on. New content fills it; it does not change it.
Data: `src/data/weave.js`. Logic: `src/engines/weave.js`. Tests: `tests/weave.test.mjs`.

## The idea

The lab is one world, entered by diving. There is one thing on screen: a continuous zoom from a data-centre building down to silicon atoms. Open questions run through it as threads. A visitor meets a question on the part of a scene it is about; once picked, the question stays with them as they go deeper or higher, and takes a new form at every depth it reaches. The question behind the question matters more than any answer.

## What visitors see

- **The dive.** Eight depths: building, rack, board, chip, block, gate, switch, atom. Each depth is a scene in a 1000 x 1000 space; the next depth lives inside a small square of it (its portal), and the camera slides between the whole scene and that square, so the dive never cuts. The depth you came from stays faintly around the edges. Scroll, drag, the arrow keys or the rail move it.
- **Questions on the parts.** At every depth, the questions crossing it sit as coloured dots on the parts they are about, and are listed in the card. Picking one lights up its parts and draws a line from the card to them.
- **Threads through the depths.** A question you follow shows its form at this depth, something true to notice, and what people are trying; then *Go deeper* or *Go back up* flies to its next form. The rail shows the depths where it has a form, joined by its colour.
- **The core questions, one at a time.** Each thread begins as one of eleven core questions. A core question is never listed with the others: it appears on its own, in the card, once the visitor has followed its thread through two depths, with the question it leads toward.
- **One drawing style.** Simple glowing outlines, the same at every depth (Fable's world build), in dark and light.

## The structure

- **Depths (8).** `DEPTHS`: id, metres across the view, and the portal square of the next depth.
- **Threads (11).** `THREADS`: one per core question, recognised by colour and words, never by a name. Words: `thread.<id>.root` (the core question) and `thread.<id>.behind` (the question it leads toward).
- **Stops (45).** `STOPS['thread.depth']`: the parts of that depth's scene the question lights up. Words: `stop.<thread>.<depth>.q`, `.note` and, for some, `.tried`.

Adding a question means adding a stop: a thread, a depth, the parts it is about, and its words. Tests check every stop lights up real parts, every thread spans at least two depths, every depth is crossed by at least two questions, and no text gathers the core questions together.

| Core question | Depths where it has a form |
|---|---|
| How does a chip think? | rack, board, chip, block, gate, switch, atom |
| What is the strangest thing that could compute? | chip, gate, switch, atom |
| What could a chip never do, and could it learn to? | rack, chip, gate, atom |
| Why can a perfect design fail in the real world? | building, board, chip, gate, switch, atom |
| How could your idea become a chip? | chip, block, gate |
| What would chipmaking look like if we invented it from scratch today? | chip, switch, atom |
| What part of making chips can't be written down? | chip, switch |
| What happens when anyone can make a chip? | chip, block, gate |
| How should a chip divide its work? | building, rack, board, chip, block |
| What new kinds of computers could brains, swarms and living cells inspire? | building, block, switch, atom |
| What will be the next Moore's law? | building, chip, switch, atom |

This table is for people building the lab. Visitors never see the questions together.

## History

- **Before November 2026** the site was a map of 38 topics with over 90 simulations, a RISC-V lab, a tiny-chip studio and much more. It is kept, unchanged, on the branch `claude/before-dive-2026-11`, to learn from and to bring pieces back when they fit.
- **First prototype:** a journey called *One answer* (a reply travelling from a phone down to the atoms and back), starting at the planet, with a time lens and a sky of found questions. Dropped: the site leads into an open world rather than to answers, a story is a linear path, and the planet added nothing. Kept on `claude/one-answer-prototype-2026-11`.
- **Second prototype:** the dive with separate questions at places, each pointing to the question behind it, plus the time lens. Replaced by this: questions now run through the depths as threads, the dive follows Fable's continuous zoom, and the time lens is gone (time and the dive did not belong together).
- **Fable's world build** (an artifact, November 2026) is the reference for the zoom, the scenes, the threads and their words.

## Open

- **Different types of chips.** Diving into a phone, a car or a microcontroller as well as a data centre, instead of a timeline.
- **More questions,** above all where few threads stop (know, make, idea), and questions from the community.
- **The question behind the core question:** what a visitor can do once they reach it.
