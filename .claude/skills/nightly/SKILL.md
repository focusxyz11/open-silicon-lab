---
name: nightly
description: Runs the night's build of Open Silicon Lab - clears as many open task issues as possible by grouping them, building independent groups in parallel with helpers, merging each wave's green pull requests together on one train, up to four waves, and leaving main green.
---

# The nightly build

Each night clear as many open task issues as possible: group them, build every group in parallel with helpers, merge the green PRs together on one train, read the issues again and build what became ready, up to four waves, and leave `main` green. Groups run side by side only where their work is shown to be independent (Phase 1).

**A dry run** (`/nightly dry run`): do Phase 1 on today's open issues and print what it finds (each group, its issues and the files each will touch; which groups are independent and why; the core group; what is held back and why; the waves it expects, and what is left for another night), with no worktrees, helpers, branches or pushes.

## Working here
- GitHub goes through the GitHub MCP tools (`mcp__github__*`, loaded with ToolSearch): the `gh` CLI is not authenticated in the cloud session. `git push` over https works. Helpers use the same tools.
- A shell command in the foreground stops after 10 minutes. Run anything longer (several smoke sections, the whole smoke test) in the background with its output in a log, and poll the log.
- If a PR's check runs come back empty, read the workflow runs for its branch instead (`actions_list`, `list_workflow_runs` filtered by branch) and match the run's `head_sha` to the PR's head.

## Phase 0: main is green
If `main`'s latest CI run failed, fix the root cause in a PR of your own first, and merge it when green. Never skip or weaken a check. The failing part of CI names its sections (`browser (<group>)`); rerun those locally with `npm run test:browser -- --only <sections>`.

## Phase 1: the groups
- An issue **waits for** the issue numbers on its `Waits for:` line (or under its `### Waits for` heading, as the Task form writes it). Read them from the issue's body.
- An issue is **ready** when it is open, labelled `task`, not labelled `needs-owner`, has no open PR saying `Closes #<n>`, and every issue it waits for is closed, or is in the same group and comes earlier in it.
- An issue that an open PR already builds without closing it (`Refs #<n>`) is not built again; say so in the report.
- **What each issue touches, checked, not guessed.** Before grouping, list the files each ready issue will change: its `Touches:` line (or `### Touches`, as the Task form writes it), else the files and views its *Where it lives* names, else read the code it names. Write what each issue will change, not what it only reads. A view maps to its files through `OWNERS` in `scripts/smoke/owners.mjs`.
- **The shared files** (where branches meet, Phase 3): the words (`src/i18n/en/<area>.json`, `AREAS` in `src/core/i18n.js`), `src/data/frame.js`, the labs' list `src/data/labs/index.js`, `src/styles/base.css`, `src/styles/frame.css`, `src/v2/app.js`, `src/v2/game.js`, `src/core/**`, `scripts/smoke.mjs`.
- **Independent:** two groups are independent when they share no file, except additions to a list: a new lab's import and name, a new smoke section, new words in an area, a new entry in `FILED` or `MARKS`, a new fact in `src/data/facts.json` (no id added by two groups: split a list of facts by id between the groups that need them), a new entry in a registry. Changing a line both use, or a shared file's code (a route in `app.js`, a rule in `base.css`), is not an addition.
- **The core group:** issues that change a shared file beyond such additions go into one group, `core`, built one after another by one helper. An issue that shares a file with an issue of the core group joins it too. At most 3 issues; the others wait for the next wave.
- Issues sharing a `group:<name>` label form one group. Give other issues a group label: issues that share a file go in one group (at most 3, in order); an issue sharing nothing gets a group of its own. A group is ready when its first issue is; its helper builds the issues in order on one branch, and stops before an issue whose waits are not met.
- **If not sure** whether an issue changes a file another group changes, it is not independent: put it in that group, or keep it for the next wave.
- **Wave 1:** up to 8 ready groups when every pair is independent as above (the core group counts as one); if you are not sure of that, at most 5. Groups holding an issue labelled `priority` first, then lowest issue numbers first.

## Phase 2: build every group in parallel
Per group, a worktree from `origin/main` and one background helper (Agent tool) with a self-contained brief:
- **its model by size:** a group whose every issue is labelled `size:small` (or whose *Size* on the Task form says small, then add the label: one view or lab, no shared file, a clear spec) gets a helper on Sonnet (`model: "sonnet"`); every other group, the core group always, gets Opus. The train, resolving conflicts and halving stay with the lead, on Opus;
- the files its issues may change (Phase 1): if the work turns out to need another group's file or a shared file beyond an addition, the helper stops and says so in its PR instead of changing it;
- its worktree, its branch `claude/task-<group>`, its issues, its own server port (8041, 8042, ...), and its own folder for scratch files (`<scratchpad>/<group>/`: helpers share the scratchpad, and a shared name gets overwritten);
- the principles of `CLAUDE.md`;
- build every issue as one coherent design; say in the PR what is left, with no `Closes` for it;
- **test light** before pushing: `npm test`, `node --check` on every changed `.js`/`.mjs` file, and at most the one smoke section of the view it changed (`npm run test:browser -- --only <section>`; `-- --list` shows them; for a lab, `labs`), or none for words and documents. The machine has 2 CPUs shared by up to eight helpers: CI's lane runs the rest, and is the judge. A local timeout that an untouched `origin/main` shows too is load. A new smoke check goes in the section of its view, uses only variables of its own block, polls with `waitForFunction` redoing the move, never fixed waits;
- check every change with Playwright: chromium args `['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']`; localStorage `osl-quality` = `keep`, `osl-theme`, `osl-hints-v1` = `{"seen":{},"off":true}`; wait 10 to 15 s after moves;
- screenshots at 1280 x 820 dark and 390 x 844 light, looked at and fixed;
- do not edit `docs/STATUS.md`;
- screenshots pushed with git to the orphan branch `pr-shots` (folder `task-<group>/`) and shown in the PR;
- the PR: a plain title, what a learner can now do issue by issue, what was checked, what is unsure, one `Closes #<n>` per finished issue;
- open the PR ready for review, not as a draft (CI does not test drafts; mark a draft ready to start it), then wait for CI (the check named `test`, which tests the PR by its lane: only the checks its files need, `docs/WORKFLOW.md`, "CI's lanes"; never add the label `ci:full`), fix up to three times;
- helpers never merge.

