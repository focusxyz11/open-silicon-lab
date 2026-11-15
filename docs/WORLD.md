# The chip world

How the chip world (`index.html`, `src/v2/`) holds everything together. The island is the first page; this
note is about what connects it: one main thread, the same three doors everywhere, and an island that grows.

## The main thread: a chip's life, round the loop

A chip is the brain of almost anything, so the lab does not draw everything a chip goes into. It follows one
chip round the loop every chip goes round (`docs/SYSTEM.md` §2, `src/engines/way.js`):

**Open → Design → Make → Test → Ship → Use**, and what is learned in use opens the next.

It starts with what is open, and there are two ways in. *Someone needs it:* the pieces of the shared computer
nobody has built. *It has become possible:* a new way to compute that is still looking for what it is best at.
Much of chip history ran the second way, so the stage is not called a need. The community stands here, at the
Lab, and the Lab's card shows both ways in.

The loop is in the bar on every screen (the stage you are at is lit; a tap moves you along, keeping your level)
and on the island as a ring road, with your chip standing at the stage you are looking at. Each stage has a
place: Open at the Lab (and the village), Design at the studio, Make at the factory (the crystal is the first
part of making), Test at the test house, Ship at the port, Use at the data centre. Every place's card offers
*Next*, the next place round the loop, so the thread can be followed from anywhere and left at any tap. Where a
chip goes after the port (a phone, a car, a data centre) is a challenge at Ship, because what it must survive
depends on where it lives. The five steps after Open keep a tick each when their challenges are done; Open has
none, because it is never finished.

## Every place has an inside: where the earlier site lives

The island is the top row of the grid: moving along the loop, a chip's life. Going into a place is going
down its column: its steps and levels. So every page of the earlier site (retired; a world and a depth) has an address
on the island, a place and a level (`src/data/places.js`):

| Place | Levels |
| --- | --- |
| Design studio | The job → Describe → Check → Gates → Layout → Masks |
| Sand to crystal | Crystal → Wafers |
| The factory | Clean → Deposit → Print → Etch → Implant → Wires, and inside a machine: Machine → Wafer → Chip |
| Test house | Test |
| The port | Package → Out |
| Data centre | Building → Rack → Board → Chip → Block → Gate → Switch → Atom |
| Phone island | Phone → Board → Chip → Block → Gate → Switch → Atom |
| Car island | Car → Control unit → Chip → Block → Gate → Switch → Atom |

