#!/usr/bin/env python3
"""v36 -> v37: ko'p tillilik (uz, en, ru, tr, ar, zh) + Sozlamalarda til tanlash + arab tili uchun RTL."""
import re, hashlib, base64, os, sys, json
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

# --- lug'at: versiya raqamlari 36 -> 37 ---
D = json.load(open(os.path.join(HERE, 'i18n', 'dict.json'), encoding='utf-8'))
VER = {'en': 'My wallet · version 37', 'ru': 'Мой кошелёк · версия 37', 'tr': 'Cüzdanım · sürüm 37', 'ar': 'محفظتي · الإصدار 37', 'zh': '我的钱包 · 版本 37'}
for l in D:
    nd = {}
    for k, v in D[l].items():
        if k == 'Mening hamyonim · versiya 36': nd['Mening hamyonim · versiya 37'] = VER[l]; continue
        k2 = k.replace('Versiya 36.', 'Versiya 37.')
        nd[k2] = v.replace('{N}', '37')
    D[l] = nd
DICT = json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

CSS = """/* v37: tillar va RTL */
#lang-seg{background:var(--s2);border-radius:16px;padding:4px;gap:4px;display:flex;flex-wrap:wrap}
#lang-seg button{flex:1 1 30%;min-height:44px;background:transparent;color:var(--mut);font-weight:600}
#lang-seg button[aria-pressed=true]{background:var(--card);color:var(--sky);font-weight:700;box-shadow:0 1px 3px light-dark(rgba(15,50,100,.18),rgba(0,0,0,.5))}
.langsel{display:flex;justify-content:flex-end;margin:-4px 0 8px}
.langsel select{width:auto;min-height:44px;padding:4px 10px;font-size:14px;border-radius:10px}
[dir=rtl] .langsel{justify-content:flex-start}
[dir=rtl] .ch,[dir=rtl] .bk svg{transform:scaleX(-1)}
[dir=rtl] .mono,[dir=rtl] .addr,[dir=rtl] code,[dir=rtl] input[type=number],[dir=rtl] .total,[dir=rtl] .amt{direction:ltr;unicode-bidi:isolate}
[dir=rtl] .okmark{margin-right:0;margin-left:10px}
@media (min-width:1024px){
  [dir=rtl] .nav{left:auto;right:0;border-right:0;border-left:1px solid var(--line)}
  [dir=rtl] .wrap{margin-left:max(0px,(100vw - 248px - 1160px) / 2);margin-right:calc(248px + max(0px,(100vw - 248px - 1160px) / 2))}
  [dir=rtl] .toast{left:calc(50% - 124px)}
}
@media (min-width:768px) and (max-width:1023.98px){
  [dir=rtl] .nav{left:auto;right:0;border-right:0;border-left:1px solid var(--line)}
  [dir=rtl] .wrap{margin:0 72px 0 0}
  [dir=rtl] .toast{left:calc(50% - 36px)}
}
"""
sub("/* Narxlar sahifasi */", CSS + "/* Narxlar sahifasi */", 'css')

# versiya matnlari
sub("Mening hamyonim · versiya 36", "Mening hamyonim · versiya 37", 'ver1')
sub("Versiya 36. Ilova", "Versiya 37. Ilova", 'ver2')

# Sozlamalar: til kartasi
sub("""<div class="seg" id="theme-seg" role="group" aria-labelledby="theme-h"></div></section>""",
    """<div class="seg" id="theme-seg" role="group" aria-labelledby="theme-h"></div></section>
    <section class="card"><h2 id="lang-h">Til</h2><div id="lang-seg" role="group" aria-labelledby="lang-h"></div></section>""", 'set-card')
sub("  paintTheme();\n  initMining();", "  paintTheme();\n  paintLang();\n  initMining();", 'set-init')

# Kirish ekrani: til tanlagich
sub("""  <div class="center card">
    <div class="authhero">""", """  <div class="center card">
    <div class="langsel"><select id="lang-sel" data-notr aria-label="Ilova tilini tanlang">${LANGS.map(([c, n]) => `<option value="${c}"${c === LANG ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="authhero">""", 'auth-sel')
sub("  $('#t-create').onclick = () => { cs = null; showAuth('create'); };",
    "  $('#lang-sel').onchange = e => setLang(e.target.value);\n  $('#t-create').onclick = () => { cs = null; showAuth('create'); };", 'auth-bind')

