/* The thirteen as lenses (src/data/frame.js): which questions live at a level, and what each one's lens holds there.
   A question lives at a level through what is filed under it: the questions from the field whose home is that level
   (they lead: the home one weighs 3, a join 1), the earlier threads' stops at that level (home 2, join 1), the
   experiments that run through it, and the challenges played there. Its lens shows the question alone, its form here
   (the field questions first, then the stops), the challenges to play here, the question it meets here (the one it
   shares most with, by a named seam) and the nearest other level, in the view's own order, where it lives too.

   createLenses({ experiments, stops, challenges, doHome }) → { lensesAt(depth), lensAt(q, depth, levels), questionsOfStop(key) }
   Pure: the shell passes the lab's data in, so the tests can build it the same way; the field questions are plain
   data (src/data/questions.js). */
import { QUESTIONS, FILED, MEETS, RUNG_LENS, RISES } from '../data/frame.js';
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

/* Your stack (docs/PATH.md, "The thirteen questions in the stack"): the questions that live at each rung, weighed by
   what you built there (RUNG_LENS and RISES in src/data/frame.js).
   whenOf(c, R, X0): does a carry condition hold on a carry R (src/engines/path.js carry()), X0 today's carry.
   stackLenses(lensesAt, R, X0) -> { rung: [{ id, rung, w, say, level }] }: at every rung, every question that lives
   there (lensesAt over its levels; a little weight for how much at home it is: 1 for the first, 0.1 less for each
   after), raised by the strongest carry condition that holds (say: the words it says there, else null), strongest
   first; level is the level of the lab it lives at, for its lens. On a wrecked stack the rungs above the one over the
   wreck carry none.
   stackMarks(byRung, n, rungs) -> the n strongest across the rungs (all of them, or the ones named), each question once:
   the marks on the stack. Pure, like createLenses. */
const pick = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
export function whenOf(c, R, X0) {
  if (!c) return false;
  if (c.all) return c.all.every(x => whenOf(x, R, X0));
  if (c.any) return c.any.some(x => whenOf(x, R, X0));
  if (c.broken) return !!R.broken;
  const cmp = v => v != null && ('is' in c ? v === c.is : 'not' in c ? v !== c.not : 'max' in c ? v <= c.max : 'over' in c ? v > c.over : 'under' in c ? v < c.under : false);
  if (c.gene) return cmp(R.recipe[c.gene]);
  if (c.fine) return cmp(R.fine[c.fine]);
  if (c.hand) { const [r, f] = c.hand.split('.'), v = pick(R, 'rungs.' + r + '.hands.' + f);
    if ('below' in c) { const t0 = pick(X0, 'rungs.' + r + '.hands.' + f); return v != null && t0 != null && v < t0 * c.below; }
    return cmp(v); }
  if (c.more) { const [r, ...p] = c.more.split('.'); return cmp(pick(R, ['rungs', r, 'more'].concat(p).join('.'))); }
  if (c.passed) return cmp(!!pick(R, 'rungs.' + c.passed + '.passed'));
  if (c.margin != null) { const s = pick(R, 'rungs.switch.hands'); return !!s && R.fine.V < s.vmin + c.margin; }
  return false;
}
const RUNG_IDS = Object.keys(RUNG_LENS);
const byWeight = (a, b) => b.w - a.w || RUNG_IDS.indexOf(a.rung) - RUNG_IDS.indexOf(b.rung) || IDS.indexOf(a.id) - IDS.indexOf(b.id);
export function stackLenses(lensesAt, R, X0) {
  /* a wrecked stack: nothing above the rung over the wreck is built, so no question lives there */
  const at = {}, top = R.broken ? RUNG_IDS.indexOf(R.broken) + 1 : RUNG_IDS.length;
  for (const rung of RUNG_IDS) { const here = at[rung] = {}; if (RUNG_IDS.indexOf(rung) > top) continue;
    RUNG_LENS[rung].forEach(lv => lensesAt(lv).forEach((q, k) => { const w = 1 - 0.1 * k; if (!here[q] || here[q].base < w) here[q] = { id: q, rung, w, base: w, say: null, level: lv }; })); }
  for (const x of RISES) {
    /* a question that does not live at a rung never rises there (a test keeps the table so) */
    const m = at[x.rung] && at[x.rung][x.q]; if (!m) continue;
    /* a wrecked stack: only the matter and the wreck speak */
    if (R.broken && x.rung !== 'atom' && !(x.when && x.when.broken)) continue;
    if (!whenOf(x.when, R, X0)) continue;
    const v = x.up ? pick(R, 'rungs.' + x.up.hand.replace('.', '.hands.')) : null, up = v == null ? 0 : x.up.log ? x.up.log * Math.log10(v + 1e-30) : x.up.x * v, w = m.base + x.w + up;
    if (!m.say || w > m.w) Object.assign(m, { w, say: x.say });
  }
  return Object.fromEntries(RUNG_IDS.map(r => [r, Object.values(at[r]).sort(byWeight)]));
}
export function stackMarks(byRung, n = 3, rungs) {
  const all = (rungs || RUNG_IDS).flatMap(r => byRung[r] || []).sort(byWeight), seen = new Set(), out = [];
  for (const m of all) { if (seen.has(m.id)) continue; seen.add(m.id); out.push(m); if (out.length === n) break; }
  return out;
}
