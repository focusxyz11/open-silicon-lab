# The thirteen as lenses

The lab is framed by thirteen core questions. They are not a page and never a list: they are the way everything else
is filed and the way it is seen. Each one is a **lens**. A core question is met on the picture, where it lives, one
at a time: at any level of any view, each question that lives there has a mark beside the part it is about, and the
one tapped is shown alone. There is no row of their names anywhere. Opening one changes the picture to show what that
question is about there.

## The thirteen

| id | short name (`frame.q.<id>`) | the question (its word key) |
|---|---|---|
| perfect | Perfect fails | `field.perfect.q` |
| dig | Digital meets physical | `home.q.dig` |
| vn | Whole beats parts | `home.q.vn` |
| sutton | Compute beats cleverness | `home.q.sutton` |
| moore | The next Moore's law | `home.q.moore` |
| line | Fixed or fluid | `home.q.line` |
| trust | Trust without inspection | `home.q.trust` |
| physics | Fight or use physics | `home.q.physics` |
| eff | Efficiency fuels use | `home.q.eff` |
| nat | Beyond computation | `home.q.nat` |
| geo | Geometry | `home.q.geo` |
| copy | Brain or copy | `home.q.copy` |
| human | Only humans | `home.q.human` |

This table is for people building the lab. The site never shows it.

## How a question lives at a level

`src/data/frame.js` files everything once, in `FILED`: its home question first, then the one or two it joins. A test
fails if anything is left out, filed twice, or filed under a question that does not exist.

- **The questions from the field lead** (`FILED.field`, the 40 of `src/data/questions.js`): real people stuck at a
  turning point, with sources. Each is filed by what it asks and where its source leads: *Why does fetching a number
  cost far more than using it?* is Geometry first, and joins Efficiency fuels use and Brain or copy. Where one has its
  home at a level, it is the first form its home question takes there.
- **The earlier threads' stops** (`FILED.stops`, `stop.<thread>.<level>` in `src/data/weave.js`): each filed by what
  it asks. The eleven threads are the earlier framework: their words stay, and nothing new is filed by thread.
- **Every experiment** (`FILED.experiments`, `src/data/experiments/`) and **every challenge** (`FILED.challenges`,
  `src/v2/game.js`).
- **Where two meet** (`MEETS`): the pairs of questions that share content, each named for what joins them (words
  `frame.meet.<a>.<b>`), with a shape and a question of its own (see *Holding two lenses*). A *seam* is something else: the
  line between two cells of the grid where a field question rises (`src/engines/way.js`).

`src/engines/frame.js` weighs it (`createLenses`): a question lives at a level through the field questions whose home
is there (its home ones weigh 3, a join 1), the stops there (home 2, join 1), the challenges played there, and the
experiments that run through it. `lensesAt(level)` gives the ones that live there, most at home first, at most six; a
question that is home to a field question at a level always lives there. `lensAt(q, level, levels)` gives what one
lens holds there:

- **its field questions** (`field`): those filed under it with their home here, its home ones first;
- **its form here**: the stop it is most about at this level, shared out so that no two lenses at a level show the
  same one, or words written for it at this level (`frame.at.<q>.<level>.q` and `.note`) where no stop fits;
- **true here**: the stop's note;
- **play it here**: the challenges played at this level that are filed under it;
- **it meets**: the question it shares most with here, by a named meeting where there is one. When that one lives at
  this level too, it is a button that turns the lens;
- **the way on**: the nearest other level in the view's own order where the question lives too;
- **it also asks here**: up to two more of its stops or experiments at this level.

## On the picture

**Marks** (#303). At each level, the part each lens that lives there is about is in `MARKS` (`src/data/frame.js`, a
part the level's scene names, from the lens's strongest stop; a test checks every living lens has one). The frame
(`src/v2/frame.js`) draws a mark, the lens's icon in a ring with a slow pulse and its short name on hover or focus,
beside that part's name on the picture: every view's part names carry the part's one name in the atlas (`data-word`),
so the mark follows the picture as it moves, in 2D and 3D alike. While you look, the picture carries the three
strongest marks (by the lens weights of `src/engines/frame.js`); with Ask open, one for every lens that lives there
(at most six); while a challenge has the card, none. Marks stand clear of the frame's own things (the way in, the card,
the rails, the path), and where a view does not name a mark's part, it stands beside a part the view does name, or in a
row across the top of the picture where it names none. Marks are buttons: Tab reaches them and Enter opens one.

