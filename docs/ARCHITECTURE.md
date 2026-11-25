# Architecture

A static site: plain ES modules, one stylesheet and one folder of words, split by area. No framework, no build step for development.

```
index.html              the site: the chip world (src/main2.js, src/v2/)
classic.html            the earlier site's address, now leading to the chip world (the earlier site: branch claude/before-retire-2026-11)
src/v2/app.js           the shell: routes in the address, the bar with the loop, the frame's modes, the island's sheet, Your log's way in, Break it; each view's glue loads when it opens
src/v2/shell.js         what the shell and its glue share: V (the shared state, and the functions one part lends another), $, esc, follow
src/v2/glue/            one module per view's glue, each create()d once when its view first opens, after the glue it builds on (GLUE in app.js):
  island.js             the island's cards: the inspector, the lenses over the island, the dials, a place's card and its inside, the Lab's inside
  frame.js              what every framed view shares: the frame made for a view, the thirteen as lenses under Ask, the search at a level
  flights.js            the data centre's, the phone's and the car's flights
  studio.js             the studio, walked inside
  chip.js               inside a chip, layer by layer
  flat.js               the dive, the line and the bench (the earlier site's 2D world in the frame), and the levels drawn in 3D
  supply.js             the supply map
  board.js              one board and its story
  pages.js              the reading pages: your log, the commons, #/read, a world (#/w/<id>), machines, What if?, a question's trail and world, the field questions
src/v2/hold.js          Hold, the first page (#/): one story on one chip, the scroll a camera over it (the only view the shell imports statically; nothing 3D)
src/v2/holdkit.js       its words, what the visitor has set and done, the sources (src/data/facts.json, loaded on the first touch), the challenges and where each is played
src/v2/holdplates.js    its pictures: every block of the chip a square drawn in 1000 units with its controls on it, and Moore's law live along the bottom
src/v2/frame.js         the one frame on every view below the island: the rails, the levels, the card's Look · Do · Ask
src/v2/frame2.js        the frame's three modes (#271): the card worn as a caption (Look), a side panel with a stage (Do) or a phone sheet; reading pages (Read); styles in src/styles/frame.css
src/v2/game.js          the game as data and logic: the loop, the challenges, each place's doors, your state (tested)
src/v2/map3d.js         the island: the loop road, the places, what grew, the islands across the sea
src/v2/lenspaint.js     lenses repaint the picture: one paint per core question, an SVG layer in the level's plan pinned onto the picture, and its instrument in the card
src/engines/lens.js     each lens at a level as a model over its parts' facts, its control and measures from the lab's engines (tested)
src/data/partfacts.js   what each part of a level is (its kind, and who decided it), for the lenses to paint from
src/data/views3d.js     the 3D views' plain data the shell reads before a view opens (the island's places, the data centre's levels, the chip's layers), with no three.js
src/v2/dc3d.js, phone3d-flight.js, car3d-flight.js   the flights: the data centre, the phone and the car, flown through to the chip
src/v2/studio3d.js            the design studio walked inside: its corners are the design's steps, each screen opening into its bench
src/v2/furnish.js             desks, screens, chairs, plants and people, shared by the island and the studio inside
src/data/studio.js            the studio's one plan: its floor, its corners in order and the screen each bench opens on
src/v2/chip3d.js        inside a chip, layer by layer: the dive's levels as made (Make, along from the dive)
src/v2/play.js, labs/   the challenge player, and the labs, one file each (docs/LABS.md)
src/v2/kit3d.js         the one 3D stage, light, the two palettes, HTML labels at 3D points
src/data/atlas.js       one home for every thing: each part, question, challenge and story by place and level (tested)
src/data/places.js      the places and the levels inside each
src/engines/way.js      the grid and the two moves: in and out, and along the loop (tested)
src/engines/ledger.js   the community's ledger, replayed in order through the engines (tested)
src/app/world.js        the zoom: draws the current, previous and next depths, highlights, dots, tether, input
src/app/scenes.js       one scene per depth, drawn in a 1000 x 1000 space, with its named parts
src/app/journey.js      the journey's stations as machines, the steps each plays with your wafer, your pod, the caption and slice
src/app/draw.js         small drawing helpers both use
src/app/solid.js        solids in 2.5D (boxes, cylinders, prisms, cutaways, shadows, four tones), the one way volume is drawn
src/app/journey3d.js    the journey in 3D (three.js): the plants and the factory's bay, every station's machines, the camera
src/app/design.js       the design studio: six stations showing your design from the job to the masks, and their band
src/app/map.js          the world around the line: a chip's whole trip on a map, from design to where it is used
src/app/lens3d.js       the lens: while a machine works, your wafer's surface magnified beside it, showing what the machine does
src/vendor/three.min.js three.js, loaded only when a view that draws in 3D is first opened (never by the first page)
src/engines/chip.js     your chip: its settings (clock, switch size, chip size, how full the fab runs, reuse, where its memory sits) and what follows from them, the memory wall included, relative to a starting chip (tested)
src/engines/api.js      the open port: the engines as tools for AI agents (list the plan, take a job, check, at the factory, its life, propose)
src/engines/build.js    where the goal stands: each need's state, and the engines that check needs (tested)
src/engines/design.js   your design: one circuit run through the tiny-chip engine, from description to masks (tested)
src/engines/tinychip.js the earlier site's tiny-chip engine: parse, check, synthesize, place, route, fault-test
src/engines/core.js     the RISC-V core engine: the earlier site's simulator, its ALU made of your slice, checked by test programs
src/engines/riscv.js    the earlier site's RISC-V assembler and simulator (RV32I)
src/engines/alu.js      a slice copied 32 times into a 32-bit ALU; a factory defect in one slice
src/engines/life.js     your chip's life: why a perfect design still fails (variation, heat, supply dips, ageing, missed defects, weak spots, wear, radiation) in a phone, a car or a data centre (tested)
src/engines/xray.js     chip X-ray: each dive's chip read as a die photo, where its area goes, and its kinds of block to find (blocks drawn in scenes.js; tested)
src/engines/floor.js    the physics floor: Landauer's limit, cooling and light's speed, against your chip (tested)
src/engines/fab.js      a fab you run: a re-entrant line of tool groups, how busy each is and how long wafers wait (tested)
src/engines/supply.js   what stops in a chip's trip when places stop (tested)
src/engines/weave.js    pure logic: the current world, the camera, sizes, threads, when a core question appears (tested)
src/data/weave.js       the data: worlds, depths and portals, threads, stops
src/data/ways.js        other ways to compute, each at the depth where the problem it attacks is met (tested)
src/data/debates.js     where informed people disagree: the earlier site's debates, each placed at the depths and stations it is about
src/data/build.js       the build: the community's goal as a plan of needs, the designs people and AI proposed, AI agents' proposals
src/data/world.js       the map: places, and each kind of chip's trip through them, joined to the line's stations
src/data/facts.json     sourced figures, loaded when a question's stop first shows (src/v2/glue/pages.js); FIGURES and CASES in weave.js point to them
src/core/i18n.js        words: t('name'), plurals, numbers, dates
src/i18n/en/            every word on screen, one file per area (AREAS in src/core/i18n.js): core.json for the bar, hold.json for the first page, blueprint.json for the blueprint, the others loaded with the views that show them
src/i18n/<lang>/        the same, translated area by area (TRANSLATED in src/core/i18n.js): zh, fr and es have core (the bar), hold (the first page) and blueprint
scripts/words.mjs       every word of a language in one set, for node (the tests, the open port)
src/styles/             the styles, dark and light, one sheet per view (src/core/styles.js loads each with its view): base.css and
                        hold.css for the first page, blueprint.css for the blueprint, frame.css for the frame, one for each view, labs/<lab>.css for each lab
tests/                  node:test: the engines, the game, the atlas, the ledger, the weave and the words
scripts/                serve.mjs, smoke.mjs (browser test, in sections), i18n-check.mjs, mcp.mjs (the open port), agent.mjs (an agent of your own)
content/                the lab written from first principles, one document per open question, and the puzzles
community/ledger/       the community's entries, one file each, never edited afterwards
```

