# Contributing

Thanks for helping. You do not need to be a chip expert: a good question and a source go a long way.

1. Fork and branch from `main`.
2. Run the lab locally with `npm start`, and the tests with `npm test` (and `npm run test:browser` if you have Playwright).
3. Keep changes focused, and explain them in the pull request.

## Ways to help

**Add a question.** A question is a stop in `src/data/weave.js`: a thread, a depth, and the parts of that depth's scene it is about. Its words go in `src/i18n/en.json`: `stop.<thread>.<depth>.q` (the question), `.note` (something true to notice, never the answer) and optionally `.tried` (real directions people are exploring). `npm test` checks the parts exist and the words are there.

**Propose a question without code.** On the site, *Propose a question* (or *Write the question that belongs here*, in a gap) opens the question form on GitHub with the place filled in.

**Back a stop with a figure or a case.** A figure is an entry in `src/data/facts.json` (value, label, source, link, kind, date checked), named for a stop in `FIGURES` in `src/data/weave.js`. Any number in a stop's words needs one. A case is a real event in `CASES`, with its words `case.<id>.*` in `src/i18n/en.json`.

**Put your design on the shared chip.** Write a small circuit in the design studio (Design, in the top bar), then at Layout choose *Add your design to the shared chip*: it opens an issue with your design written out. Or add it yourself to `src/data/community.js` (title, author, a one-sentence description, and a studio job it does or your own inputs and outputs); `npm test` checks that it reads, does its job and can be built into gates and wires.

**Fix a fact.** Edit `src/data/facts.json`: update `value`, `source`, `url` and `verified`, and move the old value into `previous`.

**Translate.** Copy `src/i18n/en.json` to `src/i18n/<lang>.json` and translate the values, never the names.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code fits together, and [docs/FRAME.md](docs/FRAME.md) for the structure.
