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
 await pg.click('#nav-assets'); await pg.waitForSelector('#net-list li'); await pg.waitForTimeout(1200);

 ok('netRows',(await pg.$$eval('#net-list li',e=>e.length))>=4&&(await pg.$$('.ngh,#net-chips')).length===0);
 const NAV=await pg.$$eval('.nav button:not(.dk)',e=>e.map(x=>x.innerText.trim())); ok('navLabels',JSON.stringify(NAV)==='["Hamyon","Aktivlar","Qo\'shish","Sozlamalar"]'); R.NAV=NAV;
 await pg.screenshot({path:SH+'v23-assets.png'});
 await pg.reload(); await pg.waitForSelector('#go'); {const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); await pg.waitForTimeout(800);}
 await pg.click('#nav-assets'); await pg.waitForSelector('#net-list li'); await pg.waitForTimeout(600);
 // Sozlamalar
 await pg.click('#nav-set'); await pg.waitForSelector('#pg-settings:not([hidden])'); await pg.waitForTimeout(300);
 const set=await pg.evaluate(()=>{const p=document.querySelector('#pg-settings');return {heads:[...p.querySelectorAll('h2.pgh')].map(x=>x.innerText),groups:[...p.querySelectorAll('.group')].map(g=>[...g.querySelectorAll('.rowlink b')].map(b=>b.innerText)),icons:[...p.querySelectorAll('.rowlink .ri svg')].map(s=>s.innerHTML.length),small:[...p.querySelectorAll('button,a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<43.5}).length}});
 R.set=set; ok('settingsHeads',JSON.stringify(set.heads.map(x=>x.toLowerCase()))==='["hamyon","xavfsizlik","qo\'shimcha","ko\'rinish"]'); ok('settingsGroups',set.groups.length===3&&set.groups[0].length===3&&set.groups[1].length===2&&set.groups[2].length===1); ok('settingsTargets44',set.small===0);
 const themeSel=await pg.$eval('#theme-seg button[aria-pressed=true]',e=>getComputedStyle(e).backgroundColor); ok('themeNotYellow',themeSel!=='rgb(255, 199, 44)');
 ok('hrefsIntact',await pg.evaluate(()=>['#/backup','#/wallets','#/security','#/mining','#/contacts'].every(h=>document.querySelector('#pg-settings a[href="'+h+'"]'))));
 await pg.screenshot({path:SH+'v23-settings.png',fullPage:true});
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})().catch(e=>{console.error('FAIL',String(e.stack).slice(0,800));console.log(JSON.stringify(R,null,1));process.exit(1)});
