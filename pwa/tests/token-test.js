const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv; const SH='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/shots/'; const PROBES='/mnt/skills/plugin-files/0d07a0ac-4262-4453-bbc9-01ee3cc8d90f/scripts/';
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
global.R={}; const R=global.R; const USDC='0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', DAI='0x6b175474e89094c44da98b954eedeac495271d0f', USDT='0xdac17f958d2ee523a2206206994597c13d831ec7';
const REC='0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
// minimal RLP decoder
function dec(b,o=0){const x=b[o];if(x<0x80)return[b.slice(o,o+1),o+1];if(x<0xb8){const l=x-0x80;return[b.slice(o+1,o+1+l),o+1+l]}if(x<0xc0){const ll=x-0xb7;let l=0;for(let i=0;i<ll;i++)l=l*256+b[o+1+i];return[b.slice(o+1+ll,o+1+ll+l),o+1+ll+l]}let l,s;if(x<0xf8){l=x-0xc0;s=o+1}else{const ll=x-0xf7;l=0;for(let i=0;i<ll;i++)l=l*256+b[o+1+i];s=o+1+ll}const out=[];let p=s;while(p<s+l){const[v,n]=dec(b,p);out.push(v);p=n}return[out,s+l]}
const hex=u=>Buffer.from(u).toString('hex');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[]; const hosts=new Set();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text())});
 await pg.route(u=>!u.href.startsWith('http://localhost'),async r=>{const req=r.request(),u=req.url(); hosts.add(new URL(u).host);
  if(/publicnode|llamarpc|cloudflare-eth/.test(u)){const j=JSON.parse(req.postData()||'{}'); const m=j.method,p=j.params||[]; let res;
   if(m==='eth_call'){const to=p[0].to.toLowerCase(); res=to===USDC?'0x'+(1500000n).toString(16):to===DAI?'0x'+(2500000000000000000n).toString(16):to===USDT?'0x'+(7000000n).toString(16):'0x0'}
   else if(m==='eth_getBalance')res='0x'+(10n**16n).toString(16); else if(m==='eth_getTransactionCount')res='0x1';
   else if(m==='eth_getBlockByNumber')res={baseFeePerGas:'0x3b9aca00',number:'0x1'}; else if(m==='eth_maxPriorityFeePerGas')res='0x59682f00'; else if(m==='eth_estimateGas')res='0xfde8'; else res='0x0';
   return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result:res})})}
  if(/coingecko/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({bitcoin:{usd:97000},ethereum:{usd:3400},tether:{usd:1},tron:{usd:.25},solana:{usd:180},'usd-coin':{usd:1},dai:{usd:1}})});
  if(/blockscout/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[{transaction_hash:'0xabc',timestamp:'2026-11-01T10:00:00Z',token:{address_hash:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'},from:{hash:'0x1111111111111111111111111111111111111111'},to:{hash:'ME'},total:{value:'2500000'}}]})});
  return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-add'); await pg.waitForSelector('#tk-add'); await pg.screenshot({path:SH+'tk-add.png',fullPage:true});
 await pg.selectOption('#tk-sel','USDC_ERC20'); await pg.click('#tk-add'); await pg.waitForTimeout(500); R.addUsdc=await pg.$eval('#tk-msg',e=>e.textContent);
 await pg.click('#tk-add'); await pg.waitForTimeout(200); R.dupUsdc=await pg.$eval('#tk-msg',e=>e.textContent);
 await pg.selectOption('#tk-sel','DAI_ERC20'); await pg.click('#tk-add'); await pg.waitForTimeout(800);
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(1500);
 R.rows=await pg.$$eval('#list > *',e=>e.filter(x=>!x.classList.contains('ngp-row')).map(x=>x.innerText.replace(/\s+/g,' ').slice(0,90)));
 await pg.screenshot({path:SH+'tk-assets.png',fullPage:true});
 // yuborish: USDC
 const id=await pg.evaluate(()=>data.items.find(x=>x.coin==='USDC_ERC20').id);
 await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to');
 await pg.fill('#sd-to',REC); await pg.fill('#sd-amt','1.25'); await pg.click('#sd-next'); await pg.waitForSelector('#sd-review:not([hidden]) .rv',{timeout:20000});
 R.review=await pg.$eval('#sd-review',e=>e.innerText.replace(/\s+/g,' ').slice(0,420));
 const signed=await pg.evaluate(async w=>{const s=await PANEL.send.quote.sign(w); return {raw:s.raw,hash:s.hash}},words.join(' '));
 const raw=Buffer.from(signed.raw.replace(/^0x/,''),'hex'); R.type=raw[0]; const [f]=dec(raw,1); // [chainId,nonce,tip,maxFee,gas,to,value,data,...]
 R.tx={chainId:hex(f[0]),to:'0x'+hex(f[5]),value:hex(f[6]),selector:hex(f[7]).slice(0,8),recipient:'0x'+hex(f[7]).slice(8+24,8+64),amount:BigInt('0x'+hex(f[7]).slice(8+64,8+128)).toString()};
 R.txOk = R.tx.to===USDC && R.tx.selector==='a9059cbb' && R.tx.recipient===REC.toLowerCase() && R.tx.amount==='1250000' && R.tx.value==='';
 // DAI yuborish: decimals 18
 const id2=await pg.evaluate(()=>data.items.find(x=>x.coin==='DAI_ERC20').id);
 await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id2); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',REC); await pg.fill('#sd-amt','0.5'); await pg.click('#sd-next'); await pg.waitForSelector('#sd-review:not([hidden]) .rv',{timeout:20000});
 const s2=await pg.evaluate(async w=>{const s=await PANEL.send.quote.sign(w); return {raw:s.raw}},words.join(' ')); const r2=Buffer.from(s2.raw.replace(/^0x/,''),'hex'); const [f2]=dec(r2,1);
 R.dai={to:'0x'+hex(f2[5]),amount:BigInt('0x'+hex(f2[7]).slice(8+64,8+128)).toString()}; R.daiOk=R.dai.to===DAI&&R.dai.amount==='500000000000000000';
 // token shartnomasining o'ziga yuborish rad etiladi; balansdan ko'p
 await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to','0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'); await pg.fill('#sd-amt','1'); await pg.click('#sd-next'); await pg.waitForTimeout(800); R.toContract=await pg.$eval('#sd-msg',e=>e.textContent);
 await pg.fill('#sd-to',REC); await pg.fill('#sd-amt','9'); await pg.click('#sd-next'); await pg.waitForTimeout(800); R.tooMuch=await pg.$eval('#sd-msg',e=>e.textContent);
 // tarix va qabul
 await pg.evaluate(i=>{location.hash='#/asset/'+i+'/hist'},id); await pg.waitForTimeout(1500); R.hist=await pg.$eval('#rp-hist',e=>e.innerText.replace(/\s+/g,' ').slice(0,200));
 await pg.evaluate(i=>{location.hash='#/asset/'+i+'/recv'},id); await pg.waitForTimeout(300); R.recv=await pg.$eval('#recv-net',e=>e.textContent);
 // saqlash: qayta kirgach tokenlar qoladi
 await pg.reload(); await pg.waitForSelector('#go'); const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000});
 R.afterReload=await pg.evaluate(()=>data.items.map(x=>x.coin).join(','));
 const core=JSON.parse(await pg.evaluate(fs.readFileSync(PROBES+'probe-core.js','utf8'))); R.probe={c:core.contrast.measured,f:core.contrast.failures.length,small:core.tapTargets.tooSmall.length,ov:core.layout.horizontalOverflow};
 R.hosts=[...hosts]; R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,300));console.log(JSON.stringify(global.R,null,1));process.exit(1)});
