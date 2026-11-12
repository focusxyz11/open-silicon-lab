# Open Silicon Lab — notes for Claude

An open-source lab for chips. The site is one thing: a continuous dive from a data centre, a phone or a car down to silicon atoms (scale), meeting in four shared depths, and a journey along the line a chip is made on, from crystal to the world (process), with open questions running through both as threads. Static site: plain ES modules, one stylesheet, one file of words. No framework, no build step for development.

## Who it is for
Learners new to chips with basic hardware knowledge, up to engineers. Plain words first; explain any term the first time.

## Principles (from the project owner)
- One world, seen by diving (scale) and along the journey (process). Keep the zoom continuous: each depth lives inside the previous one's portal (`docs/FRAME.md`).
- Every part explains itself: a new part needs `part.*` and `what.*` words.
- Questions, not answers. The question behind the question matters more. A stop gives a question, something true to notice, and what people are trying.
- The eleven core questions are the hidden framework. Never list or show them together; one may appear on its own when its condition is met (`rootShown` in `src/engines/weave.js`).
- No linear path: a visitor can pick any question and go deeper or higher.
- Visual first, in one drawing style (Fable's world build), dark and light.
- Universal, not only AI chips; RISC-V, open hardware and an AI-native view get special weight.
- The build: the lab is a community building one open goal (`src/data/build.js`), people and AI together, and the repository is part of that self-organizing system. Anything that builds is a piece of the plan, checked by an engine; a new kind of check is a new engine (`src/engines/build.js`), never a separate tool. Every design says who wrote it and how AI was used. AI joins through an open port (`src/engines/api.js`, the MCP server `scripts/mcp.mjs`), not an AI service of the lab's own. Design and the factory are one story: at every step, show what the line does to the design.
- Words on screen live in `src/i18n/en.json` and are read with `t('name')`; never write visible English in code. `npm test` checks it.
- Industry figures live in `src/data/facts.json` with source, date verified and kind; a number in a stop's words needs one in `FIGURES` (`npm test` checks it).
- When a version is replaced, keep it on a named branch first (the earlier site: `claude/before-dive-2026-11`).

## Commands
- `npm start` — serve locally on port 8000 (opening index.html from disk does not work).
- `npm test` — the weave and the words (node:test). Must pass.
- `npm run test:browser` — Playwright smoke test on desktop and phone.
- `npm run build` — single-file `dist/open-silicon-lab.html`.
- `npm run mcp` — the open port: the engines as an MCP server for AI agents (`docs/MCP.md`).

## Where things are
See `docs/ARCHITECTURE.md`. Data: `src/data/weave.js` (worlds, depths, threads, stops). Logic: `src/engines/weave.js`. Scenes: `src/app/scenes.js` (solids in 2.5D: `src/app/solid.js`). The journey: `src/app/journey.js` (steps, captions, slice) and `src/app/journey3d.js` (the 3D view, three.js in `src/vendor/`; the lens over a machine at work: `src/app/lens3d.js`). The design studio: `src/app/design.js`, `src/engines/design.js` (the tiny-chip engine: `src/engines/tinychip.js`), the community's plan `src/data/build.js` and its engines `src/engines/build.js`. The world around the line: `src/app/map.js`, `src/data/world.js`, `src/engines/supply.js`. Zoom: `src/app/world.js`. Shell: `src/app/ui.js`. Plans: `docs/ROADMAP.md`. Ideas: `docs/IDEAS.md`.

## Workflow
Work on a branch, open a pull request, let CI pass, then merge; `main` deploys to GitHub Pages. Keep PRs focused. Check changes at phone width (390 px) and in dark and light; no sideways scrolling.
