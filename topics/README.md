# Topics

Every topic on the map is one folder here. A topic is self-contained: you can add or change one
without reading the rest of the site. The site loads a topic only when someone opens it.

## Start a new topic

```sh
npm run new-topic -- thermal "Heat and cooling" th systems
```

This copies `_template/` into `topics/thermal/` with a working example simulation and prints the
remaining steps. `th` is a 2–3 letter prefix for the element ids in this topic; `systems` is the band
(layer of the stack) it sits in. Run it without a band to see the list.

## What a topic folder holds

```
topics/<id>/
  topic.json      everything about the topic as data: its place, links, ideas, challenges, learning
  content.html    <section id="<id>"> … </section>          the page: question, short text, simulation panels
  labs/<lab>.js   one file per simulation, exporting init(section)
  style.css       optional: styles used only by this topic (loads when it opens; shared styles are in src/styles/base.css)
```

### topic.json

```json
{
  "id": "yield",
  "title": "Wafer & yield",
  "band": "mfg",
  "order": 30,
  "kind": "explore",
  "summary": "Why defects make big dies expensive, and why chiplets help.",
  "labs": ["yield"],
  "links": [
    { "kind": "causes", "to": "economics", "why": "yield sets the cost per chip",
      "if": "yield falls", "then": "each working chip costs more" },
    { "kind": "feeds", "to": "package", "why": "only dies that pass test get packaged" }
  ],
  "ideas": [
    { "idea": "many-small", "how": "small dies dodge defects, so splitting a big design into chiplets wastes less" }
  ],
  "challenges": [
    { "kind": "Puzzle", "title": "…", "task": "One sentence: what to do.", "href": "#lab-yield-1" }
  ],
  "learn": {
    "plain": "For someone new to chips, with one everyday comparison.",
    "engineer": "The model, the numbers that matter, and what it leaves out.",
    "quiz": [{ "q": "…?", "options": ["…", "…", "…"], "answer": 2, "why": "…" }],
    "ask": ["A question a curious reader might ask?"]
  }
}
```

| Field | What it is |
| --- | --- |
| `band` | The layer of the stack it sits in: an id from `src/data/bands.js`. |
| `order` | Its place from left to right within the band (10, 20, 30…). Pick a number between two neighbours. |
| `kind` | `explore` (simulations and explanations) or `build` (a hands-on project). |
| `labs` | Its simulations, in the order they start. |
| `links` | How it connects (below). Every topic needs at least one link, in its own file or another's. |
| `ideas` | Big ideas from `src/data/ideas.js` that this topic shows, and how. Add `"counter": true` when the topic shows where the idea breaks. |
| `tradeoffs` | Trade-offs from `src/data/tradeoffs.js` this topic shows: `{ "tradeoff": "speed-power", "how": "…", "try": "#lab-design-4" }`. `try` points at the simulation where the reader can push it. |
| `measures` | Measures from `src/data/measures.js` this topic uses: `{ "measure": "bandwidth", "how": "…" }`. |
| `time` | What the topic looked like over the years: `"then": [[1971, "…"], [2007, "…"]]`, each line holding until the next. Lines may use values such as `{node}` or `{wafer}` (list in `src/data/timevalues.js`). Add `"born": [year, "what happened"]` if the subject did not exist in 1971. |
| `challenges` | `Puzzle` (one right answer), `Design` (many answers, scored on trade-offs) or `Experiment` (find where something breaks). |
| `learn` | Loaded only when the topic opens. Write both `plain` and `engineer`, or neither. |

### Links: say what kind of connection it is

A link is a sentence: *this topic* **kind** *that topic*: *why*. Use `"to"` when this topic is the
subject (`"transistor" builds-on "physics"`), `"from"` when the other topic is
(`{ "kind": "feeds", "from": "design" }` in `layout` means *design feeds layout*). Write each link
once, in either topic's file. Go down this list and take the **first** kind that is true:

| Kind | Ask | It is true when… | Example |
| --- | --- | --- | --- |
| `part-of` | What is it inside? | it sits inside the other: you could point at it | transistor part-of architecture |
| `kind-of` | What else is like it? | it is one member of a family the other describes | quantum kind-of beyond |
| `feeds` | Where does the work go next? | what this step produces is what the other starts from | layout feeds litho |
| `causes` | If this changes, what happens there? | a change here changes the other, in a direction you can name; add `"if"` and `"then"` | yield causes economics |
| `grew-from` | Where did it come from? | it historically came out of the other | riscv grew-from architecture |
| `builds-on` | What does it rest on? | it uses the ideas or methods of the other | transistor builds-on physics |

Readers see `causes` links as predictions: *"If yield falls, what happens in Economics?"*, with the
`then` folded until they have thought. So write `if` as a change and `then` as its effect. Keep `why`
under 90 characters; it is shown on the map.

Glossary terms (`src/data/learning.js`) and dated facts (`src/data/facts.json`) are kept centrally on
purpose: they are shared across topics, and facts are checked together each month.

## The contract

The tests check every rule below and say exactly what to fix.

1. **Folder name = topic id** = `"id"` in `topic.json` = `<section id>` in `content.html`.
   `topic.json` has a `title`, `summary`, `band`, `order` and `kind`, and the topic has at least one link.
2. **Every file in `labs/` is listed in `topic.json` `"labs"`, and every listed lab exists.**
3. **Each lab exports `init(section)`.** The site calls it once, after `content.html` is on the page.
   `section` is this topic's `<section>`. A lab that throws does not stop the others.
4. **Element ids are unique across the whole site.** Start every id in your topic with its prefix
   (`thCv`, `thSlider`, …). Simulation panels (`class="lab"`) get the anchors `lab-<id>-1`, `lab-<id>-2`, …
   automatically, so links like `#lab-thermal-1` work.
5. **Import shared code through `osl/`**, never with `../`:
   `import { $, T, fit, watch, rgba } from 'osl/core/ui.js'`, `'osl/engines/…'`, `'osl/data/…'`, `'osl/app/…'`, and `'osl/hw/…'` to talk to boards (docs/HARDWARE.md).
   Files inside your own topic: `'./other.js'`.
6. **Run `npm run catalog` after changing a folder.** It checks the folder and the links and ideas,
   then regenerates `src/generated/graph.js` and `catalog.js`, the small files the map reads at start-up.
   CI fails if they are out of date.
7. **Nothing is locked.** No simulation or text may depend on finishing another one.

## Writing a good topic

- **Lead with a question or challenge**, not a definition. The `<h2>` is the question.
- **Simulation first.** Two or three short paragraphs at most before the first panel.
- **Plain words.** Explain each term the first time; add new terms to the glossary.
- **Connect it honestly.** Choose the link kind that is true, not the one that sounds closest. If two
  topics only share an idea, that is a big idea (`ideas`), not a link.
- **Disagreement is welcome.** If informed people disagree about something in your topic, add a view
  to a debate in `src/data/debates.js` (or a new debate), written the way its best defender would,
  with the assumption it rests on. Never mark one view right.
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
