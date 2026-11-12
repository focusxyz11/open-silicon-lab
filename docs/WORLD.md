# The chip world

How the redesign (`explore.html`, `src/v2/`) holds everything together. The island is the first page; this
note is about what connects it: one main thread, the same three doors everywhere, and an island that grows.

## The main thread: your chip's life

A chip is the brain of almost anything, so the lab does not draw everything a chip goes into. It follows one
chip, yours, round the loop every chip goes round:

**Design → Make → Test → Ship → Use**, and what fails in use goes back to design.

The loop is a ring road on the island, with a numbered stop for each step and your chip standing at the step
you are on. The HUD (top left) always shows the five steps, how many challenges each has left, and the next
challenge. Each step has a station: Design at the studio, Make at the factory (the crystal is the first part of
making), Test at the test house, Ship at the port, Use at the data centre. Where a chip goes after the port
(a phone, a car, a data centre) is a challenge at Ship, because what it must survive depends on where it
lives.

## Every place has an inside: where the earlier site lives

The island is the journey: moving along the loop, a chip's life. Going into a place is the dive: down its
levels, one inside the next. So every page of the earlier site (index.html, a world and a depth) has an address
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
each mask, and one speck of dust that leaves a wire stuck, in a copy that looks exactly like the others). That is
the copy you hunt at the test house. On the island, the studio is a campus at the start of the loop, and its mask
house sends the first masks you make down the road to the factory, on a truck.

## Inside a chip: the dive and the line as one picture

The dive and the factory line meet in one view, `#/chip` (`src/v2/chip3d.js`): a cut through a chip, its layers
stacked as they are. Read from the top down it is the dive: the package, the wires of a block, the gates, the
switches, the silicon. Read from the bottom up it is the line: crystal and implant make the silicon, etch makes
the switches, print makes the gates, wires join them, packaging closes it (`MADE` in `src/data/weave.js`). One
position and two modes: diving, the layers above you lift away; building, they are not made yet, and come down
into place step by step. The panel is an instrument, not a column of text: the two modes, the stack of rows (each
a depth and the steps that make it), and what this row is or how it is made, with its question. The data
centre's flight ends by going into it; the levels block to atom, and the factory steps that make them, open it.

## Every place has three doors

Whatever you tap opens the same sheet, with three doors:

- **Do**: challenges, each checked for real by one of the lab's engines. A circuit by the tiny-chip engine
  (`src/engines/design.js`), your chip's settings by `src/engines/chip.js`, a chip's years in a phone, a car or
  a data centre by `src/engines/life.js`, a broken copy by the design engine's factory faults. AI can propose;
  the check decides.
- **Inside**: the place's levels, one inside the next, with how many questions and challenges wait at each;
  then any other way in (the supply map at the port, the plan at the Lab).
- **Ask**: the questions that stop at this place (stops of the threads), its debates, and at the Lab the ways
  people are trying.

The menu gives the same content another way: **Explore** (the island), **Challenges** (every challenge by step,
and the open jobs), **Questions** (by place), **Build** (the shared computer) and **Ecosystem** (the islands
across the sea, and the world chips depend on).

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
