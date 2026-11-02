# Roadmap

Where Open Silicon Lab is heading. Near-term work ships as pull requests. The long-term goals below are kept on purpose and built step by step. Nothing here is a promise or a date. Ideas not yet picked are kept in the [idea bank](IDEAS.md).

## What makes the lab unique

The whole chip stack *runs*, and every part is connected. Your gates become a CPU's ALU, the same design exports to real Verilog, the time machine changes every page, and your own chip travels through every layer. Visual and challenge-first is the surface; a connected, tested engine is the core.

## Now

Shipped and growing:
- **My chip** and **Build your own chip: the road.** One design of yours from gates to files a factory accepts: logic, memory and the clock, your ALU in a RISC-V core, layout, test, clocked Verilog for Tiny Tapeout, and **Zoom into your chip** at seven scales. Stages and next steps: [JOURNEY.md](JOURNEY.md).
- **Big questions:** why can a perfect design fail in the real world (`#reality`), and how far are chips from the limits of physics (`#floor`).
- **The map as a simulator:** What if? (`#whatif`), map lenses and the time machine.

## Next

- **The community chip.** Groundwork built (`#community`): learners' designs in `community/`, checked automatically and shown on one shared tile behind a selector, a one-click submission from the studio, and the whole chip downloadable for Tiny Tapeout. Still to decide: when to submit it, and who pays for the tile.
- **The physics floor, part two.** The chip passport now shows your chip's distance from physics; next, the same yardstick on other topics (accelerators, data centers, sensors).
- **The rest of the road:** switch to gate, the last mile, push your own clock ([JOURNEY.md](JOURNEY.md)).
- **The next big question:** can the planet afford the chips we want? (idea bank, idea 6).
- **A quality pass and real learners.** A separate review of every topic (facts, simplification notes, phone layout, dark mode), then three to five beginners trying the site while someone watches where they get stuck.

Later: **open engines**, a public MCP server whose first use is *from need to chip*. More candidates are in the [idea bank](IDEAS.md).

## Long term

### Learners become contributors
Step by step, so quality stays high:
1. Write down how a simulation is built: an engine with tests, a lab module, content and facts (partly in `ARCHITECTURE.md` today).
2. A simulation template and a checklist that CI enforces: tests, phone width, dark mode, a "what it simplifies" note, sourced facts, and two rules for every lab: ask for a prediction before the simulation answers, and make it a puzzle or a real challenge, never a page to read.
3. Good-first-simulation issues: small, well-scoped labs a newcomer can finish.
4. Review guidelines with chip experts, so contributed science is checked.
5. Credits on every lab, and a path from learner to maintainer.

### Plug in real hardware
Hardware stays a bonus, never a gate, and the bench stays open to any board. Details and the protocol: [HARDWARE.md](HARDWARE.md).
0. A virtual bench: twin-test a design against its simulation, diagnose defects, and an open protocol any board can speak. *Shipped: `#bench`. The Tiny Tapeout demo board and any Open Bench board can be tried as experiments.*
   Then one open program for ESP32, Pico and other MicroPython boards, installable from the page, to test real chips such as a 74HC00 on a breadboard. *Shipped as an experiment; needs testers with boards.*
1. A $5 RISC-V board (ESP32-C3 or Pico 2) running the same programs as the RISC-V lab.
2. The Tiny Tapeout demo board confirmed on real boards: set inputs from the lab, read outputs, compare live with your simulated chip.
3. Run the exported Tiny Tapeout designs on an FPGA board, with the open toolchain in the browser.
4. Community shuttles: the community chip (see Next).

### Structure that keeps growing
- **Language-ready, stages 2 and 3.** Stage 1 (the interface) is done. Next: shared data and every topic.json text with stable ids; then the simulations' own text and the content pages. No translation is needed soon; the structure should be ready.
- **A review routine for links and debates,** so every typed link stays true for its kind and every debate keeps its balance as topics are added.
- **A map that scales** well past 40 topics (see idea 9 in the idea bank).
