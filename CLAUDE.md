# Open Silicon Lab — notes for Claude

An open-source lab for chips. The site is one thing: a continuous dive from a data centre, a phone, a car or a chip factory (four worlds) down to silicon atoms, meeting in four shared depths, with open questions running through it as threads. Static site: plain ES modules, one stylesheet, one file of words. No framework, no build step for development.

## Who it is for
Learners new to chips with basic hardware knowledge, up to engineers. Plain words first; explain any term the first time.

## Principles (from the project owner)
- One world, seen by diving. Keep the zoom continuous: each depth lives inside the previous one's portal (`docs/FRAME.md`).
- Questions, not answers. The question behind the question matters more. A stop gives a question, something true to notice, and what people are trying.
- The eleven core questions are the hidden framework. Never list or show them together; one may appear on its own when its condition is met (`rootShown` in `src/engines/weave.js`).
- No linear path: a visitor can pick any question and go deeper or higher.
- Visual first, in one drawing style (Fable's world build), dark and light.
- Universal, not only AI chips; RISC-V, open hardware and an AI-native view get special weight.
- Words on screen live in `src/i18n/en.json` and are read with `t('name')`; never write visible English in code. `npm test` checks it.
- Industry figures live in `src/data/facts.json` with source, date verified and kind; a number in a stop's words needs one in `FIGURES` (`npm test` checks it).
- When a version is replaced, keep it on a named branch first (the earlier site: `claude/before-dive-2026-11`).

## Commands
- `npm start` — serve locally on port 8000 (opening index.html from disk does not work).
- `npm test` — the weave and the words (node:test). Must pass.
- `npm run test:browser` — Playwright smoke test on desktop and phone.
- `npm run build` — single-file `dist/open-silicon-lab.html`.

## Where things are
See `docs/ARCHITECTURE.md`. Data: `src/data/weave.js` (worlds, depths, threads, stops). Logic: `src/engines/weave.js`. Scenes: `src/app/scenes.js`. Zoom: `src/app/world.js`. Shell: `src/app/ui.js`. Plans: `docs/ROADMAP.md`. Ideas: `docs/IDEAS.md`.

## Workflow
Work on a branch, open a pull request, let CI pass, then merge; `main` deploys to GitHub Pages. Keep PRs focused. Check changes at phone width (390 px) and in dark and light; no sideways scrolling.
