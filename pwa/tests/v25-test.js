const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const TR=(require('path').resolve(__dirname,'..','node_modules')+'/');
const {Address,Cell,loadMessage,loadMessageRelaxed}=require(TR+'@ton/core');
const R={}; const errs=[]; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
const DEST=Address.parseRaw('0:'+require('crypto').createHash('sha256').update('dest').digest('hex')).toString({bounceable:false,urlSafe:true});
const BTC_TO='bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
let sentBocs=[];
const SH=(require('os').tmpdir()+'/hamyon-shots/');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const pg=await ctx.newPage();
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text().slice(0,200))});
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),async r=>{const req=r.request(),u=req.url(); const J=o=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  if(/getWalletInformation/.test(u))return J({ok:true,result:{wallet:true,account_state:'active',seqno:7,balance:'5000000000'}});
  if(/getAddressInformation/.test(u))return J({ok:true,result:{state:'active',balance:'1'}});
  if(/getAddressBalance/.test(u))return J({ok:true,result:'5000000000'});
  if(/sendBocReturnHash/.test(u)){sentBocs.push(JSON.parse(req.postData()).boc);return J({ok:true,result:{hash:'x'}})}
  if(/coingecko/.test(u))return J({'the-open-network':{usd:3},bitcoin:{usd:97000}}); return r.abort()});
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 const tonId=await pg.evaluate(()=>data.items.find(x=>x.coin==='TON').id), btcId=await pg.evaluate(()=>data.items.find(x=>x.coin==='BTC').id);
 const open=async(id)=>{await pg.evaluate(()=>{location.hash='#/assets'}); await pg.waitForTimeout(200); await pg.evaluate(i=>{location.hash='#/asset/'+i+'/send'},id); await pg.waitForSelector('#sd-to')};
 // ---- 1) TON izohi
 await open(tonId);
 ok('memoFieldOnTon',!!(await pg.$('#sd-memo')));
 await open(btcId); ok('noMemoFieldOnBtc',!(await pg.$('#sd-memo')));
 ok('scanHiddenWhenUnsupported',await pg.evaluate(()=>window.BarcodeDetector?true:document.querySelector('#sd-scan').hidden===true));
 await open(tonId);
 const MEMO='Depozit 12345 <b>x</b>';
 await pg.fill('#sd-to',DEST); await pg.fill('#sd-amt','1'); await pg.fill('#sd-memo',MEMO); await pg.click('#sd-next'); await pg.waitForSelector('#rv-go');
 const txt=await pg.evaluate(()=>document.querySelector('#sd-review').innerText); ok('reviewShowsMemo',txt.includes('Izoh (memo): "'+MEMO+'"')); ok('memoEscaped',await pg.evaluate(()=>![...document.querySelectorAll('#sd-review b')].some(x=>x.textContent==='x')));
 ok('noMemoWarnWhenFilled',!/izoh maydoni bo.sh qoldi/i.test(txt));
 if(await pg.$('#rv-last')) await pg.fill('#rv-last',DEST.slice(-6)); await pg.check('#rv-ok'); const ins=await pg.$$('#rv-wb input'); for(let i=0;i<ins.length;i++) await ins[i].fill(words[i]);
 await pg.click('#rv-go'); await pg.waitForTimeout(3500);
 ok('broadcasted',sentBocs.length===1);
 if(sentBocs[0]){ const ext=loadMessage(Cell.fromBoc(Buffer.from(sentBocs[0],'base64'))[0].beginParse()); const sl=ext.body.beginParse(); sl.skip(512); sl.loadUint(32); sl.loadUint(32); sl.loadUint(32); sl.loadUint(8); sl.loadUint(8); const inner=loadMessageRelaxed(sl.loadRef().beginParse()); const bs=inner.body.beginParse(); const op=bs.loadUint(32); const text=bs.loadStringTail();
  ok('onChainCommentOk',op===0&&text===MEMO); ok('valueOk',inner.info.type==='internal'&&inner.info.value.coins===1000000000n); ok('destOk',inner.info.dest.toString({bounceable:false,urlSafe:true})===DEST) }
 // izoh yo'q: ogohlantirish
 await open(tonId); await pg.fill('#sd-to',DEST); await pg.fill('#sd-amt','1'); await pg.click('#sd-next'); await pg.waitForSelector('#rv-go');
 ok('warnWhenNoMemo',/Izoh maydoni bo.sh qoldi/i.test(await pg.evaluate(()=>document.querySelector('#sd-review').innerText)));
 // uzun izoh va maxfiy so'z
 await open(tonId); await pg.fill('#sd-to',DEST); await pg.fill('#sd-amt','1'); await pg.evaluate(()=>{const m=document.querySelector('#sd-memo');m.removeAttribute('maxlength');m.value='я'.repeat(70)}); await pg.click('#sd-next'); await pg.waitForTimeout(800);
 ok('longMemoRejected',/juda uzun/.test(await pg.$eval('#sd-msg',e=>e.textContent)));
 await pg.fill('#sd-memo',words.join(' ')); await pg.click('#sd-next'); await pg.waitForTimeout(500);
 ok('seedInMemoRejected',/maxfiy/.test(await pg.$eval('#sd-msg',e=>e.textContent)));
 // ---- 2) QR: tahlil (yagona sinov, kamera kerak emas)
 const P=await pg.evaluate(()=>[parsePayUri('bitcoin:'+'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'+'?amount=0.015&label=x','BTC'),parsePayUri('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq','BTC'),parsePayUri('ethereum:0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE@1/transfer?value=1e18','ETH'),parsePayUri('ton://transfer/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs?amount=1000&text=hello%20world','TON'),parsePayUri('0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe','TON'),parsePayUri('bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=1e9','BTC')]);
 ok('uriBtc',P[0].addr===BTC_TO&&P[0].amount==='0.015'); ok('plainAddr',P[1].addr===BTC_TO&&P[1].amount==='');
 ok('uriEth',P[2].addr==='0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE'&&P[2].amount===''); ok('uriTon',P[3].addr==='EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'&&P[3].memo==='hello world'&&P[3].amount==='');
 ok('rawTonNotTreatedAsScheme',P[4].addr.startsWith('0:b113')); ok('badAmountIgnored',P[5].amount==='');
 // ---- 3) QR: kamera (taqlid)
 const ctx2=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const p2=await ctx2.newPage(); p2.on('pageerror',e=>errs.push(e.message));
 await p2.addInitScript(()=>{window.BarcodeDetector=class{constructor(o){this.o=o} async detect(v){return window.__qr?[{rawValue:window.__qr}]:[]}};
  navigator.mediaDevices.getUserMedia=async()=>{window.__gum=(window.__gum||0)+1; const c=document.createElement('canvas');c.width=64;c.height=64;c.getContext('2d').fillRect(0,0,64,64);window.__tracks=c.captureStream().getTracks();return new MediaStream(window.__tracks)}});
 await p2.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 await p2.goto(`http://localhost:${port}/index.html`); await p2.waitForSelector('#t-create');
 const w2=await p2.$$eval('#wb input',e=>e.map(x=>x.value)); await p2.click('#next'); await p2.waitForSelector('.vin'); for(const p of await p2.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await p2.fill('#v'+p,w2[p]); await p2.click('#mk'); await p2.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 const bid=await p2.evaluate(()=>data.items.find(x=>x.coin==='BTC').id); await p2.evaluate(i=>{location.hash='#/asset/'+i+'/send'},bid); await p2.waitForSelector('#sd-to');
 ok('scanVisibleWhenSupported',await p2.$eval('#sd-scan',e=>!e.hidden));
 await p2.click('#sd-scan'); await p2.waitForSelector('#qr-scan'); await p2.waitForTimeout(700); await p2.screenshot({path:SH+'v25-scan.png'});
 ok('cameraAsked',await p2.evaluate(()=>window.__gum===1)); await p2.keyboard.press('Escape'); await p2.waitForSelector('#qr-scan',{state:'detached'});
 ok('cameraStoppedOnClose',await p2.evaluate(()=>window.__tracks.every(t=>t.readyState==='ended')));
 await p2.evaluate(()=>{window.__qr='bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.015'}); await p2.click('#sd-scan'); await p2.waitForSelector('#qr-scan',{state:'detached'});
 ok('scanFillsFields',await p2.$eval('#sd-to',e=>e.value)===BTC_TO&&await p2.$eval('#sd-amt',e=>e.value)==='0.015'); ok('scanDoesNotSubmit',await p2.evaluate(()=>!document.querySelector('#rv-go')&&!document.querySelector('#sd-review').innerText.trim()));
 // ruxsat rad etilsa
 await p2.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new Error('NotAllowedError')}}); await p2.click('#sd-scan'); await p2.waitForSelector('#qr-scan'); await p2.waitForTimeout(300);
 ok('deniedMessage',/Kameradan foydalanib bo/.test(await p2.$eval('#qr-m',e=>e.textContent))); await p2.click('#qr-x'); await p2.waitForSelector('#qr-scan',{state:'detached'});
 // ---- 4) Yangi tokenlar
 await p2.evaluate(()=>{location.hash='#/assets'}); await p2.waitForSelector('#list .ngb[data-net=ETH]'); await p2.click('#list .ngb[data-net=ETH]'); await p2.waitForSelector('#tk-sheet');
 const ks=await p2.$$eval('#sh-l button[data-k]',e=>e.map(x=>x.dataset.k)); ok('newTokensOffered',['AAVE_ERC20','PEPE_ERC20','LDO_ERC20','CRV_ERC20'].every(k=>ks.includes(k)));
 await p2.click('#sh-l button[data-k=AAVE_ERC20]'); await p2.waitForSelector('#tk-sheet',{state:'detached'}); await p2.waitForTimeout(800);
 const aave=await p2.evaluate(()=>{const it=data.items.find(x=>x.coin==='AAVE_ERC20');const e=data.items.find(x=>x.coin==='ETH');return it&&{same:it.address===e.address,cg:COINS.AAVE_ERC20.cg,send:canSend(it),addr:ERC20.AAVE_ERC20.addr}}); ok('aaveAdded',!!aave&&aave.same&&aave.cg==='aave'&&aave.send===true);
 ok('addPageHasNew',await p2.evaluate(()=>['AAVE_ERC20','PEPE_ERC20','LDO_ERC20','CRV_ERC20'].every(k=>document.querySelector('#tk-sel option[value='+k+']'))));
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad||errs.length?1:0);
})().catch(e=>{console.error('FAIL',String(e.stack).slice(0,900));console.log(JSON.stringify(R,null,1));process.exit(1)});
