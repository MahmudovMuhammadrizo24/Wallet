const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work';
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={};
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[];
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text())});
 await pg.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 const vis=s=>pg.$eval(s,e=>!e.hidden&&e.offsetParent!==null);
 R.homeTip=await vis('#qk-tip');
 await pg.evaluate(()=>{location.hash='#/settings'}); await pg.waitForTimeout(200);
 R.settings=await pg.$eval('#qk-status',e=>e.textContent+' | '+e.closest('a').getAttribute('href'));
 await pg.click('#qk-status'); await pg.waitForSelector('#pin-card'); R.opensSecurity=await vis('#pin-card');
 // parol o'rnatish
 const dlg=async v=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(150)};
 await pg.click('#pw-set'); await dlg(words.join(' ')); await dlg('Mening-Parol-2026'); await dlg('Mening-Parol-2026'); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:20000});
 await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(200); R.homeTipAfterPw=await vis('#qk-tip');
 await pg.evaluate(()=>{location.hash='#/settings'}); await pg.waitForTimeout(200); R.settingsAfter=await pg.$eval('#qk-status',e=>e.textContent);
 // parolni o'chirib, kirish sahifasida maslahat
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.click('#pin-off'); await pg.waitForSelector('#dlg-ok'); await pg.click('#dlg-ok'); await pg.waitForTimeout(200);
 await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(200); R.tipBackAfterOff=await vis('#qk-tip');
 await pg.click('#qk-hide'); R.tipHidden=!(await vis('#qk-tip'));
 await pg.click('#lock'); await pg.waitForSelector('#go'); R.loginHint=(await pg.$$eval('#pane-import .mut, .mut',e=>e.map(x=>x.textContent).filter(t=>t.includes('Kirish usuli')))).length;
 const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000});
 R.tipStaysHidden=!(await vis('#qk-tip'));
 // parol bor: kirish sahifasida maslahat yo'q, parol maydoni bor
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.click('#pw-set'); await dlg(words.join(' ')); await dlg('Mening-Parol-2026'); await dlg('Mening-Parol-2026'); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:20000});
 await pg.click('#lock'); await pg.waitForSelector('#pin-in'); R.loginWithPw={hint:(await pg.$$eval('.mut',e=>e.map(x=>x.textContent).filter(t=>t.includes('Kirish usuli')))).length,pwField:await pg.$$eval('#pin-in',e=>e.length)};
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,400));console.log(JSON.stringify(R,null,1));process.exit(1)});
