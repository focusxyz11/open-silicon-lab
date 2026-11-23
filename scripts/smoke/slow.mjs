import { S } from './shared.mjs';

export const about = 'a device too slow for 3D gets the flat drawing back';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  /* a device too slow for a level in 3D gets its flat drawing back (osl-quality = slow makes every level count as too slow) */
  {
    S.at = 'slow device'; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => problems.push('slow device: ' + e.message));
    await page.addInitScript(() => { localStorage.setItem('osl-quality', 'slow'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html#/dive/atom');
    await page.waitForFunction(() => { const h = document.getElementById('l3-atom'); return h && h.hidden && +getComputedStyle(document.getElementById('diveCanvas')).opacity > 0.9; }, null, { timeout: 30000 }).catch(() => problems.push('slow device: a level too slow in 3D did not fall back to its flat drawing'));
    await page.close();
  }
}
