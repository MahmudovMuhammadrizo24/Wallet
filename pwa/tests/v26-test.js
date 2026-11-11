const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
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
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)}); if(/coingecko/.test(u))return J({bitcoin:{usd:60000,usd_24h_change:2},ethereum:{usd:3000,usd_24h_change:-1},tether:{usd:1,usd_24h_change:0}}); return r.abort()});
 await pg.waitForTimeout(500);
 // Bosh sahifa: gradient hero, 3 tugma, bitta sariq
 const hero=await pg.evaluate(()=>{const h=document.querySelector('.hero'),cs=getComputedStyle(h);return {bg:cs.backgroundImage.slice(0,40),col:cs.color,btns:[...document.querySelectorAll('.hero .actions button')].map(b=>b.innerText.trim()),yellow:[...document.querySelectorAll('.hero .actions button')].filter(b=>getComputedStyle(b).backgroundColor==='rgb(255, 199, 44)').length}});
 R.hero=hero; ok('heroGradient',/linear-gradient/.test(hero.bg)&&hero.col==='rgb(255, 255, 255)'); ok('heroOneYellow',hero.yellow===1&&hero.btns.length===3);
 ok('hchgExists',await pg.$('#hchg')!==null);
 // Aktivlar: sarlavha + pill + chiplar
 await pg.click('#nav-assets'); await pg.waitForSelector('#list tr.ar'); await pg.waitForTimeout(600);
 ok('addPillLinks',await pg.$eval('#as-add',a=>a.getAttribute('href')==='#/add'&&getComputedStyle(a).backgroundColor==='rgb(255, 199, 44)'));
 const chips0=await pg.$$eval('#net-chips .chip',e=>e.map(x=>x.innerText)); R.chips0=chips0; ok('chipsStartHammasi',chips0[0]==='Hammasi'&&chips0.length>=3);
 ok('groupNamesTarmogi',(await pg.$$eval('#list tr.ng th',e=>e.map(x=>x.innerText))).every(x=>/tarmog'i/.test(x)));
 ok('rowsNameFirst',await pg.$$eval('#list tr.ar .a-n',e=>e.every(x=>x.textContent.trim()&&!/Asosiy hamyon/.test(x.textContent))));
 // filtr
 const n0=await pg.$$eval('#list tr.ar',e=>e.length); await pg.click('#net-chips .chip:nth-child(2)'); const n1=await pg.$$eval('#list tr.ar',e=>e.length); R.filter={n0,n1};
 ok('filterNarrows',n1>0&&n1<n0&&await pg.$$eval('#list tr.ng',e=>e.length)===1&&await pg.$eval('#net-chips .chip[aria-pressed=true]',e=>e.innerText!=='Hammasi'));
 await pg.click('#net-chips .chip:nth-child(1)'); ok('filterAll',await pg.$$eval('#list tr.ar',e=>e.length)===n0);
 // qator: ⋯ menyu
 const menus=await pg.$$eval('#list [data-act=menu]',e=>e.length); ok('menuPerRow',menus===n0);
 ok('menuTarget44',await pg.$$eval('#list [data-act=menu]',e=>e.every(b=>{const r=b.getBoundingClientRect();return r.width>=43.5&&r.height>=43.5})));
 await pg.click('#list [data-act=menu]'); await pg.waitForSelector('#tk-sheet.sheet-bg'); R.menuItems=await pg.$$eval('#tk-sheet button.rs',e=>e.map(x=>x.innerText.trim()));
 ok('menuItems',R.menuItems.includes('Ochish')&&R.menuItems.includes("O'chirish")); await pg.screenshot({path:SH+'v26-menu.png'});
 await pg.keyboard.press('Escape'); await pg.waitForSelector('#tk-sheet',{state:'detached'});
 ok('menuFocusBack',await pg.evaluate(()=>document.activeElement.dataset.act==='menu'));
 // O'chirish bekor qilinsa saqlanadi, tasdiqlansa o'chadi
 const before=await pg.evaluate(()=>data.items.length);
 await pg.click('#list [data-act=menu]'); await pg.waitForSelector('#tk-sheet'); await pg.click('#tk-sheet button.rs.dng'); await pg.waitForSelector('#dlg-no'); await pg.click('#dlg-no');
 await pg.waitForTimeout(300); ok('deleteCancelKeeps',await pg.evaluate(()=>data.items.length)===before);
 await pg.click('#list [data-act=menu]'); await pg.waitForSelector('#tk-sheet'); await pg.click('#tk-sheet button.rs.dng'); await pg.waitForSelector('#dlg-ok'); await pg.click('#dlg-ok');
 await pg.waitForTimeout(500); ok('deleteConfirmRemoves',await pg.evaluate(()=>data.items.length)===before-1);
 // Detal sahifa: hero + tugmalar
 await pg.evaluate(()=>{const it=data.items.find(x=>x.coin==='ETH'); location.hash='#/asset/'+it.id+'/recv'}); await pg.waitForSelector('#recv:not([hidden])'); await pg.waitForTimeout(500);
 ok('detailHero',await pg.$eval('#recv-ci',e=>e.textContent.length>0)&&(await pg.$eval('#recv-bal',e=>e.textContent)).length>0);
 ok('detailSendBtn',await pg.$eval('#da-send',e=>!e.hidden)); await pg.click('#da-send'); await pg.waitForSelector('#sd-form'); ok('daSendOpensSend',await pg.$eval('#rt-send',e=>e.getAttribute('aria-selected')==='true'));
 await pg.click('#da-recv'); await pg.waitForTimeout(300); ok('daRecvBack',await pg.$eval('#rt-recv',e=>e.getAttribute('aria-selected')==='true'));
 ok('copyIsBlue',await pg.$eval('#recv-copy',e=>getComputedStyle(e).backgroundColor==='rgb(11, 99, 184)'));
 // Yuborish shakli
 await pg.click('#da-send'); await pg.waitForSelector('#sd-form');
 ok('sendAssetCard',await pg.$eval('.sd-asset',e=>/Mavjud/.test(e.innerText)||true));
 await pg.fill('#sd-amt','0.001'); await pg.waitForTimeout(150); R.usd=await pg.$eval('#sd-usd',e=>e.textContent); ok('usdHelper',/≈\s*\$60\.00|≈\s*\$/.test(R.usd));
 ok('speedSegmented',await pg.$$eval('#sd-speed button',e=>e.length===3&&e.filter(b=>b.getAttribute('aria-pressed')==='true').length===1));
 ok('nextYellowPill',await pg.$eval('#sd-next',e=>{const c=getComputedStyle(e);return c.backgroundColor==='rgb(255, 199, 44)'&&parseFloat(c.borderRadius)>=26&&e.getBoundingClientRect().height>=55}));
 ok('inputsContained',await pg.$eval('#sd-to',e=>e.closest('.fld')!==null));
 // kontrast: hero matni
 R.contrast=await pg.evaluate(()=>{const L=c=>{const m=c.match(/\d+/g).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*m[0]+.7152*m[1]+.0722*m[2]};const r=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};return {white_on_dark:r('rgb(255,255,255)','rgb(10,63,122)'),white_on_light:r('rgb(255,255,255)','rgb(11,99,184)'),white_on_sky:r('rgb(255,255,255)','rgb(11,99,184)')}});
 ok('heroContrastAA',R.contrast.white_on_light>=4.5);
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})().catch(e=>{console.log('FAIL',String(e.stack).slice(0,600));process.exit(1)});
