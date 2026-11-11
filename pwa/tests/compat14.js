const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/';
const PORT = 8761, STATE = ROOT + 'tools/state.json';
const mime = { '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.webmanifest':'application/manifest+json' };
const serve = dir => new Promise(res => { const s = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(dir, p); if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404, {'content-type':'text/html'}); return r.end('<h1>404</h1>'); }
  r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(PORT, () => res(s)); });
const trongrid = [];
const watch = pg => pg.route(u => !u.href.startsWith('http://localhost'), r => { if (/trongrid\.io\/v1\/accounts\/[^/?]+$/.test(r.request().url())) trongrid.push(r.request().url()); r.abort(); });
(async () => {
  const b = await chromium.launch();
  // ---- A: original v9 creates a wallet
  let srv = await serve(ROOT + 'pwa/hamyon');
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); let pg = await ctx.newPage(); await watch(pg);
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForSelector('#t-create');
  const words = await pg.$$eval('#wb input', els => els.map(e => e.value));
  await pg.click('#next'); await pg.waitForSelector('.vin');
  for (const p of await pg.$$eval('.vin', els => els.map(e => +e.id.slice(1)))) await pg.fill('#v' + p, words[p]);
  await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])'); await pg.waitForTimeout(1500);
  console.log('v9  trongrid /accounts requests in first refresh:', trongrid.length); trongrid.length = 0;
  await ctx.storageState({ path: STATE }); await ctx.close(); srv.close();
  // ---- B: v10 opens the SAME stored vault with the same 12 words
  srv = await serve(ROOT + 'out14');
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, storageState: STATE }); pg = await ctx.newPage(); await watch(pg);
  const errs = []; pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push(m.text()); }); pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForSelector('#go');
  const boxes = await pg.$$('#wb input'); for (let i = 0; i < 12; i++) await boxes[i].fill(words[i]);
  await pg.click('#go'); await pg.waitForSelector('#pg-home:not([hidden])', { timeout: 30000 }); await pg.waitForTimeout(1500);
  const items = await pg.$$eval('#list tr:not(.ng):not(.ngp-row)', r => r.length);
  console.log('v10 unlocked the v9 vault: yes, asset rows =', items, '| trongrid /accounts requests in first refresh:', trongrid.length);
  // wrong words must still be rejected
  await pg.click('#lock'); await pg.waitForSelector('#go'); const bx = await pg.$$('#wb input'); for (let i = 0; i < 12; i++) await bx[i].fill(words[(i + 1) % 12]);
  await pg.click('#go'); await pg.waitForTimeout(1500); console.log('wrong words ->', await pg.$eval('#msg', e => e.textContent));
  // ---- C: service worker precache + offline start
  await pg.close(); await ctx.close();
  ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); pg = await ctx.newPage(); await watch(pg);
  await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForSelector('#t-create');
  await pg.evaluate(() => navigator.serviceWorker.ready); await pg.waitForTimeout(800);
  const cacheKeys = await pg.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks[0]); return [ks, (await c.keys()).map(r => new URL(r.url).pathname)]; });
  console.log('SW cache:', JSON.stringify(cacheKeys));
  await pg.reload(); await pg.waitForSelector('#t-create'); // now controlled by SW
  await ctx.setOffline(true); await pg.reload(); await pg.waitForSelector('#t-create', { timeout: 8000 }); console.log('offline reload renders app: yes');
  await ctx.setOffline(false);
  // 404 navigation must NOT overwrite the cached shell
  await pg.goto(`http://localhost:${PORT}/nope`); const t404 = await pg.textContent('body'); 
  await ctx.setOffline(true); await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForSelector('#t-create', { timeout: 8000 });
  console.log('after a 404 navigation, offline shell still the app: yes | 404 body seen:', JSON.stringify(t404.trim().slice(0, 20)));
  console.log('v10 console/CSP errors:', errs.length, errs.slice(0, 3));
  await b.close(); srv.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