The tree above names the main files; every engine in `src/engines/` and lab in `src/v2/labs/` has a line of its own at the top of its file.

## What loads when

Each part of the lab loads when it is opened. The rule for the 3D views: **the shell imports no 3D module.** `src/v2/app.js` (and everything it imports statically) never imports `kit3d.js`, three.js or a 3D view; the plain data it needs from them lives in `src/data/views3d.js`, and a view's 3D, three.js with it, loads when that view is first opened (the `ensure…` functions in `app.js`). Each view's glue (`src/v2/glue/`) loads when its view first opens: until then the shell holds stand-ins that load it and then run (`waits` in `app.js`), and hiding a view that never opened does nothing. The styles do the same: the first page loads `base.css` and `blueprint.css` (under 60 KB together, `tests/styles.test.mjs`), and each view's sheet loads with its glue (`needStyles`, `src/core/styles.js`, which keeps every sheet at its place in `ORDER` so the cascade is the same whatever order they load in). The labs (`src/v2/labs/`, each declared in `src/data/labs/`) load with the first challenge played (`labsReady` in `src/v2/play.js`), their styles with them, and the worlds' documents (`content/*.md`) when a page or the island's first card shows them. The idle preload (the island's views, warmed while the island shows; the labs, on the first page) runs only after the page has painted, and never when the connection asks to save data or is slow (2g, 3g); it marks the page with the moment it starts (`data-preload`). `tests/load.test.mjs` walks the static imports from `src/main2.js`, and the smoke test's `explore-desktop` section checks what the first page fetches before its preload.

