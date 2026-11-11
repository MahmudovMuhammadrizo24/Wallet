const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const TR='/tmp/claude-0/-home-claude/71848a84-9940-5d79-a003-81e9ba5fa6d7/scratchpad/tonref/node_modules/';
const {Address,Cell,beginCell,loadMessage,loadMessageRelaxed}=require(TR+'@ton/core'); const nacl=require(TR+'tweetnacl');
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const DEST=Address.parseRaw('0:'+require('crypto').createHash('sha256').update('dest').digest('hex')).toString({bounceable:false,urlSafe:true});
let walletState={account_state:'active',seqno:7,balance:'5000000000'},destState='active',sentBocs=[],hits=[];
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const req=r.request(),u=req.url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)}); hits.push(Date.now());
  if(/toncenter\.com\/api\/v2\/getAddressBalance/.test(u))return J({ok:true,result:'2500000000'});
  if(/toncenter\.com\/api\/v2\/getWalletInformation/.test(u))return J({ok:true,result:{wallet:true,...walletState}});
  if(/toncenter\.com\/api\/v2\/getAddressInformation/.test(u))return J({ok:true,result:{state:destState,balance:'1'}});
  if(/toncenter\.com\/api\/v2\/getTransactions/.test(u))return J({ok:true,result:[{utime:1700000000,transaction_id:{hash:Buffer.alloc(32,7).toString('base64')},in_msg:{source:'',value:'0'},out_msgs:[{value:'1500000000'}]},{utime:1700000100,transaction_id:{hash:Buffer.alloc(32,9).toString('base64')},in_msg:{source:'EQxx',value:'3000000000'},out_msgs:[]}]});
  if(/toncenter\.com\/api\/v2\/sendBocReturnHash/.test(u)){sentBocs.push(JSON.parse(req.postData()).boc);return J({ok:true,result:{hash:'x'}})}
  if(/toncenter\.com\/api\/v3\/jetton\/wallets/.test(u))return J({jetton_wallets:[{balance:'12500000',jetton:'0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE'},{balance:'999000000',jetton:'0:FAKE000000000000000000000000000000000000000000000000000000000000'}]});
  if(/coingecko/.test(u))return J({bitcoin:{usd:97000},ethereum:{usd:3400},tether:{usd:1},'the-open-network':{usd:3},solana:{usd:180},tron:{usd:.25}});
  return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 // 1) yangi hamyonda TON manzili bor va deriveTON bilan mos
 const exp=await pg.evaluate(w=>WL.derive(w).TON,words.join(' '));
 const tonItem=await pg.evaluate(()=>data.items.find(x=>x.coin==='TON')); ok('newWalletHasTon',!!tonItem&&tonItem.address===exp&&/^UQ/.test(exp));
 // 2) USDT (TON) qo'shish
 await pg.click('#nav-add'); await pg.waitForSelector('#tk-add'); await pg.selectOption('#tk-sel','USDT_TON'); await pg.click('#tk-add'); await pg.waitForTimeout(600);
 ok('usdtTonAdded',await pg.evaluate(()=>data.items.some(x=>x.coin==='USDT_TON')));
 await pg.click('#nav-assets'); await pg.waitForSelector('#list'); await pg.waitForTimeout(6000);
 R.bal=await pg.evaluate(()=>({TON:balances[data.items.find(x=>x.coin==='TON').id],USDT_TON:balances[data.items.find(x=>x.coin==='USDT_TON').id]}));
 ok('tonBalance',R.bal.TON===2.5); ok('usdtTonBalanceFiltersFakeJetton',R.bal.USDT_TON===12.5);
 R.tonGroup=await pg.$$eval('#list > tr:not(.ngp-row)',e=>e.map(x=>x.classList.contains('ng')?'## '+x.querySelector('th').innerText.replace(/\s+/g,' '):'   '+x.querySelector('.a-n').innerText.replace(/\s+/g,' ')).filter(x=>/TON|USDT/.test(x)));
 R.splSend=await pg.evaluate(()=>canSend(data.items.find(x=>x.coin==='USDT_TON'))); ok('usdtTonNotSendable',R.splSend===false);
 ok('tonSendable',await pg.evaluate(()=>canSend(data.items.find(x=>x.coin==='TON'))));
 // 3) tarix
 R.hist=await pg.evaluate(async()=>{const h=await HISTORY.TON(data.items.find(x=>x.coin==='TON').address);return h.map(x=>({dir:x.dir,amount:String(x.amount),hash:x.hash.length,time:x.time}))}); ok('history',R.hist[0].dir==='out'&&R.hist[0].amount==='1500000000'&&R.hist[1].dir==='in'&&R.hist[1].amount==='3000000000'&&R.hist[0].hash===64);
 // 4) yuborish
 const send=async(amt)=>{const id=await pg.evaluate(()=>data.items.find(x=>x.coin==='TON').id); await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(150); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',DEST);
   if(amt==='max'){await pg.click('#sd-max')}else await pg.fill('#sd-amt',amt); await pg.click('#sd-next');
   await pg.waitForFunction(()=>{const r=document.querySelector('#sd-review');return (r&&!r.hidden&&r.querySelector('.rv'))||(m=>m.length>0&&!/Hisoblan/.test(m))(document.querySelector('#sd-msg').textContent)},null,{timeout:30000});
   if(!(await pg.$eval('#sd-review',e=>!e.hidden))) return {err:await pg.$eval('#sd-msg',e=>e.textContent)};
   const warn=await pg.$$eval('#sd-review .warn',e=>e.map(x=>x.textContent.slice(0,80)));
   const s=await pg.evaluate(async w=>{const s=await PANEL.send.quote.sign(w); return {boc:s.boc,hash:s.hash}},words.join(' '));
   return {warn,...s}};
 const wallet=await pg.evaluate(()=>data.items.find(x=>x.coin==='TON').address);

 // bevosita tekshiruv: imzo ochiq kalit bilan tasdiqlanadi (kalitni so'zlardan mustaqil hisoblaymiz)
 const crypto=require('crypto'); function slip10(seed,path){let I=crypto.createHmac('sha512','ed25519 seed').update(seed).digest(),k=I.slice(0,32),c=I.slice(32);for(const i of path){const d=Buffer.alloc(37);d[0]=0;k.copy(d,1);d.writeUInt32BE((i|0x80000000)>>>0,33);I=crypto.createHmac('sha512',c).update(d).digest();k=I.slice(0,32);c=I.slice(32)}return k}
 const kp=nacl.sign.keyPair.fromSeed(slip10(crypto.pbkdf2Sync(words.join(' '),'mnemonic',2048,64,'sha512'),[44,607,0]));
 const verify=(r,exp)=>{const cell=Cell.fromBoc(Buffer.from(r.boc,'base64'))[0]; const m=loadMessage(cell.beginParse()); if(!m.info.dest.equals(Address.parse(wallet)))return 'wallet-dest';
   if(!!m.init!==exp.init)return 'init-mismatch'; const bs=m.body.beginParse(); const sig=bs.loadBuffer(64); const rest=bs.clone(); const sm=beginCell().storeSlice(rest).endCell();
   if(!nacl.sign.detached.verify(sm.hash(),sig,kp.publicKey))return 'bad-signature';
   const s=sm.beginParse(); s.loadUint(32); const vu=s.loadUint(32), seq=s.loadUint(32); s.loadUint(8); const mode=s.loadUint(8); const inner=s.loadRef().beginParse(); const im=loadMessageRelaxed(inner);
   if(seq!==exp.seqno)return 'seqno '+seq; if(mode!==exp.mode)return 'mode '+mode; if(im.info.type!=='internal')return 'inner-type'; if(!im.info.dest.equals(Address.parse(DEST)))return 'inner-dest';
   if(im.info.value.coins!==exp.amount)return 'value '+im.info.value.coins; if(im.info.bounce!==exp.bounce)return 'bounce '+im.info.bounce; if(vu<Math.floor(Date.now()/1000)||vu>Math.floor(Date.now()/1000)+400)return 'validUntil '+vu;
   return true};
 let r=await send('1.25'); R.send1=r.err||{warn:r.warn}; ok('sendActive',!r.err&&verify(r,{init:false,seqno:7,mode:3,amount:1250000000n,bounce:false})===true); if(r.err||verify(r,{init:false,seqno:7,mode:3,amount:1250000000n,bounce:false})!==true)R.send1v=r.err||verify(r,{init:false,seqno:7,mode:3,amount:1250000000n,bounce:false});
 walletState={account_state:'uninitialized',balance:'5000000000'}; r=await send('0.5'); ok('sendUninitWithInit',!r.err&&verify(r,{init:true,seqno:0,mode:3,amount:500000000n,bounce:false})===true); if(r.err||verify(r,{init:true,seqno:0,mode:3,amount:500000000n,bounce:false})!==true)R.send2v=r.err||verify(r,{init:true,seqno:0,mode:3,amount:500000000n,bounce:false});
 walletState={account_state:'active',seqno:9,balance:'5000000000'}; r=await send('max'); ok('sendMax',!r.err&&verify(r,{init:false,seqno:9,mode:128,amount:5000000000n,bounce:false})===true); if(r.err||verify(r,{init:false,seqno:9,mode:128,amount:5000000000n,bounce:false})!==true)R.send3v=r.err||verify(r,{init:false,seqno:9,mode:128,amount:5000000000n,bounce:false});
 // bounceable manzil faol hisobga: bounce=true
 const bounceDest=Address.parse(DEST).toString({bounceable:true,urlSafe:true}); await pg.evaluate(()=>{location.hash='#/home'});
 walletState={account_state:'active',seqno:3,balance:'5000000000'}; const idd=await pg.evaluate(()=>data.items.find(x=>x.coin==='TON').id); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},idd); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',bounceDest); await pg.fill('#sd-amt','0.1'); await pg.click('#sd-next');
 await pg.waitForFunction(()=>{const r=document.querySelector('#sd-review');return r&&!r.hidden},null,{timeout:30000}); const s2=await pg.evaluate(async w=>{const s=await PANEL.send.quote.sign(w);return {boc:s.boc}},words.join(' ')); ok('bounceableToActive',verify(s2,{init:false,seqno:3,mode:3,amount:100000000n,bounce:true})===true);
 // xato kirishlar
 walletState={account_state:'active',seqno:3,balance:'5000000000'};
 for(const [k,to,amt] of [['badAddr','EQ_not_an_address','1'],['tooMuch',DEST,'5'],['zero',DEST,'0'],['self',wallet,'1']]){await pg.evaluate(()=>{location.hash='#/home'}); await pg.waitForTimeout(100); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},idd); await pg.waitForSelector('#sd-to'); await pg.fill('#sd-to',to); await pg.fill('#sd-amt',amt); await pg.click('#sd-next'); await pg.waitForTimeout(3500); const m=await pg.$eval('#sd-msg',e=>e.textContent); R['err_'+k]=m.slice(0,70); ok('rejects_'+k,m.length>0&&(await pg.$eval('#sd-review',e=>e.hidden)))}
 // 5) eski hamyon: TON yo'q, so'zlar bilan kirganda avtomatik qo'shiladi
 await pg.evaluate(async()=>{data.items=data.items.filter(x=>x.coin!=='TON'&&x.coin!=='USDT_TON'); await save()});
 await pg.reload(); await pg.waitForSelector('#go'); const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); await pg.waitForTimeout(800);
 ok('migrationAddsTon',await pg.evaluate(a=>data.items.filter(x=>x.coin==='TON'&&x.address===a).length===1,exp));
 await pg.reload(); await pg.waitForSelector('#go'); for(const [i,w] of words.entries()) await (await pg.$$('#wb input'))[i].fill(w); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); await pg.waitForTimeout(500);
 ok('migrationIdempotent',await pg.evaluate(()=>data.items.filter(x=>x.coin==='TON').length===1));
 // 6) kontakt: TON oilasi
 ok('contactFamTon',await pg.evaluate(a=>CT_VALID.TON.test(a)&&!CT_VALID.TON.test('abc'),DEST)&&await pg.evaluate(([a,b])=>sameAddr(a,b,'TON'),[DEST,Address.parse(DEST).toString({bounceable:true,urlSafe:true})]));
 R.rateLimitMinGapMs=(()=>{let m=1e9;for(let i=1;i<hits.length;i++)m=Math.min(m,hits[i]-hits[i-1]);return m})();
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad?1:0);
})().catch(e=>{console.error('FAIL',String(e.stack).slice(0,900));console.log(JSON.stringify(R,null,1));process.exit(1)});
