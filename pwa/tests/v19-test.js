const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
function dec(b,o=0){const x=b[o];if(x<0x80)return[b.slice(o,o+1),o+1];if(x<0xb8){const l=x-0x80;return[b.slice(o+1,o+1+l),o+1+l]}if(x<0xc0){const ll=x-0xb7;let l=0;for(let i=0;i<ll;i++)l=l*256+b[o+1+i];return[b.slice(o+1+ll,o+1+ll+l),o+1+ll+l]}let l,s;if(x<0xf8){l=x-0xc0;s=o+1}else{const ll=x-0xf7;l=0;for(let i=0;i<ll;i++)l=l*256+b[o+1+i];s=o+1+ll}const out=[];let p=s;while(p<s+l){const[v,n]=dec(b,p);out.push(v);p=n}return[out,s+l]}
const hex=u=>Buffer.from(u).toString('hex'); const R={}; const REC='0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const CH={eth:{id:1,tip:'0x59682f00',nat:true},polygon:{id:137,tip:'0x6fc23ac00'},arbitrum:{id:42161,tip:'0x0'},optimism:{id:10,tip:'0xf4240'},avalanche:{id:43114,tip:'0xf4240'},bsc:{id:56,tip:'0x2faf080'}};
const TOK={ // kichik harf manzil -> [dec, symbol]
 '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48':[6,'USDC'],'0x3c499c542cef5e3811e1192ce70d8cc03d5c3359':[6,'USDC'],'0xaf88d065e77c8cc2239327c5edb3a432268e5831':[6,'USDC'],'0x0b2c639c533813f4aa9d7837caf62653d097ff85':[6,'USDC'],'0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e':[6,'USDC'],'0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d':[18,'USDC'],
 '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599':[8,'WBTC'],'0x514910771af9ca656af840dff83e8264ecf986ca':[18,'LINK'],'0x1f9840a85d5af5bf1d1762f925bdaddc4201f984':[18,'UNI'],'0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce':[18,'SHIB'],'0x6b175474e89094c44da98b954eedeac495271d0f':[18,'DAI'],
 '0xc2132d05d31c914a87c6611c10748aeb04b58e8f':[6,'USDT'],'0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9':[6,'USDT'],'0x94b008aa00579c1307b0ef2c499ad98a8ce58e58':[6,'USDT'],'0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7':[6,'USDT'],'0x55d398326f99059ff775485246999027b3197955':[18,'USDT'],'0xdac17f958d2ee523a2206206994597c13d831ec7':[6,'USDT']};
