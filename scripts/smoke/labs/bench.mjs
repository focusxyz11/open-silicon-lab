/* the labs section's check of the lab bench (src/data/labs/bench.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* the bench's own challenges (#269), played on the bench over the studio's picture: say what your piece must answer,
     swap the 2-bit adder's cells until the wire is short, say which mask each shape is printed from */
  const BENCH = "const st = () => JSON.parse(localStorage.getItem('osl-world-v1') || '{}').bench || {}, X = await import(new URL('src/engines/bench.js', location.href).href), Dz = await import(new URL('src/engines/design.js', location.href).href), Gm = await import(new URL('src/v2/game.js', location.href).href), CLK = n => n && n.dispatchEvent(new MouseEvent('click', { bubbles: true }));";
  await playLab('piece', BENCH + " const bk = document.querySelector('.bsurf .bk-need'); if (bk) { const p = bk.dataset.bkP, v = {}; bk.querySelectorAll('[data-bk-in]').forEach(b => { v[b.dataset.bkIn] = +b.querySelector('.bk-v').textContent; });"
    + " const pr = Dz.projectOf(p), w = pr.seq ? null : pr.f(v); if (w) { bk.querySelectorAll('[data-bk-ans]').forEach(b => { if ((b.getAttribute('aria-pressed') === 'true') !== !!w[b.dataset.bkAns]) CLK(b); }); CL('[data-jq-check]'); } }", 'Your piece of the computer');
  await playLab('floor', BENCH + " const B = X.floorDesign(), s = st(); let rows = s.floor && X.validRows(B.M, s.floor, B.PL) ? s.floor : X.floorStart(B), cur = X.floorCheck(B, rows).wl, best = null;"
    + " for (let a = 0; a < B.M.cells.length; a++) for (let b = a + 1; b < B.M.cells.length; b++) { const R = X.swapCells(B.M, rows, a, b, B.PL.W); if (!R) continue; const c = X.floorCheck(B, R); if (!c.failed && c.wl < cur && (!best || c.wl < best.wl)) best = { a, b, wl: c.wl }; }"
    + " if (best) { CLK(document.querySelector('.bsurf [data-bk-cell=\"' + best.a + '\"]')); CLK(document.querySelector('.bsurf [data-bk-cell=\"' + best.b + '\"]')); }", 'The shortest wire');
  await playLab('maskof', BENCH + " const s = st(), D = Gm.benchDesign({ bench: s }), rows = s.rows && X.validRows(D.B.M, s.rows, D.B.PL) ? s.rows : X.rowsOf(D.B.PL), m = X.measure(D.B.M, rows, D.B.PL), sh = X.maskAsk(X.maskShapes(m.PL, m.RT), (s.mq || {}).k || 0);"
    + " if (sh) CL('[data-mq=\"' + sh.mask + '\"]')", 'Which mask?');
};
