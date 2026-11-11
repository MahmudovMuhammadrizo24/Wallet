const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
const R={}; const PW='Mening-Parol-2026';
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[];
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text())});
 await pg.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 // 0) autentifikatorsiz: Face ID mavjud emas
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-card');
 await pg.waitForFunction(()=>document.querySelector('#bio-state').textContent.length>0);
 R.noAuth={state:await pg.$eval('#bio-state',e=>e.textContent),disabled:await pg.$eval('#bio-set',e=>e.disabled)};
 const dlg=async v=>{await pg.waitForSelector('#dlg-in'); await pg.fill('#dlg-in',v); await pg.click('#dlg-ok'); await pg.waitForTimeout(150)};
 const note=()=>pg.$eval('#pin-note',e=>e.textContent);
 const setPw=async(p1,p2)=>{await pg.click('#pw-set'); await dlg(words.join(' ')); await dlg(p1); if(p2!==undefined) await dlg(p2)};
 // 1) parol qoidalari
 await setPw('abc12'); R.short=await note();
 await setPw('12345678'); R.weak=await note();
 await setPw('abcabcabc'); R.repeat=await note();
 await setPw(words[0].padEnd(8,'x').slice(0,0)+'password'); R.common=await note();
 await setPw(PW,PW+'x'); R.mismatch=await note();
 await setPw(PW,PW); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:20000});
 R.pwSet={note:await note(),state:await pg.$eval('#pin-state',e=>e.textContent),type:await pg.evaluate(()=>localStorage.getItem('cw_pintype')),plain:await pg.evaluate(()=>(localStorage.getItem('cw_pin')||'').includes('abandon'))};
 // 2) qulf: parol maydoni
 await pg.click('#lock'); await pg.waitForSelector('#pin-in');
 R.pwUi={label:await pg.$eval('label[for=pin-in]',e=>e.textContent),type:await pg.$eval('#pin-in',e=>e.type),maxlen:await pg.$eval('#pin-in',e=>e.maxLength),btn:await pg.$eval('#pin-go',e=>e.textContent),bio:await pg.$$eval('#bio-go',e=>e.length)};
 await pg.fill('#pin-in','noto\'g\'ri-parol'); await pg.click('#pin-go'); await pg.waitForFunction(()=>document.querySelector('#pin-msg').textContent.includes('Qolgan'),null,{timeout:15000}); R.pwWrong={msg:await pg.$eval('#pin-msg',e=>e.textContent),inv:await pg.$eval('#pin-in',e=>e.getAttribute('aria-invalid'))};
 await pg.fill('#pin-in',PW); await pg.click('#pin-go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); R.pwUnlock=true;
 // 3) parol 10 xatodan keyin o'chadi
 await pg.click('#lock'); await pg.waitForSelector('#pin-in');
 for(let i=0;i<10;i++){ await pg.waitForSelector('#pin-in'); await pg.fill('#pin-in','xxxxxxxx'+i); await pg.click('#pin-go'); if(i<9) await pg.waitForFunction(n=>document.querySelector('#pin-msg').textContent.includes('Qolgan urinish: '+n),9-i,{timeout:20000}); }
 await pg.waitForSelector('#pin-in',{state:'detached',timeout:40000}); await pg.waitForSelector('#go'); R.pwLockout={msg:await pg.$eval('#msg',e=>e.textContent),pin:await pg.evaluate(()=>localStorage.getItem('cw_pin')),type:await pg.evaluate(()=>localStorage.getItem('cw_pintype'))};
 const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000}); R.wordsStillWork=true;
 // 4) PIN parolni almashtiradi
 await pg.evaluate(()=>{location.hash='#/security'}); await pg.waitForSelector('#pin-card');
 await setPw(PW,PW); await pg.waitForFunction(()=>document.querySelector('#pin-note').textContent.includes('o\'rnatildi'),null,{timeout:20000});
 await pg.click('#pin-set'); await dlg(words.join(' ')); await dlg('48291537'); await dlg('48291537'); await pg.waitForFunction(()=>document.querySelector('#pin-state').textContent.startsWith('PIN yoqilgan'),null,{timeout:20000});
 R.switchToPin={type:await pg.evaluate(()=>localStorage.getItem('cw_pintype')),state:await pg.$eval('#pin-state',e=>e.textContent)};
 await ctx.close();

 // 5) virtual autentifikator (PRF bilan)
 const c2=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); const p2=await c2.newPage(); const e2=[]; p2.on('pageerror',e=>e2.push(e.message)); p2.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))e2.push(m.text())});
 await p2.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 const cdp=await c2.newCDPSession(p2); await cdp.send('WebAuthn.enable',{enableUI:false});
 const {authenticatorId}=await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',ctap2Version:'ctap2_1',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true,hasPrf:true}});
 await p2.goto(`http://localhost:${port}/index.html`); await p2.waitForSelector('#t-create');
 const w2=await p2.$$eval('#wb input',e=>e.map(x=>x.value)); await p2.click('#next'); await p2.waitForSelector('.vin');
 for(const p of await p2.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await p2.fill('#v'+p,w2[p]);
 await p2.click('#mk'); await p2.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await p2.evaluate(()=>{location.hash='#/security'}); await p2.waitForSelector('#pin-card'); await p2.waitForFunction(()=>document.querySelector('#bio-state').textContent.length>0);
 const dl2=async v=>{await p2.waitForSelector('#dlg-in'); await p2.fill('#dlg-in',v); await p2.click('#dlg-ok'); await p2.waitForTimeout(150)};
 R.bioAvail={state:await p2.$eval('#bio-state',e=>e.textContent),disabled:await p2.$eval('#bio-set',e=>e.disabled)};
 await p2.click('#bio-set'); await dl2('abc def'); R.bioWrongWords=await p2.$eval('#bio-note',e=>e.textContent);
 await p2.click('#bio-set'); await dl2(w2.join(' ')); await p2.waitForFunction(()=>/yoqildi|yoqib bo|Bekor/.test(document.querySelector('#bio-note').textContent),null,{timeout:30000});
 R.bioEnable={note:await p2.$eval('#bio-note',e=>e.textContent),state:await p2.$eval('#bio-state',e=>e.textContent),stored:await p2.evaluate(()=>{const s=localStorage.getItem('cw_bio');return s?{keys:Object.keys(JSON.parse(s)),plain:s.includes('abandon')}:null}),creds:(await cdp.send('WebAuthn.getCredentials',{authenticatorId})).credentials.length};
 await p2.click('#lock'); await p2.waitForSelector('#bio-go'); R.bioUi={bio:await p2.$$eval('#bio-go',e=>e.length),pin:await p2.$$eval('#pin-in',e=>e.length)};
 await p2.screenshot({path:(process.env.WORK||require('os').tmpdir()+'/hamyon-work')+'/bio-unlock.png'}).catch(()=>{});
 await p2.click('#bio-go'); await p2.waitForSelector('.page:not([hidden])',{timeout:30000}); R.bioUnlock=true;
 // 6) PIN ham yoqilganda ikkalasi ko'rinadi
 await p2.evaluate(()=>{location.hash='#/security'}); await p2.waitForSelector('#pin-card');
 await p2.click('#pin-set'); await dl2(w2.join(' ')); await dl2('48291537'); await dl2('48291537'); await p2.waitForFunction(()=>document.querySelector('#pin-state').textContent.startsWith('PIN yoqilgan'),null,{timeout:20000});
 await p2.click('#lock'); await p2.waitForSelector('#bio-go'); R.both={bio:await p2.$$eval('#bio-go',e=>e.length),pin:await p2.$$eval('#pin-in',e=>e.length)};
 // 8) PIN bilan ham kiradi
 await p2.fill('#pin-in','48291537'); await p2.click('#pin-go'); await p2.waitForSelector('.page:not([hidden])',{timeout:30000}); R.pinWithBio=true;
 // 9) buzilgan Face ID ma'lumoti: o'chiriladi, ilova qulamaydi
 await p2.click('#lock'); await p2.waitForSelector('#bio-go');
 await p2.evaluate(()=>{const o=JSON.parse(localStorage.getItem('cw_bio')); o.ct=o.ct.slice(0,-6)+'AAAAAA'; localStorage.setItem('cw_bio',JSON.stringify(o))});
 await p2.click('#bio-go'); await p2.waitForFunction(()=>document.querySelector('#bio-msg')&&document.querySelector('#bio-msg').textContent.length>0,null,{timeout:30000});
 R.bioTamper={msg:await p2.$eval('#bio-msg',e=>e.textContent),wiped:await p2.evaluate(()=>localStorage.getItem('cw_bio')===null)};
 // 10) o'chirish va wipe
 await p2.fill('#pin-in','48291537'); await p2.click('#pin-go'); await p2.waitForSelector('.page:not([hidden])',{timeout:30000});
 await p2.evaluate(()=>{location.hash='#/security'}); await p2.waitForSelector('#pin-card');
 await p2.click('#bio-set'); await dl2(w2.join(' ')); await p2.waitForFunction(()=>/yoqildi/.test(document.querySelector('#bio-note').textContent),null,{timeout:30000});
 await p2.click('#bio-off'); await p2.waitForSelector('#dlg-ok'); await p2.click('#dlg-ok'); await p2.waitForTimeout(200); R.bioOff={stored:await p2.evaluate(()=>localStorage.getItem('cw_bio')),state:await p2.$eval('#bio-state',e=>e.textContent)};
 await p2.click('#bio-set'); await dl2(w2.join(' ')); await p2.waitForFunction(()=>/yoqildi/.test(document.querySelector('#bio-note').textContent),null,{timeout:30000});
 await p2.evaluate(()=>{document.querySelector('#lock').click()}); await p2.waitForSelector('#wipe,#bio-go'); 
 await p2.waitForSelector('#bio-go');
 // 7) bekor qilingan Face ID (foydalanuvchi tasdiqlamadi)
 await cdp.send('WebAuthn.setUserVerified',{authenticatorId,isUserVerified:false});
 await p2.click('#bio-go'); await p2.waitForFunction(()=>document.querySelector('#bio-msg').textContent.length>0,null,{timeout:30000}); R.bioDenied={msg:await p2.$eval('#bio-msg',e=>e.textContent),stillLocked:await p2.$$eval('#pin-in',e=>e.length)>0,bioStored:await p2.evaluate(()=>!!localStorage.getItem('cw_bio'))};
 R.errs=errs.concat(e2); console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,500));console.log(JSON.stringify(R,null,1));process.exit(1)});
