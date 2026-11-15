const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
let PRICE=1.5; const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'light',serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); if(/coingecko/.test(u)){const ids=(new URL(u).searchParams.get('ids')||'').split(','); const o={}; ids.forEach((id,i)=>o[id]={usd:id==='bitcoin'?60000.5:1+i*0.01,usd_24h_change:i%2?-1.5:2.25}); return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)})} return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const LN=['uz','en','ru','tr','ar','zh'];
 // leftover-Uzbek skaneri (ko'rinadigan matn tugunlari + atributlar)
 const scan=()=>pg.evaluate(()=>{const uzKeys=new Set(Object.keys(i18d('en'))); const bad=[]; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const heur=/\b(uchun|bilan|hamyon\w*|yuborish|miqdor\w*|manzil\w*|tarmoq\w*|sozlamalar|narx\w*|qidirish|kiriting|xato\w*|qulf\w*|ochish|tasdiqlash|bekor|saqlash|nusxa|mavjud|yetarli|kerak|bo'lmadi|bo'sh|avval|keyin|hozir)\b/i;
  for(let n=w.nextNode();n;n=w.nextNode()){const el=n.parentElement; if(!el||['SCRIPT','STYLE'].includes(el.tagName)||el.closest('[hidden],[data-notr]'))continue; if(!el.getClientRects().length)continue; const t=n.nodeValue.trim().replace(/\s+/g,' '); if(!t)continue; if((uzKeys.has(t)&&i18d('en')[t]!==t)||heur.test(t)) bad.push(t.slice(0,70))}
  document.querySelectorAll('[aria-label],[placeholder],[title]').forEach(e=>{ if(e.closest('[data-notr]'))return; for(const a of ['aria-label','placeholder','title']){const v=e.getAttribute(a); if(v&&((uzKeys.has(v)&&i18d('en')[v]!==v)||/\b(uchun|bilan|hamyon|tanlang|kiriting)\b/i.test(v))) bad.push(a+':'+v.slice(0,60))}});
  return [...new Set(bad)]});
 // 1) kirish ekrani: tanlagich, har til uchun lang/dir, matn o'zgaradi
 ok('noAuthLangSelect',(await pg.$$('#lang-sel,.langsel')).length===0);
 const h1={}; const authBad={};
 for(const l of LN){ await pg.evaluate(l=>localStorage.setItem('cw_lang',l),l); await pg.reload(); await pg.waitForSelector('#t-create'); await pg.waitForTimeout(80);
  const s=await pg.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,h1:document.querySelector('h1').textContent,title:document.title,st:localStorage.getItem('cw_lang')}));
  h1[l]=s.h1; ok('auth-'+l,s.lang===l&&s.dir===(l==='ar'?'rtl':'ltr')&&s.st===l);
  if(l!=='uz'){ authBad[l]=await scan(); }
 }
 R.h1=h1; ok('h1Distinct',new Set(Object.values(h1)).size===6); R.authBad=authBad; for(const l in authBad) ok('authClean-'+l,authBad[l].length===0);
 // 2) saqlanishi: reload -> tanlangan til qoladi
 await pg.evaluate(()=>localStorage.setItem('cw_lang','ru')); await pg.reload(); await pg.waitForSelector('#t-create'); ok('persist',(await pg.evaluate(()=>document.documentElement.lang))==='ru');
 // 3) hamyon yaratish (ruscha UI), keyin sahifalar bo'ylab
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 ok('homeLangKept',(await pg.evaluate(()=>document.documentElement.lang))==='ru');
 const routes=['home','assets','net/ETH','net/TRX','prices','contacts','mining','settings','add','send'];
 const lo={};
 await pg.evaluate(()=>{location.hash='#/settings'}); await pg.waitForTimeout(500);
 ok('settingsSeg',(await pg.$$('#lang-seg button')).length===6);
 for(const l of ['en','ru','tr','ar','zh','uz']){
  await pg.click('#lang-seg button[lang='+l+']'); await pg.waitForTimeout(150);
  ok('seg-'+l,(await pg.$eval('#lang-seg button[lang='+l+']',e=>e.getAttribute('aria-pressed')))==='true'&&(await pg.evaluate(()=>document.documentElement.lang))===l);
  for(const r of routes){ await pg.evaluate(r=>{location.hash='#/'+r},r); await pg.waitForTimeout(700); if(l!=='uz'){const x=await scan(); if(x.length)(lo[l+"/"+r]=x)} }
  if(l==='ar'||l==='zh'){ await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(500); await pg.screenshot({path:SH+'v37-'+l+'.png'}); }
  await pg.evaluate(()=>{location.hash='#/settings'}); await pg.waitForTimeout(300);
 }
 R.leftover=lo; ok("noLeftoverUzbek",Object.keys(lo).length===0);
 // 4) uz ga qaytganda asl matnlar tiklangan
 const hn=await pg.evaluate(()=>[...document.querySelectorAll('.pgh')].map(e=>e.textContent)); R.uzHeads=hn; ok('uzBack',hn.includes("Ko'rinish"));
 // 5) RTL tartib: ar da sidebar o'ngda (desktop)
 await pg.setViewportSize({width:1440,height:900}); await pg.click('#lang-seg button[lang=ar]'); await pg.waitForTimeout(300);
 const rt=await pg.evaluate(()=>{const n=document.querySelector('.nav').getBoundingClientRect(),w=document.querySelector('.wrap').getBoundingClientRect();return {navL:n.left,navR:n.right,wrapR:w.right,wrapL:w.left,vw:innerWidth}});
 R.rtl=rt; ok('rtlNavRight',rt.navR>=rt.vw-1&&rt.wrapR<=rt.navL+1);
 await pg.screenshot({path:SH+'v37-ar-desktop.png'});
 await pg.setViewportSize({width:390,height:844});
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})();
