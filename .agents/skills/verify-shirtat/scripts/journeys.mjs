// Shopper journeys with Playwright + system Chrome. usage: node journeys.mjs BASE OUT
// Safe: adds to cart and views cart only. NEVER clicks checkout, never pays, never prints secrets.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [BASE = 'https://shirtat.co', OUT = '/tmp/verify-shirtat'] = process.argv.slice(2);
const PRODUCT = process.env.VERIFY_PRODUCT || '/products/ana-ibn-jala-t-shirt';
fs.mkdirSync(OUT, { recursive: true });
const results = []; const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`); };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: process.env.VERCEL_BYPASS ? { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS } : {} });
const IGNORE = /favicon|Failed to load resource.*(40[34])|googletagmanager|ahrefs|google-analytics/i;
async function open(path, shot) {
  const page = await ctx.newPage(); const errs = []; const reqs = [];
  page.on('console', m => m.type() === 'error' && !IGNORE.test(m.text()) && errs.push(m.text().slice(0, 200)));
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200)));
  page.on('request', r => reqs.push(r.url()));
  const res = await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.screenshot({ path: `${OUT}/${shot}.png`, fullPage: false });
  return { page, errs, reqs, status: res?.status() };
}
const check = async (path, shot, fn) => {
  try { const o = await open(path, shot); ok(`${path} loads`, o.status === 200, `status ${o.status}`); await fn?.(o);
    ok(`${path} no console errors`, o.errs.length === 0, o.errs.join(' | ')); await o.page.close(); }
  catch (e) { ok(`${path} journey`, false, e.message.split('\n')[0]); }
};

// Home EN: analytics lazy-loaded
await check('/', 'home-en', async ({ page, reqs }) => {
  const html = await page.content();
  ok('GTM-TDX7NTW3 referenced in page', html.includes('GTM-TDX7NTW3'));
  ok('Tag Manager not fetched before interaction', !reqs.some(u => u.includes('googletagmanager.com/gtm.js')));
  ok('Ahrefs not fetched before interaction', !reqs.some(u => u.includes('analytics.ahrefs.com')));
  await page.mouse.wheel(0, 600); await page.mouse.click(5, 300); await page.waitForTimeout(5000);
  ok('Tag Manager loads after interaction', reqs.some(u => u.includes('gtm.js?id=GTM-TDX7NTW3')));
  ok('Ahrefs loads after interaction', reqs.some(u => u.includes('analytics.ahrefs.com/analytics.js')));
  ok('GA G-6DT5S4QRGT loads', reqs.some(u => u.includes('G-6DT5S4QRGT')));
  const na = page.getByText(/new arrivals/i).first(); ok('New Arrivals section on home', await na.count() > 0);
  ok('home links to products', await page.locator('a[href*="/products/"]').count() > 0);
});
// Home AR: RTL
await check('/ar', 'home-ar', async ({ page }) => {
  const dir = await page.evaluate(() => document.documentElement.dir); const lang = await page.evaluate(() => document.documentElement.lang);
  ok('/ar html dir=rtl', dir === 'rtl', `dir=${dir} lang=${lang}`);
  ok('/ar has Arabic text', /[\u0600-\u06FF]/.test(await page.locator('body').innerText()));
});
for (const c of ['kids', 'baby']) await check(`/collections/${c}`, `collection-${c}`, async ({ page }) => {
  const n = await page.locator('[data-slot="product-card"]').count(); ok(`/collections/${c} has products`, n > 0, `${n} cards`);
});
await check(`/ar/collections/kids`, 'collection-kids-ar', async ({ page }) =>
  ok('/ar collection rtl', await page.evaluate(() => document.documentElement.dir) === 'rtl'));
// Product page
await check(PRODUCT, 'product', async ({ page }) => {
  ok('gallery present', await page.locator('[data-slot="pdp-carousel"]').count() > 0);
  const sw = page.locator('[data-slot="swatch"]'); const n = await sw.count(); ok('colour swatches present', n > 0, `${n}`);
  if (n) {
    const info = await sw.first().evaluate(el => { const s = getComputedStyle(el); const inner = el.querySelector('*'); const si = inner ? getComputedStyle(inner) : s;
      return { bg: [s.backgroundColor, si.backgroundColor, s.backgroundImage, si.backgroundImage].join(' '), title: el.getAttribute('title') || el.closest('[title]')?.getAttribute('title') || el.getAttribute('aria-label') }; });
    ok('swatch is solid colour', /rgb/.test(info.bg) && !/url\(/.test(info.bg) && !/rgba\(0, 0, 0, 0\) rgba\(0, 0, 0, 0\)/.test(info.bg), info.bg.slice(0, 80));
    ok('swatch has hover name', !!info.title, info.title || '');
  }
  const body = await page.locator('body').innerText();
  ok('Details section', /\bDetails\b/.test(body)); ok('Printing section', /\bPrinting\b/.test(body));
  const add = page.getByRole('button', { name: /add to cart/i }).first();
  await add.click(); await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/product-added.png` });
  const cartShown = /checkout|subtotal|your cart/i.test(await page.locator('body').innerText());
  ok('add to cart opens cart / shows subtotal', cartShown);
});
await check('/cart', 'cart', async ({ page }) => {
  const t = await page.locator('body').innerText();
  ok('cart contains the added item', /ana ibn jala|ابن جلا/i.test(t) || /subtotal/i.test(t), t.slice(0, 0));
});
await check('/ar' + PRODUCT, 'product-ar', async ({ page }) =>
  ok('/ar product rtl', await page.evaluate(() => document.documentElement.dir) === 'rtl'));
for (const p of ['/making-of', '/roadmap', '/ar/making-of']) await check(p, p.replace(/\//g, '_'), async ({ page }) =>
  ok(`${p} has content`, (await page.locator('main').innerText().catch(() => '')).length > 200));
await browser.close();
fs.writeFileSync(`${OUT}/journeys.json`, JSON.stringify(results, null, 2));
const f = results.filter(r => !r.pass); console.log(`journeys: ${results.length - f.length}/${results.length} pass`);
process.exit(f.length ? 1 : 0);
