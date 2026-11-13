# Review: the switch (transistor) level

Reviewed 2026-11-13 against `src/i18n/en.json`, `src/data/facts.json` and `src/data/weave.js`. No web search was used; judgements rest on general device knowledge and the entries already in `facts.json`.

## Status

Applied 2026-11-13: all 19 suggested replacements, plus the three related texts from the open risks (`chipx.yours.etch` no longer says fins, `stop.think.gate.note` names the two kinds of switch, `chip.gen.notice` says leak instead of walls). "Billions" is now backed by `transistor-trend` in `FIGURES['make.switch']`. Still open: the other facts listed under "Numbers needing a facts.json entry", each needing a real source; the atom level's "oxide wall" naming and the car dive's flat switches, for the atom and car reviews.

Reviewer: Claude Fable 5.2, asked by Claude Opus 5.5 with a written brief; applied by Claude Opus 5.5.

## Summary

The level is sound in outline: it shows a gate-all-around (nanosheet) switch, which is right for the newest chips, and nothing in it is flatly false. Of the 33 keys in scope, 14 are fine, 19 need a wording fix and 0 are outright wrong. Five of the 19 are misleading and should go first: source and drain are described by the direction of "current", which is backwards for half of all switches; the leak reading blames thinning "walls", which stopped being the main story around 2007; "could it be grown" ignores that parts already are; and "channels one atom thick" is not what the real candidates are. The commonest plain-language gap is unexplained terms: "transistor" is never introduced, "gate" means two things one level apart, and "spintronics", "memristors" and "synapse" appear bare. The two network-switch keys in the rack are always qualified with "network" and do not clash.

Severity count: wrong 0, misleading 5, unclear 7, nit 7.

## Findings

