# Contributing

Thanks for helping. Corrections, new simulations and new challenges are all welcome.

1. Fork and branch from `main`.
2. Run the lab locally with `npm start`, and the tests with `npm test` (and `npm run test:browser` if you have Playwright).
3. Keep changes focused, and explain them in the pull request.

**Fixing a fact?** Edit `src/data/facts.json`: update `value`, `source`, `url` and `verified`, and move the old value into `previous`. Link the source in the PR.

**Adding a topic or simulation?** Read [topics/README.md](topics/README.md). Each topic is one folder; `npm run new-topic -- <id> "<Title>" <prefix> <band>` starts one with a working example and prints the remaining steps. Every topic needs at least one labelled connection in `src/data/topics.js`. Using an AI assistant is welcome: point it at `topics/README.md` and one topic folder, and let `npm test` check its work.

**Style.** Plain words over jargon; explain any term the first time; every simulation states what it simplifies. See [docs/WORKFLOW.md](docs/WORKFLOW.md).

By contributing you agree that your work is released under the MIT License.
