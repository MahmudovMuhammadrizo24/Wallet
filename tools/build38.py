#!/usr/bin/env python3
"""v37 -> v38: Aktivlar qayta qurildi: kripto (tarmoq) ro'yxati -> har biri alohida sahifa (#/net/ID) va unda shu tarmoq tokenlari.
Eski jadval/filtr/yig'ish/chips va ortiqcha havolalar olib tashlandi."""
import re, hashlib, base64, os, sys, json
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

# ---- 1) eski CSS qoidalarini olib tashlash ----
DROP = ['.ng{', 'tr:has(+ .ng)', '.ng:first-child', '.ng th', '.ng td', '.ngp-row', 'tr:has(+ .ngp-row)', '.ngp{', '.ngb{', '.ngb svg',
        '.ngh', '.ng-hide', '.ng:has', '@media (prefers-reduced-motion:reduce){.ngh', '@media(min-width:480px){#list tr.ng',
        '#list tr.ng', '.chips', '.chip{', '.chip[', '#pg-assets .assets', '#pg-assets table', '#list{display:block}', '#list tr{', '#list tr.ar',
        '#list tr.ngp', '#as-px']
lines = html.split('\n'); keep = []; dropped = 0
for ln in lines:
    if any(ln.startswith(p) for p in DROP): dropped += 1; continue
    keep.append(ln)
html = '\n'.join(keep)
if dropped < 40: sys.exit(f'CSS drop too small: {dropped}')

CSS = """/* v38: Aktivlar -> tarmoq sahifalari */
.netsum{display:flex;align-items:center;gap:12px;margin:0 2px 14px}
.netsum .ci{width:52px;height:52px;border-radius:50%;font-size:24px}
.netsum .a-t{flex:1;min-width:0}
.netsum .a-q{font-weight:700;font-size:20px;text-align:right;overflow-wrap:anywhere}
#net-list,#list{list-style:none;margin:0;padding:0}
#net-list li+li,#list li+li{border-top:1px solid var(--line)}
#net-list .mrow{grid-template-columns:auto 1fr auto 18px;padding:14px 2px;min-height:68px}
#net-list .ci{width:42px;height:42px;border-radius:50%}
.nr .ch{color:var(--mut);width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.nr .a-q{grid-column:3}
#list li.ar{display:grid;grid-template-columns:minmax(0,1fr) 44px;align-items:center}
#list .rowbtn{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:0 4px 0 0;background:transparent;color:var(--txt);text-align:left;border-radius:0;font:inherit;font-weight:400}
#list .rowbtn .a-t{flex:1;min-width:0}
#list .rowbtn .a-n{font-weight:600;font-size:15px;overflow-wrap:anywhere}
#list .rowbtn .a-m{font-size:13px;color:var(--mut);display:block;text-align:left;margin:0;overflow-wrap:anywhere}
#list .rowbtn .a-r{display:flex;flex-direction:column;align-items:flex-end;flex:none;max-width:48%;text-align:right}
#list .rowbtn .a-q{font-weight:700;font-size:15px;overflow-wrap:anywhere;margin:0}
#list .rowbtn .a-s{font-size:12px}
#list .ib.rm{background:transparent;border:0;color:var(--mut)}
#net-add{margin-top:12px}
[dir=rtl] .netsum .a-q,[dir=rtl] #list .rowbtn,[dir=rtl] #list .rowbtn .a-m,[dir=rtl] #list .rowbtn .a-r{text-align:right}
"""
# eski #list .rowbtn qoidalari (v26) olib tashlansin: ularning yangilari yuqorida
lines = html.split('\n'); keep = []
for ln in lines:
    if ln.startswith('#list .rowbtn') or ln.startswith('#list .ib.rm'): continue
    keep.append(ln)
html = '\n'.join(keep)
sub("/* Narxlar sahifasi */", CSS + "/* Narxlar sahifasi */", 'css')

