# Idea bank

Strong ideas for where Open Silicon Lab could go, kept public so anyone can build on them. Each starts
from a **first principle**: something true about the world that does not depend on today's products,
so the idea stays sound while the technology changes.

The bank is curated: ideas that were built, merged into a bigger one, or too ordinary to set the lab
apart are removed (the last section says where each went). When an idea is picked, it moves to
[ROADMAP.md](ROADMAP.md), or to [JOURNEY.md](JOURNEY.md) if it belongs on the Build your own chip road.

**To add one:** a short title, the first principle, what a learner would do, what it builds on, open
questions, and the date. Ask of every idea: does it let people *do* something they could not do
anywhere else, and does it help them think better about where chips are going?

## Picked

| Idea | Status |
| --- | --- |
| The physics floor | Built: `#floor` and your chip's distance from physics in the passport (November 2026). Next: the same yardstick on other topics. |
| The community chip | Groundwork built (`#community`, November 2026). Next: a maintainer decision on submitting it. |
| Evolve a circuit | Built (`#evolve`, November 2026): blind evolution against the human design, opened in the studio. Next: evolve under a transistor or timing budget, and against an AI agent's design. |
| From need to chip | Later, on top of open engines (idea 8). |

## The ideas

### 1. Evolve a circuit
- **First principle:** design is search through a huge space of possible circuits.
- **What a learner does:** sets a goal and lets evolution, or an AI search, find a circuit; compares evolved, human and AI-agent designs on size, speed and how understandable they are. Evolved circuits have exploited physical quirks no engineer would use.
- **Why it matters:** AI is starting to design chips; this lets people feel what machine-found designs are like, and why "works but nobody knows why" is a real risk.
- **Builds on:** the tiny-chip engine (parse, synthesize, verify), the `agent` topic.
- **Open questions:** a search small enough to run in a browser. *(Added 2 Nov 2026.)*

### 2. Invent a transistor
- **First principle:** a transistor is a material whose conductivity a voltage can switch.
- **What a learner does:** chooses material properties (energy gap, how fast charges move, layer thickness) and sees what switch results: leaky, slow or excellent; then tries research families such as atom-thin 2D materials, oxide semiconductors and ferroelectrics.
- **Why it matters:** explains from the bottom why silicon has been so hard to replace, and what a replacement must beat.
- **Builds on:** `physics`, `transistor`, the zoom's transistor level, the physics floor.
- **Open questions:** a simple but honest device model; sourced material values. *(2 Nov 2026.)*

### 3. Invent the next machine
- **First principle:** an idea wins when it fits the hardware of its time (the "hardware lottery": neural networks waited decades for GPUs), and moving data costs more than computing.
- **What a learner does:** puts together a machine that does not exist yet (where it computes, how it represents numbers, where data lives, what it is built from) and an AI model to run on it, changing both together; runs real kinds of work through it and sees where it breaks. Every future-device number is an assumption you can change, labelled proven, shown in a lab, or a guess; software and ecosystem count beside energy and speed.
- **Why it matters:** simulation is how real architecture research starts; this is where learners can try ideas that could change the field.
- **Builds on:** `src/engines/paradigms.js`, `src/engines/floor.js`, `accelerators`, `cim`, `spatial`; the end of the road.
- **Open questions:** how to stop the sandbox from rewarding wishful device numbers; a debate on whether hardware decides which AI ideas win. *(Merged from "architecture sandbox", Nov 2026, and "the hardware lottery", 2 Nov 2026.)*

### 4. Build up, not out
- **First principle:** wire length sets speed and energy; stacking shortens wires but traps heat; splitting a die beats defects but costs links between the pieces.
- **What a learner does:** stacks layers of logic and memory until heat in the middle becomes the wall; splits a big die into chiplets to beat yield, then pays for the links; tries cooling between layers.
- **Why it matters:** this is where much of the industry's progress now comes from, as shrinking slows.
- **Builds on:** `package`, `yield`, `layout`, `xray`, the zoom, the physics floor's heat and wire limits.
- **Open questions:** a heat model simple enough for the browser that still shows the real trade-off. *(2 Nov 2026, with the chiplet puzzle.)*

### 5. Time, both ways
- **First principle:** technology follows paths, small choices lock in, and nobody can see the future, so the honest way to think about it is to bet and check.
- **What a learner does:** *the past:* replays history with one change (what if transistors had stopped getting more efficient as they shrank in 1995? what if EUV had failed? what if RISC-V had existed in 1985?) and separates what was inevitable from what was luck. *The future:* makes dated forecasts that the monthly fact check later scores.
- **Why it matters:** trains the core thinking skill the lab aims for, judging the future, with feedback from reality.
- **Builds on:** What if? (`src/engines/ripple.js`), the time machine, the debates hub, the monthly fact check.
- **Open questions:** every counterfactual shows its assumptions, like a debate; how to score forecasts fairly and keep them private by default. *(Merged from "rewrite history", 2 Nov 2026, and "forecasts that get scored", roadmap.)*

