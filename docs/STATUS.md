# Status

Where the lab stands, and what is ready to be built next. Read this first when starting a new session. The direction is in [ROADMAP.md](ROADMAP.md), ideas not yet picked are in [IDEAS.md](IDEAS.md), and how we work is in [WORKFLOW.md](WORKFLOW.md). Last updated 17 November 2026 (after #214).

## Where it stands

- **The site** is the chip world (`index.html`), live at https://focusxyz11.github.io/open-silicon-lab/. It is one island:
  - The places sit round a chip's life: the Lab (Open), the studio (Design), the quarry and the factory (Make), the test house (Test), the port (Ship), and the data centre (Use).
  - Phones and cars are islands of their own.
  - Every place and level has one card with Look, Do and Ask.
- **On a desktop** (1100 px and wider), the card is a bench at the right and the picture takes the rest. On a phone, the card sits below the picture.
- **Challenges:** 30 in all, listed in `CHALLENGES` in `src/v2/game.js`, each played in the card where it lives. The newer labs are one file each in `src/v2/labs/` (how to build one: [LABS.md](LABS.md)).
  - **Design:** the half adder, the majority voter and the full adder; the proof's bet; Verify the agent (at the Lab); the right chip for the job; Evolve a circuit.
  - **Make:** Grow a perfect crystal (at the quarry); through the factory in time; a chip that is quick to make; Moore's bet; the pieces' bet. Then the factory line, one lab per step: print the finest lines, the 1,000-watt source, ten billion vias, etch straight down, the bare bottom, the furnace spreads it, shallow and switched on.
  - **Test:** find the broken copy; more cores, still cheap.
  - **Ship:** through a phone's, a car's and a data centre's life; Look inside the newest phone.
  - **Use:** feed the cores; half as fast again; Cray's bet; the batch bet; Jevons' bet (at the power island).
- **Elsewhere on the site:**
  - What if? between the islands (`#/whatif`).
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
- Desktop first where it is richer; the phone gets a simpler design or less content, never the other way round.
- One home for every thing (the atlas); words only in `en.json`; figures only in `facts.json`.
- Not decided yet: whether the site has a menu (`?menu=1` shows one, to compare).

## Ready to build

Each task below is self-contained and can be handed to Claude Code on the web as written. Open it as an issue with the *Task* form, one task, one branch, one pull request.

1. **The semiconductor lab** (`too-hot`, at the switch level, engine `src/engines/dope.js`: `siliconPure`, `junction`, `mosfet`).
   - Heat pure silicon until its own free electrons match lightly doped silicon (590 to 615 K).
   - Picture: the free carriers against temperature on a log scale, with the doped level marked.
   - Then the junction and the transistor, as the engine allows.
2. **Serving a language model** (engine `src/engines/aiserve.js`, at the data centre's chip and rack).
   - Quantization (`quantize`, `fourBits`): the weights' bits against answer quality and memory.
   - Prefill against decode (`prefillDecode`).
   - Energy per token (`energyPerToken`).
   - The cluster's network (`clusterNetwork`).
   - Two or three labs; words from its `WORDS` into `en.json`.
3. **New ways to compute** (engines `src/engines/paradigms.js` and `grover.js`, data and words in `src/data/paradigms.js`), each at the depth where the problem it attacks is met:
   - compute in memory;
   - spiking neurons;
   - light (MZI);
   - p-bits;
   - reversible logic;
   - dataflow;
   - quantum search.
   - Start with two.
4. **The clock and the power** (engine `src/engines/clockpower.js`).
   - The power curve against voltage and clock (`power`, `frontier`) at the block.
   - The pipeline and its stalls (`schedule`).
   - The counter that fails when the clock outruns its slowest path (`runCounter`) at the gate.
5. **Chips that touch the real world** (engine `src/engines/analog.js`, at the phone's and the car's boards).
   - The path from a signal to bits (`capture`, `judge`).
   - The power chip (`regulate`).
6. **Build your own AI chip** (engine `src/engines/aibuild.js`, a capstone at the studio or the Lab): the architect's choices against speed, power, cost, yield and schedule.
7. **Small fixes found while building the factory labs:**
   - The films labs' smoke check matches button words ("Start etching", "Deposit"); give the run state a data attribute and select by it.
   - Print the finest lines keeps its row of scanners only in the view, so it is lost on reload; keep it in the save, as the other labs do.
   - At realistic error, the via field rarely shows a miss; show a larger sample, or mark the expected misses.
   - The EUV holes can show 0 of 9 out of spec at the lowest dose, so the speed-against-quality lesson may not appear; pick a seed or a sample that shows it.
   - A 404 in the console on the factory labs, not traced.
   - Move each engine's remaining `WORDS` into `en.json` as its views are built (`aiserve`, `analog`, `aibuild`, `clockpower`, `paradigms`, `fabline`, `etch`, `dope`, `litho`).
8. **Try it with people:** three to five learners, from a child to an engineer, while someone watches where they get stuck (ROADMAP item 9). Not a code task, but the next most useful thing.

## Ideas still to bring over

- From the first version of the site (the branch `before`, which has more content as documents): the economics of a chip, the memory wall at Use, the X-ray at Test, die photos, and the energy floor. The words already brought over wait in `src/data/waiting-words.json`.
- From the brainstorm ([IDEAS.md](IDEAS.md)), ideas in the bank and not yet built, for example Invent a transistor, Attack your own chip, Read a real open chip, Root cause across the stack, Number sense, and This month, playable.

## Know before you start

- Run `npm test` before every push. CI also runs the browser smoke test (`npm run test:browser`) on desktop and phone with a software renderer. It is slow (about 7 minutes on CI, longer on a small machine), so its checks poll instead of waiting fixed times.
- Locally, install Playwright with `npm install --no-save playwright` (never commit `node_modules`). `localStorage['osl-quality']` set to `'flat'` skips 3D for speed; `'keep'` forces it.
- Several sessions in parallel work when their tasks touch different files. They meet in `en.json`, `game.js`, `map3d.js`, `v2.css` and the experiments count, so merge one pull request at a time and update the others' branches.
