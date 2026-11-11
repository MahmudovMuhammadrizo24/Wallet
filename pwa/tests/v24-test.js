const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'text/javascript'}); r.end(fs.readFileSync(f))}).listen(+port);
const BTC_TO='bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'; const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
let FEE={bs:{1:20,3:12,6:8,144:2},mp:{1:20,3:12,6:8,144:2}}; let posts=[]; let NU=1;
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message));
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  if(/\/tx$/.test(u)&&r.request().method()==='POST'){posts.push(r.request().postData()); return r.fulfill({status:200,contentType:'text/plain',body:'f'.repeat(64)})}
  if(/mempool\.space\/api|blockstream/.test(u)){ if(/\/utxo/.test(u))return J(Array.from({length:NU},(_,i)=>({txid:String(i+1).repeat(64),vout:0,value:5000000/NU,status:{confirmed:true}}))); if(/fee-estimates/.test(u))return J(/blockstream/.test(u)?FEE.bs:FEE.mp);
   const am=u.match(/\/address\/([^/?]+)$/); if(am)return J({chain_stats:{funded_txo_sum:5000000,spent_txo_sum:0,tx_count:1},mempool_stats:{funded_txo_sum:0,spent_txo_sum:0,tx_count:0}}); return J([])}
  if(/coingecko/.test(u))return J({bitcoin:{usd:97000}}); return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 ok('referrerMeta',await pg.evaluate(()=>!!document.querySelector('meta[name=referrer][content=no-referrer]')));
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 const id=await pg.evaluate(()=>data.items.find(x=>x.coin==='BTC').id);
 const review=async(amt)=>{await pg.evaluate(()=>{location.hash='#/assets'}); await pg.waitForTimeout(300); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',BTC_TO); await pg.fill('#sd-amt',amt); await pg.click('#sd-next'); await pg.waitForFunction(()=>document.querySelector('#rv-go')||/g.ayritabiiy|Komissiya stavkasi/.test(document.body.innerText),null,{timeout:15000}); await pg.waitForTimeout(300); return pg.evaluate(()=>({rv:!!document.querySelector('#rv-go'),txt:document.body.innerText}))};
 // 1) Bitta server yolg'on (1000 sat/vB), ikkinchisi odatiy: eng pasti ishlatiladi
 FEE={bs:{1:900,3:900,6:900,144:900},mp:{1:20,3:12,6:8,144:2}};
 let r1=await review('0.01'); ok('reviewOpensWithLowRate',r1.rv===true); ok('lowestRateUsed',/12\.\d sat\/vB|12 sat\/vB/.test(r1.txt)); ok('disagreeWarn',/Ikki server komissiya/.test(r1.txt)); ok('noHugeFee',!/900(\.\d+)? sat\/vB/.test(r1.txt));
 // 2) Ikkalasi 600: rad etiladi (chegara 500)
 FEE={bs:{1:600,3:600,6:600,144:600},mp:{1:600,3:600,6:600,144:600}};
 let r2=await review('0.01'); ok('over500Rejected',r2.rv===false&&/g.ayritabiiy/.test(r2.txt));
 // 3) Ikkalasi 300: ogohlantirish
 FEE={bs:{1:300,3:300,6:300,144:300},mp:{1:300,3:300,6:300,144:300}};
 NU=5; let r3=await review('0.04'); NU=1; ok('highRateWarn',r3.rv===true&&/Komissiya stavkasi yuqori/.test(r3.txt)); ok('absoluteFeeWarn',/0\.001 BTC dan oshdi/.test(r3.txt));
 // 4) Bitta server ishlamasa ham ishlaydi
 FEE={bs:null,mp:{1:20,3:12,6:8,144:2}}; 
 await pg.unroute(()=>true).catch(()=>{});
 await pg.route(u=>/blockstream\.info\/api\/fee-estimates/.test(u.href),r=>r.abort(),{times:3}).catch(()=>{});
 let r4=await review('0.01'); ok('worksWithOneServer',r4.rv===true);
 // 5) Avto-qulf: mutlaq vaqt
 await pg.evaluate(()=>{const o=Date.now; window.__o=o; Date.now=()=>o()+8*3600e3}); await pg.evaluate(()=>dispatchEvent(new Event('focus'))); await pg.waitForTimeout(500);
 ok('lockedAfterTimeJump',await pg.evaluate(()=>key===null&&!document.querySelector('#pg-home:not([hidden])')));
 await pg.evaluate(()=>{Date.now=window.__o});
 // 6) Yashirin holatda ushlab turish
 await pg.reload(); await pg.waitForSelector('#go'); const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000});
 ok('staysUnlockedNormally',await pg.evaluate(()=>{dispatchEvent(new Event('focus'));return key!==null}));
 await pg.evaluate(()=>{hiddenAt=Date.now()-3*60e3}); await pg.evaluate(()=>dispatchEvent(new Event('focus'))); await pg.waitForTimeout(400);
 ok('lockedAfterLongHidden',await pg.evaluate(()=>key===null));
 // 7) Ramka himoyasi
 const p2=await ctx.newPage(); p2.on('pageerror',()=>{});
 await p2.setContent(`<iframe id=f src="http://localhost:${port}/index.html" style="width:390px;height:800px"></iframe>`); await p2.waitForTimeout(2000);
 const fr=p2.frames().find(f=>f!==p2.mainFrame()); ok('frameEmpty',!!fr&&await fr.evaluate(()=>!document.querySelector('#app')&&!document.querySelector('#t-create')));
 R.errs=errs.filter(e=>!/Ramka/.test(e)); console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||R.errs.length?1:0);
})().catch(e=>{console.error('FAIL',String(e.stack).slice(0,800));console.log(JSON.stringify(R,null,1));process.exit(1)});