## The zoom

Each depth `i` has a portal `[x, y, side]`: where depth `i + 1` sits inside its 1000 x 1000 scene. The camera position is one number `z`: `z = i + f` means depth `i` with the view shrunk a fraction `f` of the way to its portal, geometrically (`cam()` in `src/engines/weave.js`). At `f = 1` the portal fills the view, exactly as depth `i + 1` does at `f = 0`, so there is no cut (a test checks it, in every world). The depth list is the current world's way down: `setWorld(id)` changes it, and `zIn(id, z)` says where the same view is in another world. `reshape(id, { portal, m })` lets a depth follow your chip: on the wafer, the chip the dive follows is as large as yours. The journey is a world with `line: true`: `lineFrames()` places its stations side by side and slides the camera along them, and `world.js` draws them with `renderLine()`, joined into one panorama (`GAP = 0`), with your pod and the caption band drawn on top (`drawJourney()` in `journey.js`). Every station uses the same oblique 2.5D view, floor and track (`hall()`, `TRACK`), which is what makes them join. Each station is a list of steps (`JOURNEY` in `journey.js`: where the wafer goes, through which places, for how long, which robot carries it, what the caption says and what the slice shows after); `flow()` turns the time since you stopped (`G.run`, from `world.js`) into the wafer's place, who holds it and what the slice shows. The station you stand at is yours (`G.mine`): your wafer goes through it; the others play the same steps with someone else's. Parts that move wafers are named once for every station (`part.handle.*`, `partWord()` in `src/data/weave.js`). A test checks that every step goes somewhere real, has its words, and that a robot makes every move. Taps on a part of the picture (not a question's dot) go to `on.part`, and the card shows what that part does (`what.*`). `frames()` turns `z` and the screen box into three transforms: the current depth, the next one inside its portal (fading in), and the previous one around it (faint).

A scene is `{ parts, draw(G) }`. `G` is a small drawing helper (rectangles, lines, circles, labels by text name); a scene never contains words. `parts` are named shapes a question can light up.

## Questions

A stop `'thread.depth'` lists the parts it lights up; its words are `stop.<thread>.<depth>.q`, `.note` and optionally `.tried` (a list). At a stop the card can also show its `FIGURES` (from `src/data/facts.json`), its `CASES`, and the companion's prompt (`ui.prompt`). Where a followed thread has no stop, the card links to the question form on GitHub (`REPO`, `.github/ISSUE_TEMPLATE/question.yml`), filling in its `where` and `continues` fields. The card shows the questions crossing a depth; the world draws them as dots on their parts. Following a thread, `below()` and `above()` give its next forms. `rootShown()` decides when its core question may appear.

## The chip world (src/v2, index.html)

