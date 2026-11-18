#!/usr/bin/env python3
"""v35 -> v36: animatsiyalar: balans count-up, narx yonishi, ro'yxat stagger, xato silkinishi, modal/toast/sheet, menyu, yangilash aylanishi."""
import re, hashlib, base64, os, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

CSS = """/* v36: animatsiyalar (transform/opacity; prefers-reduced-motion da o'chadi) */
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes popIn{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
@keyframes toastIn{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes rowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes flashUp{from{background:rgba(10,140,70,.22)}to{background:transparent}}
@keyframes flashDown{from{background:rgba(200,40,40,.2)}to{background:transparent}}
.modal-bg,.sheet-bg{animation:fadeIn .16s ease both}
.modal{animation:popIn .2s ease both}
.toast{animation:toastIn .24s ease both}
input[aria-invalid=true]{animation:shake .38s ease}
.nav button{transition:background-color .2s,color .2s}
.nav button svg{transition:stroke .2s}
.pxlist.stg li{animation:rowIn .3s ease both;animation-delay:calc(var(--i,0) * 28ms)}
.pxlist li.fl-up{animation:flashUp 1.1s ease-out}
.pxlist li.fl-down{animation:flashDown 1.1s ease-out}
#refresh.spin svg{animation:spin .9s linear infinite}
.total{font-variant-numeric:tabular-nums}
"""
sub("/* Narxlar sahifasi */", CSS + "/* Narxlar sahifasi */", 'css')

# Balans: count-up
sub("function paintPx() {", """let totShown = 0, totRaf = 0;
function animTotal(el, to) {
  if (!el) return;
  cancelAnimationFrame(totRaf);
  const from = totShown; totShown = to;
  let calm = false; try { calm = window.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}
  const put = v => { el.textContent = mask(fmtUsd(v)); };
  if (calm || hidden || !(Math.abs(to - from) > 0.005) || !(typeof requestAnimationFrame === 'function')) { put(to); return; }
  const t0 = performance.now(), D = 650;
  const step = now => {
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
    if (k >= 1) { put(to); return; }
    put(from + (to - from) * e); totRaf = requestAnimationFrame(step);
  };
  totRaf = requestAnimationFrame(step);
}
const pxSeen = {};
function paintPx() {""", 'anim-fn')
sub("$('#total').textContent = mask(fmtUsd(total));", "animTotal($('#total'), total);", 'total')

# Narxlar: yonish va stagger
sub("  ul.innerHTML = rows.map(c => {\n    const p = have[c.cg], ch = p && p.ch;",
    "  const stg = !ul.children.length || !!ul.querySelector('li.sk');\n  ul.innerHTML = rows.map((c, i) => {\n    const p = have[c.cg], ch = p && p.ch;\n    const pv = pxSeen[c.cg], fl = (pv !== undefined && p && pv !== p.usd) ? (p.usd > pv ? ' class=\"fl-up\"' : ' class=\"fl-down\"') : '';", 'px-map')
sub("""    return '<li><span class="ci" aria-hidden="true" style="--c:'""", """    return '<li' + fl + ' style="--i:' + Math.min(i, 12) + '"><span class="ci" aria-hidden="true" style="--c:'""", 'px-li')
sub("""  }).join('');
}
function openPrices() {""", """  }).join('');
  for (const c of rows) { const p = have[c.cg]; if (p) pxSeen[c.cg] = p.usd; }
  if (stg) { ul.classList.add('stg'); setTimeout(() => ul.classList.remove('stg'), 900); }
}
function openPrices() {""", 'px-end')

# Yangilash tugmasi aylanadi
sub("  refreshing = true;\n  const st = $('#status');", "  refreshing = true;\n  { const rb = $('#refresh'); if (rb) rb.classList.add('spin'); }\n  const st = $('#status');", 'spin-on')
sub("lastUpdate = new Date(); refreshing = false; updateView();", "lastUpdate = new Date(); refreshing = false; { const rb = $('#refresh'); if (rb) rb.classList.remove('spin'); } updateView();", 'spin-off')

sub("Mening hamyonim · versiya 35", "Mening hamyonim · versiya 36", 'v1')
sub("Versiya 35. Ilova mustaqil", "Versiya 36. Ilova mustaqil", 'v2')
scripts = list(re.finditer(r'<script>([\s\S]*?)</script>', html))
def h(s): return "'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'"
mm = re.search(r"script-src[^;\"]*", html)
sub(mm.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(h(s.group(1)) for s in scripts), 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
