# Contributing

Thanks for helping. You do not need to be a chip expert: a good question and a source go a long way.

1. Fork and branch from `main`.
2. Run the lab locally with `npm start`, and the tests with `npm test` (and `npm run test:browser` if you have Playwright).
3. Keep changes focused, and explain them in the pull request.

## Ways to help

**Add a question.** A question is a stop in `src/data/weave.js`: a thread, a depth, and the parts of that depth's scene it is about. Its words go in `src/i18n/en.json`: `stop.<thread>.<depth>.q` (the question), `.note` (something true to notice, never the answer) and optionally `.tried` (real directions people are exploring). `npm test` checks the parts exist and the words are there.

**Propose a question without code.** On the site, follow any question, open what was asked here, and choose *Ask your own here*. It needs a home (it has one: where you stand), the form of a question, and what you noticed. Or use the question form on GitHub (`question.yml`).

**Back a stop with a figure or a case.** A figure is an entry in `src/data/facts.json` (value, label, source, link, kind, date checked), named for a stop in `FIGURES` in `src/data/weave.js`. Any number in a stop's words needs one. A case is a real event in `CASES`, with its words `case.<id>.*` in `src/i18n/en.json`.

**Build a piece of the community's computer, or break one.** Everything the community adds is an entry of the ledger: one small file in `community/ledger/` (see `community/README.md`). On the site, win an open job at the Lab or break a design in the Makers' village, sign it, and *Add it to the ledger* opens GitHub with the file filled in, as a pull request. Or add the file yourself. `npm test` replays the whole ledger through the lab's engines: a design must read, do its job and pass every case a break has added; a break must make its design answer wrong, and come from someone else. Entries made with AI are welcome: say how it was used. Nothing is voted on.

**Break the lab itself.** ⚑ *Break it*, on every screen, writes a report at the address where you are: something untrue, confusing, not working, or that could be better. It is a ledger entry, and it calls for a fix until someone makes one. Whoever fixes it adds a fix entry naming the report, in the same pull request as the change.

**Add a lab.** A lab is a challenge played in the card of the place and level where it lives, checked by an engine. [docs/LABS.md](docs/LABS.md) says how to build one.

**Propose a need, or bring an engine.** A piece the computer needs goes through the *Propose a piece* form (`need.yml`). A piece no engine can check yet (registers, the decoder, the serial port, the core) waits for one: an engine is a `check(need, design)` in `ENGINES` in `src/engines/build.js`.

**Build with your AI agent.** Connect any agent to the lab's open port (`npm run mcp`, see [docs/MCP.md](docs/MCP.md)): it can read the plan, check designs and prepare a proposal for you to submit. Say how it was used.

**Fix a fact.** Edit `src/data/facts.json`: update `value`, `source`, `url` and `verified`, and move the old value into `previous`.

**Translate.** Copy `src/i18n/en.json` to `src/i18n/<lang>.json` and translate the values, never the names.

Before adding anything, read [docs/SYSTEM.md](docs/SYSTEM.md) (one home for every thing, and how every view shows it). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code fits together, and [docs/STATUS.md](docs/STATUS.md) for the tasks ready to build.
