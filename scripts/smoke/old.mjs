import { S } from './shared.mjs';

export const about = 'the old address (classic.html) leads to the chip world';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  /* the earlier site (classic.html) was retired in 2026-11 and kept on the branch claude/before-retire-2026-11; the old
     address now leads to the chip world */
  S.at = 'old address'; { const page = await browser.newPage(); await page.goto(base + 'classic.html#/questions'); await page.waitForFunction(() => /index\.html/.test(location.pathname) || location.pathname.endsWith('/'), null, { timeout: 15000 }).catch(() => problems.push('the old address does not lead to the chip world')); await page.close(); }
}