# ---- 2) HTML: Aktivlar + tarmoq sahifasi ----
m = re.search(r'  <section class="page" id="pg-assets" hidden>.*?(?=\n  <section class="page" id="pick")', html, re.S)
assert m, 'pg-assets'
NEW = """  <section class="page" id="pg-assets" hidden>
    <div class="ph-row"><h1 class="ph" tabindex="-1">Aktivlar</h1><a class="pill" href="#/add" id="as-add">Aktiv qo'shish</a></div>
    <section class="card assets"><ul id="net-list"></ul></section>
    <div class="empty" id="empty" hidden><strong>Hozircha aktiv yo'q</strong><p>Birinchi manzilingizni qo'shing yoki "Qabul qilish" orqali pul qabul qiling.</p><button type="button" id="empty-add">Aktiv qo'shish</button></div>
  </section>
  <section class="page" id="pg-net" hidden>
    <div class="netsum" id="net-sum"></div>
    <p class="msg" id="ng-msg" role="status" aria-live="polite"></p>
    <section class="card assets"><ul id="list"></ul></section>
    <button type="button" id="net-add" class="sec w100" hidden>Token qo'shish</button>
  </section>"""
html = html[:m.start()] + NEW + html[m.end():]

# ---- 3) updateView ----
a = html.index('function updateView() {'); b = html.index('  if (PAINTADD) PAINTADD();', a)
UV = r"""function updateView() {
  if (!data) return;
  let total = 0, failed = 0, prevT = 0; const groups = {}, nv = {}, nrows = [];
  for (const it of data.items) {
    const amt = amountOf(it), p = prices[cgOf(it)], gid = netOf(it);
    const val = (typeof amt === 'number' && p) ? amt * p.usd : null;
    const s = nv[gid] || (nv[gid] = { n: 0, val: 0, any: false });
    s.n++;
    if (val !== null) { total += val; s.val += val; s.any = true; prevT += (p && typeof p.ch === 'number' && p.ch > -99) ? val / (1 + p.ch / 100) : val; groups[symOf(it)] = (groups[symOf(it)] || 0) + val; }
    if (amt === null) failed++;
    if (gid === NETV) nrows.push({ it, amt, p, val });
  }
  const icon = (sym, c) => '<span class="ci" aria-hidden="true" style="--c:' + (CCOL[c || sym] || 'var(--coin-other)') + '">' + (GLYPH[c || sym] || esc(String(sym).slice(0, 1))) + '</span>';
  const NCOL = { BTC: 'BTC', ETH: 'ETH', TRX: 'TRX', SOL: 'SOL', TON: 'TON', POLY: 'ETH', ARB: 'ETH', OP: 'ETH', AVAX: 'ETH', BSC: 'ETH' };
  /* Aktivlar: kripto (tarmoq) ro'yxati */
  const elig = id => nv[id] || (id !== 'OTH' && hasBase(id) && offerFor(id).length ? { n: 0, val: 0, any: false } : null);
  { const nets = NETG.filter(n => elig(n[0])).map(n => Object.assign({ id: n[0], name: n[1] }, elig(n[0]))).sort((x, y) => y.val - x.val);
    $('#net-list').innerHTML = nets.map(n => '<li class="nr"><a class="mrow" href="#/net/' + n.id + '">' + (n.id === 'OTH' ? '<span class="ci" aria-hidden="true" style="--c:var(--coin-other)">+</span>' : '<span class="ci" aria-hidden="true" style="--c:' + (CCOL[NCOL[n.id]] || 'var(--coin-other)') + '">' + (n.id === 'BTC' || n.id === 'ETH' || n.id === 'TRX' || n.id === 'SOL' || n.id === 'TON' ? GLYPH[n.id] : esc(n.name.slice(0, 1))) + '</span>')
      + '<span class="a-t"><span class="a-n">' + esc(n.name) + '</span><span class="a-s">' + (n.n ? n.n + ' ta aktiv' : "Token qo'shish") + '</span></span><span class="a-q">' + (n.any ? mask(fmtUsd(n.val)) : '-') + '</span><svg viewBox="0 0 24 24" class="ch" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg></a></li>').join(''); }
  /* Tarmoq sahifasi: shu tarmoq aktivlari */
  if (NETV) {
    const s = elig(NETV);
    if (!s) { if (typeof routeGo === 'function') routeGo('assets', true); }
    else {
      const nm = (NETG.find(n => n[0] === NETV) || [NETV, NETV])[1];
      $('#net-sum').innerHTML = (NETV === 'OTH' ? '<span class="ci" aria-hidden="true" style="--c:var(--coin-other)">+</span>' : '<span class="ci" aria-hidden="true" style="--c:' + (CCOL[NCOL[NETV]] || 'var(--coin-other)') + '">' + (GLYPH[NETV] || esc(nm.slice(0, 1))) + '</span>')
        + '<div class="a-t"><div class="a-n">' + esc(nm) + '</div><div class="a-s">' + s.n + ' ta aktiv</div></div><div class="a-q">' + (s.any ? mask(fmtUsd(s.val)) : '-') + '</div>';
      nrows.sort((x, y) => (NATK.has(y.it.coin) ? 1 : 0) - (NATK.has(x.it.coin) ? 1 : 0));
      $('#list').innerHTML = nrows.map(({ it, amt, p, val }) => {
        let amtTxt;
        if (amt === undefined) amtTxt = '...';
        else if (amt === null) amtTxt = '<span class="mut">—</span>';
        else amtTxt = mask(fmtAmt(amt));
        const ch = p && typeof p.ch === 'number' ? `<span class="${p.ch >= 0 ? 'up' : 'down'}">${p.ch >= 0 ? '+' : ''}${p.ch.toFixed(2)}%</span>` : '';
        const sym = symOf(it), unit = typeof amt === 'number' ? ' ' + esc(sym) : '';
        const nm2 = esc(nameOf(it)), act = it.kind === 'addr' ? 'addr' : 'edit';
        return `<li class="ar"><button type="button" class="rowbtn" data-act="${act}" data-id="${it.id}" aria-label="${nm2} ${esc(sym)}: ${it.kind === 'addr' ? 'manzil, tarix, yuborish' : 'miqdorni tahrirlash'}">${icon(sym)}<span class="a-t"><span class="a-n">${nm2}</span><span class="a-m"><span class="sr">Miqdor: </span>${amtTxt}${unit}</span></span><span class="a-r"><span class="a-q"><span class="sr">Qiymat: </span>${val !== null ? mask(fmtUsd(val)) : '-'}</span><span class="a-s"><span class="sr">Narx: </span>${ch}</span></span></button><button type="button" class="ib rm" data-act="menu" data-id="${it.id}" aria-haspopup="dialog" aria-label="${nm2} ${esc(sym)}: amallar" title="Amallar"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button></li>`;
      }).join('');
      $('#net-add').hidden = !offerFor(NETV).length;
    }
  }
"""
html = html[:a] + UV + html[b:]

