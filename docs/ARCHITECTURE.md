# Architecture

Open Silicon Lab is a static site: plain ES modules, HTML fragments and CSS, with no framework and no build step for development. A single-file build exists only for previews and offline use.

## The shape of the project

```
index.html            app shell: top bar, five views, the import map (osl/ → src/)
topics/<id>/          one folder per topic: content.html, topic.json, labs/*.js, optional style.css
topics/README.md      the topic contract, and how to start a new topic
src/data/             the fixed structure (bands, link kinds, big ideas, threads) and shared data
                      (glossary, facts, timeline, open problems)
src/engines/          pure, tested models with no DOM (RISC-V, tiny chip, reliability, paradigms, …)
src/hw/               the bench: Open Bench Protocol, transports, board adapters, twin testing (docs/HARDWARE.md)
src/app/              the shell: loader, router, map, views, learning layer, facts, tutor
src/generated/        graph.js and catalog.js, generated from topics/ by `npm run catalog` — never edited by hand
src/labs/             the two simulations that live on the map page itself (zoom, time machine)
content/              shell pages: the zoom viewer, glossary, sources
```

Two kinds of code, kept apart on purpose:
- **The core** (`src/`) changes rarely and is shared by everything.
- **Topics** (`topics/`) are where the site grows. A topic can be added or rewritten by someone who has read only `topics/README.md` and that one folder, which keeps each change small for people and for AI assistants alike.

## One graph drives everything

Each topic describes itself in `topics/<id>/topic.json`: its place on the map (`band`, `order`), what
kind it is (`explore` or `build`), its title and summary, its **links** to other topics, the **big
ideas** it shows, its **challenges** and its **learning** content (plain and engineer explanations,
quiz, tutor questions). `npm run catalog` checks every folder and writes `src/generated/graph.js`,
which the site reads at start-up through `src/data/topics.js`:

- `TOPICS` — every topic in map order: id, band, kind, title (`t`) and summary (`s`). The id is also the folder name and the URL hash.
- `LINKS` — every link as `{ from, kind, to, why }`, plus `if` and `then` on `causes` links. `EDGES` is the same list as `[from, to, why, kind]` for drawing.
- `IDEA_USES` — where each big idea shows up, and how (`counter: true` marks where it breaks).
- `CHALLENGES` — every challenge, with its topic.

What spans many topics stays central and changes rarely: `BANDS` (`src/data/bands.js`), the six
link kinds (`src/data/links.js`), the big ideas (`src/data/ideas.js`) and `THREADS`, suggested
routes that never lock anything (`src/data/topics.js`). Glossary terms, knowledge cards and facts each
name the topic they belong to; facts stay in one file so the monthly check can update them together.

### Links mean something

A link reads as a sentence: *the transistor **builds on** From sand to switch: doping and fields make
the switch*. There are six kinds, and each answers one question a learner might ask:

| Kind | Question | Test |
| --- | --- | --- |
| part of | What is it inside, and what is inside it? | It sits inside the other. |
| kind of | What else is like it? | It is one member of a family the other describes. |
| feeds | Where does the work go next? | What this step produces is what the other starts from. |
| causes | If this changes, what happens there? | A change here changes the other, in a direction you can name (`if` / `then`). |
| grew from | Where did it come from? | It historically came out of the other. |
| builds on | What does it rest on? | It uses the ideas or methods of the other. |

Choose the first kind that is true; the order runs from concrete to general. Chains of `part-of`,
`kind-of`, `feeds`, `grew-from` and `builds-on` may not loop; `causes` may, because feedback loops
are real. Topic pages show each kind in its own form: `causes` links become predictions to make before
the answer opens, the others are grouped under their question (`src/app/connections.js`).

The map starts quiet: only the hovered or selected topic's links are drawn. The **Show** bar picks one
lens at a time (`src/app/maplens.js`): one kind of link in its own colour, with arrows that read as its
sentence and its longest chain in bold (stepping stones for *rests on*, dominoes for *cause and
effect*), or **Big ideas**, which traces one idea through every layer that shows it.

