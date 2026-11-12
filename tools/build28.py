#!/usr/bin/env python3
"""v27 -> v28: kunlik yuborish limiti (USD, 24 soat). Limitdan oshsa yuborish bloklanadi; o'zgartirish maxfiy so'zlarni talab qiladi."""
import re, hashlib, base64, os, shutil, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

sub("/* Mining sahifasi */", ".warn.lim{background:#fde8e6;border:1px solid #f0b3ae;color:#7a1610;font-weight:600}\n@media(prefers-color-scheme:dark){:root:not([data-theme=light]) .warn.lim{background:#3a1512;border-color:#7a2a24;color:#ffd7d3}}\n:root[data-theme=dark] .warn.lim{background:#3a1512;border-color:#7a2a24;color:#ffd7d3}\n/* Mining sahifasi */", 'css')

# yordamchilar
sub("const usdOf = (cg, units, dec) => {", """/* Kunlik yuborish limiti: oxirgi 24 soatda yuborilgan summa (USD) + yangi yuborish limitdan oshsa, imzolash bloklanadi. 'off' = o'chiq. */
const LIM_DEFAULT = 1000;
const limitUsd = () => { const v = store.get('cw_limit'); if (v === 'off') return null; const n = Number(v); return v !== null && isFinite(n) && n > 0 ? n : LIM_DEFAULT; };
const sentList = () => { try { const a = JSON.parse(store.get('cw_sent') || '[]'), t = Date.now() - 864e5; return Array.isArray(a) ? a.filter(x => Array.isArray(x) && x[0] > t && isFinite(x[1]) && x[1] >= 0) : []; } catch (e) { return []; } };
const sent24h = () => sentList().reduce((s, x) => s + x[1], 0);
const recordSent = usd => { if (!(usd > 0)) return; const a = sentList(); a.push([Date.now(), usd]); store.set('cw_sent', JSON.stringify(a)); };
const usdOf = (cg, units, dec) => {""", 'helpers')

# tasdiq oynasi
sub("  const trustLine = known ?", """  const pq = prices[q.cg], usdVal = pq ? Number(fmtUnits(q.amount, q.dec)) * pq.usd : null, lim = limitUsd(), sentNow = sent24h();
  const money = x => '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let limBlock = null;
  if (lim !== null) {
    if (usdVal === null) limBlock = 'Bu aktivning narxi noma\\'lum, shuning uchun kunlik limitni tekshirib bo\\'lmaydi. Narx yuklanishini kuting yoki Xavfsizlik sahifasida limitni o\\'zgartiring.';
    else if (sentNow + usdVal > lim) limBlock = 'Kunlik limit ' + money(lim) + ' dan oshadi (oxirgi 24 soatda yuborilgan: ' + money(sentNow) + ', hozirgi: ' + money(usdVal) + '). Limitni Xavfsizlik sahifasida (maxfiy so\\'zlar bilan) o\\'zgartiring.';
  }
  S.limBlock = limBlock;
  const trustLine = known ?""", 'review-limit')
sub("    ${warns.map(w => '<div class=\"warn\">' + esc(w) + '</div>').join('')}",
    "    ${limBlock ? '<div class=\"warn lim\" role=\"alert\">' + esc(limBlock) + '</div>' : ''}\n    ${warns.map(w => '<div class=\"warn\">' + esc(w) + '</div>').join('')}", 'review-tpl')
sub("  $('#rv-ok').onchange = () => { $('#rv-go').disabled = S.busy || !$('#rv-ok').checked; };",
    "  $('#rv-ok').onchange = () => { $('#rv-go').disabled = S.busy || !$('#rv-ok').checked || !!S.limBlock; };\n  if (S.limBlock) { $('#rv-ok').disabled = true; $('#rv-go').disabled = true; }", 'review-disable')
