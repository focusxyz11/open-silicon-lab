# The frame

The fixed structure of the lab from November 2026 on. New content fills it; it does not change it.
Data: `src/data/frame.js`. Tests: `tests/frame.test.mjs`. No view shows it directly.

## Why

The site grew topic by topic until the structure got heavy and the learning idea blurred. Two prototypes in November 2026 tested a new shape:

- **Eleven open questions.** Each leads to a bigger question beyond chips.
- **Powers of ten.** One continuous dive from the planet to the atom (the idea behind `#zoom`).

The site already holds the substance (38 topics, 106 challenges, 18 tested engines, sourced facts). The prototypes held the shape. The frame joins them: **the questions and the depths become the backbone, and every existing topic docks at one place in it.** Nothing is removed.

**The eleven questions are never listed.** A list of questions reads as a quiz with answers to find, and suggests the lab holds only eleven. They stay underneath, as the backbone that organises everything a visitor meets.

## What visitors see

One world they travel through, along journeys. The questions surface where knowledge runs out.

- **One world, space and time.** *The dive*: one continuous zoom from the planet to the atom. *The time lens*: the same place in any year from 1947 to 2040; every depth changes with the year, and the future is drawn unfinished. *The workbench*: the existing challenges open inside the scene, where they belong.
- **Journeys, the main threads.** Concrete stories that cross every depth and connect the questions without naming them: *One answer* (a reply travels from a phone to the data centre down to electrons and back), *One chip's life* (from sand to the factory to use and to waste), *Sixty years* (the same places across time), *Your chip* (from an idea of yours to a chip you share).
- **Open edges.** Places drawn unfinished, where what anyone knows runs out. Each holds one deeper question, what people are trying, and challenges to push on. Something to explore, never an answer to find.
- **The constellation.** Each edge a visitor finds becomes a star. As stars collect, lines between them appear: those lines are the eleven questions, seen only as patterns in what the visitor discovered. Other visitors' stars can show faintly.
- **An AI companion** travels along. It does not answer; it asks the question behind the question.

Every edge, challenge and companion conversation is tagged to one of the eleven questions in the data.

## The structure

Every place in the lab has an address: **question + depth (+ year)**.

- **Questions (11).** The framework. Ten run down through the world as threads; the eleventh, *What will be the next Moore's law?*, also lives on the time dial.
- **Depths (10).** Planet, region, building, rack, board, chip, block, gate, switch, atom. One continuous zoom.
- **Time.** The existing time machine, 1947 to 2040.
- **Portals (19).** Links between questions, each with a reason.

Each topic docks where its question meets its depth (`PLACES`). A topic keeps its own links, so it still connects elsewhere.

| Question | Topics, by depth | Challenges |
|---|---|---|
| Think: How does a chip think? | riscv (chip), clock (block) | 11 |
| Strange: What is the strangest thing that could compute? | pbits (gate), photonic (switch) | 2 |
| Limit: What could a chip never do, and could it learn to? | reversible (gate), quantum, floor (atom) | 8 |
| Fail: Why can a perfect design fail in the real world? | bench (board), reality (chip) | 9 |
| Idea: How could your idea become a chip? | design, layout, agent (block), tiny (gate) | 13 |
| Make: What would chipmaking look like if we invented it from scratch today? | factory (building), yield (chip), litho (gate), fab (switch), physics (atom) | 21 |
| Know: What part of making chips can't be written down? | supply, innovation (planet), xray (chip) | 7 |
| Open: What happens when anyone can make a chip? | everywhere, economics (region), community (chip) | 6 |
| Divide: How should a chip divide its work? | memory, package, analog (board), architecture, accelerators, build, spatial (chip) | 18 |
| Life: What new kinds of computers could brains, swarms and living cells inspire? | datacenter (building), neuro, beyond (chip), cim (block), evolve (gate) | 7 |
| Scale: What will be the next Moore's law? | future (planet), transistor (switch) | 4 |

## What the review found

- **Make (21) and Divide (18) are heavy; Strange (2), Scale (4) and Open (6) are thin.** New work goes to the thin questions first.
- **The rack depth is empty for every question**, and the planet and region depths hold only industry topics. The upper depths need content about people and ecosystems, not only factories.
- **Each question shows open places**: depths where it has nothing yet. They stay visible on purpose; they are where new challenges and community questions go.

## Kept, changed, dropped

- **Kept from the site:** every topic, engine, challenge, fact, the time machine, My chip, the community chip, RISC-V.
- **Kept from the prototypes:** the continuous zoom as the main view (strengthened); one question changing form at each depth, shown as open edges; an AI companion that does not answer but asks the question behind the question; visible gaps.
- **Dropped:** any list or menu of the eleven questions (including a die of question blocks as home), and the spinning globe, which moved without adding meaning.
- **To retire later:** the seven bands as navigation and the Beginner/Engineer switch (already being replaced by depth labs, see `DEPTH.md`).

## The first slice: the dive with its questions (prototype)

`#dive` (not in the top bar yet; linked from the footer). Code: `src/app/dive.js` (the view), `src/engines/dive.js` (time lens, zoom sizes, the web of questions; tested in `tests/dive.test.mjs`), `src/data/dive.js` (depths, unfinished places, challenges in place). Words: `dv.*` in `src/i18n/en.json`.

A first try framed this as a journey called *One answer* (a reply travelling from a phone to the atoms and back), starting at the planet. It was dropped: the site leads into an open world rather than to answers, a story is a linear path, the planet adds nothing yet, and listing or naming the questions (a constellation of them) separates them from the world.

- **The dive.** Eight depths, building to atom, in one continuous zoom, on the scheme of Zoom into your chip and with the palette of the rack-to-atom zoom, simplified. Block, gate and switch are computed: a full adder from the tiny-chip studio, synthesised, placed and routed by `src/engines/chipzoom.js`, inside a grid of multiply-add units, with the values of its bits on every wire and transistor.
- **Questions inside the dive.** Wherever something is unfinished, a broken ring holds a question (15 so far, at every depth). Each card shows the question, what people are trying and a sourced fact, and *the question behind it*: one or two other questions, somewhere else in the dive, deeper or higher. Choosing one carries the question through the zoom to its place and opens it there. The questions form one web with no end: from any question every other can be reached, and they lead both down and up (tests check this). There is no route and no list.
- **The eleven core questions stay underneath.** Each question carries one (`q` in the data); they are never shown, named or listed.
- **The rail.** A thin line at the left edge of the scene marks the depths, where you are, and the path your questions have taken up and down the dive.
- **The time lens.** 1947 to 2040. Before a place existed it is a grey ghost; after today it sits on blueprint paper with dashed, unfinished parts. Each depth has its own time line; the chip line reads the time machine's data, and the adder is drawn at the nearest of the four processes this lab models.
- **The workbench.** Three existing, self-checking challenges open in place (Bandwidth per stack at the board, Sixteen answers at the block, Why planar was retired at the switch). The simulation panel is borrowed from its topic page and put back when closed.
- **Open for later:** what sits above the building; other main visual designs that connect with the dive; how new questions from the community join the web.

## Next

The build steps are in the [roadmap](ROADMAP.md), under "Now".
