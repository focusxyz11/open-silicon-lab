# The system

How every view of the lab shows content and how a visitor moves. Read this before adding a view, a part, a
question, a challenge or a story. `docs/WORLD.md` says what the chip world holds; this says how it is shown.

The problem it solves: views built one by one each invent their own way to show content and to move, so the same
things (the chip, a gate, printing) end up told several times in several ways, and words pile up in a column beside
the picture. The lab grows by adding content, so the way content is shown must not grow with it.

## 1. The atlas: one home for every thing

Every part, figure, question, challenge and story has exactly one address: a place of the chip world and a level
inside it (`src/data/places.js`, `src/data/atlas.js`).

| Thing | Its home | Words |
| --- | --- | --- |
| Part (a named shape) | the depth in its id, `depth.part` | `part.<id>`, `what.<id>` |
| Question | the depth in its key, `thread.depth` | `stop.<key>.*` |
| Challenge | its `place` and `at` (`src/v2/game.js`) | `game.ch.<id>.*` |
| Story | `STORIES` in the atlas | its own keys |
| Figure | `src/data/facts.json`, shown on the part it is about | — |

Views never own content. They read it from the atlas by address and show it their own way, so a thing is written
once and appears wherever its place and level are shown. A view that draws a part names it by its home id
(`VIEW_PARTS`), never with words of its own. `tests/atlas.test.mjs` checks that every thing has a home, that no view
names parts itself, and that no longer text is written twice.

## 2. Six kinds of view

Each kind is used for what it shows best, and for nothing else.

| View | For | Where |
| --- | --- | --- |
| Map | places and how they connect | the island, the ecosystem |
| Flight | moving into a place, continuously, in 3D | the data centre (then the phone, the car) |
| Dive | the depths inside a chip, as a flat, continuous zoom | block, gate, switch, atom |
| Stack | where the dive meets the line | inside a chip, read top down or built bottom up |
| Line | the factory, step by step, following a wafer | crystal to package |
| Bench | doing: describe, code, simulate, check | the studio, and every challenge |

The flat dive stays: below the chip a blueprint zoom reads better than 3D. The earlier site's dive moves into the
frame below for exactly those levels.

## 3. One frame

Every view wears the same frame. There is no column of text beside the picture.

- **The scene** fills the screen. A part's name sits on the part; a figure is a reading on the part; a question is a
  mark on the part. Words are HTML over projected points, never drawn into the scene.
- **Ornaments** at the edges say where you are and never hold paragraphs: the way up, the path, the depth rail
  (scale), the step ribbon (process), a live goal, and the switch Look · Do · Ask.
- **The story** is docked below, one step at a time (steps, not scrolling). Each step moves the camera and lights a
  part. Its words are touchable (`[[part|words]]` lights the part) and live (`[[#name]]` is a number you drag). A step
  can ask for a prediction before the number moves. Stories are data (`src/v2/stories.js`), played by
  `src/v2/story.js`, and their numbers come from the engines.
- **Look · Do · Ask** (`src/v2/frame.js`) switch what the frame holds: Look is the story; Do opens the bench in the dock, with the goal
  as an ornament and the result shown in the scene; Ask shows the questions as marks on their parts and lets you
  follow one as a thread across places. Do and Ask are filled by the frame itself from the atlas, for the level in
  view, so a view gets them by saying which level it shows (`frame.level(depth)`).

Text has a budget: about one sentence per story step, one line per card. Longer reading (notes, sources, the full
explanation) goes into a reading view, opened on purpose, at a reading width.

## 4. One grammar

The same four moves in every view, by touch, mouse and keys.

| Move | Means | Gesture |
| --- | --- | --- |
| Tap | select a part: it lights, its card opens on it, the story goes to its step | tap, click, Enter |
| In · out | scale: dive into the selected part, or rise to the level above | tap again, pinch, scroll; ↑ |
| Along | process: the next or previous step on the line or in the story | swipe sideways, ← → |
| Turn | the same level seen as designed, made or used | the Turn button on a level |

## 5. The Turn: design and the factory as one story

Every level of a chip can be seen three ways: designed in the studio, made at the factory, used in the dive
(`TWINS` in the atlas, from the weave's `MADE`).

| Level | Designed (studio) | Made (factory) | Used (dive) |
| --- | --- | --- | --- |
| Chip | the job, the spec | package | in the rack, the phone, the car |
| Block | layout | wires | blocks on the die |
| Gate | gates | print | gates in a block |
| Switch | cells | etch | fins |
| Atom | — | crystal, implant | the silicon itself |

Standing on a gate, Turn shows the gates you designed, and then printing making them; standing on printing, Turn
shows what it becomes. Your own design rides through all three: its masks drive printing, its copies are tested.

## 6. Adding something

- **A part:** words `part.<depth>.<id>` and `what.<depth>.<id>` at the depth that is its home; a view that draws it
  adds it to `VIEW_PARTS`.
- **A question:** a stop at its depth (`src/data/weave.js`); every view of that level shows it.
- **A challenge:** `CHALLENGES` with its place and level (`docs/WORLD.md`).
- **A story:** data in `src/v2/stories.js`, its home in `STORIES`; it drives an existing scene.
- **A view:** only one of the six kinds, wearing the frame. A new kind needs a reason this document can take.

## 7. Where it stands

| Piece | State |
| --- | --- |
| Atlas (parts, questions, challenges, stories, the Turn) | in place, tested |
| Frame: scene, ornaments, docked story, Look · Do · Ask | `src/v2/frame.js`, worn by the flight, the stack and the board |
| Map | the island |
| Flight | the data centre |
| Stack | inside a chip (`#/chip`) |
| Dive | the earlier site's flat zoom in the frame (`#/dive/<depth>`), chip to atom; the flight goes on into it |
| Line | the earlier site's factory in the frame (`#/line/<step>`): a wafer travelling between the machines, step by step; your design at printing, etching and wiring |
| Bench | the studio in the frame (`#/bench/<level>[/<challenge>]`): its drawings show your design; a design challenge is played in the dock and the drawings follow it; masks lead to the line |
| Turn | in the atlas and in the frame: each face opens its view, used the dive, made the line, designed the bench |
