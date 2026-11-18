const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const BTC_TO='bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', SOL_TO='So11111111111111111111111111111111111111112';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[]; let own='', bsHits=0, mpHits=0;
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text())});
 await pg.route(u=>!u.href.startsWith('http://localhost'),async r=>{const req=r.request(),u=req.url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  if(/blockstream/.test(u)){bsHits++;return r.abort()}
  if(/mempool\.space\/api/.test(u)){mpHits++;
   if(/\/address\/[^/]+\/utxo/.test(u))return J([{txid:'a'.repeat(64),vout:0,value:200000,status:{confirmed:true}}]);
   if(/fee-estimates/.test(u))return J({1:20,3:15,6:10,144:2});
   const am=u.match(/\/address\/([^/?]+)$/); if(am){const mine=am[1]===own; return J({chain_stats:{funded_txo_sum:mine?100000000:0,spent_txo_sum:0,tx_count:mine?1:0},mempool_stats:{funded_txo_sum:0,spent_txo_sum:0,tx_count:0}})}
   return r.abort()}
  if(/solana/.test(u)){const j=JSON.parse(req.postData()||'{}'); const m=j.method; let res;
   if(m==='getLatestBlockhash')res={value:{blockhash:'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N',lastValidBlockHeight:1}}; else if(m==='getBalance')res={value:1000000000}; else if(m==='getAccountInfo')res={value:null}; else res=null;
   return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result:res})})}
  if(/coingecko/.test(u))return J({bitcoin:{usd:97000},solana:{usd:180}});
  return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 own=await pg.evaluate(()=>data.items.find(x=>x.coin==='BTC').address);
 // 1) BTC balans zaxira serverdan
 await pg.evaluate(()=>{refresh&&refresh()}); await pg.waitForFunction(()=>/1(\.0+)? ?BTC/.test(document.querySelector('#pg-assets').textContent+document.querySelector('#pg-home').textContent),null,{timeout:20000}).catch(()=>{});
 R.btcBalanceViaFallback={bs:bsHits,mp:mpHits,balance:await pg.evaluate(()=>{const it=data.items.find(x=>x.coin==='BTC');return balances[it.id]})};
 // 2) yuborish: yangi manzil ogohlantirishi
 const send=async(coin,to,amt)=>{const id=await pg.evaluate(c=>data.items.find(x=>x.coin===c).id,coin); await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(200); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',to); await pg.fill('#sd-amt',amt); await pg.click('#sd-next');
  await pg.waitForFunction(()=>{const r=document.querySelector('#sd-review');return (r&&!r.hidden&&r.querySelector('.rv'))||(m=>m.length>0&&!/Hisoblan/.test(m))(document.querySelector('#sd-msg').textContent)},null,{timeout:20000});
  return (await pg.$eval('#sd-review',e=>!e.hidden))?{warns:await pg.$$eval('#sd-review .warn',e=>e.map(x=>x.textContent.slice(0,60)))}:{err:await pg.$eval('#sd-msg',e=>e.textContent)}};
 R.btcSend=await send('BTC',BTC_TO,'0.0005'); R.solSend=await send('SOL',SOL_TO,'0.01');
 // 3) xato holati
 await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(200);
 const id=await pg.evaluate(()=>data.items.find(x=>x.coin==='BTC').id); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to');
 await pg.fill('#sd-to','xyz'); await pg.fill('#sd-amt','0.001'); await pg.click('#sd-next'); await pg.waitForTimeout(600);
 R.invalid={to:await pg.$eval('#sd-to',e=>e.getAttribute('aria-invalid')),msg:await pg.$eval('#sd-msg',e=>e.textContent)};
 await pg.fill('#sd-to',BTC_TO); await pg.fill('#sd-amt','0'); await pg.click('#sd-next'); await pg.waitForTimeout(600);
 R.invalid2={to:await pg.$eval('#sd-to',e=>e.getAttribute('aria-invalid')),amt:await pg.$eval('#sd-amt',e=>e.getAttribute('aria-invalid'))};
 // 4) PIN uzunligi
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-card');
 const dlg=async v=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(150)};
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291'); R.pin5=await pg.$eval('#pin-note',e=>e.textContent);
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('123123'); R.pinRepeat=await pg.$eval('#pin-note',e=>e.textContent);
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291537'); await dlg('48291537'); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:15000}); R.pin8='set';
 await pg.click('#lock'); await pg.waitForSelector('#pin-in'); R.maxlen=await pg.$eval('#pin-in',e=>e.maxLength);
 await pg.fill('#pin-in','482915'); await pg.click('#pin-go'); await pg.waitForFunction(()=>document.querySelector('#pin-msg').textContent.includes('Qolgan'),null,{timeout:15000}); R.pinWrongInvalid=await pg.$eval('#pin-in',e=>e.getAttribute('aria-invalid'));
 await pg.fill('#pin-in','48291537'); await pg.click('#pin-go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); R.unlock8=true;
 // 5) 6 xonali eski PIN ham ishlaydi
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.evaluate(async p=>{await pinSeal(p,'482915','pin')},words.join(' '));
 await pg.click('#lock'); await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in','482915'); await pg.click('#pin-go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); R.unlock6=true;
 // 6) hover / busy CSS mavjud
 R.css=await pg.evaluate(()=>{const t=[...document.styleSheets].flatMap(s=>[...s.cssRules]).map(r=>r.cssText).join('\n');return{hover:/hover:hover/.test(t),busy:/aria-busy/.test(t),coin:getComputedStyle(document.documentElement).getPropertyValue('--coin-btc').trim()}});
 // 7) buzilgan ma'lumot (salt yo'q) -> boshqa xabar
 await pg.evaluate(()=>{localStorage.setItem('cw_salt','!!!')}); await pg.reload(); await pg.waitForSelector('#go');
 const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForFunction(()=>/Saqlangan|mos kelmadi/.test(document.querySelector('#msg').textContent),null,{timeout:20000}); R.corrupt=await pg.$eval('#msg',e=>e.textContent);
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,400));console.log(JSON.stringify(R,null,1));process.exit(1)});
