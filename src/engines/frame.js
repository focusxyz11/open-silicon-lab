/* The thirteen as lenses (src/data/frame.js): which questions live at a level, and what each one's lens holds there.
   A question lives at a level through what is filed under it: the questions from the field whose home is that level
   (they lead: the home one weighs 3, a join 1), the earlier threads' stops at that level (home 2, join 1), the
   experiments that run through it, and the challenges played there. Its lens shows the question alone, its form here
   (the field questions first, then the stops), the challenges to play here, the question it meets here (the one it
   shares most with, by a named seam) and the nearest other level, in the view's own order, where it lives too.

   createLenses({ experiments, stops, challenges, doHome }) → { lensesAt(depth), lensAt(q, depth, levels), questionsOfStop(key) }
   Pure: the shell passes the lab's data in, so the tests can build it the same way; the field questions are plain
   data (src/data/questions.js). */
import { QUESTIONS, FILED, MEETS } from '../data/frame.js';
import { FIELD } from '../data/questions.js';

export const IDS = QUESTIONS.map(q => q.id);
export const questionOf = id => QUESTIONS.find(q => q.id === id) || null;
/* where two questions meet (MEETS): its key 'a.b' (in order), or null; and the pair itself, with its shape */
export const meetOf = (a, b) => { const [x, y] = [a, b].sort(); return MEETS.some(m => m.a === x && m.b === y) ? x + '.' + y : null; };
export const pairOf = (a, b) => { const [x, y] = [a, b].sort(); return MEETS.find(m => m.a === x && m.b === y) || null; };
/* the most a level offers, so a lens bar stays a handful */
export const MAX_AT = 6;

/* the level a challenge is played at, from the view its home is (#/dive/chip, #/line/print, #/bench/check, #/dive/wafer/made) */
const depthOfHref = h => { const p = (h || '').split('/'); return ['dive', 'line', 'bench'].includes(p[1]) ? p[2] || null : null; };

export function createLenses({ experiments, stops, challenges, doHome }) {
  const filedX = FILED.experiments, filedC = FILED.challenges, filedS = FILED.stops, filedF = FILED.field;
  /* each stop: the questions it is filed under, by weight (its home counts twice its joins) */
  const byStop = {};
  for (const key of Object.keys(stops)) (filedS[key] || []).forEach((q, i) => { (byStop[key] = byStop[key] || {})[q] = i ? 1 : 2; });
  /* each field question with its home at a level: the questions it is filed under, by weight (its home 3, a join 1) */
  const byField = {};
  for (const f of FIELD) if (f.home.level && filedF[f.id]) byField[f.id] = Object.fromEntries(filedF[f.id].map((q, i) => [q, i ? 1 : 3]));
  const fieldAtDepth = d => FIELD.filter(f => f.home.level === d && byField[f.id]).map(f => f.id);
  /* each challenge: the level it is played at */
  const chDepth = {};
  for (const c of challenges) { const d = depthOfHref(doHome(c)); if (d) chDepth[c.id] = d; }
  const stopsAtDepth = d => Object.keys(stops).filter(k => k.split('.')[1] === d);
  const chsAt = d => Object.keys(chDepth).filter(id => chDepth[id] === d && filedC[id]);
  const questionsOfStop = key => Object.entries(byStop[key] || {}).sort((a, b) => b[1] - a[1]).map(([q]) => q);

  /* the weight of every question at a level */
  function weights(d) {
    const w = {};
    for (const id of fieldAtDepth(d)) for (const [q, n] of Object.entries(byField[id])) w[q] = (w[q] || 0) + n;
    for (const k of stopsAtDepth(d)) for (const [q, n] of Object.entries(byStop[k] || {})) w[q] = (w[q] || 0) + n;
    for (const id of chsAt(d)) filedC[id].forEach((q, i) => { w[q] = (w[q] || 0) + (i ? 1 : 2); });
    /* an experiment that runs through several levels (at) gives its home question a little weight at each */
    for (const x of experiments) if ((x.at || []).includes(d) && filedX[x.id]) { const q = filedX[x.id][0]; w[q] = (w[q] || 0) + 1; }
    return w;
  }
  /* the questions that live at a level, the most at home first, at most MAX_AT; a question that is home to a field
     question here always lives here (the field questions lead) */
  function lensesAt(d) {
    const w = weights(d), lead = new Set(fieldAtDepth(d).map(id => filedF[id][0]));
    const byWeight = IDS.filter(q => w[q]).sort((a, b) => w[b] - w[a] || IDS.indexOf(a) - IDS.indexOf(b));
    const keep = new Set([...byWeight.filter(q => lead.has(q)), ...byWeight.filter(q => !lead.has(q))].slice(0, MAX_AT));
    return byWeight.filter(q => keep.has(q));
  }
  /* what one question's lens holds at a level; levels: the view's levels in order, for the way on */
  function lensAt(q, d, levels) {
    /* the field questions filed under it with their home here: its home ones first */
    const field = fieldAtDepth(d).filter(id => byField[id][q]).sort((a, b) => byField[b][q] - byField[a][q]);
    const st = stopsAtDepth(d).filter(k => byStop[k] && byStop[k][q]).sort((a, b) => byStop[b][q] - byStop[a][q]);
    const xs = experiments.filter(x => (filedX[x.id] || []).includes(q) && ((x.stops || []).some(s => s.split('.')[1] === d) || (x.at || []).includes(d))).map(x => x.id);
    const chs = [...new Set(chsAt(d).filter(id => filedC[id].includes(q)).concat(experiments.filter(x => xs.includes(x.id)).flatMap(x => x.ch || []).filter(id => chDepth[id] === d)))];
    /* the question it meets here: the one sharing most of this lens's content, joined by a named seam where there is one */
    const share = {};
    const meet = list => list.filter(o => o !== q).forEach(o => { share[o] = (share[o] || 0) + 1; });
    field.forEach(id => meet(filedF[id]));
    st.forEach(k => meet(questionsOfStop(k)));
    xs.forEach(id => meet(filedX[id]));
    chs.forEach(id => meet(filedC[id] || []));
    const meets = Object.keys(share).sort((a, b) => (meetOf(q, b) ? 1 : 0) - (meetOf(q, a) ? 1 : 0) || share[b] - share[a])[0] || null;
    /* the way on: the nearest level after this one in the view's order where the question lives, else before it */
    let next = null;
    if (levels && levels.includes(d)) {
      const i = levels.indexOf(d), lives = l => lensesAt(l).includes(q);
      next = levels.slice(i + 1).find(lives) || levels.slice(0, i).reverse().find(lives) || null;
    }
    return { q, field, stops: st, experiments: xs, challenges: chs, meets, meet: meets ? meetOf(q, meets) : null, next };
  }
  return { lensesAt, lensAt, questionsOfStop };
}
