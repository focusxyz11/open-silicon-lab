/* the labs section's check of the lab arch (src/data/labs/arch.js): its challenges played to their win on the labs'
   flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* grow an architecture nobody has built: compute in the memory, laid out once as a graph, in stacked layers; put
     attempts into people for the first ten years, then into what the engine suggests (the directions marked
     data-ar-best), five years at a time. Each poll picks what is still missing and plays on from where a redraw left it */
  const MOVES = id => "const P = '.player[data-ch=\"" + id + "\"] ', q = s => document.querySelector(P + s), pick = (k, v) => { const b = q('[data-ar-gene=\"' + k + '\"][data-ar-opt=\"' + v + '\"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); };"
    + " pick('where', 'in'); pick('told', 'graph'); pick('shape', 'stack');"
    + " const y = +((q('[data-ar-yearnow]') || {}).dataset || {}).arYearnow || 0, want = (y < 10 ? ['people'] : []).concat([1, 2].map(i => (q('[data-ar-best=\"' + i + '\"]') || {}).dataset).filter(Boolean).map(d => d.arDir)).slice(0, 2);"
    + " for (const d of ['device', 'memory', 'tools', 'errors', 'making', 'people']) { const b = q('[data-ar-dir=\"' + d + '\"]'); if (b && b.getAttribute('aria-pressed') === 'true' && !want.includes(d)) b.click(); }"
    + " for (const d of want) { const b = q('[data-ar-dir=\"' + d + '\"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }"
    + " if (q('[data-argoal=\"years\"].bad')) CL(P + '[data-ar-reset]'); else CL(P + '[data-ar-year=\"5\"]');";
  await playLab('archniche', MOVES('archniche'), 'An architecture nobody has built');
  await playLab('archspread', MOVES('archspread'), 'From one need to three');
  /* the agents wait for your first year (think first), then propose forks that keep the recipe new */
  await fp.waitForFunction(() => { const P = '.player[data-ch="archspread"] '; if (!document.querySelector(P)) return false;
    const ask = document.querySelector(P + '[data-ar-ask]'); if (ask) ask.click();
    return document.querySelectorAll(P + '[data-ar-fork]').length >= 1; }, null, { timeout: 30000, polling: 1000 }).catch(() => problems.push(tag + ': the agents propose no fork after the first year'));
  /* the map holds all 400 recipes, the built ones marked */
  await fp.waitForFunction(() => { const P = '.player[data-ch="archspread"] '; return document.querySelectorAll(P + '.armap [data-ar-pick]').length === 400 && document.querySelectorAll(P + '.armap .sq.k-product').length >= 5; }, null, { timeout: 30000, polling: 1000 })
    .catch(() => problems.push(tag + ': the map of recipes is not whole'));
};
