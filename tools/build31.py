#!/usr/bin/env python3
"""v30 -> v31: "Aktiv qo'shish" sahifasi dizayn bo'yicha: tarmoq plitkalari, aktivlar ro'yxati, sariq tugma."""
import re, hashlib, base64, os, shutil, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

sub("/* Mining sahifasi */", r"""#pg-add .addtk{background:transparent;border:0;padding:0;box-shadow:none}
.addtk .step{display:flex;flex-direction:column;gap:8px;margin:0 0 16px}
.addtk .stl{font-size:14px;font-weight:600}
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.tile{min-height:64px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--txt);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:13px;font-weight:600;padding:6px 4px;text-align:center}
.tile .ti{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;background:color-mix(in srgb,var(--c) 30%,transparent);color:light-dark(color-mix(in srgb,var(--c) 55%,#000),var(--c))}
.tile[aria-checked=true]{border:2px solid var(--sky);background:var(--s2);color:var(--sky);font-weight:700;padding:5px 3px}
.addlist{background:var(--card);border:1px solid var(--line);border-radius:20px;display:flex;flex-direction:column;overflow:hidden}
.addrow{display:flex;align-items:center;gap:12px;min-height:64px;padding:0 16px;border:0;border-bottom:1px solid var(--s2);background:transparent;color:var(--txt);text-align:left;width:100%;font:inherit;border-radius:0}
.addrow:last-child{border-bottom:0}
.addrow .a-t{flex:1;min-width:0}
.addrow .a-n{font-weight:600;font-size:15px;display:block}
.sr select{min-width:44px;min-height:44px}
.addrow .a-s{font-size:13px;color:var(--mut);display:block}
.addrow .st{font-size:13px;font-weight:600;color:var(--sky);white-space:nowrap}
.addrow[aria-pressed=true]{background:var(--s2)}
.addrow[aria-pressed=true] .st{font-weight:700}
.addrow.done{cursor:default}
.addrow.done .st{color:var(--ok-tx,#0f6b46)}
.addrow.nob .st{color:var(--mut)}
#tk-add{width:100%;min-height:54px;border-radius:27px;font-size:16px;font-weight:700;margin-top:12px}
.addtk .lnk{background:transparent;color:var(--sky);min-height:44px;font-weight:700;width:100%;margin-top:4px}
/* Mining sahifasi */""", 'css')

# --- bo'limlarni almashtirish: avval aktiv (token) kartasi, keyin boshqa manzil formasi
a = html.index('<section class="card">\n    <p class="mut" style="margin-top:-6px">Boshqa hamyon yoki birjadagi')
a_end = html.index('</section>\n', a) + len('</section>\n')
b = html.index('<section class="card" aria-labelledby="tk-h">'); b_end = html.index('</section>\n', b) + len('</section>\n')
assert html[a_end:b].strip() == '', repr(html[a_end:b])
mid = html[a_end:b]
form_card, tok_card = html[a:a_end], html[b:b_end]
sel = re.search(r'<select id="tk-sel".*?</select>', tok_card, re.S).group(0)
form_card = form_card.replace('<p class="mut" style="margin-top:-6px">', '<h2 id="fm-h">Boshqa manzil qo\'shish</h2>\n    <p class="mut" style="margin-top:-6px">', 1).replace('<section class="card">', '<section class="card addform" aria-labelledby="fm-h">', 1)
new_tok = """<section class="card addtk" aria-labelledby="tk-h">
    <h2 class="sr" id="tk-h">Tarmoq tangalari va tokenlar</h2>
    <div class="step"><span class="stl" id="ad-s1">1. Tarmoqni tanlang</span><div class="tiles" id="ad-nets" role="radiogroup" aria-labelledby="ad-s1"></div></div>
    <div class="step"><span class="stl" id="ad-s2">2. Aktivni tanlang</span><div class="addlist" id="ad-list" role="group" aria-labelledby="ad-s2"></div>
      <button type="button" class="lnk" id="ad-all" hidden>Tarmoqdagi hammasini qo'shish</button></div>
    <div class="sr">""" + sel + """</div>
    <button type="button" id="tk-add">Qo'shish</button>
    <div class="msg" id="tk-msg" role="status" aria-live="polite"></div>
    <div class="warn">Yangi manzil kerak emas: Ethereum manzilingiz Polygon, Arbitrum, Optimism, Avalanche va BNB Chain'da ham ishlaydi. Har bir tarmoqda komissiya shu tarmoqning o'z tangasida to'lanadi (POL, AVAX, BNB yoki ETH), shuning uchun u ham kerak bo'ladi. Tarmoqni adashtirmang: boshqa tarmoqqa yuborilgan pul qaytmasligi mumkin. Bu tarmoqlar yangi qo'shilgan, avval kichik summa bilan sinab ko'ring.</div>
  </section>
"""
html = html[:a] + new_tok + mid + form_card + html[b_end:]

