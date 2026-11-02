# Idea bank

Ideas for where Open Silicon Lab could go, kept so none are lost. Some are ready to build, some
are sparks that may turn into something else, and some wait for the right moment. Nothing here is a
promise or a plan: when an idea is picked, it moves to [ROADMAP.md](ROADMAP.md) (and, for the
Build your own chip road, [JOURNEY.md](JOURNEY.md)).

Every idea starts from a **first principle**: something true about the world that does not depend on
today's products. That keeps the ideas stable while the technology around them changes.

How to add one: a short title, the first principle, what a learner would do, what already exists
that it builds on, and open questions. Write the date you added it.

## Picked next

These three were chosen on 2 November 2026.

1. **The physics floor** (idea 1 below)
2. **The community chip** (idea 8)
3. **From need to chip** (idea 9), probably later, and possibly as a public MCP server (see its notes)

## The ten ideas (brainstorm, 2 November 2026)

### 1. The physics floor: how far are we from the limit?
- **First principle:** computing has hard floors. Erasing a bit costs a minimum energy (Landauer's limit), signals cannot outrun light, and a square centimetre of silicon can only shed so much heat.
- **What a learner does:** picks a task (one word from an AI model, one photo, one sensor reading) and sees, layer by layer, how far today's chips are from each floor, and where the waste is (usually moving data, not computing).
- **Builds on:** the energy-of-data-movement and Landauer models in `src/engines/paradigms.js`, the `reversible` and `beyond` topics, the measures hub.
- **Bigger version:** a small "distance from physics" gauge on every topic page, so the whole site shares one yardstick.
- **Open questions:** which floors to include (thermodynamic, speed of light, heat flux, noise) and how to show distances that span many powers of ten without confusing beginners.

### 2. Evolve a circuit
- **First principle:** design is search through a huge space of possible circuits.
- **What a learner does:** sets a goal and lets evolution, or an AI search, find a circuit; compares evolved, human and AI-agent designs on size, speed and how understandable they are. Famous experiments evolved circuits that exploited physical quirks no engineer would use.
- **Builds on:** the tiny-chip engine (parse, synthesize, verify), the `agent` topic.
- **Open questions:** keep the search small enough to run in a browser; how to show "works but nobody understands why" as a real engineering risk.

### 3. Invent a transistor
- **First principle:** a transistor is a material whose conductivity a voltage can switch.
- **What a learner does:** chooses material properties (energy gap, how fast charges move, layer thickness) and sees what kind of switch results: leaky, slow or excellent. Then tries research families: atom-thin 2D materials, oxide semiconductors, ferroelectrics.
- **Builds on:** `physics` and `transistor` topics; the zoom's transistor level.
- **Open questions:** a simple but honest device model; sourcing the material values in `facts.json`.

### 4. The hardware lottery: AI and chips designed together
- **First principle:** an idea wins when it fits the hardware of its time. Neural networks waited decades for GPUs (the "hardware lottery").
- **What a learner does:** changes an AI model (size, precision, sparsity) and a chip (memory, compute, data paths) together, and finds pairs that only work as a pair.
- **Builds on:** `accelerators`, `build`, `cim`, the planned architecture sandbox (JOURNEY.md).
- **Open questions:** could become a debate in the debates hub (does hardware decide which AI ideas win?).

### 5. Rewrite history
- **First principle:** technology follows paths, and small choices lock in.
- **What a learner does:** replays history with one change. What if transistors had stopped getting more efficient as they shrank in 1995, not around 2005? What if EUV had failed? What if RISC-V had existed in 1985? Then compares what was inevitable with what was luck.
- **Builds on:** the What if? causal engine (`src/engines/ripple.js`) and the time machine (`src/data/timeline.js`).
- **Open questions:** counterfactuals are speculation by nature, so every one needs its assumptions shown, like the debates hub.

### 6. The planet ledger
- **First principle:** every chip has a full life-cycle cost in energy, water, materials and carbon.
- **What a learner does:** follows one chip from mine to fab, to years of use, to scrap, and sees which stage dominates for a phone chip and which for an AI accelerator.
- **Builds on:** `supply`, `fab`, `datacenter`, `economics`; answers the big question "can the planet afford the chips we want?".
- **Open questions:** good public sources for each stage, all dated in `facts.json`.

### 7. Build up, not out: 3D chips
- **First principle:** wire length sets speed and energy; stacking shortens wires but traps heat.
- **What a learner does:** stacks layers of logic and memory, watches wires shorten and energy drop, until heat in the middle becomes the wall; then tries thinner layers, cooling between layers, and chiplets.
- **Builds on:** `package`, `layout`, `xray`, the zoom.
- **Open questions:** a heat model simple enough for the browser that still shows the real trade-off.

### 8. The community chip
- **First principle:** shared masks make chips cheap, and shared work makes them possible.
- **What a learner does:** designs a tile that passes verification and can join one real Tiny Tapeout chip made by the site's learners; watches the chip fill up, go to the factory and come back; tests the returned chips on the bench.
- **Builds on:** the Build your own chip road, the clocked Verilog export, the bench, the roadmap's "community shuttles" step.
- **Open questions:** who submits and pays; review before submission; credit for every contributor; timing against Tiny Tapeout's run deadlines. Needs people, not only code.

### 9. From need to chip
- **First principle:** every chip begins as a human need under constraints.
- **What a learner does:** starts from a mission (a hearing aid, a wildfire sensor that lasts ten years, a Mars rover, a cheap medical test) and designs backwards: battery, radiation, cost, size and heat each push toward a kind of chip, a process and a package.
- **Builds on:** almost every topic; shows that the site covers every kind of chip, not only AI.
- **Notes (2 November 2026):** this may work best as a **public MCP server**: the site's tested engines (tiny-chip synthesis and verification, timing, yield, cost, the passport) offered as tools any AI assistant can call, so anyone can explore "from need to chip" in conversation, backed by the same models as the site. Planned for later.
- **Open questions:** where the server runs and who maintains it; how to keep its answers within what the engines can honestly say.

### 10. Ask the lab
- **First principle:** the best explanation is an experiment you can run.
- **What a learner does:** asks a question in plain words; the AI tutor answers by setting up the site's own simulations with the right settings, asks for a prediction, then runs them. It can only use the site's tested engines, so it cannot invent physics.
- **Builds on:** the tutor (`src/app/ask.js`), the agent topic, every engine. Shares its foundation with the MCP server idea in 9.
- **Open questions:** how a lab exposes its settings safely; how to show the learner what the AI changed.

## Earlier ideas still open

From conversations in October and November 2026.

- **A better front door.** The zoom running for every visitor with a sample chip; a 60-second first puzzle on the home page that drops you into the studio with that design as your chip; the road visible on the map.
- **Push your own clock.** Send a studio design through the gate-level simulator (`src/engines/seq.js`) so you can raise its clock until it breaks and watch a glitch move through your own gates.
- **The bench steps a clock,** so it can twin-test clocked chips such as the Counter.
- **Open a flip-flop in the zoom,** showing its two latches.
- **Switch to gate.** A small lab at the start of the road: wire transistors as switches into NOT and NAND.
- **The last mile.** A plain walkthrough from the exported files to a submitted Tiny Tapeout project, and what comes back.
- **Architecture sandbox.** Invent a machine that does not exist yet; every future-device number an assumption you can change; software and ecosystem count beside energy and speed (details in JOURNEY.md).
- **A quality pass and real learners.** A separate review of every topic (facts, simplification notes, phone layout, dark mode), then three to five beginners trying the site while someone watches where they get stuck.

## Sparks

Smaller thoughts that may grow into ideas:

- A "distance from physics" number in the chip passport.
- Counterfactual pairs inside What if? (the same lever in 2005 and in 2026).
- Metastability as a game: how often does a flip-flop fail if inputs arrive at random?
- Chiplets as a puzzle: split a big die to beat yield, then pay for the links between pieces.
- A learner's own design history as a timeline, like the time machine but for their chip.
