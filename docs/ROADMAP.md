# Roadmap

Where Open Silicon Lab is heading. This is the one place for what happens next. Near-term work ships as pull requests. The long-term goals below are kept on purpose and built step by step. Nothing here is a promise or a date. Ideas not yet picked are kept in the [idea bank](IDEAS.md).

## What makes the lab unique

The whole chip stack *runs*, and every part is connected. Your gates become a CPU's ALU, the same design exports to real Verilog, the time machine changes every page, and your own chip travels through every layer. Visual and challenge-first is the surface; a connected, tested engine is the core.

## Now: strengthen what exists

New features pause while the structure catches up with the content.

1. **Finish the reorganization.** The new structure has shipped (see Shipped). Done: every topic on a thread, and one source each for real-chip figures and debate text. Left: one page pattern. No simulation is removed.
2. **Test with real people.** Three to five learners, from a child to an engineer, try the depth labs while someone watches where they get stuck. Their findings shape the reorganization and the next conversions.
3. **Convert to depth labs.** One picture at growing depth replaces the Beginner / Engineer switch, topic by topic. Next candidates: the transistor, the tiny chip studio and the RISC-V lab. Guide and progress: [DEPTH.md](DEPTH.md).

## Next

- **A quality pass.** A separate review of every topic: facts, simplification notes, phone layout and dark mode.
- **Submit the community chip.** A maintainer decision: when to send it to a Tiny Tapeout run, and who pays for the tile.
- **The rest of the road:** switch to gate, push your own clock, clocked chips in the zoom and on the bench ([JOURNEY.md](JOURNEY.md)).
- **The physics floor, part two.** The same yardstick on other topics (accelerators, data centers, sensors).
- **The next big question:** can the planet afford the chips we want? (idea bank, idea 6).

Later: **open engines**, a public MCP server whose first use is *from need to chip*. More candidates are in the [idea bank](IDEAS.md).

## Shipped

- **A simpler structure:** 7 layers, one Challenges page, 38 topics, a memory topic, and 32 map stops. Old links and saved progress carry across.
- **Depth labs:** wafer yield, quantum search and a 3D fab you run, each at See it, Measure it, Model it and Open question.
- **My chip** and **Build your own chip: the road:** one design of yours from gates to files a factory accepts, including **Zoom into your chip** at seven scales.
- **Big questions:** why can a perfect design fail in the real world (`#reality`), and how far are chips from the limits of physics (`#floor`).
- **The map as a simulator:** What if? (`#whatif`), map lenses and the time machine.
- **The community chip** (`#community`) and **Evolve a circuit** (`#evolve`).

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
