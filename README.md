# Open Silicon Lab

An open-source, hands-on lab for how chips are designed, made and used — from atoms to everything they power: phones, cars, appliances and AI data centers.

**Try it: <https://focusxyz11.github.io/open-silicon-lab/>**

It is not a textbook. Everything is a simulation you can play with, a puzzle, or a build: about 90 simulations across 39 topics. The top bar has four doors: **Explore** the chip from rack to atom, **Build** something that works, **Break** it to find where it fails, and **Imagine** what could come next, plus the **Frontier**, where the lab works on what nobody has solved. Every topic page opens with a challenge, then the simulation; the reading, facts and big ideas are one click away. What you will find:

- **Rack to atom** — the top of the home page. Zoom from an AI rack down to silicon atoms, and at every level choose a lens: explore what you see, build something at that scale, break it, or imagine what comes next. At the compute die, the die becomes the map of the whole lab. A light/dark switch sits in the top bar.
- **Chip stack map** — the rest of the home page. Every topic sits in its layer of the chip stack (atoms → transistors → processors → design → manufacturing → packaging → specialized computing → devices and data centers → industry → future → big questions). Links say what kind of connection they are (part of, feeds, causes, builds on…), and lenses show one kind at a time. Follow a *thread* for a suggested route. Nothing is locked.
- **Build your own chip** — one design of yours, from gates to files a real factory accepts. Write logic in the tiny-chip studio and take it through verification, synthesis, layout, masks, fab and test; add memory with flip-flops (`reg`) and watch a counter tick; let your ALU slice run inside a **RISC-V** CPU, so a bug in your gates breaks the processor; then export a ready [Tiny Tapeout](https://tinytapeout.com/) project (clocked Verilog, info.yaml, a cocotb test) that real open-source chip tools check in CI.
- **More builds** — program and extend a **RISC-V** CPU with your own AI instruction, then architect an AI chip for a mission and compare it with real 2026 chips. The Build door gathers them, with a playground of every simulation, including a teardown of the chips inside a phone, a car, a thermostat, a laptop and an AI server.
- **Zoom into your chip** — your own design at seven scales, from the demo board on your desk to one transistor switching: package, shared chip, your tile, your placed and routed cells, one cell's transistors. Flip a switch and follow the value all the way down.
- **My chip** — your design carried through every layer: every topic page shows what that layer means for it (masks, weeks in the fab, yield, cost, distance from the limits of physics), and a passport collects a stamp for each stage.
- **The community chip** — learners' designs side by side in one real Tiny Tapeout tile, behind a selector. Add yours from the studio with one click (it opens GitHub with the file written), see the shared tile fill up, and download the whole chip ready for a shuttle.
- **Memory and the clock** — two gates that remember a bit, latches and flip-flops on the clock's tick, and a counter you can push until it breaks.
- **Evolve a circuit** — let blind evolution design a circuit from random wiring, then compare it with a person's design: sometimes smaller, always stranger, and open it in the studio.
- **Chips that touch the real world, and Chip X-ray** — catch a heartbeat or a voice on a battery budget and feed a chip cleanly; then read real-style die photos and tell what a chip is for from where its area goes.
- **New ways to compute** — why moving data costs more than computing, and playable models of compute-in-memory, spiking neurons, photonics, a two-qubit circuit, p-bits, reversible logic and dataflow chips.
- **Big questions** — challenges beyond the technology itself: *why can a perfect design fail in the real world?* and *how far are chips from the limits of physics?* (from Landauer's limit per erased bit, to why cooling cannot beat it, to how far light gets in one clock tick).
- **What if?** — the map becomes a simulator: move a lever (AI demand, HBM supply, electricity prices, a late node, a chip shortage) and watch the effect ripple across connected topics, step by step.
- **Your bench** — test a chip the way engineers do: twin-test every input pattern against the simulation and track a defect to the broken wire, on a virtual board or, as boards join, real hardware through the open Open Bench Protocol. See [docs/HARDWARE.md](docs/HARDWARE.md).
- **Time machine** — drag from 1971 to 2040 and the whole site follows: transistor counts, process nodes, printing light, design cost, which companies exist. History to 2026, labelled projections after.
- **Design with an AI agent** — an agent proposes designs, code and facts; you check them with the lab's engines and decide what to trust.
- **Frontier** — where the lab works on what nobody has solved. The open problems (walls), the answers people give and how well each is tested; the gaps nobody has filled yet; the community chip; and the whole frontier map, every challenge by layer and by how far it reaches. Propose a challenge or a view on an open problem from a prefilled form: every proposal is a GitHub issue anyone can read and improve.
- **Knowledge** (in the footer) — big ideas, trade-offs and measures that echo across layers, a glossary, and dated, sourced facts, rechecked monthly.

Some simulations open at four depths on the same picture: **See it**, **Measure it**, **Model it** and **Open question** (so far wafer yield and quantum search; see [docs/DEPTH.md](docs/DEPTH.md)). Topics not yet converted keep a Beginner / Engineer switch for explanations. When the lab is opened inside Claude, an "Ask Claude" tutor and a RISC-V copilot appear.

## Run it

No build step and no dependencies. Serve the folder with any static server:

```sh
npm start                 # python3 -m http.server 8000
# or
node scripts/serve.mjs 8000
```

Then open <http://localhost:8000/>. (Opening `index.html` straight from disk does not work, because browsers block module and content loading from `file://`.)

## Test

```sh
npm run catalog           # after changing a topic folder or a community design: check and rebuild
npm test                  # every engine, the knowledge graph and the community designs (node:test)
npm run test:browser      # every view and topic in Chromium, desktop and mobile (needs Playwright)
npm run test:verilog      # every tiny-chip export and the community chip through Icarus Verilog and Yosys
npm run build             # dist/open-silicon-lab.html: the whole lab in one file
```

GitHub Actions runs all four on every pull request and deploys `main` to GitHub Pages.

## Project layout

```
index.html               app shell: top bar and the views (map, topic, the Build, Break and Imagine doors, Frontier, knowledge, my chip)
topics/<id>/             one folder per topic: content.html, topic.json, labs/*.js, optional style.css
topics/README.md         how a topic folder works, and how to start a new one   ← start here to contribute
community/<name>/        designs for the community chip, one design.json each (see community/README.md)
src/data/topics.js       the knowledge graph, read from the topic folders: topics, typed links, big ideas, threads
src/data/links.js        the six kinds of link, and how to choose one
src/data/ideas.js        big ideas that echo across layers
src/data/tradeoffs.js    trade-offs: what you give up
src/data/measures.js     measures: what a number counts and what it hides
src/data/debates.js      open debates, each view with its assumption
src/data/challenges.js   the generated challenge list (each challenge lives in its topic.json)
src/data/facts.json      dated, sourced facts (updated by pull request)
src/data/learning.js     the glossary (explanations and quizzes live in each topic.json)
src/engines/             pure logic, no DOM, with tests: RISC-V, tiny chip, flip-flops and clocks, zoom, export,
                         community chip, evolution, physics floor, reliability, new ways to compute, …
src/hw/                  the bench: the Open Bench Protocol, transports, board adapters, twin testing
src/app/                 the shell: loader (topics load on demand), router, map, views, learning layer, tutor
src/generated/           catalog, graph and community list, generated by `npm run catalog`
src/labs/                the two simulations on the map page (zoom, time machine)
src/i18n/en.json         every word on screen in the shell, read with t('name'); ready for more languages
src/styles/              base.css (shared simulation styles), app.css (shell, map, views)
content/                 the zoom viewer, glossary and sources pages
tests/                   node:test suites
scripts/                 dev server, catalog, new-topic, browser smoke test, single-file build
docs/                    architecture, workflow, hardware, the roadmap, the road and the idea bank
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit and [docs/WORKFLOW.md](docs/WORKFLOW.md) for how changes are proposed and shipped. Where it is going: [docs/ROADMAP.md](docs/ROADMAP.md), the Build your own chip road in [docs/JOURNEY.md](docs/JOURNEY.md), and ideas not yet picked in the [idea bank](docs/IDEAS.md).

## How this was made

Open Silicon Lab is built with AI.

What that means for you:

- **Expect some mistakes.** Automated tests check that the simulations compute what they claim, for example that every RISC-V level's reference solution passes, every tiny-chip design routes, each cell's transistors compute its logic, and the exported Verilog passes real chip tools. Review by chip experts is only beginning.
- **The simulations are simplified on purpose.** Each one says what it leaves out.
- **Corrections are the most valuable contribution.** Every topic page has *Report a mistake* and *Suggest an idea* buttons that open a short form here on GitHub.

## Feedback and contributing

- [Add your design to the community chip](community/README.md): from the studio, in one click.

- [Report a mistake](../../issues/new?template=correction.yml): a fact, explanation or simulation that is wrong or outdated.
- [Suggest an idea](../../issues/new?template=idea.yml): a simulation, challenge, topic or connection you would like to see.
- [Something broken?](../../issues/new?template=bug.yml): a page or button that does not work.

## Accuracy

Every simulation is a teaching model and says what it simplifies. Figures about the 2026 industry live in `src/data/facts.json`, each with its source, date verified and kind (reported, vendor claim, estimate, projection). Corrections are very welcome — open an issue or a pull request with a source.

## License

MIT. See [LICENSE](LICENSE).
