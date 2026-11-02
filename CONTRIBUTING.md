# Contributing

Thanks for helping. Corrections, designs, simulations, challenges and ideas are all welcome. You do
not need to be a chip expert: plain words and a source go a long way.

1. Fork and branch from `main`.
2. Run the lab locally with `npm start`, and the tests with `npm test` (and `npm run test:browser` if you have Playwright).
3. Keep changes focused, and explain them in the pull request.

## Ways to help

**Add your design to the community chip.** The easiest first contribution. Design something in the
tiny-chip studio, open *The community chip* on the site and press *Prepare my submission*: GitHub
opens with `community/<name>/design.json` already written. By hand, see [community/README.md](community/README.md).
`npm run catalog` checks every design and explains any problem in plain words.

**Fix a fact.** Edit `src/data/facts.json`: update `value`, `source`, `url` and `verified`, and move
the old value into `previous`. Link the source in the pull request.

**Add a topic or simulation.** Read [topics/README.md](topics/README.md). Each topic is one folder;
`npm run new-topic -- <id> "<Title>" <prefix> <band>` starts one with a working example and prints the
remaining steps. A topic's place, its typed links to other topics, big ideas, challenges and learning
content all live in its `topic.json`; `npm run catalog` checks them. Pure models go in `src/engines/`
with a test.

**Change words in the interface.** They live in `src/i18n/en.json`. Code asks for them by name with
`t('name')`; never write visible English in `src/app`, `src/labs` or `src/core`. Open the site with
`?lang=qps` to see which words still bypass the text file.

**Suggest an idea.** Open an issue with the *Suggest an idea* form, or add it to the
[idea bank](docs/IDEAS.md) with its first principle, what a learner would do and what it builds on.

## Every simulation

- Is something to play with, a puzzle or a build, with only the text needed to use it.
- Asks for a prediction before it answers, where it can.
- Says what it simplifies, in a short note.
- Keeps every industry figure in `facts.json`, with a source and a date.
- Works at phone width (390 px), in light and dark mode, and with a keyboard.
- Locks nothing behind progress.

Using an AI assistant is welcome: point it at `topics/README.md` (or `community/README.md`) and one
folder, and let `npm test` check its work. See [docs/WORKFLOW.md](docs/WORKFLOW.md) for how changes ship.

By contributing you agree that your work is released under the MIT License.
