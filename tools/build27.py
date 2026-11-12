#!/usr/bin/env python3
"""v26 -> v27: PIN/parol endi Argon2id (64 MiB, t=3) bilan; eski PBKDF2 PIN avtomatik yangilanadi."""
import re, hashlib, base64, os, shutil, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
here = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

# 1) hash-wasm (MIT) Argon2 — birinchi skriptning boshiga
a2 = open(os.path.join(here, 'argon2.umd.min.js'), encoding='utf-8').read().strip()
assert '</script' not in a2
sub("<script>var WL=(()=>{", "<script>" + a2 + "\n;var WL=(()=>{", 'argon2-inject')
# 2) CSP: faqat WebAssembly ruxsati (eval emas)
sub("script-src 'sha256-", "script-src 'wasm-unsafe-eval' 'sha256-", 'csp-wasm')

# 3) PIN KDF
sub("""async function pinSeal(phrase, pin, type) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey('pin:' + pin, salt), enc.encode(phrase)));
  const out = new Uint8Array(28 + ct.length); out.set(salt); out.set(iv, 16); out.set(ct, 28);
  return store.set('cw_pin', b64(out)) && store.set('cw_pinfail', '0') && store.set('cw_pintype', type === 'pw' ? 'pw' : 'pin');
}
async function pinOpen(pin) {
  try {
    const raw = unb64(store.get('cw_pin'));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(16, 28) }, await deriveKey('pin:' + pin, raw.slice(0, 16)), raw.slice(28));
    return dec.decode(pt);
  } catch (e) { return null; }
}""", """/* v27: PIN kaliti Argon2id (64 MiB xotira, 3 o'tish) bilan olinadi. Xotira talab qilgani uchun GPU bilan oflayn topish ancha qimmat.
   Saqlash formati: "v2." + base64(tuzi 16 | iv 12 | shifr). Eski (PBKDF2) format birinchi to'g'ri kirishda avtomatik yangilanadi. */
const A2 = { m: 65536, t: 3 };
async function pinKey(pin, salt) {
  const raw = await hashwasm.argon2id({ password: 'pin:' + pin, salt, parallelism: 1, iterations: A2.t, memorySize: A2.m, hashLength: 32, outputType: 'binary' });
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function pinSeal(phrase, pin, type) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pinKey(pin, salt), enc.encode(phrase)));
  const out = new Uint8Array(28 + ct.length); out.set(salt); out.set(iv, 16); out.set(ct, 28);
  return store.set('cw_pin', 'v2.' + b64(out)) && store.set('cw_pinfail', '0') && store.set('cw_pintype', type === 'pw' ? 'pw' : 'pin');
}
async function pinOpen(pin) {
  const s = store.get('cw_pin'), v2 = typeof s === 'string' && s.startsWith('v2.');
  let key;
  try { const raw = unb64(v2 ? s.slice(3) : s); key = { raw, k: v2 ? await pinKey(pin, raw.slice(0, 16)) : await deriveKey('pin:' + pin, raw.slice(0, 16)) }; }
  catch (e) { if (v2) throw new Error('KDF'); return null; }
  try {
    const pt = dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: key.raw.slice(16, 28) }, key.k, key.raw.slice(28)));
    if (!v2) { try { const f = store.get('cw_pinfail'); await pinSeal(pt, pin, pinType()); store.set('cw_pinfail', f === null ? '0' : f); } catch (e) { /* yangilanmadi: eski format ishlayveradi */ } }
    return pt;
  } catch (e) { return null; }
}""", 'pin-kdf')
sub("    const phrase = await pinOpen(pin);\n    if (phrase) {",
    """    let phrase;
    try { phrase = await pinOpen(pin); }
    catch (e) { $('#pin-go').disabled = false; $('#pin-go').removeAttribute('aria-busy'); return say('Qurilma xotirasi yetmadi. Maxfiy so\\'zlar bilan kiring.'); }
    if (phrase) {""", 'go-catch')
sub("PIN maxfiy so'zlarni PBKDF2 (600 000 aylanish) + AES-GCM bilan shifrlab saqlaydi.", "PIN maxfiy so'zlarni Argon2id (64 MiB) + AES-GCM bilan shifrlab saqlaydi.", 'doc')
sub("Mening hamyonim · versiya 26", "Mening hamyonim · versiya 27", 'ver1')
sub("Versiya 26. Ilova mustaqil", "Versiya 27. Ilova mustaqil", 'ver2')

scripts = re.findall(r'<script>(.*?)</script>', html, re.S); assert len(scripts) == 2
hashes = ["'sha256-" + base64.b64encode(hashlib.sha256(x.encode('utf-8')).digest()).decode() + "'" for x in scripts]
old = re.search(r"script-src 'wasm-unsafe-eval' ((?:'sha256-[A-Za-z0-9+/=]+' ?)+);", html).group(0)
sub(old, "script-src 'wasm-unsafe-eval' " + ' '.join(hashes) + ";", 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
for f in os.listdir(SRC):
    if f != 'index.html' and not os.path.exists(os.path.join(OUT, f)):
        s = os.path.join(SRC, f); (shutil.copytree if os.path.isdir(s) else shutil.copy)(s, os.path.join(OUT, f))
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
