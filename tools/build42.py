#!/usr/bin/env python3
"""v41 -> v42: Diagrammalar sahifasidagi har bir qatorga bosilganda, o'sha tokenning
haqiyqiy birjalardagidek sham (candlestick) narx grafigi ochiladi: CoinGecko OHLC
tarixidan 1/7/30 kunlik davr tanlab, ko'tarilish/tushishlar SVG shamlarda ko'rsatiladi."""
import re, hashlib, base64, os, sys, json
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

# 1) CSS: qator bosilganda ochiladigan sham-grafik bo'limi
CSS = """/* v42: sham (candlestick) grafik */
.cx-row{cursor:pointer}
.cx-detail{margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)}
.cx-per{display:flex;gap:6px;margin-bottom:8px}
.cx-per button{flex:1;padding:6px 0;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--txt);font-size:12px;cursor:pointer}
.cx-per button[aria-pressed=true]{background:var(--sky);color:#fff;border-color:transparent}
.cxsvg{width:100%;height:auto;display:block;border-radius:8px;background:color-mix(in srgb,var(--txt) 4%,transparent)}
.cx-hl{display:flex;justify-content:space-between;font-size:12px;margin-top:6px;color:var(--mut)}
"""
sub("/* Narxlar sahifasi */", CSS + "/* Narxlar sahifasi */", 'css')

# 2) paintCharts(): har bir qatorni bosiladigan qilib, ichiga .cx-detail joy qo'shish
OLD_ROW = """    return '<li><div class="cxhead"><span class="a-t"><span class="a-n">' + nm + ' · ' + esc(sym) + '</span>' + ch + '</span><span class="a-q">' + mask(fmtUsd(r.val)) + '</span></div>'
      + '<div class="cxtrack"><div class="cxfill" style="width:' + (hidden ? 0 : Math.max(2, r.val / max * 100).toFixed(2)) + '%;background:' + PALETTE2[i % PALETTE2.length] + '"></div></div>'
      + '<div class="mut" style="font-size:12px;margin-top:4px">' + unitPx + ' / ' + esc(sym) + '</div></li>';
  }).join('') + '</ul>';
}"""
NEW_ROW = """    const cg = cgOf(r.it);
    return '<li class="cx-row" data-cg="' + esc(cg || '') + '"><div class="cxhead"><span class="a-t"><span class="a-n">' + nm + ' · ' + esc(sym) + '</span>' + ch + '</span><span class="a-q">' + mask(fmtUsd(r.val)) + '</span></div>'
      + '<div class="cxtrack"><div class="cxfill" style="width:' + (hidden ? 0 : Math.max(2, r.val / max * 100).toFixed(2)) + '%;background:' + PALETTE2[i % PALETTE2.length] + '"></div></div>'
      + '<div class="mut" style="font-size:12px;margin-top:4px">' + unitPx + ' / ' + esc(sym) + '</div>'
      + (cg ? '<div class="cx-detail" hidden></div>' : '') + '</li>';
  }).join('') + '</ul>';
  out.onclick = cxRowClick;
}
let cxOpenCg = null, cxCache = {}, cxPeriod = {};
const CX_DAYS = [1, 7, 30];
async function loadOhlc(cg, days) {
  const key = cg + ':' + days;
  const c = cxCache[key];
  if (c && Date.now() - c.t < 120000) return c.d;
  const j = await jfetch('https://api.coingecko.com/api/v3/coins/' + encodeURIComponent(cg) + '/ohlc?vs_currency=usd&days=' + days);
  const d = Array.isArray(j) ? j.filter(r => Array.isArray(r) && r.length === 5 && r.slice(1).every(Number.isFinite)) : [];
  cxCache[key] = { t: Date.now(), d };
  return d;
}
function candleSvg(d) {
  const W = 300, H = 140, pad = 6;
  const lo = Math.min(...d.map(r => r[3])), hi = Math.max(...d.map(r => r[2]));
  const span = (hi - lo) || (hi || 1) * 0.01 || 1;
  const y = v => pad + (H - pad * 2) * (1 - (v - lo) / span);
  const step = (W - pad * 2) / d.length;
  const bw = Math.max(1.5, step * 0.6);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="cxsvg" role="img" aria-label="Narxlar grafigi">';
  d.forEach((r, i) => {
    const o = r[1], h = r[2], l = r[3], c = r[4];
    const cx = pad + step * i + step / 2;
    const col = c >= o ? 'var(--up)' : 'var(--down)';
    s += '<line x1="' + cx.toFixed(1) + '" y1="' + y(h).toFixed(1) + '" x2="' + cx.toFixed(1) + '" y2="' + y(l).toFixed(1) + '" stroke="' + col + '" stroke-width="1"></line>';
    const yo = y(o), yc = y(c), top = Math.min(yo, yc).toFixed(1), hgt = Math.max(1, Math.abs(yo - yc)).toFixed(1);
    s += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + top + '" width="' + bw.toFixed(1) + '" height="' + hgt + '" fill="' + col + '"></rect>';
  });
  return s + '</svg>';
}
async function paintCandle(det, cg, days) {
  cxPeriod[cg] = days;
  const perBtn = d => '<button type="button" data-d="' + d + '" aria-pressed="' + (d === days) + '">' + d + ' kun</button>';
  det.innerHTML = '<div class="cx-per">' + CX_DAYS.map(perBtn).join('') + '</div><p class="mut">Yuklanmoqda...</p>';
  det.querySelectorAll('.cx-per button').forEach(b => b.onclick = () => paintCandle(det, cg, Number(b.dataset.d)));
  try {
    const d = await loadOhlc(cg, days);
    if (cxOpenCg !== cg || !det.isConnected) return;
    const old = det.querySelector('p.mut, div.cxwrap');
    if (!d.length) { if (old) old.outerHTML = '<p class="mut">Ma\\'lumot olinmadi. Internetni tekshiring.</p>'; return; }
    const lo = Math.min(...d.map(r => r[3])), hi = Math.max(...d.map(r => r[2]));
    const html2 = '<div class="cxwrap">' + candleSvg(d) + '<div class="cx-hl"><span>Eng past: ' + fmtUsd(lo) + '</span><span>Eng baland: ' + fmtUsd(hi) + '</span></div></div>';
    if (old) old.outerHTML = html2;
  } catch (e) {
    if (cxOpenCg !== cg || !det.isConnected) return;
    const old = det.querySelector('p.mut, div.cxwrap');
    if (old) old.outerHTML = '<p class="mut">Ma\\'lumot olinmadi. Internetni tekshiring.</p>';
  }
}
function cxRowClick(e) {
  const li = e.target.closest('.cx-row'); if (!li) return;
  const cg = li.dataset.cg; if (!cg) return;
  const det = li.querySelector('.cx-detail'); if (!det) return;
  if (cxOpenCg === cg && !det.hidden) { det.hidden = true; cxOpenCg = null; return; }
  const out = $('#cx-out');
  if (out) out.querySelectorAll('.cx-detail').forEach(d => { if (d !== det) d.hidden = true; });
  cxOpenCg = cg;
  det.hidden = false;
  paintCandle(det, cg, cxPeriod[cg] || 7);
}"""
sub(OLD_ROW, NEW_ROW, 'candle-feature')

