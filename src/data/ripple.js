/* What if? The map as a simulator: a small causal model of the chip industry.
   Five levers feed indicators that live on map topics; rules say how a change in one
   indicator moves another. Directions follow the economics and the 2021–2026 events in
   src/data/facts.json; the strengths are illustrative round numbers, chosen so the sizes
   are sensible next to one another. They are not a forecast. */

/* Levers: what you can change. `ind` is the indicator the lever sets. */
export const LEVERS = [
  { id: 'demand', ind: 'aidemand', t: 'AI demand', d: 'How much AI computing the world wants to buy', min: -50, max: 150, step: 10, unit: '%', facts: ['hyperscaler-capex', 'nvidia-q2fy27'] },
  { id: 'hbm', ind: 'hbm', t: 'HBM supply', d: 'The stacked memory every big AI chip needs', min: -60, max: 40, step: 10, unit: '%', facts: ['memory-squeeze', 'hbm4', 'skhynix-margin'] },
  { id: 'elec', ind: 'elec', t: 'Electricity price', d: 'What data centers pay for power', min: -50, max: 200, step: 10, unit: '%', facts: ['ai-dc-tco', 'dc-electricity'] },
  { id: 'node', ind: 'delay', t: 'Next node delay', d: 'The leading foundry\'s next process arrives late', min: 0, max: 4, step: 0.5, unit: 'yr', facts: ['intel-10nm', 'tsmc-n2'] },
  { id: 'mature', ind: 'mature', t: 'Mature-chip supply', d: 'Ordinary chips on older processes: car, appliance and power chips', min: -40, max: 20, step: 5, unit: '%', facts: ['car-shortage-2021', 'legacy-auto'] }
];

/* Indicators: id, topic it lives on, what it measures, unit. Lever indicators come first. */
export const INDICATORS = [
  { id: 'aidemand', topic: 'compute', t: 'AI computing wanted', unit: '%' },
  { id: 'hbm', topic: 'package', t: 'HBM made', unit: '%' },
  { id: 'elec', topic: 'datacenter', t: 'Electricity price', unit: '%' },
  { id: 'delay', topic: 'future', t: 'Next node, years late', unit: 'yr' },
  { id: 'mature', topic: 'supply', t: 'Mature chips made', unit: '%' },

  { id: 'memtight', topic: 'package', t: 'HBM and packaging shortage', unit: '%' },
  { id: 'memprice', topic: 'datacenter', t: 'Memory prices (DRAM and HBM)', unit: '%' },
  { id: 'aiship', topic: 'accelerators', t: 'AI chips shipped', unit: '%' },
  { id: 'gpuprice', topic: 'economics', t: 'AI chip prices', unit: '%' },
  { id: 'memprofit', topic: 'economics', t: 'Memory makers\' profits', unit: '%' },
  { id: 'perfw', topic: 'transistor', t: 'Performance per watt of the newest chips', unit: '%' },
  { id: 'energytoken', topic: 'compute', t: 'Energy for each AI answer', unit: '%' },
  { id: 'costtoken', topic: 'compute', t: 'Cost of each AI answer', unit: '%' },
  { id: 'aicompute', topic: 'accelerators', t: 'AI computing power added', unit: '%' },
  { id: 'dcpower', topic: 'datacenter', t: 'Data-center electricity use', unit: '%' },
  { id: 'grid', topic: 'scenarios', t: 'Strain on power grids', unit: '%' },
  { id: 'devprice', topic: 'everywhere', t: 'Phone and PC prices', unit: '%' },
  { id: 'cars', topic: 'everywhere', t: 'Cars built', unit: '%' },
  { id: 'archgain', topic: 'architecture', t: 'Gains that must come from design, not the node', unit: '%' },
  { id: 'designcost', topic: 'design', t: 'Cost to design a leading chip', unit: '%' },
  { id: 'rivals', topic: 'ecosystem', t: 'Opening for rival chipmakers', unit: '%' },
  { id: 'custom', topic: 'build', t: 'Pull toward custom AI chips', unit: '%' },
  { id: 'fabinvest', topic: 'fab', t: 'New fab building', unit: '%' },
  { id: 'tools', topic: 'litho', t: 'Orders for lithography tools', unit: '%' },
  { id: 'engineers', topic: 'innovation', t: 'Engineers and technicians needed', unit: '%' },
  { id: 'newarch', topic: 'beyond', t: 'Push for new ways to compute', unit: '%' },
  { id: 'spatial', topic: 'spatial', t: 'Interest in SRAM dataflow chips', unit: '%' },
  { id: 'cim', topic: 'cim', t: 'Interest in compute in memory', unit: '%' },
  { id: 'photonic', topic: 'photonic', t: 'Interest in optics', unit: '%' },
  { id: 'neuro', topic: 'neuro', t: 'Interest in spiking chips', unit: '%' },
  { id: 'pbits', topic: 'pbits', t: 'Interest in probabilistic chips', unit: '%' },
  { id: 'reversible', topic: 'reversible', t: 'Interest in reversible logic', unit: '%' }
];

