#!/usr/bin/env python3
"""v33 -> v34: veb (desktop) maketi: >=1024px da yon menyu, keng kontent, ikki ustunli sahifalar."""
import re, hashlib, base64, os, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

# 1) CSS
CSS = """/* Veb (desktop) maketi: faqat keng ekranda */
.nav .dk{display:none}
.hm-l,.hm-r,.hm-t{display:contents}
@media (min-width:1024px){
  .wrap{max-width:none;margin:0;padding:20px 40px 48px;margin-left:calc(248px + max(0px,(100vw - 248px - 1160px) / 2));margin-right:max(0px,(100vw - 248px - 1160px) / 2);max-width:1160px}
  .nav{top:0;right:auto;bottom:0;width:248px;border-top:0;border-right:1px solid var(--line);padding:20px 12px;background:var(--card);-webkit-backdrop-filter:none;backdrop-filter:none}
  .nav-in{max-width:none;height:100%;display:flex;flex-direction:column;gap:4px;align-content:start}
  .nav .dk{display:flex}
  .nav-brand{align-items:center;gap:10px;padding:4px 6px 18px;font-weight:800;font-size:16px;white-space:nowrap;color:var(--txt)}
  .nav-brand .logo{width:36px;height:36px;flex:none}
  .nav button{flex-direction:row;justify-content:flex-start;gap:12px;min-height:48px;padding:0 14px;font-size:15px;font-weight:600;border-radius:14px;width:100%}
  .nav button svg{box-sizing:content-box;width:22px;height:22px;padding:0;border-radius:0}
  .nav button:hover{background:var(--s2)}
  .nav button[aria-current=page]{background:var(--s2);color:var(--sky);font-weight:700}
  .nav-sp{flex:1;min-height:8px}
  #brand{display:none}
  .appbar{margin:0 -40px 12px;padding:10px 40px}
  .toast{left:calc(50% + 124px);bottom:24px}
  #pg-home:not([hidden]){display:grid;grid-template-columns:minmax(360px,5fr) minmax(0,7fr);gap:0 24px;align-items:start}
  .hm-l{display:block;grid-column:1;grid-row:1}
  .hm-t{display:block;grid-column:1;grid-row:2}
  .hm-r{display:block;grid-column:2;grid-row:1 / span 2}
  #pg-home .total{font-size:44px}
  #pg-settings,#pg-backup,#pg-wallets,#pg-add,#pg-contacts,#pg-mining,#recv,#pick{max-width:760px}
  #pg-security:not([hidden]){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 20px;align-items:start}
  #pg-security>:not(.card){grid-column:1 / -1}
  #px-list{display:grid;grid-template-columns:1fr 1fr}
  #px-list li:nth-last-child(2):nth-child(odd){border-bottom:0}
  .center{max-width:480px;margin-top:8vh}
}
"""
sub("/* Narxlar sahifasi */", CSS + "/* Narxlar sahifasi */", 'css')

# 2) Yon menyu: logotip, qo'shimcha bo'limlar (faqat desktopda ko'rinadi)
def icon(p): return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + '</svg>'
PX = icon('<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>')
MN = icon('<path d="M16.1 7.4L5 18.5"/><path d="M8.2 3.8Q18.6 5 19.8 15.2"/>')
CT = icon('<path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 6 17.5V19"/><circle cx="11" cy="8" r="3"/><path d="M18 8v4M16 10h4"/>')
sub('<nav class="nav" aria-label="Bo\'limlar"><div class="nav-in">\n',
    '<nav class="nav" aria-label="Bo\'limlar"><div class="nav-in">\n    <div class="nav-brand dk" aria-hidden="true">${LOGO}<span>Mening hamyonim</span></div>\n', 'nav-brand')
sub('    <button type="button" id="nav-set">',
    '    <button type="button" id="nav-px" class="dk">' + PX + '<span>Narxlar</span></button>\n'
    '    <button type="button" id="nav-mine" class="dk">' + MN + '<span>Mining</span></button>\n'
    '    <button type="button" id="nav-ct" class="dk">' + CT + '<span>Kontaktlar</span></button>\n'
    '    <div class="nav-sp dk" aria-hidden="true"></div>\n'
    '    <button type="button" id="nav-set">', 'nav-extra')
sub("const NAVIDS = ['nav-wallet', 'nav-assets', 'nav-add', 'nav-set'];",
    "const NAVIDS = ['nav-wallet', 'nav-assets', 'nav-add', 'nav-set', 'nav-px', 'nav-mine', 'nav-ct'];\n"
    "  const NAVDK = { mining: 'nav-mine', prices: 'nav-px', contacts: 'nav-ct' };\n"
    "  const isDesk = () => { try { return window.matchMedia('(min-width:1024px)').matches; } catch (e) { return false; } };", 'navids')
sub("if (n === NAVOF[r.name]) nb.setAttribute", "if (n === (isDesk() && NAVDK[r.name] ? NAVDK[r.name] : NAVOF[r.name])) nb.setAttribute", 'navcur')
sub("  $('#nav-set').onclick = () => go('settings');",
    "  $('#nav-set').onclick = () => go('settings');\n  $('#nav-px').onclick = () => go('prices');\n  $('#nav-mine').onclick = () => go('mining');\n  $('#nav-ct').onclick = () => go('contacts');", 'navclick')

# 3) Bosh sahifa: ikki ustun uchun o'rovchilar (mobilda display:contents, ko'rinish o'zgarmaydi)
sub('  <section class="card hero">\n', '  <div class="hm-l">\n  <section class="card hero">\n', 'hm-l')
sub('    <div class="sect"><h2>Aktivlar</h2>', '  </div>\n  <div class="hm-r">\n    <div class="sect"><h2>Aktivlar</h2>', 'hm-r')
sub('    </section>\n    <div class="tipcard"><a class="rowlink" href="#/security">', '    </section>\n  </div>\n  <div class="hm-t">\n    <div class="tipcard"><a class="rowlink" href="#/security">', 'hm-t')
sub('\n  </section>\n  <section class="page" id="pg-assets" hidden>', '\n  </div>\n  </section>\n  <section class="page" id="pg-assets" hidden>', 'hm-end')

# 4) Versiya
sub("Mening hamyonim · versiya 33", "Mening hamyonim · versiya 34", 'v1')
sub("Versiya 33. Ilova mustaqil", "Versiya 34. Ilova mustaqil", 'v2')

scripts = list(re.finditer(r'<script>([\s\S]*?)</script>', html))
def h(s): return "'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'"
mm = re.search(r"script-src[^;\"]*", html)
sub(mm.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(h(s.group(1)) for s in scripts), 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
