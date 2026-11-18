# Workflow

How we work on Open Silicon Lab. One idea moves from talk to a picture to code, and each step has its own place.

1. **Discuss in Claude (chat).** Ideas, feedback and decisions start in conversation, in a Claude project that holds `CLAUDE.md`, [STATUS.md](STATUS.md), [ROADMAP.md](ROADMAP.md) and [IDEAS.md](IDEAS.md) as its knowledge. A discussion ends with a decision, or with a task.
2. **Prototype the look before the code** when the question is how something should look or feel. A quick sketch or a throwaway page in the chat is enough to decide; it is never merged as it is.
3. **Write the task down** as a GitHub issue with the *Task* form: what and why, where it lives, what to build on, and how to know it is done. One task, one branch, one pull request. [STATUS.md](STATUS.md) lists the tasks that are ready.
4. **Build in Claude Code on the web**, with this repository attached, one task per session, on a branch. A short session that starts from the issue and `CLAUDE.md` does better than a long one that has forgotten its start. Labs follow [LABS.md](LABS.md).
5. **Open a pull request** with screenshots on a desktop (1280 px) and a phone (390 px), in dark and light, after the checks in *Before you push* (`CLAUDE.md`). CI runs the tests and the browser smoke test.
6. **Look, then merge to `main`.** GitHub Pages deploys it. Look at the live site; what is wrong becomes an issue (or *Break it*, ⚑ on every screen).
7. **Keep what came before.** A version that is replaced is kept on a named branch first (for example `claude/before-dive-2026-11`).
8. **Update [STATUS.md](STATUS.md)** when a task lands, so the next session starts from where things are.

Sessions can run side by side when their tasks touch different files. Merge one pull request at a time, then update the other branches; they usually meet in `src/i18n/en.json`, `src/v2/game.js`, `src/v2/map3d.js`, `src/styles/v2.css` and the experiments count.

## The browser smoke test, in sections

`scripts/smoke.mjs` is made of sections, each opening its own pages and leaning on no other: `npm run test:browser` runs them all, `npm run test:browser -- --only labs,ways` runs the ones named, and `npm run test:browser -- --list` says what each covers. Every run prints how long each section took. Locally, run the sections your change touches; the whole run is too long for a laptop. CI runs every section, in groups side by side (`.github/workflows/ci.yml`), and the one check a pull request waits for, `test`, is green only when the logic and words tests and every group are green. A group that passes only on its second run leaves a warning: make that check steady.

## The nightly build

Each night open task issues (label `task`) are built in groups, in parallel, and the green pull requests are merged one by one, leaving `main` green. The procedure is the repository skill `.claude/skills/nightly/SKILL.md` (`/nightly` in Claude Code).

## Conventions

- **One world, no lists.** Questions are met where they belong; the core questions are never shown together.
- **Questions, not answers.** A stop gives a question, something true to notice, and what people are trying, never the answer.
- **Every number has a source and a date.** Industry figures go in `src/data/facts.json`.
- **Desktop first where it is richer;** the phone gets a simpler design or less content. No sideways scrolling.
