const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'light',serviceWorkers:'block',permissions:[]}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); if(/coingecko/.test(u)){const o={bitcoin:{usd:60000,usd_24h_change:1}}; return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)})} return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000}); await pg.waitForTimeout(600);

 /* ===== HUJUM 1: bidi/zero-width spoofing kontakt nomida ===== */
 await pg.evaluate(()=>{location.hash='#/contacts'}); await pg.waitForSelector('#ct-add');
 const BIDI='Binance-support‮ txe.ssorG⁦'; // RTL override bilan "support" ni teskari ko'rsatishga urinish
 await pg.fill('#ct-name',BIDI); await pg.evaluate(()=>{const e=document.getElementById('ct-fam');e.value='BTC';e.dispatchEvent(new Event('change',{bubbles:true}));}); await pg.fill('#ct-addr','1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'); await pg.click('#ct-add');
 await pg.waitForTimeout(200);
 const ctHtml = await pg.$eval('#ct-list',e=>e.innerHTML);
 const ctRaw = await pg.$eval('#ct-list b',e=>e.textContent);
 ok('bidiStoredVerbatim', ctRaw.includes('‮')); // hozirgi holat: tozalanmaydi (pastda ko'rsatiladi)
 await pg.screenshot({path:SH+'phish-bidi-contact.png'});

 /* ===== HUJUM 2: homoglif/kirill manzil - validatsiya rad etishi kerak ===== */
 const realBtc='1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
 const homo = realBtc.replace('A1z','А1z'); // kirillcha 'А' (U+0410)
 await pg.fill('#ct-name','Homoglif-test'); await pg.evaluate(()=>{const e=document.getElementById('ct-fam');e.value='BTC';e.dispatchEvent(new Event('change',{bubbles:true}));}); await pg.fill('#ct-addr',homo); await pg.click('#ct-add');
 await pg.waitForTimeout(150);
 const homoNote = await pg.$eval('#ct-note',e=>e.textContent);
 ok('homoglyphRejected', /mos emas|tarmog/.test(homoNote));

 /* ===== HUJUM 3: "maxfiy kalit"ni manzil sifatida joylashtirish (ijtimoiy muhandislik) ===== */
 await pg.fill('#ct-name','Fake'); await pg.evaluate(()=>{const e=document.getElementById('ct-fam');e.value='BTC';e.dispatchEvent(new Event('change',{bubbles:true}));}); await pg.fill('#ct-addr',words.join(' ')); await pg.click('#ct-add');
 await pg.waitForTimeout(150);
 const secNote = await pg.$eval('#ct-note',e=>e.textContent);
 ok('seedPhraseAsAddrBlocked', /maxfiy/.test(secNote));

 /* ===== HUJUM 4: manzil-zaharlash (address poisoning) - o'xshash manzil ogohlantirishi ===== */
 await pg.fill('#ct-name','Real-kontakt'); await pg.evaluate(()=>{const e=document.getElementById('ct-fam');e.value='BTC';e.dispatchEvent(new Event('change',{bubbles:true}));}); await pg.fill('#ct-addr',realBtc); await pg.click('#ct-add'); await pg.waitForTimeout(150);
 const poison = realBtc.slice(0,6)+'X'.repeat(realBtc.length-10)+realBtc.slice(-4);
 let dlgSeen=false; pg.once('dialog',d=>{dlgSeen=true;d.dismiss()});
 await pg.fill('#ct-name','Poison'); await pg.evaluate(()=>{const e=document.getElementById('ct-fam');e.value='BTC';e.dispatchEvent(new Event('change',{bubbles:true}));}); await pg.fill('#ct-addr',poison);
 await pg.click('#ct-add'); await pg.waitForSelector('#dlg-msg',{timeout:3000}).catch(()=>{});
 const poisonWarn = await pg.evaluate(()=>(document.getElementById('dlg-msg')||{}).textContent||'').catch(()=>'');
 R.poisonWarnText=poisonWarn; ok('addressPoisoningWarned', /zaharlash/.test(poisonWarn));
 await pg.screenshot({path:SH+'phish-poison-warn.png'});
 await pg.click('#dlg-no').catch(()=>{}); await pg.waitForTimeout(200);

 /* ===== HUJUM 5: QR/to'lov havolasi orqali zararli payload (Send oynasiga) ===== */
 await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(200);
 await pg.click('#nav-assets'); await pg.waitForSelector('#net-list li'); await pg.evaluate(()=>{location.hash='#/net/BTC'}); await pg.waitForSelector('#list li.ar');
 await pg.click('#list button[data-act=addr]'); await pg.waitForSelector('#recv-qr svg');
 await pg.click('#rt-send'); await pg.waitForSelector('#sd-to',{timeout:8000});
 const qrTests = {
  xssInAddr: `bitcoin:<img src=x onerror=alert(1)>?amount=1`,
  jsScheme: `javascript:alert(1)`,
  hugeAmount: `bitcoin:${realBtc}?amount=999999999999999999999999999.99999999`,
  negAmount: `bitcoin:${realBtc}?amount=-1`,
  overlong: 'bitcoin:' + 'A'.repeat(2000),
  memoInjectTon: `ton://transfer/EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t?text=${encodeURIComponent('<script>alert(1)</script>')}`
 };
 const qrRes = {};
 for (const [k,v] of Object.entries(qrTests)) {
   const r = await pg.evaluate(({v,k})=>{ try { return JSON.stringify(parsePayUri(v, k.includes('ton')?'USDT_TON':'BTC')); } catch(e){ return 'THROW:'+e.message; } }, {v,k});
   qrRes[k]=r;
 }
 R.qrRes = qrRes;
 // XSS sinovi: agar skript ishlasa alert chaqiriladi -> pageerror/dialog yo'q bo'lishi kerak
 let xssFired=false; pg.once('dialog',()=>{xssFired=true;});
 await pg.fill('#sd-to', `<img src=x onerror=window.__xss=1>`); await pg.waitForTimeout(200);
 const xssRan = await pg.evaluate(()=>window.__xss===1);
 ok('xssInInputBlocked', !xssRan && !xssFired);
 await pg.screenshot({path:SH+'phish-send-xss.png'});

 /* ===== HUJUM 6: router orqali in'ektsiya (yangi #/net/ yo'li) ===== */
 const routeFuzz = ['#/net/<script>alert(1)</script>','#/net/__proto__','#/net/../../etc/passwd','#/net/'+'A'.repeat(5000),'#/net/null','#/net/ETH\"><svg onload=alert(1)>'];
 const routeRes={};
 for (const h of routeFuzz) {
   await pg.evaluate(h=>{try{location.hash=h;}catch(e){}},h); await pg.waitForTimeout(150);
   routeRes[h.slice(0,40)] = { ok: await pg.$eval('#pg-assets,#pg-net',e=>!!e).catch(()=>false), bodyHasScript: await pg.evaluate(()=>document.body.innerHTML.includes('<script>alert')) };
 }
 R.routeFuzz = routeRes;
 ok('noRouteInjection', Object.values(routeRes).every(x=>!x.bodyHasScript));

 /* ===== HUJUM 7: ko'chirilgan manzil - ko'rsatiladigan manzil to'liqligi (clipboard almashtirish ogohlantirishi kamaytirmasligi uchun) ===== */
 await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(200);
 await pg.click('#nav-assets'); await pg.waitForSelector('#net-list li');
 await pg.evaluate(()=>{location.hash='#/net/BTC'}); await pg.waitForSelector('#list li.ar');
 await pg.click('#list button[data-act=addr]'); await pg.waitForSelector('#recv-qr svg');
 const shown = await pg.$eval('#recv-addr',e=>e.textContent).catch(()=>null);
 R.shownAddr = shown;
 await pg.screenshot({path:SH+'phish-receive.png'});

 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(0);
})();
