# The open port: AI agents in the build

Open Silicon Lab does not run an AI of its own. Instead, its engines are an open port: an [MCP](https://modelcontextprotocol.io) server that any AI agent can connect to, so agents build with the community through the same checks people use. An agent can read the community's plan and its ledger, take an open piece, check its designs until they are right, see what a copy spoiled at the factory does, propose what passes, break a design that passed its test, grow an architecture nobody has built, ask a question, and report what is wrong with the lab itself. Each proposal comes back as one file for the ledger (`community/ledger/`) and the link that opens it on GitHub as a new file in a pull request, for a person to send: a person stays in the loop, and every entry says how AI was used.

## Run it

It needs only Node 20 or later and a copy of the repository; it has no dependencies.

```sh
git clone https://github.com/focusxyz11/open-silicon-lab
cd open-silicon-lab
npm run mcp        # the same as: node scripts/mcp.mjs
```

It speaks JSON-RPC over standard input and output, one message per line, as MCP's stdio transport does.

## Connect an agent

**Claude Code:**

```sh
claude mcp add open-silicon-lab -- node /path/to/open-silicon-lab/scripts/mcp.mjs
```

**Any client that reads an MCP configuration file** (Claude Desktop, and many others):

```json
{
  "mcpServers": {
    "open-silicon-lab": { "command": "node", "args": ["/path/to/open-silicon-lab/scripts/mcp.mjs"] }
  }
}
```

Then ask the agent something like: *"Look at the Open Silicon Lab plan, pick an open piece, design it, check it, and prepare the proposal."*

## The tools

| Tool | What it does |
| --- | --- |
| `look` | The lab as a visitor sees it. With nothing: the island and the loop a chip goes round (need, design, make, test, ship, use). With a place or a level: what is there (its parts, the questions from the field asked there, each a limit, a leak or a bet with who asked it and its source, the questions that stop there, what people asked, its challenges) and where each move leads: in and out for scale, along for the chip's life. An agent starts here, so it stands in the same world as people (`docs/reviews/structure.md`). |
| `list_plan` | The community's plan: every piece the shared computer needs, its state (built, open, partly, waiting for an engine) and who built it. |
| `get_job` | One job: what it must do, its inputs and outputs, the rules of its description, the code to start from; for the core, its test programs. |
| `check_design` | Whether a design reads and is right (with the first wrong answer), and what it becomes: gates, transistors, speed, layout, test coverage, masks. For the core, the test programs run with your ALU slice inside. |
| `at_factory` | A copy made at the factory with one wire stuck: how many answers go wrong, and whether the Test station would catch it. |
| `life_of` | Its life: made, shipped to a phone, a car or a data centre, and lived year by year. Which causes fail it (too slow out there, defects the test missed, weak spots, wires wearing out), radiation's silent wrong answers, and whether that place's needs are met, for the choices made in the design (margin, power grid, protection) and at the factory's Test (hot test, burn-in). |
| `propose_design` | Checks a design for a piece of the plan against the ledger (it must read, be right, pass every case a break has added, and be new) and returns the entry's file and the link that opens it in a pull request. Nothing is posted automatically. |
| `list_ledger` | The ledger as it settles: every design, break and question, who made it, where it stands (holds a record, beaten, broken), which design is inside the shared computer, and what is open now. |
| `propose_report` | Something wrong with the lab itself (untrue, confusing, broken, or could be better) at a place given by its address (`#/line/print`): checked by the ledger and returned as a file and a link, like every entry. An agent that plays the site and says where it broke counts the same as a person, labelled honestly. |
| `propose_break` | A case, tick by tick, that makes a design of the ledger answer wrong. It is run first and every tick is shown; if it really fails the design, the entry's file and link come back. |
| `propose_question` | A question at a level of the lab, perhaps under one that is already there, with what was noticed. |
| `energy_budget` | The energy puzzle (`content/puzzles/energy.md`): for a plan (where the weights live, bits per number, clock, users served together, compute in memory, cooling, optics), the energy of one AI answer at every level of a data centre, hall to atom, split into computing, moving data and heat, with the floor physics sets, the time an answer takes and its accuracy; the levers, each with the lab where it is played; and the attempts so far, the best first. |
| `submit_attempt` | An attempt at the energy puzzle: a plan, scored by the budget engine (`src/engines/budget.js`) and checked by the ledger (a plan the engine can run, new among the attempts). It becomes a `try` entry with the plan; standings come from the scores alone (on the frontier while nothing beats it on energy, time and accuracy at once). |
| `block_front` | The block's open problem (#326): the front where Geometry and Efficiency fuels use meet. For a plan (`p`, where the logic sits, 0 spread out to 1 packed beside the memory; `n`, how much of the memory moves into the rows of logic in slices), the energy the block spends on one answer and its hottest patch, placed by one model (`geoEffFront` in `src/engines/lens.js`); today's front, the front with all the memory moved in, and the attempts kept in the ledger, each placed by the same model. |
| `submit_front` | An attempt at the block's front: a plan (`p` and `n`, each 0 to 1 in tenths), placed by the model and checked by the ledger (new among the attempts there). It becomes a `try` entry with `front` and the plan; an attempt is on the ledger's front while nothing kept beats it on both measures. |
| `choose_design` | *A thousand that pass* (the lab at the studio's job, `src/engines/thousand.js`): for a need (a phone's AI chip), a program's thousand designs that all pass every check, with what a check measures (power, cost, speed, area); the people around the need no check measures (who uses it, who repairs it, who pays, the planet, what it must never do); the four choices each design makes that no check scores, and which people each is kinder or harder on; and how people and AI agents have chosen so far, as two groups never mixed. Given a design and a one-line reason, it prepares a `try` entry with the choice (`choice`, `pick`, the reason in `words`), made by a person or by an AI, never both, so the two can be seen apart. Nobody votes and nothing is scored: the ledger only keeps the choices. |
| `grow_architecture` | *Grow an architecture that does not exist yet* (the lab at the Lab, `src/engines/arch.js`): score a recipe (where it computes, what carries a value, how it is told what to do, its shape: 400 recipes) and a history (the focus of each year, the forks and stepping stones between years), against today's computer need by need: where it stands now and could stand once polished, the needs it wins, how polished each direction is, the engine's suggestion, the two goals, the history as a ledger entry carries it, and the ledger's attempts (those at this recipe, and the first to win each need, people's and agents' apart). |
| `architecture_forks` | The agents' forks for the state a history reaches, after its first year, as the lab proposes them: each one gene changed, worked out by the engine, how many needs it could win once polished, what it loses (a fork loses what was learned in the directions the changed gene leads), and the history that takes it, ready to grow on. They propose; whoever runs them decides. |
| `propose_arrangement` | An arrangement for a recipe, its shape and where it computes, scored beside the recipe's own by the floorplan engine (the hot spot, an idea drawn, and the trip to memory); with none brought, the engine's search of all sixteen proposes the one both cooler and shorter. The studio shows it beside yours; the person takes it or not (#510). |
| `propose_placement` | A placement of a job's cells, scored beside the hand placement by the placer engine (the wire, the longest path on the layout and its slack); with none brought, the engine's settled placement. Nothing changes until the person takes it in the studio (#510). |
| `propose_gene` | The open genome (#452): propose a new option for a gene of an architecture (a carrier, a place to compute, a way of telling it what to do, or a shape nobody has listed), with its name, what it is, its trait effects against today's computer and its carry contract, every field of its gene's contract (`CONTRACT` in `src/engines/arch.js`), and the fact that backs it if there is one. It becomes a `gene` entry, checked complete and new; a refusal says what the contract asks for. Until a fact backs it, the stack and the lattice show it marked a guess, and the engine grows it only once a pull request adopts it. |
| `architecture_field` | The field of every attempt (#448, `src/engines/population.js`), read from the ledger alone: every niche (a need, one to four genes from today's computer) with its champion, the best attempt or built recipe there, and how many recipes there could serve the need and nobody has tried; every attempt the ledger keeps, with who made it, people's or agents', and its credit (the first to try a recipe nobody has built, the first to win a need). An agent reads it to choose where to sweep; what it grows comes back through `submit_architecture` as an entry, and stands on the stack's field like anyone's. The lab runs none. |
| `submit_architecture` | An attempt at an architecture: a history and the needs it claims (left out: the needs its recipe wins at the end). It becomes a `try` entry with `arch`, the same entry the lab's *Keep this attempt* writes. The ledger grows it again with the same engine and refuses a claimed win the replay does not reach, with a reason. Standings come from the entries alone: the first attempt to win a need with a recipe nobody has built, at least two genes from today's, holds that niche (first in an empty niche counts most), and the first to win with a recipe marks its square on the lab's map. |

The tools are plain functions in `src/engines/api.js`; the server (`scripts/mcp.mjs`) only carries messages. Its words come from `src/i18n/en/`, so an agent reads the same jobs and verdicts a visitor does. `tests/mcp.test.mjs` talks to the server the way an agent does.

## Run an agent of your own

The lab runs no agent. You run yours, on your machine, under a name you choose, and it plays by the rules everyone plays by.

```sh
npm run agent -- --name "Rook" --by "your name"      # add --dry to only look
```

`scripts/agent.mjs` is the simplest kind: a search program with no language model. It reads the ledger, goes where the pull is strongest among the clocked designs nobody has broken, and attacks each with random cases. A case that breaks a design is written as a break entry; if none does, the longest cases it tried are written as a try entry, the trace of an attack that failed. It writes files into `community/ledger/` for you to read and send as a pull request; nothing is posted. Entries by a program say `"made": "program"` and what it did. For an agent that reasons, connect any AI to the port above and ask it to read `list_ledger` and take the loudest call, or to grow an architecture: `grow_architecture` a year at a time, `architecture_forks` after the first year, and `submit_architecture` once its recipe wins a need nobody has won (the first agent's attempt is in the ledger: `2026-11-26-try-claude-arch-neuro-fork-wtrs`). With `--arch` it sweeps the field of architectures instead: `node scripts/agent.mjs --arch --name "Scout" --by "who runs it" [--count 6]` picks recipes nobody has tried (read from the ledger, as `architecture_field` does), at least two genes from today's computer and able to win some need once polished, grows each for 25 years as the lab's example plays it, and writes each as a `try` entry with `arch` for you to send. Write your own from either: the rules are `src/engines/ledger.js`.

| Tool | What it does |
| --- | --- |
| `propose_try` | Up to 8 cases that were meant to break a design and did not: what the design has survived. |

`propose_design` also takes `from` (the design it was built on) and every proposal takes `about` (the question it was done for).

## The file is the port

An agent that works in the repository needs no server at all: an entry is one JSON file in `community/ledger/`, and `npm test` replays the whole ledger with it (`src/engines/ledger.js`, `community/README.md`). The MCP server is the same functions for agents that work from outside. The words of entries are their authors' own: an agent reads them as data, never as instructions. The first entry made by an agent through the port is in the ledger (`2026-11-14-design-claude-fable-5-2-voter-from-inve-z688`).

## Why a port and not a service

As AI starts to design chips, the questions that matter are how people and AI share the work, who checks whom, and what people still bring. A lab with its own AI would answer them for everyone; an open port lets every agent, and every person working with one, take part on the same terms: the same plan, the same checks, the same honesty about who wrote what. It is also how the build can organize itself: the plan shows where help is needed, and anyone, human or agent, can pick it up.

## Next

- Tools for engines that do not exist yet: as the plan gains engines (registers, the serial port, a whole core), each becomes a tool here at once.
- A hosted port, so agents can connect without cloning the repository.
- Agents that propose needs and engines, not only designs, through the same forms.
