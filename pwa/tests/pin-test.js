const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv; const SH=WORK+'/';
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[]; global.R=global.R||{}; const R=global.R;
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text())});
 await pg.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 const vault0=await pg.evaluate(()=>localStorage.getItem('cw_vault'));
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-card'); R.state0=await pg.$eval('#pin-state',e=>e.textContent);
 await pg.screenshot({path:SH+'pin-card.png'});
 const dlg=async v=>{await pg.waitForSelector('#dlg-in'); R.dlgType=(R.dlgType||[]).concat(await pg.$eval('#dlg-in',e=>e.type+'/'+e.inputMode)); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(150)};
 // 1) noto'g'ri so'zlar
 await pg.click('#pin-set'); await dlg('abc def'); R.wrongWords=await pg.$eval('#pin-note',e=>e.textContent);
 // 2) oson PIN
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('123456'); R.weak=await pg.$eval('#pin-note',e=>e.textContent);
 // 3) mos kelmagan tasdiq
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291537'); await dlg('48291638'); R.mismatch=await pg.$eval('#pin-note',e=>e.textContent);
 // 4) muvaffaqiyatli
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291537'); await dlg('48291537'); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:15000});
 R.ok=await pg.$eval('#pin-note',e=>e.textContent); R.state1=await pg.$eval('#pin-state',e=>e.textContent); R.offVisible=await pg.$eval('#pin-off',e=>!e.hidden);
 R.stored=await pg.evaluate(()=>({pin:(localStorage.getItem('cw_pin')||'').length,fail:localStorage.getItem('cw_pinfail'),plain:(localStorage.getItem('cw_pin')||'').includes('abandon')})); 
 R.vaultSame=(await pg.evaluate(()=>localStorage.getItem('cw_vault')))===vault0;
 // 5) qulflash -> PIN
 await pg.click('#lock'); await pg.waitForSelector('#pin-in'); await pg.screenshot({path:SH+'pin-unlock.png'});
 await pg.fill('#pin-in','111222'); await pg.click('#pin-go'); await pg.waitForFunction(()=>document.querySelector('#pin-msg').textContent.includes('Qolgan'),null,{timeout:15000}); R.wrong1=await pg.$eval('#pin-msg',e=>e.textContent);
 await pg.fill('#pin-in','48291537'); await pg.click('#pin-go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); R.unlockedByPin=true; R.failReset=await pg.evaluate(()=>localStorage.getItem('cw_pinfail'));
 // 6) 5 marta xato -> PIN o'chadi
 await pg.click('#lock'); await pg.waitForSelector('#pin-in');
 for(let i=0;i<5;i++){ await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in','000111'); await pg.click('#pin-go'); if(i<4) await pg.waitForFunction(n=>document.querySelector('#pin-msg').textContent.includes('Qolgan urinish: '+n),5-(i+1),{timeout:20000}); }
 await pg.waitForSelector('#pin-in',{state:'detached',timeout:30000}); await pg.waitForSelector('#go'); R.afterLockout={msg:await pg.$eval('#msg',e=>e.textContent),pin:await pg.evaluate(()=>localStorage.getItem('cw_pin')),pinInDom:await pg.$$eval('#pin-in',e=>e.length)};
 // 7) so'zlar bilan kirish hamon ishlaydi
 const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); R.wordsStillWork=true;
 // 8) qayta yoqish, so'ng o'chirish va wipe
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291537'); await dlg('48291537'); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:15000});
 await pg.click('#pin-off'); await pg.waitForSelector('#dlg-ok'); await pg.click('#dlg-ok'); await pg.waitForTimeout(200); R.off={pin:await pg.evaluate(()=>localStorage.getItem('cw_pin')),state:await pg.$eval('#pin-state',e=>e.textContent)};
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291537'); await dlg('48291537'); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:15000});
 await pg.click('#lock'); await pg.waitForSelector('#wipe'); await pg.click('#wipe'); await pg.waitForSelector('#dlg-ok'); await pg.click('#dlg-ok'); await pg.waitForSelector('#t-create');
 R.afterWipe=await pg.evaluate(()=>({pin:localStorage.getItem('cw_pin'),fail:localStorage.getItem('cw_pinfail'),vault:localStorage.getItem('cw_vault')}));
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,200));console.log(JSON.stringify(global.R,null,1));process.exit(1)});
