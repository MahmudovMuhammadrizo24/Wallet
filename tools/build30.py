#!/usr/bin/env python3
"""v29 -> v30: yangi PIN kamida 8 raqam (eski 6-7 xonali PINlar ochilishda ishlayveradi)."""
import re, hashlib, base64, os, shutil, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)
sub("Yangi PIN kiriting (6-12 raqam). Qancha uzun bo\\'lsa, shuncha xavfsiz: 8 va undan ko\\'p raqam tavsiya etiladi. 123456 yoki 000000 kabi oson PIN qabul qilinmaydi.",
    "Yangi PIN kiriting (8-12 raqam). Qancha uzun bo\\'lsa, shuncha xavfsiz. 12345678 yoki 00000000 kabi oson PIN qabul qilinmaydi. Katta summa uchun parol yoki maxfiy so\\'zlar xavfsizroq.", 'prompt')
sub("""    if (!/^\\d{6,12}$/.test(p1)) return note('PIN 6 dan 12 gacha raqamdan iborat bo\\'lishi kerak.');
    if (pinWeak(p1)) return note('Bu PIN juda oson. Boshqasini tanlang.');""",
    """    if (/^\\d+$/.test(p1) && pinWeak(p1)) return note('Bu PIN juda oson. Boshqasini tanlang.');
    if (!/^\\d{8,12}$/.test(p1)) return note('Yangi PIN 8 dan 12 gacha raqamdan iborat bo\\'lishi kerak.');
    if (pinWeak(p1)) return note('Bu PIN juda oson. Boshqasini tanlang.');""", 'rule')
sub("Mening hamyonim · versiya 29", "Mening hamyonim · versiya 30", 'v1'); sub("Versiya 29. Ilova mustaqil", "Versiya 30. Ilova mustaqil", 'v2')
scripts = re.findall(r'<script>(.*?)</script>', html, re.S); assert len(scripts) == 2
hashes = ["'sha256-" + base64.b64encode(hashlib.sha256(x.encode('utf-8')).digest()).decode() + "'" for x in scripts]
old = re.search(r"script-src 'wasm-unsafe-eval' ((?:'sha256-[A-Za-z0-9+/=]+' ?)+);", html).group(0)
sub(old, "script-src 'wasm-unsafe-eval' " + ' '.join(hashes) + ";", 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
for f in os.listdir(SRC):
    if f != 'index.html' and not os.path.exists(os.path.join(OUT, f)):
        s = os.path.join(SRC, f); (shutil.copytree if os.path.isdir(s) else shutil.copy)(s, os.path.join(OUT, f))
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
