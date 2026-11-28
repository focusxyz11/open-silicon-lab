# The ways in

Every way into the lab, where it lands, what is on the screen then, the moves from there, and how deep it is: how many
things a newcomer must understand before the first useful tap. Written for #524 (the owner, 27 November 2026: "without
the whole view, it leads to some place in the island; entering the island too deep is still unsolved"), by Claude Opus
5.5 in the nightly build of 28 November 2026, from the code as it stands on main. The options for a better structure are
drawn in `docs/prototypes/ways-in/index.html`; the owner chooses among them, and the full build follows as its own task.

Depth counts the things on the screen a newcomer has to read before a tap does something useful: 1 is one picture with
one obvious move; 4 or more is a tool.

## From the first page (Hold, `#/`)

| Way in | Lands on | On screen then | Moves from there | Depth |
| --- | --- | --- | --- | --- |
| *Build your stack* (Hold's last block, `src/v2/holdisle.js`) | `#/stack` | Until 28 Nov: the whole instrument (seven rungs with live numbers, five gene menus, *Fifty years of polish* with its year, directions and agents, Look · Do 7 · Ask 6), filed as *The Lab › Your stack*, the loop lighting *Use*. Now: the ladder alone, filed under *The first page*, no stage lit; the genes, the polish and the agents one step away | the rungs, Every attempt, Its niche, As designed · made · used, the loop | was 6, now 2 |
| A rung of the ladder | `#/stack/<rung>` | the stack flown to that rung, its controls in Do (`#/stack/chip`: Do 14, thirteen stepping stones) | the rung's controls, its stones (`#/do/<id>`), along its faces | 4 |
| *the island* (quieter link) | `#/island` | the 3D map of places, the welcome card | a place (tap), the loop, the Map | 2 |
| *the Map* (quieter link) | `#/log` | the cut through the ground: the loop as the ground line, each place a shaft of its levels, your log under it | any level or place by a tap, the lattice, jump by name | 3 |
| A core question on a moment or a wall | `#/q/<id>` (since #517) | one question's card: the question, a still picture, why it matters, where it lives | a lit level (lands with the lens on), It meets | 1 |
| A *Play it here* link on a block | the level's view (`#/dive/gate`, `#/line/print`, `#/bench/need`…) | that view, its frame and card | in · out, along, the card | 3 |

## From the bar (every page)

| Way in | Lands on | On screen then | Moves from there | Depth |
| --- | --- | --- | --- | --- |
| The logo | `#/` | the first page | as the first page | 1 |
| *Map* | `#/log` | the Map (see above) | the Map's moves | 3 |
| A stage of the loop | one of five kinds of place, by `alongTo` (below) | a place on the island, a stack face, a line step, the bench or the dive at the level you hold | whatever that view offers | 2 to 5 |
| *Break it* (⚑) | a panel over the page | what was reported here, a form | keep a report | 1 |

## From the island and the places

| Way in | Lands on | On screen then | Moves from there | Depth |
| --- | --- | --- | --- | --- |
| A place on the island | `#/place/<p>` | the place's card over the island (Look · Do · Ask) | inside (its first level), its challenges, along the road | 2 |
| *Inside* a place | its first level (`#/place/datacentre/0`, `#/place/studio/1`, `#/line/<step>`) | the flight, the room or the line, with the frame | in · out, along, the card's three faces | 4 |
| The Lab | `#/place/lab` | the record of the build, the plan, the stack's door | `#/build`, `#/stack`, the machines | 3 |
| Out to the sea (↑) | `#/ecosystem` | the islands around: phones, cars, tools, materials, power | another island, What if?, the supply map | 2 |

## From a level, the stack, a lab, a card

| Way in | Lands on | On screen then | Moves from there | Depth |
| --- | --- | --- | --- | --- |
| A level in a view (the rail, ↑ ↓) | the next level in or out | the same frame, the next picture | the same moves | 2 |
| A mark on the picture, or Ask | a lens on the level | the lens card: its form here, True here, what it repaints, Play it here, the core question at its foot (now a link to its card) | its card, Hold both, ↑ ↓ with the lens on | 2 |
| A challenge (Do, `#/do/<id>`) | the level where it is played | its lab in the card, the picture behind | play, back to Look | 3 |
| A stack's mark | the lens alone in the stack's card | as a lens card | its card | 2 |
| A core question's card (`#/q/<id>`) | the card | three bands: see it, place it, read it | a lit level with its lens on, a rung of the stack, It meets | 1 |
| A shared link | the address it holds, whole | the view, as the sender saw it (the island behind a reading page) | that view's moves | as that view |

## Where a stage of the loop lands: every destination of `alongTo`

`alongTo(whereOf(address), stage)` in `src/engines/way.js`, run on main for the addresses below (· : the button is
the stage you are at, and does nothing). The same button goes to five kinds of place:

1. a **place on the island** (`#/place/<stage's place>`): from the island, a page, and every stage nothing carries to;
2. a **stack face** (`#/stack/design`, `#/stack/make/<rung>`): from the stack, design and make turn the plates;
3. a **line step** (`#/line/wires`, `#/line/test`, `#/line/pkg`): from the line, make, test and ship walk it;
4. the **bench** at the level you hold (`#/bench/need`, `#/bench/gates`, `#/bench/layout`): design, from a level that has a twin as designed;
5. the **dive or the chip** at the level you hold (`#/dive/<level>`, `#/chip/<n>/build`, `#/dive/die/made`): use and make, from a level that has a twin there.

| From | Where it is (view · stage · level) | Open | Design | Make | Test | Ship | Use |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `#/` | island | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | `#/place/datacentre` |
| `#/island` | island | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | `#/place/datacentre` |
| `#/place/lab` | island · open | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | `#/place/datacentre` |
| `#/place/studio` | island · design | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | `#/place/datacentre` |
| `#/place/fab` | island · make | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | `#/place/datacentre` |
| `#/place/datacentre` | island · use | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | `#/place/datacentre` |
| `#/place/datacentre/2` | flight · use · rack | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | · |
| `#/place/studio/1` | room · design · need | `#/place/lab` | · | `#/dive/die/made` | `#/place/test` | `#/line/pkg` | `#/dive/chip` |
| `#/dive/rack` | dive · use · rack | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | · |
| `#/dive/chip` | dive · use · chip | `#/place/lab` | `#/bench/need` | `#/dive/die/made` | `#/place/test` | `#/line/pkg` | · |
| `#/dive/block` | dive · use · block | `#/place/lab` | `#/bench/layout` | `#/chip/1/build` | `#/place/test` | `#/place/port` | · |
| `#/dive/gate` | dive · use · gate | `#/place/lab` | `#/bench/gates` | `#/chip/2/build` | `#/place/test` | `#/place/port` | · |
| `#/dive/switch` | dive · use · switch | `#/place/lab` | `#/place/studio` | `#/chip/3/build` | `#/place/test` | `#/place/port` | · |
| `#/dive/atom` | dive · use · atom | `#/place/lab` | `#/place/studio` | `#/chip/4/build` | `#/place/test` | `#/place/port` | · |
| `#/dive/phoneboard/phone` | dive · use · phoneboard | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | · |
| `#/dive/die/made` | dive · make · die | `#/place/lab` | `#/bench/need` | · | `#/place/test` | `#/line/pkg` | `#/dive/chip` |
| `#/chip/3/build` | chip · make · switch | `#/place/lab` | `#/place/studio` | · | `#/place/test` | `#/place/port` | `#/dive/switch` |
| `#/bench/need` | bench · design · need | `#/place/lab` | · | `#/dive/die/made` | `#/place/test` | `#/line/pkg` | `#/dive/chip` |
| `#/bench/gates` | bench · design · gates | `#/place/lab` | · | `#/chip/2/build` | `#/place/test` | `#/place/port` | `#/dive/gate` |
| `#/bench/layout` | bench · design · layout | `#/place/lab` | · | `#/chip/1/build` | `#/place/test` | `#/place/port` | `#/dive/block` |
| `#/line/print` | line · make · print | `#/place/lab` | `#/bench/gates` | · | `#/line/test` | `#/line/pkg` | `#/dive/gate` |
| `#/line/test` | line · test · test | `#/place/lab` | `#/place/studio` | `#/line/wires` | · | `#/line/pkg` | `#/place/datacentre` |
| `#/line/pkg` | line · ship · pkg | `#/place/lab` | `#/bench/need` | `#/line/wires` | `#/line/test` | · | `#/dive/chip` |
| `#/stack` | stack · use | `#/place/lab` | `#/stack/design` | `#/stack/make` | `#/place/test` | `#/place/port` | · |
| `#/stack/chip` | stack · use · chip | `#/place/lab` | `#/stack/design/chip` | `#/stack/make/chip` | `#/place/test` | `#/line/pkg` | · |
| `#/stack/make/gate` | stack · make · gate | `#/place/lab` | `#/stack/design/gate` | · | `#/place/test` | `#/place/port` | `#/stack/gate` |
| `#/log` | log | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | `#/place/datacentre` |
| `#/q/perfect` | island | `#/place/lab` | `#/place/studio` | `#/place/fab` | `#/place/test` | `#/place/port` | `#/place/datacentre` |
| `#/do/flaky` | bench · design · gates | `#/place/lab` | · | `#/chip/2/build` | `#/place/test` | `#/place/port` | `#/dive/gate` |

What this shows: *Open* always lands on the Lab, and *Test* lands on the test house from everywhere but the line; the
other four depend on where you stand, so the same button is a place on the island from a page, the bench from a gate,
a stack face from the stack and a line step from the line. A card (`#/q/<id>`) and the first page are read as the
island, with no stage lit.

## What was fixed on 28 November (the smallest build)

- From the first page, the stack is no longer filed as one place of the island: its path reads *The first page › Your
  stack*, its up arrow and Escape lead back to the first page, and the loop in the bar lights no stage while you stay
  in the stack (`src/v2/stack/card.js`; Hold's ways into the stack mark the arrival, `src/v2/holdisle.js`).
- `#/stack` from the first page opens on the ladder alone: the genes and the dock (fifty years of polish, the
  directions, the agents) wait behind one button in the card, *Fifty years of polish →*; opening a rung brings them back.
- Reached from the island (the Lab) or by its address, the stack is as before.

Not built (the owner decides first): the bar's three whole views, the Map as the home, the loop's new role.
