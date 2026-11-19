# Status

Where the lab stands, and what is ready to be built next. Read this first when starting a new session. The direction is in [ROADMAP.md](ROADMAP.md), ideas not yet picked are in [IDEAS.md](IDEAS.md), and how we work is in [WORKFLOW.md](WORKFLOW.md). Last updated 19 November 2026 (after the car's flight, #236, a search at every level, #246 and #247, and one way down through a chip, #230).

## Where it stands

- **The site** is the chip world (`index.html`), live at https://focusxyz11.github.io/open-silicon-lab/. It is one island:
  - The places sit round a chip's life: the Lab (Open), the studio (Design), the quarry and the factory (Make), the test house (Test), the port (Ship), and the data centre (Use).
  - Phones and cars are islands of their own.
  - Every place and level has one card with Look, Do and Ask.
- **On a desktop** (1100 px and wider), the card is a bench at the right and the picture takes the rest. On a phone, the card sits below the picture.
- **A new frame can be tried with `?frame=2`** (the plan is #271; part 1, #272): whatever you are working on gets the stage. Look, in the dive and the three flights (data centre, phone, car), is a caption on the picture, bottom left (the level's name and size, one sentence, its whole question, its search, *Read more* and *Do*), and the names on the picture are larger; on a phone the caption is a sheet that rests at the name and the whole question. Do, for *Half the power*, the batch bet and *Build your own AI chip*, puts the lab's instrument on the stage with its goal as meters across the top, its controls in a side panel that grows with the screen, and a small *Where you are* that leads back. `?frame=1` turns it off again. `src/v2/frame2.js`, `src/styles/frame2.css`; a lab declares its instrument and goal as [LABS.md](LABS.md) says. Without the flag nothing changes.
- **The way in is on the picture.** Every view that can go deeper shows one large *Go inside* button over the scene, a copy of the card's own way deeper (any element marked `data-in`, mirrored by `src/v2/frame.js`). In the data centre it stands beside the thing you would enter, with a ring on it; scrolling past the chip carries the flight into the chip, and the card lists what you see at each level and what each part does (in the flight and in every dive, chip to atom; choosing a part in the dive picks it on the picture, with its note). On the island, a place's card offers *Go inside* even before a part is picked, and zooming in close then pushing on goes inside too.
- **The way in has its ring in every view** (#232): the flight, the dive (the square the next level lives in, or a 3D level's door), the chip's layers (the next layer, where it shows) and the board (its chip, a way in on every step of its story).
- **The chip's layers are framed beside the card** (#231): each row and what is under it fit the part of the picture the frame leaves free, names inside it (`inset` in `src/v2/chip3d.js`; the board does the same).
- **Size at every level** (#234): the rail says each level's rough size (`sizeOf` in `src/data/atlas.js`), and while moving the card says how many times closer the next one is (`src/v2/frame.js`).
- **The way along is on the picture too.** Whatever next step a card writes (`data-along`: the next station on the line, the next step in the studio) is mirrored by the frame as a *Next →* button at the picture's right edge. On the line, a station with an inside (`DIVES` in `src/data/weave.js`) has its way in on the picture, ringed on its machine (`DIVE_PART`): at print, *Go inside · Printing machine*; ↓ follows it (#233).
- **On the island, buildings invite you in** (desktop): pointing at a building or a machine with an inside rings it on the ground and shows *Go inside* over it; a click selects, a double click goes in (#237).
- **On a phone, the card steps aside** (below 720 px only): in the dive, the line, the studio and the flight it rests as a peek (the level's name and its question), slides up when touched and folds when the picture is touched; the ways in and along wait above it, at the thumb; a quick swipe up or down on the picture moves one level in or out (#238).
- **One way down through a chip** (#230): the dive (`#/dive/<level>`) is the only way down; the chip's layers (`#/chip/<row>/build`) are the same levels *as made*, the lower half of the Make column. From the block, the gate, the switch or the atom, along (Make in the bar, underlined beforehand, or ← →) lands on that level's layer as made, with the address and the bar saying Make; along back (Use) returns to the dive at the same level. In · out (↑ ↓, the rail, the wheel, *Go inside* on the picture) moves through the layers, the rows above not made yet, so climbing builds the chip. The layers' card is the dive's: up, deeper, the step on the factory's line, and the level at the other stages; *The flat dive* is gone, and the board's way into its chip opens the dive. The whole chip as made is still the die on its wafer (`#/dive/die/made`); an old `#/chip/<row>` opens the same layer as made.
- **From the flight into the dive, one chip.** The die the flight lands on and the dive's chip level are drawn from one plan (`src/data/die.js`, in the tones of `CHIP_TONES` in `src/v2/kit3d.js`): the same tiles, memory band, links, clock wires and pads, with four stacks of memory beside the die on one base, at the dive's own scale. The dive's chip starts where the flight ended (its angle, the point it looked at, as close; `HANDOFF` in `src/v2/dc3d.js`, `arrive` in `src/v2/level3d.js`, marked `data-arrive` on the page while it lasts), the package fading as it rises to the plan; going on comes down into one tile (the block). The stacks are named by their home (`VIEW_PARTS.dive` and `diveWord` in `src/data/atlas.js`).
- **Something to do at a level** (#235, #246, #247; `src/data/seek.js`): every level of the data centre's flight, the phone's flight and every world's dive has a search (all but the wafer, which draws only two parts): the card says what to look for; tapping a part, on the picture or in the card, gives something true to notice; the part that leads into the level's question lights it (in the card, and its parts on the picture); what you found is kept in *Your log*. A level the flight shares with the dive shares its search (`fly`, `seekAt` in `src/data/seek.js`), so a part found in one counts in the other. The car's flight has no search yet.
- **A phone is flown through too** (`src/v2/phone3d-flight.js`, `#/place/phones/<level>`): from the phone on a desk, its screen opened like a book, into the frame where the battery fills most of it, onto the board as its shields lift, to the chip as the memory on top lifts off; past the chip it carries on into the dive's phone chip, which starts where the flight ended (`HANDOFF`, as the data centre's does). The flat dive keeps its phone and board levels, where their challenges are played.
- **A car is flown through too** (#236, `src/v2/car3d-flight.js`, `#/place/cars/<level>`): from an electric car on its road, into it as the roof and the near side are cut away (the battery floor, the motor at the back wheels, the control units and the wiring), down to the control unit in the driver's footwell, whose lid lifts off, onto its board, and onto the microcontroller as its package clears to the die and its bond wires; past the chip it carries on into the dive's car chip (`#/dive/mcu/car`), which starts where the flight ended (`CAR_HANDOFF` in `src/v2/relief3d.js`). The car island's *Go inside* opens it.
- **Challenges:** 42 in all, listed in `CHALLENGES` in `src/v2/game.js`, each played in the card where it lives. The newer labs are one file each in `src/v2/labs/` (how to build one: [LABS.md](LABS.md)).
  - **Design:** the half adder, the majority voter and the full adder; the proof's bet; Verify the agent (at the Lab); the right chip for the job; Evolve a circuit; Build your own AI chip (the capstone, at the studio's need).
  - **Make:** Grow a perfect crystal (at the quarry); through the factory in time; a chip that is quick to make; Moore's bet; the pieces' bet. Then the factory line, one lab per step: print the finest lines, the 1,000-watt source, ten billion vias, etch straight down, the bare bottom, the furnace spreads it, shallow and switched on.
  - **Test:** find the broken copy; more cores, still cheap.
  - **Ship:** through a phone's, a car's and a data centre's life; Look inside the newest phone; from a signal to bits (a heartbeat at the phone's board, a bearing at the car's control unit); the power chip (at the phone's board).
  - **Use:** feed the cores; half as fast again; Cray's bet; the batch bet; Jevons' bet (at the power island). Serving a language model: quantization and prefill against decode (at the chip), energy per token (at the rack). Down the dive: half the power (block), the counter that fails (gate), too hot for silicon (switch). New ways to compute: compute in memory (block), quantum search with noise (atom).
- **A puzzle: where does the energy go?** (#248, #249; `content/puzzles/`). A new kind of open question, one problem that runs through every level, scored by one engine (`src/engines/budget.js`: the energy of one AI answer at every level of the data centre's dive, split into computing, moving data and heat). On the site it is *Follow the joule*, a lens on the data centre's dive (`src/v2/joule.js`), offered on the `fetch` seam, on the field questions it crosses and in *Where an answer's energy goes*; the labs of each level are its levers. Attempts are `try` entries with a plan, from people (kept from the lens) or agents (`energy_budget`, `submit_attempt`); the map of attempts is on the desktop only.
- **A puzzle: how can a chip be right when its parts aren't?** (#252; `content/puzzles/errors.md`). The second puzzle, scored by `src/engines/errors.js`: for a place (a phone, a car, a data centre, space) and a plan (one protection at each level, from checks in the job down to the package's materials), the wrong answers per billion that are fixed, caught or silent, from each source, and what being right costs in energy (on the budget engine's scale), area, time and price. Content and engine only; part 2 (a lens and attempts) comes after the energy puzzle's lens has been tried.
- **Elsewhere on the site:**
  - What if? between the islands (`#/whatif`).
  - Machines from shared blocks (`#/machines`, from the Lab's card): no standard computer, a machine of shared blocks for one need, each block as software, a circuit or new matter; an agent assembles, the person decides ([MACHINES.md](MACHINES.md)). Beyond today's chip: new matter as in memory, light, spikes, reversible logic or living cells, each resting on claims marked in products, shown in a lab or a guess, energy as a range down to the floor, and an agent that counts guesses only when told. Fab on a desk: the plan names where its parts are made (a giant fab, a small fab, a flexible line, a fab on a desk), each with days a try on the same ladder of how sure; the agent weighs days too. Moore's law for ideas: an attempt at a machine is kept in the ledger, and the lab's curve draws the best so far against the attempts so far, with its law. Liquid hardware: a block can be a fabric rewired after it is made (an FPGA, an array rewired every tick, the 50 ns goal), exact and changeable; a need whose job changes (a radio that listens everywhere, every 100 ns) asks its parts to keep up, and a map shows how fast each part reshapes against what it costs.
  - The questions from the field.
  - The worlds made from the documents in `content/` (`#/w`).
  - The ledger of community entries.
  - The open port for AI agents (`npm run mcp`).

## Decisions to keep

- Never list the eleven core questions together.
- No linear path.
- Visuals over words.
- Nothing cartoonish.
- Feedback goes through GitHub only (issues, *Break it*).
- People's feedback is outside the loop: anyone may break the lab at any time, for any reason. It is never a planned stage, a roadmap item or a task.
- Desktop first where it is richer; the phone gets a simpler design or less content, never the other way round.
- One home for every thing (the atlas); words only in `en.json`; figures only in `facts.json`.
- Not decided yet: whether the site has a menu (`?menu=1` shows one, to compare).

## Ready to build

Each task below is self-contained and can be handed to Claude Code on the web as written. Each is open as an issue labelled `task` (numbers below): one task, one branch, one pull request, and the PR says `Closes #<number>`.

The labs of #216 to #221 and the fixes of #222 are built. What they left open:

1. **Serving a language model:** the cluster's network (`clusterNetwork` in `src/engines/aiserve.js`) has no lab yet.
2. **New ways to compute:** spiking neurons, light (MZI), p-bits, reversible logic and dataflow (`src/engines/paradigms.js`) wait for their labs, each at the depth where the problem it attacks is met.
3. **The clock and the power:** the pipeline and its stalls (`schedule` in `src/engines/clockpower.js`), at the block.
4. **The semiconductor lab:** the junction and the transistor (`junction`, `mosfet` in `src/engines/dope.js`), after too hot for silicon.
5. **Energy per token** is played in the island's place card, not at the rack in the flight (`doHome` in `src/engines/way.js` only knows the bench, the dive and the line), like feed the cores at the board.
6. **Each engine's remaining `WORDS`** still sit beside their copies in `en.json` (`aiserve`, `analog`, `aibuild`, `clockpower`, `paradigms`, `fabline`, `etch`, `dope`, `litho`); remove them from the engines once nothing else reads them.

### The dive and the interface

Each is an issue labelled `task`. #229 (the chip you land on is the chip you saw), #230 (one way down through a chip: the layers are the dive's levels as made, along the loop), #231 to #238, #246 and #247 are built; none is open here now.

## Ideas still to bring over

- From the first version of the site (the branch `before`, which has more content as documents): the economics of a chip, the memory wall at Use, the X-ray at Test, die photos, and the energy floor. The words already brought over wait in `src/data/waiting-words.json`.
- From the brainstorm ([IDEAS.md](IDEAS.md)), ideas in the bank and not yet built, for example Invent a transistor, Attack your own chip, Read a real open chip, Root cause across the stack, Number sense, and This month, playable.

## Know before you start

- The smoke test plays every lab to its win (`playLab` in `scripts/smoke.mjs`): it polls with `evaluate`, because `waitForFunction` does not wait for an async predicate, and it reads the challenge's own card (`.player[data-ch="<id>"]`).
- Run `npm test` before every push. CI also runs the browser smoke test (`npm run test:browser`) on desktop and phone with a software renderer. It is slow (about 7 minutes on CI, longer on a small machine), so its checks poll instead of waiting fixed times.
- Locally, install Playwright with `npm install --no-save playwright` (never commit `node_modules`). `localStorage['osl-quality']` set to `'flat'` skips 3D for speed; `'keep'` forces it.
- Several sessions in parallel work when their tasks touch different files. They meet in `en.json`, `game.js`, `map3d.js`, `v2.css` and the experiments count, so merge one pull request at a time and update the others' branches.
