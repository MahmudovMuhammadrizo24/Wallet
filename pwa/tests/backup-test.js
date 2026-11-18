const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const dir=process.argv[2], PORT=+process.argv[3]; const R={}; const OUT='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/backup.json';
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(PORT);
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true}); const pg=await ctx.newPage(); const errs=[];
 pg.on('pageerror',e=>errs.push(e.message)); await pg.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await pg.goto(`http://localhost:${PORT}/index.html`); await pg.waitForSelector('#t-create'); const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]); await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 // kontakt + token + PIN
 await pg.evaluate(()=>{location.hash='#/contacts'}); await pg.fill('#ct-name','Zaxira-do\'st'); await pg.fill('#ct-addr','bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'); await pg.click('#ct-add'); await pg.waitForTimeout(400);
 await pg.evaluate(()=>{location.hash='#/add'}); await pg.selectOption('#tk-sel','USDC_ERC20'); await pg.click('#tk-add'); await pg.waitForTimeout(600);
 await pg.evaluate(()=>{location.hash='#/security'}); const dlg=async v=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(150)};
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291537'); await dlg('48291537'); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:15000});
 R.before=await pg.evaluate(()=>({items:data.items.length,book:(data.book||[]).length,pin:!!localStorage.getItem('cw_pin')}));
 await pg.evaluate(()=>{location.hash='#/backup'}); const [dl]=await Promise.all([pg.waitForEvent('download'),pg.click('#export')]); await dl.saveAs(OUT); const j=JSON.parse(fs.readFileSync(OUT,'utf8')); R.file={keys:Object.keys(j),ver:j.ver,bytes:fs.statSync(OUT).size,plainLeak:fs.readFileSync(OUT,'utf8').includes('Zaxira-do')||fs.readFileSync(OUT,'utf8').includes('bc1q')};
 // o'chirish -> tiklash
 await pg.click('#lock'); await pg.waitForSelector('#wipe'); await pg.click('#wipe'); await pg.waitForSelector('#dlg-ok'); await pg.click('#dlg-ok'); await pg.waitForSelector('#t-create');
 R.wiped=await pg.evaluate(()=>({vault:localStorage.getItem('cw_vault'),pin:localStorage.getItem('cw_pin')}));
 await pg.click('#t-import'); await pg.waitForSelector('#imp',{state:'attached'}); await pg.setInputFiles('#imp',OUT); await pg.waitForSelector('#go'); R.restoreMsg=await pg.$eval('#msg',e=>e.textContent);
 const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000});
 R.after=await pg.evaluate(()=>({items:data.items.length,book:(data.book||[]).map(x=>x.name),coins:data.items.map(x=>x.coin).join(','),pin:!!localStorage.getItem('cw_pin')}));
 // buzuq fayl mavjud hamyonni almashtirmasligi kerak
 await pg.click('#lock'); await pg.waitForSelector('#imp',{state:'attached'}); fs.writeFileSync(OUT+'.bad','{"ver":"3","salt":"AAAA","vault":"AAAA"}'); const vBefore=await pg.evaluate(()=>localStorage.getItem('cw_vault')); await pg.setInputFiles('#imp',OUT+'.bad'); await pg.waitForTimeout(500);
 R.badFile={msg:await pg.$eval('#msg',e=>e.textContent),vaultUnchanged:(await pg.evaluate(()=>localStorage.getItem('cw_vault')))===vBefore};
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,300));console.log(JSON.stringify(R));process.exit(1)});
