#!/usr/bin/env python3
"""v31 -> v32: alohida "Narxlar" sahifasi (#/prices): barcha kriptolarning hozirgi narxi va 24 soatlik o'zgarishi."""
import re, hashlib, base64, os, shutil, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

sub("/* Mining sahifasi */", r"""/* Narxlar sahifasi */
#as-px{display:inline-flex;align-items:center;min-height:44px;min-width:44px;font-weight:600}
.pxbar{display:flex;gap:8px;align-items:center;margin:0 0 12px}
.pxbar input{flex:1;min-width:0;min-height:44px;border-radius:22px;border:1px solid var(--line);background:var(--card);color:var(--txt);padding:0 16px;font:inherit}
.pxlist{list-style:none;margin:0;padding:0;background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.pxlist li{display:flex;align-items:center;gap:12px;min-height:64px;padding:0 16px;border-bottom:1px solid var(--s2)}
.pxlist li:last-child{border-bottom:0}
.pxlist .px-t{flex:1;min-width:0}
.pxlist .px-n{font-weight:600;font-size:15px;display:block}
.pxlist .px-s{font-size:13px;color:var(--mut);display:block}
.pxlist .px-v{text-align:right;font-weight:700;font-size:15px}
.pxlist .px-c{display:block;font-size:13px;font-weight:600}
.pxlist .ci{flex:none}
/* Mining sahifasi */""", 'css')

page = r'''  <section class="page" id="pg-prices" hidden>
    <h1 class="ph" tabindex="-1">Narxlar</h1>
    <p class="mut" id="px-st" role="status" aria-live="polite" style="margin:-4px 0 12px"></p>
    <div class="pxbar"><label for="px-q" class="sr">Qidirish</label><input id="px-q" type="search" placeholder="Qidirish: BTC, Ethereum..." autocomplete="off"><button type="button" class="sec sm" id="px-refresh">Yangilash</button></div>
    <ul class="pxlist" id="px-list" aria-busy="true"></ul>
    <p class="mut" style="margin-top:12px">Narxlar CoinGecko'dan olinadi, AQSh dollarida. Ular taxminiy va bir necha daqiqa kechikishi mumkin.</p>
  </section>
'''
sub('  <section class="page" id="pg-mining" hidden>', page + '  <section class="page" id="pg-mining" hidden>', 'page')
sub("mining: 'pg-mining', contacts: 'pg-contacts' };", "mining: 'pg-mining', contacts: 'pg-contacts', prices: 'pg-prices' };", 'PAGES')
sub("mining: 'nav-wallet', contacts: 'nav-se", "mining: 'nav-wallet', prices: 'nav-wallet', contacts: 'nav-se", 'NAVOF')
sub("mining: 'Mining', contacts: 'Kontaktlar' };", "mining: 'Mining', prices: 'Narxlar', contacts: 'Kontaktlar' };", 'TITLES')
sub("mining: 'home', contacts: 'settings' };", "mining: 'home', prices: 'home', contacts: 'settings' };", 'PARENT')
sub("    if (r.name === 'mining') loadMining();\n", "    if (r.name === 'mining') loadMining();\n    if (r.name === 'prices') openPrices();\n", 'route')

link = '''    <div class="tipcard"><a class="rowlink" href="#/prices"><span class="ri"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/></svg></span><span><b>Narxlar</b><small>Barcha kriptolarning hozirgi narxi</small></span><svg viewBox="0 0 24 24" class="ch" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg></a></div>
'''
sub('    <div class="tipcard"><a class="rowlink" href="#/mining">', link + '    <div class="tipcard"><a class="rowlink" href="#/mining">', 'homelink')
sub('<a class="pill" href="#/add" id="as-add">Aktiv qo\'shish</a></div>', '<a class="pill" href="#/add" id="as-add">Aktiv qo\'shish</a></div>\n    <p style="margin:-8px 0 4px"><a href="#/prices" id="as-px">Barcha narxlarni ko\'rish</a></p>', 'assetslink')

