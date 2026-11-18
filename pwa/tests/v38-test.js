const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
let PRICE=1.5; const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); if(/coingecko/.test(u)){const ids=(new URL(u).searchParams.get('ids')||'').split(','); const o={}; ids.forEach((id,i)=>o[id]={usd:id==='bitcoin'?60000.5:1+i*0.01,usd_24h_change:i%2?-1.5:2.25}); return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)})} return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-assets'); await pg.waitForSelector('#net-list li'); await pg.waitForTimeout(900);
 // 1) Aktivlar = faqat kriptolar ro'yxati
 const nets=await pg.$$eval('#net-list a',e=>e.map(a=>({h:a.getAttribute('href'),t:a.querySelector('.a-n').textContent,c:a.querySelector('.a-s').textContent})));
 R.nets=nets; ok('netList',nets.length>=4&&nets.every(n=>/^#\/net\/\w+$/.test(n.h)));
 ok('noOldUi',(await pg.$$('#net-chips,.ngh,#pg-assets table,#as-px')).length===0);
 ok('assetsHasNoTokenRows',(await pg.$$('#pg-assets .rowbtn')).length===0);
 await pg.screenshot({path:SH+'v38-assets.png'});
 // 2) Tarmoqni bosish -> alohida sahifa, faqat shu tarmoq tokenlari
 const eth=nets.find(n=>/Ethereum/.test(n.t)); await pg.click('#net-list a[href="'+eth.h+'"]'); await pg.waitForSelector('#pg-net:not([hidden])'); await pg.waitForSelector('#list li');
 R.hash=await pg.evaluate(()=>location.hash); ok('netHash',R.hash==='#/net/ETH');
 const syms=await pg.$$eval('#list .a-m',e=>e.map(x=>x.textContent)); const names=await pg.$$eval('#list .a-n',e=>e.map(x=>x.textContent)); R.names=names;
 ok('netRows',names.length>=2&&names.every(n=>/Ethereum|USDT|USDC|DAI|Tether|USD/i.test(n)));
 ok('title',(await pg.$eval('#ab-title',e=>e.textContent))==='Ethereum'&&(await pg.$eval('#back',e=>!e.hidden)));
 ok('assetsHidden',await pg.$eval('#pg-assets',e=>e.hidden));
 await pg.screenshot({path:SH+'v38-net.png'});
 // 3) Token qo'shish
 ok('netAddVisible',await pg.$eval('#net-add',e=>!e.hidden)); const n0=names.length;
 await pg.click('#net-add'); await pg.waitForSelector('#tk-sheet'); await pg.click('#sh-l button[data-k]'); await pg.waitForFunction(n=>document.querySelectorAll('#list li').length>n,n0,{timeout:8000}); ok('tokenAdded',true);
 // 4) Qator -> aktiv sahifasi, orqaga -> tarmoq sahifasi
 await pg.click('#list .rowbtn'); await pg.waitForSelector('#recv:not([hidden])'); ok('assetOpen',/#\/asset\//.test(await pg.evaluate(()=>location.hash)));
 await pg.click('#back'); await pg.waitForSelector('#pg-net:not([hidden])'); ok('backToNet',(await pg.evaluate(()=>location.hash))==='#/net/ETH');
 await pg.click('#back'); await pg.waitForSelector('#pg-assets:not([hidden])'); ok('backToAssets',true);
 // 5) noto'g'ri tarmoq -> Aktivlar; Aktivlar tabi tarmoq sahifasida faol
 await pg.evaluate(()=>{location.hash='#/net/ZZZ'}); await pg.waitForSelector('#pg-assets:not([hidden])'); ok('badNet',true);
 await pg.evaluate(()=>{location.hash='#/net/BTC'}); await pg.waitForSelector('#pg-net:not([hidden])'); ok('navActive',await pg.$eval('#nav-assets',e=>e.getAttribute('aria-current')==='page'));
 // 6) desktop
 await pg.setViewportSize({width:1440,height:900}); await pg.waitForTimeout(300); await pg.screenshot({path:SH+'v38-net-desktop.png'});
 await pg.evaluate(()=>{location.hash='#/assets'}); await pg.waitForTimeout(400); await pg.screenshot({path:SH+'v38-assets-desktop.png'});
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})();
