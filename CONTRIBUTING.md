# Contributing

Thanks for helping. You do not need to be a chip expert: a good question and a source go a long way.

1. Fork and branch from `main`.
2. Run the lab locally with `npm start`, and the tests with `npm test` (and `npm run test:browser` if you have Playwright).
3. Keep changes focused, and explain them in the pull request.

## Ways to help

**Add a question.** A question is a stop in `src/data/weave.js`: a thread, a depth, and the parts of that depth's scene it is about. Its words go in `src/i18n/en.json`: `stop.<thread>.<depth>.q` (the question), `.note` (something true to notice, never the answer) and optionally `.tried` (real directions people are exploring). `npm test` checks the parts exist and the words are there.

**Fix a fact.** Edit `src/data/facts.json`: update `value`, `source`, `url` and `verified`, and move the old value into `previous`.

**Translate.** Copy `src/i18n/en.json` to `src/i18n/<lang>.json` and translate the values, never the names.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code fits together, and [docs/FRAME.md](docs/FRAME.md) for the structure.
