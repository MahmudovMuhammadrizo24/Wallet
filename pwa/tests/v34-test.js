const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(1200);
 const pickers=async()=>{const nets=await pg.$$eval('#list .ngb',e=>e.map(b=>b.dataset.net));const o={};for(const n of nets){await pg.click('#list .ngb[data-net='+n+']');await pg.waitForSelector('#tk-sheet');o[n]=await pg.$$eval('#sh-l button[data-k]',e=>e.map(b=>b.dataset.k));await pg.keyboard.press('Escape');await pg.waitForSelector('#tk-sheet',{state:'detached'})}return o};
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)}); if(/coingecko/.test(u)){ if(globalThis.PXFAIL) return r.fulfill({status:500,body:'x'}); const ids=(new URL(u).searchParams.get('ids')||'').split(','); const o={}; ids.forEach((id,i)=>o[id]={usd:id==='bitcoin'?60000.5:id==='tether'?1:(i+1)*0.0123,usd_24h_change:i%2?-1.5:2.25}); return J(o); } return r.abort()});
 await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(900);
 const g=await pg.evaluate(()=>{const r=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}};return {nav:r('.nav'),hero:r('.hero'),list:r('#pg-home .assets'),wrap:r('#app'),px:r('#nav-px'),brand:r('.nav-brand'),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}});
 R.geo=g;
 ok('sidebar',g.nav&&g.nav.x===0&&g.nav.w===248&&g.nav.h>=890);
 ok('sidebarItems',await pg.$$eval('.nav button',e=>e.filter(b=>b.getBoundingClientRect().width>0).length)===7);
 ok('twoCols',g.hero&&g.list&&g.list.x>g.hero.x+g.hero.w&&Math.abs(g.list.y-g.hero.y)<80);
 ok('noHScroll',g.sw<=g.cw);
 ok('contentRight',g.hero.x>=248);
 await pg.screenshot({path:SH+'v34-home.png'});
 for(const [h,sel,nm] of [['#/assets','#pg-assets','assets'],['#/prices','#pg-prices','prices'],['#/security','#pg-security','security'],['#/settings','#pg-settings','settings'],['#/mining','#pg-mining','mining'],['#/contacts','#pg-contacts','contacts'],['#/add','#pg-add','add']]){
  await pg.evaluate(x=>{location.hash=x},h); await pg.waitForTimeout(700);
  const v=await pg.evaluate(s=>{const e=document.querySelector(s);const b=e.getBoundingClientRect();return {vis:!e.hidden,x:Math.round(b.x),w:Math.round(b.width),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,cur:[...document.querySelectorAll('.nav [aria-current]')].map(x=>x.id)}},sel);
  R['p_'+nm]=v; ok('page_'+nm,v.vis&&v.x>=248&&v.sw<=v.cw);
  await pg.screenshot({path:SH+'v34-'+nm+'.png'});
 }
 ok('navMine',JSON.stringify(R.p_mining.cur)==='["nav-mine"]'); ok('navPrices',JSON.stringify(R.p_prices.cur)==='["nav-px"]'); ok('navSettings',JSON.stringify(R.p_settings.cur)==='["nav-set"]');
 await pg.click('#nav-px'); await pg.waitForTimeout(300); ok('clickPx',await pg.evaluate(()=>location.hash==='#/prices'));
 await pg.click('#nav-ct'); await pg.waitForTimeout(300); ok('clickCt',await pg.evaluate(()=>location.hash==='#/contacts'));
 // mobil: yon menyu yo'q, pastki panel bor, 4 tugma
 await pg.setViewportSize({width:390,height:844}); await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(600);
 const m=await pg.evaluate(()=>{const n=document.querySelector('.nav').getBoundingClientRect();return {y:Math.round(n.y),w:Math.round(n.width),vis:[...document.querySelectorAll('.nav button')].filter(b=>b.getBoundingClientRect().width>0).length,hero:Math.round(document.querySelector('.hero').getBoundingClientRect().x),list:Math.round(document.querySelector('#pg-home .assets').getBoundingClientRect().y),heroY:Math.round(document.querySelector('.hero').getBoundingClientRect().y),sw:document.documentElement.scrollWidth}});
 R.mob=m; ok('mobBottomNav',m.y>700&&m.w===390&&m.vis===4); ok('mobSingleCol',m.list>m.heroY&&m.sw<=390);
 await pg.screenshot({path:SH+'v34-mobile.png'});
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})();
