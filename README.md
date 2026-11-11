# Open Silicon Lab

An open-source lab for chips: one continuous dive from a data centre, a phone, a car or a chip factory down to silicon atoms, with open questions running through every depth.

**Try it: <https://focusxyz11.github.io/open-silicon-lab/>**

Choose where to start (a data centre, a phone, a car or a chip factory), then scroll, drag or use the arrow keys to dive: through the building, rack, board and chip of a data centre, the board and chip of a phone, the control units and microcontroller of a car, or the cleanroom, printing machine and wafer of a factory, down to the block, gate, switch and atom that every chip shares. At every depth, questions sit on the parts they are about. Pick one and it stays with you as you go deeper or higher, taking a new form at each depth. It is not a textbook and it holds no answers: each question comes with something true to notice and what people are trying. At some questions you can try things on your chip (its clock, its switch size, its size), and every depth shows what changed.

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
npm run build            # dist/open-silicon-lab.html, one self-contained file
```

## Learn more

- [docs/FRAME.md](docs/FRAME.md): the structure and how the dive works
- [docs/ROADMAP.md](docs/ROADMAP.md): what comes next
- [CONTRIBUTING.md](CONTRIBUTING.md): how to help

MIT licensed.