sub("let NETF = 'ALL', ROWACT = null,", "let NETV = '', ROWACT = null,", 'netv')
html = re.sub(r"const COLL = \(\(\) => .*?\n", "", html, count=1)
html = re.sub(r"const saveColl = .*?\n", "", html, count=1)
sub("""  $('#empty').hidden = data.items.length > 0;""", """  $('#empty').hidden = data.items.length > 0;""", 'empty-keep') if False else None

# ---- 4) hodisalar ----
sub("""document.querySelector('#list .ngb[data-net="' + net + '"]') || $('#nav-assets')""", """$('#net-add') || $('#nav-assets')""", 'closeSheet')
a = html.index("  $('#net-chips').addEventListener"); b = html.index("\n}\n", a)
html = html[:a] + """  $('#list').addEventListener('click', e => { const mb = e.target.closest('button[data-act=menu]'); if (mb) openRowMenu(mb.dataset.id); });
  $('#net-add').onclick = () => openSheet(NETV);""" + html[b:]

# ---- 5) router ----
sub("assets: 'pg-assets', receive", "assets: 'pg-assets', net: 'pg-net', receive", 'pages')
sub("assets: 'nav-assets', asset: 'nav-assets'", "assets: 'nav-assets', net: 'nav-assets', asset: 'nav-assets'", 'navof')
sub("asset: 'assets', wallets: 'add'", "asset: 'assets', net: 'assets', wallets: 'add'", 'parent')
sub("    if (r.name === 'send' || r.name === 'receive') { /* tanlov sahifasi */ }", "    if (r.name === 'net' && !NETG.some(n => n[0] === r.id)) r = { name: 'assets', id: '', tab: '' };", 'netchk')
sub("""(r.name === 'asset' ? '/' + r.id + '/' + (['recv', 'hist', 'send'].includes(r.tab) ? r.tab : 'recv') : '')""",
    """(r.name === 'asset' ? '/' + r.id + '/' + (['recv', 'hist', 'send'].includes(r.tab) ? r.tab : 'recv') : r.name === 'net' ? '/' + r.id : '')""", 'canon')
