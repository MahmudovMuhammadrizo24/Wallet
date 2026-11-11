const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
// node mining-test.js <dir> <port>   -> prints a summary; writes shots + tools/actual.json
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [,, dir, port] = process.argv;
const ROOT = WORK+'/';
const SH = WORK + '/', PROBES = __dirname+'/';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(dir, p); if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end('nf'); }
  r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(+port);

const NOW = Date.now();
const MOCK = {
  adj: { progressPercent: 62.5, difficultyChange: 2.31, estimatedRetargetDate: NOW + 5.5 * 864e5, remainingBlocks: 756, remainingTime: 453600000, previousRetarget: -1.2, previousTime: 1.7e12, nextRetargetHeight: 953868, timeAvg: 596000, timeOffset: 0, expectedBlocks: 1260 },
  hr: { hashrates: Array.from({ length: 31 }, (_, i) => ({ timestamp: 1.76e9 + i * 86400, avgHashrate: 9.6e20 + i * (1.0e21 - 9.6e20) / 30 })),
        difficulty: [{ time: 1.76e9, height: 951852, difficulty: 1.37e14, adjustment: 1.02 }], currentHashrate: 1.0e21, currentDifficulty: 1.4e14 },
  rw: { startBlock: 952968, endBlock: 953111, totalReward: '45329835244', totalFee: '329835244', totalTx: '666658' },
  rwNum: { startBlock: 952968, endBlock: 953111, totalReward: 45329835244, totalFee: 329835244, totalTx: 666658 },
  tip: '953111',
  px: () => ({ bitcoin: { usd: 97000, usd_24h_change: 1.23 }, ethereum: { usd: 3400, usd_24h_change: -0.5 }, tether: { usd: 1, usd_24h_change: 0 }, tron: { usd: 0.25, usd_24h_change: 2 }, solana: { usd: 180, usd_24h_change: 3 } })
};
let calls = [];
// `mode` o'qilishi so'rov vaqtida: testning o'rtasida o'zgartirish mumkin
async function mock(pg, mode) {
  await pg.route(u => !u.href.startsWith('http://localhost'), r => {
    const u = r.request().url(); calls.push(u);
    const json = o => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    const bad = () => r.fulfill({ status: 500, body: 'err' });
    if (/mempool\.space\/api\/v1\/difficulty-adjustment/.test(u)) return mode.fail ? bad() : json(MOCK.adj);
    if (/mempool\.space\/api\/v1\/mining\/hashrate\/1m/.test(u)) return mode.fail ? bad() : json(MOCK.hr);
    if (/mempool\.space\/api\/v1\/mining\/reward-stats\/144/.test(u)) return (mode.fail || mode.noReward) ? bad() : json(mode.numeric ? MOCK.rwNum : MOCK.rw);
    if (/mempool\.space\/api\/blocks\/tip\/height/.test(u)) return mode.fail ? bad() : r.fulfill({ status: 200, contentType: 'text/plain', body: MOCK.tip });
    if (/api\.coingecko\.com/.test(u)) return mode.fail ? bad() : json(MOCK.px());
    return r.abort();
  });
}
async function newWallet(b, mode, scheme = 'dark', vp = { width: 390, height: 844 }) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: scheme, serviceWorkers: 'block' });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
  await mock(pg, mode);
  await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
  const words = await pg.$$eval('#wb input', els => els.map(e => e.value));
  await pg.click('#next'); await pg.waitForSelector('.vin');
  for (const p of await pg.$$eval('.vin', els => els.map(e => +e.id.slice(1)))) await pg.fill('#v' + p, words[p]);
  await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])', { timeout: 30000 }); await pg.waitForTimeout(500);
  return { ctx, pg, errs, words };
}
async function unlock(pg, words) {
  await pg.waitForSelector('#go'); const ins = await pg.$$('#wb input');
  for (let i = 0; i < words.length; i++) await ins[i].fill(words[i]);
  await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])', { timeout: 30000 }); await pg.waitForTimeout(300);
}
const grab = async pg => ({
  stats: await pg.$$eval('#mn-net .stat', els => els.map(e => ({ k: e.querySelector('.k').textContent, v: e.querySelector('.v').textContent, s: (e.querySelector('.s') || {}).textContent || '' }))),
  rows: await pg.$$eval('#mn-out dt', dts => dts.map(dt => ({ k: dt.textContent, v: dt.nextElementSibling.textContent, c: dt.nextElementSibling.className }))),
  foot: await pg.$$eval('#mn-net > p.mut', e => e.map(x => x.textContent)), warn: await pg.$$eval('#mn-net .warn', e => e.map(x => x.textContent)),
  bar: await pg.$$eval('#mn-net .bar > div', e => e.map(x => x.style.width)), hint: await pg.$eval('#mn-hint', e => e.textContent),
  spark: await pg.$$eval('#mn-net .spark', e => e.map(x => x.getAttribute('aria-label'))),
  empty: await pg.$$eval('#mn-net .empty strong', e => e.map(x => x.textContent)),
  invalid: await pg.$$eval('#pg-mining input', e => e.map(x => x.id + '=' + x.getAttribute('aria-invalid'))),
  vals: await pg.$$eval('#pg-mining input', e => e.map(x => x.id + '=' + x.value)),
  refreshDisabled: await pg.$eval('#mn-refresh', e => e.disabled)
});
const probe = async (pg, name) => { const j = JSON.parse(await pg.evaluate(fs.readFileSync(PROBES + 'probe-core.js', 'utf8'))); fs.writeFileSync(SH + name + '-core.json', JSON.stringify(j, null, 1)); return j; };
const summarize = core => ({ contrastMeasured: core.contrast.measured, contrastChecked: core.contrast.checked, contrastFails: core.contrast.failures.map(x => JSON.stringify(x).slice(0, 300)),
  tooSmall: core.tapTargets.tooSmall.map(x => JSON.stringify(x).slice(0, 200)), overflow: core.layout.horizontalOverflow });

