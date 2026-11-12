# Architecture

A static site: plain ES modules, one stylesheet and one file of words. No framework, no build step for development.

```
index.html              the page: the world canvas, the top bar, the depth rail and the card
src/main.js             boot: load the words, then start the dive
src/app/ui.js           the shell: world switch, rail, card, theme, saved state (localStorage), layout around the world
src/app/world.js        the zoom: draws the current, previous and next depths, highlights, dots, tether, input
src/app/scenes.js       one scene per depth, drawn in a 1000 x 1000 space, with its named parts
src/app/journey.js      the journey's stations as machines, the steps each plays with your wafer, your pod, the caption and slice
src/app/draw.js         small drawing helpers both use
src/app/solid.js        solids in 2.5D (boxes, cylinders, prisms, cutaways, shadows, four tones), the one way volume is drawn
src/app/journey3d.js    the journey in 3D (three.js): the plants and the factory's bay, every station's machines, the camera
src/app/design.js       the design studio: six stations showing your design from the job to the masks, and their band
src/app/map.js          the world around the line: a chip's whole trip on a map, from design to where it is used
src/app/lens3d.js       the lens: while a machine works, your wafer's surface magnified beside it, showing what the machine does
src/vendor/three.min.js three.js, loaded only when the journey is first opened
src/engines/chip.js     your chip: its settings and what follows from them, relative to a starting chip (tested)
src/engines/api.js      the open port: the engines as tools for AI agents (list the plan, take a job, check, at the factory, propose)
src/engines/build.js    where the goal stands: each need's state, and the engines that check needs (tested)
src/engines/design.js   your design: one circuit run through the tiny-chip engine, from description to masks (tested)
src/engines/tinychip.js the earlier site's tiny-chip engine: parse, check, synthesize, place, route, fault-test
src/engines/core.js     the RISC-V core engine: the earlier site's simulator, its ALU made of your slice, checked by test programs
src/engines/riscv.js    the earlier site's RISC-V assembler and simulator (RV32I)
src/engines/alu.js      a slice copied 32 times into a 32-bit ALU; a factory defect in one slice
src/engines/fab.js      a fab you run: a re-entrant line of tool groups, how busy each is and how long wafers wait (tested)
src/engines/supply.js   what stops in a chip's trip when places stop (tested)
src/engines/weave.js    pure logic: the current world, the camera, sizes, threads, when a core question appears (tested)
src/data/weave.js       the data: worlds, depths and portals, threads, stops
src/data/build.js       the build: the community's goal as a plan of needs, the designs people and AI proposed, AI agents' proposals
src/data/world.js       the map: places, and each kind of chip's trip through them, joined to the line's stations
src/data/facts.json     sourced figures, loaded at start (src/main.js); FIGURES and CASES in weave.js point to them
src/core/i18n.js        words: t('name'), plurals, numbers, dates
src/i18n/en.json        every word on screen
src/styles/site.css     the styles, dark and light
tests/                  node:test: the weave and the words
scripts/                serve.mjs, smoke.mjs (browser test), build-single.mjs, i18n-check.mjs
```

## The zoom

Each depth `i` has a portal `[x, y, side]`: where depth `i + 1` sits inside its 1000 x 1000 scene. The camera position is one number `z`: `z = i + f` means depth `i` with the view shrunk a fraction `f` of the way to its portal, geometrically (`cam()` in `src/engines/weave.js`). At `f = 1` the portal fills the view, exactly as depth `i + 1` does at `f = 0`, so there is no cut (a test checks it, in every world). The depth list is the current world's way down: `setWorld(id)` changes it, and `zIn(id, z)` says where the same view is in another world. `reshape(id, { portal, m })` lets a depth follow your chip: on the wafer, the chip the dive follows is as large as yours. The journey is a world with `line: true`: `lineFrames()` places its stations side by side and slides the camera along them, and `world.js` draws them with `renderLine()`, joined into one panorama (`GAP = 0`), with your pod and the caption band drawn on top (`drawJourney()` in `journey.js`). Every station uses the same oblique 2.5D view, floor and track (`hall()`, `TRACK`), which is what makes them join. Each station is a list of steps (`JOURNEY` in `journey.js`: where the wafer goes, through which places, for how long, which robot carries it, what the caption says and what the slice shows after); `flow()` turns the time since you stopped (`G.run`, from `world.js`) into the wafer's place, who holds it and what the slice shows. The station you stand at is yours (`G.mine`): your wafer goes through it; the others play the same steps with someone else's. Parts that move wafers are named once for every station (`part.handle.*`, `partWord()` in `src/data/weave.js`). A test checks that every step goes somewhere real, has its words, and that a robot makes every move. Taps on a part of the picture (not a question's dot) go to `on.part`, and the card shows what that part does (`what.*`). `frames()` turns `z` and the screen box into three transforms: the current depth, the next one inside its portal (fading in), and the previous one around it (faint).

A scene is `{ parts, draw(G) }`. `G` is a small drawing helper (rectangles, lines, circles, labels by text name); a scene never contains words. `parts` are named shapes a question can light up.

## Questions

A stop `'thread.depth'` lists the parts it lights up; its words are `stop.<thread>.<depth>.q`, `.note` and optionally `.tried` (a list). At a stop the card can also show its `FIGURES` (from `src/data/facts.json`), its `CASES`, and the companion's prompt (`ui.prompt`). Where a followed thread has no stop, the card links to the question form on GitHub (`REPO`, `.github/ISSUE_TEMPLATE/question.yml`), filling in its `where` and `continues` fields. The card shows the questions crossing a depth; the world draws them as dots on their parts. Following a thread, `below()` and `above()` give its next forms. `rootShown()` decides when its core question may appear.

## Words and languages

Every word on screen lives in `src/i18n/en.json` and is read with `t('name')`. `npm test` fails if code holds visible English, if a text is missing or unused, or if a translation's `{names}` differ. To add a language, copy `en.json` to `<lang>.json`, translate the values, and add it to `LANGS` in `src/core/i18n.js`.

## Checks

- `npm test`: your chip's model (`tests/chip.test.mjs`), the weave (continuity of the zoom, parts, threads, the core-question rule, figures and cases with sources) and the words.
- `npm run test:browser`: Playwright opens the site on desktop and phone, in dark and light, dives, follows a question and lets it go, opens a real case and the companion, finds the invitation in a gap, and changes world.
- `npm run build`: `dist/open-silicon-lab.html`, one self-contained file.

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

Every depth of a dive that a design can be (chip, block, gate, switch) says what the community and you have built of a thing like it, and links to the studio station that builds it (`BUILT` in `src/app/ui.js`); the studio's need, gates and layout link back to the chip, gate and block of the last dive you were in (`SEEN_IN`). The block depth outlines your design's cells among the others (`designNow()` in `src/app/scenes.js`). With `MADE` (a depth to the station where it is made), each of these depths is where scale, process and the build meet.

