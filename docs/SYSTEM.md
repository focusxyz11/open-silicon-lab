# The system

How every view of the lab shows content and how a visitor moves. Read this before adding a view, a part, a
question, a challenge or a story. `docs/WORLD.md` says what the chip world holds; this says how it is shown.

The problem it solves: views built one by one each invent their own way to show content and to move, so the same
things (the chip, a gate, printing) end up told several times in several ways, and words pile up in a column beside
the picture. The lab grows by adding content, so the way content is shown must not grow with it.

## 0. Experiments, and reading

The lab is being rebuilt on experiments (`docs/framework/`): one small question, put to an engine, seen through one
way of seeing. They are data (`src/data/experiments/`, one file per world, with the shared layers in
`src/data/layers.js`), and every stop, challenge and try is part of exactly one. What is not written down is worked
out (`src/engines/experiments.js`): an experiment's state (live, ready, only words, wanted), where it is seen, what
backs it, and its ways on, from what experiments share. Every experiment is a page at `#/read/<id>`; `#/read` holds
all the questions and challenges, by what can be done with them now. Until the frame is rebuilt (stage 4), the rest
of this document describes the views as they stand.

## 0b. The eleven worlds

Each core question is a world with a page of its own (`#/w/<id>`, `src/v2/worlds.js`), made at the moment it opens from
its document in `content/`, which is the one home of its words. Its visual system sits at the top: live where an
engine draws it (the crowd of copies; the tries), a view of the site where one exists (the dive, the line, the map),
else its sketch. `#/w` lists every question that leads in, mixed, never the eleven themselves.

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

## 2. The grid, and two moves

The lab is one grid (`src/engines/way.js`, `docs/reviews/structure.md`).

- **Across** runs a chip's life, the loop: **Open → Design → Make → Test → Ship → Use**, and what is learned in use
  opens the next. It starts with what is open, and there are two ways in: a thing someone needs, or a thing that
  has just become possible and is still looking for its use. The community stands at that stage (the Lab, the
  village).
- **Down** runs scale: a place, then its levels, one inside the next, to the atom.

| | Open | Design | Make | Test | Ship | Use |
| --- | --- | --- | --- | --- | --- | --- |
| **The place** | the Lab, the village | the studio | sand to crystal, the factory | the test house | the port | the data centre (and the phone and car islands) |
| **Its steps** | what is open → a piece | the job → describe → check | crystal → wafers → clean → deposit → print → etch → implant → wires | test | package → out | building → rack → board |
| **Chip** | a piece of the computer | the job | a die on its wafer | | in its package | the chip |
| **Block** | | layout | wires | | | the block |
| **Gate** | | gates | print | | | the gate |
| **Switch** | | | etch | | | the switch |
| **Atom** | | | crystal, implant | | | the atom |

An address is a cell, and it is always in the browser's address bar: moving inside a view rewrites it. Where the
things inside a place follow each other in time they are **steps**; where one is inside the next they are
**levels**. There are two moves besides the tap:

| Move | Means | Touch and mouse | Keys |
| --- | --- | --- | --- |
| **In · out** | scale: into the part in view, or up to the level above | scroll, pinch, tap the part, the rail, ↑ top left (on the island it leads to the world around it) | ↓ ↑; Escape goes out |
| **Along** | the chip's life: another stage, keeping your level where that level exists there; on a row of steps, the step before or after | the loop in the bar; *Next* in a place's card; swipe on the line | ← → |

Along holds the depth (`alongTo`, tested for every level): a gate in use → the gate being printed → the gates you
designed. A stage that will keep your level is underlined in the bar. Where a level does not exist at a stage,
along lands at that stage's place on the island. `TWINS` in the atlas says which level is which at each stage.

| Level | Designed (studio) | Made (factory) | Used (dive) |
| --- | --- | --- | --- |
| Chip | the job | a die on its wafer; its package at the port | in the rack, the phone, the car |
| Block | layout | wires | blocks on the die |
| Gate | gates | print | gates in a block |
| Switch | — | etch | sheets of silicon |
| Atom | — | crystal, implant | the silicon itself |

Your own design rides through all three: its masks drive printing, its copies are tested.

### Questions from the field, and the seams

The deepest questions in the lab are the ones the field itself was stuck on (`src/data/questions.js`; the framework
behind them is the page *The open framework*). A chip is matter arranged so that energy moves information, made over
time by people and machines, under chance, at a cost: seven primitives. A question's shape is how many of them meet in
it:

| Shape | Primitives | Means | Example |
| --- | --- | --- | --- |
| **Limit** | one | how far one thing can go | *Must thinking make heat at all?* (Landauer, 1961) |
| **Leak** | two | what one level hides comes back through the other | *Why does a perfect design fail in the real world?* |
| **Bet** | three | three pull at once, so people choose without proof | *Two strong oxen or a thousand chickens?* (Cray) |