sub("""const ttl = r.name === 'asset' ? (nameOf(it) + ' · ' + symOf(it)) : (TITLES[r.name] || 'Hamyon');""",
    """const ttl = r.name === 'asset' ? (nameOf(it) + ' · ' + symOf(it)) : r.name === 'net' ? (NETG.find(n => n[0] === r.id) || [0, 'Hamyon'])[1] : (TITLES[r.name] || 'Hamyon');
    NETV = r.name === 'net' ? r.id : '';""", 'ttl')
sub("    if (r.name === 'mining') loadMining();", "    if (r.name === 'net') updateView();\n    if (r.name === 'mining') loadMining();", 'netpaint')


# lug'at: yangi matnlar + versiya
D = json.load(open(os.path.join(HERE, 'i18n', 'dict.json'), encoding='utf-8'))
sub('const I18N = ', 'const I18N = ', 'i18n-present')
# I18N allaqachon joylangan (v37). Uni yangilash: yangi dict.json dan qayta yaratamiz
VER = {'en': 'My wallet · version 38', 'ru': 'Мой кошелёк · версия 38', 'tr': 'Cüzdanım · sürüm 38', 'ar': 'محفظتي · الإصدار 38', 'zh': '我的钱包 · 版本 38'}
for l in D:
    nd = {}
    for k, v in D[l].items():
        if k == 'Mening hamyonim · versiya 36': nd['Mening hamyonim · versiya 38'] = VER[l]; continue
        nd[k.replace('Versiya 36.', 'Versiya 38.')] = v.replace('{N}', '38')
    D[l] = nd
# har bir til alohida JSON qatori; faqat tanlangan til parse qilinadi (o'zbekchada hech biri)
I18S = '{' + ','.join(json.dumps(l) + ':' + json.dumps(json.dumps(D[l], ensure_ascii=False, separators=(',', ':')), ensure_ascii=False).replace('</', '<\\/') for l in D) + '}'
a = html.index('const I18N = '); b = html.index(';\nconst RTL', a)
html = html[:a] + 'const I18S = ' + I18S + ';\nconst I18N = {};\nconst i18d = l => I18N[l] || (I18N[l] = JSON.parse(I18S[l]))' + html[b:]
sub("const d = I18N[LANG]; if (!d) return src;", "const d = I18S[LANG] ? i18d(LANG) : null; if (!d) return src;", 'lazy-d')
# sahifa almashganda majburiy reflow keraksiz: display:none -> block animatsiyani o'zi qayta boshlaydi
sub("    if (changed && el) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }\n", "", 'noreflow')


# ---- 6) ortiqcha detallar ----
n0 = len(html)
html, k = re.subn(r'    <div class="tipcard"><a class="rowlink" href="#/mining">.*?</a></div>\n', '', html, count=1, flags=re.S)
assert k == 1, 'home mining tip'
sub("$('#bio-set').disabled = !sup && !bo;", "$('#bio-set').disabled = !sup && !bo; $('#bio-set').hidden = !sup && !bo;", 'bio-hide')

# versiya
sub("Mening hamyonim · versiya 37", "Mening hamyonim · versiya 38", 'ver1')
sub("Versiya 37. Ilova", "Versiya 38. Ilova", 'ver2')

# CSP
scripts = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S)
hs = ["'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'" for s in scripts]
mm = re.search(r"script-src 'wasm-unsafe-eval'((?: 'sha256-[^']+')+)", html)
assert mm and len(hs) == len(mm.group(1).split())
html = html.replace(mm.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(hs))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html), 'css dropped', dropped)
