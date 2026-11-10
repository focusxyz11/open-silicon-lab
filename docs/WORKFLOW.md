# Workflow

How we work on Open Silicon Lab.

1. **Discuss in Claude.** Ideas, feedback and decisions start in conversation.
2. **Build in Claude Code on the web** with this repository attached, on a branch.
3. **Open a pull request.** CI runs the tests, the browser smoke test (desktop and phone) and the single-file build.
4. **Merge to `main`.** GitHub Pages deploys automatically.
5. **Keep what came before.** A version that is replaced is kept on a named branch (for example `claude/before-dive-2026-11`), so it can be studied later.

## Conventions

- **One world, no lists.** Questions are met where they belong in the dive; the core questions are never shown together.
- **Questions, not answers.** A stop gives a question, something true to notice, and what people are trying, never the answer.
- **Every number has a source and a date.** Industry figures go in `src/data/facts.json`.
- **Check at phone width and in both themes.** No sideways scrolling.
