#!/usr/bin/env python3
"""v28 -> v29: Android Keystore bilan bog'langan PIN ("pepper"). PIN blobi endi qurilmadan tashqarida oflayn topilmaydi (Android ilovada)."""
import re, hashlib, base64, os, shutil, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def sub(old, new, label, count=1):
    global html
    n = html.count(old)
    if n != count: sys.exit(f'EDIT FAILED [{label}]: expected {count}, found {n}')
    html = html.replace(old, new)

i = html.index("const A2 = { m: 65536, t: 3 };"); j = html.index("\n}\n", html.index("async function pinOpen(pin) {")) + 3
html = html[:i] + r"""const A2 = { m: 65536, t: 3 };
/* v29: Android ilovada PIN kaliti Keystore (qurilma chipi) ichidagi eksport qilib bo'lmaydigan HMAC kaliti bilan aralashtiriladi ("v3.").
   Shunda shifrlangan fayl nusxa olinsa ham, PINni boshqa kompyuterda oflayn topib bo'lmaydi. Brauzerda "v2." (faqat Argon2id) ishlatiladi. */
const hasPepper = () => { try { return !!(window.HamyonNative && typeof window.HamyonNative.pepper === 'function'); } catch (e) { return false; } };
async function pinKey(pin, salt, v3) {
  const raw = await hashwasm.argon2id({ password: 'pin:' + pin, salt, parallelism: 1, iterations: A2.t, memorySize: A2.m, hashLength: 32, outputType: 'binary' });
  let mat = raw;
  if (v3) {
    const p = hasPepper() ? String(window.HamyonNative.pepper(b64(salt)) || '') : '';
    if (!p) throw new Error('PEPPER');
    const pb = unb64(p), cat = new Uint8Array(raw.length + pb.length); cat.set(raw); cat.set(pb, raw.length);
    mat = new Uint8Array(await crypto.subtle.digest('SHA-256', cat));
  }
  return crypto.subtle.importKey('raw', mat, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function pinSeal(phrase, pin, type) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  let v3 = hasPepper(), k;
  if (v3) { try { k = await pinKey(pin, salt, true); } catch (e) { v3 = false; } }
  if (!v3) k = await pinKey(pin, salt, false);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(phrase)));
  const out = new Uint8Array(28 + ct.length); out.set(salt); out.set(iv, 16); out.set(ct, 28);
  return store.set('cw_pin', (v3 ? 'v3.' : 'v2.') + b64(out)) && store.set('cw_pinfail', '0') && store.set('cw_pintype', type === 'pw' ? 'pw' : 'pin');
}
async function pinOpen(pin) {
  const s = store.get('cw_pin'), ver = typeof s === 'string' && /^v[23]\./.test(s) ? s.slice(0, 2) : 'v1';
  let key;
  try { const raw = unb64(ver === 'v1' ? s : s.slice(3)); key = { raw, k: ver === 'v1' ? await deriveKey('pin:' + pin, raw.slice(0, 16)) : await pinKey(pin, raw.slice(0, 16), ver === 'v3') }; }
  catch (e) { if (ver === 'v3' && e && e.message === 'PEPPER') throw new Error('PEPPER'); if (ver !== 'v1') throw new Error('KDF'); return null; }
  try {
    const pt = dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: key.raw.slice(16, 28) }, key.k, key.raw.slice(28)));
    if (ver === 'v1' || (ver === 'v2' && hasPepper())) { try { const f = store.get('cw_pinfail'); await pinSeal(pt, pin, pinType()); store.set('cw_pinfail', f === null ? '0' : f); } catch (e) { /* yangilanmadi: eski format ishlayveradi */ } }
    return pt;
  } catch (e) { return null; }
}
""" + html[j:]
sub("catch (e) { $('#pin-go').disabled = false; $('#pin-go').removeAttribute('aria-busy'); return say('Qurilma xotirasi yetmadi. Maxfiy so\\'zlar bilan kiring.'); }",
    "catch (e) { $('#pin-go').disabled = false; $('#pin-go').removeAttribute('aria-busy'); return say(e && e.message === 'PEPPER' ? 'Bu PIN faqat o\\'rnatilgan Android ilovada ishlaydi. Maxfiy so\\'zlar bilan kiring.' : 'Qurilma xotirasi yetmadi. Maxfiy so\\'zlar bilan kiring.'); }", 'go-catch')
sub("const pinWipe = () => { store.del('cw_pin'); store.del('cw_pinfail'); store.del('cw_pintype'); };",
    "const pinWipe = () => { store.del('cw_pin'); store.del('cw_pinfail'); store.del('cw_pintype'); try { if (window.HamyonNative && window.HamyonNative.clearPepper) window.HamyonNative.clearPepper(); } catch (e) { /* kalit yo'q */ } };", 'pinwipe')
sub("PIN maxfiy so'zlarni Argon2id (64 MiB) + AES-GCM bilan shifrlab saqlaydi.", "PIN maxfiy so'zlarni Argon2id (64 MiB) + AES-GCM bilan shifrlab saqlaydi; Android ilovada kalit Keystore (chip) bilan ham bog'lanadi.", 'doc')
sub("Mening hamyonim · versiya 28", "Mening hamyonim · versiya 29", 'v1'); sub("Versiya 28. Ilova mustaqil", "Versiya 29. Ilova mustaqil", 'v2')
scripts = re.findall(r'<script>(.*?)</script>', html, re.S); assert len(scripts) == 2
hashes = ["'sha256-" + base64.b64encode(hashlib.sha256(x.encode('utf-8')).digest()).decode() + "'" for x in scripts]
old = re.search(r"script-src 'wasm-unsafe-eval' ((?:'sha256-[A-Za-z0-9+/=]+' ?)+);", html).group(0)
sub(old, "script-src 'wasm-unsafe-eval' " + ' '.join(hashes) + ";", 'csp')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
for f in os.listdir(SRC):
    if f != 'index.html' and not os.path.exists(os.path.join(OUT, f)):
        s = os.path.join(SRC, f); (shutil.copytree if os.path.isdir(s) else shutil.copy)(s, os.path.join(OUT, f))
print('OK', len(html), hashlib.sha256(html.encode()).hexdigest())
