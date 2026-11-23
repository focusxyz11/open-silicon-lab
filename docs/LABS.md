# Building a lab

How to add a lab: a challenge played in Do mode at the place and level where it lives, checked by an engine. Read `CLAUDE.md` first; its principles are binding. The owner judges by the standard of a modern game: every element drawn is well designed or left out, visual first, plain words, nothing cartoonish, and desktop first where it is richer.

## What a lab is

A lab is one module in `src/v2/labs/`, registered by its kind in `src/v2/labs/index.js`. Follow `src/v2/labs/crystal.js` closely; `films.js`, `litho.js`, `implant.js` and `overlay.js` are newer examples.

`export default function lab(L)` returns `{ draw, click(e) -> bool, input(e) -> bool }`.
- `L` holds `S, view, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx, show`; see how `src/v2/play.js` calls it.
- `draw()` returns the card's HTML. It is patched in place, so sliders keep their drag.
- `click` and `input` return true when they handled the event.
- Animation runs in `requestAnimationFrame` loops on real elapsed time, capped per frame. A slow screen must not slow the model (see `czLoop` in `crystal.js`), and a loop stops when `el.isConnected` is false.
- Keep what the player has tried in `view`, and win from that (`metBy` in `src/engines/fabkit.js` for the factory's checks).

## Layout

A lab is played in Do mode (below): on a desktop its instrument takes the stage and the rest stands in the side panel at the right (about 460 px at 1280, 600 at 1920); on a phone the instrument is on top and the rest is in the sheet under it. The HTML a lab's `draw()` returns, top to bottom:
1. The goal box with gauges, when the goal is a number.
2. The picture.
3. The dials.
4. One line of what happened.
5. A hint.

Figures are SVG (a viewBox of about 300 × 200, `width: 100%`) drawn from the engine's numbers. Colours come only from the CSS variables (`--ink`, `--muted`, `--line`, `--good`, `--bad`, `--warm`, `--accent`, `--panel-solid`), so the figures read in dark and in light. Explain every term in a few plain words the first time it appears.

## Do mode

In the frame (#271, `src/v2/frame2.js`), a lab played in Do mode gets the stage: its instrument takes the picture area, its goal stands across the top of it as meters, and everything else (the brief, the dials, what happened, the hint) stays in the side panel beside it. A lab says which is which with two attributes in the HTML its `draw()` returns; its logic does not change:
- `data-f2="instrument"` on the one element that is the lab's picture: the chart, the wafer, the chip (in `clockpower.js` the power curve's `<figure>`, in the batch bet the `.betview`, in `aibuild.js` the `.aibL` column).
- `data-f2="goal"` on the goal box (`.goalbox` with its `.gauge`s): each gauge becomes one meter; four or more become tiles.

Every challenge is played this way (#274), wherever it is met: in a view's frame or in the island's sheet (a challenge at a place without levels, such as Jevons' bet or Verify the agent). The player (`src/v2/play.js`) does what it can for a lab:
- **The goal:** a lab that declares no goal has its first `.goalbox` (a direct child of the card) as the goal. Mark another element `data-f2="goal"` when the goal is not a goal box (the agent's eight cases, the jobs to fit, an evolving circuit's readouts); each of its children becomes a tile.
- **The instrument:** one element, the lab's own picture: the figure (`figure.imfig`, `.cimfig`, `.srvfig`), the `.betview` that holds a wafer and a curve, the board of a teardown, the copies' answers in Find the broken copy. Draw it so it can fill the stage: an SVG with a viewBox (the stage gives it `width` and `height` of 100%), a canvas inside a figure. A picture that appears only after a first move (the board once a product is opened) is the instrument from then on; until then the challenge is played in the side panel.
- **The place as the picture:** a challenge with no picture of its own is played on the place, which stays the picture (lit, moving, its names on it), with the goal across the top and the controls in the panel; "where you are" leads back to Look. The player declares it (`data-f2="place"` on the card) for the kinds whose picture is the place: your chip's settings (`chip`), its life (`life`), a design and an evolving circuit (on the bench, which keeps its square, moved clear of the goal). A lab can say so too, with `data-f2="place"` on any element of its HTML. This is a desktop's: on a phone such a challenge is played in the sheet under the picture, as before.

A second picture (a curve beside the main drawing, the tones under a signal) stays in the side panel, beside the controls. A drawing on the stage keeps its words at a steady size on the screen (`--f2-k`), so draw it with a viewBox and let it scale. Without any of these the challenge is played in the side panel beside the picture, as before. Add the lab's own layout rules for the stage, if it needs any, to the Do block at the end of `src/styles/frame2.css`. Check it at 1280 × 800: the instrument and the controls are both in sight. `npm run test:browser -- --only labs` plays every challenge and checks each is won in Do mode.

## Wiring a challenge

1. **`src/v2/game.js`:**
   - Add the challenge to `CHALLENGES`: `{ id, step, place, at: '<level>', kind, grows: '<grow-id>' }`.
   - Add it to `OPENS`: `<id>: '<stop key>'`, a stop at that level (`src/data/weave.js`). Each grow id must be unique.
2. **Words:** every visible word goes in `src/i18n/en/labs.json` under the lab's own prefix (a new prefix is added to the `labs` area in `AREAS`, `src/core/i18n.js`), read with `t('key')`.
   - A challenge needs `game.ch.<id>.t`, `.goal` and `.why`, plus `grow.<grow-id>`.
   - Engines that still hold their English in a `WORDS` object: copy the texts the view shows into `labs.json`, and do not edit the engine.
   - `npm test` fails on a missing or an unused word.
3. **Experiment:** add the challenge to exactly one experiment in `src/data/experiments/<world>.js` (`ch: [...]`), the one whose stops or levels match. Update the count in `tests/experiments.test.mjs`.
4. **The grower:** a small, well-made model in `src/v2/map3d.js` (the growers table and `GROW_SPOT`). It appears on the island when the challenge is won.
   - Check its spot in a screenshot with the challenge won (set `localStorage['osl-world-v1']` to `{"done":{"<id>":1},"seen":true}`).
   - It must stand clear of buildings, walls and other growers. The factory is 26 × 16 around its centre, its gas annex is on the west side, and the test house is about 30 units east.
5. **CSS:** a block at the end of `src/styles/v2.css`, with classes prefixed by the lab's name, plus a phone rule if needed.
6. **A lab at a bench level:** check that `doHome` in `src/engines/way.js` sends it there.
7. **How true it is:** give the challenge its mark in `LABS` of `src/data/fidelity.js` (`docs/SYSTEM.md`, 4b): an idea drawn, real numbers (with its `fact`), computed (with the engine, `by`), or checked (an engine and the measurement it matches, compared in `CHECKS` of `tests/fidelity.test.mjs`). The player shows it under the title; `npm test` fails without it.

## Checking

- `npm test` passes.
- Serve the site (`npm start`) and drive it with Playwright at `index.html#/do/<id>`:
  - Play it to the win.
  - Take screenshots at 1280 × 820 in dark (`localStorage['osl-theme'] = 'dark'`) and 390 × 844 in light, plus one desktop shot mid-play.
  - Look at them and fix overflow, clipped or overlapping words, unreadable colours and sideways scroll.
  - A full-page shot does not show the card's inner scroll, so scroll the card on the phone too.
- Add the lab to the `labs` section of `scripts/smoke.mjs` with `playLab(id, moves, name)`. The moves are done again on every poll, because the card may be drawn anew when the flight lands.
- Run that section: `npm run test:browser -- --only labs` (about 2 minutes on a laptop), plus the section of any view the lab touches (`npm run test:browser -- --list` names them).
  - Select controls by data attributes, never by words.
  - The fab labs' player sits outside `#sheet`, so use plain `.player`.
- CI runs the smoke on a slow software renderer (about 1.5 s a frame), so be patient: poll, never fixed waits.
- The PR shows the desktop and phone screenshots.
