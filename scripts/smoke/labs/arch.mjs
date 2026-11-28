/* the labs section's check of the lab arch (src/data/labs/arch.js): since #450 its race and map of 400 retired into Your
   stack, so the challenge is a door: it shows the goal as it stands on your stack and leads into the stack's Do, where it
   is played (the stack's own section checks the playing, scripts/smoke/stack.mjs) */
export default async ({ fp, adr, problems, tag }) => {
  await fp.goto(adr('#/do/archniche'));
  await fp.waitForFunction(() => { const P = '.player[data-ch="archniche"] '; return !!document.querySelector(P + '[data-sk-goal="archniche"] [data-argoal="wins"]') && !!document.querySelector(P + 'a[data-ar-stack][href="#/stack"]'); }, null, { timeout: 30000, polling: 1000 })
    .catch(() => problems.push(tag + ': Grow an architecture\'s door does not show its goal and the way into your stack'));
  await fp.waitForFunction(() => { const a = document.querySelector('.player[data-ch="archniche"] a[data-ar-stack]'); if (a && !/^#\/stack/.test(location.hash)) a.click();
    const v = window.__stack; return !!v && /^#\/stack/.test(location.hash) && !!document.querySelector('#stackv .skframe .sk-growd [data-sk-goal="archniche"]'); }, null, { timeout: 60000, polling: 1000 })
    .catch(() => problems.push(tag + ': the door does not open the stack on Grow an architecture'));
};