/* Rules: [from, to, strength, short label for the wire, why].
   A strength of 0.5 means "a 10% change in `from` moves `to` by 5%". From the node delay
   (in years) the strength is per year. `min` indicators take the smallest of their inputs. */
export const MIN = { aiship: true };
export const RULES = [
  ['aidemand', 'memtight', 1, 'AI demand is HBM demand', 'Almost all HBM goes into AI chips, so more AI demand means more HBM wanted.'],
  ['hbm', 'memtight', -1, 'less HBM, bigger gap', 'Less HBM made with the same demand leaves a bigger gap.'],
  ['delay', 'memtight', 4, 'late nodes need big packages', 'When the next node is late, designers add chiplets and bigger packages instead, which need more CoWoS packaging and HBM.'],
  ['memtight', 'memprice', 0.8, 'wafers move to HBM', 'Memory makers move wafers to HBM, which takes about three times the wafer area of ordinary DRAM per bit, so all memory gets scarce. In late 2025 and early 2026 DRAM contract prices rose by about half each quarter.'],
  ['memprice', 'memprofit', 1.5, 'prices rise faster than costs', 'When prices rise and costs do not, profits rise faster than prices. SK hynix reported a 76% operating margin in mid-2026.'],
  ['memprice', 'devprice', 0.06, 'memory is part of every device', 'Memory is a slice of what a phone or PC costs to build. In 2026 analysts expected PC prices to rise about 6–8% after DRAM prices more than doubled.'],
  ['mature', 'devprice', -0.2, 'scarce parts, pricier products', 'A product missing one cheap chip cannot ship, so the few that do ship cost more.'],
  ['mature', 'cars', 0.6, 'one missing chip stops a car', 'A car needs hundreds of chips, most on mature processes. In 2021 the shortage cost carmakers about 7.7 million vehicles.'],
  ['aidemand', 'aiship', 1, 'chips are built to demand', 'Chipmakers build to what customers order.'],
  ['hbm', 'aiship', 1, 'no HBM, no AI chip', 'Each AI chip needs its HBM stacks. Shipments follow whichever is scarcer: orders or memory.'],
  ['memtight', 'gpuprice', 0.4, 'buyers outnumber chips', 'When buyers want more chips than can be built, prices rise.'],
  ['memprice', 'gpuprice', 0.15, 'HBM is a big part of the bill', 'HBM is one of the largest costs in making an AI chip.'],
  ['delay', 'perfw', -12, 'efficiency gain arrives late', 'A new node gives about 25–30% lower power at the same speed and comes every two to three years, so each year of delay forgoes roughly 12%.'],
  ['perfw', 'energytoken', -1, 'less efficient chips', 'Chips that do less per watt use more energy for each answer.'],
  ['perfw', 'archgain', -1, 'design must make up the gap', 'If the node gives less, the gain has to come from architecture: chiplets, specialized units, smarter dataflow.'],
  ['aiship', 'aicompute', 1, 'more chips, more computing', 'Computing power added grows with the chips installed.'],
  ['perfw', 'aicompute', 1, 'less work per chip', 'Data centers are limited by power, so less efficient chips do less work in the same power.'],
  ['aiship', 'dcpower', 0.5, 'more chips draw more power', 'More AI chips running means more electricity used.'],
  ['energytoken', 'dcpower', 0.5, 'more energy per answer', 'Each answer takes more energy.'],
  ['dcpower', 'grid', 1, 'more load on the grid', 'Data centers already draw a growing share of electricity; more demand strains grids and new connections.'],
  ['elec', 'costtoken', 0.07, 'power is about 7% of the cost', 'In an AI data center, electricity is only about 7% of the yearly cost; the chips and servers are about 60%.'],
  ['energytoken', 'costtoken', 0.07, 'more energy, same price', 'More energy per answer, at the same electricity price.'],
  ['gpuprice', 'costtoken', 0.6, 'chips are about 60% of the cost', 'Chips and servers are about 60% of what an AI data center costs each year, so their price matters most.'],
  ['gpuprice', 'custom', 0.5, 'buyers design their own', 'Expensive GPUs push big buyers to design their own chips, like Google\'s TPU, AWS Trainium and Microsoft Maia.'],
  ['delay', 'designcost', 5, 'plans are redone', 'Chips planned for the new node must be moved to an older one or wait, and both cost engineering time.'],
  ['delay', 'rivals', 15, 'rivals can overtake', 'When Intel\'s 10 nm slipped from 2016 to 2019, AMD (making chips at TSMC) and Apple (with its own chips) moved ahead.'],
  ['mature', 'fabinvest', -0.5, 'shortage pays for new fabs', 'After the 2021 shortage, chipmakers built a wave of new capacity for mature chips.'],
  ['aidemand', 'fabinvest', 0.2, 'AI funds leading-edge fabs', 'AI demand pays for new leading-edge fabs.'],
  ['memprice', 'fabinvest', 0.2, 'memory profits fund fabs', 'High memory prices pay for new memory fabs.'],
  ['fabinvest', 'tools', 0.8, 'new fabs order tools first', 'Lithography and other tools are ordered years before a fab starts.'],
  ['fabinvest', 'engineers', 0.6, 'every fab needs people', 'Each new fab needs hundreds of engineers and technicians.'],
  ['energytoken', 'newarch', 1, 'energy is the limit', 'When each answer costs more energy, designs that save energy are worth more.'],
  ['elec', 'newarch', 0.15, 'pricey power rewards efficiency', 'Expensive power rewards efficient designs.'],
  ['memtight', 'newarch', 0.3, 'scarce memory rewards new designs', 'Scarce memory rewards designs that need less of it.'],
  ['memtight', 'spatial', 0.4, 'SRAM chips need no HBM', 'Chips like Cerebras\' wafer and Groq\'s LPU keep the model in on-chip SRAM and need no HBM.'],
  ['newarch', 'spatial', 0.3, 'data stays on chip', 'Dataflow chips move less data, which saves energy.'],
  ['newarch', 'cim', 0.6, 'compute where data lives', 'Computing inside memory avoids the energy of moving data.'],
  ['newarch', 'photonic', 0.4, 'light moves data cheaply', 'Light carries data with less energy than copper.'],
  ['dcpower', 'photonic', 0.2, 'optics cut network power', 'Co-packaged optics cut the power of data-center networks.'],
  ['newarch', 'neuro', 0.3, 'spend energy only on events', 'Spiking chips use energy only when something happens.'],
  ['newarch', 'pbits', 0.2, 'noise does the work', 'Probabilistic chips could sample and optimize with far less energy.'],
  ['newarch', 'reversible', 0.2, 'toward the energy floor', 'Reversible logic is the long-term route to recycling switching energy.']
];

