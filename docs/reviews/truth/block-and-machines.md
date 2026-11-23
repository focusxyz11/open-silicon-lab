# Is it true? The block and Machines from shared blocks

Audited 2026-11-23 for #324, against `main` at d8fb5dc (after #320, Machines as a live block diagram, and #316, Listen).
Auditor: Claude Opus 5.5, asked by the nightly build; no chip engineer has checked it yet. **Please break it**: every
row below names its source, so a wrong verdict can be shown wrong. Open a *Break it* report (⚑) at the place, or an
issue that names the text's key.

## The method

Anyone can run it again on the next slice of the lab. It has six steps; the first two are mechanical, so two people
running them get the same list.

1. **Gather every text in scope, by rule, from the word files.** The texts shown at a place are named by prefix
   (`AREAS` in `src/core/i18n.js`). For this slice the rules were:
   - *the level*: `depth.block.*`, `part.block.*`, `what.block.*`, `seek.block.*`, `here.block`, `stop.<thread>.block.*`,
     `chip.show.block`;
   - *the lenses*: `frame.at.<lens>.block.*`, every `frame.q.*` and `frame.meet.*` (a pair can be held at any level that
     has both), and the lenses' instruments `lp.*`;
   - *the field*: the questions whose home is the block (`fieldAtLevel('block')` in `src/data/questions.js`: `wear`,
     `fetch`);
   - *Listen*: `hear.*` and its ear test `ear.*`;
   - *the labs played at the block* (`CHALLENGES` with `at: 'block'` in `src/v2/game.js`, and the question to build whose
     home is the block, `QUESTIONS` in `src/data/atlas.js`): `game.ch.{cim,power-curve,chef,ear}.*`, `cim.*`, `ckp.*`,
     `mb.*` (Keep the chef busy);
   - *Machines*: `machines.*`, and the layers it opens, `curve.*`, `liquid.*`, `fab.{ui,name,claim}.*`, `invent.*`.

   Two texts the browser showed in a lens card were added by hand (`exp.think-slice.ask`, `field.perfect.q`): 933
   texts. Applying the rules is a short script over every `src/i18n/en/*.json`; anyone can rewrite it from the list.
