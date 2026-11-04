# Depth labs

There are no levels of reader. Everyone starts at See it, nothing is locked, and anyone can go straight to the deepest stop. A hard idea appears from the start, in a form anyone can see; going deeper changes how it is expressed, not who it is for.

| Depth | Expressed as | It is finished when |
| --- | --- | --- |
| See it | Play and pictures, with almost no words and no numbers | A child can explain it back |
| Measure it | Real numbers and units, and a prediction before the result | A newcomer can guess a number before trying |
| Model it | Formulas, assumptions and what is left out | An engineer finds nothing false |
| Open question | What is still unknown, as a debate with each side's assumption | Neither side is marked right |

## Rules

- **One picture.** It stays on screen at every depth, and each depth adds to it. Do not swap in a different drawing.
- **One model.** Every depth reads the same engine in `src/engines/`, with tests. Do not write a simpler version for See it.
- **Simple, never false.** A picture can leave things out, but it must not teach something that has to be unlearned. Prefer drawing the real thing to an analogy, and say where a comparison stops working.
- **Earn every word at See it.** Aim for under 50 words on screen, buttons included.
- **A challenge at every depth.** Depths are not chapters to read.
- **Check with people.** The last column above is the test, and only people can run it.

## How to convert a simulation

1. Move the logic into a pure engine in `src/engines/`, and test each claim the page makes.
2. In `content.html`, give the lab the class `depthlab` and add a `.depthrail` with four buttons: `data-depth` set to `see`, `measure`, `model` and `open`, each with an id such as `yd-measure`. That id is a link, so a challenge that needs the tools of a depth uses `"href": "#yd-measure"`.
3. Mark what shows where with `data-on`, for example `data-on="12"` for Measure it and Model it.
4. In the lab, call `depthLab(sec.querySelector('.depthlab'), onChange)` from `osl/core/depth.js`.
5. Keep readouts up to date at every depth, even hidden ones, because self-checking challenges read them. Keep existing element ids so challenges keep working.
6. Make the first challenge in `topic.json` one a newcomer can do at See it.
7. Run `npm run catalog`, `npm test`, `npm run test:browser` and `npm run test:challenges`.

`topics/yield` is the example for a physical process, and `topics/quantum` for an abstract one.

## Progress

Done: Wafer & yield, Quantum search. `tests/depth.test.mjs` checks that every depth lab has all four stops. Next: the other flagships, the transistor, the tiny chip studio and the RISC-V lab, after testing the first two with real people.

The top-bar Beginner / Engineer switch hides itself on pages with a depth lab, and goes away when the last topic is converted.
