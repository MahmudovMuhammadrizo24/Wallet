const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const W=+process.env.VW||390;
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:W,height:844},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 const audit=async tag=>pg.evaluate(()=>{const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]')};
   const small=[...document.querySelectorAll('button,a[href],select,input:not([type=hidden]):not([type=file]),[role=tab]')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.height<43.5||r.width<43.5}).map(e=>(e.id||e.className||e.tagName)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
   const noname=[...document.querySelectorAll('button,a[href],input:not([type=hidden]),select')].filter(vis).filter(e=>!(e.getAttribute('aria-label')||e.innerText.trim()||e.labels&&e.labels.length||e.placeholder||e.title)).map(e=>e.id||e.className||e.tagName);
   return {hscroll:document.documentElement.scrollWidth>innerWidth+1,small,noname}});
 const shot=n=>pg.screenshot({path:SH+'j-'+n+'.png'});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 const pos=await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1))); for(const p of pos) await pg.fill('#v'+p,words[p]); await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 const dlg=async v=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(150)};
 // CSP wasm ruxsati
 ok('cspWasmOnly',await pg.evaluate(()=>{const c=document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;return /script-src 'wasm-unsafe-eval' 'sha256/.test(c)&&!/unsafe-eval'(?!.*wasm)/.test(c.replace("'wasm-unsafe-eval'",''))&&!/script-src[^;]*'unsafe-inline'/.test(c)}));
 // Argon2id ma'lum javob (hash-wasm npm'i bilan solishtirilgan)
 const kat=await pg.evaluate(async()=>Array.from(await hashwasm.argon2id({password:'pin:123456',salt:new Uint8Array(16).fill(7),parallelism:1,iterations:3,memorySize:65536,hashLength:32,outputType:'binary'})).map(x=>x.toString(16).padStart(2,'0')).join(''));
 const ref=(()=>{try{return require('hash-wasm')}catch(e){return require('/tmp/hw/node_modules/hash-wasm')}})(); const exp=Buffer.from(await ref.argon2id({password:'pin:123456',salt:new Uint8Array(16).fill(7),parallelism:1,iterations:3,memorySize:65536,hashLength:32,outputType:'binary'})).toString('hex');
 R.kat={got:kat,exp}; ok('argon2MatchesReference',kat===exp&&kat.length===64);
 // PIN o'rnatish -> yangi format
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-set'); const t0=Date.now();
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291537'); await dlg('48291537');
 await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes("o'rnatildi"),null,{timeout:30000}); R.setMs=Date.now()-t0;
 const st=await pg.evaluate(()=>localStorage.getItem('cw_pin')); ok('pinFormatV2',st.startsWith('v2.')); ok('pinNoPlaintext',!words.some(w=>w.length>4&&st.includes(w)));
 // eski (PBKDF2) formatga tushirib, kirish -> avtomatik yangilanadi
 await pg.evaluate(async(w)=>{const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await deriveKey('pin:48291537',salt),enc.encode(w)));const o=new Uint8Array(28+ct.length);o.set(salt);o.set(iv,16);o.set(ct,28);localStorage.setItem('cw_pin',b64(o));localStorage.setItem('cw_pinfail','2')},words.join(' '));
 ok('legacyHasNoPrefix',!(await pg.evaluate(()=>localStorage.getItem('cw_pin'))).startsWith('v2.'));
 await pg.reload(); await pg.waitForSelector('#pin-in'); 
 await pg.fill('#pin-in','111222'); await pg.click('#pin-go'); await pg.waitForFunction(()=>document.querySelector('#pin-msg').textContent.includes('Qolgan'),null,{timeout:30000}); R.legacyWrong=await pg.$eval('#pin-msg',e=>e.textContent); ok('legacyWrongCounts',/Qolgan urinish: 2/.test(R.legacyWrong));
 const t1=Date.now(); await pg.fill('#pin-in','48291537'); await pg.click('#pin-go'); await pg.waitForSelector('.page:not([hidden])',{timeout:40000}); R.unlockMs=Date.now()-t1; ok('legacyUnlocks',true);
 ok('legacyUpgraded',(await pg.evaluate(()=>localStorage.getItem('cw_pin'))).startsWith('v2.')); 
 // yangilangandan keyin ham ishlaydi, xato PIN rad etiladi
 await pg.click('#lock'); await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in','48291537'); await pg.click('#pin-go'); await pg.waitForSelector('.page:not([hidden])',{timeout:40000}); ok('v2Unlocks',true);
 await pg.click('#lock'); await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in','999111'); await pg.click('#pin-go'); await pg.waitForFunction(()=>/Qolgan/.test(document.querySelector('#pin-msg').textContent),null,{timeout:30000}); ok('v2WrongRejected',true);
 // buzilgan blob: qulf ochilmaydi, JS xatosiz
 await pg.evaluate(()=>{const s=localStorage.getItem('cw_pin');localStorage.setItem('cw_pin',s.slice(0,-6)+'AAAAAA')}); await pg.fill('#pin-in','48291537'); await pg.click('#pin-go'); await pg.waitForFunction(()=>/Qolgan|noto'g'ri/.test(document.querySelector('#pin-msg').textContent),null,{timeout:30000}); ok('tamperedRejected',await pg.$('.page:not([hidden])')===null);
 ok('timingReasonable',R.unlockMs<15000);
 R.errs=errs; ok('noJsErrors',errs.length===0);
 console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad?1:0);
})().catch(e=>{console.log('FAIL',String(e.stack).slice(0,700));console.log(JSON.stringify(R,null,1));process.exit(1)});