The block, gate, switch and atom are in every chip, so every dive ends in them. Every question (a stop,
`thread.depth`) lives at its depth, so at its place: the Ask door lists them level by level, and nothing is
picked by hand. Every challenge happens at a place and a level (`place`, `at`). A level opens its page in the
current site until it is redrawn here (the data centre's first levels already fly in 3D: `FLOWN`), and every page
of the current site has a "Chip world" link back to its place.

## The studio and the factory: one story, joined by the masks

The design line ends in masks; the factory's Print uses them. When a design passes its check, the challenge goes
on down the line: its gates, its layout, its masks, then what the factory does to it (a lap round the line for
each mask, and one speck of dust that leaves a wire stuck, in a copy that looks exactly like the others). For your full adder it is the very fault you
hunt at the test house, where the four copies are of your own design once you have won it (`spotCode`). On the island, the studio is a campus at the start of the loop, and its mask
house sends the first masks you make down the road to the factory, on a truck.

## Scene, ornaments, story: no side panel (prototype: the board, `#/board`)

Where content meets the picture, three layers, each with one job, wired both ways:

- **The scene** fills the screen. Every piece of content has a type and a home on a part: its name sits on the
  part, a figure is a reading on it, a question is a mark you can tap. Tap a part and the story goes to its step.
- **Ornaments** at the edges say where you are, never paragraphs: the depth rail, the way back up, a live goal.
- **The story** is docked below, one step at a time (steps, not scrolling), and it drives the scene: each step
  moves the camera and lights a part. Its words are touchable: `[[part|words]]` lights that part, `[[#name]]` is a
  live number you drag, and the scene answers (the cores light up as much as they are busy, the numbers stream
  from memory as light). A step can ask for a prediction before the number moves.

A story is data (`src/v2/stories.js`, played by `src/v2/story.js`); its numbers come from the engines, never from
the words. Long reading belongs in a reading view opened on purpose, never beside the picture.

## Inside a chip: the dive and the line as one picture

The dive and the factory line meet in one view, `#/chip` (`src/v2/chip3d.js`): a cut through a chip, its layers
stacked as they are. Read from the top down it is the dive: the package, the wires of a block, the gates, the
switches, the silicon. Read from the bottom up it is the line: crystal and implant make the silicon, etch makes
the switches, print makes the gates, wires join them, packaging closes it (`MADE` in `src/data/weave.js`). One
position and two modes: diving, the layers above you lift away; building, they are not made yet, and come down
into place step by step. The panel is an instrument, not a column of text: the two modes, the stack of rows (each
a depth and the steps that make it), and what this row is or how it is made, with its question. Once you have won a design at the studio, your design is in these layers
too: its gates printed at Print, its transistors etched at Etch, its wires laid at Wires (`yourDesign`). The data
centre's flight ends by going into it; the levels block to atom, and the factory steps that make them, open it.

## Every place has one card, with three faces

Whatever you tap opens the same card at the bottom, on the island and inside every view (`docs/SYSTEM.md` §4):

- **Look**: one line on what this is, and the two moves from here: *Go inside* (tap the place again to go in)
  and *Next* round the loop. Then the place's insides: its **steps**, where they follow each other in time
  (drawn with arrows), and its **levels**, where one is inside the next, each with how many questions wait there
  and a dot where a challenge waits; then any other way in (the supply map at the port).
- **Do**: challenges, each checked for real by one of the lab's engines. A circuit by the tiny-chip engine
  (`src/engines/design.js`), your chip's settings by `src/engines/chip.js`, a chip's years in a phone, a car or
  a data centre by `src/engines/life.js`, a broken copy by the design engine's factory faults. A challenge is
  played in the card of the view that shows its level. Under Do also sit the open things of the ledger that
  belong there: designs nobody has broken where designs are checked, pieces nobody has built where the job is
  chosen. AI can propose; the check decides.
- **Ask**: the questions that stop here (stops of the threads), what people and agents asked, its debates, and
  at the Lab the new ways to compute, first.

There is no menu. *Your log* (`#/log`) keeps the questions you met, what you did, the challenges by step, and a
jump to anything by name; the Lab's inside (`#/build`) is the record of the shared computer; the world around
the island (the islands across the sea, the supply map) is the way out from it, ↑ on the island.

## The island grows

Nothing on the island is decoration that never changes. Two things make it grow:

- **What you finish.** Every challenge names what it grows (`grows` in `CHALLENGES`, drawn by `GROWERS` in
  `src/v2/map3d.js`): a screen at the studio, trucks on the loop, a probe tower, a ship to phone island, solar
  panels at the data centre. It grows in, with sparkles, and a note says what appeared. Your progress stays in
  your browser (`osl-world-v1`).
- **What the community builds.** The shared computer at the Lab (`src/data/build.js`) rises one floor for every
  piece of the plan: built pieces are solid, a piece you have designed glows, open pieces are wireframes,
  pieces that need an engine first are red outlines. In the makers' village every community design is a house
  (coloured by who wrote it: person, AI, both, or an example), every open job an empty plot with a sign anyone
  can take, and every missing engine a sign of its own. AI agents arrive as boats at the Lab's dock, through the
  open port (`scripts/mcp.mjs`). When a design is merged into the plan, its house appears for everyone.

Phones and cars are islands of their own across the sea, reached from the Ecosystem or by shipping your chip
there. A sandbank waits for what the world does not have yet: propose a place, a challenge or a question.

## Challenges as instruments

A challenge keeps its goal in view: a goal box at the top of the player stays put while you work. For a chip
challenge it shows gauges, each a value of your chip's model against the bound it must reach (`GAUGES` in
`game.js`, tested to agree with the goal itself); for a life challenge, what the place asks of the chip and what
it has now.

## How to add something

All of it is data in `src/v2/game.js`, drawn by the island and the pages; words in `src/i18n/en.json`.

- **A challenge:** add it to `CHALLENGES` with its step, its place and level, its kind (`design`, `chip`, `life`, `spot`), what it
  checks (`p`, `goal` or `mission`) and what it grows. Give the growth a grower in `GROWERS` and a spot in
  `GROW_SPOT` (`src/v2/map3d.js`), and words: `game.ch.<id>.t` (not for designs), `.goal`, `.why`, and
  `grow.<growth>`. `tests/game.test.mjs` checks that it starts unmet, can be won, and is drawn and named.
  A new kind of check is a new engine, never a separate tool.
- **A question at a place:** add a stop at a depth of that place (`src/data/weave.js`); it appears there by itself. The one glowing above a place is its `BEACON`.
- **A level:** a new depth of the earlier site's worlds becomes a level of the place `src/data/places.js` gives
  it (the test fails if a depth has no place). Another way in besides the levels goes in `LOOK[place]` with words
  `look.<id>.t` and `.d`.
- **A piece of the shared computer:** add a need to `src/data/build.js`. If a design engine can check it, it
  becomes an open job (a plot in the village, a card at the Lab and on the Challenges page); if not, writing the
  engine is the job.
- **A new place or island:** add it to `PLACES` in `game.js` and `map3d.js` with words `map.<id>.t`, `.d` and
  `.kind`. Draw it only if it can be drawn well.
