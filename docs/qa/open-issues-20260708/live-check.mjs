import { chromium } from '@playwright/test';

const out = 'docs/qa/open-issues-20260708/live';
const targets = [
  ['guide-33', 'https://vps.provodnik.app/guides/%D0%B6%D1%8E%D0%BB%D1%8C-%D0%B2%D0%B5%D1%80%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2-69f18040'],
  ['request-41-42', 'https://vps.provodnik.app/requests/e008d8b7-ab51-4c6f-ab8f-0f0adf226768'],
  ['request-35', 'https://vps.provodnik.app/requests/fd29dc81-b39f-49fe-a62f-94414839c3b3?created=1&mode=private'],
  ['admin-bookings', 'https://vps.provodnik.app/admin/bookings'],
  ['guide-listings', 'https://vps.provodnik.app/guide/listings'],
];

const browser = await chromium.launch({ headless: true });
const results = [];
for (const [name, url] of targets) {
  for (const vp of [{name:'desktop', width:1280, height:900}, {name:'mobile', width:390, height:844}]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e.message || e)));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    let status = null, finalUrl = null, title = null, text = '';
    try {
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      status = res?.status() ?? null;
      finalUrl = page.url();
      title = await page.title();
      text = (await page.locator('body').innerText({ timeout: 5000 }).catch(() => '')).slice(0, 2500);
      await page.screenshot({ path: `${out}/${name}-${vp.name}.png`, fullPage: true });
    } catch (e) {
      errors.push(String(e?.message || e));
    }
    results.push({ name, viewport: vp.name, status, finalUrl, title, textStart: text, errors });
    await page.close();
  }
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
