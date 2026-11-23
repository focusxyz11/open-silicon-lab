/* The thirteen core questions: the frame behind everything the lab shows (docs/FRAME13.md).

   They are never listed or shown together on the site. Each one is a lens: at any level of any view, the questions
   that live there are offered by their short names, and the one chosen is shown alone, with its form at that level,
   something true there, what can be played there, the question it meets there, and the way on (src/engines/frame.js,
   drawn by the card's Ask face in src/v2/frame.js).

   Data only; every word is in src/i18n/en.json.
   - QUESTIONS: id, word (the question itself; where the lab already had it, its existing home), icon (a 24 x 24 stroke
     path for its lens). Its short name is frame.q.<id>, what its lens shows frame.q.<id>.hint.
   - FILED: everything filed once, its home question first, then the one or two it joins. A test checks nothing is
     left out, nothing is filed twice and every question is real.
       field        the questions from the field (src/data/questions.js), which lead: where one has its home at a level,
                    it is the first form its home question takes there (src/engines/frame.js weighs it most)
       stops        the earlier threads' stops (STOPS in src/data/weave.js); the eleven threads are the earlier framework,
                    their words stay, and nothing new is filed by thread
       experiments  the experiments (src/data/experiments/)
       challenges   the challenges (src/v2/game.js)
   - MARKS: at each level, the part each lens that lives there is about, where its mark stands on the picture.
   - MEETS: the pairs of questions that share content, each named for what joins them (frame.meet.<a>.<b>), with the
     shape they are drawn in when both are held. */

