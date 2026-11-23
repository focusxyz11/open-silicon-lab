/* the labs section's check of the lab litho (src/data/labs/litho.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  await playLab('euv-1000', "SET('#eu-power', 1000); SET('#eu-reflect', 0.72); SET('#eu-mirrors', 8); SET('#eu-dose', 15)", 'The 1,000-watt source');
  /* every scanner at its finest: the engine finds the setting, the person's dials are set to it */
  await playLab('litho-finest', "const X = await import(new URL('src/engines/litho.js', location.href).href); for (const s of X.SOURCES) { const f = X.finestHalfPitch(s.id); let pick = null;"
    + " for (const dp of [false, true]) for (const illum of ['dipole', 'conventional']) for (let v = 0; v <= 1000 && !pick; v++) { const r = X.litho({ src: s.id, na: X.naOf(s, 9), hp: X.hpOfSlider(v), dose: 0.86, illum, dp }); if (r.status !== 'bad' && r.hp <= f * 1.1) pick = { v, illum, dp }; }"
    + " if (!pick) continue; CL('[data-lt-src=\"' + s.id + '\"]'); CL('[data-lt-illum=\"' + pick.illum + '\"]'); const d = document.querySelector('[data-lt-dp]'); if (d && (d.getAttribute('aria-pressed') === 'true') !== pick.dp) d.click();"
    + " SET('#lt-na', 9); SET('#lt-hp', pick.v); }", 'Print the finest lines');
};
