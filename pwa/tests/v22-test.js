const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(1200);
 const pickers=async()=>{const nets=await pg.$$eval('#list .ngb',e=>e.map(b=>b.dataset.net));const o={};for(const n of nets){await pg.click('#list .ngb[data-net='+n+']');await pg.waitForSelector('#tk-sheet');o[n]=await pg.$$eval('#sh-l button[data-k]',e=>e.map(b=>b.dataset.k));await pg.keyboard.press('Escape');await pg.waitForSelector('#tk-sheet',{state:'detached'})}return o};
 const pick=async(n,k)=>{await pg.click('#list .ngb[data-net='+n+']');await pg.waitForSelector('#tk-sheet');await pg.click('#sh-l button[data-k='+k+']');await pg.waitForSelector('#tk-sheet',{state:'detached'})};
 const heads=async()=>pg.$$eval('#list tr.ng th',e=>e.map(x=>x.innerText.replace(/\s+/g,' ')));
 R.heads0=await heads(); R.pick0=await pickers();
 ok('everyNetworkHasPicker',['BTC'].every(n=>!(n in R.pick0))&&['ETH','TRX','SOL','TON','POLY','ARB','OP','AVAX','BSC'].every(n=>(R.pick0[n]||[]).length>0));
 ok('ethOffersPopularInOrder',JSON.stringify(R.pick0.ETH)===JSON.stringify(['USDC_ERC20','WBTC_ERC20','LINK_ERC20','UNI_ERC20','DAI_ERC20','SHIB_ERC20','AAVE_ERC20','PEPE_ERC20','LDO_ERC20','CRV_ERC20']));
 ok('polygonOffersNativeFirst',JSON.stringify(R.pick0.POLY)===JSON.stringify(['POL','USDT_POLYGON','USDC_POLYGON']));
 ok('tronSolTon',JSON.stringify(R.pick0.TRX)==='["USDC_TRC20"]'&&JSON.stringify(R.pick0.SOL)==='["USDT_SOLANA","USDC_SOLANA"]'&&JSON.stringify(R.pick0.TON)==='["USDT_TON"]');
 ok('emptyL2GroupsShown',R.heads0.some(h=>/^\S+\s+polygon/i.test(h))&&R.heads0.some(h=>/^\S+\s+bnb chain/i.test(h)));
 // tanlash: Ethereum -> LINK
 await pick('ETH','LINK_ERC20'); await pg.waitForTimeout(900);
 R.msg1=await pg.$eval('#ng-msg',e=>e.textContent);
 const after=await pg.evaluate(()=>({link:data.items.filter(x=>x.coin==='LINK_ERC20').length,addrOk:data.items.find(x=>x.coin==='LINK_ERC20').address===data.items.find(x=>x.coin==='ETH').address}));
 ok('linkAdded',after.link===1&&after.addrOk); R.pick1=await pickers(); ok('linkNoLongerOffered',!R.pick1.ETH.includes('LINK_ERC20')&&R.pick1.ETH.length===9);
 R.ethGroup=await pg.$$eval('#list > tr',e=>{const o=[];let on=false;for(const x of e){if(x.classList.contains('ng')){on=/^\S+\s+ethereum/i.test(x.innerText);continue}if(on&&!x.classList.contains('ngp-row'))o.push(data.items.find(i=>i.id===x.querySelector('.rowbtn').dataset.id).coin)}return o});
 ok('linkUnderEthereum',R.ethGroup.some(t=>/LINK/.test(t))&&R.ethGroup.length===3);
 // L2: Polygon -> POL (tarmoq tangasi) va USDC
 await pick('POLY','POL'); await pg.waitForTimeout(700); await pick('POLY','USDC_POLYGON'); await pg.waitForTimeout(700);
 R.pick2=await pickers(); ok('polygonShrinks',JSON.stringify(R.pick2.POLY)==='["USDT_POLYGON"]');
 R.polyGroup=await pg.$$eval('#list > tr',e=>{const o=[];let on=false;for(const x of e){if(x.classList.contains('ng')){on=/^\S+\s+polygon/i.test(x.innerText);continue}if(on&&!x.classList.contains('ngp-row'))o.push(data.items.find(i=>i.id===x.querySelector('.rowbtn').dataset.id).coin)}return o});
 ok('polygonOrderNativeFirst',R.polyGroup.length===2&&/POL/.test(R.polyGroup[0]));
 // hammasi tanlansa tanlov yo'qoladi; ortiqcha qo'shilmaydi
 for(const k of ['USDT_POLYGON']) await pick('POLY',k), await pg.waitForTimeout(600);
 R.pick3=await pickers(); ok('polygonPickerGoneWhenAllAdded',!('POLY' in R.pick3));
 const cnt=await pg.evaluate(()=>data.items.length); await pg.evaluate(()=>{ADDBASE&&0}); R.dupAttempt=await pg.evaluate(async()=>{let m='';await addTokens(['POL'],t=>m=t);return {m,n:data.items.length}}); ok('noDuplicate',R.dupAttempt.n===cnt&&/allaqachon/.test(R.dupAttempt.m));
 // faqat tanlangan qiymat qabul qilinadi (soxta qiymat)
 R.fake=await pg.evaluate(()=>{document.querySelector('#list .ngb[data-net=ETH]').click();const li=document.createElement('li');li.innerHTML='<button data-k="EVIL_TOKEN">x</button>';document.querySelector('#sh-l').appendChild(li);li.firstChild.click();return data.items.some(x=>x.coin==='EVIL_TOKEN')}); ok('fakeValueIgnored',R.fake===false); await pg.keyboard.press('Escape'); await pg.waitForSelector('#tk-sheet',{state:'detached'});

 // ---- v22 UI tekshiruvlari ----
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(500);
 await pg.click('#list .ngb[data-net=ETH]'); await pg.waitForSelector('#tk-sheet');
 ok('sheetFocusOnClose',await pg.evaluate(()=>document.activeElement.id==='sh-x'));
 const n0=await pg.$$eval('#sh-l li:not([hidden])',e=>e.length); await pg.fill('#sh-q','uni'); const n1=await pg.$$eval('#sh-l li:not([hidden])',e=>e.length); ok('searchFilters',n0>1&&n1===1);
 await pg.fill('#sh-q','zzzz'); ok('searchEmptyMsg',await pg.$eval('#sh-e',e=>!e.hidden)); await pg.fill('#sh-q','');
 await pg.screenshot({path:SH+'v22-sheet.png'});
 await pg.keyboard.press('Escape'); await pg.waitForSelector('#tk-sheet',{state:'detached'});
 ok('focusReturnsToOpener',await pg.evaluate(()=>document.activeElement.classList.contains('ngb')&&document.activeElement.dataset.net==='ETH'));
 await pg.click('#list .ngb[data-net=ETH]'); await pg.waitForSelector('#tk-sheet'); await pg.mouse.click(190,20); await pg.waitForSelector('#tk-sheet',{state:'detached'}); ok('backdropCloses',true);
 const ui=await pg.evaluate(()=>{const nav=getComputedStyle(document.querySelector('.nav'));const small=[...document.querySelectorAll('#pages :not([hidden]) button,.nav button,#pages :not([hidden]) a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<43.5||r.width<43.5)}).map(e=>(e.id||e.className||e.textContent).toString().slice(0,30));return {navBg:nav.backgroundColor,blur:nav.backdropFilter,small}});
 R.ui=ui; ok('navOpaque',!/rgba\(.*,\s*0?\.\d+\)/.test(ui.navBg)&&ui.blur==='none'); ok('allTargets44',ui.small.length===0);
 R.homeLabels=await (async()=>{await pg.click('#nav-wallet');await pg.waitForTimeout(400);await pg.screenshot({path:SH+'v22-home.png'});return pg.$$eval('.actions button',e=>e.map(x=>x.innerText.trim()))})(); ok('homeLabels',JSON.stringify(R.homeLabels)==='["Qabul qilish","Yuborish","Qo\'shish"]');
 ok('oneYellowAction',await pg.evaluate(()=>[...document.querySelectorAll('.actions button')].filter(e=>getComputedStyle(e).backgroundColor==='rgb(255, 199, 44)').length===1));
 // saqlanadi: qayta kirgandan keyin ham bor
 await pg.reload(); await pg.waitForSelector('#go'); const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); await pg.waitForTimeout(800);
 ok('persisted',await pg.evaluate(()=>['LINK_ERC20','POL','USDC_POLYGON','USDT_POLYGON'].every(k=>data.items.some(x=>x.coin===k))));
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(800); await pg.screenshot({path:SH+'v22-assets.png',fullPage:true});
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})().catch(e=>{console.error('FAIL',String(e.stack).slice(0,800));console.log(JSON.stringify(R,null,1));process.exit(1)});
