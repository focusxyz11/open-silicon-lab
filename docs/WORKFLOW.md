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

Sessions can run side by side when their tasks touch different files. Merge one pull request at a time, then update the other branches. Most work now has files of its own: a lab is its declaration, its lab, its engine, its growers, its stylesheet and its smoke check, each a file named for it ([LABS.md](LABS.md)); a view's styles are its own sheet (`src/styles/<view>.css`, loaded with it by `src/core/styles.js`); a smoke check goes in its section's file (`scripts/smoke/<section>.mjs`). What is still shared, and where sessions meet:

- **Words:** `src/i18n/en/<area>.json`, appended by area (a lab's in `labs.json`, its challenges' names in `core.json`, what it grows in `place.json`), and `AREAS` in `src/core/i18n.js` for a new prefix. Keep both sides' keys.
- **The thirteen:** `src/data/frame.js` (`FILED`, `MARKS`), where everything is filed under the core questions.
- **The labs' list:** `src/data/labs/index.js`, an import and a name at the end of `LABS` for each new lab (a browser cannot list a folder). Keep both lines.
- **The shared sheets:** `src/styles/base.css` (what every screen shares, kept under 60 KB with `blueprint.css`) and `src/styles/frame.css` (the frame), when a change is the frame's or every view's rather than one view's.
- **The shell:** `src/v2/app.js` and `src/v2/game.js` (the loop's own challenges), when the change is to the shell or the loop itself.
- **Rarely:** `src/core/styles.js` (`ORDER`, when a view gets a sheet of its own), and `scripts/smoke.mjs` (`NAMES`, when a section is added; CI's groups in `.github/workflows/ci.yml` name the sections, and only the owner edits them).

## The browser smoke test, in sections

`scripts/smoke.mjs` runs the browser smoke test, made of sections, each a file of its own in `scripts/smoke/` that opens its own pages and leans on no other: its default export runs it and `about` says what it covers (what they share, the browsers, the address and the problems found, is `scripts/smoke/shared.mjs`). The labs section plays the loop's own challenges, then each lab's own check, `scripts/smoke/labs/<lab>.mjs`. `npm run test:browser` runs them all, `npm run test:browser -- --only labs,ways` runs the ones named, and `npm run test:browser -- --list` says what each covers. Every run prints how long each section took. Locally, run the sections your change touches; the whole run is too long for a laptop. CI runs every section, in groups side by side (`.github/workflows/ci.yml`), and the one check a pull request waits for, `test`, is green only when the logic and words tests and every group are green. A group that passes only on its second run leaves a warning: make that check steady.

## The nightly build

Each night open task issues (label `task`) are built in groups, in parallel, and the green pull requests are merged one by one, leaving `main` green. Then a second wave builds what those merges made ready, the same night.

**Dependencies are written, not labelled.** A task that needs another one merged first says so in a line of its own: `Waits for: #299, #302` (the Task form has a field for it). The nightly build reads it and starts the task as soon as every issue named is closed, with no one to unblock it. Tasks that follow each other in the same files go in one group (`group:<name>`), built in order on one branch. The label `priority` puts a task ahead of lower-numbered ones (the owner's highest priority: the next generation of computer architecture). The label `needs-owner` is the only hold: the task waits for the owner's decision or review, and only the owner removes it. Write a task when what it builds on is merged or due that night; later parts stay as a list in their plan. The procedure is the repository skill `.claude/skills/nightly/SKILL.md` (`/nightly` in Claude Code).

## Conventions

- **One world, no lists.** Questions are met where they belong; the core questions are never shown together.
- **Questions, not answers.** A stop gives a question, something true to notice, and what people are trying, never the answer.
- **Every number has a source and a date.** Industry figures go in `src/data/facts.json`.
- **Desktop first where it is richer;** the phone gets a simpler design or less content. No sideways scrolling.