### 6. Big questions beyond the technology
- **First principle:** what gets built is decided by money, countries, people and the planet as much as by physics.
- **What a learner does:** for each question, plays it out from several viewpoints, sometimes in a role (founder, fab manager, policymaker), with a 2026–2040 horizon and AI as the force of change. Open questions: Why can't the world just make more chips when it needs them? Who decides which chips get made? Why isn't better technology enough to win? If AI helps design chips, who builds the next ones? **Can the planet afford the chips we want?** (follow one chip from mine to fab, use and scrap, and see which stage dominates for a phone chip and for an AI accelerator).
- **Builds on:** `reality` and `floor` (the first two big questions), `supply`, `economics`, `datacenter`, the debates hub.
- **Open questions:** sources for life-cycle energy, water and carbon, all dated in `facts.json`. *(Roadmap, with "the planet ledger" and "story campaigns with roles" merged in.)*

### 7. Ask the lab
- **First principle:** the best explanation is an experiment you can run.
- **What a learner does:** asks a question in plain words; the tutor answers by setting up the site's own simulations with the right settings, asks for a prediction, then runs them. It can only use the site's tested engines, so it cannot invent physics.
- **Why it matters:** an AI-native way to learn, with the lab's honesty rules built in.
- **Builds on:** the tutor (`src/app/ask.js`), every engine; shares its foundation with idea 8.
- **Open questions:** how each lab exposes its settings safely; how to show what the AI changed. *(Merged from "an AI that operates the lab", roadmap, and "ask the lab", 2 Nov 2026.)*

### 8. Open engines: a public MCP server
- **First principle:** a tested model is worth more when anyone can use it.
- **What it is:** the site's engines (tiny-chip synthesis and verification, timing, yield, cost, energy floors, the passport) offered as tools any AI assistant can call. Its first use: **from need to chip**, where someone starts from a mission (a hearing aid, a ten-year wildfire sensor, a Mars rover, a cheap medical test) and designs backwards, each constraint pushing toward a kind of chip, a process and a package.
- **Why it matters:** takes the lab beyond its own pages, and shows every kind of chip, not only AI.
- **Builds on:** every engine in `src/engines/` (already pure and tested, so they can run outside the browser).
- **Open questions:** where it runs and who maintains it; keeping answers within what the engines can honestly say. *(2 Nov 2026.)*

### 9. A map you zoom through
- **First principle:** people understand a system best by moving between its scales, from the whole to the parts.
- **What a learner does:** arrives and can zoom at once: from the globe, to a data center, a board, a chip and its blocks, down to atoms, each level opening its labs. On a first visit the zoom runs on a sample chip with a 60-second puzzle that makes it yours.
- **Why it matters:** the home map's crossing lines felt too complicated and the cards flat; a zoom shows connections by place, and it is the best front door the site could have.
- **Builds on:** the map's rack-to-atom zoom, Zoom into your chip, map lenses, the three doors.
- **Open questions:** how the 40-plus topics (and growing) find their place on a zoom path; keep the map lenses for typed links. *(Merged from "a clearer map", "zoom as the main way to get around" and "a better front door", Oct–Nov 2026.)*

## Removed, and where each went

- **Built:** the physics floor (first part), the first big question, a gentler first visit, flip-flops in the studio, the Counter.
- **Moved to the road ([JOURNEY.md](JOURNEY.md)):** switch to gate; the last mile to Tiny Tapeout; push your own clock; open a flip-flop in the zoom; the bench stepping a clock.
- **Moved to the roadmap ([ROADMAP.md](ROADMAP.md)):** learners become contributors; the hardware steps; the community chip (also called community shuttles); language-ready stages 2 and 3; a review routine for links and debates; a quality pass with real learners.
- **Now a rule for every lab, not an idea:** predict, then reveal; game feel (puzzles and real challenges, never a textbook). Both are in the contributors' checklist on the roadmap.
- **Merged into a bigger idea:** the hardware lottery (3), chiplets (4), rewrite history and scored forecasts (5), the planet ledger and role-play campaigns (6), an AI that operates the lab (7), from need to chip (8), the clearer map, zoom navigation and the front door (9).
- **Dropped as too ordinary to set the lab apart:** a skills portfolio, classroom mode, a timeline of your own design's history, a metastability mini-game. Any of them can come back if a contributor makes it special.