Each has one home, a level or a place, and is listed first under Ask there with its shape as a mark. A leak also
sits on a **seam** of the grid: between two levels (crossed going in or out) or between two stages (crossed going
along). The two moves are how you meet them: the first time you cross a seam, its leak rises beside the view
(`seamOf` in `src/engines/way.js`), then waits under Ask. A question joins when someone real was stuck on it, it
opened something, and part of it is still open; its words are `field.<id>.*`, with who asked it and where to read it
in their words. A bet becomes a challenge (kind `bet`, its engine in `src/engines/bet.js`): first a guess, then two dials and a picture
the engine counts from, until the three primitives balance; Moore's bet at the wafer, the pieces' bet (one bad piece in a package, the known good die) at the die, and Cray's (oxen or chickens, after Hill and Marty's model) at the data centre's chip. Places with none yet (the quarry, the tools, the
materials, the power) are where to look next.

## 3. Six kinds of view

A view is a way of drawing a row or a column of the grid. Each kind is used for what it shows best, and for
nothing else. A visitor never has to know a view's name.

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

## 4. One frame

Every view wears the same frame. There is no column of text beside the picture.

- **The scene** fills the screen. A part's name sits on the part; a figure is a reading on the part; a question is a
  mark on the part. Words are HTML over projected points, never drawn into the scene.
- **Two rails** say where you are, one for each move: the loop in the bar (the stage lit; a tap moves along) and
  the levels at the side (a tap moves in or out). The way out is top left, with the place's name. A live goal may
  sit top right. Nothing at the edges holds a paragraph.
- **One card** at the bottom, the same on the island and in every view (`src/v2/frame.js`; the island's is drawn
  by `drawPlace` in `src/v2/app.js`). Its three faces are at its top, with how much waits behind each:
  **Look** is what this is, one step at a time (steps, not scrolling), with the moves from here: on the island,
  *Go inside* and *Next* round the loop. Each step of a story moves the camera and lights a part; its words are
  touchable (`[[part|words]]` lights the part) and live (`[[#name]]` is a number you drag); a step can ask for a
  prediction. Stories are data (`src/v2/stories.js`, played by `src/v2/story.js`).
  **Do** lists the challenges at the level in view and the open things of the ledger that sit there, and a
  challenge is played in the card, in the view that shows its level, with the picture behind it (`doHome`).
  **Ask** lists the questions at the level, what people and agents asked there, and shows the questions as marks
  on their parts. Do and Ask are filled from the atlas, so a view gets them by saying which level it shows.

**The bar.** It never hides: the lab's mark (home), the loop, *Your log*, the theme. There is no menu of sections
by default; `?menu=1` adds one for that browser, to compare (not decided: `docs/reviews/structure.md`, Status).
One reading view is opened on purpose: **your log** (`#/log`: a jump to any place, level or challenge by name,
also on the `/` key; what is next for your chip; the questions you met; the challenges by step). The commons has no page: **the Lab's inside**
(`#/build[/<step>[/<piece>]]`) is in the Lab's own card, with the island behind it: the computer, then a piece of it,
then the designs for that piece, each an entry of the ledger; and beside the computer, the record, who is here, and
who makes what (`labInside` in `src/v2/app.js`). Inside the frame the earlier site's
own marks are switched off (`setChrome` in `src/app/world.js`, `setBand` in `src/app/journey.js`). Inside a view,
back is on the card's left and the next step on its right (`data-key="back"`, `data-key="next"`).

**No cuts.** Going between views is never a jump. Going inside from the island, the camera dives into the place
first (`map.dive`), then the view zooms in from it; rising, the view zooms out and the island starts close to the
place you left and pulls back (`map.from`). Between views the picture moves the way you did: deeper zooms in,
higher zooms out, along slides or turns it (a view transition in `route()`, the move on
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
switched on by `setChrome({ lit: true })`), and lit like them: light from the top left, so a part big enough to read
gets rounded corners, a shadow below (two offset layers, never a canvas blur) and light on its top, and a round part
is a small sphere. One thing has one colour everywhere (`docs/reviews/art-direction.md`): silicon blue-grey, the
switch's gate in the accent, copper wires, contact metal, glass; green and red mean right and wrong, and nothing else.
The line's machines take the 3D views' slate and warm white instead of the earlier site's blueprint blue.

