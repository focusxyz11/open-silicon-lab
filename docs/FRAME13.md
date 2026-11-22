# The thirteen as lenses

The lab is framed by thirteen core questions. They are not a page and never a list: they are the way everything else
is filed and the way it is seen. Each one is a **lens**. At any level of any view, the questions that live there are
offered by their short names under Ask, and the one chosen is shown alone. Choosing it changes the picture to show
what that question is about there.

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
- The pairs of questions that share content, each named for what joins them (`SEAMS`, words `frame.seam.<a>.<b>`).

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
- **it meets**: the question it shares most with here, by a named seam where there is one. When that one lives at
  this level too, it is a button that turns the lens;
- **the way on**: the nearest other level in the view's own order where the question lives too;
- **it also asks here**: up to two more of its stops or experiments at this level.

## On the picture

The card's Ask face (`src/v2/frame.js`) is the lens bar, then the chosen lens's card (made by `lensCard` in
`src/v2/glue/frame.js`), then the questions people were stuck on and what they asked. The lens lights its parts:

- in the dive, the line and the studio (flat pictures), the stop it shows lights its thread's parts, and the Ask
  marks on the picture are only the lens's own;
- on a level drawn in 3D, the marks are only the lens's own;
- the flights' levels that are a dive level by another name (the hall and the campus are the building, the server
  is the rack, the handset is the phone, the cabin is the car) offer that level's lenses.

## On the map

The first page (`src/data/home.js`) draws the thirteen as threads through its stations, one at a time.

## Next

- A visual language of its own for each lens, beyond lighting a thread: what *Geometry* or *Efficiency fuels use*
  repaints on a picture.
- Playable models for the thinnest questions (done: *Whole beats parts*, `flaky`; *Brain or copy*, `mortal`):
  *Beyond computation*, *Compute beats cleverness*, *Efficiency fuels use*, *Fight or use physics*, *Only humans*, *Trust without
  inspection*.
- Lenses in the factory line's and the studio's own pictures, and on the island.
- The worlds made from the documents in `content/` (`#/w`), filed the old way, refiled under the thirteen.
