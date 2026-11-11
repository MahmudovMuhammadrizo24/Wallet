const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const P='<img src=x data-p=1>', R={};
const px={usd:P,usd_24h_change:P}; const price={bitcoin:px,ethereum:px,tether:px,tron:px,solana:px,'usd-coin':px,dai:px};
const tx={txid:P,hash:P,transaction_hash:P,timestamp:P,status:{confirmed:true,block_time:P},vin:[{prevout:{scriptpubkey_address:P,value:P}}],vout:[{scriptpubkey_address:P,value:P}],fee:P,from:{hash:P},to:{hash:P},total:{value:P},value:P,txID:P,block_timestamp:P,token:{address_hash:P},raw_data:{contract:[{type:P,parameter:{value:{amount:P,owner_address:P,to_address:P}}}]},ret:[{contractRet:P}]};
const generic={chain_stats:{funded_txo_sum:P,spent_txo_sum:P,tx_count:P},mempool_stats:{funded_txo_sum:P,spent_txo_sum:P},items:[tx,tx],data:[{balance:P,trc20:[{[P]:P}],...tx}],value:P,result:P,...price};
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[];
 pg.on('pageerror',e=>errs.push(e.message.slice(0,90)));
 await pg.route(u=>!u.href.startsWith('http://localhost'),r=>{const u=r.request().url(); let body;
  if(/coingecko/.test(u)) body=price; else if(/blockstream.*\/txs/.test(u)) body=[tx,tx]; else if(/mempool\.space/.test(u)) body=/hashrate/.test(u)?{hashrates:[{timestamp:P,avgHashrate:P}],currentHashrate:P,currentDifficulty:P}:/tip/.test(u)?P:{...generic,progressPercent:P,remainingBlocks:P,estimatedRetargetDate:P,difficultyChange:P,timeAvg:P,totalFee:P,totalReward:P,startBlock:P,endBlock:P};
  else if(/publicnode|llamarpc|cloudflare-eth|solana/.test(u)) body={jsonrpc:'2.0',id:1,result:P}; else body=generic;
  r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)})});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000}); await pg.waitForTimeout(2500);
 const inj=async tag=>{R[tag]=await pg.$$eval('img[data-p]',e=>e.length)};
 await inj('home'); await pg.evaluate(()=>{location.hash='#/assets'}); await pg.waitForTimeout(800); await inj('assets');
 const ids=await pg.evaluate(()=>data.items.map(x=>x.id));
 for(const [i,id] of ids.entries()){ await pg.evaluate(x=>{location.hash='#/asset/'+x+'/hist'},id); await pg.waitForTimeout(900); R['hist'+i]=await pg.$$eval('img[data-p]',e=>e.length); await pg.evaluate(x=>{location.hash='#/asset/'+x+'/recv'},id); await pg.waitForTimeout(300); }
 await pg.evaluate(()=>{location.hash='#/mining'}); await pg.waitForTimeout(1200); await inj('mining');
 R.textShowsRaw=(await pg.evaluate(()=>document.body.innerText.includes('<img'))); R.errs=[...new Set(errs)].slice(0,6);
 console.log(JSON.stringify(R)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,300));console.log(JSON.stringify(R));process.exit(1)});