JS = r"""/* ---------- Tillar (v37) ---------- */
const LANGS = [['uz', "O'zbekcha"], ['en', 'English'], ['ru', 'Русский'], ['tr', 'Türkçe'], ['ar', 'العربية'], ['zh', '中文']];
const I18N = __DICT__;
const RTL = { ar: 1 };
let LANG = 'uz';
try { const s = store.get('cw_lang'); if (s && LANGS.some(x => x[0] === s)) LANG = s; } catch (e) {}
const TITLES = { uz: 'Mening hamyonim', en: 'My wallet', ru: 'Мой кошелёк', tr: 'Cüzdanım', ar: 'محفظتي', zh: '我的钱包' };
const trMap = new WeakMap(), atMap = new WeakMap();
const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
function trLookup(src) {
  if (LANG === 'uz') return src;
  const d = I18N[LANG]; if (!d) return src;
  const t = src.trim(); if (!t) return src;
  const i = src.indexOf(t);
  const r = trCore(d, t);
  return r === undefined ? src : src.slice(0, i) + r + src.slice(i + t.length);
}
function trCore(d, t) {
  let r = d[t];
  if (r !== undefined) return r;
  const c = t.replace(/\s+/g, ' ');
  if (c !== t && (r = d[c]) !== undefined) return r;
  // oxiridagi tinish belgisi (nuqta, ikki nuqta, undov)
  const m = /^(.*?)([.:!…]+)$/.exec(c);
  if (m && (r = trCore(d, m[1])) !== undefined) return r + m[2];
  // birinchi son -> {n}
  const nm = /\d+/.exec(c);
  if (nm) { const k = c.replace(nm[0], '{n}'); if ((r = d[k]) !== undefined) return r.replace('{n}', nm[0]); }
  // "A: B" va "A · B" bo'laklari
  for (const sep of [': ', ' · ']) {
    if (c.includes(sep)) {
      const ps = c.split(sep); let any = false;
      const out = ps.map(p => { const x = trCore(d, p); if (x !== undefined && x !== p) any = true; return x === undefined ? p : x; });
      if (any) return out.join(sep);
    }
  }
  return undefined;
}
function skipEl(el) {
  for (; el && el !== document.body; el = el.parentElement) {
    if (el.nodeType !== 1) continue;
    const n = el.tagName;
    if (n === 'SCRIPT' || n === 'STYLE' || n === 'TEXTAREA' || n === 'CODE') return true;
    if (el.hasAttribute('data-notr') || el.classList.contains('mono') || el.classList.contains('addr')) return true;
  }
  return false;
}
function trText(node) {
  const cur = node.nodeValue, rec = trMap.get(node);
  const src = rec && cur === rec.t ? rec.o : cur;
  if (!src.trim()) return;
  if (skipEl(node.parentElement)) return;
  const t = trLookup(src);
  if (t !== cur) node.nodeValue = t;
  trMap.set(node, { o: src, t });
}
function trAttrs(el) {
  if (el.nodeType !== 1 || skipEl(el)) return;
  let rec = atMap.get(el);
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const cur = el.getAttribute(a);
    if (!rec) { rec = {}; atMap.set(el, rec); }
    const r = rec[a];
    const src = r && cur === r.t ? r.o : cur;
    const t = trLookup(src);
    if (t !== cur) el.setAttribute(a, t);
    rec[a] = { o: src, t };
  }
}
function trTree(root) {
  if (!root) return;
  if (root.nodeType === 3) { trText(root); return; }
  if (root.nodeType !== 1) return;
  trAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 3) trText(n); else trAttrs(n); }
}
let trObs = null;
function trStart() {
  if (trObs) return;
  trObs = new MutationObserver(ms => {
    trObs.disconnect();
    try {
      for (const m of ms) {
        if (m.type === 'childList') m.addedNodes.forEach(trTree);
        else if (m.type === 'characterData') trText(m.target);
        else if (m.type === 'attributes') trAttrs(m.target);
      }
    } finally { trObs.observe(document.body, OBSOPT); }
  });
  trObs.observe(document.body, OBSOPT);
}
const OBSOPT = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
function applyLangDoc() {
  const h = document.documentElement;
  h.lang = LANG; h.dir = RTL[LANG] ? 'rtl' : 'ltr';
  document.title = TITLES[LANG] || TITLES.uz;
}
function setLang(l) {
  if (!LANGS.some(x => x[0] === l)) return;
  LANG = l; try { store.set('cw_lang', l); } catch (e) {}
  applyLangDoc();
  if (trObs) trObs.disconnect();
  trTree(document.body);
  if (trObs) trObs.observe(document.body, OBSOPT);
  paintLang();
  const s = document.getElementById('lang-sel'); if (s) s.value = l;
}
function paintLang() {
  const h = document.getElementById('lang-seg'); if (!h) return;
  h.innerHTML = '';
  LANGS.forEach(([c, n]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sm' + (LANG === c ? '' : ' sec');
    b.textContent = n; b.lang = c; b.setAttribute('data-notr', ''); b.setAttribute('aria-pressed', String(LANG === c));
    b.onclick = () => setLang(c); h.append(b);
  });
}
applyLangDoc(); trStart();

"""
JS = JS.replace('__DICT__', DICT)
sub("/* ---------- Boshlash ---------- */", JS + "/* ---------- Boshlash ---------- */", 'js')

# CSP xeshlari
scripts = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S)
hs = ["'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'" for s in scripts]
m = re.search(r"script-src 'wasm-unsafe-eval'((?: 'sha256-[^']+')+)", html)
assert m and len(hs) == len(m.group(1).split()), (len(hs), m and m.group(1))
html = html.replace(m.group(0), "script-src 'wasm-unsafe-eval' " + ' '.join(hs))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('OK', len(html))
