import fs from 'node:fs';
/* Read each question's footprint, meetings, field questions and counts out of the lab's own data (src/data/frame.js,
   places.js, questions.js, the words) into src/data.json. Run from the repository's root:
   node docs/prototypes/cards/extract.mjs */
const R = new URL('../../../', import.meta.url).pathname;
const { QUESTIONS, FILED, MARKS, MEETS, RISES } = await import(R + 'src/data/frame.js');
const { INSIDE, ABOVE } = await import(R + 'src/data/places.js');
const { stageOfPlace, STAGES } = await import(R + 'src/engines/way.js');
const { FIELD } = await import(R + 'src/data/questions.js');
const W = {};
for (const f of fs.readdirSync(R + 'src/i18n/en')) Object.assign(W, JSON.parse(fs.readFileSync(R + 'src/i18n/en/' + f, 'utf8')));
const t = k => W[k];
const places = ['studio', 'quarry', 'fab', 'test', 'port', 'datacentre', 'phones', 'cars'];
const missing = new Set();
const nm = (k, fb) => { const v = t(k); if (!v) missing.add(k); return v || fb; };
const out = QUESTIONS.map(q => {
  const foot = places.map(p => ({
    p, name: nm('map.' + p + '.t', p[0].toUpperCase() + p.slice(1)), stage: stageOfPlace(p),
    levels: (ABOVE[p] || []).concat(INSIDE[p]).map(l => ({ d: l.depth, n: nm('depth.' + l.depth + '.name', l.depth), on: !!(MARKS[l.depth] && MARKS[l.depth][q.id]) }))
  }));
  const meets = MEETS.filter(m => m.a === q.id || m.b === q.id).map(m => { const o = m.a === q.id ? m.b : m.a; return { id: o, shape: m.shape, join: t('frame.meet.' + m.a + '.' + m.b), q: t('frame.meet.' + m.a + '.' + m.b + '.q') }; });
  const field = Object.entries(FILED.field).filter(([k, v]) => v[0] === q.id).map(([k]) => { const F = FIELD.find(f => f.id === k); return { id: k, q: t('field.' + k + '.q'), who: t('field.' + k + '.who'), at: F && (F.home.level || F.home.place), shape: F && F.shape }; });
  const cnt = (o, home) => Object.values(o).filter(v => home ? v[0] === q.id : v.includes(q.id)).length;
  return { id: q.id, q: t(q.word), name: t('frame.q.' + q.id), hint: t('frame.q.' + q.id + '.hint'), icon: q.icon, foot, meets, field,
    n: { field: cnt(FILED.field), stops: cnt(FILED.stops), exp: cnt(FILED.experiments), ch: cnt(FILED.challenges), chHome: cnt(FILED.challenges, true), levels: foot.reduce((s, p) => s + p.levels.filter(l => l.on).length, 0) },
    rises: [...new Set(RISES.filter(r => r.q === q.id).map(r => r.rung))] };
});
fs.writeFileSync(new URL('./src/data.json', import.meta.url), JSON.stringify({ stages: STAGES, questions: out }));
console.log('missing words:', [...missing].join(' '));
for (const q of out) console.log(q.id.padEnd(8), JSON.stringify(q.n), 'meets', q.meets.length, 'field', q.field.map(f => f.id + '@' + f.at).join(','), 'rises', q.rises.join(','));
console.log(JSON.stringify(out[0].foot.map(p => [p.p, p.name, p.stage, p.levels.map(l => l.n + (l.on ? '*' : ''))])));
console.log(out[0].field[0]);

