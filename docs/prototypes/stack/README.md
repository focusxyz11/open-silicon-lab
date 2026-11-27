# Your stack: the prototype

The working prototype of the lab's spine and second core visual system (`docs/PATH.md`). Designed and built by
Claude Fable 5.2 on 26 November 2026, from a first version by Claude Opus 5.5, then polished by Claude Opus 5.5
(the rail follows the camera during a flight, the stack makes room for the agents' cards, the field lighter at full
scale, the needs' names stay in view when zoomed in).

It is a reference to port from in small steps (`docs/PATH.md`, "Building it"), not part of the site: it does not
follow the lab's rules for words (`src/i18n/`), styles or loading, and its model above the switch is an idea drawn.

- `index.html`: the built page, one self-contained file. Open it in a browser.
- `src/model.js`: the carry from atom to mind, the recipe as forks, the population (the switch and the architecture
  are the lab's own engines, imported from `src/engines/`).
- `src/pics.js`: each rung's picture, and the glyph of a recipe on the field.
- `src/app.js`: the world: the camera from every attempt to its niche to your stack and one rung, the controls on the
  picture, the growth bar, the agents, the marks of the questions.
- `src/strings.js`: every word on screen, in one object.
- `build.mjs`: from the repository's root, `npm install --no-save esbuild && node docs/prototypes/stack/build.mjs --min`.

It was checked at 1280, 1920 and 2560 wide and at 390 on a phone, in day and night and with reduced motion, through
the field, a niche, the stack, a rung, the low-voltage wreck, a recipe changed, grown, the agents' forks and their
sweep, with no errors in the console.
