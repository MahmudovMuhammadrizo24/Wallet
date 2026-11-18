#!/usr/bin/env python3
"""v39 -> v40: kontakt nomidan ko'rinmas bidi/boshqaruv belgilari tozalanadi (nom spuflash himoyasi)."""
import re, hashlib, base64, os, sys, json
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

sub("const looksAlike = (a, b) =>",
    "/* ko'rinmas bidi/boshqaruv belgilarini olib tashlash (kontakt nomi spuflashdan himoya) */\n"
    "const stripBidi = s => String(s).replace(/[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u2028-\\u202e\\u2060-\\u2069\\ufeff]/g, '').trim();\n"
    "const looksAlike = (a, b) =>", 'stripbidi-def')
sub("const name = $('#ct-name').value.trim(), fam = $('#ct-fam').value, addr = $('#ct-addr').value.trim(), b = bookOf();",
    "const name = stripBidi($('#ct-name').value), fam = $('#ct-fam').value, addr = $('#ct-addr').value.trim(), b = bookOf();", 'ct-add-strip')

# versiya
D = json.load(open(os.path.join(HERE, 'i18n', 'dict.json'), encoding='utf-8'))
VER = {'en': 'My wallet · version 40', 'ru': 'Мой кошелёк · версия 40', 'tr': 'Cüzdanım · sürüm 40', 'ar': 'محفظتي · الإصدار 40', 'zh': '我的钱包 · 版本 40'}
for l in D:
    nd = {}
    for k, v in D[l].items():
        if k == 'Mening hamyonim · versiya 36': nd['Mening hamyonim · versiya 40'] = VER[l]; continue
        nd[k.replace('Versiya 36.', 'Versiya 40.')] = v.replace('{N}', '40')
    D[l] = nd
I18S = '{' + ','.join(json.dumps(l) + ':' + json.dumps(json.dumps(D[l], ensure_ascii=False, separators=(',', ':')), ensure_ascii=False).replace('</', '<\\/') for l in D) + '}'
a = html.index('const I18S = '); b = html.index(';\nconst I18N = {};', a)
html = html[:a] + 'const I18S = ' + I18S + html[b:]
sub("Mening hamyonim · versiya 39", "Mening hamyonim · versiya 40", 'ver1')
sub("Versiya 39. Ilova", "Versiya 40. Ilova", 'ver2')

scripts = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S)
hs = ["'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'" for s in scripts]
mm = re.search(r"script-src 'wasm-unsafe-eval'((?: 'sha256-[^']+')+)", html)
assert mm and len(hs) == len(mm.group(1).split())
html = html.replace(mm.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(hs))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html))
