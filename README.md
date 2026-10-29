# Open Silicon Lab

An open-source, hands-on lab for how chips are designed, made and used — from atoms to everything they power: phones, cars, appliances and AI data centers.

**Try it: <https://focusxyz11.github.io/open-silicon-lab/>**

It is not a textbook. Everything is a simulation you can play with, a puzzle, or a build:

- **Chip stack map** — the home page. Every topic sits in its layer of the chip stack (atoms → transistors → processors → design → manufacturing → packaging → specialized computing → devices and data centers → industry → future), with wires showing how the topics depend on each other. Select a topic to see what it holds and what it connects to; follow a *thread* for a suggested route. Nothing is locked.
- **Workshop** — three builds that connect: make a tiny chip (logic → gates → layout → masks → fab → test), program and extend a **RISC-V** CPU with your own AI instruction, then architect an AI chip. The two connect for real: the ALU slice you design in the tiny-chip studio becomes the RISC-V core's ALU, so a bug in your gates breaks the CPU. And any tiny-chip design exports as a ready [Tiny Tapeout](https://tinytapeout.com/) project (Verilog, info.yaml, a cocotb test) for real open-source tools and a community shuttle that makes real chips. Plus a playground of over 70 simulations, including a teardown of the chips inside a phone, a car, a thermostat, a laptop and an AI server.
- **New ways to compute** — a new top layer of the map: why moving data costs more than computing, the same job on ten kinds of machine, a frontier gallery (superconducting, DNA, living neurons and more), and playable simulations of compute-in-memory crossbars, spiking neurons, a photonic interferometer, a two-qubit quantum circuit, p-bits that run logic backwards, reversible logic and the Landauer limit, and dataflow chips.
- **What if?** — the map becomes a simulator. Move a lever (AI demand, HBM supply, the price of electricity, a late process node, a shortage of ordinary chips) and the effect ripples across the connected topics: badges show what rises and falls, wires show which way the change travels, and every topic explains its change step by step back to your lever. Ready-made scenarios replay the 2021 car-chip shortage, Intel's 10 nm delay and the 2026 memory squeeze. A teaching model with sourced directions and illustrative strengths, not a forecast.
- **Time machine** — drag from 1971 to 2040 and the whole site follows: transistor counts, process nodes, printing light, wafer size, design cost, which of today's companies exist, and which topics were not invented yet. History up to 2026, labelled plans and projections after.
- **Design with an AI agent** — an agent proposes designs, code, estimates and facts; you check them with the lab's real engines and decide what to trust. Some proposals are right, so blind rejection loses too. Inside Claude, a live agent designs tiny chips and you test your calibration.
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
npm test                  # RISC-V and tiny-chip engines, knowledge-graph integrity (node:test)
npm run test:browser      # every view and topic in Chromium, desktop and mobile (needs Playwright)
npm run test:verilog      # every tiny-chip export through Icarus Verilog and Yosys (needs both installed)
npm run build             # dist/open-silicon-lab.html: the whole lab in one file
```

GitHub Actions runs all four on every pull request and deploys `main` to GitHub Pages.

## Project layout

```
index.html               app shell: top bar and five views
content/sections/*.html  one file per topic: text and the markup of its simulations
content/zoom.html        the rack-to-atom zoom viewer on the map page
src/main.js              boot: load content, start every simulation, start the router
src/app/                 map, router, topic chrome, workshop/challenges/knowledge views, learning layer, facts, tutor
src/data/topics.js       the knowledge graph: bands, topics, labelled links, threads   ← start here
src/data/challenges.js   every challenge and open problem
src/data/facts.json      dated, sourced facts (updated by pull request)
src/data/learning.js     plain/engineer explanations, quizzes, glossary
src/engines/             pure logic, no DOM: RISC-V assembler + simulator, tiny-chip synthesis/place/route/test
src/labs/                one module per simulation, each exporting init()
src/styles/              base.css (simulations), riscv.css, app.css (shell, map, views)
tests/                   node:test suites
scripts/                 dev server, browser smoke test, single-file build
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
