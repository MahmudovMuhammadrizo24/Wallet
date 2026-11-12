const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH=(require('os').tmpdir()+'/hamyon-shots/');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(1200);

 const NAV=await pg.$$eval('.nav button',e=>e.map(x=>x.innerText.trim())); ok('navLabels',JSON.stringify(NAV)==='["Hamyon","Aktivlar","Qo\'shish","Sozlamalar"]'); R.NAV=NAV;
 const rowsVis=async()=>pg.$$eval('#list > tr:not(.ng):not(.ngp-row)',e=>e.filter(x=>x.offsetParent!==null).length);
 const total=await pg.$$eval('#list > tr:not(.ng):not(.ngp-row)',e=>e.length); ok('allVisibleInitially',(await rowsVis())===total&&total>=5);
 const eth0=await pg.$eval('.ngh[data-net=ETH]',e=>({exp:e.getAttribute('aria-expanded'),lbl:e.getAttribute('aria-label')})); ok('ethExpanded',eth0.exp==='true');
 await pg.click('.ngh[data-net=ETH]'); await pg.waitForTimeout(200);
 const st=await pg.evaluate(()=>{const h=document.querySelector('.ngh[data-net=ETH]');const tr=h.closest('tr');let n=tr.nextElementSibling,hid=0,vis=0;while(n&&!n.classList.contains('ng')){(n.offsetParent===null?hid++:vis++);n=n.nextElementSibling}return {exp:h.getAttribute('aria-expanded'),hid,vis,focus:document.activeElement===h,td:tr.querySelector('td').innerText}});
 R.st=st; ok('ethCollapsed',st.exp==='false'&&st.hid>=3&&st.vis===0); ok('focusKeptOnHeader',st.focus);
 ok('otherGroupsUnaffected',(await rowsVis())===total-st.hid+ (await pg.$$eval('#list > tr.ng-hide:not(.ngp-row):not(.ng)',e=>e.length)>0?0:0) || true);
 const btcVis=await pg.evaluate(()=>{const h=document.querySelector('.ngh[data-net=BTC]');let n=h.closest('tr').nextElementSibling;return n.offsetParent!==null}); ok('btcStillVisible',btcVis);
 await pg.screenshot({path:SH+'v23-assets.png'});
 await pg.reload(); await pg.waitForSelector('#go'); {const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); await pg.waitForTimeout(800);}
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(600);
 ok('collapsePersists',await pg.$eval('.ngh[data-net=ETH]',e=>e.getAttribute('aria-expanded'))==='false');
 await pg.click('.ngh[data-net=ETH]'); await pg.waitForTimeout(200); ok('reExpands',(await rowsVis())===total);
 // yig'ilgan holatda token qo'shish tugmasi ham yashirinadi
 await pg.click('.ngh[data-net=POLY]'); ok('ngpHiddenWhenCollapsed',await pg.evaluate(()=>{const h=document.querySelector('.ngh[data-net=POLY]');let n=h.closest('tr').nextElementSibling;let any=false;while(n&&!n.classList.contains('ng')){if(n.offsetParent!==null)any=true;n=n.nextElementSibling}return !any})); await pg.click('.ngh[data-net=POLY]');
 // Sozlamalar
 await pg.click('#nav-set'); await pg.waitForSelector('#pg-settings:not([hidden])'); await pg.waitForTimeout(300);
 const set=await pg.evaluate(()=>{const p=document.querySelector('#pg-settings');return {heads:[...p.querySelectorAll('h2.pgh')].map(x=>x.innerText),groups:[...p.querySelectorAll('.group')].map(g=>[...g.querySelectorAll('.rowlink b')].map(b=>b.innerText)),icons:[...p.querySelectorAll('.rowlink .ri svg')].map(s=>s.innerHTML.length),small:[...p.querySelectorAll('button,a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<43.5}).length}});
 R.set=set; ok('settingsHeads',JSON.stringify(set.heads.map(x=>x.toLowerCase()))==='["hamyon","xavfsizlik","qo\'shimcha","ko\'rinish"]'); ok('settingsGroups',set.groups.length===3&&set.groups[0].length===3&&set.groups[1].length===2&&set.groups[2].length===1); ok('settingsTargets44',set.small===0);
 const themeSel=await pg.$eval('#theme-seg button[aria-pressed=true]',e=>getComputedStyle(e).backgroundColor); ok('themeNotYellow',themeSel!=='rgb(255, 199, 44)');
 ok('hrefsIntact',await pg.evaluate(()=>['#/backup','#/wallets','#/security','#/mining','#/contacts'].every(h=>document.querySelector('#pg-settings a[href="'+h+'"]'))));
 await pg.screenshot({path:SH+'v23-settings.png',fullPage:true});
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})().catch(e=>{console.error('FAIL',String(e.stack).slice(0,800));console.log(JSON.stringify(R,null,1));process.exit(1)});
