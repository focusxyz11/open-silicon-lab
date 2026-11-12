/* New ways to compute, from the earlier site's gallery, each placed where the problem it attacks is met:
   light between racks, memory beside the logic at the block, the energy floor at the gate. Data only;
   words: way.<id>.t / .how / .catch / .now, and way.stages (how far it has come), way.saves.<k>.
   stage: 0 an idea, 1 lab demos, 2 prototype chips, 3 early products, 4 mainstream. Stages are an
   editorial judgment from the earlier site's sources, made to compare the ways with one another. */
export const WAYS = [
  { id: 'super', stage: 1, saves: 'energy', at: ['building'] },
  { id: 'photonic', stage: 3, saves: 'data', at: ['rack'] },
  { id: 'spatial', stage: 4, saves: 'data', at: ['board'] },
  { id: 'approx', stage: 4, saves: 'energy', at: ['chip'] },
  { id: 'neuro', stage: 3, saves: 'energy', at: ['phone', 'soc'] },
  { id: 'analog', stage: 3, saves: 'speed', at: ['mcu'] },
  { id: 'cim', stage: 3, saves: 'data', at: ['block'] },
  { id: 'reversible', stage: 1, saves: 'energy', at: ['gate'] },
  { id: 'pbits', stage: 2, saves: 'problems', at: ['switch'] },
  { id: 'quantum', stage: 2, saves: 'problems', at: ['atom'] }
];
export const SAVES = ['energy', 'data', 'speed', 'problems'];
export const wayAt = id => WAYS.find(w => w.at.includes(id)) || null;
export const wayOf = id => WAYS.find(w => w.id === id) || null;
