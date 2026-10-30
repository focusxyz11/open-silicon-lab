# Architecture

Open Silicon Lab is a static site: plain ES modules, HTML fragments and CSS, with no framework and no build step for development. A single-file build exists only for previews and offline use.

## The shape of the project

```
index.html            app shell: top bar, five views, the import map (osl/ → src/)
topics/<id>/          one folder per topic: content.html, topic.json, labs/*.js, optional style.css
topics/README.md      the topic contract, and how to start a new topic
src/data/             the knowledge graph and shared data (topics, challenges, learning, facts, timeline)
src/engines/          pure, tested models with no DOM (RISC-V, tiny chip, reliability, paradigms, …)
src/app/              the shell: loader, router, map, views, learning layer, facts, tutor
src/generated/        catalog.js, generated from topics/ by `npm run catalog` — never edited by hand
src/labs/             the two simulations that live on the map page itself (zoom, time machine)
content/              shell pages: the zoom viewer, glossary, sources
```

Two kinds of code, kept apart on purpose:
- **The core** (`src/`) changes rarely and is shared by everything.
- **Topics** (`topics/`) are where the site grows. A topic can be added or rewritten by someone who has read only `topics/README.md` and that one folder, which keeps each change small for people and for AI assistants alike.

## One graph drives everything

`src/data/topics.js` is the single source of truth for structure:

- `BANDS` — the layers of the chip stack, top (world) to bottom (atoms).
- `TOPICS` — each topic's id, band, kind (`explore` or `build`), title and summary. The id is also the topic's folder name in `topics/` and the URL hash.
- `EDGES` — labelled links `[from, to, why]`. The map draws them as wires; topic pages list them as "Builds on" and "Leads to".
- `THREADS` — suggested routes. They highlight a path on the map and add a step bar to topic pages. They never lock anything.

Challenges (`src/data/challenges.js`), knowledge cards, glossary terms and facts each name the topic they belong to, so every view can link back. `tests/data.test.mjs` fails if any link points at something that does not exist.

**To add a topic:** run `npm run new-topic -- <id> "<Title>" <prefix>` and follow the steps it prints (see `topics/README.md`).

## Boot sequence (`src/main.js`)

1. Load `content/zoom.html` and the facts (or read them from `window.__OSL_CONTENT__` in the single-file build).
2. Render the map shell and start its two simulations (zoom, time machine).
3. Start the learning layer, the tutor (only inside Claude) and the router.

No topic is loaded at start-up. The map, search, Workshop and Challenges read what each topic holds from `src/generated/catalog.js`. The start-up page needs about 33 files; the smoke test fails if it needs more than 60 or loads any topic early.

## Loading a topic (`src/app/loader.js`)

The first time a topic is opened, `ensureTopic(id)`:
1. fetches `topics/<id>/content.html` (and `style.css` if the topic has one),
2. adds the section to the page and gives each simulation panel its anchor `lab-<topic>-<n>`,
3. imports the topic's lab modules and calls each `init(section)` in its own `try/catch`, so one broken simulation never stops the rest,
4. adds the learning layer to it (explanation levels, quiz, glossary pop-ups, the tutor button),
5. fires `osl:topic-loaded`.

A topic loads once and stays on the page. Code in one topic that needs another (the RISC-V lab opening the tiny-chip studio) asks the shell to load it first (`src/app/studio.js`), and progress other views display is read from storage (`src/app/progress.js`), never by importing a topic.

## Router (`src/app/router.js`)

| Hash | Shows |
| --- | --- |
| `#map` or empty | the chip stack map |
| `#whatif` | the map in What if? mode, with the levers open |
| `#workshop`, `#challenges`, `#knowledge` | the three index views |
| `#<topic>` | one topic, with breadcrumb, thread bar, rail of simulations and connections, facts and next steps |
| `#lab-<topic>-<n>` or any element id | its topic, scrolled to that element |
| `#riscv-<n>`, `#riscv-sandbox` | the RISC-V lab at that level |
| `#glossary`, `#sources` | reference pages |

## Simulations

- `src/engines/` hold pure logic with no DOM, so they are unit-tested in Node: the RV32I/M + custom-0 assembler and simulator, and the tiny-chip flow (parser, synthesis, standard-cell mapping, simulated-annealing placement, maze routing, stuck-at fault coverage).
- `src/engines/alu.js` turns a one-bit ALU slice from the tiny-chip studio into a 32-bit ripple-carry ALU. The RISC-V simulator accepts it through `RV.machine(prog, init, { alu })`, and then every add, subtract, logic operation, comparison, branch decision and memory address goes through those gates. `src/app/alu-link.js` carries the slice from the studio to the RISC-V lab on the same page.
- `src/engines/export.js` writes a tiny-chip design as Verilog in the Tiny Tapeout top-level interface, plus info.yaml, a cocotb test, the template testbench and a gate-level netlist, and zips them. `scripts/verilog-check.mjs` runs every built-in project's export through Icarus Verilog and Yosys in CI.
- `topics/<id>/labs/` hold one module per simulation. Most draw on a `<canvas>` with the helpers in `src/core/ui.js` (`fit`, `watch`, theme tokens `T`), imported as `osl/core/ui.js`.