How views show content and how visitors move is set by [SYSTEM.md](SYSTEM.md); `src/data/atlas.js` gives every thing one home (place and level), names each view's parts by that home (`VIEW_PARTS`), and holds the Turn (`TWINS`). `index.html` boots `src/main2.js` and `src/v2/app.js`: the loop in the bar (`src/engines/way.js`: the stages, where an address is in the grid, and where along leads), routes in the address (`#/`, `#/place/<id>`, `#/dive/<depth>`, `#/line/<step>`, `#/bench/<level>`, `#/do/<challenge>`, `#/ask/<thread>/<depth>`, `#/log`, `#/build`, `#/ecosystem`), one card for a picked place, level, challenge or question, and two reading views (your log, the Lab's record). How it holds together is in [WORLD.md](WORLD.md). `src/v2/game.js` is the game as pure data and logic (no DOM; `tests/game.test.mjs`): the loop's steps and stations, the challenges and what each grows, each place's doors (its levels `INSIDE` and questions `ASK`, both from `src/data/places.js`, which gives every world and depth of the earlier site a place and a level; `LOOK`, `DEBATES_AT`), your state in `localStorage`, the checks (each asks an engine), and the community's jobs from the plan. `src/v2/play.js` plays one challenge inside the sheet, redrawing by patching the DOM so a slider keeps its drag. `src/v2/kit3d.js` holds the one stage (a single renderer and GL canvas every 3D view draws on), light, the two palettes, rounded shapes and HTML labels at 3D points. `src/v2/map3d.js` is the chip world: the island with its loop road and numbered stops, your chip, the growers, the Lab's floors and the village's plots, and the islands across the sea; `setState()` redraws what grew. `src/v2/frame.js` is the frame every view below the island wears (docs/SYSTEM.md §3): the way up and the path, the levels as a rail, Look · Do · Ask (Do and Ask filled from the atlas for the level in view), the Turn, the live goal, and the dock where the view writes its story; `app.js` puts the flight, the stack, the board and the flat views in it: the earlier site's 2D world (`src/app/world.js`) on one canvas, as the dive (chip to atom, `#/dive/<depth>`), the line (the factory, `#/line/<step>`) and the bench (the studio, `#/bench/<level>[/<challenge>]`, where a design challenge plays in the dock and `src/app/design.js` draws it). `src/v2/board3d.js` is one board with no side panel (`#/board`): parts that carry their names and figures and can be picked, cores lit as much as they are busy, numbers streaming from memory; `src/v2/story.js` plays a story docked below it that drives the camera, with touchable words and live numbers, and `src/v2/stories.js` holds the stories as data. `src/v2/chip3d.js` is inside a chip, layer by layer: one stack of rows (a depth of the dive and the factory steps that make it) and one position, the rows above not made yet; it is the dive's levels as made, reached along the loop from the dive at the same level (`alongTo` in `src/engines/way.js`), and the dive stays the only way down; its panel in `app.js` (`showChip`) holds the rows and the card. The design studio is one place (#267): `src/v2/studio3d.js` walks its ground floor (`#/place/studio/<n>`: 0 outside over the opened floor, then one corner per design step in order along the room, the last the mask house's loading bay), drawn from the same plan as the island draws it (`src/data/studio.js`, with the furnishing of `src/v2/furnish.js` shared by both, so the room you saw is the room you walk). *Go inside* on the island flies down into it instead of cutting to the bench; at a corner the way in settles the camera on that corner's screen until it fills the picture (`handoff()`, timed on the clock) and the step's bench takes over there, the view transition opening from the screen; the bench's way up returns to the same corner, starting on its screen (`back()`). The studio and the factory's line are rows of steps: the frame draws their steps as one line from left to right (`o.steps` in `src/v2/frame.js`) and the rail holds only the level a step shows (`stepsOf`, `levelOfStep` in `src/engines/way.js`). `src/v2/dc3d.js` is the data centre at true scale in metres, the followed chip near the origin, its camera moving along one path with depth z in 0..5 and everything that opens (roof, door, tray, lid, heat sink, chip lid) opening as a function of z. Places not yet redrawn link into the current site with `index.html?world=…&depth=…&thread=…` (and `map=1` for the supply map).

## The card and the picture

Words that belong to a part sit on the picture; the card keeps only what does not. At a depth, the picture marks the square you dive into ("Dive into: …", tap it to go), and notes pinned to parts (`world.setNotes`): what a tapped part does, what your chip does there (`NOTE_AT` in `src/data/weave.js`), the clue of an X-ray block, and in the studio what the factory will do to your design. Where the picture is too narrow for them (a phone), the notes move into the card. The card itself is short: where you are, one line on what you see, the question you follow (its question, its note and the way deeper or higher), and the rest in tabs, one open at a time (Try it, Evidence, What people try, Ask an AI, Questions here, Your chip, X-ray, Its life, The floor, Debate, Another way, Built here; in the studio, The shared plan, Work with an AI, At the factory, The shared chip).

