# The community chip

Small designs by learners, gathered into one real Tiny Tapeout project. Every design here is
checked automatically (it must parse, meet its project's specification, synthesize, route, and pass
real Verilog simulation in CI), then the site shows it on the shared tile at `#community`.

## Add your design

The easiest way: open **The community chip** on the site, choose your design from the tiny-chip
studio, and press **Prepare my submission**. It opens GitHub with the file already written; you only
have to propose the change.

By hand: add a folder `community/<name>/` (lowercase letters, digits and dashes) with a
`design.json`:

```json
{
  "title": "Parity checker",
  "author": "your name or GitHub handle",
  "description": "One sentence: what it does.",
  "added": "2026-11-02",
  "ins": ["a", "b", "c", "d"],
  "outs": ["odd"],
  "code": "odd = a ^ b ^ c ^ d;"
}
```

Either name a studio project with `"project": "count"` (the design is then checked against that
project's specification), or give your own `"ins"` and `"outs"` (up to 8 each). A clocked design
of your own adds `"clocked": true` and `"tests"`: a list of 0s and 1s per input, one per clock cycle.

Then run `npm run catalog`. It checks every design and explains any problem in plain words.

## What happens next

The chip holds up to 32 designs and about 900 cells. When it has enough, the maintainers decide
whether and when to submit it to a Tiny Tapeout run; nothing is promised yet. Every design keeps its
author's name in the chip's documentation.