/* Ready-made scenarios, three of them modeled on things that happened. */
export const PRESETS = [
  { id: 'squeeze', t: 'The 2026 memory squeeze', d: 'AI demand surges and memory makers cannot keep up.', set: { demand: 60, hbm: -10 } },
  { id: 'cars', t: 'The 2021 car-chip shortage', d: 'Ordinary chips run short after demand swings in the pandemic.', set: { mature: -15 } },
  { id: 'intel', t: 'A 10 nm-style delay', d: 'The next node arrives three years late, as Intel\'s 10 nm did.', set: { node: 3 } },
  { id: 'power', t: 'Power gets expensive', d: 'Electricity prices double where data centers are built.', set: { elec: 100 } }
];

/* Small puzzles; `ok` gets the lever settings and the model's results. */
export const PUZZLES = [
  { id: 'phones', t: 'Make phones and PCs more expensive by moving only AI demand.', ok: (L, v) => onlyMoved(L, 'demand') && v.devprice >= 2, done: 'AI demand reaches your phone through memory: makers move wafers to HBM, all DRAM gets scarce, and every device with memory costs more.' },
  { id: 'power', t: 'Double the electricity price. Does the cost of an AI answer double?', ok: L => L.elec >= 100, done: 'Not even close: about 7%. Power is a small part of an AI data center\'s cost; the chips are most of it. Power limits AI more by being unavailable than by being expensive.' },
  { id: 'answer', t: 'Make each AI answer cost at least 10% more without touching the electricity price.', ok: (L, v) => !L.elec && v.costtoken >= 10, done: 'Chip prices dominate the cost of AI. Scarce memory or packaging raises them fastest.' },
  { id: 'split', t: 'Find a lever that stops car factories but barely touches AI computing.', ok: (L, v) => onlyMoved(L, 'mature') && v.cars <= -5 && Math.abs(v.aicompute) < 1, done: 'Cars, appliances and power supplies run on mature chips made in different fabs from AI chips. The chip world is many markets, not one.' }
];
function onlyMoved(L, id) { return Object.keys(L).every(k => (k === id ? L[k] !== 0 : !L[k])); }