# versiya
D = json.load(open(os.path.join(HERE, 'i18n', 'dict.json'), encoding='utf-8'))
VER = {'en': 'My wallet · version 42', 'ru': 'Мой кошелёк · версия 42', 'tr': 'Cüzdanım · sürüm 42', 'ar': 'محفظتي · الإصدار 42', 'zh': '我的钱包 · 版本 42'}
for l in D:
    nd = {}
    for k, v in D[l].items():
        if k == 'Mening hamyonim · versiya 36': nd['Mening hamyonim · versiya 42'] = VER[l]; continue
        nd[k.replace('Versiya 36.', 'Versiya 42.')] = v.replace('{N}', '42')
    D[l] = nd
I18S = '{' + ','.join(json.dumps(l) + ':' + json.dumps(json.dumps(D[l], ensure_ascii=False, separators=(',', ':')), ensure_ascii=False).replace('</', '<\\/') for l in D) + '}'
a = html.index('const I18S = '); b = html.index(';\nconst I18N = {};', a)
html = html[:a] + 'const I18S = ' + I18S + html[b:]
sub("Mening hamyonim · versiya 41", "Mening hamyonim · versiya 42", 'ver1')
sub("Versiya 41. Ilova", "Versiya 42. Ilova", 'ver2')

scripts = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S)
hs = ["'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'" for s in scripts]
mm = re.search(r"script-src 'wasm-unsafe-eval'((?: 'sha256-[^']+')+)", html)
assert mm and len(hs) == len(mm.group(1).split())
html = html.replace(mm.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(hs))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html))