| Key | Current text | Problem | Severity | Suggested replacement |
| --- | --- | --- | --- | --- |
| `depth.switch.see` | "One switch in cross-section: a gate wrapped around thin sheets of silicon." | Plain language and accuracy. The word "transistor" is used later at this level (`stop.strange.switch.note`) and across the site but is never tied to "switch". The sheet shape is true only of the newest chips (2 nm class); most chips in use, and nearly all car chips, have fins or flat switches, and this depth is shared by the phone and car dives. | unclear | "One switch, called a transistor, in cross-section. In the newest chips, its gate wraps around thin sheets of silicon." |
| `what.switch.gate` | "Wraps around the sheets; its voltage decides whether current can flow." | Plain language. The level above is named "Gate" and means a logic gate; here "gate" means the control part of one switch. Nothing tells the learner these are two different things. The physics is right. | unclear | "The part that controls the switch (not a logic gate). It wraps around the sheets, and its voltage decides whether current can flow." |
| `what.switch.oxide` | "A very thin insulating skin between the gate and the sheets." | Plain language. Says where the part is, not what it does, so the part does not explain itself. | nit | "A very thin insulating skin that lets the gate act on the sheets without current flowing into them." |
| `what.switch.source` | "Where the current comes from." | Accuracy. The source is where the moving charges enter. In the n-type half of all switches those charges are electrons, so the current, as a learner with basic hardware knowledge defines it, flows the other way: into the source. | misleading | "Where the moving charges enter the sheets." |
| `what.switch.drain` | "Where the current goes to." | Accuracy. Same problem as the source: true for charges, backwards for conventional current in n-type switches. | misleading | "Where the moving charges leave the sheets." |
| `chip.show.switch` | "This switch is {length}× as long as the starting one, and its walls leak {wall}× as much." | Accuracy, plain language and number. "Walls" is not a part at this level (the part is "insulating skin"; the atom level says "oxide wall"), so the term is unexplained. Leakage through a thinning insulator was the main worry up to about 2007; since thicker insulators of a new material came in, most leakage is current slipping from source to drain through a channel that should be off, and the fin and sheet shapes exist to cut it. The two multipliers come from engine constants (0.7 and 1.8 per generation) with no `facts.json` entry. | misleading | "This switch is {length}× as long as the starting one, and leaks {wall}× as much current when it is off." |
| `stop.think.switch.q` | "This switch knows two states: on and off. How can on and off mean anything at all?" | Accuracy, minor. A transistor does not "know" two states; it is a continuous device that designers choose to use at two ends. Saying so is itself something true to notice. | nit | "We use this switch in only two states: on and off. How can on and off mean anything at all?" |
| `stop.think.switch.note` | "Meaning comes from an agreement about how to read a group of switches." | Question quality. The note answers the stop's own question as settled, where the project asks for something true to notice. | unclear | "The same group of switches can be read as a number, a letter or a colour; nothing in the switches says which." |
| `stop.strange.switch.q` | "What could replace the switch itself: a beam of light, a magnet's spin, a living cell?" | Accuracy, minor. Spin belongs to an electron, not to a magnet. The question itself is open and good. | nit | "What could replace the switch itself: a beam of light, an electron's spin, a living cell?" |
| `stop.strange.switch.note` | "Every candidate so far beats the transistor at something and loses at something else." | Plain language. First use of "transistor" at this level, unexplained. The claim is fair. | unclear | "Every candidate so far beats today's switch at something and loses at something else." |
| `stop.strange.switch.tried` | "spintronics", "photonic switches", "genetic circuits in cells" | Plain language. All three are real lines of work, but "spintronics" and "photonic" are bare jargon. | unclear | "switches that use an electron's spin (spintronics)", "switches that use light (photonics)", "genetic circuits in living cells" |
| `stop.fail.switch.note` | "The thinnest layers here are only a few atoms thick." | Number. True (the insulating skin's first layer is a few atoms of oxide), but "a few atoms" has no `facts.json` entry and the stop has no `FIGURES`. Naming the layer would also tie the note to the part the stop lights. | nit | "The thinnest layer here, the insulating skin, is only a few atoms thick." |
| `stop.make.switch.q` | "This shape is made by adding and carving away dozens of layers. Could it be grown instead?" | Accuracy and number. Parts of it are already grown: the stack of sheets, and the source and drain, are grown as crystal, and the thinnest films are laid down one layer of atoms at a time. The open question is whether the whole shape could form by itself with no carving. "Dozens of layers" has no backing entry. | misleading | "This shape is made by adding layers and carving most of them away again. Could the whole shape grow by itself instead?" |
| `stop.make.switch.note` | "A modern chip takes a thousand steps or more to make, and billions of switches are made at once." | Number. "A thousand steps or more" matches `fab-steps`. "Billions" is true per chip (a wafer holds far more) but is not listed in `FIGURES['make.switch']`; `transistor-trend` could back it. | nit | "A modern chip takes a thousand steps or more to make, and every switch on the wafer, many billions of them, is made at the same time." |
| `stop.life.switch.q` | "A synapse stores and computes in the same place. What would a switch like that be?" | Plain language. "Synapse" is not explained. The claim is a fair simplification and the question is open. | unclear | "A synapse, the junction between two brain cells, stores and computes in the same place. What would a switch like that be?" |
| `stop.life.switch.tried` | "memristors" | Plain language. A real line of work, but bare jargon. | unclear | "memristors: parts whose resistance remembers the current that has passed through them" |
| `stop.scale.switch.q` | "Flat, then fins, then sheets. What comes after the sheet, and can anything keep doubling forever?" | Question quality. The order of shapes is right. The second half is a question with a known answer (nothing physical doubles forever), and "doubling" is explained only at the chip level. | nit | "Flat, then fins, then sheets. What comes after the sheet, and what happens when there is no next shape?" |
| `stop.scale.switch.note` | "Each new shape gave the gate a firmer grip on the channel, so it could shrink again." | Plain language, minor. True, and well put, but "it" could be the gate, the channel or the switch. | nit | "Each new shape gave the gate a firmer grip on the channel, so the switch could shrink again." |
| `stop.scale.switch.tried` | "stacking the two kinds of switch on top of each other", "channels one atom thick" | Accuracy and plain language. Both are real roadmap items (`imec-cfet`, `imec-2d`). But the candidate channel materials are a single layer that is three atoms thick, not one; only graphene is one atom thick and it cannot be switched off well. "The two kinds of switch" is never introduced, and the gate level says its four switches are identical. | misleading | "stacking the two kinds of switch, one that turns on with a high gate voltage and one with a low, on top of each other", "channels only a few atoms thick" |

## Numbers needing a facts.json entry

- **Thickness of the insulating skin** (`stop.fail.switch.note`, "a few atoms thick"). The fact: the gate insulator of a modern switch is a first layer of silicon oxide well under a nanometre thick, plus a slightly thicker layer of a hafnium-based material. Credible source: a foundry or imec device paper (IEDM or VLSI Symposium), or the IEEE roadmap (IRDS). Needs a source.
- **Switches made at once** (`stop.make.switch.note`, "billions"). The existing entry `transistor-trend` (tens of billions per chip) backs it; it only needs adding to `FIGURES['make.switch']`. A per-wafer count would need a new entry. Needs a source if used.
- **Layers in one switch** (`stop.make.switch.q`, "dozens of layers"). No entry. `fab-cycle-time` covers mask layers for a whole chip by node, which is a different count. Either drop the number, as the suggested text does, or add an entry from a process-flow paper or an equipment maker's technical note. Needs a source.
- **Length per generation** (`chip.show.switch`, `{length}`, 0.7× per generation in `src/engines/chip.js`). The classical scaling rule. It describes the cell shrinking, not the gate itself: gate length has changed little over recent generations. Credible source: the IEEE roadmap (IRDS) or a foundry's published density figures. Needs a source, or a note that it is the model's rule.
- **Leakage per generation** (`chip.show.switch`, `{wall}`, 1.8× per generation in `src/engines/chip.js`). No entry and no obvious published figure; it looks like a model constant. Needs a source, or a note that it is the model's rule.
- **"Decades of trial and error"** (`stop.know.switch.q`). Soft, but it is a figure. The fact: the wrapped-gate idea was shown in laboratories around 1990 and reached volume production in the 2020s (`tsmc-n2` backs the second half). Credible source for the first half: the original device papers or an IEEE history article. Needs a source.
- **Fins before sheets** (`stop.scale.switch.q`). No number in the text, so no entry is required, but `tsmc-n2` backs only the sheets. An entry for the first fin switches in production (2011) would complete the sequence. Credible source: the maker's own announcement. Needs a source.

## Keys that are fine

- `depth.switch.name`
- `part.switch.gate`
- `part.switch.channel`
- `part.switch.source`
- `part.switch.drain`
- `part.switch.oxide`
- `what.switch.channel`
- `here.switch`
- `stop.fail.switch.q`
- `stop.make.switch.tried`
- `stop.know.switch.q`
- `stop.know.switch.note`
- `stop.know.switch.tried`
- `stop.life.switch.note`

Checked for confusion only, and fine: `part.rack.switch` ("network switch") and `what.rack.switch`. Both rack texts, and `depth.rack.see`, always say "network switch", so they do not collide with the transistor level.

## Open risks

- **One picture for three worlds.** The switch depth is shared by the data centre, phone and car dives. A nanosheet is right for a 2 nm data-centre or phone chip, but a car microcontroller on an older process has flat switches. The suggested `depth.switch.see` says "in the newest chips"; whether the car dive should say more is a design decision, not a wording one.
- **Fins and sheets disagree elsewhere.** `chipx.yours.etch` (out of scope) says your transistors "are etched here, as fins", while this level shows sheets, and `here.switch` says "switches like this one" about a design built on a 130 nanometre library, where switches are flat. Not wrong enough to flag `here.switch`, but the three should tell one story.
- **"Identical" switches at the gate level.** `stop.think.gate.note` (out of scope) says the four switches in a gate are identical. In a real gate two are of one kind and two of the other, which is exactly what `stop.scale.switch.tried` relies on. Worth settling when the gate level is reviewed; my suggested wording for the two kinds is a stopgap.
- **Three names for one layer.** "Insulating skin" (switch), "oxide wall" (atom) and "walls" (`chip.show.*`, `chip.gen.notice`). I flagged only the in-scope key; the others will need the same choice.
- **The leak model.** I judged `chip.show.switch` on its words. Whether the engine's 1.8× per generation should change is outside this review; the suggested text is true whatever the constant is, as long as newer means leakier in the model. In real fin and sheet generations, leakage per switch was held roughly level by design, so the model's direction is itself a simplification.
- **Source and drain wording.** "Moving charges" is correct for both kinds of switch but less concrete than "electrons", which the atom level uses. If the picture shows only an n-type switch, "electrons" would be plainer.
- **Stop text and the figures test.** `npm test` checks that a number in a stop's words has an entry in `FIGURES`. My suggestions add no digits, but I did not run the tests and do not know whether number words ("thousand", "billions", "three") are checked.
- **Simplifications I let stand.** "A synapse stores and computes in the same place" and "the connections that hold memories are the ones that do the computing" are the standard simplification, not settled neuroscience in detail. "AI learns from recorded data" ignores learning by simulation or experiment; it is fair for the point being made.
- **No outside check.** Thickness, date and material statements above are from general knowledge, not looked up. Each should be confirmed when its `facts.json` entry is written.
