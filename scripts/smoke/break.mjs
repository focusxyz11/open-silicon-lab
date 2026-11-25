import { S } from './shared.mjs';

export const about = 'Break it on desktop and phone: the report kept as a ledger entry, standing on the island';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  /* Break it: on every screen, on a phone too, anyone reports what is wrong at the place they saw it; it is kept as a
     draft entry of the ledger with the one link that opens it on GitHub, and a report without a name is refused in words */
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    const tag = 'break it ' + w; S.at = tag;
    const page = await browser3d.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await page.addInitScript(() => { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html#/line/print');
    await page.waitForSelector('#breakbtn', { timeout: 30000 }).catch(() => problems.push(tag + ': no Break it button'));
    await page.waitForTimeout(1500);
    await page.click('#breakbtn').catch(() => problems.push(tag + ': Break it cannot be tapped'));
    await page.waitForSelector('#breakp:not([hidden]) [data-breakwords]', { timeout: 5000 }).catch(() => problems.push(tag + ': the panel did not open'));
    if (!/#\/line\/print/.test(await page.textContent('#breakp').catch(() => ''))) problems.push(tag + ': the panel does not say where you are');
    await page.fill('[data-breakwords]', 'Next step did nothing the first time I pressed it.').catch(() => {});
    await page.click('[data-breakkeep]').catch(() => {});
    if (!(await page.$('#breakp .err'))) problems.push(tag + ': a report without a name was not refused');
    await page.fill('[data-sign]', 'A tester').catch(() => {}); await page.fill('[data-breakwords]', 'Next step did nothing the first time I pressed it.').catch(() => {});
    await page.click('[data-say="broken"]').catch(() => {}); await page.click('[data-breakkeep]').catch(() => {});
    const href = await page.getAttribute('#breakp [data-send]', 'href').catch(() => '');
    if (!/\/new\/main\/community\/ledger\?filename=\d{4}-\d{2}-\d{2}-report-/.test(href || '')) problems.push(tag + ': the report was not kept as an entry with its link');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) problems.push(tag + ': sideways scrolling with the panel open');
    /* the report stands on the island, at the factory where printing is, until a fix names it; tapping it goes back there */
    if (w > 700) { await page.evaluate(() => { location.hash = '#/island'; });
      await page.waitForSelector('#mapLabels .poi3.report[data-poi="report:#/line/print"]', { state: 'attached', timeout: 30000 }).catch(() => problems.push(tag + ': a kept report does not stand on the island'));
      await page.evaluate(() => { const b = document.querySelector('#mapLabels .poi3.report'); if (b) b.click(); });
      await page.waitForFunction(() => location.hash === '#/line/print' && !document.getElementById('breakp').hidden, null, { timeout: 15000 }).catch(() => problems.push(tag + ': a report on the island does not lead back to where it was seen')); }
    await page.close();
  }
  /* a report from an encoded address is filed at that address, read plainly; Escape on a button in the panel closes the
     panel only, never the view behind it (#369) */
  { const tag = 'break it, encoded'; S.at = tag; const ep = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    ep.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await ep.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await ep.goto(base + 'index.html#/do/job%3Acore');
    await ep.waitForFunction(() => { const p = document.getElementById('breakp'); if (p && p.hidden) document.getElementById('breakbtn').click(); return !!p && !p.hidden && (p.querySelector('.mono') || {}).textContent === '#/do/job:core'; }, null, { timeout: 30000, polling: 1000 })
      .catch(async () => problems.push(tag + ': the report is filed at ' + await ep.evaluate(() => (document.querySelector('#breakp .mono') || {}).textContent).catch(() => '?')));
    await ep.focus('#breakp [data-say]').catch(() => {}); await ep.keyboard.press('Escape');
    await ep.waitForFunction(() => document.getElementById('breakp').hidden, null, { timeout: 5000 }).catch(() => problems.push(tag + ': Escape does not close the panel'));
    if (await ep.evaluate(() => location.hash) !== '#/do/job%3Acore') problems.push(tag + ': Escape in the panel also moved the view');
    await ep.close(); }
}
