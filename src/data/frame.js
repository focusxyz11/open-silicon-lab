/* The thirteen core questions: the frame behind everything the lab shows (docs/FRAME13.md).

   They are never listed or shown together on the site. Each one is a lens: at any level of any view, the questions
   that live there are offered by their short names, and the one chosen is shown alone, with its form at that level,
   something true there, what can be played there, the question it meets there, and the way on (src/engines/frame.js,
   drawn by the card's Ask face in src/v2/frame.js).

   Data only; every word is in src/i18n/en.json.
   - QUESTIONS: id, word (the question itself; where the lab already had it, its existing home), icon (a 24 x 24 stroke
     path for its lens). Its short name is frame.q.<id>, what its lens shows frame.q.<id>.hint.
   - FILED: every experiment (src/data/experiments/) and every challenge (src/v2/game.js) filed once: its home question
     first, then the one or two it joins. A test checks nothing is left out.
   - THREAD_HOME: the earlier threads' stops (src/data/weave.js) belong to a question through the experiments filed
     under it; a stop no experiment names belongs to its thread's question here.
   - SEAMS: the pairs of questions that share content, each named for what joins them (frame.seam.<a>.<b>). */

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
  'counter': ['perfect', 'vn', 'dig'], 'quantize': ['eff', 'sutton', 'physics'], 'token-energy': ['eff', 'geo'], 'prefill': ['geo', 'eff'],
  'chef': ['geo', 'physics', 'eff']
  }
};

export const THREAD_HOME = { fail: 'perfect', scale: 'moore', divide: 'line', think: 'dig', strange: 'physics', limit: 'nat', life: 'copy', make: 'moore', know: 'human', open: 'human', idea: 'line' };

export const SEAMS = [
  ['moore', 'perfect'],
  ['eff', 'geo'],
  ['moore', 'physics'],
  ['geo', 'line'],
  ['human', 'sutton'],
  ['human', 'moore'],
  ['dig', 'line'],
  ['perfect', 'vn'],
  ['human', 'line'],
  ['geo', 'moore'],
  ['human', 'trust'],
  ['dig', 'physics'],
  ['eff', 'line'],
  ['nat', 'physics'],
  ['geo', 'perfect'],
  ['copy', 'physics'],
  ['nat', 'sutton'],
  ['sutton', 'trust'],
  ['perfect', 'trust'],
  ['trust', 'vn'],
  ['line', 'moore'],
  ['line', 'sutton'],
  ['copy', 'geo'],
  ['eff', 'moore'],
  ['eff', 'physics'],
  ['copy', 'dig'],
  ['eff', 'sutton'],
  ['copy', 'eff'],
  ['perfect', 'physics'],
  ['dig', 'vn'],
  ['copy', 'vn'],
  ['copy', 'nat']
];
