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

**One HUD.** The bar at the top never hides, on the island and in every view: the menu, the theme, and the
tracker with your chip's life (the five steps, a tick when a step is done, and the next challenge). The goal never
leaves the screen. The frame's ornaments sit below the bar. On the island a picked place opens in a dock at the
bottom, like a view's story: Look first (one line, Go inside, the levels as small chips), then Do and Ask. Tapping
the same place again goes inside. Inside the frame the earlier site's own marks (its top dots, its dive label, the
factory's band) are switched off (`setChrome` in `src/app/world.js`, `setBand` in `src/app/journey.js`): the frame
says where you are, once. Every dock keeps one order: back and the other views on the left, the next step on the
right (marked `data-key="back"` and `data-key="next"`).

**No cuts.** Going between views is never a jump. Going inside from the island, the camera dives into the place
first (`map.dive`), then the view zooms in from it; rising, the view zooms out and the island starts close to the
place you left and pulls back (`map.from`). Between views the picture moves the way you did: deeper zooms in,
higher zooms out, the Turn turns it, along slides it (a view transition in `route()`, the move on
`<html data-move>`, the styles in `v2.css`). The bar, the dock, the way up, the corner and the rail keep their
place, or glide to their new one. The views' code is fetched while the island is shown, and the spinner appears
only if a view takes longer than a moment. With reduced motion, or where view transitions are missing, the view
simply changes.

**One stage.** The 3D views (the island, the data centre, the chip, the board) draw with one renderer on one GL
canvas (`stage()` and `showStage()` in `src/v2/kit3d.js`). Each view keeps its own canvas as the surface you touch
and focus, and the one that is running draws its scene on the shared canvas beneath. While the island is shown,
the other three are made one by one in idle time, paused, and their shaders compiled (`warm()`), so going inside
finds them ready. The line's machines (`src/app/journey3d.js`, from the earlier site) draw on it too: the flat world
lends them the stage (`setChrome({ stage })` in `src/app/world.js`), they draw without tone mapping as they always
did and show the canvas once their first picture is on it. One context instead of five: less memory on a phone and
no rebuilding. The earlier site, which lends nothing, keeps its own renderer for the line.

**Questions stay inside.** Following a question (`#/ask/<thread>/<depth>`) never leaves the chip world. A
thread's stops make one trail (`Game.trail`, in `DEPTH_ORDER`: a chip in use from the building down, then designed,
then made), and each stop opens in the view that shows its level (`Game.viewOfDepth`). Its words are pinned in the
dock under Ask (`frame.stop()`): the question, something true to notice, what people are trying, and back and next
stop, which may be in another view (the move between views is the usual zoom or slide). A level not yet drawn in a
view of its own is met at its place on the island. After two stops of a thread, the question underneath may show,
one at a time (`rootShown`).

**One look.** The flat views (the dive in every world, the line's stations, the bench, the supply map) are drawn in
the chip world's palette, the same colours as its 3D views and its pages (`WORLD_LOOK` in `src/app/world.js`,
switched on by `setChrome({ lit: true })`), and lit like them: light from the top left, so the background has a
soft sky, a part big enough to read gets rounded corners, a shadow below and light on its top, and a round part is a
small sphere. The line's machines take the 3D views' slate and warm white instead of the earlier site's blueprint
blue. The earlier site, which does not switch it on, keeps its own look.

**The switch in 3D.** The first level of the zoom drawn on the one stage (`src/v2/switch3d.js`, following
`docs/reviews/art-direction.md`): one transistor cut open at the front, so the cut face shows the gate wrapped
round three sheets of silicon, each in its skin, with source and drain on either side and electrons flowing through
the sheets. As the dive comes within a little of the switch (`zoom` from `src/app/world.js`), the flat picture fades
and the model takes its place in the same square (`dive.frame`), farther while you are still above it and nearer as
you go on to the atom, so the zoom stays one movement. Its five names are HTML; a picked part's note opens beside its
name. A sideways drag turns it 20° each way; up and down still zoom. The flat drawing stays the fallback.

**Everything inside.** Nothing in the chip world leads to the earlier site any more. The flat dive starts from any
world (`#/dive/<depth>/<world>`): the data centre's chip, a phone, a car, or the made chip (the factory's machine,
a wafer and a die), each from its top level down to the atom; a place's levels open there. The supply map (`#/supply`)
is the earlier site's map in the frame: the flat world draws it over the line, the rail is the trip's steps, and
the dock tells a step, a place, and what stops when a place shuts. The earlier site is retired (branch `claude/before-retire-2026-11`). A followed question's stop also shows its real cases and the figures behind it, with their sources. What the earlier site showed and the chip world does not yet (die photos, the energy floor, station timings, the core running its program, the studio's and the factory's panels) waits in `src/data/waiting-words.json`.

**The first minute and feedback.** A first visit opens on a wide shot of the sea and comes down to the island
(`map.intro`), and the hero rises after it with one sentence and one glowing button. The first challenge is won by
tapping, not typing: the half adder's description shows its gates as buttons (OR, AND, XOR), the table checks all
four sums after every tap, and one tap fixes it (the design engine still decides; "Write it yourself" opens the
text). The voter and the full adder play the same way, with a tray of pieces where a gate is not enough (`TAPS` in
`src/v2/game.js`; a test checks each has exactly one winning tap). Everything you do answers: a wrong check shakes, a row that turns right flashes, a gauge that reaches its
target pops, a win bursts in the dock while the island grows where it happened and the camera leans in
(`map.punch`), the step in the bar bumps and counts one up, and the next challenge glows. Your chip's pin pulses so
you always see where you are. With reduced motion none of it moves.

Text has a budget: about one sentence per story step, one line per card. Longer reading (notes, sources, the full
explanation) goes into a reading view, opened on purpose, at a reading width.

## 4. One grammar

The same four moves in every view, by touch, mouse and keys.

| Move | Means | Gesture |
| --- | --- | --- |
| Tap | select a part: it lights, its card opens on it, the story goes to its step | tap, click, Enter; on the island, tap a place again to go inside |
| In · out | scale: dive into the selected part, or rise to the level above | tap again, pinch, scroll; ↑; Escape goes up |
| Along | process: the next or previous step on the line or in the story | swipe sideways, ← → (the dock's back and next, in every view) |
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
| One look | the flat views and the line's machines in the 3D views' palette and light |
| Everything inside | every place's levels, every question and the supply map open in the chip world's own views |
| Questions inside | every question's trail walks through the chip world's own views; none leads to the earlier site |
| First minute | the intro shot, one sentence, a glowing start; the first win in one tap; feedback for wrong, right, reached and won |
| One stage | one renderer and one GL canvas for the island, the data centre, the chip, the board and the line's machines; the views made and compiled ahead while the island is shown |
| No cuts | the camera dives into a place and rises out of it; views zoom in, out, turn or slide into each other; the bar, the dock and the ornaments stay; code preloaded, spinner only when slow |
| One HUD | the bar never hides and carries the tracker; the island's place opens in a dock (Look first, Go inside); the earlier site's chrome is off inside the frame; ← → and Escape everywhere |
