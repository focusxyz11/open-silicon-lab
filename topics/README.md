# Topics

Every topic on the map is one folder here. A topic is self-contained: you can add or change one
without reading the rest of the site. The site loads a topic only when someone opens it.

## Start a new topic

```sh
npm run new-topic -- thermal "Heat and cooling" th
```

This copies `_template/` into `topics/thermal/` with a working example simulation and prints the
remaining steps. `th` is a 2–3 letter prefix for the element ids in this topic.

## What a topic folder holds

```
topics/<id>/
  topic.json      { "id": "<id>", "labs": ["<lab>", …] }   the simulations, in start order
  content.html    <section id="<id>"> … </section>          the page: question, short text, simulation panels
  labs/<lab>.js   one file per simulation, exporting init(section)
  style.css       optional: styles used only by this topic
```

The topic's place on the map (its layer, title, one-line summary and labelled connections) is in
`src/data/topics.js`. Its time-machine line is in `src/data/timeline.js`. Explanations, quiz and
glossary terms are in `src/data/learning.js`; challenges in `src/data/challenges.js`; dated facts in
`src/data/facts.json`. A later step moves these into the topic folder too (see `docs/ARCHITECTURE.md`).

## The contract

The tests check every rule below and say exactly what to fix.

1. **Folder name = topic id** = `"id"` in `topic.json` = `<section id>` in `content.html`.
2. **Every file in `labs/` is listed in `topic.json` `"labs"`, and every listed lab exists.**
3. **Each lab exports `init(section)`.** The site calls it once, after `content.html` is on the page.
   `section` is this topic's `<section>`. A lab that throws does not stop the others.
4. **Element ids are unique across the whole site.** Start every id in your topic with its prefix
   (`thCv`, `thSlider`, …). Simulation panels (`class="lab"`) get the anchors `lab-<id>-1`, `lab-<id>-2`, …
   automatically, so links like `#lab-thermal-1` work.
5. **Import shared code through `osl/`**, never with `../`:
   `import { $, T, fit, watch, rgba } from 'osl/core/ui.js'`, `'osl/engines/…'`, `'osl/data/…'`, `'osl/app/…'`.
   Files inside your own topic: `'./other.js'`.
6. **Run `npm run catalog` after changing a folder.** It regenerates `src/generated/catalog.js`, the
   small index the map reads at start-up. CI fails if it is out of date.
7. **Nothing is locked.** No simulation or text may depend on finishing another one.

## Writing a good topic

- **Lead with a question or challenge**, not a definition. The `<h2>` is the question.
- **Simulation first.** Two or three short paragraphs at most before the first panel.
- **Plain words.** Explain each term the first time; add new terms to the glossary.
- **Say what the model leaves out** in the panel's `note`.
- **Every industry figure** goes in `src/data/facts.json` with its source, date verified and kind.
- **Keep the model pure.** When a simulation's maths grows, move it into `src/engines/` with a test.
- **Check it** at phone width (390 px) and in dark mode; nothing may scroll sideways.

## Shared helpers (`osl/core/ui.js`)

| Helper | What it does |
| --- | --- |
| `$('#id')` | find an element |
| `fit(canvas)` | size a canvas to its box, returns `{ ctx, w, h }` |
| `watch(canvas, draw)` | redraw on resize and when the theme changes |
| `T.ink`, `T.muted`, `T.amber`, `T.cyan`, `T.violet`, `T.good`, `T.bad`, `T.rose`, … | theme colours for canvas drawing |
| `rgba(color, alpha)` | a theme colour with transparency |
| `fmtNum`, `fmtLen`, `clamp`, `rng(seed)`, `gauss` | formatting and maths |

CSS classes for panels and controls (`lab`, `cols`, `controls`, `ctl`, `seg`, `btn`, `readout`,
`note`, `callout`, `pill`, `status`) are in `src/styles/base.css`; the template uses them.
