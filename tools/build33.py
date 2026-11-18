#!/usr/bin/env python3
"""v32 -> v33: UI dizayn (Figma kanvasi) bo'yicha: yangi logo, nomlar, kirish ekrani, Xavfsizlik sahifasi."""
import re, hashlib, base64, os, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

# 1) Yangi logo
m = re.search(r"const LOGO = '.*?';\n", html)
assert m, 'LOGO'
NEWLOGO = ("const LOGO = '<svg class=\"logo\" viewBox=\"0 0 120 120\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"4\" y=\"4\" width=\"112\" height=\"112\" rx=\"28\" fill=\"#0b63b8\"/>"
           "<path d=\"M30 44 L74 28 a7 7 0 0 1 9.5 6.5 V44\" fill=\"none\" stroke=\"#fff\" stroke-opacity=\".55\" stroke-width=\"6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
           "<rect x=\"26\" y=\"42\" width=\"68\" height=\"46\" rx=\"12\" fill=\"#fff\"/><circle cx=\"78\" cy=\"65\" r=\"9\" fill=\"#ffc72c\"/><circle cx=\"78\" cy=\"65\" r=\"3\" fill=\"#0a3f7a\"/></svg>';\n")
html = html.replace(m.group(0), NEWLOGO)

# 2) CSS: kirish ekrani (hero) va Xavfsizlik kartalari
sub("/* Narxlar sahifasi */", """/* Kirish ekrani (dizayn: Boshlash) */
.logo{border-radius:0}
.authhero{margin:-16px -16px 8px;padding:32px 20px 24px;border-radius:var(--r) var(--r) 28px 28px;background:linear-gradient(160deg,#0b63b8,#0a3f7a);color:#fff;text-align:center}
.authhero .logo{width:84px;height:84px;margin:0 auto 14px}
.authhero .logo>rect:first-of-type{fill:#fff;fill-opacity:.16}
.authhero h1{color:#fff;font-size:26px;font-weight:800;margin:0 0 6px}
.authhero .tagline,.center .authhero .tagline{color:rgba(255,255,255,.92);font-size:15px;margin:0}
#pg-security .card h3{display:flex;align-items:center;gap:8px}
/* Narxlar sahifasi */""", 'css')
sub("    <div class=\"brand\">${LOGO}<h1>Mening hamyonim</h1></div>\n    <p class=\"tagline\">Faqat shu qurilmada saqlanadigan, shifrlangan hamyon.</p>",
    "    <div class=\"authhero\">${LOGO}<h1>Mening hamyonim</h1><p class=\"tagline\">Faqat shu qurilmada saqlanadigan, shifrlangan hamyon.</p></div>", 'auth')

# 3) Yagona nomlar
sub("receive: 'To\\'ldirish', send: 'Jo\\'natish'", "receive: 'Qabul qilish', send: 'Yuborish'", 'titles')

# 4) Xavfsizlik sahifasi: sarlavha, kartalarga bo'lish, eskirgan matn
sub('<h1 class="ph" tabindex="-1">Xavfsizlik va jonli sinov</h1>', '<h1 class="ph" tabindex="-1">Xavfsizlik</h1>', 'sec-h1')
sub('    <hr class="sep">\n    <h3 style="margin:0 0 4px;font-size:16px" id="lim-h">',
    '  </section>\n  <section class="card" id="lim-card" aria-labelledby="lim-h">\n    <h3 style="margin:0 0 4px;font-size:16px" id="lim-h">', 'sec-lim')
sub('    <hr class="sep">\n    <p class="mut" id="bio-state"></p>',
    '  </section>\n  <section class="card" id="bio-card">\n    <p class="mut" id="bio-state"></p>', 'sec-bio')
sub("4-6 xonali PIN oflayn buzilishi mumkin (urinishlar cheklovi faqat ilova ichida ishlaydi)",
    "PIN (8-12 raqam, Argon2id bilan kuchaytirilgan) ilova cheklovlarisiz, oflayn urinib ko'rilishi mumkin", 'sec-warn')

# 5) Versiya
sub("Mening hamyonim · versiya 32", "Mening hamyonim · versiya 33", 'v1')
sub("Versiya 32. Ilova mustaqil", "Versiya 33. Ilova mustaqil", 'v2')

# CSP hashlari
scripts = list(re.finditer(r'<script>([\s\S]*?)</script>', html))
def h(s): return "'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'"
mm = re.search(r"script-src[^;\"]*", html)
sub(mm.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(h(s.group(1)) for s in scripts), 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
