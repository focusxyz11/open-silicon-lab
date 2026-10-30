# Open Silicon Lab — notes for Claude

An open-source, interactive lab for how every kind of chip is designed, made and used: microcontrollers, phone processors, power and sensor chips, memory and AI accelerators. Static site: plain ES modules, HTML fragments and CSS. No framework, no build step for development.

## Who it is for
Learners new to chips with basic hardware knowledge. Plain words first; explain any term the first time; Beginner/Engineer explanations sit side by side.

## Principles (from the project owner)
- Not a textbook: simulations, puzzles and builds first, with only the text needed to use them.
- Nothing is locked. Threads and stars guide; they never gate content.
- Everything is connected: every topic sits in the knowledge graph with typed links (six kinds, `src/data/links.js`) and big ideas that echo across layers (`src/data/ideas.js`). Each link must be true for its kind.
- Universal, not only AI chips: the stack covers every chip, from a thermostat's microcontroller to a data center GPU. AI is one strong thread through it, not the whole frame.
- RISC-V and the open-source hardware ecosystem get special weight; so does an AI-native view of how the industry is changing.
- Every industry figure lives in `src/data/facts.json` with source, date verified and kind. Each simulation says what it simplifies.

## Commands
- `npm start` or `node scripts/serve.mjs 8000` — serve locally (opening index.html from disk does not work).
- `npm test` — engine and knowledge-graph tests (node:test). Must pass.
- `npm run test:browser` — Playwright smoke test of every view and topic on desktop and mobile.
- `npm run build` — single-file `dist/open-silicon-lab.html` (used for the claude.ai preview).

## Where things are
See `docs/ARCHITECTURE.md`. Each topic is a folder in `topics/<id>/` (content.html, topic.json, labs/*.js, optional style.css) and loads only when opened; read `topics/README.md` before touching one. Each topic's place, links, big ideas, challenges and learning content are in its `topic.json`; `npm run catalog` generates `src/generated/graph.js`, read through `src/data/topics.js`. Shared code: `src/core/` (UI helpers), `src/engines/` (pure models with tests), `src/app/` (shell, loader, router, map, views), imported from topics as `osl/…`. After changing a topic folder run `npm run catalog`. New topic: `npm run new-topic -- <id> "<Title>" <prefix> <band>`.

## Workflow
Work on a branch, open a pull request, let CI pass, then merge; `main` deploys to GitHub Pages. Keep PRs focused. Check changes at phone width (390 px) and in dark mode; no sideways scrolling.
