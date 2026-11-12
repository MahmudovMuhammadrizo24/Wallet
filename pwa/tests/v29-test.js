const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH=(require('os').tmpdir()+'/hamyon-shots/');
(async()=>{
 const W=+process.env.VW||390;
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:W,height:844},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage(); await ctx.addInitScript(()=>{ if(!localStorage.getItem('__nomock')){ window.__cleared=0; window.HamyonNative={avail:()=>'no',clear(){},clearPepper(){localStorage.setItem('__cleared',String((+localStorage.getItem('__cleared')||0)+1))},pepper(sb){const raw=atob(sb),k=localStorage.getItem('__sec')||'A5',o=new Uint8Array(32);for(let i=0;i<32;i++)o[i]=raw.charCodeAt(i%raw.length)^parseInt(k,16)^i;return btoa(String.fromCharCode(...o))}}}});
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
 const ph=words.join(' ');
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-set');
 await pg.click('#pin-set'); await dlg(ph); await dlg('48291537'); await dlg('48291537'); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes("o'rnatildi"),null,{timeout:30000});
 ok('v3WhenKeystorePresent',(await pg.evaluate(()=>localStorage.getItem('cw_pin'))).startsWith('v3.'));
 const unlock=async(pin,wait='.page:not([hidden])')=>{await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in',pin); await pg.click('#pin-go'); await pg.waitForSelector(wait,{timeout:40000})};
 await pg.click('#lock'); await unlock('48291537'); ok('v3Unlocks',true);
 // boshqa muhit (Keystore yo'q): blob ochilmaydi, urinish sanalmaydi, hamyon ochilmaydi
 await pg.click('#lock'); await pg.evaluate(()=>{localStorage.setItem('__nomock','1')}); await pg.reload(); await pg.waitForSelector('#pin-in');
 const f0=await pg.evaluate(()=>localStorage.getItem('cw_pinfail')); await pg.fill('#pin-in','48291537'); await pg.click('#pin-go'); await pg.waitForFunction(()=>/Android/.test(document.querySelector('#pin-msg').textContent),null,{timeout:30000});
 ok('noKeystoreCannotOpen',await pg.$('.page:not([hidden])')===null); ok('noKeystoreDoesNotBurnAttempts',(await pg.evaluate(()=>localStorage.getItem('cw_pinfail')))===f0);
 // brauzer muhitida PIN qayta o'rnatilsa v2
 await pg.evaluate(async(p)=>{await pinSeal(p,'48291537','pin')},ph); ok('browserFallsBackToV2',(await pg.evaluate(()=>localStorage.getItem('cw_pin'))).startsWith('v2.'));
 // keyin Keystore paydo bo'lsa: v2 -> v3 ga avtomatik yangilanadi
 await pg.evaluate(()=>{localStorage.removeItem('__nomock')}); await pg.reload(); await unlock('48291537'); ok('v2UpgradesToV3',(await pg.evaluate(()=>localStorage.getItem('cw_pin'))).startsWith('v3.'));
 // Keystore kaliti o'zgarsa (boshqa qurilma / kalit o'chgan): noto'g'ri PIN kabi rad etiladi
 await pg.click('#lock'); await pg.evaluate(()=>{localStorage.setItem('__sec','3C')}); await pg.reload(); await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in','48291537'); await pg.click('#pin-go'); await pg.waitForFunction(()=>/Qolgan/.test(document.querySelector('#pin-msg').textContent),null,{timeout:30000});
 ok('wrongPepperRejected',await pg.$('.page:not([hidden])')===null);
 await pg.evaluate(()=>{localStorage.setItem('__sec','A5')}); await pg.reload(); await unlock('48291537'); ok('restoredPepperUnlocks',true);
 // PIN o'chirilsa Keystore kaliti ham o'chadi
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-off'); const c0=+(await pg.evaluate(()=>localStorage.getItem('__cleared')))||0; await pg.click('#pin-off'); await pg.click('#dlg-ok'); await pg.waitForTimeout(400);
 ok('pinOffClearsPepper',(+(await pg.evaluate(()=>localStorage.getItem('__cleared')))||0)>c0);
 R.errs=errs; ok('noJsErrors',errs.length===0);
 console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad?1:0);
})().catch(e=>{console.log('FAIL',String(e.stack).slice(0,700));console.log(JSON.stringify(R,null,1));process.exit(1)});