(async () => {
  const b = await chromium.launch(); const out = {};
  // ---------- A. oddiy ma'lumot: qorong'i va och mavzu
  for (const scheme of ['dark', 'light']) {
    calls = [];
    const mode = {};
    const { ctx, pg, errs, words } = await newWallet(b, mode, scheme);
    await pg.screenshot({ path: SH + `m-${scheme}-home.png` });
    const homeProbe = summarize(await probe(pg, `m-${scheme}-home`));
    calls = [];
    await pg.click('.tipcard a[href="#/mining"]'); await pg.waitForSelector('#mn-net .stats'); await pg.waitForTimeout(900);
    await pg.screenshot({ path: SH + `m-${scheme}-top.png` });
    await pg.screenshot({ path: SH + `m-${scheme}-full.png`, fullPage: true });
    const A = out[scheme] = await grab(pg);
    A.nav = await pg.$eval('#nav-wallet', e => e.getAttribute('aria-current'));
    A.title = await pg.title(); A.back = await pg.$eval('#back', e => !e.hidden); A.hash = await pg.evaluate(() => location.hash);
    A.abTitle = await pg.$eval('#ab-title', e => e.textContent); A.focus = await pg.evaluate(() => document.activeElement && document.activeElement.tagName + ':' + document.activeElement.textContent);
    A.requested = [...new Set(calls.map(u => u.replace(/\?.*$/, '')))];
    A.homeProbe = homeProbe; A.probe = summarize(await probe(pg, `m-${scheme}`)); A.errs = errs;
    if (scheme === 'dark') {
      // B. kiritish tekshiruvlari
      await pg.fill('#mn-kwh', '0,07'); await pg.waitForTimeout(100); out.comma = await grab(pg);
      await pg.fill('#mn-w', '9000'); await pg.waitForTimeout(100); out.loss = await grab(pg);
      await pg.screenshot({ path: SH + 'm-dark-loss.png', fullPage: true });
      await pg.fill('#mn-w', '0'); await pg.waitForTimeout(100); out.zerow = await grab(pg);
      await pg.fill('#mn-ths', 'abc'); await pg.waitForTimeout(100); out.bad = await grab(pg);
      await pg.screenshot({ path: SH + 'm-dark-invalid.png', fullPage: true });
      await pg.fill('#mn-ths', ''); await pg.waitForTimeout(100); out.blank = await grab(pg);
      await pg.fill('#mn-ths', '1e7'); await pg.waitForTimeout(100); out.range = await grab(pg);
      await pg.fill('#mn-ths', '110'); await pg.fill('#mn-w', '3250'); await pg.fill('#mn-kwh', '0.05'); await pg.fill('#mn-fee', '2.5'); await pg.waitForTimeout(100);
      out.custom = await grab(pg);
      out.srText = await pg.waitForFunction(() => document.querySelector('#mn-sr').textContent.length > 0, null, { timeout: 3000 }).then(() => pg.$eval('#mn-sr', e => e.textContent));
      out.stored = await pg.evaluate(() => localStorage.getItem('cw_mining'));
      // C. qayta yuklash va kirish: qiymatlar saqlanib qolishi kerak
      await pg.reload(); await unlock(pg, words);
      out.afterReload = await grab(pg); out.storedAfterReload = await pg.evaluate(() => localStorage.getItem('cw_mining'));
      // D. qulflash (qo'lda) -> qayta kirish: tarmoq holati tozalanadi, kiritilgan qiymatlar qoladi
      await pg.click('#lock'); await pg.waitForSelector('#go'); await unlock(pg, words);
      await pg.evaluate(() => { location.hash = '#/mining'; }); await pg.waitForSelector('#mn-net .stats'); await pg.waitForTimeout(300);
      out.afterLock = await grab(pg);
      // E. hamyonni o'chirish: cw_mining ham o'chadi
      await pg.click('#lock'); await pg.waitForSelector('#wipe'); await pg.click('#wipe'); await pg.waitForSelector('#dlg-ok'); await pg.click('#dlg-ok'); await pg.waitForSelector('#t-create'); await pg.waitForTimeout(200);
      out.afterWipe = await pg.evaluate(() => ({ mining: localStorage.getItem('cw_mining'), vault: localStorage.getItem('cw_vault'), salt: localStorage.getItem('cw_salt'), ver: localStorage.getItem('cw_ver') }));
    }
    await ctx.close();
  }
  // ---------- F. Sozlamalar orqali kirish + orqaga
  { const { ctx, pg } = await newWallet(b, {}); await pg.click('#nav-set'); await pg.waitForSelector('#pg-settings:not([hidden])');
    await pg.screenshot({ path: SH + 'm-dark-settings.png' });
    await pg.click('#pg-settings a[href="#/mining"]'); await pg.waitForSelector('#mn-net .stats'); out.viaSettings = await pg.evaluate(() => location.hash);
    out.viaSettingsNav = await pg.$eval('#nav-wallet', e => e.getAttribute('aria-current'));
    await pg.click('#back'); await pg.waitForTimeout(400); out.afterBack = await pg.evaluate(() => location.hash); await ctx.close(); }
  // ---------- G. xato holatlari
  { const mode = { fail: true }; const { ctx, pg, errs } = await newWallet(b, mode); await pg.click('.tipcard a[href="#/mining"]'); await pg.waitForSelector('#mn-net .empty'); await pg.waitForTimeout(300);
    out.fail = await grab(pg); await pg.screenshot({ path: SH + 'm-dark-fail.png', fullPage: true });
    mode.fail = false; await pg.click('#mn-refresh'); await pg.waitForSelector('#mn-net .stats'); await pg.waitForTimeout(300);
    out.failRetry = await grab(pg); out.failErrs = errs; await ctx.close(); }
  { const mode = { noReward: true }; const { ctx, pg, errs } = await newWallet(b, mode); await pg.click('.tipcard a[href="#/mining"]'); await pg.waitForSelector('#mn-net .stats'); await pg.waitForTimeout(300);
    out.partial = await grab(pg); out.partialErrs = errs; await pg.screenshot({ path: SH + 'm-dark-partial.png', fullPage: true }); await ctx.close(); }
  { const mode = { numeric: true }; const { ctx, pg } = await newWallet(b, mode); await pg.click('.tipcard a[href="#/mining"]'); await pg.waitForSelector('#mn-net .stats'); await pg.waitForTimeout(300);
    out.numeric = await grab(pg); await ctx.close(); }
  // oxirgi qiymat saqlanishi: birinchi yuklash to'liq, yangilashda qisman xato
  { const mode = {}; const { ctx, pg } = await newWallet(b, mode); await pg.click('.tipcard a[href="#/mining"]'); await pg.waitForSelector('#mn-net .stats'); await pg.waitForTimeout(300);
    out.staleBefore = await grab(pg); mode.noReward = true; await pg.click('#mn-refresh'); await pg.waitForFunction(() => !document.querySelector('#mn-refresh').disabled); await pg.waitForTimeout(300);
    out.staleAfter = await grab(pg); await pg.screenshot({ path: SH + 'm-dark-stale.png', fullPage: true });
    mode.fail = true; await pg.click('#mn-refresh'); await pg.waitForFunction(() => !document.querySelector('#mn-refresh').disabled); await pg.waitForTimeout(300);
    out.allFailAfterData = await grab(pg); await ctx.close(); }
  // ---------- H. tor ekran 320 px
  { const { ctx, pg } = await newWallet(b, {}, 'light', { width: 320, height: 640 }); await pg.click('.tipcard a[href="#/mining"]'); await pg.waitForSelector('#mn-net .stats'); await pg.waitForTimeout(500);
    await pg.screenshot({ path: SH + 'm-light-320.png', fullPage: true });
    out.narrow = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    out.narrowProbe = summarize(await probe(pg, 'm-narrow')); await ctx.close(); }
  fs.writeFileSync(WORK + '/actual.json', JSON.stringify(out, null, 1));
  await b.close(); srv.close(); console.log('done');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
