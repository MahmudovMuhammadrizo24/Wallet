const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
function fakeOhlc(n){const out=[];let p=60000;const t0=Date.now()-n*86400000;for(let i=0;i<n;i++){const o=p;const dir=(i%3===0)?-1:1;const c=o*(1+dir*0.01*((i%5)+1));const h=Math.max(o,c)*1.005;const l=Math.min(o,c)*0.995;out.push([t0+i*86400000,o,h,l,c]);p=c;}return out;}
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 let ohlcCalls=0;
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{
  const u=r.request().url();
  if(/\/coins\/[^/]+\/ohlc/.test(u)){ ohlcCalls++; const days=Number(new URL(u).searchParams.get('days'))||7; return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(fakeOhlc(days===1?8:days))}); }
  if(/coingecko/.test(u)){const ids=(new URL(u).searchParams.get('ids')||'').split(','); const o={}; ids.forEach((id,i)=>o[id]={usd:id==='bitcoin'?60000.5:1+i*0.01,usd_24h_change:i%2?-1.5:2.25}); return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)})}
  return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000}); await pg.waitForTimeout(1200);
 await pg.evaluate(() => {
  const AMT = { BTC: 0.5, ETH: 3, USDT_ERC20: 1200, TRX: 5000, USDT_TRC20: 300, SOL: 20, TON: 400 };
  const PX = { BTC: 60000, ETH: 3000, USDT_ERC20: 1, TRX: 0.1, USDT_TRC20: 1, SOL: 150, TON: 5 };
  data.items.forEach(it => { balances[it.id] = AMT[it.coin] ?? 0; const id = cgOf(it); if (id) prices[id] = { usd: PX[it.coin] ?? 1, ch: it.coin === 'BTC' ? 2.5 : -1.2 }; });
 });
 await pg.click('a[href="#/charts"]'); await pg.waitForSelector('#cx-analyze');
 await pg.click('#cx-analyze'); await pg.waitForSelector('.cxlist li');
 ok('rowsClickable',(await pg.$$eval('.cx-row',e=>e.length))>=2);
 ok('detailHiddenInit',(await pg.$eval('.cx-row .cx-detail',e=>e.hidden))===true);
 // birinchi qatorni bosish -> sham grafik ochiladi (standart 7 kun)
 await pg.click('.cx-row:first-child .cxhead');
 await pg.waitForSelector('.cx-row:first-child .cxsvg');
 ok('detailOpened',(await pg.$eval('.cx-row:first-child .cx-detail',e=>e.hidden))===false);
 const rects1=await pg.$$eval('.cx-row:first-child .cxsvg rect',e=>e.length);
 R.rects7=rects1; ok('candles7',rects1===7);
 ok('per7Pressed',(await pg.$eval('.cx-row:first-child .cx-per button[data-d="7"]',e=>e.getAttribute('aria-pressed')))==='true');
 // 1 kunlik davrga o'tish
 await pg.click('.cx-row:first-child .cx-per button[data-d="1"]');
 await pg.waitForFunction(()=>document.querySelectorAll('.cx-row:first-child .cxsvg rect').length===8);
 const rects2=await pg.$$eval('.cx-row:first-child .cxsvg rect',e=>e.length);
 R.rects1=rects2; ok('candles1',rects2===8);
 ok('ohlcFetched',ohlcCalls>=2);
 // eng past / eng baland ko'rsatiladi
 const hlText=await pg.$eval('.cx-row:first-child .cx-hl',e=>e.textContent);
 R.hl=hlText; ok('hasLowHigh',/Eng past/.test(hlText)&&/Eng baland/.test(hlText));
 // qatorni qayta bosish -> yopiladi
 await pg.click('.cx-row:first-child .cxhead');
 ok('detailClosed',(await pg.$eval('.cx-row:first-child .cx-detail',e=>e.hidden))===true);
 await pg.screenshot({path:SH+'v42-candles.png',fullPage:true});
 // boshqa tilda tugma matni tarjima qilinadi
 await pg.evaluate(()=>{location.hash='#/settings'}); await pg.waitForTimeout(300);
 await pg.click('#lang-seg button[lang=ru]'); await pg.waitForTimeout(200);
 await pg.evaluate(()=>{location.hash='#/charts'}); await pg.waitForSelector('#cx-analyze');
 await pg.click('#cx-analyze'); await pg.waitForSelector('.cxlist li');
 await pg.click('.cx-row:first-child .cxhead');
 await pg.waitForSelector('.cx-row:first-child .cxsvg');
 const ruPer=await pg.$eval('.cx-row:first-child .cx-per button[data-d="7"]',e=>e.textContent);
 R.ruPer=ruPer; ok('ruPeriodTranslated',/\d+\s*дней/.test(ruPer));
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})();
