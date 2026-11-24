/* the labs section's check of the lab switch (src/data/labs/switch.js): its challenge played to its win on the labs'
   flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* invent a transistor, at the switch: graphene never turns off, a silicon switch with its gate all around spends less,
     tunnelling gets past the 60 mV line, and the same shape with a ferroelectric gate is one a factory could make. Each
     poll makes the next switch the goals still want, so the moves go on where a redraw left them */
  await playLab('transistor', "const P = '.player[data-ch=\"transistor\"] ', met = k => !!document.querySelector(P + '[data-swgoal=\"' + k + '\"][data-met]'), pick = (k, v) => { const b = document.querySelector(P + '[data-sw-' + k + '=\"' + v + '\"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); };"
    + " pick('mat', 'si'); if (!met('energy')) pick('shape', 'gaa'); else if (!met('steep')) { pick('shape', 'fin'); pick('mech', 'tunnel'); } else if (!met('factory')) { pick('shape', 'gaa'); pick('mech', 'nc'); }",
  'Invent a transistor');
  /* graphene never turns off: its curve says so on the picture, and an invented material outside the band is a guess */
  await fp.waitForFunction(() => { const P = '.player[data-ch="transistor"] ', b = document.querySelector(P + '[data-sw-mat="graphene"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
    return !!document.querySelector(P + '.tswfig .tbad') && !!document.querySelector(P + '.tswfig .floor'); }, null, { timeout: 30000, polling: 1000 }).catch(() => problems.push(tag + ': graphene does not show that it never turns off'));
  await fp.waitForFunction(() => { const P = '.player[data-ch="transistor"] ', b = document.querySelector(P + '[data-sw-mat="own"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
    const set = (k, v) => { const i = document.querySelector(P + '#sw-' + k); if (i && i.value !== String(v)) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } };
    set('eg', 2.5); set('me', 5);
    return !!document.querySelector(P + '.tswband .me.out') && !!document.querySelector(P + '.tswbandsay.bad') && !!document.querySelector(P + '.tswfig .you.guess'); }, null, { timeout: 30000, polling: 1000 }).catch(() => problems.push(tag + ': an invented material outside the band is not marked a guess'));
};
