---
name: nightly
description: Runs the night's build of Open Silicon Lab - clears as many open task issues as possible by grouping them, building every group in parallel with helpers, merging the green pull requests one by one, and leaving main green.
---

# The nightly build

Each night clear as many open task issues as possible: group them, build every group in parallel with helpers, merge the green PRs one by one, leave `main` green.

## Working here
- GitHub goes through the GitHub MCP tools (`mcp__github__*`, loaded with ToolSearch): the `gh` CLI is not authenticated in the cloud session. `git push` over https works. Helpers use the same tools.
- A shell command in the foreground stops after 10 minutes. Run anything longer (several smoke sections, the whole smoke test) in the background with its output in a log, and poll the log.
- If a PR's check runs come back empty, read the workflow runs for its branch instead (`actions_list`, `list_workflow_runs` filtered by branch) and match the run's `head_sha` to the PR's head.

## Phase 0: main is green
If `main`'s latest CI run failed, fix the root cause in a PR of your own first, and merge it when green. Never skip or weaken a check. The failing part of CI names its sections (`browser (<group>)`); rerun those locally with `npm run test:browser -- --only <sections>`.

## Phase 1: the groups
- An issue **waits for** the issue numbers on its `Waits for:` line (or under its `### Waits for` heading, as the Task form writes it). Read them from the issue's body.
- An issue is **ready** when it is open, labelled `task`, not labelled `needs-owner`, has no open PR saying `Closes #<n>`, and every issue it waits for is closed, or is in the same group and comes earlier in it.
- Issues sharing a `group:<name>` label form one group. Give ungrouped issues a group label (same files or view, at most 3 per group). A group is ready when its first issue is; its helper builds the issues in order on one branch, and stops before an issue whose waits are not met.
- Wave 1: at most 5 ready groups: groups holding an issue labelled `priority` first, then lowest issue numbers first.

## Phase 2: build every group in parallel
Per group, a worktree from `origin/main` and one background helper (Agent tool) with a self-contained brief:
- its worktree, its branch `claude/task-<group>`, its issues, its own server port (8041, 8042, ...), and its own folder for scratch files (`<scratchpad>/<group>/`: helpers share the scratchpad, and a shared name gets overwritten);
- the principles of `CLAUDE.md`;
- build every issue as one coherent design; say in the PR what is left, with no `Closes` for it;
- *Before you push* from `CLAUDE.md`: `npm test`, `node --check` on every changed `.js`/`.mjs` file, and `npm run test:browser -- --only <the sections the change touches>` (`npm run test:browser -- --list` shows them: `old`, `home`, `stations`, `explore-desktop`, `explore-phone`, `joins`, `break`, `slow`, `motion`, `seams`, `labs`, `search`, `ways`, `frame`, `flights`, `machines`); the machine has 2 CPUs, so with five helpers local browser runs are slow: run only your sections, and a local timeout that an untouched `origin/main` shows too is load, with CI the judge; a new smoke check goes in the section of its view, uses only variables of its own block, polls with `waitForFunction` redoing the move, never fixed waits; push only when these pass;
- check every change with Playwright: chromium args `['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']`; localStorage `osl-quality` = `keep`, `osl-theme`, `osl-hints-v1` = `{"seen":{},"off":true}`; wait 10 to 15 s after moves;
- screenshots at 1280 x 820 dark and 390 x 844 light, looked at and fixed;
- do not edit `docs/STATUS.md`;
- screenshots pushed with git to the orphan branch `pr-shots` (folder `task-<group>/`) and shown in the PR;
- the PR: a plain title, what a learner can now do issue by issue, what was checked, what is unsure, one `Closes #<n>` per finished issue;
- open the PR ready for review, not as a draft (CI does not test drafts; mark a draft ready to start it), then wait for CI (the check named `test`), fix up to three times;
- helpers never merge.

## Phase 3: merge one by one
Take the PRs in order of lowest issue number. For each:
1. Merge `origin/main` into the branch, keeping both sides. A lab, a view's styles and a smoke check are files of their own now (`docs/LABS.md`, `docs/WORKFLOW.md`), so branches meet only in the shared files: the words (`src/i18n/en/<area>.json`, and `AREAS` in `src/core/i18n.js`), `src/data/frame.js` (`FILED`, `MARKS`), the labs' list `src/data/labs/index.js` (an import and a name per lab: keep both), the shared sheets `src/styles/base.css` and `src/styles/frame.css`, and the shell (`src/v2/app.js`, `src/v2/game.js`); rarely `src/core/styles.js` (`ORDER`) and `scripts/smoke.mjs` (`NAMES`, a new section). Keep each smoke check in its section's file (`scripts/smoke/<section>.mjs`, a lab's in `scripts/smoke/labs/<lab>.mjs`).
   Resolve a conflict hunk by hunk. Never take one side of a whole file (`git checkout --ours` or `--theirs`): that drops the other side's changes that merged cleanly too (on 23 November it dropped two labs' smoke checks, put back the same night). After resolving, read `git diff origin/main` on every file that conflicted and see both sides' additions there; and check that two island growths do not stand on the same spot (`src/v2/growers/`).
2. `npm test`, `node --check` on the changed files, and `npm run test:browser -- --only <the sections it touches>`.
3. Push, wait for CI, squash-merge when `test` is green.
4. After three failed tries, make it a draft with a comment saying what fails, and go on.

## Phase 3b: the second wave
After Phase 3, read the issues again: merging closed some, so others are ready now. Build the newly ready groups as Phase 2 and merge them as Phase 3, at most 3 groups, `priority` groups first, then lowest issue numbers first. No third wave.

## Phase 4: close the night
- One small PR updating `docs/STATUS.md`, merged when green.
- Check `main` is green (else Phase 0).
- Remove the worktrees.

## Never
Push to `main`, close issues by hand, edit `.github/workflows`, delete others' branches, weaken a check, or build or edit an issue labelled `needs-owner` (it waits for the owner's decision or review, not for code), or remove that label.

## Report
`main`'s state at the start; the groups of each wave and their issues; each PR and whether it was merged; what is left and why, naming for each waiting issue what it waits for (an issue, or the owner); what the owner should look at first on the live site.
