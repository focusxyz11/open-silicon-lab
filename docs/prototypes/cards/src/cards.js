/* The words of each card. cap: what the picture is. h, v: the two controls [one end, its name, the other end].
   true: one thing that is true, with where it comes from (src: text, url, the kind of source as in the lab's facts.json).
   open: what nobody knows. eng: for the build, the engine behind the picture. */
const CARDS = {
  perfect: {
    cap: "144 copies of one drawing. Each bar shows how close that copy’s slowest signal comes to the clock’s tick: a full bar is only just in time. Red: it arrives after the tick, so the copy fails.",
    stand: "A design is an idea and a chip is a thing. What goes wrong lives in the gap between the two.",
    why: ["A design is checked as if every copy were the same. The factory makes billions of copies that each differ a little, heat up and age. Margins, tests and spares all exist to cover that gap.", "A design written by AI is right only as far as its checks go. And the largest AI machines use so many chips that rare faults turn up every day.", "Bridges, medicines, laws and software meet the same gap: a plan that is right on paper, in a world that never matches the paper."],
    h: ['slower', 'The clock you ask for', 'faster'],
    true: 'Meta’s engineers report silent wrong answers from about one in a thousand of their chips: chips made from a correct design, which had passed their tests.',
    src: [{ t: 'Meta, arXiv 2203.08989', u: 'https://arxiv.org/abs/2203.08989', k: 'reported' }],
    open: 'How small can a part be made and still come out as a copy, rather than as a one-off?',
    eng: 'The picture is the lens’s own language (every copy its own speed, the late ones red) with no level under it. In the lab the numbers come from <code>perfect()</code> in <code>src/engines/lens.js</code>, your chip’s model; here the copies’ spread is a stand-in with round numbers.'
  },
  dig: {
    cap: "One wire carrying sixteen bits. Above the dashed line the machine reads a 1, below it a 0. Ringed in red: a bit the noise carried across the line.",
    stand: "A 0 and a 1 are an agreement about a messy, continuous world. Everything digital rests on how well that agreement holds.",
    why: ["No wire carries a 1. It carries a voltage, shaken by heat, that a circuit agrees to call a 1. Keeping that agreement costs energy at every switch, billions of times a second.", "AI’s arithmetic can live with small errors. So designers now ask how clean a bit has to be: fewer bits for each number, lower voltages, even analog signals.", "Wherever something continuous is turned into a yes or a no, the same line is drawn: a medical test, a vote count, a pass mark. Where the line sits decides what is lost."],
    h: ['small swing', 'How far apart a 0 and a 1 are kept', 'big swing'],
    true: 'A 1 is only a voltage above a line. Heat shakes every wire, and a bigger swing keeps the 1 clean at a price: the energy grows with the square of the voltage.',
    src: [{ t: 'the lab’s clean-1 chain, src/engines/lens.js', u: '', k: 'model' }],
    open: 'Which answers could be a little wrong without anyone being harmed?',
    ask: 'How can a chip that does exactly what it should still give away secrets?',
    eng: 'Built from <code>digital()</code> and <code>cleanOne()</code> in <code>src/engines/lens.js</code>: the share of bits read wrong is the tail of the noise past the line, and the energy goes with the square of the swing. The same formulas run here.'
  },
  vn: {
    cap: "Ten runs, one in each row. The small squares are the parts’ answers; the large square is what their vote gives. Red: wrong.",
    stand: "Nothing reliable is made of reliable parts. It is made reliable by how unreliable parts are put together.",
    why: ["Memory corrects its own flipped bits. A data centre keeps running while machines in it fail every day. A car doubles the circuits a life depends on.", "A language model is a part that is sometimes wrong, and people now build systems out of many of them. Quantum computers will work only if error correction does.", "Cells die and the body lives. People make mistakes and an institution can still decide well, or badly. How the parts are joined makes the difference."],
    h: ['1 part', 'Copies that vote', '9 parts'], v: ['good parts', 'How often one part is wrong', 'bad parts'],
    true: 'In 1956 John von Neumann showed that parts which sometimes fail can be built into a whole that fails less often than any of them. The voter is a part too.',
    src: [{ t: 'von Neumann, Probabilistic Logics, 1956', u: 'https://static.ias.edu/pitp/archive/2012files/Probabilistic_Logics.pdf', k: 'paper' }],
    open: 'When the parts are AI agents that are each sometimes wrong, does their vote give a whole you can rely on, or do they fail together?',
    eng: 'The vote is <code>blockOk()</code> of <code>src/engines/redundancy.js</code>, voter included (it fails 3 times in a thousand). The same formula runs here. Push the parts past wrong half the time and the vote makes things worse.'
  },
  sutton: {
    cap: "Left: a full adder made the plain way, 13 gates. Right: the best circuit a blind search has found so far. The lamps are its 16 answers; a red one is wrong.",
    stand: "In seventy years of AI, the method that could use more computing ended up ahead of the one built on what experts knew. Chips are what made that true.",
    why: ["Chips are both the cause and the next case. Cheaper computing let search and learning win; now search and learning are starting to place, wire and check the chips themselves.", "The bet behind today’s AI is that scale goes on working. It holds only while computing keeps getting cheaper and more plentiful, which is a question about chips, energy and money.", "If searching beats understanding, what is expertise for? The question reaches science, medicine and design, wherever a result can be checked faster than it can be explained."],
    h: ['1 circuit tried', 'Computing given to the search', '1,000,000 tried'],
    true: 'In 2019 Rich Sutton looked back on seventy years of AI and found one pattern: methods that used more computing kept overtaking methods built on what people knew.',
    src: [{ t: 'Sutton, The Bitter Lesson, 2019', u: 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html', k: 'essay' }],
    open: 'The search never learns why its circuit works. What happens when computing stops getting cheaper?',
    eng: 'A real search runs in your browser: it changes a circuit of NAND gates at random and keeps what scores no worse, four tries a round, as <code>src/engines/search.js</code> does with the evolve engine. Nine gates is the classic best for a full adder. In the lab this card would call that engine and its jobs.'
  },
  moore: {
    cap: "One dot is one microprocessor. Past 2021 there is no data: the dashed line is yours to set.",
    stand: "For fifty years one steady doubling let everyone plan on a better machine arriving on time. That promise is ending, and nothing has yet taken its place.",
    why: ["Moore’s law was never physics. It was a shared plan: toolmakers, factories and designers all aimed at the same next step. The clock stopped speeding up around 2004, and each new generation costs more to design.", "AI’s progress has leaned on more computing every year. The next gains have to come from somewhere: stacked chips, new kinds of switch, special designs, or better ideas for each watt.", "A shared belief that things get better on schedule is rare and powerful. It shaped an industry for fifty years. What happens to plans and ambition when a schedule like that ends?"],
    h: ['1971', 'The year', '2040'], v: ['never doubles', 'Your line past 2021', 'doubles every year'],
    true: 'From 2,300 transistors on a chip in 1971 to tens of billions in 2021: a doubling about every two years. The clock stopped near 3.8 GHz in 2004.',
    src: [{ t: 'Karl Rupp, microprocessor trend data, CC BY 4.0', u: 'https://github.com/karlrupp/microprocessor-trend-data', k: 'reported' }, { t: 'Pentium D', u: 'https://en.wikipedia.org/wiki/Pentium_D', k: 'reported' }],
    open: 'Each law that ended made room for another kind of progress. What is being doubled next, and who decides what counts?',
    eng: 'The dots are the first page’s own series (<code>trend()</code> in <code>src/data/hold.js</code>, Karl Rupp’s data). The line past 2021 is the visitor’s: a guess the lab could keep, as it keeps the guess for 2026 on the first page.'
  },
  line: {
    cap: "A chip of sixty places, and sixty jobs. Squares are the kinds of job it was built for; circles are new kinds. The warm disc under a job is the energy it took. Red: turned away.",
    stand: "What is fixed is fast and cheap. What can change survives the next surprise. Every machine is a decision about how much of each.",
    why: ["A chip built for one job can use far less energy for it than a general one, and is useless when the job changes. Hardware, instruction sets and software are layers of this one choice.", "AI’s methods change in months and a chip takes years. Build for today’s model and it may be out of date on arrival; stay general and pay in energy. A model’s own weights raise the same choice: frozen, or still learning.", "Instinct and learning. Law and judgement. A skeleton and a muscle. Living things and societies settle the same line, and move it when the world changes."],
    h: ['all fluid', 'Where the line falls', 'all fixed'], v: ['as designed', 'How far the work has moved on since the chip was designed', 'mostly new kinds'],
    true: 'For HD video encoding, a general-purpose chip used about 500 times the energy of a chip built only for that job. One study, one job: for other jobs the gap is often smaller.',
    src: [{ t: 'Hameed et al., ISCA 2010, in CACM', u: 'https://cacm.acm.org/research/understanding-sources-of-ineffciency-in-general-purpose-chips', k: 'reported' }],
    open: 'A chip takes years to make and the work changes in months. Could hardware reshape itself as fast as the ideas it runs?',
    eng: '<b>New, small engine needed.</b> Here: the fixed part does a job it was built for at a fiftieth of the energy, each part takes work in proportion to its share of the chip, and the second control is how far the mix of jobs has moved on. Round numbers. The lens’s own plan (FRAME13.md) names <code>machine.js</code>.'
  },
  trust: {
    cap: "The square is every pair of numbers an adder could be given. Lit: what one day of testing covers, at a billion cases a second.",
    stand: "Every day we rely on machines that nobody can fully check. The question is what that reliance stands on.",
    why: ["A modern chip has billions of parts and far more cases than could ever be tried. It is designed with tools, made in factories and sold by companies its user never sees.", "Now AI writes designs and AI checks them, and AI systems are themselves too large to inspect. Trust has to rest on something other than looking inside.", "Almost nobody can inspect a medicine, a bank or an aircraft. Trust rests on proof, tests, open records, reputation, and someone who answers for it. Each of these can fail."],
    h: ['4-bit numbers', 'How wide the numbers are', '64-bit numbers'],
    true: 'A Pentium shipped in 1994 with five entries missing from a table in its divider. It had passed its tests: the fault showed in about 1 of 9 billion random divisions.',
    src: [{ t: 'Pentium FDIV bug', u: 'https://en.wikipedia.org/wiki/Pentium_FDIV_bug', k: 'estimate' }],
    open: 'Proof, open records, spares, reputation: each carries part of the weight. What do they rest on when an AI wrote the design and another AI checked it?',
    eng: 'The arithmetic is exact, from <code>exhaust()</code> in <code>src/engines/floor.js</code>: two numbers of b bits make 2 to the power 2b cases. The lit square is drawn to true scale until it is too small to see.'
  },
  physics: {
    cap: "Ninety sums, each done two ways. A dot is one answer; the line is the right one. Red: a bit flipped.",
    stand: "A digital computer forces matter to behave like exact logic, and pays for it in energy. Matter can also settle a sum by itself, cheaply, and a little differently each time.",
    why: ["Every margin, every refresh and every error check is energy spent holding physics back. As switches shrink toward atoms and voltages fall, holding it back costs more.", "AI’s sums can be a little wrong and still be useful. That reopens old ideas: analog circuits, light, noise used on purpose, memory that computes where it sits.", "Evolution never built exact logic. Brains and cells compute with whatever their chemistry does. Which answers really need to be exact?"],
    h: ['cool', 'Heat, as noise on every signal', 'hot'],
    true: 'Erasing one bit must give off a little heat: about 3 zeptojoules at room temperature, measured in 2012. Today’s logic spends far more than that to keep every bit exact.',
    src: [{ t: 'Bérut et al., Nature, 2012', u: 'https://www.nature.com/articles/nature10872', k: 'reported' }],
    open: 'Which answers need exact logic, and which could a piece of matter settle by itself, a little differently each time?',
    eng: 'Exact logic: each bit of the answer flips when the noise crosses half its swing, so it is right until it is suddenly very wrong. Physics: currents add on one wire and the answer drifts with the noise. Energy per sum, 1 against 0.13, is the round figure of <code>src/engines/mortal.js</code>; the lab’s lens uses <code>paradigms.js</code>.'
  },
  eff: {
    cap: "Each dot is an answer; its size is the energy it takes. The dashed ring is all the energy spent today.",
    stand: "Each answer from a machine takes less energy every year, and the world’s computing uses more energy every year. Both are true at once.",
    why: ["A more efficient chip makes each task cheaper, so people find more tasks. The saving on each task and the growth in tasks pull against each other, and so far the growth has won.", "AI data centres are now planned around the power they can get. Whether better chips shrink that demand or feed it decides energy plans, prices and where things are built.", "Jevons saw it with coal and steam engines in 1865. It comes back with roads, lighting and every tool that makes something cheaper to do."],
    h: ['asks a little more', 'How eagerly the world asks as answers get cheaper', 'asks far more'], v: ['today’s cost', 'What each answer costs', '8× cheaper'],
    true: 'Data centres used about 485 TWh of electricity in 2025, and the IEA projects about 950 TWh by 2030, while each answer keeps getting cheaper.',
    src: [{ t: 'IEA, April 2026, via Enlit', u: 'https://www.enlit.world/library/ai-and-data-centre-electricity-use-continue-to-surge-iea-finds', k: 'projection' }],
    open: 'Nobody knows how eagerly the world will go on asking as answers get cheaper. Jevons’ effect needs it to stay above one for one.',
    eng: 'The lab’s bet, <code>jevons()</code> in <code>src/engines/bet.js</code>: answers asked grow as the price falls, by an elasticity the bet fixes at 1.5. <b>New:</b> the card makes that elasticity the second control, since it is the part nobody knows.'
  },
  nat: {
    cap: "One row of cells, redrawn below itself by one rule, row after row. The eight tiles are the whole rule. Try 30, 90 and 110.",
    stand: "Computing is not a property of silicon. Dominoes, water, DNA and light can all do it. So what, if anything, can it not do?",
    why: ["A chip is one way to make matter compute, chosen because it is small and fast and can be copied. What any computer can and cannot do sets what a better chip could ever buy.", "The claim that a machine can think rests on thinking being a kind of computing. Turing showed in 1936 that some questions no program can answer. Where minds stand between the two is open.", "The question reaches biology and physics: whether a cell, a brain or the universe does anything that a simple rule, followed long enough, could not."],
    h: ['rule 0', 'The rule: eight bits', 'rule 255'],
    true: 'Rule 110 fits in eight bits, and in 2004 it was proved able to compute anything a computer can. So for some of its patterns, the only way to learn what happens is to run it.',
    src: [{ t: 'Cook, Complex Systems 15, 2004', u: 'https://www.complex-systems.com/abstracts/v15_i01_a01/', k: 'paper' }],
    open: 'A seashell, a tube of DNA and a chip can all follow rules like these. Can nature do anything that no such rule can?',
    eng: '<b>New, small engine needed</b> (an elementary cellular automaton: 256 rules, a ring of cells). The lab’s own way into this question is <code>src/engines/halt.js</code>: one gate from dominoes, water or light, then the program nobody can judge. The card links to both.'
  },
  geo: {
    cap: "A flat sheet of parts, cooled from its face, each wired to a few others. Red glow: heat. Blue: a few of the trips a message makes.",
    stand: "To think together, parts must be close. To stay cool, they must be apart. Every thinking machine, built or grown, has to settle that conflict.",
    why: ["Moving a number across a chip costs far more energy than computing with it, so designers pack memory and logic closer and stack them. Packed parts trap heat, and heat sets the limit.", "AI machines are held back less by their switches than by moving data and removing heat: memory stacked beside the processor, racks cooled by liquid, whole buildings laid out around both.", "A brain is a folded sheet with its wiring inside. A city balances the same pull between closeness and crowding. Shape may bound how much any system can think."],
    h: ['packed', 'How far apart the parts sit', 'spread'], v: ['fewer parts', 'How many parts', 'more parts'],
    true: 'Reading 16 bits from memory far from the logic costs 640 pJ. Adding two 16-bit numbers costs 0.18 pJ: about 3,500 times less.',
    src: [{ t: 'Pedram et al., table I (45 nm)', u: 'https://arxiv.org/pdf/1602.04183', k: 'reported' }],
    open: 'Stacking chips upward shortens the trips and traps the heat. Is there a shape that escapes the trade, or does every shape only move it?',
    eng: 'A toy sheet: the average trip grows with spacing and with the square root of the number of parts; the hottest spot grows with that root and falls with spacing. So in this model trip times heat depends only on how many parts there are. In the lab: <code>geometry()</code> and <code>geoEffFront()</code> in <code>src/engines/lens.js</code>.'
  },
  copy: {
    cap: "Left: one mind on its own chip. Squares are numbers kept as bits; discs are kept in the matter itself. Right: the same mind on four other chips. Red: where a copy differs.",
    stand: "A brain is cheap to run and cannot be copied. A digital mind copies perfectly and costs a great deal to run. Nobody knows whether one machine can have both.",
    why: ["Numbers kept as exact bits can be copied anywhere, and every use of them is a costly trip to memory. Numbers kept in the matter of the chip are far cheaper to use, and belong to that one chip.", "Copying is what lets one trained model serve millions of people, and be backed up, checked and improved. A machine built like a brain might have to give that up.", "What one person learns dies with them unless it is taught. A mind that can be copied has no such limit. That changes what learning, and losing, mean."],
    h: ['kept as bits', 'Where the mind is kept', 'kept in the matter'],
    true: 'A brain runs on about 20 watts, and what it has learned is the physical state of its own cells. Geoffrey Hinton calls computing whose knowledge dies with its hardware mortal.',
    src: [{ t: 'The Physics Factbook', u: 'https://hypertextbook.com/facts/2001/JacquelineLing.shtml', k: 'estimate' }],
    open: 'No chip yet learns on a brain’s power. If one did, would each be a one-off, as each of us is?',
    eng: 'Exactly <code>evaluate({ share, learn: "chip", calibrate: false })</code> of <code>src/engines/mortal.js</code>: energy, right answers on this chip, and on a copy. The four copies’ differences are drawn from seeded noise of the engine’s spread.'
  },
  human: {
    cap: "Every shape is a design that passes every check. Its five points lean toward five things no check measures. Tap one to keep it.",
    stand: "When a machine can make a thousand good options in a minute, and anyone can use the machine, making options stops being the scarce thing.",
    why: ["Design tools now generate layouts, circuits and whole blocks. Open tools and shared factory runs let far more people try. What is left is deciding what to build, for whom, and what it must never do.", "This is the question AI puts to every craft. The checks can say that a design passes. They cannot say it is the one worth making.", "Choosing among good options, answering for the choice, and choosing together: these may be what people bring. Or they may be next. Nobody knows yet."],
    h: ['1 design', 'Designs the machine makes', '1,000 designs'],
    true: 'In July 2026 the three largest makers of chip-design tools each announced AI agents that carry out design work by themselves over long runs.',
    src: [{ t: 'Futurum, on DAC 2026', u: 'https://futurumgroup.com/insights/synopsys-cadence-and-siemens-take-agentic-chip-design-autonomous-at-dac/', k: 'reported' }],
    open: 'When a thousand designs all pass, the checks have nothing more to say. What do you choose by, and would many people choose better than one?',
    eng: 'A stand-in for the lab’s <code>src/engines/thousand.js</code>, which makes a real thousand from the AI chip model and keeps a choice in the ledger with its reason. Here the designs and their leanings are seeded numbers; the five sides are that engine’s people: who uses it, who repairs it, who pays, the planet, and what it must never do.'
  }
};
