---
name: nightly
description: Runs the night's build of Open Silicon Lab - clears as many open task issues as possible by grouping them, building every group in parallel with helpers, merging the green pull requests one by one, and leaving main green.
---

# The nightly build

Each night clear as many open task issues as possible: group them, build every group in parallel with helpers, merge the green PRs one by one, leave `main` green.

## Phase 0: main is green
If `main`'s latest CI run failed, fix the root cause in a PR of your own first, and merge it when green. Never skip or weaken a check. The failing part of CI names its sections (`browser (<group>)`); rerun those locally with `npm run test:browser -- --only <sections>`.

## Phase 1: the groups
- An issue **waits for** the issue numbers on its `Waits for:` line (or under its `### Waits for` heading, as the Task form writes it). Read them from the issue's body.
- An issue is **ready** when it is open, labelled `task`, not labelled `needs-owner`, has no open PR saying `Closes #<n>`, and every issue it waits for is closed, or is in the same group and comes earlier in it.
- Issues sharing a `group:<name>` label form one group. Give ungrouped issues a group label (same files or view, at most 3 per group). A group is ready when its first issue is; its helper builds the issues in order on one branch, and stops before an issue whose waits are not met.
- Wave 1: at most 5 ready groups, lowest issue numbers first.

## Phase 2: build every group in parallel
Per group, a worktree from `origin/main` and one background helper (Agent tool) with a self-contained brief:
- its worktree, its branch `claude/task-<group>`, its issues, its own server port (8041, 8042, ...);
- the principles of `CLAUDE.md`;
- build every issue as one coherent design; say in the PR what is left, with no `Closes` for it;
- *Before you push* from `CLAUDE.md`: `npm test`, `node --check` on every changed `.js`/`.mjs` file, and `npm run test:browser -- --only <the sections the change touches>` (`npm run test:browser -- --list` shows them: `old`, `explore-desktop`, `explore-phone`, `joins`, `break`, `slow`, `motion`, `seams`, `labs`, `search`, `ways`, `frame`, `flights`); a new smoke check goes in the section of its view, uses only variables of its own block, polls with `waitForFunction` redoing the move, never fixed waits; push only when these pass;
- check every change with Playwright: chromium args `['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']`; localStorage `osl-quality` = `keep`, `osl-theme`, `osl-hints-v1` = `{"seen":{},"off":true}`; wait 10 to 15 s after moves;
- screenshots at 1280 x 820 dark and 390 x 844 light, looked at and fixed;
- do not edit `docs/STATUS.md`;
- screenshots pushed with git to the orphan branch `pr-shots` (folder `task-<group>/`) and shown in the PR;
- the PR: a plain title, what a learner can now do issue by issue, what was checked, what is unsure, one `Closes #<n>` per finished issue;
- wait for CI (the check named `test`), fix up to three times;
- helpers never merge.

## Phase 3: merge one by one
Take the PRs in order of lowest issue number. For each:
1. Merge `origin/main` into the branch, keeping both sides (they meet in `src/i18n/en.json`, `src/v2/app.js`, `src/v2/frame.js`, `src/styles/v2.css`, `scripts/smoke.mjs` and the experiments count; in `smoke.mjs` keep each check in its own section).
2. `npm test`, `node --check` on the changed files, and `npm run test:browser -- --only <the sections it touches>`.
3. Push, wait for CI, squash-merge when `test` is green.
4. After three failed tries, make it a draft with a comment saying what fails, and go on.

## Phase 3b: the second wave
After Phase 3, read the issues again: merging closed some, so others are ready now. Build the newly ready groups as Phase 2 and merge them as Phase 3, at most 3 groups, lowest issue numbers first. No third wave.

## Phase 4: close the night
- One small PR updating `docs/STATUS.md`, merged when green.
- Check `main` is green (else Phase 0).
- Remove the worktrees.

## Never
Push to `main`, close issues by hand, edit `.github/workflows`, delete others' branches, weaken a check, or build or edit an issue labelled `needs-owner` (it waits for the owner's decision or review, not for code), or remove that label.

## Report
`main`'s state at the start; the groups of each wave and their issues; each PR and whether it was merged; what is left and why, naming for each waiting issue what it waits for (an issue, or the owner); what the owner should look at first on the live site.
