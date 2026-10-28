# Workflow

How we work on Open Silicon Lab.

## Discuss, then build

1. **Discuss in Claude.** Ideas, feedback and decisions start in conversation: what to add, what feels wrong, what to cut.
2. **Build in Claude Code on the web** with this repository attached. Each piece of work happens on its own branch.
3. **Open a pull request.** CI runs the engine tests, the graph-integrity tests, the browser smoke test (desktop and mobile) and the single-file build. The PR description says what changed and why.
4. **Review the preview.** Check the change in the deployed preview or the single-file build artifact attached to the CI run.
5. **Merge to `main`.** GitHub Pages deploys automatically.

Small, focused PRs are easier to review than big ones: one topic, one simulation or one fix at a time.

## Monthly fact check

Once a month, a scheduled task checks every entry in `src/data/facts.json` against current sources, then opens a pull request with any updated values, sources and dates, plus a summary of what changed and why. A person reviews and merges it.

## Conventions

- **Nothing is locked.** Threads and stars guide; they never gate content.
- **Simulate before explaining.** New material should be something to play with, a puzzle or a build, with only the text needed to use it.
- **Every number has a source and a date.** Industry figures go in `facts.json`, not hard-coded in prose.
- **Say what a model simplifies.** Each simulation ends with a short note on its assumptions.
- **Keep it connected.** A new topic needs at least one labelled edge in `topics.js`; tests fail otherwise.
- **Accessible and responsive.** Works with keyboard, in light and dark mode, and at phone width without sideways scrolling.