sub("    if (S.signed) return doBroadcast();\n    if (!$('#rv-ok').checked)", "    if (S.signed) return doBroadcast();\n    if (S.limBlock) return rm(S.limBlock);\n    if (!$('#rv-ok').checked)", 'rvgo-guard')
sub("  const finish = id => {\n    S.signed = null; S.busy = true;", "  const finish = id => {\n    S.signed = null; S.busy = true; try { recordSent(usdVal); } catch (e) { /* hisob yozilmadi */ }", 'finish')
sub("function wipeAll() { store.del('cw_vault');", "function wipeAll() { store.del('cw_limit'); store.del('cw_sent'); store.del('cw_vault');", 'wipe')

# Xavfsizlik sahifasi
sub("""    <div class="msg" id="pin-note" role="status" aria-live="polite"></div>
    <hr class="sep">""", """    <div class="msg" id="pin-note" role="status" aria-live="polite"></div>
    <hr class="sep">
    <h3 style="margin:0 0 4px;font-size:16px" id="lim-h">Kunlik yuborish limiti</h3>
    <p class="mut" id="lim-state"></p>
    <div class="btns"><button type="button" class="sec" id="lim-set">Limitni o'zgartirish</button></div>
    <div class="msg" id="lim-note" role="status" aria-live="polite"></div>
    <hr class="sep">""", 'sec-html')
sub("  $('#pin-set').onclick = async () => {\n    const phrase = await verifyWords(note);", r"""  const paintLim = () => { const l = limitUsd(), s = sent24h(), f = x => '$' + x.toLocaleString('en-US', { maximumFractionDigits: 2 }); $('#lim-state').textContent = l === null ? 'Limit o\'chirilgan: istalgan summani yuborish mumkin. Katta summa uchun limitni yoqish tavsiya etiladi.' : 'Oxirgi 24 soatda ko\'pi bilan ' + f(l) + ' yuborish mumkin. Yuborilgan: ' + f(s) + '. Limitdan oshgan yuborish bloklanadi.'; };
  paintLim();
  $('#lim-set').onclick = async () => {
    const ln = t => { $('#lim-note').textContent = t; };
    const phrase = await verifyWords(ln); if (!phrase) return;
    const v = await ask('Kunlik limitni dollarda kiriting (masalan 500). Butunlay o\'chirish uchun "off" deb yozing.', { input: true, ok: 'Saqlash' });
    if (v === null) return;
    const t = v.trim().toLowerCase();
    if (t === 'off') { store.set('cw_limit', 'off'); paintLim(); return ln('Limit o\'chirildi.'); }
    const n = Number(t.replace(',', '.'));
    if (!isFinite(n) || n <= 0 || n > 1e9) return ln('Limit musbat son bo\'lishi kerak (masalan 500) yoki "off".');
    store.set('cw_limit', String(n)); paintLim(); ln('Limit saqlandi.');
  };
  $('#pin-set').onclick = async () => {
    const phrase = await verifyWords(note);""", 'sec-js')
sub("Mening hamyonim · versiya 27", "Mening hamyonim · versiya 28", 'v1'); sub("Versiya 27. Ilova mustaqil", "Versiya 28. Ilova mustaqil", 'v2')

scripts = re.findall(r'<script>(.*?)</script>', html, re.S); assert len(scripts) == 2
hashes = ["'sha256-" + base64.b64encode(hashlib.sha256(x.encode('utf-8')).digest()).decode() + "'" for x in scripts]
old = re.search(r"script-src 'wasm-unsafe-eval' ((?:'sha256-[A-Za-z0-9+/=]+' ?)+);", html).group(0)
sub(old, "script-src 'wasm-unsafe-eval' " + ' '.join(hashes) + ";", 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
for f in os.listdir(SRC):
    if f != 'index.html' and not os.path.exists(os.path.join(OUT, f)):
        s = os.path.join(SRC, f); (shutil.copytree if os.path.isdir(s) else shutil.copy)(s, os.path.join(OUT, f))
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