### Big ideas echo across layers

A big idea (*Keep data close*, *Copies catch mistakes*, *Pay once, copy cheaply*, …) must show up in at
least two bands, otherwise it is a detail of one topic. A topic page shows each of its ideas as a ladder
through the stack, with the topic marked; the Knowledge view lists them all. Counter-examples are
first-class: a use marked `counter` shows where the idea stops working.

### Trade-offs, measures and debates

Three more hubs sit beside big ideas, each answering one question:

| Hub | Question | Defined in | Used from | Shown as |
| --- | --- | --- | --- | --- |
| trade-off | What do you give up? | `src/data/tradeoffs.js` | topic.json `"tradeoffs"` (with an optional `"try"` link to the simulation) | a seesaw between the two ends |
| measure | How do we count it? | `src/data/measures.js` (values only as fact ids) | topic.json `"measures"` | what it counts, which way is better, what it hides, dated values |
| debate | Who disagrees, and why? | `src/data/debates.js` | its views name the topics | a balance of views, each with its assumption; lean one way and see what would change your mind |

Trade-offs and measures must show up in at least two topics. A debate needs two or more views, each
with an assumption and a topic where it can be tested; no view is marked right. Debates replace the
old open problems and appear on the Challenges view and on every topic their views draw on
(`src/app/hubs.js`). Leanings are stored only in the browser and never scored.

The catalog script refuses anything that breaks these rules and says what to fix in plain words;
`tests/graph.test.mjs` checks the vocabulary itself.

**To add a topic:** run `npm run new-topic -- <id> "<Title>" <prefix> <band>` and follow the steps it prints (see `topics/README.md`).

## Boot sequence (`src/main.js`)

1. Load `content/zoom.html` and the facts (or read them from `window.__OSL_CONTENT__` in the single-file build).
2. Render the map shell and start its two simulations (zoom, time machine).
3. Start the learning layer, the tutor (only inside Claude) and the router.

No topic is loaded at start-up. The map, search, Workshop and Challenges read the graph from `src/generated/graph.js` and what each topic holds from `src/generated/catalog.js`. The start-up page needs about 38 files; the smoke test fails if it needs more than 60 or loads any topic early.

## Loading a topic (`src/app/loader.js`)

The first time a topic is opened, `ensureTopic(id)`:
1. fetches `topics/<id>/content.html` and `topic.json` (and `style.css` if the topic has one),
2. adds the section to the page and gives each simulation panel its anchor `lab-<topic>-<n>`,
3. imports the topic's lab modules and calls each `init(section)` in its own `try/catch`, so one broken simulation never stops the rest,
4. adds the learning layer to it from `topic.json` "learn" (explanation levels, quiz, tutor questions), plus glossary pop-ups and the tutor button,
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

`base.css` holds the colour tokens (light and dark), type and the simulation styles shared by more
than one topic (panels, controls, readouts). `app.css` styles the shell, map and views. Everything a
single topic needs lives in `topics/<id>/style.css` and loads with that topic; a test fails if a rule
in `base.css` is used by only one topic, and says where to move it.

## My chip

`src/engines/passport.js` computes a chip passport from one tiny-chip design and process: cells, transistors, area, speed, masks and light, fab time, yield, cost, history and whether it can be made for real, plus a line for each topic. `src/app/mychip.js` follows the design the studio publishes, keeps the passport's stamps (per browser), shows the line on topic pages (`#chipBanner`) and renders the `#mychip` view and its downloadable card.

## New ways to compute

`src/engines/paradigms.js` holds small, tested models of each paradigm: the energy of moving data versus computing, an analog crossbar, leaky integrate-and-fire neurons, a Mach-Zehnder interferometer, a two-qubit state-vector simulator, p-bit sampling, reversible logic and the Landauer limit, and a dataflow energy model. `src/data/paradigms.js` holds the editorial fit matrix and the frontier gallery. Each topic in the `next` band has a lab in `topics/<id>/labs/next-*.js`.

