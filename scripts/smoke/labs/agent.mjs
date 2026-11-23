/* the labs section's check of the lab agent (src/data/labs/agent.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* Verify the agent, at the Lab: a tool checks a case, and eight right calls win */
  await fp.goto(adr('#/do/agent'));
  await fp.waitForSelector('#sheet .agcases [data-ag-case]', { timeout: 60000 }).catch(() => problems.push(tag + ': Verify the agent does not show its cases'));
  await fp.waitForFunction(() => { const b = document.querySelector('#sheet [data-ag-run]'); if (b) b.click(); return !!document.querySelector('#sheet .agtt tr.bad'); }, null, { timeout: 30000, polling: 1500 }).catch(() => problems.push(tag + ': checking every input does not find the equality checker\'s wrong rows'));
  /* the sheet may be drawn again when the flight lands: each poll makes every call that is still missing */
  await fp.waitForFunction(() => { const calls = [['eq', 0], ['maj'], ['sum', 0], ['mul'], ['yield', 0], ['roof', 0], ['fact', 0], ['cov', 0]], c = s => { const e = document.querySelector('#sheet ' + s); if (e) e.click(); };
    for (const [id, r] of calls) { c('[data-ag-case="' + id + '"]'); if (document.querySelector('#sheet .agverdict.good')) continue; c('[data-ag-redo]'); if (r == null) c('[data-ag-trust]'); else { c('[data-ag-reject]'); c('[data-ag-reason="' + r + '"]'); } }
    return !!document.querySelector('#sheet .player .won'); }, null, { timeout: 30000, polling: 1500 }).catch(() => problems.push(tag + ': eight right calls do not win Verify the agent'));
  await inDo('agent', 'agent');
};
