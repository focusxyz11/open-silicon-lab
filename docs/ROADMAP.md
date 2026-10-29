# Roadmap

Where Open Silicon Lab is heading. Near-term work ships as pull requests. The long-term goals below are kept on purpose and built step by step. Nothing here is a promise or a date.

## What makes the lab unique

The whole chip stack *runs*, and every part is connected. Your gates become a CPU's ALU, the same design exports to real Verilog, the time machine changes every page, and your own chip travels through every layer. Visual and challenge-first is the surface; a connected, tested engine is the core.

## Now

- **My chip.** One chip that is yours, carried through every layer, with a passport of stamps. *Shipped.*
- **The map as a simulator.** Pull a lever, such as an HBM shortage, the electricity price or a delayed node, and watch the effects ripple across connected topics. *Shipped: What if? on the map (`#whatif`).*

## Next

- **Predict, then reveal.** Ask for a prediction before a simulation answers, across all labs.
- **Forecasts that get scored.** Dated bets on the future, resolved by the monthly fact check.
- **An AI that operates the lab.** The tutor sets up simulations to test your idea and explains results from real numbers.
- **Zoom as the main way to get around.** From the globe to atoms, each level opening its labs.

## Long term

### Learners become contributors
Step by step, so quality stays high:
1. Write down how a simulation is built: an engine with tests, a lab module, content and facts (partly in `ARCHITECTURE.md` today).
2. A simulation template and a checklist that CI enforces: tests, phone width, dark mode, a "what it simplifies" note, sourced facts.
3. Good-first-simulation issues: small, well-scoped labs a newcomer can finish.
4. Review guidelines with chip experts, so contributed science is checked.
5. Credits on every lab, and a path from learner to maintainer.

### Plug in real hardware
Step by step, once the software side is solid:
1. Run the exported Tiny Tapeout designs on an FPGA board and compare with the simulator (WebSerial or WebUSB, in Chrome).
2. Talk to a Tiny Tapeout demo board: set its inputs from the lab, read its outputs, and compare them live with your simulated chip.
3. A small RISC-V board running the same programs as the RISC-V lab.
4. Community shuttles: gather learners' designs into one submission and publish what comes back.

### Also on the list
- Story campaigns with roles: founder, fab manager, policymaker.
- A skills portfolio built from evidence instead of stars.
- Classroom mode and translations, with offline use.
