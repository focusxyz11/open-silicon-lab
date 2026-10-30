# Open Silicon Lab

An open-source, hands-on lab for how chips are designed, made and used — from atoms to everything they power: phones, cars, appliances and AI data centers.

**Try it: <https://focusxyz11.github.io/open-silicon-lab/>**

It is not a textbook. Everything is a simulation you can play with, a puzzle, or a build:

- **Chip stack map** — the home page. Every topic sits in its layer of the chip stack (atoms → transistors → processors → design → manufacturing → packaging → specialized computing → devices and data centers → industry → future), with wires showing how the topics depend on each other. Select a topic to see what it holds and what it connects to; follow a *thread* for a suggested route. Nothing is locked.
- **Workshop** — three builds that connect: make a tiny chip (logic → gates → layout → masks → fab → test), program and extend a **RISC-V** CPU with your own AI instruction, then architect an AI chip. The two connect for real: the ALU slice you design in the tiny-chip studio becomes the RISC-V core's ALU, so a bug in your gates breaks the CPU. And any tiny-chip design exports as a ready [Tiny Tapeout](https://tinytapeout.com/) project (Verilog, info.yaml, a cocotb test) for real open-source tools and a community shuttle that makes real chips. Plus a playground of over 70 simulations, including a teardown of the chips inside a phone, a car, a thermostat, a laptop and an AI server.
- **My chip** — one chip that is yours, carried through every layer. Design it in the tiny-chip studio, and every topic page shows what that layer means for your chip: its masks and printing light, weeks in the fab, yield, cost, the year its process arrived. A passport collects a stamp for each stage, and you can download a card of your chip.
- **New ways to compute** — a new top layer of the map: why moving data costs more than computing, the same job on ten kinds of machine, a frontier gallery (superconducting, DNA, living neurons and more), and playable simulations of compute-in-memory crossbars, spiking neurons, a photonic interferometer, a two-qubit quantum circuit, p-bits that run logic backwards, reversible logic and the Landauer limit, and dataflow chips.
- **What if?** — the map becomes a simulator. Move a lever (AI demand, HBM supply, the price of electricity, a late process node, a shortage of ordinary chips) and the effect ripples across the connected topics: badges show what rises and falls, wires show which way the change travels, and every topic explains its change step by step back to your lever. Ready-made scenarios replay the 2021 car-chip shortage, Intel's 10 nm delay and the 2026 memory squeeze. A teaching model with sourced directions and illustrative strengths, not a forecast.
- **Time machine** — drag from 1971 to 2040 and the whole site follows: transistor counts, process nodes, printing light, wafer size, design cost, which of today's companies exist, and which topics were not invented yet. History up to 2026, labelled plans and projections after.
- **Design with an AI agent** — an agent proposes designs, code, estimates and facts; you check them with the lab's real engines and decide what to trust. Some proposals are right, so blind rejection loses too. Inside Claude, a live agent designs tiny chips and you test your calibration.
- **Big questions** — the top layer of the map, for challenges beyond the technology itself. First: *why can a perfect design fail in the real world?* Ship a chip that passed every check to a phone, a car, an AI data center or a satellite, watch variation, heat, aging, test escapes and radiation break it, and choose fixes that each cost speed, power, area or money. Then name the gap in seven real cases, from the 1994 Pentium division bug to unstable 2024 desktop chips.
- **Challenges** — puzzles, designs and experiments, and a set of *open problems* the industry is working on right now, each linked to the simulations where you can test an idea.
- **Knowledge** — idea cards, a glossary, and dated, sourced facts (current as of October 2026, rechecked monthly).

There is a Beginner / Engineer switch for explanations. When the lab is opened inside Claude, an "Ask Claude" tutor and a RISC-V copilot appear.

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
npm run catalog           # after changing a topic folder: rebuild the catalog
npm test                  # RISC-V and tiny-chip engines, knowledge-graph integrity (node:test)
npm run test:browser      # every view and topic in Chromium, desktop and mobile (needs Playwright)
npm run test:verilog      # every tiny-chip export through Icarus Verilog and Yosys (needs both installed)
npm run build             # dist/open-silicon-lab.html: the whole lab in one file
```

GitHub Actions runs all four on every pull request and deploys `main` to GitHub Pages.

## Project layout

```
index.html               app shell: top bar and five views
topics/<id>/             one folder per topic: content.html, topic.json, labs/*.js, optional style.css
topics/README.md         how a topic folder works, and how to start a new one   ← start here to contribute
src/data/topics.js       the knowledge graph, read from the topic folders: topics, typed links, big ideas, threads
src/data/links.js        the six kinds of link, and how to choose one
src/data/ideas.js        big ideas that echo across layers
src/data/challenges.js   open problems (each challenge lives in its topic.json)
src/data/facts.json      dated, sourced facts (updated by pull request)
src/data/learning.js     the glossary (explanations and quizzes live in each topic.json)
src/engines/             pure logic, no DOM, with tests: RISC-V, tiny chip, reliability, new ways to compute, …
src/app/                 the shell: loader (topics load on demand), router, map, views, learning layer, tutor
src/generated/catalog.js what each topic holds, generated from topics/ by `npm run catalog`
src/labs/                the two simulations on the map page (zoom, time machine)
src/styles/              base.css (shared simulation styles), app.css (shell, map, views)
content/                 the zoom viewer, glossary and sources pages
tests/                   node:test suites
scripts/                 dev server, catalog, new-topic, browser smoke test, single-file build
docs/                    architecture and workflow notes
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit, and [docs/WORKFLOW.md](docs/WORKFLOW.md) for how changes are proposed and shipped.

## How this was made

Open Silicon Lab is built with AI.

What that means for you:

- **Expect some mistakes.** Automated tests check that the simulations compute what they claim, for example that every RISC-V level's reference solution passes and every tiny-chip design routes. Review by chip experts is only beginning.
- **The simulations are simplified on purpose.** Each one says what it leaves out.
- **Corrections are the most valuable contribution.** Every topic page has *Report a mistake* and *Suggest an idea* buttons that open a short form here on GitHub.

## Feedback

- [Report a mistake](../../issues/new?template=correction.yml): a fact, explanation or simulation that is wrong or outdated.
- [Suggest an idea](../../issues/new?template=idea.yml): a simulation, challenge, topic or connection you would like to see.
- [Something broken?](../../issues/new?template=bug.yml): a page or button that does not work.

## Accuracy

Every simulation is a teaching model and says what it simplifies. Figures about the 2026 industry live in `src/data/facts.json`, each with its source, date verified and kind (reported, vendor claim, estimate, projection). Corrections are very welcome — open an issue or a pull request with a source.

## License

MIT. See [LICENSE](LICENSE).