2. **Check the rules caught what is really shown.** The page was opened in a browser with `t()` wrapped so it records
   every key it reads (Playwright, intercepting `src/core/i18n.js`), and every mode (Look, Do, Ask), every lens, every
   pair of lenses, every control at its far end, and Listen with each state were pressed at `#/dive/block`. Every
   content key it recorded is in the list but two, added below (the rest are the bar, the loop, names and buttons). What a browser cannot reach
   unaided (a challenge played to its end, the ear test's answers) was read in its view's code.
3. **Sort each text: a claim, or not.** A claim is anything that could be false: how chips work, a number, history, who
   said what, a property of a product, or a statement about the lab's own model. Not claims: names, controls, units,
   prompts ("Play another"), and questions with no premise. A question *with* a premise ("A brain runs on about the power
   of a light bulb. What does it do...?") is checked for its premise. Every text not judged a claim is listed by key
   under its table, so the sorting itself can be argued with.
4. **Check each claim against a source, strongest first**: a paper, a datasheet or a maker's own page (said as the
   maker's claim), a textbook; or, for a claim about the lab's model, the engine itself, run (the numbers in Listen, the
   power curve and the chef were computed tonight from `src/engines/`). Where only general knowledge stood behind a
   verdict and no page was opened, the row says so.
5. **Give one verdict:**
   - **Right**, with its source;
   - **Right: the lab's model**: it says what an engine computes, the engine was run or read, and the page says
     elsewhere that it is a model;
   - **Needed a condition: rewritten**: true only with a condition the words left out; the words now carry it;
   - **Simplification: said on screen**: the lab chooses to tell it simpler than it is; the words now say so;
   - **Wrong: fixed**: false as written; the words are fixed;
   - **Not verified: marked**: no source found tonight. Guesses the lab labels as guesses on screen are here too.
6. **Fix, and leave a trace.** Words change in `src/i18n/en/`; a number gets an entry in `src/data/facts.json` (with
   its source, the date it was checked and its kind) and, at a stop, a line in `FIGURES` (`src/data/weave.js`), which
   `npm test` holds. An engine's model changes only if the model itself is wrong, with a test. Each changed row shows
   what it said before.

**What this method cannot catch.** It checks sentences one by one, so a picture that misleads with no words (a size
drawn wrong, an arrow that points the wrong way) is caught only when a number is said beside it, as the block's size was. It
trusts the facts already in `facts.json` where their source was not reopened tonight (each row says which). It cannot
judge emphasis: a page where every sentence is true can still give the wrong idea of what matters most.

## Summary

Of 933 texts, 266 carry a claim. **118 right, 85 right as the lab's model, 23 needed a condition (rewritten), 21
simplifications now said on screen, 9 wrong (fixed), 10 not verified (marked)**, nearly all of them the guesses the
lab already labels as guesses. One claim on screen that is not a word was also wrong: the block's size. 37 texts
changed; nothing was left unchecked.

### The fixes, worst first

1. **The block's size was 50 times too small.** At the block the rail said *Block · 10 µm across*. A square 10 µm
   across holds under a thousand standard cells (about 0.1 µm² each, packed to 70%), yet `here.block` says a block holds
   hundreds of thousands, and the studio's own 130 nm cells (`what.block.yours`) could not fit 40 of them in it. A real
   block is from about a tenth of a millimetre to a few millimetres across. `DEPTHS.block.m` is now 0.2 mm (`src/data/
   weave.js`); it is only the size the rail says and the lenses measure in (the zoom runs on the portals), and a test
   now holds it to what the words say.
2. **Heat's noise in the clean-1 chain, and in Listen, is far larger than in a real chip** (`frame.meet.dig.physics.true`,
   `hear.idle`, `hear.state.hot`, `ear.why.hot`, the `lp.chain.step.*`). The model (`cleanOne` in `src/engines/lens.js`)
   puts the noise on a wire at 2% of its swing at 25 °C and grows it with the square root of the silicon's own carriers,
   to 24% at 105 °C, where a bit is misread every few ticks. Real thermal noise on a logic node is about 0.3% of the
   swing and grows only as the square root of the absolute temperature; hot chips go wrong mostly because signals arrive
   late (and wear out faster), not because the wire shakes. The direction (heat adds noise; a bigger swing buys margin
   at the square of the voltage) is right. The words now say the chain draws the shaking far larger than life; the
   model is left to the owner (below).
3. **Check bits** (`lp.chain.kept`, `lp.chain.step.kept`): said two wrong bits in a word "get past the check bits". With
   8 check bits for 64 (the engine's 72 for 64) one wrong bit is corrected and two are *detected*. Now: too many to
   correct.
4. **Half the power** (`frame.at.eff.block.q`): said "slow the clock where nothing is changing and the same work takes
   half the power", which mixes stopping the clock with lowering the voltage. In the lab's own power curve, half the
   power buys three quarters of the speed. Now said so.
5. **Landauer's floor** (`mb.wall.floorD`, `mb.wall.kFloor`): said the least that *writing* a bit can cost; the floor is
   for *erasing* one. (`invent.wall.floor` already said erasing.)
6. **Flexible chips are not printed** (`fab.name.flexible.d`, `machines.do.why.radio.week`,
   `machines.do.why.wildfire.week`): Pragmatic's thin-film chips are patterned with photolithography on plastic film.
   The last also said energy is counted "as if made at the finest lines", where the engine and `fab.ui.note` count 45 nm.
7. **The counter's slowest path** (`ckp.c.legend`, at the gate, found on the way): labelled the XOR as the carry; the
   ANDs make the carry, the XOR the sum.
8. Conditions added where a claim was true only sometimes: thinner wires wear faster *at the same current*; *many* AI
   chips spend more energy moving data; two *NOT* gates in a ring hold a bit; a far memory makes the logic wait *unless
   it has other work*; analog sums differ *a little, from chip to chip and run to run* (not "never the same twice");
   converter cost *roughly* doubles a bit; a voter masks a fault *in one copy*; spiking parts spend *mostly* on events;
   reversible logic takes back *much* of a step's energy; cells share one height *(a few span two rows)*; programs place
   *most* of the parts; HBM sits on *a slab or bridge* of silicon; Wright's law forecast best *among six laws*; it is the
   *switches on a chip* that double; the FPGA gap was measured *at 90 nm, for logic alone*; DARPA's 50 ns is *an aim* and
   "nearly a circuit's energy" *a guess*; neurons on a chip *can be trained on simple tasks*; the lenses' energy per
   answer is *served one at a time* (about 10,000 J in the engine, against a measured median of about 860 J for an
   answer served among many people).
9. Simplifications now said on screen: the front of Geometry and Efficiency is *this model's*; Machines' 500 times is one
   study's gap for video, *often smaller for other jobs*; the chef's model is *made to be* right in direction, not
   promised to be.

### New and rechecked figures (`src/data/facts.json`)

- `clock-power-share` (new): the clock network takes 30% to 40% of a design's power, about half at small nodes
  (Semiconductor Engineering). Now behind `stop.life.block.note` in `FIGURES`.
- `vaire-thirty` (new): the reversible test chip used about 30% less energy than a regular one (Science News), which
  agrees with the factor of 1.41 that `invent.claim.revChip` rests on.
- `asic-vs-cpu` (rechecked against the CACM text): 500 times, a four-processor general-purpose chip against a custom
  one for 720p H.264 encoding, 90 nm; one study, one job.

## Left for the owner

- **The clean-1 model** (`cleanOne` in `src/engines/lens.js`, used by the Digital-meets-physical lens, the chain of
  Fight-or-use-physics with it, and Listen's *too hot* state). It is wrong in size, not in direction. Fixing it so that
  heat breaks bits the way it does in real chips (signals made late, through the power curve's own delay model) would
  change two lenses, Listen, the ear test and two smoke checks that ask for wrong bits when hot. That is a redesign,
  not a wording fix, so tonight only the words say it; a follow-up issue should decide it.
- **The energy of one answer** (the Efficiency lens and the front, from `src/engines/budget.js`): about 10,000 J, for
  one person served at a time with 45 nm energies. Google's measured median is 0.24 Wh (about 860 J). The label now
  says one at a time; whether the lens should start from a served batch, closer to what people meet, is a choice.
- **Cells in a block** (`here.block`): right by design knowledge, but no single published figure was found tonight.
- **The field question `wear`** links to Wikipedia; Black's 1969 paper itself is the better source (data, not words:
  `src/data/questions.js`).
- **Engine comments** that repeat a fixed error: `src/engines/bits.js` says "every bit written costs at least kT ln 2"
  (it is erasing); `src/data/weave.js` now explains the block's size.
- **Not reopened tonight**: the facts the rows cite that were checked on an earlier date (their `verified` date says
  when), and the general-knowledge rows (marked as such in their source). A chip engineer reading those rows is the
  next check.

## Outside this audit

The leak `secret` sits on the seam between the chip and the block but lives at the chip, so it was not audited here;
nor were the gate-level words the block's pairs of lenses lead to. The lens models (`src/engines/lens.js`) were read for
what their words claim, not re-derived; the machines engine's numbers were checked where a word states them.

## Every claim, with its verdict

### block: the level (30 texts: 24 with a claim)

| Text | What it says | Verdict | Source, and what changed |
| --- | --- | --- | --- |
| `chip.show.block` | Each switch takes {area}× the space it takes in the starting chip, so {density}× as many cells fit here. For each multiply and add your chip does, {moving}% of the energy goes to fetching the numbers from memory, not to the ari… | Right: the lab's model | [pedram](#source-pedram). Reviewed 2026-11-13 (docs/reviews/block-level.md); the share is of one multiply-add, as it now says. |
| `depth.block.see` | Inside one block, one working part of the chip: rows of small ready-made circuits called standard cells, and a grid of memory, joined by wires. | Right | [lib](#source-lib) |
| `here.block` | Your design, {job}, became {cells} cells of the same kind as these. A block like this holds hundreds of thousands or more, placed and wired by programs, as yours were. | Not verified: marked | [ispd](#source-ispd). Right in order of magnitude by design knowledge; no single published figure found tonight. No digit, so no figure is required. It now agrees with the block's size on the rail (fixed below). |
| `seek.block.cells` | Every standard cell in a row has the same height, so a program can line them up like books on a shelf. | Right | [lib](#source-lib). True per row: a double-height cell spans two rows of the same height. |
| `seek.block.sram` | Each cell of this grid holds one bit, and only for as long as the power stays on. | Right | [sram](#source-sram) |
| `seek.block.wires` | The wires run on many layers above the cells, so they can cross each other without touching. | Right | [pnr](#source-pnr) |
| `stop.divide.block.note` | Fetching a number can cost more energy than computing with it. | Right | [pedram](#source-pedram). Holds for memory chips (640 pJ against 0.18 pJ) and on-chip memory (8 to 11 pJ). |
| `stop.divide.block.q` | Memory and logic sit apart, joined by busy wires. Was separating them a mistake? | Right | [horowitz](#source-horowitz) |
| `stop.divide.block.tried` | computing inside the memory · stacking memory on top of logic | Right | [horowitz](#source-horowitz). Both are pursued (compute in memory; memory stacked on logic, e.g. AMD 3D V-Cache). |
| `stop.idea.block.note` | **Now:** People describe what the chip should do. Programs decide where most of the parts go.<br>**Was:** People describe what the chip should do. Programs decide where the parts go. | Needed a condition: rewritten | [pnr](#source-pnr). Said programs decide where "the parts" go; people still plan the floor and place large memories and analog parts. Now "most of the parts". |
| `stop.idea.block.q` | Nobody placed these cells by hand. If software arranged them, who is the designer? | Right | [pnr](#source-pnr) |
| `stop.idea.block.tried` | AI that places and wires chips · describing a chip in plain words | Right | [pnr](#source-pnr). AI placement (published, and argued over) and describing hardware in plain words to a model are both tried. |
| `stop.life.block.note` | Almost every chip marches to a clock. Designers stop it wherever a part is idle, yet the clock that is left still takes a large share of the chip's power. | Right | [clock](#source-clock). "A large share" now has a figure behind it: 30% to 40% of total power, about half at small nodes (added to FIGURES life.block). |
| `stop.life.block.q` | Brain cells signal mostly when something changes. Chips already stop the clock to parts with nothing to do. What if a chip had no clock at all, and each part worked only when news arrived? | Right | [clock](#source-clock). Reviewed 2026-11-13. |
| `stop.life.block.tried` | brain-like chips that send a spike only when something changes · circuits with no clock at all · stopping the clock to idle parts | Right | [hala](#source-hala). Spiking chips (Hala Point), circuits with no clock (asynchronous logic) and clock gating all exist. |
| `stop.open.block.note` | Software grew this way: people building on each other's pieces. | Right | [frame](#source-frame) |
| `stop.open.block.q` | An open block can be reused by anyone as a description, but its layout fits only one factory's process. What would let open chip parts spread the way open software did? | Right | [pnr](#source-pnr). A hard block's layout is drawn for one process. |
| `stop.open.block.tried` | open cell libraries · open design kits: a factory's rules for drawing a chip, published · open RISC-V cores that anyone can reuse · shared chip runs that split the cost | Right | [pnr](#source-pnr). Open libraries and kits (SkyWater 130, GF180), open RISC-V cores, shared runs: in facts (`sky130-pdk`, `gf180-pdk`, `tt-next-shuttle`). |
| `stop.think.block.note` | Join a pair of NOT gates in a ring, each feeding the other, and the pair holds whichever value it was last pushed into. | Right | [sram](#source-sram) |
| `stop.think.block.q` | A memory cell here is a loop that holds one bit. Is remembering part of thinking, or something separate? | Right | [sram](#source-sram) |
| `what.block.cells` | **Now:** Small ready-made circuits from a library: logic gates, and flip-flops that each remember one bit. They share one height (a few span two rows), so they line up in rows.<br>**Was:** Small ready-made circuits from a library: logic gates, and flip-flops that each remember one bit. All have the same height, so they line up in rows. | Needed a condition: rewritten | [lib](#source-lib). Said every cell has the same height; a few span two rows. Rewritten. |
| `what.block.sram` | A grid of memory cells, each a small loop of switches that holds one bit while the power is on. This kind of memory is called SRAM. Its cells are drawn by hand and are not standard cells. | Right | [sram](#source-sram). The bit cells are drawn by the foundry; the array around them is generated by a memory compiler (partfacts says a program drew the array: both hold). |
| `what.block.wires` | Metal lines on many levels above the cells, connecting them. | Right | [pnr](#source-pnr) |
| `what.block.yours` | Your design from the studio, as it would sit in this block: rows of standard cells of the same kind as these, only larger, placed and wired by the same kind of program. The outline shows up to 40 of its cells. | Right: the lab's model | [pnr](#source-pnr). The 40-cell cap is in src/app/scenes.js. With the block at 10 µm the studio's 130 nm cells could not fit; at 0.2 mm they do (see the size below). |

No claim to check (names, controls, units, prompts, questions with no premise, the lab's own instructions): `depth.block.name`, `part.block.cells`, `part.block.sram`, `part.block.wires`, `part.block.yours`, `seek.block.find`.

### block: lenses (224 texts: 33 with a claim)

| Text | What it says | Verdict | Source, and what changed |
| --- | --- | --- | --- |
| `exp.think-slice.ask` | Your one-bit slice, copied 32 times, runs real programs. Where did the arithmetic come from? | Right: the lab's model | [core32](#source-core32). Shown in a lens card at the block: the core lab builds a 32-bit core from 32 copies of the learner's one-bit slice and runs programs on it. |
| `field.perfect.q` | Why does a perfect design fail in the real world? | Right | [cases](#source-cases). Shown in the Perfect fails lens. Premise: designs that pass every check still fail (the real cases in `CASES`, src/data/weave.js). |
| `frame.at.eff.block.note` | Switching energy grows with the square of the voltage, and a slower clock can run at a lower voltage. | Right | [cmos](#source-cmos) |
| `frame.at.eff.block.q` | **Now:** Slow the clock and lower the voltage with it, and the chip draws half the power while still doing three quarters of the work. What will the saving be spent on?<br>**Was:** Slow the clock where nothing is changing and the same work takes half the power. What will the saving be spent on? | Wrong: fixed | [power](#source-power). Said "slow the clock where nothing is changing and the same work takes half the power": that mixes clock gating with voltage scaling, and the same work does not take half; half the power buys three quarters of the speed (2.25 GHz against 3, in the engine), about a third less energy for the same work. Rewritten to say that. |
| `frame.at.physics.block.note` | **Now:** Compute in memory multiplies each input by the weight stored in place and adds the results on a wire; its catch is noise, and converters that cost more for every bit.<br>**Was:** Compute in memory adds stored weights in place; its catch is noise, and converters that cost more for every bit. | Needed a condition: rewritten | [ohm](#source-ohm). Said compute in memory "adds stored weights"; it multiplies each input by a stored weight and adds the products. Rewritten. |
| `frame.at.physics.block.q` | Sum the numbers where they are stored, as currents in a memory array. Let physics do the arithmetic, noise and all? | Right | [ohm](#source-ohm) |
| `frame.meet.copy.dig.true` | **Now:** Two NOT gates feeding each other in a ring hold whichever value was last pushed into them: that is a bit of memory.<br>**Was:** Two gates feeding each other in a ring hold whichever value was last pushed into them: that is a bit of memory. | Needed a condition: rewritten | [sram](#source-sram). Said "two gates"; two AND gates in a ring do not hold a value as two NOT gates do. Now "two NOT gates". |
| `frame.meet.copy.eff` | twenty watts and a power plant | Simplification: said on screen | [brain](#source-brain). A heading: "a power plant" stands for the power of a large AI data centre; no number is claimed. |
| `frame.meet.copy.eff.q` | A brain runs on about the power of a light bulb. What does it do that a chip does not? | Right | [brain](#source-brain). About 20 W: a dim light bulb. |
| `frame.meet.copy.eff.true` | Moving a number costs far more energy than adding with it, so where a machine keeps its memory decides what each answer costs. | Right | [pedram](#source-pedram) |
| `frame.meet.copy.geo.true` | **Now:** The farther the memory sits from the logic, the longer every number's trip, and the more of the logic's time is spent waiting, unless it has other work to do meanwhile.<br>**Was:** The farther the memory sits from the logic, the longer every number's trip, and the more of the logic's time is spent waiting. | Needed a condition: rewritten | [wm](#source-wm). Waiting can be hidden by other work (caches, many threads, prefetching). Condition added. |
| `frame.meet.copy.physics.true` | **Now:** Exact bits in an array, sums done by gates, copy perfectly; weights kept in each cell, sums made by currents meeting on a wire, cost far less energy but come out a little different on every chip, and from one run to the next.<br>**Was:** Exact bits in an array, sums done by gates, copy perfectly; weights kept in each cell, sums made by currents meeting on a wire, cost far less and never come out the same twice. | Needed a condition: rewritten | [cimE](#source-cimE). Said analog sums "never come out the same twice"; after the converter many come out the same. What holds: they differ a little from chip to chip and run to run. Rewritten; "cost far less" now says energy. |
| `frame.meet.copy.vn.q` | Should a damaged chip stop, or keep going and get a little worse, as a brain does? | Right | [frame](#source-frame). Brains lose function gradually with damage: a fair premise. |
| `frame.meet.dig.line.q` | If the same switches wired differently make different logic, where does the meaning of a circuit live? | Right | [frame](#source-frame) |
| `frame.meet.dig.physics.true` | **Now:** A 1 is only a voltage above a line: heat shakes the wire, and a bigger swing keeps the 1 clean at the price of energy. The chain draws the shaking far larger than in a real chip, where heat turns bits wrong mostly by making sig…<br>**Was:** A 1 is only a voltage above a line: heat shakes the wire, and a bigger swing keeps the 1 clean at the price of energy. | Simplification: said on screen | [thermal](#source-thermal). The principle is right (noise grows with temperature; a bigger swing buys margin at V² in energy). The chain's model (lens.js cleanOne) sets wire noise at 2% of the swing at 25 °C and grows it with the square root of the silicon's own carriers, to 24% at 105 °C: a real node's thermal noise is about 0.3% and grows only as sqrt(T). Real hot chips go wrong mostly through late signals. Now said on screen; the model itself is left for the owner (see "Left for the owner"). |
| `frame.meet.eff.geo.true` | **Now:** Packing the logic beside the memory shortens every trip but piles up the heat: in this model, every point on the line is one of today's best compromises.<br>**Was:** Packing the logic beside the memory shortens every trip but piles up the heat: every point on the line is a best compromise of today. | Simplification: said on screen | [lens](#source-lens). The front is the lens model's (lens.js geoEffFront), not measured chips. Now says "in this model". |
| `frame.meet.eff.line.q` | A part built for one job wastes less energy on it. Is that worth losing every other job? | Right | [hameed](#source-hameed) |
| `frame.meet.eff.moore.q` | If each switch keeps getting cheaper to run, why does the world use more energy on them? | Right | [frame](#source-frame). Premise: computing's total energy grows as each operation gets cheaper (facts `dc-electricity`, Jevons' bet). |
| `frame.meet.eff.physics.true` | Switching energy grows with the square of the voltage, so a lower voltage saves energy, if the chip can wait for the slower switch. | Right | [cmos](#source-cmos) |
| `frame.meet.human.moore.q` | If every new generation costs more to make, how many people will still be able to make chips at all? | Right | [frame](#source-frame). Premise: each generation costs more to make (facts `design-cost-2nm`, `fab-module-cost`). |
| `frame.meet.line.moore.q` | When shrinking slows, is building special chips the new way to get faster? | Right | [frame](#source-frame). Premise: shrinking has slowed. |
| `frame.meet.moore.physics.q` | When a part is a few dozen atoms long, does shrinking it further still make it better? | Right | [frame](#source-frame). Premise: today's smallest features are a few dozen atoms across (a 5 nm sheet is about 20 silicon atoms). |
| `lp.chain.kept` | **Now:** Words too wrong to correct<br>**Was:** Words kept wrong | Wrong: fixed | [secded](#source-secded). Said "words kept wrong" for words with two wrong bits; 72-for-64 check bits detect two wrong bits, they only cannot correct them. Now "words too wrong to correct" (the engine counts two or more). |
| `lp.chain.step.heat` | It runs hot | Simplification: said on screen | [thermal](#source-thermal). One link of the chain drawn larger than life, as dig.physics now says. |
| `lp.chain.step.kept` | **Now:** Two bits go wrong in one word: too many to correct<br>**Was:** A wrong bit gets past the check bits | Wrong: fixed | [secded](#source-secded). Said "a wrong bit gets past the check bits". Now: two bits go wrong in one word, too many to correct. |
| `lp.chain.step.misread` | A gate misreads a bit | Simplification: said on screen | [thermal](#source-thermal). As above. |
| `lp.chain.step.shake` | The wire shakes | Simplification: said on screen | [thermal](#source-thermal). As above. |
| `lp.eff.m.energy` | **Now:** Energy per answer, served one at a time<br>**Was:** Energy per answer | Needed a condition: rewritten | [answer](#source-answer). The lens shows about 10,000 J an answer: the budget engine's answer from a 70-billion-weight model, 500 words, served to one person at a time from HBM with 45 nm energies. Google measured a median 0.24 Wh (about 860 J) for a served prompt, which shares the chips among many people. The label now says one at a time; the engine's 45 nm energies are high, as its own comments say. |
| `lp.front.energy` | **Now:** Energy per answer, served one at a time<br>**Was:** Energy per answer | Needed a condition: rewritten | [answer](#source-answer). As lp.eff.m.energy. |
| `lp.front.nobody` | Shaded: nobody here yet | Right: the lab's model | [lens](#source-lens) |
| `lp.front.today` | Dashed: today's best compromises | Right: the lab's model | [lens](#source-lens) |
| `lp.physics.m.fight` | Fight: energy per sum, with check bits | Right: the lab's model | [secded](#source-secded). The engine adds 72/64 for the check bits. |
| `lp.physics.m.use` | Use: energy per sum, adding with currents | Right: the lab's model | [cimE](#source-cimE) |

No claim to check (names, controls, units, prompts, questions with no premise, the lab's own instructions): `frame.meet.copy.dig`, `frame.meet.copy.dig.open`, `frame.meet.copy.dig.q`, `frame.meet.copy.eff.open`, `frame.meet.copy.geo`, `frame.meet.copy.geo.open`, `frame.meet.copy.geo.q`, `frame.meet.copy.nat`, `frame.meet.copy.nat.open`, `frame.meet.copy.nat.q`, `frame.meet.copy.physics`, `frame.meet.copy.physics.open`, `frame.meet.copy.physics.q`, `frame.meet.copy.vn`, `frame.meet.copy.vn.open`, `frame.meet.dig.line`, `frame.meet.dig.line.open`, `frame.meet.dig.physics`, `frame.meet.dig.physics.open`, `frame.meet.dig.physics.q`, `frame.meet.dig.vn`, `frame.meet.dig.vn.open`, `frame.meet.dig.vn.q`, `frame.meet.eff.geo`, `frame.meet.eff.geo.open`, `frame.meet.eff.geo.q`, `frame.meet.eff.line`, `frame.meet.eff.line.open`, `frame.meet.eff.moore`, `frame.meet.eff.moore.open`, `frame.meet.eff.physics`, `frame.meet.eff.physics.open`, `frame.meet.eff.physics.q`, `frame.meet.eff.sutton`, `frame.meet.eff.sutton.open`, `frame.meet.eff.sutton.q`, `frame.meet.geo.line`, `frame.meet.geo.line.open`, `frame.meet.geo.line.q`, `frame.meet.geo.moore`, `frame.meet.geo.moore.open`, `frame.meet.geo.moore.q`, `frame.meet.geo.perfect`, `frame.meet.geo.perfect.open`, `frame.meet.geo.perfect.q`, `frame.meet.human.line`, `frame.meet.human.line.open`, `frame.meet.human.line.q`, `frame.meet.human.moore`, `frame.meet.human.moore.open`, `frame.meet.human.sutton`, `frame.meet.human.sutton.open`, `frame.meet.human.sutton.q`, `frame.meet.human.trust`, `frame.meet.human.trust.open`, `frame.meet.human.trust.q`, `frame.meet.line.moore`, `frame.meet.line.moore.open`, `frame.meet.line.sutton`, `frame.meet.line.sutton.open`, `frame.meet.line.sutton.q`, `frame.meet.moore.perfect`, `frame.meet.moore.perfect.open`, `frame.meet.moore.perfect.q`, `frame.meet.moore.physics`, `frame.meet.moore.physics.open`, `frame.meet.nat.physics`, `frame.meet.nat.physics.open`, `frame.meet.nat.physics.q`, `frame.meet.nat.sutton`, `frame.meet.nat.sutton.open`, `frame.meet.nat.sutton.q`, `frame.meet.perfect.physics`, `frame.meet.perfect.physics.open`, `frame.meet.perfect.physics.q`, `frame.meet.perfect.trust`, `frame.meet.perfect.trust.open`, `frame.meet.perfect.trust.q`, `frame.meet.perfect.vn`, `frame.meet.perfect.vn.open`, `frame.meet.perfect.vn.q`, `frame.meet.sutton.trust`, `frame.meet.sutton.trust.open`, `frame.meet.sutton.trust.q`, `frame.meet.trust.vn`, `frame.meet.trust.vn.open`, `frame.meet.trust.vn.q`, `frame.q.copy`, `frame.q.copy.hint`, `frame.q.dig`, `frame.q.dig.hint`, `frame.q.eff`, `frame.q.eff.hint`, `frame.q.geo`, `frame.q.geo.hint`, `frame.q.human`, `frame.q.human.hint`, `frame.q.line`, `frame.q.line.hint`, `frame.q.moore`, `frame.q.moore.hint`, `frame.q.nat`, `frame.q.nat.hint`, `frame.q.perfect`, `frame.q.perfect.hint`, `frame.q.physics`, `frame.q.physics.hint`, `frame.q.sutton`, `frame.q.sutton.hint`, `frame.q.trust`, `frame.q.trust.hint`, `frame.q.vn`, `frame.q.vn.hint`, `lp.chain.at`, `lp.chain.energy`, `lp.chain.hi`, `lp.chain.lit`, `lp.chain.lo`, `lp.chain.misread`, `lp.chain.noise`, `lp.chain.swing`, `lp.chain.unlit`, `lp.copy.at`, `lp.copy.ctl`, `lp.copy.hi`, `lp.copy.lo`, `lp.copy.m.copied`, `lp.copy.m.energy`, `lp.copy.m.own`, `lp.dig.at`, `lp.dig.ctl`, `lp.dig.hi`, `lp.dig.lo`, `lp.dig.m.wrong`, `lp.eff.at`, `lp.eff.ctl`, `lp.eff.hi`, `lp.eff.lo`, `lp.eff.m.answers`, `lp.eff.m.power`, `lp.fork.at`, `lp.fork.computes`, `lp.fork.copied`, `lp.fork.drag`, `lp.fork.energy`, `lp.fork.exact`, `lp.fork.off`, `lp.fork.shi`, `lp.fork.slo`, `lp.fork.split`, `lp.front.aria`, `lp.front.dot`, `lp.front.heat`, `lp.front.moved`, `lp.front.n`, `lp.front.nat`, `lp.front.nhi`, `lp.front.nlo`, `lp.front.x`, `lp.front.y`, `lp.geo.at`, `lp.geo.ctl`, `lp.geo.hi`, `lp.geo.lo`, `lp.geo.m.heat`, `lp.geo.m.trip`, `lp.human.ctl`, `lp.human.m.drawn`, `lp.human.m.longest`, `lp.human.m.pass`, `lp.human.m.shortest`, `lp.human.pick`, `lp.human.yours`, `lp.joules`, `lp.none`, `lp.oneIn`, `lp.pct`, `lp.perfect.at`, `lp.perfect.ctl`, `lp.perfect.hi`, `lp.perfect.lo`, `lp.perfect.m.late`, `lp.physics.at`, `lp.physics.ctl`, `lp.physics.hi`, `lp.physics.lo`, `lp.physics.m.off`, `lp.pj`, `lp.times`, `lp.tracks`, `lp.um`.

### block: field (8 texts: 8 with a claim)

| Text | What it says | Verdict | Source, and what changed |
| --- | --- | --- | --- |
| `field.fetch.open` | **Now:** Many AI chips spend more energy moving data than computing with it.<br>**Was:** AI chips spend most of their energy moving data. | Needed a condition: rewritten | [horowitz](#source-horowitz). Said AI chips spend "most of their energy" moving data: true for many, not all (it depends on the model, the batch and where the weights live). Rewritten to "many ... more energy moving data than computing". |
| `field.fetch.opened` | Computing next to the memory, or inside it. | Right | [horowitz](#source-horowitz) |
| `field.fetch.q` | Why does fetching a number cost far more than using it? | Right | [horowitz](#source-horowitz) |
| `field.fetch.who` | Mark Horowitz, 2014, after John Backus, 1977 | Right | [backus](#source-backus). Horowitz 2014 is the field question's source; Backus named the bottleneck in his 1977 Turing lecture (printed 1978). |
| `field.wear.open` | **Now:** Thinner wires carrying the same current wear out faster.<br>**Was:** Thinner wires wear out faster. | Needed a condition: rewritten | [black](#source-black). Black's law: life falls with current density. A thinner wire wears faster at the same current, not in itself. Rewritten. |
| `field.wear.opened` | Designing every wire to last a lifetime. | Right | [black](#source-black). Wires are sized by electromigration rules for a target lifetime. |
| `field.wear.q` | Why does a chip that never moves wear out? | Right | [black](#source-black) |
| `field.wear.who` | James Black, 1969 | Right | [black](#source-black) |

No claim to check (names, controls, units, prompts, questions with no premise, the lab's own instructions): .

### block: listen (40 texts: 14 with a claim)

| Text | What it says | Verdict | Source, and what changed |
| --- | --- | --- | --- |
| `ear.hint` | Listen for three things: gaps between the soft blips (waiting), how fast the ticks come (saving power), and sharp clicks over a higher hum (too hot). Busy has none of them. | Right: the lab's model | [ear](#source-ear) |
| `ear.why.busy` | A sum on every tick, and the fetches hidden behind the work. | Right: the lab's model | [ear](#source-ear) |
| `ear.why.hot` | A louder, higher hum, more hiss, and sharp clicks: wrong bits. | Simplification: said on screen | [thermal](#source-thermal). As hear.idle. |
| `ear.why.saving` | The ticks come half as fast, and the hum is low and quiet. | Right: the lab's model | [ear](#source-ear). Saving power is half the clock at the lowest voltage it runs on (1.5 GHz, 0.5 V, 11.5 W). |
| `ear.why.wait` | A thump, then gaps: the work stops while the data travels. | Right: the lab's model | [ear](#source-ear) |
| `hear.ev.fetch` | Fetching from memory, while the work goes on | Right: the lab's model | [ear](#source-ear) |
| `hear.ev.wait` | Fetching from memory… the work waits | Right: the lab's model | [ear](#source-ear) |
| `hear.ev.work` | Working: a sum on every tick | Right: the lab's model | [ear](#source-ear) |
| `hear.ev.wrong` | A wrong bit | Right: the lab's model | [ear](#source-ear) |
| `hear.idle` | **Now:** The clock ticks; each sum is a soft blip; a fetch from memory is a deep thump; heat is a hum; noise on the wires is a hiss; a wrong bit is a sharp click. The hiss and the clicks are made far stronger than a real chip's, so they…<br>**Was:** The clock ticks; each sum is a soft blip; a fetch from memory is a deep thump; heat is a hum; noise on the wires is a hiss; a wrong bit is a sharp click. | Simplification: said on screen | [thermal](#source-thermal). The hiss and the clicks come from the clean-1 chain (see dig.physics below), whose noise is far larger than a real chip's. Now said: they are made far stronger than a real chip's, so they can be heard. |
| `hear.loud` | Loudness follows energy: a fetch from memory here costs about {n} times a sum, so its thump carries {n} times the sound energy of a blip. | Right: the lab's model | [ear](#source-ear). n is 47 in the engine: a 16-bit fetch from on-chip memory at the end of a 10 mm wire (38 pJ) against a multiply-add (0.82 pJ). Real 45 nm figures give 25 to 50 times (8 to 11 pJ for the read, about 0.2 pJ a bit a millimetre for the wire): right in size. |
| `hear.scale.block` | One second of sound here is one nanosecond of the chip: everything is slowed down a billion times. | Right | [ear](#source-ear). One second against one nanosecond is a billion (10^9). |
| `hear.short.block` | 1 second of sound is 1 nanosecond of the chip. | Right | [ear](#source-ear) |
| `hear.state.hot` | Too hot, bits going wrong | Simplification: said on screen | [thermal](#source-thermal). See hear.idle: wrong bits from heat are real (through late signals and wear), but not at this rate and not through this noise. |

No claim to check (names, controls, units, prompts, questions with no premise, the lab's own instructions): `ear.again`, `ear.ask`, `ear.cover`, `ear.g.of`, `ear.g.right`, `ear.hidAria`, `ear.next`, `ear.nosound`, `ear.picAria`, `ear.play`, `ear.right`, `ear.run`, `ear.runAria`, `ear.start`, `ear.wrong`, `hear.buzz`, `hear.close`, `hear.k`, `hear.play`, `hear.state.busy`, `hear.state.saving`, `hear.state.wait`, `hear.states`, `hear.stop`, `hear.test`, `hear.toggle`.

### block: labs (336 texts: 77 with a claim)

| Text | What it says | Verdict | Source, and what changed |
| --- | --- | --- | --- |
| `cim.done` | **Now:** The sums stay within 5% with the fewest converter bits that manage it, for a fraction of the energy of fetching every number. Most of what is still spent goes into the converters, and each bit more roughly doubles it: the preci…<br>**Was:** The sums stay within 5% with the fewest converter bits that manage it, for a fraction of the energy of fetching every number. Most of what is still spent goes into the converters, and each bit more doubles it: the precision is … | Needed a condition: rewritten | [walden](#source-walden). Said each bit "doubles" the converters' cost: a rule of thumb, true at moderate resolution. Now "roughly doubles". |
| `cim.e.less` | {v}× less energy than fetching. A pJ is a picojoule, a millionth of a millionth of a joule. | Right | [cimE](#source-cimE). A picojoule is 10^-12 J. |
| `cim.e.more` | Nothing saved: the converters cost more than the fetching they replace. | Right: the lab's model | [cimE](#source-cimE) |
| `cim.hint` | Three things can spoil a sum: cells that hold too few levels, cells that differ from what was written, and a converter with too few steps. Move one dial at a time and watch which of them the error follows. Then ask of every con… | Right: the lab's model | [cimE](#source-cimE) |
| `cim.intro` | A grid of memory cells. Each cell passes a current in proportion to the number it stores times the input on its row, and each column wire adds the currents of its cells: eight multiplications and a sum, and no number leaves the… | Right | [ohm](#source-ohm) |
| `cim.legend` | A dot is what a cell holds: its size is how large, blue for plus, orange for minus. The ring is the number that was meant to be stored. A thicker row carries a larger input. Below, each column's sum: the short line is the exact… | Right: the lab's model | [cimE](#source-cimE) |
| `cim.msg.cells` | The error is already in the array: the cells hold too few levels to store these numbers, and no converter can read what is not there. | Right: the lab's model | [cimE](#source-cimE) |
| `cim.msg.coarse` | The converter's steps are too far apart: the bars snap to the nearest step, away from the exact lines. | Right: the lab's model | [cimE](#source-cimE) |
| `cim.msg.costly` | Accurate, but the converters now cost more than fetching every number would. | Right: the lab's model | [cimE](#source-cimE) |
| `cim.msg.fewest` | Within 5%, and one bit fewer would break it: this is the cheapest converter for these cells. | Right: the lab's model | [cimE](#source-cimE) |
| `cim.msg.noise` | The error is already in the array: the cells differ too much from what was written, and no converter can undo that. | Right: the lab's model | [cimE](#source-cimE) |
| `cim.msg.spare` | Accurate enough. Is every bit of this converter needed? | Right: the lab's model | [cimE](#source-cimE) |
| `cim.note` | A teaching model: 8 inputs and 4 sums, with energies for a 45 nm chip from a published table, and the array's and the converters' costs only illustrative. Left out: the resistance of the wires, cells that drift with time and he… | Right | [pedram](#source-pedram). Says it is a teaching model and what it leaves out. |
| `ckp.c.done` | Top speed with no wrong count, at two processes: the slowest path sets the clock. Smaller gates switch faster, so the same counter runs at a faster clock. | Right | [cmos](#source-cmos). Gate level. Smaller gates switch faster: true across the processes the lab uses. |
| `ckp.c.intro` | A counter adds one at every tick. Four flip-flops (each holds one bit, and takes a new value only when the clock ticks) hold the count; the gates between them work out the next count, and it must be back at the flip-flops befor… | Right | [hear3](#source-hear3). The counter lab is at the gate, outside this audit's scope; read because its words share the prefix. |
| `ckp.c.legend` | **Now:** Above: the slowest path, drawn to its time. The new count leaves the flip-flops, passes two AND gates (the carry) and an XOR (the sum), and goes back in. Green: a tick that comes just after it ends. Below: twenty ticks.<br>**Was:** Above: the slowest path, drawn to its time. The new count leaves the flip-flops, passes two AND gates and an XOR (the carry), and goes back in. Green: a tick that comes just after it ends. Below: twenty ticks. | Wrong: fixed | [hear3](#source-hear3). Said the path passes "two AND gates and an XOR (the carry)": in a half-adder chain the ANDs make the carry and the XOR the sum. Fixed (gate level, found on the way). |
| `ckp.c.note` | A teaching model: one fixed delay for each gate, no wire delay, no change of voltage or temperature. Real chips check millions of paths. | Right | [hear3](#source-hear3). Gate level; says it is a teaching model. |
| `ckp.c.say.above` | Still counting right, above the predicted limit: the prediction adds up the worst case of every gate, and real designs keep that margin. Push further. | Right | [cmos](#source-cmos). Gate level. Timing sign-off adds worst cases, so real parts often run above the predicted limit. |
| `ckp.c.say.errors` | {n} of {of} counts are wrong. Too fast: the clock ticked before the carry had passed through the gates, so the flip-flops stored half-finished sums. | Right: the lab's model | [hear3](#source-hear3). Gate level. |
| `ckp.c.say.top3` | That is the top safe speed: the slowest path just fits in one tick. Real 3 nm processors run far slower than this tiny counter, because their slowest paths are much longer and power limits them. | Right | [cmos](#source-cmos). Gate level. 3 nm processors clock at about 4 to 6 GHz, far below a 4-bit counter's limit. |
| `ckp.c.set.nodeD` | How small the factory makes the parts: smaller gates switch faster. | Right | [cmos](#source-cmos). Gate level. |
| `ckp.p.beyond` | Beyond this chip's limit: no voltage it can take makes the gates fast enough. | Right: the lab's model | [power](#source-power) |
| `ckp.p.done` | About 2.25 GHz runs on 25 W: half the power for a quarter less speed. Power grows with voltage squared, and a slower clock lets the chip run at a lower voltage. | Right: the lab's model | [power](#source-power). 2.25 / 3 is a quarter less speed; 25.1 W is half of 51 W. |
| `ckp.p.fails` | Fails timing: the slowest path is longer than one tick. This clock needs {v} V. | Right: the lab's model | [power](#source-power) |
| `ckp.p.hint` | Power follows the voltage squared, so the voltage is where the saving is. But the gates slow as it drops. Give up a little clock, and see how far the voltage can follow it down. | Right | [cmos](#source-cmos) |
| `ckp.p.intro` | The clock is the beat every part of a chip steps to: 3 GHz is three billion ticks a second. The voltage is how hard the supply pushes: more makes every gate switch faster, and costs more power. | Right | [cmos](#source-cmos). 3 GHz is 3 × 10^9 ticks a second. |
| `ckp.p.legend` | Thin lines: one voltage each, ending where its gates are too slow for the clock. Thick line: the frontier, the least power each clock can run on. Dot: your chip. | Right: the lab's model | [power](#source-power) |
| `ckp.p.note` | A teaching model of a made-up chip: power = activity × capacitance × voltage² × clock, plus leakage (current that flows even when nothing switches). Round numbers, not a real product. | Right | [cmos](#source-cmos). The formula is the textbook one, and it says it is a made-up chip. |
| `ckp.p.runs` | Runs. At {v} V the gates keep up with a clock of up to {f} GHz. | Right: the lab's model | [power](#source-power) |
| `game.ch.chef.goal` | The processor is a chef who gets faster every round; memory is the pantry. Keep the chef cooking at every level of chips, from one wire to a data centre, without spending more than each level allows. | Right: the lab's model | [bits](#source-bits) |
| `game.ch.chef.why` | Information weighs nothing, but it always rides on something physical: a charge on a wire, a pulse of light. So moving one bit costs energy, time, wires, money and a chance of error, and nothing outruns light. Chips have grown … | Right | [wm](#source-wm). Every bit rides on something physical (Landauer 1991); "weighs nothing" is the question's framing, taken back in the same sentence. Chips sped up faster than memory: Wulf and McKee. |
| `game.ch.cim.goal` | Let a grid of memory cells do the multiplying, and find the cheapest converter that keeps its sums within 5% of exact. | Right: the lab's model | [cimE](#source-cimE) |
| `game.ch.cim.why` | Fetching a number from memory can cost more energy than computing with it. Computing where the numbers are stored saves the trip, but the sums are analog: currents that vary, read by converters that cost more with every bit. | Right | [pedram](#source-pedram) |
| `game.ch.ear.goal` | The picture is hidden. Listen to the block, slowed down a billion times, and say what it is doing: busy, waiting on memory, too hot, or saving power. Get eight right of your last ten. | Right: the lab's model | [ear](#source-ear) |
| `game.ch.ear.why` | A chip works far too fast to see or hear: billions of steps a second. Slowed down until each step is a sound, its state can be told by ear, the way a mechanic hears what is wrong with an engine. Training your ear for it is lear… | Right | [ear](#source-ear). Chips step billions of times a second; the ear comparison is an analogy. |
| `game.ch.power-curve.goal` | This chip starts at 3 GHz and 0.75 V, and takes about 51 W. Find the fastest clock that runs safely on less than half that power: 2.2 GHz or more, under 25.5 W. | Right: the lab's model | [power](#source-power) |
| `game.ch.power-curve.why` | **Now:** Every switch that flips takes a sip of energy, and the sip grows with the square of the voltage. But a lower voltage makes the gates slower, so the clock has to slow down with it. That trade is why a chip cannot simply be run f…<br>**Was:** Every switch that flips takes a sip of energy, and the sip grows with the square of the voltage. But a lower voltage makes the gates slower, so the clock has to slow down with it. That trade is why a chip cannot simply be run f… | Needed a condition: rewritten | [cmos](#source-cmos). Said every chip chooses its place "on the same curve"; each chip has its own. Now "a curve like this one". |
| `mb.at.beside.d` | **Now:** A stack of memory chips beside the processor in the same package (HBM), joined by thousands of wires through a slab or a bridge of silicon underneath.<br>**Was:** A stack of memory chips beside the processor in the same package (HBM), joined by thousands of wires through a silicon bridge. | Needed a condition: rewritten | [hbm](#source-hbm). Said the wires run "through a silicon bridge"; most HBM sits on a silicon interposer, some on bridges. Now "a slab or a bridge of silicon underneath". |
| `mb.at.board.d` | Memory chips on the circuit board, about ten centimetres away: few wires, and every bit is pushed out of one chip and into another. | Right | [ddr](#source-ddr). The engine uses 100 mm and 64 wires. |
| `mb.at.near.d` | Memory on the same chip (SRAM, fast memory built from switches), a millimetre from the arithmetic: cheap to reach, but it takes costly chip area. | Right | [sram](#source-sram) |
| `mb.at.rack.d` | **Now:** Memory in another machine two metres away, reached through a fibre: turning bits into light and back costs about the same whether the light goes a metre or a hundred, but it adds time.<br>**Was:** Memory in another machine two metres away, reached through a fibre: light costs the same few picojoules whether it goes a metre or a hundred, but it adds time. | Needed a condition: rewritten | [optics](#source-optics). Said light "costs the same few picojoules" at any distance: the distance part holds, the "few" only for optics packaged beside the chip (pluggable modules take 11 to 19 pJ a bit). The number is dropped. |
| `mb.at.stacked.d` | Memory stacked straight on top of the chip and joined through thousands of tiny vertical wires: short and wide, but the heat has further to go. | Right | [bits](#source-bits). Heat must cross the stack: the known catch of stacking. |
| `mb.k.intro` | Each round the chef cooks faster; the pantry hardly speeds up. Pull the levers, then serve five rounds. A level is cleared when, in the last round, the chef waits no more than the goal and an answer costs no more energy than it… | Right: the lab's model | [bits](#source-bits) |
| `mb.k.note` | **Now:** A small model, fair enough to compare plans and made to be right in direction: the chef grows faster as processors did against memory (Wulf and McKee, 1995); prices and sizes are the model's own. Every lever's catch is in the e…<br>**Was:** A small model, fair enough to compare plans and never wrong in direction: the chef grows faster as processors did against memory (Wulf and McKee, 1995); prices and sizes are the model's own. Every lever's catch is in the engine… | Simplification: said on screen | [wm](#source-wm). Said the model is "never wrong in direction": a promise nobody can check. Now "made to be right in direction". The 80% against 7% a year is Wulf and McKee's. |
| `mb.lever.cim.brainC` | Answers come out roughly right, not exact. | Simplification: said on screen | [myelin](#source-myelin) |
| `mb.lever.cim.catch` | Computing in memory: the answers become approximate. | Right | [cimE](#source-cimE) |
| `mb.lever.closer.brainC` | Cells packed together leave less room for others. | Simplification: said on screen | [myelin](#source-myelin) |
| `mb.lever.closer.catch` | Less room: memory on the chip takes space from the chef. | Right | [bits](#source-bits) |
| `mb.lever.light.brainC` | Signals race along, but the wrapping costs room to grow. | Simplification: said on screen | [myelin](#source-myelin). The brain and team levels are analogies the lab chooses; the game says so by naming them as other "levels". |
| `mb.lever.light.catch` | Turning bits into light and back costs energy, near or far. | Right | [optics](#source-optics) |
| `mb.lever.shelf.brainC` | A local memory must guess what will be needed. | Simplification: said on screen | [myelin](#source-myelin) |
| `mb.lever.shelf.catch` | A cache must guess what comes next; a wrong guess fetches for nothing. | Right | [cache](#source-cache) |
| `mb.lever.stack.brainC` | A tighter fold is harder to cool. | Simplification: said on screen | [myelin](#source-myelin) |
| `mb.lever.stack.catch` | The heat is harder to get out, so the chef slows down. | Right | [bits](#source-bits) |
| `mb.lever.wider.brainC` | Every fibre costs room and energy to keep. | Simplification: said on screen | [myelin](#source-myelin) |
| `mb.lever.wider.catch` | More wires and more money, and the chip's edge holds only so many. | Right | [edge](#source-edge) |
| `mb.lv.brain.q` | A brain's signals crawl compared with a chip's, yet it thinks quickly on very little power. How does it keep its wires short? | Right | [nerve](#source-nerve). Nerve signals travel at 50 to 100 m/s at best. |
| `mb.lv.brain.who` | The chef is a group of neurons; the pantry is what other parts of the brain hold, a nerve fibre away. | Simplification: said on screen | [myelin](#source-myelin) |
| `mb.lv.chip.q` | Why does a faster chip spend more of its time waiting for data? | Right | [wm](#source-wm) |
| `mb.lv.dc.q` | AI chips sit idle much of the time, waiting for numbers. How much of that wait can be won back? | Right | [aiwait](#source-aiwait) |
| `mb.lv.dc.who` | The chef is an AI chip answering one person: every number of the model is read once for each word it writes, and used once. | Right | [aiwait](#source-aiwait). With one person served (batch of one), each weight is read once a word and used in one multiply-add. |
| `mb.lv.light.q` | Past some distance a wire loses to light. Where is that distance? | Right | [optics](#source-optics) |
| `mb.lv.team.q` | Everyone on a team knows something. Why does sharing it take so long, and what helps? | Simplification: said on screen | [myelin](#source-myelin) |
| `mb.lv.team.who` | The chef is a person at work; the pantry is what a colleague across the building knows. | Simplification: said on screen | [myelin](#source-myelin) |
| `mb.lv.wire.q` | Fetching two numbers costs far more than adding them. Why? | Right | [pedram](#source-pedram) |
| `mb.say.energy` | The chef is busy enough, but an answer costs {e}: too much of it goes on moving bits. | Right: the lab's model | [bits](#source-bits) |
| `mb.say.space` | The door needs more wires than the chip's edge can hold. | Right: the lab's model | [bits](#source-bits) |
| `mb.say.wait` | In the last round the chef waits {wait} of the time: the pantry cannot keep up. | Right: the lab's model | [bits](#source-bits) |
| `mb.trip.intro` | Send one bit from memory to the arithmetic and watch what it costs. Then move the memory: on the chip, stacked on it, beside it, across the board, or in another machine reached by light. | Right: the lab's model | [bits](#source-bits) |
| `mb.trip.look` | Fetch two numbers: {f}. Add them: {a}. {k}× more to fetch. | Right: the lab's model | [bits](#source-bits) |
| `mb.trip.note` | Energies from the same 45 nm table as Follow the joule: right in direction and share, high for today's chips. Capacity counts every wire; money is the price of a gigabyte kept there. | Right | [pedram](#source-pedram). Says the 45 nm energies are high for today's chips. |
| `mb.trip.wireShare` | {v} of the bit's energy is spent on the way, not in the memory | Right: the lab's model | [bits](#source-bits) |
| `mb.wall.floorD` | **Now:** Moving this bit costs {x} times the least that erasing one bit can cost.<br>**Was:** Moving this bit costs {x} times the least that writing one bit can cost. | Wrong: fixed | [landauer](#source-landauer). Said "the least that writing one bit can cost"; Landauer's floor is for erasing. Fixed. |
| `mb.wall.kFloor` | **Now:** A bit from the pantry costs {e}, {x} times the least that erasing one bit can cost.<br>**Was:** A bit from the pantry costs {e}, {x} times the least that writing one bit can cost. | Wrong: fixed | [landauer](#source-landauer). As above. Fixed. |
| `mb.wall.kLight` | At light's own speed the pantry is {n} of the chef's ticks away; a fetch takes {m}. | Right | [light](#source-light) |
| `mb.wall.lightD` | At light's own speed this trip lasts {n} ticks of a 3 GHz clock; the bit takes {m}. | Right | [light](#source-light). Light crosses about 10 cm in one tick of a 3 GHz clock. |
| `mb.wall.shannonD` | One wire carries {r}; its noise allows at most {c}, whatever the design. | Right | [shannon](#source-shannon). For a channel of the given width and signal-to-noise. |

No claim to check (names, controls, units, prompts, questions with no premise, the lab's own instructions): `cim.aria`, `cim.e.analog`, `cim.e.ar`, `cim.e.cv`, `cim.e.digital`, `cim.e.ma`, `cim.e.mv`, `cim.e.t`, `cim.fig.conv`, `cim.fig.exact`, `cim.fig.in`, `cim.fig.read`, `cim.fig.sum`, `cim.g.err`, `cim.g.fewer`, `cim.less`, `cim.more`, `cim.new`, `cim.none`, `cim.pct`, `cim.pj`, `cim.set.adc`, `cim.set.n`, `cim.set.w`, `cim.t.err`, `cim.t.fewer`, `cim.v.adc`, `cim.v.n`, `cim.v.w`, `ckp.c.again`, `ckp.c.aria`, `ckp.c.at`, `ckp.c.bit`, `ckp.c.clk`, `ckp.c.count`, `ckp.c.g.0`, `ckp.c.g.1`, `ckp.c.hint`, `ckp.c.none`, `ckp.c.notyet`, `ckp.c.of`, `ckp.c.path`, `ckp.c.right`, `ckp.c.run`, `ckp.c.say.counting`, `ckp.c.say.ready`, `ckp.c.say.running`, `ckp.c.say.top`, `ckp.c.seg.in`, `ckp.c.seg.out`, `ckp.c.set.hz`, `ckp.c.set.node`, `ckp.c.tick`, `ckp.c.tickFar`, `ckp.ghz`, `ckp.less`, `ckp.mhz`, `ckp.more`, `ckp.nj`, `ckp.no`, `ckp.node`, `ckp.p.aria`, `ckp.p.budget`, `ckp.p.cant`, `ckp.p.g.clock`, `ckp.p.g.power`, `ckp.p.g.runs`, `ckp.p.path`, `ckp.p.set.f`, `ckp.p.set.v`, `ckp.p.start`, `ckp.p.t.clock`, `ckp.p.t.power`, `ckp.p.tick`, `ckp.p.x`, `ckp.p.y`, `ckp.ps`, `ckp.r.clock`, `ckp.r.dyn`, `ckp.r.energy`, `ckp.r.leak`, `ckp.r.path`, `ckp.r.tick`, `ckp.r.total`, `ckp.r.wrong`, `ckp.volt`, `ckp.watt`, `ckp.yes`, `game.ch.chef.t`, `game.ch.cim.t`, `game.ch.ear.t`, `game.ch.power-curve.t`, `mb.at.beside.s`, `mb.at.beside.t`, `mb.at.board.s`, `mb.at.board.t`, `mb.at.near.s`, `mb.at.near.t`, `mb.at.rack.s`, `mb.at.rack.t`, `mb.at.stacked.s`, `mb.at.stacked.t`, `mb.cleared`, `mb.curve.aria`, `mb.curve.d`, `mb.curve.k`, `mb.curve.none`, `mb.curve.x`, `mb.curve.yours`, `mb.fewer`, `mb.g.atMost`, `mb.g.energy`, `mb.g.errors`, `mb.g.exact`, `mb.g.money`, `mb.g.ofEdge`, `mb.g.wait`, `mb.g.wires`, `mb.hint`, `mb.k.aria`, `mb.k.chef.brain`, `mb.k.chef.chip`, `mb.k.chef.team`, `mb.k.cooks`, `mb.k.dist`, `mb.k.goal`, `mb.k.pantry.brain`, `mb.k.pantry.chip`, `mb.k.pantry.team`, `mb.k.round`, `mb.k.waits`, `mb.keep`, `mb.keep.lead`, `mb.levels`, `mb.lever.cim.brain`, `mb.lever.cim.t`, `mb.lever.cim.team`, `mb.lever.cim.teamC`, `mb.lever.closer.brain`, `mb.lever.closer.t`, `mb.lever.closer.team`, `mb.lever.closer.teamC`, `mb.lever.light.brain`, `mb.lever.light.t`, `mb.lever.light.team`, `mb.lever.light.teamC`, `mb.lever.shelf.brain`, `mb.lever.shelf.t`, `mb.lever.shelf.team`, `mb.lever.shelf.teamC`, `mb.lever.stack.brain`, `mb.lever.stack.t`, `mb.lever.stack.team`, `mb.lever.stack.teamC`, `mb.lever.wider.brain`, `mb.lever.wider.t`, `mb.lever.wider.team`, `mb.lever.wider.teamC`, `mb.lv.brain.t`, `mb.lv.chip.t`, `mb.lv.chip.who`, `mb.lv.dc.t`, `mb.lv.light.t`, `mb.lv.light.who`, `mb.lv.stacked.q`, `mb.lv.stacked.t`, `mb.lv.stacked.who`, `mb.lv.team.t`, `mb.lv.wire.t`, `mb.lv.wire.who`, `mb.m.capacity`, `mb.m.energy`, `mb.m.errors`, `mb.m.money`, `mb.m.space`, `mb.m.time`, `mb.more`, `mb.pct`, `mb.progress`, `mb.rung.ai`, `mb.rung.beyond`, `mb.rung.deeper`, `mb.rung.look`, `mb.rung.measure`, `mb.rung.still`, `mb.say.error`, `mb.say.money`, `mb.say.ok`, `mb.say.ready`, `mb.say.serving`, `mb.serve`, `mb.serveAgain`, `mb.source`, `mb.start`, `mb.tab.chef`, `mb.tab.trip`, `mb.trip.alu`, `mb.trip.aria`, `mb.trip.d.cm1`, `mb.trip.d.cm10`, `mb.trip.d.m1`, `mb.trip.d.mm01`, `mb.trip.d.mm1`, `mb.trip.far`, `mb.trip.meters`, `mb.trip.price`, `mb.trip.proc`, `mb.trip.send`, `mb.trip.tick`, `mb.trip.where`, `mb.trip.wires`, `mb.trip.wiresShort`, `mb.u.d.cm`, `mb.u.d.km`, `mb.u.d.m`, `mb.u.d.mm`, `mb.u.e.J`, `mb.u.e.fJ`, `mb.u.e.kJ`, `mb.u.e.mJ`, `mb.u.e.nJ`, `mb.u.e.pJ`, `mb.u.e.uJ`, `mb.u.e.zJ`, `mb.u.err`, `mb.u.errNone`, `mb.u.r.G`, `mb.u.r.M`, `mb.u.r.T`, `mb.u.r.b`, `mb.u.r.k`, `mb.u.t.h`, `mb.u.t.min`, `mb.u.t.ms`, `mb.u.t.ns`, `mb.u.t.ps`, `mb.u.t.s`, `mb.u.t.us`, `mb.v.cim.0`, `mb.v.cim.1`, `mb.v.cim.2`, `mb.v.closer.0`, `mb.v.closer.1`, `mb.v.closer.2`, `mb.v.light.0`, `mb.v.light.1`, `mb.v.shelf.0`, `mb.v.shelf.1`, `mb.v.shelf.2`, `mb.v.shelf.3`, `mb.v.stack.0`, `mb.v.stack.1`, `mb.v.wider.0`, `mb.v.wider.1`, `mb.v.wider.2`, `mb.v.wider.3`, `mb.wall.floor`, `mb.wall.light`, `mb.wall.shannon`.

### machines (295 texts: 110 with a claim)

| Text | What it says | Verdict | Source, and what changed |
| --- | --- | --- | --- |
| `curve.law.lab` | This curve counts attempts: the best design falls each time the attempts double. More attempts, faster tries, more ideas. | Right: the lab's model | [machine](#source-machine). The lab's curve fits its own kept attempts; it claims nothing beyond them. |
| `curve.law.moore` | **Now:** Moore's law counts years: the switches on a chip double every two years or so, and keeping that pace now takes more than 18 times the researchers of the early 1970s.<br>**Was:** Moore's law counts years: chips double every two years or so, and keeping that pace now takes more than 18 times the researchers of the early 1970s. | Needed a condition: rewritten | [bloom](#source-bloom). Said "chips double"; it is the switches on a chip (density) that double. The 18 times is Bloom et al.'s. |
| `curve.law.wright` | **Now:** Wright's law counts things made: cost falls by a share each time the total made doubles. Tested on 62 technologies, it forecast best, with Moore's law close behind.<br>**Was:** Wright's law counts things made: cost falls by a share each time the total made doubles, and it forecast 62 technologies best. | Needed a condition: rewritten | [nagy](#source-nagy). Said "it forecast 62 technologies best": among six laws tested on 62 technologies it forecast best, with Moore's close behind. Rewritten. |
| `curve.ui.law` | Each time the attempts double, the best falls to {x} of what it was. | Right: the lab's model | [machine](#source-machine) |
| `curve.ui.lead` | Every attempt someone keeps for this need joins the curve, in order: each dot is one attempt, and the line is the best energy so far. Nobody votes; the engine scores each one. | Right: the lab's model | [machine](#source-machine) |
| `curve.ui.many` | That is why it is a lab: many people and many agents, each trying in parallel, double the attempts much faster than one. | Right | [machine](#source-machine) |
| `curve.ui.pace` | At the pace of your machine, {tries} tries a year, doubling the {n} attempts so far alone would take {time}. | Right: the lab's model | [machine](#source-machine) |
| `fab.claim.deskCost` | A ten-thousandth of a giant fab: a guess. | Not verified: marked | [machine](#source-machine). A guess, said as one. |
| `fab.claim.deskDays` | A day to a week a try: a guess. | Not verified: marked | [machine](#source-machine). A guess, said as one. |
| `fab.claim.deskFab2` | A company is building a factory that makes small fabs and the tools in them. | Right | [fab2](#source-fab2) |
| `fab.claim.deskReal` | One person made a chip of 1,200 transistors in a garage, at 10 µm. | Right | [zeloof](#source-zeloof) |
| `fab.claim.flexCost` | A hundredth of the cost of a standard fab, its maker says. | Right | [pragmatic](#source-pragmatic). The maker's claim, said as one. |
| `fab.claim.flexDays` | Under 48 hours a run; under a week to tested wafers. | Right | [pragmatic](#source-pragmatic) |
| `fab.claim.flexWeek` | The same source sets silicon at 18 to 26 weeks. | Right | [pragmatic](#source-pragmatic) |
| `fab.claim.giantCost` | The yardstick: what every other line is set against. | Right: the lab's model | [machine](#source-machine) |
| `fab.claim.giantDays` | 18 to 26 weeks from a finished design to tested wafers. | Right | [pragmatic](#source-pragmatic). A vendor's comparison, but in line with the months a leading-edge run takes. |
| `fab.claim.smallCost` | A hundredth to a thousandth of the cost of a giant fab, its makers say. | Right | [minimal](#source-minimal). The maker's claim, said as one. |
| `fab.claim.smallDays` | A few days to two weeks a try: a guess; we found no source. | Not verified: marked | [machine](#source-machine). A guess, said on screen as one: no source found. |
| `fab.claim.smallReal` | In use: no cleanroom, half-inch wafers, sold for prototyping. | Right | [minimal](#source-minimal) |
| `fab.name.desk.d` | Chips made at home, or by machines a factory of fabs turns out: a try a day, perhaps. | Simplification: said on screen | [fab2](#source-fab2). "A try a day, perhaps": a guess, said as one. |
| `fab.name.flexible.d` | **Now:** Thin-film circuits on plastic, patterned like silicon chips but slower and larger, made in days.<br>**Was:** Thin-film circuits printed on plastic: slower and larger than silicon, made in days. | Wrong: fixed | [flexrv](#source-flexrv). Said circuits are "printed on plastic"; they are thin-film circuits patterned with photolithography on a plastic film. Now "on plastic, patterned like silicon chips". |
| `fab.name.giant.d` | The fabs that make today's chips: every form, at the finest lines, and months for each try. | Right | [pragmatic](#source-pragmatic) |
| `fab.name.small.d` | Minimal Fab: a line of small tools on half-inch wafers, with no cleanroom. | Right | [minimal](#source-minimal) |
| `fab.ui.grown` | Living matter is grown from cells, not made in a fab: how long a try takes is not known here. | Right | [cl1](#source-cl1) |
| `fab.ui.lead` | Software changes the same day. Everything else has to be made first, and where it is made sets how many tries fit in a year. | Right: the lab's model | [machine](#source-machine) |
| `fab.ui.none` | Nothing in this machine needs making: its parts are software or bought ready-made. A try takes a day. | Right: the lab's model | [machine](#source-machine). A day for software or bought parts is the model's choice (TRY_DAYS), said in the words. |
| `fab.ui.note` | Energy here is counted as if every part were made at 45 nm. Lines this coarse cost more energy per step: try here, then make the one that wins at a giant fab. | Right | [machine](#source-machine). Coarser lines spend more energy per step than 45 nm. |
| `invent.claim.cimArray` | A crossbar multiplies where the numbers are stored; its energy, converters included, comes from the lab's compute-in-memory engine. | Right: the lab's model | [cimE](#source-cimE) |
| `invent.claim.cimNoise` | No two devices are quite alike, so the answers are close, not exact. | Right | [cimE](#source-cimE) |
| `invent.claim.lightCheap` | Multiplying in light costs a tenth of what a circuit spends. | Not verified: marked | [machine](#source-machine). A guess, labelled one on screen. |
| `invent.claim.lightConvert` | Turning numbers into light and back costs twice what the light saves. | Not verified: marked | [machine](#source-machine). A guess, labelled one on screen. |
| `invent.claim.lightNoise` | Light drifts in phase, so the answers are close, not exact. | Right | [cimE](#source-cimE). Phase drift and noise make optical sums approximate. |
| `invent.claim.lightReal` | Processors that compute with light are installed in research computing centres. | Right | [qant](#source-qant) |
| `invent.claim.liveBrain` | Living neurons compute as cheaply as a brain, which runs on about 20 watts. | Not verified: marked | [brain](#source-brain). A guess, labelled; the 20 W is right. |
| `invent.claim.liveGrown` | Grown from cells, not made in a fab: how long a try takes is not known. | Right | [cl1](#source-cl1) |
| `invent.claim.liveReal` | A computer with living neurons on a chip is on sale today. | Right | [cl1](#source-cl1) |
| `invent.claim.liveSupport` | Keeping the cells alive costs a hundred times what they save. | Not verified: marked | [machine](#source-machine). A guess, labelled one on screen. |
| `invent.claim.revChip` | A reversible test chip took back part of its energy: the same logic used about 30% less. | Right | [vaire](#source-vaire). 1/1.41 is 0.71, about 30% less; Science News reports about 30% less too. |
| `invent.claim.revFree` | Taken back almost completely, a step would cost almost nothing. | Not verified: marked | [landauer](#source-landauer). A guess, labelled; the floor still holds. |
| `invent.claim.spikesCost` | Each spike costs three times a circuit's step. | Not verified: marked | [machine](#source-machine). A guess, labelled one on screen. |
| `invent.claim.spikesEvents` | **Now:** A spiking part spends energy mostly when something happens, so a quiet need costs little.<br>**Was:** A spiking part spends energy only when something happens, so a quiet need costs little. | Needed a condition: rewritten | [hala](#source-hala). Said a spiking part spends energy "only" when something happens; it also leaks and keeps time. Now "mostly". |
| `invent.claim.spikesReal` | Spiking systems with over a billion neurons have been built. | Right | [hala](#source-hala). 1.15 billion neurons. |
| `invent.matter.cim.d` | Numbers held and multiplied where they are stored. | Right | [ohm](#source-ohm) |
| `invent.matter.light.d` | Multiplies by sending light through a mesh of tiny tunable splitters. | Right | [qant](#source-qant). Meshes of tunable splitters (Mach-Zehnder) are one way light multiplies; others exist. |
| `invent.matter.living.d` | **Now:** Lab-grown neurons on a chip, kept alive, that can be trained on simple tasks.<br>**Was:** Lab-grown neurons on a chip that learn, kept alive. | Needed a condition: rewritten | [kagan](#source-kagan). Said the neurons "learn"; trained on simple tasks is what has been shown. Rewritten. |
| `invent.matter.reversible.d` | **Now:** Logic that can run backwards and take back much of the energy of each step.<br>**Was:** Logic that can run backwards and take back the energy of each step. | Needed a condition: rewritten | [vaire](#source-vaire). Said it takes back "the energy of each step"; real chips take back part of it. Now "much of". |
| `invent.matter.spikes.d` | **Now:** Artificial neurons that send a spike only when their input changes enough, loosely as in a brain.<br>**Was:** Neurons that fire only when something happens, as in a brain. | Needed a condition: rewritten | [hala](#source-hala). Said neurons fire "only when something happens, as in a brain"; brain cells also fire on their own. Rewritten: artificial neurons, loosely as in a brain. |
| `invent.ui.lead` | New matter may not exist yet, so every kind rests on claims, and every claim says how sure it is: in products, shown in a lab, or a guess. Guesses are allowed and labelled; physics sets the floor. | Right | [landauer](#source-landauer) |
| `invent.wall.floor` | A claim hit the floor: no step can cost less than erasing the bits it must erase, so the guess stops there. | Right | [landauer](#source-landauer) |
| `liquid.kind.cgra.d` | A coarse-grained array: small arithmetic units whose wiring changes on every tick of the clock. | Right | [hycube](#source-hycube). True of HyCUBE, rewired every cycle; some arrays are rewired less often. |
| `liquid.kind.fpga.d` | An FPGA: a grid of tiny lookup tables and switches, rewired by loading a new configuration. | Right | [kuon](#source-kuon) |
| `liquid.kind.goal.d` | **Now:** The goal: a fabric that reshapes in 50 nanoseconds (DARPA's aim) at nearly a circuit's energy (a guess).<br>**Was:** The goal: a fabric that reshapes in 50 nanoseconds at nearly a circuit's energy. | Needed a condition: rewritten | [prowess](#source-prowess). The 50 ns is DARPA's aim; "nearly a circuit's energy" is the lab's guess (1.5 times). Both now said. |
| `liquid.note.cgraChip` | A test chip had 28.6 times the power efficiency of an FPGA platform; against a circuit made for the job, no source gives one figure. | Right | [hycube](#source-hycube) |
| `liquid.note.fpgaArea` | **Now:** About 35 times the area of a custom chip for the same logic, and 3.4 to 4.6 times slower (measured at 90 nm, for logic alone).<br>**Was:** About 35 times the area of a custom chip for the same logic, and 3.4 to 4.6 times slower. | Needed a condition: rewritten | [kuon](#source-kuon). Measured at 90 nm for logic alone; built-in memories and multipliers narrow the gap. Condition added. |
| `liquid.note.fpgaWhole` | Rewiring the whole chip took 3.8 seconds; rewiring part of it, 209 milliseconds, or 324 microseconds through the chip's own port. | Right | [reconf](#source-reconf) |
| `liquid.note.goalAim` | DARPA's aim: processors that reconfigure within 50 nanoseconds. Nobody has shown it yet. | Right | [prowess](#source-prowess) |
| `liquid.ui.evolve` | When a fabric rewires itself, who designed it? In 1996 evolution rewired an FPGA to tell two tones apart, and the circuit worked in ways nobody could fully explain. | Right | [thompson](#source-thompson) |
| `liquid.ui.fallback` | If the guesses fail, a guessed fabric is no better than an FPGA: its energy and its time to rewire. | Right: the lab's model | [machine](#source-machine) |
| `liquid.ui.lead` | A fabric rewired after it is made: exact like a circuit, changeable like software. It pays in energy for the switches that make it flexible, and in the time it takes to rewire, when it does no work. | Right | [kuon](#source-kuon) |
| `machines.badge.measured` | measured against a circuit | Right: the lab's model | [machine](#source-machine) |
| `machines.badge.yardstick` | the yardstick | Right: the lab's model | [machine](#source-machine) |
| `machines.block.adder.d` | Adds two numbers. | Right | [machine](#source-machine) |
| `machines.block.core.d` | A RISC-V core: it runs any block given to it as software. | Right | [machine](#source-machine) |
| `machines.block.counter.d` | Counts ticks: a clock for when to wake up and what to do next. | Right | [machine](#source-machine) |
| `machines.block.learner.d` | Numbers in, numbers out, shaped by numbers it has learned: a filter, a detector, a guide. | Right | [machine](#source-machine) |
| `machines.block.memory.d` | Keeps numbers until they are needed. | Right | [machine](#source-machine) |
| `machines.block.parity.d` | Says whether a number arrived with one bit flipped. | Right | [parity](#source-parity). It says one bit; two flips would slip past, which the words do not deny. |
| `machines.block.sensor.d` | Turns a signal from the world, such as sound, smoke or light, into numbers. | Right | [machine](#source-machine) |
| `machines.block.voter.d` | **Now:** Three copies answer and the majority wins, so a fault in one copy cannot change the result.<br>**Was:** Three copies answer and the majority wins, so one fault cannot change the result. | Needed a condition: rewritten | [tmr](#source-tmr). Said "one fault cannot change the result"; a fault in the voter itself can. Now "a fault in one copy". |
| `machines.do.exact.d` | A part that answers only roughly cannot be trusted here: every part marked with equals must be exact too. Still the least energy you can. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.hint.hearing.least` | The filter must still change after it is made, and a circuit cannot. Of the forms that can change, which costs least? The claims of each kind of new matter say how sure it is. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.hint.hearing.week` | Memory that computes is made only in a giant fab, and a try there takes months. Which form that can change is bought ready-made instead? | Right: the lab's model | [machine](#source-machine) |
| `machines.do.hint.radio.least` | Finding a signal and pulling it out must reshape as fast as the signals change. Open the layer of how fast each part reshapes to see which form keeps up. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.hint.radio.week` | The reversible clock waits months on a giant fab. What else could the clock be, made where a try takes days? | Right: the lab's model | [machine](#source-machine) |
| `machines.do.hint.rover.exact` | Now the guide must be exact as well as changeable. New matter that changes is not exact: what else can change and stay exact? | Right: the lab's model | [machine](#source-machine) |
| `machines.do.hint.rover.least` | The guide must take updates from Earth; the voter and the core must be exact. Which forms keep those rules and spend least? | Right: the lab's model | [machine](#source-machine) |
| `machines.do.hint.wildfire.least` | Nothing has to change out there, so every part may be fixed. The detector does most of the work, but the check and the clock count too. Which forms spend least, counting only what is shown? | Right: the lab's model | [machine](#source-machine) |
| `machines.do.hint.wildfire.week` | A giant fab takes months for one try. The forms can stay as they are: where else could the circuits be made? | Right: the lab's model | [machine](#source-machine) |
| `machines.do.least.d` | Follow the grammar, keep every rule of the need, and spend as little energy as any machine can. Only what is in products or shown in a lab counts. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.week.d` | Every try must come back within a week, even if a guess fails, so the machine can be tried again and again. Still the least energy you can. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.why.hearing.least` | Memory that computes multiplies where the numbers are kept, so the filter costs a small part of a circuit's energy and can still be retuned. Its answers are close, not exact, which a hearing aid can live with. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.why.hearing.week` | A fabric rewired by bits is bought and configured, so a try takes a day. It costs more than memory that computes, but a new filter can be tried every day. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.why.radio.least` | An array rewired on every tick of the clock keeps up, shown in a lab. Its energy is a guess, so it counts as an FPGA's until someone shows it; a reversible clock saves a little more. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.why.radio.week` | **Now:** With the clock a plain circuit made on a flexible line, a try takes days, for almost the same energy.<br>**Was:** With the clock a plain circuit printed on a flexible line, a try takes days, for almost the same energy. | Wrong: fixed | [flexrv](#source-flexrv). Said the clock is "printed" on a flexible line: those chips are patterned with photolithography. Now "made". |
| `machines.do.why.rover.exact` | A fabric rewired by bits is exact like a circuit and can still take updates from Earth. It costs more, so the rest is made as cheap as the rules allow. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.why.rover.least` | Memory that computes runs the guide for little and can still be updated, and reversible logic is exact, so the voter and the clock can take back part of their energy and still be trusted. | Right: the lab's model | [machine](#source-machine). Reversible logic is digital, so exact: right. |
| `machines.do.why.wildfire.least` | Memory that computes does the detector's work for a sliver of the energy, and reversible logic takes back part of what the check and the clock spend. | Right: the lab's model | [machine](#source-machine) |
| `machines.do.why.wildfire.week` | **Now:** A flexible line makes circuits on plastic in days. The energy here is counted as if every part were made at 45 nm, so try here, then make the winner in a giant fab.<br>**Was:** A flexible line prints circuits on plastic in days. The energy here is counted as if made at the finest lines, so try here, then make the winner in a giant fab. | Wrong: fixed | [flexrv](#source-flexrv). Said the line "prints" circuits (it patterns them), and that energy is counted "as if made at the finest lines", while fab.ui.note and the engine count 45 nm. Both fixed. |
| `machines.do.won` | Won: no machine that keeps this goal spends less. | Right: the lab's model | [machine](#source-machine) |
| `machines.miss.change` | {part} must still change after the machine is made: make it software or new matter | Right: the lab's model | [machine](#source-machine) |
| `machines.miss.exact` | {part} must be exact, and new matter is not | Right: the lab's model | [machine](#source-machine) |
| `machines.miss.keep` | {part} must reshape as fast as its job changes, and this form is too slow | Right: the lab's model | [machine](#source-machine) |
| `machines.need.hearing.d` | Tiny, all day on one small battery | Right | [aid](#source-aid) |
| `machines.need.hearing.why` | Its filter has to be tuned to each person's hearing, so it must still change after the machine is made. | Right | [aid](#source-aid) |
| `machines.need.radio.d` | The signals around it change in nanoseconds | Right: the lab's model | [prowess](#source-prowess). The need is the lab's; DARPA's program sets signals that change faster than an FPGA can be rewired. |
| `machines.need.radio.why` | The signals it hunts change faster than most hardware can be rewired: finding them and pulling them out must reshape every 100 nanoseconds, and pulling them out must be exact. | Right: the lab's model | [prowess](#source-prowess). "Every 100 nanoseconds" is the need the lab sets, between an FPGA's rewiring and DARPA's 50 ns aim. |
| `machines.need.rover.d` | Far away, cold, hit by radiation | Right | [rad](#source-rad) |
| `machines.need.rover.why` | Its guide has to take updates from Earth, and its voter and core must be exact, because radiation flips bits out there. | Right | [rad](#source-rad) |
| `machines.need.wildfire.d` | Ten years in a forest, no service | Right: the lab's model | [machine](#source-machine). A need the lab sets. |
| `machines.need.wildfire.why` | Nothing has to change once it is out there: what matters most is the battery. | Right: the lab's model | [machine](#source-machine) |
| `machines.rule.core` | {part} runs as software, but no core made as a circuit is there to run it | Right: the lab's model | [machine](#source-machine) |
| `machines.rule.fab` | {part} cannot be made where you chose: pick another place, or another form | Right: the lab's model | [machine](#source-machine) |
| `machines.rule.fed` | {part} has an input that nothing feeds | Right: the lab's model | [machine](#source-machine) |
| `machines.rule.form` | {part} cannot take that form | Right: the lab's model | [machine](#source-machine) |
| `machines.rule.kind` | {part}: a wire joins two different kinds of port | Right: the lab's model | [machine](#source-machine) |
| `machines.ui.agentLead` | The agent tries every way to make this machine, in every place it could be made, keeps those that follow the grammar and meet the need, and shows the ones no other beats on energy, change, exactness and days a try at once. It d… | Right: the lab's model | [machine](#source-machine) |
| `machines.ui.blocksLead` | What everyone shares instead of a standard machine: what flows in and out of each block, the forms it can take, and how it is checked. | Right: the lab's model | [machine](#source-machine) |
| `machines.ui.decide` | Which one is right depends on what the machine is for. That is your call, not the agent's. | Right | [machine](#source-machine) |
| `machines.ui.lead` | There is no standard computer here. Pick a need, then choose the form of each block: as software it can change at any time, as a circuit it runs far cheaper but is fixed once made, as liquid hardware it is a fabric rewired afte… | Right | [hameed](#source-hameed). Software changes any time; a circuit is far cheaper for its job and fixed once made. |
| `machines.ui.note` | **Now:** How it is scored: for the same work, software costs about 500 times a circuit made for it (the gap one study measured for video, a general-purpose chip against a custom one, Hameed et al.; for other jobs it is often smaller), a…<br>**Was:** How it is scored: for the same work, software costs about 500 times a circuit made for it (a general-purpose chip against a custom one for video, Hameed et al.), and new matter costs what its claims say, from in products down t… | Simplification: said on screen | [hameed](#source-hameed). The 500 times is one study's gap for video encoding, applied by the model to every block. Now said on screen: for other jobs it is often smaller. |

No claim to check (names, controls, units, prompts, questions with no premise, the lab's own instructions): `curve.time.days`, `curve.time.months`, `curve.time.years`, `curve.ui.axisX`, `curve.ui.axisY`, `curve.ui.cannot`, `curve.ui.keep`, `curve.ui.keepLead`, `curve.ui.kicker`, `curve.ui.laws`, `curve.ui.noLaw`, `curve.ui.none`, `curve.ui.paceNever`, `curve.ui.title`, `curve.ui.yours`, `fab.name.desk.t`, `fab.name.flexible.t`, `fab.name.giant.t`, `fab.name.small.t`, `fab.ui.days`, `fab.ui.guessDays`, `fab.ui.kicker`, `fab.ui.makes`, `fab.ui.setup`, `invent.matter.cim.t`, `invent.matter.light.t`, `invent.matter.living.t`, `invent.matter.reversible.t`, `invent.matter.spikes.t`, `invent.status.guess`, `invent.status.lab`, `invent.status.product`, `invent.ui.engine`, `invent.ui.guesses`, `invent.ui.kicker`, `invent.ui.matters`, `invent.ui.none`, `invent.ui.range`, `invent.ui.source`, `liquid.kind.cgra.t`, `liquid.kind.fpga.t`, `liquid.kind.goal.t`, `liquid.tick.days`, `liquid.tick.months`, `liquid.tick.ms`, `liquid.tick.never`, `liquid.tick.ns`, `liquid.tick.s`, `liquid.tick.us`, `liquid.time.ms`, `liquid.time.ns`, `liquid.time.s`, `liquid.time.us`, `liquid.ui.axisX`, `liquid.ui.axisY`, `liquid.ui.corner`, `liquid.ui.energy`, `liquid.ui.every`, `liquid.ui.everyKey`, `liquid.ui.evolveGo`, `liquid.ui.kicker`, `liquid.ui.mapAria`, `liquid.ui.none`, `liquid.ui.refs`, `liquid.ui.reshape`, `machines.badge.bought`, `machines.badge.configured`, `machines.badge.grown`, `machines.badge.ports`, `machines.badge.software`, `machines.block.adder.t`, `machines.block.core.t`, `machines.block.counter.t`, `machines.block.learner.t`, `machines.block.memory.t`, `machines.block.parity.t`, `machines.block.sensor.t`, `machines.block.voter.t`, `machines.check.built`, `machines.check.engine`, `machines.check.lab`, `machines.check.open`, `machines.check.partly`, `machines.do.allWon`, `machines.do.exact.t`, `machines.do.goal`, `machines.do.goals`, `machines.do.k`, `machines.do.least.t`, `machines.do.m.best`, `machines.do.m.days`, `machines.do.m.energy`, `machines.do.m.rules`, `machines.do.miss.days`, `machines.do.miss.exact`, `machines.do.next`, `machines.do.rulesN`, `machines.do.rulesOk`, `machines.do.week.t`, `machines.form.circuit`, `machines.form.liquid`, `machines.form.matter`, `machines.form.software`, `machines.front.aria`, `machines.front.broken`, `machines.front.dot`, `machines.front.nobody`, `machines.front.offers`, `machines.front.today`, `machines.front.wait`, `machines.front.x`, `machines.front.y`, `machines.front.yours`, `machines.layer.aria`, `machines.layer.blocks`, `machines.layer.claims`, `machines.layer.flow`, `machines.layer.made`, `machines.layer.reshape`, `machines.layer.tries`, `machines.need.hearing.t`, `machines.need.radio.t`, `machines.need.rover.t`, `machines.need.wildfire.t`, `machines.port.bit`, `machines.port.signal`, `machines.port.word`, `machines.rib.blocks`, `machines.rib.every`, `machines.rib.reshape`, `machines.rib.try`, `machines.role.hearing.ctl`, `machines.role.hearing.filter`, `machines.role.hearing.mem`, `machines.role.hearing.mic`, `machines.role.radio.ant`, `machines.role.radio.clock`, `machines.role.radio.ctl`, `machines.role.radio.find`, `machines.role.radio.mix`, `machines.role.rover.cam`, `machines.role.rover.clock`, `machines.role.rover.ctl`, `machines.role.rover.nav`, `machines.role.rover.vote`, `machines.role.wildfire.check`, `machines.role.wildfire.clock`, `machines.role.wildfire.ctl`, `machines.role.wildfire.detect`, `machines.role.wildfire.smoke`, `machines.ui.agent`, `machines.ui.agentK`, `machines.ui.allCircuit`, `machines.ui.blocks`, `machines.ui.changes`, `machines.ui.days`, `machines.ui.daysShort`, `machines.ui.do`, `machines.ui.energy`, `machines.ui.exact`, `machines.ui.go`, `machines.ui.grammarOk`, `machines.ui.inUse`, `machines.ui.intoCore`, `machines.ui.kicker`, `machines.ui.look`, `machines.ui.machine`, `machines.ui.meetsOk`, `machines.ui.modes`, `machines.ui.must.change`, `machines.ui.must.exact`, `machines.ui.needs`, `machines.ui.never`, `machines.ui.parts`, `machines.ui.partsLead`, `machines.ui.pickKeeps`, `machines.ui.ports`, `machines.ui.reset`, `machines.ui.runsOn`, `machines.ui.tap`, `machines.ui.title`, `machines.ui.tried`, `machines.ui.tries`, `machines.ui.use`, `machines.ui.world`.

## Sources

- <a id="source-aid"></a>**aid**: hearing aids are fitted to each person's hearing test: general knowledge
- <a id="source-aiwait"></a>**aiwait**: serving a language model to one person at a time keeps the arithmetic idle most of the time, waiting for weights (facts `llama3-mfu` and the serving lab): general knowledge
- <a id="source-answer"></a>**answer**: engine `src/engines/budget.js` (JOB, PLAN: batch of one, fp16, HBM), run tonight; [Elsner et al., Google, 2025](https://arxiv.org/abs/2508.15734) (facts `ai-prompt-energy`)
- <a id="source-backus"></a>**backus**: Backus, Turing Award lecture 1977, [CACM 21(8), 1978](https://doi.org/10.1145/359576.359579)
- <a id="source-bits"></a>**bits**: engine `src/engines/bits.js` (its trips and kitchen), with the figures it names
- <a id="source-black"></a>**black**: [Black, IEEE Trans. Electron Devices ED-16, 1969](https://scilit.com/publications/17261c294af540dddb17699a09d9e534)
- <a id="source-bloom"></a>**bloom**: [Bloom, Jones, Van Reenen and Webb 2020](https://www.nber.org/papers/w23782) (facts `ideas-harder`)
- <a id="source-brain"></a>**brain**: [The Physics Factbook](https://hypertextbook.com/facts/2001/JacquelineLing.shtml) (facts `brain-power`)
- <a id="source-cache"></a>**cache**: a cache holds what it guesses will be used next: general knowledge
- <a id="source-cases"></a>**cases**: the real cases in `CASES` (src/data/weave.js): FDIV 1994, Pentium III 2000, Cougar Point 2011, silent data corruption 2021, each with its source
- <a id="source-cimE"></a>**cimE**: engine `src/engines/paradigms.js` (crossbar, cimEnergy: the converter cost doubles a bit)
- <a id="source-cl1"></a>**cl1**: [Live Science](https://livescience.com/technology/computing/worlds-1st-computer-that-combines-human-brain-with-silicon-now-available) (facts `cortical-cl1`)
- <a id="source-clock"></a>**clock**: [Semiconductor Engineering, The Problem With Clocks](https://semiengineering.com/the-problem-with-clocks) (facts `clock-power-share`, new)
- <a id="source-cmos"></a>**cmos**: CMOS textbook physics (dynamic power = activity × C × V² × f; gates slow as V falls), e.g. Weste and Harris, *CMOS VLSI Design*: general knowledge, page not opened
- <a id="source-core32"></a>**core32**: the core lab (#339, `src/engines/core.js`): 32 copies of the learner's one-bit slice make the core that runs the programs
- <a id="source-ddr"></a>**ddr**: a board memory channel is 64 data wires (DDR4/DDR5), a few to ten centimetres from the processor: general knowledge
- <a id="source-ear"></a>**ear**: engine `src/engines/listen.js` (its states, scale and voices), run tonight
- <a id="source-edge"></a>**edge**: the wires that leave a chip are limited by its edge and area (the "beachfront"): general knowledge
- <a id="source-fab2"></a>**fab2**: [Tom's Hardware](https://www.tomshardware.com/tech-industry/atomic-semi-rebrands-as-fab2-and-shifts-operations-to-texas) (facts `fab2`)
- <a id="source-flexrv"></a>**flexrv**: [Nature 2024, flexible 6502 chips](https://www.nature.com/articles/s41586-024-07306-2): Pragmatic's IGZO chips are made with photolithography on polyimide, not printed
- <a id="source-frame"></a>**frame**: the lab's own wording of a core question (`content/`), not a claim about the world
- <a id="source-hala"></a>**hala**: [Intel](https://newsroom.intel.com/artificial-intelligence/intel-builds-worlds-largest-neuromorphic-system-to) (facts `hala-point`)
- <a id="source-hameed"></a>**hameed**: [Hameed et al., ISCA 2010 / CACM](https://cacm.acm.org/research/understanding-sources-of-ineffciency-in-general-purpose-chips) (facts `asic-vs-cpu`, rechecked)
- <a id="source-hbm"></a>**hbm**: HBM sits on a silicon interposer (e.g. TSMC CoWoS-S) or silicon bridges (CoWoS-L, Intel EMIB), 1,024 data wires a stack to HBM3 and 2,048 to HBM4 (facts `hbm4`): general knowledge plus facts
- <a id="source-hear3"></a>**hear3**: the counter lab: four flip-flops and a half-adder chain (`src/engines/clockpower.js` counter())
- <a id="source-horowitz"></a>**horowitz**: [Horowitz, ISSCC 2014](https://doi.org/10.1109/ISSCC.2014.6757323)
- <a id="source-hycube"></a>**hycube**: [HyCUBE, ASSCC 2019](https://www.comp.nus.edu.sg/~tulika/ASSCC19.pdf) (facts `cgra-hycube`)
- <a id="source-ispd"></a>**ispd**: blocks given to a place-and-route program run from tens of thousands to a few million cells: general design knowledge; no single source found tonight
- <a id="source-kagan"></a>**kagan**: Kagan et al., Neuron 2022 (neurons in a dish learned a simple Pong-like task): from memory, not opened tonight
- <a id="source-kuon"></a>**kuon**: [Kuon and Rose 2007](https://www.eecg.utoronto.ca/~jayar/pubs/kuon/kuontcad06.pdf) (facts `fpga-asic-gap`)
- <a id="source-landauer"></a>**landauer**: [Landauer 1991](https://doi.org/10.1063/1.881299) and [Bérut et al. 2012](https://www.nature.com/articles/nature10872) (facts `landauer-1991`, `landauer-measured`): the floor is for erasing a bit
- <a id="source-lens"></a>**lens**: engine `src/engines/lens.js` (the lens models), read tonight
- <a id="source-lib"></a>**lib**: standard-cell libraries share one row height; multi-height cells (double-height flip-flops) exist: general design knowledge
- <a id="source-light"></a>**light**: c / 3 GHz = 0.0999 m (arithmetic)
- <a id="source-machine"></a>**machine**: engine `src/engines/machine.js` with `src/data/inventions.js`, `liquid.js`, `fabs.js`
- <a id="source-minimal"></a>**minimal**: [AIST](https://www.aist.go.jp/sst/en/exhibition/innovation_zone/zone21/index.html) (facts `minimal-fab`)
- <a id="source-myelin"></a>**myelin**: myelin speeds a nerve signal and takes volume (neuroscience textbooks): general knowledge
- <a id="source-nagy"></a>**nagy**: [Nagy, Farmer, Bui and Trancik 2013, abstract](https://arxiv.org/abs/1207.1463) (facts `wright-law`)
- <a id="source-nerve"></a>**nerve**: [BioNumbers](https://bionumbers.hms.harvard.edu/bionumber.aspx?id=108982) (facts `nerve-speed`)
- <a id="source-ohm"></a>**ohm**: a memory cell as a conductance: current = conductance × voltage, and currents on one wire add (Ohm's and Kirchhoff's laws)
- <a id="source-optics"></a>**optics**: [The Register 2025](https://www.theregister.com/2025/11/22/cpo_ai_nvidia_broadcom/) (facts `optics-power`): 11 to 19 pJ a bit for pluggables, less co-packaged; distance hardly matters
- <a id="source-parity"></a>**parity**: one parity bit detects any odd number of flipped bits, and misses two: general knowledge
- <a id="source-pedram"></a>**pedram**: [Pedram et al. 2016, Table I](https://arxiv.org/pdf/1602.04183) (facts `energy-moving-data`)
- <a id="source-pnr"></a>**pnr**: placement and routing by programs is how standard-cell logic is laid out (any physical-design text): general knowledge
- <a id="source-power"></a>**power**: engine `src/engines/clockpower.js`, run tonight: 3 GHz at 0.75 V gives 51 W; 2.25 GHz at 0.61 V gives 25.1 W
- <a id="source-pragmatic"></a>**pragmatic**: Pragmatic's own pages (facts `pragmatic-flexic`, `flexlogic-cost`, `silicon-turnaround`): vendor claims
- <a id="source-prowess"></a>**prowess**: [DARPA PROWESS](https://www.darpa.mil/research/programs/processor-reconfiguration-for-wideband-spectrum-sensing) (facts `prowess`)
- <a id="source-qant"></a>**qant**: [EE Times](https://www.eetimes.com/q-ant-hits-full-production-capacity-for-photonic-ai-processors/) (facts `qant-photonic`)
- <a id="source-rad"></a>**rad**: radiation flips bits in space and on Mars (single-event upsets), which is why rovers use hardened, voting parts: general knowledge
- <a id="source-reconf"></a>**reconf**: [arXiv 1701.08849](https://arxiv.org/pdf/1701.08849) (facts `fpga-reconfig-time`)
- <a id="source-secded"></a>**secded**: a 72-bit word with 8 check bits for 64 corrects one wrong bit and detects two (SECDED Hamming code): general knowledge
- <a id="source-shannon"></a>**shannon**: Shannon 1948: capacity = bandwidth × log2(1 + signal/noise) (engine `src/engines/bits.js`)
- <a id="source-sram"></a>**sram**: SRAM 6T cell: two cross-coupled inverters and two access switches (any CMOS textbook): general knowledge
- <a id="source-thermal"></a>**thermal**: thermal noise on a logic node is sqrt(kT/C), about 2 mV for 1 fF, against a swing of 0.7 V, and grows only as the square root of absolute temperature: physics
- <a id="source-thompson"></a>**thompson**: [Thompson 1996](https://cgi.cse.unsw.edu.au/~cs4601/refs/papers/es97thompson.pdf) (facts `thompson-evolved`)
- <a id="source-tmr"></a>**tmr**: triple modular redundancy: a majority of three masks one faulty copy (von Neumann 1956): general knowledge
- <a id="source-vaire"></a>**vaire**: [EE Times](https://www.eetimes.com/vaire-demos-energy-recovery-with-reversible-computing-test-chip/) (facts `vaire-ice-river`) and [Science News](https://www.sciencenews.org/article/computer-chip-reuses-energy) (facts `vaire-thirty`, new)
- <a id="source-walden"></a>**walden**: converter energy roughly doubles for each bit of resolution (the Walden figure of merit; at high resolution it rises toward four times a bit, Murmann's ADC survey): general knowledge, survey not opened
- <a id="source-wm"></a>**wm**: [Wulf and McKee 1995](https://libraopen.lib.virginia.edu/public_view/k35694375) (facts `memory-wall`)
- <a id="source-zeloof"></a>**zeloof**: [Tom's Hardware](https://www.tomshardware.com/news/man-builds-own-silicon-chip-at-home) (facts `zeloof-garage`)