## Design with an AI agent

`src/data/agent-cases.js` holds eight scripted cases, each an agent proposal (a tiny-chip design, RISC-V code, a yield or roofline estimate, a dated claim, a test report) that is either sound or has a realistic flaw, plus pure checks built on the same engines. `tests/agent.test.mjs` proves every flaw is real and every sound proposal works. `topics/agent/labs/agent-partner.js` lets the learner check with those tools before trusting or rejecting; inside Claude it adds a live agent that designs tiny chips.

## What if? The map as a simulator

`src/data/ripple.js` is a small causal model: five levers, about thirty indicators (each sits on one map topic) and rules of the form *from → to, strength, wire label, reason*. `src/engines/ripple.js` sorts the indicators so every input comes first (a loop is an error), then computes each one as the sum of strength × change over its inputs, or the smallest input for `MIN` indicators (AI chips shipped follow whichever of demand or HBM is scarcer). It also returns each indicator's contributions and its distance from a lever, which the map uses for the cause chain and the ripple animation. `src/app/whatif.js` draws the lever panel, the badges and the side panel; `src/app/map.js` switches the mode and draws the causal wires. Directions follow the facts each lever cites; strengths are illustrative, and `tests/ripple.test.mjs` checks the directions against what happened in 2021–2026, that the graph has no loops and that every puzzle has a solution. To add a rule, add one line to `RULES` with a reason a learner can read.

## The bench and real hardware

`src/hw/` is the one place that talks to boards. Boards speak the Open Bench Protocol (`obp.js`), a few text lines over any transport (`transport.js`: Web Serial, or an in-memory loopback); a board with its own commands gets a small adapter (`ttdemo.js`). The virtual board (`virtual.js`) turns a tiny-chip design into a gate-level chip that answers the same protocol through the loopback, so the real code path runs for every visitor. `twin.js` compares a board with the simulation pattern by pattern and diagnoses single stuck-at defects. The core keeps no reader-facing sentences: errors carry codes, and the `bench` topic turns them into words. `boards.js` lists every board with an honest status. How to add a board, the protocol and the steps ahead: [HARDWARE.md](HARDWARE.md).

## The time machine

`src/data/timeline.js` holds dated series (landmark chips, process nodes, transistor shapes, lithography, wafers, design costs, company founding years and Karl Rupp's microprocessor data) and `snapshot(year)`. Each topic's own lines are in its `topic.json` (`"time"`); `topicLine(id, year, then)` fills in values such as `{node}` from the snapshot. `src/app/era.js` keeps the site's year (per tab, today by default), adds the year button to the top bar and the banner to topic pages, and fires `osl:year` when it changes. Labs that know about time listen for that event: the map's time machine, the company explorer and the roadmap.

## Words and languages

Words on screen live in `src/i18n/<lang>.json`, never in code. Code names a text and asks for it with
`t('name', { values })` from `src/core/i18n.js`; texts can hold `{names}`, plural forms
(`{ "one": "{n} chip", "other": "{n} chips" }`), lists, and the tags `<b>`, `<em>`, `<i>`, `<br>` and
`<a href>`. Static page text uses `data-i18n="name"` and `data-i18n-attr="aria-label:name"`. Numbers,
lists and dates go through `fmtNum`, `fmtWords`, `fmtList` and `fmtDate`, which use the browser's
`Intl` for the reader's language; English keeps the site's style (30 Oct 2026, "x86, Arm and RISC-V").
The language comes from `?lang=` or the reader's last choice, and falls back to English text by text.

Only English exists today. To add a language, copy `en.json` to `<lang>.json`, translate the values
(never the names) and add it to `LANGS` in `src/core/i18n.js`. `?lang=qps` shows a pretend language
in which every translatable text appears as `[Ŵóŕđş]`, so anything left in plain English is still
written somewhere a translation cannot reach.

`tests/i18n.test.mjs` fails if the shell's code (`src/app`, `src/labs`, `src/core`, `src/main.js`)
contains visible English, if code names a text `en.json` lacks, if a text is unused, or if a
translation's `{names}` differ from English. `node scripts/i18n-check.mjs <files>` lists any hits.

Done in stages: the shell's interface text (done), then the shared data (bands, link kinds, hubs,
threads) and each topic's `topic.json` text, then the simulations' own text and the content pages.
Instructions sent to Claude by the tutor stay in English and ask it to answer in the reader's language.