## Words and languages

Every word on screen lives in `src/i18n/en/` and is read with `t('name')`, including the words drawn on the picture. Those are measured, never assumed to be English-sized: `wrap()` in `src/app/draw.js` breaks lines where the language allows (`Intl.Segmenter`, so text without spaces wraps too) and breaks an overlong word between characters (tested). `npm test` fails if code holds visible English, if a text is missing or unused, or if a translation's `{names}` differ. The words are split by area: each text is in the file of its prefix's area (`AREAS`, `areaOf` in `src/core/i18n.js`). `loadLang` loads `core.json`, which holds what shows before any view opens (the bar, the loop, the frame, the map of stations, Your log, Break it), and the first page awaits its own, `blueprint.json`; each view's glue awaits its areas (`needWords`, `WORDS` beside `GLUE` in `app.js`) before it draws, the labs await `labs`, and the rest load in an idle moment once a view has opened. On a connection that saves data (Data Saver, 2g, 3g) nothing loads ahead, so every view must wait for every area it shows: `tests/words-wait.test.mjs` reads the texts each module names, follows each view's imports and fails when a view shows an area it does not wait for, and the smoke test opens the views cold with Data Saver on (`scripts/smoke/slow.mjs`). `t()` stays synchronous; a text asked for before its area loaded warns `Missing text:`, and the smoke test fails on it. To add a language, area by area, make `src/i18n/<lang>/`, translate any of the files of `src/i18n/en/` into it, and add the language to `LANGS` and the area to `TRANSLATED`; an area not yet translated shows in English and is never fetched. Chinese, French and Spanish have the first page (the blueprint) and the bar so far.

## Checks

- `npm test`: every engine, the chip world's game (`tests/game.test.mjs`), the atlas, the ledger replayed in order, the weave (continuity of the zoom, parts, threads, the core-question rule, figures and cases with sources) and the words (no visible English in code, no missing or unused text).
- `npm run test:browser`: Playwright opens the site on desktop and phone, in sections that each open their own pages (`-- --list` names them, `-- --only <a,b>` runs some), and plays every lab to its win. CI runs every section, in groups side by side ([WORKFLOW.md](WORKFLOW.md)).

## The journey: lens, names, ways down and back

