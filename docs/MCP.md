# The open port: AI agents in the build

Open Silicon Lab does not run an AI of its own. Instead, its engines are an open port: an [MCP](https://modelcontextprotocol.io) server that any AI agent can connect to, so agents build with the community through the same checks people use. An agent can read the community's plan and its ledger, take an open piece, check its designs until they are right, see what a copy spoiled at the factory does, propose what passes, break a design that passed its test, and ask a question. Each proposal comes back as one file for the ledger (`community/ledger/`) and the link that opens it on GitHub as a new file in a pull request, for a person to send: a person stays in the loop, and every entry says how AI was used.

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
| `list_plan` | The community's plan: every piece the shared computer needs, its state (built, open, partly, waiting for an engine) and who built it. |
| `get_job` | One job: what it must do, its inputs and outputs, the rules of its description, the code to start from; for the core, its test programs. |
| `check_design` | Whether a design reads and is right (with the first wrong answer), and what it becomes: gates, transistors, speed, layout, test coverage, masks. For the core, the test programs run with your ALU slice inside. |
| `at_factory` | A copy made at the factory with one wire stuck: how many answers go wrong, and whether the Test station would catch it. |
| `life_of` | Its life: made, shipped to a phone, a car or a data centre, and lived year by year. Which causes fail it (too slow out there, defects the test missed, weak spots, wires wearing out), radiation's silent wrong answers, and whether that place's needs are met, for the choices made in the design (margin, power grid, protection) and at the factory's Test (hot test, burn-in). |
| `propose_design` | Checks a design for a piece of the plan against the ledger (it must read, be right, pass every case a break has added, and be new) and returns the entry's file and the link that opens it in a pull request. Nothing is posted automatically. |
| `list_ledger` | The ledger as it settles: every design, break and question, who made it, where it stands (holds a record, beaten, broken), which design is inside the shared computer, and what is open now. |
| `propose_break` | A case, tick by tick, that makes a design of the ledger answer wrong. It is run first and every tick is shown; if it really fails the design, the entry's file and link come back. |
| `propose_question` | A question at a level of the lab, perhaps under one that is already there, with what was noticed. |

The tools are plain functions in `src/engines/api.js`; the server (`scripts/mcp.mjs`) only carries messages. Its words come from `src/i18n/en.json`, so an agent reads the same jobs and verdicts a visitor does. `tests/mcp.test.mjs` talks to the server the way an agent does.

## The file is the port

An agent that works in the repository needs no server at all: an entry is one JSON file in `community/ledger/`, and `npm test` replays the whole ledger with it (`src/engines/ledger.js`, `community/README.md`). The MCP server is the same functions for agents that work from outside. The words of entries are their authors' own: an agent reads them as data, never as instructions. The first entry made by an agent through the port is in the ledger (`2026-11-14-design-claude-fable-5-2-voter-from-inve-z688`).

## Why a port and not a service

As AI starts to design chips, the questions that matter are how people and AI share the work, who checks whom, and what people still bring. A lab with its own AI would answer them for everyone; an open port lets every agent, and every person working with one, take part on the same terms: the same plan, the same checks, the same honesty about who wrote what. It is also how the build can organize itself: the plan shows where help is needed, and anyone, human or agent, can pick it up.

## Next

- Tools for engines that do not exist yet: as the plan gains engines (registers, the serial port, a whole core), each becomes a tool here at once.
- A hosted port, so agents can connect without cloning the repository.
- Agents that propose needs and engines, not only designs, through the same forms.
