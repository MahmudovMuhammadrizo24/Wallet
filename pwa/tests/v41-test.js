const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); if(/coingecko/.test(u)){const ids=(new URL(u).searchParams.get('ids')||'').split(','); const o={}; ids.forEach((id,i)=>o[id]={usd:id==='bitcoin'?60000.5:1+i*0.01,usd_24h_change:i%2?-1.5:2.25}); return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)})} return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000}); await pg.waitForTimeout(1200);
 const tips=await pg.$$eval('#pg-home .tipcard a',e=>e.map(a=>({h:a.getAttribute('href'),t:a.querySelector('b').textContent})));
 R.tips=tips; ok('twoTips',tips.length===2&&tips[1].h==='#/charts'&&tips[1].t==='Diagrammalar');
 await pg.evaluate(() => {
  const AMT = { BTC: 0.5, ETH: 3, USDT_ERC20: 1200, TRX: 5000, USDT_TRC20: 300, SOL: 20, TON: 400 };
  const PX = { BTC: 60000, ETH: 3000, USDT_ERC20: 1, TRX: 0.1, USDT_TRC20: 1, SOL: 150, TON: 5 };
  data.items.forEach(it => { balances[it.id] = AMT[it.coin] ?? 0; const id = cgOf(it); if (id) prices[id] = { usd: PX[it.coin] ?? 1, ch: it.coin === 'BTC' ? 2.5 : -1.2 }; });
 });
 await pg.click('a[href="#/charts"]'); await pg.waitForSelector('#cx-analyze');
 ok('hashCharts',(await pg.evaluate(()=>location.hash))==='#/charts');
 ok('emptyBeforeClick',(await pg.$eval('#cx-out',e=>e.textContent.trim()))==='');
 await pg.click('#cx-analyze'); await pg.waitForSelector('.cxlist li');
 const rows=await pg.$$eval('.cxlist li',e=>e.map(li=>({n:li.querySelector('.a-n').textContent,q:li.querySelector('.a-q').textContent,w:li.querySelector('.cxfill').style.width})));
 R.rows=rows; ok('rowsPresent',rows.length>=2);
 ok('sortedDesc',rows.every((r,i)=>i===0||parseFloat(rows[i-1].w)>=parseFloat(r.w)));
 ok('firstFull',rows[0].w==='100%'||rows[0].w==='100.00%');
 await pg.screenshot({path:SH+'v41-charts.png',fullPage:true});
 // orqaga -> home
 await pg.click('#back'); await pg.waitForSelector('#pg-home:not([hidden])'); ok('backHome',true);
 // boshqa tilda ham ishlaydi
 await pg.evaluate(()=>{location.hash='#/settings'}); await pg.waitForTimeout(300);
 await pg.click('#lang-seg button[lang=ru]'); await pg.waitForTimeout(200);
 await pg.evaluate(()=>{location.hash='#/charts'}); await pg.waitForSelector('#cx-analyze');
 const ruTitle=await pg.$eval('#cx-analyze',e=>e.textContent); R.ruBtn=ruTitle; ok('ruTranslated',ruTitle!=='Diagramma tahlili');
 await pg.click('#cx-analyze'); await pg.waitForSelector('.cxlist li');
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})();