## Phase 3: the train
The night's green PRs go into `main` together, tested once with the whole suite, instead of one by one (each merge used to make every other PR re-test from the start, since `main`'s ruleset wants a branch up to date). Each PR has already passed `test` by its lane.
1. Make the train: `git checkout -B claude/train-<date> origin/main` (`<date>` as `2026-11-28`; wave 2's train `claude/train-<date>-2`, wave 3's `-3`, wave 4's `-4`). Merge each green PR's branch into it in order of lowest issue number (`git merge --no-ff origin/claude/task-<group>`). A lab, a view's styles and a smoke check are files of their own now (`docs/LABS.md`, `docs/WORKFLOW.md`), so branches meet only in the shared files: the words (`src/i18n/en/<area>.json`, and `AREAS` in `src/core/i18n.js`), `src/data/frame.js` (`FILED`, `MARKS`), the labs' list `src/data/labs/index.js` (an import and a name per lab: keep both), the shared sheets `src/styles/base.css` and `src/styles/frame.css`, and the shell (`src/v2/app.js`, `src/v2/game.js`); rarely `src/core/styles.js` (`ORDER`), `scripts/smoke.mjs` (`NAMES`, a new section) and `scripts/smoke/owners.mjs` (a new section's or lab's files). Keep each smoke check in its section's file (`scripts/smoke/<section>.mjs`, a lab's in `scripts/smoke/labs/<lab>.mjs`).
   Resolve a conflict hunk by hunk. Never take one side of a whole file (`git checkout --ours` or `--theirs`): that drops the other side's changes that merged cleanly too (on 23 November it dropped two labs' smoke checks, put back the same night). After resolving, read `git diff origin/main` on every file that conflicted and see both sides' additions there; and check that two island growths do not stand on the same spot (`src/v2/growers/`).
2. `npm test`, `node --check` on the changed files, and `npm run test:browser -- --only <the sections the conflicts touched>`.
3. Push the train and open one PR from it, ready for review: title `Train <date>`, its body a line for each PR it carries (`focusxyz11/open-silicon-lab#<n>`: its title) and every `Closes #<n>` from those PRs, each on a line of its own. Add the label `ci:full` at once (the run that starts with the label runs the whole suite; its `plan` says lane core). Wait for that `test`.
4. Green: squash-merge the train. Then close each PR it carried (not merged: its commits are in the train), with a comment linking the train PR. The train's `Closes` lines close the issues.
5. Red: find the PR that breaks it by halving. Make a train of the first half of the PRs from `origin/main` (`claude/train-<date>-a`, and so on), with its own PR and `ci:full` as above. If it is green, merge it, and make a train of the other half from the new `origin/main`; if it is red, halve it again. A train of one PR that is red has found it: fix it up to three times on its own branch; after that, close that train, make the PR a draft with a comment saying what fails, and go on with the rest. Merge every train that passes.
6. If `main` moves while a train is testing (the owner merged something), merge `origin/main` into the train and wait for `test` again.

## Phase 3b: more waves
After each train merges, read the issues again: merging closed some, so others are ready now (an issue held back from an earlier wave as not independent is ready again too). Do Phase 1 on them, build the newly ready groups as Phase 2 and merge them on the next train as Phase 3: at most 5 groups a wave, independent as in Phase 1, `priority` groups first, then lowest issue numbers first, each wave on its own train. Up to 4 waves a night, counting wave 1; stop early when nothing is ready.

## Phase 4: close the night
- One small PR updating `docs/STATUS.md`, merged when green.
- Check `main` is green (else Phase 0).
- Remove the worktrees.

## Never
Push to `main`, close issues by hand, edit `.github/workflows`, delete others' branches, weaken a check, or build or edit an issue labelled `needs-owner` (it waits for the owner's decision or review, not for code), or remove that label.

## Report
1. **Decide these** first: each open issue labelled `needs-owner`, and how many issues wait behind it (waiting for it directly, or through an issue that waits for it); then any other thing only the owner can unblock (a workflow step, an open PR the night's issues meet).
2. Per wave: its groups and their issues (which were independent and why, and the core group), its train PR, and whether it merged (for a red train, the PR that broke it and what fails).
3. The night's numbers: issues closed, waves, trains, failed trains, CI minutes (the sum of the night's `test` runs, from `actions_list`), and the helpers on Sonnet and on Opus; set the issues closed beside the nights before (26 November: 11, 27 November: 8).
4. What is left and why, naming for each waiting issue what it waits for (an issue, or the owner); `main`'s state at the start and the end; what the owner should look at first on the live site.
