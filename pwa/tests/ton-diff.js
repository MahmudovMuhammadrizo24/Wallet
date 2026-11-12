const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const crypto=require('crypto'); const TR=(require('path').resolve(__dirname,'..','node_modules')+'/');
const {WalletContractV4}=require(TR+'@ton/ton'); const {Address,internal,external,storeMessage,beginCell,Cell}=require(TR+'@ton/core'); const {keyPairFromSeed}=require(TR+'@ton/crypto');
const H2=crypto.createHash('sha256').update('hamyon-test').digest('hex'); const GOOD=Address.parseRaw('0:'+H2).toString({bounceable:false,urlSafe:true}); const R={}; let bad=0; const ok=(k,v)=>{R[k]=v; if(v!==true)bad++};
function slip10(seed,path){let I=crypto.createHmac('sha512','ed25519 seed').update(seed).digest(),k=I.slice(0,32),c=I.slice(32);for(const i of path){const d=Buffer.alloc(37);d[0]=0;k.copy(d,1);d.writeUInt32BE((i|0x80000000)>>>0,33);I=crypto.createHmac('sha512',c).update(d).digest();k=I.slice(0,32);c=I.slice(32)}return k}
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.route(u=>!/^http:\/\/localhost/.test(u.href),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 ok('selfTest', await pg.evaluate(()=>WL.tonSelfTest()));
 let addrOk=0,N=25, signOk=0, signN=0;
 for(let t=0;t<N;t++){
  const phrase=await pg.evaluate(()=>WL.generate? WL.generate(): null); const words=typeof phrase==='string'?phrase:(phrase.mnemonic||phrase.phrase||String(phrase));
  const seed=crypto.pbkdf2Sync(words.normalize('NFKD'),'mnemonic',2048,64,'sha512');
  const kp=keyPairFromSeed(slip10(seed,[44,607,0])); const wallet=WalletContractV4.create({workchain:0,publicKey:kp.publicKey});
  const refAddr=wallet.address.toString({bounceable:false,urlSafe:true,testOnly:false});
  const mine=await pg.evaluate(w=>WL.derive(w).TON,words);
  if(mine===refAddr) addrOk++; else R['addrMismatch'+t]={mine,refAddr};
  // imzolash: bir nechta kombinatsiya
  const dests=['EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',GOOD,'0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe'];
  const L120='x'.repeat(120);const combos=[{seqno:0,bounce:false,mode:3,amount:1n,comment:'12345'},{seqno:7,bounce:true,mode:3,amount:5n,comment:L120},{seqno:0,bounce:false,mode:128,amount:9n,comment:'Привет 🚀 test'},{seqno:3,bounce:false,mode:3,amount:77n,comment:'x'.repeat(60)},{seqno:1,bounce:true,mode:3,amount:1n,comment:'<b>&"memo'},{seqno:0,bounce:false,mode:3,amount:1n},{seqno:5,bounce:true,mode:3,amount:1500000000n},{seqno:123456,bounce:false,mode:128,amount:123456789012n},{seqno:0,bounce:true,mode:128,amount:2n**100n}];
  for(const [i,cb] of combos.entries()){ if(t>=8) break;
   const to=dests[(t+i)%3]; const vu=1900000000+t*7+i;
   const res=await pg.evaluate(async ([w,from,to,cb,vu])=>{try{const r=await WL.tonSign({mnemonic:w,from,tx:{to,amount:BigInt(cb.amount),seqno:cb.seqno,validUntil:vu,bounce:cb.bounce,mode:cb.mode,withInit:cb.seqno===0,comment:cb.comment}});return r}catch(e){return {err:String(e.message)}}},[words,mine,to,{...cb,amount:cb.amount.toString()},vu]);
   signN++;
   if(res.err){R['signErr'+t+'_'+i]=res.err; continue}
   const msg=internal({to:Address.parse(to),value:cb.amount,bounce:cb.bounce,...(cb.comment?{body:cb.comment}:{})}); 
   const transfer=wallet.createTransfer({seqno:cb.seqno,secretKey:kp.secretKey,sendMode:cb.mode,timeout:vu,messages:[msg]});
   const ext=external({to:wallet.address,init:cb.seqno===0?wallet.init:null,body:transfer}); const refCell=beginCell().store(storeMessage(ext)).endCell();
   let myCell; try{myCell=Cell.fromBoc(Buffer.from(res.boc,'base64'))[0]}catch(e){R['bocParse'+t+'_'+i]=String(e.message);continue}
   if(myCell.hash().toString('hex')===refCell.hash().toString('hex') && res.hash===refCell.hash().toString('hex')) signOk++; else R['signMismatch'+t+'_'+i]={mine:myCell.hash().toString('hex'),ref:refCell.hash().toString('hex'),mybits:myCell.bits.length,refbits:refCell.bits.length,myrefs:myCell.refs.length,refrefs:refCell.refs.length};
  }
 }
 ok('addresses_'+addrOk+'/'+N, addrOk===N); ok('signed_'+signOk+'/'+signN, signOk===signN&&signN>0);
 // manzil tahlili
 const g=GOOD; const bad1=g.slice(0,-2)+(g.endsWith('w')?'x':'w');
 const infos=await pg.evaluate(a=>a.map(x=>{const i=WL.tonInfo(x);return i?{h:i.hash,b:i.bounce,raw:i.raw}:null}),[g,bad1,'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs','0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe','-1:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe','','abc',null]);
 ok('info_valid',!!infos[0]&&infos[0].b===false&&infos[0].h===Address.parse(g).hash.toString('hex')); ok('info_badcrc_rejected',infos[1]===null);
 ok('info_EQ_bounceable',!!infos[2]&&infos[2].b===true&&infos[2].h==='b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe'); ok('info_raw',!!infos[3]&&infos[3].raw===true); ok('info_wc-1_rejected',infos[4]===null); ok('info_junk_rejected',infos[5]===null&&infos[6]===null&&infos[7]===null);
 // testnet bayrog'i rad etiladi
 const tn=Address.parse(g).toString({testOnly:true,bounceable:false,urlSafe:true}); ok('info_testnet_rejected',(await pg.evaluate(a=>WL.tonInfo(a),tn))===null);
 // himoya: noto'g'ri from / mode / manzil
 const w0=await pg.evaluate(()=>WL.generate? WL.generate():null); const words0=typeof w0==='string'?w0:(w0.mnemonic||w0.phrase||String(w0));
 const my0=await pg.evaluate(w=>WL.derive(w).TON,words0);
 const bads=await pg.evaluate(async([w,a,g])=>{const base={to:g,amount:1000n,seqno:1,validUntil:1900000000,bounce:false,mode:3,withInit:false};const t=async(from,o)=>{try{await WL.tonSign({mnemonic:w,from,tx:{...base,...o}});return 'signed'}catch(e){return e.message}};return {wrongFrom:await t(g,{}),mode0:await t(a,{mode:0}),mode64:await t(a,{mode:64}),zero:await t(a,{amount:0n}),neg:await t(a,{amount:-5n}),badTo:await t(a,{to:'x'}),seqnoNeg:await t(a,{seqno:-1}),timeBad:await t(a,{validUntil:0}),good:await t(a,{})}},[words0,my0,GOOD]);
 ok('guards',bads.wrongFrom==='MISMATCH'&&bads.mode0==='BAD_MODE'&&bads.mode64==='BAD_MODE'&&bads.zero==='BAD_AMOUNT'&&bads.neg==='BAD_AMOUNT'&&bads.badTo==='BAD_TO'&&bads.seqnoNeg==='BAD_SEQNO'&&bads.timeBad==='BAD_TIME'&&bads.good==='signed'); R.guardsDetail=bads;
 const longC=await pg.evaluate(async([w,a,g])=>{try{await WL.tonSign({mnemonic:w,from:a,tx:{to:g,amount:1000n,seqno:1,validUntil:1900000000,bounce:false,mode:3,withInit:false,comment:'x'.repeat(121)}});return 'signed'}catch(e){return e.message}},[words0,my0,g]); ok('comment121Rejected',longC==='BAD_COMMENT');
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close(); process.exit(bad?1:0);
})().catch(e=>{console.error('FAIL',String(e).slice(0,600));console.log(JSON.stringify(R,null,1));process.exit(1)});
