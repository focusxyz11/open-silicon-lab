# Review: the atom level

Reviewed 2026-11-13 against `src/i18n/en.json`, `src/data/facts.json` and `src/data/weave.js`, with a look at what the atom scene draws (`src/app/scenes.js`). No web search was used; judgements rest on general device knowledge and the entries already in `facts.json`.

## Status

Not applied. This file is the only change; `en.json`, `facts.json` and the code are untouched. `npm test` was not run.

Reviewer: Claude Fable 5.2, asked with a written brief.

## Status

Applied 2026-11-13: all 10 suggested replacements. The layer is now "the insulating skin" at both the switch and atom levels; "wall" is gone from the screen. Still open: the figures under "Numbers needing a facts.json entry"; the atom and switch pictures still draw electrons crossing the skin (the older gate-leak story), a design decision.

Reviewer: Claude Fable 5.2, asked by Claude Opus 5.5 with a written brief; applied by Claude Opus 5.5.

## Summary

The level is sound: the crystal, the added atom, the moving electrons and the leak through a very thin insulator are all real, and nothing in it is flatly false. Of the 28 keys in scope, 18 are fine, 10 need a wording fix and 0 are outright wrong. The naming question is settled in favour of the switch level: the layer is "the insulating skin" here too, and "wall" goes from all three texts that use it (`part.atom.boundary`, `stop.fail.atom.q`, `chip.show.atom`). One text is misleading: `chip.show.atom` says the walls let more electrons through, while the switch level now reads the same multiplier as current leaking when the switch is off. The other gaps are a vague account of what the added atom does, a `.tried` entry that only repeats its own question, and six figures (half a nanometre, a few dozen atoms, many thousands of times, and three laboratory firsts) with no `facts.json` backing.

Severity count: wrong 0, misleading 1, unclear 4, nit 5.

## Findings

| Key | Current text | Problem | Severity | Suggested replacement |
| --- | --- | --- | --- | --- |
| `part.atom.boundary` | "oxide wall" | Plain language and naming. This is the same layer the switch level calls "insulating skin". A learner coming down one level meets a new name for it, and "oxide" is never explained. "Wall" also means something else on the site (the memory wall, the power wall). | unclear | "insulating skin" |
| `what.atom.boundary` | "An insulating layer; when it is only a few atoms thick, electrons can slip through." | Naming. True, but nothing says this is the skin seen one level up, so the part does not connect to what the learner already knows. | nit | "The switch's insulating skin, seen close up. When it is only a few atoms thick, electrons can slip through." |
| `what.atom.dopant` | "An atom of another element, added on purpose to change how easily current flows." | Plain language. True, but it does not say how one atom can do that, which is the thing to understand at this depth. The engineer's word, dopant, is never given, so a learner cannot connect this part to anything they read elsewhere. | unclear | "An atom of another element, added on purpose (a dopant). It has one electron more than silicon, or one fewer, and that spare electron or gap is free to move and carry current." |
| `chip.show.atom` | "The walls here let {wall}× as many electrons slip through." | Accuracy and naming. "Walls" is no longer a part at any level. The switch level now reads the same `{wall}` figure as current leaking when the switch is off, which is the main leak in today's chips; here it is read as electrons crossing the insulator, a leak that was cut back around 2007 by making that layer thicker in a new material. One number, two stories, one level apart. The multiplier is an engine constant with no `facts.json` entry (already listed in the switch review). | misleading | "In this chip, {wall}× as many electrons slip through when the switch is off." |
| `stop.strange.atom.note` | "A working transistor has been made from a single atom in the laboratory." | Plain language and number. True (one phosphorus atom placed in silicon, 2012), but it is a laboratory first with no `facts.json` entry, and it leaves out the thing worth noticing: that device worked only close to absolute zero. "Transistor" is explained one level up, but a visitor can arrive here directly. | nit | "A working switch has been made around a single atom placed in silicon. It worked only at temperatures close to absolute zero." |
| `stop.strange.atom.tried` | "single-atom transistors", "data stored in DNA" | Plain language. Both are real. The first repeats the note; the question also asks about molecules and nothing here answers that; DNA is not explained. | nit | ["switches built around a single atom", "single molecules used as switches", "data stored in DNA, the molecule that holds a cell's instructions"] |
| `stop.limit.atom.note` | "Today's chips use many thousands of times more than that minimum." | Number. The size is right for one flip of one switch (thousands to tens of thousands of times), but the text does not say per what, and a whole chip or a whole operation uses far more. `limit.atom` has no entry in `FIGURES`, though `landauer-measured` already backs the minimum itself. | nit | "Each time a switch in today's chips flips, it uses many thousands of times that minimum." |
| `stop.fail.atom.q` | "Walls this thin let electrons leak straight through. What do you do when the rules themselves change?" | Naming. The stop lights the part now called the insulating skin, and "walls" names nothing the learner can see. The physics and the question are good. | unclear | "An insulating skin this thin lets electrons leak straight through. What do you do when the rules themselves change?" |
| `stop.make.atom.tried` | "atom-by-atom placement" | Question quality. This restates the stop's own question and note; it does not say what anyone is doing. Real lines of work exist, and one is already in factories. | unclear | ["placing single atoms in silicon with a microscope tip, to build quantum computer chips", "laying films down one layer of atoms at a time, already done in factories", "molecules that arrange themselves into patterns"] |
| `stop.scale.atom.note` | "The pattern of a silicon crystal repeats about every half a nanometre." | Number and plain language. Correct (0.543 nanometres), but there is no `facts.json` entry and no `FIGURES['scale.atom']`. A search of `en.json` found no place where "nanometre" is explained, and this is the depth where it matters most. | nit | "The pattern of a silicon crystal repeats about every half a nanometre. A nanometre is a millionth of a millimetre." |

