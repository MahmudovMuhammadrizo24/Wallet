const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'text/javascript'}); r.end(fs.readFileSync(f))}).listen(+port);
const CH='qpzry9x8gf2tvdw0s3jn54khce6mua7l'; const bech=a=>{const s=a.slice(a.lastIndexOf('1')+1,-6);const v=[...s].map(c=>CH.indexOf(c));let acc=0,bits=0,out=[];for(const x of v.slice(1)){acc=(acc<<5)|x;bits+=5;if(bits>=8){bits-=8;out.push((acc>>bits)&255);acc&=(1<<bits)-1}}return Buffer.from(out).toString('hex')};
const BTC_TO='bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'; const R={}; let posts=[], own='';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const pg=await ctx.newPage();
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const u=r.request().url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  if(/\/tx$/.test(u)&&r.request().method()==='POST'){posts.push(r.request().postData()); return r.fulfill({status:200,contentType:'text/plain',body:'f'.repeat(64)})}
  if(/mempool\.space\/api|blockstream/.test(u)){ if(/\/utxo/.test(u))return J([{txid:'a'.repeat(64),vout:0,value:5000000,status:{confirmed:true}}]); if(/fee-estimates/.test(u))return J({1:20,3:12,6:8,144:2});
   const am=u.match(/\/address\/([^/?]+)$/); if(am)return J({chain_stats:{funded_txo_sum:5000000,spent_txo_sum:0,tx_count:1},mempool_stats:{funded_txo_sum:0,spent_txo_sum:0,tx_count:0}}); return J([])}
  if(/coingecko/.test(u))return J({bitcoin:{usd:97000}}); return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 own=await pg.evaluate(()=>data.items.find(x=>x.coin==='BTC').address); const id=await pg.evaluate(()=>data.items.find(x=>x.coin==='BTC').id);
 await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',BTC_TO); await pg.fill('#sd-amt','0.01'); await pg.click('#sd-next');
 await pg.waitForSelector('#rv-go'); 
 // HUJUM: ko'rib chiqish ochiq turganda forma maydonlarini va holatni almashtirish
 await pg.evaluate(()=>{const t=document.querySelector('#sd-to'); if(t) t.value='bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; const a=document.querySelector('#sd-amt'); if(a) a.value='0.5'});
 if(await pg.$('#rv-last')) await pg.fill('#rv-last',BTC_TO.slice(-6));
 await pg.check('#rv-ok'); const ins=await pg.$$('#rv-wb input'); for(let i=0;i<ins.length;i++) await ins[i].fill(words[i]);
 // ikki marta tez bosish
 await pg.evaluate(()=>{const g=document.querySelector('#rv-go'); g.click(); g.click(); g.click()}); await pg.waitForTimeout(3500);
 R.broadcasts=posts.length;
 if(posts[0]){ const h=Buffer.from(posts[0],'hex'); let o=4; const seg=h[o]===0&&h[o+1]===1; if(seg)o+=2; const nin=h[o++]; o+=nin*(32+4+1+4); const nout=h[o++]; const outs=[]; for(let i=0;i<nout;i++){const v=h.readBigUInt64LE(o);o+=8;const l=h[o++];outs.push({sat:Number(v),script:h.subarray(o,o+l).toString('hex')});o+=l}
  R.tx={segwit:seg,inputs:nin,outs}; R.expect={recipientScript:'0014'+bech(BTC_TO),ownScript:'0014'+bech(own)};
  R.recipientOutOk=outs[0]&&outs[0].script===R.expect.recipientScript&&outs[0].sat===1000000; R.changeToOwn=outs[1]&&outs[1].script===R.expect.ownScript; const sum=5000000-outs.reduce((a,x)=>a+x.sat,0); R.feeSat=sum; }
 console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,400));console.log(JSON.stringify(R));process.exit(1)});
