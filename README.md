# Open Silicon Lab

An open-source lab for chips: one continuous dive from a data centre, a phone or a car down to silicon atoms, and the journey a chip makes from crystal to the world, with open questions running through both.

**Try it: <https://focusxyz11.github.io/open-silicon-lab/>**

Choose where to start (a data centre, a phone or a car), then scroll, drag or use the arrow keys to dive: through the building, rack, board and chip of a data centre, the board and chip of a phone, or the control units and microcontroller of a car, down to the block, gate, switch and atom that every chip shares. Or choose the journey and travel with one wafer along the line a chip is made on: crystal, wafers, then through the factory's loop (clean, deposit, print, etch, implant, wires), test, package, and out into the world. Stop at any machine to watch your wafer go through it in 3D, from the sealed pod through robots and airlocks to the chamber and back, the camera moving in close while the work is done, with a slice through the wafer showing what changed. Tap any part of a picture to see what it does. At every depth, questions sit on the parts they are about. Pick one and it stays with you as you go deeper or higher, taking a new form at each depth. It is not a textbook and it holds no answers: each question comes with something true to notice and what people are trying. At some questions you can try things on your chip (its clock, its switch size, its size, how full its factory runs), and every depth shows what changed.

Or choose Design and build a piece of the community's computer: a small open computer on a shared chip, around a RISC-V core, designed piece by piece by people and AI together. Pick an open piece of the plan, describe it in a few lines (yourself, or with any AI assistant), check it against every pattern, and follow it into gates, a layout on the shared chip, and the masks the factory prints. Then propose it on GitHub: the tests check every design before it joins the plan.

AI agents can take part too, through an open port rather than an AI of the lab's own: `npm run mcp` serves the lab's engines over MCP, so any agent can read the plan, check designs and propose them through the same checks ([docs/MCP.md](docs/MCP.md)).

The earlier version of the site (a map of 38 topics with over 90 simulations, a RISC-V lab and a tiny-chip studio) is kept on the branch [`claude/before-dive-2026-11`](https://github.com/focusxyz11/open-silicon-lab/tree/claude/before-dive-2026-11).

## Run it

No dependencies. Serve the folder:

```sh
npm start        # node scripts/serve.mjs 8000
```

Then open <http://localhost:8000/>. Opening `index.html` from disk does not work, because browsers block modules from `file://`.

## Test it

```sh
npm test                 # the logic and the words
npm run test:browser     # needs Playwright: the dive on desktop and phone
```

## Learn more

- [docs/FRAME.md](docs/FRAME.md): the structure and how the dive works
- [docs/ROADMAP.md](docs/ROADMAP.md): what comes next
- [CONTRIBUTING.md](CONTRIBUTING.md): how to help

MIT licensed.
