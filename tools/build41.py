#!/usr/bin/env python3
"""v40 -> v41: Bosh sahifaga "Diagrammalar" bo'limi qo'shildi. Yangi #/charts sahifasida
"Diagramma tahlili" tugmasi bosilganda, aktivlar joriy narxi/qiymati bo'yicha ustun diagrammasi chiziladi."""
import re, hashlib, base64, os, sys, json
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

# 1) CSS
CSS = """/* v41: Diagrammalar */
.cxlist{list-style:none;margin:14px 0 0;padding:0}
.cxlist li{padding:10px 0}
.cxlist li+li{border-top:1px solid var(--line)}
.cxhead{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.cxhead .a-t{flex:1;min-width:0;display:flex;align-items:baseline;gap:8px}
.cxhead .a-n{font-weight:600;font-size:14px}
.cxhead .a-q{font-weight:700;font-size:14px;white-space:nowrap}
.cxtrack{height:10px;border-radius:6px;background:color-mix(in srgb,var(--txt) 10%,transparent);overflow:hidden}
.cxfill{height:100%;border-radius:6px;transition:width .4s ease}
"""
sub("/* Narxlar sahifasi */", CSS + "/* Narxlar sahifasi */", 'css')

# 2) Home: ikkinchi tipcard
OLD_TIP = '''    <div class="tipcard"><a class="rowlink" href="#/prices"><span class="ri"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/></svg></span><span><b>Narxlar</b><small>Barcha kriptolarning hozirgi narxi</small></span><svg viewBox="0 0 24 24" class="ch" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg></a></div>'''
NEW_TIP = OLD_TIP + '''
    <div class="tipcard"><a class="rowlink" href="#/charts"><span class="ri"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="12" width="4" height="8" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="16" y="3" width="4" height="17" rx="1"/></svg></span><span><b>Diagrammalar</b><small>Tokenlaringizning joriy narxi va ulushi</small></span><svg viewBox="0 0 24 24" class="ch" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg></a></div>'''
sub(OLD_TIP, NEW_TIP, 'home-tip')

# 3) Diagrammalar sahifasi
sub('  <section class="page" id="pg-mining" hidden>',
    '''  <section class="page" id="pg-charts" hidden>
    <h1 class="ph" tabindex="-1">Diagrammalar</h1>
    <section class="card">
      <p class="mut" style="margin-top:0">Diagrammalar faqat narxi ma'lum aktivlarni ko'rsatadi, AQSh dollarida.</p>
      <button type="button" class="sec w100" id="cx-analyze">Diagramma tahlili</button>
      <div id="cx-out" style="margin-top:4px"></div>
    </section>
  </section>
  <section class="page" id="pg-mining" hidden>''', 'charts-page')

# 4) Routing jadvallari
sub("prices: 'pg-prices' };", "prices: 'pg-prices', charts: 'pg-charts' };", 'pages')
sub("mining: 'nav-wallet', prices: 'nav-wallet', contacts: 'nav-set' };", "mining: 'nav-wallet', prices: 'nav-wallet', charts: 'nav-wallet', contacts: 'nav-set' };", 'navof')
sub("mining: 'Mining', prices: 'Narxlar', contacts: 'Kontaktlar' };", "mining: 'Mining', prices: 'Narxlar', charts: 'Diagrammalar', contacts: 'Kontaktlar' };", 'titles')
sub("mining: 'home', prices: 'home', contacts: 'settings' };", "mining: 'home', prices: 'home', charts: 'home', contacts: 'settings' };", 'parent')

# 5) PAINT funksiyasi + tugma
sub("function openPrices() {",
    '''function paintCharts() {
  const out = $('#cx-out'); if (!out) return;
  const PALETTE2 = (typeof PALETTE !== 'undefined' && PALETTE.length) ? PALETTE : ['#2f7bf6', '#19b37e', '#f5a524', '#ef5a6f', '#8b5cf6', '#06b6d4'];
  const rows = (data ? data.items : []).map(it => { const amt = amountOf(it), p = prices[cgOf(it)]; const val = (typeof amt === 'number' && p) ? amt * p.usd : null; return { it, p, val }; })
    .filter(r => r.val !== null && r.val > 0).sort((a, b) => b.val - a.val);
  if (!rows.length) { out.innerHTML = '<p class="mut">' + (data && data.items.length ? "Aktivlaringiz yo'q, shuning uchun diagramma chizib bo'lmaydi." : "Aktivlaringiz yo'q, shuning uchun diagramma chizib bo'lmaydi.") + '</p>'; return; }
  const max = rows[0].val;
  out.innerHTML = '<ul class="cxlist">' + rows.map((r, i) => {
    const sym = symOf(r.it), nm = esc(nameOf(r.it)), ch = typeof r.p.ch === 'number' ? ('<span class="' + (r.p.ch >= 0 ? 'up' : 'down') + '">' + (r.p.ch >= 0 ? '+' : '') + r.p.ch.toFixed(2) + '%</span>') : '';
    const unitPx = r.p && typeof r.p.usd === 'number' ? fmtUsd(r.p.usd) : '-';
    return '<li><div class="cxhead"><span class="a-t"><span class="a-n">' + nm + ' · ' + esc(sym) + '</span>' + ch + '</span><span class="a-q">' + mask(fmtUsd(r.val)) + '</span></div>'
      + '<div class="cxtrack"><div class="cxfill" style="width:' + (hidden ? 0 : Math.max(2, r.val / max * 100).toFixed(2)) + '%;background:' + PALETTE2[i % PALETTE2.length] + '"></div></div>'
      + '<div class="mut" style="font-size:12px;margin-top:4px">' + unitPx + ' / ' + esc(sym) + '</div></li>';
  }).join('') + '</ul>';
}
function openPrices() {''', 'paintCharts-def')
sub("    if (r.name === 'prices') openPrices();",
    "    if (r.name === 'prices') openPrices();\n    if (r.name === 'charts') { const b = $('#cx-analyze'); if (b) b.onclick = paintCharts; }", 'route-hook')

# versiya
D = json.load(open(os.path.join(HERE, 'i18n', 'dict.json'), encoding='utf-8'))
VER = {'en': 'My wallet · version 41', 'ru': 'Мой кошелёк · версия 41', 'tr': 'Cüzdanım · sürüm 41', 'ar': 'محفظتي · الإصدار 41', 'zh': '我的钱包 · 版本 41'}
for l in D:
    nd = {}
    for k, v in D[l].items():
        if k == 'Mening hamyonim · versiya 36': nd['Mening hamyonim · versiya 41'] = VER[l]; continue
        nd[k.replace('Versiya 36.', 'Versiya 41.')] = v.replace('{N}', '41')
    D[l] = nd
I18S = '{' + ','.join(json.dumps(l) + ':' + json.dumps(json.dumps(D[l], ensure_ascii=False, separators=(',', ':')), ensure_ascii=False).replace('</', '<\\/') for l in D) + '}'
a = html.index('const I18S = '); b = html.index(';\nconst I18N = {};', a)
html = html[:a] + 'const I18S = ' + I18S + html[b:]
sub("Mening hamyonim · versiya 40", "Mening hamyonim · versiya 41", 'ver1')
sub("Versiya 40. Ilova", "Versiya 41. Ilova", 'ver2')

scripts = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S)
hs = ["'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'" for s in scripts]
mm = re.search(r"script-src 'wasm-unsafe-eval'((?: 'sha256-[^']+')+)", html)
assert mm and len(hs) == len(mm.group(1).split())
html = html.replace(mm.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(hs))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html))