**The flat dive, tidied.** The picture stands on the page's own ground, with no card, frame or ghost of the level
above round it: the move itself and the rail say where you are. Its words are HTML over it (`src/v2/overlay.js`, set
by `setChrome({ overlay })`): at most five names (three on a phone), the parts the story is about first, shown a
moment after the picture rests and hidden while it moves; a note only on a part you pick, beside its name, with a ring
on the part and no line drawn to it; under Ask, the questions as marks on their parts (the island's mark; more than
three on one part become one mark with a count, which lights those lines in the dock); and after three seconds at
rest in Look, four corner marks on the way deeper. A portal holds no miniature: the parent's own drawing there (a
core, a cell, one crossing, one sheet) is the next level at its simplest, and the next level fades in over it.
The same overlay serves the bench (your design's state, right or not, is words in the dock, not a band drawn under
the picture; words in a drawing too small to read are left out) and the factory's line (its questions' marks under
Ask). The supply map has no grid, title or row of steps (the rail and the dock say those) and fills the free screen.
The line at night has a plain floor and quiet edges, so its machines read as solids; the board's copper goes
somewhere (traces to each link, wide traces bringing power), not rows of stripes.

**The levels in 3D.** The zoom from the chip down is drawn on the one stage (following
`docs/reviews/art-direction.md`): the chip as a relief (`src/v2/relief3d.js`), one drawing with four sets of data (the
data centre's chip, the phone's, the car's, and the die on the wafer with its test needles), its districts read from
the flat scenes' parts so the plan is written once: a slab, compute blocks that are alike and warm while they work,
memory as a low regular field of bits, pads round the edge, copper wires with the clock's beat travelling on them, seen
from 72° and never turned; coming down from the data centre's flight the camera rises from the flight's angle to the
plan's (a level's arrival goes by frames, each counting at most 50 ms, so a slow first frame never eats it); the block, the same relief (rows of ready-made cells of different widths between copper rails, the memory
array as a lower, finer field, your design as a few warm cells in a row, and the wires over them faint until you pick
them, since drawn true, copper would cover the cells); the wafer (`src/v2/wafer3d.js`), a polished disc printed with
your chips, the pieces cut by the rim grey and lost, and each chip a speck lands on red, from your chip's size and
generation; the phone (`src/v2/phone3d.js`), arriving closed and coming apart along one axis into a teardown
laid side by side (screen, the frame with the battery that fills most of it and the small board, the back with its
lenses), so you see that most of a phone is battery and screen; a phone's board and a car's control unit (`src/v2/pcb3d.js`), built from the same table of board
materials as the data centre's board (`BOARD` in `src/v2/kit3d.js`), so a board is a board to the eye, the control
unit's case lid lifting as you arrive from the car; the gate (`src/v2/gate3d.js`), a relief of the same plan as the flat gate, its layers in true order and height
(silicon, the gate strips over it, contacts as studs, copper on top), seen from 65° and never turned, lifting apart
once on arrival, with your chip's slowest signal racing the tick along the bottom; the switch (`src/v2/switch3d.js`), one transistor cut open at the front, so the cut face shows the gate wrapped round
three sheets of silicon, each in its skin, with source and drain on either side and electrons flowing through the
sheets; and the atom (`src/v2/atom3d.js`), a small crystal two cells deep where every atom holds four neighbours in
the diamond pattern, one added atom of another kind sits in a place of it, a few electrons drift loose, and the
disordered insulating skin lies on top, the back fading into the sky. What they share is one module
(`src/v2/level3d.js`): as the dive comes within a little of the level (`zoom` from `src/app/world.js`), the flat
picture fades and the model takes its place in the same square (`dive.frame`), farther while you are still above it
and nearer as you go on, so the zoom stays one movement. Every pair of neighbouring levels in 3D is joined (the phone to its board to its chip, the control unit to its chip, the wafer to the die, each chip to the block, and on down to the atom) (`docs/reviews/transitions.md`): both drawn in one frame on one camera path, the switch standing in the gate's crossing as the gate fades into the sky, so no flat picture shows. The switch starts as the gate's own plan in that crossing and stands up into the built switch as you go down (and lies back down as you go up). The same between the switch and the atom: the crystal starts as a piece of the middle sheet's cut face and breaks into atoms from the front back. A level with no move of its own fades in over its door (a relief, the block or the gate, rises out of it too), and what covers the door (a package's top) lifts away; between a diagram kept flat on purpose (the car, the scanner) and the model under it, the flat picture still shows for a moment, with the model lying on the drawing in the square the drawing gives it. A jump (reduced motion, or a link to another level) dips the stage to the page's ground and back in 200 ms instead of cutting. A wheel over a name, a note or a mark moves the dive as over the picture.
Names are HTML; a picked part's note opens beside its name; under Ask its questions are the same marks as on the flat
levels. A sideways drag turns a model 20° each way (not the gate, which is a plan); up and down still zoom; a model
sways when idle and holds still with reduced motion. The flat drawings stay the fallback.

