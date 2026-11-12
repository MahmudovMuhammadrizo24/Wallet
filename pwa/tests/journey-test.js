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
 // ================= 1-BOSQICH: KIRISH =================
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 R.s1_entry=await audit('entry'); await shot('1-welcome');
 ok('s1_hasCreateImportTabs',await pg.$('#t-create')!==null&&await pg.$('#t-import')!==null);
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); ok('s1_12words',words.length===12&&words.every(w=>/^[a-z]+$/.test(w)));
 ok('s1_wordsReadonlyOrLabeled',await pg.$$eval('#wb input',e=>e.every(x=>x.readOnly||x.getAttribute('aria-label')||x.labels.length)));
 ok('s1_warnVisible',/xavfsiz|yozib|ko'rsatmang|saqlang|yo'qolsa/i.test(await pg.evaluate(()=>document.body.innerText)));
 // noto'g'ri tasdiq
 await pg.click('#next'); await pg.waitForSelector('.vin'); await shot('1-verify');
 const pos=await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)));
 for(const p of pos) await pg.fill('#v'+p,'xxxx'); await pg.click('#mk'); await pg.waitForTimeout(400);
 ok('s1_wrongVerifyBlocked',await pg.$('#pg-home:not([hidden])')===null); R.s1_wrongMsg=await pg.$eval('#msg',e=>e.textContent);
 ok('s1_wrongVerifyMsg',R.s1_wrongMsg.length>3);
 for(const p of pos) await pg.fill('#v'+p,words[p]); await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 ok('s1_created',true); await shot('1-home');
 const vault=await pg.evaluate(()=>localStorage.getItem('cw_vault')); ok('s1_vaultEncrypted',!!vault&&!/abandon|\b[a-z]{4,8} [a-z]{4,8} [a-z]{4,8}\b/.test(vault)&&!words.some(w=>w.length>4&&vault.includes(w)));
 // import xatolari (bo'sh sahifaga qaytib)
 await pg.click('#lock'); await pg.waitForSelector('#go'); await pg.click('#t-import').catch(()=>{});
 const fill=async arr=>{const ins=await pg.$$('#wb input'); for(let i=0;i<ins.length;i++) await ins[i].fill(arr[i]||'')};
 await fill(words.slice(0,11)); await pg.click('#go'); await pg.waitForTimeout(500); R.s1_imp11=await pg.$eval('#msg',e=>e.textContent); ok('s1_import11rejected',R.s1_imp11.length>3&&await pg.$('.page:not([hidden])')===null);
 const badw=words.slice(); badw[3]='zzzzzz'; await fill(badw); await pg.click('#go'); await pg.waitForTimeout(500); R.s1_impBadWord=await pg.$eval('#msg',e=>e.textContent); ok('s1_importBadWordRejected',R.s1_impBadWord.length>3&&await pg.$('.page:not([hidden])')===null);
 const sw=words.slice(); [sw[0],sw[1]]=[sw[1],sw[0]]; await fill(sw); await pg.click('#go'); await pg.waitForTimeout(800);
 R.s1_swap=await pg.$eval('#msg',e=>e.textContent); const swapped=await pg.$('.page:not([hidden])')!==null; ok('s1_swapNoCrash',true);
 if(swapped){await pg.click('#lock'); await pg.waitForSelector('#go');}
 R.s1_swapOpenedOtherWallet=swapped;
 // to'g'ri so'zlar
 await fill(words); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); ok('s1_importWorks',true);
 // ================= 2-BOSQICH: ICHKARI =================
 const dlg=async v=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(150)};
 R.s2_pages={};
 const routes=[['home','#/'],['assets','#/assets'],['add','#/add'],['settings','#/settings'],['security','#/security'],['wallets','#/wallets'],['contacts','#/contacts'],['backup','#/backup'],['mining','#/mining']];
 for(const [n,h] of routes){ await pg.evaluate(h=>{location.hash=h},h); await pg.waitForTimeout(500); const a=await audit(n); R.s2_pages[n]=a; await shot('2-'+n); }
 ok('s2_noHorizontalScroll',Object.values(R.s2_pages).every(a=>!a.hscroll));
 ok('s2_everyControlNamed',Object.values(R.s2_pages).every(a=>a.noname.length===0));
 R.s2_smallTargets=Object.fromEntries(Object.entries(R.s2_pages).filter(([k,a])=>a.small.length).map(([k,a])=>[k,a.small])); 
 // tab-bar navigatsiya
 for(const [id,sel] of [['nav-assets','#pg-assets'],['nav-add','#pg-add'],['nav-set','#pg-settings'],['nav-wallet','#pg-home']]){ await pg.click('#'+id); await pg.waitForSelector(sel+':not([hidden])'); }
 ok('s2_tabbarWorks',true);
 // aktiv: qo'lda qo'shish -> tahrirlash -> o'chirish
 await pg.click('#nav-add'); await pg.waitForSelector('#pg-add:not([hidden])');
 R.s2_kindOpts=await pg.$$eval('#kind option',e=>e.map(o=>o.value)); await pg.selectOption('#kind',R.s2_kindOpts[R.s2_kindOpts.length>1?0:0]);
 await pg.fill('#address','not-an-address').catch(()=>{}); await pg.click('#add button[type=submit]'); await pg.waitForTimeout(400); R.s2_addBad=await pg.$eval('#pg-add #msg',e=>e.textContent).catch(()=>''); ok('s2_addBadAddressRejected',R.s2_addBad.length>3);
 // yuborish formasi tekshiruvi
 await pg.evaluate(()=>{const it=data.items.find(x=>x.coin==='ETH'); location.hash='#/asset/'+it.id+'/send'}); await pg.waitForSelector('#sd-form'); await shot('2-send');
 await pg.fill('#sd-to','0x123'); await pg.fill('#sd-amt','1'); await pg.click('#sd-next'); await pg.waitForTimeout(500); R.s2_sendBadAddr=await pg.$eval('#sd-msg',e=>e.textContent); ok('s2_sendBadAddrRejected',R.s2_sendBadAddr.length>3&&await pg.$('#sd-review:not([hidden])')===null);
 await pg.fill('#sd-to','0x52908400098527886E0F7030069857D2E4169EE7'); await pg.fill('#sd-amt','999999'); await pg.click('#sd-next'); await pg.waitForTimeout(500); R.s2_sendTooMuch=await pg.$eval('#sd-msg',e=>e.textContent); ok('s2_sendTooMuchRejected',R.s2_sendTooMuch.length>3&&await pg.$('#sd-review:not([hidden])')===null);
 await pg.fill('#sd-amt','abc'); await pg.click('#sd-next'); await pg.waitForTimeout(300); ok('s2_sendNonNumberRejected',(await pg.$eval('#sd-msg',e=>e.textContent)).length>3);
 // qabul qilish
 await pg.evaluate(()=>{const it=data.items.find(x=>x.coin==='ETH'); location.hash='#/asset/'+it.id+'/recv'}); await pg.waitForSelector('#recv-addr'); ok('s2_recvAddrChecksum',/^0x[0-9a-fA-F]{40}$/.test((await pg.$eval('#recv-addr',e=>e.textContent)).trim())); await shot('2-recv');
 // PIN: o'rnatish -> qulflash -> xato -> to'g'ri
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-set'); await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('482915'); await dlg('482915');
 await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes("o'rnatildi"),null,{timeout:20000});
 await pg.click('#lock'); await pg.waitForSelector('#pin-in'); await shot('2-pinlock'); R.s2_lockAudit=await audit('pin');
 await pg.fill('#pin-in','111222'); await pg.click('#pin-go'); await pg.waitForFunction(()=>document.querySelector('#pin-msg').textContent.includes('Qolgan'),null,{timeout:15000});
 await pg.fill('#pin-in','482915'); await pg.click('#pin-go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); ok('s2_pinUnlock',true);
 // sahifani yangilash -> qayta qulflanadi (sessiya saqlanmaydi)
 await pg.reload(); await pg.waitForSelector('#pin-in,#go,#t-create',{timeout:15000}); ok('s2_reloadRelocks',await pg.$('.page:not([hidden])')===null);
 // mavzu: qorong'i rejimda ham gorizontal scroll yo'q va matn kontrasti
 await pg.fill('#pin-in','482915').catch(()=>{}); await pg.click('#pin-go').catch(()=>{}); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}).catch(()=>{});
 await pg.emulateMedia({colorScheme:'dark'}); await pg.waitForTimeout(300); await pg.evaluate(()=>{location.hash='#/'}); await pg.waitForTimeout(400); await shot('2-dark-home'); R.s2_dark=await audit('dark'); ok('s2_darkNoHscroll',!R.s2_dark.hscroll);
 ok('s2_noSmallTargets',Object.keys(R.s2_smallTargets).length===0&&R.s1_entry.small.length===0&&R.s2_lockAudit.small.length===0);
 R.errs=errs; ok('noJsErrors',errs.length===0);
 console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad?1:0);
})().catch(e=>{console.log('FAIL',String(e.stack).slice(0,700));console.log(JSON.stringify(R,null,1));process.exit(1)});
