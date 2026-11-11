const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[];
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>{const u=r.request().url(); if(/coingecko/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({bitcoin:{usd:97000},ethereum:{usd:3400},tether:{usd:1},tron:{usd:.25},solana:{usd:180}})}); return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-add'); await pg.waitForSelector('#tk-add');
 for(const k of ['USDT_BSC','USDC_ERC20','USDT_POLYGON','USDT_SOLANA','USDT_ARBITRUM']){await pg.selectOption('#tk-sel',k); await pg.click('#tk-add'); await pg.waitForTimeout(250)}
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(1500);
 R.structure=await pg.$$eval('#list > tr:not(.ngp-row)',e=>e.map(x=>x.classList.contains('ng')?'## '+x.querySelector('th').innerText.replace(/\s+/g,' '):'   '+(x.querySelector('.a-n')||{}).innerText.replace(/\s+/g,' ')));
 R.rowCount=await pg.$$eval('#list > tr:not(.ng):not(.ngp-row)',e=>e.length); R.itemCount=await pg.evaluate(()=>data.items.length);
 R.btnWorks=await (async()=>{const id=await pg.$eval('#list tr:not(.ng) button[data-act=addr]',b=>b.dataset.id); await pg.click('#list tr:not(.ng) button[data-act=addr]'); await pg.waitForTimeout(400); return (await pg.evaluate(()=>location.hash))+' / id '+id})();
 await pg.evaluate(()=>{location.hash='#/assets'}); await pg.waitForTimeout(300);
 await pg.screenshot({path:SH+'v18-assets.png',fullPage:true});
 await pg.evaluate(()=>{location.hash='#/send'}); await pg.waitForSelector('#pick:not([hidden])'); await pg.waitForTimeout(300);
 R.pickSend=await pg.$$eval('#pick-list > *',e=>e.map(x=>x.tagName+' '+x.innerText.replace(/\s+/g,' ').slice(0,50)));
 await pg.screenshot({path:SH+'v18-pick.png'});
 await pg.evaluate(()=>{location.hash='#/receive'}); await pg.waitForTimeout(300);
 R.pickRecvHeads=await pg.$$eval('#pick-list h2',e=>e.map(x=>x.innerText)); R.pickRecvBtns=await pg.$$eval('#pick-list button.pk',e=>e.length);
 await pg.click('#pick-list button.pk'); await pg.waitForTimeout(400); R.afterPick=await pg.evaluate(()=>location.hash);
 await pg.setViewportSize({width:1100,height:800}); await pg.evaluate(()=>{location.hash='#/assets'}); await pg.waitForTimeout(300); await pg.screenshot({path:SH+'v18-assets-wide.png'});
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