**Slow devices.** A software renderer starts the stage at low settings (pixel ratio 1, no shadows, live things
still: `QUALITY` in `src/v2/kit3d.js`). A level in 3D that draws its first frames too slowly (the middle of 20 above
40 ms) drops to low settings, and if still too slow is drawn flat for the rest of the visit (`level3d.js`). A still
level draws only when what it shows changes, and the flat canvas under a level in 3D is not drawn while covered.
For the tests, `localStorage['osl-quality']` = `keep` pins the quality and `slow` makes every level too slow.

**Everything inside.** Nothing in the chip world leads to the earlier site any more. The flat dive starts from any
world (`#/dive/<depth>/<world>`): the data centre's chip, a phone, a car, or the made chip (the factory's machine,
a wafer and a die), each from its top level down to the atom; a place's levels open there. The supply map (`#/supply`)
is the earlier site's map in the frame: the flat world draws it over the line, the rail is the trip's steps, and
the dock tells a step, a place, and what stops when a place shuts. The earlier site is retired (branch `claude/before-retire-2026-11`). A followed question's stop also shows its real cases and the figures behind it, with their sources. What the earlier site showed and the chip world does not yet (die photos, the energy floor, station timings, the core running its program, the studio's and the factory's panels) waits in `src/data/waiting-words.json`.

**The first minute and feedback.** A first visit opens on a wide shot of the sea and comes down to the island
(`map.intro`), and the first card rises after it with one sentence and one glowing button, *Follow the chip*, which opens the place where
the loop starts; every place's card offers the next place round it, so following is never a mode. The first
challenge, at the studio under Do, is won by
tapping, not typing: the half adder's description shows its gates as buttons (OR, AND, XOR), the table checks all
four sums after every tap, and one tap fixes it (the design engine still decides; "Write it yourself" opens the
text). The voter and the full adder play the same way, with a tray of pieces where a gate is not enough (`TAPS` in
`src/v2/game.js`; a test checks each has exactly one winning tap). Everything you do answers: a wrong check shakes, a row that turns right flashes, a gauge that reaches its
target pops, a win bursts in the dock while the island grows where it happened and the camera leans in
(`map.punch`), the stage in the bar bumps and counts one up, and your log glows. Your chip stands at the stage you are
looking at, and its pin pulses. With reduced motion none of it moves.

Text has a budget: about one sentence per story step, one line per card. Longer reading (notes, sources, the full
explanation) goes into a reading view, opened on purpose, at a reading width.

## 5. Adding something

- **A part:** words `part.<depth>.<id>` and `what.<depth>.<id>` at the depth that is its home; a view that draws it
  adds it to `VIEW_PARTS`.
- **A question:** a stop at its depth (`src/data/weave.js`); every view of that level shows it.
- **A challenge:** `CHALLENGES` with its place and level (`docs/WORLD.md`).
- **A story:** data in `src/v2/stories.js`, its home in `STORIES`; it drives an existing scene.
- **A place or an island:** give it a stage of the loop (`PLACE_STAGE` in `src/engines/way.js`); the bar and the
  cards need nothing else.
- **A view:** only one of the six kinds, wearing the frame. A new kind needs a reason this document can take.

## 6. Where it stands

| Piece | State |
| --- | --- |
| Atlas (parts, questions, challenges, stories, the twins of a level) | in place, tested |
| Frame: scene, ornaments, docked story, Look · Do · Ask | `src/v2/frame.js`, worn by the flight, the stack and the board |
| Map | the island |
| Flight | the data centre |
| Stack | inside a chip (`#/chip`) |
| Dive | the earlier site's flat zoom in the frame (`#/dive/<depth>`), chip to atom; the flight goes on into it |
| Line | the earlier site's factory in the frame (`#/line/<step>`): a wafer travelling between the machines, step by step; your design at printing, etching and wiring |
| Bench | the studio in the frame (`#/bench/<level>[/<challenge>]`): its drawings show your design; a design challenge is played in the dock and the drawings follow it; masks lead to the line |
| Along | `src/engines/way.js`: from the loop in the bar and the ← → keys; holds the level through used, made and designed |
| One look | the flat views and the line's machines in the 3D views' palette and light |
| Everything inside | every place's levels, every question and the supply map open in the chip world's own views |
| Questions inside | every question's trail walks through the chip world's own views; none leads to the earlier site |
| First minute | the intro shot, one sentence, a glowing start; the first win in one tap; feedback for wrong, right, reached and won |
| One stage | one renderer and one GL canvas for the island, the data centre, the chip, the board and the line's machines; the views made and compiled ahead while the island is shown |
| No cuts | the camera dives into a place and rises out of it; views zoom in, out, turn or slide into each other; the bar, the dock and the ornaments stay; code preloaded, spinner only when slow |
| The bar and the card | the bar never hides and carries the loop; one card with Look · Do · Ask on the island and in every view; challenges played in place; the address follows you; ↑ ↓ ← → and Escape everywhere |
