# Architecture

A static site: plain ES modules, one stylesheet and one file of words. No framework, no build step for development.

```
index.html              the page: the world canvas, the top bar, the depth rail and the card
src/main.js             boot: load the words, then start the dive
src/app/ui.js           the shell: world switch, rail, card, theme, saved state (localStorage), layout around the world
src/app/world.js        the zoom: draws the current, previous and next depths, highlights, dots, tether, input
src/app/scenes.js       one scene per depth, drawn in a 1000 x 1000 space, with its named parts
src/engines/chip.js     your chip: its settings and what follows from them, relative to a starting chip (tested)
src/engines/weave.js    pure logic: the current world, the camera, sizes, threads, when a core question appears (tested)
src/data/weave.js       the data: worlds, depths and portals, threads, stops
src/data/facts.json     sourced figures, loaded at start (src/main.js); FIGURES and CASES in weave.js point to them
src/core/i18n.js        words: t('name'), plurals, numbers, dates
src/i18n/en.json        every word on screen
src/styles/site.css     the styles, dark and light
tests/                  node:test: the weave and the words
scripts/                serve.mjs, smoke.mjs (browser test), build-single.mjs, i18n-check.mjs
```

## The zoom

Each depth `i` has a portal `[x, y, side]`: where depth `i + 1` sits inside its 1000 x 1000 scene. The camera position is one number `z`: `z = i + f` means depth `i` with the view shrunk a fraction `f` of the way to its portal, geometrically (`cam()` in `src/engines/weave.js`). At `f = 1` the portal fills the view, exactly as depth `i + 1` does at `f = 0`, so there is no cut (a test checks it, in every world). The depth list is the current world's way down: `setWorld(id)` changes it, and `zIn(id, z)` says where the same view is in another world. `frames()` turns `z` and the screen box into three transforms: the current depth, the next one inside its portal (fading in), and the previous one around it (faint).

A scene is `{ parts, draw(G) }`. `G` is a small drawing helper (rectangles, lines, circles, labels by text name); a scene never contains words. `parts` are named shapes a question can light up.

## Questions

A stop `'thread.depth'` lists the parts it lights up; its words are `stop.<thread>.<depth>.q`, `.note` and optionally `.tried` (a list). At a stop the card can also show its `FIGURES` (from `src/data/facts.json`), its `CASES`, and the companion's prompt (`ui.prompt`). Where a followed thread has no stop, the card links to the question form on GitHub (`REPO`, `.github/ISSUE_TEMPLATE/question.yml`), filling in its `where` and `continues` fields. The card shows the questions crossing a depth; the world draws them as dots on their parts. Following a thread, `below()` and `above()` give its next forms. `rootShown()` decides when its core question may appear.

## Words and languages

Every word on screen lives in `src/i18n/en.json` and is read with `t('name')`. `npm test` fails if code holds visible English, if a text is missing or unused, or if a translation's `{names}` differ. To add a language, copy `en.json` to `<lang>.json`, translate the values, and add it to `LANGS` in `src/core/i18n.js`.

## Checks

- `npm test`: your chip's model (`tests/chip.test.mjs`), the weave (continuity of the zoom, parts, threads, the core-question rule, figures and cases with sources) and the words.
- `npm run test:browser`: Playwright opens the site on desktop and phone, in dark and light, dives, follows a question and lets it go, opens a real case and the companion, finds the invitation in a gap, and changes world.
- `npm run build`: `dist/open-silicon-lab.html`, one self-contained file.
