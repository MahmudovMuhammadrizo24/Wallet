const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv; const SH=WORK+'/'; const PROBES=__dirname+'/';
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
global.R={}; const R=global.R; const USDC='0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', DAI='0x6b175474e89094c44da98b954eedeac495271d0f', USDT='0xdac17f958d2ee523a2206206994597c13d831ec7';
const CON='0x00000000219ab540356cbb839cbe05303d7705fa', NEW='0x1234567890123456789012345678901234567890';
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
   else if(m==='eth_getBalance')res=p[0].toLowerCase()===NEW?'0x0':'0x'+(10n**16n).toString(16); else if(m==='eth_getTransactionCount')res=p[0].toLowerCase()===NEW?'0x0':'0x1'; else if(m==='eth_getCode')res=p[0].toLowerCase()===CON?'0x6080604052':'0x';
   else if(m==='eth_getBlockByNumber')res={baseFeePerGas:'0x3b9aca00',number:'0x1'}; else if(m==='eth_maxPriorityFeePerGas')res='0x59682f00'; else if(m==='eth_estimateGas')res='0xfde8'; else res='0x0';
   return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result:res})})}
  if(/coingecko/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({bitcoin:{usd:97000},ethereum:{usd:3400},tether:{usd:1},tron:{usd:.25},solana:{usd:180},'usd-coin':{usd:1},dai:{usd:1}})});
  if(/blockscout/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[{transaction_hash:'0xabc',timestamp:'2026-11-01T10:00:00Z',token:{address_hash:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'},from:{hash:'0x1111111111111111111111111111111111111111'},to:{hash:'ME'},total:{value:'2500000'}}]})});
  return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});

 const id=await pg.evaluate(()=>data.items.find(x=>x.coin==='ETH').id);
 const tryTo=async(to,amt='0.001')=>{await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(200); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',to); await pg.fill('#sd-amt',amt); await pg.click('#sd-next');
  await pg.waitForFunction(()=>{const r=document.querySelector('#sd-review');return (r&&!r.hidden&&r.querySelector('.rv'))||(m=>m.length>0&&!/Hisoblan/.test(m))(document.querySelector('#sd-msg').textContent)},null,{timeout:20000});
  const rev=await pg.$eval('#sd-review',e=>!e.hidden); return rev?{warns:await pg.$$eval('#sd-review .warn',e=>e.map(x=>x.textContent.slice(0,70)))}:{err:await pg.$eval('#sd-msg',e=>e.textContent)}};
 let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
 const st=()=>pg.evaluate(()=>({lim:limitUsd(),sent:sent24h()}));
 R.def=await st(); ok('defaultLimit1000',R.def.lim===1000&&R.def.sent===0);
 // normal summa: limit ichida, blok yo'q
 let r=await tryTo(REC,'0.001'); ok('underLimitOpens',!r.err&&!(await pg.$('#sd-review .warn.lim'))&&await pg.$eval('#rv-ok',e=>!e.disabled));
 // limitni 5 dollarga tushiramiz (0.001 ETH ~ $3.4 ok, 0.002 ~ $6.8 blok)
 await pg.evaluate(()=>store.set('cw_limit','5'));
 r=await tryTo(REC,'0.001'); ok('belowFiveOk',await pg.$('#sd-review .warn.lim')===null);
 r=await tryTo(REC,'0.002'); R.block=await pg.$eval('#sd-review .warn.lim',e=>e.textContent).catch(()=>null); ok('overLimitBlocked',!!R.block&&/limit/i.test(R.block));
 ok('blockedControlsDisabled',await pg.$eval('#rv-go',e=>e.disabled)&&await pg.$eval('#rv-ok',e=>e.disabled));
 await pg.evaluate(()=>{document.querySelector('#rv-go').disabled=false;document.querySelector('#rv-go').click()}); await pg.waitForTimeout(300); ok('forcedClickStillBlocked',/limit/i.test(await pg.$eval('#rv-msg',e=>e.textContent).catch(()=>'')));
 // 24 soatlik hisob: $3 yuborilgan -> 0.001 ETH ($3.4) ham oshadi
 await pg.evaluate(()=>recordSent(3)); R.s1=await st(); ok('sentAccumulates',Math.abs(R.s1.sent-3)<1e-9);
 r=await tryTo(REC,'0.001'); ok('rollingSumBlocks',await pg.$('#sd-review .warn.lim')!==null);
 // 24 soatdan eskilari hisobdan chiqadi
 await pg.evaluate(()=>store.set('cw_sent',JSON.stringify([[Date.now()-25*3600e3,500],[Date.now()-1000,1]]))); R.s2=await st(); ok('oldEntriesExpire',Math.abs(R.s2.sent-1)<1e-9);
 // buzilgan hisob: xato bermaydi
 await pg.evaluate(()=>store.set('cw_sent','{bad json')); R.s3=await st(); ok('corruptSentSafe',R.s3.sent===0);
 await pg.evaluate(()=>{store.del('cw_sent');store.set('cw_limit','5')});
 // narx noma'lum bo'lsa bloklanadi
 await pg.evaluate(()=>{window.__p=prices; prices={}}); r=await tryTo(REC,'0.001'); ok('unknownPriceBlocks',await pg.$('#sd-review .warn.lim')!==null); await pg.evaluate(()=>{prices=window.__p});
 // off: limit yo'q
 await pg.evaluate(()=>store.set('cw_limit','off')); r=await tryTo(REC,'0.002'); ok('offDisablesLimit',await pg.$('#sd-review .warn.lim')===null);
 await pg.evaluate(()=>store.set('cw_limit','abc')); R.s4=await st(); ok('garbageLimitFallsBackToDefault',R.s4.lim===1000);
 // Xavfsizlik sahifasi: limitni o'zgartirish so'zlarni talab qiladi
 await pg.evaluate(()=>store.del('cw_limit')); await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#lim-set'); R.limState=await pg.$eval('#lim-state',e=>e.textContent); ok('limStateShown',/1,000/.test(R.limState));
 const dlg=async v=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(200)};
 await pg.click('#lim-set'); await dlg('wrong words here only'); await pg.waitForTimeout(300); ok('limChangeNeedsWords',(await st()).lim===1000);
 await pg.click('#lim-set'); await dlg(words.join(' ')); await dlg('250'); await pg.waitForTimeout(300); ok('limChanged',(await st()).lim===250&&/250/.test(await pg.$eval('#lim-state',e=>e.textContent)));
 await pg.click('#lim-set'); await dlg(words.join(' ')); await dlg('-5'); await pg.waitForTimeout(300); ok('negativeRejected',(await st()).lim===250);
 await pg.click('#lim-set'); await dlg(words.join(' ')); await dlg('off'); await pg.waitForTimeout(300); ok('limOff',(await st()).lim===null);
 R.errs=errs; ok('noJsErrors',errs.length===0); console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad?1:0);
})().catch(e=>{console.error('FAIL',String(e).slice(0,400));console.log(JSON.stringify(global.R,null,1));process.exit(1)});
