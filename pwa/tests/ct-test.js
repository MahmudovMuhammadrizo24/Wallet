const WORK = process.env.WORK || require('os').tmpdir() + '/hamyon-work'; require('fs').mkdirSync(WORK, { recursive: true });
const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const [,, dir, port] = process.argv; const SH=WORK+'/'; const PROBES=__dirname+'/';
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/'))p+='index.html'; const f=path.join(dir,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end('nf')} r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'}); r.end(fs.readFileSync(f))}).listen(+port);
global.R={}; const R=global.R;
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark',serviceWorkers:'block'}); const pg=await ctx.newPage(); const errs=[];
 pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::ERR/.test(m.text()))errs.push(m.text())});
 await pg.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForSelector('#t-create');
 const words=await pg.$$eval('#wb input',e=>e.map(x=>x.value)); await pg.click('#next'); await pg.waitForSelector('.vin');
 for(const p of await pg.$$eval('.vin',e=>e.map(x=>+x.id.slice(1)))) await pg.fill('#v'+p,words[p]);
 await pg.click('#mk'); await pg.waitForSelector('#pg-home:not([hidden])',{timeout:30000});
 await pg.click('#nav-set'); await pg.waitForSelector('#pg-settings:not([hidden])'); await pg.click('#pg-settings a[href="#/contacts"]'); await pg.waitForSelector('#pg-contacts:not([hidden])');
 R.route=await pg.evaluate(()=>location.hash); R.nav=await pg.$eval('#nav-set',e=>e.getAttribute('aria-current')); R.empty=await pg.$eval('#ct-list',e=>e.textContent);
 const add=async(n,f,a)=>{await pg.fill('#ct-name',n); await pg.selectOption('#ct-fam',f); await pg.fill('#ct-addr',a); await pg.click('#ct-add'); await pg.waitForTimeout(250); return pg.$eval('#ct-note',e=>e.textContent)};
 const BTC='bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', BTC2='bc1qar0srrr7yfkvy5l643lydnw9re59gtzzwf5mdq', ETH='0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
 R.noName=await add('','BTC',BTC); R.badAddr=await add('A','BTC','hello'); R.wrongNet=await add('A','BTC',ETH); R.secret=await add('A','BTC',words.join(' '));
 R.okBtc=await add('Do\'stim','BTC',BTC); R.okEth=await add('Birja','EVM',ETH); R.dup=await add('X','BTC',BTC);
 // o'xshash manzil: oxirgi belgi farq qiladi -> tasdiq oynasi
 await pg.fill('#ct-name','Soxta'); await pg.selectOption('#ct-fam','BTC'); await pg.fill('#ct-addr',BTC2); await pg.click('#ct-add'); await pg.waitForSelector('#dlg-ok'); R.alikeDialog=await pg.$eval('#dlg-msg',e=>e.textContent); await pg.click('#dlg-no'); await pg.waitForTimeout(200);
 R.afterCancel=await pg.$$eval('#ct-list li',e=>e.length);
 R.list=await pg.$$eval('#ct-list li',e=>e.map(x=>x.textContent));
 await pg.screenshot({path:SH+'ct-page.png',fullPage:true});
 const core=JSON.parse(await pg.evaluate(fs.readFileSync(PROBES+'probe-core.js','utf8'))); R.probe={c:core.contrast.measured,f:core.contrast.failures.length,small:core.tapTargets.tooSmall.length,ov:core.layout.horizontalOverflow};
 // yuborish formasida tanlash
 await pg.click('#nav-assets'); await pg.waitForSelector('#list [data-act=addr]'); await pg.click('#list [data-act=addr]'); await pg.click('#rt-send'); await pg.waitForSelector('#sd-book');
 R.sendOptions=await pg.$$eval('#sd-book option',e=>e.map(x=>x.textContent)); await pg.selectOption('#sd-book',{index:1}); R.sendTo=await pg.$eval('#sd-to',e=>e.value);
 // qayta yuklash -> kirish -> saqlanganmi
 await pg.reload(); await pg.waitForSelector('#go'); const ins=await pg.$$('#wb input'); for(let i=0;i<words.length;i++) await ins[i].fill(words[i]); await pg.click('#go'); await pg.waitForSelector('.page:not([hidden])',{timeout:30000});
 await pg.evaluate(()=>{location.hash='#/contacts'}); await pg.waitForSelector('#ct-list li'); R.afterReload=await pg.$$eval('#ct-list li',e=>e.length);
 // o'chirish
 await pg.click('#ct-list button[data-i="0"]'); await pg.waitForSelector('#dlg-ok'); await pg.click('#dlg-ok'); await pg.waitForTimeout(300); R.afterDelete=await pg.$$eval('#ct-list li',e=>e.map(x=>x.textContent)); R.delNote=await pg.$eval('#ct-note',e=>e.textContent);
 R.errs=errs; console.log(JSON.stringify(R,null,1)); await b.close(); srv.close();
})().catch(e=>{console.error('FAIL',String(e).slice(0,300));console.log(JSON.stringify(global.R,null,1));process.exit(1)});
