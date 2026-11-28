/* A card for each core question (#517; the prototype and its design: docs/prototypes/cards/README.md): the whole
   question, one still picture you can move, why it matters, and where it lives in the lab. The view is src/v2/qcard.js
   at #/q/<id>; one card at a time, never a row, list or menu of them (the only way from one card to another is It
   meets).

   Data only; every word is in src/i18n/en/cards.json (qc.<id>.*: stand, cap, the controls h and v with their ends
   h0 h1 v0 v1, why.chip why.ai why.beyond, true, open). What a card shows of the lab (where the question lives, what
   it meets, the questions from the field under it) is read from src/data/frame.js and src/data/places.js, never
   written here.
   - pic: the module that draws its picture (src/v2/qcpics<n>.js, loaded when the card opens) under the question's id
   - two: the picture has a second control (↕) besides the first (↔)
   - facts: the facts its True line names (src/data/facts.json); every number in that line is in one of them
     (tests/qcard.test.mjs). src: a source that is the lab's own model rather than a fact (its words: qc.<id>.src)
   - open: where its Still open is already written, when it is (nothing is written twice); ask: a question from the
     field to show under It also asks when none is filed under it first
   - engine: what computes the picture (for the build's notes and the tests): an engine of the lab, or 'here' where
     the prototype's stand-in still runs in the picture's module */
export const CARDS = {
  perfect: { pic: 1, facts: ['sdc-rate'], engine: 'here' },
  dig: { pic: 1, facts: [], src: 'model', engine: 'here', open: 'frame.meet.dig.physics.open', ask: 'secret' },
  vn: { pic: 1, two: true, facts: ['vn-1956'], engine: 'here' },
  sutton: { pic: 2, facts: ['sutton-2019'], engine: 'here' },
  moore: { pic: 2, two: true, facts: ['transistor-trend', 'clock-stall'], engine: 'data/hold.js' },
  line: { pic: 2, two: true, facts: ['asic-vs-cpu'], engine: 'engines/fixedfluid.js' },
  trust: { pic: 1, facts: ['fdiv-rate'], engine: 'engines/floor.js' },
  physics: { pic: 3, facts: ['landauer-measured'], engine: 'here' },
  eff: { pic: 1, two: true, facts: ['dc-electricity'], engine: 'here' },
  nat: { pic: 3, facts: ['rule110-cook'], engine: 'engines/automaton.js' },
  geo: { pic: 3, two: true, facts: ['energy-moving-data'], engine: 'here' },
  copy: { pic: 3, facts: ['brain-power'], engine: 'engines/mortal.js' },
  human: { pic: 3, facts: ['agentic-eda'], engine: 'here' }
};
/* the three parts of Why it matters, the same for every question: what the lab asks of a core question */
export const WHY = ['chip', 'ai', 'beyond'];
/* the four depths every chip shares, and the rungs of your stack from the bottom up (src/data/path.js RUNGS) */
export const SHARED_DEPTHS = ['block', 'gate', 'switch', 'atom'];
/* the places of the Map's cut, in the loop's order: each digs a shaft of its levels (src/data/places.js) */
export const CUT = ['studio', 'quarry', 'fab', 'test', 'port', 'datacentre', 'phones', 'cars'];
