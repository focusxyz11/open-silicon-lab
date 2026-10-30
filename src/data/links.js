/* The kinds of connection between two topics. A link is never just a line: each kind means one
   thing, asks the reader one question, and gets its own way of being shown.

   A link is written in one topic's topic.json and reads as a sentence:
     { "kind": "builds-on", "to": "physics", "why": "doping and fields make the switch" }
     → "The transistor builds on From sand to switch: doping and fields make the switch."
   Use "from" instead of "to" when the other topic is the subject of the sentence:
     { "kind": "feeds", "from": "design", "why": "the netlist gets placed" }   (in layout)
     → "Logic design feeds into Physical layout: the netlist gets placed."

   To choose a kind, go down this list and take the first one that is true. The order runs from
   the most concrete relation to the most general one. */
export const LINK_KINDS = {
  'part-of': {
    t: 'Part of', out: 'Part of', back: 'Made of',
    ask: 'What is it inside, and what is inside it?',
    test: 'It sits inside the other: you could point at it in the finished thing.',
    example: 'transistor part-of architecture: billions of switches make up a processor',
    noLoops: true
  },
  'kind-of': {
    t: 'Kind of', out: 'One kind of', back: 'Includes',
    ask: 'What else is like it?',
    test: 'It is one member of a family that the other topic describes.',
    example: 'quantum kind-of beyond: one of the new kinds of computer',
    noLoops: true
  },
  'feeds': {
    t: 'Feeds', out: 'Feeds into', back: 'Fed by',
    ask: 'Where does the work go next?',
    test: 'What this step produces is what the other step starts from.',
    example: 'layout feeds litho: the layout becomes masks',
    noLoops: true
  },
  'causes': {
    t: 'Causes', out: 'Changes', back: 'Changed by',
    ask: 'If this changes, what happens there?',
    test: 'A change here changes the other, and you can say which way. Also give "if" (the change here) and "then" (what happens there).',
    example: 'yield causes economics: if yield falls, then each working chip costs more'
  },
  'grew-from': {
    t: 'Grew from', out: 'Grew from', back: 'Led to',
    ask: 'Where did it come from?',
    test: 'It historically came out of the other.',
    example: 'riscv grew-from architecture: Berkeley\'s RISC research of the 1980s',
    noLoops: true
  },
  'builds-on': {
    t: 'Builds on', out: 'Builds on', back: 'Foundation for',
    ask: 'What does it rest on?',
    test: 'It uses the ideas or methods of the other as its foundation.',
    example: 'transistor builds-on physics: doping and fields make the switch',
    noLoops: true
  }
};
export const KIND_ORDER = Object.keys(LINK_KINDS);

/* How long the text fields may be, so they fit on a card and in a map label. */
export const LIMITS = { why: 90, if: 80, then: 110, how: 110 };
