const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:800,height:1000},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(1200);
 const pickers=async()=>{const nets=await pg.$$eval('#list .ngb',e=>e.map(b=>b.dataset.net));const o={};for(const n of nets){await pg.click('#list .ngb[data-net='+n+']');await pg.waitForSelector('#tk-sheet');o[n]=await pg.$$eval('#sh-l button[data-k]',e=>e.map(b=>b.dataset.k));await pg.keyboard.press('Escape');await pg.waitForSelector('#tk-sheet',{state:'detached'})}return o};
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)}); if(/coingecko/.test(u)){ if(globalThis.PXFAIL) return r.fulfill({status:500,body:'x'}); const ids=(new URL(u).searchParams.get('ids')||'').split(','); const o={}; ids.forEach((id,i)=>o[id]={usd:id==='bitcoin'?60000.5:id==='tether'?1:(i+1)*0.0123,usd_24h_change:i%2?-1.5:2.25}); return J(o); } return r.abort()});
 await pg.waitForTimeout(600);
 // planshet: ixcham yon menyu
 await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(700);
 const t=await pg.evaluate(()=>{const n=document.querySelector('.nav').getBoundingClientRect();const w=document.querySelector('#app').getBoundingClientRect();const vis=[...document.querySelectorAll('.nav button')].filter(b=>b.getBoundingClientRect().width>0);return {nx:Math.round(n.x),nw:Math.round(n.width),nh:Math.round(n.height),wx:Math.round(w.x),vis:vis.length,small:vis.filter(b=>b.getBoundingClientRect().height<43.5||b.getBoundingClientRect().width<43.5).length,names:vis.map(b=>b.textContent.trim()),sw:document.documentElement.scrollWidth}});
 R.tablet=t; ok('tabNav',t.nx===0&&t.nw===72&&t.nh>=990); ok('tabItems',t.vis===7&&t.small===0); ok('tabNames',t.names.includes('Narxlar')&&t.names.includes('Sozlamalar')); ok('tabContent',t.wx>=72&&t.sw<=800);
 await pg.screenshot({path:SH+'v35-tablet.png'});
 await pg.click('#nav-mine'); await pg.waitForTimeout(400); ok('tabMiningCur',await pg.$eval('#nav-mine',e=>e.getAttribute('aria-current')==='page'));
 // Narxlar: skeleton, xato, qayta urinish
 let mode='slow';
 await pg.route(u=>/coingecko/.test(u.href),async r=>{ if(mode==='slow'){await new Promise(x=>setTimeout(x,1500)); return r.abort();} if(mode==='err') return r.abort(); const ids=(new URL(r.request().url()).searchParams.get('ids')||'').split(','); const o={}; for(const i of ids) o[i]={usd:1.5,usd_24h_change:2.1}; return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)}); });
 await pg.evaluate(()=>{location.hash='#/prices'}); await pg.waitForTimeout(500);
 R.skel=await pg.$$eval('#px-list li.sk',e=>e.length); ok('pxSkeleton',R.skel===8);
 await pg.waitForSelector('#px-retry',{timeout:8000}); ok('pxRetryShown',true);
 mode='ok'; await pg.click('#px-retry'); await pg.waitForFunction(()=>document.querySelectorAll('#px-list li:not(.sk):not(.full)').length>3,{timeout:8000}); ok('pxRecovered',true);
 ok('pxRetryGone',!(await pg.$('#px-retry')));
 // markaziy sheet (>=768px): qator menyusi
 await pg.evaluate(()=>{location.hash='#/assets'}); await pg.waitForTimeout(700);
 const rb=await pg.$('#list .rowbtn, #list [data-row]'); 
 const css=await pg.evaluate(()=>{const s=document.createElement('div');s.className='sheet-bg';document.body.appendChild(s);const c=getComputedStyle(s).alignItems;s.remove();return c}); ok('sheetCentered',css==='center');
 await pg.setViewportSize({width:390,height:844}); await pg.waitForTimeout(300);
 const css2=await pg.evaluate(()=>{const s=document.createElement('div');s.className='sheet-bg';document.body.appendChild(s);const c=getComputedStyle(s).alignItems;s.remove();const n=document.querySelector('.nav').getBoundingClientRect();return {c,y:Math.round(n.y),w:Math.round(n.width)}}); ok('mobileSheetBottom',css2.c==='flex-end'); ok('mobileNavBottom',css2.y>700&&css2.w===390);
 ok('okMarkCss',await pg.evaluate(()=>[...document.styleSheets].some(s=>[...s.cssRules].some(r=>r.name==='okdraw'))));
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})();