## Numbers needing a facts.json entry

- **Silicon's repeat distance** (`stop.scale.atom.note`, "about every half a nanometre"). The fact: the lattice constant of silicon is 0.543 nanometres. Credible source: the NIST / CODATA value for the silicon lattice parameter. Needs a source, then `FIGURES['scale.atom']`.
- **Channel length in atoms** (`stop.scale.atom.q`, "a few dozen atoms long"). The fact: the gate of a newest-generation switch is roughly 12 to 16 nanometres long, which is about 30 to 60 silicon atoms in a row depending on direction. "A few dozen" is fair. `imec-cfet` gives gate pitch (42 nm), not gate length, so it does not back this. Credible source: the IEEE roadmap (IRDS) or a foundry device paper (IEDM, VLSI Symposium). Needs a source.
- **Energy of one switch flip against the minimum** (`stop.limit.atom.note`, "many thousands of times"). `landauer-measured` backs the minimum (about 3 zeptojoules at room temperature) and should be added to `FIGURES['limit.atom']`. The other half, the energy of one flip in a modern chip (tens to hundreds of attojoules once the wire it drives is counted), has no entry. Credible source: the IEEE roadmap (IRDS) tables or a published device paper. Needs a source.
- **Single-atom transistor** (`stop.strange.atom.note`, "a single atom"). The fact: a transistor built around one phosphorus atom placed in silicon, reported in Nature Nanotechnology in 2012 by a group led from the University of New South Wales; it ran at very low temperature. Named from memory; confirm the paper and the temperature when the entry is written. Needs a source.
- **Atoms placed one at a time** (`stop.make.atom.note`). The fact: single atoms were first moved and placed with the tip of a scanning tunnelling microscope at IBM, reported in Nature in 1990, at very low temperature. Named from memory. Needs a source.
- **Thickness of the insulating skin** (`what.atom.boundary`, "a few atoms thick"). The same fact the switch review asked for under `stop.fail.switch.note`; one entry would serve both. Needs a source.
- **Leak per generation** (`chip.show.atom`, `{wall}`, 1.8× per generation in `src/engines/chip.js`). Already listed in the switch review; still needs a source, or a note that it is the model's rule.
- **Already backed, not yet linked.** `vaire-ice-river` backs `stop.limit.atom.tried` (reversible computing on a real test chip) and `biomemory-dna` backs "data stored in DNA" in `stop.strange.atom.tried`. Neither text carries a number, so no entry is required, but both could be added to `FIGURES` for `limit.atom` and `strange.atom`.

