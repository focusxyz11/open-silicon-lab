/* The thirteen as lenses (src/data/frame.js): which questions live at a level, and what each one's lens holds there.
   A question lives at a level through what is filed under it: the earlier threads' stops at that level (their
   question and what is true there), the experiments that name those stops, and the challenges played there. Its
   lens shows the question alone, its form here, the challenges to play here, the question it meets here (the one it
   shares most with, by a named seam) and the nearest other level, in the view's own order, where it lives too.

   createLenses({ experiments, stops, challenges, doHome }) → { lensesAt(depth), lensAt(q, depth, levels), questionsOfStop(key) }
   Pure: the shell passes the lab's data in, so the tests can build it the same way. */
import { QUESTIONS, FILED, THREAD_HOME, SEAMS } from '../data/frame.js';

export const IDS = QUESTIONS.map(q => q.id);
export const questionOf = id => QUESTIONS.find(q => q.id === id) || null;
export const seamOf = (a, b) => { const [x, y] = [a, b].sort(); return SEAMS.some(s => s[0] === x && s[1] === y) ? x + '.' + y : null; };
/* the most a level offers, so a lens bar stays a handful */
export const MAX_AT = 6;

/* the level a challenge is played at, from the view its home is (#/dive/chip, #/line/print, #/bench/check, #/dive/wafer/made) */
const depthOfHref = h => { const p = (h || '').split('/'); return ['dive', 'line', 'bench'].includes(p[1]) ? p[2] || null : null; };

export function createLenses({ experiments, stops, challenges, doHome }) {
  const filedX = FILED.experiments, filedC = FILED.challenges;
  /* each stop: the questions it belongs to, by weight (an experiment's home counts twice its joins) */
  const byStop = {};
  const add = (key, q, w) => { (byStop[key] = byStop[key] || {})[q] = (byStop[key][q] || 0) + w; };
  for (const x of experiments) for (const s of x.stops || []) (filedX[x.id] || []).forEach((q, i) => add(s, q, i ? 1 : 2));
  for (const key of Object.keys(stops)) if (!byStop[key]) { const q = THREAD_HOME[key.split('.')[0]]; if (q) add(key, q, 1); }
  /* each challenge: the level it is played at */
  const chDepth = {};
  for (const c of challenges) { const d = depthOfHref(doHome(c)); if (d) chDepth[c.id] = d; }
  const stopsAtDepth = d => Object.keys(stops).filter(k => k.split('.')[1] === d);
  const chsAt = d => Object.keys(chDepth).filter(id => chDepth[id] === d && filedC[id]);
  const questionsOfStop = key => Object.entries(byStop[key] || {}).sort((a, b) => b[1] - a[1]).map(([q]) => q);

  /* the weight of every question at a level */
  function weights(d) {
    const w = {};
    for (const k of stopsAtDepth(d)) for (const [q, n] of Object.entries(byStop[k] || {})) w[q] = (w[q] || 0) + n;
    for (const id of chsAt(d)) filedC[id].forEach((q, i) => { w[q] = (w[q] || 0) + (i ? 1 : 2); });
    /* an experiment that runs through several levels (at) gives its home question a little weight at each */
    for (const x of experiments) if ((x.at || []).includes(d) && filedX[x.id]) { const q = filedX[x.id][0]; w[q] = (w[q] || 0) + 1; }
    return w;
  }
  /* the questions that live at a level, the most at home first, at most MAX_AT */
  function lensesAt(d) {
    const w = weights(d);
    return IDS.filter(q => w[q]).sort((a, b) => w[b] - w[a] || IDS.indexOf(a) - IDS.indexOf(b)).slice(0, MAX_AT);
  }
  /* what one question's lens holds at a level; levels: the view's levels in order, for the way on */
  function lensAt(q, d, levels) {
    const st = stopsAtDepth(d).filter(k => byStop[k] && byStop[k][q]).sort((a, b) => byStop[b][q] - byStop[a][q]);
    const xs = experiments.filter(x => (filedX[x.id] || []).includes(q) && ((x.stops || []).some(s => s.split('.')[1] === d) || (x.at || []).includes(d))).map(x => x.id);
    const chs = [...new Set(chsAt(d).filter(id => filedC[id].includes(q)).concat(experiments.filter(x => xs.includes(x.id)).flatMap(x => x.ch || []).filter(id => chDepth[id] === d)))];
    /* the question it meets here: the one sharing most of this lens's content, joined by a named seam where there is one */
    const share = {};
    const meet = list => list.filter(o => o !== q).forEach(o => { share[o] = (share[o] || 0) + 1; });
    st.forEach(k => meet(questionsOfStop(k)));
    xs.forEach(id => meet(filedX[id]));
    chs.forEach(id => meet(filedC[id] || []));
    const meets = Object.keys(share).sort((a, b) => (seamOf(q, b) ? 1 : 0) - (seamOf(q, a) ? 1 : 0) || share[b] - share[a])[0] || null;
    /* the way on: the nearest level after this one in the view's order where the question lives, else before it */
    let next = null;
    if (levels && levels.includes(d)) {
      const i = levels.indexOf(d), lives = l => lensesAt(l).includes(q);
      next = levels.slice(i + 1).find(lives) || levels.slice(0, i).reverse().find(lives) || null;
    }
    return { q, stops: st, experiments: xs, challenges: chs, meets, seam: meets ? seamOf(q, meets) : null, next };
  }
  return { lensesAt, lensAt, questionsOfStop };
}