const which=u=>/polygon/.test(u)?'polygon':/arbitrum|arb1/.test(u)?'arbitrum':/optimism/.test(u)?'optimism':/avalanche|avax/.test(u)?'avalanche':/bsc/.test(u)?'bsc':/cloudflare-eth|llamarpc|ethereum-rpc/.test(u)?'eth':null;
let evil=null; const sent=[];
const abiStr=s=>'0x'+'20'.padStart(64,'0')+s.length.toString(16).padStart(64,'0')+Buffer.from(s).toString('hex').padEnd(64,'0');
const A58='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; const b58hex=s=>{let n=0n;for(const c of s)n=n*58n+BigInt(A58.indexOf(c));return n.toString(16).padStart(50,'0').slice(0,42)};
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[];
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const req=r.request(),u=req.url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  const c=which(u);
  if(c&&req.method()==='POST'){const j=JSON.parse(req.postData()||'{}'),m=j.method,p=j.params||[],C=CH[c]; let res='0x0';
   if(m==='eth_chainId')res='0x'+((evil==='bnbchain'&&c==='bsc')?1:C.id).toString(16);
   else if(m==='eth_call'){const d=(p[0].data||''),t=TOK[(p[0].to||'').toLowerCase()]||[18,'XXX']; if(d.startsWith('0x313ce567'))res='0x'+t[0].toString(16).padStart(64,'0'); else if(d.startsWith('0x95d89b41'))res=abiStr(t[1]); else if(d.startsWith('0x70a08231'))res='0x'+(5n*10n**BigInt(t[0])).toString(16)}
   else if(m==='eth_getBalance')res='0x'+(10n**18n).toString(16); else if(m==='eth_getTransactionCount')res='0x7';
   else if(m==='eth_getBlockByNumber')res={baseFeePerGas:c==='bsc'?'0x0':'0x3b9aca00',number:'0x1'}; else if(m==='eth_maxPriorityFeePerGas')res=C.tip; else if(m==='eth_estimateGas')res='0xfde8'; else if(m==='eth_getCode')res='0x';
   else if(m==='eth_sendRawTransaction'){sent.push({c,raw:p[0]});res='0x'+'ab'.repeat(32)}
   return J({jsonrpc:'2.0',id:j.id||1,result:res})}
  if(/solana/.test(u)&&req.method()==='POST'){const j=JSON.parse(req.postData()||'{}'); let res=null; if(j.method==='getTokenAccountsByOwner'){const mint=j.params[1].mint; res={value:[{account:{data:{parsed:{info:{mint,tokenAmount:{uiAmount:12.5,decimals:6}}}}}},{account:{data:{parsed:{info:{mint:'EVIL1111111111111111111111111111111111111111',tokenAmount:{uiAmount:999,decimals:6}}}}}}]}} else if(j.method==='getBalance')res={value:1e9}; return J({jsonrpc:'2.0',id:j.id||1,result:res})}
  if(/coingecko/.test(u))return J({bitcoin:{usd:97000},ethereum:{usd:3400},tether:{usd:1},'usd-coin':{usd:1},dai:{usd:1},tron:{usd:.25},solana:{usd:180},'polygon-ecosystem-token':{usd:.5},'avalanche-2':{usd:30},binancecoin:{usd:600},'wrapped-bitcoin':{usd:97000},chainlink:{usd:15},uniswap:{usd:8},'shiba-inu':{usd:0.00002}});
  return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 // 1) EIP-55: barcha yangi manzillar nazorat yig'indisi bilan o'tishi kerak
 const addrs=['0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359','0xaf88d065e77c8cC2239327C5EDb3A432268e5831','0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85','0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E','0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d','0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599','0x514910771AF9Ca656af840dff83E8264EcF986CA','0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984','0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE'];
 R.eip55=await pg.evaluate(a=>a.map(x=>{const i=WL.ethInfo(x);return !!(i&&i.address===x&&i.hadChecksum)}),addrs);
 R.tronAddrOk=await pg.evaluate(()=>[WL.tronInfo('TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'),WL.tronInfo('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')].map(x=>!!x));
 // 2) hammasini qo'shish
 await pg.click('#nav-add'); await pg.waitForSelector('#tk-add');
 R.optGroups=await pg.$$eval('#tk-sel optgroup',e=>e.map(x=>x.label+':'+x.children.length));
 await pg.selectOption('#tk-sel','ALL'); await pg.click('#tk-add'); await pg.waitForTimeout(600); R.addMsg=await pg.$eval('#tk-msg',e=>e.textContent);
 R.itemCount=await pg.evaluate(()=>data.items.length);
 await pg.click('#tk-add'); await pg.waitForTimeout(300); R.addAgain=await pg.$eval('#tk-msg',e=>e.textContent); R.itemCount2=await pg.evaluate(()=>data.items.length);
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(3500);
 R.structure=await pg.$$eval('#list > tr:not(.ngp-row)',e=>e.map(x=>x.classList.contains('ng')?'## '+x.querySelector('th').innerText.replace(/\s+/g,' '):'   '+x.querySelector('.a-n').innerText.replace(/\s+/g,' ')));
 R.nullBalances=await pg.evaluate(()=>data.items.filter(it=>balances[it.id]===null||balances[it.id]===undefined).map(it=>it.coin));
 R.balSample=await pg.evaluate(()=>Object.fromEntries(['POL','ETH_ARB','BNB','USDC_BSC','WBTC_ERC20','SHIB_ERC20','USDC_SOLANA','USDC_TRC20'].map(k=>[k,balances[data.items.find(x=>x.coin===k).id]])));
 // 3) yuborish
 const send=async(key,amt)=>{const id=await pg.evaluate(k=>data.items.find(x=>x.coin===k).id,key); await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(150); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',REC); await pg.fill('#sd-amt',amt); await pg.click('#sd-next');
  await pg.waitForFunction(()=>{const r=document.querySelector('#sd-review');return (r&&!r.hidden&&r.querySelector('.rv'))||(m=>m.length>0&&!/Hisoblan/.test(m))(document.querySelector('#sd-msg').textContent)},null,{timeout:20000});
  if(!(await pg.$eval('#sd-review',e=>!e.hidden))) return {err:await pg.$eval('#sd-msg',e=>e.textContent)};
  const warn=await pg.$$eval('#sd-review .warn',e=>e.map(x=>x.textContent.slice(0,90)));
  const s=await pg.evaluate(async w=>{const s=await PANEL.send.quote.sign(w); return {raw:s.raw}},words.join(' ')); const raw=Buffer.from(s.raw.replace(/^0x/,''),'hex'); const [f]=dec(raw,1);
  return {warn,chainId:parseInt(hex(f[0]),16),to:'0x'+hex(f[5]),value:BigInt('0x'+(hex(f[6])||'0')),data:hex(f[7]),selector:hex(f[7]).slice(0,8),recipient:'0x'+hex(f[7]).slice(8+24,8+64),amount:hex(f[7]).length>=136?BigInt('0x'+hex(f[7]).slice(8+64,8+128)):null}};
 const NAT=[['POL','0.5',137],['AVAX','0.25',43114],['BNB','0.1',56],['ETH_ARB','0.01',42161],['ETH_OP','0.01',10]];
 for(const [k,a,cid] of NAT){const r=await send(k,a); const exp=BigInt(Math.round(parseFloat(a)*1e8))*10n**10n; R['nat_'+k]=r.err?r:{ok:r.chainId===cid&&r.to===REC.toLowerCase()&&r.value===exp&&r.data==='',warn:r.warn[0]}}
 const TK=[['USDC_POLYGON','1.25',6,137,'0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'],['USDC_ARBITRUM','1.25',6,42161,'0xaf88d065e77c8cc2239327c5edb3a432268e5831'],['USDC_OPTIMISM','1.25',6,10,'0x0b2c639c533813f4aa9d7837caf62653d097ff85'],['USDC_AVALANCHE','1.25',6,43114,'0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'],['USDC_BSC','2.5',18,56,'0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'],['WBTC_ERC20','0.5',8,1,'0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'],['LINK_ERC20','3.25',18,1,'0x514910771af9ca656af840dff83e8264ecf986ca'],['UNI_ERC20','2',18,1,'0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'],['SHIB_ERC20','2.5',18,1,'0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce']];
 for(const [k,a,d,cid,tok] of TK){const r=await send(k,a); const [i,fr='']=a.split('.'); const exp=BigInt(i+fr.padEnd(0,'0'))*10n**BigInt(d-fr.length); R['tok_'+k]=r.err?r:{ok:r.chainId===cid&&r.to===tok&&r.selector==='a9059cbb'&&r.recipient===REC.toLowerCase()&&r.amount===exp&&r.value===0n}}
 // 4) Solana tokenlari: yuborish yo'q
 R.splSend=await pg.evaluate(()=>['USDT_SOLANA','USDC_SOLANA'].map(k=>canSend(data.items.find(x=>x.coin===k))));
 // 5) Tron USDC imzosi: kutubxona faqat ikkita kontraktni biladi
 const trxAddr=await pg.evaluate(()=>data.items.find(x=>x.coin==='TRX').address);
 const sign=async(tokv)=>pg.evaluate(async([w,a,t])=>{const s=await WL.tronSign({mnemonic:w,from:a,tx:{kind:'usdt',token:t,to:'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',amount:1000000n,feeLimit:100000000,refBlockBytes:'abcd',refBlockHash:'0123456789abcdef',timestamp:1700000000000,expiration:1700000600000}}); return {hexd:s.raw_data_hex,c:s.raw_data.contract[0].parameter.value.contract_address}},[words.join(' '),trxAddr,tokv]);
 const USDC=b58hex('TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'), USDT=b58hex('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
 const sUsdc=await sign('usdc'), sUsdt=await sign(undefined), sEvil=await sign('evil');
 R.tronSign={usdcContract:sUsdc.c===USDC&&sUsdc.hexd.includes(USDC), usdtContract:sUsdt.c===USDT&&sUsdt.hexd.includes(USDT), evilFallsToUsdt:sEvil.c===USDT&&!sEvil.hexd.includes(USDC)};
 // 6) hujum: soxta zanjir BNB tarmog'ida
 const fresh=async()=>{await pg.reload(); await pg.waitForSelector('#go'); const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); await pg.waitForTimeout(2500)};
 evil='bnbchain'; await fresh(); R.evilBnbSend=await send('BNB','0.1'); R.evilBnbBal=await pg.evaluate(()=>balances[data.items.find(x=>x.coin==='BNB').id]);
 evil=null; await fresh(); R.afterEvil=await send('BNB','0.1').then(x=>x.chainId===56);
 R.afterReloadCount=await pg.evaluate(()=>data.items.length);
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,500));console.log(JSON.stringify(R,null,1));process.exit(1)});