## Keys that are fine

- `depth.atom.name`
- `depth.atom.see`
- `part.atom.dopant`
- `part.atom.electrons`
- `part.atom.lattice`
- `what.atom.lattice`
- `what.atom.electrons`
- `stop.think.atom.q`
- `stop.think.atom.note`
- `stop.strange.atom.q`
- `stop.limit.atom.q`
- `stop.limit.atom.tried`
- `stop.fail.atom.note`
- `stop.make.atom.q`
- `stop.make.atom.note`
- `stop.life.atom.q`
- `stop.life.atom.note`
- `stop.scale.atom.q`

Notes on four of these. `what.atom.electrons` ("the moving charges that carry the current") matches the switch level's "moving charges". `stop.limit.atom.q` is accurate: the minimum is for erasing, not for computing, which is exactly why reversible computing is a real answer. `stop.fail.atom.note` describes tunnelling correctly without needing the word. `stop.scale.atom.q` is fine as wording; its "few dozen" is listed above only for backing.

## Open risks

- **The picture still shows the old story.** The atom scene (`src/app/scenes.js`) draws red electrons crossing the skin, more of them as `M.wall` grows, and the switch scene does the same. The suggested `chip.show.atom` says "when the switch is off" and no longer says where they cross, so words and picture do not contradict each other, but the picture still tells the pre-2007 story. Whether to redraw the leak along the channel is a design decision.
- **"Wall" in the code.** Scene labels use the part key, so the new name will show, but comments in `scenes.js` and `src/engines/chip.js` ("oxide wall", "thinner walls leak more") and the engine field `wall` keep the old idea. Not on screen; worth tidying with the model.
- **The added atom sits in the channel.** The scene puts the added atom in the middle of the crystal, under the skin. In the newest sheet switches the channel is left almost free of added atoms, because a chance atom or two would make each switch different; the added atoms are packed into the source and drain. The words in scope stay true, but the picture suits older switches better than the sheets shown one level up.
- **Electrons only.** The level says electrons throughout. In half of all switches the moving charge is a gap where an electron is missing. The suggested `what.atom.dopant` mentions the gap once; `what.atom.electrons` and the scene do not, which is a fair simplification but leaves the switch level's "two kinds of switch" without a root here.
- **`floor.energy` states what the stop asks.** Out of scope: `floor.energy` calls the erasing minimum "the floor under every step", while `stop.limit.atom.q` asks whether there is a floor and its `.tried` names computing that never erases. The two should agree that the floor is under erasing.
- **Node names against real sizes.** This depth is 2 nanometres across and teaches that the crystal repeats every half nanometre. A learner who has read "2 nm chip" elsewhere may conclude its parts are four repeats wide. Node names are labels, not sizes; I did not check whether the site says so anywhere.
- **No `.tried` where people did act.** `stop.fail.atom` has no `.tried`, yet the industry's answer is known: a thicker skin in a material that still lets the gate act. Adding it would need a new key and a `TRIED` entry, which this review may not create.
- **Stop text and the figures test.** My suggestions add no digits. I did not run `npm test` and do not know whether number words ("half", "dozen", "thousands", "millionth") are checked against `FIGURES`.
- **Simplifications I let stand.** "Each joined to four neighbours" (true of the crystal, not of atoms at its surface); "life builds at room temperature" (body temperature for us, colder or hotter for other life); "Nothing at this depth knows" (rhetorical, and true).
- **No outside check.** The 2012 and 1990 laboratory results, the lattice constant, gate length and switching energy are from general knowledge, not looked up. Each should be confirmed when its `facts.json` entry is written.