## First visits: doors, tips and an optional tour

Nothing opens over the page by itself. The map's hero offers three ways to start (Build, Break, Imagine), each a link straight into a challenge. `src/app/hints.js` shows small tips at the moment a feature becomes useful: select a box when the map first comes into view, the lens bar after a first selection, the explanation level on a first topic page, the year on a second. A tip never blocks anything, only one shows at a time, and using a feature marks its tip as seen even if it never appeared. "Turn tips off" stops them; the footer's "Show tips again" brings them back. The four-step tour (`src/app/guide.js`) opens only when someone asks for it. To add a tip: an entry in `HINTS` (what to point at, and the click that means the visitor found the feature), a text `hint.<id>` in `src/i18n/en.json`, and a moment to `show()` it.

## Progress and state

Everything is per-browser `localStorage`: explanation level, topics visited, quiz answers, RISC-V code and stars, which tips have been seen, solved What if? puzzles. Nothing is sent anywhere. Progress is feedback, never a gate.

## Facts

`src/data/facts.json` holds `facts` (label, value, kind, topic, source, url, verified date, optional previous value) and `changes` (a dated log). Topic pages show their facts; the Knowledge view lists all of them. A monthly check proposes updates as a pull request.

## Where the structure is going

The aim is that the project can keep growing, with new ideas and conflicting ones, while its key
concepts stay the same. These are fixed; everything new fits into one of them:

1. **Layers**: where something lives, from atoms to big questions (`BANDS`).
2. **Topics**: one folder each, opening with a question or challenge, not a definition.
3. **Links**: six kinds, each with a meaning, a question and its own way of being shown.
4. **Shared hubs** that many topics meet at: big ideas, trade-offs (*what do you give up?*),
   measures (*how do we count it?*) and debates (*who disagrees, and why?*).
5. **Time**: history to today, labelled plans and projections to 2040.
6. **Threads**: suggested routes, never gates.

A conflicting idea becomes a debate with the assumptions that separate the views, or a `counter` use
of a big idea, not a contradiction in the text. A new idea is one of: a topic, a link, a hub, a dated
fact or a challenge.

Steps, each a small pull request:

1. **Topic folders, loaded on demand.** *Done.*
2. **Everything about a topic in its folder.** *Done*: its place, links, hubs, challenges, learning
   content and time-machine lines (`"time"`, filled in by `src/data/timevalues.js`). Glossary terms and
   facts stay central on purpose: they are shared, and facts are checked together each month.
3. **Typed connections and hubs.** *Done*: six link kinds, map lenses, and four hubs (big ideas,
   trade-offs, measures, debates).
4. **Split `base.css`.** *Done*: 239 single-topic rules moved into 18 topics' `style.css`; computed
   styles of every topic page were compared before and after, and match.
5. **Languages.** *Started*: the shell's interface text is in `src/i18n/en.json` (see "Words and
   languages"). Still to come: user-facing text in data and topics moves out of code: `content.<lang>.html` beside `content.html`, a
   `topic.<lang>.json` holding only the translated text fields of `topic.json`, shell text in
   `src/i18n/<lang>.json`, and the language in the URL. Simulations keep numbers and logic; only words
   are translated. Text fields in `topic.json` stay plain strings so a translation can replace them.
