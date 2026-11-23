/* the labs section's check of the lab rv (src/data/labs/rv.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* run your core, offered from the RISC-V core in the Lab: three programs, each checked by running it */
  await playLab('rvrun', "const P = '.player[data-ch=\"rvrun\"] ', W = { sum: null, max: 'mv a0, a1\\nbge a1, a2, done\\nmv a0, a2\\ndone:', fib: 'li a0, 0\\nli t1, 1\\nloop:\\n beq a1, x0, done\\n add t2, a0, t1\\n mv a0, t1\\n mv t1, t2\\n addi a1, a1, -1\\n j loop\\ndone:' }; for (const [p, src] of Object.entries(W)) { CL(P + '[data-rv-p=\"' + p + '\"]'); if (src) { const a = document.querySelector(P + '[data-rv-code]'); if (a) { a.value = src; a.dispatchEvent(new Event('input', { bubbles: true })); } } CL(P + '[data-rv-run]'); }", 'Run your core');
  /* your own core (#321): a machine's core opens on that machine's job, its datapath drawn with the arithmetic unit as 32
     slices; a wrong gate in your slice makes your core part from the reference core, and the picture shows the slice.
     Last in the section: the slice is kept on your bench, and is put back before the page closes */
  {
    const P = '.player[data-ch="rvrun"] ';
    await fp.goto(adr('#/do/rvrun/wildfire'));
    await fp.waitForFunction(P => { const b = document.querySelector(P + '[data-rv-run]'); if (b && !document.querySelector(P + '.rvtwo')) b.click();
      return !!document.querySelector(P + '[data-rv-p="wildfire"][aria-pressed="true"]') && document.querySelectorAll(P + '.dpfig .dpsl').length === 32 && !!document.querySelector(P + '.rvtwo') && !document.querySelector(P + '.rvfault'); }, P, { timeout: 90000, polling: 1500 })
      .catch(() => problems.push(tag + ': a machine\'s core does not open on its job, run on your core with its datapath drawn'));
    await fp.waitForFunction(P => { const c = q => { const b = document.querySelector(P + q); if (b) b.click(); };
      if (!document.querySelector(P + '.rvtwo')) c('[data-rv-run]');
      if (!document.querySelector(P + '[data-rv-slice0]')) c('[data-rv-gate="2"]');
      if (document.querySelector(P + '.rvfault') && !document.querySelector(P + '.dpfig .dpsl.bad')) c('[data-rv-fault]');
      return !!document.querySelector(P + '.rvfault') && !!document.querySelector(P + '.rvtwo .bad') && !!document.querySelector(P + '.dpfig .dpsl.bad') && !!document.querySelector(P + '.dpfig .dpon.bad'); }, P, { timeout: 60000, polling: 1500 })
      .catch(() => problems.push(tag + ': a wrong gate in your slice does not show where your core went wrong'));
    await fp.waitForFunction(P => { const b = document.querySelector(P + '[data-rv-slice0]'); if (b) b.click(); return !document.querySelector(P + '[data-rv-slice0]') && !document.querySelector(P + '.rvfault'); }, P, { timeout: 30000, polling: 1500 })
      .catch(() => problems.push(tag + ': your slice is not put back to the lab\'s example'));
  }
};