js = r'''
/* ---------- Narxlar sahifasi: barcha kriptolarning hozirgi narxi (faqat ommaviy ma'lumot, CoinGecko) ---------- */
let PX = null, pxBusy = false, pxAt = null, pxErr = false;
const pxCoins = () => {
  const seen = new Set(), out = [];
  const add = (cg, sym, name) => { if (!cg || seen.has(cg)) return; seen.add(cg); out.push({ cg, sym, name }); };
  for (const k of ['BTC', 'ETH', 'TON', 'SOL', 'TRX']) if (COINS[k]) add(COINS[k].cg, COINS[k].sym, String(COINS[k].name).split(' (')[0]);
  for (const c of Object.values(COINS)) add(c.cg, c.sym, String(c.name).split(' (')[0]);
  return out;
};
const fmtPx = n => n >= 1 ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : '$' + n.toLocaleString('en-US', { minimumSignificantDigits: 2, maximumSignificantDigits: 4, maximumFractionDigits: 10 });
async function loadPx() {
  if (pxBusy) return; pxBusy = true; pxErr = false; paintPx();
  try {
    const ids = pxCoins().map(c => c.cg), res = {};
    for (let i = 0; i < ids.length; i += 40) {
      const j = await jfetch('https://api.coingecko.com/api/v3/simple/price?ids=' + ids.slice(i, i + 40).map(encodeURIComponent).join(',') + '&vs_currencies=usd&include_24hr_change=true');
      for (const id of ids.slice(i, i + 40)) if (j[id] && Number.isFinite(j[id].usd)) res[id] = { usd: j[id].usd, ch: Number.isFinite(j[id].usd_24h_change) ? j[id].usd_24h_change : undefined };
    }
    if (!Object.keys(res).length) throw new Error('bo\'sh javob');
    PX = res; pxAt = new Date();
    for (const id in res) prices[id] = res[id];
  } catch (e) { pxErr = true; }
  pxBusy = false; paintPx();
}
function paintPx() {
  const ul = $('#px-list'); if (!ul) return;
  ul.setAttribute('aria-busy', String(pxBusy));
  $('#px-refresh').disabled = pxBusy;
  const q = ($('#px-q').value || '').trim().toLowerCase();
  const st = $('#px-st');
  st.textContent = pxBusy ? 'Yangilanmoqda...' : pxErr ? 'Narxlarni olib bo\'lmadi. Internetni tekshirib, "Yangilash" tugmasini bosing.' + (pxAt ? ' Oxirgi marta: ' + pxAt.toLocaleTimeString() : '') : pxAt ? 'Yangilandi: ' + pxAt.toLocaleTimeString() : '';
  const have = PX || {};
  const rows = pxCoins().filter(c => !q || c.sym.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  if (!PX && pxBusy) { ul.innerHTML = '<li><span class="mut">Yuklanmoqda...</span></li>'; return; }
  if (!PX && pxErr) { ul.innerHTML = '<li><span class="mut">Ma\'lumot olinmadi.</span></li>'; return; }
  if (!rows.length) { ul.innerHTML = '<li><span class="mut">Hech narsa topilmadi.</span></li>'; return; }
  ul.innerHTML = rows.map(c => {
    const p = have[c.cg], ch = p && p.ch;
    const chTxt = Number.isFinite(ch) ? (ch >= 0 ? '▲ +' : '▼ −') + Math.abs(ch).toFixed(2) + '%' : '';
    return '<li><span class="ci" aria-hidden="true" style="--c:' + (CCOL[c.sym] || 'var(--coin-other)') + '">' + (GLYPH[c.sym] || esc(c.sym.slice(0, 1))) + '</span>'
      + '<span class="px-t"><span class="px-n">' + esc(c.name) + '</span><span class="px-s">' + esc(c.sym) + '</span></span>'
      + '<span class="px-v">' + (p ? esc(fmtPx(p.usd)) : '—') + (chTxt ? '<span class="px-c ' + (ch >= 0 ? 'up' : 'down') + '">' + chTxt + '</span>' : '') + '</span></li>';
  }).join('');
}
function openPrices() {
  $('#px-refresh').onclick = () => loadPx();
  $('#px-q').oninput = paintPx;
  paintPx();
  if (!PX || !pxAt || Date.now() - pxAt.getTime() > 60000) loadPx();
}
'''
sub("function paintMining() {", js.lstrip('\n') + "\nfunction paintMining() {", 'js')

sub("Mening hamyonim · versiya 31", "Mening hamyonim · versiya 32", 'v1'); sub("Versiya 31. Ilova mustaqil", "Versiya 32. Ilova mustaqil", 'v2')
# CSP hashlari qayta hisoblanadi
scripts = list(re.finditer(r'<script>([\s\S]*?)</script>', html))
print('scripts', len(scripts))
def h(s): return "'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'"
m = re.search(r"script-src[^;\"]*", html)
sub(m.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(h(s.group(1)) for s in scripts), 'csp')
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
