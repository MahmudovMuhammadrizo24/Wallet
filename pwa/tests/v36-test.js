const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
let PRICE=1.5; const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
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
 await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(600);
 // 1) balans count-up: oraliq qiymat, keyin aniq yakun
 const ct=await pg.evaluate(async()=>{const el=document.getElementById('total');const a=el.textContent; animTotal(el,1234.5); await new Promise(r=>setTimeout(r,200)); const mid=el.textContent; await new Promise(r=>setTimeout(r,800)); const end=el.textContent; animTotal(el,1234.5); const same=el.textContent; return {a,mid,end,same,want:fmtUsd(1234.5)}});
 R.count=ct; ok('countMid',ct.mid!==ct.end&&ct.mid!==ct.a); ok('countEnd',ct.end===ct.want&&ct.same===ct.want);
 // 2) CSS animatsiyalar
 const an=await pg.evaluate(()=>{const g=(tag,cls,attrs)=>{const e=document.createElement(tag);if(cls)e.className=cls;for(const k in (attrs||{}))e.setAttribute(k,attrs[k]);document.body.appendChild(e);const n=getComputedStyle(e).animationName;e.remove();return n};return {toast:g('div','toast'),modal:g('div','modal'),bg:g('div','modal-bg'),sheet:g('div','sheet-bg'),shake:g('input','',{'aria-invalid':'true'}),still:g('input','')}});
 R.an=an; ok('toastAnim',an.toast==='toastIn'); ok('modalAnim',an.modal==='popIn'&&an.bg==='fadeIn'&&an.sheet==='fadeIn'); ok('shakeAnim',an.shake==='shake'&&an.still==='none');
 // 3) Yangilash tugmasi aylanadi
 let hold=true; await pg.route(u=>/coingecko/.test(u.href),async r=>{ if(hold){await new Promise(x=>setTimeout(x,1200));} const ids=(new URL(r.request().url()).searchParams.get('ids')||'').split(','); const o={}; for(const i of ids) o[i]={usd:PRICE,usd_24h_change:1.5}; return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)}); });
 await pg.evaluate(()=>{window.__x=1}); 
 await pg.click('#refresh'); await pg.waitForTimeout(250);
 R.spinOn=await pg.$eval('#refresh',e=>e.classList.contains('spin')); ok('spinOn',R.spinOn===true);
 await pg.waitForFunction(()=>!document.getElementById('refresh').classList.contains('spin'),{timeout:15000}); ok('spinOff',true);
 // 4) Narxlar: stagger va yonish
 hold=false; await pg.evaluate(()=>{location.hash='#/prices'}); await pg.waitForFunction(()=>document.querySelectorAll('#px-list li').length>3,{timeout:8000});
 R.stg=await pg.$eval('#px-list',e=>({cls:e.className,i:[...e.querySelectorAll('li')].slice(0,3).map(l=>l.getAttribute('style'))})); ok('pxStagger',/stg/.test(R.stg.cls)&&R.stg.i[1]==='--i:1');
 await pg.waitForTimeout(1000); ok('pxStaggerEnds',!(await pg.$eval('#px-list',e=>e.classList.contains('stg'))));
 PRICE=3.5; await pg.click('#px-refresh'); await pg.waitForFunction(()=>document.querySelectorAll('#px-list li.fl-up').length>0,{timeout:8000}); ok('pxFlashUp',true);
 PRICE=1.0; await pg.click('#px-refresh'); await pg.waitForFunction(()=>document.querySelectorAll('#px-list li.fl-down').length>0,{timeout:8000}); ok('pxFlashDown',true);
 // qidiruvda yonmasligi
 await pg.waitForTimeout(1300); await pg.fill('#px-q','btc'); await pg.waitForTimeout(200); ok('noFlashOnSearch',(await pg.$$('#px-list li.fl-up,#px-list li.fl-down')).length===0);
 // 5) prefers-reduced-motion: count-up darhol
 await pg.emulateMedia({reducedMotion:'reduce'}); await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(400);
 const rm=await pg.evaluate(()=>{const el=document.getElementById('total');animTotal(el,555.5);return el.textContent===fmtUsd(555.5)}); ok('reducedMotionInstant',rm===true);
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})();
