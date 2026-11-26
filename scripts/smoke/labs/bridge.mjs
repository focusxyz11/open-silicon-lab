/* the labs section's check of the lab bridge (src/data/labs/bridge.js): its challenges played to their win on the labs'
   flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* one spec, two matters: the AND's threshold at 1.2 (step 12) with fuel 0.5 (step 2), the OR's at 0.4 (step 4) with
     fuel 0.75 (step 3); each dial is set again on every poll */
  await playLab('bridge', "const P = '.player[data-ch=\"bridge\"] '; for (const [k, v] of [['and-th', 12], ['and-fuel', 2], ['or-th', 4], ['or-fuel', 3]]) { const i = document.querySelector(P + '#br-' + k); if (i && +i.value !== v) SET(P + '#br-' + k, v); }", 'One spec, two matters');
  /* the silicon side follows the chosen input: the choice's row s=1, a=1, b=0 lights the output */
  await fp.waitForFunction(() => { const P = '.player[data-ch="bridge"] '; const b = document.querySelector(P + '[data-br-spec="choice"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
    const r = document.querySelector(P + '[data-br-row="6"]'); if (r && !r.classList.contains('on')) r.click();
    return document.querySelectorAll(P + '.brfig .bit.out.on').length === 1 && document.querySelectorAll(P + '.brfig path.cv').length === 8; }, null, { timeout: 30000, polling: 1000 })
    .catch(() => problems.push(tag + ': the choice does not show silicon lit by its input and eight curves in the tube'));
  /* a tube that recognizes shapes: annihilator 1.2 (step 12), restoring threshold 0.05 (step 1), fuel 0.5 (step 2) */
  await playLab('dnawta', "const P = '.player[data-ch=\"dnawta\"] '; for (const [k, v] of [['ann', 12], ['th', 1], ['fuel', 2]]) { const i = document.querySelector(P + '#br-' + k); if (i && +i.value !== v) SET(P + '#br-' + k, v); }", 'A tube that recognizes shapes');
};