export const QUESTIONS = [
  { id: 'perfect', word: 'field.perfect.q', icon: 'M5 8l0 0M9 15l0 0M13 6l0 0M17 12l0 0M7 19l0 0M15 18l0 0M19 6l0 0' },
  { id: 'dig', word: 'home.q.dig', icon: 'M2 16h4V8h6v8h6V8h4' },
  { id: 'vn', word: 'home.q.vn', icon: 'M5 6l0 0M12 6l0 0M19 6l0 0M5 15l4 4 10-10' },
  { id: 'sutton', word: 'home.q.sutton', icon: 'M3 20c6 0 9-4 11-9s4-7 7-7M3 20h18' },
  { id: 'moore', word: 'home.q.moore', icon: 'M4 20V5M9 20v-9M14 20v-5M19 20v-2' },
  { id: 'line', word: 'home.q.line', icon: 'M4 4h16v16H4zM12 4v16M15 8h2M15 12h2M15 16h2' },
  { id: 'trust', word: 'home.q.trust', icon: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM8 12l3 3 5-6' },
  { id: 'physics', word: 'home.q.physics', icon: 'M2 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0' },
  { id: 'eff', word: 'home.q.eff', icon: 'M13 2L5 14h6l-1 8 8-12h-6z' },
  { id: 'nat', word: 'home.q.nat', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18' },
  { id: 'geo', word: 'home.q.geo', icon: 'M4 4h16v16H4zM9 9h6v6H9z' },
  { id: 'copy', word: 'home.q.copy', icon: 'M8 8h12v12H8zM4 16V4h12' },
  { id: 'human', word: 'home.q.human', icon: 'M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v8c0 4-3 7-6.5 7S5 17 5 14v-2a1.5 1.5 0 0 1 3 0' }
];

export const FILED = {
  field: {
  pinhead: ['moore', 'physics'], heat: ['physics', 'eff'], nature: ['nat'], brain: ['copy', 'physics'], dark: ['geo', 'eff'],
  wires: ['geo', 'moore'], wear: ['perfect', 'physics'], spare: ['vn'], palm: ['geo', 'eff'], life: ['trust', 'vn'],
  fetch: ['geo', 'eff', 'copy'], wait: ['geo', 'copy'], secret: ['trust', 'dig'], lid: ['perfect', 'physics'], perfect: ['perfect'],
  copy: ['trust', 'perfect', 'human'], pins: ['trust'], later: ['perfect', 'trust'], trust: ['trust'], package: ['geo', 'moore'],
  purity: ['perfect', 'physics'], mask: ['physics', 'dig'], oxide: ['moore', 'physics'], batch: ['eff', 'line'], oxen: ['sutton', 'geo'],
  fabless: ['human', 'line'], printer: ['human', 'trust'], anyone: ['human', 'line'], cheaper: ['moore'], general: ['line'],
  lottery: ['sutton', 'line'], scale: ['sutton'], top: ['moore', 'sutton'], prove: ['trust'], onebad: ['perfect', 'geo'],
  quartz: ['human', 'trust'], neon: ['human', 'trust'], station: ['eff', 'geo'], jevons: ['eff'], dollar: ['line', 'human']
  },
  stops: {
  'think.rack': ['dig'], 'think.board': ['dig', 'line', 'eff'], 'think.chip': ['dig'], 'think.block': ['copy', 'dig'],
  'think.gate': ['line', 'dig'], 'think.switch': ['physics', 'dig'], 'think.atom': ['dig'],
  'think.soc': ['dig', 'copy'], 'think.mcu': ['dig', 'line'], 'think.logic': ['dig', 'trust'],
  'strange.chip': ['physics', 'moore'], 'strange.gate': ['physics'], 'strange.switch': ['physics', 'geo', 'copy'],
  'strange.atom': ['physics', 'nat'], 'strange.crystal': ['physics', 'perfect'],
  'strange.deposit': ['physics', 'moore'],
  'limit.rack': ['nat'], 'limit.chip': ['line', 'nat'], 'limit.gate': ['nat', 'sutton'],
  'limit.atom': ['physics', 'nat', 'eff'],
  'fail.building': ['vn', 'perfect', 'eff'], 'fail.board': ['geo', 'perfect', 'eff'],
  'fail.chip': ['perfect', 'dig', 'line'], 'fail.gate': ['perfect', 'vn'],
  'fail.switch': ['physics', 'perfect', 'moore'], 'fail.atom': ['physics', 'perfect', 'moore'],
  'fail.phoneboard': ['geo', 'perfect', 'eff'], 'fail.car': ['perfect'], 'fail.ecu': ['vn', 'perfect', 'trust'],
  'fail.wafer': ['perfect', 'moore', 'geo'], 'fail.check': ['trust', 'dig'], 'fail.gates': ['perfect', 'dig', 'line'],
  'fail.layout': ['perfect'], 'fail.print': ['perfect'], 'fail.etch': ['perfect', 'moore'],
  'fail.implant': ['perfect'], 'fail.test': ['trust', 'perfect', 'vn'], 'fail.pkg': ['geo', 'perfect', 'eff'],
  'fail.ship': ['perfect', 'moore'],
  'idea.chip': ['line', 'eff', 'geo'], 'idea.block': ['sutton', 'human'], 'idea.gate': ['trust', 'line'],
  'idea.soc': ['line', 'human'], 'idea.die': ['human', 'line'], 'idea.need': ['human', 'line'],
  'idea.check': ['sutton', 'human', 'trust'], 'idea.masks': ['line'], 'idea.deposit': ['line', 'moore', 'physics'],
  'make.chip': ['moore', 'nat'], 'make.switch': ['moore', 'physics'], 'make.atom': ['moore', 'physics'],
  'make.mcu': ['moore', 'human'], 'make.scanner': ['moore', 'nat'], 'make.wafer': ['moore', 'perfect'],
  'make.die': ['moore', 'geo', 'perfect'], 'make.gates': ['moore', 'geo', 'line'], 'make.masks': ['moore', 'dig'],
  'make.crystal': ['moore'], 'make.slice': ['moore'], 'make.clean': ['moore', 'human'], 'make.etch': ['moore'],
  'make.implant': ['perfect', 'moore'], 'make.wires': ['moore', 'geo'], 'make.pkg': ['moore', 'geo', 'perfect'],
  'know.chip': ['human'], 'know.switch': ['sutton', 'human'], 'know.phone': ['human'], 'know.car': ['human'],
  'know.logic': ['human'], 'know.crystal': ['human', 'sutton'], 'know.etch': ['human', 'sutton'],
  'open.chip': ['trust', 'human'], 'open.block': ['human'], 'open.gate': ['trust', 'human'],
  'open.phoneboard': ['human'], 'open.ecu': ['human'], 'open.scanner': ['human'], 'open.need': ['human', 'line'],
  'open.layout': ['human', 'moore'], 'open.clean': ['human'], 'open.ship': ['human'],
  'divide.building': ['line', 'geo', 'eff'], 'divide.rack': ['line', 'geo', 'eff'], 'divide.board': ['line'],
  'divide.chip': ['line', 'sutton'], 'divide.block': ['geo', 'copy', 'eff'], 'divide.phone': ['geo', 'eff'],
  'divide.soc': ['line', 'geo', 'eff'], 'divide.car': ['line', 'sutton'], 'divide.ecu': ['line'],
  'divide.need': ['line', 'moore', 'human'], 'divide.layout': ['line', 'geo'], 'divide.wires': ['moore', 'line'],
  'divide.test': ['geo', 'perfect', 'line'], 'divide.pkg': ['geo', 'copy', 'eff'], 'divide.ship': ['line'],
  'life.building': ['copy', 'eff', 'geo'], 'life.block': ['dig', 'copy', 'physics'],
  'life.switch': ['copy', 'physics'], 'life.atom': ['nat', 'physics', 'moore'], 'life.phone': ['copy', 'eff', 'geo'],
  'life.car': ['copy', 'physics', 'eff'],
  'scale.building': ['eff', 'moore', 'geo'], 'scale.chip': ['moore'], 'scale.switch': ['moore', 'sutton'],
  'scale.atom': ['moore', 'physics'], 'scale.phoneboard': ['moore', 'geo'], 'scale.soc': ['moore', 'sutton'],
  'scale.mcu': ['moore', 'perfect'], 'scale.scanner': ['moore', 'physics'], 'scale.gates': ['trust', 'sutton'],
  'scale.masks': ['moore'], 'scale.slice': ['moore', 'perfect'], 'scale.clean': ['moore'],
  'scale.print': ['moore', 'physics']
  },
  experiments: {
  'think-switch': ['physics', 'dig'], 'think-rewire': ['line', 'dig'], 'think-nand': ['dig', 'geo'], 'think-text': ['dig', 'trust'],
  'think-mcu': ['dig', 'line'], 'think-loop': ['copy', 'dig'], 'think-slice': ['dig', 'line'], 'think-adding': ['dig', 'line', 'eff'],
  'think-face': ['dig', 'copy'], 'think-seven': ['dig', 'line'], 'think-count': ['dig', 'eff'], 'think-add-down': ['dig'], 'think-where': ['dig'],
  'strange-gate': ['physics'], 'strange-domino': ['physics', 'nat'], 'strange-material': ['physics', 'moore'], 'strange-chain': ['physics', 'dig'],
  'strange-pure': ['physics', 'perfect'], 'strange-switch': ['physics', 'geo', 'copy'], 'strange-atom': ['physics', 'nat'],
  'strange-neurons': ['copy', 'nat'], 'strange-for': ['physics'], 'strange-score': ['nat', 'sutton'], 'limit-floor': ['physics', 'nat', 'eff'],
  'limit-cold': ['physics', 'nat'], 'limit-hard': ['nat', 'sutton'], 'limit-fell': ['moore', 'nat'], 'limit-never': ['nat'],
  'limit-all': ['trust', 'nat', 'sutton'], 'limit-frozen': ['line', 'nat'], 'limit-evolve': ['sutton', 'nat'],
  'fail-bigger': ['perfect', 'moore', 'geo'], 'fail-ontime': ['perfect', 'dig', 'line'], 'fail-atoms': ['physics', 'perfect', 'moore'],
  'fail-margin': ['perfect', 'vn'], 'fail-align': ['perfect'], 'fail-forgive': ['perfect'], 'fail-phone': ['perfect', 'moore'],
  'fail-car': ['perfect'], 'fail-heat': ['geo', 'perfect', 'eff'], 'fail-spot': ['trust', 'perfect', 'vn'], 'fail-counter': ['trust', 'dig'],
  'fail-enough': ['perfect', 'moore'], 'fail-cases': ['perfect'], 'fail-leak': ['trust', 'perfect'], 'fail-dc': ['vn', 'perfect', 'eff'],
  'fail-life': ['vn', 'perfect', 'trust'], 'idea-job': ['human', 'line'], 'idea-tradeoff': ['line', 'eff', 'geo'], 'idea-journey': ['human', 'line'],
  'idea-one-char': ['line', 'trust'], 'idea-two-ways': ['line', 'geo'], 'idea-placed': ['sutton', 'human'], 'idea-masks': ['line'],
  'idea-sure': ['trust', 'line'], 'idea-coverage': ['trust', 'vn'], 'idea-ai': ['sutton', 'human', 'trust'], 'idea-blocks': ['line', 'human'],
  'idea-precise': ['line', 'moore', 'physics'], 'idea-afford': ['human', 'moore'], 'make-light': ['moore', 'nat'], 'make-nomask': ['moore', 'dig'],
  'make-grow': ['moore', 'physics'], 'make-atoms': ['moore', 'physics'], 'make-etch': ['moore'], 'make-impure': ['perfect', 'moore'],
  'make-quick': ['moore', 'human'], 'make-layers': ['moore', 'geo'], 'make-package': ['moore', 'geo', 'perfect'], 'make-months': ['moore'],
  'make-room': ['moore', 'human'], 'make-crystal': ['moore'], 'make-round': ['moore', 'perfect'], 'make-cheap': ['moore', 'human'],
  'make-gates': ['moore', 'geo', 'line'], 'make-order': ['moore', 'perfect'], 'know-teams': ['human'], 'know-copy': ['human', 'trust'],
  'know-taste': ['human'], 'know-laser': ['human'], 'know-hands': ['human', 'sutton'], 'know-handover': ['human'], 'know-cheap': ['human'],
  'know-tune': ['sutton', 'human'], 'know-agent': ['trust', 'sutton', 'human'], 'know-why': ['human'], 'open-need': ['human', 'line'],
  'open-fab': ['human'], 'open-cents': ['human', 'line'], 'open-kit': ['human'], 'open-modem': ['human'], 'open-copy': ['trust', 'human'],
  'open-stops': ['trust', 'human'], 'open-one': ['human'], 'open-owe': ['human'], 'open-record': ['trust', 'human'],
  'open-split': ['human', 'moore'], 'open-shuttle': ['human'], 'divide-general': ['line', 'sutton'], 'divide-earn': ['line', 'geo', 'eff'],
  'divide-need': ['line', 'moore', 'human'], 'divide-made': ['line'], 'divide-wall': ['geo', 'copy', 'eff'], 'divide-fed': ['geo', 'line'],
  'divide-xray': ['geo', 'line'], 'divide-one': ['line', 'geo', 'eff'], 'divide-split': ['geo', 'perfect', 'line'],
  'divide-cores': ['line', 'eff', 'sutton'], 'divide-place': ['line', 'geo'], 'divide-industry': ['human', 'line'], 'divide-hand': ['geo', 'eff'],
  'divide-charge': ['line'], 'divide-order': ['moore', 'line'], 'life-watts': ['copy', 'eff', 'geo'], 'life-eye': ['copy', 'physics', 'eff'],
  'life-damage': ['vn', 'copy'], 'life-event': ['dig', 'copy', 'physics'], 'life-synapse': ['copy', 'physics'],
  'life-chem': ['nat', 'physics', 'moore'], 'life-trail': ['human', 'sutton'], 'life-rule': ['human', 'sutton'], 'scale-gen': ['moore', 'sutton'],
  'scale-atom': ['moore', 'physics'], 'scale-light': ['moore', 'physics'], 'scale-rules': ['moore', 'line', 'eff'],
  'scale-older': ['moore', 'perfect'], 'scale-afford': ['moore'], 'scale-fab': ['moore'], 'scale-wafer': ['moore', 'perfect'],
  'scale-double': ['moore'], 'scale-curve': ['moore'], 'scale-up': ['moore', 'geo'], 'scale-big': ['trust', 'sutton'], 'scale-forecast': ['moore'],
  'scale-planet': ['eff', 'moore', 'geo']
  },
  challenges: {
  'half': ['dig', 'line'], 'vote': ['vn', 'dig'], 'full': ['dig', 'line'], 'prove': ['trust', 'vn'], 'months': ['moore', 'human'],
  'quick': ['moore', 'human'], 'cheaper': ['perfect', 'geo', 'moore'], 'onebad': ['perfect', 'geo'], 'spot': ['trust', 'perfect'],
  'cores': ['perfect', 'line'], 'phone': ['perfect', 'vn'], 'car': ['perfect', 'vn', 'trust'], 'dclife': ['vn', 'perfect', 'eff'],
  'fed': ['geo', 'line'], 'fast': ['line', 'sutton'], 'oxen': ['line', 'sutton'], 'jevons': ['eff', 'moore'], 'agent': ['trust', 'sutton', 'human'],
  'batch': ['eff', 'geo', 'sutton'], 'newest': ['moore', 'human'], 'sig-heart': ['dig', 'physics'], 'sig-bearing': ['dig', 'physics'],
  'reg-jobs': ['human', 'eff'], 'jobs': ['line', 'human'], 'evolve': ['sutton', 'nat', 'human'], 'crystal': ['perfect', 'physics'],
  'furnace': ['physics', 'perfect'], 'shallow': ['moore', 'physics'], 'vias': ['perfect', 'moore'], 'etch': ['perfect', 'moore'],
  'bottom': ['perfect', 'moore'], 'litho-finest': ['moore', 'physics'], 'cim': ['copy', 'geo', 'physics'], 'grover': ['nat', 'physics'],
  'euv-1000': ['moore', 'eff'], 'too-hot': ['physics', 'perfect', 'dig'], 'ai-chip': ['moore', 'line'], piece: ['human', 'line'], floor: ['geo', 'line'], maskof: ['line', 'moore'], 'power-curve': ['eff', 'physics'],
  'counter': ['perfect', 'vn', 'dig'], 'flaky': ['vn', 'perfect', 'trust'], 'dieread': ['geo', 'trust', 'line'], 'silent': ['trust', 'vn', 'perfect'], 'rvrun': ['line', 'dig', 'human'], 'mortal': ['copy', 'physics', 'eff'], 'quantize': ['eff', 'sutton', 'physics'], 'token-energy': ['eff', 'geo'], 'prefill': ['geo', 'eff'],
  'chef': ['geo', 'physics', 'eff'],
  'corearch': ['line', 'eff', 'geo']
  }
};

/* where each lens is met on the picture: at every level, the part each question that lives there is about (a part the
   level's scene names, src/app/scenes.js, from the lens's strongest stop there). Its mark stands beside that part's name
   (src/v2/frame.js); two lenses may share a part where a level names fewer parts than lenses. A test checks every lens
   that lives at a level has its mark there, on a part that exists */
export const MARKS = {
  rack: { dig: 'servers', line: 'switch', nat: 'power', eff: 'switch', geo: 'power' },
  board: { geo: 'bigchip', line: 'memory', dig: 'power', eff: 'connectors', perfect: 'bigchip', copy: 'memory' },
  chip: { line: 'cache', eff: 'cores', geo: 'io', sutton: 'clock', trust: 'cores', perfect: 'clock' },
  block: { geo: 'sram', copy: 'wires', physics: 'cells', eff: 'yours', dig: 'cells', perfect: 'sram' },
  gate: { vn: 'gates', physics: 'diff', perfect: 'metal', dig: 'gates', trust: 'metal', copy: 'diff' },
  switch: { physics: 'gate', moore: 'source', copy: 'channel', dig: 'oxide', sutton: 'drain', perfect: 'channel' },
  atom: { physics: 'dopant', moore: 'lattice', nat: 'electrons', dig: 'boundary', perfect: 'boundary', eff: 'lattice' },
  building: { eff: 'racks', sutton: 'cooling', geo: 'racks', vn: 'racks', line: 'racks', copy: 'cooling' },
  phone: { geo: 'board', eff: 'battery', copy: 'camera', human: 'antenna' },
  phoneboard: { human: 'modem', moore: 'soc', geo: 'pmic', dig: 'storage', eff: 'soc', perfect: 'pmic' },
  soc: { line: 'cpu', perfect: 'gpu', dig: 'npu', moore: 'isp', vn: 'cache', sutton: 'cpu' },
  car: { line: 'controllers', human: 'wiring', perfect: 'sensors', copy: 'battery', sutton: 'motor', physics: 'wheels' },
  ecu: { trust: 'mcu', vn: 'connector', dig: 'drivers', line: 'drivers', human: 'mcu', perfect: 'mcu' },
  mcu: { moore: 'flash', perfect: 'cores', dig: 'sram', human: 'periph', vn: 'cores', line: 'cores' },
  scanner: { human: 'source', moore: 'mirrors', trust: 'mask', physics: 'stage', nat: 'vacuum' },
  wafer: { perfect: 'defects', moore: 'dies', geo: 'defects' },
  die: { perfect: 'pads', moore: 'cores', geo: 'probes', human: 'scribe', line: 'cores' },
  need: { line: 'ins', human: 'use', moore: 'outs' },
  logic: { dig: 'code', line: 'table', human: 'code', trust: 'code' },
  check: { trust: 'waves', dig: 'verdict', vn: 'waves', line: 'verdict', sutton: 'verdict', human: 'verdict' },
  gates: { sutton: 'cells', line: 'outs', perfect: 'pins', vn: 'cells', trust: 'pins', dig: 'outs' },
  layout: { line: 'tile', human: 'shared', geo: 'tile', perfect: 'tile', moore: 'shared' },
  masks: { moore: 'masks', line: 'reticle', perfect: 'masks', dig: 'reticle' },
  crystal: { perfect: 'melt', physics: 'sand', moore: 'ingot', human: 'furnace', sutton: 'furnace' },
  slice: { moore: 'saw', perfect: 'wafers' },
  clean: { moore: 'filters', human: 'track' },
  deposit: { moore: 'gas', physics: 'tool', perfect: 'pod', line: 'efem', human: 'xfer' },
  print: { moore: 'scanner', perfect: 'pod', physics: 'light', eff: 'efem' },
  etch: { perfect: 'tool', moore: 'plasma', human: 'people', sutton: 'efem', trust: 'pod' },
  implant: { perfect: 'beam', moore: 'pod', physics: 'efem' },
  wires: { moore: 'loop', geo: 'polish', line: 'pod' },
  test: { trust: 'needles', perfect: 'map', line: 'pod', geo: 'efem', vn: 'shelf' },
  pkg: { geo: 'memory', perfect: 'lid', moore: 'substrate', eff: 'die', physics: 'substrate', copy: 'memory' },
  ship: { perfect: 'trays', vn: 'tray', trust: 'boxes', human: 'datacentre', line: 'phone', moore: 'car' }
};

/* where two lenses meet (#315): the pairs of questions that share content, each named for what joins them
   (frame.meet.<a>.<b>), with a question neither asks alone (.q) and what is still open there (.open). Held together, a
   pair is drawn in one of three shapes, as the field questions have theirs:
     front  the two measures against each other, today's best compromises as a line, your design a dot on it, and an
            innovation that moves the whole line; only where one engine computes both measures at once (front: the
            function of src/engines/lens.js that does), never faked
     fork   the same level built two ways, split by a line you drag across the picture (fork: an engine that measures
            both ways; without one, each side shows its own lens's measures)
     chain  one level's problem becoming the next, step by step, each lighting as its threshold is passed (chain: the
            engine of the steps; a chain is drawn only where there is one)
   (`seam` is the line between two cells of the grid where a field question rises: src/engines/way.js) */
export const MEETS = [
  { a: 'moore', b: 'perfect', shape: 'chain' },
  { a: 'eff', b: 'geo', shape: 'front', front: 'geoEffFront' },
  { a: 'moore', b: 'physics', shape: 'chain' },
  { a: 'geo', b: 'line', shape: 'fork' },
  { a: 'human', b: 'sutton', shape: 'fork' },
  { a: 'human', b: 'moore', shape: 'chain' },
  { a: 'dig', b: 'line', shape: 'fork' },
  { a: 'perfect', b: 'vn', shape: 'fork' },
  { a: 'human', b: 'line', shape: 'fork' },
  { a: 'geo', b: 'moore', shape: 'fork' },
  { a: 'human', b: 'trust', shape: 'fork' },
  { a: 'dig', b: 'physics', shape: 'chain', chain: 'cleanOne' },
  { a: 'eff', b: 'line', shape: 'fork' },
  { a: 'nat', b: 'physics', shape: 'fork' },
  { a: 'geo', b: 'perfect', shape: 'chain' },
  { a: 'copy', b: 'physics', shape: 'fork', fork: 'memoryFork' },
  { a: 'nat', b: 'sutton', shape: 'fork' },
  { a: 'sutton', b: 'trust', shape: 'chain' },
  { a: 'perfect', b: 'trust', shape: 'chain' },
  { a: 'trust', b: 'vn', shape: 'fork' },
  { a: 'line', b: 'moore', shape: 'fork' },
  { a: 'line', b: 'sutton', shape: 'fork' },
  { a: 'copy', b: 'geo', shape: 'fork' },
  { a: 'eff', b: 'moore', shape: 'chain' },
  { a: 'eff', b: 'physics', shape: 'fork' },
  { a: 'copy', b: 'dig', shape: 'fork' },
  { a: 'eff', b: 'sutton', shape: 'chain' },
  { a: 'copy', b: 'eff', shape: 'fork' },
  { a: 'perfect', b: 'physics', shape: 'chain' },
  { a: 'dig', b: 'vn', shape: 'fork' },
  { a: 'copy', b: 'vn', shape: 'fork' },
  { a: 'copy', b: 'nat', shape: 'fork' }
];
