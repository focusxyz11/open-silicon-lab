/* What happens to a chip's trip when places stop. Pure logic, no DOM; tests in tests/weave.test.mjs.

   A step stops when every place it is done in has stopped and it is done nowhere else (more), or when
   something it cannot work without (a need marked sole) has no place left to come from. It is strained
   when only some of its places, or some of what it needs, are gone: it can go on, slower and dearer.
   A step waits when a step before it has stopped: nothing arrives. Strain passes down the same way.

   What is simplified: real chains have stocks that last weeks, other sources that can be qualified in
   months or years, and prices that move; here every stop is total and immediate. */

/* closed: a set (or list) of site ids. Returns one entry per step: { state: 'ok' | 'strained' | 'stopped' |
   'waits', why: [site ids that caused it] } */
export function status(route, closed) {
  const off = closed instanceof Set ? closed : new Set(closed || []);
  let up = 'ok';
  return route.map(step => {
    const why = [];
    let own = 'ok';
    const gone = step.at.filter(s => off.has(s));
    if (gone.length) { why.push(...gone); own = gone.length === step.at.length && !step.more ? 'stopped' : 'strained'; }
    for (const n of step.needs || []) {
      const g = n.at.filter(s => off.has(s)); if (!g.length) continue;
      why.push(...g);
      if (g.length === n.at.length && n.sole) own = 'stopped'; else if (own === 'ok') own = 'strained';
    }
    let state = own;
    if (own !== 'stopped' && up === 'stopped') state = 'waits';
    else if (own === 'ok' && (up === 'strained' || up === 'waits')) state = up === 'waits' ? 'waits' : 'strained';
    /* a step that makes machines, not parts of the chip (capital): if it stops, no new machines come, but the
       ones already in the fabs go on working, so what comes after is strained, not stopped */
    if (step.capital && (state === 'stopped' || state === 'waits')) { if (up !== 'stopped') up = 'strained'; }
    else if (state === 'stopped' || state === 'waits') up = 'stopped'; else if (state === 'strained' && up === 'ok') up = 'strained';
    return { state, why: [...new Set(why)] };
  });
}

/* the first step that stops (or waits), or else the first that is strained, or null */
export function worst(st) {
  const i = st.findIndex(s => s.state === 'stopped'); if (i >= 0) return { i, state: 'stopped' };
  const j = st.findIndex(s => s.state === 'strained'); return j >= 0 ? { i: j, state: 'strained' } : null;
}

/* every site a route uses: where its steps happen, what they need, and where its flows start */
export const sitesOf = route => [...new Set(route.flatMap(s => [...s.at, ...(s.needs || []).flatMap(n => n.at), ...s.flow.flat()]))];
