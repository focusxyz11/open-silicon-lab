/* the labs section's check of the lab bits (src/data/labs/bits.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* Keep the chef busy (src/v2/labs/bits.js): one bit's trip answers a move of the memory; then each poll clears the first
     level of chips not yet cleared (a winning plan, served), and leaves a serve in progress to finish */
  await playLab('chef', "const P = '.player[data-ch=\"chef\"] ', W = { wire: ['closer:2', 'shelf:2'], chip: ['shelf:2', 'stack:1'], stacked: ['shelf:3', 'stack:1'], light: ['stack:1', 'light:1'], dc: ['closer:1', 'shelf:1', 'stack:1', 'cim:1'] };"
    + " if (!document.querySelector(P + '[data-mb-serve][disabled]')) { CL(P + '[data-mb-tab=\"chef\"]:not([aria-pressed=\"true\"])');"
    + " const lv = Object.keys(W).find(k => { const b = document.querySelector(P + '[data-mb-level=\"' + k + '\"]'); return b && !b.dataset.cleared; });"
    + " if (lv) { CL(P + '[data-mb-level=\"' + lv + '\"]'); CL(P + '[data-mb-start]'); for (const m of W[lv]) CL(P + '[data-mb-lever=\"' + m + '\"]'); CL(P + '[data-mb-serve]'); } }", 'Keep the chef busy', 180000);
  /* one bit's trip: moving the memory from the chip to another machine reached by light changes what the bit costs */
  await fp.waitForFunction(() => { const P = '.player[data-ch="chef"] ', c = q => { const b = document.querySelector(q); if (b) b.click(); }, e = () => { const f = document.querySelector(P + '[data-mb-e]'); return f ? { mbTrip: f.dataset.mbTrip, mbE: f.dataset.mbE } : null; };
    c(P + '[data-mb-tab="trip"]'); c(P + 'button[data-mb-at="near"]'); const a = e(); c(P + 'button[data-mb-at="rack"]'); const b = e();
    return !!(a && b && a.mbTrip === 'near' && b.mbTrip === 'rack' && +b.mbE > 10 * +a.mbE); }, null, { timeout: 30000, polling: 1500 }).catch(() => problems.push(tag + ': moving the memory does not change one bit\'s trip'));
};