The card's Ask face, with no lens open, says in one sentence that the marks are the questions that live here, then the
questions people were stuck on and what they asked. A mark tapped opens its lens alone (its icon and short name, then
its card, made by `lensCard` in `src/v2/glue/frame.js`, and *Put it down*); the other marks dim, and tapping one switches
to it. On a phone the sheet's peek keeps the open lens's question. The lens lights its parts:

- in the dive, the line and the studio (flat pictures), the stop it shows lights its thread's parts, and the Ask
  marks on the picture are only the lens's own;
- on a level drawn in 3D, the marks are only the lens's own;
- the flights' levels that are a dive level by another name (the hall and the campus are the building, the server
  is the rack, the handset is the phone, the cabin is the car) offer that level's lenses.

## Each lens repaints the picture

A lens, when on, changes the picture itself, not only the card (#304). Each core question has a visual language of
its own, meant to work at every level, and the card holds the rest of its anatomy:

1. **The repaint:** what it paints on the picture.
2. **Its form here:** the question from the field that lives here, else words of its own or its strongest stop, in
   large type.
3. **True here:** one sentence.
4. **One control and its measures,** from an engine: no number is written by hand.
5. **The question behind:** the core question, small, under it.
6. **Meets** the lens it shares most with here, and **↑ ↓**, which keep the lens on where it lives at the next level and
   put it down, saying so, where it does not.

**Painted from the parts, not by hand.** A lens is a rule over facts the level's parts carry, written once per level
(`FACTS` in `src/data/partfacts.js`: each part's kind, logic, memory, wire or input and output, and who decided it, a
program, a person, or nobody yet; where each part is comes from the level's scene). Its model (`src/engines/lens.js`)
turns the facts and the control into its measures, through the lab's engines, and its paint (`src/v2/lenspaint.js`,
one registry, `PAINT`) draws them in the level's plan, the scene's 1000 by 1000, as an SVG layer of its own. The layer
is pinned onto the picture by where the plan's four corners are on the screen (`toScreen` on a 3D level, `planCorners`
on the flat dive): a plane seen in perspective is one projective map, so the same paint serves a 3D level and a flat
scene, and each lens's layer can be drawn beside another's. A new level needs its parts' facts, not new drawing code.
No words are painted on the picture; motion only where it carries meaning (energy travelling, currents adding), and
none with reduced motion.

**Built, at the block** (the six that live there):

