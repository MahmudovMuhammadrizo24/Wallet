#!/usr/bin/env python3
"""v34 -> v35: yuklanish skeletonlari, qayta urinish tugmalari, planshet maketi, desktopda markaziy sheet, Yuborildi belgisi."""
import re, hashlib, base64, os, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

CSS = """/* v35: skeleton, planshet, markaziy sheet, muvaffaqiyat belgisi */
.skl{display:block;height:14px;border-radius:7px;background:linear-gradient(90deg,var(--s2) 0%,color-mix(in srgb,var(--s2) 55%,var(--card)) 50%,var(--s2) 100%);background-size:200% 100%;animation:skl 1.3s linear infinite}
@keyframes skl{to{background-position:-200% 0}}
.pxlist li.sk .ci{background:var(--s2);animation:skl 1.3s linear infinite;border-radius:50%}
.pxlist li.full{grid-column:1 / -1;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;padding:14px 16px}
.mn-skel{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mn-skel .skl{height:84px;border-radius:16px}
.hk-skel{display:flex;flex-direction:column;gap:10px;padding:6px 0}
.okmark{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--s2);color:var(--sky);margin-right:10px;vertical-align:middle}
.okmark svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.okmark svg path{stroke-dasharray:24;stroke-dashoffset:24;animation:okdraw .45s .1s ease forwards}
@keyframes okdraw{to{stroke-dashoffset:0}}
@media (min-width:768px) and (max-width:1023px){
  .wrap{max-width:none;margin:0 0 0 72px;padding:16px 28px 48px}
  .nav{top:0;right:auto;bottom:0;width:72px;border-top:0;border-right:1px solid var(--line);padding:16px 8px;background:var(--card);-webkit-backdrop-filter:none;backdrop-filter:none}
  .nav-in{max-width:none;height:100%;display:flex;flex-direction:column;gap:4px}
  .nav .dk{display:flex}
  .nav-brand{justify-content:center;padding:0 0 14px}
  .nav-brand .logo{width:36px;height:36px}
  .nav-brand span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  .nav button{width:100%;flex-direction:row;justify-content:center;min-height:52px;padding:0;border-radius:14px}
  .nav button span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  .nav button svg{box-sizing:content-box;width:24px;height:24px;padding:0;border-radius:0}
  .nav button:hover{background:var(--s2)}
  .nav button[aria-current=page]{background:var(--s2);color:var(--sky)}
  .nav-sp{flex:1;min-height:8px}
  #brand{display:none}
  .appbar{margin:0 -28px 12px;padding:10px 28px}
  .toast{left:calc(50% + 36px);bottom:24px}
  #pg-settings,#pg-backup,#pg-wallets,#pg-add,#pg-contacts,#pg-mining,#recv,#pick,#pg-security{max-width:720px}
}
@media (min-width:768px){
  .sheet-bg{align-items:center}
  .sheet{border-radius:24px;max-width:520px;margin:0 16px}
}
"""
sub("/* Narxlar sahifasi */", CSS + "/* Narxlar sahifasi */", 'css')
sub("window.matchMedia('(min-width:1024px)').matches", "window.matchMedia('(min-width:768px)').matches", 'isdesk')

# Narxlar: skeleton va qayta urinish
SK = "'<li class=\"sk\"><span class=\"ci\" aria-hidden=\"true\"></span><span class=\"px-t\"><span class=\"skl\" style=\"width:45%\"></span><span class=\"skl\" style=\"width:22%;margin-top:7px\"></span></span><span class=\"skl\" style=\"width:60px\"></span></li>'.repeat(8)"
sub("""if (!PX && pxBusy) { ul.innerHTML = '<li><span class="mut">Yuklanmoqda...</span></li>'; return; }""",
    "if (!PX && pxBusy) { ul.innerHTML = " + SK + "; return; }", 'px-skel')
sub("""if (!PX && pxErr) { ul.innerHTML = '<li><span class="mut">Ma\\'lumot olinmadi.</span></li>'; return; }""",
    """if (!PX && pxErr) { ul.innerHTML = '<li class="full"><span class="mut">Ma\\'lumot olinmadi. Internetni tekshiring.</span><button type="button" class="sm" id="px-retry">Qayta urinish</button></li>'; const rb = $('#px-retry'); if (rb) rb.onclick = () => loadPx(); return; }""", 'px-retry')
sub("""if (!rows.length) { ul.innerHTML = '<li><span class="mut">Hech narsa topilmadi.</span></li>'; return; }""",
    """if (!rows.length) { ul.innerHTML = '<li class="full"><span class="mut">Hech narsa topilmadi.</span></li>'; return; }""", 'px-empty')

# Mining: skeleton va qayta urinish
sub("""el.innerHTML = mnBusy ? '<p class="mut">Yuklanmoqda...</p>'
      : '<div class="empty"><strong>Ma\\'lumot olinmadi</strong><p>Internetni tekshirib, "Yangilash" tugmasini bosing.</p></div>';
    paintCalc(); return;""",
    """el.innerHTML = mnBusy ? '<div class="mn-skel" aria-hidden="true"><span class="skl"></span><span class="skl"></span><span class="skl"></span><span class="skl"></span></div>'
      : '<div class="empty"><strong>Ma\\'lumot olinmadi</strong><p>Internetni tekshirib, qayta urinib ko\\'ring.</p><button type="button" id="mn-retry">Qayta urinish</button></div>';
    const mr = $('#mn-retry'); if (mr) mr.onclick = () => loadMining(true);
    paintCalc(); return;""", 'mn')

# Tarix: skeleton
sub("""host.innerHTML = '<p class="mut" role="status">Yuklanmoqda...</p>';""",
    """host.innerHTML = '<div class="hk-skel" role="status" aria-label="Yuklanmoqda"><span class="skl" style="height:46px;border-radius:14px"></span><span class="skl" style="height:46px;border-radius:14px"></span><span class="skl" style="height:46px;border-radius:14px"></span></div>';""", 'hist')

# Yuborildi: chizilgan galochka
sub("""<h3 style="margin:0 0 6px;font-size:16px">Yuborildi</h3>""",
    """<h3 style="margin:0 0 6px;font-size:16px"><span class="okmark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>Yuborildi</h3>""", 'ok')

sub("Mening hamyonim · versiya 34", "Mening hamyonim · versiya 35", 'v1')
sub("Versiya 34. Ilova mustaqil", "Versiya 35. Ilova mustaqil", 'v2')
scripts = list(re.finditer(r'<script>([\s\S]*?)</script>', html))
def h(s): return "'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'"
mm = re.search(r"script-src[^;\"]*", html)
sub(mm.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(h(s.group(1)) for s in scripts), 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
