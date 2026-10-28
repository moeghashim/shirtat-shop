// Put the protected-preview cookie into a running Chrome (CDP port) without loading the site, so Lighthouse starts cold.
// usage: VERCEL_JWT=... node set-cookie.mjs PORT BASE
import { chromium } from 'playwright-core';
const [port, base] = process.argv.slice(2);
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
const ctx = browser.contexts()[0] ?? await browser.newContext();
await ctx.addCookies([{ name: '_vercel_jwt', value: process.env.VERCEL_JWT, domain: new URL(base).hostname, path: '/', secure: true, httpOnly: true }]);
await browser.close();
