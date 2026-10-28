# Open Silicon Lab

An open-source, hands-on lab for how chips are designed, made and used for AI — from atoms to AI data centers.

It is not a textbook. Everything is a simulation you can play with, a puzzle, or a build:

- **Chip stack map** — the home page. Every topic sits in its layer of the chip stack (atoms → transistors → processors → design → manufacturing → packaging → AI computing → data centers → industry → future), with wires showing how the topics depend on each other. Select a topic to see what it holds and what it connects to; follow a *thread* for a suggested route. Nothing is locked.
- **Workshop** — three builds that connect: make a tiny chip (logic → gates → layout → masks → fab → test), program and extend a **RISC-V** CPU with your own AI instruction, then architect an AI chip. Plus a playground of 50+ simulations.
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
npm run build             # dist/open-silicon-lab.html: the whole lab in one file
```

GitHub Actions runs all three on every pull request and deploys `main` to GitHub Pages.

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

Open Silicon Lab is built with AI. The project owner, a learner new to chips, decides what to build and why. Claude, an AI model made by Anthropic, wrote the text, simulations, code and tests, working from public sources that are listed on the site.

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
