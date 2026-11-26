# Open Silicon Lab

An open-source lab for chips. Follow one chip through its life, from the thing someone needs to the place it is used, and go down through it from a data centre, a phone or a car to the silicon atoms every chip shares. Open questions run through all of it. The lab gives no answers. It gives you something true to notice, and what people are trying.

**Try it: <https://focusxyz11.github.io/open-silicon-lab/>**

It is for people new to chips who know a little about hardware, and for engineers. Every term is explained the first time it appears. It covers every kind of chip, not only AI chips, and gives extra weight to RISC-V (an open instruction set), open hardware and how AI is changing chip design.

## What you find there

**Fifty years under one finger.** The first page is *Hold*: one transistor, 0 until you press and 1 while you do. Keep holding (or scroll) and it doubles through fifty years of computing, with things to try on the way, until holding stops working. Then the same square is one block of a chip: the four walls, what comes next, how a computer is arranged, a machine of your own. Its last block is the plan of an island; hold on, and you go inside.

**One island, one chip's life.** The lab itself is a chip world: an island whose places sit round the loop every chip goes round.

**Open → Design → Make → Test → Ship → Use**, and what is learned in use opens the next.

The Lab stands at Open, the design studio at Design, the quarry and the factory at Make, then the test house, the port and the data centre. Phones and cars are islands of their own across the sea. The loop is in the bar on every screen: tap a stage to move along a chip's life, and you keep the level you are at wherever it exists (a gate as it is used, as it is made, as it is designed).

**Two moves: in and out, and along.** Every place has an inside, and you fly through it without cuts:

- from a data centre's campus through the building, rack, board and chip, down to the block, the gate, the switch and the atom;
- from a phone on a desk, opened up, onto its board and into its chip;
- along the factory line (clean, deposit, print, etch, implant, wires) and into a machine at work, with a slice through your wafer showing what changed;
- inside a chip, layer by layer: the same stack read from the top down as a dive, or built from the bottom up as the factory makes it.

↑ ↓ go in and out, ← → go along the loop. The address always says where you are, so any view can be shared as a link.

**One card with three faces.** Every place and level has one card:

- **Look:** what you see, and the ways on from here.
- **Do:** challenges you play right there, each checked by an engine (a small model of the real thing). There are 42 of them, from growing a perfect crystal and printing the finest lines to serving a language model and building your own AI chip.
- **Ask:** the questions that live at this level, and what other people have asked here.

**Questions, not answers.** Pick a question and it stays with you as you go deeper or higher, changing form at each level. Two puzzles run through every level: where an AI answer's energy goes (*Follow the joule*, in the data centre), and how a chip can be right when its parts are not.

**Elsewhere:** *What if?* between the islands (`#/whatif`); machines made from shared blocks for one need (`#/machines`); a world made from its document in [`content/`](content/README.md), read from a lens (`#/w/<id>`); and *Your log*, which holds what you met and did, with a jump to anything by name.

## Building it together

The lab is a community building one open goal, people and AI together, and this repository is part of that.

- **The ledger.** Everything the community adds is one small file in [`community/ledger/`](community/README.md): a design for a piece of the shared computer, a break (a case that makes a design answer wrong), a try, a question, a report or a fix. Entries are never edited afterwards. `npm test` replays the whole ledger through the lab's engines, so an entry that fails its check is not merged. Nobody votes and nobody gives points: standings come from the entries alone.
- **Break it.** ⚑ on every screen writes a report at the address where you are: something untrue, confusing, not working, or that could be better. It calls for a fix until a fix entry names it. Feedback is welcome at any time, for any reason.
- **AI through an open port.** The lab runs no AI of its own. `npm run mcp` serves its engines over [MCP](https://modelcontextprotocol.io), so any agent can read the plan and the ledger, check designs, and prepare entries for a person to send ([docs/MCP.md](docs/MCP.md)). `npm run agent` runs a simple agent of your own, a search program with no language model, that tries to break designs. Every entry says who wrote it and how AI was used.

## Run it

No dependencies. Node 20 or later. Serve the folder:

```sh
npm start        # node scripts/serve.mjs 8000
```

Then open <http://localhost:8000/>. Opening `index.html` from disk does not work, because browsers block modules from `file://`.

## Test it

```sh
npm test                                   # logic, the ledger and the words (node:test)
npm run test:browser                       # Playwright smoke test on desktop and phone
npm run test:browser -- --list             # the smoke test's sections
npm run test:browser -- --only labs,ways   # only the sections named
```

For the browser test, install Playwright locally with `npm install --no-save playwright`. The whole run is long; run the sections your change touches, and CI runs them all.

## How it is made

A static site: plain ES modules, one stylesheet, and one folder of words split by area. No framework, and no build step for development.

| Where | What |
| --- | --- |
| `index.html`, `src/main2.js`, `src/v2/` | The chip world: the island, the frame and its card, the 3D views, the labs (`src/v2/labs/`) |
| `src/app/` | The flat drawings the frame borrows: the dive's scenes, the factory line, the design studio |
| `src/engines/` | The engines: pure, tested models that check challenges, designs and the ledger |
| `src/data/atlas.js`, `src/data/places.js` | One home for every thing: each part, question, challenge and story has one place and level |
| `src/i18n/en/` | Every word on screen, one file per area (code never holds visible English) |
| `src/data/facts.json` | Industry figures, each with its source and the date it was checked |
| `content/` | The lab written from first principles, one document per open question |
| `community/ledger/` | The community's entries |
| `scripts/` | The local server, the browser smoke test, the MCP server and the agent |

## Learn more

| Read | When you want |
| --- | --- |
| [docs/STATUS.md](docs/STATUS.md) | Where things stand, and the tasks ready to build |
| [docs/SYSTEM.md](docs/SYSTEM.md) | How every view shows content and how you move (read before adding anything) |
| [docs/WORLD.md](docs/WORLD.md) | What the chip world holds and how it hangs together |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Where the lab is heading |
| [docs/README.md](docs/README.md) | Every other document, and what each is for |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to help |

## Earlier versions

Each version that was replaced is kept on a named branch:

- [`claude/before-retire-2026-11`](https://github.com/focusxyz11/open-silicon-lab/tree/claude/before-retire-2026-11): the dive-and-journey site, just before the chip world replaced it (`classic.html` now leads to the chip world).
- [`claude/before-structure-2026-11`](https://github.com/focusxyz11/open-silicon-lab/tree/claude/before-structure-2026-11): the chip world with a menu, a tracker and the Turn.
- [`claude/before-world-2026-11`](https://github.com/focusxyz11/open-silicon-lab/tree/claude/before-world-2026-11): the front page before the chip world.
- [`claude/before-dive-2026-11`](https://github.com/focusxyz11/open-silicon-lab/tree/claude/before-dive-2026-11): the first site, a map of 38 topics with over 90 simulations, a RISC-V lab and a tiny-chip studio.

MIT licensed.
