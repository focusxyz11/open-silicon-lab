# Architecture

Open Silicon Lab is a static site: plain ES modules, HTML fragments and CSS, with no framework and no build step for development. A single-file build exists only for previews and offline use.

## One graph drives everything

`src/data/topics.js` is the single source of truth for structure:

- `BANDS` — the layers of the chip stack, top (world) to bottom (atoms).
- `TOPICS` — each topic's id, band, kind (`explore` or `build`), title and summary. The id is also the file name in `content/sections/` and the URL hash.
- `EDGES` — labelled links `[from, to, why]`. The map draws them as wires; topic pages list them as "Builds on" and "Leads to".
- `THREADS` — suggested routes. They highlight a path on the map and add a step bar to topic pages. They never lock anything.

Challenges (`src/data/challenges.js`), knowledge cards, glossary terms and facts each name the topic they belong to, so every view can link back. `tests/data.test.mjs` fails if any link points at something that does not exist.

**To add a topic:** add it to `TOPICS`, connect it in `EDGES`, create `content/sections/<id>.html` with a `<section id="<id>">`, and (if it has simulations) add lab modules and register them in `src/labs/index.js`.

## Boot sequence (`src/main.js`)

1. Fetch `content/zoom.html` and every `content/sections/*.html` (or read them from `window.__OSL_CONTENT__` in the single-file build).
2. Render the map shell, then append all topic sections, hidden, into `#library`.
3. Give each simulation panel a stable anchor `lab-<topic>-<n>`.
4. Load facts, then call every lab's `init()` inside its own `try/catch`, so one broken simulation never takes down the rest.
5. Start the learning layer, the tutor (only inside Claude) and the router.

All content is in the DOM from the start; the router only shows and hides it. This keeps the simulations simple — they look up their elements once at `init()` and redraw on resize.

## Router (`src/app/router.js`)

| Hash | Shows |
| --- | --- |
| `#map` or empty | the chip stack map |
| `#workshop`, `#challenges`, `#knowledge` | the three index views |
| `#<topic>` | one topic, with breadcrumb, thread bar, rail of simulations and connections, facts and next steps |
| `#lab-<topic>-<n>` or any element id | its topic, scrolled to that element |
| `#riscv-<n>`, `#riscv-sandbox` | the RISC-V lab at that level |
| `#glossary`, `#sources` | reference pages |

## Simulations

- `src/engines/` hold pure logic with no DOM, so they are unit-tested in Node: the RV32I/M + custom-0 assembler and simulator, and the tiny-chip flow (parser, synthesis, standard-cell mapping, simulated-annealing placement, maze routing, stuck-at fault coverage).
- `src/engines/alu.js` turns a one-bit ALU slice from the tiny-chip studio into a 32-bit ripple-carry ALU. The RISC-V simulator accepts it through `RV.machine(prog, init, { alu })`, and then every add, subtract, logic operation, comparison, branch decision and memory address goes through those gates. `src/app/alu-link.js` carries the slice from the studio to the RISC-V lab on the same page.
- `src/engines/export.js` writes a tiny-chip design as Verilog in the Tiny Tapeout top-level interface, plus info.yaml, a cocotb test, the template testbench and a gate-level netlist, and zips them. `scripts/verilog-check.mjs` runs every built-in project's export through Icarus Verilog and Yosys in CI.
- `src/labs/` hold one module per simulation. Most draw on a `<canvas>` with the helpers in `src/core/ui.js` (`fit`, `watch`, theme tokens `T`).

## Styling

`base.css` defines the colour tokens (light and dark), type and every simulation's styles. `app.css` styles the shell, map and views. `riscv.css` is scoped under `#riscv`.

## The time machine

`src/data/timeline.js` holds dated series (landmark chips, process nodes, transistor shapes, lithography, wafers, design costs, company founding years and Karl Rupp's microprocessor data) and `snapshot(year)` / `topicLine(id, year)`. `src/app/era.js` keeps the site's year (per tab, today by default), adds the year button to the top bar and the banner to topic pages, and fires `osl:year` when it changes. Labs that know about time listen for that event: the map's time machine, the company explorer and the roadmap.

## Progress and state

Everything is per-browser `localStorage`: explanation level, topics visited, quiz answers, RISC-V code and stars. Nothing is sent anywhere. Progress is feedback, never a gate.

## Facts

`src/data/facts.json` holds `facts` (label, value, kind, topic, source, url, verified date, optional previous value) and `changes` (a dated log). Topic pages show their facts; the Knowledge view lists all of them. A monthly check proposes updates as a pull request.