| Lens | The repaint | Control | Measures, and their engine |
| --- | --- | --- | --- |
| *Geometry* | every wire coloured by its length; every trip from the logic to the memory; the logic where the control puts it, its heat as it packs | where the logic sits, spread out to packed beside memory | average trip to memory, the hottest patch (the parts' geometry) |
| *Efficiency fuels use* | a fetch from memory a big pulse travelling to the logic, a sum a small spark where it lands, as many as there are answers | each answer made cheaper again | energy per answer (`budget.js`), answers asked and the power of them all (Jevons' bet, `bet.js`) |
| *Brain or copy* | the memory array fading as the numbers move into the logic, each cell there tinted by how well its copy answers | memory kept inside the logic | energy per answer, right answers on this chip and on a copy (`mortal.js`) |
| *Digital meets physical* | one wire's bits, filled for 1 and open for 0, the ones read wrong ringed; a scope in the card | noise on the wire | bits read wrong (the noise's tail past the line where 1 begins) |
| *Fight or use physics* | margins round the logic and check bits beside the memory (fight); currents adding down the memory's columns, straying as it heats (use) | how hot it runs | energy per sum each way (`paradigms.js`), answers off as hot silicon leaks (`dope.js`) |
| *Perfect fails* | every copy of a cell its own speed, the late ones red | the clock | signals that arrive late (your chip's model, `chip.js`) |

*Only humans* is built too (each part tinted by who decided it; a program draws many layouts of your design, every one
right, from the bench's place-and-route, and the choice among them is a person's), and paints wherever it lives at a
level with facts; since the field questions lead (#302) it is the seventh at the block, so it shows there only once it
lives there again.

**The other six, to build once these are approved:**

- *Whole beats parts:* spares and votes. Each block drawn with its copies beside it and a voter where they meet; a part
  that fails greys out, and the vote that still comes out right lights. Control: how many copies; measures: wrong
  answers per billion, and what the copies cost in area and energy (`redundancy.js`, `errors.js`).
- *Compute beats cleverness:* search against design. The person's design and the layouts a search tries, drawn in
  turn as the search runs longer, the best so far held; control: how much computing the search gets; measures: how
  close it comes to the design, and what it spent (`evolve.js`).
- *The next Moore's law:* the same part a generation on. A ghost of each part at its next node's size laid over it,
  shrinking or not; control: the generation; measures: parts in the same area, cost per part (`chip.js`, `facts.json`
  node figures).
- *Fixed or fluid:* what is fixed and what can change. Fixed parts drawn solid, the ones software or a fabric can
  rewire drawn as outlines that move; control: how much of the level is made to change; measures: what changing costs
  in speed and energy, and how fast it reshapes (`machine.js`, liquid hardware).
- *Trust without inspection:* what is checked and what nobody checked. Every part shaded by how it was checked, by a
  test, a proof or nothing, and the unchecked left bare; control: how many tests run; measures: faults caught and the
  share nobody looked at (`design.js` coverage).
- *Beyond computation:* what computes here and what nothing can. The parts that do the work lit, the rest of the
  picture dimmed to what no chip could compute however big; control: the size of the problem; measures: the steps it
  takes and the floor physics sets (`floor.js`, `paradigms.js`).

## Holding two lenses

Two lenses held at once show where they meet (#315). In a lens's card, *Meets X* gains *Hold both*, and the other
lenses living there that it meets offer *Hold with X*. Holding both replaces the one-lens view, it does not stack on it:
the card shows both names, where they meet, the shape, the pair's own question (one neither lens asks alone), *true
here*, the pair's instrument, what is still open there, and *Put down X* for either. Both marks are lit, the rest dim.
A level the pair does not live at puts down the lens that is missing, saying so.

Each pair in `MEETS` (`src/data/frame.js`) has a shape, the same grammar as the questions from the field:

- **A front:** the two measures against each other, today's best compromises as a line, your design a dot on it, the
  corner nobody has reached shaded, and an innovation, a second control, that moves the whole line. Only where one
  engine computes both measures at once (`front`, the function of `src/engines/lens.js` that does); a front is never
  faked. At the block: *Geometry* × *Efficiency fuels use*, "moving data costs the energy" (`geoEffFront`: energy per
  answer from the budget engine, scaled by the length of the trips; the hottest patch from the room the logic keeps;
  the innovation, the memory moved into the rows in slices).
- **A fork:** the same level built two ways, split by a line you drag across the picture (a handle on it, or a control
  in the card), with the measures of both ways side by side. At the block: *Brain or copy* × *Fight or use physics*,
  "memory that computes" (`memoryFork`: exact bits against the numbers kept in the cells; energy per sum, answers off as
  it heats, how well a copy answers). A fork with no engine of its own shows each lens's measures on its side.
- **A chain:** one level's problem becoming the next, numbered on the picture, each step lighting as its threshold is
  passed. At the block: *Fight or use physics* × *Digital meets physical*, "making a clean 1" (`cleanOne`: heat makes
  the silicon leak, the leak shakes the wire, a gate misreads a bit, a word with two bits wrong gets past its check
  bits; a bigger swing on the wire buys margin at the square of its voltage in energy).

The picture is drawn from the two lenses' own paint layers and the shape's layer over them (`src/v2/lenspaint.js`):
a fork clips one way to each side of its line, a chain adds its steps as pins over the picture (HTML, never words in
the picture), a front adds the memory moved into the rows. So a pair at a new level needs data, not new drawing code.
The block's other pairs (*Brain or copy* with *Geometry*, *Efficiency fuels use* and *Digital meets physical*, and
*Efficiency fuels use* with *Fight or use physics*) are forks that show each lens on its side. A test checks every pair
has a shape and its question, and that every front names an engine function that gives both its measures. Attempts at a
front kept in the ledger, each a point on its chart, are a task of their own.

## On the map

The first page (`src/data/home.js`) draws the thirteen as threads through its stations, one at a time.

## Next

- The repaint at more levels: each needs its parts' facts (`src/data/partfacts.js`), and the six lenses above, then
  the other six, paint them.
- Playable models for the thinnest questions (done: *Whole beats parts*, `flaky`; *Brain or copy*, `mortal`):
  *Beyond computation*, *Compute beats cleverness*, *Efficiency fuels use*, *Fight or use physics*, *Only humans*, *Trust without
  inspection*.
- Lenses in the factory line's and the studio's own pictures, and on the island.
- The worlds made from the documents in `content/` (`#/w/<id>`), filed the old way, refiled under the thirteen. Since #305 they are reading pages only: a lens whose form at a level is one of a world's stops offers *Read more* there, and nothing lists the eleven.
