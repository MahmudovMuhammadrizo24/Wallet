const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv; const P2=+port+1;
const app=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)||p.includes('_headers')){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
// hujumchi sayti: hamyonni ko'rinmas (opacity .01) iframe ga joylaydi, ustiga "yutuq" tugmasi qo'yadi
const evil=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html'}); r.end(`<body style="margin:0"><iframe id="v" src="http://127.0.0.1:${port}/index.html" style="position:absolute;inset:0;width:390px;height:844px;opacity:.01;border:0"></iframe><button style="position:absolute;left:100px;top:300px">Sovg'ani oling</button></body>`)}).listen(P2);
const R={}; const BTC_TO='bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[]; let own='', mode='normal';
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR|CSP|Content Security|Refused/.test(m.text()))errs.push(m.text())});
 await pg.route(u=>!/^http:\/\/(localhost|127\.0\.0\.1)/.test(u.href),async r=>{const u=r.request().url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  if(/mempool\.space\/api|blockstream/.test(u)){
   if(/\/utxo/.test(u))return J(Array.from({length:mode==='dust'?60:1},(_,i)=>({txid:(i+1).toString(16).padStart(64,'a'),vout:0,value:mode==='dust'?3000:5000000,status:{confirmed:true}})));
   if(/fee-estimates/.test(u))return J(mode==='evilfee'||mode==='dust'?{1:1000,3:1000,6:1000,144:1000}:{1:20,3:12,6:8,144:2});
   const am=u.match(/\/address\/([^/?]+)$/); if(am)return J({chain_stats:{funded_txo_sum:5000000,spent_txo_sum:0,tx_count:1},mempool_stats:{funded_txo_sum:0,spent_txo_sum:0,tx_count:0}});
   return r.abort()}
  if(/coingecko/.test(u))return J({bitcoin:{usd:97000}}); return r.abort()});
 // 1) CLICKJACKING: hujumchi sayti hamyonni iframe ichida ko'rsata oladimi?
 const ev=await ctx.newPage(); await ev.goto(`http://127.0.0.1:${P2}/`); await ev.waitForTimeout(1500);
 const fr=ev.frames().find(f=>f.url().includes(`127.0.0.1:${port}`)); R.clickjacking={framed:!!fr, rendersWallet: fr? await fr.evaluate(()=>!!document.querySelector('#t-create')||!!document.querySelector('#go')).catch(()=>false):false}; await ev.close();
 // 2) ROUTER in'ektsiyasi
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 own=await pg.evaluate(()=>data.items.find(x=>x.coin==='BTC').address);
 const payloads=['#/asset/"><img src=x id=pwn1>/send','#/asset/<svg id=pwn2 onload=alert(1)>','#/contacts?x=<b id=pwn3>','#/asset/__proto__/send','#/asset/constructor','#/mining/<i id=pwn4>','#/%3Cimg%20id=pwn5%20src=x%3E','#/asset//send','#/asset/'+'A'.repeat(5000)];
 const inj=[]; for(const h of payloads){ await pg.evaluate(h=>{location.hash=h},h); await pg.waitForTimeout(250); inj.push({h:h.slice(0,40),pwn:await pg.evaluate(()=>[...document.querySelectorAll('[id^=pwn]')].map(e=>e.id)),page:await pg.evaluate(()=>{const p=document.querySelector('.page:not([hidden])');return p?p.id:null})}) }
 R.router={injected:inj.filter(x=>x.pwn.length).length,pages:inj.map(x=>x.page)};
 // 3) BTC: soxta komissiya serveri
 const send=async(amt)=>{const id=await pg.evaluate(()=>data.items.find(x=>x.coin==='BTC').id); await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(150); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',BTC_TO); await pg.fill('#sd-amt',amt); await pg.click('#sd-next');
  await pg.waitForFunction(()=>{const r=document.querySelector('#sd-review');return (r&&!r.hidden&&r.querySelector('.rv'))||(m=>m.length>0&&!/Hisoblan/.test(m))(document.querySelector('#sd-msg').textContent)},null,{timeout:20000});
  return (await pg.$eval('#sd-review',e=>!e.hidden))?{fee:await pg.$$eval('#sd-review dt',e=>{const d=e.find(x=>x.textContent==='Komissiya');return d.nextElementSibling.textContent}),warns:await pg.$$eval('#sd-review .warn',e=>e.map(x=>x.textContent.slice(0,50)))}:{err:await pg.$eval('#sd-msg',e=>e.textContent)}};
 mode='normal'; R.feeNormal=await send('0.01'); mode='evilfee'; R.feeEvil=await send('0.01'); mode='dust'; R.feeDust=await send('0.0001');
 // 4) ekranda maxfiy so'zlar qolyaptimi
 mode='normal'; await pg.evaluate(()=>{location.hash='#/home'}); await pg.click('#lock'); await pg.waitForSelector('#go');
 const leak=await pg.evaluate(w=>{const out={};const html=document.documentElement.outerHTML.toLowerCase();out.domHasPhrase=w.filter(x=>x.length>3&&html.includes('>'+x+'<')).length;out.inputValues=[...document.querySelectorAll('input')].map(i=>i.value).filter(v=>v&&w.includes(v.trim())).length;out.local=Object.entries(localStorage).filter(([k,v])=>w.some(x=>x.length>4&&v.includes(x))).map(([k])=>k);out.session=Object.keys(sessionStorage).length;out.title=document.title;out.url=location.href;return out},words);
 R.leaks=leak; R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); app.close(); evil.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,500));console.log(JSON.stringify(R,null,1));process.exit(1)});
