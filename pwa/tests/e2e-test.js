const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH=(require('os').tmpdir()+'/hamyon-shots/');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());

 const NAME='/'; const loc=async(k)=>pg.evaluate(k=>localStorage.getItem(k),k); const ids=()=>pg.evaluate(()=>[...document.querySelectorAll('body *[id]')].filter(e=>e.offsetParent).map(e=>e.id));
 const dlg=async(txt,okSel='#dlg-ok')=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',txt); await pg.click(okSel)};
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 // ===== 1. Kirish: yaratish
 ok('welcomeCreateSelected',await pg.$eval('#t-create',e=>e.getAttribute('aria-selected')==='true'||e.classList.contains('on')||e.getAttribute('aria-pressed')==='true'));
 let words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); ok('twelveWords',words.length===12&&words.every(w=>/^[a-z]+$/.test(w)));
 const first=words.join(' '); await pg.click('#regen'); await pg.waitForTimeout(150); const second=(await pg.$$eval('#wb input',e=>e.map(x=>x.value))).join(' '); ok('regenChanges',first!==second);
 await pg.click('text=24 so\'z'); await pg.waitForTimeout(200); ok('twentyFourWords',(await pg.$$eval('#wb input',e=>e.length))===24);
 await pg.click('text=12 so\'z'); await pg.waitForTimeout(200); words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); ok('backTo12',words.length===12);
 ok('wordsReadonlyOrSafe',await pg.$$eval('#wb input',e=>e.every(x=>x.autocomplete==='off'||x.readOnly)));
 // noto'g'ri tasdiq
 await pg.click('#next'); await pg.waitForSelector('.vin'); const pos=await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)));
 for(const p of pos) await pg.fill('#v'+p,'wrongword'); await pg.click('#mk'); await pg.waitForTimeout(500);
 ok('wrongVerifyBlocked',await pg.$('#pg-home:not([hidden])')===null&&(await pg.$eval('#msg',e=>e.textContent.trim().length))>0);
 ok('wrongVerifyNoVault',(await loc('cw_vault'))===null);
 for(const p of pos) await pg.fill('#v'+p,words[p]); await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 ok('vaultSaved',(await loc('cw_vault'))!==null);
 ok('noPlainSeedInStorage',await pg.evaluate(w=>{const all=JSON.stringify({...localStorage})+JSON.stringify({...sessionStorage});return !w.slice(0,3).every(x=>all.includes(x))},words));
 // ===== 2. Asosiy navigatsiya
 for(const [id,pgid] of [['#nav-assets','#pg-assets'],['#nav-add','#pg-add'],['#nav-set','#pg-set'],['#nav-wallet','#pg-home']]){ await pg.click(id); await pg.waitForTimeout(250); ok('nav'+id,await pg.$eval(pgid,e=>!e.hidden)&&await pg.$eval(id,e=>e.getAttribute('aria-current')==='page')); }
 const addr=await pg.evaluate(()=>data.items.filter(x=>x.kind==='addr').map(x=>x.address).join(',')); ok('addressesCreated',addr.split(',').length>=3&&addr.split(',').every(a=>a.length>20));
 // ===== 3. Qulflash -> so'zlar bilan qayta kirish
 await pg.click('#lock'); await pg.waitForSelector('#go'); ok('lockedShowsImport',await pg.$('#pg-home:not([hidden])')===null);
 ok('lockedNoAddressesInDom',await pg.evaluate(a=>!document.body.innerHTML.includes(a.split(',')[0]),addr));
 await pg.click('#t-import').catch(()=>{}); const ins=await pg.$$('#wb input'); for(let i=0;i<12;i++) await pg.fill('#wb input >> nth='+i,words[i]); await pg.click('#go'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 ok('relockedUnlocksWithWords',await pg.evaluate(a=>data.items.filter(x=>x.kind==='addr').map(x=>x.address).join(',')===a,addr));
 // ===== 4. PIN o'rnatish
 await pg.click('#nav-set'); await pg.waitForSelector('#pin-set'); ok('pinOffInitially',(await loc('cw_pin'))===null);
 await pg.click('#pin-set'); await dlg('wrong words here only'); await pg.waitForTimeout(400); ok('pinSetWrongWords',/noto'g'ri|mos kelmadi/.test(await pg.$eval('#pin-note',e=>e.textContent))&&(await loc('cw_pin'))===null);
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('123456'); await pg.waitForTimeout(400); ok('weakPinRejected',/oson/.test(await pg.$eval('#pin-note',e=>e.textContent))&&(await loc('cw_pin'))===null);
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('73915846'); await dlg('73915947'); await pg.waitForTimeout(400); ok('mismatchRejected',/bir xil emas/.test(await pg.$eval('#pin-note',e=>e.textContent))&&(await loc('cw_pin'))===null);
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('73915846'); await dlg('73915846'); await pg.waitForFunction(()=>/o'rnatildi/.test(document.querySelector('#pin-note').textContent),null,{timeout:30000}); ok('pinSet',(await loc('cw_pin'))!==null);
 // ===== 5. Qayta yuklash -> PIN ekrani
 await pg.reload(); await pg.waitForSelector('#pin-in'); ok('pinScreenAfterReload',await pg.$('#pg-home:not([hidden])')===null);
 await pg.screenshot({path:SH+'e2e-pin-screen.png'});
 ok('pinInputLabelled',await pg.$eval('#pin-in',e=>!!document.querySelector('label[for=pin-in]')&&e.type==='password'&&e.inputMode==='numeric'));
 await pg.fill('#pin-in','111111'); await pg.click('#pin-go'); await pg.waitForFunction(()=>document.querySelector('#pin-in').getAttribute('aria-invalid')==='true',null,{timeout:30000}); ok('wrongPinRejected',await pg.$('#pg-home:not([hidden])')===null&&/noto'g'ri/i.test(await pg.$eval('#pin-msg',e=>e.textContent)));
 ok('failCounterStored',(await loc('cw_pinfail'))==='1');
 await pg.fill('#pin-in','73915846'); await pg.press('#pin-in','Enter'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000}); ok('pinUnlocks',true);
 ok('failCounterReset',(await loc('cw_pinfail'))==='0');
 ok('dataSameAfterPin',await pg.evaluate(a=>data.items.filter(x=>x.kind==='addr').map(x=>x.address).join(',')===a,addr));
 // lock tugmasi -> PIN
 await pg.click('#lock'); await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in','73915846'); await pg.click('#pin-go'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000}); ok('lockButtonThenPin',true);
 // yaratilgan hamyonda holat saqlanadi: qo'lda aktiv qo'shish -> reload -> PIN -> hali bor
 await pg.evaluate(async()=>{data.items.push({id:'e2e1',kind:'manual',coin:'BTC',label:'E2E',amount:0.5});await save()});
 await pg.reload(); await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in','73915846'); await pg.click('#pin-go'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 ok('changesPersist',await pg.evaluate(()=>data.items.some(x=>x.id==='e2e1')));
 // ===== 6. PIN o'chirish
 await pg.click('#nav-set'); await pg.click('#pin-off'); await pg.click('#dlg-ok'); await pg.waitForTimeout(400); ok('pinOff',(await loc('cw_pin'))===null);
 // ===== 7. Import yangi qurilmada (toza kontekst)
 const ctx2=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const p2=await ctx2.newPage(); await p2.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 await p2.goto(`http://localhost:${port}/index.html`); await p2.waitForSelector('#t-import'); await p2.click('#t-import');
 await p2.fill('#wb input >> nth=0','abandon'); for(let i=1;i<12;i++) await p2.fill('#wb input >> nth='+i,'abandon'); await p2.click('#go'); await p2.waitForTimeout(800);
 ok('badChecksumImportRejected',await p2.$('#pg-home:not([hidden])')===null&&(await p2.$eval('#msg',e=>e.textContent.trim().length))>0);
 for(let i=0;i<12;i++) await p2.fill('#wb input >> nth='+i,words[i]); await p2.click('#go'); await p2.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 ok('importGivesSameAddresses',await p2.evaluate(a=>data.items.filter(x=>x.kind==='addr').map(x=>x.address).join(',')===a,addr));
 // ===== 8. Hamyonni o'chirish (wipe)
 await p2.click('#lock'); await p2.waitForSelector('#wipe'); await p2.click('#wipe'); await p2.waitForSelector('#dlg-ok'); await p2.click('#dlg-no'); ok('wipeCancelKeeps',(await p2.evaluate(()=>localStorage.getItem('cw_vault')))!==null);
 await p2.click('#wipe'); await p2.waitForSelector('#dlg-ok'); if(await p2.$('#dlg-in')) await p2.fill('#dlg-in','O\'CHIRISH'); await p2.click('#dlg-ok'); await p2.waitForTimeout(800);
 R.wipeStorage=await p2.evaluate(()=>Object.keys(localStorage));
 ok('wipeClearsVault',!(R.wipeStorage.includes('cw_vault')));
 R.errs=errs; console.log(JSON.stringify(R)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})().catch(e=>{console.log('FAIL',String(e.stack).slice(0,700)); console.log(JSON.stringify(R)); process.exit(1)});