- **Stations are built once.** journey3d.js builds the stations in view at once, then one more each frame, nearest first, and keeps them all; only those near you are drawn. The camera is kept relative to where you are on the line, so travelling never leaves it behind and it never jumps.
- **The lens** (lens3d.js): while a step works on your wafer (`LENS` maps step to picture), a block of its surface, magnified, floats beside the machine, drawn in its own pass and tied to the place in the machine by two lines. It is the band's slice in 3D (the same levels, `flow().sl` and `.a`) plus what moves: drops, gas, light through the mask, ions, atoms fired in, copper, the needle, solder and the package; at the start, atoms joining the crystal in rows. lens3d.js has no words: it says where its layers are on screen; journey.js writes their names (`slice.*`), what the lens shows (`lens.*`), and the way down. Tapping it dives into what it shows (`DIVES`).
- **Names**: the part the step happens in is named in the picture; the tag button beside pause names every part.
- **Ways down and back**: `DIVES` (station to a depth of the factory's dive) and `MADE` (a depth of any dive back to the station where that part is made) join the journey and the dives both ways.

## The world around the line

The globe in the journey's band (and "Where in the world?" in the card at any station, or "Where was it made?" at the top of each dive) opens the map: it zooms out from your station to the whole trip of a chip, for the three kinds of chip the dives start from. Each step of the trip (design, wafers, tools, fab, memory, package, assembly, use) is drawn where it happens (`ROUTES` in `src/data/world.js`), with crates moving between places like the pods on the line; your wafer's step is marked. Tapping a place shows what happens there and who does it, joins it to its station on the line, and lets you stop it: `src/engines/supply.js` says which step stops (nothing else can do it), which is strained (others take some of the work), and which waits. The card then asks the question behind it and shows the figures that bear on it. From the earlier site's supply-chain map, made universal.

## A fab you run

Your chip has a fourth setting, `load`: how full the fab that makes it runs (`LOADS` in `src/engines/chip.js`). `src/engines/fab.js`, from the earlier site, models the fab as a re-entrant line: every layer of your chip visits the same tool groups, the busiest group (the scanners) sets the pace, and waiting grows without limit as a group nears full. The model gives each loop station of the journey how busy it is and how long a wafer waits there per visit (`GROUPS_AT` joins stations to tool groups). You change it with the "Try it" at Wires (the question of who decides the order); the card at every loop station says what it means there, and in the 3D factory the shelves under the overhead track fill with pods waiting their turn, most at the scanners. Fuller is cheaper (a fab's costs are mostly fixed) but slower: a challenge asks for both.

## The design studio

The top bar's Design is a second line (`flat: true`: drawn in 2D, without the factory's 3D), before the factory: the job a chip must do, its description, the check, the gates, the layout and the masks. One design runs through all six (`S.design`, saved): pick a job at the first station (from a half adder to one slice of a RISC-V core's ALU), edit its description in the card at Describe or Check, and every station's picture follows at once, through the earlier site's tiny-chip engine (`src/engines/tinychip.js`, wrapped by `src/engines/design.js`). Some jobs start with a bug the check finds. At Layout the design sits on one tile of a shared chip, beside the designs already in the community's plan (`src/data/build.js`), with a form to propose yours; at Masks it is sent to the factory's Print station, and Print points back to where its masks come from. The factory's Test station says how many faults your design's own test patterns would catch.

## The build

`src/data/build.js` holds the community's goal as a tree of needs, each with an engine (`logic`, `repeat`, or none yet), and the designs proposed for them, each saying who wrote it (`kind`) and how AI was used. `src/engines/build.js` gives each need its state (built, open, partly, or waiting for an engine) and holds the engines: to add one, give it a `check(need, design)` and name it in a need. The studio's first station draws the plan with your job in it and your own finished pieces lit (`S.done`); at Describe and Check, `AGENT` holds proposals of the kind AI assistants make (some subtly wrong, with a confident claim) and the card offers a prompt for any assistant. Who wrote the description (`S.by`: you, an AI, both) shows in the band, on your tile of the shared chip, and in the GitHub design form (`.github/ISSUE_TEMPLATE/design.yml`, beside `need.yml`).

## The core, and the factory at every station

The core is a job of the studio and a need of the plan, checked by the `riscv` engine (`src/engines/core.js`): the earlier site's simulator, with every add, subtract, logic operation, comparison and branch going through 32 copies of your ALU slice (`S.codes.alu`, the last description you wrote for it). Its registers are made of designs too once you have written them (`registerFile` in `src/engines/core.js`): your register bit, copied 1,024 times, and your register select, used three times as a tree to turn the instruction's own register-number bits into one write enable per register; after every instruction the register file, not the simulator, decides what each register holds. Its description is a program; six test programs (`TESTS`) decide whether the core is right, so a wrong slice, or an AI agent's subtly wrong one, shows up as real programs giving wrong answers. The studio draws it as a datapath running your program (registers, decoder, the 32 slices with carries rippling), a transistor budget, and a floor plan with your slice's layout 32 times.

Design and factory are one story: every station's card has *At the factory*, saying what the line will do to this design (transistors to print, speed from the switches, area against specks, masks to make). At Check, *Make one at the factory* spoils a copy: one wire stuck (`spoil` in `src/engines/design.js`, `pickDefect` for the core). The waveforms, the gates (the stuck wire in red) and the core's slices show it; the card says whether the Test station's patterns would catch it. A perfect design can still fail as a chip.

## The open port

`src/engines/api.js` gives the engines to anyone as plain functions; `scripts/mcp.mjs` serves them to AI agents over MCP (`npm run mcp`, see [MCP.md](MCP.md)). An agent reads the same plan and words a visitor does, is checked by the same engines, and proposes designs through the same GitHub form, which a person submits. A new engine becomes a new capability of the port at once.

## One world: the dive, the journey and the build meet

Every depth of a dive that a design can be (chip, block, gate, switch) says what the community and you have built of a thing like it, and links to the studio station that builds it (`BUILT` in the earlier site's shell; waiting for a view in the chip world); the studio's need, gates and layout link back to the chip, gate and block of the last dive you were in (`SEEN_IN`). The block depth outlines your design's cells among the others (`designNow()` in `src/app/scenes.js`). With `MADE` (a depth to the station where it is made), each of these depths is where scale, process and the build meet.

