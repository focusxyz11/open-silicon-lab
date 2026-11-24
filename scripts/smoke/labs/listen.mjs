/* the labs section's check of the lab listen (src/data/labs/listen.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* Listen and tell (#316, for everyone since #317): the state played is on the hidden picture, so it is answered without audio */
  await playLab('ear', "const P = '.player[data-ch=\"ear\"] '; for (let n = 0; n < 12 && !document.querySelector(P + '.won'); n++) { CL(P + '[data-ear-play]'); const f = document.querySelector(P + '.earfig'), s = f && f.dataset.earState; if (s) CL(P + '[data-ear-ans=\"' + s + '\"]'); }", 'Listen and tell');
};
