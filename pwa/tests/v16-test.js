const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={};
// Android ko'prigining JS taqlidi: Keystore kaliti sahifadan tashqarida (closure) turadi, har ishlatishda "tasdiq" so'raladi
const FAKE=`(()=>{ let key=null, mode='ok', calls=[]; const b=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)), e=u=>btoa(String.fromCharCode(...u));
 window.__fake={set:m=>{mode=m}, calls, hasKey:()=>!!key};
 const reply=(id,ok,p)=>setTimeout(()=>window.__hn(id,ok,p),10);
 window.HamyonNative={
  avail(){ return mode==='unavail'?'no':'yes' },
  seal(id,plain){ calls.push('seal'); (async()=>{ if(mode==='unavail') return reply(id,false,'UNAVAILABLE'); if(mode==='cancel') return reply(id,false,'CANCELED');
     key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']); const iv=crypto.getRandomValues(new Uint8Array(12)); const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,b(plain)));
     reply(id,true,JSON.stringify({iv:e(iv),ct:e(ct)})); })() },
  open(id,iv,ct){ calls.push('open'); (async()=>{ if(mode==='cancel') return reply(id,false,'CANCELED'); if(!key) return reply(id,false,'INVALID');
     try{ const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:b(iv)},key,b(ct))); reply(id,true,e(pt)) }catch(x){ reply(id,false,'INVALID') } })() },
  clear(){ calls.push('clear'); key=null }
 };})();`;
(async()=>{
 const br=await chromium.launch(); const ctx=await br.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'}); await ctx.addInitScript(FAKE); const pg=await ctx.newPage(); const errs=[];
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text())});
 await pg.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create'); await pg.waitForTimeout(800);
 R.swRegistered=await pg.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length);
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-card'); await pg.waitForFunction(()=>document.querySelector('#bio-state').textContent.length>0);
 const dlg=async v=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(150)};
 R.avail={state:await pg.$eval('#bio-state',e=>e.textContent),disabled:await pg.$eval('#bio-set',e=>e.disabled)};
 // bekor qilish
 await pg.evaluate(()=>__fake.set('cancel')); await pg.click('#bio-set'); await dlg(words.join(' ')); await pg.waitForFunction(()=>/Bekor/.test(document.querySelector('#bio-note').textContent),null,{timeout:15000}); R.cancel={note:await pg.$eval('#bio-note',e=>e.textContent),stored:await pg.evaluate(()=>localStorage.getItem('cw_bio'))};
 // yoqish
 await pg.evaluate(()=>__fake.set('ok')); await pg.click('#bio-set'); await dlg(words.join(' ')); await pg.waitForFunction(()=>/yoqildi/.test(document.querySelector('#bio-note').textContent),null,{timeout:15000});
 R.enable=await pg.evaluate(()=>{const o=JSON.parse(localStorage.getItem('cw_bio'));return{keys:Object.keys(o).sort(),n:o.n,v:o.v}});
 R.noPlain=await pg.evaluate(()=>!localStorage.getItem('cw_bio').includes('abandon'));
 // qulf -> Face ID bilan ochish
 await pg.click('#lock'); await pg.waitForSelector('#bio-go'); await pg.click('#bio-go'); await pg.waitForSelector('.page:not([hidden])',{timeout:20000}); R.unlock=true;
 // bekor qilinsa qulf qoladi
 await pg.click('#lock'); await pg.waitForSelector('#bio-go'); await pg.evaluate(()=>__fake.set('cancel')); await pg.click('#bio-go'); await pg.waitForFunction(()=>document.querySelector('#bio-msg').textContent.length>0,null,{timeout:15000}); R.cancelUnlock={msg:await pg.$eval('#bio-msg',e=>e.textContent),locked:(await pg.$$('#bio-go')).length===1};
 // kalit yo'qolgan (yangi barmoq izi qo'shilgan): eskirgan va o'chiriladi
 await pg.evaluate(()=>{__fake.set('ok'); window.HamyonNative.clear()}); await pg.click('#bio-go'); await pg.waitForFunction(()=>/eskirgan/.test(document.querySelector('#bio-msg').textContent),null,{timeout:15000}); R.invalidated={msg:await pg.$eval('#bio-msg',e=>e.textContent),wiped:await pg.evaluate(()=>localStorage.getItem('cw_bio')===null)};
 // so'zlar bilan kirish, Face ID ni o'chirish native kalitni ham o'chiradi
 const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000});
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.click('#bio-set'); await dlg(words.join(' ')); await pg.waitForFunction(()=>/yoqildi/.test(document.querySelector('#bio-note').textContent),null,{timeout:15000});
 await pg.click('#bio-off'); await pg.waitForSelector('#dlg-ok'); await pg.click('#dlg-ok'); await pg.waitForTimeout(300); R.off={stored:await pg.evaluate(()=>localStorage.getItem('cw_bio')),nativeKey:await pg.evaluate(()=>__fake.hasKey())};
 // qo'llab-quvvatlanmasa
 await pg.evaluate(()=>__fake.set('unavail')); await pg.reload(); await pg.waitForSelector('#go').catch(()=>{});
 R.calls=await pg.evaluate(()=>__fake.calls.join(','));
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await br.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,500));console.log(JSON.stringify(R,null,1));process.exit(1)});
