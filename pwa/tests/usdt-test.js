const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
function dec(b,o=0){const x=b[o];if(x<0x80)return[b.slice(o,o+1),o+1];if(x<0xb8){const l=x-0x80;return[b.slice(o+1,o+1+l),o+1+l]}if(x<0xc0){const ll=x-0xb7;let l=0;for(let i=0;i<ll;i++)l=l*256+b[o+1+i];return[b.slice(o+1+ll,o+1+ll+l),o+1+ll+l]}let l,s;if(x<0xf8){l=x-0xc0;s=o+1}else{const ll=x-0xf7;l=0;for(let i=0;i<ll;i++)l=l*256+b[o+1+i];s=o+1+ll}const out=[];let p=s;while(p<s+l){const[v,n]=dec(b,p);out.push(v);p=n}return[out,s+l]}
const hex=u=>Buffer.from(u).toString('hex'); const R={}; const REC='0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const CH={ polygon:{id:137,dec:6,tok:'0xc2132d05d31c914a87c6611c10748aeb04b58e8f',key:'USDT_POLYGON',tip:'0x6fc23ac00'}, arbitrum:{id:42161,dec:6,tok:'0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'.toLowerCase(),key:'USDT_ARBITRUM',tip:'0x0'}, optimism:{id:10,dec:6,tok:'0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',key:'USDT_OPTIMISM',tip:'0xf4240'}, avalanche:{id:43114,dec:6,tok:'0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',key:'USDT_AVALANCHE',tip:'0xf4240'}, bsc:{id:56,dec:18,tok:'0x55d398326f99059ff775485246999027b3197955',key:'USDT_BSC',tip:'0x2faf080'} };
const which=u=>/polygon/.test(u)?'polygon':/arbitrum|arb1/.test(u)?'arbitrum':/optimism/.test(u)?'optimism':/avalanche|avax/.test(u)?'avalanche':/bsc/.test(u)?'bsc':null;
let evil=null; const sent=[];
const abiStr=s=>'0x'+'20'.padStart(64,'0')+s.length.toString(16).padStart(64,'0')+Buffer.from(s).toString('hex').padEnd(64,'0');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[]; const hosts=new Set();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const req=r.request(),u=req.url(); hosts.add(new URL(u).host); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  const c=which(u);
  if(c&&req.method()==='POST'){const j=JSON.parse(req.postData()||'{}'),m=j.method,p=j.params||[],C=CH[c]; let res='0x0';
   if(m==='eth_chainId')res='0x'+((evil==='chain'&&c==='polygon')?1:C.id).toString(16);
   else if(m==='eth_call'){const d=(p[0].data||''); if(d.startsWith('0x313ce567'))res='0x'+((evil==='dec'&&c==='bsc')?6:C.dec).toString(16).padStart(64,'0'); else if(d.startsWith('0x95d89b41'))res=abiStr(evil==='sym'&&c==='arbitrum'?'SCAM':'USDT'); else if(d.startsWith('0x70a08231'))res='0x'+(5n*10n**BigInt(C.dec)).toString(16); else res='0x0'}
   else if(m==='eth_getBalance')res='0x'+(10n**18n).toString(16); else if(m==='eth_getTransactionCount')res='0x7';
   else if(m==='eth_getBlockByNumber')res={baseFeePerGas:c==='bsc'?'0x0':'0x3b9aca00',number:'0x1'}; else if(m==='eth_maxPriorityFeePerGas')res=C.tip; else if(m==='eth_estimateGas')res='0xfde8'; else if(m==='eth_getCode')res='0x';
   else if(m==='eth_sendRawTransaction'){sent.push({c,raw:p[0]});res='0x'+'ab'.repeat(32)}
   return J({jsonrpc:'2.0',id:j.id||1,result:res})}
  if(/solana/.test(u)&&req.method()==='POST'){const j=JSON.parse(req.postData()||'{}'); let res=null; if(j.method==='getTokenAccountsByOwner')res={value:[{account:{data:{parsed:{info:{mint:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',tokenAmount:{uiAmount:12.5,decimals:6}}}}}},{account:{data:{parsed:{info:{mint:'EVIL1111111111111111111111111111111111111111',tokenAmount:{uiAmount:999,decimals:6}}}}}}]}; else if(j.method==='getBalance')res={value:1000000000}; return J({jsonrpc:'2.0',id:j.id||1,result:res})}
  if(/coingecko/.test(u))return J({bitcoin:{usd:97000},ethereum:{usd:3400},tether:{usd:1},tron:{usd:.25},solana:{usd:180},'polygon-ecosystem-token':{usd:.5},'avalanche-2':{usd:30},binancecoin:{usd:600}});
  return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-add'); await pg.waitForSelector('#tk-add');
 R.optionCount=await pg.$$eval('#tk-sel option',e=>e.length);
 for(const k of ['USDT_POLYGON','USDT_ARBITRUM','USDT_OPTIMISM','USDT_AVALANCHE','USDT_BSC','USDT_SOLANA']){await pg.selectOption('#tk-sel',k); await pg.click('#tk-add'); await pg.waitForTimeout(250)}
 await pg.selectOption('#tk-sel','USDT_BSC'); await pg.click('#tk-add'); await pg.waitForTimeout(150); R.dup=await pg.$eval('#tk-msg',e=>e.textContent);
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(2500);
 R.rows=await pg.$$eval('#list > *',e=>e.filter(x=>!x.classList.contains('ngp-row')).map(x=>x.innerText.replace(/\s+/g,' ').slice(0,100)).filter(t=>/USDT/.test(t)));
 // yuborish har bir EVM tarmog'ida
 const send=async(key,amt,opts={})=>{const id=await pg.evaluate(k=>data.items.find(x=>x.coin===k).id,key); await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(150); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',REC); await pg.fill('#sd-amt',amt); await pg.click('#sd-next');
  await pg.waitForFunction(()=>{const r=document.querySelector('#sd-review');return (r&&!r.hidden&&r.querySelector('.rv'))||(m=>m.length>0&&!/Hisoblan/.test(m))(document.querySelector('#sd-msg').textContent)},null,{timeout:20000});
  if(!(await pg.$eval('#sd-review',e=>!e.hidden))) return {err:await pg.$eval('#sd-msg',e=>e.textContent)};
  const warn=await pg.$$eval('#sd-review .warn',e=>e.map(x=>x.textContent.slice(0,80))), fee=await pg.$$eval('#sd-review dt',e=>{const d=e.find(x=>x.textContent==='Komissiya');return d.nextElementSibling.textContent});
  const s=await pg.evaluate(async w=>{const s=await PANEL.send.quote.sign(w); return {raw:s.raw}},words.join(' ')); const raw=Buffer.from(s.raw.replace(/^0x/,''),'hex'); const [f]=dec(raw,1);
  return {warn,fee,type:raw[0],chainId:parseInt(hex(f[0]),16),tip:BigInt('0x'+(hex(f[2])||'0')).toString(),to:'0x'+hex(f[5]),value:hex(f[6]),selector:hex(f[7]).slice(0,8),recipient:'0x'+hex(f[7]).slice(8+24,8+64),amount:BigInt('0x'+hex(f[7]).slice(8+64,8+128)).toString()}};
 for(const [c,C] of Object.entries(CH)){ const amt=c==='bsc'?'2.5':'1.25'; const r=await send(C.key,amt); R['tx_'+c]=r.err?r:{ok:r.chainId===C.id&&r.to===C.tok&&r.selector==='a9059cbb'&&r.recipient===REC.toLowerCase()&&r.amount===(BigInt(amt.replace('.',''))*10n**BigInt(C.dec-(amt.split('.')[1].length))).toString()&&r.value==='',type:r.type,chainId:r.chainId,tipGwei:Number(r.tip)/1e9,fee:r.fee,warn0:r.warn[0]} }
 // Solana
 R.solRow=R.rows.find(t=>/SPL|Solana/.test(t));
 const sid=await pg.evaluate(()=>data.items.find(x=>x.coin==='USDT_SOLANA').id); R.solCanSend=await pg.evaluate(i=>{const it=data.items.find(x=>x.id===i);return canSend(it)},sid);
 await pg.evaluate(i=>{location.hash='#/asset/'+i+'/recv'},sid); await pg.waitForTimeout(300); R.solRecv=await pg.$eval('#recv-warn',e=>e.textContent.slice(-140)); R.solNet=await pg.$eval('#recv-net',e=>e.textContent);
 const pid=await pg.evaluate(()=>data.items.find(x=>x.coin==='USDT_POLYGON').id); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/recv'},pid); await pg.waitForTimeout(300); R.polyRecv=await pg.$eval('#recv-warn',e=>e.textContent.slice(-120));
 // hujum: soxta RPC (har safar yangi seans: tekshiruv natijasi sessiyada eslab qolinadi)
 const fresh=async()=>{await pg.reload(); await pg.waitForSelector('#go'); const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); await pg.waitForTimeout(1500)};
 evil='chain'; await fresh(); R.evilChain=await send('USDT_POLYGON','1'); R.evilChainBal=await pg.evaluate(()=>{const it=data.items.find(x=>x.coin==='USDT_POLYGON');return balances[it.id]});
 evil='dec'; await fresh(); R.evilDec=await send('USDT_BSC','1'); evil='sym'; await fresh(); R.evilSym=await send('USDT_ARBITRUM','1');
 evil=null; await fresh(); R.afterEvil=await send('USDT_POLYGON','1').then(x=>x.chainId===137);
 await pg.reload(); await pg.waitForSelector('#go'); const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000});
 R.afterReload=await pg.evaluate(()=>data.items.map(x=>x.coin).join(','));
 R.hosts=[...hosts].sort(); R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,400));console.log(JSON.stringify(R,null,1));process.exit(1)});
