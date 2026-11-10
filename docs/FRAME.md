# The frame

The fixed structure of the lab from November 2026 on. New content fills it; it does not change it.
Data: `src/data/frame.js`. Words: `frame.*` in `src/i18n/en.json`. Tests: `tests/frame.test.mjs`. View: `#questions`.

## Why

The site grew topic by topic until the structure got heavy and the learning idea blurred. Two prototypes in November 2026 tested a new shape:

- **Eleven questions on a chip die.** Open questions instead of topics. Each leads to a bigger question beyond chips.
- **Powers of ten.** One continuous dive from the planet to the atom (the idea behind `#zoom`).

The site already holds the substance (38 topics, 106 challenges, 18 tested engines, sourced facts). The prototypes held the shape. The frame joins them: **the questions and the depths become the structure, and every existing topic docks at one place in it.** Nothing is removed.

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
- **Kept from the prototypes:** the die of eleven questions as home; the continuous zoom as the main view; one question changing form at each depth; an AI companion that does not answer but asks the question behind the question; visible gaps.
- **Dropped:** the spinning globe (it moved without adding meaning). The planet depth should be a still map of one chip's journey, whose stages are doors into the depths.
- **To retire later:** the seven bands as navigation and the Beginner/Engineer switch (already being replaced by depth labs, see `DEPTH.md`).

## Next

The build steps are in the [roadmap](ROADMAP.md), under "Now".