## Styling

`base.css` defines the colour tokens (light and dark), type and the shared simulation styles. `app.css` styles the shell, map and views. A topic's own styles live in `topics/<id>/style.css` and load with the topic (today: RISC-V and Why perfect designs fail).

## My chip

`src/engines/passport.js` computes a chip passport from one tiny-chip design and process: cells, transistors, area, speed, masks and light, fab time, yield, cost, history and whether it can be made for real, plus a line for each topic. `src/app/mychip.js` follows the design the studio publishes, keeps the passport's stamps (per browser), shows the line on topic pages (`#chipBanner`) and renders the `#mychip` view and its downloadable card.

## New ways to compute

`src/engines/paradigms.js` holds small, tested models of each paradigm: the energy of moving data versus computing, an analog crossbar, leaky integrate-and-fire neurons, a Mach-Zehnder interferometer, a two-qubit state-vector simulator, p-bit sampling, reversible logic and the Landauer limit, and a dataflow energy model. `src/data/paradigms.js` holds the editorial fit matrix and the frontier gallery. Each topic in the `next` band has a lab in `topics/<id>/labs/next-*.js`.

## Design with an AI agent

`src/data/agent-cases.js` holds eight scripted cases, each an agent proposal (a tiny-chip design, RISC-V code, a yield or roofline estimate, a dated claim, a test report) that is either sound or has a realistic flaw, plus pure checks built on the same engines. `tests/agent.test.mjs` proves every flaw is real and every sound proposal works. `topics/agent/labs/agent-partner.js` lets the learner check with those tools before trusting or rejecting; inside Claude it adds a live agent that designs tiny chips.

## What if? The map as a simulator

`src/data/ripple.js` is a small causal model: five levers, about thirty indicators (each sits on one map topic) and rules of the form *from → to, strength, wire label, reason*. `src/engines/ripple.js` sorts the indicators so every input comes first (a loop is an error), then computes each one as the sum of strength × change over its inputs, or the smallest input for `MIN` indicators (AI chips shipped follow whichever of demand or HBM is scarcer). It also returns each indicator's contributions and its distance from a lever, which the map uses for the cause chain and the ripple animation. `src/app/whatif.js` draws the lever panel, the badges and the side panel; `src/app/map.js` switches the mode and draws the causal wires. Directions follow the facts each lever cites; strengths are illustrative, and `tests/ripple.test.mjs` checks the directions against what happened in 2021–2026, that the graph has no loops and that every puzzle has a solution. To add a rule, add one line to `RULES` with a reason a learner can read.

## The time machine

`src/data/timeline.js` holds dated series (landmark chips, process nodes, transistor shapes, lithography, wafers, design costs, company founding years and Karl Rupp's microprocessor data) and `snapshot(year)` / `topicLine(id, year)`. `src/app/era.js` keeps the site's year (per tab, today by default), adds the year button to the top bar and the banner to topic pages, and fires `osl:year` when it changes. Labs that know about time listen for that event: the map's time machine, the company explorer and the roadmap.

## Progress and state

Everything is per-browser `localStorage`: explanation level, topics visited, quiz answers, RISC-V code and stars, solved What if? puzzles. Nothing is sent anywhere. Progress is feedback, never a gate.

## Facts

`src/data/facts.json` holds `facts` (label, value, kind, topic, source, url, verified date, optional previous value) and `changes` (a dated log). Topic pages show their facts; the Knowledge view lists all of them. A monthly check proposes updates as a pull request.

## Where the structure is going

The aim is that the project can keep growing, with new ideas and conflicting ones, while its key
concepts stay the same. Five concepts are fixed; everything new fits into one of them:

1. **Layers**: where something lives, from atoms to big questions (`BANDS`).
2. **Questions**: every topic opens with a question or challenge, not a definition.
3. **Typed connections**: builds on, leads to, trades off with, same idea at another scale, affects, disputed.
4. **Lenses**: how it works, build it, what breaks, who pays, the future with AI.
5. **Time**: history to today, labelled plans and projections to 2040.

A conflicting idea becomes a "two views" item with the assumptions that separate the views, not a
contradiction in the text. A new idea is one of: a topic, a question, a connection, a lens card or a dated fact.

Steps, each a small pull request:

1. **Topic folders, loaded on demand.** *Done.*
2. **Everything about a topic in its folder.** Move each topic's place on the map, connections, challenges,
   explanations, quiz, glossary terms, facts and time-machine line into `topics/<id>/topic.json`; generate
   `TOPICS`, `EDGES` and the rest from the folders. Adding a topic then touches one folder only.
3. **Typed connections and questions** in the data, so the map can show *why* things connect.
4. **Split `base.css`** so each topic carries its own simulation styles.
5. **Languages.** User-facing text moves out of code: `content.<lang>.html` beside `content.html`,
   text fields in `topic.json` as `{ "en": …, "zh-TW": … }`, shell text in `src/i18n/<lang>.json`, and
   the language in the URL. Simulations keep numbers and logic; only words are translated.