# --- JS
sub("let NETF = 'ALL', ROWACT = null, ROWMENU = null;", "let NETF = 'ALL', ROWACT = null, ROWMENU = null, PAINTADD = null;", 'state')
sub("  $('#empty').hidden", "  if (PAINTADD) PAINTADD();\n  $('#empty').hidden", 'hook')
sub("""  $('#tk-add').onclick = () => {
    const sel = $('#tk-sel').value, keys = sel === 'ALL' ? TOK_ALL : [sel];""", r"""  let adNet = 'ETH', adSel = null, selTouched = false;
  const GC = { ETH: 'ETH', TRX: 'TRX', SOL: 'SOL', TON: 'TON', POLY: 'ETH', ARB: 'ETH', OP: 'ETH', AVAX: 'ETH', BSC: 'ETH' };
  const shortNet = n => n.replace(' One', '').replace(' C-Chain', '');
  const isDone = k => baseItems(k).length > 0 && !offerFor(NETOF[k]).includes(k);
  const paintAdd = () => {
    if (!data || !$('#ad-nets')) return;
    const nets = NETG.filter(([id]) => id !== 'BTC' && id !== 'OTH' && POPULAR.some(k => NETOF[k] === id && ADDBASE(k)));
    if (!nets.some(n => n[0] === adNet)) adNet = nets.length ? nets[0][0] : 'ETH';
    $('#ad-nets').innerHTML = nets.map(([id, name]) => { const sy = GC[id] || 'ETH';
      return '<button type="button" class="tile" role="radio" aria-checked="' + (id === adNet) + '" data-n="' + id + '"><span class="ti" aria-hidden="true" style="--c:' + (CCOL[sy] || 'var(--coin-other)') + '">' + (GLYPH[sy] || esc(name.slice(0, 1))) + '</span>' + esc(shortNet(name)) + '</button>'; }).join('');
    const keys = POPULAR.filter(k => NETOF[k] === adNet && ADDBASE(k));
    if (adSel && !keys.includes(adSel)) adSel = null;
    if (adSel && isDone(adSel)) adSel = null;
    $('#ad-list').innerHTML = keys.map(k => { const sym = COINS[k].sym, done = isDone(k), nob = baseItems(k).length === 0;
      const st = done ? '<span class="st">✓ Qo\'shilgan</span>' : nob ? '<span class="st">Manzil yo\'q</span>' : '<span class="st">' + (adSel === k ? '✓ Tanlangan' : 'Tanlash') + '</span>';
      return '<button type="button" class="addrow' + (done ? ' done' : '') + (nob ? ' nob' : '') + '" data-k="' + k + '" aria-pressed="' + (adSel === k) + '"' + (done || nob ? ' aria-disabled="true"' : '') + ' aria-label="' + esc(sym + ' ' + optLabel(k) + (done ? ', qo\'shilgan' : nob ? ', manzil yo\'q' : '')) + '"><span class="ci" aria-hidden="true" style="--c:' + (CCOL[sym] || 'var(--coin-other)') + '">' + (GLYPH[sym] || esc(String(sym).slice(0, 1))) + '</span><span class="a-t"><span class="a-n">' + esc(String(COINS[k].name || sym).split(' (')[0]) + '</span><span class="a-s">' + esc(sym + ' · ' + shortNet(((NETG.find(n => n[0] === adNet)) || ['', ''])[1])) + '</span></span>' + st + '</button>'; }).join('');
    const rest = keys.filter(k => !isDone(k) && baseItems(k).length > 0);
    $('#ad-all').hidden = rest.length < 2;
    $('#tk-add').textContent = adSel ? COINS[adSel].sym + ' ni qo\'shish' : 'Qo\'shish';
  };
  PAINTADD = paintAdd; paintAdd();
  $('#tk-sel').addEventListener('change', () => { selTouched = true; });
  $('#ad-nets').addEventListener('click', e => { const t = e.target.closest('button.tile'); if (!t) return; adNet = t.dataset.n; adSel = null; paintAdd(); const nb = document.querySelector('#ad-nets .tile[data-n="' + adNet + '"]'); if (nb) nb.focus(); });
  $('#ad-list').addEventListener('click', e => { const r = e.target.closest('button.addrow'); if (!r || r.getAttribute('aria-disabled') === 'true') return; adSel = adSel === r.dataset.k ? null : r.dataset.k; paintAdd(); const nb = document.querySelector('#ad-list .addrow[data-k="' + r.dataset.k + '"]'); if (nb) nb.focus(); });
  $('#ad-all').onclick = () => { const keys = POPULAR.filter(k => NETOF[k] === adNet && ADDBASE(k) && baseItems(k).length && !isDone(k)); if (keys.length) { adSel = null; addTokens(keys, t => { $('#tk-msg').textContent = t; }); } };
  $('#tk-add').onclick = () => {
    if (adSel) { const k = adSel; adSel = null; return addTokens([k], t => { $('#tk-msg').textContent = t; }); }
    if (!selTouched) { $('#tk-msg').textContent = 'Avval ro\'yxatdan aktivni tanlang.'; return; }
    const sel = $('#tk-sel').value, keys = sel === 'ALL' ? TOK_ALL : [sel];""", 'js')
sub("Mening hamyonim · versiya 30", "Mening hamyonim · versiya 31", 'v1'); sub("Versiya 30. Ilova mustaqil", "Versiya 31. Ilova mustaqil", 'v2')
scripts = re.findall(r'<script>(.*?)</script>', html, re.S); assert len(scripts) == 2
hashes = ["'sha256-" + base64.b64encode(hashlib.sha256(x.encode('utf-8')).digest()).decode() + "'" for x in scripts]
old = re.search(r"script-src 'wasm-unsafe-eval' ((?:'sha256-[A-Za-z0-9+/=]+' ?)+);", html).group(0)
sub(old, "script-src 'wasm-unsafe-eval' " + ' '.join(hashes) + ";", 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
for f in os.listdir(SRC):
    if f != 'index.html' and not os.path.exists(os.path.join(OUT, f)):
        s = os.path.join(SRC, f); (shutil.copytree if os.path.isdir(s) else shutil.copy)(s, os.path.join(OUT, f))
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
