const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const dir=process.argv[2], PORT=+process.argv[3]; const R={};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(PORT);
const mk=async(b,opts={})=>{const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block',...opts}); const pg=await ctx.newPage(); await pg.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort()); return {ctx,pg}};
const create=async pg=>{await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForSelector('#t-create'); const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]); const t=Date.now(); await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000}); return {words,ms:Date.now()-t}};
(async()=>{
 const b=await chromium.launch();
 // 1) hajm
 const html=fs.readFileSync(dir+'/index.html'); R.bytes=html.length; R.gzip=zlib.gzipSync(html).length; R.brotli=zlib.brotliCompressSync(html).length;
 // 2) ishga tushish va yaratish vaqti (CPU 4x sekin: o'rtacha telefon)
 let {ctx,pg}=await mk(b); const cdp=await ctx.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const t0=Date.now(); await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForSelector('#t-create'); R.loadMs4x=Date.now()-t0;
 const nav=await pg.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)}}); R.nav4x=nav;
 const A=await create(pg); R.createMs4x=A.ms; R.heapMB=(await pg.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null));
 const state=await ctx.storageState(); await ctx.close();
 // 3) boshqa (haqiqiy) 12 so'z bilan kirishga urinish
 const B=await mk(b); const wB=(await create(B.pg)).words; await B.ctx.close();
 const C=await mk(b,{storageState:state}); await C.pg.goto(`http://localhost:${PORT}/index.html`); await C.pg.waitForSelector('#go');
 const ins=await C.pg.$$('#wb input'); for(let i=0;i<12;i++) await ins[i].fill(wB[i]); await C.pg.click('#go'); await C.pg.waitForTimeout(3500); R.wrongValidMnemonic=await C.pg.$eval('#msg',e=>e.textContent);
 R.stillLocked=await C.pg.$$eval('#go',e=>e.length)===1;
 // 4) buzilgan vault: localStorage tahrirlansa
 await C.pg.evaluate(()=>{const v=localStorage.getItem('cw_vault'); localStorage.setItem('cw_vault',v.slice(0,20)+(v[20]==='A'?'B':'A')+v.slice(21));}); await C.pg.reload(); await C.pg.waitForSelector('#go');
 const i2=await C.pg.$$('#wb input'); for(let i=0;i<12;i++) await i2[i].fill(A.words[i]); await C.pg.click('#go'); await C.pg.waitForTimeout(3500); R.corruptVault=await C.pg.$eval('#msg',e=>e.textContent);
 // 5) bo'sh/qisman so'zlar, ortiqcha bo'sh joy
 await C.pg.reload(); await C.pg.waitForSelector('#go'); await C.pg.click('#go'); await C.pg.waitForTimeout(300); R.emptyWords=await C.pg.$eval('#msg',e=>e.textContent);
 // 6) storage to'lgan bo'lsa (quota) hamyon yaratish
 R.consoleErrs=[]; await C.ctx.close();
 const D=await mk(b); await D.pg.addInitScript(()=>{const o=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k==='cw_vault') throw new DOMException('full','QuotaExceededError'); return o.apply(this,arguments)}});
 await D.pg.goto(`http://localhost:${PORT}/index.html`); await D.pg.waitForSelector('#t-create'); const wd=await D.pg.$$eval('#wb input',e=>e.map(x=>x.value)); await D.pg.click('#next'); await D.pg.waitForSelector('.vin');
 for(const p of await D.pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await D.pg.fill('#v'+p,wd[p]); await D.pg.click('#mk'); await D.pg.waitForTimeout(3500);
 R.quota={homeShown:await D.pg.$$eval('#pg-home:not([hidden])',e=>e.length),msg:await D.pg.$$eval('#msg',e=>e.map(x=>x.textContent)).catch(()=>null)};
 console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,300));console.log(JSON.stringify(R));process.exit(1)});
